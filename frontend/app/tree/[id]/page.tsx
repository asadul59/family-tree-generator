import { TreeView } from "@/components/tree/TreeView";

interface TreePageProps {
  params: Promise<{ id: string }>;
}

export default async function TreePage({ params }: TreePageProps) {
  const { id } = await params;

  return <TreeView key={id} treeId={id} />;
}
