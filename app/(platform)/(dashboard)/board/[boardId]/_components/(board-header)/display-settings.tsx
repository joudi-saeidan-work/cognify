import { Dispatch, SetStateAction } from "react";
import {
  Settings,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sun,
  Moon,
  Eye,
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
    if (newMode) {
      document.body.classList.add("accessible");
    } else {
      document.body.classList.remove("accessible");
    }
  };

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
          <Button
            variant="ghost"
            size="sm"
            onClick={resetSettings}
            className="h-8 px-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Reset Settings"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset
          </Button>
        </div>
        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuGroup className="pb-2 pt-1 px-1">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Zoom</span>
              <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {zoomLevel}%
              </span>
            </div>

            <div className="flex items-center space-x-2 px-1">
              <Button
                variant="outline"
                size="icon"
                onClick={handleZoomOut}
                className="h-7 w-7 rounded-lg"
                disabled={zoomLevel <= 50}
                aria-label="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
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
                className="h-7 w-7 rounded-lg"
                disabled={zoomLevel >= 200}
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-1" />

        <div className="py-1">
          <p className="text-xs font-medium mb-1 px-2">Theme</p>
          <DropdownMenuItem
            onClick={() => setTheme("light")}
            className={cn(
              "flex items-center rounded-lg my-1 cursor-pointer transition-colors",
              theme === "light" && "bg-slate-100 dark:bg-slate-800"
            )}
            aria-label="Light Mode"
          >
            <div className="mr-2 h-5 w-5 rounded-full bg-yellow-100 flex items-center justify-center">
              <Sun className="h-3.5 w-3.5 text-yellow-600" />
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
            <div className="mr-2 h-5 w-5 rounded-full bg-indigo-900 flex items-center justify-center">
              <Moon className="h-3.5 w-3.5 text-indigo-200" />
            </div>
            <span className="text-sm">Dark Mode</span>
            {theme === "dark" && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="my-1" />

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
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DisplaySettings;
