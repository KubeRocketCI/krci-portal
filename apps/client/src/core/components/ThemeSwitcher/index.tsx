import { Moon, Sun } from "lucide-react";
import { Button } from "../ui/button";
import { useTheme, toggleTheme } from "@/core/hooks/useTheme";

interface ThemeSwitcherProps {
  className?: string;
}

export const ThemeSwitcher = ({ className }: ThemeSwitcherProps = {}) => {
  const theme = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={className || "h-8 w-8 text-white hover:bg-white/10"}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
};
