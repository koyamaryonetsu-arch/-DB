// 第3部 第2章 第3幕「紫と、うばわれた音」の 戦いの しかけ（battle-c9a.js・battle-c9b.js から 短い よびだしで よぶ。ほかの たたかいは かわらない）
// docs/plan-part3-c10c.md の 15-3
//
// ・スピカの ごほうび（どの 戦いでも。リーダーの フラグ）: c10_note_si … 「てらす」の 明るい 間が 3回 → 4回の 番（b.c10rew.teruLit）。
//   第1幕・第2幕の ごほうび（battle-c10a.js・battle-c10b.js）と 合わせて きく（この 幕の 2つの ボスの 時は まだ 持って いない）
// ・空の 中ボス「たいさムスカリ」（monsters-c10c.js の c10c.kind 'colonel'）… 立つ 石を うつる
//   味方は 3つの うき石（左・まん中・右。a.c10stone 0〜2）の どれかに 立つ。はじめは 自動で 分かれる（ならびの じゅんに 左・まん中・右・左…）
//   たいさの 番は「前ぶれ」と「雷」を くりかえす:
//     前ぶれの 番 … ふつうに 動きながら、石が lit.n こ（HP 半分からは lit.half こ）光る（人が 多い 石ほど ねらわれやすい）
//     雷の 番 … 光った 石に いる 人 みんなへ 大いなずま（m10k_bolt。身を 守ると guardCut）
//   「うつる」（m10_utsuru。だれでも。その 人の 番を 使う。cmd.choice … 行き先 0〜2）: ちがう 石へ。光って いない 石に いれば 当たらない
//   同じ 石に tight 人 いじょう（生きて いる 人）で「せまい！」… その 石の 人は 与える ダメージ tightK ばい
//   雷が だれにも 当たらないと「な、なぜだ」… 次の 番は 休む（m10k_why）・休みおわるまで 受ける ダメージ miss.taken ばい
//   crack.every 回の 前ぶれごとに「石を くずす」の 前ぶれも（光って いない 石）→ 雷の 番に くずれる（たいさが crack.turns 回 動くまで 使えない。
//     そこに いた 人は となりの 石へ 自動で うつる）
//   スピカの「てらす」: たいさは まぶしくて、次の 雷の ねらいが 外れる（1回 ぶんの 保険 … st.dazzle）
//   勝つと たいさは しょんぼり（たおれない。HP 1 … b.killed に 入れて 経験値・落とし物は ふつう）
//   自動の 仲間（酒場の 人・家族の 仲間・魔物の 仲間）は、人が えらんで いる 時だけ、光った 石に いると 3回に 1回 うつる。完全オートは うつらない
// ・幕の ボス「アルゴル」（c10c.kind 'algol'）… 光を 食べさせない
//   eat.every 回 動く ごとに「光を 食べる」（m10y_eat）: 味方の よい 効果（強く なる 効果・リジェネ・力ため）を ぜんぶ 食べて、
//     食べた 数 × 最大HPの eat.heal 回復・攻撃が 上がる（食べた 数 × eat.atkUp。さい大 eat.atkMax）
//   veil.every 回 動く ごとに「やみの とばり」（m10y_veil。前ぶれ なし）: アルゴルが veil.turns 回 動くまで、味方の 与える ダメージ veil.k ばい。スピカの「てらす」で 消える
//   ring.every 回 動く ごとに「星の音を かざす」の 前ぶれ（ふつうに 動きながら）→ 次の 番に 全体に 大ダメージ（m10y_blast。身を 守ると guardCut）
//     前ぶれの 間に スピカの「星のうた」を 使うと、音が スピカに こたえて 止まる（アルゴルは 1回 動けない … m10y_still）
//   HPが end（3わり）に なると 戦いが 終わる（ひざを つく。たおれない。経験値と 品は もらえる）
//   自動の 仲間は、人が えらんで いる 時は 味方を 強く する 技を ひかえる（完全オートは ふだん どおり 使って 食べられる）
// ・人数で 合わせる（few・bare・solo・monK）は 第1幕と おなじ 数え方（battle-c10a.js の c10Pick。魔物の 仲間は 半人ぶん・仲間なしの 2人／3人は bare）
import { MONSTERS } from './data/monsters.js?v=9619c3d748be';
import { ABILITIES } from './data/abilities.js?v=9619c3d748be';
import { DUAL_TECHS } from './data/dual.js?v=9619c3d748be';
import { C10C_COLONEL, C10C_ALGOL, COLONEL_NAME, ALGOL_NAME } from './data/monsters-c10c.js?v=9619c3d748be';
import { UTSURU } from './data/abilities-c10c.js?v=9619c3d748be';
import { C10C_B as C10C } from './maps/c10c-flags.js?v=9619c3d748be';
import { TERU } from './data/abilities-c9b.js?v=9619c3d748be';
import { SONG } from './data/abilities-c9d.js?v=9619c3d748be';
import { canUse } from './ai.js?v=9619c3d748be';
import { c10Pick, someoneChooses } from './battle-c10a.js?v=9619c3d748be';

export { UTSURU };
export const BOLT = 'm10k_bolt';
export const WHY = 'm10k_why';
export const EAT = 'm10y_eat';
export const VEIL = 'm10y_veil';
export const BLAST = 'm10y_blast';
export const STILL = 'm10y_still';
// スピカの ごほうび（むらさきの 音）: てらすの 明るい 間
export const REWARD_LIT = 4;
export const AUTO_EVERY = 3;
// 石の 名前（左から）
export const STONE_NAMES = ['左', 'まん中', '右'];
export const STONES = 3;

