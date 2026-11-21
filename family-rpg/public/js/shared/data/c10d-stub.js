// 第99回 A班: B班（戦いと 品）が 入るまでの かりの 戦い・だいじな 物（テストと ブラウザの 道具だけが 読む。合わせる 時に 消す）
// ※ 本体（maps・data・world・client）は この ファイルを 読まない
import { FIXED_ENCOUNTERS } from './encounters.js';
import { ITEMS } from './items.js';
import { C10D_BATTLE, NOTE_DO } from '../maps/c10d-flags.js';

const boss = (sp, n = 1) => ({ group: [[sp, n, n]], bg: 'star_tower_top', bgm: 'boss', canFlee: false, boss: true });
export function installC10dStub() {
  FIXED_ENCOUNTERS[C10D_BATTLE.gate1] ||= boss('goldoon');
  FIXED_ENCOUNTERS[C10D_BATTLE.gate2] ||= boss('goldoon', 2);
  FIXED_ENCOUNTERS[C10D_BATTLE.gate3] ||= boss('goldoon', 2);
  FIXED_ENCOUNTERS[C10D_BATTLE.gate4] ||= boss('goldoon', 3);
  FIXED_ENCOUNTERS[C10D_BATTLE.mirror] ||= boss('goldoon');
  ITEMS[NOTE_DO] ||= { name: '星の音（ド）', type: 'key', desc: 'かり' };
}
