// ===== Rule engine (pure functions, no DOM). User-facing text comes from I18N[lang]. =====
const NOT_FOCUSABLE = new Set(['Determination','Flair','Leadership','NaturalFitness','Aggression','Bravery','Eccentricity']);
const PHYS = new Set(['Acceleration','Pace','Agility','Balance','Strength','Stamina','JumpingReach']);

const POS_GROUP = { GK:'GK', DC:'DC', SW:'DC', DL:'DW', DR:'DW', WBL:'WB', WBR:'WB', DM:'DM', MC:'MC', ML:'MW', MR:'MW', AML:'AW', AMR:'AW', AMC:'AMC', ST:'ST' };
// Depth groups and typical number of starters
const DEPTH = { GK:['GK',1], DC:['DC',2], DW:['FB',2], WB:['FB',2], DM:['MID',2], MC:['MID',2], MW:['WIDE',2], AW:['WIDE',2], AMC:['AMC',1], ST:['ST',1] };

// FM26 roles. key = key attributes (x2), pref = preferred (x1). Attribute lists are estimates.
const R = (id, phase, name, groups, key, pref) => ({ id, phase, name, groups, key, pref });
const ROLES = [
  // Goalkeeper
  R('gk','IP','Goalkeeper',['GK'],['Handling','Reflexes','Positioning','OneOnOnes','AerialReach','Concentration'],['Kicking','Agility','CommandOfArea','Decisions']),
  R('bpgk','IP','Ball-Playing Goalkeeper',['GK'],['Passing','FirstTouch','Composure','Kicking','Reflexes','Handling'],['Vision','Decisions','Technique']),
  R('nngk','IP','No-Nonsense Goalkeeper',['GK'],['Handling','Reflexes','Kicking','Positioning','Concentration'],['AerialReach','CommandOfArea','Bravery']),
  R('gk_o','OOP','Goalkeeper',['GK'],['Reflexes','Positioning','OneOnOnes','Handling'],['Concentration','CommandOfArea']),
  R('lhk','OOP','Line-Holding Keeper',['GK'],['Reflexes','Positioning','Handling','Concentration'],['Agility','AerialReach']),
  R('swk','OOP','Sweeper Keeper',['GK'],['RushingOut','OneOnOnes','Anticipation','Acceleration','Reflexes'],['Composure','Decisions','CommandOfArea']),
  // Centre-back
  R('cb','IP','Centre-Back',['DC'],['Heading','JumpingReach','Positioning','Marking','Tackling','Strength'],['Composure','Decisions','Passing']),
  R('bpcb','IP','Ball-Playing Centre-Back',['DC'],['Passing','Composure','Vision','FirstTouch','Technique','Decisions'],['Positioning','Heading']),
  R('nncb','IP','No-Nonsense Centre-Back',['DC'],['Heading','JumpingReach','Strength','Bravery','Positioning'],['Marking','Tackling','Concentration']),
  R('acb','IP','Advanced Centre-Back',['DC'],['Passing','Dribbling','FirstTouch','Composure','Vision','Decisions'],['Technique','Stamina','Acceleration']),
  R('wcb','IP','Wide Centre-Back',['DC'],['Marking','Tackling','Positioning','Dribbling','Crossing','Pace'],['Stamina','Passing']),
  R('ocb','IP','Overlapping Centre-Back',['DC'],['Dribbling','Crossing','Stamina','Pace','Acceleration','OffTheBall'],['Passing','WorkRate']),
  R('cb_o','OOP','Centre-Back',['DC'],['Marking','Tackling','Positioning','Heading','JumpingReach','Concentration'],['Anticipation','Strength']),
  R('ccb','OOP','Covering Centre-Back',['DC'],['Positioning','Anticipation','Pace','Acceleration','Concentration','Decisions'],['Marking','Tackling']),
  R('wcb_o','OOP','Wide Centre-Back',['DC'],['Marking','Tackling','Positioning','Pace','Concentration'],['Acceleration','Stamina']),
  R('scb','OOP','Stopping Centre-Back',['DC'],['Tackling','Aggression','Bravery','Strength','Anticipation','Marking'],['Decisions','Acceleration']),
  // Full-back / wing-back
  R('fb','IP','Full Back',['DW'],['Marking','Tackling','Positioning','Crossing','Stamina','WorkRate'],['Teamwork','Pace','Passing']),
  R('ifb','IP','Inside Full-Back',['DW'],['Marking','Tackling','Positioning','Heading','Strength','Composure'],['JumpingReach','Passing']),
  R('pwb','IP','Playmaking Wing-Back',['DW','WB'],['Passing','Vision','FirstTouch','Technique','Composure','Decisions'],['Teamwork','Stamina']),
  R('iwb','IP','Inside Wing-Back',['DW','WB'],['Passing','Tackling','Positioning','Decisions','Composure','Teamwork'],['FirstTouch','Anticipation']),
  R('wb','IP','Wing Back',['DW','WB'],['Crossing','Dribbling','Stamina','Pace','WorkRate','OffTheBall','Tackling'],['Acceleration','Teamwork','Technique']),
  R('awb','IP','Advanced Wing-Back',['WB'],['Crossing','Dribbling','Technique','OffTheBall','Pace','Acceleration','Stamina'],['FirstTouch','Agility']),
  R('fb_o','OOP','Full Back',['DW'],['Marking','Tackling','Positioning','Concentration','Anticipation'],['Pace','Stamina']),
  R('hfb','OOP','Holding Full-Back',['DW'],['Positioning','Marking','Concentration','Tackling','Decisions'],['Strength','Heading']),
  R('pfb','OOP','Pressing Full-Back',['DW'],['Tackling','WorkRate','Aggression','Stamina','Acceleration','Anticipation'],['Teamwork','Pace']),
  R('wb_o','OOP','Wing Back',['WB'],['Tackling','Marking','Positioning','Stamina','WorkRate'],['Teamwork','Pace']),
  R('hwb','OOP','Holding Wing-Back',['WB'],['Positioning','Marking','Concentration','Tackling','Decisions'],['Strength']),
  R('prwb','OOP','Pressing Wing-Back',['WB'],['Tackling','WorkRate','Aggression','Stamina','Acceleration','Anticipation'],['Teamwork','Pace']),
  // Defensive midfield
  R('dm','IP','Defensive Midfielder',['DM'],['Positioning','Tackling','Anticipation','Decisions','Teamwork','Concentration'],['Passing','Composure']),
  R('hb','IP','Half Back',['DM'],['Positioning','Marking','Tackling','Anticipation','Composure','Decisions'],['Heading','Strength','Passing']),
  R('dlp','IP','Deep-Lying Playmaker',['DM'],['Passing','Vision','FirstTouch','Technique','Composure','Decisions'],['Teamwork','Anticipation']),
  R('b2b','IP','Box-To-Box Midfielder',['DM'],['Stamina','WorkRate','OffTheBall','Finishing','LongShots','Passing'],['Tackling','Acceleration']),
  R('b2bp','IP','Box-To-Box Playmaker',['DM'],['Passing','Vision','Stamina','WorkRate','Technique','OffTheBall'],['Decisions','FirstTouch']),
  R('dm_o','OOP','Defensive Midfielder',['DM'],['Tackling','Marking','Positioning','Anticipation','Concentration'],['Teamwork','WorkRate']),
  R('ddm','OOP','Dropping Defensive Midfielder',['DM'],['Positioning','Marking','Heading','JumpingReach','Concentration'],['Strength','Tackling']),
  R('pdm','OOP','Pressing Defensive Midfielder',['DM'],['Tackling','WorkRate','Stamina','Aggression','Acceleration','Anticipation'],['Teamwork','Bravery']),
  R('sdm','OOP','Screening Defensive Midfielder',['DM'],['Positioning','Anticipation','Concentration','Decisions','Teamwork'],['Marking','Tackling']),
  R('wcdm','OOP','Wide Covering Defensive Midfielder',['DM'],['Stamina','WorkRate','Pace','Tackling','Positioning'],['Anticipation','Teamwork']),
  // Central midfield
  R('cm','IP','Central Midfielder',['MC'],['Passing','FirstTouch','Decisions','Teamwork','WorkRate','Stamina'],['Technique','Vision']),
  R('mp','IP','Midfield Playmaker',['MC'],['Passing','Vision','Technique','FirstTouch','Composure','Flair','Decisions'],['Dribbling','Agility']),
  R('wcm','IP','Wide Central Midfielder',['MC'],['Crossing','Passing','Stamina','WorkRate','OffTheBall','Dribbling'],['Technique','Teamwork']),
  R('ap','IP','Advanced Playmaker',['MC','AMC'],['Passing','Vision','Technique','FirstTouch','Composure','Decisions','Flair'],['Dribbling','Agility','OffTheBall']),
  R('am','IP','Attacking Midfielder',['MC','AMC'],['OffTheBall','FirstTouch','Technique','Finishing','LongShots','Composure','Decisions'],['Dribbling','Passing','Anticipation']),
  R('chm','IP','Channel Midfielder',['MC','AMC'],['OffTheBall','Dribbling','Passing','Stamina','Acceleration','Technique'],['Crossing','Vision','WorkRate']),
  R('cm_o','OOP','Central Midfielder',['MC'],['Tackling','Positioning','Teamwork','WorkRate','Anticipation'],['Stamina','Marking']),
  R('pcm','OOP','Pressing Central Midfielder',['MC'],['Tackling','WorkRate','Stamina','Aggression','Acceleration','Anticipation'],['Teamwork','Bravery']),
  R('scm','OOP','Screening Central Midfielder',['MC'],['Positioning','Anticipation','Concentration','Decisions','Marking'],['Tackling','Teamwork']),
  R('wccm','OOP','Wide Covering Central Midfielder',['MC'],['Stamina','WorkRate','Pace','Tackling','Positioning'],['Teamwork']),
  // Attacking midfield
  R('fr','IP','Free Role',['AMC'],['Flair','Vision','Passing','Dribbling','Technique','FirstTouch','Decisions'],['Composure','OffTheBall','Agility']),
  R('ss','IP','Second Striker',['AMC'],['Finishing','OffTheBall','Composure','FirstTouch','Anticipation','Acceleration'],['Dribbling','Technique']),
  R('am_o','OOP','Attacking Midfielder',['AMC'],['WorkRate','Teamwork','Positioning','Anticipation'],['Stamina','Tackling']),
  R('coam','OOP','Central Outlet Attacking Midfielder',['AMC'],['OffTheBall','Acceleration','Pace','Anticipation'],['Dribbling','FirstTouch']),
  R('soam','OOP','Splitting Outlet Attacking Midfielder',['AMC'],['OffTheBall','Pace','Acceleration','Dribbling'],['Anticipation']),
  R('tam','OOP','Tracking Attacking Midfielder',['AMC'],['WorkRate','Stamina','Tackling','Teamwork','Positioning'],['Marking','Anticipation']),
  // Wide
  R('if','IP','Inside Forward',['AW'],['Finishing','Dribbling','FirstTouch','Technique','OffTheBall','Acceleration','Agility'],['Composure','LongShots','Pace']),
  R('iw','IP','Inside Winger',['AW','MW'],['Dribbling','Passing','Vision','Technique','FirstTouch','Flair','Acceleration'],['Crossing','Agility']),
  R('pw','IP','Playmaking Winger',['AW','MW'],['Passing','Vision','Technique','FirstTouch','Composure','Flair','Decisions'],['Dribbling']),
  R('wf','IP','Wide Forward',['AW'],['Finishing','OffTheBall','Pace','Acceleration','Dribbling','Composure'],['Crossing','Heading']),
  R('w','IP','Winger',['AW','MW'],['Crossing','Dribbling','Pace','Acceleration','Technique','Agility'],['OffTheBall','FirstTouch','Stamina']),
  R('wm','IP','Wide Midfielder',['MW'],['Crossing','Passing','Stamina','WorkRate','Teamwork','Decisions'],['Tackling','Positioning']),
  R('w_o','OOP','Winger',['AW'],['WorkRate','Stamina','Teamwork'],['Tackling','Positioning']),
  R('iow','OOP','Inside Outlet Winger',['AW'],['OffTheBall','Acceleration','Pace','Anticipation'],['Dribbling']),
  R('tw','OOP','Tracking Winger',['AW'],['WorkRate','Stamina','Tackling','Marking','Positioning','Teamwork'],['Anticipation']),
  R('wow','OOP','Wide Outlet Winger',['AW'],['Pace','Acceleration','OffTheBall','Dribbling'],['Anticipation']),
  R('wm_o','OOP','Wide Midfielder',['MW'],['WorkRate','Stamina','Teamwork','Positioning'],['Tackling']),
  R('twm','OOP','Tracking Wide Midfielder',['MW'],['WorkRate','Stamina','Tackling','Marking','Positioning','Teamwork'],['Anticipation']),
  R('wowm','OOP','Wide Outlet Wide Midfielder',['MW'],['Pace','Acceleration','OffTheBall','Dribbling'],['Anticipation']),
  // Striker
  R('cf','IP','Centre Forward',['ST'],['Finishing','OffTheBall','Composure','FirstTouch','Heading','Strength'],['Dribbling','Technique','Pace']),
  R('chf','IP','Channel Forward',['ST'],['OffTheBall','Pace','Acceleration','Dribbling','Finishing','Stamina'],['WorkRate','Composure']),
  R('dlf','IP','Deep-Lying Forward',['ST'],['FirstTouch','Passing','Vision','Technique','Composure','Decisions','Teamwork'],['Finishing','Strength']),
  R('f9','IP','False Nine',['ST'],['FirstTouch','Passing','Vision','Technique','Dribbling','Composure','Flair','Decisions'],['OffTheBall','Agility']),
  R('poa','IP','Poacher',['ST'],['Finishing','OffTheBall','Anticipation','Composure','FirstTouch'],['Acceleration','Heading']),
  R('tf','IP','Target Forward',['ST'],['Heading','JumpingReach','Strength','Bravery','Balance','FirstTouch'],['Finishing','Teamwork']),
  R('cf_o','OOP','Centre Forward',['ST'],['WorkRate','Teamwork','Anticipation'],['Stamina','Aggression']),
  R('cocf','OOP','Central Outlet Centre Forward',['ST'],['OffTheBall','Anticipation','Acceleration','Pace','Strength'],['Balance']),
  R('socf','OOP','Splitting Outlet Centre Forward',['ST'],['OffTheBall','Acceleration','Pace','Dribbling'],['Anticipation']),
  R('tcf','OOP','Tracking Centre Forward',['ST'],['WorkRate','Stamina','Teamwork','Aggression','Tackling'],['Bravery']),
];
const ROLE = Object.fromEntries(ROLES.map(r => [r.id, r]));
const roleName = (r, L) => (L && L.role && L.role[r.id]) || r.name;

