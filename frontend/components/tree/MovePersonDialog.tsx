"use client";

import { FormEvent, useMemo, useState } from "react";
import axios from "axios";
import { ArrowRightLeft, Loader2, X } from "lucide-react";
import {
  TreeHierarchyPerson,
  TreeHierarchyResponse,
  updatePersonParent,
} from "@/lib/api";

interface MovePersonDialogProps {
  hierarchy: TreeHierarchyResponse;
  person: TreeHierarchyPerson;
  onClose: () => void;
  onMoved: () => Promise<void> | void;
}

const ROOT_PARENT_VALUE = "__root__";

function flattenPeople(members: TreeHierarchyPerson[]): TreeHierarchyPerson[] {
  const people: TreeHierarchyPerson[] = [];
  const visited = new Set<string>();

  function visit(person: TreeHierarchyPerson) {
    if (visited.has(person.id)) {
      return;
    }

    visited.add(person.id);
    people.push(person);

    for (const child of person.children) {
      visit(child);
    }
  }

  for (const member of members) {
    visit(member);
  }

  return people;
}

function collectDescendantIds(person: TreeHierarchyPerson): Set<string> {
  const descendants = new Set<string>();
  const visited = new Set<string>();

  function visit(currentPerson: TreeHierarchyPerson) {
    for (const child of currentPerson.children) {
      if (visited.has(child.id)) {
        continue;
      }

      visited.add(child.id);
      descendants.add(child.id);
      visit(child);
    }
  }

  visit(person);
  return descendants;
}

function getMoveErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 404) {
      return "The selected parent no longer exists. Please refresh the tree.";
    }

    if (error.response?.status === 400) {
      return "This move would create an invalid family hierarchy.";
    }
  }

  return "Unable to move this person. Please try again.";
}

export function MovePersonDialog({
  hierarchy,
  person,
  onClose,
  onMoved,
}: MovePersonDialogProps) {
  const people = useMemo(
    () => flattenPeople(hierarchy.members),
    [hierarchy.members],
  );
  const descendantIds = useMemo(() => collectDescendantIds(person), [person]);
  const validParents = people.filter(
    (candidate) =>
      candidate.id !== person.id && !descendantIds.has(candidate.id),
  );
  const currentParent = people.find(
    (candidate) => candidate.id === person.parentId,
  );
  const [selectedParentId, setSelectedParentId] = useState(
    person.parentId ?? ROOT_PARENT_VALUE,
  );
  const [isMoving, setIsMoving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedParent = validParents.find(
    (candidate) => candidate.id === selectedParentId,
  );
  const selectedParentLabel =
    selectedParentId === ROOT_PARENT_VALUE
      ? "No Parent — Make Root"
      : (selectedParent?.fullName ?? "No Parent — Make Root");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsMoving(true);
    setErrorMessage(null);

    try {
      await updatePersonParent(
        person.id,
        selectedParentId === ROOT_PARENT_VALUE ? null : selectedParentId,
      );
      await onMoved();
      onClose();
    } catch (error) {
      setErrorMessage(getMoveErrorMessage(error));
    } finally {
      setIsMoving(false);
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
        aria-labelledby="move-person-title"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-violet-700">
              <ArrowRightLeft size={15} aria-hidden="true" />
              Move person
            </p>
            <h2
              id="move-person-title"
              className="mt-1 text-xl font-bold text-slate-900"
            >
              Move {person.fullName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isMoving}
            aria-label="Close move dialog"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="mb-5 space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
          <p className="text-slate-600">
            Current parent:{" "}
            <strong className="text-slate-900">
              {currentParent?.fullName ?? "No Parent — Root"}
            </strong>
          </p>
          <p className="text-slate-600">
            New parent:{" "}
            <strong className="text-slate-900">{selectedParentLabel}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="move-parent-select"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              New parent
            </label>
            <select
              id="move-parent-select"
              value={selectedParentId}
              onChange={(event) => setSelectedParentId(event.target.value)}
              disabled={isMoving}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value={ROOT_PARENT_VALUE}>No Parent — Make Root</option>
              {validParents.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.fullName}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">
              The person and their descendants cannot be selected as a parent.
            </p>
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
              disabled={isMoving}
              className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isMoving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isMoving ? <Loader2 className="animate-spin" size={17} /> : null}
              {isMoving ? "Moving..." : "Move Person"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
