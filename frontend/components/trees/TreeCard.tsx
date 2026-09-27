import Link from "next/link";
import { ArrowRight, Pencil, Trash2, Users } from "lucide-react";
import { TreeSummary } from "@/lib/api";

interface TreeCardProps {
  tree: TreeSummary;
  onRename: (tree: TreeSummary) => void;
  onDelete: (tree: TreeSummary) => void;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function TreeCard({ tree, onRename, onDelete }: TreeCardProps) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
          <Users size={20} aria-hidden="true" />
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {tree.memberCount} {tree.memberCount === 1 ? "person" : "people"}
        </span>
      </div>

      <h2 className="text-xl font-bold text-slate-900">{tree.name}</h2>
      <p className="mt-2 text-sm text-slate-500">
        Updated {formatDate(tree.updatedAt)}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        <Link
          href={`/tree/${tree.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200"
          aria-label={`Open ${tree.name}`}
        >
          Open
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
        <button
          type="button"
          onClick={() => onRename(tree)}
          aria-label={`Rename ${tree.name}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <Pencil size={14} aria-hidden="true" />
          Rename
        </button>
        <button
          type="button"
          onClick={() => onDelete(tree)}
          aria-label={`Delete ${tree.name}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 size={14} aria-hidden="true" />
          Delete
        </button>
      </div>
    </article>
  );
}
