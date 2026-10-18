// 第37回 A: サファラ闘技場の ごほうびの 品（items.js で まぜる。はじめて 勝ちぬいた ときに 1回だけ。world/arena.js）
// ★の きまり（items-rare.js の starsFor）: 店では 買えない 品は ランクで ★（ランク5〜7 ★3・8 ★4・9〜10 ★5。10より 上も ★5）
//   ランク1〜4 … ランク7 の ★3（第4章の ころの 店〈ランク7〉より 少し 強い。だれでも 装備できる 品）
//   ランク5 … チャンピオンのベルト（アクセ。ランク8 の ★4）
//   伝説の部 ランク6〜8 … ★5（ランク10。装備の ランクは 10 までの きまり〈test/loot.test.js〉なので、ランク11 の かわりに
//   強さの 上のせ k と とくせいで「あとの ランクほど 強い」）。ランク8 は「伝説のチャンピオン」の 品 2つ
//   （「伝説」の 名前は ランク10 だけ・1人1つの ボスの 品〈unique〉は レア度3 の きまりが あるので、unique は つけない。ごほうびは はじめての 1回だけ）
// src: 'arena'（rare-loot.js の rareWhereText「闘技場のごほうびでしか手に入らない」）。店では 売っていない・宝箱にも 出ない
// 強さの めやす（items-rare.js と おなじ）
const CLOTH = [0, 5, 10, 14, 17, 22, 27, 33, 39, 46, 54];
const ARMOR_K = { cloth: 1, heavy: 1.65, robe: 1.1, gi: 1.2 };
const RAR_K = [1, 1, 1.04, 1.08, 1.12, 1.15];
const SELL = [0, 60, 150, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
const ARENA = { src: 'arena' };
const A = (armorType, rank, rarity, k = 1) => ({ type: 'armor', armorType, rank, rarity, def: Math.round(CLOTH[rank] * ARMOR_K[armorType] * RAR_K[rarity] * k) });
const S = (rank, rarity, k = 1) => ({ type: 'shield', rank, rarity, def: Math.round(CLOTH[rank] * RAR_K[rarity] * k) });
const H = (rank, rarity, k = 1) => ({ type: 'head', rank, rarity, def: Math.round(CLOTH[rank] * 0.4 * RAR_K[rarity] * k) });
const C = (rank, rarity) => ({ type: 'acc', rank, rarity });

const GEAR = {
  // ランク1（力じまんの戦士）
  ar_power_bangle: {
    ...C(7, 3), ...ARENA, name: '力じまんのうでわ', bonus: { str: 12, hp: 24 }, crit: 0.02,
    desc: '闘技場のランク1を勝ちぬいたしるし。力じまんの戦士が、むかしつけていたうでわ。だれでも装備でき、力とHPが上がる。',
  },
  // ランク2（砂嵐三兄弟）
  ar_sand_bandana: {
    ...H(7, 3, 1.05), ...ARENA, name: '砂嵐のバンダナ', bonus: { agi: 10, hp: 12 }, resist: { blind: 0.5, wind: 0.85 },
    desc: '砂嵐三兄弟が、おそろいでまいているバンダナ。だれでも装備でき、素早さが上がる。まぼろしにかかりにくい。',
  },
  // ランク3（ランプの大魔人）
  ar_genie_cape: {
    ...A('cloth', 7, 3, 1.05), ...ARENA, name: '大魔人のマント', bonus: { mag: 10, heal: 6 }, resist: { fire: 0.75 },
    desc: 'ランプの大魔人の、けむりのようにかるいマント。だれでも装備でき、魔力が上がる。炎に強い。',
  },
  // ランク4（太陽の剣士ソルと 月の剣士ルナ）
  ar_twin_shield: {
    ...S(7, 3, 1.05), ...ARENA, name: '太陽と月のたて', bonus: { hp: 18 }, resist: { fire: 0.8, ice: 0.8 },
    desc: '太陽と月がならんでえがかれた、ふたごの剣士のたて。炎と氷に強い。',
  },
  // ランク5（闘技場の王者ガルム）
  ar_champ_belt: {
    ...C(8, 4), ...ARENA, name: 'チャンピオンのベルト', bonus: { str: 12, def: 10, hp: 40, agi: 6 }, crit: 0.03,
    desc: 'サファラ闘技場の王者だけがつけられる、金色のベルト。だれでも装備でき、力・守り・HP・素早さが上がり、会心が出やすい。',
  },
  // 伝説の部 ランク6（砂ザメの王）
  ar_shark_charm: {
    ...C(10, 4), ...ARENA, name: '砂ザメの王のキバのお守り', bonus: { str: 12, agi: 10, hp: 44 }, crit: 0.03, resist: { bolt: 0.8, blind: 0.6 },
    desc: '砂ザメの王がおとしていった、大きなキバのお守り。だれでも装備でき、力・素早さ・HPが上がり、会心が出やすい。',
  },
  // ランク7（七色の魔導王）
  ar_prism_crown: {
    ...H(10, 4, 1.1), ...ARENA, name: '七色のかんむり', bonus: { mag: 16, heal: 12, agi: 6, hp: 20 }, resist: { fire: 0.8, ice: 0.8, bolt: 0.8, wind: 0.8 },
    desc: '七色の魔導王のかんむり。だれでも装備でき、魔力と回復の力が上がる。炎・氷・雷・風に強い。',
  },
  // ランク8（伝説のチャンピオン レオーネ）: 伝説のチャンピオンの 品 2つ
  ar_legend_belt: {
    ...C(10, 5), ...ARENA, name: '伝説のチャンピオンベルト', bonus: { str: 16, def: 14, mag: 12, agi: 12, hp: 60 }, crit: 0.04, resist: { confuse: 0.6, light: 0.8, dark: 0.8 },
    desc: '伝説のチャンピオン・レオーネが、むかし手にしたベルト。だれでも装備でき、力・守り・魔力・素早さ・HPが大きく上がる。会心が出やすい。',
  },
  ar_legend_mantle: {
    ...A('cloth', 10, 5, 1.2), ...ARENA, name: '伝説のチャンピオンのマント', bonus: { agi: 12, hp: 30, str: 6 }, resist: { fire: 0.8, ice: 0.8, dark: 0.8, light: 0.8 },
    desc: '伝説のチャンピオンのマント。闘技場の空のように赤い。だれでも装備でき、素早さとHPが上がる。',
  },
};
for (const it of Object.values(GEAR)) {
  it.price = 0;
  it.sell = Math.round(SELL[it.rank] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}
export const ITEMS_ARENA = GEAR;
// 読みがな（あいうえお順の ならべかえ）
export const ARENA_ITEM_KANA = {
  ar_power_bangle: 'ちからじまんのうでわ', ar_sand_bandana: 'すなあらしのばんだな', ar_genie_cape: 'だいまじんのまんと', ar_twin_shield: 'たいようとつきのたて',
  ar_champ_belt: 'ちゃんぴおんのべると', ar_shark_charm: 'すなざめのおうのきばのおまもり', ar_prism_crown: 'なないろのかんむり',
  ar_legend_belt: 'でんせつのちゃんぴおんべると', ar_legend_mantle: 'でんせつのちゃんぴおんのまんと',
};
