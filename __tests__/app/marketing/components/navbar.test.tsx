/**
 * @jest-environment jsdom
 */

import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import NavBar from "@/app/(marketing)/_components/navbar";

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
    asChild,
    className,
  }: {
    children: React.ReactNode;
    variant?: string;
    size?: string;
    asChild?: boolean;
    className?: string;
  }) => (
    <button
      data-testid="button-mock"
      data-variant={variant}
      data-size={size}
      data-as-child={asChild}
      data-class={className}
    >
      {children}
    </button>
  ),
}));

// Mock the Link component
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} data-testid="link-mock">
      {children}
    </a>
  ),
}));

describe("NavBar", () => {
  it("renders the logo", () => {
    const { getByTestId } = render(<NavBar />);

    // Check if logo is rendered
    expect(getByTestId("logo-mock")).toBeInTheDocument();
  });

  it("renders the login button with correct link", () => {
    const { getAllByTestId, getByText } = render(<NavBar />);

    // Get all buttons
    const buttons = getAllByTestId("button-mock");

    // Find the login button
    const loginButton = buttons.find(
      (button) => button.textContent === "Login"
    );

    expect(loginButton).toBeInTheDocument();
    expect(loginButton).toHaveAttribute("data-variant", "outline");
    expect(loginButton).toHaveAttribute("data-size", "sm");

    // Check if it has the correct link
    const links = getAllByTestId("link-mock");
    const loginLink = links.find(
      (link) => link.getAttribute("href") === "/sign-in"
    );
    expect(loginLink).toBeInTheDocument();
  });

  it("renders the 'Try Cognify' button with correct link", () => {
    const { getAllByTestId, getByText } = render(<NavBar />);

    // Get all buttons
    const buttons = getAllByTestId("button-mock");

    // Find the Try Cognify button
    const tryButton = buttons.find(
      (button) => button.textContent === "Try Cognify"
    );

    expect(tryButton).toBeInTheDocument();
    expect(tryButton).toHaveAttribute("data-size", "sm");
    expect(tryButton).toHaveAttribute(
      "data-class",
      "font-semibold bg-teal-600 hover:bg-teal-500"
    );

    // Check if it has the correct link
    const links = getAllByTestId("link-mock");
    const signUpLink = links.find(
      (link) => link.getAttribute("href") === "/sign-up"
    );
    expect(signUpLink).toBeInTheDocument();
  });

  it("applies the correct styling to the navbar", () => {
    const { container } = render(<NavBar />);

    // Check the navbar container classes
    const navbarContainer = container.firstChild as HTMLElement;
    expect(navbarContainer).toHaveClass(
      "fixed",
      "top-0",
      "w-full",
      "h-14",
      "px-4",
      "border-b",
      "shadow-sm",
      "bg-gray-50",
      "flex",
      "items-center"
    );

    // Check the inner container classes
    const innerContainer = navbarContainer.firstChild as HTMLElement;
    expect(innerContainer).toHaveClass(
      "md:max-w-screen-2xl",
      "mx-auto",
      "flex",
      "items-center",
      "w-full",
      "justify-between"
    );
  });
});
