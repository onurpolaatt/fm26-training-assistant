// ===== FMSuperScout "Assistant" tab =====
// Runs without touching app.js: it adds its own tab and panel and only READS the global
// `state` object that FMSuperScout's app.js exposes. Must be loaded AFTER app.js.
const KEY = 'fmss_asst';
const GROUP_ORDER = ['GK','DC','DW','WB','DM','MC','MW','AW','AMC','ST'];
const store = {
  get(d) { try { const v = localStorage.getItem(KEY); return v ? Object.assign(d, JSON.parse(v)) : d; } catch { return d; } },
  set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} },
};
const defaultLang = () => ((navigator.language || 'en').toLowerCase().startsWith('tr') ? 'tr' : 'en');
const S = store.get({ lang: defaultLang(), status: 'semi', trainingFac: 2, youthFac: 2, roles: {}, tactic: {} });
if (!I18N[S.lang]) S.lang = 'en';
const save = () => store.set(S);
const L = () => I18N[S.lang] || I18N.en;
const el = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
const attrName = k => {
  const l = L(), name = l.attr[k] || k;
  return l.showAttrKey ? `${esc(name)} <span class="as-m">(${esc(I18N.en.attr[k] || k)})</span>` : esc(name);
};
const traitName = t => {
  const l = L();
  return l.traitTr && l.traitTr[t.n] ? `${esc(l.traitTr[t.n])} <span class="as-m">(${esc(t.n)})</span>` : esc(t.n);
};
const starHtml = n => {
  const full = Math.floor(n), half = n - full >= 0.5;
  return `<span class="as-stars">${'★'.repeat(full)}${half ? '½' : ''}<span class="as-off">${'★'.repeat(5 - full - (half ? 1 : 0))}</span></span> <span class="as-m">${n.toFixed(1)}</span>`;
};

