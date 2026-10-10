// 第4章「砂の海にしずむ星」の マップ
// コガネ地方（フィールド）・北の古井戸・かれた地下水路（Step 2）・王都サファラと 宮殿の地下水路（Step 3）・王家のピラミッド（Step 4）
// 村や ダンジョンの 形は south-rows.js・pyramid-rows.js（1文字 = 1マス）
import { T, TILE_INFO, parseRows } from '../tiles.js?v=0136232bcf56';
import { makeRng } from '../rng.js?v=0136232bcf56';
import { npc } from './npc.js?v=0136232bcf56';
import { SEA_PLACES } from './ch2.js?v=0136232bcf56';
import {
  buildSouth, southZoneAt, southAreaName, southWeatherAt, southBgmAt, SOUTH_PLACES, SOUTH_POS, SOUTH_LANDING, LANDING_BEACH, OASIS2, OASIS_CAMP,
  STORM_Y, STORM_FLAG, SAFARA_POS, PALACE_HALL, PYRAMID, PYRAMID_PLAZA, PYRAMID_POS, PYRAMID_FLAG,
  SOUTH_STORM_Y, SOUTH_STORM_FLAG, DUNA_GATE, DUNA_VALLEY,
} from './south.js?v=0136232bcf56';
import { HAMIL_ROWS, WELL_ROWS, CANAL1_ROWS, CANAL2_ROWS, CANAL3_ROWS, PALACE_CANAL_ROWS } from './south-rows.js?v=0136232bcf56';
import { PYR1_ROWS, PYR_B1_ROWS, PYR2_ROWS, PYR3_ROWS, PYR4_ROWS } from './pyramid-rows.js?v=0136232bcf56';
// Step 6: 砂の港ドゥナ・砂の古城・砂の海（maps/duna.js）
import { buildDunaMaps, DUNA_FLAG, DUNA_POS, DUNA_TOWN, DUNA_VALLEY_EXIT } from './duna.js?v=0136232bcf56';
// Step 7: 砂の底の神殿（maps/temple.js）
import { buildTempleMaps, TEMPLE_MAPS, STAR_FLAG, CLEAR4_FLAG } from './temple.js?v=0136232bcf56';

const HAM = SOUTH_PLACES.hamil;
const H = (x, y) => [HAM.x + x, HAM.y + y];
const SAF = SOUTH_PLACES.safara;
const S = (x, y) => [SAF.x + x, SAF.y + y];
const NIGHT = { all: ['@night'] };
const DAY = { not: ['@night'] };

// 大臣ザイードを たおした（Step 5。物語の すすみぐあい c4_zaid）: 中庭と 王の間の とびらの カギが あき、南の 砂嵐の 切れ目が 開く
export const ZAID_FLAG = SOUTH_STORM_FLAG;
// 砂の港ドゥナの 谷の 見張り（Step 5。門は 開けて くれない。ドゥナは Step 6）
export const DUNA_LOOKOUTS = [{ id: 'c4_d_lookout1', x: DUNA_GATE.x - 1, y: DUNA_GATE.y - 1 }, { id: 'c4_d_lookout2', x: DUNA_GATE.x + 1, y: DUNA_GATE.y - 1 }];

// 第4章の マップの ID（セーブに のこるので かえない）
export const CH4_MAPS = ['south', 'north_well', 'canal1', 'canal2', 'canal3', 'palace_canal',
  // Step 4: 王家のピラミッド（1階・地下・2階・3階・4階）
  'pyramid1', 'pyramid_b1', 'pyramid2', 'pyramid3', 'pyramid4',
  // Step 6: 砂の港ドゥナ（フィールド）・砂の古城（1階・2階）・砂の海（すなかぜ号で すすむ）
  'duna', 'sand_castle1', 'sand_castle2', 'sand_sea',
  // Step 7: 砂の底の神殿（空気のドーム・地下1階〜3階・水鏡の広間）
  ...TEMPLE_MAPS];
export const DUNA_MAPS = ['duna', 'sand_castle1', 'sand_castle2', 'sand_sea'];
export const PYRAMID_MAPS = ['pyramid1', 'pyramid_b1', 'pyramid2', 'pyramid3', 'pyramid4'];

// ───── 王家のピラミッド（Step 4）─────
// 1階の 歌の ボタン（石の 台）。わらべ歌の じゅん（太陽 → 砂 → 月 → 星）に おす。ならびは 左から 月・太陽・星・砂
// flag … 光った ボタン（しかけの フラグ。物語の すすみぐあいでは ない）。さいごの 星が 光ると 北の 石の とびらが 開く
export const PYR_BUTTONS = [
  { key: 'sun', name: '太陽', flag: 'c4_pb_sun', x: 13, y: 12, tile: T.BTN_SUN, on: T.BTN_SUN_ON },
  { key: 'sand', name: '砂', flag: 'c4_pb_sand', x: 21, y: 12, tile: T.BTN_SAND, on: T.BTN_SAND_ON },
  { key: 'moon', name: '月', flag: 'c4_pb_moon', x: 9, y: 12, tile: T.BTN_MOON, on: T.BTN_MOON_ON },
  { key: 'star', name: '星', flag: 'c4_pb_star', x: 17, y: 12, tile: T.BTN_STAR, on: T.BTN_STAR_ON },
];
export const PYR_BUTTON_FLAGS = PYR_BUTTONS.map((b) => b.flag);
// 4つ そろうと 開く 1階の 北の 石の とびら（さいごの 星の フラグ）
export const PYR_DOOR_FLAG = 'c4_pb_star';
// 3階の 近道の レバー（入り口 ⇔ まん中の へや・まん中の へや ⇔ 4階への かいだんの へや）
export const PYR_LEVERS = { l1: 'c4_pyr_l1', l2: 'c4_pyr_l2' };
// 4階の ひびの 入った かべ（かくしべや）・のろいの宝「王家の黄金の剣」を とった
export const PYR_CRACK_FLAG = 'c4_pyr_crack';
export const GOLD_SWORD_FLAG = 'c4_gold_sword';
// 金色の つぼ（のろいのつぼ が 化けている。たおすと 中の 宝が 手に入る）
export const PYR_POTS = { pot1: 'c4_pot1', pot2: 'c4_pot2' };
// ボタンを まちがえて おちる ところ（地下の まん中）・ありじごくに おちて 着く ところ（2階の 3階への かいだんの となりの 小べや）
export const PYR_FALL = { map: 'pyramid_b1', x: 12.5, y: 6.5 };
export const PYR_LANDING = { map: 'pyramid2', x: 16.5, y: 3.5 };
// 階の 出入り口（ワープの マス）
export const PYR_STAIRS = {
  exit1: { x: 15, y: 25 }, up1: { x: 15, y: 3 }, hole1: { x: 27, y: 14 }, upB1: { x: 22, y: 6 },
  down2: { x: 5, y: 23 }, up2: { x: 26, y: 1 }, down3: { x: 5, y: 25 }, up3: { x: 28, y: 1 }, down4: { x: 13, y: 19 },
};
// 4階の 王のへや（ミイラの王アンク・王の 台）と かくしべやの 剣
export const PYR4_POS = { anku: { x: 13, y: 5 }, altar: { x: 13, y: 1 }, mirror: { x: 13, y: 2 }, crack: { x: 7, y: 15 }, sword: { x: 3, y: 14 } };

// ───── 王都サファラ（Step 3）─────
// 子どもたちの わらべ歌（1人 1行。ピラミッドの ボタンの じゅん: 太陽 → 砂 → 月 → 星）
export const SONG_FLAGS = ['c4_song_sun', 'c4_song_sand', 'c4_song_moon', 'c4_song_star'];
// 宮殿の地下水路の 階段（町の 南西の 入り口から 来る ところ・中庭の 古井戸の 下）
export const PALACE_CANAL_STAIRS = { town: { x: 5, y: 23 }, court: { x: 30, y: 2 } };

// ───── かれた地下水路（Step 2）─────
// 入り口（フィールド。村の 南東）: 鉄の こうしは 村長ナディムに たのまれると（c4_canal）開く
export const CANAL_DOOR = { x: SOUTH_POS.canal.x, y: SOUTH_POS.canal.y - 1 };
export const CANAL_FLAG = 'c4_canal';
// 水門の レバー（フラグは しかけの もの。ものがたりの すすみぐあいでは ない）
export const CANAL_LEVERS = { c1: 'c4_cn1', c2a: 'c4_cn2a', c2b: 'c4_cn2b' };
// よろい大サソリを たおすと せきが くずれて、水路と 村の オアシスに 水が もどる
export const SCORPION_FLAG = STORM_FLAG;

