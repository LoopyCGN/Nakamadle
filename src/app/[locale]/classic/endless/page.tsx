import Link from "next/link";
import { notFound } from "next/navigation";
import ClassicGame from "@/components/ClassicGame";
import { characters, fruits } from "@/lib/data";
import { dicts, isLocale } from "@/lib/i18n";
import { filterByScope, scopeFromParam } from "@/lib/scope";

export default async function ClassicEndless({
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

  return (
    <div>
      <Link href={`/${locale}?scope=${scope}`} className="text-sm text-slate-400 hover:text-amber-300">
        ← {t.back}
      </Link>
      <h1 className="mt-1 text-2xl font-black">
        ♾️ {t.classic} · {t.endless}
      </h1>
      <p className="mt-1 text-sm text-slate-400">{t.endlessDesc}</p>
      <div className="mt-4">
        <ClassicGame
          locale={locale}
          characters={filterByScope(characters, scope)}
          fruits={fruits}
          initialTargetId={null}
          storageKey={null}
          historyKey={null}
          allowNewRound
          enableDrafts
          scope={scope}
        />
      </div>
    </div>
  );
}
