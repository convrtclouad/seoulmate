import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface HeaderProps {
  title: string;
  back?: string;       // href to go back to
  right?: ReactNode;   // action buttons
}

export function Header({ title, back, right }: HeaderProps) {
  return (
    <header className="page-header">
      <div className="flex items-center gap-2 flex-1">
        {back && (
          <Link
            href={back}
            className="rounded-xl p-1.5 hover:bg-gray-100 transition-colors tap-target -ml-1.5"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </Link>
        )}
        <h1 className="text-base font-bold text-gray-900 truncate">{title}</h1>
      </div>
      {right && <div className="flex items-center gap-2 ml-2">{right}</div>}
    </header>
  );
}
