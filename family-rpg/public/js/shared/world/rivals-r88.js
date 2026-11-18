// 第88回 G3班: まぼろしの回ろう（ルミナの町の 星の神殿の 下。だいほんは data/story-rivals-r88.js、データは data/rivals-r88.js）
// ・とびらを 調べる: その 作品の 品を 3つ 持って いれば まど（client/ui/rivals-r88.js）。ない ときは「あと○つ」
// ・ちょうせん: そばに いる 家族も いっしょに とびらの 中の 部屋へ → ライバルの まぼろしと 戦う（shared/battle-rival-r88.js）
//   勝つと 戦った 家族 ぜんいんが その ライバルの 品を 1つずつ（もう 持って いる 人には かわりに 少しの お金）。勝った 記録は 1人ずつ（char.rivals）
//   負けても お金は へらない（HP・MPも もどる）。何回でも
// ・試練の番人が 回廊の 案内も する（はじめて 話した ときに 1回。world/job-trials.js の 番人の 話の あと）
import { RIVAL_HOOKS } from '../data/story-rivals-r88.js';
import { TRIAL_HOOKS, TRIAL_KEEPER } from '../data/story-trials.js';
import { RIVAL_BY_ID, DOOR_NEED, RIVAL_GOLD_PER_LV, rivalOpen, markRivalWin, rivalEnc, rivalMembers } from '../data/rivals-r88.js';
// G11班: とびらの 名前は shared/rivals-r88.js の doorName（workName は 使わなく なった）
import { ITEMS } from '../data/items.js';
import { addItem } from '../stats.js';
import { ownedIds } from '../gear-r88.js';
import { workOwned, doorLeft, refreshDoorFlags, rivalPaper, rivalButtons, rewardIds, HALL_NAME, doorName } from '../rivals-r88.js';
import { HALL_ID, roomId, ROOM_START, doorFront } from '../maps/rivals-r88.js';
import { startFixedBattle, battleSessions } from './battles.js';
import { partyOf } from './party.js';
import { setupRivalPhantom } from '../battle-rival-r88.js';
// 番人の 話（TRIAL_HOOKS.keeper）を 先に 入れて おく
import './job-trials.js';

const note = (text) => ['say', null, text];
const keeper = (text) => ['say', TRIAL_KEEPER, text];

async function flushOk(run) {
  const r = await run.flush();
  if (r.aborted) {
    run.abort();
    return false;
  }
  return true;
}

// 回廊へ 入る 時（world.js の placeSession）: とびらの 光る しるしを 持ち物に 合わせる
export function rivalHallEnter(world, s, mapId) {
  if (mapId !== HALL_ID || !s?.char) return;
  if (refreshDoorFlags(s.char)) world.sendSelf(s);
}

// ───────────── とびらを 調べる ─────────────
export async function doorTalk(run, work) {
  const c = run.init.char;
  const steps = [];
  const changed = refreshDoorFlags(c);
  const left = doorLeft(c, work);
  const name = doorName(work); // G11班: まとめた とびら（コナン・快と）は とびらの 名前
  if (left > 0) {
    steps.push(
      note(`${name}のとびらだ。\nとびらは、光っていない…`),
      note(`${name}の品を、あと${left}つ集めると開く。\n（今は${workOwned(c, work)}つ。ふくろ・預かり所・装備している品を数える）`),
    );
    if (changed) steps.push(['sync']);
    return run.runSteps(steps);
  }
  if (changed) steps.push(['sfx', 'key'], note(`${name}の品が${DOOR_NEED}つそろった！\nとびらの前の光の輪が、かがやき始めた！`), ['sync']);
  const paper = rivalPaper(c, work);
  const btns = rivalButtons(paper);
  const labels = [...btns.map((b) => b.label), 'やめる'];
  const branches = [...btns.map((b) => [['call', (r) => rivalBattle(r, b.id)]]), [note('とびらから、はなれた。')]];
  steps.push(['choice', `${name}のとびら`, labels, branches, null, paper]);
  return run.runSteps(steps);
}

// とちゅうで かけつけた 家族（戦いの あとで だいほんの 外に のこった 人）を だいほんに 入れる（world/job-trials.js と おなじ）
function adopt(run) {
  const w = run.world;
  const p = partyOf(w, run.init);
  for (const sid of p?.members || []) {
    const m = w.sessions.get(sid);
    if (!m || run.parts.includes(m) || m.busy !== 'script' || (m.runId && w.runs.has(m.runId))) continue;
    run.parts.push(m);
    m.runId = run.id;
  }
}

