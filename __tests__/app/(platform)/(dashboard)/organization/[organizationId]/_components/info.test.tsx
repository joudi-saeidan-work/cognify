/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Info } from "../../../../../../../app/(platform)/(dashboard)/organization/[organizationId]/_components/info";

// Mock useOrganization hook
jest.mock("@clerk/nextjs", () => ({
  useOrganization: jest.fn(),
}));

// Mock Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className: string;
  }) => (
    <img src={src} alt={alt} className={className} data-testid="org-image" />
  ),
}));

// Mock the Skeleton component
jest.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className }: { className: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

describe("Info Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders organization info when loaded", () => {
    // Mock the useOrganization hook with loaded data
    const mockOrganization = {
      id: "org_123",
      name: "Test Organization",
      imageUrl: "https://example.com/image.jpg",
    };

    require("@clerk/nextjs").useOrganization.mockReturnValue({
      organization: mockOrganization,
      isLoaded: true,
    });

    render(<Info />);

    // Check if organization image is rendered
    const orgImage = screen.getByTestId("org-image");
    expect(orgImage).toBeInTheDocument();
    expect(orgImage).toHaveAttribute("src", "https://example.com/image.jpg");
    expect(orgImage).toHaveAttribute("alt", "Organization");

    // Check if organization name is rendered
    expect(screen.getByText("Test Organization")).toBeInTheDocument();
  });

  it("renders skeleton loader when not loaded", () => {
    // Mock the useOrganization hook with loading state
    require("@clerk/nextjs").useOrganization.mockReturnValue({
      organization: null,
      isLoaded: false,
    });

    render(<Info />);

    // Check if skeleton component is rendered
    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders the Skeleton component with correct structure", () => {
    // Testing the static Skeleton subcomponent directly
    render(<Info.Skeleton />);

    // Verify the skeletons
    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBe(4); // There should be 4 skeleton elements

    // Check their class names
    expect(skeletons[0]).toHaveClass("w-full h-full absolute");
    expect(skeletons[1]).toHaveClass("h-10 w-[200px]");
    expect(skeletons[2]).toHaveClass("h-4 w-4 mr-2");
    expect(skeletons[3]).toHaveClass("h-4 w-[100px]");
  });
});
