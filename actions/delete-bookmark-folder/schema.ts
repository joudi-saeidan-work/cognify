import { z } from "zod";

export const DeleteBookmarkFolder = z.object({
  id: z.string(),
});
