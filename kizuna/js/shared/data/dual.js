// 合体技（2人で 力を 合わせる 技）
//
// ・自分の 行動ゲージが たまって コマンドを えらぶ とき、仲間と 出せる。
//   仲間の ゲージが たまって いれば すぐ。まだ なら「よやく」して、仲間の ゲージが たまった ときに いっしょに 出す
// ・はじめて 使う までは 効果が わからない（char.dualSeen。使うと わかる）
// ・need の 2つの 組の 技を、2人が 1つずつ 覚えていれば 出せる（どちらが どちらでも よい）
// ・2人の 番（行動ゲージ）と、それぞれの MP（mp[0]・mp[1]）を 使う
// ・相手が 家族（人が 動かしている キャラ）の ときは、相手に「参加する？」と 聞く
// ・技の 強さは 2人の 強さを 合わせて 決まる（battle.js の performDual）
import { ABILITIES } from './abilities.js?v=0136232bcf56';

// 技の 組（どれか 1つを 覚えていれば よい）
const FIRE = ['mera', 'merami', 'merazoma', 'gira', 'begirama', 'nj_katon', 'am_begiragon', 'am_meragaia', 'hk_triple_mera', 'ck_tsuyobi', 'ck_flambe', 'hi_daikaryoku', 'hi_giragureido', 'hi_ima_mera'];
const ICE = ['hyado', 'hyadaruko', 'sg_mahyado', 'pr_uzushio', 'hk_koori_ya', 'dz_mahyadedos', 'hi_eternal_blizzard', 'sb_aircon', 'rn_chiller'];
const WIND = ['bagi', 'bagima', 'sg_bagikurosu', 'nj_fuujin', 'hp_bagimuta', 'kamaitachi', 'hk_senpuukyaku', 'ar_senpu'];
const BLAST = ['io', 'iora', 'pr_cannon', 'ft_tower', 'am_ionazun', 'dz_iogurande', 'pa_macaron'];
const BOLT = ['mk_raiden', 'hr_gigadein', 'sm_raijin', 'so_kaminari', 's2_spark', 'nk_kaminari'];
const LIGHT = ['hk_holy_light', 'ft_star', 'sd_comet', 'sd_meteor', 'hk_love_beam', 'fz_meteor', 'pa_candy', 'fg_hirameki'];
const SWORD = ['daichi', 'kaiha', 'kuuretsu', 'kabutowari', 'majingiri', 'tamashii', 'bm_musou', 'bm_moroba', 'pr_kaizokugiri', 'sa_iai', 'sa_tsubame', 'sa_ittou', 'hk_midaregiri', 'hk_daichi_ikari', 'mk_kaengiri', 'mk_hyouketsu', 'mk_inazuma',
  'dk_gigabreak', 'ms_dark', 'swm_seiken', 'swm_haken', 'swm_raijin', 'sg_ikkiuchi', 'sg_tenka', 'lt_ken', 'hi_arutema'];
const FIST = ['seiken', 'bakuretsu', 'mouko', 'hyakuretsu', 'issen', 'hf_seikou', 'gh_shinsoku', 'hk_sandan', 'sy_rush', 's2_rush', 'go_pistol'];
const HEAL = ['hoimi', 'behoimi', 'behomara', 'sg_behoma', 'pl_hikari', 'id_fansa', 'id_kami', 'hk_iyashi_kaze', 'ss_stardance', 'es_kyushoku', 'lc_jumin', 'ff_teate', 'fz_juice',
  'ok_gohan', 'ab_makanai', 'dz_ishi', 'dt_hohoemi', 'lt_inori'];
