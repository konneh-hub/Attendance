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
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Attendance</p><p className="font-semibold">Administration</p></div>
          <div className="flex items-center gap-4"><span className="hidden text-sm text-zinc-600 sm:block">{user.fullName}</span><LogoutButton /></div>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl gap-8 px-6 py-8">
        <nav aria-label="Administration" className="hidden w-48 shrink-0 space-y-1 md:block">
          {links.map(([label, href]) => <Link className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-white hover:text-indigo-700" href={href} key={href}>{label}</Link>)}
        </nav>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
