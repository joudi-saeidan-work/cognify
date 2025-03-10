import { Button } from "@/components/ui/button";
import { Board } from "@prisma/client";
import { Star, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAction } from "@/hooks/use-actions";
import { updateBoard } from "@/actions/update-board";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface BoardItemProps {
  board: Board;
  isLoading?: boolean;
  onBoardClick: (boardId: string) => void;
}

const BoardItem = ({
  board,
  isLoading = false,
  onBoardClick,
}: BoardItemProps) => {
  const router = useRouter();
  const { execute: executeUpdateBoard, isLoading: isUpdatingBoard } = useAction(
    updateBoard,
    {
      onSuccess: (data) => {
        toast.success(`Board Updated!`);
      },
      onError: (error) => {
        toast.error(error);
      },
    }
  );

  const handleBoardUpdate = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the Link navigation
    e.preventDefault();

    const isFavorite = !board.isFavorite;
    executeUpdateBoard({
      id: board.id,
      title: board.title,
      isFavorite: isFavorite,
    });
  };

  const handleClick = () => {
    onBoardClick(board.id);
    // Navigate to the board page
    router.push(`/board/${board.id}`);
  };

  // Determine if any loading state is active
  const isLoadingState = isLoading || isUpdatingBoard;

  return (
    <Link
      key={board.id}
      href={`/board/${board.id}`}
      style={{ backgroundImage: `url(${board.imageThumbUrl})` }}
      className={`group relative aspect-video bg-no-repeat bg-center bg-cover bg-sky-700 rounded-sm h-full w-full p-2 overflow-hidden ${
        isLoadingState ? "opacity-70 pointer-events-none" : ""
      }`}
      onClick={handleClick}
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
          onClick={handleBoardUpdate}
          disabled={isUpdatingBoard}
        >
          <Star
            className={`w-10 h-10 ${
              board.isFavorite ? "text-yellow-400" : "text-white"
            } ${isUpdatingBoard ? "opacity-50" : ""}`}
          />
          {isUpdatingBoard && (
            <Loader2 className="absolute h-4 w-4 animate-spin text-yellow-400" />
          )}
        </Button>
      </div>

      {/* Loading overlay - show for both navigation and updating */}
      {isLoadingState && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm font-medium text-primary">
            {isUpdatingBoard ? "Updating..." : "Preparing your board..."}
          </span>
        </div>
      )}
    </Link>
  );
};

export default BoardItem;
