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
        <div className="card bg-korean-gradient text-white text-center py-6">
          <Wand2 className="h-8 w-8 mx-auto mb-2 opacity-80" />
          <h2 className="text-lg font-black">AI Travel Assistant</h2>
          <p className="text-sm text-white/70 mt-1">
            Translate menus · Speak Korean phrases
          </p>
        </div>

        {/* Tool switcher */}
        <div className="flex rounded-2xl bg-gray-100 p-1 gap-1">
          <button
            onClick={() => setActiveTool("translator")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all",
              activeTool === "translator"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500"
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
                : "text-gray-500"
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
