"use client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose,
} from "@/components/ui/popover";
import { ElementRef, useRef } from "react";
import { FormPicker } from "./form-picker";

// used to create a board
interface PopOverProps {
  children: React.ReactNode;
  side?: "left" | "right" | "top" | "bottom";
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

export const FormPopOver = ({
  children,
  side = "bottom",
  align,
  sideOffset = 0,
}: PopOverProps) => {
  const closeRef = useRef<ElementRef<"button">>(null);

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        sideOffset={sideOffset}
        className="w-80 pt-3 "
      >
        <div className="text-sm font-medium text-neutral-600 pb-4">
          <PopoverClose ref={closeRef} />
          <FormPicker />
        </div>
      </PopoverContent>
    </Popover>
  );
};
