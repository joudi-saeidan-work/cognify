import { Dispatch, SetStateAction } from "react";
import { useTheme } from "next-themes";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/hint";

interface ResetProps {
  setZoomLevel: Dispatch<SetStateAction<number>>;
  setColorBlindMode: Dispatch<SetStateAction<boolean>>;
}

const ResetControls = ({ setZoomLevel, setColorBlindMode }: ResetProps) => {
  const { setTheme } = useTheme();
  // Function to reset all settings
  const handleReset = () => {
    setZoomLevel(110); // Reset zoom
    setTheme("light"); // Reset to light theme
    setColorBlindMode(false); // Reset color-blind mode
    document.body.classList.remove("accessible");
  };
  return (
    <div>
      <Hint description="Reset Appearances">
        <Button
          onClick={handleReset}
          className="p-2"
          aria-label="Reset"
          size="sm"
          variant="outline"
        >
          <RotateCcw />
        </Button>
      </Hint>
    </div>
  );
};
export default ResetControls;
