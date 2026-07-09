"use client";

import { PointerEvent as ReactPointerEvent, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ImageUp, LoaderCircle, Save } from "lucide-react";
import { Logo } from "@/components/logo";
import { layouts } from "@/lib/frames";
import type { FrameSlot, LayoutId } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { assetExtension, validateImageAsset, type ValidatedImage } from "@/lib/assets";
import { useCatalog } from "@/components/catalog-provider";

export function FrameBuilder() {
  const { refresh } = useCatalog();
  const [title, setTitle] = useState("My private frame");
  const [layoutId, setLayoutId] = useState<LayoutId>("strip");
  const [background, setBackground] = useState("#ef3b2d");
  const [foreground, setForeground] = useState("#ffffff");
  const [overlay, setOverlay] = useState<File | null>(null);
  const [validatedOverlay, setValidatedOverlay] = useState<ValidatedImage | null>(null);
  const [overlayUrl, setOverlayUrl] = useState("");
  const [slots, setSlots] = useState<FrameSlot[]>(() => layouts.strip.slots.map(slot => ({ ...slot })));
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const dragRef = useRef<{ index: number; pointerX: number; pointerY: number; x: number; y: number } | null>(null);
  const layout = layouts[layoutId];

  const changeLayout = (id: LayoutId) => {
    setLayoutId(id);
    setSlots(layouts[id].slots.map(slot => ({ ...slot })));
    setSelectedSlot(0);
  };

  const updateSlot = (index: number, patch: Partial<FrameSlot>) => {
    setSlots(current => current.map((slot, slotIndex) => slotIndex === index ? { ...slot, ...patch } : slot));
  };

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>, index: number) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const slot = slots[index];
    setSelectedSlot(index);
    dragRef.current = { index, pointerX: event.clientX, pointerY: event.clientY, x: slot.x, y: slot.y };
  };

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const slot = slots[drag.index];
    const x = Math.max(0, Math.min(layout.width - slot.width, drag.x + (event.clientX - drag.pointerX) / rect.width * layout.width));
    const y = Math.max(0, Math.min(layout.height - slot.height, drag.y + (event.clientY - drag.pointerY) / rect.height * layout.height));
    updateSlot(drag.index, { x: Math.round(x), y: Math.round(y) });
  };

  const chooseOverlay = async (file?: File) => {
    if (!file) return;
    try {
      const image = await validateImageAsset(file);
      if (validatedOverlay) URL.revokeObjectURL(validatedOverlay.previewUrl);
      setValidatedOverlay(image);
      setOverlay(file);
      setOverlayUrl(image.previewUrl);
      setNotice("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not read overlay");
    }
  };

  const saveFrame = async () => {
    const supabase = createClient();
    if (!supabase) {
      setNotice("Connect Supabase in .env.local before saving private frames.");
      return;
    }
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login?next=/frames/new";
        return;
      }
      const id = crypto.randomUUID();
      let uploadedPath: string | null = null;
      if (overlay) {
        uploadedPath = `${user.id}/${id}/overlay.${assetExtension(validatedOverlay?.mimeType ?? overlay.type)}`;
        const { error } = await supabase.storage.from("private-frames").upload(uploadedPath, overlay, { contentType: validatedOverlay?.mimeType ?? overlay.type });
        if (error) throw error;
      }
      const { error } = await supabase.from("frame_templates").insert({
        id,
        owner_id: user.id,
        visibility: "private",
        title,
        category: "Custom",
        background,
        foreground,
        canvas_width: layout.width,
        canvas_height: layout.height,
        shot_count: layout.shotCount,
        slots,
        overlay_path: uploadedPath,
        mime_type: validatedOverlay?.mimeType ?? null,
        published: false,
        print_compatible: layoutId === "strip"
      });
      if (error) throw error;
      await refresh();
      setNotice("Private frame saved to your account.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save frame");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="builder-page">
      <header className="builder-header"><Logo href="/frames" /><Link href="/frames"><ArrowLeft size={14} /> Frame library</Link></header>
      <section className="builder-preview">
        <div
          className="custom-frame-preview"
          style={{ aspectRatio: `${layout.width}/${layout.height}`, background, color: foreground }}
          onPointerMove={moveDrag}
          onPointerUp={() => { dragRef.current = null; }}
          onPointerCancel={() => { dragRef.current = null; }}
        >
          {slots.map((slot, index) => (
            <div
              key={index}
              className={selectedSlot === index ? "selected" : ""}
              onPointerDown={event => startDrag(event, index)}
              style={{ left: `${slot.x/layout.width*100}%`, top: `${slot.y/layout.height*100}%`, width: `${slot.width/layout.width*100}%`, height: `${slot.height/layout.height*100}%`, transform: `rotate(${slot.rotation ?? 0}deg)` }}
            >
              PHOTO {index + 1}
            </div>
          ))}
          {overlayUrl && <img src={overlayUrl} alt="Custom transparent overlay preview" />}
          <b>{title}</b>
        </div>
      </section>
      <aside className="builder-controls">
        <p className="kicker">PRIVATE FRAME BUILDER</p><h1>Build a reusable frame.</h1>
        <label>Frame name<input value={title} onChange={event => setTitle(event.target.value)} maxLength={80} /></label>
        <label>Layout<select value={layoutId} onChange={event => changeLayout(event.target.value as LayoutId)}>{Object.keys(layouts).map(id => <option key={id}>{id}</option>)}</select></label>
        <div className="color-pair"><label>Background<input type="color" value={background} onChange={event => setBackground(event.target.value)} /></label><label>Text<input type="color" value={foreground} onChange={event => setForeground(event.target.value)} /></label></div>
        <div className="slot-controls">
          <p>Photo slot {selectedSlot + 1}<span>Drag it directly on the preview</span></p>
          <div className="segmented">{slots.map((_, index) => <button key={index} className={selectedSlot === index ? "active" : ""} onClick={() => setSelectedSlot(index)}>{index + 1}</button>)}</div>
          {slots[selectedSlot] && <>
            <label>Width<input type="range" min="120" max={layout.width - slots[selectedSlot].x} value={slots[selectedSlot].width} onChange={event => updateSlot(selectedSlot, { width: Number(event.target.value) })} /></label>
            <label>Height<input type="range" min="120" max={layout.height - slots[selectedSlot].y} value={slots[selectedSlot].height} onChange={event => updateSlot(selectedSlot, { height: Number(event.target.value) })} /></label>
            <label>Rotation<input type="range" min="-15" max="15" value={slots[selectedSlot].rotation ?? 0} onChange={event => updateSlot(selectedSlot, { rotation: Number(event.target.value) })} /></label>
          </>}
        </div>
        <label className="overlay-drop"><ImageUp /><span><b>Optional frame overlay</b><small>PNG or WebP, maximum 10 MB</small></span><input type="file" accept="image/png,image/webp" onChange={event => void chooseOverlay(event.target.files?.[0])} /></label>
        <button className="button button-solid" onClick={saveFrame} disabled={busy}>{busy ? <LoaderCircle className="spin" /> : <Save size={15} />} Save private frame</button>
        {notice && <p className="editor-notice">{notice}</p>}
      </aside>
    </main>
  );
}
