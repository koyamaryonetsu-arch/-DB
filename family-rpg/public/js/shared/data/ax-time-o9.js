// 第51回 C3（o9）: 幻の職業の 技の えんしゅつの 時間と 技の つなぎ（サーバーも 読む。import・canvas なし）
//   宇宙一のおかん・はかいと創造の神・夢のスタジアム鉄道・天候の神（abilities-phantom-c.js の 32技）
//   え は client/render/axfx-o9.js、音は client/sfx-ax-o9.js。書きかたは docs/plan-r49-fx.md 7-2
// ・幻の職業は 伝説の 上 → 段は いちばん 上の legend（予算 AX_BUDGET_ORIG.legend: 合計 1.6〜2.4s・構え 0.3s まで・つぶ 120〜300）
// ・構えは みじかい（300ms まで）。気（ki）・カットイン・画面を くらく する のは つかわない
// ・攻撃は 合計 2.0s くらい、看板の 技（Lv10）は 2.3s くらい、味方に かける 技（party）は 1.7s くらい
const G = (ms) => ({ kind: 'generic', ms });
const M = (ms) => ({ kind: 'magic', ms });
const T = (ms) => ({ kind: 'tech', ms });
const I = (ms) => ({ kind: 'idol', ms });
const S = (ms) => ({ kind: 'star', ms });
const H = (ms) => ({ kind: 'holy', ms });

export const AX_TIME_O9 = {
  // ── 宇宙一のおかん
  ox_o9_uchuu_kora: { tier: 'legend', charge: G(260), hit: 520, len: 1700 },
  ox_o9_uchuu_gohan: { tier: 'legend', charge: G(240), hit: 520, len: 1400, party: true },
  ox_o9_seiza_hansei: { tier: 'legend', charge: G(240), hit: 600, len: 1650 },
  ox_o9_nagareboshi_slipper: { tier: 'legend', charge: G(220), hit: 460, len: 1700 },
  ox_o9_uchuu_bentou: { tier: 'legend', charge: G(240), hit: 560, len: 1400, party: true },
  ox_o9_okan_no_ai: { tier: 'legend', charge: H(260), hit: 600, len: 1450, party: true },
  ox_o9_uchuu_kaji: { tier: 'legend', charge: G(240), hit: 520, len: 1400, party: true },
  ox_o9_uchuu_kaminari: { tier: 'legend', charge: G(300), hit: 760, len: 2000 },
  // ── はかいと創造の神
  ox_o9_massara: { tier: 'legend', charge: M(260), hit: 560, len: 1700 },
  ox_o9_tsukurikae: { tier: 'legend', charge: T(260), hit: 520, len: 1400, party: true },
  ox_o9_kowashite_tsukuru: { tier: 'legend', charge: G(240), hit: 480, len: 1700 },
  ox_o9_mu_no_hikari: { tier: 'legend', charge: M(280), hit: 620, len: 1800 },
  ox_o9_sagyoudai: { tier: 'legend', charge: T(260), hit: 560, len: 1450, party: true },
  ox_o9_hakai_souzou_dama: { tier: 'legend', charge: M(300), hit: 700, len: 1900 },
  ox_o9_rule_kakikae: { tier: 'legend', charge: M(260), hit: 600, len: 1650 },
  ox_o9_big_bang: { tier: 'legend', charge: M(300), hit: 820, len: 2050 },
  // ── 夢のスタジアム鉄道
  ox_o9_kankyaku_densha: { tier: 'legend', charge: T(220), hit: 520, len: 1700 },
  ox_o9_daikanshuu_yell: { tier: 'legend', charge: I(240), hit: 480, len: 1400, party: true },
  ox_o9_kaisoku_straight: { tier: 'legend', charge: I(260), hit: 380, len: 1650 },
  ox_o9_stand_wave: { tier: 'legend', charge: I(220), hit: 560, len: 1450, party: true },
  ox_o9_chokutsu_tokkyu: { tier: 'legend', charge: T(240), hit: 520, len: 1800 },
  ox_o9_tsuuka_makyu: { tier: 'legend', charge: I(260), hit: 640, len: 1750 },
  ox_o9_lucky_seven: { tier: 'legend', charge: I(240), hit: 560, len: 1450, party: true },
  ox_o9_manin_onrei: { tier: 'legend', charge: T(300), hit: 900, len: 2050 },
  // ── 天候の神
  ox_o9_nippon_bare: { tier: 'legend', charge: S(260), hit: 520, len: 1450, party: true },
  ox_o9_megumi_ame: { tier: 'legend', charge: M(260), hit: 560, len: 1450, party: true },
  ox_o9_ikazuchi_sora: { tier: 'legend', charge: M(260), hit: 560, len: 1750 },
  ox_o9_manatsu_taiyou: { tier: 'legend', charge: S(280), hit: 600, len: 1800 },
  ox_o9_ten_gouu: { tier: 'legend', charge: M(280), hit: 560, len: 1800 },
  ox_o9_ten_ikazuchi: { tier: 'legend', charge: M(280), hit: 500, len: 1750 },
  ox_o9_niji_kakehashi: { tier: 'legend', charge: H(260), hit: 560, len: 1450, party: true },
  ox_o9_tenkou_hanten: { tier: 'legend', charge: M(300), hit: 860, len: 2050 },
};

