// 第49回 O3（会社と お金）: もとからの 技（ふつうの 職業・ひらめき・合体技）の 時間と 技の つなぎ。サーバー（shared/battle.js）と クライアントが おなじ 数を 見る（canvas は つかわない）
// 書きかたは docs/plan-r49-fx.md 7章（と docs/plan-r48-fx.md の「G0 の 決めごと」）。この ファイルは O3 だけが さわる
//   AX_TIME_O3     … { ox_〜: { tier, charge: { kind, ms? } | false, hit, len, stagger?, party?, vars? } }
//                      tier: 'basic' | 'advanced' | 'super' | 'legend'（B・A・S・L）。hit … はなって あたる まで、len … はなって おわる まで（ms）
//                      予算は もとからの 技の 表（shared/ax-time.js の AX_BUDGET_ORIG）: 合計（構え こみ）basic 600〜900・advanced 900〜1300・super 1200〜1800・legend 1600〜2400
//                      構え（charge.ms）は basic 200・ほか 300 まで。kind 'ki' は つかわない（気は ドラゴンボールだけ）。合体技は charge: false（2人 1600・3人 1900・4人 2100 が めやす）
//   AX_SKILLS_O3   … { 技の id: 'ox_〜' | { anim: 'ox_〜', tier?, charge?, vars?, element? } }
//                      plan-r49-fx.md 6章の O3 の 技だけ。'id@masc' … 男の子の 版。合体技は DUAL_TECHS の id（dt_〜）。データの anim は かえない
//   AX_FAMILIES_O3 … { なかまの 名前: ['ox_弱い', …, 'ox_強い'] }
// 5章の「段 合計（構え）」→ charge.ms ＝ 構え、len ＝ 合計 − 構え。party … 味方・自分に かける 技（※）
const ch = (kind, ms) => ({ kind, ms });
export const AX_TIME_O3 = {
  // ── 会社員（基本職）
  ox_meishi_watashi: { tier: 'basic', charge: false, hit: 300, len: 750 },
  ox_hourensou: { tier: 'basic', charge: ch('tech', 150), hit: 260, len: 500, party: true },
  ox_kaban_attack: { tier: 'basic', charge: false, hit: 260, len: 750 },
  ox_zangyo: { tier: 'basic', charge: ch('generic', 150), hit: 260, len: 500, party: true },
  ox_coffee_break: { tier: 'basic', charge: false, hit: 320, len: 650, party: true },
  ox_teiji_dash: { tier: 'basic', charge: false, hit: 220, len: 650, party: true },
  ox_presen: { tier: 'basic', charge: ch('tech', 150), hit: 330, len: 600 },
  ox_nomikai: { tier: 'basic', charge: false, hit: 260, len: 650, party: true },
  ox_tobikomi_eigyo: { tier: 'basic', charge: false, hit: 340, len: 760 },
  ox_nouki_dash: { tier: 'basic', charge: false, hit: 330, len: 750, stagger: 50 },
  ox_bonus_shikyu: { tier: 'basic', charge: ch('generic', 200), hit: 260, len: 560, party: true },
  ox_meishi_shuriken: { tier: 'basic', charge: false, hit: 300, len: 850, stagger: 50 },
  ox_team_coffee: { tier: 'basic', charge: false, hit: 360, len: 750, party: true },
  // ── アルバイト（基本職）
  ox_danboru: { tier: 'basic', charge: false, hit: 300, len: 750 },
  ox_irasshaimase: { tier: 'basic', charge: ch('generic', 150), hit: 200, len: 600, stagger: 50 },
  ox_reji_uchi: { tier: 'basic', charge: ch('tech', 150), hit: 140, len: 600 },
  ox_makanai: { tier: 'basic', charge: false, hit: 300, len: 650, party: true },
  ox_shift_koutai: { tier: 'basic', charge: false, hit: 300, len: 650, party: true },
  ox_shinadashi: { tier: 'basic', charge: false, hit: 280, len: 750, stagger: 50 },
  ox_shinya_kinmu: { tier: 'basic', charge: ch('generic', 150), hit: 240, len: 500, party: true },
  ox_tenchou_yobu: { tier: 'basic', charge: false, hit: 320, len: 650, party: true },
  ox_kaikinshou: { tier: 'basic', charge: ch('generic', 150), hit: 260, len: 500, party: true },
  ox_nenmatsu: { tier: 'basic', charge: ch('generic', 200), hit: 160, len: 650 },
  ox_wanope: { tier: 'basic', charge: false, hit: 200, len: 850 },
  ox_smile_zero: { tier: 'basic', charge: ch('idol', 200), hit: 220, len: 560, party: true },
  // ── 部長（上級職）
  ox_kaigi_shoushuu: { tier: 'advanced', charge: ch('tech', 200), hit: 420, len: 850, stagger: 50 },
  ox_golf_swing: { tier: 'advanced', charge: false, hit: 340, len: 1050 },
  ox_kessai: { tier: 'advanced', charge: false, hit: 300, len: 950, party: true },
  ox_buka_homeru: { tier: 'advanced', charge: false, hit: 340, len: 950, party: true },
  ox_idou_meirei: { tier: 'advanced', charge: false, hit: 380, len: 1050 },
  ox_shucchou_rush: { tier: 'advanced', charge: false, hit: 240, len: 1050 },
  ox_sashimodoshi: { tier: 'advanced', charge: false, hit: 420, len: 1250, stagger: 50 },
  ox_settai_golf: { tier: 'advanced', charge: false, hit: 560, len: 1250 },
  // ── 正社員（上級職）
  ox_shainshou: { tier: 'advanced', charge: false, hit: 200, len: 1050 },
  ox_chourei: { tier: 'advanced', charge: ch('generic', 200), hit: 300, len: 750, party: true },
  ox_yuukyuu: { tier: 'advanced', charge: false, hit: 400, len: 950, party: true },
  ox_project_shidou: { tier: 'advanced', charge: ch('tech', 200), hit: 380, len: 850, stagger: 50 },
  ox_fukuri_kousei: { tier: 'advanced', charge: false, hit: 380, len: 950, party: true },
  ox_ookuchi_chuumon: { tier: 'advanced', charge: false, hit: 380, len: 1050 },
  ox_shusse: { tier: 'advanced', charge: ch('generic', 250), hit: 420, len: 850, party: true },
  ox_shachoushou: { tier: 'advanced', charge: ch('generic', 250), hit: 380, len: 850, party: true },
  // ── 社ちく（上級職）
  ox_eiyou_drink: { tier: 'advanced', charge: false, hit: 360, len: 950, party: true },
  ox_nagai_kaigi: { tier: 'advanced', charge: ch('tech', 200), hit: 440, len: 850, stagger: 50 },
  ox_shachiku_iji: { tier: 'advanced', charge: ch('generic', 200), hit: 300, len: 850 },
  ox_pekopeko: { tier: 'advanced', charge: false, hit: 460, len: 1050, stagger: 50 },
  ox_shuuden_dash: { tier: 'advanced', charge: false, hit: 260, len: 1250 },
  ox_reply_all: { tier: 'advanced', charge: ch('tech', 250), hit: 340, len: 1000, stagger: 50 },
  ox_drink_sanbonme: { tier: 'advanced', charge: false, hit: 620, len: 1100, party: true },
  // ── 楽天カードマン（上級職）
  ox_card_shu: { tier: 'advanced', charge: false, hit: 220, len: 1050 },
  ox_point_back: { tier: 'advanced', charge: false, hit: 360, len: 950, party: true },
  ox_bunkatsu: { tier: 'advanced', charge: false, hit: 300, len: 1050 },
  ox_akai_tights: { tier: 'advanced', charge: ch('generic', 200), hit: 240, len: 750, party: true },
  ox_cardman_dance: { tier: 'advanced', charge: ch('idol', 200), hit: 360, len: 850, stagger: 50 },
  ox_okaimono_marathon: { tier: 'advanced', charge: false, hit: 300, len: 1250 },
  // ── 社長（超級職）
  ox_tsuru_hitokoe: { tier: 'super', charge: ch('generic', 250), hit: 360, len: 1000, party: true },
  ox_private_jet: { tier: 'super', charge: false, hit: 460, len: 1400, stagger: 50 },
  ox_shachou_meirei: { tier: 'super', charge: ch('generic', 250), hit: 320, len: 1000, party: true },
  ox_kabunushi_soukai: { tier: 'super', charge: false, hit: 460, len: 1400, stagger: 50 },
  ox_ougata_baishuu: { tier: 'super', charge: ch('generic', 250), hit: 360, len: 1150, stagger: 50 },
  ox_oneman: { tier: 'super', charge: false, hit: 400, len: 1400 },
  ox_top_down: { tier: 'super', charge: ch('generic', 300), hit: 460, len: 1400 },
  ox_bonus_daihoushutsu: { tier: 'super', charge: ch('generic', 300), hit: 460, len: 1150, party: true },
  // ── キャリア組（超級職）
  ox_seisaku_kettei: { tier: 'super', charge: false, hit: 420, len: 1250, party: true },
  ox_ronpa: { tier: 'super', charge: false, hit: 300, len: 1400 },
  ox_nemawashi: { tier: 'super', charge: false, hit: 520, len: 1400, stagger: 50 },
  ox_kiki_kanri: { tier: 'super', charge: ch('holy', 250), hit: 400, len: 1000, party: true },
  ox_houkaisei: { tier: 'super', charge: false, hit: 460, len: 1400, stagger: 50 },
  ox_buatsui_hakusho: { tier: 'super', charge: false, hit: 400, len: 1400 },
  ox_daikaikaku: { tier: 'super', charge: ch('generic', 300), hit: 520, len: 1400, stagger: 50 },
  ox_yosan_cut: { tier: 'super', charge: false, hit: 520, len: 1700, stagger: 50 },
  // ── たたき上げ社長（超級職）
  ox_genba_hyakkai: { tier: 'super', charge: false, hit: 380, len: 1400 },
  ox_doronko_konjou: { tier: 'super', charge: ch('generic', 250), hit: 360, len: 1000, party: true },
  ox_zensha_ichigan: { tier: 'super', charge: ch('generic', 250), hit: 420, len: 1000, party: true },
  ox_satsutaba_binta: { tier: 'super', charge: false, hit: 360, len: 1400 },
  ox_shain_ryokou: { tier: 'super', charge: false, hit: 520, len: 1250, party: true },
  ox_tatakiage_ichigeki: { tier: 'super', charge: ch('generic', 300), hit: 640, len: 1400, stagger: 50 },
  ox_genba_shachou: { tier: 'super', charge: false, hit: 620, len: 1700, stagger: 50 },
  // ── ブラックきぎょうの星（超級職）
  ox_kyuujitsu_shukkin: { tier: 'super', charge: ch('generic', 250), hit: 360, len: 1000, party: true },
  ox_kaisha_tomari: { tier: 'super', charge: false, hit: 460, len: 1250, party: true },
  ox_norma_tassei: { tier: 'super', charge: ch('generic', 250), hit: 520, len: 1150 },
  ox_zenin_shussha: { tier: 'super', charge: false, hit: 460, len: 1400, stagger: 50 },
  ox_getsumatsu_shimekiri: { tier: 'super', charge: false, hit: 660, len: 1700, stagger: 50 },
  // ── 合体技（ため なし）
  ox_tsukin_rush: { tier: 'super', charge: false, hit: 620, len: 1600, stagger: 50 },
  ox_point_juubai: { tier: 'super', charge: false, hit: 560, len: 1600, stagger: 50 },
  ox_buchou_ogori: { tier: 'super', charge: false, hit: 640, len: 1900, party: true },
};

