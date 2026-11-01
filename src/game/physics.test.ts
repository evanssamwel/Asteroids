import test from 'node:test';
import assert from 'node:assert/strict';
import {
  distanceSq,
  distance,
  checkCircleCircleCollision,
  checkCircleAABBCollision,
  wrapCoordinate,
  clamp,
  lerp,
} from './physics';

test('distance calculation computes euclidean length correctly', () => {
  assert.equal(distance(0, 0, 3, 4), 5);
  assert.equal(distanceSq(0, 0, 3, 4), 25);
});

test('checkCircleCircleCollision accurately detects intersections and separations', () => {
  // Overlapping circles
  const c1 = { x: 10, y: 10, radius: 5 };
  const c2 = { x: 14, y: 10, radius: 5 }; // distance is 4, sum of radii is 10 -> colliding
  assert.equal(checkCircleCircleCollision(c1, c2), true);

  // Touching circles
  const c3 = { x: 20, y: 10, radius: 5 }; // distance is 10, sum of radii is 10 -> colliding
  assert.equal(checkCircleCircleCollision(c1, c3), true);

  // Separated circles
  const c4 = { x: 30, y: 10, radius: 5 }; // distance is 20, sum is 10 -> false
  assert.equal(checkCircleCircleCollision(c1, c4), false);
});

test('checkCircleAABBCollision detects circle inside or intersecting box', () => {
  const box = { x: 50, y: 50, width: 100, height: 100 };

  // Circle inside box
  assert.equal(checkCircleAABBCollision({ x: 80, y: 80, radius: 10 }, box), true);

  // Circle overlapping edge
  assert.equal(checkCircleAABBCollision({ x: 45, y: 80, radius: 10 }, box), true);

  // Circle separated from box
  assert.equal(checkCircleAABBCollision({ x: 20, y: 20, radius: 10 }, box), false);
});

test('wrapCoordinate correctly cycles across boundaries with margin', () => {
  const max = 800;
  const margin = 20;

  // Normal inside bounds
  assert.equal(wrapCoordinate(400, max, margin), 400);

  // Exceeds right edge past margin -> wraps to left margin
  assert.equal(wrapCoordinate(825, max, margin), -20);

  // Below left edge past margin -> wraps to right margin
  assert.equal(wrapCoordinate(-25, max, margin), 820);
});

test('clamp and lerp utility functions', () => {
  assert.equal(clamp(15, 0, 10), 10);
  assert.equal(clamp(-5, 0, 10), 0);
  assert.equal(clamp(5, 0, 10), 5);

  assert.equal(lerp(10, 20, 0.5), 15);
  assert.equal(lerp(10, 20, 0), 10);
  assert.equal(lerp(10, 20, 1), 20);
});
