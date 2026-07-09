import { describe, expect, it } from "vitest";
import {
  A4_COPY_GAP_PX,
  A4_HEIGHT_PX,
  A4_MARGIN_BOTTOM_PX,
  A4_MARGIN_TOP_PX,
  A4_MARGIN_X_PX,
  A4_WIDTH_PX,
  calculateA4Geometry
} from "@/lib/render";

describe("A4 print geometry", () => {
  it("uses exact 300-DPI portrait A4 dimensions", () => {
    expect(A4_WIDTH_PX).toBe(2480);
    expect(A4_HEIGHT_PX).toBe(3508);
  });

  it("rotates a 1:3 strip inside A4 margins", () => {
    const geometry = calculateA4Geometry(800, 2400, "with-margin");
    expect(geometry.scale).toBeCloseTo((A4_WIDTH_PX - A4_MARGIN_X_PX * 2) / 2400);
    expect(geometry.copyWidth).toBe(2240);
    expect(geometry.copyHeight).toBe(747);
    expect(geometry.marginX).toBe(A4_MARGIN_X_PX);
    expect(geometry.marginTop).toBe(A4_MARGIN_TOP_PX);
    expect(geometry.gap).toBe(A4_COPY_GAP_PX);
  });

  it("can still fit up to four margin-spaced copies when requested", () => {
    const geometry = calculateA4Geometry(800, 2400, "with-margin");
    expect(geometry.maxCopies).toBe(4);
    const usedHeight = geometry.copyHeight * 4 + A4_COPY_GAP_PX * 3;
    expect(A4_HEIGHT_PX - A4_MARGIN_TOP_PX - A4_MARGIN_BOTTOM_PX - usedHeight).toBe(160);
  });

  it("supports the no-margin full-width A4 export option", () => {
    const geometry = calculateA4Geometry(800, 2400, "no-margin");
    expect(geometry.scale).toBeCloseTo(A4_WIDTH_PX / 2400);
    expect(geometry.copyWidth).toBe(A4_WIDTH_PX);
    expect(geometry.copyHeight).toBe(827);
    expect(geometry.marginX).toBe(0);
    expect(geometry.marginTop).toBe(0);
    expect(geometry.gap).toBe(0);
    expect(geometry.maxCopies).toBe(4);
  });

  it("rejects invalid dimensions", () => {
    expect(() => calculateA4Geometry(0, 2400)).toThrow();
  });
});
