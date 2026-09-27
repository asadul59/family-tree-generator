import { TreeHierarchyPerson } from "@/lib/api";

export interface TreeStatistics {
  peopleCount: number;
  generationCount: number;
  rootCount: number;
}

export function calculateTreeStatistics(
  members: TreeHierarchyPerson[],
): TreeStatistics {
  let peopleCount = 0;
  let generationCount = 0;
  const visited = new Set<string>();

  function visit(person: TreeHierarchyPerson, generation: number) {
    if (visited.has(person.id)) {
      return;
    }

    visited.add(person.id);
    peopleCount += 1;
    generationCount = Math.max(generationCount, generation);

    for (const child of person.children) {
      visit(child, generation + 1);
    }
  }

  for (const member of members) {
    visit(member, 1);
  }

  return {
    peopleCount,
    generationCount,
    rootCount: members.length,
  };
}

interface TreeStatsProps {
  stats: TreeStatistics;
}

export function TreeStats({ stats }: TreeStatsProps) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Family tree statistics">
      <span className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
        People: <strong className="text-slate-900">{stats.peopleCount}</strong>
      </span>
      <span className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
        Generations:{" "}
        <strong className="text-slate-900">{stats.generationCount}</strong>
      </span>
      <span className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
        Roots: <strong className="text-slate-900">{stats.rootCount}</strong>
      </span>
    </div>
  );
}
