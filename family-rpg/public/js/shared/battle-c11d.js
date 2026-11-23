// 第3部 第3章 第4幕「かがやきの女王と、八つめの音」の 戦いの しかけ（battle-c9a.js・battle-c9b.js から 短い よびだしで よぶ。ほかの たたかいは かわらない）
// docs/plan-part3-c11d.md の 20-5
//
// ・スピカの さいごの ごほうび（どの 戦いでも。リーダーの フラグ c11_act4）: 技「八つの音のうた」… 戦いで 1回だけ、8回めの ほのかな光で、
//   8つの 音が ひとつの うたに なって、生きて いる 仲間 みんなの HPを 最大HPの EIGHT_SONG_HP・MPを EIGHT_SONG_MP 回復する。
//   battle-c9a.js の glow から よぶ。前の ごほうび（ながれ星・名前をよぶ声・ふたりの光 など）と 合わせて きく
// ・中ボス「鏡と月の使い」（monsters-c11d.js の c11d.kind 'duo'。ミラーレ ＝ role 'mirror'・オボロ ＝ role 'moon'）
//   前に 出て いる 方の しくみだけが きく。前の 方が swap 回 動くと 入れかわる（その 1回 前に 前ぶれ）
//   ミラーレが 前 … 色の まく（1色。受ける ダメージ veilK）。同じ 色の「音を鳴らす」（m10_narasu。第2章 第4幕の コマンド）で われる
//     （われた まくは、ミラーレが うしろに 下がって また 前に 出るまで もどらない）
//   オボロが 前 … 前に 出た はじめの 番に 前ぶれ → 次の 番に「わすれの衣」（スピカの 思い出 −1。思い出が 1つでも 消えて いる 間は
//     オボロの 受ける ダメージ forgetK）。スピカに「よびかける」（m11_yobikake。第2幕の コマンド）で 思い出が もどる。思い出が ぜんぶ 消えると 負け
//   うしろの 方は 小さな 攻撃だけ（受ける ダメージ backK）
//   HPが 1に なった 方は ひざを つく（もう 動かない・入れかわらない）。2人 とも ひざを つくと 勝ち（2人 とも 引く ＝ たおれない）
//   もとの 戦いの しくみ（battle-c10d.js・battle-c11b.js）は 動かない（べつの 魔物の id）。コマンドの こうかは、この ファイルの c11dEffect が 先に 受ける
// ・新しい コマンド「手をつなぐ」（m11_tewotsunagu。女王の 戦いで だれでも。その 人の 番を 使う。cmd.choice … 味方の id・'spica'・ひとりの 時は 'algol'）
// ・新しい コマンド「八つの音」（m11_yatsunone。八つめの 音が 来た あとに 出る。だれでも・戦いで eight.uses 回 まで）
// ・さいごの ボス「かがやきの女王ポラリス」（c11d.kind 'queen'）… 手を つなぐ
//   1. 「手をつなぐ」で、自分と えらんだ 相手が つながる（女王の link 回の 番の 間。名前の 横に 同じ 色の しるし）。つながった 人と
//      さらに べつの 人が つなぐと、みんなで 1つの 輪に なる（つないだ 輪は のこりの 番が もとに もどる）
//   2. 「光の はかり」（measure.every 回 動く ごとに 1回 前に 前ぶれ）: いちばん HPの わりあいが 低い 人を はかる。だれとも つないで いなければ、
//      ながされる（自分の 番 measure.away 回の 間 戦いの 外 … status.rift の kind 'c11dswept'。もどると HP measure.back）。つないで いれば ながされない
//   3. 「かがやき」（shine.every 回 動く ごとに 1回 前に 前ぶれ。全体）: つないで いない 人に 大きな ダメージ（loose）・つないで いる 人に 小さな ダメージ（held）
//   4. つないで いる 人が 多いほど、スピカの 光（ほのかな光・てらす）が 強く なる（スピカの 輪の 人数 × glow.ring の 回復）
//   6. HPが 半分に なった 時（八つめの 音。1回の 戦いで 1度だけ）: まぶしすぎる 光で つなぎが ぜんぶ ほどけ、みんなの HPが 1 に（負けには ならない）
//      → 場面（女王の 番の 動き SCENE。文は C11D_EIGHT_SCENE … A班の 台本）→ みんな 回復・みんなが 1つの 輪・「八つの音」が 出る・曲が かわる
//      「八つの音」: みんなが 1つの、ほどけない 輪に なり、eight.lock 回の 女王の 番の 間 光の はかりが きかない
//   7. 後半: 女王は ときどき「星の 名前を よぶ」（late.names 回の 番ごと。攻撃では ない ＝ 自分が 回復）。かがやきが 強く なる（late.shineK）
//   勝つと 女王は 手を 下ろす（HP 1 で 止まる。b.killed に 入れて 経験値・落とし物は ふつう）
//   （設計に ない 足し物: だれも えらんで いない〈完全オート・人が みんな たおれた〉時は、女王・中ボスの 受ける ダメージ autoK）
// ・ひとりの 時は、スピカと アルゴル（'algol'。戦いには 出ないが 手を つなげる 相手）と つなぐ
// ・自動の 仲間（酒場の 人・家族の 仲間・魔物の 仲間）は、人が えらんで いる 時だけ（someoneChooses）、女王の 戦いで つないで いない 人が いる 時の
//   3回に 1回 つなぐ。中ボスでは 3回に 1回 正しい 色を 鳴らす・思い出が 2 いじょう 消えて いれば よびかける。完全オートは どちらも しない
// ・戦いは、人が えらぶ 間 ずっと 待つ 形（b.tellAll）。b.mechBoss も 立てる（shared/ai.js の mechBoss）
// ・人数の 数え方は 第2章 第1幕と おなじ（battle-c10a.js の peopleOf10。魔物の 仲間は 半人ぶん）。bare … 味方が みんな 家族の キャラで 2人・3人
// ※ 戦いの 文に カイ・ソリトゥスの 名前・第1部と 第2部の ひみつ・八つめの 光が だれの 物かの 説明を 書かない（20-1。テストで 見る）。女王を 悪者の ことばに しない
import { MONSTERS } from './data/monsters.js';
import { ABILITIES } from './data/abilities.js';
import { C11D_MIRROR, C11D_MOON, C11D_QUEEN, MIRROR_SHORT, MOON_SHORT, QUEEN_SHORT } from './data/monsters-c11d.js';
import { HOLD, EIGHT, ROBE, BACK_HIT, STRIKE, MEASURE, SHINE, NAMES, SCENE, EIGHT_AFTER, EIGHT_SONG_NAME } from './data/abilities-c11d.js';
import { C11D_B as C11D } from './maps/c11d-flags.js';
// 八つめの 音の 場面の 文と 絵（A班の 台本）
import { C11D_EIGHT_SCENE } from './data/story-c11d.js';
import { NARASU } from './data/abilities-c10d.js';
import { YOBIKAKE } from './data/abilities-c11b.js';
import { TERU as TERU_ID } from './data/abilities-c9b.js';
import { COLOR_N, colorName, colorLabel, noteName } from './battle-c10d.js';
import { TRAP_KINDS } from './battle-earth.js';
import { canUse } from './ai.js';
import { peopleOf10, someoneChooses } from './battle-c10a.js';

export { HOLD, EIGHT, ROBE, STRIKE, MEASURE, SHINE, NAMES, SCENE, NARASU, YOBIKAKE };
// 場面の 文（{ lines: ['名前「文」' か 地の 文], arts: [絵の 名前 か null], ms: 1行の 長さ }。だれの 画面でも 同じ じゅん）
const SCENE_SRC = C11D_EIGHT_SCENE;
export const EIGHT_SCENE = {
  lines: SCENE_SRC.lines.map((x) => (x.who ? `${x.who}「${x.text}」` : x.text)),
  arts: SCENE_SRC.lines.map((x) => x.art || null),
  ms: SCENE_SRC.ms || 1500,
  bgm: SCENE_SRC.bgm || null,
  after: SCENE_SRC.after || null,
};
export const AUTO_EVERY = 3;
export const SPICA = 'spica';
export const ALGOL = 'algol';
export const SWEPT = 'c11dswept';
// スピカの さいごの ごほうび「八つの音のうた」
export const EIGHT_SONG_AT = 8;
export const EIGHT_SONG_HP = 0.2;
export const EIGHT_SONG_MP = 0.1;
// 女王が よぶ 星の 名前（ながした 星。こうげきでは ない）
export const STAR_NAMES = ['ミラ', 'カペラ', 'ベガ', 'デネブ', 'リゲル', 'レグルス', 'アンタレス', 'ポルックス', 'カストル', 'アルデバラン'];
// 輪の 色（名前の 横の しるし。client/battle-c11d.js と 同じ ならび）
export const RING_COLORS = 4;

const post = (ev) => (ev.postLines = ev.postLines || []);
const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || {} : a?.effect || {});
const flag = (b, f) => {
  try {
    return !!b.hooks?.leaderFlag?.(f);
  } catch {
    return false;
  }
};
const few = (arr, b, d) => (Array.isArray(arr) ? arr[peopleOf10(b) - 1] ?? d : d);
// 仲間なしの 少ない パーティー（味方が みんな 家族の キャラで 2人か 3人。ゲストの スピカは 味方に 入らない）
export function bareOf(b) {
  const al = (b?.allies || []).filter((a) => a.kind !== 'guest');
  return al.length >= 2 && al.length <= 3 && al.every((a) => a.kind === 'player') ? al.length : 0;
}
const hide = (o, k, v) => Object.defineProperty(o, k, { value: v, enumerable: false, configurable: true, writable: true });
const fighters = (b) => b.allies.filter((a) => a.kind !== 'guest');
// 戦いの 中に いる 味方（ながされて いない。ゲストを のぞく）
export const inFight = (b) => b.aliveAllies().filter((a) => a.kind !== 'guest' && !a.status?.rift);
export const isSolo = (b) => fighters(b).length === 1;
const queued = (b, id, choice) => b.queue.some((q) => q.cmd?.id === id && (choice === undefined || q.cmd.choice === choice));

