import type { SupabaseClient } from "@supabase/supabase-js";
import type { Scope } from "./scope";

export function isValidUsername(name: string): boolean {
  return /^[a-zA-Z0-9_]{3,16}$/.test(name);
}

export interface DailyResult {
  mode: "classic" | "fruits";
  scope: Scope;
  dateKey: string; // YYYY-MM-DD
  attempts: number;
  won: boolean;
}

/**
 * Persist a finished daily game for logged-in users (idempotent upsert).
 * Guests return false and keep localStorage-only stats. Client-reported
 * scores are trust-based (same as the original game); RLS + the unique
 * constraint at least bind every row to its account.
 */
export async function saveDailyResult(
  supabase: SupabaseClient,
  result: DailyResult,
): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { error } = await supabase.from("results").upsert(
      {
        user_id: user.id,
        mode: result.mode,
        scope: result.scope,
        date_key: result.dateKey,
        attempts: result.attempts,
        won: result.won,
      },
      { onConflict: "user_id,mode,scope,date_key" },
    );
    return !error;
  } catch {
    return false;
  }
}
