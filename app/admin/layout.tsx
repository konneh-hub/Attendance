import { redirect } from "next/navigation";
import Link from "next/link";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { getCurrentUser } from "@/lib/session";

const links = [
  ["Dashboard", "/admin"],
  ["Users", "/admin/users"],
  ["Students", "/admin/students"],
  ["Lecturers", "/admin/lecturers"],
  ["Departments", "/admin/departments"],
  ["Courses", "/admin/courses"],
  ["Programs", "/admin/programs"],
  ["Attendance Reports", "/admin/attendance-reports"],
] as const;

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/forbidden");

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600">Attendance</p><p className="truncate text-sm font-semibold sm:text-base">Administration</p></div>
          <div className="flex items-center gap-2 sm:gap-4"><span className="hidden max-w-48 truncate text-sm text-zinc-600 sm:block">{user.fullName}</span><LogoutButton /></div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8">
        <div className="mb-4 md:hidden"><details className="group rounded-2xl border border-zinc-200 bg-white shadow-sm"><summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden"><span>Admin menu</span><span className="text-zinc-400 transition group-open:rotate-180">⌄</span></summary><div className="grid gap-1 border-t border-zinc-100 p-2 sm:grid-cols-2">{links.map(([label, href]) => <Link className="rounded-xl px-3 py-3 text-sm font-medium text-zinc-700 hover:bg-indigo-50 hover:text-indigo-700" href={href} key={href}>{label}</Link>)}</div></details></div>
        <div className="flex gap-6 lg:gap-8">
          <nav aria-label="Administration" className="hidden w-52 shrink-0 rounded-3xl border border-zinc-200 bg-white p-3 shadow-sm md:block">{links.map(([label, href]) => <Link className="block rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-indigo-50 hover:text-indigo-700" href={href} key={href}>{label}</Link>)}</nav>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
