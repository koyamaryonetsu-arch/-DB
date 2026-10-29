// 第49回 O3（会社と お金）: もとからの 技の え（はなつ ところ）。render/axfx.js が useAxGroup('o3', AX_O3, AX_O3_FINE) で とうろく する
// 書きかたは docs/plan-r49-fx.md 7章 と docs/plan-r48-fx-engine.md。この ファイルは O3 だけが さわる
// ・時間（tier・charge.kind/ms・hit・len・stagger・party）と 技の つなぎは shared/data/ax-time-o3.js に 書く（ここには 書かない）
// ・ここには 見た目だけ: { ox_〜: { charge: { color, color2, power }, sfx, allyFx, pal, vars, play(fx, c) } }
// ・カットインの 帯（c.k.cutIn）・画面の くらさ（c.k.dim）は つかわない。画面の 文字に 漢字は 出さない（「人」だけ OK）
// ・職業ごとに 分けた: axfx-o3-kaisha.js（会社員・アルバイト）・axfx-o3-joushi.js（部長・正社員・社ちく・楽天カードマン）・
//   axfx-o3-shachou.js（社長・キャリア組・たたき上げ社長・ブラックきぎょうの星・合体技）。絵と つぶの かきかたは axfx-o3-lib.js
// ・どの え も さいごに balance（もとからの 技の 予算 AX_BUDGET_ORIG の つぶの かず: 敵1体でも 下限 いじょう、敵5体でも 上限 いか）
import { AX_O3_FINE as FINE, withBalance } from './axfx-o3-lib.js?v=060276fb0270';
import { AX_O3_KAISHA } from './axfx-o3-kaisha.js?v=060276fb0270';
import { AX_O3_JOUSHI } from './axfx-o3-joushi.js?v=060276fb0270';
import { AX_O3_SHACHOU } from './axfx-o3-shachou.js?v=060276fb0270';

export const AX_O3 = withBalance({ ...AX_O3_KAISHA, ...AX_O3_JOUSHI, ...AX_O3_SHACHOU });

export const AX_O3_FINE = { ...FINE };
