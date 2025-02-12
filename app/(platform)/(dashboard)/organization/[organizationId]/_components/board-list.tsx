"use client"; // ✅ This is a client component

import { useState } from "react";
import { LayoutDashboardIcon, Star, User2 } from "lucide-react";
import { Board } from "@prisma/client"; // ✅ Import Board type from Prisma
import BoardItem from "./board-item";
import CreateBoard from "./create-board";
import { Button } from "@/components/ui/button";

// ✅ Define props type
interface BoardListProps {
  boards: Board[];
}

const BoardList: React.FC<BoardListProps> = ({ boards }) => {
  const [favoriteBoards, setFavoriteBoards] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false); // track if we want to show fav boards

  const toggleFavorite = (id: string) => {
    setFavoriteBoards(
      (prev) =>
        prev.includes(id)
          ? prev.filter((boardId) => boardId !== id) // Remove if already favorite
          : [...prev, id] // Add if not favorite
    );
  };

  const displayedBoards = showFavorites
    ? boards.filter((board) => favoriteBoards.includes(board.id))
    : boards;

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
            !showFavorites ? "text-blue-500" : "text-gray-500"
          }`}
          onClick={() => setShowFavorites(false)} //
        >
          <LayoutDashboardIcon className="w-5 h-5" />
          All
        </Button>

        {/* Favorites Button */}
        <Button
          variant="ghost"
          className={`text-lg hover:bg-transparent flex items-center gap-x-2 ${
            showFavorites ? "text-yellow-400" : "text-gray-500"
          }`}
          onClick={() => setShowFavorites(true)}
        >
          <Star className="w-5 h-5" />
          Favorites
        </Button>
      </div>

      {/* Board List (Filtered Based on `showFavorites`) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedBoards.length > 0 ? (
          displayedBoards.map((board) => (
            <BoardItem
              key={board.id}
              board={board}
              favorites={favoriteBoards}
              toggleFavorite={toggleFavorite}
            />
          ))
        ) : (
          <p className="text-gray-500 text-center col-span-full">
            {showFavorites ? "No favorite boards yet." : ""}
          </p>
        )}
        {!showFavorites && <CreateBoard />}
      </div>
    </div>
  );
};

export default BoardList;
