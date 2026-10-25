// 第48回 G3（鬼滅の刃 ＋ るろうに剣心 ＋ 暴れん坊将軍）: 大技の え（はなつ ところ）。render/axfx.js が useAxGroup('g3', AX_G3, AX_G3_FINE) で とうろく する
// 書きかたは docs/plan-r48-fx.md の「G0 の 決めごと」と docs/plan-r48-fx-engine.md。この ファイルは G3 だけが さわる
// ・時間（tier・charge.kind/ms・hit・len・stagger・party）と 技の つなぎは shared/data/ax-time-g3.js に 書く（ここには 書かない）
// ・中身は 3つの ファイルに 分けた:
//   axfx-g3-kit.js      … G3 の どうぐ（ふでの 帯・竜・太刀すじ・竜巻・日輪・火車・背景・小道具）と つぶの かきかた（g3〜）
//   axfx-g3-kimetsu.js  … 鬼滅の刃（水の呼吸・炎の呼吸・日の呼吸）
//   axfx-g3-rurouni.js  … るろうに剣心（飛天御剣流）
//   axfx-g3-shogun.js   … 暴れん坊将軍 ＋ 合体技
import { G3_FINE, capLife } from './axfx-g3-kit.js?v=6ce2458453d2';
import { AX_G3_KIMETSU } from './axfx-g3-kimetsu.js?v=6ce2458453d2';
import { AX_G3_RUROUNI } from './axfx-g3-rurouni.js?v=6ce2458453d2';
import { AX_G3_SHOGUN } from './axfx-g3-shogun.js?v=6ce2458453d2';

// どの え も「はなって から len ＋ 敵全体の ずらし ＋ 200ms」までに つぶが きえる（つぎの 行動に かぶらない）
const guard = (defs) => Object.fromEntries(Object.entries(defs).map(([anim, d]) => [anim, {
  ...d,
  play(fx, c) {
    const spread = c.n > 1 ? Math.min(300, c.stagger * (c.n - 1)) : 0;
    return capLife(fx, c.len + spread + 200, () => d.play(fx, c));
  },
}]));

export const AX_G3 = guard({
  ...AX_G3_KIMETSU,
  ...AX_G3_RUROUNI,
  ...AX_G3_SHOGUN,
});

export const AX_G3_FINE = {
  ...G3_FINE,
};