const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || {} : a?.effect || {});
const parts = (a) => (a?.effect?.type === 'multi' ? a.effect.parts || [] : a?.effect ? [a.effect] : []);
const post = (ev) => (ev.postLines = ev.postLines || []);
const flag = (b, f) => {
  try {
    return !!b.hooks?.leaderFlag?.(f);
  } catch {
    return false;
  }
};
const stoneName = (i) => `${STONE_NAMES[i] || ''}の石`;

// ボスの しかけの 数（人数で 合わせた もの）
export function c10cConf(species, b = null) {
  const c = MONSTERS[species]?.c10c || {};
  const pick = c10Pick(c, b);
  const mons = b && (b.allies || []).some((a) => a.kind === 'player') ? b.allies.filter((a) => a.kind === 'monster').length : 0;
  return {
    kind: c.kind,
    lit: { n: pick('litN', c.lit?.n ?? 1), half: pick('litHalf', c.lit?.half ?? 2) },
    bolt: { mult: 2.2, guardCut: 0.5, ...(c.bolt || {}), mult: (c.bolt?.mult ?? 2.2) * pick('boltK', 1) },
    tight: pick('tight', c.tight ?? 3), tightK: c.tightK ?? 0.5,
    miss: { taken: 1.5, ...(c.miss || {}) },
    crack: { every: 3, turns: 2, ...(c.crack || {}) },
    eat: { every: 3, heal: 0.04, atkUp: 0.08, atkMax: 1.8, ...(c.eat || {}), every: pick('eatEvery', c.eat?.every ?? 3) },
    veil: { every: 5, first: 2, turns: 3, k: 0.5, ...(c.veil || {}), k: pick('veilK', c.veil?.k ?? 0.5) },
    ring: { every: 4, first: 3, mult: 2.4, guardCut: 0.35, ...(c.ring || {}), every: pick('ringEvery', c.ring?.every ?? 4), mult: (c.ring?.mult ?? 2.4) * pick('ringK', 1) },
    end: c.end ?? 0.3,
    hp: pick('hp', 1) * (1 + (c.monK?.hp || 0) * mons), atk: pick('atk', 1) * (1 + (c.monK?.atk || 0) * mons), spd: pick('spd', 1),
  };
}
export const c10cState = (b) => b?.c10c || null;
export const c10cBoss = (b) => (b?.c10c ? b.get(b.c10c.id) : null);
export const colonelOf = (b) => (b?.c10c?.kind === 'colonel' ? b.get(b.c10c.id) : null);
export const algolOf = (b) => (b?.c10c?.kind === 'algol' ? b.get(b.c10c.id) : null);
const teruOf = (b) => b.c9sp?.teru || null;
const songOf = (b) => b.c9sp?.song || null;
export const litNow10c = (b) => (teruOf(b)?.lit || 0) > 0;
const teruReady = (b) => { const t = teruOf(b); return !!t && t.charge >= t.max; };
const songReady = (b) => { const s = songOf(b); return !!s && s.charge >= s.max; };

// ───── うき石（たいさ）─────
export const stonesOf = (b) => b?.c10c?.stones || null;
export const stoneOf = (a) => (Number.isInteger(a?.c10stone) ? a.c10stone : null);
// その 石に 立って いる 生きた 味方
export const onStone = (b, i) => b.allies.filter((a) => a.alive && !a.fled && a.c10stone === i);
export const litStones = (b) => (stonesOf(b) || []).map((s, i) => (s.lit ? i : -1)).filter((i) => i >= 0);
export const onLit = (b, a) => !!stonesOf(b)?.[stoneOf(a)]?.lit;
// せまい（同じ 石に tight 人 いじょう）
export function tightOf(b, a) {
  const st = b?.c10c;
  if (!st || st.kind !== 'colonel' || st.won || stoneOf(a) === null || !a.alive) return false;
  return onStone(b, a.c10stone).length >= c10cConf(C10C_COLONEL, b).tight;
}
// 行き先に よい 石（くずれて いない・自分の 石で ない・光って いない・人が 少ない。うつる 予定の 人も 数える）
export function bestStone(b, a) {
  const S = stonesOf(b);
  if (!S) return null;
  const moving = new Map();
  for (const q of b.queue || []) {
    if (q.cmd?.id !== UTSURU || q.id === a.id) continue;
    const who = b.get(q.id);
    if (Number.isInteger(q.cmd.choice)) {
      moving.set(q.cmd.choice, (moving.get(q.cmd.choice) || 0) + 1);
      if (who && stoneOf(who) !== null) moving.set(who.c10stone, (moving.get(who.c10stone) || 0) - 1);
    }
  }
  let best = null;
  for (let i = 0; i < STONES; i++) {
    if (i === a.c10stone || S[i].broken > 0) continue;
    const n = onStone(b, i).length + (moving.get(i) || 0);
    const score = (S[i].lit ? 100 : 0) + (S[i].crack ? 10 : 0) + n;
    if (!best || score < best.score) best = { i, score };
  }
  return best ? best.i : null;
}

