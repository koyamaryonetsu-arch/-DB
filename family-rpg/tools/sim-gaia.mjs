// 第5章 Step 4: ガイアイーター（多部位の 戦い）の 強さを 見る
// つかいかた: node tools/sim-gaia.mjs [回数] [lv,…]   LOG=1 … 1回だけ ようすを 出す（KNOW=1 で 知っている 人）
//   めやす（家族が 決めた。docs/plan-ch5.md の 13）: 超級職 4人（勇者・大賢者・ゴッドハンド・大神官。職業Lv10・Lv44〜45）・
//   ランク8の 店（ハネノ）＋ その ころの ★装備（神殿の 宝箱・アルゴスと 古竜の 品）で
//     完全オート（ふつうの オート。何も 知らない）… 勝率 3割くらい
//     知っている 人 … しっぽ → 体 → 頭の じゅんに ねらう・前ぶれの 大技の 前に 身を 守る・こうらの 体と 頭に 合体技（ミナデイン・全員集合）… 7割くらい
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { fullHeal, computeStats } from '../public/js/shared/stats.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { DUAL_TECHS } from '../public/js/shared/data/dual.js';
import { gaiaFocus, GAIA_BIG } from '../public/js/shared/battle-gaia.js';
import { jobChar } from './sim-jobs.mjs';

const N = Number(process.argv[2] || 40);
const LVS = process.argv[3] ? process.argv[3].split(',').map(Number) : [44, 45, 46];
// 超級職 4人
export const GAIA_JOBS = [['hero', '勇者'], ['daikenja', '大賢者'], ['god_hand', 'ゴッドハンド'], ['high_priest', '大神官']];
// その ころの ★装備（[武器, よろい, たて, 頭, アクセ]。null は ランク8の 店の いちばん よい 品）
//   神殿の 宝箱（RUIN_TREASURE）・星の番人アルゴス（星見のペンダント・百目のかぶと）・古竜（古竜の目）・大迷宮の ★
export const GAIA_KIT = {
  hero: ['tenku_sword', 'tenku_mail', 'atlas_shield', 'valkyrie_helm', 'argos_pendant'],
  daikenja: ['raiun_staff', 'gaia_robe', null, 'hanebito_plume', 'icarus_wings'],
  god_hand: ['griffin_claw', 'sphinx_mail', null, 'hundred_eye_helm', 'old_dragon_eye'],
  high_priest: ['ancient_star_staff', 'ancient_robe', 'guardian_shield', null, 'mizukagami_crown'],
};
const SLOTS = ['weapon', 'armor', 'shield', 'head', 'acc'];
export function gaiaParty(lv, kit = true) {
  return GAIA_JOBS.map(([job, name]) => {
    const c = jobChar(job, lv, 8, name);
    const k = kit ? GAIA_KIT[job] : [];
    SLOTS.forEach((sl, i) => {
      if (!k[i]) return;
      if (!ITEMS[k[i]]) throw new Error(k[i]);
      c.equip[sl] = k[i];
    });
    fullHeal(c);
    return c;
  });
}
const group = () => FIXED_ENCOUNTERS.gaia_eater.group.flatMap(([sp, n]) => Array(n).fill(sp));

// 合体技を えらぶ（知っている 人）: ねらいめの 部位が 体（こうら）か 頭の とき、ダメージの 合体技（ミナデイン・全員集合）。
// 仲間の HPが へっている・前ぶれの 大技が 来る・MPが のこり 少なく なる ときは 使わない
const hurts = (t) => t.parts.some((p) => p.type === 'power');
function dualPlan(b, a) {
  const focus = gaiaFocus(b);
  if (!focus || focus.gaiaPart === 'tail' || focus.species === 'gaia_tail') return false;
  if (b.aliveAllies().some((x) => x.hp < x.maxHp * 0.55) || b.allies.some((x) => !x.alive && !x.fled)) return false;
  if (b.aliveEnemies().some((e) => GAIA_BIG.includes(e.telegraph))) return false;
  const opts = b.dualOptionsFor(a, null, false, true).filter((o) => {
    const t = DUAL_TECHS[o.id];
    if (!hurts(t)) return false;
    const ms = [a, ...o.partners.map((id) => b.get(id))];
    if (o.size >= 3 && ms.slice(1).some((m) => !m.ready && !m.queued && m.atb < 50)) return false;
    return ms.every((m, i) => m.mp - o.mp[i] >= m.maxMp * 0.2);
  });
  const rank = (o) => (o.id === 'dt_minadein' ? 3 : o.size >= 4 ? 2 : o.size);
  const best = opts.sort((x, y) => rank(y) - rank(x))[0];
  if (!best) return false;
  const r = b.command(a.id, { type: 'dual', id: best.id, partner: best.partner, partners: best.partners, target: focus.id }, 'sim');
  return r.ok;
}

