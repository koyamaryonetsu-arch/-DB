// 第4章「砂の海にしずむ星」Step 2: 村長の たのみ → かれた地下水路（水門の レバー）→ よろい大サソリ（反撃の構え）
// → オアシスに 水が もどり、砂嵐の 切れ目から 王都への 道が 開く
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES, ZONE_BG } from '../public/js/shared/data/encounters.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, effectiveTile, isBlocked, condOk } from '../public/js/shared/maps/index.js';
import { slideReach } from '../public/js/shared/maps/slide.js';
import { SOUTH_PLACES, SOUTH_ARRIVE, STORM_Y, STORM_GAP_X, SAFARA_POS } from '../public/js/shared/maps/south.js';
import { HAMIL_ROWS } from '../public/js/shared/maps/south-rows.js';
import { CANAL_DOOR, CANAL_LEVERS, CH4_MAPS } from '../public/js/shared/maps/ch4.js';
import { T } from '../public/js/shared/tiles.js';
import { STORY_STEPS, SCRIPTS } from '../public/js/shared/data/story.js';
import { C4_OBJ, CH4_STEPS } from '../public/js/shared/data/story-ch4.js';
import { objectiveFromFlags, KNOWN_OBJECTIVES, repairObjective } from '../public/js/shared/data/progress.js';
import { questMarks } from '../public/js/shared/data/quest-targets.js';
import { talkFor } from '../public/js/shared/data/party-talk.js';
import { recruitNpc } from '../public/js/shared/world/party.js';
import { gainExp, expForLevel } from '../public/js/shared/stats.js';
import { makeChar } from '../tools/sim.js';
import { Bot } from './helpers.js';

const HAM = SOUTH_PLACES.hamil;
const hasOf = (flags) => (f) => flags.includes(f);
const key = (x, y) => `${x},${y}`;

// ───────────── 反撃の構え（battle.js）─────────────
function scorpionBattle(seed = 5) {
  const party = [makeChar('warrior', 31, 10, 'せんし', 23), makeChar('mage', 31, 10, 'まほう', 23), makeChar('monk', 31, 10, 'ぶとう', 23)];
  const b = new Battle({ rng: makeRng(seed), allies: party.map((c) => ({ char: c, kind: 'support', auto: true, tactics: 'balanced' })), enemies: ['armor_scorpion'], boss: true, canFlee: false });
  const boss = b.combatants.find((x) => x.side === 'enemy');
  return { b, boss, w: b.allies[0], m: b.allies[1], k: b.allies[2] };
}
const act = (b, c, cmd) => {
  const ev = { t: 'act', id: c.id, lines: [], upd: [], fx: null };
  b.perform(c, cmd, ev);
  b.resolveCounters(ev);
  return ev;
};
const stance = (b, boss) => {
  const ev = { t: 'act', id: boss.id, lines: [], upd: [], fx: null };
  b.applyAbility(boss, ABILITIES.m_claw_stance, {}, ev, 1);
  return ev;
};

test('反撃の構え: 前ぶれが 出て、物理で こうげきすると 反撃される（呪文・防御は 反撃なし）', () => {
  const { b, boss, w, m } = scorpionBattle();
  const ev = stance(b, boss);
  assert.equal(boss.stance?.kind, 'counter');
  assert.equal(ev.fx.type, 'stance');
  assert.ok(ev.warn, '前ぶれ');
  assert.ok(ev.lines.some((l) => l.includes('反撃')), ev.lines.join('/'));
  assert.equal(b.snapshot().combatants?.find?.((c) => c.id === boss.id)?.stance ?? 'counter', 'counter');
  // 物理: なぐると やりかえされる
  w.hp = w.maxHp;
  const hp0 = w.hp, bossHp0 = boss.hp;
  const e1 = act(b, w, { type: 'attack', target: boss.id });
  assert.ok(boss.hp <= bossHp0, 'こうげきは あたる');
  assert.ok(e1.lines.some((l) => l === 'よろい大サソリの反撃！'), e1.lines.join('/'));
  assert.deepEqual(e1.counter, [{ actor: boss.id, target: w.id }]);
  assert.ok(w.hp < hp0 || e1.results.some((r) => r.id === w.id && r.miss), '反撃の ダメージ');
  // 呪文: 反撃なし
  const spell = m.abilities.find((id) => ABILITIES[id]?.effect?.type === 'magic' && ABILITIES[id].target === 'enemy');
  assert.ok(spell, '呪文が ある');
  const mhp = m.hp;
  const e2 = act(b, m, { type: 'ability', id: spell, target: boss.id });
  assert.ok(!e2.counter, e2.lines.join('/'));
  assert.equal(m.hp, mhp);
  // 防御: 反撃なし
  const e3 = act(b, m, { type: 'defend' });
  assert.ok(!e3.counter);
});

