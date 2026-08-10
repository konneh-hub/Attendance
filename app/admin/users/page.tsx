import Link from "next/link";

import { BulkImportDialog } from "@/components/admin/BulkImportDialog";
import { listUsers } from "@/services/admin/admin.service";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search = "" } = await searchParams;
  const result = await listUsers(search, 1, 50);

  return (
    <main>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Administration</p><h1 className="mt-2 text-3xl font-semibold">Users</h1><p className="mt-2 text-zinc-600">Manage account identity, roles, and status.</p></div>
        <div className="flex items-center gap-2">
          <BulkImportDialog buttonLabel="Import Users" title="Import users" type="users" />
          <Link className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700" href="/admin/users/new">Create user</Link>
        </div>
      </div>
      <form className="mb-4 flex gap-2" method="get"><input className="h-10 flex-1 rounded-lg border border-zinc-300 px-3" defaultValue={search} name="search" placeholder="Search name, email, or role"/><button className="rounded-lg border border-zinc-300 px-4 text-sm font-semibold" type="submit">Search</button></form>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white"><table className="min-w-full text-left text-sm"><thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Last login</th></tr></thead><tbody>{result.items.map((user) => <tr className="border-b border-zinc-100 last:border-0" key={user.id}><td className="px-4 py-3 font-medium">{user.fullName}</td><td className="px-4 py-3">{user.email}</td><td className="px-4 py-3">{user.role}</td><td className="px-4 py-3">{user.status}</td><td className="px-4 py-3">{user.createdAt.toLocaleDateString()}</td><td className="px-4 py-3">{user.lastLoginAt?.toLocaleDateString() ?? "Never"}</td></tr>)}</tbody></table>{result.items.length === 0 ? <p className="p-8 text-center text-zinc-500">No users found.</p> : null}</div>
    </main>
  );
}
