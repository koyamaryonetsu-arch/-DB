// 第39回 C: 家族の 仕事の たのまれごと（劇場の空調・おみやげ屋・料理大会・消えた教会のかね・鉱山トロッコの線路）
// 受けて → すすめて → ごほうび（世界と だいほんで）・職業の しばり（いる／いない・酒場の 仲間も 数える・馬車は 数えない）・
// まちがえても やり直せる・ごほうびは 1回だけ・乗り物・第1部クリアの 前は 出ない・文字
// 戦いは テストの 中で すぐ 勝たせる（強さは さいごの テストで 完全オートの 戦いを ためす）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { DAY_MS, advanceClock } from '../public/js/shared/world/clock.js';
import { MAPS, isBlocked, effectiveTile, condOk } from '../public/js/shared/maps/index.js';
import { T } from '../public/js/shared/tiles.js';
import { SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { JOBS, jobAncestry } from '../public/js/shared/data/jobs.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { VEHICLES, vehicleShelf, buyVehicle, chooseVehicle, ownedVehicles } from '../public/js/shared/data/vehicles.js';
import { FAMILY_VEHICLES } from '../public/js/shared/data/vehicles-family.js';
import { FAMILY_GIFTS } from '../public/js/shared/data/items-family.js';
import { starsFor } from '../public/js/shared/data/items-rare.js';
import {
  FAMILY_QUESTS, boardPage, jobLine, jobLineNames, lineMember, partyHasLine, familySubQuests, SHOP_OPTIONS, SHOP_ANSWER, DISHES, DISH_ANSWER, BELL_WHO, BELL_WHY, BELL_ANSWER, RAIL_PUZZLES, METER,
} from '../public/js/shared/data/sidequests-family.js';
import { labDoneQuests, sideQuestHint, SIDE_QUESTS } from '../public/js/shared/data/sidequests.js';
import { subQuests, questMarks } from '../public/js/shared/data/quest-targets.js';
import { FQ, FQ_OPEN, DAMPERS, DIRTY_ZONES, THEATER_DOOR, SOUVENIR_DOOR, OLD_MINE_DOOR, SHOP_VOICES, BELL_CLUES, BELL_TALKS, RAIL_FIX } from '../public/js/shared/maps/family-quests.js';
import { scriptCtx } from '../public/js/shared/world/scripts.js';
import { recruitNpc } from '../public/js/shared/world/party.js';
import { grantWagon } from '../public/js/shared/world/wagon.js';
import { gainExp, expForLevel, computeStats, itemCount } from '../public/js/shared/stats.js';
import { medalsFound } from '../public/js/shared/data/casino.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';
import { makeChar, runBattle } from '../tools/sim.js';
import { VEHICLE_ART, VIEWS, paintVehicle } from '../public/js/client/render/vehicle-art.js';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { FAMILY_NPC_LOOKS } from '../public/js/client/render/family-art.js';
import { Bot, tickN } from './helpers.js';

const CLEAR = ['c5_clear', 'c4_clear', 'c3_clear', 'c2_clear', 'c1_clear', 'c3_onsen'];

async function setup(seed = 39, { job = 'warrior', flags = CLEAR } = {}) {
  // 時計は 昼から（おみやげ屋は 夜に にぎわう）
  const t0 = Date.now();
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false, now: () => 50 * DAY_MS + Math.round(0.3 * DAY_MS) + (Date.now() - t0) });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay(job);
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  for (const f of flags) c.flags[f] = true;
  gainExp(c, expForLevel(56) - c.exp);
  c.hp = computeStats(c).maxHp;
  c.gold = 1000;
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
const npcAnywhere = (id) => {
  for (const m of Object.values(MAPS)) {
    const n = m.npcs.find((x) => x.id === id);
    if (n) return { map: m.id, n };
  }
  return null;
};
// NPC の となりへ 行って 話す。choices … 選たくしが 来るたびに 1つずつ（たりない 時は 0）
async function talkTo(bot, id, choices = []) {
  const list = [...choices];
  const orig = bot.onMsg;
  bot.onMsg = (m) => {
    if (m.t === 'script' && !m.spectator) {
      const last = m.steps[m.steps.length - 1];
      if (last?.[0] === 'choice') bot.choice = list.length ? list.shift() : 0;
    }
    orig.call(bot, m);
  };
  const { map, n } = npcAnywhere(id);
  const m = MAPS[map];
  const nx = Math.floor(n.x), ny = Math.floor(n.y);
  const has = () => true;
  let spot = null;
  for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0], [0, 2], [2, 0], [-2, 0], [0, -2], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const x = nx + dx, y = ny + dy;
    if (x < 0 || y < 0 || x >= m.w || y >= m.h) continue;
    if (!isBlocked(m, x, y, has) && !m.warpAt.has(y * m.w + x) && !m.npcs.some((o) => o !== n && o.solid && Math.floor(o.x) === x && Math.floor(o.y) === y)) { spot = [x, y]; break; }
  }
  assert.ok(spot, `${id} の となりに 立てる`);
  await place(bot, map, spot[0], spot[1]);
  const before = bot.msgs.length;
  bot.send({ t: 'interact', kind: 'npc', id });
  await play(bot);
  bot.onMsg = orig;
  bot.choice = 0;
  return bot.msgs.slice(before);
}
// 話の 中の ことば
const said = (msgs, re) => msgs.some((m) => m.t === 'script' && m.steps.some((st) => (st[0] === 'say' || st[0] === 'choice') && re.test(String(st[0] === 'say' ? st[2] : st[1]))));
const spoke = (msgs, who) => msgs.some((m) => m.t === 'script' && m.steps.some((st) => st[0] === 'say' && st[1] === who));
const battled = (msgs, id) => msgs.some((m) => m.t === 'battleStart' || (m.t === 'script' && m.steps.some((st) => st[0] === 'battle' && st[1] === id)));
const q = (c, name) => subQuests(c).find((x) => x.name === name);
const NEED = /の人が、パーティーにいてくれたら/;