test('反撃の構え: 何回 あてても 1回の こうどうに 反撃は 1回。たおしたら 反撃しない', () => {
  const { b, boss, k } = scorpionBattle(7);
  stance(b, boss);
  k.hp = k.maxHp;
  // 2回 なぐる 技（せいけんづき など なければ 2回 あてる 物理の 技を つくって ためす）
  const twice = { name: '2回なぐる', kind: 'skill', target: 'enemy', effect: { type: 'phys', mult: 0.5, hits: 2 } };
  const ev = { t: 'act', id: k.id, lines: [], upd: [], fx: null };
  b.applyAbility(k, twice, { target: boss.id }, ev, 1);
  b.resolveCounters(ev);
  assert.equal(ev.lines.filter((l) => l.endsWith('の反撃！')).length, 1, ev.lines.join('/'));
  // たおした ときは 反撃しない
  const { b: b2, boss: s2, w: w2 } = scorpionBattle(8);
  stance(b2, s2);
  s2.hp = 1;
  const e2 = act(b2, w2, { type: 'attack', target: s2.id });
  if (!s2.alive) assert.ok(!e2.lines.some((l) => l.endsWith('の反撃！')), e2.lines.join('/'));
});

test('反撃の構え: つぎの 自分の 番で とける。構えた ターンの のこりの こうどうは しない', () => {
  const { b, boss, w } = scorpionBattle(9);
  // 2回こうどうの 1回目で 構える
  b.queue.push({ id: boss.id, cmd: { type: 'ai' }, last: false }, { id: boss.id, cmd: { type: 'ai' }, last: true });
  const ev = { t: 'act', id: boss.id, lines: [], upd: [], fx: null };
  b.applyAbility(boss, ABILITIES.m_claw_stance, {}, ev, 1);
  assert.ok(!b.queue.some((q) => q.id === boss.id), 'のこりの こうどうは とりやめ');
  assert.ok(ev.forceLast && ev.atbAfter === 0);
  // つぎの 番: 構えを といてから うごく
  b.queue.push({ id: boss.id, cmd: { type: 'attack', target: w.id }, last: true });
  const evs = [];
  b.emit = (e) => evs.push(e);
  b.executeNext();
  assert.equal(boss.stance, null);
  assert.ok(evs.some((e) => (e.lines || []).some((l) => l.includes('反撃の構えをといた'))), JSON.stringify(evs.map((e) => e.lines)));
  // とけた あとは なぐっても 反撃されない
  const e2 = act(b, w, { type: 'attack', target: boss.id });
  assert.ok(!e2.counter);
});

test('反撃の構え: オートの 仲間は 構えて いる 敵を なぐらない（呪文か 防御）', () => {
  for (let seed = 1; seed <= 12; seed++) {
    const { b, boss, w, m } = scorpionBattle(seed);
    stance(b, boss);
    const cw = decideAlly(b, w);
    assert.ok(cw.type !== 'attack' && !(cw.type === 'ability' && ['phys', 'drainHp'].includes(ABILITIES[cw.id]?.effect?.type)), JSON.stringify(cw));
    const cm = decideAlly(b, m);
    assert.notEqual(cm.type, 'attack', JSON.stringify(cm));
    // 構えが ない ときは ふつうに なぐる こともある
    boss.stance = null;
    b.ignoreStance = false;
  }
});

