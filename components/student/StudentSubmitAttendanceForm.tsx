"use client";

import { useMemo, useState } from "react";
import { VerificationMethod } from "@prisma/client";

const verificationLabels: Record<VerificationMethod, string> = {
  QR: "QR code",
  GPS: "Location",
  FACE: "Face verification",
  MANUAL: "Manual",
};

export function StudentSubmitAttendanceForm({ session }: { session: {
  id: string;
  title: string;
  startsAt: string | Date;
  endsAt: string | Date | null;
  course: { code: string; title: string };
  lecturerName: string;
  verificationMethods: VerificationMethod[];
  locationLatitude: number | null;
  locationLongitude: number | null;
  locationRadiusMeters: number | null;
  alreadySubmitted: boolean;
} }) {
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>(
    session.verificationMethods[0],
  );
  const [qrToken, setQrToken] = useState("");
  const [notes, setNotes] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [faceImageData, setFaceImageData] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const verificationOpts = useMemo(
    () => session.verificationMethods.map((method) => ({ value: method, label: verificationLabels[method] ?? method })),
    [session.verificationMethods],
  );

  const canSubmit = useMemo(() => {
    if (session.alreadySubmitted) return false;
    if (verificationMethod === "QR") return qrToken.trim().length > 0;
    if (verificationMethod === "GPS") return latitude != null && longitude != null;
    if (verificationMethod === "FACE") return faceImageData.trim().length > 0;
    return false;
  }, [session.alreadySubmitted, verificationMethod, qrToken, latitude, longitude, faceImageData]);

  async function requestLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    setError("");
    setMessage("Requesting your location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setMessage("Location captured successfully.");
      },
      (geoError) => {
        setError(geoError.message || "Unable to capture location.");
        setMessage("");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  async function handleFaceCapture() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is not supported by this browser.");
      return;
    }

    setError("");
    setMessage("Opening camera for face capture...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement("video");
      video.srcObject = stream;
      video.play();

      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => resolve();
      });

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Unable to capture face image.");
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");
      setFaceImageData(dataUrl);
      setMessage("Face image captured. Submit to complete verification.");

      stream.getTracks().forEach((track) => track.stop());
    } catch (captureError) {
      setError((captureError as Error).message || "Unable to capture face image.");
      setMessage("");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/student/submit-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          verificationMethod,
          qrToken: verificationMethod === "QR" ? qrToken : undefined,
          latitude: verificationMethod === "GPS" ? latitude : undefined,
          longitude: verificationMethod === "GPS" ? longitude : undefined,
          faceImageData: verificationMethod === "FACE" ? faceImageData : undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        setError(json?.message ?? "Unable to submit attendance.");
        return;
      }

      setMessage("Attendance submitted successfully.");
    } catch {
      setError("Unable to submit attendance.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
        <h2 className="text-lg font-semibold text-zinc-900">{session.course.code} — {session.course.title}</h2>
        <p className="mt-2 text-sm text-zinc-600">Session: {session.title}</p>
        <p className="mt-1 text-sm text-zinc-600">Starts: {new Date(session.startsAt).toLocaleString()}</p>
        <p className="text-sm text-zinc-600">Verification methods: {session.verificationMethods.join(", ")}</p>
      </div>

      {session.alreadySubmitted ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          You have already submitted attendance for this session.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Verification method</span>
          <select
            className="mt-2 block w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            value={verificationMethod}
            onChange={(event) => setVerificationMethod(event.target.value as VerificationMethod)}
          >
            {verificationOpts.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Notes (optional)</span>
          <textarea
            className="mt-2 min-h-[120px] w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
      </div>

      {verificationMethod === "QR" ? (
        <div className="space-y-2 rounded-3xl border border-zinc-200 bg-white p-6">
          <p className="text-sm font-semibold text-zinc-900">QR verification</p>
          <p className="text-sm text-zinc-600">Enter the QR token provided by your lecturer.</p>
          <input
            className="mt-3 block w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            type="text"
            value={qrToken}
            onChange={(event) => setQrToken(event.target.value)}
            placeholder="Paste QR token here"
          />
        </div>
      ) : null}

      {verificationMethod === "GPS" ? (
        <div className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-6">
          <div>
            <p className="text-sm font-semibold text-zinc-900">Location verification</p>
            <p className="mt-1 text-sm text-zinc-600">Use your device location to verify you are on campus.</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            onClick={requestLocation}
          >
            Capture location
          </button>
          {latitude != null && longitude != null ? (
            <p className="text-sm text-zinc-600">Captured: {latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
          ) : null}
        </div>
      ) : null}

      {verificationMethod === "FACE" ? (
        <div className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-6">
          <div>
            <p className="text-sm font-semibold text-zinc-900">Face verification</p>
            <p className="mt-1 text-sm text-zinc-600">Capture a selfie to confirm attendance.</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            onClick={handleFaceCapture}
          >
            Capture face image
          </button>
          {faceImageData ? (
            <img className="mt-2 max-h-40 rounded-2xl border border-zinc-200" src={faceImageData} alt="Captured face" />
          ) : null}
        </div>
      ) : null}

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div> : null}

      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className="inline-flex items-center justify-center rounded-3xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
      >
        {submitting ? "Submitting attendance..." : session.alreadySubmitted ? "Already submitted" : "Submit attendance"}
      </button>
    </form>
  );
}
