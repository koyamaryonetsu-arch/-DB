// 合体技（2人・3人・4人で 力を 合わせる 技）
//
// ・自分の 行動ゲージが たまって コマンドを えらぶ とき、仲間と 出せる。
//   仲間の ゲージが たまって いれば すぐ。まだ なら「よやく」して、みんなの ゲージが たまった ときに いっしょに 出す
//   （3人・4人の 技は、先に ゲージが たまった 仲間は ほかの 仲間を まつ。みんなの 番を 使う。shared/battle-dual.js）
// ・はじめて 使う までは 効果が わからない（char.dualSeen。使うと わかる）
// ・need の 組（2〜4こ）の 技を、出す 人が 1つずつ 覚えていれば 出せる（だれが どの 組でも よい）
// ・出す 人みんなの 番（行動ゲージ）と、それぞれの MP（mp[組の じゅん]）を 使う
// ・相手が 家族（人が 動かしている キャラ）の ときは、相手に「参加する？」と 聞く
// ・技の 強さは、出す 人が それぞれ ふつうに 技を 出した ときの ダメージの 合計 × DUAL_POWER（人数）× parts の k
//   （2人は 1.8倍・3人は 2.2倍・4人は 3倍 が もと。全体を ねらう 技は k を 小さく。battle-dual.js の dualPower）
//
// 第26回（2026年10月）: 40こ あった 合体技を 25こに しぼって 強く した。3人技・4人技と、クスッと 笑える 技を くわえた。
// けずった 合体技を 使った ことの ある 記録（char.dualSeen）は そのまま のこす（DUAL_LEGACY: にていて 1つに まとめた 技は、まとめた 先の 技も わかる）
import { ABILITIES } from './abilities.js';

// 技の 組（どれか 1つを 覚えていれば よい）
const FIRE = ['mera', 'merami', 'merazoma', 'gira', 'begirama', 'nj_katon', 'am_begiragon', 'am_meragaia', 'hk_triple_mera', 'ck_tsuyobi', 'ck_flambe', 'hi_daikaryoku', 'hi_giragureido', 'hi_ima_mera'];
const ICE = ['hyado', 'hyadaruko', 'sg_mahyado', 'pr_uzushio', 'hk_koori_ya', 'dz_mahyadedos', 'hi_eternal_blizzard', 'sb_aircon', 'rn_chiller', 'kp_mizu'];
const WIND = ['bagi', 'bagima', 'sg_bagikurosu', 'nj_fuujin', 'hp_bagimuta', 'kamaitachi', 'hk_senpuukyaku', 'ar_senpu', 'hkp_hanabira'];
const BLAST = ['io', 'iora', 'pr_cannon', 'ft_tower', 'am_ionazun', 'dz_iogurande', 'pa_macaron', 'dr_kuuki', 'ep_nenriki', 'ep_psycho', 'hg_bijuu'];
const BOLT = ['mk_raiden', 'hr_gigadein', 'sm_raijin', 'so_kaminari', 's2_spark', 'nk_kaminari'];
const LIGHT = ['hk_holy_light', 'ft_star', 'sd_comet', 'sd_meteor', 'hk_love_beam', 'fz_meteor', 'pa_candy', 'fg_hirameki'];
const SWORD = ['daichi', 'kaiha', 'kuuretsu', 'kabutowari', 'majingiri', 'tamashii', 'bm_musou', 'bm_moroba', 'pr_kaizokugiri', 'sa_iai', 'sa_tsubame', 'sa_ittou', 'hk_midaregiri', 'hk_daichi_ikari', 'mk_kaengiri', 'mk_hyouketsu', 'mk_inazuma',
  'dk_gigabreak', 'ms_dark', 'swm_seiken', 'swm_haken', 'swm_raijin', 'sg_ikkiuchi', 'sg_tenka', 'lt_ken', 'hi_arutema', 'ks_minamo', 'ks_uchishio', 'ks_nejire', 'kisatsu_sig', 'eb_shiranui', 'eb_noboru', 'eb_uneri', 'eb_rengoku', 'hn_kasha', 'hn_hirin', 'hn_koukyou', 'hinokami_sig', 'spy_knife', 'spy_action', 'as_kyuusho', 'as_ame', 'bo_yamiuchi', 'kh_kunai'];
const FIST = ['seiken', 'bakuretsu', 'mouko', 'hyakuretsu', 'issen', 'hf_seikou', 'gh_shinsoku', 'hk_sandan', 'sy_rush', 's2_rush', 'go_pistol', 'nr_punch', 'nr_tackle', 'mr_zutsuki', 'kp_tsuppari', 'kn_punch', 'kn_tackle', 'kinniku_kappa_sig', 'hkp_pakkan', 'kh_senpuu', 'hg_oodama'];
const HEAL = ['hoimi', 'behoimi', 'behomara', 'sg_behoma', 'pl_hikari', 'id_fansa', 'id_kami', 'hk_iyashi_kaze', 'ss_stardance', 'es_kyushoku', 'lc_jumin', 'ff_teate', 'fz_juice',
  'ok_gohan', 'ab_makanai', 'dz_ishi', 'dt_hohoemi', 'lt_inori', 'ct_kusuri', 'creator_sig', 'nr_dorayaki', 'mr_shuuri', 'os_oyatsu', 'kp_kyuuri', 'hkp_mitsu'];
