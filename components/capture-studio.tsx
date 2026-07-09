"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ChevronDown, Lightbulb, RefreshCw, RotateCcw, Sparkles, Timer, Video } from "lucide-react";
import { useBooth } from "@/components/booth-provider";

type PermissionState = "idle" | "requesting" | "ready" | "denied" | "missing" | "error";

export function CaptureStudio() {
  const router = useRouter();
  const { draft, update, hydrated } = useBooth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cancelledRef = useRef(false);
  const [permission, setPermission] = useState<PermissionState>("idle");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [flashing, setFlashing] = useState(false);
  const [message, setMessage] = useState("");

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async (deviceId?: string) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermission("missing");
      return;
    }
    setPermission("requesting");
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          facingMode: deviceId ? undefined : "user",
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const list = await navigator.mediaDevices.enumerateDevices();
      const cameras = list.filter((item) => item.kind === "videoinput");
      setDevices(cameras);
      const selected = stream.getVideoTracks()[0]?.getSettings().deviceId ?? "";
      update({ settings: { ...draft.settings, deviceId: selected } });
      setPermission("ready");
      setMessage("");
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      setPermission(name === "NotAllowedError" ? "denied" : "error");
      setMessage(name === "NotAllowedError"
        ? "Camera access was denied. Allow it in your browser settings and try again."
        : "The camera could not be started. Another app may be using it.");
    }
  }, [draft.settings, stopCamera, update]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const setSetting = <K extends keyof typeof draft.settings>(key: K, value: (typeof draft.settings)[K]) => {
    update({ settings: { ...draft.settings, [key]: value } });
  };

  const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return null;
    if (draft.settings.mirrored) {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.94);
  }, [draft.settings.mirrored]);

  const runSession = async () => {
    if (permission !== "ready" || running) return;
    cancelledRef.current = false;
    setRunning(true);
    const captures: string[] = [];
    for (let shot = 0; shot < draft.settings.shotCount; shot += 1) {
      if (cancelledRef.current) break;
      for (let tick = draft.settings.timer; tick > 0; tick -= 1) {
        setCountdown(tick);
        await wait(850);
        if (cancelledRef.current) break;
      }
      if (cancelledRef.current) break;
      setCountdown(null);
      const frame = captureFrame();
      if (frame) captures.push(frame);
      if (draft.settings.flash) {
        setFlashing(true);
        await wait(150);
        setFlashing(false);
      }
      setMessage(`Captured ${captures.length} of ${draft.settings.shotCount}`);
      await wait(550);
    }
    setCountdown(null);
    setRunning(false);
    if (!cancelledRef.current && captures.length) {
      update({ captures });
      stopCamera();
      router.push("/studio/edit/layout");
    }
  };

  const cancelSession = () => {
    cancelledRef.current = true;
    setCountdown(null);
    setRunning(false);
    setMessage("Session cancelled. Take a breath and try again.");
  };

  if (!hydrated) return <div className="studio-loading">Loading your booth…</div>;

  const ringAlpha = draft.settings.ringLight ? draft.settings.ringIntensity / 100 : 0;
  const ringColor = `rgba(255, ${238 - draft.settings.ringWarmth}, ${198 - draft.settings.ringWarmth}, ${ringAlpha})`;

  return (
    <main className="capture-page">
      <div className="camera-workspace">
        <div className="camera-viewport" style={{ boxShadow: `inset 0 0 90px 35px ${ringColor}` }}>
          <video
            ref={videoRef}
            playsInline
            muted
            className={draft.settings.mirrored ? "mirrored" : ""}
          />
          {permission !== "ready" && (
            <div className="camera-empty">
              <Camera size={58} />
              <h1>{permission === "denied" ? "Camera blocked" : "Your camera is off"}</h1>
              <p>{message || "Nothing is recorded until you press start."}</p>
              <button className="button button-solid" onClick={() => startCamera(draft.settings.deviceId)}>
                {permission === "requesting" ? "Requesting…" : "Enable camera"}
              </button>
            </div>
          )}
          {countdown !== null && <div className="capture-countdown">{countdown}</div>}
          <div className={`camera-flash ${flashing ? "active" : ""}`} />
          {permission === "ready" && !running && (
            <button className="capture-start" onClick={runSession}>
              <i /><span>Start session</span><small>{draft.settings.shotCount} shots · {draft.settings.timer}s timer</small>
            </button>
          )}
          {running && <button className="cancel-capture" onClick={cancelSession}>Cancel session</button>}
          {message && permission === "ready" && <p className="capture-message">{message}</p>}
        </div>
      </div>

      <aside className="camera-controls">
        <div className="controls-title"><p className="kicker">CAMERA SETUP</p><span>Local & private</span></div>
        <div className="control-grid">
          <label className="control-field">
            <span><Video size={14} /> Camera source</span>
            <div className="select-wrap">
              <select value={draft.settings.deviceId} onChange={(event) => {
                setSetting("deviceId", event.target.value);
                void startCamera(event.target.value);
              }}>
                <option value="">Default camera</option>
                {devices.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${index + 1}`}</option>)}
              </select><ChevronDown size={14} />
            </div>
          </label>
          <div className="control-field">
            <span><RefreshCw size={14} /> Mirror</span>
            <button className={`control-button ${draft.settings.mirrored ? "active" : ""}`} onClick={() => setSetting("mirrored", !draft.settings.mirrored)}>
              <RotateCcw size={15} /> Flip preview
            </button>
          </div>
          <div className="control-field">
            <span><Sparkles size={14} /> Flash</span>
            <button className={`toggle ${draft.settings.flash ? "active" : ""}`} onClick={() => setSetting("flash", !draft.settings.flash)}><i />{draft.settings.flash ? "On" : "Off"}</button>
          </div>
          <div className="control-field">
            <span><Lightbulb size={14} /> Ring light</span>
            <button className={`toggle ${draft.settings.ringLight ? "active" : ""}`} onClick={() => setSetting("ringLight", !draft.settings.ringLight)}><i />{draft.settings.ringLight ? "On" : "Off"}</button>
          </div>
          {draft.settings.ringLight && <>
            <label className="control-field"><span>Intensity <b>{draft.settings.ringIntensity}%</b></span><input type="range" min="10" max="90" value={draft.settings.ringIntensity} onChange={(e) => setSetting("ringIntensity", Number(e.target.value))} /></label>
            <label className="control-field"><span>Warmth <b>{draft.settings.ringWarmth}%</b></span><input type="range" min="0" max="80" value={draft.settings.ringWarmth} onChange={(e) => setSetting("ringWarmth", Number(e.target.value))} /></label>
          </>}
          <label className="control-field">
            <span><Timer size={14} /> Timer</span>
            <div className="segmented">{[0, 3, 5, 10].map(value => <button key={value} className={draft.settings.timer === value ? "active" : ""} onClick={() => setSetting("timer", value)}>{value}s</button>)}</div>
          </label>
          <label className="control-field">
            <span><Camera size={14} /> Total shots</span>
            <div className="segmented">{[1, 3, 4, 5, 6].map(value => <button key={value} className={draft.settings.shotCount === value ? "active" : ""} onClick={() => setSetting("shotCount", value)}>{value}</button>)}</div>
          </label>
        </div>
      </aside>
      <canvas ref={canvasRef} hidden />
    </main>
  );
}
