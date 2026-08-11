import { prisma } from "./lib/prisma";

(async () => {
  try {
    console.log("DATABASE_URL=", process.env.DATABASE_URL);
    await prisma.$connect();
    console.log("connected");
    const userCount = await prisma.user.count();
    console.log("userCount", userCount);
    const programCount = await prisma.program.count();
    console.log("programCount", programCount);
  } catch (err) {
    console.error("error", err);
  } finally {
    await prisma.$disconnect();
  }
})();
