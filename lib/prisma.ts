import { PrismaClient } from "@prisma/client";

// Use DATABASE_URL as provided. Avoid rewriting connection schemes here;
// the application should provide the correct `DATABASE_URL` for the
// environment (e.g. from `.env.local` or the deployment platform).

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

// Pass the configured `DATABASE_URL` explicitly as a datasource override
// to the PrismaClient constructor. This ensures Prisma uses the intended
// direct DB URL and avoids ambiguous runtime URL parsing that may trigger
// Data Proxy/Accelerate detection in some environments.
const prismaConstructorArgs: any = {};
if (process.env.DATABASE_URL) {
	console.log("Prisma DATABASE_URL:", process.env.DATABASE_URL);
	console.log("Prisma constructor datasource override:", {
		url: process.env.DATABASE_URL,
	});
	prismaConstructorArgs.datasources = { db: { url: process.env.DATABASE_URL } };
}

console.log("Prisma constructor args:", prismaConstructorArgs);
export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaConstructorArgs);

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = prisma;
}
