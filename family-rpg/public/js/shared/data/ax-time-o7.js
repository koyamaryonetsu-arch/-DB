// 第51回 C1（o7）: 幻の職業 … 海賊王・伝説の超勇者・日の火影・天才しせつ管理者AI の 技の 時間と 技の つなぎ（docs/plan-r51-phantom.md）
// 書きかたは o1〜o6 と おなじ（docs/plan-r49-fx.md 7章）。サーバー（shared/battle.js）と クライアント（render/axfx-o7.js）が おなじ 数を 見る
//   AX_TIME_O7     … { ox_〜: { tier, charge: { kind, ms } | false, hit, len, party? } }
//                      幻の職業は いちばん 上の 段 legend（もとからの 技の 予算 AX_BUDGET_ORIG: 合計 1600〜2400ms・構え 300ms まで）
//                      気（kind 'ki'）は ドラゴンボールだけ（g1）なので つかわない。かめはめデインの 気は え の 中で 金色の オーラを かく
//   AX_SKILLS_O7   … { 技の id: 'ox_〜' }（abilities-phantom-a.js の 32技）
//   AX_FAMILIES_O7 … { なかまの 名前: ['ox_弱い', …, 'ox_強い'] }（段・長さ・つぶが へらない）

// L(合計 ms, 構え ms, 構えの kind, hit, o)。len ＝ 合計 − 構え
const L = (total, ms, kind, hit, o = {}) => ({
  tier: 'legend',
  charge: ms ? { kind, ms } : false,
  hit,
  len: total - ms,
  ...(o.party ? { party: true } : {}),
  ...(o.stagger ? { stagger: o.stagger } : {}),
});
const P = { party: true };

export const AX_TIME_O7 = {
  // ── 海賊王 ──
  ox_pk_gatling: L(1900, 250, 'gomu', 380),
  ox_pk_hata: L(1650, 250, 'gomu', 520, P),
  ox_pk_ichimi: L(2100, 250, 'gomu', 700),
  ox_pk_jiyuu: L(2200, 300, 'gomu', 560),
  ox_pk_utage: L(1700, 200, 'gomu', 560, P),
  ox_pk_haoh: L(1800, 300, 'gomu', 420),
  ox_pk_taiyou: L(2150, 300, 'gomu', 660),
  ox_pk_sig: L(2400, 300, 'gomu', 900),
  // ── 伝説の超勇者 ──
  ox_sh_ken: L(1800, 250, 'sword', 360),
  ox_sh_ki: L(1700, 300, 'holy', 520, P),
  ox_sh_gigaslash: L(2000, 250, 'sword', 520),
  ox_sh_aura: L(1700, 250, 'holy', 520, P),
  ox_sh_inori: L(1700, 250, 'holy', 600, P),
  ox_sh_gigadein: L(2100, 300, 'magic', 640),
  ox_sh_rengeki: L(2050, 200, 'generic', 360),
  ox_sh_sig: L(2400, 300, 'holy', 1000),
  // ── 日の火影 ──
  ox_sk_bunshin: L(1700, 250, 'chakra', 480, P),
  ox_sk_kasha: L(1900, 250, 'breath', 420),
  ox_sk_rasen: L(2000, 300, 'chakra', 620),
  ox_sk_hirin: L(2100, 250, 'breath', 480),
  ox_sk_ishi: L(1650, 250, 'chakra', 500, P),
  ox_sk_bijuu: L(2200, 300, 'chakra', 800),
  ox_sk_kekkai: L(1650, 250, 'breath', 500, P),
  ox_sk_sig: L(2400, 300, 'breath', 700),
  // ── 天才しせつ管理者AI ──
  ox_fa_scan: L(1700, 250, 'tech', 600),
  ox_fa_mode: L(1650, 250, 'tech', 480, P),
  ox_fa_kuuchou: L(1750, 250, 'tech', 560, P),
  ox_fa_shohou: L(1700, 250, 'tech', 520, P),
  ox_fa_demand: L(1900, 250, 'tech', 600),
  ox_fa_drone: L(2000, 250, 'tech', 480),
  ox_fa_hirameki: L(2100, 300, 'tech', 640),
  ox_fa_sig: L(2400, 300, 'tech', 860),
};

export const AX_SKILLS_O7 = {
  pk_gatling: 'ox_pk_gatling', pk_hata: 'ox_pk_hata', pk_ichimi: 'ox_pk_ichimi', pk_jiyuu: 'ox_pk_jiyuu',
  pk_utage: 'ox_pk_utage', pk_haoh: 'ox_pk_haoh', pk_taiyou: 'ox_pk_taiyou', pirate_king_sig: 'ox_pk_sig',
  sh_ken: 'ox_sh_ken', sh_ki: 'ox_sh_ki', sh_gigaslash: 'ox_sh_gigaslash', sh_aura: 'ox_sh_aura',
  sh_inori: 'ox_sh_inori', sh_gigadein: 'ox_sh_gigadein', sh_rengeki: 'ox_sh_rengeki', super_hero_sig: 'ox_sh_sig',
  sk_bunshin: 'ox_sk_bunshin', sk_kasha: 'ox_sk_kasha', sk_rasen: 'ox_sk_rasen', sk_hirin: 'ox_sk_hirin',
  sk_ishi: 'ox_sk_ishi', sk_bijuu: 'ox_sk_bijuu', sk_kekkai: 'ox_sk_kekkai', sun_hokage_sig: 'ox_sk_sig',
  fa_scan: 'ox_fa_scan', fa_mode: 'ox_fa_mode', fa_kuuchou: 'ox_fa_kuuchou', fa_shohou: 'ox_fa_shohou',
  fa_demand: 'ox_fa_demand', fa_drone: 'ox_fa_drone', fa_hirameki: 'ox_fa_hirameki', facility_ai_sig: 'ox_fa_sig',
  // ひらめき技（hirameki-phantom-a.js）は 近い 技の え に vars で ちがいを つける
  hi_pk_raijin: { anim: 'ox_pk_gatling', vars: { hira: 1 } },
  hi_sh_raikou: { anim: 'ox_sh_ken', vars: { hira: 1 } },
  hi_sk_shuriken: { anim: 'ox_sk_rasen', vars: { shuriken: 1 } },
  hi_fa_twin: { anim: 'ox_fa_kuuchou', vars: { twin: 1 } },
};

// 攻撃の 技の なかま（下から 上へ 長く・つぶが 多く）
export const AX_FAMILIES_O7 = {
  海賊王: ['ox_pk_gatling', 'ox_pk_ichimi', 'ox_pk_jiyuu', 'ox_pk_sig'],
  超勇者: ['ox_sh_ken', 'ox_sh_gigaslash', 'ox_sh_gigadein', 'ox_sh_sig'],
  日の火影: ['ox_sk_kasha', 'ox_sk_rasen', 'ox_sk_hirin', 'ox_sk_sig'],
  天才AI: ['ox_fa_drone', 'ox_fa_hirameki', 'ox_fa_sig'],
};
