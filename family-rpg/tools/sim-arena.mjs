// 第37回 A: サファラ闘技場の ランク戦（休みなしの 3連戦）の 強さを 見る
// つかいかた: node tools/sim-arena.mjs [回数] [ランク,…]   LOG=1 RANK=5 … 1回だけ ようすを 出す（KNOW=1 で 知っている 人）
//   3連戦は 戦いの 間に 回復しない（HP・MPを キャラに もどして 次へ。world/battles.js の finishBattle と おなじ）。道具は 使わない
//   ランク1〜5（第4章の ころ）: tools/sim.js と おなじ 4人（せんし・そうりょ・まほう・ぶとう・職業Lv10）。
//     店 … GEAR 38（第4章の おわり）・42（ドゥナの ランク7）・45（大迷宮の ★）/ rare42 … sim-rare.mjs の レア装備
//   伝説の部 ランク6〜8（docs/plan-r37.md の A。家族が 決めた めやす）: 超級職 4人（勇者・大賢者・ゴッドハンド・大神官。職業Lv10）・
//     その ころの ★装備（6 … ガイアイーターの あと〈sim-gaia.mjs の 装備〉・7 … ノクトの影の あと〈sim-nocto.mjs〉・
//     8 … 大地の神殿の ノクトの あと〈sim-nocto1.mjs ＋ ノクトの 品〉）で
//       完全オート（ふつうの オート）… 3連戦を 勝ちぬく 2割前後
//       知っている 人 … 大技の 前に 身を 守る・合体技の 組の 弟子を 先に・よろいの 属性を さけて 弱点・砂に もぐったら 守る・
//                      合体技（ダメージの 合体技）… 7割くらい
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { fullHeal, computeStats } from '../public/js/shared/stats.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { DUAL_TECHS } from '../public/js/shared/data/dual.js';
import { scaleEnemy } from '../public/js/shared/data/treasure.js';
import { ARENA_BIG } from '../public/js/shared/battle-arena.js';
import { ARENA_RANKS } from '../public/js/shared/data/arena.js';
import { kitParty } from './sim-rare.mjs';
import { gaiaParty } from './sim-gaia.mjs';
import { noctoParty } from './sim-nocto.mjs';
import { nocto1Party } from './sim-nocto1.mjs';

const N = Number(process.argv[2] || 30);
const ONLY = process.argv[3] ? process.argv[3].split(',').map(Number) : null;
const SLOTS = ['weapon', 'armor', 'shield', 'head', 'acc'];

// ランクごとの パーティー（lv … レベル）。kit: 'shop'（店）/ 'rare'（その ころの レア・★）
export function arenaParty(rank, lv, kit = 'shop') {
  if (rank === 1) return kitParty(lv, 38, kit === 'rare' ? 'rare38' : null);
  if (rank === 2 || rank === 3) return kitParty(lv, 42, kit === 'rare' ? 'rare42' : null);
  if (rank === 4 || rank === 5) return kitParty(lv, 45, kit === 'rare' ? 'rare42' : null);
  if (rank === 6) return gaiaParty(lv, true).map((c) => withGear(c, { god_hand: [null, null, null, null, 'gaia_fang_charm'] }));
  if (rank === 7) return noctoParty(lv, true).map((c) => withGear(c, { hero: [null, null, null, null, 'shade_pendant'] }));
  // ランク8: ノクト（1回目）の 品（大地のかけらのお守り・黒い星のマント）も
  return nocto1Party(lv, true).map((c) => withGear(c, { daikenja: [null, 'nocto_star_cloak', null, null, null], high_priest: [null, null, null, null, 'nocto_earth_charm'] }));
}
function withGear(c, table) {
  const k = table[c.job] || [];
  SLOTS.forEach((sl, i) => {
    if (!k[i]) return;
    if (!ITEMS[k[i]]) throw new Error(k[i]);
    c.equip[sl] = k[i];
  });
  fullHeal(c);
  return c;
}

const hurts = (t) => t.parts.some((p) => p.type === 'power');
// 合体技（知っている 人）: 仲間が 元気・大技の 前ぶれが ない・MPに よゆうが ある とき、ダメージの 合体技
function dualPlan(b, a) {
  const foes = b.aliveEnemies();
  const boss = foes.find((e) => e.boss) || foes[0];
  if (!boss) return false;
  if (foes.some((e) => ARENA_BIG.has(e.telegraph))) return false;
  if (b.aliveAllies().some((x) => x.hp < x.maxHp * 0.55) || b.allies.some((x) => !x.alive && !x.fled)) return false;
  const opts = b.dualOptionsFor(a, null, false, true).filter((o) => {
    const t = DUAL_TECHS[o.id];
    if (!hurts(t)) return false;
    const ms = [a, ...o.partners.map((id) => b.get(id))];
    if (o.size >= 3 && ms.slice(1).some((m) => !m.ready && !m.queued && m.atb < 50)) return false;
    return ms.every((m, i) => m.mp - o.mp[i] >= m.maxMp * 0.25);
  });
  const rank = (o) => (o.id === 'dt_minadein' ? 3 : o.size >= 4 ? 2 : o.size);
  const best = opts.sort((x, y) => rank(y) - rank(x))[0];
  if (!best) return false;
  const r = b.command(a.id, { type: 'dual', id: best.id, partner: best.partner, partners: best.partners, target: boss.id }, 'sim');
  return r.ok;
}

