"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type LecturerSession = {
  id: string;
  title: string;
  startsAt: string;
  course: {
    code: string;
    title: string;
  };
};

type SessionStudent = {
  id: string;
  studentNumber: string;
  fullName: string;
  status: "PRESENT" | "ABSENT" | "LATE" | null;
  notes: string | null;
};

type SessionDetails = {
  id: string;
  title: string;
  startsAt: string;
  course: {
    code: string;
    title: string;
  };
  students: SessionStudent[];
};

type StatusOption = "PRESENT" | "ABSENT" | "LATE";

type AttendanceReviewRow = {
  studentNumber: string;
  fullName: string;
  status: StatusOption;
};

const statusOptions: StatusOption[] = ["PRESENT", "ABSENT", "LATE"];

export function LecturerMarkAttendanceForm({ sessions: initialSessions }: { sessions?: LecturerSession[] }) {
  const [sessions, setSessions] = useState<LecturerSession[]>(initialSessions ?? []);
  const [selectedSessionId, setSelectedSessionId] = useState<string>(initialSessions?.[0]?.id ?? "");
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [attendanceState, setAttendanceState] = useState<Record<string, { status: StatusOption; notes: string }>>({});
  const [sessionListLoading, setSessionListLoading] = useState(false);
  const [sessionDetailsLoading, setSessionDetailsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [summary, setSummary] = useState<{ recorded: number; present: number; absent: number; late: number } | null>(null);
  const [reviewRows, setReviewRows] = useState<AttendanceReviewRow[] | null>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadSessions() {
      setSessionListLoading(true);
      setError("");
      setMessage("");

      try {
        const response = await fetch("/api/lecturer/mark-attendance/session-list");
        const json = await response.json();

        if (!response.ok || !json.success) {
          setError(json?.message ?? "Unable to load open sessions.");
          return;
        }

        setSessions(json.data);
        if (!selectedSessionId && json.data.length > 0) {
          setSelectedSessionId(json.data[0].id);
        }
      } catch {
        setError("Unable to load open sessions.");
      } finally {
        setSessionListLoading(false);
      }
    }

    if (!initialSessions) {
      loadSessions();
    }
  }, [initialSessions, selectedSessionId]);

  useEffect(() => {
    if (!selectedSessionId) {
      return;
    }

    async function loadSession() {
      setSessionDetailsLoading(true);
      setError("");
      setMessage("");
      setSummary(null);
      setSessionDetails(null);

      try {
        const response = await fetch(`/api/lecturer/mark-attendance/${selectedSessionId}`);
        const json = await response.json();

        if (!response.ok || !json.success) {
          setError(json?.message ?? "Unable to load session details.");
          return;
        }

        const initialState: Record<string, { status: StatusOption; notes: string }> = {};

        for (const student of json.data.students) {
          initialState[student.id] = {
            status: student.status ?? "PRESENT",
            notes: student.notes ?? "",
          };
        }

        setAttendanceState(initialState);
        setSessionDetails(json.data);
      } catch {
        setError("Unable to load session details.");
      } finally {
        setSessionDetailsLoading(false);
      }
    }

    loadSession();
  }, [selectedSessionId]);

  const handleStatusChange = (studentId: string, value: StatusOption) => {
    setAttendanceState((current) => ({
      ...current,
      [studentId]: {
        ...current[studentId],
        status: value,
      },
    }));
  };

  const handleNotesChange = (studentId: string, value: string) => {
    setAttendanceState((current) => ({
      ...current,
      [studentId]: {
        ...current[studentId],
        notes: value,
      },
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!sessionDetails) {
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");

    const attendances = sessionDetails.students.map((student) => ({
      studentId: student.id,
      status: attendanceState[student.id]?.status ?? "PRESENT",
      notes: attendanceState[student.id]?.notes?.trim() || undefined,
    }));

    try {
      const response = await fetch("/api/lecturer/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionDetails.id, attendances }),
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        setError(json?.message ?? "Unable to record attendance.");
        return;
      }

      setMessage("Attendance recorded successfully.");
      setSummary({
        recorded: json.data.recorded,
        present: json.data.present,
        absent: json.data.absent,
        late: json.data.late,
      });
      setReviewRows(
        sessionDetails.students.map((student) => ({
          studentNumber: student.studentNumber,
          fullName: student.fullName,
          status: attendanceState[student.id]?.status ?? "PRESENT",
        })),
      );

      const refetch = await fetch(`/api/lecturer/mark-attendance/${selectedSessionId}`);
      const refetchJson = await refetch.json();
      if (refetch.ok && refetchJson.success) {
        setSessionDetails(refetchJson.data);
      }
    } catch {
      setError("Unable to record attendance.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Session selection</p>
          <h2 className="mt-2 text-2xl font-semibold">Choose an open session</h2>
          <p className="mt-2 text-sm text-zinc-600">Pick the session to record attendance and submit student statuses.</p>
        </div>
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-zinc-700" htmlFor="session">
            Open session
          </label>
          {sessionListLoading && sessions.length === 0 ? (
            <div className="mt-2 h-12 rounded-xl bg-zinc-200 animate-pulse" />
          ) : (
            <select
              id="session"
              className="mt-2 block w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              value={selectedSessionId}
              onChange={(event) => setSelectedSessionId(event.target.value)}
            >
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.course.code} — {session.title}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {sessionListLoading || sessionDetailsLoading ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
            <div className="h-5 w-40 rounded-full bg-zinc-200 animate-pulse" />
            <div className="mt-4 space-y-3">
              <div className="h-4 w-3/4 rounded-full bg-zinc-200 animate-pulse" />
              <div className="h-4 w-1/2 rounded-full bg-zinc-200 animate-pulse" />
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="h-4 w-36 rounded-full bg-zinc-200 animate-pulse" />
                <div className="h-4 w-24 rounded-full bg-zinc-200 animate-pulse" />
              </div>
              <div className="grid gap-3">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="h-4 rounded-full bg-zinc-200 animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : sessionDetails ? (
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
            <p className="text-sm font-semibold text-zinc-500">Session</p>
            <p className="mt-2 text-lg font-semibold text-zinc-900">{sessionDetails.course.code} — {sessionDetails.course.title}</p>
            <p className="mt-1 text-sm text-zinc-600">{sessionDetails.title}</p>
            <p className="mt-1 text-sm text-zinc-500">Starts: {new Date(sessionDetails.startsAt).toLocaleString()}</p>
          </div>

          {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
          {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div> : null}
          {summary ? (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-700">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <p className="font-semibold">Attendance summary</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-2xl border border-sky-100 bg-white p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-sky-500">Recorded</p>
                      <p className="mt-2 text-2xl font-semibold text-sky-900">{summary.recorded}</p>
                    </div>
                    <div className="rounded-2xl border border-sky-100 bg-white p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-sky-500">Present</p>
                      <p className="mt-2 text-2xl font-semibold text-sky-900">{summary.present}</p>
                    </div>
                    <div className="rounded-2xl border border-sky-100 bg-white p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-sky-500">Absent</p>
                      <p className="mt-2 text-2xl font-semibold text-sky-900">{summary.absent}</p>
                    </div>
                    <div className="rounded-2xl border border-sky-100 bg-white p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-sky-500">Late</p>
                      <p className="mt-2 text-2xl font-semibold text-sky-900">{summary.late}</p>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => tableRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
                    className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
                  >
                    Review changes
                  </button>
                </div>
              </div>
              {reviewRows ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-sky-100 bg-white text-sky-900">
                  <table className="min-w-full text-left text-xs">
                    <thead className="bg-sky-50 text-sky-600">
                      <tr>
                        <th className="px-3 py-2 font-medium">Student</th>
                        <th className="px-3 py-2 font-medium">Number</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviewRows.slice(0, 3).map((row) => (
                        <tr key={row.studentNumber} className="border-t border-sky-100">
                          <td className="px-3 py-2">{row.fullName}</td>
                          <td className="px-3 py-2 text-sky-600">{row.studentNumber}</td>
                          <td className="px-3 py-2 text-sky-700">{row.status}</td>
                        </tr>
                      ))}
                      {reviewRows.length > 3 ? (
                        <tr>
                          <td colSpan={3} className="px-3 py-2 text-xs text-sky-500">
                            and {reviewRows.length - 3} more students recorded...
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ) : null}

          <div ref={tableRef} className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Student number</th>
                  <th className="px-4 py-3">Attendance</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {sessionDetails.students.map((student) => (
                  <tr key={student.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-4 font-medium text-zinc-800">{student.fullName}</td>
                    <td className="px-4 py-4 text-zinc-600">{student.studentNumber}</td>
                    <td className="px-4 py-4">
                      <select
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        value={attendanceState[student.id]?.status ?? "PRESENT"}
                        onChange={(event) => handleStatusChange(student.id, event.target.value as StatusOption)}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <input
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        value={attendanceState[student.id]?.notes ?? ""}
                        onChange={(event) => handleNotesChange(student.id, event.target.value)}
                        placeholder="Optional note"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            {submitting ? "Recording attendance..." : "Record attendance"}
          </button>
        </form>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-500">Select an open session to begin.</div>
      )}
    </div>
  );
}
