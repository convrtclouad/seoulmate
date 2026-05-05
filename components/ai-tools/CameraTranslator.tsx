"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Camera, Copy, ExternalLink, CheckCircle2, Zap, RefreshCw } from "lucide-react";

type Stage = "idle" | "live" | "error";

// Declare experimental TextDetector API
declare class TextDetector {
  detect(source: ImageBitmapSource): Promise<Array<{ rawValue: string; boundingBox: DOMRectReadOnly }>>;
}

const HAS_TEXT_DETECTOR = typeof window !== "undefined" && "TextDetector" in window;

export function CameraTranslator() {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const [stage,        setStage]        = useState<Stage>("idle");
  const [scanning,     setScanning]     = useState(false);
  const [detectedText, setDetectedText] = useState<string>("");
  const [scanCount,    setScanCount]    = useState(0);
  const [copied,       setCopied]       = useState(false);
  const [errorMsg,     setErrorMsg]     = useState("");

  /* ── Stop everything ── */
  const stopAll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    timerRef.current  = null;
  }, []);

  useEffect(() => () => stopAll(), [stopAll]);

  /* ── Scan one frame ── */
  const scanFrame = useCallback(async () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d")?.drawImage(video, 0, 0);

    setScanCount((n) => n + 1);

    if (!HAS_TEXT_DETECTOR) return;

    try {
      setScanning(true);
      const img = new Image();
      img.src = canvas.toDataURL("image/jpeg", 0.8);
      await new Promise<void>((res) => { img.onload = () => res(); });

      // @ts-expect-error – experimental
      const detector = new TextDetector();
      const results: Array<{ rawValue: string }> = await detector.detect(img);
      const text = results.map((r) => r.rawValue).join("\n").trim();
      if (text) setDetectedText(text);
    } catch {
      // silent
    } finally {
      setScanning(false);
    }
  }, []);

  /* ── Start camera ── */
  const startCamera = useCallback(async () => {
    setErrorMsg("");
    setDetectedText("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStage("live");

      // Start continuous scan every 1.6 seconds
      timerRef.current = setInterval(scanFrame, 1600);
    } catch {
      setErrorMsg("无法开启相机，请确认已授权相机权限");
      setStage("error");
    }
  }, [scanFrame]);

  /* ── Stop camera ── */
  function stopCamera() {
    stopAll();
    setStage("idle");
    setDetectedText("");
    setScanCount(0);
  }

  /* ── Copy text ── */
  async function copyText() {
    await navigator.clipboard.writeText(detectedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  /* ── Open Google Translate ── */
  function openTranslate() {
    const url = detectedText
      ? `https://translate.google.com/?sl=ko&tl=zh-CN&text=${encodeURIComponent(detectedText)}&op=translate`
      : "https://translate.google.com/?sl=ko&tl=zh-CN&op=images";
    window.open(url, "_blank", "noopener");
  }

  return (
    <div className="space-y-4">
      <style>{`
        @keyframes scanBeam { 0%,100%{top:15%;opacity:0.8;} 50%{top:82%;opacity:0.4;} }
        @keyframes pulse2   { 0%,100%{transform:scale(1);opacity:1;} 50%{transform:scale(1.08);opacity:0.7;} }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(10px);} to{opacity:1;transform:translateY(0);} }
      `}</style>

      {/* ── IDLE ── */}
      {stage === "idle" && (
        <div className="space-y-3">
          <div className="rounded-3xl bg-surface overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
            {/* Preview area */}
            <div className="aspect-[4/3] bg-gradient-to-br from-lavender-50 to-lavender-100 flex flex-col items-center justify-center gap-4">
              <div className="h-20 w-20 rounded-3xl bg-lavender/15 flex items-center justify-center">
                <Camera className="h-10 w-10 text-lavender" />
              </div>
              <div className="text-center px-8">
                <p className="text-sm font-bold text-ink">实时镜头翻译</p>
                <p className="text-xs text-ink-muted mt-1">镜头对准韩文，自动识别并翻译</p>
              </div>
            </div>
            <div className="p-4">
              {errorMsg && <p className="text-xs text-petal-400 mb-3 text-center">{errorMsg}</p>}
              <button onClick={startCamera} className="btn-primary w-full">
                <Camera className="h-4 w-4" /> 开启实时扫描
              </button>
            </div>
          </div>

          {/* Platform notes */}
          <div className="rounded-3xl bg-lavender-50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <p className="text-xs font-bold text-lavender mb-2">💡 使用说明</p>
            <ul className="space-y-1.5 text-xs text-ink-muted">
              <li className="flex items-start gap-1.5"><span>🤖</span><span><b>Android Chrome</b>：支持全自动实时文字识别</span></li>
              <li className="flex items-start gap-1.5"><span>📱</span><span><b>iOS</b>：开启后对准文字，点击"Google 翻译"按钮</span></li>
              <li className="flex items-start gap-1.5"><span>✨</span><span>也可用 iOS 相机 App 的「实况文字」功能直接翻译</span></li>
            </ul>
          </div>
        </div>
      )}

      {/* ── LIVE ── */}
      {stage === "live" && (
        <div className="space-y-3">
          {/* Camera viewfinder */}
          <div className="rounded-3xl overflow-hidden relative" style={{ boxShadow: "var(--shadow-card)" }}>
            <video
              ref={videoRef}
              playsInline muted
              className="w-full aspect-[4/3] object-cover bg-black"
            />

            {/* Scan beam */}
            <div style={{
              position: "absolute", left: 16, right: 16, height: 2,
              background: "rgba(139,122,184,0.7)",
              borderRadius: 99,
              animation: "scanBeam 2.4s ease-in-out infinite",
              pointerEvents: "none",
            }} />

            {/* Corner brackets */}
            {[
              { top: 12, left: 12,  borderTop: true,  borderLeft: true  },
              { top: 12, right: 12, borderTop: true,  borderRight: true },
              { bottom: 12, left: 12,  borderBottom: true, borderLeft: true  },
              { bottom: 12, right: 12, borderBottom: true, borderRight: true },
            ].map((corner, i) => (
              <div key={i} style={{
                position: "absolute",
                top: corner.top, left: corner.left, right: corner.right, bottom: corner.bottom,
                width: 22, height: 22,
                borderTop:    corner.borderTop    ? "2.5px solid rgba(139,122,184,0.8)" : undefined,
                borderLeft:   corner.borderLeft   ? "2.5px solid rgba(139,122,184,0.8)" : undefined,
                borderRight:  corner.borderRight  ? "2.5px solid rgba(139,122,184,0.8)" : undefined,
                borderBottom: corner.borderBottom ? "2.5px solid rgba(139,122,184,0.8)" : undefined,
                borderRadius: 3,
                pointerEvents: "none",
              }} />
            ))}

            {/* Status badge */}
            <div style={{
              position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
              background: "rgba(0,0,0,0.55)", borderRadius: 99,
              padding: "4px 12px",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: scanning ? "#A78BFA" : detectedText ? "#86EFAC" : "#A78BFA",
                animation: "pulse2 1.2s ease-in-out infinite",
              }} />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
                {scanning ? "识别中…" : detectedText ? "已检测到文字" : `扫描中 (${scanCount})`}
              </span>
            </div>

            {/* Stop button */}
            <div style={{ position: "absolute", bottom: 12, right: 12 }}>
              <button onClick={stopCamera}
                style={{
                  background: "rgba(0,0,0,0.5)", border: "none",
                  borderRadius: 99, padding: "6px 14px",
                  color: "white", fontSize: 11, fontWeight: 700,
                  cursor: "pointer",
                }}>
                停止
              </button>
            </div>
          </div>

          {/* Detected text panel */}
          {detectedText ? (
            <div className="rounded-3xl bg-surface p-4 animate-[fadeSlideUp_0.3s_ease_forwards]"
                 style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-3.5 w-3.5 text-lavender" />
                <p className="text-xs font-bold text-lavender uppercase tracking-wider">识别到的文字</p>
              </div>
              <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap font-medium">
                {detectedText}
              </p>
              <div className="flex gap-2 mt-3">
                <button onClick={copyText}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-bold transition-all ${
                    copied ? "bg-sage-100 text-sage-600" : "bg-black/5 text-ink-mid"
                  }`}>
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "已复制" : "复制"}
                </button>
                <button onClick={openTranslate}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-bold bg-lavender-100 text-lavender">
                  <ExternalLink className="h-3.5 w-3.5" /> Google 翻译
                </button>
              </div>
            </div>
          ) : (
            /* No text yet — show placeholder + iOS instructions */
            <div className="rounded-3xl bg-surface p-4 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
              <div style={{ animation: "pulse2 1.6s ease-in-out infinite" }}>
                <RefreshCw className="h-6 w-6 text-lavender/40 mx-auto mb-2" />
              </div>
              <p className="text-xs font-bold text-ink-mid">将镜头对准韩文</p>
              <p className="text-xs text-ink-faint mt-0.5">识别到文字后将自动显示</p>
              {!HAS_TEXT_DETECTOR && (
                <div className="mt-3 text-left rounded-2xl bg-lavender-50 p-3">
                  <p className="text-[11px] text-lavender font-bold mb-1">📱 iOS 提示</p>
                  <p className="text-[10px] text-ink-muted leading-relaxed">
                    此设备不支持自动识别。点击下方「Google 翻译」按钮，然后选择"拍照翻译"功能。
                  </p>
                  <button onClick={openTranslate}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-2xl py-2 text-xs font-bold bg-lavender text-white">
                    <ExternalLink className="h-3 w-3" /> 打开 Google 翻译
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── ERROR ── */}
      {stage === "error" && (
        <div className="rounded-3xl bg-surface p-6 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
          <p className="text-2xl mb-2">📵</p>
          <p className="text-sm font-bold text-ink">{errorMsg || "无法开启相机"}</p>
          <button onClick={() => { setStage("idle"); setErrorMsg(""); }} className="btn-secondary mt-4 mx-auto">
            重试
          </button>
        </div>
      )}

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
