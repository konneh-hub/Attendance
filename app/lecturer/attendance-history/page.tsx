import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { getLecturerAttendanceHistory } from "@/services/lecturer.service";

export default async function LecturerAttendanceHistoryPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "LECTURER") {
    redirect("/forbidden");
  }

  const history = await getLecturerAttendanceHistory(user.id);

  return (
    <main>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Attendance history</p>
        <h1 className="mt-2 text-3xl font-semibold">Session attendance</h1>
        <p className="mt-2 text-zinc-600">Review attendance records for past sessions and course cohorts.</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Attendees</th>
              <th className="px-4 py-3">Ended</th>
            </tr>
          </thead>
          <tbody>
            {history.map((session) => (
              <tr className="border-b border-zinc-100 last:border-0" key={session.id}>
                <td className="px-4 py-3 font-medium">{session.course.code}</td>
                <td className="px-4 py-3">{session.title}</td>
                <td className="px-4 py-3">{session.status}</td>
                <td className="px-4 py-3">{session._count.attendances}</td>
                <td className="px-4 py-3">{new Date(session.closedAt ?? session.endsAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {history.length === 0 ? <p className="p-8 text-center text-zinc-500">No closed sessions found.</p> : null}
      </div>
    </main>
  );
}
