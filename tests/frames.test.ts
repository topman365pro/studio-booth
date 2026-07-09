import { describe, expect, it } from "vitest";
import { curatedFrames, layoutFor, layouts } from "@/lib/frames";

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
});
