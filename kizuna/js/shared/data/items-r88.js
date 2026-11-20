// 第88回: 作品を 思い出す 装備（docs/plan-r88-anime-gear.md）の 品を まとめる。items.js が まぜる
//
// あとの 係が 作品を 足す 手順（くわしくは 設計書の「実装メモ（G1班）」）
//   1. data/works.js に 作品を 足す
//   2. data/items-r88-<作品>.js を 作る（items-r88-kit.js の weapon・armor・shield・head・acc で 格を 書く）
//   3. この ファイルの R88_PARTS に 足す（品・読みがな・生まれ変わり）
//   4. 使う 技は data/abilities-r88.js（かくし技）・そろいは data/gear-sets.js
import { REBIRTH } from './items-alchemy.js?v=69e37e491d1f';
import { ITEMS_R88_YAIBA, R88_YAIBA_KANA, R88_REBIRTH_YAIBA } from './items-r88-yaiba.js?v=69e37e491d1f';
import { ITEMS_R88_HOUSHIN, R88_HOUSHIN_KANA, R88_REBIRTH_HOUSHIN } from './items-r88-houshin.js?v=69e37e491d1f';
// 第88回 G2班: スレイヤーズ・烈火の炎
import { ITEMS_R88_SLAYERS, R88_SLAYERS_KANA, R88_REBIRTH_SLAYERS } from './items-r88-slayers.js?v=69e37e491d1f';
import { ITEMS_R88_REKKA, R88_REKKA_KANA, R88_REBIRTH_REKKA } from './items-r88-rekka.js?v=69e37e491d1f';
// 第88回 G7班: 犬夜しゃ・ゆう☆遊☆白書
import { ITEMS_R88_INUYASHA, R88_INUYASHA_KANA, R88_REBIRTH_INUYASHA } from './items-r88-inuyasha.js?v=69e37e491d1f';
import { ITEMS_R88_YUHAKU, R88_YUHAKU_KANA, R88_REBIRTH_YUHAKU } from './items-r88-yuhaku.js?v=69e37e491d1f';
// 第88回 G8班: らんま1/2・地獄先生ぬ〜べ〜
import { ITEMS_R88_RANMA, R88_RANMA_KANA, R88_REBIRTH_RANMA } from './items-r88-ranma.js?v=69e37e491d1f';
import { ITEMS_R88_NUBE, R88_NUBE_KANA, R88_REBIRTH_NUBE } from './items-r88-nube.js?v=69e37e491d1f';
// 第88回 G10班: ナルト・きめつのやいば（tag … 今 ある 品を 作品の 品として 数える）
import { ITEMS_R88_NARUTO, R88_NARUTO_KANA, R88_REBIRTH_NARUTO, R88_TAG_NARUTO } from './items-r88-naruto.js?v=69e37e491d1f';
import { ITEMS_R88_KIMETSU, R88_KIMETSU_KANA, R88_REBIRTH_KIMETSU, R88_TAG_KIMETSU } from './items-r88-kimetsu.js?v=69e37e491d1f';
// 第88回 G9班: ドラゴンボール・ワンピース（tag … 今 ある 品を 作品の 品として 数える。G10班の tagR88Works）
import { ITEMS_R88_DRAGONBALL, R88_DRAGONBALL_KANA, R88_REBIRTH_DRAGONBALL, R88_TAG_DRAGONBALL } from './items-r88-dragonball.js?v=69e37e491d1f';
import { ITEMS_R88_ONEPIECE, R88_ONEPIECE_KANA, R88_REBIRTH_ONEPIECE, R88_TAG_ONEPIECE } from './items-r88-onepiece.js?v=69e37e491d1f';
// 第88回 G11班: るろうに剣心・名探ていコナン・まじっく快と
import { ITEMS_R88_KENSHIN, R88_KENSHIN_KANA, R88_REBIRTH_KENSHIN, R88_TAG_KENSHIN } from './items-r88-kenshin.js?v=69e37e491d1f';
import { ITEMS_R88_CONAN, R88_CONAN_KANA, R88_REBIRTH_CONAN, R88_TAG_CONAN } from './items-r88-conan.js?v=69e37e491d1f';
import { ITEMS_R88_KAITO, R88_KAITO_KANA, R88_REBIRTH_KAITO, R88_TAG_KAITO } from './items-r88-kaito.js?v=69e37e491d1f';
// 第88回 G12班: ドラえもん・セーラームーン（tag … 今 ある 品を 作品の 品として 数える）
import { ITEMS_R88_DORAEMON, R88_DORAEMON_KANA, R88_REBIRTH_DORAEMON, R88_TAG_DORAEMON } from './items-r88-doraemon.js?v=69e37e491d1f';
import { ITEMS_R88_SAILORMOON, R88_SAILORMOON_KANA, R88_REBIRTH_SAILORMOON, R88_TAG_SAILORMOON } from './items-r88-sailormoon.js?v=69e37e491d1f';
// 第88回 G14班: 鋼のれん金術師・アナと雪の女王（tag … 今 ある 品を 作品の 品として 数える）
import { ITEMS_R88_HAGAREN, R88_HAGAREN_KANA, R88_REBIRTH_HAGAREN, R88_TAG_HAGAREN } from './items-r88-hagaren.js?v=69e37e491d1f';
import { ITEMS_R88_FROZEN, R88_FROZEN_KANA, R88_REBIRTH_FROZEN, R88_TAG_FROZEN } from './items-r88-frozen.js?v=69e37e491d1f';
// 第88回 G15班: ダイの大冒険・ドラゴンクエスト（setTag … 今 ある 品を そろいの 組に 入れる）
import { ITEMS_R88_DAI, R88_DAI_KANA, R88_REBIRTH_DAI, R88_TAG_DAI } from './items-r88-dai.js?v=69e37e491d1f';
import { ITEMS_R88_DQ, R88_DQ_KANA, R88_REBIRTH_DQ, R88_TAG_DQ, R88_SETTAG_DQ } from './items-r88-dq.js?v=69e37e491d1f';
// 第88回 G13班: ハリー・ポッター・マリオ（tagSet … 今 ある 品に そろいも つける）
import { ITEMS_R88_HARRYPOTTER, R88_HARRYPOTTER_KANA, R88_REBIRTH_HARRYPOTTER, R88_TAG_HARRYPOTTER, R88_TAG_SET_HARRYPOTTER } from './items-r88-harrypotter.js?v=69e37e491d1f';
import { ITEMS_R88_MARIO, R88_MARIO_KANA, R88_REBIRTH_MARIO } from './items-r88-mario.js?v=69e37e491d1f';
// 第88回 G16班: ポケモン（tag … 今 ある 進化の 石を 作品の 品として 数える）
import { ITEMS_R88_POKEMON, R88_POKEMON_KANA, R88_REBIRTH_POKEMON, R88_TAG_POKEMON } from './items-r88-pokemon.js?v=69e37e491d1f';
// 第88回 G19班: SPY×FAMILY・オリジナルの 職業
import { ITEMS_R88_SPYFAMILY, R88_SPYFAMILY_KANA, R88_REBIRTH_SPYFAMILY } from './items-r88-spyfamily.js?v=69e37e491d1f';
import { ITEMS_R88_ORIGINAL, R88_ORIGINAL_KANA, R88_REBIRTH_ORIGINAL } from './items-r88-original.js?v=69e37e491d1f';
// 第88回 G18班: はなかっぱ・おしり探てい（kids）・暴れんぼう将軍・3年B組（jidai）
import { ITEMS_R88_KIDS, R88_KIDS_KANA, R88_REBIRTH_KIDS, R88_TAG_KIDS } from './items-r88-kids.js?v=69e37e491d1f';
import { ITEMS_R88_JIDAI, R88_JIDAI_KANA, R88_REBIRTH_JIDAI, R88_TAG_JIDAI } from './items-r88-jidai.js?v=69e37e491d1f';
// 第88回 G17班: フリーレン（千年の大魔法使い）・さいきくすお
import { ITEMS_R88_FRIEREN, R88_FRIEREN_KANA, R88_REBIRTH_FRIEREN, R88_TAG_FRIEREN } from './items-r88-frieren.js?v=69e37e491d1f';
import { ITEMS_R88_SAIKI, R88_SAIKI_KANA, R88_REBIRTH_SAIKI, R88_TAG_SAIKI } from './items-r88-saiki.js?v=69e37e491d1f';

