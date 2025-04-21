"use client";

import * as React from "react";
import { Period, convert12HourTo24Hour } from "./time-picker-utils";
import { cn } from "@/lib/utils";

interface TimePeriodSelectProps {
  period: Period;
  setPeriod: (period: Period) => void;
  date: Date | null;
  setDate: (date: Date | null) => void;
  onLeftFocus?: () => void;
  onRightFocus?: () => void;
  className?: string;
}

export const TimePeriodSelect = React.forwardRef<
  HTMLButtonElement,
  TimePeriodSelectProps
>(
  (
    { period, setPeriod, date, setDate, onLeftFocus, onRightFocus, className },
    ref
  ) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "ArrowRight") onRightFocus?.();
      if (e.key === "ArrowLeft") onLeftFocus?.();
    };

    const handlePeriodChange = (newPeriod: Period) => {
      // Don't do anything if the period is not changing
      if (newPeriod === period) return;

      // Update the period state
      setPeriod(newPeriod);

      // Only update the date if we have one
      if (date) {
        const newDate = new Date(date);
        const currentHours = newDate.getHours();

        // Convert current hours to 12-hour format
        let hours12 = currentHours % 12;
        if (hours12 === 0) hours12 = 12;

        // Convert back to 24-hour format with the new period
        const newHours = convert12HourTo24Hour(hours12, newPeriod);

        // Update the date with the new hours
        newDate.setHours(newHours);
        setDate(newDate);
      }
    };

    return (
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className={cn(
          "flex rounded-md bg-transparent p-0.5 gap-0.5",
          className
        )}
        data-testid="period-select-wrapper"
      >
        <button
          type="button"
          onClick={() => handlePeriodChange("AM")}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-[48px] text-sm rounded transition-colors duration-200",
            period === "AM"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-label="AM"
        >
          AM
        </button>
        <button
          type="button"
          onClick={() => handlePeriodChange("PM")}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-[48px] text-sm rounded transition-colors duration-200",
            period === "PM"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-label="PM"
        >
          PM
        </button>
      </div>
    );
  }
);

TimePeriodSelect.displayName = "TimePeriodSelect";
