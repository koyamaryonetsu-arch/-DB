// 第3部 第2章 第4幕「金の音と、星の橋」の 戦いの しかけ（battle-c9a.js・battle-c9b.js から 短い よびだしで よぶ。ほかの たたかいは かわらない）
// docs/plan-part3-c10d.md の 16-2・16-3
//
// ・スピカの ごほうび（どの 戦いでも。リーダーの フラグ）: c10_note_do … 「ほのかな光」が 戦いの はじめにも 1回（b.c10rew.glowStart。
//   battle-c9a.js の setupC9a が スピカを 入れた あとに よぶ）。前の 5つの ごほうび（battle-c10a〜c.js）と 合わせて きく
// ・ちからの 水（16-2。どの 戦いでも）: A班が 立てる しるし（リーダーの フラグ c10d_power か 戦いの hooks.c10dPower）が ある 戦いの 間、
//   味方 全員の 与える ダメージ POWER_K（1.2）ばい
// ・新しい コマンド「音を鳴らす」（m10_narasu。門の 番人と ミラーレの 戦いだけ。だれでも・その 人の 番を 使う。cmd.choice … 色 0〜5）
//   6つの 音（レ赤・ミ黄・ファ緑・ソ青・ラ白・シむらさき）から 1つ。敵の「色の まく」と 同じ 色で まくが われる。ちがう 色は 何も 起きない
//   仲間に ついた「色の しるし」（門 3）も、同じ 色で 消える
// ・門の 番人（monsters-c10d.js の c10d.kind 'gate'）… 1体に 1色の まく。まくが ある 間は 受ける ダメージ veilK（2わり）
//   われると その 番人が open 回 動く 間 ダメージが ふつうに 通る → べつの 色の まくを まとい直す
//   まくが ある 間は、動く たびに 最大HPの regen（4%）回復する（鏡の ひびが なおる。鳴らさずに たたき続けても 勝ちにくい）
//   shift … この 回数 動くと まくを まとい直す（色が かわる。門 3）・mark … この 回数 動く ごとに「色を うつす」（門 3。仲間 1人に
//     いまの まくの 色の しるし → その 人の 番が おそく なる〈markK〉。番人は べつの 色に まとい直す）
// ・幕の ボス「ミラーレ」（c10d.kind 'mirror'）… 2つの 色を そろえる
//   2色の まく（人数で 合わせる。1人は 1色）。まくが ある 間は 受ける ダメージ veilK
//   2色を 両方 鳴らすと われる（じゅんは どちらでも）。1色めを 鳴らすと その 色の しるしが 消え、ミラーレが window 回 動く 前に 2色めを
//     鳴らす（間に 合わないと 1色めが もどる）
//   われると、ミラーレが open 回 動く 間 ダメージが 通り、そのうち はじめの 1回は 休む（m10d_daze）。そのあと べつの 2色に
//   「光を はかる」（measure.every 回 動く ごとに 前ぶれ・ねらいは いちばん HPが 多い 人 → 次の 番に 大ダメージ m10d_measure。身を 守ると guardCut）
//   「うつし身」: HPが copy.at を 切ると、味方 1人の すがたを うつした 鏡の 兵（c10d_copy）を 1体 出す（その 人の 技を 1つ。弱い）。
//     スピカの「てらす」で 消える
//   スピカの「星のうた」: まくの 色が 1色 へる（いまの まく。まくが ない 時は 次の まくが 1色）
//   勝つと ミラーレに ひびが 入る（たおれない。HP 1 … b.killed に 入れて 経験値・落とし物は ふつう）
// ・戦いは、人が えらぶ 間 ずっと 待つ 形（b.tellAll）。しくみの ある ボスの しるし（b.mechBoss）も 立てる（shared/ai.js の mechBoss）
// ・自動の 仲間（酒場の 人・家族の 仲間・魔物の 仲間）は、人が えらんで いる 時だけ、3回に 1回 正しい 色を 鳴らす。完全オートは 鳴らさない
// ・人数で 合わせる（few・bare・solo・monK）は 第1幕と おなじ 数え方（battle-c10a.js の c10Pick。魔物の 仲間は 半人ぶん・仲間なしの 2人／3人は bare）
import { MONSTERS } from './data/monsters.js?v=b63ba00e848c';
import { ABILITIES } from './data/abilities.js?v=b63ba00e848c';
import { C10D_MIRARE, C10D_COPY } from './data/monsters-c10d.js?v=b63ba00e848c';
import { NARASU } from './data/abilities-c10d.js?v=b63ba00e848c';
import { C10D_B as C10D, C10D_POWER_B as C10D_POWER } from './maps/c10d-flags.js?v=b63ba00e848c';
import { TERU } from './data/abilities-c9b.js?v=b63ba00e848c';
import { SONG } from './data/abilities-c9d.js?v=b63ba00e848c';
import { canUse } from './ai.js?v=b63ba00e848c';
import { c10Pick, someoneChooses } from './battle-c10a.js?v=b63ba00e848c';
import { mirrorCopy, mirrorSkillOk } from './battle-temple.js?v=b63ba00e848c';

