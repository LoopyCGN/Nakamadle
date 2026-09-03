"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { dicts, type Locale } from "@/lib/i18n";
import { DEFAULT_SCOPE, isScope, storeScope, type Scope } from "@/lib/scope";

export default function SiteHeader({ locale }: { locale: Locale }) {
  const t = dicts[locale];
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  // Server and client agree here (URL param or default); a stored choice is
  // applied via URL by ScopeSync, so no client-only state is needed.
  const scope: Scope = isScope(params.get("scope")) ? (params.get("scope") as Scope) : DEFAULT_SCOPE;

  const other = locale === "de" ? "en" : "de";
  const withScope = (href: string) => `${href}?scope=${scope}`;

  function switchScope() {
    const next: Scope = scope === "anime" ? "manga" : "anime";
    storeScope(next);
    const nextParams = new URLSearchParams(params.toString());
    nextParams.set("scope", next);
    router.replace(`${pathname}?${nextParams.toString()}`);
  }

  return (
    <header className="border-b border-slate-800">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link href={withScope(`/${locale}`)} className="text-xl font-black tracking-tight">
          🏴‍☠️ {t.appTitle}
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm">
          <Link href={withScope(`/${locale}/classic`)} className="hover:text-amber-300">
            {t.classic}
          </Link>
          <Link href={withScope(`/${locale}/classic/endless`)} className="hover:text-amber-300">
            {t.endless}
          </Link>
          <Link href={withScope(`/${locale}/fruits`)} className="hover:text-amber-300">
            {t.fruitMode}
          </Link>
          <Link href={withScope(`/${locale}/roster`)} className="hover:text-amber-300">
            {t.roster}
          </Link>
          <button
            onClick={switchScope}
            title={t.scopeSwitch}
            className="rounded-lg border border-amber-400/60 px-2 py-1 text-xs font-bold text-amber-300 hover:bg-amber-400/10"
          >
            {scope === "anime" ? `📺 ${t.scopeAnime}` : `📖 ${t.scopeManga}`}
          </button>
          <Link
            href={`/${other}?scope=${scope}`}
            className="rounded-lg border border-slate-700 px-2 py-1 font-semibold hover:border-amber-400"
          >
            {t.switchLang}
          </Link>
        </nav>
      </div>
    </header>
  );
}
