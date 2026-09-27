"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CircleAlert, Loader2, RefreshCcw } from "lucide-react";
import {
  getApiErrorMessage,
  getTreeHierarchy,
  TreeHierarchyPerson,
  TreeHierarchyResponse,
} from "@/lib/api";
import { DeletePersonDialog } from "./DeletePersonDialog";
import { EditPersonDialog } from "./EditPersonDialog";
import { FamilyTree } from "./FamilyTree";
import { MovePersonDialog } from "./MovePersonDialog";
import { calculateTreeStatistics, TreeStats } from "./TreeStats";

interface TreeViewProps {
  treeId: string;
}

async function fetchHierarchy(treeId: string): Promise<TreeHierarchyResponse> {
  const response = await getTreeHierarchy(treeId);

  if (!response || !Array.isArray(response.members)) {
    throw new Error("Invalid hierarchy response.");
  }

  return response;
}

export function TreeView({ treeId }: TreeViewProps) {
  const [hierarchy, setHierarchy] = useState<TreeHierarchyResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [editingPerson, setEditingPerson] =
    useState<TreeHierarchyPerson | null>(null);
  const [movingPerson, setMovingPerson] = useState<TreeHierarchyPerson | null>(
    null,
  );
  const [deletingPerson, setDeletingPerson] =
    useState<TreeHierarchyPerson | null>(null);
  const statistics = hierarchy
    ? calculateTreeStatistics(hierarchy.members)
    : null;
  const isMutating =
    editingPerson !== null || movingPerson !== null || deletingPerson !== null;

  useEffect(() => {
    let cancelled = false;

    fetchHierarchy(treeId)
      .then((response) => {
        if (cancelled) {
          return;
        }

        setHierarchy(response);
        setErrorMessage(null);
        setIsNotFound(false);
        setIsLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setHierarchy(null);
        setIsNotFound(
          axios.isAxiosError(error) && error.response?.status === 404,
        );
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to load this family tree. Please try again.",
          ),
        );
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [treeId]);

  async function handleRetry() {
    setIsLoading(true);
    setErrorMessage(null);
    setIsNotFound(false);

    try {
      setHierarchy(await fetchHierarchy(treeId));
    } catch (error) {
      setHierarchy(null);
      setIsNotFound(
        axios.isAxiosError(error) && error.response?.status === 404,
      );
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to load this family tree. Please try again.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshHierarchy() {
    try {
      const response = await fetchHierarchy(treeId);
      setHierarchy(response);
      setErrorMessage(null);
      setIsNotFound(false);
    } catch (error) {
      setIsNotFound(
        axios.isAxiosError(error) && error.response?.status === 404,
      );
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to load this family tree. Please try again.",
        ),
      );
    }
  }

  function openEditDialog(person: TreeHierarchyPerson) {
    setErrorMessage(null);
    setEditingPerson(person);
  }

  function openMoveDialog(person: TreeHierarchyPerson) {
    setErrorMessage(null);
    setMovingPerson(person);
  }

  function openDeleteDialog(person: TreeHierarchyPerson) {
    setErrorMessage(null);
    setDeletingPerson(person);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:py-12">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Family Tree
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {hierarchy?.name ?? "Loading family tree..."}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/trees"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Family Trees
            </Link>
            <Link
              href="/wizard"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Back to Wizard
            </Link>
          </div>
        </header>

        {statistics ? (
          <div className="mb-6">
            <TreeStats stats={statistics} />
          </div>
        ) : null}

        {isLoading ? (
          <section className="flex min-h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
            <div className="text-center">
              <Loader2
                className="mx-auto animate-spin text-emerald-600"
                size={32}
                aria-hidden="true"
              />
              <p className="mt-4 text-sm font-medium text-slate-600">
                Loading family tree...
              </p>
            </div>
          </section>
        ) : null}

        {!isLoading && errorMessage ? (
          isNotFound ? (
            <section className="rounded-2xl border border-amber-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <CircleAlert size={26} aria-hidden="true" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">
                Family tree not found.
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                This tree may have been deleted.
              </p>
              <Link
                href="/trees"
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-200"
              >
                View Family Trees
              </Link>
            </section>
          ) : (
            <section className="rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                <CircleAlert size={26} aria-hidden="true" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">
                Unable to load this family tree.
              </h2>
              <p className="mt-2 text-sm text-slate-600">Please try again.</p>
              <button
                type="button"
                onClick={handleRetry}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-200"
              >
                <RefreshCcw size={16} aria-hidden="true" />
                Try Again
              </button>
            </section>
          )
        ) : null}

        {!isLoading && !errorMessage && hierarchy ? (
          <FamilyTree
            hierarchy={hierarchy}
            isMutating={isMutating}
            onEditPerson={openEditDialog}
            onMovePerson={openMoveDialog}
            onDeletePerson={openDeleteDialog}
          />
        ) : null}

        {editingPerson ? (
          <EditPersonDialog
            key={editingPerson.id}
            person={editingPerson}
            onClose={() => setEditingPerson(null)}
            onSaved={refreshHierarchy}
          />
        ) : null}

        {movingPerson && hierarchy ? (
          <MovePersonDialog
            key={movingPerson.id}
            hierarchy={hierarchy}
            person={movingPerson}
            onClose={() => setMovingPerson(null)}
            onMoved={refreshHierarchy}
          />
        ) : null}

        {deletingPerson ? (
          <DeletePersonDialog
            key={deletingPerson.id}
            person={deletingPerson}
            onClose={() => setDeletingPerson(null)}
            onDeleted={refreshHierarchy}
          />
        ) : null}
      </div>
    </main>
  );
}
