// 第5章 Step 9（B9）ノクト（本気）・魔王ソリトゥスの 品（B: 品。items.js で まぜる）
// ・★の きまり（docs/plan-ch5.md の 16・17）: ランク10 は ★5。★5の 中で、あとから 出る 品ほど 強く する（強さの 倍率 k）。
//   ボスの 品の きまり（第32回）: 1人 1つの アクセ（unique）は レア度 3・ちなんだ 品（src: 'boss'）は レア度 2・とくせい 1つ・店の いちばん よい 品くらい
// ・ノクト（本気）: かならず ふたつの紋章のお守り（アクセ・1人 1つ）と、ちなんだ ★5 の 夜のとばりの剣（src: 'boss'）
// ・ソリトゥス: かならず きずなの星（アクセ・1人 1つ）と、今までで いちばん 強い ★5 の 夜明けの星の剣
//   （drops.rare の 1回に 1回＝かならず。src: 'final'「魔王ソリトゥスからしか手に入らない」・倍率 1.3〈大地の剣 1.08・みんなが くれる 品 1.14 より 上〉・レア度 5＝いちばん めずらしい 色）
// 強さの めやす（items-earth.js と おなじ。ランク 0〜10）
const SWORD = [0, 6, 12, 20, 30, 40, 50, 61, 72, 85, 100];
const RAR_K = [1, 1, 1.04, 1.08, 1.12, 1.15];
const SELL = [0, 60, 150, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
const W = (cat, rank, rarity, k = 1) => ({ type: 'weapon', cat, rank, rarity, atk: Math.round(SWORD[rank] * ({ sword: 1 }[cat] || 1) * RAR_K[rarity] * k) });
const C = (rank, rarity) => ({ type: 'acc', rank, rarity });

export const ITEMS_FINAL = {
  // ── ノクト（本気）──
  // かならず 落とす（1人 1つ。loot.js の drops.boss）。主人公と ノクト、2つの 紋章の 形
  nocto2_twin_charm: {
    ...C(10, 3), unique: true, name: 'ふたつの紋章のお守り', bonus: { hp: 44, str: 12, mag: 12, agi: 10 }, resist: { dark: 0.6, confuse: 0.5 },
    desc: '2つの紋章が、よりそうような形のお守り。本気のノクトとの戦いのあとに見つけた。だれでも装備でき、HP・力・魔力・素早さが上がり、闇と混乱に強い。',
  },
  // ちなんだ 品（src: 'boss'。bossRareOf で かならず。ボスの 品の きまり: レア度 2・とくせい 1つ〈闇に 強い〉）
  nocto2_night_blade: {
    ...W('sword', 10, 2), src: 'boss', boss: 'nocto_2', name: '夜のとばりの剣', bonus: { str: 8, agi: 6 }, resist: { dark: 0.7 },
    desc: 'ノクトの紋章のつるぎと同じ、夜の色をした剣。闇に強い。',
  },

  // ── 魔王ソリトゥス（いちばん 強い ★5）──
  solitus_bond_star: {
    ...C(10, 3), unique: true, name: 'きずなの星', bonus: { hp: 70, str: 14, def: 14, mag: 14, agi: 12, heal: 10 }, resist: { dark: 0.5, light: 0.7, confuse: 0.5, sleep: 0.6 },
    desc: '魔王ソリトゥスが光になって消えたあとに、のこっていた小さな星。つないだ手のように、あたたかい。だれでも装備でき、すべての力が大きく上がる。',
  },
  solitus_dawn_sword: {
    ...W('sword', 10, 5, 1.3), src: 'final', name: '夜明けの星の剣', bonus: { str: 14, agi: 8, mag: 8 }, crit: 0.05, resist: { dark: 0.6, light: 0.8 },
    desc: '終わらない夜のあとに、いちばん最初にのぼった星の光でできた剣。会心が出やすく、闇と光に強い。',
  },
};
for (const it of Object.values(ITEMS_FINAL)) {
  it.price = 0;
  it.sell = Math.round(SELL[Math.min(10, it.rank)] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}

// 読みがな（あいうえお順の ならびかえ）
export const FINAL_ITEM_KANA = {
  nocto2_twin_charm: 'ふたつのもんしょうのおまもり', nocto2_night_blade: 'よるのとばりのけん',
  solitus_bond_star: 'きずなのほし', solitus_dawn_sword: 'よあけのほしのけん',
};
