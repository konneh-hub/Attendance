"use client";

import { LecturerMarkAttendanceForm } from "@/components/lecturer/LecturerMarkAttendanceForm";

export default function LecturerMarkAttendancePage() {
  return (
    <main>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Mark attendance</p>
        <h1 className="mt-2 text-3xl font-semibold">Take attendance</h1>
        <p className="mt-2 text-zinc-600">Select an open session to record attendance for your enrolled students.</p>
      </div>
      <LecturerMarkAttendanceForm />
    </main>
  );
}
