import { describe, expect, it } from "vitest";
import { createTimer, elapsedMs, isRunning, pauseTimer, startTimer } from "./timer";

describe("active play timer", () => {
  it("starts paused with no time", () => {
    const timer = createTimer();
    expect(isRunning(timer)).toBe(false);
    expect(elapsedMs(timer, 10_000)).toBe(0);
  });

  it("accumulates only while running", () => {
    const started = startTimer(createTimer(), 1_000);
    expect(isRunning(started)).toBe(true);
    expect(elapsedMs(started, 4_000)).toBe(3_000);

    const paused = pauseTimer(started, 4_000);
    expect(isRunning(paused)).toBe(false);
    expect(elapsedMs(paused, 4_000)).toBe(3_000);
  });

  it("does not count time while paused", () => {
    let timer = startTimer(createTimer(), 0);
    timer = pauseTimer(timer, 3_000);
    // Simulate a minute in the background.
    expect(elapsedMs(timer, 63_000)).toBe(3_000);

    timer = startTimer(timer, 63_000);
    expect(elapsedMs(timer, 64_000)).toBe(4_000);
  });

  it("sums several active segments and ignores the gaps", () => {
    let timer = createTimer();
    const segments: [number, number][] = [
      [0, 5_000],
      [60_000, 62_000],
      [120_000, 123_500],
    ];
    for (const [start, stop] of segments) {
      timer = startTimer(timer, start);
      timer = pauseTimer(timer, stop);
    }
    expect(elapsedMs(timer, 999_999)).toBe(10_500);
  });

  it("ignores a repeated start so a stray resume cannot double count", () => {
    const started = startTimer(createTimer(), 1_000);
    const again = startTimer(started, 5_000);
    expect(again).toBe(started);
    expect(elapsedMs(again, 6_000)).toBe(5_000);
  });

  it("ignores a repeated pause", () => {
    const paused = pauseTimer(startTimer(createTimer(), 0), 2_000);
    expect(pauseTimer(paused, 9_000)).toBe(paused);
  });

  it("resumes from a restored accumulated total", () => {
    const restored = createTimer(42_000);
    expect(isRunning(restored)).toBe(false);
    const running = startTimer(restored, 500_000);
    expect(elapsedMs(running, 501_500)).toBe(43_500);
  });

  it("survives a clock that jumps backwards", () => {
    const running = startTimer(createTimer(7_000), 10_000);
    expect(elapsedMs(running, 9_000)).toBe(7_000);
  });

  it("never restores a negative total", () => {
    expect(createTimer(-5).accumulatedMs).toBe(0);
  });
});
