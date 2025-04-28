import { z } from "zod";

export const CreateBookmark = z.object({
  title: z.string().min(3, { message: "Title is too short" }),
  url: z.string().url({ message: "Invalid URL" }),
  folderId: z.string().optional(),
});
