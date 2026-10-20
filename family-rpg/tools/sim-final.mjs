// 第5章 Step 9: ノクト（本気）と 魔王ソリトゥス（3つの 段階）の 強さを 見る
// つかいかた: node tools/sim-final.mjs [回数] [lv,…] [nocto|solitus|both]   LOG=1 … 1回だけ ようすを 出す（KNOW=1 で 知っている 人・BOSS=solitus）
//   めやす（家族が 決めた。docs/plan-ch5.md の 17）: 超級職 4人（勇者・大賢者・ゴッドハンド・大神官。職業Lv10・Lv55）・
//   ランク9の 店（ハネノ）＋ その ころの ★装備（大地の神殿の 宝箱・みんなが くれる 品・ノクト〈1回目〉の 品。ソリトゥスは ノクト〈本気〉の 品も）で
//     完全オート（ふつうの オート）… 勝率 1〜2割
//       （ふつうの オートも、ひとりの 仲間には 回復の あとで「よびかける」・きずな技の ゲージが たまったら 使う。battle-final.js）
//     知っている 人 … 7割くらい
//       ノクト（本気）: 影を 先に たおす・前ぶれで 身を 守る・手を のばす・まねられた 人は 攻撃しない（ノクトの影・1回目と おなじ）・合体技
//       ソリトゥス: よびかけるを 先に・きずなを食べる／終わらない夜の 前ぶれで 身を 守る・合体技（きずなを食べるの 前ぶれの 間は しない）
//   影の城の 宝箱（B8）・まぼろしの 品は 同時に 作っているので まだ 入れていない（入ると 少し 楽に なる）
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { fullHeal, computeStats, canEquip } from '../public/js/shared/stats.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { DUAL_TECHS } from '../public/js/shared/data/dual.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { COMBO, clonesOf } from '../public/js/shared/battle-earth.js';
import { BOND_BREAK } from '../public/js/shared/battle-nocto.js';
import { NOCTO2, SOLITUS, EAT, NIGHT, SHARD_FLAGS, LETTER_FLAG } from '../public/js/shared/battle-final.js';
import { jobChar } from './sim-jobs.mjs';

const N = Number(process.argv[2] || 40);
const LVS = process.argv[3] ? process.argv[3].split(',').map(Number) : [54, 55, 56];
const WHICH = process.argv[4] || 'both';
// 調整用（データを かえる 前に ためす）
for (const [sp, key] of [[NOCTO2, 'N2'], [SOLITUS, 'SL']]) {
  const m = MONSTERS[sp];
  if (process.env[`${key}HP`]) m.hp = Number(process.env[`${key}HP`]);
  if (process.env[`${key}STR`]) m.str = Number(process.env[`${key}STR`]);
  if (process.env[`${key}MAG`]) m.mag = Number(process.env[`${key}MAG`]);
  if (process.env[`${key}SPD`]) m.speed = Number(process.env[`${key}SPD`]);
  if (process.env[`${key}TURNS`]) m.turns = Number(process.env[`${key}TURNS`]);
}
if (process.env.EATK) MONSTERS[SOLITUS].solitus.eat.mult = Number(process.env.EATK);
if (process.env.BONDK) MONSTERS[SOLITUS].solitus.bond.k = Number(process.env.BONDK);
if (process.env.BONDMP) MONSTERS[SOLITUS].solitus.bond.mp = Number(process.env.BONDMP);
if (process.env.P2) MONSTERS[SOLITUS].solitus.p2 = Number(process.env.P2);
if (process.env.P3) MONSTERS[SOLITUS].solitus.p3 = Number(process.env.P3);
if (process.env.EATEV) MONSTERS[SOLITUS].solitus.eat.every = Number(process.env.EATEV);
if (process.env.NIGHTEV) MONSTERS[SOLITUS].solitus.night.every = Number(process.env.NIGHTEV);
if (process.env.BONDCAP) MONSTERS[SOLITUS].solitus.bond.cap = Number(process.env.BONDCAP);
if (process.env.BONDPA) MONSTERS[SOLITUS].solitus.bond.perAct = Number(process.env.BONDPA);
if (process.env.EATCAP) MONSTERS[SOLITUS].solitus.eat.healCap = Number(process.env.EATCAP);
if (process.env.NIGHTB) MONSTERS[SOLITUS].solitus.night.base = process.env.NIGHTB.split(",").map(Number);
if (process.env.HURT) MONSTERS[SOLITUS].solitus.alone.hurt = Number(process.env.HURT);
if (process.env.N2COMBO) MONSTERS[NOCTO2].nocto1.combo.mult = Number(process.env.N2COMBO);
if (process.env.N2BOND) MONSTERS[NOCTO2].nocto.bond.mult = Number(process.env.N2BOND);

