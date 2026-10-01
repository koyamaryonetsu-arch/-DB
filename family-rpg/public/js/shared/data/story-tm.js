// 宝の地図の だいほん（story.js で まぜる）
// しょりの なかみは world/treasure.js が TM_HOOKS に 入れる（地図を わたす・洞窟を 出る・洞窟の 主）
export const TM_HOOKS = {};

export const TM_SCRIPTS = {
  tm_hunter: () => [['call', (run) => TM_HOOKS.hunter?.(run)]],
  tm_exit: () => [['call', (run) => TM_HOOKS.exit?.(run)]],
  tm_boss: () => [['call', (run) => TM_HOOKS.boss?.(run)]],
};

// 主との 戦いは パーティーの みんなで（リーダーの 洞窟）
export const TM_STORY_SCRIPTS = ['tm_boss'];
