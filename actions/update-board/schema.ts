import { z } from "zod";

export const UpdateBoard = z.object({
  title: z.string().min(3, { message: "Title is too short" }).optional(),
  id: z.string(),
  image: z.string().optional(),
  color: z.string().optional(),
  isFavorite: z.boolean().optional(),
});
