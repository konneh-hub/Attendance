import { CalendarCheck2, CheckCircle2, Clock3, GraduationCap, XCircle } from "lucide-react";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { getStudentDashboard } from "@/services/student.service";

export default async function StudentDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "STUDENT") redirect("/forbidden");

  const dashboard = await getStudentDashboard(user.id);
  const attendanceRate = dashboard.attendanceRecords > 0
    ? Math.round((dashboard.presentCount / dashboard.attendanceRecords) * 100)
    : 0;

  const cards = [
    { label: "Enrolled courses", value: dashboard.enrolledCourseCount, helper: "Active course enrollments", icon: GraduationCap },
    { label: "Open sessions", value: dashboard.openSessionCount, helper: "Available to mark now", icon: Clock3 },
    { label: "Attendance rate", value: `${attendanceRate}%`, helper: "Present records / total records", icon: CalendarCheck2 },
  ];

  return (
    <main className="space-y-6 sm:space-y-8">
      <section className="rounded-3xl bg-indigo-700 p-5 text-white shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">Student dashboard</p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Welcome back, {user.fullName}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100">Track your attendance, see open sessions, and submit attendance before a session closes.</p>
          </div>
          <a href="/student/sessions" className="inline-flex w-fit items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">View open sessions</a>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ label, value, helper, icon: Icon }) => (
          <article key={label} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-zinc-500">{label}</p>
                <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
              </div>
              <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-700"><Icon className="h-5 w-5" /></div>
            </div>
            <p className="mt-2 text-xs text-zinc-500">{helper}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5"><div className="flex items-center gap-2 text-sm font-semibold text-emerald-800"><CheckCircle2 className="h-4 w-4" /> Present</div><p className="mt-3 text-3xl font-bold text-emerald-800">{dashboard.presentCount}</p></article>
        <article className="rounded-2xl border border-rose-100 bg-rose-50 p-5"><div className="flex items-center gap-2 text-sm font-semibold text-rose-800"><XCircle className="h-4 w-4" /> Absent</div><p className="mt-3 text-3xl font-bold text-rose-800">{dashboard.absentCount}</p></article>
        <article className="rounded-2xl border border-amber-100 bg-amber-50 p-5"><div className="flex items-center gap-2 text-sm font-semibold text-amber-800"><Clock3 className="h-4 w-4" /> Late</div><p className="mt-3 text-3xl font-bold text-amber-800">{dashboard.lateCount}</p></article>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="font-semibold">Quick actions</h2><p className="mt-1 text-sm text-zinc-500">Common attendance tasks.</p></div>
          <a href="/student/my-attendance" className="text-sm font-semibold text-indigo-700 hover:text-indigo-800">View history →</a>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <a href="/student/sessions" className="rounded-xl border border-zinc-200 p-4 hover:border-indigo-300 hover:bg-indigo-50"><p className="font-semibold">Find a session</p><p className="mt-1 text-sm text-zinc-500">See sessions currently open for your courses.</p></a>
          <a href="/student/my-attendance" className="rounded-xl border border-zinc-200 p-4 hover:border-indigo-300 hover:bg-indigo-50"><p className="font-semibold">Review attendance</p><p className="mt-1 text-sm text-zinc-500">Check your recorded Present, Absent, and Late entries.</p></a>
        </div>
      </section>
    </main>
  );
}
