// 第49回 O2（こぶし・守り・魔物・闇）: もとからの 技（ふつうの 職業・ひらめき・合体技）の 時間と 技の つなぎ。サーバー（shared/battle.js）と クライアントが おなじ 数を 見る（canvas は つかわない）
// 書きかたは docs/plan-r49-fx.md 7章（と docs/plan-r48-fx.md の「G0 の 決めごと」）。この ファイルは O2 だけが さわる
//   AX_TIME_O2     … { ox_〜: { tier, charge: { kind, ms? } | false, hit, len, stagger?, party?, vars? } }
//                      tier: 'basic' | 'advanced' | 'super' | 'legend'（B・A・S・L）。hit … はなって あたる まで、len … はなって おわる まで（ms）
//                      予算は もとからの 技の 表（shared/ax-time.js の AX_BUDGET_ORIG）: 合計（構え こみ）basic 600〜900・advanced 900〜1300・super 1200〜1800・legend 1600〜2400
//                      構え（charge.ms）は basic 200・ほか 300 まで。kind 'ki' は つかわない（気は ドラゴンボールだけ）。合体技は charge: false（2人 1600・3人 1900・4人 2100 が めやす）
//   AX_SKILLS_O2   … { 技の id: 'ox_〜' | { anim: 'ox_〜', tier?, charge?, vars?, element? } }
//                      plan-r49-fx.md 6章の O2 の 技だけ。'id@masc' … 男の子の 版。合体技は DUAL_TECHS の id（dt_〜）。データの anim は かえない
//   AX_FAMILIES_O2 … { なかまの 名前: ['ox_弱い', …, 'ox_強い'] }
// plan-r49-fx.md 5章の「段 合計（構え）」→ charge.ms ＝ 構え、len ＝ 合計 − 構え。party … 味方・自分に かける 補助
const G = (ms) => ({ kind: 'generic', ms });
const H = (ms) => ({ kind: 'holy', ms });
const M = (ms) => ({ kind: 'magic', ms });

