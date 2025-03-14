/**
 * @jest-environment jsdom
 */

import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import Footer from "@/app/(marketing)/_components/footer";

// Mock the logo component
jest.mock("@/components/logo", () => ({
  Logo: () => <div data-testid="logo-mock">Logo Mock</div>,
}));

// Mock the button component
jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    variant,
    size,
  }: {
    children: React.ReactNode;
    variant?: string;
    size?: string;
  }) => (
    <button data-testid="button-mock" data-variant={variant} data-size={size}>
      {children}
    </button>
  ),
}));

describe("Footer", () => {
  it("renders the logo", () => {
    const { getByTestId } = render(<Footer />);

    // Check if the logo is rendered
    expect(getByTestId("logo-mock")).toBeInTheDocument();
  });

  it("renders the Privacy Policy and Terms of Service buttons", () => {
    const { getAllByTestId } = render(<Footer />);

    // Get all buttons
    const buttons = getAllByTestId("button-mock");

    // Check that there are exactly 2 buttons
    expect(buttons).toHaveLength(2);

    // Find the Privacy Policy button
    const privacyButton = buttons.find(
      (button) => button.textContent === "Privacy Policy"
    );
    expect(privacyButton).toBeInTheDocument();
    expect(privacyButton).toHaveAttribute("data-variant", "ghost");
    expect(privacyButton).toHaveAttribute("data-size", "sm");

    // Find the Terms of Service button
    const termsButton = buttons.find(
      (button) => button.textContent === "Terms of Service"
    );
    expect(termsButton).toBeInTheDocument();
    expect(termsButton).toHaveAttribute("data-variant", "ghost");
    expect(termsButton).toHaveAttribute("data-size", "sm");
  });

  it("applies the correct styling to the footer", () => {
    const { container } = render(<Footer />);

    // Check the footer container classes
    const footerContainer = container.firstChild as HTMLElement;
    expect(footerContainer).toHaveClass(
      "fixed",
      "bottom-0",
      "w-full",
      "p-4",
      "border-t",
      "bg-slate-100"
    );

    // Check the inner container classes
    const innerContainer = footerContainer.firstChild as HTMLElement;
    expect(innerContainer).toHaveClass(
      "md:max-w-screen-2xl",
      "mx-auto",
      "flex",
      "items-center",
      "w-full",
      "justify-between"
    );

    // Check the buttons container classes
    const buttonsContainer = innerContainer.children[1] as HTMLElement;
    expect(buttonsContainer).toHaveClass(
      "space-x-4",
      "md:block",
      "md:w-auto",
      "flex",
      "items-center",
      "justify-between",
      "w-full"
    );
  });
});
