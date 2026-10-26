// 第49回 O1（剣・和・かげの 仕事）: もとからの 技（ふつうの 職業・ひらめき・合体技）の 時間と 技の つなぎ。サーバー（shared/battle.js）と クライアントが おなじ 数を 見る（canvas は つかわない）
// 書きかたは docs/plan-r49-fx.md 7章（と docs/plan-r48-fx.md の「G0 の 決めごと」）。この ファイルは O1 だけが さわる
//   AX_TIME_O1     … { ox_〜: { tier, charge: { kind, ms? } | false, hit, len, stagger?, party?, vars? } }
//                      tier: 'basic' | 'advanced' | 'super' | 'legend'（B・A・S・L）。hit … はなって あたる まで、len … はなって おわる まで（ms）
//                      予算は もとからの 技の 表（shared/ax-time.js の AX_BUDGET_ORIG）: 合計（構え こみ）basic 600〜900・advanced 900〜1300・super 1200〜1800・legend 1600〜2400
//                      構え（charge.ms）は basic 200・ほか 300 まで。kind 'ki' は つかわない（気は ドラゴンボールだけ）。合体技は charge: false（2人 1600・3人 1900・4人 2100 が めやす）
//   AX_SKILLS_O1   … { 技の id: 'ox_〜' | { anim: 'ox_〜', tier?, charge?, vars?, element? } }
//                      plan-r49-fx.md 6章の O1 の 技だけ。'id@masc' … 男の子の 版。合体技は DUAL_TECHS の id（dt_〜）。データの anim は かえない
//   AX_FAMILIES_O1 … { なかまの 名前: ['ox_弱い', …, 'ox_強い'] }
// 合計（構え ＋ len）は plan-r49-fx.md 5章 O1 の 表の 「段」の 数
const sword = (ms) => ({ kind: 'sword', ms });
const generic = (ms) => ({ kind: 'generic', ms });
const holy = (ms) => ({ kind: 'holy', ms });
const magic = (ms) => ({ kind: 'magic', ms });
const tech = (ms) => ({ kind: 'tech', ms });

