'use client';

import { useEffect, useState, useCallback, useRef } from "react";
import { TypingArena } from "@/src/components/game/TypingArena";
import { NativeVideoPlayer } from "@/src/components/game/NativeVideoPlayer";
import { useGameStore, ClipConfig } from "@/src/store/useGameStore";
import clipsData from "@/src/data/clips.json";

const clips: ClipConfig[] = clipsData as ClipConfig[];

const SPEEDS = [0.5, 0.75, 1.0];

export default function Home() {
  const {
    hasStarted, setHasStarted,
    currentClip, setCurrentClip,
    status, setStatus,
    playbackRate, setPlaybackRate,
    togglePause, isPaused,
    triggerReplay,
  } = useGameStore();
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
  }, [clipIndex, setCurrentClip, setStatus]);

  const handlePrev = useCallback(() => {
    const prevIndex = (clipIndex - 1 + clips.length) % clips.length;
    setClipIndex(prevIndex);
    setCurrentClip(clips[prevIndex]);
    setStatus('idle');
  }, [clipIndex, setCurrentClip, setStatus]);

  const cycleSpeed = () => {
    const currentIdx = SPEEDS.indexOf(playbackRate);
    const nextSpeed = SPEEDS[(currentIdx + 1) % SPEEDS.length];
    setPlaybackRate(nextSpeed);
  };

  // Global keyboard shortcuts (desktop)
  useEffect(() => {
    if (!hasStarted) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept events when the hidden input is the target
      // (those are handled by TypingArena)
      if (e.target instanceof HTMLInputElement) {
        // Only intercept navigation keys — let TypingArena handle typing
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      }

      if (e.shiftKey) {
        if (e.key === 'ArrowDown') { e.preventDefault(); setPlaybackRate(Math.max(0.25, playbackRate - 0.25)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setPlaybackRate(Math.min(1.0, playbackRate + 0.25)); }
      } else {
        if (e.key === 'ArrowRight' && status === 'completed') { e.preventDefault(); handleNext(); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); handlePrev(); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasStarted, handleNext, handlePrev, playbackRate, setPlaybackRate, status]);

  // Auto-advance on completion
  useEffect(() => {
    if (status !== 'completed') return;
    const t = setTimeout(handleNext, 1200);
    return () => clearTimeout(t);
  }, [status, handleNext]);

  return (
    <main className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans flex flex-col">
      <div className="max-w-5xl mx-auto flex-1 w-full space-y-4 md:space-y-8">

        {/* Header */}
        <header className="flex justify-between items-center pt-2">
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            ClipType
          </h1>
          {hasStarted && (
            <span className="text-gray-500 font-mono text-sm">
              {clipIndex + 1} / {clips.length}
            </span>
          )}
        </header>

        {!hasStarted ? (
          /* ── Landing ── */
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 mb-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <svg className="w-12 h-12 text-emerald-400 ml-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold mb-4">Ready to type?</h2>
            <p className="text-gray-400 mb-8 max-w-md text-center">
              Watch the clip, listen carefully, and type what you hear.
            </p>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)]"
            >
              Play Challenge
            </button>
          </div>
        ) : (
          /* ── Game ── */
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">

            {/* Video */}
            <NativeVideoPlayer />

            {/* Video controls row — visible on all screen sizes */}
            <div className="flex items-center justify-between px-1 gap-2">
              {/* Prev */}
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 active:scale-95 transition-all text-sm font-mono text-gray-300"
                title="Previous clip (←)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Prev</span>
              </button>

              {/* Centre controls */}
              <div className="flex items-center gap-2">
                {/* Replay */}
                <button
                  onClick={triggerReplay}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 active:scale-95 transition-all text-sm font-mono text-gray-300"
                  title="Replay clip (Tab)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden sm:inline">Replay</span>
                </button>

                {/* Play/Pause */}
                <button
                  onClick={togglePause}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg active:scale-95 transition-all text-sm font-mono ${isPaused ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
                  title="Pause/Play (Space)"
                >
                  {isPaused ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      <span className="hidden sm:inline">Play</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                      <span className="hidden sm:inline">Pause</span>
                    </>
                  )}
                </button>

                {/* Speed */}
                <button
                  onClick={cycleSpeed}
                  className={`px-3 py-2 rounded-lg active:scale-95 transition-all text-sm font-mono border ${
                    playbackRate < 1.0
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-transparent'
                  }`}
                  title="Cycle speed (Shift+↑/↓)"
                >
                  {playbackRate}x
                </button>
              </div>

              {/* Next */}
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 active:scale-95 transition-all text-sm font-mono text-gray-300"
                title="Next clip (→)"
              >
                <span className="hidden sm:inline">Next</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Typing arena */}
            <TypingArena targetSentence={currentClip?.targetSentence || ""} />

          </div>
        )}

        {/* Desktop shortcut hints — hidden on mobile */}
        {hasStarted && (
          <div className="hidden md:flex gap-2 flex-wrap justify-center pb-4">
            {[['Tab', 'Replay'], ['Esc', 'Reset'], ['←→', 'Navigate'], ['Shift+↑↓', 'Speed']].map(([key, label]) => (
              <div key={key} className="text-gray-600 font-mono text-xs border border-gray-800 rounded-md px-2 py-1">
                <span className="text-gray-500">{key}</span> {label}
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
