// 第5章「空にうかぶ大地」Step 1・2（A: 世界と物語）
// 第4章クリア → ホシミばあちゃん → 2回目の 星祭り（c5_start）→ フードの子（c5_hood）→ 守り星の石（c5_stones）→ 星の羽（c5_wings）
// → 竜で「雲の上へ」→ 天のとばりに はじかれる（c5_veil）→ ばあちゃんと 古い 書物（c5_book）→ 星の塔（c5_tower。8階）
// → 星の番人アルゴス（c5_argos）→ てっぺんで 天のとばりを 開く（c5_sky）
// 塔の 魔物・アルゴスの 戦いの しくみは B（戦い）。ここでは 戦いは テストの 中で 勝たせる（負けも ためす）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked, effectiveTile } from '../public/js/shared/maps/index.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import { flowReach } from '../public/js/shared/maps/flow.js';
import {
  C5, BOOK_FLAG, DOOR_FLAG, EV, LIFTS, VANES, DOOR6_FLAG, STAR_FLAGS, STARS_FLAG, TOWER_POS, TOWER_MAPS, TOWER_FLOORS, TOWER_OUT,
  TOWER_SIGHTS, REST_FLOOR, towerMapId, towerTable, towerTheme, FEST_DECO,
} from '../public/js/shared/maps/tower.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import {
  CH5_STEPS, C5_OBJ, OLD_C5_OBJ, C5_LEAD, CH5_STORY_SCRIPTS, CH5_OBJECTIVE_TARGETS, CH5_OBJECTIVE_TALK, BOOK_TEXT,
} from '../public/js/shared/data/story-ch5.js';
import { OLD_C4_OBJ } from '../public/js/shared/data/story-ch4.js';
import { TEMPLE_OBJ } from '../public/js/shared/data/story-ch4-temple.js';
import { objectiveFromFlags, KNOWN_OBJECTIVES, repairObjective } from '../public/js/shared/data/progress.js';
import { talkFor } from '../public/js/shared/data/party-talk.js';
import { questMarks } from '../public/js/shared/data/quest-targets.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { VEIL, veilState, veilText, regionsFrom } from '../public/js/shared/data/sky.js';
import { DAY_MS, isNightFor } from '../public/js/shared/world/clock.js';
import { dungeonExit } from '../public/js/shared/world/escape.js';
import { recruitNpc } from '../public/js/shared/world/party.js';
import { gainExp, expForLevel } from '../public/js/shared/stats.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { Bot, tickN } from './helpers.js';

const at = (frac) => 50 * DAY_MS + Math.round(frac * DAY_MS);
const hour = (h, m = 0) => (h + m / 60 - 6) / 24;
const UPTO = (f) => STORY_STEPS.slice(0, STORY_STEPS.indexOf(f) + 1);
const flagsOf = (...l) => Object.fromEntries(l.map((k) => [k, true]));
const said = (bot, text, from = 0) => bot.msgs.slice(from).some((m) => m.t === 'script' && JSON.stringify(m.steps).includes(text));
const toast = (bot, text, from = 0) => bot.msgs.slice(from).some((m) => m.t === 'toast' && m.text.includes(text));
const ctx = (flags, extra = {}) => ({ c: { name: 'ソラ' }, name: 'ソラ', night: false, flag: (f) => !!flags[f], has: () => false, count: () => 0, ...extra });
const VIL = PLACES.village;

function boost(c, level) {
  gainExp(c, expForLevel(level) - c.exp);
  Object.assign(c.equip, { weapon: 'platinum_sword', armor: 'platinum_mail', shield: 'platinum_shield', head: 'platinum_helm' });
  c.jobs[c.job] = { lv: 10, b: 999 };
}
async function setup(seed, upto, extra = [], frac = hour(10)) {
  const clock = { now: at(frac) };
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false, now: () => clock.now });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  for (const f of UPTO(upto)) c.flags[f] = true;
  for (const f of extra) c.flags[f] = true;
  if (!c.keyItems.includes('wind_flute')) c.keyItems.push('wind_flute');
  c.objective = objectiveFromFlags(c);
  c.timeShift = 0;
  boost(c, 42);
  world.sendSelf(bot.s);
  bot.s.repelUntil = 1e15;
  return { world, bot, c, clock };
}
const place = async (bot, map, x, y, dir = 'up') => {
  bot.world.placeSession(bot.s, map, x + 0.5, y + 0.5, dir, true);
  await play(bot);
};
async function stepOn(bot, x, y, opts) {
  bot.x = x + 0.5;
  bot.y = y + 0.5;
  bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'up', moving: true, seq: bot.seq });
  await tickN(bot.world, 1);
  return play(bot, opts);
}
const talk = (bot, id, opts) => { bot.send({ t: 'interact', kind: 'npc', id }); return play(bot, opts); };
const examine = (bot, x, y, opts) => { bot.send({ t: 'interact', kind: 'tile', x, y }); return play(bot, opts); };

// 戦いは テストの 中で きめる（win … 敵を ぜんぶ たおす / lose … みかたが ぜんぶ たおれる）
function finish(ctx2, lose) {
  const b = ctx2.battle;
  if (lose) {
    for (const a of b.allies) if (a.alive) b.kill(a);
  } else {
    for (let k = 0; k < 20; k++) {
      const alive = b.enemies.filter((e) => e.alive);
      if (!alive.length) break;
      for (const e of alive) b.kill(e);
    }
  }
  b.checkEnd();
}
async function play(bot, { lose = () => false, fought = null, max = 40000, others = [] } = {}) {
  const world = bot.world;
  for (let i = 0; i < max; i++) {
    for (const c2 of world.battles.values()) {
      if (c2.battle.over || c2.battle.pendingEnd || c2.done) continue;
      c2.done = true;
      if (fought) fought.push(c2.opts.fixed || c2.opts.symbolId || 'field');
      finish(c2, lose(c2.opts.fixed));
    }
    bot.flushQueue();
    for (const o of others) o.flushQueue();
    await tickN(world, 1);
    bot.flushQueue();
    for (const o of others) o.flushQueue();
    const idle = (b) => !b.s.busy && !b.queue.length && !b.inBattle;
    if ([bot, ...others].every(idle) && !world.battles.size) {
      await tickN(world, 2);
      bot.flushQueue();
      for (const o of others) o.flushQueue();
      if ([bot, ...others].every(idle) && !world.battles.size) return true;
    }
  }
  return false;
}
// その 世界で 通れる マス（flags … たっている フラグ。ワープの マスは 入れるが その 先へは 行かない）
function reach(id, start, flags) {
  const m = MAPS[id];
  const has = (f) => flags.includes(f);
  const seen = new Set([start[1] * m.w + start[0]]);
  const q = [start];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = ny * m.w + nx;
      if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h || seen.has(k)) continue;
      if (isBlocked(m, nx, ny, has) && !m.warpAt.has(k)) continue;
      seen.add(k);
      if (!m.warpAt.has(k)) q.push([nx, ny]);
    }
  }
  return (x, y) => seen.has(y * m.w + x);
}
const near = (r, p) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => r(p.x + dx, p.y + dy));
// 塔の 階の 入口（下の 階から 上がってきた ところ。1階は 外からの 入口）
const arrive = (n) => (n === 1 ? [13, 19] : [TOWER_POS[n].down.x, TOWER_POS[n].down.y - 1]);
const ALL_TOWER = [...Object.values(LIFTS).map((l) => l.flag), ...Object.values(VANES).map((v) => v.flag), DOOR6_FLAG, ...STAR_FLAGS, STARS_FLAG, C5.argos];

