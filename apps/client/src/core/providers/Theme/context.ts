import React from "react";
import { ThemeContextProviderValue } from "./types";

export const ThemeContext = React.createContext<ThemeContextProviderValue>({
  theme: "light",
  setTheme: () => {
    //
  },
  toggleTheme: () => {
    //
  },
});