// know … 知っている 人（上の 3つ）/ 知らない 人 … ふつうの オート（家族が「オート」に した ときと おなじ）
// skip … 知っている 人の 3つの うち 1つを はずす（'order' しっぽ→体→頭・'guard' 前ぶれで 守る・'dual' 合体技）
export function gaiaRun(lv, know, seed, { log = false, kit = true, skip = null } = {}) {
  const party = gaiaParty(lv, kit);
  const b = new Battle({
    rng: makeRng(seed), boss: true, canFlee: false,
    allies: party.map((c) => ({ char: c, kind: 'support', controller: 'sim', auto: !know, tactics: 'balanced' })),
    enemies: group(),
  });
  if (know) b.knowsGaia = true;
  if (skip === 'order') b.gaiaNoOrder = true;
  if (skip === 'guard') b.gaiaNoGuard = true;
  let real = 0, duals = 0, guards = 0, shells = 0;
  const order = [];
  while (!b.over && real < 30 * 60 * 1000) {
    const evs = b.tick(50);
    real += 50;
    for (const e of evs) {
      if (log && (e.t === 'act' || e.t === 'msg')) console.log('  ' + (e.lines || []).join(' / '));
      if (e.t !== 'act') continue;
      if (e.dual) duals++;
      if (e.gaiaGuard) guards++;
      if (e.gaiaShell) shells++;
      if (e.gaiaPart) order.push(e.gaiaPart.part);
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
  const al = b.allies;
  return {
    outcome: b.result?.outcome || 'timeout', seconds: Math.round(real / 1000),
    hpLeft: al.reduce((s, x) => s + x.hp, 0) / al.reduce((s, x) => s + x.maxHp, 0), deaths: al.filter((x) => !x.alive).length,
    duals, guards, shells, order: order.join('>'), left: b.enemies.filter((e) => e.alive).map((e) => e.species),
  };
}

const pct = (w, n) => `${String(Math.round((w / n) * 100)).padStart(3)}%`;
export function summary(res) {
  const w = res.filter((r) => r.outcome === 'win').length;
  const avg = (k) => res.reduce((s, r) => s + (r[k] || 0), 0) / res.length;
  return { rate: w / res.length, text: `勝率 ${pct(w, res.length)}  平均${avg('seconds').toFixed(0).padStart(4)}秒  HP残${(avg('hpLeft') * 100).toFixed(0).padStart(3)}%  死者${avg('deaths').toFixed(2)}  合体技${avg('duals').toFixed(1)}回  まもられた${avg('guards').toFixed(1)}回  こうら${avg('shells').toFixed(1)}回` };
}

if (process.argv[1].endsWith('sim-gaia.mjs')) {
  const seedOf = (i) => 777 + i * 7919;
  if (process.env.LOG) {
    const r = gaiaRun(Number(process.env.LV || 45), !!process.env.KNOW, Number(process.env.SEED || 1), { log: true });
    console.log(r);
  } else {
    console.log('■ 装備の 強さ（Lv45・ランク8の 店＋★）');
    for (const c of gaiaParty(45)) {
      const s = computeStats(c);
      console.log(`  ${c.name.padEnd(8, '　')} HP${s.maxHp} MP${s.maxMp} 攻${s.atk} 守${s.dfn} 魔${s.mag} 速${s.agi}  ${SLOTS.map((k) => ITEMS[c.equip[k]]?.name || '-').join('・')}`);
    }
    console.log(`■ ガイアイーター（超級職 4人・職業Lv10・${N}回。完全オート＝ふつうの オート / 知っている＝しっぽ→体→頭・前ぶれで 守る・合体技）`);
    for (const kit of [true, false]) {
      for (const lv of LVS) {
        for (const know of [false, true]) {
          const res = [...Array(N).keys()].map((i) => gaiaRun(lv, know, seedOf(i), { kit }));
          console.log(`  Lv${lv} ${kit ? '店＋★' : '店だけ'} ${know ? '知っている　' : '完全オート　'} ${summary(res).text}`);
        }
      }
      if (!process.env.SHOP) break;
    }
    // 知っている 人の 3つの うち 1つだけ しない（どれが どれだけ 効くか）
    const lv = LVS.includes(45) ? 45 : LVS[0];
    for (const [skip, label] of [['order', 'しっぽ→体→頭 だけ しない'], ['guard', '前ぶれで 守る だけ しない'], ['dual', '合体技 だけ しない']]) {
      const res = [...Array(N).keys()].map((i) => gaiaRun(lv, true, seedOf(i), { skip }));
      console.log(`  Lv${lv} 知っている（${label}）${''.padEnd(14 - label.length, '　')} ${summary(res).text}`);
    }
  }
}
