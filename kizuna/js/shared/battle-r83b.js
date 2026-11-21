// 第83回 B班: ぬ〜べ〜の 系統の 戦いの しくみ（docs/plan-jobs-r79.md の 9-2・9-3。docs/plan-r83-jobs-b.md）
// どれも 戦いの 中だけ（c.oni など 戦いの 中の 人に つける。キャラ〈セーブ・引っこしコード〉には 何も 足さない）
//
// 1. 生徒を 守る（jobs の passive.protect … かばう 確率。超級職 0.5・伝説 0.8。上級職は なし）
//    ・敵が 仲間 1人を ねらった 時、その 仲間の HP が WEAK_AT（3わり）いか なら、先生が この 確率で 自動で かばう（resolveTarget の r83bCover）。
//      ダメージは 先生の 守備力で 計算しなおす（ふつうの「かばう」と おなじ）
//    ・敵 全体の 攻撃（呪文・ブレス・全体の 技）では、弱った 仲間 1人ぶんだけ かばう（1回の 行動で 1回。r83bDamage）。
//      その 仲間は ダメージを 受けず、受ける はずだった ダメージを 先生が 受ける（先生は 自分の ぶんと 2回 受ける）
//    ・先生が かばわない 時: 先生の HP が SELF_SAFE（2わり）いか・その ダメージで 先生が たおれる（全体の 時）・ねむり・マヒ・こんらん・
//      地われ・自分が ねらわれて いる。手で えらんだ「かばう」（cover）が ある 時は そちらが 先
// 2. おにの手（こうか oniHand。もう一度 使うと ふういんしなおす）: c.oni = { lv, awake, max }
//    ・出した 時 lv 1（物理の ダメージ ＋15%）。自分の 番の はじめに lv ＋1（＋15% ずつ。上限は 職業の passive.oniMax か 技の max。超級職 60%・伝説 90%）
//    ・かわりに 自分の 番の はじめごとに 最大HP の ONI_DRAIN（6%）が へる。これで たおれは しない（HP 1 で 止まる）。
//      HP が ONI_SAFE（15%）いかで 番が 来たら、HP は へらさず、おにの手は 自動で ふういんに もどる
//    ・おにの手・かくせい（oniAwake）: turns 回の 番の 間、上限の 力で、HP が へらない。おにの手・最大出力（oniSeal）: 使うと ふういんに もどる
//    ・強く なるのは 物理の 攻撃（ふつうの 攻撃も 技も。calcPhys の r83bPhysMult）。呪文は かわらない
// 3. ゆうれい・悪魔に 強い: 技の vsRace（物理は battle.js の calcPhys が 前から 見る。呪文の おふだは r83bMagicMult）
// 4. 体をはって守る（teShield）: 次の 自分の 番まで 仲間全員を かばい（cover all）、その 間 先生の 受ける ダメージが take 倍
// 5. 生徒たちの声（teKoe）: この 戦いの 間、自分の HP が 少ないほど 物理の ダメージが 上がる（社ちくの grit と おなじ 形）
// battle.js から よぶ: r83bTurnStart（行動の はじめ）・r83bCover（resolveTarget）・r83bEffect（applyAbility）・r83bPhysMult（calcPhys）・
//   r83bMagicMult（calcMagic）・r83bDamage（damage の はじめ）・r83bPub（pub）
// ai.js から よぶ: r83bPlan（オートの 動き）
import { JOBS } from './data/jobs.js?v=d8756ad5e62e';
// 受ける ダメージを へらしすぎない 下限（軍師の 系統と おなじ 数。第83回 A班）
import { CUT_FLOOR } from './battle-r83a.js?v=d8756ad5e62e';

export const ONI_STEP = 0.15;
export const ONI_DRAIN = 0.06;
export const ONI_SAFE = 0.15;
export const WEAK_AT = 0.3;
export const SELF_SAFE = 0.2;
// ゆうれい・アンデッド・悪魔
export const GHOST_RACES = ['spirit', 'undead', 'demon'];
const BAD = ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'];

const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || a.effect : a?.effect || {});
const partsOf = (a) => (a?.effect?.type === 'multi' ? a.effect.parts || [] : [a?.effect || {}]);
// この 系統の 職業（オートは この 職業の 技だけ 見る）
export const R83B_LINE = ['elem_teacher', 'nube', 'jigoku_sensei'];
export const protectRate = (c) => (c?.side === 'ally' ? JOBS[c.job]?.passive?.protect || 0 : 0);

