import { getAttendanceReportsOverview, listRecentAttendanceSessions } from "@/services/admin/admin.service";

const cards = [
  ["Total sessions", "totalSessions"],
  ["Attendance records", "attendanceRecords"],
  ["Present", "presentCount"],
  ["Absent", "absentCount"],
  ["Late", "lateCount"],
  ["Active courses", "activeCourses"],
] as const;

export default async function AdminAttendanceReportsPage() {
  const overview = await getAttendanceReportsOverview();
  const sessions = await listRecentAttendanceSessions(8);

  return (
    <main>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Administration</p>
        <h1 className="mt-2 text-3xl font-semibold">Attendance reports</h1>
        <p className="mt-2 text-zinc-600">Monitor attendance activity and recent sessions across the institution.</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, key]) => (
          <section className="rounded-xl border border-zinc-200 bg-white p-5" key={key}>
            <p className="text-sm text-zinc-500">{label}</p>
            <p className="mt-3 text-3xl font-semibold">{overview[key]}</p>
          </section>
        ))}
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="text-lg font-semibold">Recent sessions</h2>
          <p className="text-sm text-zinc-600">Latest attendance sessions created by lecturers.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-5 py-3">Session</th>
                <th className="px-5 py-3">Course</th>
                <th className="px-5 py-3">Lecturer</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Starts</th>
                <th className="px-5 py-3">Records</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr className="border-b border-zinc-100 last:border-0" key={session.id}>
                  <td className="px-5 py-3 font-medium">{session.title}</td>
                  <td className="px-5 py-3">{session.course.code} - {session.course.title}</td>
                  <td className="px-5 py-3">{session.createdByLecturer.user.fullName}</td>
                  <td className="px-5 py-3">{session.status}</td>
                  <td className="px-5 py-3">{session.startsAt.toLocaleString()}</td>
                  <td className="px-5 py-3">{session._count.attendances}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
