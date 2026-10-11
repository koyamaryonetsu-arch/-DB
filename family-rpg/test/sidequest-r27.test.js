// 第27回 E: 第4章クリアの あとの より道「砂の古代都市」と「古代の大迷宮」（地下10階）・たのまれごと 10こ
// 大迷宮の つながり・馬車が 入れる・休み所・近道（転送の門）・ボス（古竜オルドラ）・たのまれごとの 受けて→すすめて→ごほうび・クエストの 画面・文字
// 戦いは テストの 中で 勝たせる（ボスの 強さは tools/sim.js の lab で しらべる）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked, effectiveTile, condOk } from '../public/js/shared/maps/index.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import { flowCanReach } from '../public/js/shared/maps/flow.js';
import {
  LAB_MAPS, LAB_FLOORS, LAB_FLAGS, WARP_FLAGS, REST_FLOORS, FLOOR_POS, CITY_POS, ISLE, LAB_ENEMY_LV, LAB_TABLE, LAB_CHESTS, labMapId, QUEST_SPOTS, ringPos,
} from '../public/js/shared/maps/labyrinth.js';
import { SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { SIDE_QUESTS, labSubQuests, labDoneQuests, sideQuestHint } from '../public/js/shared/data/sidequests.js';
import { subQuests, questMarks } from '../public/js/shared/data/quest-targets.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { monsterDrops } from '../public/js/shared/data/loot.js';
import { wagonHere, wagonMenuAction } from '../public/js/shared/world/wagon.js';
import { wagonMapOk } from '../public/js/shared/data/wagon.js';
import { dungeonExit, useEscapeItem } from '../public/js/shared/world/escape.js';
import { ESCAPE_ITEM } from '../public/js/shared/data/escape.js';
import { gainExp, expForLevel, itemCount, computeStats } from '../public/js/shared/stats.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';
import { MEDAL_SPOT_BY_ID } from '../public/js/shared/maps/casino.js';
import { medalsFound } from '../public/js/shared/data/casino.js';
import { Bot, tickN } from './helpers.js';

const clearFlags = ['c4_clear', 'c4_star', 'c4_morgana', 'c4_scorpion', 'c3_clear', 'c2_clear', 'c1_clear', 'c3_onsen', 'q_smith_talk'];

async function setup(seed = 27, flags = clearFlags) {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  for (const f of flags) c.flags[f] = true;
  gainExp(c, expForLevel(45) - c.exp);
  c.hp = computeStats(c).maxHp;
  world.sendSelf(bot.s);
  bot.s.repelUntil = 1e15;
  return { world, bot, c };
}
// 戦いは すぐ 勝つ
async function play(bot, max = 30000) {
  const world = bot.world;
  for (let i = 0; i < max; i++) {
    for (const c2 of world.battles.values()) {
      if (c2.battle.over || c2.done) continue;
      c2.done = true;
      for (let k = 0; k < 20; k++) {
        const alive = c2.battle.enemies.filter((e) => e.alive);
        if (!alive.length) break;
        for (const e of alive) c2.battle.kill(e);
      }
      c2.battle.checkEnd();
    }
    bot.flushQueue();
    await tickN(world, 1);
    bot.flushQueue();
    if (!bot.s.busy && !bot.queue.length && !bot.inBattle && !world.battles.size) {
      await tickN(world, 2);
      bot.flushQueue();
      if (!bot.s.busy && !bot.queue.length && !world.battles.size) return true;
    }
  }
  return false;
}
const place = async (bot, map, x, y) => {
  bot.world.placeSession(bot.s, map, x + 0.5, y + 0.5, 'up', true);
  await play(bot);
};
const talk = (bot, id) => { bot.send({ t: 'interact', kind: 'npc', id }); return play(bot); };
const examine = (bot, x, y) => { bot.send({ t: 'interact', kind: 'tile', x, y }); return play(bot); };
async function stepOn(bot, x, y) {
  bot.x = x + 0.5;
  bot.y = y + 0.5;
  bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'up', moving: true, seq: bot.seq });
  await tickN(bot.world, 1);
  return play(bot);
}
// 選ぶ こたえを じゅんに（だいほんの 選たくしが 来るたびに 1つ ずつ）
function answers(bot, list) {
  const orig = bot.onMsg.bind(bot);
  bot.onMsg = (m) => {
    if (m.t === 'script' && !m.spectator) {
      const last = m.steps[m.steps.length - 1];
      if (last?.[0] === 'choice' && list.length) bot.choice = list.shift();
    }
    orig(m);
  };
}
const npcOn = (mapId, id) => MAPS[mapId].npcs.find((n) => n.id === id);
const npcAnywhere = (id) => {
  for (const m of Object.values(MAPS)) {
    const n = m.npcs.find((x) => x.id === id);
    if (n) return { map: m.id, n };
  }
  return null;
};
// NPC の となりへ 行って 話す
async function talkTo(bot, id) {
  const { map, n } = npcAnywhere(id);
  const m = MAPS[map];
  const nx = Math.floor(n.x), ny = Math.floor(n.y);
  for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0], [0, 2], [2, 0], [-2, 0], [0, -2], [1, 1], [-1, 1]]) {
    const x = nx + dx, y = ny + dy;
    if (!isBlocked(m, x, y, () => true) && !m.warpAt.has(y * m.w + x)) {
      await place(bot, map, x, y);
      return talk(bot, id);
    }
  }
  // 海の 上の 人（大王イカ）: 船の 上から
  await place(bot, map, nx, ny + 2);
  return talk(bot, id);
}

