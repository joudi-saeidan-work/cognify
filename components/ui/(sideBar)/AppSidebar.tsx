"use client";

import * as React from "react";
import { Activity, CreditCard, Layout, Settings } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useOrganization } from "@clerk/nextjs";
import { TeamSwitcher } from "./team-switcher";
import { NavMain } from "./nav-main";

interface SideBarProps {
  collapsable?: "icon" | "offcanvas";
}
export function AppSidebar({ collapsable = "icon" }: SideBarProps) {
  // get current active organization
  const { organization: activeOrganization, isLoaded } = useOrganization();
  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  // Navigation Items
  const routes = activeOrganization
    ? [
        {
          title: "Boards",
          url: `/organization/${activeOrganization.id}`,
          icon: Layout,
          isActive: true,
        },
        {
          title: "Activity",
          url: `/organization/${activeOrganization.id}/activity`,
          icon: Activity,
        },
        {
          title: "Settings",
          url: `/organization/${activeOrganization.id}/settings`,
          icon: Settings,
        },
      ]
    : [];

  return (
    <Sidebar
      collapsible={collapsable}
      className="fixed left-0 z-[40] h-[calc(100vh-56px)"
    >
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={routes} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
