'use client';

import { useTypingEngine } from "@/src/hooks/useTypingEngine";
import { CharacterTile } from "./CharacterTile";
import { useEffect, useRef } from "react";
import { useGameStore } from "@/src/store/useGameStore";
import { motion } from "framer-motion";

export function TypingArena({ targetSentence }: { targetSentence: string }) {
  const { cursorIndex, getCharState, isCompleted, hasError, processKey } = useTypingEngine(targetSentence);
  const setStatus = useGameStore((state) => state.setStatus);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Update game status
  useEffect(() => {
    if (isCompleted) setStatus('completed');
    else if (cursorIndex > 0 || hasError) setStatus('playing');
    else setStatus('idle');
  }, [isCompleted, cursorIndex, hasError, setStatus]);

  // On desktop: auto-focus when sentence changes
  // On mobile: this won't work due to browser security, user must tap the arena
  useEffect(() => {
    const isMobile = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    if (!isMobile) {
      hiddenInputRef.current?.focus();
    }
  }, [targetSentence]);

  /**
   * onKeyDown — special keys: Backspace, Tab, Escape.
   * Regular printable chars are handled by onChange below.
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      processKey('Backspace');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      processKey('Tab');
    } else if (e.key === 'Escape') {
      e.preventDefault();
      processKey('Escape');
    }
  };

  /**
   * onChange — fires for every printable character on both desktop and mobile.
   * We process the last char and immediately reset value to "" so it's always ready.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    processKey(val[val.length - 1]);
    e.target.value = '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      // `relative` so the absolute input overlay is contained within this card
      className="relative w-full max-w-4xl mx-auto p-8 md:p-12 mt-4 rounded-2xl bg-gray-900/50 border border-gray-800/50 backdrop-blur-sm shadow-2xl select-none"
    >
      {/*
        ── Mobile keyboard trick ──
        This input is INVISIBLE but covers the ENTIRE card.
        When the user taps anywhere on the card, they're tapping this input,
        which is a real focusable element → mobile OS opens keyboard natively.

        Critical properties:
        - position: absolute + inset-0: fills the full card
        - opacity-0: invisible (NOT display:none or visibility:hidden — those prevent focus)
        - NO pointer-events-none: must be tappable
        - autoCapitalize/autoCorrect/autoComplete/spellCheck all off
        - inputMode="text": opens standard keyboard (not numeric) on iOS/Android
        - cursor-text on the wrapper so the tap target feels natural
      */}
      <input
        ref={hiddenInputRef}
        type="text"
        inputMode="text"
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10"
        aria-label="Type the sentence shown"
      />

      {/* Character display — sits below the input overlay in z-order */}
      <div className="relative z-0 flex flex-wrap gap-[1px]">
        {targetSentence.split('').map((char, index) => (
          <CharacterTile
            key={index}
            char={char === ' ' ? '\u00A0' : char}
            state={getCharState(index)}
            isActive={index === cursorIndex}
          />
        ))}
      </div>

      {/* Status bar */}
      <div className="relative z-0 mt-8 flex justify-between items-center text-sm font-mono text-gray-500">
        <div>
          Mistakes:{' '}
          <span className={hasError ? 'text-rose-400' : 'text-gray-500'}>
            {hasError ? 1 : 0}
          </span>
          {hasError && (
            <span className="ml-3 text-rose-400 animate-pulse text-xs">
              ← type correct key or Backspace
            </span>
          )}
        </div>
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-emerald-400 font-bold"
          >
            ✓ Done!
          </motion.div>
        )}
      </div>

      {/* Mobile hint — only on touch devices */}
      <p className="relative z-0 mt-3 text-center text-xs text-gray-600 md:hidden">
        Tap anywhere here to type
      </p>
    </motion.div>
  );
}
