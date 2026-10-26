// 第49回 O6（魔法・星・お笑い・配信）: もとからの 技の え（はなつ ところ）。render/axfx.js が useAxGroup('o6', AX_O6, AX_O6_FINE) で とうろく する
// 書きかたは docs/plan-r49-fx.md 7章 と docs/plan-r48-fx-engine.md。この ファイルは O6 だけが さわる
// ・時間（tier・charge.kind/ms・hit・len・stagger・party）と 技の つなぎは shared/data/ax-time-o6.js に 書く（ここには 書かない）
// ・ここには 見た目だけ: { ox_〜: { charge: { color, color2, power }, sfx, allyFx, pal, vars, play(fx, c) } }
// ・カットインの 帯（c.k.cutIn）・画面の くらさ（c.k.dim）は つかわない。画面の 文字に 漢字は 出さない（「人」だけ OK）
// ・大きく なったら axfx-o6-〜.js に 分けて ここから import して よい
// ・つぶの かきかた（Effects の FINE）は AX_O6_FINE に。なまえは 'o6' で はじめる（例: o6Card）
// import { pal } from './axkit.js?v=4ed9358095f4';

export const AX_O6 = {
};

export const AX_O6_FINE = {
};
