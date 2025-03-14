/**
 * @jest-environment jsdom
 */

import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";

// Since theme-provider is just re-exporting from next-themes,
// we'll just test that the re-export is working
jest.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="next-themes-provider">{children}</div>
  ),
}));

// Import after mocking
import { ThemeProvider } from "@/app/theme-provider";

describe("ThemeProvider", () => {
  it("correctly re-exports the ThemeProvider from next-themes", () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <div>Test content</div>
      </ThemeProvider>
    );

    // Check if the next-themes provider is used
    expect(getByTestId("next-themes-provider")).toBeInTheDocument();
  });
});
