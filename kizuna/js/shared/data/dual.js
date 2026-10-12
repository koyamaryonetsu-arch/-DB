// 合体技（2人・3人・4人で 力を 合わせる 技）
//
// ・自分の 行動ゲージが たまって コマンドを えらぶ とき、仲間と 出せる。
//   仲間の ゲージが たまって いれば すぐ。まだ なら「よやく」して、みんなの ゲージが たまった ときに いっしょに 出す
//   （3人・4人の 技は、先に ゲージが たまった 仲間は ほかの 仲間を まつ。みんなの 番を 使う。shared/battle-dual.js）
//   よやくで ゲージが たまって まっている 人が ダメージを 受けると、その 人の ゲージは 半分から やり直し（よやくは つづく）
// ・はじめて 使う までは 効果が わからない（char.dualSeen。使うと わかる）
// ・need の 組（2〜4こ）を、出す 人が 1人ずつ うけもつ。うけもてるのは「今 ついている 職業」が その 組の 職業の 人
//   （組の 技を 持つ 職業。マスターした 職業や、前の 職業で 覚えた 技は 関係 ない。だれが どの 組でも よい）
// ・「職業が だれでも よい」組は ミナデイン（勇者の 系統 ＋ だれでも 3人）だけ（家族が 決めた れいがい）。
//   全員集合は 4人の 職業が おなじ か、4人とも おなじ 基本職から 分かれた 系統（team: 'line'）
// ・出す 人みんなの 番（行動ゲージ）と、それぞれの MP（mp[組の じゅん]）を 使う
// ・相手が 家族（人が 動かしている キャラ）の ときは、相手に「参加する？」と 聞く
// ・技の 強さは、出す 人が それぞれ ふつうに 技を 出した ときの ダメージの 合計 × DUAL_POWER（人数）× parts の k
//   （2人は 1.8倍・3人は 2.2倍・4人は 3倍 が もと。全体を ねらう 技は k を 小さく。battle-dual.js の dualPower）
//
// 第26回（2026年10月）: 40こ あった 合体技を 25こに しぼって 強く した。3人技・4人技と、クスッと 笑える 技を くわえた。
// けずった 合体技を 使った ことの ある 記録（char.dualSeen）は そのまま のこす（DUAL_LEGACY: にていて 1つに まとめた 技は、まとめた 先の 技も わかる）
// 第31回（2026年10月）: 今の 職業で 判定する ように した。「攻撃の 技（どの 職業でも）」の 組を なくし、
//   きずな技の ミナデインを 合体技に した（dt_minadein）。せーのでジャンプ・家族会議・なぞは すべて 解けた！の 組も 職業に むすびつけた
import { ABILITIES } from './abilities.js?v=4238619cbf10';
import { JOBS, ALL_JOBS, jobBases } from './jobs.js?v=4238619cbf10';

// 技の 組（この 技を 持つ 職業の 人が うけもてる）
const FIRE = ['mera', 'merami', 'merazoma', 'gira', 'begirama', 'nj_katon', 'am_begiragon', 'am_meragaia', 'hk_triple_mera', 'ck_tsuyobi', 'ck_flambe', 'hi_daikaryoku', 'hi_giragureido', 'hi_ima_mera'];
const ICE = ['hyado', 'hyadaruko', 'sg_mahyado', 'pr_uzushio', 'hk_koori_ya', 'dz_mahyadedos', 'hi_eternal_blizzard', 'sb_aircon', 'rn_chiller', 'kp_mizu'];
const WIND = ['bagi', 'bagima', 'sg_bagikurosu', 'nj_fuujin', 'hp_bagimuta', 'kamaitachi', 'hk_senpuukyaku', 'ar_senpu', 'hkp_hanabira'];
const BLAST = ['io', 'iora', 'pr_cannon', 'ft_tower', 'am_ionazun', 'dz_iogurande', 'pa_macaron', 'dr_kuuki', 'ep_nenriki', 'ep_psycho', 'hg_bijuu'];
const BOLT = ['mk_raiden', 'hr_gigadein', 'sm_raijin', 'so_kaminari', 's2_spark', 'nk_kaminari'];
const LIGHT = ['hk_holy_light', 'ft_star', 'sd_comet', 'sd_meteor', 'hk_love_beam', 'fz_meteor', 'pa_candy', 'fg_hirameki'];
const SWORD = ['daichi', 'kaiha', 'kuuretsu', 'kabutowari', 'majingiri', 'tamashii', 'bm_musou', 'bm_moroba', 'pr_kaizokugiri', 'sa_iai', 'sa_tsubame', 'sa_ittou', 'hk_midaregiri', 'hk_daichi_ikari', 'mk_kaengiri', 'mk_hyouketsu', 'mk_inazuma',
  'dk_gigabreak', 'ms_dark', 'swm_seiken', 'swm_haken', 'swm_raijin', 'sg_ikkiuchi', 'sg_tenka', 'lt_ken', 'hi_arutema', 'ks_minamo', 'ks_uchishio', 'ks_nejire', 'kisatsu_sig', 'eb_shiranui', 'eb_noboru', 'eb_uneri', 'eb_rengoku', 'hn_kasha', 'hn_hirin', 'hn_koukyou', 'hinokami_sig', 'spy_knife', 'spy_action', 'as_kyuusho', 'as_ame', 'bo_yamiuchi', 'kh_kunai',
  // 第29回: るろうに剣士の 道（飛天御剣流）
  'rr_battou', 'rr_doryu', 'rr_ryukan', 'rurouni_sig', 'htk_ryusho', 'htk_soryu', 'htk_yamiyo', 'hitokiri_sig', 'hm_hiryu', 'hm_arashi', 'hm_tsumuji', 'himura_sig',
  'ht_shinsoku', 'ht_ootatsu', 'hiten_sig'];
