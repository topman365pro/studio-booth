"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import type { EditorStage } from "@/lib/types";

const stages: { id: EditorStage; label: string }[] = [
  { id: "layout", label: "Layout" },
  { id: "filter", label: "Filter" },
  { id: "stickers", label: "Stickers" },
  { id: "animate", label: "Animate" },
  { id: "export", label: "Export" }
];

export function StudioHeader() {
  const pathname = usePathname();
  return (
    <header className="studio-header">
      <Logo href="/" />
      <nav aria-label="Editor steps">
        {stages.map((stage, index) => (
          <Link
            key={stage.id}
            href={`/studio/edit/${stage.id}`}
            className={pathname.endsWith(stage.id) ? "active" : ""}
          >
            <span>0{index + 1}</span>{stage.label}
          </Link>
        ))}
      </nav>
      <Link href="/" className="studio-exit">Exit</Link>
    </header>
  );
}
