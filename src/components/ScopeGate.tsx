"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { isScope, loadStoredScope, storeScope } from "@/lib/scope";
import { dicts, type Locale } from "@/lib/i18n";

/**
 * Ensures a valid ?scope= param exists (mirrors the original's version picker).
 * - param present → stored, children shown
 * - no param but stored choice → redirect with stored scope
 * - neither → fullscreen picker modal (Anime vs Manga)
 */
export default function ScopeGate({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const t = dicts[locale];
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const param = params.get("scope");
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (isScope(param)) {
      storeScope(param);
    } else if (loadStoredScope()) {
      router.replace(`${pathname}?scope=${loadStoredScope()}`);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe: localStorage is client-only
    setShowPicker(!isScope(param));
  }, [param, pathname, router]);

  function pick(scope: "anime" | "manga") {
    storeScope(scope);
    router.replace(`${pathname}?scope=${scope}`);
    setShowPicker(false);
  }

  return (
    <>
      {children}
      {showPicker && !isScope(param) && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 text-center">
            <div className="text-4xl">🏴‍☠️</div>
            <h2 className="mt-2 text-2xl font-black">{t.scopeTitle}</h2>
            <p className="mt-1 text-sm text-slate-400">{t.scopeDesc}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => pick("anime")}
                className="rounded-2xl border border-slate-600 p-4 text-left hover:border-amber-400"
              >
                <div className="text-2xl">📺</div>
                <div className="mt-1 font-bold">{t.scopeAnime}</div>
                <div className="mt-1 text-sm text-slate-400">{t.scopeAnimeDesc}</div>
              </button>
              <button
                onClick={() => pick("manga")}
                className="rounded-2xl border border-slate-600 p-4 text-left hover:border-amber-400"
              >
                <div className="text-2xl">📖</div>
                <div className="mt-1 font-bold">{t.scopeManga}</div>
                <div className="mt-1 text-sm text-slate-400">{t.scopeMangaDesc}</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