// Player traits: suggested when the role matches and attribute thresholds are met
const TRAITS = [
  { n:'Gets Into Opposition Area', roles:['am','ss','chm','if','wf','b2b'], need:{OffTheBall:12} },
  { n:'Shoots From Distance', roles:['am','ss','b2b','if','cf','chm'], need:{LongShots:14} },
  { n:'Places Shots', roles:['cf','poa','if','wf','ss','am','chf'], need:{Finishing:13, Composure:11} },
  { n:'Runs With Ball Through Centre', roles:['am','fr','ss','f9','acb'], need:{Dribbling:13} },
  { n:'Cuts Inside From Both Wings', roles:['if','iw','pw'], need:{Dribbling:12, Agility:11} },
  { n:'Runs With Ball Down Flank', roles:['w','wf','wb','awb','ocb'], need:{Dribbling:12, Acceleration:12} },
  { n:'Tries Killer Balls Often', roles:['ap','mp','fr','pw','iw','dlp','b2bp','f9','dlf'], need:{Vision:13, Passing:12} },
  { n:'Dictates Tempo', roles:['dlp','mp','ap','b2bp','bpcb'], need:{Passing:14, Decisions:13, Composure:12} },
  { n:'Likes To Switch Ball To Other Flank', roles:['dlp','cm','hb','bpcb','pwb'], need:{Passing:13, Vision:12} },
  { n:'Tries To Beat Offside Trap', roles:['chf','poa','ss','cf','wf'], need:{OffTheBall:13, Acceleration:12} },
  { n:'Comes Deep To Get Ball', roles:['dlf','f9'], need:{FirstTouch:12, Passing:11} },
  { n:'Brings Ball Out Of Defence', roles:['bpcb','acb','ocb','hb'], need:{Dribbling:11, Composure:11} },
  { n:'Marks Opponent Tightly', roles:['cb_o','scb','hfb','fb_o','dm_o','tw','twm'], need:{Marking:13} },
  { n:'Gets Forward Whenever Possible', roles:['wb','awb','ocb','b2b'], need:{Stamina:13, OffTheBall:10} },
  { n:'Hugs Line', roles:['w','wm','wf'], need:{Crossing:12} },
];

