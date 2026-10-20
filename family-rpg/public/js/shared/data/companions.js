// なかまに なる モンスター
//
// 紋章の ちから「まもののこころ」に めざめると、たたかいで さいごに たおした まものが
// ときどき おきあがって なかまに なりたがる（ボスや ものがたりの てきは なかまに ならない）
//
// rate:   なかまに なりたがる かくりつ（たたかい 1かいごと）
// growth: レベルごとの のびかた（にんげんの 基本ステータスに かける ばいりつ。職業の mods と おなじ）
// learn:  [レベル, わざID] … レベルが あがると おぼえる
// names:  なかまに なった ときの なまえ（じゅんばんに つかう。酒場で かえられる）
// resist: たいせい（しゅぞくの たいせいを つかう。ここに かけば うわがき）
// gear:   装備できる 物（しゅぞくの けいの RACE_GEAR を うわがき。下の RACE_GEAR を 見てね）

import { FRIENDS_CH2 } from './companions-ch2.js';
import { FRIENDS_RARE } from './monsters-rare.js';
import { FRIENDS_CH3 } from './companions-ch3.js';
import { FRIENDS_R23, RECIPES_R23 } from './monsters-r23.js';
import { FRIENDS_CH4 } from './companions-ch4.js';
import { FRIENDS_CH5 } from './companions-ch5.js';
import { FRIENDS_KUMOI } from './companions-kumoi.js';
import { FRIENDS_HOSHIYOMI } from './companions-hoshiyomi.js';
import { FRIENDS_EARTH } from './companions-earth.js';
import { FRIENDS_PHANTOM } from './companions-phantom.js';
import { FRIENDS_BOSS, MATERIAL_RECIPES, FOUR_RECIPES } from './monsters-boss.js';

