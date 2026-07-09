import type { FrameSlot, FrameTemplate, StickerAsset } from "@/lib/types";

export interface FrameRow {
  id: string;
  owner_id: string | null;
  visibility: "curated" | "private";
  title: string;
  category: string;
  background: string;
  foreground: string;
  canvas_width: number;
  canvas_height: number;
  shot_count: number;
  slots: FrameSlot[];
  overlay_path: string | null;
  mime_type: "image/png" | "image/webp" | null;
  published: boolean;
  sort_order: number;
  print_compatible: boolean;
}

export interface StickerRow {
  id: string;
  owner_id: string | null;
  visibility: "curated" | "private";
  title: string;
  category: string;
  storage_path: string;
  mime_type: "image/png" | "image/webp";
  width: number;
  height: number;
  published: boolean;
  sort_order: number;
}

export function mapFrameRow(row: FrameRow, overlayUrl?: string): FrameTemplate {
  return {
    id: row.id,
    ownerId: row.owner_id ?? undefined,
    visibility: row.visibility,
    title: row.title,
    category: row.category,
    background: row.background,
    foreground: row.foreground,
    width: row.canvas_width,
    height: row.canvas_height,
    shotCount: row.shot_count,
    slots: row.slots,
    overlayPath: row.overlay_path ?? undefined,
    overlayUrl,
    mimeType: row.mime_type ?? undefined,
    published: row.published,
    sortOrder: row.sort_order,
    printCompatible: row.print_compatible,
    source: "supabase"
  };
}

export function mapStickerRow(row: StickerRow, src: string): StickerAsset {
  return {
    id: row.id,
    ownerId: row.owner_id ?? undefined,
    visibility: row.visibility,
    title: row.title,
    category: row.category,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    width: row.width,
    height: row.height,
    published: row.published,
    sortOrder: row.sort_order,
    src,
    source: "supabase"
  };
}
