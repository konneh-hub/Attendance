import dotenv from 'dotenv';
// Prefer loading .env.local for local development; fall back to .env
dotenv.config({ path: './.env.local' });
dotenv.config();

import { PrismaClient } from '@prisma/client';

async function main() {
  console.log('DATABASE_URL', process.env.DATABASE_URL);
  const clientArgs = {};
  if (process.env.DATABASE_URL) {
    clientArgs.datasources = { db: { url: process.env.DATABASE_URL } };
  }
  const prisma = new PrismaClient(clientArgs);
  try {
    await prisma.$connect();
    console.log('Connected');
    const user = await prisma.user.findFirst();
    console.log('user', user);
  } catch (error) {
    console.error('prisma error', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