export const MONSTER_FRIENDS = {
  pururin: {
    rate: 1 / 10, names: ['ぷるる', 'ぷるお', 'ぷるみ', 'ぷるたろう'],
    growth: { hp: 0.9, mp: 0.85, str: 0.85, def: 0.9, agi: 1.0, mag: 0.9, heal: 1.1 },
    learn: [[1, 'm_tackle'], [3, 'hoimi'], [7, 'mera'], [11, 'sukara'], [15, 'behoimi'], [20, 'merami'], [26, 'behomara']],
    note: 'いやしの呪文を覚えるぷるぷるの仲間。',
  },
  tsunousagi: {
    rate: 1 / 12, names: ['ツノすけ', 'ピョンタ', 'うさみ', 'ツノまる'],
    growth: { hp: 0.9, mp: 0.5, str: 1.05, def: 0.8, agi: 1.35, mag: 0.5, heal: 0.6 },
    learn: [[1, 'm_horn'], [4, 'mikawashi'], [8, 'piorimu'], [12, 'kamaitachi'], [17, 'mawashigeri'], [22, 'issen']],
    note: 'とても素早い。真っ先に飛びこんでいく。',
  },
  kobushi: {
    rate: 1 / 12, names: ['コブシン', 'キノパン', 'こぶりん', 'ナグール'],
    growth: { hp: 1.05, mp: 0.6, str: 1.1, def: 1.0, agi: 0.8, mag: 0.5, heal: 0.8 },
    learn: [[1, 'seiken'], [3, 'm_sleep_powder'], [7, 'kiarii'], [11, 'bakuretsu'], [16, 'kiaitame'], [22, 'hyakuretsu']],
    note: 'こぶしの技が得意なキノコ。',
  },
  koumorin: {
    rate: 1 / 14, names: ['コウモン', 'バッティ', 'ぱたぱた', 'よるまる'],
    growth: { hp: 0.85, mp: 0.8, str: 0.95, def: 0.8, agi: 1.3, mag: 0.9, heal: 0.7 },
    learn: [[1, 'm_drain'], [4, 'manusa'], [8, 'm_gust'], [12, 'bagi'], [18, 'bagima']],
    note: '敵のHPを吸い取る。風の呪文も覚える。',
  },
  goblin: {
    rate: 1 / 16, names: ['ゴブたろう', 'ゴブリー', 'いたずらっこ', 'ゴブすけ'],
    growth: { hp: 1.05, mp: 0.6, str: 1.15, def: 1.0, agi: 0.95, mag: 0.6, heal: 0.6 },
    learn: [[1, 'm_rock_throw'], [4, 'chikaratame'], [8, 'm_boulder'], [13, 'medapani'], [18, 'm_stomp']],
    note: '力持ちのいたずら者。',
  },
  pururin_beth: {
    rate: 1 / 14, names: ['ベス', 'ほのか', 'あかぷる', 'ベスたろう'],
    growth: { hp: 0.95, mp: 1.2, str: 0.8, def: 0.9, agi: 1.0, mag: 1.25, heal: 1.0 },
    learn: [[1, 'mera'], [4, 'hoimi'], [8, 'gira'], [12, 'merami'], [17, 'begirama'], [23, 'merazoma']],
    note: '炎の呪文が得意な赤いぷるりん。',
  },
  frog: {
    rate: 1 / 16, names: ['ケロッタ', 'ゲコすけ', 'どくみ', 'ケロまる'],
    growth: { hp: 1.0, mp: 0.8, str: 1.0, def: 0.95, agi: 1.05, mag: 0.9, heal: 0.8 },
    learn: [[1, 'm_poison_lick'], [4, 'kiarii'], [8, 'hyado'], [12, 'm_poison_spray'], [17, 'hyadaruko']],
    note: '毒に強いカエル。氷の呪文も使う。',
  },
  nemuri: {
    rate: 1 / 16, names: ['スヤリン', 'ねむこ', 'まくらん', 'ふわり'],
    growth: { hp: 1.1, mp: 1.1, str: 0.85, def: 1.05, agi: 0.7, mag: 0.9, heal: 1.2 },
    learn: [[1, 'm_sweet_breath'], [4, 'hoimi'], [8, 'rariho'], [13, 'behoimi'], [18, 'kiariku'], [24, 'zao']],
    note: '敵をねむらせる。いやしの力も強い。',
  },
  wolf: {
    rate: 1 / 18, names: ['ガルル', 'シルバ', 'ウルフィ', 'はやて'],
    growth: { hp: 1.05, mp: 0.5, str: 1.2, def: 0.95, agi: 1.35, mag: 0.5, heal: 0.6 },
    learn: [[1, 'm_bite'], [5, 'm_warcry'], [9, 'kamaitachi'], [14, 'mouko'], [20, 'issen']],
    note: 'するどいキバのおおかみ。おたけびでみんなを奮い立たせる。',
  },
  lamp: {
    rate: 1 / 18, names: ['ランプル', 'ともしび', 'ほむら', 'ポッポ'],
    growth: { hp: 0.85, mp: 1.35, str: 0.7, def: 0.85, agi: 1.05, mag: 1.4, heal: 0.8 },
    learn: [[1, 'mera'], [4, 'gira'], [8, 'merami'], [12, 'begirama'], [18, 'merazoma'], [24, 'm_fire_breath']],
    note: '炎のせいれい。攻撃呪文の威力が高い。',
  },
  hedoron: {
    rate: 1 / 18, names: ['ヘドロン', 'どろすけ', 'ぬまお', 'べとべと'],
    growth: { hp: 1.25, mp: 0.7, str: 1.0, def: 1.1, agi: 0.7, mag: 0.7, heal: 0.9 },
    learn: [[1, 'm_poison_spray'], [5, 'm_harden'], [9, 'hoimi'], [14, 'm_poison_lick'], [19, 'behoimi']],
    note: 'HPが多くしぶとい。毒をまき散らす。',
  },
  armor_crab: {
    rate: 1 / 20, names: ['カニタ', 'ガニー', 'はさみん', 'よろいまる'],
    growth: { hp: 1.15, mp: 0.5, str: 1.1, def: 1.45, agi: 0.75, mag: 0.5, heal: 0.6 },
    learn: [[1, 'm_pinch'], [4, 'm_harden'], [8, 'kabau'], [12, 'sukuruto'], [18, 'nioudachi']],
    note: '固いこうらで仲間を守る。',
  },
  ice_pururin: {
    rate: 1 / 18, names: ['ヒャドりん', 'ゆきみ', 'つららん', 'ひえぷる'],
    growth: { hp: 0.95, mp: 1.2, str: 0.8, def: 1.0, agi: 1.05, mag: 1.25, heal: 1.05 },
    learn: [[1, 'hyado'], [4, 'hoimi'], [9, 'hyadaruko'], [14, 'behoimi'], [19, 'sukuruto']],
    note: '氷の呪文が得意な冷たいぷるりん。',
  },
  crow: {
    rate: 1 / 20, names: ['カーすけ', 'クロウ', 'はばたき', 'くろまる'],
    growth: { hp: 0.95, mp: 0.8, str: 1.1, def: 0.85, agi: 1.35, mag: 0.9, heal: 0.6 },
    learn: [[1, 'm_peck'], [4, 'm_gust'], [8, 'bagi'], [13, 'piorimu'], [18, 'bagima']],
    note: '空からつつく素早いカラス。',
  },
  skeleton: {
    rate: 1 / 18, names: ['ホネゾウ', 'カラコロ', 'ボーン', 'しろほね'],
    growth: { hp: 1.1, mp: 0.6, str: 1.25, def: 1.1, agi: 0.9, mag: 0.5, heal: 0.5 },
    learn: [[1, 'm_swing'], [5, 'chikaratame'], [10, 'm_glare'], [15, 'mawashigeri'], [21, 'tamashii']],
    note: '剣のうでが立つがいこつ。攻撃力が高い。',
  },
  dark_bat: {
    rate: 1 / 16, names: ['ヤミー', 'くらやみ', 'ノクト', 'バット'],
    growth: { hp: 0.95, mp: 1.0, str: 1.05, def: 0.85, agi: 1.35, mag: 1.0, heal: 0.7 },
    learn: [[1, 'm_drain'], [4, 'manusa'], [9, 'm_dark_bolt'], [14, 'rukani'], [19, 'mahoton']],
    note: '暗闇の力を使うこうもり。',
  },
  rockman: {
    rate: 1 / 22, names: ['ゴロン', 'いわお', 'ガンさん', 'ロック'],
    growth: { hp: 1.4, mp: 0.4, str: 1.3, def: 1.4, agi: 0.6, mag: 0.4, heal: 0.5 },
    learn: [[1, 'm_boulder'], [4, 'm_harden'], [9, 'kabau'], [14, 'm_stomp'], [20, 'm_avalanche']],
    note: 'とても固くて力持ち。動きはおそい。',
  },
  shadow_mage: {
    rate: 1 / 32, names: ['カゲロウ', 'シャドー', 'よみ', 'ゆらぎ'],
    growth: { hp: 0.95, mp: 1.35, str: 0.8, def: 0.9, agi: 1.0, mag: 1.3, heal: 1.2 },
    learn: [[1, 'gira'], [3, 'hoimi'], [7, 'rukani'], [11, 'begirama'], [15, 'behoimi'], [20, 'zao'], [25, 'iora']],
    note: '闇から解き放たれた魔法使い。攻撃も回復もできる。',
  },
  kirakira: {
    rate: 1 / 40, names: ['キラリン', 'ぎんちゃん', 'ピカ', 'メタリン'],
    growth: { hp: 0.7, mp: 1.0, str: 0.9, def: 2.0, agi: 1.8, mag: 1.0, heal: 1.0 },
    learn: [[1, 'mera'], [3, 'hoimi'], [6, 'piorimu'], [10, 'merami'], [15, 'io'], [20, 'behoimi'], [25, 'iora']],
    resist: { sleep: 0.5, poison: 0.5, confuse: 0.5 },
    note: 'めったに仲間にならない銀色のぷるりん。とても固くて素早い！',
  },
};