// ───────────── はじめ（battle-c9b.js の setupC9b から。setupC10b の あと）─────────────
// かえす 値: スピカを 出すか（ボスの 戦いは かならず。星のうたも）
export function setupC10c(b, lines) {
  // スピカの ごほうび（第1幕・第2幕の b.c10rew に 足す）
  if (flag(b, C10C.noteSi)) b.c10rew = { ...(b.c10rew || {}), teruLit: REWARD_LIT };
  const col = b.enemies.find((e) => e.species === C10C_COLONEL);
  const alg = b.enemies.find((e) => e.species === C10C_ALGOL);
  if (!col && !alg) return false;
  b.c9songOn = true;
  // 人が えらんで いる 間は、敵も 味方も 時間を 止める（battle.js の tick。第1幕・第2幕の 中ボスと おなじ）
  b.tellAll = true;
  if (col) setupColonel(b, col, lines);
  else setupAlgol(b, alg, lines);
  b.tell = c10cTell(b);
  return true;
}
function scale(e, cf) {
  if (cf.hp !== 1) e.maxHp = e.hp = Math.max(1, Math.round(e.maxHp * cf.hp));
  if (cf.atk !== 1) e.dmgRate = cf.atk;
  if (cf.spd !== 1) e.speed = (e.speed || 1) * cf.spd;
}
const hide = (o, k, v) => Object.defineProperty(o, k, { value: v, enumerable: false, configurable: true, writable: true });
function setupColonel(b, m, lines) {
  const cf = c10cConf(C10C_COLONEL, b);
  scale(m, cf);
  hide(m, '_b10c', b);
  m.c10k = { acts: 0, warns: 0, rest: 0, weak: false, weakEnd: false, down: false };
  b.c10c = {
    kind: 'colonel', id: m.id, won: false, dazzle: false, crackAim: null,
    stones: [...Array(STONES)].map(() => ({ lit: false, broken: 0, crack: false })),
    bolts: 0, hits: 0, misses: 0, moves: 0, cracks: 0, tightHits: 0, dazzles: 0,
  };
  // はじめは 自動で 分かれる（ひとりは まん中）
  const al = b.allies.filter((a) => !a.fled);
  al.forEach((a, i) => {
    a.c10stone = al.length === 1 ? 1 : i % STONES;
    hide(a, '_b10c', b);
    if (!a.abilities.includes(UTSURU)) a.abilities = [UTSURU, ...a.abilities];
  });
  lines.push(
    `${m.name}「ようこそ、空のいせきへ。むらさきの光の玉は、わが一族が、いただく。」`,
    `${m.name}「この雷の石ばんの力、とくと見たまえ。」`,
    '（足もとには、3つのうき石…！光った石には、雷が落ちるらしい。「うつる」で、ほかの石へにげよう！）',
  );
}
function setupAlgol(b, m, lines) {
  const cf = c10cConf(C10C_ALGOL, b);
  scale(m, cf);
  hide(m, '_b10c', b);
  m.c10y = {
    acts: 0, eatLeft: cf.eat.every, veilLeft: cf.veil.first, ringLeft: cf.ring.first, ringReady: false, stun: false, veil: 0,
    power: 1, atk0: m.dmgRate > 0 ? m.dmgRate : 1, down: false,
  };
  b.c10c = { kind: 'algol', id: m.id, won: false, eats: 0, eaten: 0, healed: 0, veils: 0, clears: 0, rings: 0, blasts: 0, blastGuards: 0, stills: 0 };
  lines.push(
    `${m.name}「…返さない。これは、ぼくに、いる物だ。」`,
    `${m.name}「きみたちの光も、ぜんぶ、もらう。」`,
    '（アルゴルは、こちらの光を食べるらしい…！強くなる技を使うと、食べられてしまうかも…）',
  );
}

// ───────────── スピカ（battle-c9b.js の teru から）─────────────
export const c10TeruLit = (b, d) => b?.c10rew?.teruLit || d;

// ───────────── 今 前ぶれ中か（battle-tell.js の b.tell。battle-c9b.js の c9bTell から）─────────────
// 'bolt' … 雷の 前ぶれ（石が 光って いる）・'ring' … 星の音を かざす 前ぶれ・'colonel'・'algol' … いつも 人が えらぶのを 待つ・null
export function c10cTell(b) {
  const st = b?.c10c;
  if (!st || st.won) return null;
  const m = c10cBoss(b);
  if (!m?.alive) return null;
  if (st.kind === 'colonel') return litStones(b).length ? 'bolt' : 'colonel';
  return m.c10y?.ringReady ? 'ring' : 'algol';
}

// ───────────── 1回 動いた あと（battle-c9a.js の c9aAfter の はじめ。味方・敵 どちらも）─────────────
export function c10cAfter(b, c, ev) {
  const st = b.c10c;
  if (!st || st.won || !c || b.pendingEnd || b.over) return;
  if (c.side !== 'ally') return;
  const m = c10cBoss(b);
  if (!m?.alive) return;
  if (st.kind === 'colonel') {
    // てらす: まぶしくて、次の 雷が 外れる
    if (ev.c9bTeru && !st.dazzle) {
      st.dazzle = true;
      st.dazzles++;
      post(ev).push(`${m.name}「うっ…まぶしい…！」（次の雷は、ねらいが外れる！）`);
      ev.c10kDazzle = { id: m.id };
      ev.upd.push(m);
    }
    return;
  }
  const k = m.c10y;
  // てらす: やみの とばりが 消える
  if (ev.c9bTeru && k.veil > 0) {
    k.veil = 0;
    st.clears++;
    post(ev).push('スピカの光で、やみのとばりが、すうっとはれた！（こうげきが、また通る！）');
    ev.c10yClear = { id: m.id };
    ev.upd.push(m);
  }
  // 星のうた: 前ぶれの 間なら 音が 止まる（アルゴルは 1回 動けない）
  if (ev.c9dSong && k.ringReady) {
    k.ringReady = false;
    k.stun = true;
    if (m.telegraph === BLAST) m.telegraph = null;
    st.stills++;
    post(ev).push('むらさきの音が、スピカの歌に、こたえた…！', `${m.name}の手の中で、むらさきの音が、しずかになった！（アルゴルは、動けない！）`);
    ev.c10yStop = { id: m.id };
    ev.warn = true;
    ev.upd.push(m);
  }
}

