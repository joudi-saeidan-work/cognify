import { Dispatch, SetStateAction, useEffect } from "react";
import {
  Settings,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sun,
  Moon,
  Eye,
  ChevronUp,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface DisplaySettingsProps {
  zoomLevel: number;
  setZoomLevel: Dispatch<SetStateAction<number>>;
  colorBlindMode: boolean;
  setColorBlindMode: Dispatch<SetStateAction<boolean>>;
}

const DisplaySettings = ({
  zoomLevel,
  setZoomLevel,
  colorBlindMode,
  setColorBlindMode,
}: DisplaySettingsProps) => {
  const { theme, setTheme } = useTheme();

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 10, 50));

  const resetSettings = () => {
    setZoomLevel(110);
    setTheme("light");
    setColorBlindMode(false);
    document.body.classList.remove("accessible");
  };

  const toggleColorBlindMode = () => {
    const newMode = !colorBlindMode;
    setColorBlindMode(newMode);

    // Store the setting in localStorage for cross-page persistence
    localStorage.setItem("colorBlindMode", newMode ? "true" : "false");

    if (newMode) {
      document.body.classList.add("accessible");
    } else {
      document.body.classList.remove("accessible");
    }
  };

  // Also add an effect to initialize from localStorage on component mount
  useEffect(() => {
    const storedMode = localStorage.getItem("colorBlindMode");
    if (storedMode === "true") {
      setColorBlindMode(true);
      document.body.classList.add("accessible");
    } else if (storedMode === "false") {
      setColorBlindMode(false);
      document.body.classList.remove("accessible");
    }
  }, []);

  const handleSliderChange = (value: number[]) => {
    setZoomLevel(value[0]);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Display Settings"
        >
          <Settings className="h-4 w-4" />
          <span className="sr-only">Display settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 p-2 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-center justify-between pb-2">
          <DropdownMenuLabel className="text-sm font-semibold">
            Display Settings
          </DropdownMenuLabel>
        </div>

        <div className="py-2">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-sm font-medium">Zoom</span>
            <span className="text-sm font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {zoomLevel}%
            </span>
          </div>

          <div className="flex items-center space-x-2 px-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomOut}
              className="h-8 w-8 rounded-lg"
              disabled={zoomLevel <= 50}
              aria-label="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>

            <Slider
              value={[zoomLevel]}
              min={50}
              max={200}
              step={5}
              onValueChange={handleSliderChange}
              className="flex-1"
            />

            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomIn}
              className="h-8 w-8 rounded-lg"
              disabled={zoomLevel >= 200}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator className="my-2" />

        <div className="py-2">
          <p className="text-sm font-medium px-2 mb-2">Theme</p>
          <DropdownMenuItem
            onClick={() => setTheme("light")}
            className={cn(
              "flex items-center rounded-lg my-1 cursor-pointer transition-colors",
              theme === "light" && "bg-slate-100 dark:bg-slate-800"
            )}
            aria-label="Light Mode"
          >
            <div
              className="mr-2 h-5 w-5 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: theme === "light" ? "#FFFBCC" : "#4B5563",
              }}
            >
              <Sun
                className={cn(
                  "h-3.5 w-3.5",
                  theme === "light" ? "text-yellow-600" : "text-yellow-300"
                )}
              />
            </div>
            <span className="text-sm">Light Mode</span>
            {theme === "light" && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setTheme("dark")}
            className={cn(
              "flex items-center rounded-lg my-1 cursor-pointer transition-colors",
              theme === "dark" && "bg-slate-100 dark:bg-slate-800"
            )}
            aria-label="Dark Mode"
          >
            <div
              className="mr-2 h-5 w-5 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: theme === "dark" ? "#1E3A8A" : "#E5E7EB",
              }}
            >
              <Moon
                className={cn(
                  "h-3.5 w-3.5",
                  theme === "dark" ? "text-indigo-200" : "text-indigo-500"
                )}
              />
            </div>
            <span className="text-sm">Dark Mode</span>
            {theme === "dark" && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="my-2" />

        <div className="py-2">
          <DropdownMenuItem
            onClick={toggleColorBlindMode}
            className={cn(
              "flex items-center rounded-lg my-1 cursor-pointer transition-colors",
              colorBlindMode && "bg-slate-100 dark:bg-slate-800"
            )}
            aria-label="Color Blind Mode"
          >
            <div className="mr-2 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center">
              <Eye className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <span className="text-sm">Color Blind Mode</span>
            <div className="ml-auto">
              <div
                className={cn(
                  "w-8 h-4 rounded-full transition-colors flex items-center p-0.5",
                  colorBlindMode
                    ? "bg-green-500"
                    : "bg-slate-300 dark:bg-slate-700"
                )}
                aria-label="Color Blind Mode Toggle"
              >
                <div
                  className={cn(
                    "w-3 h-3 rounded-full bg-white transition-transform",
                    colorBlindMode && "translate-x-4"
                  )}
                />
              </div>
            </div>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="my-2" />

        <div className="py-2">
          <Button
            variant="outline"
            onClick={resetSettings}
            className="w-full flex justify-center items-center py-3 rounded-lg"
            aria-label="Reset Settings"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            <span>Reset Settings</span>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DisplaySettings;
