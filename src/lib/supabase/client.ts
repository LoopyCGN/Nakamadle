import { createBrowserClient } from "@supabase/ssr";

function env(name: string): string {
  const v = process.env[name];
  // Placeholder keeps `next build` working without secrets; real calls need real env.
  if (!v) {
    if (name === "NEXT_PUBLIC_SUPABASE_URL") return "https://placeholder.supabase.co";
    return "placeholder-anon-key";
  }
  return v;
}

export function createClient() {
  return createBrowserClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("NEXT_PUBLIC_SUPABASE_ANON_KEY"));
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
