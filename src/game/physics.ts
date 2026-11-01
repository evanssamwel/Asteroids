/**
 * 2D Physics and Collision Detection Utilities
 * Decoupled pure logic functions for frame-rate independent arcade physics.
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

export interface AABB {
  x: number; // min x
  y: number; // min y
  width: number;
  height: number;
}

/**
 * Calculates Euclidean distance squared between two points (avoids Math.sqrt overhead).
 */
export function distanceSq(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

/**
 * Calculates Euclidean distance between two points.
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(distanceSq(x1, y1, x2, y2));
}

/**
 * Circle-Circle collision detection.
 * Returns true if the two circles intersect.
 */
export function checkCircleCircleCollision(c1: Circle, c2: Circle): boolean {
  const rSum = c1.radius + c2.radius;
  return distanceSq(c1.x, c1.y, c2.x, c2.y) <= rSum * rSum;
}

/**
 * Circle-to-AABB (Axis-Aligned Bounding Box) collision detection.
 * Finds the closest point on the box to the circle and compares distance.
 */
export function checkCircleAABBCollision(circle: Circle, box: AABB): boolean {
  // Clamp circle center to box boundary
  const closestX = Math.max(box.x, Math.min(circle.x, box.x + box.width));
  const closestY = Math.max(box.y, Math.min(circle.y, box.y + box.height));

  const dSq = distanceSq(circle.x, circle.y, closestX, closestY);
  return dSq <= circle.radius * circle.radius;
}

/**
 * Wraps coordinate around screen boundary (toroidal topology).
 * Accounts for radius margin so entities smoothly disappear and appear across edges.
 */
export function wrapCoordinate(value: number, max: number, margin = 0): number {
  if (value < -margin) return max + margin;
  if (value > max + margin) return -margin;
  return value;
}

/**
 * Clamps a number between min and max.
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Linear interpolation.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Calculates angle in radians from point 1 to point 2.
 */
export function angleBetween(p1: Point2D, p2: Point2D): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

/**
 * Normalizes an angle to [0, 2 * PI).
 */
export function normalizeAngle(angle: number): number {
  const twoPi = Math.PI * 2;
  let normalized = angle % twoPi;
  if (normalized < 0) normalized += twoPi;
  return normalized;
}