const R88_PARTS = [
  { items: ITEMS_R88_YAIBA, kana: R88_YAIBA_KANA, rebirth: R88_REBIRTH_YAIBA },
  { items: ITEMS_R88_HOUSHIN, kana: R88_HOUSHIN_KANA, rebirth: R88_REBIRTH_HOUSHIN },
  { items: ITEMS_R88_SLAYERS, kana: R88_SLAYERS_KANA, rebirth: R88_REBIRTH_SLAYERS },
  { items: ITEMS_R88_REKKA, kana: R88_REKKA_KANA, rebirth: R88_REBIRTH_REKKA },
  // G7班
  { items: ITEMS_R88_INUYASHA, kana: R88_INUYASHA_KANA, rebirth: R88_REBIRTH_INUYASHA },
  { items: ITEMS_R88_YUHAKU, kana: R88_YUHAKU_KANA, rebirth: R88_REBIRTH_YUHAKU },
  // G8班: らんま1/2・地獄先生ぬ〜べ〜
  { items: ITEMS_R88_RANMA, kana: R88_RANMA_KANA, rebirth: R88_REBIRTH_RANMA },
  { items: ITEMS_R88_NUBE, kana: R88_NUBE_KANA, rebirth: R88_REBIRTH_NUBE },
  // G10班: ナルト・きめつのやいば
  { items: ITEMS_R88_NARUTO, kana: R88_NARUTO_KANA, rebirth: R88_REBIRTH_NARUTO, tag: R88_TAG_NARUTO },
  { items: ITEMS_R88_KIMETSU, kana: R88_KIMETSU_KANA, rebirth: R88_REBIRTH_KIMETSU, tag: R88_TAG_KIMETSU },
  // G9班: ドラゴンボール・ワンピース
  { items: ITEMS_R88_DRAGONBALL, kana: R88_DRAGONBALL_KANA, rebirth: R88_REBIRTH_DRAGONBALL, tag: R88_TAG_DRAGONBALL },
  { items: ITEMS_R88_ONEPIECE, kana: R88_ONEPIECE_KANA, rebirth: R88_REBIRTH_ONEPIECE, tag: R88_TAG_ONEPIECE },
  // G11班: るろうに剣心・名探ていコナン・まじっく快と
  { items: ITEMS_R88_KENSHIN, kana: R88_KENSHIN_KANA, rebirth: R88_REBIRTH_KENSHIN, tag: R88_TAG_KENSHIN },
  { items: ITEMS_R88_CONAN, kana: R88_CONAN_KANA, rebirth: R88_REBIRTH_CONAN, tag: R88_TAG_CONAN },
  { items: ITEMS_R88_KAITO, kana: R88_KAITO_KANA, rebirth: R88_REBIRTH_KAITO, tag: R88_TAG_KAITO },
  // G12班: ドラえもん・セーラームーン
  { items: ITEMS_R88_DORAEMON, kana: R88_DORAEMON_KANA, rebirth: R88_REBIRTH_DORAEMON, tag: R88_TAG_DORAEMON },
  { items: ITEMS_R88_SAILORMOON, kana: R88_SAILORMOON_KANA, rebirth: R88_REBIRTH_SAILORMOON, tag: R88_TAG_SAILORMOON },
  // G14班: 鋼のれん金術師・アナと雪の女王
  { items: ITEMS_R88_HAGAREN, kana: R88_HAGAREN_KANA, rebirth: R88_REBIRTH_HAGAREN, tag: R88_TAG_HAGAREN },
  { items: ITEMS_R88_FROZEN, kana: R88_FROZEN_KANA, rebirth: R88_REBIRTH_FROZEN, tag: R88_TAG_FROZEN },
  // G15班: ダイの大冒険・ドラゴンクエスト
  { items: ITEMS_R88_DAI, kana: R88_DAI_KANA, rebirth: R88_REBIRTH_DAI, tag: R88_TAG_DAI },
  { items: ITEMS_R88_DQ, kana: R88_DQ_KANA, rebirth: R88_REBIRTH_DQ, tag: R88_TAG_DQ, setTag: R88_SETTAG_DQ },
  // G13班: ハリー・ポッター・マリオ
  { items: ITEMS_R88_HARRYPOTTER, kana: R88_HARRYPOTTER_KANA, rebirth: R88_REBIRTH_HARRYPOTTER, tag: R88_TAG_HARRYPOTTER, tagSet: R88_TAG_SET_HARRYPOTTER },
  { items: ITEMS_R88_MARIO, kana: R88_MARIO_KANA, rebirth: R88_REBIRTH_MARIO },
  // G16班: ポケモン
  { items: ITEMS_R88_POKEMON, kana: R88_POKEMON_KANA, rebirth: R88_REBIRTH_POKEMON, tag: R88_TAG_POKEMON },
  // G19班: SPY×FAMILY・オリジナルの 職業
  { items: ITEMS_R88_SPYFAMILY, kana: R88_SPYFAMILY_KANA, rebirth: R88_REBIRTH_SPYFAMILY },
  { items: ITEMS_R88_ORIGINAL, kana: R88_ORIGINAL_KANA, rebirth: R88_REBIRTH_ORIGINAL },
  // G18班: はなかっぱ・おしり探てい・暴れんぼう将軍・3年B組
  { items: ITEMS_R88_KIDS, kana: R88_KIDS_KANA, rebirth: R88_REBIRTH_KIDS, tag: R88_TAG_KIDS },
  { items: ITEMS_R88_JIDAI, kana: R88_JIDAI_KANA, rebirth: R88_REBIRTH_JIDAI, tag: R88_TAG_JIDAI },
  // G17班: フリーレン・さいきくすお
  { items: ITEMS_R88_FRIEREN, kana: R88_FRIEREN_KANA, rebirth: R88_REBIRTH_FRIEREN, tag: R88_TAG_FRIEREN },
  { items: ITEMS_R88_SAIKI, kana: R88_SAIKI_KANA, rebirth: R88_REBIRTH_SAIKI, tag: R88_TAG_SAIKI },
];

