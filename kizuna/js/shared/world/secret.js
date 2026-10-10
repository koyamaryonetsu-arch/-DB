// ひみつのダンジョン（せかいの しくみ）: 入る・階を 下りる・番人・休み所の ごほうびと 泉・地上へ もどる・全滅・記録の 板
// データと 階の 形は data/secret.js と maps/secret-dungeon.js
//
// ちょうせん（c.sd.run）
// ・入口の 広間の 下り階段から 地下1階へ 入った 人だけが「ちょうせん中」。1つずつ 下りた 階が 記録に なる
// ・パーティーの みんなで いっしょに 下りる（同じ 階に いる 家族を みんな つれていく）。いっしょに いた 家族の 名前も 記録に のこる
// ・とちゅうから 来た 人（さそわれて リーダーの ところへ 来た など）は mid（その ちょうせんは 記録に ならない。ごほうびは 小さな 物だけ）
// ・ダンジョンの 外（入口の 広間も）へ 出ると ちょうせんは 終わり（placeSession から noteSecretMove）
import { MAPS, isBlocked } from '../maps/index.js?v=0136232bcf56';
import { fullHeal, addItem } from '../stats.js?v=0136232bcf56';
import { MONSTERS } from '../data/monsters.js?v=0136232bcf56';
import { SD_HOOKS } from '../data/story-secret.js?v=0136232bcf56';
import { partyOf } from './party.js?v=0136232bcf56';
import { SD_DOOR_OUT, GATE_ARRIVE } from '../maps/secret-dungeon.js?v=0136232bcf56';
import {
  SD_GATE, SD_NAME, SD_OPEN_FLAG, sdFloorId, sdFloorOf, isSdFloorId, isRestFloor, isGuardFloor, sdGuardian, sdGuardEncounter,
  sdRecommendLv, sdBigReward, sdSmallReward, rewardText, sdMedalId, noteSdFloor, sdRecordOf, sdRecordText, sdBoardRows, sdBand,
} from '../data/secret.js?v=0136232bcf56';

const GUIDE = 'ひみつのダンジョンの案内人';
const FAIRY = '休み所のようせい';

// ───────────── ちょうせんの きろく ─────────────
function sdOf(c) {
  if (!c.sd || typeof c.sd !== 'object') c.sd = { best: 0, got: [], tries: 0 };
  if (!Array.isArray(c.sd.got)) c.sd.got = [];
  return c.sd;
}
const runOf = (c) => (c?.sd?.run && typeof c.sd.run === 'object' ? c.sd.run : null);

// world.placeSession から（s.map が かわる 前）: ちょうせんの つづきか、とちゅうから 来たか、外に 出たか
export function noteSecretMove(world, s, toMap) {
  const c = s?.char;
  if (!c || toMap === s.map) return;
  const step = s.sdStep;
  delete s.sdStep;
  const f = sdFloorOf(toMap);
  if (f) {
    // 下り階段・入口からの 正しい 移動は 下りた あとで 記録する（arriveFloor）。それ いがいは とちゅうから
    if (step === toMap) return;
    sdOf(c).run = { f, mid: true, took: [] };
    return;
  }
  if (c.sd?.run) delete c.sd.run;
  // 階の 地図の きろく（ちょうせんの たびに 新しく さがす）
  if (c.explored) for (const k of Object.keys(c.explored)) if (isSdFloorId(k)) delete c.explored[k];
}

// ログインの ときの 場所（world.js の validPos）。階の 中なら そのまま（かべの 中なら 着いた 場所）、知らない 階なら 入口の 広間
export function fixSecretPos(pos) {
  const m = MAPS[pos.map];
  if (m?.sd?.floor) {
    const inside = Number.isFinite(pos.x) && Number.isFinite(pos.y) && pos.x >= 0 && pos.y >= 0 && pos.x < m.w && pos.y < m.h;
    if (inside && !isBlocked(m, Math.floor(pos.x), Math.floor(pos.y), () => false)) return pos;
    return { map: pos.map, x: m.sd.arrive.x, y: m.sd.arrive.y, dir: 'down' };
  }
  return { map: SD_GATE, x: GATE_ARRIVE.x, y: GATE_ARRIVE.y, dir: 'down' };
}