// ───────────── すすみぐあい・目標・ヒント・しるし ─────────────
test('すすみぐあい: c4_clear → c5_start … c5_sky。目標・仲間会話・地図の しるし・第4章クリアの 文の なおし', () => {
  assert.deepEqual(CH5_STEPS.slice(0, 8), ['c5_start', 'c5_hood', 'c5_stones', 'c5_wings', 'c5_veil', 'c5_tower', 'c5_argos', 'c5_sky'], '名前の 約束（plan-ch5.md の 11。Step 3 から うしろに たす）');
  const ci = STORY_STEPS.indexOf('c4_clear');
  assert.deepEqual(STORY_STEPS.slice(ci + 1, ci + 1 + CH5_STEPS.length), CH5_STEPS, '第4章の あとに つづく');
  const f = (...l) => ({ flags: flagsOf(...UPTO('c4_clear'), ...l) });
  // 第4章クリアの 目標は 第5章の はじまり（ホシミばあちゃん）へ。第5章の 前の 文は なおる
  assert.equal(objectiveFromFlags(f()), TEMPLE_OBJ.clear);
  assert.equal(C5_LEAD, TEMPLE_OBJ.clear);
  assert.ok(TEMPLE_OBJ.clear.includes('ホシミばあちゃん') && TEMPLE_OBJ.clear.includes('第5章'));
  const old = { flags: f().flags, objective: OLD_C4_OBJ.clear };
  assert.ok(repairObjective(old));
  assert.equal(old.objective, TEMPLE_OBJ.clear);
  // フラグごとの 目標
  const seq = [
    [['c5_start'], 'start'], [['c5_hood'], 'hood'], [['c5_stones'], 'stones'], [['c5_wings'], 'wings'], [['c5_veil'], 'veil'],
    [['c5_veil', BOOK_FLAG], 'book'], [['c5_tower', EV(1)], 'tower'],
    ...[2, 3, 4, 5, 6, 7, 8].map((n) => [['c5_tower', ...[2, 3, 4, 5, 6, 7, 8].filter((k) => k <= n).map(EV)], `f${n}`]),
    [['c5_argos'], 'argos'], [['c5_sky'], 'sky'],
  ];
  for (const [fl, k] of seq) assert.equal(objectiveFromFlags(f(...UPTO(fl[0]).filter((x) => x.startsWith('c5_')), ...fl)), C5_OBJ[k], k);
  // Step 2 の さいごの 目標は、Step 3 で「雲の上」へ 飛ぶ 文に かわった（前の 文は OLD_C5_OBJ.sky。repairObjective で なおる）
  assert.ok(C5_OBJ.sky.includes('雲の上') && C5_OBJ.sky.includes('空にうかぶ島'));
  assert.ok(OLD_C5_OBJ.sky.startsWith('第5章の続きはアップデートで！'));
  const oldSky = { flags: flagsOf(...UPTO('c5_sky')), objective: OLD_C5_OBJ.sky };
  assert.ok(repairObjective(oldSky));
  assert.equal(oldSky.objective, C5_OBJ.sky);
  // どの 目標にも 仲間会話と 行き先
  for (const [k, t] of Object.entries(C5_OBJ)) {
    assert.ok(KNOWN_OBJECTIVES.has(t), k);
    assert.ok(CH5_OBJECTIVE_TARGETS[t]?.length, `行き先 ${k}`);
    assert.ok(CH5_OBJECTIVE_TALK[t], `仲間会話 ${k}`);
    for (const kind of ['self', 'bold', 'kind', 'kid']) assert.ok(talkFor(t, kind) !== `次は「${t.replace(/\n/g, '')}」ですね。`, `仲間会話: ${k} ${kind}`);
  }
  // ヒント: 上り下りの ゆか（2人・仲間）・風見の石・夜の 星座・見通しの目
  assert.ok(talkFor(C5_OBJ.f2, 'self').includes('重りのゆか') && talkFor(C5_OBJ.f2, 'self').includes('仲間'));
  assert.ok(talkFor(C5_OBJ.f3, 'kind').includes('風見の石'));
  assert.ok(talkFor(C5_OBJ.f5, 'self').includes('夜') && talkFor(C5_OBJ.f5, 'self').includes('頭'));
  assert.ok(talkFor(C5_OBJ.f8, 'self').includes('見通'));
  // 地図の しるし: 村では ばあちゃん・守り星の石、フィールドでは 塔の とびら、塔の 中では しかけと かいだん
  const mark = (obj, map, extra = []) => questMarks({ flags: flagsOf(...UPTO('c4_clear'), ...extra), objective: obj }, map).filter((m) => m.kind === 'main');
  assert.ok(mark(C5_OBJ.hood, 'overworld').some((m) => m.x === VIL.x + 16 && m.y === VIL.y + 11), '守り星の石');
  assert.ok(mark(C5_OBJ.book, 'overworld').some((m) => m.x === TOWER_OUT.view.x && m.y === TOWER_OUT.view.y), '星の塔');
  assert.ok(mark(C5_OBJ.tower, 'overworld').length, '外からも 塔へ');
  const f2 = mark(C5_OBJ.f2, towerMapId(2));
  assert.ok(f2.some((m) => m.x === LIFTS.f2.plate.x && m.y === LIFTS.f2.plate.y), '重りの ゆか');
  assert.ok(!mark(C5_OBJ.f2, towerMapId(2), [LIFTS.f2.flag]).some((m) => m.x === LIFTS.f2.plate.x), 'すんだ しかけの しるしは 消える');
  assert.ok(mark(C5_OBJ.f5, towerMapId(5)).some((m) => m.x === TOWER_POS[5].stars[0].x && m.y === TOWER_POS[5].stars[0].y), '頭の 星');
  assert.ok(mark(C5_OBJ.f8, towerMapId(8)).length, 'アルゴス');
  assert.ok(mark(C5_OBJ.argos, towerMapId(8)).length, '8階から てっぺんへ');
  // パーティー全員で 見る だいほん
  for (const id of CH5_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id) && SCRIPTS[id], id);
});