// ───── 歩いて 行ける マス ─────
function reach(m, start, has, wide = false) {
  const ok = (x, y) => {
    if (x < 0 || y < 0 || x >= m.w || y >= m.h) return false;
    if (isBlocked(m, x, y, has)) return false;
    if (wide) for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (isBlocked(m, x + i, y + j, has) && !m.warpAt.has((y + j) * m.w + x + i)) return false;
    return true;
  };
  const seen = new Set([start[1] * m.w + start[0]]);
  const q = [start];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = ny * m.w + nx;
      if (seen.has(k) || !ok(nx, ny)) continue;
      // 流れる 砂は 歩いて 通れない（flowCanReach で べつに しらべる）
      if (TILE_INFO[effectiveTile(m, nx, ny, has)]?.flow) continue;
      seen.add(k);
      q.push([nx, ny]);
    }
  }
  return seen;
}
const near = (seen, m, p, r = 2) => {
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (seen.has((p.y + dy) * m.w + p.x + dx)) return true;
  return false;
};

test('大迷宮のつながり: 古代都市と地下1〜10階。上りと下りのかいだんがとなりの階とつながり、どこも立てる所に着く', () => {
  assert.equal(LAB_MAPS.length, 11);
  assert.ok(LAB_FLOORS >= 8 && LAB_FLOORS <= 12, '8〜12階');
  for (const id of LAB_MAPS) {
    const m = MAPS[id];
    assert.ok(m, id);
    assert.equal(m.kind, 'dungeon', id);
    for (const w of m.warps) {
      const to = MAPS[w.to.map];
      assert.ok(to, `${id} → ${w.to.map}`);
      assert.ok(!isBlocked(to, Math.floor(w.to.x), Math.floor(w.to.y), () => true), `${id} の かいだんの 先は 立てる (${w.to.map} ${w.to.x},${w.to.y})`);
    }
  }
  for (let n = 1; n <= LAB_FLOORS; n++) {
    const m = MAPS[labMapId(n)];
    assert.ok(m.warps.some((w) => w.to.map === labMapId(n - 1)), `地下${n}階 → 上`);
    if (n < LAB_FLOORS) assert.ok(m.warps.some((w) => w.to.map === labMapId(n + 1)), `地下${n}階 → 下`);
  }
  // 古代都市の 南の 門 ⇔ 砂の海の 小島
  const sea = MAPS.sand_sea;
  assert.ok(sea.warps.some((w) => w.to.map === 'lab_city' && w.x === ISLE.gate.x && w.y === ISLE.gate.y));
  assert.ok(MAPS.lab_city.warps.some((w) => w.to.map === 'sand_sea'));
  // 門は 第4章クリアで 開く（それまでは 砂に うもれている）
  assert.equal(effectiveTile(sea, ISLE.gate.x, ISLE.gate.y, () => false), T.RUIN_GATE_SHUT);
  assert.equal(effectiveTile(sea, ISLE.gate.x, ISLE.gate.y, (f) => f === 'c4_clear'), T.RUIN_GATE);
  // 魔物は 地下1〜9階。Lv40〜50、深いほど 強い。出現表は 第4章・神殿の 魔物（今 ある もの）
  for (let n = 1; n < LAB_FLOORS; n++) {
    const m = MAPS[labMapId(n)];
    assert.ok(m.enemyLv >= 40 && m.enemyLv <= 50, `地下${n}階 Lv${m.enemyLv}`);
    if (n > 1) assert.ok(m.enemyLv >= LAB_ENEMY_LV[n - 1], '深いほど 強い');
    const t = ENCOUNTER_TABLES[LAB_TABLE(n)];
    assert.ok(t?.length, LAB_TABLE(n));
    for (const e of t) for (const [sp] of e.group) assert.ok(MONSTERS[sp] && MONSTERS[sp].lv >= 30 && MONSTERS[sp].lv <= 38 || sp === 'gold_beetle', sp);
  }
  assert.equal(Object.keys(MAPS.lab_city.spawnCounts).length, 0, '古代都市は 魔物が 出ない');
  assert.equal(Object.keys(MAPS.lab_b10.spawnCounts).length, 0, '古竜のねどこは 魔物が 出ない');
});

