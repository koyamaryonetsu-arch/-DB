// お仕事いらい板の たのまれごと 6〜11（第41回。docs/plan-side.md の 6・7）の 人・しらべる 所・小さな へや
//
// ・第1部クリア（c5_clear）の あと、今の 時代の 町に たのみたい 人が 立つ（千年前の 町には 入れない）
// ・maps/family-quests.js の attachFamilyQuests の さいごに attachWorkQuests を よぶ（maps/index.js は かえない）
// ・だいほんは data/sidequests-work.js、人と 物の 絵は client/render/work-art.js
//
//  6. 砂の港ドゥナの歌のステージ（アイドルの 系統。ドゥナの 広場の 古い ステージ）
//  7. オアシスの村の、こわれた橋（地方公務員の 系統。ハミルの オアシスの 池を わたる 橋）
//  8. カモメ港の子ども野球チーム（プロ野球選手の 系統。カモメ港の 南の すなはま）
//  9. ハネノの町の名物動画（ユーチューバーの 系統。ハネノの町の 見晴らし台・広場）
// 10. 湯けむり宿の大そうじ（おかんの 系統。ユノハの 宿屋の 2階。べつの 小さな マップ）
// 11. 王都のお祭りの手品ショー（手品師の 系統。王都サファラの 南の 広場・宿屋）
import { T } from '../tiles.js?v=2551bc2b5aab';
import { npc } from './npc.js?v=2551bc2b5aab';
import { NORTH_PLACES } from './north.js?v=2551bc2b5aab';
import { SOUTH_PLACES } from './south.js?v=2551bc2b5aab';
import { PORT } from './sea.js?v=2551bc2b5aab';
import { openSpot } from './labyrinth.js?v=2551bc2b5aab';
import { room } from './fq-kit.js?v=2551bc2b5aab';

// ───────────── フラグ（セーブに のこるので かえない）─────────────
export const WQ_OPEN = 'c5_clear'; // 第1部クリアで たのみたい 人が 立つ（maps/family-quests.js の FQ_OPEN と おなじ）
const OPEN = WQ_OPEN;
export const WQ = {
  // 6. 歌の ステージ
  stageStart: 'fq_stage_start', stageClean: 'fq_stage_clean', stageSong: 'fq_stage_song', stageDone: 'fq_stage_done',
  // 7. こわれた 橋（crab … 橋の 砂ガニ・plan … 手つづきが すんだ・built … 橋が 直った）
  bridgeStart: 'fq_bridge_start', bridgeCrab: 'fq_bridge_crab', bridgeLook: 'fq_bridge_look', bridgeBuilt: 'fq_bridge_built', bridgeDone: 'fq_bridge_done',
  // 8. 子ども野球（plan … 練習の 組み立てが すんだ）
  ballStart: 'fq_ball_start', ballPlan: 'fq_ball_plan', ballDone: 'fq_ball_done',
  // 9. 名物動画（tip … 旅の 若者の 話・made … 動画が できた）
  videoStart: 'fq_video_start', videoTip: 'fq_video_tip', videoMade: 'fq_video_made', videoDone: 'fq_video_done',
  // 10. 宿の 大そうじ（bat … 物置の つららコウモリ・clean … そうじが 全部 すんだ）
  innStart: 'fq_inn_start', innBat: 'fq_inn_bat', innDone: 'fq_inn_done',
  // 11. 手品ショー（tip … 手品師の こつを 聞いた・dove … ハトを だき上げた・order … 手品の じゅんばんが 合った）
  magicStart: 'fq_magic_start', magicTip: 'fq_magic_tip', magicDove: 'fq_magic_dove', magicOrder: 'fq_magic_order', magicDone: 'fq_magic_done',
};
// 町の 人の 声・うわさ（話を 聞いた）
export const STAGE_VOICES = ['fq_stage_v1', 'fq_stage_v2', 'fq_stage_v3'];
export const BRIDGE_VOICES = ['fq_bridge_v1', 'fq_bridge_v2', 'fq_bridge_v3'];
export const BALL_KIDS = ['fq_ball_k1', 'fq_ball_k2', 'fq_ball_k3']; // 3人の なやみを 聞いた
export const BALL_PRACTICE = ['fq_ball_p1', 'fq_ball_p2', 'fq_ball_p3']; // 3人の 練習を 決めた
export const VIDEO_SPOTS = ['fq_video_m1', 'fq_video_m2', 'fq_video_m3']; // 名物を さつえいした
export const VIDEO_STEPS = ['fq_video_s1', 'fq_video_s2', 'fq_video_s3']; // 動画の さいしょ・まん中・さいご
export const INN_CLEAN = ['fq_inn_c1', 'fq_inn_c2', 'fq_inn_c3']; // まど・台所・物置
export const INN_KIDS = ['fq_inn_k1', 'fq_inn_k2', 'fq_inn_k3']; // 子どもたちの ねがいを 聞いた

