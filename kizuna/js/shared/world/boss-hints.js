// 第80回 E班: ボスに 負けた 時の ヒント（docs/plan-r80-hints.md。ネタバレ注意）
//
// 流れ
//   1. ボスの きまった 戦い（boss: true・loseOk で ない・BOSS_HINTS に ある 戦い）で 全滅すると、
//      world/battles.js の finishBattle が bossHintAfter を よぶ → その 戦いに 出た 人 みんなの キャラに 負けた 回数を 1 足す
//      （c.bossLoss = { 戦いの id: 回数 }。ふだんは この 項目は ない。勝つと 消える。引っこしコードは ほとんど 長く ならない）
//      その 人の s.bossHint に 「何を 言うか」を おく
//   2. いのりの場所で 目を 覚まして、けっかを 読みおわった あと（world.js の tick。進化の たずねと 同じ ころ）に bossHintCheck が
//      その 戦いの ゲスト（いなければ トキネ）の ひとことで ヒントを 言う（回数ごとに 1つ目 → 2つ目 → 3つ目）
//   3. リーダー（ひとりの 時は 自分）は「もう一度いどむ／あとにする」を えらぶ。もう一度 … ボスの 台本が 始まる マスの 手前へ
//      （いっしょに 戦って、同じ 所で 目を 覚ました 家族も いっしょに）。行き先が 分からない 戦いは えらぶ 文を 出さない
//   全滅の 決まり（お金が 半分・いのりの場所で 回復）は かえない
import { BOSS_HINTS, BOSS_RETRY, BOSS_HINT_WHO, HINT_SPEAKER, bossHintAt, PART3_BATTLE, BASIC_JOB_LV, PARTY_NOTE } from '../data/boss-hints.js?v=068632fa6d51';
import { JOBS } from '../data/jobs.js?v=068632fa6d51';
import { MAPS, canStand, isBlocked } from '../maps/index.js?v=068632fa6d51';
import { runSteps } from './scripts.js?v=068632fa6d51';
import { partyOf } from './party.js?v=068632fa6d51';

const LOSS_MAX = 9;

// 負けた 回数（ない ときは 0）
export function bossLossOf(c, id) {
  return Math.max(0, Math.floor(Number(c?.bossLoss?.[id]) || 0));
}

// ヒントを 出す 戦いか（ボスの きまった 戦い・負けても よい 戦いで ない・ヒントが ある）
export function hintBattle(opts) {
  return !!(opts?.boss && opts.fixed && !opts.loseOk && !opts.solo && BOSS_HINTS[opts.fixed]);
}

function addLoss(c, id) {
  if (!c) return 0;
  const n = Math.min(LOSS_MAX, bossLossOf(c, id) + 1);
  c.bossLoss = { ...(c.bossLoss && typeof c.bossLoss === 'object' ? c.bossLoss : {}), [id]: n };
  return n;
}

export function clearLoss(c, id) {
  if (!c?.bossLoss || typeof c.bossLoss !== 'object') return;
  delete c.bossLoss[id];
  if (!Object.keys(c.bossLoss).length) delete c.bossLoss;
}

// その 戦いの ゲスト（いなければ トキネ）
function speakerOf(ctx) {
  if (BOSS_HINT_WHO[ctx.opts.fixed]) return BOSS_HINT_WHO[ctx.opts.fixed];
  const g = Object.values(ctx.actorMap || {}).find((w) => w?.type === 'guest' && w.char?.name);
  return g ? g.char.name : HINT_SPEAKER;
}

// 第101回 R1班: 第3部の ボスに 負けた 時、ヒントの あとに 足す ひとこと（あてはまらない 時は ''。data/boss-hints.js の PARTY_NOTE）
//   allies … 戦いの 味方（battle.allies。kind 'player'・'support'・'monster'・'guest'）
//   ① 味方（ゲストを のぞく）が 3人 いかで 自動の 仲間が いない → 4人で いどもう
//   ② 自動の 仲間（酒場・家族の 仲間。魔物は 職業が ない）に Lv95 いじょうで 基本職の 人 → 転職と 装備
export function partyNote(fixed, allies = []) {
  if (!PART3_BATTLE.test(String(fixed || ''))) return '';
  const al = (allies || []).filter((a) => a && a.kind !== 'guest');
  const sups = al.filter((a) => a.kind === 'support' || a.kind === 'monster');
  if (!sups.length) return al.length && al.length <= 3 ? PARTY_NOTE.few : '';
  // 戦いの キャラ（battle.js の allyFromCharacter）の job・lv・name
  const basic = sups.filter((a) => a.kind === 'support' && (a.lv || 0) >= BASIC_JOB_LV && JOBS[a.job]?.tier === 0).map((a) => a.name).filter(Boolean);
  return basic.length ? PARTY_NOTE.basic([...new Set(basic)]) : '';
}

