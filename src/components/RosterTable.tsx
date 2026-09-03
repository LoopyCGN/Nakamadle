"use client";

import { useMemo, useState } from "react";
import CharacterForm from "./CharacterForm";
import { applyDrafts, DRAFTS_KEY, draftCount, emptyDrafts, isDraftId, type RosterDrafts } from "@/lib/drafts";
import { filterByScope, type Scope } from "@/lib/scope";
import { loadJSON, saveJSON } from "@/lib/storage";
import { dicts, tv, type Locale } from "@/lib/i18n";
import type { Character, Fruit } from "@/lib/schema";

interface Props {
  locale: Locale;
  /** Scope-filtered characters for display. */
  characters: Character[];
  /** Full pool (unfiltered) for export, datalists and duplicate checks. */
  fullCharacters: Character[];
  fruits: Fruit[];
  scope: Scope;
  editable?: boolean;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

export default function RosterTable({ locale, characters, fullCharacters, fruits, scope, editable = false }: Props) {
  const t = dicts[locale];
  const [q, setQ] = useState("");
  const [drafts, setDrafts] = useState<RosterDrafts>(() => loadJSON<RosterDrafts>(DRAFTS_KEY, emptyDrafts));
  const [form, setForm] = useState<{ mode: "add" } | { mode: "edit"; id: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const baseIds = useMemo(() => new Set(fullCharacters.map((c) => c.id)), [fullCharacters]);
  // Spoiler scope first, then local drafts on top (drafts are the user's own data).
  const all = useMemo(() => filterByScope(applyDrafts(characters, drafts), scope), [characters, drafts, scope]);
  const byId = useMemo(() => new Map(all.map((c) => [c.id, c])), [all]);
  const nDrafts = draftCount(drafts);

  const knownAffiliations = useMemo(() => [...new Set(fullCharacters.flatMap((c) => c.affiliation))].sort(), [fullCharacters]);
  const knownSeas = useMemo(() => [...new Set(fullCharacters.map((c) => c.origin.sea))].sort(), [fullCharacters]);
  const knownSagas = useMemo(() => [...new Set(fullCharacters.map((c) => c.debut.saga))].sort(), [fullCharacters]);

  const fruitName = useMemo(() => {
    const m = new Map(fruits.map((f) => [f.id, f.names[locale]]));
    return (id: string | null) => (id === null ? "–" : (m.get(id) ?? id));
  }, [fruits, locale]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const sorted = [...all].sort((a, b) => a.names[locale].localeCompare(b.names[locale]));
    if (!needle) return sorted;
    return sorted.filter((c) =>
      `${c.names.de} ${c.names.en} ${c.names.aliases.join(" ")} ${c.affiliation.join(" ")} ${c.debut.arc} ${c.debut.saga}`
        .toLowerCase()
        .includes(needle),
    );
  }, [q, all, locale]);

  function persist(next: RosterDrafts) {
    setDrafts(next);
    saveJSON(DRAFTS_KEY, next);
  }

  function saveEntry(entry: Character) {
    const next: RosterDrafts = { added: [...drafts.added], edited: { ...drafts.edited } };
    if (baseIds.has(entry.id)) {
      next.edited[entry.id] = entry;
    } else {
      const i = next.added.findIndex((c) => c.id === entry.id);
      if (i >= 0) next.added[i] = entry;
      else next.added.push(entry);
    }
    persist(next);
    setForm(null);
  }

  function revertRow(id: string) {
    persist({ added: drafts.added.filter((c) => c.id !== id), edited: Object.fromEntries(Object.entries(drafts.edited).filter(([k]) => k !== id)) });
  }

  async function onCopy() {
    const ok = await copyText(JSON.stringify(applyDrafts(fullCharacters, drafts), null, 2) + "\n");
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function onDownload() {
    const blob = new Blob([JSON.stringify(applyDrafts(fullCharacters, drafts), null, 2) + "\n"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "characters.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  const th = "whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400";
  const td = "whitespace-nowrap px-3 py-2 text-sm";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.rosterSearch}
          className="w-full max-w-md flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
        />
        {editable && (
          <button
            onClick={() => setForm({ mode: "add" })}
            className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300"
          >
            + {t.add}
          </button>
        )}
      </div>
      <p className="mt-2 text-sm text-slate-400">
        {rows.length} · {t.rosterCount}
        {nDrafts > 0 && (
          <span className="ml-2 rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-semibold text-amber-300">
            {nDrafts} {t.draft}
          </span>
        )}
      </p>

      {editable && nDrafts > 0 && (
        <div className="mt-2 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3">
          <p className="text-sm text-amber-200">{t.exportHint}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={onCopy} className="rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-amber-300">
              {copied ? t.copied : t.copyJson}
            </button>
            <button onClick={onDownload} className="rounded-lg border border-amber-400/60 px-3 py-1.5 text-sm text-amber-200 hover:bg-amber-400/10">
              {t.download}
            </button>
            <button onClick={() => persist(emptyDrafts)} className="rounded-lg px-3 py-1.5 text-sm text-slate-400 underline hover:text-slate-200">
              {t.discardAll}
            </button>
          </div>
        </div>
      )}

      <div className="mt-2 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full border-collapse bg-slate-900">
          <thead className="bg-slate-800/80">
            <tr>
              <th className={th}>{t.colName}</th>
              <th className={th}>{t.colAffiliation}</th>
              <th className={th}>{t.colOrigin}</th>
              <th className={th}>{t.colHaki}</th>
              <th className={th}>{t.colFruit}</th>
              <th className={th}>{t.colBounty}</th>
              <th className={th}>{t.colDebut}</th>
              <th className={th}>{t.colStatus}</th>
              {editable && <th className={th} />}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const isDraft = isDraftId(drafts, c.id);
              return (
                <tr key={c.id} className="border-t border-slate-800 hover:bg-slate-800/40">
                  <td className={`${td} font-semibold text-slate-100`}>
                    {c.names[locale]}
                    {isDraft && (
                      <span className="ml-2 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300">
                        {t.draft}
                      </span>
                    )}
                  </td>
                  <td className={td}>{c.affiliation.map((a) => tv(locale, "affiliation", a)).join(" / ")}</td>
                  <td className={td}>
                    {tv(locale, "sea", c.origin.sea)}
                    {c.origin.place ? ` · ${c.origin.place}` : ""}
                  </td>
                  <td className={td}>
                    {c.haki.length === 0 ? "–" : c.haki.map((h) => tv(locale, "haki", h)).join(", ")}
                  </td>
                  <td className={td}>{fruitName(c.fruitId)}</td>
                  <td className={`${td} text-right font-mono`}>
                    {c.bounty === null ? t.noBounty : new Intl.NumberFormat(locale).format(c.bounty)}
                  </td>
                  <td className={td}>{c.debut.arc}</td>
                  <td className={td}>{tv(locale, "status", c.status)}</td>
                  {editable && (
                    <td className={td}>
                      <div className="flex gap-2">
                        <button onClick={() => setForm({ mode: "edit", id: c.id })} className="text-xs text-sky-300 underline hover:text-sky-100">
                          {t.edit}
                        </button>
                        {isDraft && (
                          <button onClick={() => revertRow(c.id)} className="text-xs text-slate-400 underline hover:text-slate-200">
                            {t.revert}
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {form && (
        <CharacterForm
          locale={locale}
          fruits={fruits}
          knownAffiliations={knownAffiliations}
          knownSeas={knownSeas}
          knownSagas={knownSagas}
          initial={form.mode === "edit" ? (byId.get(form.id) ?? null) : null}
          existingIds={all.map((c) => c.id)}
          onSave={saveEntry}
          onCancel={() => setForm(null)}
        />
      )}
    </div>
  );
}