const avg = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

function groupsOf(p) {
  return [...new Set((p.posArr || []).map(x => POS_GROUP[x]).filter(Boolean))];
}
function rolesFor(p, phase) {
  const g = new Set(groupsOf(p));
  const list = ROLES.filter(r => r.phase === phase && r.groups.some(x => g.has(x)));
  return list.length ? list : ROLES.filter(r => r.phase === phase);
}
function roleFit(p, r) {
  let s = 0, w = 0;
  for (const k of r.key) if (p.attrs[k] != null) { s += p.attrs[k] * 2; w += 2; }
  for (const k of r.pref) if (p.attrs[k] != null) { s += p.attrs[k]; w += 1; }
  return w ? s / w : 0;
}
function bestRole(p, phase) {
  return rolesFor(p, phase).map(r => ({ r, fit: roleFit(p, r) })).sort((a, b) => b.fit - a.fit)[0];
}

// ---- Extra (additional) focus ----
function focusFor(p, ipR, oopR, L) {
  const w = {};
  const add = (k, x) => { w[k] = Math.max(w[k] || 0, x); };
  ipR.key.forEach(k => add(k, 2)); oopR.key.forEach(k => add(k, 1.5));
  ipR.pref.forEach(k => add(k, 1)); oopR.pref.forEach(k => add(k, 0.7));
  const ipVals = ipR.key.map(k => p.attrs[k]).filter(v => v != null).sort((a, b) => b - a);
  const level = Math.max(10, avg(ipVals.slice(0, Math.ceil(ipVals.length / 2))));
  const out = [];
  for (const [k, wt] of Object.entries(w)) {
    if (NOT_FOCUSABLE.has(k) || p.attrs[k] == null) continue;
    let deficit = level - p.attrs[k];
    if (deficit <= 0) continue;
    let m = 1, note = '';
    if (k === 'Strength' && p.age <= 19) { m = 0.35; note = L.t.noteStrength; }
    else if ((k === 'Pace' || k === 'Acceleration' || k === 'Agility') && p.age <= 21) { m = 1.2; note = L.t.notePace; }
    else if (PHYS.has(k) && p.age >= 25) { m = 0.5; note = L.t.notePhysAge; }
    out.push({ k, score: wt * deficit * m, deficit, note });
  }
  out.sort((a, b) => b.score - a.score);
  return { level, list: out };
}

