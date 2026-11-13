// 第2部 第8章 第4幕「時のはざま」Step 7・8（A: 世界と物語）※ ネタバレ注意（物語の 中みを ためす）
// c8_bowser → 今の トキネ（c8_rift）→ ほしみの丘の 時の さけめ → 時の広間（c8_hall。4人 そろう）
// → 4つの つばさ（好きな 順。心の ためし: 守りぬく・追いかけっこ・星読みの なぞ・一騎うち）→ 時の門番（3回）→ c8_gatekeeper
// → 最後の 回廊（c8_corridor）→ さいごの 場所（c8_gather）→ ソリトゥス → エンディング（c8_solitus）
// 戦いの 中みは B。ここでは 戦いは テストの 中で 勝たせる
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked, canStand, condOk, effectiveTile } from '../public/js/shared/maps/index.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import {
  C8R, WINGS, WING_MARK, GATE_DUE8R, WIN_GATE8R, CORE8R, WIN_SOL8R, SEAL8R, TRIAL_SEEN8R, FLOOR_SEEN8R, CHASE8R, STAR8R, MISS8R, FIRE8R, MIR8R,
  HALL_ID, CORE_ID, wingMapId, lastMapId, ARRIVE8R,
} from '../public/js/shared/maps/c8r-flags.js';
import { CH8R_MAPS } from '../public/js/shared/maps/c8.js';
import { FLOOR_SPECS, HALL_LAND, CORE_ARRIVE } from '../public/js/shared/maps/c8r-wings.js';
import { floorPos, FIRE_STEPS, LIGHT_R2 } from '../public/js/shared/maps/c8r-floor.js';
import { FIRE2_CHASE, FIRE2_CATCH } from '../public/js/shared/maps/c8r-rows.js';
import { HALL_POS, HALL_DOORS, HALL_CRESTS, HALL_GATE_SPOTS, CORE_POS } from '../public/js/shared/maps/c8r-hall.js';
import { RIFT8R, STATUES8R } from '../public/js/shared/maps/c8r-field.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { CH8_STEPS, OLD_C8_OBJ, CH8_OBJECTIVE_TARGETS, CH8_OBJECTIVE_TALK } from '../public/js/shared/data/story-c8.js';
import { C8C_OBJ } from '../public/js/shared/data/story-c8c.js';
import {
  CH8R_STEPS, C8R_OBJ, CH8R_STORY_SCRIPTS, CH8R_PROGRESS, STAR_ANSWER8R, STAR_HINTS8R, C8R_HEART_LINES, GATE8R,
} from '../public/js/shared/data/story-c8r.js';
import { objectiveFromFlags, KNOWN_OBJECTIVES, repairObjective } from '../public/js/shared/data/progress.js';
import { questMarks } from '../public/js/shared/data/quest-targets.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { GUESTS } from '../public/js/shared/data/shops.js';
// まとめる 時に B の items-c8r.js から
import { C8R_TREASURE } from '../public/js/shared/data/c8r-stub.js';
import { TIME_GLASS, glassCheck } from '../public/js/shared/world/time-glass.js';
import { stairsPair } from '../public/js/shared/world/stairs.js';
import { storyPlace } from '../public/js/shared/world/shiori.js';
import { isPart2Map } from '../public/js/client/audio-scene.js';
import { gainExp, expForLevel } from '../public/js/shared/stats.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { Bot, tickN } from './helpers.js';
import { solveFloor, goalOf } from './c8r-solver.js';
import { DAY_MS } from '../public/js/shared/world/clock.js';

const at = (frac) => 50 * DAY_MS + Math.round(frac * DAY_MS);
const UPTO = (f) => STORY_STEPS.slice(0, STORY_STEPS.indexOf(f) + 1);
const flagsOf = (...l) => Object.fromEntries(l.map((k) => [k, true]));
const said = (bot, text, from = 0) => bot.msgs.slice(from).some((m) => m.t === 'script' && JSON.stringify(m.steps).includes(text));
const ctx = (flags, extra = {}) => ({ c: { name: 'ソラ' }, name: 'ソラ', night: false, flag: (f) => !!flags[f], has: () => false, count: () => 0, ...extra });
const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const ALL_FLOORS = Object.keys(FLOOR_SPECS);

