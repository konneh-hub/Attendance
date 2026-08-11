import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export default async function LecturerEntryPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "LECTURER") {
    redirect("/forbidden");
  }

  redirect("/lecturer/dashboard");
}
