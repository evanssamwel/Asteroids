/**
 * Zero-GC Pooled Particle System
 * Uses a pre-allocated ring buffer to ensure silky-smooth 60fps without GC pauses.
 */

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  shape: 'dot' | 'line' | 'ring' | 'shard';
  angle: number;
  rotSpeed: number;
}

export class ParticleSystem {
  private pool: Particle[];
  private capacity: number;
  private head: number = 0;

  constructor(capacity = 950) {
    this.capacity = capacity;
    this.pool = new Array(capacity);
    for (let i = 0; i < capacity; i++) {
      this.pool[i] = {
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        size: 2,
        color: '#06b6d4',
        shape: 'dot',
        angle: 0,
        rotSpeed: 0,
      };
    }
  }

  private spawn(
    x: number,
    y: number,
    vx: number,
    vy: number,
    life: number,
    size: number,
    color: string,
    shape: 'dot' | 'line' | 'ring' | 'shard' = 'dot',
    rotSpeed = 0
  ) {
    const p = this.pool[this.head];
    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.life = life;
    p.maxLife = life;
    p.size = size;
    p.color = color;
    p.shape = shape;
    p.angle = Math.random() * Math.PI * 2;
    p.rotSpeed = rotSpeed;

    this.head = (this.head + 1) % this.capacity;
  }