function intensityFor(p, useHidden, status, L) {
  const a = p.attrs, I = L.intensity, T = L.t;
  if (useHidden && a.InjuryProneness >= 14) return { v: I.low, why: T.inInjury(a.InjuryProneness) };
  if (p.age >= 31) return { v: I.normal, why: T.inOld };
  if (p.age <= 18) return { v: I.normal, why: T.inYoung };
  if (a.NaturalFitness >= 14 && (!useHidden || a.InjuryProneness <= 8)) return { v: I.high, why: T.inFit };
  return { v: I.normal, why: status === 'semi' || status === 'amateur' ? T.inSemi : T.inStd };
}

function traitFor(p, ipR, oopR) {
  let best = null;
  for (const t of TRAITS) {
    if (!t.roles.includes(ipR.id) && !t.roles.includes(oopR.id)) continue;
    let margin = 0, ok = true;
    for (const [k, min] of Object.entries(t.need)) { const v = p.attrs[k] ?? 0; if (v < min) { ok = false; break; } margin += v - min; }
    if (ok && (!best || margin > best.margin)) best = { ...t, margin };
  }
  return best;
}

// ---- Coaching staff ----
// Staff job ids in the FMSuperScout dump: 2 coach, 16 manager, 20 assistant, 26 fitness, 34 GK coach,
// 12 physio, 50 head physio, 48 sports scientist, 64 head of youth development.
const TRAINING_JOBS = new Set([2, 16, 20, 26, 34]);
const CATS = [
  { id:'fiz', w:{ Fitheid:3 } },
  { id:'sav', w:{ Verdedigen:2, Tactisch:1 } },
  { id:'tak', w:{ Tactisch:3 } },
  { id:'top', w:{ Technisch:2, Balbezit:1 } },
  { id:'huc', w:{ Aanvallen:2, Tactisch:1 } },
  { id:'sut', w:{ Aanvallen:1.5, Technisch:1.5 } },
  { id:'kal', w:{ KV_reflexen:3 }, lowConf:true },
  { id:'dur', w:{ Standaardsituaties:3 } },
];
const ATTR_CAT = {
  FirstTouch:'top', Technique:'top', Dribbling:'top', Passing:'top', Crossing:'top',
  Finishing:'sut', LongShots:'sut',
  OffTheBall:'huc', Vision:'huc', Composure:'huc', Flair:'huc',
  Decisions:'tak', Anticipation:'tak', Teamwork:'tak', Positioning:'sav', Concentration:'sav',
  Marking:'sav', Tackling:'sav', Heading:'sav',
  Acceleration:'fiz', Pace:'fiz', Agility:'fiz', Balance:'fiz', Strength:'fiz', Stamina:'fiz', JumpingReach:'fiz', WorkRate:'fiz',
  Handling:'kal', Reflexes:'kal', OneOnOnes:'kal', AerialReach:'kal', CommandOfArea:'kal', Kicking:'kal', RushingOut:'kal',
};
function coachValue(s, cat) {
  const a = s.staffAttrs || {};
  let v = 0;
  for (const [k, w] of Object.entries(cat.w)) v += (a[k] || 0) * w;
  v += (a.Vastberadenheid || 0) + (a.Motiveren || 0);
  return v / 5;
}
const stars = v => clamp(Math.round(v / 4 * 2) / 2, 0.5, 5);

