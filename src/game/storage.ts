/**
 * LocalStorage Persistence for High Scores and Cabinet Settings
 */

import { HighScoreRecord } from './rules';

const STORAGE_KEY_SCORES = 'vv_arcade_high_scores';
const STORAGE_KEY_SETTINGS = 'vv_arcade_settings';

export const DEFAULT_HIGH_SCORES: HighScoreRecord[] = [
  { initials: 'NEO', score: 12450, wave: 5, date: '2026-10-15' },
  { initials: 'TRX', score: 8900, wave: 4, date: '2026-10-18' },
  { initials: 'VEC', score: 6200, wave: 3, date: '2026-10-22' },
  { initials: 'ACE', score: 4150, wave: 2, date: '2026-10-25' },
  { initials: 'ZAP', score: 2300, wave: 2, date: '2026-10-28' },
];

export interface CabinetSettings {
  crtScanlines: boolean;
  glowEnabled: boolean;
  touchControlsAlways: boolean;
}

export const DEFAULT_SETTINGS: CabinetSettings = {
  crtScanlines: true,
  glowEnabled: true,
  touchControlsAlways: false,
};

export function loadHighScores(): HighScoreRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SCORES);
    if (!raw) return DEFAULT_HIGH_SCORES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // ignore json parse error
  }
  return DEFAULT_HIGH_SCORES;
}

export function saveHighScores(scores: HighScoreRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SCORES, JSON.stringify(scores));
  } catch {
    // LocalStorage write failed
  }
}

export function loadSettings(): CabinetSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: CabinetSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch {
    // LocalStorage write failed
  }
}
