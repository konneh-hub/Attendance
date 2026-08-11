import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { getStudentOpenSessions } from "@/services/student.service";

export default async function StudentSessionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "STUDENT") redirect("/forbidden");

  const sessions = await getStudentOpenSessions(user.id);

  return (
    <main>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Available sessions</p>
          <h1 className="mt-2 text-3xl font-semibold">Open attendance sessions</h1>
          <p className="mt-2 text-zinc-600">Sessions you can mark attendance for when they are open.</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Session title</th>
              <th className="px-4 py-3">Starts</th>
              <th className="px-4 py-3">Lecturer</th>
              <th className="px-4 py-3">Verification</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr className="border-b border-zinc-100 last:border-0" key={session.id}>
                <td className="px-4 py-3 font-medium">{session.course.code}</td>
                <td className="px-4 py-3">{session.title}</td>
                <td className="px-4 py-3">{new Date(session.startsAt).toLocaleString()}</td>
                <td className="px-4 py-3">{session.lecturerName}</td>
                <td className="px-4 py-3 text-zinc-700">{session.verificationMethods.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sessions.length === 0 ? <p className="p-8 text-center text-zinc-500">No open sessions are available for your courses right now.</p> : null}
      </div>
    </main>
  );
}
