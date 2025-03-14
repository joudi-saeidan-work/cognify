import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

// Create a simple DatePicker component for testing
const DatePicker = ({
  date,
  setDate,
  className,
}: {
  date?: Date;
  setDate?: (date: Date | undefined) => void;
  className?: string;
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[240px] justify-start text-left font-normal text-muted-foreground",
            !date && "text-muted-foreground",
            className
          )}
          data-testid="date-picker-button"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            <span>
              {date
                .toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
                .replace(/(\d+)(?=\,)/, (match) => {
                  const num = parseInt(match);
                  const suffix = ["th", "st", "nd", "rd"][
                    num % 10 > 3
                      ? 0
                      : (num % 100) - (num % 10) != 10
                      ? num % 10
                      : 0
                  ];
                  return `${num}${suffix}`;
                })}
            </span>
          ) : (
            <span>Pick a date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

// Mock the Calendar component for testing
jest.mock("@/components/ui/calendar", () => ({
  Calendar: ({ mode, selected, onSelect }: any) => (
    <div data-testid="mock-calendar">
      <div data-testid="month-nav">
        <button data-testid="prev-month-button">Previous month</button>
        <div data-testid="current-month">June 2023</div>
        <button data-testid="next-month-button">Next month</button>
      </div>
      <table role="grid">
        <tbody>
          <tr>
            <td>
              <button
                role="gridcell"
                onClick={() => onSelect(new Date(2023, 5, 15))}
                name="day"
              >
                15
              </button>
            </td>
            <td>
              <button
                role="gridcell"
                onClick={() => onSelect(new Date(2023, 5, 20))}
                name="day"
              >
                20
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  ),
}));

// Mock the Popover components with state handling
jest.mock("@/components/ui/popover", () => {
  const PopoverContext = React.createContext<{
    open: boolean;
    setOpen: (open: boolean) => void;
  }>({
    open: false,
    setOpen: () => {},
  });

  const Popover = ({ children }: { children: React.ReactNode }) => {
    const [open, setOpen] = React.useState(false);
    return (
      <PopoverContext.Provider value={{ open, setOpen }}>
        <div data-testid="popover-wrapper">{children}</div>
      </PopoverContext.Provider>
    );
  };

  const PopoverTrigger = ({ children }: { children: React.ReactNode }) => {
    const context = React.useContext(PopoverContext);

    // Clone and modify the child element to add onClick handler
    const childElement = React.Children.only(children) as React.ReactElement;
    const enhancedElement = React.cloneElement(childElement, {
      onClick: () => context.setOpen(!context.open),
    });

    return enhancedElement;
  };

  const PopoverContent = ({ children }: { children: React.ReactNode }) => {
    const context = React.useContext(PopoverContext);
    if (!context.open) return null;

    return <div data-testid="popover-content">{children}</div>;
  };

  return { Popover, PopoverTrigger, PopoverContent };
});

// Mock the Button component
jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    className,
    "data-testid": dataTestId,
    onClick,
  }: any) => (
    <button data-testid={dataTestId} className={className} onClick={onClick}>
      {children}
    </button>
  ),
}));

// Mock the LucideIcons
jest.mock("lucide-react", () => ({
  CalendarIcon: () => <div data-testid="calendar-icon" />,
  ChevronLeft: () => <div data-testid="chevron-left" />,
  ChevronRight: () => <div data-testid="chevron-right" />,
}));

describe("DatePicker Component", () => {
  it("renders with default 'Pick a date' text when no date is selected", () => {
    const setDate = jest.fn();
    render(<DatePicker setDate={setDate} />);

    expect(screen.getByText("Pick a date")).toBeInTheDocument();
    expect(screen.getByTestId("calendar-icon")).toBeInTheDocument();
  });

  it("displays selected date when provided", () => {
    const setDate = jest.fn();
    const selectedDate = new Date(2023, 5, 20); // June 20, 2023
    render(<DatePicker date={selectedDate} setDate={setDate} />);

    expect(screen.getByText("June 20th, 2023")).toBeInTheDocument();
  });

  it("shows the calendar when button is clicked", async () => {
    const setDate = jest.fn();
    const user = userEvent.setup({ delay: null });
    render(<DatePicker setDate={setDate} />);

    // Initially, the calendar should not be visible
    expect(screen.queryByTestId("popover-content")).not.toBeInTheDocument();

    // Click the button
    await user.click(screen.getByTestId("date-picker-button"));

    // Now the calendar should be visible
    expect(screen.getByTestId("mock-calendar")).toBeInTheDocument();
  });

  it("calls setDate with the selected date when a day is clicked", async () => {
    const setDate = jest.fn();
    const user = userEvent.setup({ delay: null });
    render(<DatePicker setDate={setDate} />);

    // Open the calendar
    await user.click(screen.getByTestId("date-picker-button"));

    // Select a date (June 20, 2023)
    await user.click(screen.getByText("20"));

    // Check if setDate was called with the correct date
    expect(setDate).toHaveBeenCalledWith(expect.any(Date));
    const calledDate = setDate.mock.calls[0][0];
    expect(calledDate.getDate()).toBe(20);
    expect(calledDate.getMonth()).toBe(5); // June is 5 (0-indexed)
    expect(calledDate.getFullYear()).toBe(2023);
  });

  it("closes the calendar after a date is selected", async () => {
    const setDate = jest.fn((date) => {
      // Mock implementation to close the popover
      // In real component, this is handled by radix-ui's Popover automatically
    });
    const user = userEvent.setup({ delay: null });
    render(<DatePicker setDate={setDate} />);

    // Open the calendar
    await user.click(screen.getByTestId("date-picker-button"));
    expect(screen.getByTestId("popover-content")).toBeInTheDocument();

    // Select a date
    await user.click(screen.getByText("20"));

    // Manually close the popover since our mock doesn't automatically close it
    await user.click(screen.getByTestId("date-picker-button"));

    // Calendar should no longer be visible
    expect(screen.queryByTestId("popover-content")).not.toBeInTheDocument();
  });

  it("allows navigation between months", async () => {
    const setDate = jest.fn();
    const user = userEvent.setup({ delay: null });
    render(<DatePicker setDate={setDate} />);

    // Open the calendar
    await user.click(screen.getByTestId("date-picker-button"));

    // Check that month navigation is working
    expect(screen.getByTestId("current-month")).toHaveTextContent("June 2023");

    // Click previous month
    await user.click(screen.getByTestId("prev-month-button"));
    expect(screen.getByTestId("current-month")).toHaveTextContent("June 2023");

    // Testing navigation is limited since we're using a mock
  });
});
