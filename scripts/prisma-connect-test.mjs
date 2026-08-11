import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function main() {
  console.log('DATABASE_URL', process.env.DATABASE_URL);
  try {
    await prisma.$connect();
    console.log('connected');
    const user = await prisma.user.findFirst();
    console.log('user', user);
  } catch (error) {
    console.error('prisma error', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