function boost(c, level) {
  gainExp(c, expForLevel(level) - c.exp);
  Object.assign(c.equip, { weapon: 'platinum_sword', armor: 'platinum_mail', shield: 'platinum_shield', head: 'platinum_helm' });
  c.jobs[c.job] = { lv: 10, b: 999 };
}
async function addPlayer(world, name, upto, extra = []) {
  const bot = new Bot(world, name);
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  for (const f of UPTO(upto)) c.flags[f] = true;
  for (const f of extra) c.flags[f] = true;
  for (const f of ['c7_arrive', 'c7s_arrive', 'c8a_arrive', 'c8b_arrive', 'c8c_arrive', 'c5_k_vane3', 'c5_kroad_w9', 'c7s_lwin', 'c6_spring_seen']) c.flags[f] = true;
  if (!c.keyItems.includes(TIME_GLASS)) c.keyItems.push(TIME_GLASS);
  c.guests = [];
  c.objective = objectiveFromFlags(c);
  boost(c, 92);
  world.sendSelf(bot.s);
  bot.s.repelUntil = 1e15;
  return { bot, c };
}
async function setup(seed, upto = 'c8_bowser', { extra = [] } = {}) {
  const clock = { now: at(0.2) };
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false, now: () => clock.now });
  const { bot, c } = await addPlayer(world, 'ソラ', upto, extra);
  return { world, bot, c, clock };
}
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
async function play(bot, { lose = () => false, fought = null, max = 40000, bots = [] } = {}) {
  const world = bot.world;
  const all = [bot, ...bots];
  for (let i = 0; i < max; i++) {
    for (const c2 of world.battles.values()) {
      if (c2.battle.over || c2.battle.pendingEnd || c2.done) continue;
      c2.done = true;
      if (fought) fought.push(c2.opts.fixed || c2.opts.symbolId || 'field');
      finish(c2, lose(c2.opts.fixed));
    }
    for (const b of all) b.flushQueue();
    await tickN(world, 1);
    for (const b of all) b.flushQueue();
    const idle = (b) => !b.s.busy && !b.queue.length && !b.inBattle;
    if (all.every(idle) && !world.battles.size) {
      await tickN(world, 2);
      for (const b of all) b.flushQueue();
      if (all.every(idle) && !world.battles.size) return true;
    }
  }
  return false;
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
// となりに 立って しらべて えらぶ
async function touch(bot, p, choice = 0, opts) {
  const map = MAPS[bot.s.map];
  const has = bot.world.hasFlagFn(bot.s);
  const side = D4.map(([dx, dy]) => [p.x + dx, p.y + dy]).find(([x, y]) => canStand(map, x + 0.5, y + 0.5, has));
  assert.ok(side, `${map.id} ${p.x},${p.y} の となりに 立てる`);
  await place(bot, bot.s.map, side[0], side[1]);
  bot.choice = choice;
  await examine(bot, p.x, p.y, opts);
  bot.choice = 0;
}

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（plan-ch8.md の 9-2）: 物語の すすみ・しるし・マップ・タイル 395〜・出現表・きまった 戦い・ゲスト・宝箱・曲・しおり', () => {
  assert.deepEqual(CH8R_STEPS, ['c8_rift', 'c8_hall', 'c8_wings1', 'c8_wings2', 'c8_wings3', 'c8_wings4', 'c8_gatekeeper', 'c8_corridor', 'c8_gather', 'c8_solitus']);
  assert.deepEqual(CH8_STEPS.slice(18), CH8R_STEPS, 'CH8_STEPS の c8_bowser の うしろ');
  const bi = STORY_STEPS.indexOf('c8_bowser');
  assert.deepEqual(STORY_STEPS.slice(bi + 1, bi + 11), CH8R_STEPS);
  assert.deepEqual(WINGS.map((w) => WING_MARK[w]), ['c8w_moon', 'c8w_fire', 'c8w_iron', 'c8w_ice']);
  // マップ
  const want = ['c8r_hall', ...WINGS.flatMap((w) => [1, 2].flatMap((n) => [`c8r_${w}_${n}`, `c8r_${w}_${n}_now`])), ...[1, 2, 3].flatMap((n) => [`c8r_last_${n}`, `c8r_last_${n}_now`]), 'c8r_core'];
  assert.deepEqual(CH8R_MAPS, want);
  for (const id of want) {
    const m = MAPS[id];
    assert.ok(m, id);
    assert.ok(m.name && !/\s/.test(m.name.replace('　', '')), `${id} の 名前`);
    if (id.endsWith('_now')) assert.equal(m.past, false, id);
    if (/_\d$/.test(id)) { assert.equal(m.past, true, id); assert.equal(m.timePair, `${id}_now`); assert.equal(MAPS[`${id}_now`].timePair, id); }
  }
  assert.ok(MAPS.c8r_hall.timeBlock && MAPS.c8r_core.timeBlock, '広間と さいごの 場所は 時の砂時計が 使えない');
  // タイル（395 から。ほかの 番号と かさならない）
  const ids = Object.entries(T).filter(([k]) => k.startsWith('C8R_')).map(([, v]) => v).sort((a, b) => a - b);
  assert.equal(ids[0], 395);
  assert.deepEqual(ids, Array.from({ length: ids.length }, (_, i) => 395 + i));
  assert.equal(new Set(Object.values(T)).size, Object.values(T).length, 'タイルの 番号は かさならない');
  for (const v of ids) assert.ok(TILE_INFO[v], String(v));
  assert.ok(!TILE_INFO[T.C8R_FORD].solid && TILE_INFO[T.C8R_VOID].solid && TILE_INFO[T.C8R_SANDFLOW].solid && !TILE_INFO[T.C8R_RIFT].solid);
  // 出現表・きまった 戦い（B。今は 仮の データ）
  for (const id of ['t8r_wing', 't8r_last']) assert.ok(ENCOUNTER_TABLES[id], id);
  for (const id of ['c8_gate1', 'c8_gate2', 'c8_gatekeeper', 'c8_trial_guard', 'c8_trial_duel', 'c8_solitus']) assert.ok(FIXED_ENCOUNTERS[id], id);
  for (const fk of ALL_FLOORS) {
    const m = MAPS[FLOOR_SPECS[fk].mapId(false)];
    const t = fk.startsWith('last') ? 't8r_last' : 't8r_wing';
    assert.ok(m.spawnCounts[t] > 0, fk);
  }
  assert.deepEqual(MAPS.c8r_hall.spawnCounts, {});
  // ためしの 部屋・広間・休み所は 魔物が 出ない
  for (const w of ['moon', 'fire', 'iron', 'ice']) {
    const m = MAPS[wingMapId(w, 2)];
    const X = floorPos(FLOOR_SPECS[`${w}2`].rows).door[0];
    assert.ok(m.zoneAt(X.x, X.y - 1).startsWith('safe'), `${w} ためしの 部屋`);
  }
  // ゲスト（B が 強さ。A は 台本）
  for (const g of ['karim8r', 'kai8', 'minamo8', 'rion8']) assert.ok(GUESTS[g], g);
  // 宝箱（どちらの 時代にも おなじ id）
  for (const fk of ALL_FLOORS) {
    const past = MAPS[FLOOR_SPECS[fk].mapId(false)], now = MAPS[FLOOR_SPECS[fk].mapId(true)];
    assert.ok(past.chests.length >= 1, fk);
    assert.deepEqual(past.chests.map((c) => c.id), now.chests.map((c) => c.id));
    for (const c of past.chests) assert.match(c.id, new RegExp(`^c8r_${fk}c\\d$`));
    assert.ok(C8R_TREASURE[fk], fk);
  }
  // 曲（F の id。曲が まだ なくても 落ちない）・戦いの 曲えらび
  assert.equal(MAPS.c8r_hall.bgm, 'c8r_hall');
  for (const w of WINGS) assert.equal(MAPS[wingMapId(w, 1)].bgm, 'c8r_wing');
  assert.equal(MAPS[lastMapId(2, true)].bgm, 'c8r_last');
  for (const id of want) assert.ok(isPart2Map(id, MAPS[id]), id);
  assert.ok(isPart2Map('c8r_hall') && isPart2Map('c8r_core'));
});

test('冒険のしおり: 第4幕の 名前は 時の広間で 章の 字を 見た あと・クリアは c8_solitus', () => {
  const c = (extra) => ({ flags: flagsOf(...UPTO('c8_bowser'), ...extra) });
  let p = storyPlace(c([]));
  assert.equal(p.act, 4);
  assert.equal(p.actTitle, '');
  p = storyPlace(c(['c8_rift', 'c8_hall', ARRIVE8R]));
  assert.equal(p.actTitle, '時のはざま');
  assert.equal(p.cleared, false);
  assert.equal(storyPlace({ flags: flagsOf(...UPTO('c8_solitus'), ARRIVE8R) }).cleared, true);
});