// そばに いる 家族（ふつうの 戦いと おなじ きょり。ほかの ことを していない 人）を だいほんに 入れる
function gatherFamily(run) {
  const w = run.world;
  for (const m of battleSessions(w, run.init)) {
    if (m === run.init || run.parts.includes(m)) continue;
    run.parts.push(m);
    m.busy = 'script';
    m.runId = run.id;
  }
}

// 勝った 人ぜんいんに ごほうび（1人に 1つずつ。もう 持って いれば お金）。もどりち: 文の ならび
export function giveRivalRewards(chars, rv) {
  const lines = [];
  const gold = rv.lv * RIVAL_GOLD_PER_LV;
  for (const c of chars) {
    if (!c || c.species) continue;
    markRivalWin(c, rv.id);
    for (const id of rewardIds(rv)) {
      if (ownedIds(c).has(id)) {
        c.gold = (c.gold || 0) + gold;
        lines.push(`${c.name}は${ITEMS[id].name}をもう持っている。\nかわりに${gold}ゴールドをもらった。`);
      } else {
        addItem(c, id, 1);
        lines.push(`${c.name}は${ITEMS[id].name}を手に入れた！`);
      }
    }
  }
  return lines;
}

// ───────────── ライバルの まぼろしとの 戦い ─────────────
export async function rivalBattle(run, id) {
  const w = run.world;
  const c = run.init.char;
  const rv = RIVAL_BY_ID[id];
  if (!rv || !rivalOpen(c, id)) return run.runSteps([note('…今は、ちょうせんできないようだ。')]);
  gatherFamily(run);
  const others = run.everyone.filter((m) => m !== run.init).map((m) => m.char.name);
  const front = doorFront(rv.work) || { x: 7.5, y: 3.6 };
  await run.runSteps([
    ['sfx', 'door'], ['fade', 'out'], ['teleport', roomId(rv.work), ROOM_START.x, ROOM_START.y, 'up'], ['fade', 'in'],
    note(`とびらの中は、ふしぎな光につつまれた部屋だった。${others.length ? `\n${others.join('と')}も、いっしょに来てくれた！` : ''}`),
    ['sfx', 'encounter'],
  ]);
  if (run.aborted || !(await flushOk(run))) return;
  const res = await startFixedBattle(w, run.init, run.everyone, rivalEnc(id), { setup: (b) => setupRivalPhantom(b, rv) });
  adopt(run);
  const back = [['fade', 'out'], ['teleport', HALL_ID, front.x, front.y, 'up'], ['fade', 'in']];
  if (res === 'win') {
    const lines = giveRivalRewards(run.everyone.map((m) => m.char), rv);
    for (const m of run.everyone) {
      refreshDoorFlags(m.char);
      w.sendSelf(m);
    }
    w.markDirty();
    w.saveNow?.({ urgent: true });
    return run.runSteps([
      ['sfx', 'win'], note(`${rv.name}のまぼろしに勝った！`),
      note(`「${rv.win || '見事だ。この品は、そなたらにあずけよう。'}」`),
      ['sfx', 'chest'], ...lines.map((l) => note(l)),
      ...back,
    ]);
  }
  if (res === 'lose') {
    return run.runSteps([
      ...back,
      note(`気がつくと、${HALL_NAME}でたおれていた…。\n（お金はへっていない。HPとMPはもどった）`),
      note('まぼろしの大技は、前ぶれのあとに来る。\n身を守ると、たえられるかもしれない。'),
    ]);
  }
  return run.runSteps([...back, note('戦いが止まったようだ。\nまた、ちょうせんしよう。')]);
}

// ───────────── 試練の番人の 案内（はじめての 1回）─────────────
const baseKeeper = TRIAL_HOOKS.keeper;
export async function keeperWithHall(run) {
  if (baseKeeper) await baseKeeper(run);
  if (run.aborted) return;
  const c = run.init.char;
  if (!c || c.flags?.r88hall_seen) return;
  c.flags = c.flags || {};
  c.flags.r88hall_seen = true;
  run.world.markDirty();
  return run.runSteps([
    keeper(`そうそう、となりの階段の下は「${HALL_NAME}」じゃ。\n物語の品にまつわる、ライバルのまぼろしが待っておる。`),
    keeper(`ひとつの作品の品を${DOOR_NEED}つ集めると、\nその作品のとびらが光って開く。\n勝てば、その者の品がもらえるぞ。`),
  ]);
}

Object.assign(RIVAL_HOOKS, { door: doorTalk });
Object.assign(TRIAL_HOOKS, { keeper: keeperWithHall });