const DANCE = ['hustle', 'medapani', 'zameha_dance', 'ss_stardance', 'js_bakuten', 'hk_happy_step', 'ar_senpu'];
const SONG = ['ouen', 'tatakai_uta', 'pr_utage', 'bb_ouenka', 'id_penlight', 'hk_fan_cheer', 'sd_song', 'es_recorder', 'jh_gassho', 'ar_harmony', 'kq_doremi'];
const GUARD = ['kabau', 'sukara', 'sukuruto', 'pl_daibougyo', 'pl_aegis', 'gd_wall', 'id_center', 'lc_bousai', 'cr_kiki', 'ff_hinoyoujin', 'dv_anzen', 'kq_sentou'];
const RAIL = ['rw_manin', 'rw_teikoku', 'rw_shinkansen', 'rw_shuuden', 'hk_tokkyu', 'dv_tsuuka', 'dv_renketsu', 'dv_saikou', 'kq_120', 'kq_kaitoku'];
const OFFICE = ['sm_meishi', 'sm_eigyo', 'sm_horenso', 'sm_present', 'hk_meishi_shuriken', 'sk_tsukin', 'sk_kaigi', 'rk_card', 'rk_dance', 'rakuten_cardman_sig'];
const BALL = ['bb_hit', 'bb_homerun', 'bb_fastball', 'hk_nagashi', 'hk_makyuu', 'ml_160', 'nt_nitoryu'];
const IDOL = ['id_kiss', 'id_wink', 'id_fansa', 'id_penlight', 'hk_love_beam', 'fz_basket', 'ar_manazashi'];
const JESTER = ['js_asobu', 'js_gag', 'js_kusuguri', 'hk_daibakushou', 'oshiri_tantei_sig', 'os_brown'];
// 学校の 技・公務員の 技
const SCHOOL = ['es_randoseru', 'es_aisatsu', 'es_recorder', 'es_kakekko', 'es_dodge', 'hk_randoseru_rocket', 'jh_bukatsu', 'jh_test', 'jh_gassho', 'hs_seishun', 'hs_bunkasai', 'tn_ball', 'tn_jitensha', 'shonen_tantei_sig', 'mt_kick', 'mt_skate'];
const CIVIL = ['lc_madoguchi', 'lc_shorui', 'lc_jumin', 'nc_hanko', 'nc_yosan', 'cr_seisaku'];
const ELEM_SPELLS = [...FIRE, ...ICE, ...WIND, ...BLAST, ...BOLT, ...LIGHT];
// 第20〜22回の 職業の 技（hi_ … その 職業の ひらめき技。hirameki-jobs.js）
const COOK = ['ck_houchou', 'ck_soup', 'ck_tsuyobi', 'ck_spice', 'ck_stamina', 'ck_mijin', 'ck_flambe', 'ck_fullcourse', 'pa_candy', 'pa_cake', 'pa_fondue', 'pa_macaron', 'pa_sugar', 'pa_wedding',
  'sc_tetsujin', 'sc_honoo', 'sc_fullcourse', 'sc_kyuukyoku', 'hi_kakushi_bouchou', 'hi_daikaryoku', 'hi_okashi_no_ie'];
const STORE = ['ab_danboru', 'ab_irasshai', 'ab_reji', 'ab_makanai', 'ab_shinadashi', 'ab_nenmatsu', 'se_shainsho', 'se_chourei', 'se_project', 'se_ookuchi',
  'tk_genba', 'tk_zensha', 'tk_ryokou', 'tk_tatakiage', 'hi_wanope', 'hi_smile', 'hi_shachoushou', 'ct_kago', 'ct_point'];
const WARAI = ['cm_tsukkomi', 'cm_gag', 'cm_conte', 'cm_warai', 'cm_bakushou', 'm1_machinegun', 'm1_densetsu', 'm1_kansei', 'm1_yuushou', 'hi_noritsukkomi', 'hi_tendon'];
const NEET = ['ne_makura', 'ne_potechi', 'ne_guguru', 'ne_jersey', 'ne_ippatsu', 'hi_kyou_honki'];
const DARK = ['cu_migite', 'cu_kokuen', 'cu_judgment', 'dt_hane', 'dt_ochita', 'dt_darkangel', 'mo_kokuen', 'mo_tsume', 'mo_hametsu', 'ms_dark', 'ms_hades', 'hi_dorumadon', 'hi_yami_sekai', 'bo_kuruma', 'bo_meirei'];
const KI = ['sy_kidan', 'sy_renzoku', 'sy_kamehameha', 'sy_rush', 'sy_bigbang', 'sz_kame', 'sz_kikouha', 'sz_final', 'sz_renzoku', 's2_spark', 's2_kame', 's2_rush', 's2_final',
  's3_ryuuken', 's3_kame', 's3_rengeki', 'hi_kienzan', 'hi_bigbang_kame', 'konoha_sig', 'hg_oodama'];
