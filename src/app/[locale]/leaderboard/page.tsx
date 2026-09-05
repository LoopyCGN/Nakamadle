import Link from "next/link";
import { notFound } from "next/navigation";
import { berlinDateKey } from "@/lib/daily";
import { dicts, isLocale } from "@/lib/i18n";
import { scopeFromParam, type Scope } from "@/lib/scope";
import { createClient } from "@/lib/supabase/server";

type Board = "daily" | "alltime";
type Mode = "classic" | "fruits";

function tabCls(active: boolean) {
  return `rounded-lg px-3 py-1.5 text-sm font-semibold ${active ? "bg-amber-400 text-slate-950" : "border border-slate-700 text-slate-300"}`;
}

export default async function Leaderboard({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ scope?: string; board?: string; mode?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dicts[locale];
  const sp = await searchParams;
  const scope: Scope = scopeFromParam(sp?.scope);
  const board: Board = sp?.board === "alltime" ? "alltime" : "daily";
  const mode: Mode = sp?.mode === "fruits" ? "fruits" : "classic";

  const link = (b: Board, m: Mode) => `/${locale}/leaderboard?scope=${scope}&board=${b}&mode=${m}`;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return (
    <div>
      <Link href={`/${locale}?scope=${scope}`} className="text-sm text-slate-400 hover:text-amber-300">
        ← {t.back}
      </Link>
      <h1 className="mt-1 text-2xl font-black">🏆 {t.leaderboard}</h1>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={link("daily", mode)} className={tabCls(board === "daily")}>
          {t.dailyBoard}
        </Link>
        <Link href={link("alltime", mode)} className={tabCls(board === "alltime")}>
          {t.allTime}
        </Link>
        <span className="mx-1 border-l border-slate-700" />
        <Link href={link(board, "classic")} className={tabCls(mode === "classic")}>
          {t.classic}
        </Link>
        <Link href={link(board, "fruits")} className={tabCls(mode === "fruits")}>
          {t.fruitMode}
        </Link>
      </div>
      <div className="mt-3">
        {!configured ? (
          <p className="text-sm text-slate-400">{t.authDisabled}</p>
        ) : board === "daily" ? (
          <DailyBoard locale={locale} mode={mode} scope={scope} highlight={user?.id ?? null} />
        ) : (
          <AllTimeBoard locale={locale} highlight={user?.id ?? null} />
        )}
      </div>
      {!user && configured && <p className="mt-3 text-sm text-slate-500">{t.loginHint}</p>}
    </div>
  );
}

async function DailyBoard({
  locale,
  mode,
  scope,
  highlight,
}: {
  locale: "de" | "en";
  mode: Mode;
  scope: Scope;
  highlight: string | null;
}) {
  const t = dicts[locale];
  const supabase = await createClient();
  const today = berlinDateKey();
  const { data } = await supabase
    .from("results")
    .select("attempts,won,user_id,profiles!inner(username)")
    .eq("mode", mode)
    .eq("scope", scope)
    .eq("date_key", today)
    .order("won", { ascending: false })
    .order("attempts", { ascending: true })
    .limit(50);

  if (!data || data.length === 0) return <p className="text-sm text-slate-500">{t.noEntries}</p>;
  return (
    <BoardTable
      locale={locale}
      rows={data.map((r) => ({
        name: (r.profiles as unknown as { username: string }).username,
        attempts: r.attempts,
        won: r.won,
        mine: r.user_id === highlight,
      }))}
    />
  );
}

async function AllTimeBoard({ locale, highlight }: { locale: "de" | "en"; highlight: string | null }) {
  const t = dicts[locale];
  const supabase = await createClient();
  const { data } = await supabase
    .from("leaderboard_alltime")
    .select("user_id,username,plays,wins,avg_attempts")
    .order("wins", { ascending: false })
    .order("avg_attempts", { ascending: true })
    .limit(50);

  if (!data || data.length === 0) return <p className="text-sm text-slate-500">{t.noEntries}</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full border-collapse bg-slate-900 text-sm">
        <thead className="bg-slate-800/80">
          <tr>
            <th className="px-3 py-2 text-left text-xs uppercase text-slate-400">{t.rank}</th>
            <th className="px-3 py-2 text-left text-xs uppercase text-slate-400">{t.player}</th>
            <th className="px-3 py-2 text-right text-xs uppercase text-slate-400">{t.wins}</th>
            <th className="px-3 py-2 text-right text-xs uppercase text-slate-400">{t.plays}</th>
            <th className="px-3 py-2 text-right text-xs uppercase text-slate-400">{t.avgAttempts}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={r.user_id} className={`border-t border-slate-800 ${r.user_id === highlight ? "bg-amber-400/10" : ""}`}>
              <td className="px-3 py-2">{i + 1}</td>
              <td className="px-3 py-2 font-semibold">{r.username}</td>
              <td className="px-3 py-2 text-right">{r.wins}</td>
              <td className="px-3 py-2 text-right">{r.plays}</td>
              <td className="px-3 py-2 text-right">{r.avg_attempts ?? "–"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BoardTable({
  locale,
  rows,
}: {
  locale: "de" | "en";
  rows: { name: string; attempts: number; won: boolean; mine: boolean }[];
}) {
  const t = dicts[locale];
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full border-collapse bg-slate-900 text-sm">
        <thead className="bg-slate-800/80">
          <tr>
            <th className="px-3 py-2 text-left text-xs uppercase text-slate-400">{t.rank}</th>
            <th className="px-3 py-2 text-left text-xs uppercase text-slate-400">{t.player}</th>
            <th className="px-3 py-2 text-right text-xs uppercase text-slate-400">{t.attempts}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={`border-t border-slate-800 ${r.mine ? "bg-amber-400/10" : ""}`}>
              <td className="px-3 py-2">{i + 1}</td>
              <td className="px-3 py-2 font-semibold">{r.name}</td>
              <td className={`px-3 py-2 text-right font-mono ${r.won ? "text-emerald-400" : "text-rose-400"}`}>
                {r.won ? r.attempts : "✗"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
