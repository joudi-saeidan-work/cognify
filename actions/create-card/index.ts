"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

import { InputType, ReturnType } from "./types";
import { createSafeAction } from "@/lib/create-safe-actions";
import { CreateCard } from "./schema";
import { getEmbedding } from "@/lib/openai";
import { describe } from "node:test";
import { notesIndex } from "@/lib/pinecone";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }
  const { title, color, boardId, listId, description } = data;
  let list;
  let card;

  // try to find the list where the card is
  try {
    list = await db.list.findUnique({
      where: { id: listId, color, board: { orgId } },
    });
    if (!list) {
      return {
        error: "list not found ",
      };
    }

    //check if there is an existing card in the same list with a color
    const existingCardWithColor = await db.card.findFirst({
      where: { listId, NOT: { color: null } },
      select: { color: true },
    });

    // use the color from the existing card, or use default color
    const inheritedColor = existingCardWithColor?.color || color || "#FFFFFF";

    // determine the new order for the card
    const lastCard = await db.card.findFirst({
      where: { listId: listId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const newOrder = lastCard ? lastCard.order + 1 : 1;

    // creates card embedding
    const embedding = await getEmbeddingForCard(title, description);

    // if for some reason the card did not get created we don't want to create an embedding for it..

    const card = await prisma?.$transaction(async (tx) => {
      const card = await tx.card.create({
        data: { title, listId, color: inheritedColor, order: newOrder },
      });
      await createAuditLog({
        entityId: card.id,
        entityTitle: card.title,
        entityType: ENTITY_TYPE.CARD,
        action: ACTION.CREATE,
      });
      // create/update entries in pinecone

      await notesIndex.upsert([
        { id: card.id, values: embedding, metadata: { userId } },
      ]);
      return card;
    });
  } catch (error) {
    return { error: "Failed to create" };
  }
  revalidatePath(`/boards/${boardId}`);
  return { data: card };
};

export const createCard = createSafeAction(CreateCard, handler);

export async function getEmbeddingForCard(
  title: string | undefined,
  description: string | undefined
) {
  return getEmbedding(title + "\n\n" + description) ?? "";
}
