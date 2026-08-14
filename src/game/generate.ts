import { generatePuzzle } from "../engine";
import type { Difficulty, GeneratedPuzzle } from "../engine";

export function generatePuzzleAsync(difficulty: Difficulty): Promise<GeneratedPuzzle> {
  if (typeof Worker === "undefined") {
    return Promise.resolve(generatePuzzle(difficulty));
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("../engine/generateWorker.ts", import.meta.url), {
      type: "module",
    });

    const fallback = () => {
      worker.terminate();
      try {
        resolve(generatePuzzle(difficulty));
      } catch (error) {
        reject(error);
      }
    };

    const timer = window.setTimeout(fallback, 10000);

    worker.onmessage = (event: MessageEvent<{ ok: boolean; result?: GeneratedPuzzle; error?: string }>) => {
      window.clearTimeout(timer);
      worker.terminate();
      if (event.data.ok && event.data.result) resolve(event.data.result);
      else reject(new Error(event.data.error ?? "Generation failed"));
    };

    worker.onerror = () => {
      window.clearTimeout(timer);
      fallback();
    };

    worker.postMessage({ type: "generate", difficulty });
  });
}