// ───────────── 目標 ─────────────
test('目標: 第3幕クリアの 前の 版の 文は なおる・フラグごとの 目標・仲間会話（9字 いじょう）・地図の しるし・ネタバレが ない', () => {
  assert.equal(OLD_C8_OBJ.bowser, '第8章　第4幕へ（続きはアップデートで！）');
  assert.ok(!KNOWN_OBJECTIVES.has(OLD_C8_OBJ.bowser));
  const old = { flags: flagsOf(...UPTO('c8_bowser')), objective: OLD_C8_OBJ.bowser };
  assert.ok(repairObjective(old));
  assert.equal(old.objective, C8C_OBJ.bowser);
  assert.ok(C8C_OBJ.bowser.includes('トキネ'));
  const of = (...f) => objectiveFromFlags({ flags: flagsOf(...f) });
  const base = UPTO('c8_hall');
  assert.equal(of(...UPTO('c8_rift')), C8R_OBJ.rift);
  assert.equal(of(...base), C8R_OBJ.hall);
  assert.equal(of(...base, 'c8w_ice', GATE_DUE8R), C8R_OBJ.due);
  assert.equal(of(...UPTO('c8_wings1'), 'c8w_ice'), C8R_OBJ.wings1);
  assert.equal(of(...UPTO('c8_wings3'), 'c8w_ice', 'c8w_moon', 'c8w_fire'), C8R_OBJ.wings3);
  assert.equal(of(...UPTO('c8_wings4')), C8R_OBJ.wings4);
  assert.equal(of(...UPTO('c8_wings4'), WIN_GATE8R), C8R_OBJ.gateWin);
  assert.equal(of(...UPTO('c8_gatekeeper')), C8R_OBJ.gatekeeper);
  assert.equal(of(...UPTO('c8_corridor'), FLOOR_SEEN8R('last2')), C8R_OBJ.last2);
  assert.equal(of(...UPTO('c8_corridor'), CORE8R), C8R_OBJ.core);
  assert.equal(of(...UPTO('c8_gather'), WIN_SOL8R, SEAL8R), C8R_OBJ.seal);
  assert.equal(of(...UPTO('c8_solitus')), C8R_OBJ.solitus);
  assert.ok(/アップデート/.test(C8R_OBJ.solitus) && C8R_OBJ.solitus.includes('第2部'));
  for (const [, t] of CH8R_PROGRESS) assert.ok(KNOWN_OBJECTIVES.has(t), t);
  for (const t of Object.values(C8R_OBJ)) {
    const talk = CH8_OBJECTIVE_TALK[t];
    assert.ok(talk, t);
    for (const k of ['self', 'bold', 'kind', 'kid']) assert.ok(talk[k] && talk[k].length > 8, `${t} ${k}`);
    // 行き先（その マップが ある）
    const specs = CH8_OBJECTIVE_TARGETS[t];
    assert.ok(specs?.length, t);
    for (const s of specs) if (s.map) assert.ok(MAPS[s.map], `${t} ${s.map}`);
    // ネタバレしない（敵の 正体・カイの 紋章・ひとりぼっちの 星・約束・第1部の 人）
    for (const s of [t, ...Object.values(talk)]) assert.ok(!/ソリトゥス|ひとりぼっち|カイの紋章|約束|ノクト|フリーザ/.test(s), s);
    assert.ok(!/\s/.test(t.replace(/　/g, '')), `空白 ${t}`);
  }
  // 地図の しるし: 広間の つばさの 入口（すんだ つばさは 出ない）
  const marks = (flags, obj) => questMarks({ flags: flagsOf(...flags), objective: obj }, HALL_ID).filter((m) => m.kind === 'main');
  assert.equal(marks(base, C8R_OBJ.hall).length, 4);
  assert.equal(marks([...UPTO('c8_wings1'), 'c8w_moon'], C8R_OBJ.wings1).length, 3);
});

// ───────────── 階の とき方 ─────────────
test('つばさと 回廊: どの 階も ひとりで 入口から 出口・ためしの 部屋へ 行ける（2つの 時代・すべる 氷・見えない 道・鏡・しかけ こみ）・とじこめられない', { timeout: 300000 }, () => {
  for (const fk of ALL_FLOORS) {
    const spec = FLOOR_SPECS[fk];
    const P = floorPos(spec.rows);
    const st = P.down || P.arrive;
    for (const era of ['past', 'now']) {
      const r = solveFloor({ rows: spec.rows, fk, ids: [spec.mapId(false), spec.mapId(true)], start: { x: st.x, y: st.y, era }, goal: goalOf(P) });
      assert.ok(!r.truncated, `${fk} ${era} さがしきれた`);
      assert.ok(r.goals.length > 0, `${fk} ${era}: 出口・ためしへ 行ける`);
      assert.equal(r.stuck.length, 0, `${fk} ${era}: とじこめられない ${r.stuck.slice(0, 2)}`);
    }
  }
});

test('つばさと 回廊: 時代を かえないと・しかけを 使わないと 行けない（ひねりが 生きている）', { timeout: 300000 }, () => {
  const run = (fk, opts) => {
    const spec = FLOOR_SPECS[fk];
    const P = floorPos(spec.rows);
    const st = P.down || P.arrive;
    return solveFloor({ rows: spec.rows, fk, ids: [spec.mapId(false), spec.mapId(true)], start: { x: st.x, y: st.y, era: 'past' }, goal: goalOf(P), ...opts }).goals.length;
  };
  // 広間から 着くのは 千年前。時代を かえないと 行けない 階
  for (const fk of ['moon1', 'moon2', 'fire1', 'iron1', 'iron2', 'ice1', 'ice2', 'last1', 'last2', 'last3']) assert.equal(run(fk, { glass: false, fords: false }), 0, `${fk}: 時代を かえないと 行けない`);
  // 浅せだけでも 行ける（時の砂時計を 使わなくても）階
  for (const fk of ['fire1', 'fire2', 'iron1', 'last2']) assert.ok(run(fk, { glass: false }) > 0, `${fk}: 浅せを わたれば 行ける`);
  // 鏡・しかけ・青い 火が ないと 行けない
  for (const fk of ['moon1', 'moon2', 'last1']) assert.equal(run(fk, { mirrors: false }), 0, `${fk}: 鏡`);
  for (const fk of ['iron1', 'iron2', 'last2']) assert.equal(run(fk, { devices: false }), 0, `${fk}: しかけ`);
  for (const fk of ['fire1', 'fire2', 'last2']) assert.equal(run(fk, { fires: false }), 0, `${fk}: 青い 火`);
  // 青い 火は すぐ 消えると わたれない（歩数が 大事）
  assert.equal(run('fire1', { fireSteps: 2 }), 0, '火が 2歩で 消えると わたれない');
});

