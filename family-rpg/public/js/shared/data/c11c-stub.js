// 第103回 A班: B班（戦いと 品）が 入るまでの かりの 戦い（テストと ブラウザの 道具だけが 読む。合わせる 時に 消す）
// ※ 本体（maps・data・world・client）は この ファイルを 読まない
// ・中ボス c11c_mecha … かりは ゴールドン 3体（頭・うで・足の かわり）/ ボス c11c_ace … かりは ゴールドン 3体（隊長と 兵隊 2体の かわり）。
//   スピカは 第3部の 決まった 戦いと 同じく、リーダーが c9_child を 持って いれば ゲストで 出る（battle-c9a.js の setupC9a）
import { FIXED_ENCOUNTERS } from './encounters.js';
import { C11C_BATTLE } from '../maps/c11c-flags.js';

const boss = (sp, n = 1, bg = 'star_tower_top') => ({ group: [[sp, n, n]], bg, bgm: 'boss', canFlee: false, boss: true });
export function installC11cStub() {
  FIXED_ENCOUNTERS[C11C_BATTLE.mecha] ||= boss('goldoon', 3);
  FIXED_ENCOUNTERS[C11C_BATTLE.ace] ||= boss('goldoon', 3);
}
