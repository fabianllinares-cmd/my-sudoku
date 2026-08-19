/**
 * Active-play timer.
 *
 * Time is accumulated in segments that only run while the app is visible, so
 * background time is never counted. The state is a plain value with no
 * intervals: `runningSince` marks the start of the current active segment and
 * elapsed time is computed on demand. A dropped interval therefore cannot lose
 * or invent time.
 */
export interface TimerState {
  /** Active milliseconds banked from completed segments. */
  accumulatedMs: number;
  /** Start of the current active segment, or null while paused. */
  runningSince: number | null;
}

export function createTimer(accumulatedMs = 0): TimerState {
  return { accumulatedMs: Math.max(0, accumulatedMs), runningSince: null };
}

export function isRunning(timer: TimerState): boolean {
  return timer.runningSince !== null;
}

export function startTimer(timer: TimerState, now: number): TimerState {
  if (timer.runningSince !== null) return timer;
  return { accumulatedMs: timer.accumulatedMs, runningSince: now };
}

export function pauseTimer(timer: TimerState, now: number): TimerState {
  if (timer.runningSince === null) return timer;
  return { accumulatedMs: elapsedMs(timer, now), runningSince: null };
}

/** Total active time, including the segment in progress. */
export function elapsedMs(timer: TimerState, now: number): number {
  if (timer.runningSince === null) return timer.accumulatedMs;
  // Guard against clock adjustments moving `now` backwards.
  return timer.accumulatedMs + Math.max(0, now - timer.runningSince);
}
