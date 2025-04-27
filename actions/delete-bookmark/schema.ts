import { z } from "zod";

export const DeleteBookmark = z.object({
  id: z.string(),
});
