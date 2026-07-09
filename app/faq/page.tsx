import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";

const items = [
  ["Are my raw photos uploaded?", "No. Captures stay in browser memory and IndexedDB. Only a finished export is uploaded when a signed-in user explicitly saves it."],
  ["Why does the camera need HTTPS?", "Browsers permit camera access only on secure origins. Localhost and Vercel HTTPS deployments both qualify."],
  ["Which formats can I download?", "PNG, JPEG, animated GIF, and WebM. Availability of WebM recording depends on browser MediaRecorder support."],
  ["Can I use a phone camera?", "Yes. The booth requests the user-facing camera by default and lets you choose another available camera."],
  ["How long is an unfinished session kept?", "Local drafts expire after 24 hours and are never synchronized between devices."],
  ["Can other users see my frames?", "No. Custom frames are private. The public library contains only application-owned curated designs."]
];

export default function FAQPage() {
  return <><SiteHeader /><main className="legal-page"><p className="kicker">HELP / PRIVACY / DETAILS</p><h1>Frequently<br />asked.</h1><section className="faq-list">{items.map(([q,a],i)=><details key={q} open={i===0}><summary><span>0{i+1}</span>{q}</summary><p>{a}</p></details>)}</section></main><Footer /></>;
}