// しかけの 数（人数で 合わせた もの）
export function c11dConf(species, b = null) {
  const c = MONSTERS[species]?.c11d || {};
  const f = c.few || {};
  const alone = b && isSolo(b) ? c.solo || {} : {};
  const n = bareOf(b);
  const bare = n && c.bare ? Object.fromEntries(Object.entries(c.bare).map(([k, v]) => [k, Array.isArray(v) ? v[n - 2] : v]).filter(([, v]) => v !== undefined)) : {};
  const pick = (k, d) => (alone[k] ?? bare[k] ?? (b ? few(f[k], b, d) : d));
  const mons = b && (b.allies || []).some((a) => a.kind === 'player') ? b.allies.filter((a) => a.kind === 'monster').length : 0;
  const out = {
    kind: c.kind, bare: n,
    hp: pick('hp', 1) * (1 + (c.monK?.hp || 0) * mons), atk: pick('atk', 1) * (1 + (c.monK?.atk || 0) * mons), spd: pick('spd', 1),
    autoK: pick('autoK', c.autoK ?? 1),
  };
  if (c.kind === 'duo') {
    Object.assign(out, {
      role: c.role, swap: pick('swap', c.swap ?? 3), backK: pick('backK', c.backK ?? 0.3), veilK: pick('veilK', c.veilK ?? 0.2), forgetK: pick('forgetK', c.forgetK ?? 0.25), max: c.max ?? 3,
    });
  }
  if (c.kind === 'queen') {
    Object.assign(out, {
      link: pick('link', c.link ?? 3),
      measure: { every: 4, first: 3, away: 2, back: 0.5, ...(c.measure || {}), every: pick('measure', c.measure?.every ?? 4), away: pick('away', c.measure?.away ?? 2) },
      shine: { every: 3, first: 2, loose: 1.5, held: 0.3, guardCut: 0.5, ...(c.shine || {}), every: pick('shineEvery', c.shine?.every ?? 3), loose: pick('loose', c.shine?.loose ?? 1.5), held: pick('held', c.shine?.held ?? 0.3) },
      late: { shineK: 1.2, names: 4, heal: 0.03, ...(c.late || {}) },
      eight: { uses: 2, lock: 4, heal: 0.15, ...(c.eight || {}) },
      glow: { ring: 0.03, ...(c.glow || {}) },
      strike: pick('strike', 1),
    });
  }
  return out;
}
export const c11dState = (b) => b?.c11d || null;
export const queenOf = (b) => (b?.c11d?.kind === 'queen' ? b.get(b.c11d.id) : null);
export const duoOf = (b, role = null) => {
  if (b?.c11d?.kind !== 'duo') return role ? null : [];
  if (role) return b.get(b.c11d.ids[role]);
  return Object.values(b.c11d.ids).map((id) => b.get(id)).filter(Boolean);
};
export const frontOf = (b) => (b?.c11d?.kind === 'duo' ? duoOf(b, b.c11d.front) : null);
const otherRole = (r) => (r === 'mirror' ? 'moon' : 'mirror');

// ───────────── はじめ（battle-c9b.js の setupC9b から。setupC11c の あと）─────────────
// かえす 値: スピカを 出すか（中ボス・女王の 戦いは かならず。てらす・星のうたも）
export function setupC11d(b, lines) {
  // スピカの さいごの ごほうび（前の 幕の b.c11rew と おなじ 形）
  if (flag(b, C11D.act4)) b.c11rew = { ...(b.c11rew || {}), eight: true };
  const duo = b.enemies.filter((e) => MONSTERS[e.species]?.c11d?.kind === 'duo');
  const queen = b.enemies.find((e) => e.species === C11D_QUEEN);
  if (!duo.length && !queen) return false;
  b.c9songOn = true;
  b.mechBoss = true;
  // 人が えらんで いる 間は、敵も 味方も 時間を 止める（前の 幕と おなじ）
  b.tellAll = true;
  for (const a of b.allies) hide(a, '_b11d', b);
  if (queen) setupQueen(b, queen, lines);
  else setupDuo(b, duo, lines);
  b.tell = c11dTell(b);
  return true;
}
function scale(e, cf) {
  if (cf.hp !== 1) e.maxHp = e.hp = Math.max(1, Math.round(e.maxHp * cf.hp));
  if (cf.atk !== 1) e.dmgRate = cf.atk;
  if (cf.spd !== 1) e.speed = (e.speed || 1) * cf.spd;
}
const addCmd = (b, id) => { for (const a of b.allies) if (!a.abilities.includes(id)) a.abilities = [id, ...a.abilities]; };

// ── 鏡と月の使い ──
function setupDuo(b, duo, lines) {
  const ids = {};
  for (const e of duo) {
    const cf = c11dConf(e.species, b);
    scale(e, cf);
    hide(e, '_b11d', b);
    ids[cf.role] = e.id;
    e.c11u = { role: cf.role, down: false };
  }
  const cf = c11dConf(C11D_MIRROR, b);
  b.c11d = {
    kind: 'duo', ids, front: 'mirror', fronts: 0, swapReady: false, veil: [], lastVeil: null, open: false,
    forget: 0, max: cf.max, robeReady: false, won: false, lost: false, acts: 0,
    swaps: 0, rings: 0, hits: 0, misses: 0, breaks: 0, robes: 0, calls: 0, wasted: 0, autoRings: 0, autoCalls: 0, peak: 0, frontHits: { mirror: 0, moon: 0 }, backHits: 0,
  };
  veilUp(b);
  addCmd(b, YOBIKAKE);
  addCmd(b, NARASU);
  lines.push(
    `${MIRROR_SHORT}「ふわぁ…。また、光の弱い者たちが、のぼってきたか。」`,
    `${MOON_SHORT}「ひめさま。こんどこそ、おむかえにあがりました。」`,
    `（前に出ているほうのしかけだけが、きく！今は${MIRROR_SHORT}が前。まくの色は${colorLabel(b.c11d.veil[0])}。同じ色の「音を鳴らす」で、まくがわれる！）`,
  );
}
// ミラーレの 色の まく（前の 色と かさならない 1色）
function veilUp(b) {
  const st = b.c11d;
  const pool = [...Array(COLOR_N).keys()].filter((i) => i !== st.lastVeil);
  st.veil = [pool[b.rng.int(0, pool.length - 1)]];
  st.lastVeil = st.veil[0];
  st.open = false;
}

// ── かがやきの女王ポラリス ──
function setupQueen(b, q, lines) {
  const cf = c11dConf(C11D_QUEEN, b);
  scale(q, cf);
  hide(q, '_b11d', b);
  b.c11d = {
    kind: 'queen', id: q.id, won: false, acts: 0, phase: 1,
    rings: [], nextRing: 1, lock: 0,
    measureLeft: cf.measure.first, measureReady: false, measureAim: null, shineLeft: cf.shine.first, shineReady: false, namesLeft: cf.late.names,
    eightPending: false, sceneQueued: false, eightDone: false, eightLeft: 0, names: 0,
    holds: 0, autoHolds: 0, refresh: 0, merges: 0, breaksUp: 0, measures: 0, measureHeld: 0, measureLock: 0, sweeps: 0, returns: 0,
    shines: 0, shineLoose: 0, shineHeld: 0, eights: 0, heals: 0, ringMax: 0, sceneAt: null, holdsBefore: 0,
  };
  // 光の 川に ながされる（battle-earth.js の 地われと おなじ status.rift。kind だけ ちがう）。「手をのばす」でも もどれる
  TRAP_KINDS[SWEPT] = SWEPT_TEXT;
  // 自動の 仲間は 手を のばさない（完全オートは ながされた まま。人は 画面の「手をのばす」で 引きもどせる）
  b.n1NoReach = true;
  addCmd(b, HOLD);
  lines.push(
    `${QUEEN_SHORT}「きまりは、だれにも同じです。」`,
    `${QUEEN_SHORT}「いちばん弱い光から、はかりましょう。…ひとりで立っている光は、ながされます。」`,
    `（「手をつなぐ」で、仲間とつながろう！つないでいれば、光のはかりでながされない！${isSolo(b) ? 'スピカやアルゴルとも、つなげるよ。' : 'スピカとも、つなげるよ。'}）`,
  );
}
// ながされた 人（status.rift の kind 'c11dswept'）の 文と 番
export const SWEPT_TEXT = {
  name: 'ながされ',
  turn(b, c, ev) {
    const s = c.status.rift;
    ev.name = 'ながされ';
    ev.fx = { type: 'n1RiftTurn', actor: c.id, kind: SWEPT };
    s.turns--;
    if (s.turns > 0) {
      ev.lines.push(`${c.name}は、光の川の中で、みんなの声をさがしている…。（もどるまで、あと${s.turns}回）`);
      ev.upd.push(c);
      return;
    }
    backFromRiver(b, c, ev);
    ev.lines.push(`${c.name}が、光の川から、もどってきた！`);
    ev.atbAfter = 60;
  },
  reach(t, c) {
    return [`${t.name}は、${c.name}の手をつかんで、光の川から、もどってきた！`];
  },
  free(x) { return `${x.name}が、光の川から、もどってきた！`; },
};
function backFromRiver(b, c, ev) {
  if (c.status?.rift?.kind === SWEPT) delete c.status.rift;
  const cf = b.c11d?.kind === 'queen' ? c11dConf(C11D_QUEEN, b) : null;
  if (cf) c.hp = Math.max(c.hp, Math.max(1, Math.round(c.maxHp * cf.measure.back)));
  if (b.c11d) b.c11d.returns++;
  ev.c11dReturn = { id: c.id };
  ev.upd.push(c);
}

