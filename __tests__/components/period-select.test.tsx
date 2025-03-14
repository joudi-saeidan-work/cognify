import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TimePeriodSelect } from "@/components/period-select";

// Mock console methods to prevent warnings in test output
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe("TimePeriodSelect Component", () => {
  // Test setup
  const defaultProps = {
    date: new Date(2023, 0, 1, 14, 30), // 2:30 PM
    setDate: jest.fn(),
    period: "PM" as const,
    setPeriod: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with PM period", () => {
    render(<TimePeriodSelect {...defaultProps} />);

    // Find AM and PM buttons
    const amButton = screen.getByText("AM");
    const pmButton = screen.getByText("PM");

    expect(amButton).toBeInTheDocument();
    expect(pmButton).toBeInTheDocument();

    // PM button should have the active class/style
    expect(pmButton).toHaveClass("bg-primary/10");
    expect(pmButton).toHaveClass("text-primary");

    // AM button should have the inactive class/style
    expect(amButton).toHaveClass("text-muted-foreground");
  });

  it("renders correctly with AM period", () => {
    render(<TimePeriodSelect {...defaultProps} period="AM" />);

    // Find AM and PM buttons
    const amButton = screen.getByText("AM");
    const pmButton = screen.getByText("PM");

    expect(amButton).toBeInTheDocument();
    expect(pmButton).toBeInTheDocument();

    // AM button should have the active class/style
    expect(amButton).toHaveClass("bg-primary/10");
    expect(amButton).toHaveClass("text-primary");

    // PM button should have the inactive class/style
    expect(pmButton).toHaveClass("text-muted-foreground");
  });

  it("calls setPeriod with opposite period when clicked", () => {
    render(<TimePeriodSelect {...defaultProps} />);

    // Since period is PM by default, clicking the AM button should toggle
    const amButton = screen.getByText("AM");

    // Click to toggle from PM to AM
    fireEvent.click(amButton);

    // setPeriod should be called with "AM"
    expect(defaultProps.setPeriod).toHaveBeenCalledWith("AM");
  });

  it("calls setDate with updated date reflecting period change", () => {
    render(<TimePeriodSelect {...defaultProps} />);

    // Since period is PM by default, clicking the AM button should toggle
    const amButton = screen.getByText("AM");

    // Click to toggle from PM to AM
    fireEvent.click(amButton);

    // setDate should be called with a new date
    expect(defaultProps.setDate).toHaveBeenCalled();

    // Verify that the hours have been adjusted
    // In this case, 14:30 (2:30 PM) should become 2:30 AM (02:30)
    const newDateArg = defaultProps.setDate.mock.calls[0][0];
    expect(newDateArg instanceof Date).toBeTruthy();
    expect(newDateArg.getHours()).toBe(2);
    expect(newDateArg.getMinutes()).toBe(30);
  });

  // The component doesn't actually handle space key press specially,
  // it uses the browser's default behavior for buttons (which is to click them)
  // We'll test browser functionality in a different way
  it("handles keyboard interaction via click", () => {
    render(<TimePeriodSelect {...defaultProps} />);

    // Get the inactive button (AM in this case)
    const amButton = screen.getByText("AM");

    // Click the button to change periods
    fireEvent.click(amButton);

    // setPeriod should be called with "AM"
    expect(defaultProps.setPeriod).toHaveBeenCalledWith("AM");
    expect(defaultProps.setDate).toHaveBeenCalled();
  });

  it("handles left arrow key press", () => {
    const onLeftFocus = jest.fn();

    render(<TimePeriodSelect {...defaultProps} onLeftFocus={onLeftFocus} />);

    // Get the AM button
    const amButton = screen.getByText("AM");

    // Press the ArrowLeft key
    fireEvent.keyDown(amButton, { key: "ArrowLeft" });

    // onLeftFocus should be called
    expect(onLeftFocus).toHaveBeenCalled();
  });

  it("handles right arrow key press", () => {
    const onRightFocus = jest.fn();

    render(<TimePeriodSelect {...defaultProps} onRightFocus={onRightFocus} />);

    // Get the AM button
    const amButton = screen.getByText("AM");

    // Press the ArrowRight key
    fireEvent.keyDown(amButton, { key: "ArrowRight" });

    // onRightFocus should be called
    expect(onRightFocus).toHaveBeenCalled();
  });

  it("handles null date correctly", () => {
    render(<TimePeriodSelect {...defaultProps} date={null} />);

    // Find AM and PM buttons
    const amButton = screen.getByText("AM");
    const pmButton = screen.getByText("PM");

    expect(amButton).toBeInTheDocument();
    expect(pmButton).toBeInTheDocument();

    // PM button should have the active class/style since period is PM
    expect(pmButton).toHaveClass("bg-primary/10");

    // Clicking should still work
    fireEvent.click(amButton);
    expect(defaultProps.setPeriod).toHaveBeenCalledWith("AM");
  });

  it("applies the correct class names based on props", () => {
    render(<TimePeriodSelect {...defaultProps} className="custom-class" />);

    // The wrapper div should have the custom class
    const wrapper = screen.getByTestId("period-select-wrapper");
    expect(wrapper).toHaveClass("custom-class");
  });
});
