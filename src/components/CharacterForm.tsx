"use client";

import { useState } from "react";
import { dicts, type Locale } from "@/lib/i18n";
import { CharacterSchema, type Character, type Fruit } from "@/lib/schema";

interface Props {
  locale: Locale;
  fruits: Fruit[];
  knownAffiliations: string[];
  knownSeas: string[];
  knownSagas: string[];
  initial: Character | null; // null = add mode
  existingIds: string[];
  onSave: (entry: Character) => void;
  onCancel: () => void;
}

const inputCls =
  "w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none";
const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400";

export default function CharacterForm({
  locale,
  fruits,
  knownAffiliations,
  knownSeas,
  knownSagas,
  initial,
  existingIds,
  onSave,
  onCancel,
}: Props) {
  const t = dicts[locale];
  const [id, setId] = useState(initial?.id ?? "");
  const [de, setDe] = useState(initial?.names.de ?? "");
  const [en, setEn] = useState(initial?.names.en ?? "");
  const [aliases, setAliases] = useState(initial?.names.aliases.join(", ") ?? "");
  const [gender, setGender] = useState<Character["gender"]>(initial?.gender ?? "male");
  const [affiliation, setAffiliation] = useState(initial?.affiliation.join(", ") ?? "");
  const [sea, setSea] = useState(initial?.origin.sea ?? "");
  const [place, setPlace] = useState(initial?.origin.place ?? "");
  const [haki, setHaki] = useState<string[]>(initial?.haki ?? []);
  const [fruitId, setFruitId] = useState(initial?.fruitId ?? "");
  const [bounty, setBounty] = useState(initial?.bounty === null || initial?.bounty === undefined ? "" : String(initial.bounty));
  const [saga, setSaga] = useState(initial?.debut.saga ?? "");
  const [arc, setArc] = useState(initial?.debut.arc ?? "");
  const [status, setStatus] = useState<Character["status"]>(initial?.status ?? "alive");
  const [bountySource, setBountySource] = useState<Character["bountySource"]>(initial?.bountySource ?? "wg");
  const [animeSafe, setAnimeSafe] = useState(initial?.animeSafe ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function toggleHaki(h: string) {
    setHaki((prev) => (prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h]));
  }

  function err(path: string): string | undefined {
    return errors[path];
  }

  function field(path: string, label: string, control: React.ReactNode) {
    return (
      <label className="block">
        <span className={labelCls}>{label}</span>
        {control}
        {err(path) && <span className="mt-0.5 block text-xs text-rose-400">{err(path)}</span>}
      </label>
    );
  }

  function submit() {
    const split = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
    const candidate = {
      id: id.trim(),
      names: { de: de.trim(), en: en.trim(), aliases: split(aliases) },
      gender,
      affiliation: split(affiliation),
      origin: place.trim() ? { sea: sea.trim(), place: place.trim() } : { sea: sea.trim() },
      haki,
      fruitId: fruitId === "" ? null : fruitId,
      bounty: bounty.trim() === "" ? null : Number(bounty.trim()),
      bountySource,
      debut: { saga: saga.trim(), arc: arc.trim() },
      status,
      animeSafe,
    };
    const parsed = CharacterSchema.safeParse(candidate);
    const nextErrors: Record<string, string> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".");
        if (!nextErrors[path]) nextErrors[path] = issue.message;
      }
    }
    if (initial === null && existingIds.includes(candidate.id)) {
      nextErrors["id"] = t.idTaken;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0 && parsed.success) {
      onSave(parsed.data);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-5">
        <h2 className="text-lg font-bold">{initial ? t.formEdit : t.formAdd}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {field("id", "ID (kebab-case)", (
            <input value={id} disabled={initial !== null} onChange={(e) => setId(e.target.value)} placeholder="nekomamushi" className={`${inputCls} disabled:opacity-50`} />
          ))}
          {field("status", t.colStatus, (
            <select value={status} onChange={(e) => setStatus(e.target.value as Character["status"])} className={inputCls}>
              <option value="alive">{locale === "de" ? "Lebendig" : "Alive"}</option>
              <option value="deceased">{locale === "de" ? "Verstorben" : "Deceased"}</option>
              <option value="unknown">{locale === "de" ? "Unbekannt" : "Unknown"}</option>
            </select>
          ))}
          {field("names.de", `${t.colName} (DE)`, (
            <input value={de} onChange={(e) => setDe(e.target.value)} className={inputCls} />
          ))}
          {field("names.en", `${t.colName} (EN)`, (
            <input value={en} onChange={(e) => setEn(e.target.value)} className={inputCls} />
          ))}
          <div className="sm:col-span-2">
            {field("names.aliases", t.aliasesLabel, (
              <input value={aliases} onChange={(e) => setAliases(e.target.value)} placeholder="Strohhut, Straw Hat" className={inputCls} />
            ))}
          </div>
          {field("gender", t.colGender, (
            <select value={gender} onChange={(e) => setGender(e.target.value as Character["gender"])} className={inputCls}>
              <option value="male">{locale === "de" ? "Männlich" : "Male"}</option>
              <option value="female">{locale === "de" ? "Weiblich" : "Female"}</option>
            </select>
          ))}
          {field("affiliation", t.colAffiliation, (
            <input value={affiliation} onChange={(e) => setAffiliation(e.target.value)} list="affiliations" className={inputCls} />
          ))}
          {field("origin.sea", t.colOrigin, (
            <input value={sea} onChange={(e) => setSea(e.target.value)} list="seas" className={inputCls} />
          ))}
          {field("origin.place", `${t.colOrigin} — ${t.placeLabel} (${t.optional})`, (
            <input value={place} onChange={(e) => setPlace(e.target.value)} className={inputCls} />
          ))}
          <div>
            <span className={labelCls}>{t.colHaki}</span>
            <div className="flex gap-3 pt-2">
              {(["armament", "observation", "conqueror"] as const).map((h) => (
                <label key={h} className="flex items-center gap-1 text-sm">
                  <input type="checkbox" checked={haki.includes(h)} onChange={() => toggleHaki(h)} className="accent-amber-400" />
                  {h}
                </label>
              ))}
            </div>
          </div>
          {field("fruitId", t.colFruit, (
            <select value={fruitId} onChange={(e) => setFruitId(e.target.value)} className={inputCls}>
              <option value="">—</option>
              {fruits.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.names[locale]} ({f.id})
                </option>
              ))}
            </select>
          ))}
          {field("bounty", `${t.colBounty} (Berry)`, (
            <input value={bounty} onChange={(e) => setBounty(e.target.value)} inputMode="numeric" placeholder="—" className={inputCls} />
          ))}
          {field("bountySource", t.colBounty, (
            <select value={bountySource} onChange={(e) => setBountySource(e.target.value as Character["bountySource"])} className={inputCls}>
              <option value="wg">{t.bountySourceWG}</option>
              <option value="cross-guild">{t.bountySourceCG}</option>
            </select>
          ))}
          {field("debut.saga", `${t.colDebut} — Saga`, (
            <input value={saga} onChange={(e) => setSaga(e.target.value)} list="sagas" className={inputCls} />
          ))}
          {field("debut.arc", `${t.colDebut} — Arc`, (
            <input value={arc} onChange={(e) => setArc(e.target.value)} className={inputCls} />
          ))}
          <label className="flex items-center gap-2 pt-5 text-sm">
            <input type="checkbox" checked={animeSafe} onChange={(e) => setAnimeSafe(e.target.checked)} className="accent-amber-400" />
            {t.animeSafeLabel}
          </label>
        </div>
        <datalist id="affiliations">
          {knownAffiliations.map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>
        <datalist id="seas">
          {knownSeas.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <datalist id="sagas">
          {knownSagas.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-xl border border-slate-600 px-4 py-2 text-sm hover:border-slate-400">
            {t.cancel}
          </button>
          <button onClick={submit} className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300">
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
