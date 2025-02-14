"use client";

import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-actions";
import { Board } from "@prisma/client";
import { ElementRef, TextareaHTMLAttributes, useRef, useState } from "react";
import { updateBoard } from "@/actions/update-board";
import { toast } from "sonner";
import { FormTextarea } from "@/components/form/form-textarea";
import { FormPopOver } from "@/components/form/form-popover";
import { ImageIcon } from "lucide-react";

interface BoardTitleFormProps {
  data: Board;
}

export const BordTitleForm = ({ data }: BoardTitleFormProps) => {
  const { execute, fieldErrors } = useAction(updateBoard, {
    onSuccess: (data) => {
      toast.success(`Board ${data.title} Updated!`);
      disableEditing();
      setTitle(data.title);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const formRef = useRef<ElementRef<"form">>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [title, setTitle] = useState(data.title);

  const [isEditing, setIsEditing] = useState(false);

  const disableEditing = () => setIsEditing(false);

  const enableEditing = () => {
    // Focus Input
    setIsEditing(true);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    });
  };

  const onSubmit = (formData: FormData) => {
    const title = formData.get("title") as string;
    execute({ title, id: data.id });
  };
  const onBlur = () => {
    formRef.current?.requestSubmit();
  };

  // when user clicks Enter new board is created
  const onTextareaDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
      disableEditing();
    }
  };

  // when editing
  return (
    <div className="group flex items-center gap-x-2">
      {isEditing ? (
        <form
          action={onSubmit}
          ref={formRef}
          className="flex items-center gap-x-2"
        >
          <FormTextarea
            onKeyDown={onTextareaDown}
            ref={textareaRef}
            id="title"
            onBlur={onBlur}
            defaultValue={title}
            className="resize-none shadow-none text-lg font-bold px-[7px] py-1 h-7 focus-visible:outline-none focus-visible:ring-transparent border-none"
            color={"transparent"}
            errors={fieldErrors}
          />
        </form>
      ) : (
        <div className="flex items-center gap-x-2">
          <Button
            className="font-bold text-lg h-auto w-auto p-1 px-2 text-foreground"
            variant="transparent"
            onClick={enableEditing}
          >
            {title}
          </Button>

          {/* Add Cover Button - Only shows on hover */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <FormPopOver board={data}>
              <Button variant="ghost" size="sm" className="h-auto p-1">
                <ImageIcon className="h-4 w-4" />
                {data.color || data.imageFullUrl ? (
                  <span>Change Cover</span>
                ) : (
                  <span>Add Cover</span>
                )}
              </Button>
            </FormPopOver>
          </div>
        </div>
      )}
    </div>
  );
};