// ───────────── 輪（手を つないだ 人の まとまり）─────────────
// 輪: { id, m: [味方の id・'spica'・'algol'], left（ほどけるまでの 女王の 番）, color（0〜3）, lock（八つの音 … ほどけない のこりの 番）}
const memberOk = (b, id) => id === SPICA || id === ALGOL || (b.get(id)?.alive && !b.get(id)?.status?.rift);
export function ringOf(b, id) {
  const st = b?.c11d;
  if (!st || st.kind !== 'queen') return null;
  return st.rings.find((r) => r.m.includes(id) && r.m.length >= 2) || null;
}
export const linked = (b, id) => !!ringOf(b, id);
// つないで いない 人（戦いの 中に いる 味方）
export const looseAllies = (b) => (b?.c11d?.kind === 'queen' ? inFight(b).filter((a) => !linked(b, a.id)) : []);
// 輪を きれいに する（たおれた・ながされた 人を ぬく。2人 より 少ない 輪は ほどける）
function tidyRings(b) {
  const st = b.c11d;
  for (const r of st.rings) r.m = r.m.filter((id) => memberOk(b, id));
  st.rings = st.rings.filter((r) => r.m.length >= 2 && (r.m.some((id) => id !== SPICA && id !== ALGOL)));
}
function freeColor(st) {
  const used = new Set(st.rings.map((r) => r.color));
  for (let i = 0; i < RING_COLORS; i++) if (!used.has(i)) return i;
  return st.nextRing % RING_COLORS;
}
// 手を つなぐ（a と t の 輪を 1つに。のこりの 番は もとに もどる）
function join(b, a, t) {
  const st = b.c11d;
  const cf = c11dConf(C11D_QUEEN, b);
  const ra = st.rings.find((r) => r.m.includes(a));
  const rt = st.rings.find((r) => r.m.includes(t));
  const m = [...new Set([...(ra ? ra.m : [a]), ...(rt ? rt.m : [t])])];
  const was = Math.max(ra?.m.length || 1, rt?.m.length || 1);
  const color = ra ? ra.color : rt ? rt.color : freeColor(st);
  const lock = Math.max(ra?.lock || 0, rt?.lock || 0);
  st.rings = st.rings.filter((r) => r !== ra && r !== rt);
  const ring = { id: st.nextRing++, m, left: Math.max(cf.link, ra?.left || 0, rt?.left || 0), color, lock };
  if (ra && rt && ra !== rt) st.merges++;
  if (ra && ra === rt) st.refresh++;
  ring.left = cf.link;
  st.rings.push(ring);
  st.ringMax = Math.max(st.ringMax, m.length);
  return { ring, grew: m.length > was };
}
export function ringName(b, id) {
  if (id === SPICA) return 'スピカ';
  if (id === ALGOL) return 'アルゴル';
  return b.get(id)?.name || '？';
}

// ───────────── 今 前ぶれ中か（battle-tell.js の b.tell。battle-c9b.js の c9bTell から）─────────────
// 中ボス: 'swap' … 入れかわる 前ぶれ・'robe' … わすれの衣・'duo' … いつも 待つ ／ 女王: 'eight' … 八つめの 音・'measure' … 光の はかり・'shine' … かがやき・'queen' … いつも 待つ
export function c11dTell(b) {
  const st = b?.c11d;
  if (!st || st.won || st.lost) return null;
  if (st.kind === 'duo') {
    if (!duoOf(b).some((e) => e.alive && !e.c11u.down)) return null;
    return st.robeReady ? 'robe' : st.swapReady ? 'swap' : 'duo';
  }
  if (!queenOf(b)?.alive) return null;
  if (st.eightPending || st.sceneQueued || st.afterQueued) return 'eight';
  return st.measureReady ? 'measure' : st.shineReady ? 'shine' : 'queen';
}

// ───────────── 1回 動いた あと（battle-c9a.js の c9aAfter。味方・敵 どちらも）─────────────
export function c11dAfter(b, c, ev) {
  const st = b.c11d;
  if (!st || st.won || st.lost || !c || b.pendingEnd || b.over) return;
  if (st.kind === 'duo') {
    // 星のうた: ミラーレが 前で まくが ある 時は、まくが 消える
    if (ev.c9dSong && st.front === 'mirror' && st.veil.length && !duoOf(b, 'mirror')?.c11u?.down) {
      const col = st.veil[0];
      breakVeil(b, ev, `スピカの歌で、${colorName(col)}のまくが、すうっと消えた！`);
    }
    return;
  }
  tidyRings(b);
  // スピカの「てらす」: スピカと つないだ 輪の 人数ぶん 光が 強い
  if (ev.c9bTeru) glowRing(b, ev, 2);
  // 八つめの 音: まぶしすぎる 光（HPが 半分に なった 行動の すぐ あと）→ 場面を 女王の 番の いちばん 前に
  if (st.eightPending && !st.sceneQueued) dazzle(b, ev);
}
function dazzle(b, ev) {
  const st = b.c11d;
  const q = queenOf(b);
  if (!q) return;
  st.sceneQueued = true;
  st.sceneAt = b.time;
  st.holdsBefore = st.holds;
  st.rings = [];
  st.measureReady = false;
  st.measureAim = null;
  st.shineReady = false;
  q.telegraph = null;
  for (const a of fighters(b)) {
    if (!a.alive || a.status?.rift) continue;
    a.hp = 1;
    a.defending = false;
    ev.upd.push(a);
  }
  b.queue.unshift({ id: q.id, cmd: { type: 'ability', id: SCENE, target: q.id }, last: false });
  post(ev).push(
    `${QUEEN_SHORT}のからだが、まぶしすぎるほど、光った…！`,
    'つないだ手が、ぜんぶ、ほどけてしまった！みんなのHPが1になった…！',
  );
  ev.c11dDazzle = { id: q.id };
  ev.upd.push(q);
  ev.warn = true;
  ev.extraLock = (ev.extraLock || 0) + 900;
}

// ───────────── 行動の はじめ（battle-c9b.js の c9bTurnStart から。敵の 番だけ）─────────────
export function c11dTurnStart(b, c, ev, stuck) {
  const st = b.c11d;
  if (!st || c.side === 'ally' || st.won || st.lost) return;
  if (st.kind === 'duo') {
    if (!c.c11u || c.telegraph) return;
    return duoTurn(b, c, ev, stuck);
  }
  if (c.id !== st.id || c.telegraph || st.sceneQueued || st.afterQueued) return;
  return queenTurn(b, c, ev, stuck);
}

// ── 鏡と月の使い ──
function duoTurn(b, c, ev, stuck) {
  const st = b.c11d;
  const role = c.c11u.role;
  if (c.c11u.down) {
    c.telegraph = 'm_nothing';
    return;
  }
  st.acts++;
  ev.upd.push(c);
  if (stuck) return;
  const other = duoOf(b, otherRole(role));
  const otherUp = !!other?.alive && !other.c11u.down;
  if (role !== st.front) {
    c.telegraph = BACK_HIT[role];
    return;
  }
  const cf = c11dConf(c.species, b);
  if (st.swapReady && otherUp) {
    swapFront(b, c, other, ev);
    c.telegraph = BACK_HIT[role];
    return;
  }
  st.swapReady = false;
  st.fronts++;
  if (role === 'moon') {
    if (st.robeReady) {
      c.telegraph = ROBE;
      swapWarn(b, cf, other, otherUp, ev);
      return;
    }
    if (st.fronts === 1) {
      st.robeReady = true;
      const left = st.max - st.forget;
      ev.lines.push(`${MOON_SHORT}が、うすい衣を、ふわりとひろげた…！`, `（次に、スピカに「わすれの衣」がかかる！思い出が、あと${left - 1}になる…。「よびかける」で、スピカの名前をよぼう！）`);
      ev.c11dRobeUp = { id: c.id, forget: st.forget };
      ev.warn = true;
    }
  }
  swapWarn(b, cf, other, otherUp, ev);
}
function swapWarn(b, cf, other, otherUp, ev) {
  const st = b.c11d;
  if (st.fronts < cf.swap || !otherUp || st.swapReady) return;
  st.swapReady = true;
  post(ev).push(`（${other.name}が、うしろで、じっとまっている…。次は、${other.name}が前に出てくる！）`);
  ev.c11dSwapUp = { next: other.c11u.role };
  ev.warn = true;
}
function swapFront(b, c, other, ev) {
  const st = b.c11d;
  st.front = other.c11u.role;
  st.fronts = 0;
  st.swapReady = false;
  st.robeReady = false;
  st.swaps++;
  if (st.front === 'mirror') veilUp(b);
  ev.lines.push(`${c.name}が、すっと、うしろへ下がった。${other.name}が、前に出てきた！`);
  post(ev).push(st.front === 'mirror'
    ? `（${MIRROR_SHORT}が前！まくの色は${colorLabel(st.veil[0])}。同じ色の「音を鳴らす」で、まくがわれる！）`
    : `（${MOON_SHORT}が前！わすれの衣が来る。スピカに「よびかける」で、思い出をとりもどそう！）`);
  ev.c11dSwap = { front: st.front, veil: st.veil.slice() };
  ev.warn = true;
  ev.upd.push(other);
}
function breakVeil(b, ev, line) {
  const st = b.c11d;
  st.veil = [];
  st.open = true;
  st.breaks++;
  const m = duoOf(b, 'mirror');
  post(ev).push(line, `パリーン！${MIRROR_SHORT}のまくが、われた！（今なら、こうげきが通る！）`);
  ev.c11dBreak = { id: m?.id };
  ev.warn = true;
  if (m) ev.upd.push(m);
}

