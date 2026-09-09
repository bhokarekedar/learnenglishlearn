'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/src/store/useGameStore';

/**
 * NativeVideoPlayer — single source of truth for all video control.
 *
 * Design principles:
 *  - ONE master useEffect watches currentClip + isPaused + status together.
 *    No separate effects that can race each other.
 *  - requestAnimationFrame loop handles time-based looping.
 *  - isPaused resets to false whenever a new clip loads (store reset in page.tsx).
 *  - playbackRate applied separately (no side-effects on play state).
 */
export function NativeVideoPlayer() {
  const currentClip = useGameStore((s) => s.currentClip);
  const status      = useGameStore((s) => s.status);
  const isPaused    = useGameStore((s) => s.isPaused);
  const playbackRate = useGameStore((s) => s.playbackRate);
  const replayTrigger = useGameStore((s) => s.replayTrigger);

  const videoRef   = useRef<HTMLVideoElement>(null);
  const rafRef     = useRef<number | null>(null);
  const prevClipId = useRef<string | null>(null);

  // ─── Loop monitor ───────────────────────────────────────────────────────────
  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startLoop = useCallback((endTime: number, startTime: number) => {
    stopLoop();
    const tick = () => {
      const vid = videoRef.current;
      if (!vid) return;
      if (vid.currentTime >= endTime) {
        vid.currentTime = startTime; // seamless loop
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [stopLoop]);

  // ─── Apply playback rate (independent, no side-effects) ────────────────────
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // ─── Master controller ──────────────────────────────────────────────────────
  // Runs whenever clip, pause state, or status changes.
  // Note: `status === 'completed'` always wins → stop.
  // Note: `isPaused` always wins over playing → pause.
  // Otherwise → seek & play.
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !currentClip) return;

    // 1. If sentence is completed → freeze video, stop loop
    if (status === 'completed') {
      vid.pause();
      stopLoop();
      return;
    }

    // 2. New clip → seek to start, reset paused state in store
    const isNewClip = prevClipId.current !== currentClip.id;
    if (isNewClip) {
      prevClipId.current = currentClip.id;
      // Reset the global pause flag so new clip always starts playing
      if (useGameStore.getState().isPaused) {
        useGameStore.getState().togglePause(); // reset to un-paused
      }
      vid.currentTime = currentClip.startTime;
      vid.playbackRate = useGameStore.getState().playbackRate;
      vid.play()
        .then(() => startLoop(currentClip.endTime, currentClip.startTime))
        .catch(() => {/* autoplay blocked */});
      return;
    }

    // 3. User toggled pause
    if (isPaused) {
      vid.pause();
      stopLoop();
    } else {
      // Resume (only if not past end)
      if (vid.currentTime >= currentClip.endTime) {
        vid.currentTime = currentClip.startTime;
      }
      vid.play()
        .then(() => startLoop(currentClip.endTime, currentClip.startTime))
        .catch(() => {});
    }
  }, [currentClip, isPaused, status, startLoop, stopLoop]);

  // ─── Replay trigger (Tab key) ───────────────────────────────────────────────
  useEffect(() => {
    if (!replayTrigger || !videoRef.current || !currentClip) return;
    const vid = videoRef.current;
    vid.currentTime = currentClip.startTime;
    vid.play()
      .then(() => startLoop(currentClip.endTime, currentClip.startTime))
      .catch(() => {});
  }, [replayTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => () => stopLoop(), [stopLoop]);

  if (!currentClip) return null;

  return (
    <div className="relative w-full max-w-2xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-2xl border border-gray-800/80 ring-1 ring-white/10 bg-black">
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none" />
      <video
        ref={videoRef}
        src={currentClip.videoPath}
        className="w-full h-full object-cover"
        playsInline
        preload="auto"
      />
    </div>
  );
}
