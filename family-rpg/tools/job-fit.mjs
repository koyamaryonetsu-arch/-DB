// 第87回: 職業ごとに「能力（力・魔力・回復・MP）」と「覚える 技」が 合って いるかを 見る（docs/plan-balance-r87.md）
// つかいかた: node tools/job-fit.mjs
//   その 段の めやすの レベル（基本職 20・上級職 35・超級職 55・伝説 75・幻 90）と 店の 装備で、
//   技 1つ 1つの 強さ（1体に 当てた 時の ダメージの 合計。属性は 見ない・敵の 守りは 自分の 攻撃力の 4わり）を 出す
//   力 … 物理の 技と ふつうの 攻撃に 効く ／ 魔力 … 呪文だけに 効く（技の「thr」から ＋150 までで 1倍 → 2倍。
//     第87回 A班から、味方は その あとも 3分の 1 の 速さで のびて ＋600 で 3倍。そこで 頭打ち。pow-scale.js）／ 回復 … 回復の 技に 効く（同じ 形）
//   さいごに「レベルが 20 上がった 時の いちばん 強い 技の のび」（装備は 2ランク 上。段ごとの まんなかの 職業）も 出す
import { Battle } from '../public/js/shared/battle.js';
import { POW_SPAN, OVER_RATE, OVER_MAX } from '../public/js/shared/pow-scale.js';
import { JOBS, ALL_JOBS } from '../public/js/shared/data/jobs.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { makeRng } from '../public/js/shared/rng.js';
import { computeStats } from '../public/js/shared/stats.js';
import { jobChar } from './sim-jobs.mjs';
import { CLONE_MAX } from '../public/js/shared/battle-phantom-a.js';

