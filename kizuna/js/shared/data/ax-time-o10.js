// 第51回 W（天気の 職業）: 気象予報士・お天気キャスター・天候をあやつる者の 技の 時間と 技の つなぎ。サーバー（shared/battle.js）と クライアントが おなじ 数を 見る（canvas は つかわない）
// 書きかたは ax-time-o6.js と おなじ（docs/plan-r49-fx.md 7章）。この ファイルは W だけが さわる
//   AX_TIME_O10     … { ox_w_〜: { tier, charge: { kind, ms } | false, hit, len, stagger?, party? } }
//                       予算は もとからの 技の 表（shared/ax-time.js の AX_BUDGET_ORIG）: 合計（構え こみ）basic 600〜900・advanced 900〜1300・super 1200〜1800
//                       構え（charge.ms）は basic 200・ほか 300 まで。kind 'ki' は つかわない
//   AX_SKILLS_O10   … { 技の id: 'ox_w_〜' }（abilities-weather.js・hirameki-weather.js の 技。データの anim は かえない）
//   AX_FAMILIES_O10 … { なかまの 名前: ['ox_弱い', …, 'ox_強い'] }（段が 上がるほど 長く・つぶが 多い）
// 段が 上がるほど 豪華: 基本は 小さな 雲と 天気マーク、上級は 天気図・かさ・テレビ、超級は 空ぜんたい（台風の うず・にじ・大きな 太陽・3本の いかずち）

// mk(tier)(合計 ms, 構え ms（0 … 構え なし）, 構えの kind, hit, o)
const mk = (tier) => (total, ms, kind, hit, o = {}) => ({
  tier,
  charge: ms ? { kind, ms } : false,
  hit,
  len: total - ms,
  ...(o.party ? { party: true } : {}),
  ...(o.stagger ? { stagger: o.stagger } : {}),
});
const B = mk('basic'), A = mk('advanced'), S = mk('super');
const P = { party: true };

export const AX_TIME_O10 = {
  // ── 気象予報士（基本） ──
  ox_w_kaminari_chuuiho: B(700, 150, 'magic', 280),
  ox_w_niwaka_ame: B(750, 150, 'magic', 300),
  ox_w_hinatabokko: B(700, 150, 'holy', 300, P),
  ox_w_ashita_yohou: B(700, 150, 'tech', 300, P),
  ox_w_manatsubi: B(800, 150, 'magic', 360),
  ox_w_raiu: B(850, 200, 'magic', 380),
  ox_w_yohou_ooatari: B(900, 200, 'tech', 420),
  // ── お天気キャスター（上級） ──
  ox_w_kaminari_mark: A(1000, 200, 'tech', 380),
  ox_w_minna_kasa: A(1000, 200, 'tech', 360, P),
  ox_w_pokapoka: A(1050, 200, 'holy', 380, P),
  ox_w_zubari: A(950, 200, 'tech', 340, P),
  ox_w_ooame_keihou: A(1100, 200, 'tech', 420),
  ox_w_moushobi: A(1150, 200, 'tech', 440),
  ox_w_raiu_zensen: A(1300, 300, 'tech', 520),
  ox_w_kaminari_gumo: A(1200, 250, 'tech', 480),
  // ── 天候をあやつる者（超級） ──
  ox_w_ikazuchi: S(1300, 200, 'magic', 420),
  ox_w_megumi_ame: S(1400, 250, 'magic', 500, P),
  ox_w_manatsu_taiyou: S(1550, 300, 'star', 560),
  ox_w_taifuu: S(1650, 300, 'magic', 620),
  ox_w_niji: S(1500, 300, 'star', 520, P),
  ox_w_guerrilla: S(1600, 300, 'magic', 600),
  ox_w_sanrenpatsu: S(1700, 300, 'magic', 700),
  ox_w_sora_gourei: S(1800, 300, 'star', 900),
  ox_w_tenkiame: S(1500, 300, 'holy', 520, P),
};

export const AX_SKILLS_O10 = {
  // 気象予報士
  ks_kaminari: 'ox_w_kaminari_chuuiho',
  ks_niwaka: 'ox_w_niwaka_ame',
  ks_hinata: 'ox_w_hinatabokko',
  ks_yohou: 'ox_w_ashita_yohou',
  ks_manatsubi: 'ox_w_manatsubi',
  ks_raiu: 'ox_w_raiu',
  kishou_sig: 'ox_w_yohou_ooatari',
  // お天気キャスター
  oc_kaminari: 'ox_w_kaminari_mark',
  oc_kasa: 'ox_w_minna_kasa',
  oc_hizashi: 'ox_w_pokapoka',
  oc_atari: 'ox_w_zubari',
  oc_ooame: 'ox_w_ooame_keihou',
  oc_moushobi: 'ox_w_moushobi',
  otenki_caster_sig: 'ox_w_raiu_zensen',
  hi_kaminari_gumo: 'ox_w_kaminari_gumo',
  // 天候をあやつる者
  tt_rakurai: 'ox_w_ikazuchi',
  tt_megumi: 'ox_w_megumi_ame',
  tt_manatsu: 'ox_w_manatsu_taiyou',
  tt_taifuu: 'ox_w_taifuu',
  tt_niji: 'ox_w_niji',
  tt_gouu: 'ox_w_guerrilla',
  tt_sanrenpatsu: 'ox_w_sanrenpatsu',
  tenkou_tsukai_sig: 'ox_w_sora_gourei',
  hi_tenkiame: 'ox_w_tenkiame',
};

export const AX_FAMILIES_O10 = {
  かみなり: ['ox_w_kaminari_chuuiho', 'ox_w_kaminari_mark', 'ox_w_ikazuchi'],
  あめ: ['ox_w_niwaka_ame', 'ox_w_ooame_keihou', 'ox_w_guerrilla'],
  ひざし: ['ox_w_manatsubi', 'ox_w_moushobi', 'ox_w_manatsu_taiyou'],
  かんばん: ['ox_w_yohou_ooatari', 'ox_w_raiu_zensen', 'ox_w_sora_gourei'],
};
