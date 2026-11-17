// 第88回: 作品を 思い出す 装備（docs/plan-r88-anime-gear.md）の 品を まとめる。items.js が まぜる
//
// あとの 係が 作品を 足す 手順（くわしくは 設計書の「実装メモ（G1班）」）
//   1. data/works.js に 作品を 足す
//   2. data/items-r88-<作品>.js を 作る（items-r88-kit.js の weapon・armor・shield・head・acc で 格を 書く）
//   3. この ファイルの R88_PARTS に 足す（品・読みがな・生まれ変わり）
//   4. 使う 技は data/abilities-r88.js（かくし技）・そろいは data/gear-sets.js
import { REBIRTH } from './items-alchemy.js';
import { ITEMS_R88_YAIBA, R88_YAIBA_KANA, R88_REBIRTH_YAIBA } from './items-r88-yaiba.js';
import { ITEMS_R88_HOUSHIN, R88_HOUSHIN_KANA, R88_REBIRTH_HOUSHIN } from './items-r88-houshin.js';
// 第88回 G2班: スレイヤーズ・烈火の炎
import { ITEMS_R88_SLAYERS, R88_SLAYERS_KANA, R88_REBIRTH_SLAYERS } from './items-r88-slayers.js';
import { ITEMS_R88_REKKA, R88_REKKA_KANA, R88_REBIRTH_REKKA } from './items-r88-rekka.js';
// 第88回 G7班: 犬夜しゃ・ゆう☆遊☆白書
import { ITEMS_R88_INUYASHA, R88_INUYASHA_KANA, R88_REBIRTH_INUYASHA } from './items-r88-inuyasha.js';
import { ITEMS_R88_YUHAKU, R88_YUHAKU_KANA, R88_REBIRTH_YUHAKU } from './items-r88-yuhaku.js';
// 第88回 G8班: らんま1/2・地獄先生ぬ〜べ〜
import { ITEMS_R88_RANMA, R88_RANMA_KANA, R88_REBIRTH_RANMA } from './items-r88-ranma.js';
import { ITEMS_R88_NUBE, R88_NUBE_KANA, R88_REBIRTH_NUBE } from './items-r88-nube.js';
// 第88回 G10班: ナルト・きめつのやいば（tag … 今 ある 品を 作品の 品として 数える）
import { ITEMS_R88_NARUTO, R88_NARUTO_KANA, R88_REBIRTH_NARUTO, R88_TAG_NARUTO } from './items-r88-naruto.js';
import { ITEMS_R88_KIMETSU, R88_KIMETSU_KANA, R88_REBIRTH_KIMETSU, R88_TAG_KIMETSU } from './items-r88-kimetsu.js';

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
  }
  return table;
}
