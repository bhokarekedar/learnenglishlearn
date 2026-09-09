# ClipType (Working Title)

> **Core Concept:** A high-dopamine, browser-based dictation typing game where language learners watch 2–5 second cartoon clips and type what the characters say—inspired by Julebu and Monkeytype.

---

## 1. Product Overview

### The Problem
Traditional language listening exercises are passive and tedious. Learners struggle with real-world conversational speed, connected speech, and native accents.

### The Solution
A web-first typing arcade that turns popular cartoon dialogues into rapid-fire micro-challenges.

* **Input-Driven:** Focuses on muscle memory and dictation rather than multiple-choice tapping.
* **Tactile Feedback:** Instant mechanical key sounds, color-coded character validation, combo streaks, and sound effects.
* **Zero Video Overhead:** Plays time-synced clips directly via the YouTube IFrame API (zero hosting and zero streaming costs).

---

## 2. Tech Stack

* **Framework:** Next.js 14+ (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS + Radix UI / Lucide Icons + `framer-motion` (for animations & combo popups)
* **Audio Engine:** Web Audio API or `howler.js` (for zero-latency mechanical typing clicks and chime effects)
* **Video Playback:** YouTube IFrame Player API (`react-youtube` or raw postMessage wrapper)
* **State Management:** Zustand (for global game state, typing metrics, and settings)
* **Storage:** Browser `localStorage` (MVP zero-database footprint)
* **Deployment:** Vercel / Cloudflare Pages

---

## 3. Clip Data Schema

Each clip is stored as a lightweight JSON object. No backend database is required for the MVP.

```typescript
export interface Clip {
  id: string;                      // Unique slug: e.g., "spongebob-magic-conch-01"
  title: string;                   // "The Magic Conch Shell"
  sourceShow: string;              // "SpongeBob SquarePants"
  youtubeId: string;               // e.g., "dQw4w9WgXcQ"
  startTime: number;               // Seconds: e.g., 45.2
  endTime: number;                 // Seconds: e.g., 48.6
  targetSentence: string;          // Display sentence: "Maybe someday."
  normalizedSentence: string;      // Normalized for matching: "maybe someday"
  difficulty: "beginner" | "intermediate" | "advanced";
  character: string;               // "Squidward"
  hints?: string[];                // Optional token hints
}
```

---

## 4. Core Architecture & Game Loop

```
┌─────────────────────────────────────────────────────────────┐
│                        GAME STATE                           │
│                                                             │
│  [1. BUFFERING]  ──>  [2. PLAYING CLIP]  ──>  [3. TYPING]    │
│                                                     │       │
│                                                     ▼       │
│  [5. NEXT CLIP]  <──  [4. EVALUATION]   <──  Keydown Events │
│                       - Success Chime                       │
│                       - Streak++ / WPM                      │
└─────────────────────────────────────────────────────────────┘
```

### Typing Engine Rules

1. **Punctuation & Capitalization Handling:**
   * In *Casual Mode* (default): Ignore punctuation, apostrophes, and capitalization during input evaluation (e.g., typing `"dont"` matches `"don't"`).
   * In *Strict Mode*: Require exact case and punctuation.

2. **Real-Time Letter Validation:**
   * Current letter being typed shows an active caret (`|`).
   * Correct characters turn bright green / high-contrast white.
   * Incorrect characters flash soft red with a subtle shake animation.
   * Backspace correctly updates the index pointer without game breaks.

3. **Clip Looping:**
   * Pressing `Tab` or `Ctrl/Cmd + R` replays the audio snippet without resetting typed progress.
   * Optional toggle: Auto-loop clip every X seconds until the user finishes typing.

---

## 5. File Structure Blueprint

```text
├── public/
│   ├── audio/
│   │   ├── keypress.mp3       # Subtle mechanical switch click
│   │   ├── success.mp3        # Win chime
│   │   └── error.mp3          # Soft thud / wrong key sound
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Game arena
│   │   └── clips/page.tsx     # Clip selector / directory
│   ├── components/
│   │   ├── game/
│   │   │   ├── YouTubePlayer.tsx    # Headless / bounded player
│   │   │   ├── TypingArena.tsx      # Main typing interactive board
│   │   │   ├── CharacterTile.tsx    # Letter rendering & cursor
│   │   │   ├── ComboCounter.tsx     # Animated streak multiplier
│   │   │   └── AudioController.tsx  # SFX player engine
│   │   └── ui/                      # Buttons, Dialogs, Sliders
│   ├── data/
│   │   └── clips.json               # Seed list of 25–50 verified clips
│   ├── hooks/
│   │   ├── useTypingEngine.ts       # Input listener, caret index, accuracy math
│   │   └── useSoundEffects.ts       # Low-latency Web Audio player
│   ├── store/
│   │   └── useGameStore.ts          # Zustand store (currentClip, streak, userStats)
│   └── lib/
│       ├── textNormalizer.ts        # String sanitization & fuzzy punctuation matching
│       └── youtubeUtils.ts          # Timestamp bounds enforcement
```

---

## 6. Implementation Roadmap

### Phase 1: Core Typing Engine
* Initialize Next.js app with Tailwind CSS and Lucide Icons.
* Build `useTypingEngine.ts` to listen to window `keydown` events, track current index, typed text, error count, and completion state.
* Build `TypingArena.tsx` to display target sentence with Monkeytype-style smooth caret movement, using color states: pending (gray), correct (emerald), error (rose).
* Add sound effects using the Web Audio API for zero-latency mechanical keypress clicks.

### Phase 2: YouTube Sync & Seamless Looping
* Integrate YouTube IFrame API inside `YouTubePlayer.tsx`.
* Implement strict bounds enforcement to seek to `startTime` on clip load, monitor playback with an interval ticker, and pause/loop instantly when `currentTime >= endTime`.
* Add hotkeys: `Space` / `Tab` to replay current clip segment, `Esc` to clear input or pause.

### Phase 3: Game Feel & Polish
* Add dynamic combo streak animations (`x3`, `x5`, `Unstoppable!`).
* Design simple end-of-round stats modal for WPM, Accuracy %, and Listening Replays required.
* Save user progress in `localStorage` including completed clip IDs, current day streak, and total words typed.

### Phase 4: Curated Clip Library & Distribution
* Curate and verify 30 high-interest cartoon clips with clean audio (e.g., SpongeBob, Avatar, Gravity Falls).
* Store clips in `clips.json` categorized by difficulty (Easy, Medium, Native Speed).
* Deploy MVP to Vercel.
* Implement a 1-click "Share clip score to X/Twitter" link for organic reach.

---

## 7. Development Guidelines

1. **Typing mechanics first (`useTypingEngine.ts` and `TypingArena.tsx`):** Verify that typing feels snappy and tactile before wiring up video playback.
2. **Prioritize low audio latency:** Do not re-instantiate `new Audio()` on every keystroke; pre-decode sound buffers using the Web Audio API.
3. **Keep external dependencies minimal:** Avoid heavy backend frameworks or external auth providers until the core game loop is validated with real users.
