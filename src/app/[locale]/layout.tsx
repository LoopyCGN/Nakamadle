import { Suspense } from "react";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import ScopeSync from "@/components/ScopeSync";
import { dicts, isLocale } from "@/lib/i18n";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dicts[locale];

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Suspense>
        <ScopeSync />
      </Suspense>
      <Suspense>
        <SiteHeader locale={locale} />
      </Suspense>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
      <footer className="border-t border-slate-800">
        <p className="mx-auto max-w-5xl px-4 py-3 text-xs text-slate-500">{t.dataNote}</p>
      </footer>
    </div>
  );
}
