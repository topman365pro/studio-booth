"use client";

import type { A4MarginMode, BoothDraft, FrameTemplate, PrintSheetResult } from "@/lib/types";
import { filterCss } from "@/lib/draft";

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function cropPhoto(src: string, width: number, height: number, cssFilter: string) {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const context = canvas.getContext("2d")!;
  context.filter = cssFilter;
  const scale = Math.max(canvas.width / image.width, canvas.height / image.height);
  const sourceWidth = canvas.width / scale;
  const sourceHeight = canvas.height / scale;
  context.drawImage(
    image,
    (image.width - sourceWidth) / 2,
    (image.height - sourceHeight) / 2,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );
  return canvas.toDataURL("image/jpeg", 0.95);
}

export async function renderDraftToCanvas(
  target: HTMLCanvasElement,
  draft: BoothDraft,
  frame: FrameTemplate,
  options: { interactive?: boolean } = {}
) {
  const fabric = await import("fabric");
  const CanvasClass = options.interactive ? fabric.Canvas : fabric.StaticCanvas;
  const canvas = new CanvasClass(target, {
    width: frame.width,
    height: frame.height,
    backgroundColor: frame.background,
    renderOnAddRemove: false,
    selection: Boolean(options.interactive)
  });

  for (let index = 0; index < frame.slots.length; index += 1) {
    const slot = frame.slots[index];
    const source = draft.captures[index % Math.max(1, draft.captures.length)];
    if (!source) {
      const empty = new fabric.Rect({
        left: slot.x, top: slot.y, width: slot.width, height: slot.height,
        fill: "rgba(255,255,255,.08)", stroke: "rgba(255,255,255,.25)", strokeDashArray: [18, 12]
      });
      canvas.add(empty);
      continue;
    }
    const cropped = await cropPhoto(source, slot.width, slot.height, filterCss(draft.filter));
    const photo = await fabric.FabricImage.fromURL(cropped);
    photo.set({
      left: slot.x,
      top: slot.y,
      angle: slot.rotation ?? 0,
      selectable: false,
      evented: false
    });
    canvas.add(photo);
  }

  if (frame.overlayUrl) {
    const overlay = await fabric.FabricImage.fromURL(frame.overlayUrl, { crossOrigin: "anonymous" });
    overlay.set({
      left: 0,
      top: 0,
      scaleX: frame.width / Math.max(1, overlay.width),
      scaleY: frame.height / Math.max(1, overlay.height),
      selectable: false,
      evented: false
    });
    canvas.add(overlay);
  }

  if (draft.filter.vignette > 0) {
    const vignette = new fabric.Rect({
      left: 0, top: 0, width: frame.width, height: frame.height,
      fill: "transparent",
      stroke: `rgba(0,0,0,${draft.filter.vignette / 100})`,
      strokeWidth: Math.min(frame.width, frame.height) * 0.15,
      selectable: false,
      evented: false
    });
    canvas.add(vignette);
  }

  for (const sticker of [...draft.stickers].sort((a, b) => (a.layer ?? 0) - (b.layer ?? 0))) {
    if (sticker.kind === "image") {
      const image = await fabric.FabricImage.fromURL(sticker.src, { crossOrigin: "anonymous" });
      const targetWidth = frame.width * 0.18 * sticker.scale;
      image.set({
        left: sticker.x * frame.width,
        top: sticker.y * frame.height,
        originX: "center",
        originY: "center",
        angle: sticker.rotation,
        scaleX: targetWidth / Math.max(1, image.width),
        scaleY: targetWidth / Math.max(1, image.width),
        selectable: Boolean(options.interactive)
      });
      canvas.add(image);
    } else {
      const text = new fabric.FabricText(sticker.glyph, {
        left: sticker.x * frame.width,
        top: sticker.y * frame.height,
        originX: "center",
        originY: "center",
        fontSize: Math.round(90 * sticker.scale),
        angle: sticker.rotation,
        fill: sticker.color,
        fontFamily: "Arial",
        selectable: Boolean(options.interactive)
      });
      canvas.add(text);
    }
  }

  const brandText = new fabric.FabricText("STUDIO BOOTH", {
    left: 54,
    top: frame.height - 100,
    fontSize: Math.max(24, frame.width * 0.035),
    fontWeight: "bold",
    fill: frame.foreground,
    fontFamily: "Arial",
    selectable: false,
    evented: false
  });
  canvas.add(brandText);
  canvas.renderAll();
  return canvas;
}

export async function canvasBlob(canvas: HTMLCanvasElement, type: "image/png" | "image/jpeg", quality = 0.95) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not encode image")), type, quality);
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const A4_WIDTH_PX = 2480;
export const A4_HEIGHT_PX = 3508;
export const A4_MARGIN_X_PX = 120;
export const A4_MARGIN_TOP_PX = 120;
export const A4_MARGIN_BOTTOM_PX = 120;
export const A4_COPY_GAP_PX = 40;

