import { AdminCreateForm } from "@/components/admin/AdminCreateForm";

export default function NewDepartmentPage() {
  return <main><div className="mb-8"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Administration</p><h1 className="mt-2 text-3xl font-semibold">Create department</h1><p className="mt-2 text-zinc-600">Add a unique academic department code and name.</p></div><AdminCreateForm kind="department" /></main>;
}
