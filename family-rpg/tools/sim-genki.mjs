// 第72回: 元気玉の 倍率を きめる（みんなの HPを 10%ずつ 集めて、集めた HP × 倍率の ダメージ）
// つかいかた: node tools/sim-genki.mjs [守備力=240]
//   Lv60・70・80 の 4人（スーパーサイヤ人3・ロトの勇者・ネオ・クイーン・セレニティ・千年の大魔法使い。店の いちばん よい 装備）で
//   HP満タン・HP半分の ときの 元気玉の ダメージ（1体）と、伝説・幻の職業（その 職業の 人が 使う）の 全体攻撃の いちばん 強い ものを くらべる
//   敵は 守備力 DFN（Lv70 ごろの 魔物は 200〜270）・耐性なし。物理の 連げき（ランダム）は 半分（1体に あたる ぶん）で 数える
import { jobChar } from './sim-jobs.mjs';
import { Battle } from '../public/js/shared/battle.js';
import { JOBS, ALL_JOBS } from '../public/js/shared/data/jobs.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { penaltyFor } from '../public/js/shared/stats.js';
import { makeRng } from '../public/js/shared/rng.js';
import { genkiTotal, genkiDamage } from '../public/js/shared/battle-genki.js';

const DFN = Number(process.argv[2] || 240);
const PARTY = ['ss3', 'loto_hero', 'neo_queen', 'sennen_mage'];
const foe = (b) => {
  const t = b.enemies[0];
  t.resist = {};
  t.dfn = DFN;
  return t;
};

// その 職業の 全体攻撃の いちばん 強い もの（ダメージ・技の 名前）
function bestAll(job, lv, R) {
  const c = jobChar(job, lv, R, 'x');
  const b = new Battle({ rng: makeRng(1), allies: [{ char: c, controller: 's1' }], enemies: ['rockman'], canFlee: false });
  const me = b.allies[0], t = foe(b);
  let best = [0, ''];
  for (const [, id] of JOBS[job].learn || []) {
    const a = ABILITIES[id];
    if (!a || a.target !== 'enemies' || !a.effect) continue;
    const e = a.effect, pm = penaltyFor(c, id).powMult;
    let d = 0;
    if (e.type === 'phys') d = b.calcPhys(me, t, e, pm, e.element || 'phys', true).dmg * (e.hits > 1 ? e.hits : 1) / (e.random ? 2 : 1);
    else if (e.type === 'magic') d = b.calcMagic(me, t, e, pm, true).dmg;
    if (d > best[0]) best = [Math.round(d), a.name];
  }
  return best;
}

for (const [lv, R] of [[60, 9], [70, 10], [80, 10]]) {
  const chars = PARTY.map((j, i) => jobChar(j, lv, R, `p${i}`));
  const b = new Battle({ rng: makeRng(1), allies: chars.map((char, i) => ({ char, controller: i ? undefined : 's1', auto: !!i })), enemies: ['rockman'], canFlee: false });
  const t = foe(b), me = b.allies[0];
  const pm = penaltyFor(chars[0], 's3_genki').powMult;
  const eff = ABILITIES.s3_genki.effect;
  const hps = b.allies.map((x) => x.maxHp);
  const full = genkiTotal(hps), half = genkiTotal(hps.map((h) => Math.floor(h / 2)));
  const dFull = genkiDamage(b, me, t, eff, full, pm, true).dmg;
  const dHalf = genkiDamage(b, me, t, eff, half, pm, true).dmg;
  const tops = ALL_JOBS.filter((j) => (JOBS[j].tier || 0) >= 3).map((j) => [j, ...bestAll(j, lv, R)]).sort((x, y) => y[1] - x[1]);
  const [tj, td, tn] = tops[0];
  const t3 = tops.find(([j]) => JOBS[j].tier === 3);
  console.log(`Lv${lv}（装備ランク${R}・守備力${DFN}） HP ${hps.join('/')}（合計${hps.reduce((s, h) => s + h, 0)}）`);
  console.log(`  元気玉: 満タン 集めたHP${full} → ${dFull}（×${(eff.mult * pm).toFixed(2)}） / HP半分 集めたHP${half} → ${dHalf}`);
  console.log(`  いちばん強い全体攻撃: ${JOBS[tj].name}の${tn} ${td}（元気玉は ${(dFull / td).toFixed(2)}倍） / 伝説: ${JOBS[t3[0]].name}の${t3[2]} ${t3[1]}（${(dFull / t3[1]).toFixed(2)}倍）`);
  const ss = tops.find(([j]) => j === 'ss3');
  console.log(`  スーパーサイヤ人3の ほかの 全体攻撃: ${ss[2]} ${ss[1]}`);
}
