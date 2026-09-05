import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ScopeGate from "@/components/ScopeGate";
import { dicts, isLocale } from "@/lib/i18n";
import { scopeFromParam } from "@/lib/scope";

export default async function Home({
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

  const cards = [
    { href: `/${locale}/classic?scope=${scope}`, title: `${t.classic} · ${t.dailyPuzzle}`, desc: t.classicDesc, emoji: "🎯" },
    { href: `/${locale}/classic/endless?scope=${scope}`, title: t.endless, desc: t.endlessDesc, emoji: "♾️" },
    { href: `/${locale}/fruits?scope=${scope}`, title: `${t.fruitMode} · ${t.dailyPuzzle}`, desc: t.fruitModeDesc, emoji: "😈" },
    { href: `/${locale}/roster?scope=${scope}`, title: t.roster, desc: t.rosterDesc, emoji: "📜" },
    { href: `/${locale}/leaderboard?scope=${scope}`, title: t.leaderboard, desc: t.loginHint, emoji: "🏆" },
  ];

  return (
    <Suspense>
      <ScopeGate locale={locale}>
        <div>
          <h1 className="text-3xl font-black">🏴‍☠️ {t.appTitle}</h1>
          <p className="mt-1 text-slate-400">{t.tagline}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="rounded-2xl border border-slate-700 bg-slate-900 p-5 hover:border-amber-400"
              >
                <div className="text-3xl">{c.emoji}</div>
                <div className="mt-2 font-bold">{c.title}</div>
                <div className="mt-1 text-sm text-slate-400">{c.desc}</div>
              </Link>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="font-bold">{t.howTo}</h2>
            <p className="mt-1 text-sm text-slate-300">{t.howToText}</p>
          </div>
        </div>
      </ScopeGate>
    </Suspense>
  );
}