test('見えない 道: どの よみの道も 両はしの 台の 火で てらせる（火が 消えても 島に とじこめられない）・浅せは 1マス・ためしの 部屋に 浅せと 砂時計は ない', () => {
  for (const fk of ALL_FLOORS) {
    const P = floorPos(FLOOR_SPECS[fk].rows);
    for (const c of P.ways) assert.ok(P.fires.some((f) => (c.x - f.x) ** 2 + (c.y - f.y) ** 2 <= LIGHT_R2), `${fk} ${c.x},${c.y}`);
    // 浅せは となりあわない（歩くたびに 時代が 2回 かわらない）
    for (const c of P.fords) assert.ok(!P.fords.some((d) => Math.abs(d.x - c.x) + Math.abs(d.y - c.y) === 1), `${fk} 浅せ ${c.x},${c.y}`);
    const m = MAPS[FLOOR_SPECS[fk].mapId(false)];
    if (FLOOR_SPECS[fk].trial) {
      const r = FLOOR_SPECS[fk].trial;
      for (const c of P.fords) assert.ok(!(c.x >= r.x && c.y >= r.y && c.x < r.x + r.w && c.y < r.y + r.h), `${fk} ためしの 部屋に 浅せ`);
      assert.equal(m.timeSpot(r.x + 1, r.y + 1), 'boss');
    }
  }
  assert.ok(FIRE_STEPS >= 12, '子どもでも わたれる 歩数');
});

test('階段: 上ると 上の 階の 下り 階段の 真上（第71回）・つばさの 入口と 近道は 広間の 入口の となり・▲▼の しるし', () => {
  for (const [fk, spec] of Object.entries(FLOOR_SPECS)) {
    for (const now of [false, true]) {
      const m = MAPS[spec.mapId(now)];
      const P = floorPos(spec.rows);
      if (P.up && m.warps.find((w) => w.x === P.up.x && w.y === P.up.y).to.map !== 'c8r_core') {
        const w = m.warps.find((q) => q.x === P.up.x && q.y === P.up.y);
        const pr = stairsPair(m.id, w);
        assert.ok(pr, `${m.id} 上り`);
        assert.equal(effectiveTile(MAPS[w.to.map], pr.tx, pr.ty, () => false), T.STAIRS_DOWN, `${m.id} → 下り 階段の 真上`);
      }
      // 回廊 1階の 今の すがたの 下り 階段は 広間へ（広間の 階段は 千年前の すがたへ 行くので 対には ならない）
      if (P.down && !(fk === 'last1' && now)) {
        const w = m.warps.find((q) => q.x === P.down.x && q.y === P.down.y);
        const pr = stairsPair(m.id, w);
        assert.ok(pr, `${m.id} 下り`);
        assert.equal(effectiveTile(MAPS[w.to.map], pr.tx, pr.ty, () => false), T.STAIRS_UP, `${m.id} → 上り 階段の 真上`);
      }
      // 階段は 2.5D でも しるし（STAIRS_UP / STAIRS_DOWN の タイル）
      if (P.up) assert.equal(m.tiles[P.up.y * m.w + P.up.x], T.STAIRS_UP);
      if (P.down) assert.equal(m.tiles[P.down.y * m.w + P.down.x], T.STAIRS_DOWN);
    }
  }
  // 広間の つばさの 入口 ⇔ つばさの 1階・近道
  for (const w of WINGS) {
    const d = HALL_DOORS[w];
    const warp = MAPS.c8r_hall.warps.find((q) => q.x === d.x && q.y === d.y);
    assert.equal(warp.to.map, wingMapId(w, 1));
    assert.ok(warp.noMark, '入口の ワープは 宝の地図の しるしに しない');
    const L = HALL_LAND[w];
    assert.ok(Math.abs(L.x - d.x) + Math.abs(L.y - d.y) === 1 && canStand(MAPS.c8r_hall, L.x + 0.5, L.y + 0.5, () => false), w);
    for (const now of [false, true]) {
      const m = MAPS[wingMapId(w, 2, now)];
      const R = floorPos(FLOOR_SPECS[`${w}2`].rows).rift;
      assert.equal(effectiveTile(m, R.x, R.y, () => false), T.C8R_VOID, '近道は ためしの 前は しまっている');
      assert.equal(effectiveTile(m, R.x, R.y, (f) => f === WING_MARK[w]), T.C8R_RIFT);
    }
  }
  assert.ok(canStand(MAPS.c8r_core, CORE_ARRIVE.x, CORE_ARRIVE.y, () => false));
  // 広間の 大とびら（門番を たおすと 開く）
  const B = HALL_POS.bigDoor;
  assert.ok(isBlocked(MAPS.c8r_hall, B.x, B.y, () => false));
  assert.ok(!isBlocked(MAPS.c8r_hall, B.x, B.y, (f) => f === C8R.gatekeeper));
  // 紋章の 台（しるしで 光る）
  for (const w of WINGS) {
    const c = HALL_CRESTS[w];
    assert.equal(effectiveTile(MAPS.c8r_hall, c.x, c.y, () => false), T.C8R_CREST);
    assert.notEqual(effectiveTile(MAPS.c8r_hall, c.x, c.y, (f) => f === WING_MARK[w]), T.C8R_CREST);
  }
});

