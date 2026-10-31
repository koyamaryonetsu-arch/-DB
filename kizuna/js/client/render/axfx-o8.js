// 第51回 C2（o8）: 幻の職業 4つ（名探てい王・銀河の女王・大魔導王・天下むそうの剣聖）の 技の え（はなつ ところ）。
// render/axfx.js が useAxGroup('o8', AX_O8, AX_O8_FINE) で とうろく する。この ファイルは C2 だけが さわる
// ・時間（tier・charge.kind/ms・hit・len・party）と 技の つなぎは shared/data/ax-time-o8.js に 書く（ここには 書かない）
// ・ここには 見た目だけ: { ox_〜: { charge: { color, color2 }, sfx, allyFx, play(fx, c) } }
// ・カットインの 帯・画面の くらさは つかわない（構えは みじかい ものだけ）。画面の 文字に 漢字は 出さない
// ・分けた ファイル: axfx-o8-tantei.js（名探てい王）・axfx-o8-ginga.js（銀河の女王）・axfx-o8-madou.js（大魔導王）・axfx-o8-kensei.js（天下むそうの剣聖）。
//   つぶの かきかたと 小さな どうぐは axfx-o8-kit.js。どの え も さいごに balance（伝説の つぶの かず）
import { AX_O8_TANTEI } from './axfx-o8-tantei.js?v=7033f2971814';
import { AX_O8_GINGA } from './axfx-o8-ginga.js?v=7033f2971814';
import { AX_O8_MADOU } from './axfx-o8-madou.js?v=7033f2971814';
import { AX_O8_KENSEI } from './axfx-o8-kensei.js?v=7033f2971814';
import { AX_O8_FINE as FINE, withBalance } from './axfx-o8-kit.js?v=7033f2971814';

export const AX_O8 = withBalance({ ...AX_O8_TANTEI, ...AX_O8_GINGA, ...AX_O8_MADOU, ...AX_O8_KENSEI });

export const AX_O8_FINE = { ...FINE };
