// 第51回 C3（o9）: 幻の職業（宇宙一のおかん・はかいと創造の神・夢のスタジアム鉄道・天候の神）の 技の え（はなつ ところ）。
// render/axfx.js が useAxGroup('o9', AX_O9, AX_O9_FINE) で とうろく する。この ファイルは C3 だけが さわる
// ・時間（tier・charge.kind/ms・hit・len・party）と 技の つなぎは shared/data/ax-time-o9.js（ここには 書かない）
// ・カットインの 帯・画面の くらさは つかわない。画面の 文字に 漢字は 出さない（「人」だけ OK）
// ・幻の職業は いちばん 上の 段（legend の 予算）。つぶが 少ない ときは axfx-o4-kit.js の finish が 命中に きらきらを 足す
// ・ファイルを 分けた:
//     axfx-o9-kit.js     … o9 の つぶ（空・雨・太陽・雲・ふきだし・銀河・消しゴム・装備・球場・観客・にじ・ざぶとん）と 足しかた
//     axfx-o9-okan.js    … 宇宙一のおかん
//     axfx-o9-chaos.js   … はかいと創造の神
//     axfx-o9-stadium.js … 夢のスタジアム鉄道
//     axfx-o9-weather.js … 天候の神
import { finish } from './axfx-o4-kit.js?v=060276fb0270';
import { AX_O9_KIT_FINE } from './axfx-o9-kit.js?v=060276fb0270';
import { AX_O9_OKAN } from './axfx-o9-okan.js?v=060276fb0270';
import { AX_O9_CHAOS } from './axfx-o9-chaos.js?v=060276fb0270';
import { AX_O9_STADIUM } from './axfx-o9-stadium.js?v=060276fb0270';
import { AX_O9_WEATHER } from './axfx-o9-weather.js?v=060276fb0270';

export const AX_O9 = Object.fromEntries(Object.entries({
  ...AX_O9_OKAN,
  ...AX_O9_CHAOS,
  ...AX_O9_STADIUM,
  ...AX_O9_WEATHER,
}).map(([k, d]) => [k, finish(d)]));

export const AX_O9_FINE = {
  ...AX_O9_KIT_FINE,
};