// 全滅（world.js の respawn から）: ダンジョンの 階なら 入口の 広間で 目を覚ます（お金は へらない。world/battles.js）
export function secretRespawn(world, s, note = '') {
  const f = MAPS[s.map]?.sd?.floor;
  if (!f) return false;
  fullHeal(s.char);
  world.placeSession(s, SD_GATE, GATE_ARRIVE.x, GATE_ARRIVE.y, 'down', true);
  const r = sdRecordOf(s.char);
  world.send(s, {
    t: 'toast', afterBattle: true,
    text: `${s.char.name}は${SD_NAME}の入口で目を覚ました。\n（ここでは、お金はへらない）\n今回は地下${f}階まで。最高は地下${r.best}階${note ? `\n${note}` : ''}`,
  });
  return true;
}

// だれも いない 階の 魔物は わすれる（world.js の tick から。また 入ると 新しい 魔物）
let pruneAt = 0;
export function pruneSecretStates(world, byMap) {
  const now = world.now();
  if (now - pruneAt < 10000) return;
  pruneAt = now;
  for (const id of [...world.mapStates.keys()]) if (isSdFloorId(id) && !byMap.has(id)) world.mapStates.delete(id);
}

// ───────────── パーティーで いっしょに ─────────────
// 同じ マップに いる 家族（ほかの ことを していない 人）を だいほんに 入れる（いっしょに 下りる・ごほうび・泉）
function gather(run) {
  const w = run.world, s = run.init;
  const p = partyOf(w, s);
  for (const sid of p?.members || []) {
    const m = w.sessions.get(sid);
    if (!m || m === s || run.parts.includes(m) || !m.inWorld || m.away || m.busy || m.map !== s.map) continue;
    m.busy = 'script';
    m.runId = run.id;
    run.parts.push(m);
  }
  return run.everyone.filter((m) => m.map === s.map);
}

// みんなで 階を うつる（to: マップ ID。着いた 場所は その マップの sd.arrive）
async function moveAll(run, people, to) {
  const m = MAPS[to];
  for (const x of people) x.sdStep = to;
  await run.runSteps([['sfx', 'stairs'], ['teleport', to, m.sd.arrive.x, m.sd.arrive.y, 'down']]);
  for (const x of people) delete x.sdStep;
}

// 階に 着いた: ちょうせん中の 人は 記録を のばす（いっしょに いた 家族の 名前も）
function arriveFloor(world, people, f) {
  const now = world.now();
  const news = [];
  for (const m of people) {
    const c = m.char;
    const sd = sdOf(c);
    const r = runOf(c);
    if (!r || r.mid || r.f !== f - 1) {
      sd.run = { f, mid: true, took: [] };
      continue;
    }
    r.f = f;
    const others = people.filter((o) => o !== m).map((o) => o.char.name);
    if (noteSdFloor(c, f, others, now)) news.push(m);
  }
  world.markDirty();
  for (const m of people) {
    const mid = runOf(m.char)?.mid;
    const isNew = news.includes(m);
    world.send(m, { t: 'toast', text: `${SD_NAME}　地下${f}階${isNew ? '\n★新記録！' : mid ? '\n（とちゅうから来たので、今回は記録にならない）' : ''}` });
    world.sendSelf(m);
  }
  return news;
}

// ───────────── 入口（ミドリナ地方）─────────────
async function doorEvent(run) {
  const s = run.init;
  if (!run.world.worldFlags(s)[SD_OPEN_FLAG]) {
    await run.runSteps([['say', null, '古い石のとびらがある。\nかたくとざされていて、びくともしない…。']]);
    return;
  }
  await run.runSteps([['sfx', 'stairs'], ['teleport', SD_GATE, GATE_ARRIVE.x, GATE_ARRIVE.y, 'down']]);
}

