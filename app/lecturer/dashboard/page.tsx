import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { getLecturerDashboard } from "@/services/lecturer.service";

export default async function LecturerDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "LECTURER") {
    redirect("/forbidden");
  }

  const dashboard = await getLecturerDashboard(user.id);

  return (
    <main>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Lecturer dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold">Welcome back, {user.fullName}</h1>
        <p className="mt-2 text-zinc-600">Manage your courses, attendance sessions, and student attendance.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Assigned courses</p>
          <p className="mt-4 text-3xl font-semibold">{dashboard.courseCount}</p>
          <p className="mt-2 text-sm text-zinc-500">Active courses assigned to you.</p>
        </section>
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Open attendance sessions</p>
          <p className="mt-4 text-3xl font-semibold">{dashboard.activeSessionCount}</p>
          <p className="mt-2 text-sm text-zinc-500">Sessions that are currently open or in draft.</p>
        </section>
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Total enrollments</p>
          <p className="mt-4 text-3xl font-semibold">{dashboard.enrolledStudentCount}</p>
          <p className="mt-2 text-sm text-zinc-500">Students enrolled across your courses.</p>
        </section>
      </div>
    </main>
  );
}
