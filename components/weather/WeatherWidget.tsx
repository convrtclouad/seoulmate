"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";

const CITIES = [
  { key: "seoul", label: "首尔", lat: 37.5665, lng: 126.9780 },
  { key: "busan", label: "釜山", lat: 35.1796, lng: 129.0756 },
] as const;

type CityKey = (typeof CITIES)[number]["key"];

interface WeatherData {
  temp: number;
  type: "sunny" | "partly" | "cloudy" | "rainy" | "snowy" | "stormy" | "foggy";
  label: string;
}

function codeToInfo(code: number): { type: WeatherData["type"]; label: string } {
  if (code === 0)         return { type: "sunny",   label: "晴天" };
  if (code === 1)         return { type: "partly",  label: "少云" };
  if (code <= 3)          return { type: "cloudy",  label: "多云" };
  if (code <= 48)         return { type: "foggy",   label: "有雾" };
  if (code <= 57)         return { type: "rainy",   label: "毛毛雨" };
  if (code <= 67)         return { type: "rainy",   label: "下雨" };
  if (code <= 77)         return { type: "snowy",   label: "下雪" };
  if (code <= 82)         return { type: "rainy",   label: "阵雨" };
  if (code <= 86)         return { type: "snowy",   label: "阵雪" };
  return                         { type: "stormy",  label: "雷暴" };
}

/* ── Sky backgrounds ── */
const SKY: Record<WeatherData["type"], { grad: string; textColor: string }> = {
  sunny:  { grad: "linear-gradient(180deg, #4FC3F7 0%, #81D4FA 45%, #FFF9E6 100%)", textColor: "#0B4F7A" },
  partly: { grad: "linear-gradient(180deg, #64B5F6 0%, #90CAF9 45%, #F5F5F5 100%)", textColor: "#1565C0" },
  cloudy: { grad: "linear-gradient(180deg, #90A4AE 0%, #B0BEC5 45%, #ECEFF1 100%)", textColor: "#37474F" },
  rainy:  { grad: "linear-gradient(180deg, #455A64 0%, #607D8B 45%, #CFD8DC 100%)", textColor: "#ECEFF1" },
  snowy:  { grad: "linear-gradient(180deg, #7986CB 0%, #9FA8DA 45%, #E8EAF6 100%)", textColor: "#1A237E" },
  stormy: { grad: "linear-gradient(180deg, #37474F 0%, #546E7A 45%, #90A4AE 100%)", textColor: "#ECEFF1" },
  foggy:  { grad: "linear-gradient(180deg, #78909C 0%, #90A4AE 45%, #CFD8DC 100%)", textColor: "#ECEFF1" },
};

/* ── Weather Animations ── */
function SunnyScene() {
  return (
    <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
      <style>{`
        @keyframes sunGlow { 0%,100%{box-shadow:0 0 20px 6px rgba(255,220,50,0.35);transform:scale(1);}
          50%{box-shadow:0 0 32px 12px rgba(255,220,50,0.55);transform:scale(1.06);} }
        @keyframes cloudDrift { 0%,100%{transform:translateX(0);} 50%{transform:translateX(6px);} }
      `}</style>
      {/* Sun */}
      <div style={{
        position:"absolute", top:8, left:12, width:38, height:38,
        borderRadius:"50%",
        background:"radial-gradient(circle at 38% 38%, #FFE066, #FFAB00)",
        animation:"sunGlow 3.5s ease-in-out infinite",
      }} />
      {/* Cloud */}
      <div style={{ position:"absolute", bottom:4, right:0, animation:"cloudDrift 5s ease-in-out infinite" }}>
        <div style={{ position:"relative", width:48, height:22 }}>
          <div style={{ position:"absolute", bottom:0, left:0, width:44, height:14,
            background:"rgba(255,255,255,0.92)", borderRadius:99, boxShadow:"0 2px 8px rgba(0,0,0,0.08)" }} />
          <div style={{ position:"absolute", bottom:8, left:10, width:22, height:16,
            background:"rgba(255,255,255,0.95)", borderRadius:99 }} />
        </div>
      </div>
    </div>
  );
}