// ───────────── 行動の はじめ（battle-c9b.js の c9bTurnStart から。敵の 番だけ）─────────────
export function c10cTurnStart(b, c, ev, stuck) {
  const st = b.c10c;
  if (!st || c.side === 'ally' || st.won || c.id !== st.id || c.telegraph) return;
  if (st.kind === 'colonel') return colonelTurn(b, c, ev, stuck);
  return algolTurn(b, c, ev, stuck);
}
function colonelTurn(b, c, ev, stuck) {
  const st = b.c10c;
  const k = c.c10k;
  const cf = c10cConf(C10C_COLONEL, b);
  if (k.down) return;
  k.acts++;
  ev.upd.push(c);
  // くずれた 石が もどる（たいさが 動く 回数で 数える）
  st.stones.forEach((s, i) => {
    if (!(s.broken > 0)) return;
    s.broken--;
    if (!s.broken) {
      ev.lines.push(`${stoneName(i)}が、ふわりと、もとの場所にもどってきた！`);
      ev.c10kBack = { stone: i };
    }
  });
  // 休みおわった
  if (k.weakEnd) {
    k.weak = false;
    k.weakEnd = false;
  }
  if (stuck) return;
  if (k.rest > 0) {
    k.rest = 0;
    c.telegraph = WHY;
    return;
  }
  // 光った 石が ある … 雷の 番
  if (litStones(b).length) {
    c.telegraph = BOLT;
    return;
  }
  // 前ぶれの 番（ふつうに 動きながら 石が 光る）
  k.warns++;
  lightUp(b, c, ev, cf);
}
function lightUp(b, c, ev, cf) {
  const st = b.c10c;
  const S = st.stones;
  const half = c.hp <= c.maxHp * 0.5;
  const free = S.map((s, i) => (s.broken > 0 ? -1 : i)).filter((i) => i >= 0);
  const n = Math.max(1, Math.min(half ? cf.lit.half : cf.lit.n, free.length - 1));
  const pool = free.slice();
  const picked = [];
  for (let j = 0; j < n && pool.length; j++) {
    // 人が 多い 石ほど ねらわれやすい
    const ws = pool.map((i) => 1 + onStone(b, i).length);
    let r = b.rng.next() * ws.reduce((s, w) => s + w, 0);
    let at = pool.length - 1;
    for (let q = 0; q < pool.length; q++) {
      r -= ws[q];
      if (r < 0) { at = q; break; }
    }
    picked.push(pool[at]);
    pool.splice(at, 1);
  }
  for (const i of picked) S[i].lit = true;
  const names = picked.sort((x, y) => x - y).map(stoneName).join('と');
  ev.lines.push(`${c.name}の石ばんが、むらさきに光った！${names}が、ぴかぴか光りはじめた…！`, `（次に、${names}へ、雷が落ちる！「うつる」で、光っていない石へにげよう！）`);
  // 石を くずす 前ぶれ（光って いない 石。くずれて いる 石が ない 時）
  if (st.crackAim === null && c.c10k.warns % cf.crack.every === 0 && !S.some((s) => s.broken > 0)) {
    const cand = S.map((s, i) => (s.lit ? -1 : i)).filter((i) => i >= 0);
    if (cand.length >= 2) {
      const aim = cand[b.rng.int(0, cand.length - 1)];
      st.crackAim = aim;
      S[aim].crack = true;
      ev.lines.push(`${stoneName(aim)}に、ぴしぴしと、ひびが入った…！（雷のあとで、くずれる！）`);
      ev.c10kCrackUp = { stone: aim };
    }
  }
  ev.c10kLit = { id: c.id, stones: picked.slice(), half };
  ev.warn = true;
}
function algolTurn(b, c, ev, stuck) {
  const st = b.c10c;
  const k = c.c10y;
  const cf = c10cConf(C10C_ALGOL, b);
  if (k.down) return;
  k.acts++;
  ev.upd.push(c);
  // やみの とばりの のこり（アルゴルが 動く 回数で 数える）
  if (k.veil > 0) {
    k.veil--;
    if (!k.veil) {
      ev.lines.push('やみのとばりが、うすくなって、消えた。');
      ev.c10yVeilEnd = { id: c.id };
    }
  }
  if (stuck) return;
  if (k.stun) {
    k.stun = false;
    c.telegraph = STILL;
    return;
  }
  if (k.ringReady) {
    c.telegraph = BLAST;
    return;
  }
  k.eatLeft--;
  k.veilLeft--;
  k.ringLeft--;
  // 光を 食べる（その 番の 行動）
  if (k.eatLeft <= 0) {
    k.eatLeft = cf.eat.every;
    c.telegraph = EAT;
    return;
  }
  // やみの とばり（前ぶれ なし。その 番の 行動）
  if (k.veilLeft <= 0 && !(k.veil > 0)) {
    k.veilLeft = cf.veil.every;
    c.telegraph = VEIL;
    return;
  }
  // 星の音を かざす 前ぶれ（ふつうに 動きながら。次の 番に 全体）
  if (k.ringLeft <= 0) {
    k.ringLeft = cf.ring.every;
    k.ringReady = true;
    st.rings++;
    ev.lines.push(`${c.name}が、むらさきの音を、高くかざした…！音が、どんどん大きくなっていく…！`, '（次に、みんなに大きな音が来る！「防御」でそなえよう。スピカの「星のうた」なら、止まるかも…！）');
    ev.c10yRingUp = { id: c.id };
    ev.warn = true;
  }
  void st;
}

