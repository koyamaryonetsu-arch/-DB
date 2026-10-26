// 第49回 O5（家・学校・料理）: もとからの 技の え（はなつ ところ）。render/axfx.js が useAxGroup('o5', AX_O5, AX_O5_FINE) で とうろく する
// 書きかたは docs/plan-r49-fx.md 7章 と docs/plan-r48-fx-engine.md。この ファイルは O5 だけが さわる
// ・時間（tier・charge.kind/ms・hit・len・stagger・party）と 技の つなぎは shared/data/ax-time-o5.js に 書く（ここには 書かない）
// ・ここには 見た目だけ: { ox_〜: { charge: { color, color2, power }, sfx, allyFx, pal, vars, play(fx, c) } }
// ・カットインの 帯（c.k.cutIn）・画面の くらさ（c.k.dim）は つかわない。画面の 文字に 漢字は 出さない（「人」だけ OK）
// ・大きく なったら axfx-o5-〜.js に 分けて ここから import して よい
// ・つぶの かきかた（Effects の FINE）は AX_O5_FINE に。なまえは 'o5' で はじめる（例: o5Card）
// import { pal } from './axkit.js?v=754c2ad0d696';

export const AX_O5 = {
};

export const AX_O5_FINE = {
};
