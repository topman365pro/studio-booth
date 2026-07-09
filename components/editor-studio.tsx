"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Copy, Download, LoaderCircle, Printer, RotateCcw, Save, Trash2, Upload } from "lucide-react";
import { CompositionPreview } from "@/components/composition-preview";
import { useBooth } from "@/components/booth-provider";
import { useCatalog } from "@/components/catalog-provider";
import { layoutFor, layouts } from "@/lib/frames";
import { fallbackTextStickers } from "@/lib/stickers";
import { assetExtension, validateImageAsset } from "@/lib/assets";
import { canvasBlob, composeA4Sheet, createGif, createWebM, downloadBlob, printA4Canvas, renderDraftToCanvas } from "@/lib/render";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { EditorStage, FilterSettings, LayoutId, StickerItem } from "@/lib/types";

const order: EditorStage[] = ["layout", "filter", "stickers", "animate", "export"];
const presets: { id: FilterSettings["preset"]; label: string }[] = [
  { id: "clean", label: "Clean" }, { id: "mono", label: "Mono" },
  { id: "warm", label: "Warm" }, { id: "cool", label: "Cool" },
  { id: "punch", label: "Punch" }
];

export function EditorStudio({ stage }: { stage: EditorStage }) {
  const router = useRouter();
  const { draft, hydrated, update, reset } = useBooth();
  const { frames, stickers: imageStickers, frameById, refresh } = useCatalog();
  const exportCanvas = useRef<HTMLCanvasElement>(null);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [animationSpeed, setAnimationSpeed] = useState(450);
  const [printCopies, setPrintCopies] = useState(1);
  const stageIndex = order.indexOf(stage);

  useEffect(() => {
    if (hydrated && !draft.captures.length && stage !== "layout") router.replace("/studio/capture");
  }, [draft.captures.length, hydrated, router, stage]);

  if (!hydrated) return <div className="studio-loading">Restoring your local draft…</div>;

  const setFilter = <K extends keyof FilterSettings>(key: K, value: FilterSettings[K]) => {
    update({ filter: { ...draft.filter, [key]: value } });
  };

  const addSticker = (glyph: string) => {
    const item: StickerItem = {
      id: crypto.randomUUID(), glyph, x: 0.5, y: 0.45,
      scale: 1, rotation: 0, color: "#ffffff", layer: draft.stickers.length
    };
    update({ stickers: [...draft.stickers, item] });
    setSelectedSticker(item.id);
  };

  const addImageSticker = (asset: (typeof imageStickers)[number]) => {
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
    setSelectedSticker(item.id);
  };

  const changeSticker = (patch: Partial<{ x: number; y: number; scale: number; rotation: number; color: string }>) => {
    update({ stickers: draft.stickers.map(item => item.id === selectedSticker ? { ...item, ...patch } : item) as StickerItem[] });
  };

  const activeSticker = draft.stickers.find(item => item.id === selectedSticker);

  const moveStickerLayer = (direction: -1 | 1) => {
    const index = draft.stickers.findIndex(item => item.id === selectedSticker);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= draft.stickers.length) return;
    const reordered = [...draft.stickers];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    update({ stickers: reordered.map((item, layer) => ({ ...item, layer })) });
  };

  const prepareStill = async (format: "png" | "jpeg") => {
    if (!exportCanvas.current) throw new Error("Export canvas unavailable");
    setBusy(format);
    setNotice("");
    const baseFrame = frameById(draft.frameId);
    const frame = { ...baseFrame, ...layoutFor(draft.layoutId) };
    const fabricCanvas = await renderDraftToCanvas(exportCanvas.current, draft, frame);
    const blob = await canvasBlob(exportCanvas.current, format === "png" ? "image/png" : "image/jpeg");
    fabricCanvas.dispose();
    setBusy(null);
    return blob;
  };

  const createA4 = async () => {
    if (draft.layoutId !== "strip") throw new Error("A4 printing is available for vertical strips only.");
    if (!exportCanvas.current) throw new Error("Export canvas unavailable");
    const frame = { ...frameById(draft.frameId), ...layoutFor("strip") };
    const fabricCanvas = await renderDraftToCanvas(exportCanvas.current, draft, frame);
    const sheet = composeA4Sheet(exportCanvas.current, printCopies);
    fabricCanvas.dispose();
    return sheet;
  };

  const downloadA4 = async () => {
    setBusy("a4");
    try {
      const sheet = await createA4();
      const blob = await canvasBlob(sheet.canvas, "image/png");
      downloadBlob(blob, `studio-booth-a4-${sheet.copies}x-${Date.now()}.png`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "A4 export failed");
    } finally {
      setBusy(null);
    }
  };

  const printA4 = async () => {
    setBusy("print");
    try {
      const sheet = await createA4();
      printA4Canvas(sheet.canvas);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "A4 print failed");
    } finally {
      setBusy(null);
    }
  };

  const uploadPrivateSticker = async (file?: File) => {
    if (!file) return;
    const supabase = createClient();
    if (!supabase) return setNotice("Connect Supabase before uploading private stickers.");
    setBusy("sticker-upload");
    let storagePath = "";
    try {
      const image = await validateImageAsset(file);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?next=/studio/edit/stickers");
        return;
      }
      const id = crypto.randomUUID();
      storagePath = `${user.id}/${id}/asset.${assetExtension(image.mimeType)}`;
      const { error: uploadError } = await supabase.storage.from("private-stickers").upload(storagePath, file, { contentType: image.mimeType });
      if (uploadError) throw uploadError;
      const { error: insertError } = await supabase.from("stickers").insert({
        id,
        owner_id: user.id,
        visibility: "private",
        title: file.name.replace(/\.[^.]+$/, "").slice(0, 80),
        category: "Custom",
        storage_path: storagePath,
        mime_type: image.mimeType,
        width: image.width,
        height: image.height,
        published: false
      });
      if (insertError) throw insertError;
      await refresh();
      setNotice("Private sticker uploaded.");
      URL.revokeObjectURL(image.previewUrl);
    } catch (error) {
      if (storagePath) await supabase.storage.from("private-stickers").remove([storagePath]);
      setNotice(error instanceof Error ? error.message : "Sticker upload failed");
    } finally {
      setBusy(null);
    }
  };

  const downloadStill = async (format: "png" | "jpeg") => {
    try {
      const blob = await prepareStill(format);
      downloadBlob(blob, `studio-booth-${Date.now()}.${format === "jpeg" ? "jpg" : "png"}`);
    } catch (error) {
      setBusy(null);
      setNotice(error instanceof Error ? error.message : "Export failed");
    }
  };

  const downloadAnimation = async (format: "gif" | "webm") => {
    setBusy(format);
    setNotice("");
    try {
      const blob = format === "gif"
        ? await createGif(draft.captures, animationSpeed)
        : await createWebM(draft.captures, animationSpeed);
      downloadBlob(blob, `studio-booth-${Date.now()}.${format}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Animation export failed");
    } finally {
      setBusy(null);
    }
  };

  const saveToAccount = async () => {
    const supabase = createClient();
    if (!supabase) {
      setNotice("Connect Supabase in .env.local to save finished work.");
      return;
    }
    setBusy("save");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?next=/studio/edit/export");
        return;
      }
      const blob = await prepareStill("png");
      const sessionId = crypto.randomUUID();
      const path = `${user.id}/${sessionId}/final.png`;
      const { error: uploadError } = await supabase.storage.from("exports").upload(path, blob, { contentType: "image/png" });
      if (uploadError) throw uploadError;
      const { error: sessionError } = await supabase.from("photo_sessions").insert({
        id: sessionId,
        owner_id: user.id,
        title: draft.title,
        frame_template_id: draft.frameId,
        export_metadata: { layout: draft.layoutId, filter: draft.filter.preset }
      });
      if (sessionError) throw sessionError;
      const frame = { ...frameById(draft.frameId), ...layoutFor(draft.layoutId) };
      const { error: exportError } = await supabase.from("exports").insert({
        session_id: sessionId,
        owner_id: user.id,
        format: "png",
        storage_path: path,
        width: frame.width,
        height: frame.height,
        byte_size: blob.size
      });
      if (exportError) throw exportError;
      setNotice("Saved privately to your gallery.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save");
    } finally {
      setBusy(null);
    }
  };

  const goNext = () => router.push(`/studio/edit/${order[Math.min(order.length - 1, stageIndex + 1)]}`);
  const goBack = () => stageIndex === 0 ? router.push("/studio/capture") : router.push(`/studio/edit/${order[stageIndex - 1]}`);

  return (
    <main className="editor-page">
      <section className="editor-preview">
        <CompositionPreview animate={stage === "animate"} />
        <p className="privacy-note">Raw photos remain on this device.</p>
      </section>
      <aside className="editor-panel">
        <div className="editor-panel-head">
          <p className="kicker">STEP 0{stageIndex + 1} / 05</p>
          <h1>{stage === "stickers" ? "Add stickers" : stage === "animate" ? "Make it move" : stage}</h1>
        </div>

        <div className="editor-controls">
          {stage === "layout" && <>
            <ControlSection title="Composition">
              <div className="option-grid layouts">
                {(Object.keys(layouts) as LayoutId[]).map(id => (
                  <button key={id} className={draft.layoutId === id ? "active" : ""} onClick={() => update({ layoutId: id })}>
                    <i className={`layout-icon ${id}`} />{id}
                  </button>
                ))}
              </div>
            </ControlSection>
            <ControlSection title="Frame">
              <div className="frame-swatches">
                {frames.map(frame => (
                  <button
                    key={frame.id}
                    aria-label={frame.title}
                    className={draft.frameId === frame.id ? "active" : ""}
                    style={{ background: frame.background }}
                    onClick={() => update({ frameId: frame.id })}
                  />
                ))}
              </div>
              <Link className="panel-link" href="/frames">Browse the full library <ArrowRight size={14} /></Link>
            </ControlSection>
            <ControlSection title="Photo order">
              <div className="photo-order">
                {draft.captures.map((capture, index) => (
                  <div key={capture.slice(-20)}><img src={capture} alt={`Captured shot ${index + 1}`} /><span>{index + 1}</span></div>
                ))}
              </div>
            </ControlSection>
          </>}

          {stage === "filter" && <>
            <ControlSection title="Look">
              <div className="preset-row">{presets.map(preset => <button key={preset.id} className={draft.filter.preset === preset.id ? "active" : ""} onClick={() => setFilter("preset", preset.id)}>{preset.label}</button>)}</div>
            </ControlSection>
            <ControlSection title="Fine tune">
              {(["brightness", "contrast", "saturation", "temperature", "blur", "vignette"] as const).map(key => (
                <label className="range-control" key={key}>
                  <span>{key}<b>{draft.filter[key]}</b></span>
                  <input
                    type="range"
                    min={key === "temperature" ? -100 : 0}
                    max={key === "blur" ? 8 : 100}
                    value={draft.filter[key]}
                    onChange={(event) => setFilter(key, Number(event.target.value))}
                  />
                </label>
              ))}
              <button className="panel-link" onClick={() => update({ filter: { preset: "clean", brightness: 0, contrast: 0, saturation: 0, temperature: 0, blur: 0, vignette: 0 } })}><RotateCcw size={14} /> Reset adjustments</button>
            </ControlSection>
          </>}

          {stage === "stickers" && <>
            <ControlSection title="Sticker library">
              <label className="asset-upload-button">
                {busy === "sticker-upload" ? <LoaderCircle className="spin" /> : <Upload size={16} />}
                <span><b>Upload private sticker</b><small>PNG or WebP · maximum 10 MB</small></span>
                <input type="file" accept="image/png,image/webp" onChange={event => void uploadPrivateSticker(event.target.files?.[0])} />
              </label>
              <Link className="panel-link" href="/stickers">Browse the full library <ArrowRight size={14} /></Link>
              <div className="sticker-grid">
                {imageStickers.map(asset => <button key={asset.id} onClick={() => addImageSticker(asset)}><img src={asset.src} alt="" /><span>{asset.title}</span></button>)}
                {fallbackTextStickers.map(({ glyph, category }) => <button key={`${glyph}-${category}`} onClick={() => addSticker(glyph)}><b>{glyph}</b><span>{category}</span></button>)}
              </div>
            </ControlSection>
            {activeSticker && <ControlSection title="Selected sticker">
              <label className="range-control"><span>Size<b>{activeSticker.scale.toFixed(1)}</b></span><input type="range" min=".4" max="2.5" step=".1" value={activeSticker.scale} onChange={e => changeSticker({ scale: Number(e.target.value) })} /></label>
              <label className="range-control"><span>Horizontal<b>{Math.round(activeSticker.x * 100)}%</b></span><input type="range" min=".05" max=".95" step=".01" value={activeSticker.x} onChange={e => changeSticker({ x: Number(e.target.value) })} /></label>
              <label className="range-control"><span>Vertical<b>{Math.round(activeSticker.y * 100)}%</b></span><input type="range" min=".05" max=".95" step=".01" value={activeSticker.y} onChange={e => changeSticker({ y: Number(e.target.value) })} /></label>
              <label className="range-control"><span>Rotate<b>{activeSticker.rotation}°</b></span><input type="range" min="-180" max="180" value={activeSticker.rotation} onChange={e => changeSticker({ rotation: Number(e.target.value) })} /></label>
              {activeSticker.kind !== "image" && <label className="color-control">Color <input type="color" value={activeSticker.color} onChange={e => changeSticker({ color: e.target.value })} /></label>}
              <div className="inline-actions">
                <button onClick={() => { const clone = { ...activeSticker, id: crypto.randomUUID(), x: activeSticker.x + .05, y: activeSticker.y + .05 }; update({ stickers: [...draft.stickers, clone] }); setSelectedSticker(clone.id); }}><Copy size={14} /> Duplicate</button>
                <button onClick={() => { update({ stickers: draft.stickers.filter(item => item.id !== activeSticker.id) }); setSelectedSticker(null); }}><Trash2 size={14} /> Delete</button>
              </div>
              <div className="inline-actions">
                <button onClick={() => moveStickerLayer(-1)}><ArrowDown size={14} /> Send back</button>
                <button onClick={() => moveStickerLayer(1)}><ArrowUp size={14} /> Bring front</button>
              </div>
            </ControlSection>}
            {draft.stickers.length > 0 && <ControlSection title="Layers"><div className="layer-list">{draft.stickers.map(item => <button key={item.id} className={item.id === selectedSticker ? "active" : ""} onClick={() => setSelectedSticker(item.id)}><span>{item.kind === "image" ? <img src={item.src} alt="" /> : item.glyph}</span> Sticker <small>{item.id.slice(0, 4)}</small></button>)}</div></ControlSection>}
          </>}

          {stage === "animate" && <>
            <ControlSection title="Loop preview">
              <p className="panel-copy">Every captured shot becomes a frame. The loop plays twice when exporting WebM and continuously in GIF viewers.</p>
              <label className="range-control"><span>Frame delay<b>{animationSpeed}ms</b></span><input type="range" min="150" max="1000" step="50" value={animationSpeed} onChange={e => setAnimationSpeed(Number(e.target.value))} /></label>
            </ControlSection>
            <ControlSection title="Quick export">
              <div className="export-buttons">
                <button onClick={() => downloadAnimation("gif")} disabled={Boolean(busy)}>{busy === "gif" ? <LoaderCircle className="spin" /> : <Download />}<span><b>Animated GIF</b><small>Most compatible</small></span></button>
                <button onClick={() => downloadAnimation("webm")} disabled={Boolean(busy)}>{busy === "webm" ? <LoaderCircle className="spin" /> : <Download />}<span><b>WebM video</b><small>Sharper and smaller</small></span></button>
              </div>
            </ControlSection>
          </>}

          {stage === "export" && <>
            <ControlSection title="Session name"><input className="text-input" value={draft.title} onChange={event => update({ title: event.target.value })} /></ControlSection>
            <ControlSection title="Download">
              <div className="export-buttons">
                <button onClick={() => downloadStill("png")} disabled={Boolean(busy)}>{busy === "png" ? <LoaderCircle className="spin" /> : <Download />}<span><b>PNG</b><small>Lossless · transparent-safe</small></span></button>
                <button onClick={() => downloadStill("jpeg")} disabled={Boolean(busy)}>{busy === "jpeg" ? <LoaderCircle className="spin" /> : <Download />}<span><b>JPEG</b><small>Smaller file</small></span></button>
                <button onClick={() => downloadAnimation("gif")} disabled={Boolean(busy)}>{busy === "gif" ? <LoaderCircle className="spin" /> : <Download />}<span><b>GIF</b><small>Animated loop</small></span></button>
                <button onClick={() => downloadAnimation("webm")} disabled={Boolean(busy)}>{busy === "webm" ? <LoaderCircle className="spin" /> : <Download />}<span><b>WebM</b><small>Animated video</small></span></button>
              </div>
            </ControlSection>
            {draft.layoutId === "strip" && <ControlSection title="A4 print sheet">
              <p className="panel-copy">Portrait A4 · 300 DPI · strips rotated 90° and stacked flush from the top edge.</p>
              <div className="print-copy-picker">
                {[1, 2, 3, 4].map(copies => <button key={copies} className={printCopies === copies ? "active" : ""} onClick={() => setPrintCopies(copies)}>{copies}<small>{copies === 1 ? "copy" : "copies"}</small></button>)}
              </div>
              <p className="print-dimensions">2480 × 3508 px · 210 × 297 mm</p>
              <div className="inline-actions">
                <button onClick={downloadA4} disabled={Boolean(busy)}>{busy === "a4" ? <LoaderCircle className="spin" /> : <Download size={14} />} A4 PNG</button>
                <button onClick={printA4} disabled={Boolean(busy)}>{busy === "print" ? <LoaderCircle className="spin" /> : <Printer size={14} />} Print A4</button>
              </div>
            </ControlSection>}
            <ControlSection title="Private cloud">
              <p className="panel-copy">{isSupabaseConfigured ? "Only this finished export is uploaded. Your original captures remain local." : "Cloud saving becomes available when Supabase environment variables are configured."}</p>
              <button className="button button-solid full" onClick={saveToAccount} disabled={Boolean(busy)}>{busy === "save" ? <LoaderCircle className="spin" /> : <Save size={15} />} Save to my gallery</button>
            </ControlSection>
            <button className="restart-link" onClick={async () => { await reset(); router.push("/studio/capture"); }}><RotateCcw size={14} /> Start a new session</button>
          </>}
          {notice && <p className="editor-notice">{notice}</p>}
        </div>

        <div className="editor-nav">
          <button onClick={goBack}><ArrowLeft size={15} /> Back</button>
          {stage !== "export" && <button className="next" onClick={goNext}>Continue <ArrowRight size={15} /></button>}
        </div>
      </aside>
      <canvas ref={exportCanvas} className="export-canvas" />
    </main>
  );
}

function ControlSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="control-section"><h2>{title}</h2>{children}</section>;
}