export const AX_TIME_O2 = {
  // ── 武闘家（基本職）
  ox_seiken_zuki: { tier: 'basic', charge: false, hit: 200, len: 750 },
  ox_mikawashi: { tier: 'basic', charge: false, hit: 260, len: 650, party: true },
  ox_bakuretsu_ken: { tier: 'basic', charge: G(150), hit: 160, len: 600, stagger: 50 },
  ox_kiaitame: { tier: 'basic', charge: G(150), hit: 240, len: 500, party: true },
  ox_mouko_hasai: { tier: 'basic', charge: G(150), hit: 260, len: 600 },
  ox_mawashi_geri: { tier: 'basic', charge: false, hit: 220, len: 750, stagger: 50 },
  ox_issen_zuki: { tier: 'basic', charge: false, hit: 260, len: 750 },
  ox_hyakuretsu_ken: { tier: 'basic', charge: G(200), hit: 140, len: 650 },
  ox_sandan_zuki: { tier: 'basic', charge: false, hit: 160, len: 850 },
  ox_senpuu_kyaku: { tier: 'basic', charge: false, hit: 300, len: 850, stagger: 50 },
  // ── 海賊（上級職）
  ox_kaizoku_giri: { tier: 'advanced', charge: { kind: 'sword', ms: 200 }, hit: 200, len: 850 },
  ox_dokuro_hata: { tier: 'advanced', charge: G(200), hit: 380, len: 850 },
  ox_uzushio: { tier: 'advanced', charge: G(200), hit: 300, len: 850 },
  ox_ikari_ippatsu: { tier: 'advanced', charge: false, hit: 360, len: 1050 },
  ox_utage_uta: { tier: 'advanced', charge: { kind: 'idol', ms: 200 }, hit: 300, len: 750, party: true },
  ox_otakara_sagashi: { tier: 'advanced', charge: false, hit: 320, len: 1050 },
  ox_kaizoku_taihou: { tier: 'advanced', charge: G(250), hit: 420, len: 1000 },
  // ── 聖拳士（上級職）
  ox_seikou_ken: { tier: 'advanced', charge: H(200), hit: 200, len: 850 },
  ox_meisou: { tier: 'advanced', charge: H(200), hit: 360, len: 750, party: true },
  ox_mikiri: { tier: 'advanced', charge: false, hit: 300, len: 950, party: true },
  ox_tenshou_reppa: { tier: 'advanced', charge: H(200), hit: 260, len: 850 },
  ox_seinaru_hyakuretsu: { tier: 'advanced', charge: H(250), hit: 160, len: 1000 },
  // ── 魔物使い（上級職）
  ox_shippu_muchi: { tier: 'advanced', charge: false, hit: 260, len: 1050 },
  ox_beast_mode: { tier: 'advanced', charge: G(200), hit: 260, len: 750, party: true },
  ox_muchi_ranbu: { tier: 'advanced', charge: false, hit: 200, len: 1050 },
  ox_kemono_sakebi: { tier: 'advanced', charge: G(200), hit: 300, len: 850 },
  ox_kizuna_hoegoe: { tier: 'advanced', charge: G(200), hit: 300, len: 750, party: true },
  ox_majuu_ichigeki: { tier: 'advanced', charge: false, hit: 320, len: 1250 },
  // ── 中二病（上級職）
  ox_fuuin_migite: { tier: 'advanced', charge: G(200), hit: 300, len: 850 },
  ox_jakigan: { tier: 'advanced', charge: false, hit: 320, len: 1050 },
  ox_settei_note: { tier: 'advanced', charge: { kind: 'tech', ms: 200 }, hit: 300, len: 750, party: true },
  ox_kuro_rekishi: { tier: 'advanced', charge: G(200), hit: 360, len: 850 },
  ox_waga_na_wa: { tier: 'advanced', charge: M(200), hit: 300, len: 750, party: true },
  ox_judgment_black: { tier: 'advanced', charge: M(250), hit: 380, len: 1000 },
  // ── 超能力者（上級職）
  ox_spoon_mage: { tier: 'advanced', charge: G(200), hit: 320, len: 850 },
  ox_nenriki: { tier: 'advanced', charge: G(200), hit: 300, len: 850 },
  ox_yochi: { tier: 'advanced', charge: false, hit: 300, len: 950, party: true },
  ox_teleport: { tier: 'advanced', charge: false, hit: 260, len: 950, party: true },
  ox_psychokinesis: { tier: 'advanced', charge: G(200), hit: 420, len: 850 },
  ox_spoon_arashi: { tier: 'advanced', charge: G(250), hit: 420, len: 1000 },
  // ── ゴッドハンド（超級職）
  ox_shinsoku_ken: { tier: 'super', charge: false, hit: 160, len: 1400 },
  ox_tenchi_kamae: { tier: 'super', charge: H(250), hit: 420, len: 1000, party: true },
  ox_musou_ken: { tier: 'super', charge: G(250), hit: 200, len: 1150 },
  ox_ikazuchi_kobushi: { tier: 'super', charge: G(250), hit: 320, len: 1150 },
  ox_god_hand: { tier: 'super', charge: H(300), hit: 460, len: 1400 },
  ox_tenchi_kudaki: { tier: 'super', charge: G(300), hit: 400, len: 1400 },
  // ── ガーディアン（超級職）
  ox_teppeki: { tier: 'super', charge: H(250), hit: 360, len: 1000, party: true },
  ox_youzai_ichigeki: { tier: 'super', charge: false, hit: 420, len: 1400 },
  ox_shield_attack: { tier: 'super', charge: false, hit: 320, len: 1400 },
  ox_minna_mamoru: { tier: 'super', charge: H(250), hit: 420, len: 1000, party: true },
  ox_daichi_tate: { tier: 'super', charge: false, hit: 320, len: 1400 },
  ox_fudou_youzai: { tier: 'super', charge: H(300), hit: 460, len: 1150, party: true },
  ox_shield_throw: { tier: 'super', charge: false, hit: 420, len: 1700 },
  // ── モンスターマスター（超級職）
  ox_majuu_muchi: { tier: 'super', charge: false, hit: 300, len: 1400 },
  ox_mamono_iyashi: { tier: 'super', charge: H(250), hit: 420, len: 1000, party: true },
  ox_wild_howl: { tier: 'super', charge: G(250), hit: 320, len: 1150 },
  ox_mamono_kizuna: { tier: 'super', charge: G(250), hit: 420, len: 1000, party: true },
  ox_mamono_daikoushin: { tier: 'super', charge: false, hit: 460, len: 1400 },
  ox_kemono_no_ou: { tier: 'super', charge: G(300), hit: 460, len: 1400 },
  ox_mamono_shingeki: { tier: 'super', charge: false, hit: 320, len: 1700 },
  // ── ダ天使（超級職）
  ox_tenshi_hohoemi: { tier: 'super', charge: H(250), hit: 460, len: 1000, party: true },
  ox_kindan_keiyaku: { tier: 'super', charge: M(250), hit: 420, len: 1000, party: true },
  ox_kuroi_tsubasa: { tier: 'super', charge: H(250), hit: 380, len: 1000, party: true },
  ox_dark_angel: { tier: 'super', charge: H(300), hit: 460, len: 1400 },
  ox_lucifer_wing: { tier: 'super', charge: H(300), hit: 460, len: 1400 },
  // ── 魔王（伝説）
  ox_itetsuku_hadou: { tier: 'legend', charge: M(300), hit: 420, len: 1600 },
  ox_maou_tsume: { tier: 'legend', charge: false, hit: 320, len: 1900 },
  ox_maou_iatsu: { tier: 'legend', charge: M(300), hit: 500, len: 1600 },
  ox_yami_koromo: { tier: 'legend', charge: M(300), hit: 460, len: 1350, party: true },
  ox_hametsu_hikari: { tier: 'legend', charge: M(300), hit: 620, len: 1900 },
  ox_yami_no_sekai: { tier: 'legend', charge: M(300), hit: 520, len: 1900 },
  // ── 合体技（ため なし。2人 1600・3人 1900）
  ox_hametsu_hakaidama: { tier: 'super', charge: false, hit: 720, len: 1600 },
  ox_nenriki_meteor: { tier: 'super', charge: false, hit: 760, len: 1600 },
  ox_beast_cross: { tier: 'super', charge: false, hit: 360, len: 1600 },
  ox_dai_circus: { tier: 'super', charge: false, hit: 620, len: 1600 },
  ox_oozora_sanpo: { tier: 'super', charge: false, hit: 620, len: 1600 },
  ox_shitei_ichigeki: { tier: 'super', charge: false, hit: 460, len: 1600 },
  ox_mamori_oodate: { tier: 'super', charge: false, hit: 520, len: 1600, party: true },
  ox_wild_rush: { tier: 'super', charge: false, hit: 300, len: 1900 },
  ox_henshin_hero: { tier: 'super', charge: false, hit: 720, len: 1900 },
};

