"use client";

import { useState } from "react";
import { Loader2, Trash2, X } from "lucide-react";
import { deleteTree, getApiErrorMessage, TreeSummary } from "@/lib/api";

interface DeleteTreeDialogProps {
  tree: TreeSummary;
  onClose: () => void;
  onDeleted: (treeId: string) => void;
}

export function DeleteTreeDialog({
  tree,
  onClose,
  onDeleted,
}: DeleteTreeDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDelete() {
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await deleteTree(tree.id);
      onDeleted(tree.id);
      onClose();
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to delete this family tree. Please try again.",
        ),
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-tree-title"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-red-600">
              <Trash2 size={15} aria-hidden="true" />
              Delete family tree
            </p>
            <h2
              id="delete-tree-title"
              className="mt-1 text-xl font-bold text-slate-900"
            >
              Delete &quot;{tree.name}&quot;?
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

        <div className="space-y-2 text-sm leading-6 text-slate-600">
          <p>
            This will permanently delete the family tree and all people inside
            it.
          </p>
          <p className="font-semibold text-red-700">
            This action cannot be undone.
          </p>
        </div>

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
            disabled={isDeleting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? <Loader2 className="animate-spin" size={17} /> : null}
            {isDeleting ? "Deleting..." : "Delete Tree"}
          </button>
        </div>
      </section>
    </div>
  );
}