test('大迷宮のつながり: どの階も 上りかいだんから下りかいだんへ行ける（地下2階はとびら、地下4階は砂の川の流れ）', () => {
  const all = (f) => [LAB_FLAGS.door2, LAB_FLAGS.sphinx, LAB_FLAGS.guards, LAB_FLAGS.boss, ...Object.values(WARP_FLAGS)].includes(f);
  const none = () => false;
  for (let n = 1; n < LAB_FLOORS; n++) {
    const m = MAPS[labMapId(n)];
    const P = FLOOR_POS[n];
    // かいだんの となりの 立てる マスから
    const s0 = [P.up[0].x, P.up[0].y + (isBlocked(m, P.up[0].x, P.up[0].y + 1, all) ? -1 : 1)];
    if (n === 4) {
      // 砂の 川: 歩くだけでは わたれない。流れに のると 南の 岸へ
      assert.ok(!near(reach(m, s0, all), m, P.down[0], 1), '地下4階: 歩くだけでは 下りかいだんへ 行けない');
      assert.ok(flowCanReach(m, s0, [P.down[0].x, P.down[0].y - 1], all), '地下4階: 流れに のると 行ける');
      continue;
    }
    const seen = reach(m, s0, all);
    assert.ok(near(seen, m, P.down[0], 1), `地下${n}階: 下りかいだんへ 行ける`);
    if (n === 2) assert.ok(!near(reach(m, s0, none), m, P.down[0], 1), '地下2階: とびらが しまっていると 行けない');
  }
  // 地下4階: 東の はしまで 流されると 南東の 小べや（宝箱）へ
  const m4 = MAPS.lab_b4;
  const pocket = LAB_CHESTS[4].find((c) => c.id === 'lb4_pocket');
  assert.ok(flowCanReach(m4, [30, 13], [pocket.x - 1, pocket.y], () => false));
  // 地下10階: 古竜の 前まで 行ける
  const m10 = MAPS.lab_b10;
  const s10 = [FLOOR_POS[10].up[0].x, FLOOR_POS[10].up[0].y - 1];
  assert.ok(near(reach(m10, s10, none), m10, { x: 15, y: 10 }, 0));
});

test('馬車が入れる: 古代都市と大迷宮は wagonHere が「入れる」。上りから下りまで はば3の広い道がある。ふつうの洞窟は今までどおり入れない', async () => {
  for (const id of LAB_MAPS) {
    assert.ok(wagonHere(id), id);
    assert.ok(wagonMapOk(MAPS[id]), id);
  }
  assert.ok(wagonHere('overworld') && wagonHere('south'), 'フィールド');
  for (const id of ['cave_b1', 'temple_b1', 'pyramid1', 'north_well']) assert.equal(wagonHere(id), false, id);
  const all = () => true;
  for (let n = 1; n < LAB_FLOORS; n++) {
    if (n === 4) continue;
    const m = MAPS[labMapId(n)];
    const P = FLOOR_POS[n];
    const s0 = [P.up[0].x, P.up[0].y + (isBlocked(m, P.up[0].x, P.up[0].y + 1, all) ? -2 : 2)];
    const wide = reach(m, s0, all, true);
    assert.ok(wide.size > 0 && near(wide, m, P.down[0], 2), `地下${n}階: はば3の 道で 下りかいだんへ`);
  }
  // 馬車の 仲間と 入れかえ（地下5階でも できる。ふつうの 洞窟では できない）
  const { world, bot, c } = await setup(31);
  c.wagon = true;
  for (const k of ['npc_gard', 'npc_mina']) bot.send({ t: 'svc', kind: 'tavern', action: 'recruit', key: k });
  bot.send({ t: 'svc', kind: 'tavern', action: 'recruit', key: 'npc_rin', join: false });
  await play(bot);
  c.wagonKeys = ['npc_rin'];
  await place(bot, 'lab_b5', 21, 29);
  const r = wagonMenuAction(world, bot.s, { op: 'out', key: 'npc_rin', with: c.partyKeys[0] });
  assert.ok(r.ok, r.reason);
  assert.ok(c.partyKeys.includes('npc_rin'));
  await place(bot, 'cave_b1', 24, 32);
  const r2 = wagonMenuAction(world, bot.s, { op: 'in', key: 'npc_rin' });
  assert.equal(r2.ok, false, '洞窟の 中は 入り口で 待つ');
});

