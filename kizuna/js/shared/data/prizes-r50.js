// 第50回 D3: 景品を 豪華に（カジノの コイン・小さなメダル・星のかけら）
//   家族の ねがい「カジノや 小さなメダル・星のかけらの 景品を 豪華に。お話が 進むと 新しい 品が ふえる」
//
// ・4つの なかま（cat）: gear 強い装備 / look 見た目（乗り物・おしゃれ着）/ tool 便利な道具 / monster めずらしい魔物
//   品の データは data/items-prize-r50.js（pz_〜）。乗り物は data/vehicles-prize.js・魔物は data/monsters-prize.js
// ・お話の 段（need … その フラグが ついたら ならぶ）: 第2章クリア c2_clear → 第3章 c3_clear → 第4章 c4_clear
//   → 星の番人 c5_argos → 第1部クリア c5_clear → 第6章の 3つの 区切り c6_flow・c6_kanata・c6_heart
// ・強い装備は その段で 手に入る いちばん 強い 装備と おなじ くらい（第6章の 宝箱の 品と ならぶ）
// ・r: 50 … この回に ふえた 品（NEW の しるし。はじめて 開いた 人には この回の 品だけ NEW。world/prizes-r50.js）
// ・ここは ほかの データを import しない（data/casino.js・data/shops.js が まぜる）

// お話の 段（ならびは 進む じゅん。UI の「お話が進むと…」と テスト）
export const PRIZE_STAGES = ['c2_clear', 'c3_clear', 'c4_clear', 'c5_argos', 'c5_clear', 'c6_flow', 'c6_kanata', 'c6_heart'];

// ───────────── カジノの 景品（data/casino.js の PRIZES の うしろに まぜる）─────────────
// coins: コインの 数（1枚 20G）。tier … 宝の地図の 段（data/casino-tier.js）も いる 品
const R = 50;
export const PRIZES_R50 = [
  // はじめから（第1・2章）
  { id: 'pz_job_book', coins: 500, r: R },
  { id: 'pz_tuxedo', coins: 1500, r: R },
  { id: 'pz_ride_gold_bike', coins: 2000, r: R },
  { id: 'pz_call_coin_rabbit', coins: 3000, r: R },
  { id: 'pz_seven_sword', coins: 3500, r: R },
  // 第2章クリア
  { id: 'pz_stardust_dress', coins: 3000, need: 'c2_clear', r: R },
  { id: 'pz_roulette_spear', coins: 4500, need: 'c2_clear', r: R },
  { id: 'pz_call_roulette_slime', coins: 5000, need: 'c2_clear', r: R },
  { id: 'pz_lucky_ribbon', coins: 6000, need: 'c2_clear', r: R },
  // 第3章クリア
  { id: 'pz_job_book2', coins: 1500, need: 'c3_clear', r: R },
  { id: 'pz_ride_gold_horse', coins: 5000, need: 'c3_clear', r: R },
  { id: 'pz_diamond_mail', coins: 6500, need: 'c3_clear', r: R },
  { id: 'pz_ace_sword', coins: 7000, need: 'c3_clear', r: R },
  { id: 'pz_call_joker_devil', coins: 8000, need: 'c3_clear', r: R },
  // 第4章クリア
  { id: 'pz_exp_book', coins: 2000, need: 'c4_clear', r: R },
  { id: 'pz_ride_gold_carpet', coins: 8000, need: 'c4_clear', r: R },
  { id: 'pz_jewel_tiara', coins: 9000, need: 'c4_clear', r: R },
  { id: 'pz_club_axe', coins: 10000, need: 'c4_clear', r: R },
  // 星の番人の あと
  { id: 'pz_job_book3', coins: 4000, need: 'c5_argos', r: R },
  { id: 'pz_ride_lucky_pegasus', coins: 12000, need: 'c5_argos', r: R },
  { id: 'pz_night_tux', coins: 12000, need: 'c5_argos', r: R },
  { id: 'pz_fivecard_sword', coins: 14000, need: 'c5_argos', r: R },
  // 第1部クリア
  { id: 'pz_exp_book2', coins: 5000, need: 'c5_clear', r: R },
  { id: 'pz_ride_gold_car', coins: 15000, need: 'c5_clear', r: R },
  { id: 'pz_goldstar_mail', coins: 22000, need: 'c5_clear', r: R },
  { id: 'pz_triple7_sword', coins: 22000, need: 'c5_clear', r: R },
  { id: 'pz_dealer_ring', coins: 30000, need: 'c5_clear', tier: 3, r: R },
  // 第6章（1）
  { id: 'pz_job_book4', coins: 9000, need: 'c6_flow', r: R },
  { id: 'pz_ride_galaxy_bike', coins: 15000, need: 'c6_flow', r: R },
  { id: 'pz_gear_shield', coins: 24000, need: 'c6_flow', r: R },
  { id: 'pz_time_claw', coins: 26000, need: 'c6_flow', r: R },
  // 第6章（2）
  { id: 'pz_exp_book3', coins: 12000, need: 'c6_kanata', r: R },
  { id: 'pz_ride_galaxy_pegasus', coins: 20000, need: 'c6_kanata', r: R },
  { id: 'pz_night_dress', coins: 28000, need: 'c6_kanata', r: R },
  { id: 'pz_comet_spear', coins: 30000, need: 'c6_kanata', r: R },
  // 第6章（3）
  { id: 'pz_ride_rainbow_carpet', coins: 25000, need: 'c6_heart', r: R },
  { id: 'pz_clock_mail', coins: 38000, need: 'c6_heart', r: R },
  { id: 'pz_king_clock_sword', coins: 40000, need: 'c6_heart', r: R },
  { id: 'pz_casino_crown', coins: 50000, need: 'c6_heart', tier: 4, r: R },
  { id: 'pz_call_gold_dragon', coins: 60000, need: 'c6_heart', r: R },
];

