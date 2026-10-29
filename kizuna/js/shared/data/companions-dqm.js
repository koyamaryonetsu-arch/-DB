// 第45回（ドラクエふう D1。docs/plan-breed-new.md の 7-1 の 2回目）: ドラクエふうの 魔物が 仲間に なった とき・生まれかた
//
// ・やせいには いない（rate 0・breedOnly）。系統配合では 生まれない（recipeOnly）。ここの レシピだけ
// ・ランクは 手で きめる（rank。docs/plan-monsters.md の きまり）:
//   プチデビ C・ぷるりんクイーン・ゴールドぷるりん・ランタンゴースト・ひとくい箱 B・ローズクイーン・キラーからくり A・
//   せかいじゅの子・がいこつ王・こよみのせいれい・竜王のまご S（S は 素材配合 か「どちらも Lv50 いじょう」の 特定配合だけ）
// ・とくちょう:
//   passive.gold … パーティーに いると 戦いの あとの お金が ふえる（職業の passive.gold と おなじ。いちばん 大きい 倍率だけ。world/battles.js）
//   crit … 会心の 出やすさを たす（stats.js の monsterCompanionStats）
//   after … 図鑑で その しゅぞくの すぐ うしろに ならぶ（companions.js の bestiaryOrder）
// ・gear: 装備（companions.js の RACE_GEAR を うわがき）
// companions.js が まぜる。ここは ポケモンの ほのおの魔物（companions-pokemon.js）だけ import する

import { FIRE_KIN } from './companions-pokemon.js?v=847e4bcd6ab2';

const Q = (o) => ({ rate: 0, breedOnly: true, recipeOnly: true, ...o });