test('馬車と糸: 大迷宮は kind が dungeon のまま map.wagon で馬車が入れる。同じ階で、馬車がいて、みちびきの糸も使える', async () => {
  for (const id of LAB_MAPS) {
    assert.equal(MAPS[id].kind, 'dungeon', `${id}: 糸・帰る呪文は dungeon の マップ`);
    assert.equal(MAPS[id].wagon, true, `${id}: map.wagon`);
    assert.ok(!MAPS[id].noEscape && !MAPS[id].indoor, id);
  }
  const { world, bot, c } = await setup(39);
  c.wagon = true;
  await place(bot, 'lab_b7', 37, 12);
  assert.ok(wagonHere(bot.s.map), '馬車が いる（経験値も 馬車の きまりで）');
  c.items.push({ id: ESCAPE_ITEM, n: 1 });
  let res = null;
  useEscapeItem(world, bot.s, ESCAPE_ITEM, (ok, text) => { res = { ok, text }; });
  assert.ok(res?.ok, res?.text);
  assert.equal(bot.s.map, 'sand_sea', '砂の海の 小島の 門の 前へ');
  assert.ok(Math.hypot(bot.s.x - ISLE.gate.x, bot.s.y - ISLE.gate.y) < 3);
});

test('休み所: 古代都市と地下3・6・9階の聖なる火で回復と記録。2〜3階ごと', async () => {
  assert.deepEqual(REST_FLOORS, [3, 6, 9]);
  for (let i = 1; i < REST_FLOORS.length; i++) assert.ok(REST_FLOORS[i] - REST_FLOORS[i - 1] <= 3);
  for (const n of [0, ...REST_FLOORS]) {
    const m = MAPS[labMapId(n)];
    const rp = n === 0 ? CITY_POS.rest : FLOOR_POS[n].rest;
    assert.equal(m.tiles[rp.y * m.w + rp.x], T.REST_FIRE, `${m.id} の 聖なる 火`);
    assert.ok(m.actionAt.get(rp.y * m.w + rp.x)?.script === 'lab_rest');
    assert.ok(m.zoneAt(rp.x, rp.y + 1).startsWith('safe'), '休み所は 魔物が 出ない');
  }
  const { bot, c } = await setup(32);
  await place(bot, 'lab_b6', FLOOR_POS[6].rest.x, FLOOR_POS[6].rest.y + 1);
  c.hp = 1;
  c.mp = 0;
  const from = bot.msgs.length;
  await examine(bot, FLOOR_POS[6].rest.x, FLOOR_POS[6].rest.y);
  assert.equal(c.hp, computeStats(c).maxHp, 'HPが 回復');
  assert.ok(bot.msgs.slice(from).some((m) => m.t === 'script' && m.steps.some((s) => s[0] === 'ui' && s[1] === 'church')), '記録（教会と おなじ）');
});