function PartlyCloudyScene() {
  return (
    <div style={{ position:"relative", width:80, height:80, flexShrink:0 }}>
      <style>{`
        @keyframes partlyBob { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-5px);} }
      `}</style>
      <div style={{ position:"absolute", top:10, left:8, width:30, height:30,
        borderRadius:"50%", background:"radial-gradient(circle at 38% 38%, #FFE066, #FFAB00)",
        animation:"partlyBob 4s ease-in-out infinite" }} />
      <div style={{ position:"absolute", bottom:8, right:0, animation:"partlyBob 3s ease-in-out 0.5s infinite" }}>
        <div style={{ position:"relative", width:54, height:26 }}>
          <div style={{ position:"absolute", bottom:0, left:0, width:50, height:18,
            background:"white", borderRadius:99, boxShadow:"0 3px 10px rgba(0,0,0,0.12)" }} />
          <div style={{ position:"absolute", bottom:10, left:10, width:26, height:20,
            background:"white", borderRadius:99 }} />
          <div style={{ position:"absolute", bottom:10, left:26, width:20, height:16,
            background:"white", borderRadius:99 }} />
        </div>
      </div>
    </div>
  );
}

function CloudyScene() {
  return (
    <div style={{ position:"relative", width:80, height:80, flexShrink:0 }}>
      <style>{`
        @keyframes cloudFloat { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-6px);} }
      `}</style>
      {[
        { top:8,  left:4,  w:52, h:22, delay:"0s"    },
        { top:30, left:16, w:44, h:18, delay:"0.8s"  },
      ].map((c, i) => (
        <div key={i} style={{ position:"absolute", top:c.top, left:c.left,
          width:c.w, height:c.h,
          background:"rgba(255,255,255,0.75)", borderRadius:99,
          boxShadow:"0 2px 8px rgba(0,0,0,0.07)",
          animation:`cloudFloat 4s ease-in-out ${c.delay} infinite` }} />
      ))}
    </div>
  );
}

function RainyScene() {
  return (
    <div style={{ position:"relative", width:80, height:80, overflow:"hidden", flexShrink:0 }}>
      <style>{`
        @keyframes drop { 0%{transform:translateY(-8px);opacity:1;}
          100%{transform:translateY(30px);opacity:0;} }
      `}</style>
      <div style={{ position:"absolute", top:2, left:4 }}>
        <div style={{ position:"relative", width:58, height:28 }}>
          <div style={{ position:"absolute", bottom:0, left:0, width:54, height:20,
            background:"rgba(255,255,255,0.45)", borderRadius:99 }} />
          <div style={{ position:"absolute", bottom:12, left:8, width:28, height:22,
            background:"rgba(255,255,255,0.5)", borderRadius:99 }} />
          <div style={{ position:"absolute", bottom:12, left:28, width:22, height:16,
            background:"rgba(255,255,255,0.4)", borderRadius:99 }} />
        </div>
      </div>
      {[0,1,2,3,4,5].map((i) => (
        <div key={i} style={{
          position:"absolute", width:2, height:9, borderRadius:99,
          background:"rgba(144,202,249,0.85)",
          left: 6 + i * 12, top: 36,
          animation:`drop 1.0s ${i * 0.18}s linear infinite`,
        }} />
      ))}
    </div>
  );
}

function SnowyScene() {
  return (
    <div style={{ position:"relative", width:80, height:80, overflow:"hidden", flexShrink:0 }}>
      <style>{`
        @keyframes snowFall { 0%{transform:translateY(-6px) rotate(0deg);opacity:1;}
          100%{transform:translateY(32px) rotate(180deg);opacity:0;} }
      `}</style>
      <div style={{ position:"absolute", top:0, left:0, fontSize:38 }}>🌨️</div>
      {["❄","❅","❆","❄","❅"].map((f, i) => (
        <div key={i} style={{
          position:"absolute", fontSize:10, color:"rgba(200,220,255,0.9)",
          left: 4 + i * 14, top: 36,
          animation:`snowFall 2.0s ${i * 0.4}s linear infinite`,
        }}>{f}</div>
      ))}
    </div>
  );
}

function StormyScene() {
  return (
    <div style={{ position:"relative", width:80, height:80, flexShrink:0 }}>
      <style>{`
        @keyframes strike{0%,88%,100%{opacity:0;}90%,96%{opacity:1;}}
      `}</style>
      <div style={{ position:"absolute", top:2, left:2 }}>
        <div style={{ position:"relative", width:58, height:28 }}>
          <div style={{ position:"absolute", bottom:0, left:0, width:54, height:20,
            background:"rgba(255,255,255,0.3)", borderRadius:99 }} />
          <div style={{ position:"absolute", bottom:12, left:8, width:30, height:22,
            background:"rgba(255,255,255,0.35)", borderRadius:99 }} />
        </div>
      </div>
      <div style={{ position:"absolute", bottom:6, left:28, fontSize:26,
        color:"#FFF176", animation:"strike 2.5s ease-in-out infinite" }}>⚡</div>
    </div>
  );
}