// ── 女王 ──
function queenTurn(b, c, ev, stuck) {
  const st = b.c11d;
  const cf = c11dConf(C11D_QUEEN, b);
  st.acts++;
  ev.upd.push(c);
  // 輪の のこりは 女王の 番ごとに へる（前ぶれの 技を 出す 番も。前ぶれの 文は「はなれそう」も 言う）
  tickRings(b, ev, cf);
  if (st.lock > 0) {
    st.lock--;
    if (!st.lock) post(ev).push('（八つの音の輪が、ふつうの輪にもどった。つなぎ直そう）');
  }
  if (stuck) return;
  if (st.measureReady) {
    c.telegraph = MEASURE;
    return;
  }
  if (st.shineReady) {
    c.telegraph = SHINE;
    return;
  }
  if (st.phase === 2) {
    st.namesLeft--;
    if (st.namesLeft <= 0) {
      st.namesLeft = cf.late.names;
      c.telegraph = NAMES;
      return;
    }
  }
  st.measureLeft--;
  st.shineLeft--;
  if (st.measureLeft <= 0) {
    st.measureLeft = cf.measure.every;
    measureUp(b, c, ev);
  } else if (st.shineLeft <= 0) {
    st.shineLeft = cf.shine.every;
    st.shineReady = true;
    const loose = looseAllies(b);
    ev.lines.push(`${QUEEN_SHORT}のかんむりが、ゆっくりと、まぶしく光りはじめた…！`, `（次に「かがやき」が来る！手をつないでいない人には、とても大きなダメージ！${loose.length ? `今、つないでいないのは${loose.map((x) => x.name).join('・')}。` : ''}）`);
    ev.c11dShineUp = { id: c.id, loose: loose.map((x) => x.id) };
    ev.warn = true;
  }
}
// 輪の のこりの 番を へらす（女王の 番ごと）
function tickRings(b, ev, cf) {
  const st = b.c11d;
  tidyRings(b);
  const gone = [];
  for (const r of st.rings) {
    if (r.lock > 0) {
      r.lock--;
      if (!r.lock) r.left = Math.min(r.left, cf.link);
      continue;
    }
    r.left--;
    if (r.left <= 0) gone.push(r);
    else if (r.left === 1) {
      post(ev).push(`（${r.m.map((id) => ringName(b, id)).join('と')}の手が、はなれそう…！もう一度「手をつなぐ」で、つなぎ直そう）`);
      ev.c11dRingWarn = { m: r.m.slice() };
    }
  }
  for (const r of gone) {
    st.rings = st.rings.filter((x) => x !== r);
    st.breaksUp++;
    post(ev).push(`${r.m.map((id) => ringName(b, id)).join('と')}の、つないだ手が、はなれてしまった…。`);
    ev.c11dRingOff = { m: r.m.slice() };
  }
  if (gone.length) ev.warn = true;
}
// 光の はかりの 前ぶれ（いちばん HPの わりあいが 低い 人）
function lowest(b) {
  return inFight(b).slice().sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0] || null;
}
function measureUp(b, c, ev) {
  const st = b.c11d;
  const t = lowest(b);
  if (!t) return;
  st.measureReady = true;
  st.measureAim = t.id;
  // 次の 女王の 番の はじめに 輪の のこりが 1 へる ので、のこり 1 の 輪は はかりの 前に ほどける
  const r = ringOf(b, t.id);
  ev.lines.push(`${QUEEN_SHORT}が、光のはかりを、高くかかげた…！`, st.lock > 1
    ? `（はかられるのは${t.name}。でも、八つの音の輪がある！はかりは、きかない）`
    : r && r.left > 1 ? `（はかられるのは${t.name}。手をつないでいるから、ながされない！そのまま、つないでいよう）`
      : r ? `（はかられるのは${t.name}！つないだ手が、はなれそう…！もう一度「手をつなぐ」で、つなぎ直そう！）` : `（はかられるのは${t.name}！だれかと「手をつなぐ」で、ながされない！）`);
  ev.c11dMeasureUp = { id: c.id, aim: t.id };
  ev.warn = true;
  ev.upd.push(t);
}