// ───── しくみ ─────
test('しくみ: 5つの たのまれごと・職業の系統は 転職の つながりから出す（手で書かない）', () => {
  assert.equal(FAMILY_QUESTS.length, 5);
  assert.deepEqual(FAMILY_QUESTS.map((x) => x.name), ['劇場の空調をなおせ', 'さびれたおみやげ屋の立て直し', 'カナトコの料理大会', 'ルミナの町の、消えた教会のかね', '鉱山トロッコの線路']);
  const line = jobLine(['setsubiya']);
  for (const id of ['setsubiya', 'ryonetsu', 'facility_genius']) assert.ok(line.has(id), id);
  for (const id of ['warrior', 'salaryman', 'cook']) assert.ok(!line.has(id), id);
  // どの 職業も「転職の つながりで 元に たどりつく」ものだけ（新しい 職業が ふえても 合う）
  for (const qd of FAMILY_QUESTS) {
    const L = jobLine(qd.roots);
    for (const id of Object.keys(JOBS)) assert.equal(L.has(id), qd.roots.some((r) => jobAncestry(id).has(r)), `${qd.id} ${id}`);
    assert.ok(jobLineNames(qd.roots).length >= qd.roots.length);
  }
  assert.ok(jobLine(['cook']).has('star_chef') && jobLine(['railman']).has('keikyu_driver'));
  assert.ok(jobLine(['police', 'shonen_tantei']).has('meitantei') && jobLine(['police', 'shonen_tantei']).has('police'));
  assert.ok(jobLine(['salaryman', 'parttimer']).has('tatakiage') && jobLine(['salaryman', 'parttimer']).has('shacho'));
  // 魔物の 仲間は 職業が ないので 数えない・だれか 1人で よい
  assert.equal(partyHasLine([{ job: 'warrior' }, { species: 'pururin', job: 'setsubiya' }], ['setsubiya']), false);
  assert.equal(lineMember([{ job: 'warrior', name: 'A' }, { job: 'ryonetsu', name: 'B' }], ['setsubiya']).name, 'B');
  // 前からの たのまれごとの 一らんは そのまま（10こ）
  assert.equal(SIDE_QUESTS.length, 10);
});

test('しくみ: 第1部クリア（c5_clear）の あとだけ、たのみたい人が立つ。前は たのまれごとが始まらない', () => {
  const none = () => false;
  const ids = ['fq_th_crier', 'fq_shop_v1', 'fq_cook_host', 'fq_cook_judge', 'fq_bell_sister', 'fq_bell_stand', 'fq_rail_miner'];
  for (const id of ids) {
    const at = npcAnywhere(id);
    assert.ok(at, id);
    assert.equal(condOk(at.n.show, none), false, `${id} は 第1部クリアの 前は 出ない`);
    assert.equal(condOk(at.n.show, (f) => f === FQ_OPEN), true, `${id} は 第1部クリアの あと 出る`);
  }
  // 劇場・おみやげ屋の 中の 人に 話しても、第1部クリアの 前は 始まらない
  const pre = { flag: () => false, has: () => false, count: () => 0, night: false, name: 'ソラ', c: { job: 'setsubiya' } };
  for (const id of ['fq_th_manager', 'fq_shop_owner', 'fq_cook_host', 'fq_bell_sister', 'fq_rail_miner']) {
    const steps = SCRIPTS[id](pre);
    assert.ok(!JSON.stringify(steps).includes('"choice"'), `${id} は 受けられない`);
  }
  assert.deepEqual(familySubQuests({ flags: {} }, () => false, () => false), []);
  // 古い 鉱山の 入り口は、ゲンじいさんの たのみを 受けるまで 板で ふさがっている
  const north = MAPS.north;
  assert.equal(effectiveTile(north, OLD_MINE_DOOR.x, OLD_MINE_DOOR.y, none), T.MINE_BEAM);
  assert.equal(effectiveTile(north, OLD_MINE_DOOR.x, OLD_MINE_DOOR.y, (f) => f === FQ.railStart), T.CAVE_ENTRANCE);
});

