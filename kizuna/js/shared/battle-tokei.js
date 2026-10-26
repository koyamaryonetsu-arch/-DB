// 第2部 第6章 Step 5「止まった時計塔」の 戦いの しかけ（battle-road.js・battle-ch6.js から 短い よびだしで よぶ。ほかの たたかいは かわらない）
//
// ・カリヨン（monsters-tokei.js の ch6.kind 'bell'。時計塔 5階の 中ボス）「時のかね」
//   かねの しるし（bell.left。はじめは bell.every）が、カリヨンが 1回 動く たびに 1つ へる（動けない 番も 数える）。
//   しるしが 1つの ときに カリヨンが 動くと、かならず「時のかね」（m6t_cr_bell）:
//     味方の バフ（強くなった 力）と、カリヨンの デバフ（弱くなった 力）が ぜんぶ 消える（ボスの 段階の ずっと つづく 物は のこる）
//     → みんなに 物理の 強い 一撃（身を 守ると 半分）→ しるしは また いっぱい
//   知っている 人: かねが 鳴った すぐ あとに 強くする（鳴る 前に かけると むだ）・しるしが 1つの ときは 身を 守る
// ・オート（ai.js の decideAlly）: かねが 近い とき（tokeiQuiet）は 強くする 技を 使わない（第41回の「強さを 見て 技を 決める」に 1つ 足す）
//   ふつうの オートは、かねが 自分の 次の 番より 先に 鳴る とき、HPが へっていれば よく 身を 守る（battle-ch6.js の AUTO_GUARD。ほかの ボスと おなじ）
// ・シミュレーター（tools/sim-ch6.mjs）の 知っている 人（b.knowsCh6）は tokeiKnow
//   （b.c6NoGuard … しるし 1つで 守らない・b.c6NoBuff … 鳴った あとに 強くしない。しかけを 1つずつ はずして くらべる とき）
import { MONSTERS } from './data/monsters.js?v=754c2ad0d696';
import { ABILITIES } from './data/abilities.js?v=754c2ad0d696';
import { CARILLON } from './data/monsters-tokei.js?v=754c2ad0d696';
// たがいに よびあうが、つかうのは たたかいの 中だけ
import { atbRate } from './battle.js?v=754c2ad0d696';
import { canUse } from './ai.js?v=754c2ad0d696';

export { CARILLON };
export const BELL = 'm6t_cr_bell';
// かねが この 数（のこりの しるし）より 近い ときは、オートは 強くする 技を 使わない（鳴ると 消えて むだに なる）
export const QUIET_AT = 2;

const bellConf = (m) => MONSTERS[m?.species]?.ch6?.bell || null;
const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || {} : a?.effect || {});
const FOES = new Set(['enemy', 'group', 'enemies']);

// ───────────── はじめ（battle-road.js の setupRoad から。lines に 文を 足す）─────────────
export function setupTokei(b, e, lines) {
  const bc = bellConf(e);
  if (!bc) return;
  const max = bc.every ?? 4;
  e.bell = { left: max, max, rings: 0 };
  lines.push('カリヨンの大きなかねが、カチ…カチ…と、時をきざんでいる…！', `（かねのしるしが${max}つ。全部なくなると、時のかねが鳴るようだ…！）`);
}

// ───────────── 行動の はじめ（battle-road.js の roadTurnStart から）─────────────
// しるしが 1つの ときは この 番が かねの 番（動けない 番は 次の 番に）。それ いがいは 1つ へる
export function tokeiTurnStart(b, c, ev, stuck) {
  if (!c.bell || c.telegraph) return;
  if (c.bell.left <= 1) {
    if (!stuck) c.telegraph = BELL;
  } else {
    c.bell.left--;
    const { left, max } = c.bell;
    ev.lines.push(left > 1 ? `${c.name}のかねのしるしが、1つへった…（のこり${left}/${max}）` : `${c.name}の大きなかねが、ゆらゆらとゆれ始めた…！（のこり1/${max}）`);
    if (left === 1) ev.lines.push('（次にカリヨンが動くと、時のかねが鳴る…！身を守れ！）');
    ev.tkBell = { id: c.id, left, max };
  }
  ev.upd.push(c);
}

// ───────────── 技の こうか（battle-road.js の roadEffect から）─────────────
export function tokeiEffect(b, c, a, eff, ev) {
  if (eff.type !== 'crBell') return false;
  ring(b, c, ev);
  return true;
}

// ずっと つづかない もの（バフ・デバフの のこりが ある もの）を 消す。消した 数
function clearTimed(o) {
  let n = 0;
  for (const [k, v] of Object.entries(o || {})) {
    if (v && Number.isFinite(v.left)) {
      delete o[k];
      n++;
    }
  }
  return n;
}

