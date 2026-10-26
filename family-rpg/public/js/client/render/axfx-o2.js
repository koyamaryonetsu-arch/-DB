// 第49回 O2（こぶし・守り・魔物・闇）: もとからの 技の え（はなつ ところ）。render/axfx.js が useAxGroup('o2', AX_O2, AX_O2_FINE) で とうろく する
// 書きかたは docs/plan-r49-fx.md 7章 と docs/plan-r48-fx-engine.md。この ファイルは O2 だけが さわる
// ・時間（tier・charge.kind/ms・hit・len・stagger・party）と 技の つなぎは shared/data/ax-time-o2.js に 書く（ここには 書かない）
// ・ここには 見た目だけ: { ox_〜: { charge: { color, color2, power }, sfx, allyFx, pal, vars, play(fx, c) } }
// ・カットインの 帯（c.k.cutIn）・画面の くらさ（c.k.dim）は つかわない。画面の 文字に 漢字は 出さない（「人」だけ OK）
// ・大きく なったら axfx-o2-〜.js に 分けて ここから import して よい
// ・つぶの かきかた（Effects の FINE）は AX_O2_FINE に。なまえは 'o2' で はじめる（例: o2Card）
// import { pal } from './axkit.js';

export const AX_O2 = {
};

export const AX_O2_FINE = {
};
