import { CalendarClock } from "lucide-react";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { getStudentOpenSessions } from "@/services/student.service";

const methodLabel: Record<string, string> = { QR: "QR", GPS: "Location", FACE: "Face" };

export default async function StudentSessionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "STUDENT") redirect("/forbidden");

  const sessions = await getStudentOpenSessions(user.id);

  return (
    <main>
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Attendance</p><h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Open sessions</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">Only sessions for courses you are enrolled in and currently open for attendance are shown.</p></div>
        <span className="w-fit rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">{sessions.length} available</span>
      </div>

      {sessions.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-zinc-300 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500"><CalendarClock className="h-6 w-6" /></div>
          <h2 className="mt-4 font-semibold">No open sessions</h2><p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">When a lecturer opens attendance for one of your courses, it will appear here.</p>
        </section>
      ) : (
        <>
          <div className="space-y-3 md:hidden">{sessions.map((session) => <article key={session.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-indigo-700">{session.course.code}</p><h2 className="mt-1 font-semibold">{session.title}</h2></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Open</span></div><p className="mt-3 text-sm text-zinc-600">{session.course.title}</p><p className="mt-2 text-xs text-zinc-500">{session.lecturerName} · {new Date(session.startsAt).toLocaleString()}</p><div className="mt-3 flex flex-wrap gap-2">{session.verificationMethods.map((method) => <span key={method} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">{methodLabel[method] ?? method}</span>)}</div><a href={`/student/mark-attendance/${session.id}`} className="mt-4 flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700">Mark attendance</a></article>)}</div>

          <div className="hidden overflow-x-auto rounded-3xl border border-zinc-200 bg-white shadow-sm md:block"><table className="min-w-full text-left text-sm"><thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600"><tr><th className="px-4 py-3">Course</th><th className="px-4 py-3">Session</th><th className="px-4 py-3">Starts</th><th className="px-4 py-3">Lecturer</th><th className="px-4 py-3">Verification</th><th className="px-4 py-3">Action</th></tr></thead><tbody>{sessions.map((session) => <tr className="border-b border-zinc-100 last:border-0" key={session.id}><td className="px-4 py-4 font-semibold">{session.course.code}</td><td className="px-4 py-4"><p className="font-medium">{session.title}</p><p className="text-xs text-zinc-500">{session.course.title}</p></td><td className="whitespace-nowrap px-4 py-4">{new Date(session.startsAt).toLocaleString()}</td><td className="px-4 py-4">{session.lecturerName}</td><td className="px-4 py-4"><div className="flex flex-wrap gap-1.5">{session.verificationMethods.map((method) => <span key={method} className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">{methodLabel[method] ?? method}</span>)}</div></td><td className="px-4 py-4"><a href={`/student/mark-attendance/${session.id}`} className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700">Mark attendance</a></td></tr>)}</tbody></table></div>
        </>
      )}
    </main>
  );
}