// ルーラ・帰り道の羽で 行ける 第4章の 町と 村（ハミルは 村の 東の 門の 外・王都は 北の 門の 外に おりる）
export const SOUTH_TOWNS = {
  hamil: { name: HAM.name, map: 'south', x: HAM.x + HAM.w + 1, y: HAM.y + 9, rect: [HAM.x, HAM.y, HAM.w, HAM.h] },
  safara: { name: SAF.name, map: 'south', x: SAFARA_POS.gate.x, y: SAF.y - 2, rect: [SAF.x, SAF.y, SAF.w, SAF.h] },
  // Step 6: 砂の港ドゥナ（北の 門の 外の 谷に おりる）
  duna: { name: DUNA_TOWN.name, map: 'duna', x: DUNA_POS.gate.x, y: DUNA_TOWN.y - 2, rect: [DUNA_TOWN.x, DUNA_TOWN.y, DUNA_TOWN.w, DUNA_TOWN.h] },
};
Object.assign(SEA_PLACES, SOUTH_TOWNS);

// つぼ・たるを 調べた ときの 素材
export function ch4SearchMats(mapId) {
  if (mapId === 'south') return ['beast_fang', 'magic_powder', 'wind_feather'];
  if (mapId === 'north_well') return ['magic_powder', 'iron_shard'];
  if (mapId.startsWith('canal') || mapId === 'palace_canal') return ['magic_powder', 'iron_shard', 'pretty_shell'];
  if (mapId.startsWith('pyramid')) return ['magic_powder', 'silver_shard', 'star_shard'];
  // Step 6: 砂の港ドゥナ（港の たる・箱）と 砂の古城
  if (mapId === 'duna') return ['pretty_shell', 'beast_fang', 'wind_feather'];
  if (mapId.startsWith('sand_castle')) return ['silver_shard', 'magic_powder', 'iron_shard'];
  // Step 7: 砂の底の神殿（ドームの つぼ）
  if (mapId.startsWith('temple_')) return ['pretty_shell', 'silver_shard', 'magic_powder'];
  return null;
}

// きらきら（コガネ地方）の 中み
export const SOUTH_SPARKLE_LOOT = {
  s_coast: [['herb', 3], ['moonherb', 2], ['star_shard', 3], ['pretty_shell', 2], ['seed_agi', 0.4]],
  s_dune: [['herb', 3], ['moonherb', 2], ['star_shard', 3], ['magic_powder', 2], ['seed_str', 0.4]],
  s_oasis: [['moonherb', 3], ['star_shard', 3], ['magic_water', 0.6], ['seed_mag', 0.4]],
};

