import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Home } from 'lucide-react';

interface PauseModalProps {
  score: number;
  wave: number;
  isMuted: boolean;
  onResume: () => void;
  onRestart: () => void;
  onToggleMute: () => void;
  onQuitToTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  score,
  wave,
  isMuted,
  onResume,
  onRestart,
  onToggleMute,
  onQuitToTitle,
}) => {
  return (
    <div className="absolute inset-0 bg-black/75 flex items-center justify-center p-4 z-30 select-none pointer-events-auto">
      <div className="w-full max-w-sm bg-neutral-950 border-2 border-cyan-500/60 p-6 rounded-xs shadow-[0_0_30px_rgba(6,182,212,0.3)] text-center">
        {/* Title */}
        <div className="text-xl font-bold font-mono tracking-widest text-cyan-300 uppercase glow-cyan mb-1">
          MISSION PAUSED
        </div>
        <div className="text-[11px] font-mono text-neutral-400 mb-6">
          SECTOR 0{wave} // CURRENT SCORE {score.toLocaleString()}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full py-2.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400 text-cyan-300 hover:text-white font-mono text-xs tracking-widest uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play size={14} className="fill-current" />
            <span>RESUME MISSION [P]</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-cyan-500/50 text-neutral-300 hover:text-white font-mono text-xs tracking-widest uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>RESTART SECTOR [R]</span>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-cyan-500/50 text-neutral-300 hover:text-white font-mono text-xs tracking-widest uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            <span>{isMuted ? 'UNMUTE SOUND [M]' : 'MUTE SOUND [M]'}</span>
          </button>

          <button
            type="button"
            onClick={onQuitToTitle}
            className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-rose-500/50 text-neutral-400 hover:text-rose-300 font-mono text-xs tracking-widest uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home size={14} />
            <span>ABORT TO TITLE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
