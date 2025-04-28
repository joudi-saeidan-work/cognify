import { z } from "zod";

export const CreateLabel = z.object({
  name: z.string().nullable().optional(),
  boardId: z.string(),
  color: z.string(),
  organizationId: z.string().optional(),
});
