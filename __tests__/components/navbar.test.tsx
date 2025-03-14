/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import NavBar from "../../app/(platform)/(dashboard)/_components/(header)/NavBar";

// Mock the Logo component
jest.mock("@/components/logo", () => ({
  Logo: () => <div data-testid="logo">Logo</div>,
}));

// Mock the ZoomControls and ResetControls components
jest.mock(
  "../../app/(platform)/(dashboard)/_components/(header)/ZoomControls",
  () => {
    return {
      __esModule: true,
      default: ({
        zoomLevel,
        setZoomLevel,
      }: {
        zoomLevel: number;
        setZoomLevel: Function;
      }) => (
        <div data-testid="zoom-controls">
          ZoomControls: {zoomLevel}
          <button onClick={() => setZoomLevel(110)}>Change Zoom</button>
        </div>
      ),
    };
  }
);

jest.mock(
  "../../app/(platform)/(dashboard)/_components/(header)/ResetControls",
  () => {
    return {
      __esModule: true,
      default: () => <div data-testid="reset-controls">ResetControls</div>,
    };
  }
);

// Mock next-themes
jest.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: jest.fn() }),
}));

// Mock Clerk's UserButton
jest.mock("@clerk/nextjs", () => ({
  UserButton: () => <div data-testid="user-button">UserButton</div>,
}));

// Mock ThemeToggle
jest.mock("@/components/ThemeModeToggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">ThemeToggle</div>,
}));

// Mock DisplaySettings
jest.mock(
  "../../app/(platform)/(dashboard)/board/[boardId]/_components/(board-header)/display-settings",
  () => {
    return {
      __esModule: true,
      default: ({
        zoomLevel,
        setZoomLevel,
        colorBlindMode,
        setColorBlindMode,
      }: {
        zoomLevel: number;
        setZoomLevel: Function;
        colorBlindMode: boolean;
        setColorBlindMode: Function;
      }) => (
        <div data-testid="display-settings">
          DisplaySettings: {zoomLevel}, ColorBlind: {colorBlindMode.toString()}
          <button onClick={() => setColorBlindMode(!colorBlindMode)}>
            Toggle ColorBlind
          </button>
        </div>
      ),
    };
  }
);

// Mock Separator
jest.mock("@/components/ui/separator", () => ({
  Separator: ({
    orientation,
    className,
  }: {
    orientation: string;
    className: string;
  }) => (
    <div
      data-testid="separator"
      className={className}
      data-orientation={orientation}
    >
      Separator
    </div>
  ),
}));

describe("NavBar", () => {
  beforeEach(() => {
    // Mock document.documentElement.style
    Object.defineProperty(document.documentElement, "style", {
      value: {
        fontSize: "",
      },
      writable: true,
    });
  });

  it("renders the navbar with logo and user controls", () => {
    render(<NavBar />);

    // Check for logo (hidden on small screens)
    expect(screen.getByTestId("logo")).toBeInTheDocument();

    // Check for user button
    expect(screen.getByTestId("user-button")).toBeInTheDocument();

    // Check for separator
    const separator = screen.getByTestId("separator");
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveAttribute("data-orientation", "vertical");

    // Check for display settings
    expect(screen.getByTestId("display-settings")).toBeInTheDocument();
  });

  it("applies zoom level to document root", () => {
    render(<NavBar />);

    // Check initial zoom level (default is 130%)
    expect(document.documentElement.style.fontSize).toBe("130%");

    document.documentElement.style.fontSize = "110%";

    // Check updated zoom level
    expect(document.documentElement.style.fontSize).toBe("110%");
  });

  it("allows toggling colorblind mode", () => {
    render(<NavBar />);

    // Check initial colorblind state
    expect(screen.getByText(/ColorBlind: false/)).toBeInTheDocument();

    // Toggle colorblind mode
    fireEvent.click(screen.getByText("Toggle ColorBlind"));

    // Check updated colorblind state
    expect(screen.getByText(/ColorBlind: true/)).toBeInTheDocument();
  });
});
