import { useState, useEffect, useCallback } from 'react';
import { useSoundEffects } from './useSoundEffects';
import { useGameStore } from '@/src/store/useGameStore';

export type CharacterState = 'pending' | 'correct' | 'error';

/**
 * Production-ready typing engine.
 *
 * Error model:
 *  - `cursorIndex` = how many chars have been correctly typed so far.
 *  - `hasError` = the user typed a wrong key at `cursorIndex`. The slot is highlighted
 *    red. The user MUST either Backspace (to stay on this slot) or type the
 *    correct key (which clears the error and advances). Either way, `cursorIndex`
 *    never advances on a wrong key — no phantom chars are appended.
 *  - `mistakesThisSentence` = lifetime wrong-key count for the current sentence.
 *    Resets to 0 when the sentence changes. Used for the hint system.
 */
export function useTypingEngine(targetSentence: string) {
  // Number of correctly confirmed characters
  const [cursorIndex, setCursorIndex] = useState(0);
  // Whether the current slot has an error (user pressed wrong key)
  const [hasError, setHasError] = useState(false);
  // Lifetime wrong-key presses this sentence (for hint/streak logic)
  const [mistakesThisSentence, setMistakesThisSentence] = useState(0);

  const { playKeypress, playError } = useSoundEffects();
  const triggerReplay = useGameStore((state) => state.triggerReplay);

  // Reset all state when sentence changes
  useEffect(() => {
    setCursorIndex(0);
    setHasError(false);
    setMistakesThisSentence(0);
  }, [targetSentence]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore modifier-only keys
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;

    // Tab → replay clip
    if (e.key === 'Tab') {
      e.preventDefault();
      triggerReplay();
      return;
    }

    // Escape → full reset
    if (e.key === 'Escape') {
      setCursorIndex(0);
      setHasError(false);
      setMistakesThisSentence(0);
      return;
    }

    // Backspace — go back one confirmed character, clear error
    if (e.key === 'Backspace') {
      if (hasError) {
        // Clear the error flag, stay on the same slot, undo the mistake count
        setHasError(false);
        setMistakesThisSentence((prev) => Math.max(0, prev - 1));
      } else if (cursorIndex > 0) {
        setCursorIndex((prev) => prev - 1);
      }
      playKeypress();
      return;
    }

    // Ignore anything beyond the sentence length
    if (cursorIndex >= targetSentence.length) return;

    if (e.key.length === 1) {
      // Determine the effective expected character, skipping punctuation auto-fill
      let targetIndex = cursorIndex;
      let autoFillCount = 0;
      const PUNCTUATION = /^[.,!?'"–—\-\u2018\u2019\u201C\u201D]$/;

      // If the user is NOT pressing punctuation, skip over any consecutive punctuation
      // in the target sentence and auto-accept them.
      if (!PUNCTUATION.test(e.key)) {
        while (targetIndex < targetSentence.length && PUNCTUATION.test(targetSentence[targetIndex])) {
          targetIndex++;
          autoFillCount++;
        }
      }

      // All remaining chars are punctuation — sentence is effectively complete
      if (targetIndex >= targetSentence.length) {
        setCursorIndex(targetSentence.length);
        setHasError(false);
        playKeypress();
        return;
      }

      const expectedChar = targetSentence[targetIndex];

      // If there's an active error, ONLY allow the correct key to clear it.
      // Block everything else (especially spacebar) to prevent side effects like pausing.
      if (hasError) {
        const isCorrectNow = e.key.toLowerCase() === expectedChar.toLowerCase();
        if (isCorrectNow) {
          setCursorIndex(targetIndex + 1);
          setHasError(false);
          playKeypress();
        } else {
          playError();
        }
        return;
      }

      // Spacebar when a space is NOT expected → toggle pause (don't count as error)
      if (e.key === ' ' && expectedChar !== ' ') {
        e.preventDefault();
        useGameStore.getState().togglePause();
        return;
      }

      // Double-space guard
      if (e.key === ' ' && targetIndex > 0 && targetSentence[targetIndex - 1] === ' ') {
        return;
      }

      const isCorrect = e.key.toLowerCase() === expectedChar.toLowerCase();

      if (isCorrect) {
        // Auto-fill skipped punctuation + advance past the correct char
        setCursorIndex(targetIndex + 1);
        setHasError(false);
        playKeypress();
      } else {
        // Wrong key: mark error on the current slot but DO NOT advance
        setHasError(true);
        setMistakesThisSentence((prev) => prev + 1);
        playError();
      }
    }
  }, [cursorIndex, hasError, targetSentence, triggerReplay, playKeypress, playError]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  /**
   * Returns the visual state for each character tile.
   * - correct   → index < cursorIndex
   * - error     → index === cursorIndex && hasError
   * - pending   → everything else
   */
  const getCharState = useCallback((index: number): CharacterState => {
    if (index < cursorIndex) return 'correct';
    if (index === cursorIndex && hasError) return 'error';
    return 'pending';
  }, [cursorIndex, hasError]);

  const isCompleted = cursorIndex >= targetSentence.length && !hasError;

  return {
    cursorIndex,
    hasError,
    mistakesThisSentence,
    getCharState,
    isCompleted,
  };
}
