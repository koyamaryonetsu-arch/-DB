// お仕事いらい板の たのまれごと 27〜29（第74回 D班。docs/plan-ch8.md の 6-3）の 人・しらべる 所
//
// ・第8章 第2幕で 千年前の 海に 着いた あと（c8_abyss）、今の 時代の 場所に たのみたい 人が 立つ（千年前には 入れない）
// ・maps/work-quests.js の attachWorkQuests の さいごに attachWorkQuests5 を よぶ（maps/index.js は かえない）
// ・だいほんは data/sidequests-work5.js、人と 物の 絵は client/render/work5-art.js
// ・第66回の 伝説の 職業に つながる 系統（18〜26 と かさならない）:
//   ソードマスターか魔剣士 → 光と闇の剣神・黒の組織 → あの方・社ちく → ブラックきぎょうの星 → 働き方改革の星
// ・まだ たのまれごとが ない 場所に 置く（風の海の 海鳴りの小島・コガネ地方の 北の海辺・シロガネ地方の 白銀の湖の 西の 岸）
//
// 27. 海鳴りの小島の、かげぼうしどろぼう（ソードマスターか魔剣士の 系統。風の海の 海鳴りの小島）
// 28. 北の海辺の、ハサミ団（黒の組織の 系統。コガネ地方の 北の海辺）
// 29. 白銀の湖の、ねむらない氷の像づくり（社ちくの 系統。シロガネ地方の 白銀の湖の 西の 岸）
import { npc } from './npc.js?v=d89f0f9d101a';
import { openSpot } from './labyrinth.js?v=d89f0f9d101a';

// ───────────── フラグ（セーブに のこるので かえない）─────────────
// 第8章 第2幕の「千年前の 海に 着いた」（A班の 物語の フラグ。docs/plan-ch8.md の 6-2）
export const WQ5_OPEN = 'c8_abyss';
const OPEN = WQ5_OPEN;
export const WQ5 = {
  // 27. かげぼうしどろぼう（guard … 月の 夜に かげの 魔物と 戦って かげを 取り返した）
  shdStart: 'fq_shd_start', shdGuard: 'fq_shd_guard', shdDone: 'fq_shd_done',
  // 28. ハサミ団（fight … かくれ岩の 用心棒と 戦った・solved …「あの方」として 団長に 命じた）
  gangStart: 'fq_gang_start', gangFight: 'fq_gang_fight', gangSolved: 'fq_gang_solved', gangDone: 'fq_gang_done',
  // 29. ねむらない 氷の 像づくり（rest … 親方が 休むと 決めた）
  iceStart: 'fq_ice_start', iceRest: 'fq_ice_rest', iceDone: 'fq_ice_done',
};
// 話を 聞いた（3人ずつ）・決めた（3つずつ）
export const SHD_VOICES = ['fq_shd_v1', 'fq_shd_v2', 'fq_shd_v3']; // かげを とられた 男の子・キャンプの 女の子・つりに 来た 漁師
export const SHD_STEPS = ['fq_shd_s1', 'fq_shd_s2', 'fq_shd_s3']; // 待つ 所・光の 剣・闇の 剣
export const GANG_VOICES = ['fq_gang_v1', 'fq_gang_v2', 'fq_gang_v3']; // しお作りの 手伝い・ハサミ団の ちびガニ・海辺の 子ども
export const GANG_STEPS = ['fq_gang_s1', 'fq_gang_s2', 'fq_gang_s3']; // 近づき方・名のり方・命令
export const ICE_VOICES = ['fq_ice_v1', 'fq_ice_v2', 'fq_ice_v3']; // 職人・親方の むすこ・むかしの 親方
export const ICE_STEPS = ['fq_ice_s1', 'fq_ice_s2', 'fq_ice_s3']; // まず 言う こと・仕事の 時間・仕事の 分け方

// 27. 海鳴りの小島の 洞窟の 入り口の 岩かげ（いつも ある。洞窟の 入り口〈18,61〉は ふさがない）
export const SHADE_SPOT = { x: 16, y: 62 };
// 28. 北の海辺の 東の 岩場の 西の はしの ハサミ団の かくれ岩（いつも ある。岩の かげに かくれない 所）
export const DEN_SPOT = { x: 31, y: 9 };
// 29. 白銀の湖の 西の 岸の 氷の 像（けずりかけ → できあがり。おなじ 所）
export const STATUE_SPOT = { x: 9, y: 62 };

