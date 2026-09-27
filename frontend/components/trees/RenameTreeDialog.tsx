"use client";

import { FormEvent, useState } from "react";
import { Loader2, Pencil, X } from "lucide-react";
import { getApiErrorMessage, TreeSummary, updateTree } from "@/lib/api";

interface RenameTreeDialogProps {
  tree: TreeSummary;
  onClose: () => void;
  onSaved: (tree: TreeSummary) => void;
}

export function RenameTreeDialog({
  tree,
  onClose,
  onSaved,
}: RenameTreeDialogProps) {
  const [name, setName] = useState(tree.name);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();

    if (!normalizedName) {
      setErrorMessage("Family tree name is required.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const updatedTree = await updateTree(tree.id, normalizedName);
      onSaved({ ...tree, ...updatedTree, memberCount: tree.memberCount });
      onClose();
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to rename this family tree. Please try again.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="rename-tree-title"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
              <Pencil size={15} aria-hidden="true" />
              Rename family tree
            </p>
            <h2
              id="rename-tree-title"
              className="mt-1 text-xl font-bold text-slate-900"
            >
              Rename Family Tree
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close rename dialog"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="tree-name"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Current name
            </label>
            <input
              id="tree-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              autoFocus
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
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
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
