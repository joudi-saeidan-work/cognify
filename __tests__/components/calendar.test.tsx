import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

// Set Jest timeout globally for this file
jest.setTimeout(10000);

// Instead of mocking the entire DayPicker component, we'll mock just the
// specific behaviors we need while preserving the component's actual structure
jest.mock("react-day-picker", () => {
  // Create a simplified version of DayPicker that we can spy on
  const DayPicker = ({
    mode,
    selected,
    onSelect,
    disabled,
    showOutsideDays,
    className,
    classNames,
    components,
    ...props
  }: any) => {
    // This part verifies that all props are passed correctly
    return (
      <div
        data-testid="day-picker"
        data-mode={mode}
        data-selected={
          selected instanceof Date ? selected.toISOString() : selected
        }
        data-show-outside-days={showOutsideDays}
        className={className}
      >
        {/* Navigation section */}
        <div className="navigation">
          <button
            className={
              classNames?.nav_button + " " + classNames?.nav_button_previous
            }
            onClick={() => {}}
            aria-label="Go to previous month"
            data-testid="prev-month"
          >
            {components?.IconLeft && (
              <components.IconLeft data-testid="icon-left" />
            )}
          </button>
          <div className={classNames?.caption_label} data-testid="caption">
            June 2023
          </div>
          <button
            className={
              classNames?.nav_button + " " + classNames?.nav_button_next
            }
            onClick={() => {}}
            aria-label="Go to next month"
            data-testid="next-month"
          >
            {components?.IconRight && (
              <components.IconRight data-testid="icon-right" />
            )}
          </button>
        </div>

        {/* Calendar grid */}
        <table className={classNames?.table}>
          <tbody>
            <tr className={classNames?.row}>
              <td className={classNames?.cell}>
                <button
                  className={`${classNames?.day} ${
                    selected && selected.getDate() === 15
                      ? classNames?.day_selected
                      : ""
                  } ${
                    new Date().getDate() === 15 ? classNames?.day_today : ""
                  }`}
                  onClick={() => onSelect(new Date(2023, 5, 15))}
                  disabled={disabled?.(new Date(2023, 5, 15))}
                  data-testid="day-15"
                  aria-selected={selected && selected.getDate() === 15}
                >
                  15
                </button>
              </td>
              <td className={classNames?.cell}>
                <button
                  className={`${classNames?.day} ${
                    selected && selected.getDate() === 20
                      ? classNames?.day_selected
                      : ""
                  }`}
                  onClick={() => onSelect(new Date(2023, 5, 20))}
                  disabled={disabled?.(new Date(2023, 5, 20))}
                  data-testid="day-20"
                >
                  20
                </button>
              </td>
              <td className={`${classNames?.cell}`}>
                <button
                  className={`${classNames?.day} ${classNames?.day_outside}`}
                  onClick={() => onSelect(new Date(2023, 4, 30))}
                  data-testid="outside-day"
                >
                  30
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return {
    DayPicker,
  };
});

describe("Calendar Component", () => {
  beforeEach(() => {
    // Set a fixed date for consistent testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2023, 5, 15)); // June 15, 2023
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the calendar with default props", () => {
    render(<Calendar />);

    const dayPicker = screen.getByTestId("day-picker");

    // Verify default props are passed correctly
    expect(dayPicker).toHaveAttribute("data-show-outside-days", "true");
    expect(dayPicker.className).toContain("p-3");
  });

  it("passes className to DayPicker correctly", () => {
    render(<Calendar className="custom-class" />);

    const dayPicker = screen.getByTestId("day-picker");
    expect(dayPicker.className).toContain("custom-class");
    expect(dayPicker.className).toContain("p-3"); // Default class should still be there
  });

  it("passes showOutsideDays prop correctly", () => {
    render(<Calendar showOutsideDays={false} />);

    const dayPicker = screen.getByTestId("day-picker");
    expect(dayPicker).toHaveAttribute("data-show-outside-days", "false");
  });

  it("applies correct classes to nav buttons", () => {
    render(<Calendar />);

    const prevButton = screen.getByTestId("prev-month");
    const nextButton = screen.getByTestId("next-month");

    // Test that our button variant classes are applied
    expect(prevButton.className).toContain("bg-transparent");
    expect(prevButton.className).toContain("opacity-50");
    expect(nextButton.className).toContain("bg-transparent");
    expect(nextButton.className).toContain("opacity-50");
  });

  it("renders custom icon components", () => {
    render(<Calendar />);

    // Verify the custom icons are rendered
    expect(screen.getByTestId("icon-left")).toBeInTheDocument();
    expect(screen.getByTestId("icon-right")).toBeInTheDocument();
  });

  it("applies selected day styling", () => {
    const selectedDate = new Date(2023, 5, 15);
    render(<Calendar selected={selectedDate} />);

    const day15 = screen.getByTestId("day-15");

    // Should have aria-selected attribute
    expect(day15).toHaveAttribute("aria-selected", "true");

    // Check for the blue background and white text classes from Calendar component
    // Looking at the actual Calendar component code for these class names
    expect(day15.className).toContain("bg-blue-600");
    expect(day15.className).toContain("text-white");
    expect(day15.className).toContain("rounded-full");
  });

  it("calls onSelect when a day is clicked", () => {
    const onSelect = jest.fn();
    render(<Calendar mode="single" onSelect={onSelect} />);

    fireEvent.click(screen.getByTestId("day-20"));

    expect(onSelect).toHaveBeenCalledWith(expect.any(Date));
    const selectedDate = onSelect.mock.calls[0][0];
    expect(selectedDate.getDate()).toBe(20);
    expect(selectedDate.getMonth()).toBe(5); // June is 5 (0-indexed)
    expect(selectedDate.getFullYear()).toBe(2023);
  });

  it("applies today's date styling", () => {
    render(<Calendar />);

    const day15 = screen.getByTestId("day-15");

    // Looking at the actual "day_today" class definition in Calendar component
    expect(day15.className).toContain("bg-gray-200");
    expect(day15.className).toContain("text-foreground");
    expect(day15.className).toContain("rounded-full");
    expect(day15.className).toContain("font-semibold");
  });

  it("properly disables dates", () => {
    const disabledFn = (date: Date) => date.getDate() > 15;

    render(<Calendar disabled={disabledFn} />);

    // Day 15 should be enabled
    expect(screen.getByTestId("day-15")).not.toBeDisabled();

    // Day 20 should be disabled
    expect(screen.getByTestId("day-20")).toBeDisabled();
  });

  it("handles outside days correctly", () => {
    render(<Calendar showOutsideDays={true} />);

    const outsideDay = screen.getByTestId("outside-day");

    // Looking at the actual "day_outside" class definition in Calendar component
    expect(outsideDay.className).toContain("day-outside");
    expect(outsideDay.className).toContain("text-muted-foreground");
  });

  it("passes custom classNames to DayPicker", () => {
    const customClassNames = {
      day: "custom-day-class",
      day_selected: "custom-selected-class",
    };

    render(<Calendar classNames={customClassNames} />);

    const day15 = screen.getByTestId("day-15");
    expect(day15.className).toContain("custom-day-class");
  });
});
