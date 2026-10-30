// 第49回 O2（こぶし・守り・魔物・闇）: もとからの 技の え（はなつ ところ）。render/axfx.js が useAxGroup('o2', AX_O2, AX_O2_FINE) で とうろく する
// 書きかたは docs/plan-r49-fx.md 7章 と docs/plan-r48-fx-engine.md。この ファイルは O2 だけが さわる
// ・時間（tier・charge.kind/ms・hit・len・stagger・party）と 技の つなぎは shared/data/ax-time-o2.js に 書く（ここには 書かない）
// ・ここには 見た目だけ: { ox_〜: { charge: { color, color2, power }, sfx, allyFx, pal, vars, play(fx, c) } }
// ・カットインの 帯（c.k.cutIn）・画面の くらさ（c.k.dim）は つかわない。画面の 文字に 漢字は 出さない（「人」だけ OK）
// ・分けた ファイル: axfx-o2-fist.js（武闘家・聖拳士・ゴッドハンド・ガーディアン）・axfx-o2-beast.js（海賊・魔物使い・モンスターマスター）
//   axfx-o2-dark.js（中二病・超能力者・ダ天使・魔王）・axfx-o2-dual.js（合体技）。つぶの かきかたは axfx-o2-fine.js、小さな どうぐは axfx-o2-kit.js
// ・どの え も さいごに balance（段の つぶの かず: 敵1体でも 下限 いじょう、敵5体でも 上限 いか。もとからの 技の 予算 AX_BUDGET_ORIG）
import { AX_O2_FIST } from './axfx-o2-fist.js?v=a9ce9cd0de1b';
import { AX_O2_BEAST } from './axfx-o2-beast.js?v=a9ce9cd0de1b';
import { AX_O2_DARK } from './axfx-o2-dark.js?v=a9ce9cd0de1b';
import { AX_O2_DUAL } from './axfx-o2-dual.js?v=a9ce9cd0de1b';
import { AX_O2_FINE as FINE } from './axfx-o2-fine.js?v=a9ce9cd0de1b';
import { withBalance } from './axfx-o2-kit.js?v=a9ce9cd0de1b';

export const AX_O2 = withBalance({ ...AX_O2_FIST, ...AX_O2_BEAST, ...AX_O2_DARK, ...AX_O2_DUAL });

export const AX_O2_FINE = { ...FINE };
