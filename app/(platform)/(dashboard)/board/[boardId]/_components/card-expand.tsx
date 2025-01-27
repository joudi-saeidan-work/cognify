import { Button } from "@/components/ui/button";
import { useCardModal } from "@/hooks/use-card-modal";
import { Maximize2, Notebook, NotebookPen, NotepadText, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose,
} from "@/components/ui/popover";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";
import { CardWithList } from "@/types";
interface CardExpandProps {
  id: string;
}
const CardExpand = ({ id }: CardExpandProps) => {
  const cardModal = useCardModal();
  const { onOpen } = cardModal;

  const queryClient = useQueryClient();

  const [isExpanded, setIsExpanded] = useState(false);

  const { data: cardData } = useQuery<CardWithList>({
    queryKey: ["card", id], // Unique key for caching the card data.
    queryFn: () => fetcher(`/api/cards/${id}`), // Function to fetch the card data from the API.
    enabled: !!id, //only fetch if `id` is defined
  });

  useEffect(() => {
    if (cardData?.description) {
      setIsExpanded(true);
    }
  }, [cardData]);

  const handleExpandToNote = async () => {
    await queryClient.prefetchQuery(["card", id], () =>
      fetcher(`api/cards/${id}`)
    );
    onOpen(id);
    setIsExpanded(true);
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
