/**
 * @jest-environment jsdom
 */

import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import MarketingLayout from "@/app/(marketing)/layout";

// Mock the components used in the layout
jest.mock("@/app/(marketing)/_components/navbar", () => ({
  __esModule: true,
  default: () => <div data-testid="navbar-mock">NavBar Mock</div>,
}));

jest.mock("@/app/(marketing)/_components/footer", () => ({
  __esModule: true,
  default: () => <div data-testid="footer-mock">Footer Mock</div>,
}));

describe("MarketingLayout", () => {
  it("renders the navbar, main content, and footer", () => {
    const { getByTestId, getByText } = render(
      <MarketingLayout>
        <div data-testid="test-children">Test Content</div>
      </MarketingLayout>
    );

    // Check if navbar is rendered
    expect(getByTestId("navbar-mock")).toBeInTheDocument();

    // Check if the children are rendered
    expect(getByTestId("test-children")).toBeInTheDocument();
    expect(getByText("Test Content")).toBeInTheDocument();

    // Check if footer is rendered
    expect(getByTestId("footer-mock")).toBeInTheDocument();
  });

  it("applies the correct classes to the container and main elements", () => {
    const { container } = render(
      <MarketingLayout>
        <div>Test Content</div>
      </MarketingLayout>
    );

    // Check the main container div classes
    const mainContainer = container.firstChild as HTMLElement;
    expect(mainContainer).toHaveClass("h-full", "bg-slate-100");

    // Check the main element classes
    const mainElement = container.querySelector("main");
    expect(mainElement).toHaveClass("pt-40", "pb-20", "bg-slate-100");
  });
});