test('近道: 地下3・6・9階の転送の門をふむと光り、古代都市の門から一気に行ける', async () => {
  for (const n of REST_FLOORS) {
    const m = MAPS[labMapId(n)];
    const r = ringPos(n);
    assert.equal(effectiveTile(m, r.x, r.y, () => false), T.WARP_RING_OFF);
    assert.equal(effectiveTile(m, r.x, r.y, (f) => f === WARP_FLAGS[n]), T.WARP_RING);
  }
  const { bot, c } = await setup(33);
  // 古代都市の 門: まだ どこにも つながっていない
  const r0 = ringPos(0);
  await place(bot, 'lab_city', r0.x, r0.y + 1);
  let from = bot.msgs.length;
  await stepOn(bot, r0.x, r0.y);
  assert.ok(bot.msgs.slice(from).some((m) => m.t === 'script' && JSON.stringify(m.steps).includes('まだ、どこにもつながっていない')));
  // 地下3階の 門を ふむと 光って、古代都市へ もどれる
  const r3 = ringPos(3);
  await place(bot, 'lab_b3', r3.x, r3.y + 1);
  bot.choice = 0;
  await stepOn(bot, r3.x, r3.y);
  assert.ok(c.flags[WARP_FLAGS[3]], '地下3階の 門が 光った');
  assert.equal(bot.map, 'lab_city', '古代都市へ もどった');
  // 古代都市から 地下3階へ
  await place(bot, 'lab_city', r0.x, r0.y + 1);
  bot.choice = 0;
  from = bot.msgs.length;
  await stepOn(bot, r0.x, r0.y);
  assert.ok(bot.msgs.slice(from).some((m) => m.t === 'script' && JSON.stringify(m.steps).includes('地下3階')));
  assert.equal(bot.map, 'lab_b3');
  assert.ok(!isBlocked(MAPS.lab_b3, Math.floor(bot.x), Math.floor(bot.y), () => true), '門の となりに 着く');
  // みちびきの糸は 使える（砂の海の 小島へ）
  const ex = dungeonExit(bot.world, bot.s);
  assert.equal(ex.map, 'sand_sea');
  assert.ok(Math.hypot(ex.x - ISLE.gate.x, ex.y - ISLE.gate.y) < 3);
  assert.ok(!MAPS.lab_b5.noEscape, '糸・帰る 呪文が 使える');
});

test('見どころ: 地下2階は2つの石のスイッチでとびら、地下5階はスフィンクスのなぞ（まちがえると番人）、地下8階は古代の番兵', async () => {
  const { bot, c } = await setup(34);
  const P2 = FLOOR_POS[2];
  await place(bot, 'lab_b2', P2.plates.w.x, P2.plates.w.y + 1);
  await stepOn(bot, P2.plates.w.x, P2.plates.w.y);
  assert.ok(c.flags[LAB_FLAGS.plateW] && !c.flags[LAB_FLAGS.door2], '西だけでは 開かない');
  await place(bot, 'lab_b2', P2.plates.e.x, P2.plates.e.y + 1);
  await stepOn(bot, P2.plates.e.x, P2.plates.e.y);
  assert.ok(c.flags[LAB_FLAGS.door2], '2つで とびらが 開く');
  assert.equal(effectiveTile(MAPS.lab_b2, P2.door[0].x, P2.door[0].y, (f) => !!c.flags[f]), T.RUIN_FLOOR);
  // スフィンクス: まちがえると 番人（戦い）→ 正かい（人）で 宝物庫
  const P5 = FLOOR_POS[5];
  await place(bot, 'lab_b5', P5.door[1].x, P5.door[1].y + 1);
  const fought = bot.battles.length;
  bot.choice = 0;
  await examine(bot, P5.door[1].x, P5.door[1].y);
  assert.ok(!c.flags[LAB_FLAGS.sphinx]);
  assert.ok(bot.battles.length > fought, 'まちがえると 番人と 戦う');
  bot.choice = 1;
  await examine(bot, P5.door[1].x, P5.door[1].y);
  assert.ok(c.flags[LAB_FLAGS.sphinx], '人');
  // 地下8階: 番兵
  const P8 = FLOOR_POS[8];
  await place(bot, 'lab_b8', 21, P8.trigger.y - 1);
  await stepOn(bot, 21, P8.trigger.y);
  assert.ok(c.flags[LAB_FLAGS.guards]);
  assert.equal(FIXED_ENCOUNTERS.lab_guardians.canFlee, false);
  assert.ok(STORY_SCRIPTS.has('lab_guards') && STORY_SCRIPTS.has('lab_dragon'), 'パーティー みんなで 見る');
});

