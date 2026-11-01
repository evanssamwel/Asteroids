/**
 * Game Rules, Scoring, and Wave Progression Logic
 * Decoupled pure logic for Asteroids gameplay.
 */

export type AsteroidSize = 'large' | 'medium' | 'small';

export interface AsteroidSplitResult {
  nextSize: AsteroidSize | null;
  count: number;
  basePoints: number;
  childRadius: number;
  speedMultiplier: number;
}

export const ASTEROID_CONFIG = {
  large: {
    radius: 44,
    points: 20,
    baseSpeed: 55,
  },
  medium: {
    radius: 24,
    points: 50,
    baseSpeed: 90,
  },
  small: {
    radius: 12,
    points: 100,
    baseSpeed: 145,
  },
} as const;

export const SAUCER_CONFIG = {
  big: {
    radius: 22,
    points: 200,
    speed: 110,
    fireInterval: 2.2,
    accuracy: 0.25, // loose aim
  },
  small: {
    radius: 14,
    points: 1000,
    speed: 160,
    fireInterval: 1.4,
    accuracy: 0.85, // sharp predictive aim
  },
} as const;

export const COMBO_TIMEOUT_SECONDS = 2.4;
export const MAX_COMBO_MULTIPLIER = 5;

/**
 * Calculates the score gained from an entity destruction taking combo multiplier into account.
 */
export function calculateScore(basePoints: number, comboMultiplier: number): number {
  const multiplier = Math.max(1, Math.min(MAX_COMBO_MULTIPLIER, Math.floor(comboMultiplier)));
  return basePoints * multiplier;
}

/**
 * Updates combo state after elapsed time.
 * If elapsed exceeds timeout, combo drops back to 1.
 */
export function updateComboState(
  currentMultiplier: number,
  timeSinceLastHit: number
): { multiplier: number; progressRatio: number } {
  if (timeSinceLastHit >= COMBO_TIMEOUT_SECONDS) {
    return { multiplier: 1, progressRatio: 0 };
  }
  const remaining = Math.max(0, COMBO_TIMEOUT_SECONDS - timeSinceLastHit);
  return {
    multiplier: currentMultiplier,
    progressRatio: remaining / COMBO_TIMEOUT_SECONDS,
  };
}

/**
 * Determines child asteroid configuration when an asteroid is destroyed.
 */
export function getAsteroidSplit(size: AsteroidSize): AsteroidSplitResult {
  switch (size) {
    case 'large':
      return {
        nextSize: 'medium',
        count: 2,
        basePoints: ASTEROID_CONFIG.large.points,
        childRadius: ASTEROID_CONFIG.medium.radius,
        speedMultiplier: 1.4,
      };
    case 'medium':
      return {
        nextSize: 'small',
        count: 2,
        basePoints: ASTEROID_CONFIG.medium.points,
        childRadius: ASTEROID_CONFIG.small.radius,
        speedMultiplier: 1.6,
      };
    case 'small':
    default:
      return {
        nextSize: null,
        count: 0,
        basePoints: ASTEROID_CONFIG.small.points,
        childRadius: 0,
        speedMultiplier: 1.0,
      };
  }
}

/**
 * Generates wave difficulty parameters based on wave number (1-indexed).
 */
export function getWaveParameters(waveNumber: number) {
  const safeWave = Math.max(1, waveNumber);
  // Asteroid count starts at 4 and increments by 2 each wave, capped at 12 initial large rocks
  const asteroidCount = Math.min(12, 4 + (safeWave - 1) * 2);
  // Speed scales gently with wave
  const speedScale = 1.0 + Math.min(0.8, (safeWave - 1) * 0.12);
  // Saucer spawn interval shrinks
  const saucerSpawnInterval = Math.max(12, 28 - (safeWave - 1) * 2.5);
  // Chance of spawning small saucer vs big saucer
  const smallSaucerChance = Math.min(0.8, (safeWave - 1) * 0.18);

  return {
    asteroidCount,
    speedScale,
    saucerSpawnInterval,
    smallSaucerChance,
  };
}

/**
 * High score record schema and helper.
 */
export interface HighScoreRecord {
  initials: string;
  score: number;
  wave: number;
  date: string;
}

export function isHighScore(score: number, highScores: HighScoreRecord[], maxEntries = 5): boolean {
  if (score <= 0) return false;
  if (highScores.length < maxEntries) return true;
  return score > highScores[highScores.length - 1].score;
}

export function insertHighScore(
  record: HighScoreRecord,
  highScores: HighScoreRecord[],
  maxEntries = 5
): HighScoreRecord[] {
  const list = [...highScores, record];
  list.sort((a, b) => b.score - a.score);
  return list.slice(0, maxEntries);
}

/**
 * Power-Up configuration and drop algorithms.
 */
export const POWERUP_CONFIG = {
  rapid: {
    label: 'RAPID VULCAN',
    badge: 'RF',
    color: '#06b6d4',
    duration: 12.0,
    description: 'Ultra-fast firing rate with boosted projectile speed',
  },
  shield_regen: {
    label: 'SHIELD REGEN',
    badge: 'SR',
    color: '#10b981',
    duration: 10.0,
    regenRate: 25, // shields/sec
    description: 'Instant +25 shield boost and continuous shield regeneration',
  },
  spread: {
    label: '3-WAY SPREAD',
    badge: '3X',
    color: '#f59e0b',
    duration: 12.0,
    description: 'Fires three converging vector energy beams',
  },
  emp: {
    label: 'EMP BURST',
    badge: 'EMP',
    color: '#a855f7',
    duration: 0, // Instant detonation
    description: 'Shockwave pulse clearing nearby threats',
  },
} as const;

export type PowerUpConfigKey = keyof typeof POWERUP_CONFIG;

export function getAsteroidDropChance(size: AsteroidSize, comboMultiplier = 1): number {
  let baseChance = 0.12;
  if (size === 'large') baseChance = 0.22;
  else if (size === 'medium') baseChance = 0.15;
  else baseChance = 0.08;

  const comboBonus = Math.min(0.12, (comboMultiplier - 1) * 0.03);
  return Math.min(0.40, baseChance + comboBonus);
}

export function shouldDropPowerup(randomRoll: number, dropChance: number): boolean {
  return randomRoll < dropChance;
}

export function pickRandomPowerupType(randomRoll: number): PowerUpConfigKey {
  if (randomRoll < 0.30) return 'rapid';
  if (randomRoll < 0.60) return 'shield_regen';
  if (randomRoll < 0.85) return 'spread';
  return 'emp';
}

