"use client";

import { FormEvent, useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  getApiErrorMessage,
  TreeHierarchyPerson,
  updatePerson,
} from "@/lib/api";

interface EditPersonDialogProps {
  person: TreeHierarchyPerson;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

export function EditPersonDialog({
  person,
  onClose,
  onSaved,
}: EditPersonDialogProps) {
  const [fullName, setFullName] = useState(person.fullName);
  const [spouseName, setSpouseName] = useState(person.spouseName ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedFullName = fullName.trim();

    if (!normalizedFullName) {
      setErrorMessage("Full name is required.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await updatePerson(person.id, {
        fullName: normalizedFullName,
        spouseName: spouseName.trim() || null,
      });
      await onSaved();
      onClose();
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to update this person. Please try again.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-person-title"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-emerald-700">Edit person</p>
            <h2
              id="edit-person-title"
              className="mt-1 text-xl font-bold text-slate-900"
            >
              Update {person.fullName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close edit dialog"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="edit-full-name"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Full name
            </label>
            <input
              id="edit-full-name"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
              autoFocus
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label
              htmlFor="edit-spouse-name"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Spouse name{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="edit-spouse-name"
              type="text"
              value={spouseName}
              onChange={(event) => setSpouseName(event.target.value)}
              placeholder="Leave blank to remove spouse"
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

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="animate-spin" size={17} /> : null}
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