export const AX_TIME_O1 = {
  // ───── 戦士（基本職） ─────
  ox_kabau: { tier: 'basic', charge: false, hit: 260, len: 650, party: true },
  ox_chikaratame: { tier: 'basic', charge: generic(150), hit: 240, len: 500, party: true },
  ox_kabutowari: { tier: 'basic', charge: sword(150), hit: 220, len: 600 },
  ox_majingiri: { tier: 'basic', charge: sword(150), hit: 220, len: 600 },
  ox_tsurugimai: { tier: 'basic', charge: sword(150), hit: 140, len: 600, stagger: 90 },
  ox_tamashii_ichigeki: { tier: 'basic', charge: sword(200), hit: 260, len: 650 },
  ox_daichi_ikari: { tier: 'basic', charge: sword(200), hit: 260, len: 650, stagger: 50 },
  ox_midaregiri: { tier: 'basic', charge: sword(200), hit: 150, len: 650, stagger: 90 },
  // ───── スパイ（基本職） ─────
  ox_knife_throw: { tier: 'basic', charge: false, hit: 220, len: 750 },
  ox_hensou: { tier: 'basic', charge: tech(150), hit: 260, len: 500, party: true },
  ox_kimitsu_nusumi: { tier: 'basic', charge: false, hit: 160, len: 750 },
  ox_pen_gas: { tier: 'basic', charge: tech(150), hit: 280, len: 600, stagger: 50 },
  ox_spy_action: { tier: 'basic', charge: false, hit: 280, len: 750, stagger: 80 },
  ox_mission_complete: { tier: 'basic', charge: tech(200), hit: 340, len: 650 },
  ox_himitsu_pen: { tier: 'basic', charge: tech(200), hit: 200, len: 650 },
  // ───── バトルマスター（上級職） ─────
  ox_moroba_giri: { tier: 'advanced', charge: sword(200), hit: 220, len: 850 },
  ox_musou_giri: { tier: 'advanced', charge: sword(200), hit: 200, len: 850 },
  ox_otakebi: { tier: 'advanced', charge: generic(200), hit: 260, len: 850, stagger: 50 },
  ox_tension_burn: { tier: 'advanced', charge: generic(200), hit: 260, len: 750, party: true },
  ox_hakai_ichigeki: { tier: 'advanced', charge: sword(250), hit: 300, len: 1000 },
  ox_bakuretsu_giri: { tier: 'advanced', charge: sword(250), hit: 220, len: 1000 },
  // ───── パラディン（上級職） ─────
  ox_daibougyo: { tier: 'advanced', charge: holy(200), hit: 200, len: 750, party: true },
  ox_seinaru_tsurugi: { tier: 'advanced', charge: sword(200), hit: 200, len: 850 },
  ox_grand_cross: { tier: 'advanced', charge: holy(200), hit: 320, len: 850, stagger: 60 },
  ox_aegis: { tier: 'advanced', charge: holy(200), hit: 320, len: 750, party: true, stagger: 40 },
  ox_judgment: { tier: 'advanced', charge: holy(250), hit: 320, len: 1000 },
  // ───── 魔法戦士（上級職） ─────
  ox_kaengiri: { tier: 'advanced', charge: sword(200), hit: 220, len: 850 },
  ox_hyouketsu_giri: { tier: 'advanced', charge: sword(200), hit: 220, len: 850 },
  ox_inazuma_giri: { tier: 'advanced', charge: sword(200), hit: 260, len: 850 },
  ox_force_break: { tier: 'advanced', charge: magic(200), hit: 300, len: 850 },
  // ───── 忍者（上級職） ─────
  ox_ninja_shuriken: { tier: 'advanced', charge: false, hit: 260, len: 1050, stagger: 90 },
  ox_bunshin_jutsu: { tier: 'advanced', charge: generic(200), hit: 220, len: 750, party: true },
  ox_kagenui: { tier: 'advanced', charge: false, hit: 260, len: 1050 },
  ox_happou_shuriken: { tier: 'advanced', charge: generic(250), hit: 320, len: 1000, stagger: 80 },
  // ───── サムライ（上級職） ─────
  ox_iai: { tier: 'advanced', charge: false, hit: 130, len: 1000 },
  ox_mineuchi_samurai: { tier: 'advanced', charge: sword(200), hit: 220, len: 850 },
  ox_tsubame_gaeshi: { tier: 'advanced', charge: sword(200), hit: 180, len: 850 },
  ox_zeni_nage: { tier: 'advanced', charge: false, hit: 320, len: 1050, stagger: 60 },
  ox_ittou_ryoudan: { tier: 'advanced', charge: sword(250), hit: 300, len: 1000 },
  ox_shinkuu_giri: { tier: 'advanced', charge: sword(250), hit: 240, len: 1000, stagger: 50 },
  // ───── 殺し屋（上級職） ─────
  ox_kyuusho_zuki: { tier: 'advanced', charge: false, hit: 120, len: 1000 },
  ox_kehai_kesu: { tier: 'advanced', charge: generic(200), hit: 300, len: 750, party: true },
  ox_dokubari: { tier: 'advanced', charge: false, hit: 200, len: 1050 },
  ox_knife_arashi: { tier: 'advanced', charge: generic(200), hit: 300, len: 850, stagger: 80 },
  ox_ichigeki_hissatsu: { tier: 'advanced', charge: sword(250), hit: 360, len: 1000 },
  ox_haigo: { tier: 'advanced', charge: false, hit: 320, len: 1250 },
  // ───── 魔剣士（超級職） ─────
  ox_darkness_blade: { tier: 'super', charge: sword(250), hit: 260, len: 1150 },
  ox_soul_eater: { tier: 'super', charge: sword(250), hit: 240, len: 1150 },
  ox_jubaku_yaiba: { tier: 'super', charge: sword(250), hit: 240, len: 1150 },
  ox_ankoku_koromo: { tier: 'super', charge: magic(250), hit: 380, len: 1000, party: true },
  ox_hades_blade: { tier: 'super', charge: sword(300), hit: 380, len: 1400, stagger: 60 },
  ox_yami_juuji: { tier: 'super', charge: sword(300), hit: 300, len: 1400 },
  // ───── ソードマスター（超級職） ─────
  ox_koumyou_zan: { tier: 'super', charge: sword(250), hit: 240, len: 1150 },
  ox_yoroi_kudaki: { tier: 'super', charge: sword(250), hit: 280, len: 1150 },
  ox_inochi_sui: { tier: 'super', charge: sword(250), hit: 240, len: 1150 },
  ox_raijin_issen: { tier: 'super', charge: sword(250), hit: 320, len: 1150, stagger: 40 },
  ox_zenkengi: { tier: 'super', charge: sword(300), hit: 200, len: 1400, stagger: 60 },
  ox_sen_no_tachi: { tier: 'super', charge: sword(300), hit: 200, len: 1400, stagger: 60 },
  // ───── 将軍（超級職） ─────
  ox_dai_gorei: { tier: 'super', charge: generic(250), hit: 360, len: 1000, party: true, stagger: 50 },
  ox_ikkiuchi: { tier: 'super', charge: sword(250), hit: 280, len: 1150 },
  ox_kagemusha: { tier: 'super', charge: generic(250), hit: 300, len: 1000, party: true },
  ox_oniwaban_shogun: { tier: 'super', charge: false, hit: 300, len: 1400, stagger: 70 },
  ox_gunbai: { tier: 'super', charge: generic(250), hit: 360, len: 1000, party: true, stagger: 50 },
  ox_tenka_ichi: { tier: 'super', charge: sword(300), hit: 420, len: 1400, stagger: 50 },
  ox_tenka_touitsu: { tier: 'super', charge: generic(300), hit: 420, len: 1150, party: true, stagger: 50 },
  // ───── 掛け合わせ技（ひらめき。上級職あつかい） ─────
  ox_mahouken: { tier: 'advanced', charge: sword(250), hit: 260, len: 1000 },
  ox_senka_rekkouken: { tier: 'advanced', charge: holy(250), hit: 260, len: 1000 },
  ox_kaen_senpu: { tier: 'advanced', charge: magic(250), hit: 360, len: 1000, stagger: 60 },
  ox_nioudachi: { tier: 'advanced', charge: holy(250), hit: 240, len: 850, party: true },
  ox_iyashi_mai: { tier: 'advanced', charge: holy(250), hit: 380, len: 850, party: true, stagger: 40 },
  ox_hayatezuki: { tier: 'advanced', charge: false, hit: 120, len: 1100 },
  ox_madoromi_uta: { tier: 'advanced', charge: magic(250), hit: 380, len: 1000, stagger: 60 },
  ox_medoro: { tier: 'advanced', charge: magic(250), hit: 440, len: 1000 },
  // ───── 合体技（ため なし。2人 1600・3人 1900・4人 2100） ─────
  ox_cross_mahouken: { tier: 'super', charge: false, hit: 600, len: 1600 },
  ox_cross_break: { tier: 'super', charge: false, hit: 420, len: 1600 },
  ox_omae_ga_hannin: { tier: 'super', charge: false, hit: 520, len: 1600 },
  ox_nichirin_honoo: { tier: 'super', charge: false, hit: 640, len: 1600 },
  ox_eien_rival: { tier: 'super', charge: false, hit: 460, len: 1600 },
  ox_ikazuchi_ken: { tier: 'super', charge: false, hit: 560, len: 1600 },
  ox_delta_strike: { tier: 'super', charge: false, hit: 820, len: 1900 },
  ox_sanken_ooichiban: { tier: 'super', charge: false, hit: 520, len: 1900, stagger: 60 },
  ox_grand_finale: { tier: 'super', charge: false, hit: 900, len: 2100 },
  ox_nazo_toketa: { tier: 'super', charge: false, hit: 900, len: 2100, stagger: 60 },
};

