// 第8章 第4幕「時のはざま」（Step 7・8。A: 世界と物語）の マップを まとめる（maps/c8.js の attachCh8 で まぜる）
// ※ ネタバレ注意（docs/plan-ch8.md の 9）
// ・maps/c8r-hall.js … 時の広間 c8r_hall・さいごの 場所 c8r_core
// ・maps/c8r-wings.js … つばさ 4つ（c8r_moon_1〜c8r_ice_2。_now も）・最後の 回廊（c8r_last_1〜3。_now も）。階の 形は maps/c8r-rows.js、しくみは maps/c8r-floor.js
// ・maps/c8r-field.js … 今の ほしみの丘の 時の さけめ・4人の 勇者の 像
// ・maps/c8r-flags.js … フラグ・マップの ID
import { buildC8rFloors, C8R_WING_MAPS, C8R_LAST_MAPS } from './c8r-wings.js?v=e32f6eb85bad';
import { buildHall, buildCore } from './c8r-hall.js?v=e32f6eb85bad';
import { attachC8rField, RIFT8R_OUT } from './c8r-field.js?v=e32f6eb85bad';
import { HALL_ID, CORE_ID } from './c8r-flags.js?v=e32f6eb85bad';

// 第8章 第4幕の マップの ID（セーブに のこるので かえない）
export const C8R_MAPS = [HALL_ID, ...C8R_WING_MAPS, ...C8R_LAST_MAPS, CORE_ID];

export function attachC8r(maps) {
  Object.assign(maps, buildC8rFloors());
  maps[HALL_ID] = buildHall(RIFT8R_OUT);
  maps[CORE_ID] = buildCore();
  attachC8rField(maps);
}