// ───────────── 入口の 広間 ─────────────
async function guideTalk(run) {
  const c = run.init.char;
  const r = sdRecordOf(c);
  const say = (...lines) => lines.map((l) => ['say', GUIDE, l]);
  const explain = say(
    'このダンジョンには、終わりがない。\n下の階へ行くほど、魔物が強くなるぞ。',
    '階はいつも同じ形じゃ。家族みんな、同じ階を同じ形でもぐるんじゃよ。',
    `5階ごとに休み所がある。\n回復の泉と、ごほうびの宝箱があるぞ。初めて着いた休み所の宝箱には、大きなごほうびが入っておる。`,
    '休み所からは、地上へもどれる。\n10階ごとの休み所では、強い番人が下り階段を守っておる。',
    'ここでは、みちびきの糸も帰り道の羽も、ルーラも使えん。\n全滅すると、この入口にもどされる。でも、お金はへらんから安心せい。',
    'それから…ここの魔物は、なぜか仲間にならんのじゃ。',
    'ちょうせんは、いつも地下1階から。\n何階まで行けたかは、となりの「家族の記録の板」にのこるぞ。',
    'パーティーを組んで入れば、いっしょにいた家族みんなの記録になる。\n家族で、何階までもぐれるかきそってみるとよい。',
  );
  await run.runSteps([
    ...say(r.best > 0 ? `おお、${c.name}か。\n${c.name}の最高は、地下${r.best}階じゃったな。` : `ようこそ、${SD_NAME}へ。\nわしは、このダンジョンの案内人じゃ。`),
    ['choice', '何を聞く？', ['このダンジョンのこと', '記録の板を見る', 'またこんど'], [
      explain,
      [['call', boardOpen]],
      say('うむ。気をつけてな。'),
    ]],
  ]);
}

export function boardData(world, s) {
  return {
    family: world.familyName || '',
    offline: !!world.offline,
    rows: sdBoardRows(world.data.characters),
    me: { id: s.char.id, name: s.char.name, ...sdRecordOf(s.char), text: sdRecordText(sdRecordOf(s.char)) },
  };
}

async function boardOpen(run) {
  const r = await run.flush();
  if (r.aborted) return run.abort();
  run.batch.push(['ui', 'sdBoard', boardData(run.world, run.init)]);
  const r2 = await run.flush();
  if (r2.aborted) run.abort();
}

// 地下1階へ（ちょうせんの はじまり）
async function enterEvent(run) {
  await run.runSteps([
    ['choice', `${SD_NAME}の地下1階へ下りますか？\n（おすすめ: レベル${sdRecommendLv(1)}くらいから）`, ['下りる', 'やめる'], [[['call', startRun]], []]],
  ]);
}

async function startRun(run) {
  const people = gather(run);
  for (const m of people) {
    const sd = sdOf(m.char);
    sd.run = { f: 0, took: [] };
    sd.tries = (sd.tries || 0) + 1;
  }
  await moveAll(run, people, sdFloorId(1));
  if (run.aborted) return;
  arriveFloor(run.world, people, 1);
}

// ───────────── 下りる（下り階段・休み所の「先へ進む」・番人）─────────────
async function downEvent(run) {
  const world = run.world;
  const f = sdFloorOf(run.init.map);
  if (!f) return;
  const people = gather(run);
  if (isGuardFloor(f)) {
    const sp = sdGuardian(f);
    const name = MONSTERS[sp]?.name || '番人';
    const enc = sdGuardEncounter(f);
    await run.runSteps([
      ['bgm', null],
      ['showMon', sp],
      ['say', null, `下り階段の前に、番人の${name}が立ちはだかった！`],
      ['say', name, '…ここから先へ進みたくば、力を見せてみよ！'],
      ['showMon', null],
      ['battle', enc],
    ]);
    if (run.aborted) return;
    await run.runSteps([['bgm', 'resume'], ['sfx', 'key'], ['say', null, `番人の${name}をたおした！\n下り階段への道が開いた！`]]);
    if (run.aborted) return;
  }
  const next = f + 1;
  const go = people.filter((m) => world.sessions.has(m.id) && m.map === MAPS[sdFloorId(f)].id);
  await moveAll(run, go, sdFloorId(next));
  if (run.aborted) return;
  arriveFloor(world, go, next);
  if (isRestFloor(next)) {
    const lines = [`地下${next}階の休み所に着いた！\nここには魔物が来ない。`, '回復の泉と、ごほうびの宝箱がある。\n（地上へもどりたい時は、休み所のようせいに話しかけよう）'];
    if (isGuardFloor(next)) lines.push(`下り階段の前には、番人の${MONSTERS[sdGuardian(next)]?.name || '魔物'}がいる…。\n準備をしてから話しかけよう。`);
    await run.runSteps([['sfx', 'sparkle'], ...lines.map((l) => ['say', null, l])]);
  } else if (sdBand(next) !== sdBand(f)) {
    await run.runSteps([['say', null, `あたりの様子が変わった…。\n（${sdBand(next).label}）`]]);
  }
}

