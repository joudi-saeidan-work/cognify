import { z } from "zod";

export const CreateCard = z.object({
  title: z
    .string({
      required_error: "Title is required",
      invalid_type_error: "Title is required",
    })
    .min(3, { message: "Title is too short" }),
  boardId: z.string(),
  listId: z.string(),
  color: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.date().nullable().optional(),
  start: z.date().nullable().optional(),
  end: z.date().nullable().optional(),
  allDay: z.boolean().optional(),
  organizationId: z.string().optional(),
});
