"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Course = {
  id: string;
  code: string;
  title: string;
  department: { code: string; name: string };
  enrolledCount: number;
  openSessionCount: number;
};

type LecturerSession = {
  id: string;
  title: string;
  status: string;
  startsAt: string;
  endsAt: string | null;
  course: { id: string; code: string; title: string };
  _count: { attendances: number };
};

const verificationOptions = [
  { value: "QR", label: "QR code" },
  { value: "GPS", label: "GPS location" },
  { value: "FACE", label: "Face verification" },
  { value: "MANUAL", label: "Manual verification" },
] as const;

type Props = {
  initialSessions?: LecturerSession[];
};

export function LecturerSessionManager({ initialSessions }: Props) {
  const [sessions, setSessions] = useState<LecturerSession[]>(initialSessions ?? []);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [verificationMethods, setVerificationMethods] = useState<string[]>(["MANUAL"]);
  const [locationLatitude, setLocationLatitude] = useState("");
  const [locationLongitude, setLocationLongitude] = useState("");
  const [locationRadiusMeters, setLocationRadiusMeters] = useState("");
  const [qrToken, setQrToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/lecturer/courses");
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json?.message ?? "Unable to load your courses.");
      }

      setCourses(json.data);
      setSelectedCourseId((current) => current || json.data[0]?.id ?? "");
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Unable to load your courses.");
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/lecturer/sessions");
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json?.message ?? "Unable to load your sessions.");
      }

      setSessions(json.data);
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Unable to load your sessions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    if (!initialSessions) {
      fetchSessions();
    }
  }, []);

  const refreshSessions = async () => {
    await fetchSessions();
  };

  const handleVerificationToggle = (value: string) => {
    setVerificationMethods((prev) =>
      prev.includes(value) ? prev.filter((method) => method !== value) : [...prev, value],
    );
  };

  const handleCreateSession = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setCreating(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        courseId: selectedCourseId,
        title,
        startsAt,
        endsAt,
        verificationMethods,
        locationLatitude: locationLatitude || null,
        locationLongitude: locationLongitude || null,
        locationRadiusMeters: locationRadiusMeters ? Number(locationRadiusMeters) : null,
        qrToken: qrToken || null,
      };

      const response = await fetch("/api/lecturer/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json?.message ?? "Unable to create session.");
      }

      setMessage("Session created successfully. It is currently in draft status.");
      setTitle("");
      setStartsAt("");
      setEndsAt("");
      setVerificationMethods(["MANUAL"]);
      setLocationLatitude("");
      setLocationLongitude("");
      setLocationRadiusMeters("");
      setQrToken("");
      await refreshSessions();
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Unable to create session.");
    } finally {
      setCreating(false);
    }
  };

  const handleSessionAction = async (sessionId: string, action: "OPEN" | "CLOSE") => {
    setActionLoading(sessionId);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/lecturer/sessions/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, action }),
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json?.message ?? "Unable to update session status.");
      }

      setMessage(`Session ${action === "OPEN" ? "opened" : "closed"} successfully.`);
      await refreshSessions();
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Unable to update session status.");
    } finally {
      setActionLoading(null);
    }
  };

  const pendingAction = Boolean(actionLoading);
  const noCourses = courses.length === 0;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Create attendance session</p>
            <h2 className="mt-2 text-2xl font-semibold">New session</h2>
            <p className="mt-2 text-sm text-zinc-600">Draft a new attendance session for one of your active courses.</p>
          </div>
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleCreateSession}>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <label htmlFor="course" className="text-sm font-medium text-zinc-700">Course</label>
              <select
                id="course"
                className="mt-2 block w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                value={selectedCourseId}
                onChange={(event) => setSelectedCourseId(event.target.value)}
                disabled={noCourses}
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} — {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="title" className="text-sm font-medium text-zinc-700">Session title</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-2 block w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                placeholder="e.g. Week 4 Lecture"
                required
              />
            </div>

            <div>
              <label htmlFor="startsAt" className="text-sm font-medium text-zinc-700">Starts at</label>
              <input
                id="startsAt"
                type="datetime-local"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
                className="mt-2 block w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                required
              />
            </div>

            <div>
              <label htmlFor="endsAt" className="text-sm font-medium text-zinc-700">Ends at</label>
              <input
                id="endsAt"
                type="datetime-local"
                value={endsAt}
                onChange={(event) => setEndsAt(event.target.value)}
                className="mt-2 block w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                required
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-zinc-700">Verification methods</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {verificationOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3"
                >
                  <input
                    type="checkbox"
                    checked={verificationMethods.includes(option.value)}
                    onChange={() => handleVerificationToggle(option.value)}
                    className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-zinc-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {verificationMethods.includes("GPS") ? (
            <div className="grid gap-6 lg:grid-cols-3">
              <div>
                <label htmlFor="locationLatitude" className="text-sm font-medium text-zinc-700">Latitude</label>
                <input
                  id="locationLatitude"
                  type="number"
                  value={locationLatitude}
                  onChange={(event) => setLocationLatitude(event.target.value)}
                  step="0.000001"
                  className="mt-2 block w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="e.g. 6.5244"
                />
              </div>
              <div>
                <label htmlFor="locationLongitude" className="text-sm font-medium text-zinc-700">Longitude</label>
                <input
                  id="locationLongitude"
                  type="number"
                  value={locationLongitude}
                  onChange={(event) => setLocationLongitude(event.target.value)}
                  step="0.000001"
                  className="mt-2 block w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="e.g. 3.3792"
                />
              </div>
              <div>
                <label htmlFor="locationRadiusMeters" className="text-sm font-medium text-zinc-700">Radius (meters)</label>
                <input
                  id="locationRadiusMeters"
                  type="number"
                  value={locationRadiusMeters}
                  onChange={(event) => setLocationRadiusMeters(event.target.value)}
                  min="1"
                  className="mt-2 block w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="e.g. 50"
                />
              </div>
            </div>
          ) : null}

          {verificationMethods.includes("QR") ? (
            <div>
              <label htmlFor="qrToken" className="text-sm font-medium text-zinc-700">QR session token</label>
              <input
                id="qrToken"
                type="text"
                value={qrToken}
                onChange={(event) => setQrToken(event.target.value)}
                className="mt-2 block w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                placeholder="Enter QR code token"
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-zinc-500">Drafts can be opened later for student attendance submission.</p>
            </div>
            <button
              type="submit"
              disabled={creating || noCourses}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              {creating ? "Creating..." : "Create session"}
            </button>
          </div>

          {message ? <p className="text-sm text-green-600">{message}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {noCourses ? <p className="text-sm text-zinc-500">No active courses assigned to you. Please ask your administrator to assign a course.</p> : null}
        </form>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Attendance sessions</p>
            <h2 className="mt-2 text-2xl font-semibold">Manage your sessions</h2>
            <p className="mt-2 text-sm text-zinc-600">Open draft sessions and close active sessions when attendance is complete.</p>
          </div>
          <button
            type="button"
            onClick={refreshSessions}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
          >
            Refresh list
          </button>
        </div>

        <div className="mt-6 overflow-x-auto rounded-3xl border border-zinc-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Session title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Starts</th>
                <th className="px-4 py-3">Attendance</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr className="border-b border-zinc-100 last:border-0" key={session.id}>
                  <td className="px-4 py-3 font-medium">{session.course.code}</td>
                  <td className="px-4 py-3">{session.title}</td>
                  <td className="px-4 py-3">{session.status}</td>
                  <td className="px-4 py-3">{new Date(session.startsAt).toLocaleString()}</td>
                  <td className="px-4 py-3">{session._count.attendances}</td>
                  <td className="px-4 py-3 space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                    {session.status === "DRAFT" ? (
                      <button
                        type="button"
                        disabled={pendingAction}
                        onClick={() => handleSessionAction(session.id, "OPEN")}
                        className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
                      >
                        {actionLoading === session.id ? "Opening..." : "Open session"}
                      </button>
                    ) : null}
                    {session.status === "OPEN" ? (
                      <>
                        <Link
                          href="/lecturer/mark-attendance"
                          className="inline-flex items-center justify-center rounded-xl border border-indigo-600 bg-white px-3 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"
                        >
                          Mark attendance
                        </Link>
                        <button
                          type="button"
                          disabled={pendingAction}
                          onClick={() => handleSessionAction(session.id, "CLOSE")}
                          className="inline-flex items-center justify-center rounded-xl bg-zinc-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                        >
                          {actionLoading === session.id ? "Closing..." : "Close session"}
                        </button>
                      </>
                    ) : null}
                    {session.status === "CLOSED" ? (
                      <span className="inline-flex items-center rounded-xl bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-700">
                        Closed
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sessions.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">No attendance sessions found.</div>
          ) : null}
        </div>

        {message ? <p className="mt-4 text-sm text-green-600">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </section>
    </div>
  );
}
