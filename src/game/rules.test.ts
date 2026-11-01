import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateScore,
  updateComboState,
  getAsteroidSplit,
  getWaveParameters,
  isHighScore,
  insertHighScore,
  HighScoreRecord,
  getAsteroidDropChance,
  shouldDropPowerup,
  pickRandomPowerupType,
} from './rules';

test('calculateScore applies combo multiplier up to maximum', () => {
  assert.equal(calculateScore(20, 1), 20);
  assert.equal(calculateScore(50, 3), 150);
  assert.equal(calculateScore(100, 5), 500);
  // Capped at 5x
  assert.equal(calculateScore(100, 10), 500);
});

test('updateComboState handles decay and resets after timeout', () => {
  const active = updateComboState(3, 1.2);
  assert.equal(active.multiplier, 3);
  assert.ok(active.progressRatio > 0 && active.progressRatio < 1);

  const expired = updateComboState(3, 2.5);
  assert.equal(expired.multiplier, 1);
  assert.equal(expired.progressRatio, 0);
});

test('getAsteroidSplit defines correct children and scores', () => {
  const largeSplit = getAsteroidSplit('large');
  assert.equal(largeSplit.nextSize, 'medium');
  assert.equal(largeSplit.count, 2);
  assert.equal(largeSplit.basePoints, 20);

  const mediumSplit = getAsteroidSplit('medium');
  assert.equal(mediumSplit.nextSize, 'small');
  assert.equal(mediumSplit.count, 2);
  assert.equal(mediumSplit.basePoints, 50);

  const smallSplit = getAsteroidSplit('small');
  assert.equal(smallSplit.nextSize, null);
  assert.equal(smallSplit.count, 0);
  assert.equal(smallSplit.basePoints, 100);
});

test('getWaveParameters scales rock count and speed with wave', () => {
  const w1 = getWaveParameters(1);
  assert.equal(w1.asteroidCount, 4);
  assert.equal(w1.speedScale, 1.0);

  const w3 = getWaveParameters(3);
  assert.equal(w3.asteroidCount, 8);
  assert.ok(w3.speedScale > 1.0);
  assert.ok(w3.smallSaucerChance > w1.smallSaucerChance);
});

test('high score qualification and sorted insertion', () => {
  const scores: HighScoreRecord[] = [
    { initials: 'ACE', score: 5000, wave: 4, date: '2026-10-01' },
    { initials: 'NEO', score: 3000, wave: 3, date: '2026-10-02' },
    { initials: 'FOX', score: 1000, wave: 1, date: '2026-10-03' },
  ];

  assert.equal(isHighScore(4000, scores, 3), true);
  assert.equal(isHighScore(500, scores, 3), false);
  assert.equal(isHighScore(6000, scores, 3), true);

  const updated = insertHighScore(
    { initials: 'MAX', score: 4000, wave: 3, date: '2026-11-01' },
    scores,
    3
  );

  assert.equal(updated.length, 3);
  assert.equal(updated[0].initials, 'ACE');
  assert.equal(updated[1].initials, 'MAX');
  assert.equal(updated[2].initials, 'NEO');
});

test('powerup drop chance scales with asteroid size and combo', () => {
  const largeChance = getAsteroidDropChance('large', 1);
  const smallChance = getAsteroidDropChance('small', 1);
  assert.ok(largeChance > smallChance);

  const boostedChance = getAsteroidDropChance('large', 4);
  assert.ok(boostedChance > largeChance);

  assert.equal(shouldDropPowerup(0.05, 0.20), true);
  assert.equal(shouldDropPowerup(0.35, 0.20), false);

  assert.equal(pickRandomPowerupType(0.15), 'rapid');
  assert.equal(pickRandomPowerupType(0.45), 'shield_regen');
  assert.equal(pickRandomPowerupType(0.75), 'spread');
  assert.equal(pickRandomPowerupType(0.95), 'emp');
});

