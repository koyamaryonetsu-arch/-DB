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
    rate: 1 / 24, names: ['ホネゾウ', 'カラコロ', 'ボーン', 'しろほね'],
    growth: { hp: 1.1, mp: 0.6, str: 1.25, def: 1.1, agi: 0.9, mag: 0.5, heal: 0.5 },
    learn: [[1, 'm_swing'], [5, 'chikaratame'], [10, 'm_glare'], [15, 'mawashigeri'], [21, 'tamashii']],
    note: '剣のうでが立つがいこつ。攻撃力が高い。',
  },
  dark_bat: {
    rate: 1 / 22, names: ['ヤミー', 'くらやみ', 'ノクト', 'バット'],
    growth: { hp: 0.95, mp: 1.0, str: 1.05, def: 0.85, agi: 1.35, mag: 1.0, heal: 0.7 },
    learn: [[1, 'm_drain'], [4, 'manusa'], [9, 'm_dark_bolt'], [14, 'rukani'], [19, 'mahoton']],
    note: '暗闇の力を使うこうもり。',
  },
  rockman: {
    rate: 1 / 28, names: ['ゴロン', 'いわお', 'ガンさん', 'ロック'],
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
export const ROSTER_MAX = 24;
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
// ・うまれた こは レベル1から。おやの つよさを すこし うけつぎ、おやの わざを 4つまで おぼえられる
// ・「＋」（プラス）が つき、そだつと ふつうより つよくなる
// ・とくべつな くみあわせでは あたらしい まものが うまれる（それいがいは さいしょに えらんだ おやと おなじ しゅるい）
// 第2章の なかま
Object.assign(MONSTER_FRIENDS, FRIENDS_CH2);
// めずらしい 強い 魔物（ぷるりん騎士・ヴァルドラゴン など。gear も そこに ある）
Object.assign(MONSTER_FRIENDS, FRIENDS_RARE);
// しゅぞくごとの 装備の うわがき（上の GEAR）
for (const [sp, g] of Object.entries(GEAR)) if (MONSTER_FRIENDS[sp]) MONSTER_FRIENDS[sp].gear = { ...g, ...(MONSTER_FRIENDS[sp].gear || {}) };

export const BREED_MIN_LEVEL = 10;
export const BREED_INHERIT_MAX = 4;

export const RACE_NAMES = {
  slime: 'スライム系', beast: 'けもの系', plant: '植物系', spirit: 'せいれい系', demon: '悪魔系',
  undead: 'ゾンビ系', material: '物質系', dragon: 'ドラゴン系', human: '人間',
};

// a・b: しゅぞくID か { race, flying } の じょうけん
export const BREED_RECIPES = [
  { a: 'wolf', b: 'kirakira', child: 'star_panther' },
  { a: 'rockman', b: 'armor_crab', child: 'golem' },
  // めずらしい 強い 魔物（monsters-rare.js）。きまった 組み合わせを 先に
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
];

function specMatch(spec, sp, MONSTERS) {
  if (typeof spec === 'string') return spec === sp;
  const m = MONSTERS[sp];
  if (!m) return false;
  if (spec.race && m.race !== spec.race) return false;
  if (spec.flying !== undefined && !!m.flying !== spec.flying) return false;
  return true;
}

// どんな まものが うまれるか（MONSTERS を わたす: data どうしの じゅんかんを さける）
export function breedResult(spA, spB, MONSTERS) {
  for (const r of BREED_RECIPES) {
    if ((specMatch(r.a, spA, MONSTERS) && specMatch(r.b, spB, MONSTERS)) || (specMatch(r.a, spB, MONSTERS) && specMatch(r.b, spA, MONSTERS))) return r.child;
  }
  return spA;
}

// ずかんの ヒント（例: 「スライムけい ＋ スライムけい」）
export function recipeHint(child, MONSTERS) {
  const r = BREED_RECIPES.find((x) => x.child === child);
  if (!r) return '';
  const nm = (spec) => (typeof spec === 'string' ? MONSTERS[spec]?.name : spec.flying ? '空を飛ぶ魔物' : RACE_NAMES[spec.race] || '？');
  return `${nm(r.a)} ＋ ${nm(r.b)}`;
}

// うまれる こどもの「＋」
export function breedPlus(a, b) {
  return Math.min(99, Math.floor(((a.plus || 0) + (b.plus || 0)) / 2) + Math.max(1, Math.floor((a.level + b.level) / 10)));
}