test('ボス: ねむれる古竜オルドラ（前ぶれのある大技・反撃の構え）。かならずアクセサリーを落とす。たおすとうろこと宝箱', async () => {
  const d = MONSTERS.old_dragon;
  assert.ok(d.boss && d.lv >= 45 && d.lv <= 50);
  const ids = d.actions.map((a) => a.id);
  assert.equal(ABILITIES.m_old_inhale.effect.type, 'telegraph');
  assert.equal(ABILITIES.m_old_inhale.effect.next, 'm_old_flare');
  assert.ok(ABILITIES.m_old_flare.effect.type === 'phys', '身を 守ると 半分');
  assert.equal(ABILITIES.m_old_stance.effect.type, 'stance');
  assert.ok(ids.includes('m_old_inhale') && ids.includes('m_old_stance'));
  const boss = monsterDrops('old_dragon').filter((x) => x.kind === 'boss').map((x) => x.item);
  assert.deepEqual(boss, ['old_dragon_eye']);
  assert.equal(ITEMS.old_dragon_eye.type, 'acc');
  assert.ok(FIXED_ENCOUNTERS.lab_dragon.boss && !FIXED_ENCOUNTERS.lab_dragon.canFlee);
  // ねどこで たたかう
  const { bot, c } = await setup(35);
  const P = FLOOR_POS[10];
  await place(bot, 'lab_b10', 15, 14);
  assert.ok(!c.flags[LAB_FLAGS.boss]);
  await stepOn(bot, 15, 12);
  assert.ok(c.flags[LAB_FLAGS.boss], 'たおした');
  assert.ok(c.keyItems.includes('old_dragon_scale'), '古竜の うろこ');
  for (const ch of LAB_CHESTS[10]) assert.ok(condOk(ch.show, (f) => !!c.flags[f]), '宝箱が 出る');
  // 石板を 写す
  await place(bot, 'lab_b10', P.tablet.x, 2);
  await examine(bot, P.tablet.x, 1);
  assert.ok(c.keyItems.includes('tablet_copy'));
  // 古竜に たのむと 地上へ
  bot.choice = 0;
  await talkTo(bot, 'lab_dragon_calm');
  assert.equal(bot.map, 'lab_city');
});

test('ごほうび: ランク7〜8の★の装備・小さなメダルが宝箱に。★は店で買えない', () => {
  const items = Object.values(LAB_CHESTS).flat().map((ch) => ch.item).filter(Boolean);
  const medals = Object.values(LAB_CHESTS).flat().filter((ch) => ch.medal);
  assert.ok(medals.length >= 6, '小さなメダルの 宝箱');
  for (const ch of medals) assert.ok(MEDAL_SPOT_BY_ID[ch.medal]?.how === 'chest', ch.id);
  const stars = items.filter((id) => ITEMS[id]?.star);
  assert.ok(stars.length >= 8, `★の 装備 ${stars.length}`);
  for (const id of stars) {
    assert.ok([7, 8].includes(ITEMS[id].rank), id);
    assert.ok(!(ITEMS[id].price > 0), `${id} は 店で 買えない`);
  }
  // 深い 階ほど 強い（地下7階から ランク8）
  for (const n of [7, 8, 9]) for (const ch of LAB_CHESTS[n]) if (ITEMS[ch.item]?.star) assert.equal(ITEMS[ch.item].rank, 8, ch.id);
});

// ───── たのまれごと ─────
test('たのまれごと: 10こ。第1〜4章の町と大迷宮に人がいて、どれも受けられる（第4章クリアのあと。ラクダは とちゅうから）', () => {
  assert.equal(SIDE_QUESTS.length, 10);
  for (const id of Object.keys(QUEST_SPOTS)) {
    const at = npcAnywhere(id);
    assert.ok(at, id);
    const m = MAPS[at.map];
    if (id !== 'q_kraken') assert.ok(!isBlocked(m, Math.floor(at.n.x), Math.floor(at.n.y), () => true) || at.n.solid, `${id} の 場所`);
    assert.ok(SCRIPTS[at.n.script], `${id} の だいほん`);
  }
  const area = (id) => { const { map, n } = npcAnywhere(id); return MAPS[map].areaName?.(Math.floor(n.x), Math.floor(n.y)) || MAPS[map].name; };
  assert.equal(area('q_flower_girl'), 'ルミナの町');
  assert.equal(area('q_camel'), 'コガネ砂丘', '迷子のラクダは 村の 外の 砂ばく');
  assert.equal(area('q_vguard'), 'ホシフル村');
  assert.match(area('q_riddle'), /ユノハ/);
  assert.match(area('q_fisher'), /カモメ港/);
  // 大迷宮の 中の 人と 物
  assert.ok(npcOn('lab_b6', 'q_daigo') && npcOn('lab_b7', 'q_compass') && npcOn('lab_b4', 'q_ironwood'));
  // 前から いる 人の ことばも ふえる（ハサン・ドック・おばば・テツジイ）
  for (const id of ['c4_hassan', 'c4_d_wright', 'c3_obaba', 'c3_tetsujii']) assert.ok(SCRIPTS[id].sideWrapped, id);
  // 第4章クリアの 前は 受けられない（ラクダは よろい大サソリの あと）
  const pre = { flag: (f) => ['c4_scorpion'].includes(f), has: () => false, count: () => 0, night: false, name: 'ソラ', c: {} };
  assert.ok(JSON.stringify(SCRIPTS.q_camel_owner(pre)).includes('コブタ'));
  assert.equal(JSON.stringify(SCRIPTS.c4_hassan(pre)).includes('古代都市カルナ'), false);
  assert.equal(condOk(npcAnywhere('q_flower_girl').n.show, pre.flag), false);
});

