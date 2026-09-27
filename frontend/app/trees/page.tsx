"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CircleAlert,
  FolderTree,
  Loader2,
  Plus,
  RefreshCcw,
} from "lucide-react";
import { getApiErrorMessage, getTrees, TreeSummary } from "@/lib/api";
import { DeleteTreeDialog } from "@/components/trees/DeleteTreeDialog";
import { RenameTreeDialog } from "@/components/trees/RenameTreeDialog";
import { TreeCard } from "@/components/trees/TreeCard";

export default function TreesPage() {
  const [trees, setTrees] = useState<TreeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [renamingTree, setRenamingTree] = useState<TreeSummary | null>(null);
  const [deletingTree, setDeletingTree] = useState<TreeSummary | null>(null);

  useEffect(() => {
    let cancelled = false;

    getTrees()
      .then((response) => {
        if (cancelled) {
          return;
        }

        if (!Array.isArray(response)) {
          throw new Error("Invalid tree list response.");
        }

        setTrees(response);
        setErrorMessage(null);
        setIsLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to load your family trees. Please try again.",
          ),
        );
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function retryLoad() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await getTrees();

      if (!Array.isArray(response)) {
        throw new Error("Invalid tree list response.");
      }

      setTrees(response);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to load your family trees. Please try again.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleRenamed(updatedTree: TreeSummary) {
    setTrees((currentTrees) =>
      currentTrees.map((tree) =>
        tree.id === updatedTree.id ? updatedTree : tree,
      ),
    );
  }

  function handleDeleted(treeId: string) {
    setTrees((currentTrees) =>
      currentTrees.filter((tree) => tree.id !== treeId),
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-700"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Home
            </Link>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
                <FolderTree size={22} aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Family Trees
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Manage your saved family trees.
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/wizard"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200"
          >
            <Plus size={18} aria-hidden="true" />
            Create New Family Tree
          </Link>
        </header>

        {isLoading ? (
          <section className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
            <div className="text-center">
              <Loader2
                className="mx-auto animate-spin text-emerald-600"
                size={32}
                aria-hidden="true"
              />
              <p className="mt-4 text-sm font-medium text-slate-600">
                Loading family trees...
              </p>
            </div>
          </section>
        ) : null}

        {!isLoading && errorMessage ? (
          <section className="rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <CircleAlert size={26} aria-hidden="true" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">
              Unable to load your family trees.
            </h2>
            <p className="mt-2 text-sm text-slate-600">Please try again.</p>
            <button
              type="button"
              onClick={() => void retryLoad()}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-200"
            >
              <RefreshCcw size={16} aria-hidden="true" />
              Try Again
            </button>
          </section>
        ) : null}

        {!isLoading && !errorMessage && trees.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <FolderTree size={26} aria-hidden="true" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">
              No family trees yet.
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Create your first family tree to get started.
            </p>
            <Link
              href="/wizard"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
            >
              Create Family Tree
            </Link>
          </section>
        ) : null}

        {!isLoading && !errorMessage && trees.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {trees.map((tree) => (
              <TreeCard
                key={tree.id}
                tree={tree}
                onRename={setRenamingTree}
                onDelete={setDeletingTree}
              />
            ))}
          </div>
        ) : null}

        {renamingTree ? (
          <RenameTreeDialog
            key={renamingTree.id}
            tree={renamingTree}
            onClose={() => setRenamingTree(null)}
            onSaved={handleRenamed}
          />
        ) : null}

        {deletingTree ? (
          <DeleteTreeDialog
            key={deletingTree.id}
            tree={deletingTree}
            onClose={() => setDeletingTree(null)}
            onDeleted={handleDeleted}
          />
        ) : null}
      </div>
    </main>
  );
}
