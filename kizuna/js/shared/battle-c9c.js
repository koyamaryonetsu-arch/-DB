// 第3部 第1章 第3幕「さかさのピラミッド」の 戦いの しかけ（battle-c9b.js から 短い よびだしで よぶ。ほかの たたかいは かわらない）
// docs/plan-part3.md の 11-4
//
// ・中ボス「なぞの番人 ナゾカケ」（monsters-c9c.js の c9c.kind 'riddle'）… さかさ言葉
//   every 回 動く ごとに なぞを 1つ 出す（m9z_riddle）。画面の 上に 出つづける（pub の zRiddle）
//   なぞが 出て いる 間は「なぞの守り」（受ける ダメージ guard ばい）・ゆっくり 動く（tmul ＝ slow。小さい 子が 読んで 答える 間）
//   「こたえる」（m9_kotae。だれでも。その 人の 番を 使う。cmd.choice … 0〜2）:
//     正かい → 守りが 消え、ナゾカケは 1回 休む（m9z_rest「うーむ、せいかい」）。つぎの なぞは every 回 あと
//     はずれ → 答えた 人が wrong 回「さかさま」（こんらん）。なぞは のこる
//   なぞが 出てから limit 回 動いても 答えが ないと「時間切れ」（m9z_timeout。全体に 中くらいの ダメージ ＋ つぎの なぞ）
//   HPが hard（半分）を 切ると むずかしい なぞ（5文字 いじょうの 言葉・なぞなぞ）。1回の 戦いで 同じ なぞは 出ない
// ・幕の ボス「ヒックリカエール2号」（c9c.kind 'sand'）… 砂が 落ちきる 前に、ひっくり返す
//   砂の めもり（sand つぶ）。メカが 動く たびに drop つぶ 落ちる（HPが addAt を 切ると「砂を 足す」で 2つぶずつ）
//   0 に なると「砂が、落ちきった！」（m9s_empty。前ぶれ）→ つぎの 番に 大ばくはつ（m9s_boom。全体。身を 守ると guardCut ばい）→ めもりは もどる
//   「ひっくり返す」（m9_hikkuri。だれでも。その 人の 番を 使う）: めもりが もどる。
//     dizzyAt つぶ いか → 目が回る（つぎの メカの 番は 休み〈m9s_dizzy〉・その あとの 番が 来るまで 受ける ダメージ dizzyMult ばい）
//     それより 多い → 「まだ早い！」（休まない。ひっくり返した 人に 反げき）
//   ときどき「ポチッとね」（pochi.every 回 ごとに 前ぶれ・ねらいの 人 → つぎの 番に 1人に 大きな ダメージ）
//   勝つと メカは 自分で ひっくり返って 止まる。3人組は にげる
// ・自動の 仲間（酒場の 人）は、なぞ 3つの うち 1つに 正しく 答える・砂が 少なく なる 3回の うち 1回 ひっくり返す（AUTO_EVERY。番ごとでは なく できごとごと）
//   家族の キャラの「オート」と 魔物の 仲間は しない（完全オートは 勝てない まま）
// ・人数で 合わせる（few・solo・monK）は 第2幕の 大王と おなじ 数え方（battle-c9b.js の kingPeople。魔物の 仲間は 半人ぶん）
import { MONSTERS } from './data/monsters.js?v=93a310251ce7';
import { ABILITIES } from './data/abilities.js?v=93a310251ce7';
import { ANSWER, FLIP } from './data/abilities-c9c.js?v=93a310251ce7';
import { EASY, HARD, riddleText, answerText } from './data/riddles-c9c.js?v=93a310251ce7';
import { C9C_NAZOKAKE, C9C_HIKKURI } from './data/monsters-c9c.js?v=93a310251ce7';

export { ANSWER, FLIP };
export const RIDDLE = 'm9z_riddle';
export const TIMEOUT = 'm9z_timeout';
export const ZREST = 'm9z_rest';
export const EMPTY = 'm9s_empty';
export const BOOM = 'm9s_boom';
export const DIZZY = 'm9s_dizzy';
export const ADD = 'm9s_add';
export const POCHIUP = 'm9s_pochiup';
export const POCHI = 'm9s_pochi';
export const AUTO_EVERY = 3;
export const TRIO9C = { boss: 'キラジョ', mecha: 'ボヤッチ', power: 'ズラッカ', catch: 'ポチッとね' };

