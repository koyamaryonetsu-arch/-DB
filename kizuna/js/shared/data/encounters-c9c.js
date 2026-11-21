// 第3部 第1章 第3幕「さかさのピラミッド」の てきの くみあわせ（B: 戦い。encounters.js で まぜる）
// 出現表の 名前は A（マップ）との 約束（docs/plan-part3.md の 11-5）
//   t9c_river … 地下の川（c9c_river。Lv100）。大なまず・川べのガマ（暗いので 見えにくい。てらすで 消える）
//   t9c_pyr  … さかさのピラミッド 1〜2階（c9c_p1・c9c_p2。Lv100）
//   t9c_pyr2 … さかさのピラミッド 3〜4階（c9c_p3・c9c_p4。Lv100〜101）
// ふつうの 魔物 6しゅ（どれも 仲間に なる）。重みで 出やすさを きめて、ランクが ちらばる ように する（tools/gen-monster-ranks.mjs）
// ふつうの 戦いの 長さ（11-4）: 勇者 Lv100 ＋ 酒場の 仲間 3人で 90秒 いない（1〜2ひきの むれを 多めに）
import { C9C_NAZOKAKE, C9C_HIKKURI } from './monsters-c9c.js?v=8433acec5263';
import { C9C_BATTLE, C9C_TRACKS } from '../maps/c9c-flags.js?v=8433acec5263';
// 負けた 時の ヒントの 文（boss-hints-c9c.js が mergeBossHints を よぶ）
import './boss-hints-c9c.js?v=8433acec5263';

export const ENCOUNTERS_C9C = {
  t9c_river: [
    { w: 6, group: [['c9c_gama', 1, 2]] },
    { w: 3, group: [['c9c_namazu', 1, 1], ['c9c_gama', 0, 1]] },
    { w: 2, group: [['c9c_namazu', 1, 1]] },
  ],
  t9c_pyr: [
    { w: 6, group: [['c9c_bat', 1, 2]] },
    { w: 3, group: [['c9c_scarab', 1, 1], ['c9c_bat', 1, 1]] },
    { w: 2, group: [['c9c_scarab', 1, 2]] },
    { w: 1, group: [['c9c_mummy', 1, 1], ['c9c_bat', 0, 1]] },
  ],
  t9c_pyr2: [
    { w: 4, group: [['c9c_bat', 1, 2]] },
    { w: 3, group: [['c9c_mummy', 1, 1], ['c9c_scarab', 0, 1]] },
    { w: 2, group: [['c9c_golem', 1, 1]] },
    { w: 1, group: [['c9c_golem', 1, 1], ['c9c_bat', 1, 1]] },
    { w: 2, group: [['c9c_scarab', 1, 1], ['c9c_mummy', 1, 1]] },
  ],
};
export const C9C_ZONES = Object.keys(ENCOUNTERS_C9C);

// きまった 戦い（docs/plan-part3.md の 11-5）。台本は ['showMon', id] → ['battle', id]
//   c9c_riddle … なぞの番人 ナゾカケ（さかさのピラミッド 2階の おく。Lv101）
//   c9c_trio2  … ホシドロ一味と ヒックリカエール2号（音の 間。Lv102）
//   どちらも スピカは かならず 出る。曲は F班の id（C9C_TRACKS。曲が まだ ない ときは 今の しくみの まま）
export const FIXED_C9C = {
  [C9C_BATTLE.riddle]: { group: [[C9C_NAZOKAKE, 1, 1]], bg: 'c9c_pyramid', bgm: C9C_TRACKS.riddle, canFlee: false, boss: true },
  [C9C_BATTLE.trio2]: { group: [[C9C_HIKKURI, 1, 1]], bg: 'c9c_note', bgm: C9C_TRACKS.trio2, canFlee: false, boss: true },
};

// 出現表 → 戦いの 背景（地下の川・さかさのピラミッド。client/render/c9c-bg.js）
export const ZONE_BG_C9C = { t9c_river: 'c9c_river', t9c_pyr: 'c9c_pyramid', t9c_pyr2: 'c9c_pyramid' };