// ───────────── 7. ハミルの オアシスの 池の 橋 ─────────────
// 第4章で 水が もどった 池（28〜33, 35〜39。c4_scorpion）の まん中の 行を わたる 橋（6マス）。
// 池の まん中の いちばん きれいな 水を くむ ための 橋。こわれた 橋を しらべる 所は 西の 岸（見えない。こわれた 橋の タイルが 見える）
// こわれた 橋が 見えるのは 第1部クリア（たのまれごとの ころ）から。その 前は 今までの まま（水が もどる 前は どろ、もどったら 水）
export const BRIDGE_TILES = [28, 29, 30, 31, 32, 33].map((x) => ({ x, y: 37 }));
export const BRIDGE_SHORE = { x: 27, y: 37 };
const OASIS_FULL = 'c4_scorpion';

// ───────────── 10. ユノハの 宿屋の 2階 ─────────────
const YUN = NORTH_PLACES.yunoha;
// 1階（今の 宿屋の 右上の すみ）に 上り階だん
export const INN_STAIRS = { x: YUN.x + 23, y: YUN.y + 3 };
// 2階: 左が 台所・まん中が 大広間・右が 物置。下の ろうかの 左に 下り階だん
export const INN2_ROWS = [
  'WWWWWWWWWWWWWWWWWWWW',
  'WSo__W__________WxOW',
  'W___CW__________W__W',
  'W____W__t____t__W__W',
  'W____D__c____c__D__W',
  'W____W__________W__W',
  'WWWWWW__________WWWW',
  'W>_________________W',
  'WWWWWWWWWWWWWWWWWWWW',
];
export const INN2_POS = {
  arrive: { x: 2.5, y: 7.5 }, // 1階から 上がった 所
  back: { x: INN_STAIRS.x + 0.5, y: INN_STAIRS.y + 1.5 }, // 1階に おりた 所（階だんの 下）
  okami: [10, 2], window: [10, 0], stove: [3, 1], closet: [18, 2],
  kids: [[7, 2], [13, 5], [9, 5]],
};

// ───────────── 11. サファラの 広場（ステージ）─────────────
const SAF = SOUTH_PLACES.safara;

function inn2Map() {
  const P = INN2_POS;
  const kidLooks = ['boy', 'girl', 'boy'];
  const kidNames = ['子ども会のリク', '子ども会のハナ', '子ども会のソラタ'];
  const kids = P.kids.map(([x, y], i) => npc(`fq_inn_kid${i + 1}`, kidNames[i], [x, y], kidLooks[i], `fq_inn_kid${i + 1}`, { wander: 1 }));
  // ごはんの あと（テーブルで にこにこ）
  const eat = [[8, 2], [13, 2], [9, 3]].map(([x, y], i) => npc(`fq_inn_eat${i + 1}`, kidNames[i], [x, y], kidLooks[i], 'fq_inn_eat', { dir: 'down', show: { all: [WQ.innDone] } }));
  return {
    fq_inn2: room('fq_inn2', 'ユノハの宿屋　2階', INN2_ROWS, {
      bgm: 'snowtown', roof: 'snowred',
      npcs: [
        npc('fq_inn_okami', '宿の大おかみハルエ', P.okami, 'fq_okami', 'fq_inn_okami', { dir: 'down' }),
        npc('fq_inn_window', 'くもったまど', P.window, 'mon:fq_window', 'fq_inn_window', { dir: 'down', show: { not: [INN_CLEAN[0]] } }),
        npc('fq_inn_window2', 'ぴかぴかのまど', P.window, 'mon:fq_window_clean', 'fq_inn_window', { dir: 'down', show: { all: [INN_CLEAN[0]] } }),
        npc('fq_inn_stove', '油よごれのコンロ', P.stove, 'mon:fq_stove', 'fq_inn_stove', { show: { not: [INN_CLEAN[1]] } }),
        npc('fq_inn_stove2', 'ぴかぴかのコンロ', P.stove, 'mon:fq_stove_clean', 'fq_inn_stove', { show: { all: [INN_CLEAN[1]] } }),
        npc('fq_inn_closet', 'ほこりだらけのたな', P.closet, 'mon:fq_closet', 'fq_inn_closet', { show: { not: [INN_CLEAN[2]] } }),
        npc('fq_inn_closet2', 'かたづいたたな', P.closet, 'mon:fq_closet_clean', 'fq_inn_closet', { show: { all: [INN_CLEAN[2]] } }),
        ...kids.map((k) => ({ ...k, show: { not: [WQ.innDone] } })),
        ...eat,
      ],
      warps: [{ x: 1, y: 7, to: { map: 'north', x: P.back.x, y: P.back.y, dir: 'down' } }],
    }),
  };
}

