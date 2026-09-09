import { useState, useEffect, useCallback, useRef } from 'react';
import { useSoundEffects } from './useSoundEffects';
import { useGameStore } from '@/src/store/useGameStore';

export type CharacterState = 'pending' | 'correct' | 'error';

const PUNCTUATION = /^[.,!?'"–—\-\u2018\u2019\u201C\u201D]$/;

export function useTypingEngine(targetSentence: string) {
  const [cursorIndex, setCursorIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [mistakesThisSentence, setMistakesThisSentence] = useState(0);

  // Synchronously-updated refs so processKey always reads current state
  // without needing to be re-created on every render
  const cursorRef = useRef(cursorIndex);
  const hasErrorRef = useRef(hasError);
  const sentenceRef = useRef(targetSentence);
  cursorRef.current = cursorIndex;
  hasErrorRef.current = hasError;
  sentenceRef.current = targetSentence;

  const { playKeypress, playError } = useSoundEffects();
  const triggerReplay = useGameStore((state) => state.triggerReplay);
  const triggerReplayRef = useRef(triggerReplay);
  triggerReplayRef.current = triggerReplay;

  // Reset all state when sentence changes
  useEffect(() => {
    setCursorIndex(0);
    setHasError(false);
    setMistakesThisSentence(0);
  }, [targetSentence]);

  /**
   * processKey — the single source of truth for all input handling.
   * Called from both the hidden <input> (mobile + desktop) AND any programmatic triggers.
   * Reads state via refs so it never has stale closure values.
   */
  const processKey = useCallback((key: string) => {
    const cursorIndex = cursorRef.current;
    const hasError = hasErrorRef.current;
    const targetSentence = sentenceRef.current;

    if (key === 'Tab') {
      triggerReplayRef.current();
      return;
    }

    if (key === 'Escape') {
      setCursorIndex(0);
      setHasError(false);
      setMistakesThisSentence(0);
      return;
    }

    if (key === 'Backspace') {
      if (hasError) {
        setHasError(false);
        setMistakesThisSentence((prev) => Math.max(0, prev - 1));
      } else if (cursorIndex > 0) {
        setCursorIndex((prev) => prev - 1);
      }
      playKeypress();
      return;
    }

    if (cursorIndex >= targetSentence.length) return;

    if (key.length === 1) {
      // Auto-skip punctuation for non-punctuation keys
      let targetIndex = cursorIndex;
      if (!PUNCTUATION.test(key)) {
        while (targetIndex < targetSentence.length && PUNCTUATION.test(targetSentence[targetIndex])) {
          targetIndex++;
        }
      }

      // All remaining chars are punctuation → sentence complete
      if (targetIndex >= targetSentence.length) {
        setCursorIndex(targetSentence.length);
        setHasError(false);
        playKeypress();
        return;
      }

      const expectedChar = targetSentence[targetIndex];

      // Error state: only correct key clears it; everything else is blocked
      if (hasError) {
        if (key.toLowerCase() === expectedChar.toLowerCase()) {
          setCursorIndex(targetIndex + 1);
          setHasError(false);
          playKeypress();
        } else {
          playError();
        }
        return;
      }

      // Spacebar not expected → toggle pause (not an error)
      if (key === ' ' && expectedChar !== ' ') {
        useGameStore.getState().togglePause();
        return;
      }

      // Double-space guard
      if (key === ' ' && targetIndex > 0 && targetSentence[targetIndex - 1] === ' ') {
        return;
      }

      if (key.toLowerCase() === expectedChar.toLowerCase()) {
        setCursorIndex(targetIndex + 1);
        setHasError(false);
        playKeypress();
      } else {
        setHasError(true);
        setMistakesThisSentence((prev) => prev + 1);
        playError();
      }
    }
  }, [playKeypress, playError]); // stable — state is read via refs

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
    processKey,
  };
}
