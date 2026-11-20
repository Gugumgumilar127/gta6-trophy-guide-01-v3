// Leonida Legend — entry point: loads the trophy data, owns the tracker state and wires the controls.
// State (earned ticks, per-trophy counters, spoiler setting) lives in localStorage, so the tracker
// survives reloads and works fully offline. Rendering lives in render.js and views.js.

import { renderAudit, renderChips, renderList, renderDetail } from './render.js';
import { renderRoadmap, renderMissables, renderSources } from './views.js';

const STORE_KEY = 'leonida-legend-tracker-v1';
const params = new URLSearchParams(location.search);

const data = await (await fetch('data/trophies.json')).json();
const byId = new Map(data.trophies.map((t) => [t.id, t]));
const sourceByN = new Map(data.sources.map((s) => [s.n, s]));

const state = loadState();
let view = 'checklist';
let filter = { kind: 'all', unearnedOnly: false };
let query = '';
let selectedId = state.selectedId && byId.has(state.selectedId) ? state.selectedId : 28;
const revealed = new Set();

function blankState() {
  return { earned: [], counts: {}, spoilers: false, selectedId: 28 };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.earned)) return { ...blankState(), ...parsed };
    }
  } catch { /* a corrupt save falls through to the demo or a blank state */ }
  if (params.has('demo')) return demoState();
  return blankState();
}

// Screenshot staging: ?demo=1 pre-ticks a believable mid-run state (story into Chapter 3, a few
// activities done, 6 of 18 meditations) so the guide's own pages can be photographed as used.
// It only seeds an empty browser storage; a real saved tracker is never overwritten.
function demoState() {
  if (params.get('demo') === 'spoilers') {
    // The spoiler photograph: only the first story trophy earned, so the unearned ones below it
    // show as hidden, and a hidden one is selected so its panel shows too.
    return {
      earned: [2, 16, 20, 22, 24, 29, 33, 34],
      counts: { 15: 40, 32: 12 },
      spoilers: true,
      selectedId: 5,
    };
  }
  return {
    earned: [2, 3, 4, 8, 16, 20, 22, 24, 29, 33, 34],
    counts: { 15: 40, 28: 6, 32: 12, 35: 64 },
    spoilers: false,
    selectedId: 28,
  };
}

function save() {
  state.selectedId = selectedId;
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
  document.getElementById('savedNote').textContent = 'Saved in this browser · just now';
}

const earnedSet = () => new Set(state.earned);

function isEarned(id) {
  return state.earned.includes(id);
}

function toggleEarned(id) {
  state.earned = isEarned(id) ? state.earned.filter((x) => x !== id) : [...state.earned, id];
  save();
  renderAll();
}

function setCount(id, value) {
  const t = byId.get(id);
  if (!t || !t.count) return;
  state.counts[id] = Math.max(0, Math.min(t.count.total, Math.round(value)));
  save();
  renderAll();
}

function isSpoiled(t) {
  return state.spoilers && t.kind === 'story' && !isEarned(t.id) && !revealed.has(t.id);
}

const ctx = {
  data, byId, sourceByN, state,
  get view() { return view; },
  get filter() { return filter; },
  get query() { return query; },
  get selectedId() { return selectedId; },
  earnedSet, isEarned, isSpoiled,
  select(id) { selectedId = id; save(); renderAll(); },
  toggleEarned, setCount,
  reveal(id) { revealed.add(id); renderAll(); },
  goto(viewName, id) {
    view = viewName;
    if (id) selectedId = id;
    syncTabs();
    renderAll();
  },
};

function renderAll() {
  renderAudit(ctx);
  renderChips(ctx, (kind) => { filter = { ...filter, kind }; renderAll(); },
    () => { filter = { ...filter, unearnedOnly: !filter.unearnedOnly }; renderAll(); });
  renderList(ctx);
  renderDetail(ctx);
  renderRoadmap(ctx);
  renderMissables(ctx);
  renderSources(ctx);
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of data.trophies) if (isEarned(t.id)) counts[t.grade] += 1;
  document.getElementById('earnedCount').textContent = state.earned.length;
  document.getElementById('gradeTallies').innerHTML =
    `<b>P</b> ${counts.platinum}/1 · <b>G</b> ${counts.gold}/2 · <b>S</b> ${counts.silver}/6 · <b>B</b> ${counts.bronze}/46`;
  document.getElementById('barFill').style.width = `${(state.earned.length / 55) * 100}%`;
}

function syncTabs() {
  for (const btn of document.querySelectorAll('#tabs button')) {
    btn.classList.toggle('active', btn.dataset.view === view);
  }
  for (const name of ['checklist', 'roadmap', 'missables', 'sources']) {
    document.getElementById(`view-${name}`).hidden = name !== view;
  }
}

for (const btn of document.querySelectorAll('#tabs button')) {
  btn.addEventListener('click', () => { view = btn.dataset.view; syncTabs(); renderAll(); });
}

document.getElementById('search').addEventListener('input', (e) => { query = e.target.value; renderAll(); });
document.getElementById('spoilerToggle').checked = state.spoilers;
document.getElementById('spoilerToggle').addEventListener('change', (e) => {
  state.spoilers = e.target.checked;
  save();
  renderAll();
});

document.getElementById('exportBtn').addEventListener('click', () => {
  const payload = JSON.stringify({ app: 'leonida-legend', version: 1, ...state }, null, 2);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  a.download = 'leonida-legend-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    if (!parsed || !Array.isArray(parsed.earned)) throw new Error('not a tracker file');
    state.earned = parsed.earned.filter((id) => byId.has(id));
    state.counts = typeof parsed.counts === 'object' && parsed.counts ? parsed.counts : {};
    state.spoilers = Boolean(parsed.spoilers);
    document.getElementById('spoilerToggle').checked = state.spoilers;
    save();
    renderAll();
  } catch {
    document.getElementById('savedNote').textContent = 'Import failed: that file is not a tracker export.';
  }
  e.target.value = '';
});

// Deep links for screenshots and sharing: #roadmap, #missables, #sources, or #trophy=<id>.
const hash = location.hash.replace('#', '');
if (['roadmap', 'missables', 'sources'].includes(hash)) view = hash;
const trophyMatch = hash.match(/^trophy=(\d+)$/);
if (trophyMatch && byId.has(Number(trophyMatch[1]))) selectedId = Number(trophyMatch[1]);

syncTabs();
renderAll();