export const FRIENDS_DQM = {
  // ───── スライム系 ─────
  queen_pururin: Q({
    rank: 'B', after: 'king_pururin', names: ['クイーン', 'ぷるひめ', 'ティアラ', 'ぷるるん'],
    growth: { hp: 1.15, mp: 1.05, str: 0.85, def: 0.95, agi: 0.8, mag: 1.05, heal: 1.2 },
    learn: [[1, 'm_tackle'], [3, 'hoimi'], [7, 'sukara'], [12, 'behoimi'], [17, 'dq_royal_press'], [23, 'dq_queen_grace'], [30, 'behomara']],
    // かんむりが あるので 頭は なし。ドレスの ような ローブ
    gear: { armor: ['cloth', 'robe'], head: false },
    note: 'キングぷるりんのおきさき。仲間をいやす技が得意。',
  }),
  gold_pururin: Q({
    rank: 'B', after: 'silver_king', names: ['キンキン', 'ゴールド', 'こばん', 'ピカりん'],
    growth: { hp: 0.95, mp: 0.85, str: 1.0, def: 1.4, agi: 1.1, mag: 0.95, heal: 0.75 },
    learn: [[1, 'm_tackle'], [3, 'm_harden'], [8, 'dq_gold_body'], [13, 'merami'], [18, 'dq_gold_rain'], [26, 'kabau'], [34, 'gd_wall']],
    passive: { gold: 1.3 },
    note: '金でできたぷるりん。パーティーにいると、戦いのあとのお金がふえる。',
  }),
  // ───── 植物系 ─────
  rose_queen: Q({
    rank: 'A', after: 'mandra', names: ['ローズ', 'バラひめ', 'いばら', 'ルージュ'],
    growth: { hp: 1.15, mp: 1.05, str: 1.25, def: 1.0, agi: 1.25, mag: 1.15, heal: 0.85 },
    learn: [[1, 'dq_rose_whip'], [4, 'm_root_heal'], [8, 'dq_rose_charm'], [13, 'm_pollen'], [18, 'behoimi'], [24, 'dq_rose_storm'], [32, 'manusa']],
    note: 'バラの女王。いばらのムチと、まどわすかおりで戦う。',
  }),
  yggdra_child: Q({
    rank: 'S', after: 'venusaur', names: ['ユグ', 'こずえ', 'みどりの', 'せかいじゅ'],
    growth: { hp: 1.35, mp: 1.15, str: 0.95, def: 1.25, agi: 0.8, mag: 1.2, heal: 1.45 },
    learn: [[1, 'm_root_heal'], [3, 'hoimi'], [8, 'm_branch_whip'], [12, 'behoimi'], [18, 'dq_yggdra_leaf'], [24, 'behomara'], [30, 'dq_world_tree'], [38, 'sg_behoma']],
    // 頭に 若葉の かんむり: ぼうしは かぶれない
    gear: { head: false },
    note: 'せかいじゅの子ども。仲間を回復し、生き返らせる力をもつ。',
  }),
  // ───── ゾンビ系 ─────
  lantern_ghost: Q({
    rank: 'B', after: 'gengar', names: ['ランタン', 'あおび', 'ゆらり', 'ともしび'],
    growth: { hp: 0.95, mp: 1.15, str: 0.8, def: 0.85, agi: 1.2, mag: 1.3, heal: 0.75 },
    learn: [[1, 'm_drain'], [3, 'mera'], [7, 'dq_lantern_lure'], [12, 'merami'], [17, 'dq_lantern'], [24, 'manusa'], [30, 'm_blaze']],
    // ふわふわの ゆうれい: 重い よろいや たては 持たない
    gear: { weapons: ['staff', 'dagger'], armor: ['cloth', 'robe'], shield: false, head: 'hat' },
    note: 'ランタンにすむゆうれい。青い火で敵を焼き、まよわせる。',
  }),
  skeleton_king: Q({
    rank: 'S', after: 'gengar', names: ['ほねおう', 'ボーン', 'カタカタ', 'がいこつ'],
    growth: { hp: 1.35, mp: 0.95, str: 1.5, def: 1.3, agi: 1.0, mag: 1.1, heal: 0.95 },
    learn: [[1, 'm_darkslash'], [4, 'chikaratame'], [8, 'm_glare'], [13, 'tamashii'], [18, 'ms_soul'], [24, 'dq_bone_king'], [32, 'sm_jigo']],
    // 金の かんむり: かぶとは かぶれない
    gear: { head: false },
    note: 'ほねの国の王さま。闇の剣と、ほねの王のいかりで戦う。',
  }),
  // ───── せいれい系 ─────
  koyomi_spirit: Q({
    rank: 'S', after: 'aurora_spirit', names: ['こよみ', 'しき', 'はるなつ', 'めぐり'],
    growth: { hp: 1.15, mp: 1.25, str: 0.95, def: 1.05, agi: 1.2, mag: 1.4, heal: 1.15 },
    learn: [[1, 'hoimi'], [4, 'mera'], [8, 'dq_spring_breeze'], [13, 'dq_summer_sun'], [18, 'dq_winter_snow'], [24, 'behomara'], [30, 'dq_seasons'], [38, 'zao']],
    note: '四季をめぐらせるせいれい。回復と、季節の力の技を使う。',
    // 図鑑・酒場の うわさの ヒント（素材配合。companions.js の recipeHint）
    hint: '四季のこよみ ＋ せいれい系2ひき',
  }),
  // ───── 物質系 ─────
  killer_karakuri: Q({
    rank: 'A', after: 'gold_golem', names: ['キラー', 'からくり', 'ギアまる', 'カラクリ'],
    growth: { hp: 1.3, mp: 0.75, str: 1.55, def: 1.35, agi: 1.35, mag: 0.8, heal: 0.75 },
    learn: [[1, 'dq_killer_slash'], [4, 'm_harden'], [8, 'dq_killer_arrow'], [13, 'chikaratame'], [18, 'dq_karakuri_rush'], [24, 'tamashii'], [30, 'gd_wall']],
    // うでの 剣と たて
    gear: { weapons: ['sword', 'axe', 'claw'] },
    note: '戦いのためのからくり兵。キラーれんぎりで、1回に2度切りつける。',
  }),
  hitokui_box: Q({
    rank: 'B', after: 'mimic', names: ['ハコ', 'ガブリ', 'たからん', 'パクパク'],
    growth: { hp: 1.1, mp: 0.8, str: 1.4, def: 1.15, agi: 0.95, mag: 0.85, heal: 0.7 },
    learn: [[1, 'm_mimic_bite'], [4, 'm_pot_suck'], [8, 'm_harden'], [12, 'dq_chomp'], [17, 'm_glare'], [22, 'mahoton'], [28, 'tamashii']],
    crit: 0.08,
    // 宝箱の 体: 武器・たて・かぶとは 持たない（鉄の よろいは つけられる）
    gear: { weapons: [], armor: ['cloth', 'heavy'], shield: false, head: false },
    note: '大きな宝箱の魔物。会心のかみつきがとても出やすい。',
  }),
  // ───── 悪魔系 ─────
  petit_devil: Q({
    rank: 'C', after: 'demon_knight', names: ['プチ', 'デビ', 'ちびデビ', 'いたずら'],
    growth: { hp: 0.85, mp: 1.0, str: 0.95, def: 0.8, agi: 1.3, mag: 1.05, heal: 0.75 },
    learn: [[1, 'dq_petit_fork'], [3, 'mera'], [7, 'dq_petit_trick'], [12, 'manusa'], [17, 'merami'], [22, 'm_dark_bolt']],
    // フォーク（やり）と ナイフ。小さな 体に 重い よろいは むり
    gear: { weapons: ['spear', 'dagger'], armor: ['cloth'], shield: false, head: 'hat' },
    note: 'いたずら好きの小さな悪魔。フォークでつつき、敵をまどわせる。',
  }),
  // ───── ドラゴン系 ─────
  ryuou_grandson: Q({
    rank: 'S', after: 'thunder_dragon', names: ['まご', 'りゅうた', 'ドラまご', 'りゅうおう'],
    growth: { hp: 1.3, mp: 1.1, str: 1.3, def: 1.15, agi: 1.05, mag: 1.3, heal: 0.95 },
    learn: [[1, 'm_bite'], [3, 'm_flame_breath'], [8, 'm_dragon_claw'], [13, 'dq_dark_breath'], [18, 'm_dragon_roar'], [24, 'm_blaze'], [30, 'dq_dragon_lord'], [38, 'dk_ikari']],
    // おじいちゃんの つえ（杖）と ローブ
    gear: { weapons: ['claw', 'staff'], armor: ['cloth', 'robe', 'heavy'] },
    note: '竜王のまご。おこると大きな竜のすがたにかわり、炎をはく。',
    hint: '竜王のしるし ＋ ドラゴン系2ひき',
  }),
};

