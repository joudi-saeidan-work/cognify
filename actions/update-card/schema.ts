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
  dueDate: z.date().nullable().optional(),
  start: z.date().nullable().optional(),
  end: z.date().nullable().optional(),
  allDay: z.boolean().optional(),
  labelId: z.string().nullable().optional(),
});
