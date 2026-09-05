# Nakamadle 🏴‍☠️

Tägliches One-Piece-Ratespiel (Classic + Teufelsfrucht, Daily + Endlos), Deutsch & Englisch.
Stack: Next.js 16 (App Router) + TypeScript + Tailwind, Daten als versionierte JSON — kein Backend nötig.

## Start

```bash
npm install
npm run dev      # http://localhost:3000/de
npm test         # Vitest (Logik + Daten-Validierung)
npm run lint
npm run build && npm start
```

## Spielmodi

| Route | Modus |
|---|---|
| `/de/classic` | Classic-Tagesrätsel (alle gleiche Lösung, Reset 00:00 Europe/Berlin) |
| `/de/classic/endless` | Classic-Endlos (Zufall, Runden-Statistik) |
| `/de/fruits` | Teufelsfrucht-Tagesrätsel (Charakter → Frucht) |
| `/de/roster` | Charakter-Tabelle: ganzer Pool, filterbar — zum Prüfen & Erweitern |
| `/en/...` | alles auf Englisch |

Farben: 🟩 Treffer · 🟨 Teilweise (geteilte Gruppe / gleiches Meer / gleiche Saga) · 🟥 daneben.
Kopfgeld-Pfeile ↑ ↓ zeigen, ob das Ziel höher/niedriger ist. Alle Spalten (inkl. Frucht-Typ und Debüt) sind ab dem ersten Versuch sichtbar.
Marines haben Cross-Guild-Kopfgelder (⭐, Berry-Äquivalent: 1 Stern = 100 Mio, 1 Krone = 1 Mrd) statt WG-Kopfgeldern (฿).

## Spoiler-Umfang: Anime vs. Manga

Beim ersten Aufruf wählt man **📺 Anime-Stand** oder **📖 Manga-Stand** (wie im Original).
Anime blendet Manga-only-Enthüllungen aus (`animeSafe: false` in `data/characters.json`,
derzeit Gunko, Sommers, Killingham, Harald, Estrid, Imu). Jeder Scope hat eigene Tagesrätsel
(`dayNumber % Scope-Pool`) und eigene Spielstände (`opd:classic:<scope>:<datum>`).
Umschalten jederzeit über den Button im Header; die Wahl wird in `localStorage` gespeichert
und per `?scope=` in der URL mitgeführt (teilbar).

## Daten aktuell halten (wichtig!)

Single Source of Truth: `data/characters.json`, `data/fruits.json`.

1. Übersicht prüfen: `/de/roster` zeigt den kompletten Pool als filterbare Tabelle.
   Lokal mit Editor: `.env.example` nach `.env.local` kopieren (`NEXT_PUBLIC_ROSTER_EDIT=1`).
   Im Deploy bleibt die Tabelle schreibgeschützt — und selbst mit Editor landen
   Entwürfe nur im eigenen Browser (`localStorage`), nie auf dem Server.
2. Eintrag hinzufügen — zwei Wege:
   - **Direkt in der Tabelle** (`/de/roster` → `+ Hinzufügen` / `Bearbeiten` pro Zeile): validiertes Formular, speichert als **Entwurf lokal im Browser** (Badge „Entwurf“). Entwürfe lassen sich sofort im **Endlos-Modus testen**. Übernahme per `JSON kopieren` / `Herunterladen` → Inhalt in `data/characters.json` legen.
   - **Terminal**: `npm run add-character` (interaktiv, oder manuell — Schema siehe `src/lib/schema.ts`).
   **IDs nie ändern**, neue Charaktere einfach anhängen.
3. Prüfen: `npm run validate` (Schema + Frucht-Referenzen + Duplikate).
4. Commit → Deploy läuft automatisch (Vercel).

Hinweis: Die Daily-Lösung ist `dayNumber % poolSize` — wenn der Pool wächst, verschieben sich künftige Lösungen (Vergangenheit bleibt pro Datum reproduzierbar, solange IDs stabil sind).

## Deploy (gratis)

Vercel: Repo importieren → Framework-Preset Next.js → deployen. Kein Env, keine DB nötig.

## Roadmap

- Mehr Charaktere/Früchte (Ziel 100+), Spoiler-Grenze pro Saga markieren
- Archiv vergangener Tagesrätsel
- Wanted-Poster- & Lach-Modi (brauchen lizenzfreie Assets — bewusst noch nicht drin)
