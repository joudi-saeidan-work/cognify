import { Plus } from "lucide-react"; // Imports the "Plus" icon, which will be used as an icon in the mobile "Create" button.
import { Logo } from "@/components/logo"; // Imports the Logo component to display a brand or app logo in the navbar.
import { Button } from "@/components/ui/button"; // Imports a reusable Button component for consistent button styles across the app.
import { FormPopOver } from "@/components/form/form-popover";
import { useState, useEffect } from "react";
import ZoomControls from "./ZoomControls";
import ResetControls from "./ResetControls";
import { dark } from "@clerk/themes";
import { UserButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { ThemeToggle } from "../../../../../components/ThemeModeToggle";
import AssistanceButton from "../(ai-agents)/assitance-button";
import { Separator } from "@/components/ui/separator";
// Main NavBar component definition
const NavBar = () => {
  const [zoomLevel, setZoomLevel] = useState(110); // Default font size percentage
  const [colorBlindMode, setColorBlindMode] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    // Apply the font-size for zoom effect
    document.documentElement.style.fontSize = `${zoomLevel}%`;
  }, [zoomLevel]);

  return (
    // Navbar container with fixed positioning at the top of the page, shadows, and padding for structure
    <nav className="z-[50] fixed top-0 px-4 w-full h-14 border border-b shadow-sm bg-background text-foreground flex items-center transition-colors duration-300">
      <div className="flex items-center gap-x-4">
        {/* Hidden on small screens (only shown on md and up). Displays the Logo in the navbar */}
        <div className="hidden md:flex">
          <Logo />
        </div>
      </div>
      <div className="ml-auto flex items-center gap-x-2">
        <AssistanceButton />
        <Separator orientation="vertical" className="h-6 dark:bg-muted" />
        <ThemeToggle
          colorBlindMode={colorBlindMode}
          setColorBlindMode={setColorBlindMode}
        />
        <ResetControls
          setZoomLevel={setZoomLevel}
          setColorBlindMode={setColorBlindMode}
        />
        <ZoomControls zoomLevel={zoomLevel} setZoomLevel={setZoomLevel} />

        <Separator orientation="vertical" className="h-6 dark:bg-muted" />
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            baseTheme: theme === "dark" ? dark : undefined,
            elements: {
              avatarBox: {
                height: 30,
                width: 30,
              },
            },
          }}
        />
      </div>
    </nav>
  );
};

export default NavBar;
