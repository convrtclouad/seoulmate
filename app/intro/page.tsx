"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

const FRIENDS = [
  { id: "bryan",  name: "Bryan",  emoji: "🧑‍💻", color: "from-emerald-400 to-teal-500",   bg: "bg-emerald-50",  ring: "ring-emerald-400" },
  { id: "sarah",  name: "Sarah",  emoji: "👩‍🎨", color: "from-violet-400 to-purple-500",   bg: "bg-violet-50",   ring: "ring-violet-400" },
  { id: "mike",   name: "Mike",   emoji: "🧑‍🍳", color: "from-orange-400 to-amber-500",    bg: "bg-orange-50",   ring: "ring-orange-400" },
  { id: "priya",  name: "Priya",  emoji: "👩‍✈️", color: "from-rose-400 to-pink-500",       bg: "bg-rose-50",     ring: "ring-rose-400" },
];

const TRIP_DATES = "May 8 – May 16, 2026";
const TRIP_DAYS_LEFT = (() => {
  const diff = Math.ceil((new Date("2026-05-08").getTime() - Date.now()) / 86400000);
  return diff > 0 ? diff : 0;
})();

export default function IntroPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    // If already chose a user, go straight to home
    const stored = localStorage.getItem("seoulmate_user");
    if (stored) {
      router.replace("/home");
    }
  }, [router]);

  function handleSelect(id: string) {
    setSelected(id);
  }

  function handleEnter() {
    if (!selected) return;
    setEntering(true);
    localStorage.setItem("seoulmate_user", selected);
    const friend = FRIENDS.find(f => f.id === selected);
    if (friend) {
      localStorage.setItem("seoulmate_user_name", friend.name);
      localStorage.setItem("seoulmate_user_emoji", friend.emoji);
    }
    setTimeout(() => router.push("/home"), 400);
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Top hero */}
      <div className="bg-forest px-6 pt-16 pb-10 flex flex-col items-center text-center relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-forest-light/40" />
        <div className="absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-forest-light/30" />

        <div className="relative z-10">
          <div className="text-6xl mb-3 animate-bounce-sm">🇰🇷</div>
          <h1 className="text-4xl font-black text-white tracking-tight">SeoulMate</h1>
          <p className="text-forest-pale text-sm mt-2 font-medium">Your Korea Trip Companion</p>

          <div className="mt-5 inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-2">
            <span className="text-white/80 text-xs font-medium">✈️ {TRIP_DATES}</span>
            {TRIP_DAYS_LEFT > 0 && (
              <span className="bg-forest-soft text-forest text-xs font-bold rounded-full px-2 py-0.5">
                {TRIP_DAYS_LEFT}d left
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Friend picker */}
      <div className="flex-1 px-5 pt-8 pb-10">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-gray-900">Who are you?</h2>
          <p className="text-sm text-neutral-500 mt-1">Pick your profile to get started</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {FRIENDS.map((friend) => {
            const isSelected = selected === friend.id;
            return (
              <button
                key={friend.id}
                onClick={() => handleSelect(friend.id)}
                className={`
                  relative flex flex-col items-center gap-3 rounded-3xl p-5
                  bg-surface shadow-card transition-all duration-200 active:scale-95
                  ${isSelected ? `ring-2 ${friend.ring} shadow-card-hover` : "hover:shadow-card-hover"}
                `}
              >
                {/* Checkmark */}
                {isSelected && (
                  <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-forest flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </div>
                )}

                {/* Avatar */}
                <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${friend.color} flex items-center justify-center text-3xl shadow-sm`}>
                  {friend.emoji}
                </div>

                <span className="font-bold text-gray-900 text-base">{friend.name}</span>
              </button>
            );
          })}
        </div>

        {/* Enter button */}
        <button
          onClick={handleEnter}
          disabled={!selected || entering}
          className={`
            w-full py-4 rounded-2xl text-base font-bold
            transition-all duration-300 active:scale-95
            ${selected
              ? "bg-forest text-white shadow-float hover:bg-forest-light"
              : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
            }
          `}
        >
          {entering ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              Entering…
            </span>
          ) : selected ? (
            `Let's go, ${FRIENDS.find(f => f.id === selected)?.name}! 🚀`
          ) : (
            "Choose your profile"
          )}
        </button>

        {/* Footer note */}
        <p className="text-center text-xs text-neutral-400 mt-5">
          All friends share the same trip data · No passwords needed
        </p>
      </div>
    </div>
  );
}