// ───────────── 技の こうか（battle-c9b.js の c9bEffect の のこり。この 幕の 戦いでは「音を鳴らす」「よびかける」も 先に 受ける）─────────────
export function c11dEffect(b, c, a, eff, ev) {
  const st = b.c11d;
  switch (eff.type) {
    case 'c10dRing':
      if (st?.kind !== 'duo') return false;
      ring(b, c, ev);
      return true;
    case 'c11bCall':
      if (st?.kind !== 'duo') return false;
      call(b, c, ev);
      return true;
    case 'c11dRobe': robe(b, c, ev); return true;
    case 'c11dStrike': strike(b, c, eff, ev); return true;
    case 'c11dMeasure': measure(b, c, ev); return true;
    case 'c11dShine': shine(b, c, ev); return true;
    case 'c11dNames': names(b, c, ev); return true;
    case 'c11dEightScene': eightScene(b, c, ev); return true;
    case 'c11dEightAfter': eightAfter(b, c, ev); return true;
    case 'c11dHold': hold(b, c, ev); return true;
    case 'c11dEight': eight(b, c, ev); return true;
    default: return false;
  }
}
// 音を鳴らす（中ボス。cmd.choice … 色）
function ring(b, c, ev) {
  const st = b.c11d;
  const ch = b.curCmd?.choice;
  const col = Number.isInteger(ch) && ch >= 0 && ch < COLOR_N ? ch : st.veil[0] ?? 0;
  ev.fx = { type: 'ability', anim: 'c10d_ring', actor: c.id, targets: [c.id], side: 'ally', color: col };
  ev.lines.length = 0;
  ev.lines.push(`${c.name}は、星の音「${noteName(col)}」を鳴らした！${colorName(col)}の光が、ひろがっていく…！`);
  st.rings++;
  if (c.kind !== 'player') st.autoRings++;
  const m = duoOf(b, 'mirror');
  if (st.won || st.lost) {
    ev.lines.push('しかし、何も起こらなかった。');
    ev.c11dRing = { id: c.id, color: col, ok: false };
    return;
  }
  if (st.front !== 'mirror' || m?.c11u?.down) {
    st.misses++;
    post(ev).push(`…音が、とどかない。（${MIRROR_SHORT}は、うしろにいる。今は${MOON_SHORT}が前！）`);
    ev.c11dRing = { id: c.id, color: col, ok: false, why: 'back' };
    return;
  }
  if (!st.veil.length) {
    st.misses++;
    post(ev).push(`（${MIRROR_SHORT}のまくは、もう、われている！今のうちに、こうげき！）`);
    ev.c11dRing = { id: c.id, color: col, ok: false, why: 'open' };
    return;
  }
  if (!st.veil.includes(col)) {
    st.misses++;
    post(ev).push(`…音が、合わない…。（まくの色は${colorLabel(st.veil[0])}。同じ色の音を鳴らそう）`);
    ev.c11dRing = { id: c.id, color: col, ok: false, why: 'color' };
    return;
  }
  st.hits++;
  breakVeil(b, ev, `${colorName(col)}の音が、まくにひびいた！`);
  ev.c11dRing = { id: c.id, color: col, ok: true };
}
// よびかける（中ボス。cmd.choice … 'spica' か 味方の id。ない 時は スピカ）
function call(b, c, ev) {
  const st = b.c11d;
  ev.lines.length = 0;
  const ch = b.curCmd?.choice ?? SPICA;
  const ob = duoOf(b, 'moon');
  if (ob) ev.upd.push(ob);
  ev.fx = { type: 'ability', anim: 'c11b_call', actor: c.id, targets: [c.id], side: 'ally' };
  if (c.kind !== 'player') st.autoCalls++;
  if (st.won || st.lost) {
    ev.lines.push(`${c.name}は、大きな声でよびかけた！`, 'しかし、何も起こらなかった。');
    ev.c11dCall = { id: c.id, to: ch, ok: false };
    return;
  }
  if (ch !== SPICA) {
    const t = b.get(ch);
    st.wasted++;
    ev.lines.push(`${c.name}は、${t?.name || '仲間'}の名前を、大きな声でよんだ！`, `${t?.name || '仲間'}は、げんきに、へんじをした。（スピカの名前をよぼう）`);
    ev.c11dCall = { id: c.id, to: ch, ok: false };
    return;
  }
  ev.lines.push(`${c.name}は、スピカの名前を、大きな声でよんだ！「スピカ！」`);
  if (st.forget > 0) {
    st.forget--;
    st.calls++;
    const left = st.max - st.forget;
    ev.lines.push(`スピカ「…${c.name}…？　…うん、おぼえてる！」`, `スピカの思い出が、1つもどった！（スピカの思い出　あと${left}）`);
    if (!st.forget) post(ev).push(`（わすれの衣が、${MOON_SHORT}からはがれた！${st.front === 'moon' ? 'こうげきが通る！' : ''}）`);
    ev.c11dCall = { id: c.id, to: SPICA, ok: true, forget: st.forget, left };
    return;
  }
  st.wasted++;
  ev.lines.push('スピカは、にっこりわらった。（思い出は、まだ消えていない）');
  ev.c11dCall = { id: c.id, to: SPICA, ok: false, forget: 0, left: st.max };
}
// わすれの 衣（オボロが 前の 時だけ）
function robe(b, c, ev) {
  const st = b.c11d;
  if (!st || st.kind !== 'duo') return;
  st.robeReady = false;
  if (st.front !== 'moon' || c.c11u?.down) {
    ev.lines.push('しかし、衣は、とどかなかった。');
    return;
  }
  st.robes++;
  st.forget = Math.min(st.max, st.forget + 1);
  st.peak = Math.max(st.peak, st.forget);
  const left = st.max - st.forget;
  ev.fx = { type: 'ability', anim: 'c11o_robe', actor: c.id, targets: [c.id], side: 'enemy' };
  ev.lines.push('うすい衣が、スピカに、ふわりとかかった…。');
  ev.c11dRobe = { id: c.id, forget: st.forget, left };
  ev.warn = true;
  ev.upd.push(c);
  if (left <= 0) {
    st.lost = true;
    post(ev).push('スピカ「……。」', 'スピカは、何も言わずに、雲の車のほうへ、歩いていく…。', 'スピカは、雲の車に、つれていかれてしまった…。');
    ev.c11dTaken = { id: c.id };
    b.pendingEnd = { outcome: 'lose' };
    b.queue = [];
    return;
  }
  ev.lines.push(left === 1 ? 'スピカ「…あなたたち、だあれ…？　…ううん、知ってる…はず…」' : 'スピカ「…あれ？　わたし、どうして、ここに…？」');
  post(ev).push(`（スピカの思い出　あと${left}。思い出が消えている間、${MOON_SHORT}は衣につつまれて、こうげきが通りにくい！）`);
}
// 女王の ふつうの 攻撃（ながされた 人は ねらわない）
function strike(b, c, eff, ev) {
  const cf = c11dConf(C11D_QUEEN, b);
  const pool = inFight(b);
  if (!pool.length) {
    ev.lines.push(`${QUEEN_SHORT}は、しずかに、光のしゃくを下ろした。`);
    return;
  }
  // 光の 雨（全体の 魔法。ながされた 人には とどかない）
  if (eff.aoe) {
    ev.fx = { type: 'ability', anim: 'c11q_rain', actor: c.id, targets: pool.map((x) => x.id), side: 'enemy', element: 'light' };
    ev.lines.length = 0;
    ev.lines.push(`${c.name}が、光のしゃくを、高くかかげた。光の雨が、ふりそそいだ！`);
    for (const t of pool) {
      const r = b.calcMagic(c, t, { base: eff.base, thr: 99, element: 'light' }, 1);
      if (r.dmg > 0 && !r.resisted) b.damage(c, t, Math.max(1, Math.round(r.dmg * cf.strike)), ev, { element: 'light' });
    }
    return;
  }
  const t0 = b.get(b.curCmd?.target);
  const t = t0 && pool.includes(t0) ? t0 : b.rng.pick(pool);
  ev.fx = { type: 'ability', anim: 'c11q_strike', actor: c.id, targets: [t.id], side: 'enemy' };
  ev.lines.length = 0;
  ev.lines.push(`${c.name}が、光のしゃくを、${t.name}に、まっすぐにふりおろした。`);
  b.physHit(c, t, { mult: (eff.mult ?? 0.9) * cf.strike, acc: 9 }, ev, 'phys');
}
// 光の はかり（前ぶれの ねらい。いなければ 今 いちばん HPの わりあいが 低い 人）
function measure(b, c, ev) {
  const st = b.c11d;
  if (!st || st.kind !== 'queen') return;
  const cf = c11dConf(C11D_QUEEN, b);
  st.measureReady = false;
  const t0 = b.get(st.measureAim);
  const t = t0?.alive && !t0.status?.rift ? t0 : lowest(b);
  st.measureAim = null;
  ev.lines.length = 0;
  ev.lines.push(`${QUEEN_SHORT}「…はかります。」`);
  if (!t) return;
  st.measures++;
  ev.fx = { type: 'ability', anim: 'c11q_measure', actor: c.id, targets: [t.id], side: 'enemy' };
  if (st.lock > 0) {
    st.measureLock++;
    ev.lines.push(`光のはかりが、${t.name}をはかろうとした…。でも、八つの音の輪が、はかりを、やさしくおしもどした！`);
    ev.c11dMeasure = { id: c.id, to: t.id, held: true, lock: true };
    return;
  }
  if (linked(b, t.id)) {
    st.measureHeld++;
    const r = ringOf(b, t.id);
    ev.lines.push(`光のはかりが、${t.name}をはかった…！`, `${t.name}「手が、はなれない！」`, `${r.m.filter((id) => id !== t.id).map((id) => ringName(b, id)).join('と')}が、しっかりと手をにぎっている！${t.name}は、ながされなかった！`);
    ev.c11dMeasure = { id: c.id, to: t.id, held: true };
    ev.upd.push(t);
    return;
  }
  sweep(b, c, t, ev, cf);
  ev.c11dMeasure = { id: c.id, to: t.id, held: false };
}
// ながされる（地われと おなじ 形で 動けなく する）
function sweep(b, q, t, ev, cf) {
  const st = b.c11d;
  t.status.rift = { turns: cf.measure.away, by: q.id, kind: SWEPT };
  for (const x of b.queue) if (x.id === t.id && x.cmd?.type === 'dual') b.releasePartners(x.cmd);
  b.queue = b.queue.filter((x) => x.id !== t.id);
  if (t.waitDual) b.endWait(t, null, false);
  for (const inv of [...b.invites.values()]) if (inv.from === t.id || inv.to === t.id || inv.partners?.includes(t.id)) b.endInvite(inv, '動けない');
  Object.assign(t, { ready: false, queued: false, defending: false, cover: null, atb: 0 });
  st.sweeps++;
  tidyRings(b);
  ev.lines.push(`${t.name}は、だれとも手をつないでいなかった…！`, `${t.name}は、光の川に、ながされてしまった！`);
  post(ev).push(`（${t.name}は、${cf.measure.away}回の番の間、戦いの外。もどると、HPは半分。つないでいれば、ながされなかった…）`);
  ev.c11dSweep = { id: t.id, turns: cf.measure.away };
  ev.warn = true;
  ev.upd.push(t);
}
// かがやき（全体。つないで いない 人は 大きな ダメージ）
function shine(b, c, ev) {
  const st = b.c11d;
  if (!st || st.kind !== 'queen') return;
  const cf = c11dConf(C11D_QUEEN, b);
  st.shineReady = false;
  st.shines++;
  const ts = inFight(b);
  ev.fx = { type: 'ability', anim: 'c11q_shine', actor: c.id, targets: ts.map((x) => x.id), side: 'enemy', element: 'light' };
  ev.lines.length = 0;
  ev.lines.push(st.phase === 2 ? `${QUEEN_SHORT}が、もっと強く、かがやいた！` : `${QUEEN_SHORT}が、まぶしく、かがやいた！`);
  const k = st.phase === 2 ? cf.late.shineK : 1;
  const held = [];
  const loose = [];
  for (const t of ts) {
    const on = linked(b, t.id);
    (on ? held : loose).push(t);
    const mult = (on ? cf.shine.held : cf.shine.loose) * k * (t.defending ? cf.shine.guardCut : 1);
    b.physHit(c, t, { mult, acc: 9 }, ev, 'phys');
  }
  st.shineLoose += loose.length;
  st.shineHeld += held.length;
  if (held.length) post(ev).push(`（手をつないでいた${held.map((x) => x.name).join('と')}は、光をわけあって、こらえた！）`);
  if (loose.length) post(ev).push(`（${loose.map((x) => x.name).join('と')}は、ひとりで、まぶしい光をあびてしまった…）`);
  ev.c11dShine = { id: c.id, held: held.map((x) => x.id), loose: loose.map((x) => x.id) };
  ev.warn = true;
}
// 星の 名前を よぶ（後半。こうげきでは ない ＝ 女王が 少し 回復）
function names(b, c, ev) {
  const st = b.c11d;
  const cf = c11dConf(C11D_QUEEN, b);
  const nm = STAR_NAMES[st.names % STAR_NAMES.length];
  st.names++;
  const h = Math.min(c.maxHp - c.hp, Math.max(1, Math.round(c.maxHp * cf.late.heal)));
  ev.lines.length = 0;
  ev.lines.push(`${QUEEN_SHORT}は、目をとじて、星の名前を、1つよんだ。`, `${QUEEN_SHORT}「…${nm}。」`);
  if (h > 0) {
    c.hp += h;
    st.heals += h;
    ev.results = ev.results || [];
    ev.results.push({ id: c.id, heal: h });
    post(ev).push(`（ながした星の名前を、女王は、ぜんぶおぼえている…。${QUEEN_SHORT}のHPが${h}回復した）`);
  }
  ev.fx = { type: 'ability', anim: 'c11q_names', actor: c.id, targets: [c.id], side: 'enemy' };
  ev.c11dNames = { id: c.id, name: nm, heal: h };
  ev.upd.push(c);
}
// 八つめの 音の 場面（まぶしすぎる 光の あと。女王の 番の 動き … 1回の 戦いで 1度だけ）
function eightScene(b, c, ev) {
  const st = b.c11d;
  if (!st || st.kind !== 'queen' || st.eightDone) return;
  const cf = c11dConf(C11D_QUEEN, b);
  st.sceneQueued = false;
  st.eightPending = false;
  st.eightDone = true;
  st.phase = 2;
  st.eightLeft = cf.eight.uses;
  st.measureLeft = cf.measure.first;
  st.shineLeft = cf.shine.first + 1;
  st.namesLeft = cf.late.names;
  ev.lines.length = 0;
  ev.fx = { type: 'ability', anim: 'c11q_eight', actor: c.id, targets: [c.id], side: 'enemy' };
  // 場面（文は 画面の まん中に じゅんに 出す）の あいだ 戦いは 止まる。回復は 場面の あと（つぎの 女王の 番の 動き AFTER）
  const lines = EIGHT_SCENE.lines.slice();
  ev.lines.push('……。');
  ev.c11dEight = { id: c.id, lines, arts: EIGHT_SCENE.arts.slice(), ms: EIGHT_SCENE.ms };
  ev.extraLock = (ev.extraLock || 0) + lines.length * EIGHT_SCENE.ms;
  ev.warn = true;
  ev.upd.push(c);
  st.afterQueued = true;
  b.queue.unshift({ id: c.id, cmd: { type: 'ability', id: EIGHT_AFTER, target: c.id }, last: false });
}
// 八つめの 音が とどく（場面の あと。みんな 回復・1つの 輪・八つの音）
function eightAfter(b, c, ev) {
  const st = b.c11d;
  if (!st || st.kind !== 'queen' || !st.afterQueued) return;
  st.afterQueued = false;
  const cf = c11dConf(C11D_QUEEN, b);
  ev.lines.length = 0;
  ev.fx = { type: 'ability', anim: 'c11d_eight', actor: c.id, targets: fighters(b).map((a) => a.id), side: 'ally' };
  // ながされた 人も もどる・たおれた 人も 起きあがる・みんな 回復
  ev.results = ev.results || [];
  for (const a of fighters(b)) {
    if (a.status?.rift?.kind === SWEPT) delete a.status.rift;
    if (!a.alive && !a.fled) Object.assign(a, { alive: true, atb: 0, status: {}, ready: false, queued: false });
    if (!a.alive) continue;
    const h = a.maxHp - a.hp;
    a.hp = a.maxHp;
    if (h > 0) ev.results.push({ id: a.id, heal: h });
    ev.upd.push(a);
  }
  // みんなが 1つの 輪
  const members = [...inFight(b).map((a) => a.id), SPICA, ...(isSolo(b) ? [ALGOL] : [])];
  st.rings = [{ id: st.nextRing++, m: members, left: cf.link, color: 0, lock: 0 }];
  st.ringMax = Math.max(st.ringMax, members.length);
  addCmd(b, EIGHT);
  ev.lines.push('八つめの音が、とどいた！', 'みんなのHPが、ぜんぶ回復した！みんなが、1つの輪になった！');
  post(ev).push('（「八つの音」が、使えるようになった！苦しい時に、みんなで鳴らそう。戦いで2回まで）');
  ev.c11dEightAfter = { id: c.id, ring: members.slice() };
  ev.warn = true;
  ev.upd.push(c);
}
// 手をつなぐ（だれでも。cmd.choice … 味方の id・'spica'・ひとりの 時は 'algol'。ない 時は スピカ）
function hold(b, c, ev) {
  const st = b.c11d;
  ev.lines.length = 0;
  const q = queenOf(b);
  if (q) ev.upd.push(q);
  for (const a of b.allies) ev.upd.push(a);
  const ch = b.curCmd?.choice ?? SPICA;
  if (!st || st.kind !== 'queen' || st.won) {
    ev.lines.push(`${c.name}は、手をのばした。`, 'しかし、何も起こらなかった。');
    ev.c11dHold = { id: c.id, to: ch, ok: false };
    return;
  }
  const solo = isSolo(b);
  let to = ch;
  if (to === ALGOL && !solo) to = SPICA;
  const t = to === SPICA || to === ALGOL ? null : b.get(to);
  if (to === c.id || (t && (t.side !== 'ally' || t.kind === 'guest' || !t.alive || t.status?.rift))) {
    ev.lines.push(`${c.name}は、手をのばした。`, t?.status?.rift ? `しかし、${t.name}は、光の川の中だ…。手が、とどかない。` : 'しかし、つなぐ相手がいない…。');
    ev.c11dHold = { id: c.id, to, ok: false };
    return;
  }
  if (!t && to !== SPICA && to !== ALGOL) {
    ev.lines.push(`${c.name}は、手をのばした。`, 'しかし、つなぐ相手がいない…。');
    ev.c11dHold = { id: c.id, to, ok: false };
    return;
  }
  st.holds++;
  if (c.kind !== 'player') st.autoHolds++;
  const before = ringOf(b, c.id);
  const { ring, grew } = join(b, c.id, to);
  ev.fx = { type: 'ability', anim: 'c11d_hold', actor: c.id, targets: [c.id, ...(t ? [t.id] : [])], side: 'ally', color: ring.color };
  const name = ringName(b, to);
  ev.lines.push(`${c.name}は、${name}と、手をつないだ！`);
  if (to === SPICA) ev.lines.push('スピカ「うん！」');
  else if (to === ALGOL) ev.lines.push('アルゴル「…しかたないな。」');
  if (ring.m.length >= 3 && grew) post(ev).push(`${ring.m.map((id) => ringName(b, id)).join('・')}が、1つの輪になった！（${ring.m.length}人の輪）`);
  else if (before && !grew) post(ev).push(`（つないだ手を、もう一度、にぎり直した！輪は、また${ring.left}回の番の間、つづく）`);
  else post(ev).push(`（つないでいる間は、光のはかりでながされない！${ring.left}回の番で、手がはなれる）`);
  ev.c11dHold = { id: c.id, to, ok: true, ring: ring.m.slice(), color: ring.color, left: ring.left, grew };
}
// 八つの音（八つめの 音の あと。戦いで eight.uses 回 まで）
function eight(b, c, ev) {
  const st = b.c11d;
  ev.lines.length = 0;
  const q = queenOf(b);
  if (q) ev.upd.push(q);
  if (!st || st.kind !== 'queen' || st.won || !st.eightDone || st.eightLeft <= 0) {
    ev.lines.push(`${c.name}は、音を鳴らそうとした。`, st?.eightDone ? 'しかし、もう、8つの音は、ひびかない…。（戦いで2回まで）' : 'しかし、まだ、7つの音しか、ない…。');
    ev.c11dEightUse = { id: c.id, ok: false };
    return;
  }
  const cf = c11dConf(C11D_QUEEN, b);
  st.eightLeft--;
  st.eights++;
  st.lock = cf.eight.lock;
  // みんなが 1つの、ほどけない 輪
  const members = [...inFight(b).map((a) => a.id), SPICA, ...(isSolo(b) ? [ALGOL] : [])];
  st.rings = [{ id: st.nextRing++, m: members, left: cf.link, color: 0, lock: cf.eight.lock }];
  st.ringMax = Math.max(st.ringMax, members.length);
  ev.results = ev.results || [];
  for (const a of inFight(b)) {
    const h = Math.min(a.maxHp - a.hp, Math.round(a.maxHp * cf.eight.heal));
    if (h > 0) {
      a.hp += h;
      ev.results.push({ id: a.id, heal: h });
    }
    ev.upd.push(a);
  }
  ev.fx = { type: 'ability', anim: 'c11d_eight', actor: c.id, targets: inFight(b).map((a) => a.id), side: 'ally' };
  ev.lines.push(`${c.name}は、8つの音を、いっしょに鳴らした！`, 'レ・ミ・ファ・ソ・ラ・シ・ド…そして、八つめの音！', 'みんなが、1つの、ほどけない輪になった！');
  post(ev).push(`（${cf.eight.lock}回の番の間、光のはかりがきかない！みんなのHPが少し回復した。のこり${st.eightLeft}回）`);
  ev.c11dEightUse = { id: c.id, ok: true, left: st.eightLeft, lock: cf.eight.lock };
  ev.warn = true;
}

