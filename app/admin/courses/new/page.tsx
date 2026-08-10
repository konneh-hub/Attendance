import { AdminCreateForm } from "@/components/admin/AdminCreateForm";
import { listDepartments, listLecturers } from "@/services/admin/admin.service";

export default async function NewCoursePage() {
  const [departments, lecturers] = await Promise.all([listDepartments(""), listLecturers("", 1, 50)]);
  return <main><div className="mb-8"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Administration</p><h1 className="mt-2 text-3xl font-semibold">Create course</h1><p className="mt-2 text-zinc-600">Assign the course to an existing department and lecturer.</p></div><AdminCreateForm departments={departments.map((department) => ({ id: department.id, label: `${department.code} - ${department.name}` }))} lecturers={lecturers.items.map((lecturer) => ({ id: lecturer.id, label: `${lecturer.staffNumber} - ${lecturer.user.fullName}` }))} kind="course" /></main>;
}