const FIST = ['seiken', 'bakuretsu', 'mouko', 'hyakuretsu', 'issen', 'hf_seikou', 'gh_shinsoku', 'hk_sandan', 'sy_rush', 's2_rush', 'go_pistol', 'nr_punch', 'nr_tackle', 'mr_zutsuki', 'kp_tsuppari', 'kn_punch', 'kn_tackle', 'kinniku_kappa_sig', 'hkp_pakkan', 'kh_senpuu', 'hg_oodama'];
const HEAL = ['hoimi', 'behoimi', 'behomara', 'sg_behoma', 'pl_hikari', 'id_fansa', 'id_kami', 'hk_iyashi_kaze', 'ss_stardance', 'es_kyushoku', 'lc_jumin', 'ff_teate', 'fz_juice',
  'ok_gohan', 'ab_makanai', 'dz_ishi', 'dt_hohoemi', 'lt_inori', 'ct_kusuri', 'creator_sig', 'nr_dorayaki', 'mr_shuuri', 'os_oyatsu', 'kp_kyuuri', 'hkp_mitsu',
  'rr_sentaku', 'hm_ocha', 'ht_ikiyou',
  // 第31回: 大神官も いやしの 組に
  'hp_behomazun'];
const DANCE = ['hustle', 'medapani', 'zameha_dance', 'ss_stardance', 'js_bakuten', 'hk_happy_step', 'ar_senpu'];
const SONG = ['ouen', 'tatakai_uta', 'pr_utage', 'bb_ouenka', 'id_penlight', 'hk_fan_cheer', 'sd_song', 'es_recorder', 'jh_gassho', 'ar_harmony', 'kq_doremi'];
// 第31回: かばう（戦士）は 町を 守る 技から はずした（戦士が どこにでも 入って しまう）
const GUARD = ['sukara', 'sukuruto', 'pl_daibougyo', 'pl_aegis', 'gd_wall', 'id_center', 'lc_bousai', 'cr_kiki', 'ff_hinoyoujin', 'dv_anzen', 'kq_sentou', 'hm_fusatsu'];
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
const DARK = ['cu_migite', 'cu_kokuen', 'cu_judgment', 'dt_hane', 'dt_ochita', 'dt_darkangel', 'mo_kokuen', 'mo_tsume', 'mo_hametsu', 'ms_dark', 'ms_hades', 'hi_dorumadon', 'hi_yami_sekai', 'bo_kuruma', 'bo_meirei', 'htk_yamiyo'];
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
const RESCUE = [...new Set([...HEAL, ...CIVIL, ...GUARD])];
const SALARY = [...new Set([...SHACHIKU, ...OFFICE])];
const KITCHEN = [...new Set([...COOK, ...STORE])];
// 第31回:「攻撃の 技（どの 職業でも）」の 組（ATTACK）と「体を 使う 技」（JUMP・32の 職業）は なくした