const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || {} : a?.effect || {});
const post = (ev) => (ev.postLines = ev.postLines || []);
const confOf = (m) => MONSTERS[m?.species]?.c9c || null;

// 人数（家族の キャラ ＝ kind 'player' の 数。魔物の 仲間は 半人ぶん。1〜5。battle-c9b.js の kingPeople と おなじ）
export function peopleOf9c(b) {
  if (b?.c9cPeople) return b.c9cPeople;
  const al = b?.allies || [];
  const p = al.filter((a) => a.kind === 'player').length;
  const n = p ? Math.floor(p + al.filter((a) => a.kind === 'monster').length * 0.5) : 0;
  return Math.max(1, Math.min(5, n || 4));
}
const few = (arr, b, d) => (Array.isArray(arr) ? arr[peopleOf9c(b) - 1] ?? d : d);
// 人数で 合わせた 数（仲間なしの ひとりは solo を 先に）
function picker(c, b) {
  const f = c.few || {};
  const alone = b && b.allies.length === 1 ? c.solo || {} : {};
  return (k, d) => (alone[k] ?? (b ? few(f[k], b, d) : d));
}
function monMul(c, b) {
  const mons = b && (b.allies || []).some((a) => a.kind === 'player') ? b.allies.filter((a) => a.kind === 'monster').length : 0;
  return { hp: 1 + (c.monK?.hp || 0) * mons, atk: 1 + (c.monK?.atk || 0) * mons };
}
export function riddleConf(m, b = null) {
  const c = confOf(m) || {};
  const pick = picker(c, b);
  const mm = monMul(c, b);
  return {
    every: c.every ?? 3, limit: pick('limit', c.limit ?? 2), guard: c.guard ?? 0.3, wrong: c.wrong ?? 2, timeout: { mult: 0.95, ...(c.timeout || {}) }, timeoutK: pick('timeoutK', 1),
    hard: c.hard ?? 0.5, slow: c.slow ?? 0.5, hp: pick('hp', 1) * mm.hp, atk: pick('atk', 1) * mm.atk,
  };
}
export function sandConf(m, b = null) {
  const c = confOf(m) || {};
  const pick = picker(c, b);
  const mm = monMul(c, b);
  return {
    sand: c.sand ?? 6, dizzyAt: c.dizzyAt ?? 2, dizzyMult: c.dizzyMult ?? 1.5, boom: { mult: 1.75, guardCut: 0.45, ...(c.boom || {}) },
    boomK: pick('boom', 1), counter: { mult: 1.5, ...(c.counter || {}) }, addAt: c.addAt ?? 0.5, pochi: { every: 5, mult: 2.2, ...(c.pochi || {}) },
    hp: pick('hp', 1) * mm.hp, atk: pick('atk', 1) * mm.atk,
  };
}
export const nazoOf = (b) => (b.c9nazo ? b.get(b.c9nazo.id) : null);
export const mechaOf9c = (b) => (b.c9sand ? b.get(b.c9sand.id) : null);
// 今の なぞ（なければ null）
export const riddleNow = (b) => nazoOf(b)?.c9z?.riddle || null;
// 砂の めもり（メカが なければ null）
export const sandNow = (b) => (mechaOf9c(b)?.c9s ? mechaOf9c(b).c9s.grains : null);

// ───────────── はじめ（battle-c9b.js の setupC9b から）─────────────
// かえす 値: スピカを 出すか（ナゾカケ・ヒックリカエール2号の 戦いは かならず）
export function setupC9c(b, lines) {
  let on = false;
  for (const e of b.enemies) {
    const conf = confOf(e);
    if (!conf) continue;
    Object.defineProperty(e, '_b9', { value: b, enumerable: false, configurable: true, writable: true });
    if (conf.kind === 'riddle') {
      setupRiddle(b, e, lines);
      on = true;
    } else if (conf.kind === 'sand') {
      setupSand(b, e, lines);
      on = true;
    }
  }
  return on;
}

function scale(m, hp, atk) {
  if (hp !== 1) m.maxHp = m.hp = Math.max(1, Math.round(m.maxHp * hp));
  if (atk !== 1) m.atk = Math.max(1, Math.round(m.atk * atk));
}