// ───────────── コガネ地方 ─────────────
const SOUTH_NPCS = [
  // オアシスの村ハミル
  npc('nadim', '村長ナディム', H(6, 4), 'desert_elder', 'c4_nadim'),
  npc('c4_h_priest', '神父さま', H(23, 4), 'desert_priest', 'church'),
  npc('c4_h_inn', '宿屋のおかみ', H(3, 11), 'desert_f', 'c4_inn_hamil'),
  npc('c4_h_shop', 'よろず屋のおじさん', H(24, 11), 'desert_merchant', 'c4_shop_hamil'),
  // アミの お母さん（アミが 帰るまでは 北の 門で 待っている）
  npc('ami_mom_gate', 'アミのお母さん', H(16, 2), 'desert_f2', 'c4_ami_mom', { show: { not: ['c4_ami'] }, dir: 'up' }),
  npc('ami_mom', 'アミのお母さん', H(5, 19), 'desert_f2', 'c4_ami_mom', { show: { all: ['c4_ami'] } }),
  npc('ami', 'アミ', H(6, 22), 'ami', 'c4_ami', { show: { all: ['c4_ami'] }, wander: 1 }),
  npc('c4_h_guard', '村の見張り', H(28, 8), 'desert_m', 'c4_h_guard', { dir: 'left' }),
  npc('c4_h_oldman', '物知りのおじいさん', H(12, 8), 'desert_m2', 'c4_h_oldman', { wander: 1 }),
  npc('c4_h_woman', '水くみのおくさん', H(20, 15), 'desert_f', 'c4_h_woman', { dir: 'left' }),
  npc('c4_h_kid', 'アミの友だちのカリム', H(10, 20), 'desert_kid', 'c4_h_kid', { wander: 1, show: { not: ['@night'] } }),
  npc('c4_h_man', '井戸ほりのおじさん', H(17, 21), 'desert_m', 'c4_h_man', { dir: 'up' }),
  // 夜だけ: 広場で 月を 見る 旅人（夜の 砂ばくの 魔物の 話）
  npc('c4_n_watcher', '月を見る旅人', H(15, 16), 'caravan', 'c4_n_watcher', { show: { all: ['@night'] }, dir: 'up' }),

  // フィールド
  npc('c4_beach_trader', '旅の商人', [64, 9], 'caravan', 'c4_beach_trader', { wander: 1 }),
  npc('c4_camp_leader', 'キャラバンのかしら', [OASIS_CAMP.x + 3, OASIS_CAMP.y + 3], 'desert_merchant', 'c4_camp_leader', { dir: 'down' }),
  npc('c4_camp_kid', 'キャラバンの子ども', [OASIS_CAMP.x + 9, OASIS_CAMP.y + 9], 'desert_kid', 'c4_camp_kid', { wander: 1 }),
  // キャラバンの ラクダ
  npc('c4_camel1', 'ラクダ', [OASIS_CAMP.x + 2, OASIS_CAMP.y + 8], 'camel', 'c4_camel', { dir: 'right' }),
  npc('c4_camel2', 'ラクダ', [OASIS_CAMP.x + 8, OASIS_CAMP.y + 4], 'camel', 'c4_camel', { dir: 'left' }),
  npc('c4_camel3', 'ラクダ', [62, 9], 'camel', 'c4_camel', { dir: 'right' }),

  // ───── 王都サファラ（Step 3）─────
  // 北の 門
  npc('c4_s_gate1', '門番', S(23, 1), 'safara_guard', 'c4_s_gate', { dir: 'down' }),
  npc('c4_s_gate2', '門番', S(27, 1), 'safara_guard', 'c4_s_gate2', { dir: 'down' }),
  // 井戸の 行列（井戸に 向かって 東から ならぶ。夜は 少し へる）
  npc('c4_s_q1', '井戸の列のおばさん', S(14, 11), 'desert_f', 'c4_s_q1', { dir: 'left' }),
  npc('c4_s_q2', '井戸の列のおじいさん', S(15, 11), 'desert_m2', 'c4_s_q2', { dir: 'left' }),
  npc('c4_s_maid', '女官のジャミラ', S(16, 11), 'maid', 'c4_s_maid', { dir: 'left' }),
  npc('c4_s_q3', '井戸の列の男', S(17, 11), 'desert_m', 'c4_s_q3', { dir: 'left', show: DAY }),
  npc('c4_s_q4', '井戸の列のむすめ', S(18, 11), 'desert_f2', 'c4_s_q4', { dir: 'left', show: DAY }),
  // 宿屋・教会
  npc('c4_s_inn', '宿屋の主人', S(4, 5), 'desert_merchant', 'c4_inn_safara', { dir: 'down' }),
  npc('c4_s_innguest', '旅の商人', S(9, 6), 'caravan', 'c4_s_innguest', { dir: 'left' }),
  npc('c4_s_priest', '神父さま', S(17, 3), 'desert_priest', 'church', { dir: 'down' }),
  // 市場の 屋台（店の 人は カウンターの 北）・武器と防具の店
  npc('c4_s_fruit', 'くだもの売り', S(30, 3), 'desert_merchant', 'c4_s_fruit', { dir: 'down' }),
  npc('c4_s_item', '道具屋のおばさん', S(35, 3), 'desert_f', 'c4_shop_safara_item', { dir: 'down' }),
  npc('c4_s_rug', 'じゅうたん売り', S(30, 7), 'caravan', 'c4_s_rug', { dir: 'down' }),
  npc('c4_s_pot', 'つぼ売り', S(35, 7), 'desert_m2', 'c4_s_pot', { dir: 'down' }),
  npc('c4_s_weapon', '武器屋のおやじ', S(41, 4), 'desert_m', 'c4_shop_safara_weapon', { dir: 'down' }),
  npc('c4_s_armor', '防具屋のおねえさん', S(46, 4), 'desert_f2', 'c4_shop_safara_armor', { dir: 'down' }),
  // 水の神殿（守り星の 台座は からっぽ）
  npc('c4_s_apprentice', 'みこ見習いのリタ', S(8, 24), 'w_priestess', 'c4_s_apprentice', { dir: 'left' }),
  npc('c4_s_pray', 'いのる女の人', S(5, 19), 'desert_f2', 'c4_s_pray', { dir: 'down' }),
  // Step 7: 第4章クリアの あとは、水のみこミラが 水の神殿に もどり、台座に 水の守り星が かがやく
  npc('mira_temple', '水のみこミラ', S(5, 22), 'mira', 'c4_mira_temple', { dir: 'down', show: { all: [CLEAR4_FLAG] } }),
  npc('water_star_altar', '水の守り星', S(6, 24), 'water_star', 'c4_s_pedestal', { dir: 'down', solid: false, show: { all: [CLEAR4_FLAG] } }),
  // 宮殿の 前の 広場
  npc('c4_s_oldman', '物知りのおじいさん', S(21, 19), 'desert_elder', 'c4_s_oldman', { wander: 1 }),
  npc('c4_p_gate1', '宮殿の門番', S(24, 21), 'palace_guard', 'c4_p_gate', { show: DAY }),
  npc('c4_p_gate2', '宮殿の門番', S(26, 21), 'palace_guard', 'c4_p_gate', { show: DAY }),
  // 夜は 宮殿の 門が しまる（夜番の 兵士）
  npc('c4_p_ngate1', '宮殿の夜番', S(24, 21), 'palace_guard', 'c4_p_ngate', { show: NIGHT }),
  npc('c4_p_ngate2', '宮殿の夜番', S(26, 21), 'palace_guard', 'c4_p_ngate', { show: NIGHT }),
  // 宮殿の 王の間（女王ネフィ・大臣ザイード）。夜は 女王も 大臣も 兵士も いない（夜の 王の間の 2人は Step 5 の イベントの 役者）。
  // 大臣ザイードを たおした あとは、夜も 女王が 王の間に いる（nefi_night）
  npc('nefi', '女王ネフィ', S(25, 25), 'nefi', 'c4_nefi', { dir: 'down', show: DAY }),
  npc('nefi_night', '女王ネフィ', S(25, 25), 'nefi', 'c4_nefi', { dir: 'down', show: { all: ['@night', ZAID_FLAG] } }),
  npc('zaid', '大臣ザイード', S(27, 25), 'zaid', 'c4_zaid', { dir: 'down', show: { not: ['@night', ZAID_FLAG] } }),
  npc('c4_p_guard1', '宮殿の兵士', S(21, 26), 'palace_guard', 'c4_p_guard', { dir: 'right', show: DAY }),
  npc('c4_p_guard2', '宮殿の兵士', S(29, 26), 'palace_guard', 'c4_p_guard', { dir: 'left', show: DAY }),
  npc('c4_p_maid', '女官のハラ', S(19, 28), 'maid', 'c4_p_maid', { wander: 1, show: DAY }),
  // 学者ハサンの 家・闘技場
  npc('hassan', '学者ハサン', S(41, 19), 'hassan', 'c4_hassan', { dir: 'down' }),
  npc('c4_s_arena', '闘技場の受付', S(43, 30), 'arena_clerk', 'c4_s_arena', { dir: 'left' }),
  npc('c4_s_fighter', '力じまんの戦士', S(41, 27), 'fighter', 'c4_s_fighter', { wander: 1 }),
  // 宮殿の地下水路の 入り口の 水路番
  npc('c4_s_canalman', '水路番のおじいさん', S(9, 33), 'desert_m2', 'c4_s_canalman', { dir: 'left' }),
  // 南の 門の 門番（Step 5。南の 砂嵐と 砂の港ドゥナの 話）
  npc('c4_s_sgate', '南の門の門番', S(12, 38), 'safara_guard', 'c4_s_sgate', { dir: 'right' }),
  // わらべ歌を 歌う 子どもたち（1人 1行。夜は 家に 帰る）
  npc('c4_kid_sun', 'アリ', S(23, 6), 'desert_kid', 'c4_kid_sun', { wander: 1, show: DAY }),
  npc('c4_kid_sand', 'ライラ', S(32, 10), 'desert_girl', 'c4_kid_sand', { wander: 1, show: DAY }),
  npc('c4_kid_moon', 'サミル', S(13, 18), 'desert_kid2', 'c4_kid_moon', { wander: 1, show: DAY }),
  npc('c4_kid_star', 'ナジャ', S(29, 19), 'desert_girl2', 'c4_kid_star', { wander: 1, show: DAY }),
  // 夜だけ: 夜回りの 兵士（宮殿の地下水路の ヒント）
  npc('c4_n_watch', '夜回りの兵士', S(25, 12), 'safara_guard', 'c4_n_watch', { show: NIGHT, wander: 1 }),

  // ───── 王家のピラミッド（Step 4）─────
  // オベリスク（大きな 石の 柱。影は お日さまの むきで のびる）・広場で 待っている 学者の 弟子（ハサンの なぞを 聞いた あと）
  npc('obelisk', 'オベリスク', [PYRAMID_POS.obelisk.x, PYRAMID_POS.obelisk.y], 'obelisk', 'c4_obelisk', { dir: 'down' }),
  npc('c4_p_student', '学者の弟子のユスフ', [PYRAMID_PLAZA.x + 4, PYRAMID_PLAZA.y + 6], 'desert_kid2', 'c4_p_student', { dir: 'right', show: { all: ['c4_hassan'] } }),

  // ───── 砂の港ドゥナへの 谷（Step 5）: 砂の海賊の 見張り（門は 開けて くれない。ドゥナは Step 6）─────
  ...DUNA_LOOKOUTS.map((p, i) => npc(p.id, '砂の海賊の見張り', [p.x, p.y], i ? 'sand_pirate2' : 'sand_pirate', 'c4_d_lookout', { dir: 'down' })),
];

// 宝箱（フィールドの 宝箱は 開けると きえる）
const SOUTH_CHESTS = [
  { id: 's_beach', x: 92, y: 8, item: 'moonherb', n: 2 },
  { id: 's_west', x: 6, y: 40, item: 'sand_cloak' },
  { id: 's_oasis2', x: OASIS2.x + 5, y: OASIS2.y + 2, item: 'seed_agi' },
  { id: 's_dune', x: 126, y: 20, gold: 600 },
  { id: 's_wellside', x: 6, y: 16, item: 'magic_water' },
  { id: 's_storm', x: 7, y: 55, item: 'revive_flower' },
];

// かんばん
const SOUTH_SIGNS = [
  { x: 69, y: 12, text: 'ここはコガネ地方の北の海辺。\n↙ オアシスの村ハミル\n↘ 小さなオアシス' },
  { x: HAM.x + HAM.w + 2, y: HAM.y + 7, text: 'オアシスの村ハミル' },
  { x: SOUTH_POS.well.x + 3, y: SOUTH_POS.well.y + 3, text: '北の古井戸\n（水がかれて、今はだれも使っていない）' },
  { x: 34, y: 56, text: 'この先、砂嵐のかべ。\n風がおさまるまで、通りぬけることはできない。' },
  { x: CANAL_DOOR.x - 3, y: CANAL_DOOR.y + 1, text: '王国の地下水路\n（王都サファラから、ハミルの村へ水を運ぶ水路）' },
  // 王都サファラ（Step 3）
  { x: 34, y: 66, text: '↓ 王都サファラ' },
  { x: SAF.x + 21, y: SAF.y - 1, text: 'ここは王都サファラ。\n砂の国の女王さまがおられる、水の都。' },
  { x: SAF.x + 8, y: SAF.y + 33, text: '宮殿の地下水路\n（宮殿の水を町へ流していた水路。\n　水がかれて、今は使われていない）' },
  { x: SAF.x + 40, y: SAF.y + 33, text: 'サファラ闘技場\n「水がもどるまで、大会はお休みします」' },
  // 王家のピラミッド（Step 4）
  { x: PYRAMID_PLAZA.x + 1, y: PYRAMID_PLAZA.y + 2, text: '王家のピラミッド\n「王のねむりを、さまたげることなかれ」' },
  // 南の 門の 外・ドゥナへの 谷（Step 5）
  { x: SAFARA_POS.southGate.x - 2, y: SAFARA_POS.southGate.y + 2, text: '↓ 南の砂嵐のかべ\nその先に、砂の港ドゥナ' },
  { x: DUNA_GATE.x - 3, y: DUNA_GATE.y - 2, text: 'この先、砂の港ドゥナ\n「王国の者、立ち入るべからず　砂の海賊」' },
];