export { NARASU };
export const MARK = 'm10d_mark';
export const MEASURE = 'm10d_measure';
export const DAZE = 'm10d_daze';
// ちからの 水
export const POWER_K = 1.2;
export const AUTO_EVERY = 3;
// 6つの 音（ならびは 音の じゅん。choice の 番号）
export const NOTE_COLORS = [
  { id: 'red', name: '赤', note: 'レ', item: 'note_re', css: '#ff5a5a' },
  { id: 'yellow', name: '黄', note: 'ミ', item: 'note_mi', css: '#ffd83a' },
  { id: 'green', name: '緑', note: 'ファ', item: 'note_fa', css: '#4ad66a' },
  { id: 'blue', name: '青', note: 'ソ', item: 'note_so', css: '#4a9aff' },
  { id: 'white', name: '白', note: 'ラ', item: 'note_la', css: '#f4f6ff' },
  { id: 'purple', name: 'むらさき', note: 'シ', item: 'note_si', css: '#b068ff' },
];
export const COLOR_N = NOTE_COLORS.length;
export const colorName = (i) => NOTE_COLORS[i]?.name || '';
export const noteName = (i) => NOTE_COLORS[i]?.note || '';
// 「赤（レ）」
export const colorLabel = (i) => (NOTE_COLORS[i] ? `${NOTE_COLORS[i].name}（${NOTE_COLORS[i].note}）` : '');

const post = (ev) => (ev.postLines = ev.postLines || []);
const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || {} : a?.effect || {});
const flag = (b, f) => {
  try {
    return !!b.hooks?.leaderFlag?.(f);
  } catch {
    return false;
  }
};
const hide = (o, k, v) => Object.defineProperty(o, k, { value: v, enumerable: false, configurable: true, writable: true });

// しかけの 数（人数で 合わせた もの）
export function c10dConf(species, b = null) {
  const c = MONSTERS[species]?.c10d || {};
  const pick = c10Pick(c, b);
  const mons = b && (b.allies || []).some((a) => a.kind === 'player') ? b.allies.filter((a) => a.kind === 'monster').length : 0;
  return {
    kind: c.kind,
    veilK: c.veilK ?? 0.2, regen: pick('regen', c.regen || 0), open: pick('open', c.open ?? 3), shift: c.shift || 0, mark: pick('mark', c.mark || 0), markK: c.markK ?? 0.6,
    colors: pick('colors', c.colors ?? 1), window: pick('window', c.window ?? 2),
    measure: { every: 4, first: 3, mult: 2.6, guardCut: 0.35, ...(c.measure || {}), mult: (c.measure?.mult ?? 2.6) * pick('measureK', 1) },
    copy: { at: 0.5, hp: 0.4, atk: 0.55, ...(c.copy || {}) },
    hp: pick('hp', 1) * (1 + (c.monK?.hp || 0) * mons), atk: pick('atk', 1) * (1 + (c.monK?.atk || 0) * mons), spd: pick('spd', 1),
  };
}
export const c10dState = (b) => b?.c10d || null;
// まくの ある 敵（門の 番人・ミラーレ）
export const veiledFoes = (b) => (b?.c10d ? b.enemies.filter((e) => e.c10v) : []);
export const mirrorOf10d = (b) => (b?.c10d?.kind === 'mirror' ? b.get(b.c10d.id) : null);
export const copyOf10d = (b) => (b?.c10d?.kind === 'mirror' && b.c10d.copy ? b.get(b.c10d.copy) : null);
const teruOf = (b) => b.c9sp?.teru || null;
const songOf = (b) => b.c9sp?.song || null;
const teruReady = (b) => { const t = teruOf(b); return !!t && t.charge >= t.max; };
const songReady = (b) => { const s = songOf(b); return !!s && s.charge >= s.max; };
// まくが ある（まだ 鳴らして いない 色が ある）
export const veiled = (e) => !!e?.c10v && e.c10v.colors.length > 0;
// 色の しるしの ついた 味方
export const markedAllies = (b) => b.allies.filter((a) => a.alive && !a.fled && Number.isInteger(a.c10mark));

