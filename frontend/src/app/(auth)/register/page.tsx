import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7f4] px-6 text-slate-950">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-emerald-700">Job Board</p>
        <h1 className="mt-2 text-3xl font-semibold">Create account</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Registration will use the same Sanctum session flow as login.
        </p>
        <Link
          className="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white"
          href="/login"
        >
          Back to login
        </Link>
      </section>
    </main>
  );
}
