"use client";

import {
  SidebarProvider,
  SidebarTrigger,
  SidebarContent,
} from "@/components/ui/sidebar";
import { AppSidebar } from "../_components/(sideBar)/AppSidebar";
import { Hint } from "@/components/hint";

const OrganizationLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="py-3 max-w-6xl 2xl:max-w-screen-xl mx-auto">{children}</div>
  );
};

export default OrganizationLayout;
