import type { UserRole } from "@prisma/client";

export const ROLE_ENTRY_PATHS: Record<UserRole, string> = {
  ADMIN: "/admin",
  LECTURER: "/lecturer",
  STUDENT: "/student",
};

export function getRoleEntryPath(role: UserRole) {
  return ROLE_ENTRY_PATHS[role];
}