// ───────────── 門番の 場面（どの 順でも）─────────────
test('どの 順でも 4つの つばさを クリアできる: 門番は つばさ 1つ・3つ・4つの あとに あらわれる（いちばん 先の 場面だけ）', () => {
  const battles = (steps) => JSON.stringify(steps).match(/"battle","(c8_[a-z0-9_]+)"/g)?.map((s) => s.split('"')[3]) || [];
  const perms = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
  for (const order of perms(WINGS)) {
    const flags = flagsOf(...UPTO('c8_hall'));
    const seen = [];
    for (const w of order) {
      flags[WING_MARK[w]] = true;
      flags[GATE_DUE8R] = true;
      const steps = SCRIPTS.c8r_gate_event(ctx(flags));
      seen.push(...battles(steps));
      // 場面の さいごの フラグを まねる
      for (const st of steps) if (st[0] === 'flag') { for (const f of STORY_STEPS.slice(0, STORY_STEPS.indexOf(st[1]) + 1)) flags[f] = true; }
      delete flags[GATE_DUE8R];
    }
    assert.deepEqual(seen, ['c8_gate1', 'c8_gate2', 'c8_gatekeeper'], order.join(','));
    assert.ok(flags[C8R.wings4], order.join(','));
  }
  // 家族が 同時に すすめて しるしが いっきに ふえた 時は いちばん 先の 場面
  assert.deepEqual(battles(SCRIPTS.c8r_gate_event(ctx(flagsOf(...UPTO('c8_hall'), 'c8w_moon', 'c8w_fire', 'c8w_iron', GATE_DUE8R)))), ['c8_gate2']);
  assert.deepEqual(battles(SCRIPTS.c8r_gate_event(ctx(flagsOf(...UPTO('c8_hall'), 'c8w_moon', 'c8w_fire', 'c8w_iron', 'c8w_ice', GATE_DUE8R)))), ['c8_gatekeeper']);
  // 門番の ことばは ていねいで 上から（こわい ことばは 使わない）
  const all = JSON.stringify([1, 3, 4].map((n) => SCRIPTS.c8r_gate_event(ctx(flagsOf(...UPTO('c8_hall'), ...WINGS.slice(0, n).map((w) => WING_MARK[w]), GATE_DUE8R)))));
  assert.ok(all.includes('ほう、少しは、やるようですね') && all.includes('弱くても、ひとりじゃない'));
  assert.ok(!/殺|ころす|死ね|しね/.test(all));
  assert.ok(all.includes(GATE8R));
});

// ───────────── サーバー: 浅せ・青い 火・追いかけっこ・星読みの なぞ ─────────────
test('サーバー: 時の砂の 浅せを わたると 時代が 入れかわる・青い 火は 歩くと 消える（見えない 道の 上に いたら となりへ）', { timeout: 300000 }, async () => {
  const { bot, c } = await setup(781, 'c8_hall');
  const P = floorPos(FLOOR_SPECS.moon1.rows);
  const F = P.fords[0];
  await place(bot, wingMapId('moon', 1), F.x, F.y + 1);
  await stepOn(bot, F.x, F.y);
  assert.equal(bot.s.map, wingMapId('moon', 1, true), '浅せで 今へ');
  await stepOn(bot, F.x, F.y - 1);
  assert.equal(bot.s.map, wingMapId('moon', 1, true), 'わたった あとは そのまま');
  await stepOn(bot, F.x, F.y);
  assert.equal(bot.s.map, wingMapId('moon', 1), 'もどると 千年前');
  // 青い 火（青火のつばさ 1階の 入口の 部屋の 台 5,12）
  const Q = floorPos(FLOOR_SPECS.fire1.rows);
  const k = Q.fires.findIndex((f) => f.x === 5 && f.y === 12);
  const f0 = Q.fires[k];
  const F0 = FIRE8R('fire1', k);
  await place(bot, wingMapId('fire', 1), f0.x, f0.y + 1);
  await examine(bot, f0.x, f0.y);
  assert.ok(c.flags[F0], '火が ともった');
  assert.ok(!isBlocked(MAPS[bot.s.map], 6, 13, (f) => !!c.flags[f]), 'よみの道が 見える');
  for (let i = 0; i < FIRE_STEPS && c.flags[F0]; i++) await stepOn(bot, i % 2 ? 5 : 4, 13);
  assert.ok(!c.flags[F0], `${FIRE_STEPS}歩 あるくと 火が 消える`);
  assert.ok(isBlocked(MAPS[bot.s.map], 6, 13, (f) => !!c.flags[f]), 'よみの道が 見えなくなる');
  // よみの道の 上で 消えたら となりへ
  await place(bot, wingMapId('fire', 1), f0.x, f0.y + 1);
  await examine(bot, f0.x, f0.y);
  await stepOn(bot, 6, 13);
  bot.s.c8rFires[0].left = 1;
  await stepOn(bot, 7, 13);
  assert.ok(!c.flags[F0], '火が 消えた');
  assert.ok(canStand(MAPS[bot.s.map], bot.s.x, bot.s.y, (f) => !!c.flags[f]), '見えない 道の 上には いない');
  assert.ok(bot.msgs.some((m) => m.t === 'toast' && /消えてしまった/.test(m.text)));
});

test('サーバー: 追いかけっこ（青火のつばさ）… 近づくと にげる・3回 つかまえると しるし・戦い なし', { timeout: 300000 }, async () => {
  const { bot, c } = await setup(782, 'c8_hall');
  const spec = FLOOR_SPECS.fire2;
  const P = floorPos(spec.rows);
  const X = P.door[0];
  await place(bot, wingMapId('fire', 2), X.x, X.y + 1);
  const fought = [];
  await stepOn(bot, X.x, X.y, { fought });
  assert.ok(c.flags[TRIAL_SEEN8R('fire')] && c.flags[CHASE8R(0)], 'ためしが はじまった');
  assert.ok(said(bot, 'つかまえてごらん'));
  // 火の 来た 所を 追う（見えている 道だけ 歩く）
  const has = (f) => !!c.flags[f];
  for (let guard = 0; guard < 200 && !c.flags.c8w_fire; guard++) {
    const j = FIRE2_CHASE.findIndex((_, k) => has(CHASE8R(k)) && !has(k + 1 < FIRE2_CHASE.length ? CHASE8R(k + 1) : 'c8w_fire'));
    const t = P.spots[FIRE2_CHASE[j]];
    // 見えている マスを たどって 火の となりへ（いちばん 近い 1歩）
    const map = MAPS[bot.s.map];
    const [sx, sy] = [Math.floor(bot.s.x), Math.floor(bot.s.y)];
    const prev = new Map([[`${sx},${sy}`, null]]);
    const q = [[sx, sy]];
    let goal = null;
    while (q.length && !goal) {
      const [x, y] = q.shift();
      for (const [dx, dy] of D4) {
        const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
        if (prev.has(k)) continue;
        if (Math.abs(nx - t.x) + Math.abs(ny - t.y) === 0) { goal = [x, y]; break; }
        if (isBlocked(map, nx, ny, has)) continue;
        prev.set(k, [x, y]);
        q.push([nx, ny]);
      }
    }
    assert.ok(goal, `火（${j}）の そばへ 行ける`);
    const path = [];
    for (let cur = goal; cur; cur = prev.get(`${cur[0]},${cur[1]}`)) path.unshift(cur);
    const before = JSON.stringify(Object.keys(c.flags).filter((f) => f.startsWith('c8r_chase')));
    for (const [x, y] of path.slice(1)) {
      await stepOn(bot, x, y, { fought });
      if (JSON.stringify(Object.keys(c.flags).filter((f) => f.startsWith('c8r_chase'))) !== before || c.flags.c8w_fire) break;
    }
    if (JSON.stringify(Object.keys(c.flags).filter((f) => f.startsWith('c8r_chase'))) === before && !c.flags.c8w_fire) await examine(bot, t.x, t.y, { fought });
  }
  assert.ok(c.flags.c8w_fire, '3回 つかまえた');
  assert.deepEqual(fought, [], '戦いは ない');
  assert.ok(said(bot, 'つかまえた！（3回め）') && said(bot, 'いっしょに、あそぼう'));
  // 近道が 開く
  const R = P.rift;
  assert.equal(effectiveTile(MAPS[bot.s.map], R.x, R.y, has), T.C8R_RIFT);
});

