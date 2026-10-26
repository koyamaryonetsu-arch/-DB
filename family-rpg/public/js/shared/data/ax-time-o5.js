// 第49回 O5（家・学校・料理）: もとからの 技（ふつうの 職業・ひらめき・合体技）の 時間と 技の つなぎ。サーバー（shared/battle.js）と クライアントが おなじ 数を 見る（canvas は つかわない）
// 書きかたは docs/plan-r49-fx.md 7章（と docs/plan-r48-fx.md の「G0 の 決めごと」）。この ファイルは O5 だけが さわる
//   AX_TIME_O5     … { ox_〜: { tier, charge: { kind, ms? } | false, hit, len, stagger?, party?, vars? } }
//                      tier: 'basic' | 'advanced' | 'super' | 'legend'（B・A・S・L）。hit … はなって あたる まで、len … はなって おわる まで（ms）
//                      予算は もとからの 技の 表（shared/ax-time.js の AX_BUDGET_ORIG）: 合計（構え こみ）basic 600〜900・advanced 900〜1300・super 1200〜1800・legend 1600〜2400
//                      構え（charge.ms）は basic 200・ほか 300 まで。kind 'ki' は つかわない（気は ドラゴンボールだけ）。合体技は charge: false（2人 1600・3人 1900・4人 2100 が めやす）
//   AX_SKILLS_O5   … { 技の id: 'ox_〜' | { anim: 'ox_〜', tier?, charge?, vars?, element? } }
//                      plan-r49-fx.md 6章の O5 の 技だけ。'id@masc' … 男の子の 版。合体技は DUAL_TECHS の id（dt_〜）。データの anim は かえない
//   AX_FAMILIES_O5 … { なかまの 名前: ['ox_弱い', …, 'ox_強い'] }
// 5章の「段 合計（構え）」→ charge.ms ＝ 構え、len ＝ 合計 − 構え。party … 味方・自分に かける 技
const B = (hit, len, charge = false, o = {}) => ({ tier: 'basic', charge, hit, len, ...o });
const A = (hit, len, charge = false, o = {}) => ({ tier: 'advanced', charge, hit, len, ...o });
const S = (hit, len, charge = false, o = {}) => ({ tier: 'super', charge, hit, len, ...o });
const PT = { party: true };
const sword = (ms) => ({ kind: 'sword', ms });
const gen = (ms) => ({ kind: 'generic', ms });
const idol = (ms) => ({ kind: 'idol', ms });
const holy = (ms) => ({ kind: 'holy', ms });
const tech = (ms) => ({ kind: 'tech', ms });

