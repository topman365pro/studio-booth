"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, ImageUp, LoaderCircle, RefreshCw, Save, Trash2 } from "lucide-react";
import { assetExtension, validateImageAsset } from "@/lib/assets";
import { layouts } from "@/lib/frames";
import { createClient } from "@/lib/supabase/client";
import type { LayoutId } from "@/lib/types";

type Kind = "frames" | "stickers";
type Row = Record<string, unknown> & {
  id: string;
  title: string;
  category: string;
  published: boolean;
  sort_order: number;
  visibility: "curated";
  overlay_path?: string | null;
  storage_path?: string;
  preview_url?: string;
};

export function AdminAssetManager({ kind }: { kind: Kind }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(kind === "frames" ? "Editorial" : "Marks");
  const [layoutId, setLayoutId] = useState<LayoutId>("strip");
  const [published, setPublished] = useState(true);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");

  const table = kind === "frames" ? "frame_templates" : "stickers";
  const bucket = kind === "frames" ? "curated-frames" : "curated-stickers";

  const load = async () => {
    const supabase = createClient();
    if (!supabase) return;
    setBusy("load");
    const { data, error } = await supabase.from(table).select("*").eq("visibility", "curated").order("sort_order");
    if (error) setNotice(error.message);
    const resolved = ((data ?? []) as Row[]).map(row => {
      const path = kind === "frames" ? row.overlay_path : row.storage_path;
      return { ...row, preview_url: path ? supabase.storage.from(bucket).getPublicUrl(String(path)).data.publicUrl : "" };
    });
    setRows(resolved);
    setBusy("");
  };

  useEffect(() => { void load(); }, [kind]);

  const choose = async (selected?: File) => {
    if (!selected) return;
    try {
      const image = await validateImageAsset(selected);
      if (preview) URL.revokeObjectURL(preview);
      setFile(selected);
      setPreview(image.previewUrl);
      setNotice(`${image.width} × ${image.height}px · ${(selected.size / 1024 / 1024).toFixed(2)} MB`);
      if (!title) setTitle(selected.name.replace(/\.[^.]+$/, "").slice(0, 80));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not read image");
    }
  };

  const upload = async () => {
    const supabase = createClient();
    if (!supabase || !file || !title.trim()) return;
    setBusy("upload");
    let path = "";
    try {
      const image = await validateImageAsset(file);
      const id = crypto.randomUUID();
      path = `catalog/${id}/asset.${assetExtension(image.mimeType)}`;
      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { contentType: image.mimeType });
      if (uploadError) throw uploadError;
      const base = {
        id, owner_id: null, visibility: "curated", title: title.trim(),
        category: category.trim() || "Uncategorized", published,
        sort_order: (rows.at(-1)?.sort_order ?? 0) + 10,
        mime_type: image.mimeType
      };
      const record = kind === "frames" ? {
        ...base,
        background: "#111111",
        foreground: "#ffffff",
        canvas_width: layouts[layoutId].width,
        canvas_height: layouts[layoutId].height,
        shot_count: layouts[layoutId].shotCount,
        slots: layouts[layoutId].slots,
        overlay_path: path,
        print_compatible: layoutId === "strip"
      } : {
        ...base,
        storage_path: path,
        width: image.width,
        height: image.height
      };
      const { error: insertError } = await supabase.from(table).insert(record as never);
      if (insertError) throw insertError;
      URL.revokeObjectURL(image.previewUrl);
      setFile(null); setPreview(""); setTitle(""); setNotice(`${kind === "frames" ? "Frame" : "Sticker"} added to the catalog.`);
      await load();
    } catch (error) {
      if (path) await supabase.storage.from(bucket).remove([path]);
      setNotice(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy("");
    }
  };

  const saveRow = async (row: Row) => {
    const supabase = createClient();
    if (!supabase) return;
    setBusy(row.id);
    const { error } = await supabase.from(table).update({
      title: row.title,
      category: row.category,
      published: row.published,
      sort_order: row.sort_order,
      updated_at: new Date().toISOString()
    }).eq("id", row.id);
    setNotice(error ? error.message : "Catalog entry updated.");
    setBusy("");
    await load();
  };

  const replace = async (row: Row, selected?: File) => {
    const supabase = createClient();
    if (!supabase || !selected) return;
    setBusy(row.id);
    try {
      const image = await validateImageAsset(selected);
      const oldPath = String(kind === "frames" ? row.overlay_path : row.storage_path);
      const nextPath = `catalog/${row.id}/asset.${assetExtension(image.mimeType)}`;
      const { error: uploadError } = await supabase.storage.from(bucket).upload(nextPath, selected, { contentType: image.mimeType, upsert: true });
      if (uploadError) throw uploadError;
      const patch = kind === "frames"
        ? { overlay_path: nextPath, mime_type: image.mimeType, updated_at: new Date().toISOString() }
        : { storage_path: nextPath, mime_type: image.mimeType, width: image.width, height: image.height, updated_at: new Date().toISOString() };
      const { error } = await supabase.from(table).update(patch as never).eq("id", row.id);
      if (error) {
        if (nextPath !== oldPath) await supabase.storage.from(bucket).remove([nextPath]);
        throw error;
      }
      if (nextPath !== oldPath) await supabase.storage.from(bucket).remove([oldPath]);
      setNotice("Asset file replaced.");
      URL.revokeObjectURL(image.previewUrl);
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Replacement failed");
    } finally {
      setBusy("");
    }
  };

  const remove = async (row: Row) => {
    if (!window.confirm(`Delete “${row.title}” from the catalog?`)) return;
    const supabase = createClient();
    if (!supabase) return;
    setBusy(row.id);
    const path = String(kind === "frames" ? row.overlay_path : row.storage_path);
    const { error } = await supabase.from(table).delete().eq("id", row.id);
    if (!error && path) await supabase.storage.from(bucket).remove([path]);
    setNotice(error ? error.message : "Catalog entry deleted.");
    setBusy("");
    await load();
  };

  const patchRow = (id: string, patch: Partial<Row>) => setRows(current => current.map(row => row.id === id ? { ...row, ...patch } : row));

  return (
    <section className="admin-catalog">
      <header className="admin-page-head">
        <div><p className="kicker">GLOBAL CATALOG</p><h1>{kind === "frames" ? "Frames" : "Stickers"}</h1><p>Published assets appear in every customer editor. Draft assets stay admin-only.</p></div>
        <button className="admin-refresh" onClick={load}><RefreshCw className={busy === "load" ? "spin" : ""} />Refresh</button>
      </header>

      <div className="admin-upload-workspace">
        <label className="admin-drop">
          {preview ? <img src={preview} alt="New asset preview" /> : <><ImageUp /><b>Choose PNG or WebP</b><span>Transparent artwork · maximum 10 MB</span></>}
          <input type="file" accept="image/png,image/webp" onChange={event => void choose(event.target.files?.[0])} />
        </label>
        <div className="admin-upload-fields">
          <label>Title<input value={title} onChange={event => setTitle(event.target.value)} maxLength={80} /></label>
          <label>Category<input value={category} onChange={event => setCategory(event.target.value)} maxLength={50} /></label>
          {kind === "frames" && <label>Photo layout<select value={layoutId} onChange={event => setLayoutId(event.target.value as LayoutId)}>{Object.keys(layouts).map(id => <option key={id}>{id}</option>)}</select></label>}
          <label className="publish-toggle"><input type="checkbox" checked={published} onChange={event => setPublished(event.target.checked)} />Publish immediately</label>
          <button className="button button-lab" onClick={upload} disabled={!file || !title.trim() || Boolean(busy)}>{busy === "upload" ? <LoaderCircle className="spin" /> : <ImageUp />}Upload {kind === "frames" ? "frame" : "sticker"}</button>
        </div>
      </div>

      {notice && <p className="admin-notice">{notice}</p>}

      <div className="admin-table">
        <div className="admin-table-head"><span>Preview</span><span>Details</span><span>Order</span><span>Status</span><span>Actions</span></div>
        {rows.map((row, index) => (
          <article key={row.id}>
            <div className="admin-thumb">{row.preview_url ? <img src={row.preview_url} alt="" /> : <span>No file</span>}</div>
            <div className="admin-row-fields"><input value={row.title} onChange={event => patchRow(row.id, { title: event.target.value })} /><input value={row.category} onChange={event => patchRow(row.id, { category: event.target.value })} /></div>
            <div className="admin-order"><button disabled={index === 0} onClick={() => patchRow(row.id, { sort_order: Math.max(0, row.sort_order - 15) })}><ArrowUp /></button><input type="number" value={row.sort_order} onChange={event => patchRow(row.id, { sort_order: Number(event.target.value) })} /><button disabled={index === rows.length - 1} onClick={() => patchRow(row.id, { sort_order: row.sort_order + 15 })}><ArrowDown /></button></div>
            <button className={`admin-status ${row.published ? "published" : ""}`} onClick={() => patchRow(row.id, { published: !row.published })}>{row.published ? <><Eye />Published</> : <><EyeOff />Draft</>}</button>
            <div className="admin-row-actions">
              <button onClick={() => saveRow(row)} disabled={busy === row.id}><Save /></button>
              <label><RefreshCw /><input type="file" accept="image/png,image/webp" onChange={event => void replace(row, event.target.files?.[0])} /></label>
              <button onClick={() => remove(row)} disabled={busy === row.id}><Trash2 /></button>
            </div>
          </article>
        ))}
        {!rows.length && busy !== "load" && <p className="admin-empty">No catalog entries yet. Upload the first one above.</p>}
      </div>
    </section>
  );
}
