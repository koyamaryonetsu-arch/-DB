// 第49回 O1（剣・和・かげの 仕事）: もとからの 技の え（はなつ ところ）。render/axfx.js が useAxGroup('o1', AX_O1, AX_O1_FINE) で とうろく する
// 書きかたは docs/plan-r49-fx.md 7章 と docs/plan-r48-fx-engine.md。この ファイルは O1 だけが さわる
// ・時間（tier・charge.kind/ms・hit・len・stagger・party）と 技の つなぎは shared/data/ax-time-o1.js に 書く（ここには 書かない）
// ・カットインの 帯・画面を くらく する ことは しない。画面の 文字に 漢字は 出さない（「人」だけ OK）
// ・中身は 5つの ファイルに 分けた:
//   axfx-o1-kit.js    … O1 の どうぐ（小道具の 絵・六角の まく・鎖・照準・背景・三角形）と つぶの かきかた（o1〜）。G3 の 筆の 帯・太刀すじ・小道具も かりる
//   axfx-o1-ken.js    … 剣の 仕事（戦士・バトルマスター・パラディン・魔法戦士）
//   axfx-o1-ken2.js   … 超級の 剣（魔剣士・ソードマスター）
//   axfx-o1-wa.js     … 和の 仕事（忍者・サムライ・将軍）
//   axfx-o1-kage.js   … かげの 仕事（スパイ・殺し屋）
//   axfx-o1-combo.js  … 掛け合わせ技 ＋ 合体技
import { O1_FINE, capLife } from './axfx-o1-kit.js?v=0e454fdbf852';
import { AX_O1_KEN } from './axfx-o1-ken.js?v=0e454fdbf852';
import { AX_O1_KEN2 } from './axfx-o1-ken2.js?v=0e454fdbf852';
import { AX_O1_WA } from './axfx-o1-wa.js?v=0e454fdbf852';
import { AX_O1_KAGE } from './axfx-o1-kage.js?v=0e454fdbf852';
import { AX_O1_COMBO } from './axfx-o1-combo.js?v=0e454fdbf852';

// どの え も「はなって から len ＋ 敵全体の ずらし ＋ 200ms」までに つぶが きえる（つぎの 行動に かぶらない）
const guard = (defs) => Object.fromEntries(Object.entries(defs).map(([anim, d]) => [anim, {
  ...d,
  play(fx, c) {
    const spread = c.n > 1 ? Math.min(300, c.stagger * (c.n - 1)) : 0;
    return capLife(fx, c.len + spread + 200, () => d.play(fx, c));
  },
}]));

export const AX_O1 = guard({
  ...AX_O1_KEN,
  ...AX_O1_KEN2,
  ...AX_O1_WA,
  ...AX_O1_KAGE,
  ...AX_O1_COMBO,
});

export const AX_O1_FINE = {
  ...O1_FINE,
};
