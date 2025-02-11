import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  GripVertical,
  ClipboardCopy,
  Edit,
  Copy,
  Trash,
  CircleCheck,
  List,
  ListCheck,
  ListCollapse,
  ListOrdered,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query"; // Hook for fetching and caching data.
import { useParams } from "next/navigation";
import { useAction } from "@/hooks/use-actions";
import { copyCard } from "@/actions/copy-card";
import { toast } from "sonner";
import { deleteCard } from "@/actions/delete-card";
import { Card } from "@prisma/client";
import { ElementRef, useState, useRef } from "react";

interface CardOptionsProps {
  data: Card;
}

const CardOptions = ({ data }: CardOptionsProps) => {
  // gets the board id
  const params = useParams();

  // copy card action
  const { execute: executeCopyCard, isLoading: isLoadingCopy } = useAction(
    copyCard,
    {
      onSuccess: (data) => {
        toast.success(`Card "${data.title} copied"`);
      },
      onError: (error) => {
        toast.error(error);
      },
    }
  );

  // delete card action
  const { execute: executeDeleteCard, isLoading: isLoadingDelete } = useAction(
    deleteCard,
    {
      onSuccess: (data) => {
        toast.success(`Card "${data.title} deleted."`);
      },
      onError: (error) => {
        toast.error(error);
      },
    }
  );

  // handle copy
  const onCopy = () => {
    const boardId = params.boardId as string;
    const id = data.id;
    console.log(`copy id: ${id}`);
    executeCopyCard({ id, boardId });
  };

  // handle delete
  const onDelete = () => {
    const boardId = params.boardId as string;
    const id = data.id;
    console.log(`delete id: ${id}`);

    executeDeleteCard({ id, boardId });
  };

  const getTextColor = () => {
    if (data?.color && data?.color !== "bg-background")
      return "text-neutral-700";
    return "text-foreground";
  };

  return (
    <DropdownMenu>
      {/* Trigger for the dropdown menu */}
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className={`absolute left-0 h-4 w-4 text-neutral-700 hover:bg-transparent ${getTextColor()}`}
          title="Actions"
        >
          <GripVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>

      {/* Dropdown menu content */}
      <DropdownMenuContent side="bottom" align="start" className="w-48">
        {/* Turn Into Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <div className="flex items-center gap-2">
              <ClipboardCopy className="w-4 h-4" />
              Turn into
            </div>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>
              <div className="flex items-center gap-2">
                <CircleCheck className="w-4 h-4" />
                Task
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex items-center gap-2">
                <ListCollapse className="w-4 h-4" />
                Toggle list
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex items-center gap-2">
                <ListCheck className="w-4 h-4" />
                Checklist
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex items-center gap-2">
                <List className="w-4 h-4" />
                Bullet list
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex items-center gap-2">
                <ListOrdered className="w-4 h-4" />
                Numbered list
              </div>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        {/* Copy Option */}
        <DropdownMenuItem onClick={onCopy}>
          <div className="flex items-center gap-2">
            <Copy className="w-4 h-4" />
            Copy
          </div>
        </DropdownMenuItem>

        {/* Delete Option */}
        <DropdownMenuItem className="text-red-500" onClick={onDelete}>
          <div className="flex items-center gap-2">
            <Trash className="w-4 h-4" />
            Delete
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CardOptions;
