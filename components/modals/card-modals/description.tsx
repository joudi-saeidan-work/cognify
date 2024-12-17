"use client";

import { CardWithList } from "@/types";

import { AlignLeft } from "lucide-react";
import { useParams } from "next/navigation";
import { ElementRef, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useEventListener, useOnClickOutside } from "usehooks-ts";

import { useAction } from "@/hooks/use-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { FormTextarea } from "@/components/form/form-textarea";
import { FormSubmit } from "@/components/form/form-submit";
import { Button } from "@/components/ui/button";
import { updateCard } from "@/actions/update-card";
import { toast } from "sonner";
import { error } from "console";

interface DescriptionProps {
  data: CardWithList;
}

export const Description = ({ data }: DescriptionProps) => {
  const params = useParams();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);

  // Ref for the <textarea> element. Used to programmatically focus the textarea.
  const textareaRef = useRef<ElementRef<"textarea">>(null);
  // Ref for the entire form container. Used with `useOnClickOutside`
  // to detect clicks outside the form and disable editing.
  const formRef = useRef<ElementRef<"form">>(null);

  /**
   * Enables editing mode by:
   * 1. Setting `isEditing` to `true` to show the textarea.
   * 2. Using `setTimeout` to ensure the textarea is rendered before calling `focus()`.
   * 3. Calling `focus()` on the textarea so the user can start typing immediately.
   */
  const enableEditing = () => {
    setIsEditing(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    });
  };

  const disableEditing = () => {
    setIsEditing(false);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      disableEditing();
    }
  };

  // Listen for the "keydown" event (when any key is pressed), if the user clicks on any key on the keyboard it will call the keyDown functions which will check if the key is Escape and if it it it will disable editing
  useEventListener("keydown", onKeyDown);
  // Listen for clicks outside the form container to disable editing mode.
  useOnClickOutside(formRef, disableEditing);

  // server actions
  const { execute, fieldErrors } = useAction(updateCard, {
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["card", data.id],
      });
      queryClient.invalidateQueries({ queryKey: ["card-logs", data.id] });

      toast.success(`Card "${data.title} updated"`);
      disableEditing();
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const onSubmit = (formData: FormData) => {
    const description = formData.get("description") as string;

    const boardId = params.boardId as string;

    // ToDO execute
    execute({ boardId, id: data.id, description });
  };

  return (
    <div className="flex items-start gap-x-3 w-full">
      <AlignLeft className="h-5 w-5 mt-0.5 text-neutral-700" />
      <div className="w-full">
        {/* ToDo: description should not change it's size when the user zooms in */}
        <p className="text-sm font-semibold text-neutral-700 ">Description</p>
        <div className="pb-4"></div>
        {isEditing ? (
          <form ref={formRef} action={onSubmit} className="space-y-2">
            <FormTextarea
              id="description"
              className="w-full"
              placeholder="Add a more detailed description"
              defaultValue={data.description || undefined}
              ref={textareaRef}
              errors={fieldErrors}
            />
            <div className="flex items-center gap-x-2">
              <FormSubmit>Save</FormSubmit>
              <Button
                type="button"
                variant="ghost"
                onClick={disableEditing}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div
            onClick={enableEditing}
            role="button"
            className="min-h-[78px] bg-neutral-200 text-sm font-medium py-3 px-3.5 rounded-md"
          >
            {data.description || "Add a more detailed description..."}
          </div>
        )}
      </div>
    </div>
  );
};

Description.Skeleton = function DescriptionSkeleton() {
  return (
    <div className="flex items-start gap-x-3 w-full">
      <Skeleton className="h-6 w-6 bg-neutral-200" />
      <div className="w-full">
        <Skeleton className="w-24 h-6 mb-2 bg-neutral-200" />
        <Skeleton className="w-full h-[78px] bg-neutral-200" />
      </div>
    </div>
  );
};