const CSS = `
#assistant { flex: 1 1 auto; overflow-y: auto; padding: 16px 20px 48px; }
#assistant.hidden { display: none; }
#assistant .as-wrap { max-width: 1180px; margin: 0 auto; display: grid; gap: 26px; }
#assistant h2 { font-size: 18px; margin: 0; letter-spacing: .02em; }
#assistant h3 { font-size: 16px; margin: 0; }
#assistant .as-m { color: var(--muted); }
#assistant .as-head { display: flex; flex-wrap: wrap; gap: 6px 14px; align-items: baseline; justify-content: space-between; }
#assistant .as-ctl { display: flex; flex-wrap: wrap; gap: 12px; align-items: end; background: var(--bg2); border: 1px solid var(--border); border-radius: 8px; padding: 12px; }
#assistant .as-f { display: grid; gap: 4px; min-width: 0; }
#assistant .as-f label, #assistant .as-lbl { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); font-weight: 600; }
#assistant select { background: var(--bg3); color: var(--text); border: 1px solid var(--border); border-radius: 6px; padding: 6px 8px; font: inherit; max-width: 100%; }
#assistant .as-btn { background: var(--bg3); color: var(--text); border: 1px solid var(--border); border-radius: 6px; padding: 5px 10px; cursor: pointer; font: inherit; }
#assistant .as-acts { display: grid; gap: 6px; }
#assistant .as-act { display: grid; grid-template-columns: 100px 1fr; gap: 12px; background: var(--bg2); border: 1px solid var(--border); border-left: 4px solid var(--accent2); border-radius: 8px; padding: 10px 12px; }
#assistant .as-act.l3 { border-left-color: var(--bad); } #assistant .as-act.l2 { border-left-color: var(--warn); }
#assistant .as-act .s { font-weight: 600; }
#assistant .as-act .d { color: var(--muted); font-size: 13px; }
#assistant .as-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr)); gap: 10px; }
#assistant .as-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 500px), 1fr)); gap: 10px; }
#assistant .as-box, #assistant .as-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 10px; padding: 12px; display: grid; gap: 10px; align-content: start; min-width: 0; }
#assistant .as-grp { font-size: 12px; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); font-weight: 700; border-top: 1px solid var(--border); padding-top: 8px; }
#assistant .as-ph { display: flex; flex-wrap: wrap; gap: 6px 8px; align-items: baseline; }
#assistant .as-name { font-weight: 700; font-size: 16px; cursor: pointer; }
#assistant .as-name:hover { color: var(--accent); }
#assistant .as-chip { font-size: 11px; font-weight: 600; padding: 1px 7px; border-radius: 999px; background: var(--bg3); border: 1px solid var(--border); color: var(--muted); white-space: nowrap; }
#assistant .as-chip.up { color: var(--accent); border-color: var(--accent); }
#assistant .as-chip.warn { color: var(--warn); border-color: var(--warn); }
#assistant .as-chip.loan { color: var(--accent2); border-color: var(--accent2); }
#assistant .as-capa { margin-left: auto; font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }
#assistant .as-roles { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
#assistant .as-roles select { width: 100%; }
#assistant .as-fit { font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }
#assistant .as-plan { border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
#assistant .as-row { display: grid; grid-template-columns: 110px 1fr; gap: 10px; padding: 7px 10px; border-top: 1px solid var(--border); }
#assistant .as-row:first-child { border-top: 0; }
#assistant .as-row .k { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); font-weight: 600; padding-top: 2px; }
#assistant .as-row .why { display: block; color: var(--muted); font-size: 12px; }
#assistant .as-notes { margin: 0; padding: 0; list-style: none; display: grid; gap: 4px; font-size: 13px; color: var(--muted); }
#assistant .as-notes b { color: var(--text); }
#assistant table { border-collapse: collapse; width: 100%; min-width: 520px; }
#assistant th, #assistant td { text-align: left; padding: 8px 12px; border-top: 1px solid var(--border); font-size: 13px; }
#assistant thead th { border-top: 0; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
#assistant .as-tbl { overflow-x: auto; background: var(--bg2); border: 1px solid var(--border); border-radius: 10px; }
#assistant .as-stars { color: var(--star); letter-spacing: 1px; }
#assistant .as-off { color: var(--border); }
#assistant .as-call { border: 1px dashed var(--border); border-radius: 8px; padding: 10px 12px; color: var(--muted); font-size: 13px; }
#assistant ul { margin: 0; padding-left: 18px; }
@media (max-width: 640px) { #assistant .as-roles, #assistant .as-row, #assistant .as-act { grid-template-columns: 1fr; } }
`;

let active = false, lastPlayers = null, lastHide = null;

function squad() {
  const club = (state.meta?.myClub || '').toLowerCase();
  if (!club) return null;
  const mine = p => (p.club || '').toLowerCase() === club || (p.ownerClub || '').toLowerCase() === club;
  return {
    meta: state.meta,
    players: (state.players || []).filter(p => mine(p) && p.attrs),
    staff: (state.staff || []).filter(s => (s.club || '').toLowerCase() === club),
  };
}

function roleSelect(p, phase, cur, best) {
  const U = L().ui, pg = new Set(groupsOf(p));
  let list = ROLES.filter(r => r.phase === phase && r.groups.some(g => pg.has(g)));
  if (!list.length) list = ROLES.filter(r => r.phase === phase);
  const id = `as_${phase}_${p.id}`;
  return `<div class="as-f"><label for="${id}">${phase === 'IP' ? U.ip : U.oop}</label>
    <select id="${id}" data-pid="${p.id}" data-phase="${phase}">${list.map(r => `<option value="${r.id}"${r.id === cur.id ? ' selected' : ''}>${esc(r.name)}${r.id === best.id ? ' ★' : ''}</option>`).join('')}</select></div>`;
}

