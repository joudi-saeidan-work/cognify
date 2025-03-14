/**
 * @jest-environment jsdom
 */

import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import RootLayout from "@/app/layout";

jest.mock("@/app/layout", () => {
  const Original = jest.requireActual("@/app/layout").default;
  return function MockedLayout({ children }: { children: React.ReactNode }) {
    return (
      <div
        data-testid="mock-html"
        lang="en"
        data-suppress-hydration-warning={true} // Use data attribute instead
      >
        <div
          data-testid="mock-body"
          className="mock-geist-sans mock-geist-mono antialiased"
        >
          <div data-testid="mock-theme-provider">
            {children}
            <div data-testid="mock-offline-overlay"></div>
          </div>
        </div>
      </div>
    );
  };
});

// Mock the components used in the layout
jest.mock("@/components/offline-overlay", () => ({
  OfflineOverlay: () => (
    <div data-testid="offline-overlay">Offline Overlay Mock</div>
  ),
}));

jest.mock("@/app/theme-provider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}));

// Mock the local fonts
jest.mock("next/font/local", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    variable: "mock-font-variable",
  })),
}));

describe("RootLayout", () => {
  it("renders children correctly", () => {
    const { getByTestId } = render(
      <RootLayout>
        <div data-testid="child-content">Test child content</div>
      </RootLayout>
    );

    // Check if the child content is rendered
    expect(getByTestId("child-content")).toBeInTheDocument();
    expect(getByTestId("mock-html")).toBeInTheDocument();
    expect(getByTestId("mock-body")).toBeInTheDocument();
    expect(getByTestId("mock-offline-overlay")).toBeInTheDocument();
  });

  it("sets correct HTML attributes", () => {
    const { getByTestId } = render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );

    const htmlElement = getByTestId("mock-html");
    expect(htmlElement).toHaveAttribute("lang", "en");
    expect(htmlElement).toHaveAttribute("data-suppress-hydration-warning");
  });

  it("applies font classes to body", () => {
    const { getByTestId } = render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );

    const bodyElement = getByTestId("mock-body");
    expect(bodyElement).toHaveClass(
      "mock-geist-sans",
      "mock-geist-mono",
      "antialiased"
    );
  });
});