const LV = [20, 35, 55, 75, 90], RANK = [4, 6, 8, 10, 12];
const TN = ['基本職', '上級職', '超級職', '伝説', '幻'];
const parts = (e) => (e?.type === 'multi' ? e.parts || [] : e ? [e] : []);
const HEALS = ['heal', 'regen', 'revive', 'reviveAll', 'cure'];
function measure(id, lv, rank) {
  const j = JOBS[id];
  const c = jobChar(id, lv, rank);
  const st = computeStats(c);
  const b = new Battle({ rng: makeRng(1), allies: [{ char: c, auto: true, kind: 'support', tactics: 'balanced' }], enemies: ['rockman'], canFlee: false });
  const tg = b.enemies[0]; tg.resist = {}; const me = b.allies[0];
  tg.dfn = tg.def = Math.round(st.atk * 0.4); tg.hp = tg.maxHp = 9999999;
  const sk = (j.learn || []).map(([l, sid]) => {
    const a = ABILITIES[sid]; const ps = parts(a.effect);
    let e = 0;
    for (const p of ps) {
      // 第87回 C班: かならず 出る 分も 数える（分身を make 人 出して dance 回ずつ・フレア・アローの r85aHits・天候反転の weatherStrike）
      if (p.type === 'phys') e += b.calcPhys(me, tg, { ...p, element: undefined }, 1, 'phys', true).dmg * ((p.hits || 1) + (p.make && p.dance ? p.dance * Math.min(CLONE_MAX, p.make) : 0));
      else if ((p.type === 'magic' || p.type === 'deduce') && Array.isArray(p.base)) e += b.calcMagic(me, tg, { ...p, element: undefined }, 1, true).dmg * (p.hits || p.r85aHits || 1);
      else if (p.type === 'weatherStrike' && Array.isArray(p.base)) e += b.calcMagic(me, tg, { ...p, type: 'magic', element: undefined }, 1, true).dmg;
    }
    // 推理（deduce）も 魔力で うつ 呪文と 同じ（battle.js の magicHit。第87回 B班）
    const spell = ps.filter((p) => (p.type === 'magic' || p.type === 'deduce') && Array.isArray(p.base) && p.stat !== 'heal');
    return {
      lv: l, name: a.name, mp: a.mp || 0, target: a.target, e: Math.round(e),
      phys: ps.some((p) => p.type === 'phys'), magic: spell.length > 0,
      heal: ps.some((p) => HEALS.includes(p.type) || (p.type === 'magic' && p.stat === 'heal')),
      special: ps.some((p) => p.r85aBig || p.rei) || /ギガ・スレイブ/.test(a.name),
      // 頭打ちの 魔力（scaleCap の 技は その きまり。ほかは 頭打ちの あとの のび〈＋OVER_MAX〉にも とどく 所）
      capAt: spell.length ? Math.max(...spell.map((p) => (p.thr ?? 20) + POW_SPAN * (p.scaleCap ?? 1 + OVER_MAX / OVER_RATE))) : 0,
    };
  });
  return { st, sk };
}
const F = { A: [], B: [], C: [], D: [], E: [], G: [], H: [], I: [] };
// レベルが 20 上がった 時の「いちばん 強い 技」の のび（段ごとの 平均。物理の 技・呪文）
const grow = TN.map(() => ({ p: [], m: [] }));
const topOf = (sk, k) => sk.filter((s) => s[k] && !s.special).reduce((a, s) => Math.max(a, s.e), 0);
const cap = [0, 0, 0, 0, 0], spellJobs = [0, 0, 0, 0, 0];
for (const id of ALL_JOBS) {
  const j = JOBS[id], t = j.tier || 0, m = j.mods;
  const { st, sk } = measure(id, LV[t], RANK[t]);
  const up = measure(id, LV[t] + 20, RANK[t] + 2).sk;
  for (const [k, g] of [['phys', 'p'], ['magic', 'm']]) { const a = topOf(sk, k); if (a > 0) grow[t][g].push(topOf(up, k) / a); }
  const tag = `${j.name}（${TN[t]}）`;
  const nP = sk.filter((s) => s.phys).length, nM = sk.filter((s) => s.magic).length, nH = sk.filter((s) => s.heal).length;
  // 魔剣士は 魔法剣（呪文を 剣に のせる。魔力を 使う）が 本職の 道（魔法戦士）に あるので、魔力を のこす（第87回 B班）
  if (m.mag >= 1.2 && nM === 0) F.A.push(`${tag} 魔力 ${m.mag}・力 ${m.str}（物理の 技 ${nP}・呪文 0）${id === 'magic_swordsman' ? '…魔法剣で 魔力を 使う ので このまま' : ''}`);
  if (m.str >= 1.2 && nP === 0) F.B.push(`${tag} 力 ${m.str}・魔力 ${m.mag}（呪文 ${nM}・物理の 技 0）`);
  if (m.heal >= 1.2 && nH === 0) F.C.push(`${tag} 回復 ${m.heal}（回復の 技 0）`);
  if (nM >= 2 && m.mag < 1) F.D.push(`${tag} 魔力 ${m.mag}（呪文 ${nM}）`);
  if (nP >= 3 && m.str < 1) F.E.push(`${tag} 力 ${m.str}（物理の 技 ${nP}）`);
  const costs = sk.filter((s) => s.mp > 0).map((s) => s.mp);
  if (costs.length && st.maxMp / Math.max(...costs) < 3) F.G.push(`${tag} MP ${st.maxMp}（倍率 ${m.mp}）・いちばん 高い 技 MP ${Math.max(...costs)} ＝ ${(st.maxMp / Math.max(...costs)).toFixed(1)}回`);
  const sig = sk.at(-1);
  if (sig && sig.e > 0 && !sig.special) {
    const ear = sk.slice(0, -1).filter((s) => s.e > sig.e * 1.1 && !s.special && (s.target === 'enemy') === (sig.target === 'enemy'));
    if (ear.length) { const e = ear.reduce((a, b2) => (b2.e > a.e ? b2 : a)); F.H.push(`${tag} 看板「${sig.name}」${sig.e}（MP ${sig.mp}）＜「${e.name}」${e.e}（Lv${e.lv}・MP ${e.mp}）${(e.e / sig.e).toFixed(1)}倍`); }
  }
  const spells = sk.filter((s) => s.magic);
  if (spells.length) {
    spellJobs[t]++;
    const top = spells.reduce((a, b2) => (b2.e > a.e ? b2 : a));
    if (st.mag >= top.capAt) { cap[t]++; F.I.push(`${tag} 魔力 ${st.mag}・いちばん 強い 呪文の 頭打ち ${top.capAt}`); }
  }
}
const T = {
  A: '魔力が 高い（1.2 いじょう）のに、呪文が 1つも ない（魔力が むだ）',
  B: '力が 高い（1.2 いじょう）のに、物理の 技が 1つも ない（力は ふつうの 攻撃だけ）',
  C: '回復が 高い（1.2 いじょう）のに、回復の 技が 1つも ない',
  D: '呪文が 2つ いじょう あるのに、魔力が ひくい（1.0 未満）',
  E: '物理の 技が 3つ いじょう あるのに、力が ひくい（1.0 未満）',
  G: 'MP が 少なくて、いちばん 高い 技を 3回 うてない',
  H: '1体が 相手の 時、看板の 技（さいごに 覚える 技）より 強い 技を 先に 覚える',
  I: '魔力が もう 頭打ち（これより 魔力が 上がっても 呪文は 強く ならない）',
};
for (const k of Object.keys(F)) { console.log(`■ ${T[k]}: ${F[k].length}こ`); for (const s of F[k]) console.log('  ' + s); }
console.log('■ 呪文を 持つ 職業の うち、めやすの レベルで もう 頭打ちの 数: ' + TN.map((n, i) => `${n} ${cap[i]}/${spellJobs[i]}`).join('・'));
const avg = (a) => { if (!a.length) return '-'; const s = [...a].sort((x, y) => x - y); return s[s.length >> 1].toFixed(2) + '倍'; };
console.log('■ レベルが 20 上がった 時の いちばん 強い 技の のび（段ごとの まんなか。物理の 技／呪文）: ' + TN.map((n, i) => `${n} ${avg(grow[i].p)}／${avg(grow[i].m)}`).join('・'));
