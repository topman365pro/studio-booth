import { describe, expect, it } from "vitest";
import { mapFrameRow, mapStickerRow } from "@/lib/catalog";

describe("catalog row mapping", () => {
  it("maps database frame metadata into the editor contract", () => {
    const frame = mapFrameRow({
      id: "frame-1", owner_id: null, visibility: "curated", title: "Paper",
      category: "Editorial", background: "#fff", foreground: "#111",
      canvas_width: 800, canvas_height: 2400, shot_count: 4,
      slots: [], overlay_path: "catalog/frame-1/asset.png",
      mime_type: "image/png", published: true, sort_order: 10, print_compatible: true
    }, "https://example.com/frame.png");
    expect(frame.source).toBe("supabase");
    expect(frame.overlayUrl).toBe("https://example.com/frame.png");
    expect(frame.printCompatible).toBe(true);
  });

  it("maps sticker dimensions and ownership", () => {
    const sticker = mapStickerRow({
      id: "sticker-1", owner_id: "user-1", visibility: "private",
      title: "Flower", category: "Botanical", storage_path: "user-1/sticker.png",
      mime_type: "image/png", width: 500, height: 400, published: false, sort_order: 20
    }, "https://example.com/sticker.png");
    expect(sticker.ownerId).toBe("user-1");
    expect(sticker.width).toBe(500);
  });
});