// ───────────── 星祭りの 夜・フードの子・守り星の石・星の羽 ─────────────
test('星祭りの 台本: ばあちゃん → 夜の 星祭り → フードの子（名前は 出ない）→ 守り星の石 → 星の羽', { timeout: 60000 }, async () => {
  const { world, bot, c } = await setup(5101, 'c4_clear');
  assert.ok(!isNightFor(world, bot.s), '昼から');
  // 第4章クリアまでは、ばあちゃんは 前の まま
  assert.ok(!SCRIPTS.elder(ctx(flagsOf(...UPTO('c4_star')))).some((s) => s[0] === 'flag' && s[1] === 'c5_start'));
  await place(bot, 'overworld', VIL.x + 24, VIL.y + 18);
  await talk(bot, 'elder');
  assert.ok(c.flags.c5_start && c.flags.c5_hood, '星祭り → フードの子');
  assert.ok(isNightFor(world, bot.s), '祭りは 夜（時計が すすむ）');
  assert.ok(said(bot, '…きみが、えらばれた子か。'));
  assert.ok(said(bot, '"フードの子"'), '名前は「フードの子」');
  assert.ok(!bot.msgs.some((m) => m.t === 'script' && JSON.stringify(m.steps).includes('ノクト')), 'ノクトの 名前は まだ 出ない');
  assert.ok(said(bot, '"chapter","第5章","空にうかぶ大地"'));
  assert.equal(c.objective, C5_OBJ.hood);
  // 祭りの かざり（村の 広場。塔に 入るまで）
  for (const [id] of FEST_DECO) {
    const n = MAPS.overworld.npcById[id];
    assert.ok(n && n.show.all.includes('c5_start') && n.show.not.includes('c5_tower'), id);
    assert.ok(!TILE_INFO[MAPS.overworld.tiles[Math.floor(n.y) * MAPS.overworld.w + Math.floor(n.x)]].solid, `${id}: 広場の 草の 上`);
  }
  // 村の 人の ことば（祭り）
  assert.ok(JSON.stringify(SCRIPTS.luca_after(ctx(flagsOf(...UPTO('c5_hood'))))).includes('フードの子'));
  assert.ok(!JSON.stringify(SCRIPTS.luca_after(ctx(flagsOf(...UPTO('c4_clear'))))).includes('フード'));
  // 守り星の石 → 3つの 守り星 → アステルに 星の羽
  await place(bot, 'overworld', VIL.x + 16, VIL.y + 12);
  await talk(bot, 'star_stone');
  assert.ok(c.flags.c5_stones && c.flags.c5_wings);
  assert.ok(said(bot, '"crest"'), '紋章が 光る');
  assert.ok(said(bot, '"sprite":"star_dragon"'), '星の羽の アステル');
  assert.equal(c.objective, C5_OBJ.wings);
  // ばあちゃん（星の羽の あと）は「雲の上へ」の ヒント
  assert.ok(JSON.stringify(SCRIPTS.elder(ctx(flagsOf(...UPTO('c5_wings'))))).includes('雲の上へ'));
});

// ───────────── 竜の 天のとばり（data/sky.js）・古い 書物 ─────────────
test('天のとばり: 星の羽の 竜で「雲の上へ」→ はじめは だいほん（c5_veil）・2回目からは はじかれる・とばりが 開くと 開いている。ばあちゃんと 古い 書物（c5_book）', { timeout: 60000 }, async () => {
  const has = (l) => (f) => l.includes(f);
  assert.equal(veilState(has([])), null, '星の羽が ないと 出ない');
  assert.equal(veilState(has(['c5_wings'])), 'first');
  assert.equal(veilState(has(['c5_wings', 'c5_veil'])), 'shut');
  assert.equal(veilState(has(['c5_wings', 'c5_veil', 'c5_sky'])), 'open');
  assert.match(veilText(has(['c5_wings', 'c5_veil'])), /はじき返された[\s\S]*ホシミばあちゃん/);
  assert.match(veilText(has(['c5_wings', 'c5_veil', 'c5_book'])), /はじき返された[\s\S]*星の塔/);
  assert.match(veilText(has(['c5_wings', 'c5_veil', 'c5_sky'])), /とばりをこえて[\s\S]*雲の上/, 'とばりが 開くと 雲の上の クモイ地方へ（Step 3）');
  assert.equal(VEIL.id, 'veil');
  assert.ok(!regionsFrom('overworld', () => true).includes('veil'), '地方の ならびは かえない（「雲の上」は べつの えらぶ ところ）');

  const { world, bot, c } = await setup(5201, 'c5_wings');
  // 村の 外で 竜を 呼ぶ → 雲の上へ → 天のとばりに はじかれる（だいほん）
  await place(bot, 'overworld', 28, 84);
  bot.send({ t: 'fly', action: 'call' });
  assert.ok(bot.s.flying, '竜に 乗った');
  bot.send({ t: 'fly', action: 'region', to: 'veil' });
  await play(bot);
  assert.ok(c.flags.c5_veil, 'はじかれた');
  assert.ok(said(bot, '天のとばり'));
  assert.equal(c.objective, C5_OBJ.veil);
  assert.ok(bot.s.flying && bot.s.map === 'overworld', 'その まま 空の 上');
  // 2回目は はじかれる（ことばだけ）
  const from = bot.msgs.length;
  bot.send({ t: 'fly', action: 'region', to: 'veil' });
  await play(bot);
  assert.ok(toast(bot, 'はじき返された', from));
  // ばあちゃんと 女王ネフィの 古い 書物 → 星の塔
  bot.send({ t: 'fly', action: 'land' });
  await place(bot, 'overworld', VIL.x + 24, VIL.y + 18);
  await talk(bot, 'elder');
  assert.ok(c.flags[BOOK_FLAG]);
  assert.ok(said(bot, BOOK_TEXT.split('\n')[0].slice(1, 10)), '古い 書物');
  assert.equal(c.objective, C5_OBJ.book);
  // 塔の とびら: 書物を 読む 前は 開かない・読んだ あとは 紋章で 開く
  assert.ok(!JSON.stringify(SCRIPTS.c5_tower_door(ctx(flagsOf(...UPTO('c5_veil'))))).includes(DOOR_FLAG));
  await place(bot, 'overworld', TOWER_OUT.door.x, TOWER_OUT.door.y + 1);
  await examine(bot, TOWER_OUT.door.x, TOWER_OUT.door.y);
  assert.ok(c.flags[DOOR_FLAG]);
  assert.equal(effectiveTile(MAPS.overworld, TOWER_OUT.door.x, TOWER_OUT.door.y, world.hasFlagFn(bot.s)), T.TOWER_GATE);
});

