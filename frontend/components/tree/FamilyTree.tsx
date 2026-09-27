"use client";

import Link from "next/link";
import { useState } from "react";
import { UserRoundPlus } from "lucide-react";
import { TreeHierarchyPerson, TreeHierarchyResponse } from "@/lib/api";
import { PersonNode } from "./PersonNode";
import { TreeControls } from "./TreeControls";

interface FamilyTreeProps {
  hierarchy: TreeHierarchyResponse;
  isMutating?: boolean;
  onEditPerson: (person: TreeHierarchyPerson) => void;
  onMovePerson: (person: TreeHierarchyPerson) => void;
  onDeletePerson: (person: TreeHierarchyPerson) => void;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 1.5;
const ZOOM_STEP = 0.1;

function clampScale(value: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
}

export function FamilyTree({
  hierarchy,
  isMutating = false,
  onEditPerson,
  onMovePerson,
  onDeletePerson,
}: FamilyTreeProps) {
  const [scale, setScale] = useState(1);

  if (hierarchy.members.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <UserRoundPlus size={26} aria-hidden="true" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">
          No family members found.
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          Start building your family tree from the wizard.
        </p>
        <Link
          href="/wizard"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200"
        >
          Start Family Tree
        </Link>
      </section>
    );
  }

  function zoomIn() {
    setScale((currentScale) =>
      clampScale(Number((currentScale + ZOOM_STEP).toFixed(2))),
    );
  }

  function zoomOut() {
    setScale((currentScale) =>
      clampScale(Number((currentScale - ZOOM_STEP).toFixed(2))),
    );
  }

  function resetZoom() {
    setScale(1);
  }

  return (
    <section
      className="relative"
      aria-label={`${hierarchy.name} family hierarchy`}
    >
      <div className="sticky top-4 z-10 flex justify-end px-2 pb-3">
        <TreeControls
          scale={scale}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onReset={resetZoom}
        />
      </div>

      <div className="max-h-[70vh] min-h-[24rem] overflow-auto rounded-2xl border border-slate-200 bg-slate-50/70 p-2 shadow-inner sm:max-h-[72vh]">
        <div
          className="min-w-max p-6"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
          }}
        >
          <div className="flex min-w-max justify-center gap-12 px-4 py-4">
            {hierarchy.members.map((member) => (
              <PersonNode
                key={member.id}
                person={member}
                isMutating={isMutating}
                onEdit={onEditPerson}
                onMove={onMovePerson}
                onDelete={onDeletePerson}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
