<div align="center">

<img src="https://raw.githubusercontent.com/jarryuser/github-visualizer/main/preview.png" alt="GitHub Activity Visualizer preview" width="100%" />

# GitHub Activity Visualizer

**Ein sauberes Dashboard für jedes GitHub-Profil - Beitragsübersicht, Sprachverteilung, Top-Repositories, Side-by-Side-Profilvergleich und Live-Statistiken**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-→-2f81f7?style=flat-square)](https://jarryuser.github.io/github-visualizer/?user=jarryuser)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![D3.js](https://img.shields.io/badge/D3.js-7.9-F9A03C?style=flat-square&logo=d3.js&logoColor=white)](https://d3js.org/)
[![Vite](https://img.shields.io/badge/Vite-5.1-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Cloudflare Workers](https://img.shields.io/badge/Proxy-Cloudflare%20Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![GitHub Pages](https://img.shields.io/badge/Deployed%20on-GitHub%20Pages-222?style=flat-square&logo=github)](https://pages.github.com/)

[English](README.md) · [Українська](README.uk.md) · [Slovenčina](README.sk.md) · **Deutsch** · [Русский](README.ru.md)

</div>

---

## Überblick

GitHub Activity Visualizer ist ein Frontend-Dashboard, das die **GitHub REST API** und **D3.js** nutzt, um jedes öffentliche Profil zu visualisieren

Gib einen Benutzernamen ein → erhalte eine vollständige Aufschlüsselung seiner Aktivität in Sekunden. Wechsle zum **Compare**-Tab, um zwei Profile nebeneinander zu vergleichen

Alle API-Aufrufe an GitHub laufen durch einen kleinen **Cloudflare Worker**, der das API-Token als serverseitiges Geheimnis speichert und Antworten in Workers KV zwischenspeichert. Effektives Limit: 5 000 Anfragen/h von GitHub, aber in der Praxis wird fast jede Anfrage aus dem Cache bedient

**Ausprobieren:** [`?user=jarryuser`](https://jarryuser.github.io/github-visualizer/?user=jarryuser) · [`?user=torvalds`](https://jarryuser.github.io/github-visualizer/?user=torvalds) · [`?tab=compare&a=torvalds&b=gaearon`](https://jarryuser.github.io/github-visualizer/?tab=compare&a=torvalds&b=gaearon)

---

## Funktionen

| | Funktion | Details |
|---|---|---|
| 📊 | **Beitragsübersicht** | 12-Monats-Aktivitätsraster mit Tooltips pro Tag, aktuelle Serienzähler |
| 🕐 | **Arbeitszeiten-Heatmap** | 7×24-Raster, das zeigt, wann ein Benutzer typischerweise Code pusht, nach Stunde und Wochentag |
| 🌐 | **Sprachverteilung** | Über alle Repos aggregiert, animiertes Balkendiagramm, nach Sprache farbcodiert |
| ⭐ | **Top-Repositories** | Sortiert nach Sternen, mit Beschreibung, Sprache, Forks und letztem Aktualisierungszeitpunkt |
| 📈 | **Profilstatistiken** | Gesamtzahl öffentlicher Repos, erhaltene Sterne, Follower, aktuelle Serie |
| 📉 | **Aktivitätstrend** | Wochenbeitrags-Flächendiagramm der letzten 12 Monate mit Tooltips bei Hover |
| 🏢 | **Organisationsprofile** | Funktioniert sowohl für Organisationen als auch für Benutzer - Repos, Sprachen, Gesundheit, Arbeitszeiten werden angezeigt; beitragsspezifische Diagramme zeigen einen Platzhalter |
| 📖 | **Profil-README** | Wenn der Benutzer ein Repo `{username}/{username}` hat, wird dessen README.md mit vollständiger Markdown-Unterstützung gerendert |
| 🪄 | **Einbettungs-Widget** | Kompakte Profilkarte einbettbar via `<iframe>`; `</>`-Button in der Kopfzeile kopiert das fertige Snippet |
| ⚔️ | **Profilvergleich** | Side-by-Side-Ansicht zweier Profile: Statistiken mit Gewinner-Indikator, Sprachüberlappung, gestapelte Heatmaps |
| 🔗 | **Teilbare Links** | Direkter Link zu jedem Profil: `?user=benutzername` oder `?tab=compare&a=…&b=…` |
| ⚡ | **Paralleles Laden** | Alle API-Aufrufe laufen gleichzeitig via `Promise.all` - lädt in ~1s |
| 🛡️ | **Token-sicherer Proxy** | Cloudflare Worker speichert das GitHub-Token; der Browser sieht es nie |
| 💾 | **Edge-Cache** | Workers KV speichert Antworten für 10–60 Minuten; wiederholte Abfragen umgehen GitHub vollständig |
| 📡 | **Rate-Limit-Anzeige** | Live-Badge in der Kopfzeile mit verbleibendem API-Kontingent und farbcodiertem Punkt |
| 🩺 | **Repository-Gesundheit** | Prüft eigene Repos auf Beschreibung, Lizenz, letzte Aktivität und Themen - mit Balken pro Kriterium und Gesamtpunktzahl |
| 🌙 | **Dunkles / Helles Design** | Umschalten zwischen GitHub-Dark und hellem Modus; Einstellung in localStorage gespeichert |
| 🖼️ | **Export als Bild** | Lade das gesamte Dashboard mit einem Klick als PNG herunter |

---

## Technologie-Stack

| Ebene | Werkzeug | Warum |
|---|---|---|
| Sprache | TypeScript 5.3 | Typsicherheit für alle API-Antworten |
| Diagramme | D3.js v7 | Feinkörnige Kontrolle über SVG-Rendering |
| Bundler | Vite 5 | Sofortiger HMR, TS-Unterstützung ohne Konfiguration |
| Proxy / Cache | Cloudflare Workers + Workers KV | Speichert das GitHub-Token; cachet Antworten global |
| Daten | GitHub REST API v3 | Öffentliche Endpunkte für Profil, Repos und Sprachen |
| Beiträge | github-contributions-api | REST-Problemumgehung für GitHub's GraphQL-only Heatmap |
| Frontend-Hosting | GitHub Pages + gh-pages | Deployment mit einem Befehl, kostenloses Hosting |

---

## Architektur

```
┌──────────────┐   fetch /users/foo   ┌────────────────────────────┐
│   Browser    │ ───────────────────▶ │  Cloudflare Worker proxy   │
│ (GitHub Pgs) │ ◀─────────────────── │  github-visualizer-proxy   │
└──────────────┘     JSON (cached)    │                            │
                                       │   ┌────────┐  KV lookup    │
                                       │   │   KV   │ ◀──────────── │
                                       │   │ CACHE  │ ──────────▶   │
                                       │   └────────┘   (hit/miss)  │
                                       │                            │
                                       │   on miss ↓ Bearer <secret>│
                                       └─────────────┬──────────────┘
                                                     │
                                                     ▼
                                             api.github.com
```

Der Browser speichert niemals ein GitHub-Token. Er kennt nur die Worker-URL
Der Worker hat eine Positivliste von drei GitHub-Routen; alles andere gibt 404 zurück

---

## Erste Schritte

```bash
git clone https://github.com/jarryuser/github-visualizer.git
cd github-visualizer
npm install

# Frontend:
npm run dev        # → http://localhost:5173 (verwendet standardmäßig den deployed Worker)

# Worker (optional - nur wenn du den Proxy bearbeiten möchtest):
cp .env.example .env                # setzt VITE_PROXY_URL=http://localhost:8787
npm run worker:dev                  # → http://localhost:8787
```

Öffne die App, gib einen beliebigen GitHub-Benutzernamen ein, drücke **View profile**. Oder öffne den **Compare**-Tab, um zwei Profile nebeneinander zu vergleichen

---

## Deployment

### Frontend → GitHub Pages

```bash
npm run deploy
```

Aktualisiert `https://jarryuser.github.io/github-visualizer/` in ~30 Sekunden.

### Worker → Cloudflare (Erstsetup)

```bash
# 1. Einmal anmelden
npx wrangler login

# 2. KV-Namespace für Cache erstellen
npx wrangler kv:namespace create CACHE
# → kopiere die zurückgegebene ID in wrangler.toml anstelle von REPLACE_WITH_KV_NAMESPACE_ID

# 3. GitHub-Token als Worker-Secret speichern (NICHT in .env)
npm run worker:secret               # dann füge dein fine-grained PAT ein

# 4. Ausliefern
npm run worker:deploy
```

Der Worker wird veröffentlicht unter `https://github-visualizer-proxy.<your-subdomain>.workers.dev`
Aktualisiere den `PROXY_BASE`-Fallback in `src/api.ts`, wenn du einen anderen Namen verwendest

### Aktualisieren eines bestehenden Deployments

```bash
npm run worker:deploy   # liefert Änderungen an worker/index.ts aus
npm run deploy          # liefert Frontend-Änderungen aus
```

### GitHub-Token erstellen

GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate. Der Token benötigt nur die Berechtigung **`Public Repositories (read-only)`**. Füge ihn einmal via `npm run worker:secret` ein; von da an lebt er in Cloudflare und wird nie in git eingecheckt

---

## Umgebungsvariablen

| Wo | Variable | Zweck |
|---|---|---|
| `.env` (Browser, nur lokale Entwicklung) | `VITE_PROXY_URL` | Überschreibt die Worker-URL bei der Entwicklung mit einem lokalen Worker. Wenn nicht gesetzt, verwendet das Frontend den Produktions-Worker |
| Worker-Secret (Cloudflare) | `GITHUB_TOKEN` | Das fine-grained PAT, das der Worker an GitHub-Anfragen anhängt. Wird via `npm run worker:secret` gesetzt |

Es gibt **kein** `VITE_GITHUB_TOKEN` - das würde das Token in das Browser-Bundle durchsickern lassen. Der Token gehört in den Worker

---

## Projektstruktur

```
github-visualizer/
├── index.html                 - einzige HTML-Hülle, kein Framework
├── src/                       - Frontend
│   ├── api.ts                 - alle Aufrufe gehen durch den Worker-Proxy
│   ├── streak.ts              - D3 Beitrags-Heatmap + Serienzähler
│   ├── commitHeatmap.ts       - D3 Arbeitszeiten-Heatmap (7×24-Raster)
│   ├── languages.ts           - D3 animiertes Sprach-Balkendiagramm
│   ├── repos.ts               - Renderer für Top-Repository-Karten
│   ├── activityChart.ts       - D3 wöchentliches Aktivitätstrend-Flächendiagramm
│   ├── embed.ts               - kompakte Einbettungskarte: Fetch + Render für iframe-Widget
│   ├── profileReadme.ts       - lädt und rendert Profil-README.md
│   ├── compare.ts             - Side-by-Side-Profilvergleich
│   ├── healthScore.ts         - Renderer für Repository-Gesundheitsbericht
│   └── main.ts                - Einstiegspunkt, Tab-Routing, URL-Status
├── worker/
│   └── index.ts               - Cloudflare Worker: Token, Positivliste, KV-Cache
├── styles/
│   └── main.css               - GitHub-Dark-Designsystem, CSS-Variablen
├── wrangler.toml              - Worker-Konfiguration (Name, KV-Binding)
├── tsconfig.json              - Frontend-TS-Konfiguration (kompiliert src/)
├── tsconfig.worker.json       - Worker-TS-Konfiguration (typprüft worker/)
├── vite.config.ts
└── .env.example               - lokale Entwicklungs-Überschreibungen (keine Geheimnisse)
```

---

## Wie ein Profilladevorgang abläuft

```
User enters username
        │
        ▼
  Promise.all([
    fetchUser()           → Worker → KV hit? return.  miss → GitHub /users/{u}
    fetchRepos()          → Worker → KV hit? return.  miss → GitHub /users/{u}/repos
  ])
        │
        ▼ (parallel, nachdem Repos eingetroffen sind)
  Promise.all([
    fetchAllLanguages()   → Worker → KV per-repo /repos/{u}/{r}/languages  ×≤20
    fetchContributions()  → github-contributions-api.jogruber.de/v4/{u}
    fetchUserEvents()     → Worker → KV /users/{u}/events (2 Seiten, bis zu 200 Ereignisse)
  ])
        │
        ▼
  renderStreakGraph()     → D3 SVG Heatmap
  renderCommitHeatmap()  → D3 7×24 Arbeitszeiten-Raster
  renderLanguageChart()   → D3 animierte Balken
  renderTopRepos()        → HTML-Karten
  renderHealthReport()    → Repository-Gesundheitsbalken (Beschreibung, Lizenz, Aktivität, Themen)
  animateCount()          → Statistikzähler (requestAnimationFrame)
  updateRateLimitBadge() → fetch /rate_limit → Badge in Kopfzeile aktualisieren
```

Die Sprachaggregation summiert Code-Bytes über bis zu 20 kürzlich aktualisierte Repos und wandelt sie in Prozent um. Forks sind ausgeschlossen - nur Originalarbeit wird gezählt.

**Cache-TTLs** (konfiguriert in `worker/index.ts`):

| Route | TTL | Warum |
|---|---|---|
| `/rate_limit` | 1 Min | Live-Kontingent - muss frisch bleiben |
| `/users/:u` | 10 Min | Profildaten (Follower, Bio) ändern sich gelegentlich |
| `/users/:u/repos` | 10 Min | Repo-Liste ändert sich, wenn neue Repos gepusht werden |
| `/users/:u/events` | 15 Min | Letzte Push-Ereignisse für die Arbeitszeiten-Heatmap |
| `/repos/:u/:r/languages` | 60 Min | Sprach-Bytes ändern sich von Stunde zu Stunde kaum |

Hänge `?fresh=1` an jede Worker-Anfrage an, um den Cache für einen Aufruf zu umgehen.

---

## Fahrplan

### ✅ Erledigt

- [x] **Einbettungs-Widget** - kompakte Profilkarte via `?embed=1&user=…&theme=dark/light`; `</>`-Button kopiert das iframe-Snippet; Karte zeigt Avatar, Name, Ort und wichtige Statistiken
- [x] **Profil-README** - rendert `{username}/{username}/README.md` mit vollständiger Markdown-Unterstützung; Karte ausgeblendet, wenn README nicht existiert
- [x] **Organisationsprofile** - automatisch erkannt via `type`-Feld; lädt Organisationsbeschreibung separat; beitragsspezifische Diagramme zeigen Platzhalter
- [x] **Aktivitätstrend** - wöchentliches Beitrags-Flächendiagramm der letzten 12 Monate; Hover zeigt genaue Anzahl pro Woche
- [x] **Export als Bild** - Download-Button erscheint nach dem Laden eines Profils; exportiert das gesamte Dashboard als PNG mit Namen `{username}-github-stats.png`
- [x] **Heller Modus** - Sonne/Mond-Umschalter in der Kopfzeile; D3-Diagramme werden mit themenbewussten Farben neu gerendert; Einstellung in localStorage gespeichert
- [x] **Repository-Gesundheitsscore** - Balken pro Kriterium (Beschreibung, Lizenz, letzte Aktivität, Themen) über alle eigenen Repos mit prozentualer Gesamtpunktzahl
- [x] **Rate-Limit-Anzeige** - Badge in der Kopfzeile mit verbleibenden/gesamten API-Anfragen und farbigem Punkt; aktualisiert nach jedem Profilladevorgang. Tooltip zeigt Zeit bis zur Quotenauffrischung
- [x] **Commit-Zeit-Heatmap** - 7×24-Raster, das zeigt, wann ein Benutzer typischerweise codiert, nach Stunde und Wochentag. "Am aktivsten Mittwochabends"
- [x] **Profilvergleich** - `?tab=compare&a=…&b=…`, Side-by-Side-Statistiken mit Gewinner-Indikator, Sprachüberlappung, gestapelte Heatmaps
- [x] **Cloudflare Worker Proxy** - Token gelangt nie in den Browser
- [x] **Workers KV Cache** - TTL 10–60 Min pro Route, `?fresh=1` zum Umgehen

### 💡 Ideen in Prüfung

- [ ] **GitHub Profile README Generator** - Profil via API analysieren, personalisiertes `README.md` mit GPT generieren, mit einem Klick kopieren

---

## Bekannte Einschränkungen

- **Beitrags-Heatmap** verwendet einen Drittanbieter-Proxy (`github-contributions-api.jogruber.de`), da GitHub Beitragsdaten nur über die GraphQL API mit Authentifizierung bereitstellt. Dieser Proxy ist gelegentlich nicht verfügbar
- **Sprachstatistiken** spiegeln Code-Bytes wider, nicht die Anzahl der Dateien oder aufgewendete Zeit - dieselbe Methodik wie GitHub Linguist
- **Private Repositories** sind nicht sichtbar - der Worker verwendet ein Token mit Zugriff nur auf öffentliche Repos
- **Erste Anfrage an ein kaltes Profil** kostet immer noch ~20 GitHub-Aufrufe (eins pro Repo für Sprachen). Nachfolgende Ladungen innerhalb einer Stunde kommen aus dem KV

---

## Mitwirken

Issues und Pull-Requests sind willkommen. Wenn du einen Fehler findest oder eine Funktionidee hast, öffne zuerst ein Issue, damit wir darüber diskutieren können

---

## Lizenz

MIT © [Dmytro Filiurskyi](https://github.com/jarryuser)