// ───────────── モンスターの なかまの 装備（ドラクエ5 ふう）─────────────
// しゅぞくの けい（monsters.js の race）ごとに 装備できる 物。しゅぞくごとの ちがいは MONSTER_FRIENDS の gear で うわがき
//   weapons: 持てる 武器の 種類（items.js の cat）。[] は 武器を 持たない（からだで たたかう）
//   armor:   着られる よろいの 種類（items.js の armorType。cloth=服 heavy=重いよろい robe=ローブ gi=道着）
//   shield:  たてを 持てるか
//   head:    頭の 装備（false: なし / 'hat': ぼうし だけ / 'helm': かぶとも）
//   アクセサリーは だれでも
export const RACE_GEAR = {
  slime: { weapons: [], armor: ['cloth'], shield: false, head: 'hat' },
  beast: { weapons: ['claw'], armor: ['cloth'], shield: false, head: 'hat' },
  plant: { weapons: ['whip', 'staff'], armor: ['cloth', 'robe'], shield: false, head: 'hat' },
  spirit: { weapons: ['staff', 'fan', 'boomerang'], armor: ['cloth', 'robe'], shield: false, head: 'hat' },
  undead: { weapons: ['sword', 'dagger', 'axe'], armor: ['cloth', 'heavy'], shield: true, head: 'helm' },
  material: { weapons: ['axe', 'claw'], armor: ['cloth', 'heavy'], shield: true, head: 'helm' },
  demon: { weapons: ['sword', 'axe', 'spear', 'dagger'], armor: ['cloth', 'heavy'], shield: true, head: 'helm' },
  dragon: { weapons: ['claw'], armor: ['cloth', 'heavy'], shield: false, head: 'helm' },
};
// 知らない しゅぞく（アクセサリー だけ）
const NO_GEAR = { weapons: [], armor: [], shield: false, head: false };

// しゅぞくごとの うわがき（ぜんぶ 書かなくても よい）。ファイルの さいごで MONSTER_FRIENDS の gear に 入れる
// （あたらしい しゅぞくは MONSTER_FRIENDS の gear に じかに 書いても よい: monsters-rare.js）
const GEAR = {
  // 呪文の とくいな ぷるりんは ローブも
  pururin_beth: { armor: ['cloth', 'robe'] },
  ice_pururin: { armor: ['cloth', 'robe'] },
  marine_slime: { armor: ['cloth', 'robe'] },
  fuwari: { armor: ['cloth', 'robe'] },
  // キングぷるりんは かんむりが あるので 頭は なし。大きな からだに 重いよろい
  king_pururin: { armor: ['cloth', 'heavy'], head: false },
  // こぶしで たたかう キノコ（こぶしの 技が つかえる ツメ だけ）
  kobushi: { weapons: ['claw'], armor: ['cloth', 'gi'] },
  // ゴブリンは 石の オノや ナイフ
  goblin: { weapons: ['axe', 'dagger', 'claw', 'boomerang'], armor: ['cloth', 'gi'], head: 'hat' },
  // かたい こうらの カニ: ハサミ（ツメ）と たて・重いよろい
  armor_crab: { armor: ['cloth', 'heavy'], shield: true, head: false },
  // まほうつかい
  shadow_mage: { weapons: ['staff', 'dagger'], armor: ['cloth', 'robe'], shield: false, head: 'hat' },
  // ほしの もようの けもの: 道着も
  star_panther: { armor: ['cloth', 'gi'] },
  // 悪魔の騎士: 剣・オノ・やりと たて・かぶと・重いよろい
  demon_knight: { weapons: ['sword', 'axe', 'spear'] },
  // ヤドカリの 騎士: やりと ハサミ・たて・かぶと・重いよろい
  shell_knight: { weapons: ['spear', 'claw'], armor: ['cloth', 'heavy'], shield: true, head: 'helm' },
  // 海へびは 手が ないので 武器は もたない
  sea_serpent: { weapons: [] },
  // 海賊の ゆうれい: 船長の ぼうし
  ghost_pirate: { armor: ['cloth'], shield: false, head: 'hat' },
  // 嵐の兵: 剣と やり
  storm_soldier: { weapons: ['sword', 'spear'] },
};