// お店の かんばん（入り口の よこの かべ）
const NB = ([x, y], kind, name) => ({ x, y, kind, name });
const SOUTH_BOARDS = [
  NB(H(4, 15), 'inn', '宿屋'), NB(H(25, 14), 'general', 'よろず屋'), NB(H(22, 7), 'church', '教会'),
  // 王都サファラ
  NB(S(7, 9), 'inn', '宿屋'), NB(S(18, 8), 'church', '教会'), NB(S(44, 9), 'arms', '武器と防具の店'),
  NB(S(7, 15), 'temple', '水の神殿'), NB(S(26, 22), 'palace', '宮殿'), NB(S(42, 24), 'arena', '闘技場'), NB(S(43, 16), 'scholar', '学者ハサンの家'),
];

// やね
const SOUTH_ROOFS = [
  ...[[2, 2, 9, 7, 'sand'], [19, 2, 9, 6, 'clay'], [2, 10, 8, 6, 'clay'], [21, 10, 7, 5, 'canvas'], [2, 18, 6, 4, 'sand'], [22, 18, 6, 4, 'sand']]
    .map(([x, y, w, h, color]) => ({ x: HAM.x + x, y: HAM.y + y, w, h, color })),
  // 王都サファラ: 宿屋・教会・武器と防具の店・水の神殿・学者の家・闘技場（中庭は 空が 見える）
  ...[[2, 2, 10, 8, 'clay'], [14, 2, 8, 7, 'white'], [39, 2, 10, 8, 'canvas'], [1, 15, 12, 13, 'teal'], [39, 16, 7, 6, 'sand'], [39, 24, 11, 14, 'clay']]
    .map(([x, y, w, h, color]) => ({ x: SAF.x + x, y: SAF.y + y, w, h, color })),
  // 宮殿の 王の間
  { ...PALACE_HALL, color: 'blue' },
];

// 地図に 出す なまえ
const SOUTH_LABELS = [
  ...Object.values(SOUTH_PLACES).map((p) => ({ name: p.name, x: p.x, y: p.y, w: p.w, h: p.h })),
  { name: LANDING_BEACH.name, x: LANDING_BEACH.x, y: LANDING_BEACH.y, w: LANDING_BEACH.w, h: LANDING_BEACH.h },
  { name: '北の古井戸', x: SOUTH_POS.well.x - 6, y: SOUTH_POS.well.y - 4, w: 12, h: 6 },
  { name: '小さなオアシス', x: OASIS_CAMP.x, y: OASIS_CAMP.y, w: OASIS_CAMP.w, h: OASIS_CAMP.h },
  { name: 'かれた地下水路', x: CANAL_DOOR.x - 5, y: CANAL_DOOR.y - 4, w: 11, h: 5 },
  { name: 'コガネ砂丘', x: 60, y: 30, w: 70, h: 24 },
  { name: '砂嵐のかべ', x: 8, y: STORM_Y[0] - 1, w: 128, h: STORM_Y[1] - STORM_Y[0] + 3 },
  { name: PYRAMID.name, x: PYRAMID.x, y: PYRAMID.y, w: PYRAMID.w, h: PYRAMID.h },
  // Step 5
  { name: '南の砂嵐', x: 8, y: SOUTH_STORM_Y[0] - 1, w: 80, h: SOUTH_STORM_Y[1] - SOUTH_STORM_Y[0] + 3 },
  { name: '南の砂ばく', x: 50, y: SOUTH_STORM_Y[1] + 3, w: 36, h: 9 },
  { name: DUNA_VALLEY.name, x: DUNA_VALLEY.x, y: DUNA_VALLEY.y, w: DUNA_VALLEY.w, h: DUNA_VALLEY.h },
];

// きらきら（ひろえる 物）。砂ばく・海辺・オアシスの まわり（砂嵐のかべより 北）
const SPARKLE_GROUND = new Set([T.DESERT, T.SAND, T.GRASS, T.TALLGRASS, T.DIRT]);
function southSparkles(m) {
  const rng = makeRng(4404);
  const list = [];
  let tries = 0;
  while (list.length < 18 && tries++ < 8000) {
    const x = rng.int(4, m.w - 5), y = rng.int(4, STORM_Y[0] - 3);
    if (!SPARKLE_GROUND.has(m.tiles[y * m.w + x]) || m.gateAt?.has(y * m.w + x)) continue;
    const z = southZoneAt(x, y);
    if (z.startsWith('safe')) continue;
    if (list.some((s) => Math.abs(s.x - x) + Math.abs(s.y - y) < 12)) continue;
    list.push({ id: 'ssp' + list.length, x, y, zone: z });
  }
  return list;
}

// 地下水路の 入り口（砂岩の 岩の 中に 石の 門。こうしの 下が 階段）と、村の オアシスの 水
function canalEntrance(sb) {
  const set = (x, y, v) => { sb.tiles[y * sb.w + x] = v; };
  const { x: dx, y: dy } = CANAL_DOOR;
  for (let y = dy - 3; y <= dy; y++) {
    for (let x = dx - 2; x <= dx + 2; x++) set(x, y, Math.abs(x - dx) === 2 || y === dy - 3 ? T.SANDSTONE : T.CANAL_WALL);
  }
  set(dx, dy, T.GRATE);
  sb.gates.push({ x: dx, y: dy, closed: T.GRATE, open: T.STAIRS_DOWN, flag: CANAL_FLAG });
  // 門の 前は 歩ける 砂（岩・サボテンを どける）
  for (let y = dy + 1; y <= dy + 2; y++) for (let x = dx - 1; x <= dx + 1; x++) set(x, y, T.DESERT);
}
// よろい大サソリを たおすと、オアシスの かわいた どろ（水ぎわ）に 水が もどる
function oasisRefill(sb) {
  const out = [];
  HAMIL_ROWS.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== '=' || x < 11 || x > 18 || y < 10 || y > 16) return;
    const [gx, gy] = H(x, y);
    sb.gates.push({ x: gx, y: gy, closed: T.DIRT, open: T.WATER, flag: SCORPION_FLAG });
    out.push([gx, gy]);
  }));
  return out;
}

// 水の守り星を 取りもどす（Step 7。c4_star）と、ハミルの オアシスの まわりに 緑が もどり、王都の ふん水から 水が ふき上がる
export const GREEN_FLAG = STAR_FLAG;
function oasisGreen(sb) {
  const out = [];
  HAMIL_ROWS.forEach((row, y) => [...row].forEach((ch, x) => {
    // オアシスの まわりの 広場（;）は 草に、村の 砂ばく（0）の ところどころに 花
    const plaza = ch === ';' && x >= 10 && x <= 19 && y >= 10 && y <= 16;
    const flower = ch === '0' && (x * 7 + y * 3) % 5 === 0;
    if (!plaza && !flower) return;
    const [gx, gy] = H(x, y);
    const open = plaza ? ((x + y) % 4 ? T.GRASS : T.FLOWERS) : T.TOWN_FLOWERS;
    sb.gates.push({ x: gx, y: gy, closed: sb.tiles[gy * sb.w + gx], open, flag: GREEN_FLAG });
    out.push([gx, gy]);
  }));
  return out;
}
function fountainFlow(sb) {
  const F = SAFARA_POS.fountain;
  for (let y = F.y - 1; y <= F.y + 1; y++) for (let x = F.x - 1; x <= F.x + 1; x++) sb.gates.push({ x, y, closed: T.DRY_FOUNTAIN, open: T.FULL_FOUNTAIN, flag: GREEN_FLAG });
}

