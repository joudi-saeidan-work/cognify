"use client"; // This directive ensures the component is rendered on the client side.

import { useQuery, useQueryClient } from "@tanstack/react-query"; // Hook for fetching and caching data.
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"; // Dialog components for displaying modals.
import { useCardModal } from "@/hooks/use-card-modal"; // Custom hook to manage the state of the card modal.
import { CardWithList } from "@/types"; // Type definition for a card with its associated list.
import { fetcher } from "@/lib/fetcher"; // Utility function for making API requests.
import { CardHeader } from "./header"; // Header component for displaying card information.
import Editor from "./editor";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useAction } from "@/hooks/use-actions";
import { toast } from "sonner";
import { updateCard } from "@/actions/update-card";
import useDebounce from "@/hooks/use-debounce";

export const defaultHtml = `<p className="absolute top-0 left-0 text-gray-400 pointer-events-none p-4" >write or type " / " for commands</p>`;

export const ContentForm = () => {
  const id = useCardModal((state) => state.id);
  const isOpen = useCardModal((state) => state.isOpen);
  const onClose = useCardModal((state) => state.onClose);

  const params = useParams();
  const queryClient = useQueryClient();

  const lastSavedContentRef = useRef<string>("");
  const isInitialLoadRef = useRef<boolean>(true);
  const hasUserInteractedRef = useRef<boolean>(false);

  const [content, setContent] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">(
    "saved"
  );

  const { data: cardData } = useQuery<CardWithList>({
    queryKey: ["card", id],
    queryFn: () => fetcher(`/api/cards/${id}`),
    enabled: !!id,
  });

  // Default content
  const initialValue = JSON.stringify({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: `write or type "/" for commands` }],
      },
    ],
  });

  // Update content when card data changes
  useEffect(() => {
    if (cardData?.description) {
      setContent(cardData.description);
      lastSavedContentRef.current = cardData.description;
    } else {
      setContent(initialValue);
      lastSavedContentRef.current = initialValue;
    }
  }, [cardData, initialValue]);

  // Create a handler for editor changes
  const handleEditorChange = (newContent: string) => {
    // Mark that user has interacted with editor
    hasUserInteractedRef.current = true;
    setContent(newContent);
  };

  // Debounce content changes
  const debouncedContent = useDebounce(content, 1000);

  const { execute } = useAction(updateCard, {
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["card", data.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["card-logs", data.id],
      });
      setSaveStatus("saved");
    },
    onError: (error) => {
      setSaveStatus("error");
      toast.error(error);
    },
  });

  // Fix the auto-save effect
  useEffect(() => {
    // Only proceed if we have all the required data
    if (isOpen && id && debouncedContent && cardData) {
      // If this is the initial load, just set the flag and don't save
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
        lastSavedContentRef.current = debouncedContent;
        return;
      }

      // Only save if user has actually interacted with the editor
      if (!hasUserInteractedRef.current) {
        return;
      }

      // Current and previous content for comparison
      const currentContent = debouncedContent;
      const previousSavedContent = lastSavedContentRef.current;

      // Only save if content has actually changed from the last saved version
      if (currentContent !== previousSavedContent) {
        console.log("Content changed, saving...");
        setSaveStatus("saving");

        const boardId = params.boardId as string;
        execute({
          boardId,
          id: cardData.id,
          description: currentContent,
        }).then(() => {
          // Update the ref after successful save
          lastSavedContentRef.current = currentContent;
        });
      }
    }
  }, [debouncedContent, isOpen, id, cardData, params?.boardId, execute]);

  // Reset the interaction flags when the modal closes or card changes
  useEffect(() => {
    if (!isOpen) {
      isInitialLoadRef.current = true;
      hasUserInteractedRef.current = false;
    }
  }, [isOpen, id]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {id && cardData ? (
        <DialogContent className="bg-[#FFFDF7] dark:bg-[#282724] p-0 rounded-lg shadow-lg w-[90%] h-[90%] max-w-6xl">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b">
              <CardHeader data={cardData} />
              <div className="text-xs text-gray-500 mt-1">
                {saveStatus === "saving" && "Saving..."}
                {saveStatus === "saved" && "All changes saved"}
                {saveStatus === "error" && "Error saving changes"}
              </div>
            </div>

            {/* Editor - Add a container div with strict boundaries */}
            <div className="flex-1 overflow-auto relative">
              <div className="editor-container h-full">
                <Editor
                  initialValue={JSON.parse(content)}
                  onChange={handleEditorChange}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
};
