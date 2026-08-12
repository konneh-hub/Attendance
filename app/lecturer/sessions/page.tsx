import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { LecturerSessionManager } from "@/components/lecturer/LecturerSessionManager";

export default async function LecturerSessionsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "LECTURER") {
    redirect("/forbidden");
  }

  return (
    <main>
      <div className="mb-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Attendance sessions</p>
          <h1 className="mt-2 text-3xl font-semibold">Your sessions</h1>
          <p className="mt-2 text-zinc-600">Create, open, and close attendance sessions for your courses.</p>
        </div>
      </div>
      <LecturerSessionManager />
    </main>
  );
}
