"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { InputType, ReturnType } from "./types";
import { createSafeAction } from "@/lib/create-safe-actions";
import { UpdateCards } from "./schema";
import { values } from "lodash";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }
  const { listId, boardId, color } = data;

  let cards;
  let updatedCount;
  try {
    cards = await db.card.updateMany({
      where: { listId, list: { board: { orgId } } },
      data: { color },
    });
    updatedCount = cards.count; // Get the count of updated rows
  } catch (error) {
    return { error: "Failed to update cards" };
  }
  revalidatePath(`/board/${boardId}`);
  return { data: { updatedCount } }; // Return the count of updated row
};

export const updateCards = createSafeAction(UpdateCards, handler);
