// 第3部 第1章 第1幕「星ふるえの夜」の てきの くみあわせ（B: 戦い。encounters.js で まぜる）
// 出現表の 名前は A（マップ）との 約束（docs/plan-part3.md の 9-4 と B班の 実装メモ）
//   t9a_forest … 星ふるえの森（c9a_forest。おすすめ Lv96〜97）。くぼ地（c9a_crater）は 魔物が 出ない
//   t9a_b1〜t9a_b4 … 星の石の地下道 地下1〜4階（c9a_b1〜c9a_b4。おすすめ Lv97〜98）。くらやみ虫は 地下3階から
//     （くらやみ虫は A班の フィールドで 暗い マスだけを 歩く。monsters-c9a.js の darkOnly）
// ふつうの 魔物 6しゅ（どれも 仲間に なる）。重みで 出やすさを きめて、ランクが ちらばる ように する（tools/gen-monster-ranks.mjs）
//   めやす: 星くずウルフ（森）・こけ玉（地下道）… 30%いじょう（F）／星くずキノコ … 20〜30%（E）／星くずランプの精 … 12〜20%（D）／
//     くらやみ虫 … 6〜12%（C）／石の子ども … 6〜12%（A）。第3部 第1章の B〜S は 石の子どもだけ
import { C9A_SUITORU, C9A_HOSHIMORI, C9A_NOZZLE } from './monsters-c9a.js?v=b3f22aad5877';
import { C9A_BATTLE, C9A_TRACKS } from '../maps/c9a-flags.js?v=b3f22aad5877';
// 負けた 時の ヒントの 文（E班の しくみに まぜる。boss-hints-c9a.js が mergeBossHints を よぶ）
import './boss-hints-c9a.js?v=b3f22aad5877';

export const ENCOUNTERS_C9A = {
  t9a_forest: [
    { w: 5, group: [['c9a_star_wolf', 1, 2]] },
    { w: 4, group: [['c9a_star_wolf', 2, 3]] },
    { w: 4, group: [['c9a_star_kinoko', 1, 2], ['c9a_star_wolf', 1, 1]] },
    { w: 3, group: [['c9a_star_lamp', 1, 1], ['c9a_star_wolf', 1, 1]] },
    { w: 2, group: [['c9a_star_kinoko', 1, 1], ['c9a_star_lamp', 1, 1]] },
  ],
  t9a_b1: [
    { w: 5, group: [['c9a_kokedama', 1, 2]] },
    { w: 3, group: [['c9a_kokedama', 1, 1], ['c9a_star_kinoko', 1, 1]] },
    { w: 3, group: [['c9a_kokedama', 2, 2], ['c9a_star_lamp', 1, 1]] },
    { w: 1, group: [['c9a_ishinoko', 1, 1], ['c9a_kokedama', 1, 2]] },
  ],
  t9a_b2: [
    { w: 5, group: [['c9a_kokedama', 1, 2]] },
    { w: 3, group: [['c9a_kokedama', 1, 1], ['c9a_star_kinoko', 1, 1]] },
    { w: 3, group: [['c9a_kokedama', 2, 2], ['c9a_star_lamp', 1, 1]] },
    { w: 2, group: [['c9a_ishinoko', 1, 1], ['c9a_kokedama', 1, 2]] },
  ],
  t9a_b3: [
    { w: 4, group: [['c9a_kokedama', 1, 2]] },
    { w: 3, group: [['c9a_kokedama', 2, 2], ['c9a_star_lamp', 1, 1]] },
    { w: 2, group: [['c9a_yamimushi', 1, 1], ['c9a_kokedama', 1, 2]] },
    { w: 2, group: [['c9a_ishinoko', 1, 1], ['c9a_kokedama', 1, 2]] },
    { w: 2, group: [['c9a_kokedama', 1, 1], ['c9a_star_kinoko', 1, 1]] },
  ],
  t9a_b4: [
    { w: 4, group: [['c9a_kokedama', 1, 2]] },
    { w: 3, group: [['c9a_kokedama', 2, 2], ['c9a_star_lamp', 1, 1]] },
    { w: 2, group: [['c9a_yamimushi', 1, 1], ['c9a_kokedama', 1, 2]] },
    { w: 2, group: [['c9a_ishinoko', 1, 1], ['c9a_kokedama', 1, 2]] },
    { w: 1, group: [['c9a_yamimushi', 1, 1], ['c9a_ishinoko', 1, 1], ['c9a_kokedama', 1, 1]] },
  ],
};
export const C9A_ZONES = Object.keys(ENCOUNTERS_C9A);

// きまった 戦い（docs/plan-part3.md の 9-4）。台本は ['showMon', id] → ['battle', id]（showMon の 魔物は C9A_BOSS_MON）
//   c9a_trio  … 3人組と スイトール1号（くぼ地。Lv96）。すいこみ口（べつの 的）と いっしょ。星の子の 光が 3つ へると 負け
//   c9a_trial … ホシモリの ともしびの ためし（地下4階。Lv98）。夜明けまで たえると 勝ち・全員の ともしびが 消えると 負け
//   曲は F班の id（maps/c9a-flags.js の C9A_TRACKS。曲が まだ ない ときは 今の しくみの まま）
export const FIXED_C9A = {
  [C9A_BATTLE.trio]: { group: [[C9A_SUITORU, 1, 1], [C9A_NOZZLE, 1, 1]], bg: 'c9a_forest', bgm: C9A_TRACKS.trio, canFlee: false, boss: true },
  [C9A_BATTLE.trial]: { group: [[C9A_HOSHIMORI, 1, 1]], bg: 'c9a_cave', bgm: C9A_TRACKS.trial, canFlee: false, boss: true },
};

// 出現表 → 戦いの 背景（星ふるえの森・星の石の地下道。client/render/c9a-bg.js）
export const ZONE_BG_C9A = { t9a_forest: 'c9a_forest', t9a_b1: 'c9a_cave', t9a_b2: 'c9a_cave', t9a_b3: 'c9a_cave', t9a_b4: 'c9a_cave' };
