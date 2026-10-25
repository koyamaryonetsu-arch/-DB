// 第48回 G2（ナルト ＋ ワンピース ＋ 京急 ＋ 野球）: 大技の 時間と 技の つなぎ。サーバー（shared/battle.js）と クライアントが おなじ 数を 見る（canvas は つかわない）
// 書きかたは docs/plan-r48-fx.md の「G0 の 決めごと」。この ファイルは G2 だけが さわる
//   AX_TIME_G2     … { ax_〜: { tier, charge: { kind, ms? } | false, hit, len, stagger?, party?, vars? } }
//                      tier: 'basic' | 'advanced' | 'super' | 'legend'（B・A・S・L）。hit … はなって あたる まで、len … はなって おわる まで（ms）
//   AX_SKILLS_G2   … { 技の id: 'ax_〜' | { anim: 'ax_〜', tier?, charge?, vars?, element? } }
//                      'id@masc' … 男の子の 版。合体技は 'dt_〜'。データの anim は かえない
//   AX_FAMILIES_G2 … { なかまの 名前: ['ax_弱い', …, 'ax_強い'] }
// 6章の 表の「段 合計（ため）」→ charge.ms ＝ ため、len ＝ 合計 − ため
const A = 'advanced', S = 'super', L = 'legend';
const CH = (kind, ms) => ({ kind, ms });

