import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: './.env.local' });
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

(async () => {
  try {
    const tables = await prisma.$queryRaw`select tablename from pg_tables where schemaname = 'public' order by tablename`;
    console.log(JSON.stringify(tables, null, 2));
  } catch (error) {
    console.error('query error', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
