"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Home, RefreshCcw, Users } from "lucide-react";
import {
  ChildInput,
  QueuePerson,
} from "@/components/wizard/types";
import { ChildrenStep } from "@/components/wizard/ChildrenStep";
import { FamilyNameStep } from "@/components/wizard/FamilyNameStep";
import { RootPersonStep } from "@/components/wizard/RootPersonStep";
import { WizardProgress } from "@/components/wizard/WizardProgress";
import {
  createPerson,
  createPersonsBatch,
  createTree,
  getApiErrorMessage,
} from "@/lib/api";

type WizardStep = "tree" | "root" | "children";

export default function WizardPage() {
  const [step, setStep] = useState<WizardStep>("tree");
  const [treeId, setTreeId] = useState<string | null>(null);
  const [treeName, setTreeName] = useState("");
  const [rootFullName, setRootFullName] = useState("");
  const [rootSpouseName, setRootSpouseName] = useState("");
  const [queue, setQueue] = useState<QueuePerson[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentPerson = queue[0] ?? null;
  const isComplete = treeId !== null && completedCount > 0 && queue.length === 0;
  const completedTreeId = treeId ?? "";

  async function handleCreateTree() {
    if (isLoading) {
      return;
    }

    const normalizedName = treeName.trim();

    if (!normalizedName) {
      setErrorMessage("Enter a name for your family tree.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const tree = await createTree({ name: normalizedName });
      setTreeId(tree.id);
      setStep("root");
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Something went wrong while creating the family tree. Please try again.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateRootPerson() {
    if (isLoading || !treeId) {
      return;
    }

    const normalizedFullName = rootFullName.trim();

    if (!normalizedFullName) {
      setErrorMessage("Enter the first person's full name.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const person = await createPerson({
        treeId,
        fullName: normalizedFullName,
        ...(rootSpouseName.trim() ? { spouseName: rootSpouseName.trim() } : {}),
      });

      setQueue([
        {
          id: person.id,
          name: person.fullName,
          generation: 0,
        },
      ]);
      setStep("children");
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Something went wrong while creating the first person. Please try again.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveChildren(children: ChildInput[]) {
    if (isLoading || !treeId || !currentPerson) {
      return;
    }

    const normalizedChildren = children
      .map((child) => ({
        fullName: child.fullName.trim(),
        spouseName: child.spouseName.trim(),
      }))
      .filter((child) => child.fullName.length > 0);

    if (normalizedChildren.length === 0) {
      setErrorMessage("Add at least one child, or choose No children.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await createPersonsBatch({
        treeId,
        parentId: currentPerson.id,
        children: normalizedChildren,
      });

      const newPeople = response.children.map((person) => ({
        id: person.id,
        name: person.fullName,
        generation: currentPerson.generation + 1,
      }));

      setQueue((currentQueue) => [
        ...currentQueue.slice(1),
        ...newPeople,
      ]);
      setCompletedCount((count) => count + 1);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Something went wrong while saving the children. Please try again.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleNoChildren() {
    if (isLoading || !currentPerson) {
      return;
    }

    setErrorMessage(null);
    setQueue((currentQueue) => currentQueue.slice(1));
    setCompletedCount((count) => count + 1);
  }

  function resetWizard() {
    setStep("tree");
    setTreeId(null);
    setTreeName("");
    setRootFullName("");
    setRootSpouseName("");
    setQueue([]);
    setCompletedCount(0);
    setIsLoading(false);
    setErrorMessage(null);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 transition hover:text-emerald-700"
          >
            <span className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
              <Users size={20} aria-hidden="true" />
            </span>
            Family Tree Generator
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-white hover:text-slate-900"
          >
            <Home size={16} aria-hidden="true" />
            Home
          </Link>
        </header>

        {isComplete ? (
          <section className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={34} aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Family Tree Complete!
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
              You have finished entering your family members. The visual tree
              view will be available in a later phase.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href={`/tree/${completedTreeId}`}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200"
              >
                View Family Tree
              </Link>
              <button
                type="button"
                onClick={resetWizard}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
              >
                <RefreshCcw size={16} aria-hidden="true" />
                Start another tree
              </button>
            </div>
          </section>
        ) : (
          <>
            {treeId && step !== "tree" && currentPerson ? (
              <WizardProgress
                currentPerson={currentPerson}
                completedCount={completedCount}
                remainingCount={queue.length}
              />
            ) : null}

            {step === "tree" ? (
              <FamilyNameStep
                value={treeName}
                errorMessage={errorMessage}
                isLoading={isLoading}
                onChange={setTreeName}
                onSubmit={handleCreateTree}
              />
            ) : null}

            {step === "root" ? (
              <RootPersonStep
                fullName={rootFullName}
                spouseName={rootSpouseName}
                errorMessage={errorMessage}
                isLoading={isLoading}
                onFullNameChange={setRootFullName}
                onSpouseNameChange={setRootSpouseName}
                onSubmit={handleCreateRootPerson}
              />
            ) : null}

            {step === "children" && currentPerson ? (
              <ChildrenStep
                key={currentPerson.id}
                person={currentPerson}
                errorMessage={errorMessage}
                isLoading={isLoading}
                onNoChildren={handleNoChildren}
                onSave={handleSaveChildren}
              />
            ) : null}
          </>
        )}

        <p className="mt-6 text-center text-xs text-slate-400">
          You can process each person in order and add children when ready.
        </p>
      </div>
    </main>
  );
}
