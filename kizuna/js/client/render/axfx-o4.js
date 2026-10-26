// 第49回 O4（町の 仕事・乗り物・設備・スポーツ）: もとからの 技の え（はなつ ところ）。render/axfx.js が useAxGroup('o4', AX_O4, AX_O4_FINE) で とうろく する
// 書きかたは docs/plan-r49-fx.md 7章 と docs/plan-r48-fx-engine.md。この ファイルは O4 だけが さわる
// ・時間（tier・charge.kind/ms・hit・len・stagger・party）と 技の つなぎは shared/data/ax-time-o4.js に 書く（ここには 書かない）
// ・ここには 見た目だけ: { ox_〜: { charge: { color, color2, power }, sfx, allyFx, pal, vars, play(fx, c) } }
// ・カットインの 帯（c.k.cutIn）・画面の くらさ（c.k.dim）は つかわない。画面の 文字に 漢字は 出さない（「人」だけ OK）
// ・大きく なったら axfx-o4-〜.js に 分けて ここから import して よい
// ・つぶの かきかた（Effects の FINE）は AX_O4_FINE に。なまえは 'o4' で はじめる（例: o4Card）
// import { pal } from './axkit.js?v=754c2ad0d696';

export const AX_O4 = {
};

export const AX_O4_FINE = {
};