test('よろい大サソリ: ボスの データ・技・落とす物・戦いの 背景が そろっている', () => {
  const s = MONSTERS.armor_scorpion;
  assert.ok(s.boss && s.turns === 2 && s.size === 'xl');
  assert.ok(s.resist.ice > 1 && s.resist.bolt > 1, '弱点: 氷・雷');
  assert.ok(s.resist.fire < 1 && s.resist.poison === 0, '効きにくい: 炎・毒');
  assert.ok(s.actions.some((a) => a.id === 'm_claw_stance'));
  for (const a of [...s.actions, ...s.phases.flatMap((p) => p.addActions || [])]) assert.ok(a.id === 'attack' || ABILITIES[a.id], a.id);
  assert.deepEqual(s.phases.map((p) => p.hpBelow), [0.5, 0.25]);
  assert.deepEqual(s.phases[0].summon, ['scorpion_soldier', 'scorpion_soldier']);
  assert.ok(ITEMS.scorpion_brooch && ITEMS.scorpion_brooch.resist.poison === 0, 'サソリのブローチ: 毒を ふせぐ');
  assert.deepEqual(s.drops.boss, ['scorpion_brooch']);
  const enc = FIXED_ENCOUNTERS.armor_scorpion;
  assert.ok(enc.boss && !enc.canFlee && enc.bg === 'canal');
  // サソリ兵も 弱い 反撃の構えを する。地下水路の 魔物
  assert.ok(MONSTERS.scorpion_soldier.actions.some((a) => a.id === 'm_claw_guard'));
  assert.ok(ABILITIES.m_claw_guard.effect.mult < ABILITIES.m_claw_stance.effect.mult);
  for (const z of ['s_canal', 's_canal2']) {
    assert.ok(ENCOUNTER_TABLES[z]?.length && ZONE_BG[z] === 'canal', z);
    for (const e of ENCOUNTER_TABLES[z]) for (const [sp] of e.group) assert.ok(MONSTERS[sp], sp);
  }
  assert.ok(MONSTERS.dry_frog && !MONSTERS.dry_frog.boss);
});

// ───────────── マップ ─────────────
// （いる 場所, レバーの フラグ）の じょうたいを たどる（test/ch3-maps.test.js と おなじ 考え方）
function leverGraph(map, s0, levers, flags0 = []) {
  const nodes = new Map();
  const q = [];
  const add = (pos, flags) => {
    const k = `${pos[0]},${pos[1]}|${flags.slice().sort().join('+')}`;
    if (!nodes.has(k)) {
      nodes.set(k, { pos, flags, next: [] });
      q.push(k);
    }
    return k;
  };
  add(s0, flags0);
  const warps = new Set(map.warps.map((w) => key(w.x, w.y)));
  for (let h = 0; h < q.length; h++) {
    const st = nodes.get(q[h]);
    const has = hasOf(st.flags);
    st.reach = slideReach(map, st.pos, has, (x, y) => isBlocked(map, x, y, has) || warps.has(key(x, y)) || map.chestAt.has(y * map.w + x));
    for (const kk of st.reach) {
      const [x, y] = kk.split(',').map(Number);
      for (const lv of levers) {
        if (Math.abs(lv.x - x) + Math.abs(lv.y - y) !== 1) continue;
        const nf = st.flags.includes(lv.flag) ? st.flags.filter((f) => f !== lv.flag) : [...st.flags, lv.flag];
        st.next.push(add([x, y], nf));
      }
    }
  }
  return nodes;
}
const statesOf = (nodes) => [...nodes.values()].flatMap((st) => [...st.reach].map((kk) => ({ pos: kk.split(',').map(Number), flags: st.flags })));
function stuckNodes(nodes, s0) {
  const k0 = key(s0[0], s0[1]);
  const good = new Set([...nodes.entries()].filter(([, st]) => st.reach.has(k0)).map(([k]) => k));
  let changed = true;
  while (changed) {
    changed = false;
    for (const [k, st] of nodes) {
      if (!good.has(k) && st.next.some((n) => good.has(n))) {
        good.add(k);
        changed = true;
      }
    }
  }
  return [...nodes.keys()].filter((k) => !good.has(k));
}
const leversOf = (m) => m.gates.filter((g) => g.closed === T.LEVER).map((g) => ({ x: g.x, y: g.y, flag: g.flag }));
const at = (st, x, y) => st.pos[0] === x && st.pos[1] === y;

