// 第88回: 作品を 思い出す 装備の 強さの 式（docs/plan-r88-anime-gear.md の 1-1・6・12-1）
//   作品ごとの ファイル（items-r88-<作品>.js）が この 式で 品を 作る。式は items-rare.js の W・A・S・H・C と 同じ
//
//   格（grade）
//     den … 伝説 ★5（ランク10・レア度5）。強さは その 武器の 種類（防具は 同じ 部位・種類）で 今 いちばん 強い 品
//           （きたえる 前）と 同じ。items.js で ぜんぶの 品を まぜた あとに fitR88Legends（items-r88.js）が 合わせる
//     mei … 名品 ★4（ランク8・レア度4）。作品の 力（fx）が つく 分、式の 0.95 倍
//     fu3 … ふつう ★3（ランク6・レア度3）・fu2 … ふつう ★2（ランク4・レア度2）。どちらも 0.95 倍
//     shop … はじめの 品（店の 品と 同じ 強さ・★1）。ただし まだ どの 店にも ならべない
//   どの 品も src: 'r88'（宝の洞窟・ひみつのダンジョン・ボス・魔物の ドロップ・店の 入れ物に 入らない。手に入れ方は あとの 係）
const SWORD = [0, 6, 12, 20, 30, 40, 50, 61, 72, 85, 100];
const CLOTH = [0, 5, 10, 14, 17, 22, 27, 33, 39, 46, 54];
const CAT_K = { sword: 1, axe: 1.1, dagger: 0.72, spear: 0.92, claw: 0.9, whip: 0.85, staff: 0.36, fan: 0.66, boomerang: 0.62, bat: 0.95 };
const ARMOR_K = { cloth: 1, heavy: 1.65, robe: 1.1, gi: 1.2 };
const RAR_K = [1, 1, 1.04, 1.08, 1.12, 1.15];
const SELL = [0, 60, 150, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];

export const R88_SRC = 'r88';
export const GRADES = {
  den: { rank: 10, rarity: 5, k: 1, name: '伝説' },
  mei: { rank: 8, rarity: 4, k: 0.95, name: '名品' },
  fu3: { rank: 6, rarity: 3, k: 0.95, name: 'ふつう' },
  fu2: { rank: 4, rarity: 2, k: 0.95, name: 'ふつう' },
  shop: { rank: 1, rarity: 0, k: 1, name: '初めの品' },
};

const base = (type, grade) => {
  const g = GRADES[grade];
  if (!g) throw new Error(`r88: grade ${grade}`);
  return { type, grade, rank: g.rank, rarity: g.rarity, src: R88_SRC };
};
const k = (grade) => GRADES[grade].k * RAR_K[GRADES[grade].rarity];

// 武器・よろい・たて・頭・アクセ（伝説の 数字は あとで fitR88Legends が 合わせる）
export const weapon = (cat, grade) => ({ ...base('weapon', grade), cat, atk: Math.round(SWORD[GRADES[grade].rank] * CAT_K[cat] * k(grade)) });
export const armor = (armorType, grade) => ({ ...base('armor', grade), armorType, def: Math.round(CLOTH[GRADES[grade].rank] * ARMOR_K[armorType] * k(grade)) });
export const shield = (grade) => ({ ...base('shield', grade), def: Math.round(CLOTH[GRADES[grade].rank] * k(grade)) });
export const head = (grade, helm = false) => ({ ...base('head', grade), ...(helm ? { helm: true } : {}), def: Math.round(CLOTH[GRADES[grade].rank] * (helm ? 0.6 : 0.4) * k(grade)) });
export const acc = (grade) => ({ ...base('acc', grade) });

// 値段（店の 品だけ price。ほかは 売り値だけ。items-rare.js と 同じ 式）
export function priceUp(table, shopPrice = {}) {
  for (const [id, it] of Object.entries(table)) {
    if (it.grade === 'shop') {
      it.price = shopPrice[id] || 50;
      continue;
    }
    it.price = 0;
    it.sell = Math.round(SELL[it.rank] * (0.7 + 0.15 * it.rarity) / 10) * 10;
  }
  return table;
}