// ───────────── 塔の マップ ─────────────
test('マップ: 星の塔 8階と てっぺん。かいだんの つながり・4階の 休み所・どの 階にも 星の エレベーター・糸が 使える', () => {
  assert.equal(TOWER_MAPS.length, TOWER_FLOORS + 1);
  assert.equal(TOWER_FLOORS, 8);
  for (const id of TOWER_MAPS) {
    const m = MAPS[id];
    assert.ok(m, id);
    assert.equal(m.kind, 'dungeon');
    assert.ok(!m.noEscape, `${id}: 糸・リレミトが 使える`);
    assert.equal(m.bgm, 'star_tower');
    assert.ok(!['tower_1f', 'tower_2f'].includes(id), '嵐の塔（第2章）と ID が ちがう');
  }
  // 下は 石、上へ 行くほど 星空の 色
  assert.deepEqual([1, 3, 4, 6, 7, 8].map(towerTheme), ['star_tower', 'star_tower', 'star_tower_mid', 'star_tower_mid', 'star_tower_high', 'star_tower_high']);
  assert.ok(MAPS[towerMapId(5)].tiles.includes(T.SKY_FLOOR), '5階は 星空の ゆか');
  // 出現表（B の 名前）
  for (let n = 1; n <= TOWER_FLOORS; n++) {
    const m = MAPS[towerMapId(n)];
    const table = towerTable(n);
    assert.equal(table, n <= 4 ? 't5_tower_low' : 't5_tower_high');
    assert.ok(ENCOUNTER_TABLES[table], table);
    assert.ok(m.spawnCounts[table] > 0, `${n}階: 魔物が 出る`);
    const P = TOWER_POS[n];
    // かいだんの つながり（上は 1つ 上の 階・下は 1つ 下の 階）
    const upW = m.warps.find((w) => w.x === P.up.x && w.y === P.up.y);
    assert.equal(upW.to.map, towerMapId(n + 1), `${n}階の 上り`);
    if (n > 1) assert.equal(m.warps.find((w) => w.x === P.down.x && w.y === P.down.y).to.map, towerMapId(n - 1), `${n}階の 下り`);
    // エレベーター（その 階に 来ると 光る）
    assert.ok(P.ev, `${n}階の エレベーター`);
    assert.equal(effectiveTile(m, P.ev.x, P.ev.y, () => false), T.ELEVATOR);
    assert.equal(effectiveTile(m, P.ev.x, P.ev.y, (f) => f === EV(n)), T.ELEVATOR_LIT);
    assert.ok(m.triggers.some((tr) => tr.script === `c5_ev${n}`));
    // しかけを ぜんぶ といた 世界では、入口から 上り・エレベーター・宝箱に 行ける
    const r = reach(m.id, arrive(n), ALL_TOWER);
    assert.ok(r(P.up.x, P.up.y), `${n}階: 上りかいだん`);
    assert.ok(near(r, P.ev), `${n}階: エレベーター`);
    for (const ch of m.chests) assert.ok(near(r, ch), `${n}階: 宝箱 ${ch.id}`);
    assert.equal(m.zoneAt(arrive(n)[0], arrive(n)[1]).startsWith('safe'), true, `${n}階: かいだんの まわりは 魔物が 出ない`);
  }
  // 1階の 出口 → フィールドの 塔の 前・糸は 塔の 前へ
  const f1 = MAPS[towerMapId(1)];
  for (const p of TOWER_POS[1].exit) assert.equal(f1.warps.find((w) => w.x === p.x && w.y === p.y).to.map, 'overworld');
  const ow = MAPS.overworld;
  const door = ow.warps.find((w) => w.x === TOWER_OUT.door.x && w.y === TOWER_OUT.door.y);
  assert.equal(door.to.map, towerMapId(1));
  assert.ok(door.noMark, '宝の地図の 目じるしには しない');
  assert.ok(isBlocked(ow, TOWER_OUT.door.x, TOWER_OUT.door.y, () => false), 'とびらは しまっている');
  assert.ok(!isBlocked(ow, TOWER_OUT.door.x, TOWER_OUT.door.y, (f) => f === DOOR_FLAG), '紋章で 開く');
  const fake = { char: { dungeonFrom: null }, map: towerMapId(8) };
  const out = dungeonExit({}, fake);
  assert.equal(out.map, 'overworld', '糸で 塔の 外へ');
  assert.ok(Math.abs(out.x - TOWER_OUT.arrive.x) < 1 && Math.abs(out.y - TOWER_OUT.arrive.y) < 1);
  // 4階の 休み所（魔物の 出ない へやに 星の いずみ）・8階の 番人・てっぺんの さいだん
  const f4 = MAPS[towerMapId(REST_FLOOR)];
  assert.ok(f4.actions.some((a) => a.script === 'c5_rest' && a.x === TOWER_POS[4].font.x));
  assert.ok(f4.zoneAt(TOWER_POS[4].font.x, TOWER_POS[4].font.y + 1).startsWith('safe'));
  const opts = SCRIPTS.c5_rest(ctx({})).find((s) => s[0] === 'choice')[3];
  assert.ok(opts[0].some((s) => s[0] === 'heal') && opts[0].some((s) => s[0] === 'church'), '回復と 記録');
  assert.ok(opts[1].some((s) => s[0] === 'inn' && s[3] === 'night'), '夜まで 休める');
  assert.ok(MAPS[towerMapId(8)].npcs.some((n) => n.id === 'argos_npc' && n.sprite === 'mon:argos'));
  const top = MAPS[towerMapId(9)];
  assert.ok(top.actions.some((a) => a.script === 'c5_altar'));
  assert.equal(top.warps[0].to.map, towerMapId(8));
  // 1つの 階に 1つの 見どころ
  assert.equal(TOWER_SIGHTS.length, TOWER_FLOORS + 2);
  assert.equal(new Set(TOWER_SIGHTS.slice(1)).size, TOWER_FLOORS + 1);
});

test('近道: 星の エレベーターは 1度 来た 階だけ。えらんだ 階の エレベーターの となりへ', async () => {
  const { world, bot, c } = await setup(5301, 'c5_tower', [EV(1), EV(2), EV(4)]);
  await place(bot, towerMapId(1), TOWER_POS[1].evOut.x, TOWER_POS[1].evOut.y);
  const steps = SCRIPTS.c5_ev1(ctx(c.flags));
  const ch = steps.find((s) => s[0] === 'choice');
  assert.equal(ch[3].length, 3, '2階・4階・やめる');
  assert.deepEqual(ch[2], ['2階', '4階', 'やめる']);
  bot.choice = 1;
  await stepOn(bot, TOWER_POS[1].ev.x, TOWER_POS[1].ev.y);
  assert.equal(bot.s.map, towerMapId(4), '4階へ');
  assert.equal(Math.floor(bot.s.x), TOWER_POS[4].evOut.x);
  // まだ 来ていない 階（3階）の エレベーターは、ふむと 光る
  await place(bot, towerMapId(3), TOWER_POS[3].evOut.x, TOWER_POS[3].evOut.y);
  bot.choice = 3;
  await stepOn(bot, TOWER_POS[3].ev.x, TOWER_POS[3].ev.y);
  assert.ok(c.flags[EV(3)]);
  assert.equal(effectiveTile(MAPS[towerMapId(3)], TOWER_POS[3].ev.x, TOWER_POS[3].ev.y, world.hasFlagFn(bot.s)), T.ELEVATOR_LIT);
});

// ───────────── 3つの しかけ ─────────────
test('しかけ: 上り下りの ゆかは、重りの ゆかに だれかが いないと 上がらない（どの 塔の 階でも 上の だんへは 行けない）', () => {
  for (const L of Object.values(LIFTS)) {
    const m = MAPS[L.map];
    const n = Number(L.map.match(/_(\d)f/)[1]);
    const before = ALL_TOWER.filter((f) => f !== L.flag);
    const r0 = reach(m.id, arrive(n), before);
    const r1 = reach(m.id, arrive(n), [...before, L.flag]);
    assert.ok(r1(L.top.x, L.top.y), `${L.flag}: 上がると 上の だんへ`);
    assert.ok(near(r0, L.lift) || r0(L.lift.x, L.lift.y), `${L.flag}: ゆかには 行ける`);
    if (L !== LIFTS.f7a) assert.ok(!r0(TOWER_POS[n].up.x, TOWER_POS[n].up.y), `${L.flag}: 上がる 前は 上の かいだんへ 行けない`);
    // 重りの ゆかは、上り下りの ゆかから はなれている（1人では 同時に のれない）
    assert.ok(Math.hypot(L.plate.x - L.lift.x, L.plate.y - L.lift.y) >= 8, `${L.flag}: はなれた 重りの ゆか`);
    assert.equal(effectiveTile(m, L.shaft[0].x, L.shaft[0].y, () => false), T.LIFT_SHAFT);
    assert.equal(effectiveTile(m, L.shaft[0].x, L.shaft[0].y, (f) => f === L.flag), T.LIFT_UP);
  }
  // 7階: 1つ目の ゆかが 上がる 前は、まん中の だんにも 行けない
  const r7 = reach(towerMapId(7), arrive(7), ALL_TOWER.filter((f) => f !== LIFTS.f7a.flag && f !== LIFTS.f7b.flag));
  assert.ok(!r7(LIFTS.f7b.plate.x, LIFTS.f7b.plate.y));
});

