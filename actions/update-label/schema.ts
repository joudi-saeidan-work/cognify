import { z } from "zod";

export const UpdateLabel = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  boardId: z.string(),
  organizationId: z.string().optional(),
});