function staffPlan(staff) {
  const coaches = staff.filter(s => TRAINING_JOBS.has(s.jobId));
  const load = new Map();
  const rows = [];
  const order = CATS.map(c => ({ c, best: Math.max(0, ...coaches.map(s => coachValue(s, c))) })).sort((a, b) => b.best - a.best);
  for (const { c } of order) {
    const cand = coaches
      .filter(s => (load.get(s.id) || 0) < (s.jobId === 16 ? 1 : 2))
      .filter(s => c.id === 'kal' ? s.jobId === 34 : s.jobId !== 34)
      .map(s => ({ s, v: coachValue(s, c) })).sort((a, b) => b.v - a.v);
    const pick = cand[0];
    if (pick) load.set(pick.s.id, (load.get(pick.s.id) || 0) + 1);
    rows.push({ cat: c, coach: pick?.s, v: pick?.v || 0, stars: stars(pick?.v || 0) });
  }
  rows.sort((a, b) => CATS.indexOf(a.cat) - CATS.indexOf(b.cat));
  const unused = coaches.filter(s => s.jobId !== 16 && !load.has(s.id));
  const bestVal = s => s.jobId === 34 ? coachValue(s, CATS.find(c => c.id === 'kal')) : Math.max(...CATS.filter(c => !c.lowConf).map(c => coachValue(s, c)));
  const weakCoaches = coaches.filter(s => s.jobId !== 16 && bestVal(s) < 7);
  const byJob = id => staff.filter(s => s.jobId === id);
  const best = (list, k) => list.reduce((m, s) => Math.max(m, s.staffAttrs?.[k] || 0), 0);
  const medical = {
    physio: best([...byJob(12), ...byJob(50)], 'Fysiotherapie'),
    sci: best(byJob(48), 'Sportwetenschap'),
  };
  const hoyd = byJob(64)[0] || null;
  const manager = byJob(16)[0] || null;
  return { rows, unused, weakCoaches, medical, hoyd, manager };
}