// ───────────── はじめ（battle-c9b.js の setupC9b から。setupC10c の あと）─────────────
// かえす 値: スピカを 出すか（門の 番人・ミラーレの 戦いは かならず。星のうたも）
export function setupC10d(b, lines) {
  // スピカの ごほうび（前の 幕の b.c10rew に 足す）
  if (flag(b, C10D.noteDo)) b.c10rew = { ...(b.c10rew || {}), glowStart: true };
  // ちからの 水
  let power = false;
  try {
    power = flag(b, C10D_POWER) || !!(typeof b.hooks?.c10dPower === 'function' ? b.hooks.c10dPower() : b.hooks?.c10dPower);
  } catch { /* */ }
  if (power) {
    b.c10dPower = POWER_K;
    lines.push('ちからの水の力が、みんなの体にみなぎっている！（こうげきのダメージが上がる）');
  }
  const mir = b.enemies.find((e) => e.species === C10D_MIRARE);
  const gates = b.enemies.filter((e) => MONSTERS[e.species]?.c10d?.kind === 'gate');
  if (!mir && !gates.length) return false;
  b.c9songOn = true;
  // 人が えらんで いる 間は、敵も 味方も 時間を 止める（battle.js の tick。前の 幕の ボスと おなじ）
  b.tellAll = true;
  b.mechBoss = true;
  for (const a of b.allies) {
    hide(a, '_b10d', b);
    if (!a.abilities.includes(NARASU)) a.abilities = [NARASU, ...a.abilities];
  }
  if (mir) setupMirror(b, mir, lines);
  else setupGates(b, gates, lines);
  b.tell = c10dTell(b);
  return true;
}
function scale(e, cf) {
  if (cf.hp !== 1) e.maxHp = e.hp = Math.max(1, Math.round(e.maxHp * cf.hp));
  if (cf.atk !== 1) e.dmgRate = cf.atk;
  if (cf.spd !== 1) e.speed = (e.speed || 1) * cf.spd;
}
// あたらしい 色（ほかの 敵の まくの 色・前の 色と かさならない ように）
function freshColors(b, e, n) {
  const used = new Set();
  for (const x of veiledFoes(b)) if (x !== e && x.alive) for (const k of x.c10v.colors) used.add(k);
  const prev = new Set(e.c10v?.last || []);
  let pool = [...Array(COLOR_N).keys()].filter((i) => !used.has(i) && !prev.has(i));
  if (pool.length < n) pool = [...Array(COLOR_N).keys()].filter((i) => !prev.has(i));
  if (pool.length < n) pool = [...Array(COLOR_N).keys()];
  const out = [];
  for (let j = 0; j < n && pool.length; j++) out.push(pool.splice(b.rng.int(0, pool.length - 1), 1)[0]);
  return out.sort((x, y) => x - y);
}
function nameOf(e) {
  if (!e.c10v) return e.name;
  const base = e.c10v.base;
  const c = e.c10v.colors;
  return c.length ? `${base}（${c.map(colorName).join('・')}）` : base;
}
const rename = (e) => { if (e.c10v) e.name = nameOf(e); };
function setupGates(b, gates, lines) {
  b.c10d = { kind: 'gate', ids: gates.map((e) => e.id), won: false, rings: 0, hits: 0, misses: 0, breaks: 0, shifts: 0, marks: 0, unmarks: 0, autoRings: 0 };
  for (const e of gates) {
    const cf = c10dConf(e.species, b);
    scale(e, cf);
    hide(e, '_b10d', b);
    e.c10v = { base: e.name, colors: [], last: [], rung: [], open: 0, acts: 0, shiftLeft: cf.shift, markLeft: cf.mark, markAim: null, breaks: 0 };
  }
  for (const e of gates) {
    e.c10v.colors = freshColors(b, e, 1);
    rename(e);
  }
  const g = gates[0];
  lines.push(
    `${g.c10v.base}「ここは、星の階段の門。光の音を持たぬ者は、通さぬ。」`,
    `（${gates.map((e) => `${e.name}`).join('・')}…！体の色と同じ色の「音を鳴らす」で、まくがわれる！）`,
  );
}
function setupMirror(b, m, lines) {
  const cf = c10dConf(C10D_MIRARE, b);
  scale(m, cf);
  hide(m, '_b10d', b);
  m.c10v = {
    base: m.name, colors: [], last: [], rung: [], left: 0, open: 0, acts: 0, daze: false, sungNext: false,
    measureLeft: cf.measure.first, measureReady: false, measureAim: null, copyDone: false, down: false, breaks: 0,
  };
  m.c10v.colors = freshColors(b, m, cf.colors);
  rename(m);
  // うつし身（はじめは 見えない）
  const cp = b.enemies.find((e) => e.species === C10D_COPY);
  if (cp) {
    Object.assign(cp, { alive: false, hp: 0, atb: 0, ready: false, queued: false });
    hide(cp, '_b10d', b);
  }
  b.c10d = {
    kind: 'mirror', id: m.id, copy: cp?.id || null, won: false,
    rings: 0, hits: 0, misses: 0, breaks: 0, backs: 0, songs: 0, measures: 0, measureGuards: 0, copies: 0, copyGone: 0, autoRings: 0,
  };
  lines.push(
    `${m.name}「ふわぁ…。光の弱い者たちが、のぼってきたか。」`,
    `${m.name}「わたしは、光をはかる鏡。わたしのまくは、そろった音でしか、われぬ。」`,
    `（まくの色は、${m.c10v.colors.map(colorLabel).join('と')}！「音を鳴らす」で、${m.c10v.colors.length > 1 ? '2色とも、つづけて' : '同じ色を'}鳴らそう！）`,
  );
}

// ───────────── スピカ（battle-c9a.js の setupC9a から）: 金の 音の ごほうび … 戦いの はじめの ほのかな光 ─────────────
export const c10GlowStart = (b) => !!b?.c10rew?.glowStart;

// ───────────── 今 前ぶれ中か（battle-tell.js の b.tell。battle-c9b.js の c9bTell から）─────────────
// 'measure' … 光を はかる 前ぶれ・'mirror'・'gate' … いつも 人が えらぶのを 待つ・null
export function c10dTell(b) {
  const st = b?.c10d;
  if (!st || st.won) return null;
  if (st.kind === 'mirror') {
    const m = mirrorOf10d(b);
    if (!m?.alive) return null;
    return m.c10v.measureReady ? 'measure' : 'mirror';
  }
  return veiledFoes(b).some((e) => e.alive) ? 'gate' : null;
}

