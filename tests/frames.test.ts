import { describe, expect, it } from "vitest";
import { curatedFrames, layoutFor, layouts, printableFrameForLayout } from "@/lib/frames";
import type { FrameTemplate } from "@/lib/types";

describe("frame geometry", () => {
  it("keeps every slot inside its canvas", () => {
    Object.values(layouts).forEach((layout) => {
      layout.slots.forEach((slot) => {
        expect(slot.x).toBeGreaterThanOrEqual(0);
        expect(slot.y).toBeGreaterThanOrEqual(0);
        expect(slot.x + slot.width).toBeLessThanOrEqual(layout.width);
        expect(slot.y + slot.height).toBeLessThanOrEqual(layout.height);
      });
    });
  });

  it("provides a safe fallback layout and frame", () => {
    expect(layoutFor("unknown" as never)).toEqual(layouts.strip);
    expect(curatedFrames.length).toBeGreaterThanOrEqual(4);
  });

  it("preserves Supabase/private frame geometry instead of replacing it with bundled layouts", () => {
    const privateFrame: FrameTemplate = {
      id: "private-frame",
      title: "Private frame",
      category: "Custom",
      background: "#111111",
      foreground: "#ffffff",
      width: 800,
      height: 2400,
      shotCount: 1,
      slots: [{ x: 120, y: 240, width: 420, height: 760 }],
      visibility: "private",
      source: "supabase"
    };

    expect(printableFrameForLayout(privateFrame, "strip").slots).toEqual(privateFrame.slots);
  });
});