// ───────────── おにの手 ─────────────
// 上限（わりあい）。今の 職業の passive.oniMax と 出した 技の max の 大きい ほう
export const oniMaxOf = (c) => Math.max(JOBS[c?.job]?.passive?.oniMax || 0, c?.oni?.max || 0, ONI_STEP);
const maxSteps = (c) => Math.max(1, Math.round(oniMaxOf(c) / ONI_STEP));
// 今の 上がり方（わりあい。出して いない 時は 0）
export function oniPct(c) {
  if (c?.side !== 'ally' || !c.oni) return 0;
  if (c.oni.awake > 0) return oniMaxOf(c);
  return Math.min(oniMaxOf(c), c.oni.lv * ONI_STEP);
}
const pctText = (c) => `${Math.round(oniPct(c) * 100)}%`;

function seal(c, ev, line) {
  if (!c.oni) return false;
  delete c.oni;
  ev.lines.push(line || `${c.name}は、おにの手をふういんしなおした。`);
  ev.oniOff = c.id;
  ev.upd.push(c);
  return true;
}

// ───────────── 行動の はじめ ─────────────
export function r83bTurnStart(b, c, ev) {
  if (c?.side !== 'ally') return;
  // 体をはって守る は 次の 自分の 番で おわる
  if (c.teShield) {
    if (c.cover === c.teShield.cover) c.cover = null;
    delete c.teShield;
    ev.upd.push(c);
  }
  if (!c.oni || !c.alive) return;
  if (c.oni.awake > 0) {
    c.oni.awake--;
    c.oni.lv = maxSteps(c);
    ev.lines.push(c.oni.awake > 0 ? `${c.name}のおにの手が、まっ赤にもえている！（のこり${c.oni.awake + 1}回）` : `${c.name}のおにの手が、まっ赤にもえている！（最後の1回）`);
    ev.oniUp = c.id;
    ev.upd.push(c);
    return;
  }
  // あぶない: HP を へらさず ふういんに もどす
  if (c.hp <= c.maxHp * ONI_SAFE) {
    seal(c, ev, `${c.name}のおにの手が、ふういんにもどった！（HPがあぶない）`);
    return;
  }
  c.oni.lv = Math.min(maxSteps(c), c.oni.lv + 1);
  const d = Math.min(c.hp - 1, Math.max(1, Math.round(c.maxHp * ONI_DRAIN)));
  ev.lines.push(`${c.name}のおにの手の力が上がった！（物理の攻撃+${pctText(c)}）`);
  if (d > 0) {
    c.hp -= d;
    ev.lines.push(`${c.name}は、おにの手に力をすわれて、HPが${d}へった。`);
    (ev.results = ev.results || []).push({ id: c.id, dmg: d, oni: true });
  }
  ev.oniUp = c.id;
  ev.upd.push(c);
}

// ───────────── 技の こうか ─────────────
// へんじ: この ファイルの こうかなら true
export function r83bEffect(b, c, a, eff, ev, targets) {
  switch (eff.type) {
    case 'oniHand': {
      if (c.side !== 'ally') return true;
      if (c.oni) {
        seal(c, ev);
        return true;
      }
      c.oni = { lv: 1, awake: 0, max: eff.max || 0.6 };
      ev.lines.push(`おにの手のふういんがとけた！（物理の攻撃+${pctText(c)}。番ごとに強くなるが、HPがへっていく）`);
      ev.oniOn = c.id;
      ev.upd.push(c);
      return true;
    }
    case 'oniAwake': {
      if (c.side !== 'ally') return true;
      if (!c.oni) c.oni = { lv: 1, awake: 0, max: 0.6 };
      c.oni.awake = eff.turns || 3;
      c.oni.lv = maxSteps(c);
      ev.lines.push(`おにの手が目ざめた！（${c.oni.awake}回の番の間、物理の攻撃+${pctText(c)}で、HPがへらない）`);
      ev.oniOn = c.id;
      ev.upd.push(c);
      return true;
    }
    case 'oniSeal': {
      if (c.side === 'ally') seal(c, ev, `${c.name}のおにの手は、力を出しきって、ふういんにもどった。`);
      return true;
    }
    case 'teShield': {
      c.cover = { target: 'all', left: 1 };
      if (c.side === 'ally') c.teShield = { take: eff.take ?? 0.6, cover: c.cover };
      ev.lines.push(`${c.name}は、仲間全員の前に立ちはだかった！（次の番まで、みんなをかばう）`);
      ev.upd.push(c);
      return true;
    }
    case 'teKoe': {
      c.koeGrit = Math.max(c.koeGrit || 0, eff.grit || 0.6);
      ev.lines.push(`${c.name}は、HPが少ないほど力がわいてくる！`);
      ev.upd.push(c);
      return true;
    }
    default: return false;
  }
}

