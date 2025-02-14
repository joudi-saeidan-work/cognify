"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { InputType, ReturnType } from "./types";
import { createSafeAction } from "@/lib/create-safe-actions";
import { CreateBookmark } from "./schema";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }
  const { title, url, folderId } = data;
  let bookmark;

  try {
    bookmark = await db.bookmark.create({
      data: {
        title,
        url,
        folderId,
        orgId,
      },
    });
  } catch (error) {
    return { error: "Failed to create" };
  }
  revalidatePath(`/organization/${orgId}`);
  return { data: bookmark };
};

export const createBookmark = createSafeAction(CreateBookmark, handler);
