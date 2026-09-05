# Self-Hosting: eigene URL + eigener Server (Mini-VPS + Coolify)

Zielbild: `https://nakamadle.de` läuft auf deinem eigenen Mini-VPS,
Deploy per Git-Push wie bisher. Vercel kann parallel weiterlaufen oder danach weg.

## 0. Überblick & Kosten

| Posten | Empfehlung | Kosten (Stand 2026) |
|---|---|---|
| VPS | Hetzner **CAX11** (ARM, 2 vCPU, 4 GB RAM, Ubuntu 24.04) — unser Stack (Node, Postgres, Coolify) läuft vollständig auf ARM; Alternative: CX22 (x86, teurer) | ~4,50 €/Monat inkl. MwSt. |
| Domain | z. B. `nakamadle.de` bei INWX/Cloudflare | ~10–15 €/Jahr |
| Coolify | Open Source, läuft auf dem VPS | 0 € |

> Hinweis: Hetzner hat Mitte 2026 die Cloud-Preise erhöht (CX22 ~5,49 € o. MwSt.).
> CAX11 (ARM) ist der günstigste Einstieg und für Nakamadle völlig ausreichend.
> **Budget-Tipp ≤ 5 €: Netcup VPS Lite 1 G12s** (2 vCores, 4 GB RAM, 80 GB SSD,
> ~4,10 € netto ≈ **4,88 € inkl. MwSt.**) — **ohne** kostenpflichtige Extras
> bestellen: Standort „No preference Europe" (0 €, landet in Nürnberg/Wien/Amsterdam —
> alle ok für deutsche Nutzer) und IPv4+IPv6 (0 €). Vorsicht: Standort-Wunsch
> (+1,58 €) u. ä. treiben den Preis schnell über 8 €. 6 Monate Mindestlaufzeit
> einplanen. Für Nakamadle reicht die Leistung (gleiche CPU/RAM wie VPS 500 G12);
> Abstriche nur bei Platte (SSD statt NVMe), Leitung (500 Mbit/s) und Uptime-Garantie.
> Normale Alternative: Netcup VPS 500 G12 (~5,91 € inkl. MwSt.).
> Ganz ohne laufende Kosten geht es nur über Oracle Free Tier (mit Abstrichen, siehe Chat).

## 1. VPS bestellen & vorbereiten

1. Hetzner Cloud → Projekt → *Add Server*: **CAX11** (ARM, 2 vCPU, 4 GB RAM),
   Image **Ubuntu 24.04**, SSH-Key hinterlegen (oder per Console-Passwort).
2. Per SSH verbinden: `ssh root@<SERVER-IP>`.
3. Coolify installieren (aktuellen Befehl ggf. unter `docs.coolify.io` gegenprüfen):
   ```bash
   curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
   ```
4. Danach ist Coolify unter `http://<SERVER-IP>:8000` erreichbar → Admin-Account anlegen.

## 2. Nakamadle in Coolify deployen

1. Coolify → *Projects → Add Resource → Public Repository*:
   `https://github.com/LoopyCGN/Nakamadle`, Branch `main`.
   Coolify erkennt das `Dockerfile` automatisch (Build Pack: *Dockerfile*).
2. Unter *Environment Variables* setzen (Werte wie bisher aus Supabase/Vercel):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_ROSTER_EDIT` **nicht** setzen (Tabelle bleibt öffentlich schreibgeschützt)
3. *Deploy* → App läuft intern auf Port 3000.
4. Domain verbinden: In Coolify bei der App unter *Domains* `https://nakamadle.de`
   (und ggf. `https://www.nakamadle.de`) eintragen → Coolify holt automatisch
   Let's-Encrypt-Zertifikate.
5. Beim Domain-Anbieter einen **A-Record** `nakamadle.de → <SERVER-IP>` setzen
   (TTL niedrig für den Umzug, später hochsetzen).

## 3. Postgres (für später schon bereit)

`docker-compose.yml` im Repo enthält bereits einen `postgres:16`-Service mit
Volume (`pgdata`) und Healthcheck — aktuell nutzt die App ihn noch nicht
(`DATABASE_URL` ist reserviert für die geplante Auth.js-Migration weg von
Supabase). In Coolify stattdessen bequemer: *Add Resource → Database →
PostgreSQL* (mit automatischen Backups).

Lokal testen (braucht Docker Engine/Desktop):
```bash
cp .env.example .env   # POSTGRES_PASSWORD unbedingt ändern!
docker compose up --build -d
# → http://localhost:3000/de
docker compose down        # Container stoppen (Daten in pgdata bleiben)
docker compose down -v     # ACHTUNG: löscht auch die Datenbankdaten
```

## 4. Pflege auf dem VPS

- **Updates:** Coolify → *Servers → Update* (System + Coolify); App-Updates kommen per Git-Push automatisch.
- **Backups:** Hetzner-Snapshots (Konsole, ~cent-Beträge) + regelmäßige `pg_dump`s der Datenbank woanders ablegen, sobald sie echte Nutzerdaten enthält.
- **Logs/Monitoring:** Coolify-Dashboard pro App; bei Problemen zuerst dort schauen.

## 5. Später: weg von Supabase (eigene Auth + DB)

Aktuell hängt Login/Bestenliste noch an Supabase (läuft weiter, auch auf dem VPS).
Die Ablösung ist ein eigenes Arbeitspaket: Auth.js + direkter Postgres-Zugriff
(Prisma/Drizzle), `DATABASE_URL` aus der Compose-Datei/Coolify-DB übernehmen,
`src/lib/supabase/*` ersetzen, RLS-Regeln als App-Checks nachbauen. Die
`supabase/migrations/0001_leaderboard.sql` dient dabei als Schema-Vorlage.
