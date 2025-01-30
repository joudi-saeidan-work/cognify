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
import ChatButton from "../(ai)/chatbutton";
// Main NavBar component definition
const NavBar = () => {
  const [zoomLevel, setZoomLevel] = useState(64); // Default font size percentage
  const [colorBlindMode, setColorBlindMode] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    // Apply the font-size for zoom effect
    document.documentElement.style.fontSize = `${zoomLevel}%`;
  }, [zoomLevel]);

  return (
    // Navbar container with fixed positioning at the top of the page, shadows, and padding for structure
    <nav className="z-[50] fixed top-0 px-4 w-full h-14 border-b shadow-sm bg-gray-50 dark:bg-gray-950 flex items-center transition-colors duration-300">
      {/* Mobile Sidebar component, positioned at the start of the navbar */}
      {/* <MobileSideBar /> */}
      <div className="flex items-center gap-x-4">
        {/* Hidden on small screens (only shown on md and up). Displays the Logo in the navbar */}
        <div className="hidden md:flex">
          <Logo />
        </div>
        {/* Button for "Create" action, visible only on medium to large screens */}
        <FormPopOver align="start" side="bottom" sideOffset={18}>
          <Button
            size="sm"
            className="rounded-sm hidden md:block h-auto py-1.5 px-2 font-semibold bg-teal-600 hover:bg-teal-500"
            // variant="primary"
          >
            Create
            {/* Text label for the Create button */}
          </Button>
        </FormPopOver>
        <FormPopOver>
          <Button
            // variant="primary"
            size="sm"
            className="rounded-sm block md:hidden  bg-teal-600 hover:bg-teal-500"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </FormPopOver>
        <ThemeToggle
          colorBlindMode={colorBlindMode}
          setColorBlindMode={setColorBlindMode}
        />
        <ZoomControls zoomLevel={zoomLevel} setZoomLevel={setZoomLevel} />
        <ResetControls
          setZoomLevel={setZoomLevel}
          setColorBlindMode={setColorBlindMode}
        />
      </div>
      <div className="ml-auto flex items-center gap-x-2">
        <ChatButton />

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
