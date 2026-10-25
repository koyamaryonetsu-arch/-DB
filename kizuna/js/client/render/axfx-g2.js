// 第48回 G2（ナルト ＋ ワンピース ＋ 京急 ＋ 野球）: 大技の え（はなつ ところ）。render/axfx.js が useAxGroup('g2', AX_G2, AX_G2_FINE) で とうろく する
// 書きかたは docs/plan-r48-fx.md の「G0 の 決めごと」と docs/plan-r48-fx-engine.md。この ファイルは G2 だけが さわる
// ・時間（tier・charge.kind/ms・hit・len・stagger・party）と 技の つなぎは shared/data/ax-time-g2.js に 書く（ここには 書かない）
// ・ここには 見た目だけ: { ax_〜: { charge: { color, color2, power }, sfx, allyFx, pal, vars, play(fx, c) } }
// ・大きく なったら axfx-g2-〜.js に 分けて ここから import して よい
// ・つぶの かきかた（Effects の FINE）は AX_G2_FINE に。なまえは 'g2' で はじめる（例: g2Beam）
// import { pal } from './axkit.js?v=f7adbedf412d';

export const AX_G2 = {
};

export const AX_G2_FINE = {
};