// 1つの 戦い（party の HP・MPは キャラに もどす）
function fight(party, enc, know, rng, log) {
  const e = FIXED_ENCOUNTERS[enc];
  const b = new Battle({
    rng, boss: !!e.boss, canFlee: false,
    allies: party.map((c) => ({ char: c, kind: 'support', controller: 'sim', auto: !know, tactics: 'balanced' })),
    enemies: e.group.flatMap(([sp, n]) => Array(n).fill(sp)),
    enemyMod: e.enemyLv ? (m) => scaleEnemy(m, e.enemyLv, e.enemyPow) : null,
  });
  if (know) Object.assign(b, { knowsArena: true, knowsTemple: true, knowsBurrow: true });
  let real = 0, duals = 0;
  while (!b.over && real < 30 * 60 * 1000) {
    const evs = b.tick(50);
    real += 50;
    for (const ev of evs) {
      if (log && (ev.t === 'act' || ev.t === 'msg')) console.log('  ' + [...(ev.lines || [])].join(' / '));
      if (ev.t === 'act' && ev.dual) duals++;
    }
    if (!know) continue;
    for (const a of b.allies) {
      if (!a.ready || !a.alive) continue;
      if (!dualPlan(b, a)) {
        a.ready = false;
        b.enqueue(a, { type: 'ai' });
      }
    }
  }
  b.allies.forEach((x, i) => {
    party[i].hp = x.alive ? x.hp : 0;
    party[i].mp = x.mp;
    party[i].status = {};
  });
  return { outcome: b.result?.outcome || 'timeout', seconds: real / 1000, duals };
}

// 3連戦（1つでも 負けたら そこで 終わり）。reached … 何戦目まで 勝ったか
export function arenaRun(rank, lv, know, seed, { kit = 'shop', log = false } = {}) {
  const party = arenaParty(rank, lv, kit);
  const rng = makeRng(seed);
  let won = 0, seconds = 0, duals = 0;
  for (const enc of ARENA_RANKS[rank - 1].battles) {
    if (log) console.log(`── ${enc} ──`);
    const r = fight(party, enc, know, rng, log);
    seconds += r.seconds;
    duals += r.duals;
    if (r.outcome !== 'win') break;
    won++;
  }
  const st = party.map((c) => computeStats(c));
  return {
    outcome: won === 3 ? 'win' : 'lose', won, seconds,
    hpLeft: party.reduce((s, c) => s + c.hp, 0) / st.reduce((s, x) => s + x.maxHp, 0),
    mpLeft: party.reduce((s, c) => s + c.mp, 0) / Math.max(1, st.reduce((s, x) => s + x.maxMp, 0)),
    duals,
  };
}

const pct = (w, n) => `${String(Math.round((w / n) * 100)).padStart(3)}%`;
export function summary(res) {
  const w = res.filter((r) => r.outcome === 'win').length;
  const avg = (k) => res.reduce((s, r) => s + (r[k] || 0), 0) / res.length;
  const reach = [1, 2, 3].map((k) => pct(res.filter((r) => r.won >= k).length, res.length).trim()).join('/');
  return { rate: w / res.length, text: `勝ちぬき ${pct(w, res.length)}（1・2・3戦目まで勝った ${reach}）  平均${avg('seconds').toFixed(0).padStart(4)}秒  のこりHP${(avg('hpLeft') * 100).toFixed(0).padStart(3)}%  MP${(avg('mpLeft') * 100).toFixed(0).padStart(3)}%  合体技${avg('duals').toFixed(1)}` };
}

// ランクごとに ためす レベルと 装備
export const PLAN = {
  1: { lvs: [34, 36, 38], kits: ['shop'] },
  2: { lvs: [37, 39, 41], kits: ['shop'] },
  3: { lvs: [40, 42, 44], kits: ['shop'] },
  4: { lvs: [43, 45, 47], kits: ['shop'] },
  5: { lvs: [46, 48, 50], kits: ['shop', 'rare'] },
  6: { lvs: [49, 50, 51], kits: ['rare'] },
  7: { lvs: [52, 53, 54], kits: ['rare'] },
  8: { lvs: [55, 56, 57], kits: ['rare'] },
};

if (process.argv[1].endsWith('sim-arena.mjs')) {
  const seedOf = (i) => 3737 + i * 7919;
  if (process.env.LOG) {
    const rank = Number(process.env.RANK || 5);
    const r = arenaRun(rank, Number(process.env.LV || ARENA_RANKS[rank - 1].lv), !!process.env.KNOW, Number(process.env.SEED || 1), { log: true, kit: process.env.KIT || (rank >= 6 ? 'rare' : 'shop') });
    console.log(r);
  } else {
    for (const rank of ONLY || [1, 2, 3, 4, 5, 6, 7, 8]) {
      const R = ARENA_RANKS[rank - 1];
      console.log(`■ ランク${rank}（${R.champ}。おすすめ Lv${R.lv}）`);
      for (const kit of PLAN[rank].kits) {
        for (const lv of PLAN[rank].lvs) {
          for (const know of rank >= 5 ? [false, true] : [false]) {
            const res = [...Array(N).keys()].map((i) => arenaRun(rank, lv, know, seedOf(i), { kit }));
            const label = `${rank >= 6 ? '超級職' : kit === 'rare' ? 'レア' : '店'} Lv${lv} ${know ? '知っている' : '完全オート'}`;
            console.log(`  ${label.padEnd(16, '　')} ${summary(res).text}`);
          }
        }
      }
    }
  }
}