// その しゅぞくが 装備できる 物（race: その しゅぞくの けい。data どうしの じゅんかんを さける ため MONSTERS は よまない）
// 知らない しゅぞく（MONSTER_FRIENDS に ない）は アクセサリー だけ
export function gearOf(species, race) {
  const f = MONSTER_FRIENDS[species];
  if (!f) return { ...NO_GEAR };
  return { ...(RACE_GEAR[race] || NO_GEAR), ...(f.gear || {}) };
}

// なかまに できる かず（酒場で まっている なかまも ふくむ）
export const ROSTER_MAX = 40;
// いっしょに ぼうけんできる なかまの かず（じぶんを のぞく）
export const COMPANION_SLOTS = 3;

// モンスターの なかまの 「からだの つよさ」（ぶきや よろいが なくても たたかえる。装備の ぶんは この 上に たす）
export function monsterNatural(level) {
  const L = level - 1;
  return { atk: 4 + 1.4 * L, dfn: 4 + 1.5 * L, mag: 1.5 + 1.0 * L, heal: 1.5 + 1.0 * L };
}

// ───────────── はいごうで うまれる まもの ─────────────
// breedOnly: やせいには いない（たおしても なかまに ならない。はいごう だけ）
Object.assign(MONSTER_FRIENDS, {
  king_pururin: {
    rate: 0, breedOnly: true, names: ['キングぷるる', 'おうさま', 'ぷるキング', 'だいおう'],
    growth: { hp: 1.3, mp: 1.1, str: 1.1, def: 1.15, agi: 0.9, mag: 1.1, heal: 1.2 },
    learn: [[1, 'm_tackle'], [4, 'behoimi'], [8, 'm_king_press'], [12, 'io'], [16, 'behomara'], [22, 'iora']],
    note: 'ぷるりんたちの王さま。体が大きくHPがとても多い。',
  },
  fuwari: {
    rate: 0, breedOnly: true, names: ['ふわり', 'クラゲっち', 'ぷかぷか', 'ほいみん'],
    growth: { hp: 0.95, mp: 1.3, str: 0.8, def: 0.95, agi: 1.2, mag: 1.0, heal: 1.45 },
    learn: [[1, 'hoimi'], [3, 'kiarii'], [6, 'behoimi'], [10, 'kiariku'], [14, 'zao'], [18, 'behomara'], [24, 'sg_behoma']],
    note: '回復が得意なふわふわの仲間。',
  },
  chibi_dragon: {
    rate: 0, breedOnly: true, names: ['ドラコ', 'ちびドラ', 'リュウタ', 'ほむら'],
    growth: { hp: 1.2, mp: 0.8, str: 1.25, def: 1.1, agi: 1.05, mag: 0.9, heal: 0.7 },
    learn: [[1, 'm_bite'], [4, 'm_fire_breath'], [8, 'm_dragon_claw'], [12, 'm_warcry'], [16, 'm_blaze'], [22, 'dk_ikari']],
    note: '炎をはく小さなドラゴン。育つととても強くなる。',
  },
  golem: {
    rate: 0, breedOnly: true, names: ['ゴーレム', 'ガンセキ', 'いわまる', 'ストーン'],
    growth: { hp: 1.5, mp: 0.4, str: 1.3, def: 1.55, agi: 0.55, mag: 0.4, heal: 0.5 },
    learn: [[1, 'm_boulder'], [4, 'm_harden'], [8, 'kabau'], [12, 'm_stomp'], [16, 'gd_wall'], [22, 'm_avalanche']],
    note: '岩のきょじん。とても固くて力持ち。',
  },
  star_panther: {
    rate: 0, breedOnly: true, names: ['ほしまる', 'パンサー', 'きらり', 'シリウス'],
    growth: { hp: 1.1, mp: 0.6, str: 1.3, def: 1.0, agi: 1.55, mag: 0.6, heal: 0.6 },
    learn: [[1, 'm_pounce'], [4, 'piorimu'], [8, 'kamaitachi'], [12, 'm_dragon_claw'], [16, 'mouko'], [22, 'gh_shinsoku']],
    note: '背中に星の模様がある速いけもの。',
  },
  demon_knight: {
    rate: 0, breedOnly: true, names: ['デモンナイト', 'くろきし', 'ゼクス', 'ヤミまる'],
    growth: { hp: 1.15, mp: 0.8, str: 1.35, def: 1.2, agi: 1.0, mag: 0.9, heal: 0.5 },
    learn: [[1, 'm_darkslash'], [4, 'chikaratame'], [8, 'm_glare'], [12, 'ms_soul'], [16, 'tamashii'], [24, 'sm_jigo']],
    note: '闇のよろいをまとった騎士。剣のうでが立つ。',
  },
  chibi_treant: {
    rate: 0, breedOnly: true, names: ['もりっこ', 'きのめ', 'トレン', 'みどり'],
    growth: { hp: 1.3, mp: 1.0, str: 0.95, def: 1.2, agi: 0.6, mag: 0.8, heal: 1.35 },
    learn: [[1, 'm_root_heal'], [4, 'hoimi'], [8, 'm_branch_whip'], [12, 'behoimi'], [16, 'm_pollen'], [22, 'behomara']],
    note: '森の主の子ども。体をいやす力がある。',
  },
});

