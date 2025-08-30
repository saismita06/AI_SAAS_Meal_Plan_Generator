

// lib/prisma.ts
import { PrismaClient } from "./generated/prisma";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

// Optional: quick signal it loaded
console.log("✅ Prisma client ready");
