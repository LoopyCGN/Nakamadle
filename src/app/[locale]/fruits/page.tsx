import Link from "next/link";
import { notFound } from "next/navigation";
import FruitGame from "@/components/FruitGame";
import Countdown from "@/components/Countdown";
import { berlinDateKey, pickDaily } from "@/lib/daily";
import { fruitPool, fruits } from "@/lib/data";
import { dicts, isLocale } from "@/lib/i18n";
import { filterByScope, scopeFromParam } from "@/lib/scope";

export default async function FruitsDaily({
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
  const pool = filterByScope(fruitPool, scope);
  const target = pickDaily(pool, dateKey);

  return (
    <div>
      <Link href={`/${locale}?scope=${scope}`} className="text-sm text-slate-400 hover:text-amber-300">
        ← {t.back}
      </Link>
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-black">
          😈 {t.fruitMode} · {t.dailyPuzzle}
        </h1>
        <Countdown locale={locale} label={t.newPuzzleIn} />
      </div>
      <div className="mt-4">
        <FruitGame
          locale={locale}
          characters={pool}
          fruits={fruits}
          initialTargetId={target.id}
          storageKey={`opd:fruits:${scope}:${dateKey}`}
          allowNewRound={false}
        />
      </div>
    </div>
  );
}
