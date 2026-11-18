// 第86回 A班: 幻の職業 2つの 戦いの しくみ（data/jobs-r86a.js・data/abilities-r86a.js。docs/plan-r86-phantom-a.md）
// どれも 戦いの 中だけ（戦いの 人〈combatant〉に つける。キャラ・セーブ・引っこしコードには 何も 足さない）
//
// ■ 人とようかいのかけ橋（守るほど 強い）
//   1. ためた力（c.r86aTame … 数）: かばって 受けた ダメージの TAME_RATE（半分）を ためる（上限 最大HPの TAME_CAP）。
//      かばう ＝ 手で えらんだ かばう（きずなの守り・ほかの かばう 技）・自動で かばう・人とようかいのきずな（仲間全員）。
//      次の 自分の 攻撃の さいしょの 1回に そのまま 足す（1体に 自分の 物理の HIT_CAP 倍まで）。ためた力の返し風（tameAll）は 当てた 敵 みんなに。
//      うつと 0 に もどる（行動の おわり。r86aResolve）。札「ためた力850」（client/battle-r86a.js）
//   2. 自動で かばう（passive.r86aGuard ＝ 0.8。じごく先生の「生徒を 守る」と おなじ きまり）: 弱った 仲間（HP 3わり いか）への 攻撃を かばう。
//      敵全体の 攻撃では 弱った 仲間 1人ぶん（1回の 行動で 1回）。じごく先生も いる 時は、先生が かばえる 時は 先生だけ
//      （2人 いても 1回の 攻撃に かばうのは 1人。ev.r83bAll を いっしょに 使う）
//   3. きずなの力（c.r86aKizuna = { mult, left }）: left 回の 行動の 間、物理の 力が mult 倍。命令できる まま・HP は へらない。
//      ようかい化・大よう化（攻撃力が 上がる）・おにの手（＋％）と 同時の 時は、足し算・かけ算に しない（強い 方だけ。r86aPhysMult）
//   4. 人とようかいのきずな（type 'r86aSig'。2だん）
//      1だん目: 次の 自分の 番まで 仲間全員を かばう（1体への 攻撃は かばう〈cover all〉・敵全体の 攻撃も 仲間の ぶんを かわりに 受ける）。
//              受ける ダメージは take 倍。軍師の 作戦・まどか などと 重ねても CUT_FLOOR（0.45倍・身を 守って いる 時 0.65倍）より 下げない。
//              その ダメージで たおれる 時は かわりに 受けない（自分の ぶんは 受ける）
//      2だん目: 次の 自分の 番の はじめに、敵全体へ 風（物理の swing 倍 ＋ ためた力 × spread。1体に 物理の cap 倍まで）。その あと ふつうに 動ける
// ■ 竜神の剣士（2つの 属性の 剣）
//   5. effect.r86a 'dual' の 剣: 「今の 玉の 属性」と「炎」の、その 敵に よく 効く 方で 当たる（属性の 効きぐあい × 天気の 倍。
//      すいこむ よろいの 属性は えらばない）。玉が ない 人〈転職した あと など〉は 雷と 炎
//   6. effect.r86a 'sig'（竜神・火竜・二重の太刀）: 1回目は 玉の 属性・2回目は 炎。もう 一方が よく 効く 時は そちらで
//   7. 玉がえ: YAIBA の しくみ（battle-r82b.js）を そのまま 使う。竜神の剣士の 玉は KENSHI_TAMA（炎は いつも あるので 入れない）
//   8. 雷の 天気・晴れの 天気: 剣の 属性を えらぶ 時に 天気の 倍を 入れる。2つの 天気は 同時に ないので、足し算には ならない（強い 方だけ）
//   9. 火竜をよぶ・竜神: 烈火の しくみ（battle-r85b.js。set 'kenshi' の 4ひき）
// battle.js から よぶ: r86aTurnStart（行動の はじめ・防御）・r86aCover（resolveTarget）・r86aEffect（switch）・r86aPhys（'phys' の はじめ）・
//   r86aElement（calcPhys の みつもり）・r86aPhysMult（calcPhys）・r86aDamage（damage の はじめ）・r86aMark（作戦の 前）・r86aCut（下限の あと）・
//   r86aStore（damage の さいご）・r86aResolve（行動の おわり）・r86aPub（pub）
// ai.js から よぶ: r86aPlan（オート。この 2つの 職業の 技だけを 見る）
// サーバーでも ブラウザでも 使う（canvas・DOM なし）
import { JOBS } from './data/jobs.js?v=87f5df649c81';
import { ABILITIES, ELEMENT_NAMES } from './data/abilities.js?v=87f5df649c81';
import { TAMA_BY_JOB, tamaOf, tamaScore } from './battle-r82b.js?v=87f5df649c81';
import { oniPct, protectRate, SELF_SAFE, WEAK_AT } from './battle-r83b.js?v=87f5df649c81';
import { CUT_FLOOR } from './battle-r83a.js?v=87f5df649c81';
import { weatherMult } from './battle-weather.js?v=87f5df649c81';
import { BUFF_ACTS } from './buff-acts.js?v=87f5df649c81';
import { mpCost } from './stats.js?v=87f5df649c81';
import { ryuSetOf, ryuMp } from './battle-r85b.js?v=87f5df649c81';

