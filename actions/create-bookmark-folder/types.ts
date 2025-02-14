import { z } from "zod";
import { BookmarkFolder } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-actions";
import { CreateBookmarkFolder } from "./schema";

export type InputType = z.infer<typeof CreateBookmarkFolder>;
export type ReturnType = ActionState<InputType, BookmarkFolder>;
