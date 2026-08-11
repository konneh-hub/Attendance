import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { getStudentDashboard } from "@/services/student.service";

export default async function StudentDashboardPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.role !== "STUDENT") redirect("/forbidden");

  const dashboard = await getStudentDashboard(user.id);

  return (
    <main>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Student dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold">Welcome back, {user.fullName}</h1>
        <p className="mt-2 text-zinc-600">View your courses, upcoming sessions, and attendance history.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Enrolled courses</p>
          <p className="mt-4 text-3xl font-semibold">{dashboard.enrolledCourseCount}</p>
          <p className="mt-2 text-sm text-zinc-500">Courses where you are currently enrolled.</p>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Open sessions</p>
          <p className="mt-4 text-3xl font-semibold">{dashboard.openSessionCount}</p>
          <p className="mt-2 text-sm text-zinc-500">Sessions available for your attendance submission.</p>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Attendance records</p>
          <p className="mt-4 text-3xl font-semibold">{dashboard.attendanceRecords}</p>
          <p className="mt-2 text-sm text-zinc-500">Total attendance entries recorded for you.</p>
        </section>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Present</p>
          <p className="mt-4 text-3xl font-semibold text-emerald-700">{dashboard.presentCount}</p>
        </section>
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Absent</p>
          <p className="mt-4 text-3xl font-semibold text-rose-700">{dashboard.absentCount}</p>
        </section>
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Late</p>
          <p className="mt-4 text-3xl font-semibold text-amber-700">{dashboard.lateCount}</p>
        </section>
      </div>
    </main>
  );
}