const SHOWN = { all: [OPEN] };
const until = (done) => ({ all: [OPEN], not: [done] });
const after = (done) => ({ all: [OPEN, done] });
// [id, 名前, 絵, だいほん, マップ, x, y, opts]（fixed … その いちに 置く。ほかは ちかくの あいた ゆかを さがす）
const WORK5_NPCS = [
  // 27. 海鳴りの小島: キャンプの 先生・洞窟の 入り口の 岩かげ（いつも ある）・かげを とられた 男の子・キャンプの 女の子・つりに 来た 漁師
  ['fq_shd_cave', '洞窟の入り口の岩かげ', 'mon:fq_shade_rock', 'fq_shd_cave', 'sea', SHADE_SPOT.x, SHADE_SPOT.y, { show: SHOWN, fixed: true }],
  ['fq_shd_host', 'キャンプの先生ミサキ', 'fq_camp_teacher', 'fq_shd_host', 'sea', 13, 63, { show: SHOWN }],
  ['fq_shd_v1', 'かげをとられた男の子ソウ', 'boy', 'fq_shd_v1', 'sea', 15, 65, { show: SHOWN }],
  ['fq_shd_v2', 'キャンプの女の子ヒナ', 'girl', 'fq_shd_v2', 'sea', 20, 64, { show: SHOWN, wander: 1 }],
  ['fq_shd_v3', 'つりに来た漁師', 'fisher', 'fq_shd_v3', 'sea', 22, 62, { show: SHOWN }],
  // 28. 北の海辺: しお作りの じいさん・ハサミ団の かくれ岩（いつも ある）・手伝い・ちびガニ・海辺の 子ども・（すんだ あと）しお作り団の 団長
  ['fq_gang_den', 'ハサミ団のかくれ岩', 'mon:fq_crab_den', 'fq_gang_den', 'south', DEN_SPOT.x, DEN_SPOT.y, { show: SHOWN, fixed: true }],
  ['fq_gang_host', 'しお作りのムサ', 'fq_salt_maker', 'fq_gang_host', 'south', 20, 8, { show: SHOWN }],
  ['fq_gang_v1', 'しお作りの手伝いファティマ', 'desert_f', 'fq_gang_v1', 'south', 16, 9, { show: SHOWN }],
  ['fq_gang_v2', 'ハサミ団のちびガニ', 'mon:armor_crab', 'fq_gang_v2', 'south', 38, 7, { show: until(WQ5.gangSolved), wander: 1 }],
  ['fq_gang_v3', '海辺の子どもサミル', 'desert_kid', 'fq_gang_v3', 'south', 26, 6, { show: SHOWN, wander: 1 }],
  ['fq_gang_boss', 'しお作り団の団長チョッキン', 'mon:crab_star', 'fq_gang_boss', 'south', 23, 9, { show: after(WQ5.gangSolved) }],
  // 29. 白銀の湖の 西の 岸: 見習い・親方・氷の 像（けずりかけ／できあがり）・職人・親方の むすこ・むかしの 親方
  ['fq_ice_block', 'けずりかけの氷の像', 'mon:fq_ice_block', 'fq_ice_block', 'north', STATUE_SPOT.x, STATUE_SPOT.y, { show: until(WQ5.iceDone), fixed: true }],
  ['fq_ice_dragon', '氷の竜の像', 'mon:fq_ice_dragon', 'fq_ice_dragon', 'north', STATUE_SPOT.x, STATUE_SPOT.y, { show: after(WQ5.iceDone), fixed: true }],
  ['fq_ice_host', '氷の像づくりの見習いシズク', 'fq_ice_kid', 'fq_ice_host', 'north', 7, 60, { show: SHOWN }],
  ['fq_ice_boss', '氷の像の親方ゴウ', 'fq_ice_master', 'fq_ice_boss', 'north', 8, 64, { show: SHOWN }],
  ['fq_ice_v1', '職人のトマ', 'snow_m', 'fq_ice_v1', 'north', 11, 65, { show: SHOWN }],
  ['fq_ice_v2', '親方のむすこリク', 'snow_kid', 'fq_ice_v2', 'north', 6, 62, { show: SHOWN, wander: 1 }],
  ['fq_ice_v3', 'むかし親方だったおじいさん', 'oldman', 'fq_ice_v3', 'north', 8, 57, { show: SHOWN }],
];
export const WORK5_NPC_IDS = WORK5_NPCS.map((r) => r[0]);

// maps/work-quests.js の attachWorkQuests から（ほかの マップが そろった あと）
export function attachWorkQuests5(maps) {
  for (const [id, name, sprite, script, mid, dx, dy, o] of WORK5_NPCS) {
    const m = maps[mid];
    const { fixed, ...opts } = o;
    const [x, y] = fixed ? [dx, dy] : openSpot(m, dx, dy);
    m.npcs.push(npc(id, name, [x, y], sprite, script, { dir: 'down', ...opts }));
  }
  return maps;
}