export const ITEMS_R88 = Object.assign({}, ...R88_PARTS.map((p) => p.items));
export const R88_ITEM_KANA = Object.assign({}, ...R88_PARTS.map((p) => p.kana || {}));
export const R88_REBIRTH = Object.assign({}, ...R88_PARTS.map((p) => p.rebirth || {}));
// 今の 生まれ変わりの 表に まぜる（data/forge.js の rebirthOf が 読む）
Object.assign(REBIRTH, R88_REBIRTH);

// 伝説（grade 'den'）の 数字を、その 種類の 今 いちばん 強い 品（きたえる 前・作品の 品は のぞく）と 同じに する
//   武器 … 同じ 武器の 種類の 攻撃力 / よろい … 同じ よろいの 種類の 守備力 / たて … たての 守備力 / 頭 … かぶと・ぼうし べつの 守備力
//   アクセは 数字なし。items.js で ぜんぶの 品を まぜた あとに よぶ（ほかの 品が ふえても いつも ならぶ）
export function legendKey(it) {
  if (!it) return null;
  switch (it.type) {
    case 'weapon': return `weapon:${it.cat}`;
    case 'armor': return `armor:${it.armorType}`;
    case 'shield': return 'shield';
    case 'head': return `head:${it.helm ? 'helm' : 'hat'}`;
    default: return null;
  }
}
export const legendStat = (it) => (it?.type === 'weapon' ? 'atk' : 'def');
export function topOfKind(table) {
  const top = {};
  for (const it of Object.values(table)) {
    if (!it || it.base || it.work) continue;
    const key = legendKey(it);
    if (!key) continue;
    const v = it[legendStat(it)] || 0;
    if (v > (top[key] || 0)) top[key] = v;
  }
  return top;
}
export function fitR88Legends(table) {
  const top = topOfKind(table);
  for (const it of Object.values(table)) {
    if (!it?.work || it.base || it.grade !== 'den') continue;
    const key = legendKey(it);
    if (key && top[key]) it[legendStat(it)] = top[key];
  }
  tagR88Works(table); // G10班: 今 ある 品に 作品を つける（いちばんを 決めた あと）
  return table;
}

