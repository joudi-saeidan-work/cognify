import { Button } from "@/components/ui/button";
import { useCardModal } from "@/hooks/use-card-modal";
import { Maximize2, Notebook, NotebookPen, NotepadText, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose,
} from "@/components/ui/popover";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";
interface CardExpandProps {
  id: string;
}
const CardExpand = ({ id }: CardExpandProps) => {
  const cardModal = useCardModal();
  const { onOpen } = cardModal;

  // need the card id to get the description to check if the user already have a description
  const queryClient = useQueryClient();

  const [isExpanded, setIsExpanded] = useState(false);

  // ToDo what happens if we copy a card?
  // get the card id and open the card model and render the note icon
  const handleExpandToNote = async () => {
    await queryClient.prefetchQuery(["card", id], () =>
      fetcher(`api/cards/${id}`)
    );
    onOpen(id); // open card model
    setIsExpanded(true); // set state
  };

  if (isExpanded) {
    return (
      <Button
        size="sm"
        variant="ghost"
        className="absolute right-2 h-4 w-4 text-neutral-700"
        title="Open Note"
        onClick={handleExpandToNote}
      >
        <NotepadText className="w-4 h-4"></NotepadText>
      </Button>
    );
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="absolute right-2 h-4 w-4 text-neutral-700"
          title="Expand"
        >
          <Maximize2 className="w-4 h-4"></Maximize2>
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start">
        <div className="text-sm mb-2">Expand to</div>
        <PopoverClose asChild />
        <Button
          variant="ghost"
          onClick={handleExpandToNote}
          className="flex items-center gap-2  w-full rounded-none px-2 py-1 h-auto justify-start font-medium "
        >
          <NotebookPen className="w-4 h-4"></NotebookPen>
          Note
        </Button>
      </PopoverContent>
    </Popover>
  );
};

export default CardExpand;
