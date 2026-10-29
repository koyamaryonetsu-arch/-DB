// 第51回 C2（o8）: 幻の職業 4つ（名探てい王・銀河の女王・大魔導王・天下むそうの剣聖）の 技の 時間と 技の つなぎ。
// サーバー（shared/battle.js）と クライアント（render/axfx-o8.js）が おなじ 数を 見る（canvas は つかわない）。この ファイルは C2 だけが さわる
// 書きかたは ax-time-o6.js と おなじ（docs/plan-r49-fx.md 7章）
//   AX_TIME_O8   … { ox_〜: { tier, charge: { kind, ms } | false, hit, len, party? } }
//                  幻の職業は 伝説の 予算（AX_BUDGET_ORIG.legend: 合計 1600〜2400ms・構え 300ms まで・同時の つぶ 120〜300）
//                  構えは みじかい ものだけ（探てい … tech、女王 … holy・star、魔導王 … magic、剣聖 … sword）。気（ki）は つかわない
//   AX_SKILLS_O8 … { 技の id: 'ox_〜' }（データ abilities-phantom-b.js の anim と おなじ 名前）
//   AX_FAMILIES_O8 … なかま（下から 上へ 長く・つぶが へらない）
// ox_tk_yomi_hit … 先読みの 反撃（技では ない。battle-r51b.js の r51bPerform が 出す）

// L(合計 ms, 構え ms（0 … 構え なし）, 構えの kind, hit, o)
const L = (total, ms, kind, hit, o = {}) => ({
  tier: 'legend',
  charge: ms ? { kind, ms } : false,
  hit,
  len: total - ms,
  ...(o.party ? { party: true } : {}),
  ...(o.stagger ? { stagger: o.stagger } : {}),
});
const P = { party: true };

export const AX_TIME_O8 = {
  // ── 名探てい王 ──
  ox_tk_suiri: L(1700, 250, 'tech', 620),
  ox_tk_yomi: L(1800, 250, 'tech', 700),
  ox_tk_megane: L(1700, 250, 'tech', 640),
  ox_tk_trick: L(1800, 250, 'tech', 660),
  ox_tk_alibi: L(1900, 250, 'tech', 760),
  ox_tk_shoot: L(1800, 200, 'tech', 600),
  ox_tk_show: L(1700, 250, 'tech', 600, P),
  ox_detective_king_sig: L(2300, 300, 'tech', 1000),
  ox_tk_yomi_hit: L(1600, 0, 'generic', 420),
  // ── 銀河の女王 ──
  ox_gq_hoshi: L(1700, 250, 'star', 620),
  ox_gq_iyashi: L(1800, 250, 'holy', 640, P),
  ox_gq_barrier: L(1800, 250, 'holy', 680, P),
  ox_gq_nagare: L(1900, 250, 'star', 760),
  ox_gq_fukkatsu: L(1900, 300, 'holy', 760, P),
  ox_gq_amanogawa: L(2100, 300, 'holy', 820, P),
  ox_gq_kanmuri: L(1800, 250, 'star', 640, P),
  ox_galaxy_queen_sig: L(2400, 300, 'star', 1000),
  // ── 大魔導王 ──
  ox_gm_hyouka: L(1700, 250, 'magic', 640),
  ox_gm_buki: L(1700, 200, 'magic', 560),
  ox_gm_mana: L(1600, 250, 'magic', 600, P),
  ox_gm_niju: L(1700, 250, 'magic', 640, P),
  ox_gm_raifuu: L(1900, 250, 'magic', 740),
  ox_gm_shugo: L(1900, 250, 'magic', 700, P),
  ox_gm_medroa: L(2100, 300, 'magic', 820),
  ox_grand_magus_sig: L(2400, 300, 'magic', 1000),
  // ── 天下むそうの剣聖 ──
  ox_ks_issen: L(1600, 250, 'sword', 420),
  ox_ks_kokoro: L(1700, 250, 'sword', 620, P),
  ox_ks_tsubame: L(1700, 250, 'sword', 460),
  ox_ks_kenki: L(1700, 250, 'sword', 640, P),
  ox_ks_hyakka: L(1900, 250, 'sword', 600),
  ox_ks_kiwami: L(1900, 300, 'sword', 640),
  ox_ks_seibai: L(2000, 250, 'sword', 640),
  ox_sword_saint_sig: L(2400, 300, 'sword', 900),
};

export const AX_SKILLS_O8 = {
  tk_suiri: 'ox_tk_suiri', tk_yomi: 'ox_tk_yomi', tk_megane: 'ox_tk_megane', tk_trick: 'ox_tk_trick',
  tk_alibi: 'ox_tk_alibi', tk_shoot: 'ox_tk_shoot', tk_show: 'ox_tk_show', detective_king_sig: 'ox_detective_king_sig',
  gq_hoshi: 'ox_gq_hoshi', gq_iyashi: 'ox_gq_iyashi', gq_barrier: 'ox_gq_barrier', gq_nagare: 'ox_gq_nagare',
  gq_fukkatsu: 'ox_gq_fukkatsu', gq_amanogawa: 'ox_gq_amanogawa', gq_kanmuri: 'ox_gq_kanmuri', galaxy_queen_sig: 'ox_galaxy_queen_sig',
  gm_hyouka: 'ox_gm_hyouka', gm_buki: 'ox_gm_buki', gm_mana: 'ox_gm_mana', gm_niju: 'ox_gm_niju',
  gm_raifuu: 'ox_gm_raifuu', gm_shugo: 'ox_gm_shugo', gm_medroa: 'ox_gm_medroa', grand_magus_sig: 'ox_grand_magus_sig',
  ks_issen: 'ox_ks_issen', ks_kokoro: 'ox_ks_kokoro', ks_tsubame: 'ox_ks_tsubame', ks_kenki: 'ox_ks_kenki',
  ks_hyakka: 'ox_ks_hyakka', ks_kiwami: 'ox_ks_kiwami', ks_seibai: 'ox_ks_seibai', sword_saint_sig: 'ox_sword_saint_sig',
};

export const AX_FAMILIES_O8 = {
  王の推理: ['ox_tk_suiri', 'ox_detective_king_sig'],
  星の光: ['ox_gq_hoshi', 'ox_gq_nagare', 'ox_galaxy_queen_sig'],
  二重呪文: ['ox_gm_hyouka', 'ox_gm_raifuu', 'ox_gm_medroa', 'ox_grand_magus_sig'],
  剣聖の太刀: ['ox_ks_issen', 'ox_ks_hyakka', 'ox_ks_seibai', 'ox_sword_saint_sig'],
};
