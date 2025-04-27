"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { InputType, ReturnType } from "./types";
import { createSafeAction } from "@/lib/create-safe-actions";
import { DeleteBookmarkFolder } from "./schema";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { id } = data;

  // First check if the folder exists and belongs to the organization
  const existingFolder = await db.bookmarkFolder.findFirst({
    where: {
      id,
      orgId,
    },
  });

  if (!existingFolder) {
    return {
      error: "Folder not found",
    };
  }

  let bookmarkFolder;

  try {
    // This will also delete all bookmarks in this folder due to cascading delete in the schema
    bookmarkFolder = await db.bookmarkFolder.delete({
      where: {
        id,
      },
    });
  } catch (error) {
    return { error: "Failed to delete folder" };
  }

  revalidatePath(`/organization/${orgId}`);
  return { data: bookmarkFolder };
};

export const deleteBookmarkFolder = createSafeAction(
  DeleteBookmarkFolder,
  handler
);
