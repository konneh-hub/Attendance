import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in | Attendance",
  description: "Sign in to the Student Attendance Tracking System.",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-6 py-12">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl shadow-zinc-200/60">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Student Attendance
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
            Sign in to your account
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Use your registered email and password to continue.
          </p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
