'use client';

import { useEffect, useState, useCallback } from "react";
import { TypingArena } from "@/src/components/game/TypingArena";
import { NativeVideoPlayer } from "@/src/components/game/NativeVideoPlayer";
import { useGameStore, ClipConfig } from "@/src/store/useGameStore";
import clipsData from "@/src/data/clips.json";

const clips: ClipConfig[] = clipsData as ClipConfig[];

export default function Home() {
  const { hasStarted, setHasStarted, currentClip, setCurrentClip, status, setStatus, playbackRate, setPlaybackRate, togglePause, isPaused } = useGameStore();
  const [clipIndex, setClipIndex] = useState(0);

  const startGame = () => {
    setCurrentClip(clips[0]);
    setClipIndex(0);
    setHasStarted(true);
  };

  const handleNext = useCallback(() => {
    const nextIndex = (clipIndex + 1) % clips.length;
    setClipIndex(nextIndex);
    setCurrentClip(clips[nextIndex]);
    setStatus('idle');
    // The video player resets isPaused internally when it detects a new clip ID.
  }, [clipIndex, setCurrentClip, setStatus]);

  const handlePrev = useCallback(() => {
    const prevIndex = (clipIndex - 1 + clips.length) % clips.length;
    setClipIndex(prevIndex);
    setCurrentClip(clips[prevIndex]);
    setStatus('idle');
    // The video player resets isPaused internally when it detects a new clip ID.
  }, [clipIndex, setCurrentClip, setStatus]);

  // Handle global shortcuts
  useEffect(() => {
    if (!hasStarted) {
      const handleStartKey = (e: KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          startGame();
        }
      };
      window.addEventListener('keydown', handleStartKey);
      return () => window.removeEventListener('keydown', handleStartKey);
    }

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.shiftKey) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setPlaybackRate(Math.max(0.25, playbackRate - 0.25));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setPlaybackRate(Math.min(1.0, playbackRate + 0.25));
        }
      } else {
        if (e.key === 'ArrowRight' && status === 'completed') {
          e.preventDefault();
          handleNext();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handlePrev();
        }
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleNext, handlePrev, playbackRate, setPlaybackRate, status, hasStarted]);

  // Auto-advance to next clip after a short delay
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (status === 'completed') {
      timeoutId = setTimeout(() => {
        handleNext();
      }, 1200); // 1.2 second delay before auto-advancing to let them see their success
    }
    
    // Also keep Enter as a manual override
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && status === 'completed') {
        clearTimeout(timeoutId);
        handleNext();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeoutId);
    };
  }, [status, clipIndex]);

  return (
    <main className="min-h-screen bg-[#050505] text-white p-8 font-sans flex flex-col">
      <div className="max-w-5xl mx-auto space-y-8 md:space-y-12 flex-1 w-full">
        <header className="flex justify-between items-center">
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            ClipType
          </h1>
          <div className="flex gap-2 md:gap-4 hidden md:flex flex-wrap items-center">
            {isPaused && (
              <div className="text-rose-400 font-bold text-sm px-3 py-1 animate-pulse flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                PAUSED
              </div>
            )}
            {playbackRate !== 1.0 && (
              <div className="text-cyan-400 font-bold text-sm px-3 py-1 border border-cyan-400/30 rounded-md bg-cyan-400/10">
                {playbackRate}x Speed
              </div>
            )}
            <div className="text-gray-500 font-mono text-xs border border-gray-800 rounded-md px-3 py-1">
              Shift+↑/↓ Speed
            </div>
            <div className="text-gray-500 font-mono text-xs border border-gray-800 rounded-md px-3 py-1">
              ←/→ Navigate
            </div>
            <div className="text-gray-500 font-mono text-xs border border-gray-800 rounded-md px-3 py-1">
              Esc to reset
            </div>
            <div className="text-gray-500 font-mono text-xs border border-gray-800 rounded-md px-3 py-1">
              Tab to replay
            </div>
          </div>
        </header>

        {!hasStarted ? (
          <div className="flex flex-col items-center justify-center flex-1 animate-in fade-in zoom-in duration-500 min-h-[50vh]">
            <div className="w-24 h-24 mb-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <svg className="w-12 h-12 text-emerald-400 ml-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold mb-4">Ready to type?</h2>
            <p className="text-gray-400 mb-8 max-w-md text-center">
              Listen to the clip and type exactly what you hear. 
              Punctuation counts!
            </p>
            <button 
              onClick={startGame}
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)]"
            >
              Play Challenge
            </button>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex justify-between text-sm text-gray-500 font-mono px-2">
              <span>Clip {clipIndex + 1} / {clips.length}</span>
            </div>
            
            <NativeVideoPlayer />
            <TypingArena targetSentence={currentClip?.targetSentence || ""} />
            
            <div className="flex justify-center mt-8 h-12">
              {status === 'completed' && (
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.4)] animate-in fade-in slide-in-from-bottom-4"
                >
                  Next Clip (Enter)
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
