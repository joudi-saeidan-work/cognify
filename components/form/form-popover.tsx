"use client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ElementRef, useRef } from "react";
import { FormPicker } from "./form-picker";
import { PopoverClose } from "@radix-ui/react-popover";

// used to create a board
interface PopOverProps {
  children: React.ReactNode;
  side?: "left" | "right" | "top" | "bottom";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  board?: any;
}

export const FormPopOver = ({
  children,
  side = "bottom",
  align,
  sideOffset = 0,
  board,
}: PopOverProps) => {
  const closeRef = useRef<ElementRef<"button">>(null);

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        sideOffset={sideOffset}
        className="w-80 h-full pt-3 "
        aria-label="Form Popover"
      >
        <div className="text-sm font-medium text-neutral-600 pb-4">
          <FormPicker data={board} />
        </div>
      </PopoverContent>
    </Popover>
  );
};
