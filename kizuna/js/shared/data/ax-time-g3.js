// 第48回 G3（鬼滅の刃 ＋ るろうに剣心 ＋ 暴れん坊将軍）: 大技の 時間と 技の つなぎ。サーバー（shared/battle.js）と クライアントが おなじ 数を 見る（canvas は つかわない）
// 書きかたは docs/plan-r48-fx.md の「G0 の 決めごと」。この ファイルは G3 だけが さわる
//   AX_TIME_G3     … { ax_〜: { tier, charge: { kind, ms? } | false, hit, len, stagger?, party?, vars? } }
//                      tier: 'basic' | 'advanced' | 'super' | 'legend'（B・A・S・L）。hit … はなって あたる まで、len … はなって おわる まで（ms）
//   AX_SKILLS_G3   … { 技の id: 'ax_〜' | { anim: 'ax_〜', tier?, charge?, vars?, element? } }
//                      'id@masc' … 男の子の 版。合体技は 'dt_〜'。データの anim は かえない
//   AX_FAMILIES_G3 … { なかまの 名前: ['ax_弱い', …, 'ax_強い'] }
// 合計（ため ＋ len）は plan-r48-fx.md 6章の 表の 数（段の 予算の 中）
const breath = (ms) => ({ kind: 'breath', ms });
const sword = (ms) => ({ kind: 'sword', ms });

