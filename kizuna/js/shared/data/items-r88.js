// 第88回: 作品を 思い出す 装備（docs/plan-r88-anime-gear.md）の 品を まとめる。items.js が まぜる
//
// あとの 係が 作品を 足す 手順（くわしくは 設計書の「実装メモ（G1班）」）
//   1. data/works.js に 作品を 足す
//   2. data/items-r88-<作品>.js を 作る（items-r88-kit.js の weapon・armor・shield・head・acc で 格を 書く）
//   3. この ファイルの R88_PARTS に 足す（品・読みがな・生まれ変わり）
//   4. 使う 技は data/abilities-r88.js（かくし技）・そろいは data/gear-sets.js
import { REBIRTH } from './items-alchemy.js?v=9beb19e66ed6';
import { ITEMS_R88_YAIBA, R88_YAIBA_KANA, R88_REBIRTH_YAIBA } from './items-r88-yaiba.js?v=9beb19e66ed6';
import { ITEMS_R88_HOUSHIN, R88_HOUSHIN_KANA, R88_REBIRTH_HOUSHIN } from './items-r88-houshin.js?v=9beb19e66ed6';
// 第88回 G2班: スレイヤーズ・烈火の炎
import { ITEMS_R88_SLAYERS, R88_SLAYERS_KANA, R88_REBIRTH_SLAYERS } from './items-r88-slayers.js?v=9beb19e66ed6';
import { ITEMS_R88_REKKA, R88_REKKA_KANA, R88_REBIRTH_REKKA } from './items-r88-rekka.js?v=9beb19e66ed6';

const R88_PARTS = [
  { items: ITEMS_R88_YAIBA, kana: R88_YAIBA_KANA, rebirth: R88_REBIRTH_YAIBA },
  { items: ITEMS_R88_HOUSHIN, kana: R88_HOUSHIN_KANA, rebirth: R88_REBIRTH_HOUSHIN },
  { items: ITEMS_R88_SLAYERS, kana: R88_SLAYERS_KANA, rebirth: R88_REBIRTH_SLAYERS },
  { items: ITEMS_R88_REKKA, kana: R88_REKKA_KANA, rebirth: R88_REBIRTH_REKKA },
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
  return table;
}
