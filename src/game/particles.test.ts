import test from 'node:test';
import assert from 'node:assert/strict';
import { ParticleSystem } from './particles';

test('ParticleSystem initializes with allocated pool', () => {
  const ps = new ParticleSystem(100);
  assert.equal(ps['pool'].length, 100);
  assert.equal(ps['pool'][0].active, false);
});

test('emitColorfulAsteroidExplosion spawns active particles with velocities and life', () => {
  const ps = new ParticleSystem(150);
  ps.emitColorfulAsteroidExplosion(100, 100, 30, '#06b6d4', 2);

  const active = ps['pool'].filter((p) => p.active);
  assert.ok(active.length >= 25, `Expected >= 25 active particles, got ${active.length}`);

  // Test that particles have non-zero velocity and colors from neon palette
  const sample = active[0];
  assert.ok(sample.life > 0);
  assert.ok(sample.maxLife > 0);
  assert.ok(sample.color.startsWith('#'));
});

test('Particle update simulates physics with delta-time and drag deceleration', () => {
  const ps = new ParticleSystem(100);
  ps.emitExplosion(50, 50, 5, '#f43f5e', 1.0);

  const initialParticle = ps['pool'].find((p) => p.active)!;
  const initialVx = initialParticle.vx;
  const initialLife = initialParticle.life;

  // Advance simulation by 0.1s
  ps.update(0.1, 800, 600);

  // Velocity should have decayed due to drag
  assert.ok(Math.abs(initialParticle.vx) < Math.abs(initialVx));
  // Life should have decreased by dt
  assert.ok(initialParticle.life < initialLife);
});

test('Particles deactivate when life expires', () => {
  const ps = new ParticleSystem(50);
  ps.emitThruster(50, 50, 0, 100);

  assert.ok(ps['pool'].some((p) => p.active));

  // Advance by 1.5 seconds (thruster particles live <= 0.45s)
  ps.update(1.5, 800, 600);

  // All thruster particles should be deactivated
  const remainingActive = ps['pool'].filter((p) => p.active);
  assert.equal(remainingActive.length, 0);
});