// ───────────── はいごう（ドラゴンクエストモンスターズ ふう） ─────────────
// レベル10いじょうの なかま 2ひきから あたらしい なかまが うまれる（おやは いなくなる）
// ・うまれた こは レベル1から。おやの つよさの 1/4ずつを うけつぎ、おやの わざを 4つまで おぼえられる
// ・「＋」（プラス）が つき、そだつと ふつうより つよくなる・レベルの 上限も 上がる
// ・うまれる こは 両方の おやで きまり、候補が 2つ いじょうなら えらべる。下の breedCandidates・breedOutcome
// 第2章の なかま
Object.assign(MONSTER_FRIENDS, FRIENDS_CH2);
// めずらしい 強い 魔物（ぷるりん騎士・ヴァルドラゴン など。gear も そこに ある）
Object.assign(MONSTER_FRIENDS, FRIENDS_RARE);
// 第3章の なかま
Object.assign(MONSTER_FRIENDS, FRIENDS_CH3);
// あたらしい 仲間モンスター（monsters-r23.js。gear も そこに ある）
Object.assign(MONSTER_FRIENDS, FRIENDS_R23);
// 第4章・夜の 魔物（2026年10月 見なおし。前は 仲間に ならなかった）
Object.assign(MONSTER_FRIENDS, FRIENDS_CH4);
// 第5章 Step 2「星の塔」の 魔物（companions-ch5.js）
Object.assign(MONSTER_FRIENDS, FRIENDS_CH5);
// 第5章 Step 3・4 の 魔物（companions-kumoi.js）
Object.assign(MONSTER_FRIENDS, FRIENDS_KUMOI);
// 第5章 Step 5 の 魔物（companions-hoshiyomi.js）
Object.assign(MONSTER_FRIENDS, FRIENDS_HOSHIYOMI);
// 第5章 Step 6・7 の 魔物（companions-earth.js）
Object.assign(MONSTER_FRIENDS, FRIENDS_EARTH);
// 第5章 Step 8 の 影の城の 魔物（companions-phantom.js）
Object.assign(MONSTER_FRIENDS, FRIENDS_PHANTOM);
// ボス級（ランク SS）の 仲間。配合でしか 生まれない（monsters-boss.js。第35回）
Object.assign(MONSTER_FRIENDS, FRIENDS_BOSS);
// しゅぞくごとの 装備の うわがき（上の GEAR）
for (const [sp, g] of Object.entries(GEAR)) if (MONSTER_FRIENDS[sp]) MONSTER_FRIENDS[sp].gear = { ...g, ...(MONSTER_FRIENDS[sp].gear || {}) };

// 図鑑の「仲間になりやすさ」: rate（1回の 戦いで 仲間に なりたがる かくりつ）を 4つに わける。
// （はじめての 魔物の 仲間・魔物使いや モンスターマスターが いる ときは、ここより なりやすい。world/party.js の rollBefriend）
export const JOIN_TIERS = [
  { min: 1 / 12, level: 4, text: '仲間になりやすい' },
  { min: 1 / 18, level: 3, text: 'ときどき仲間になる' },
  { min: 1 / 28, level: 2, text: 'なかなか仲間にならない' },
  { min: 0, level: 1, text: '滅多に仲間にならない' },
];

// その 魔物の 仲間に なりやすさ（仲間に ならない・配合でしか 生まれない ときは null）
export function joinTier(species) {
  const f = MONSTER_FRIENDS[species];
  if (!f || f.breedOnly || !(f.rate > 0)) return null;
  return JOIN_TIERS.find((t) => f.rate >= t.min - 1e-9);
}

export const BREED_MIN_LEVEL = 10;
export const BREED_INHERIT_MAX = 4;

export const RACE_NAMES = {
  slime: 'スライム系', beast: 'けもの系', plant: '植物系', spirit: 'せいれい系', demon: '悪魔系',
  undead: 'ゾンビ系', material: '物質系', dragon: 'ドラゴン系', human: '人間',
};


// ───────────── 配合の きまり（ドラゴンクエストモンスターズ ふう。第35回で 作りなおし） ─────────────
// 家族の ねがい「強くしたいだけなのに、配合で 弱く なる」「親を えらぶ 順番で 子が かわるのは ややこしい」から:
// ・ランク（F→E→D→C→B→A→S→SS→★）。子の ランクは 高いほうの 親と 同じか 1つ上（下がらない）
// ・子の 候補は 両方の 親で きまる（どちらを 1ぴきめに しても 同じ 子・同じ 候補・同じ ならび）。候補が 2つ いじょうなら 自分で えらぶ
//   （前の「図鑑に ない 魔物を 先に」は やめた。見たことが ない 子には 目じるし）
// ・能力の 受けつぎ（両親の 今の 能力の 1/4ずつ）と 生まれる 前の めやすは shared/breed-calc.js
// 配合の しゅるい（kind）:
//   'four'     4体配合 … 両親と 祖父母が みんな その しゅぞく（monsters-boss.js の FOUR_RECIPES）
//   'material' 素材配合 … ボスの 品 ＋ S ランク 2ひき（MATERIAL_RECIPES。品が ふくろに ある とき だけ。配合すると なくなる）
//   'rank'     ランク配合 … S ランクで レベル RANK_BREED_LV いじょうの 2ひき → どちらかの 親と 同じ 系統の ボス級（SS）
//   'special'  特定配合 … しゅぞくID が 入った 組み合わせ（BREED_RECIPES）
//   'recipe'   系統どうしの 組み合わせ（例: スライム系 ＋ スライム系 → キングぷるりん）
//   'same'     新生配合 … 同じ しゅぞく 2ひき → 同じ しゅぞく（＋が 大きく 上がる。弱く ならない 道）
//   'parent'   ランクの 高いほうの 親と 同じ しゅぞく
//   'family'   系統配合 … 両方の 親の 系統の 魔物のうち、ランクが 高いほうの 親と 同じ（親を 育てると 1つ上も）
export const RANKS = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', '★'];
const RANK_S = 6;
// ランクの きめかた: しゅぞくの lv が この 数 いか → F, E, D, C, B, A。それより 上は S。MONSTER_FRIENDS の rank が あれば それ
const RANK_LV = [4, 9, 15, 22, 30, 38];
// lv の さかいめで 親より 下に なる 特定配合の 子（いかずちタイガーは 星形パンサーから 生まれるので 同じ C）
const RANK_FIX = { ikazuchi_tiger: 'C' };
export function rankIdx(sp, MONSTERS) {
  const r = MONSTER_FRIENDS[sp]?.rank || RANK_FIX[sp];
  if (r && RANKS.includes(r)) return RANKS.indexOf(r);
  const lv = MONSTERS[sp]?.lv || 1;
  const i = RANK_LV.findIndex((x) => lv <= x);
  return i < 0 ? RANK_S : i;
}
export const rankOf = (sp, MONSTERS) => RANKS[rankIdx(sp, MONSTERS)];

