// 第2部 第8章 第4幕「時のはざま」の てきの くみあわせ（B: 戦い。encounters.js で まぜる）
// 出現表の 名前は A（マップ）との 約束（docs/plan-ch8.md の 9-2）
//   t8r_wing … 4つの つばさ（千年前と 今の がわ。おすすめ Lv89〜91）
//   t8r_last … 最後の 回廊（おすすめ Lv92〜94）。広間・ためしの 部屋・休み所・さいごの 場所は 魔物が 出ない（A の マップ）
// 手下の 魔物 5しゅ（どれも 仲間に なる）。重みで 出やすさを きめて、配合で 足りない ランクに 入れる（tools/gen-monster-ranks.mjs）
//   めやす: 時のたましい … 30%いじょう（F）／時かげスカラベ … 12〜20%（E）／時くいガ … 12〜20%（D）／チクタクワニ … 6〜12%（C）／すなどけいの騎士 … 6〜12%（A）
//   第8章の B〜S は 2わりまで（test/monsters-r43a.test.js）なので、第4幕の B〜S は すなどけいの騎士だけ
import { C8_GATE1, C8_GATE2, C8_GATEKEEPER, C8_TRIAL_GUARD, C8_TRIAL_DUEL, C8_SOLITUS, C8_WIND, C8_PUFF, C8_SHADOW } from './monsters-c8r.js?v=e32f6eb85bad';

export const ENCOUNTERS_C8R = {
  t8r_wing: [
    { w: 5, group: [['toki_soul', 1, 2], ['kage_scarab', 0, 1]] },
    { w: 4, group: [['toki_soul', 2, 3]] },
    { w: 3, group: [['kage_scarab', 1, 1], ['toki_soul', 1, 1]] },
    { w: 3, group: [['toki_moth', 1, 2], ['toki_soul', 1, 1]] },
    { w: 1, group: [['toki_moth', 1, 1], ['kage_scarab', 1, 1]] },
    // 第8章 第3幕の 魔物も 少し（ランクが かわらない くらい）
    { w: 1, group: [['tonkachi_bro', 1, 1], ['toki_soul', 1, 1]] },
  ],
  t8r_last: [
    { w: 3, group: [['chikutaku_wani', 1, 1], ['toki_moth', 1, 1], ['toki_soul', 1, 1]] },
    { w: 3, group: [['toki_moth', 1, 1], ['toki_soul', 1, 1]] },
    { w: 2, group: [['sand_knight', 1, 1], ['toki_soul', 1, 1]] },
    { w: 2, group: [['sand_knight', 1, 1], ['kage_scarab', 1, 1]] },
    { w: 3, group: [['toki_soul', 1, 2], ['kage_scarab', 1, 1]] },
    { w: 2, group: [['chikutaku_wani', 1, 1], ['kage_scarab', 1, 1]] },
    { w: 2, group: [['toki_soul', 2, 3]] },
    { w: 1, group: [['dodeka_killer', 1, 1], ['toki_soul', 1, 1]] },
  ],
};

// きまった 戦い（docs/plan-ch8.md の 9-2）。台本は ['showMon', id] → ['battle', id]
//   c8_gate1  … 時の門番フリーゾン 第1形態（広間の 1回目。HP 6わりか 6回 動くと 去る … 勝ち。全滅すると 物語が すすまない だけ）
//   c8_gate2  … 第2形態（広間の 2回目。HP 半分で 去る）
//   c8_gatekeeper … 第3形態 → 最終形態（Step 7 の さいご。Lv92。本当の 戦い）
//   c8_trial_guard … 月のつばさの 心の ためし「守りぬく」（やみの風が 8回 ふくまで ともしびを 守る。showMon の え は やみの風）
//   c8_trial_duel  … 氷のつばさの 心の ためし「一騎うち」（リオンと 見くだす影の 1対1。家族は おうえん）
//   c8_solitus … ソリトゥスの 本当の すがた（Step 8 の さいご。Lv95。3だん。段の 間で 記録 … しるし c8s_p2・c8s_p3）
//   曲は F班の id（c8r_gate・c8r_solitus。曲が まだ ない ときは 今の 戦いの 曲）
export const FIXED_C8R = {
  [C8_GATE1]: { group: [[C8_GATE1, 1, 1]], bg: 'rift_hall', bgm: 'c8r_gate', canFlee: false, boss: true },
  [C8_GATE2]: { group: [[C8_GATE2, 1, 1]], bg: 'rift_hall', bgm: 'c8r_gate', canFlee: false, boss: true },
  [C8_GATEKEEPER]: { group: [[C8_GATEKEEPER, 1, 1]], bg: 'rift_hall', bgm: 'c8r_gate', canFlee: false, boss: true },
  [C8_TRIAL_GUARD]: { group: [[C8_WIND, 1, 1], [C8_PUFF, 2, 2]], bg: 'rift_moon', bgm: 'c8r_wing', canFlee: false, boss: true },
  [C8_TRIAL_DUEL]: { group: [[C8_SHADOW, 1, 1]], bg: 'rift_ice', bgm: 'c8r_wing', canFlee: false, boss: true },
  [C8_SOLITUS]: { group: [[C8_SOLITUS, 1, 1]], bg: 'rift_core', bgm: 'c8r_solitus', canFlee: false, boss: true },
};

// 出現表 → 戦いの 背景（つばさは 時の すなの 川の 上の 回廊・最後の 回廊は くずれかけた 時計の 回廊。client/render/c8r-bg.js）
export const ZONE_BG_C8R = { t8r_wing: 'rift_wing', t8r_last: 'rift_last' };