// ───────────── ダメージ（battle-c9b.js の c9bDamage の さいご。味方 → 敵）─────────────
export function c11dDamage(b, c, t, dmg, info, ev) {
  if (!(dmg > 0) || c?.side !== 'ally' || t?.side !== 'enemy') return dmg;
  const st = b.c11d;
  if (!st || st.won || st.lost) return dmg;
  if (st.kind === 'duo') {
    if (!t.c11u) return dmg;
    if (t.c11u.down) return 0;
    const cf = c11dConf(t.species, b);
    let k = 1;
    const role = t.c11u.role;
    if (role !== st.front) {
      k *= cf.backK;
      st.backHits++;
      if (ev && !ev.c11dBackHit) {
        ev.c11dBackHit = true;
        post(ev).push(`（${t.name}は、うしろで、まもられている…！前に出ているほうを、ねらおう）`);
      }
    } else if (role === 'mirror' && st.veil.length) {
      k *= cf.veilK;
      if (ev && !ev.c11dVeilHit) {
        ev.c11dVeilHit = true;
        post(ev).push(`（${MIRROR_SHORT}の色のまくが、こうげきをはじいた…！${colorLabel(st.veil[0])}の音を鳴らそう）`);
      }
    } else if (role === 'moon' && st.forget > 0) {
      k *= cf.forgetK;
      if (ev && !ev.c11dVeilHit) {
        ev.c11dVeilHit = true;
        post(ev).push(`（わすれの衣が、${MOON_SHORT}をつつんでいる…！スピカの名前をよぼう）`);
      }
    } else st.frontHits[role]++;
    if (!someoneChooses(b)) k *= cf.autoK;
    dmg = Math.max(1, Math.round(dmg * k));
    if (dmg >= t.hp) {
      dmg = Math.max(0, t.hp - 1);
      duoKnee(b, t, ev);
    }
    return dmg;
  }
  if (t.id !== st.id) return dmg;
  const cf = c11dConf(C11D_QUEEN, b);
  // だれも えらんで いない（完全オート・人が みんな たおれた）時は、女王が もっと かたい（autoK。設計に ない 足し物）
  if (!someoneChooses(b)) dmg = Math.max(1, Math.round(dmg * cf.autoK));
  // 八つめの 音: HPが 半分で 止まる（その 行動の あとに 場面）
  if (!st.eightDone) {
    const half = Math.ceil(t.maxHp * 0.5);
    if (st.eightPending || st.sceneQueued) return Math.max(0, Math.min(dmg, t.hp - half));
    if (t.hp - dmg <= half) {
      st.eightPending = true;
      return Math.max(0, t.hp - half);
    }
    return dmg;
  }
  // 女王は たおれない（HP 1 で 止まる → 手を 下ろす）
  if (dmg >= t.hp) {
    dmg = Math.max(0, t.hp - 1);
    queenDown(b, t, ev);
  }
  return dmg;
}
// 中ボス: ひざを つく（2人 とも ひざを つくと 勝ち）
function duoKnee(b, t, ev) {
  const st = b.c11d;
  t.c11u.down = true;
  t.telegraph = null;
  const other = duoOf(b, otherRole(t.c11u.role));
  if (!other || !other.alive || other.c11u.down) {
    duoDown(b, ev);
    return;
  }
  st.front = other.c11u.role;
  st.fronts = 0;
  st.swapReady = false;
  st.robeReady = false;
  if (st.front === 'mirror' && !st.veil.length && !st.open) veilUp(b);
  if (ev) {
    post(ev).push(
      t.c11u.role === 'mirror' ? `${MIRROR_SHORT}の鏡に、ピシッと、ひびが入った…！${MIRROR_SHORT}は、ふわりと下がった。` : `${MOON_SHORT}は、衣を、しずかにたたんだ…。${MOON_SHORT}は、雲の車にこしをおろした。`,
      `（もう、入れかわらない！${other.name}が、ずっと前にいる！）`,
    );
    ev.c11dKnee = { id: t.id, front: st.front };
    ev.warn = true;
    ev.upd.push(t, other);
  }
}
function duoDown(b, ev) {
  const st = b.c11d;
  st.won = true;
  st.robeReady = false;
  st.swapReady = false;
  for (const e of duoOf(b)) {
    e.telegraph = null;
    e.c11u.down = true;
  }
  b.killed.push(C11D_MIRROR, C11D_MOON);
  if (ev) {
    post(ev).push(
      `${MIRROR_SHORT}「む、むむ…。この光…やはり、はかりきれぬ…。」`,
      `${MOON_SHORT}「……。ひめさまの思い出は、ずいぶん、強いのですね。」`,
      `${MIRROR_SHORT}と${MOON_SHORT}は、しずかに、塔の上へ、引いていった…。`,
    );
    ev.c11dDuoDown = { ids: duoOf(b).map((e) => e.id) };
    for (const e of duoOf(b)) ev.upd.push(e);
  }
  b.pendingEnd = { outcome: 'win' };
  b.queue = [];
}
function queenDown(b, c, ev) {
  const st = b.c11d;
  st.won = true;
  st.measureReady = false;
  st.shineReady = false;
  c.telegraph = null;
  b.killed.push(c.species);
  if (ev) {
    post(ev).push(
      `${QUEEN_SHORT}の光が、ふっと、やわらかくなった…。`,
      `${QUEEN_SHORT}は、しずかに、手を下ろした。`,
      `${QUEEN_SHORT}「……つないだ光は、こんなに、明るいのですね。」`,
    );
    ev.c11dDown = { id: c.id };
    ev.upd.push(c);
  }
  b.pendingEnd = { outcome: 'win' };
  b.queue = [];
}