// レベルの 上限: ランク F で Lv50、ランクが 1つ上がるごとに +5（SS で 85）、＋1 ごとに +1。max（今は 99）は こえない
// 第35回より 前から いる 仲間（ranked が ない）は 今までどおり max まで（下がらない ように）
export const LV_CAP_BASE = 50;
export const LV_CAP_RANK = 5;
export function monsterLevelCap(ch, MONSTERS, max = 99) {
  if (!ch?.species || !ch.ranked) return max;
  return Math.max(1, Math.min(max, LV_CAP_BASE + LV_CAP_RANK * rankIdx(ch.species, MONSTERS) + Math.floor(ch.plus || 0)));
}

// 特定配合（しゅぞくID が 入った 組み合わせ）・系統どうしの 組み合わせ
// a・b: しゅぞくID か { race, flying, minRank } の じょうけん（どちらが 1ぴきめでも よい）
// 第35回: 第4章・第5章の 強い 魔物も 配合で 生まれる ように（親は 1つ下の ランクから）
const RECIPES_R35 = [
  { a: 'thunder_dragon', b: 'thunder_puff', child: 'cloud_wyvern' },
  { a: 'aurora_spirit', b: 'water_spirit', child: 'star_jelly' },
  { a: 'archmage', b: 'trick_mirror', child: 'gazer_eye' },
  { a: 'water_dragon', b: 'comet_bird', child: 'sky_serpent' },
  { a: 'mole_miner', b: 'sandstone_golem', child: 'rock_mole' },
  { a: 'mummy_soldier', b: 'castle_armor', child: 'haniwa_soldier' },
  { a: 'lamp', b: 'archmage', child: 'lamp_genie' },
];
export const BREED_RECIPES = [
  { a: 'wolf', b: 'kirakira', child: 'star_panther' },
  { a: 'rockman', b: 'armor_crab', child: 'golem' },
  // めずらしい 強い 魔物（monsters-rare.js）
  { a: 'chibi_dragon', b: { race: 'dragon' }, child: 'great_dragon' },
  { a: 'demon_knight', b: { race: 'dragon' }, child: 'axe_rider' },
  { a: 'star_panther', b: 'thunder_imp', child: 'ikazuchi_tiger' },
  { a: { race: 'slime' }, b: 'skeleton', child: 'pururin_knight' },
  { a: { race: 'material' }, b: 'skeleton', child: 'clockwork_knight' },
  { a: { race: 'material' }, b: { race: 'material' }, child: 'golem' },
  { a: 'pururin', b: { flying: true }, child: 'fuwari' },
  { a: { race: 'beast', flying: false }, b: 'lamp', child: 'chibi_dragon' },
  { a: { race: 'undead' }, b: { race: 'demon' }, child: 'demon_knight' },
  { a: { race: 'slime' }, b: { race: 'slime' }, child: 'king_pururin' },
  { a: { race: 'plant' }, b: { race: 'plant' }, child: 'chibi_treant' },
  // あたらしい 仲間モンスター（monsters-r23.js）
  ...RECIPES_R23,
  ...RECIPES_R35,
];
export { MATERIAL_RECIPES, FOUR_RECIPES };

function specMatch(spec, sp, MONSTERS) {
  if (typeof spec === 'string') return spec === sp;
  const m = MONSTERS[sp];
  if (!m) return false;
  if (spec.race && m.race !== spec.race) return false;
  if (spec.flying !== undefined && !!m.flying !== spec.flying) return false;
  if (spec.minRank !== undefined && rankIdx(sp, MONSTERS) < spec.minRank) return false;
  return true;
}

// 特定配合（しゅぞくID が 入った 組み合わせ）か
const isSpecialRecipe = (r) => typeof r.a === 'string' || typeof r.b === 'string';
const recipeMatch = (r, spA, spB, MONSTERS) =>
  (specMatch(r.a, spA, MONSTERS) && specMatch(r.b, spB, MONSTERS)) || (specMatch(r.a, spB, MONSTERS) && specMatch(r.b, spA, MONSTERS));

// その 系統で 系統配合から 生まれる ことが ある 魔物（仲間に なる 魔物。ボス・メタル・きまった 組み合わせ だけの 魔物は のぞく）
export function familyPool(race, MONSTERS) {
  return Object.keys(MONSTER_FRIENDS).filter((sp) => {
    const m = MONSTERS[sp];
    return m && m.race === race && !m.boss && !m.metal && !MONSTER_FRIENDS[sp].recipeOnly && !MONSTER_FRIENDS[sp].noFamily;
  });
}

