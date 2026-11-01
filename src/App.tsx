/**
 * Vector Void - Retro Arcade Remake
 * Main Application Shell & Canvas Controller
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { GameState, RunSummary } from './game/types';
import { sound } from './game/audio';
import { ArcadeHUD } from './components/ArcadeHUD';
import { TitleOverlay } from './components/TitleOverlay';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { TouchControls } from './components/TouchControls';
import { Tv } from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // High-level UI state (only updated on discrete game events, never 60fps)
  const [gameState, setGameState] = useState<GameState>('title');
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);
  const [crtEnabled, setCrtEnabled] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());

  // HUD stats
  const [hudState, setHudState] = useState({
    score: 0,
    lives: 3,
    shields: 100,
    maxShields: 100,
    wave: 1,
    comboMultiplier: 1,
    comboProgress: 0,
    weapon: 'standard',
    highScore: 12450,
  });

  // Action: Start Game
  const handleStartGame = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.startNewGame();
    setGameState('playing');
  }, []);

  // Action: Toggle Pause
  const handleTogglePause = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.togglePause();
  }, []);

  // Action: Resume Game
  const handleResumeGame = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.setPaused(false);
  }, []);

  // Action: Restart Run
  const handleRestart = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.startNewGame();
    setGameState('playing');
  }, []);

  // Action: Toggle Mute
  const handleToggleMute = useCallback(() => {
    const nextMuted = !sound.getMuted();
    sound.setMuted(nextMuted);
    setIsMuted(nextMuted);
  }, []);

  // Action: Return to Title
  const handleQuitToTitle = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.initAttractMode();
    setGameState('title');
  }, []);

  // Action: Submit High Score Initials
  const handleSubmitInitials = useCallback((initials: string) => {
    if (!engineRef.current) return;
    engineRef.current.submitHighScore(initials);
  }, []);

  // Action: Touch Inputs
  const handleTouchInput = useCallback(
    (action: 'left' | 'right' | 'thrust' | 'fire' | 'hyperspace', active: boolean) => {
      if (!engineRef.current) return;
      engineRef.current.touchInputs[action] = active;
      if (active && gameState === 'title') {
        handleStartGame();
      }
    },
    [gameState, handleStartGame]
  );

  // Initialize Canvas and Game Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas);
    engineRef.current = engine;

    // Connect state hooks
    engine.onStateChange = (newState: GameState, summary?: RunSummary) => {
      setGameState(newState);
      if (summary) setRunSummary(summary);
    };

    engine.onHudChange = (hudData) => {
      setHudState(hudData);
    };

    engine.start();

    // Check for ?autostart=1 query parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autostart') === '1') {
      engine.startNewGame();
      setGameState('playing');
    }

    // Resize observer
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    // Global Key Listener for game controls and accessibility shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser default scrolling for gaming keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      // Title or Game Over screen: Enter or Space starts game
      if (
        (engine.state === 'title' || engine.state === 'gameover') &&
        (e.code === 'Enter' || e.code === 'Space')
      ) {
        // If not typing in input
        if ((e.target as HTMLElement)?.tagName !== 'INPUT') {
          handleStartGame();
          return;
        }
      }

      // Pause toggle: Escape or P
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if ((e.target as HTMLElement)?.tagName !== 'INPUT') {
          engine.togglePause();
          return;
        }
      }

      // Restart shortcut: R
      if (e.code === 'KeyR' && engine.state === 'playing') {
        if ((e.target as HTMLElement)?.tagName !== 'INPUT') {
          engine.startNewGame();
          return;
        }
      }

      // Mute shortcut: M
      if (e.code === 'KeyM') {
        if ((e.target as HTMLElement)?.tagName !== 'INPUT') {
          handleToggleMute();
          return;
        }
      }

      // Record key held
      engine.keysHeld[e.code] = true;
      engine.keysJustPressed[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      engine.keysHeld[e.code] = false;
    };

    // Focus-loss key release: clear all held keys on window blur so keys never stick
    const handleWindowBlur = () => {
      engine.keysHeld = {};
      engine.keysJustPressed = {};
      engine.touchInputs = {
        left: false,
        right: false,
        thrust: false,
        fire: false,
        hyperspace: false,
      };
      sound.setThrust(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('visibilitychange', handleWindowBlur);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('visibilitychange', handleWindowBlur);
      engine.stop();
    };
  }, [handleStartGame, handleToggleMute]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black flex items-center justify-center select-none font-mono">
      {/* Cabinet Bezel and CRT Screen Frame */}
      <div className="relative w-full h-full flex flex-col items-center justify-center bg-black">
        {/* Isolated Canvas Mount (outside re-rendering UI state) */}
        <canvas
          ref={canvasRef}
          data-testid="arcade-canvas"
          className="absolute inset-0 w-full h-full block bg-black cursor-crosshair"
        />

        {/* Optional Retro CRT Scanlines & Screen Vignette Overlay */}
        {crtEnabled && (
          <div className="pointer-events-none absolute inset-0 crt-overlay crt-vignette z-15" />
        )}

        {/* Playing HUD (Rendered when in 'playing' or 'paused') */}
        {(gameState === 'playing' || gameState === 'paused') && (
          <ArcadeHUD
            score={hudState.score}
            highScore={hudState.highScore}
            lives={hudState.lives}
            shields={hudState.shields}
            maxShields={hudState.maxShields}
            wave={hudState.wave}
            comboMultiplier={hudState.comboMultiplier}
            comboProgress={hudState.comboProgress}
            weapon={hudState.weapon}
            isPaused={gameState === 'paused'}
            isMuted={isMuted}
            onTogglePause={handleTogglePause}
            onToggleMute={handleToggleMute}
          />
        )}

        {/* Title Screen Overlay */}
        {gameState === 'title' && (
          <TitleOverlay
            onStart={handleStartGame}
            highScores={engineRef.current?.highScores || []}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          />
        )}

        {/* Pause Modal */}
        {gameState === 'paused' && (
          <PauseModal
            score={hudState.score}
            wave={hudState.wave}
            isMuted={isMuted}
            onResume={handleResumeGame}
            onRestart={handleRestart}
            onToggleMute={handleToggleMute}
            onQuitToTitle={handleQuitToTitle}
          />
        )}

        {/* Game Over Modal */}
        {gameState === 'gameover' && runSummary && (
          <GameOverModal
            summary={runSummary}
            onRestart={handleRestart}
            onSubmitInitials={handleSubmitInitials}
            onQuitToTitle={handleQuitToTitle}
          />
        )}

        {/* Mobile On-Screen Virtual Touch Controls */}
        <TouchControls onInput={handleTouchInput} />

        {/* CRT Scanline Toggle Corner Button (Desktop only to prevent touch interference) */}
        <div className="hidden md:block absolute bottom-2 right-2 z-25 pointer-events-auto">
          <button
            type="button"
            onClick={() => setCrtEnabled(!crtEnabled)}
            title="Toggle CRT Scanlines"
            className="p-1 text-[10px] bg-neutral-950/80 hover:bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-cyan-400 rounded-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Tv size={12} />
            <span>CRT {crtEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
