import Link from "next/link";
import { notFound } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { dicts, isLocale } from "@/lib/i18n";
import { scopeFromParam } from "@/lib/scope";

export default async function Login({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ scope?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const scope = scopeFromParam((await searchParams)?.scope);

  return (
    <div>
      <Link href={`/${locale}?scope=${scope}`} className="text-sm text-slate-400 hover:text-amber-300">
        ← {dicts[locale].back}
      </Link>
      <div className="mt-4 flex justify-center">
        <AuthForm locale={locale} />
      </div>
    </div>
  );
}
