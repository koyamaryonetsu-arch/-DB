// 第48回 G1（ドラゴンボール ＋ ドラえもん ＋ はなかっぱ）: 大技の え（はなつ ところ）。render/axfx.js が useAxGroup('g1', AX_G1, AX_G1_FINE) で とうろく する
// 書きかたは docs/plan-r48-fx.md の「G0 の 決めごと」と docs/plan-r48-fx-engine.md。この ファイルは G1 だけが さわる
// ・時間（tier・charge.kind/ms・hit・len・stagger・party）と 技の つなぎは shared/data/ax-time-g1.js に 書く（ここには 書かない）
// ・え は 3つの ファイルに 分けた:
//     axfx-g1-lib.js  … つぶの かきかた（g1Ball 気の たま・g1Beam かめはめ波・g1Dome ドーム爆発・g1Disc 気円斬・g1Dragon 竜拳・g1Fist こぶし・
//                       g1Ghost ざんぞう・g1Mark しるし・g1Prop どうぐ・g1Boom マンガの 爆発・g1Monkey 大ザル・g1Bg はいけい など）と 小さな どうぐ
//     axfx-g1-dbz.js  … ドラゴンボール・はかい神・ゴムゴムのかめはめ波
//     axfx-g1-dora.js … ネコ型ロボット・ドラえもん・カッパ・はなかっぱ・筋肉ニンニク
// ・かめはめ波の なかまは def.beamW（ビームの はば）が 段ごとに 太く なる（B 9 → A 13 → S 16 → L 34。10倍は 28 で 赤）
// ・時間の まもり: play が 足した つぶは「len ＋ 敵全体の ずらし」までに おわる（けむり・はへん など ながい つぶも そこで きえる）
import { G1_FINE } from './axfx-g1-lib.js?v=a02b94650854';
import { AX_G1_DBZ, G1_DBZ_FINE } from './axfx-g1-dbz.js?v=a02b94650854';
import { AX_G1_DORA, G1_DORA_FINE } from './axfx-g1-dora.js?v=a02b94650854';

function guard(def) {
  const play = def.play;
  return {
    ...def,
    play(fx, c) {
      const n0 = fx.parts.length;
      play(fx, c);
      const cap = c.len + (c.n > 1 ? c.stagger * (c.n - 1) : 0) + 40;
      for (let i = n0; i < fx.parts.length; i++) {
        const p = fx.parts[i];
        const d = p.delay > 0 ? p.delay : 0;
        if (d + p.life > cap) p.life = Math.max(16, cap - d);
      }
    },
  };
}

export const AX_G1 = Object.fromEntries(Object.entries({ ...AX_G1_DBZ, ...AX_G1_DORA }).map(([k, d]) => [k, guard(d)]));

export const AX_G1_FINE = { ...G1_FINE, ...G1_DBZ_FINE, ...G1_DORA_FINE };
