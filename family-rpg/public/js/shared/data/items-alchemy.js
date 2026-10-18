// れん金がまで 作る 品・生まれ変わりの 武器（第32回 C）。items.js で まぜる
//
// ・れん金がま（大事な物）… 装備や 道具を 2〜3こ 入れて 少し 歩くと できあがる（data/alchemy.js・world/alchemy.js）
// ・れん金のメモ … 使うと レシピが 1つ わかる（フィールドの 宝箱など）
// ・れん金でしか 作れない ★装備（src: 'alchemy'）… 15こ。材料に その章の ボスの 品・地方の 品を 使う。
//   強さは その章の 店の 1つ上の ランク × レア度（★3 1.08・★4 1.12）
// ・生まれ変わりの 武器（src: 'reborn'）… かくし要素。5つの 系統
//   木の剣・銅の剣・かしのつえ・木のバット・木のブーメラン（店の 品）→ 1だん目（ランク4・★2）→ 2だん目（ランク7・★3）
//   第35回: 店の 品は きたえられない ので、1だん目は れん金がまで「店の 武器＋素材＋星のかけら」で 作る（REBIRTH_START）。
//           1だん目からは 今までどおり、きたえる 上限を こえて きたえ続けると 生まれ変わる（REBIRTH）

// 強さの めやす（items.js の EQUIP_RANKS の 剣・だれでも 着られる 服。items-rare.js と おなじ）
const SWORD = [0, 6, 12, 20, 30, 40, 50, 61, 72, 85, 100];
const CLOTH = [0, 5, 10, 14, 17, 22, 27, 33, 39, 46, 54];
const CAT_K = { sword: 1, axe: 1.1, dagger: 0.72, spear: 0.92, claw: 0.9, whip: 0.85, staff: 0.36, fan: 0.66, boomerang: 0.62, bat: 0.95 };
const ARMOR_K = { cloth: 1, heavy: 1.65, robe: 1.1, gi: 1.2 };
const RAR_K = [1, 1, 1.04, 1.08, 1.12, 1.15];
const SELL = [0, 60, 150, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];

const W = (cat, rank, rarity) => ({ type: 'weapon', cat, rank, rarity, atk: Math.round(SWORD[rank] * CAT_K[cat] * RAR_K[rarity]) });
const A = (armorType, rank, rarity) => ({ type: 'armor', armorType, rank, rarity, def: Math.round(CLOTH[rank] * ARMOR_K[armorType] * RAR_K[rarity]) });
const S = (rank, rarity) => ({ type: 'shield', rank, rarity, def: Math.round(CLOTH[rank] * RAR_K[rarity]) });
const H = (rank, rarity, helm = false) => ({ type: 'head', rank, rarity, ...(helm ? { helm: true } : {}), def: Math.round(CLOTH[rank] * (helm ? 0.6 : 0.4) * RAR_K[rarity]) });
const AL = { src: 'alchemy' };
const RB = { src: 'reborn' };

// ───── 道具 ─────
export const ALCHEMY_POT = 'alchemy_pot';
export const ALCHEMY_MEMO = 'alchemy_memo';
const USE = {
  alchemy_pot: { name: 'れん金がま', type: 'key', desc: '装備や道具を2〜3こ入れて少し歩くと、新しい物ができる、ふしぎな大きいかま。メニューの「道具」のいちばん上から使う。' },
  alchemy_memo: {
    name: 'れん金のメモ', type: 'use', price: 0, sell: 10, target: 'self', battle: false, field: true,
    effect: { type: 'alchemyMemo' }, desc: 'れん金がまの使い方が書いてあるメモ。読むと、れん金のレシピが1つわかる。',
  },
  jou_herb: {
    name: '上薬草', type: 'use', price: 0, sell: 12, target: 'ally', battle: true, field: true,
    effect: { type: 'heal', base: [75, 90], fixed: true }, desc: '薬草を2つ合わせた、よく効く薬草。HPを80ほど回復する。',
  },
  toku_herb: {
    name: '特薬草', type: 'use', price: 0, sell: 24, target: 'ally', battle: true, field: true,
    effect: { type: 'heal', base: [150, 180], fixed: true }, desc: '上薬草を2つ合わせた、とてもよく効く薬草。HPを160ほど回復する。',
  },
  panacea: {
    name: '万能薬', type: 'use', price: 0, sell: 40, target: 'ally', battle: true, field: true,
    effect: { type: 'cure', statuses: ['poison', 'paralyze', 'sleep', 'confuse', 'blind', 'silence'] }, desc: 'どんな状態異常も治す薬。',
  },
  elf_drink: {
    name: 'エルフの飲み薬', type: 'use', price: 0, sell: 150, target: 'ally', battle: true, field: true,
    effect: { type: 'mpHeal', base: [150, 180] }, desc: 'エルフにつたわる、ひみつの飲み薬。MPを大きく回復する。',
  },
};

