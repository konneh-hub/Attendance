import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { getCurrentUser } from "@/lib/session";

export default async function StudentEntryPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "STUDENT") {
    redirect("/forbidden");
  }

  return (
      <main className="min-h-screen bg-zinc-100 px-6 py-12">
        <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 rounded-2xl bg-white p-8 shadow-xl shadow-zinc-200/60">
          <div className="flex items-start justify-between gap-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
                Student area
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
                Welcome, {user.fullName}
              </h1>
              <p className="mt-2 text-zinc-600">
                Access your dashboard, open sessions, attendance history, and submission tools.
              </p>
            </div>
            <LogoutButton />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <a href="/student/dashboard" className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 transition hover:border-indigo-300 hover:bg-white">
              <p className="text-sm font-semibold text-indigo-700">Dashboard</p>
              <p className="mt-3 text-xl font-semibold text-zinc-950">Student overview</p>
              <p className="mt-2 text-sm text-zinc-600">See your enrolled courses, open sessions, and attendance summary.</p>
            </a>
            <a href="/student/sessions" className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 transition hover:border-indigo-300 hover:bg-white">
              <p className="text-sm font-semibold text-indigo-700">Sessions</p>
              <p className="mt-3 text-xl font-semibold text-zinc-950">Available sessions</p>
              <p className="mt-2 text-sm text-zinc-600">Browse sessions you can submit attendance for.</p>
            </a>
            <a href="/student/my-attendance" className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 transition hover:border-indigo-300 hover:bg-white">
              <p className="text-sm font-semibold text-indigo-700">My attendance</p>
              <p className="mt-3 text-xl font-semibold text-zinc-950">Attendance history</p>
              <p className="mt-2 text-sm text-zinc-600">Review your attendance records and notes.</p>
            </a>
            <a href="/student/mark-attendance" className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 transition hover:border-indigo-300 hover:bg-white">
              <p className="text-sm font-semibold text-indigo-700">Mark attendance</p>
              <p className="mt-3 text-xl font-semibold text-zinc-950">Submit for open sessions</p>
              <p className="mt-2 text-sm text-zinc-600">View and submit attendance for sessions that are currently open.</p>
            </a>
          </div>
        </section>
      </main>
  );
}
