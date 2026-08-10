"use client";

import { LogOut, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogout() {
    setIsLoggingOut(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });

      if (!response.ok) {
        setErrorMessage("Unable to sign out. Please try again.");
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setErrorMessage("The service is unavailable. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isLoggingOut}
        onClick={handleLogout}
        type="button"
      >
        {isLoggingOut ? <LoaderCircle aria-hidden className="animate-spin" size={16} /> : <LogOut aria-hidden size={16} />}
        {isLoggingOut ? "Signing out..." : "Sign out"}
      </button>
      {errorMessage ? <p className="text-sm text-red-700" role="alert">{errorMessage}</p> : null}
    </div>
  );
}
