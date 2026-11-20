// A working gta6-trophy-guide-01 entry (Node 22, standard library only): the guide is this directory's app/ folder,
// plain static files a browser opens at app/index.html (ES modules, CSS, no build step), offline: it loads nothing
// over the network, and its trophy list and guides are app/data/trophies.json. The program hands it in: it copies app/
// and screenshots/ from beside this file to /output and writes /output/dossier.json, the summary the judge reads (your
// screenshots, the first load's files and bytes, and your source), with the vendored make.fun library. Leave
// vendor/makefun-frontend.ts as it is: the scorer requires dossier.json to be byte for byte what its own copy writes.
//
// Leonida Legend: a full guide, not a hint list. All 55 trophies carry an own-words guide with numbered steps and
// named sources, a six-stage roadmap to the platinum, a missable watch, per-trophy counters for the grind trophies,
// a spoiler setting that hides story trophies until they are earned, and progress that persists in the browser with
// export and import. Before handing anything in, this program validates the data file (55 trophies, official names,
// no empty guide, every guide citing a source, the roadmap covering every trophy) and prints a one-screen summary.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Validate the guide's data before it is handed in. A trophy guide whose data is wrong is worse than no guide, so
// any problem here stops the run with a clear message instead of producing a broken dossier.
const data = JSON.parse(readFileSync(join(here, 'app', 'data', 'trophies.json'), 'utf8'));
const trophies = data.trophies ?? [];
const problems = [];
if (trophies.length !== 55) problems.push(`expected 55 trophies, found ${trophies.length}`);
const seenNames = new Set();
for (const t of trophies) {
  if (!t.name || seenNames.has(t.name)) problems.push(`trophy ${t.id}: missing or duplicate name`);
  seenNames.add(t.name);
  if (!t.description) problems.push(`trophy ${t.id} (${t.name}): missing official description`);
  if (!t.guide || !t.guide.trim()) problems.push(`trophy ${t.id} (${t.name}): empty guide`);
  if (!Array.isArray(t.steps) || t.steps.length === 0) problems.push(`trophy ${t.id} (${t.name}): no steps`);
  if (!Array.isArray(t.sources) || t.sources.length === 0) problems.push(`trophy ${t.id} (${t.name}): cites no source`);
}
const roadmapIds = new Set((data.roadmap ?? []).flatMap((s) => s.trophies));
for (const t of trophies) if (!roadmapIds.has(t.id)) problems.push(`trophy ${t.id} (${t.name}): missing from the roadmap`);
if (problems.length > 0) {
  console.error('trophy data failed validation:');
  for (const p of problems) console.error(` - ${p}`);
  process.exit(1);
}
const byGrade = {};
for (const t of trophies) byGrade[t.grade] = (byGrade[t.grade] ?? 0) + 1;
const totalSteps = trophies.reduce((n, t) => n + t.steps.length, 0);
console.log(`Leonida Legend data OK: 55 trophies (${byGrade.platinum ?? 0} platinum, ${byGrade.gold ?? 0} gold, ${byGrade.silver ?? 0} silver, ${byGrade.bronze ?? 0} bronze), ${trophies.filter((t) => t.hidden).length} hidden, ${totalSteps} cited steps, ${data.sources.length} sources, roadmap covers all 55.`);

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
console.log('Handed in: app/, screenshots/ and dossier.json written to', out);
