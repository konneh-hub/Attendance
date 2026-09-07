import { BookOpen, ClipboardCheck, GraduationCap } from "lucide-react";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { getLecturerDashboard } from "@/services/lecturer.service";

export default async function LecturerDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "LECTURER") redirect("/forbidden");

  const dashboard = await getLecturerDashboard(user.id);
  const cards = [
    { label: "Assigned courses", value: dashboard.courseCount, helper: "Active courses assigned to you", icon: BookOpen },
    { label: "Active sessions", value: dashboard.activeSessionCount, helper: "Draft or open attendance sessions", icon: ClipboardCheck },
    { label: "Total enrollments", value: dashboard.enrolledStudentCount, helper: "Student enrollments across your courses", icon: GraduationCap },
  ];

  return (
    <main className="space-y-6 sm:space-y-8">
      <section className="rounded-3xl bg-indigo-700 p-5 text-white shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">Lecturer dashboard</p>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Welcome back, {user.fullName}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100">Create attendance sessions, take attendance for enrolled students, and review completed sessions.</p>
        <div className="mt-5 flex flex-wrap gap-2"><a href="/lecturer/sessions" className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">Manage sessions</a><a href="/lecturer/mark-attendance" className="rounded-xl border border-indigo-400 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-600">Take attendance</a></div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ label, value, helper, icon: Icon }) => <article key={label} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-zinc-500">{label}</p><p className="mt-3 text-3xl font-bold tracking-tight">{value}</p></div><div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-700"><Icon className="h-5 w-5" /></div></div><p className="mt-2 text-xs text-zinc-500">{helper}</p></article>)}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="font-semibold">Lecturer workflow</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-zinc-50 p-4"><p className="text-sm font-semibold">1. Create</p><p className="mt-1 text-xs leading-5 text-zinc-500">Choose a course, schedule the session, and configure verification.</p></div><div className="rounded-xl bg-zinc-50 p-4"><p className="text-sm font-semibold">2. Open</p><p className="mt-1 text-xs leading-5 text-zinc-500">Open the draft when students should be allowed to submit attendance.</p></div><div className="rounded-xl bg-zinc-50 p-4"><p className="text-sm font-semibold">3. Record & close</p><p className="mt-1 text-xs leading-5 text-zinc-500">Mark students manually when needed, then close the session.</p></div></div></section>
    </main>
  );
}
