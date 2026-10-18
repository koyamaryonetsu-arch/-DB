// ボス級（ランク SS）の 仲間（第35回。配合でしか 生まれない）
//
// このゲームの ボス 7体を、仲間として 使える 形に した もの。ボスの データ（monsters-ch2.js など）とは べつの しゅぞく
//   （戦いの しかけ〈ガイアイーターの 部位・アルゴスの 読み など〉が 仲間に 出ない ように。え は art で ボスの え を 使う）
// ・図鑑では「配合だけの 魔物」の ならびに 入る。まだ 生んで いない ときは ？？？（ヒントは recipeHint）
// ・強さ: growth の 合計は 7.2〜8.6（配合の いちばん 上の 魔物と 同じ くらい。仲間としては 少し おさえる）。ランク SS なので レベルの 上限は 高い
// ・生まれかた（companions.js の breedCandidates）:
//     素材配合 … その ボスの 品 ＋ S ランク 2ひき（1ぴきは ボスと 同じ 系統）。品は なくなる
//     ランク配合 … S ランクで レベル30いじょうの 2ひき → その 系統の ボス級
//     4体配合 … つちくいムカデ ×4（両親と 祖父母）→ ガイアイーター
// ・MONSTERS の 数字（hp・str など）は 敵と しての もの（使わない）。仲間の 強さは growth で きまる
// ・第5章 Step 5: 影の王（ss_shadow_king）… ボスの 仲間では ない 新しい ボス級。たましいすい × ひとがたの影（か 悪魔系の S ＋ S）＋ 影星のペンダント
//   （ノクトの影の 品）の 素材配合だけで 生まれる（materialOnly … ランク配合では 生まれない）

const STATUS = { sleep: 0.5, poison: 0.5, confuse: 0.5, paralyze: 0.6 };

const mon = (name, lv, race, art, resist, desc) => ({
  name, lv, hp: 300 + lv * 12, mp: 80, str: 40 + lv * 2, def: 30 + lv * 2, agi: 30 + lv, mag: 30 + lv * 2,
  exp: 0, gold: 0, breedOnly: true, race, size: 'l', art, resist: { ...STATUS, ...resist },
  actions: [{ w: 1, id: 'attack' }], desc,
});

export const MONSTERS_BOSS = {
  ss_goldoon: mon('ゴルドーン', 12, 'material', 'goldoon', { fire: 0.7, ice: 0.8, blast: 1.2 }, '岩の大男。配合で生まれた、仲間のゴルドーン。とても固くて力持ち。'),
  ss_kraken: mon('大王イカ', 15, 'beast', 'giant_squid', { ice: 0.7, bolt: 1.3, fire: 0.9 }, '海の主。配合で生まれた、仲間の大王イカ。長い足で敵をしめつける。'),
  ss_storm: mon('嵐の将軍ストルム', 20, 'demon', 'storm_general', { wind: 0.4, bolt: 0.7, light: 1.2 }, '嵐をあやつる将軍。配合で生まれ、今は仲間として剣をふるう。'),
  ss_ignia: mon('炎の魔女イグニア', 29, 'demon', 'flame_witch', { fire: 0.3, ice: 1.2 }, '炎の魔女。配合で生まれ、今は仲間として炎の呪文を使う。'),
  ss_argos: mon('星の番人アルゴス', 44, 'material', 'argos', { light: 0.6, dark: 1.1, blind: 0.3, confuse: 0.3 }, '3つの目をもつ星の番人。配合で生まれ、今は仲間を見守る。'),
  ss_gaia: mon('ガイアイーター', 46, 'beast', 'gaia_head', { poison: 0.2, ice: 1.2, fire: 0.8 }, '島の土を食べる大ムカデ。配合で生まれた、仲間のガイアイーター。'),
  ss_oldra: mon('古竜オルドラ', 48, 'dragon', 'old_dragon', { fire: 0.3, ice: 1.2 }, '大昔の竜。配合で生まれ、今は仲間として炎をはく。'),
  // 第5章 Step 5: ノクトの影の 品 ＋ たましいすい × ひとがたの影 など（アニメの 敵ふうの 2ひきから 生まれる ボス級。docs/idea-r35.md の K）
  ss_shadow_king: mon('影の王', 50, 'demon', 'shadow_king', { dark: 0.3, light: 1.2, confuse: 0.3 }, '影の魔物たちをしたがえる王。配合で生まれ、今は仲間として影のつるぎをふるう。'),
};

