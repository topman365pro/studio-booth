"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { curatedFrames } from "@/lib/frames";
import { fallbackImageStickers } from "@/lib/stickers";
import { createClient } from "@/lib/supabase/client";
import { mapFrameRow, mapStickerRow, type FrameRow, type StickerRow } from "@/lib/catalog";
import type { FrameTemplate, StickerAsset } from "@/lib/types";

interface CatalogValue {
  frames: FrameTemplate[];
  stickers: StickerAsset[];
  loading: boolean;
  refresh: () => Promise<void>;
  frameById: (id: string) => FrameTemplate;
}

const CatalogContext = createContext<CatalogValue | null>(null);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [frames, setFrames] = useState<FrameTemplate[]>(curatedFrames);
  const [stickers, setStickers] = useState<StickerAsset[]>(fallbackImageStickers);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return;
    setLoading(true);
    try {
      const [{ data: frameRows }, { data: stickerRows }] = await Promise.all([
        supabase.from("frame_templates").select("*").order("sort_order"),
        supabase.from("stickers").select("*").order("sort_order")
      ]);
      const resolvedFrames = await Promise.all(((frameRows ?? []) as FrameRow[]).map(async row => {
        if (!row.overlay_path) return mapFrameRow(row);
        const bucket = row.visibility === "curated" ? "curated-frames" : "private-frames";
        if (row.visibility === "curated") {
          return mapFrameRow(row, supabase.storage.from(bucket).getPublicUrl(row.overlay_path).data.publicUrl);
        }
        const { data } = await supabase.storage.from(bucket).createSignedUrl(row.overlay_path, 3600);
        return mapFrameRow(row, data?.signedUrl);
      }));
      const resolvedStickers = await Promise.all(((stickerRows ?? []) as StickerRow[]).map(async row => {
        const bucket = row.visibility === "curated" ? "curated-stickers" : "private-stickers";
        if (row.visibility === "curated") {
          return mapStickerRow(row, supabase.storage.from(bucket).getPublicUrl(row.storage_path).data.publicUrl);
        }
        const { data } = await supabase.storage.from(bucket).createSignedUrl(row.storage_path, 3600);
        return mapStickerRow(row, data?.signedUrl ?? "");
      }));
      setFrames([
        ...curatedFrames,
        ...resolvedFrames.filter(frame => !curatedFrames.some(fallback => fallback.id === frame.id))
      ].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
      setStickers(resolvedStickers.filter(sticker => sticker.src));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const value = useMemo<CatalogValue>(() => ({
    frames,
    stickers,
    loading,
    refresh,
    frameById: (id) => frames.find(frame => frame.id === id) ?? curatedFrames[0]
  }), [frames, stickers, loading, refresh]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) throw new Error("useCatalog must be used inside CatalogProvider");
  return context;
}
