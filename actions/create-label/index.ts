"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";

import { InputType, ReturnType } from "./types";
import { CreateLabel } from "./schema";
import { createSafeAction } from "@/lib/create-safe-actions";

const handler = async (
  data: z.infer<typeof CreateLabel>
): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { name, color, boardId, organizationId } = data;
  const orgIdValue = organizationId ? organizationId : orgId;

  // First, check if a label with the same name and board already exists
  const existingLabel = await db.label.findFirst({
    where: {
      name,
      boardId,
    },
  });

  // If it exists and has the same color, return an error
  if (existingLabel && existingLabel.color === color) {
    return {
      error: "A label with this name and color already exists on this board",
    };
  }

  // If it exists with a different color, that's okay
  // If it doesn't exist, create a new one
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

    label = await db.label.create({
      data: {
        name,
        color,
        board: {
          connect: {
            id: boardId,
          },
        },
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