// ───────────── 技の こうか（battle-c9b.js の c9bEffect の のこり）─────────────
export function c10cEffect(b, c, a, eff, ev) {
  switch (eff.type) {
    case 'c10kBolt': bolt(b, c, ev); return true;
    case 'c10kWhy': why(b, c, ev); return true;
    case 'c10kMove': move(b, c, ev); return true;
    case 'c10yEat': eat(b, c, ev); return true;
    case 'c10yVeil': veil(b, c, ev); return true;
    case 'c10yBlast': blast(b, c, ev); return true;
    case 'c10yStill': {
      ev.lines.push(`${c.name}は、だまって、むらさきの音を見つめている…（動けない！今のうちだ！）`);
      ev.c10yStill = { id: c.id };
      ev.upd.push(c);
      return true;
    }
    default: return false;
  }
}
// うつる（だれでも。その 人の 番を 使う。cmd.choice … 行き先）
function move(b, c, ev) {
  const st = b.c10c;
  const m = colonelOf(b);
  if (!st || st.kind !== 'colonel' || !m?.alive || st.won) {
    ev.lines.push('しかし、何も起こらなかった。');
    return;
  }
  const S = st.stones;
  const ch = b.curCmd?.choice;
  const to = Number.isInteger(ch) && ch >= 0 && ch < STONES ? ch : bestStone(b, c);
  if (to === null || to === c.c10stone || S[to]?.broken > 0) {
    ev.lines.push(to === c.c10stone ? `${c.name}は、もう${stoneName(to)}にいる。` : `しかし、${to === null ? 'うつれる石が' : `${stoneName(to)}は、くずれていて`}、うつれない！`);
    ev.c10kMove = { id: c.id, from: c.c10stone, to: c.c10stone, ok: false };
    return;
  }
  const from = c.c10stone;
  c.c10stone = to;
  st.moves++;
  ev.fx = { type: 'ability', anim: 'c10c_move', actor: c.id, targets: [c.id], side: 'ally' };
  ev.lines.length = 0;
  ev.lines.push(`${c.name}は、${stoneName(to)}へ、ぴょんととびうつった！`);
  if (S[to].lit) ev.lines.push(`（でも、${stoneName(to)}も光っている…！）`);
  else if (litStones(b).length) ev.lines.push('（光っていない石だ。雷は当たらない！）');
  if (tightOf(b, c)) ev.lines.push(`${stoneName(to)}が、せまい！（3人いじょういると、こうげきが半分になる）`);
  ev.c10kMove = { id: c.id, from, to, ok: true };
  ev.upd.push(...b.allies.filter((x) => x.alive), m);
}
// 大いなずま（光った 石の 人 みんな。てらして いれば 外れる）
function bolt(b, c, ev) {
  const st = b.c10c;
  const k = c.c10k;
  const cf = c10cConf(C10C_COLONEL, b);
  const S = st.stones;
  const lit = litStones(b);
  st.bolts++;
  const dazzled = st.dazzle;
  st.dazzle = false;
  const targets = dazzled ? [] : b.aliveAllies().filter((a) => S[a.c10stone]?.lit);
  ev.fx = { type: 'ability', anim: 'c10k_bolt', actor: c.id, targets: targets.map((x) => x.id), side: 'enemy', stones: lit };
  let guarded = 0;
  for (const t of targets) {
    if (t.defending) guarded++;
    b.physHit(c, t, { mult: cf.bolt.mult * (t.defending ? cf.bolt.guardCut : 1), acc: 9 }, ev, 'phys');
  }
  for (const s of S) s.lit = false;
  if (!targets.length) {
    // 外れた: 次の 番は 休む・受ける ダメージ ふえる
    k.rest = 1;
    k.weak = true;
    st.misses++;
    ev.lines.length = 0;
    ev.lines.push(dazzled ? `スピカの光がまぶしくて、${c.name}の雷は、あさっての方へ落ちた！` : '大いなずまは、だれもいない石に落ちた！');
    post(ev).push(`${c.name}「な、なぜだ…！」`, `（${c.name}は、うろたえている！今なら、こうげきがよく通る！）`);
    ev.c10kMiss = { id: c.id, dazzled };
    ev.warn = true;
  } else {
    st.hits += targets.length;
    if (guarded) post(ev).push(guarded === targets.length ? '雷を受けた人は、身を守って、こらえた！' : '身を守った人は、こらえた！');
    ev.c10kHit = { id: c.id, n: targets.length, guarded };
  }
  // 石を くずす（前ぶれの 石）
  if (st.crackAim !== null) {
    const i = st.crackAim;
    st.crackAim = null;
    S[i].crack = false;
    S[i].broken = cf.crack.turns;
    st.cracks++;
    const left = onStone(b, i);
    post(ev).push(`ガラガラ…！${stoneName(i)}が、くずれて、雲の下へ落ちていった！`);
    for (const a of left) {
      const to = nearStone(b, i);
      if (to === null) continue;
      a.c10stone = to;
      post(ev).push(`${a.name}は、あわてて、${stoneName(to)}へとびうつった！`);
    }
    ev.c10kCrack = { stone: i, moved: left.map((a) => a.id) };
  }
  // くずれた 石に 立って いる 人（たおれて いた 人が 生き返った など）も となりへ
  for (const a of b.allies) if (a.alive && S[a.c10stone]?.broken > 0) a.c10stone = nearStone(b, a.c10stone) ?? a.c10stone;
  ev.c10kBolt = { id: c.id, stones: lit, dazzled };
  ev.upd.push(c, ...b.allies.filter((x) => x.alive));
}
// となりの 石（くずれて いない。まん中からは 人の 少ない 方）
function nearStone(b, i) {
  const S = b.c10c.stones;
  const ok = (j) => j >= 0 && j < STONES && j !== i && !(S[j].broken > 0);
  const cand = (i === 1 ? [0, 2] : [1, i === 0 ? 2 : 0]).filter(ok);
  if (!cand.length) return null;
  if (i === 1) cand.sort((x, y) => onStone(b, x).length - onStone(b, y).length);
  return cand[0];
}
function why(b, c, ev) {
  const k = c.c10k;
  ev.lines.push(`${c.name}は、石ばんを、ぶんぶんふっている…（休んでいる！）`);
  if (k) k.weakEnd = true;
  ev.c10kWhy = { id: c.id };
  ev.upd.push(c);
}
// 光を 食べる
// よい 効果の 数（強く なる 効果・リジェネ・力ため）
export function goodOf(a) {
  let n = Object.values(a.buffs || {}).filter(Boolean).length;
  if (a.regen) n++;
  if (a.charge > 1) n++;
  return n;
}
function eat(b, c, ev) {
  const st = b.c10c;
  const k = c.c10y;
  const cf = c10cConf(C10C_ALGOL, b);
  let n = 0;
  const who = [];
  for (const a of b.aliveAllies()) {
    const g = goodOf(a);
    if (!g) continue;
    n += g;
    who.push(a);
    a.buffs = {};
    a.regen = null;
    a.charge = 1;
  }
  st.eats++;
  ev.fx = { type: 'ability', anim: 'c10y_eat', actor: c.id, targets: who.map((x) => x.id), side: 'enemy' };
  if (!n) {
    ev.lines.push(`${c.name}「…食べる光が、ない。」`, '（強くなる技を、使っていなかった！アルゴルは、何も食べられなかった！）');
    ev.c10yEat = { id: c.id, n: 0, heal: 0 };
    ev.upd.push(c);
    return;
  }
  st.eaten += n;
  const heal = Math.min(c.maxHp - c.hp, Math.round(c.maxHp * cf.eat.heal * n));
  c.hp += heal;
  st.healed += heal;
  k.power = Math.min(cf.eat.atkMax, k.power + cf.eat.atkUp * n);
  c.dmgRate = k.atk0 * k.power;
  (ev.results = ev.results || []).push({ id: c.id, heal });
  ev.lines.push(`${c.name}は、${who.map((x) => x.name).join('・')}の光を、すうっと、すいこんだ！（よい効果が、${n}こ消えた）`);
  post(ev).push(`${c.name}のHPが${heal}回復した！${c.name}の力が、強くなった…！`);
  ev.c10yEat = { id: c.id, n, heal };
  ev.warn = true;
  ev.upd.push(c, ...who);
}
function veil(b, c, ev) {
  const st = b.c10c;
  const k = c.c10y;
  const cf = c10cConf(C10C_ALGOL, b);
  k.veil = cf.veil.turns;
  st.veils++;
  ev.fx = { type: 'ability', anim: 'c10y_veil', actor: c.id, targets: b.aliveAllies().map((x) => x.id), side: 'enemy' };
  post(ev).push('（暗くて、こうげきが半分しか通らない…！スピカの「てらす」なら、はらえるかも…！）');
  ev.c10yVeil = { id: c.id, turns: k.veil };
  ev.warn = true;
  ev.upd.push(c);
}
function blast(b, c, ev) {
  const st = b.c10c;
  const k = c.c10y;
  const cf = c10cConf(C10C_ALGOL, b);
  k.ringReady = false;
  st.blasts++;
  const targets = b.aliveAllies();
  ev.fx = { type: 'ability', anim: 'c10y_blast', actor: c.id, targets: targets.map((x) => x.id), side: 'enemy' };
  let guarded = 0;
  for (const t of targets) {
    if (t.defending) guarded++;
    b.physHit(c, t, { mult: cf.ring.mult * (t.defending ? cf.ring.guardCut : 1), acc: 9 }, ev, 'phys');
  }
  st.blastGuards += guarded;
  if (guarded) ev.lines.push(guarded === targets.length ? 'みんな、身を守って、こらえた！' : '身を守った人は、こらえた！');
  ev.c10yBlast = { id: c.id, guarded };
  ev.warn = true;
  ev.upd.push(c);
}

