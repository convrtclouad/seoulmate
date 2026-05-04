import { NextResponse } from "next/server";
import type { WeatherData } from "@/types";

// Seoul coords
const SEOUL_LAT = 37.5665;
const SEOUL_LNG = 126.9780;

function getOutfitAdvice(temp: number, description: string): string {
  const lowerDesc = description.toLowerCase();
  const isRainy   = lowerDesc.includes("rain") || lowerDesc.includes("drizzle");
  const isSnowy   = lowerDesc.includes("snow");

  if (isRainy) return "Bring an umbrella ☂️ — rain expected in Seoul today.";
  if (isSnowy) return "Bundle up! ❄️ It's snowing — waterproof boots recommended.";
  if (temp >= 30) return "Very hot day ☀️ — light clothes, sunscreen, and stay hydrated.";
  if (temp >= 24) return "Warm and pleasant 😎 — t-shirt and shorts weather!";
  if (temp >= 18) return "Comfortable 🌤️ — a light jacket for the evening.";
  if (temp >= 10) return "Cool day 🧥 — bring a jacket and layer up.";
  if (temp >= 0)  return "Cold! 🧣 — wear a coat, gloves, and scarf.";
  return "Freezing ❄️ — heavy winter coat, thermal layers essential.";
}

export async function GET() {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    // Return mock weather data for development
    const mock: WeatherData = {
      temp:         22,
      feels_like:   20,
      humidity:     65,
      description:  "Partly cloudy",
      icon:         "02d",
      city:         "Seoul",
      outfit_advice: getOutfitAdvice(22, "partly cloudy"),
    };
    return NextResponse.json(mock);
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${SEOUL_LAT}&lon=${SEOUL_LNG}&appid=${apiKey}&units=metric`;
    const res  = await fetch(url, { next: { revalidate: 1800 } }); // 30-min cache

    if (!res.ok) throw new Error(`OpenWeather error: ${res.status}`);

    const data = await res.json();
    const temp = Math.round(data.main.temp);
    const desc = data.weather?.[0]?.description ?? "clear sky";

    const weather: WeatherData = {
      temp,
      feels_like:   Math.round(data.main.feels_like),
      humidity:     data.main.humidity,
      description:  desc.charAt(0).toUpperCase() + desc.slice(1),
      icon:         data.weather?.[0]?.icon ?? "01d",
      city:         data.name ?? "Seoul",
      outfit_advice: getOutfitAdvice(temp, desc),
    };

    return NextResponse.json(weather);
  } catch (err) {
    console.error("[/api/weather]", err);
    return NextResponse.json(
      { error: "Weather fetch failed" },
      { status: 502 }
    );
  }
}
