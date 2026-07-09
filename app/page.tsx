import Link from "next/link";
import { ArrowRight, ArrowUpRight, Camera, Download, Layers3, Sparkles } from "lucide-react";
import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";
import { curatedFrames } from "@/lib/frames";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="lab-hero">
          <div className="lab-hero-copy">
            <p className="kicker">INDEPENDENT BROWSER PHOTO LAB / EST. 2026</p>
            <h1>Make it.<br /><em>Keep it.</em></h1>
            <p className="lab-hero-deck">A private camera, a hands-on print editor, and a finished strip ready for your screen—or your wall.</p>
            <div className="lab-hero-actions">
              <Link href="/guide" className="button button-lab">Open the booth <ArrowRight size={15} /></Link>
              <Link href="/frames" className="text-link">Browse frames</Link>
            </div>
            <div className="lab-proof"><span><i />Camera stays local</span><span>PNG · GIF · WEBM · A4</span></div>
          </div>
          <div className="lab-hero-visual" aria-label="A sample contact sheet">
            <div className="contact-sheet">
              <div className="contact-image contact-a"><span>01</span></div>
              <div className="contact-image contact-b"><span>02</span></div>
              <div className="contact-image contact-c"><span>03</span></div>
              <div className="contact-note">ROLL 01<br />GOOD LIGHT<br />JUL · 2026</div>
            </div>
            <p>CONTACT SHEET / UNCORRECTED</p>
          </div>
          <div className="lab-hero-foot"><span>NO APP REQUIRED</span><span>RAW FRAMES NEVER UPLOADED</span><span>SCROLL / 01—04</span></div>
        </section>

        <div className="ticker" aria-hidden="true">
          <div>LIVE CAMERA — FOUR SHOTS — FRAMES — FILTERS — STICKERS — GIF — WEBM — INSTANT DOWNLOAD — LIVE CAMERA — FOUR SHOTS — FRAMES — FILTERS — STICKERS — GIF — WEBM — INSTANT DOWNLOAD —</div>
        </div>

        <section className="home-about" id="about">
          <p className="section-number">01</p>
          <div>
            <p className="kicker">THE BOOTH IN YOUR TAB</p>
            <h2>Good photos.<br />Zero equipment.</h2>
            <p className="large-copy">Open the camera, find your light, and leave with a finished photo strip. Your raw shots never leave this browser.</p>
          </div>
          <div className="feature-lines">
            {[
              [Camera, "Live camera", "Pick a camera, mirror it, add a ring light, and set your own countdown."],
              [Layers3, "Real editor", "Choose a layout, tune the image, and place stickers directly on the result."],
              [Download, "Take it with you", "Export a high-resolution still, animated GIF, or smooth WebM."]
            ].map(([Icon, title, copy], index) => {
              const FeatureIcon = Icon as typeof Camera;
              return <article key={title as string}><FeatureIcon size={20} /><span>0{index + 1}</span><h3>{title as string}</h3><p>{copy as string}</p></article>;
            })}
          </div>
        </section>

        <section className="workflow-section">
          <div className="workflow-copy">
            <p className="kicker">ONE FLOW / MANY MOODS</p>
            <h2>Your face,<br /><em>your frame.</em></h2>
            <p>Capture once. Change the composition, color, character, and movement until it feels like yours.</p>
            <Link href="/guide" className="text-link">Open the camera <ArrowUpRight size={16} /></Link>
          </div>
          <div className="demo-strip">
            <div className="demo-photo demo-one"><span>01</span></div>
            <div className="demo-photo demo-two"><span>02</span></div>
            <div className="demo-photo demo-three"><span>03</span></div>
            <b>STUDIO BOOTH / KEEP THE MOMENT</b>
          </div>
        </section>

        <section className="frame-preview-section">
          <div className="section-heading">
            <p className="kicker">FRAME LIBRARY / 03</p>
            <h2>Pick a mood.</h2>
            <p>Minimal, loud, nostalgic, or strange. Start with a curated frame—or make your own.</p>
          </div>
          <div className="frame-rail">
            {curatedFrames.slice(0, 4).map((frame, index) => (
              <Link key={frame.id} href={`/frames?selected=${frame.id}`} className="frame-card">
                <div className={`frame-poster poster-${index}`} style={{ background: frame.background, color: frame.foreground }}>
                  <span>{frame.title}</span><Sparkles size={24} />
                </div>
                <p>0{index + 1} / {frame.category.toUpperCase()}</p>
              </Link>
            ))}
          </div>
          <Link href="/frames" className="button button-outline all-frames">View all frames</Link>
        </section>

        <section className="final-cta">
          <p className="kicker">LIGHTS ON?</p>
          <h2>Say cheese.</h2>
          <Link href="/guide" className="shutter-link small"><b>Start</b><span>It&apos;s free</span></Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