// ───────────── 休み所 ─────────────
async function restTalk(run) {
  const f = sdFloorOf(run.init.map);
  if (!isRestFloor(f)) return;
  await run.runSteps([
    ['say', FAIRY, `ここは地下${f}階の休み所。\n泉の水を飲んで、ひと休みしていってね。`],
    ['choice', 'どうする？', ['先へ進む', '地上へもどる', 'やめる'], [
      [['call', downEvent]],
      [['choice', '地上へもどると、今回のちょうせんはおしまい。\n（記録はのこるよ）もどる？', ['もどる', 'やめる'], [[['call', exitEvent]], []]]],
      [['say', FAIRY, 'いってらっしゃい。むりはしないでね。']],
    ]],
  ]);
}

async function exitEvent(run) {
  const f = sdFloorOf(run.init.map);
  const people = gather(run);
  const lines = people.map((m) => `${m.char.name}の記録: 最高は地下${sdRecordOf(m.char).best}階`);
  await run.runSteps([
    ['say', FAIRY, `おつかれさま！\n今回は地下${f}階まで来られたね。`],
    ['fade', 'out'],
    ['sfx', 'stairs'],
    ['teleport', SD_GATE, GATE_ARRIVE.x, GATE_ARRIVE.y, 'down'],
    ['fade', 'in'],
    ...lines.map((l) => ['say', null, l]),
  ]);
}

// 回復の泉（いっしょに いる 家族も みんな）
async function springEvent(run) {
  gather(run);
  await run.runSteps([
    ['say', null, 'すきとおった泉がわいている。'],
    ['choice', '泉の水を飲む？', ['飲む', 'やめる'], [
      [['heal'], ['sfx', 'heal'], ['say', null, '体の底から力がわいてくる！\nみんなのHPとMPが回復した！']],
      [],
    ]],
  ]);
}

// ごほうびの 宝箱（1回の ちょうせんで 1人1回。初めて 着いた 休み所は 大きな ごほうび）
async function chestEvent(run) {
  const world = run.world;
  const f = sdFloorOf(run.init.map);
  if (!isRestFloor(f)) return;
  const people = gather(run);
  const steps = [];
  for (const m of people) {
    const c = m.char;
    const sd = sdOf(c);
    let r = runOf(c);
    if (!r || r.f !== f) r = sd.run = { f, mid: true, took: [] };
    if (!Array.isArray(r.took)) r.took = [];
    if (r.took.includes(f)) continue;
    r.took.push(f);
    const big = !r.mid && !sd.got.includes(f);
    const list = big ? sdBigReward(f) : [sdSmallReward(f, world.rng)];
    if (big) sd.got.push(f);
    for (const e of list) {
      if (e.gold) c.gold = Math.min(9999999, (c.gold || 0) + e.gold);
      else if (e.medal) {
        c.medalSpots = c.medalSpots && typeof c.medalSpots === 'object' ? c.medalSpots : {};
        c.medalSpots[sdMedalId(f)] = world.now();
      } else addItem(c, e.item, e.n || 1);
    }
    steps.push(['sfx', big ? 'key' : 'item']);
    if (big) steps.push(['say', null, `★地下${f}階に初めて着いたごほうび！\n${c.name}は${list.map(rewardText).join('と')}を手に入れた！`]);
    else steps.push(['say', null, `${c.name}は${list.map(rewardText).join('と')}を手に入れた！`]);
    world.sendSelf(m);
  }
  world.markDirty();
  if (!steps.length) {
    await run.runSteps([['say', null, '宝箱はからっぽだ。\n（次のちょうせんで来ると、また何か入っているよ）']]);
    return;
  }
  await run.runSteps([['sfx', 'chest'], ['say', null, 'ごほうびの宝箱を開けた！'], ...steps]);
}

// だいほんの しょり（data/story-secret.js）
Object.assign(SD_HOOKS, {
  door: doorEvent, guide: guideTalk, board: boardOpen, enter: enterEvent, down: downEvent, rest: restTalk, chest: chestEvent, spring: springEvent,
});

export { SD_DOOR_OUT };
