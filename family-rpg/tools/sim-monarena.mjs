// 第67回 B: モンスター闘技場の ランク戦（魔物 4ひき・休みなしの 3連戦）の 強さを 見る
// つかいかた: node tools/sim-monarena.mjs [回数] [ランク,…]   LVADD=0 … おすすめの レベルに たす / LOG=1 … 1回だけ ようすを 出す
//   魔物は その ころ 仲間に できる 4ひき（TEAMS）。レベルは おすすめ（ランクの lv）＋ LVADD・＋（配合）は その ころの めやす（PLUS）・
//   ランク C から 配合で 受けついだ 強さ（同じ しゅぞくの 親 2ひき。レベル lv−10）・装備は その ころの 店の いちばん よい 物（GEAR_RANK）・
//   作戦は バッチリがんばれ（完全オート）。戦いの 間に 回復しない（HP・MPを 次の 戦いへ。world/monarena.js と おなじ）
//   めやす: 3連戦を 勝ちぬく 7〜8わり（家族が 決めた「ふつうに 育てた 魔物なら たいてい 勝てる」）
//   FAMILY=1 … 家族の 登録チームとの 対戦（同じ 4ひき 同士・レベルを そろえる）の 勝ち負けが 半分 くらいか（敵の がわの 作戦 AI の たしかめ）
import { makeRng } from '../public/js/shared/rng.js';
import { newMonsterCompanion, canEquipMonster, fullHeal, MAX_LEVEL } from '../public/js/shared/stats.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { MONSTER_FRIENDS } from '../public/js/shared/data/companions.js';
import { inheritBonus } from '../public/js/shared/breed-calc.js';
import { MONARENA_RANKS, monRankInfo } from '../public/js/shared/data/monarena.js';
import { MonArenaBattle, monAllyInit, monFighterChar, monRankFight, MON_EVEN_LV } from '../public/js/shared/battle-monarena.js';

const N = Number(process.argv[2] || 40);
const ONLY = process.argv[3] ? process.argv[3].split(',') : null;
const LVADD = Number(process.env.LVADD ?? 0);

// その ころ 仲間に できる 魔物（ランクごと）・＋・店の 装備の ランク
export const TEAMS = {
  F: ['wolf', 'dark_bat', 'pururin', 'frog'],
  E: ['wolf', 'crow', 'fuwari', 'coconut'],
  D: ['coral_golem', 'storm_bird', 'fairy_dragon', 'snow_wisp'],
  C: ['magma_slime', 'gargoyle', 'kiba_walrus', 'aurora_spirit'],
  B: ['toge_saboten', 'lamp_genie', 'castle_armor', 'lantern_ghost'],
  A: ['clockwork_guard', 'sky_serpent', 'cloud_sheep', 'thunder_puff'],
  S: ['ember_wolf', 'mill_keeper', 'soul_eater', 'faceless_shade'],
  SS: ['toki_owl', 'cog_roller', 'second_sprite', 'dust_mole'],
  SSS: ['pakkun', 'water_youma', 'karon', 'march_broom'],
};
// ALT=1 … べつの 4ひき（チームの ちがいで 大きく かわらないか 見る）
export const TEAMS_ALT = {
  F: ['goblin', 'crow', 'karamizuta', 'donguri'],
  E: ['coin_rabbit', 'ghost_pirate', 'pururin_knight', 'karamizuta'],
  D: ['mimic', 'mandra', 'king_pururin', 'ghost_pirate'],
  C: ['fire_imp', 'petit_devil', 'fairy_dragon', 'snow_wisp'],
  B: ['mummy_soldier', 'cursed_pot', 'joker_devil', 'queen_pururin'],
  A: ['killer_karakuri', 'stardust_slime', 'black_agent', 'vaporeon'],
  S: ['glass_scorpion', 'mirror_jelly', 'venusaur', 'koyomi_spirit'],
  SS: ['toki_hare', 'rewind_ghost', 'clock_bones', 'clock_golem'],
  SSS: ['pirate_parrot', 'water_youma', 'second_sprite', 'mill_keeper'],
};
const PLUS = { F: 0, E: 2, D: 4, C: 6, B: 8, A: 10, S: 12, SS: 15, SSS: 18 };
const GEAR_RANK = { F: 2, E: 3, D: 4, C: 5, B: 7, A: 8, S: 9, SS: 10, SSS: 10 };
const BRED = new Set(['C', 'B', 'A', 'S', 'SS', 'SSS']);

const SHOP_GEAR = Object.entries(ITEMS).filter(([, it]) => it && !it.base && !it.star && !it.src && it.price > 0 && !(it.rarity > 0)
  && ['weapon', 'armor', 'shield', 'head', 'acc'].includes(it.type)).map(([id]) => id);