export const R86A_JOBS = ['yokai_bridge', 'ryujin_kenshi'];
// かばって 受けた ダメージの うち ためる わりあい・ためられる 上限（最大HPの 何倍）・1体に のせられる 上限（自分の 物理の 何倍）
export const TAME_RATE = 0.5;
export const TAME_CAP = 0.6;
export const HIT_CAP = 2.5;
// 竜神の剣士の 玉（炎は いつも 刀に ある ので 入れない）。玉がえの メニューも これ
export const KENSHI_TAMA = ['bolt', 'water', 'ice', 'wind', 'light'];
TAMA_BY_JOB.ryujin_kenshi = KENSHI_TAMA;

const guardRate = (c) => (c?.side === 'ally' ? JOBS[c.job]?.passive?.r86aGuard || 0 : 0);
const canTame = (c) => guardRate(c) > 0;
const weak = (t) => t?.side === 'ally' && t.alive && t.maxHp > 0 && t.hp <= t.maxHp * WEAK_AT;
const busy = (x) => x.status?.sleep || x.status?.paralyze || x.status?.confuse || x.status?.rift;
const lineOnce = (ev, key, line) => {
  if (ev[key]) return;
  ev[key] = true;
  ev.lines.push(line);
};

// ───────────── 自動で かばう（resolveTarget の あと） ─────────────
// かばえる かけ橋（t の かわりに 受ける 人）。dmg … わかって いる 時は、それで たおれる 人は かばわない
function bridgeFor(b, t, dmg, needRate = true) {
  return b.allies.find((x) => x !== t && x.alive && !x.fled && (!needRate || guardRate(x) > 0) && !busy(x)
    && x.hp > x.maxHp * SELF_SAFE && !(dmg >= x.hp)) || null;
}
// じごく先生（生徒を 守る）が かばえる 時は 先生に まかせる（2人 いても かばうのは 1人。battle-r83b.js の protector と おなじ きまり）
function teacherReady(b, t, dmg) {
  return b.allies.some((x) => x !== t && x.alive && !x.fled && protectRate(x) > 0 && !busy(x) && x.hp > x.maxHp * SELF_SAFE && !(dmg >= x.hp));
}
function noteCover(b, x) {
  const ev = b.cur;
  if (!ev || !canTame(x)) return;
  ev.r86aCov = ev.r86aCov || [];
  if (!ev.r86aCov.includes(x.id)) ev.r86aCov.push(x.id);
}
// t0 … もとの ねらい・t … かばう の あとの ねらい。へんじ: 受ける 人
export function r86aCover(b, c, t0, t) {
  if (c?.side !== 'enemy' || !t || t.side !== 'ally') return t;
  // かけ橋が かばった（手で えらんだ かばう・人とようかいのきずな）
  if (t !== t0) {
    noteCover(b, t);
    return t;
  }
  if (!weak(t)) return t;
  if (teacherReady(b, t)) return t;
  const x = b.allies.find((y) => y !== t && y.alive && !y.fled && guardRate(y) > 0 && !busy(y) && y.hp > y.maxHp * SELF_SAFE);
  if (!x || !b.rng.chance(guardRate(x))) return t;
  if (b.cur) {
    b.cur.coverMsg = `${x.name}が、${t.name}をかばった！`;
    b.cur.r86aCover = { by: x.id, to: t.id };
  }
  noteCover(b, x);
  return x;
}