// finishBattle から（勝った → 数を 消す・全滅 → 数を 足して ヒントの よやく）
export function bossHintAfter(world, ctx, sessions, outcome) {
  if (!hintBattle(ctx.opts)) return;
  const id = ctx.opts.fixed;
  if (outcome === 'win') {
    for (const m of sessions) clearLoss(m.char, id);
    return;
  }
  if (outcome !== 'lose') return;
  const party = world.parties.get(ctx.partyId);
  const chooser = sessions.find((m) => m.id === party?.leader) || sessions[0];
  const who = speakerOf(ctx);
  const sids = sessions.map((m) => m.id);
  // 第101回 R1班: 第3部の ボスは、パーティーの ようすで ひとこと 足す（ない 時は つけない）
  const note = partyNote(id, ctx.battle?.allies);
  for (const m of sessions) {
    const n = addLoss(m.char, id);
    m.bossHint = { id, n, who, map: ctx.map, choose: m === chooser, sids, ...(note ? { note } : {}) };
  }
}

// ───── もう一度いどむ 行き先 ─────
// その ボスの 台本が 始まる マス（trigger）の 手前（ボスと 反対の がわ・2〜8マス はなれた 立てる マス・そこから マスまで 歩ける）
function reaches(map, sx, sy, tr, hasFlag, limit = 40000) {
  const inTr = (x, y) => x >= tr.x && y >= tr.y && x < tr.x + tr.w && y < tr.y + tr.h;
  const seen = new Set([sy * map.w + sx]);
  const q = [[sx, sy]];
  for (let h = 0; h < q.length && h < limit; h++) {
    const [x, y] = q[h];
    if (inTr(x, y)) return true;
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h) continue;
      const k = ny * map.w + nx;
      if (seen.has(k) || isBlocked(map, nx, ny, hasFlag)) continue;
      seen.add(k);
      q.push([nx, ny]);
    }
  }
  return false;
}

export function retryTrigger(id, mapId) {
  const sc = BOSS_RETRY[id];
  if (!sc) return null;
  const find = (m) => (m?.triggers || []).find((t) => t.script === sc);
  if (find(MAPS[mapId])) return { mapId, map: MAPS[mapId], tr: find(MAPS[mapId]), sc };
  for (const [mid, m] of Object.entries(MAPS)) {
    const tr = find(m);
    if (tr) return { mapId: mid, map: m, tr, sc };
  }
  return null;
}

