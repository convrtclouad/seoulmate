"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const PETALS = [
  { left: "15%", delay: "0s",    dur: "3.2s", size: 18 },
  { left: "35%", delay: "0.5s",  dur: "2.8s", size: 14 },
  { left: "55%", delay: "1.1s",  dur: "3.5s", size: 20 },
  { left: "72%", delay: "0.3s",  dur: "3.0s", size: 16 },
  { left: "88%", delay: "1.6s",  dur: "2.6s", size: 12 },
  { left: "8%",  delay: "1.9s",  dur: "3.3s", size: 15 },
  { left: "48%", delay: "0.8s",  dur: "2.9s", size: 17 },
  { left: "62%", delay: "2.2s",  dur: "3.1s", size: 13 },
];

export default function SplashPage() {
  const router  = useRouter();
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 600);
    const t2 = setTimeout(() => setPhase("out"), 2200);
    const t3 = setTimeout(() => {
      const user = localStorage.getItem("seoulmate_user");
      router.replace(user ? "/home" : "/intro");
    }, 2700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [router]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #FDF6F0 0%, #F9F8F4 60%, #F0EDE6 100%)",
        opacity: phase === "out" ? 0 : 1,
        transition: phase === "out" ? "opacity 0.5s ease-out" : "opacity 0.4s ease-in",
      }}
    >
      <style>{`
        @keyframes petalFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          10%  { opacity: 0.8; }
          90%  { opacity: 0.6; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
        @keyframes planeBob {
          0%,100% { transform: translateY(0) rotate(-5deg); }
          50%     { transform: translateY(-14px) rotate(2deg); }
        }
        @keyframes fadeUp {
          0%   { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotPulse {
          0%,100% { opacity: 0.3; transform: scale(0.8); }
          50%     { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Falling cherry blossoms */}
      {PETALS.map((p, i) => (
        <div key={i} style={{
          position: "absolute",
          top: "-30px",
          left: p.left,
          fontSize: p.size,
          animation: `petalFall ${p.dur} ${p.delay} linear infinite`,
          userSelect: "none",
          pointerEvents: "none",
        }}>🌸</div>
      ))}

      {/* Centre content */}
      <div style={{ animation: "fadeUp 0.6s ease-out forwards", textAlign: "center" }}>
        {/* Plane */}
        <div style={{
          fontSize: 72,
          animation: "planeBob 2.4s ease-in-out infinite",
          display: "inline-block",
          marginBottom: 24,
          filter: "drop-shadow(0 8px 24px rgba(232,168,0,0.20))",
        }}>✈️</div>

        {/* Title */}
        <h1 style={{
          fontSize: 34,
          fontWeight: 900,
          color: "#2A2826",
          letterSpacing: "-0.03em",
          marginBottom: 8,
        }}>SeoulMate</h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 13,
          color: "#9C9894",
          fontWeight: 500,
          marginBottom: 36,
        }}>首尔旅游小助手 · 2026</p>

        {/* Healing dots */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: 7, height: 7,
              borderRadius: "50%",
              background: "#E8A800",
              animation: `dotPulse 1.4s ease-in-out ${i * 0.22}s infinite`,
            }} />
          ))}
        </div>
      </div>

      {/* Bottom tagline */}
      <p style={{
        position: "absolute",
        bottom: 48,
        fontSize: 11,
        color: "#C0BDB9",
        fontWeight: 500,
        animation: "fadeUp 0.8s 0.3s ease-out both",
      }}>✨ 一起出发，记录美好 ✨</p>
    </div>
  );
}
