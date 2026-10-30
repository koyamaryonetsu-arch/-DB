// 第49回 O6（魔法・星・お笑い・配信）: もとからの 技の え（はなつ ところ）。render/axfx.js が useAxGroup('o6', AX_O6, AX_O6_FINE) で とうろく する
// 書きかたは docs/plan-r49-fx.md 7章 と docs/plan-r48-fx-engine.md。この ファイルは O6 だけが さわる
// ・時間（tier・charge.kind/ms・hit・len・stagger・party）と 技の つなぎは shared/data/ax-time-o6.js に 書く（ここには 書かない）
// ・カットインの 帯・画面の くらさは つかわない。画面の 文字に 漢字は 出さない（「人」だけ OK）
// ・中身は 5つに 分けた:
//   axfx-o6-kit.js   … 大きな え の つぶ（小道具・カタカナの 擬音・スポットライト・コメントの 帯・配信の わく・運命の輪・炎の 円すい・うず・
//                       夜空の 帯・客席・げんまの すがた・竜・ドット絵・結界の ドーム・グラフ・数字・幕）と どうぐ
//   axfx-o6-stage.js … 旅芸人・遊び人・スーパースター・お笑い芸人・M-1王者
//   axfx-o6-net.js   … ユーチューバー・ゲーマー・人気配信者・プロゲーマー
//   axfx-o6-magic.js … 占い師・大魔道士・天地雷鳴士・星の歌姫・大賢者・大神官
//   axfx-o6-dual.js  … 合体技
import { AX_O6_FINE_KIT } from './axfx-o6-kit.js?v=ba9bc083e891';
import { AX_O6_STAGE } from './axfx-o6-stage.js?v=ba9bc083e891';
import { AX_O6_NET } from './axfx-o6-net.js?v=ba9bc083e891';
import { AX_O6_MAGIC } from './axfx-o6-magic.js?v=ba9bc083e891';
import { AX_O6_DUAL } from './axfx-o6-dual.js?v=ba9bc083e891';

export const AX_O6 = { ...AX_O6_STAGE, ...AX_O6_NET, ...AX_O6_MAGIC, ...AX_O6_DUAL };

export const AX_O6_FINE = { ...AX_O6_FINE_KIT };
