"use client";

import {
  SidebarContent,
  SidebarProvider,
  SidebarTrigger,
  StickySidebarTrigger,
} from "@/components/ui/sidebar";
import NavBar from "./_components/(header)/NavBar";
import { ThemeProvider } from "./_components/(header)/theme-provider";
import { AppSidebar } from "./_components/(sideBar)/AppSidebar";
import { Hint } from "@/components/hint";
import { usePathname } from "next/navigation";
import BoardIdPage from "./board/[boardId]/page";
import { useIsMobile } from "@/hooks/use-mobile";

const DashBoardLayout = ({ children }: { children: React.ReactNode }) => {
  const path = usePathname();
  const isMobile = useIsMobile();

  const isBoardPage = path.includes("/board");
  const sideBarColor = isMobile && isBoardPage ? "bg-black/20" : "";

  return (
    <div className="min-h-screen flex flex-col">
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {/* NavBar */}
        <NavBar />
        {/* Main content */}
        <div className="pt-14 flex-1 flex z-[0]">
          <SidebarProvider defaultOpen={false}>
            {/* removed z score for testing */}
            {/* <div className="flex flex-1 z-[50]">  */}
            <div className="flex flex-1">
              {/* Sidebar */}
              <AppSidebar collapsable="icon" />
              <main className="">
                {!isBoardPage && (
                  <Hint description="Side Bar">
                    <SidebarTrigger className="pt-5" />
                  </Hint>
                )}
                {isMobile && isBoardPage && (
                  <Hint description="Side Bar">
                    <StickySidebarTrigger
                      className={`fixed z-[60] ml-2 mt-2  bg-transparent hover:bg-opacity-50 `}
                    />
                  </Hint>
                )}
                {/* Side bar Trigger */}
                {/* {isBoardPage ? (
                <Hint description="Side Bar">
                  <StickySidebarTrigger />
                </Hint>
              ) : (
                <Hint description="Side Bar">
                  <SidebarTrigger className="mt-2.5" />
                </Hint>
              )} */}
                {/* Side bar content */}
                <SidebarContent>{children}</SidebarContent>
              </main>
            </div>
          </SidebarProvider>
        </div>
      </ThemeProvider>
    </div>
  );
};

export default DashBoardLayout;