function card(x, useHidden) {
  const U = L().ui, p = x.p, f = x.focus.list[0], f2 = x.focus.list[1];
  const focus = f
    ? `<b>${attrName(f.k)}</b><span class="why">${esc(U.focusWhy(p.attrs[f.k], x.focus.level.toFixed(0)))}${f.note ? ' ' + esc(f.note) + '.' : ''}${f2 ? esc(U.second(L().attr[f2.k] || f2.k)) : ''}</span>`
    : `<b>${esc(U.noFocus)}</b><span class="why">${esc(U.noFocusD)}</span>`;
  const trait = x.trait ? `${traitName(x.trait)}<span class="why">${esc(U.traitSkip)}</span>` : `<span class="as-m">${esc(U.noTrait)}</span>`;
  const notes = x.flags.filter(fl => fl.d).map(fl => `<li><b>${esc(fl.s)}:</b> ${esc(fl.d)}</li>`).join('');
  return `<div class="as-card">
    <div class="as-ph"><span class="as-name" data-open="${p.id}">${esc(p.name)}</span><span class="as-m">${p.age} ${esc(U.age)}</span><span class="as-chip">${esc(p.pos)}</span>
      ${x.flags.map(fl => `<span class="as-chip ${fl.t}">${esc(fl.s)}</span>`).join('')}
      ${useHidden ? `<span class="as-capa">CA ${p.ca} · PA ${p.pa}</span>` : ''}</div>
    <div class="as-roles">${roleSelect(p, 'IP', x.ipR, x.bestIp.r)}${roleSelect(p, 'OOP', x.oopR, x.bestOop.r)}</div>
    <div class="as-fit">${esc(U.fit(x.fitIp.toFixed(1), x.fitOop.toFixed(1)))}</div>
    <div class="as-plan">
      <div class="as-row"><span class="k">${esc(U.roleTr)}</span><span>${esc(x.ipR.name)} + ${esc(x.oopR.name)}</span></div>
      <div class="as-row"><span class="k">${esc(U.focus)}</span><span>${focus}</span></div>
      <div class="as-row"><span class="k">${esc(U.intensity)}</span><span>${esc(x.intensity.v)}<span class="why">${esc(x.intensity.why)}.</span></span></div>
      <div class="as-row"><span class="k">${esc(U.trait)}</span><span>${trait}</span></div>
    </div>
    ${notes ? `<ul class="as-notes">${notes}</ul>` : ''}
  </div>`;
}

