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
import DOMPurify from "dompurify";
import { JSONContent } from "novel";

export const defaultHtml = `<p className="absolute top-0 left-0 text-gray-400 pointer-events-none p-4" >write or type " / " for commands</p>`;

export const ContentForm = () => {
  const id = useCardModal((state) => state.id);
  const isOpen = useCardModal((state) => state.isOpen);
  const onClose = useCardModal((state) => state.onClose);

  const params = useParams();
  const queryClient = useQueryClient();

  const {
    data: cardData,
    isLoading,
    isError,
  } = useQuery<CardWithList>({
    queryKey: ["card", id], // Unique key for caching the card data.
    queryFn: () => fetcher(`/api/cards/${id}`), // Function to fetch the card data from the API.
    enabled: !!id, //only fetch if `id` is defined
    onError: (error) => console.log("Error fetching card data", error),
  });

  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState<string>(
    JSON.stringify({ type: "doc", content: [] })
  );

  const enableEditing = () => {
    setIsEditing(true);
  };

  const disableEditing = () => {
    setIsEditing(false);
  };

  // TODO validate content

  const { execute } = useAction(updateCard, {
    onSuccess: (cardData: any) => {
      queryClient.invalidateQueries({
        queryKey: ["card", cardData.id],
      });
      queryClient.invalidateQueries({ queryKey: ["card-logs", cardData.id] });

      toast.success(`Card "${cardData.title} updated"`);
      onClose(); // Close modal after saving
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  // Get values
  const handleSubmit = () => {
    const description = content;
    const boardId = params.boardId as string;
    // ToDO execute
    execute({ boardId, id: cardData?.id, description });
  };

  // need to sanitize the html to protect the contents from XSS
  const sanitizedHtml = DOMPurify.sanitize(
    cardData?.description || defaultHtml
  );
  console.log(sanitizedHtml);

  if (!isOpen) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {id ? ( // Only render content if `id` exists
        <DialogContent className="rounded-lg shadow-lg bg-white border border-gray-200 w-[85%] h-[95%] mx-auto flex flex-col">
          <DialogTitle className="hidden">Edit Card</DialogTitle>
          {!cardData ? (
            <></>
          ) : (
            <div className="flex flex-col h-full">
              <CardHeader data={cardData} />
              <div className="flex-grow bg-neutral-100 overflow-hidden pl-10 pr-10 pt-10">
                <Editor
                  initialValue={JSON.parse(content)}
                  onChange={setContent}
                />
              </div>
              <Button type="submit" onClick={handleSubmit}>
                Save Note
              </Button>
            </div>
          )}
        </DialogContent>
      ) : null}
    </Dialog>
  );
};
