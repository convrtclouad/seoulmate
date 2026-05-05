"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Camera, Copy, ExternalLink, CheckCircle2, Zap, RefreshCw, ImagePlus } from "lucide-react";
import { tap } from "@/lib/utils/haptics";

// Live TextDetector only works on Android Chrome
const HAS_TEXT_DETECTOR =
  typeof window !== "undefined" && "TextDetector" in window;

/* ─────────────────────────────────────────────────
   PHOTO MODE — iOS + universal fallback
   Each photo is sent fresh → always gives new result
───────────────────────────────────────────────── */
interface MenuItem { korean: string; english: string; description: string; spiciness: number; price?: string }
interface TranslationResult { restaurant?: string | null; items: MenuItem[] }

function PhotoMode() {
  const fileRef                       = useRef<HTMLInputElement>(null);
  const [photoData, setPhotoData]     = useState<string | null>(null);
  const [loading,   setLoading]       = useState(false);
  const [result,    setResult]        = useState<TranslationResult | null>(null);
  const [error,     setError]         = useState("");
  const [copied,    setCopied]        = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = () => setPhotoData(reader.result as string);
    reader.readAsDataURL(file);

    // Clear old result then translate
    setResult(null);
    setError("");
    translateFile(file);

    // Reset so same photo can be re-selected
    e.target.value = "";
  }

  async function translateFile(file: File) {
    setLoading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const res  = await fetch("/api/translate", { method: "POST", body: form });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setResult(json as TranslationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "翻译失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  function retake() { tap(); setPhotoData(null); setResult(null); setError(""); fileRef.current?.click(); }

  const spiceLabel = (n: number) => ["", "微辣", "中辣", "很辣"][n] ?? "";
  const spiceHex   = (n: number) => ["", "#E8A800", "#E87060", "#CC2200"][n] ?? "";

  async function copyAll() {
    if (!result) return;
    const text = result.items
      .map((i) => `${i.korean} → ${i.english}${i.price ? ` (${i.price})` : ""}\n${i.description}`)
      .join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <style>{`
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }
      `}</style>

      {/* Hidden input — retriggers each time */}
      <input ref={fileRef} type="file" accept="image/*" capture="environment"
             className="hidden" onChange={handleFileChange} />

      {!photoData ? (
        <div className="space-y-3">
          <button onClick={() => { tap(); fileRef.current?.click(); }}
            className="w-full rounded-3xl overflow-hidden flex flex-col items-center justify-center gap-4 py-12"
            style={{ background: "linear-gradient(135deg,#EDE8F8,#F3EFF9)", boxShadow: "var(--shadow-card)" }}>
            <div className="h-20 w-20 rounded-3xl bg-lavender/15 flex items-center justify-center">
              <Camera className="h-10 w-10 text-lavender" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-ink">拍照翻译菜单</p>
              <p className="text-xs text-ink-muted mt-1">拍下韩文菜单，AI 自动翻译成中文</p>
            </div>
          </button>

          <div className="rounded-3xl bg-lavender-50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <p className="text-xs font-bold text-lavender mb-2">💡 使用说明</p>
            <ul className="space-y-1.5 text-xs text-ink-muted">
              <li className="flex items-start gap-1.5"><span>📸</span><span>点击上方按钮，拍下菜单照片</span></li>
              <li className="flex items-start gap-1.5"><span>🔄</span><span>每次拍新照片都会重新翻译，不会重复</span></li>
              <li className="flex items-start gap-1.5"><span>✨</span><span>识别菜名、描述、辣度、价格</span></li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Photo preview */}
          <div className="rounded-3xl overflow-hidden relative" style={{ boxShadow: "var(--shadow-card)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoData} alt="menu" className="w-full max-h-64 object-cover" />

            {loading && (
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
                <div className="h-10 w-10 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <p className="text-white text-xs font-bold" style={{ animation: "shimmer 1.2s ease-in-out infinite" }}>
                  AI 翻译中…
                </p>
              </div>
            )}

            <button onClick={retake}
              className="absolute top-3 right-3 flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-white text-xs font-bold"
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}>
              <RefreshCw className="h-3 w-3" /> 重拍
            </button>
          </div>

          {/* Error */}
          {error && !loading && (
            <div className="rounded-3xl bg-petal-50 p-4 flex items-start gap-3" style={{ boxShadow: "var(--shadow-card)" }}>
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-sm font-bold text-petal-400">翻译失败</p>
                <p className="text-xs text-ink-muted mt-0.5">{error}</p>
                <button onClick={retake} className="mt-2 text-xs font-bold text-petal-400 underline">重新拍照</button>
              </div>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <div className="space-y-2.5" style={{ animation: "fadeSlideUp 0.3s ease forwards" }}>
              {result.restaurant && (
                <div className="flex items-center gap-2 px-1">
                  <Zap className="h-3.5 w-3.5 text-lavender shrink-0" />
                  <p className="text-xs font-bold text-lavender">{result.restaurant}</p>
                </div>
              )}
              {result.items.map((item, i) => (
                <div key={i} className="rounded-3xl bg-surface p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <p className="font-black text-ink text-sm">{item.english}</p>
                      <p className="text-xs text-ink-muted">{item.korean}</p>
                    </div>
                    <div className="shrink-0 text-right space-y-1">
                      {item.price && <p className="text-xs font-bold text-ink">{item.price}</p>}
                      {item.spiciness > 0 && (
                        <span className="text-[10px] font-bold rounded-full px-2 py-0.5 inline-block"
                              style={{ background: spiceHex(item.spiciness) + "22", color: spiceHex(item.spiciness) }}>
                          {spiceLabel(item.spiciness)} 🌶
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-ink-muted leading-relaxed">{item.description}</p>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button onClick={copyAll}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold transition-all ${
                    copied ? "bg-sage-100 text-sage-600" : "bg-black/5 text-ink-mid"
                  }`}>
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "已复制" : "复制全部"}
                </button>
                <button onClick={retake}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold bg-lavender-100 text-lavender">
                  <Camera className="h-3.5 w-3.5" /> 拍新照片
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   LIVE MODE — Android Chrome with TextDetector
───────────────────────────────────────────────── */
function LiveMode() {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const [active,       setActive]       = useState(false);
  const [scanning,     setScanning]     = useState(false);
  const [detectedText, setDetectedText] = useState<string>("");
  const [scanCount,    setScanCount]    = useState(0);
  const [copied,       setCopied]       = useState(false);
  const [errorMsg,     setErrorMsg]     = useState("");

  const stopAll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null; timerRef.current = null;
  }, []);

  useEffect(() => () => stopAll(), [stopAll]);

  const scanFrame = useCallback(async () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    setScanCount((n) => n + 1);
    try {
      setScanning(true);
      // Clear first so user sees it's re-scanning
      setDetectedText("");
      const img = new Image();
      img.src = canvas.toDataURL("image/jpeg", 0.8);
      await new Promise<void>((res) => { img.onload = () => res(); });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).TextDetector();
      const results: Array<{ rawValue: string }> = await detector.detect(img);
      const text = results.map((r) => r.rawValue).join("\n").trim();
      if (text) setDetectedText(text);
    } catch { /* silent */ } finally { setScanning(false); }
  }, []);

  async function startCamera() {
    setErrorMsg(""); setDetectedText("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setActive(true);
      timerRef.current = setInterval(scanFrame, 1800);
    } catch { setErrorMsg("无法开启相机，请确认已授权相机权限"); }
  }

  function stopCamera() { stopAll(); setActive(false); setDetectedText(""); setScanCount(0); }

  async function copyText() {
    await navigator.clipboard.writeText(detectedText);
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  }

  function openTranslate() {
    const url = detectedText
      ? `https://translate.google.com/?sl=ko&tl=zh-CN&text=${encodeURIComponent(detectedText)}&op=translate`
      : "https://translate.google.com/?sl=ko&tl=zh-CN&op=images";
    window.open(url, "_blank", "noopener");
  }

  if (!active) {
    return (
      <div className="space-y-3">
        <style>{`
          @keyframes pulse2 { 0%,100%{transform:scale(1);opacity:1;} 50%{transform:scale(1.08);opacity:0.7;} }
        `}</style>
        <button onClick={startCamera}
          className="w-full rounded-3xl flex flex-col items-center justify-center gap-4 py-12"
          style={{ background: "linear-gradient(135deg,#EDE8F8,#F3EFF9)", boxShadow: "var(--shadow-card)" }}>
          <div className="h-20 w-20 rounded-3xl bg-lavender/15 flex items-center justify-center">
            <Camera className="h-10 w-10 text-lavender" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-ink">实时镜头翻译</p>
            <p className="text-xs text-ink-muted mt-1">镜头对准韩文，自动识别并翻译</p>
          </div>
        </button>
        {errorMsg && <p className="text-xs text-petal-400 text-center">{errorMsg}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <style>{`
        @keyframes scanBeam { 0%,100%{top:15%;opacity:0.8;} 50%{top:82%;opacity:0.4;} }
        @keyframes pulse2   { 0%,100%{transform:scale(1);opacity:1;} 50%{transform:scale(1.08);opacity:0.7;} }
      `}</style>
      <div className="rounded-3xl overflow-hidden relative" style={{ boxShadow: "var(--shadow-card)" }}>
        <video ref={videoRef} playsInline muted className="w-full aspect-[4/3] object-cover bg-black" />
        <div style={{ position:"absolute",left:16,right:16,height:2,background:"rgba(139,122,184,0.7)",
          borderRadius:99,animation:"scanBeam 2.4s ease-in-out infinite",pointerEvents:"none" }} />
        <div style={{ position:"absolute",top:12,left:"50%",transform:"translateX(-50%)",
          background:"rgba(0,0,0,0.55)",borderRadius:99,padding:"4px 12px",display:"flex",alignItems:"center",gap:6 }}>
          <div style={{ width:6,height:6,borderRadius:"50%",
            background: scanning ? "#A78BFA" : detectedText ? "#86EFAC" : "#A78BFA",
            animation:"pulse2 1.2s ease-in-out infinite" }} />
          <span style={{ fontSize:10,color:"rgba(255,255,255,0.85)",fontWeight:600 }}>
            {scanning ? "识别中…" : detectedText ? "已检测到文字" : `扫描中 (${scanCount})`}
          </span>
        </div>
        <button onClick={stopCamera} style={{ position:"absolute",bottom:12,right:12,
          background:"rgba(0,0,0,0.5)",border:"none",borderRadius:99,padding:"6px 14px",
          color:"white",fontSize:11,fontWeight:700,cursor:"pointer" }}>停止</button>
      </div>

      {detectedText ? (
        <div className="rounded-3xl bg-surface p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-3.5 w-3.5 text-lavender" />
            <p className="text-xs font-bold text-lavender uppercase tracking-wider">识别到的文字</p>
          </div>
          <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap font-medium">{detectedText}</p>
          <div className="flex gap-2 mt-3">
            <button onClick={copyText}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-bold ${
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
        <div className="rounded-3xl bg-surface p-4 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
          <RefreshCw className="h-6 w-6 text-lavender/40 mx-auto mb-2" style={{ animation:"pulse2 1.6s ease-in-out infinite" }} />
          <p className="text-xs font-bold text-ink-mid">将镜头对准韩文</p>
          <p className="text-xs text-ink-faint mt-0.5">识别到文字后将自动显示</p>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Main export — tab switcher
───────────────────────────────────────────────── */
export function CameraTranslator() {
  const [mode, setMode] = useState<"photo" | "live">(HAS_TEXT_DETECTOR ? "live" : "photo");

  return (
    <div className="space-y-3">
      <div className="tab-bar">
        <button onClick={() => { tap(); setMode("photo"); }}
          className={mode === "photo" ? "tab-item-active" : "tab-item-inactive"}>
          <ImagePlus className="h-4 w-4" />
          <span className="text-xs font-bold">拍照翻译</span>
        </button>
        <button onClick={() => { tap(); setMode("live"); }}
          className={mode === "live" ? "tab-item-active" : "tab-item-inactive"}>
          <Camera className="h-4 w-4" />
          <span className="text-xs font-bold">实时镜头</span>
          {!HAS_TEXT_DETECTOR && (
            <span className="ml-0.5 text-[9px] bg-ginger-100 text-ginger-500 rounded-full px-1.5 py-0.5 font-bold">Android</span>
          )}
        </button>
      </div>
      {mode === "photo" ? <PhotoMode /> : <LiveMode />}
    </div>
  );
}
