// 第3部 第1章 第2幕「鉱山の底の先」の 戦いの しかけ（battle-c9a.js から 短い よびだしで よぶ。ほかの たたかいは かわらない）
// docs/plan-part3.md の 10-3
//
// ・スピカの「てらす」（TERU）… リーダーが c9_act1 を 持って いる 戦い（と 大王の 戦い）で 出る
//   だれでも えらべる（その 人の 番を 使う）。スピカの ほのかな光（みんなが 1回ずつ 動いた ＝ 1つの 番）ごとに 1つ たまり、max（4）で 使える
//   使うと lit（3）回の 番の 間 明るい: 大王の まっ暗でも 見て いる 皿が 見える・暗い 所の 魔物の「見えにくい」（c9b.hide）が 消える
//   オートでは 使わない（noAuto）。知って いる 人（シミュレーター）は まっ暗の 時に 使う
// ・幕の ボス「デデドン大王」（monsters-c9b.js の c9b.kind 'king'）… ごちそうを 先に 取り上げる
//   watch 回 動く ごとに 皿を 1つ じっと 見る（m9k_watch。前ぶれ）→ 次の 番で 食べる（m9k_eat）。にく … 攻撃が 強く なる・ケーキ … 回復・
//   からいスープ … 次の 番に 全体へ 炎（m9k_soup）。食べる 前に その 皿を こわすと 食べられず 1回 しょんぼり（m9k_sulk）
//   こわした（食べた）皿は back 回 動くと もどる。HPが 半分を 切ると 明かりを 食べて まっ暗（m9k_light）… 見て いる 皿が 出ない
//   大ジャンプ（jump 回 動く ごとに m9k_jumpup → 次に m9k_jump。身を 守ると guardCut ばい）
//   はこ（c9_box1〜3）1つに つき、はじめの 皿が 1つ へる（late 回 動くと 持って くる）
//   たおれない: HPが 1 に なると、おなかを 鳴らして すわりこむ（勝ち。b.killed に 入れて 経験値・落とし物は ふつう）
// ・自動の 仲間（酒場の 人）は、見えて いる 皿を 3回に 1回 ねらう（AUTO_DISH_EVERY。家族の キャラの「オート」と 魔物の 仲間は ねらわない）
import { MONSTERS } from './data/monsters.js?v=379ca0afcef1';
import { ABILITIES } from './data/abilities.js?v=379ca0afcef1';
import { TERU } from './data/abilities-c9b.js?v=379ca0afcef1';
import { C9B_DEDEDON, C9B_DISH_IDS, DISH_NAME } from './data/monsters-c9b.js?v=379ca0afcef1';
import { C9B_ACT1, C9B_BOXES } from './maps/c9b-flags.js?v=379ca0afcef1';
import { canUse } from './ai.js?v=379ca0afcef1';
// 第101回 R1班: 人数で 合わせる 数の えらび方（solo → bare → few）は 第1章 みんなで 同じ
import { pickPeople } from './battle-c9a.js?v=379ca0afcef1';
// 第3部 第1章 第3幕: ナゾカケ・ヒックリカエール2号（battle-c9c.js）
import { setupC9c, c9cTurnStart, c9cEffect, c9cDamage, c9cKill, c9cPlan, c9cPub, c9cBusy, c9cTell } from './battle-c9c.js?v=379ca0afcef1';
// 第3部 第1章 第4幕: あそびたい魔人 ムウ・スピカの 星のうた（battle-c9d.js）
import { c9dTele, setupC9d, addSong, songPub, c9dGlow, c9dTurnStart, c9dEffect, c9dDamage, c9dKill, c9dPlan, c9dPub, c9dBusy } from './battle-c9d.js?v=379ca0afcef1';
// 第3部 第2章 第1幕: スピカの ごほうび・ドクター・タマゴン・カビだんしゃく モルド（battle-c10a.js）
import { setupC10a, c10TeruMax, c10aTurnStart, c10aEffect, c10aDamage, c10aPlan, c10aPub, c10aBusy, c10aTell } from './battle-c10a.js?v=379ca0afcef1';
// 第3部 第2章 第2幕: スピカの ごほうび・サー・ゲッコー・かいとう シロフクロウ（battle-c10b.js）
import { setupC10b, c10TeruFull, c10bTurnStart, c10bEffect, c10bDamage, c10bKill, c10bPlan, c10bPub, c10bBusy, c10bTell } from './battle-c10b.js?v=379ca0afcef1';
// 第3部 第2章 第3幕: スピカの ごほうび・たいさムスカリ・アルゴル（battle-c10c.js）
import { setupC10c, c10TeruLit, c10cTurnStart, c10cEffect, c10cDamage, c10cPlan, c10cPub, c10cBusy, c10cTell } from './battle-c10c.js?v=379ca0afcef1';
// 第3部 第2章 第4幕: スピカの ごほうび・ちからの 水・音を鳴らす・門の 番人・ミラーレ（battle-c10d.js）
import { setupC10d, c10dTurnStart, c10dEffect, c10dDamage, c10dPlan, c10dPub, c10dBusy, c10dTell } from './battle-c10d.js?v=379ca0afcef1';
// 第3部 第3章 第1幕: スピカの ごほうび（ながれ星）・星座のけもの・いかり船長・時計を投げる（battle-c11a.js）
import { setupC11a, setStarDamage, c11aTurnStart, c11aEffect, c11aDamage, c11aPlan, c11aPub, c11aBusy, c11aTell } from './battle-c11a.js?v=379ca0afcef1';

