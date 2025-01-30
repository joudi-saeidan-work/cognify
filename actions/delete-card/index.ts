"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { InputType, ReturnType } from "./types";
import { createSafeAction } from "@/lib/create-safe-actions";
import { DeleteCard } from "./schema";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import { notesIndex } from "@/lib/pinecone";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }
  const { id, boardId } = data;

  let card;

  try {
    await prisma?.$transaction(async (tx) => {
      card = await db.card.delete({
        where: { id, list: { board: { orgId } } },
      });

      await createAuditLog({
        entityTitle: card.title,
        entityId: card.id,
        entityType: ENTITY_TYPE.CARD,
        action: ACTION.DELETE,
      });

      await notesIndex.deleteOne(id);
    });
  } catch (error) {
    return { error: "Failed to delete." };
  }
  revalidatePath(`/board/${boardId}`);
  return { data: card };
};

export const deleteCard = createSafeAction(DeleteCard, handler);