// { map, x, y, dir } か null（分からない）
export function retrySpot(id, mapId, hasFlag = () => false) {
  const t = retryTrigger(id, mapId);
  if (!t) return null;
  const { map, tr, sc } = t;
  const flat = tr.w >= tr.h; // よこに 長い マス（ボスは 上か 下）
  const npc = (map.npcs || []).find((n) => n.script === sc);
  // ボスの がわ（-1 … 上・左 / +1 … 下・右）。ボスが いない マスは 階段（warps）の 多い がわから 来る
  let bossSide;
  if (npc) bossSide = flat ? (npc.y < tr.y ? -1 : 1) : (npc.x < tr.x ? -1 : 1);
  else {
    let lo = 0, hi = 0;
    for (const w of map.warps || []) {
      const v = flat ? w.y : w.x, a = flat ? tr.y : tr.x, b = flat ? tr.y + tr.h : tr.x + tr.w;
      if (v < a) lo++;
      else if (v >= b) hi++;
    }
    bossSide = hi >= lo ? -1 : 1;
  }
  const side = -bossSide;
  const span = flat ? [tr.x, tr.w] : [tr.y, tr.h];
  const mid = span[0] + Math.floor((span[1] - 1) / 2);
  const offs = [0];
  for (let k = 1; k <= span[1]; k++) offs.push(k, -k);
  // 2〜8マス はなれた 所から さがす。ない 時は となりの 列（時計塔 5階のように マスの すぐ 下が かべの 階）
  for (const d of [2, 3, 4, 5, 6, 7, 8, 1]) {
    const line = side > 0 ? (flat ? tr.y + tr.h - 1 : tr.x + tr.w - 1) + d : (flat ? tr.y : tr.x) - d;
    for (const o of offs) {
      const along = mid + o;
      const [x, y] = flat ? [along, line] : [line, along];
      if (x < 0 || y < 0 || x >= map.w || y >= map.h) continue;
      if (!canStand(map, x + 0.5, y + 0.5, hasFlag)) continue;
      if (!reaches(map, x, y, tr, hasFlag)) continue;
      const dir = flat ? (side > 0 ? 'up' : 'down') : (side > 0 ? 'left' : 'right');
      return { map: t.mapId, x: x + 0.5, y: y + 0.5, dir };
    }
  }
  return null;
}

// ───── ヒントの 台本 ─────
const LEADS = [
  'さっきの戦い、くやしかったね…。\nヒントを1つ、思いついたよ。',
  'もう一度、よく考えてみたよ。',
  'こうすれば、きっと勝てるよ！',
];

export function bossHintSteps(h, dest) {
  const hint = bossHintAt(h.id, h.n);
  if (!hint) return [];
  const steps = [
    ['say', h.who, LEADS[Math.min(h.n, LEADS.length) - 1]],
    ['say', h.who, hint],
    // 第101回 R1班: パーティーの ひとこと（partyNote）
    ...(h.note ? [['say', h.who, h.note]] : []),
  ];
  if (!dest) return steps;
  if (!h.choose) {
    steps.push(['say', null, '（もう一度いどむかは、リーダーが決めるよ）']);
    return steps;
  }
  steps.push(['choice', 'どうする？', ['もう一度いどむ', 'あとにする'], [
    [['call', (run) => retryNow(run, h)]],
    [['say', h.who, 'じゅんびを整えてから、また行こうね。\n（ヒントは、冒険のしおりの「物語」でも見られるよ）']],
  ]]);
  return steps;
}

// もう一度いどむ: 自分（台本）と、いっしょに 戦って 同じ 所に いる 家族を ボスの 手前へ
async function retryNow(run, h) {
  const w = run.world;
  const s = run.init;
  const dest = retrySpot(h.id, h.map, w.hasFlagFn(s));
  if (!dest) return;
  const from = s.map;
  const others = (h.sids || []).map((sid) => w.sessions.get(sid)).filter((m) => m && m !== s && m.inWorld && !m.away && m.map === from && m.busy !== 'battle' && partyOf(w, m) === partyOf(w, s));
  await run.runSteps([['fade', 'out'], ['teleport', dest.map, dest.x, dest.y, dest.dir]]);
  for (const m of others) {
    const at = canStand(MAPS[dest.map], dest.x, dest.y + (dest.dir === 'up' ? 1 : -1), w.hasFlagFn(s)) ? { x: dest.x, y: dest.y + (dest.dir === 'up' ? 1 : -1) } : { x: dest.x, y: dest.y };
    w.placeSession(m, dest.map, at.x, at.y, dest.dir, true);
  }
  if (others.length) w.broadcastPlayers?.();
  await run.runSteps([['fade', 'in'], ['say', h.who, 'この先に、さっきの相手がいるよ。\nヒントを思い出して、がんばろう！']]);
}

// world.js の tick から（ひまに なった 時に 1回だけ）
export function bossHintCheck(world, s) {
  const h = s.bossHint;
  s.bossHint = null;
  if (!h || !world.sessions.has(s.id) || !s.inWorld) return false;
  const dest = retrySpot(h.id, h.map, world.hasFlagFn(s));
  const steps = bossHintSteps(h, dest);
  if (!steps.length) return false;
  runSteps(world, s, steps);
  return true;
}