// 超級職 4人
export const FINAL_JOBS = [['hero', '勇者'], ['daikenja', '大賢者'], ['god_hand', 'ゴッドハンド'], ['high_priest', '大神官']];
// その ころの ★装備（[武器, よろい, たて, 頭, アクセ]。null は ランク9の 店〈ハネノ〉の いちばん よい 品）
//   大地の神殿の 宝箱（EARTH_TREASURE）・みんなが くれる 品（GATHER_GIFTS）・ノクト（1回目）の 品・それまでの ★
export const FINAL_KIT = {
  hero: ['et_earth_sword', 'et_bedrock_mail', 'et_keeper_shield', 'valkyrie_helm', 'gift_royal_charm'],
  daikenja: ['et_spring_staff', 'et_spring_robe', null, 'et_earth_crown', 'nocto_earth_charm'],
  god_hand: ['et_moss_claw', 'et_earth_gi', null, 'et_tree_hat', 'gaia_fang_charm'],
  high_priest: ['gift_miko_staff', 'gift_sandwind_cape', 'atlas_shield', 'mem_star_crown', 'argos_pendant'],
};
// ソリトゥスの 前: ノクト（本気）の 品も（ふたつの紋章のお守り。夜のとばりの剣は 大地の剣より 弱いので 使わない）
export const SOLITUS_KIT = { ...FINAL_KIT, god_hand: [...FINAL_KIT.god_hand.slice(0, 4), 'nocto2_twin_charm'] };
const SLOTS = ['weapon', 'armor', 'shield', 'head', 'acc'];
export function finalParty(lv, boss = NOCTO2, kit = true) {
  const K = boss === SOLITUS ? SOLITUS_KIT : FINAL_KIT;
  return FINAL_JOBS.map(([job, name]) => {
    const c = jobChar(job, lv, 9, name);
    const k = kit ? K[job] : [];
    SLOTS.forEach((sl, i) => {
      if (!k[i]) return;
      if (!ITEMS[k[i]]) throw new Error(k[i]);
      if (!canEquip(job, k[i])) throw new Error(`${job} can't equip ${k[i]}`);
      c.equip[sl] = k[i];
    });
    fullHeal(c);
    return c;
  });
}
const group = (boss) => FIXED_ENCOUNTERS[boss].group.flatMap(([sp, n]) => Array(n).fill(sp));

// 合体技を えらぶ（知っている 人）: ダメージの 合体技。仲間の HPが へっている・大技の 前ぶれ・MPが のこり 少なく なる ときは 使わない
const hurts = (t) => t.parts.some((p) => p.type === 'power');
const allFoes = (t) => ['enemies', 'group'].includes(t.target);
function dualPlan(b, a) {
  const boss = b.aliveEnemies().find((e) => e.species === NOCTO2 || e.species === SOLITUS);
  if (!boss || [COMBO, BOND_BREAK, EAT, NIGHT].includes(boss.telegraph)) return false;
  if (b.aliveAllies().some((x) => x.hp < x.maxHp * 0.55 || x.status?.rift) || b.allies.some((x) => !x.alive && !x.fled)) return false;
  const cl = boss.species === NOCTO2 ? clonesOf(b, boss) : [];
  const opts = b.dualOptionsFor(a, null, false, true).filter((o) => {
    const t = DUAL_TECHS[o.id];
    if (!hurts(t)) return false;
    const ms = [a, ...o.partners.map((id) => b.get(id))];
    // まねられた 人は 入れない（合体技は そのまま 当たるが、まねられた 人は 回復・補助へ）
    if (o.size >= 3 && ms.slice(1).some((m) => !m.ready && !m.queued && m.atb < 50)) return false;
    return ms.every((m, i) => m.mp - o.mp[i] >= m.maxMp * 0.2);
  });
  const rank = (o) => (cl.length && allFoes(DUAL_TECHS[o.id]) ? 5 : o.id === 'dt_minadein' ? 3 : o.size >= 4 ? 2 : o.size);
  const best = opts.sort((x, y) => rank(y) - rank(x))[0];
  if (!best) return false;
  const target = cl.length ? cl.sort((x, y) => x.hp - y.hp)[0] : boss;
  const r = b.command(a.id, { type: 'dual', id: best.id, partner: best.partner, partners: best.partners, target: target.id }, 'sim');
  return r.ok;
}

