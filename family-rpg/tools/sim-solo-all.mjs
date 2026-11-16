// 第87回: 全部の 職業の 1人の ダメージ（かかし 3体）。tools/sim-jobs.mjs の solo と 同じ やり方で、段 0〜4・全部を JSON で 出す（docs/plan-balance-r87.md）。node tools/sim-solo-all.mjs [回数] [びょう]
const R = new URL('../', import.meta.url).pathname;
const { Battle } = await import(R + 'public/js/shared/battle.js');
const { JOBS, ALL_JOBS } = await import(R + 'public/js/shared/data/jobs.js');
const { makeRng } = await import(R + 'public/js/shared/rng.js');
const { jobChar } = await import(R + 'tools/sim-jobs.mjs');
const N = Number(process.argv[2] || 12);
const MS = Number(process.argv[3] || 60) * 1000;
const LV = [22, 30, 38, 44, 50], RANK = [5, 5, 6, 6, 7];
function solo(job, lv, Rk, seed) {
  const c = jobChar(job, lv, Rk);
  const b = new Battle({ rng: makeRng(seed), allies: [{ char: c, auto: true, kind: 'support', tactics: 'balanced' }], enemies: ['rockman', 'rockman', 'rockman'], canFlee: false });
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 999999; e.resist = {}; }
  let dmg = 0;
  for (let t = 0; t < MS && !b.over; t += 50) for (const e of b.tick(50)) if (e.t === 'act' && e.id === b.allies[0].id) for (const r of e.results || []) if (r.dmg > 0 && r.dmg < 100000 && b.enemies.some((x) => x.id === r.id)) dmg += r.dmg;
  return dmg;
}
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
const out = [];
for (let t = 0; t < 5; t++) {
  const jobs = ALL_JOBS.filter((j) => (JOBS[j].tier || 0) === t);
  const res = jobs.map((j) => { let s = 0; for (let i = 0; i < N; i++) s += solo(j, LV[t], RANK[t], 100 + i); return [j, s / N]; });
  const m = med(res.map((r) => r[1]));
  for (const [j, d] of res) { const mods = JOBS[j].mods; out.push({ t, id: j, name: JOBS[j].name, family: JOBS[j].family, sum: +Object.values(mods).reduce((a, b) => a + b, 0).toFixed(2), dmg: Math.round(d), pct: Math.round((d / m) * 100) }); }
}
console.log(JSON.stringify(out));
