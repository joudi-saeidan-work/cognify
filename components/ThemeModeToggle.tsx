// ModeToggle component
import * as React from "react";
import { Moon, Sun, Eye, EyeOff } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ModeToggleProps {
  colorBlindMode: boolean;
  setColorBlindMode: React.Dispatch<React.SetStateAction<boolean>>;
}
export function ThemeToggle({
  colorBlindMode,
  setColorBlindMode,
}: ModeToggleProps) {
  const { theme, setTheme } = useTheme();

  // Function to handle theme changes and reapply color-blind mode if enabled
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    if (colorBlindMode) {
      applyColorBlindMode();
    }
  };

  // Function to toggle color-blind-friendly mode
  const toggleColorBlindMode = () => {
    const newMode = !colorBlindMode;
    setColorBlindMode(newMode);
    if (newMode) {
      applyColorBlindMode();
    } else {
      document.body.classList.remove("accessible");
    }
  };

  // Function to apply color-blind-friendly mode settings
  const applyColorBlindMode = () => {
    document.body.classList.add("accessible");
  };

  React.useEffect(() => {
    // Apply color-blind mode on initial load if enabled
    if (colorBlindMode) {
      applyColorBlindMode();
    } else {
      document.body.classList.remove("accessible");
    }
  }, [colorBlindMode]);

  const dropdownBackgroundColor = colorBlindMode
    ? theme === "light"
      ? "bg-gray-50"
      : "bg-gray-800"
    : "bg-background";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={`${dropdownBackgroundColor}`}>
        <DropdownMenuItem
          onClick={() => handleThemeChange("light")}
          className={`${dropdownBackgroundColor}`}
        >
          Light
          <Sun className="ml-2 h-4 w-4" />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
          Dark
          <Moon className="ml-2 h-4 w-4" />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleColorBlindMode}>
          Color Blind Mode
          {colorBlindMode ? (
            <Eye className="ml-2 h-4 w-4 text-blue-500" />
          ) : (
            <EyeOff className="ml-2 h-4 w-4 text-gray-500" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