export { TERU };
export const WATCH = 'm9k_watch';
export const EAT = 'm9k_eat';
export const SULK = 'm9k_sulk';
export const LIGHT = 'm9k_light';
export const JUMPUP = 'm9k_jumpup';
export const JUMP = 'm9k_jump';
export const SOUP = 'm9k_soup';
export const TERU_MAX = 4;
export const TERU_LIT = 3;
export const AUTO_DISH_EVERY = 3;

const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || {} : a?.effect || {});
const post = (ev) => (ev.postLines = ev.postLines || []);
const confOf = (m) => MONSTERS[m?.species]?.c9b || null;

// 人数（家族の キャラ ＝ kind 'player' の 数。1〜5。battle-c9a.js の peopleOf と おなじ。ただし 魔物の 仲間も 数える）
// 大王は 魔物の 仲間も 半人ぶんに 数える（魔物の 仲間は かたくて 強い ので、酒場の 人と おなじ 表に すると 全員 自動でも 勝って しまう）
export function kingPeople(b) {
  if (b?.c9kPeople) return b.c9kPeople;
  const al = b?.allies || [];
  const p = al.filter((a) => a.kind === 'player').length;
  const n = p ? Math.floor(p + al.filter((a) => a.kind === 'monster').length * 0.5) : 0;
  return Math.max(1, Math.min(5, n || 4));
}
// 仲間なしの ひとり（戦う 人が 1人だけ）は c9b.solo の 数を 先に 見る（人数の 表 few は 家族の キャラの 数。1人 ＋ 自動の 仲間と 分ける）
//   第101回 R1班: 仲間なしの 2人・3人は c9b.bare を few より 先に（battle-c9a.js の pickPeople）
export function kingConf(m, b = null) {
  const c = confOf(m) || {};
  const pick = pickPeople(c, b, kingPeople);
  // 魔物の 仲間 1体ごとに 大王を 少し 強く（monK。魔物の 仲間は かたい）
  const mons = b && (b.allies || []).some((a) => a.kind === 'player') ? b.allies.filter((a) => a.kind === 'monster').length : 0;
  return {
    watch: pick('watch', c.watch ?? 3), back: c.back ?? 3, late: c.late ?? 6, jump: pick('jump', c.jump ?? 5),
    jumpMult: c.jumpMult ?? 1.7, guardCut: c.guardCut ?? 0.6, meat: { up: 1.2, max: 3, ...(c.meat || {}) }, cake: c.cake ?? 0.1,
    lit: c.lit ?? TERU_LIT, dish: pick('dish', 1), wait: pick('wait', 0), hp: pick('hp', 1) * (1 + (c.monK?.hp || 0) * mons), atk: pick('atk', 1) * (1 + (c.monK?.atk || 0) * mons),
  };
}
export const kingOf = (b) => (b.c9king ? b.get(b.c9king.id) : null);
export const dishesOf = (b) => b.enemies.filter((e) => e.c9d);
export const aliveDishes = (b) => dishesOf(b).filter((e) => e.alive);
export const teruOf = (b) => b.c9sp?.teru || null;
export const litNow = (b) => (teruOf(b)?.lit || 0) > 0;
export const teruReady = (b) => { const t = teruOf(b); return !!t && t.charge >= t.max; };
// 見て いる 皿が 見えるか（まっ暗で なければ・てらして いれば）
export function kingVisible(b) {
  const k = kingOf(b)?.c9k;
  return !!k && (!k.dark || litNow(b));
}
// 暗い 所の 魔物の「見えにくい」（こちらの 物理の 攻撃が 外れやすい ばい）。てらして いる 間は 0
export function c9bEva(b, c, t) {
  if (c?.side !== 'ally' || t?.side !== 'enemy') return 0;
  const h = MONSTERS[t.species]?.c9b?.hide || 0;
  return h && !litNow(b) ? h : 0;
}

