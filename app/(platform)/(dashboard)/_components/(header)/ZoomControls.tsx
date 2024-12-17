import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/hint";

interface ZoomControlProps {
  zoomLevel: number;
  setZoomLevel: Dispatch<SetStateAction<number>>;
}

const ZoomControls = ({ zoomLevel, setZoomLevel }: ZoomControlProps) => {
  // Function to handle zooming in
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 10, 200));
  };

  // Function to handle zooming out
  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 10, 50));
  };

  return (
    <div>
      <Hint description="Zoom In">
        <Button
          onClick={handleZoomIn}
          className="p-2"
          aria-label="Zoom In"
          variant="ghost"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </Hint>

      <Hint description="Zoom Out">
        <Button
          onClick={handleZoomOut}
          className="p-2"
          aria-label="Zoom Out"
          variant="ghost"
        >
          <Minus className="h-5 w-5" />
        </Button>
      </Hint>
    </div>
  );
};
export default ZoomControls;