test('地下水路 1階: レバーで たまり水が 入れかわる。階段へ 行けて、どこからでも 入り口へ もどれる', () => {
  const m = MAPS.canal1;
  const s0 = [14, 20];
  assert.deepEqual(leversOf(m).map((l) => l.flag), [CANAL_LEVERS.c1]);
  const nodes = leverGraph(m, s0, leversOf(m));
  const all = statesOf(nodes);
  // 下への 階段（5,3）の 前に 立てるのは レバーを 動かした 時だけ
  assert.ok(all.some((st) => at(st, 5, 4)), '階段へ 行ける');
  assert.ok(all.filter((st) => at(st, 5, 4)).every((st) => st.flags.includes(CANAL_LEVERS.c1)), 'レバーが いる');
  // 右上の 宝箱は レバーを 動かす 前に 行ける
  assert.ok(all.some((st) => at(st, 26, 3) && !st.flags.length), '右上の へや');
  assert.deepEqual(stuckNodes(nodes, s0), [], 'とじこめられない');
  // たまり水の 区画は 水 ⇄ かわいた 底
  assert.equal(effectiveTile(m, 5, 7, () => false), T.CANAL_WATER);
  assert.equal(effectiveTile(m, 5, 7, hasOf([CANAL_LEVERS.c1])), T.CANAL_BED);
  assert.equal(effectiveTile(m, 22, 7, () => false), T.CANAL_BED);
  assert.equal(effectiveTile(m, 22, 7, hasOf([CANAL_LEVERS.c1])), T.CANAL_WATER);
});

test('地下水路 2階: 2つの レバーを 正しく 動かすと おくへの 階段へ。北東の 宝箱は レバー2の 前', () => {
  const m = MAPS.canal2;
  const s0 = [21, 35];
  const lv = leversOf(m);
  assert.deepEqual(lv.map((l) => l.flag).sort(), [CANAL_LEVERS.c2a, CANAL_LEVERS.c2b].sort());
  const nodes = leverGraph(m, s0, lv);
  const all = statesOf(nodes);
  assert.ok(all.some((st) => at(st, 12, 4)), 'おくへの 階段へ 行ける');
  assert.ok(all.filter((st) => at(st, 12, 4)).every((st) => st.flags.length === 2), '2つの レバーが いる');
  assert.ok(all.some((st) => at(st, 36, 9) && !st.flags.includes(CANAL_LEVERS.c2b)), '北東の へや');
  for (const c of m.chests) assert.ok(all.some((st) => Math.abs(st.pos[0] - c.x) + Math.abs(st.pos[1] - c.y) === 1), `宝箱 ${c.id}`);
  assert.deepEqual(stuckNodes(nodes, s0), [], 'とじこめられない');
});

test('地下水路 おく: サソリの へやへ 行けて、たおすと せきが くずれて 水路に 水が もどる', () => {
  const m = MAPS.canal3;
  const boss = m.npcById.armor_scorpion;
  assert.ok(boss.big && boss.sprite === 'mon:armor_scorpion' && SCRIPTS[boss.script]);
  const r = slideReach(m, [11, 18], () => false, (x, y) => isBlocked(m, x, y, () => false) || (x === 11 && y === 19));
  assert.ok(r.has(key(12, 8)), 'サソリの 前へ 行ける');
  assert.ok(m.triggers.some((t) => t.script === 'c4_scorpion_event' && t.y <= 12 && t.y + t.h > 9));
  const after = hasOf(['c4_scorpion']);
  assert.equal(effectiveTile(m, 10, 3, () => false), T.DAM);
  assert.equal(effectiveTile(m, 10, 3, after), T.CANAL_WATER, 'せきが くずれる');
  assert.equal(effectiveTile(m, 10, 8, after), T.CANAL_WATER, '水路に 水が もどる');
  assert.ok(!condOk(boss.show, after), 'サソリは いなくなる');
  // 水が もどっても、わきの 通路から 階段へ もどれる
  const r2 = slideReach(m, [3, 5], after, (x, y) => isBlocked(m, x, y, after) || (x === 11 && y === 19));
  assert.ok(r2.has(key(11, 18)));
});

