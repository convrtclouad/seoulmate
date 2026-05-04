"use client";

import { useQuery } from "@tanstack/react-query";
import type { WeatherData } from "@/types";

async function fetchWeather(): Promise<WeatherData> {
  const res = await fetch("/api/weather");
  if (!res.ok) throw new Error("Weather fetch failed");
  return res.json();
}

export function useWeather() {
  return useQuery({
    queryKey: ["weather", "seoul"],
    queryFn:  fetchWeather,
    staleTime: 1000 * 60 * 30,  // 30 min — weather doesn't change that fast
    retry: 2,
  });
}
