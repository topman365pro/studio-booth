"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { useBooth } from "@/components/booth-provider";
import { useCatalog } from "@/components/catalog-provider";

export function FrameLibrary() {
  const router = useRouter();
  const { update } = useBooth();
  const { frames } = useCatalog();
  const categories = [...new Set(frames.map(frame => frame.category))];

  const useFrame = (id: string) => {
    const frame = frames.find(item => item.id === id)!;
    const layoutId = frame.width === 800 ? "strip" : frame.width === frame.height ? "square" : frame.height > frame.width ? "collage" : "postcard";
    update({ frameId: id, layoutId });
    router.push("/studio/capture");
  };

  return (
    <>
      <SiteHeader />
      <main className="library-page">
        <section className="library-hero">
          <p className="kicker">CURATED / ORIGINAL / READY</p>
          <h1>Find your<br />frame.</h1>
          <p>Start with one of our house designs or build a private template for your own events.</p>
          <div className="category-list">{categories.map(category => <span key={category}>{category}</span>)}</div>
        </section>
        <section className="library-grid">
          {frames.map((frame, index) => (
            <article key={frame.id} className="library-item">
              <div className="library-art" style={{ background: frame.background, color: frame.foreground }}>
                {frame.overlayUrl && <img src={frame.overlayUrl} alt="" className="library-overlay" />}
                <span>0{index + 1}</span><h2>{frame.title}</h2>
                <div className="mini-slots">{frame.slots.slice(0, 4).map((_, slot) => <i key={slot} />)}</div>
              </div>
              <div><p>{frame.category} · {frame.shotCount} shots</p><button onClick={() => useFrame(frame.id)}>Use this frame <ArrowRight size={14} /></button></div>
            </article>
          ))}
          <Link href="/frames/new" className="create-frame-tile"><Plus size={42} /><h2>Create your own</h2><p>Private to your account.</p></Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
