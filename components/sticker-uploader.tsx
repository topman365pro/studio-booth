"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ImageUp, LoaderCircle, Save, Sticker } from "lucide-react";
import { Logo } from "@/components/logo";
import { useCatalog } from "@/components/catalog-provider";
import { assetExtension, validateImageAsset, type ValidatedImage } from "@/lib/assets";
import { createClient } from "@/lib/supabase/client";

export function StickerUploader() {
  const { refresh } = useCatalog();
  const [title, setTitle] = useState("My private sticker");
  const [category, setCategory] = useState("Custom");
  const [file, setFile] = useState<File | null>(null);
  const [validated, setValidated] = useState<ValidatedImage | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const chooseSticker = async (nextFile?: File) => {
    if (!nextFile) return;
    try {
      const image = await validateImageAsset(nextFile);
      if (validated) URL.revokeObjectURL(validated.previewUrl);
      setFile(nextFile);
      setValidated(image);
      setPreview(image.previewUrl);
      setTitle(nextFile.name.replace(/\.[^.]+$/, "").slice(0, 80) || "My private sticker");
      setNotice("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not read sticker");
    }
  };

  const saveSticker = async () => {
    const supabase = createClient();
    if (!supabase) {
      setNotice("Connect Supabase in .env.local before saving private stickers.");
      return;
    }
    if (!file || !validated) {
      setNotice("Choose a PNG or WebP sticker first.");
      return;
    }

    setBusy(true);
    let storagePath = "";
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login?next=/stickers/new";
        return;
      }

      const id = crypto.randomUUID();
      storagePath = `${user.id}/${id}/asset.${assetExtension(validated.mimeType)}`;
      const { error: uploadError } = await supabase.storage.from("private-stickers").upload(storagePath, file, { contentType: validated.mimeType });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("stickers").insert({
        id,
        owner_id: user.id,
        visibility: "private",
        title: title.trim().slice(0, 80) || "Private sticker",
        category: category.trim().slice(0, 80) || "Custom",
        storage_path: storagePath,
        mime_type: validated.mimeType,
        width: validated.width,
        height: validated.height,
        published: false
      });
      if (insertError) throw insertError;

      await refresh();
      setNotice("Private sticker saved to your library.");
    } catch (error) {
      if (storagePath) await supabase.storage.from("private-stickers").remove([storagePath]);
      setNotice(error instanceof Error ? error.message : "Could not save sticker");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="builder-page">
      <header className="builder-header"><Logo href="/stickers" /><Link href="/stickers"><ArrowLeft size={14} /> Sticker library</Link></header>
      <section className="builder-preview">
        <div className="custom-sticker-preview">
          {preview ? <img src={preview} alt="Custom sticker preview" /> : <><Sticker size={72} /><span>Choose a transparent PNG or WebP</span></>}
        </div>
      </section>
      <aside className="builder-controls">
        <p className="kicker">PRIVATE STICKER UPLOAD</p><h1>Add reusable sticker art.</h1>
        <label>Sticker name<input value={title} onChange={event => setTitle(event.target.value)} maxLength={80} /></label>
        <label>Category<input value={category} onChange={event => setCategory(event.target.value)} maxLength={80} /></label>
        <label className="overlay-drop"><ImageUp /><span><b>Sticker artwork</b><small>PNG or WebP, maximum 10 MB</small></span><input type="file" accept="image/png,image/webp" onChange={event => void chooseSticker(event.target.files?.[0])} /></label>
        {validated && <p className="editor-notice">{validated.width} × {validated.height}px · {validated.mimeType}</p>}
        <button className="button button-solid" onClick={saveSticker} disabled={busy || !file}>{busy ? <LoaderCircle className="spin" /> : <Save size={15} />} Save private sticker</button>
        {notice && <p className="editor-notice">{notice}</p>}
      </aside>
    </main>
  );
}
