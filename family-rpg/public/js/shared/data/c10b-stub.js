// 第95回 A班: B班（戦いと 品）が 入るまでの かりの 戦い・だいじな 物（テストだけが 読む。合わせる 時に 消す）
// ※ 本体（maps・data・world・client）は この ファイルを 読まない
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from './encounters.js';
import { ITEMS } from './items.js';
import { C10B_BATTLE, C10B_TABLE, NOTE_SO, NOTE_LA } from '../maps/c10b-flags.js';

const boss = (sp) => ({ group: [[sp, 1, 1]], bg: 'cave_boss', bgm: 'boss', canFlee: false, boss: true });
export function installC10bStub() {
  FIXED_ENCOUNTERS[C10B_BATTLE.blue] ||= boss('goldoon');
  FIXED_ENCOUNTERS[C10B_BATTLE.white] ||= boss('goldoon');
  for (const id of C10B_BATTLE.watch) FIXED_ENCOUNTERS[id] ||= { group: [['goblin', 1, 2]], bg: 'cave', bgm: 'battle', canFlee: true, loseOk: true };
  for (const t of Object.values(C10B_TABLE)) ENCOUNTER_TABLES[t] ||= [{ w: 1, group: [['goblin', 1, 1]] }];
  ITEMS[NOTE_SO] ||= { name: '星の音（ソ）', type: 'key', desc: 'かり' };
  ITEMS[NOTE_LA] ||= { name: '星の音（ラ）', type: 'key', desc: 'かり' };
}
