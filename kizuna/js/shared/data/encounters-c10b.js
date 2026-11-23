// 第3部 第2章 第2幕「青と白」の てきの くみあわせ（B: 戦い。encounters.js で まぜる）
// 出現表の 名前は A（マップ）との 約束（docs/plan-part3-c10b.md の 14-4）
//   t10b_blue_wet … 水鏡の うら（c10b_blue1）の 水の 高さ「上」・「中」（水の 魔物が 多い。Lv109〜110）
//   t10b_blue_dry … 水の 高さ「下」（砂の 魔物が 多い）。かれた 間（c10b_blue2）は 魔物が 出ない
//   白の 道（氷の 下の 道）は ふつうの 魔物が 出ない（こっそりの じゃまを しない）。見はりに 見つかった 時だけ 決まった 戦い
// ふつうの 戦いの 長さ（14-3）: 勇者 ＋ ゲームと おなじ 作りの 酒場の 仲間 3人で 90秒 いない・見はりの 戦いは 120秒 いない（tools/sim-ch9-field.mjs）
import { C10B_GECKO, C10B_OWL, C10B_OWL_FAKE } from './monsters-c10b.js?v=b63ba00e848c';
import { C10B_BATTLE_B as C10B_BATTLE, C10B_TRACKS_B as C10B_TRACKS } from '../maps/c10b-flags.js?v=b63ba00e848c';
// 負けた 時の ヒントの 文（boss-hints-c10b.js が mergeBossHints を よぶ）
import './boss-hints-c10b.js?v=b63ba00e848c';

export const ENCOUNTERS_C10B = {
  t10b_blue_wet: [
    { w: 5, group: [['c10b_spirit', 1, 2]] },
    { w: 4, group: [['c10b_fish', 1, 2]] },
    { w: 3, group: [['c10b_spirit', 1, 1], ['c10b_fish', 1, 1]] },
    { w: 2, group: [['c10b_fish', 1, 1], ['c10b_crab', 1, 1]] },
  ],
  t10b_blue_dry: [
    { w: 5, group: [['c10b_crab', 1, 2]] },
    { w: 4, group: [['c10b_sand', 1, 2]] },
    { w: 3, group: [['c10b_crab', 1, 1], ['c10b_sand', 1, 1]] },
    { w: 2, group: [['c10b_sand', 1, 1], ['c10b_spirit', 1, 1]] },
  ],
};
export const C10B_ZONES = Object.keys(ENCOUNTERS_C10B);

// 見はりに 見つかった 時の 決まった 戦い（にげられる。勝っても 負けても 部屋の 入口に もどるのは A班。お金は へらない … loseOk）
//   曲は ふつうの 戦いの 曲（bgm なし）
//   watch1 … つららフクロウ 2わ（1まいめ）・watch2 … ゆきあかりオオカミ 2ひき（2まいめ）・watch3 … 氷のよろい ＋ つららフクロウ（2まいめの おく）
export const C10B_WATCH = {
  [C10B_BATTLE.watch[0]]: [['c10b_iceowl', 2, 2]],
  [C10B_BATTLE.watch[1]]: [['c10b_wolf', 2, 2]],
  [C10B_BATTLE.watch[2]]: [['c10b_armor', 1, 1], ['c10b_iceowl', 1, 1]],
};

// きまった 戦い（docs/plan-part3-c10b.md の 14-4）。台本は ['battle', 'c10b_gecko'] など
//   c10b_gecko … サー・ゲッコー（かれた 間。Lv111）
//   c10b_owl … かいとう シロフクロウ（月の 間。Lv113）。本物 1 ＋ まぼろし 3（はじめは 2人 だけ 見える。HP 半分で 4人目）
//   スピカは かならず 出る（てらす・星のうた も）。曲は F班の c10b_gecko・c10b_owl
export const FIXED_C10B = {
  [C10B_BATTLE.blue]: { group: [[C10B_GECKO, 1, 1]], bg: 'c10b_dry', bgm: C10B_TRACKS.gecko, canFlee: false, boss: true },
  [C10B_BATTLE.white]: { group: [[C10B_OWL, 1, 1], [C10B_OWL_FAKE, 3, 3]], bg: 'c10b_moon', bgm: C10B_TRACKS.owl, canFlee: false, boss: true },
  ...Object.fromEntries(Object.entries(C10B_WATCH).map(([id, group]) => [id, { group, bg: 'c10b_ice', canFlee: true, loseOk: true }])),
};

// 出現表 → 戦いの 背景（client/render/c10b-bg.js）
export const ZONE_BG_C10B = { t10b_blue_wet: 'c10b_mirror', t10b_blue_dry: 'c10b_mirror' };
