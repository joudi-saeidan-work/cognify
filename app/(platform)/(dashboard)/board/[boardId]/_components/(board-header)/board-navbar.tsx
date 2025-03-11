"use client";
import { Board, Bookmark, BookmarkFolder } from "@prisma/client";
import BoardOptions from "./board-options";
import { ThemeToggle } from "@/components/ThemeModeToggle";
import { Separator } from "@/components/ui/separator";
import { UserButton, useAuth } from "@clerk/nextjs";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { dark } from "@clerk/themes";
import { Home } from "lucide-react";
import { useRouter } from "next/navigation";
import BookmarkBar from "@/components/bookmark/bookmark-bar";
import { BordTitleForm } from "./board-title-form";
import AssistanceButton from "@/app/(platform)/(dashboard)/_components/(ai-agents)/assitance-button";
import ResetControls from "@/app/(platform)/(dashboard)/_components/(header)/ResetControls";
import ZoomControls from "@/app/(platform)/(dashboard)/_components/(header)/ZoomControls";
import Calendar from "@/app/(platform)/(dashboard)/_components/(calendar)/calendar";
import DisplaySettings from "./display-settings";
import BoardSettings from "./board-settings";

interface BoardNavBarProps {
  data: Board;
  folders: (BookmarkFolder & { bookmarks: Bookmark[] })[];
  bookmarksWithoutFolders: Bookmark[];
}

const BoardNavbar = ({
  data,
  folders,
  bookmarksWithoutFolders,
}: BoardNavBarProps) => {
  const { theme } = useTheme();
  const router = useRouter();
  const { userId, orgId } = useAuth();
  const [zoomLevel, setZoomLevel] = useState(130);
  const [colorBlindMode, setColorBlindMode] = useState(false);

  const [visibilitySettings, setVisibilitySettings] = useState({
    showAssistant: true,
    showAvatar: true,
    showZoomControls: true,
    showBookmarks: true,
    showThemes: true,
  });

  const handleToggle = (setting: string, value: boolean) => {
    setVisibilitySettings((prev) => ({
      ...prev,
      [setting]: value,
    }));
  };

  const handleOnClick = () => {
    if (userId && orgId) {
      const path = `/organization/${orgId}`;
      console.log("Navigating to:", path);
      router.push(path);
    } else {
      console.log("Missing userId or orgId:", { userId, orgId });
    }
  };
  useEffect(() => {
    // Apply the font-size for zoom effect
    document.documentElement.style.fontSize = `${zoomLevel}%`;
  }, [zoomLevel]);
  return (
    <div
      className="w-full flex items-center px-4 gap-x-4 
        backdrop-blur-sm border-b 
       "
    >
      {/* Left section */}
      <div className="flex items-center gap-x-4">
        <button
          onClick={handleOnClick}
          className="hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-md"
        >
          <Home className="h-4 w-4 text-muted-foreground" />
        </button>

        <Separator orientation="vertical" className="h-6 bg-muted-foreground" />

        <div className="flex items-center gap-x-2">
          {/* Board icon/color */}
          <BordTitleForm data={data} />
        </div>
      </div>

      {/* Right section */}
      <div className="ml-auto flex items-center gap-x-4">
        <div className="hidden md:flex items-center gap-x-4">
          <Calendar boardId={data.id} />
          {visibilitySettings.showBookmarks && (
            <>
              <BookmarkBar
                folders={folders}
                bookmarks={bookmarksWithoutFolders}
              />
              <Separator
                orientation="vertical"
                className="h-6 bg-muted-foreground"
              />
            </>
          )}
        </div>
        <BoardSettings
          boardId={data.id}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
          colorBlindMode={colorBlindMode}
          setColorBlindMode={setColorBlindMode}
        />
        {visibilitySettings.showAvatar && (
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              baseTheme: theme === "dark" ? dark : undefined,
              elements: {
                avatarBox: {
                  height: 35,
                  width: 35,
                },
              },
            }}
          />
        )}
      </div>
    </div>
  );
};

export default BoardNavbar;