const GOMU = ['go_pistol', 'go_gatling', 'go_bazooka', 'go_gear3', 'nk_kaminari', 'nk_taiyou', 'nk_kaihou', 'hi_gomu_muchi'];
const PIRATE = ['pr_kaizokugiri', 'pr_dokuro', 'pr_uzushio', 'pr_ikari', 'pr_utage', 'pr_cannon'];
const FACILITY = ['sb_spanner', 'sb_tenken', 'sb_haikan', 'sb_aircon', 'sb_kouji', 'rn_koushin', 'rn_chiller', 'rn_kanki', 'rn_netsugen', 'rn_yochou', 'rn_saiteki',
  'fg_mieruka', 'fg_yochou', 'fg_kuuchou', 'fg_demand', 'fg_hirameki', 'fg_saiteki', 'hi_shinkuu', 'hi_yukadanbou', 'hi_inverter'];
const STREAM = ['yt_jidori', 'yt_live', 'yt_samune', 'yt_kirinuki', 'yt_enjou', 'yt_touroku', 'yt_hyakuman', 'st_collab', 'st_dokkiri', 'st_daienjou', 'st_kinen', 'st_nagesen',
  'st_doujisetsuzoku', 'hi_kyuujoushou', 'hi_buzz'];
const GAME = ['ga_renda', 'ga_controller', 'ga_hame', 'ga_combo', 'ga_lastboss', 'pg_keyboard', 'pg_nyuuryoku', 'pg_kamiplay', 'pg_team', 'pg_yuushou', 'hi_kakushi_command', 'hi_time_attack'];
const MAOU = ['mo_kokuen', 'mo_hadou', 'mo_tsume', 'mo_iatsu', 'mo_hametsu', 'hi_ima_mera', 'hi_yami_sekai'];
const HAKAI = ['hk_hakai', 'hk_kami', 'hk_hakaidama', 'hi_pudding'];
const OKAN = ['ok_otama', 'ok_gohan', 'ok_nenasai', 'ok_negiri', 'ok_slipper', 'ok_bentou', 'ok_katazuke', 'ok_ikari', 'so_kaminari', 'so_okawari', 'so_osouji', 'so_slipper', 'so_kaji', 'so_binta',
  'hi_idobata', 'hi_bargain', 'hi_chabudai'];
const SHACHIKU = ['sk_tsukin', 'sk_kaigi', 'sk_iji', 'sk_pekopeko', 'sk_shuuden', 'bk_norma', 'bk_24h', 'bk_ichigan', 'bk_star', 'hi_reply_all'];
const BOSS = ['bc_kaigi', 'bc_kessai', 'bc_homeru', 'bc_idou', 'sh_tsuru', 'sh_meirei', 'sh_kabunushi', 'sh_oneman', 'sh_topdown', 'se_chourei', 'tk_genba', 'tk_zensha'];
const LOTO = ['lt_ken', 'lt_shirushi', 'lt_inori', 'lt_gigacross', 'hi_arutema', 'hi_hikari_tama'];
const HERO = ['hr_gigaslash', 'hr_kizuna', 'hr_inori', 'hr_gigadein', 'hr_kizunaken'];
const POLICE = ['po_taiho', 'po_keibou', 'po_shokumu', 'po_koutsuu', 'po_patocar', 'po_seigi'];
const FIRE_DEPT = ['ff_housui', 'ff_teate', 'ff_kyujo', 'ff_hinoyoujin', 'ff_hashigo', 'ff_issei'];
// 第26回: まとめた 組
const MELEE = [...SWORD, ...FIST];
const STAGE = [...new Set([...DANCE, ...SONG, ...IDOL])];
const COMEDY = [...JESTER, ...WARAI];
const HOLY = [...new Set([...LOTO, ...HERO, ...LIGHT])];
// 大人の 仕事（会社員・公務員・社ちく・上司・お店と 会社）
const JOBWORK = [...new Set([...OFFICE, ...CIVIL, ...SHACHIKU, ...BOSS, ...STORE])];
const FACILITY_WORK = [...new Set([...FACILITY, ...JOBWORK])];
// 子ども（学校・ゲーム・配信）
const KIDS = [...new Set([...SCHOOL, ...GAME, ...STREAM])];
// 体を 使う 技（せーのでジャンプ）
const JUMP = [...new Set([...FIST, ...DANCE, ...SCHOOL, ...BALL, ...KI, ...GOMU, ...JESTER, ...RAIL])];
const RESCUE = [...new Set([...HEAL, ...CIVIL, ...GUARD])];
const SALARY = [...new Set([...SHACHIKU, ...OFFICE])];
const KITCHEN = [...new Set([...COOK, ...STORE])];
// 攻撃の 技（職業の 技で、ダメージを あたえる もの。新しい 職業の 技も 自動で 入る）
const hurts = (e) => !!e && (e.type === 'phys' || e.type === 'magic' || (e.type === 'multi' && (e.parts || []).some(hurts)));
const ATTACK = Object.keys(ABILITIES).filter((id) => {
  const a = ABILITIES[id];
  return a.job && !a.hidden && (a.kind === 'skill' || a.kind === 'spell') && hurts(a.effect);
});