export const AX_TIME_G3 = {
  // ───── 鬼滅の刃: 水の呼吸（きさつ隊） ─────
  ax_minamo_giri: { tier: 'advanced', charge: breath(350), hit: 230, len: 750 },
  ax_zenshuu: { tier: 'advanced', charge: breath(400), hit: 300, len: 700, party: true },
  ax_hyoutan: { tier: 'advanced', charge: breath(300), hit: 400, len: 700, party: true },
  ax_uchishio: { tier: 'advanced', charge: breath(400), hit: 200, len: 800, stagger: 90 },
  ax_nejire_uzu: { tier: 'advanced', charge: breath(400), hit: 340, len: 900, stagger: 50 },
  ax_seisei_ruten: { tier: 'advanced', charge: breath(500), hit: 560, len: 900 },
  ax_ryuuryuu_mai: { tier: 'advanced', charge: breath(400), hit: 220, len: 900, stagger: 110 },
  // ───── 炎の呼吸（炎柱） ─────
  ax_shiranui: { tier: 'advanced', charge: breath(400), hit: 260, len: 900 },
  ax_umai: { tier: 'super', charge: breath(600), hit: 420, len: 900, party: true },
  ax_nobori_enten: { tier: 'super', charge: breath(600), hit: 280, len: 1000 },
  ax_seien_uneri: { tier: 'super', charge: breath(700), hit: 400, len: 1100, stagger: 60 },
  ax_kokoro_moyase: { tier: 'super', charge: breath(800), hit: 420, len: 1200, party: true },
  ax_rengoku: { tier: 'super', charge: breath(900), hit: 560, len: 1300 },
  ax_enko: { tier: 'super', charge: breath(800), hit: 480, len: 1200 },
  // ───── 日の呼吸（日の呼吸の使い手） ─────
  ax_kasha: { tier: 'super', charge: breath(800), hit: 440, len: 1200 },
  ax_sukitooru_sekai: { tier: 'legend', charge: breath(1000), hit: 520, len: 1200, party: true },
  ax_retsujitsu_koukyou: { tier: 'legend', charge: breath(1000), hit: 300, len: 1600, stagger: 70 },
  ax_hirin_kagerou: { tier: 'legend', charge: breath(1000), hit: 620, len: 1600, stagger: 60 },
  ax_hinode_aza: { tier: 'legend', charge: breath(1000), hit: 420, len: 1200, party: true },
  ax_hinokami_kagura: { tier: 'legend', charge: breath(1400), hit: 1120, len: 1800, stagger: 40 },
  ax_enbu: { tier: 'legend', charge: breath(1000), hit: 560, len: 1400 },
  // ───── るろうに剣心: るろうに剣士 ─────
  ax_battou: { tier: 'basic', charge: sword(200), hit: 90, len: 500 },
  ax_oro: { tier: 'basic', charge: sword(100), hit: 220, len: 500, party: true },
  ax_doryusen: { tier: 'basic', charge: sword(200), hit: 260, len: 600, stagger: 40 },
  ax_ryukansen: { tier: 'basic', charge: sword(200), hit: 260, len: 600 },
  ax_osentaku: { tier: 'basic', charge: sword(200), hit: 300, len: 600, party: true },
  ax_ryutsuisen: { tier: 'basic', charge: sword(300), hit: 320, len: 600 },
  // ───── 人斬りばっ刀さい ─────
  ax_ryushousen: { tier: 'advanced', charge: sword(350), hit: 200, len: 750 },
  ax_hitokiri_kenki: { tier: 'advanced', charge: sword(400), hit: 280, len: 700, party: true },
  ax_souryusen: { tier: 'advanced', charge: sword(400), hit: 140, len: 800 },
  ax_yamiyo_tachi: { tier: 'advanced', charge: sword(400), hit: 380, len: 900, stagger: 70 },
  ax_ryumeisen: { tier: 'advanced', charge: sword(400), hit: 300, len: 800, stagger: 40 },
  ax_ryusousen: { tier: 'advanced', charge: sword(500), hit: 460, len: 900, stagger: 60 },
  ax_ryutsuishousen: { tier: 'advanced', charge: sword(400), hit: 260, len: 900 },
  // ───── ひ村ばっ刀さい ─────
  ax_hiryusen: { tier: 'advanced', charge: sword(400), hit: 330, len: 900 },
  ax_fusatsu: { tier: 'super', charge: sword(600), hit: 400, len: 900, party: true },
  ax_ryukansen_arashi: { tier: 'super', charge: sword(600), hit: 520, len: 1100, stagger: 60 },
  ax_ocha: { tier: 'super', charge: sword(600), hit: 420, len: 900, party: true },
  ax_ryukansen_tsumuji: { tier: 'super', charge: sword(700), hit: 300, len: 1100, stagger: 120 },
  ax_kuzuryusen: { tier: 'super', charge: sword(900), hit: 320, len: 1300 },
  ax_ryukansen_kogarashi: { tier: 'super', charge: sword(700), hit: 480, len: 1200 },
  // ───── 飛天御剣流けい承者 ─────
  ax_shinsoku_tachi: { tier: 'super', charge: sword(700), hit: 300, len: 1100 },
  ax_mantle_nugu: { tier: 'legend', charge: sword(1000), hit: 520, len: 1400, party: true },
  ax_hiten_ootatsumaki: { tier: 'legend', charge: sword(1000), hit: 620, len: 1600, stagger: 50 },
  ax_ikiyou_kokoro: { tier: 'legend', charge: sword(1000), hit: 460, len: 1200, party: true },
  ax_saki_wo_yomu: { tier: 'legend', charge: sword(1000), hit: 540, len: 1200, stagger: 60 },
  ax_amakakeru: { tier: 'legend', charge: sword(1400), hit: 960, len: 1800, stagger: 40 },
  ax_kuzuryusen_shin: { tier: 'legend', charge: sword(1200), hit: 560, len: 1800 },
  ax_dai_doryusen: { tier: 'legend', charge: sword(1000), hit: 520, len: 1600, stagger: 80 },
  // ───── 暴れん坊将軍 ─────
  ax_mineuchi_ja: { tier: 'super', charge: sword(600), hit: 380, len: 1100 },
  ax_yo_no_kao: { tier: 'legend', charge: sword(1000), hit: 660, len: 1400, stagger: 50 },
  ax_hakuba_hayagake: { tier: 'legend', charge: sword(1000), hit: 620, len: 1600, stagger: 70 },
  ax_meyasubako: { tier: 'legend', charge: sword(1000), hit: 600, len: 1200, party: true },
  ax_uesama_onari: { tier: 'legend', charge: sword(1000), hit: 520, len: 1200, party: true },
  ax_seibai: { tier: 'legend', charge: sword(1400), hit: 980, len: 1800, stagger: 60 },
  ax_oniwaban_maire: { tier: 'legend', charge: sword(1000), hit: 540, len: 1400, stagger: 60 },
  ax_tenka_gomen: { tier: 'legend', charge: sword(1000), hit: 980, len: 1600, stagger: 50 },
  // ───── 合体技（ため なし。super の 長さ） ─────
  ax_sentaku_biyori: { tier: 'super', charge: false, hit: 520, len: 1600, party: true },
  ax_sanken: { tier: 'super', charge: false, hit: 560, len: 1900 },
  ax_megumi: { tier: 'super', charge: false, hit: 620, len: 1900 },
};