// ───────────── 1回 動いた あと（battle-c9a.js の c9aAfter の はじめ。味方・敵 どちらも）─────────────
export function c10dAfter(b, c, ev) {
  const st = b.c10d;
  if (!st || st.won || !c || b.pendingEnd || b.over) return;
  if (c.side === 'enemy') {
    // まくが われて いる 間（その 敵が 動く 回数で 数える）→ まとい直す
    const v = c.c10v;
    if (!v || !c.alive || !(v.open > 0)) return;
    v.open--;
    if (!v.open) reveil(b, c, ev);
    return;
  }
  const m = mirrorOf10d(b);
  if (!m?.alive) return;
  const v = m.c10v;
  // てらす: うつし身が 消える
  const cp = copyOf10d(b);
  if (ev.c9bTeru && cp?.alive) {
    Object.assign(cp, { alive: false, hp: 0, ready: false, queued: false, telegraph: null });
    b.queue = b.queue.filter((q) => q.id !== cp.id);
    st.copyGone++;
    post(ev).push(`スピカの光をあびて、${cp.name}は、すうっと消えた！`);
    ev.c10dCopyGone = { id: cp.id };
    ev.upd.push(cp);
  }
  // 星のうた: まくの 色が 1色 へる
  if (ev.c9dSong && !v.down) {
    st.songs++;
    if (v.colors.length) {
      const i = v.colors.length > 1 ? b.rng.int(0, v.colors.length - 1) : 0;
      const gone = v.colors.splice(i, 1)[0];
      rename(m);
      if (!v.colors.length) {
        post(ev).push(`スピカの歌で、${colorName(gone)}のまくが、すうっと消えた！`);
        breakVeil(b, m, ev);
      } else post(ev).push(`スピカの歌で、${colorName(gone)}のまくが、すうっと消えた！（あと${v.colors.map(colorName).join('と')}だけ！）`);
      ev.c10dSong = { id: m.id, color: gone, left: v.colors.slice() };
    } else {
      v.sungNext = true;
      post(ev).push('スピカの歌が、鏡にしみこんでいく…（次のまくは、1色だけになる！）');
      ev.c10dSong = { id: m.id, color: null, left: [], next: true };
    }
    ev.upd.push(m);
  }
}