function gearBest(sp, R) {
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

// ランクの ころの 魔物 1ぴき
//   PLAIN=1 … あまり 育てて いない 魔物（＋なし・受けついだ 強さ なし・装備は 1つ 下の ランク）。くらべる ため
export function eraMonster(rank, sp, lv) {
  const plain = process.env.PLAIN === '1';
  const c = newMonsterCompanion({ id: sp, name: MONSTERS[sp].name, species: sp, level: Math.min(MAX_LEVEL, lv) });
  c.plus = plain ? 0 : PLUS[rank] || 0;
  if (BRED.has(rank) && !plain) {
    const parent = { species: sp, level: Math.max(1, lv - 10), plus: Math.max(0, c.plus - 3) };
    c.bonus = inheritBonus(parent, parent);
  }
  c.equip = gearBest(sp, (GEAR_RANK[rank] || 10) - (plain ? 1 : 0));
  fullHeal(c);
  return c;
}
export const eraTeam = (rank, lv) => (process.env.ALT === '1' ? TEAMS_ALT : TEAMS)[rank].map((sp) => eraMonster(rank, sp, lv));

// 1つの 戦い（魔物の HP・MPは キャラに もどす）
function fight(team, R, i, rng, log) {
  const rf = monRankFight(R, i);
  const b = new MonArenaBattle({ rng, canFlee: false, allies: team.map((c) => monAllyInit(c)), enemies: rf.enemies, enemyMod: rf.enemyMod });
  let real = 0;
  while (!b.over && real < 30 * 60 * 1000) {
    const evs = b.tick(50);
    real += 50;
    if (log) for (const ev of evs) if ((ev.t === 'act' || ev.t === 'msg') && ev.lines?.length) console.log('  ' + ev.lines.join(' / '));
  }
  b.allies.forEach((x, k) => {
    team[k].hp = x.alive ? x.hp : 0;
    team[k].mp = x.mp;
    team[k].status = {};
  });
  return b.result?.outcome || 'timeout';
}

// 3連戦（何戦目まで 勝ったか・のこりの HP）
//   ためす とき: ELV=2 … 相手の レベルに たす / CPOW=1.2 … 王者の 強さに かける
export function monRun(rank, lv, seed, { log = false } = {}) {
  const R0 = monRankInfo(rank);
  const R = { ...R0, foeLv: (R0.foeLv || R0.lv) + Number(process.env.ELV || 0), champPow: (R0.champPow || 1) * Number(process.env.CPOW || 1) };
  const team = eraTeam(rank, lv).map((c) => monFighterChar(c));
  const rng = makeRng(seed);
  let won = 0;
  for (let i = 0; i < 3; i++) {
    if (log) console.log(`── 第${i + 1}戦`);
    if (fight(team, R, i, rng, log) !== 'win') break;
    won++;
  }
  const hp = team.reduce((s, c) => s + Math.max(0, c.hp), 0) / team.reduce((s, c) => s + monFighterChar(c).hp, 0);
  return { won, clear: won === 3, hp };
}

// 家族の 対戦（同じ 4ひき 同士。みかた … 自分の チーム、敵の がわ … 写し）。win の わりあい
export function famRun(rank, seed, even = true) {
  const R = monRankInfo(rank);
  const lv = even ? MON_EVEN_LV : R.lv;
  const mine = eraTeam(rank, R.lv).map((c) => monFighterChar(c, { level: lv }));
  const theirs = eraTeam(rank, R.lv).map((c) => monFighterChar(c, { level: lv }));
  const b = new MonArenaBattle({ rng: makeRng(seed), canFlee: false, allies: mine.map((c) => monAllyInit(c)), foes: theirs.map((char) => ({ char })) });
  let real = 0;
  while (!b.over && real < 30 * 60 * 1000) {
    b.tick(50);
    real += 50;
  }
  return b.result?.outcome || 'timeout';
}

const MAIN = process.argv[1]?.endsWith('sim-monarena.mjs');
if (MAIN && process.env.LOG) {
  const rank = process.env.RANK || 'F';
  console.log(monRun(rank, monRankInfo(rank).lv + LVADD, 1, { log: true }));
} else if (MAIN && process.env.FAMILY) {
  console.log(`■ 家族の 対戦（同じ 4ひき 同士・レベル${MON_EVEN_LV}に そろえる）・${N}回`);
  for (const R of MONARENA_RANKS) {
    if (ONLY && !ONLY.includes(R.rank)) continue;
    const res = [...Array(N).keys()].map((i) => famRun(R.rank, 7000 + i));
    const w = res.filter((x) => x === 'win').length;
    console.log(`  ${R.rank.padEnd(3)} 自分の 勝ち ${Math.round((w / N) * 100)}%  時間ぎれ ${res.filter((x) => x === 'timeout').length}`);
  }
} else if (MAIN) {
  console.log(`■ モンスター闘技場 ランク戦（その ころの 魔物 4ひき・完全オート・おすすめLv＋${LVADD}）・${N}回`);
  for (const R of MONARENA_RANKS) {
    if (ONLY && !ONLY.includes(R.rank)) continue;
    const lv = R.lv + LVADD;
    const res = [...Array(N).keys()].map((i) => monRun(R.rank, lv, 9000 + i));
    const clear = res.filter((r) => r.clear);
    const reach = [1, 2, 3].map((k) => Math.round((res.filter((r) => r.won >= k).length / N) * 100));
    const hp = clear.length ? Math.round((clear.reduce((s, r) => s + r.hp, 0) / clear.length) * 100) : 0;
    console.log(`  ${R.rank.padEnd(3)} Lv${lv}  勝ちぬき ${Math.round((clear.length / N) * 100)}%  （1戦目 ${reach[0]}%・2戦目 ${reach[1]}%・3戦目 ${reach[2]}%）  のこりHP ${hp}%`);
  }
}