export const AX_TIME_O5 = {
  // ── 小学生（基本職）
  ox_randoseru_attack: B(300, 750),
  ox_genki_aisatsu: B(260, 650, false, PT),
  ox_recorder: B(380, 750),
  ox_kyuushoku_power: B(300, 650, false, PT),
  ox_kakekko: B(280, 750),
  ox_janken: B(330, 650, false, PT),
  ox_dodgeball: B(260, 750),
  ox_shourai_yume: B(320, 650, idol(200), PT),
  ox_randoseru_rocket: B(360, 850),
  ox_radio_taisou: B(320, 750, false, PT),
  // ── 料理人（基本職）
  ox_houchou_sabaki: B(260, 600, sword(150)),
  ox_attaka_soup: B(320, 650, false, PT),
  ox_tsuyobi: B(320, 750),
  ox_pirikara_spice: B(320, 750),
  ox_stamina_ryouri: B(320, 650, false, PT),
  ox_mijingiri: B(280, 620, sword(150)),
  ox_tsumamigui: B(300, 750),
  ox_flambe: B(320, 780),
  ox_full_course: B(380, 750, false, PT),
  ox_kakushi_bouchou: B(300, 650, sword(200)),
  ox_daikaryoku_itame: B(380, 850),
  // ── ニート（基本職）
  ox_makura_nage: B(340, 750),
  ox_gorogoro: B(320, 650, false, PT),
  ox_potechi: B(300, 750),
  ox_yofukashi: B(320, 650, false, PT),
  ox_ashita_honki: B(340, 650, false, PT),
  ox_net_shiraberu: B(300, 600, tech(150)),
  ox_nidone: B(340, 650, false, PT),
  ox_jersey_senpuu: B(320, 750),
  ox_ippatsu_gyakuten: B(320, 660, gen(200)),
  ox_kyou_honki: B(280, 650, gen(200)),
  ox_ofuton_barrier: B(300, 750, false, PT),
  // ── おかん（基本職）
  ox_negiri: B(300, 750),
  ox_obentou: B(320, 650, false, PT),
  ox_katazuke_nasai: B(340, 750),
  ox_amechan: B(320, 650, false, PT),
  ox_idobata_kaigi: B(400, 850),
  ox_bargain_dash: B(300, 850),
  // ── 中学生（上級職）
  ox_bukatsu_tokkun: A(360, 950, false, PT),
  ox_bukatsu_smash: A(330, 1050),
  ox_test_benkyou: A(380, 1050),
  ox_hankouki: A(300, 850, gen(200)),
  ox_gasshou: A(360, 750, idol(200), PT),
  ox_zenkoku_taikai: A(400, 1000, idol(250)),
  ox_taiikusai_relay: A(420, 1250),
  // ── パティシエ（上級職）
  ox_cream_shibori: A(360, 1050),
  ox_candy_shower: A(400, 1050),
  ox_cake_sashiire: A(400, 950, false, PT),
  ox_choco_fondue: A(380, 1050),
  ox_macaron_bomb: A(420, 1050),
  ox_sugar_coat: A(380, 950, false, PT),
  ox_amai_kaori: A(420, 1050),
  ox_wedding_cake: A(500, 1100, false, PT),
  ox_okashi_no_ie: A(500, 1100, false, PT),
  // ── 最強のおかん（上級職）
  ox_okan_kaminari_saikyou: A(380, 850, gen(200)),
  ox_gohan_okawari: A(420, 950, false, PT),
  ox_oosouji: A(400, 1050),
  ox_saikyou_slipper: A(360, 1050),
  ox_okan_no_ai: A(380, 750, holy(200), PT),
  ox_kaji_zenryoku: A(400, 950, false, PT),
  ox_okan_binta: A(420, 1250),
  ox_chabudai_gaeshi: A(450, 1250),
  // ── クリエイター（上級職）
  ox_kaimono_kago: A(330, 1050),
  ox_okusuri: A(380, 950, false, PT),
  ox_point_nibai: A(380, 950, false, PT),
  ox_shoudoku_spray: A(360, 1050),
  ox_shohousen: A(400, 950, false, PT),
  ox_ooyasuuri: A(450, 850, gen(250), PT),
  ox_kenkou_soudan: A(450, 1100, false, PT),
  // ── 高校生（超級職）
  ox_seishun_attack: S(400, 1150, gen(250)),
  ox_bunkasai: S(420, 1000, idol(250), PT),
  ox_shuugaku_ryokou: S(450, 1400),
  ox_yuujou_power: S(450, 1000, holy(250), PT),
  ox_mirai_dash: S(500, 1400, gen(300)),
  ox_uchiage_hanabi: S(600, 1700),
  // ── 三ツ星シェフ（超級職）
  ox_tetsujin_bouchou: S(400, 1150, sword(250)),
  ox_ajimi: S(420, 1250, false, PT),
  ox_honoo_furaipan: S(480, 1400),
  ox_honjitsu_osusume: S(480, 1250, false, PT),
  ox_mitsuboshi_course: S(520, 1250, false, PT),
  ox_kyuukyoku_hitosara: S(500, 1400, gen(300)),
  ox_kimagure_salad: S(520, 1450, false, PT),
  // ── 合体技（ため なし。2人 1600・3人 1900・4人 2100）
  ox_jugyou_sankan: S(600, 1600, false, PT),
  ox_bentou_todoke: S(650, 1600, false, PT),
  ox_hayaku_hataraki: S(650, 1600),
  ox_gyouretsu_mise: S(650, 1600, false, PT),
  ox_kyuuri_zushi: S(650, 1600, false, PT),
  ox_okusuri_techou: S(650, 1600, false, PT),
  ox_seeno_jump: S(800, 1900),
  ox_oosouji_daisakusen: S(800, 1900),
  ox_machi_omatsuri: S(800, 1900, false, PT),
  ox_zenin_shuugou: S(900, 2100),
  ox_kazoku_kaigi: S(950, 2100),
};

