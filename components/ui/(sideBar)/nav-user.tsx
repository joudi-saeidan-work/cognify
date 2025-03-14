"use client";

import { Avatar } from "@/components/ui/avatar";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { UserButton } from "@clerk/clerk-react";
import { useUser } from "@clerk/nextjs";

export function NavUser() {
  const { user } = useUser();
  if (!user) {
    return null; // Or a loader if needed
  }
  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="flex items-center"
            style={{
              backgroundColor: "transparent", // Prevent background color on hover
              color: "inherit", // Keep text color unchanged
              boxShadow: "none", // Remove shadow or border if applied
            }}
          >
            {/* Use Clerk's UserButton for handling profile display */}
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: {
                    height: 30,
                    width: 30,
                  },
                },
              }}
            />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {user.fullName || user.username}
              </span>
              <span className="truncate text-xs">
                {user.emailAddresses[0]?.emailAddress}
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  );
}