// ───────────── 技の こうか（applyAbility の switch） ─────────────
export const R86A_TYPES = ['r86aKabau', 'r86aKizuna', 'r86aSig'];
export function r86aEffect(b, c, a, eff, ev, targets, powMult = 1) {
  switch (eff.type) {
    case 'r86aKabau': {
      const t = targets[0];
      if (t && t !== c && t.alive) {
        c.cover = { target: t.id, left: BUFF_ACTS };
        ev.lines.push(`${c.name}は、${t.name}をかばっている！`);
      }
      b.applyBuff(c, c, { stat: 'def', mult: eff.def ?? 1.4 }, ev, powMult);
      ev.r86aKabau = { by: c.id, to: t?.id };
      ev.upd.push(c);
      return true;
    }
    case 'r86aKizuna': {
      if (c.side !== 'ally') return true;
      c.r86aKizuna = { mult: eff.mult || 1.5, left: eff.acts || 4 };
      const over = r86aOther(c) >= c.r86aKizuna.mult;
      ev.lines.push(`ようかいの力と、おにの手の力が、きずなでひとつになった！（${c.r86aKizuna.left}回の行動の間、物理の攻撃がとても強くなる）`);
      if (over) ev.lines.push('（今の力の方が強いので、強い方がそのまま出る）');
      ev.r86aKizuna = c.id;
      ev.upd.push(c);
      return true;
    }
    case 'r86aSig': {
      if (c.side !== 'ally') return true;
      // 1だん目: 仲間全員を かばう（次の 自分の 番まで）
      c.cover = { target: 'all', left: BUFF_ACTS };
      c.r86aGuard = { take: eff.take ?? 0.55, swing: eff.swing ?? 1.7, spread: eff.spread ?? 0.75, cap: eff.cap ?? 4, cover: c.cover, pow: Math.min(1, powMult || 1), name: a.name };
      ev.fx = { type: 'ability', anim: a.anim, actor: c.id, targets: [c.id], side: c.side };
      ev.lines.push(`${c.name}は、仲間全員のまえに立ちはだかった！（次の番まで、みんなへの攻撃をかわりに受ける）`);
      ev.r86aSigSet = c.id;
      ev.upd.push(c);
      return true;
    }
    default: return false;
  }
}

// ───────────── 行動の はじめ（executeNext・防御） ─────────────
export function r86aTurnStart(b, c, ev) {
  if (c?.side !== 'ally') return;
  // 人とようかいのきずな 2だん目: かばうのを やめて、ためた力を 風に して 敵全体へ
  if (c.r86aGuard) {
    const g = c.r86aGuard;
    if (c.cover === g.cover) c.cover = null;
    delete c.r86aGuard;
    ev.upd.push(c);
    if (c.alive && !busy(c)) burst(b, c, g, ev);
  }
  if (c.r86aKizuna) {
    c.r86aKizuna.left--;
    if (c.r86aKizuna.left <= 0) {
      delete c.r86aKizuna;
      if (c.alive) ev.lines.push(`${c.name}のきずなの力が、しずかにおさまった。`);
    }
    ev.upd.push(c);
  }
}

// 2だん目の 風（ためた力 × spread を 1体ごとに 足す。1体に 物理の cap 倍まで）
function burst(b, c, g, ev) {
  const foes = b.sideOf(c, false).filter((x) => x.alive);
  if (!foes.length) return;
  const tame = c.r86aTame || 0;
  ev.lines.push(tame > 0 ? `${c.name}の${g.name}！受けとめた力を、大きな風にして返した！` : `${c.name}の${g.name}！きずなの風が、敵をつつみこむ！`);
  ev.r86aBurst = { by: c.id, targets: foes.map((f) => f.id), tame };
  for (const f of foes) {
    const res = b.calcPhys(c, f, { mult: g.swing }, g.pow, 'wind');
    if (res.miss) {
      ev.results = ev.results || [];
      ev.results.push({ id: f.id, miss: true });
      continue;
    }
    const cap = b.calcPhys(c, f, { mult: g.cap }, 1, 'wind', true).dmg;
    const d = Math.max(1, Math.round(Math.min(res.dmg + tame * g.spread * (f.resist?.wind ?? 1), Math.max(res.dmg, cap))));
    b.damage(c, f, d, ev, { element: 'wind', crit: res.crit, r86aNoTame: true });
  }
  if (tame > 0) {
    c.r86aTame = 0;
    ev.upd.push(c);
  }
}