function setupRiddle(b, m, lines) {
  const rc = riddleConf(m, b);
  scale(m, rc.hp, rc.atk);
  m.c9z = { acts: 0, left: rc.every, riddle: null, age: 0, used: [], rest: 0, asks: 0, rights: 0, wrongs: 0, timeouts: 0, answers: 0 };
  b.c9nazo = { id: m.id };
  for (const a of b.allies) if (!a.abilities.includes(ANSWER)) a.abilities = [ANSWER, ...a.abilities];
  lines.push(
    `${m.name}「…ここを通りたくば、わがなぞに答えよ。」`,
    `${m.name}「答えられぬ者は、通さぬ。」`,
    '（なぞが出たら「こたえる」で答えよう！正かいすると、守りが消える…！）',
  );
}

function setupSand(b, m, lines) {
  const sc = sandConf(m, b);
  scale(m, sc.hp, sc.atk);
  m.c9s = {
    acts: 0, grains: sc.sand, max: sc.sand, drop: 1, added: false, boomReady: false, dizzy: 0, pochiLeft: sc.pochi.every, pochiAim: null,
    booms: 0, flips: 0, dizzies: 0, early: 0, pochis: 0, guards: 0, atk0: m.atk,
  };
  b.c9sand = { id: m.id };
  for (const a of b.allies) if (!a.abilities.includes(FLIP)) a.abilities = [FLIP, ...a.abilities];
  lines.push(
    `${TRIO9C.boss}「オーッホッホ！星の音は、あたしたちホシドロ一味がいただくわ！」`,
    `${TRIO9C.mecha}「すなどけいメカ、${m.name}でございマス！」`,
    `${TRIO9C.power}「砂が落ちきったら、ドッカーンだっぺ！」`,
    '（砂が落ちきる前に「ひっくり返す」！砂が少なくなるまで待つと、目を回すかも…！）',
  );
}

// ───────────── 行動の はじめ（battle-c9b.js の c9bTurnStart の あと。敵の 番だけ）─────────────
export function c9cTurnStart(b, c, ev, stuck) {
  if (c.side === 'ally') return;
  if (c.c9z) riddleTurn(b, c, ev, stuck);
  else if (c.c9s) sandTurn(b, c, ev, stuck);
}

function riddleTurn(b, c, ev, stuck) {
  const z = c.c9z;
  const rc = riddleConf(c, b);
  if (c.telegraph) return;
  z.acts++;
  ev.upd.push(c);
  if (stuck) return;
  if (z.rest > 0) {
    z.rest--;
    c.telegraph = ZREST;
    return;
  }
  if (z.riddle) {
    z.age++;
    if (z.age >= rc.limit) {
      c.telegraph = TIMEOUT;
      return;
    }
    ev.c9zLeft = { id: c.id, left: rc.limit - z.age };
    ev.lines.push(`（なぞの時間切れまで、あと${rc.limit - z.age}回…！「こたえる」で答えよう！）`);
    return;
  }
  z.left--;
  if (z.left <= 0) c.telegraph = RIDDLE;
}

