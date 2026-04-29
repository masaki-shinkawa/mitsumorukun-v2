import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

function buildConnectionString(): string {
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;
  const db = process.env.POSTGRES_DB;
  const host = process.env.POSTGRES_HOST ?? "localhost";
  const port = process.env.POSTGRES_PORT ?? "5432";
  if (!user || !password || !db) {
    throw new Error(
      "POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB が .env に設定されていません",
    );
  }
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(
    password,
  )}@${host}:${port}/${db}?schema=public`;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: buildConnectionString() });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