// ───────────── 今の 町に たす 人（base … どの 町の いちか。map の 中の 絶対の いちは base を 0 に）─────────────
const SHOWN = { all: [OPEN] };
const opened = (...more) => ({ all: [OPEN, ...more] });
const Z = { x: 0, y: 0 };
const HAM = SOUTH_PLACES.hamil;
// [id, 名前, 絵, だいほん, マップ, base, x, y, opts]
const WORK_NPCS = [
  // 6. ドゥナ: 港の 世話役・古い ステージ（砂だらけ／きれい）・仕立て屋・町の 人の 声・あとの お客さん
  ['fq_stage_boss', '港の世話役ナジャ', 'fq_port_boss', 'fq_stage_boss', 'duna', Z, 25, 25, { show: SHOWN }],
  ['fq_stage_dusty', '古いステージ', 'mon:fq_stage_dusty', 'fq_stage_stage', 'duna', Z, 28, 24, { show: { all: [OPEN], not: [WQ.stageClean] }, fixed: true }],
  ['fq_stage_clean', '港のステージ', 'mon:fq_stage', 'fq_stage_stage', 'duna', Z, 28, 24, { show: opened(WQ.stageClean), fixed: true }],
  ['fq_stage_tailor', '仕立て屋のおばあさん', 'elder', 'fq_stage_tailor', 'duna', Z, 20, 32, { show: SHOWN }],
  ['fq_stage_v1', '船乗りのおじさん', 'fq_sailor', 'fq_stage_voice1', 'duna', Z, 40, 32, { show: SHOWN }],
  ['fq_stage_v2', '港の女の子', 'girl', 'fq_stage_voice2', 'duna', Z, 31, 28, { show: SHOWN, wander: 1 }],
  ['fq_stage_v3', '年よりの漁師', 'oldman', 'fq_stage_voice3', 'duna', Z, 45, 32, { show: SHOWN }],
  ...[[24, 27, 'woman'], [26, 28, 'boy'], [29, 28, 'merchant'], [31, 26, 'girl'], [33, 27, 'fq_sailor']].map(([x, y, look], i) => [`fq_stage_fan${i + 1}`, 'ステージのお客さん', look, 'fq_stage_fan', 'duna', Z, x, y, { show: opened(WQ.stageDone), dir: 'up' }]),
  // 7. ハミル: 役場の 人・こわれた 橋（西の 岸の 見えない しらべる 所。ぶつかると 話せる）・村の 人の 声・橋が できた あとの 水くみの 人
  ['fq_bridge_officer', '村の役場のサミール', 'fq_officer', 'fq_bridge_officer', 'south', Z, 27, 35, { show: SHOWN }],
  ['fq_bridge_broken', 'こわれた橋', 'none', 'fq_bridge_broken', 'south', Z, BRIDGE_SHORE.x, BRIDGE_SHORE.y, { show: { all: [OPEN], not: [WQ.bridgeBuilt] }, fixed: true }],
  ['fq_bridge_drawer', '水くみの村の人', 'woman', 'fq_bridge_drawer', 'south', Z, 34, 36, { show: opened(WQ.bridgeBuilt), fixed: true, dir: 'left' }],
  ['fq_bridge_v1', '畑のおじさん', 'farmer', 'fq_bridge_voice1', 'south', HAM, 5, 17, { show: SHOWN }],
  ['fq_bridge_v2', '水がめのおばさん', 'woman', 'fq_bridge_voice2', 'south', HAM, 19, 13, { show: SHOWN }],
  ['fq_bridge_v3', 'ロバ車の水売り', 'merchant', 'fq_bridge_voice3', 'south', HAM, 13, 20, { show: SHOWN }],
  // 8. カモメ港: キャプテン・3人の 子ども（ピッチャー・バッター・守り）
  ['fq_ball_cap', 'キャプテンのタイチ', 'fq_ball_kid', 'fq_ball_cap', 'sea', Z, 21, 47, { show: SHOWN }],
  ['fq_ball_k1', 'ピッチャーのソウタ', 'fq_ball_kid2', 'fq_ball_kid1', 'sea', Z, 27, 47, { show: SHOWN }],
  ['fq_ball_k2', 'バッターのミナミ', 'fq_ball_girl', 'fq_ball_kid2', 'sea', Z, 17, 48, { show: SHOWN }],
  ['fq_ball_k3', '守りのケンタ', 'fq_ball_kid3', 'fq_ball_kid3', 'sea', Z, 31, 48, { show: SHOWN }],
  // 9. ハネノ: 観光係・見晴らし台の さつえいの 所・雲わたあめ屋・羽の 像の お話・旅の 若者・あとの 旅人
  ['fq_video_guide', '観光係のミソラ', 'fq_guide', 'fq_video_guide', 'hanono', Z, 19, 29, { show: SHOWN }],
  ['fq_video_view', '見晴らし台の写真屋さん', 'fq_photographer', 'fq_video_view', 'hanono', Z, 42, 7, { show: SHOWN, fixed: true }],
  ['fq_video_candy', '雲わたあめ屋のおじさん', 'fq_candy_man', 'fq_video_candy', 'hanono', Z, 20, 20, { show: SHOWN }],
  ['fq_video_elder', '物知りのおじいさん', 'oldman', 'fq_video_elder', 'hanono', Z, 25, 18, { show: SHOWN }],
  ['fq_video_tip', '旅の若者', 'bard', 'fq_video_tipper', 'hanono', Z, 25, 33, { show: SHOWN }],
  ...[[18, 19, 'bard'], [21, 22, 'woman'], [27, 21, 'merchant'], [24, 24, 'girl']].map(([x, y, look], i) => [`fq_video_tour${i + 1}`, '動画を見た旅人', look, 'fq_video_tour', 'hanono', Z, x, y, { show: opened(WQ.videoDone), wander: 1 }]),
  // 11. サファラ: お祭りの 係・ぶたい・宿屋の 手品師・屋台の おじさん（トランプ）・白い ハト・あとの お客さん
  ['fq_magic_host', 'お祭りの係ファリダ', 'fq_festival', 'fq_magic_host', 'south', Z, 36, 101, { show: SHOWN }],
  ['fq_magic_stage', 'お祭りのぶたい', 'mon:fq_magic_stage', 'fq_magic_stage', 'south', Z, 34, 100, { show: SHOWN, fixed: true }],
  ['fq_magic_man', '手品師のマジーロ', 'fq_magician', 'fq_magic_man', 'south', SAF, 7, 4, { show: SHOWN }],
  ['fq_magic_vendor', '屋台のおじさん', 'merchant', 'fq_magic_vendor', 'south', Z, 47, 102, { show: SHOWN }],
  ['fq_magic_dove', '白いハト', 'mon:fq_dove', 'fq_magic_dove', 'south', Z, 44, 100, { show: { all: [OPEN, WQ.magicStart], not: [WQ.magicDove, WQ.magicDone] }, solid: false }],
  ...[[33, 102, 'boy'], [35, 103, 'woman'], [37, 103, 'oldman'], [34, 104, 'girl'], [38, 102, 'merchant']].map(([x, y, look], i) => [`fq_magic_fan${i + 1}`, 'お祭りのお客さん', look, 'fq_magic_fan', 'south', Z, x, y, { show: opened(WQ.magicDone), dir: 'up' }]),
];

