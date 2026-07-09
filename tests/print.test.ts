import { describe, expect, it } from "vitest";
import { A4_HEIGHT_PX, A4_WIDTH_PX, calculateA4Geometry } from "@/lib/render";

describe("A4 print geometry", () => {
  it("uses exact 300-DPI portrait A4 dimensions", () => {
    expect(A4_WIDTH_PX).toBe(2480);
    expect(A4_HEIGHT_PX).toBe(3508);
  });

  it("rotates a 1:3 strip to the short edge and fits four top-stacked copies", () => {
    const geometry = calculateA4Geometry(800, 2400);
    expect(geometry.scale).toBeCloseTo(2480 / 2400);
    expect(geometry.copyHeight).toBe(827);
    expect(geometry.maxCopies).toBe(4);
    expect(A4_HEIGHT_PX - geometry.copyHeight * 4).toBe(200);
  });

  it("rejects invalid dimensions", () => {
    expect(() => calculateA4Geometry(0, 2400)).toThrow();
  });
});
