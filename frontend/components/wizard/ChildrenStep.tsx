"use client";

import { FormEvent, useState } from "react";
import { Check, CircleAlert, Loader2, Plus, Trash2, Users } from "lucide-react";
import { ChildInput, QueuePerson } from "./types";

interface ChildrenStepProps {
  person: QueuePerson;
  errorMessage: string | null;
  isLoading: boolean;
  onNoChildren: () => void;
  onSave: (children: ChildInput[]) => void;
}

let childRowSequence = 0;

function createChildRow(): ChildInput {
  childRowSequence += 1;
  return {
    id: `child-${childRowSequence}`,
    fullName: "",
    spouseName: "",
  };
}

export function ChildrenStep({
  person,
  errorMessage,
  isLoading,
  onNoChildren,
  onSave,
}: ChildrenStepProps) {
  const [rows, setRows] = useState<ChildInput[]>(() => [createChildRow()]);

  function updateRow(
    id: string,
    field: "fullName" | "spouseName",
    value: string,
  ) {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === id ? { ...row, [field]: value } : row,
      ),
    );
  }

  function addRow() {
    setRows((currentRows) => [...currentRows, createChildRow()]);
  }

  function removeRow(id: string) {
    setRows((currentRows) =>
      currentRows.length === 1
        ? currentRows
        : currentRows.filter((row) => row.id !== id),
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(rows);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-violet-100 p-2 text-violet-700">
          <Users size={22} aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-violet-700">Step 3</p>
          <h1 className="text-2xl font-semibold text-slate-900">
            {person.name}&apos;s Family
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Add their children, or continue without any.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-4">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700">
                  Child {index + 1}
                </h2>
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length === 1 || isLoading}
                  aria-label={`Remove child ${index + 1}`}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor={`${row.id}-full-name`}
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Full name
                  </label>
                  <input
                    id={`${row.id}-full-name`}
                    type="text"
                    value={row.fullName}
                    onChange={(event) =>
                      updateRow(row.id, "fullName", event.target.value)
                    }
                    placeholder="Michael Doe"
                    required={rows.length === 1}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`${row.id}-spouse-name`}
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Spouse <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <input
                    id={`${row.id}-spouse-name`}
                    type="text"
                    value={row.spouseName}
                    onChange={(event) =>
                      updateRow(row.id, "spouseName", event.target.value)
                    }
                    placeholder="Sarah Doe"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addRow}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-400 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} aria-hidden="true" />
          Add another child
        </button>

        {errorMessage ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <CircleAlert size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700 focus:outline-none focus:ring-4 focus:ring-violet-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} aria-hidden="true" />}
            {isLoading ? "Saving children..." : "Save Children"}
          </button>

          <button
            type="button"
            onClick={onNoChildren}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            No children
          </button>
        </div>
      </form>
    </section>
  );
}
