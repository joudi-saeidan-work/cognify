"use client"; // Indicates this component only runs on the client side.

import Image from "next/image"; // Next.js component for optimized images.
import { useRouter, usePathname } from "next/navigation"; // Next.js hooks for handling navigation.
import { Activity, CreditCard, Layout, Settings } from "lucide-react"; // Icons for different navigation routes.

import { cn } from "@/lib/utils"; // Utility function for handling conditional class names.
import {
  AccordionTrigger,
  AccordionItem,
  AccordionContent,
} from "@/components/ui/accordion"; // Accordion components for creating collapsible items.
import { Button } from "@/components/ui/button"; // Button component for UI consistency.
import { Skeleton } from "@/components/ui/skeleton"; // Loading indicator component to show while data loads.

export type Organization = {
  id: string;
  slug: string;
  imageUrl: string;
  name: string;
}; // Type definition for an Organization, with basic details.

interface NavItemProps {
  isExpanded: boolean; // Whether the organization section is currently expanded
  isActive: boolean; // Whether the organization is the active one in focus
  organization: Organization; // Organization data passed into NavItem
  onExpand: (id: string) => void; // Function to toggle expand/collapse state
}

// Main NavItem component definition
export const NavItem = ({
  isExpanded,
  isActive,
  organization,
  onExpand,
}: NavItemProps) => {
  const router = useRouter(); // Router hook for programmatically navigating to pages
  const pathname = usePathname(); // Current path to determine active state for navigation items

  // Route definitions with labels, icons, and paths for each organization-specific route
  const routes = [
    {
      label: "Boards",
      icon: <Layout className="h-4 w-4 mr-2" />,
      href: `/organization/${organization.id}`, // Links to the main board view for this organization
    },
    {
      label: "Activity",
      icon: <Activity className="h-4 w-4 mr-2" />,
      href: `/organization/${organization.id}/activity`, // Links to activity page
    },
    {
      label: "Settings",
      icon: <Settings className="h-4 w-4 mr-2" />,
      href: `/organization/${organization.id}/settings`, // Links to settings page
    },
    {
      label: "Billing",
      icon: <CreditCard className="h-4 w-4 mr-2" />,
      href: `/organization/${organization.id}/billing`, // Links to billings page
    },
  ];

  // Click handler for navigation buttons
  const onClick = (href: string) => {
    router.push(href); // Programmatically navigates to the specified href
  };
  return (
    <AccordionItem value={organization.id} className="border-none">
      <AccordionTrigger
        onClick={() => onExpand(organization.id)}
        className={cn(
          "flex items-center gap-x-2 p-1.5 text-neutral-700 rounded-md hover:bg-neutral-500/10 transition text-start no-underline hover:no-underline",
          isActive && !isExpanded && "bg-sky-500/10 text-sky-700"
        )}
      >
        <div className="flex items-center gap-x-2">
          <div className="w-7 h-7 relative">
            <Image
              fill
              src={organization.imageUrl}
              alt="Organization"
              className="rounded-sm object-cover"
            />
          </div>
          <span className="font-medium text-sm">{organization.name}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-1 text-neutral-700">
        {routes.map((route) => (
          <Button
            key={route.href}
            size="sm"
            onClick={() => onClick(route.href)}
            className={cn(
              "w-full font-normal justify-start pl-10 mb-1",
              pathname == route.href && "bg-sky-500/10 text-sky-700"
            )}
            variant="ghost"
          >
            {route.icon}
            {route.label}
          </Button>
        ))}
      </AccordionContent>
    </AccordionItem>
  );
};

NavItem.Skeleton = function SkeletonItem() {
  return (
    <div className="flex items-center gap-x-2 ">
      <div className="w-10 h-10 relative shrink-0">
        {/* Circular avatar skeleton */}
        <Skeleton className="h-full w-full absolute" />{" "}
      </div>
      {/* Placeholder for organization name */}
      <Skeleton className="h-10 w-full" />{" "}
    </div>
  );
};

// Syntax Explanation

// NavItem.Skeleton = function SkeletonItem() { ... }:
// NavItem is the main component, representing each item in the sidebar.
// NavItem.Skeleton is being defined as a static property on NavItem. It’s essentially a new function attached directly to the NavItem component, making it accessible as NavItem.Skeleton.
// function SkeletonItem() { ... } defines the actual function, which returns JSX for the skeleton layout.
// This setup allows you to use NavItem.Skeleton as if it were a subcomponent of NavItem.
