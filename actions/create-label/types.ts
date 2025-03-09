import { z } from "zod";
import { Label } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-actions";
import { CreateLabel } from "./schema";

export type InputType = z.infer<typeof CreateLabel>;
export type ReturnType = ActionState<InputType, Label>;