function buildField() {
  const sb = buildSouth();
  canalEntrance(sb);
  const refill = oasisRefill(sb);
  oasisGreen(sb);
  fountainFlow(sb);
  for (const s of SOUTH_SIGNS) sb.tiles[s.y * sb.w + s.x] = T.SIGN;
  // 砂嵐のかべを しらべると だいほん（道の ところ）
  const actions = [];
  for (const g of sb.gates) if (g.flag === STORM_FLAG && g.y === STORM_Y[0]) actions.push({ x: g.x, y: g.y, script: 'c4_sandstorm_wall', show: { not: [STORM_FLAG] } });
  // 村の かれかけた 井戸・オアシス
  actions.push({ x: H(17, 19)[0], y: H(17, 19)[1], script: 'c4_dry_well' });
  // オアシスの 水（ふちの かわいた どろに 立って しらべる）
  const dry = (x, y) => HAMIL_ROWS[y]?.[x] === '=';
  for (let y = 11; y <= 15; y++) for (let x = 11; x <= 18; x++) {
    if (HAMIL_ROWS[y][x] !== '~' || ![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => dry(x + dx, y + dy))) continue;
    const [ax, ay] = H(x, y);
    actions.push({ x: ax, y: ay, script: 'c4_oasis_water' });
  }
  // 水が もどった あとの 水ぎわ（もとの かわいた どろ）
  for (const [ax, ay] of refill) actions.push({ x: ax, y: ay, script: 'c4_oasis_water', show: { all: [SCORPION_FLAG] } });
  // 地下水路の 入り口の 鉄の こうし（開く まで）
  actions.push({ x: CANAL_DOOR.x, y: CANAL_DOOR.y, script: 'c4_canal_grate', show: { not: [CANAL_FLAG] } });
  // 王都サファラ（Step 3）: かれた ふん水・守り星の 台座・町の 井戸・中庭の 水がめ と ベンチ と とびら・闘技場の 門
  const P = SAFARA_POS;
  // ふん水（3×3）は まわりの 8マスで しらべる
  for (let y = P.fountain.y - 1; y <= P.fountain.y + 1; y++) {
    for (let x = P.fountain.x - 1; x <= P.fountain.x + 1; x++) if (x !== P.fountain.x || y !== P.fountain.y) actions.push({ x, y, script: 'c4_s_fountain' });
  }
  for (const dx of [0, 1]) actions.push({ x: P.pedestal.x + dx, y: P.pedestal.y, script: 'c4_s_pedestal' });
  actions.push({ x: P.well.x, y: P.well.y, script: 'c4_s_well' });
  actions.push({ x: P.jar.x, y: P.jar.y, script: 'c4_court_jar' });
  actions.push({ x: P.bench.x, y: P.bench.y, script: 'c4_court_diary' });
  // 中庭と 王の間の とびら（Step 5: 夜に 月の鏡で てらすと 大臣の イベント。ザイードを たおすと カギが あく）
  actions.push({ x: P.courtDoor.x, y: P.courtDoor.y, script: 'c4_court_door', show: { not: [ZAID_FLAG] } });
  sb.gates.push({ x: P.courtDoor.x, y: P.courtDoor.y, closed: T.LOCKED_DOOR, open: T.DOOR, flag: ZAID_FLAG });
  // 南の 砂嵐（Step 5）: 道の ところを しらべると だいほん（大臣ザイードを たおすまで）
  for (const g of sb.gates) if (g.flag === SOUTH_STORM_FLAG && g.y === SOUTH_STORM_Y[0]) actions.push({ x: g.x, y: g.y, script: 'c4_south_storm', show: { not: [SOUTH_STORM_FLAG] } });
  // ドゥナへの 谷の 木の さくと 門（Step 5 では 開かない。Step 6 で 見張りが 開けると c4_duna。門の マスは 道に なる）
  for (let x = DUNA_GATE.x - 3; x <= DUNA_GATE.x + 3; x++) {
    const tile = sb.tiles[DUNA_GATE.y * sb.w + x];
    if (tile === T.FENCE) actions.push({ x, y: DUNA_GATE.y, script: 'c4_duna_fence' });
    if (tile === T.LOCKED_DOOR) actions.push({ x, y: DUNA_GATE.y, script: 'c4_duna_fence', show: { not: [DUNA_FLAG] } });
  }
  sb.gates.push({ x: DUNA_GATE.x, y: DUNA_GATE.y, closed: T.LOCKED_DOOR, open: T.DIRT, flag: DUNA_FLAG });
  actions.push({ x: P.arenaGate.x, y: P.arenaGate.y, script: 'c4_arena_gate' });
  // 王家のピラミッド（Step 4）: 日時計の とびら（開く まで）
  const D = PYRAMID_POS.door;
  actions.push({ x: D.x, y: D.y, script: 'c4_pyr_door', show: { not: [PYRAMID_FLAG] } });
  const wl = SOUTH_POS.well;
  const m = {
    id: 'south', name: 'コガネ地方', kind: 'field', bgm: 'desert', dark: false,
    w: sb.w, h: sb.h, tiles: sb.tiles, gates: sb.gates,
    npcs: SOUTH_NPCS, chests: SOUTH_CHESTS, signs: SOUTH_SIGNS, boards: SOUTH_BOARDS, actions,
    warps: [
      { x: wl.x, y: wl.y, to: { map: 'north_well', x: 4.5, y: 2.6, dir: 'down' } },
      { x: CANAL_DOOR.x, y: CANAL_DOOR.y, to: { map: 'canal1', x: 14.5, y: 20.4, dir: 'up' } },
      // 王都サファラ: 宮殿の地下水路（町の 南西の かいだん・中庭の 古井戸）
      { x: P.canal.x, y: P.canal.y, to: { map: 'palace_canal', x: PALACE_CANAL_STAIRS.town.x + 0.5, y: PALACE_CANAL_STAIRS.town.y - 0.6, dir: 'up' } },
      { x: P.courtWell.x, y: P.courtWell.y, to: { map: 'palace_canal', x: PALACE_CANAL_STAIRS.court.x + 0.5, y: PALACE_CANAL_STAIRS.court.y + 1.5, dir: 'down' } },
      // 王家のピラミッド（Step 4）: 日時計の とびら（開いた あと）→ 1階
      { x: D.x, y: D.y, to: { map: 'pyramid1', x: PYR_STAIRS.exit1.x + 0.5, y: PYR_STAIRS.exit1.y - 0.5, dir: 'up' } },
      // 砂の港ドゥナ（Step 6）: 谷の 門の 先（いちばん 下の だん）→ ドゥナの 谷の 北の はし
      ...Array.from({ length: DUNA_VALLEY_EXIT.x1 - DUNA_VALLEY_EXIT.x0 + 1 }, (_, i) => DUNA_VALLEY_EXIT.x0 + i)
        .filter((x) => !TILE_INFO[sb.tiles[DUNA_VALLEY_EXIT.y * sb.w + x]]?.solid)
        .map((x) => ({ x, y: DUNA_VALLEY_EXIT.y, to: { map: 'duna', x: DUNA_POS.arrive.x, y: DUNA_POS.arrive.y, dir: 'down' } })),
    ],
    triggers: [
      // 竜を おりた ところ（空を とべる 場所の 中なら どこでも）
      { id: 'c4_arrive', x: SOUTH_LANDING.x, y: SOUTH_LANDING.y, w: SOUTH_LANDING.w, h: SOUTH_LANDING.h, script: 'c4_arrive', show: { all: ['c4_start'], not: ['c4_arrive'] } },
      { id: 'c4_hamil', x: HAM.x, y: HAM.y, w: HAM.w, h: HAM.h, script: 'c4_hamil_arrive', show: { all: ['c4_start'], not: ['c4_hamil'] } },
      // 王都サファラに 着いた（Step 3）・夜は 宮殿の とびらが しまる（入ろうと しても 出ようと しても、外へ）
      { id: 'c4_capital', x: SAF.x, y: SAF.y, w: SAF.w, h: SAF.h, script: 'c4_capital_arrive', show: { all: ['c4_scorpion'], not: ['c4_capital'] } },
      // 大臣ザイードを たおした あと（Step 5）は、女王の 恩人なので 夜も 通れる
      { id: 'c4_palace_night', x: P.palaceDoor.x, y: P.palaceDoor.y, w: 1, h: 1, script: 'c4_palace_closed', show: { all: ['@night'], not: [ZAID_FLAG] } },
    ],
    roofs: SOUTH_ROOFS,
    zoneAt: southZoneAt, areaName: southAreaName, bgmAt: southBgmAt, weatherAt: southWeatherAt,
    labels: SOUTH_LABELS,
    // s_pdesert … 王家の墓の砂ばく（Step 4 で 書きわすれて いて、魔物が 出なかった）・s_sdesert … 南の砂ばく（Step 5）
    spawnCounts: { s_coast: 6, s_dune: 16, s_oasis: 6, s_pdesert: 8, s_sdesert: 6 },
    // フィールドの 宝箱が 出る ところ（ここから 歩いて 行ける ところだけ）
    fcStart: [72, 11],
  };
  m.gateAt = new Map(m.gates.map((g) => [g.y * m.w + g.x, g]));
  m.sparkles = southSparkles(m);
  return m;
}