// 組の なまえ（メニューの 一覧で 見せる）
export const DUAL_GROUP_NAMES = new Map([
  [FIRE, '炎の呪文'], [ICE, '氷の呪文'], [WIND, '風の技'], [ELEM_SPELLS, '属性の技'], [SWORD, '剣の技'], [FIST, 'こぶしの技'], [MELEE, '剣かこぶしの技'],
  [HEAL, '回復の技'], [STAGE, 'おどり・歌・アイドルの技'], [RAIL, '鉄道員の技'], [JOBWORK, '大人の仕事の技'], [SCHOOL, '学校の技'], [COMEDY, 'お笑いか遊び人の技'],
  [KI, '気の技'], [GOMU, 'ゴムの技'], [OKAN, 'おかんの技'], [NEET, 'ニートの技'], [COOK, '料理の技'], [STORE, 'お店と会社の技'],
  [FACILITY, '設備の技'], [FACILITY_WORK, '設備か大人の仕事の技'], [MAOU, '魔王の技'], [HAKAI, 'はかい神の技'], [HOLY, '光か勇者の技'], [DARK, '闇の技'],
  [JUMP, '体を使う技'], [POLICE, '警察官の技'], [FIRE_DEPT, '消防士の技'], [RESCUE, '回復か町を守る技'], [KIDS, '子どもの技（学校・ゲーム・配信）'],
  [BOSS, '上司の技'], [SALARY, '社ちくか会社員の技'], [KITCHEN, '料理かお店の技'], [STREAM, '配信の技'], [GAME, 'ゲームの技'], [ATTACK, '攻撃の技（どの職業でも）'],
]);

