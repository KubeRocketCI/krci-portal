import React from "react";
import { ThemeContext } from "./context";
import { Theme, ThemeContextProviderValue } from "./types";

const THEME_STORAGE_KEY = "theme";
const THEME_DARK = "dark";
const THEME_LIGHT = "light";

const getInitialTheme = (): Theme => {
  // Check localStorage first
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === THEME_DARK || stored === THEME_LIGHT) {
    return stored as Theme;
  }
  // Check system preference
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return THEME_DARK;
  }
  return THEME_LIGHT;
};

const updateThemeInDOM = (newTheme: Theme) => {
  const root = document.documentElement;
  if (newTheme === THEME_DARK) {
    root.classList.add(THEME_DARK);
  } else {
    root.classList.remove(THEME_DARK);
  }
  localStorage.setItem(THEME_STORAGE_KEY, newTheme);
};

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    const initialTheme = getInitialTheme();
    // Initialize DOM on mount
    if (typeof window !== "undefined") {
      updateThemeInDOM(initialTheme);
    }
    return initialTheme;
  });

  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    updateThemeInDOM(newTheme);
  }, []);

  const toggleTheme = React.useCallback(() => {
    setThemeState((prev: Theme) => {
      const newTheme = prev === THEME_DARK ? THEME_LIGHT : THEME_DARK;
      updateThemeInDOM(newTheme);
      return newTheme;
    });
  }, []);

  const value: ThemeContextProviderValue = React.useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
