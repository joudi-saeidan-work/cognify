"use client";

import {
  SidebarContent,
  SidebarProvider,
  SidebarTrigger,
  StickySidebarTrigger,
} from "@/components/ui/sidebar";
import NavBar from "./_components/(header)/NavBar";
import { Hint } from "@/components/hint";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import AssistanceButton from "./_components/(ai-agents)/assitance-button";
import { AppSidebar } from "@/components/ui/(sideBar)/AppSidebar";

const DashBoardLayout = ({ children }: { children: React.ReactNode }) => {
  const path = usePathname();
  const isMobile = useIsMobile();

  const isBoardPage = path.includes("/board");

  return !isBoardPage ? (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <div className="pt-14 flex-1 flex z-[0]">
        <SidebarProvider defaultOpen={false}>
          {/* removed z score for testing */}
          {/* <div className="flex flex-1 z-[50]">  */}
          <div className="flex flex-1">
            {/* Sidebar */}
            <AppSidebar collapsable="icon" />
            <AssistanceButton />

            <main className="">
              {!isBoardPage && isMobile && (
                <Hint description="Side Bar">
                  <SidebarTrigger className="pt-5" />
                </Hint>
              )}
              {/* Mobile Sidebar component, positioned at the start of the navbar */}
              {isMobile && isBoardPage && (
                <Hint description="Side Bar">
                  <StickySidebarTrigger
                    className={`fixed z-[60] ml-2 mt-2  bg-transparent hover:bg-opacity-50 `}
                  />
                </Hint>
              )}

              <SidebarContent>{children}</SidebarContent>
            </main>
          </div>
        </SidebarProvider>
      </div>
    </div>
  ) : (
    <>
      <AssistanceButton />
      {children}
    </>
  );
};

export default DashBoardLayout;