test('マップ: 劇場（ロビー・客席・機械室・屋上）・おみやげ屋・古い鉱山・小べやが つながり、どこも立てる所に着く。町の中にいる', () => {
  for (const id of ['fq_th_lobby', 'fq_th_hall', 'fq_th_machine', 'fq_th_roof', 'fq_shop', 'fq_old_mine', 'fq_mine_room']) {
    const m = MAPS[id];
    assert.ok(m, id);
    for (const w of m.warps) {
      const to = MAPS[w.to.map];
      assert.ok(to, `${id} → ${w.to.map}`);
      assert.ok(!isBlocked(to, Math.floor(w.to.x), Math.floor(w.to.y), () => true), `${id} → ${w.to.map} ${w.to.x},${w.to.y}`);
      assert.ok(!to.warpAt.has(Math.floor(w.to.y) * to.w + Math.floor(w.to.x)), `${id} → ${w.to.map}: 着いた所が また 出入り口`);
    }
    assert.equal(Object.keys(m.spawnCounts).length, 0, `${id} は 魔物が 出ない`);
  }
  const links = (a, b) => MAPS[a].warps.some((w) => w.to.map === b);
  assert.ok(links('south', 'fq_th_lobby') && links('fq_th_lobby', 'south'));
  for (const r of ['fq_th_hall', 'fq_th_machine', 'fq_th_roof']) assert.ok(links('fq_th_lobby', r) && links(r, 'fq_th_lobby'), r);
  assert.ok(links('north', 'fq_shop') && links('fq_shop', 'north') && links('north', 'fq_old_mine') && links('fq_old_mine', 'north'));
  for (const d of THEATER_DOOR) assert.equal(MAPS.south.tiles[d.y * MAPS.south.w + d.x], T.DOOR);
  assert.equal(MAPS.north.tiles[SOUVENIR_DOOR.y * MAPS.north.w + SOUVENIR_DOOR.x], T.DOOR);
  const area = (id) => { const { map, n } = npcAnywhere(id); return MAPS[map].areaName?.(Math.floor(n.x), Math.floor(n.y)) || MAPS[map].name; };
  assert.equal(area('fq_th_crier'), '王都サファラ');
  assert.match(area('fq_shop_v2'), /ユノハ/);
  assert.match(area('fq_cook_host'), /カナトコ/);
  assert.match(area('fq_rail_miner'), /カナトコ/);
  assert.equal(area('fq_bell_sister'), 'ルミナの町');
  // 人は 立てる 所（かべの 上の 物は かたい NPC）。だいほんが ある
  for (const m of Object.values(MAPS)) {
    for (const n of m.npcs) {
      if (!n.id.startsWith('fq_')) continue;
      assert.ok(SCRIPTS[n.script], `${n.id} の だいほん`);
      assert.ok(!isBlocked(m, Math.floor(n.x), Math.floor(n.y), () => true) || n.solid, `${n.id} の 場所`);
    }
  }
  // 戦い・トロッコは パーティーみんなで 見る
  for (const id of ['fq_th_unit', 'fq_cook_mole', 'fq_rail_cart']) assert.ok(STORY_SCRIPTS.has(id), id);
});

// ───── 1. 劇場の空調 ─────
test('劇場の空調をなおせ: ふき出し口 → 空調機（フィルター）→ 室外機（すなぼこりの魔物）→ 満席 → かん気（ダンパー）→ 省エネの温度 → ごほうび。職業のしばり（仲間も数える・馬車は数えない）', async () => {
  const { world, bot, c } = await setup(391);
  let msgs = await talkTo(bot, 'fq_th_manager', [0]);
  assert.ok(c.flags[FQ.acStart]);
  assert.ok(said(msgs, /空調のことにくわしい仲間/), '設備屋が いない 時の ことば');
  assert.equal(q(c, '劇場の空調をなおせ').find, 'fq_th_vent_a', '地図の しるし: ふき出し口');
  // ふき出し口は だれでも 調べられる
  msgs = await talkTo(bot, 'fq_th_vent_a');
  assert.ok(c.flags[FQ.acVent] && said(msgs, NEED));
  assert.equal(q(c, '劇場の空調をなおせ').find, 'fq_th_ahu');
  // 空調機: 設備屋の 系統が いないと 直せない
  msgs = await talkTo(bot, 'fq_th_ahu', [0]);
  assert.ok(!c.flags[FQ.acFilter] && said(msgs, /設備屋の人が、パーティーに/) && said(msgs, /ryonetsu/));
  // 酒場の 仲間が 設備屋（パーティーに いる）→ 直せる。まちがえても やり直せる
  const r = recruitNpc(world, bot.s, 'npc_gard', { force: true });
  assert.ok(r.ok && r.where !== 'wagon');
  const gard = c.companions.find((e) => e.key === 'npc_gard').char;
  gard.job = 'setsubiya';
  assert.equal(lineMember(scriptCtx(bot.s, bot.s, world).partyChars(), ['setsubiya'])?.name, gard.name, '仲間も 数える');
  msgs = await talkTo(bot, 'fq_th_ahu', [1]);
  assert.ok(!c.flags[FQ.acFilter] && said(msgs, /もう一度、考えよう/), 'まちがい → やり直し');
  msgs = await talkTo(bot, 'fq_th_ahu', [0]);
  assert.ok(c.flags[FQ.acFilter] && spoke(msgs, gard.name), '設備屋の 仲間が 話す');
  assert.equal(q(c, '劇場の空調をなおせ').find, 'fq_th_unit');
  // 馬車の 仲間は 数えない
  grantWagon(c);
  await place(bot, 'south', THEATER_DOOR[0].x, THEATER_DOOR[0].y + 2);
  bot.send({ t: 'menu', action: 'wagon', op: 'in', key: 'npc_gard' });
  assert.ok(c.wagonKeys.includes('npc_gard'));
  assert.equal(lineMember(scriptCtx(bot.s, bot.s, world).partyChars(), ['setsubiya']), null, '馬車は 数えない');
  msgs = await talkTo(bot, 'fq_th_unit', [0]);
  assert.ok(!c.flags[FQ.acDust] && !battled(msgs, 'fq_dust') && said(msgs, NEED));
  // 自分が 天才しせつ管理者（系統の 先）でも よい
  c.job = 'facility_genius';
  msgs = await talkTo(bot, 'fq_th_unit', [1]);
  assert.ok(c.flags[FQ.acDust], 'すなぼこりの魔物を たおした');
  assert.ok(!c.flags[FQ.acUnit] && said(msgs, /たたいたら/), 'ファンの 直し方を まちがえた → やり直し');
  msgs = await talkTo(bot, 'fq_th_unit', [0]);
  assert.ok(c.flags[FQ.acUnit] && !battled(msgs, 'fq_dust'), '2回目は 戦わない');
  assert.equal(q(c, '劇場の空調をなおせ').ready, true);
  // 支配人に 知らせる → 満席（お客さんが 出る）
  await talkTo(bot, 'fq_th_manager');
  assert.ok(c.flags[FQ.acShow]);
  assert.ok(condOk(npcAnywhere('fq_th_guest1').n.show, (f) => !!c.flags[f]), 'お客さんで 満席');
  // メーター: よごれた 席（赤）
  msgs = await talkTo(bot, 'fq_th_meter');
  for (const n of DIRTY_ZONES) assert.ok(said(msgs, new RegExp(`${DAMPERS[n - 1].zone}…${METER[n]}（赤）`)), `${n} は 赤`);
  assert.equal(q(c, '劇場の空調をなおせ').find, 'fq_th_dmp1');
  // ダンパー: いらない 所まで 開けると 入りすぎ → しめる → よごれた 席だけ
  await talkTo(bot, 'fq_th_dmp1', [0]);
  await talkTo(bot, 'fq_th_dmp2', [0]);
  msgs = await talkTo(bot, 'fq_th_panel');
  assert.ok(said(msgs, /前の席には、外の暑い空気が入りすぎている/) && said(msgs, /うしろの席の空気が、まだよごれている/));
  assert.ok(!c.flags[FQ.acAir]);
  await talkTo(bot, 'fq_th_dmp1o', [0]);
  assert.ok(!c.flags.fq_dmp1, 'しめた');
  msgs = await talkTo(bot, 'fq_th_dmp3', [0]);
  assert.ok(c.flags[FQ.acAir] && said(msgs, /かん気」のランプが、みどり/));
  // 温度: 18度・22度・30度は やり直し → 26度
  for (const k of [0, 1, 3]) {
    await talkTo(bot, 'fq_th_panel', [k]);
    assert.ok(!c.flags[FQ.acTemp], `${k} は やり直し`);
  }
  await talkTo(bot, 'fq_th_panel', [2]);
  assert.ok(c.flags[FQ.acTemp]);
  // 報告 → ごほうび（★5の アクセサリー・高所作業車・ゴールド・小さなメダル 3枚）
  const gold0 = c.gold, medals0 = medalsFound(c);
  await talkTo(bot, 'fq_th_manager');
  assert.ok(c.flags[FQ.acDone]);
  assert.equal(itemCount(c, 'fq_air_badge'), 1);
  assert.ok(c.vehicles.includes('lift_truck'));
  assert.equal(c.gold, gold0 + 5000);
  assert.equal(medalsFound(c), medals0 + 3);
  assert.ok(labDoneQuests(c).includes('劇場の空調をなおせ'));
  assert.ok(!q(c, '劇場の空調をなおせ'));
  // 2回目は もらえない
  await talkTo(bot, 'fq_th_manager');
  assert.equal(itemCount(c, 'fq_air_badge'), 1);
  assert.equal(c.gold, gold0 + 5000);
  assert.equal(medalsFound(c), medals0 + 3);
  // 劇場の 前に ならぶ人
  assert.ok(condOk(npcAnywhere('fq_th_line1').n.show, (f) => !!c.flags[f]));
});

