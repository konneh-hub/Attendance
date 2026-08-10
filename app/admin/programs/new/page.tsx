import { AdminCreateForm } from "@/components/admin/AdminCreateForm";

export default function NewProgramPage() {
  return (
    <main>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Administration</p>
        <h1 className="mt-2 text-3xl font-semibold">Create program</h1>
        <p className="mt-2 text-zinc-600">Add a new academic program and associate it with student records.</p>
      </div>
      <AdminCreateForm kind="program" />
    </main>
  );
}
