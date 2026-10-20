// 第38回 B: 職業の試練の「師しょうのまぼろし」の 強さを 見る（docs/plan-r38.md の B）
// つかいかた: node tools/sim-trial.mjs [回数] [試練(1|2)] [職業,…]   LOG=1 … 1回だけ ようすを 出す
//   パーティー: 試練を 受ける 人（その 職業・職業Lv10〈一〉/Lv15〈二〉・その ころの 店の いちばん よい 装備）＋
//     仲間 3人（大賢者・ゴッドハンド・大神官。一は ガイアイーターの あと〈sim-gaia.mjs の ★装備〉・二は 大地の神殿の あと〈sim-nocto1.mjs〉）
//   めやす: 一の試練 Lv50・二の試練 Lv58 で、完全オート（ふつうの オート）の 勝ちが 6〜9割。職業で 大きく ちがわない こと
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { fullHeal, gainJobBattles } from '../public/js/shared/stats.js';
import { JOBS, SUPER_ORDER, LEGEND_ORDER, jobBattlesForLevel } from '../public/js/shared/data/jobs.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { TRIALS } from '../public/js/shared/data/job-trials.js';
import { setupTrialPhantom } from '../public/js/shared/battle-trial.js';
import { jobChar } from './sim-jobs.mjs';
import { gaiaParty } from './sim-gaia.mjs';
import { nocto1Party } from './sim-nocto1.mjs';

const N = Number(process.argv[2] || 20);
const ONLY_N = process.argv[3] ? Number(process.argv[3]) : null;
const ONLY_JOBS = process.argv[4] ? process.argv[4].split(',') : null;

// 試練 n の パーティー（1人目が 試練を 受ける 人）
export function trialParty(job, n, lv = TRIALS[n - 1].lv) {
  const me = jobChar(job, lv, n === 1 ? 8 : 9, 'me');
  const jl = n === 1 ? 10 : 15;
  me.jobs[job] = { lv: jl, b: jobBattlesForLevel(jl, JOBS[job].tier), tr: n - 1 };
  fullHeal(me);
  const mates = (n === 1 ? gaiaParty(lv, true) : nocto1Party(lv, true)).filter((c) => c.job !== 'hero').slice(0, 3);
  return [me, ...mates];
}

export function trialFight(job, n, seed, { lv, log = false } = {}) {
  const party = trialParty(job, n, lv);
  const enc = FIXED_ENCOUNTERS[TRIALS[n - 1].enc];
  const b = new Battle({
    rng: makeRng(seed), boss: true, canFlee: false,
    allies: party.map((c) => ({ char: c, kind: 'support', controller: 'sim', auto: true, tactics: 'balanced' })),
    enemies: enc.group.flatMap(([sp, k]) => Array(k).fill(sp)),
  });
  setupTrialPhantom(b, { job, n, who: party[0] });
  const used = {};
  let real = 0;
  while (!b.over && real < 30 * 60 * 1000) {
    const evs = b.tick(50);
    real += 50;
    for (const ev of evs) {
      if (log && (ev.t === 'act' || ev.t === 'msg')) console.log('  ' + (ev.lines || []).join(' / '));
      if (ev.t === 'act' && ev.ability && b.get(ev.id)?.side === 'enemy') used[ev.ability] = (used[ev.ability] || 0) + 1;
    }
  }
  const ph = b.enemies[0];
  return { outcome: b.result?.outcome || 'timeout', seconds: real / 1000, left: ph ? ph.hp / ph.maxHp : 0, used, deaths: b.allies.filter((a) => !a.alive).length };
}

const pct = (x) => `${String(Math.round(x * 100)).padStart(3)}%`;
if (process.argv[1] && process.argv[1].endsWith('sim-trial.mjs')) {
  const jobs = ONLY_JOBS || [...SUPER_ORDER, ...LEGEND_ORDER];
  if (process.env.LOG) {
    const r = trialFight(jobs[0], ONLY_N || 1, 1, { log: true });
    console.log(r);
  } else {
    for (const n of ONLY_N ? [ONLY_N] : TRIALS.map((T) => T.n)) {
      const all = [];
      console.log(`■ ${TRIALS[n - 1].name}（Lv${TRIALS[n - 1].lv}・${N}回・完全オート）`);
      for (const job of jobs) {
        const res = [];
        for (let i = 0; i < N; i++) res.push(trialFight(job, n, 1000 + i));
        const w = res.filter((r) => r.outcome === 'win').length / N;
        all.push(w);
        const sec = res.reduce((s, r) => s + r.seconds, 0) / N;
        const used = {};
        for (const r of res) for (const [k, v] of Object.entries(r.used)) used[k] = (used[k] || 0) + v;
        const top = Object.entries(used).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k}×${(v / N).toFixed(1)}`).join(' ');
        console.log(`  ${JOBS[job].name.padEnd(14, '　')} 勝ち${pct(w)}  平均${sec.toFixed(0).padStart(4)}秒  たおれた${(res.reduce((s, r) => s + r.deaths, 0) / N).toFixed(1)}人  技: ${top}`);
      }
      console.log(`  → 平均 ${pct(all.reduce((s, x) => s + x, 0) / all.length)}  いちばん下 ${pct(Math.min(...all))}  いちばん上 ${pct(Math.max(...all))}`);
    }
  }
}
