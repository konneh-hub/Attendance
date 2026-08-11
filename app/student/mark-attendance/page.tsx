import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { getStudentOpenSessions } from "@/services/student.service";

export default async function StudentMarkAttendancePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "STUDENT") redirect("/forbidden");

  const sessions = await getStudentOpenSessions(user.id);

  return (
    <main>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Mark attendance</p>
        <h1 className="mt-2 text-3xl font-semibold">Submit attendance</h1>
        <p className="mt-2 text-zinc-600">View open attendance sessions and the verification methods available for your enrolments.</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Session title</th>
              <th className="px-4 py-3">Starts</th>
              <th className="px-4 py-3">Verification</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr className="border-b border-zinc-100 last:border-0" key={session.id}>
                <td className="px-4 py-3 font-medium">{session.course.code}</td>
                <td className="px-4 py-3">{session.title}</td>
                <td className="px-4 py-3">{new Date(session.startsAt).toLocaleString()}</td>
                <td className="px-4 py-3">{session.verificationMethods.join(", ")}</td>
                <td className="px-4 py-3">
                  <a
                    className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                    href={`/student/mark-attendance/${session.id}`}
                  >
                    Submit
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sessions.length === 0 ? <p className="p-8 text-center text-zinc-500">No open attendance sessions are available for submission.</p> : null}
      </div>
    </main>
  );
}
