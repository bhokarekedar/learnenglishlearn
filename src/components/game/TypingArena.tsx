'use client';

import { useTypingEngine } from "@/src/hooks/useTypingEngine";
import { CharacterTile } from "./CharacterTile";
import { useEffect } from "react";
import { useGameStore } from "@/src/store/useGameStore";
import { motion } from "framer-motion";

export function TypingArena({ targetSentence }: { targetSentence: string }) {
  const { cursorIndex, getCharState, isCompleted, totalMistakes, currentErrors } = useTypingEngine(targetSentence);
  const setStatus = useGameStore((state) => state.setStatus);

  useEffect(() => {
    if (isCompleted) {
      setStatus('completed');
    } else if (cursorIndex > 0 || currentErrors > 0) {
      setStatus('playing');
    } else {
      setStatus('idle');
    }
  }, [isCompleted, cursorIndex, currentErrors, setStatus]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto p-8 md:p-12 mt-16 rounded-2xl bg-gray-900/50 border border-gray-800/50 backdrop-blur-sm shadow-2xl"
    >
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
      
      <div className="mt-8 flex justify-between items-center text-sm font-mono text-gray-500">
        <div>Mistakes: <span className={totalMistakes > 0 ? "text-rose-400" : ""}>{totalMistakes}</span></div>
        {isCompleted && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-emerald-400 font-bold"
          >
            Perfect! Press Esc to retry.
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