// parts の type:
//   power … ダメージ（出す 人の ふつうの 技の 合計 × DUAL_POWER[人数] × k。kind: 'phys'（物理）/ 'magic'（呪文）。hits: 何回に 分けて 当てるか。
//           ignoreDef: 守りを むしする わりあい（物理の 見つもりに つかう）、status・debuff・dispel・banish: 当てた あとの 効果）
//   heal  … 仲間の 回復（さいだいHPの pct ＋ 出す 人の 回復の 技の 合計 × k）
//   revive … たおれた 仲間を 生き返らせる（さいだいHPの pct）
//   そのほか（buff・debuff・cure・atbSet・mpHeal・bondUp・status）は ふつうの 技と おなじ
// elementFrom: その 組の 人が 出した 技の 属性に なる（クロス魔法剣）
// fx: 画面の えんしゅつ（client/render/dualfx.js）。funny: クスッと 笑える 技
export const DUAL_TECHS = {
  // ───────── 2人技 ─────────
  dt_taishoumetsu: {
    name: '対消滅', kana: 'ついしょうめつ', need: [FIRE, ICE], mp: [8, 8], target: 'enemy', spell: true, element: 'void',
    parts: [{ type: 'power', kind: 'magic', element: 'void', k: 1.1 }],
    desc: '炎と氷を全く同じ強さでぶつけて、全てを消し去る光を生む。敵1体に無属性の大ダメージ。', anim: 'void',
  },
  dt_honoo_tatsumaki: {
    name: '炎の竜巻', kana: 'ほのおのたつまき', need: [FIRE, WIND], mp: [6, 6], target: 'enemies', spell: true, element: 'fire',
    parts: [{ type: 'power', kind: 'magic', element: 'fire', k: 0.7 }],
    desc: '風が炎を巻き上げて、大きな炎の竜巻になる。敵全体を焼きつくす。', anim: 'fire_tornado',
  },
  dt_cross_mahouken: {
    name: 'クロス魔法剣', kana: 'くろすまほうけん', need: [SWORD, ELEM_SPELLS], mp: [5, 6], target: 'enemy', weapon: [0, 'blade'],
    parts: [{ type: 'power', kind: 'phys', elementFrom: 1, k: 1.05, hits: 2 }],
    desc: '仲間の呪文の力を剣にまとわせて、十字に斬る。仲間の呪文と同じ属性の剣で、敵1体に大ダメージ。', anim: 'mahouken',
  },
  dt_cross_break: {
    name: 'クロスブレイク', kana: 'くろすぶれいく', need: [MELEE, MELEE], mp: [5, 5], target: 'enemy',
    parts: [{ type: 'power', kind: 'phys', k: 1.0, hits: 4, ignoreDef: 0.5 }],
    desc: '2人の剣とこぶしが十字をえがく。4回続けて打ちこむ。守りの固い敵にもよく効く。敵1体に大ダメージ。', anim: 'cross_slash',
  },
  dt_iyashi_wa: {
    name: 'いやしの輪', kana: 'いやしのわ', need: [HEAL, HEAL], mp: [10, 10], target: 'allies', spell: true,
    parts: [{ type: 'revive', pct: 0.3 }, { type: 'heal', pct: 0.4, k: 0.6 }],
    desc: '2人の回復の力が大きな輪になる。たおれた仲間を生き返らせて、仲間全員のHPを大きく回復する。', anim: 'heal_ring',
  },
  dt_stage: {
    name: 'ステージショー', kana: 'すてーじしょー', need: [STAGE, STAGE], mp: [6, 6], target: 'allies',
    parts: [{ type: 'buff', stats: ['atk', 'agi'], mult: 1.5, dur: 40 }, { type: 'heal', pct: 0.2, k: 0.3 }, { type: 'bondUp', amount: 15 }],
    desc: '歌とおどりの大ステージ！仲間全員の攻撃力と素早さが大きく上がり、HPも回復して、きずなも深まる。', anim: 'stage',
  },
  dt_tsukin_rush: {
    name: '通勤ラッシュ', kana: 'つうきんらっしゅ', need: [RAIL, JOBWORK], mp: [6, 6], target: 'enemies', funny: true,
    parts: [{ type: 'power', kind: 'phys', k: 0.7 }, { type: 'atbSet', value: 0, chance: 0.8, msg: '{t}はぎゅうぎゅうで動けない！', failMsg: '{t}は、なんとかおりられた。' }],
    desc: '「おしこみまーす！」鉄道員と大人の朝の戦い。敵全体を電車にぎゅうぎゅうおしこんで、動きを止める。', anim: 'train',
  },
  dt_jugyo_sankan: {
    name: '授業参観', kana: 'じゅぎょうさんかん', need: [SCHOOL, JOBWORK], mp: [5, 5], target: 'allies', funny: true,
    parts: [{ type: 'buff', stats: ['atk', 'agi'], mult: 1.5, dur: 40 }, { type: 'heal', pct: 0.25, k: 0.3 }],
    desc: 'うしろで大人が見ている！子どもがはりきりすぎて、仲間全員の攻撃力と素早さが大きく上がり、HPも回復する。', anim: 'stage',
  },
  dt_manzai: {
    name: 'まんざい', kana: 'まんざい', need: [COMEDY, COMEDY], mp: [5, 5], target: 'enemies', funny: true,
    parts: [
      { type: 'power', kind: 'phys', k: 0.6, say: '「なんでやねん！」' },
      { type: 'atbSet', sub: 60, chance: 0.75, msg: '{t}は笑いころげて動けない！', failMsg: '{t}には、うけなかった…' },
      { type: 'heal', target: 'allies', pct: 0.2, k: 0.2 },
    ],
    desc: 'ボケとツッコミの息がぴったり。敵全体にツッコミを入れて、笑いころげさせる。仲間全員も笑って元気になる。', anim: 'laugh',
  },
  dt_gomu_kame: {
    name: 'ゴムゴムのかめはめ波', kana: 'ごむごむのかめはめは', need: [KI, GOMU], mp: [8, 8], target: 'enemy',
    parts: [{ type: 'power', kind: 'phys', k: 1.15 }],
    desc: 'かめはめ波を、ゴムのうででぐーんとのばして打ち出す。敵1体に大ダメージ。', anim: 'kamehameha',
  },
  dt_bentou: {
    name: 'お弁当とどけに来たよ', kana: 'おべんとうとどけにきたよ', need: [OKAN, JOBWORK], mp: [5, 5], target: 'allies', funny: true,
    parts: [{ type: 'heal', pct: 0.4, k: 0.5 }, { type: 'buff', stat: 'atk', mult: 1.5, dur: 40 }],
    desc: '「わすれもの！」おかんが仕事場までお弁当をとどけに来た。ちょっとはずかしいけど、仲間全員のHPが回復して、攻撃力が大きく上がる。', anim: 'gohan',
  },
  dt_hataraki: {
    name: '早く働きなさい！', kana: 'はやくはたらきなさい', need: [OKAN, NEET], mp: [4, 4], target: 'enemies', funny: true,
    parts: [{ type: 'power', kind: 'phys', k: 0.9, say: 'ついにニートが本気を出した！' }],
    desc: '「いつまでねてるの！」おかんにしかられて、ついにニートが本気を出した！2人で敵全体にとびかかる。', anim: 'hit_all',
  },
  dt_gyouretsu: {
    name: '行列のできる店', kana: 'ぎょうれつのできるみせ', need: [COOK, STORE], mp: [5, 5], target: 'allies', funny: true,
    parts: [
      { type: 'heal', pct: 0.35, k: 0.5 }, { type: 'mpHeal', base: [8, 14] },
      { type: 'atbSet', target: 'enemies', sub: 50, chance: 0.7, msg: '{t}も行列にならんでしまった！', failMsg: '{t}は行列にならばなかった。' },
    ],
    desc: 'おいしい料理と、てきぱきした店員で大はんじょう！仲間全員のHPとMPが回復する。敵まで行列にならんで、動きがおそくなる。', anim: 'gohan',
  },
  dt_zenkan: {
    name: '全館リニューアル', kana: 'ぜんかんりにゅーある', need: [FACILITY, FACILITY_WORK], mp: [8, 8], target: 'enemies', element: 'ice',
    parts: [{ type: 'power', kind: 'magic', element: 'ice', k: 0.75 }, { type: 'heal', target: 'allies', pct: 0.3, k: 0.3 }],
    desc: '設備のプロが、建物をまるごと新しくする。敵全体に冷たい風、仲間全員は気持ちよく回復する。', anim: 'aircon',
  },
  dt_hametsu: {
    name: '破滅のはかい玉', kana: 'はめつのはかいだま', need: [MAOU, HAKAI], mp: [16, 16], target: 'enemies', spell: true, element: 'dark',
    parts: [{ type: 'power', kind: 'magic', element: 'dark', k: 0.85 }],
    desc: '魔王の闇と、はかい神の力を1つの玉にまとめる。敵全体に闇の大ダメージ。', anim: 'hakai_ball',
  },
  dt_hikari_yami: {
    name: '光と闇', kana: 'ひかりとやみ', need: [HOLY, DARK], mp: [12, 12], target: 'enemy', spell: true, element: 'void',
    parts: [{ type: 'power', kind: 'magic', element: 'void', k: 1.2 }],
    desc: '光と闇。ぶつかり合う2つの力が、敵1体を消し去るほどの大ダメージをあたえる。', anim: 'void',
  },
  // ───────── 3人技 ─────────
  dt_delta: {
    name: 'デルタストライク', kana: 'でるたすとらいく', need: [SWORD, FIST, ELEM_SPELLS], mp: [8, 8, 8], target: 'enemy', weapon: [0, 'blade'],
    parts: [{ type: 'power', kind: 'phys', elementFrom: 2, k: 1.0, hits: 3 }],
    desc: '剣・こぶし・呪文が三角形をえがいて、1つの点にあつまる。敵1体に、呪文と同じ属性の大ダメージ。', anim: 'cross_slash',
  },
  dt_jump: {
    name: 'せーのでジャンプ', kana: 'せーのでじゃんぷ', need: [JUMP, JUMP, JUMP], mp: [6, 6, 6], target: 'enemies', funny: true,
    parts: [
      { type: 'power', kind: 'phys', k: 0.75, say: '「せーの！」3人がいっしょにジャンプして、ドスンと着地した！' },
      { type: 'atbSet', sub: 50, chance: 0.7, msg: '{t}はゆれでひっくり返った！', failMsg: '{t}はなんとかふんばった。' },
    ],
    desc: '「せーの！」3人でいっしょにジャンプして、地面をドスンとゆらす。敵全体にダメージをあたえて、ひっくり返す。', anim: 'quake',
  },
  dt_uukanpi: {
    name: 'ウーウーカンカンピーポー', kana: 'うーうーかんかんぴーぽー', need: [POLICE, FIRE_DEPT, RESCUE], mp: [8, 8, 8], target: 'allies', funny: true,
    parts: [
      { type: 'revive', pct: 0.4 }, { type: 'heal', pct: 0.45, k: 0.5 },
      { type: 'cure', statuses: ['poison', 'sleep', 'confuse', 'paralyze', 'blind', 'silence'] },
      { type: 'power', target: 'enemies', kind: 'phys', element: 'ice', k: 0.45, say: '消防車がいっせい放水！' },
    ],
    desc: 'パトカー・消防車・救急車が、いっぺんにかけつけた！たおれた仲間も起きて、仲間全員が回復し、状態異常も治る。敵全体には放水。', anim: 'siren',
  },
  dt_oosouji: {
    name: '大そうじ大作戦', kana: 'おおそうじだいさくせん', need: [OKAN, NEET, KIDS], mp: [6, 6, 6], target: 'enemies', funny: true,
    parts: [
      { type: 'power', kind: 'phys', k: 0.7, dispel: true, say: '「ほら、あんたたちも手伝いなさい！」' },
      { type: 'banish', chance: 0.3, msg: '{t}はゴミぶくろに入れられた！', failMsg: '{t}は、ゴミぶくろからはい出した！' },
    ],
    desc: 'おかんの号令で、家じゅう大そうじ！敵全体をはたいて、強くなった力を消す。ゴミぶくろに入れられてしまう敵もいる。', anim: 'hit_all',
  },
  dt_ogori: {
    name: '部長のおごりだ！', kana: 'ぶちょうのおごりだ', need: [BOSS, SALARY, KITCHEN], mp: [12, 4, 4], target: 'allies', funny: true,
    parts: [
      { type: 'heal', pct: 0.4, k: 0.5 }, { type: 'mpHeal', base: [10, 18] },
      { type: 'buff', stats: ['atk', 'def'], mult: 1.45, dur: 40, say: '「今日はわしのおごりだ！」…部長のさいふは、からっぽになった。' },
    ],
    desc: '「今日はわしのおごりだ！」上司のお金で、みんなで大ごちそう。仲間全員のHPとMPが回復して、攻撃力と守備力が大きく上がる。部長のMPは多めにへる。', anim: 'gohan',
  },
  dt_dai_collab: {
    name: '大コラボ配信', kana: 'だいこらぼはいしん', need: [STREAM, GAME, STAGE], mp: [7, 7, 7], target: 'enemies',
    parts: [
      { type: 'power', kind: 'magic', element: 'light', k: 0.65, say: 'コメントがあらしのようにふってきた！' },
      { type: 'buff', target: 'allies', stats: ['atk', 'agi'], mult: 1.4, dur: 40 }, { type: 'bondUp', amount: 25 },
    ],
    desc: '配信者とゲーマーとアイドルの、ゆめのコラボ配信！敵全体にコメントのあらし。仲間全員の攻撃力と素早さが上がり、きずなも深まる。', anim: 'camera',
  },
  // ───────── 4人技 ─────────
  dt_zenin: {
    name: '全員集合', kana: 'ぜんいんしゅうごう', need: [ATTACK, ATTACK, ATTACK, ATTACK], mp: [10, 10, 10, 10], target: 'enemies', funny: true,
    parts: [{ type: 'power', kind: 'phys', k: 0.7, say: '「全員集合！」4人がいっせいにとびかかった！' }],
    desc: '「全員集合！」4人がいっせいに敵におそいかかる。どの職業の4人でも出せる。敵全体に大ダメージ。', anim: 'hit_all',
  },
  dt_kazoku_kaigi: {
    name: '家族会議', kana: 'かぞくかいぎ', need: [OKAN, JOBWORK, KIDS, ATTACK], mp: [8, 8, 8, 8], target: 'enemies', funny: true,
    parts: [
      { type: 'buff', target: 'allies', stats: ['atk', 'def', 'agi'], mult: 1.5, dur: 45, say: '「では、今日の晩ごはんを決めます！」' },
      { type: 'status', status: 'sleep', chance: 0.8, turns: [2, 3], say: '話し合いが長すぎて…' },
      { type: 'heal', target: 'allies', pct: 0.3, k: 0.4 },
    ],
    desc: '「では、家族会議を始めます」話し合いがあまりに長くて、敵全体がねむってしまう。家族はまとまって、攻撃力・守備力・素早さが大きく上がり、HPも回復する。', anim: 'stage',
  },
  dt_finale: {
    name: 'グランドフィナーレ', kana: 'ぐらんどふぃなーれ', need: [SWORD, FIST, ELEM_SPELLS, HEAL], mp: [14, 14, 14, 14], target: 'enemy', element: 'light', weapon: [0, 'blade'],
    parts: [{ type: 'power', kind: 'magic', element: 'light', k: 1.0, hits: 4 }, { type: 'heal', target: 'allies', pct: 0.3, k: 0.4 }],
    desc: '剣・こぶし・呪文・いやし。4人の力が1つの光になって、敵1体をつらぬく。とどめの大ダメージのあと、仲間全員のHPも回復する。', anim: 'holy',
  },
};

