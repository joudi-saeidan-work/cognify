"use client";

import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-actions";
import { createBoard } from "@/actions/create-board";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const CreateBoard = () => {
  const router = useRouter();

  const { execute: executeCreateBoard, isLoading } = useAction(createBoard, {
    onSuccess: (data) => {
      toast.success("Board Created!");
      router.push(`/board/${data.id}`);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const handleCreateBoard = () => {
    const title = "Untitled";

    executeCreateBoard({ title });
  };

  return (
    <Button
      variant="ghost"
      onClick={handleCreateBoard}
      disabled={isLoading}
      className="aspect-video relative h-full w-[95%] md:w-full bg-muted rounded-sm flex flex-col gap-y-1 justify-center items-center hover:opacity-75 transition"
      aria-label="Create Board"
    >
      {isLoading ? (
        <div className="flex flex-col items-center gap-y-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Creating your board...
          </p>
        </div>
      ) : (
        <p className="text-xl text-muted-foreground">Create new board</p>
      )}
    </Button>
  );
};

export default CreateBoard;