export const AX_SKILLS_O2 = {
  // 武闘家
  seiken: 'ox_seiken_zuki', mikawashi: 'ox_mikawashi', bakuretsu: 'ox_bakuretsu_ken', kiaitame: 'ox_kiaitame', mouko: 'ox_mouko_hasai',
  mawashigeri: 'ox_mawashi_geri', issen: 'ox_issen_zuki', hyakuretsu: 'ox_hyakuretsu_ken',
  // 海賊
  pr_kaizokugiri: 'ox_kaizoku_giri', pr_dokuro: 'ox_dokuro_hata', pr_uzushio: 'ox_uzushio', pr_ikari: 'ox_ikari_ippatsu', pr_utage: 'ox_utage_uta',
  pr_takara: 'ox_otakara_sagashi', pr_cannon: 'ox_kaizoku_taihou',
  // 聖拳士
  hf_seikou: 'ox_seikou_ken', hf_meisou: 'ox_meisou', hf_mikiri: 'ox_mikiri', hf_tenshou: 'ox_tenshou_reppa', hf_hyakka: 'ox_seinaru_hyakuretsu',
  // 魔物使い
  tm_shippu: 'ox_shippu_muchi', tm_beast: 'ox_beast_mode', tm_ranbu: 'ox_muchi_ranbu', tm_kemono: 'ox_kemono_sakebi', tm_kizuna: 'ox_kizuna_hoegoe', tm_majuu: 'ox_majuu_ichigeki',
  // 中二病
  cu_migite: 'ox_fuuin_migite', cu_jakigan: 'ox_jakigan', cu_note: 'ox_settei_note', cu_kurorekishi: 'ox_kuro_rekishi', cu_wagana: 'ox_waga_na_wa', cu_judgment: 'ox_judgment_black',
  // 超能力者
  ep_spoon: 'ox_spoon_mage', ep_nenriki: 'ox_nenriki', ep_yochi: 'ox_yochi', ep_teleport: 'ox_teleport', ep_psycho: 'ox_psychokinesis',
  // ゴッドハンド
  gh_shinsoku: 'ox_shinsoku_ken', gh_tenchi: 'ox_tenchi_kamae', gh_musou: 'ox_musou_ken', gh_ikazuchi: 'ox_ikazuchi_kobushi', gh_godfist: 'ox_god_hand',
  // ガーディアン
  gd_wall: 'ox_teppeki', gd_youzai: 'ox_youzai_ichigeki', gd_bash: 'ox_shield_attack', gd_protect: 'ox_minna_mamoru', gd_daichi: 'ox_daichi_tate', gd_fortress: 'ox_fudou_youzai',
  // モンスターマスター
  mm_whip: 'ox_majuu_muchi', mm_iyashi: 'ox_mamono_iyashi', mm_howl: 'ox_wild_howl', mm_kizuna: 'ox_mamono_kizuna', mm_daikoushin: 'ox_mamono_daikoushin', mm_king: 'ox_kemono_no_ou',
  // ダ天使（dt_ で はじまるが 合体技で ない）
  dt_hohoemi: 'ox_tenshi_hohoemi', dt_keiyaku: 'ox_kindan_keiyaku', dt_tsubasa: 'ox_kuroi_tsubasa', dt_darkangel: 'ox_dark_angel',
  // 魔王
  mo_hadou: 'ox_itetsuku_hadou', mo_tsume: 'ox_maou_tsume', mo_iatsu: 'ox_maou_iatsu', mo_koromo: 'ox_yami_koromo', mo_hametsu: 'ox_hametsu_hikari',
  // ひらめき
  hk_sandan: 'ox_sandan_zuki', hk_senpuukyaku: 'ox_senpuu_kyaku', hi_yami_sekai: 'ox_yami_no_sekai', hi_spoon_arashi: 'ox_spoon_arashi',
  hi_tenchi_kudaki: 'ox_tenchi_kudaki', hi_shield_throw: 'ox_shield_throw', hi_mamono_shingeki: 'ox_mamono_shingeki', hi_lucifer: 'ox_lucifer_wing',
  // 合体技
  dt_hametsu: 'ox_hametsu_hakaidama', dt_nenriki_meteor: 'ox_nenriki_meteor', dt_beast_cross: 'ox_beast_cross', dt_circus: 'ox_dai_circus', dt_oozora: 'ox_oozora_sanpo',
  dt_shitei: 'ox_shitei_ichigeki', dt_oodate: 'ox_mamori_oodate', dt_wild_rush: 'ox_wild_rush', dt_henshin_hero: 'ox_henshin_hero',
};

export const AX_FAMILIES_O2 = {
  こぶし: ['ox_seiken_zuki', 'ox_sandan_zuki', 'ox_seikou_ken', 'ox_shinsoku_ken'],
  連打: ['ox_bakuretsu_ken', 'ox_hyakuretsu_ken', 'ox_seinaru_hyakuretsu', 'ox_musou_ken'],
  ムチ: ['ox_shippu_muchi', 'ox_muchi_ranbu', 'ox_majuu_muchi'],
  さけび: ['ox_kemono_sakebi', 'ox_wild_howl'],
  魔王の闇: ['ox_maou_tsume', 'ox_maou_iatsu', 'ox_yami_no_sekai', 'ox_hametsu_hikari'],
  ダ天使の羽: ['ox_kuroi_tsubasa', 'ox_lucifer_wing', 'ox_dark_angel'],
  ねん力: ['ox_nenriki', 'ox_psychokinesis', 'ox_spoon_arashi'],
  守り: ['ox_teppeki', 'ox_minna_mamoru', 'ox_fudou_youzai'],
};
