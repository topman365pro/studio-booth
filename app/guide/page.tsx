import Link from "next/link";
import { ArrowRight, Camera, Download, Film, Frame, LayoutTemplate, SlidersHorizontal, Sticker } from "lucide-react";
import { Logo } from "@/components/logo";

const steps = [
  [Camera, "Open the camera", "Choose a lens, tune the light, and set your countdown."],
  [Camera, "Take your photos", "The booth guides you through every shot automatically."],
  [LayoutTemplate, "Choose a layout", "Build a strip, square, postcard, or loose collage."],
  [SlidersHorizontal, "Find the color", "Start with a look, then tune it precisely."],
  [Sticker, "Add character", "Move, scale, rotate, and layer original stickers."],
  [Film, "Make it move", "Turn the sequence into a looping GIF or WebM."],
  [Download, "Keep it", "Download locally, or sign in and save the final export."]
];

export default function GuidePage() {
  return (
    <main className="guide-page">
      <header className="guide-header"><Logo /><Link href="/">Close</Link></header>
      <section className="guide-intro">
        <p className="kicker">A QUICK WALKTHROUGH</p>
        <h1>How it<br />works.</h1>
        <p>Seven small steps between opening the camera and making something worth keeping.</p>
      </section>
      <section className="guide-steps">
        {steps.map(([Icon, title, description], index) => {
          const StepIcon = Icon as typeof Camera;
          return (
            <article key={title as string}>
              <span>0{index + 1}</span><StepIcon />
              <div><h2>{title as string}</h2><p>{description as string}</p></div>
            </article>
          );
        })}
      </section>
      <section className="guide-start">
        <Frame size={55} />
        <h2>Camera ready?</h2>
        <Link href="/studio/capture" className="button button-acid">Start now <ArrowRight size={15} /></Link>
      </section>
    </main>
  );
}