// ---- Main analysis ----
function analyse(data, opts) {
  const { useHidden, status, roleChoice = {}, tactic = {} } = opts;
  const L = I18N[opts.lang] || I18N.en, T = L.t;
  const players = data.players.filter(p => p.attrs);
  const res = players.map(p => {
    const bi = bestRole(p, 'IP'), bo = bestRole(p, 'OOP');
    const pg = new Set(groupsOf(p)), tg = tactic[groupsOf(p)[0]] || {};
    const okFor = id => ROLE[id] && ROLE[id].groups.some(g => pg.has(g)) ? ROLE[id] : null;
    const ipR = okFor(roleChoice[p.id]?.ip) || okFor(tg.ip) || bi.r;
    const oopR = okFor(roleChoice[p.id]?.oop) || okFor(tg.oop) || bo.r;
    const fitIp = roleFit(p, ipR), fitOop = roleFit(p, oopR);
    const foc = focusFor(p, ipR, oopR, L);
    const ten = intensityFor(p, useHidden, status, L);
    const trait = traitFor(p, ipR, oopR);
    const g = groupsOf(p)[0] || 'MC';
    return { p, ipR, oopR, fitIp, fitOop, bestIp: bi, bestOop: bo, focus: foc, intensity: ten, trait, group: g, flags: [] };
  });
  // Depth: rank inside the group (CA when hidden data is on, role fit otherwise)
  const strength = x => useHidden ? x.p.ca : x.fitIp;
  const byDepth = {};
  for (const x of res) { const [dg] = DEPTH[x.group] || ['MID', 2]; (byDepth[dg] ||= []).push(x); }
  for (const [dg, list] of Object.entries(byDepth)) {
    list.sort((a, b) => strength(b) - strength(a));
    const n = Object.values(DEPTH).find(d => d[0] === dg)?.[1] || 2;
    list.forEach((x, i) => { x.depthRank = i + 1; x.depthGroup = dg; x.starter = i < n; });
  }
  for (const x of res) {
    const p = x.p;
    if (useHidden) {
      const gap = p.pa - p.ca;
      if (gap <= 5) x.flags.push({ t:'ok', s: T.fCeil, d: T.fCeilD });
      else if (p.age <= 21 && gap >= 40) x.flags.push({ t:'up', s: T.fUp, d: T.fUpD(gap) });
      if (p.age >= 29) x.flags.push({ t:'warn', s: T.fOld, d: T.fOldD });
      if (p.attrs.InjuryProneness >= 14) x.flags.push({ t:'warn', s: T.fInj, d: T.fInjD });
      if (p.professionalism <= 11) x.flags.push({ t:'warn', s: T.fProf, d: T.fProfD });
    }
    if (p.age <= 20 && !x.starter && (!useHidden || p.pa - p.ca >= 25))
      x.flags.push({ t:'loan', s: T.fLoan, d: T.fLoanD(L.depth[x.depthGroup] || x.depthGroup, x.depthRank) });
    if (x.fitIp + 1.2 < x.bestIp.fit && x.bestIp.r.id !== x.ipR.id)
      x.flags.push({ t:'info', s: T.fFit, d: T.fFitD(roleName(x.bestIp.r, L), x.bestIp.fit.toFixed(1), x.fitIp.toFixed(1)) });
    if (x.fitOop + 1.2 < x.bestOop.fit && x.bestOop.r.id !== x.oopR.id)
      x.flags.push({ t:'info', s: T.fFitO, d: T.fFitOD(roleName(x.oopR, L), x.fitOop.toFixed(1), roleName(x.bestOop.r, L), x.bestOop.fit.toFixed(1)) });
  }
  const mentoring = mentorPlan(res, useHidden, L);
  const staff = staffPlan(data.staff || []);
  // Squad needs -> demand per training category
  const demand = {};
  for (const x of res) { const f = x.focus.list[0]; if (f) { const c = ATTR_CAT[f.k]; if (c) demand[c] = (demand[c] || 0) + 1; } }
  return { players: res, mentoring, staff, demand, actions: actionsFor(res, mentoring, staff, demand, opts, L) };
}

