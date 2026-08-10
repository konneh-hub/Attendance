import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default async function AdminEntryPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/forbidden");
  }

  return (
      <main className="min-h-screen bg-zinc-100 px-6 py-12">
        <section className="mx-auto flex w-full max-w-5xl items-start justify-between gap-8 rounded-2xl bg-white p-8 shadow-xl shadow-zinc-200/60">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Admin area</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">Welcome, {user.fullName}</h1>
            <p className="mt-2 text-zinc-600">Administrative modules will be introduced in a later phase.</p>
          </div>
          <LogoutButton />
        </section>
      </main>
  );
}
