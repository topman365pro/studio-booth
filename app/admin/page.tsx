import Link from "next/link";
import { ArrowUpRight, Frame, ShieldCheck, Sticker } from "lucide-react";

export const metadata = { title: "Catalog admin" };

export default function AdminPage() {
  return (
    <section className="admin-overview">
      <div className="admin-page-head"><p className="kicker">CATALOG OPERATIONS</p><h1>Photo lab<br />control room.</h1><p>Publish the frames and stickers that define the booth. Private customer assets remain outside this catalog.</p></div>
      <div className="admin-action-lines">
        <Link href="/admin/frames"><Frame /><div><h2>Frame catalog</h2><p>Upload overlays, choose slot geometry, order releases, and control publishing.</p></div><ArrowUpRight /></Link>
        <Link href="/admin/stickers"><Sticker /><div><h2>Sticker catalog</h2><p>Add transparent PNG or WebP artwork and organize it for the editor.</p></div><ArrowUpRight /></Link>
        <div><ShieldCheck /><div><h2>Protected by database roles</h2><p>Every catalog write is checked by Supabase row-level security.</p></div></div>
      </div>
    </section>
  );
}