// ───── 2. おみやげ屋 ─────
test('さびれたおみやげ屋の立て直し: 町の人の声 → 大事な3つ（まちがえると少しだけ → やり直し）→ 夜にぎわう → ごほうび', async () => {
  const { world, bot, c } = await setup(392, { job: 'parttimer' });
  await talkTo(bot, 'fq_shop_owner', [0]);
  assert.ok(c.flags[FQ.shopStart]);
  // 声が 3人より 少ないと まだ
  await talkTo(bot, 'fq_shop_v1');
  let msgs = await talkTo(bot, 'fq_shop_owner');
  assert.ok(said(msgs, /今は1人/) && !c.flags[FQ.shopPlan]);
  assert.equal(q(c, 'さびれたおみやげ屋の立て直し').find, 'fq_shop_v2');
  for (const id of ['fq_shop_v2', 'fq_shop_v3', 'fq_shop_v4']) await talkTo(bot, id);
  assert.ok(SHOP_VOICES.every((k) => c.flags[k]));
  assert.equal(q(c, 'さびれたおみやげ屋の立て直し').ready, true);
  // まちがい（かんばん・値段・店の色）→ 少しだけ お客さん → もう一度
  const pick = (ids) => { const out = []; const left = SHOP_OPTIONS.map((_, i) => i); for (const id of ids) { out.push(left.indexOf(id)); left.splice(left.indexOf(id), 1); } return out; };
  msgs = await talkTo(bot, 'fq_shop_owner', pick([0, 2, 4]));
  assert.ok(!c.flags[FQ.shopPlan] && said(msgs, /お客さんが、2人だけ来てくれた/));
  // 正かい（かんばん・品ぞろえ・あいさつ。じゅんばんは どれでも）
  msgs = await talkTo(bot, 'fq_shop_owner', pick([3, 1, 0]));
  assert.ok(c.flags[FQ.shopPlan], `大事な3つ: ${SHOP_ANSWER.map((i) => SHOP_OPTIONS[i])}`);
  // 昼は まだ。夜に なると にぎわう
  msgs = await talkTo(bot, 'fq_shop_owner');
  assert.ok(!c.flags[FQ.shopDone] && said(msgs, /夜まで休む/));
  assert.match(q(c, 'さびれたおみやげ屋の立て直し').hint, /夜まで休む/);
  advanceClock(world, bot.s, 'night');
  const medals0 = medalsFound(c);
  msgs = await talkTo(bot, 'fq_shop_owner');
  assert.ok(c.flags[FQ.shopDone]);
  assert.equal(itemCount(c, 'fq_maneki'), 1);
  assert.ok(c.vehicles.includes('rickshaw'));
  assert.equal(medalsFound(c), medals0 + 2);
  assert.ok(condOk(npcAnywhere('fq_shop_guest1').n.show, (f) => !!c.flags[f]), 'お店に お客さん');
  await talkTo(bot, 'fq_shop_owner');
  assert.equal(itemCount(c, 'fq_maneki'), 1, '1回だけ');
});

