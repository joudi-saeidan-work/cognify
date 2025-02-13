import { z } from "zod";

export const UpdateBoard = z.object({
  id: z.string(),
  title: z.optional(z.string()),
  image: z.optional(z.string()),
  color: z.optional(z.string()),
  isFavorite: z.optional(z.boolean()),
});
