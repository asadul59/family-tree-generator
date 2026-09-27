"use client";

import { useState } from "react";
import { Loader2, Trash2, X } from "lucide-react";
import {
  deletePerson,
  getApiErrorMessage,
  TreeHierarchyPerson,
} from "@/lib/api";

interface DeletePersonDialogProps {
  person: TreeHierarchyPerson;
  onClose: () => void;
  onDeleted: () => Promise<void> | void;
}

export function DeletePersonDialog({
  person,
  onClose,
  onDeleted,
}: DeletePersonDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDelete() {
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await deletePerson(person.id);
      await onDeleted();
      onClose();
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "This person cannot be deleted because they have children.",
        ),
      );
    } finally {
      setIsDeleting(false);
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
        aria-labelledby="delete-person-title"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-red-600">Delete person</p>
            <h2
              id="delete-person-title"
              className="mt-1 text-xl font-bold text-slate-900"
            >
              Delete {person.fullName}?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Close delete dialog"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <p className="text-sm leading-6 text-slate-600">
          This action cannot be undone. The person will be removed from this
          family tree.
        </p>

        {person.children.length > 0 ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            This person has {person.children.length}{" "}
            {person.children.length === 1 ? "child" : "children"} and cannot
            be deleted until they are handled.
          </p>
        ) : null}

        {errorMessage ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || person.children.length > 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? (
              <Loader2 className="animate-spin" size={17} />
            ) : (
              <Trash2 size={17} aria-hidden="true" />
            )}
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </section>
    </div>
  );
}
