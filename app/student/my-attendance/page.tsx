import { CalendarCheck2, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { getStudentAttendanceHistory } from "@/services/student.service";

const statusStyles: Record<string, string> = {
  PRESENT: "bg-emerald-50 text-emerald-700",
  ABSENT: "bg-rose-50 text-rose-700",
  LATE: "bg-amber-50 text-amber-700",
};
const statusLabel: Record<string, string> = { PRESENT: "Present", ABSENT: "Absent", LATE: "Late" };

export default async function StudentAttendanceHistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "STUDENT") redirect("/forbidden");

  const attendanceHistory = await getStudentAttendanceHistory(user.id);
  const present = attendanceHistory.filter((r) => r.status === "PRESENT").length;
  const absent = attendanceHistory.filter((r) => r.status === "ABSENT").length;
  const late = attendanceHistory.filter((r) => r.status === "LATE").length;

  return (
    <main>
      <div className="mb-6 sm:mb-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Attendance history</p><h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Your records</h1><p className="mt-2 text-sm leading-6 text-zinc-600">Review attendance entries recorded for your sessions.</p></div>

      <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-4">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 sm:p-4"><div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Present</div><p className="mt-2 text-xl font-bold text-emerald-800 sm:text-2xl">{present}</p></div>
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3 sm:p-4"><div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700"><XCircle className="h-4 w-4" /> Absent</div><p className="mt-2 text-xl font-bold text-rose-800 sm:text-2xl">{absent}</p></div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 sm:p-4"><div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700"><Clock3 className="h-4 w-4" /> Late</div><p className="mt-2 text-xl font-bold text-amber-800 sm:text-2xl">{late}</p></div>
      </div>

      {attendanceHistory.length === 0 ? <section className="rounded-3xl border border-dashed border-zinc-300 bg-white p-8 text-center shadow-sm sm:p-12"><CalendarCheck2 className="mx-auto h-8 w-8 text-zinc-400" /><h2 className="mt-4 font-semibold">No attendance history</h2><p className="mt-2 text-sm text-zinc-500">Your attendance records will appear here after a submission or lecturer marking.</p></section> : <>
        <div className="space-y-3 md:hidden">{attendanceHistory.map((record) => <article key={record.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-indigo-700">{record.session.course.code}</p><h2 className="mt-1 font-semibold">{record.session.title}</h2></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[record.status] ?? "bg-zinc-100 text-zinc-700"}`}>{statusLabel[record.status] ?? record.status}</span></div><p className="mt-2 text-sm text-zinc-500">{record.session.course.title}</p><p className="mt-2 text-xs text-zinc-500">Recorded {new Date(record.recordedAt).toLocaleString()}</p>{record.notes ? <p className="mt-3 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-600">{record.notes}</p> : null}</article>)}</div>
        <div className="hidden overflow-x-auto rounded-3xl border border-zinc-200 bg-white shadow-sm md:block"><table className="min-w-full text-left text-sm"><thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600"><tr><th className="px-4 py-3">Course</th><th className="px-4 py-3">Session</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Recorded</th><th className="px-4 py-3">Notes</th></tr></thead><tbody>{attendanceHistory.map((record) => <tr className="border-b border-zinc-100 last:border-0" key={record.id}><td className="px-4 py-4 font-semibold">{record.session.course.code}</td><td className="px-4 py-4">{record.session.title}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[record.status] ?? "bg-zinc-100 text-zinc-700"}`}>{statusLabel[record.status] ?? record.status}</span></td><td className="whitespace-nowrap px-4 py-4">{new Date(record.recordedAt).toLocaleString()}</td><td className="max-w-xs px-4 py-4 text-zinc-600">{record.notes ?? "—"}</td></tr>)}</tbody></table></div>
      </>}
    </main>
  );
}