export const AX_SKILLS_O3 = {
  // 会社員
  sm_meishi: 'ox_meishi_watashi', sm_horenso: 'ox_hourensou', sm_kaban: 'ox_kaban_attack', sm_zangyo: 'ox_zangyo', sm_coffee: 'ox_coffee_break',
  sm_teiji: 'ox_teiji_dash', sm_present: 'ox_presen', sm_nomikai: 'ox_nomikai', sm_eigyo: 'ox_tobikomi_eigyo', sm_nouki: 'ox_nouki_dash', sm_bonus: 'ox_bonus_shikyu',
  // アルバイト
  ab_danboru: 'ox_danboru', ab_irasshai: 'ox_irasshaimase', ab_reji: 'ox_reji_uchi', ab_makanai: 'ox_makanai', ab_shift: 'ox_shift_koutai',
  ab_shinadashi: 'ox_shinadashi', ab_yakin: 'ox_shinya_kinmu', ab_tenchou: 'ox_tenchou_yobu', ab_kaikin: 'ox_kaikinshou', ab_nenmatsu: 'ox_nenmatsu',
  // 部長
  bc_kaigi: 'ox_kaigi_shoushuu', bc_golf: 'ox_golf_swing', bc_kessai: 'ox_kessai', bc_homeru: 'ox_buka_homeru', bc_idou: 'ox_idou_meirei',
  bc_shucchou: 'ox_shucchou_rush', bc_modoshi: 'ox_sashimodoshi',
  // 正社員
  se_shainsho: 'ox_shainshou', se_chourei: 'ox_chourei', se_yukyu: 'ox_yuukyuu', se_project: 'ox_project_shidou', se_fukuri: 'ox_fukuri_kousei',
  se_ookuchi: 'ox_ookuchi_chuumon', se_shusse: 'ox_shusse',
  // 社ちく
  sk_eiyou: 'ox_eiyou_drink', sk_kaigi: 'ox_nagai_kaigi', sk_iji: 'ox_shachiku_iji', sk_pekopeko: 'ox_pekopeko', sk_shuuden: 'ox_shuuden_dash',
  // 楽天カードマン
  rk_card: 'ox_card_shu', rk_kangen: 'ox_point_back', rk_ribo: 'ox_bunkatsu', rk_tights: 'ox_akai_tights', rk_dance: 'ox_cardman_dance',
  // 社長
  sh_tsuru: 'ox_tsuru_hitokoe', sh_jet: 'ox_private_jet', sh_meirei: 'ox_shachou_meirei', sh_kabunushi: 'ox_kabunushi_soukai', sh_baishu: 'ox_ougata_baishuu',
  sh_oneman: 'ox_oneman', sh_topdown: 'ox_top_down',
  // キャリア組
  cr_seisaku: 'ox_seisaku_kettei', cr_ronpa: 'ox_ronpa', cr_nemawashi: 'ox_nemawashi', cr_kiki: 'ox_kiki_kanri', cr_houkaisei: 'ox_houkaisei',
  cr_hakusho: 'ox_buatsui_hakusho', cr_daikaikaku: 'ox_daikaikaku',
  // たたき上げ社長
  tk_genba: 'ox_genba_hyakkai', tk_konjou: 'ox_doronko_konjou', tk_zensha: 'ox_zensha_ichigan', tk_satsutaba: 'ox_satsutaba_binta', tk_ryokou: 'ox_shain_ryokou',
  tk_tatakiage: 'ox_tatakiage_ichigeki',
  // ブラックきぎょうの星
  bk_kyujitsu: 'ox_kyuujitsu_shukkin', bk_tomari: 'ox_kaisha_tomari', bk_norma: 'ox_norma_tassei', bk_ichigan: 'ox_zenin_shussha',
  // ひらめき技
  hk_meishi_shuriken: 'ox_meishi_shuriken', hk_team_coffee: 'ox_team_coffee', hi_wanope: 'ox_wanope', hi_smile: 'ox_smile_zero', hi_shachoushou: 'ox_shachoushou',
  hi_reply_all: 'ox_reply_all', hi_drink3: 'ox_drink_sanbonme', hi_settai_golf: 'ox_settai_golf', hi_okaimono: 'ox_okaimono_marathon', hi_bonus: 'ox_bonus_daihoushutsu',
  hi_yosan_cut: 'ox_yosan_cut', hi_genba_shacho: 'ox_genba_shachou', hi_shimekiri: 'ox_getsumatsu_shimekiri',
  // 合体技
  dt_tsukin_rush: 'ox_tsukin_rush', dt_point10: 'ox_point_juubai', dt_ogori: 'ox_buchou_ogori',
};

export const AX_FAMILIES_O3 = {
  会社の体当たり: ['ox_kaban_attack', 'ox_tobikomi_eigyo', 'ox_shucchou_rush', 'ox_oneman'],
  ゴルフ: ['ox_golf_swing', 'ox_settai_golf'],
  ボーナス: ['ox_kaikinshou', 'ox_bonus_shikyu', 'ox_bonus_daihoushutsu'],
  ブラック: ['ox_shachiku_iji', 'ox_norma_tassei'],
  カード: ['ox_card_shu', 'ox_cardman_dance', 'ox_okaimono_marathon'],
  ハンコ: ['ox_kessai', 'ox_shachou_meirei'],
};