// know … 知っている 人 / 知らない 人 … ふつうの オート（家族が「オート」に した ときと おなじ）
// skip … 知っている 人の しかけを 1つ はずす（nocto: 'clone'・'guard'・'reach'・'mimic'・'dual' / solitus: 'call'・'guard'・'bond'・'dual'）
// heart … 思い出の かけら・手紙（ノクトの ことば）
export function finalRun(boss, lv, know, seed, { log = false, kit = true, skip = null, heart = false } = {}) {
  const party = finalParty(lv, boss, kit);
  const b = new Battle({
    rng: makeRng(seed), boss: true, canFlee: false,
    allies: party.map((c) => ({ char: c, kind: 'support', controller: 'sim', auto: !know, tactics: 'balanced' })),
    enemies: group(boss),
  });
  b.leaderFlags = heart ? Object.fromEntries([...SHARD_FLAGS, LETTER_FLAG].map((f) => [f, true])) : {};
  if (know) Object.assign(b, { knowsFinal: true, knowsNocto: true, knowsNocto1: true });
  if (skip === 'clone') b.n1NoClone = true;
  if (skip === 'guard') Object.assign(b, { n1NoGuard: true, nsNoGuard: true, slNoGuard: true });
  if (skip === 'reach') b.n1NoReach = true;
  if (skip === 'call') Object.assign(b, { slNoCall: true, n1NoReach: true });
  if (skip === 'mimic') b.nsNoMimic = true;
  if (skip === 'bond') b.slNoBond = true;
  let real = 0;
  const st = { duals: 0, combos: 0, cbreaks: 0, traps: 0, frees: 0, bondBreaks: 0, eats: 0, eatBroke: 0, eaten: 0, nights: 0, bonds: 0, bondDmg: 0, phase: 1, phase3At: 0, hearts: 0 };
  while (!b.over && real < 40 * 60 * 1000) {
    const evs = b.tick(50);
    real += 50;
    for (const e of evs) {
      if (log && (e.t === 'act' || e.t === 'msg')) console.log('  ' + [...(e.lines || [])].join(' / '));
      if (e.t !== 'act') continue;
      if (e.dual) st.duals++;
      if (e.n1Combo) st.combos++;
      if (e.n1Break) st.cbreaks++;
      if (e.n1Trap) st.traps++;
      if (e.n1Free?.by) st.frees++;
      if (e.nsBond && !e.slEat) st.bondBreaks++;
      if (e.slEat) {
        st.eats++;
        st.eatBroke += e.slEat.broke;
        st.eaten += e.slEat.eaten;
      }
      if (e.slNight) st.nights++;
      if (e.familyBond) {
        st.bonds++;
        st.bondDmg += e.familyBond.dmg || 0;
      }
      if (e.slPhase) {
        st.phase = Math.max(st.phase, e.slPhase.phase);
        if (e.slPhase.phase === 3) st.phase3At = Math.round(real / 1000);
      }
      if (e.n2Heart) st.hearts++;
    }
    if (!know) continue;
    for (const a of b.allies) {
      if (!a.ready || !a.alive) continue;
      if (a.n2Guest || skip === 'dual' || !dualPlan(b, a)) {
        a.ready = false;
        b.enqueue(a, { type: 'ai' });
      }
    }
  }
  const al = b.allies.filter((x) => !x.n2Guest);
  const foe = b.enemies.find((e) => e.species === boss);
  return {
    outcome: b.result?.outcome || 'timeout', seconds: Math.round(real / 1000),
    hpLeft: al.reduce((s, x) => s + x.hp, 0) / al.reduce((s, x) => s + x.maxHp, 0), deaths: al.filter((x) => !x.alive).length,
    bossLeft: foe ? foe.hp / foe.maxHp : 0, ...st,
  };
}

