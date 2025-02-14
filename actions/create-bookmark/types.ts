import { z } from "zod";
import { ActionState } from "@/lib/create-safe-actions";
import { CreateBookmark } from "./schema";
import { Bookmark } from "@prisma/client";

export type InputType = z.infer<typeof CreateBookmark>;
export type ReturnType = ActionState<InputType, Bookmark>;
