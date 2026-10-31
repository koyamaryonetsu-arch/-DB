// 第50回 D4: 上の 職業の 技ほど 補助・回復が 強い（家族の ねがい「名前が ちがう だけで 効果が おなじ 技が 多すぎる」）
//
// 技の ランク … その 技の 職業（ABILITIES[id].job）の tier（0 基本職・1 上級職・2 超級職・3 伝説・4 幻の職業〈第51回〉）
//   ・ひらめき技 … job が ついて いるので その 職業の ランク
//   ・job の ない 技 … 覚える 職業（JOBS の learn）の いちばん 上の ランク。掛け合わせ技（combo）は 上級職から ひらめくので 1 より 下に しない
//   ・仲間の キャラの 技（ノクトの 技 など）・じゃんけんの グー など … 0
//   ・合体技 … 2（DUAL_TIER。補助の だんかい・回数だけ。回復と MP は 合体技の きまりの まま）
// 強く なるのは
//   ・補助・回復の 技（SUPPORT_TYPES を ふくみ、ダメージの 技では ない もの）だけ。ダメージの 技（おまけの デバフ つきも）は かわらない
//   ・職業の ある 人（家族・酒場の 仲間）が 使う とき だけ。魔物の 仲間・敵は かわらない（skillMods）
//
// ランクごとの こうか（TIER_MODS）
//   mpMul  … 消費MP（転職の ペナルティは この あとに かける）
//   acts   … バフ・デバフが つづく 行動の 回数
//   stages … 1回で 上がる（下がる）だんかい（上限は battle.js の BUFF_STACK・stackMult の まま）
//   healMul … 回復の 量（回復の 技・じわじわ回復・生き返らせる ときの HP）
// サーバーでも ブラウザでも つかう（stats.js の mpCost・battle.js・client/ui/skillinfo.js）
import { ABILITIES, abilityRole } from './data/abilities.js?v=31a32b16dd7b';
import { JOBS } from './data/jobs.js?v=31a32b16dd7b';
import { BUFF_ACTS } from './buff-acts.js?v=31a32b16dd7b';

export const TIER_MODS = [
  { mpMul: 1, acts: BUFF_ACTS, stages: 1, healMul: 1 },
  { mpMul: 0.9, acts: BUFF_ACTS + 1, stages: 1, healMul: 1.05 },
  { mpMul: 0.8, acts: BUFF_ACTS + 1, stages: 2, healMul: 1.1 },
  { mpMul: 0.7, acts: BUFF_ACTS + 2, stages: 2, healMul: 1.2 },
  // 第51回: 幻の職業（MP −35%・6回行動・2だんかい・回復 ×1.25）
  { mpMul: 0.65, acts: BUFF_ACTS + 3, stages: 2, healMul: 1.25 },
];
const TOP = TIER_MODS.length - 1;
export const DUAL_TIER = 2;
export const SUPPORT_TYPES = new Set(['buff', 'debuff', 'heal', 'regen', 'revive']);

// 補助・回復の 技か（multi・random は 中の こうかも 見る）
function hasSupport(e, depth = 0) {
  if (!e || depth > 3) return false;
  if (SUPPORT_TYPES.has(e.type)) return true;
  if (e.type === 'multi') return (e.parts || []).some((p) => hasSupport(p, depth + 1));
  if (e.type === 'random') return (e.options || []).some((id) => hasSupport(ABILITIES[id]?.effect, depth + 1));
  return false;
}
export function isSupportSkill(id) {
  const a = ABILITIES[id];
  return !!a && a.kind !== 'monster' && abilityRole(a) !== 'dmg' && hasSupport(a.effect);
}

// 技の id → ランク（はじめて 使う ときに 1回だけ 作る。データの 読みこみの じゅんに よらない ように）
let TIERS = null;
function build() {
  const learners = {};
  for (const j of Object.values(JOBS)) {
    for (const [, id] of j.learn || []) learners[id] = Math.max(learners[id] ?? 0, j.tier || 0);
  }
  const map = {};
  for (const [id, a] of Object.entries(ABILITIES)) {
    if (a.kind === 'monster') continue;
    let t = a.job && JOBS[a.job] ? JOBS[a.job].tier || 0 : learners[id] ?? 0;
    if (a.kind === 'combo') t = Math.max(1, t, ...(a.requires || []).map((r) => (ABILITIES[r]?.job ? JOBS[ABILITIES[r].job]?.tier || 0 : 0)));
    if (t) map[id] = Math.min(TOP, t);
  }
  return map;
}

export function skillTier(id) {
  if (!TIERS) TIERS = build();
  return TIERS[id] || 0;
}

export function tierMods(tier) {
  return TIER_MODS[Math.max(0, Math.min(TOP, tier | 0))];
}

// 職業の ある 人か（家族・酒場の 仲間。魔物の 仲間〈species〉・職業の ない 人は ちがう）
export function tierUser(char) {
  return !!char && !char.species && !!JOBS[char.job];
}

// その 人が その 技を 使う ときの こうか（職業の ない 人・補助と 回復で ない 技は いつも ランク0）
let SUP = null;
export function skillMods(char, id) {
  if (!tierUser(char)) return TIER_MODS[0];
  if (!SUP) SUP = new Map();
  if (!SUP.has(id)) SUP.set(id, isSupportSkill(id));
  return SUP.get(id) ? tierMods(skillTier(id)) : TIER_MODS[0];
}

// 戦いの 中の こうか（perform で ev.tier に 入れた もの。使った 人 本人の ときだけ。道具・敵・反撃などは ランク0）
export function evMods(c, ev) {
  return ev?.tier && ev.tier.by === c?.id ? ev.tier : TIER_MODS[0];
}

// 消費MP（ランクの ぶん へらす。もとが 1 いじょうなら 1 より 下に しない）
export function tierMp(char, id) {
  const mp = ABILITIES[id]?.mp || 0;
  if (mp < 1) return mp;
  return Math.max(1, Math.round(mp * skillMods(char, id).mpMul));
}
