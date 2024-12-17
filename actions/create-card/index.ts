"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

import { InputType, ReturnType } from "./types";
import { createSafeAction } from "@/lib/create-safe-actions";
import { CreateCard } from "./schema";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }
  const { title, boardId, listId } = data;
  let card;
  let list;

  // try to find the list where the card is
  try {
    list = await db.list.findUnique({
      where: { id: listId, board: { orgId } },
    });
    if (!list) {
      return {
        error: "list not found ",
      };
    }

    // determine the new order for the card

    const lastCard = await db.card.findFirst({
      where: { listId: listId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const newOrder = lastCard ? lastCard.order + 1 : 1;

    card = await db.card.create({
      data: { title, listId, order: newOrder },
    });

    await createAuditLog({
      entityId: card.id,
      entityTitle: card.title,
      entityType: ENTITY_TYPE.CARD,
      action: ACTION.CREATE,
    });
  } catch (error) {
    return { error: "Failed to create" };
  }
  revalidatePath(`/boards/${boardId}`);
  return { data: card };
};

export const createCard = createSafeAction(CreateCard, handler);
