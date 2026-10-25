// 第43回 A: 人 2人 ＋ 魔物の 仲間 2ひきの パーティーで 第6章の ボスに 勝てるか（docs/plan-monsters.md の 2-1）
// つかいかた: node tools/sim-monster-party.mjs [回数] [sand|gear|eater|pend|all] [魔物:＋,魔物:＋]
//   人は 勇者・大神官（tools/sim-ch6.mjs の ch6Party。その ころの 店 ＋ ★装備）。魔物は 店の いちばん よい 装備（その 魔物が 装備できる 物）
//   レベルは ボスの おすすめ（sim-ch6.mjs の CH6_LV）＋ LVADD（ない ときは 2）。魔物は 同じ レベル・受けついだ 強さ（同じ しゅぞくの 親 Lv40 2ひき）
//   KNOW=1 … しかけを 知っている 人の うごき（合体技も する。DUAL=0 で しない）/ ない ときは ふつうの オート
//   HJOBS=hero,daikenja … 人の 職業 / INHERIT=技,技 … 魔物が 受けついだ 技 / POW=1 … 魔物の 強さ（装備なし）も 出す
//   HUMANS=1 … くらべる ために 人 4人（勇者・大賢者・ゴッドハンド・大神官）でも 同じ 戦いかたで 回す
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { fullHeal, newMonsterCompanion, canEquipMonster, MAX_LEVEL } from '../public/js/shared/stats.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { MONSTER_FRIENDS, rankOf } from '../public/js/shared/data/companions.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { inheritBonus, bareStats, powerScore } from '../public/js/shared/breed-calc.js';
import { ch6Party, CH6_IDS, CH6_LV, CH6_RANK, summary, dualPlan } from './sim-ch6.mjs';

const N = Number(process.argv[2] || 20);
const WHICH = process.argv[3] || 'all';
const MONS = (process.argv[4] || 'star_wolf:15,chrono_knight:15').split(',').map((s) => { const [sp, p] = s.split(':'); return [sp, Number(p || 10)]; });
const LVADD = Number(process.env.LVADD ?? 2);
const KNOW = process.env.KNOW === '1';
// HJOBS … 人の 職業（sim-ch6.mjs の CH6_JOBS から 2つ。ない ときは 勇者・大神官）
const HJOBS = (process.env.HJOBS || 'hero,high_priest').split(',');

const SHOP_GEAR = Object.entries(ITEMS).filter(([, it]) => it && !it.base && !it.star && !it.src && it.price > 0 && !(it.rarity > 0)
  && ['weapon', 'armor', 'shield', 'head', 'acc'].includes(it.type)).map(([id]) => id);
function monsterGearBest(sp, R) {
  const g = MONSTER_FRIENDS[sp]?.growth || {};
  const b = (it, k) => it.bonus?.[k] || 0;
  const score = (it) => {
    const extra = b(it, 'mag') * (g.mag ?? 1) + b(it, 'heal') * (g.heal ?? 1) * 0.5 + b(it, 'agi') * 0.3 + b(it, 'str') * (g.str ?? 1) + b(it, 'def') * 0.5 + b(it, 'hp') * 0.2;
    return it.type === 'weapon' ? (it.atk || 0) * (g.str ?? 1) + extra : (it.def || 0) + extra;
  };
  const eq = { weapon: null, armor: null, shield: null, head: null, acc: null };
  for (const slot of Object.keys(eq)) {
    const list = SHOP_GEAR.filter((id) => ITEMS[id].type === slot && ITEMS[id].rank <= R && canEquipMonster(sp, id)).sort((x, y) => score(ITEMS[y]) - score(ITEMS[x]));
    eq[slot] = list[0] || null;
  }
  return eq;
}
export function monsterChar(sp, lv, plus, R) {
  const c = newMonsterCompanion({ id: sp, name: MONSTERS[sp].name, species: sp, level: Math.min(MAX_LEVEL, lv) });
  c.plus = plus;
  const parent = { species: sp, level: 40, plus: Math.max(0, plus - 5) };
  c.bonus = process.env.BONUS === '0' ? {} : inheritBonus(parent, parent);
  c.equip = monsterGearBest(sp, R);
  // INHERIT=技,技 … 配合で 受けついだ 技（ためす とき）
  if (process.env.INHERIT) c.inherit = process.env.INHERIT.split(',');
  fullHeal(c);
  return c;
}

const group = (boss) => FIXED_ENCOUNTERS[CH6_IDS[boss]].group.flatMap(([sp, n]) => Array(n).fill(sp));
function run(boss, party, seed) {
  const b = new Battle({
    rng: makeRng(seed), boss: true, canFlee: false,
    allies: party.map((c) => ({ char: c, kind: 'support', controller: 'sim', auto: !KNOW, tactics: 'balanced' })),
    enemies: group(boss),
  });
  if (KNOW) b.knowsCh6 = true;
  let real = 0;
  while (!b.over && real < 30 * 60 * 1000) {
    b.tick(50);
    real += 50;
    if (!KNOW) continue;
    for (const a of b.allies) {
      if (!a.ready || !a.alive) continue;
      // 合体技（人どうし。DUAL=0 で しない）
      if (process.env.DUAL !== '0' && dualPlan(b, a, CH6_IDS[boss])) continue;
      a.ready = false;
      b.enqueue(a, { type: 'ai' });
    }
  }
  const al = b.allies;
  const main = b.enemies.find((e) => e.species === CH6_IDS[boss]);
  return {
    outcome: b.result?.outcome || 'timeout', seconds: Math.round(real / 1000),
    hpLeft: al.reduce((s, x) => s + x.hp, 0) / al.reduce((s, x) => s + x.maxHp, 0), deaths: al.filter((x) => !x.alive).length,
    bossLeft: main ? main.hp / main.maxHp : 0,
  };
}

const MAIN = process.argv[1]?.endsWith('sim-monster-party.mjs');
const bosses = !MAIN ? [] : WHICH === 'all' ? Object.keys(CH6_IDS) : [WHICH];
if (MAIN) console.log(`■ 人2人＋魔物2ひき（${MONS.map(([sp, p]) => `${MONSTERS[sp].name}＋${p}`).join('・')}）${KNOW ? '・知っている人' : '・オート'}・${N}回`);
for (const boss of bosses) {
  const lv = CH6_LV[boss] + LVADD;
  const humans = ch6Party(boss, lv).filter((c) => HJOBS.includes(c.job));
  const mons = MONS.map(([sp, p]) => monsterChar(sp, lv, p, CH6_RANK[boss]));
  const res = [...Array(N).keys()].map((i) => run(boss, [...humans, ...mons].map((c) => structuredClone(c)), 9000 + i));
  const pw = mons.map((c) => `${MONSTERS[c.species].name}（${rankOf(c.species, MONSTERS)}） ${Math.round(powerScore(bareStats(c)))}`);
  console.log(`${boss.padEnd(5)} Lv${lv}  ${summary(res).text.split('  合体技')[0]}`);
  if (process.env.POW) console.log('   ', pw.join(' / '));
  if (process.env.HUMANS === '1') {
    const all = ch6Party(boss, lv);
    const r4 = [...Array(N).keys()].map((i) => run(boss, all.map((c) => structuredClone(c)), 9000 + i));
    console.log(`      人4人  ${summary(r4).text.split('  合体技')[0]}`);
  }
}