// ───────────── 行動の はじめ（battle-c9b.js の c9bTurnStart から。敵の 番だけ）─────────────
export function c10dTurnStart(b, c, ev, stuck) {
  const st = b.c10d;
  if (!st || c.side === 'ally' || st.won || !c.c10v || c.telegraph) return;
  if (st.kind === 'mirror') return mirrorTurn(b, c, ev, stuck);
  return gateTurn(b, c, ev, stuck);
}
function gateTurn(b, c, ev, stuck) {
  const st = b.c10d;
  const v = c.c10v;
  const cf = c10dConf(c.species, b);
  v.acts++;
  ev.upd.push(c);
  // まくが ある 間は 鏡の ひびが なおる（HPが 少し 回復）
  if (cf.regen && veiled(c) && c.hp < c.maxHp) {
    const h = Math.min(c.maxHp - c.hp, Math.max(1, Math.round(c.maxHp * cf.regen)));
    c.hp += h;
    st.regens = (st.regens || 0) + h;
    (ev.results = ev.results || []).push({ id: c.id, heal: h });
    ev.lines.push(`${v.base}の色のまくが光って、ひびが少しなおった。（HPが${h}回復）`);
    ev.c10dRegen = { id: c.id, heal: h };
  }
  if (stuck) return;
  // 色を うつす（仲間 1人に いまの まくの 色の しるし。この 番の 行動）
  if (cf.mark) {
    v.markLeft--;
    if (v.markLeft <= 0) {
      const free = b.aliveAllies().filter((a) => !Number.isInteger(a.c10mark));
      if (free.length && veiled(c)) {
        v.markLeft = cf.mark;
        v.markAim = free[b.rng.int(0, free.length - 1)].id;
        c.telegraph = MARK;
        return;
      }
      v.markLeft = 1;
    }
  }
  // まとい直す（色が かわる。まくが ある 間だけ。ふつうに 動きながら）
  if (cf.shift && veiled(c)) {
    v.shiftLeft--;
    if (v.shiftLeft <= 0) {
      v.shiftLeft = cf.shift;
      const from = v.colors.slice();
      v.last = from;
      v.colors = freshColors(b, c, 1);
      rename(c);
      st.shifts++;
      ev.lines.push(`${v.base}の体の色が、${from.map(colorName).join('・')}から${v.colors.map(colorName).join('・')}にかわった！`);
      ev.c10dShift = { id: c.id, from, to: v.colors.slice() };
    }
  }
}
function mirrorTurn(b, c, ev, stuck) {
  const st = b.c10d;
  const v = c.c10v;
  const cf = c10dConf(C10D_MIRARE, b);
  if (v.down) return;
  v.acts++;
  ev.upd.push(c);
  // 1色めを 鳴らした あと: 間に 合わないと もどる（ミラーレが 動く 回数で 数える）
  if (v.rung.length && v.colors.length) {
    v.left--;
    if (v.left <= 0) {
      const back = v.rung.slice();
      v.colors = [...v.colors, ...back].sort((x, y) => x - y);
      v.rung = [];
      v.left = 0;
      rename(c);
      st.backs++;
      ev.lines.push(`${c.name.split('（')[0]}のまくに、${back.map(colorName).join('と')}の色が、もどってしまった…！`);
      ev.c10dBack = { id: c.id, colors: back };
      ev.warn = true;
    }
  }
  // うつし身（HPが 半分を 切ると 1回）
  if (!v.copyDone && c.hp <= c.maxHp * cf.copy.at) {
    v.copyDone = true;
    spawnCopy(b, c, ev, cf);
  }
  if (stuck) return;
  if (v.daze) {
    v.daze = false;
    c.telegraph = DAZE;
    return;
  }
  if (v.measureReady) {
    c.telegraph = MEASURE;
    return;
  }
  v.measureLeft--;
  if (v.measureLeft <= 0) {
    v.measureLeft = cf.measure.every;
    const t = topHp(b);
    if (t) {
      v.measureReady = true;
      v.measureAim = t.id;
      st.measures++;
      ev.lines.push(`${v.base}の目が、${t.name}をじろりと見た…！「いちばん光る者は、おまえか。」`, `（次に、${t.name}へ「光をはかる」が来る！${t.name}は「防御」でそなえよう！）`);
      ev.c10dMeasureUp = { id: c.id, aim: t.id };
      ev.warn = true;
    }
  }
}
// いちばん HPが 多い 味方（「いちばん 光る 者」）
function topHp(b) {
  return b.aliveAllies().slice().sort((x, y) => y.hp - x.hp)[0] || null;
}
// うつし身を 出す（味方 1人の すがた・技 1つ。弱い）
function spawnCopy(b, m, ev, cf) {
  const st = b.c10d;
  const cp = copyOf10d(b);
  if (!cp) return;
  const al = b.aliveAllies();
  const pool = al.filter((a) => a.kind === 'player').length ? al.filter((a) => a.kind === 'player') : al;
  const a = pool[b.rng.int(0, pool.length - 1)];
  if (!a) return;
  const mc = mirrorCopy(a);
  // その 人の 技を 1つ（敵に ダメージを 与える 技。なければ ふつうの 攻撃だけ）
  const skill = (a.abilities || []).filter((id) => {
    const ab = ABILITIES[id];
    if (!ab || id === NARASU || id === TERU || id === SONG || !mirrorSkillOk(id) || ab.noAuto) return false;
    const e = prim(ab);
    return ['enemy', 'enemies', 'group'].includes(ab.target) && ['phys', 'magic'].includes(e.type) && !(ab.mp > (a.maxMp || 0) * 0.3);
  })[0];
  const hp = Math.max(1, Math.round(a.maxHp * cf.copy.hp));
  Object.assign(cp, {
    name: mc.name, baseName: mc.name, letter: '', lv: a.lv, maxHp: hp, hp, maxMp: mc.maxMp, mp: mc.maxMp,
    atk: Math.max(1, Math.round(a.atk * cf.copy.atk)), dfn: mc.dfn, agi: mc.agi, mag: Math.max(1, Math.round(a.mag * cf.copy.atk)), healPow: mc.healPow,
    abilities: skill ? [skill] : [], tactics: 'aggressive', autoOff: [], mirrorOf: a.id, look: mc.look, job: mc.job, eq: mc.eq, mon: mc.mon,
    penChar: mc.penChar, weaponCat: mc.weaponCat, onHit: mc.onHit, race: mc.race,
    alive: true, atb: 0, ready: false, queued: false, buffs: {}, debuffs: {}, status: {}, telegraph: null, charge: 1, used: {}, recent: [],
  });
  st.copies++;
  ev.lines.push(`${m.c10v.base}「…ふむ。おまえたちの光、うつしてやろう。」`, `鏡の中から、${cp.name}があらわれた！（スピカの「てらす」で、消せるかも…！）`);
  ev.c10dCopy = { id: cp.id, of: a.id, skill: skill || null };
  ev.warn = true;
  ev.upd.push(cp);
}

// まくが われる
function breakVeil(b, e, ev) {
  const st = b.c10d;
  const v = e.c10v;
  const cf = c10dConf(e.species, b);
  v.last = [...v.rung, ...v.colors];
  v.colors = [];
  v.rung = [];
  v.left = 0;
  v.open = cf.open;
  v.breaks++;
  st.breaks++;
  if (st.kind === 'mirror') v.daze = true;
  rename(e);
  post(ev).push(`パリーン！${v.base}のまくが、われた！（今なら、こうげきが通る！）`);
  (ev.c10dBreak = ev.c10dBreak || []).push(e.id);
  ev.warn = true;
  ev.upd.push(e);
}
// まとい直す（べつの 色）
function reveil(b, e, ev) {
  const v = e.c10v;
  const cf = c10dConf(e.species, b);
  if (b.c10d.won || v.down) return;
  let n = b.c10d.kind === 'mirror' ? cf.colors : 1;
  if (v.sungNext) {
    n = 1;
    v.sungNext = false;
  }
  v.colors = freshColors(b, e, n);
  v.rung = [];
  v.left = 0;
  v.shiftLeft = cf.shift;
  rename(e);
  post(ev).push(`${v.base}が、${v.colors.map(colorName).join('と')}のまくを、まとい直した！`);
  ev.c10dVeil = { id: e.id, colors: v.colors.slice() };
  ev.upd.push(e);
}

