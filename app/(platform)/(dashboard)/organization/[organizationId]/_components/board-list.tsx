"use client";

import { useState } from "react";
import { LayoutDashboardIcon, Star, User2 } from "lucide-react";
import { Board } from "@prisma/client";
import BoardItem from "./board-item";
import CreateBoard from "./create-board";
import { Button } from "@/components/ui/button";

interface BoardListProps {
  boards: Board[];
}

const BoardList: React.FC<BoardListProps> = ({ boards }) => {
  const [showFavorites, setShowFavorites] = useState(false); // track if we want to show fav boards
  const [loadingBoardId, setLoadingBoardId] = useState<string | null>(null);

  const displayedBoards = showFavorites
    ? boards.filter((board) => board.isFavorite === true)
    : boards;

  // Function to handle board selection and loading state
  const handleBoardClick = (boardId: string) => {
    setLoadingBoardId(boardId);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center font-semibold text-2xl text-muted-foreground pb-5">
        <User2 className="h-10 w-10 mr-2" />
        Your Boards
      </div>

      {/* Toggle Buttons */}
      <div className="flex gap-x-5 font-semibold text-muted-foreground">
        {/* All Boards Button */}
        <Button
          variant="ghost"
          className={`text-lg hover:bg-transparent flex items-center gap-x-2 ${
            !showFavorites
              ? "text-blue-900 dark:text-blue-300"
              : "text-gray-900 dark:text-gray-300"
          }`}
          onClick={() => setShowFavorites(false)} //
          aria-label="All Boards Button"
        >
          <LayoutDashboardIcon
            className="w-5 h-5"
            aria-label="All Boards Icon"
          />
          All
        </Button>

        {/* Favorites Button */}
        <Button
          variant="ghost"
          className={`text-lg hover:bg-transparent flex items-center gap-x-2 ${
            showFavorites
              ? "text-yellow-600 dark:text-yellow-300"
              : "text-gray-900 dark:text-gray-300"
          }`}
          onClick={() => setShowFavorites(true)}
          aria-label="Favorites Button"
        >
          <Star className="w-5 h-5" aria-label="Favorites Icon" />
          Favorites
        </Button>
      </div>

      {/* Board List (Filtered Based on `showFavorites`) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayedBoards.length > 0 ? (
          displayedBoards.map((board) => (
            <BoardItem
              key={board.id}
              board={board}
              isLoading={loadingBoardId === board.id}
              onBoardClick={handleBoardClick}
              aria-label="Board Item"
            />
          ))
        ) : (
          <p className="text-gray-900 dark:text-gray-300 text-center col-span-full">
            {showFavorites ? "No favorite boards yet." : ""}
          </p>
        )}
        {!showFavorites && <CreateBoard aria-label="Create Board" />}
      </div>
    </div>
  );
};

export default BoardList;
