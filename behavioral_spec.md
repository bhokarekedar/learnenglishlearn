# Behavioral Specification & Edge Case Blueprint

This document serves as the comprehensive guide for the video states, keyboard inputs, error logic, and difficulty scaling for our dictation game. It acts as a blueprint to ensure an optimal, highly-addictive user experience (UX) for language learners.

---

## 1. The Video & Playback State Machine

The core mechanic relies on slicing video/audio into precise sentence chunks and giving the user total control over playback without touching the mouse.

* **Auto-Looping / Playback Bounds:** When a sentence clip starts, it plays precisely from `startTime` to `endTime`. If the user has not finished typing it correctly, it should pause at `endTime`.
* **Rewind/Replay (Keyboard Control):**
  * Pressing `Tab` (or `Spacebar` in command mode) replays the *current sentence* from its `startTime`.
  * Pressing `Spacebar` while playing pauses the video.
* **Navigation:**
  * `Left Arrow`: Jump to the previous sentence.
  * `Right Arrow`: Jump to the next sentence (only allowed if the current one is completed, or if the user is in a "browse" mode).
* **Speed Control:** The user needs a hotkey (e.g., `Shift + Up/Down`) to toggle playback speeds: `1.0x -> 0.75x -> 0.5x`. Dictation apps require slow-motion for connected native speech.

---

## 2. Typing Engine & Error Handling Logic

The typing engine must act strictly but feel forgiving. 

**State Variables Needed:**
* `currentIndex`: Which character/word the user is currently typing.
* `currentErrors`: The number of uncorrected wrong keystrokes currently on the screen.
* `totalMistakesInSentence`: Total lifetime errors made on this sentence (used for triggering hints).

**Scenario A: User Types Correctly**
1. The character turns **Green** (or high-contrast white).
2. The `currentIndex` advances by 1.
3. A subtle mechanical click sound plays.
4. If it's the last character of the sentence, trigger a "Success Chime", increment the user's combo streak, and auto-advance to the next video clip after a short delay (e.g., 0.5s - 1.2s).

**Scenario B: User Makes a Mistake**
1. The character appears on screen but turns **Red**.
2. A subtle "thud" or error sound plays.
3. `currentErrors` increases by +1. `totalMistakesInSentence` increases by +1.
4. **The Block:** The cursor *advances* so the user sees the wrong letter, but they **cannot progress to the next word/sentence** until they hit `Backspace` to delete the red characters.
5. **Hint System:** If the user hits 3 consecutive errors (`totalMistakesInSentence >= 3`), a mascot or UI prompt pops up asking: *"Need help?"* (Allows the user to click for a hint or AI translation).

**Scenario C: User Fixes the Mistake (Backspace)**
1. The red character is removed.
2. `currentIndex` goes back by -1.
3. `currentErrors` goes down by -1 (until it hits 0).
4. Once `currentErrors == 0`, the user is back in a valid state and can resume typing correctly.

---

## 3. Edge Cases & Text Normalization (The "Frustration Killers")

To prevent users from rage-quitting over invisible formatting issues, the typing engine must gracefully handle edge cases.

* **Capitalization:** Dictation should be case-insensitive. If the video says "Hello", typing "h" should register as correct.
* **Punctuation:**
  * **Casual Mode:** Strip all commas, periods, and question marks from the `targetSentence` during evaluation. Auto-fill them in the UI as the user types past them.
  * **Strict Mode:** Make punctuation optional. If the word is `don't`, typing `dont` should automatically accept and insert the apostrophe for them.
* **Double Spaces:** If a user accidentally hits the spacebar twice, the engine must ignore the second space. Never count a double space as an error.
* **Trailing Spaces/Punctuation:** Do not require the user to hit space after the final word of the sentence to trigger the "Win" state. Ignore trailing punctuation for the win condition.

---

## 4. Dynamic Difficulty Scaling (The "i+1" Method)

To keep users hooked, the game will dynamically reduce hints as they get better. This relies on a `difficultyLevel` state (1 to 3):

* **Level 1 (Beginner):**
  * The input blanks are the exact width of the words (giving a visual hint of how long the word is).
  * A full native-language translation is shown below the video.
* **Level 2 (Intermediate):**
  * The input blanks shrink to a uniform thin line (no length hints).
  * Only difficult keyword definitions are shown.
* **Level 3 (Hardcore):**
  * Blank screen, no translation, no UI hints. Pure listening.

---

## 5. Gamification & Streaks (Visual Feedback)

To replicate a true "game feel":

* **Combo System:** Track a `currentStreak`. If the user completes 3, 5, or 10 sentences without triggering a red error, trigger a visual animation (confetti, or a mascot cheering).
* **Breaking the Streak:** If `currentErrors > 0`, reset the `currentStreak` to 0. Change the UI avatar to a "sad" or "focused" state.
