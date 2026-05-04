import { cn } from "@/lib/utils/cn";
import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  glass?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddings = {
  none: "p-0",
  sm:   "p-3",
  md:   "p-4",
  lg:   "p-6",
};

export function Card({
  children,
  hover = false,
  glass = false,
  padding = "md",
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl",
        glass ? "glass-card" : "bg-white shadow-card",
        hover && "transition-shadow duration-200 hover:shadow-card-hover",
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
