import type { FrameTemplate, LayoutId } from "@/lib/types";

export const layouts: Record<LayoutId, Omit<FrameTemplate, "id" | "title" | "category" | "background" | "foreground" | "visibility">> = {
  strip: {
    width: 800, height: 2400, shotCount: 4,
    slots: [
      { x: 56, y: 56, width: 688, height: 500 },
      { x: 56, y: 582, width: 688, height: 500 },
      { x: 56, y: 1108, width: 688, height: 500 },
      { x: 56, y: 1634, width: 688, height: 500 }
    ]
  },
  square: {
    width: 1600, height: 1600, shotCount: 4,
    slots: [
      { x: 70, y: 70, width: 715, height: 715 },
      { x: 815, y: 70, width: 715, height: 715 },
      { x: 70, y: 815, width: 715, height: 715 },
      { x: 815, y: 815, width: 715, height: 715 }
    ]
  },
  postcard: {
    width: 1800, height: 1200, shotCount: 3,
    slots: [
      { x: 60, y: 60, width: 1100, height: 1080 },
      { x: 1190, y: 60, width: 550, height: 525 },
      { x: 1190, y: 615, width: 550, height: 525 }
    ]
  },
  collage: {
    width: 1600, height: 2000, shotCount: 4,
    slots: [
      { x: 70, y: 80, width: 900, height: 740, rotation: -2 },
      { x: 880, y: 680, width: 650, height: 620, rotation: 3 },
      { x: 90, y: 1050, width: 710, height: 770, rotation: 2 },
      { x: 790, y: 110, width: 680, height: 620, rotation: 4 }
    ]
  }
};

export const curatedFrames: FrameTemplate[] = [
  {
    id: "signal-red", title: "Signal", category: "Editorial", background: "#ef3b2d",
    foreground: "#fff7eb", visibility: "curated", published: true, sortOrder: 10, source: "bundle", printCompatible: true, ...layouts.strip
  },
  {
    id: "soft-cream", title: "Sunday Club", category: "Minimal", background: "#ede1c7",
    foreground: "#151515", visibility: "curated", published: true, sortOrder: 20, source: "bundle", printCompatible: true, ...layouts.strip
  },
  {
    id: "blue-hour", title: "Blue Hour", category: "Night", background: "#244fd4",
    foreground: "#ffffff", visibility: "curated", published: true, sortOrder: 30, source: "bundle", printCompatible: false, ...layouts.square
  },
  {
    id: "acid-note", title: "Off Beat", category: "Graphic", background: "#d8ff43",
    foreground: "#0b0b0b", visibility: "curated", published: true, sortOrder: 40, source: "bundle", printCompatible: false, ...layouts.postcard
  },
  {
    id: "ink", title: "Contact Sheet", category: "Classic", background: "#0c0c0c",
    foreground: "#f0eee6", visibility: "curated", published: true, sortOrder: 50, source: "bundle", printCompatible: false, ...layouts.collage
  }
];

export function layoutFor(id: LayoutId) {
  return layouts[id] ?? layouts.strip;
}

export function frameFor(id: string) {
  return curatedFrames.find((frame) => frame.id === id) ?? curatedFrames[0];
}