// なぞを えらぶ（むずかしい 方は HPが 半分を 切ってから。同じ 物は 出ない。なくなったら はじめから）
export function pickRiddle(b, c) {
  const z = c.c9z;
  const rc = riddleConf(c, b);
  const hard = c.hp <= c.maxHp * rc.hard;
  let pool = (hard ? HARD : EASY).filter((r) => !z.used.includes(r.id));
  if (!pool.length) pool = (hard ? HARD : EASY).filter((r) => r.id !== z.used[z.used.length - 1]);
  const r = pool[b.rng.int(0, pool.length - 1)];
  z.used.push(r.id);
  const choices = [r.a, ...r.no];
  for (let i = choices.length - 1; i > 0; i--) {
    const j = b.rng.int(0, i);
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return { id: r.id, type: r.type, text: riddleText(r), choices, correct: choices.indexOf(r.a), answer: answerText(r), hard };
}

function askRiddle(b, c, ev) {
  const z = c.c9z;
  const rc = riddleConf(c, b);
  z.riddle = pickRiddle(b, c);
  z.age = 0;
  z.asks++;
  z.left = rc.every;
  // なぞが 出て いる 間は ゆっくり（小さい 子が 読んで 答える 間）
  c.tmul = rc.slow;
  ev.lines.push(`${c.name}「${z.riddle.text}」`, `（「こたえる」で、答えをえらぼう！）`);
  if (z.riddle.hard && !z.hardSaid) {
    z.hardSaid = true;
    ev.lines.push(`${c.name}「…ここからは、むずかしいぞ。」`);
  }
  ev.c9zRiddle = { id: c.id, text: z.riddle.text, choices: z.riddle.choices.slice(), hard: z.riddle.hard };
  ev.warn = true;
  ev.upd.push(c);
}
function clearRiddle(c) {
  const z = c.c9z;
  z.riddle = null;
  z.age = 0;
  delete c.tmul;
}

// ───────────── 技の こうか（battle-c9b.js の c9bEffect の のこり）─────────────
export function c9cEffect(b, c, a, eff, ev) {
  switch (eff.type) {
    case 'c9zRiddle': {
      if (c.c9z) askRiddle(b, c, ev);
      return true;
    }
    case 'c9zTimeout': timeout(b, c, ev); return true;
    case 'c9zRest': {
      ev.lines.push(`${c.name}は、天じょうで、目をとじて考えこんでいる…`);
      ev.c9zRest = { id: c.id };
      return true;
    }
    case 'c9zAnswer': answer(b, c, ev); return true;
    case 'c9sEmpty': empty(b, c, ev); return true;
    case 'c9sBoom': boom(b, c, ev); return true;
    case 'c9sDizzy': {
      ev.lines.push(`${TRIO9C.mecha}「ぐ、ぐるぐるでございマス〜」`, `${TRIO9C.power}「あたまが、さかさだっぺ〜」`, `${c.name}は、目を回して動けない！`);
      ev.c9sDizzy = { id: c.id };
      return true;
    }
    case 'c9sAdd': addSand(b, c, ev); return true;
    case 'c9sPochiUp': pochiUp(b, c, ev); return true;
    case 'c9sPochi': pochi(b, c, ev); return true;
    case 'c9sFlip': flip(b, c, ev); return true;
    default: return false;
  }
}

function timeout(b, c, ev) {
  const z = c.c9z;
  if (!z) return;
  const rc = riddleConf(c, b);
  z.timeouts++;
  const ans = z.riddle?.answer || '';
  const targets = b.aliveAllies();
  ev.fx = { type: 'ability', anim: 'c9z_timeout', actor: c.id, targets: targets.map((x) => x.id), side: 'enemy' };
  if (ans) ev.lines.push(`${c.name}「答えは『${ans}』だ。」`);
  ev.lines.push('天じょうから、石の雨がふってきた！');
  for (const t of targets) b.physHit(c, t, { mult: rc.timeout.mult * rc.timeoutK, acc: 9 }, ev, 'phys');
  ev.c9zTimeout = { id: c.id, answer: ans };
  clearRiddle(c);
  // つぎの なぞ（すぐ）
  if (!b.pendingEnd) askRiddle(b, c, ev);
}

function answer(b, c, ev) {
  const n = nazoOf(b);
  const z = n?.c9z;
  const choice = b.curCmd?.choice;
  if (!n?.alive || !z) {
    ev.lines.push('しかし、何も起こらなかった。');
    return;
  }
  if (!z.riddle) {
    ev.lines.push('しかし、なぞは、まだ出ていない。');
    return;
  }
  const r = z.riddle;
  const i = Number.isInteger(choice) && choice >= 0 && choice < r.choices.length ? choice : -1;
  const said = i >= 0 ? r.choices[i] : '…';
  z.answers++;
  ev.lines.push(`${c.name}「答えは…『${said}』！」`);
  const fxOut = { by: c.id, choice: i, said, ok: i === r.correct };
  if (i === r.correct) {
    z.rights++;
    clearRiddle(n);
    z.rest = 1;
    z.left = riddleConf(n, b).every;
    if (n.telegraph === TIMEOUT) n.telegraph = null;
    ev.lines.push(`${n.name}「…むむっ。」`, 'なぞの守りが、消えた！今のうちだ！');
    ev.fx = { type: 'ability', anim: 'c9c_answer', actor: c.id, targets: [c.id], side: 'ally' };
  } else {
    z.wrongs++;
    const rc = riddleConf(n, b);
    // さかさま（こんらん。turns は 1つ 多め … 自分の 番の はじめに 1つ へる。battle.js の こんらん）
    c.status.confuse = { turns: rc.wrong + 1 };
    ev.lines.push(`${n.name}「…ちがう。」`, `${c.name}は、頭の中が、さかさまになった！`);
    ev.fx = { type: 'ability', anim: 'c9z_wrong', actor: c.id, targets: [c.id], side: 'ally' };
    ev.upd.push(c);
  }
  ev.c9zAnswer = fxOut;
  ev.upd.push(n);
}

// ── 砂の めもり ──
function sandTurn(b, c, ev, stuck) {
  const s = c.c9s;
  const sc = sandConf(c, b);
  if (c.telegraph) return;
  s.acts++;
  ev.upd.push(c);
  // 目が回って いる（1つめの 番は 休み・2つめの 番の はじめで もどる）
  if (s.dizzy > 0) {
    s.dizzy--;
    if (s.dizzy > 0) {
      c.telegraph = DIZZY;
      return;
    }
    ev.lines.push(`${c.name}の、目が回るのが、おさまった。`);
  }
  if (stuck) return;
  if (s.boomReady) {
    c.telegraph = BOOM;
    return;
  }
  if (!s.added && c.hp <= c.maxHp * sc.addAt) {
    c.telegraph = ADD;
    return;
  }
  if (s.pochiAim) {
    c.telegraph = POCHI;
    dropSand(b, c, ev);
    return;
  }
  if (dropSand(b, c, ev)) {
    c.telegraph = EMPTY;
    return;
  }
  s.pochiLeft--;
  if (s.pochiLeft <= 0) c.telegraph = POCHIUP;
}
// 砂が 落ちる。0 に なったら true
function dropSand(b, c, ev) {
  const s = c.c9s;
  const was = s.grains;
  s.grains = Math.max(0, s.grains - s.drop);
  // 砂が 少なく なった 回数（自動の 仲間の 3回に 1回）
  const at = sandConf(c, b).dizzyAt;
  if (was > at && s.grains <= at) s.lows = (s.lows || 0) + 1;
  ev.c9sSand = { id: c.id, grains: s.grains, max: s.max };
  return s.grains <= 0;
}
function resetSand(c) {
  const s = c.c9s;
  s.grains = s.max;
  s.boomReady = false;
}

function empty(b, c, ev) {
  const s = c.c9s;
  if (!s) return;
  s.boomReady = true;
  s.grains = 0;
  ev.lines.push('砂が、落ちきった！', `${TRIO9C.boss}「うそっ！もう！？」`, '（次に、メカが大ばくはつする…！「ひっくり返す」か「防御」で、そなえよう！）');
  ev.c9sEmpty = { id: c.id };
  ev.warn = true;
}

function boom(b, c, ev) {
  const s = c.c9s;
  if (!s) return;
  const sc = sandConf(c, b);
  s.booms++;
  const targets = b.aliveAllies();
  ev.fx = { type: 'ability', anim: 'c9s_boom', actor: c.id, targets: targets.map((x) => x.id), side: 'enemy' };
  let guarded = 0;
  for (const t of targets) {
    if (t.defending) guarded++;
    b.physHit(c, t, { mult: sc.boom.mult * sc.boomK * (t.defending ? sc.boom.guardCut : 1), acc: 9 }, ev, 'phys');
  }
  s.guards += guarded;
  if (guarded) ev.lines.push(guarded === targets.length ? 'みんな、身を守って、こらえた！' : '身を守った人は、こらえた！');
  ev.lines.push(`${TRIO9C.power}「ま、まだまだだっぺ…！」`, `${TRIO9C.mecha}「砂を、上にもどしたでございマス！」`);
  resetSand(c);
  ev.c9sBoom = { id: c.id, guarded };
  ev.c9sSand = { id: c.id, grains: s.grains, max: s.max };
  ev.warn = true;
}

function addSand(b, c, ev) {
  const s = c.c9s;
  if (!s) return;
  s.added = true;
  s.drop = 2;
  ev.lines.push(`${TRIO9C.mecha}「砂を足したでございマス！」`, '砂が、ザザーッと、いきおいよく落ちはじめた！', '（砂が、1回に2つぶずつ落ちるようになった！）');
  ev.c9sAdd = { id: c.id };
  ev.warn = true;
}

function pochiUp(b, c, ev) {
  const s = c.c9s;
  if (!s) return;
  const sc = sandConf(c, b);
  const pool = b.aliveAllies();
  const t = pool[b.rng.int(0, pool.length - 1)];
  s.pochiLeft = sc.pochi.every;
  if (!t) return;
  s.pochiAim = t.id;
  ev.lines.push(`メカの赤いボタンが、${t.name}の方を向いた…！`, `（ねらいは${t.name}…！「防御」で身を守ろう！）`);
  ev.c9sPochiUp = { id: c.id, aim: t.id };
  ev.warn = true;
}

function pochi(b, c, ev) {
  const s = c.c9s;
  if (!s) return;
  const sc = sandConf(c, b);
  const t = b.get(s.pochiAim);
  s.pochiAim = null;
  s.pochis++;
  const tg = t?.alive ? t : b.aliveAllies()[0];
  if (!tg) return;
  ev.fx = { type: 'ability', anim: 'c9s_pochi', actor: c.id, targets: [tg.id], side: 'enemy' };
  ev.lines.push('メカから、大きなパンチが、ビョーンと飛び出した！');
  b.physHit(c, tg, { mult: sc.pochi.mult, acc: 9 }, ev, 'phys');
  ev.c9sPochi = { id: c.id, to: tg.id };
}

// ひっくり返す（だれでも。その 人の 番を 使う）
function flip(b, c, ev) {
  const m = mechaOf9c(b);
  const s = m?.c9s;
  if (!m?.alive || !s) {
    ev.lines.push('しかし、何も起こらなかった。');
    return;
  }
  const sc = sandConf(m, b);
  const was = s.grains;
  s.flips++;
  resetSand(m);
  if (m.telegraph === BOOM) m.telegraph = null;
  ev.lines.push('砂時計が、ぐるんと、ひっくり返った！');
  ev.fx = { type: 'ability', anim: 'c9c_flip', actor: c.id, targets: [m.id], side: 'ally' };
  if (was <= sc.dizzyAt) {
    s.dizzies++;
    s.dizzy = 2;
    if (m.telegraph && m.telegraph !== POCHI) m.telegraph = null;
    ev.lines.push(`${TRIO9C.boss}「きゃあああ〜っ！」`, `${TRIO9C.power}「め、目が回るだっぺ〜！」`, `${m.name}は、目を回している！今がチャンスだ！`);
    ev.c9sFlip = { by: c.id, was, dizzy: true };
  } else {
    s.early++;
    ev.lines.push(`${TRIO9C.boss}「まだ早いわよっ！」`, `${TRIO9C.power}「おかえしだっぺ！」`);
    b.physHit(m, c, { mult: sc.counter.mult, acc: 9 }, ev, 'phys');
    ev.c9sFlip = { by: c.id, was, dizzy: false };
  }
  ev.c9sSand = { id: m.id, grains: s.grains, max: s.max };
  ev.upd.push(m, c);
}

// ───────────── ダメージ（battle-c9b.js の c9bDamage の あと。味方 → 敵）─────────────
// なぞの守り（guard ばい）・目が回って いる メカ（dizzyMult ばい）
export function c9cDamage(b, c, t, dmg, info, ev) {
  if (!(dmg > 0) || c?.side !== 'ally' || !t) return dmg;
  if (t.c9z?.riddle) {
    const rc = riddleConf(t, b);
    dmg = Math.max(1, Math.round(dmg * rc.guard));
    if (ev && !ev.c9zGuard) {
      ev.c9zGuard = true;
      post(ev).push('（なぞの守りで、ダメージがへってしまう…！「こたえる」で守りを消そう！）');
    }
  } else if (t.c9s?.dizzy > 0) {
    dmg = Math.round(dmg * sandConf(t, b).dizzyMult);
    if (ev && !ev.c9sHit) {
      ev.c9sHit = true;
      post(ev).push('（目を回しているので、大ダメージ！）');
    }
  }
  return dmg;
}

// ───────────── たおれた（battle-c9b.js の c9bKill から。t.alive は まだ true）─────────────
export function c9cKill(b, t, ev) {
  if (t?.c9z && ev) {
    clearRiddle(t);
    post(ev).push(`${t.name}「…よくぞ。上へ行け。さかさの歌が、とびらを開く。」`, `${t.name}は、しずかに、天じょうの石にもどっていった…。`);
    ev.c9zDown = { id: t.id };
  }
  if (t?.c9s && ev) {
    post(ev).push(
      `${t.name}が、ぐらぐらゆれて…`,
      '自分で、ぐるんと、ひっくり返ってしまった！',
      `${TRIO9C.boss}「ちょっと${TRIO9C.mecha}！なんとかしなさいよ！」`,
      `${TRIO9C.mecha}「もう、さかさまで、むりでございマ〜ス！」`,
      `${TRIO9C.power}「にげるだっぺ〜！」`,
      'ホシドロ一味は、メカからとび出して、すたこらにげていった…',
    );
    ev.c9sDown = { id: t.id };
  }
}

// ───────────── オート（battle-c9b.js の c9bPlan の まえ）─────────────
// ナゾカケ・メカの 戦いで なければ undefined。ふつうの オート（家族の キャラ）は null
export function c9cPlan(b, c, decide, bestHit) {
  const n = nazoOf(b);
  const m = mechaOf9c(b);
  const boss = n?.c9z ? n : m?.c9s ? m : null;
  if (!boss) return undefined;
  if (c.side !== 'ally' || b.c9Inner || c.status?.rift || !boss.alive) return null;
  const mode = c.knows9 ?? b.knowsCh9;
  if (n?.c9z) return riddlePlan(b, c, n, mode, decide, bestHit);
  return sandPlan(b, c, m, mode, decide, bestHit);
}
const queued = (b, id) => b.queue.some((q) => q.cmd?.id === id);
const answerCmd = (r, ok = true, b = null) => ({ type: 'ability', id: ANSWER, choice: ok ? r.correct : wrongOf(r, b) });
function wrongOf(r, b) {
  const ws = r.choices.map((_, i) => i).filter((i) => i !== r.correct);
  return ws[b ? b.rng.int(0, ws.length - 1) : 0];
}
function riddlePlan(b, c, n, mode, decide, bestHit) {
  const z = n.c9z;
  const r = z.riddle;
  if (mode !== 'know' && mode !== 'blind') {
    // 自動の 人の 仲間（酒場の 人）: なぞが 出て いる 番の 3回に 1回 正しく 答える（家族の キャラの オート・魔物の 仲間は 答えない）
    //   第92回 第2便: 3回に 1回 ＝ なぞ 3つの うち 1つ（番ごとに 数えると 3人の 酒場の 人で ほぼ 毎回 答えて しまい、完全オートが 勝つ ため）
    if (c.kind === 'player' || c.kind === 'monster' || !r || queued(b, ANSWER)) return null;
    if (z.asks % AUTO_EVERY) return null;
    return answerCmd(r);
  }
  if (r && !queued(b, ANSWER)) {
    if (mode === 'know') return answerCmd(r);
    // 知らない 人: たまに 気づいて 答える（答えは 3つに 1つは まちがえる）
    if (b.rng.chance(0.15)) return answerCmd(r, b.rng.chance(0.67), b);
    return null;
  }
  if (mode !== 'know') return null;
  return attackBoss(b, c, n, decide);
}
function sandPlan(b, c, m, mode, decide, bestHit) {
  const s = m.c9s;
  const sc = sandConf(m, b);
  const low = s.grains <= sc.dizzyAt && !(s.dizzy > 0);
  if (mode !== 'know' && mode !== 'blind') {
    // 自動の 人の 仲間（酒場の 人）: めもりが dizzyAt いかの 番の 3回に 1回 ひっくり返す
    //   第92回 第2便: 3回に 1回 ＝ 砂が 少なく なる 3回の うち 1回（番ごとでは ない）
    if (c.kind === 'player' || c.kind === 'monster' || !low || queued(b, FLIP)) return null;
    if ((s.lows || 0) % AUTO_EVERY) return null;
    return { type: 'ability', id: FLIP };
  }
  if (mode === 'blind') {
    if (s.boomReady && !c.defending && b.rng.chance(0.15)) return { type: 'defend' };
    if (!queued(b, FLIP) && b.rng.chance(low ? 0.15 : 0.03)) return { type: 'ability', id: FLIP };
    return null;
  }
  // 知って いる 人: 砂が 少なく なったら ひっくり返す（だれかが もう えらんで いれば ほかは ふつう）
  if (low && !queued(b, FLIP)) return { type: 'ability', id: FLIP };
  // ポチッとねの ねらい: 身を 守る
  if (s.pochiAim === c.id && !c.defending) return { type: 'defend' };
  return attackBoss(b, c, m, decide);
}
function attackBoss(b, c, boss, decide) {
  b.c9Inner = true;
  let cmd;
  try {
    cmd = decide(b, c);
  } finally {
    b.c9Inner = false;
  }
  return cmd;
}
// しくみの 用が ある 間（シミュレーターの 知って いる 人は 合体技を しない）
export function c9cBusy(b) {
  const n = nazoOf(b);
  if (n?.alive && n.c9z?.riddle) return true;
  const m = mechaOf9c(b);
  const s = m?.alive ? m.c9s : null;
  if (s && ((s.grains <= sandConf(m, b).dizzyAt && !(s.dizzy > 0)) || s.pochiAim)) return true;
  return false;
}
// 第92回 第3便: 今、こたえが いる 前ぶれが 出て いるか（battle-tell.js の b.tell。battle-c9b.js の c9bTell から）
//   なぞが 出て いる・砂が dizzyAt いか〜落ちきった・ポチッとねの ねらい
export function c9cTell(b) {
  const n = nazoOf(b);
  if (n?.alive && n.c9z?.riddle) return 'riddle';
  const m = mechaOf9c(b);
  const s = m?.alive ? m.c9s : null;
  if (s) {
    if (s.boomReady || (s.grains <= sandConf(m, b).dizzyAt && !(s.dizzy > 0))) return 'sand';
    if (s.pochiAim) return 'pochi';
  }
  return null;
}
void prim; void ABILITIES; void C9C_NAZOKAKE; void C9C_HIKKURI;

// ───────────── がめんへ（battle-c9b.js の c9bPub から。敵だけ）─────────────
// ナゾカケ: zRiddle（{ text, choices, hard } … 答えの ばんごうは 出さない）・zAge・zLimit・zLeft・zEvery・zRest・zGuard・riddleStage
// メカ: sGrains・sMax・sDrop・sBoom（落ちきった）・sDizzy・sPochi（ねらいの id）・sandStage
export function c9cPub(c, b = c?._b9) {
  const o = {};
  if (c.c9z && b) {
    const z = c.c9z;
    const rc = riddleConf(c, b);
    o.zRiddle = z.riddle ? { text: z.riddle.text, choices: z.riddle.choices.slice(), hard: z.riddle.hard ? 1 : 0, type: z.riddle.type } : null;
    o.zAge = z.age;
    o.zLimit = rc.limit;
    o.zLeft = Math.max(0, z.left);
    o.zEvery = rc.every;
    o.zRest = z.rest > 0 || c.telegraph === ZREST ? 1 : 0;
    o.zGuard = z.riddle ? 1 : 0;
    // 曲の もりあがり（F班。1 ふつう・2 なぞ・3 むずかしい なぞ〈HP 半分 いか〉・4 さいご〈HP 2わり いか〉）
    o.riddleStage = !c.alive ? 4 : c.hp <= c.maxHp * 0.2 ? 4 : c.hp <= c.maxHp * rc.hard ? 3 : z.riddle ? 2 : 1;
  }
  if (c.c9s && b) {
    const s = c.c9s;
    o.sGrains = s.grains;
    o.sMax = s.max;
    o.sDrop = s.drop;
    o.sBoom = s.boomReady ? 1 : 0;
    o.sDizzy = s.dizzy > 0 ? 1 : 0;
    o.sPochi = s.pochiAim || null;
    o.sDizzyAt = sandConf(c, b).dizzyAt;
    // 曲の もりあがり（F班。1 ふつう・2 砂を 足した・3 HP 2わり いか・4 たおした）
    o.sandStage = !c.alive ? 4 : c.hp <= c.maxHp * 0.2 ? 3 : s.added ? 2 : 1;
  }
  return o;
}
