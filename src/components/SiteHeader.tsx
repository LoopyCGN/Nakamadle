"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { dicts, type Locale } from "@/lib/i18n";
import { DEFAULT_SCOPE, isScope, storeScope, type Scope } from "@/lib/scope";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function SiteHeader({ locale }: { locale: Locale }) {
  const t = dicts[locale];
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  // Server and client agree here (URL param or default); a stored choice is
  // applied via URL by ScopeSync, so no client-only state is needed.
  const scope: Scope = isScope(params.get("scope")) ? (params.get("scope") as Scope) : DEFAULT_SCOPE;
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        setUsername(null);
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("username").eq("id", data.user.id).single();
      setUsername(profile?.username ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) setUsername(null);
    });
    return () => sub.subscription.unsubscribe();
  }, [pathname]);

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
          <Link href={withScope(`/${locale}/leaderboard`)} className="hover:text-amber-300">
            🏆 {t.leaderboard}
          </Link>
          {username ? (
            <>
              <Link href={withScope(`/${locale}/account`)} className="font-semibold text-amber-300 hover:text-amber-200">
                {username}
              </Link>
              <button
                onClick={async () => {
                  await createClient().auth.signOut();
                  setUsername(null);
                  router.refresh();
                }}
                className="text-slate-400 hover:text-slate-200"
              >
                {t.logout}
              </button>
            </>
          ) : (
            <Link href={withScope(`/${locale}/login`)} className="hover:text-amber-300">
              {t.login}
            </Link>
          )}
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
