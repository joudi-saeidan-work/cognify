import { z } from "zod";

export const UpdateCard = z.object({
  boardId: z.string(),
  description: z
    .string()
    .min(3, { message: "Description is too short." })
    .optional(),
  title: z.optional(
    z
      .string({
        required_error: "Title is required",
        invalid_type_error: "Title is required",
      })
      .min(3, { message: "Title is too short" })
  ),

  id: z.string(),
});