// 第27回: 新しい 職業（第26回の 20こと 暴れんぼう将軍）の 組。その 職業の 技（ひらめき技も）を ぜんぶ 入れる
const byJob = (...jobs) => Object.keys(ABILITIES).filter((id) => {
  const a = ABILITIES[id];
  return jobs.includes(a.job) && !a.hidden && (a.kind === 'skill' || a.kind === 'spell');
});
const DETECTIVE = byJob('shonen_tantei', 'oshiri_tantei', 'meitantei');
const SHADOW = byJob('black_org', 'assassin', 'spy');
const ROBOT = byJob('neko_robot', 'mimi_robot', 'doraemon');
const KAPPA = byJob('kappa', 'hanakappa', 'kinniku_kappa');
const RAKUTEN = byJob('rakuten_cardman');
const UESAMA = byJob('abarenbo_shogun', 'shogun');
const SAMURAI = byJob('samurai');
const SHINOBI = byJob('ninja', 'konoha', 'hokage');
const KISATSU = byJob('kisatsu', 'enbashira', 'hinokami');
const ESPER = byJob('esper');
const CREATOR = byJob('creator');
// 第29回: るろうに剣士 → 人斬りばっ刀さい → ひ村ばっ刀さい → 飛天御剣流けい承者
const HITEN = byJob('rurouni', 'hitokiri', 'himura', 'hiten');

// ───── 第31回: 職業に むすびつけた 組 ─────
// 上級職 いじょう（tier 1〜）の 職業の 技だけ（グランドフィナーレ）
const advanced = (list) => list.filter((id) => (JOBS[ABILITIES[id]?.job]?.tier || 0) >= 1);
const ATK_SPELLS = ELEM_SPELLS.filter((id) => ABILITIES[id]?.kind === 'spell');
const SWORD_ADV = advanced(SWORD);
const FIST_ADV = advanced(FIST);
const SPELL_ADV = advanced(ATK_SPELLS);
const HEAL_ADV = advanced(HEAL);
// せーのでジャンプ: 学校の 子・野球選手・おどる 人
const BALL_JOBS = byJob('ballplayer', 'major_leaguer', 'nitoryu');
const DANCE_JOBS = byJob('performer', 'jester', 'superstar', 'storm_idol');
// 家族会議の 4人目: 家に いる 人（ニート・ネコ型ロボット）
const HOME = [...new Set([...NEET, ...ROBOT])];
// なぞは すべて 解けた！の 4人目: 警察・スパイ・探てい
const SLEUTH = byJob('police', 'spy', 'shonen_tantei', 'oshiri_tantei', 'meitantei');
// ミナデイン: 勇者の 系統（勇者・ロトの勇者。魔王・はかい神は 入れない＝家族が 決めた）。のこりの 3人は だれでも よい（ANY は この 技だけ）
export const HERO_LINE_JOBS = ['hero', 'loto_hero'];
const HERO_LINE = byJob(...HERO_LINE_JOBS);
const ANY = byJob(...ALL_JOBS);
// 全員集合: 組は だれでも（4人の 職業の そろいかたは team: 'line' で 見る）
const LINE = [...ANY];

// 組の なまえ（メニューの 一覧で 見せる）
export const DUAL_GROUP_NAMES = new Map([
  [FIRE, '炎の呪文'], [ICE, '氷の呪文'], [WIND, '風の技'], [ELEM_SPELLS, '属性の技'], [SWORD, '剣の技'], [FIST, 'こぶしの技'], [MELEE, '剣かこぶしの技'],
  [HEAL, '回復の技'], [STAGE, 'おどり・歌・アイドルの技'], [RAIL, '鉄道員の技'], [JOBWORK, '大人の仕事の技'], [SCHOOL, '学校の技'], [COMEDY, 'お笑いか遊び人の技'],
  [KI, '気の技'], [GOMU, 'ゴムの技'], [OKAN, 'おかんの技'], [NEET, 'ニートの技'], [COOK, '料理の技'], [STORE, 'お店と会社の技'],
  [FACILITY, '設備の技'], [FACILITY_WORK, '設備か大人の仕事の技'], [MAOU, '魔王の技'], [HAKAI, 'はかい神の技'], [HOLY, '光か勇者の技'], [DARK, '闇の技'],
  [POLICE, '警察官の技'], [FIRE_DEPT, '消防士の技'], [RESCUE, '回復か守りの技'], [KIDS, '子ども（学校・ゲーム・配信）の技'],
  [BOSS, '上司の技'], [SALARY, '社ちくか会社員の技'], [KITCHEN, '料理かお店の技'], [STREAM, '配信の技'], [GAME, 'ゲームの技'],
  // 第27回
  [DETECTIVE, '探ていの技'], [SHADOW, 'スパイ・殺し屋・黒の組織の技'], [ROBOT, 'ネコ型ロボットの技'], [KAPPA, 'カッパの技'], [RAKUTEN, '楽天カードマンの技'],
  [UESAMA, '将軍の技'], [SAMURAI, 'サムライの技'], [SHINOBI, '忍びの技'], [KISATSU, 'きさつ隊の技'], [ESPER, '超能力の技'], [CREATOR, 'クリエイターの技'],
  // 第29回
  [HITEN, '飛天御剣流の技'],
  // 第31回
  [SWORD_ADV, '剣の上級職'], [FIST_ADV, 'こぶしの上級職'], [SPELL_ADV, '攻撃呪文の上級職'], [HEAL_ADV, 'いやしの上級職'],
  [BALL_JOBS, '野球の技'], [DANCE_JOBS, 'おどりの技'], [HOME, 'ニートかネコ型ロボットの技'], [SLEUTH, '警察・スパイ・探ていの技'],
  [HERO_LINE, '勇者の系統'], [ANY, 'どの職業でも'], [LINE, '4人とも同じ職業か同じ系統'],
]);
// ひとことで 言える 組（「〇〇の職業」と 言いかえない）
const PLAIN_NAMES = new Set([SWORD_ADV, FIST_ADV, SPELL_ADV, HEAL_ADV, HERO_LINE, ANY, LINE]);
// 職業が だれでも よい 組（ミナデインだけ）と、4人の そろいかたで 見る 組（全員集合）
export const ANY_GROUPS = new Set([ANY, LINE]);

