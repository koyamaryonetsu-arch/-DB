// 第48回 G5（セーラームーン ＋ アナと雪の女王 ＋ アイドル）: 大技の え（はなつ ところ）。render/axfx.js が useAxGroup('g5', AX_G5, AX_G5_FINE) で とうろく する
// 書きかたは docs/plan-r48-fx.md の「G0 の 決めごと」と docs/plan-r48-fx-engine.md。この ファイルは G5 だけが さわる
// ・時間（tier・charge.kind/ms・hit・len・stagger・party）と 技の つなぎは shared/data/ax-time-g5.js に 書く（ここには 書かない）
// ・ここには 見た目だけ: { ax_〜: { charge: { color, color2, power }, sfx, allyFx, pal, vars, play(fx, c) } }
// ・大きく なったら axfx-g5-〜.js に 分けて ここから import して よい
// ・つぶの かきかた（Effects の FINE）は AX_G5_FINE に。なまえは 'g5' で はじめる（例: g5Beam）
// import { pal } from './axkit.js';

export const AX_G5 = {
};

export const AX_G5_FINE = {
};
