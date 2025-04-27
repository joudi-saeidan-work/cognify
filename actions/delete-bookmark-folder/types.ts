import { z } from "zod";
import { ActionState } from "@/lib/create-safe-actions";
import { DeleteBookmarkFolder } from "./schema";
import { BookmarkFolder } from "@prisma/client";

export type InputType = z.infer<typeof DeleteBookmarkFolder>;
export type ReturnType = ActionState<InputType, BookmarkFolder>;