export const AX_SKILLS_O9 = {
  co_kora: 'ox_o9_uchuu_kora', co_gohan: 'ox_o9_uchuu_gohan', co_hansei: 'ox_o9_seiza_hansei', co_slipper: 'ox_o9_nagareboshi_slipper',
  co_bentou: 'ox_o9_uchuu_bentou', co_ai: 'ox_o9_okan_no_ai', co_kaji: 'ox_o9_uchuu_kaji', cosmic_okan_sig: 'ox_o9_uchuu_kaminari',
  cc_kesu: 'ox_o9_massara', cc_tsukurikae: 'ox_o9_tsukurikae', cc_kowashite: 'ox_o9_kowashite_tsukuru', cc_mu: 'ox_o9_mu_no_hikari',
  cc_sagyoudai: 'ox_o9_sagyoudai', cc_dama: 'ox_o9_hakai_souzou_dama', cc_rule: 'ox_o9_rule_kakikae', chaos_creator_sig: 'ox_o9_big_bang',
  ds_manin: 'ox_o9_kankyaku_densha', ds_seien: 'ox_o9_daikanshuu_yell', ds_kaisoku: 'ox_o9_kaisoku_straight', ds_wave: 'ox_o9_stand_wave',
  ds_chokutsu: 'ox_o9_chokutsu_tokkyu', ds_makyu: 'ox_o9_tsuuka_makyu', ds_lucky7: 'ox_o9_lucky_seven', dream_stadium_sig: 'ox_o9_manin_onrei',
  wg_hare: 'ox_o9_nippon_bare', wg_ame: 'ox_o9_megumi_ame', wg_kaminari: 'ox_o9_ikazuchi_sora', wg_manatsu: 'ox_o9_manatsu_taiyou',
  wg_gouu: 'ox_o9_ten_gouu', wg_raitei: 'ox_o9_ten_ikazuchi', wg_niji: 'ox_o9_niji_kakehashi', weather_god_sig: 'ox_o9_tenkou_hanten',
};

// なかま（下の 技から 上の 技へ 長く・派手に）
export const AX_FAMILIES_O9 = {
  宇宙のおかんの雷: ['ox_o9_uchuu_kora', 'ox_o9_uchuu_kaminari'],
  消す光: ['ox_o9_massara', 'ox_o9_mu_no_hikari', 'ox_o9_big_bang'],
  観客電車: ['ox_o9_kankyaku_densha', 'ox_o9_chokutsu_tokkyu', 'ox_o9_manin_onrei'],
  天気の雷: ['ox_o9_ikazuchi_sora', 'ox_o9_ten_ikazuchi', 'ox_o9_tenkou_hanten'],
};
