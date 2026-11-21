// 第100回 A班: B班（戦いと 品）が 入るまでの かりの 戦い・だいじな 物（テストと ブラウザの 道具だけが 読む。合わせる 時に 消す）
// ※ 本体（maps・data・world・client）は この ファイルを 読まない
import { FIXED_ENCOUNTERS } from './encounters.js';
import { ITEMS } from './items.js';
import { C11A_BATTLE, STAR_CHART, STAR_SHIP } from '../maps/c11a-flags.js';

const boss = (sp, n = 1, bg = 'star_tower_top') => ({ group: [[sp, n, n]], bg, bgm: 'boss', canFlee: false, boss: true });
export function installC11aStub() {
  FIXED_ENCOUNTERS[C11A_BATTLE.beast] ||= boss('goldoon', 3);
  FIXED_ENCOUNTERS[C11A_BATTLE.pirate] ||= boss('goldoon', 2);
  ITEMS[STAR_CHART] ||= { name: '星図', type: 'key', desc: 'かり' };
  ITEMS[STAR_SHIP] ||= { name: '星の船', type: 'key', desc: 'かり' };
}
