import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchInput({
  placeholder = "Search routes",
  className,
  value,
  onChange,
  submitLabel
}: {
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  submitLabel?: string;
}) {
  return (
    <div className={cn("flex h-10 min-w-0 items-center gap-2 rounded-full border border-white/[0.08] bg-surface-soft px-4 text-white/25 focus-within:border-blue/40", className)}>
      {submitLabel ? (
        <button type="submit" className="-ml-1 flex size-7 shrink-0 items-center justify-center rounded-full text-white/45 transition hover:bg-white/[0.06] hover:text-white" aria-label={submitLabel} title={submitLabel}>
          <Search className="size-4" />
        </button>
      ) : (
        <Search className="size-4 shrink-0" />
      )}
      <input
        value={value ?? ""}
        onChange={(event) => onChange?.(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
        placeholder={placeholder}
      />
    </div>
  );
}