export function calculateA4Geometry(stripWidth: number, stripHeight: number, marginMode: A4MarginMode = "with-margin") {
  if (stripWidth <= 0 || stripHeight <= 0) throw new Error("Strip dimensions must be positive.");
  const marginX = marginMode === "with-margin" ? A4_MARGIN_X_PX : 0;
  const marginTop = marginMode === "with-margin" ? A4_MARGIN_TOP_PX : 0;
  const marginBottom = marginMode === "with-margin" ? A4_MARGIN_BOTTOM_PX : 0;
  const gap = marginMode === "with-margin" ? A4_COPY_GAP_PX : 0;
  const copyWidth = A4_WIDTH_PX - marginX * 2;
  const scale = copyWidth / stripHeight;
  const copyHeight = Math.round(stripWidth * scale);
  const availableHeight = A4_HEIGHT_PX - marginTop - marginBottom;
  const maxCopies = Math.max(0, Math.min(4, Math.floor((availableHeight + gap) / (copyHeight + gap))));
  return { scale, copyWidth, copyHeight, maxCopies, marginX, marginTop, gap, marginMode };
}

export function composeA4Sheet(stripCanvas: HTMLCanvasElement, requestedCopies: number, marginMode: A4MarginMode = "with-margin"): PrintSheetResult {
  const { scale, copyWidth, copyHeight, maxCopies, marginX, marginTop, gap } = calculateA4Geometry(stripCanvas.width, stripCanvas.height, marginMode);
  const copies = Math.max(1, Math.min(Math.floor(requestedCopies), maxCopies));
  if (maxCopies < 1) throw new Error("This strip is too wide to fit on an A4 print sheet.");
  const canvas = document.createElement("canvas");
  canvas.width = A4_WIDTH_PX;
  canvas.height = A4_HEIGHT_PX;
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let index = 0; index < copies; index += 1) {
    context.save();
    context.translate(marginX + copyWidth, marginTop + index * (copyHeight + gap));
    context.rotate(Math.PI / 2);
    context.scale(scale, scale);
    context.drawImage(stripCanvas, 0, 0);
    context.restore();
  }
  const usedHeight = copies * copyHeight + Math.max(0, copies - 1) * gap;
  return {
    canvas,
    copies,
    copyHeight,
    maxCopies,
    usedHeight,
    unusedHeight: A4_HEIGHT_PX - usedHeight
  };
}

export function printA4Canvas(canvas: HTMLCanvasElement) {
  const url = canvas.toDataURL("image/png");
  const printWindow = window.open("", "_blank");
  if (!printWindow) throw new Error("Allow pop-ups to open the print sheet.");
  printWindow.opener = null;
  printWindow.document.write(`<!doctype html><html><head><title>Studio Booth A4 Print</title><style>@page{size:A4 portrait;margin:0}*{box-sizing:border-box}html,body{margin:0;width:210mm;height:297mm;overflow:hidden}img{display:block;width:210mm;height:297mm}</style></head><body><img src="${url}" alt="A4 photo strip sheet" onload="window.print();window.onafterprint=()=>window.close()"></body></html>`);
  printWindow.document.close();
}

async function animationFrameCanvas(src: string, width = 720, height = 720) {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#090909";
  context.fillRect(0, 0, width, height);
  const scale = Math.max(width / image.width, height / image.height);
  const sw = width / scale;
  const sh = height / scale;
  context.drawImage(image, (image.width - sw) / 2, (image.height - sh) / 2, sw, sh, 0, 0, width, height);
  context.fillStyle = "#fff";
  context.font = "700 20px Arial";
  context.fillText("STUDIO BOOTH", 25, height - 25);
  return canvas;
}

export async function createGif(captures: string[], delay = 450) {
  if (!captures.length) throw new Error("No photos to animate");
  const { GIFEncoder, quantize, applyPalette } = await import("gifenc");
  const encoder = GIFEncoder();
  for (const source of captures) {
    const canvas = await animationFrameCanvas(source, 640, 640);
    const data = canvas.getContext("2d")!.getImageData(0, 0, 640, 640).data;
    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);
    encoder.writeFrame(index, 640, 640, { palette, delay });
  }
  encoder.finish();
  const bytes = encoder.bytes();
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Blob([buffer], { type: "image/gif" });
}

export async function createWebM(captures: string[], delay = 450) {
  if (!captures.length) throw new Error("No photos to animate");
  if (typeof MediaRecorder === "undefined" || !HTMLCanvasElement.prototype.captureStream) {
    throw new Error("WebM recording is not supported by this browser. GIF export is still available.");
  }
  if (!MediaRecorder.isTypeSupported("video/webm") && !MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
    throw new Error("This browser cannot encode WebM. Choose the animated GIF export instead.");
  }
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 720;
  const context = canvas.getContext("2d")!;
  const stream = canvas.captureStream(30);
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9" : "video/webm";
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5_000_000 });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
  const done = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
  });
  recorder.start();
  for (let loop = 0; loop < 2; loop += 1) {
    for (const source of captures) {
      const frame = await animationFrameCanvas(source);
      context.drawImage(frame, 0, 0);
      await new Promise(resolve => window.setTimeout(resolve, delay));
    }
  }
  recorder.stop();
  stream.getTracks().forEach((track) => track.stop());
  return done;
}
