/**
 * Vector Void Arcade Game Engine
 * Master game loop, entity simulation, physics & collision handling,
 * and high-performance HTML5 Canvas vector renderer.
 */

import {
  checkCircleCircleCollision,
  distanceSq,
  wrapCoordinate,
  clamp,
  Point2D,
} from './physics';
import {
  ASTEROID_CONFIG,
  SAUCER_CONFIG,
  getAsteroidSplit,
  getWaveParameters,
  calculateScore,
  updateComboState,
  isHighScore,
  insertHighScore,
  HighScoreRecord,
  AsteroidSize,
} from './rules';
import { sound } from './audio';
import { ParticleSystem } from './particles';
import { loadHighScores, saveHighScores } from './storage';
import {
  GameState,
  PlayerShip,
  AsteroidEntity,
  BulletEntity,
  SaucerEntity,
  PowerUpEntity,
  FloatingText,
  RunSummary,
} from './types';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animFrameId: number | null = null;
  private lastTime: number = 0;

  // Screen metrics
  public width: number = 1000;
  public height: number = 700;

  // Game state
  public state: GameState = 'title';
  public wave: number = 1;
  public score: number = 0;
  public highScore: number = 0;
  public comboMultiplier: number = 1;
  public timeSinceLastHit: number = 0;
  public comboProgress: number = 0;

  // Entities
  public player: PlayerShip;
  public asteroids: AsteroidEntity[] = [];
  public bullets: BulletEntity[] = [];
  public saucers: SaucerEntity[] = [];
  public powerups: PowerUpEntity[] = [];
  public floatingTexts: FloatingText[] = [];
  public particles: ParticleSystem;

  // Timers & FX
  private hitstopTimer: number = 0;
  private trauma: number = 0;
  private heartbeatTimer: number = 0;
  private saucerSpawnTimer: number = 18;
  private nextEntityId: number = 1;
  private isAttractMode: boolean = true;

  // Stats for run recap
  private runStats = {
    asteroidsDestroyed: 0,
    saucersDestroyed: 0,
    peakCombo: 1,
  };

  // High scores cache
  public highScores: HighScoreRecord[] = [];

  // Input states
  public keysHeld: Record<string, boolean> = {};
  public keysJustPressed: Record<string, boolean> = {};

  // Virtual touch controls states
  public touchInputs = {
    left: false,
    right: false,
    thrust: false,
    fire: false,
    hyperspace: false,
  };

  // Callback to sync UI state changes (throttled/state-level only, never 60fps)
  public onStateChange?: (state: GameState, summary?: RunSummary) => void;
  public onHudChange?: (data: {
    score: number;
    lives: number;
    shields: number;
    maxShields: number;
    wave: number;
    comboMultiplier: number;
    comboProgress: number;
    weapon: string;
    highScore: number;
  }) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Failed to get 2d context');
    this.ctx = context;

    this.particles = new ParticleSystem(750);
    this.highScores = loadHighScores();
    this.highScore = this.highScores.length > 0 ? this.highScores[0].score : 10000;

    this.player = this.createDefaultPlayer();
    this.resize();
    this.initAttractMode();
  }

  private createDefaultPlayer(): PlayerShip {
    return {
      x: this.width / 2,
      y: this.height / 2,
      vx: 0,
      vy: 0,
      angle: 0,
      rotationSpeed: 4.8,
      radius: 14,
      thrusting: false,
      lives: 3,
      shields: 100,
      maxShields: 100,
      invulnerableTimer: 2.5,
      fireCooldown: 0,
      weapon: 'standard',
      weaponTimer: 0,
      score: 0,
      accuracyStats: {
        shotsFired: 0,
        shotsHit: 0,
      },
    };
  }

  public resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);
  }

  public start() {
    if (!this.animFrameId) {
      this.lastTime = performance.now();
      this.animFrameId = requestAnimationFrame(this.loop.bind(this));
    }
  }

  public stop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    sound.stopAllLoops();
  }

  /**
   * Initializes Title screen "attract mode" with autonomous ship & drifting rocks
   */
  public initAttractMode() {
    this.state = 'title';
    this.isAttractMode = true;
    document.body.dataset.state = 'title';

    this.asteroids = [];
    this.bullets = [];
    this.saucers = [];
    this.powerups = [];
    this.floatingTexts = [];
    this.particles.reset();

    // Spawn decorative background asteroids
    for (let i = 0; i < 6; i++) {
      this.spawnAsteroid('large', false);
    }

    // Set autonomous player in center
    this.player = this.createDefaultPlayer();
    this.player.invulnerableTimer = 999999;
    this.onStateChange?.('title');
  }

  /**
   * Starts a real game run
   */
  public startNewGame() {
    this.state = 'playing';
    this.isAttractMode = false;
    document.body.dataset.state = 'playing';

    this.score = 0;
    this.wave = 1;
    this.comboMultiplier = 1;
    this.timeSinceLastHit = 0;
    this.comboProgress = 0;
    this.trauma = 0;
    this.hitstopTimer = 0;

    this.runStats = {
      asteroidsDestroyed: 0,
      saucersDestroyed: 0,
      peakCombo: 1,
    };

    this.player = this.createDefaultPlayer();
    this.asteroids = [];
    this.bullets = [];
    this.saucers = [];
    this.powerups = [];
    this.floatingTexts = [];
    this.particles.reset();

    this.spawnWave(1);
    sound.init();

    this.notifyHud();
    this.onStateChange?.('playing');
  }

  public setPaused(paused: boolean) {
    if (this.state !== 'playing' && this.state !== 'paused') return;
    this.state = paused ? 'paused' : 'playing';
    document.body.dataset.state = this.state;
    if (paused) {
      sound.stopAllLoops();
      this.render();
    }
    this.onStateChange?.(this.state);
  }

  public togglePause() {
    if (this.state === 'playing') {
      this.setPaused(true);
    } else if (this.state === 'paused') {
      this.setPaused(false);
    }
  }

  private spawnWave(waveNumber: number) {
    this.wave = waveNumber;
    const params = getWaveParameters(waveNumber);
    this.saucerSpawnTimer = params.saucerSpawnInterval;

    // Reposition player to center with temporary invulnerability shield
    this.player.x = this.width / 2;
    this.player.y = this.height / 2;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.invulnerableTimer = 3.0;

    this.addFloatingText(this.width / 2, this.height / 2 - 60, `WAVE ${waveNumber}`, '#38bdf8', 2.0);

    for (let i = 0; i < params.asteroidCount; i++) {
      this.spawnAsteroid('large', true);
    }
  }

  private spawnAsteroid(
    size: AsteroidSize,
    safeFromCenter = true,
    spawnX?: number,
    spawnY?: number,
    speedMultiplier = 1.0
  ) {
    const config = ASTEROID_CONFIG[size];
    let x = spawnX ?? 0;
    let y = spawnY ?? 0;

    if (spawnX === undefined || spawnY === undefined) {
      // Pick random location around screen edges
      if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? 20 : this.width - 20;
        y = Math.random() * this.height;
      } else {
        x = Math.random() * this.width;
        y = Math.random() < 0.5 ? 20 : this.height - 20;
      }

      if (safeFromCenter) {
        // Ensure not spawned directly on center player
        const distCenter = Math.hypot(x - this.width / 2, y - this.height / 2);
        if (distCenter < 140) {
          x = (x + 200) % this.width;
        }
      }
    }

    const angle = Math.random() * Math.PI * 2;
    const speed = config.baseSpeed * (0.8 + Math.random() * 0.4) * speedMultiplier;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    // Generate jagged vector vertices for classic arcade rock silhouette
    const vertexCount = 10 + Math.floor(Math.random() * 4);
    const vertices: Point2D[] = [];
    for (let i = 0; i < vertexCount; i++) {
      const a = (i / vertexCount) * Math.PI * 2;
      const rOffset = 0.75 + Math.random() * 0.45;
      vertices.push({
        x: Math.cos(a) * config.radius * rOffset,
        y: Math.sin(a) * config.radius * rOffset,
      });
    }

    const colors = ['#22d3ee', '#38bdf8', '#818cf8', '#a78bfa'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    this.asteroids.push({
      id: this.nextEntityId++,
      x,
      y,
      vx,
      vy,
      angle: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 1.5,
      size,
      radius: config.radius,
      points: config.points,
      vertices,
      color,
      glowColor: color,
    });
  }

  private spawnSaucer(isSmall: boolean) {
    const fromLeft = Math.random() < 0.5;
    const x = fromLeft ? 0 : this.width;
    const y = 80 + Math.random() * (this.height - 160);
    const config = isSmall ? SAUCER_CONFIG.small : SAUCER_CONFIG.big;
    const vx = (fromLeft ? 1 : -1) * config.speed;

    this.saucers.push({
      id: this.nextEntityId++,
      x,
      y,
      vx,
      vy: 0,
      size: isSmall ? 'small' : 'big',
      radius: config.radius,
      points: config.points,
      fireTimer: 1.0,
      directionChangeTimer: 1.5,
      color: isSmall ? '#f43f5e' : '#fb923c',
    });

    sound.setSaucerWarble(true, isSmall);
  }

  public fireBullet(fromPlayer = true, customAngle?: number) {
    const angle = customAngle !== undefined ? customAngle : this.player.angle;
    const speed = 620;
    // Gun muzzle offset at tip of ship
    const muzzleDist = this.player.radius + 4;
    const x = this.player.x + Math.sin(angle) * muzzleDist;
    const y = this.player.y - Math.cos(angle) * muzzleDist;

    const vx = this.player.vx * 0.3 + Math.sin(angle) * speed;
    const vy = this.player.vy * 0.3 - Math.cos(angle) * speed;

    this.bullets.push({
      id: this.nextEntityId++,
      x,
      y,
      vx,
      vy,
      radius: 3,
      life: 1.1,
      maxLife: 1.1,
      fromPlayer,
      color: this.player.weapon === 'spread' ? '#f59e0b' : '#38bdf8',
      damage: 1,
    });

    if (fromPlayer) {
      this.player.accuracyStats.shotsFired++;
    }
  }

  public triggerHyperspace() {
    if (this.state !== 'playing' || this.isAttractMode) return;
    this.particles.emitHyperspace(this.player.x, this.player.y);
    sound.playHyperspace();

    // Teleport to random spot with safety buffer
    this.player.x = 60 + Math.random() * (this.width - 120);
    this.player.y = 60 + Math.random() * (this.height - 120);
    this.player.vx *= 0.2;
    this.player.vy *= 0.2;
    this.player.invulnerableTimer = 1.2;

    this.particles.emitHyperspace(this.player.x, this.player.y);
    this.addFloatingText(this.player.x, this.player.y - 20, 'HYPERSPACE', '#c084fc', 1.0);
  }

  public triggerEMP() {
    this.trauma = Math.min(1.0, this.trauma + 0.6);
    this.particles.emitShockwave(this.player.x, this.player.y, Math.max(this.width, this.height), '#06b6d4');
    sound.playExplosion('large');

    // Vaporize small asteroids and damage larger ones
    const toShatter = [...this.asteroids];
    toShatter.forEach((ast) => {
      this.destroyAsteroid(ast, false);
    });

    // Destroy saucers
    this.saucers.forEach((saucer) => {
      this.destroySaucer(saucer);
    });

    this.addFloatingText(this.player.x, this.player.y - 30, 'EMP DETONATION!', '#38bdf8', 1.5);
  }

  private addFloatingText(x: number, y: number, text: string, color = '#22d3ee', maxLife = 1.2, scale = 1.0) {
    this.floatingTexts.push({
      id: this.nextEntityId++,
      x,
      y,
      text,
      color,
      life: maxLife,
      maxLife,
      vy: -35,
      scale,
    });
  }

  /**
   * Master Game Loop
   */
  private loop(currentTime: number) {
    const rawDt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // When paused, freeze animation loop to avoid burning CPU and keep DOM stable
    if (this.state === 'paused') {
      this.animFrameId = requestAnimationFrame(this.loop.bind(this));
      return;
    }

    // Clamped dt to prevent tunneling on frame lag or tab switch
    const dt = Math.min(rawDt, 0.05);

    if (this.state === 'playing' || this.isAttractMode) {
      if (this.hitstopTimer > 0) {
        // Hitstop freeze frame: tick only camera shake and visual effects
        this.hitstopTimer -= dt;
      } else {
        this.updateSimulation(dt);
      }
    }

    // Camera trauma decay
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - dt * 1.4);
    }

    this.render();
    this.animFrameId = requestAnimationFrame(this.loop.bind(this));
  }

  private updateSimulation(dt: number) {
    this.updatePlayer(dt);
    this.updateAsteroids(dt);
    this.updateBullets(dt);
    this.updateSaucers(dt);
    this.updatePowerups(dt);
    this.updateFloatingTexts(dt);
    this.particles.update(dt, this.width, this.height);

    // Combo timer decay
    if (this.comboMultiplier > 1) {
      this.timeSinceLastHit += dt;
      const comboState = updateComboState(this.comboMultiplier, this.timeSinceLastHit);
      this.comboMultiplier = comboState.multiplier;
      this.comboProgress = comboState.progressRatio;
    } else {
      this.comboProgress = 0;
    }

    // Check collisions
    this.checkCollisions();

    // Heartbeat audio pacing
    if (this.state === 'playing' && !this.isAttractMode) {
      this.heartbeatTimer += dt;
      // Faster heartbeat as fewer asteroids remain
      const rockRatio = Math.max(0.2, this.asteroids.length / 10);
      const heartbeatInterval = 0.4 + rockRatio * 0.9;
      if (this.heartbeatTimer >= heartbeatInterval) {
        this.heartbeatTimer = 0;
        sound.playHeartbeat();
      }

      // Saucer spawn timer
      this.saucerSpawnTimer -= dt;
      if (this.saucerSpawnTimer <= 0 && this.saucers.length === 0) {
        const params = getWaveParameters(this.wave);
        const isSmall = Math.random() < params.smallSaucerChance;
        this.spawnSaucer(isSmall);
        this.saucerSpawnTimer = params.saucerSpawnInterval;
      }

      // Check wave clear
      if (this.asteroids.length === 0 && this.saucers.length === 0) {
        this.spawnWave(this.wave + 1);
        this.notifyHud();
      }
    }
  }

  private updatePlayer(dt: number) {
    const p = this.player;

    if (this.isAttractMode) {
      // Autonomous attract AI: gently steer and shoot nearest asteroid
      if (this.asteroids.length > 0) {
        const target = this.asteroids[0];
        const targetAngle = Math.atan2(target.x - p.x, -(target.y - p.y));
        const diff = targetAngle - p.angle;
        p.angle += clamp(diff, -3, 3) * dt;

        // Mild thrust
        p.vx += Math.sin(p.angle) * 70 * dt;
        p.vy -= Math.cos(p.angle) * 70 * dt;

        p.fireCooldown -= dt;
        if (p.fireCooldown <= 0 && Math.abs(diff) < 0.4) {
          this.fireBullet(true);
          p.fireCooldown = 0.45;
        }
      }
    } else {
      // User input handling
      const rotateLeft =
        this.keysHeld['ArrowLeft'] ||
        this.keysHeld['KeyA'] ||
        this.touchInputs.left;
      const rotateRight =
        this.keysHeld['ArrowRight'] ||
        this.keysHeld['KeyD'] ||
        this.touchInputs.right;
      const thrust =
        this.keysHeld['ArrowUp'] ||
        this.keysHeld['KeyW'] ||
        this.touchInputs.thrust;
      const fire =
        this.keysHeld['Space'] ||
        this.keysHeld['KeyJ'] ||
        this.touchInputs.fire;

      // Handle Hyperspace edge trigger
      if (
        this.keysJustPressed['ArrowDown'] ||
        this.keysJustPressed['KeyS'] ||
        this.keysJustPressed['KeyK'] ||
        this.touchInputs.hyperspace
      ) {
        this.touchInputs.hyperspace = false;
        this.triggerHyperspace();
      }

      // Rotation
      if (rotateLeft) p.angle -= p.rotationSpeed * dt;
      if (rotateRight) p.angle += p.rotationSpeed * dt;

      // Thrust
      p.thrusting = thrust;
      sound.setThrust(thrust);

      if (thrust) {
        const thrustForce = 340;
        p.vx += Math.sin(p.angle) * thrustForce * dt;
        p.vy -= Math.cos(p.angle) * thrustForce * dt;

        // Emit thruster particles
        const shipSpeed = Math.hypot(p.vx, p.vy);
        const rearX = p.x - Math.sin(p.angle) * p.radius;
        const rearY = p.y + Math.cos(p.angle) * p.radius;
        this.particles.emitThruster(rearX, rearY, p.angle, shipSpeed);
      }

      // Weapons and firing
      p.fireCooldown -= dt;
      if (p.weaponTimer > 0) {
        p.weaponTimer -= dt;
        if (p.weaponTimer <= 0) {
          p.weapon = 'standard';
          this.addFloatingText(p.x, p.y - 20, 'STANDARD WEAPON', '#94a3b8', 1.0);
          this.notifyHud();
        }
      }

      if (fire && p.fireCooldown <= 0) {
        if (p.weapon === 'spread') {
          this.fireBullet(true, p.angle - 0.22);
          this.fireBullet(true, p.angle);
          this.fireBullet(true, p.angle + 0.22);
          p.fireCooldown = 0.24;
          sound.playLaser('spread');
        } else if (p.weapon === 'rapid') {
          this.fireBullet(true, p.angle + (Math.random() - 0.5) * 0.08);
          p.fireCooldown = 0.1;
          sound.playLaser('rapid');
        } else {
          this.fireBullet(true, p.angle);
          p.fireCooldown = 0.18;
          sound.playLaser('standard');
        }
      }
    }

    // Drag / inertia friction
    p.vx *= Math.pow(0.985, dt * 60);
    p.vy *= Math.pow(0.985, dt * 60);

    // Max speed cap
    const maxSpeed = 480;
    const currentSpeed = Math.hypot(p.vx, p.vy);
    if (currentSpeed > maxSpeed) {
      p.vx = (p.vx / currentSpeed) * maxSpeed;
      p.vy = (p.vy / currentSpeed) * maxSpeed;
    }

    // Integrate position
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Toroidal screen wrapping
    p.x = wrapCoordinate(p.x, this.width, p.radius);
    p.y = wrapCoordinate(p.y, this.height, p.radius);

    // Invulnerability timer
    if (p.invulnerableTimer > 0) {
      p.invulnerableTimer -= dt;
    }

    // Reset single-frame keys
    this.keysJustPressed = {};
  }

  private updateAsteroids(dt: number) {
    for (let i = 0; i < this.asteroids.length; i++) {
      const ast = this.asteroids[i];
      ast.x += ast.vx * dt;
      ast.y += ast.vy * dt;
      ast.angle += ast.rotationSpeed * dt;

      ast.x = wrapCoordinate(ast.x, this.width, ast.radius);
      ast.y = wrapCoordinate(ast.y, this.height, ast.radius);
    }
  }

  private updateBullets(dt: number) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.life -= dt;
      if (b.life <= 0) {
        this.bullets.splice(i, 1);
        continue;
      }

      b.x += b.vx * dt;
      b.y += b.vy * dt;

      b.x = wrapCoordinate(b.x, this.width, b.radius);
      b.y = wrapCoordinate(b.y, this.height, b.radius);
    }
  }

  private updateSaucers(dt: number) {
    for (let i = this.saucers.length - 1; i >= 0; i--) {
      const s = this.saucers[i];
      s.x += s.vx * dt;

      // Slight sinusoidal bobbing
      s.y += Math.sin(s.x * 0.02) * 40 * dt;

      // Random vertical direction change
      s.directionChangeTimer -= dt;
      if (s.directionChangeTimer <= 0) {
        s.directionChangeTimer = 1.0 + Math.random() * 1.5;
        s.vy = (Math.random() - 0.5) * 80;
      }
      s.y += s.vy * dt;
      s.y = clamp(s.y, 40, this.height - 40);

      // Saucer firing at player
      s.fireTimer -= dt;
      if (s.fireTimer <= 0) {
        const config = s.size === 'small' ? SAUCER_CONFIG.small : SAUCER_CONFIG.big;
        s.fireTimer = config.fireInterval * (0.8 + Math.random() * 0.4);

        // Aim calculation: small saucers lead player target!
        let aimAngle = Math.atan2(this.player.y - s.y, this.player.x - s.x);
        if (s.size === 'small') {
          // Predictive aim
          const dist = Math.hypot(this.player.x - s.x, this.player.y - s.y);
          const bulletSpeed = 380;
          const leadTime = dist / bulletSpeed;
          const predictedX = this.player.x + this.player.vx * leadTime;
          const predictedY = this.player.y + this.player.vy * leadTime;
          aimAngle = Math.atan2(predictedY - s.y, predictedX - s.x);
        } else {
          // Loose inaccurate aim
          aimAngle += (Math.random() - 0.5) * 0.7;
        }

        const bSpeed = 380;
        this.bullets.push({
          id: this.nextEntityId++,
          x: s.x,
          y: s.y,
          vx: Math.cos(aimAngle) * bSpeed,
          vy: Math.sin(aimAngle) * bSpeed,
          radius: 3,
          life: 1.5,
          maxLife: 1.5,
          fromPlayer: false,
          color: '#fb7185',
          damage: 1,
        });

        sound.playLaser('spread');
      }

      // Check if saucer exited screen
      if (s.x < -40 || s.x > this.width + 40) {
        this.saucers.splice(i, 1);
        if (this.saucers.length === 0) {
          sound.setSaucerWarble(false);
        }
      }
    }
  }

  private updatePowerups(dt: number) {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.powerups.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.angle += 2.5 * dt;

      p.x = wrapCoordinate(p.x, this.width, p.radius);
      p.y = wrapCoordinate(p.y, this.height, p.radius);
    }
  }

  private updateFloatingTexts(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.y += ft.vy * dt;
    }
  }

  /**
   * Collision Detection Logic
   */
  private checkCollisions() {
    // 1. Bullets vs Asteroids
    for (let bIdx = this.bullets.length - 1; bIdx >= 0; bIdx--) {
      const bullet = this.bullets[bIdx];
      if (!bullet.fromPlayer) continue;

      for (let aIdx = this.asteroids.length - 1; aIdx >= 0; aIdx--) {
        const ast = this.asteroids[aIdx];
        if (checkCircleCircleCollision(bullet, ast)) {
          // Hit detected!
          this.destroyAsteroid(ast, true);
          this.bullets.splice(bIdx, 1);
          this.player.accuracyStats.shotsHit++;
          break;
        }
      }
    }

    // 2. Bullets vs Saucers
    for (let bIdx = this.bullets.length - 1; bIdx >= 0; bIdx--) {
      const bullet = this.bullets[bIdx];
      if (!bullet.fromPlayer) continue;

      for (let sIdx = this.saucers.length - 1; sIdx >= 0; sIdx--) {
        const saucer = this.saucers[sIdx];
        if (checkCircleCircleCollision(bullet, saucer)) {
          this.destroySaucer(saucer);
          this.bullets.splice(bIdx, 1);
          this.player.accuracyStats.shotsHit++;
          break;
        }
      }
    }

    // 3. Player vs PowerUps
    for (let pIdx = this.powerups.length - 1; pIdx >= 0; pIdx--) {
      const p = this.powerups[pIdx];
      if (checkCircleCircleCollision(this.player, p)) {
        this.collectPowerup(p);
        this.powerups.splice(pIdx, 1);
      }
    }

    // 4. Enemy Bullets vs Player
    if (this.player.invulnerableTimer <= 0 && !this.isAttractMode) {
      for (let bIdx = this.bullets.length - 1; bIdx >= 0; bIdx--) {
        const bullet = this.bullets[bIdx];
        if (bullet.fromPlayer) continue;

        if (checkCircleCircleCollision(bullet, this.player)) {
          this.bullets.splice(bIdx, 1);
          this.damagePlayer(35);
          break;
        }
      }
    }

    // 5. Player vs Asteroids
    if (this.player.invulnerableTimer <= 0 && !this.isAttractMode) {
      for (let aIdx = 0; aIdx < this.asteroids.length; aIdx++) {
        const ast = this.asteroids[aIdx];
        if (checkCircleCircleCollision(this.player, ast)) {
          this.damagePlayer(45);
          this.destroyAsteroid(ast, false);
          break;
        }
      }
    }

    // 6. Player vs Saucers
    if (this.player.invulnerableTimer <= 0 && !this.isAttractMode) {
      for (let sIdx = 0; sIdx < this.saucers.length; sIdx++) {
        const saucer = this.saucers[sIdx];
        if (checkCircleCircleCollision(this.player, saucer)) {
          this.damagePlayer(50);
          this.destroySaucer(saucer);
          break;
        }
      }
    }
  }

  private destroyAsteroid(ast: AsteroidEntity, byPlayerBullet: boolean) {
    const idx = this.asteroids.indexOf(ast);
    if (idx !== -1) {
      this.asteroids.splice(idx, 1);
    }

    // Sound and particle juice
    sound.playExplosion(ast.size);
    this.particles.emitAsteroidShatter(ast.x, ast.y, ast.radius, ast.color);
    this.trauma = Math.min(1.0, this.trauma + (ast.size === 'large' ? 0.35 : 0.2));
    this.hitstopTimer = 0.04;

    if (byPlayerBullet) {
      this.runStats.asteroidsDestroyed++;
      // Combo increment
      this.comboMultiplier = Math.min(5, this.comboMultiplier + 1);
      this.timeSinceLastHit = 0;
      this.runStats.peakCombo = Math.max(this.runStats.peakCombo, this.comboMultiplier);

      const pts = calculateScore(ast.points, this.comboMultiplier);
      this.score += pts;
      if (this.score > this.highScore) {
        this.highScore = this.score;
      }

      const comboText = this.comboMultiplier > 1 ? ` +${pts} (x${this.comboMultiplier})` : ` +${pts}`;
      this.addFloatingText(ast.x, ast.y, comboText, ast.color, 1.1);

      // Power-up drop chance (10% from large/medium asteroids)
      if (Math.random() < 0.12 && ast.size !== 'small') {
        this.spawnPowerup(ast.x, ast.y);
      }
    }

    // Split into children
    const split = getAsteroidSplit(ast.size);
    if (split.nextSize) {
      for (let i = 0; i < split.count; i++) {
        // Diverge child trajectories
        const devAngle = (i === 0 ? 1 : -1) * (0.4 + Math.random() * 0.4);
        const childVx = Math.cos(devAngle) * ast.vx - Math.sin(devAngle) * ast.vy;
        const childVy = Math.sin(devAngle) * ast.vx + Math.cos(devAngle) * ast.vy;

        this.spawnAsteroid(split.nextSize, false, ast.x, ast.y, split.speedMultiplier);
        const child = this.asteroids[this.asteroids.length - 1];
        if (child) {
          child.vx = childVx * split.speedMultiplier;
          child.vy = childVy * split.speedMultiplier;
        }
      }
    }

    this.notifyHud();
  }

  private destroySaucer(saucer: SaucerEntity) {
    const idx = this.saucers.indexOf(saucer);
    if (idx !== -1) {
      this.saucers.splice(idx, 1);
    }

    sound.playExplosion(saucer.size === 'big' ? 'large' : 'medium');
    this.particles.emitExplosion(saucer.x, saucer.y, 28, saucer.color, 1.4);
    this.particles.emitShockwave(saucer.x, saucer.y, 50, saucer.color);
    this.trauma = Math.min(1.0, this.trauma + 0.4);

    this.runStats.saucersDestroyed++;
    this.comboMultiplier = Math.min(5, this.comboMultiplier + 1);
    this.timeSinceLastHit = 0;

    const pts = calculateScore(saucer.points, this.comboMultiplier);
    this.score += pts;
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }

    this.addFloatingText(saucer.x, saucer.y, `SAUCER +${pts}`, saucer.color, 1.3);

    // High chance of dropping powerup
    this.spawnPowerup(saucer.x, saucer.y);

    if (this.saucers.length === 0) {
      sound.setSaucerWarble(false);
    }
    this.notifyHud();
  }

  private spawnPowerup(x: number, y: number) {
    const types: PowerUpEntity['type'][] = ['shield', 'spread', 'rapid', 'emp'];
    const type = types[Math.floor(Math.random() * types.length)];
    this.powerups.push({
      id: this.nextEntityId++,
      x,
      y,
      vx: (Math.random() - 0.5) * 35,
      vy: (Math.random() - 0.5) * 35,
      type,
      radius: 12,
      life: 9.0, // 9 seconds to collect
      angle: 0,
    });
  }

  private collectPowerup(p: PowerUpEntity) {
    sound.playPowerup();
    this.particles.emitShockwave(p.x, p.y, 35, '#38bdf8');

    if (p.type === 'shield') {
      this.player.shields = this.player.maxShields;
      this.addFloatingText(this.player.x, this.player.y - 25, 'SHIELD RESTORED', '#10b981', 1.2);
    } else if (p.type === 'spread') {
      this.player.weapon = 'spread';
      this.player.weaponTimer = 12.0;
      this.addFloatingText(this.player.x, this.player.y - 25, 'TRIPLE SPREAD LASER', '#f59e0b', 1.2);
    } else if (p.type === 'rapid') {
      this.player.weapon = 'rapid';
      this.player.weaponTimer = 12.0;
      this.addFloatingText(this.player.x, this.player.y - 25, 'RAPID VULCAN', '#06b6d4', 1.2);
    } else if (p.type === 'emp') {
      this.triggerEMP();
    }

    this.notifyHud();
  }

  private damagePlayer(amount: number) {
    this.trauma = Math.min(1.0, this.trauma + 0.5);
    this.hitstopTimer = 0.06;

    if (this.player.shields > 0) {
      this.player.shields = Math.max(0, this.player.shields - amount);
      sound.playExplosion('small');
      this.particles.emitShockwave(this.player.x, this.player.y, 30, '#06b6d4');
      this.notifyHud();
      return;
    }

    // Ship destroyed: lose a life
    this.player.lives--;
    sound.playExplosion('player');
    this.particles.emitExplosion(this.player.x, this.player.y, 40, '#f43f5e', 1.8);
    this.particles.emitShockwave(this.player.x, this.player.y, 70, '#f43f5e');

    if (this.player.lives <= 0) {
      this.triggerGameOver();
    } else {
      // Respawn player at center
      this.player.x = this.width / 2;
      this.player.y = this.height / 2;
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.shields = this.player.maxShields;
      this.player.invulnerableTimer = 3.0;
      this.addFloatingText(this.player.x, this.player.y - 30, 'SHIP REBUILT', '#38bdf8', 1.2);
      this.notifyHud();
    }
  }

  private triggerGameOver() {
    this.state = 'gameover';
    document.body.dataset.state = 'gameover';
    sound.stopAllLoops();

    const accuracy =
      this.player.accuracyStats.shotsFired > 0
        ? Math.round(
            (this.player.accuracyStats.shotsHit / this.player.accuracyStats.shotsFired) * 100
          )
        : 0;

    const summary: RunSummary = {
      score: this.score,
      wave: this.wave,
      asteroidsDestroyed: this.runStats.asteroidsDestroyed,
      saucersDestroyed: this.runStats.saucersDestroyed,
      accuracy,
      peakCombo: this.runStats.peakCombo,
      isNewHigh: isHighScore(this.score, this.highScores),
    };

    this.onStateChange?.('gameover', summary);
  }

  public submitHighScore(initials: string) {
    const cleanInitials = (initials || 'AAA').toUpperCase().slice(0, 3);
    const newRecord: HighScoreRecord = {
      initials: cleanInitials,
      score: this.score,
      wave: this.wave,
      date: new Date().toISOString().slice(0, 10),
    };

    this.highScores = insertHighScore(newRecord, this.highScores);
    saveHighScores(this.highScores);
    this.highScore = this.highScores[0].score;
    this.notifyHud();
  }

  private notifyHud() {
    this.onHudChange?.({
      score: this.score,
      lives: this.player.lives,
      shields: this.player.shields,
      maxShields: this.player.maxShields,
      wave: this.wave,
      comboMultiplier: this.comboMultiplier,
      comboProgress: this.comboProgress,
      weapon: this.player.weapon,
      highScore: this.highScore,
    });
  }

  /**
   * Vector Drawing Utilities
   */
  private render() {
    const ctx = this.ctx;
    ctx.save();

    // Apply Camera Shake via Trauma
    if (this.trauma > 0) {
      const shakeMag = this.trauma * this.trauma * 16;
      const offsetX = (Math.random() - 0.5) * shakeMag;
      const offsetY = (Math.random() - 0.5) * shakeMag;
      const rot = (Math.random() - 0.5) * this.trauma * 0.04;
      ctx.translate(this.width / 2 + offsetX, this.height / 2 + offsetY);
      ctx.rotate(rot);
      ctx.translate(-this.width / 2, -this.height / 2);
    }

    // Clear background
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle Vector Grid stars
    this.renderStarfield(ctx);

    // Draw Particles behind entities
    this.particles.render(ctx);

    // Draw PowerUps
    this.renderPowerups(ctx);

    // Draw Asteroids
    this.renderAsteroids(ctx);

    // Draw Saucers
    this.renderSaucers(ctx);

    // Draw Bullets
    this.renderBullets(ctx);

    // Draw Player Ship
    if (this.state === 'playing' || this.isAttractMode) {
      this.renderPlayer(ctx);
    }

    // Draw Floating Texts
    this.renderFloatingTexts(ctx);

    ctx.restore();
  }

  private renderStarfield(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    // Fixed deterministic pseudo-stars
    for (let i = 0; i < 45; i++) {
      const sx = ((i * 173) % this.width);
      const sy = ((i * 269) % this.height);
      const size = (i % 3 === 0) ? 1.5 : 1.0;
      ctx.fillRect(sx, sy, size, size);
    }
  }

  private renderPlayer(ctx: CanvasRenderingContext2D) {
    const p = this.player;

    // Flickering during invulnerability
    if (p.invulnerableTimer > 0 && Math.floor(performance.now() / 80) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);

    // Shield bubble
    if (p.shields > 0) {
      const shieldRatio = p.shields / p.maxShields;
      ctx.strokeStyle = `rgba(6, 182, 212, ${0.3 + shieldRatio * 0.4})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Classic triangular vector ship
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    // Nose
    ctx.moveTo(0, -p.radius);
    // Right wing
    ctx.lineTo(p.radius * 0.75, p.radius * 0.85);
    // Center indentation
    ctx.lineTo(0, p.radius * 0.5);
    // Left wing
    ctx.lineTo(-p.radius * 0.75, p.radius * 0.85);
    ctx.closePath();
    ctx.stroke();

    // Weapon colored cockpit dot
    const weaponColor =
      p.weapon === 'spread' ? '#f59e0b' : p.weapon === 'rapid' ? '#06b6d4' : '#38bdf8';
    ctx.fillStyle = weaponColor;
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Thruster flame when thrusting
    if (p.thrusting) {
      ctx.strokeStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(-p.radius * 0.4, p.radius * 0.65);
      const flameLen = p.radius + (Math.random() * 8 + 4);
      ctx.lineTo(0, flameLen);
      ctx.lineTo(p.radius * 0.4, p.radius * 0.65);
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderAsteroids(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (let i = 0; i < this.asteroids.length; i++) {
      const ast = this.asteroids[i];
      ctx.save();
      ctx.translate(ast.x, ast.y);
      ctx.rotate(ast.angle);

      ctx.strokeStyle = ast.color;
      ctx.lineWidth = 1.8;
      ctx.beginPath();

      const verts = ast.vertices;
      if (verts.length > 0) {
        ctx.moveTo(verts[0].x, verts[0].y);
        for (let v = 1; v < verts.length; v++) {
          ctx.lineTo(verts[v].x, verts[v].y);
        }
        ctx.closePath();
      }
      ctx.stroke();

      ctx.restore();
    }
    ctx.restore();
  }

  private renderSaucers(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (let i = 0; i < this.saucers.length; i++) {
      const s = this.saucers[i];
      ctx.save();
      ctx.translate(s.x, s.y);

      ctx.strokeStyle = s.color;
      ctx.lineWidth = 1.8;

      const r = s.radius;

      // Classic saucer silhouette: top dome + middle ellipse + bottom base
      ctx.beginPath();
      // Dome
      ctx.arc(0, -r * 0.35, r * 0.5, Math.PI, 0);
      // Main body rim
      ctx.moveTo(-r, 0);
      ctx.lineTo(r, 0);
      ctx.lineTo(r * 0.5, r * 0.5);
      ctx.lineTo(-r * 0.5, r * 0.5);
      ctx.closePath();
      ctx.stroke();

      // Saucer vector cockpit ring
      ctx.beginPath();
      ctx.arc(0, -r * 0.35, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.restore();
    }
    ctx.restore();
  }

  private renderBullets(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (let i = 0; i < this.bullets.length; i++) {
      const b = this.bullets[i];
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // Streak tail
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - b.vx * 0.025, b.y - b.vy * 0.025);
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderPowerups(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (let i = 0; i < this.powerups.length; i++) {
      const p = this.powerups[i];
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      // Rotating diamond icon
      let color = '#38bdf8';
      let symbol = 'S';
      if (p.type === 'shield') {
        color = '#10b981';
        symbol = 'SH';
      } else if (p.type === 'spread') {
        color = '#f59e0b';
        symbol = '3X';
      } else if (p.type === 'rapid') {
        color = '#06b6d4';
        symbol = 'RP';
      } else if (p.type === 'emp') {
        color = '#a855f7';
        symbol = 'EMP';
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, -p.radius);
      ctx.lineTo(p.radius, 0);
      ctx.lineTo(0, p.radius);
      ctx.lineTo(-p.radius, 0);
      ctx.closePath();
      ctx.stroke();

      // Text label inside
      ctx.fillStyle = '#ffffff';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(symbol, 0, 0);

      ctx.restore();
    }
    ctx.restore();
  }

  private renderFloatingTexts(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      const alpha = Math.max(0, ft.life / ft.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 12px "Share Tech Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.restore();
  }
}
