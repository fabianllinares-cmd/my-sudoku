import { generatePuzzle } from "./generator";
import type { Difficulty } from "./types";

interface GenerateRequest {
  type: "generate";
  difficulty: Difficulty;
}

self.onmessage = (event: MessageEvent<GenerateRequest>) => {
  const { difficulty } = event.data;
  try {
    const result = generatePuzzle(difficulty);
    self.postMessage({ type: "result", ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    self.postMessage({ type: "result", ok: false, error: message });
  }
};

export {};