test('たのまれごと: 迷子のラクダ・星読みの塔（星のかけら5つ→夜に星読み）・花の種のとどけ物・なぞなぞ', async () => {
  const { bot, c, world } = await setup(36);
  // 迷子のラクダ
  bot.choice = 0;
  await talkTo(bot, 'q_camel_owner');
  assert.ok(c.flags.q_camel_start);
  assert.ok(subQuests(c).some((q) => q.name === '迷子のラクダ' && q.find === 'q_camel'));
  await talkTo(bot, 'q_camel');
  assert.ok(c.flags.q_camel_found);
  const medals0 = medalsFound(c);
  await talkTo(bot, 'q_camel_owner');
  assert.ok(c.flags.q_camel_done && medalsFound(c) === medals0 + 2, '小さなメダル 2枚');
  // 星読みの塔
  await talkTo(bot, 'q_star_reader');
  assert.ok(c.flags.q_star_start);
  c.items.push({ id: 'star_shard', n: 5 });
  await talkTo(bot, 'q_star_reader');
  assert.ok(c.flags.q_star_lens && itemCount(c, 'star_shard') === 0);
  await talkTo(bot, 'q_star_reader');
  assert.ok(!c.flags.q_star_done2, '昼は 星が 見えない');
  c.timeShift = (c.timeShift || 0) + 0.5; // 夜にする
  world.clockFor && void 0;
  bot.s.char.timeShift = c.timeShift;
  const night = SCRIPTS.q_star_reader({ flag: (f) => !!c.flags[f], has: () => false, count: () => 0, night: true, name: 'ソラ', c });
  assert.ok(JSON.stringify(night).includes('star_reader_hat'), '夜は 星読み → 星読みのぼうし');
  // 花の種: ルミナ → ユノハの おばば → ルミナ
  await talkTo(bot, 'q_flower_girl');
  assert.ok(c.keyItems.includes('lumina_seeds'));
  assert.equal(subQuests(c).find((q) => q.name === '花の種のとどけ物').who, 'obaba');
  await talkTo(bot, 'obaba');
  assert.ok(c.flags.q_seed_given && c.keyItems.includes('onsen_manju') && !c.keyItems.includes('lumina_seeds'));
  await talkTo(bot, 'q_flower_girl');
  assert.ok(c.flags.q_seed_done && !c.keyItems.includes('onsen_manju'));
  // なぞなぞ: 1つ まちがえると やり直し → 3つ 正かい
  answers(bot, [0, 0]);
  await talkTo(bot, 'q_riddle');
  assert.ok(c.flags.q_riddle_start && !c.flags.q_riddle_done);
  answers(bot, [1, 2, 0]);
  await talkTo(bot, 'q_riddle');
  assert.ok(c.flags.q_riddle_done, 'フライパン・おふろ・時計');
});

