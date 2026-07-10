import { afterEach, describe, expect, it, vi } from "vitest";
import { layouts } from "@/lib/frames";
import { renderDraftToCanvas } from "@/lib/render";
import type { BoothDraft, FrameTemplate } from "@/lib/types";

const fabricMock = vi.hoisted(() => {
  const imageSetCalls: Record<string, unknown>[] = [];

  class MockImageObject {
    width = 688;
    height = 500;

    set(options: Record<string, unknown>) {
      imageSetCalls.push(options);
      Object.assign(this, options);
      return this;
    }
  }

  class MockStaticCanvas {
    constructor(target: HTMLCanvasElement, options: { width: number; height: number }) {
      target.width = options.width;
      target.height = options.height;
    }

    add() {}
    renderAll() {}
    dispose() {}
  }

  class MockObject {
    constructor(options: Record<string, unknown>) {
      Object.assign(this, options);
    }
  }

  return {
    imageSetCalls,
    fromURL: vi.fn(async () => new MockImageObject()),
    StaticCanvas: MockStaticCanvas,
    Canvas: MockStaticCanvas,
    Rect: MockObject,
    FabricText: MockObject
  };
});

vi.mock("fabric", () => ({
  StaticCanvas: fabricMock.StaticCanvas,
  Canvas: fabricMock.Canvas,
  FabricImage: { fromURL: fabricMock.fromURL },
  Rect: fabricMock.Rect,
  FabricText: fabricMock.FabricText
}));

const draft: BoothDraft = {
  version: 1,
  id: "draft",
  createdAt: 0,
  updatedAt: 0,
  captures: ["data:image/jpeg;base64,photo"],
  settings: {
    deviceId: "",
    mirrored: true,
    flash: true,
    ringLight: false,
    ringIntensity: 50,
    ringWarmth: 50,
    timer: 3,
    shotCount: 4
  },
  layoutId: "strip",
  frameId: "acid-note",
  filter: {
    preset: "clean",
    brightness: 0,
    contrast: 0,
    saturation: 0,
    temperature: 0,
    blur: 0,
    vignette: 0
  },
  stickers: [],
  title: "Test strip"
};

const frame: FrameTemplate = {
  id: "acid-note",
  title: "Off Beat",
  category: "Graphic",
  background: "#d8ff43",
  foreground: "#0b0b0b",
  visibility: "curated",
  ...layouts.strip
};

describe("renderDraftToCanvas", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    fabricMock.imageSetCalls.length = 0;
    fabricMock.fromURL.mockClear();
  });

  it("anchors photo slot images by their top-left corner", async () => {
    class MockBrowserImage {
      width = 1600;
      height = 1200;
      onload: (() => void) | null = null;

      set src(_value: string) {
        window.setTimeout(() => this.onload?.(), 0);
      }
    }

    vi.stubGlobal("Image", MockBrowserImage);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      filter: ""
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/jpeg;base64,cropped");

    await renderDraftToCanvas(document.createElement("canvas"), draft, frame);

    expect(fabricMock.imageSetCalls[0]).toMatchObject({
      left: layouts.strip.slots[0].x,
      top: layouts.strip.slots[0].y,
      originX: "left",
      originY: "top"
    });
  });
});