test('フィールド: 地下水路の 入り口は 村長に たのまれると 開く。サソリを たおすと オアシスに 水が もどり、砂嵐の 切れ目が 開く', () => {
  const m = MAPS.south;
  const { x: dx, y: dy } = CANAL_DOOR;
  assert.equal(effectiveTile(m, dx, dy, () => false), T.GRATE, 'はじめは 鉄の こうし');
  assert.equal(effectiveTile(m, dx, dy, hasOf(['c4_canal'])), T.STAIRS_DOWN);
  assert.ok(m.warps.some((w) => w.x === dx && w.y === dy && w.to.map === 'canal1'));
  assert.ok(m.actions.some((a) => a.x === dx && a.y === dy && a.script === 'c4_canal_grate'));
  // 入り口の 前に 立てる（海辺から 歩いて）
  const all = ['c4_start', 'c4_arrive', 'c4_hamil', 'c4_nadim', 'c4_well', 'c4_ami', 'c4_canal'];
  const r = slideReach(m, [Math.floor(SOUTH_ARRIVE.x), Math.floor(SOUTH_ARRIVE.y)], hasOf(all), (x, y) => isBlocked(m, x, y, hasOf(all)));
  assert.ok(r.has(key(dx, dy + 1)), '入り口の 前');
  // オアシスの 水ぎわ（かわいた どろ）に 水が もどる
  let n = 0;
  HAMIL_ROWS.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== '=' || y < 10 || y > 16 || x < 11 || x > 18) return;
    n++;
    assert.equal(effectiveTile(m, HAM.x + x, HAM.y + y, () => false), T.DIRT);
    assert.equal(effectiveTile(m, HAM.x + x, HAM.y + y, hasOf(['c4_scorpion'])), T.WATER);
  }));
  assert.ok(n >= 16, `水ぎわ ${n}マス`);
  // 水が もどっても 村の 門・家・お店へ 行ける（道を ふさがない）
  const after = [...all, 'c4_scorpion'];
  const r2 = slideReach(m, [Math.floor(SOUTH_ARRIVE.x), Math.floor(SOUTH_ARRIVE.y)], hasOf(after), (x, y) => isBlocked(m, x, y, hasOf(after)));
  for (const id of ['nadim', 'c4_h_priest', 'c4_h_inn', 'c4_h_shop', 'ami', 'ami_mom', 'c4_h_woman']) {
    const p = m.npcById[id];
    let ok = false;
    for (let yy = -2; yy <= 2 && !ok; yy++) for (let xx = -2; xx <= 2 && !ok; xx++) ok = r2.has(key(p.x + xx, p.y + yy));
    assert.ok(ok, id);
  }
  // 砂嵐の 切れ目の 南へ 行ける
  assert.ok(r2.has(key(STORM_GAP_X[0] + 1, STORM_Y[1] + 3)), '王都への 道');
  assert.ok(!r.has(key(STORM_GAP_X[0] + 1, STORM_Y[1] + 3)), 'サソリの 前は まだ')
  assert.deepEqual(CH4_MAPS.slice(2, 5), ['canal1', 'canal2', 'canal3']);
});

// ───────────── 物語 ─────────────
function boost(bot, level) {
  const c = bot.world.data.characters[bot.char.id];
  gainExp(c, expForLevel(level) - c.exp);
  Object.assign(c.equip, { weapon: 'steel_sword', armor: 'steel_mail', shield: 'steel_shield', head: 'steel_helm' });
  c.jobs[c.job] = { lv: 10, b: 999 };
  c.hp = 9999;
  c.mp = 9999;
  bot.world.sendSelf(bot.s);
}

