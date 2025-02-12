import { Button } from "@/components/ui/button";
import { Board } from "@prisma/client";
import { Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface BoardItemProps {
  board: Board;
  favorites: string[];
  toggleFavorite: (id: string) => void;
}
const BoardItem = ({ board, favorites, toggleFavorite }: BoardItemProps) => {
  // need to determine if the board is favorite
  const isFavorite = favorites.includes(board.id);

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    toggleFavorite(board.id);
  };
  return (
    <Link
      key={board.id}
      href={`/board/${board.id}`}
      style={{ backgroundImage: `url(${board.imageThumbUrl})` }}
      className="group relative aspect-video bg-no-repeat bg-center bg-cover bg-sky-700 rounded-sm h-full w-full p-2 overflow-hidden"
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition" />
      {/* Board Title (Top Center) */}

      <div className="absolute top-2 text-lg font-semibold text-white bg-black/50 px-2 py-1 rounded">
        {board.title}
      </div>
      {/* Star Button (Top Right) */}
      <div className="absolute top-1 right-0">
        <Button
          variant="ghost"
          className="w-6 h-6 hover:bg-transparent"
          onClick={handleClick}
        >
          <Star
            className={`w-10 h-10 ${
              isFavorite ? "text-yellow-400" : "text-white"
            }`}
          />
        </Button>
      </div>
    </Link>
  );
};

export default BoardItem;