// parts の type:
//   power … ダメージ（出す 人の ふつうの 技の 合計 × DUAL_POWER[人数] × k。kind: 'phys'（物理）/ 'magic'（呪文）。hits: 何回に 分けて 当てるか。
//           ignoreDef: 守りを むしする わりあい（物理の 見つもりに つかう）、status・debuff・dispel・banish: 当てた あとの 効果）
//   heal  … 仲間の 回復（さいだいHPの pct ＋ 出す 人の 回復の 技の 合計 × k）
//   revive … たおれた 仲間を 生き返らせる（さいだいHPの pct）
//   そのほか（buff・debuff・cure・atbSet・mpHeal・status）は ふつうの 技と おなじ
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
    parts: [{ type: 'buff', stats: ['atk', 'agi'], mult: 1.5, dur: 40 }, { type: 'heal', pct: 0.2, k: 0.3 }, { type: 'mpHeal', base: [3, 5] }],
    desc: '歌とおどりの大ステージ！仲間全員の攻撃力と素早さが大きく上がり、HPとMPも回復する。', anim: 'stage',
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
    name: 'せーのでジャンプ', kana: 'せーのでじゃんぷ', need: [SCHOOL, BALL_JOBS, DANCE_JOBS], mp: [6, 6, 6], target: 'enemies', funny: true,
    parts: [
      { type: 'power', kind: 'phys', k: 0.8, say: '「せーの！」3人がいっしょにジャンプして、ドスンと着地した！' },
      { type: 'atbSet', sub: 50, chance: 0.7, msg: '{t}はゆれでひっくり返った！', failMsg: '{t}はなんとかふんばった。' },
    ],
    desc: '「せーの！」学校の子と野球選手とおどる人が、いっしょにジャンプして地面をドスンとゆらす。敵全体にダメージをあたえて、ひっくり返す。', anim: 'quake',
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
      { type: 'buff', target: 'allies', stats: ['atk', 'agi'], mult: 1.4, dur: 40 }, { type: 'mpHeal', target: 'allies', base: [3, 6] },
    ],
    desc: '配信者とゲーマーとアイドルの、ゆめのコラボ配信！敵全体にコメントのあらし。仲間全員の攻撃力と素早さが上がり、MPも少し回復する。', anim: 'camera',
  },
  // ───────── 4人技 ─────────
  dt_zenin: {
    name: '全員集合', kana: 'ぜんいんしゅうごう', need: [LINE, LINE, LINE, LINE], team: 'line', mp: [10, 10, 10, 10], target: 'enemies', funny: true,
    parts: [{ type: 'power', kind: 'phys', k: 0.85, say: '「全員集合！」4人がいっせいにとびかかった！' }],
    desc: '「全員集合！」同じ職業か、同じ基本職から分かれた職業の4人が、いっせいに敵におそいかかる。敵全体に大ダメージ。', anim: 'hit_all',
  },
  dt_kazoku_kaigi: {
    name: '家族会議', kana: 'かぞくかいぎ', need: [OKAN, JOBWORK, KIDS, HOME], mp: [8, 8, 8, 8], target: 'enemies', funny: true,
    parts: [
      { type: 'buff', target: 'allies', stats: ['atk', 'def', 'agi'], mult: 1.5, dur: 45, say: '「では、今日の晩ごはんを決めます！」' },
      { type: 'status', status: 'sleep', chance: 0.8, turns: [2, 3], say: '話し合いが長すぎて…' },
      { type: 'heal', target: 'allies', pct: 0.3, k: 0.4 },
    ],
    desc: '「では、家族会議を始めます」おかん・仕事の大人・子ども・家にいる人がそろうと、話し合いがあまりに長くて、敵全体がねむってしまう。家族はまとまって、攻撃力・守備力・素早さが大きく上がり、HPも回復する。', anim: 'stage',
  },
  dt_finale: {
    name: 'グランドフィナーレ', kana: 'ぐらんどふぃなーれ', need: [SWORD_ADV, FIST_ADV, SPELL_ADV, HEAL_ADV], mp: [14, 14, 14, 14], target: 'enemy', element: 'light', weapon: [0, 'blade'],
    parts: [{ type: 'power', kind: 'magic', element: 'light', k: 1.1, hits: 4 }, { type: 'heal', target: 'allies', pct: 0.3, k: 0.4 }],
    desc: '剣・こぶし・攻撃呪文・いやし、それぞれの上級職の4人の力が1つの光になって、敵1体をつらぬく。とどめの大ダメージのあと、仲間全員のHPも回復する。', anim: 'holy',
  },
  // 第31回: きずな技だった ミナデインが 合体技に。勇者の 系統が 1人 いれば、のこりの 3人は だれでも よい（家族が 決めた れいがい）。
  // 合体技で いちばん 強い 敵1体の 雷（k 1.4 は 合体技で いちばん 大きい。ボスへは さいだいHPの 35%まで・MPも 多め。tools/sim-dual.mjs minadein）
  dt_minadein: {
    name: 'ミナデイン', kana: 'みなでいん', need: [HERO_LINE, ANY, ANY, ANY], mp: [20, 12, 12, 12], target: 'enemy', spell: true, element: 'bolt', bossCap: 0.35,
    parts: [{ type: 'power', kind: 'magic', element: 'bolt', k: 1.4, say: 'みんなの力が、1つの大きな雷になった！' }],
    desc: '勇者が天にかかげた手に、仲間みんなの力が集まる。勇者の系統の人が1人いれば、あとの3人はだれでもよい。敵1体に、合体技でいちばん強い雷をおとす。', anim: 'minadein',
  },
};

