// 第104回 A班: B班（戦いと 品）が 入るまでの かりの 戦い（テストと ブラウザの 道具だけが 読む。合わせる 時に 消す）
// ※ 本体（maps・data・world・client）は この ファイルを 読まない
// ・中ボス c11d_duo … かりは ゴールドン 2体（鏡と 月の 使いの かわり）/ さいごの ボス c11d_queen … かりは ゴールドン 1体（女王の かわり）。
//   スピカは 第3部の 決まった 戦いと 同じく、リーダーが c9_child を 持って いれば ゲストで 出る（battle-c9a.js の setupC9a）
import { FIXED_ENCOUNTERS } from './encounters.js';
import { C11D_BATTLE } from '../maps/c11d-flags.js';

const boss = (sp, n = 1, bg = 'star_tower_top') => ({ group: [[sp, n, n]], bg, bgm: 'boss', canFlee: false, boss: true });
export function installC11dStub() {
  FIXED_ENCOUNTERS[C11D_BATTLE.duo] ||= boss('goldoon', 2);
  FIXED_ENCOUNTERS[C11D_BATTLE.queen] ||= boss('goldoon', 1);
}
