"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export type CreateBookmarkFolderInput = {
  name: string;
};

export const createBookmarkFolder = async (data: CreateBookmarkFolderInput) => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    throw new Error("Unauthorized");
  }

  const folder = await db.bookmarkFolder.create({
    data: {
      name: data.name,
      userId,
      orgId,
    },
  });

  revalidatePath("/organization/[organizationId]");
  return { data: folder };
};
