"use client";

import { useEffect, useMemo, useRef } from "react";
import { useBooth } from "@/components/booth-provider";
import { printableFrameForLayout } from "@/lib/frames";
import { filterCss } from "@/lib/draft";
import { useCatalog } from "@/components/catalog-provider";

export function CompositionPreview({ animate = false }: { animate?: boolean }) {
  const { draft } = useBooth();
  const { frameById } = useCatalog();
  const containerRef = useRef<HTMLDivElement>(null);
  const baseFrame = frameById(draft.frameId);
  const frame = useMemo(() => printableFrameForLayout(baseFrame, draft.layoutId), [baseFrame, draft.layoutId]);

  useEffect(() => {
    if (!animate || !containerRef.current) return;
    const images = [...containerRef.current.querySelectorAll<HTMLElement>(".composition-photo")];
    let index = 0;
    const timer = window.setInterval(() => {
      images.forEach((image, imageIndex) => image.style.opacity = imageIndex === index ? "1" : ".18");
      index = (index + 1) % Math.max(1, images.length);
    }, 500);
    return () => window.clearInterval(timer);
  }, [animate, draft.captures.length]);

  return (
    <div
      ref={containerRef}
      className={`composition ${animate ? "animating" : ""}`}
      style={{
        aspectRatio: `${frame.width}/${frame.height}`,
        background: frame.background,
        color: frame.foreground
      }}
    >
      {frame.slots.map((slot, index) => {
        const capture = draft.captures[index % Math.max(1, draft.captures.length)];
        return (
          <div
            key={`${index}-${capture?.slice(-12)}`}
            className="composition-photo"
            style={{
              left: `${slot.x / frame.width * 100}%`,
              top: `${slot.y / frame.height * 100}%`,
              width: `${slot.width / frame.width * 100}%`,
              height: `${slot.height / frame.height * 100}%`,
              transform: `rotate(${slot.rotation ?? 0}deg)`,
              filter: filterCss(draft.filter),
              backgroundImage: capture ? `url(${capture})` : undefined
            }}
          >{!capture && <span>NO PHOTO</span>}</div>
        );
      })}
      {frame.overlayUrl && <img className="composition-overlay" src={frame.overlayUrl} alt="" aria-hidden="true" />}
      {draft.filter.vignette > 0 && <div className="vignette" style={{ opacity: draft.filter.vignette / 100 }} />}
      {[...draft.stickers].sort((a, b) => (a.layer ?? 0) - (b.layer ?? 0)).map(sticker => (
        sticker.kind === "image" ? <img
          key={sticker.id}
          src={sticker.src}
          alt=""
          className="preview-sticker image"
          style={{
            left: `${sticker.x * 100}%`,
            top: `${sticker.y * 100}%`,
            transform: `translate(-50%,-50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`
          }}
        /> : <span
          key={sticker.id}
          className="preview-sticker"
          style={{
            left: `${sticker.x * 100}%`,
            top: `${sticker.y * 100}%`,
            transform: `translate(-50%,-50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
            color: sticker.color
          }}
        >{sticker.glyph}</span>
      ))}
      <b className="composition-brand">STUDIO BOOTH</b>
    </div>
  );
}