const DANCE = ['hustle', 'medapani', 'zameha_dance', 'ss_stardance', 'js_bakuten', 'hk_happy_step', 'ar_senpu'];
const SONG = ['ouen', 'tatakai_uta', 'pr_utage', 'bb_ouenka', 'id_penlight', 'hk_fan_cheer', 'sd_song', 'es_recorder', 'jh_gassho', 'ar_harmony', 'kq_doremi'];
const GUARD = ['kabau', 'sukara', 'sukuruto', 'pl_daibougyo', 'pl_aegis', 'gd_wall', 'id_center', 'lc_bousai', 'cr_kiki', 'ff_hinoyoujin', 'dv_anzen', 'kq_sentou'];
const RAIL = ['rw_manin', 'rw_teikoku', 'rw_shinkansen', 'rw_shuuden', 'hk_tokkyu', 'dv_tsuuka', 'dv_renketsu', 'dv_saikou', 'kq_120', 'kq_kaitoku'];
const OFFICE = ['sm_meishi', 'sm_eigyo', 'sm_horenso', 'sm_present', 'hk_meishi_shuriken', 'sk_tsukin', 'sk_kaigi'];
const BALL = ['bb_hit', 'bb_homerun', 'bb_fastball', 'hk_nagashi', 'hk_makyuu', 'ml_160', 'nt_nitoryu'];
const IDOL = ['id_kiss', 'id_wink', 'id_fansa', 'id_penlight', 'hk_love_beam', 'fz_basket', 'ar_manazashi'];
const JESTER = ['js_asobu', 'js_gag', 'js_kusuguri', 'hk_daibakushou'];
const PARTY = ['sm_nomikai', 'sm_present', 'sm_bonus', 'js_gag', 'id_penlight', 'es_aisatsu', 'hs_bunkasai', 'lc_yurukyara', 'yt_live', 'cm_warai'];
// 学校の 技・公務員の 技（授業参観: 子どもと 大人で 出す）
const SCHOOL = ['es_randoseru', 'es_aisatsu', 'es_recorder', 'es_kakekko', 'es_dodge', 'hk_randoseru_rocket', 'jh_bukatsu', 'jh_test', 'jh_gassho', 'hs_seishun', 'hs_bunkasai'];
const CIVIL = ['lc_madoguchi', 'lc_shorui', 'lc_jumin', 'nc_hanko', 'nc_yosan', 'cr_seisaku'];
const WORK = [...OFFICE, ...CIVIL, 'bc_kessai', 'sh_meirei'];
const ELEM_SPELLS = [...FIRE, ...ICE, ...WIND, ...BLAST, ...BOLT, ...LIGHT];
const DANCE_SONG = [...DANCE, ...SONG];
// 第20〜22回の 職業の 技（hi_ … その 職業の ひらめき技。hirameki-jobs.js）
const COOK = ['ck_houchou', 'ck_soup', 'ck_tsuyobi', 'ck_spice', 'ck_stamina', 'ck_mijin', 'ck_flambe', 'ck_fullcourse', 'pa_candy', 'pa_cake', 'pa_fondue', 'pa_macaron', 'pa_sugar', 'pa_wedding',
  'sc_tetsujin', 'sc_honoo', 'sc_fullcourse', 'sc_kyuukyoku', 'hi_kakushi_bouchou', 'hi_daikaryoku', 'hi_okashi_no_ie'];
const STORE = ['ab_danboru', 'ab_irasshai', 'ab_reji', 'ab_makanai', 'ab_shinadashi', 'ab_nenmatsu', 'se_shainsho', 'se_chourei', 'se_project', 'se_ookuchi',
  'tk_genba', 'tk_zensha', 'tk_ryokou', 'tk_tatakiage', 'hi_wanope', 'hi_smile', 'hi_shachoushou'];
const WARAI = ['cm_tsukkomi', 'cm_gag', 'cm_conte', 'cm_warai', 'cm_bakushou', 'm1_machinegun', 'm1_densetsu', 'm1_kansei', 'm1_yuushou', 'hi_noritsukkomi', 'hi_tendon'];
const NEET = ['ne_makura', 'ne_potechi', 'ne_guguru', 'ne_jersey', 'ne_ippatsu', 'hi_kyou_honki'];
const DARK = ['cu_migite', 'cu_kokuen', 'cu_judgment', 'dt_hane', 'dt_ochita', 'dt_darkangel', 'mo_kokuen', 'mo_tsume', 'mo_hametsu', 'ms_dark', 'ms_hades', 'hi_dorumadon', 'hi_yami_sekai'];
const KI = ['sy_kidan', 'sy_renzoku', 'sy_kamehameha', 'sy_rush', 'sy_bigbang', 'sz_kame', 'sz_kikouha', 'sz_final', 'sz_renzoku', 's2_spark', 's2_kame', 's2_rush', 's2_final',
  's3_ryuuken', 's3_kame', 's3_rengeki', 'hi_kienzan', 'hi_bigbang_kame'];
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
const TAMER = ['tm_shippu', 'tm_beast', 'tm_ranbu', 'tm_kemono', 'tm_kizuna', 'tm_majuu', 'mm_whip', 'mm_iyashi', 'mm_howl', 'mm_kizuna', 'mm_daikoushin', 'mm_king'];
const COMEDY = [...JESTER, ...WARAI];
const GAME_SCHOOL = [...GAME, ...SCHOOL];
const SAFETY = [...CIVIL, ...POLICE, ...FIRE_DEPT];

