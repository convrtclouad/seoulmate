"use client";

import { useState } from "react";
import { Wand2, Languages, Mic } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { MenuTranslator } from "@/components/ai-tools/MenuTranslator";
import { VoiceHelper } from "@/components/ai-tools/VoiceHelper";
import { cn } from "@/lib/utils/cn";

type Tool = "translator" | "voice";

export default function AIToolsPage() {
  const [activeTool, setActiveTool] = useState<Tool>("translator");

  return (
    <div className="flex flex-col min-h-dvh">
      <Header title="AI Toolset" />

      <div className="px-4 py-4 space-y-4 pb-safe">
        {/* Hero */}
        <div className="rounded-3xl bg-forest text-white text-center py-6 px-4 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-forest-light/40" />
          <div className="relative z-10">
            <Wand2 className="h-8 w-8 mx-auto mb-2 text-forest-soft" />
            <h2 className="text-lg font-black">AI Travel Assistant</h2>
            <p className="text-sm text-forest-pale mt-1">
              Translate menus · Speak Korean phrases
            </p>
          </div>
        </div>

        {/* Tool switcher */}
        <div className="flex rounded-2xl bg-neutral-100 p-1 gap-1">
          <button
            onClick={() => setActiveTool("translator")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all",
              activeTool === "translator"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-neutral-500"
            )}
          >
            <Languages className="h-4 w-4" />
            Menu Translator
          </button>
          <button
            onClick={() => setActiveTool("voice")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all",
              activeTool === "voice"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-neutral-500"
            )}
          >
            <Mic className="h-4 w-4" />
            Voice Helper
          </button>
        </div>

        {/* Active tool */}
        {activeTool === "translator" ? <MenuTranslator /> : <VoiceHelper />}
      </div>
    </div>
  );
}