// ───────────── ダメージの 計算 ─────────────
// 物理（calcPhys）: おにの手・生徒たちの声
export function r83bPhysMult(c) {
  if (c?.side !== 'ally') return 1;
  let m = 1 + oniPct(c);
  if (c.koeGrit && c.maxHp > 0) m *= 1 + c.koeGrit * Math.min(1, Math.max(0, 1 - c.hp / c.maxHp));
  return m;
}
// 呪文（calcMagic）: 魔物の 種類に 強い 呪文（おふだ）
export function r83bMagicMult(c, t, eff = {}) {
  return eff.vsRace?.[t?.race] || 1;
}

// かばえる 先生（t の かわりに 受ける 人）。dmg … わかって いる 時は、それで たおれる 先生は かばわない
function protector(b, t, dmg) {
  return b.allies.find((x) => x !== t && x.alive && !x.fled && protectRate(x) > 0
    && !x.status.sleep && !x.status.paralyze && !x.status.confuse && !x.status.rift
    && x.hp > x.maxHp * SELF_SAFE && !(dmg >= x.hp)) || null;
}
const weak = (t) => t?.side === 'ally' && t.alive && t.maxHp > 0 && t.hp <= t.maxHp * WEAK_AT;

// 敵が 仲間 1人を ねらった（battle.js の resolveTarget。手で えらんだ かばう の あと）。へんじ: 受ける 人
export function r83bCover(b, c, t) {
  if (c?.side !== 'enemy' || !weak(t)) return t;
  const x = protector(b, t);
  if (!x || !b.rng.chance(protectRate(x))) return t;
  if (b.cur) {
    b.cur.coverMsg = `${x.name}先生が、${t.name}をかばった！`;
    b.cur.r83bCover = { by: x.id, to: t.id };
  }
  return x;
}

// 受ける ダメージ（damage の はじめ）。へんじ: 受ける ダメージ（null … 先生が かわりに 受けたので t は 受けない）
export function r83bDamage(b, c, t, dmg, info, ev) {
  if (c?.side !== 'enemy' || t?.side !== 'ally' || !(dmg > 0)) return dmg;
  // 全体の 攻撃: 弱った 仲間 1人ぶんだけ 先生が かわりに 受ける（1回の 行動で 1回）
  if (!info.r83bCovered && !ev.r83bAll && (ev.fx?.targets?.length || 0) > 1 && weak(t)) {
    const x = protector(b, t, dmg);
    if (x && b.rng.chance(protectRate(x))) {
      ev.r83bAll = true;
      ev.lines.push(`${x.name}先生が、${t.name}をかばった！`);
      ev.r83bCover = { by: x.id, to: t.id };
      b.damage(c, x, dmg, ev, { ...info, r83bCovered: true });
      return null;
    }
  }
  // 体をはって守る の 計算の ため、へらす 前の ダメージを おぼえる（r83bShieldCut）
  if (t.teShield) info.r83bRaw = dmg;
  return dmg;
}

// 体をはって守る の 間は 先生の 受ける ダメージが take 倍（damage の 中で、軍師の 作戦〈守り〉・先読みの策・守りの旗の あと）。
// いっしょに かかっても、へらす 前の ダメージの CUT_FLOOR（ふつう 0.45倍・身を 守って いる 人 0.65倍。battle-r83a.js と おなじ）より 下げない
export function r83bShieldCut(t, dmg, info = {}) {
  if (!t?.teShield || !(dmg > 0) || !(info.r83bRaw > 0)) return dmg;
  const floor = Math.round(info.r83bRaw * (t.defending ? CUT_FLOOR.defending : CUT_FLOOR.normal));
  return Math.max(1, Math.min(dmg, Math.max(Math.round(dmg * (t.teShield.take ?? 0.6)), floor)));
}

// クライアントに 見せる（pub）: oni … おにの手の 今の ＋％（0 は ふういん）、oniAwake … かくせいの のこり、teShield … 体をはって守る
// （画面は 前の 中みに Object.assign で かさねるので、仲間には いつも のせる。ふういんに もどった ことも とどく）
export function r83bPub(c) {
  if (c.side !== 'ally') return {};
  return { oni: c.oni ? Math.round(oniPct(c) * 100) : 0, oniAwake: c.oni?.awake || 0, teShield: !!c.teShield };
}