test('サーバー: 星読みの なぞ（くろがねのつばさ）… まちがえたら やり直し・2回 まちがえると ミナモが ヒント・正しい 順で しるし', { timeout: 300000 }, async () => {
  const { bot, c } = await setup(783, 'c8_hall');
  const P = floorPos(FLOOR_SPECS.iron2.rows);
  const L = P.levers;
  assert.equal(L.length, 4);
  // ヒントの 星は 2つの 時代に ちらばる（千年前だけ・今だけ が 2つずつ）
  assert.equal(P.stars.filter((s) => s.ch === 'S').length, 2);
  assert.equal(P.stars.filter((s) => s.ch === 'Z').length, 2);
  assert.equal(STAR_HINTS8R.iron2.length, P.stars.length);
  const hints = JSON.stringify(STAR_HINTS8R.iron2);
  assert.ok(hints.includes('最初に目をさますのは、金の星') && hints.includes('赤い星は、いちばん最後'));
  await place(bot, wingMapId('iron', 2), P.door[0].x, P.door[0].y - 1);
  const m0 = bot.msgs.length;
  // まちがい 1回め（赤 から）
  await touch(bot, L[0]);
  assert.ok(c.flags[MISS8R(1)] && !c.flags[STAR8R(0)]);
  // 1つ 正しく → まちがい 2回め → ヒント
  await touch(bot, L[STAR_ANSWER8R[0]]);
  assert.ok(c.flags[STAR8R(STAR_ANSWER8R[0])]);
  await touch(bot, L[3]);
  assert.ok(c.flags[MISS8R(2)] && !c.flags[STAR8R(STAR_ANSWER8R[0])], 'まちがえると ぜんぶ もどる');
  assert.ok(said(bot, '最初に目をさますのは、金の星', m0), '2回 まちがえると ミナモの ヒント');
  for (const k of STAR_ANSWER8R) await touch(bot, L[k]);
  assert.ok(c.flags.c8w_iron, '正しい 順で しるし');
  assert.ok(said(bot, 'ミナモの紋章が、光った'));
});

// ───────────── 家族で 同時に ─────────────
test('家族で 同時の しるし: ためしを クリアすると 時のはざまに いて c8_hall まで 進んだ 家族 全員に しるし（ほかの 所・まだの 人には つかない）', { timeout: 300000 }, async () => {
  const { world, bot, c } = await setup(784, 'c8_hall');
  const b2 = await addPlayer(world, 'ハナ', 'c8_hall');
  const b3 = await addPlayer(world, 'タロウ', 'c8_hall');
  const b4 = await addPlayer(world, 'ユイ', 'c8_bowser');
  await place(b2.bot, wingMapId('moon', 1), 2, 13);
  await place(b3.bot, 'overworld', RIFT8R.x, RIFT8R.y + 2);
  await place(b4.bot, wingMapId('ice', 1), 2, 13);
  const P = floorPos(FLOOR_SPECS.iron2.rows);
  await place(bot, wingMapId('iron', 2), P.door[0].x, P.door[0].y - 1);
  for (const k of STAR_ANSWER8R) await touch(bot, P.levers[k]);
  await play(bot, { bots: [b2.bot, b3.bot, b4.bot] });
  assert.ok(c.flags.c8w_iron && c.flags[GATE_DUE8R]);
  assert.ok(b2.c.flags.c8w_iron && b2.c.flags[GATE_DUE8R], '時のはざまに いる 家族にも');
  assert.equal(b2.c.objective, C8R_OBJ.due);
  assert.ok(b2.bot.msgs.some((m) => m.t === 'toast' && /ミナモの紋章が光った/.test(m.text)), '家族に お知らせ');
  assert.ok(!b3.c.flags.c8w_iron, '時のはざまの 外の 家族には つかない');
  assert.ok(!b4.c.flags.c8w_iron, 'c8_hall まで 進んで いない 家族には つかない');
  // ひとりで 4つ: のこりの つばさも 自分で（月・氷は 戦い・青火は 追いかけっこ）
  for (const w of ['moon', 'ice']) {
    const Q = floorPos(FLOOR_SPECS[`${w}2`].rows);
    const fought = [];
    await place(bot, wingMapId(w, 2), Q.altar.x, Q.altar.y + 1);
    await examine(bot, Q.altar.x, Q.altar.y, { fought });
    assert.deepEqual(fought, [w === 'moon' ? 'c8_trial_guard' : 'c8_trial_duel']);
    assert.ok(c.flags[WING_MARK[w]], w);
  }
  assert.ok(said(bot, 'みんなが、うしろで、しんじてくれていた') && said(bot, 'でも、ぼくは、ひとりじゃない'));
});

