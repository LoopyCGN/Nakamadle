"use client";

import { useMemo, useState } from "react";
import Autocomplete, { type SearchItem } from "./Autocomplete";
import { emptyGame, loadJSON, saveJSON, type GameState } from "@/lib/storage";
import { saveDailyResult } from "@/lib/auth";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { dicts, tv, type Locale } from "@/lib/i18n";
import type { Scope } from "@/lib/scope";
import type { Character, Fruit } from "@/lib/schema";

interface Props {
  locale: Locale;
  characters: Character[]; // fruit pool (characters with fruitId)
  fruits: Fruit[];
  initialTargetId: string;
  storageKey: string | null;
  allowNewRound: boolean;
  saveResult?: { mode: "fruits"; scope: Scope; dateKey: string };
}

export default function FruitGame({ locale, characters, fruits, initialTargetId, storageKey, allowNewRound, saveResult }: Props) {
  const t = dicts[locale];
  const fruitById = useMemo(() => new Map(fruits.map((f) => [f.id, f])), [fruits]);
  const charById = useMemo(() => new Map(characters.map((c) => [c.id, c])), [characters]);

  const [targetId, setTargetId] = useState(initialTargetId);
  const [fruitGuesses, setFruitGuesses] = useState<string[]>(() =>
    storageKey ? loadJSON<string[]>(`${storageKey}:fruits`, []) : [],
  );
  const [charState, setCharState] = useState<GameState>(() =>
    storageKey ? loadJSON<GameState>(storageKey, emptyGame) : emptyGame,
  );
  const [gaveUp, setGaveUp] = useState(false);
  const supabase = useMemo(() => (isSupabaseConfigured() ? createClient() : null), []);

  function persistResult(attempts: number, won: boolean) {
    if (!saveResult || !supabase) return;
    void saveDailyResult(supabase, { ...saveResult, attempts, won });
  }

  const target = charById.get(targetId);
  const won = charState.won;
  const finished = won || gaveUp;

  const items: SearchItem[] = useMemo(
    () =>
      fruits.map((f) => ({
        id: f.id,
        label: f.names[locale],
        sub: f.names[locale === "de" ? "en" : "de"],
        haystack: `${f.names.de} ${f.names.en} ${f.names.aliases.join(" ")}`.toLowerCase(),
      })),
    [fruits, locale],
  );

  function pick(id: string): string | null {
    if (!fruitById.has(id)) return t.unknownChar;
    if (fruitGuesses.includes(id)) return t.alreadyGuessed;
    const nextGuesses = [...fruitGuesses, id];
    setFruitGuesses(nextGuesses);
    if (storageKey) saveJSON(`${storageKey}:fruits`, nextGuesses);
    if (id === target?.fruitId) {
      const next: GameState = { guesses: [...charState.guesses, targetId], won: true };
      setCharState(next);
      if (storageKey) saveJSON(storageKey, next);
      persistResult(nextGuesses.length, true);
    }
    return null;
  }

  function giveUp() {
    setGaveUp(true);
    persistResult(fruitGuesses.length, false);
  }

  function newRound() {
    const pool = characters.filter((c) => c.id !== targetId);
    const next = pool[Math.floor(Math.random() * pool.length)];
    setTargetId(next.id);
    setFruitGuesses([]);
    setCharState({ guesses: [], won: false });
    setGaveUp(false);
  }

  if (!target) return <p>Target missing.</p>;
  const solution = target.fruitId ? fruitById.get(target.fruitId) : undefined;
  const showTypeHint = fruitGuesses.length >= 3 && solution;

  return (
    <div className="w-full">
      <div className="mb-4 rounded-xl border border-slate-700 bg-slate-900 p-4 text-center">
        <p className="text-sm text-slate-400">{t.fruitQuestion}</p>
        <p className="mt-1 text-2xl font-bold text-slate-100">{target.names[locale]}</p>
        <p className="mt-1 text-sm text-slate-400">
          {target.affiliation.map((a) => tv(locale, "affiliation", a)).join(" / ")}
        </p>
      </div>

      <div className="mb-3 text-sm text-slate-400">
        {t.attempts}: <strong className="text-slate-100">{fruitGuesses.length}</strong>
      </div>

      {!finished ? (
        <Autocomplete
          items={items}
          placeholder={t.fruitSearchPlaceholder}
          actionLabel={t.guess}
          onPick={pick}
        />
      ) : (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-center">
          {won ? (
            <p className="text-lg font-bold text-emerald-400">
              {t.won} ({solution?.names[locale]})
            </p>
          ) : (
            <p className="text-lg font-bold text-rose-400">
              {t.lost} <span className="text-slate-100">{solution?.names[locale]}</span>
            </p>
          )}
          {allowNewRound && (
            <button
              onClick={newRound}
              className="mt-3 rounded-xl bg-amber-400 px-5 py-2 font-semibold text-slate-950 hover:bg-amber-300"
            >
              {t.newRound}
            </button>
          )}
        </div>
      )}

      {showTypeHint && !finished && (
        <p className="mt-2 text-sm text-slate-400">
          {t.colFruit}: <strong className="text-amber-300">{tv(locale, "fruitType", solution.type)}</strong>
        </p>
      )}

      {!finished && fruitGuesses.length > 0 && (
        <button onClick={giveUp} className="mt-2 text-sm text-slate-500 underline hover:text-slate-300">
          {t.giveUp}
        </button>
      )}

      {fruitGuesses.length > 0 && (
        <ul className="mt-3 space-y-1">
          {[...fruitGuesses].reverse().map((id) => {
            const f = fruitById.get(id);
            if (!f) return null;
            const ok = id === target.fruitId;
            return (
              <li
                key={id}
                className={`cell-reveal rounded-lg px-4 py-2 text-sm font-medium ${
                  ok ? "bg-emerald-500 text-slate-950" : "bg-zinc-700 text-slate-100"
                }`}
              >
                {f.names[locale]}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
