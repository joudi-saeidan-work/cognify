"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { InputType, ReturnType } from "./types";
import { createSafeAction } from "@/lib/create-safe-actions";
import { CreateBookmarkFolder } from "./schema";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }
  const { title } = data;
  let bookmarkFolder;

  try {
    bookmarkFolder = await db.bookmarkFolder.create({
      data: {
        title,
        orgId,
      },
    });
  } catch (error) {
    return { error: "Failed to create" };
  }
  revalidatePath(`/organization/${orgId}`);
  return { data: bookmarkFolder };
};

export const createBookmarkFolder = createSafeAction(
  CreateBookmarkFolder,
  handler
);
