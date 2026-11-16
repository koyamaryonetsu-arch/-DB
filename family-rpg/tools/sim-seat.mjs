// 第87回: 第2部の ボスで、家族の 1人（SLOT の 席）を べつの 職業に 入れかえて 勝率と 長さを 見る（知って いる 人。docs/plan-balance-r87.md）
//   node tools/sim-seat.mjs [回数] [ボス,…] [職業,…]   SLOT=0 勇者の 席 / 1 大賢者の 席 / 2 ゴッドハンドの 席 / 3 大神官の 席・LVD=10 … レベルを 10 下げる（弱い パーティー）
const R = new URL('../', import.meta.url).pathname;
const { CH6_JOBS } = await import(R + 'tools/sim-ch6.mjs');
const { ch7Run, CH7_LV, CH7_KIT } = await import(R + 'tools/sim-ch7.mjs');
const { ch8Run, CH8_LV, CH8_KIT } = await import(R + 'tools/sim-ch8.mjs');
const { canEquip } = await import(R + 'public/js/shared/stats.js');
const { JOBS } = await import(R + 'public/js/shared/data/jobs.js');
const N = Number(process.argv[2] || 10);
const BOSSES = (process.argv[3] || 'temple,witch,shadow,jafar,hades,bowser').split(',');
const LIST = process.argv[4].split(',');
const SLOT = Number(process.env.SLOT || 0);
const ORIG = CH6_JOBS.map((x) => [...x]);
const C7 = new Set(Object.keys(CH7_LV));
const out = [];
for (const job of LIST) {
  let w = 0, n = 0, sec = 0; const per = {};
  for (const boss of BOSSES) {
    const ch7 = C7.has(boss); const KIT = ch7 ? CH7_KIT : CH8_KIT; const lv = (ch7 ? CH7_LV : CH8_LV)[boss] - Number(process.env.LVD || 0);
    if (job !== ORIG[SLOT][0]) KIT[boss][job] = KIT[boss][job] || KIT[boss][ORIG[SLOT][0]].map((id) => (id && canEquip(job, id) ? id : null));
    CH6_JOBS[SLOT] = [job, ORIG[SLOT][1]];
    let bw = 0, bs = 0;
    for (let s = 1; s <= N; s++) { const r = (ch7 ? ch7Run : ch8Run)(boss, lv, true, 1000 + s); if (r.outcome === 'win') bw++; bs += r.seconds; }
    CH6_JOBS[SLOT] = [...ORIG[SLOT]];
    per[boss] = [Math.round((bw / N) * 100), Math.round(bs / N)];
    w += bw; n += N; sec += bs / N;
  }
  const row = { slot: SLOT, id: job, name: JOBS[job].name, t: JOBS[job].tier || 0, family: JOBS[job].family, win: Math.round((w / n) * 100), sec: Math.round(sec / BOSSES.length), per };
  out.push(row); console.error(JSON.stringify(row));
}
console.log(JSON.stringify(out));
