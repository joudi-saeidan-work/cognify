"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { InputType, ReturnType } from "./types";
import { createSafeAction } from "@/lib/create-safe-actions";
import { DeleteBookmark } from "./schema";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { id } = data;

  // First check if the bookmark exists and belongs to the organization
  const existingBookmark = await db.bookmark.findFirst({
    where: {
      id,
      orgId,
    },
  });

  if (!existingBookmark) {
    return {
      error: "Bookmark not found",
    };
  }

  let bookmark;

  try {
    bookmark = await db.bookmark.delete({
      where: {
        id,
      },
    });
  } catch (error) {
    return { error: "Failed to delete bookmark" };
  }

  revalidatePath(`/organization/${orgId}`);
  return { data: bookmark };
};

export const deleteBookmark = createSafeAction(DeleteBookmark, handler);