// ───────────── 技の こうか（battle-c9b.js の c9bEffect の のこり）─────────────
export function c10dEffect(b, c, a, eff, ev) {
  switch (eff.type) {
    case 'c10dRing': ring(b, c, ev); return true;
    case 'c10dMark': mark(b, c, ev); return true;
    case 'c10dMeasure': measure(b, c, ev); return true;
    case 'c10dDaze': {
      ev.lines.push(`${c.c10v?.base || c.name}は、ひびがしみて、動けない…（今のうちだ！）`);
      ev.c10dDaze = { id: c.id };
      ev.upd.push(c);
      return true;
    }
    default: return false;
  }
}
// 今 鳴らすと よい 色（まくの 色・しるしの 色。ない 時は null）
//   まだ だれも 鳴らそうと して いない 色を 先に（queue の 音を鳴らす の choice を 見る）
export function neededColors(b, but = null) {
  const out = [];
  const queued = new Set(b.queue.filter((q) => q.cmd?.id === NARASU && q.id !== but && Number.isInteger(q.cmd.choice)).map((q) => q.cmd.choice));
  const foes = veiledFoes(b).filter((e) => e.alive && veiled(e)).sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp);
  for (const a of markedAllies(b)) if (!out.includes(a.c10mark) && !queued.has(a.c10mark)) out.push(a.c10mark);
  for (const e of foes) for (const k of e.c10v.colors) if (!out.includes(k) && !queued.has(k)) out.push(k);
  return out;
}
export const bestColor = (b, c) => neededColors(b, c?.id)[0] ?? neededColors(b)[0] ?? null;
// 音を鳴らす（だれでも。その 人の 番を 使う。cmd.choice … 色）
function ring(b, c, ev) {
  const st = b.c10d;
  const ch = b.curCmd?.choice;
  const col = Number.isInteger(ch) && ch >= 0 && ch < COLOR_N ? ch : bestColor(b, c) ?? 0;
  ev.fx = { type: 'ability', anim: 'c10d_ring', actor: c.id, targets: [c.id], side: 'ally', color: col };
  ev.lines.length = 0;
  ev.lines.push(`${c.name}は、星の音「${noteName(col)}」を鳴らした！${colorName(col)}の光が、ひろがっていく…！`);
  if (!st || st.won) {
    ev.lines.push('しかし、何も起こらなかった。');
    ev.c10dRing = { id: c.id, color: col, ok: false, hit: [], broke: [], unmark: [] };
    return;
  }
  st.rings++;
  const hit = [];
  const broke = [];
  // 色の しるしが 消える
  const unmark = markedAllies(b).filter((a) => a.c10mark === col);
  for (const a of unmark) {
    delete a.c10mark;
    delete a.tmul;
    st.unmarks = (st.unmarks || 0) + 1;
    ev.upd.push(a);
  }
  if (unmark.length) post(ev).push(`${unmark.map((a) => a.name).join('と')}の${colorName(col)}のしるしが、すうっと消えた！（動きがもとにもどった）`);
  for (const e of veiledFoes(b)) {
    if (!e.alive || !e.c10v.colors.includes(col)) continue;
    const v = e.c10v;
    v.colors = v.colors.filter((k) => k !== col);
    hit.push(e.id);
    if (!v.colors.length) {
      breakVeil(b, e, ev);
      broke.push(e.id);
      continue;
    }
    // ミラーレ: 1色め … しるしが 消える・あと window 回で もどる
    if (!v.rung.length) v.left = c10dConf(e.species, b).window;
    v.rung.push(col);
    rename(e);
    post(ev).push(`${v.base}の${colorName(col)}のまくが、ひびわれて消えた！（あと${v.colors.map(colorLabel).join('と')}！${v.base}が${v.left}回動く前に、鳴らそう！）`);
    ev.upd.push(e);
  }
  if (hit.length) st.hits++;
  if (!hit.length && !unmark.length) {
    st.misses++;
    post(ev).push('…音が、合わない…。（まくの色と、同じ色の音を鳴らそう）');
  }
  ev.c10dRing = { id: c.id, color: col, ok: !!(hit.length || unmark.length), hit, broke, unmark: unmark.map((a) => a.id) };
  ev.upd.push(c);
}
// 色を うつす（門 3）
function mark(b, c, ev) {
  const st = b.c10d;
  const v = c.c10v;
  const cf = c10dConf(c.species, b);
  const t0 = b.get(v?.markAim);
  const free = b.aliveAllies().filter((a) => !Number.isInteger(a.c10mark));
  const t = t0?.alive && !Number.isInteger(t0.c10mark) ? t0 : free[0];
  if (!t) {
    ev.lines.push(`${v?.base || c.name}は、色をうつそうとしたが、うまくいかなかった。`);
    return;
  }
  const col = v?.colors?.[0] ?? b.rng.int(0, COLOR_N - 1);
  t.c10mark = col;
  t.tmul = cf.markK;
  st.marks++;
  ev.fx = { type: 'ability', anim: 'c10d_mark', actor: c.id, targets: [t.id], side: 'enemy', color: col };
  ev.lines.length = 0;
  ev.lines.push(`${v.base}が、まくの色を、${t.name}にうつした！${t.name}に、${colorName(col)}のしるしがついた！`);
  post(ev).push(`（${t.name}の番が、おそくなる…！${colorLabel(col)}の音を鳴らせば、消える！）`);
  // 番人は べつの 色に まとい直す
  if (veiled(c)) {
    v.last = v.colors.slice();
    v.colors = freshColors(b, c, 1);
    v.shiftLeft = cf.shift;
    rename(c);
    post(ev).push(`${v.base}の体の色が、${v.colors.map(colorName).join('・')}にかわった！`);
  }
  ev.c10dMark = { id: c.id, to: t.id, color: col };
  ev.warn = true;
  ev.upd.push(c, t);
}
// 光を はかる（前ぶれの ねらい。いなければ いま いちばん HPが 多い 人）
function measure(b, c, ev) {
  const st = b.c10d;
  const v = c.c10v;
  const cf = c10dConf(C10D_MIRARE, b);
  v.measureReady = false;
  const t0 = b.get(v.measureAim);
  const t = t0?.alive ? t0 : topHp(b);
  v.measureAim = null;
  if (!t) return;
  ev.fx = { type: 'ability', anim: 'c10m_measure', actor: c.id, targets: [t.id], side: 'enemy' };
  if (t.defending) st.measureGuards++;
  b.physHit(c, t, { mult: cf.measure.mult * (t.defending ? cf.measure.guardCut : 1), acc: 9 }, ev, 'phys');
  if (t.defending) post(ev).push(`${t.name}は、身を守って、こらえた！`);
  ev.c10dMeasure = { id: c.id, to: t.id, guard: !!t.defending };
  ev.warn = true;
  ev.upd.push(c);
}

