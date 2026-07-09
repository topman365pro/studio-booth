import { describe, expect, it } from "vitest";
import { createDraft, defaultCaptureSettings, filterCss } from "@/lib/draft";

describe("booth drafts", () => {
  it("starts with private local capture defaults", () => {
    const draft = createDraft();
    expect(draft.captures).toEqual([]);
    expect(draft.settings).toEqual(defaultCaptureSettings);
    expect(draft.layoutId).toBe("strip");
  });

  it("creates a deterministic CSS filter chain", () => {
    const css = filterCss({
      preset: "mono", brightness: 10, contrast: 20,
      saturation: 0, temperature: 0, blur: 2, vignette: 0
    });
    expect(css).toContain("grayscale(1)");
    expect(css).toContain("brightness(1.1)");
    expect(css).toContain("contrast(1.2)");
    expect(css).toContain("blur(2px)");
  });
});
