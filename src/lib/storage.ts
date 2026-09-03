"use client";

/** SSR-safe localStorage helpers. */

export function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full / private mode — ignore
  }
}

export interface GameState {
  guesses: string[]; // character ids
  won: boolean;
}

export const emptyGame: GameState = { guesses: [], won: false };