// ───────────── はじめ（battle-c9a.js の setupC9a から）─────────────
// かえす 値: スピカを 出すか（大王の 戦い・リーダーが c9_act1）
export function setupC9b(b, lines) {
  let teru = false;
  try {
    teru = !!b.hooks?.leaderFlag?.(C9B_ACT1);
  } catch { /* */ }
  for (const e of b.enemies) {
    // がめんへ 出す ときに 戦いを 見る（pub は 戦いを 知らない。JSON に 出ない ように 見えない 形で）
    if (confOf(e)) Object.defineProperty(e, '_b9', { value: b, enumerable: false, configurable: true, writable: true });
    if (confOf(e)?.kind === 'king') {
      setupKing(b, e, lines);
      teru = true;
    }
  }
  // 第3部 第1章 第3幕: ナゾカケ・ヒックリカエール2号（スピカは かならず 出る。battle-c9c.js）
  if (setupC9c(b, lines)) teru = true;
  // 第3部 第1章 第4幕: 魔人ムウ（スピカは かならず 出る）・星のうた（リーダーが c9_song1。battle-c9d.js）
  if (setupC9d(b, lines)) teru = true;
  // 第3部 第2章 第1幕: 2人の 中ボス（スピカは かならず 出る）・スピカの ごほうび（battle-c10a.js）
  if (setupC10a(b, lines)) teru = true;
  // 第3部 第2章 第2幕: 2人の 中ボス（スピカは かならず 出る）・スピカの ごほうび（battle-c10b.js）
  if (setupC10b(b, lines)) teru = true;
  // 第3部 第2章 第3幕: たいさ・アルゴル（スピカは かならず 出る）・スピカの ごほうび（battle-c10c.js）
  if (setupC10c(b, lines)) teru = true;
  // 第3部 第2章 第4幕: 門の 番人・ミラーレ（スピカは かならず 出る）・スピカの ごほうび・ちからの 水（battle-c10d.js）
  if (setupC10d(b, lines)) teru = true;
  // 第3部 第3章 第1幕: 星座のけもの・いかり船長（スピカは かならず 出る）・スピカの ごほうび（battle-c11a.js）
  if (setupC11a(b, lines)) teru = true;
  b.c9teruOn = teru;
  return teru;
}
// スピカが 入った あと（てらすの たまりぐあい。何回 よんでも おなじ。シミュレーター・テストからも よぶ）
export function addTeru(b) {
  const s = b.c9sp;
  // 第3部 第1章 第4幕: 星のうた（battle-c9d.js）
  if (s && b.c9songOn) addSong(b);
  if (!s || s.teru) return s?.teru || null;
  // 第3部 第2章 第1幕: 緑の 音の ごほうび … 3回で たまる（battle-c10a.js）
  // 第3部 第2章 第2幕: 白の 音の ごほうび … はじめから たまって いる（battle-c10b.js）
  const max = c10TeruMax(b, TERU_MAX);
  s.teru = { charge: c10TeruFull(b) ? max : 0, max, lit: 0, uses: 0 };
  for (const a of b.allies) if (!a.abilities.includes(TERU)) a.abilities = [TERU, ...a.abilities];
  return s.teru;
}
export function teruPub(b) {
  const t = teruOf(b);
  const song = songPub(b);
  return t ? { charge: t.charge, max: t.max, lit: t.lit, ...(song ? { song } : {}) } : null;
}

function setupKing(b, m, lines) {
  const kc = kingConf(m, b);
  // 大王の HP・攻撃力も 人数で 合わせる（few.hp・few.atk）
  if (kc.hp !== 1) m.maxHp = m.hp = Math.max(1, Math.round(m.maxHp * kc.hp));
  if (kc.atk !== 1) m.atk = Math.max(1, Math.round(m.atk * kc.atk));
  m.c9k = {
    acts: 0, watchLeft: kc.watch, watch: null, wait: 0, rest: 0, jumpLeft: kc.jump, jumpReady: false, dark: false, down: false,
    power: 1, atk0: m.atk, meats: 0, eats: 0, cakes: 0, soups: 0, breaks: 0, stops: 0, sulks: 0, jumps: 0, guards: 0, backs: 0,
  };
  b.c9king = { id: m.id };
  let boxes = 0;
  for (const f of C9B_BOXES) {
    try {
      if (b.hooks?.leaderFlag?.(f)) boxes++;
    } catch { /* */ }
  }
  m.c9k.boxes = boxes;
  // 皿（べつの 的）: HP は 人数で 合わせる。はこの 数だけ はじめは ない（late 回 動くと もぐら兵が 持って くる）
  const ds = b.enemies.filter((e) => C9B_DISH_IDS.includes(e.species));
  ds.forEach((d, i) => {
    d.c9d = { kind: MONSTERS[d.species].c9b.dish, back: 0 };
    if (kc.dish !== 1) d.maxHp = d.hp = Math.max(1, Math.round(d.maxHp * kc.dish));
    if (i >= ds.length - boxes) {
      Object.assign(d, { alive: false, hp: 0 });
      d.c9d.back = kc.late;
    }
  });
  lines.push(
    'デデドン大王「わっはっは！明かりもごちそうも、ぜーんぶわしのものだ！」',
    'デデドン大王「わしのごちそうに、手を出すでないぞ！」',
  );
  if (boxes) lines.push(`（食料庫で、ごちそうのはこを${boxes}つ取り返している。テーブルの皿が、少ない！）`);
  lines.push('（大王が皿をじっと見たら、食べられる前に、その皿をこわそう！）');
}

// ───────────── スピカの ほのかな光の あと（battle-c9a.js の glow から。1つの 番）─────────────
export function c9bGlow(b, out, lines) {
  const t = teruOf(b);
  if (!t) return;
  if (t.lit > 0) {
    t.lit--;
    if (!t.lit) {
      lines.push('スピカの光が、すうっと小さくなった…。');
      out.dim = true;
    }
  }
  if (t.charge < t.max) {
    t.charge++;
    if (t.charge >= t.max) {
      lines.push('スピカ「光が、たまったよ！てらせるよ！」');
      out.teruReady = true;
    }
  }
  // 第3部 第1章 第4幕: 星のうたが たまる（battle-c9d.js）
  c9dGlow(b, out, lines);
  out.teru = teruPub(b);
}

