import { Archive, CheckCircle2 } from "lucide-react";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { getLecturerAttendanceHistory } from "@/services/lecturer.service";

export default async function LecturerAttendanceHistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "LECTURER") redirect("/forbidden");

  const history = await getLecturerAttendanceHistory(user.id);

  return (
    <main>
      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Attendance history</p><h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Completed sessions</h1><p className="mt-2 text-sm leading-6 text-zinc-600">Review sessions that have been closed and the number of attendance records captured.</p></div><span className="w-fit rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-600">{history.length} closed</span></div>

      {history.length === 0 ? <section className="rounded-3xl border border-dashed border-zinc-300 bg-white p-8 text-center shadow-sm sm:p-12"><Archive className="mx-auto h-8 w-8 text-zinc-400" /><h2 className="mt-4 font-semibold">No completed sessions</h2><p className="mt-2 text-sm text-zinc-500">Closed attendance sessions will appear here.</p></section> : <>
        <div className="space-y-3 md:hidden">{history.map((session) => <article key={session.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-indigo-700">{session.course.code}</p><h2 className="mt-1 font-semibold">{session.title}</h2></div><span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">Closed</span></div><p className="mt-2 text-sm text-zinc-500">{session.course.title}</p><div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3"><span className="flex items-center gap-1.5 text-xs text-zinc-500"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> {session._count.attendances} records</span><span className="text-xs text-zinc-500">{new Date(session.closedAt ?? session.endsAt).toLocaleString()}</span></div></article>)}</div>
        <div className="hidden overflow-x-auto rounded-3xl border border-zinc-200 bg-white shadow-sm md:block"><table className="min-w-full text-left text-sm"><thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600"><tr><th className="px-4 py-3">Course</th><th className="px-4 py-3">Session</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Records</th><th className="px-4 py-3">Ended</th></tr></thead><tbody>{history.map((session) => <tr className="border-b border-zinc-100 last:border-0" key={session.id}><td className="px-4 py-4 font-semibold">{session.course.code}</td><td className="px-4 py-4"><p className="font-medium">{session.title}</p><p className="text-xs text-zinc-500">{session.course.title}</p></td><td className="px-4 py-4"><span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">Closed</span></td><td className="px-4 py-4 font-medium">{session._count.attendances}</td><td className="whitespace-nowrap px-4 py-4">{new Date(session.closedAt ?? session.endsAt).toLocaleString()}</td></tr>)}</tbody></table></div>
      </>}
    </main>
  );
}