// 組の なまえ（メニューの 一覧で 見せる）
export const DUAL_GROUP_NAMES = new Map([
  [FIRE, '炎の呪文'], [ICE, '氷の呪文'], [WIND, '風の技'], [BLAST, '爆発の呪文'], [BOLT, '雷の呪文'], [LIGHT, '光の技'],
  [SWORD, '剣の技'], [FIST, 'こぶしの技'], [HEAL, '回復の技'], [DANCE, 'おどり'], [SONG, '歌'], [GUARD, '守りの技'],
  [RAIL, '鉄道員の技'], [OFFICE, '会社員の技'], [BALL, '野球の技'], [IDOL, 'アイドルの技'], [JESTER, '遊び人の技'], [PARTY, 'もり上げる技'],
  [SCHOOL, '学校の技'], [CIVIL, '公務員の技'], [WORK, 'お仕事の技'],
  [ELEM_SPELLS, '属性の技'], [DANCE_SONG, 'おどりか歌'],
  [COOK, '料理の技'], [STORE, 'お店と会社の技'], [WARAI, 'お笑いの技'], [NEET, 'ニートの技'], [DARK, '闇の技'], [KI, '気の技'], [GOMU, 'ゴムの技'],
  [PIRATE, '海賊の技'], [FACILITY, '設備の技'], [STREAM, '配信の技'], [GAME, 'ゲームの技'], [MAOU, '魔王の技'], [HAKAI, 'はかい神の技'], [OKAN, 'おかんの技'],
  [SHACHIKU, '社ちくの技'], [BOSS, '上司の技'], [LOTO, 'ロトの技'], [HERO, '勇者の技'], [POLICE, '警察官の技'], [FIRE_DEPT, '消防士の技'], [TAMER, '魔物使いの技'],
  [COMEDY, 'お笑いか遊び人の技'], [GAME_SCHOOL, 'ゲームか学校の技'], [SAFETY, '公務員・警察・消防の技'],
]);