test('さびれたおみやげ屋の立て直し: 会社員・アルバイトの系統が いないと、計画を立てられない', async () => {
  const { bot, c } = await setup(393, { job: 'warrior' });
  await talkTo(bot, 'fq_shop_owner', [0]);
  for (const id of ['fq_shop_v1', 'fq_shop_v2', 'fq_shop_v3']) await talkTo(bot, id);
  const msgs = await talkTo(bot, 'fq_shop_owner', [0, 0, 1]);
  assert.ok(said(msgs, /会社員かアルバイトの人が、パーティーに/) && !c.flags[FQ.shopPlan]);
  c.job = 'shacho'; // 会社員 → 部長 → 社長
  await talkTo(bot, 'fq_shop_owner', [0, 0, 1]);
  assert.ok(c.flags[FQ.shopPlan], 'かんばん・品ぞろえ・あいさつ');
});

// ───── 3. 料理大会 ─────
test('カナトコの料理大会: うわさ → 材料3つ（きらきら・魔物の落とし物・店）→ 料理をえらぶ（まちがえても材料はのこる）→ 優勝', async () => {
  const { bot, c } = await setup(394, { job: 'warrior' });
  await talkTo(bot, 'fq_cook_host', [0]);
  assert.ok(c.flags[FQ.cookStart]);
  for (const id of ['fq_cook_rumor1', 'fq_cook_rumor2', 'fq_cook_rumor3']) {
    const msgs = await talkTo(bot, id);
    assert.ok(msgs.length);
  }
  assert.ok(c.flags.fq_cook_r1 && c.flags.fq_cook_r2 && c.flags.fq_cook_r3);
  assert.equal(q(c, 'カナトコの料理大会').find, 'fq_cook_mush');
  await talkTo(bot, 'fq_cook_mush');
  assert.ok(c.keyItems.includes('fq_mushroom'));
  assert.equal(q(c, 'カナトコの料理大会').find, 'fq_cook_mole');
  await talkTo(bot, 'fq_cook_mole');
  assert.ok(c.flags[FQ.cookMole] && c.keyItems.includes('fq_salt'), 'モグラを たおして 岩しお');
  assert.equal(condOk(npcAnywhere('fq_cook_mole').n.show, (f) => !!c.flags[f]), false, 'モグラは いなくなる');
  // ミルクは 店で 買う（ゴールドが たりないと 買えない）
  c.gold = 50;
  await talkTo(bot, 'fq_cook_milk', [0]);
  assert.ok(!c.keyItems.includes('fq_milk') && c.gold === 50);
  c.gold = 1000;
  await talkTo(bot, 'fq_cook_milk', [0]);
  assert.ok(c.keyItems.includes('fq_milk') && c.gold === 800);
  assert.equal(q(c, 'カナトコの料理大会').ready, true);
  // 料理人が いないと 出られない
  let msgs = await talkTo(bot, 'fq_cook_host', [DISH_ANSWER]);
  assert.ok(said(msgs, /料理人の人が、パーティーに/) && !c.flags[FQ.cookDone]);
  c.job = 'patissier';
  // まちがい（シャーベット・カレー）→ 2位。材料は のこる
  for (const k of [0, 2]) {
    msgs = await talkTo(bot, 'fq_cook_host', [k]);
    assert.ok(said(msgs, /今回は2位/) && !c.flags[FQ.cookDone], DISHES[k]);
    assert.ok(['fq_mushroom', 'fq_salt', 'fq_milk'].every((id) => c.keyItems.includes(id)), '材料は のこる');
  }
  msgs = await talkTo(bot, 'fq_cook_host', [DISH_ANSWER]);
  assert.ok(c.flags[FQ.cookDone] && said(msgs, /優勝は…あんたたちだ/));
  assert.equal(itemCount(c, 'fq_gold_ladle'), 1);
  assert.ok(c.vehicles.includes('kitchen_car'));
  assert.ok(!c.keyItems.includes('fq_milk'), '材料を 使った');
  await talkTo(bot, 'fq_cook_host');
  assert.equal(itemCount(c, 'fq_gold_ladle'), 1, '1回だけ');
});

// ───── 4. 消えた教会のかね ─────
test('ルミナの町の、消えた教会のかね: 手がかり3つ・話4人 → だれが・なぜ（まちがえても聞きなおせる）→ カラスのクロ → かねがひびく', async () => {
  const { bot, c } = await setup(395, { job: 'warrior' });
  await talkTo(bot, 'fq_bell_sister', [0]);
  assert.ok(c.flags[FQ.bellStart]);
  assert.equal(q(c, 'ルミナの町の、消えた教会のかね').find, 'fq_bell_stand');
  // 手がかりが そろう 前は まだ
  let msgs = await talkTo(bot, 'fq_bell_sister');
  assert.ok(said(msgs, /手がかりは、あと3つ/) && !c.flags[FQ.bellSolved]);
  for (const id of ['fq_bell_stand', 'fq_bell_feather', 'fq_bell_mud', 'fq_bell_w1', 'fq_bell_w2', 'fq_bell_w3', 'fq_bell_w4']) await talkTo(bot, id);
  assert.ok(BELL_CLUES.every((k) => c.flags[k]) && BELL_TALKS.every((k) => c.flags[k]));
  assert.equal(q(c, 'ルミナの町の、消えた教会のかね').ready, true);
  // 警察官・探ていの 系統が いないと 見ぬけない
  msgs = await talkTo(bot, 'fq_bell_sister', BELL_ANSWER);
  assert.ok(said(msgs, /警察官か探ていの人が、パーティーに/) && !c.flags[FQ.bellSolved]);
  c.job = 'oshiri_tantei'; // 少年探てい団 → おしり探てい
  // まちがい（だれ・なぜ）→ もう一度
  msgs = await talkTo(bot, 'fq_bell_sister', [0]);
  assert.ok(said(msgs, /手がかりと合わないみたい/) && !c.flags[FQ.bellSolved]);
  await talkTo(bot, 'fq_bell_sister', [BELL_ANSWER[0], 1]);
  assert.ok(!c.flags[FQ.bellSolved], BELL_WHY[1]);
  await talkTo(bot, 'fq_bell_sister', BELL_ANSWER);
  assert.ok(c.flags[FQ.bellSolved] && c.keyItems.includes('fq_button'), `${BELL_WHO[BELL_ANSWER[0]]}・${BELL_WHY[BELL_ANSWER[1]]}`);
  assert.equal(q(c, 'ルミナの町の、消えた教会のかね').find, 'fq_bell_crow');
  await talkTo(bot, 'fq_bell_crow');
  assert.ok(c.flags[FQ.bellGot] && c.keyItems.includes('fq_bell') && !c.keyItems.includes('fq_button'));
  const medals0 = medalsFound(c);
  msgs = await talkTo(bot, 'fq_bell_sister');
  assert.ok(c.flags[FQ.bellDone] && said(msgs, /カラーン/));
  assert.equal(itemCount(c, 'fq_detective_glass'), 1);
  assert.ok(c.vehicles.includes('patrol_car'));
  assert.equal(medalsFound(c), medals0 + 2);
  assert.ok(condOk(npcAnywhere('fq_bell_stand2').n.show, (f) => !!c.flags[f]) && !condOk(npcAnywhere('fq_bell_stand').n.show, (f) => !!c.flags[f]), 'かねが 台に もどる');
  await talkTo(bot, 'fq_bell_sister');
  assert.equal(itemCount(c, 'fq_detective_glass'), 1, '1回だけ');
});

