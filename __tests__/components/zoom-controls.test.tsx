/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ZoomControls from "../../app/(platform)/(dashboard)/_components/(header)/ZoomControls";

// Mock Hint component
jest.mock("@/components/hint", () => ({
  Hint: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Plus: () => <div data-testid="plus-icon" />,
  Minus: () => <div data-testid="minus-icon" />,
}));

describe("ZoomControls", () => {
  const mockSetZoomLevel = jest.fn();

  beforeEach(() => {
    // Reset mock function before each test
    mockSetZoomLevel.mockReset();
  });

  it("renders zoom in and zoom out buttons", () => {
    render(<ZoomControls zoomLevel={100} setZoomLevel={mockSetZoomLevel} />);

    // Check for zoom in button
    const zoomInButton = screen.getByRole("button", { name: /zoom in/i });
    expect(zoomInButton).toBeInTheDocument();
    expect(screen.getByTestId("plus-icon")).toBeInTheDocument();

    // Check for zoom out button
    const zoomOutButton = screen.getByRole("button", { name: /zoom out/i });
    expect(zoomOutButton).toBeInTheDocument();
    expect(screen.getByTestId("minus-icon")).toBeInTheDocument();
  });

  it("calls setZoomLevel with increased value when zoom in is clicked", () => {
    render(<ZoomControls zoomLevel={100} setZoomLevel={mockSetZoomLevel} />);

    // Click the zoom in button
    const zoomInButton = screen.getByRole("button", { name: /zoom in/i });
    fireEvent.click(zoomInButton);

    // Expect the mock function to be called with a function that increases zoom
    expect(mockSetZoomLevel).toHaveBeenCalledTimes(1);

    // Extract and call the callback function passed to mockSetZoomLevel
    const callback = mockSetZoomLevel.mock.calls[0][0];
    // Simulate React's setState by calling the callback with the current value
    const newZoomLevel = callback(100);
    // Verify it increased by 10 as expected
    expect(newZoomLevel).toBe(110);
  });

  it("calls setZoomLevel with decreased value when zoom out is clicked", () => {
    render(<ZoomControls zoomLevel={100} setZoomLevel={mockSetZoomLevel} />);

    // Click the zoom out button
    const zoomOutButton = screen.getByRole("button", { name: /zoom out/i });
    fireEvent.click(zoomOutButton);

    // Expect the mock function to be called with a function that decreases zoom
    expect(mockSetZoomLevel).toHaveBeenCalledTimes(1);

    // Extract and call the callback function passed to mockSetZoomLevel
    const callback = mockSetZoomLevel.mock.calls[0][0];
    // Simulate React's setState by calling the callback with the current value
    const newZoomLevel = callback(100);
    // Verify it decreased by 10 as expected
    expect(newZoomLevel).toBe(90);
  });

  it("respects minimum zoom level (50)", () => {
    render(<ZoomControls zoomLevel={60} setZoomLevel={mockSetZoomLevel} />);

    // Click the zoom out button
    const zoomOutButton = screen.getByRole("button", { name: /zoom out/i });
    fireEvent.click(zoomOutButton);

    // Extract and call the callback
    const callback = mockSetZoomLevel.mock.calls[0][0];

    // Test value at minimum threshold
    const newZoomLevel = callback(50);
    expect(newZoomLevel).toBe(50); // Should not go below 50
  });

  it("respects maximum zoom level (200)", () => {
    render(<ZoomControls zoomLevel={190} setZoomLevel={mockSetZoomLevel} />);

    // Click the zoom in button
    const zoomInButton = screen.getByRole("button", { name: /zoom in/i });
    fireEvent.click(zoomInButton);

    // Extract and call the callback
    const callback = mockSetZoomLevel.mock.calls[0][0];

    // Test value at maximum threshold
    const newZoomLevel = callback(200);
    expect(newZoomLevel).toBe(200); // Should not go above 200
  });
});
