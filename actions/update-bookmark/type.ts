import { z } from "zod";
import { ActionState } from "@/lib/create-safe-actions";
import { UpdateBookmark } from "./schema";
import { Bookmark } from "@prisma/client";

export type InputType = z.infer<typeof UpdateBookmark>;
export type ReturnType = ActionState<InputType, Bookmark>;
