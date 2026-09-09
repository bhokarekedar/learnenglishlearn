import { create } from 'zustand';

export interface ClipConfig {
  id: string;
  videoPath: string;
  startTime: number;
  endTime: number;
  targetSentence: string;
}

interface GameState {
  status: 'idle' | 'playing' | 'completed';
  streak: number;
  currentClip: ClipConfig | null;
  hasStarted: boolean;
  replayTrigger: number;
  playbackRate: number;
  isPaused: boolean;
  setHasStarted: (val: boolean) => void;
  setCurrentClip: (clip: ClipConfig) => void;
  setStatus: (status: 'idle' | 'playing' | 'completed') => void;
  triggerReplay: () => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  setPlaybackRate: (rate: number) => void;
  togglePause: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  status: 'idle',
  streak: 0,
  currentClip: null,
  hasStarted: false,
  replayTrigger: 0,
  playbackRate: 1.0,
  isPaused: false,
  setHasStarted: (val) => set({ hasStarted: val }),
  setCurrentClip: (clip) => set({ currentClip: clip }),
  setStatus: (status) => set({ status }),
  triggerReplay: () => set((state) => ({ replayTrigger: state.replayTrigger + 1 })),
  incrementStreak: () => set((state) => ({ streak: state.streak + 1 })),
  resetStreak: () => set({ streak: 0 }),
  setPlaybackRate: (rate) => set({ playbackRate: rate }),
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
}));
