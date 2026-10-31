// 第2部 第7章 第1幕「緑の王国」の てきの くみあわせ（B: 戦い。encounters.js で まぜる）
// 出現表の 名前は A（マップ）との 約束（docs/plan-ch7.md の 3）
//   t7_kingdom … 千年前の コガネ地方の フィールド（緑の王国の 川と 森。おすすめ Lv68〜70）
//   t7_temple  … みどりの水の神殿 1〜8階（おすすめ Lv70〜72）。休み所・ボスの 間は 魔物が 出ない（A の マップ）
// 手下の 魔物 10しゅ（どれも 仲間に なる）。重みで 出やすさを きめて、配合で 足りない ランクに 入れる（tools/gen-monster-ranks.mjs）
//   めやす: ノコノコ・使いのカラス … 20%いじょう（F）／パックンフラワー・トランプの兵・うずしおウツボ … 12〜20%（E）／
//           行進のほうき・ゲッソー … 12〜20%（D）／テレサ … 6〜12%（C）／水のようま … 12〜20%（B）／のろいだま … 6〜12%（A）
import { C7_GATE, C7_GATE_B, C7_TEMPLE, C7_SHELL } from './monsters-c7.js?v=a5c15ff5e061';

export const ENCOUNTERS_C7 = {
  t7_kingdom: [
    { w: 5, group: [['nokonoko', 1, 2], ['crow_messenger', 0, 1]] },
    { w: 4, group: [['crow_messenger', 1, 2], ['nokonoko', 1, 1]] },
    { w: 4, group: [['card_soldier', 1, 2], ['crow_messenger', 0, 1]] },
    { w: 3, group: [['pakkun', 1, 2], ['nokonoko', 0, 1]] },
    { w: 3, group: [['nokonoko', 2, 3]] },
    { w: 3, group: [['crow_messenger', 2, 2], ['card_soldier', 1, 1]] },
    { w: 2, group: [['pakkun', 1, 1], ['nokonoko', 1, 1]] },
  ],
  t7_temple: [
    { w: 3, group: [['uzu_eel', 1, 1], ['gesso', 0, 1]] },
    { w: 2, group: [['march_broom', 1, 2]] },
    { w: 3, group: [['gesso', 1, 2], ['march_broom', 0, 1]] },
    { w: 4, group: [['water_youma', 1, 1], ['march_broom', 1, 1]] },
    { w: 2, group: [['teresa', 1, 1], ['gesso', 1, 1]] },
    { w: 2, group: [['water_youma', 1, 2], ['uzu_eel', 0, 1]] },
    { w: 3, group: [['curse_lump', 1, 1], ['teresa', 0, 1]] },
    { w: 2, group: [['pakkun', 1, 1], ['uzu_eel', 1, 1]] },
    { w: 2, group: [['uzu_eel', 1, 1], ['gesso', 1, 1], ['water_youma', 1, 1]] },
    { w: 1, group: [['teresa', 1, 1], ['uzu_eel', 1, 1]] },
    { w: 1, group: [['curse_lump', 1, 1], ['water_youma', 1, 1]] },
  ],
};

// きまった 戦い（docs/plan-ch7.md の 3）。台本は ['showMon', id] → ['battle', id]
//   c7_gate   … 水門の ウツボきょうだい（Step 1 の さいごの 中ボス。Lv70）。2ひきで 1組
//   c7_temple … うずの魔女オクタリア（みどりの水の神殿の ボス。Lv72。2だん）。首の 声の貝（べつの 敵）と いっしょに 出る
//   どちらも 曲 boss6。負けた ときは 今までの ボスと おなじ
export const FIXED_C7 = {
  [C7_GATE]: { group: [[C7_GATE, 1, 1], [C7_GATE_B, 1, 1]], bg: 'past_field', bgm: 'boss6', canFlee: false, boss: true },
  [C7_TEMPLE]: { group: [[C7_TEMPLE, 1, 1], [C7_SHELL, 1, 1]], bg: 'morgana_hall', bgm: 'boss6', canFlee: false, boss: true },
};

// 出現表 → 戦いの 背景（緑の王国は 千年前の 草原・神殿は 水の 神殿の 石の かべ）
export const ZONE_BG_C7 = { t7_kingdom: 'past_field', t7_temple: 'sand_temple' };
