import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { getCurrentUser } from "@/lib/session";

const navLinks = [
  ["Dashboard", "/student/dashboard"],
  ["Sessions", "/student/sessions"],
  ["My attendance", "/student/my-attendance"],
  ["Mark attendance", "/student/mark-attendance"],
] as const;

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.role !== "STUDENT") redirect("/forbidden");

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Attendance</p>
            <p className="font-semibold">Student dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-zinc-600 sm:block">{user.fullName}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-6 py-8">
        <nav aria-label="Student navigation" className="hidden w-60 shrink-0 space-y-1 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm md:block">
          {navLinks.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="block rounded-xl px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-indigo-700"
            >
              {label}
            </Link>
          ))}
        </nav>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
