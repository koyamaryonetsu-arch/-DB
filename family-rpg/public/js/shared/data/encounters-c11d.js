// 第3部 第3章 第4幕「かがやきの女王と、八つめの音」の てきの くみあわせ（B: 戦い。encounters.js で まぜる）
// 出現表の 名前は A（マップ）との 約束（docs/plan-part3-c11d.md の 20-4・20-6。表の 名前は B班が きめた）
//   かがやきの 塔の 1〜3階で 出る（なぞの しかけの 上では 出さない … A班）。4階（音の 間）と いただき（玉座の 間）では 出ない
//   t11d_tower1 … 塔 1階 星座の 間（c11d_tower1。Lv124）
//   t11d_tower2 … 塔 2階 月かげの 間（c11d_tower2・c11d_tower2b。Lv124〜125）
//   t11d_tower3 … 塔 3階 かげの 間（c11d_tower3。Lv125〜126）
// ふつうの 戦いの 長さ（20-5）: 超級職 4人で 1回 30〜50秒（tools/sim-ch9-field.mjs の SUPER=1）
import { C11D_MIRROR, C11D_MOON, C11D_QUEEN } from './monsters-c11d.js';
import { C11D_BATTLE_B as C11D_BATTLE, C11D_TRACKS_B as C11D_TRACKS } from '../maps/c11d-flags.js';
// 負けた 時の ヒントの 文（boss-hints-c11d.js が mergeBossHints を よぶ）
import './boss-hints-c11d.js';

export const ENCOUNTERS_C11D = {
  t11d_tower1: [
    { w: 5, group: [['c11d_knight', 1, 2]] },
    { w: 4, group: [['c11d_crown', 1, 2]] },
    { w: 3, group: [['c11d_dazzle', 1, 1], ['c11d_knight', 0, 1]] },
    { w: 2, group: [['c11d_crown', 1, 1], ['c11d_dazzle', 1, 1]] },
  ],
  t11d_tower2: [
    { w: 5, group: [['c11d_hmirror', 1, 2]] },
    { w: 4, group: [['c11d_dawn', 1, 2]] },
    { w: 3, group: [['c11d_hmirror', 1, 1], ['c11d_dawn', 1, 1]] },
    { w: 2, group: [['c11d_knight', 1, 1], ['c11d_crown', 1, 1]] },
  ],
  t11d_tower3: [
    { w: 5, group: [['c11d_shard', 1, 2]] },
    { w: 4, group: [['c11d_nmirror', 1, 2]] },
    { w: 3, group: [['c11d_shard', 1, 1], ['c11d_dawn', 1, 1]] },
    { w: 2, group: [['c11d_nmirror', 1, 1], ['c11d_hmirror', 0, 1]] },
  ],
};
export const C11D_ZONES = Object.keys(ENCOUNTERS_C11D);

// きまった 戦い（docs/plan-part3-c11d.md の 20-6）。台本は ['battle', 'c11d_duo']・['battle', 'c11d_queen']
//   c11d_duo   … 鏡と月の使い（ミラーレと オボロ。4階 音の 間。Lv125）
//   c11d_queen … かがやきの女王ポラリス（いただき 玉座の 間。Lv126）
//   にげられない。スピカは かならず 出る（てらす・星のうた も）。曲は F班の c11d_duo・c11d_queen（後半は c11d_queen2 … 画面の 状態 queenStage）
export const FIXED_C11D = {
  [C11D_BATTLE.duo]: { group: [[C11D_MIRROR, 1, 1], [C11D_MOON, 1, 1]], bg: 'c11d_sound', bgm: C11D_TRACKS.duo, canFlee: false, boss: true },
  [C11D_BATTLE.queen]: { group: [[C11D_QUEEN, 1, 1]], bg: 'c11d_throne', bgm: C11D_TRACKS.queen, canFlee: false, boss: true },
};

// 出現表 → 戦いの 背景（client/render/c11d-bg.js）
export const ZONE_BG_C11D = { t11d_tower1: 'c11d_tower', t11d_tower2: 'c11d_tower', t11d_tower3: 'c11d_tower' };
