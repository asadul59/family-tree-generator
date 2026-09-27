"use client";

import { useState } from "react";
import {
  ArrowRightLeft,
  ChevronDown,
  ChevronRight,
  Heart,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { TreeHierarchyPerson } from "@/lib/api";

interface PersonNodeProps {
  person: TreeHierarchyPerson;
  depth?: number;
  isMutating?: boolean;
  onEdit: (person: TreeHierarchyPerson) => void;
  onMove: (person: TreeHierarchyPerson) => void;
  onDelete: (person: TreeHierarchyPerson) => void;
}

export function PersonNode({
  person,
  depth = 0,
  isMutating = false,
  onEdit,
  onMove,
  onDelete,
}: PersonNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = person.children.length > 0;

  return (
    <div className="flex min-w-max flex-col items-center">
      <article className="w-52 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md sm:w-56">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            <Users size={12} aria-hidden="true" />
            Generation {depth + 1}
          </span>

          <div className="flex items-center gap-0.5">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => setIsExpanded((expanded) => !expanded)}
                aria-expanded={isExpanded}
                aria-label={
                  isExpanded
                    ? `Collapse children of ${person.fullName}`
                    : `Expand children of ${person.fullName}`
                }
                title={isExpanded ? "Collapse children" : "Expand children"}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                {isExpanded ? (
                  <ChevronDown size={17} aria-hidden="true" />
                ) : (
                  <ChevronRight size={17} aria-hidden="true" />
                )}
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => onEdit(person)}
              disabled={isMutating}
              aria-label="Edit person"
              title="Edit person"
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Pencil size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onMove(person)}
              disabled={isMutating}
              aria-label="Move person"
              title="Move person"
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-violet-50 hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowRightLeft size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(person)}
              disabled={isMutating}
              aria-label="Delete person"
              title="Delete person"
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={15} aria-hidden="true" />
            </button>
          </div>
        </div>

        <h3
          className="truncate text-base font-bold text-slate-900"
          title={person.fullName}
        >
          {person.fullName}
        </h3>

        {person.spouseName ? (
          <p
            className="mt-2 flex items-center gap-1.5 truncate text-sm text-slate-500"
            title={person.spouseName}
          >
            <Heart
              size={14}
              className="shrink-0 text-rose-400"
              aria-hidden="true"
            />
            <span className="truncate">{person.spouseName}</span>
          </p>
        ) : null}

        {hasChildren ? (
          <p className="mt-3 text-xs font-medium text-slate-400">
            {person.children.length}{" "}
            {person.children.length === 1 ? "child" : "children"}
          </p>
        ) : null}
      </article>

      {isExpanded && hasChildren ? (
        <div className="relative mt-6 flex flex-col items-center">
          <div className="h-6 w-px bg-slate-300" aria-hidden="true" />
          <div className="relative flex gap-6 border-t border-slate-300 pt-6">
            {person.children.map((child) => (
              <div
                key={child.id}
                className="relative flex flex-col items-center"
              >
                <div
                  className="absolute -top-6 left-1/2 h-6 w-px -translate-x-1/2 bg-slate-300"
                  aria-hidden="true"
                />
                <PersonNode
                  person={child}
                  depth={depth + 1}
                  isMutating={isMutating}
                  onEdit={onEdit}
                  onMove={onMove}
                  onDelete={onDelete}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