function render() {
  const l = L(), U = l.ui, box = el('assistant');
  box.lang = S.lang;   // correct uppercase rules (Turkish İ/I)
  el('tab-assistant').textContent = U.tab;
  const data = squad();
  if (!data || !data.players.length) { box.innerHTML = `<div class="as-wrap"><div class="as-call">${esc(U.noData)}</div></div>`; return; }
  const useHidden = !state.hideCapa;   // FMSuperScout's "hide CA/PA and hidden stats" setting
  const R = analyse(data, { lang: S.lang, useHidden, status: S.status, trainingFac: S.trainingFac, youthFac: S.youthFac, roleChoice: S.roles, tactic: S.tactic });
  const present = GROUP_ORDER.filter(g => R.players.some(x => x.group === g));
  const tSel = (g, phase) => {
    const id = `ast_${phase}_${g}`, cur = (S.tactic[g] || {})[phase === 'IP' ? 'ip' : 'oop'] || '';
    return `<div class="as-f"><label for="${id}">${phase === 'IP' ? U.ip : U.oop}</label><select id="${id}" data-g="${g}" data-phase="${phase}"><option value="">${esc(U.auto)}</option>${ROLES.filter(r => r.phase === phase && r.groups.includes(g)).map(r => `<option value="${r.id}"${r.id === cur ? ' selected' : ''}>${esc(r.name)}</option>`).join('')}</select></div>`;
  };
  const sorted = R.players.slice().sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) || (useHidden ? b.p.ca - a.p.ca : b.fitIp - a.fitIp));
  let cards = '', cur = null, buf = [];
  const flush = () => { if (buf.length) cards += `<div class="as-grp">${esc(l.group[cur] || cur)}</div><div class="as-cards">${buf.join('')}</div>`; buf = []; };
  for (const x of sorted) { if (x.group !== cur) { flush(); cur = x.group; } buf.push(card(x, useHidden)); }
  flush();

  const M = R.mentoring, det = x => x.p.attrs.Determination;
  const mentor = M.groups.map(g => `<div class="as-box"><span class="as-lbl">${esc(U.mentor)} · ${esc(U.influence)} ${esc(g.influence)}</span><h3>${esc(g.mentor.p.name)}</h3>
      <span class="as-m">${g.mentor.p.age} ${esc(U.age)} · ${esc(U.det)} ${det(g.mentor)}${useHidden ? ` · ${esc(U.prof)} ${g.mentor.p.professionalism}` : ''}</span><ul>${g.mentees.map(m => `<li>${esc(m.p.name)} <span class="as-m">(${m.p.age}, ${esc(U.det)} ${det(m)})</span></li>`).join('')}</ul></div>`).join('')
    + (M.bad.length ? `<div class="as-box"><span class="as-lbl">${esc(U.keepOut)}</span><ul>${M.bad.map(x => `<li>${esc(x.p.name)} <span class="as-m">(${esc(U.det)} ${det(x)}${useHidden ? `, ${esc(U.prof)} ${x.p.professionalism}` : ''})</span></li>`).join('')}</ul></div>` : '')
    + (M.left.length ? `<div class="as-box"><span class="as-lbl">${esc(U.unassigned)}</span><ul>${M.left.map(x => `<li>${esc(x.p.name)}</li>`).join('')}</ul></div>` : '');

  const T = R.staff;
  const staffRows = T.rows.map(r => `<tr><td><b>${esc(l.cat[r.cat.id])}</b>${r.cat.lowConf ? ` <span class="as-m">(${esc(U.estimated)})</span>` : ''}</td><td>${r.coach ? esc(r.coach.name) + ` <span class="as-m">· ${r.coach.jobId === 16 ? esc(U.you) : esc(r.coach.job)}</span>` : `<span class="as-m">${esc(U.none)}</span>`}</td><td>${starHtml(r.stars)}</td><td>${R.demand[r.cat.id] || 0}</td></tr>`).join('');
  const nOver = Object.keys(S.roles).length;
  const facOpts = l.fac.map((f, i) => `<option value="${i}">${esc(f)}</option>`).join('');

  box.innerHTML = `<div class="as-wrap">
    <div class="as-head"><h2>${esc(U.title)} · ${esc(data.meta.myClub)}</h2><span class="as-m">${esc(data.meta.gameDate || '')} · ${R.players.length} ${esc(U.players)}</span></div>
    <div class="as-ctl">
      <div class="as-f"><label for="as-lang">${esc(U.lang)}</label><select id="as-lang"><option value="en">English</option><option value="tr">Türkçe</option></select></div>
      <div class="as-f"><label for="as-status">${esc(U.status)}</label><select id="as-status"><option value="pro">${esc(U.pro)}</option><option value="semi">${esc(U.semi)}</option><option value="amateur">${esc(U.amateur)}</option></select></div>
      <div class="as-f"><label for="as-tf">${esc(U.tf)}</label><select id="as-tf">${facOpts}</select></div>
      <div class="as-f"><label for="as-yf">${esc(U.yf)}</label><select id="as-yf">${facOpts}</select></div>
      <span class="as-m" style="font-size:12px">${esc(U.hiddenNote)}</span>
    </div>
    <div class="as-acts">${R.actions.map(a => `<div class="as-act l${a.lvl}"><span class="as-lbl">${esc(a.area)}</span><div><div class="s">${esc(a.s)}</div><div class="d">${esc(a.d)}</div></div></div>`).join('')}</div>
    <div class="as-head"><h2>${esc(U.tactic)}</h2><span class="as-m">${esc(U.tacticHint)}</span></div>
    <div class="as-grid">${present.map(g => `<div class="as-box"><span class="as-lbl">${esc(l.group[g])}</span><div class="as-roles">${tSel(g, 'IP')}${tSel(g, 'OOP')}</div></div>`).join('')}</div>
    ${nOver ? `<div class="as-call">${esc(U.overrides(nOver))} <button class="as-btn" id="as-reset">${esc(U.reset)}</button></div>` : ''}
    <div class="as-head"><h2>${esc(U.plans)}</h2></div>
    <div style="display:grid;gap:10px">${cards}</div>
    <div class="as-head"><h2>${esc(U.mentoring)}</h2></div>
    <div class="as-grid">${mentor || `<div class="as-box">${esc(U.noMentor)}</div>`}</div>
    <div class="as-head"><h2>${esc(U.staff)}</h2></div>
    <div class="as-tbl"><table><thead><tr><th>${esc(U.category)}</th><th>${esc(U.coach)}</th><th>${esc(U.quality)}</th><th>${esc(U.need)}</th></tr></thead><tbody>${staffRows}</tbody></table></div>
    <div class="as-call">${esc(U.foot)}</div>
  </div>`;

  el('as-lang').value = S.lang; el('as-status').value = S.status; el('as-tf').value = S.trainingFac; el('as-yf').value = S.youthFac;
  el('as-lang').onchange = e => { S.lang = e.target.value; save(); keepFocus('as-lang'); };
  el('as-status').onchange = e => { S.status = e.target.value; save(); keepFocus('as-status'); };
  el('as-tf').onchange = e => { S.trainingFac = +e.target.value; save(); keepFocus('as-tf'); };
  el('as-yf').onchange = e => { S.youthFac = +e.target.value; save(); keepFocus('as-yf'); };
  const rs = el('as-reset'); if (rs) rs.onclick = () => { S.roles = {}; save(); render(); };
  box.querySelectorAll('select[data-g]').forEach(s => s.onchange = e => {
    const { g, phase } = e.target.dataset;
    S.tactic[g] = Object.assign({}, S.tactic[g], { [phase === 'IP' ? 'ip' : 'oop']: e.target.value || undefined });
    save(); keepFocus(e.target.id);
  });
  box.querySelectorAll('select[data-pid]').forEach(s => s.onchange = e => {
    const { pid, phase } = e.target.dataset;
    S.roles[pid] = Object.assign({}, S.roles[pid], { [phase === 'IP' ? 'ip' : 'oop']: e.target.value });
    save(); keepFocus(e.target.id);
  });
  box.querySelectorAll('[data-open]').forEach(n => n.onclick = () => {
    const p = state.players.find(x => String(x.id) === n.dataset.open);
    if (p && typeof showDetail === 'function') showDetail(p);
  });
}
function keepFocus(id) { const top = el('assistant').scrollTop; render(); el('assistant').scrollTop = top; const n = el(id); if (n) n.focus(); }