// ───────────── 小さなメダル（data/casino.js の MEDAL_REWARDS の うしろ）─────────────
// 50枚の 先の ごほうび。メダルは 闘技場で 何回でも もらえるので 100枚まで。
// need … その フラグが つくまでは もらえない（わたした 数が とどいていても、お話が 進んだ あとで もらえる）
export const MEDAL_REWARDS_R50 = [
  { at: 55, items: [['pz_job_book2', 2]], r: R },
  { at: 60, items: [['pz_medal_mantle', 1]], r: R },
  { at: 65, items: [['pz_ride_medal_carpet', 1]], need: 'c2_clear', r: R },
  { at: 70, items: [['pz_exp_book', 3]], r: R },
  { at: 75, items: [['pz_medal_shield', 1]], need: 'c4_clear', r: R },
  { at: 80, items: [['pz_call_medal_king', 1]], need: 'c4_clear', r: R },
  { at: 85, items: [['pz_medal_sword', 1]], need: 'c5_clear', r: R },
  { at: 90, items: [['pz_job_book3', 2], ['pz_exp_book2', 1]], r: R },
  { at: 95, items: [['pz_medal_gold_crown', 1]], need: 'c6_flow', r: R },
  { at: 100, items: [['pz_medal_armor', 1], ['pz_exp_book3', 1]], need: 'c6_heart', r: R },
];

// ───────────── 星のかけら（data/shops.js の STAR_TRADES の うしろ）─────────────
// 種は 入れない（家族で きめた。種は 手に入りやすすぎた）
export const STAR_TRADES_R50 = [
  { shards: 5, item: 'pz_job_book', need: 'c2_clear', r: R },
  { shards: 18, item: 'pz_star_cape', need: 'c2_clear', r: R },
  { shards: 20, item: 'pz_star_boomerang', need: 'c3_clear', r: R },
  { shards: 10, item: 'pz_exp_book', need: 'c4_clear', r: R },
  { shards: 22, item: 'pz_ride_star_bike', need: 'c4_clear', r: R },
  { shards: 30, item: 'pz_star_mail', need: 'c5_argos', r: R },
  { shards: 40, item: 'pz_call_star_pegasus', need: 'c5_clear', r: R },
  { shards: 35, item: 'pz_star_robe', need: 'c6_flow', r: R },
  { shards: 45, item: 'pz_milky_sword', need: 'c6_kanata', r: R },
  { shards: 30, item: 'pz_ride_comet_cloud', need: 'c6_heart', r: R },
  { shards: 50, item: 'pz_star_crown', need: 'c6_heart', r: R },
];

// ───────────── なかま（cat）─────────────
export const PRIZE_CATS = {
  gear: { name: '装備', cls: 'gear' },
  look: { name: '見た目', cls: 'look' },
  tool: { name: '便利', cls: 'tool' },
  monster: { name: '魔物', cls: 'mon' },
};
const EQUIP = ['weapon', 'armor', 'shield', 'head', 'acc'];
const TOOL_EFFECTS = ['jobBook', 'expBook', 'seed', 'multi', 'evoStone', 'heal', 'mpHeal', 'revive', 'cure'];
// 品の なかま（it … ITEMS の 品。品の prizeCat が 先）
export function prizeCatOf(it) {
  if (!it) return 'tool';
  if (it.prizeCat) return it.prizeCat;
  const t = it.effect?.type;
  if (t === 'prizeMonster') return 'monster';
  if (t === 'prizeRide') return 'look';
  // しあわせのぼうし・こうふくのくつ・かわらずのいし（魔物だけの 道具）は 便利な道具
  if (it.perk || it.monsterOnly) return 'tool';
  if (EQUIP.includes(it.type)) return 'gear';
  return TOOL_EFFECTS.includes(t) || it.type === 'use' ? 'tool' : 'gear';
}
