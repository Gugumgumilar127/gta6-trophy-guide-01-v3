// Leonida Legend — the three reading views: the roadmap, the missable watch, and sources & audit.
// They render from the same data file as the checklist, so the counts can never drift apart.

import { KIND_LABELS, UNKNOWN_IDS, gradeTag, flagTags } from './render.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

export function renderRoadmap(ctx) {
  const wrap = document.getElementById('roadmap');
  wrap.replaceChildren();
  for (const stage of ctx.data.roadmap) {
    const trophies = stage.trophies.map((id) => ctx.byId.get(id)).filter(Boolean);
    const done = trophies.filter((t) => ctx.isEarned(t.id)).length;
    const card = document.createElement('article');
    card.className = 'stage';
    const chips = trophies.map((t) => {
      const label = ctx.isSpoiled(t) ? 'Hidden story trophy' : esc(t.name);
      return `<span class="chipT${ctx.isEarned(t.id) ? ' done' : ''}" data-id="${t.id}">` +
        `<span class="dot g-${t.grade}"></span>${label}</span>`;
    }).join('');
    card.innerHTML =
      `<div class="stagehead"><span class="sid">${stage.id}</span><h3>${esc(stage.title)}</h3>` +
      `<span class="hours">${esc(stage.hours)}</span>` +
      `<span class="sprog">${done}/${trophies.length} earned</span></div>` +
      `<p>${esc(stage.text)}</p>` +
      `<div class="bar"><div class="barfill" style="width:${(done / trophies.length) * 100}%"></div></div>` +
      `<div class="stagechips">${chips}</div>`;
    for (const chip of card.querySelectorAll('.chipT')) {
      chip.addEventListener('click', () => ctx.goto('checklist', Number(chip.dataset.id)));
    }
    wrap.append(card);
  }
}

export function renderMissables(ctx) {
  const wrap = document.getElementById('missables');
  const pma = ctx.byId.get(28);
  const steps = pma.steps.map((s) => `<li>${esc(s)}</li>`).join('');
  wrap.innerHTML =
    `<article class="card warn">
      <h3>Positive Mental Attitude <span class="tag watch">MISSABLE WATCH</span></h3>
      <p><b>The one genuine risk of the launch week.</b> ${esc(pma.guide)}</p>
      <ol class="steps">${steps}</ol>
      <p class="srcline">Sources: [1] PowerPyx Trophy Guide &amp; Roadmap · [2] the official PlayStation list. Read 20 Nov 2026.</p>
    </article>
    <article class="card">
      <h3>Looks fragile — actually safe</h3>
      <ul>
        <li><b>Character questlines.</b> If a character's missions vanish from the phone mid-story, they are not lost:
          every character questline returns after the story, including the ones that look missable (Kenton is the known case).</li>
        <li><b>Gang operations.</b> Valuables you miss — the three at Kingpin Bowling, for one — can be taken on a later visit
          when the operation's icon respawns. None of them has to be done in a single run.</li>
        <li><b>Optional missions.</b> Some optional missions disappear for a while mid-story; the guides report that this never
          costs a trophy, because no trophy is tied to an optional mission.</li>
        <li><b>Cheats.</b> Cheat codes switch trophies and saving off for the session. Never enter one on a platinum save —
          restart the game instead of saving after.</li>
      </ul>
      <p class="srcline">Source: [1] PowerPyx Trophy Guide &amp; Roadmap (missable section). Read 20 Nov 2026.</p>
    </article>
    <article class="card bad">
      <h3>Two trophies nobody has solved yet</h3>
      <p><b>Bad Luck, I Guess</b> and <b>Ten Pin</b> had no verified method in any guide we read in launch week — PowerPyx
        lists both as unknown. This guide prints the best-reported leads and labels them unverified rather than inventing
        methods. Keep your chapter-start saves and they cost you nothing.</p>
      <p class="srcline">Sources: [1] PowerPyx · [4] CryptoGames list notes. Read 20 Nov 2026.</p>
    </article>
    <article class="card">
      <h3>Where the sources disagree — shown, not hidden</h3>
      <table>
        <tr><th>Question</th><th>One source says</th><th>Another says</th><th>This guide uses</th></tr>
        <tr><td>How many trophies are hidden?</td><td>28 — the PlayStation list as mirrored by Exophase, PSNProfiles and GTABase</td>
          <td>27 (Push Square, via the SixShore list)</td><td>28, matching the official list itself</td></tr>
        <tr><td>Is anything missable?</td><td>Possibly one: Positive Mental Attitude (PowerPyx, GTABase)</td>
          <td>None known (Push Square)</td><td>We flag it as a watch and tell you to do it in Chapter 1 — the safe reading of both</td></tr>
        <tr><td>How long is the platinum?</td><td>About 200 hours (PowerPyx)</td><td>250 hours and up (Push Square)</td>
          <td>About 200 hours, with the disagreement noted</td></tr>
        <tr><td>Is the Chapter 1 meditation required?</td><td>Unconfirmed in every guide</td><td>—</td>
          <td>Do it anyway; it costs two minutes and removes the only known risk</td></tr>
      </table>
    </article>`;
}

export function renderSources(ctx) {
  const wrap = document.getElementById('sources');
  const cards = ctx.data.sources.map((s) => {
    const usedBy = ctx.data.trophies.filter((t) => t.sources.includes(s.n)).length;
    return `<article class="card">
      <h3>[${s.n}] ${esc(s.name)}</h3>
      <p><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a></p>
      <p>${esc(s.note)}</p>
      <p class="srcline">Read ${esc(s.read)} · cited by ${usedBy} of 55 trophies in this guide.</p>
    </article>`;
  }).join('');
  const unknownRows = [...UNKNOWN_IDS].map((id) => {
    const t = ctx.byId.get(id);
    return `<tr><td>${esc(t.name)}</td><td>Not confirmed in launch week</td><td>${esc(t.guide.split('.')[0])}.</td></tr>`;
  }).join('');
  wrap.innerHTML =
    `<article class="card">
      <h3>How this guide was built — the audit</h3>
      <p>Every trophy name, description and grade here is the official PlayStation list, reproduced the way the game
        itself shows it. Everything under those descriptions is our own words, written on 20 November 2026 from the
        sources below — each trophy's guide names its sources beside it, and every one of the 55 guides cites at least one.</p>
      <p>Two things most guides hide, shown openly: where sources disagree (see the Missable watch tab), and the two
        trophies whose methods nobody had verified in launch week:</p>
      <table>
        <tr><th>Trophy</th><th>Status</th><th>Best-reported lead</th></tr>
        ${unknownRows}
      </table>
      <p>The roadmap's shape — one playthrough, difficulty 4/10, about 200 hours, 55 offline and 0 online trophies —
        comes from source [1] and is stated on the Roadmap tab with its disagreements attached.</p>
    </article>` + cards;
}
