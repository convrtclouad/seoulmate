import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-4 rounded-2xl bg-gray-50 p-5 text-gray-300">
        {icon}
      </div>
      <p className="text-base font-semibold text-gray-700">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-gray-400 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