// ───────────── ダメージ（battle-c9b.js の c9bDamage の さいご。味方 → 敵）─────────────
export function c10cDamage(b, c, t, dmg, info, ev) {
  const st = b.c10c;
  if (!(dmg > 0) || !st || st.won || c?.side !== 'ally' || t?.side !== 'enemy') return dmg;
  const who = b.get(c.id) || c;
  if (st.kind === 'colonel') {
    // せまい（同じ 石に 3人 いじょう）: 与える ダメージ 半分
    if (tightOf(b, who)) {
      const cf = c10cConf(C10C_COLONEL, b);
      dmg = Math.max(1, Math.round(dmg * cf.tightK));
      st.tightHits++;
      if (ev && !ev.c10kTight) {
        ev.c10kTight = { id: who.id };
        post(ev).push(`（${stoneName(who.c10stone)}がせまくて、うまく動けない…！ダメージが半分になった）`);
      }
    }
    if (t.id !== st.id || !t.c10k) return dmg;
    if (t.c10k.weak) dmg = Math.round(dmg * c10cConf(C10C_COLONEL, b).miss.taken);
    if (dmg >= t.hp) {
      dmg = Math.max(0, t.hp - 1);
      bossDown(b, t, ev);
    }
    return dmg;
  }
  // アルゴル: やみの とばり（与える ダメージ 半分）
  const m = algolOf(b);
  const cf = c10cConf(C10C_ALGOL, b);
  if (m?.c10y?.veil > 0) {
    dmg = Math.max(1, Math.round(dmg * cf.veil.k));
    if (ev && !ev.c10yVeilHit) {
      ev.c10yVeilHit = true;
      post(ev).push('（やみのとばりで、こうげきが半分しか通らない…）');
    }
  }
  if (t.id !== st.id || !t.c10y) return dmg;
  // HPが 3わりに なると 戦いが 終わる
  const floor = Math.floor(t.maxHp * cf.end);
  if (t.hp - dmg <= floor) {
    dmg = Math.max(0, t.hp - floor);
    bossDown(b, t, ev);
  }
  return dmg;
}
function bossDown(b, c, ev) {
  const st = b.c10c;
  st.won = true;
  c.telegraph = null;
  b.killed.push(c.species);
  if (st.kind === 'colonel') {
    c.c10k.down = true;
    for (const s of st.stones) { s.lit = false; s.crack = false; }
    st.crackAim = null;
    if (ev) {
      post(ev).push(
        `${c.name}の石ばんが、ぷすん…と、光らなくなった。`,
        `${c.name}「…ば、ばかな。この私が、こんな子どもたちに…。」`,
        `${c.name}は、ぼうしをおさえて、しょんぼりと、すわりこんだ。`,
      );
    }
  } else {
    const k = c.c10y;
    k.down = true;
    k.ringReady = false;
    k.veil = 0;
    if (ev) {
      post(ev).push(
        `${c.name}は、ふらりとよろけて、ひざをついた…。`,
        `${c.name}「…ここまで、か。」`,
        `${c.name}の手の中で、むらさきの音が、ちいさくふるえている…。`,
      );
    }
  }
  if (ev) {
    ev.c10cDown = { id: c.id, kind: st.kind };
    ev.upd.push(c);
  }
  b.pendingEnd = { outcome: 'win' };
  b.queue = [];
}