test('上り下りの ゆか（ひとり）: 仲間が いれば 重りの ゆかに のってもらう。だれも いなければ 動かない', { timeout: 60000 }, async () => {
  const L = LIFTS.f2;
  {
    const { bot, c } = await setup(5401, 'c5_tower', [EV(1), EV(2)]);
    await place(bot, L.map, L.lift.x, L.lift.y + 1);
    const from = bot.msgs.length;
    await stepOn(bot, L.lift.x, L.lift.y);
    assert.ok(!c.flags[L.flag], '動かない');
    assert.ok(said(bot, '仲間を連れてこよう', from));
    // 重りの ゆかを ふむ（ひとり）
    await place(bot, L.map, L.plate.x - 1, L.plate.y);
    const f2 = bot.msgs.length;
    await stepOn(bot, L.plate.x, L.plate.y);
    assert.ok(!c.flags[L.flag] && said(bot, '同時にのれない', f2));
  }
  {
    const { world, bot, c } = await setup(5402, 'c5_tower', [EV(1), EV(2)]);
    assert.ok(recruitNpc(world, bot.s, 'npc_gard', { force: true }).ok);
    await play(bot);
    await place(bot, L.map, L.lift.x, L.lift.y + 1);
    const from = bot.msgs.length;
    await stepOn(bot, L.lift.x, L.lift.y);
    assert.ok(c.flags[L.flag], '上がった');
    assert.ok(said(bot, 'ガルドに、重りのゆかにのってもらう？', from));
    assert.equal(bot.s.map, L.map);
    assert.deepEqual([Math.floor(bot.s.x), Math.floor(bot.s.y)], [L.top.x, L.top.y], '上の だんへ');
    assert.equal(effectiveTile(MAPS[L.map], L.plate.x, L.plate.y, world.hasFlagFn(bot.s)), T.WEIGHT_ON);
  }
});

async function familyAt(seed, flags) {
  const world = new GameWorld({ offline: false, rng: makeRng(seed), checkPassword: (pw) => pw === 'ほし', rateLimit: false });
  const papa = new Bot(world, 'パパ'), yui = new Bot(world, 'ユイ');
  await papa.login('ほし');
  await yui.login('ほし');
  await papa.createAndPlay('warrior');
  await yui.createAndPlay('mage');
  await papa.settle();
  await yui.settle();
  const Pa = world.sessions.get(papa.sid), Y = world.sessions.get(yui.sid);
  for (const f of flags) Pa.char.flags[f] = true;
  Pa.char.objective = objectiveFromFlags(Pa.char);
  boost(Pa.char, 42);
  boost(Y.char, 42);
  world.sendSelf(Pa);
  world.sendSelf(Y);
  papa.send({ t: 'party', action: 'invite', sid: Y.id });
  yui.send({ t: 'party', action: 'accept' });
  await papa.settle();
  await yui.settle();
  for (const b of [papa, yui]) b.s.repelUntil = 1e15;
  return { world, papa, yui, Pa, Y };
}
async function settleBoth(a, b) {
  for (let i = 0; i < 4; i++) {
    await a.settle();
    await b.settle();
  }
}
function walk1(bot, x, y) {
  bot.x = x + 0.5;
  bot.y = y + 0.5;
  bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'up', moving: true, seq: bot.seq });
}

test('上り下りの ゆか（家族 2人）: 1人が 重りの ゆか・もう1人が 上り下りの ゆか。のった 人だけ 上の だんへ（リーダーの 世界）', { timeout: 120000 }, async () => {
  const L = LIFTS.f2;
  const { world, papa, yui, Pa, Y } = await familyAt(5501, [...UPTO('c5_tower'), EV(1), EV(2)]);
  world.placeSession(Pa, L.map, L.lift.x + 0.5, L.lift.y + 1.5, 'up', true);
  world.placeSession(Y, L.map, L.plate.x - 0.5, L.plate.y + 0.5, 'right', true);
  await settleBoth(papa, yui);
  // パパだけ 上り下りの ゆか: 動かない（家族の もう1人を 待つ）
  walk1(papa, L.lift.x, L.lift.y);
  await settleBoth(papa, yui);
  assert.ok(!Pa.char.flags[L.flag]);
  assert.ok(said(papa, '家族のもう1人'));
  // ユイが 重りの ゆかに のる → パパが 上がる
  walk1(yui, L.plate.x, L.plate.y);
  await settleBoth(papa, yui);
  assert.ok(Pa.char.flags[L.flag], '上がった');
  assert.ok(!Y.char.flags[L.flag], 'ユイの 世界は かわらない');
  assert.deepEqual([Math.floor(Pa.x), Math.floor(Pa.y)], [L.top.x, L.top.y], 'パパが 上の だんへ');
  assert.deepEqual([Math.floor(Y.x), Math.floor(Y.y)], [L.plate.x, L.plate.y], 'ユイは 重りの ゆかの まま');
  // ユイも ゆかの 通り道から 上がれる
  const r = reach(L.map, [L.plate.x, L.plate.y], [L.flag]);
  assert.ok(r(L.top.x, L.top.y));
});

test('しかけ: 風の 窓（3階・6階）。風見の石を 回すまで 先へ 行けない。6階は 風の 道に のって 島へ・島から 近道の とびら', async () => {
  // 3階: 風に 流されると 手前の へやへ もどる
  const m3 = MAPS[towerMapId(3)];
  const up3 = TOWER_POS[3].up;
  const stops = (map, start, flags) => flowReach(map, start, (f) => flags.includes(f)).stops;
  const k = (p) => `${p.x},${p.y + 1}`;
  assert.ok(!stops(m3, arrive(3), []).has(k(up3)), '風が ふいていると 北の へやへ 行けない');
  assert.ok(!stops(m3, arrive(3), [VANES.f3a.flag]).has(k(up3)), '下の 風だけ 止めても まだ');
  assert.ok(stops(m3, arrive(3), [VANES.f3a.flag]).has(`${VANES.f3b.x + 1},${VANES.f3b.y}`), '下の 風を 止めると まん中の へやの 風見の石へ');
  assert.ok(stops(m3, arrive(3), [VANES.f3a.flag, VANES.f3b.flag]).has(k(up3)), '2つ 止めると 北の へやへ');
  // 風の 窓は しまる・風の マスは ゆかに なる
  const win = m3.gates.find((g) => g.closed === T.WIND_WINDOW && g.flag === VANES.f3a.flag);
  assert.ok(win);
  assert.equal(effectiveTile(m3, win.x + 1, win.y, () => false), T.WIND_E);
  assert.equal(effectiveTile(m3, win.x + 1, win.y, (f) => f === VANES.f3a.flag), T.CAVE_FLOOR);
  assert.ok(TILE_INFO[T.WIND_E].flow[0] === 1, '東へ 流される');
  // 6階
  const m6 = MAPS[towerMapId(6)];
  const up6 = TOWER_POS[6].up, road = TOWER_POS[6].road;
  assert.ok(!stops(m6, arrive(6), []).has(k(up6)));
  assert.ok(!stops(m6, arrive(6), [VANES.f6a.flag]).has(k(up6)), '風を 止めただけでは ふきぬけを わたれない');
  assert.equal(effectiveTile(m6, road[0][0], road[0][1], () => false), T.WIND_PIT, '風の 道は まだ ない');
  assert.equal(effectiveTile(m6, road[0][0], road[0][1], (f) => f === VANES.f6road.flag), T.WIND_E, '風の 道');
  const all6 = stops(m6, arrive(6), [VANES.f6a.flag, VANES.f6road.flag]);
  assert.ok(all6.has(k(up6)), '風の 道に のって 島へ');
  // 風の 道は 1方通行（島から もどれない）・近道の とびらは 島の がわから 開く
  const fromIsle = stops(m6, [26, 10], [VANES.f6a.flag, VANES.f6road.flag]);
  assert.ok(!fromIsle.has(`${arrive(6)[0]},${arrive(6)[1]}`), 'とびらが しまっていると 島から もどれない');
  assert.ok(stops(m6, [26, 10], [VANES.f6road.flag, DOOR6_FLAG]).has(`${arrive(6)[0]},${arrive(6)[1]}`), '近道の とびら');
  const { bot, c } = await setup(5601, 'c5_tower', [EV(6)]);
  const Q = TOWER_POS[6].door;
  await place(bot, towerMapId(6), Q.x - 1, Q.y);
  await examine(bot, Q.x, Q.y);
  assert.ok(!c.flags[DOOR6_FLAG], '南の へやからは 開かない');
  await place(bot, towerMapId(6), Q.x + 1, Q.y);
  await examine(bot, Q.x, Q.y);
  assert.ok(c.flags[DOOR6_FLAG], '島の がわから 開く');
  // 風見の石を 回す（だいほん）
  await place(bot, towerMapId(6), VANES.f6a.x + 1, VANES.f6a.y);
  await examine(bot, VANES.f6a.x, VANES.f6a.y);
  assert.ok(c.flags[VANES.f6a.flag]);
});

