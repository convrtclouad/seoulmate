"use client";

import { useState } from "react";
import { Camera, Mic } from "lucide-react";
import { CameraTranslator } from "@/components/ai-tools/CameraTranslator";
import { VoiceHelper } from "@/components/ai-tools/VoiceHelper";
import { useMembers } from "@/lib/hooks/useMembers";

type Tool = "camera" | "voice";

export default function AIToolsPage() {
  const { data: members = [] } = useMembers();
  const [activeTool, setActiveTool] = useState<Tool>("camera");

  return (
    <div className="flex flex-col min-h-dvh bg-cream">
      {/* Header */}
      <div className="px-5 pt-safe pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-ink tracking-tight">AI 翻译</h1>
            <p className="text-xs text-ink-muted mt-0.5">扫描韩文 · 即时翻译 🔍</p>
          </div>
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((m) => (
              <div key={m.id} className={`h-8 w-8 rounded-full bg-gradient-to-br ${m.color} flex items-center justify-center text-sm ring-2 ring-cream`}>
                {m.emoji}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="px-4 pt-3 pb-4">
        <div className="tab-bar">
          <button onClick={() => setActiveTool("camera")}
            className={activeTool === "camera" ? "tab-item-active" : "tab-item-inactive"}>
            <Camera className="h-4 w-4" />
            <span className="text-xs font-bold">扫描翻译</span>
          </button>
          <button onClick={() => setActiveTool("voice")}
            className={activeTool === "voice" ? "tab-item-active" : "tab-item-inactive"}>
            <Mic className="h-4 w-4" />
            <span className="text-xs font-bold">韩语助手</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-safe">
        {activeTool === "camera" ? <CameraTranslator /> : <VoiceHelper />}
      </div>
    </div>
  );
}
