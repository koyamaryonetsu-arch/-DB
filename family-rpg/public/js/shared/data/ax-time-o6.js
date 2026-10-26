// 第49回 O6（魔法・星・お笑い・配信）: もとからの 技（ふつうの 職業・ひらめき・合体技）の 時間と 技の つなぎ。サーバー（shared/battle.js）と クライアントが おなじ 数を 見る（canvas は つかわない）
// 書きかたは docs/plan-r49-fx.md 7章（と docs/plan-r48-fx.md の「G0 の 決めごと」）。この ファイルは O6 だけが さわる
//   AX_TIME_O6     … { ox_〜: { tier, charge: { kind, ms? } | false, hit, len, stagger?, party?, vars? } }
//                      tier: 'basic' | 'advanced' | 'super' | 'legend'（B・A・S・L）。hit … はなって あたる まで、len … はなって おわる まで（ms）
//                      予算は もとからの 技の 表（shared/ax-time.js の AX_BUDGET_ORIG）: 合計（構え こみ）basic 600〜900・advanced 900〜1300・super 1200〜1800・legend 1600〜2400
//                      構え（charge.ms）は basic 200・ほか 300 まで。kind 'ki' は つかわない（気は ドラゴンボールだけ）。合体技は charge: false（2人 1600・3人 1900・4人 2100 が めやす）
//   AX_SKILLS_O6   … { 技の id: 'ox_〜' | { anim: 'ox_〜', tier?, charge?, vars?, element? } }
//                      plan-r49-fx.md 6章の O6 の 技だけ。'id@masc' … 男の子の 版。合体技は DUAL_TECHS の id（dt_〜）。データの anim は かえない
//   AX_FAMILIES_O6 … { なかまの 名前: ['ox_弱い', …, 'ox_強い'] }
// 合計（構え ＋ len）は plan-r49-fx.md 5章 O6 の 表の「段 合計（構え）」。len ＝ 合計 − 構え

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
// 合体技（ため なし。len ＝ 合計）
const D = (total, hit, o = {}) => ({ tier: 'super', charge: false, hit, len: total, ...(o.party ? { party: true } : {}) });

