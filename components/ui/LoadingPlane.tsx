"use client";

export function LoadingPlane({ text = "载入中..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
      {/* Plane bobbing animation */}
      <div className="relative">
        <div
          className="text-5xl select-none"
          style={{
            animation: "planeBob 1.8s ease-in-out infinite",
            display: "inline-block",
          }}
        >
          ✈️
        </div>
        {/* Cloud trail */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-40">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-neutral-300"
              style={{
                animation: `cloudFade 1.8s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <p className="text-sm text-neutral-400 font-medium">{text}</p>

      <style>{`
        @keyframes planeBob {
          0%, 100% { transform: translateY(0px) rotate(-5deg); }
          25%       { transform: translateY(-10px) rotate(0deg); }
          50%       { transform: translateY(-6px) rotate(2deg); }
          75%       { transform: translateY(-12px) rotate(-2deg); }
        }
        @keyframes cloudFade {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50%       { opacity: 0.6; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

export function FullPageLoader({ text }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-bg flex flex-col items-center justify-center z-50">
      <div className="text-6xl mb-2" style={{ animation: "planeBob 1.8s ease-in-out infinite", display: "inline-block" }}>
        ✈️
      </div>
      <p className="text-sm text-neutral-400 font-medium mt-4">{text ?? "正在起飞..."}</p>
      <style>{`
        @keyframes planeBob {
          0%, 100% { transform: translateY(0px) rotate(-5deg); }
          25%       { transform: translateY(-12px) rotate(0deg); }
          50%       { transform: translateY(-8px) rotate(2deg); }
          75%       { transform: translateY(-14px) rotate(-2deg); }
        }
      `}</style>
    </div>
  );
}
