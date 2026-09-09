import { useState, useEffect, useCallback } from 'react';
import { useSoundEffects } from './useSoundEffects';
import { useGameStore } from '@/src/store/useGameStore';

export type CharacterState = 'pending' | 'correct' | 'error';

export function useTypingEngine(targetSentence: string) {
  const [typedChars, setTypedChars] = useState<string>('');
  const [currentErrors, setCurrentErrors] = useState(0); // Current red chars on screen
  const [totalMistakes, setTotalMistakes] = useState(0); // Lifetime mistakes
  const { playKeypress, playError } = useSoundEffects();
  const triggerReplay = useGameStore((state) => state.triggerReplay);

  useEffect(() => {
    setTypedChars('');
    setCurrentErrors(0);
    setTotalMistakes(0);
  }, [targetSentence]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore modifier keys
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;
    if (e.key === 'Tab') {
      e.preventDefault();
      triggerReplay();
      return;
    }

    if (e.key === 'Backspace') {
      if (typedChars.length > 0) {
        setTypedChars((prev) => prev.slice(0, -1));
        playKeypress();
        if (currentErrors > 0) {
          setCurrentErrors((prev) => prev - 1);
        }
      }
      return;
    }

    if (e.key === 'Escape') {
      setTypedChars('');
      setCurrentErrors(0);
      setTotalMistakes(0);
      return;
    }

    if (e.key.length === 1) { // Normal character
      // If we have errors on screen, block them from typing further until they backspace
      if (currentErrors > 0) {
        playError();
        return;
      }

      // Ignore double spaces completely
      if (e.key === ' ' && typedChars.endsWith(' ')) {
        return;
      }

      if (typedChars.length < targetSentence.length) {
        let currentTargetIndex = typedChars.length;
        let autoFilledPunctuation = '';
        const PUNCTUATION = /[.,!?'"-\u2018\u2019\u201C\u201D]/; // includes smart quotes

        // Auto-fill punctuation if the user types a letter or space
        if (!PUNCTUATION.test(e.key)) {
          while (currentTargetIndex < targetSentence.length && PUNCTUATION.test(targetSentence[currentTargetIndex])) {
            autoFilledPunctuation += targetSentence[currentTargetIndex];
            currentTargetIndex++;
          }
        }

        if (currentTargetIndex >= targetSentence.length) {
           setTypedChars((prev) => prev + autoFilledPunctuation);
           playKeypress();
           return;
        }

        const expectedChar = targetSentence[currentTargetIndex];
        const isCorrect = e.key.toLowerCase() === expectedChar.toLowerCase();

        if (isCorrect) {
          setTypedChars((prev) => prev + autoFilledPunctuation + e.key);
          playKeypress();
        } else {
          setTypedChars((prev) => prev + e.key);
          setCurrentErrors((prev) => prev + 1);
          setTotalMistakes((prev) => prev + 1);
          playError();
        }
      }
    }
  }, [typedChars, currentErrors, targetSentence, triggerReplay, playKeypress, playError]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const getCharState = (index: number): CharacterState => {
    if (index >= typedChars.length) return 'pending';
    const isErrorChar = index >= typedChars.length - currentErrors;
    return isErrorChar ? 'error' : 'correct';
  };

  return {
    typedChars,
    cursorIndex: typedChars.length,
    currentErrors,
    totalMistakes,
    getCharState,
    isCompleted: typedChars.length === targetSentence.length && currentErrors === 0,
  };
}