// ───────────── 行動の はじめ（battle-c9a.js の c9aTurnStart から。敵の 番だけ）─────────────
export function c9bTurnStart(b, c, ev, stuck) {
  if (c.side === 'ally') return;
  // 第3部 第1章 第3幕（battle-c9c.js）
  if (!c.c9k) {
    // 第3部 第2章 第1幕（battle-c10a.js）
    c10aTurnStart(b, c, ev, stuck);
    // 第3部 第2章 第2幕（battle-c10b.js）
    c10bTurnStart(b, c, ev, stuck);
    // 第3部 第2章 第3幕（battle-c10c.js）
    c10cTurnStart(b, c, ev, stuck);
    // 第3部 第2章 第4幕（battle-c10d.js）
    c10dTurnStart(b, c, ev, stuck);
    // 第3部 第3章 第1幕（battle-c11a.js）
    c11aTurnStart(b, c, ev, stuck);
    // 第3部 第1章 第4幕（battle-c9d.js）
    c9dTurnStart(b, c, ev, stuck);
    return c9cTurnStart(b, c, ev, stuck);
  }
  const k = c.c9k;
  const kc = kingConf(c, b);
  if (c.telegraph || k.down) return;
  k.acts++;
  // こわした・食べた 皿が もどる
  for (const d of dishesOf(b)) {
    if (d.alive || !(d.c9d.back > 0)) continue;
    d.c9d.back--;
    if (d.c9d.back > 0) continue;
    Object.assign(d, { alive: true, hp: d.maxHp, status: {}, buffs: {}, debuffs: {}, atb: 0, ready: false, queued: false, telegraph: null });
    k.backs++;
    ev.lines.push(`もぐら兵が、新しい${DISH_NAME[d.c9d.kind]}の皿を、テーブルに運んできた！`, 'もぐら兵「大王さま、おまちどおさまです！」');
    ev.c9kBack = { id: c.id, dish: d.id };
    ev.upd.push(d);
  }
  ev.upd.push(c);
  if (stuck) return;
  // HPが 半分を 切った: 明かりを 食べて まっ暗
  if (!k.dark && c.hp <= c.maxHp * 0.5) {
    c.telegraph = LIGHT;
    return;
  }
  if (k.rest > 0) {
    k.rest--;
    c.telegraph = SULK;
    return;
  }
  if (k.jumpReady) {
    c.telegraph = JUMP;
    return;
  }
  if (k.watch) {
    const d = b.get(k.watch);
    if (d?.alive) {
      if (k.wait > 0) {
        k.wait--;
        ev.c9kWait = { id: c.id, left: k.wait };
        return;
      }
      c.telegraph = EAT;
      return;
    }
    k.watch = null;
  }
  k.watchLeft--;
  if (k.watchLeft <= 0) {
    if (aliveDishes(b).length) {
      c.telegraph = WATCH;
      return;
    }
    k.watchLeft = 0;
  }
  k.jumpLeft--;
  if (k.jumpLeft <= 0) {
    c.telegraph = JUMPUP;
    return;
  }
  ev.c9kLeft = { id: c.id, left: Math.max(0, k.watchLeft), every: kc.watch };
}

// ───────────── 技の こうか（battle-c9a.js の c9aEffect の のこり）─────────────
export function c9bEffect(b, c, a, eff, ev) {
  switch (eff.type) {
    case 'c9kWatch': watch(b, c, ev); return true;
    case 'c9kEat': eat(b, c, ev); return true;
    case 'c9kSulk': sulk(b, c, ev); return true;
    case 'c9kLight': eatLight(b, c, ev); return true;
    case 'c9kJumpUp': jumpUp(b, c, ev); return true;
    case 'c9kJump': jump(b, c, ev); return true;
    case 'c9bTeru': teru(b, c, ev); return true;
    // 第3部 第1章 第3幕（battle-c9c.js）
    // 第3部 第1章 第4幕（battle-c9d.js）
    // 第3部 第2章 第1幕（battle-c10a.js）
    // 第3部 第2章 第2幕（battle-c10b.js）
    // 第3部 第2章 第3幕（battle-c10c.js）
    // 第3部 第2章 第4幕（battle-c10d.js）
    // 第3部 第3章 第1幕（battle-c11a.js）
    default: return c11aEffect(b, c, a, eff, ev) || c10dEffect(b, c, a, eff, ev) || c10cEffect(b, c, a, eff, ev) || c10bEffect(b, c, a, eff, ev) || c10aEffect(b, c, a, eff, ev) || c9dEffect(b, c, a, eff, ev) || c9cEffect(b, c, a, eff, ev);
  }
}

