import { useSyncExternalStore } from "react";

const THEME_STORAGE_KEY = "theme";
const THEME_DARK = "dark";

const getCurrentTheme = (): "dark" | "light" => {
  if (typeof window === "undefined") return "light";
  return document.documentElement.classList.contains(THEME_DARK) ? "dark" : "light";
};

const THEME_CHANGE_EVENT = "themechange";

const subscribe = (callback: () => void) => {
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  const observer = new MutationObserver(() => {
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT));
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
    observer.disconnect();
  };
};

const getSnapshot = () => getCurrentTheme();

export const useTheme = (): "dark" | "light" => {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};

export const useMonacoTheme = (): "vs-dark" | "vs-light" => {
  const theme = useTheme();
  return theme === "dark" ? "vs-dark" : "vs-light";
};

export const toggleTheme = (): void => {
  const root = document.documentElement;
  const isDark = root.classList.contains(THEME_DARK);

  if (isDark) {
    root.classList.remove(THEME_DARK);
    localStorage.setItem(THEME_STORAGE_KEY, "light");
  } else {
    root.classList.add(THEME_DARK);
    localStorage.setItem(THEME_STORAGE_KEY, THEME_DARK);
  }
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT));
};
