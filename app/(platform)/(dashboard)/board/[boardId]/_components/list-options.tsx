"use client";

import { List } from "@prisma/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Brush, MoreHorizontal } from "lucide-react";
import { FormSubmit } from "@/components/form/form-submit";
import { useAction } from "@/hooks/use-actions";
import { deleteList } from "@/actions/delete-list";
import { toast } from "sonner";
import { ElementRef, useRef, useState } from "react";
import { copyList } from "@/actions/copy-list";
import { Copy, Trash, Plus } from "lucide-react";
import { updateList } from "@/actions/update-list";
import { useParams } from "next/navigation";
import { updateCards } from "@/actions/update-cards";

interface ListOptionsProps {
  data: List;
  onAddCard: () => void;
}

const colors = [
  { card: "#FDE8E8", list: "#F6B7B7" },
  { card: "#FEF3DC", list: "#F9CF8E" },
  { card: "#FFF9D5", list: "#FAE587" },
  { card: "#D6F8D6", list: "#94DA94" },
  { card: "#D7F2F8", list: "#8AC9DA" },
  { card: "#DEE8FA", list: "#A4B8F2" },
  { card: "#E9DFF9", list: "#C7A6F2" },
  { card: "#EAEAEA", list: "#B3B3B3" },
  { card: "#FCD4D4", list: "#F28D8D" },
  { card: "#FDEAC5", list: "#F7C36B" },
  { card: "#FFF4B8", list: "#F5D34A" },
  { card: "#C8F3C8", list: "#72C372" },
  { card: "#C7EDF5", list: "#68BED1" },
  { card: "#C9E3F5", list: "#74AEE1" },
  { card: "#E4D6F6", list: "#A28CE2" },
  { card: "#E7E7E7", list: "#9F9F9F" },
];

export const ListOptions = ({ data, onAddCard }: ListOptionsProps) => {
  const closeRef = useRef<ElementRef<"button">>(null);
  const params = useParams();

  const [selectedColor, setSelectedColor] = useState<{
    card: string;
    list: string;
  } | null>(null);

  const handleColorSelect = (color: { card: string; list: string }) => {
    setSelectedColor(color);
    onUpdateCard(color.card);
    onUpdateList(color.list);
  };

  const { execute: executeDelete } = useAction(deleteList, {
    onSuccess: (data) => {
      toast.success(`List "${data.title}" deleted.`);
      closeRef.current?.click();
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const { execute: executeCopy } = useAction(copyList, {
    onSuccess: (data) => {
      toast.success(`List "${data.title}" copied. `);
      closeRef.current?.click();
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const { execute: executeUpdateList } = useAction(updateList, {
    onSuccess: (data) => {
      toast.success(`List color "${data.title}" updated. `);
      closeRef.current?.click();
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const { execute: executeUpdateCards } = useAction(updateCards, {
    onSuccess: () => {
      toast.success(`Card Color updated! `);
      closeRef.current?.click();
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const onCopy = (formData: FormData) => {
    const id = formData.get("id") as string;
    const boardId = formData.get("boardId") as string;
    executeCopy({ id, boardId });
  };

  const onDelete = (formData: FormData) => {
    const id = formData.get("id") as string;
    const boardId = formData.get("boardId") as string;
    executeDelete({ id, boardId });
  };

  const onUpdateList = (listColor: string) => {
    // How do we get the board id and the card id if we don't have form data
    const boardId = params.boardId as string;

    executeUpdateList({
      id: data.id,
      title: data.title,
      boardId,
      color: listColor,
    });
  };

  const onUpdateCard = (cardColor: string) => {
    // How do we get the board id and the card id if we don't have form data
    const boardId = params.boardId as string;

    executeUpdateCards({
      listId: data.id,
      boardId,
      color: cardColor,
    });
  };

  return (
    <>
      {/* color  */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            className="h-auto w-auto p-2 text-neutral-700 hover:bg-transparent"
            variant="ghost"
          >
            <Brush className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="bg-popover w-full"
          side="bottom"
          align="start"
        >
          <div className="font-semibold text-neutral-500 text-sm pb-2">
            Color
          </div>
          <div className="grid grid-cols-8 gap-2">
            {colors.map(({ card, list }, index) => (
              <div
                key={index}
                className="w-8 h-8 relative cursor-pointer"
                onClick={() => handleColorSelect({ card, list })}
              >
                {/* ListColorBlock */}
                <div
                  className="w-full h-1/4 rounded-t-md"
                  style={{ backgroundColor: list }}
                ></div>
                {/* CardColorBlock */}
                <div
                  className="w-full h-1/2 rounded-b-md"
                  style={{ backgroundColor: card }}
                ></div>
                {/* Outline for the selected color */}
                {(selectedColor?.card === card ||
                  selectedColor?.list === list) && (
                  <div className=" h-6 w-8 absolute inset-0 border-2 border-blue-500 rounded-md"></div>
                )}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      {/* options */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            className="h-auto w-auto p-2 text-neutral-700 hover:bg-transparent"
            variant="ghost"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="bg-popover w-40 px-0 pt-3 pb-3"
          side="bottom"
          align="start"
        >
          <PopoverClose ref={closeRef} asChild></PopoverClose>
          <Button
            onClick={onAddCard}
            className="flex items-center gap-2 rounded- w-full h-full  px-2 py-1.5  justify-start font-normal text-sm"
            variant="ghost"
          >
            <Plus className="h-4 w-4" />
            Add Card
          </Button>
          <form action={onCopy}>
            <input hidden name="id" id="id" value={data.id} />
            <input hidden name="boardId" id="boardId" value={data.boardId} />
            <FormSubmit
              className="flex items-center gap-2 rounded-sm w-full h-full  px-2 py-1.5  justify-start font-normal text-sm"
              variant="ghost"
            >
              <Copy />
              Copy List
            </FormSubmit>
          </form>
          <form action={onDelete}>
            <input hidden name="id" id="id" value={data.id} />
            <input hidden name="boardId" id="boardId" value={data.boardId} />
            <FormSubmit
              className="flex items-center gap-2 text-red-500 rounded-sm w-full h-full  px-2 py-1.5 justify-start font-normal text-sm"
              variant="ghost"
            >
              <Trash /> Delete List
            </FormSubmit>
          </form>
        </PopoverContent>
      </Popover>
    </>
  );
};
