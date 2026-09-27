"use client";

import { FormEvent } from "react";
import { ArrowRight, Loader2, Users } from "lucide-react";

interface RootPersonStepProps {
  fullName: string;
  spouseName: string;
  errorMessage: string | null;
  isLoading: boolean;
  onFullNameChange: (value: string) => void;
  onSpouseNameChange: (value: string) => void;
  onSubmit: () => void;
}

export function RootPersonStep({
  fullName,
  spouseName,
  errorMessage,
  isLoading,
  onFullNameChange,
  onSpouseNameChange,
  onSubmit,
}: RootPersonStepProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-sky-100 p-2 text-sky-700">
          <Users size={22} aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-sky-700">Step 2</p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Start Your Family Tree
          </h1>
        </div>
      </div>

      <p className="mb-6 text-sm leading-6 text-slate-600">
        Who is the first person in your family tree?
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="root-full-name"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Full name
          </label>
          <input
            id="root-full-name"
            name="fullName"
            type="text"
            value={fullName}
            onChange={(event) => onFullNameChange(event.target.value)}
            placeholder="John Doe"
            required
            autoFocus
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          />
        </div>

        <div>
          <label
            htmlFor="root-spouse-name"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Spouse name <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="root-spouse-name"
            name="spouseName"
            type="text"
            value={spouseName}
            onChange={(event) => onSpouseNameChange(event.target.value)}
            placeholder="Jane Doe"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          />
        </div>

        {errorMessage ? (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? <Loader2 className="animate-spin" size={18} /> : null}
          {isLoading ? "Creating person..." : "Continue"}
          {!isLoading ? <ArrowRight size={18} aria-hidden="true" /> : null}
        </button>
      </form>
    </section>
  );
}
