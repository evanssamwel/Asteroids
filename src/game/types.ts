/**
 * Shared Type Definitions for Vector Void Arcade Game
 */

import { Point2D } from './physics';
import { AsteroidSize } from './rules';

export type GameState = 'title' | 'playing' | 'paused' | 'gameover';

export type WeaponType = 'standard' | 'spread' | 'rapid' | 'laser';

export interface PlayerShip {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number; // in radians (0 is pointing up)
  rotationSpeed: number;
  radius: number;
  thrusting: boolean;
  lives: number;
  shields: number;
  maxShields: number;
  invulnerableTimer: number; // seconds remaining
  fireCooldown: number;
  weapon: WeaponType;
  weaponTimer: number; // duration of powerup weapon
  score: number;
  accuracyStats: {
    shotsFired: number;
    shotsHit: number;
  };
}

export interface AsteroidEntity {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  rotationSpeed: number;
  size: AsteroidSize;
  radius: number;
  points: number;
  vertices: Point2D[]; // Jagged vector outline points relative to center
  color: string;
  glowColor: string;
}

export interface BulletEntity {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  maxLife: number;
  fromPlayer: boolean;
  color: string;
  damage: number;
}

export type SaucerSize = 'big' | 'small';

export interface SaucerEntity {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: SaucerSize;
  radius: number;
  points: number;
  fireTimer: number;
  directionChangeTimer: number;
  color: string;
}

export type PowerUpType = 'shield' | 'spread' | 'rapid' | 'emp';

export interface PowerUpEntity {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: PowerUpType;
  radius: number;
  life: number;
  angle: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  vy: number;
  scale: number;
}

export interface RunSummary {
  score: number;
  wave: number;
  asteroidsDestroyed: number;
  saucersDestroyed: number;
  accuracy: number;
  peakCombo: number;
  isNewHigh: boolean;
}