function FoggyScene() {
  return (
    <div style={{ position:"relative", width:80, height:80, display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:7, flexShrink:0 }}>
      <style>{`
        @keyframes fogDrift { 0%,100%{opacity:0.35;transform:translateX(0);}
          50%{opacity:0.7;transform:translateX(5px);} }
      `}</style>
      {[50,38,44].map((w, i) => (
        <div key={i} style={{
          width:w, height:5, background:"rgba(255,255,255,0.65)", borderRadius:99,
          animation:`fogDrift 3.5s ease-in-out ${i * 0.7}s infinite`,
        }} />
      ))}
    </div>
  );
}

function WeatherScene({ type }: { type: WeatherData["type"] }) {
  if (type === "sunny")  return <SunnyScene />;
  if (type === "partly") return <PartlyCloudyScene />;
  if (type === "cloudy") return <CloudyScene />;
  if (type === "rainy")  return <RainyScene />;
  if (type === "snowy")  return <SnowyScene />;
  if (type === "stormy") return <StormyScene />;
  return <FoggyScene />;
}

/* ── Main widget ── */
export function WeatherWidget() {
  const [activeCity, setActiveCity] = useState<CityKey>("seoul");
  const [cache, setCache]           = useState<Record<CityKey, WeatherData | null>>({ seoul: null, busan: null });
  const [loading, setLoading]       = useState(false);

  const city = CITIES.find((c) => c.key === activeCity)!;
  const weather = cache[activeCity];

  const fetchWeather = useCallback(async (key: CityKey) => {
    if (cache[key]) return;
    setLoading(true);
    try {
      const c   = CITIES.find((x) => x.key === key)!;
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lng}&current=weather_code,temperature_2m&timezone=Asia%2FSeoul`
      );
      const json = await res.json();
      const code = json.current?.weather_code ?? 0;
      const temp = Math.round(json.current?.temperature_2m ?? 20);
      const info = codeToInfo(code);
      setCache((prev) => ({ ...prev, [key]: { temp, ...info } }));
    } catch {
      setCache((prev) => ({ ...prev, [key]: { temp: 20, type: "partly", label: "多云" } }));
    } finally {
      setLoading(false);
    }
  }, [cache]);

  useEffect(() => { fetchWeather("seoul"); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fetchWeather(activeCity); }, [activeCity]); // eslint-disable-line react-hooks/exhaustive-deps

  const sky = weather ? SKY[weather.type] : SKY["partly"];

  return (
    <div className="mx-4 mb-3 rounded-3xl overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
      {/* Sky gradient area */}
      <div style={{ background: sky.grad, padding: "16px 20px 20px", position: "relative", minHeight: 120 }}>
        {/* City toggle */}
        <div style={{
          position: "absolute", top: 12, right: 12,
          display: "flex", gap: 4,
          background: "rgba(255,255,255,0.25)", borderRadius: 99, padding: 3,
        }}>
          {CITIES.map((c) => (
            <button key={c.key}
              onClick={() => setActiveCity(c.key)}
              style={{
                padding: "3px 10px",
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 700,
                background: activeCity === c.key ? "rgba(255,255,255,0.9)" : "transparent",
                color: activeCity === c.key ? "#2A2826" : "rgba(255,255,255,0.75)",
                border: "none", cursor: "pointer",
                transition: "all 0.2s",
              }}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {loading || !weather ? (
            <div style={{ width: 80, height: 80, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <RefreshCw style={{ width:24, height:24, color:"rgba(255,255,255,0.6)", animation:"spin 1s linear infinite" }} />
            </div>
          ) : (
            <WeatherScene type={weather.type} />
          )}

          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom: 2 }}>
              {city.label} · 实时天气
            </p>
            <p style={{ fontSize: 38, fontWeight: 900, color: "white", lineHeight: 1, marginBottom: 2 }}>
              {weather ? `${weather.temp}°C` : "—"}
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
              {weather?.label ?? "载入中…"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
