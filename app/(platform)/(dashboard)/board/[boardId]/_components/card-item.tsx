"use client";

import { Card } from "@prisma/client";
import { Draggable } from "@hello-pangea/dnd";
import { useCardModal } from "@/hooks/use-card-modal";
import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";

interface CardItemProps {
  data: Card;
  index: number;
}

export const CardItem = ({ data, index }: CardItemProps) => {
  // we need the card model to track the state of a card
  const cardModal = useCardModal();
  const { onOpen } = cardModal;
  return (
    <Draggable draggableId={data.id} index={index}>
      {(provided) => (
        <div
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
          role="content"
          // TODO: condiser updating the card items
          className="relative flex flex-col justify-between border-2 border-transparent hover:border-black/30 py-2 px-3 text-sm bg-white rounded-md  shadow-sm "
        >
          <span className="whitespace-pre-wrap break-words overflow-hidden text-ellipsis">
            {data.title}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="absolute bottom-2 right-2 h-4 w-4 text-neutral-600"
            onClick={() => onOpen(data.id)}
            title="Expand"
          >
            <Maximize2></Maximize2>
          </Button>
        </div>
      )}
    </Draggable>
  );
};
