/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AppSidebar } from "../../app/(platform)/(dashboard)/_components/(sideBar)/AppSidebar";

// Mock the necessary components
jest.mock(
  "@/app/(platform)/(dashboard)/_components/(sideBar)/nav-main",
  () => ({
    NavMain: ({ items }: { items: any[] }) => (
      <div data-testid="nav-main">
        {items.map((item, i) => (
          <div key={i} data-testid={`nav-item-${i}`}>
            {item.title} - {item.url} - {item.isActive ? "Active" : "Inactive"}
          </div>
        ))}
      </div>
    ),
  })
);

jest.mock(
  "@/app/(platform)/(dashboard)/_components/(sideBar)/nav-user",
  () => ({
    NavUser: () => <div data-testid="nav-user">NavUser</div>,
  })
);

jest.mock(
  "@/app/(platform)/(dashboard)/_components/(sideBar)/team-switcher",
  () => ({
    TeamSwitcher: () => <div data-testid="team-switcher">TeamSwitcher</div>,
  })
);

jest.mock("@clerk/nextjs", () => ({
  useOrganization: () => ({
    organization: {
      id: "test-org-id",
      name: "Test Organization",
    },
    isLoaded: true,
  }),
}));

jest.mock("@/components/ui/sidebar", () => ({
  Sidebar: ({
    children,
    collapsible,
    className,
  }: {
    children: React.ReactNode;
    collapsible: string;
    className: string;
  }) => (
    <div
      data-testid="sidebar"
      data-collapsible={collapsible}
      className={className}
    >
      {children}
    </div>
  ),
  SidebarContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-content">{children}</div>
  ),
  SidebarFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-footer">{children}</div>
  ),
  SidebarHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-header">{children}</div>
  ),
  SidebarRail: () => <div data-testid="sidebar-rail">SidebarRail</div>,
}));

// Mock Lucide icons
jest.mock("lucide-react", () => ({
  Activity: () => <div data-testid="activity-icon" />,
  CreditCard: () => <div data-testid="credit-card-icon" />,
  Layout: () => <div data-testid="layout-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
}));

describe("AppSidebar", () => {
  it("renders the sidebar with correct structure", () => {
    render(<AppSidebar />);

    // Check the main sidebar container
    const sidebar = screen.getByTestId("sidebar");
    expect(sidebar).toBeInTheDocument();
    expect(sidebar).toHaveAttribute("data-collapsible", "icon");
    expect(sidebar).toHaveClass("fixed left-0 z-[40] h-[calc(100vh-56px)");

    // Check sidebar sections
    expect(screen.getByTestId("sidebar-header")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-content")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-rail")).toBeInTheDocument();

    // Check for team switcher in header
    expect(screen.getByTestId("team-switcher")).toBeInTheDocument();
  });

  it("renders nav items with correct routes when organization is loaded", () => {
    render(<AppSidebar />);

    // Check that NavMain is rendered
    expect(screen.getByTestId("nav-main")).toBeInTheDocument();

    // Check that we have the expected navigation items
    expect(screen.getByTestId("nav-item-0")).toHaveTextContent(
      "Boards - /organization/test-org-id - Active"
    );
    expect(screen.getByTestId("nav-item-1")).toHaveTextContent(
      "Activity - /organization/test-org-id/activity - Inactive"
    );
    expect(screen.getByTestId("nav-item-2")).toHaveTextContent(
      "Settings - /organization/test-org-id/settings - Inactive"
    );
  });

  it("respects the collapsable prop", () => {
    render(<AppSidebar collapsable="offcanvas" />);

    const sidebar = screen.getByTestId("sidebar");
    expect(sidebar).toHaveAttribute("data-collapsible", "offcanvas");
  });
});

// Add a test for the loading state
describe("AppSidebar - Loading State", () => {
  beforeEach(() => {
    // Mock useOrganization to return isLoaded: false
    jest.mock(
      "@clerk/nextjs",
      () => ({
        useOrganization: () => ({
          organization: null,
          isLoaded: false,
        }),
      }),
      { virtual: true }
    );
  });

  it("shows loading state when organization data is not loaded", () => {
    // Re-require the component to use updated mock
    jest.resetModules();
    jest.mock("@clerk/nextjs", () => ({
      useOrganization: () => ({
        organization: null,
        isLoaded: false,
      }),
    }));

    const {
      AppSidebar: ReloadedAppSidebar,
    } = require("../../app/(platform)/(dashboard)/_components/(sideBar)/AppSidebar");

    render(<ReloadedAppSidebar />);

    // This test is more informative than useful since we can't easily reload the mocks
    // But it documents the expected behavior when organization data is loading
    expect(screen.queryByTestId("sidebar")).not.toBeInTheDocument();
  });
});
