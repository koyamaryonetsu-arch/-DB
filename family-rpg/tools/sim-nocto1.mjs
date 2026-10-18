// 第5章 Step 6・7: ノクト（1回目。かげぶんしん・ひとりぼっちの合体技・地われ・手をのばす・HP半分で 終わる）の 強さを 見る
// つかいかた: node tools/sim-nocto1.mjs [回数] [lv,…]   LOG=1 … 1回だけ ようすを 出す（KNOW=1 で 知っている 人）
//   めやす（家族が 決めた。docs/plan-ch5.md の 16）: 超級職 4人（勇者・大賢者・ゴッドハンド・大神官。職業Lv10・Lv50）・
//   ランク8の 店（星読みの里）＋ その ころの ★装備（大地の神殿の 宝箱・ノクトの影と それまでの ボスの 品）で
//     完全オート（ふつうの オート）… 勝率 1〜2割
//       （ふつうの オートも、地われ・のみこまれ の 仲間には 回復の あとで「手をのばす」。battle-earth.js の reachPlan）
//     知っている 人 … 影を 先に たおす（合体技の 前ぶれの 前・間）・前ぶれで 間に 合わない 人は 身を 守る・手を のばす・
//                    合体技（ダメージの 合体技）… 7割くらい
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { fullHeal, computeStats } from '../public/js/shared/stats.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { DUAL_TECHS } from '../public/js/shared/data/dual.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { COMBO, NOCTO1, clonesOf } from '../public/js/shared/battle-earth.js';
import { jobChar } from './sim-jobs.mjs';

// 調整用（データを かえる 前に ためす）: 合体技の 強さ
if (process.env.COMBO) MONSTERS[NOCTO1].nocto1.combo.mult = Number(process.env.COMBO);

const N = Number(process.argv[2] || 40);
const LVS = process.argv[3] ? process.argv[3].split(',').map(Number) : [49, 50, 51];
// 超級職 4人
export const NOCTO1_JOBS = [['hero', '勇者'], ['daikenja', '大賢者'], ['god_hand', 'ゴッドハンド'], ['high_priest', '大神官']];
// その ころの ★装備（[武器, よろい, たて, 頭, アクセ]。null は ランク8の 店〈星読みの里〉の いちばん よい 品）
//   大地の神殿の 宝箱（EARTH_TREASURE）・思い出の迷宮の 宝箱・ノクトの影・ガイアイーター・アルゴス・しずみゆく島の 神殿の 品
export const NOCTO1_KIT = {
  hero: ['et_earth_sword', 'et_bedrock_mail', 'et_keeper_shield', 'valkyrie_helm', 'shade_pendant'],
  daikenja: ['et_spring_staff', 'et_spring_robe', null, 'et_earth_crown', 'icarus_wings'],
  god_hand: ['et_moss_claw', 'et_earth_gi', null, 'et_tree_hat', 'gaia_fang_charm'],
  high_priest: ['mem_venus_staff', 'mem_starmap_robe', 'atlas_shield', 'mem_star_crown', 'argos_pendant'],
};
const SLOTS = ['weapon', 'armor', 'shield', 'head', 'acc'];
export function nocto1Party(lv, kit = true) {
  return NOCTO1_JOBS.map(([job, name]) => {
    const c = jobChar(job, lv, 8, name);
    const k = kit ? NOCTO1_KIT[job] : [];
    SLOTS.forEach((sl, i) => {
      if (!k[i]) return;
      if (!ITEMS[k[i]]) throw new Error(k[i]);
      c.equip[sl] = k[i];
    });
    fullHeal(c);
    return c;
  });
}
const group = () => FIXED_ENCOUNTERS.nocto_1.group.flatMap(([sp, n]) => Array(n).fill(sp));

