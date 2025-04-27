"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-actions";
import { UpdateBookmark } from "./schema";
import { InputType, ReturnType } from "./type";
const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { id, title, url, folderId } = data;

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
    bookmark = await db.bookmark.update({
      where: {
        id,
      },
      data: {
        title,
        url,
        folderId,
      },
    });
  } catch (error) {
    return { error: "Failed to update bookmark" };
  }

  revalidatePath(`/organization/${orgId}`);
  return { data: bookmark };
};

export const updateBookmark = createSafeAction(UpdateBookmark, handler);