// ───────── 第27回: 新しい 職業と 前からの 職業の 合体技（10こ。2人技7・3人技2・4人技1） ─────────
// element: 'deduce' … 推理（敵 それぞれの いちばんの 弱点の 属性で 当たる。battle-dual.js）
// points … ポイントバック（当てた 敵の お金の points 倍が もらえる。楽天カード！と おなじ）
const R27_DUALS = {
  dt_hannin: {
    name: 'おまえが犯人だ！', kana: 'おまえがはんにんだ', need: [DETECTIVE, SHADOW], mp: [8, 8], target: 'enemy', funny: true,
    parts: [
      { type: 'power', kind: 'magic', element: 'deduce', k: 1.15, say: '「犯人は…おまえだ！」なぞの組織の仲間まで、思わずうなずいた！' },
      { type: 'debuff', stat: 'def', mult: 0.7, dur: 40, chance: 0.85 },
    ],
    desc: '名探ていが、ビシッと指をさす。「おまえが犯人だ！」敵1体のいちばんの弱点を見ぬいて大ダメージをあたえ、守備力も下げる。', anim: 'holy',
  },
  dt_nantoka: {
    name: 'なんとかしてよ〜！', kana: 'なんとかしてよ', need: [ROBOT, NEET], mp: [8, 6], target: 'enemies', funny: true,
    parts: [
      { type: 'power', kind: 'phys', k: 0.85, say: '「なんとかしてよ〜！」ポケットから、ひみつ道具が山ほど出てきた！' },
      { type: 'buff', target: 'allies', stat: 'agi', mult: 1.4, dur: 40 },
    ],
    desc: 'ニートに泣きつかれて、ロボットがポケットのひみつ道具を山ほど出す。敵全体に道具の雨がふりそそぎ、仲間全員の素早さも上がる。', anim: 'hit_all',
  },
  dt_kyuuri_zushi: {
    name: 'キュウリずし', kana: 'きゅうりずし', need: [KAPPA, COOK], mp: [6, 6], target: 'allies', funny: true,
    parts: [
      { type: 'heal', pct: 0.4, k: 0.5 }, { type: 'mpHeal', base: [6, 10] },
      { type: 'buff', stats: ['atk', 'def'], mult: 1.45, dur: 40, say: 'カッパは、キュウリまきを10本ぺろりと食べた！' },
    ],
    desc: 'カッパがとってきた、川の水でひやしたキュウリで、料理人がおすしをにぎる。仲間全員のHPとMPが回復して、攻撃力と守備力が大きく上がる。', anim: 'gohan',
  },
  dt_point10: {
    name: 'ポイント10倍デー', kana: 'ぽいんとじゅうばいでー', need: [RAKUTEN, OKAN], mp: [8, 6], target: 'enemies', funny: true,
    parts: [
      { type: 'power', kind: 'phys', k: 0.8, points: 1.2, say: '「今日はポイント10倍よ！」おかんの目の色が変わった！' },
      { type: 'mpHeal', target: 'allies', base: [6, 10] },
    ],
    desc: '「今日はポイント10倍デー！」おかんが楽天カードで買いまくる。敵全体にカードのあらし。当てた敵のお金がたくさんもらえて、仲間全員のMPも少し回復する。', anim: 'cards',
  },
  dt_nichirin: {
    name: '日輪の大ほのお', kana: 'にちりんのおおほのお', need: [KISATSU, FIRE], mp: [10, 10], target: 'enemy', element: 'fire',
    parts: [{ type: 'power', kind: 'phys', element: 'fire', k: 1.2, hits: 3 }],
    desc: '剣士の太刀に、仲間の炎の呪文をまとわせる。日輪のような大きなほのおで、敵1体に炎の大ダメージ。', anim: 'fire_tornado',
  },
  dt_nenriki_meteor: {
    name: 'ねん力メテオ', kana: 'ねんりきめてお', need: [ESPER, ELEM_SPELLS], mp: [10, 10], target: 'enemies', spell: true, element: 'blast',
    parts: [{ type: 'power', kind: 'magic', element: 'blast', k: 0.85, say: '空から、大きな岩がふってきた！' }],
    desc: '仲間の呪文で空の岩をくだき、ねん力で敵の上に落とす。敵全体に爆発の大ダメージ。', anim: 'meteor',
  },
  dt_okusuri: {
    name: 'おくすり手帳', kana: 'おくすりてちょう', need: [CREATOR, HEAL], mp: [10, 8], target: 'allies', funny: true,
    parts: [
      { type: 'revive', pct: 0.35 }, { type: 'heal', pct: 0.45, k: 0.6, say: '「おくすり手帳は、お持ちですか？」' },
      { type: 'cure', statuses: ['poison', 'sleep', 'confuse', 'paralyze', 'blind', 'silence'] },
    ],
    desc: 'いつものお薬が、手帳ですぐにわかる。たおれた仲間を生き返らせて、仲間全員のHPを大きく回復し、悪いじょうたいも治す。', anim: 'heal_ring',
  },
  dt_megumi: {
    name: 'め組の大立ち回り', kana: 'めぐみのおおたちまわり', need: [UESAMA, SAMURAI, SHINOBI], mp: [12, 10, 10], target: 'enemies',
    parts: [
      { type: 'power', kind: 'phys', k: 0.85, hits: 3, ignoreDef: 0.2, say: '町の火消し、め組もかけつけた！大立ち回りだ！' },
      { type: 'atbSet', sub: 40, chance: 0.6, msg: '{t}は、思わずひれふした！', failMsg: '{t}は、まだ向かってくる！' },
    ],
    desc: '上様とサムライと忍びが、町の火消しといっしょに大立ち回り。敵全体を何度も斬りつけて、ひれふさせることもある。', anim: 'slash_multi',
  },
  dt_hakkeyoi: {
    name: 'はっけよい、のこった！', kana: 'はっけよいのこった', need: [KAPPA, FIST, SCHOOL], mp: [8, 8, 8], target: 'enemies', funny: true,
    parts: [
      { type: 'power', kind: 'phys', k: 0.85, say: '「はっけよい、のこった！のこった！」' },
      { type: 'banish', chance: 0.3, msg: '{t}は、どひょうの外までおし出された！', failMsg: '{t}は、どひょうぎわでこらえた！' },
    ],
    desc: 'カッパのかけ声で、こぶしの強い人と学校の子が、みんなですもう！敵全体に体当たりして、どひょうの外までおし出してしまうこともある。', anim: 'quake',
  },
  // 4人技
  dt_nazo: {
    name: 'なぞはすべて解けた！', kana: 'なぞはすべてとけた', need: [DETECTIVE, KIDS, ROBOT, SLEUTH], mp: [12, 10, 10, 10], target: 'enemies',
    parts: [
      { type: 'power', kind: 'magic', element: 'deduce', k: 0.85, say: '探てい団バッジで、みんなの手がかりがつながった！' },
      { type: 'atbSet', sub: 40, chance: 0.6, msg: '{t}は、正体をあばかれて動けない！', failMsg: '{t}は、しらを切った！' },
    ],
    desc: '探ていとロボットと子どもたちと、警察かスパイが、手がかりを持ちよる。「なぞは、すべて解けた！」敵全体の、それぞれの弱点を見ぬいて大ダメージ。動きを止めることもある。', anim: 'holy',
  },
};
// ───────── 第29回: るろうに剣士の 道の 合体技（2こ。2人技1・3人技1。ぜんぶで 37こ） ─────────
const R29_DUALS = {
  dt_sentaku_biyori: {
    name: 'せんたく日和でござる', kana: 'せんたくびよりでござる', need: [HITEN, OKAN], mp: [6, 6], target: 'allies', funny: true,
    parts: [
      { type: 'heal', pct: 0.4, k: 0.5, say: '「せっしゃがあらうでござる」「ほら、もっとしっかりしぼりなさい！」' },
      { type: 'cure', statuses: ['poison', 'sleep', 'confuse', 'paralyze', 'blind', 'silence'] },
      { type: 'buff', stats: ['def', 'agi'], mult: 1.45, dur: 40 },
    ],
    desc: '剣士とおかんで、家じゅうの大せんたく。お日さまのにおいの服で、仲間全員のHPが回復して悪いじょうたいが治り、守備力と素早さが大きく上がる。', anim: 'heal_ring',
  },
  dt_sanken: {
    name: '天下無敵の三剣士', kana: 'てんかむてきのさんけんし', need: [HITEN, UESAMA, SAMURAI], mp: [12, 12, 10], target: 'enemies',
    parts: [
      { type: 'power', kind: 'phys', k: 0.95, hits: 3, ignoreDef: 0.3, say: '飛天御剣流と上様とサムライ、3つの剣が1つになった！' },
      { type: 'debuff', stat: 'def', mult: 0.75, dur: 40, chance: 0.7 },
    ],
    desc: '飛天御剣流の剣士と上様とサムライが、ならんで刀をぬく。敵全体を3回ずつ切りつける。守りの固い敵にもよく効き、守備力も下げる。', anim: 'slash_multi',
  },
};
// 2人技・3人技・4人技の じゅんに ならべる（第26回の 技の あとに）
{
  const all = { ...DUAL_TECHS, ...R27_DUALS, ...R29_DUALS };
  const ids = Object.keys(all).sort((a, b) => all[a].need.length - all[b].need.length);
  for (const id of Object.keys(DUAL_TECHS)) delete DUAL_TECHS[id];
  for (const id of ids) DUAL_TECHS[id] = all[id];
}

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