// ───────────── オートの 動き（ai.js の decideAlly） ─────────────
// mine … 使える 技（{ id, a }）。へんじ: コマンド か null
// （運〈rng〉を 使うのは この 系統の 技を もつ 時だけ。ほかの 職業の オートの ながれは かえない）
// おにの手を 出して いて HP が 4わりを 切った: ふういんしなおす（かくせいの 間は へらないので そのまま）。
// ai.js の 回復より 前に よぶ（回復する 前に、HP が へりつづけるのを 止める）
export function r83bSeal(b, c, mine) {
  if (c?.side !== 'ally' || !c.oni || c.oni.awake > 0 || !(c.maxHp > 0) || c.hp / c.maxHp >= 0.4) return null;
  const hand = mine.find(({ a }) => a.effect?.type === 'oniHand');
  return hand ? { type: 'ability', id: hand.id } : null;
}

// hard … 強い 敵との 戦い（ai.js の fightWeight）。ボスか 強い 敵の 時だけ おにの手を 出す
export function r83bPlan(b, c, foes, mine, allies, hard = false) {
  if (!foes.length || c?.side !== 'ally') return null;
  // この 系統の 技だけ 見る（ほかの 職業の 治す 技・光の 技では 何も しない）
  mine = mine.filter(({ a }) => R83B_LINE.includes(a.job));
  if (!mine.length) return null;
  const has = (type) => mine.filter(({ a }) => partsOf(a).some((p) => p.type === type));
  const hp = c.maxHp > 0 ? c.hp / c.maxHp : 1;
  const hand = has('oniHand');
  // 1) HP が 4わりを 切った: ふういんしなおす
  const sealCmd = r83bSeal(b, c, mine);
  if (sealCmd) return sealCmd;
  // 2) 仲間が 状態異常: かんのんきょう（全員を 治す）
  const kannon = mine.filter(({ a }) => a.target === 'allies' && a.effect?.type === 'cure');
  if (kannon.length) {
    const sick = allies.filter((x) => BAD.some((s) => x.status?.[s]));
    if (sick.length && b.rng.chance(sick.length >= 2 ? 0.9 : 0.6)) return { type: 'ability', id: kannon[0].id };
  }
  // 3) ボス（と 強い 敵）では おにの手を 出す（HP に よゆうが ある 時）
  if (hand.length && !c.oni && (b.boss || hard) && hp >= 0.6 && b.rng.chance(0.7)) return { type: 'ability', id: hand[0].id };
  // 4) じごく先生: 出して いて HP が へってきたら かくせい（HP が へらない）
  const awake = has('oniAwake');
  if (awake.length && c.oni && !(c.oni.awake > 0) && (b.boss || hard) && hp < 0.7 && b.rng.chance(0.5)) return { type: 'ability', id: awake[0].id };
  // 5) おにの手が いちばん 強い 時: 最大出力（使うと ふういんに もどる）
  const maxOut = has('oniSeal');
  if (maxOut.length && c.oni && (c.oni.awake === 1 || (!(c.oni.awake > 0) && oniPct(c) >= oniMaxOf(c) - 1e-9 && hp < 0.55)) && b.rng.chance(0.7)) {
    return { type: 'ability', id: maxOut[0].id, target: foes[0].id };
  }
  // 6) ゆうれい・アンデッド・悪魔が いたら: おふだ・おにの手（その 種類に 強い 技の うち、いちばん 大きい ダメージ）
  const ghosts = foes.filter((f) => GHOST_RACES.includes(f.race));
  const strong = ghosts.length ? mine.filter(({ a }) => ['enemy', 'enemies'].includes(a.target) && GHOST_RACES.some((r) => prim(a).vsRace?.[r] > 1)) : [];
  if (strong.length && b.rng.chance(0.75)) {
    const t = ghosts.slice().sort((x, y) => x.hp - y.hp)[0];
    const est = ({ a }) => {
      const e = prim(a);
      const list = a.target === 'enemies' ? foes : [t];
      let s = 0;
      for (const f of list) {
        s += e.type === 'magic' ? b.calcMagic(c, f, e, 1, true).dmg * r83bMagicMult(c, f, e) : b.calcPhys(c, f, e, 1, e.element || 'phys', true).dmg * (e.hits || 1);
      }
      return s;
    };
    const best = strong.map((x) => ({ ...x, d: est(x) })).sort((x, y) => y.d - x.d)[0];
    if (best.d > 0) return { type: 'ability', id: best.id, target: t.id };
  }
  return null;
}
