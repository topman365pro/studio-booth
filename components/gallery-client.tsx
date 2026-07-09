"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Edit3, Image as ImageIcon, LoaderCircle, LogIn, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { SavedSession } from "@/lib/types";

export function GalleryClient() {
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [notice, setNotice] = useState("");

  const load = async () => {
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    setSignedIn(Boolean(user));
    if (!user) return setLoading(false);
    const { data, error } = await supabase
      .from("photo_sessions")
      .select("id,title,created_at,frame_template_id,exports(id,session_id,format,storage_path,width,height,byte_size,duration_ms)")
      .order("created_at", { ascending: false });
    if (error) setNotice(error.message);
    const rows = (data ?? []) as SavedSession[];
    for (const session of rows) {
      for (const item of session.exports ?? []) {
        const { data: signed } = await supabase.storage.from("exports").createSignedUrl(item.storage_path, 3600);
        item.signed_url = signed?.signedUrl;
      }
    }
    setSessions(rows);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const rename = async (session: SavedSession) => {
    const title = window.prompt("Session name", session.title)?.trim();
    if (!title) return;
    const supabase = createClient();
    if (!supabase) return;
    const { error } = await supabase.from("photo_sessions").update({ title }).eq("id", session.id);
    if (error) return setNotice(error.message);
    setSessions(current => current.map(item => item.id === session.id ? { ...item, title } : item));
  };

  const remove = async (session: SavedSession) => {
    if (!window.confirm(`Delete “${session.title}” and its exports?`)) return;
    const supabase = createClient();
    if (!supabase) return;
    const paths = (session.exports ?? []).map(item => item.storage_path);
    if (paths.length) await supabase.storage.from("exports").remove(paths);
    const { error } = await supabase.from("photo_sessions").delete().eq("id", session.id);
    if (error) return setNotice(error.message);
    setSessions(current => current.filter(item => item.id !== session.id));
  };

  return (
    <>
      <SiteHeader />
      <main className="gallery-page">
        <header><p className="kicker">PRIVATE CLOUD</p><h1>Your<br />gallery.</h1><p>Only finished work you explicitly saved appears here.</p></header>
        {!isSupabaseConfigured ? (
          <Empty icon={<ImageIcon />} title="Cloud storage is not connected" copy="Add the Supabase variables from .env.example to enable accounts and private saves." />
        ) : loading ? (
          <div className="gallery-loading"><LoaderCircle className="spin" /> Loading private gallery…</div>
        ) : !signedIn ? (
          <Empty icon={<LogIn />} title="Sign in to see your work" copy="Magic links and Google sign-in keep this simple."><Link className="button button-solid" href="/login?next=/gallery">Sign in</Link></Empty>
        ) : !sessions.length ? (
          <Empty icon={<ImageIcon />} title="Nothing saved yet" copy="Finish a booth session, then choose Save to my gallery."><Link className="button button-acid" href="/studio/capture">Open camera</Link></Empty>
        ) : (
          <section className="saved-grid">
            {sessions.map(session => {
              const preview = session.exports?.find(item => item.format === "png" || item.format === "jpeg") ?? session.exports?.[0];
              return (
                <article key={session.id}>
                  <div className="saved-preview">{preview?.signed_url ? (preview.format === "webm" ? <video src={preview.signed_url} muted autoPlay loop playsInline /> : <img src={preview.signed_url} alt={session.title} />) : <ImageIcon />}</div>
                  <div className="saved-meta"><div><h2>{session.title}</h2><p>{new Date(session.created_at).toLocaleDateString()} · {session.exports?.length ?? 0} export</p></div>
                    <div><button onClick={() => rename(session)} aria-label="Rename"><Edit3 /></button>{preview?.signed_url && <a href={preview.signed_url} download aria-label="Download"><Download /></a>}<button onClick={() => remove(session)} aria-label="Delete"><Trash2 /></button></div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
        {notice && <p className="editor-notice">{notice}</p>}
      </main>
    </>
  );
}

function Empty({ icon, title, copy, children }: { icon: React.ReactNode; title: string; copy: string; children?: React.ReactNode }) {
  return <section className="gallery-empty">{icon}<h2>{title}</h2><p>{copy}</p>{children}</section>;
}
