"use client";

import { useMemo, useRef, useState } from "react";
import Autocomplete, { type SearchItem } from "./Autocomplete";
import Confetti, { type ConfettiHandle } from "./Confetti";
import { compareGuess, type CellStatus } from "@/lib/compare";
import { applyDrafts, DRAFTS_KEY, draftCount, emptyDrafts, type RosterDrafts } from "@/lib/drafts";
import { filterByScope, type Scope } from "@/lib/scope";
import { charactersById as _noDirectUse } from "@/lib/data";
import { emptyGame, loadJSON, saveJSON, type GameState } from "@/lib/storage";
import { dicts, tv, type Locale } from "@/lib/i18n";
import type { Character, Fruit } from "@/lib/schema";

// Re-export guard: data must come via props (server components) so daily target
// stays consistent between server render and client hydration.
void _noDirectUse;

interface Props {
  locale: Locale;
  characters: Character[];
  fruits: Fruit[];
  initialTargetId: string | null; // null = random pick on client (endless)
  storageKey: string | null; // null = session only (endless)
  historyKey: string | null; // set for daily mode (streak tracking)
  allowNewRound: boolean;
  enableDrafts?: boolean; // merge local roster drafts into the pool (endless only)
  scope: Scope;
}

interface HistoryEntry {
  won: boolean;
  attempts: number;
}

const CELL =
  "flex min-h-16 min-w-24 flex-1 flex-col items-center justify-center rounded-lg px-1 py-2 text-center text-xs font-medium leading-tight";

const COLORS: Record<string, string> = {
  correct: "bg-emerald-500 text-slate-950",
  partial: "bg-amber-400 text-slate-950",
  wrong: "bg-zinc-700 text-slate-100",
  higher: "bg-sky-600 text-white",
  lower: "bg-orange-600 text-white",
};

