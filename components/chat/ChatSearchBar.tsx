"use client";

import { useEffect, useRef } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";

interface ChatSearchBarProps {
  query: string;
  onChange: (q: string) => void;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  matchCount: number;
  activeIdx: number;
}

const ChatSearchBar = ({
  query,
  onChange,
  onClose,
  onPrev,
  onNext,
  matchCount,
  activeIdx,
}: ChatSearchBarProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const counterText = !query.trim()
    ? ""
    : matchCount === 0
      ? "No results"
      : `${activeIdx + 1} / ${matchCount}`;

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/8 bg-[#0d1117]">
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search messages…"
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (e.shiftKey) onPrev();
            else onNext();
          }
          if (e.key === "Escape") onClose();
        }}
      />
      {counterText && (
        <span className="text-xs text-slate-400 shrink-0 w-16 text-right">{counterText}</span>
      )}
      {matchCount > 0 && (
        <>
          <button
            onClick={onPrev}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Previous (Shift+Enter)"
          >
            <ArrowUp size={14} />
          </button>
          <button
            onClick={onNext}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Next (Enter)"
          >
            <ArrowDown size={14} />
          </button>
        </>
      )}
      <button
        onClick={onClose}
        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default ChatSearchBar;
