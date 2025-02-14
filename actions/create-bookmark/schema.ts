import { z } from "zod";

// should include the properties that we want to accept from the user
// (create a bookmark)

export const CreateBookmark = z.object({
  title: z.string().min(3, { message: "Title is too short" }),
  url: z.string().url({ message: "Invalid URL" }),
  folderId: z.string().optional().nullable(),
});
