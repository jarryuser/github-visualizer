<div align="center">

<img src="https://raw.githubusercontent.com/jarryuser/github-visualizer/main/preview.png" alt="GitHub Activity Visualizer preview" width="100%" />

# GitHub Activity Visualizer

**Čistý dashboard pre akýkoľvek GitHub profil - tepelná mapa príspevkov, rozdelenie programovacích jazykov, top repozitáre, porovnanie profilov vedľa seba a živé štatistiky**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-→-2f81f7?style=flat-square)](https://jarryuser.github.io/github-visualizer/?user=jarryuser)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![D3.js](https://img.shields.io/badge/D3.js-7.9-F9A03C?style=flat-square&logo=d3.js&logoColor=white)](https://d3js.org/)
[![Vite](https://img.shields.io/badge/Vite-5.1-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Cloudflare Workers](https://img.shields.io/badge/Proxy-Cloudflare%20Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![GitHub Pages](https://img.shields.io/badge/Deployed%20on-GitHub%20Pages-222?style=flat-square&logo=github)](https://pages.github.com/)

[English](README.md) · [Українська](README.uk.md) · **Slovenčina** · [Deutsch](README.de.md) · [Русский](README.ru.md)


</div>

---

## Prehľad

GitHub Activity Visualizer je front-end dashboard, ktorý používa **GitHub REST API** a **D3.js** na vizualizáciu akéhokoľvek verejného profilu

Zadajte používateľské meno → okamžite získate kompletný rozbor jeho aktivity. Prepnite sa na kartu **Compare** a porovnajte dva profily vedľa seba

Všetky požiadavky na GitHub API prechádzajú cez malý **Cloudflare Worker**, ktorý uchováva API token ako serverové tajomstvo a ukladá odpovede do vyrovnávacej pamäte Workers KV. Efektívny limit: 5 000 req/h z GitHubu, ale v praxi je takmer každá požiadavka obslúžená z cache

**Vyskúšajte:** [`?user=jarryuser`](https://jarryuser.github.io/github-visualizer/?user=jarryuser) · [`?user=torvalds`](https://jarryuser.github.io/github-visualizer/?user=torvalds) · [`?tab=compare&a=torvalds&b=gaearon`](https://jarryuser.github.io/github-visualizer/?tab=compare&a=torvalds&b=gaearon)

---

## Funkcie

| | Funkcia | Podrobnosti |
|---|---|---|
| 📊 | **Tepelná mapa príspevkov** | 12-mesačná mriežka aktivity s dennými tooltipmi, počítadlo aktuálnej série |
| 🕐 | **Tepelná mapa hodín kódovania** | Mriežka 7×24 zobrazujúca, kedy používateľ zvyčajne pushuje kód, podľa hodiny a dňa v týždni |
| 🌐 | **Rozdelenie jazykov** | Agregované naprieč všetkými repozitármi, animovaný pruhový graf, farebne odlíšené podľa jazyka |
| ⭐ | **Top repozitáre** | Zoradené podľa hviezdičiek, s popisom, jazykom, forkmi a časom poslednej aktualizácie |
| 📈 | **Štatistiky profilu** | Celkový počet verejných repozitárov, získaných hviezdičiek, sledovateľov, aktuálna séria |
| 📉 | **Trend aktivity** | Plošný graf týždenných príspevkov za posledných 12 mesiacov s tooltipmi pri hoveri |
| 🏢 | **Profily organizácií** | Funguje pre organizácie aj používateľov - repozitáre, jazyky, zdravie, hodiny kódovania sa zobrazujú; grafy príspevkov zobrazujú placeholder |
| 📖 | **README profilu** | Ak má používateľ repozitár `{username}/{username}` vykreslí jeho README.md s plnou podporou Markdown |
| 🪄 | **Widget na vloženie** | Kompaktná karta profilu vložiteľná cez `<iframe>`; tlačidlo `</>` v hlavičke kopíruje hotový snippet |
| ⚔️ | **Porovnanie profilov** | Zobrazenie dvoch profilov vedľa seba: štatistiky s indikátorom víťaza, prekrývanie jazykov, spojené tepelné mapy |
| 🔗 | **Zdieľateľné odkazy** | Priamy odkaz na ľubovoľný profil: `?user=username` alebo `?tab=compare&a=…&b=…` |
| ⚡ | **Paralelné načítavanie** | Všetky API požiadavky bežia súčasne cez `Promise.all` - načítanie za ~1s |
| 🛡️ | **Token-bezpečný proxy** | Cloudflare Worker uchováva GitHub token; prehliadač ho nikdy nevidí |
| 💾 | **Cache na okraji siete** | Workers KV ukladá odpovede na 10–60 minút; opakované požiadavky úplne obchádzajú GitHub |
| 📡 | **Indikátor limitov požiadaviek** | Živý odznak v hlavičke zobrazujúci zostávajúcu API kvótu s farebnou bodkou |
| 🩺 | **Zdravie repozitárov** | Kontroluje vlastné repozitáre na popis, licenciu, nedávnu aktivitu a témy - s pruhmi podľa kritérií a celkovým skóre |
| 🌙 | **Tmavá / svetlá téma** | Prepínanie medzi GitHub-dark a svetlým režimom; preferencia uložená v localStorage |
| 🖼️ | **Export ako obrázok** | Stiahnutie celého dashboardu ako PNG jedným kliknutím |

---

## Technologický stack

| Vrstva | Nástroj | Prečo |
|---|---|---|
| Jazyk | TypeScript 5.3 | Typová bezpečnosť pre všetky API odpovede |
| Grafy | D3.js v7 | Jemná kontrola nad SVG vykresľovaním |
| Bundler | Vite 5 | Okamžitý HMR, TS podpora bez konfigurácie |
| Proxy / cache | Cloudflare Workers + Workers KV | Uchováva GitHub token; celosvetovo ukladá odpovede do cache |
| Dáta | GitHub REST API v3 | Verejné endpointy profilu, repozitárov a jazykov |
| Príspevky | github-contributions-api | REST obchádzka pre GraphQL-only tepelnú mapu GitHubu |
| Hosting frontendu | GitHub Pages + gh-pages | Nasadenie jedným príkazom, bezplatný hosting |

---

## Architektúra

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

Prehliadač nikdy neuchováva GitHub token. Pozná iba URL Worker-a
Worker má zoznam povolených troch GitHub ciest; všetko ostatné vracia 404

---

## Začíname

```bash
git clone https://github.com/jarryuser/github-visualizer.git
cd github-visualizer
npm install

# Front-end:
npm run dev        # → http://localhost:5173 (štandardne používa nasadený Worker)

# Worker (voliteľné - iba ak chcete upravovať proxy):
cp .env.example .env                # nastaví VITE_PROXY_URL=http://localhost:8787
npm run worker:dev                  # → http://localhost:8787
```

Otvorte aplikáciu, zadajte ľubovoľné GitHub používateľské meno, stlačte **View profile**. Alebo otvorte kartu **Compare** a porovnajte dva profily vedľa seba

---

## Nasadenie

### Front-end → GitHub Pages

```bash
npm run deploy
```

Aktualizuje `https://jarryuser.github.io/github-visualizer/` približne za 30 sekúnd.

### Worker → Cloudflare (prvé nastavenie)

```bash
# 1. Prihláste sa raz
npx wrangler login

# 2. Vytvorte KV namespace pre cache
npx wrangler kv:namespace create CACHE
# → skopírujte získané id do wrangler.toml namiesto REPLACE_WITH_KV_NAMESPACE_ID

# 3. Uložte GitHub token ako Worker secret (NIE do .env)
npm run worker:secret               # potom vložte váš fine-grained PAT

# 4. Nasadenie
npm run worker:deploy
```

Worker je publikovaný na `https://github-visualizer-proxy.<your-subdomain>.workers.dev`
Aktualizujte hodnotu `PROXY_BASE` v `src/api.ts`, ak používate iný názov

### Aktualizácia existujúceho nasadenia

```bash
npm run worker:deploy   # nasadzuje zmeny v worker/index.ts
npm run deploy          # nasadzuje zmeny frontendu
```

### Vytvorenie GitHub tokenu

GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate. Token potrebuje iba povolenie **`Public Repositories (read-only)`**. Vložte ho raz cez `npm run worker:secret`; odvtedy žije v Cloudflare a nikdy nie je commitnutý do gitu

---

## Premenné prostredia

| Kde | Premenná | Účel |
|---|---|---|
| `.env` (prehliadač, iba lokálny vývoj) | `VITE_PROXY_URL` | Prepíše URL Worker-a pri vývoji s lokálnym Worker-om. Ak nie je nastavené, frontend používa produkčný Worker |
| Worker secret (Cloudflare) | `GITHUB_TOKEN` | Fine-grained PAT, ktorý Worker pripája k GitHub požiadavkám. Nastavuje sa cez `npm run worker:secret` |

**Neexistuje** `VITE_GITHUB_TOKEN` - to by viedlo k úniku tokenu do prehliadačového bundle. Token patrí do Worker-a

---

## Štruktúra projektu

```
github-visualizer/
├── index.html                 - jediná HTML škrupina, bez frameworku
├── src/                       - frontend
│   ├── api.ts                 - všetky požiadavky cez Worker proxy
│   ├── streak.ts              - D3 tepelná mapa príspevkov + počítadlo série
│   ├── commitHeatmap.ts       - D3 tepelná mapa hodín kódovania (7×24 mriežka)
│   ├── languages.ts           - D3 animovaný pruhový graf jazykov
│   ├── repos.ts               - renderovanie kariet top repozitárov
│   ├── activityChart.ts       - D3 plošný graf týždennej aktivity
│   ├── embed.ts               - kompaktná karta na vloženie: načítanie + render pre iframe widget
│   ├── profileReadme.ts       - načítanie a renderovanie README.md profilu
│   ├── compare.ts             - porovnanie profilov vedľa seba
│   ├── healthScore.ts         - renderovanie správy o zdraví repozitárov
│   └── main.ts                - vstupný bod, smerovanie kariet, URL stav
├── worker/
│   └── index.ts               - Cloudflare Worker: token, povolené cesty, KV cache
├── styles/
│   └── main.css               - GitHub-dark dizajnový systém, CSS premenné
├── wrangler.toml              - konfigurácia Worker-a (názov, KV binding)
├── tsconfig.json              - TS konfigurácia frontendu (kompiluje src/)
├── tsconfig.worker.json       - TS konfigurácia Worker-a (typová kontrola worker/)
├── vite.config.ts
└── .env.example               - prepísanie pre lokálny vývoj (bez tajomstiev)
```

---

## Ako prebieha načítanie profilu

```
User enters username
        │
        ▼
  Promise.all([
    fetchUser()           → Worker → KV hit? return.  miss → GitHub /users/{u}
    fetchRepos()          → Worker → KV hit? return.  miss → GitHub /users/{u}/repos
  ])
        │
        ▼ (paralelne, po získaní repozitárov)
  Promise.all([
    fetchAllLanguages()   → Worker → KV per-repo /repos/{u}/{r}/languages  ×≤20
    fetchContributions()  → github-contributions-api.jogruber.de/v4/{u}
    fetchUserEvents()     → Worker → KV /users/{u}/events (2 strany, do 200 udalostí)
  ])
        │
        ▼
  renderStreakGraph()     → D3 SVG tepelná mapa
  renderCommitHeatmap()  → D3 7×24 mriežka hodín kódovania
  renderLanguageChart()   → D3 animované pruhy
  renderTopRepos()        → HTML karty
  renderHealthReport()    → pruhy zdravia repozitárov (popis, licencia, aktivita, témy)
  animateCount()          → počítadlá štatistík (requestAnimationFrame)
  updateRateLimitBadge() → fetch /rate_limit → aktualizácia odznaku v hlavičke
```

Agregácia jazykov sumarizuje bajty kódu naprieč až 20 najnovšie aktualizovanými repozitármi, potom konvertuje na percentá. Forky sú vylúčené - započítavajú sa len originálne práce.

**TTL cache** (konfiguruje sa v `worker/index.ts`):

| Cesta | TTL | Prečo |
|---|---|---|
| `/rate_limit` | 1 min | Živá kvóta - musí byť čerstvá |
| `/users/:u` | 10 min | Údaje profilu (sledovatelia, bio) sa menia občas |
| `/users/:u/repos` | 10 min | Zoznam repozitárov sa mení pri publikovaní nových |
| `/users/:u/events` | 15 min | Nedávne push udalosti pre tepelnú mapu hodín kódovania |
| `/repos/:u/:r/languages` | 60 min | Bajty jazykov sa takmer nemenia z hodiny na hodinu |

Pridajte `?fresh=1` k akejkoľvek požiadavke na Worker na obídenie cache pre jedno volanie.

---

## Plány rozvoja

### ✅ Hotovo

- [x] **Widget na vloženie** - kompaktná karta profilu cez `?embed=1&user=…&theme=dark/light`; tlačidlo `</>` kopíruje iframe snippet; karta zobrazuje avatar, meno, polohu a kľúčové štatistiky
- [x] **README profilu** - vykreslí `{username}/{username}/README.md` s plnou podporou Markdown; karta skrytá, keď README neexistuje
- [x] **Profily organizácií** - automaticky zistené cez pole `type`; samostatne načíta popis organizácie; grafy príspevkov zobrazujú placeholder
- [x] **Trend aktivity** - plošný graf týždenných príspevkov za posledných 12 mesiacov; hover zobrazuje presný počet za týždeň
- [x] **Export ako obrázok** - tlačidlo na stiahnutie sa zobrazí po načítaní profilu; exportuje celý dashboard ako PNG s názvom `{username}-github-stats.png`
- [x] **Svetlý režim** - prepínač slnko/mesiac v hlavičke; D3 grafy sa prekreslia s farbami zodpovedajúcimi téme; preferencia uložená v localStorage
- [x] **Skóre zdravia repozitárov** - pruhy podľa kritérií (popis, licencia, nedávna aktivita, témy) pre všetky vlastné repozitáre s celkovým percentuálnym skóre
- [x] **Indikátor limitu požiadaviek** - odznak v hlavičke zobrazujúci zvyšné/celkové API požiadavky s farebnou bodkou; aktualizuje sa po každom načítaní profilu. Tooltip zobrazuje čas do obnovenia kvóty
- [x] **Tepelná mapa času commitov** - mriežka 7×24 zobrazujúca, kedy používateľ zvyčajne kóduje, podľa hodiny dňa a dňa v týždni. "Najaktívnejší v stredu večer"
- [x] **Porovnanie profilov** - `?tab=compare&a=…&b=…`, štatistiky vedľa seba s indikátorom víťaza, prekrývanie jazykov, spojené tepelné mapy
- [x] **Cloudflare Worker proxy** - token sa nikdy nedostane do prehliadača
- [x] **Workers KV cache** - TTL 10–60 min na cestu, `?fresh=1` na obídenie

### 💡 Zvažované nápady

- [ ] **Generátor GitHub Profile README** - analýza profilu cez API, generovanie personalizovaného `README.md` pomocou GPT, kopírovanie jedným kliknutím

---

## Známe obmedzenia

- **Tepelná mapa príspevkov** používa proxy tretej strany (`github-contributions-api.jogruber.de`), pretože GitHub poskytuje údaje o príspevkoch iba cez GraphQL API s autentifikáciou. Tento proxy môže byť občas nedostupný
- **Štatistiky jazykov** odrážajú bajty kódu, nie počet súborov alebo strávený čas - rovnaká metodológia ako GitHub Linguist
- **Súkromné repozitáre** nie sú viditeľné - Worker používa token s prístupom iba k verejným repozitárom
- **Prvá požiadavka na studený profil** stále stojí ~20 GitHub volaní (jedno na repozitár pre jazyky). Následné načítania do hodiny prichádzajú z KV

---

## Ako prispieť

Problémy a pull requesty sú vítané. Ak nájdete chybu alebo máte nápad na funkciu, najprv otvorte issue, aby sme to mohli prediskutovať

---

## Licencia

MIT © [Dmytro Filiurskyi](https://github.com/jarryuser)
