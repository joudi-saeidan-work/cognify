import { z } from "zod";
import { ActionState } from "@/lib/create-safe-actions";
import { UpdateBookmarkFolder } from "./schema";
import { BookmarkFolder } from "@prisma/client";

export type InputType = z.infer<typeof UpdateBookmarkFolder>;
export type ReturnType = ActionState<InputType, BookmarkFolder>;
