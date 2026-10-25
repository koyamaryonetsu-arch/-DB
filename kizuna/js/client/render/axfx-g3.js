// 第48回 G3（鬼滅の刃 ＋ るろうに剣心 ＋ 暴れん坊将軍）: 大技の え（はなつ ところ）。render/axfx.js が useAxGroup('g3', AX_G3, AX_G3_FINE) で とうろく する
// 書きかたは docs/plan-r48-fx.md の「G0 の 決めごと」と docs/plan-r48-fx-engine.md。この ファイルは G3 だけが さわる
// ・時間（tier・charge.kind/ms・hit・len・stagger・party）と 技の つなぎは shared/data/ax-time-g3.js に 書く（ここには 書かない）
// ・ここには 見た目だけ: { ax_〜: { charge: { color, color2, power }, sfx, allyFx, pal, vars, play(fx, c) } }
// ・大きく なったら axfx-g3-〜.js に 分けて ここから import して よい
// ・つぶの かきかた（Effects の FINE）は AX_G3_FINE に。なまえは 'g3' で はじめる（例: g3Beam）
// import { pal } from './axkit.js?v=f7adbedf412d';

export const AX_G3 = {
};

export const AX_G3_FINE = {
};
