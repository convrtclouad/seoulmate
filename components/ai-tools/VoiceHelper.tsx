"use client";

import { useState } from "react";
import { Volume2, Star } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { KoreanPhrase } from "@/types";
import { cn } from "@/lib/utils/cn";

const PHRASES: KoreanPhrase[] = [
  // Taxi
  { id: "t1", category: "taxi", korean: "여기로 가주세요", romanized: "Yeogi-ro ga-juseyo", translation: "Please take me here (show map)" },
  { id: "t2", category: "taxi", korean: "얼마예요?", romanized: "Eolma-yeyo?", translation: "How much is it?" },
  { id: "t3", category: "taxi", korean: "빨리 가주세요", romanized: "Ppalli ga-juseyo", translation: "Please hurry" },
  { id: "t4", category: "taxi", korean: "여기서 세워주세요", romanized: "Yeogiseo sewo-juseyo", translation: "Please stop here" },
  // Restaurant
  { id: "r1", category: "restaurant", korean: "이거 주세요", romanized: "Igeo juseyo", translation: "I'll have this one (point)" },
  { id: "r2", category: "restaurant", korean: "맵지 않게 해주세요", romanized: "Maepji anke hae-juseyo", translation: "Please make it not spicy" },
  { id: "r3", category: "restaurant", korean: "계산해 주세요", romanized: "Gyesan-hae juseyo", translation: "Check please / Bill please" },
  { id: "r4", category: "restaurant", korean: "맛있어요!", romanized: "Massi-sseoyo!", translation: "It's delicious!" },
  { id: "r5", category: "restaurant", korean: "물 주세요", romanized: "Mul juseyo", translation: "Water please" },
  // Shopping
  { id: "s1", category: "shopping", korean: "이거 얼마예요?", romanized: "Igeo eolma-yeyo?", translation: "How much is this?" },
  { id: "s2", category: "shopping", korean: "깎아 주세요", romanized: "Kkakka juseyo", translation: "Can you give me a discount?" },
  { id: "s3", category: "shopping", korean: "입어봐도 돼요?", romanized: "Ibeo-bwado dwaeyo?", translation: "Can I try this on?" },
  // Emergency
  { id: "e1", category: "emergency", korean: "도와주세요!", romanized: "Dowa-juseyo!", translation: "Help!" },
  { id: "e2", category: "emergency", korean: "병원에 가야 해요", romanized: "Byeongwone gaya haeyo", translation: "I need to go to the hospital" },
  { id: "e3", category: "emergency", korean: "경찰을 불러주세요", romanized: "Gyeongchal-eul bulleo-juseyo", translation: "Please call the police" },
  // Greetings
  { id: "g1", category: "greeting", korean: "안녕하세요", romanized: "Annyeonghaseyo", translation: "Hello / Good day" },
  { id: "g2", category: "greeting", korean: "감사합니다", romanized: "Gamsahamnida", translation: "Thank you" },
  { id: "g3", category: "greeting", korean: "죄송합니다", romanized: "Joesonghamnida", translation: "I'm sorry / Excuse me" },
  { id: "g4", category: "greeting", korean: "영어 할 줄 아세요?", romanized: "Yeongeo hal jul aseyo?", translation: "Do you speak English?" },
];

const CATEGORIES = [
  { value: "all",        label: "All",       emoji: "🌟" },
  { value: "taxi",       label: "Taxi",      emoji: "🚕" },
  { value: "restaurant", label: "Food",      emoji: "🍜" },
  { value: "shopping",   label: "Shop",      emoji: "🛍️" },
  { value: "emergency",  label: "Emergency", emoji: "🆘" },
  { value: "greeting",   label: "Greetings", emoji: "👋" },
] as const;

type Category = (typeof CATEGORIES)[number]["value"];

export function VoiceHelper() {
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [playing, setPlaying]               = useState<string | null>(null);
  const [favorites, setFavorites]           = useState<Set<string>>(new Set());

  const filtered = activeCategory === "all"
    ? PHRASES
    : PHRASES.filter((p) => p.category === activeCategory);

  function speak(phrase: KoreanPhrase) {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-Speech not supported in your browser.");
      return;
    }

    window.speechSynthesis.cancel();
    setPlaying(phrase.id);

    const utterance = new SpeechSynthesisUtterance(phrase.korean);
    utterance.lang  = "ko-KR";
    utterance.rate  = 0.85;
    utterance.pitch = 1;

    // Prefer Korean voice if available
    const voices   = window.speechSynthesis.getVoices();
    const korVoice = voices.find((v) => v.lang.startsWith("ko"));
    if (korVoice) utterance.voice = korVoice;

    utterance.onend   = () => setPlaying(null);
    utterance.onerror = () => setPlaying(null);

    window.speechSynthesis.speak(utterance);
  }

  function toggleFavorite(id: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map(({ value, label, emoji }) => (
          <button
            key={value}
            onClick={() => setActiveCategory(value)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap border transition-all shrink-0",
              activeCategory === value
                ? "bg-primary-500 text-white border-primary-500"
                : "bg-white text-gray-600 border-gray-200"
            )}
          >
            <span>{emoji}</span> {label}
          </button>
        ))}
      </div>

      {/* Phrase cards */}
      <div className="space-y-2">
        {filtered.map((phrase) => (
          <Card key={phrase.id} className="flex items-center gap-3">
            {/* TTS button */}
            <button
              onClick={() => speak(phrase)}
              className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-all",
                playing === phrase.id
                  ? "bg-primary-500 text-white scale-95"
                  : "bg-primary-50 text-primary-500 hover:bg-primary-100"
              )}
              aria-label={`Say: ${phrase.translation}`}
            >
              <Volume2 className={cn(
                "h-5 w-5",
                playing === phrase.id && "animate-pulse"
              )} />
            </button>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold text-gray-900 leading-tight">
                {phrase.korean}
              </p>
              <p className="text-xs text-primary-500 font-medium">{phrase.romanized}</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{phrase.translation}</p>
            </div>

            {/* Favorite */}
            <button
              onClick={() => toggleFavorite(phrase.id)}
              className="shrink-0 tap-target flex items-center justify-center"
              aria-label="Favorite"
            >
              <Star
                className={cn(
                  "h-4 w-4 transition-colors",
                  favorites.has(phrase.id)
                    ? "fill-amber-400 text-amber-400"
                    : "text-gray-200"
                )}
              />
            </button>
          </Card>
        ))}
      </div>

      <p className="text-center text-xs text-gray-300 pb-2">
        Tap the speaker to hear the pronunciation
      </p>
    </div>
  );
}
