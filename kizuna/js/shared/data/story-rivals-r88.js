// 第88回 G3班: まぼろしの回ろうの だいほん（story.js で まぜる）。とびらを 調べると 'rival_door_<作品>'（maps/rivals-r88.js の actions）
// しょりの なかみ（とびらが 開くか・まど・ライバルの まぼろしとの 戦い・ごほうび）は world/rivals-r88.js が RIVAL_HOOKS に 入れる
// ひとりずつ（物語では ない。調べた 人の 持ち物と 勝った 記録）。戦いには そばに いる 家族も 入れる
import { RIVAL_DOORS } from './rivals-r88.js?v=26d09a2ba259';

export const RIVAL_HOOKS = {};

export const RIVAL_SCRIPTS = Object.fromEntries(RIVAL_DOORS.map((d) => [`rival_door_${d.work}`, () => [['call', (run) => RIVAL_HOOKS.door?.(run, d.work)]]]));