// ───── 5. 鉱山トロッコの線路 ─────
test('鉱山トロッコの線路: 入り口が開く → こわれた線路3か所（まちがえてもやり直し）→ トロッコ → だれも知らない小べや → ごほうび', async () => {
  const { world, bot, c } = await setup(396, { job: 'railman' });
  await talkTo(bot, 'fq_rail_miner', [0]);
  assert.ok(c.flags[FQ.railStart]);
  assert.equal(effectiveTile(MAPS.north, OLD_MINE_DOOR.x, OLD_MINE_DOOR.y, world.hasFlagFn(bot.s)), T.CAVE_ENTRANCE, '入り口が 開く');
  // 線路が 直る 前は トロッコに 乗れない
  let msgs = await talkTo(bot, 'fq_rail_cart', [0]);
  assert.equal(bot.map, 'fq_old_mine');
  assert.ok(said(msgs, /まだ走れない/));
  for (let i = 0; i < 3; i++) {
    const P = RAIL_PUZZLES[i];
    const wrong = P.ans === 0 ? 1 : 0;
    msgs = await talkTo(bot, `fq_rail_broken${i + 1}`, [wrong]);
    assert.ok(!c.flags[RAIL_FIX[i]] && said(msgs, /もう一度、考えよう/), `${i + 1}か所目: まちがい`);
    assert.equal(q(c, '鉱山トロッコの線路').find, `fq_rail_broken${i + 1}`);
    await talkTo(bot, `fq_rail_broken${i + 1}`, [P.ans]);
    assert.ok(c.flags[RAIL_FIX[i]], `${i + 1}か所目: ${P.opts[P.ans]}`);
  }
  assert.equal(q(c, '鉱山トロッコの線路').find, 'fq_rail_cart');
  msgs = await talkTo(bot, 'fq_rail_cart', [0]);
  assert.ok(msgs.some((m) => m.t === 'script' && m.steps.some((st) => st[0] === 'ride')), 'トロッコの 場面');
  assert.equal(bot.map, 'fq_mine_room', '線路の 先の 小べや');
  assert.ok(c.flags[FQ.railRide]);
  assert.ok(MAPS.fq_mine_room.chests.length >= 2, '小べやに 宝');
  await talkTo(bot, 'fq_rail_note');
  await talkTo(bot, 'fq_rail_cart_back', [0]);
  assert.equal(bot.map, 'fq_old_mine');
  const medals0 = medalsFound(c);
  await talkTo(bot, 'fq_rail_miner');
  assert.ok(c.flags[FQ.railDone]);
  assert.equal(itemCount(c, 'fq_gold_ticket'), 1);
  assert.ok(c.vehicles.includes('gold_trolley'));
  assert.equal(medalsFound(c), medals0 + 2);
  await talkTo(bot, 'fq_rail_miner');
  assert.equal(itemCount(c, 'fq_gold_ticket'), 1, '1回だけ');
});

test('鉱山トロッコの線路: 鉄道員の系統が いないと 線路を直せない（調べるのは だれでも）', async () => {
  const { bot, c } = await setup(397, { job: 'priest' });
  await talkTo(bot, 'fq_rail_miner', [0]);
  const msgs = await talkTo(bot, 'fq_rail_broken1', [0]);
  assert.ok(said(msgs, /線路がこわれている/) && said(msgs, /鉄道員の人が、パーティーに/) && !c.flags[RAIL_FIX[0]]);
  c.job = 'keikyu_driver';
  await talkTo(bot, 'fq_rail_broken1', [0]);
  assert.ok(c.flags[RAIL_FIX[0]]);
});

