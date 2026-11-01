import React from 'react';
import { Volume2, VolumeX, Pause, Play, Shield } from 'lucide-react';
import { sound } from '../game/audio';

interface ArcadeHUDProps {
  score: number;
  highScore: number;
  lives: number;
  shields: number;
  maxShields: number;
  wave: number;
  comboMultiplier: number;
  comboProgress: number;
  weapon: string;
  isPaused: boolean;
  isMuted: boolean;
  onTogglePause: () => void;
  onToggleMute: () => void;
}

export const ArcadeHUD: React.FC<ArcadeHUDProps> = ({
  score,
  highScore,
  lives,
  shields,
  maxShields,
  wave,
  comboMultiplier,
  comboProgress,
  weapon,
  isPaused,
  isMuted,
  onTogglePause,
  onToggleMute,
}) => {
  const shieldPercent = Math.max(0, Math.min(100, (shields / maxShields) * 100));

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 md:p-6 select-none z-10">
      {/* Top Bar Perimeter Cluster */}
      <div className="flex items-start justify-between w-full gap-2">
        {/* Left: Score & High Score */}
        <div className="flex flex-col min-w-0">
          <div className="text-[9px] md:text-[10px] uppercase tracking-widest text-cyan-400/80 font-mono truncate">
            SCORE <span className="hidden sm:inline ml-2 text-neutral-500 font-mono">HI {highScore.toLocaleString()}</span>
          </div>
          <div className="text-xl md:text-3xl font-bold tracking-wider text-cyan-300 font-mono tabular-nums glow-cyan">
            {score.toLocaleString()}
          </div>

          {/* Combo Multiplier Bar */}
          {comboMultiplier > 1 && (
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 font-mono glow-amber animate-pulse">
                x{comboMultiplier} COMBO
              </span>
              <div className="w-20 h-1.5 bg-neutral-900 border border-amber-500/40 rounded-xs overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-75"
                  style={{ width: `${comboProgress * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Center: Wave & Weapon Indicator */}
        <div className="flex flex-col items-center">
          <div className="px-3 py-1 bg-cyan-950/40 border border-cyan-500/30 rounded-xs">
            <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase">
              SECTOR 0{wave}
            </span>
          </div>

          {weapon !== 'standard' && (
            <div className="mt-1 px-2 py-0.5 bg-amber-950/60 border border-amber-500/50 rounded-xs">
              <span className="text-[10px] font-mono tracking-wider text-amber-300 uppercase">
                {weapon === 'spread' ? '3-WAY SPREAD' : 'RAPID VULCAN'}
              </span>
            </div>
          )}
        </div>

        {/* Right: Health/Shields, Lives, and Audio/Pause Buttons */}
        <div className="flex flex-col items-end gap-2">
          {/* Controls: Audio & Pause */}
          <div className="pointer-events-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              tabIndex={-1}
              aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              className="p-1.5 bg-neutral-900/80 hover:bg-neutral-800 border border-cyan-500/30 rounded-xs text-cyan-300 hover:text-cyan-100 transition-colors"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onTogglePause();
              }}
              tabIndex={-1}
              aria-label={isPaused ? 'Resume Game' : 'Pause Game'}
              className="p-1.5 bg-neutral-900/80 hover:bg-neutral-800 border border-cyan-500/30 rounded-xs text-cyan-300 hover:text-cyan-100 transition-colors"
            >
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          </div>

          {/* Lives Pips */}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] uppercase font-mono text-neutral-400 mr-1">SHIPS</span>
            {Array.from({ length: 4 }).map((_, i) => (
              <svg
                key={i}
                viewBox="0 0 16 16"
                className={`w-4 h-4 transition-opacity ${
                  i < lives ? 'text-cyan-400 drop-shadow-[0_0_4px_rgba(6,182,212,0.8)]' : 'text-neutral-800 opacity-30'
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <polygon points="8,1 15,14 8,11 1,14" />
              </svg>
            ))}
          </div>

          {/* Shield Gauge */}
          <div className="flex items-center gap-1.5">
            <Shield size={12} className="text-cyan-400" />
            <div className="w-24 h-2 bg-neutral-900 border border-cyan-500/40 rounded-xs overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all duration-150"
                style={{ width: `${shieldPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
