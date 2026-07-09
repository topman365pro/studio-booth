"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { clearDraft, createDraft, loadDraft, persistDraft } from "@/lib/draft";
import type { BoothDraft } from "@/lib/types";

interface BoothContextValue {
  draft: BoothDraft;
  hydrated: boolean;
  update: (value: Partial<BoothDraft> | ((draft: BoothDraft) => BoothDraft)) => void;
  reset: () => Promise<void>;
}

const BoothContext = createContext<BoothContextValue | null>(null);

export function BoothProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<BoothDraft>(() => ({
    version: 1,
    id: "loading",
    createdAt: 0,
    updatedAt: 0,
    captures: [],
    settings: {
      deviceId: "", mirrored: true, flash: true, ringLight: false,
      ringIntensity: 45, ringWarmth: 25, timer: 3, shotCount: 4
    },
    layoutId: "strip",
    frameId: "signal-red",
    filter: {
      preset: "clean", brightness: 0, contrast: 0,
      saturation: 0, temperature: 0, blur: 0, vignette: 0
    },
    stickers: [],
    title: "Untitled session"
  }));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    loadDraft()
      .then((saved) => setDraft(saved ?? createDraft()))
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated || draft.id === "loading") return;
    const timer = window.setTimeout(() => void persistDraft(draft), 150);
    return () => window.clearTimeout(timer);
  }, [draft, hydrated]);

  const update = useCallback((value: Partial<BoothDraft> | ((current: BoothDraft) => BoothDraft)) => {
    setDraft((current) => typeof value === "function"
      ? value(current)
      : { ...current, ...value, updatedAt: Date.now() });
  }, []);

  const reset = useCallback(async () => {
    await clearDraft();
    setDraft(createDraft());
  }, []);

  const value = useMemo(() => ({ draft, hydrated, update, reset }), [draft, hydrated, update, reset]);
  return <BoothContext.Provider value={value}>{children}</BoothContext.Provider>;
}

export function useBooth() {
  const context = useContext(BoothContext);
  if (!context) throw new Error("useBooth must be used inside BoothProvider");
  return context;
}