export const AX_SKILLS_O5 = {
  // 小学生
  es_randoseru: 'ox_randoseru_attack', es_aisatsu: 'ox_genki_aisatsu', es_recorder: 'ox_recorder', es_kyushoku: 'ox_kyuushoku_power',
  es_kakekko: 'ox_kakekko', es_janken: 'ox_janken', es_dodge: 'ox_dodgeball', es_yume: 'ox_shourai_yume',
  hk_randoseru_rocket: 'ox_randoseru_rocket', hk_radio_taiso: 'ox_radio_taisou',
  // 料理人
  ck_houchou: 'ox_houchou_sabaki', ck_soup: 'ox_attaka_soup', ck_tsuyobi: 'ox_tsuyobi', ck_spice: 'ox_pirikara_spice',
  ck_stamina: 'ox_stamina_ryouri', ck_mijin: 'ox_mijingiri', ck_tsumami: 'ox_tsumamigui', ck_flambe: 'ox_flambe',
  ck_fullcourse: 'ox_full_course', hi_kakushi_bouchou: 'ox_kakushi_bouchou', hi_daikaryoku: 'ox_daikaryoku_itame',
  // ニート
  ne_makura: 'ox_makura_nage', ne_gorogoro: 'ox_gorogoro', ne_potechi: 'ox_potechi', ne_yofukashi: 'ox_yofukashi',
  ne_honki: 'ox_ashita_honki', ne_guguru: 'ox_net_shiraberu', ne_nidone: 'ox_nidone', ne_jersey: 'ox_jersey_senpuu',
  ne_ippatsu: 'ox_ippatsu_gyakuten', hi_kyou_honki: 'ox_kyou_honki', hi_ofuton_barrier: 'ox_ofuton_barrier',
  // おかん
  ok_negiri: 'ox_negiri', ok_bentou: 'ox_obentou', ok_katazuke: 'ox_katazuke_nasai', ok_ame: 'ox_amechan',
  hi_idobata: 'ox_idobata_kaigi', hi_bargain: 'ox_bargain_dash',
  // 中学生
  jh_bukatsu: 'ox_bukatsu_tokkun', jh_smash: 'ox_bukatsu_smash', jh_test: 'ox_test_benkyou', jh_hankou: 'ox_hankouki',
  jh_gassho: 'ox_gasshou', jh_zenkoku: 'ox_zenkoku_taikai', hi_relay: 'ox_taiikusai_relay',
  // パティシエ
  pa_cream: 'ox_cream_shibori', pa_candy: 'ox_candy_shower', pa_cake: 'ox_cake_sashiire', pa_fondue: 'ox_choco_fondue',
  pa_macaron: 'ox_macaron_bomb', pa_sugar: 'ox_sugar_coat', pa_kaori: 'ox_amai_kaori', pa_wedding: 'ox_wedding_cake',
  hi_okashi_no_ie: 'ox_okashi_no_ie',
  // 最強のおかん
  so_kaminari: 'ox_okan_kaminari_saikyou', so_okawari: 'ox_gohan_okawari', so_osouji: 'ox_oosouji', so_slipper: 'ox_saikyou_slipper',
  so_ai: 'ox_okan_no_ai', so_kaji: 'ox_kaji_zenryoku', so_binta: 'ox_okan_binta', hi_chabudai: 'ox_chabudai_gaeshi',
  // クリエイター
  ct_kago: 'ox_kaimono_kago', ct_kusuri: 'ox_okusuri', ct_point: 'ox_point_nibai', ct_shoudoku: 'ox_shoudoku_spray',
  ct_shohou: 'ox_shohousen', creator_sig: 'ox_ooyasuuri', hi_kenkou_soudan: 'ox_kenkou_soudan',
  // 高校生
  hs_seishun: 'ox_seishun_attack', hs_bunkasai: 'ox_bunkasai', hs_shuugaku: 'ox_shuugaku_ryokou', hs_yuujou: 'ox_yuujou_power',
  hs_mirai: 'ox_mirai_dash', hi_hanabi: 'ox_uchiage_hanabi',
  // 三ツ星シェフ
  sc_tetsujin: 'ox_tetsujin_bouchou', sc_ajimi: 'ox_ajimi', sc_honoo: 'ox_honoo_furaipan', sc_osusume: 'ox_honjitsu_osusume',
  sc_fullcourse: 'ox_mitsuboshi_course', sc_kyuukyoku: 'ox_kyuukyoku_hitosara', hi_kimagure_salad: 'ox_kimagure_salad',
  // 合体技
  // dt_bentou（お弁当とどけに来たよ）→ ox_bentou_todoke は まだ つながない: test/ax-time.test.js（O0 の 共有テスト）が ためしの 表で dt_bentou を つかって いて
  // 「もう o5 に ある」で こわれる。取りまとめで そのテストの キーを かえたら ここに dt_bentou: 'ox_bentou_todoke' を 足す（え・時間・音は できて いる）
  dt_jugyo_sankan: 'ox_jugyou_sankan', dt_hataraki: 'ox_hayaku_hataraki', dt_gyouretsu: 'ox_gyouretsu_mise',
  dt_kyuuri_zushi: 'ox_kyuuri_zushi', dt_okusuri: 'ox_okusuri_techou', dt_jump: 'ox_seeno_jump', dt_oosouji: 'ox_oosouji_daisakusen',
  dt_omatsuri: 'ox_machi_omatsuri', dt_zenin: 'ox_zenin_shuugou', dt_kazoku_kaigi: 'ox_kazoku_kaigi',
};

// なかま（下から 上へ 強く。段・合計・つぶが へらない）。名前は ほかの グループと ぶつからない ように O5 を つける
export const AX_FAMILIES_O5 = {
  O5ごはん: ['ox_obentou', 'ox_gohan_okawari'],
  O5スリッパ: ['ox_saikyou_slipper', 'ox_okan_binta'],
  O5まくら: ['ox_makura_nage', 'ox_shuugaku_ryokou'],
  O5本気: ['ox_ashita_honki', 'ox_kyou_honki', 'ox_ippatsu_gyakuten'],
  O5包丁: ['ox_houchou_sabaki', 'ox_mijingiri', 'ox_kakushi_bouchou', 'ox_tetsujin_bouchou'],
  O5中華なべ: ['ox_tsuyobi', 'ox_flambe', 'ox_daikaryoku_itame', 'ox_honoo_furaipan'],
  O5フルコース: ['ox_full_course', 'ox_mitsuboshi_course'],
};
