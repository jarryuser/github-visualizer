<div align="center">

<img src="https://raw.githubusercontent.com/jarryuser/github-visualizer/main/preview.png" alt="GitHub Activity Visualizer preview" width="100%" />

# GitHub Activity Visualizer

**A clean dashboard for any GitHub profile — contribution heatmap, language breakdown, top repositories, side-by-side profile comparison, and live stats.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-→-2f81f7?style=flat-square)](https://jarryuser.github.io/github-visualizer/?user=jarryuser)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![D3.js](https://img.shields.io/badge/D3.js-7.9-F9A03C?style=flat-square&logo=d3.js&logoColor=white)](https://d3js.org/)
[![Vite](https://img.shields.io/badge/Vite-5.1-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Cloudflare Workers](https://img.shields.io/badge/Proxy-Cloudflare%20Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![GitHub Pages](https://img.shields.io/badge/Deployed%20on-GitHub%20Pages-222?style=flat-square&logo=github)](https://pages.github.com/)

</div>

---

## Overview

GitHub Activity Visualizer is a front-end dashboard that uses the **GitHub REST API** and **D3.js** to visualise any public profile.

Enter a username → get a full breakdown of their activity in seconds. Switch to the **Compare** tab to put two profiles side by side.

All GitHub API calls go through a small **Cloudflare Worker** that holds the API token as a server-side secret and caches responses in Workers KV. Effective rate limit: 5 000 req/h from GitHub, but in practice almost every request is served from cache.

**Try it:** [`?user=jarryuser`](https://jarryuser.github.io/github-visualizer/?user=jarryuser) · [`?user=torvalds`](https://jarryuser.github.io/github-visualizer/?user=torvalds) · [`?tab=compare&a=torvalds&b=gaearon`](https://jarryuser.github.io/github-visualizer/?tab=compare&a=torvalds&b=gaearon)

---

## Features

| | Feature | Details |
|---|---|---|
| 📊 | **Contribution heatmap** | 12-month activity grid with per-day tooltips, current streak counter |
| 🌐 | **Language breakdown** | Aggregated across all repos, animated bar chart, colour-coded by language |
| ⭐ | **Top repositories** | Sorted by stars, with description, language, forks, and last-updated time |
| 📈 | **Profile stats** | Total public repos, total stars earned, followers, current streak |
| ⚔️ | **Profile comparison** | Side-by-side view of two profiles: stats with winner indicator, language overlap, stacked heatmaps |
| 🔗 | **Shareable links** | Direct URL to any profile: `?user=username` or `?tab=compare&a=…&b=…` |
| ⚡ | **Parallel fetching** | All API calls run concurrently with `Promise.all` — loads in ~1s |
| 🛡️ | **Token-safe proxy** | Cloudflare Worker holds the GitHub token; the browser bundle never sees it |
| 💾 | **Edge cache** | Workers KV stores responses for 10–60 minutes; repeated lookups skip GitHub entirely |
| 🌙 | **Dark theme** | GitHub-style dark UI |

---

## Tech stack

| Layer | Tool | Why |
|---|---|---|
| Language | TypeScript 5.3 | Type safety across all API responses |
| Charts | D3.js v7 | Fine-grained control over SVG rendering |
| Bundler | Vite 5 | Instant HMR, zero-config TS support |
| Proxy / cache | Cloudflare Workers + Workers KV | Holds the GitHub token; caches responses globally |
| Data | GitHub REST API v3 | Public profile, repo, and language endpoints |
| Contributions | github-contributions-api | REST workaround for GitHub's GraphQL-only heatmap |
| Front-end host | GitHub Pages + gh-pages | One command deploy, free hosting |

---

## Architecture

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

The browser never holds a GitHub token. It only knows the Worker URL.
The Worker has an allowlist of three GitHub routes; anything else returns 404.

---

## Getting started

```bash
git clone https://github.com/jarryuser/github-visualizer.git
cd github-visualizer
npm install

# Front-end:
npm run dev        # → http://localhost:5173 (uses the deployed Worker by default)

# Worker (optional — only if you want to edit the proxy):
cp .env.example .env                # sets VITE_PROXY_URL=http://localhost:8787
npm run worker:dev                  # → http://localhost:8787
```

Open the app, type any GitHub username, press **View profile**. Or open the **Compare** tab to put two profiles side by side.

---

## Deploying

### Front-end → GitHub Pages

```bash
npm run deploy
```

Updates `https://jarryuser.github.io/github-visualizer/` in ~30 seconds.

### Worker → Cloudflare (first-time setup)

```bash
# 1. Log in once
npx wrangler login

# 2. Create the KV namespace used for caching
npx wrangler kv:namespace create CACHE
# → copy the returned id into wrangler.toml in place of REPLACE_WITH_KV_NAMESPACE_ID

# 3. Store the GitHub token as a Worker secret (NOT in .env)
npm run worker:secret               # then paste your fine-grained PAT

# 4. Ship it
npm run worker:deploy
```

The Worker is published at `https://github-visualizer-proxy.<your-subdomain>.workers.dev`.
Update the `PROXY_BASE` fallback in `src/api.ts` if you use a different name.

### Updating an existing deployment

```bash
npm run worker:deploy   # ships worker/index.ts changes
npm run deploy          # ships front-end changes
```

### Creating the GitHub token

GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate. The token only needs **`Public Repositories (read-only)`** permission. Paste it once via `npm run worker:secret`; it lives in Cloudflare from then on and is never checked into git.

---

## Environment variables

| Where | Variable | Purpose |
|---|---|---|
| `.env` (browser, local dev only) | `VITE_PROXY_URL` | Override the Worker URL when developing against a local Worker. If unset, the front-end uses the production Worker. |
| Worker secret (Cloudflare) | `GITHUB_TOKEN` | The fine-grained PAT the Worker attaches to GitHub requests. Set via `npm run worker:secret`. |

There is **no** `VITE_GITHUB_TOKEN` — that would leak the token into the browser bundle. The token belongs in the Worker.

---

## Project structure

```
github-visualizer/
├── index.html                 — single HTML shell, no framework
├── src/                       — front-end
│   ├── api.ts                 — all calls go through the Worker proxy
│   ├── streak.ts              — D3 contribution heatmap + streak counter
│   ├── languages.ts           — D3 animated language bar chart
│   ├── repos.ts               — top repository cards renderer
│   ├── compare.ts             — side-by-side profile comparison view
│   └── main.ts                — entry point, tab routing, URL state
├── worker/
│   └── index.ts               — Cloudflare Worker: token, allowlist, KV cache
├── styles/
│   └── main.css               — GitHub-dark design system, CSS variables
├── wrangler.toml              — Worker config (name, KV binding)
├── tsconfig.json              — front-end TS config (compiles src/)
├── tsconfig.worker.json       — Worker TS config (type-checks worker/)
├── vite.config.ts
└── .env.example               — local dev overrides (no secrets)
```

---

## How a profile load works

```
User enters username
        │
        ▼
  Promise.all([
    fetchUser()           → Worker → KV hit? return.  miss → GitHub /users/{u}
    fetchRepos()          → Worker → KV hit? return.  miss → GitHub /users/{u}/repos
  ])
        │
        ▼ (parallel, after repos arrive)
  Promise.all([
    fetchAllLanguages()   → Worker → KV per-repo /repos/{u}/{r}/languages  ×≤20
    fetchContributions()  → github-contributions-api.jogruber.de/v4/{u}
  ])
        │
        ▼
  renderStreakGraph()     → D3 SVG heatmap
  renderLanguageChart()   → D3 animated bars
  renderTopRepos()        → HTML cards
  animateCount()          → stat counters (requestAnimationFrame)
```

The language aggregation sums bytes of code across up to 20 most recently updated repos, then converts to percentages. Forks are excluded — only original work is counted.

**Cache TTLs** (configured in `worker/index.ts`):

| Route | TTL | Why |
|---|---|---|
| `/users/:u` | 10 min | Profile data (followers, bio) changes occasionally |
| `/users/:u/repos` | 10 min | Repo list changes when new repos are pushed |
| `/repos/:u/:r/languages` | 60 min | Language bytes barely shift hour-to-hour |

Append `?fresh=1` to any Worker request to bypass the cache for one call.

---

## Roadmap

### 🔜 In progress

- [ ] **Commit time heatmap** — show when a user typically codes: by hour of day and day of week. "Most active on Wednesday evenings."

### 📋 Planned

- [ ] **Growth charts** — stars, followers, and repo count over time using the GitHub Events API
- [ ] **Repository health score** — flags repos missing README, license, or recent activity. Useful before sharing your portfolio.
- [ ] **GitHub Profile README generator** — analyse the profile via API, generate a personalised `README.md` with GPT, copy with one click
- [ ] **Light mode** — toggle between dark (current) and light themes
- [ ] **Export as image** — download the dashboard as a PNG for sharing
- [ ] **Rate-limit indicator** — surface the Worker's remaining GitHub quota in the UI

### ✅ Done

- [x] **Profile comparison** — `?tab=compare&a=…&b=…`, side-by-side stats with winner indicator, language overlap, stacked heatmaps
- [x] **Cloudflare Worker proxy** — token never reaches the browser
- [x] **Workers KV cache** — 10–60 min TTL per route, `?fresh=1` to bypass

### 💡 Ideas under consideration

- [ ] Organisation profiles (not just users)
- [ ] Embed mode — `<iframe>` widget for personal websites

---

## Known limitations

- **Contribution heatmap** uses a third-party proxy (`github-contributions-api.jogruber.de`) because GitHub only exposes contribution data via GraphQL API with authentication. This proxy occasionally has downtime.
- **Language stats** reflect bytes of code, not number of files or time spent — same methodology as GitHub Linguist.
- **Private repositories** are not visible — the Worker uses a public-repo-scoped token.
- **First request to a cold profile** still costs ~20 GitHub calls (one per repo for languages). Subsequent loads within an hour come from KV.

---

## Contributing

Issues and pull requests are welcome. If you spot a bug or have a feature idea, open an issue first so we can discuss it.

---

## License

MIT © [Dmytro Filiurskyi](https://github.com/jarryuser)