// ───────────── 北の古井戸 ─────────────
// アミの いる へや（右下）・入り口の へやは 魔物が 出ない
const WELL_AMI = { x: 20, y: 18, w: 12, h: 8 };
function northWell() {
  const t = parseRows(WELL_ROWS);
  const wl = SOUTH_POS.well;
  return {
    id: 'north_well', name: '北の古井戸', kind: 'dungeon', bgm: 'cave', dark: true, theme: 'sand',
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [
      // アミと、アミを かこむ 魔物たち（たおすと いなくなる）
      npc('ami_well', 'アミ', [24, 24], 'ami', 'c4_ami_event', { show: { not: ['c4_ami'] }, dir: 'up' }),
      npc('well_scorp1', 'サソリ兵', [23, 22], 'mon:scorpion_soldier', 'c4_ami_event', { show: { not: ['c4_ami'] }, dir: 'down' }),
      npc('well_scorp2', 'サソリ兵', [26, 23], 'mon:scorpion_soldier', 'c4_ami_event', { show: { not: ['c4_ami'] }, dir: 'left' }),
      npc('well_slime', '砂ぷるりん', [25, 21], 'mon:sand_slime', 'c4_ami_event', { show: { not: ['c4_ami'] }, dir: 'down' }),
    ],
    chests: [
      { id: 'nw_a', x: 2, y: 13, item: 'magic_water' },
      { id: 'nw_b', x: 22, y: 1, item: 'seed_def' },
      { id: 'nw_c', x: 22, y: 15, item: 'magic_powder', n: 2 },
      { id: 'nw_d', x: 5, y: 24, gold: 500 },
    ],
    signs: [],
    warps: [{ x: 4, y: 1, to: { map: 'south', x: wl.x + 0.5, y: wl.y + 1.6, dir: 'down' } }],
    triggers: [
      { id: 'c4_well_enter', x: 2, y: 2, w: 6, h: 4, script: 'c4_well_enter', show: { all: ['c4_nadim'], not: ['c4_well'] } },
      { id: 'c4_ami_room', x: WELL_AMI.x + 4, y: WELL_AMI.y, w: 8, h: 3, script: 'c4_ami_event', show: { not: ['c4_ami'] } },
    ],
    actions: [],
    sparkles: [],
    roofs: [],
    zoneAt: (x, y) => {
      if (x >= 2 && y >= 1 && x <= 7 && y <= 5) return 'safe:entry';
      if (x >= WELL_AMI.x && y >= WELL_AMI.y && x < WELL_AMI.x + WELL_AMI.w && y < WELL_AMI.y + WELL_AMI.h) return 'safe:ami';
      return 's_well';
    },
    areaName: () => '北の古井戸',
    spawnCounts: { s_well: 6 },
  };
}
// ───────────── かれた地下水路（Step 2）─────────────
// この マップだけの 文字（tiles.js の LEGEND より 先に 見る）
const CANAL_LEGEND = {
  '#': T.CANAL_WALL, '.': T.CANAL_FLOOR, '_': T.CANAL_BED, '~': T.CANAL_WATER, 'H': T.SLUICE, 'h': T.SLUICE_OPEN, 'D': T.DAM,
};
// マスの まとまりを しかけに する（closed → open。invert: フラグが たつと しまる）。もとの マスは はじめの すがた
function gateRect(m, x0, y0, x1, y1, closed, open, flag, invert = false) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      m.tiles[y * m.w + x] = invert ? open : closed;
      m.gates.push(invert ? { x, y, closed, open, flag, invert: true } : { x, y, closed, open, flag });
    }
  }
}
// たまり水: フラグで 水 ⇄ かわいた 底（invert: はじめは かわいていて、フラグで 水が 入る）
const pool = (m, x0, y0, x1, y1, flag, invert = false) => gateRect(m, x0, y0, x1, y1, T.CANAL_WATER, T.CANAL_BED, flag, invert);
function lever(m, x, y, flag, script) {
  m.gates.push({ x, y, closed: T.LEVER, open: T.LEVER_ON, flag });
  m.actions.push({ x, y, script });
}
const zoneRect = (rects, fallback) => (x, y) => {
  for (const [x0, y0, x1, y1, z] of rects) if (x >= x0 && y >= y0 && x <= x1 && y <= y1) return z;
  return fallback;
};
function canalMap(id, name, rows, opts) {
  const t = parseRows(rows, CANAL_LEGEND);
  return {
    id, name, kind: 'dungeon', bgm: 'canal', dark: true, theme: 'canal',
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [], chests: [], signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [],
    areaName: () => name,
    spawnCounts: {},
    ...opts,
  };
}

function canal() {
  const c1 = canalMap('canal1', 'かれた地下水路　1階', CANAL1_ROWS, {
    chests: [
      { id: 'cn1_ne', x: 26, y: 2, item: 'seed_def' },
      { id: 'cn1_hall', x: 27, y: 18, item: 'magic_water' },
      { id: 'cn1_nw', x: 8, y: 2, gold: 900 },
    ],
    warps: [
      { x: 14, y: 21, to: { map: 'south', x: CANAL_DOOR.x + 0.5, y: CANAL_DOOR.y + 1.6, dir: 'down' } },
      { x: 5, y: 3, to: { map: 'canal2', x: 21.5, y: 35.4, dir: 'up' } },
    ],
    triggers: [{ id: 'c4_canal_enter', x: 11, y: 16, w: 7, h: 4, script: 'c4_canal_enter', show: { not: ['c4_canal_seen'] } }],
    zoneAt: zoneRect([[11, 17, 17, 21, 'safe:entry'], [2, 1, 9, 5, 'safe:stairs']], 's_canal'),
    spawnCounts: { s_canal: 6 },
  });
  // 北の 2つの 通路の たまり水: レバーで 左が かわき、右に 水が 入る
  pool(c1, 4, 6, 6, 8, CANAL_LEVERS.c1);
  pool(c1, 21, 6, 23, 8, CANAL_LEVERS.c1, true);
  lever(c1, 14, 11, CANAL_LEVERS.c1, 'c4_cn1_lever');

  const c2 = canalMap('canal2', 'かれた地下水路　2階', CANAL2_ROWS, {
    chests: [
      { id: 'cn2_ne', x: 36, y: 8, item: 'sand_cloak' },
      { id: 'cn2_w', x: 5, y: 22, item: 'seed_str' },
      { id: 'cn2_e', x: 26, y: 23, item: 'moonherb', n: 3 },
      { id: 'cn2_nw', x: 17, y: 9, item: 'revive_flower' },
      { id: 'cn2_hall', x: 13, y: 33, gold: 1200 },
    ],
    warps: [
      { x: 21, y: 36, to: { map: 'canal1', x: 5.5, y: 4.5, dir: 'down' } },
      { x: 12, y: 3, to: { map: 'canal3', x: 11.5, y: 18.4, dir: 'up' } },
    ],
    triggers: [{ id: 'c4_canal2_enter', x: 18, y: 31, w: 9, h: 5, script: 'c4_canal2_enter', show: { not: ['c4_canal2_seen'] } }],
    zoneAt: zoneRect([[18, 32, 25, 36, 'safe:stairs'], [6, 2, 18, 5, 'safe:stairs']], 's_canal2'),
    spawnCounts: { s_canal2: 9 },
  });
  // 下の 水路: 左（P1）は レバー1で かわき、右（Q1）は レバー1で 水が 入る。上の 水路の P2・Q2 は レバー2
  pool(c2, 9, 25, 11, 27, CANAL_LEVERS.c2a);
  pool(c2, 32, 25, 34, 27, CANAL_LEVERS.c2a, true);
  pool(c2, 9, 12, 11, 14, CANAL_LEVERS.c2b);
  pool(c2, 32, 12, 34, 14, CANAL_LEVERS.c2b, true);
  lever(c2, 26, 31, CANAL_LEVERS.c2a, 'c4_cn2a_lever');
  lever(c2, 36, 22, CANAL_LEVERS.c2b, 'c4_cn2b_lever');

  const c3 = canalMap('canal3', 'かれた地下水路　おく', CANAL3_ROWS, {
    npcs: [npc('armor_scorpion', 'よろい大サソリ', [12, 6], 'mon:armor_scorpion', 'c4_scorpion_event', { big: true, show: { not: [SCORPION_FLAG] } })],
    warps: [{ x: 11, y: 19, to: { map: 'canal2', x: 12.5, y: 4.5, dir: 'down' } }],
    triggers: [{ id: 'c4_scorpion_room', x: 3, y: 9, w: 18, h: 4, script: 'c4_scorpion_event', show: { not: [SCORPION_FLAG] } }],
    zoneAt: () => 'safe:boss',
  });
  // サソリを たおすと せきが くずれて、水路に 水が もどる
  gateRect(c3, 4, 3, 19, 3, T.DAM, T.CANAL_WATER, SCORPION_FLAG);
  gateRect(c3, 4, 4, 19, 12, T.CANAL_BED, T.CANAL_WATER, SCORPION_FLAG);
  return { canal1: c1, canal2: c2, canal3: c3, palace_canal: palaceCanal() };
}

