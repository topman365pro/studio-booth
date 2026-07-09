import type { BoothDraft, CaptureSettings, FilterSettings } from "@/lib/types";

const DB_NAME = "studio-booth";
const STORE_NAME = "drafts";
const ACTIVE_KEY = "active";
export const DRAFT_TTL = 24 * 60 * 60 * 1000;

export const defaultCaptureSettings: CaptureSettings = {
  deviceId: "",
  mirrored: true,
  flash: true,
  ringLight: false,
  ringIntensity: 45,
  ringWarmth: 25,
  timer: 3,
  shotCount: 4
};

export const defaultFilter: FilterSettings = {
  preset: "clean",
  brightness: 0,
  contrast: 0,
  saturation: 0,
  temperature: 0,
  blur: 0,
  vignette: 0
};

export function createDraft(): BoothDraft {
  const now = Date.now();
  return {
    version: 1,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    captures: [],
    settings: defaultCaptureSettings,
    layoutId: "strip",
    frameId: "signal-red",
    filter: defaultFilter,
    stickers: [],
    title: `Session ${new Date(now).toLocaleDateString()}`
  };
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadDraft(): Promise<BoothDraft | null> {
  if (typeof indexedDB === "undefined") return null;
  const db = await openDb();
  const value = await new Promise<BoothDraft | undefined>((resolve, reject) => {
    const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).get(ACTIVE_KEY);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  db.close();
  if (!value) return null;
  if (Date.now() - value.updatedAt > DRAFT_TTL) {
    await clearDraft();
    return null;
  }
  return value;
}

export async function persistDraft(draft: BoothDraft) {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readwrite")
      .objectStore(STORE_NAME)
      .put({ ...draft, updatedAt: Date.now() }, ACTIVE_KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  db.close();
}

export async function clearDraft() {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).delete(ACTIVE_KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  db.close();
}

export function filterCss(filter: FilterSettings) {
  const presets = {
    clean: "",
    mono: "grayscale(1)",
    warm: "sepia(.28) saturate(1.18)",
    cool: "sepia(.12) hue-rotate(155deg) saturate(1.1)",
    punch: "contrast(1.18) saturate(1.2)"
  };
  const temperature = filter.temperature > 0
    ? `sepia(${filter.temperature / 250}) saturate(${1 + filter.temperature / 150})`
    : `hue-rotate(${filter.temperature / 2}deg)`;
  return [
    presets[filter.preset],
    `brightness(${1 + filter.brightness / 100})`,
    `contrast(${1 + filter.contrast / 100})`,
    `saturate(${1 + filter.saturation / 100})`,
    temperature,
    `blur(${filter.blur}px)`
  ].join(" ");
}
