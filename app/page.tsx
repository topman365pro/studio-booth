import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Camera,
  Download,
  ShieldCheck,
  Sparkles,
  WandSparkles
} from "lucide-react";
import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";
import { curatedFrames } from "@/lib/frames";

const steps = [
  {
    number: "01",
    icon: Camera,
    title: "Step into the booth",
    copy: "Use the camera you already have. Set the timer, find your light, and take four shots without installing a thing."
  },
  {
    number: "02",
    icon: WandSparkles,
    title: "Make it feel like you",
    copy: "Choose a frame, tune the color, add stickers, and arrange every detail in a hands-on editor."
  },
  {
    number: "03",
    icon: Download,
    title: "Keep the good part",
    copy: "Save a crisp photo strip, an animated GIF, or a print-ready A4 sheet—straight to your device."
  }
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="landing">
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow"><span /> Your private photobooth, right in the browser</p>
            <h1>Make the moment.<br /><em>Keep the feeling.</em></h1>
            <p className="landing-intro">
              Take the photos, design the strip, and save something worth keeping. No app, no account, no awkward upload.
            </p>
            <div className="landing-actions">
              <Link href="/guide" className="landing-button landing-button-primary">
                Open the booth <ArrowRight aria-hidden="true" size={17} />
              </Link>
              <Link href="/frames" className="landing-button landing-button-quiet">Explore frames</Link>
            </div>
            <div className="landing-trust" aria-label="Product benefits">
              <span><ShieldCheck aria-hidden="true" size={15} /> Photos stay on your device</span>
              <span>Free to use</span>
            </div>
          </div>

          <div className="landing-hero-art" aria-label="A finished Studio Booth photo strip in the editor">
            <div className="landing-art-caption caption-top">Four frames / one good memory</div>
            <div className="landing-photo-strip">
              <div className="landing-photo landing-photo-one"><span>01</span></div>
              <div className="landing-photo landing-photo-two"><span>02</span></div>
              <div className="landing-photo landing-photo-three"><span>03</span></div>
              <div className="landing-photo landing-photo-four"><span>04</span></div>
              <div className="landing-strip-wordmark">STUDIO BOOTH <i>♥</i></div>
            </div>
            <div className="landing-sticker sticker-smile">GOOD<br />ONE!</div>
            <div className="landing-sticker sticker-date">10 · 07 · 26</div>
            <div className="landing-tool-card">
              <span>MOOD</span>
              <div><i className="swatch-coral" /><i className="swatch-cream" /><i className="swatch-blue" /><i className="swatch-acid" /></div>
            </div>
            <div className="landing-art-caption caption-bottom">Made in your browser / kept by you</div>
          </div>

          <a className="landing-scroll" href="#how-it-works" aria-label="Scroll to see how it works">
            <ArrowDown aria-hidden="true" size={15} /> Scroll to develop
          </a>
        </section>

        <section className="landing-marquee" aria-label="Studio Booth capabilities">
          <p>LIVE CAMERA <i>✦</i> FOUR SHOTS <i>✦</i> CUSTOM FRAMES <i>✦</i> STICKERS <i>✦</i> GIF + WEBM <i>✦</i> PRINT READY <i>✦</i> PRIVATE BY DEFAULT</p>
        </section>

        <section className="landing-manifesto" id="about">
          <div className="landing-section-label"><span>01</span><p>Why Studio Booth</p></div>
          <div className="landing-manifesto-copy">
            <p className="landing-eyebrow">The charm of a booth, without the queue</p>
            <h2>Not just a photo.<br />A little <em>artifact.</em></h2>
          </div>
          <div className="landing-manifesto-note">
            <p>Studio Booth turns a quick camera moment into something composed, personal, and ready to share or print.</p>
            <p className="landing-micro">Your raw camera frames are processed locally and never uploaded by the booth.</p>
          </div>
        </section>

        <section className="landing-process" id="how-it-works">
          <div className="landing-section-head">
            <div className="landing-section-label"><span>02</span><p>From camera to keepsake</p></div>
            <h2>Three steps.<br /><em>Endless versions.</em></h2>
            <p>Simple enough to start immediately, flexible enough to make the final result distinctly yours.</p>
          </div>
          <div className="landing-step-list">
            {steps.map(({ number, icon: Icon, title, copy }) => (
              <article className="landing-step" key={number}>
                <span className="landing-step-number">{number}</span>
                <Icon aria-hidden="true" size={22} />
                <div><h3>{title}</h3><p>{copy}</p></div>
                <ArrowRight aria-hidden="true" className="landing-step-arrow" size={20} />
              </article>
            ))}
          </div>
        </section>

        <section className="landing-frames">
          <div className="landing-frames-head">
            <div className="landing-section-label"><span>03</span><p>Start with a mood</p></div>
            <div>
              <h2>A frame for<br />every version of you.</h2>
              <Link href="/frames" className="landing-inline-link">See the full collection <ArrowRight aria-hidden="true" size={16} /></Link>
            </div>
          </div>
          <div className="landing-frame-grid">
            {curatedFrames.slice(0, 4).map((frame, index) => (
              <Link key={frame.id} href={`/frames?selected=${frame.id}`} className="landing-frame-card">
                <div className="landing-frame-art" style={{ backgroundColor: frame.background, color: frame.foreground }}>
                  <span className="landing-frame-index">0{index + 1}</span>
                  <div className="landing-frame-slots"><i /><i /><i /></div>
                  <Sparkles aria-hidden="true" size={20} />
                  <b>{frame.title}</b>
                </div>
                <div><p>{frame.title}</p><span>{frame.category}</span></div>
              </Link>
            ))}
          </div>
        </section>

        <section className="landing-final">
          <div className="landing-final-orbit" aria-hidden="true" />
          <p className="landing-eyebrow">Camera ready?</p>
          <h2>Your next favorite<br />photo starts <em>here.</em></h2>
          <Link href="/guide" className="landing-button landing-button-primary">
            Start your photo strip <ArrowRight aria-hidden="true" size={17} />
          </Link>
          <p className="landing-final-note">No download · No account required · Free to use</p>
        </section>
      </main>
      <Footer />
    </>
  );
}
