"use client"; // Ensures that this component is only rendered on the client side, necessary for using browser-specific features like local storage.

import Link from "next/link"; // Next.js component for internal navigation.
import { Plus, Menu } from "lucide-react"; // Importing an icon component to use in the sidebar.

import { useLocalStorage } from "usehooks-ts"; // Hook to handle local storage to remember expanded/collapsed sections.
import { useOrganization, useOrganizationList } from "@clerk/nextjs"; // Hooks for accessing user organization data.

import { Button } from "@/components/ui/button"; // Reusable Button component for UI consistency.
import { Accordion } from "@/components/ui/accordion"; // Accordion component to create collapsible sections.
import { Separator } from "@/components/ui/separator"; // Optional component for adding spacing, not used here.
import { Skeleton } from "@/components/ui/skeleton"; // Loading indicator component to show while data loads.
import { useState } from "react"; // Hook for managing component-level state.
import { NavItem, Organization } from "./not-used-nav-item"; // Imports NavItem (another component) and Organization (data type) used to define each organization.

interface SideBarProps {
  storageKey?: string; // Type definition for SideBar component props, where storageKey can optionally be passed to specify a unique local storage key.
}

// Main Sidebar component definition
export const SideBar = ({ storageKey = "c-sidebar-state" }: SideBarProps) => {
  // State for expanded sections, initially loads from local storage (if present)
  const [expanded, setExpanded] = useLocalStorage<Record<string, any>>(
    storageKey,
    {}
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // State to toggle the sidebar open/close.

  // Fetch the currently active organization and loading state
  const { organization: activeOrganization, isLoaded: isLoadedOrg } =
    useOrganization();

  // Fetch list of organizations the user belongs to, with a loading state
  const { userMemberships, isLoaded: isLoadedOrgList } = useOrganizationList({
    userMemberships: { infinite: true },
  });

  // Calculate default expanded state for Accordion based on local storage data
  const defaultAccordionValue: string[] = Object.keys(expanded).reduce(
    (acc: string[], key: string) => {
      if (expanded[key]) {
        acc.push(key); // Adds expanded sections to initial open list
      }
      return acc;
    },
    []
  );

  // Function to toggle expanded/collapsed state for a specific organization
  const onExpand = (id: string) => {
    setExpanded((curr) => ({ ...curr, [id]: !expanded[id] })); // Updates expanded state in local storage
  };

  // If organization data isn't fully loaded, show the loading skeleton
  if (!isLoadedOrg || !isLoadedOrgList || userMemberships.isLoading) {
    return (
      <div>
        <Button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          variant="ghost"
          size="sm"
          className="mb-4"
        >
          <Menu className="h-5 w-5" /> {/* Toggle button with Menu icon */}
        </Button>
        {isSidebarOpen && (
          <>
            <Skeleton className="h-10 w-[50%] mb-2" />
            <div className="space-y-2">
              <NavItem.Skeleton />
              <NavItem.Skeleton />
              <NavItem.Skeleton />
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="font-medium text-xs flex items-center mb-1 ">
        <span className="pl-4">Workspace</span> {/* Sidebar title */}
        <Button
          asChild
          type="button"
          size="icon"
          variant="ghost"
          className="ml-auto"
        >
          <Link href="/select-org">
            <Plus className="h-4 w-4" /> {/* Icon to add a new organization */}
          </Link>
        </Button>
      </div>
      <Accordion
        type="multiple"
        defaultValue={defaultAccordionValue} // Accordion starts with locally saved expanded state
        className="space-y-2"
      >
        {/* Map over user organizations to create individual NavItem for each */}
        {userMemberships.data.map(({ organization }) => (
          <NavItem
            key={organization.id} // Unique key for each organization
            isActive={activeOrganization?.id === organization.id} // Checks if organization is active
            isExpanded={expanded[organization.id]} // Sets initial expanded state
            organization={organization as Organization} // Passes organization data to NavItem
            onExpand={onExpand} // onExpand function passed to NavItem for toggling
          />
        ))}
      </Accordion>
    </>
  );
};

// Desktop Sidebar
// State Management: The desktop sidebar only tracks which sections (or organizations) are expanded. This is done through an onClick function for each section, which updates the expanded/collapsed state directly in local storage.
// No useEffect or Global State: The desktop sidebar doesn’t need useEffect or global state management because it’s always visible and only manages the expanded state of individual sections. Each organization’s state is saved in local storage, making it persistent across page reloads without needing global or complex state management.
