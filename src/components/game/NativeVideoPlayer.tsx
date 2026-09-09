'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/src/store/useGameStore';

export function NativeVideoPlayer() {
  const currentClip = useGameStore((state) => state.currentClip);
  const status = useGameStore((state) => state.status);
  const replayTrigger = useGameStore((state) => state.replayTrigger);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const prevPathRef = useRef<string | null>(null);

  const stopMonitoring = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const monitorTime = useCallback(() => {
    stopMonitoring();
    if (!videoRef.current || !currentClip) return;
    
    // Capture the target end time so the closure doesn't get confused if state changes
    const targetEndTime = currentClip.endTime;
    
    const checkTime = () => {
      if (!videoRef.current) return;
      if (videoRef.current.currentTime >= targetEndTime) {
        // Auto-loop seamlessly
        videoRef.current.currentTime = currentClip.startTime;
      }
      rafRef.current = requestAnimationFrame(checkTime);
    };
    rafRef.current = requestAnimationFrame(checkTime);
  }, [currentClip, stopMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopMonitoring();
  }, [stopMonitoring]);

  // 1. Handle Clip Changes
  useEffect(() => {
    if (videoRef.current && currentClip) {
      if (prevPathRef.current !== currentClip.videoPath) {
        videoRef.current.load();
        prevPathRef.current = currentClip.videoPath;
      }
      
      if (status === 'playing' || status === 'idle') {
        videoRef.current.currentTime = currentClip.startTime;
        // Catch the play promise error to prevent unhandled rejections if interrupted
        videoRef.current.play().then(() => monitorTime()).catch(() => {});
      }
    }
  }, [currentClip]);

  // 2. Handle Replay (Tab Key)
  useEffect(() => {
    if (videoRef.current && currentClip && replayTrigger > 0) {
      videoRef.current.currentTime = currentClip.startTime;
      videoRef.current.play().then(() => monitorTime()).catch(() => {});
    }
  }, [replayTrigger]);

  // 3. Handle Status Changes (Completed / Reset)
  useEffect(() => {
    if (videoRef.current && currentClip) {
      if (status === 'completed') {
        videoRef.current.pause();
        stopMonitoring();
      } else if (status === 'idle') {
        videoRef.current.currentTime = currentClip.startTime;
        videoRef.current.play().then(() => monitorTime()).catch(() => {});
      }
    }
  }, [status]);

  if (!currentClip) return null;

  return (
    <div className="relative w-full max-w-2xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-2xl border border-gray-800/80 ring-1 ring-white/10 bg-black">
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none"></div>
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
