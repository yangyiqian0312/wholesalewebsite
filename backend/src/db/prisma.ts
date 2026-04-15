import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

const DEFAULT_PRISMA_CONNECTION_LIMIT = "5";
const DEFAULT_PRISMA_POOL_TIMEOUT = "20";

function buildPrismaDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return undefined;
  }

  try {
    const parsedUrl = new URL(databaseUrl);

    if (!parsedUrl.searchParams.has("connection_limit")) {
      parsedUrl.searchParams.set("connection_limit", DEFAULT_PRISMA_CONNECTION_LIMIT);
    }

    if (!parsedUrl.searchParams.has("pool_timeout")) {
      parsedUrl.searchParams.set("pool_timeout", DEFAULT_PRISMA_POOL_TIMEOUT);
    }

    return parsedUrl.toString();
  } catch {
    return databaseUrl;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  (() => {
    const datasourceUrl = buildPrismaDatabaseUrl();

    return new PrismaClient({
      ...(datasourceUrl
      ? {
          datasources: {
            db: {
                url: datasourceUrl,
            },
          },
        }
      : {}),
      log: ["warn", "error"],
    });
  })();

globalForPrisma.prisma = prisma;