// 仲間に なった とき（companions.js で まぜる）。rank: 'SS'・recipeOnly（系統配合の 子には ならない）
const ss = (o) => ({ rate: 0, breedOnly: true, recipeOnly: true, rank: 'SS', ...o });
export const FRIENDS_BOSS = {
  ss_goldoon: ss({
    names: ['ゴルドン', 'ガンコ', 'いわお', 'ドーン'],
    growth: { hp: 1.65, mp: 0.5, str: 1.55, def: 1.7, agi: 0.6, mag: 0.5, heal: 0.7 },
    learn: [[1, 'm_boulder'], [4, 'm_harden'], [8, 'm_gold_punch'], [12, 'm_stomp'], [17, 'gd_wall'], [23, 'm_avalanche']],
    note: 'ボス級。とても固くて力持ち。',
  }),
  ss_kraken: ss({
    names: ['クラーケ', 'イカゾウ', 'ゲソ', 'うみぬし'],
    growth: { hp: 1.55, mp: 0.8, str: 1.35, def: 1.25, agi: 0.9, mag: 1.1, heal: 0.9 },
    learn: [[1, 'm_splash'], [4, 'm_coil'], [9, 'm_tidal'], [14, 'm_water_rain'], [20, 'm_water_breath'], [26, 'sg_mahyado']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'ボス級。水の技で敵みんなをおそう。',
  }),
  ss_storm: ss({
    names: ['ストルム', 'アラシ', 'ハヤテ', 'しょうぐん'],
    growth: { hp: 1.25, mp: 0.9, str: 1.45, def: 1.2, agi: 1.35, mag: 1.1, heal: 0.7 },
    learn: [[1, 'm_wind_slash'], [5, 'm_storm_wing'], [10, 'bagima'], [15, 'm_twin_slash'], [20, 'mk_raiden'], [26, 'sg_bagikurosu'], [32, 'tsurugimai']],
    gear: { weapons: ['sword', 'spear', 'axe'] },
    note: 'ボス級。風の剣と雷の呪文を使う。',
  }),
  ss_ignia: ss({
    names: ['イグニア', 'ほむら', 'ルージュ', 'まじょこ'],
    growth: { hp: 1.1, mp: 1.45, str: 0.8, def: 1.0, agi: 1.25, mag: 1.6, heal: 0.9 },
    learn: [[1, 'mera'], [4, 'gira'], [8, 'merami'], [12, 'begirama'], [17, 'm_flame_breath'], [22, 'merazoma'], [28, 'm_blaze']],
    gear: { weapons: ['staff', 'whip', 'fan'], armor: ['cloth', 'robe'], shield: false, head: 'hat' },
    note: 'ボス級。炎の呪文がとても強い。',
  }),
  ss_argos: ss({
    names: ['アルゴス', 'ミツメ', 'ほしみ', 'ばんにん'],
    growth: { hp: 1.3, mp: 1.3, str: 1.1, def: 1.3, agi: 1.3, mag: 1.4, heal: 0.9 },
    learn: [[1, 'm_eye_beam'], [4, 'm_eye_seal'], [8, 'io'], [12, 'm_star_breath'], [17, 'm_star_dust'], [22, 'iora']],
    gear: { weapons: [], armor: ['cloth', 'heavy'], shield: true, head: false },
    note: 'ボス級。目の光線と星の力で戦う。',
  }),
  ss_gaia: ss({
    names: ['ガイア', 'オオムカデ', 'ツチクイ', 'ヒャクアシ'],
    growth: { hp: 1.6, mp: 0.6, str: 1.6, def: 1.4, agi: 1.1, mag: 0.6, heal: 0.6 },
    learn: [[1, 'm_bite'], [4, 'm_larva_fang'], [9, 'm_mole_drill'], [14, 'm_keeper_stomp'], [20, 'm_avalanche'], [26, 'bm_hakai']],
    gear: { weapons: [], armor: ['cloth', 'heavy'], shield: false, head: false },
    note: 'ボス級。大きなあごと体で、力いっぱい戦う。',
  }),
  ss_shadow_king: ss({
    names: ['カゲオウ', 'ヤミノキミ', 'シャドウ', 'よるのおう'],
    growth: { hp: 1.4, mp: 1.15, str: 1.5, def: 1.25, agi: 1.25, mag: 1.35, heal: 0.7 },
    learn: [[1, 'm_darkslash'], [4, 'm_homun_claw'], [9, 'm_soul_chill'], [14, 'm_homun_blades'], [20, 'm_soul_joy'], [26, 'm_homun_stone']],
    gear: { weapons: ['sword', 'claw', 'dagger'], armor: ['cloth', 'heavy'], shield: false },
    note: 'ボス級。影のつるぎと、こおりつく闇で戦う。',
    // ランク配合（S × S）では 生まれない。ノクトの影の 品が いる（companions.js の breedCandidates）
    materialOnly: true,
  }),
  ss_oldra: ss({
    names: ['オルドラ', 'コリュウ', 'こはく', 'いにしえ'],
    growth: { hp: 1.5, mp: 1.0, str: 1.5, def: 1.35, agi: 1.0, mag: 1.2, heal: 0.8 },
    learn: [[1, 'm_dragon_bite'], [4, 'm_dragon_claw'], [9, 'm_flame_breath'], [14, 'm_dragon_roar'], [20, 'dk_ikari'], [26, 'm_jade_flare']],
    note: 'ボス級。竜の炎と大きなキバで戦う。',
  }),
};

// 素材配合（ボスの 品 ＋ S ランク 2ひき → その ボス級）。a・b は companions.js の 組み合わせの 書きかた（minRank … この ランクいじょう）
//   a は ボスと 同じ 系統の S ランク、b は どの 系統でも S ランク。星見の目玉 ＋ 星くらげ は アルゴスの とくべつな 組み合わせ
const S = 6;
export const MATERIAL_RECIPES = [
  { a: 'gazer_eye', b: 'star_jelly', item: 'argos_pendant', child: 'ss_argos' },
  { a: { race: 'material', minRank: S }, b: { minRank: S }, item: 'rock_bangle', child: 'ss_goldoon' },
  { a: { race: 'beast', minRank: S }, b: { minRank: S }, item: 'deep_ring', child: 'ss_kraken' },
  { a: { race: 'demon', minRank: S }, b: { minRank: S }, item: 'storm_bangle', child: 'ss_storm' },
  { a: { race: 'demon', minRank: S }, b: { minRank: S }, item: 'flame_earring', child: 'ss_ignia' },
  { a: { race: 'material', minRank: S }, b: { minRank: S }, item: 'argos_pendant', child: 'ss_argos' },
  { a: { race: 'beast', minRank: S }, b: { minRank: S }, item: 'gaia_fang_charm', child: 'ss_gaia' },
  { a: { race: 'dragon', minRank: S }, b: { minRank: S }, item: 'old_dragon_eye', child: 'ss_oldra' },
  // 影の王: たましいすい × ひとがたの影（とくべつな 組み合わせ）か、悪魔系の S ＋ S ランク ＋ 影星のペンダント（ノクトの影の 品）
  { a: 'soul_eater', b: 'homunculus_shade', item: 'shade_pendant', child: 'ss_shadow_king' },
  { a: { race: 'demon', minRank: S }, b: { minRank: S }, item: 'shade_pendant', child: 'ss_shadow_king' },
];

// 4体配合（両親と 祖父母 4ひきが みんな その しゅぞく → 子）
export const FOUR_RECIPES = [
  { all: 'gaia_larva', child: 'ss_gaia' },
  { all: 'pururin', child: 'kirakira' },
];