// ───────────── オート（battle-c9b.js の c9bPlan の はじめ）─────────────
// ボスの 戦いで なければ undefined。ふつうの オートは null
export function c10cPlan(b, c, decide, bestHit) {
  const st = b.c10c;
  if (!st) return undefined;
  if (c.side !== 'ally' || b.c9Inner || c.status?.rift || st.won) return null;
  const m = c10cBoss(b);
  if (!m?.alive) return null;
  const mode = c.knows9 ?? b.knowsCh9;
  return st.kind === 'colonel' ? colonelPlan(b, c, m, mode, decide, bestHit) : algolPlan(b, c, m, mode, decide, bestHit);
}
const queued = (b, id) => b.queue.some((q) => q.cmd?.id === id);
const moveCmd = (b, c) => {
  const to = bestStone(b, c);
  return to === null ? null : { type: 'ability', id: UTSURU, choice: to };
};
function colonelPlan(b, c, m, mode, decide, bestHit) {
  const st = b.c10c;
  const danger = onLit(b, c) && !st.dazzle;
  const canMove = canUse(b, c, UTSURU);
  if (mode !== 'know' && mode !== 'blind') {
    // 自動の 仲間: 光った 石に いる 番の 3回に 1回 うつる（数は 自動の 仲間 みんなで 1つ）。人が えらんで いる 時だけ
    if (c.kind === 'player' || !danger || !canMove || !someoneChooses(b)) return null;
    b.c10cAuto = (b.c10cAuto || 0) + 1;
    return b.c10cAuto % AUTO_EVERY ? null : moveCmd(b, c);
  }
  if (mode === 'blind') {
    if (danger && canMove && b.rng.chance(0.15)) return moveCmd(b, c);
    return null;
  }
  // 知って いる 人: 光った 石に いる … てらす（2人 いじょう 光った 石に いて、たまって いれば）か うつる・
  //   光って いない 時に せまい … 人の 少ない 石へ・ほかは ふつう（雷が 外れて 休んで いる 間も ふつうに たたく）
  //   （光った 石に いる 時は、回復より 先に にげる）
  const cmd = base(b, c, decide);
  const a = cmd?.type === 'ability' ? ABILITIES[cmd.id] : null;
  if (danger) {
    const onLitN = b.aliveAllies().filter((x) => onLit(b, x)).length;
    if (onLitN >= 2 && teruReady(b) && canUse(b, c, TERU) && !queued(b, TERU)) return { type: 'ability', id: TERU };
    if (queued(b, TERU)) return cmd;
    return (canMove && moveCmd(b, c)) || (c.defending ? cmd : { type: 'defend' });
  }
  if (a && ['heal', 'revive', 'reviveAll'].includes(prim(a).type) && b.allies.some((x) => !x.fled && (!x.alive || x.hp / x.maxHp < 0.35))) return cmd;
  if (!litStones(b).length && tightOf(b, c) && canMove) {
    const to = bestStone(b, c);
    if (to !== null && onStone(b, to).length + 1 < c10cConf(C10C_COLONEL, b).tight) return { type: 'ability', id: UTSURU, choice: to };
  }
  void bestHit;
  return cmd;
}
// 味方を 強く する 技か（よい 効果を つける）
export function buffCmd(cmd) {
  if (!cmd) return false;
  if (cmd.type === 'dual') return DUAL_TECHS[cmd.id]?.target === 'allies' || DUAL_TECHS[cmd.id]?.target === 'ally';
  if (cmd.type !== 'ability') return false;
  const a = ABILITIES[cmd.id];
  if (!a || !['ally', 'allies', 'self'].includes(a.target)) return false;
  return parts(a).some((e) => ['buff', 'regen', 'charge'].includes(e.type));
}
function algolPlan(b, c, m, mode, decide, bestHit) {
  const k = m.c10y;
  const canSong = songReady(b) && canUse(b, c, SONG) && !queued(b, SONG);
  const canTeru = teruReady(b) && canUse(b, c, TERU) && !queued(b, TERU);
  if (mode !== 'know' && mode !== 'blind') {
    // 自動の 仲間: 人が えらんで いる 時は、強く する 技を ひかえる
    if (c.kind === 'player' || !someoneChooses(b)) return null;
    const cmd = base(b, c, decide);
    if (buffCmd(cmd)) return bestHit(b, c, m) || { type: 'attack', target: m.id };
    return cmd;
  }
  if (mode === 'blind') {
    if (k.ringReady && !c.defending && b.rng.chance(0.15)) return { type: 'defend' };
    if (k.ringReady && canSong && b.rng.chance(0.1)) return { type: 'ability', id: SONG };
    if (k.veil > 0 && canTeru && b.rng.chance(0.15)) return { type: 'ability', id: TERU };
    return null;
  }
  // 知って いる 人: 前ぶれ … 星のうた（たまって いれば 1人）か 防御・とばり … てらす・ふだんは 強く する 技を 使わない
  if (k.ringReady) {
    if (canSong) return { type: 'ability', id: SONG };
    if (!queued(b, SONG) && !c.defending) return { type: 'defend' };
  }
  if (k.veil > 0 && canTeru) return { type: 'ability', id: TERU };
  const cmd = base(b, c, decide);
  const a = cmd?.type === 'ability' ? ABILITIES[cmd.id] : null;
  if (a && ['heal', 'revive', 'reviveAll'].includes(prim(a).type) && b.allies.some((x) => !x.fled && (!x.alive || x.hp / x.maxHp < 0.4))) return cmd;
  if (buffCmd(cmd)) return bestHit(b, c, m) || { type: 'attack', target: m.id };
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
// しくみの 用が ある 間（シミュレーターの 知って いる 人は 合体技を しない）
export function c10cBusy(b) {
  const st = b.c10c;
  if (!st || st.won) return false;
  return !!c10cTell(b);
}

// ───────────── がめんへ（battle-c9b.js の c9bPub から。敵）─────────────
// たいさ: c10Kind 'colonel'・stones（[{ lit, broken, crack }] 左から）・dazzle（まぶしい … 次の 雷は 外れる）・rest（な、なぜだ … 休んで いる・1.5倍）・
//   half（HP 半分 … 光る 石が 2つ）・colonelStage（曲の もりあがり 1 ふつう・2 雷の 前ぶれ・3 HP 半分・4 勝った）・c10Down
// アルゴル: c10Kind 'algol'・eatLeft・eatEvery（光を 食べるまで）・veil（やみの とばりの のこり）・ring（星の音の 前ぶれ）・still（動けない）・
//   power（攻撃の 上がり）・endAt（戦いが 終わる HPの わりあい）・algolStage（1 ふつう・2 とばり・3 星の音の 前ぶれ・4 勝った）・c10Down
export function c10cPub(c, b = c?._b10c) {
  const o = {};
  const st = b?.c10c;
  if (!st || c.id !== st.id) return o;
  if (st.kind === 'colonel' && c.c10k) {
    o.c10Kind = 'colonel';
    o.stones = st.stones.map((s) => ({ lit: s.lit ? 1 : 0, broken: s.broken > 0 ? 1 : 0, crack: s.crack ? 1 : 0 }));
    o.dazzle = st.dazzle ? 1 : 0;
    o.rest = c.c10k.weak ? 1 : 0;
    o.half = c.hp <= c.maxHp * 0.5 ? 1 : 0;
    o.c10Down = st.won ? 1 : 0;
    o.colonelStage = st.won ? 4 : st.stones.some((s) => s.lit) ? 2 : o.half ? 3 : 1;
    return o;
  }
  if (st.kind === 'algol' && c.c10y) {
    const cf = c10cConf(C10C_ALGOL, b);
    const k = c.c10y;
    o.c10Kind = 'algol';
    o.eatLeft = Math.max(0, k.eatLeft);
    o.eatEvery = cf.eat.every;
    o.veil = k.veil > 0 ? k.veil : 0;
    o.ring = k.ringReady ? 1 : 0;
    o.still = k.stun || c.telegraph === STILL ? 1 : 0;
    o.power = Math.round(k.power * 100) / 100;
    o.endAt = cf.end;
    o.c10Down = st.won ? 1 : 0;
    o.algolStage = st.won ? 4 : k.ringReady ? 3 : k.veil > 0 ? 2 : 1;
  }
  return o;
}
// 味方（battle-c9a.js の c9aPub から）: stone10（立って いる 石 0〜2）・tight10（せまい）・good10（よい 効果の 数。アルゴルの 戦い）
export function c10cAllyPub(c, b = c?._b10c) {
  const o = {};
  const st = b?.c10c;
  if (!st) return o;
  if (st.kind === 'colonel' && stoneOf(c) !== null) {
    o.stone10 = c.c10stone;
    o.tight10 = tightOf(b, c) ? 1 : 0;
  }
  return o;
}
void COLONEL_NAME;
void ALGOL_NAME;
