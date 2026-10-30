// 第51回 W（天気の 職業）: 気象予報士・お天気キャスター・天候をあやつる者の 技の え（はなつ ところ）。
// render/axfx.js が useAxGroup('o10', AX_O10, AX_O10_FINE) で とうろく する。この ファイルは W だけが さわる
// ・時間（tier・charge.kind/ms・hit・len・party）と 技の つなぎは shared/data/ax-time-o10.js に 書く（ここには 書かない）
// ・ここには 見た目だけ: { ox_w_〜: { charge: { color, color2 }, sfx, allyFx, play(fx, c) } }
// ・カットインの 帯・画面の くらさは つかわない。画面の 文字に 漢字は 出さない（カタカナ・数字・LIVE だけ）
// ・分けた ファイル: axfx-o10-sky.js（気象予報士・お天気キャスター）・axfx-o10-storm.js（天候をあやつる者）。
//   つぶの かきかたは axfx-o10-fine.js、小さな どうぐは axfx-o10-kit.js
// ・どの え も さいごに balance（段の つぶの かず: 敵1体でも 下限 いじょう、敵5体でも 上限 いか）
import { AX_O10_SKY } from './axfx-o10-sky.js?v=66b0267ceac2';
import { AX_O10_STORM } from './axfx-o10-storm.js?v=66b0267ceac2';
import { AX_O10_FINE as FINE } from './axfx-o10-fine.js?v=66b0267ceac2';
import { withBalance } from './axfx-o10-kit.js?v=66b0267ceac2';

export const AX_O10 = withBalance({ ...AX_O10_SKY, ...AX_O10_STORM });

export const AX_O10_FINE = { ...FINE };