export const AX_SKILLS_G3 = {
  // 鬼滅の刃
  ks_minamo: 'ax_minamo_giri',
  ks_zenshuu: 'ax_zenshuu',
  ks_hyoutan: 'ax_hyoutan',
  ks_uchishio: 'ax_uchishio',
  ks_nejire: 'ax_nejire_uzu',
  kisatsu_sig: 'ax_seisei_ruten',
  hi_suiryuu: 'ax_ryuuryuu_mai',
  eb_shiranui: 'ax_shiranui',
  eb_umai: 'ax_umai',
  eb_noboru: 'ax_nobori_enten',
  eb_uneri: 'ax_seien_uneri',
  enbashira_sig: 'ax_kokoro_moyase',
  eb_rengoku: 'ax_rengoku',
  hi_enko: 'ax_enko',
  hn_kasha: 'ax_kasha',
  hn_sukitooru: 'ax_sukitooru_sekai',
  hn_koukyou: 'ax_retsujitsu_koukyou',
  hn_hirin: 'ax_hirin_kagerou',
  hn_aza: 'ax_hinode_aza',
  hinokami_sig: 'ax_hinokami_kagura',
  hi_enbu: 'ax_enbu',
  // るろうに剣心
  rr_battou: 'ax_battou',
  rr_oro: 'ax_oro',
  rr_doryu: 'ax_doryusen',
  rr_ryukan: 'ax_ryukansen',
  rr_sentaku: 'ax_osentaku',
  rurouni_sig: 'ax_ryutsuisen',
  htk_ryusho: 'ax_ryushousen',
  htk_kenki: 'ax_hitokiri_kenki',
  htk_soryu: 'ax_souryusen',
  htk_yamiyo: 'ax_yamiyo_tachi',
  htk_ryumei: 'ax_ryumeisen',
  hitokiri_sig: 'ax_ryusousen',
  hi_ryutsui_shou: 'ax_ryutsuishousen',
  hm_hiryu: 'ax_hiryusen',
  hm_fusatsu: 'ax_fusatsu',
  hm_arashi: 'ax_ryukansen_arashi',
  hm_ocha: 'ax_ocha',
  hm_tsumuji: 'ax_ryukansen_tsumuji',
  himura_sig: 'ax_kuzuryusen',
  hi_kogarashi: 'ax_ryukansen_kogarashi',
  ht_shinsoku: 'ax_shinsoku_tachi',
  ht_mantle: 'ax_mantle_nugu',
  ht_ootatsu: 'ax_hiten_ootatsumaki',
  ht_ikiyou: 'ax_ikiyou_kokoro',
  ht_yomi: 'ax_saki_wo_yomu',
  hiten_sig: 'ax_amakakeru',
  hi_shin_kuzu: 'ax_kuzuryusen_shin',
  hi_dai_doryu: 'ax_dai_doryusen',
  // 暴れん坊将軍
  ab_mineuchi: 'ax_mineuchi_ja',
  ab_kao: 'ax_yo_no_kao',
  ab_hakuba: 'ax_hakuba_hayagake',
  ab_meyasu: 'ax_meyasubako',
  ab_onari: 'ax_uesama_onari',
  abarenbo_shogun_sig: 'ax_seibai',
  hi_oniwaban_maire: 'ax_oniwaban_maire',
  hi_tenka_gomen: 'ax_tenka_gomen',
  // 合体技
  dt_sentaku_biyori: 'ax_sentaku_biyori',
  dt_sanken: 'ax_sanken',
  dt_megumi: 'ax_megumi',
};

// なかま（下から 上へ 段・長さ・つぶが ふえる）
export const AX_FAMILIES_G3 = {
  '呼吸（水→炎→日）': ['ax_minamo_giri', 'ax_rengoku', 'ax_hinokami_kagura'],
  '九頭竜閃': ['ax_kuzuryusen', 'ax_kuzuryusen_shin'],
  '竜巻閃': ['ax_ryukansen', 'ax_ryukansen_arashi', 'ax_hiten_ootatsumaki'],
  '飛天の 縦の 技': ['ax_ryutsuisen', 'ax_ryutsuishousen', 'ax_amakakeru'],
  '土竜閃': ['ax_doryusen', 'ax_dai_doryusen'],
};