function watch(b, c, ev) {
  const k = c.c9k;
  if (!k) return;
  const kc = kingConf(c, b);
  const pool = aliveDishes(b);
  k.watchLeft = kc.watch;
  if (!pool.length) {
    ev.lines.push(`${c.name}「…ごちそうが、ないではないか！」`);
    return;
  }
  const d = pool[b.rng.int(0, pool.length - 1)];
  k.watch = d.id;
  k.wait = kc.wait;
  const vis = kingVisible(b);
  if (vis) ev.lines.push(`${c.name}が、${DISH_NAME[d.c9d.kind]}を、じーっと見ている！`, '（次に、食べられてしまう…！その皿を先にこわそう！）');
  else ev.lines.push(`${c.name}が、何かを、じーっと見ている…`, '（暗くて、どの皿かわからない…！スピカにてらしてもらおう！）');
  ev.c9kWatch = { id: c.id, dish: vis ? d.id : null, kind: vis ? d.c9d.kind : null };
  ev.warn = true;
  ev.upd.push(c, d);
}

function eat(b, c, ev) {
  const k = c.c9k;
  const d = k?.watch ? b.get(k.watch) : null;
  if (!k) return;
  k.watch = null;
  if (!d?.alive) {
    sulk(b, c, ev);
    return;
  }
  const kc = kingConf(c, b);
  const kind = d.c9d.kind;
  b.c9kEating = true;
  try {
    b.kill(d, null, ev);
  } finally {
    b.c9kEating = false;
  }
  d.c9d.back = kc.back;
  k.eats++;
  ev.fx = { type: 'ability', anim: 'c9k_eat', actor: c.id, targets: [d.id], side: 'enemy' };
  ev.lines.push(`${c.name}は、${DISH_NAME[kind]}を、ぺろりとたいらげた！`);
  ev.results = ev.results || [];
  if (kind === 'meat') {
    k.meats++;
    if (k.meats <= kc.meat.max) {
      k.power *= kc.meat.up;
      c.atk = Math.round(k.atk0 * k.power);
    }
    ev.lines.push(`${c.name}「むふー、力がわいてきたぞ！」（大王の攻撃力が上がった）`);
  } else if (kind === 'cake') {
    k.cakes++;
    const heal = Math.min(c.maxHp - c.hp, Math.round(c.maxHp * kc.cake));
    c.hp += heal;
    if (heal > 0) ev.results.push({ id: c.id, heal });
    ev.lines.push(`${c.name}「あまーい！」`, `${c.name}のHPが${heal}回復した！`);
  } else {
    k.soups++;
    c.telegraph = SOUP;
    ev.lines.push(`${c.name}「…か、か、か…」（顔がまっ赤だ！次に、ほのおが来る…！）`);
  }
  ev.c9kEat = { id: c.id, dish: d.id, kind };
  ev.warn = true;
  ev.upd.push(c, d);
}

function sulk(b, c, ev) {
  const k = c.c9k;
  if (k) k.sulks++;
  ev.lines.push(`${c.name}「…わしの、ごちそう…。」`);
  ev.c9kSulk = { id: c.id };
  ev.upd.push(c);
}

function eatLight(b, c, ev) {
  const k = c.c9k;
  if (!k) return;
  k.dark = true;
  ev.lines.push(`${c.name}は、広間の明かりを、ぱくっと食べてしまった！`, 'あたりが、まっ暗になった…！', '（どの皿を見ているか、わからない…！スピカにてらしてもらおう！）');
  ev.fx = { type: 'ability', anim: 'c9k_light', actor: c.id, targets: [c.id], side: 'enemy' };
  ev.c9kDark = { id: c.id };
  ev.warn = true;
  ev.upd.push(c, ...dishesOf(b));
}

function jumpUp(b, c, ev) {
  const k = c.c9k;
  if (!k) return;
  k.jumpReady = true;
  ev.lines.push('（次に、みんなの上に落ちてくる…！「防御」で身を守ろう！）');
  ev.c9kJumpUp = { id: c.id };
  ev.warn = true;
  ev.upd.push(c);
}

function jump(b, c, ev) {
  const k = c.c9k;
  if (!k) return;
  const kc = kingConf(c, b);
  k.jumpReady = false;
  k.jumpLeft = kc.jump;
  k.jumps++;
  const targets = b.aliveAllies();
  ev.fx = { type: 'ability', anim: 'c9k_jump', actor: c.id, targets: targets.map((x) => x.id), side: 'enemy' };
  let guarded = 0;
  for (const t of targets) {
    if (t.defending) guarded++;
    b.physHit(c, t, { mult: kc.jumpMult * (t.defending ? kc.guardCut : 1), acc: 9 }, ev, 'phys');
  }
  k.guards += guarded;
  if (guarded) ev.lines.push(guarded === targets.length ? 'みんな、身を守って、こらえた！' : '身を守った人は、こらえた！');
  ev.c9kJump = { id: c.id, guarded };
  ev.upd.push(c);
}

