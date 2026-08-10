import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { getRoleEntryPath } from "@/lib/role-routes";
import { getCurrentUser } from "@/lib/session";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  redirect(getRoleEntryPath(user.role));

  return null;
}
