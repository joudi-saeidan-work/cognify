import { z } from "zod";

export const UpdateBookmarkFolder = z.object({
  id: z.string(),
  title: z.string().min(3, { message: "Title is too short" }),
});