// maps/family-quests.js の attachFamilyQuests から（ほかの マップが そろった あと）
export function attachWorkQuests(maps) {
  Object.assign(maps, inn2Map());
  // 7. ハミルの 池: こわれた 橋（直すと ふつうの 橋）。その マスの 前からの しかけ（水が もどる）は 橋に まとめる
  const south = maps.south;
  for (const b of BRIDGE_TILES) {
    const old = south.gates.find((g) => g.x === b.x && g.y === b.y);
    south.gates = south.gates.filter((g) => g !== old);
    const levels = [[WQ.bridgeBuilt, T.BRIDGE_H], [OPEN, T.BROKEN_BRIDGE]];
    if (old) levels.push([OASIS_FULL, old.open]);
    south.gates.push({ x: b.x, y: b.y, levels, open: T.BRIDGE_H, closed: old ? old.closed : south.tiles[b.y * south.w + b.x] });
  }
  south.gateAt = new Map(south.gates.map((g) => [g.y * south.w + g.x, g]));
  // 10. ユノハの 宿屋の 1階の 右上の すみに 2階への 上り階だん
  const north = maps.north;
  north.tiles[INN_STAIRS.y * north.w + INN_STAIRS.x] = T.STAIRS_UP;
  north.warps.push({ x: INN_STAIRS.x, y: INN_STAIRS.y, to: { map: 'fq_inn2', x: INN2_POS.arrive.x, y: INN2_POS.arrive.y, dir: 'right' } });
  // 町の 人・物
  for (const [id, name, sprite, script, mid, base, dx, dy, o] of WORK_NPCS) {
    const m = maps[mid];
    const { fixed, ...opts } = o;
    // fixed … その いちに 置く（ステージ・池の 中・見晴らし台）。ほかは ちかくの あいた ゆかを さがす
    const [x, y] = fixed ? [base.x + dx, base.y + dy] : openSpot(m, base.x + dx, base.y + dy);
    m.npcs.push(npc(id, name, [x, y], sprite, script, { dir: 'down', ...opts }));
  }
  return maps;
}

// カモメ港（地図の いちの たしかめ。テスト）
export const BALL_BEACH = { x: PORT.x, y: PORT.y + 19, w: PORT.w, h: 3 };
