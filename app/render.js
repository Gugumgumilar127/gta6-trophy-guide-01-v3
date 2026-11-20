// Leonida Legend — checklist rendering: the audit strip, filter chips, the trophy list and the
// detail panel. Everything here reads the shared ctx from app.js; nothing is fetched or stored here.

export const KIND_LABELS = {
  story: 'Story',
  side: 'Side chains',
  collectibles: 'Collectibles',
  activities: 'Activities',
  crime: 'Crime',
  world: 'World',
  money: 'Money',
  mystery: 'Mystery',
  completion: 'Completion',
};

// The two trophies whose trigger no launch-week guide could confirm (see the Sources & audit tab).
export const UNKNOWN_IDS = new Set([49, 51]);

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

export function gradeTag(t) {
  return `<span class="tag grade-${t.grade}">${t.grade.toUpperCase()}</span>`;
}

export function kindTag(t) {
  return `<span class="tag">${KIND_LABELS[t.kind] ?? t.kind}</span>`;
}

export function flagTags(t) {
  let out = '';
  if (t.hidden) out += '<span class="tag hiddenTag">HIDDEN</span>';
  if (t.missable === 'watch') out += '<span class="tag watch">MISSABLE WATCH</span>';
  if (UNKNOWN_IDS.has(t.id)) out += '<span class="tag unknown">NOT YET CONFIRMED</span>';
  return out;
}

export function renderAudit(ctx) {
  const ts = ctx.data.trophies;
  const steps = ts.reduce((n, t) => n + t.steps.length, 0);
  const hidden = ts.filter((t) => t.hidden).length;
  const cited = ts.filter((t) => t.sources.length > 0).length;
  document.getElementById('auditStrip').innerHTML =
    `<b>55 official</b> · 1P 2G 6S 46B · ${hidden} hidden · ` +
    `<b>${cited}/55 guides cite a source</b> · ${steps} steps, each under a cited guide · ` +
    `${ctx.data.sources.length} sources read ${esc(ctx.data.sources[0].read)} · ` +
    `<span class="warn">1 possibly missable (unconfirmed)</span> · 2 methods not yet confirmed · ` +
    `sources disagree on the hidden count (28 vs 27) — both shown`;
}

const CHIP_KINDS = [
  ['all', 'All'], ['story', 'Story'], ['missable', 'Missable watch'],
  ['collectibles', 'Collectibles'], ['activities', 'Activities'], ['side', 'Side chains'],
  ['crime', 'Crime'], ['world', 'World'], ['money', 'Money'], ['mystery', 'Mystery'],
  ['completion', 'Completion'], ['online', 'Online'],
];

export function renderChips(ctx, onKind, onUnearned) {
  const ts = ctx.data.trophies;
  const countFor = (kind) => {
    if (kind === 'all') return ts.length;
    if (kind === 'missable') return ts.filter((t) => t.missable === 'watch').length;
    if (kind === 'online') return 0;
    return ts.filter((t) => t.kind === kind).length;
  };
  const wrap = document.getElementById('chips');
  wrap.replaceChildren();
  for (const [kind, label] of CHIP_KINDS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `chip${ctx.filter.kind === kind ? ' active' : ''}`;
    b.innerHTML = `${label} <span class="n">${countFor(kind)}</span>`;
    b.addEventListener('click', () => onKind(kind));
    wrap.append(b);
  }
  const u = document.createElement('button');
  u.type = 'button';
  u.className = `chip${ctx.filter.unearnedOnly ? ' active' : ''}`;
  u.textContent = 'Unearned only';
  u.addEventListener('click', onUnearned);
  wrap.append(u);
}

