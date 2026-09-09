import { cn } from "@/src/lib/utils";

interface CharacterTileProps {
  char: string;
  state: 'pending' | 'correct' | 'error';
  isActive: boolean;
}

export function CharacterTile({ char, state, isActive }: CharacterTileProps) {
  return (
    <span className="relative inline-block">
      {isActive && (
        <span className="absolute -left-[1px] top-[10%] bottom-[10%] w-[2px] bg-emerald-400 animate-pulse rounded-full" />
      )}
      <span
        className={cn(
          "text-3xl sm:text-4xl md:text-5xl font-mono tracking-wide transition-colors duration-150",
          state === 'pending' && "text-gray-600",
          state === 'correct' && "text-gray-100",
          state === 'error' && "text-rose-500 bg-rose-500/20 rounded-sm"
        )}
      >
        {char}
      </span>
    </span>
  );
}
