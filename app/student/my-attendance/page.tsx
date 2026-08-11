import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { getStudentAttendanceHistory } from "@/services/student.service";

export default async function StudentAttendanceHistoryPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.role !== "STUDENT") redirect("/forbidden");

  const attendanceHistory = await getStudentAttendanceHistory(user.id);

  return (
    <main>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Attendance history</p>
        <h1 className="mt-2 text-3xl font-semibold">Your records</h1>
        <p className="mt-2 text-zinc-600">Review attendance entries for your past sessions.</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Recorded</th>
              <th className="px-4 py-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {attendanceHistory.map((record) => (
              <tr className="border-b border-zinc-100 last:border-0" key={record.id}>
                <td className="px-4 py-3 font-medium">{record.session.course.code}</td>
                <td className="px-4 py-3">{record.session.title}</td>
                <td className="px-4 py-3">{record.status}</td>
                <td className="px-4 py-3">{new Date(record.recordedAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-zinc-600">{record.notes ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {attendanceHistory.length === 0 ? <p className="p-8 text-center text-zinc-500">No attendance history is available yet.</p> : null}
      </div>
    </main>
  );
}