// ボス級（ランク SS）の 仲間（monsters-boss.js）
export function bossClassList(MONSTERS) {
  return Object.keys(MONSTER_FRIENDS).filter((sp) => MONSTER_FRIENDS[sp].rank === 'SS' && MONSTERS[sp]);
}

const lvOf = (x) => (Number.isFinite(x?.level) ? x.level : BREED_MIN_LEVEL);
const plusOf = (x) => Math.max(0, Math.floor(x?.plus || 0));
// 1つ上の ランクの 子も 候補に 入る（親を 育てると）: 両親の レベルの 合計 ＋ ＋の 合計の 半分 が この 数 いじょう
//   F どうし Lv10＋Lv10 → E も。ランクが 1つ上がるごとに 8 ふえる（A どうしで S を ねらうなら Lv30＋Lv30）
export const rankUpNeed = (hi) => 20 + 8 * hi;
export const rankUpOk = (a, b, hi) => lvOf(a) + lvOf(b) + Math.floor((plusOf(a) + plusOf(b)) / 2) >= rankUpNeed(hi);
// ランク配合（S × S → SS）の 親の レベル
export const RANK_BREED_LV = 30;

// ふくろに その 品が あるか（装備して いる 物は 数えない。c が ない ときは ない もの と する）
const hasItem = (c, id) => Array.isArray(c?.items) && c.items.some((e) => e && e.id === id && e.n > 0);
// その 親が 4体配合の 親に なれるか（両親が みんな sp）
const fourOk = (x, sp) => x.species === sp && Array.isArray(x.lineage?.p) && x.lineage.p.length === 2 && x.lineage.p.every((p) => p === sp);

// ならびの じゅん: きまった 組み合わせ → 新生配合 → そのほか（ランクの 高い じゅん → 強い じゅん → ID）。親より ランクの 低い 子は さいご
const KIND_PRI = { four: 0, material: 0, rank: 0, special: 1, recipe: 1, same: 2, parent: 3, family: 3 };
export const SPECIAL_KINDS = ['four', 'material', 'rank', 'special', 'recipe'];

// 生まれる 子の 候補（a・b は { species, level, plus, lineage }。c … 品を もつ キャラ）
//   list: しゅぞくID の ならび（いちばん 上が おすすめ）/ items: { sp, kind, rank, item? } / hi: 高いほうの 親の ランク / up: 1つ上の ランクも 入るか
//   どちらを 1ぴきめに しても 同じ（両方の 親の 系統・組み合わせは どちら向きでも・さいごに ならびなおす）
export function breedCandidates(a, b, MONSTERS, c = null) {
  const spA = a.species, spB = b.species;
  const ra = rankIdx(spA, MONSTERS), rb = rankIdx(spB, MONSTERS);
  const hi = Math.max(ra, rb);
  const up = rankUpOk(a, b, hi);
  const found = new Map();
  const add = (sp, kind, extra = {}) => {
    if (!MONSTERS[sp] || !MONSTER_FRIENDS[sp] || found.has(sp)) return;
    found.set(sp, { sp, kind, rank: rankIdx(sp, MONSTERS), ...extra });
  };
  for (const r of FOUR_RECIPES) if (fourOk(a, r.all) && fourOk(b, r.all)) add(r.child, 'four');
  for (const r of MATERIAL_RECIPES) if (hasItem(c, r.item) && recipeMatch(r, spA, spB, MONSTERS)) add(r.child, 'material', { item: r.item });
  if (ra >= RANK_S && rb >= RANK_S && lvOf(a) >= RANK_BREED_LV && lvOf(b) >= RANK_BREED_LV) {
    const races = [MONSTERS[spA]?.race, MONSTERS[spB]?.race];
    // materialOnly … 素材配合でしか 生まれない ボス級（影の王。monsters-boss.js）
    for (const sp of bossClassList(MONSTERS)) if (races.includes(MONSTERS[sp].race) && !MONSTER_FRIENDS[sp].materialOnly) add(sp, 'rank');
  }
  for (const r of BREED_RECIPES) if (isSpecialRecipe(r) && recipeMatch(r, spA, spB, MONSTERS)) add(r.child, 'special');
  for (const r of BREED_RECIPES) if (!isSpecialRecipe(r) && recipeMatch(r, spA, spB, MONSTERS)) add(r.child, 'recipe');
  if (spA === spB) add(spA, 'same');
  const ranks = up ? [hi, hi + 1] : [hi];
  for (const race of new Set([MONSTERS[spA]?.race, MONSTERS[spB]?.race])) {
    if (!race) continue;
    for (const sp of familyPool(race, MONSTERS)) if (ranks.includes(rankIdx(sp, MONSTERS))) add(sp, 'family');
  }
  for (const sp of [spA, spB]) if (rankIdx(sp, MONSTERS) === hi) add(sp, 'parent');
  const items = [...found.values()].sort((x, y) => (x.rank < hi) - (y.rank < hi) || KIND_PRI[x.kind] - KIND_PRI[y.kind]
    || y.rank - x.rank || (MONSTERS[y.sp].lv || 0) - (MONSTERS[x.sp].lv || 0) || (x.sp < y.sp ? -1 : x.sp > y.sp ? 1 : 0));
  return { list: items.map((x) => x.sp), items, hi, up };
}