// ───────────── スピカの 光（battle-c9a.js の glow から。ほのかな光の あと）─────────────
// 女王の 戦い: スピカと つないだ 輪の 人数ぶん 光が 強く なる（輪の みんなが 回復。k … てらすは 2ばい）
function glowRing(b, ev, k = 1) {
  const st = b.c11d;
  if (!st || st.kind !== 'queen' || st.won) return null;
  const r = ringOf(b, SPICA);
  if (!r) return null;
  const cf = c11dConf(C11D_QUEEN, b);
  const n = r.m.length;
  ev.results = ev.results || [];
  const healed = [];
  for (const id of r.m) {
    const a = b.get(id);
    if (!a?.alive || a.status?.rift) continue;
    const h = Math.min(a.maxHp - a.hp, Math.max(1, Math.round(a.maxHp * cf.glow.ring * n * k)));
    if (h <= 0) continue;
    a.hp += h;
    ev.results.push({ id: a.id, heal: h });
    ev.upd.push(a);
    healed.push(a.id);
  }
  post(ev).push(`スピカの光が、つないだ手をつたって、輪の${n}人にひろがった！（輪の人数が多いほど、光が強い）`);
  ev.c11dGlow = { n, healed, teru: k > 1 };
  return ev.c11dGlow;
}
export function c11dGlowRing(b, ev) {
  if (!b?.c11d || b.pendingEnd || b.over) return null;
  return glowRing(b, ev, 1);
}
// スピカの さいごの ごほうび「八つの音のうた」（8回めの ほのかな光で 1回だけ）
export function c11dGlowEight(b, ev) {
  if (!b?.c11rew?.eight || !b.c9sp || b.pendingEnd || b.over || b.c9sp.eightSong) return null;
  if ((b.c9sp.glows || 0) < EIGHT_SONG_AT) return null;
  const al = b.aliveAllies().filter((a) => a.kind !== 'guest' && !a.status?.rift);
  if (!al.length) return null;
  b.c9sp.eightSong = true;
  const lines = post(ev);
  lines.push('スピカ「…8つの音、ぜんぶ、きこえる。」', `8つの音が、ひとつのうたになった！「${EIGHT_SONG_NAME}」！`);
  ev.results = ev.results || [];
  const healed = [];
  for (const a of al) {
    const h = Math.min(a.maxHp - a.hp, Math.max(1, Math.round(a.maxHp * EIGHT_SONG_HP)));
    a.mp = Math.min(a.maxMp, a.mp + Math.round(a.maxMp * EIGHT_SONG_MP));
    if (h > 0) {
      a.hp += h;
      ev.results.push({ id: a.id, heal: h });
    }
    ev.upd.push(a);
    healed.push(a.id);
  }
  lines.push('みんなのHPとMPが回復した！');
  ev.c11dSong = { healed };
  return ev.c11dSong;
}

// ───────────── オート（battle-c9b.js の c9bPlan の はじめ）─────────────
// この 幕の 戦いで なければ undefined。ふつうの オートは null
export function c11dPlan(b, c, decide, bestHit) {
  const st = b.c11d;
  if (!st) return undefined;
  if (c.side !== 'ally' || b.c9Inner || c.status?.rift || st.won || st.lost) return null;
  const mode = c.knows9 ?? b.knowsCh9;
  if (st.kind === 'duo') return duoPlan(b, c, decide, bestHit, mode);
  if (st.sceneQueued || st.eightPending || st.afterQueued) return null;
  return queenPlan(b, c, decide, bestHit, mode);
}
function base(b, c, decide) {
  b.c9Inner = true;
  try {
    return decide(b, c);
  } finally {
    b.c9Inner = false;
  }
}
const isCare = (a) => a && ['heal', 'revive', 'reviveAll'].includes(prim(a).type);
// ねらいを かえる（1体を ねらう 技・戦う は ねらいを t に。全体の 技は そのまま）
function aimAt(b, c, cmd, t, bestHit) {
  const a = cmd?.type === 'ability' ? ABILITIES[cmd.id] : null;
  if (isCare(a) || cmd?.type === 'defend' || cmd?.type === 'item') return cmd;
  if (!t) return cmd;
  if (cmd?.type === 'attack') return { type: 'attack', target: t.id };
  if (a && a.target === 'enemy') return bestHit(b, c, t) || { ...cmd, target: t.id };
  if (a && ['enemies', 'group'].includes(a.target)) return cmd;
  return bestHit(b, c, t) || cmd;
}
// 中ボスで 今 する こと（'ring' … 色を 鳴らす・'call' … スピカに よびかける・null）
export function duoNeed(b) {
  const st = b.c11d;
  if (!st || st.kind !== 'duo' || st.won || st.lost) return null;
  if (st.forget >= 2 && !queued(b, YOBIKAKE, SPICA)) return { kind: 'call' };
  const m = duoOf(b, 'mirror');
  if (st.front === 'mirror' && st.veil.length && m?.alive && !m.c11u.down && !queued(b, NARASU, st.veil[0])) return { kind: 'ring', color: st.veil[0] };
  if (st.forget >= 1 && !queued(b, YOBIKAKE, SPICA)) return { kind: 'call' };
  return null;
}
const needCmd = (n) => (n.kind === 'ring' ? { type: 'ability', id: NARASU, choice: n.color } : { type: 'ability', id: YOBIKAKE, choice: SPICA });
function duoPlan(b, c, decide, bestHit, mode) {
  const st = b.c11d;
  const need = duoNeed(b);
  const ok = (n) => n && canUse(b, c, n.kind === 'ring' ? NARASU : YOBIKAKE);
  if (mode !== 'know' && mode !== 'blind') {
    // 自動の 仲間: 人が えらんで いる 時だけ、しくみの 用が ある 番の 3回に 1回（思い出は 2 いじょう 消えた 時だけ よぶ）
    if (c.kind === 'player' || !ok(need) || !someoneChooses(b)) return null;
    if (need.kind === 'call' && st.forget < 2) return null;
    b.c11dAuto = (b.c11dAuto || 0) + 1;
    if (b.c11dAuto % AUTO_EVERY) return null;
    return needCmd(need);
  }
  if (mode === 'blind') {
    if (ok(need) && b.rng.chance(need.kind === 'call' && st.forget >= st.max - 1 ? 0.25 : 0.12)) return needCmd(need);
    return null;
  }
  // 知って いる 人: しくみの 用（鳴らす・よびかける）→ ふだんは 前に 出て いる 方を ねらう
  if (ok(need)) return needCmd(need);
  const cmd = base(b, c, decide);
  const f = frontOf(b);
  return aimAt(b, c, cmd, f?.alive && !f.c11u.down ? f : duoOf(b).find((e) => e.alive && !e.c11u.down), bestHit);
}

