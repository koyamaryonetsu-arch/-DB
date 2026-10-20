// 第38回 B: 職業の試練の だいほん（story.js で まぜる）。ルミナの町の 星の神殿の「試練の番人」（maps/index.js）
// しょりの なかみ（試練の じょうたい・受ける・師しょうのまぼろしとの 戦い）は world/job-trials.js が TRIAL_HOOKS に 入れる
// ひとりずつ（物語では ない。話しかけた 人の 今の 職業）。師しょうのまぼろしの 戦いには、そばに いる 家族も 入れる
export const TRIAL_HOOKS = {};
const call = (k) => [['call', (run) => TRIAL_HOOKS[k]?.(run)]];

export const TRIAL_KEEPER = '試練の番人';

export const TRIAL_SCRIPTS = {
  trial_keeper: () => call('keeper'),
};