// てらす（だれでも。その 人の 番を 使う）
function teru(b, c, ev) {
  const t = teruOf(b);
  if (!t) {
    ev.lines.push('しかし、何も起こらなかった。');
    return;
  }
  if (t.charge < t.max) {
    ev.lines.push('しかし、スピカの光が、まだたまっていない…。');
    return;
  }
  t.charge = 0;
  t.uses++;
  const king = kingOf(b);
  // 第3部 第2章 第3幕: 紫の 音の ごほうび … 明るい 間が 4回（battle-c10c.js）
  t.lit = king?.c9k ? kingConf(king, b).lit : c10TeruLit(b, TERU_LIT);
  ev.lines.push('スピカの光が、ぱあっと広がった！', 'あたりが、明るくなった！');
  ev.fx = { type: 'ability', anim: 'c9b_teru', actor: c.id, targets: [c.id], side: 'ally' };
  const k = king?.c9k;
  if (k?.watch) {
    const d = b.get(k.watch);
    if (d?.alive) ev.lines.push(`${king.name}は、${DISH_NAME[d.c9d.kind]}を見ている！`);
  }
  const hid = b.enemies.filter((e) => e.alive && MONSTERS[e.species]?.c9b?.hide);
  if (hid.length) ev.lines.push(`${hid[0].name}のすがたが、よく見えるようになった！`);
  ev.c9bTeru = { by: c.id, lit: t.lit, watch: k?.watch && b.get(k.watch)?.alive ? k.watch : null };
  ev.c9Spica = { light: b.c9sp.light, max: b.c9sp.max, teru: teruPub(b), lit: true };
  ev.upd.push(c, ...b.enemies.filter((e) => e.alive));
}

// ───────────── ダメージ（battle-c9a.js の c9aDamage の さいご。味方 → 敵）─────────────
// 大王は HP 1 より 下がらない（1 に なると すわりこんで 勝ち）
export function c9bDamage(b, c, t, dmg, info, ev) {
  if (!(dmg > 0)) return dmg;
  // 第3部 第1章 第3幕: なぞの守り・目が回る（battle-c9c.js）
  // 第3部 第1章 第4幕: 分かれる 前の ムウは たおれない（battle-c9d.js）
  // 第3部 第2章 第1幕: カビ・かべ・オーバーヒート・メカの あつさ・HP 1 で 止まる（battle-c10a.js）
  // 第3部 第2章 第2幕: 砂の体・ぬれた・大かんそうを 止める・まぼろし・HP 1 で 止まる（battle-c10b.js）
  // 第3部 第2章 第3幕: せまい・休んで いる たいさ・やみの とばり・HP 1 ／ 3わりで 止まる（battle-c10c.js）
  // 第3部 第2章 第4幕: ちからの 水・色の まく・ミラーレは HP 1 で 止まる（battle-c10d.js）
  // 第3部 第3章 第1幕: 船長は ふだん かたい・目を 回すと よく 通る・HP 1 で にげる（battle-c11a.js）
  if (!t?.c9k) return c11aDamage(b, c, t, c10dDamage(b, c, t, c10cDamage(b, c, t, c10bDamage(b, c, t, c10aDamage(b, c, t, c9cDamage(b, c, t, c9dDamage(b, c, t, dmg, info, ev), info, ev), info, ev), info, ev), info, ev), info, ev), info, ev);
  const k = t.c9k;
  if (k.down) return 0;
  if (dmg >= t.hp) {
    dmg = Math.max(0, t.hp - 1);
    kingDown(b, t, ev);
  }
  return dmg;
}
function kingDown(b, c, ev) {
  const k = c.c9k;
  k.down = true;
  k.watch = null;
  k.jumpReady = false;
  c.telegraph = null;
  b.killed.push(c.species);
  if (ev) {
    post(ev).push(
      'ぐううう〜〜〜っ…！',
      `${c.name}の、おなかが鳴った…。`,
      `${c.name}は、ぺたんと、すわりこんでしまった。`,
      `${c.name}「…もう、うごけん…。おなかが、すいた…。」`,
    );
    ev.c9kDown = { id: c.id };
    ev.upd.push(c);
  }
  b.pendingEnd = { outcome: 'win' };
  b.queue = [];
}

// ───────────── たおれた（battle-c9a.js の c9aKill から。t.alive は まだ true）─────────────
export function c9bKill(b, t, ev) {
  // 第3部 第1章 第3幕: ナゾカケ・メカ（battle-c9c.js）
  c9cKill(b, t, ev);
  // 第3部 第1章 第4幕: ばたんきゅう・すわりこむ（battle-c9d.js）
  c9dKill(b, t, ev);
  // 第3部 第2章 第2幕: 本物の シロフクロウ（battle-c10b.js）
  c10bKill(b, t, ev);
  if (!t?.c9d || b.c9kEating) return;
  const king = kingOf(b);
  const k = king?.c9k;
  if (!k || !king.alive || k.down) return;
  const kc = kingConf(king, b);
  t.c9d.back = kc.back;
  k.breaks++;
  const nm = DISH_NAME[t.c9d.kind];
  if (k.watch === t.id) {
    k.watch = null;
    k.wait = 0;
    k.rest = 1;
    k.stops++;
    k.watchLeft = kc.watch;
    if (king.telegraph === EAT) king.telegraph = null;
    if (ev) {
      post(ev).push(`大王の目の前で、${nm}を取り上げた！`, `${king.name}「あっ…！わしの${nm}が…！」`);
      ev.c9kBreak = { id: king.id, dish: t.id, stop: true };
      ev.upd.push(king);
    }
    return;
  }
  if (ev) {
    post(ev).push(`${nm}の皿を、取り上げた！`);
    ev.c9kBreak = { id: king.id, dish: t.id, stop: false };
  }
}

