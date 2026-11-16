// 第87回: ボス戦で 与えた ダメージの うち、合体技が 何わりか（docs/plan-balance-r87.md）。node tools/sim-dual-share.mjs [回数] [base,席:職業,…]
const R = new URL('../', import.meta.url).pathname;
const { CH6_JOBS } = await import(R + 'tools/sim-ch6.mjs');
const { ch7Run, CH7_LV, CH7_KIT } = await import(R + 'tools/sim-ch7.mjs');
const { ch8Run, CH8_LV, CH8_KIT } = await import(R + 'tools/sim-ch8.mjs');
const { canEquip } = await import(R + 'public/js/shared/stats.js');
const { Battle } = await import(R + 'public/js/shared/battle.js');
const { JOBS } = await import(R + 'public/js/shared/data/jobs.js');
let dual = 0, solo = 0, nd = 0; const names = {};
const emit = Battle.prototype.emit;
Battle.prototype.emit = function (ev) {
  if (ev.t === 'act' && this.get(ev.id)?.side === 'ally') {
    let d = 0; for (const r of ev.results || []) if (r.dmg > 0 && this.get(r.id)?.side === 'enemy') d += r.dmg;
    if (ev.dual) { dual += d; nd++; names[ev.dual.name] = (names[ev.dual.name] || 0) + 1; } else solo += d;
  }
  return emit.call(this, ev);
};
const N = Number(process.argv[2] || 6);
const ORIG = CH6_JOBS.map((x) => [...x]);
const C7 = new Set(Object.keys(CH7_LV));
for (const spec of (process.argv[3] || 'base').split(',')) {
  dual = 0; solo = 0; nd = 0; for (const k of Object.keys(names)) delete names[k];
  let w = 0, n = 0;
  const [slot, job] = spec === 'base' ? [0, 'hero'] : spec.split(':').map((x, i) => (i ? x : Number(x)));
  for (const boss of ['temple', 'witch', 'shadow', 'jafar', 'hades', 'bowser']) {
    const ch7 = C7.has(boss); const KIT = ch7 ? CH7_KIT : CH8_KIT; const lv = (ch7 ? CH7_LV : CH8_LV)[boss];
    if (job !== ORIG[slot][0]) KIT[boss][job] = KIT[boss][job] || KIT[boss][ORIG[slot][0]].map((id) => (id && canEquip(job, id) ? id : null));
    CH6_JOBS[slot] = [job, ORIG[slot][1]];
    for (let s = 1; s <= N; s++) { const r = (ch7 ? ch7Run : ch8Run)(boss, lv, true, 1000 + s); if (r.outcome === 'win') w++; n++; }
    CH6_JOBS[slot] = [...ORIG[slot]];
  }
  const top = Object.entries(names).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k}×${(v / n).toFixed(1)}`).join(' ');
  console.log(`${spec} ${JOBS[job].name}: 勝率 ${Math.round((w / n) * 100)}%  合体技の わりあい ${Math.round((dual / (dual + solo)) * 100)}%  1戦に ${(nd / n).toFixed(1)}回  ${top}`);
}