// ───── 宮殿の地下水路（Step 3）─────
// 夜は 宮殿の 門が しまるので、ここを 通って 中庭へ。昼でも 通れる（中庭の 水がめは 夜に ふしぎな ことが おきる）
// 町の 南西の かいだん ⇔ 左下の へや、中庭の 古井戸 ⇔ 北東の へや
function palaceCanal() {
  const { town, court } = PALACE_CANAL_STAIRS;
  return canalMap('palace_canal', '宮殿の地下水路', PALACE_CANAL_ROWS, {
    chests: [
      { id: 'pc_nw1', x: 4, y: 5, item: 'magic_water', n: 2 },
      { id: 'pc_nw2', x: 9, y: 5, item: 'seed_agi' },
      { id: 'pc_s1', x: 20, y: 22, item: 'crescent_blade' },
      { id: 'pc_s2', x: 24, y: 22, gold: 1800 },
      { id: 'pc_ne', x: 34, y: 4, item: 'revive_flower' },
    ],
    warps: [
      { x: town.x, y: town.y, to: { map: 'south', x: SAFARA_POS.canal.x + 0.5, y: SAFARA_POS.canal.y + 1.6, dir: 'down' } },
      { x: court.x, y: court.y, to: { map: 'south', x: SAFARA_POS.courtWell.x + 0.5, y: SAFARA_POS.courtWell.y + 1.6, dir: 'down' } },
    ],
    triggers: [{ id: 'c4_pcanal_enter', x: 2, y: 18, w: 8, h: 5, script: 'c4_pcanal_enter', show: { not: ['c4_pcanal_seen'] } }],
    zoneAt: zoneRect([[2, 18, 9, 23, 'safe:entry'], [26, 1, 35, 4, 'safe:exit']], 's_pcanal'),
    spawnCounts: { s_pcanal: 8 },
  });
}

// ───────────── 王家のピラミッド（Step 4）─────────────
// この マップだけの 文字（tiles.js の LEGEND より 先に 見る）。かべ・ゆかは 洞窟の タイルを 金色の 石に 色がえ（theme 'pyramid'。render/themes.js）
const PYR_LEGEND = {
  '#': T.CAVE_WALL, '.': T.CAVE_FLOOR, X: T.PYR_GATE,
  1: T.BTN_SUN, 2: T.BTN_SAND, 3: T.BTN_MOON, 4: T.BTN_STAR,
  N: T.FLOW_N, E: T.FLOW_E, S: T.FLOW_S, W: T.FLOW_W, O: T.SAND_PIT,
  C: T.PYR_CRACK, D: T.PYR_SLAB, K: T.SARCOPHAGUS, A: T.PYR_ALTAR, G: T.PYR_GLYPH, r: T.SEAL_RUNE,
};
// ピラミッドの 中の きまり: みちびきの糸・帰り道の羽は 使えない（noEscape。world/escape.js・services.js）。ルーラは 洞窟と おなじく 天井に ぶつかる
// pyramid … のろいの宝の きまり（ピラミッドの 外に 出るまで 魔物が ふえる。world/monsters.js）
function pyramidMap(id, name, rows, opts) {
  const t = parseRows(rows, PYR_LEGEND);
  return {
    id, name, kind: 'dungeon', bgm: 'pyramid', dark: true, theme: 'pyramid', pyramid: true, noEscape: true,
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [], chests: [], signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [],
    areaName: () => name,
    spawnCounts: {},
    ...opts,
  };
}
// ある マスを しかけに する（いまの タイル → open。フラグが たつと open）
function gateAt(m, x, y, open, flag) {
  m.gates.push({ x, y, closed: m.tiles[y * m.w + x], open, flag });
}
// かいだんの となりに 着く（dy … かいだんから 何マス 下か）
const toward = (p, map, dy, dir = 'down') => ({ map, x: p.x + 0.5, y: p.y + 0.5 + dy, dir });