// 組を うけもてる 職業（その 組の 技を 持つ 職業）
const jobCache = new WeakMap();
export function groupJobs(list) {
  let s = jobCache.get(list);
  if (!s) jobCache.set(list, (s = new Set(list.map((id) => ABILITIES[id]?.job).filter((j) => JOBS[j]))));
  return s;
}

// 組を うけもてる 職業の 説明（メニュー・戦いの 説明の まど）。職業が 3つ までなら 職業の 名前、多い ときは「〇〇の職業」
export function groupJobText(list) {
  const nm = groupName(list);
  if (PLAIN_NAMES.has(list)) return nm;
  const jobs = [...groupJobs(list)];
  if (jobs.length && jobs.length <= 3) return jobs.map((j) => JOBS[j].name).join('・');
  return `${nm.replace(/の技$/, '')}の職業`;
}

// 合体技に 必要な 職業（組ごと。おなじ 組が つづく ときは「×3」。例:「勇者の系統＋どの職業でも×3」）
// short … たたかいの 説明の まど よう（組の 名前を みじかく。例:「おかん＋ニート＋子ども」）
export function dualNeedText(id, short = false) {
  const t = DUAL_TECHS[id];
  if (!t) return '';
  const out = [];
  for (const g of t.need) {
    const txt = short ? groupName(g).replace(/（.*）/, '').replace(/の技$/, '') : groupJobText(g);
    const last = out[out.length - 1];
    if (last && last.txt === txt) last.n++;
    else out.push({ txt, n: 1 });
  }
  return out.map((x) => (x.n > 1 ? `${x.txt}×${x.n}` : x.txt)).join('＋');
}

