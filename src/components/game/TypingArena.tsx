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

  // Focus the hidden input whenever the sentence changes (new clip)
  useEffect(() => {
    hiddenInputRef.current?.focus();
  }, [targetSentence]);

  const focusInput = () => hiddenInputRef.current?.focus();

  /**
   * onKeyDown — handles ALL key events for both desktop and mobile.
   * 
   * Strategy:
   *  - Special keys (Backspace, Tab, Escape): process immediately, preventDefault.
   *  - Printable chars: IGNORE here — let onChange handle them to avoid double-firing.
   *    (On desktop, a keydown for 'h' also produces an onChange event.)
   *  - Navigation keys (Arrow, Shift+Arrow): let page.tsx global handler deal with them.
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
    // Printable chars: do nothing here — onChange will handle them
  };

  /**
   * onChange — fires for every printable character typed, on BOTH desktop and mobile.
   * We take the last character typed (input value accumulated since last clear),
   * process it, then reset the input value to "" so it stays ready for next char.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    // Always take the last character — handles mobile autocomplete adding multiple chars
    const char = val[val.length - 1];
    processKey(char);
    // Reset so next keystroke starts fresh
    e.target.value = '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full max-w-4xl mx-auto p-8 md:p-12 mt-4 rounded-2xl bg-gray-900/50 border border-gray-800/50 backdrop-blur-sm shadow-2xl cursor-text select-none"
      onClick={focusInput}
    >
      {/*
        Hidden input — the ONLY keyboard hook.
        - opacity-0 + w-0 h-0: invisible but still focusable and receives events.
        - autoCapitalize / autoCorrect / autoComplete / spellCheck all off to prevent
          mobile OS from mangling the input before we process it.
        - inputMode="text" opens the standard alphanumeric keyboard on iOS/Android.
        - position: fixed keeps it on-screen even on scroll so focus doesn't jump page.
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
        onBlur={() => {
          // Re-focus after brief delay to handle iOS keyboard dismiss on blur
          setTimeout(() => hiddenInputRef.current?.focus(), 100);
        }}
        className="fixed opacity-0 w-0 h-0 left-0 top-0 pointer-events-none"
        aria-label="Type the sentence shown"
        tabIndex={0}
      />

      {/* Character display */}
      <div className="flex flex-wrap gap-[1px]">
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
      <div className="mt-8 flex justify-between items-center text-sm font-mono text-gray-500">
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

      {/* Mobile tap hint — only shown on small screens */}
      <p className="mt-3 text-center text-xs text-gray-600 md:hidden">
        Tap here to open keyboard
      </p>
    </motion.div>
  );
}
