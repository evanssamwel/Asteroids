import React, { useState } from 'react';
import { Play, Trophy, HelpCircle, Shield, Zap, Sparkles } from 'lucide-react';
import { HighScoreRecord } from '../game/rules';

interface TitleOverlayProps {
  onStart: () => void;
  highScores: HighScoreRecord[];
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleOverlay: React.FC<TitleOverlayProps> = ({
  onStart,
  highScores,
}) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'leaderboard' | 'guide'>('menu');

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-between p-6 md:p-10 select-none z-20 pointer-events-auto">
      {/* Top Header / Attract Banner */}
      <div className="flex items-center justify-between w-full max-w-4xl">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-mono tracking-widest text-emerald-400 uppercase">
            ATTRACT MODE ACTIVE
          </span>
        </div>
        <div className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
          INSERT COIN [1 CREDIT]
        </div>
      </div>

      {/* Main Center Stage */}
      <div className="flex flex-col items-center max-w-xl text-center my-auto">
        {/* Custom Inline SVG Vector Arcade Emblem */}
        <div className="relative mb-4">
          <svg
            className="w-72 md:w-96 h-24 filter drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]"
            viewBox="0 0 320 80"
            fill="none"
            stroke="currentColor"
          >
            {/* Vector Asteroids Decors */}
            <polygon
              points="15,20 30,10 40,25 35,45 20,40 10,32"
              stroke="#06b6d4"
              strokeWidth="1.5"
              fill="none"
            />
            <polygon
              points="285,35 305,25 315,40 305,60 290,52 280,45"
              stroke="#38bdf8"
              strokeWidth="1.5"
              fill="none"
            />
            {/* Center Ship Silhouette */}
            <polygon
              points="160,8 172,32 160,26 148,32"
              stroke="#ffffff"
              strokeWidth="2"
              fill="none"
            />
            {/* Title Text In Vector Outlines */}
            <text
              x="160"
              y="68"
              textAnchor="middle"
              className="font-black text-4xl fill-cyan-400 tracking-[0.25em]"
              fontFamily="'Share Tech Mono', monospace"
              stroke="#22d3ee"
              strokeWidth="1"
            >
              VECTOR VOID
            </text>
          </svg>
          <div className="text-[10px] md:text-xs font-mono tracking-[0.35em] text-cyan-200 uppercase mt-1 glow-cyan">
            ARCADE RE-CREATION // 1979-2026
          </div>
        </div>

        {activeTab === 'menu' && (
          <div className="flex flex-col items-center gap-4 w-full">
            {/* Primary Start CTA Button */}
            <button
              type="button"
              data-start="true"
              onClick={onStart}
              className="group relative px-8 py-3.5 bg-cyan-950/80 hover:bg-cyan-900 border-2 border-cyan-400 hover:border-cyan-300 text-cyan-300 hover:text-white font-mono text-sm tracking-widest uppercase transition-all duration-150 transform hover:scale-105 shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-3 cursor-pointer"
            >
              <Play size={18} className="fill-current text-cyan-400 group-hover:text-cyan-200" />
              <span>START MISSION</span>
              <span className="text-[10px] text-cyan-400/80 bg-cyan-900/60 px-1.5 py-0.5 rounded-xs ml-1">
                [SPACE / ENTER]
              </span>
            </button>

            {/* Sub CTAs */}
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => setActiveTab('leaderboard')}
                className="px-3 py-1.5 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 hover:border-cyan-500/50 text-neutral-300 hover:text-cyan-300 text-xs font-mono tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trophy size={14} className="text-amber-400" />
                <span>HIGH SCORES</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('guide')}
                className="px-3 py-1.5 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 hover:border-cyan-500/50 text-neutral-300 hover:text-cyan-300 text-xs font-mono tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <HelpCircle size={14} className="text-cyan-400" />
                <span>FLIGHT MANUAL</span>
              </button>
            </div>
          </div>
        )}

        {/* High Scores Modal Tab */}
        {activeTab === 'leaderboard' && (
          <div className="w-full bg-neutral-950/90 border border-cyan-500/40 p-5 rounded-xs shadow-[0_0_25px_rgba(6,182,212,0.2)]">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/30 mb-3">
              <span className="text-xs font-bold font-mono tracking-widest text-amber-400 uppercase flex items-center gap-2">
                <Trophy size={16} /> HALL OF FAME
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('menu')}
                className="text-xs font-mono text-neutral-400 hover:text-white cursor-pointer"
              >
                [BACK]
              </button>
            </div>

            <div className="space-y-2">
              {highScores.map((record, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between font-mono text-xs py-1 px-2 bg-neutral-900/40 border border-neutral-800/80"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-500 w-4">{index + 1}.</span>
                    <span className="font-bold text-cyan-300 tracking-widest">{record.initials}</span>
                    <span className="text-[10px] text-neutral-500">SEC {record.wave}</span>
                  </div>
                  <div className="tabular-nums font-bold text-amber-300">
                    {record.score.toLocaleString()} PTS
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-800 flex justify-center">
              <button
                type="button"
                data-start="true"
                onClick={onStart}
                className="text-xs font-mono uppercase tracking-widest text-cyan-400 hover:text-cyan-200 cursor-pointer"
              >
                [PRESS SPACE TO PLAY]
              </button>
            </div>
          </div>
        )}

        {/* Flight Manual Tab */}
        {activeTab === 'guide' && (
          <div className="w-full bg-neutral-950/90 border border-cyan-500/40 p-5 rounded-xs text-left shadow-[0_0_25px_rgba(6,182,212,0.2)]">
            <div className="flex items-center justify-between pb-2 border-b border-cyan-500/30 mb-3">
              <span className="text-xs font-bold font-mono tracking-widest text-cyan-400 uppercase flex items-center gap-2">
                <HelpCircle size={16} /> FLIGHT SYSTEMS & COMBAT
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('menu')}
                className="text-xs font-mono text-neutral-400 hover:text-white cursor-pointer"
              >
                [BACK]
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono text-neutral-300">
              <div className="space-y-1">
                <div className="text-[10px] text-cyan-400 uppercase font-bold">SHIP DYNAMICS</div>
                <p className="text-[11px] text-neutral-400">
                  Full 2D inertial physics with toroidal screen-wrapping. Newton drag applies.
                </p>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] text-amber-400 uppercase font-bold">COMBO MULTIPLIER</div>
                <p className="text-[11px] text-neutral-400">
                  Chain asteroid & saucer kills within 2.4s to earn up to 5x score bonuses.
                </p>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] text-emerald-400 uppercase font-bold">POWER-UP DROPS</div>
                <p className="text-[11px] text-neutral-400">
                  Shield restore [SH], 3-Way spread laser [3X], Rapid vulcan [RP], EMP blast.
                </p>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] text-rose-400 uppercase font-bold">ENEMY SAUCERS</div>
                <p className="text-[11px] text-neutral-400">
                  Big Saucers patrol loosely. Small Saucers predict your velocity!
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-800 flex justify-center">
              <button
                type="button"
                data-start="true"
                onClick={onStart}
                className="text-xs font-mono uppercase tracking-widest text-cyan-400 hover:text-cyan-200 cursor-pointer"
              >
                [READY PILOT - LAUNCH MISSION]
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Safe Margin: Flat borderless inline control hint */}
      <div className="text-center font-mono text-[11px] text-neutral-400 tracking-wider">
        [A][D] or [←][→] Rotate · [W] or [↑] Thrust · [SPACE] Fire · [S] or [↓] Hyperspace · [P] Pause · [M] Mute
      </div>
    </div>
  );
};
