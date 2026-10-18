// Zero-dependency tests: npm test
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), path = require('path'), vm = require('vm');

// Load i18n + engine into one context, the same way the bundle does
const ctx = { module: { exports: {} }, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'i18n.js'), 'utf8') + '\n' +
  fs.readFileSync(path.join(__dirname, '..', 'src', 'engine.js'), 'utf8') + '\nmodule.exports.I18N = I18N;', ctx);
const E = ctx.module.exports;

const ATTRS = Object.keys(E.I18N.en.attr).concat(['InjuryProneness', 'Consistency', 'ImportantMatches', 'Versatility', 'Dirtiness', 'Eccentricity']);
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const player = (id, age, posArr, over = {}) => {
  const attrs = Object.fromEntries(ATTRS.map(k => [k, 4 + Math.floor(rnd() * 10)]));
  return { id, name: 'Player ' + id, age, pos: posArr.join(', '), posArr, ca: 60 + id, pa: 120, professionalism: 15, ambition: 14, attrs: Object.assign(attrs, over) };
};
const coach = (id, jobId, a) => ({ id, name: 'Coach ' + id, job: 'Coach', jobId, ca: 80, staffAttrs: Object.assign({ Vastberadenheid: 12, Motiveren: 10 }, a) });
const data = {
  meta: { myClub: 'Test FC' },
  players: [
    player(1, 17, ['GK'], { FirstTouch: 3, Passing: 5, Kicking: 12, Reflexes: 14 }),
    player(2, 17, ['AMC'], { Passing: 3, Vision: 5, Technique: 13 }),
    player(3, 18, ['ST']), player(4, 26, ['DC'], { Determination: 16 }), player(5, 31, ['MC']),
    player(6, 17, ['AML', 'AMR'], { Strength: 2 }), player(7, 22, ['DL']), player(8, 19, ['DM']),
  ],
  staff: [coach(100, 2, { Technisch: 15, Balbezit: 12 }), coach(101, 26, { Fitheid: 14 }), coach(102, 2, { Aanvallen: 6 }), { id: 103, name: 'Physio', jobId: 12, staffAttrs: { Fysiotherapie: 8 } }],
};

for (const lang of ['en', 'tr']) {
  test(`analyse runs and returns text for ${lang}`, () => {
    const r = E.analyse(data, { lang, useHidden: true, status: 'semi', trainingFac: 2, youthFac: 3 });
    assert.equal(r.players.length, data.players.length);
    for (const x of r.players) {
      assert.ok(x.ipR && x.oopR, 'roles picked');
      assert.equal(x.ipR.phase, 'IP'); assert.equal(x.oopR.phase, 'OOP');
      assert.ok(typeof x.intensity.v === 'string' && x.intensity.why);
      for (const f of x.flags) assert.ok(typeof f.s === 'string' && typeof f.d === 'string', 'flag text is a string');
    }
    assert.ok(r.actions.length > 0);
    for (const a of r.actions) assert.ok(typeof a.s === 'string' && typeof a.d === 'string' && !a.s.includes('undefined') && !a.d.includes('undefined'));
  });
}

test('tactic roles apply to every player of that position', () => {
  const r = E.analyse(data, { lang: 'en', useHidden: false, tactic: { GK: { ip: 'bpgk', oop: 'swk' } } });
  const gk = r.players.find(x => x.group === 'GK');
  assert.equal(gk.ipR.id, 'bpgk'); assert.equal(gk.oopR.id, 'swk');
  assert.equal(gk.focus.list[0].k, 'FirstTouch', 'weakest key attribute for a ball-playing keeper');
});

test('a role from the wrong position is ignored', () => {
  const r = E.analyse(data, { lang: 'en', useHidden: false, roleChoice: { 1: { ip: 'poa' } } });
  assert.notEqual(r.players.find(x => x.p.id === 1).ipR.id, 'poa');
});

test('strength is not pushed as focus for teenagers', () => {
  const r = E.analyse(data, { lang: 'en', useHidden: false, roleChoice: { 6: { ip: 'wf' } } });
  const x = r.players.find(x => x.p.id === 6);
  assert.notEqual(x.focus.list[0]?.k, 'Strength');
});

test('hidden data off: no PA based flags', () => {
  const r = E.analyse(data, { lang: 'en', useHidden: false });
  assert.ok(!r.players.some(x => x.flags.some(f => f.t === 'up' || f.t === 'ok')));
});

test('both languages define the same keys', () => {
  const keys = o => Object.keys(o).sort().join(',');
  const { en, tr } = E.I18N;
  for (const k of ['attr', 'group', 'depth', 'cat', 'infl', 'intensity', 't', 'ui']) assert.equal(keys(tr[k]), keys(en[k]), k);
  assert.equal(tr.fac.length, en.fac.length);
  for (const t of E.TRAITS) assert.ok(tr.traitTr[t.n], 'Turkish trait name for ' + t.n);
  for (const r of E.ROLES) assert.ok(tr.role[r.id], 'Turkish role name for ' + r.id);
});
