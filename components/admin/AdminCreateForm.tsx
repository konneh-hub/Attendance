"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Option = { id: string; label: string };
type FormKind = "user" | "department" | "course" | "program";

type Props = {
  kind: FormKind;
  departments?: Option[];
  lecturers?: Option[];
};

const inputClass = "h-11 w-full rounded-lg border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export function AdminCreateForm({ kind, departments = [], lecturers = [] }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [role, setRole] = useState("STUDENT");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData.entries());
    const payload = kind === "user" ? { ...values, role } : values;
    const endpoint = kind === "user" ? "/api/admin/users" : kind === "department" ? "/api/admin/departments" : kind === "course" ? "/api/admin/courses" : "/api/admin/programs";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setErrorMessage(result.message ?? "Unable to save this record.");
        return;
      }
      router.push(kind === "user" ? "/admin/users" : kind === "department" ? "/admin/departments" : kind === "course" ? "/admin/courses" : "/admin/programs");
      router.refresh();
    } catch {
      setErrorMessage("The service is unavailable. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="max-w-2xl space-y-5 rounded-xl border border-zinc-200 bg-white p-6" onSubmit={submit}>
      {kind === "user" ? (
        <>
          <Field label="Full name" name="fullName" required />
          <Field label="Email address" name="email" required type="email" />
          <Field label="Temporary password" name="password" required type="password" minLength={12} />
          <label className="block text-sm font-medium text-zinc-800">Role<select className={`${inputClass} mt-2`} name="role" onChange={(event) => setRole(event.target.value)} value={role}><option value="STUDENT">Student</option><option value="LECTURER">Lecturer</option><option value="ADMIN">Administrator</option></select></label>
          {role === "STUDENT" ? <><Field label="Student number" name="studentNumber" required /><Field label="Programme" name="programme" /><Field label="Level" name="level" /><SelectField label="Department" name="departmentId" options={departments} required /></> : null}
          {role === "LECTURER" ? <><Field label="Staff number" name="staffNumber" required /><SelectField label="Department" name="departmentId" options={departments} required /></> : null}
        </>
      ) : null}
      {kind === "department" ? <><Field label="Department name" name="name" required /><Field label="Department code" name="code" required /></> : null}
      {kind === "course" ? <><Field label="Course code" name="code" required /><Field label="Course title" name="title" required /><label className="block text-sm font-medium text-zinc-800">Description<textarea className="mt-2 min-h-24 w-full rounded-lg border border-zinc-300 p-3 text-zinc-950 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" name="description" /></label><SelectField label="Department" name="departmentId" options={departments} required /><SelectField label="Lecturer" name="lecturerId" options={lecturers} required /></> : null}
      {kind === "program" ? <><Field label="Program code" name="code" required /><Field label="Program name" name="name" required /><label className="block text-sm font-medium text-zinc-800">Description<textarea className="mt-2 min-h-24 w-full rounded-lg border border-zinc-300 p-3 text-zinc-950 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" name="description" /></label></> : null}
      {errorMessage ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{errorMessage}</p> : null}
      <button className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60" disabled={isSubmitting} type="submit">{isSubmitting ? "Saving..." : "Save record"}</button>
    </form>
  );
}

function Field({ label, name, type = "text", required = false, minLength }: { label: string; name: string; type?: string; required?: boolean; minLength?: number }) {
  return <label className="block text-sm font-medium text-zinc-800">{label}<input className={`${inputClass} mt-2`} minLength={minLength} name={name} required={required} type={type} /></label>;
}

function SelectField({ label, name, options, required = false }: { label: string; name: string; options: Option[]; required?: boolean }) {
  return <label className="block text-sm font-medium text-zinc-800">{label}<select className={`${inputClass} mt-2`} name={name} required={required}><option value="">Select {label.toLowerCase()}</option>{options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>;
}
