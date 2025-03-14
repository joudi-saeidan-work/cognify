"use client";

import * as React from "react";
import { OrganizationSwitcher } from "@clerk/nextjs";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { useOrganization } from "@clerk/nextjs";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import { dark } from "@clerk/themes";

export function TeamSwitcher() {
  const { organization: activeOrganization } = useOrganization();
  const { theme } = useTheme();
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="mt-14" // Apply the color class conditionally
          tooltip={activeOrganization?.name}
          style={{
            backgroundColor: "transparent", // Prevent background color on hover
            color: "inherit",
            boxShadow: "none", // Remove shadow or border if applied
          }}
        >
          <OrganizationSwitcher
            hidePersonal
            afterCreateOrganizationUrl="/organization/:id"
            afterLeaveOrganizationUrl="/select-org"
            afterSelectOrganizationUrl="/organization/:id"
            appearance={{
              elements: {
                rootBox: {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                },
                organizationButton: {
                  display: "flex",
                  alignItems: "center",
                },
                organizationSwitcherTrigger: {
                  color: "var(--foreground)",
                },
                organizationPreviewTextContainer: {
                  color: "var(--foreground)",
                },
              },
              baseTheme: theme === "dark" ? dark : undefined,
            }}
          />
        </SidebarMenuButton>
        <Separator className="mt-1 dark:bg-muted" />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
