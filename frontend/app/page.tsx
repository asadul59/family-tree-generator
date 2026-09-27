import Link from "next/link";
import { ArrowRight, GitBranch, Users } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 text-slate-900">
      <section className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-14">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <GitBranch size={32} aria-hidden="true" />
        </div>

        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Family Tree Generator
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Build your family tree step by step.
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-slate-600">
          Start with a name, add the first person, and grow your family one
          generation at a time.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/wizard"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 sm:w-auto"
          >
            <Users size={18} aria-hidden="true" />
            Create New Family Tree
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link
            href="/trees"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 sm:w-auto"
          >
            View My Family Trees
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