function show() {
  setMode('analysis');                       // let app.js hide the table and filters
  active = true;
  el('analysis').classList.add('hidden');
  el('assistant').classList.remove('hidden');
  document.querySelectorAll('#topbar nav .tab').forEach(t => t.classList.toggle('active', t.id === 'tab-assistant'));
  lastPlayers = state.players; lastHide = state.hideCapa;
  render();
}
function hide() { active = false; el('assistant').classList.add('hidden'); el('tab-assistant').classList.remove('active'); }

function init() {
  if (el('tab-assistant')) return;
  if (typeof state === 'undefined' || typeof setMode !== 'function') { console.warn('[assistant] FMSuperScout app.js not found; load assistant.js after app.js'); return; }
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const btn = document.createElement('button'); btn.id = 'tab-assistant'; btn.className = 'tab'; btn.textContent = L().ui.tab;
  document.querySelector('#topbar nav').appendChild(btn);
  const pane = document.createElement('div'); pane.id = 'assistant'; pane.className = 'hidden';
  el('content').appendChild(pane);
  btn.onclick = show;
  ['tab-players', 'tab-staff', 'tab-shortlist', 'tab-analysis'].forEach(id => el(id)?.addEventListener('click', hide));
  // Re-render when a new F9 dump arrives or the hidden-stats setting changes
  setInterval(() => { if (active && (state.players !== lastPlayers || state.hideCapa !== lastHide)) { lastPlayers = state.players; lastHide = state.hideCapa; render(); } }, 1000);
}
init();
