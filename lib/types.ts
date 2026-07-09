export type EditorStage = "layout" | "filter" | "stickers" | "animate" | "export";
export type LayoutId = "strip" | "square" | "postcard" | "collage";
export type ExportKind = "png" | "jpeg" | "gif" | "webm";

export interface CaptureSettings {
  deviceId: string;
  mirrored: boolean;
  flash: boolean;
  ringLight: boolean;
  ringIntensity: number;
  ringWarmth: number;
  timer: number;
  shotCount: number;
}

export interface FilterSettings {
  preset: "clean" | "mono" | "warm" | "cool" | "punch";
  brightness: number;
  contrast: number;
  saturation: number;
  temperature: number;
  blur: number;
  vignette: number;
}

interface StickerPlacement {
  id: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  layer: number;
}

export interface TextStickerItem extends StickerPlacement {
  kind?: "text";
  glyph: string;
  color: string;
}

export interface ImageStickerItem extends StickerPlacement {
  kind: "image";
  assetId: string;
  src: string;
  width: number;
  height: number;
}

export type StickerItem = TextStickerItem | ImageStickerItem;

export interface FrameSlot {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface FrameTemplate {
  id: string;
  title: string;
  category: string;
  background: string;
  foreground: string;
  width: number;
  height: number;
  shotCount: number;
  slots: FrameSlot[];
  ownerId?: string;
  overlayUrl?: string;
  overlayPath?: string;
  visibility: "curated" | "private";
  published?: boolean;
  sortOrder?: number;
  mimeType?: "image/png" | "image/webp";
  source?: "bundle" | "supabase";
  printCompatible?: boolean;
}

export interface StickerAsset {
  id: string;
  ownerId?: string;
  title: string;
  category: string;
  src: string;
  storagePath?: string;
  mimeType: "image/png" | "image/webp";
  width: number;
  height: number;
  visibility: "curated" | "private";
  published: boolean;
  sortOrder: number;
  source: "bundle" | "supabase";
}

export type ProfileRole = "member" | "admin";

export type A4MarginMode = "with-margin" | "no-margin";

export interface PrintSheetResult {
  canvas: HTMLCanvasElement;
  copies: number;
  copyHeight: number;
  maxCopies: number;
  usedHeight: number;
  unusedHeight: number;
}

export interface BoothDraft {
  version: 1;
  id: string;
  createdAt: number;
  updatedAt: number;
  captures: string[];
  settings: CaptureSettings;
  layoutId: LayoutId;
  frameId: string;
  filter: FilterSettings;
  stickers: StickerItem[];
  title: string;
}

export interface SavedExport {
  id: string;
  session_id: string;
  format: ExportKind;
  storage_path: string;
  width: number;
  height: number;
  byte_size: number;
  duration_ms?: number | null;
  signed_url?: string;
}

export interface SavedSession {
  id: string;
  title: string;
  created_at: string;
  frame_template_id?: string | null;
  exports?: SavedExport[];
}
