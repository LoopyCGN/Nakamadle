"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isValidUsername } from "@/lib/auth";
import { dicts, type Locale } from "@/lib/i18n";

export default function AccountForm({ locale, initialUsername }: { locale: Locale; initialUsername: string }) {
  const t = dicts[locale];
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setMsg(null);
    if (!isValidUsername(username)) {
      setMsg({ ok: false, text: t.invalidUsername });
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMsg({ ok: false, text: t.needLogin });
      setBusy(false);
      return;
    }
    const { error } = await supabase.from("profiles").update({ username }).eq("id", user.id);
    setBusy(false);
    if (error) {
      setMsg({ ok: false, text: t.usernameTaken });
    } else {
      setMsg({ ok: true, text: t.saved });
      router.refresh();
    }
  }

  async function logout() {
    await createClient().auth.signOut();
    router.refresh();
    router.push(`/${locale}`);
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
        <h2 className="font-bold">{t.username}</h2>
        <div className="mt-2 flex gap-2">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={16}
            className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
          />
          <button
            onClick={save}
            disabled={busy}
            className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-50"
          >
            {t.save}
          </button>
        </div>
        {msg && <p className={`mt-2 text-sm ${msg.ok ? "text-emerald-400" : "text-rose-400"}`}>{msg.text}</p>}
      </div>
      <button onClick={logout} className="w-fit rounded-xl border border-slate-600 px-4 py-2 text-sm hover:border-slate-400">
        {t.logout}
      </button>
    </div>
  );
}
