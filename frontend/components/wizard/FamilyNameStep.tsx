"use client";

import { FormEvent } from "react";
import { ArrowRight, Loader2, TreePine } from "lucide-react";

interface FamilyNameStepProps {
  value: string;
  errorMessage: string | null;
  isLoading: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function FamilyNameStep({
  value,
  errorMessage,
  isLoading,
  onChange,
  onSubmit,
}: FamilyNameStepProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
          <TreePine size={22} aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-emerald-700">Step 1</p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Create Your Family Tree
          </h1>
        </div>
      </div>

      <p className="mb-6 text-sm leading-6 text-slate-600">
        Give your family tree a name to get started. You will add the first
        person in the next step.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="tree-name"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Family tree name
          </label>
          <input
            id="tree-name"
            name="treeName"
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="My Family"
            required
            autoFocus
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
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
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? <Loader2 className="animate-spin" size={18} /> : null}
          {isLoading ? "Creating family..." : "Start"}
          {!isLoading ? <ArrowRight size={18} aria-hidden="true" /> : null}
        </button>
      </form>
    </section>
  );
}
