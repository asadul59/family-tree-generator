export interface TreeHierarchyPerson {
  id: string;
  fullName: string;
  spouseName: string | null;
  parentId: string | null;
  children: TreeHierarchyPerson[];
}

export interface TreeHierarchyResponse {
  id: string;
  name: string;
  members: TreeHierarchyPerson[];
  orphans: TreeHierarchyPerson[];
}