// 合体技を えらぶ（知っている 人）: ダメージの 合体技。仲間の HPが へっている・合体技の 前ぶれ・MPが のこり 少なく なる ときは 使わない。
// 影が いる ときは 全体の 合体技を 先に（影も たおせる）
const hurts = (t) => t.parts.some((p) => p.type === 'power');
const allFoes = (t) => ['enemies', 'group'].includes(t.target);
function dualPlan(b, a) {
  const boss = b.aliveEnemies().find((e) => e.species === NOCTO1);
  if (!boss || boss.telegraph === COMBO) return false;
  if (b.aliveAllies().some((x) => x.hp < x.maxHp * 0.55) || b.allies.some((x) => !x.alive && !x.fled)) return false;
  const cl = clonesOf(b, boss);
  const opts = b.dualOptionsFor(a, null, false, true).filter((o) => {
    const t = DUAL_TECHS[o.id];
    if (!hurts(t)) return false;
    const ms = [a, ...o.partners.map((id) => b.get(id))];
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
// skip … 知っている 人の 4つの うち 1つを はずす（'clone' 影を 先に たおす・'guard' 前ぶれで 守る・'reach' 手を のばす・'dual' 合体技）
// letter … ピピの 手紙を 持っている（HP半分の ことばが かわる）
export function nocto1Run(lv, know, seed, { log = false, kit = true, skip = null, letter = false } = {}) {
  const party = nocto1Party(lv, kit);
  const b = new Battle({
    rng: makeRng(seed), boss: true, canFlee: false,
    allies: party.map((c) => ({ char: c, kind: 'support', controller: 'sim', auto: !know, tactics: 'balanced' })),
    enemies: group(),
  });
  b.pipiLetter = letter;
  if (know) b.knowsNocto1 = true;
  for (const e of b.enemies) {
    const k = (v) => Number(process.env[v] || 1);
    e.maxHp = e.hp = Math.round(e.maxHp * k('HPK'));
    e.atk = Math.round(e.atk * k('ATKK'));
    e.mag = Math.round(e.mag * k('MAGK'));
  }
  if (skip === 'clone') b.n1NoClone = true;
  if (skip === 'guard') b.n1NoGuard = true;
  if (skip === 'reach') b.n1NoReach = true;
  let real = 0, duals = 0, combos = 0, breaks = 0, traps = 0, reaches = 0, summons = 0, stopped = 0, cloneKills = 0;
  while (!b.over && real < 30 * 60 * 1000) {
    const evs = b.tick(50);
    real += 50;
    for (const e of evs) {
      if (log && (e.t === 'act' || e.t === 'msg')) console.log('  ' + [...(e.lines || [])].join(' / '));
      if (e.t !== 'act') continue;
      if (e.dual) duals++;
      if (e.n1Combo) combos++;
      if (e.n1Break) breaks++;
      if (e.n1Trap) traps++;
      if (e.n1Free?.by) reaches++;
      if (e.n1Clones) summons++;
      if (e.n1Stop) stopped++;
    }
    if (!know) continue;
    for (const a of b.allies) {
      if (!a.ready || !a.alive) continue;
      if (skip === 'dual' || !dualPlan(b, a)) {
        a.ready = false;
        b.enqueue(a, { type: 'ai' });
      }
    }
  }
  cloneKills = b.killed.filter((sp) => sp === 'nocto_clone').length;
  const al = b.allies;
  const boss = b.enemies.find((e) => e.species === NOCTO1);
  return {
    outcome: b.result?.outcome || 'timeout', seconds: Math.round(real / 1000),
    hpLeft: al.reduce((s, x) => s + x.hp, 0) / al.reduce((s, x) => s + x.maxHp, 0), deaths: al.filter((x) => !x.alive).length,
    bossLeft: boss ? boss.hp / boss.maxHp : 0,
    duals, combos, breaks, traps, reaches, summons, stopped, cloneKills,
  };
}

const pct = (w, n) => `${String(Math.round((w / n) * 100)).padStart(3)}%`;
export function summary(res) {
  const w = res.filter((r) => r.outcome === 'win').length;
  const avg = (k) => res.reduce((s, r) => s + (r[k] || 0), 0) / res.length;
  return {
    rate: w / res.length,
    text: `勝率 ${pct(w, res.length)}  平均${avg('seconds').toFixed(0).padStart(4)}秒  HP残${(avg('hpLeft') * 100).toFixed(0).padStart(3)}%  ノクトの残${(avg('bossLeft') * 100).toFixed(0).padStart(3)}%  死者${avg('deaths').toFixed(2)}  合体技${avg('duals').toFixed(1)}  かげぶんしん${avg('summons').toFixed(1)}（影をたおした${avg('cloneKills').toFixed(1)}）  ひとりぼっちの合体技${avg('combos').toFixed(1)}（止めた${avg('breaks').toFixed(1)}）  地われ${avg('traps').toFixed(1)}（手をのばす${avg('reaches').toFixed(1)}）`,
  };
}

if (process.argv[1].endsWith('sim-nocto1.mjs')) {
  const seedOf = (i) => 5050 + i * 7919;
  if (process.env.LOG) {
    const r = nocto1Run(Number(process.env.LV || 50), !!process.env.KNOW, Number(process.env.SEED || 1), { log: true, letter: !!process.env.LETTER });
    console.log(r);
  } else {
    console.log('■ 装備の 強さ（Lv50・ランク8の 店〈星読みの里〉＋★）');
    for (const c of nocto1Party(50)) {
      const s = computeStats(c);
      console.log(`  ${c.name.padEnd(8, '　')} HP${s.maxHp} MP${s.maxMp} 攻${s.atk} 守${s.dfn} 魔${s.mag} 速${s.agi}  ${SLOTS.map((k) => ITEMS[c.equip[k]]?.name || '-').join('・')}`);
    }
    console.log(`■ ノクト（1回目。超級職 4人・職業Lv10・${N}回。完全オート＝ふつうの オート / 知っている＝影を 先に・前ぶれで 守る・手を のばす・合体技）`);
    for (const kit of [true, false]) {
      for (const lv of LVS) {
        for (const know of [false, true]) {
          const res = [...Array(N).keys()].map((i) => nocto1Run(lv, know, seedOf(i), { kit }));
          console.log(`  Lv${lv} ${kit ? '店＋★' : '店だけ'} ${know ? '知っている　' : '完全オート　'} ${summary(res).text}`);
        }
      }
      if (!process.env.SHOP) break;
    }
    // 知っている 人の 4つの うち 1つだけ しない（どれが どれだけ 効くか）
    const lv = LVS.includes(50) ? 50 : LVS[0];
    for (const [skip, label] of [['clone', '影を ねらわない'], ['guard', '前ぶれで 守らない'], ['reach', '手を のばさない'], ['dual', '合体技 だけ しない']]) {
      const res = [...Array(N).keys()].map((i) => nocto1Run(lv, true, seedOf(i), { skip }));
      console.log(`  Lv${lv} 知っている（${label}）${''.padEnd(12 - label.length, '　')} ${summary(res).text}`);
    }
  }
}
