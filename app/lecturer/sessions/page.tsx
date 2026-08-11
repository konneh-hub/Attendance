import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { getLecturerSessions } from "@/services/lecturer.service";

export default async function LecturerSessionsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "LECTURER") {
    redirect("/forbidden");
  }

  const sessions = await getLecturerSessions(user.id);

  return (
    <main>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Attendance sessions</p>
          <h1 className="mt-2 text-3xl font-semibold">Your sessions</h1>
          <p className="mt-2 text-zinc-600">Review attendance sessions created for your courses.</p>
        </div>
        <Link href="/lecturer/mark-attendance" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          Mark attendance
        </Link>
      </div>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Session title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Starts</th>
              <th className="px-4 py-3">Attendance</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr className="border-b border-zinc-100 last:border-0" key={session.id}>
                <td className="px-4 py-3 font-medium">{session.course.code}</td>
                <td className="px-4 py-3">{session.title}</td>
                <td className="px-4 py-3">{session.status}</td>
                <td className="px-4 py-3">{new Date(session.startsAt).toLocaleString()}</td>
                <td className="px-4 py-3">{session._count.attendances}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sessions.length === 0 ? <p className="p-8 text-center text-zinc-500">No attendance sessions found.</p> : null}
      </div>
    </main>
  );
}
