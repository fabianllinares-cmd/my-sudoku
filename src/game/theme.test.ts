import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearMemoryStorage, useMemoryStorage } from "../test/memoryStorage";
import { applyTheme, isTheme, loadTheme, nextTheme, saveTheme, THEME_KEY } from "./theme";
import type { MemoryStorage } from "../test/memoryStorage";

describe("theme", () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = useMemoryStorage();
  });

  afterEach(() => {
    clearMemoryStorage();
  });

  it("defaults to light when nothing is stored", () => {
    expect(loadTheme()).toBe("light");
  });

  it("persists the selected theme", () => {
    saveTheme("dark");
    expect(storage.getItem(THEME_KEY)).toBe("dark");
    expect(loadTheme()).toBe("dark");
  });

  it("keeps the theme across a simulated app restart", () => {
    saveTheme("dark");
    const afterRestart = loadTheme();
    expect(afterRestart).toBe("dark");

    saveTheme("light");
    expect(loadTheme()).toBe("light");
  });

  it("ignores an unrecognised stored value", () => {
    storage.setItem(THEME_KEY, "neon");
    expect(loadTheme()).toBe("light");
  });

  it("toggles between light and dark", () => {
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("light");
  });

  it("validates theme values", () => {
    expect(isTheme("dark")).toBe(true);
    expect(isTheme("light")).toBe(true);
    expect(isTheme("sepia")).toBe(false);
    expect(isTheme(null)).toBe(false);
  });

  it("applies without a document present", () => {
    expect(() => applyTheme("dark")).not.toThrow();
  });

  it("works when storage is unavailable", () => {
    clearMemoryStorage();
    expect(() => saveTheme("dark")).not.toThrow();
    expect(loadTheme()).toBe("light");
  });
});