// メニューで ならべる じゅん（人数の 多い 技を 下に）
export const DUAL_ORDER = Object.keys(DUAL_TECHS);

// けずった 合体技 → にていて まとめた 先の 技（その 技を 使った ことが あれば、まとめた 先の 効果も わかる）
// ここに ない けずった 技の 記録（dualSeen）も、けさずに そのまま のこす
export const DUAL_LEGACY = {
  dt_raiden_strash: 'dt_cross_mahouken', dt_twin_fist: 'dt_cross_break', dt_kyouryoku: 'dt_cross_break',
  dt_hero_interview: 'dt_stage', dt_collab: 'dt_stage', dt_kakushigei: 'dt_manzai', dt_shuuden: 'dt_tsukin_rush',
  dt_harmony: 'dt_iyashi_wa', dt_ofukuro: 'dt_bentou', dt_siren: 'dt_uukanpi', dt_jikkyou: 'dt_dai_collab', dt_yakan: 'dt_zenkan', dt_bousai: 'dt_zenkan',
  dt_gishiki: 'dt_hikari_yami', dt_hakai_ken: 'dt_hametsu',
};
const LEGACY_OF = {};
for (const [old, now] of Object.entries(DUAL_LEGACY)) (LEGACY_OF[now] = LEGACY_OF[now] || []).push(old);

