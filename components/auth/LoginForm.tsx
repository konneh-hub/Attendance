"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { loginSchema, type LoginInput } from "@/lib/validations";
import { getRoleEntryPath } from "@/lib/role-routes";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  async function submitCredentials(values: LoginInput) {
    setServerError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setServerError(result.message ?? "Unable to sign in.");
        return;
      }

      const destination = new URLSearchParams(window.location.search).get("next");
      router.push(
        destination?.startsWith("/") ? destination : getRoleEntryPath(result.user.role),
      );
      router.refresh();
    } catch {
      setServerError("The service is unavailable. Please try again.");
    }
  }

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit(submitCredentials)}>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-800" htmlFor="identifier">
          Email address
        </label>
        <input
          autoComplete="username"
          className="h-11 w-full rounded-lg border border-zinc-300 px-3 text-zinc-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          id="identifier"
          maxLength={255}
          type="email"
          aria-describedby={errors.identifier ? "identifier-error" : undefined}
          aria-invalid={errors.identifier ? "true" : "false"}
          {...register("identifier")}
        />
        {errors.identifier ? (
          <p className="mt-2 text-sm text-red-700" id="identifier-error">
            {errors.identifier.message}
          </p>
        ) : null}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-800" htmlFor="password">
          Password
        </label>
        <div className="flex gap-2">
          <input
            autoComplete="current-password"
            className="h-11 min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 text-zinc-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            id="password"
            maxLength={128}
            type={showPassword ? "text" : "password"}
            aria-describedby={errors.password ? "password-error" : undefined}
            aria-invalid={errors.password ? "true" : "false"}
            {...register("password")}
          />
          <button
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            onClick={() => setShowPassword((visible) => !visible)}
            type="button"
          >
            {showPassword ? <EyeOff aria-hidden size={18} /> : <Eye aria-hidden size={18} />}
          </button>
        </div>
        {errors.password ? (
          <p className="mt-2 text-sm text-red-700" id="password-error">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      {serverError ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {serverError}
        </p>
      ) : null}

      <button
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? <LoaderCircle aria-hidden className="animate-spin" size={18} /> : null}
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