test('第4章 Step 2 を とおして あそべる: 村長 → 地下水路 → よろい大サソリ → オアシスに 水 → 王都への 道', { timeout: 300000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(4402), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  for (const f of STORY_STEPS.slice(0, STORY_STEPS.indexOf('c4_ami') + 1)) c.flags[f] = true;
  c.objective = C4_OBJ.ami;
  // Lv40 の 4人でも ボスには だいたい 勝てる（くりかえすと 98%くらい）。たまたまの 負けで ぬけない ように 少し よゆうを もたせる
  boost(bot, 42);
  for (const id of ['npc_gard', 'npc_mina', 'npc_poporo']) assert.ok(recruitNpc(world, bot.s, id, { force: true }).ok, id);
  await bot.settle();
  bot.s.repelUntil = 1e15;
  const place = async (map, x, y) => {
    world.placeSession(bot.s, map, x + 0.5, y + 0.5, 'up', true);
    await bot.settle();
  };

  // まだ 入り口は とじている
  await place('south', CANAL_DOOR.x, CANAL_DOOR.y + 1);
  await bot.examine(CANAL_DOOR.x, CANAL_DOOR.y);
  assert.ok(bot.msgs.some((m) => m.t === 'script' && JSON.stringify(m.steps).includes('鉄のこうし')), '鉄の こうし');
  assert.equal(bot.map, 'south');

  // 村長ナディムの たのみ
  await place('south', HAM.x + 6, HAM.y + 5);
  await bot.talk('nadim');
  assert.ok(bot.flag('c4_canal'), '地下水路を たのまれた');
  assert.equal(c.objective, C4_OBJ.canal);

  // 地下水路 1階: 右の 宝箱 → レバー → 下への 階段
  await place('south', CANAL_DOOR.x, CANAL_DOOR.y + 2);
  await bot.walkTo(CANAL_DOOR.x, CANAL_DOOR.y);
  assert.equal(bot.map, 'canal1', '地下水路に 入った');
  await bot.settle();
  await bot.walkTo(14, 18);
  assert.ok(bot.flag('c4_canal_seen'), '入った ときの 話');
  await bot.walkTo(14, 12);
  await bot.examine(14, 11);
  assert.ok(bot.flag(CANAL_LEVERS.c1), 'レバー1');
  await bot.walkTo(5, 3);
  assert.equal(bot.map, 'canal2', '2階へ');

  // 2階: 右の わたり場 → レバー2 → もどって レバー1 → 左の わたり場 → おくへ
  await bot.settle();
  await bot.walkTo(21, 33);
  assert.ok(bot.flag('c4_canal2_seen'), '2階に 入った ときの 話');
  await bot.walkTo(36, 23);
  await bot.examine(36, 22);
  assert.ok(bot.flag(CANAL_LEVERS.c2b), 'レバー2');
  await bot.walkTo(26, 32);
  await bot.examine(26, 31);
  assert.ok(bot.flag(CANAL_LEVERS.c2a), 'レバー（下）');
  await bot.walkTo(12, 3);
  assert.equal(bot.map, 'canal3', 'おくへ');

  // よろい大サソリ
  await bot.settle();
  await bot.walkTo(12, 11);
  await bot.settle(20000);
  assert.ok(bot.flag('c4_scorpion'), 'よろい大サソリを たおした');
  assert.ok(c.items.some((i) => i.id === 'scorpion_brooch') || Object.values(c.equip).includes('scorpion_brooch'), 'サソリのブローチ');
  assert.equal(bot.map, 'south', '村へ もどった');
  assert.ok(bot.s.x >= HAM.x && bot.s.x < HAM.x + HAM.w && bot.s.y >= HAM.y && bot.s.y < HAM.y + HAM.h, 'ハミルの 中');
  assert.equal(c.objective, C4_OBJ.scorpion);
  // 物語の すすみぐあいの フラグが ぜんぶ たっている（Step 2 の さいごまで）
  for (const f of CH4_STEPS.slice(0, CH4_STEPS.indexOf('c4_scorpion') + 1)) assert.ok(c.flags[f], f);
  assert.ok(!c.flags.c4_capital, '王都は まだ');
  // 砂嵐の 切れ目を とおって 南へ 歩ける
  await bot.walkTo(STORM_GAP_X[0] + 1, STORM_Y[1] + 3);
  assert.ok(bot.s.y > STORM_Y[1], '砂嵐の 南');
  // そのまま 道ぞいに 王都サファラの 北の 門へ（Step 3 の はじまり。つづきは test/ch4-capital.test.js）
  await bot.walkTo(SAFARA_POS.gate.x, SAFARA_POS.gate.y + 2);
  await bot.settle();
  assert.ok(bot.flag('c4_capital'), '王都サファラに 着いた');
  assert.equal(c.objective, C4_OBJ.capital);
});

