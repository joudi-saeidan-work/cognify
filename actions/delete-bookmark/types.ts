import { z } from "zod";
import { ActionState } from "@/lib/create-safe-actions";
import { DeleteBookmark } from "./schema";
import { Bookmark } from "@prisma/client";

export type InputType = z.infer<typeof DeleteBookmark>;
export type ReturnType = ActionState<InputType, Bookmark>;
