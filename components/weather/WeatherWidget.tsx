"use client";

import { Umbrella, Wind, Droplets, Thermometer, Loader2 } from "lucide-react";
import { useWeather } from "@/lib/hooks/useWeather";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

function getTempColor(temp: number): string {
  if (temp >= 30) return "text-red-500";
  if (temp >= 22) return "text-orange-400";
  if (temp >= 14) return "text-yellow-500";
  if (temp >= 5)  return "text-blue-400";
  return "text-blue-600";
}

export function WeatherWidget() {
  const { data: weather, isLoading, isError } = useWeather();

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center py-8 gap-3 text-gray-300">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading Seoul weather...</span>
      </Card>
    );
  }

  if (isError || !weather) {
    return (
      <Card className="text-center py-6 text-gray-400 text-sm">
        Weather unavailable — check connection
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden" padding="none">
      {/* Top gradient bar */}
      <div className="bg-gradient-to-r from-blue-400 to-indigo-500 px-5 py-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-white/70 uppercase tracking-wide">
              📍 {weather.city}, South Korea
            </p>
            <p className={cn("text-5xl font-black mt-1", "text-white")}>
              {weather.temp}°C
            </p>
            <p className="text-sm text-white/80 mt-1 capitalize">
              {weather.description}
            </p>
          </div>

          {/* Weather icon */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
            alt={weather.description}
            className="h-20 w-20 drop-shadow-sm"
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="px-5 py-3 grid grid-cols-3 gap-3 border-b border-gray-50">
        <div className="flex flex-col items-center gap-1">
          <Thermometer className="h-4 w-4 text-gray-400" />
          <p className="text-xs text-gray-400">Feels like</p>
          <p className="text-sm font-bold text-gray-700">{weather.feels_like}°</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Droplets className="h-4 w-4 text-blue-400" />
          <p className="text-xs text-gray-400">Humidity</p>
          <p className="text-sm font-bold text-gray-700">{weather.humidity}%</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Umbrella className="h-4 w-4 text-indigo-400" />
          <p className="text-xs text-gray-400">Umbrella</p>
          <p className="text-sm font-bold text-gray-700">
            {weather.description.toLowerCase().includes("rain") ? "Yes ☂️" : "No"}
          </p>
        </div>
      </div>

      {/* Outfit advice */}
      <div className="px-5 py-3 flex items-start gap-3">
        <Wind className="h-4 w-4 text-primary-400 shrink-0 mt-0.5" />
        <p className="text-sm text-gray-600 leading-relaxed">
          {weather.outfit_advice}
        </p>
      </div>
    </Card>
  );
}
