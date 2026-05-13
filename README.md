<div align="center">

<img src="https://raw.githubusercontent.com/jarryuser/github-visualizer/main/preview.png" alt="GitHub Activity Visualizer preview" width="100%" />

# GitHub Activity Visualizer

**A clean dashboard for any GitHub profile — contribution heatmap, language breakdown, top repositories, and live stats.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-→-2f81f7?style=flat-square)](https://jarryuser.github.io/github-visualizer/?user=jarryuser)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![D3.js](https://img.shields.io/badge/D3.js-7.9-F9A03C?style=flat-square&logo=d3.js&logoColor=white)](https://d3js.org/)
[![Vite](https://img.shields.io/badge/Vite-5.1-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![GitHub Pages](https://img.shields.io/badge/Deployed%20on-GitHub%20Pages-222?style=flat-square&logo=github)](https://pages.github.com/)

</div>

---

## Overview

GitHub Activity Visualizer is a purely front-end dashboard that uses the **GitHub REST API** and **D3.js** to visualise any public profile — no backend, no database, no login required.

Enter a username → get a full breakdown of their activity in seconds.

**Try it:** [`?user=jarryuser`](https://jarryuser.github.io/github-visualizer/?user=jarryuser) · [`?user=torvalds`](https://jarryuser.github.io/github-visualizer/?user=torvalds)

---

## Features

| | Feature | Details |
|---|---|---|
| 📊 | **Contribution heatmap** | 12-month activity grid with per-day tooltips, current streak counter |
| 🌐 | **Language breakdown** | Aggregated across all repos, animated bar chart, colour-coded by language |
| ⭐ | **Top repositories** | Sorted by stars, with description, language, forks, and last-updated time |
| 📈 | **Profile stats** | Total public repos, total stars earned, followers, current streak |
| 🔗 | **Shareable links** | Direct URL to any profile: `?user=username` |
| ⚡ | **Parallel fetching** | All API calls run concurrently with `Promise.all` — loads in ~1s |
| 🌙 | **Dark theme** | GitHub-style dark UI, no light mode toggle needed |

---

## Tech stack

| Layer | Tool | Why |
|---|---|---|
| Language | TypeScript 5.3 | Type safety across all API responses |
| Charts | D3.js v7 | Fine-grained control over SVG rendering |
| Bundler | Vite 5 | Instant HMR, zero-config TS support |
| Data | GitHub REST API v3 | Public, no auth required for basic usage |
| Contributions | github-contributions-api | REST workaround for GitHub's GraphQL-only heatmap |
| Deploy | GitHub Pages + gh-pages | One command deploy, free hosting |

---

## Getting started

```bash
git clone https://github.com/jarryuser/github-visualizer.git
cd github-visualizer

npm install
npm run dev        # → http://localhost:5173
```

Open the app, type any GitHub username, press **View profile**.

### Optional: GitHub token

Without a token the API allows **60 requests/hour**. With a token — **5 000 requests/hour**.

```bash
cp .env.example .env
# paste your token into VITE_GITHUB_TOKEN=
```

Create a token: **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained** — only `Public Repositories (read-only)` permission needed.

### Deploy to GitHub Pages

```bash
npm run deploy
```

Updates `https://jarryuser.github.io/github-visualizer/` in ~30 seconds.

---

## Project structure

```
github-visualizer/
├── index.html                 — single HTML shell, no framework
├── src/
│   ├── api.ts                 — all GitHub API calls (fetchUser, fetchRepos,
│   │                            fetchAllLanguages, fetchContributions)
│   ├── streak.ts              — D3 contribution heatmap + streak counter
│   ├── languages.ts           — D3 animated language bar chart
│   ├── repos.ts               — top repository cards renderer
│   └── main.ts                — entry point, orchestrates the dashboard
├── styles/
│   └── main.css               — GitHub-dark design system, CSS variables
├── vite.config.ts
├── tsconfig.json
└── .env.example               — token setup instructions
```

---

## How it works

```
User enters username
        │
        ▼
  Promise.all([
    fetchUser()           → GET /users/{username}
    fetchRepos()          → GET /users/{username}/repos?per_page=100
  ])
        │
        ▼ (parallel, after repos arrive)
  Promise.all([
    fetchAllLanguages()   → GET /repos/{u}/{repo}/languages  ×20 repos
    fetchContributions()  → github-contributions-api.jogruber.de/v4/{username}
  ])
        │
        ▼
  renderStreakGraph()     → D3 SVG heatmap
  renderLanguageChart()   → D3 animated bars
  renderTopRepos()        → HTML cards
  animateCount()          → stat counters (requestAnimationFrame)
```

The language aggregation sums bytes of code across up to 20 most recently updated repos, then converts to percentages. Forks are excluded — only original work is counted.

---

## Roadmap

Things I'm planning to add to make this genuinely useful beyond what GitHub already shows.

### 🔜 In progress

- [ ] **Profile comparison** — enter two usernames, get a side-by-side breakdown: activity, languages, stars, streak. GitHub has no equivalent.
- [ ] **Commit time heatmap** — show when a user typically codes: by hour of day and day of week. "Most active on Wednesday evenings."

### 📋 Planned

- [ ] **Growth charts** — stars, followers, and repo count over time using the GitHub Events API
- [ ] **Repository health score** — flags repos missing README, license, or recent activity. Useful before sharing your portfolio.
- [ ] **GitHub Profile README generator** — analyse the profile via API, generate a personalised `README.md` with GPT, copy with one click
- [ ] **Light mode** — toggle between dark (current) and light themes
- [ ] **Export as image** — download the dashboard as a PNG for sharing

### 💡 Ideas under consideration

- [ ] Organisation profiles (not just users)
- [ ] Embed mode — `<iframe>` widget for personal websites
- [ ] Rate limit indicator — show remaining API quota in the UI

---

## Known limitations

- **Contribution heatmap** uses a third-party proxy (`github-contributions-api.jogruber.de`) because GitHub only exposes contribution data via GraphQL API with authentication. This proxy occasionally has downtime.
- **Language stats** reflect bytes of code, not number of files or time spent — same methodology as GitHub Linguist.
- **Private repositories** are not visible — GitHub REST API only returns public data without a scoped token.
- **Rate limit** — 60 requests/hour without a token. Each profile load uses ~20 requests (repos + per-repo language calls).

---

## Contributing

Issues and pull requests are welcome. If you spot a bug or have a feature idea, open an issue first so we can discuss it.

---

## License

MIT © [Dmytro Filiurskyi](https://github.com/jarryuser)
