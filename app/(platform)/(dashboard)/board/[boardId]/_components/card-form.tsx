"use client";

import { FormTextarea } from "@/components/form/form-textarea";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { ElementRef, forwardRef, KeyboardEventHandler, useRef } from "react";
import { useAction } from "@/hooks/use-actions";
import { createCard } from "@/actions/create-card";
import { useParams } from "next/navigation";
import { useOnClickOutside, useEventListener } from "usehooks-ts";
import { toast } from "sonner";

interface CardFormProps {
  listId: string;
  enableEditing: () => void;
  disableEditing: () => void;
  isEditing: boolean;
}

export const CardForm = forwardRef<HTMLTextAreaElement, CardFormProps>(
  ({ listId, disableEditing, enableEditing, isEditing }, ref) => {
    const params = useParams();
    const formRef = useRef<ElementRef<"form">>(null);

    const { execute, fieldErrors } = useAction(createCard, {
      onSuccess: (data) => {
        toast.success(`Card "${data.title}" created `);
        formRef.current?.reset();
      },
      onError: (error) => {
        toast.error(error);
      },
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        disableEditing();
      }
    };
    useOnClickOutside(formRef, disableEditing);
    useEventListener("keydown", onKeyDown);

    const onTextareaDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        formRef.current?.requestSubmit();
        disableEditing();
      }
    };

    const onSubmit = (formData: FormData) => {
      const title = formData.get("title") as string;
      const listId = formData.get("listId") as string;
      const boardId = params.boardId as string;

      execute({ title, boardId, listId });
    };

    if (isEditing) {
      return (
        <form className="m-1 py-0.5 space-y-4" action={onSubmit} ref={formRef}>
          <FormTextarea
            id="title"
            onKeyDown={onTextareaDown}
            ref={ref}
            placeholder="write anything ..."
            errors={fieldErrors}
            className="resize-none relative flex flex-col justify-between border-2 border-transparent hover:border-black/30 py-2 px-3 text-sm bg-white rounded-md shadow-none w-full"
          />
          <input hidden id="listId" name="listId" value={listId} />
          <div />
        </form>
      );
    }

    return (
      <div className="pt-2 px-2">
        <Button
          className="h-auto px-2 py-1.5 w-full justify-start text-muted-foreground text-sm"
          size="sm"
          variant="ghost"
          onClick={enableEditing}
        >
          <Plus className="h-4 w-4 mr-2" />
          write or type "/" for commands
        </Button>
      </div>
    );
  }
);

CardForm.displayName = "CardForm";
