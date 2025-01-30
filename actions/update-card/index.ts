"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { InputType, ReturnType } from "./types";
import { createSafeAction } from "@/lib/create-safe-actions";
import { UpdateCard } from "./schema";
import { values } from "lodash";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import { getEmbeddingForCard } from "../create-card";
import { notesIndex } from "@/lib/pinecone";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }
  const { id, boardId, ...values } = data;
  let card;

  try {
    const embedding = await getEmbeddingForCard(
      values.title,
      values.description
    );

    card = await db.$transaction(async (tx) => {
      const updatedCard = await tx.card.update({
        where: { id, list: { board: { orgId } } },
        data: { ...values },
      });

      await createAuditLog({
        entityTitle: updatedCard.title,
        entityId: updatedCard.id,
        entityType: ENTITY_TYPE.CARD,
        action: ACTION.UPDATE,
      });

      await notesIndex.upsert([
        { id: updatedCard.id, values: embedding, metadata: { userId } },
      ]);

      return updatedCard;
    });
  } catch (error) {
    return { error: "Failed to update" };
  }
  revalidatePath(`/board/${boardId}`);
  return { data: card };
};

export const updateCard = createSafeAction(UpdateCard, handler);
