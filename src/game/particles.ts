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

  constructor(capacity = 650) {
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
    for (let i = 0; i < this.capacity; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }

      // Drag friction
      p.vx *= 0.975;
      p.vy *= 0.975;

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.angle += p.rotSpeed * dt;

      // Wrap particles gently
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
        ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === 'line') {
        // Render streak in direction of velocity
        const len = Math.min(12, Math.hypot(p.vx, p.vy) * 0.08 + 2);
        const normX = p.vx !== 0 || p.vy !== 0 ? p.vx / Math.hypot(p.vx, p.vy) : 0;
        const normY = p.vx !== 0 || p.vy !== 0 ? p.vy / Math.hypot(p.vx, p.vy) : 0;

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
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
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