// ───── ごほうび ─────
test('ごほうび: ★5の アクセサリー（ランク10・店で買えない）・たのまれごとでしか もらえない乗り物（乗り物屋に「もらった物」として出る・買えない・乗れる）', () => {
  assert.equal(Object.keys(FAMILY_GIFTS).length, 5);
  for (const [id, it] of Object.entries(FAMILY_GIFTS)) {
    assert.equal(ITEMS[id], it);
    assert.equal(it.type, 'acc');
    assert.equal(starsFor(it), 5, `${id} は ★5`);
    assert.ok(!(it.price > 0) && it.sell > 0, `${id} は 店で 買えない`);
    assert.ok(it.desc && it.name);
  }
  assert.equal(Object.keys(FAMILY_VEHICLES).length, 5);
  const rich = { job: 'setsubiya', jobs: { setsubiya: {}, railman: {}, cook: {}, police: {}, salaryman: {} }, gold: 1e6 };
  for (const id of Object.keys(FAMILY_VEHICLES)) {
    assert.equal(VEHICLES[id], FAMILY_VEHICLES[id], `${id} は 乗り物に まざる`);
    assert.ok(VEHICLES[id].gift);
    assert.ok(!vehicleShelf(rich).includes(id), `${id} は 店に ならばない`);
    assert.equal(buyVehicle(rich, id).ok, false, `${id} は 買えない`);
    const own = { job: 'warrior', jobs: { warrior: {} }, vehicles: [id], gold: 0 };
    assert.ok(vehicleShelf(own).includes(id) && ownedVehicles(own).includes(id), `${id} は もらったら 一らんに 出る`);
    assert.equal(chooseVehicle(own, id).ok, true);
    // 絵（4方向 × コマ）
    assert.ok(VEHICLE_ART[id], `${id} の 絵`);
    for (const view of VIEWS) assert.ok(['back', 'front'].some((l) => paintVehicle(id, view, 0, l).px.some((v) => v)), `${id} ${view}`);
  }
  assert.equal(rich.gold, 1e6);
});

test('クエストの画面・地図のしるし・「はなす」のヒント', () => {
  const c = { flags: { c5_clear: true, [FQ.acStart]: true }, items: [], keyItems: [] };
  const e = q(c, '劇場の空調をなおせ');
  assert.ok(e && e.who === 'fq_th_manager' && e.find === 'fq_th_vent_a' && /設備屋/.test(e.hint));
  // サファラの 町では 劇場の 入り口に しるし（中の 人への 道しるべ）
  const marks = questMarks(c, 'south', '');
  assert.ok(marks.some((m) => m.label === '劇場の空調をなおせ' && m.via && THEATER_DOOR.some((d) => d.x === m.x && d.y === m.y)), '劇場の 入り口');
  assert.ok(questMarks(c, 'fq_th_hall', '').some((m) => m.label === '劇場の空調をなおせ' && !m.via), '客席の ふき出し口');
  assert.match(sideQuestHint(c), /劇場の空調をなおせ/);
  // ぜんぶ 受けると 5つ ならぶ
  const all = { flags: { c5_clear: true, [FQ.acStart]: true, [FQ.shopStart]: true, [FQ.cookStart]: true, [FQ.bellStart]: true, [FQ.railStart]: true }, items: [], keyItems: [] };
  assert.equal(subQuests(all).filter((x) => FAMILY_QUESTS.some((f) => f.name === x.name)).length, 5);
  for (const x of subQuests(all)) assert.ok(npcAnywhere(x.who), `${x.name}: ${x.who}`);
  for (const x of subQuests(all)) if (x.find) assert.ok(npcAnywhere(x.find), `${x.name}: ${x.find}`);
});

// ───── 戦いの 強さ ─────
test('戦い: 第1部クリアのころ（Lv55〜58）の 4人なら 完全オートでも 勝てる（ボスほど強くない）', () => {
  for (const id of ['fq_dust', 'fq_mole']) {
    const e = FIXED_ENCOUNTERS[id];
    assert.ok(e && !e.boss, id);
    for (const [sp] of e.group) assert.ok(MONSTER_ART[sp], `${sp} の 絵`);
    let win = 0;
    for (let i = 0; i < 6; i++) {
      const lv = 55 + (i % 4);
      const party = [makeChar('warrior', lv, 10, 'せんし', 52), makeChar('priest', lv, 10, 'そうりょ', 52), makeChar('mage', lv, 10, 'まほう', 52), makeChar('monk', lv, 10, 'ぶとう', 52)];
      const r = runBattle(party, e.group.flatMap(([sp, n]) => Array(n).fill(sp)), { seed: 39 + i * 7919, enemyLv: e.enemyLv });
      if (r.outcome === 'win') win++;
    }
    assert.equal(win, 6, `${id} 勝ち ${win}/6`);
  }
});