// ───── G10班: 今 ある 品を 作品の 品として 数える（R88_PARTS の tag。{ 品の id: 作品 }）─────
//   とびらの 数・ガチャの「持って いる」・せつめいの「作品：」に 入る。強さ・手に入れ方（店・宝の 入れ物）は かえない
//   r88Tag … 前から ある 品の しるし（格〈grade〉が ないので ガチャには 入らない。テストで 作品の 新しい 品と 分ける）
export const R88_WORK_TAGS = Object.assign({}, ...R88_PARTS.map((p) => p.tag || {}));
export function tagR88Works(table) {
  for (const [id, w] of Object.entries(R88_WORK_TAGS)) {
    const it = table[id];
    if (!it || it.work || it.base) continue;
    it.work = w;
    it.r88Tag = true;
    if (R88_SET_TAGS[id]) it.set = R88_SET_TAGS[id]; // G15班: 天空の剣・天空のよろい → 天空の装備（ファイルの さいご）
  }
  tagR88Sets(table); // G13班: 今 ある 品に そろいも つける（ファイルの さいご）
  return table;
}

// ───── G13班: 今 ある 品に そろいも つける（R88_PARTS の tagSet。{ 品の id: そろいの id }）─────
//   ニワトコのつえ・とうめいマント → 死の 秘宝（data/gear-sets.js の deathly_hallows）。強さ・手に入れ方は かえない
export const R88_TAG_SETS = Object.assign({}, ...R88_PARTS.map((p) => p.tagSet || {}));
export function tagR88Sets(table) {
  for (const [id, s] of Object.entries(R88_TAG_SETS)) if (table[id] && !table[id].base && !table[id].set) table[id].set = s;
  return table;
}

// ───── G15班: 今 ある 品を そろいの 組に 入れる（R88_PARTS の setTag。{ 品の id: 組の id }。tagR88Works が つける）─────
//   天空の剣・天空のよろい（今 ある 品）→ 天空の装備（data/gear-sets.js の tenku）。強さ・手に入れ方は かえない
export const R88_SET_TAGS = Object.assign({}, ...R88_PARTS.map((p) => p.setTag || {}));
