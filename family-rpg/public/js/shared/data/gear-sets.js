// 第88回: そろいの 組（docs/plan-r88-anime-gear.md の 5-1・12-1）
//   作品の 中で もともと 組に なって いる 品だけ。品には set: '組の id' を 書く（1つの 品は 1つの 組）
//
//   GEAR_SETS[id] = { name, items: [品の id], rule, tiers: [{ n, rule?, bonus?, resist?, fx?, title?, text }] }
//     rule … 数え方（tier ごとに rule を 書けば、その 段だけ ちがう 数え方に できる）
//       'wear'  … 1人が つけて いる 数。とどいた 段の bonus・resist・fx が その 人に つく（強さの まどにも 出る）
//       'own'   … 持って いる 数（ふくろ・預かり所・装備して いる 物。同じ 品は 1つと 数える）。title（しょう号）の ため
//       'party' … パーティーで つけて いる 数（戦いの はじめの 仲間で 数える）。とどいた 段の bonus・resist・fx が 全員に（戦いの 中だけ）
//     tiers … n こ いじょうで その 段。同じ 数え方の 段は いちばん 上の 段 だけが 効く（足し算 しない）
//     bonus … { str, def, agi, mag, heal, hp, mp }（品の bonus と 同じ）・resist … { fire: 0.8 }・fx … [{ k, v }]（data/gear-fx.js の GEAR_FX の k）
//     title … しょう号（own の 段）。セーブは しない（持ち物から いつでも 数え直す）
//   計算は shared/gear-r88.js（wear・own）と shared/battle-r88.js（party）
export const GEAR_SETS = {
  // ── ほう神演義: スーパー宝貝 7つ ──
  super_paopei: {
    name: 'スーパー宝貝',
    items: ['r88_raikoben', 'r88_kinben', 'r88_taikyoku', 'r88_kinkosen', 'r88_keisei', 'r88_rokkon', 'r88_banko'],
    rule: 'own',
    tiers: [
      { n: 2, rule: 'wear', bonus: { mag: 10, mp: 20 }, text: '1人が2つつけると、攻撃魔力+10・最大MP+20' },
      { n: 3, rule: 'wear', bonus: { mag: 20, mp: 40 }, text: '1人が3つつけると、攻撃魔力+20・最大MP+40' },
      { n: 3, title: '宝貝の使い手', text: '3つ持つと、しょう号「宝貝の使い手」' },
      { n: 7, title: 'スーパー宝貝の主', text: '7つ全部持つと、しょう号「スーパー宝貝の主」' },
    ],
  },
  // ── YAIBA: 七つの玉（竜神の玉は 8こめ。組には 入らない）──
  seven_orbs: {
    name: '七つの玉',
    items: ['r88_orb_fire', 'r88_orb_water', 'r88_orb_ice', 'r88_orb_dark', 'r88_orb_gold', 'r88_orb_big', 'r88_orb_tou'],
    rule: 'own',
    tiers: [
      { n: 7, title: '七つの玉の主', text: '7つ全部持つと、しょう号「七つの玉の主」' },
    ],
  },
  // ── YAIBA: 風神剣 ＋ 雷神剣 ──
  fujin_raijin: {
    name: '風神と雷神',
    items: ['r88_fujin_sword', 'r88_raijin_sword'],
    rule: 'own',
    tiers: [
      { n: 2, title: '風と雷の剣士', text: '2本とも持つと、しょう号「風と雷の剣士」' },
    ],
  },
};

export const SET_RULES = ['wear', 'own', 'party'];
export const tierRule = (set, tier) => tier.rule || set.rule;
