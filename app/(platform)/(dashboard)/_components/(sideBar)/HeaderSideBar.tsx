// Header.tsx
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/app/(platform)/(dashboard)/_components/(header)/ThemeModeToggle";
import { RotateCcw } from "lucide-react";
import * as React from "react";
import { Hint } from "@/components/hint";

const HeaderSideBar = () => {
  return (
    <header className="flex h-16 items-center gap-2 px-4 pb-3">
      <Hint description="Side Bar">
        <SidebarTrigger className="-ml-1" />
      </Hint>
    </header>
  );
};

export default HeaderSideBar;

// useEffect for zoomLevel directly updates a specific style property on the root element, and useEffect dependency helps keep this sync with state changes.
// setTheme works at a higher abstraction level, relying on the next-themes library to handle the updates automatically by applying CSS changes, so no manual DOM manipulation or useEffect is needed.