test('しかけ: 星座の ゆか（5階）。夜は 本物の 星だけ 光る・頭から じゅんに ふむと とびらが 開く・にせの 星や ちがう じゅんばんは やり直し', { timeout: 60000 }, async () => {
  const m5 = MAPS[towerMapId(5)];
  const P = TOWER_POS[5];
  const night = (f) => f === '@night';
  for (const s of P.stars) {
    assert.equal(effectiveTile(m5, s.x, s.y, () => false), T.STAR_DIM, '昼は 光らない');
    assert.equal(effectiveTile(m5, s.x, s.y, night), T.STAR_GLOW, '夜は 光る');
  }
  for (const s of P.fakes) {
    assert.equal(effectiveTile(m5, s.x, s.y, () => false), T.STAR_DIM, 'にせの 星も 昼は おなじ');
    assert.equal(effectiveTile(m5, s.x, s.y, night), T.STAR_DIM, 'にせの 星は 夜も 光らない');
  }
  assert.equal(P.stars.length, 5);
  assert.ok(!reach(m5.id, arrive(5), [])(P.up.x, P.up.y), 'とびらが しまっている');
  assert.ok(reach(m5.id, arrive(5), [STARS_FLAG])(P.up.x, P.up.y));
  // 星図（昼の ヒント）・4階の 日記・文字ばん
  assert.ok(JSON.stringify(SCRIPTS.c5_chart(ctx({}))).includes('竜の頭'));
  assert.ok(JSON.stringify(SCRIPTS.c5_diary(ctx({}))).includes('夜を待て'));

  const { world, bot, c } = await setup(5701, 'c5_tower', [EV(5)], hour(23));
  assert.ok(isNightFor(world, bot.s));
  const S = P.stars;
  const go = async (p) => { await place(bot, towerMapId(5), p.x, p.y + 1); await stepOn(bot, p.x, p.y); };
  // じゅんばんが ちがう
  await go(S[1]);
  assert.ok(!c.flags[STAR_FLAGS[1]]);
  // 1つ目 → 2つ目 → にせの 星 → 消える
  await go(S[0]);
  await go(S[1]);
  assert.ok(c.flags[STAR_FLAGS[0]] && c.flags[STAR_FLAGS[1]]);
  assert.equal(effectiveTile(m5, S[0].x, S[0].y, world.hasFlagFn(bot.s)), T.STAR_LIT, 'ふんだ 星は 光る');
  await go(P.fakes[0]);
  assert.ok(!c.flags[STAR_FLAGS[0]] && !c.flags[STAR_FLAGS[1]], 'にせの 星で やり直し');
  // 1つ目 → 3つ目（とばす）→ 消える
  await go(S[0]);
  await go(S[2]);
  assert.ok(!c.flags[STAR_FLAGS[0]], 'とばすと やり直し');
  // 正しい じゅんばん
  for (const s of S) await go(s);
  assert.ok(c.flags[STARS_FLAG], 'とびらが 開いた');
  for (const [x, y] of P.door) assert.equal(effectiveTile(m5, x, y, world.hasFlagFn(bot.s)), T.CAVE_FLOOR);
  // もう 1度 ふんでも 何も 起きない
  const from = bot.msgs.length;
  await go(P.fakes[1]);
  assert.ok(c.flags[STARS_FLAG] && !said(bot, '消えて', from));
});

// ───────────── アルゴス・てっぺん ─────────────
test('アルゴスの 台本: showMon → battle。負けたら 台本は 止まり、やり直せる。勝つと c5_argos → 星の とびら → てっぺんで c5_sky', { timeout: 60000 }, async () => {
  const fx = FIXED_ENCOUNTERS.argos;
  assert.ok(fx && fx.boss && !fx.canFlee && fx.bgm === 'argos', 'きまった 戦い argos（B。まだ ない 時は 仮の データ）');
  const steps = SCRIPTS.c5_argos_event(ctx(flagsOf(...UPTO('c5_tower'))));
  const iMon = steps.findIndex((s) => s[0] === 'showMon' && s[1] === 'argos');
  const iBat = steps.findIndex((s) => s[0] === 'battle' && s[1] === 'argos');
  assert.ok(iMon >= 0 && iBat > iMon, 'showMon → battle');
  assert.ok(steps.findIndex((s) => s[0] === 'flag' && s[1] === 'c5_argos') > iBat, '勝ってから c5_argos');
  assert.ok(steps.some((s) => s[0] === 'bgm' && s[1] === 'argos'));
  assert.deepEqual(SCRIPTS.c5_argos_event(ctx(flagsOf(...UPTO('c5_argos')))), []);

  const { bot, c } = await setup(5801, 'c5_tower', [EV(8)]);
  const T8 = TOWER_POS[8].trigger;
  const fought = [];
  await place(bot, towerMapId(8), 14, T8.y + 2);
  await stepOn(bot, 14, T8.y, { lose: (id) => id === 'argos', fought });
  assert.ok(fought.includes('argos'), 'アルゴスと 戦った');
  assert.ok(!c.flags.c5_argos, '負けたら すすまない');
  assert.ok(isBlocked(MAPS[towerMapId(8)], TOWER_POS[8].door[0][0], TOWER_POS[8].door[0][1], (f) => !!c.flags[f]), 'とびらは しまった まま');
  // もう 1度
  await place(bot, towerMapId(8), 14, T8.y + 2);
  await stepOn(bot, 14, T8.y, { fought });
  assert.ok(c.flags.c5_argos, '勝った');
  assert.equal(c.objective, C5_OBJ.argos);
  assert.ok(!isBlocked(MAPS[towerMapId(8)], TOWER_POS[8].door[0][0], TOWER_POS[8].door[0][1], (f) => !!c.flags[f]), '星の とびらが 開いた');
  // てっぺん → 天のとばりが 開く
  await place(bot, towerMapId(8), TOWER_POS[8].up.x, TOWER_POS[8].up.y + 1);
  await stepOn(bot, TOWER_POS[8].up.x, TOWER_POS[8].up.y);
  assert.equal(bot.s.map, towerMapId(9));
  await place(bot, towerMapId(9), 11, 9);
  await stepOn(bot, 11, 7);
  assert.ok(c.flags.c5_sky, 'とばりが 開いた');
  assert.equal(c.objective, C5_OBJ.sky);
  assert.ok(said(bot, '"crest"') && said(bot, '空にうかんでいる'));
  assert.equal(veilState((f) => !!c.flags[f]), 'open');
});