export const AX_TIME_G2 = {
  // ───── ナルト（木の葉の忍び・七代目火影） ─────
  ax_kunai: { tier: A, charge: CH('chakra', 300), hit: 220, len: 800 },
  ax_kagebunshin: { tier: S, charge: CH('chakra', 600), hit: 300, len: 1000, party: true },
  ax_rasengan: { tier: S, charge: CH('chakra', 800), hit: 450, len: 1200 },
  ax_sennin_mode: { tier: S, charge: CH('chakra', 700), hit: 300, len: 900, party: true },
  ax_konoha_senpuu: { tier: S, charge: CH('chakra', 600), hit: 350, len: 1000 },
  ax_rasenshuriken: { tier: S, charge: CH('chakra', 900), hit: 600, len: 1300 },
  ax_kunai_ame: { tier: S, charge: CH('chakra', 700), hit: 450, len: 1100 },
  ax_oodama_rasengan: { tier: S, charge: CH('chakra', 800), hit: 550, len: 1400 },
  ax_kyuubi_koromo: { tier: L, charge: CH('chakra', 1100), hit: 400, len: 1500, party: true },
  ax_hokage_mamori: { tier: L, charge: CH('chakra', 1000), hit: 400, len: 1200, party: true },
  ax_bijuudama: { tier: L, charge: CH('chakra', 1200), hit: 700, len: 1600 },
  ax_hi_no_ishi: { tier: L, charge: CH('chakra', 1000), hit: 400, len: 1200, party: true },
  ax_tajuu_kagebunshin: { tier: L, charge: CH('chakra', 1400), hit: 800, len: 1800 },
  ax_tajuu_rasengan: { tier: L, charge: CH('chakra', 1100), hit: 700, len: 1700 },
  ax_shinobi_kagebunshin: { tier: S, charge: false, hit: 300, len: 1800 },
  // ───── ワンピース（ゴム人間・ニカ） ─────
  ax_gomu_pistol: { tier: A, charge: CH('gomu', 400), hit: 220, len: 800 },
  ax_gomu_gatling: { tier: S, charge: CH('gomu', 600), hit: 300, len: 1200 },
  ax_gomu_fusen: { tier: S, charge: CH('gomu', 600), hit: 350, len: 900, party: true },
  ax_gear2: { tier: S, charge: CH('gomu', 700), hit: 300, len: 1000, party: true },
  ax_gomu_bazooka: { tier: S, charge: CH('gomu', 700), hit: 300, len: 1100 },
  ax_gear3_gigant: { tier: S, charge: CH('gomu', 900), hit: 450, len: 1300 },
  ax_gomu_muchi: { tier: S, charge: CH('gomu', 600), hit: 300, len: 1000 },
  ax_gear4: { tier: S, charge: CH('gomu', 800), hit: 350, len: 1200, party: true },
  ax_gear5: { tier: L, charge: CH('gomu', 1200), hit: 500, len: 1600, party: true },
  ax_kaihou_drum: { tier: L, charge: CH('gomu', 1000), hit: 400, len: 1400, party: true },
  ax_kaminari_tsukamu: { tier: L, charge: CH('gomu', 1000), hit: 600, len: 1600 },
  ax_nika_sun_punch: { tier: L, charge: CH('gomu', 1200), hit: 650, len: 1600 },
  ax_nika_warai: { tier: L, charge: CH('gomu', 1000), hit: 400, len: 1200, party: true },
  ax_kaihou_senshi: { tier: L, charge: CH('gomu', 1400), hit: 900, len: 1800 },
  ax_manga_oabare: { tier: L, charge: CH('gomu', 1000), hit: 500, len: 1600 },
  // ───── 京急（京急の運転士・京急の社長） ─────
  ax_doremi_hassha: { tier: S, charge: CH('tech', 600), hit: 300, len: 900, party: true },
  ax_keikyu_120: { tier: S, charge: CH('tech', 600), hit: 350, len: 1000 },
  ax_ganjou_sentousha: { tier: S, charge: CH('tech', 600), hit: 300, len: 900, party: true },
  ax_daiya_kaifuku: { tier: S, charge: CH('tech', 600), hit: 300, len: 900, party: true },
  ax_kaitoku_renketsu: { tier: S, charge: CH('tech', 700), hit: 450, len: 1200 },
  ax_akai_kaitoku: { tier: S, charge: CH('tech', 900), hit: 500, len: 1300 },
  ax_airport_kaitoku: { tier: S, charge: CH('tech', 800), hit: 450, len: 1200 },
  ax_shuppatsu_gourei: { tier: L, charge: CH('tech', 1000), hit: 400, len: 1200, party: true },
  ax_nonstop_tokkyu: { tier: S, charge: CH('tech', 800), hit: 450, len: 1200 },
  ax_zensen_tenken: { tier: L, charge: CH('tech', 1000), hit: 400, len: 1200, party: true },
  ax_daiya_kaisei: { tier: L, charge: CH('tech', 1000), hit: 400, len: 1200, party: true },
  ax_12ryou_renketsu: { tier: L, charge: CH('tech', 1100), hit: 600, len: 1700 },
  ax_zensen_daikaitoku: { tier: L, charge: CH('tech', 1400), hit: 800, len: 1800 },
  ax_shachou_bonus: { tier: L, charge: CH('tech', 1000), hit: 400, len: 1200, party: true },
  ax_kaitoku_oikoshi: { tier: L, charge: CH('tech', 1000), hit: 550, len: 1600 },
  // ───── 野球（二刀流スター・野球界の殿堂入り） ─────
  ax_nitoryu: { tier: A, charge: CH('generic', 400), hit: 200, len: 900 },
  ax_fifty_fifty: { tier: S, charge: CH('generic', 600), hit: 450, len: 1100 },
  ax_nemuri_first: { tier: S, charge: CH('generic', 600), hit: 300, len: 900, party: true },
  ax_manpyou_mvp: { tier: S, charge: CH('generic', 600), hit: 300, len: 900, party: true },
  ax_real_nitoryu: { tier: S, charge: CH('generic', 900), hit: 600, len: 1300 },
  ax_100mile: { tier: S, charge: CH('generic', 700), hit: 300, len: 1100 },
  ax_yokoku_homerun: { tier: L, charge: CH('generic', 1000), hit: 400, len: 1200, party: true },
  ax_kieru_makyu: { tier: L, charge: CH('generic', 1000), hit: 600, len: 1400 },
  ax_koedashi_enjin: { tier: L, charge: CH('generic', 1000), hit: 400, len: 1200, party: true },
  ax_sansha_sanshin: { tier: L, charge: CH('generic', 1000), hit: 400, len: 1400, stagger: 150 },
  ax_yume_allstar: { tier: L, charge: CH('generic', 1000), hit: 600, len: 1600 },
  ax_ougon_sayonara: { tier: L, charge: CH('generic', 1400), hit: 800, len: 1800 },
  ax_3daseki_renzoku: { tier: L, charge: CH('generic', 1000), hit: 400, len: 1600 },
  ax_kandou_speech: { tier: L, charge: CH('generic', 1000), hit: 400, len: 1200, party: true },
};

