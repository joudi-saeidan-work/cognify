import { z } from "zod";
import { Card, Label } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-actions";
import { DeleteLabel } from "./schema";

export type InputType = z.infer<typeof DeleteLabel>;
export type ReturnType = ActionState<InputType, Label>;
