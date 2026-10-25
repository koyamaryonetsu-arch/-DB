// 第38回 B: 職業の試練の「師しょうのまぼろし」（docs/plan-r38.md の B）
// battle.js は かえない。world/job-trials.js が 戦いを 作った すぐ あとに setupTrialPhantom を よぶ（world/battles.js の opts.setup）。
// tools/sim-trial.mjs も おなじ ものを 使う
//
// ・まぼろし（monsters-trial.js の trial_phantom1・2）を、試練の 職業の 師しょうに かえる:
//   強さ … もとの 数 × その 職業の 得意・苦手（jobs.js の mods。PHANTOM_MODS の ちょうせい）/ 技 … その 職業の 技（覚える 技。
//   鏡のうつし身と おなじく 戦いを こわす 技・生き返らせる 技は 使わない）/ 見た目 … 白い かみの 師しょう（鏡の 色。client/battle-temple.js）
// ・技の えらび方は 鏡のうつし身と おなじ（mirrorOf が ある 敵は battle-temple.js の templeAction → mirrorDecide → 仲間の オートの AI）
// ・はじめの ことば: 師しょうの 教え（data/job-trials.js の trialWords。職業ごと）
import { JOBS, JOB_MAX_LEVEL } from './data/jobs.js?v=a2abc3298a71';
import { ABILITIES } from './data/abilities.js?v=a2abc3298a71';
import { strengthenEnemy } from './data/difficulty.js?v=a2abc3298a71';
import { MONSTERS } from './data/monsters.js?v=a2abc3298a71';
import { mirrorSkillOk } from './battle-temple.js?v=a2abc3298a71';
import { PHANTOM_NAME, phantomLook, trialWords, masterName, TRIALS } from './data/job-trials.js?v=a2abc3298a71';

// 職業の mods の 効き方（1 … そのまま。回復は 弱め … 回復ばかりで 長い 戦いに ならない ように）
export const PHANTOM_MODS = { hp: 0.5, str: 1, def: 0.6, agi: 0.5, mag: 1, heal: 0.6 };
export const PHANTOM_MP = 3000;
// 職業ごとの ダメージの ちょうせい（[一の試練, 二の試練]。職業の 技の 強さが ちがうので、tools/sim-trial.mjs で 勝ちが そろう ように 合わせた）
//   （第38回 C の バフの きまり〈3回行動で 切れる〉に 合わせて さがし直した。tools/sim-trial-tune.mjs: 完全オートの 勝ちが 75% に なる 倍率。ゆれが 大きい 職業は 2回 さがした 平均。もとの 倍率は monsters-trial.js の dmgRate 0.55）
export const PHANTOM_ADJ = {
  dragon_knight: [1.56, 1.72], archmage: [1.56, 1.64], high_priest: [1.38, 0.87], god_hand: [1.37, 0.89], summoner: [1.52, 1.31],
  magic_swordsman: [1.3, 0.99], guardian: [2, 2], hero: [1.56, 1.59], monster_master: [2, 2], star_diva: [1.44, 1.37],
  sword_master: [0.65, 0.48], shogun: [0.55, 0.37], shacho: [1.56, 1.18], nitoryu: [3.43, 2.59], highschooler: [1.3, 1.15],
  career: [0.87, 0.7], fruit_idol: [1.44, 1.18], storm_idol: [1.44, 1.41], keikyu_driver: [0.42, 0.35], star_chef: [1.9, 1.95],
  tatakiage: [1.37, 1.21], m1_champion: [0.96, 0.7], daikenja: [1.59, 1.56], datenshi: [1.31, 1.31], ss2: [0.57, 0.45],
  ryonetsu: [0.89, 0.7], rubber: [0.65, 0.43], black_star: [1.41, 0.99], enbashira: [1.34, 1.15], black_org: [0.87, 0.65],
  doraemon: [2, 1.72], kinniku_kappa: [1.07, 0.87], konoha: [1.44, 1.04], himura: [1.24, 1.01], kaito_kid: [0.96, 0.46],
  harry: [0.85, 0.65], fullmetal: [0.58, 0.43], sailor_moon: [1.21, 1.18], loto_hero: [1.3, 1.04], ss3: [0.71, 0.48],
  nika: [0.61, 0.55], maou: [0.75, 0.55], facility_genius: [0.86, 0.74], hakaishin: [0.6, 0.6], hinokami: [0.63, 0.49],
  hokage: [0.53, 0.43], abarenbo_shogun: [0.77, 0.7], hiten: [0.68, 0.58], homeroom_3b: [0.58, 0.68],
  // 第40回
  ryumajin: [1.12, 1.19], neo_queen: [0.52, 0.72],
  // 第41回 B
  snow_queen: [1.56, 1.42], fifth_spirit: [1.01, 0.91],
  // 第41回 A
  keikyu_president: [0.64, 0.54], hall_of_fame: [1.02, 0.89],
  // 第43回
  mario: [1.48, 1.26],
};
// 使わない 技の こうか（生き返らせる・みんなの MP を へらす など。鏡のうつし身の MIRROR_SKIP の ほか）
const NO_USE = new Set(['revive', 'reviveAll']);
// 回復の 技（HPが HEAL_BELOW より 少ない ときだけ 使う）
const HEAL_TYPES = new Set(['heal', 'regen', 'cure', 'mpHeal']);
export const HEAL_BELOW = 0.4;
// 1回の 戦いで 回復できる 回数（大きく 回復する 技を もつ 職業だけ。ほかは 今までどおり 何度でも）
export const HEAL_CAP = { nitoryu: 3 };
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
  // 回復は 1回の 戦いで HEAL_CAP 回まで（前の 番より HPが ふえていたら 回復した と 数える。二刀流スターの ねむりファーストで いつまでも たおせない のを ふせぐ）
  const healMax = HEAL_CAP[job] ?? Infinity;
  let lastHp = m.hp;
  let heals = 0;
  Object.defineProperty(m, 'abilities', {
    get() {
      if (this.hp > lastHp + 1) heals++;
      lastHp = this.hp;
      return this.hp < this.maxHp * HEAL_BELOW && heals < healMax ? all : noHeal;
    },
    set() {}, enumerable: true, configurable: true,
  });
  const words = trialWords(job, trial.who);
  b.emit({ t: 'msg', lines: [`${masterName(job, trial.who)}のまぼろしが、すがたを現した！`, `「${words}」`], dur: 2000 });
  return m;
}