// ───────────── ダメージ（battle-c9b.js の c9bDamage の さいご。味方 → 敵）─────────────
export function c10dDamage(b, c, t, dmg, info, ev) {
  if (!(dmg > 0) || c?.side !== 'ally' || t?.side !== 'enemy') return dmg;
  // ちからの 水
  if (b.c10dPower) dmg = Math.max(1, Math.round(dmg * b.c10dPower));
  const st = b.c10d;
  if (!st || st.won || !t.c10v) return dmg;
  // 色の まく: 受ける ダメージ 2わり
  if (veiled(t)) {
    dmg = Math.max(1, Math.round(dmg * c10dConf(t.species, b).veilK));
    if (ev && !ev.c10dVeilHit) {
      ev.c10dVeilHit = true;
      post(ev).push(`（${t.c10v.base}の色のまくが、こうげきをはじいた…！）`);
    }
  }
  // ミラーレは たおれない（HP 1 で 止まる）
  if (st.kind === 'mirror' && t.id === st.id && dmg >= t.hp) {
    dmg = Math.max(0, t.hp - 1);
    bossDown(b, t, ev);
  }
  return dmg;
}
function bossDown(b, c, ev) {
  const st = b.c10d;
  st.won = true;
  c.telegraph = null;
  c.c10v.down = true;
  c.c10v.colors = [];
  c.c10v.rung = [];
  c.c10v.measureReady = false;
  c.name = c.c10v.base;
  b.killed.push(c.species);
  const cp = copyOf10d(b);
  if (cp?.alive) Object.assign(cp, { alive: false, hp: 0, ready: false, queued: false, telegraph: null });
  for (const a of markedAllies(b)) { delete a.c10mark; delete a.tmul; }
  if (ev) {
    post(ev).push(
      `ピシッ…！${c.name}の鏡に、大きなひびが入った！`,
      `${c.name}「む、むむ…。この光…はかりきれぬ…。」`,
      `${c.name}は、ひびの入った鏡をゆらして、空の上へ、ふわりと下がっていった…。`,
    );
    ev.c10dDown = { id: c.id };
    ev.upd.push(c);
    if (cp) ev.upd.push(cp);
  }
  b.pendingEnd = { outcome: 'win' };
  b.queue = [];
}