// ───── れん金でしか 作れない ★装備（章ごと。材料は data/alchemy.js の RECIPES）─────
const GEAR = {
  // 第1章（店 ランク3 → 4）
  forest_sage_staff: { ...W('staff', 4, 3), ...AL, name: '森の大賢者のつえ', bonus: { mag: 6, heal: 14 }, mpRegen: 1, desc: '森の主の力が宿るつえ。回復の力が上がり、行動するたびにMPが1回復する。' },
  rock_king_fist: { ...W('claw', 4, 3), ...AL, name: '岩王のこぶし', bonus: { str: 4, def: 4 }, resist: { paralyze: 0.6 }, desc: '岩の大男の力をこめたナックル。力と守りが上がり、マヒしにくい。' },
  goldsilver_axe: { ...W('axe', 4, 3), ...AL, name: '金と銀のオノ', bonus: { str: 3 }, crit: 0.05, desc: '正直者がもらった金のオノと銀のオノを、1つにしたオノ。会心が出やすい。' },
  // 第2章（店 ランク4 → 5）
  ocean_whip: { ...W('whip', 5, 3), ...AL, name: '大海原のムチ', resist: { ice: 0.8 }, onHit: { status: 'paralyze', chance: 0.15 }, desc: '大王イカの足と竜のうろこのムチ。ときどき敵をマヒさせ、氷に強い。' },
  fujin_helm: { ...H(5, 3, true), ...AL, name: '風神のかぶと', bonus: { agi: 5, hp: 10 }, resist: { wind: 0.7, bolt: 0.8 }, desc: '風の神のかぶと。素早さが上がり、風と雷に強い。' },
  otohime_shield: { ...S(5, 3), ...AL, name: 'おと姫のたて', bonus: { heal: 5, hp: 12 }, resist: { ice: 0.75 }, desc: '海の底のお城のお姫様のたて。回復の力とHPが上がり、氷に強い。' },
  // 第3章（店 ランク5 → 6・7）
  winter_goddess_robe: { ...A('cloth', 6, 3), ...AL, name: '冬の女神のころも', bonus: { hp: 20, mag: 5 }, resist: { ice: 0.6 }, desc: '雪の国の女神のころも。だれでも装備でき、氷にとても強い。' },
  hephaestus_hammer: { ...W('axe', 6, 4), ...AL, name: 'ヘパイストスのつち', bonus: { str: 6, def: 3 }, resist: { fire: 0.75 }, crit: 0.03, desc: 'かじ屋の神のつち。炎に強く、会心が出やすい。' },
  walpurgis_broom: { ...W('staff', 7, 4), ...AL, name: 'ワルプルギスのほうき', bonus: { mag: 30, agi: 6 }, resist: { fire: 0.8 }, mpRegen: 2, desc: '魔女たちの夜まつりのほうき。呪文の力がとても上がり、行動するたびにMPが2回復する。' },
  gae_bolg: { ...W('spear', 7, 4), ...AL, name: 'ゲイボルグ', bonus: { str: 5 }, crit: 0.06, desc: '投げれば30のトゲに分かれるという、英ゆうのやり。会心がとても出やすい。' },
  // 第4章（店 ランク6 → 7）
  ifrit_sword: { ...W('sword', 7, 4), ...AL, name: 'イフリートの剣', bonus: { str: 6 }, resist: { fire: 0.7 }, onHit: { status: 'sleep', chance: 0.08 }, desc: '炎の魔神の力が宿る剣。炎に強く、ときどき敵をねむらせる。' },
  pharaoh_staff: { ...W('staff', 7, 4), ...AL, name: 'ファラオのつえ', bonus: { heal: 26, mag: 10 }, resist: { dark: 0.75 }, mpRegen: 2, desc: '古代の王のつえ。回復の力がとても上がり、闇に強い。行動するたびにMPが2回復する。' },
  mermaid_dress: { ...A('robe', 7, 4), ...AL, name: '人魚姫のドレス', bonus: { mag: 12, heal: 10, mp: 15 }, resist: { ice: 0.7 }, desc: '海の歌姫のドレス。魔力と回復の力が上がり、氷に強い。' },
  // 第5章（店 ランク7 → 8）
  dragon_slayer: { ...W('sword', 8, 4), ...AL, name: 'ドラゴンスレイヤー', bonus: { str: 6, hp: 20 }, resist: { fire: 0.75 }, crit: 0.04, desc: '竜をたおすためにきたえられた剣。炎に強く、会心が出やすい。' },
  senrigan_helm: { ...H(8, 4, true), ...AL, name: '千里眼のかぶと', bonus: { agi: 6, mag: 4 }, resist: { blind: 0.3, confuse: 0.5 }, crit: 0.04, desc: '遠くまで見通す目のかぶと。マヌーサと混乱に強く、会心が出やすい。' },

  // ───── 生まれ変わりの 武器（かくし要素）─────
  akagane_sword: { ...W('sword', 4, 2), ...RB, name: 'あかがねの剣', bonus: { agi: 3 }, crit: 0.03, desc: 'きたえぬかれた銅の剣が生まれ変わった、赤くかがやく剣。会心が出やすい。' },
  sun_sword: { ...W('sword', 7, 3), ...RB, name: '太陽の剣', bonus: { str: 5, agi: 4 }, resist: { dark: 0.8 }, crit: 0.05, desc: '太陽の力を宿した剣。闇に強く、会心が出やすい。' },
  spirit_bokuto: { ...W('sword', 4, 2), ...RB, name: 'せいれいの木刀', bonus: { mag: 3, heal: 6 }, mpRegen: 1, desc: 'きたえぬかれた木の剣にせいれいが宿った木刀。行動するたびにMPが1回復する。' },
  world_tree_sword: { ...W('sword', 7, 3), ...RB, name: '世界樹の剣', bonus: { heal: 12, hp: 20 }, mpRegen: 2, desc: '世界をささえる大木の枝の剣。行動するたびにMPが2回復する。' },
  magic_school_staff: { ...W('staff', 4, 2), ...RB, name: '魔法学校のつえ', bonus: { mag: 16, heal: 6 }, desc: 'きたえぬかれたかしのつえが生まれ変わった、魔法学校の生徒のつえ。' },
  merlin_staff: { ...W('staff', 7, 3), ...RB, name: 'マーリンのつえ', bonus: { mag: 30, heal: 14 }, mpRegen: 1, desc: '王に仕えた大魔法使いのつえ。行動するたびにMPが1回復する。' },
  cleanup_bat: { ...W('bat', 4, 2), ...RB, name: '4番バッターのバット', bonus: { str: 3 }, crit: 0.04, desc: 'きたえぬかれた木のバットが生まれ変わった、4番バッターのバット。会心が出やすい。' },
  homerun_king_bat: { ...W('bat', 7, 3), ...RB, name: 'ホームラン王のバット', bonus: { str: 6 }, crit: 0.07, desc: '868本のホームランを打った王のバット。会心がとても出やすい。' },
  whirlwind_boomerang: { ...W('boomerang', 4, 2), ...RB, name: 'つむじ風のブーメラン', bonus: { agi: 5 }, resist: { wind: 0.85 }, desc: 'きたえぬかれた木のブーメランが生まれ変わった。風をまとって飛ぶ。' },
  sky_boomerang: { ...W('boomerang', 7, 3), ...RB, name: '天空のブーメラン', bonus: { agi: 8 }, resist: { wind: 0.75 }, crit: 0.03, desc: '天空の城の古い武器。敵全体に当たり、会心が出やすい。' },
};
for (const it of Object.values(GEAR)) {
  it.price = 0;
  it.sell = Math.round(SELL[it.rank] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}

export const ALCHEMY_ITEMS = { ...USE, ...GEAR };
export const ALCHEMY_GEAR = Object.keys(GEAR).filter((id) => GEAR[id].src === 'alchemy');
export const REBORN_GEAR = Object.keys(GEAR).filter((id) => GEAR[id].src === 'reborn');

// 1だん目を 作る れん金（第35回）: 店の 武器＋その 武器に 合う 素材＋星のかけら → 1だん目。
// data/alchemy.js の RECIPES に 入る（hidden: 本だな・メモ・親方では わからない。町の ヒントを 見て ためす）
//   from … 店の 武器 / to … 1だん目 / mat … 合わせる 素材
export const REBIRTH_START = [
  { id: 'r_reborn_sword', from: 'bronze_sword', mat: 'silver_shard', to: 'akagane_sword' },
  { id: 'r_reborn_bokuto', from: 'wood_sword', mat: 'moonherb', to: 'spirit_bokuto' },
  { id: 'r_reborn_staff', from: 'oak_staff', mat: 'magic_powder', to: 'magic_school_staff' },
  { id: 'r_reborn_bat', from: 'wood_bat', mat: 'beast_fang', to: 'cleanup_bat' },
  { id: 'r_reborn_boomerang', from: 'wood_boomerang', mat: 'wind_feather', to: 'whirlwind_boomerang' },
];
// 1だん目の 売り値は ひかえめに（店の 武器と 素材で すぐ 作れる ので、作って 売っても もうからない ように）
for (const x of REBIRTH_START) GEAR[x.to].sell = 100;
// 生まれ変わり（1だん目 → 2だん目）。上限＋れん金で ふやせる 回数（CAP_UP_MAX）まで きたえて、
// もう1回 きたえると 生まれ変わる（data/forge.js の rebirthOf・upgradeCost）。mats・gold … 生まれ変わる ときに いる 物
//   第34回までは 店の 武器（銅の剣 など）も ここに あった（店の 品は きたえられなく なったので、れん金の REBIRTH_START に）
export const REBIRTH = {
  akagane_sword: { to: 'sun_sword', gold: 5000, mats: [['star_shard', 5], ['star_iron', 1], ['flame_stone', 3]] },
  spirit_bokuto: { to: 'world_tree_sword', gold: 5000, mats: [['star_shard', 5], ['star_iron', 1], ['magic_powder', 8]] },
  magic_school_staff: { to: 'merlin_staff', gold: 5000, mats: [['star_shard', 5], ['star_iron', 1], ['ice_crystal', 3]] },
  cleanup_bat: { to: 'homerun_king_bat', gold: 5000, mats: [['star_shard', 5], ['star_iron', 1], ['dragon_scale', 2]] },
  whirlwind_boomerang: { to: 'sky_boomerang', gold: 5000, mats: [['star_shard', 5], ['star_iron', 1], ['wind_feather', 8]] },
};

export const ALCHEMY_KANA = {
  alchemy_pot: 'れんきんがま', alchemy_memo: 'れんきんのめも', jou_herb: 'じょうやくそう', toku_herb: 'とくやくそう', panacea: 'まんのうやく', elf_drink: 'えるふののみぐすり',
  forest_sage_staff: 'もりのだいけんじゃのつえ', rock_king_fist: 'がんおうのこぶし', goldsilver_axe: 'きんとぎんのおの', ocean_whip: 'おおうなばらのむち',
  fujin_helm: 'ふうじんのかぶと', otohime_shield: 'おとひめのたて', winter_goddess_robe: 'ふゆのめがみのころも', hephaestus_hammer: 'へぱいすとすのつち',
  walpurgis_broom: 'わるぷるぎすのほうき', gae_bolg: 'げいぼるぐ', ifrit_sword: 'いふりーとのけん', pharaoh_staff: 'ふぁらおのつえ', mermaid_dress: 'にんぎょひめのどれす',
  dragon_slayer: 'どらごんすれいやー', senrigan_helm: 'せんりがんのかぶと',
  akagane_sword: 'あかがねのけん', sun_sword: 'たいようのけん', spirit_bokuto: 'せいれいのぼくとう', world_tree_sword: 'せかいじゅのけん',
  magic_school_staff: 'まほうがっこうのつえ', merlin_staff: 'まーりんのつえ', cleanup_bat: 'よばんばったーのばっと', homerun_king_bat: 'ほーむらんおうのばっと',
  whirlwind_boomerang: 'つむじかぜのぶーめらん', sky_boomerang: 'てんくうのぶーめらん',
};
