import axios from "axios";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiBaseUrl) {
  throw new Error("NEXT_PUBLIC_API_URL must be configured.");
}

const apiClient = axios.create({
  baseURL: apiBaseUrl.replace(/\/+$/, ""),
  headers: {
    "Content-Type": "application/json",
  },
});

export interface Tree {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface TreeSummary extends Tree {
  memberCount: number;
}

export interface Person {
  id: string;
  treeId: string;
  fullName: string;
  spouseName: string | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTreeInput {
  name: string;
}

export interface CreatePersonInput {
  treeId: string;
  fullName: string;
  spouseName?: string;
  parentId?: string;
}

export interface UpdatePersonInput {
  fullName: string;
  spouseName?: string | null;
}

export interface CreateChildInput {
  fullName: string;
  spouseName?: string;
}

export interface CreatePersonsBatchInput {
  treeId: string;
  parentId: string;
  children: CreateChildInput[];
}

export interface CreatePersonsBatchResponse {
  parentId: string;
  children: Person[];
}

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

export async function createTree(input: CreateTreeInput): Promise<Tree> {
  const response = await apiClient.post<Tree>("/trees", input);
  return response.data;
}

export async function getTrees(): Promise<TreeSummary[]> {
  const response = await apiClient.get<TreeSummary[]>("/trees");
  return response.data;
}

export async function getTree(treeId: string): Promise<Tree> {
  const response = await apiClient.get<Tree>(
    `/trees/${encodeURIComponent(treeId)}`,
  );
  return response.data;
}

export async function updateTree(treeId: string, name: string): Promise<Tree> {
  const response = await apiClient.patch<Tree>(
    `/trees/${encodeURIComponent(treeId)}`,
    { name },
  );
  return response.data;
}

export async function deleteTree(treeId: string): Promise<{ message: string }> {
  const response = await apiClient.delete<{ message: string }>(
    `/trees/${encodeURIComponent(treeId)}`,
  );
  return response.data;
}

export async function createPerson(input: CreatePersonInput): Promise<Person> {
  const response = await apiClient.post<Person>("/persons", input);
  return response.data;
}

export async function updatePerson(
  personId: string,
  input: UpdatePersonInput,
): Promise<Person> {
  const response = await apiClient.patch<Person>(
    `/persons/${encodeURIComponent(personId)}`,
    input,
  );
  return response.data;
}

export async function deletePerson(personId: string): Promise<void> {
  await apiClient.delete(`/persons/${encodeURIComponent(personId)}`);
}

export async function updatePersonParent(
  personId: string,
  parentId: string | null,
): Promise<Person> {
  const response = await apiClient.patch<Person>(
    `/persons/${encodeURIComponent(personId)}/parent`,
    { parentId },
  );
  return response.data;
}

export async function createPersonsBatch(
  input: CreatePersonsBatchInput,
): Promise<CreatePersonsBatchResponse> {
  const response = await apiClient.post<CreatePersonsBatchResponse>(
    "/persons/batch",
    input,
  );
  return response.data;
}

export async function getTreeHierarchy(
  treeId: string,
): Promise<TreeHierarchyResponse> {
  const response = await apiClient.get<TreeHierarchyResponse>(
    `/trees/${encodeURIComponent(treeId)}/hierarchy`,
  );
  return response.data;
}

export function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (axios.isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(" ");
    }

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallbackMessage;
}
