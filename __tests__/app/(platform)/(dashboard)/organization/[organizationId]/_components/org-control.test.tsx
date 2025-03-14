/**
 * @jest-environment jsdom
 */

import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { OrgControl } from "../../../../../../../app/(platform)/(dashboard)/organization/[organizationId]/_components/org-control";

// Create mock functions
const mockSetActive = jest.fn();

// Mock useParams hook
jest.mock("next/navigation", () => ({
  useParams: jest.fn().mockReturnValue({ organizationId: "org_123" }),
}));

// Mock useOrganizationList hook with a factory function
// This pattern avoids the hoisting issue
jest.mock("@clerk/nextjs", () => {
  // Return a factory function
  return {
    useOrganizationList: jest.fn().mockImplementation(() => ({
      setActive: mockSetActive,
    })),
  };
});

describe("OrgControl", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mockImplementation for subsequent tests
    require("@clerk/nextjs").useOrganizationList.mockImplementation(() => ({
      setActive: mockSetActive,
    }));
  });

  it("calls setActive with the correct organization ID from params", () => {
    render(<OrgControl />);

    // The component should call setActive on mount
    expect(mockSetActive).toHaveBeenCalledWith({ organization: "org_123" });
  });

  it("doesn't call setActive if the function is not available", () => {
    // Mock useOrganizationList to return undefined setActive
    require("@clerk/nextjs").useOrganizationList.mockImplementationOnce(() => ({
      setActive: undefined,
    }));

    render(<OrgControl />);

    // setActive should not be called if it's undefined
    expect(mockSetActive).not.toHaveBeenCalled();
  });

  it("updates organization when organizationId changes", () => {
    // First render with initial organizationId
    const { rerender } = render(<OrgControl />);

    // Check initial setActive call
    expect(mockSetActive).toHaveBeenCalledWith({ organization: "org_123" });
    mockSetActive.mockClear();

    // Mock useParams to return a different organizationId
    require("next/navigation").useParams.mockReturnValueOnce({
      organizationId: "org_456",
    });

    // Re-render the component with the new params
    rerender(<OrgControl />);

    // Check that setActive is called with the new organizationId
    expect(mockSetActive).toHaveBeenCalledWith({ organization: "org_456" });
  });

  it("renders nothing (returns null)", () => {
    const { container } = render(<OrgControl />);

    // The component should render nothing visible
    expect(container.firstChild).toBeNull();
  });
});
