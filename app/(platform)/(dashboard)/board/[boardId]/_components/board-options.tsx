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
import { FormPopOver } from "@/components/form/form-popover";

interface BoardOptionsProps {
  id: string;
}

const BoardOptions = ({ id }: BoardOptionsProps) => {
  const closeRef = useRef<ElementRef<"button">>(null);

  const { execute, isLoading } = useAction(deleteBoard, {
    onError: (error) => toast.error(error),
  });

  const onDelete = () => {
    execute({ id });
    closeRef.current?.click();
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
        <FormPopOver sideOffset={10} side="right">
          <Button
            className="flex items-center gap-2 w-full h-full px-2 py-1.5 justify-start font-normal text-sm hover:bg-neutral-500/10"
            variant="ghost"
          >
            <Plus className="h-4 w-4" />
            Create Board
          </Button>
        </FormPopOver>
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