// ───────────── 竜神の剣士の 剣（applyAbility の 'phys' の はじめ） ─────────────
// その 敵に よく 効く 方（list の じゅんに くらべる。同じ なら 先の 方）
function score(b, c, t, el) {
  if (t.arArmor === el) return -1;
  return (t.resist?.[el] ?? 1) * weatherMult(b, c.side, el);
}
export function bestEl(b, c, t, list) {
  let best = list[0], top = score(b, c, t, best);
  for (const el of list.slice(1)) {
    const s = score(b, c, t, el);
    if (s > top + 1e-9) {
      top = s;
      best = el;
    }
  }
  return best;
}
const tamaEl = (c) => tamaOf(c) || 'bolt';
// オートの みつもり（calcPhys の はじめ）
export function r86aElement(b, c, t, eff, element) {
  if (!eff?.r86a || (element && element !== 'phys') || !t) return element;
  return bestEl(b, c, t, [tamaEl(c), 'fire']);
}

export function r86aPhys(b, c, a, cmd, ev, powMult, targets) {
  const { r86a, hits = 1, ...one } = a.effect;
  const els = [];
  for (const t of targets) {
    for (let i = 0; i < hits; i++) {
      if (!t.alive) break;
      let el;
      if (r86a === 'sig') el = i % 2 === 0 ? bestEl(b, c, t, [tamaEl(c), 'fire']) : bestEl(b, c, t, ['fire', tamaEl(c)]);
      else el = bestEl(b, c, t, [tamaEl(c), 'fire']);
      if (!els.length && ev.fx) ev.fx.element = el;
      els.push(el);
      b.physHit(c, t, one, ev, el, powMult);
    }
  }
  if (ev.fx) ev.fx.r86aEls = els;
  const uniq = [...new Set(els)];
  if (uniq.length) ev.lines.push(uniq.length > 1 ? `刀が、${uniq.map((el) => ELEMENT_NAMES[el]).join('と')}の力で切りつけた！` : `刀の${ELEMENT_NAMES[uniq[0]]}の力が、敵をとらえた！`);
  ev.r86aDual = { by: c.id, els };
  b.afterDamage(c, ev, els[0] || 'phys');
}

// ───────────── ダメージの 計算 ─────────────
// ようかい化・大よう化（攻撃力が 上がる）と おにの手（＋％）で 今 上がって いる 倍
export function r86aOther(c) {
  const yk = c?.yk0?.atk > 0 ? c.atk / c.yk0.atk : 1;
  return yk * (1 + oniPct(c));
}
// 物理（calcPhys）: きずなの力。ほかの 力と 足さない（強い 方だけ ＝ 全体で max(きずな, ほか)）
export function r86aPhysMult(c) {
  const k = c?.r86aKizuna;
  if (!k || c.side !== 'ally') return 1;
  return Math.max(1, k.mult / r86aOther(c));
}