export const DUAL_TECHS = {
  dt_taishoumetsu: {
    name: '対消滅', kana: 'ついしょうめつ', need: [FIRE, ICE], mp: [5, 5], target: 'enemy', spell: true,
    parts: [{ type: 'magic', element: 'void', base: [62, 80], thr: 24 }],
    desc: '炎と氷を全く同じ強さでぶつけて、全てを消し去る光を生む。', anim: 'void', element: 'void',
  },
  dt_honoo_tatsumaki: {
    name: '炎の竜巻', kana: 'ほのおのたつまき', need: [FIRE, WIND], mp: [4, 4], target: 'enemies', spell: true,
    parts: [{ type: 'magic', element: 'fire', base: [34, 44], thr: 20 }],
    desc: '風が炎を巻き上げて、大きな炎の竜巻になる。敵全体を焼きつくす。', anim: 'fire_tornado', element: 'fire',
  },
  dt_blizzard: {
    name: 'ブリザード', kana: 'ぶりざーど', need: [ICE, WIND], mp: [4, 4], target: 'enemies', spell: true,
    parts: [{ type: 'magic', element: 'ice', base: [30, 40], thr: 20, status: { status: 'paralyze', chance: 0.15, turns: [1, 2], quiet: true } }],
    desc: '氷が風に乗って、はげしいふぶきになる。敵全体をこおりつかせる。', anim: 'blizzard', element: 'ice',
  },
  dt_daibakuen: {
    name: '大爆炎', kana: 'だいばくえん', need: [FIRE, BLAST], mp: [5, 5], target: 'enemies', spell: true,
    parts: [{ type: 'magic', element: 'blast', base: [40, 52], thr: 22 }],
    desc: '炎が爆発を呼び、大きな爆炎が上がる。敵全体に大ダメージ。', anim: 'blast2', element: 'blast',
  },
  dt_cross_mahouken: {
    name: 'クロス魔法剣', kana: 'くろすまほうけん', need: [SWORD, ELEM_SPELLS], mp: [3, 4], target: 'enemy', weapon: [0, 'blade'],
    parts: [{ type: 'phys', mult: 2.4, elementFrom: 1 }],
    desc: '仲間の呪文の力を剣にまとわせて斬る。仲間の呪文と同じ属性の剣になる。', anim: 'mahouken',
  },
  dt_raiden_strash: {
    name: 'ライデインストラッシュ', kana: 'らいでいんすとらっしゅ', need: [SWORD, BOLT], mp: [4, 6], target: 'enemy', weapon: [0, 'blade'],
    parts: [{ type: 'phys', element: 'bolt', mult: 3.0, ignoreDef: 0.3 }],
    desc: '仲間のよんだ雷を剣で受けて、そのまま斬りつける。雷の必殺剣。', anim: 'gigabreak', element: 'bolt',
  },
  dt_cross_break: {
    name: 'クロスブレイク', kana: 'くろすぶれいく', need: [SWORD, SWORD], mp: [3, 3], target: 'enemy', weapon: [0, 'blade'],
    parts: [{ type: 'phys', mult: 1.3, hits: 2, ignoreDef: 0.3 }],
    desc: '2人の剣が十字をえがく。守りの固い敵にもよく効く。', anim: 'cross_slash',
  },
  dt_twin_fist: {
    name: 'ツイン百裂拳', kana: 'ついんひゃくれつけん', need: [FIST, FIST], mp: [3, 3], target: 'enemy',
    parts: [{ type: 'phys', mult: 0.45, hits: 6, critBonus: 0.05 }],
    desc: '2人で息を合わせて、こぶしの雨をふらせる。6回続けて打つ。', anim: 'punch_multi',
  },
  dt_iyashi_wa: {
    name: 'いやしの輪', kana: 'いやしのわ', need: [HEAL, HEAL], mp: [4, 4], target: 'allies', spell: true,
    parts: [{ type: 'heal', base: [44, 58], thr: 20 }],
    desc: '2人の回復の力が大きな輪になって、仲間全員のHPを大きく回復する。', anim: 'heal_ring',
  },
  dt_harmony: {
    name: 'いやしのハーモニー', kana: 'いやしのはーもにー', need: [HEAL, DANCE_SONG], mp: [4, 3], target: 'allies',
    parts: [{ type: 'heal', base: [28, 36], thr: 18 }, { type: 'cure', statuses: ['sleep', 'confuse', 'paralyze', 'poison', 'blind', 'silence'] }],
    desc: '歌とおどりに、いやしの力を乗せる。仲間全員を回復して、状態異常も治す。', anim: 'heal_dance',
  },
  dt_teppeki: {
    name: 'てっぺきの守り', kana: 'てっぺきのまもり', need: [GUARD, GUARD], mp: [3, 3], target: 'allies',
    parts: [{ type: 'buff', stats: ['def'], mult: 1.4, dur: 30 }],
    desc: '2人で守りをかためる。仲間全員の身の守りが大きく上がる。', anim: 'guard',
  },
  dt_stage: {
    name: 'ステージショー', kana: 'すてーじしょー', need: [DANCE, SONG], mp: [3, 3], target: 'allies',
    parts: [{ type: 'buff', stats: ['atk', 'agi'], mult: 1.25, dur: 30 }],
    desc: '歌とおどりのステージで、仲間全員の攻撃力と素早さが大きく上がる。', anim: 'stage',
  },
  dt_tsukin_rush: {
    name: '通勤ラッシュ', kana: 'つうきんらっしゅ', need: [RAIL, OFFICE], mp: [4, 3], target: 'enemies',
    parts: [{ type: 'phys', mult: 1.3 }, { type: 'atbSet', value: 0, msg: '{t}はぎゅうぎゅうで動けない！' }],
    desc: '鉄道員と会社員の、朝の戦い。敵全体をぎゅうぎゅうおしこんで、動きを止める。', anim: 'train',
  },
  dt_hero_interview: {
    name: 'ヒーローインタビュー', kana: 'ひーろーいんたびゅー', need: [BALL, IDOL], mp: [3, 3], target: 'allies',
    parts: [{ type: 'buff', stats: ['atk', 'agi'], mult: 1.3, dur: 30 }, { type: 'heal', base: [18, 24], thr: 18 }],
    desc: 'ホームランのあとは、アイドルがインタビュー！仲間全員がもり上がって、元気が出る。', anim: 'stage',
  },
  dt_kakushigei: {
    name: 'かくし芸大会', kana: 'かくしげいたいかい', need: [JESTER, PARTY], mp: [3, 4], target: 'enemies',
    parts: [{ type: 'status', status: 'confuse', chance: 0.55, turns: [1, 3] }],
    desc: 'おどろきのかくし芸が大うけ！敵全体が笑いころげて、混乱することがある。', anim: 'laugh',
  },
  dt_jugyo_sankan: {
    name: '授業参観', kana: 'じゅぎょうさんかん', need: [SCHOOL, WORK], mp: [3, 3], target: 'allies',
    parts: [{ type: 'buff', stats: ['atk', 'agi'], mult: 1.3, dur: 30 }, { type: 'heal', base: [20, 26], thr: 18 }],
    desc: '子どもががんばるすがたを、大人がうしろから見守る。みんながはりきって、仲間全員の攻撃力と素早さが上がり、HPも回復する。', anim: 'stage',
  },
  // ───── 第23回: 第20〜22回の 職業の 合体技 ─────
  dt_gomu_kame: {
    name: 'ゴムゴムのかめはめ波', kana: 'ごむごむのかめはめは', need: [KI, GOMU], mp: [6, 6], target: 'enemy',
    parts: [{ type: 'phys', mult: 3.0 }],
    desc: 'かめはめ波を、ゴムのうでで大きくのばしたうでから打ち出す。敵1体に大ダメージ。', anim: 'kamehameha',
  },
  dt_fusion: {
    name: 'フュージョン', kana: 'ふゅーじょん', need: [KI, KI], mp: [5, 5], target: 'enemies',
    parts: [{ type: 'phys', mult: 1.5, ignoreDef: 0.3 }],
    desc: '「フュー…ジョン！はっ！」2人が1人に合体して、敵全体に気の大攻撃。', anim: 'ki_blast',
  },
  dt_bentou: {
    name: 'お弁当とどけに来たよ', kana: 'おべんとうとどけにきたよ', need: [OKAN, SHACHIKU], mp: [4, 3], target: 'allies',
    parts: [{ type: 'heal', base: [40, 52], thr: 22 }, { type: 'buff', stat: 'atk', mult: 1.25, dur: 30 }],
    desc: 'わすれたお弁当を、おかんが会社までとどけに来た！仲間全員のHPが回復して、攻撃力も上がる。', anim: 'gohan',
  },
  dt_zenkan: {
    name: '全館リニューアル', kana: 'ぜんかんりにゅーある', need: [FACILITY, FACILITY], mp: [8, 8], target: 'enemies', element: 'ice',
    parts: [{ type: 'magic', element: 'ice', base: [90, 110], thr: 60 }, { type: 'heal', target: 'allies', base: [50, 64], thr: 40 }],
    desc: '設備のプロが2人で、建物をまるごと新しくする。敵全体に冷たい風、仲間全員は気持ちよく回復する。', anim: 'aircon',
  },
  dt_hametsu: {
    name: '破滅のはかい玉', kana: 'はめつのはかいだま', need: [MAOU, HAKAI], mp: [12, 12], target: 'enemies', spell: true, element: 'dark',
    parts: [{ type: 'magic', element: 'dark', base: [200, 240], thr: 90 }],
    desc: '魔王の闇と、はかい神の力を1つの玉にまとめる。敵全体に闇の大ダメージ。', anim: 'hakai_ball',
  },
  dt_jikkyou: {
    name: 'ゲーム実きょう', kana: 'げーむじっきょう', need: [STREAM, GAME], mp: [4, 4], target: 'allies',
    parts: [{ type: 'buff', stats: ['atk', 'agi'], mult: 1.25, dur: 30 }, { type: 'bondUp', amount: 20 }],
    desc: 'ゲームのうまい人と、話のうまい人で、大人気の実きょう配信！仲間全員の攻撃力と素早さが上がり、きずなも深まる。', anim: 'camera',
  },
  dt_ofukuro: {
    name: 'おふくろの味', kana: 'おふくろのあじ', need: [COOK, OKAN], mp: [4, 4], target: 'allies',
    parts: [{ type: 'heal', base: [44, 56], thr: 22 }, { type: 'cure', statuses: ['poison', 'sleep', 'confuse', 'paralyze', 'blind', 'silence'] }],
    desc: '料理のうでと、おかんの愛情。なつかしい味で、仲間全員のHPが回復して、状態異常も治る。', anim: 'heal_dance',
  },
  dt_gyouretsu: {
    name: '行列のできる店', kana: 'ぎょうれつのできるみせ', need: [COOK, STORE], mp: [4, 3], target: 'allies',
    parts: [{ type: 'heal', base: [30, 40], thr: 20 }, { type: 'mpHeal', base: [4, 8] }],
    desc: 'おいしい料理と、てきぱきした店員で、お店は大はんじょう。仲間全員のHPとMPが回復する。', anim: 'gohan',
  },
  dt_manzai: {
    name: 'まんざい', kana: 'まんざい', need: [WARAI, COMEDY], mp: [4, 3], target: 'enemies',
    parts: [{ type: 'atbSet', sub: 45, chance: 0.6, msg: '{t}は笑いころげて動けない！', failMsg: '{t}には、うけなかった…' }, { type: 'heal', target: 'allies', base: [24, 32], thr: 20 }],
    desc: 'ボケとツッコミの息がぴったり。敵全体が笑いころげて動きがおそくなることがあり、仲間全員も笑って元気になる。', anim: 'laugh',
  },
  dt_hataraki: {
    name: '早く働きなさい！', kana: 'はやくはたらきなさい', need: [OKAN, NEET], mp: [3, 3], target: 'enemies',
    parts: [{ type: 'phys', mult: 1.3 }],
    desc: 'おかんにしかられて、ついにニートが本気を出した！2人で敵全体にとびかかる。', anim: 'hit_all',
  },
  dt_gishiki: {
    name: '暗黒のぎしき', kana: 'あんこくのぎしき', need: [DARK, DARK], mp: [6, 6], target: 'enemies', spell: true, element: 'dark',
    parts: [{ type: 'magic', element: 'dark', base: [70, 90], thr: 50 }, { type: 'debuff', stat: 'def', mult: 0.85, dur: 30, chance: 0.6 }],
    desc: '闇の力を合わせる、ひみつのぎしき。敵全体に闇のダメージ。守備力が下がることがある。', anim: 'dark_wings',
  },
  dt_shuuden: {
    name: '終電ギリギリ', kana: 'しゅうでんぎりぎり', need: [RAIL, SHACHIKU], mp: [4, 4], target: 'enemies',
    parts: [{ type: 'phys', mult: 1.2 }, { type: 'atbSet', sub: 40, chance: 0.55, msg: '{t}は、ぎゅうぎゅうで動けない！', failMsg: '{t}は、なんとかおりられた。' }],
    desc: '終電にかけこむ社ちくと、ドアをおさえる鉄道員。敵全体をおしこんで、動きを止めることがある。', anim: 'manin_densha',
  },
  dt_no_zangyou: {
    name: 'ノー残業デー', kana: 'のーざんぎょうでー', need: [SHACHIKU, BOSS], mp: [3, 4], target: 'allies',
    parts: [{ type: 'heal', base: [40, 52], thr: 22 }, { type: 'atbSet', add: 30, msg: '{t}はすっきりした顔をしている！' }],
    desc: '上司の一声で、今日は早く帰れる！仲間全員のHPが回復して、すぐに動けるようになる。', anim: 'heal_dance',
  },
  dt_kaizokuou: {
    name: '海賊王になる！', kana: 'かいぞくおうになる', need: [GOMU, PIRATE], mp: [6, 4], target: 'allies',
    parts: [{ type: 'buff', stats: ['atk', 'agi'], mult: 1.3, dur: 40 }, { type: 'bondUp', amount: 20 }],
    desc: '海賊の仲間と、大きなゆめをさけぶ！仲間全員の攻撃力と素早さが上がり、きずなも深まる。', anim: 'nika_drum',
  },
  dt_hikari_yami: {
    name: '光と闇', kana: 'ひかりとやみ', need: [LOTO, DARK], mp: [10, 10], target: 'enemy', spell: true, element: 'void',
    parts: [{ type: 'magic', element: 'void', base: [260, 310], thr: 90 }],
    desc: 'ロトの光と、闇の力。ぶつかり合う2つの力が、敵1体を消し去るほどの大ダメージをあたえる。', anim: 'void',
  },
  dt_roto_chisuji: {
    name: 'ロトの血すじ', kana: 'ろとのちすじ', need: [LOTO, HERO], mp: [8, 6], target: 'allies',
    parts: [{ type: 'buff', stats: ['atk', 'def', 'agi'], mult: 1.3, dur: 40 }, { type: 'heal', base: [60, 76], thr: 50 }],
    desc: '伝説の勇者の血すじが、勇者の心を呼びおこす。仲間全員の攻撃力・守備力・素早さが上がり、HPも回復する。', anim: 'holy',
  },
  dt_collab: {
    name: 'コラボライブ', kana: 'こらぼらいぶ', need: [STREAM, IDOL], mp: [4, 4], target: 'allies',
    parts: [{ type: 'heal', base: [30, 40], thr: 20 }, { type: 'buff', stat: 'atk', mult: 1.25, dur: 30 }, { type: 'bondUp', amount: 15 }],
    desc: '配信者とアイドルの、ゆめのコラボ！仲間全員のHPが回復して、攻撃力が上がり、きずなも深まる。', anim: 'stage',
  },
  dt_kyouryoku: {
    name: '協力プレイ', kana: 'きょうりょくぷれい', need: [GAME, GAME_SCHOOL], mp: [4, 4], target: 'enemy',
    parts: [{ type: 'phys', mult: 0.55, hits: 6 }],
    desc: '2人で息を合わせて、コントローラーを連打！敵1体に6回続けて攻撃する。', anim: 'punch_multi',
  },
  dt_honoo_course: {
    name: '炎のフルコース', kana: 'ほのおのふるこーす', need: [COOK, FIRE], mp: [5, 5], target: 'enemies', spell: true, element: 'fire',
    parts: [{ type: 'magic', element: 'fire', base: [40, 52], thr: 24 }],
    desc: '料理人の強火に、炎の呪文を合わせる。敵全体を、こんがり焼き上げる。', anim: 'fire_tornado',
  },
  dt_bousai: {
    name: '防災点検', kana: 'ぼうさいてんけん', need: [FACILITY, SAFETY], mp: [4, 4], target: 'allies',
    parts: [{ type: 'buff', stat: 'def', mult: 1.3, dur: 35 }, { type: 'cure', statuses: ['poison', 'sleep', 'confuse', 'paralyze', 'blind', 'silence'] }],
    desc: '設備のプロと町を守る人で、すみずみまで点検。仲間全員の守備力が上がり、状態異常も治る。', anim: 'guard',
  },
  dt_yakan: {
    name: '夜間工事', kana: 'やかんこうじ', need: [FACILITY, SHACHIKU], mp: [5, 5], target: 'enemies',
    parts: [{ type: 'phys', mult: 1.4, ignoreDef: 0.35 }],
    desc: 'みんながねている間に、2人で一気に工事。敵全体を、守りごとくだく。', anim: 'quake',
  },
  dt_hakai_ken: {
    name: 'はかいの拳', kana: 'はかいのけん', need: [HAKAI, FIST], mp: [10, 6], target: 'enemy',
    parts: [{ type: 'phys', mult: 3.2, ignoreDef: 0.4 }],
    desc: 'はかい神の力を、こぶしにこめて打ちこむ。敵1体に、守りを打ちぬく大ダメージ。', anim: 'hakai',
  },
  dt_siren: {
    name: 'サイレン出動', kana: 'さいれんしゅつどう', need: [POLICE, FIRE_DEPT], mp: [4, 4], target: 'allies',
    parts: [{ type: 'heal', base: [36, 48], thr: 22 }, { type: 'cure', statuses: ['poison', 'sleep', 'confuse', 'paralyze', 'blind', 'silence'] }, { type: 'buff', stat: 'def', mult: 1.2, dur: 30 }],
    desc: 'パトカーと消防車が、サイレンを鳴らしてかけつける！仲間全員のHPが回復し、状態異常も治り、守備力も上がる。', anim: 'siren',
  },
  dt_ozaru: {
    name: '大ザルつかい', kana: 'おおざるつかい', need: [TAMER, KI], mp: [4, 5], target: 'enemies',
    parts: [{ type: 'phys', mult: 1.3 }, { type: 'debuff', stat: 'atk', mult: 0.85, dur: 30, chance: 0.6 }],
    desc: '大ザルになったサイヤ人を、魔物使いがうまくあやつる。敵全体を攻撃して、攻撃力を下げることがある。', anim: 'quake',
  },
};