// 4人の 職業の そろいかた（全員集合）: みんな おなじ 職業 か、みんなに 共通の 基本職が ある（今の 職業の もとを たどる）
export function sameLine(jobs) {
  if (!jobs.length || jobs.some((j) => !JOBS[j])) return false;
  if (jobs.every((j) => j === jobs[0])) return true;
  return jobBases(jobs[0]).some((base) => jobs.every((j) => jobBases(j).includes(base)));
}

// その 人が 組を うけもてるか（今の 職業で 見る）
export function fitsGroup(who, list) {
  return !!who?.job && groupJobs(list).has(who.job);
}

// 組の 技で、その 人が 出す 技（えらぶ じゅん: 今の 職業の 覚えた 技 → 覚えた 技 → 今の 職業の 組の 技）。
// 合体技の 属性（クロス魔法剣など）と、説明の まどに 使う。who: { job, abilities, usable(id) }
function findSkill(who, list) {
  const set = groupSet(list);
  const ok = (id) => set.has(id) && (!who.usable || who.usable(id));
  const known = (who.abilities || []).filter(ok);
  return known.find((id) => ABILITIES[id]?.job === who.job) || known[0] || list.find((id) => ABILITIES[id]?.job === who.job) || null;
}

// 組を Set に（さがすのを はやく）
const setCache = new WeakMap();
function groupSet(list) {
  let s = setCache.get(list);
  if (!s) setCache.set(list, (s = new Set(list)));
  return s;
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
  // 全員集合: 4人の 職業の そろいかた
  if (t.team === 'line' && !sameLine(members.map((m) => m.job))) return null;
  for (const perm of PERMS[n]) {
    // perm[g] … 組 g を うけもつ 人
    let ok = true;
    for (let g = 0; g < n && ok; g++) {
      const m = members[perm[g]];
      if (!fitsGroup(m, t.need[g]) || (m.mp ?? 0) < t.mp[g]) ok = false;
      // 剣が いる 組
      else if (t.weapon && weaponOk && t.weapon[0] === g && !weaponOk({ weapon: t.weapon[1] }, m.weaponCat)) ok = false;
    }
    if (ok) return { who: perm, skills: perm.map((m, g) => findSkill(members[m], t.need[g])) };
  }
  return null;
}

