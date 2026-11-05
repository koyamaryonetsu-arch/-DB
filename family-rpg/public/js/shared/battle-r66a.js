// 第66回 A班: ポケモンマスターの「仲間の 魔物と いっしょに」の 技（data/abilities-r66a.js の monPal）
//
// ・物理の 技に monPal（0.25 など）が ある とき、いっしょに 戦っている 仲間の 魔物（生きている・にげていない）1体に つき
//   ダメージが monPal ずつ 上がる（MONPAL_MAX 体まで）。魔物が いない ときは ふつうの 物理の 技
// ・battle.js の applyAbility の 'phys' が はじめに よぶ（battle-phantom-a.js の phantomAPhys と おなじ 形）
export const MONPAL_MAX = 3;

// いっしょに 戦っている 仲間の 魔物の 数（自分は 数えない）
export function monPalsOf(b, c) {
  if (!b || c?.side !== 'ally') return 0;
  return b.sideOf(c, true).filter((x) => x !== c && x.alive && !x.fled && x.mon).length;
}

// 技の 力に かける 数
export function monPalMult(b, c, per) {
  if (!(per > 0)) return 1;
  return 1 + per * Math.min(MONPAL_MAX, monPalsOf(b, c));
}

export function r66aMonPal(b, c, a, cmd, ev, powMult, targets) {
  const { monPal, ...rest } = a.effect;
  const n = Math.min(MONPAL_MAX, monPalsOf(b, c));
  const eff = { ...rest };
  if (n > 0) {
    eff.mult = (eff.mult || 1) * monPalMult(b, c, monPal);
    ev.lines.push(`仲間の魔物${n}体も、いっしょに攻撃！`);
    ev.monPal = n;
  }
  b.applyAbility(c, { ...a, effect: eff }, cmd, ev, powMult, targets);
}