function actionsFor(res, mentoring, staff, demand, opts, L) {
  const out = [], T = L.t, A = T.area;
  const add = (lvl, area, s, d) => out.push({ lvl, area, s, d });
  if (opts.status === 'semi' || opts.status === 'amateur') add(2, A.club, T.aStatus, T.aStatusD);
  const gaps = staff.rows.filter(r => (demand[r.cat.id] || 0) > 0).map(r => ({ r, score: (demand[r.cat.id] || 0) * Math.max(0, 4 - r.stars) }))
    .filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 2);
  for (const { r } of gaps) add(3, A.staff, T.aCoach(L.cat[r.cat.id]), T.aCoachD(demand[r.cat.id], r.coach?.name, r.stars, r.cat.lowConf));
  if (staff.medical.physio < 12) add(2, A.medical, T.aPhysio, T.aPhysioD(staff.medical.physio));
  if (staff.medical.sci < 12) add(1, A.medical, T.aSci, T.aSciD(staff.medical.sci));
  if (staff.hoyd && staff.hoyd.ca < 60) add(2, A.youth, T.aHoyd, T.aHoydD(staff.hoyd.name));
  if (mentoring.needVeteran) add(3, A.mentor, T.aVet, T.aVetD);
  const tf = opts.trainingFac, yf = opts.youthFac;
  if (tf != null && tf < 3) add(3, A.fac, T.aTf, T.aTfD(L.fac[tf]));
  if (yf != null && yf < 3) add(2, A.fac, T.aYf, T.aYfD(L.fac[yf]));
  const loans = res.filter(x => x.flags.some(f => f.t === 'loan'));
  if (loans.length) add(2, A.players, T.aLoan(loans.length), T.aLoanD(loans.map(x => x.p.name).join(', ')));
  if (staff.weakCoaches.length) add(1, A.staff, T.aWeak, T.aWeakD(staff.weakCoaches.map(s => s.name).join(', ')));
  return out.sort((a, b) => b.lvl - a.lvl);
}

