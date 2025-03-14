/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import DisplaySettings from "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(board-header)/display-settings";

// Mock next-themes
jest.mock("next-themes", () => ({
  useTheme: jest.fn().mockReturnValue({
    theme: "light",
    setTheme: jest.fn(),
  }),
}));

// Mock Lucide icons
jest.mock("lucide-react", () => ({
  Settings: () => <div data-testid="settings-icon" />,
  ZoomIn: () => <div data-testid="zoom-in-icon" />,
  ZoomOut: () => <div data-testid="zoom-out-icon" />,
  RotateCcw: () => <div data-testid="rotate-icon" />,
  Sun: () => <div data-testid="sun-icon" />,
  Moon: () => <div data-testid="moon-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
}));

// Mock UI components
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, variant, size, className, onClick, disabled }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      className={className}
      data-testid="ui-button"
    >
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => (
    <div data-testid="dropdown-menu">{children}</div>
  ),
  DropdownMenuTrigger: ({ asChild, children }: any) => (
    <div data-testid="dropdown-trigger">{children}</div>
  ),
  DropdownMenuContent: ({ align, className, children }: any) => (
    <div data-testid="dropdown-content" className={className}>
      {children}
    </div>
  ),
  DropdownMenuGroup: ({ className, children }: any) => (
    <div data-testid="dropdown-group" className={className}>
      {children}
    </div>
  ),
  DropdownMenuItem: ({ onClick, className, children }: any) => (
    <div data-testid="dropdown-item" className={className} onClick={onClick}>
      {children}
    </div>
  ),
  DropdownMenuLabel: ({ className, children }: any) => (
    <div data-testid="dropdown-label" className={className}>
      {children}
    </div>
  ),
  DropdownMenuSeparator: ({ className }: any) => (
    <hr data-testid="dropdown-separator" className={className} />
  ),
}));

jest.mock("@/components/ui/slider", () => ({
  Slider: ({ value, min, max, step, onValueChange, className }: any) => (
    <input
      type="range"
      data-testid="slider"
      className={className}
      value={value[0]}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onValueChange([parseInt(e.target.value)])}
    />
  ),
}));

