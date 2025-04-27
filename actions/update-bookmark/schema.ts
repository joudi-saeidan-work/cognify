import { z } from "zod";

export const UpdateBookmark = z.object({
  id: z.string(),
  title: z.string().min(3, { message: "Title is too short" }),
  url: z.string().url({ message: "Invalid URL" }),
  folderId: z.string().optional(),
});
