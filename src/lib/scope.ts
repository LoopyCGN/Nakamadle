import type { Character } from "./schema";

export type Scope = "anime" | "manga";

export const SCOPES: Scope[] = ["anime", "manga"];

/** localStorage key for the stored scope choice. */
export const SCOPE_KEY = "opd:scope";

/** Spoiler-safe default: anime-only content. */
export const DEFAULT_SCOPE: Scope = "anime";

export function isScope(x: unknown): x is Scope {
  return x === "anime" || x === "manga";
}

export function scopeFromParam(p: string | string[] | undefined): Scope {
  const v = Array.isArray(p) ? p[0] : p;
  return isScope(v) ? v : DEFAULT_SCOPE;
}

/** Manga scope = everything; anime scope hides characters flagged animeSafe: false. */
export function filterByScope(chars: Character[], scope: Scope): Character[] {
  return scope === "manga" ? chars : chars.filter((c) => c.animeSafe);
}

export function loadStoredScope(): Scope | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(SCOPE_KEY);
    return isScope(v) ? v : null;
  } catch {
    return null;
  }
}

export function storeScope(scope: Scope): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SCOPE_KEY, scope);
  } catch {
    // ignore
  }
}
