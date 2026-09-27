"use client";

import { QueuePerson } from "./types";

interface WizardProgressProps {
  currentPerson: QueuePerson;
  completedCount: number;
  remainingCount: number;
}

export function WizardProgress({
  currentPerson,
  completedCount,
  remainingCount,
}: WizardProgressProps) {
  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Generation {currentPerson.generation + 1}
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            Adding children of {currentPerson.name}
          </p>
        </div>
        <div className="flex gap-2 text-xs font-medium text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1.5">
            Processed: {completedCount}
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">
            Remaining: {remainingCount}
          </span>
        </div>
      </div>
    </div>
  );
}
