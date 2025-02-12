"use client";

import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-actions";
import { createBoard } from "@/actions/create-board";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const CreateBoard = () => {
  const router = useRouter();

  const { execute: executeCreateBoard } = useAction(createBoard, {
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
      className="aspect-video relative h-full w-full bg-muted rounded-sm flex flex-col gap-y-1 justify-center items-center hover:opacity-75 transition"
    >
      <p className="text-xl text-muted-foreground">Create new board</p>
    </Button>
  );
};

export default CreateBoard;