// damage の はじめ: ① ためた力を 自分の 攻撃に のせる ② 人とようかいのきずな・自動で かばう（敵全体の 攻撃）。へんじ: ダメージ（null … かわりに 受けた）
export function r86aDamage(b, c, t, dmg, info, ev) {
  if (!(dmg > 0) || !c || !t) return dmg;
  // ① ためた力
  if (c.side === 'ally' && t.side === 'enemy' && c.r86aTame > 0 && ev?.id === c.id && !info.r86aNoTame) {
    const spread = ABILITIES[ev.ability]?.effect?.tameAll || 0;
    ev.r86aTameHit = ev.r86aTameHit || [];
    if (spread ? !ev.r86aTameHit.includes(t.id) : !ev.r86aTameHit.length) {
      const cap = b.calcPhys(c, t, { mult: HIT_CAP }, 1, 'phys', true).dmg;
      const add = Math.max(0, Math.round(Math.min(c.r86aTame * (spread || 1), Math.max(cap, 1))));
      ev.r86aTameHit.push(t.id);
      if (add > 0) {
        ev.r86aTameUsed = c.id;
        lineOnce(ev, 'r86aTameMsg', `${c.name}は、ためた力をのせた！`);
        return dmg + add;
      }
    }
    return dmg;
  }
  // ② 敵の 全体の 攻撃（仲間 みんなが あいて）
  if (c.side !== 'enemy' || t.side !== 'ally' || info.r86aCovered || info.r83bCovered || (ev?.fx?.targets?.length || 0) < 2) return dmg;
  // 人とようかいのきずな: 仲間の ぶんを かわりに 受ける
  const g = b.allies.find((x) => x !== t && x.alive && !x.fled && x.r86aGuard && !busy(x));
  if (g && Math.round(dmg * g.r86aGuard.take) < g.hp) {
    lineOnce(ev, 'r86aAllMsg', `${g.name}が、仲間のぶんの攻撃も受けとめた！`);
    (ev.r86aCovers = ev.r86aCovers || []).push({ by: g.id, to: t.id });
    b.damage(c, g, dmg, ev, { ...info, r86aCovered: true });
    return null;
  }
  // 自動で かばう（弱った 仲間 1人ぶん・1回の 行動で 1回。先生が かばえる 時は 先生）
  if (!ev.r83bAll && weak(t) && !teacherReady(b, t, dmg)) {
    const x = bridgeFor(b, t, dmg);
    if (x && b.rng.chance(guardRate(x))) {
      ev.r83bAll = true;
      ev.lines.push(`${x.name}が、${t.name}をかばった！`);
      (ev.r86aCovers = ev.r86aCovers || []).push({ by: x.id, to: t.id });
      b.damage(c, x, dmg, ev, { ...info, r86aCovered: true });
      return null;
    }
  }
  return dmg;
}
// 作戦・まどか などの 前: へらす 前の ダメージを おぼえる（人とようかいのきずなの 下限の ため）
export function r86aMark(t, dmg, info) {
  if (t?.r86aGuard && dmg > 0 && !(info.r86aRaw > 0)) info.r86aRaw = dmg;
}
// 下限の あと: 人とようかいのきずなの 間は take 倍（ほかと 合わせても CUT_FLOOR より 下げない）
export function r86aCut(t, dmg, info = {}) {
  if (!t?.r86aGuard || !(dmg > 0) || !(info.r86aRaw > 0)) return dmg;
  const floor = Math.round(info.r86aRaw * (t.defending ? CUT_FLOOR.defending : CUT_FLOOR.normal));
  return Math.max(1, Math.min(dmg, Math.max(Math.round(dmg * t.r86aGuard.take), floor)));
}
// damage の さいご（HP を へらす 前）: かばって 受けた ダメージの 半分を ためる
export function r86aStore(b, c, t, dmg, info, ev) {
  if (!(dmg > 0) || c?.side !== 'enemy' || !canTame(t) || !t.alive) return;
  const covered = info.r86aCovered || ev?.r86aCov?.includes(t.id);
  if (!covered) return;
  const cap = Math.round(t.maxHp * TAME_CAP);
  const before = t.r86aTame || 0;
  t.r86aTame = Math.min(cap, before + Math.round(dmg * TAME_RATE));
  if (t.r86aTame > before) {
    ev.r86aStored = ev.r86aStored || {};
    ev.r86aStored[t.id] = t.r86aTame;
    lineOnce(ev, `r86aStoreMsg${t.id}`, `${t.name}は、受けとめた力をためた！（ためた力${t.r86aTame}）`);
    ev.upd.push(t);
  }
}
// 行動の おわり: のせた ためた力は 0 に もどる
export function r86aResolve(b, ev) {
  const id = ev.r86aTameUsed;
  if (!id) return;
  delete ev.r86aTameUsed;
  const c = b.get(id);
  if (!c) return;
  c.r86aTame = 0;
  ev.upd.push(c);
}

// クライアントに 見せる（pub）。かけ橋には いつも のせる（0 に もどった ことも とどく）
export function r86aPub(c) {
  if (c.side !== 'ally') return {};
  const out = {};
  if (canTame(c) || c.r86aTame) out.r86aTame = c.r86aTame || 0;
  out.r86aKizuna = c.r86aKizuna ? Math.max(0, c.r86aKizuna.left) : 0;
  out.r86aGuard = !!c.r86aGuard;
  return out;
}