// 女王の 戦いで 今 する こと（'eight' … 八つの音・'hold' … 手をつなぐ〈to … えらぶ 相手〉・null）
export function queenNeed(b, c) {
  const st = b.c11d;
  if (!st || st.kind !== 'queen' || st.won || st.sceneQueued || st.eightPending || st.afterQueued) return null;
  const loose = looseAllies(b);
  const big = st.rings.slice().sort((x, y) => y.m.length - x.m.length)[0] || null;
  const soon = st.measureReady || st.shineReady;
  // 八つの音: 前ぶれが 来て いて、つないで いない 人が いる・輪が もうすぐ ほどける・HPの 少ない 人が いる（苦しい 時）・もう ほどけない 輪が ない 時
  const low = inFight(b).some((a) => a.hp < a.maxHp * 0.6);
  if (st.eightDone && st.eightLeft > 0 && st.lock <= 0 && soon && (loose.length || (big && big.left <= 1) || low) && !queued(b, EIGHT)) return { kind: 'eight' };
  if (queued(b, HOLD)) {
    // もう だれかが つなごうと して いる。前ぶれの ねらいが まだ つないで いなければ、もう 1人
    const aim = st.measureReady ? b.get(st.measureAim) : null;
    if (!(aim && !linked(b, aim.id) && !b.queue.some((q) => q.cmd?.id === HOLD && (q.id === aim.id || q.cmd.choice === aim.id)))) return null;
  }
  const lockNow = st.lock > 0;
  const expiring = big && !big.lock && big.left <= 1;
  if (!loose.length && !expiring) return null;
  if (lockNow && !loose.length) return null;
  return { kind: 'hold', to: holdTarget(b, c) };
}
// 手を つなぐ 相手（前ぶれの ねらいが つないで いない → その 人。自分が つないで いない → いちばん 大きい 輪の 人〈スピカ〉。
//   自分が つないで いる → つないで いない 人・いなければ 輪の だれか〈のこりの 番を もどす〉）
export function holdTarget(b, c) {
  const st = b.c11d;
  const aim = st.measureReady ? b.get(st.measureAim) : null;
  if (aim && aim !== c && !linked(b, aim.id) && aim.alive && !aim.status?.rift) return aim.id;
  const big = st.rings.slice().sort((x, y) => y.m.length - x.m.length)[0] || null;
  const mine = ringOf(b, c.id);
  if (!mine) {
    if (big) return big.m.includes(SPICA) ? SPICA : big.m.find((id) => id !== c.id && id !== ALGOL) || SPICA;
    const other = looseAllies(b).find((x) => x !== c);
    return other ? other.id : SPICA;
  }
  const loose = looseAllies(b).filter((x) => x !== c);
  if (loose.length) return loose.sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0].id;
  if (!mine.m.includes(SPICA)) return SPICA;
  return mine.m.find((id) => id !== c.id && id !== SPICA && id !== ALGOL) || (isSolo(b) ? ALGOL : SPICA);
}
function queenPlan(b, c, decide, bestHit, mode) {
  const st = b.c11d;
  const need = queenNeed(b, c);
  const can = (id) => canUse(b, c, id);
  const cmdOf = (n) => (n.kind === 'eight' ? { type: 'ability', id: EIGHT } : { type: 'ability', id: HOLD, choice: n.to });
  if (mode !== 'know' && mode !== 'blind') {
    // 自動の 仲間: 人が えらんで いる 時だけ、つないで いない 人が いる 時の 3回に 1回 つなぐ（数は 自動の 仲間 みんなで 1つ）
    if (c.kind === 'player' || !can(HOLD) || !someoneChooses(b) || !looseAllies(b).length || queued(b, HOLD)) return null;
    b.c11dAuto = (b.c11dAuto || 0) + 1;
    if (b.c11dAuto % AUTO_EVERY) return null;
    return { type: 'ability', id: HOLD, choice: holdTarget(b, c) };
  }
  if (mode === 'blind') {
    // 知らない 人: ときどき 気づいて つなぐ
    if (need?.kind === 'hold' && can(HOLD) && !linked(b, c.id) && b.rng.chance(0.12)) return cmdOf(need);
    return null;
  }
  // 知って いる 人
  if (need && can(need.kind === 'eight' ? EIGHT : HOLD)) return cmdOf(need);
  const cmd = base(b, c, decide);
  const q = queenOf(b);
  void st;
  return aimAt(b, c, cmd, q?.alive ? q : null, bestHit);
}
// しくみの 用が ある 間（シミュレーターの 知って いる 人は 合体技を しない）
export function c11dBusy(b) {
  const st = b.c11d;
  if (!st || st.won || st.lost) return false;
  if (st.kind === 'duo') return !!duoNeed(b) || st.robeReady;
  return st.measureReady || st.shineReady || looseAllies(b).length > 0 || st.sceneQueued || st.afterQueued;
}

// ───────────── がめんへ（battle-c9b.js の c9bPub から。敵）─────────────
// 中ボス: c11dKind 'mirror'|'moon'・front11d（前に 出て いる）・down11d（ひざを ついた）・swap11d（入れかわる 前ぶれ。前の 方に 1）・
//   veil10（ミラーレ: まくの 色の 番号 [ ]。うしろ・われた 時は [ ]）・open11d（まくが われて いる）・
//   forget11b・forgetMax11b・robe11b（オボロ: スピカの わすれ・衣の 前ぶれ。第2幕の 画面と 同じ 名前）・c11dDuoDown（勝った）・c11dTaken（負けた）・
//   duoStage（曲 1 ミラーレが 前・2 オボロが 前・3 前ぶれ・4 勝った）
// 女王: c11dKind 'queen'・rings11d（[{ m: [id・'spica'・'algol'], left, color, lock }]）・measure11d（光の はかりの ねらいの id。前ぶれの 時だけ）・
//   shine11d（かがやきの 前ぶれ）・loose11d（つないで いない 人の id）・phase11d（1 前半・2 後半）・eight11d（{ left: のこりの 回数・lock: ほどけない のこり・done }）・
//   scene11d（八つめの 音の 場面の 前・中）・c11dDown（手を 下ろした）・queenStage（曲 1 前半・2 八つめの 音の 場面・3 後半・4 勝った）
export function c11dPub(c, b = c?._b11d) {
  const o = {};
  const st = b?.c11d;
  if (!st) return o;
  if (st.kind === 'duo' && c.c11u) {
    const role = c.c11u.role;
    o.c11dKind = role;
    o.front11d = st.front === role ? 1 : 0;
    o.down11d = c.c11u.down ? 1 : 0;
    o.swap11d = st.swapReady && st.front === role ? 1 : 0;
    if (role === 'mirror') {
      o.veil10 = st.front === 'mirror' && !c.c11u.down ? st.veil.slice() : [];
      o.open11d = st.open && st.front === 'mirror' ? 1 : 0;
    } else {
      o.forget11b = st.forget;
      o.forgetMax11b = st.max;
      o.robe11b = st.robeReady ? 1 : 0;
    }
    o.c11dDuoDown = st.won ? 1 : 0;
    o.c11dTaken = st.lost ? 1 : 0;
    o.duoStage = st.won ? 4 : st.swapReady || st.robeReady ? 3 : st.front === 'mirror' ? 1 : 2;
    return o;
  }
  if (st.kind !== 'queen' || c.id !== st.id) return o;
  o.c11dKind = 'queen';
  o.rings11d = st.rings.map((r) => ({ m: r.m.slice(), left: r.left, color: r.color, lock: r.lock }));
  o.measure11d = st.measureReady ? st.measureAim : null;
  o.shine11d = st.shineReady ? 1 : 0;
  o.loose11d = looseAllies(b).map((a) => a.id);
  o.phase11d = st.phase;
  o.eight11d = { left: st.eightLeft, lock: st.lock, done: st.eightDone ? 1 : 0 };
  o.scene11d = st.sceneQueued || st.eightPending || st.afterQueued ? 1 : 0;
  o.solo11d = isSolo(b) ? 1 : 0;
  o.c11dDown = st.won ? 1 : 0;
  o.queenStage = st.won ? 4 : st.sceneQueued || st.eightPending || st.afterQueued ? 2 : st.phase === 2 ? 3 : 1;
  return o;
}
// 味方（battle-c9a.js の c9aPub から）: hold11d（手をつなぐ が ある 戦い）・ring11d（{ c: 色, n: 輪の 人数, left, lock } か null）・
//   swept11d（ながされて いる 時の もどるまでの 番。ない 時は null）・aim11d（光の はかりの ねらい）・eightOk11d（八つの音が 使える）
//   ない 時も null を 出す（がめんは 前の 値に 足して いく ので、消さないと しるしが のこる）
export function c11dAllyPub(c, b = c?._b11d) {
  const o = {};
  const st = b?.c11d;
  if (!st || st.kind !== 'queen') return o;
  o.hold11d = 1;
  const r = ringOf(b, c.id);
  o.ring11d = r ? { c: r.color, n: r.m.length, left: r.left, lock: r.lock } : null;
  o.swept11d = c.status?.rift?.kind === SWEPT ? c.status.rift.turns : null;
  o.aim11d = st.measureReady && st.measureAim === c.id ? 1 : 0;
  o.eightOk11d = st.eightDone && st.eightLeft > 0 && !st.won ? 1 : 0;
  return o;
}
void SHINE;
void STRIKE;
void TERU_ID;
void C11D_MOON;