// ───────────── オート（battle-c9a.js の c9aPlan の はじめ）─────────────
// 大王の 戦いで なければ undefined（c9a の 考えへ）。ふつうの オート（家族の キャラ）は null
export function c9bPlan(b, c, decide, bestHit) {
  // 第3部 第1章 第3幕: ナゾカケ・メカ（battle-c9c.js）
  // 第3部 第1章 第4幕: 魔人ムウ（battle-c9d.js）
  // 第3部 第2章 第1幕: タマゴン・モルド（battle-c10a.js）
  // 第3部 第2章 第2幕: ゲッコー・シロフクロウ（battle-c10b.js）
  // 第3部 第2章 第3幕: たいさ・アルゴル（battle-c10c.js）
  // 第3部 第2章 第4幕: 門の 番人・ミラーレ（battle-c10d.js）
  // 第3部 第3章 第1幕: 星座のけもの・いかり船長（battle-c11a.js）
  const p11a = c11aPlan(b, c, decide, bestHit);
  if (p11a !== undefined) return p11a;
  const p10d = c10dPlan(b, c, decide, bestHit);
  if (p10d !== undefined) return p10d;
  const p10c = c10cPlan(b, c, decide, bestHit);
  if (p10c !== undefined) return p10c;
  const p10b = c10bPlan(b, c, decide, bestHit);
  if (p10b !== undefined) return p10b;
  const p10 = c10aPlan(b, c, decide, bestHit);
  if (p10 !== undefined) return p10;
  const p9d = c9dPlan(b, c, decide, bestHit);
  if (p9d !== undefined) return p9d;
  const p9c = c9cPlan(b, c, decide, bestHit);
  if (p9c !== undefined) return p9c;
  const king = kingOf(b);
  if (!king?.c9k) return undefined;
  if (c.side !== 'ally' || b.c9Inner || c.status?.rift || king.c9k.down || !king.alive) return null;
  const k = king.c9k;
  const mode = c.knows9 ?? b.knowsCh9;
  const vis = kingVisible(b);
  const watched = k.watch && vis ? b.get(k.watch) : null;
  if (mode !== 'know' && mode !== 'blind') return autoDish(b, c, watched, bestHit);
  // 大ジャンプの 前ぶれ: 身を 守る（知らない 人は たまに 気づく）
  if (k.jumpReady && !c.defending && (mode === 'know' || b.rng.chance(0.15))) return { type: 'defend' };
  if (mode !== 'know') {
    if (watched?.alive && b.rng.chance(0.12)) return bestHit(b, c, watched);
    return null;
  }
  const cmd = base(b, c, decide);
  const a = cmd?.type === 'ability' ? ABILITIES[cmd.id] : null;
  // だれかが とても あぶない ときの 回復・生き返りは そのまま
  if (a && ['heal', 'revive', 'reviveAll'].includes(prim(a).type) && b.allies.some((x) => !x.fled && (!x.alive || x.hp / x.maxHp < 0.4))) return cmd;
  // まっ暗: てらす（だれかが もう えらんで いれば ほかは ふつう。ひとりの ときは 何かを 見て いる 時だけ … 番が 短い ので）
  const alone = b.allies.length === 1;
  if (k.dark && (k.watch || !alone) && !litNow(b) && teruReady(b) && canUse(b, c, TERU) && !b.queue.some((q) => q.cmd?.id === TERU)) return { type: 'ability', id: TERU };
  // 見て いる 皿を 先に こわす
  if (watched?.alive) {
    const hit = bestHit(b, c, watched);
    if (hit) return hit;
  }
  // ふだんは 大王の 本体を ねらう
  const onDish = (id) => !!b.get(id)?.c9d;
  if (cmd?.type === 'attack' && onDish(cmd.target)) return { type: 'attack', target: king.id };
  if (a?.target === 'enemy' && onDish(cmd.target)) return { ...cmd, target: king.id };
  return cmd;
}
function base(b, c, decide) {
  b.c9Inner = true;
  try {
    return decide(b, c);
  } finally {
    b.c9Inner = false;
  }
}
// 自動の 人の 仲間（酒場の 人。魔物の 仲間は かたいので ねらわない）: 見えて いる 皿を 3回に 1回 ねらう（数は 自動の 仲間 みんなで 1つ）
function autoDish(b, c, watched, bestHit) {
  if (c.kind === 'player' || c.kind === 'monster' || !watched?.alive) return null;
  b.c9kAuto = (b.c9kAuto || 0) + 1;
  if (b.c9kAuto % AUTO_DISH_EVERY) return null;
  return bestHit(b, c, watched);
}
// しくみの 用が ある 間（シミュレーターの 知って いる 人は 合体技を しない）
export function c9bBusy(b) {
  // 第3部 第1章 第3幕（battle-c9c.js）
  if (c9cBusy(b) || c9dBusy(b) || c10aBusy(b) || c10bBusy(b) || c10cBusy(b) || c10dBusy(b) || c11aBusy(b)) return true;
  const k = kingOf(b)?.c9k;
  if (!k || k.down) return false;
  if (k.jumpReady) return true;
  if (k.watch && kingVisible(b) && b.get(k.watch)?.alive) return true;
  if (k.dark && (k.watch || b.allies.length > 1) && !litNow(b) && teruReady(b)) return true;
  return false;
}