// ───────────── オート（ai.js の decideAlly） ─────────────
// わりあい（tools/sim-r86a.mjs で 合わせた。R86A_AI=boss:0.7,… で ためせる）
export const R86A_AI = { sig: 0.85, sigHurt: 0.35, sigBoss: 0.1, kabauWeak: 0.6, kabau: 0.25, kizuna: 0.45, tame: 0.9, many: 0.6, boss: 0.9, revive: 0.9, madoka: 0.6, tama: 1, kokoro: 0.5, ksig: 0.55, kboss: 0.9, kmany: 0.65 };
const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || a.effect : a?.effect || {});
const OWN = new Set([...R86A_JOBS]);
const own = (a) => OWN.has(a.job);

// その 技の だいたいの ダメージ（敵 list に）
function est(b, c, a, list) {
  let s = 0;
  const parts = a.effect?.type === 'multi' ? a.effect.parts : [a.effect];
  for (const f of list) {
    for (const p of parts) {
      if (p.type !== 'phys') continue;
      const el = p.element || 'phys';
      s += b.calcPhys(c, f, p, 1, el, true).dmg * (p.hits || 1);
    }
  }
  return s;
}

export function r86aPlan(b, c, foes, mine, allies, fw) {
  if (!foes.length || c?.side !== 'ally') return null;
  const my = mine.filter(({ a }) => own(a));
  if (!my.length) return null;
  const type = (t) => my.find(({ a }) => a.effect?.type === t);
  const boss = foes.find((f) => f.boss);
  const tele = foes.some((f) => f.telegraph);
  const hp = c.maxHp > 0 ? c.hp / c.maxHp : 1;
  const best = (list, targets) => list.map((x) => ({ ...x, d: est(b, c, x.a, x.a.target === 'enemies' ? foes : targets) })).sort((x, y) => y.d - x.d)[0];
  if (c.job === 'yokai_bridge' || my.some(({ a }) => a.job === 'yokai_bridge')) {
    const sig = type('r86aSig');
    const others = allies.filter((x) => x !== c);
    const hurt = others.length ? others.reduce((s, x) => s + x.hp / x.maxHp, 0) / others.length : 1;
    // 1) 前ぶれ・仲間が 弱って きた ボス戦 ＝ 人とようかいのきずな（みんなを かばって、次の 番に 返す）
    if (sig && !c.r86aGuard && hp >= 0.5 && (tele || (boss && hurt < 0.6)) && b.rng.chance(tele ? R86A_AI.sig : R86A_AI.sigHurt)) return { type: 'ability', id: sig.id };
    //   ボス戦では ときどき（前ぶれを 待たずに。みんなを かばって 力を ためる）
    if (sig && boss && !c.r86aGuard && hp >= 0.6 && b.rng.chance(R86A_AI.sigBoss)) return { type: 'ability', id: sig.id };
    // 2) ボスで 仲間を かばう（きずなの守り。弱った 仲間・いなければ ときどき HP の いちばん 少ない 仲間を。かばうと 力が たまる）
    const kabau = type('r86aKabau');
    if (kabau && boss && !c.cover && !c.r86aGuard && hp >= 0.6) {
      const w = others.slice().sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0];
      if (w && b.rng.chance(w.hp < w.maxHp * 0.45 ? R86A_AI.kabauWeak : R86A_AI.kabau)) return { type: 'ability', id: kabau.id, target: w.id };
    }
    // 3) ボス・強い 敵で きずなの力（まだ かかって いない・HP に よゆう）
    const kizuna = type('r86aKizuna');
    if (kizuna && !c.r86aKizuna && (boss || fw?.hard) && hp >= 0.5 && r86aOther(c) < (kizuna.a.effect.mult || 1.5) && b.rng.chance(R86A_AI.kizuna)) return { type: 'ability', id: kizuna.id };
    const atk = my.filter(({ a }) => prim(a).type === 'phys' && ['enemy', 'enemies'].includes(a.target));
    if (!atk.length) return null;
    const t = boss || foes.slice().sort((x, y) => y.hp - x.hp)[0];
    // 4) ためた力が 大きい ＝ 敵が 多ければ 返し風・ふつうは いちばん 強い 1体の 技
    if ((c.r86aTame || 0) >= c.maxHp * 0.15 && b.rng.chance(R86A_AI.tame)) {
      const all = atk.find(({ a }) => a.effect?.tameAll);
      if (all && foes.length >= 2) return { type: 'ability', id: all.id };
      const one = best(atk.filter(({ a }) => a.target === 'enemy'), [t]);
      if (one) return { type: 'ability', id: one.id, target: t.id };
    }
    // 5) 敵が 多い ＝ 風
    if (foes.length >= 3 && b.rng.chance(R86A_AI.many)) {
      const all = best(atk.filter(({ a }) => a.target === 'enemies'), foes);
      if (all) return { type: 'ability', id: all.id };
    }
    // 6) ボス ＝ いちばん 強い 技
    if (boss && hp >= 0.35 && b.rng.chance(R86A_AI.boss)) {
      const one = best(atk, [boss]);
      if (one) return { type: 'ability', id: one.id, target: boss.id };
    }
    return null;
  }
  // ───── 竜神の剣士 ─────
  const pc = c.penChar || c;
  const ryu = my.find(({ a }) => a.effect?.type === 'r85bRyu');
  const call = (k, opts = {}) => (ryu && ryuSetOf(ryu.id).includes(k) && c.mp >= ryuMp(pc, ryu.id, k) ? { type: 'ability', id: ryu.id, ryu: k, ...opts } : null);
  const dead = b.allies.filter((x) => !x.alive && !x.fled);
  // 1) 仲間が たおれた ＝ れっしん
  if (dead.length && b.rng.chance(R86A_AI.revive)) {
    const cmd = call('resshin', { target: dead[0].id });
    if (cmd) return cmd;
  }
  // 2) 前ぶれ ＝ まどか（まだ かかって いない 人が 半分 いじょう）。ほかは「大わざに そなえる」に まかせる
  if (tele) {
    if (allies.filter((x) => !x.r85bMadoka).length >= Math.ceil(allies.length / 2) && b.rng.chance(R86A_AI.madoka)) {
      const cmd = call('madoka');
      if (cmd) return cmd;
    }
    return null;
  }
  // 3) 玉がえ: 「玉 と 炎 の よい 方」が 今より はっきり よく なる 玉が あれば
  const swap = type('tamagae');
  if (swap && b.rng.chance(R86A_AI.tama)) {
    const both = (el) => Math.max(tamaScore(b, c, el, foes), tamaScore(b, c, 'fire', foes));
    const cur = both(tamaEl(c));
    let pick = null, top = cur * 1.15 + 0.01;
    for (const el of KENSHI_TAMA) {
      const s = both(el);
      if (el !== tamaEl(c) && s > top) {
        top = s;
        pick = el;
      }
    }
    if (pick) return { type: 'ability', id: swap.id, tama: pick };
  }
  const atk = my.filter(({ a }) => prim(a).type === 'phys' && ['enemy', 'enemies'].includes(a.target));
  // 4) ボス
  if (boss) {
    if (hp < 0.4) return null;
    const kokoro = my.find(({ a }) => a.target === 'self' && a.effect?.type === 'multi' && a.effect.parts.some((p) => p.type === 'buff' && p.stats?.includes('atk')));
    if (kokoro && !c.buffs?.atk && b.rng.chance(R86A_AI.kokoro)) return { type: 'ability', id: kokoro.id };
    const sig = my.find(({ a }) => a.effect?.r86a === 'sig');
    if (sig && b.rng.chance(R86A_AI.ksig)) return { type: 'ability', id: sig.id, target: boss.id };
    if (b.rng.chance(R86A_AI.kboss)) {
      const one = best(atk.filter(({ a }) => a.effect?.r86a !== 'sig'), [boss]);
      if (one) return { type: 'ability', id: one.id, target: boss.id };
    }
    return null;
  }
  // 5) 敵が 多い ＝ 全体の 剣（なだれ も）
  if (foes.length >= 3 && b.rng.chance(R86A_AI.kmany)) {
    const all = best(atk.filter(({ a }) => a.target === 'enemies'), foes);
    if (all) return { type: 'ability', id: all.id };
    const cmd = call('nadare');
    if (cmd) return cmd;
  }
  return null;
}

// MP の みつもり（client の 一覧でも 使える）
export const r86aMp = (char, id) => mpCost(char, id);