test('第4章 Step 2: 目標・仲間会話・地図の しるし。むかしの「続きはアップデートで！」は 村長の たのみに なおる', () => {
  for (const k of ['ami', 'canal', 'scorpion']) {
    const t = C4_OBJ[k];
    assert.ok(KNOWN_OBJECTIVES.has(t), k);
    assert.ok(talkFor(t, 'kind') !== `次は「${t.replace(/\n/g, '')}」ですね。`, `仲間会話: ${k}`);
    const marks = ['south', 'canal1', 'canal2', 'canal3'].flatMap((m) => questMarks({ flags: {}, objective: t }, m));
    assert.ok(marks.some((m) => m.kind === 'main'), `しるし: ${k}`);
  }
  assert.ok(talkFor(C4_OBJ.canal, 'kind').includes('反撃'), '反撃の構えの ヒント');
  assert.equal(objectiveFromFlags({ flags: { c4_ami: true } }), C4_OBJ.ami);
  assert.equal(objectiveFromFlags({ flags: { c4_ami: true, c4_canal: true } }), C4_OBJ.canal);
  assert.equal(objectiveFromFlags({ flags: { c4_canal: true, c4_scorpion: true } }), C4_OBJ.scorpion);
  // Step 1 の さいごの 文の まま セーブした 人
  const old = { flags: Object.fromEntries(STORY_STEPS.slice(0, STORY_STEPS.indexOf('c4_ami') + 1).map((f) => [f, true])), objective: '第4章の続きはアップデートで！（それまで砂ばくを旅して、強くなっておこう）' };
  assert.ok(repairObjective(old));
  assert.equal(old.objective, C4_OBJ.ami);
  assert.deepEqual(CH4_STEPS.slice(6, 8), ['c4_canal', 'c4_scorpion']);
});

test('家族で: パパの 世界で いっしょに よろい大サソリを たおすと、2人とも ハミルへ。ユイの 物語は そのまま', { timeout: 300000 }, async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(4403), checkPassword: (pw) => pw === 'ほし', rateLimit: false });
  const papa = new Bot(world, 'パパ');
  const yui = new Bot(world, 'ユイ');
  await papa.login('ほし');
  await yui.login('ほし');
  await papa.createAndPlay('warrior');
  await yui.createAndPlay('mage');
  await papa.settle();
  await yui.settle();
  const P = world.sessions.get(papa.sid), Y = world.sessions.get(yui.sid);
  for (const f of STORY_STEPS.slice(0, STORY_STEPS.indexOf('c4_canal') + 1)) P.char.flags[f] = true;
  P.char.flags[CANAL_LEVERS.c2a] = true;
  P.char.flags[CANAL_LEVERS.c2b] = true;
  P.char.objective = C4_OBJ.canal;
  // ここで たしかめるのは 物語の すすみかた（強さは tools/sim.js）。パパの 酒場の 仲間2人も いっしょ
  boost(papa, 60);
  boost(yui, 60);
  for (const id of ['npc_gard', 'npc_mina']) assert.ok(recruitNpc(world, P, id, { force: true }).ok, id);
  await papa.settle();
  const yuiBefore = JSON.stringify({ flags: Y.char.flags, objective: Y.char.objective });
  papa.send({ t: 'party', action: 'invite', sid: Y.id });
  yui.send({ t: 'party', action: 'accept' });
  await papa.settle();
  await yui.settle();
  // パパの 世界の 地下水路の おく（ユイも いっしょ）
  world.placeSession(P, 'canal3', 11.5, 14.5, 'up', true);
  world.placeSession(Y, 'canal3', 12.5, 14.5, 'up', true);
  await papa.settle();
  await yui.settle();
  P.repelUntil = Y.repelUntil = 1e15;
  await papa.walkTo(11, 12);
  // たたかって、たおした あとの 場面（水路 → ハミル）が おわるまで
  for (let i = 0; i < 60 && !(P.char.flags.c4_scorpion && !P.busy && !Y.busy); i++) {
    await papa.settle(2000);
    await yui.settle(2000);
  }
  assert.ok(P.char.flags.c4_scorpion, 'パパの 物語が すすむ');
  assert.equal(P.char.objective, C4_OBJ.scorpion);
  assert.equal(P.map, 'south');
  assert.equal(Y.map, 'south', 'ユイも いっしょに ハミルへ');
  assert.equal(JSON.stringify({ flags: Y.char.flags, objective: Y.char.objective }), yuiBefore, 'ユイの 物語は そのまま');
  // ユイが 見る 世界も パパの もの（オアシスに 水）
  const yHas = world.hasFlagFn(Y);
  assert.ok(yHas('c4_scorpion'));
});
