// 第48回 G5（セーラームーン ＋ アナと雪の女王 ＋ アイドル）: 大技の え（はなつ ところ）。render/axfx.js が useAxGroup('g5', AX_G5, AX_G5_FINE) で とうろく する
// 書きかたは docs/plan-r48-fx.md の「G0 の 決めごと」と docs/plan-r48-fx-engine.md。この ファイルは G5 だけが さわる
// ・時間（tier・charge.kind/ms・hit・len・stagger・party）と 技の つなぎは shared/data/ax-time-g5.js に 書く（ここには 書かない）
// ・中身は 3つに 分けた:
//   axfx-g5-kit.js  … 大きな え の つぶ（はいけい・月・ティアラ・バラ・つえ・銀水晶・宮殿・リボン・光の 波・ハート・スポットライト・
//                      ペンライト・ドーム・くだもの・雪の けっしょう・せいれいの しるし・つらら・雪だるま・雪の 大男・水の 馬 …）と どうぐ
//   axfx-g5-moon.js … セーラームーン・ネオ・クイーン・セレニティ（男の子の タキシード仮面ふう・キングふう も）・合体技 ムーンライト・ステージ
//   axfx-g5-ice.js  … 雪の女王・第5のせいれい
//   axfx-g5-idol.js … アイドル・フルーツジッパー・アラシ
import { AX_G5_FINE_KIT } from './axfx-g5-kit.js?v=31a32b16dd7b';
import { AX_G5_MOON, AX_G5_FINE_MOON } from './axfx-g5-moon.js?v=31a32b16dd7b';
import { AX_G5_ICE, AX_G5_FINE_ICE } from './axfx-g5-ice.js?v=31a32b16dd7b';
import { AX_G5_IDOL, AX_G5_FINE_IDOL } from './axfx-g5-idol.js?v=31a32b16dd7b';

export const AX_G5 = { ...AX_G5_MOON, ...AX_G5_ICE, ...AX_G5_IDOL };

export const AX_G5_FINE = { ...AX_G5_FINE_KIT, ...AX_G5_FINE_MOON, ...AX_G5_FINE_ICE, ...AX_G5_FINE_IDOL };