export const AX_TIME_O6 = {
  // ── 旅芸人（基本） ──
  ox_hustle_dance: B(650, 150, 'idol', 200, P),
  ox_hifuki_gei: B(750, 0, 'generic', 300),
  ox_medapani_dance: B(750, 150, 'idol', 260),
  ox_knife_juggling: B(750, 0, 'generic', 340),
  ox_ouen_uta: B(650, 150, 'idol', 220, P),
  ox_tatakai_uta: B(650, 150, 'idol', 220, P),
  ox_tamanori: B(750, 0, 'generic', 360),
  ox_mezame_odori: B(750, 200, 'idol', 260, P),
  ox_happy_step: B(750, 200, 'idol', 280, P),
  ox_knife_ame: B(850, 0, 'generic', 420),
  // ── 遊び人（基本） ──
  ox_asobu: B(650, 0, 'generic', 300, P),
  ox_gag: B(750, 0, 'generic', 300),
  ox_undameshi: B(750, 0, 'generic', 400),
  ox_neru: B(650, 0, 'generic', 340, P),
  ox_kuchibue: B(650, 0, 'generic', 280, P),
  ox_bakuten: B(650, 0, 'generic', 320, P),
  ox_kusuguri: B(750, 0, 'generic', 300),
  ox_darts: B(750, 0, 'generic', 300),
  ox_pie_nage: B(750, 0, 'generic', 360),
  ox_chou_lucky: B(750, 200, 'star', 300, P),
  ox_daibakushou: B(850, 0, 'generic', 320),
  ox_darts_meijin: B(850, 0, 'generic', 340),
  // ── ユーチューバー（基本） ──
  ox_jidoribou: B(750, 0, 'generic', 300),
  ox_nama_haishin: B(650, 150, 'tech', 220, P),
  ox_tsuri_samune: B(750, 0, 'generic', 300),
  ox_kirinuki: B(750, 0, 'generic', 300),
  ox_ougata_kikaku: B(650, 150, 'tech', 260, P),
  ox_channel_touroku: B(750, 150, 'idol', 280),
  ox_hyakuman_saisei: B(850, 200, 'tech', 320),
  ox_kyuujoushou: B(750, 200, 'tech', 280, P),
  ox_buzz_douga: B(850, 200, 'tech', 320),
  // ── ゲーマー（基本） ──
  ox_renda: B(750, 150, 'tech', 200),
  ox_save_point: B(650, 150, 'tech', 240, P),
  ox_bug_waza: B(650, 150, 'tech', 260, P),
  ox_kakin_item: B(650, 150, 'tech', 260, P),
  ox_controller_nage: B(750, 0, 'generic', 320),
  ox_tetsuya_game: B(650, 150, 'tech', 260, P),
  ox_hame_waza: B(750, 150, 'tech', 260),
  ox_renzoku_combo: B(750, 150, 'tech', 180),
  ox_lastboss_taoshikata: B(850, 200, 'tech', 330),
  ox_kakushi_command: B(850, 200, 'tech', 380),
  ox_time_attack: B(850, 200, 'tech', 200),
  // ── スーパースター（上級） ──
  ox_star_dance: A(950, 200, 'idol', 300, P),
  ox_stardust: A(1050, 200, 'star', 380),
  ox_spotlight: A(950, 200, 'idol', 300, P),
  ox_miryou_pose: A(1050, 200, 'idol', 380),
  ox_happy_parade: A(950, 200, 'idol', 340, P),
  ox_super_nova: A(1050, 200, 'star', 450),
  ox_encore_superstar: A(1100, 250, 'idol', 360, P),
  // ── 占い師（上級） ──
  ox_tarot_taiyou: A(950, 200, 'magic', 340, P),
  ox_tarot_tsuki: A(1050, 200, 'magic', 400),
  ox_tarot_hoshi: A(1050, 200, 'magic', 420),
  ox_tarot_tou: A(1050, 200, 'magic', 450),
  ox_tarot_unmei: A(1100, 250, 'magic', 450, P),
  // ── お笑い芸人（上級） ──
  ox_tsukkomi: A(1050, 0, 'generic', 300),
  ox_boke: A(950, 0, 'generic', 400, P),
  ox_ippatsu_gag: A(1050, 0, 'generic', 360),
  ox_conte: A(1050, 0, 'generic', 300),
  ox_warai_chikara: A(950, 0, 'generic', 360, P),
  ox_monomane: A(950, 0, 'generic', 450, P),
  ox_bakushou_uzu: A(1250, 0, 'generic', 450),
  ox_nori_tsukkomi: A(1250, 0, 'generic', 650),
  ox_tendon: A(1250, 0, 'generic', 300),
  // ── 人気配信者（上級） ──
  ox_collab_haishin: A(950, 200, 'tech', 320, P),
  ox_dokkiri: A(1050, 0, 'generic', 380),
  ox_daienjou: A(1050, 0, 'generic', 420),
  ox_hyakuman_kinen: A(950, 200, 'idol', 300, P),
  ox_kamikai: A(950, 200, 'idol', 360, P),
  ox_nagesen_ame: A(1050, 200, 'tech', 400),
  ox_douji_setsuzoku: A(1100, 250, 'tech', 400, P),
  ox_kougaku_superchat: A(1250, 250, 'tech', 520),
  // ── プロゲーマー（上級） ──
  ox_one_frame: A(950, 0, 'generic', 300, P),
  ox_keyboard_crash: A(1050, 200, 'tech', 320),
  ox_kousoku_nyuuryoku: A(1050, 200, 'tech', 220),
  ox_meta_yomi: A(1050, 200, 'tech', 380),
  ox_kami_play: A(1050, 200, 'tech', 330),
  ox_sakusen_kaigi: A(950, 200, 'tech', 340, P),
  ox_sekai_yuushou: A(1250, 250, 'idol', 480),
  ox_nomiss_clear: A(1250, 250, 'tech', 380),
  // ── 大魔道士・天地雷鳴士・大賢者・大神官（超級） ──
  ox_maryoku_izumi: S(1250, 250, 'magic', 450, P),
  ox_genma_ifrit: S(1400, 250, 'magic', 550),
  ox_genma_undine: S(1250, 250, 'magic', 500, P),
  ox_genma_kyojin: S(1250, 250, 'magic', 500, P),
  ox_genma_ryuujin: S(1700, 300, 'magic', 650),
  ox_kenja_ishi: S(1250, 250, 'magic', 450, P),
  ox_satori: S(1250, 250, 'magic', 450, P),
  ox_seinaru_kekkai: S(1450, 300, 'holy', 550, P),
  // ── 星の歌姫（超級） ──
  ox_hoshi_no_uta: S(1250, 250, 'idol', 450, P),
  ox_hoshi_komoriuta: S(1400, 250, 'idol', 500),
  ox_hoshi_shukufuku: S(1250, 250, 'star', 450, P),
  ox_amanogawa: S(1450, 300, 'star', 500, P),
  // ── M-1王者（超級） ──
  ox_machinegun_talk: S(1400, 0, 'generic', 300),
  ox_densetsu_tsukkomi: S(1400, 0, 'generic', 450),
  ox_kesshou_neta: S(1250, 250, 'idol', 500, P),
  ox_daikansei: S(1250, 250, 'idol', 450, P),
  ox_yuushou_no_toki: S(1700, 300, 'idol', 600),
  ox_yonpun_manzai: S(1700, 0, 'generic', 400),
  // ── 合体技（ため なし） ──
  ox_taishoumetsu: D(1600, 750),
  ox_honoo_tatsumaki: D(1600, 600),
  ox_iyashi_no_wa: D(1600, 700, P),
  ox_stage_show: D(1600, 700, P),
  ox_manzai_dual: D(1600, 700),
  ox_hikari_to_yami: D(1600, 800),
  ox_fubuki_ouzu: D(1600, 550),
  ox_hikari_shower: D(1600, 600, P),
  ox_dai_collab: D(1900, 700),
};

