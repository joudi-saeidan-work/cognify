import { z } from "zod";

export const UpdateCards = z.object({
  boardId: z.string(),
  listId: z.string(),
  color: z.string().optional(),
});
