export type Theme = "light" | "dark";

export const THEME_KEY = "my-sudoku:theme";
export const THEME_COLORS: Record<Theme, string> = {
  light: "#efe8db",
  dark: "#14161a",
};

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

function storage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

/** Stored choice wins; otherwise follow the device preference. */
export function loadTheme(): Theme {
  const stored = storage()?.getItem(THEME_KEY);
  if (isTheme(stored)) return stored;
  if (typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function saveTheme(theme: Theme): void {
  try {
    storage()?.setItem(THEME_KEY, theme);
  } catch {
    // Storage may be unavailable; the theme still applies for this session.
  }
}

export function nextTheme(theme: Theme): Theme {
  return theme === "light" ? "dark" : "light";
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);
}