// ───────────── 生まれかた（companions.js の BREED_RECIPES・MATERIAL_RECIPES に まぜる）─────────────
// 宝の 魔物（宝箱の 魔物・金や 銀の 魔物）
export const TREASURE_KIN = {
  label: '宝の魔物',
  any: ['mimic', 'hitokui_box', 'gold_golem', 'kirakira', 'silver_king', 'gold_pururin'],
};
// D ランク（2）いじょう（「強い 親から」）
const D = 2;
// S の 特定配合: どちらの 親も この レベル いじょう（2ひきで 100。ランクの「1つ上」A → S の 100 と おなじ。companions.js の rankUpNeed）
export const DQM_S_LV = 50;
export const RECIPES_DQM = [
  { a: 'king_pururin', b: 'pururin_knight', child: 'queen_pururin' },
  { a: 'king_pururin', b: TREASURE_KIN, child: 'gold_pururin' },
  { a: { race: 'plant' }, b: { race: 'demon', minRank: D }, child: 'rose_queen' },
  { a: 'venusaur', b: 'chibi_treant', minLv: DQM_S_LV, child: 'yggdra_child' },
  { a: { race: 'undead' }, b: FIRE_KIN, child: 'lantern_ghost' },
  { a: 'gengar', b: 'demon_knight', minLv: DQM_S_LV, child: 'skeleton_king' },
  { a: 'clockwork_knight', b: { race: 'material' }, child: 'killer_karakuri' },
  { a: { race: 'material' }, b: TREASURE_KIN, child: 'hitokui_box' },
  { a: { race: 'demon' }, b: { race: 'slime' }, child: 'petit_devil' },
];

// 素材配合: その 系統の 2ひき ＋ 大事な物（品は なくなる）
export const MATERIAL_RECIPES_DQM = [
  { a: { race: 'spirit' }, b: { race: 'spirit' }, item: 'koyomi_book', child: 'koyomi_spirit' },
  { a: { race: 'dragon' }, b: { race: 'dragon' }, item: 'ryuou_seal', child: 'ryuou_grandson' },
];

// 大事な物 → それで 生まれる 子
export const DQM_KEY_CHILD = { koyomi_book: 'koyomi_spirit', ryuou_seal: 'ryuou_grandson' };
// その 大事な物を もらえるか（まだ 持っていない・その 子を 配合で 生んだ ことが ない。1人 1つ）
//   ひみつのダンジョン 40階の 休み所（data/secret.js の sdKeyRewards）・闘技場の ランク8（world/arena.js の clearRewards）
export function dqKeyDue(c, item) {
  const child = DQM_KEY_CHILD[item];
  if (!child || !c) return false;
  if (Array.isArray(c.keyItems) && c.keyItems.includes(item)) return false;
  return !((c.bestiary?.[child]?.bred || 0) > 0);
}
