"use client"; // Ensures that this component only renders on the client side, which is necessary for browser-specific features (like Zustand's state management and path detection).

import { usePathname } from "next/navigation"; // Next.js hook to access the current URL pathname, useful for triggering sidebar behavior when the path changes.
import { useEffect, useState } from "react"; // React hooks for handling component lifecycle (useEffect) and managing local state (useState).

import { userMobileSideBar } from "@/app/unused-hooks/not-used-mobile-sidebar"; // Zustand store for managing the open/closed state of the mobile sidebar.
import { Button } from "@/components/ui/button"; // Button component to trigger the sidebar.
import { Sheet, SheetContent } from "@/components/ui/sheet"; // Sheet components to create a slide-in sidebar from the left.
import { Menu } from "lucide-react"; // Icon component for displaying a menu icon.
import { SideBar } from "./not-used-SideBar"; // Imports the main sidebar content, which will be displayed inside the mobile sidebar.

export const MobileSideBar = () => {
  const pathname = usePathname(); // Retrieves the current URL path. Useful to automatically close the sidebar when navigating to a new route.

  // State to check if the component is mounted on the client side
  const [isMounted, setIsMounted] = useState(false);

  // Zustand functions and state for sidebar open/close management
  const onOpen = userMobileSideBar((state) => state.onOpen); // Function to open the sidebar (sets isOpen to true)
  const onClose = userMobileSideBar((state) => state.onClose); // Function to close the sidebar (sets isOpen to false)
  const isOpen = userMobileSideBar((state) => state.isOpen); // State to check if the sidebar is currently open

  // Sets `isMounted` to true when the component mounts (first renders)
  useEffect(() => {
    setIsMounted(true); // Allows content to render only after mounting, avoiding SSR issues
  }, []);

  // Automatically close the sidebar when the path changes (i.e., the user navigates to a different page)
  useEffect(() => {
    onClose(); // Closes the sidebar to reset its state
  }, [pathname, onClose]); // Triggered whenever `pathname` or `onClose` changes

  // Prevent rendering if the component is not yet mounted on the client side
  if (!isMounted) {
    return null; // Returns nothing until the component has fully mounted
  }

  return (
    <>
      {/* Button to open the sidebar, only visible on mobile screens (hidden on md and up) */}
      <Button
        onClick={onOpen} // Calls `onOpen` to open the sidebar
        className="block md:hidden mr-2" // Mobile-only styling
        variant="ghost"
        size="sm"
      >
        <Menu className="h-4 w-4"></Menu> {/* Icon for the menu button */}
      </Button>

      {/* Sidebar content wrapped in a sliding Sheet component */}
      <Sheet open={isOpen} onOpenChange={onClose}>
        {" "}
        {/* Controlled by `isOpen` state from Zustand */}
        <SheetContent side="left" className="p-2 pt-10">
          <SideBar key="c-sidebar-mobile-state" />{" "}
          {/* Renders the main sidebar content */}
        </SheetContent>
      </Sheet>
    </>
  );
};

// Mobile Sidebar
// State Management with Zustand: The mobile sidebar uses Zustand, a lightweight state management library, to track whether the sidebar is open or closed. This is because the sidebar is hidden by default and needs to be opened/closed as the user navigates.
// Using useEffect: The mobile sidebar uses useEffect to close the sidebar automatically when the route changes (via pathname). This effect resets the sidebar to a closed state whenever the user navigates to a new page, creating a smooth and expected user experience on mobile.
