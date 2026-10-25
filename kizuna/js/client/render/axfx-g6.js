// 第48回 G6（ハリー・ポッター ＋ 鋼の錬金術師 ＋ 怪盗キッド ＋ 名探偵コナン ＋ おしり探偵）: 大技の え（はなつ ところ）。render/axfx.js が useAxGroup('g6', AX_G6, AX_G6_FINE) で とうろく する
// 書きかたは docs/plan-r48-fx.md の「G0 の 決めごと」と docs/plan-r48-fx-engine.md。この ファイルは G6 だけが さわる
// ・時間（tier・charge.kind/ms・hit・len・stagger・party）と 技の つなぎは shared/data/ax-time-g6.js に 書く（ここには 書かない）
// ・ここには 見た目だけ: { ax_〜: { charge: { color, color2, power }, sfx, allyFx, pal, vars, play(fx, c) } }
// ・大きく なったら axfx-g6-〜.js に 分けて ここから import して よい
// ・つぶの かきかた（Effects の FINE）は AX_G6_FINE に。なまえは 'g6' で はじめる（例: g6Beam）
// import { pal } from './axkit.js?v=f7adbedf412d';

export const AX_G6 = {
};

export const AX_G6_FINE = {
};
