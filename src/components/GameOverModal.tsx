import React, { useState } from 'react';
import { RotateCcw, Trophy, Target, Award, Home } from 'lucide-react';
import { RunSummary } from '../game/types';

interface GameOverModalProps {
  summary: RunSummary;
  onRestart: () => void;
  onSubmitInitials: (initials: string) => void;
  onQuitToTitle: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  summary,
  onRestart,
  onSubmitInitials,
  onQuitToTitle,
}) => {
  const [initials, setInitials] = useState('AAA');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (submitted) return;
    onSubmitInitials(initials);
    setSubmitted(true);
  };

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-30 select-none pointer-events-auto">
      <div className="w-full max-w-md bg-neutral-950 border-2 border-rose-500/70 p-6 md:p-8 rounded-xs shadow-[0_0_40px_rgba(244,63,94,0.3)] text-center">
        {/* Header */}
        <div className="text-2xl md:text-3xl font-black font-mono tracking-widest text-rose-500 uppercase glow-rose mb-1">
          SHIP DESTROYED
        </div>
        <div className="text-xs font-mono tracking-widest text-neutral-400 mb-6">
          ALL RESERVES EXHAUSTED // TELEMETRY TERMINATED
        </div>

        {/* New High Score Callout & Initials Entry */}
        {summary.isNewHigh && !submitted && (
          <div className="mb-6 p-4 bg-amber-950/40 border border-amber-500/60 rounded-xs">
            <div className="flex items-center justify-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-widest mb-2">
              <Trophy size={16} /> NEW HIGH SCORE ACHIEVED!
            </div>
            <p className="text-[11px] font-mono text-neutral-300 mb-3">
              Enter your 3-character pilot callsign for the cabinet leaderboard:
            </p>
            <form onSubmit={handleSubmit} className="flex items-center justify-center gap-2">
              <input
                type="text"
                maxLength={3}
                value={initials}
                onChange={(e) => setInitials(e.target.value.toUpperCase())}
                autoFocus
                className="w-24 text-center font-mono text-xl tracking-[0.3em] font-bold bg-neutral-900 border-2 border-amber-400 text-amber-300 py-1 uppercase focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                SAVE
              </button>
            </form>
          </div>
        )}

        {submitted && (
          <div className="mb-6 p-2 bg-emerald-950/40 border border-emerald-500/50 rounded-xs text-xs font-mono text-emerald-400">
            CALLSIGN [{initials}] RECORDED TO HIGH SCORES
          </div>
        )}

        {/* Mission Telemetry Metric Tiles */}
        <div className="grid grid-cols-2 gap-2.5 mb-6 text-left">
          <div className="p-2.5 bg-neutral-900/60 border border-neutral-800">
            <div className="text-[10px] font-mono text-neutral-400 uppercase">FINAL SCORE</div>
            <div className="text-lg font-bold font-mono text-cyan-300 tabular-nums">
              {summary.score.toLocaleString()}
            </div>
          </div>

          <div className="p-2.5 bg-neutral-900/60 border border-neutral-800">
            <div className="text-[10px] font-mono text-neutral-400 uppercase">SECTOR REACHED</div>
            <div className="text-lg font-bold font-mono text-cyan-300 tabular-nums">
              WAVE 0{summary.wave}
            </div>
          </div>

          <div className="p-2.5 bg-neutral-900/60 border border-neutral-800">
            <div className="text-[10px] font-mono text-neutral-400 uppercase">ROCKS / SAUCERS</div>
            <div className="text-lg font-bold font-mono text-amber-300 tabular-nums">
              {summary.asteroidsDestroyed} / {summary.saucersDestroyed}
            </div>
          </div>

          <div className="p-2.5 bg-neutral-900/60 border border-neutral-800">
            <div className="text-[10px] font-mono text-neutral-400 uppercase">ACCURACY / COMBO</div>
            <div className="text-lg font-bold font-mono text-emerald-300 tabular-nums">
              {summary.accuracy}% / x{summary.peakCombo}
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            data-start="true"
            onClick={onRestart}
            className="w-full py-3 bg-cyan-950/90 hover:bg-cyan-900 border-2 border-cyan-400 text-cyan-300 hover:text-white font-mono text-xs font-bold tracking-widest uppercase transition-all duration-150 transform hover:scale-[1.02] shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw size={16} />
            <span>PLAY AGAIN [SPACE / ENTER]</span>
          </button>

          <button
            type="button"
            onClick={onQuitToTitle}
            className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white font-mono text-xs tracking-widest uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home size={14} />
            <span>RETURN TO TITLE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