// 第92回 第3便: 今、こたえが いる 前ぶれが 出て いるか（battle-tell.js の b.tell。battle-c9a.js の c9Tell から）
//   大王 … 皿を 見て いる（見える とき）・大ジャンプの 前ぶれ。第3幕（battle-c9c.js の c9cTell）
export function c9bTell(b) {
  const king = kingOf(b);
  const k = king?.alive ? king.c9k : null;
  if (k && !k.down) {
    if (k.jumpReady) return 'jump';
    if (k.watch && kingVisible(b) && b.get(k.watch)?.alive) return 'watch';
  }
  // 第3部 第1章 第4幕: おかしビームの ねらい（beam）・いっしょに ドーン（doon）… battle-c9d.js の c9dTele
  // 第3部 第2章 第1幕: ドリル（drill）・大カビばくだん（bomb）… battle-c10a.js の c10aTell
  // 第3部 第2章 第2幕: 大かんそう（dry）・ぬすむ（steal）… battle-c10b.js の c10bTell
  // 第3部 第2章 第3幕: 雷（bolt）・星の音（ring）… battle-c10c.js の c10cTell
  // 第3部 第2章 第4幕: 光を はかる（measure）… battle-c10d.js の c10dTell
  // 第3部 第3章 第1幕: かみつき（fang）・よみがえる 前（revive）・いかりなげ（anchor）… battle-c11a.js の c11aTell
  return c11aTell(b) || c10dTell(b) || c10cTell(b) || c10bTell(b) || c10aTell(b) || c9dTele(b) || c9cTell(b);
}

// ───────────── がめんへ（battle-c9a.js の c9aPub から。敵だけ）─────────────
// 大王: kWatch（見て いる 皿の id。まっ暗で 見えない ときは '?'）・kWatchLeft・kWatchEvery・kJump（大ジャンプの 前ぶれ）・kJumpLeft・
//   kDark（まっ暗で てらして いない）・kLit（まっ暗だが てらして いる）・kRest（しょんぼり）・kMeat（にくを 食べた 数）・kDown（すわりこんだ）
// 皿: dish9（にく・ケーキ・からいスープ）・dishWatched（見られて いる。見える とき）・dishDark（まっ暗で 見えない）
// 見えにくい 魔物: hide9
export function c9bPub(c, b = c?._b9) {
  const o = {};
  if (c.c9k && b) {
    const k = c.c9k;
    const kc = kingConf(c, b);
    const vis = kingVisible(b);
    o.kWatch = k.watch ? (vis ? k.watch : '?') : null;
    o.kWatchLeft = Math.max(0, k.watchLeft);
    o.kWatchEvery = kc.watch;
    o.kJump = k.jumpReady ? 1 : 0;
    o.kJumpLeft = Math.max(0, k.jumpLeft);
    o.kDark = k.dark && !litNow(b) ? 1 : 0;
    o.kLit = k.dark && litNow(b) ? 1 : 0;
    o.kRest = k.rest > 0 || c.telegraph === SULK ? 1 : 0;
    o.kMeat = Math.min(k.meats, kc.meat.max);
    o.kDown = k.down ? 1 : 0;
    // 曲の もりあがり（F班。1 ふつう・2 まっ暗・3 さいご 〈HP 2わり いか〉・4 すわりこんだ）
    o.kingStage = k.down ? 4 : c.hp <= c.maxHp * 0.2 ? 3 : k.dark ? 2 : 1;
  }
  if (c.c9d && b) {
    const king = kingOf(b);
    const k = king?.c9k;
    o.dish9 = c.c9d.kind;
    const vis = kingVisible(b);
    o.dishWatched = k?.watch === c.id && vis ? 1 : 0;
    o.dishDark = k?.dark && !vis ? 1 : 0;
  }
  if (b && MONSTERS[c.species]?.c9b?.hide) o.hide9 = litNow(b) ? 0 : 1;
  // 第3部 第1章 第3幕: ナゾカケ・メカ（battle-c9c.js）
  // 第3部 第1章 第4幕: ムウ・ムウムウ（battle-c9d.js）
  // 第3部 第2章 第1幕: タマゴン・モルド（battle-c10a.js）
  // 第3部 第2章 第2幕: ゲッコー・シロフクロウ（battle-c10b.js）
  // 第3部 第2章 第3幕: たいさ・アルゴル（battle-c10c.js）
  return Object.assign(o, c9cPub(c, b), c9dPub(c, b), c10aPub(c), c10bPub(c), c10cPub(c), c10dPub(c), c11aPub(c));
}

// 第3部 第3章 第1幕: スピカの「ながれ星」も しかけの ダメージを 通す（battle-c11a.js）
setStarDamage(c9bDamage);
