import { cn } from "@/lib/utils";

export function ZipMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <rect width="32" height="32" rx="9" fill="#D97706" />
        <path d="M9 11.5h9.2L9 20.5h14" stroke="#0E0C0A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-[17px] font-semibold tracking-tight">ZIP</span>
    </div>
  );
}