const pct = (w, n) => `${String(Math.round((w / n) * 100)).padStart(3)}%`;
export function summary(res, boss) {
  const w = res.filter((r) => r.outcome === 'win').length;
  const avg = (k) => res.reduce((s, r) => s + (r[k] || 0), 0) / res.length;
  const head = `勝率 ${pct(w, res.length)}  平均${avg('seconds').toFixed(0).padStart(4)}秒  HP残${(avg('hpLeft') * 100).toFixed(0).padStart(3)}%  ボスの残${(avg('bossLeft') * 100).toFixed(0).padStart(3)}%  死者${avg('deaths').toFixed(2)}  合体技${avg('duals').toFixed(1)}`;
  const tail = boss === NOCTO2
    ? `  ひとりぼっちの合体技${avg('combos').toFixed(1)}（止めた${avg('cbreaks').toFixed(1)}）  地われ${avg('traps').toFixed(1)}（手をのばす${avg('frees').toFixed(1)}）  きずなくだき${avg('bondBreaks').toFixed(1)}`
    : `  第3段階まで${pct(res.filter((r) => r.phase >= 3).length, res.length)}  ひとり${avg('traps').toFixed(1)}（よびかけ${avg('frees').toFixed(1)}）  食べる${avg('eats').toFixed(1)}（よやく${avg('eatBroke').toFixed(1)}・力${avg('eaten').toFixed(1)}）  夜${avg('nights').toFixed(1)}  きずな技${avg('bonds').toFixed(1)}（1回${(avg('bondDmg') / Math.max(0.01, avg('bonds'))).toFixed(0)}）`;
  return { rate: w / res.length, text: head + tail };
}

if (process.argv[1].endsWith('sim-final.mjs')) {
  const seedOf = (i) => 5555 + i * 7919;
  if (process.env.LOG) {
    const boss = process.env.BOSS === 'solitus' ? SOLITUS : NOCTO2;
    const r = finalRun(boss, Number(process.env.LV || 55), !!process.env.KNOW, Number(process.env.SEED || 1), { log: true, heart: !!process.env.HEART });
    console.log(r);
  } else {
    const bosses = WHICH === 'both' ? [NOCTO2, SOLITUS] : [WHICH === 'solitus' ? SOLITUS : NOCTO2];
    for (const boss of bosses) {
      console.log(`■ 装備の 強さ（Lv55・${boss === SOLITUS ? 'ソリトゥスの 前' : 'ノクト（本気）の 前'}）`);
      for (const c of finalParty(55, boss)) {
        const s = computeStats(c);
        console.log(`  ${c.name.padEnd(8, '　')} HP${s.maxHp} MP${s.maxMp} 攻${s.atk} 守${s.dfn} 魔${s.mag} 速${s.agi}  ${SLOTS.map((k) => ITEMS[c.equip[k]]?.name || '-').join('・')}`);
      }
      console.log(`■ ${MONSTERS[boss].name}（超級職 4人・職業Lv10・${N}回。完全オート＝ふつうの オート / 知っている＝しかけを 知って 手で 戦う）`);
      for (const kit of [true, false]) {
        for (const lv of LVS) {
          for (const know of [false, true]) {
            const res = [...Array(N).keys()].map((i) => finalRun(boss, lv, know, seedOf(i), { kit }));
            console.log(`  Lv${lv} ${kit ? '店＋★' : '店だけ'} ${know ? '知っている　' : '完全オート　'} ${summary(res, boss).text}`);
          }
        }
        if (!process.env.SHOP) break;
      }
      if (process.env.SKIPS) {
        const lv = LVS.includes(55) ? 55 : LVS[0];
        const list = boss === NOCTO2
          ? [['clone', '影を ねらわない'], ['guard', '前ぶれで 守らない'], ['reach', '手を のばさない'], ['mimic', 'まねられても 攻撃'], ['dual', '合体技 だけ しない']]
          : [['call', 'よびかけない'], ['guard', '前ぶれで 守らない'], ['bond', 'きずな技を 使わない'], ['dual', '合体技 だけ しない']];
        for (const [skip, label] of list) {
          const res = [...Array(N).keys()].map((i) => finalRun(boss, lv, true, seedOf(i), { skip }));
          console.log(`  Lv${lv} 知っている（${label}）${''.padEnd(12 - label.length, '　')} ${summary(res, boss).text}`);
        }
      }
    }
  }
}
