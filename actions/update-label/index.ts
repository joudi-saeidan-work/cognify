"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";

import { InputType, ReturnType } from "./types";
import { createSafeAction } from "@/lib/create-safe-actions";
import { UpdateLabel } from "./schema";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { id, name, color, boardId, organizationId } = data;
  const orgIdValue = organizationId ? organizationId : orgId;

  let label;

  try {
    // Verify the board exists and belongs to the organization
    const board = await db.board.findUnique({
      where: { id: boardId, orgId: orgIdValue },
    });

    if (!board) {
      return {
        error: "Board not found",
      };
    }

    // Update the label
    label = await db.label.update({
      where: {
        id,
        boardId, // Ensure the label belongs to the specified board
      },
      data: {
        ...(name !== undefined && { name }), // if name is provided update the name
        ...(color !== undefined && { color: color || "#000000" }), // if color is provided update color
      },
    });
  } catch (error) {
    console.error("Label update error:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while updating the label",
    };
  }

  revalidatePath(`/board/${boardId}`);
  return { data: label };
};

export const updateLabel = createSafeAction(UpdateLabel, handler);