// 図鑑で その 魔物を どこまで 知っているか（0: 見たことがない / 1: 見たことは ある / 2: 仲間に したことが ある）
// c … キャラ（bestiary・kills。図鑑と おなじ 数えかた）。c が ない ときは みんな 0（見たことがない）
export function bestiaryKnow(c) {
  if (typeof c === 'function') return c;
  const bs = c?.bestiary || {}, kills = c?.kills || {};
  return (sp) => {
    const b = bs[sp] || {};
    if ((b.friend || 0) > 0 || (b.bred || 0) > 0) return 2;
    if ((b.seen || 0) > 0 || (kills[sp] || 0) > 0) return 1;
    return 0;
  };
}

// うまれる こどもの「＋」: 両親の ＋の 合計÷2 ＋ 両親の レベルで 少し（新生配合〈same〉は 大きく）
export function breedPlus(a, b, same = false) {
  const base = Math.floor((plusOf(a) + plusOf(b)) / 2);
  const L = lvOf(a) + lvOf(b);
  return Math.min(99, base + (same ? Math.max(5, Math.floor(L / 5)) : Math.max(1, Math.floor(L / 10))));
}

// どんな まものが うまれるか（おすすめ〈いちばん 上〉の 子。MONSTERS を わたす: data どうしの じゅんかんを さける）
export function breedResult(spA, spB, MONSTERS, c = null) {
  return breedOutcome({ species: spA, level: BREED_MIN_LEVEL }, { species: spB, level: BREED_MIN_LEVEL }, MONSTERS, c).child;
}

// うまれる こ。a・b は { species, level, plus, lineage }、c は 図鑑と ふくろを もつ キャラ、pick は えらんだ 子（なければ おすすめ）
// サーバーの はいごう（world/breed.js）と、酒場の 一覧の みほん（client/ui/services.js）で つかう
//   child: 生まれる しゅぞく / ok: pick が 候補に あったか / plus: 「＋」/ rank: ランク / kind: 上の 配合の しゅるい / item: 使う 品
//   special: 親と ちがう しゅぞく / unseen: 図鑑に のっていない / firstFriend: はじめて 仲間に なる
//   count・unseenCount: 候補の 数・その うち 図鑑に のっていない 数 / list・items: 候補（breedCandidates）
export function breedOutcome(a, b, MONSTERS, c = null, pick = null) {
  const know = bestiaryKnow(c);
  const cand = breedCandidates(a, b, MONSTERS, c);
  const it = (pick && cand.items.find((x) => x.sp === pick)) || cand.items[0];
  const child = it.sp;
  const k = know(child);
  return {
    child, ok: !pick || it.sp === pick, kind: it.kind, item: it.item || null, rank: RANKS[it.rank], low: it.rank < cand.hi,
    plus: breedPlus(a, b, it.kind === 'same'), special: child !== a.species && child !== b.species,
    unseen: k === 0, firstFriend: k < 2,
    count: cand.list.length, unseenCount: cand.list.filter((sp) => know(sp) === 0).length,
    list: cand.list, items: cand.items, hi: RANKS[cand.hi], up: cand.up,
  };
}

// ずかんの ヒント（例: 「スライム系 ＋ スライム系」）。系統配合だけで 生まれる 魔物は「植物系 ＋ どの魔物でも（強い親から）」
// ボス級（SS）は 名前を 出さない（図鑑では ？？？）
export function recipeHint(child, MONSTERS) {
  if (MONSTER_FRIENDS[child]?.rank === 'SS') return 'ボスの品 ＋ Sランク2ひき（配合でしか会えない）';
  const r = BREED_RECIPES.find((x) => x.child === child);
  const nm = (spec) => (typeof spec === 'string' ? MONSTERS[spec]?.name : spec.flying ? '空を飛ぶ魔物' : RACE_NAMES[spec.race] || '？');
  if (r) return `${nm(r.a)} ＋ ${nm(r.b)}`;
  const f = MONSTER_FRIENDS[child];
  if (f?.breedOnly && !f.recipeOnly && MONSTERS[child]) return `${RACE_NAMES[MONSTERS[child].race]} ＋ どの魔物でも（強い親から）`;
  return '';
}

// 酒場の うわさ: まだ 見たことがない 配合だけの 魔物の ヒント（弱い じゅんに n こ）
export function breedRumors(c, MONSTERS, n = 3) {
  const know = bestiaryKnow(c);
  return Object.keys(MONSTER_FRIENDS)
    .filter((sp) => MONSTER_FRIENDS[sp].breedOnly && MONSTERS[sp] && know(sp) === 0)
    .sort((x, y) => MONSTERS[x].lv - MONSTERS[y].lv)
    .slice(0, n)
    .map((sp) => recipeHint(sp, MONSTERS))
    .filter(Boolean);
}

// ずかんの ならび: ふつうの まもの（つよさじゅん）→ はいごう だけの まもの（つよさじゅん）→ ボス（client/ui/menu.js）
export function bestiaryOrder(MONSTERS) {
  const all = Object.keys(MONSTERS);
  const byLv = (a, b) => (MONSTERS[a].lv || 0) - (MONSTERS[b].lv || 0);
  const normal = all.filter((sp) => !MONSTERS[sp].boss && !MONSTERS[sp].breedOnly).sort(byLv);
  return [...normal, ...all.filter((sp) => MONSTERS[sp].breedOnly).sort(byLv), ...all.filter((sp) => MONSTERS[sp].boss)];
}
