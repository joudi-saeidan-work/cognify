"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { InputType, ReturnType } from "./types";
import { createSafeAction } from "@/lib/create-safe-actions";
import { UpdateCardOrder } from "./schema";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }
  const { items, boardId } = data;

  let updatedCards;

  try {
    const transation = items.map((card) =>
      db.card.update({
        where: { id: card.id, list: { board: { orgId } } },
        data: {
          order: card.order,
          listId: card.listId,
        },
      })
    );
    updatedCards = await db.$transaction(transation);
  } catch (error) {
    return { error: "Failed to reorder" };
  }
  revalidatePath(`/board/${boardId}`);
  return { data: updatedCards };
};

export const updateCardOrder = createSafeAction(UpdateCardOrder, handler);
