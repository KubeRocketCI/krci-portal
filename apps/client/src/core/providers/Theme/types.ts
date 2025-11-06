export const THEMES = {
  LIGHT: "light",
  DARK: "dark",
} as const;

export type Theme = "light" | "dark";

export interface ThemeContextProviderValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

