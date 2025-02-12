"use client";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose,
} from "@/components/ui/popover";
import { MoreHorizontal, Trash, Plus } from "lucide-react";
import { deleteBoard } from "@/actions/delete-board";
import { useAction } from "@/hooks/use-actions";
import { toast } from "sonner";
import { ElementRef, useRef } from "react";
import { createBoard } from "@/actions/create-board";
import { useRouter } from "next/navigation";

interface BoardOptionsProps {
  id: string;
}

const BoardOptions = ({ id }: BoardOptionsProps) => {
  const closeRef = useRef<ElementRef<"button">>(null);
  const router = useRouter();

  const { execute: executeDeleteBoard, isLoading: isLoadingDelete } = useAction(
    deleteBoard,
    {
      onError: (error) => toast.error(error),
    }
  );

  const onDelete = () => {
    executeDeleteBoard({ id });
    closeRef.current?.click();
  };

  const { execute: executeCreateBoard, isLoading } = useAction(createBoard, {
    onSuccess: (data) => {
      toast.success(`Board Created!`);
      router.push(`/board/${data.id}`);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const onCreate = () => {
    const title = "Untitled";
    executeCreateBoard({ title });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="h-auto w-auto p-2 hover:bg-neutral-500/10"
          variant="ghost"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="px-0 pt-3 pb-3" side="bottom" align="start">
        <PopoverClose ref={closeRef} asChild></PopoverClose>
        <Button
          className="flex items-center gap-2 w-full h-full px-2 py-1.5 justify-start font-normal text-sm hover:bg-neutral-500/10"
          variant="ghost"
          onClick={onCreate}
        >
          <Plus className="h-4 w-4" />
          Create Board
        </Button>
        <Button
          onClick={onDelete}
          disabled={isLoading}
          className="flex items-center gap-2 w-full h-full px-2 py-1.5 justify-start font-normal text-sm text-red-500 hover:bg-neutral-500/10"
          variant="ghost"
        >
          <Trash className="h-4 w-4" />
          Delete Board
        </Button>
      </PopoverContent>
    </Popover>
  );
};

export default BoardOptions;
