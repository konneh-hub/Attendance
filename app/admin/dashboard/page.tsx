import { getAdminDashboard } from "@/services/admin/admin.service";

const cards = [
  ["Users", "users"], ["Students", "students"], ["Lecturers", "lecturers"], ["Departments", "departments"], ["Courses", "courses"], ["Active accounts", "activeUsers"], ["Inactive or suspended", "inactiveUsers"],
] as const;

export default async function AdminDashboardPage() {
  const data = await getAdminDashboard();
  return <main><div className="mb-8"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Overview</p><h1 className="mt-2 text-3xl font-semibold">Administration dashboard</h1><p className="mt-2 text-zinc-600">Live counts from the PostgreSQL database.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards.map(([label, key]) => <section className="rounded-xl border border-zinc-200 bg-white p-5" key={key}><p className="text-sm text-zinc-500">{label}</p><p className="mt-3 text-3xl font-semibold">{data[key]}</p></section>)}</div></main>;
}
