// 第38回 B: 職業の試練の「師しょうのまぼろし」（docs/plan-r38.md の B）
// battle.js は かえない。world/job-trials.js が 戦いを 作った すぐ あとに setupTrialPhantom を よぶ（world/battles.js の opts.setup）。
// tools/sim-trial.mjs も おなじ ものを 使う
//
// ・まぼろし（monsters-trial.js の trial_phantom1・2）を、試練の 職業の 師しょうに かえる:
//   強さ … もとの 数 × その 職業の 得意・苦手（jobs.js の mods。PHANTOM_MODS の ちょうせい）/ 技 … その 職業の 技（覚える 技。
//   鏡のうつし身と おなじく 戦いを こわす 技・生き返らせる 技は 使わない）/ 見た目 … 白い かみの 師しょう（鏡の 色。client/battle-temple.js）
// ・技の えらび方は 鏡のうつし身と おなじ（mirrorOf が ある 敵は battle-temple.js の templeAction → mirrorDecide → 仲間の オートの AI）
// ・はじめの ことば: 師しょうの 教え（data/job-trials.js の trialWords。職業ごと）
import { JOBS, JOB_MAX_LEVEL } from './data/jobs.js';
import { ABILITIES } from './data/abilities.js';
import { strengthenEnemy } from './data/difficulty.js';
import { MONSTERS } from './data/monsters.js';
import { mirrorSkillOk } from './battle-temple.js';
import { PHANTOM_NAME, phantomLook, trialWords, masterName, TRIALS } from './data/job-trials.js';

// 職業の mods の 効き方（1 … そのまま。回復は 弱め … 回復ばかりで 長い 戦いに ならない ように）
export const PHANTOM_MODS = { hp: 0.5, str: 1, def: 0.6, agi: 0.5, mag: 1, heal: 0.6 };
export const PHANTOM_MP = 3000;
// 職業ごとの ダメージの ちょうせい（[一の試練, 二の試練]。職業の 技の 強さが ちがうので、tools/sim-trial.mjs で 勝ちが そろう ように 合わせた）
//   （tools/sim-trial-tune.mjs: 完全オートの 勝ちが 75% に なる 倍率。ゆれが 大きい 職業は 2回 さがした 平均。もとの 倍率は monsters-trial.js の dmgRate 0.55）
export const PHANTOM_ADJ = {
  dragon_knight: [1.98, 1.95], archmage: [1.46, 1.72], high_priest: [1.87, 1.5], god_hand: [1.66, 1.24], summoner: [1.63, 1.72],
  magic_swordsman: [1.7, 1.43], guardian: [5.4, 4.54], hero: [1.66, 1.6], monster_master: [3.85, 3.34], star_diva: [1.44, 1.53],
  sword_master: [0.78, 0.63], shogun: [0.97, 0.67], shacho: [2.06, 1.88], nitoryu: [5.09, 4.64], highschooler: [1.51, 1.38],
  career: [0.97, 0.92], fruit_idol: [1.41, 1.51], storm_idol: [1.54, 1.57], keikyu_driver: [0.83, 0.68], star_chef: [1.88, 2.13],
  tatakiage: [1.54, 1.43], m1_champion: [1.29, 1.25], daikenja: [1.62, 1.59], datenshi: [1.63, 1.57], ss2: [0.9, 0.72],
  ryonetsu: [1.16, 1.12], rubber: [1.02, 0.75], black_star: [1.75, 1.54], enbashira: [1.6, 1.51], black_org: [1.51, 1.27],
  doraemon: [3.04, 2.35], kinniku_kappa: [1.16, 1.16], konoha: [2.09, 1.95], himura: [1.31, 1.27], kaito_kid: [1.6, 1.34],
  harry: [1.14, 0.98], fullmetal: [0.83, 0.65], sailor_moon: [1.24, 1.28],
  loto_hero: [1.8, 1.59], ss3: [1.08, 0.94], nika: [0.85, 0.81], maou: [0.51, 0.51], facility_genius: [1.1, 1.12], hakaishin: [0.62, 0.7],
  hinokami: [0.97, 0.93], hokage: [0.68, 0.74], abarenbo_shogun: [0.9, 0.9], hiten: [0.72, 0.78], homeroom_3b: [0.85, 0.92],
};
// 使わない 技の こうか（生き返らせる・みんなの MP を へらす など。鏡のうつし身の MIRROR_SKIP の ほか）
const NO_USE = new Set(['revive', 'reviveAll']);
// 回復の 技（HPが HEAL_BELOW より 少ない ときだけ 使う）
const HEAL_TYPES = new Set(['heal', 'regen', 'cure', 'mpHeal']);
export const HEAL_BELOW = 0.4;
const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || a.effect : a?.effect || {});

