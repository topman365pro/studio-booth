import type { StickerAsset } from "@/lib/types";

export const fallbackTextStickers = [
  { glyph: "✦", category: "Marks" },
  { glyph: "♥", category: "Love" },
  { glyph: "☻", category: "Faces" },
  { glyph: "★", category: "Marks" },
  { glyph: "WOW!", category: "Words" },
  { glyph: "XOXO", category: "Words" },
  { glyph: "☺", category: "Faces" },
  { glyph: "☁", category: "Shapes" },
  { glyph: "☼", category: "Shapes" },
  { glyph: "✿", category: "Flowers" },
  { glyph: "✺", category: "Marks" },
  { glyph: "GOOD!", category: "Words" }
] as const;

export const fallbackImageStickers: StickerAsset[] = [];