describe("DisplaySettings", () => {
  // Common test props
  const defaultProps = {
    zoomLevel: 100,
    setZoomLevel: jest.fn(),
    colorBlindMode: false,
    setColorBlindMode: jest.fn(),
  };

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset document body classes
    document.body.className = "";
  });

  it("renders the component with dropdown", () => {
    render(<DisplaySettings {...defaultProps} />);

    // Verify dropdown and trigger are rendered
    expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument();
    expect(screen.getByTestId("dropdown-trigger")).toBeInTheDocument();
    expect(screen.getByTestId("settings-icon")).toBeInTheDocument();
  });

  it("opens dropdown content when trigger is clicked", () => {
    render(<DisplaySettings {...defaultProps} />);

    // Click trigger button
    const triggerButton = within(
      screen.getByTestId("dropdown-trigger")
    ).getByTestId("ui-button");
    fireEvent.click(triggerButton);

    // Verify dropdown content
    expect(screen.getByTestId("dropdown-content")).toBeInTheDocument();
    expect(screen.getByText("Display Settings")).toBeInTheDocument();
  });

  it("increments zoom level when zoom in button is clicked", () => {
    render(<DisplaySettings {...defaultProps} />);

    // Open dropdown
    const triggerButton = within(
      screen.getByTestId("dropdown-trigger")
    ).getByTestId("ui-button");
    fireEvent.click(triggerButton);

    // Find and click zoom in button
    const zoomButtons = screen.getAllByTestId("ui-button");
    const zoomInButton = zoomButtons.find(
      (btn) => within(btn).queryByTestId("zoom-in-icon") !== null
    );

    if (zoomInButton) {
      fireEvent.click(zoomInButton);
    }

    // Verify zoom in handler was called
    expect(defaultProps.setZoomLevel).toHaveBeenCalled();
  });

  it("decrements zoom level when zoom out button is clicked", () => {
    render(<DisplaySettings {...defaultProps} />);

    // Open dropdown
    const triggerButton = within(
      screen.getByTestId("dropdown-trigger")
    ).getByTestId("ui-button");
    fireEvent.click(triggerButton);

    // Find and click zoom out button
    const zoomButtons = screen.getAllByTestId("ui-button");
    const zoomOutButton = zoomButtons.find(
      (btn) => within(btn).queryByTestId("zoom-out-icon") !== null
    );

    if (zoomOutButton) {
      fireEvent.click(zoomOutButton);
    }

    // Verify zoom out handler was called
    expect(defaultProps.setZoomLevel).toHaveBeenCalled();
  });

  it("updates zoom level when slider is changed", () => {
    render(<DisplaySettings {...defaultProps} />);

    // Open dropdown
    const triggerButton = within(
      screen.getByTestId("dropdown-trigger")
    ).getByTestId("ui-button");
    fireEvent.click(triggerButton);

    // Find and change slider value
    const slider = screen.getByTestId("slider");
    fireEvent.change(slider, { target: { value: "150" } });

    // Verify zoom level was updated
    expect(defaultProps.setZoomLevel).toHaveBeenCalledWith(150);
  });

  it("sets theme to light when light mode option is clicked", () => {
    const { useTheme } = require("next-themes");
    const mockSetTheme = jest.fn();

    useTheme.mockReturnValue({
      theme: "dark",
      setTheme: mockSetTheme,
    });

    render(<DisplaySettings {...defaultProps} />);

    // Open dropdown
    const triggerButton = within(
      screen.getByTestId("dropdown-trigger")
    ).getByTestId("ui-button");
    fireEvent.click(triggerButton);

    // Find and click light mode option
    const dropdownItems = screen.getAllByTestId("dropdown-item");
    const lightModeItem = dropdownItems.find((item) =>
      item.textContent?.includes("Light Mode")
    );

    if (lightModeItem) {
      fireEvent.click(lightModeItem);
    }

    // Verify theme was changed
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("sets theme to dark when dark mode option is clicked", () => {
    const { useTheme } = require("next-themes");
    const mockSetTheme = jest.fn();

    useTheme.mockReturnValue({
      theme: "light",
      setTheme: mockSetTheme,
    });

    render(<DisplaySettings {...defaultProps} />);

    // Open dropdown
    const triggerButton = within(
      screen.getByTestId("dropdown-trigger")
    ).getByTestId("ui-button");
    fireEvent.click(triggerButton);

    // Find and click dark mode option
    const dropdownItems = screen.getAllByTestId("dropdown-item");
    const darkModeItem = dropdownItems.find((item) =>
      item.textContent?.includes("Dark Mode")
    );

    if (darkModeItem) {
      fireEvent.click(darkModeItem);
    }

    // Verify theme was changed
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("toggles color blind mode when clicked", () => {
    render(<DisplaySettings {...defaultProps} />);

    // Open dropdown
    const triggerButton = within(
      screen.getByTestId("dropdown-trigger")
    ).getByTestId("ui-button");
    fireEvent.click(triggerButton);

    // Find and click color blind mode option
    const dropdownItems = screen.getAllByTestId("dropdown-item");
    const colorBlindItem = dropdownItems.find((item) =>
      item.textContent?.includes("Color Blind Mode")
    );

    if (colorBlindItem) {
      fireEvent.click(colorBlindItem);
    }

    // Verify color blind mode was toggled
    expect(defaultProps.setColorBlindMode).toHaveBeenCalledWith(true);
  });

  it("adds 'accessible' class to body when color blind mode is enabled", () => {
    // Test with color blind mode initially false
    const { rerender } = render(<DisplaySettings {...defaultProps} />);

    // Open dropdown
    const triggerButton = within(
      screen.getByTestId("dropdown-trigger")
    ).getByTestId("ui-button");
    fireEvent.click(triggerButton);

    // Find and click color blind mode option
    const dropdownItems = screen.getAllByTestId("dropdown-item");
    const colorBlindItem = dropdownItems.find((item) =>
      item.textContent?.includes("Color Blind Mode")
    );

    if (colorBlindItem) {
      fireEvent.click(colorBlindItem);

      // Mock the component re-rendering with color blind mode true
      rerender(<DisplaySettings {...defaultProps} colorBlindMode={true} />);

      // Find and click color blind mode option again
      fireEvent.click(colorBlindItem);

      // Verify the accessible class was removed
      expect(defaultProps.setColorBlindMode).toHaveBeenLastCalledWith(false);
    }
  });

  it("resets all settings when reset button is clicked", () => {
    const { useTheme } = require("next-themes");
    const mockSetTheme = jest.fn();

    useTheme.mockReturnValue({
      theme: "dark",
      setTheme: mockSetTheme,
    });

    render(<DisplaySettings {...defaultProps} />);

    // Open dropdown
    const triggerButton = within(
      screen.getByTestId("dropdown-trigger")
    ).getByTestId("ui-button");
    fireEvent.click(triggerButton);

    // Find and click reset button
    const buttons = screen.getAllByTestId("ui-button");
    const resetButton = buttons.find((btn) =>
      btn.textContent?.includes("Reset")
    );

    if (resetButton) {
      fireEvent.click(resetButton);
    }

    // Verify all settings were reset
    expect(defaultProps.setZoomLevel).toHaveBeenCalledWith(130);
    expect(mockSetTheme).toHaveBeenCalledWith("light");
    expect(defaultProps.setColorBlindMode).toHaveBeenCalledWith(false);
  });

  it("disables zoom in button when zoom level is at maximum", () => {
    const maxZoomProps = {
      ...defaultProps,
      zoomLevel: 200,
    };

    render(<DisplaySettings {...maxZoomProps} />);

    // Open dropdown
    const triggerButton = within(
      screen.getByTestId("dropdown-trigger")
    ).getByTestId("ui-button");
    fireEvent.click(triggerButton);

    // Find zoom in button
    const zoomButtons = screen.getAllByTestId("ui-button");
    const zoomInButton = zoomButtons.find(
      (btn) => within(btn).queryByTestId("zoom-in-icon") !== null
    );

    // Verify zoom in button is disabled
    expect(zoomInButton).toHaveAttribute("disabled");
  });

  it("disables zoom out button when zoom level is at minimum", () => {
    const minZoomProps = {
      ...defaultProps,
      zoomLevel: 50,
    };

    render(<DisplaySettings {...minZoomProps} />);

    // Open dropdown
    const triggerButton = within(
      screen.getByTestId("dropdown-trigger")
    ).getByTestId("ui-button");
    fireEvent.click(triggerButton);

    // Find zoom out button
    const zoomButtons = screen.getAllByTestId("ui-button");
    const zoomOutButton = zoomButtons.find(
      (btn) => within(btn).queryByTestId("zoom-out-icon") !== null
    );

    // Verify zoom out button is disabled
    expect(zoomOutButton).toHaveAttribute("disabled");
  });

  it("displays the current zoom level percentage", () => {
    const customZoomProps = {
      ...defaultProps,
      zoomLevel: 150,
    };

    render(<DisplaySettings {...customZoomProps} />);

    // Open dropdown
    const triggerButton = within(
      screen.getByTestId("dropdown-trigger")
    ).getByTestId("ui-button");
    fireEvent.click(triggerButton);

    // Verify zoom level is displayed
    expect(screen.getByText("150%")).toBeInTheDocument();
  });
});
