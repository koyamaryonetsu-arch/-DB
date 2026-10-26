// 第49回 O4（町の 仕事・乗り物・設備・スポーツ）: もとからの 技の え（はなつ ところ）。render/axfx.js が useAxGroup('o4', AX_O4, AX_O4_FINE) で とうろく する
// 書きかたは docs/plan-r49-fx.md 7章 と docs/plan-r48-fx-engine.md。この ファイルは O4 だけが さわる
// ・時間（tier・charge.kind/ms・hit・len・stagger・party）と 技の つなぎは shared/data/ax-time-o4.js に 書く（ここには 書かない）
// ・カットインの 帯・画面の くらさは つかわない。画面の 文字に 漢字は 出さない（「人」だけ OK）
// ・ファイルを 分けた:
//     axfx-o4-kit.js   … O4 の つぶの かきかた（道具 o4Obj・のりもの o4Car・ホースの 水 o4Hose・音の 輪・字・線・背景・ドン！）と 足しかた
//     axfx-o4-rail.js  … 鉄道員・運転士
//     axfx-o4-ball.js  … プロ野球選手・メジャーリーガー
//     axfx-o4-town.js  … 地方公務員・国家公務員・警察官・消防士
//     axfx-o4-hvac.js  … 設備屋・ryonetsu・天才しせつ管理者（空調・チラー・換気扇・ダクト・メーター…）
//     axfx-o4-dual.js  … 合体技
import { AX_O4_KIT_FINE, finish } from './axfx-o4-kit.js?v=5cf16f1946f7';
import { AX_O4_RAIL } from './axfx-o4-rail.js?v=5cf16f1946f7';
import { AX_O4_BALL } from './axfx-o4-ball.js?v=5cf16f1946f7';
import { AX_O4_TOWN } from './axfx-o4-town.js?v=5cf16f1946f7';
import { AX_O4_HVAC } from './axfx-o4-hvac.js?v=5cf16f1946f7';
import { AX_O4_DUAL } from './axfx-o4-dual.js?v=5cf16f1946f7';

export const AX_O4 = Object.fromEntries(Object.entries({
  ...AX_O4_RAIL,
  ...AX_O4_BALL,
  ...AX_O4_TOWN,
  ...AX_O4_HVAC,
  ...AX_O4_DUAL,
}).map(([k, d]) => [k, finish(d)]));

export const AX_O4_FINE = {
  ...AX_O4_KIT_FINE,
};
