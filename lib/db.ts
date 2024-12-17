import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export const db = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;

// PrismaClient is like a "database helper" that you can use to make database queries easily.
// This code sets up a single, reusable instance of that helper (PrismaClient) so your app doesn't create multiple database connections, which can be inefficient.
// By attaching the instance to globalThis, you avoid creating new connections each time, especially useful in development.