// ───────────── 文字 ─────────────
test('文字: 第5章の ファイルは 文字の ルールの チェックに 入っていて、使えない 漢字・スペースが ない', () => {
  const files = gameFiles().map((f) => f.split('/family-rpg/').pop());
  for (const f of ['public/js/shared/data/story-ch5.js', 'public/js/shared/maps/tower.js', 'public/js/shared/maps/tower-rows.js']) assert.ok(files.includes(f), f);
  for (const f of gameFiles().filter((g) => /story-ch5|maps\/tower/.test(g))) {
    const bad = checkFile(f).filter((p) => p.kind !== 'kana');
    assert.deepEqual(bad, [], f);
  }
  // 「ノクト」の 名前は Step 1・2 では 出さない
  for (const f of gameFiles().filter((g) => /story-ch5|maps\/tower/.test(g))) {
    assert.ok(!checkFile(f).some((p) => p.text?.includes('ノクト')));
  }
});

// ───────────── 絵と 音 ─────────────
test('絵と 音: 塔の タイル（2D は 16×16 を ぬる・2.5D）・塔の 色・フードの子・塔の 外の え・祭りの かざり・2きょく', async () => {
  const { paintTile, hasTileArt, isAnimated } = await import('../public/js/client/render/tiles.js');
  const { TOWER_PAINTERS, TOWER_TILES, TOWER_PROPS, towerBlockSpec, TOWER_FLOOR_H } = await import('../public/js/client/render/tiles-tower.js');
  const { partOfTile, themeRgb } = await import('../public/js/client/render/themes.js');
  const { PROP_TILES } = await import('../public/js/client/render/tex3d.js');
  const { npcOpts, paintSpecial, paintHuman } = await import('../public/js/client/render/chars.js');
  const { _TRACKS, _parse } = await import('../public/js/client/audio.js');
  const HEX = /^#[0-9a-f]{6}$/i;
  for (let id = T.SKY_FLOOR; id <= T.TOWER_EXIT; id++) {
    assert.ok(TOWER_PAINTERS[id] && hasTileArt(id), TILE_INFO[id].name);
    assert.equal(partOfTile(id), 'none', `${TILE_INFO[id].name}: 色を かえない`);
    for (const m of [0, 2, 8, 10]) for (const f of [0, 1, 2, 3]) {
      const p = paintTile(id, 0x21, f, m);
      assert.equal(p.px.filter((c) => !c).length, 0, `${TILE_INFO[id].name} m${m} f${f}: ぬられていない ドット`);
      assert.ok(p.px.every((c) => HEX.test(c)));
    }
  }
  assert.deepEqual(TOWER_TILES.sort((a, b) => a - b), Array.from({ length: T.TOWER_EXIT - T.SKY_FLOOR + 1 }, (_, i) => T.SKY_FLOOR + i));
  for (const id of [T.STAR_GLOW, T.WIND_E, T.ELEVATOR_LIT, T.STAR_FONT]) {
    assert.ok(isAnimated(id), TILE_INFO[id].name);
    assert.notEqual(paintTile(id, 0, 0, 0).px.join(), paintTile(id, 0, 1, 0).px.join(), `${TILE_INFO[id].name}: コマで うごく`);
  }
  // 本物の 星と にせの 星は 昼は おなじ え・夜の 星・ふんだ 星は ちがう
  for (const [a, b] of [[T.STAR_DIM, T.STAR_GLOW], [T.STAR_GLOW, T.STAR_LIT], [T.LIFT, T.LIFT_UP], [T.WEIGHT, T.WEIGHT_ON], [T.VANE, T.VANE_ON], [T.WIND_WINDOW, T.WIND_SHUT], [T.ELEVATOR, T.ELEVATOR_LIT], [T.TOWER_DOOR, T.TOWER_GATE]]) {
    assert.notEqual(paintTile(a).px.join(), paintTile(b).px.join(), `${TILE_INFO[a].name} / ${TILE_INFO[b].name}`);
  }
  // 塔の マップの タイルは ぜんぶ 絵が ある
  for (const id of [...TOWER_MAPS, 'overworld']) {
    const m = MAPS[id];
    const ids = new Set(id === 'overworld' ? [T.TOWER_DOOR, T.TOWER_GATE, T.TOWER_BASE] : m.tiles);
    for (const g of m.gates) { ids.add(g.open); ids.add(g.closed); for (const [, t] of g.levels || []) ids.add(t); }
    for (const t of ids) assert.ok(hasTileArt(t), `${id}: ${TILE_INFO[t]?.name ?? t}`);
  }
  // 2.5D: かべの 窓・かべ画・星図・風の 窓・とびら・通り道・てっぺんの 石がき・たてた もの・ふきぬけの ふかさ
  for (const id of [T.STAR_WINDOW, T.TOWER_MURAL, T.STAR_CHART, T.WIND_WINDOW, T.WIND_SHUT, T.STAR_DOOR, T.LIFT_SHAFT, T.TOWER_DOOR, T.TOWER_BASE, T.TOP_EDGE]) assert.ok(towerBlockSpec(id, 0), TILE_INFO[id].name);
  for (const id of [T.VANE, T.VANE_ON, T.STAR_FONT, T.CREST_ALTAR]) assert.ok(TOWER_PROPS[id] && PROP_TILES.has(id), TILE_INFO[id].name);
  assert.ok(TOWER_FLOOR_H[T.WIND_PIT] < -1, 'ふきぬけは ふかい');
  // 塔の 色: 下は 灰色の 石・上ほど あい色（青が つよい）
  const lo = themeRgb(0x80, 0x80, 0x80, 'star_tower', 'floor'), hi = themeRgb(0x80, 0x80, 0x80, 'star_tower_high', 'floor');
  assert.ok(hi[2] - hi[0] > lo[2] - lo[0], '上の 階ほど 星空の 色');
  // フードの子（かおが 見えない フード。名前は「フードの子」）
  const o = npcOpts('hood_kid');
  assert.equal(o.hat, 'hood_dark');
  for (const dir of ['down', 'left', 'right', 'up']) assert.ok(paintHuman(dir, 0, o).px.some(Boolean), dir);
  // かお（フードの 中）の あたりに はだの 色が ない
  const face = paintHuman('down', 0, o);
  const skin = (o.skin || '').toLowerCase();
  const inFace = [];
  for (let y = 8; y <= 20; y++) for (let x = 9; x <= 22; x++) inFace.push((face.get(x, y) || '').toLowerCase());
  assert.ok(inFace.length && !inFace.includes(skin), 'かおの はだが 見えない');
  // 塔の 外の え（雲の 上まで のびる。たかい）・祭りの かざり
  const tw = paintSpecial('star_tower', 'down', 0);
  assert.ok(tw && tw.h > tw.w * 2.5, '星の塔は たかい');
  for (const id of ['fest_lantern', 'fest_star']) assert.ok(paintSpecial(id, 'down', 0)?.px.filter(Boolean).length > 100, id);
  assert.notEqual(paintSpecial('fest_lantern', 'down', 0).px.join(), paintSpecial('fest_lantern', 'down', 1).px.join(), 'ちょうちんが ゆれる');
  for (const n of MAPS.overworld.npcs.filter((x) => x.id.startsWith('c5_') || x.id === 'star_tower')) assert.ok(npcOpts(n.sprite) || paintSpecial(n.sprite, 'down', 0), n.id);
  // 曲（ダンジョン・ボス）
  for (const id of ['star_tower', 'argos']) {
    const tr = _TRACKS[id];
    assert.ok(tr && !tr.once && tr.ch.length >= 3 && tr.ch.length <= 4, id);
    const lens = tr.ch.map((ch) => _parse(ch.n).reduce((s, n) => s + n.len, 0));
    assert.ok(lens.every((l) => l === lens[0]) && lens[0] % 16 === 0 && lens[0] >= 128, `${id}: ${lens}`);
    for (const ch of tr.ch) if (ch.drums) assert.ok(_parse(ch.n).every((n) => n.drum), `${id}: たいこ`);
  }
  const mel = Object.values(_TRACKS).map((tr) => tr.ch[0].n);
  assert.equal(new Set(mel).size, mel.length, 'メロディーは ほかの 曲と ちがう');
});

