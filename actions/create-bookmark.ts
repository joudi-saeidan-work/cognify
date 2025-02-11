"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export type CreateBookmarkInput = {
  title: string;
  url: string;
  folderId: string;
};

export const createBookmark = async (data: CreateBookmarkInput) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const bookmark = await db.bookmark.create({
    data: {
      title: data.title,
      url: data.url,
      folderId: data.folderId,
    },
  });

  revalidatePath("/organization/[organizationId]");
  return { data: bookmark };
};
