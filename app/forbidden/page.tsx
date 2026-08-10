import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-6 py-12">
      <section className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-xl shadow-zinc-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">Access denied</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
          You do not have permission to access this resource.
        </h1>
        <p className="mt-3 text-zinc-600">
          Return to your authenticated entry point or sign in with another account.
        </p>
        <Link
          className="mt-7 inline-flex rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
          href="/"
        >
          Return to application
        </Link>
      </section>
    </main>
  );
}
