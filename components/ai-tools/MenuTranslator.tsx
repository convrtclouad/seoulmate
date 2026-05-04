"use client";

import { useState, useRef } from "react";
import { Camera, Upload, X, Loader2, ChefHat, AlertTriangle, Flame } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

interface MenuItem {
  korean: string;
  english: string;
  description: string;
  spiciness: 0 | 1 | 2 | 3;   // 0=none, 1=mild, 2=medium, 3=hot
  allergens: string[];
  price?: string;
}

interface TranslationResult {
  restaurant?: string;
  items: MenuItem[];
}

const SPICINESS_LABELS = ["Not spicy", "Mild", "Medium 🌶️", "Hot 🔥🔥"];
const SPICINESS_COLORS = [
  "text-gray-400",
  "text-yellow-500",
  "text-orange-500",
  "text-red-500",
];

export function MenuTranslator() {
  const [image, setImage]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<TranslationResult | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImage(url);
    setResult(null);
    setError(null);
    translateMenu(file);
  }

  async function translateMenu(file: File) {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/translate", {
        method: "POST",
        body:   formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Translation failed");
      }

      const data: TranslationResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setImage(null);
    setResult(null);
    setError(null);
    if (fileRef.current)   fileRef.current.value   = "";
    if (cameraRef.current) cameraRef.current.value = "";
  }

  return (
    <div className="space-y-4">
      {/* Upload / Camera area */}
      {!image ? (
        <div
          className="border-2 border-dashed border-primary-200 rounded-2xl
                     bg-primary-50/50 flex flex-col items-center justify-center
                     py-12 gap-4"
        >
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <ChefHat className="h-8 w-8 text-primary-400" />
          </div>
          <p className="text-sm font-semibold text-gray-600 text-center px-4">
            Take a photo of a Korean menu to get instant translations
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => cameraRef.current?.click()}
              className="btn-primary"
            >
              <Camera className="h-4 w-4" />
              Camera
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="btn-secondary"
            >
              <Upload className="h-4 w-4" />
              Upload
            </button>
          </div>

          {/* Hidden inputs */}
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFile}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt="Menu"
            className="w-full max-h-64 object-cover"
          />
          <button
            onClick={reset}
            className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white"
          >
            <X className="h-4 w-4" />
          </button>
          {loading && (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
              <p className="text-white text-sm font-semibold">Translating...</p>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-3 animate-slide-up">
          {result.restaurant && (
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {result.restaurant}
            </p>
          )}
          {result.items.map((item, idx) => (
            <Card key={idx} hover>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">{item.english}</p>
                  <p className="text-sm text-gray-500 font-medium">{item.korean}</p>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                {item.price && (
                  <span className="currency-krw whitespace-nowrap">{item.price}</span>
                )}
              </div>

              {/* Spiciness */}
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <div className={cn("flex items-center gap-1 text-xs font-semibold", SPICINESS_COLORS[item.spiciness])}>
                  <Flame className="h-3.5 w-3.5" />
                  {SPICINESS_LABELS[item.spiciness]}
                </div>

                {/* Allergens */}
                {item.allergens.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.allergens.map((a) => (
                      <span key={a} className="badge bg-amber-50 text-amber-600 border border-amber-100">
                        ⚠️ {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}

          <Button variant="secondary" onClick={reset} className="w-full">
            Translate Another Menu
          </Button>
        </div>
      )}
    </div>
  );
}
