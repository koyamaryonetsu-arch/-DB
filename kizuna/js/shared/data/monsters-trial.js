// 第38回 B: 職業の試練の「師しょうのまぼろし」（monsters.js が addTrialHidden で まぜる・encounters.js が FIXED_TRIAL を まぜる）
// 図鑑・魔物の 数・配合には 出さない（数えない 形。闘技場の 王者と おなじ）。仲間にも ならない
// ここの 数は もとの 強さ。戦いの はじめに shared/battle-trial.js が、試練の 職業の 得意・苦手（jobs.js の mods）を かけ、
// その 職業の 技を 使う まぼろし（鏡のうつし身の しくみ。見た目は 白い かみの 師しょう）に かえる
// めやす（tools/sim-trial.mjs。docs/plan-r38.md の B）: 一の試練 Lv50・二の試練 Lv58 くらいの 超級職 4人で 勝てる
const STATUS = { sleep: 0.15, poison: 0.3, confuse: 0.15, blind: 0.3, silence: 0.3, paralyze: 0.15 };

export const TRIAL_MONSTERS = {
  trial_phantom1: {
    name: '師しょうのまぼろし', lv: 50, hp: 15500, mp: 999, str: 200, def: 130, agi: 92, mag: 190, dmgRate: 0.55, exp: 9000, gold: 0,
    race: 'human', size: 'm', boss: true, turns: 2, speed: 0.7, hit: 'slash', art: 'utsushimi',
    resist: { ...STATUS },
    actions: [{ w: 1, id: 'attack' }],
    phases: [{ hpBelow: 0.4, msg: ['師しょうのまぼろしの目が、するどく光った！', '「ここからが、本当の試練だ！」…攻撃力が上がった！'], buff: { atk: 1.15 } }],
    desc: '職業の試練で戦う、師しょうのまぼろし。その職業の技を使ってくる。',
  },
  trial_phantom2: {
    name: '師しょうのまぼろし', lv: 58, hp: 23500, mp: 999, str: 230, def: 150, agi: 100, mag: 215, dmgRate: 0.55, exp: 16000, gold: 0,
    race: 'human', size: 'm', boss: true, turns: 2, speed: 0.72, hit: 'slash', art: 'utsushimi',
    resist: { ...STATUS },
    actions: [{ w: 1, id: 'attack' }],
    phases: [{ hpBelow: 0.4, msg: ['師しょうのまぼろしの体から、金色の気があふれ出した！', '「見事だ…！だが、まだ終わらぬ！」…攻撃力が上がった！'], buff: { atk: 1.15 } }],
    desc: '職業の試練で戦う、師しょうのまぼろし。その職業の技を使ってくる。',
  },
};

// きまった 戦い（world/job-trials.js が startFixedBattle で はじめる）。にげられない・負けても お金は へらない（loseOk）
const TRIAL = (sp) => ({ group: [[sp, 1, 1]], bg: 'mirror_hall', bgm: 'boss', canFlee: false, loseOk: true, boss: true, trial: true });
export const FIXED_TRIAL = {
  job_trial_1: TRIAL('trial_phantom1'),
  job_trial_2: TRIAL('trial_phantom2'),
};

// 数えない 形で まぜる（図鑑・魔物の 数・配合の 一覧には 出ない。MONSTERS[id] は ふつうに 引ける）
export function addTrialHidden(table) {
  for (const [id, m] of Object.entries(TRIAL_MONSTERS)) {
    if (Object.prototype.hasOwnProperty.call(table, id)) continue;
    Object.defineProperty(table, id, { value: { noBefriend: true, ...m }, enumerable: false, configurable: true, writable: true });
  }
}