export function visibleTrophies(ctx) {
  const q = ctx.query.trim().toLowerCase();
  return ctx.data.trophies.filter((t) => {
    if (ctx.filter.kind === 'missable' && t.missable !== 'watch') return false;
    if (ctx.filter.kind === 'online') return false;
    if (ctx.filter.kind !== 'all' && ctx.filter.kind !== 'missable' && t.kind !== ctx.filter.kind) return false;
    if (ctx.filter.unearnedOnly && ctx.isEarned(t.id)) return false;
    if (q) {
      const hay = ctx.isSpoiled(t) ? 'hidden story trophy' : `${t.name} ${t.description}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function renderList(ctx) {
  const list = document.getElementById('trophyList');
  list.replaceChildren();
  const rows = visibleTrophies(ctx);

  const order = ctx.data.roadmap.flatMap((s) => s.trophies);
  const next = order.map((id) => ctx.byId.get(id)).find((t) => t && !ctx.isEarned(t.id));
  document.getElementById('nextUp').innerHTML = next
    ? `NEXT UP · <b>${esc(next.stage)}</b> · ${ctx.isSpoiled(next) ? 'Hidden story trophy' : esc(next.name)}`
    : 'All 55 earned — Vice Got a Price!';

  if (ctx.filter.kind === 'online') {
    const li = document.createElement('li');
    li.innerHTML = '<div><p class="tname">No online trophies</p>' +
      '<p class="tdesc">The official list is entirely offline and single-player: 0 online trophies. ' +
      'The filter stays in the app because the list was checked for them.</p></div>';
    list.append(li);
    return;
  }
  if (rows.length === 0) {
    const li = document.createElement('li');
    li.innerHTML = '<div><p class="tname">Nothing matches</p><p class="tdesc">Try a different filter or search.</p></div>';
    list.append(li);
    return;
  }

  for (const t of rows) {
    const li = document.createElement('li');
    const spoiled = ctx.isSpoiled(t);
    if (ctx.isEarned(t.id)) li.className = 'earned';
    if (t.id === ctx.selectedId) li.classList.add('selected');
    if (spoiled) li.classList.add('spoiled');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = ctx.isEarned(t.id);
    box.setAttribute('aria-label', `Mark ${t.name} earned`);
    box.addEventListener('click', (e) => e.stopPropagation());
    box.addEventListener('change', () => ctx.toggleEarned(t.id));
    const body = document.createElement('div');
    body.innerHTML = spoiled
      ? `<p class="tname">Hidden story trophy</p><p class="tdesc">Name and description hidden until earned.</p>` +
        `<div class="tags">${gradeTag(t)}${kindTag(t)}<span class="tag">${t.stage}</span></div>`
      : `<p class="tname">${esc(t.name)}</p><p class="tdesc">${esc(t.description)}</p>` +
        `<div class="tags">${gradeTag(t)}${kindTag(t)}<span class="tag">${t.stage}</span>${flagTags(t)}</div>`;
    li.append(box, body);
    li.addEventListener('click', () => ctx.select(t.id));
    list.append(li);
  }
}

function sourcesLine(ctx, t) {
  const parts = t.sources.map((n) => {
    const s = ctx.sourceByN.get(n);
    if (!s) return '';
    return `<sup>[${n}]</sup> <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>`;
  });
  return `<p class="sourcesline">Sources for this trophy: ${parts.join(' · ')}</p>`;
}

export function renderDetail(ctx) {
  const t = ctx.byId.get(ctx.selectedId);
  const el = document.getElementById('detail');
  if (!t) { el.innerHTML = ''; return; }
  const earned = ctx.isEarned(t.id);

  if (ctx.isSpoiled(t)) {
    el.innerHTML =
      `<div class="tags">${gradeTag(t)}${kindTag(t)}<span class="tag">${t.stage}</span></div>` +
      '<h2>Hidden story trophy</h2>' +
      '<p class="inshort">Spoiler protection is on: this story trophy\'s name, description and guide stay ' +
      'hidden until you earn it — the way PlayStation itself hides it.</p>' +
      `<div class="earnrow"><button type="button" id="dReveal">Reveal anyway</button>` +
      `<button type="button" id="dEarn">Mark earned</button>` +
      '<span class="state">Earning it lifts the spoiler at once.</span></div>';
    el.querySelector('#dReveal').addEventListener('click', () => ctx.reveal(t.id));
    el.querySelector('#dEarn').addEventListener('click', () => ctx.toggleEarned(t.id));
    return;
  }

  let html =
    `<div class="tags">${gradeTag(t)}${kindTag(t)}<span class="tag">STAGE ${t.stage}</span>${flagTags(t)}</div>` +
    `<h2>${esc(t.name)}</h2>` +
    `<p class="meta">Trophy ${t.id} of 55${t.hidden ? ' · hidden on PlayStation until earned' : ''}</p>` +
    `<blockquote class="official"><span class="lbl">OFFICIAL DESCRIPTION — PLAYSTATION</span>${esc(t.description)}</blockquote>`;

  if (t.missable === 'watch') {
    html += '<div class="warnbox"><b>Missable watch — the launch week\'s one real risk.</b> ' +
      'Lucia\'s Chapter 1 balcony meditation at Jason\'s house disappears when the chapter ends, and no source ' +
      'has confirmed whether this trophy needs it. Do it, and keep a Chapter 1 save. Full detail in the Missable watch tab.</div>';
  }
  if (UNKNOWN_IDS.has(t.id)) {
    html += '<div class="unknownbox"><b>Method not yet confirmed.</b> No guide we read had verified this ' +
      'trigger in launch week. What follows is the best-reported lead, labelled as unverified — not a promise.</div>';
  }

  html += `<p class="inshort">${esc(t.guide)}</p>`;
  html += `<ol class="steps">${t.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>`;

  if (t.count) {
    const value = ctx.state.counts[t.id] ?? 0;
    const pct = Math.min(100, (value / t.count.total) * 100);
    html += `<div class="counterbox"><span>Your count</span>` +
      `<button type="button" id="cMinus" aria-label="Decrease">−</button>` +
      `<span class="cnum">${value.toLocaleString('en-US')} / ${t.count.total.toLocaleString('en-US')}</span>` +
      `<button type="button" id="cPlus" aria-label="Increase">+</button>` +
      `<span>${esc(t.count.label)}</span><div class="bar"><div class="barfill" style="width:${pct}%"></div></div></div>`;
  }

  html += `<div class="earnrow"><button type="button" id="dEarn">${earned ? 'Mark not earned' : 'Mark earned'}</button>` +
    `<span class="state">${earned ? 'Earned — nice one.' : 'Not yet earned.'}</span></div>`;
  html += sourcesLine(ctx, t);
  el.innerHTML = html;

  el.querySelector('#dEarn').addEventListener('click', () => ctx.toggleEarned(t.id));
  if (t.count) {
    const step = t.count.total >= 10000 ? 5000 : 1;
    el.querySelector('#cMinus').addEventListener('click', () => ctx.setCount(t.id, (ctx.state.counts[t.id] ?? 0) - step));
    el.querySelector('#cPlus').addEventListener('click', () => ctx.setCount(t.id, (ctx.state.counts[t.id] ?? 0) + step));
  }
}