function mentorPlan(res, useHidden, L) {
  const det = x => x.p.attrs.Determination || 0;
  const mScore = x => det(x) + (useHidden ? (x.p.professionalism - 10) * 0.6 + (x.p.ambition - 10) * 0.2 : 0);
  const influence = x => x.p.age >= 24 ? L.infl.high : x.p.age >= 21 ? L.infl.mid : L.infl.low;
  const bad = res.filter(x => x.p.age >= 21 && (det(x) <= 7 || (useHidden && x.p.professionalism <= 11)));
  const mentors = res.filter(x => x.p.age >= 21 && det(x) >= 13 && (!useHidden || x.p.professionalism >= 15)
      && (!useHidden || x.p.ca >= 45))
    .sort((a, b) => mScore(b) - mScore(a));
  const badSet = new Set(bad);
  const mentees = res.filter(x => x.p.age <= 20 && !mentors.includes(x))
    .sort((a, b) => det(a) - det(b) || (useHidden ? b.p.pa - a.p.pa : a.p.age - b.p.age));
  const groups = mentors.slice(0, 3).map(m => ({ mentor: m, influence: influence(m), mentees: [] }));
  const lineOf = x => ({ GK:'def', DC:'def', DW:'def', WB:'def', DM:'mid', MC:'mid', MW:'mid', AW:'att', AMC:'att', ST:'att' })[x.group];
  for (const me of mentees) {
    if (!groups.length) break;
    const open = groups.filter(g => g.mentees.length < 3);
    if (!open.length) break;
    open.sort((a, b) => (lineOf(b.mentor) === lineOf(me)) - (lineOf(a.mentor) === lineOf(me)) || a.mentees.length - b.mentees.length);
    open[0].mentees.push(me);
  }
  const strong = mentors.filter(m => m.p.age >= 24 && det(m) >= 14);
  const left = mentees.filter(me => !groups.some(g => g.mentees.includes(me)));
  return { groups, bad: [...badSet], needVeteran: strong.length === 0, left };
}

if (typeof module !== 'undefined') module.exports = { analyse, groupsOf, roleName, ROLES, ROLE, CATS, TRAITS, coachValue, stars };
