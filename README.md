# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Gugumgumilar127/gta6-trophy-guide-01-v3/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Gugumgumilar127/gta6-trophy-guide-01-v3/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Leonida Legend** — a free, offline GTA VI trophy guide and platinum tracker. All 55 official PlayStation trophies (1 platinum, 2 gold, 6 silver, 46 bronze, 28 hidden) with their official names, descriptions and grades; a checklist that saves in your browser with export and import; filters by kind (story, missable watch, collectibles, activities, side chains, crime, world, money, mystery, completion — and online, of which there are none); a spoiler setting that hides story trophies until you earn them; per-trophy counters for the grind trophies; a six-stage roadmap to the platinum (one playthrough, difficulty 4/10, about 200 hours); a missable watch that flags the launch week's one real risk — Lucia's Chapter 1 balcony meditation — and an own-words guide for every trophy with numbered steps that cite their sources by number. Where sources disagree (the hidden count, whether anything is missable, the platinum's length), the guide shows both sides instead of hiding them, and the two trophies nobody had solved in launch week are labelled not yet confirmed rather than dressed up with invented methods. No account, no network, no Rockstar artwork — open `app/index.html` and hunt.

## Run it

```sh
node serve.ts
# then open http://localhost:8080 — or just open app/index.html in a browser
```

To hand the guide in the way the grader does:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` first validates `app/data/trophies.json` (55 trophies, official names, no empty guide, every guide citing a source, the roadmap covering all 55) and stops with a clear message if anything is off; then it copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

## What's inside

- `app/index.html`, `app/style.css` — the page and its styling.
- `app/app.js` — boot, tracker state (localStorage), export/import, demo staging (`?demo=1`).
- `app/render.js` — the audit strip, filter chips, checklist and detail panel.
- `app/views.js` — the roadmap, missable watch, and sources & audit views.
- `app/data/trophies.json` — the official list plus every guide, the roadmap and the numbered sources (PowerPyx, the official PlayStation list via Exophase and PSNProfiles, PlanetGTA6, CryptoGames, OutputLag, U7Buy, SixShore — all read 20 November 2026).
- `screenshots/` — the guide in use: checklist with the missable watch open, the roadmap, the missable watch tab, and spoiler protection on.

Unofficial fan work: not affiliated with Rockstar Games, and it uses none of its artwork or logos. Trophy names and descriptions are shown as PlayStation publishes them; every guide below them is original text written for this repository.

---

Entered on [make.fun](https://make.fun/?ref=a4ees860&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards
