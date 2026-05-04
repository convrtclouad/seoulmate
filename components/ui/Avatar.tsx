import { cn } from "@/lib/utils/cn";
import type { Profile } from "@/types";

interface AvatarProps {
  profile?: Profile | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-14 w-14 text-xl",
};

// Deterministic color from user ID
const BG_COLORS = [
  "bg-pink-400",   "bg-purple-400", "bg-indigo-400",
  "bg-blue-400",   "bg-teal-400",   "bg-green-400",
  "bg-yellow-400", "bg-orange-400", "bg-red-400",
];

function colorForId(id: string): string {
  const sum = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return BG_COLORS[sum % BG_COLORS.length];
}

export function Avatar({ profile, size = "md", className }: AvatarProps) {
  const initials = profile?.display_name
    ? profile.display_name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  if (profile?.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profile.avatar_url}
        alt={profile.display_name}
        className={cn(
          "rounded-full object-cover ring-2 ring-white",
          sizes[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold text-white ring-2 ring-white shrink-0",
        sizes[size],
        profile ? colorForId(profile.id) : "bg-gray-300",
        className
      )}
    >
      {initials}
    </div>
  );
}

export function AvatarGroup({
  profiles,
  max = 4,
}: {
  profiles: (Profile | undefined)[];
  max?: number;
}) {
  const visible = profiles.slice(0, max);
  const rest = profiles.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((p, i) => (
        <Avatar key={p?.id ?? i} profile={p} size="sm" />
      ))}
      {rest > 0 && (
        <div className="h-8 w-8 rounded-full bg-gray-200 ring-2 ring-white flex items-center justify-center text-xs font-bold text-gray-600">
          +{rest}
        </div>
      )}
    </div>
  );
}
