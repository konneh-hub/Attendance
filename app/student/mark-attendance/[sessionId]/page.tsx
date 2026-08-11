import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { getStudentSessionDetails } from "@/services/student.service";
import { StudentSubmitAttendanceForm } from "@/components/student/StudentSubmitAttendanceForm";

export default async function StudentSubmitAttendancePage({ params }: { params: { sessionId: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "STUDENT") redirect("/forbidden");

  try {
    const session = await getStudentSessionDetails(user.id, params.sessionId);
    return (
      <main>
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Verify attendance</p>
          <h1 className="mt-2 text-3xl font-semibold">Submit attendance for {session.course.code}</h1>
          <p className="mt-2 text-zinc-600">Complete the required verification method for this session.</p>
        </div>
        <StudentSubmitAttendanceForm session={session} />
      </main>
    );
  } catch (error) {
    return notFound();
  }
}