export const AX_SKILLS_G2 = {
  // ナルト
  kh_kunai: 'ax_kunai',
  kh_bunshin: 'ax_kagebunshin',
  konoha_sig: 'ax_rasengan',
  kh_sennin: 'ax_sennin_mode',
  kh_senpuu: 'ax_konoha_senpuu',
  kh_shuriken: 'ax_rasenshuriken',
  hi_kunai_ame: 'ax_kunai_ame',
  hg_oodama: 'ax_oodama_rasengan',
  hg_kitsune: 'ax_kyuubi_koromo',
  hg_mamori: 'ax_hokage_mamori',
  hg_bijuu: 'ax_bijuudama',
  hg_ishi: 'ax_hi_no_ishi',
  hokage_sig: 'ax_tajuu_kagebunshin',
  hi_tajuu_rasengan: 'ax_tajuu_rasengan',
  dt_kagebunshin: 'ax_shinobi_kagebunshin',
  // ワンピース
  go_pistol: 'ax_gomu_pistol',
  go_gatling: 'ax_gomu_gatling',
  go_fusen: 'ax_gomu_fusen',
  go_gear2: 'ax_gear2',
  go_bazooka: 'ax_gomu_bazooka',
  go_gear3: 'ax_gear3_gigant',
  hi_gomu_muchi: 'ax_gomu_muchi',
  hi_gear4: 'ax_gear4',
  nk_gear5: 'ax_gear5',
  nk_drum: 'ax_kaihou_drum',
  nk_kaminari: 'ax_kaminari_tsukamu',
  nk_taiyou: 'ax_nika_sun_punch',
  nk_warai: 'ax_nika_warai',
  nk_kaihou: 'ax_kaihou_senshi',
  hi_manga: 'ax_manga_oabare',
  // 京急
  kq_doremi: 'ax_doremi_hassha',
  kq_120: 'ax_keikyu_120',
  kq_sentou: 'ax_ganjou_sentousha',
  kq_daiya: 'ax_daiya_kaifuku',
  kq_renketsu: 'ax_kaitoku_renketsu',
  kq_kaitoku: 'ax_akai_kaitoku',
  hi_airport: 'ax_airport_kaitoku',
  kqp_gourei: 'ax_shuppatsu_gourei',
  kqp_tokkyu: 'ax_nonstop_tokkyu',
  kqp_tenken: 'ax_zensen_tenken',
  kqp_daiya: 'ax_daiya_kaisei',
  kqp_renketsu: 'ax_12ryou_renketsu',
  keikyu_president_sig: 'ax_zensen_daikaitoku',
  hi_kqp_bonus: 'ax_shachou_bonus',
  hi_kqp_oikoshi: 'ax_kaitoku_oikoshi',
  // 野球
  nt_nitoryu: 'ax_nitoryu',
  nt_5050: 'ax_fifty_fifty',
  nt_nemuri: 'ax_nemuri_first',
  nt_mvp: 'ax_manpyou_mvp',
  nt_real: 'ax_real_nitoryu',
  hi_100mile: 'ax_100mile',
  hof_yokoku: 'ax_yokoku_homerun',
  hof_makyu: 'ax_kieru_makyu',
  hof_enjin: 'ax_koedashi_enjin',
  hof_sanshin: 'ax_sansha_sanshin',
  hof_allstar: 'ax_yume_allstar',
  hall_of_fame_sig: 'ax_ougon_sayonara',
  hi_hof_renpatsu: 'ax_3daseki_renzoku',
  hi_hof_speech: 'ax_kandou_speech',
};

export const AX_FAMILIES_G2 = {
  // らせん丸 → らせん手裏剣 → 大玉らせん丸 → 多重らせん丸
  らせん丸: ['ax_rasengan', 'ax_rasenshuriken', 'ax_oodama_rasengan', 'ax_tajuu_rasengan'],
  // ゴムゴムの ピストル → バズーカ → ギア3 ギガント → 太陽のパンチ
  ゴムのパンチ: ['ax_gomu_pistol', 'ax_gomu_bazooka', 'ax_gear3_gigant', 'ax_nika_sun_punch'],
  // 赤い 電車: 120キロ（4両）→ 赤い快特（8両 2往復）→ 12両 → 全線大快特（3方向）
  赤い電車: ['ax_keikyu_120', 'ax_akai_kaitoku', 'ax_12ryou_renketsu', 'ax_zensen_daikaitoku'],
  // ホームラン: 二刀流 → リアル二刀流 → 3打席連続 → 黄金のサヨナラ
  ホームラン: ['ax_nitoryu', 'ax_real_nitoryu', 'ax_3daseki_renzoku', 'ax_ougon_sayonara'],
};
