import Link from "next/link";
import { notFound } from "next/navigation";
import AccountForm from "@/components/AccountForm";
import { dicts, isLocale } from "@/lib/i18n";
import { scopeFromParam } from "@/lib/scope";
import { createClient } from "@/lib/supabase/server";

export default async function Account({
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div>
        <Link href={`/${locale}?scope=${scope}`} className="text-sm text-slate-400 hover:text-amber-300">
          ← {t.back}
        </Link>
        <p className="mt-4 text-slate-300">
          {t.needLogin}{" "}
          <Link href={`/${locale}/login?scope=${scope}`} className="text-amber-300 underline">
            {t.login}
          </Link>
        </p>
      </div>
    );
  }

  const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single();
  const { data: results } = await supabase
    .from("results")
    .select("mode,scope,date_key,attempts,won")
    .eq("user_id", user.id)
    .order("date_key", { ascending: false })
    .limit(30);

  const plays = results?.length ?? 0;
  const wins = results?.filter((r) => r.won).length ?? 0;

  return (
    <div>
      <Link href={`/${locale}?scope=${scope}`} className="text-sm text-slate-400 hover:text-amber-300">
        ← {t.back}
      </Link>
      <h1 className="mt-1 text-2xl font-black">👤 {t.account}</h1>
      <p className="mt-1 text-sm text-slate-400">{user.email}</p>
      <div className="mt-4 grid gap-4">
        <AccountForm locale={locale} initialUsername={profile?.username ?? ""} />
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
          <h2 className="font-bold">
            {t.myStats}: {wins}/{plays} {t.wins.toLowerCase()}
          </h2>
          {results && results.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm">
              {results.map((r, i) => (
                <li key={i} className="flex justify-between gap-2 text-slate-300">
                  <span>
                    {r.date_key} · {r.mode} · {r.scope}
                  </span>
                  <span className={r.won ? "text-emerald-400" : "text-rose-400"}>
                    {r.won ? `✓ ${r.attempts}` : "✗"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">{t.noEntries}</p>
          )}
        </div>
      </div>
    </div>
  );
}
