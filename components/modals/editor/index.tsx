"use client"; // This directive ensures the component is rendered on the client side.

import { useQuery, useQueryClient } from "@tanstack/react-query"; // Hook for fetching and caching data.
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"; // Dialog components for displaying modals.
import { useCardModal } from "@/hooks/use-card-modal"; // Custom hook to manage the state of the card modal.
import { CardWithList } from "@/types"; // Type definition for a card with its associated list.
import { fetcher } from "@/lib/fetcher"; // Utility function for making API requests.
import { CardHeader } from "./header"; // Header component for displaying card information.
import Editor from "./editor";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { useAction } from "@/hooks/use-actions";
import { toast } from "sonner";
import { updateCard } from "@/actions/update-card";

export const defaultValue = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: 'write or type " / " for commands' }],
    },
  ],
};

export const ContentForm = () => {
  const id = useCardModal((state) => state.id) as string;

  const isOpen = useCardModal((state) => state.isOpen);
  const onClose = useCardModal((state) => state.onClose);

  const { data: cardData } = useQuery<CardWithList>({
    queryKey: ["card", id], // Unique key for caching the card data.
    queryFn: () => fetcher(`/api/cards/${id}`), // Function to fetch the card data from the API.
  });
  console.log(`Printing Data "${cardData}"`); //this is undefined

  const params = useParams();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState<string>("");

  const enableEditing = () => {
    setIsEditing(true);
  };

  const disableEditing = () => {
    setIsEditing(false);
  };

  // TODO validate content

  // ToDO fix server actions
  const { execute, fieldErrors } = useAction(updateCard, {
    onSuccess: (cardData: any) => {
      queryClient.invalidateQueries({
        queryKey: ["card", cardData.id],
      });
      queryClient.invalidateQueries({ queryKey: ["card-logs", cardData.id] });

      toast.success(`Card "${cardData.title} updated"`);
      disableEditing();
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  // Get values
  const handleSubmit = (values: any) => {
    const description = content;
    const boardId = params.boardId as string;
    // ToDO execute
    execute({ boardId, id: cardData?.id, description });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* <DialogContent className="rounded-lg shadow-lg bg-white border border-gray-200 w-[85%] h-[95%] mx-auto"> */}
      {/* <DialogContent className="rounded-lg shadow-lg bg-white border border-gray-200 w-[85%] h-[95%] mx-auto flex flex-col"> */}
      <DialogContent className="rounded-lg shadow-lg bg-white border border-gray-200 w-[85%] h-[95%] mx-auto flex flex-col">
        <DialogTitle className="hidden">Edit Card</DialogTitle>
        {!cardData ? (
          <></>
        ) : (
          <div className="flex flex-col h-full">
            <CardHeader data={cardData} />
            <div className="flex-grow bg-neutral-100 overflow-hidden pl-10 pr-10 pt-10">
              <Editor initialValue={defaultValue} onChange={setContent} />
            </div>
            <Button type="submit" onClick={handleSubmit}>
              Save Note
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
