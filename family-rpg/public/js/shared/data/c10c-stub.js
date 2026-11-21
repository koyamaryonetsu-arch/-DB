// 第97回 A班: B班（戦いと 品）が 入るまでの かりの 戦い・だいじな 物（テストと ブラウザの 道具だけが 読む。合わせる 時に 消す）
// ※ 本体（maps・data・world・client）は この ファイルを 読まない
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from './encounters.js';
import { ITEMS } from './items.js';
import { C10C_BATTLE, C10C_TABLE, NOTE_SI } from '../maps/c10c-flags.js';

const boss = (sp) => ({ group: [[sp, 1, 1]], bg: 'cave_boss', bgm: 'boss', canFlee: false, boss: true });
export function installC10cStub() {
  FIXED_ENCOUNTERS[C10C_BATTLE.colonel] ||= boss('goldoon');
  FIXED_ENCOUNTERS[C10C_BATTLE.algol] ||= boss('goldoon');
  for (const t of Object.values(C10C_TABLE)) ENCOUNTER_TABLES[t] ||= [{ w: 1, group: [['goblin', 1, 1]] }];
  ITEMS[NOTE_SI] ||= { name: '星の音（シ）', type: 'key', desc: 'かり' };
}