test('負けた 時: ためし・門番・ソリトゥスに 負けたら すすまない（もう一度 ためせる）', { timeout: 300000 }, async () => {
  const { bot, c } = await setup(785, 'c8_hall', { extra: ['c8w_moon', 'c8w_fire', 'c8w_iron', 'c8w_ice', GATE_DUE8R] });
  const Q = floorPos(FLOOR_SPECS.moon2.rows);
  await place(bot, wingMapId('moon', 2), Q.altar.x, Q.altar.y + 1);
  delete c.flags.c8w_moon;
  await examine(bot, Q.altar.x, Q.altar.y, { lose: () => true });
  assert.ok(!c.flags.c8w_moon, '負けたら しるしは つかない');
  c.flags.c8w_moon = true;
  // 門番（4つの あと）に 負ける → 大とびらの 前の 門番に 話しかけると もう一度
  const S = HALL_GATE_SPOTS[4];
  await place(bot, HALL_ID, S.x + 1, S.y + 2);
  await stepOn(bot, S.x + 1, S.y + 1, { lose: () => true });
  assert.ok(c.flags[C8R.wings4] && !c.flags[C8R.gatekeeper]);
  const has = (f) => !!c.flags[f];
  assert.ok(MAPS.c8r_hall.npcs.some((n) => n.id === 'c8r_gate_npc' && condOk(n.show, has)), '門番が 待っている');
  const fought = [];
  await place(bot, HALL_ID, HALL_POS.gate.x, HALL_POS.gate.y + 2);
  await talk(bot, 'c8r_gate_npc', { fought });
  assert.deepEqual(fought, ['c8_gatekeeper']);
  assert.ok(c.flags[C8R.gatekeeper] && c.flags[WIN_GATE8R]);
});

// ───────────── 通しで ─────────────
test('通しで: c8_bowser → トキネ → 時の さけめ → 時の広間（4人 そろう）→ 4つの ためし → 門番 3回 → 最後の 回廊 → 第1部の 仲間 → ソリトゥス → エンディング（c8_solitus）', { timeout: 400000 }, async () => {
  const { bot, c } = await setup(786, 'c8_bowser');
  // 今の ほしみの丘の トキネ
  const tok = MAPS.overworld.npcById.tokine_c6;
  await place(bot, 'overworld', tok.x, tok.y + 1);
  await talk(bot, 'tokine_c6');
  assert.ok(c.flags[C8R.rift]);
  assert.equal(c.objective, C8R_OBJ.rift);
  assert.ok(said(bot, '時のはざま') && said(bot, 'わたしが、生まれた場所'));
  // 時の さけめ → 時の広間（4人 そろう）
  await place(bot, 'overworld', RIFT8R.x, RIFT8R.y + 1);
  await stepOn(bot, RIFT8R.x, RIFT8R.y);
  assert.equal(bot.s.map, HALL_ID);
  await stepOn(bot, HALL_POS.enter.x, HALL_POS.enter.y - 1);
  assert.ok(c.flags[C8R.hall] && c.flags[ARRIVE8R]);
  for (const g of ['karim8r', 'kai8', 'minamo8', 'rion8']) assert.ok(c.guests.includes(g), g);
  assert.equal(c.objective, C8R_OBJ.hall);
  assert.ok(said(bot, '第4幕　時のはざま'));
  // つばさを 1つずつ（ためしは しるしを つける ところだけ。とき方は 上の テスト）。もどって 広場に 入ると 門番
  const fought = [];
  const enterPlaza = async () => {
    const S = HALL_GATE_SPOTS[0];
    await place(bot, HALL_ID, 4, 6);
    await stepOn(bot, S.x + 1, S.y, { fought });
  };
  const order = ['ice', 'moon', 'fire', 'iron'];
  for (const w of order) {
    c.flags[WING_MARK[w]] = true;
    c.flags[GATE_DUE8R] = true;
    await enterPlaza();
  }
  assert.deepEqual(fought, ['c8_gate1', 'c8_gate2', 'c8_gatekeeper']);
  assert.ok(c.flags[C8R.wings1] && c.flags[C8R.wings2] && c.flags[C8R.wings3] && c.flags[C8R.wings4] && c.flags[C8R.gatekeeper]);
  assert.ok(said(bot, '見くだす心…たしかに、いただいた'));
  assert.equal(c.objective, C8R_OBJ.gatekeeper);
  // 大とびらの おくの 階段 → 最後の 回廊 1階（休み所）
  const U = HALL_POS.up;
  await place(bot, HALL_ID, U.x, U.y + 1);
  await stepOn(bot, U.x, U.y);
  assert.equal(bot.s.map, lastMapId(1));
  const A = floorPos(FLOOR_SPECS.last1.rows).arrive;
  await stepOn(bot, A.x + 1, A.y);
  assert.ok(c.flags[C8R.corridor]);
  assert.equal(c.objective, C8R_OBJ.corridor);
  // 3階の 上 → さいごの 場所
  const U3 = floorPos(FLOOR_SPECS.last3.rows).up;
  await place(bot, lastMapId(3), U3.x, U3.y + 1);
  await stepOn(bot, U3.x, U3.y);
  assert.equal(bot.s.map, 'c8r_core');
  await stepOn(bot, Math.floor(CORE_ARRIVE.x), Math.floor(CORE_ARRIVE.y) - 1);
  assert.ok(c.flags[CORE8R]);
  const f2 = [];
  const T0 = CORE_POS.trigger;
  for (let y = Math.floor(CORE_ARRIVE.y) - 2; y >= T0.y; y--) await stepOn(bot, 10, y, { fought: f2 });
  assert.deepEqual(f2, ['c8_solitus']);
  assert.ok(c.flags[C8R.gather] && c.flags[WIN_SOL8R] && c.flags[SEAL8R] && c.flags[C8R.solitus]);
  for (const t of ['なつかしい顔が', 'ひとりにしない', 'カイのむねに、紋章が、初めて、光った', 'この星を、ひとりぼっちのさびしさから、救いに来る', 'ぼくたちが、はたしたよ', '4つの石の像', '時の砂時計の中へ', '第2部　千年の約束', 'つづく']) assert.ok(said(bot, t), t);
  for (const t of ['ながれ星', 'おとされた']) assert.ok(!said(bot, t), `${t} は 入れない`);
  assert.equal(c.objective, C8R_OBJ.solitus);
  assert.deepEqual(c.guests, [], '4人は 千年前へ 帰った');
  assert.equal(bot.s.map, 'overworld', 'さいごは 今の ほしみの丘');
  const has = (f) => !!c.flags[f];
  for (const s of STATUES8R) assert.ok(MAPS.overworld.npcs.some((n) => n.id === `c8r_statue_${s.who}` && condOk(n.show, has)), s.who);
  assert.ok(!condOk(MAPS.overworld.npcById.tokine_c6.show, has), 'トキネは 砂時計の 中へ');
  assert.ok(storyPlace(c).cleared);
});

