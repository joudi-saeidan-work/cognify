"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";

import { InputType, ReturnType } from "./types";
import { createSafeAction } from "@/lib/create-safe-actions";
import { CreateLabel } from "./schema";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { name, color, boardId, organizationId } = data;
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

    // Create the label
    label = await db.label.create({
      data: {
        name: name || null,
        color,
        boardId,
      },
    });
  } catch (error) {
    console.error("Label creation error:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while creating the label",
    };
  }

  revalidatePath(`/board/${boardId}`);
  return { data: label };
};

export const createLabel = createSafeAction(CreateLabel, handler);
