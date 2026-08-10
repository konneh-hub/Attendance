import { AdminCreateForm } from "@/components/admin/AdminCreateForm";
import { listDepartments } from "@/services/admin/admin.service";

export default async function NewAdminUserPage() {
  const departments = await listDepartments("");
  return <main><div className="mb-8"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Administration</p><h1 className="mt-2 text-3xl font-semibold">Create user</h1><p className="mt-2 text-zinc-600">Create an account and, where required, its academic profile.</p></div><AdminCreateForm departments={departments.map((department) => ({ id: department.id, label: `${department.code} - ${department.name}` }))} kind="user" /></main>;
}
