// ひみつのダンジョンの だいほん（story.js で まぜる）
// しょりの なかみは world/secret.js が SD_HOOKS に 入れる（入る・下りる・番人・ごほうび・地上へ・記録の 板）
export const SD_HOOKS = {};

const call = (k) => () => [['call', (run) => SD_HOOKS[k]?.(run)]];

export const SD_SCRIPTS = {
  // ルミナの町の 南門の 外の 入口（maps/secret-dungeon.js の SD_DOOR）
  sd_door: call('door'),
  // 入口の 広間（sd_gate）: 案内人・記録の 板・地下1階への 階段・地上への 階段
  sd_guide: call('guide'),
  sd_board: call('board'),
  sd_enter: call('enter'),
  // 下り階段（10階ごとの 休み所では 番人と 戦ってから）・ふさがった 上り階段
  sd_down: call('down'),
  sd_up: () => [['say', null, '上り階段は、ふしぎな力でふさがっている…。\n（地上へもどれるのは、5階ごとの休み所から）']],
  // 休み所: 休み所の 番人（先へ進む／地上へもどる）・ごほうびの 宝箱・番人（10階ごと）
  sd_rest: call('rest'),
  sd_chest: call('chest'),
  sd_spring: call('spring'),
  sd_guard: call('down'),
};
