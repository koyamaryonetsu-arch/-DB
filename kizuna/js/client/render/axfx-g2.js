// 第48回 G2（ナルト ＋ ワンピース ＋ 京急 ＋ 野球）: 大技の え（はなつ ところ）。render/axfx.js が useAxGroup('g2', AX_G2, AX_G2_FINE) で とうろく する
// 書きかたは docs/plan-r48-fx.md の「G0 の 決めごと」と docs/plan-r48-fx-engine.md。この ファイルは G2 だけが さわる
// ・時間（tier・charge.kind/ms・hit・len・stagger・party）と 技の つなぎは shared/data/ax-time-g2.js に 書く（ここには 書かない）
// ・作品ごとに ファイルを 分けた:
//     axfx-g2-kit.js       … G2 の つぶの かきかた（らせん丸・影分身・ゴムの うで・ニカ・赤い 電車・球・バット・背景・線の 字…）と 小さな どうぐ
//     axfx-g2-naruto.js    … ナルト（木の葉の忍び・七代目火影）＋ 合体技 忍びの影分身
//     axfx-g2-onepiece.js  … ワンピース（ゴム人間・ニカ）
//     axfx-g2-keikyu.js    … 京急（運転士・社長）
//     axfx-g2-baseball.js  … 野球（二刀流スター・殿堂入り）
import { G2_FINE } from './axfx-g2-kit.js?v=5c89bfcd3c09';
import { AX_G2_NARUTO } from './axfx-g2-naruto.js?v=5c89bfcd3c09';
import { AX_G2_ONEPIECE } from './axfx-g2-onepiece.js?v=5c89bfcd3c09';
import { AX_G2_KEIKYU } from './axfx-g2-keikyu.js?v=5c89bfcd3c09';
import { AX_G2_BASEBALL } from './axfx-g2-baseball.js?v=5c89bfcd3c09';

// どの え にも かける しあげ（play を つつむ）
// ・火花の かず: 敵が おおい ときは へらす（つぶの 上限）、DENSE で ふやす（1体でも 豪華に）
// ・余韻の さいごを まもる: はなって len（＋敵全体の ずらし）を こえて のこる つぶは そこで おわらせる（サーバーの 待ち時間と そろえる）
// 火花の ふやし（1体の とき）と 敵が おおい ときの へらしかた（n^-multi）
const DENSE = {
  ax_kunai: [1, 1.2], ax_konoha_senpuu: [1.4], ax_gomu_pistol: [1.4, 1], ax_gomu_bazooka: [1.6], ax_gear3_gigant: [1.6], ax_gomu_muchi: [1.8],
  ax_gear2: [1.2], ax_kaihou_drum: [1.3], ax_kaminari_tsukamu: [1.8], ax_nika_sun_punch: [1.5], ax_nika_warai: [1.3], ax_kaihou_senshi: [1.6], ax_manga_oabare: [2],
  ax_keikyu_120: [1.6], ax_kaitoku_renketsu: [1.4], ax_akai_kaitoku: [1.9], ax_airport_kaitoku: [1.5], ax_shuppatsu_gourei: [1.3], ax_nonstop_tokkyu: [1.7],
  ax_zensen_tenken: [1.3], ax_daiya_kaisei: [1.3], ax_daiya_kaifuku: [1.5], ax_12ryou_renketsu: [1.5], ax_zensen_daikaitoku: [1.2], ax_shachou_bonus: [1.3], ax_kaitoku_oikoshi: [2],
  ax_nitoryu: [1.15, 1.2], ax_real_nitoryu: [1.8], ax_fifty_fifty: [1.7], ax_nemuri_first: [1.6], ax_manpyou_mvp: [1.3], ax_100mile: [1.5, 1], ax_yokoku_homerun: [1.3],
  ax_kieru_makyu: [2.2, 1], ax_koedashi_enjin: [1.3], ax_sansha_sanshin: [1.7], ax_yume_allstar: [1.3], ax_ougon_sayonara: [1.15], ax_3daseki_renzoku: [1.3, 1.1], ax_kandou_speech: [1.3],
};
function finish(def, anim) {
  const play = def.play;
  const [dense, multi] = DENSE[anim] || [];
  return {
    ...def,
    play(fx, c) {
      const start = fx.parts.length;
      const f = (dense || 1) * (c.n > 1 ? Math.pow(c.n, -(multi ?? 0.8)) : 1);
      const own = Object.prototype.hasOwnProperty.call(fx, 'sparks');
      const prev = fx.sparks;
      if (Math.abs(f - 1) > 0.01) fx.sparks = function sparksG2(x, y, o = {}) { return prev.call(this, x, y, { ...o, n: Math.max(1, Math.round((o.n ?? 10) * f)) }); };
      try {
        play(fx, c);
      } finally {
        if (own) fx.sparks = prev;
        else delete fx.sparks;
      }
      const lim = c.len + Math.min(300, c.stagger * (c.n - 1)) + 160;
      for (let i = start; i < fx.parts.length; i++) {
        const p = fx.parts[i];
        const d = p.delay > 0 ? p.delay : 0;
        if (d + p.life > lim) p.life = Math.max(30, lim - d);
      }
    },
  };
}

export const AX_G2 = Object.fromEntries(Object.entries({
  ...AX_G2_NARUTO,
  ...AX_G2_ONEPIECE,
  ...AX_G2_KEIKYU,
  ...AX_G2_BASEBALL,
}).map(([k, d]) => [k, finish(d, k)]));

export const AX_G2_FINE = {
  ...G2_FINE,
};