// ───── 絵 ─────
test('絵: 劇場の設備（ふき出し口・メーター・空調機・室外機・ダンパー・かんしばん）・かねの台・カラス・こわれた線路と 人の みため', () => {
  const props = new Set();
  for (const m of Object.values(MAPS)) for (const n of m.npcs) if (n.id.startsWith('fq_')) {
    if (n.sprite.startsWith('mon:')) props.add(n.sprite.slice(4));
    else if (n.sprite.startsWith('fq_')) assert.ok(FAMILY_NPC_LOOKS[n.sprite], `${n.id}: ${n.sprite}`);
  }
  for (const id of ['fq_vent', 'fq_meter', 'fq_ahu', 'fq_unit', 'fq_unit_on', 'fq_damper', 'fq_damper_open', 'fq_panel', 'fq_bell_stand', 'fq_crow', 'fq_rail_broken']) assert.ok(props.has(id), id);
  for (const id of props) {
    const d = MONSTER_ART[id];
    assert.ok(d, `${id} の 絵`);
    assert.ok(Array.isArray(d.pal) && d.pal.every((c) => /^#[0-9a-f]{6}$/i.test(c)) && new Set(d.pal).size === d.pal.length, `${id}: pal`);
    // かく どうぐの まね（使った 色は パレットの 中・2つの コマで かく）
    for (const f of [0, 1]) {
      const used = [];
      const g = { w: d.size[0], h: d.size[1], ell: (...a) => used.push(a[4]), poly: (p, c) => used.push(c), rect: (...a) => used.push(a[4]), line: (p, c) => used.push(c), eye() {}, dot: (x, y, c) => used.push(c) };
      d.draw(g, f);
      assert.ok(used.length >= 3, `${id}: かいていない`);
      for (const c of used) assert.ok(d.pal.includes(c) || c === '#ffffff', `${id}: ${c} が パレットに ない`);
    }
  }
});

// ───── 文字 ─────
test('文字: 新しい ゲームの 文字は 小学校で習う漢字だけ・スペースなし・ひらがなのまま も なし（kanji-check の gameFiles に入っている）', () => {
  const mine = ['data/sidequests-family.js', 'maps/family-quests.js', 'data/items-family.js', 'data/vehicles-family.js', 'data/encounters-family.js', 'render/family-art.js'];
  const files = gameFiles().filter((f) => mine.some((m) => f.endsWith(m)));
  assert.equal(files.length, mine.length);
  const bad = [];
  for (const f of files) for (const p of checkFile(f)) bad.push(`${f.split('/').pop()}:${p.line} [${p.kind} ${p.detail}] ${p.text}`);
  assert.deepEqual(bad, []);
});

// ───── ルミナの町の たのまれごとの 掲示板 ─────
test('掲示板: ルミナの町の広場に いつも 立つ・はり紙に 中み・職業・会う人・ごほうび', async () => {
  const hit = npcAnywhere('fq_board');
  assert.ok(hit && hit.map === 'overworld', 'ルミナの町（フィールドの中の町）');
  assert.ok(condOk(hit.n.show, () => false), '第1部クリアの前から 立っている（はり紙は まだ ない）');
  assert.ok(MONSTER_ART.fq_board, '掲示板の絵');
  // ごほうびの 一らんは 本当の ごほうびと 同じ
  const src = (await import('node:fs')).readFileSync(new URL('../public/js/shared/data/sidequests-family.js', import.meta.url), 'utf8');
  for (const qd of FAMILY_QUESTS) {
    assert.ok(ITEMS[qd.reward.item] && FAMILY_VEHICLES[qd.reward.vehicle], qd.id);
    assert.ok(src.includes(`['item', '${qd.reward.item}', 1]`) && src.includes(`vehicleSteps('${qd.reward.vehicle}')`), `${qd.id} の ごほうび`);
    assert.ok(src.includes(`['gold', ${qd.reward.gold}]`), `${qd.id} の ゴールド`);
    assert.ok(npcAnywhere({ theater: 'fq_th_manager', shop: 'fq_shop_owner', cook: 'fq_cook_host', bell: 'fq_bell_sister', rail: 'fq_rail_miner' }[qd.id]), `${qd.id} の 会う人`);
  }
  const { bot, c } = await setup(391);
  // 1まい目（劇場）を 読んで、一らんに もどって、やめる
  const msgs = await talkTo(bot, 'fq_board', [0, 5]);
  assert.ok(said(msgs, /お仕事いらい板/));
  assert.ok(said(msgs, /まだすんでいないたのまれごと：5つ/));
  assert.ok(said(msgs, /劇場が暑くて/));
  assert.ok(said(msgs, /設備屋・ryonetsu[・\n]天才しせつ管理者/), '系統の 職業 ぜんぶ');
  assert.ok(said(msgs, /サファラ劇場の中にいる、支配人ラシードに話しかけよう/));
  assert.ok(said(msgs, /空調名人のバッジ（アクセサリー）\n高所作業車（乗り物）\n5000ゴールド・小さなメダル3まい/));
  const choices = msgs.filter((m) => m.t === 'script' && m.steps.at(-1)?.[0] === 'choice');
  assert.equal(choices.length, 2, '読んだら 一らんに もどる');
  assert.equal(choices[0].steps.at(-1)[2].length, 6, '5まい＋やめる');
  assert.ok(!bot.s.busy);
  // 受けている・すんだ の しるし
  c.flags[FQ.acStart] = true;
  c.flags[FQ.railDone] = true;
  const msgs2 = await talkTo(bot, 'fq_board', [5]);
  const labels = msgs2.find((m) => m.t === 'script' && m.steps.at(-1)?.[0] === 'choice').steps.at(-1)[2];
  assert.equal(labels[0], '劇場の空調をなおせ（受けている）');
  assert.equal(labels[4], '鉱山トロッコの線路（すんだ）');
  assert.ok(said(msgs2, /まだすんでいないたのまれごと：4つ/));
});
test('掲示板: 職業の 系統が 長くても 1行20文字・1ページ2行まで（はみ出さない）', () => {
  for (const qd of FAMILY_QUESTS) {
    const pages = boardPage({ flag: () => false }, qd).map((st) => st[2]).filter((t) => t.startsWith('【解決できそうな職業】'));
    assert.ok(pages.length >= 1, qd.id);
    const names = pages.flatMap((t) => t.split('\n').slice(1)).join('・').split('・');
    assert.deepEqual(names.sort(), jobLineNames(qd.roots).sort(), `${qd.id}: 系統の 職業が ぜんぶ のる`);
    for (const t of pages) {
      const body = t.split('\n').slice(1);
      assert.ok(body.length <= 2, `${qd.id}: ${t}`);
      for (const l of body) assert.ok(l.length <= 20 || !l.includes('・'), `${qd.id}: ${l}`);
    }
  }
});

test('掲示板: 第1部クリアの前に 読むと「まだ はり紙が ない」（はり紙の 一らんは 出ない）', async () => {
  const { bot } = await setup(392, { flags: ['c4_clear', 'c3_clear', 'c2_clear', 'c1_clear'] });
  const msgs = await talkTo(bot, 'fq_board');
  assert.ok(said(msgs, /まだ、はり紙は1まいもはられていない/));
  assert.ok(said(msgs, /第1部をクリアしたら/));
  assert.ok(!msgs.some((m) => m.t === 'script' && m.steps.some((st) => st[0] === 'choice')), '一らんは 出ない');
});