const pow = (m, k) => Math.pow(Math.max(0.3, m || 1), k);

// その 職業の まぼろしが 使う 技
export function phantomSkills(job) {
  const out = [];
  for (const [, id] of JOBS[job]?.learn || []) {
    const a = ABILITIES[id];
    if (!a || a.fieldOnly || a.kind === 'bond' || !mirrorSkillOk(id) || NO_USE.has(prim(a).type) || out.includes(id)) continue;
    // すぐに もう一度 動ける 技（二刀流 など）は 使わない（2回 動く ボスが つづけて 動きつづけて しまう）
    if ((prim(a).atbAfter || 0) >= 80) continue;
    out.push(id);
  }
  return out;
}

// まぼろしの 強さ（もとの 魔物 m の 数 × 職業）
export function phantomStats(m, job) {
  const mods = JOBS[job]?.mods || {};
  const K = PHANTOM_MODS;
  const R = (v) => Math.max(1, Math.round(v));
  const maxHp = R(m.maxHp * pow(mods.hp, K.hp));
  return {
    maxHp, hp: maxHp, maxMp: PHANTOM_MP, mp: PHANTOM_MP,
    atk: R(m.atk * pow(mods.str, K.str)), dfn: R(m.dfn * pow(mods.def, K.def)), agi: R(m.agi * pow(mods.agi, K.agi)),
    mag: R(m.mag * pow(mods.mag, K.mag)), healPow: R(m.mag * pow(mods.heal, K.heal) * 0.7),
  };
}

// 戦いの はじめ（world/job-trials.js の startTrialBattle・tools/sim-trial.mjs）
//   trial … { job, n（何番目の 試練）, who（試練を 受けた 人の キャラ。名前・見た目の 体） }
export function setupTrialPhantom(b, trial) {
  const job = trial?.job;
  const m = b.enemies.find((e) => /^trial_phantom/.test(e.species || ''));
  if (!m || !JOBS[job]) return null;
  const T = TRIALS[(trial.n || 1) - 1] || TRIALS[0];
  // 敵の 強さ（ハード など）は もとの 数に もう かかっているので、まず もどす
  const rate = b.enemyRate > 1 ? b.enemyRate : 1;
  const base = rate > 1 ? { maxHp: m.maxHp / rate, atk: m.atk / rate, dfn: m.dfn / rate, agi: m.agi / rate, mag: m.mag / rate } : m;
  Object.assign(m, phantomStats(base, job));
  if (rate > 1) strengthenEnemy(m, rate);
  const weapons = JOBS[job].weapons || [];
  Object.assign(m, {
    name: PHANTOM_NAME, baseName: PHANTOM_NAME, letter: '', lv: T.lv,
    // 鏡のうつし身の しくみ（battle-temple.js の templeAction が mirrorDecide で 技を えらぶ・がめんは 鏡の 色の 人の 絵）
    mirrorOf: 'trial', trialJob: job, trialN: T.n,
    // 与える ダメージの 倍率（プレイヤーの 技は 強いので。battle.js の damage）
    dmgRate: (MONSTERS[m.species]?.dmgRate || 1) * (PHANTOM_ADJ[job]?.[T.n - 1] ?? 1),
    abilities: phantomSkills(job),
    tactics: 'aggressive', autoOff: [],
    penChar: { job, jobs: { [job]: { lv: JOB_MAX_LEVEL, b: 0 } } },
    weaponCat: weapons.find((w) => w !== 'none') || 'none', onHit: null,
    look: phantomLook(job, trial.who), job, eq: '',
  });
  // 回復の 技は HPが HEAL_BELOW より 少ない ときだけ（ひとりで 回復ばかり して 長い 戦いに ならない ように）
  const all = m.abilities;
  const noHeal = all.filter((id) => !HEAL_TYPES.has(prim(ABILITIES[id]).type));
  Object.defineProperty(m, 'abilities', { get() { return this.hp < this.maxHp * HEAL_BELOW ? all : noHeal; }, set() {}, enumerable: true, configurable: true });
  const words = trialWords(job, trial.who);
  b.emit({ t: 'msg', lines: [`${masterName(job, trial.who)}のまぼろしが、すがたを現した！`, `「${words}」`], dur: 2000 });
  return m;
}
