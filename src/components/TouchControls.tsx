import React from 'react';
import { ArrowLeft, ArrowRight, Flame, Crosshair, Sparkles } from 'lucide-react';

interface TouchControlsProps {
  onInput: (action: 'left' | 'right' | 'thrust' | 'fire' | 'hyperspace', active: boolean) => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onInput }) => {
  const bindButton = (action: 'left' | 'right' | 'thrust' | 'fire' | 'hyperspace') => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      onInput(action, true);
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      onInput(action, false);
    },
    onPointerLeave: (e: React.PointerEvent) => {
      e.preventDefault();
      onInput(action, false);
    },
    onPointerCancel: (e: React.PointerEvent) => {
      e.preventDefault();
      onInput(action, false);
    },
  });

  return (
    <div className="md:hidden pointer-events-none absolute inset-x-0 bottom-4 px-4 flex items-end justify-between z-20 select-none">
      {/* Left Steering Pad: Left / Right rotation */}
      <div className="pointer-events-auto flex items-center gap-3">
        <button
          type="button"
          {...bindButton('left')}
          aria-label="Rotate Left"
          className="w-14 h-14 rounded-full bg-neutral-900/80 active:bg-cyan-900 border-2 border-cyan-500/50 flex items-center justify-center text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-colors active:scale-95"
        >
          <ArrowLeft size={22} />
        </button>

        <button
          type="button"
          {...bindButton('right')}
          aria-label="Rotate Right"
          className="w-14 h-14 rounded-full bg-neutral-900/80 active:bg-cyan-900 border-2 border-cyan-500/50 flex items-center justify-center text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-colors active:scale-95"
        >
          <ArrowRight size={22} />
        </button>
      </div>

      {/* Right Action Pad: Hyperspace, Thrust, Fire */}
      <div className="pointer-events-auto flex items-end gap-3">
        {/* Hyperspace */}
        <button
          type="button"
          {...bindButton('hyperspace')}
          aria-label="Hyperspace Jump"
          className="w-11 h-11 rounded-full bg-neutral-950/90 active:bg-purple-950 border border-purple-500/60 flex items-center justify-center text-purple-300 mb-1 active:scale-95 transition-colors"
        >
          <Sparkles size={16} />
        </button>

        {/* Thrust */}
        <button
          type="button"
          {...bindButton('thrust')}
          aria-label="Engine Thrust"
          className="w-14 h-14 rounded-full bg-neutral-900/80 active:bg-amber-950 border-2 border-amber-500/60 flex items-center justify-center text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)] active:scale-95 transition-colors"
        >
          <Flame size={22} />
        </button>

        {/* Fire Laser */}
        <button
          type="button"
          {...bindButton('fire')}
          aria-label="Fire Weapons"
          className="w-16 h-16 rounded-full bg-cyan-950/90 active:bg-cyan-800 border-2 border-cyan-400 flex items-center justify-center text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.5)] active:scale-95 transition-colors"
        >
          <Crosshair size={26} />
        </button>
      </div>
    </div>
  );
};