export const DUAL_ORDER = Object.keys(DUAL_TECHS);

// 組の 説明（例:「炎の呪文」）
export function groupName(list) {
  return DUAL_GROUP_NAMES.get(list) || list.map((id) => ABILITIES[id]?.name).filter(Boolean).slice(0, 3).join('・');
}

// 合体技に 使える 技を 1つ さがす（その 人が 今 使える もの）
// who: { abilities, usable(id) }
function findSkill(who, list) {
  for (const id of list) if (who.abilities.includes(id) && (!who.usable || who.usable(id))) return id;
  return null;
}

// 相手が 合体技に 入れるか（生きていて、ねむり・マヒ・混乱で なく、ゲージが たまっている）
// anyGauge: よやく できるか（ゲージは まだ たまって いなくて よい。ほかの 行動を まっている 仲間とも、つぎの 番で 出す）
export const DUAL_GAUGE = 100;
export function partnerNow(p) {
  return !p?.queued && (!!p?.ready || (p?.atb || 0) >= DUAL_GAUGE);
}
export function partnerFree(p, anyGauge = false) {
  if (!p || !p.alive || p.busy || p.inviting || p.waiting) return false;
  if (p.queued && !anyGauge) return false;
  const st = p.statuses || [];
  if (st.includes('sleep') || st.includes('paralyze') || st.includes('confuse')) return false;
  return anyGauge || partnerNow(p);
}