export const AX_SKILLS_O1 = {
  kabau: 'ox_kabau', chikaratame: 'ox_chikaratame', kabutowari: 'ox_kabutowari', majingiri: 'ox_majingiri', tsurugimai: 'ox_tsurugimai', tamashii: 'ox_tamashii_ichigeki',
  spy_knife: 'ox_knife_throw', spy_hensou: 'ox_hensou', spy_kimitsu: 'ox_kimitsu_nusumi', spy_gas: 'ox_pen_gas', spy_action: 'ox_spy_action', spy_sig: 'ox_mission_complete',
  bm_moroba: 'ox_moroba_giri', bm_musou: 'ox_musou_giri', bm_otakebi: 'ox_otakebi', bm_tension: 'ox_tension_burn', bm_hakai: 'ox_hakai_ichigeki',
  pl_daibougyo: 'ox_daibougyo', pl_seiken: 'ox_seinaru_tsurugi', pl_grandcross: 'ox_grand_cross', pl_aegis: 'ox_aegis', pl_judgment: 'ox_judgment',
  mk_kaengiri: 'ox_kaengiri', mk_hyouketsu: 'ox_hyouketsu_giri', mk_inazuma: 'ox_inazuma_giri', mk_forcebreak: 'ox_force_break',
  nj_shuriken: 'ox_ninja_shuriken', nj_bunshin: 'ox_bunshin_jutsu', nj_kagenui: 'ox_kagenui',
  sa_iai: 'ox_iai', sa_mineuchi: 'ox_mineuchi_samurai', sa_tsubame: 'ox_tsubame_gaeshi', sa_zeni: 'ox_zeni_nage', sa_ittou: 'ox_ittou_ryoudan',
  as_kyuusho: 'ox_kyuusho_zuki', as_kehai: 'ox_kehai_kesu', as_dokubari: 'ox_dokubari', as_ame: 'ox_knife_arashi', assassin_sig: 'ox_ichigeki_hissatsu',
  ms_dark: 'ox_darkness_blade', ms_soul: 'ox_soul_eater', ms_jubaku: 'ox_jubaku_yaiba', ms_ankoku: 'ox_ankoku_koromo', ms_hades: 'ox_hades_blade',
  swm_seiken: 'ox_koumyou_zan', swm_haken: 'ox_yoroi_kudaki', swm_ankoku: 'ox_inochi_sui', swm_raijin: 'ox_raijin_issen', swm_zenken: 'ox_zenkengi',
  sg_gorei: 'ox_dai_gorei', sg_ikkiuchi: 'ox_ikkiuchi', sg_kagemusha: 'ox_kagemusha', sg_oniwaban: 'ox_oniwaban_shogun', sg_gunbai: 'ox_gunbai', sg_tenka: 'ox_tenka_ichi',
  hk_daichi_ikari: 'ox_daichi_ikari', hk_midaregiri: 'ox_midaregiri',
  mahouken: 'ox_mahouken', senka: 'ox_senka_rekkouken', kaen_senpu: 'ox_kaen_senpu', nioudachi: 'ox_nioudachi', iyashi_mai: 'ox_iyashi_mai', hayatezuki: 'ox_hayatezuki', madoromi: 'ox_madoromi_uta', medoro: 'ox_medoro',
  hi_bakuretsu_giri: 'ox_bakuretsu_giri', hi_happou_shuriken: 'ox_happou_shuriken', hi_shinkuu_giri: 'ox_shinkuu_giri', hi_haigo: 'ox_haigo', hi_ankoku_juuji: 'ox_yami_juuji',
  hi_sen_no_tachi: 'ox_sen_no_tachi', hi_tenka_touitsu: 'ox_tenka_touitsu', hi_himitsu_pen: 'ox_himitsu_pen',
  dt_cross_mahouken: 'ox_cross_mahouken', dt_cross_break: 'ox_cross_break', dt_hannin: 'ox_omae_ga_hannin', dt_nichirin: 'ox_nichirin_honoo', dt_rival: 'ox_eien_rival',
  dt_ikazuchi_ken: 'ox_ikazuchi_ken', dt_delta: 'ox_delta_strike', dt_sanken_ooichiban: 'ox_sanken_ooichiban', dt_finale: 'ox_grand_finale', dt_nazo: 'ox_nazo_toketa',
};

export const AX_FAMILIES_O1 = {
  'O1 戦士の剣': ['ox_kabutowari', 'ox_majingiri', 'ox_tamashii_ichigeki'],
  'O1 バトルマスターの剣': ['ox_moroba_giri', 'ox_bakuretsu_giri', 'ox_hakai_ichigeki'],
  'O1 魔法剣': ['ox_kaengiri', 'ox_hyouketsu_giri', 'ox_inazuma_giri', 'ox_mahouken', 'ox_cross_mahouken'],
  'O1 光の剣': ['ox_seinaru_tsurugi', 'ox_judgment', 'ox_koumyou_zan'],
  'O1 闇の剣': ['ox_darkness_blade', 'ox_yami_juuji', 'ox_hades_blade'],
  'O1 手裏剣': ['ox_ninja_shuriken', 'ox_happou_shuriken'],
  'O1 ナイフ': ['ox_knife_throw', 'ox_knife_arashi'],
  'O1 一閃': ['ox_iai', 'ox_ittou_ryoudan', 'ox_ikkiuchi', 'ox_tenka_ichi'],
  'O1 たくさん斬る': ['ox_tsurugimai', 'ox_midaregiri', 'ox_sen_no_tachi', 'ox_zenkengi'],
};
