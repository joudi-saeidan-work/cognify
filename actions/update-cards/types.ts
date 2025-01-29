import { z } from "zod";
import { Card } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-actions";
import { UpdateCards } from "./schema";

export type InputType = z.infer<typeof UpdateCards>;
export type ReturnType = ActionState<InputType, { updatedCount: number }>;
