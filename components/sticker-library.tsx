"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { useBooth } from "@/components/booth-provider";
import { useCatalog } from "@/components/catalog-provider";
import { fallbackTextStickers } from "@/lib/stickers";
import type { StickerAsset, StickerItem } from "@/lib/types";

export function StickerLibrary() {
  const router = useRouter();
  const { draft, update } = useBooth();
  const { stickers } = useCatalog();
  const categories = [...new Set([
    ...stickers.map(sticker => sticker.category),
    ...fallbackTextStickers.map(sticker => sticker.category)
  ])];

  const destination = () => draft.captures.length ? "/studio/edit/stickers" : "/studio/capture";

  const addImageSticker = (asset: StickerAsset) => {
    const item: StickerItem = {
      kind: "image",
      id: crypto.randomUUID(),
      assetId: asset.id,
      src: asset.src,
      width: asset.width,
      height: asset.height,
      x: 0.5,
      y: 0.45,
      scale: 1,
      rotation: 0,
      layer: draft.stickers.length
    };
    update({ stickers: [...draft.stickers, item] });
    router.push(destination());
  };

  const addTextSticker = (glyph: string) => {
    const item: StickerItem = {
      id: crypto.randomUUID(),
      glyph,
      x: 0.5,
      y: 0.45,
      scale: 1,
      rotation: 0,
      color: "#ffffff",
      layer: draft.stickers.length
    };
    update({ stickers: [...draft.stickers, item] });
    router.push(destination());
  };

  return (
    <>
      <SiteHeader />
      <main className="library-page">
        <section className="library-hero">
          <p className="kicker">CURATED / PRIVATE / LAYERED</p>
          <h1>Pick your<br />stickers.</h1>
          <p>Browse house sticker artwork, add type marks, or upload reusable private PNG/WebP stickers for your own shoots.</p>
          <div className="category-list">{categories.map(category => <span key={category}>{category}</span>)}</div>
        </section>
        <section className="library-grid sticker-library-grid">
          {stickers.map((sticker, index) => (
            <article key={sticker.id} className="library-item sticker-library-item">
              <div className="library-art sticker-library-art">
                <span>0{index + 1}</span>
                <img src={sticker.src} alt="" />
                <h2>{sticker.title}</h2>
              </div>
              <div>
                <p>{sticker.category} · {sticker.visibility === "private" ? "Private" : "Curated"}</p>
                <button onClick={() => addImageSticker(sticker)}>Use sticker <ArrowRight size={14} /></button>
              </div>
            </article>
          ))}
          {fallbackTextStickers.map(({ glyph, category }, index) => (
            <article key={`${glyph}-${category}`} className="library-item sticker-library-item">
              <div className="library-art sticker-library-art text-sticker-art">
                <span>T{String(index + 1).padStart(2, "0")}</span>
                <b>{glyph}</b>
                <h2>{category}</h2>
              </div>
              <div>
                <p>{category} · Text mark</p>
                <button onClick={() => addTextSticker(glyph)}>Use sticker <ArrowRight size={14} /></button>
              </div>
            </article>
          ))}
          <Link href="/stickers/new" className="create-frame-tile"><Plus size={42} /><h2>Upload your own</h2><p>Private to your account.</p></Link>
          <Link href="/studio/edit/stickers" className="create-frame-tile"><Sparkles size={42} /><h2>Open editor</h2><p>Place, scale, rotate, and layer stickers.</p></Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
