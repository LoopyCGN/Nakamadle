import Link from "next/link";
import { notFound } from "next/navigation";
import RosterTable from "@/components/RosterTable";
import { characters, fruits } from "@/lib/data";
import { dicts, isLocale } from "@/lib/i18n";
import { filterByScope, scopeFromParam } from "@/lib/scope";

export default async function Roster({
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
  // Table editing is a local maintenance tool: only enabled when explicitly
  // opted in via env (e.g. local dev). Visitors always see a read-only table,
  // and even with editing on, drafts stay in the visitor's own browser only.
  // fullCharacters is only serialized for the local editor (editable); the public
  // read-only table never embeds spoiler names in its HTML.
  const editable = process.env.NEXT_PUBLIC_ROSTER_EDIT === "1";

  return (
    <div>
      <Link href={`/${locale}?scope=${scope}`} className="text-sm text-slate-400 hover:text-amber-300">
        ← {t.back}
      </Link>
      <h1 className="mt-1 text-2xl font-black">📜 {t.roster}</h1>
      <p className="mt-1 text-sm text-slate-400">{t.rosterDesc}</p>
      <div className="mt-4">
        <RosterTable locale={locale} characters={filterByScope(characters, scope)} fullCharacters={editable ? characters : []} fruits={fruits} scope={scope} editable={editable} />
      </div>
    </div>
  );
}