// ───────────── 通しで ─────────────
test('通しで あそべる: 第4章クリア → 星祭り → 星の羽 → 天のとばり → 古い 書物 → 星の塔 1〜8階（ひとりと 仲間）→ アルゴス → てっぺん（c5_sky）', { timeout: 240000 }, async () => {
  const { world, bot, c } = await setup(5901, 'c4_clear');
  assert.ok(recruitNpc(world, bot.s, 'npc_gard', { force: true }).ok, '酒場の 仲間（上り下りの ゆか）');
  const fought = [];
  const opts = { fought };
  const got = (f) => assert.ok(c.flags[f], f);
  // ── Step 1 ──
  await place(bot, 'overworld', VIL.x + 24, VIL.y + 18);
  await talk(bot, 'elder', opts);
  got('c5_hood');
  await place(bot, 'overworld', VIL.x + 16, VIL.y + 12);
  await talk(bot, 'star_stone', opts);
  got('c5_wings');
  await place(bot, 'overworld', 28, 84);
  bot.send({ t: 'fly', action: 'call' });
  bot.send({ t: 'fly', action: 'region', to: 'veil' });
  await play(bot, opts);
  got('c5_veil');
  bot.send({ t: 'fly', action: 'land' });
  await place(bot, 'overworld', VIL.x + 24, VIL.y + 18);
  await talk(bot, 'elder', opts);
  got(BOOK_FLAG);
  // ── Step 2: 塔の とびら → 1階 ──
  await place(bot, 'overworld', TOWER_OUT.door.x, TOWER_OUT.door.y + 1);
  await examine(bot, TOWER_OUT.door.x, TOWER_OUT.door.y, opts);
  got(DOOR_FLAG);
  await stepOn(bot, TOWER_OUT.door.x, TOWER_OUT.door.y, opts);
  assert.equal(bot.s.map, towerMapId(1));
  await stepOn(bot, 13, 17, opts);
  got('c5_tower');
  assert.equal(c.objective, C5_OBJ.tower);
  const upTo = async (n) => {
    const U = TOWER_POS[n].up;
    await place(bot, towerMapId(n), U.x, U.y + 1);
    await stepOn(bot, U.x, U.y, opts);
    assert.equal(bot.s.map, towerMapId(n + 1), `${n + 1}階へ`);
  };
  await upTo(1);
  got(EV(2));
  assert.equal(c.objective, C5_OBJ.f2);
  // 2階: 上り下りの ゆか（仲間が 重りの ゆか）
  await place(bot, towerMapId(2), LIFTS.f2.lift.x, LIFTS.f2.lift.y + 1);
  await stepOn(bot, LIFTS.f2.lift.x, LIFTS.f2.lift.y, opts);
  got(LIFTS.f2.flag);
  await upTo(2);
  // 3階: 風見の石 2つ
  for (const k of ['f3a', 'f3b']) {
    await place(bot, towerMapId(3), VANES[k].x + 1, VANES[k].y);
    await examine(bot, VANES[k].x, VANES[k].y, opts);
    got(VANES[k].flag);
  }
  await upTo(3);
  // 4階: 休み所で 夜まで 休む（回復・記録）
  got(EV(4));
  await place(bot, towerMapId(4), TOWER_POS[4].font.x, TOWER_POS[4].font.y + 1);
  bot.choice = 1;
  await examine(bot, TOWER_POS[4].font.x, TOWER_POS[4].font.y, opts);
  bot.choice = 0;
  assert.ok(isNightFor(world, bot.s), '夜まで 休んだ');
  await upTo(4);
  // 5階: 夜の 星座の ゆか
  const m5 = MAPS[towerMapId(5)];
  for (const s of TOWER_POS[5].stars) assert.equal(effectiveTile(m5, s.x, s.y, world.hasFlagFn(bot.s)), T.STAR_GLOW);
  for (const s of TOWER_POS[5].stars) {
    await place(bot, towerMapId(5), s.x, s.y + 1);
    await stepOn(bot, s.x, s.y, opts);
  }
  got(STARS_FLAG);
  await upTo(5);
  // 6階: 風を 止めて、風の 道に のる（島へ）
  for (const k of ['f6a', 'f6road']) {
    await place(bot, towerMapId(6), VANES[k].x + 1, VANES[k].y);
    await examine(bot, VANES[k].x, VANES[k].y, opts);
    got(VANES[k].flag);
  }
  await upTo(6);
  // 7階: 2つの 上り下りの ゆか
  for (const k of ['f7a', 'f7b']) {
    await place(bot, towerMapId(7), LIFTS[k].lift.x, LIFTS[k].lift.y + 1);
    await stepOn(bot, LIFTS[k].lift.x, LIFTS[k].lift.y, opts);
    got(LIFTS[k].flag);
  }
  await upTo(7);
  got(EV(8));
  assert.equal(c.objective, C5_OBJ.f8);
  // 8階: アルゴス → てっぺん
  await place(bot, towerMapId(8), 14, TOWER_POS[8].trigger.y + 2);
  await stepOn(bot, 14, TOWER_POS[8].trigger.y, opts);
  got('c5_argos');
  await upTo(8);
  await place(bot, towerMapId(9), 11, 9);
  await stepOn(bot, 11, 7, opts);
  // 第5章 Step 2 の さいご
  for (const f of CH5_STEPS.slice(0, CH5_STEPS.indexOf('c5_sky') + 1)) got(f);
  for (let n = 1; n <= TOWER_FLOORS; n++) got(EV(n));
  assert.equal(c.objective, C5_OBJ.sky);
  assert.deepEqual(fought.filter((id) => FIXED_ENCOUNTERS[id]), ['argos'], 'きまった 戦いは アルゴスだけ');
  // 星の羽の 竜で「雲の上へ」は 開いている（Step 3: 雲の上の クモイ地方へ。続きは test/ch5-step34.test.js）
  await place(bot, 'overworld', 28, 84);
  bot.send({ t: 'fly', action: 'call' });
  const from = bot.msgs.length;
  bot.send({ t: 'fly', action: 'region', to: 'veil' });
  await play(bot);
  assert.ok(toast(bot, '雲の上', from));
  assert.equal(bot.s.map, 'kumoi');
  got('c5_kumoi');
});
