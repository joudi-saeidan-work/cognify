"use client";
import { Board, Bookmark, BookmarkFolder } from "@prisma/client";
import BoardOptions from "./board-options";
import { ThemeToggle } from "@/components/ThemeModeToggle";
import { Separator } from "@/components/ui/separator";
import { UserButton, useAuth, useUser } from "@clerk/nextjs";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { dark } from "@clerk/themes";
import { Home } from "lucide-react";
import { useRouter } from "next/navigation";
import BookmarkBar from "@/components/bookmark/bookmark-bar";
import { BoardTitleForm } from "./board-title-form";
import AssistanceButton from "@/app/(platform)/(dashboard)/_components/(ai-agents)/assitance-button";
import ResetControls from "@/app/(platform)/(dashboard)/_components/(header)/ResetControls";
import ZoomControls from "@/app/(platform)/(dashboard)/_components/(header)/ZoomControls";
import Calendar from "@/app/(platform)/(dashboard)/_components/(calendar)/calendarComponent";
import DisplaySettings from "./display-settings";
import BoardSettings from "./board-settings";
import WelcomeModal from "../(text-to-speech)/WelcomeModal";
import { Voice } from "../(text-to-speech)/VoiceContext";
import ReadTasksButton from "../(text-to-speech)/ReadTasksButton";
import { Hint } from "@/components/hint";

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
  const { user } = useUser();
  const [zoomLevel, setZoomLevel] = useState(110);
  const [colorBlindMode, setColorBlindMode] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Voice | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [visibilitySettings, setVisibilitySettings] = useState({
    showAssistant: true,
    showAvatar: true,
    showZoomControls: true,
    showBookmarks: true,
    showThemes: true,
  });

  const handleOnClick = () => {
    if (userId && orgId) {
      setIsLoading(true);
      const path = `/organization/${orgId}`;
      console.log("Navigating to:", path);

      router.push(path);
    } else {
      console.log("Missing userId or orgId:", { userId, orgId });
    }
  };

  const handleModelChange = (model: Voice) => {
    setSelectedModel(model);
  };

  useEffect(() => {
    document.documentElement.style.fontSize = `${zoomLevel}%`;
  }, [zoomLevel]);

  return (
    <div
      className="w-full flex items-center px-4 gap-x-4 
        backdrop-blur-sm border-b 
       "
    >
      {user ? (
        <WelcomeModal username={user.firstName || "User"} boardId={data.id} />
      ) : null}
      {/* Left section */}

      <Hint description="Go to Home">
        <button
          onClick={handleOnClick}
          className="hover:bg-slate-100 dark:hover:bg-black p-2 rounded-md disabled:opacity-50 disabled:pointer-events-none"
          disabled={isLoading}
        >
          <Home className="h-4 w-4 text-foreground" />
        </button>
      </Hint>
      <Separator orientation="vertical" className="h-6 bg-muted-foreground" />
      <div className="group relative flex items-center">
        <BoardTitleForm data={data} />
        {user && (
          <div
            className="        transition-transform
        duration-300
        transform
        translate-x-0
        group-hover:translate-x-[150px] absolute left-[calc(100%-125px)] top-1/2 -translate-y-1/2"
          >
            <ReadTasksButton
              username={user.firstName || "User"}
              boardId={data.id}
            />
          </div>
        )}
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
            </>
          )}
        </div>
        <BoardSettings
          boardId={data.id}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
          colorBlindMode={colorBlindMode}
          setColorBlindMode={setColorBlindMode}
          onModelChange={handleModelChange}
        />
        <Separator orientation="vertical" className="h-6 bg-muted-foreground" />
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
