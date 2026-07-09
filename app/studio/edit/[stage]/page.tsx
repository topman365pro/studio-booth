import { notFound } from "next/navigation";
import { EditorStudio } from "@/components/editor-studio";
import { StudioHeader } from "@/components/studio-header";
import type { EditorStage } from "@/lib/types";

const stages: EditorStage[] = ["layout", "filter", "stickers", "animate", "export"];

export default async function EditorPage({ params }: { params: Promise<{ stage: string }> }) {
  const { stage } = await params;
  if (!stages.includes(stage as EditorStage)) notFound();
  return <><StudioHeader /><EditorStudio stage={stage as EditorStage} /></>;
}
