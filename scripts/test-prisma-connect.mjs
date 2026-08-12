import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

p.$connect()
  .then(() => {
    console.log('connected');
    return p.$disconnect();
  })
  .catch((err) => {
    console.error('err', err);
    process.exit(1);
  });
