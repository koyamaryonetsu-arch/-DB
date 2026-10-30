// 第2部 第6章 Step 6「時計塔の心臓」の てきの くみあわせ（B: 戦い。encounters.js で まぜる）
// 出現表の 名前は A（マップ）との 約束（docs/plan-ch6.md の 17）
//   t6_tower_high … 時計塔 6〜10階（千年前だけ。おすすめ Lv66〜68）。6階・9階の 休み所・10階の ボスの 間は 魔物が 出ない（A の マップ）
// 新しい 魔物 7しゅ（どれも 仲間に なる）。重みで 出やすさを きめて、配合で 足りない ランクに 入れる（tools/gen-monster-ranks.mjs）
//   めやす: 時計ゆうれい・秒針の精・ぜんまい草・ねじまき小あくま・からくりがいこつ … 12〜20%（B・A）／かねの精 … 6〜12%（A）／大時計の番人 … 6%より 少ない（S）
// 5階までの 魔物（ころがり歯車・キラー）も 少し まじる
import { TOKI_PHANTOM_BASES, tokiPhantomId, ZENMAI, RION_SPARS } from './monsters-tokei6.js';

export const ENCOUNTERS_TOKEI6 = {
  t6_tower_high: [
    { w: 5, group: [['tokei_ghost', 1, 2], ['zenmai_fern', 0, 1]] },
    { w: 4, group: [['zenmai_fern', 1, 2], ['wind_devil', 0, 1]] },
    { w: 4, group: [['clock_bones', 1, 2], ['second_sprite', 0, 1]] },
    { w: 4, group: [['wind_devil', 1, 2], ['second_sprite', 1, 1]] },
    { w: 3, group: [['bell_sprite', 1, 1], ['clock_bones', 1, 1]] },
    { w: 3, group: [['second_sprite', 1, 2], ['zenmai_fern', 0, 1]] },
    { w: 2, group: [['bell_sprite', 1, 1], ['cog_roller', 1, 1], ['killer', 0, 1]] },
    { w: 2, group: [['killer', 1, 1], ['clock_bones', 1, 1]] },
    { w: 1, group: [['clock_golem', 1, 1], ['bell_sprite', 0, 1]] },
  ],
};

// きまった 戦い（docs/plan-ch6.md の 17）
//   zenmai … 10階の ボス。A が 台本で ['showMon', 'zenmai'] → ['battle', 'zenmai']。曲 boss6・背景 tokei。負けた ときは 今までの ボスと おなじ
//   rion_spar1〜3 … リオンの けいこ（千年前の 泉の 里。solo … 1人で 戦う〈world/battles.js の startFixedBattle〉・負けても よい）
//   toki_phantom … 止まった時の間の 時のまぼろし（1日ごとに 第6章の ボスの どれか。pick … その 日の むれ。world/tokei-phantom.js）。
//                  負けても よい。勝つと 1日1回 ★5の 素材（world/tokei-phantom.js の tokiPhantomAfter）
const SPAR = (sp) => ({ group: [[sp, 1, 1]], bg: 'past_field', bgm: 'boss', canFlee: false, loseOk: true, boss: true, solo: true, spar: true });
export const FIXED_TOKEI6 = {
  [ZENMAI]: { group: [[ZENMAI, 1, 1]], bg: 'tokei', bgm: 'boss6', canFlee: false, boss: true },
  rion_spar1: SPAR(RION_SPARS[0]),
  rion_spar2: SPAR(RION_SPARS[1]),
  rion_spar3: SPAR(RION_SPARS[2]),
  toki_phantom: {
    group: [[tokiPhantomId(ZENMAI), 1, 1]], bg: 'tokei', bgm: 'boss6', canFlee: false, boss: true, loseOk: true,
    pick: (now) => [[tokiPhantomId(tokiPhantomBase(now)), 1, 1]],
  },
};

// その 日の 時のまぼろし（日本の 1日。0時に かわる）
export const JST = 9 * 60 * 60 * 1000;
export const dayIndexOf = (now) => Math.floor((Number(now) + JST) / 86400000);
export const dayKeyOf = (now) => new Date(dayIndexOf(now) * 86400000).toISOString().slice(0, 10);
export function tokiPhantomBase(now) {
  const n = TOKI_PHANTOM_BASES.length;
  return TOKI_PHANTOM_BASES[((dayIndexOf(now) % n) + n) % n];
}

// 出現表 → 戦いの 背景
export const ZONE_BG_TOKEI6 = { t6_tower_high: 'tokei' };