// actor が 今 出せる 合体技
// actor・others: { id, name, alive, abilities, mp, atb, ready, queued, statuses, weaponCat, usable(id) }
// もどりち: [{ id, partner, partnerName, mine: 0|1, skills: [a, b], mp: [actorの MP, 相手の MP], element }]
export function dualOptions(actor, others, weaponOk, { anyGauge = false } = {}) {
  const out = [];
  if (!actor || !actor.alive) return out;
  const silenced = (x) => (x.statuses || []).includes('silence');
  for (const p of others) {
    if (p.id === actor.id || !partnerFree(p, anyGauge)) continue;
    for (const [id, t] of Object.entries(DUAL_TECHS)) {
      for (const side of [0, 1]) {
        const mine = findSkill(actor, t.need[side]);
        const theirs = mine && findSkill(p, t.need[1 - side]);
        if (!mine || !theirs) continue;
        const mpMine = t.mp[side], mpTheirs = t.mp[1 - side];
        if (actor.mp < mpMine || p.mp < mpTheirs) continue;
        if (t.spell && (silenced(actor) || silenced(p))) continue;
        // 剣が いる 側
        if (t.weapon && weaponOk) {
          const [wSide, cat] = t.weapon;
          const who = wSide === side ? actor : p;
          if (!weaponOk({ weapon: cat }, who.weaponCat)) continue;
        }
        const skills = side === 0 ? [mine, theirs] : [theirs, mine];
        const elFrom = t.parts.find((x) => x.elementFrom !== undefined)?.elementFrom;
        const element = elFrom !== undefined ? ABILITIES[skills[elFrom]]?.effect?.element : t.element;
        out.push({ id, partner: p.id, partnerName: p.name, mine: side, skills, mp: [mpMine, mpTheirs], element, now: partnerNow(p) });
        break;
      }
    }
  }
  return out;
}

// ───── 今の パーティーに 関係する 合体技 ─────
// メニューの「合体技」の 一覧には、使った ことの ある 技と、パーティーに 関係する 技だけ 出す
// 関係する … need の 2つの 組の どちらにも、パーティーの 職業（stats.js の partyJobSet）の 技か、
//   パーティーの だれかが 覚えている 技（skills）が ある
export function dualRelated(id, jobSet, skills = new Set()) {
  const t = DUAL_TECHS[id];
  if (!t) return false;
  return t.need.every((list) => list.some((k) => skills.has(k) || jobSet.has(ABILITIES[k]?.job)));
}

// その 合体技の 効果を 知っているか（一度 使うと わかる）
export function dualKnown(char, id) {
  return !!char?.dualSeen?.[id];
}
