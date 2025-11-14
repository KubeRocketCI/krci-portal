import { Moon, Sun } from "lucide-react";
import { Button } from "../ui/button";
import { useSyncExternalStore } from "react";

const THEME_STORAGE_KEY = "theme";
const THEME_DARK = "dark";

const getCurrentTheme = (): "dark" | "light" => {
  if (typeof window === "undefined") return "light";
  return document.documentElement.classList.contains(THEME_DARK) ? "dark" : "light";
};

// Custom event for theme changes to avoid parent rerenders
const THEME_CHANGE_EVENT = "themechange";

const subscribe = (callback: () => void) => {
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  // Also listen to DOM changes (e.g., from other tabs)
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

export const ThemeSwitcher = () => {
  // useSyncExternalStore ensures only this component rerenders, not parents
  const theme = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const toggleTheme = () => {
    const root = document.documentElement;
    const isDark = root.classList.contains(THEME_DARK);

    if (isDark) {
      root.classList.remove(THEME_DARK);
      localStorage.setItem(THEME_STORAGE_KEY, "light");
    } else {
      root.classList.add(THEME_DARK);
      localStorage.setItem(THEME_STORAGE_KEY, THEME_DARK);
    }
    // Dispatch event to trigger rerender only in this component
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT));
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-8 w-8 text-white hover:bg-white/10"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
};