export default function ClassicGame({
  locale,
  characters,
  fruits,
  initialTargetId,
  storageKey,
  historyKey,
  allowNewRound,
  enableDrafts = false,
  scope,
}: Props) {
  const t = dicts[locale];
  // Local roster drafts let players test new/edited characters in endless mode.
  // Daily puzzles always use the committed pool so everyone gets the same target.
  // The pool is additionally filtered by spoiler scope (anime vs manga).
  const pool = useMemo(() => {
    if (!enableDrafts) return filterByScope(characters, scope);
    const d = loadJSON<RosterDrafts>(DRAFTS_KEY, emptyDrafts);
    const base = draftCount(d) === 0 ? characters : applyDrafts(characters, d);
    return filterByScope(base, scope);
  }, [characters, enableDrafts, scope]);
  const byId = useMemo(() => new Map(pool.map((c) => [c.id, c])), [pool]);
  const fruitType = useMemo(() => {
    const m = new Map(fruits.map((f) => [f.id, f.type]));
    return (c: Character) => (c.fruitId === null ? "none" : (m.get(c.fruitId) ?? "?"));
  }, [fruits]);

  const [targetId, setTargetId] = useState(
    () => initialTargetId ?? pool[Math.floor(Math.random() * pool.length)].id,
  );
  const [state, setState] = useState<GameState>(() =>
    storageKey ? loadJSON<GameState>(storageKey, emptyGame) : emptyGame,
  );
  const [gaveUp, setGaveUp] = useState(false);
  const [rounds, setRounds] = useState({ played: 1, won: 0 });
  const [celebrateId, setCelebrateId] = useState<string | null>(null);
  const confettiRef = useRef<ConfettiHandle>(null);

  const target = byId.get(targetId);
  const guesses = state.guesses;
  const won = state.won;
  const finished = won || gaveUp;
  const attempts = guesses.length;

  const items: SearchItem[] = useMemo(
    () =>
      pool.map((c) => {
        const other = c.names[locale === "de" ? "en" : "de"];
        return {
          id: c.id,
          label: c.names[locale],
          sub: other !== c.names[locale] ? other : undefined,
          haystack: `${c.names.de} ${c.names.en} ${c.names.aliases.join(" ")}`.toLowerCase(),
        };
      }),
    [pool, locale],
  );

  function persist(next: GameState) {
    setState(next);
    if (storageKey) saveJSON(storageKey, next);
  }

  function recordHistory(entry: HistoryEntry) {
    if (!historyKey) return;
    const h = loadJSON<Record<string, HistoryEntry>>(historyKey, {});
    h[historyKeyDate()] = entry;
    saveJSON(historyKey, h);
  }

  function historyKeyDate(): string {
    // storageKey for daily is `opd:classic:<date>` — reuse its suffix
    return storageKey?.split(":").pop() ?? new Date().toISOString().slice(0, 10);
  }

  function pick(id: string): string | null {
    if (!byId.has(id)) return t.unknownChar;
    if (guesses.includes(id)) return t.alreadyGuessed;
    const next: GameState = { guesses: [...guesses, id], won: id === targetId };
    persist(next);
    if (next.won) {
      recordHistory({ won: true, attempts: next.guesses.length });
      setRounds((r) => ({ played: r.played, won: r.won + 1 }));
      window.setTimeout(() => {
        confettiRef.current?.burst(window.innerWidth / 2, window.innerHeight * 0.3, 220);
      }, 1200);
    }
    // celebrate only the freshly guessed row (cleared after the reveal)
    setCelebrateId(id);
    window.setTimeout(() => setCelebrateId((cur) => (cur === id ? null : cur)), 4500);
    return null;
  }

  function giveUp() {
    setGaveUp(true);
    recordHistory({ won: false, attempts: guesses.length });
  }

  function newRound() {
    const candidates = pool.filter((c) => c.id !== targetId);
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    setTargetId(next.id);
    persist({ guesses: [], won: false });
    setGaveUp(false);
    setRounds((r) => ({ played: r.played + 1, won: r.won }));
  }

  function fmtBounty(b: number | null): string {
    if (b === null) return t.noBounty;
    return `${new Intl.NumberFormat(locale).format(b)} ฿`;
  }

  function cellText(key: string, c: Character): string {
    switch (key) {
      case "gender":
        return tv(locale, "gender", c.gender);
      case "affiliation":
        return c.affiliation.map((a) => tv(locale, "affiliation", a)).join(" / ");
      case "origin":
        return c.origin.place
          ? `${tv(locale, "sea", c.origin.sea)} · ${c.origin.place}`
          : tv(locale, "sea", c.origin.sea);
      case "haki":
        return c.haki.length === 0 ? "–" : c.haki.map((h) => tv(locale, "haki", h)).join(", ");
      case "fruit":
        return tv(locale, "fruitType", fruitType(c));
      case "bounty":
        return fmtBounty(c.bounty);
      case "debut":
        return `${c.debut.arc} (${c.debut.saga})`;
      case "status":
        return tv(locale, "status", c.status);
      default:
        return "";
    }
  }

  /** Small confetti puff for each correct cell of the freshly guessed row. */
  function handleReveal(el: HTMLDivElement, status: CellStatus, id: string) {
    if (status !== "correct" || id !== celebrateId) return;
    const r = el.getBoundingClientRect();
    confettiRef.current?.burst(r.left + r.width / 2, r.top + r.height / 2, 32);
  }

  const streak = useMemo(() => {
    if (!historyKey || typeof window === "undefined") return null;
    const h = loadJSON<Record<string, HistoryEntry>>(historyKey, {});
    // count consecutive won days ending today (or yesterday if today not yet won)
    let s = 0;
    const cursor = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
    if (!h[iso(cursor)]?.won) cursor.setDate(cursor.getDate() - 1);
    while (h[iso(cursor)]?.won) {
      s++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return s;
    function iso(d: Date) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
    // recompute when a new guess lands (intentional impure read of localStorage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyKey, guesses.length, won]);

  if (!target) return <p>Target missing.</p>;

  const cols: { key: string; label: string }[] = [
    { key: "gender", label: t.colGender },
    { key: "affiliation", label: t.colAffiliation },
    { key: "origin", label: t.colOrigin },
    { key: "haki", label: t.colHaki },
    { key: "fruit", label: t.colFruit },
    { key: "bounty", label: t.colBounty },
    { key: "debut", label: t.colDebut },
    { key: "status", label: t.colStatus },
  ];

  return (
    <div className="w-full">
      <Confetti ref={confettiRef} />
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
        <span>
          {t.attempts}: <strong className="text-slate-100">{attempts}</strong>
        </span>
        {streak !== null && (
          <span>
            {t.streak}: <strong className="text-slate-100">{streak}</strong>
          </span>
        )}
        {allowNewRound && (
          <span>
            {t.stats}: {rounds.won}/{rounds.played}
          </span>
        )}
      </div>

      {!finished ? (
        <Autocomplete
          items={items}
          placeholder={t.searchPlaceholder}
          actionLabel={t.guess}
          onPick={pick}
        />
      ) : (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-center">
          {won ? (
            <p className="text-lg font-bold text-emerald-400">
              {t.won} ({target.names[locale]}) — {attempts} {t.attempts.toLowerCase()}
            </p>
          ) : (
            <p className="text-lg font-bold text-rose-400">
              {t.lost} <span className="text-slate-100">{target.names[locale]}</span>
            </p>
          )}
          <div className="mt-3 flex justify-center gap-2">
            {allowNewRound && (
              <button
                onClick={newRound}
                className="rounded-xl bg-amber-400 px-5 py-2 font-semibold text-slate-950 hover:bg-amber-300"
              >
                {t.newRound}
              </button>
            )}
          </div>
        </div>
      )}

      {!finished && guesses.length > 0 && allowNewRound && (
        <button onClick={giveUp} className="mt-2 text-sm text-slate-500 underline hover:text-slate-300">
          {t.giveUp}
        </button>
      )}
      {!finished && guesses.length > 0 && !allowNewRound && (
        <button onClick={giveUp} className="mt-2 text-sm text-slate-500 underline hover:text-slate-300">
          {t.giveUp}
        </button>
      )}

      {guesses.length > 0 && (
        <div className="mt-4 overflow-x-auto pb-2">
          <div className="min-w-[880px]">
            <div className="mb-1 flex gap-1">
              <div className={`${CELL} bg-transparent font-semibold text-slate-400`}>{t.colName}</div>
              {cols.map((c) => (
                <div key={c.key} className={`${CELL} bg-transparent font-semibold text-slate-400`}>
                  {c.label}
                </div>
              ))}
            </div>
            {[...guesses].reverse().map((id) => {
              const c = byId.get(id);
              if (!c) return null;
              const cmp = compareGuess(c, target, fruitType);
              return (
                <div key={id} className="mb-1 flex gap-1 [perspective:800px]">
                  <div className={`cell-reveal ${CELL} bg-slate-800 font-bold text-slate-100`}>{c.names[locale]}</div>
                  {cmp.map((f, colIdx) => {
                    let text = cellText(f.key, c);
                    if (f.status === "higher") text += " ↑";
                    if (f.status === "lower") text += " ↓";
                    return (
                      <div
                        key={f.key}
                        onAnimationStart={(e) => handleReveal(e.currentTarget, f.status, id)}
                        style={{ animationDelay: `${(colIdx + 1) * 180}ms` }}
                        className={`cell-reveal ${CELL} ${COLORS[f.status]}`}
                      >
                        {text}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
