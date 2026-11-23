// 第102回 A班: B班（戦いと 品）が 入るまでの かりの 戦い・だいじな 物（テストと ブラウザの 道具だけが 読む。合わせる 時に 消す）
// ※ 本体（maps・data・world・client）は この ファイルを 読まない
// ・中ボス c11b_keeper … かりは ゴールドン 1体 / ボス c11b_oboro … かりは ゴールドン 3体（オボロと 天人 2体の かわり）。
//   スピカは 第3部の 決まった 戦いと 同じく、リーダーが c9_child を 持って いれば ゲストで 出る（battle-c9a.js の setupC9a）
import { FIXED_ENCOUNTERS } from './encounters.js';
import { ITEMS } from './items.js';
import { C11B_BATTLE, NAME_LAMP } from '../maps/c11b-flags.js';

const boss = (sp, n = 1, bg = 'star_tower_top') => ({ group: [[sp, n, n]], bg, bgm: 'boss', canFlee: false, boss: true });
export function installC11bStub() {
  FIXED_ENCOUNTERS[C11B_BATTLE.keeper] ||= boss('goldoon', 1);
  FIXED_ENCOUNTERS[C11B_BATTLE.oboro] ||= boss('goldoon', 3);
  ITEMS[NAME_LAMP] ||= { name: '名前のランプ', type: 'key', desc: 'かり' };
}