function pyramid() {
  const st = PYR_STAIRS;
  // ───── 1階: 歌の ボタンの 大広間 ─────
  const p1 = pyramidMap('pyramid1', '王家のピラミッド　1階', PYR1_ROWS, {
    npcs: [
      // 金色の つぼ（のろいのつぼ が 化けている）
      npc('pyr_pot1', '金色のつぼ', [3, 13], 'gold_pot', 'c4_pyr_pot1', { show: { not: [PYR_POTS.pot1] }, dir: 'down' }),
    ],
    chests: [
      { id: 'py1_w', x: 2, y: 10, item: 'magic_water', n: 2 },
      { id: 'py1_e', x: 29, y: 15, item: 'seed_def' },
    ],
    signs: [{ x: 15, y: 10, text: '石の文字ばんに、こう書いてある。\n「王の歌を、王のじゅんに。\nまちがえし者は、ミイラのへやへ落ちる」' }],
    warps: [
      { x: st.exit1.x, y: st.exit1.y, to: { map: 'south', x: PYRAMID_POS.door.x + 0.5, y: PYRAMID_POS.door.y + 1.6, dir: 'down' } },
      { x: st.up1.x, y: st.up1.y, to: toward(st.down2, 'pyramid2', -1, 'up') },
      // 東の へやの 床の あな → 地下（ミイラのへや）
      { x: st.hole1.x, y: st.hole1.y, to: { map: PYR_FALL.map, x: PYR_FALL.x, y: PYR_FALL.y, dir: 'down' } },
    ],
    triggers: [{ id: 'c4_pyr1_enter', x: 10, y: 20, w: 11, h: 5, script: 'c4_pyr1_enter', show: { not: ['c4_pyr1_seen'] } }],
    actions: [
      ...PYR_BUTTONS.map((b) => ({ x: b.x, y: b.y, script: `c4_pyr_btn_${b.key}` })),
      // 北の かべの 絵文字（王の 歌の 絵）
      ...[7, 8, 9, 21, 22, 23].map((x) => ({ x, y: 8, script: 'c4_pyr_glyph' })),
      // しまった 石の とびら（ボタンの なぞを とく まで）
      ...[14, 15, 16].map((x) => ({ x, y: 8, script: 'c4_pyr_slab', show: { not: [PYR_DOOR_FLAG] } })),
    ],
    zoneAt: zoneRect([[10, 20, 20, 24, 'safe:entry'], [11, 1, 19, 7, 'safe:stairs'], [25, 9, 29, 11, 'safe:stairs']], 's_pyr1'),
    spawnCounts: { s_pyr1: 6 },
  });
  for (const b of PYR_BUTTONS) gateAt(p1, b.x, b.y, b.on, b.flag);
  for (const x of [14, 15, 16]) gateAt(p1, x, 8, T.CAVE_FLOOR, PYR_DOOR_FLAG);

  // ───── 地下: ミイラのへや（ボタンを まちがえると おちる）─────
  const b1 = pyramidMap('pyramid_b1', '王家のピラミッド　地下', PYR_B1_ROWS, {
    chests: [
      { id: 'pyb_sw', x: 3, y: 10, item: 'seed_mag' },
      { id: 'pyb_ne', x: 21, y: 2, gold: 2200 },
    ],
    warps: [{ x: st.upB1.x, y: st.upB1.y, to: { map: 'pyramid1', x: 27.5, y: 10.5, dir: 'down' } }],
    triggers: [{ id: 'c4_pyrb1_enter', x: 9, y: 4, w: 7, h: 5, script: 'c4_pyrb1_enter', show: { not: ['c4_pyrb1_seen'] } }],
    zoneAt: zoneRect([[10, 5, 14, 7, 'safe:landing'], [20, 5, 22, 7, 'safe:stairs']], 's_pyr_b1'),
    spawnCounts: { s_pyr_b1: 6 },
  });

  // ───── 2階: 呪文が ふうじられた 階（noSpells。戦いでも フィールドでも 呪文は 使えない）─────
  const p2 = pyramidMap('pyramid2', '王家のピラミッド　2階', PYR2_ROWS, {
    noSpells: true,
    npcs: [
      // 昔の 探検家の ゆうれい（入り口で 呪文の ことを 教えてくれる）
      npc('pyr_ghost', '探検家のゆうれい', [7, 18], 'explorer_ghost', 'c4_pyr_ghost', { dir: 'down' }),
      npc('pyr_pot2', '金色のつぼ', [24, 12], 'gold_pot', 'c4_pyr_pot2', { show: { not: [PYR_POTS.pot2] }, dir: 'down' }),
    ],
    chests: [
      { id: 'py2_h1', x: 2, y: 6, item: 'revive_flower' },
      { id: 'py2_room', x: 13, y: 19, gold: 2600 },
      { id: 'py2_t', x: 31, y: 2, item: 'magic_water', n: 2 },
    ],
    warps: [
      { x: st.down2.x, y: st.down2.y, to: toward(st.up1, 'pyramid1', 1) },
      { x: st.up2.x, y: st.up2.y, to: toward(st.down3, 'pyramid3', -1, 'up') },
    ],
    triggers: [{ id: 'c4_pyr2_enter', x: 2, y: 19, w: 7, h: 4, script: 'c4_pyr2_enter', show: { not: ['c4_pyr2_seen'] } }],
    zoneAt: zoneRect([[2, 18, 8, 22, 'safe:entry'], [14, 2, 18, 5, 'safe:landing'], [24, 2, 28, 3, 'safe:stairs']], 's_pyr2'),
    spawnCounts: { s_pyr2: 8 },
  });

  // ───── 3階: ありじごくの 迷路（流れる 砂。行き先を 目で たどれる ように 明るい）─────
  const p3 = pyramidMap('pyramid3', '王家のピラミッド　3階', PYR3_ROWS, {
    dark: false,
    chests: [
      { id: 'py3_a', x: 2, y: 11, item: 'seed_hp' },
      { id: 'py3_b', x: 31, y: 2, item: 'star_shard', n: 3 },
    ],
    signs: [{ x: 2, y: 21, text: '石の文字ばんに、こう書いてある。\n「流れる砂は、矢じるしのむきへ人を運ぶ。\n砂の行き先を目でたどり、のる流れを選べ」' }],
    warps: [
      { x: st.down3.x, y: st.down3.y, to: toward(st.up2, 'pyramid2', 1) },
      { x: st.up3.x, y: st.up3.y, to: toward(st.down4, 'pyramid4', -1, 'up') },
    ],
    triggers: [{ id: 'c4_pyr3_enter', x: 3, y: 21, w: 6, h: 4, script: 'c4_pyr3_enter', show: { not: ['c4_pyr3_seen'] } }],
    actions: [
      { x: 2, y: 8, script: 'c4_pyr_lever1' },
      { x: 31, y: 6, script: 'c4_pyr_lever2' },
    ],
    spawnCounts: { s_pyr3: 5 },
  });
  // ありじごく（O）は みんな 2階の 小べやへ
  p3.tiles.forEach((t, i) => {
    if (t !== T.SAND_PIT) return;
    p3.warps.push({ x: i % p3.w, y: Math.floor(i / p3.w), to: { map: PYR_LANDING.map, x: PYR_LANDING.x, y: PYR_LANDING.y, dir: 'down' } });
  });
  // 流れる 砂・ありじごくの 上は 魔物が 出ない。入り口の へやと 4階への かいだんの まわりも
  const sandAt = (x, y) => { const t = p3.tiles[y * p3.w + x]; return t >= T.FLOW_N && t <= T.SAND_PIT; };
  const z3 = zoneRect([[2, 20, 8, 24, 'safe:entry'], [26, 2, 30, 3, 'safe:stairs']], 's_pyr3');
  p3.zoneAt = (x, y) => (sandAt(x, y) ? 'safe:flow' : z3(x, y));
  // 近道の 石の とびらと レバー（1本目: 入り口 ⇔ まん中の へや、2本目: まん中の へや ⇔ 4階への かいだんの へや）
  gateAt(p3, 1, 16, T.CAVE_FLOOR, PYR_LEVERS.l1);
  gateAt(p3, 14, 1, T.CAVE_FLOOR, PYR_LEVERS.l2);
  p3.gates.push({ x: 2, y: 8, closed: T.LEVER, open: T.LEVER_ON, flag: PYR_LEVERS.l1 });
  p3.gates.push({ x: 31, y: 6, closed: T.LEVER, open: T.LEVER_ON, flag: PYR_LEVERS.l2 });

  // ───── 4階: 王のへや（ミイラの王アンク）・かくしべや（のろいの宝）─────
  const A4 = PYR4_POS;
  const p4 = pyramidMap('pyramid4', '王家のピラミッド　4階', PYR4_ROWS, {
    npcs: [
      npc('mummy_king', 'ミイラの王アンク', [A4.anku.x, A4.anku.y], 'mon:mummy_king', 'c4_anku_event', { big: true, show: { not: ['c4_anku'] } }),
      // 王の 台の まえに うかぶ 月の鏡（アンクを たおすと あらわれる）
      npc('pyr_mirror', '月の鏡', [A4.mirror.x, A4.mirror.y], 'moon_mirror', 'c4_pyr_mirror', { show: { all: ['c4_anku'], not: ['c4_mirror'] }, dir: 'down' }),
      // かくしべやの のろいの宝
      npc('gold_sword', '王家の黄金の剣', [A4.sword.x, A4.sword.y], 'gold_sword', 'c4_gold_sword', { show: { not: [GOLD_SWORD_FLAG] }, dir: 'down' }),
    ],
    warps: [{ x: st.down4.x, y: st.down4.y, to: toward(st.up3, 'pyramid3', 1) }],
    triggers: [
      { id: 'c4_pyr4_enter', x: 8, y: 17, w: 11, h: 2, script: 'c4_pyr4_enter', show: { not: ['c4_pyr4_seen'] } },
      // 王のへやに 入ると アンクが 目を覚ます
      { id: 'c4_anku_room', x: 6, y: 7, w: 15, h: 2, script: 'c4_anku_event', show: { not: ['c4_anku'] } },
    ],
    actions: [
      { x: A4.altar.x, y: A4.altar.y, script: 'c4_pyr_altar' },
      { x: A4.crack.x, y: A4.crack.y, script: 'c4_pyr_crack', show: { not: [PYR_CRACK_FLAG] } },
      ...[7, 8, 9, 17, 18, 19].map((x) => ({ x, y: 12, script: 'c4_pyr_glyph4' })),
    ],
    zoneAt: zoneRect([[5, 1, 21, 8, 'safe:boss'], [10, 9, 16, 11, 'safe:stairs'], [1, 13, 6, 17, 'safe:hidden'], [9, 17, 17, 18, 'safe:entry']], 's_pyr4'),
    areaName: (x, y) => (y <= 8 ? '王のへや' : '王家のピラミッド　4階'),
    spawnCounts: { s_pyr4: 3 },
  });
  gateAt(p4, A4.crack.x, A4.crack.y, T.CAVE_FLOOR, PYR_CRACK_FLAG);
  return { pyramid1: p1, pyramid_b1: b1, pyramid2: p2, pyramid3: p3, pyramid4: p4 };
}

export function buildCh4Maps() {
  return { south: buildField(), north_well: northWell(), ...canal(), ...pyramid(), ...buildDunaMaps(), ...buildTempleMaps() };
}

export { SOUTH_POS };
