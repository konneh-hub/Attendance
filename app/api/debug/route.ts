import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    cwd: process.cwd(),
    databaseUrl: process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
    nextRoot: process.env.NEXT_PUBLIC_APP_URL,
  });
}