// 時の かね: 味方の バフ・カリヨンの デバフが 消える → みんなに 物理の 一撃 → しるしは いっぱい
function ring(b, c, ev) {
  const bc = bellConf(c) || {};
  let lost = 0;
  for (const a of b.allies) {
    if (a.fled) continue;
    const n = clearTimed(a.buffs);
    if (n) {
      lost += n;
      ev.upd.push(a);
    }
  }
  const fixed = clearTimed(c.debuffs);
  ev.lines.push('時のかねの音が、塔じゅうにひびきわたった…！');
  if (lost) ev.lines.push('みんなの強くなっていた力が、消えてしまった…！');
  if (fixed) ev.lines.push(`${c.name}の弱くなっていた力も、もとにもどった…！`);
  const targets = b.aliveAllies();
  ev.fx = { type: 'ability', anim: 'a6t_bell', actor: c.id, targets: targets.map((t) => t.id), side: 'enemy' };
  for (const t of targets) b.physHit(c, t, { mult: bc.mult ?? 1.5, ignoreDef: bc.ignoreDef ?? 0.3, acc: 1.2 }, ev, 'phys');
  if (c.bell) {
    c.bell.left = c.bell.max;
    c.bell.rings++;
    (ev.postLines = ev.postLines || []).push(`（かねのしるしが、また${c.bell.max}つになった…）`);
  }
  ev.tkRing = { id: c.id, lost, fixed };
  ev.warn = true;
  ev.upd.push(c);
}

// ───────────── かねが 近いか ─────────────
// オートが 強くする 技を ひかえる（ai.js の decideAlly）
export function tokeiQuiet(b) {
  return b.enemies.some((e) => e.alive && e.bell && e.bell.left <= QUIET_AT);
}

// かねが c の 次の 番より 先に 鳴るか（この 番の あと、c の ゲージが たまるまでに カリヨンが のこりの しるしの 数だけ 動く）
export function bellBefore(b, c, boss) {
  if (!boss?.bell || !boss.alive) return false;
  const rb = atbRate(boss);
  if (!(rb > 0)) return false;
  const mine = 100 / atbRate(c);
  const t0 = boss.ready || boss.queued ? 0 : (100 - boss.atb) / rb;
  if (t0 > mine) return false;
  const acts = 1 + Math.floor((mine - t0) / (100 / rb));
  return acts >= boss.bell.left;
}

// ───────────── 知っている 人の オート（battle-ch6.js の ch6Plan から。b.knowsCh6）─────────────
// かねが 自分の 次の 番より 先に 鳴る … 身を 守る / かねが 鳴った すぐ あと（しるしが いっぱい か 1つ へった）… 強くする・弱くする
// （だれかが とても あぶない ときの 回復・生き返りは battle-ch6.js が 先に えらぶ）
export function tokeiKnow(b, c, boss, base) {
  if (!b.c6NoGuard && bellBefore(b, c, boss)) return { type: 'defend' };
  if (!b.c6NoBuff && boss.bell.left >= boss.bell.max - 1) {
    const p = buffPlan(b, c, boss);
    if (p) return p;
  }
  return base;
}

// みんなの 攻撃力を 上げる 技・カリヨンの 守りを 下げる 技で、まだ かかっていない もの
// （守りを 上げる だけの 技〈スクルト など〉と 自分だけを 強くする 技は えらばない。かねの 一撃は 身を 守って ふせぐ。
//   シミュレーターで くらべると、自分だけの 技〈天地の構え など〉まで 使うと 攻める 番が へって 少し 弱く なった）
export function buffPlan(b, c, boss) {
  const allies = b.aliveAllies();
  const stats = (e) => e.stats || [e.stat];
  let debuff = null;
  for (const id of c.abilities || []) {
    const a = ABILITIES[id];
    if (!a || c.autoOff?.includes(id) || a.noAuto || !canUse(b, c, id)) continue;
    const e = prim(a);
    if (e.type === 'buff' && a.target === 'allies' && stats(e).includes('atk')) {
      const lack = allies.filter((x) => !x.buffs.atk);
      if (lack.length >= Math.ceil(allies.length / 2)) return { type: 'ability', id };
    } else if (e.type === 'debuff' && FOES.has(a.target) && e.stat === 'def' && !debuff) {
      if (!boss.debuffs.def) debuff = { type: 'ability', id, target: boss.id };
    }
  }
  return debuff;
}

// ───────────── がめんへ（battle-road.js の roadPub から）─────────────
// カリヨン: かねの しるし（bell … のこり・bellMax）
export function tokeiPub(c, o) {
  if (!c.bell) return;
  o.bell = c.bell.left;
  o.bellMax = c.bell.max;
}