// 何人の 技か
export function dualSize(id) {
  return DUAL_TECHS[id]?.need.length || 0;
}

// 組の 説明（例:「炎の呪文」）
export function groupName(list) {
  return DUAL_GROUP_NAMES.get(list) || list.map((id) => ABILITIES[id]?.name).filter(Boolean).slice(0, 3).join('・');
}

// 組を Set に（さがすのを はやく）
const setCache = new WeakMap();
function groupSet(list) {
  let s = setCache.get(list);
  if (!s) setCache.set(list, (s = new Set(list)));
  return s;
}

// 合体技に 使える 技を 1つ さがす（その 人が 今 使える もの。覚えた じゅん）
// who: { abilities, usable(id) }
function findSkill(who, list) {
  const set = groupSet(list);
  for (const id of who.abilities || []) if (set.has(id) && (!who.usable || who.usable(id))) return id;
  return null;
}

// 相手が 合体技に 入れるか（生きていて、ねむり・マヒ・混乱で なく、ゲージが たまっている）
// anyGauge: よやく できるか（ゲージは まだ たまって いなくて よい。ほかの 行動を まっている 仲間とも、つぎの 番で 出す）
// hold: ほかの 仲間を まって ゲージが たまった まま 待っている（3人・4人技）
export const DUAL_GAUGE = 100;
export function partnerNow(p) {
  return !p?.queued && (!!p?.hold || !!p?.ready || (p?.atb || 0) >= DUAL_GAUGE);
}
export function partnerFree(p, anyGauge = false) {
  if (!p || !p.alive || p.busy || p.inviting || p.waiting) return false;
  if (p.queued && !anyGauge) return false;
  const st = p.statuses || [];
  if (st.includes('sleep') || st.includes('paralyze') || st.includes('confuse')) return false;
  return anyGauge || partnerNow(p);
}

