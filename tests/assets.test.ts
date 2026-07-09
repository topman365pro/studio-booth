import { describe, expect, it } from "vitest";
import { MAX_ASSET_BYTES, validateImageAsset } from "@/lib/assets";

describe("catalog image validation", () => {
  it("rejects unsupported formats before decoding", async () => {
    const file = new File(["not an image"], "asset.svg", { type: "image/svg+xml" });
    await expect(validateImageAsset(file)).rejects.toThrow("PNG or WebP");
  });

  it("rejects files above the 10 MB limit", async () => {
    const file = new File([new Uint8Array(MAX_ASSET_BYTES + 1)], "large.png", { type: "image/png" });
    await expect(validateImageAsset(file)).rejects.toThrow("10 MB");
  });
});
