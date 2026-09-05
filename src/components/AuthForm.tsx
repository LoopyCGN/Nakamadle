"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { isValidUsername } from "@/lib/auth";
import { dicts, type Locale } from "@/lib/i18n";

export default function AuthForm({ locale }: { locale: Locale }) {
  const t = dicts[locale];
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-400">
        {t.authDisabled}
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (tab === "signup" && !isValidUsername(username)) {
      setError(t.invalidUsername);
      return;
    }
    setBusy(true);
    const supabase = createClient();
    try {
      if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(error.message);
        else {
          router.refresh();
          router.push(`/${locale}${window.location.search}`);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } },
        });
        if (error) setError(error.message);
        else if (data.session) {
          router.refresh();
          router.push(`/${locale}${window.location.search}`);
        } else {
          setInfo(t.signupCheckMail);
        }
      }
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none";

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6">
      <div className="mb-4 flex gap-2">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setTab(m);
              setError(null);
              setInfo(null);
            }}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold ${
              tab === m ? "bg-amber-400 text-slate-950" : "border border-slate-600 text-slate-300"
            }`}
          >
            {m === "login" ? t.login : t.signup}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="grid gap-3">
        {tab === "signup" && (
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              {t.username}
            </span>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="strohhut_99" className={inputCls} maxLength={16} />
          </label>
        )}
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">{t.email}</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">{t.password}</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
          />
        </label>
        {error && <p className="text-sm text-rose-400">{error}</p>}
        {info && <p className="text-sm text-emerald-400">{info}</p>}
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-50"
        >
          {tab === "login" ? t.login : t.signup}
        </button>
      </form>
    </div>
  );
}