// n こから k こ えらぶ くみあわせ
function* combos(list, k, from = 0, pick = []) {
  if (pick.length === k) {
    yield pick;
    return;
  }
  for (let i = from; i <= list.length - (k - pick.length); i++) yield* combos(list, k, i + 1, [...pick, list[i]]);
}
// 0..n-1 の ならべかた
function perms(n) {
  const out = [];
  const go = (cur, rest) => {
    if (!rest.length) return out.push(cur);
    rest.forEach((x, i) => go([...cur, x], [...rest.slice(0, i), ...rest.slice(i + 1)]));
  };
  go([], [...Array(n).keys()]);
  return out;
}
const PERMS = { 2: perms(2), 3: perms(3), 4: perms(4) };

// members（0 … 出す 人）を 組に わりあてる。だめなら null
// もどりち: { who: [組ごとの 人の 番号], skills: [組ごとの 技] }
function assign(t, members, weaponOk) {
  const n = t.need.length;
  const silenced = (x) => (x.statuses || []).includes('silence');
  if (t.spell && members.some(silenced)) return null;
  const memo = new Map();
  const skillOf = (m, g) => {
    const key = m * 8 + g;
    if (!memo.has(key)) memo.set(key, findSkill(members[m], t.need[g]));
    return memo.get(key);
  };
  for (const perm of PERMS[n]) {
    // perm[g] … 組 g を うけもつ 人
    let ok = true;
    for (let g = 0; g < n && ok; g++) {
      const m = members[perm[g]];
      if (!skillOf(perm[g], g) || (m.mp ?? 0) < t.mp[g]) ok = false;
      // 剣が いる 組
      else if (t.weapon && weaponOk && t.weapon[0] === g && !weaponOk({ weapon: t.weapon[1] }, m.weaponCat)) ok = false;
    }
    if (ok) return { who: perm, skills: perm.map((m, g) => skillOf(m, g)) };
  }
  return null;
}

// actor が 今 出せる 合体技
// actor・others: { id, name, alive, abilities, mp, atb, ready, queued, hold, statuses, weaponCat, usable(id) }
// もどりち: [{ id, size, partners: [相手の id], partner（1人め）, partnerName（「・」で つなぐ）, names, mine（actor の 組）,
//   skills: [組ごとの 技], who: [組ごとの 人の id], mp: [actor の MP, 相手の MP…（partners の じゅん）], element, now }]
//   2人技は いままでと おなじ 形（partner・mp[0]・mp[1]）
export function dualOptions(actor, others, weaponOk, { anyGauge = false } = {}) {
  const out = [];
  if (!actor || !actor.alive) return out;
  const free = others.filter((p) => p.id !== actor.id && partnerFree(p, anyGauge));
  for (const [id, t] of Object.entries(DUAL_TECHS)) {
    const n = t.need.length;
    if (free.length < n - 1) continue;
    // 自分が どの 組にも 入れない 技は とばす（はやく する）
    if (!t.need.some((g) => findSkill(actor, g))) continue;
    for (const team of combos(free, n - 1)) {
      const members = [actor, ...team];
      const fit = assign(t, members, weaponOk);
      if (!fit) continue;
      const mpOf = (m) => t.mp[fit.who.indexOf(m)];
      const elFrom = t.parts.find((x) => x.elementFrom !== undefined)?.elementFrom;
      const element = elFrom !== undefined ? ABILITIES[fit.skills[elFrom]]?.effect?.element : t.element;
      out.push({
        id, size: n, partners: team.map((p) => p.id), partner: team[0].id, partnerName: team.map((p) => p.name).join('・'), names: members.map((m) => m.name),
        mine: fit.who.indexOf(0), skills: fit.skills, who: fit.who.map((m) => members[m].id),
        mp: members.map((_, i) => mpOf(i)), element, now: team.every(partnerNow),
      });
    }
  }
  return out;
}

// ───── 今の パーティーに 関係する 合体技 ─────
// メニューの「合体技」の 一覧には、使った ことの ある 技と、パーティーに 関係する 技だけ 出す
// 関係する … need の 組の どれにも、パーティーの 職業（stats.js の partyJobSet）の 技か、
//   パーティーの だれかが 覚えている 技（skills）が ある
export function dualRelated(id, jobSet, skills = new Set()) {
  const t = DUAL_TECHS[id];
  if (!t) return false;
  return t.need.every((list) => list.some((k) => skills.has(k) || jobSet.has(ABILITIES[k]?.job)));
}

// その 合体技の 効果を 知っているか（一度 使うと わかる。まとめる 前の 技を 使った ことが あっても わかる）
export function dualKnown(char, id) {
  const seen = char?.dualSeen;
  if (!seen) return false;
  return !!seen[id] || (LEGACY_OF[id] || []).some((old) => seen[old]);
}
