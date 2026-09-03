import Link from "next/link";
import { notFound } from "next/navigation";
import ClassicGame from "@/components/ClassicGame";
import Countdown from "@/components/Countdown";
import { berlinDateKey, pickDaily } from "@/lib/daily";
import { characters, dailyPool, fruits } from "@/lib/data";
import { dicts, isLocale } from "@/lib/i18n";
import { filterByScope, scopeFromParam } from "@/lib/scope";

export default async function ClassicDaily({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ scope?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dicts[locale];
  const scope = scopeFromParam((await searchParams)?.scope);

  const dateKey = berlinDateKey();
  const pool = filterByScope(dailyPool, scope);
  const target = pickDaily(pool, dateKey);

  return (
    <div>
      <Link href={`/${locale}?scope=${scope}`} className="text-sm text-slate-400 hover:text-amber-300">
        ← {t.back}
      </Link>
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-black">
          🎯 {t.classic} · {t.dailyPuzzle}
        </h1>
        <Countdown locale={locale} label={t.newPuzzleIn} />
      </div>
      <p className="mt-1 text-sm text-slate-400">{t.howToText}</p>
      <div className="mt-4">
        <ClassicGame
          locale={locale}
          characters={filterByScope(characters, scope)}
          fruits={fruits}
          initialTargetId={target.id}
          storageKey={`opd:classic:${scope}:${dateKey}`}
          historyKey={`opd:classic:history:${scope}`}
          allowNewRound={false}
          scope={scope}
        />
      </div>
    </div>
  );
}