// actor が 今 出せる 合体技
// actor・others: { id, name, job, alive, abilities, mp, atb, ready, queued, hold, statuses, weaponCat, usable(id) }
// もどりち: [{ id, size, partners: [相手の id], partner（1人め）, partnerName（「・」で つなぐ）, names, mine（actor の 組）,
//   skills: [組ごとの 技], who: [組ごとの 人の id], mp: [actor の MP, 相手の MP…（partners の じゅん）], element, now }]
//   2人技は いままでと おなじ 形（partner・mp[0]・mp[1]）
export function dualOptions(actor, others, weaponOk, { anyGauge = false } = {}) {
  const out = [];
  if (!actor || !actor.alive || !JOBS[actor.job]) return out;
  const free = others.filter((p) => p.id !== actor.id && partnerFree(p, anyGauge) && JOBS[p.job]);
  for (const [id, t] of Object.entries(DUAL_TECHS)) {
    const n = t.need.length;
    if (free.length < n - 1) continue;
    // 自分が どの 組にも 入れない 技は とばす（はやく する）
    if (!t.need.some((g) => fitsGroup(actor, g))) continue;
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
// 関係する … need の 組の どれにも、パーティーの 職業（stats.js の partyJobSet）が ある（「だれでも」の 組は いつも）
export function dualRelated(id, jobSet) {
  const t = DUAL_TECHS[id];
  if (!t) return false;
  return t.need.every((list) => ANY_GROUPS.has(list) || [...groupJobs(list)].some((j) => jobSet.has(j)));
}

// その 合体技の 効果を 知っているか（一度 使うと わかる。まとめる 前の 技を 使った ことが あっても わかる）
export function dualKnown(char, id) {
  const seen = char?.dualSeen;
  if (!seen) return false;
  return !!seen[id] || (LEGACY_OF[id] || []).some((old) => seen[old]);
}
