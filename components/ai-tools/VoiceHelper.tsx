"use client";

import { useState } from "react";
import { Volume2, Star } from "lucide-react";

interface KoreanPhrase {
  id: string;
  category: string;
  korean: string;
  romanized: string;
  translation: string;
}

const PHRASES: KoreanPhrase[] = [
  { id: "t1", category: "taxi",       korean: "여기로 가주세요",       romanized: "Yeogi-ro ga-juseyo",       translation: "请送我去这里（出示地图）" },
  { id: "t2", category: "taxi",       korean: "얼마예요?",             romanized: "Eolma-yeyo?",               translation: "多少钱？" },
  { id: "t3", category: "taxi",       korean: "빨리 가주세요",          romanized: "Ppalli ga-juseyo",          translation: "请快一点" },
  { id: "t4", category: "taxi",       korean: "여기서 세워주세요",      romanized: "Yeogiseo sewo-juseyo",      translation: "请在这里停车" },
  { id: "r1", category: "restaurant", korean: "이거 주세요",            romanized: "Igeo juseyo",               translation: "我要这个（指菜单）" },
  { id: "r2", category: "restaurant", korean: "맵지 않게 해주세요",     romanized: "Maepji anke hae-juseyo",    translation: "请不要太辣" },
  { id: "r3", category: "restaurant", korean: "계산해 주세요",          romanized: "Gyesan-hae juseyo",         translation: "买单！" },
  { id: "r4", category: "restaurant", korean: "맛있어요!",              romanized: "Massi-sseoyo!",             translation: "很好吃！" },
  { id: "r5", category: "restaurant", korean: "물 주세요",              romanized: "Mul juseyo",                translation: "请给我水" },
  { id: "s1", category: "shopping",   korean: "이거 얼마예요?",         romanized: "Igeo eolma-yeyo?",          translation: "这个多少钱？" },
  { id: "s2", category: "shopping",   korean: "깎아 주세요",            romanized: "Kkakka juseyo",             translation: "可以便宜一点吗？" },
  { id: "s3", category: "shopping",   korean: "입어봐도 돼요?",         romanized: "Ibeo-bwado dwaeyo?",        translation: "可以试穿吗？" },
  { id: "e1", category: "emergency",  korean: "도와주세요!",            romanized: "Dowa-juseyo!",              translation: "救命！" },
  { id: "e2", category: "emergency",  korean: "병원에 가야 해요",       romanized: "Byeongwone gaya haeyo",     translation: "我需要去医院" },
  { id: "e3", category: "emergency",  korean: "경찰을 불러주세요",      romanized: "Gyeongchal-eul bulleo-juseyo", translation: "请帮我叫警察" },
  { id: "g1", category: "greeting",   korean: "안녕하세요",             romanized: "Annyeonghaseyo",            translation: "你好" },
  { id: "g2", category: "greeting",   korean: "감사합니다",             romanized: "Gamsahamnida",              translation: "谢谢" },
  { id: "g3", category: "greeting",   korean: "죄송합니다",             romanized: "Joesonghamnida",            translation: "对不起 / 不好意思" },
  { id: "g4", category: "greeting",   korean: "영어 할 줄 아세요?",     romanized: "Yeongeo hal jul aseyo?",    translation: "你会说英语吗？" },
];

const CATEGORIES = [
  { value: "all",        label: "全部",   emoji: "🌟" },
  { value: "taxi",       label: "的士",   emoji: "🚕" },
  { value: "restaurant", label: "餐厅",   emoji: "🍜" },
  { value: "shopping",   label: "购物",   emoji: "🛍️" },
  { value: "emergency",  label: "紧急",   emoji: "🆘" },
  { value: "greeting",   label: "日常",   emoji: "👋" },
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
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setPlaying(phrase.id);
    const utterance  = new SpeechSynthesisUtterance(phrase.korean);
    utterance.lang   = "ko-KR";
    utterance.rate   = 0.85;
    utterance.pitch  = 1;
    const voices     = window.speechSynthesis.getVoices();
    const korVoice   = voices.find((v) => v.lang.startsWith("ko"));
    if (korVoice) utterance.voice = korVoice;
    utterance.onend  = () => setPlaying(null);
    utterance.onerror = () => setPlaying(null);
    window.speechSynthesis.speak(utterance);
  }

  function toggleFav(id: string) {
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
          <button key={value} onClick={() => setActiveCategory(value)}
            className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
              activeCategory === value
                ? "bg-sage text-white"
                : "bg-surface text-ink-muted"
            }`}
            style={{ boxShadow: "var(--shadow-card)" }}>
            <span>{emoji}</span>{label}
          </button>
        ))}
      </div>

      {/* Phrase cards */}
      <div className="space-y-2.5">
        {filtered.map((phrase) => (
          <div key={phrase.id} className="rounded-3xl bg-surface p-3.5 flex items-center gap-3"
               style={{ boxShadow: "var(--shadow-card)" }}>
            {/* TTS button */}
            <button onClick={() => speak(phrase)}
              className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                playing === phrase.id
                  ? "bg-sage text-white scale-95"
                  : "bg-sage-100 text-sage-600"
              }`}>
              <Volume2 className={`h-5 w-5 ${playing === phrase.id ? "animate-pulse" : ""}`} />
            </button>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-xl font-black text-ink leading-tight">{phrase.korean}</p>
              <p className="text-xs text-sage-500 font-medium mt-0.5">{phrase.romanized}</p>
              <p className="text-xs text-ink-muted mt-0.5 truncate">{phrase.translation}</p>
            </div>

            {/* Favorite */}
            <button onClick={() => toggleFav(phrase.id)}
              className="shrink-0 p-2 rounded-xl transition-colors">
              <Star className={`h-4 w-4 transition-colors ${
                favorites.has(phrase.id) ? "fill-ginger-400 text-ginger-400" : "text-ink-faint"
              }`} />
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-ink-faint pb-2">
        点击喇叭图标听韩文发音 🔊
      </p>
    </div>
  );
}