export const AX_SKILLS_O6 = {
  // 旅芸人
  hustle: 'ox_hustle_dance', pf_hifuki: 'ox_hifuki_gei', medapani: 'ox_medapani_dance', juggling: 'ox_knife_juggling',
  ouen: 'ox_ouen_uta', tatakai_uta: 'ox_tatakai_uta', pf_tamanori: 'ox_tamanori', zameha_dance: 'ox_mezame_odori',
  hk_happy_step: 'ox_happy_step', hk_knife_rain: 'ox_knife_ame',
  // 遊び人
  js_asobu: 'ox_asobu', js_gag: 'ox_gag', js_lucky: 'ox_undameshi', js_neru: 'ox_neru', js_kuchibue: 'ox_kuchibue',
  js_bakuten: 'ox_bakuten', js_kusuguri: 'ox_kusuguri', js_darts: 'ox_darts', js_pie: 'ox_pie_nage', js_miracle: 'ox_chou_lucky',
  hk_daibakushou: 'ox_daibakushou', hk_darts_master: 'ox_darts_meijin',
  // ユーチューバー
  yt_jidori: 'ox_jidoribou', yt_live: 'ox_nama_haishin', yt_samune: 'ox_tsuri_samune', yt_kirinuki: 'ox_kirinuki',
  yt_kikaku: 'ox_ougata_kikaku', yt_touroku: 'ox_channel_touroku', yt_hyakuman: 'ox_hyakuman_saisei',
  hi_kyuujoushou: 'ox_kyuujoushou', hi_buzz: 'ox_buzz_douga',
  // ゲーマー
  ga_renda: 'ox_renda', ga_save: 'ox_save_point', ga_bug: 'ox_bug_waza', ga_kakin: 'ox_kakin_item', ga_controller: 'ox_controller_nage',
  ga_tetsuya: 'ox_tetsuya_game', ga_hame: 'ox_hame_waza', ga_combo: 'ox_renzoku_combo', ga_lastboss: 'ox_lastboss_taoshikata',
  hi_kakushi_command: 'ox_kakushi_command', hi_time_attack: 'ox_time_attack',
  // スーパースター
  ss_stardance: 'ox_star_dance', ss_stardust: 'ox_stardust', ss_spotlight: 'ox_spotlight', ss_charm: 'ox_miryou_pose',
  ss_happy: 'ox_happy_parade', ss_nova: 'ox_super_nova', ss_encore: 'ox_encore_superstar',
  // 占い師
  ft_sun: 'ox_tarot_taiyou', ft_moon: 'ox_tarot_tsuki', ft_star: 'ox_tarot_hoshi', ft_tower: 'ox_tarot_tou', ft_fate: 'ox_tarot_unmei',
  // お笑い芸人
  cm_tsukkomi: 'ox_tsukkomi', cm_boke: 'ox_boke', cm_gag: 'ox_ippatsu_gag', cm_conte: 'ox_conte', cm_warai: 'ox_warai_chikara',
  cm_monomane: 'ox_monomane', cm_bakushou: 'ox_bakushou_uzu', hi_noritsukkomi: 'ox_nori_tsukkomi', hi_tendon: 'ox_tendon',
  // 人気配信者
  st_collab: 'ox_collab_haishin', st_dokkiri: 'ox_dokkiri', st_daienjou: 'ox_daienjou', st_kinen: 'ox_hyakuman_kinen',
  st_kamikai: 'ox_kamikai', st_nagesen: 'ox_nagesen_ame', st_doujisetsuzoku: 'ox_douji_setsuzoku', hi_kougaku_superchat: 'ox_kougaku_superchat',
  // プロゲーマー
  pg_frame: 'ox_one_frame', pg_keyboard: 'ox_keyboard_crash', pg_nyuuryoku: 'ox_kousoku_nyuuryoku', pg_meta: 'ox_meta_yomi',
  pg_kamiplay: 'ox_kami_play', pg_team: 'ox_sakusen_kaigi', pg_yuushou: 'ox_sekai_yuushou', hi_nomiss: 'ox_nomiss_clear',
  // 大魔道士・天地雷鳴士・大賢者・大神官
  am_manaheal: 'ox_maryoku_izumi', sm_ifrit: 'ox_genma_ifrit', sm_undine: 'ox_genma_undine', sm_kyojin: 'ox_genma_kyojin',
  hi_ryuujin: 'ox_genma_ryuujin', dz_ishi: 'ox_kenja_ishi', dz_satori: 'ox_satori', hi_seinaru_kekkai: 'ox_seinaru_kekkai',
  // 星の歌姫
  sd_song: 'ox_hoshi_no_uta', sd_lullaby: 'ox_hoshi_komoriuta', sd_blessing: 'ox_hoshi_shukufuku', hi_amanogawa: 'ox_amanogawa',
  // M-1王者
  m1_machinegun: 'ox_machinegun_talk', m1_densetsu: 'ox_densetsu_tsukkomi', m1_neta: 'ox_kesshou_neta', m1_kansei: 'ox_daikansei',
  m1_yuushou: 'ox_yuushou_no_toki', hi_4min_manzai: 'ox_yonpun_manzai',
  // 合体技
  dt_taishoumetsu: 'ox_taishoumetsu', dt_honoo_tatsumaki: 'ox_honoo_tatsumaki', dt_iyashi_wa: 'ox_iyashi_no_wa', dt_stage: 'ox_stage_show',
  dt_manzai: 'ox_manzai_dual', dt_hikari_yami: 'ox_hikari_to_yami', dt_fubuki: 'ox_fubuki_ouzu', dt_hikari_shower: 'ox_hikari_shower',
  dt_dai_collab: 'ox_dai_collab',
};

export const AX_FAMILIES_O6 = {
  ギャグ: ['ox_gag', 'ox_daibakushou', 'ox_ippatsu_gag', 'ox_bakushou_uzu', 'ox_yonpun_manzai'],
  ツッコミ: ['ox_tsukkomi', 'ox_nori_tsukkomi', 'ox_densetsu_tsukkomi'],
  ダーツ: ['ox_darts', 'ox_darts_meijin'],
  配信: ['ox_nama_haishin', 'ox_collab_haishin'],
  スパチャ: ['ox_hyakuman_saisei', 'ox_nagesen_ame', 'ox_kougaku_superchat'],
  タロット: ['ox_tarot_tsuki', 'ox_tarot_hoshi', 'ox_tarot_tou'],
  げんま: ['ox_genma_ifrit', 'ox_genma_ryuujin'],
  光と闇: ['ox_taishoumetsu', 'ox_hikari_to_yami'],
};