  public emitThruster(x: number, y: number, shipAngle: number, shipSpeed: number) {
    // Jet exhaust emerges from the rear of the ship (opposite shipAngle)
    const rearAngle = shipAngle + Math.PI;
    const spread = (Math.random() - 0.5) * 0.5;
    const finalAngle = rearAngle + spread;
    const speed = 120 + Math.random() * 90 + shipSpeed * 0.4;
    const vx = Math.sin(finalAngle) * speed;
    const vy = -Math.cos(finalAngle) * speed;

    const colors = ['#f59e0b', '#ef4444', '#fbbf24', '#06b6d4'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const life = 0.2 + Math.random() * 0.25;

    this.spawn(x, y, vx, vy, life, 2 + Math.random() * 2, color, 'line');
  }

  public emitExplosion(x: number, y: number, count = 18, color = '#06b6d4', speedMult = 1.0) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (60 + Math.random() * 180) * speedMult;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const life = 0.35 + Math.random() * 0.45;
      const size = 1.5 + Math.random() * 3.5;
      const shape = Math.random() > 0.4 ? 'line' : 'shard';

      this.spawn(x, y, vx, vy, life, size, color, shape, (Math.random() - 0.5) * 8);
    }
  }

  /**
   * Colorful Particle Explosion Effect triggered when an asteroid is destroyed by player fire.
   * Emits a brilliant spectrum of neon sparks, high-velocity streak lines, tumbling vector shards,
   * and concentric expanding shockwave rings, all governed by the game's physics loop and fading out smoothly.
   */
  public emitColorfulAsteroidExplosion(
    x: number,
    y: number,
    radius: number,
    baseColor = '#38bdf8',
    comboMultiplier = 1
  ) {
    // Saturated multi-chromatic neon spectrum
    const neonSpectrum = [
      '#06b6d4', // Cyan
      '#22d3ee', // Bright Cyan
      '#f43f5e', // Hot Pink / Rose
      '#ec4899', // Electric Magenta
      '#fbbf24', // Amber Gold
      '#f59e0b', // Sunset Orange
      '#10b981', // Emerald
      '#34d399', // Mint
      '#a855f7', // Vivid Purple
      '#c084fc', // Neon Violet
      '#ffffff', // Superheated White Core
    ];

    // Scale particle count with asteroid size and combo level
    const count = Math.min(60, Math.max(26, Math.floor(radius * 0.85) + comboMultiplier * 4));
    const speedScale = 1.0 + Math.min(0.5, (comboMultiplier - 1) * 0.12);

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
      // Varied velocities: fast outward streaks, medium tumbling shards, slow glowing embers
      const speed = (50 + Math.random() * 220) * speedScale;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      // Color from vibrant neon spectrum with bias towards asteroid's own neon hue
      const color =
        Math.random() < 0.25
          ? baseColor
          : neonSpectrum[Math.floor(Math.random() * neonSpectrum.length)];

      const life = 0.45 + Math.random() * 0.55;
      const size = 1.5 + Math.random() * 4.0;

      // Mix particle shapes for rich visual depth
      const roll = Math.random();
      let shape: 'dot' | 'line' | 'shard' = 'dot';
      if (roll < 0.45) {
        shape = 'line'; // Fast streak line pointing along trajectory
      } else if (roll < 0.8) {
        shape = 'shard'; // Tumbling polygonal fragment
      }

      this.spawn(x, y, vx, vy, life, size, color, shape, (Math.random() - 0.5) * 10);
    }

    // Glowing expanding shockwave rings
    this.emitShockwave(x, y, Math.max(30, radius * 1.5), baseColor);
    if (radius >= 30) {
      // Secondary chromatic shockwave for large asteroids
      const secondaryColor = neonSpectrum[Math.floor(Math.random() * neonSpectrum.length)];
      this.emitShockwave(x, y, radius * 1.9, secondaryColor);
    }
  }

  public emitAsteroidShatter(x: number, y: number, radius: number, color = '#38bdf8') {
    const count = Math.min(32, Math.floor(radius * 0.9));
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 40 + Math.random() * 140;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const life = 0.4 + Math.random() * 0.5;
      const size = 2 + Math.random() * 4;

      this.spawn(x, y, vx, vy, life, size, color, 'shard', (Math.random() - 0.5) * 6);
    }
  }

  public emitShockwave(x: number, y: number, maxRadius = 40, color = '#22d3ee') {
    // A ring particle whose size represents radius
    this.spawn(x, y, 0, 0, 0.4, maxRadius, color, 'ring');
  }

  public emitHyperspace(x: number, y: number) {
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const dist = 50 + Math.random() * 20;
      const startX = x + Math.cos(angle) * dist;
      const startY = y + Math.sin(angle) * dist;
      // Inward implosion
      const vx = -Math.cos(angle) * 160;
      const vy = -Math.sin(angle) * 160;

      this.spawn(startX, startY, vx, vy, 0.3, 2, '#a855f7', 'line');
    }
    this.emitShockwave(x, y, 60, '#c084fc');
  }

  public update(dt: number, width: number, height: number) {
    // Frame-rate independent drag constant
    const drag = Math.pow(0.965, dt * 60);

    for (let i = 0; i < this.capacity; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }

      // Physics integration: drag deceleration and movement
      p.vx *= drag;
      p.vy *= drag;

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.angle += p.rotSpeed * dt;

      // Toroidal screen wrapping
      if (p.x < 0) p.x += width;
      if (p.x > width) p.x -= width;
      if (p.y < 0) p.y += height;
      if (p.y > height) p.y -= height;
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (let i = 0; i < this.capacity; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = p.color;
      ctx.fillStyle = p.color;
      ctx.lineWidth = 1.5;

      if (p.shape === 'ring') {
        const currentRadius = p.size * (1 - alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, currentRadius), 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === 'line') {
        // Render streak in direction of velocity
        const speed = Math.hypot(p.vx, p.vy);
        const len = Math.min(18, speed * 0.08 + 2);
        const normX = speed > 0.001 ? p.vx / speed : 0;
        const normY = speed > 0.001 ? p.vy / speed : 0;

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - normX * len, p.y - normY * len);
        ctx.stroke();
      } else if (p.shape === 'shard') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.beginPath();
        ctx.moveTo(-p.size, -p.size * 0.5);
        ctx.lineTo(p.size, 0);
        ctx.lineTo(-p.size * 0.5, p.size * 0.5);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.size * alpha), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  public reset() {
    for (let i = 0; i < this.capacity; i++) {
      this.pool[i].active = false;
    }
    this.head = 0;
  }
}
