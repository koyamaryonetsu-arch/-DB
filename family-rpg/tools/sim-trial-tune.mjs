// 第38回 B: 師しょうのまぼろしの 職業ごとの ダメージの ちょうせい（battle-trial.js の PHANTOM_ADJ）を さがす
// つかいかた: node tools/sim-trial-tune.mjs [回数] [めあての 勝ち] [職業,…]
//   職業ごと・試練ごとに、完全オートの 勝ちが めあて（ふつう 0.75）に 近く なる 倍率を 2分さがしで さがして、表の 形で 出す
import { SUPER_ORDER, LEGEND_ORDER } from '../public/js/shared/data/jobs.js';
import { TRIALS } from '../public/js/shared/data/job-trials.js';
import { PHANTOM_ADJ } from '../public/js/shared/battle-trial.js';
import { trialFight } from './sim-trial.mjs';

const N = Number(process.argv[2] || 10);
const GOAL = Number(process.argv[3] || 0.75);
const JOBS_ = process.argv[4] ? process.argv[4].split(',') : [...SUPER_ORDER, ...LEGEND_ORDER];
const LO = Number(process.env.LO || 0.3), HI = Number(process.env.HI || 3);
const SEED = Number(process.env.SEED || 500);

function rate(job, n, f) {
  const cur = PHANTOM_ADJ[job] || [1, 1];
  PHANTOM_ADJ[job] = cur.map((x, i) => (i === n - 1 ? f : x));
  let w = 0;
  for (let i = 0; i < N; i++) if (trialFight(job, n, SEED + i).outcome === 'win') w++;
  return w / N;
}

const out = {};
for (const job of JOBS_) {
  const fs = [];
  for (const T of TRIALS) {
    // 勝ちは 倍率が 上がるほど へる（だいたい）。log の 2分さがし
    let lo = Math.log(LO), hi = Math.log(HI);
    if (rate(job, T.n, HI) >= GOAL) { fs.push(HI); continue; }
    if (rate(job, T.n, LO) < GOAL) { fs.push(LO); continue; }
    for (let k = 0; k < 7; k++) {
      const mid = (lo + hi) / 2;
      if (rate(job, T.n, Math.exp(mid)) >= GOAL) lo = mid;
      else hi = mid;
    }
    fs.push(Math.round(Math.exp(lo) * 100) / 100);
    PHANTOM_ADJ[job] = [...(PHANTOM_ADJ[job] || [1, 1])];
    PHANTOM_ADJ[job][T.n - 1] = fs[fs.length - 1];
  }
  out[job] = fs;
  console.log(`  ${job}: [${fs.join(', ')}],`);
}
