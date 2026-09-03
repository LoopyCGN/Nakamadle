"use client";

import { useMemo, useRef, useState } from "react";

export interface SearchItem {
  id: string;
  label: string;
  sub?: string;
  haystack: string;
}

interface Props {
  items: SearchItem[];
  placeholder: string;
  actionLabel: string;
  disabled?: boolean;
  onPick: (id: string) => string | null; // returns error message or null
}

export default function Autocomplete({ items, placeholder, actionLabel, disabled, onPick }: Props) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return items.filter((i) => i.haystack.includes(needle)).slice(0, 8);
  }, [q, items]);

  function submit(id?: string) {
    const pickId = id ?? results[highlight]?.id ?? results[0]?.id;
    if (!pickId) return;
    const err = onPick(pickId);
    if (err) {
      setError(err);
    } else {
      setQ("");
      setError(null);
      setOpen(false);
    }
    inputRef.current?.focus();
  }

  return (
    <div className="w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            value={q}
            disabled={disabled}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
              setHighlight(0);
              setError(null);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlight((h) => Math.min(h + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlight((h) => Math.max(h - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                submit();
              } else if (e.key === "Escape") {
                setQ("");
                setOpen(false);
              }
            }}
            placeholder={placeholder}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none disabled:opacity-50"
          />
          {open && results.length > 0 && !disabled && (
            <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
              {results.map((r, i) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      submit(r.id);
                    }}
                    onMouseEnter={() => setHighlight(i)}
                    className={`flex w-full flex-col px-4 py-2 text-left ${
                      i === highlight ? "bg-slate-700" : ""
                    }`}
                  >
                    <span className="font-medium text-slate-100">{r.label}</span>
                    {r.sub && <span className="text-xs text-slate-400">{r.sub}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => submit()}
          className="rounded-xl bg-amber-400 px-5 py-3 font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-50"
        >
          {actionLabel}
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-rose-400">{error}</p>}
    </div>
  );
}
