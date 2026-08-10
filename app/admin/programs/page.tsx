import Link from "next/link";

import { listPrograms } from "@/services/admin/admin.service";

export default async function AdminProgramsPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const { search = "" } = await searchParams;
  const programs = await listPrograms(search);

  return (
    <main>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Administration</p>
          <h1 className="mt-2 text-3xl font-semibold">Programs</h1>
          <p className="mt-2 text-zinc-600">Academic programs and their current student enrollment counts.</p>
        </div>
        <Link className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700" href="/admin/programs/new">
          Create program
        </Link>
      </div>

      <form className="mb-4 flex gap-2" method="get">
        <input className="h-10 flex-1 rounded-lg border border-zinc-300 px-3" defaultValue={search} name="search" placeholder="Search program name or code" />
        <button className="rounded-lg border border-zinc-300 px-4 text-sm font-semibold" type="submit">Search</button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Students</th>
            </tr>
          </thead>
          <tbody>
            {programs.map((program: { id: string; code: string; name: string; description: string | null; _count: { students: number } }) => (
              <tr className="border-b border-zinc-100 last:border-0" key={program.id}>
                <td className="px-4 py-3 font-medium">{program.code}</td>
                <td className="px-4 py-3">{program.name}</td>
                <td className="px-4 py-3">{program.description ?? "—"}</td>
                <td className="px-4 py-3">{program._count.students}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {programs.length === 0 ? <p className="p-8 text-center text-zinc-500">No programs found.</p> : null}
      </div>
    </main>
  );
}
