// 第49回 O5（家・学校・料理）: もとからの 技の え（はなつ ところ）。render/axfx.js が useAxGroup('o5', AX_O5, AX_O5_FINE) で とうろく する
// 書きかたは docs/plan-r49-fx.md 7章 と docs/plan-r48-fx-engine.md。この ファイルは O5 だけが さわる
// ・時間（tier・charge.kind/ms・hit・len・stagger・party）と 技の つなぎは shared/data/ax-time-o5.js に 書く（ここには 書かない）
// ・ここには 見た目だけ: { ox_〜: { charge: { color, color2, power }, sfx, allyFx, pal, vars, play(fx, c) } }
// ・カットインの 帯・画面の くらさは つかわない。画面の 文字に 漢字は 出さない（「人」だけ OK）
// ・分けた ファイル: axfx-o5-school.js（小学生・中学生・高校生・学校の 合体技）・axfx-o5-cook.js（料理人・パティシエ・三ツ星シェフ・ごはんの 合体技）・
//   axfx-o5-home.js（ニート・おかん・最強のおかん・クリエイター・家の 合体技）。つぶの かきかたは axfx-o5-fine.js、小さな どうぐは axfx-o5-kit.js
// ・どの え も さいごに balance（段の つぶの かず: 敵1体でも 下限 いじょう、敵5体でも 上限 いか）
import { AX_O5_SCHOOL } from './axfx-o5-school.js?v=a9ce9cd0de1b';
import { AX_O5_COOK } from './axfx-o5-cook.js?v=a9ce9cd0de1b';
import { AX_O5_HOME } from './axfx-o5-home.js?v=a9ce9cd0de1b';
import { AX_O5_FINE as FINE } from './axfx-o5-fine.js?v=a9ce9cd0de1b';
import { withBalance } from './axfx-o5-kit.js?v=a9ce9cd0de1b';

export const AX_O5 = withBalance({ ...AX_O5_SCHOOL, ...AX_O5_COOK, ...AX_O5_HOME });

export const AX_O5_FINE = { ...FINE };
