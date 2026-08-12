import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });
dotenv.config();

const keys = [
  'DATABASE_URL',
  'PRISMA_API_KEY',
  'PRISMA_ENDPOINT',
  'PRISMA',
  'PRISMA_DATA_PROXY',
  'PRISMA_CLIENT_ENGINE_TYPE',
  'NODE_ENV',
  'NEXT_PUBLIC_APP_URL',
];

for (const k of keys) {
  console.log(k, process.env[k]);
}