test('とちゅうで 切れた 時: 門番に 勝った あと・ソリトゥスに 勝った あと・ふういんの あとは 続きから', () => {
  const g = SCRIPTS.c8r_gate_after(ctx(flagsOf(...UPTO('c8_wings4'), WIN_GATE8R)));
  assert.ok(JSON.stringify(g).includes('大とびらは、開けておきます'));
  const f1 = JSON.stringify(SCRIPTS.c8r_final_after(ctx(flagsOf(...UPTO('c8_gather'), WIN_SOL8R))));
  assert.ok(f1.includes('ひとりにしない') && f1.includes('第2部　千年の約束'));
  const f2 = JSON.stringify(SCRIPTS.c8r_final_after(ctx(flagsOf(...UPTO('c8_gather'), WIN_SOL8R, SEAL8R))));
  assert.ok(!f2.includes('ひとりにしない') && f2.includes('またね'));
  // 2回め からは 仲間の 場面を とばす
  const again = JSON.stringify(SCRIPTS.c8r_final_event(ctx(flagsOf(...UPTO('c8_gather')))));
  assert.ok(!again.includes('なつかしい顔が') && again.includes('c8_solitus'));
});

// ───────────── 台本の きまり ─────────────
test('台本の きまり: 物語の 場面は 家族 みんなで・ためしと しかけは ひとりでも・字の ルール・にげた 心の せりふ（B が 使う）', () => {
  for (const id of CH8R_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id), id);
  for (const id of ['c8r_trial_moon', 'c8r_trial_ice', 'c8r_lever_0', 'c8r_ford', 'c8r_wisp_0', 'c8r_hop_0', 'c8r_catch_2', 'c8r_trial_in_fire', 'c8r_mirror_moon1_0', 'c8r_fire_fire1_0', 'c8r_dev_iron1_0']) {
    assert.ok(SCRIPTS[id], id);
    assert.ok(!STORY_SCRIPTS.has(id), `${id} は ひとりでも`);
  }
  // マップの しらべる・ふむ 所の だいほんは ぜんぶ ある
  for (const id of CH8R_MAPS) {
    const m = MAPS[id];
    for (const a of [...m.actions, ...m.triggers, ...m.npcs]) assert.ok(SCRIPTS[a.script], `${id} ${a.script}`);
  }
  const files = gameFiles().map((f) => f.replace(/\\/g, '/').replace(/^.*?family-rpg\//, ''));
  const mine = ['public/js/shared/data/story-c8r.js', 'public/js/shared/data/c8r-stub.js', 'public/js/shared/maps/c8r.js', 'public/js/shared/maps/c8r-hall.js', 'public/js/shared/maps/c8r-wings.js',
    'public/js/shared/maps/c8r-floor.js', 'public/js/shared/maps/c8r-rows.js', 'public/js/shared/maps/c8r-flags.js', 'public/js/shared/maps/c8r-field.js', 'public/js/shared/world/c8r-steps.js',
    'public/js/client/render/c8r-npc-art.js', 'public/js/client/render/tiles-c8r.js'];
  for (const f of mine) assert.ok(files.some((g) => g.endsWith(f)), f);
  for (const f of gameFiles().filter((g) => mine.some((x) => g.replace(/\\/g, '/').endsWith(x)))) assert.deepEqual(checkFile(f), [], f);
  const all = JSON.stringify(Object.entries(SCRIPTS).filter(([k]) => /^c8r_/.test(k)).map(([, fn]) => { try { return fn(ctx(flagsOf(...UPTO('c8_hall'), 'c8w_moon', GATE_DUE8R, CHASE8R(2)))); } catch { return []; } }));
  assert.ok(!/なかま/.test(all), 'なかま → 仲間');
  assert.ok(!/殺|ころす|死ね/.test(all));
  // にげた 心が もどる（B が 戦いの 中で 使う。笑える・短く）
  for (const k of ['jafar', 'hades', 'bowser', 'gate']) {
    const [who, line, help] = C8R_HEART_LINES[k];
    assert.ok(who && line.length < 70 && help.length < 30, k);
  }
  assert.ok(C8R_HEART_LINES.jafar[1].includes('わしの心'));
});

test('絵と 音: 新しい タイル（2D は 16×16 を ぬる・動く・2.5D）・テーマ・門番の 人の え と 大きな すがた', async () => {
  const { C8A_PAINTERS, C8A_FRAMES, C8A_FLOOR_H, C8A_PROPS, C8A_THEMES } = await import('../public/js/client/render/tiles-c8a.js');
  const { Painter } = await import('../public/js/client/render/pixel.js');
  const ids = Object.entries(T).filter(([k]) => k.startsWith('C8R_')).map(([, v]) => v);
  for (const id of ids) {
    const p = new Painter(16, 16);
    assert.ok(C8A_PAINTERS[id], String(id));
    C8A_PAINTERS[id](p, 3, 1, {});
    if (TILE_INFO[id].anim) assert.ok(C8A_FRAMES[id] >= 2, `${id} コマ`);
  }
  assert.ok(C8A_FLOOR_H[T.C8R_VOID] < 0 && C8A_PROPS[T.C8R_CREST_MOON] && C8A_PROPS[T.C8R_BIGDOOR]);
  for (const th of ['c8r_past', 'c8r_now', 'c8r_hall', 'c8r_core']) assert.ok(C8A_THEMES[th], th);
  const { C8B_NPC_LOOKS, C8B_SPECIALS } = await import('../public/js/client/render/c8b-npc-art.js').then((m) => ({ C8B_NPC_LOOKS: m.C8B_NPC_LOOKS || m.C8C_NPC_LOOKS, C8B_SPECIALS: m.C8B_SPECIALS }));
  assert.ok(C8B_SPECIALS.includes('c8r_gate_npc'));
  const { paintC8cSpecial, C8C_NPC_LOOKS } = await import('../public/js/client/render/c8c-npc-art.js');
  assert.ok(C8C_NPC_LOOKS.c8r_gate);
  const sp = paintC8cSpecial('c8r_gate_npc', 'down', 0);
  assert.ok(sp?.p);
  void C8B_NPC_LOOKS;
});
