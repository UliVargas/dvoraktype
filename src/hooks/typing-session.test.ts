import { describe, expect, it } from "vitest";
import { computeStats, createTypingSession, typeText } from "./typing-session";

describe("typeText", () => {
  it("marks correct characters and advances", () => {
    const s = createTypingSession("ab");
    typeText(s, "a", 1000);
    expect(s.charStates).toEqual(["correct", "pending"]);
    expect(s.currentIndex).toBe(1);
    expect(s.isFinished).toBe(false);
  });

  it("marks a wrong character as an error without advancing", () => {
    const s = createTypingSession("ab");
    typeText(s, "x", 1000);
    expect(s.charStates).toEqual(["error", "pending"]);
    expect(s.currentIndex).toBe(0);
    expect(s.errorChars).toBe(1);
  });

  it("processes multi-character input strictly in order and finishes on the last one", () => {
    const s = createTypingSession("hola");
    typeText(s, "hol", 1000);
    expect(s.isFinished).toBe(false);
    typeText(s, "a", 2000);
    expect(s.charStates).toEqual(["correct", "correct", "correct", "correct"]);
    expect(s.isFinished).toBe(true);
  });

  it("ignores input after the text is finished", () => {
    const s = createTypingSession("a");
    typeText(s, "abc", 1000);
    expect(s.isFinished).toBe(true);
    expect(s.totalKeystrokes).toBe(1);
  });

  it("matches decomposed (NFD) input against precomposed text", () => {
    const s = createTypingSession("á");
    typeText(s, "a\u0301", 1000);
    expect(s.charStates).toEqual(["correct"]);
    expect(s.isFinished).toBe(true);
  });

  it("normalizes decomposed target text too", () => {
    const s = createTypingSession("ñu\u0308");
    expect(s.targetChars).toEqual(["ñ", "ü"]);
    typeText(s, "ñü", 1000);
    expect(s.isFinished).toBe(true);
  });

  it("starts the timer on the first keystroke", () => {
    const s = createTypingSession("ab");
    expect(s.startTime).toBe(0);
    typeText(s, "x", 5000);
    expect(s.startTime).toBe(5000);
    typeText(s, "a", 9000);
    expect(s.startTime).toBe(5000);
  });
});

describe("computeStats", () => {
  it("computes WPM as correct characters / 5 per elapsed minute, rounded", () => {
    const s = createTypingSession("a".repeat(60));
    typeText(s, "a".repeat(50), 0 + 1); // starts the clock at t=1ms
    // 50 correct chars = 10 words in 30 s → 20 WPM
    expect(computeStats(s, 1 + 30_000).wpm).toBe(20);
  });

  it("computes accuracy as correct characters / all keystrokes, rounded", () => {
    const s = createTypingSession("abc");
    typeText(s, "axbc", 1000);
    const stats = computeStats(s, 2000);
    expect(stats).toMatchObject({
      accuracy: 75,
      correctChars: 3,
      errorChars: 1,
      totalKeystrokes: 4,
      totalChars: 3,
      elapsedTime: 1000,
    });
  });

  it("reports 0 WPM and 100% accuracy before any keystroke", () => {
    const stats = computeStats(createTypingSession("abc"), 5000);
    expect(stats.wpm).toBe(0);
    expect(stats.accuracy).toBe(100);
    expect(stats.elapsedTime).toBe(0);
  });
});