test('たのまれごと: 強い魔物の退治（大王イカ・マグマゴーレム）と、大迷宮の中の物（鉄木・ダイゴのコンパス・石板・古竜のうろこ）', async () => {
  const { bot, c } = await setup(37);
  for (const [giver, mon, win, done, reward] of [['q_fisher', 'q_kraken', 'q_kraken_win', 'q_kraken_done', 'whirl_clothes'], ['q_vguard', 'q_golem', 'q_golem_win', 'q_golem_done', 'earth_charm']]) {
    bot.choice = 0;
    await talkTo(bot, giver);
    assert.ok(condOk(npcAnywhere(mon).n.show, (f) => !!c.flags[f]), `${mon} が 出る`);
    await talkTo(bot, mon);
    assert.ok(c.flags[win], `${mon} を しずめた`);
    assert.ok(subQuests(c).some((q) => q.who === giver && q.ready));
    await talkTo(bot, giver);
    assert.ok(c.flags[done] && itemCount(c, reward) === 1, reward);
    assert.ok(FIXED_ENCOUNTERS[mon].enemyLv >= 40, '強い');
  }
  // 船大工の 鉄木
  bot.choice = 0;
  await talkTo(bot, 'c4_d_wright');
  assert.ok(c.flags.q_wood_start);
  await talkTo(bot, 'q_ironwood');
  assert.ok(c.keyItems.includes('ancient_ironwood'));
  await talkTo(bot, 'c4_d_wright');
  assert.ok(c.flags.q_wood_done && itemCount(c, 'ironwood_shield') === 1);
  // 迷宮の 探検家
  await talkTo(bot, 'q_daigo');
  assert.ok(c.flags.q_daigo_start);
  await talkTo(bot, 'q_compass');
  await talkTo(bot, 'q_daigo');
  assert.ok(c.flags.q_daigo_done);
  // 古代都市の なぞ（ハサン）と 古竜の うろこ（テツジイ）
  await talkTo(bot, 'hassan');
  assert.ok(c.flags.q_ruin_start);
  await talkTo(bot, 'tetsujii');
  assert.ok(c.flags.q_scale_start);
  c.flags[LAB_FLAGS.boss] = true;
  c.keyItems.push('tablet_copy', 'old_dragon_scale');
  await talkTo(bot, 'hassan');
  assert.ok(c.flags.q_ruin_done && itemCount(c, 'ancient_bangle') === 1);
  bot.choice = 2;
  await talkTo(bot, 'tetsujii');
  assert.ok(c.flags.q_scale_done && itemCount(c, 'scale_claw') === 1, '竜うろこのツメ');
  assert.ok(!c.keyItems.includes('old_dragon_scale'));
  // ぜんぶ クリア（ラクダ・星・種・なぞなぞ いがい）
  assert.ok(labDoneQuests(c).length >= 6);
});

test('クエストのメニュー・地図のしるし・はなすのヒント', async () => {
  const { bot, c } = await setup(38);
  bot.choice = 0;
  await talkTo(bot, 'c4_d_wright');
  await talkTo(bot, 'q_daigo');
  const list = labSubQuests(c, (f) => !!c.flags[f], (id) => c.keyItems.includes(id));
  assert.deepEqual(list.map((q) => q.name).sort(), ['船大工の鉄木', '迷宮の探検家'].sort());
  for (const q of list) assert.ok(q.text && q.hint && q.who, q.name);
  // 地図: 地下4階に 鉄木の しるし、地下6階に ダイゴの しるし
  const m4 = questMarks(c, 'lab_b4', c.objective);
  assert.ok(m4.some((m) => m.kind === 'sub' && m.label === '船大工の鉄木' && !m.via));
  const m6 = questMarks(c, 'lab_b6', c.objective);
  assert.ok(m6.some((m) => m.label === '迷宮の探検家' && !m.via));
  // 別の マップからは 出入り口の 道しるべ
  const mc = questMarks(c, 'lab_city', c.objective);
  assert.ok(mc.some((m) => m.via && m.x === CITY_POS.down[0].x && m.y === CITY_POS.down[0].y), '古代都市では 地下への かいだんに 道しるべ');
  // はなす: たのまれごとの ヒント
  assert.match(sideQuestHint(c), /たのまれごと「(船大工の鉄木|迷宮の探検家)」/);
  // クリアした ものは クエストの 画面の「クリア！」に
  c.flags.q_daigo_done = true;
  assert.deepEqual(labDoneQuests(c), ['迷宮の探検家']);
  assert.equal(sideQuestHint({ flags: {}, keyItems: [], items: [] }), null);
});

test('文字: 大迷宮とたのまれごとのファイルは、使ってよい漢字だけ・スペースなし・ひらがなのまま 0', () => {
  const files = ['maps/labyrinth.js', 'data/story-lab.js', 'data/sidequests.js', 'data/items-lab.js', 'data/monsters-lab.js', 'data/abilities-lab.js', 'data/encounters-lab.js']
    .map((f) => gameFiles().find((g) => g.endsWith('/shared/' + f)));
  assert.ok(files.every(Boolean), 'gameFiles() に 入っている');
  const bad = [];
  for (const f of files) for (const p of checkFile(f)) bad.push(`${f.split('/').pop()}:${p.line} [${p.kind} ${p.detail}] ${p.text}`);
  assert.deepEqual(bad, []);
});