// ───────────── オート（battle-c9b.js の c9bPlan の はじめ）─────────────
// この 幕の 戦いで なければ undefined。ふつうの オートは null
export function c10dPlan(b, c, decide, bestHit) {
  const st = b.c10d;
  if (!st) return undefined;
  if (c.side !== 'ally' || b.c9Inner || c.status?.rift || st.won) return null;
  const mode = c.knows9 ?? b.knowsCh9;
  const canRing = canUse(b, c, NARASU);
  const need = canRing ? neededColors(b, c.id) : [];
  const m = mirrorOf10d(b);
  const v = m?.alive ? m.c10v : null;
  if (mode !== 'know' && mode !== 'blind') {
    // 自動の 仲間: 鳴らすと よい 色が ある 番の 3回に 1回、正しい 色を 鳴らす（数は 自動の 仲間 みんなで 1つ）。人が えらんで いる 時だけ
    if (c.kind === 'player' || !need.length || !someoneChooses(b)) return null;
    b.c10dAuto = (b.c10dAuto || 0) + 1;
    if (b.c10dAuto % AUTO_EVERY) return null;
    st.autoRings++;
    return { type: 'ability', id: NARASU, choice: need[0] };
  }
  if (mode === 'blind') {
    if (v?.measureReady && v.measureAim === c.id && !c.defending && b.rng.chance(0.15)) return { type: 'defend' };
    if (need.length && b.rng.chance(0.15)) return { type: 'ability', id: NARASU, choice: need[0] };
    return null;
  }
  // 知って いる 人: 光を はかるの ねらい … 防御・うつし身 … てらす・ミラーレの 2色 … 星のうた（たまって いれば）・
  //   ほかは 鳴らすと よい 色（まだ だれも 鳴らそうと して いない 色）を 鳴らす・ふだんは ふつう
  if (v?.measureReady && v.measureAim === c.id && !c.defending) return { type: 'defend' };
  const cp = copyOf10d(b);
  if (cp?.alive && teruReady(b) && canUse(b, c, TERU) && !queued(b, TERU)) return { type: 'ability', id: TERU };
  const cmd = base(b, c, decide);
  const a = cmd?.type === 'ability' ? ABILITIES[cmd.id] : null;
  if (a && ['heal', 'revive', 'reviveAll'].includes(prim(a).type) && b.allies.some((x) => !x.fled && (!x.alive || x.hp / x.maxHp < 0.35))) return cmd;
  if (v && v.colors.length >= 2 && !v.rung.length && songReady(b) && canUse(b, c, SONG) && !queued(b, SONG)) return { type: 'ability', id: SONG };
  if (need.length) return { type: 'ability', id: NARASU, choice: need[0] };
  // まくが ある 敵を たたいても 2わり … まくの ない 敵が いれば そちら
  if (st.kind === 'gate' && cmd?.target) {
    const t = b.get(cmd.target);
    const open = b.enemies.filter((e) => e.alive && e.c10v && !veiled(e)).sort((x, y) => x.hp - y.hp)[0];
    if (t && veiled(t) && open) return bestHit(b, c, open) || { type: 'attack', target: open.id };
  }
  return cmd;
}
const queued = (b, id) => b.queue.some((q) => q.cmd?.id === id);
function base(b, c, decide) {
  b.c9Inner = true;
  try {
    return decide(b, c);
  } finally {
    b.c9Inner = false;
  }
}
// しくみの 用が ある 間（シミュレーターの 知って いる 人は 合体技を しない）
export function c10dBusy(b) {
  const st = b.c10d;
  if (!st || st.won) return false;
  return neededColors(b).length > 0 || !!mirrorOf10d(b)?.c10v?.measureReady;
}

// ───────────── がめんへ（battle-c9b.js の c9bPub から。敵）─────────────
// 門の 番人・ミラーレ: c10Kind 'gate'|'mirror'・veil10（いまの まくの 色の 番号 [ ]）・rung10（ミラーレ: 鳴らした 色）・left10（ミラーレ: もどるまでの 回数）・
//   open10（まくが われて いる のこり）・base10（色の ない 名前）・c10Down
// ミラーレ: measure（光を はかるの 前ぶれ）・measureAim（ねらう 人の id）・measureLeft・daze（休む）・copyOut（うつし身が いる）・
//   mirrorStage（曲の もりあがり 1 ふつう・2 前ぶれ・3 HP 半分・4 勝った）
// 門の 番人: gateStage（1 ふつう・2 まくが われた・4 たおした）
export function c10dPub(c, b = c?._b10d) {
  const o = {};
  const st = b?.c10d;
  const v = c?.c10v;
  if (!st || !v) return o;
  o.c10Kind = st.kind;
  o.veil10 = v.colors.slice();
  o.open10 = v.open > 0 ? v.open : 0;
  o.base10 = v.base;
  if (st.kind === 'mirror') {
    o.rung10 = v.rung.slice();
    o.left10 = v.rung.length && v.colors.length ? v.left : 0;
    o.measure = v.measureReady ? 1 : 0;
    o.measureAim = v.measureReady ? v.measureAim : null;
    o.measureLeft = Math.max(0, v.measureLeft);
    o.daze = v.daze || c.telegraph === DAZE ? 1 : 0;
    o.copyOut = copyOf10d(b)?.alive ? 1 : 0;
    o.c10Down = st.won ? 1 : 0;
    o.mirrorStage = st.won ? 4 : v.measureReady ? 2 : c.hp <= c.maxHp * 0.5 ? 3 : 1;
    return o;
  }
  o.gateStage = !c.alive ? 4 : v.open > 0 ? 2 : 1;
  return o;
}
// 味方（battle-c9a.js の c9aPub から）: mark10（色の しるしの 番号）・ring10（音を鳴らす が 使える 戦い）
export function c10dAllyPub(c, b = c?._b10d) {
  const o = {};
  if (!b?.c10d) return o;
  o.ring10 = 1;
  if (Number.isInteger(c.c10mark)) o.mark10 = c.c10mark;
  return o;
}
