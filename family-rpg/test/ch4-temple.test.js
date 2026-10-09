// 第4章「砂の海にしずむ星」Step 7（A: 世界と物語）: 砂の底の神殿と モルガナ・エンディング
// さんばしの サラ（また 仲間に。c4_sara2）→ 砂クジラが 船ごと 砂の 下へ → 空気の ドーム（c4_temple。ほこら・かべ画）
// → 地下1階「水のかいろう」（赤・青・黄の レバーで 水の 高さ 上・中・下）→ 地下2階「鏡の間」（鏡の騎士・月の鏡で 光る 道・鏡の うつし身・いやしの泉）
// → 地下3階「水のろう」（ろうの 番人 → ミラが 目を あける）→ 水鏡の広間（モルガナ → ミラの いのり → 真の姿。c4_morgana）
// → 水の守り星（c4_star）→ 町の ようすが かわる → 王宮 → 夜の 中庭 → 第4章クリア（c4_clear）
// 戦いの しくみ・魔物・きまった 戦いは B（戦い）。ここでは 戦いは テストの 中で 勝たせる（B の データが ない 間は data/temple-stub.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked, effectiveTile, condOk } from '../public/js/shared/maps/index.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import { NORTH_PLACES } from '../public/js/shared/maps/north.js';
import { SOUTH_PLACES, SOUTH_POS, SOUTH_ARRIVE, SAFARA_POS, PYRAMID_POS, STORM_Y, STORM_GAP_X, SOUTH_STORM_Y, DUNA_GATE } from '../public/js/shared/maps/south.js';
import { CH4_MAPS, DUNA_LOOKOUTS, CANAL_DOOR, CANAL_LEVERS, PYR_BUTTONS, SONG_FLAGS } from '../public/js/shared/maps/ch4.js';
import { DUNA_POS, DUNA_VALLEY_EXIT, CASTLE_PLATES, CASTLE_POS, SANDSEA_POS, WHALE_RING, SANDSEA_STORM_X } from '../public/js/shared/maps/duna.js';
import {
  TEMPLE_MAPS, TEMPLE_LEVERS, WATER_FLAGS, waterLevel, waterFlagsFor, WATER_CELLS, MIRROR_PATH, MIRROR_FAKE, DOME_POS, B1_POS, B2_POS, B3_POS, HALL_POS,
  MIRROR_FLAG, KNIGHTS_FLAG, UTSUSHIMI_FLAG, SPRING_FLAG, GUARDS_FLAG, NO_ESCAPE_HINT,
} from '../public/js/shared/maps/temple.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { C4_OBJ, OLD_C4_OBJ, CH4_STEPS, C4_LEAD } from '../public/js/shared/data/story-ch4.js';
import { DUNA_OBJ } from '../public/js/shared/data/story-ch4-duna.js';
import {
  TEMPLE_STEPS, TEMPLE_OBJ, TEMPLE_TALK, TEMPLE_TARGETS, TEMPLE_STORY_SCRIPTS, MORGANA_LAST, PRAYER_SONG, PRAYER_PLAIN, SARA_SUPPORT, SONG_FLAGS4,
} from '../public/js/shared/data/story-ch4-temple.js';
import { objectiveFromFlags, KNOWN_OBJECTIVES, repairObjective } from '../public/js/shared/data/progress.js';
import { talkFor } from '../public/js/shared/data/party-talk.js';
import { questMarks } from '../public/js/shared/data/quest-targets.js';
import { ITEMS, EQUIP_RANKS } from '../public/js/shared/data/items.js';
import { SHOPS, NPC_SUPPORTS, GUESTS } from '../public/js/shared/data/shops.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { SKY_FLAG, FLUTE_ID, skyBox } from '../public/js/shared/data/sky.js';
import { DAY_MS } from '../public/js/shared/world/clock.js';
import { tavernInfo, recruitNpc } from '../public/js/shared/world/party.js';
import { mapState, spawnSymbols } from '../public/js/shared/world/monsters.js';
import { gainExp, expForLevel, itemCount, ownsItem } from '../public/js/shared/stats.js';
import { Bot, tickN } from './helpers.js';

const at = (frac) => 50 * DAY_MS + Math.round(frac * DAY_MS);
const hour = (h, m = 0) => (h + m / 60 - 6) / 24;
const UPTO = (f) => STORY_STEPS.slice(0, STORY_STEPS.indexOf(f) + 1);
const flagsOf = (...l) => Object.fromEntries(l.map((k) => [k, true]));
const said = (bot, text, from = 0) => bot.msgs.slice(from).some((m) => m.t === 'script' && JSON.stringify(m.steps).includes(text));
const stepsOf = (list) => JSON.stringify(list);
const ctx = (flags, extra = {}) => ({ c: { name: 'ソラ' }, name: 'ソラ', night: false, flag: (f) => !!flags[f], has: () => false, count: () => 0, ...extra });
const L = TEMPLE_LEVERS, W = WATER_FLAGS;
// 水の 高さごとの フラグ（レバーと 水の フラグ）
const WATER_STATES = {
  hi: [],
  mid: [L.red, W.dn, W.mid],
  lo: [L.red, L.blue, W.dn, W.lo],
  drain: [L.red, L.blue, L.yellow, W.dn, W.lo, W.drain],
};

function boost(c, level) {
  gainExp(c, expForLevel(level) - c.exp);
  Object.assign(c.equip, { weapon: 'shamshir', armor: 'sand_mail', shield: 'crescent_shield', head: 'sand_helm' });
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
  if (c.flags.c4_moon_mirror !== false && c.flags.c4_mirror) c.keyItems.push('moon_mirror');
  if (c.flags.c4_sara2 && !c.flags.c4_clear) c.guests = ['sara'];
  c.objective = objectiveFromFlags(c);
  c.timeShift = 0;
  boost(c, 40);
  world.sendSelf(bot.s);
  bot.s.repelUntil = 1e15;
  bot.keepResult = false;
  return { world, bot, c, clock };
}
const place = async (bot, map, x, y, dir = 'up') => {
  bot.world.placeSession(bot.s, map, x + 0.5, y + 0.5, dir, true);
  await play(bot);
};
// 1マス だけ 歩く（トリガー・ワープの マスを ふむ）
async function stepOn(bot, x, y, opts) {
  bot.x = x + 0.5;
  bot.y = y + 0.5;
  bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'up', moving: true, seq: bot.seq });
  await tickN(bot.world, 1);
  return play(bot, opts);
}
const talk = (bot, id, opts) => { bot.send({ t: 'interact', kind: 'npc', id }); return play(bot, opts); };
const examine = (bot, x, y, opts) => { bot.send({ t: 'interact', kind: 'tile', x, y }); return play(bot, opts); };

// 戦いは テストの 中で きめる（win … 敵を ぜんぶ たおす / lose … みかたが ぜんぶ たおれる）。戦った きまった 戦いの ID を のこす
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
async function play(bot, { lose = () => false, fought = null, max = 40000 } = {}) {
  const world = bot.world;
  for (let i = 0; i < max; i++) {
    for (const c2 of world.battles.values()) {
      if (c2.battle.over || c2.battle.pendingEnd || c2.done) continue;
      c2.done = true;
      if (fought) fought.push(c2.opts.fixed || c2.opts.symbolId || 'field');
      finish(c2, lose(c2.opts.fixed));
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
// その 世界で 通れる マス（flags … たっている フラグ）
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

// ───────────── すすみぐあい・目標・ヒント・しるし ─────────────
test('すすみぐあい: c4_whale →（c4_sara2）→ c4_temple → … → c4_morgana → c4_star → c4_clear。目標・仲間会話・地図の しるし・むかしの 文の なおし', () => {
  const wi = CH4_STEPS.indexOf('c4_whale');
  assert.deepEqual(CH4_STEPS.slice(wi + 1), ['c4_temple', 'c4_morgana', 'c4_star', 'c4_clear'], '名前の 約束（plan-ch4.md の 17）');
  assert.deepEqual(TEMPLE_STEPS, ['c4_temple', 'c4_morgana', 'c4_star', 'c4_clear']);
  for (const f of TEMPLE_STEPS) assert.ok(STORY_STEPS.includes(f), f);
  const f = (...l) => ({ flags: flagsOf(...UPTO('c4_whale'), ...l) });
  assert.equal(objectiveFromFlags(f()), C4_OBJ.whale);
  assert.ok(C4_OBJ.whale.includes('さんばし') && C4_OBJ.whale.includes('サラ'), 'Step 6 の さいごは サラに 話す 目標');
  assert.equal(objectiveFromFlags(f('c4_sara2')), TEMPLE_OBJ.sara2);
  assert.equal(objectiveFromFlags(f('c4_sara2', 'c4_temple')), TEMPLE_OBJ.temple);
  assert.equal(objectiveFromFlags(f('c4_temple', 'c4_tb2_seen')), TEMPLE_OBJ.tb2);
  assert.equal(objectiveFromFlags(f('c4_temple', 'c4_tb2_seen', MIRROR_FLAG)), TEMPLE_OBJ.lit);
  assert.equal(objectiveFromFlags(f('c4_temple', MIRROR_FLAG, UTSUSHIMI_FLAG)), TEMPLE_OBJ.utsushimi);
  assert.equal(objectiveFromFlags(f('c4_temple', UTSUSHIMI_FLAG, 'c4_tb3_seen')), TEMPLE_OBJ.tb3);
  assert.equal(objectiveFromFlags(f('c4_temple', 'c4_tb3_seen', GUARDS_FLAG)), TEMPLE_OBJ.guards);
  assert.equal(objectiveFromFlags(f('c4_temple', GUARDS_FLAG, 'c4_morgana')), TEMPLE_OBJ.morgana);
  assert.equal(objectiveFromFlags(f('c4_temple', 'c4_morgana', 'c4_star')), TEMPLE_OBJ.star);
  assert.equal(objectiveFromFlags(f('c4_temple', 'c4_morgana', 'c4_star', 'c4_clear')), TEMPLE_OBJ.clear);
  // 第4章クリアの 目標は、前の 章の クリアと おなじ 形
  assert.ok(TEMPLE_OBJ.clear.startsWith('第4章クリア！') && TEMPLE_OBJ.clear.includes('第5章はアップデートで！'));
  // Step 6 の 版の「続きはアップデートで！」は、さんばしの サラの 目標に なおる
  const old = { flags: f().flags, objective: OLD_C4_OBJ.whale };
  assert.ok(OLD_C4_OBJ.whale.startsWith('第4章の続きはアップデートで！'));
  assert.ok(repairObjective(old));
  assert.equal(old.objective, C4_OBJ.whale);
  // どの 目標にも 仲間会話と 行き先
  for (const [k, t] of Object.entries(TEMPLE_OBJ)) {
    assert.equal(C4_OBJ[k], t, k);
    assert.ok(KNOWN_OBJECTIVES.has(t), k);
    assert.ok(TEMPLE_TARGETS[t]?.length, `行き先 ${k}`);
    for (const kind of ['self', 'bold', 'kind', 'kid']) assert.ok(talkFor(t, kind) !== `次は「${t.replace(/\n/g, '')}」ですね。`, `仲間会話: ${k} ${kind}`);
  }
  // 「はなす」の ヒント: かべ画（上から下へ）・鏡の騎士・月の鏡・水の衣（雷）・鏡写し・大波
  assert.ok(talkFor(TEMPLE_OBJ.temple, 'self').includes('上から下へ') && talkFor(TEMPLE_OBJ.temple, 'kind').includes('かべ画'));
  assert.ok(talkFor(TEMPLE_OBJ.tb2, 'self').includes('月の鏡') && talkFor(TEMPLE_OBJ.tb2, 'self').includes('はね返'));
  for (const kind of ['self', 'kind']) {
    const t = talkFor(TEMPLE_OBJ.guards, kind);
    assert.ok(t.includes('雷') && t.includes('水') && t.includes('守'), `${kind}: ${t}`);
  }
  // 地図の しるし: ドゥナでは サラ → すなかぜ号、砂の海では ねどこ、神殿では かいだんと まだの レバー
  const mark = (obj, map, extra = []) => questMarks({ flags: flagsOf(...UPTO('c4_temple'), ...extra), objective: obj }, map).filter((m) => m.kind === 'main');
  assert.ok(questMarks({ flags: f().flags, objective: C4_OBJ.whale }, 'duna').some((m) => m.kind === 'main' && m.x === DUNA_POS.pierTop.x + 1), 'さんばしの サラ');
  assert.ok(mark(TEMPLE_OBJ.sara2, 'duna').some((m) => m.x === Math.floor(DUNA_POS.ship.x)), 'すなかぜ号');
  assert.ok(mark(TEMPLE_OBJ.sara2, 'sand_sea').some((m) => m.x === SANDSEA_POS.nest.x && m.y === SANDSEA_POS.nest.y), 'クジラのねどこ');
  assert.ok(mark(TEMPLE_OBJ.temple, 'temple_dome').some((m) => m.x === DOME_POS.down.x && m.y === DOME_POS.down.y), 'ドームの 神殿の 入口');
  const b1 = mark(TEMPLE_OBJ.temple, 'temple_b1');
  assert.ok(b1.some((m) => m.x === B1_POS.levers.red.x && m.y === B1_POS.levers.red.y), '赤の レバー');
  assert.ok(!mark(TEMPLE_OBJ.temple, 'temple_b1', [L.red]).some((m) => m.x === B1_POS.levers.red.x && m.y === B1_POS.levers.red.y), '動かした レバーの しるしは 消える');
  assert.ok(b1.some((m) => m.x === B1_POS.down.x && m.y === B1_POS.down.y), '下への かいだん');
  assert.ok(mark(TEMPLE_OBJ.temple, 'sand_sea').length, '砂の海からも 道しるべ（ねどこ）');
  assert.ok(mark(TEMPLE_OBJ.guards, 'temple_b3').length, '水のろうから 広間への かいだん');
  assert.ok(mark(TEMPLE_OBJ.guards, 'temple_hall').some((m) => m.x === HALL_POS.morgana.x && m.y === HALL_POS.morgana.y), 'モルガナ');
  assert.ok(mark(TEMPLE_OBJ.clear, 'duna').length, 'クリアの あとは ドゥナの 店');
  // だいじなもの・パーティー全員で 見る だいほん
  assert.equal(ITEMS.water_star.type, 'key');
  for (const id of TEMPLE_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id) && SCRIPTS[id], id);
});

// ───────────── マップ ─────────────
test('マップ: 空気の ドーム ⇔ 地下1階 ⇔ 地下2階 ⇔ 地下3階 ⇔ 水鏡の広間。神殿は 魔物の 出る 所と 出ない 所が ある', () => {
  for (const id of TEMPLE_MAPS) {
    const m = MAPS[id];
    assert.ok(m && CH4_MAPS.includes(id), id);
    assert.equal(m.kind, 'dungeon');
    assert.ok(m.noEscape, `${id}: 糸・羽が 使えない`);
    assert.equal(m.theme, 'temple');
  }
  const link = (a, b) => MAPS[a].warps.some((w) => w.to.map === b) && MAPS[b].warps.some((w) => w.to.map === a);
  assert.ok(link('temple_dome', 'temple_b1') && link('temple_b1', 'temple_b2') && link('temple_b2', 'temple_b3') && link('temple_b3', 'temple_hall'));
  // ドーム ⇔ 砂の海（すなかぜ号と 砂クジラ。地図の しるしの 道しるべ）
  assert.ok(MAPS.temple_dome.links.some((l) => l.to === 'sand_sea') && MAPS.sand_sea.links.some((l) => l.to === 'temple_dome'));
  assert.ok(MAPS.sand_sea.triggers.some((t) => t.script === 'c4_temple_dive' && t.show.all.includes('c4_sara2') && t.show.not.includes('c4_temple')));
  // 出現表（B が 作る 名前）。入口の ドームと 最深部は 魔物が 出ない
  assert.deepEqual(Object.keys(MAPS.temple_b1.spawnCounts), ['t_b1_wet']);
  assert.deepEqual(Object.keys(MAPS.temple_b2.spawnCounts), ['t_b2']);
  assert.deepEqual(Object.keys(MAPS.temple_b3.spawnCounts), ['t_b3']);
  for (const id of ['temple_dome', 'temple_hall']) {
    const m = MAPS[id];
    assert.equal(Object.keys(m.spawnCounts).length, 0, id);
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) assert.ok(m.zoneAt(x, y).startsWith('safe'), `${id} ${x},${y}`);
  }
  for (const z of ['t_b1_wet', 't_b1_dry', 't_b2', 't_b3']) assert.ok(ENCOUNTER_TABLES[z]?.length, z);
  for (const id of ['mirror_knights', 'utsushimi', 'prison_guards', 'morgana', 'morgana_true']) {
    assert.ok(FIXED_ENCOUNTERS[id]?.group.length && FIXED_ENCOUNTERS[id].canFlee === false, id);
  }
  assert.equal(FIXED_ENCOUNTERS.morgana.bgm, 'morgana');
  // ドーム: すなかぜ号・ほこら・かべ画・神殿の 入口
  const D = MAPS.temple_dome;
  assert.equal(D.npcById.temple_ship.script, 'c4_temple_ship');
  assert.equal(D.tiles[DOME_POS.shrine.y * D.w + DOME_POS.shrine.x], T.CLAN_SHRINE);
  for (const [x, y] of DOME_POS.murals) assert.equal(D.tiles[y * D.w + x], T.MURAL);
  const rd = reach('temple_dome', [Math.floor(DOME_POS.arrive.x), Math.floor(DOME_POS.arrive.y)], []);
  assert.ok(rd(DOME_POS.down.x, DOME_POS.down.y) && near(rd, DOME_POS.shrine) && rd(DOME_POS.murals[0][0], DOME_POS.murals[0][1] + 1));
  // 地下3階: ろうの 番人を たおすまで 下へ 行けない。広間: 水鏡の 前に モルガナ
  const r3 = (fl) => reach('temple_b3', [B3_POS.up.x, B3_POS.up.y + 1], fl);
  assert.ok(!r3([])(B3_POS.down.x, B3_POS.down.y) && r3([GUARDS_FLAG])(B3_POS.down.x, B3_POS.down.y));
  assert.ok(near(r3([]), B3_POS.mira));
  const H = MAPS.temple_hall;
  assert.ok(H.waterMirror && H.tiles[HALL_POS.mirror.y * H.w + HALL_POS.mirror.x] === T.WATER_MIRROR);
  assert.ok(near(reach('temple_hall', [HALL_POS.up.x, HALL_POS.up.y - 1], []), HALL_POS.morgana));
});

test('神殿の 中では みちびきの糸・帰り道の羽が 使えない（道具は へらない）。ルーラは 天井に ぶつかる', { timeout: 60000 }, async () => {
  const { bot, c } = await setup(7101, 'c4_temple', ['c4_sara2']);
  c.items.push({ id: 'guide_thread', n: 2 }, { id: 'return_wing', n: 2 });
  c.job = 'mage';
  c.jobs.mage = { lv: 10, b: 999 };
  await place(bot, 'temple_b1', 4, 2);
  for (const id of ['guide_thread', 'return_wing']) {
    bot.send({ t: 'menu', action: 'useItem', id, place: 'duna' });
    const r = bot.msgs.filter((m) => m.t === 'menuRes').pop();
    assert.ok(r && !r.ok && r.text.includes('使えない') && r.text.includes(NO_ESCAPE_HINT.slice(0, 8)), `${id}: ${r?.text}`);
    assert.equal(itemCount(c, id), 2, 'へらない');
    assert.equal(bot.s.map, 'temple_b1');
  }
  // 空気の ドームでも（すなかぜ号で 地上へ もどる ヒント）
  await place(bot, 'temple_dome', 13, 14);
  bot.send({ t: 'menu', action: 'useItem', id: 'guide_thread' });
  const r = bot.msgs.filter((m) => m.t === 'menuRes').pop();
  assert.ok(!r.ok && r.text.includes('すなかぜ号'), r.text);
  assert.equal(bot.s.map, 'temple_dome');
});

// ───────────── 地下1階: レバーと 水の 高さ ─────────────
test('地下1階: 水は、上から下へ。赤（上の 水門）→ 中、赤と 青 → 下、黄（下の 水門）で かいだん。高さで 通れる 道と とどく 宝箱が かわる', () => {
  // 水の 高さの きまり
  const lv = (...on) => waterLevel((f) => on.includes(f));
  assert.equal(lv(), 'hi');
  assert.equal(lv(L.red), 'mid');
  assert.equal(lv(L.red, L.blue), 'lo');
  assert.equal(lv(L.blue), 'hi', '赤が しまっていると、青を 開けても 水は 下へ 流れない');
  assert.equal(lv(L.yellow), 'hi');
  assert.deepEqual(waterFlagsFor((f) => [L.red, L.blue, L.yellow].includes(f)), { [W.dn]: true, [W.mid]: false, [W.lo]: true, [W.drain]: true });
  assert.equal(waterFlagsFor((f) => [L.red, L.yellow].includes(f))[W.drain], false, '水が「下」でないと かいだんの たまりは ひかない');
  // マスの すがた（水の 高さで 3つ いじょう）
  const m = MAPS.temple_b1;
  const cell = (ch) => m.gates.find((g) => g.water === ch);
  const tile = (g, state) => effectiveTile(m, g.x, g.y, (f) => WATER_STATES[state].includes(f));
  assert.deepEqual(['hi', 'mid', 'lo'].map((s) => tile(cell('M'), s)), [T.TW_HI, T.TW_BED, T.TW_BED]);
  assert.deepEqual(['hi', 'mid', 'lo'].map((s) => tile(cell('L'), s)), [T.TW_HI, T.TW_MID, T.TW_BED_LO]);
  assert.deepEqual(['hi', 'mid', 'lo'].map((s) => tile(cell('R'), s)), [T.TW_RAFT, T.TW_MID, T.TW_SHAFT]);
  assert.deepEqual(['hi', 'mid', 'lo'].map((s) => tile(cell('S'), s)), [T.TW_HI, T.TW_STEP, T.TW_COLUMN]);
  assert.deepEqual(['hi', 'mid', 'lo', 'drain'].map((s) => tile(cell('D'), s)), [T.TW_HI, T.TW_MID, T.TW_LO, T.TW_BED_LO]);
  // 通れる 所（入口から）
  const P = B1_POS;
  const R = Object.fromEntries(Object.entries(WATER_STATES).map(([k, fl]) => [k, reach('temple_b1', [P.up.x, P.up.y + 1], fl)]));
  const ok = (state, p) => near(R[state], p);
  // 上: 赤の レバーと、うく 石の 板の 先の 宝箱だけ
  assert.ok(ok('hi', P.levers.red) && ok('hi', P.raftChest));
  assert.ok(!ok('hi', P.levers.blue) && !ok('hi', P.robeChest) && !ok('hi', P.midChest) && !ok('hi', P.lowChest) && !R.hi(P.down.x, P.down.y));
  // 中: 青の レバー・中の 底の 宝箱・とび石の 先の「水の羽衣」。うく 石の 板は しずむ
  assert.ok(ok('mid', P.levers.blue) && ok('mid', P.midChest) && ok('mid', P.robeChest));
  assert.ok(!ok('mid', P.raftChest) && !ok('mid', P.levers.yellow) && !ok('mid', P.lowChest));
  // 下: 黄の レバー・ふかい 底の 宝箱。とび石は 高い 柱に なって とどかない。かいだんは まだ 水の 中
  assert.ok(ok('lo', P.levers.yellow) && ok('lo', P.lowChest) && ok('lo', P.levers.blue) && ok('lo', P.levers.red));
  assert.ok(!ok('lo', P.robeChest) && !ok('lo', P.raftChest) && !R.lo(P.down.x, P.down.y));
  // 下の 水門も 開くと 下への かいだん
  assert.ok(R.drain(P.down.x, P.down.y));
  // 宝箱: ランク7の よろい「水の羽衣」
  assert.equal(m.chests.find((ch) => ch.id === 'tb1_robe').item, 'water_hagoromo');
  assert.equal(ITEMS.water_hagoromo.rank, 7);
  // レバーは 3色（ひくと 光る）
  for (const [k, t] of [['red', T.LEVER_R], ['blue', T.LEVER_B], ['yellow', T.LEVER_Y]]) {
    const g = m.gates.find((q) => q.flag === L[k] && !q.water);
    assert.ok(g && g.closed === t && g.open === t + 1 && TILE_INFO[t + 1].light, k);
  }
  // かべ画の ヒント（ドーム）・文字ばん
  assert.ok(stepsOf(SCRIPTS.c4_dome_mural(ctx({}))).includes('水は、上から下へ。光は、下から上へ'));
  assert.ok(m.signs.some((s) => s.text.includes('赤は上の水門')));
});

test('地下1階の レバー: しらべると 水の 高さが かわる。まちがえても レバーを もどせば やり直せる。水に なった マスの 人は となりへ よける', { timeout: 60000 }, async () => {
  const { world, bot, c } = await setup(7102, 'c4_temple', ['c4_sara2', 'c4_tb1_seen']);
  const P = B1_POS.levers;
  const pull = async (k, from) => {
    await place(bot, 'temple_b1', from[0], from[1]);
    const before = bot.msgs.length;
    await examine(bot, P[k].x, P[k].y);
    return before;
  };
  const level = () => waterLevel((f) => !!c.flags[f]);
  // はじめは 上。青だけ 先に ひいても 水は 動かない
  assert.equal(level(), 'hi');
  // 赤 → 中
  let from = await pull('red', [3, 3]);
  assert.ok(c.flags[L.red] && c.flags[W.dn] && c.flags[W.mid] && !c.flags[W.lo]);
  assert.equal(level(), 'mid');
  assert.ok(said(bot, '上の水門が開いた', from) && said(bot, '（水の高さ：中）', from));
  // 中の 底を 歩いて 青 → 下
  from = await pull('blue', [7, 15]);
  assert.equal(level(), 'lo');
  assert.ok(c.flags[W.lo] && !c.flags[W.mid] && said(bot, '（水の高さ：下）', from));
  // 黄 → かいだんの たまりが ひく
  from = await pull('yellow', [24, 19]);
  assert.ok(c.flags[L.yellow] && c.flags[W.drain] && said(bot, 'かいだんの前の水が', from));
  // まちがえた: 赤を もどすと 上に もどる（ふかい 底に いた 人は、水の 来ない マスへ よける）
  const m = MAPS.temple_b1;
  // ふかい 底に 立った まま、赤の レバーの だいほんを 直接 走らせる（家族が 別の 所で レバーを うごかした ときと 同じ）
  bot.world.placeSession(bot.s, 'temple_b1', 15.5, 12.5, 'up', true);
  const { runSteps } = await import('../public/js/shared/world/scripts.js');
  const run = runSteps(world, bot.s, SCRIPTS.c4_tl_red(ctx(c.flags)));
  await play(bot);
  assert.ok(run, 'だいほん');
  assert.equal(level(), 'hi', '赤を もどすと 水が 上がる');
  assert.ok(!c.flags[W.dn] && !c.flags[W.lo] && !c.flags[W.drain], '水の フラグも もどる');
  assert.ok(!isBlocked(m, Math.floor(bot.s.x), Math.floor(bot.s.y), world.hasFlagFn(bot.s)), '水に なった マスから よけた');
  // 青が 開いた まま 赤を ひくと、いっきに 下へ
  from = await pull('red', [3, 3]);
  assert.equal(level(), 'lo');
  assert.ok(said(bot, 'いっきに下がっていく', from));
  // 青を しめると 中へ（青の レバーは 中の 底から とどく）
  from = await pull('blue', [7, 15]);
  assert.equal(level(), 'mid');
  // 赤が しまっている ときに 青を ひいても 水は 動かない
  await pull('red', [3, 3]);
  assert.equal(level(), 'hi');
  delete c.flags[L.blue];
  world.placeSession(bot.s, 'temple_b1', 3.5, 3.5, 'up', true);
  const r2 = runSteps(world, bot.s, SCRIPTS.c4_tl_blue(ctx(c.flags)));
  await play(bot);
  assert.ok(r2 && c.flags[L.blue] && level() === 'hi');
  assert.ok(said(bot, '上の水門がしまっていると、水は下へ流れないようだ'));
});

test('地下1階の 魔物: 水が 高い（上・中）ときは t_b1_wet、低い（下）ときは t_b1_dry。高さが かわると 魔物も 入れかわる', { timeout: 60000 }, async () => {
  const { world, bot, c } = await setup(7103, 'c4_temple', ['c4_sara2', 'c4_tb1_seen']);
  await place(bot, 'temple_b1', 4, 2);
  const m = MAPS.temple_b1;
  assert.equal(m.tableFor('t_b1_wet', [bot.s], world), null, '水が 上なら そのまま');
  Object.assign(c.flags, Object.fromEntries(WATER_STATES.lo.map((f) => [f, true])));
  assert.equal(m.tableFor('t_b1_wet', [bot.s], world), 't_b1_dry');
  // 魔物を 出す（下の 世界）
  const ms = mapState(world, 'temple_b1');
  ms.symbols.clear();
  for (let i = 0; i < 40; i++) spawnSymbols(world, ms, 800, [bot.s]);
  const syms = [...ms.symbols.values()];
  assert.ok(syms.length, '魔物が 出た');
  assert.ok(syms.every((s) => s.table === 't_b1_dry'), '砂の 魔物');
  // 赤を もどして 水が 上がると、いまの 魔物は いなくなる
  await place(bot, 'temple_b1', 3, 3);
  await examine(bot, B1_POS.levers.red.x, B1_POS.levers.red.y);
  assert.equal(waterLevel((f) => !!c.flags[f]), 'hi');
  assert.ok(![...ms.symbols.values()].some((s) => s.table === 't_b1_dry' && !s.busy), '入れかわった');
  for (let i = 0; i < 40; i++) spawnSymbols(world, ms, 800, [bot.s]);
  assert.ok([...ms.symbols.values()].every((s) => s.table === 't_b1_wet'));
});

// ───────────── 地下2階: 鏡の間 ─────────────
test('鏡の間: 鏡の ゆかは 月の鏡で しらべると 本物の 道だけ 光る。にせの 道を ふむと 手前へ もどされる', { timeout: 60000 }, async () => {
  const { bot, c } = await setup(7104, 'c4_temple', ['c4_sara2', 'c4_tb1_seen', 'c4_tb2_seen', KNIGHTS_FLAG]);
  const m = MAPS.temple_b2;
  const S = B2_POS.start;
  // 本物の 道は 1本で、鏡の ゆかの 手前から 大きな 鏡の 前まで つづく。にせの 道（光らない）と 見た目は おなじ
  assert.ok(MIRROR_PATH.length > 30 && MIRROR_FAKE.length > MIRROR_PATH.length * 3, 'ゆかの はんぶんいじょうが 鏡の ゆか');
  for (const [x, y] of [...MIRROR_PATH, ...MIRROR_FAKE]) assert.equal(m.tiles[y * m.w + x], T.MIRROR_FLOOR);
  const lit = (has) => MIRROR_PATH.every(([x, y]) => effectiveTile(m, x, y, has) === T.MIRROR_LIT);
  assert.ok(!lit(() => false) && lit((f) => f === MIRROR_FLAG));
  assert.ok(MIRROR_FAKE.every(([x, y]) => effectiveTile(m, x, y, (f) => f === MIRROR_FLAG) === T.MIRROR_FLOOR), 'にせは 光らない');
  // 月の鏡が ないと 分からない
  const keys = c.keyItems.slice();
  c.keyItems = c.keyItems.filter((k) => k !== 'moon_mirror');
  await place(bot, 'temple_b2', S.x, S.y);
  let from = bot.msgs.length;
  await examine(bot, S.x, S.y - 1);
  assert.ok(!c.flags[MIRROR_FLAG] && said(bot, '見ただけでは、分からない', from));
  // にせの 道を ふむと すいこまれて 手前へ
  const [fx, fy] = MIRROR_FAKE.find(([x, y]) => y === S.y - 1);
  await place(bot, 'temple_b2', fx, fy + 1);
  from = bot.msgs.length;
  await stepOn(bot, fx, fy);
  assert.ok(said(bot, '足もとの鏡に、体がすいこまれた', from));
  assert.ok(Math.abs(bot.s.x - (S.x + 0.5)) < 0.01 && Math.abs(bot.s.y - (S.y + 0.5)) < 0.01, '手前へ もどされた');
  // 月の鏡で 本物の 道が 光る（光は、下から上へ）
  c.keyItems = keys;
  from = bot.msgs.length;
  await examine(bot, S.x, S.y - 1);
  assert.ok(c.flags[MIRROR_FLAG], '光った');
  assert.ok(said(bot, 'ゆかの下から', from) && said(bot, '光は、下から上へ', from));
  assert.equal(c.objective, TEMPLE_OBJ.lit);
  // 光る 道を 1マスずつ たどると、すいこまれずに 大きな 鏡の 前まで 行ける
  const path = [...MIRROR_PATH];
  let cur = [S.x, S.y - 1];
  const used = new Set([`${cur[0]},${cur[1]}`]);
  await stepOn(bot, cur[0], cur[1]);
  for (let guard = 0; guard < 200; guard++) {
    const next = path.find(([x, y]) => !used.has(`${x},${y}`) && Math.abs(x - cur[0]) + Math.abs(y - cur[1]) === 1);
    if (!next) break;
    used.add(`${next[0]},${next[1]}`);
    await stepOn(bot, next[0], next[1]);
    cur = next;
  }
  assert.equal(used.size, path.length, '本物の 道を ぜんぶ たどった');
  await stepOn(bot, cur[0], cur[1] - 1);
  assert.ok(bot.s.y < 8, `鏡の ゆかの 向こうへ わたれた ${bot.s.x},${bot.s.y}`);
});

test('鏡の間: 鏡の騎士（番人）→ 大きな 鏡の 鏡の うつし身 → 鏡が くだけて いやしの泉へ。泉は 入るたびに 1回（ドームから 入りなおすと また 使える）', { timeout: 60000 }, async () => {
  const { bot, c } = await setup(7105, 'c4_temple', ['c4_sara2', 'c4_tb1_seen', 'c4_tb2_seen', ...WATER_STATES.drain]);
  const fought = [];
  // 鏡の騎士: 通路で 道を ふさぐ
  await place(bot, 'temple_b2', 14, 22);
  await stepOn(bot, 14, 21, { fought });
  assert.deepEqual(fought, ['mirror_knights']);
  assert.ok(c.flags[KNIGHTS_FLAG] && !condOk(MAPS.temple_b2.npcById.mirror_guard0.show, (f) => !!c.flags[f]));
  // 大きな 鏡（北の かべ）→ 鏡の うつし身 → くだける
  await place(bot, 'temple_b2', B2_POS.mirror.x, B2_POS.mirror.y + 1);
  await examine(bot, B2_POS.mirror.x, B2_POS.mirror.y, { fought });
  assert.deepEqual(fought, ['mirror_knights', 'utsushimi']);
  assert.ok(c.flags[UTSUSHIMI_FLAG] && said(bot, '鏡のうつし身'));
  assert.equal(effectiveTile(MAPS.temple_b2, B2_POS.mirror.x, B2_POS.mirror.y, (f) => !!c.flags[f]), T.MIRROR_BROKEN);
  assert.equal(c.objective, TEMPLE_OBJ.utsushimi);
  assert.ok(reach('temple_b2', [B2_POS.mirror.x, B2_POS.mirror.y + 1], Object.keys(c.flags))(B2_POS.down.x, B2_POS.down.y), '下への かいだん');
  // いやしの泉（1回）
  const S = B2_POS.spring;
  await place(bot, 'temple_b2', S.x, S.y + 1);
  bot.s.char.hp = 1;
  bot.choice = 0;
  await talk(bot, 'temple_spring');
  assert.ok(c.flags[SPRING_FLAG] && bot.s.char.hp > 1, '回復した');
  bot.s.char.hp = 1;
  let from = bot.msgs.length;
  await talk(bot, 'temple_spring');
  assert.equal(bot.s.char.hp, 1, '2回目は 回復しない');
  assert.ok(said(bot, '神殿に入りなおすと', from));
  // ドームへ もどって、神殿（地下1階）に 入りなおすと また 使える
  await place(bot, 'temple_dome', DOME_POS.down.x, DOME_POS.down.y + 1);
  await stepOn(bot, DOME_POS.down.x, DOME_POS.down.y);
  assert.equal(bot.s.map, 'temple_b1');
  assert.ok(!c.flags[SPRING_FLAG], 'また 使える');
  // ドームの ほこらは 何度でも 回復と 記録（教会と おなじ）
  await place(bot, 'temple_dome', DOME_POS.shrine.x + 1, DOME_POS.shrine.y);
  bot.s.char.hp = 1;
  from = bot.msgs.length;
  bot.choice = 0;
  await examine(bot, DOME_POS.shrine.x, DOME_POS.shrine.y);
  assert.ok(bot.s.char.hp > 1 && said(bot, '砂の海賊の一族のほこら', from));
  assert.ok(bot.msgs.slice(from).some((mm) => mm.t === 'script' && mm.steps.some((s) => s[0] === 'ui' && s[1] === 'church')), '記録（教会）');
});

// ───────────── 地下3階: 水のろう ─────────────
test('水のろう: サラ「母さん！」・モルガナの 声 → ろうの 番人 → ろうの 水が 下がり ミラが 目を あける。下への 水の まくが 消える', { timeout: 60000 }, async () => {
  const { bot, c } = await setup(7106, 'c4_temple', ['c4_sara2', 'c4_tb1_seen', 'c4_tb2_seen', KNIGHTS_FLAG, MIRROR_FLAG, UTSUSHIMI_FLAG, 'c4_tb3_seen']);
  const has = (f) => !!c.flags[f];
  const B = MAPS.temple_b3;
  assert.ok(condOk(B.npcById.mira_prison.show, has) && !condOk(B.npcById.mira_prison2.show, has), '目を とじた ミラ');
  const fought = [];
  await place(bot, 'temple_b3', 13, 7);
  await stepOn(bot, 13, 8, { fought });
  assert.deepEqual(fought, ['prison_guards']);
  assert.ok(said(bot, '母さん！！') && said(bot, 'わたくしの鏡に、だれがうつっても同じこと'));
  assert.ok(c.flags[GUARDS_FLAG] && said(bot, 'サラ…来てくれたのね'));
  assert.ok(!condOk(B.npcById.mira_prison.show, has) && condOk(B.npcById.mira_prison2.show, has), '水が 下がって 目を あけた ミラ');
  assert.equal(effectiveTile(B, 13, 17, has), T.CAVE_FLOOR, '水の まくが 消えた');
  assert.equal(c.objective, TEMPLE_OBJ.guards);
  // ミラの 話（水の衣・鏡写しの ヒント）
  const from = bot.msgs.length;
  await place(bot, 'temple_b3', B3_POS.mira.x, B3_POS.mira.y + 1);
  await talk(bot, 'mira_prison2');
  assert.ok(said(bot, '雷', from) && said(bot, 'はね返される', from));
});

// ───────────── モルガナ ─────────────
test('モルガナの 台本: モルガナ → ミラの いのり（HP・MP ぜんぶ）→ 真の姿。わらべ歌を 4つ 聞いていれば「水の守りの歌」。さいごの ことば', () => {
  const base = flagsOf(...UPTO('c4_temple'), 'c4_sara2', GUARDS_FLAG);
  const steps = SCRIPTS.c4_morgana_event(ctx(base));
  const b1 = steps.findIndex((s) => s[0] === 'battle' && s[1] === 'morgana');
  const call = steps.findIndex((s) => s[0] === 'call');
  const b2 = steps.findIndex((s) => s[0] === 'battle' && s[1] === 'morgana_true');
  assert.ok(b1 > 0 && call > b1 && b2 > call, 'モルガナ → いのり → 真の姿');
  assert.ok(steps.some((s) => s[0] === 'showMon' && s[1] === 'morgana') && steps.some((s) => s[0] === 'showMon' && s[1] === 'morgana_true'));
  assert.ok(stepsOf(steps).includes('ストルムもイグニアも、力だけの者') && stepsOf(steps).includes('あのお方'));
  assert.ok(steps.some((s) => s[0] === 'bgm' && s[1] === 'morgana'));
  // いのり: どちらも 全回復（HP・MP・たおれた 仲間も。['heal'] … 第3章の ユキナと おなじ）
  for (const pr of [PRAYER_SONG, PRAYER_PLAIN]) {
    const h = pr.find((s) => s[0] === 'heal');
    assert.ok(h && h.length === 1, '全回復');
  }
  assert.ok(stepsOf(PRAYER_SONG).includes('水の守りの歌') && stepsOf(PRAYER_SONG).includes('♪お日さまのぼって'));
  assert.ok(!stepsOf(PRAYER_PLAIN).includes('水の守りの歌'));
  assert.deepEqual(SONG_FLAGS4, SONG_FLAGS, 'わらべ歌の フラグ（Step 3）');
  // さいごの ことば（第5章の「えらばれなかった 紋章の子」）→ c4_morgana → 水の守り星（c4_star）
  const text = MORGANA_LAST.join('');
  assert.ok(text.includes('四ツ影は、もう1人だけ') && text.includes('わたくしたちとは、ちがう') && text.includes('あなたたちと同じ…紋章を…'));
  const flag = (f) => steps.findIndex((s) => s[0] === 'flag' && s[1] === f);
  assert.ok(flag('c4_morgana') > b2 && flag('c4_star') > flag('c4_morgana') && flag('c4_clear') > flag('c4_star'));
  assert.ok(steps.some((s) => s[0] === 'item' && s[1] === 'water_star') && steps.some((s) => s[0] === 'takeItem' && s[1] === 'water_star'));
  // たおした あとは 何も おきない
  assert.deepEqual(SCRIPTS.c4_morgana_event(ctx({ ...base, c4_morgana: true })), []);
});

test('モルガナ: 負けたら 台本は 止まり、ボスの 前から やり直せる。勝つと 水の守り星 → エンディング → 第4章クリア', { timeout: 180000 }, async () => {
  const { world, bot, c, clock } = await setup(7107, 'c4_temple', ['c4_sara2', 'c4_tb1_seen', 'c4_tb2_seen', KNIGHTS_FLAG, MIRROR_FLAG, UTSUSHIMI_FLAG, 'c4_tb3_seen', GUARDS_FLAG, 'c4_hall_seen', ...SONG_FLAGS]);
  c.spawn = { map: 'temple_dome', x: 13.5, y: 14.5 };
  // 1回目: 真の姿に 負ける
  const fought = [];
  await place(bot, 'temple_hall', 13, 13);
  await stepOn(bot, 13, 12, { fought, lose: (id) => id === 'morgana_true' });
  assert.deepEqual(fought, ['morgana', 'morgana_true']);
  assert.ok(!c.flags.c4_morgana && !c.flags.c4_star, '負けると すすまない');
  assert.equal(bot.s.map, 'temple_dome', 'いのりの場所（ドームの ほこらで 記録）で 目を 覚ます');
  assert.ok(said(bot, 'ミラの「水の守りの歌」'), 'わらべ歌を 4つ 聞いていた');
  assert.ok(condOk(MAPS.temple_hall.npcById.morgana_npc.show, (f) => !!c.flags[f]), 'モルガナは まだ いる');
  assert.equal(c.objective, TEMPLE_OBJ.guards);
  // 2回目: 勝つ（はじめから もう一度）
  fought.length = 0;
  clock.now = at(hour(10));
  await place(bot, 'temple_hall', 13, 13);
  const from = bot.msgs.length;
  await stepOn(bot, 13, 12, { fought });
  assert.deepEqual(fought, ['morgana', 'morgana_true']);
  for (const f of TEMPLE_STEPS) assert.ok(c.flags[f], f);
  assert.ok(said(bot, MORGANA_LAST[1], from), 'さいごの ことば');
  assert.ok(said(bot, '王都のふん水'.slice(0, 2), from) && said(bot, '緑がもどっていく', from) && said(bot, 'ふき上がった', from), '町の ようす');
  assert.ok(said(bot, '砂の海賊は、今日から王国の水の守り手だ！', from) && said(bot, 'また、いっしょに遊ぼうね', from) && said(bot, '大きくなったわね', from), '王宮');
  assert.ok(said(bot, '4つの守り星が光った。', from) && said(bot, '…残るは、大地の守り星。そして、最後の影。', from), 'アステル');
  assert.ok(said(bot, '「大地の守り星は、空にうかぶ島にある」', from), 'ネフィ');
  assert.ok(bot.msgs.slice(from).some((m) => m.t === 'script' && m.steps.some((s) => s[0] === 'chapter' && s[2] === 'クリア！')), '第4章クリア！');
  assert.equal(c.objective, TEMPLE_OBJ.clear);
  assert.deepEqual(c.guests, [], 'サラは パーティーから はなれる（酒場で 仲間に できる）');
  assert.ok(!c.keyItems.includes('water_star'), '水の守り星は ミラが 水の神殿へ');
  assert.equal(bot.s.map, 'south');
});

// ───────────── エンディングの あと ─────────────
test('エンディングの あと: 王都の ふん水・ハミルの オアシスの 緑・町の 人の ことば・水の神殿の ミラと 守り星', () => {
  const S = MAPS.south;
  const before = flagsOf(...UPTO('c4_morgana'));
  const after = flagsOf(...UPTO('c4_star'));
  const clear = flagsOf(...UPTO('c4_clear'));
  const F = SAFARA_POS.fountain;
  assert.equal(effectiveTile(S, F.x, F.y, (f) => !!before[f]), T.DRY_FOUNTAIN);
  assert.equal(effectiveTile(S, F.x, F.y, (f) => !!after[f]), T.FULL_FOUNTAIN, 'ふん水が ふき上がる');
  const HAM = SOUTH_PLACES.hamil;
  const greens = S.gates.filter((g) => g.flag === 'c4_star' && g.x >= HAM.x && g.x < HAM.x + HAM.w && g.y >= HAM.y && g.y < HAM.y + HAM.h);
  assert.ok(greens.length >= 20 && greens.some((g) => g.open === T.GRASS) && greens.some((g) => [T.FLOWERS, T.TOWN_FLOWERS].includes(g.open)), 'オアシスに 緑');
  // 町の 人の ことば
  const say = (id, flags) => stepsOf(SCRIPTS[id](ctx(flags)));
  assert.ok(say('c4_s_fountain', after).includes('ふき上がっている') && !say('c4_s_fountain', before).includes('ふき上がっている'));
  assert.ok(say('c4_nadim', after).includes('緑がもどってきた'));
  assert.ok(say('c4_s_gate', after).includes('水のきまりは、もうおしまい'));
  assert.ok(say('c4_s_pedestal', clear).includes('水の守り星が、青くかがやいている'));
  assert.ok(say('c4_s_apprentice', clear).includes('ミラさまが、帰ってきて'));
  assert.ok(say('c4_nefi', clear).includes('空にうかぶ島'));
  assert.ok(say('c4_barga', clear).includes('酒場'));
  assert.ok(say('c4_hassan', clear).includes('空にうかぶ島'));
  // とちゅうで 終わった ときは、女王に 話すと 王宮の 場面から
  assert.ok(SCRIPTS.c4_nefi(ctx(after)).some((s) => s[0] === 'flag' && s[1] === 'c4_clear'));
  assert.ok(SCRIPTS.c4_water_star(ctx(flagsOf(...UPTO('c4_morgana')))).some((s) => s[0] === 'flag' && s[1] === 'c4_star'));
  // 水の神殿の ミラと 台座の 守り星（クリアの あと）
  for (const id of ['mira_temple', 'water_star_altar']) {
    assert.ok(!condOk(S.npcById[id].show, (f) => !!after[f]) && condOk(S.npcById[id].show, (f) => !!clear[f]), id);
  }
  // さんばしの サラは また 仲間に なった あとは いない
  assert.ok(!condOk(MAPS.duna.npcById.sara_pier.show, (f) => f === 'c4_whale' || f === 'c4_sara2'));
});

test('クリアの あと: ドゥナに ランク7の 武器と 防具の 店。サラは ルミナの 酒場で 仲間に できる', { timeout: 60000 }, async () => {
  // ランク7の 店
  const keeper = MAPS.duna.npcById.c4_d_arms;
  assert.ok(keeper.show.all.includes('c4_clear'));
  const steps = SCRIPTS[keeper.script](ctx({}));
  assert.ok(stepsOf(steps).includes('duna_weapon') && stepsOf(steps).includes('duna_armor'));
  const SLOTS = ['weapon', 'armor', 'shield', 'head', 'acc'];
  for (const shop of ['duna_weapon', 'duna_armor']) {
    assert.ok(SHOPS[shop]?.items.length, shop);
    for (const id of SHOPS[shop].items) {
      const it = ITEMS[id];
      assert.ok(SLOTS.includes(it.type), id);
      assert.equal(it.rank, 7, `${id} は ランク7`);
      assert.ok(it.price > 0 && !it.star && !it.unique, id);
    }
  }
  assert.ok(SHOPS.duna_weapon.items.includes('pirate_whip') && SHOPS.duna_armor.items.includes('water_hagoromo'), '海賊のムチ・水の羽衣');
  const cats = new Set(SHOPS.duna_weapon.items.map((id) => ITEMS[id].cat));
  for (const cat of ['sword', 'axe', 'dagger', 'spear', 'claw', 'whip', 'staff', 'fan', 'boomerang', 'bat']) assert.ok(cats.has(cat), cat);
  for (const id of SHOPS.duna_weapon.items) {
    const it = ITEMS[id];
    const r6 = Object.values(ITEMS).filter((o) => o.type === 'weapon' && o.cat === it.cat && o.rank === 6 && o.price > 0 && !o.star);
    for (const o of r6) assert.ok(it.atk > o.atk && it.atk <= o.atk * 1.35, `${id}（${it.atk}）と ${o.name}（${o.atk}）`);
  }
  assert.ok(EQUIP_RANKS[6].where.includes('ドゥナ'));
  // サラ（酒場の 仲間。第4章クリアで ならぶ）
  assert.ok(NPC_SUPPORTS.includes(SARA_SUPPORT) && SARA_SUPPORT.unlock === 'c4_clear' && SARA_SUPPORT.job === 'pirate');
  const { world, bot, c } = await setup(7108, 'c4_star', ['c4_sara2']);
  assert.ok(!tavernInfo(world, bot.s).recruits.some((r) => r.key === 'npc_sara'), 'クリアの 前は まだ');
  assert.ok(!recruitNpc(world, bot.s, 'npc_sara').ok);
  c.flags.c4_clear = true;
  assert.ok(tavernInfo(world, bot.s).recruits.some((r) => r.key === 'npc_sara'), '酒場に ならぶ');
  const r = recruitNpc(world, bot.s, 'npc_sara');
  assert.ok(r.ok && r.name === 'サラ');
  const sara = c.companions.find((e) => e.key === 'npc_sara').char;
  assert.equal(sara.job, 'pirate');
  assert.equal(sara.equip.weapon, 'snake_whip');
  // ゲストの サラ（Step 6・7）は そのまま
  assert.equal(GUESTS.sara.name, 'サラ');
});

test('竜: モルガナを たおすと コガネ地方の どこへでも 飛べる。南の 砂嵐の のこりと 砂の海の 東の 砂嵐も 晴れる', () => {
  const has = (...l) => (f) => [...UPTO('c4_whale'), ...l].includes(f);
  assert.ok(skyBox('south', has()), 'モルガナの 前は 東の はしが まだ 砂嵐');
  assert.equal(skyBox('south', has('c4_temple', 'c4_morgana')), null, 'どこへでも');
  const S = MAPS.south;
  const south = S.gates.filter((g) => g.y === SOUTH_STORM_Y[0] && g.flag === 'c4_morgana');
  assert.ok(south.length);
  for (const g of south.filter((q) => !TILE_INFO[q.open].solid)) {
    assert.ok(isBlocked(S, g.x, g.y, has()), '前は 砂嵐');
    assert.ok(!isBlocked(S, g.x, g.y, has('c4_morgana')), '晴れる');
  }
  const sea = MAPS.sand_sea.gates.filter((g) => g.x >= SANDSEA_STORM_X && g.flag === 'c4_morgana');
  assert.ok(sea.length && sea.every((g) => effectiveTile(MAPS.sand_sea, g.x, g.y, has('c4_morgana')) === T.SAND_SEA));
});

// ───────────── 通し（Step 1 から 第4章クリアまで）─────────────
test('通し: 第4章を Step 1（長老ハクゲン）から 第4章クリアまで あそべる（戦いは テストの 中で 勝たせる）', { timeout: 900000 }, async () => {
  const clock = { now: at(hour(9)) };
  const world = new GameWorld({ offline: true, rng: makeRng(4747), rateLimit: false, now: () => clock.now });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  for (const f of UPTO('c3_clear')) c.flags[f] = true;
  c.flags[SKY_FLAG] = true;
  c.keyItems.push(FLUTE_ID);
  c.objective = C4_LEAD;
  boost(c, 40);
  world.sendSelf(bot.s);
  bot.s.repelUntil = 1e15;
  bot.keepResult = false;
  const fought = [];
  const opts = { fought };
  // 時計（リーダーの 時計。宿屋で 休んだ ずれは もどす）
  const setHour = (h) => { clock.now = at(hour(h)); c.timeShift = 0; };
  const npcAt = (id, map = 'south', dy = 1) => { const n = MAPS[map].npcById[id]; return place(bot, map, Math.floor(n.x), Math.floor(n.y) + dy); };
  const got = (f) => assert.ok(c.flags[f], f);

  // ── Step 1: 長老ハクゲン → 北の海辺 → ハミル → 村長 → 北の古井戸 → アミ ──
  const VIL = NORTH_PLACES.dragon_village;
  await place(bot, 'north', VIL.x + 6, VIL.y + 6);
  await talk(bot, 'c3_elder', opts);
  got('c4_start');
  await place(bot, 'south', Math.floor(SOUTH_ARRIVE.x), Math.floor(SOUTH_ARRIVE.y));
  await stepOn(bot, Math.floor(SOUTH_ARRIVE.x), Math.floor(SOUTH_ARRIVE.y) + 1, opts);
  got('c4_arrive');
  const HAM = SOUTH_PLACES.hamil;
  await place(bot, 'south', HAM.x + 15, HAM.y + 9);
  await stepOn(bot, HAM.x + 16, HAM.y + 9, opts);
  got('c4_hamil');
  await npcAt('nadim');
  await talk(bot, 'nadim', opts);
  got('c4_nadim');
  await place(bot, 'south', SOUTH_POS.well.x, SOUTH_POS.well.y + 1);
  await stepOn(bot, SOUTH_POS.well.x, SOUTH_POS.well.y, opts);
  assert.equal(bot.s.map, 'north_well');
  got('c4_well');
  await place(bot, 'north_well', 28, 17);
  await stepOn(bot, 28, 18, opts);
  got('c4_ami');
  // ── Step 2: 村長の たのみ → かれた地下水路（水門の レバー）→ よろい大サソリ ──
  await npcAt('nadim');
  await talk(bot, 'nadim', opts);
  got('c4_canal');
  await place(bot, 'south', CANAL_DOOR.x, CANAL_DOOR.y + 1);
  await stepOn(bot, CANAL_DOOR.x, CANAL_DOOR.y, opts);
  assert.equal(bot.s.map, 'canal1');
  await place(bot, 'canal1', 14, 12);
  await examine(bot, 14, 11, opts);
  await place(bot, 'canal2', 36, 23);
  await examine(bot, 36, 22, opts);
  await place(bot, 'canal2', 26, 32);
  await examine(bot, 26, 31, opts);
  for (const f of Object.values(CANAL_LEVERS)) got(f);
  await place(bot, 'canal3', 12, 13);
  await stepOn(bot, 12, 12, opts);
  got('c4_scorpion');
  // ── Step 3: 王都サファラ → 女王 → うわさ → 夜の 中庭 → ハサン → わらべ歌 ──
  const P = SAFARA_POS;
  await place(bot, 'south', STORM_GAP_X[0] + 1, STORM_Y[1] + 3);
  await place(bot, 'south', P.gate.x, P.gate.y);
  await stepOn(bot, P.gate.x, P.gate.y + 1, opts);
  got('c4_capital');
  await place(bot, 'south', P.throne.x, P.throne.y + 2);
  await talk(bot, 'nefi', opts);
  got('c4_queen');
  await npcAt('c4_s_maid');
  await talk(bot, 'c4_s_maid', opts);
  got('c4_rumor');
  setHour(24);
  await place(bot, 'south', P.jar.x, P.jar.y + 1);
  await examine(bot, P.jar.x, P.jar.y, opts);
  got('c4_fountain');
  setHour(10);
  await npcAt('hassan');
  await talk(bot, 'hassan', opts);
  got('c4_hassan');
  for (const k of ['sun', 'sand', 'moon', 'star']) {
    await npcAt(`c4_kid_${k}`);
    await talk(bot, `c4_kid_${k}`, opts);
  }
  got('c4_song');
  // ── Step 4: 昼の 12時の 日時計の とびら → 歌の ボタン → 王のへや（ミイラの王アンク）→ 月の鏡 ──
  setHour(12);
  const D = PYRAMID_POS.door;
  await place(bot, 'south', D.x, D.y + 1);
  await examine(bot, D.x, D.y, opts);
  got('c4_pyramid');
  await stepOn(bot, D.x, D.y, opts);
  assert.equal(bot.s.map, 'pyramid1');
  for (const k of ['sun', 'sand', 'moon', 'star']) {
    const b = PYR_BUTTONS.find((q) => q.key === k);
    await place(bot, 'pyramid1', b.x, b.y + 1);
    await examine(bot, b.x, b.y, opts);
  }
  got('c4_pb_star');
  await place(bot, 'pyramid4', 13, 10);
  await stepOn(bot, 13, 8, opts);
  got('c4_anku');
  await npcAt('pyr_mirror', 'pyramid4');
  await talk(bot, 'pyr_mirror', opts);
  got('c4_mirror');
  // ── Step 5: 夜の 中庭の とびら → 大臣ザイード → 砂の魔神ザイード → 女王の手紙 ──
  setHour(24);
  await place(bot, 'south', P.courtDoor.x, P.courtDoor.y + 1);
  await examine(bot, P.courtDoor.x, P.courtDoor.y, opts);
  got('c4_zaid');
  got('c4_letter');
  // ── Step 6: ドゥナへの 谷 → バルガ・サラ → 砂の古城 → 船のかじ → すなかぜ号 → 砂クジラ ──
  setHour(10);
  const LK = DUNA_LOOKOUTS[0];
  await place(bot, 'south', LK.x + 1, LK.y - 1);
  await talk(bot, LK.id, opts);
  got('c4_duna');
  await place(bot, 'south', DUNA_GATE.x, DUNA_VALLEY_EXIT.y - 1);
  await stepOn(bot, DUNA_GATE.x, DUNA_VALLEY_EXIT.y, opts);
  assert.equal(bot.s.map, 'duna');
  await place(bot, 'duna', DUNA_POS.gate.x, DUNA_POS.gate.y);
  await stepOn(bot, DUNA_POS.gate.x, DUNA_POS.gate.y + 1, opts);
  got('c4_duna_seen');
  await place(bot, 'duna', DUNA_POS.barga.x, DUNA_POS.barga.y + 2);
  await talk(bot, 'barga', opts);
  got('c4_sara');
  assert.deepEqual(c.guests, ['sara']);
  await place(bot, 'duna', DUNA_POS.castleDoor.x, DUNA_POS.castleDoor.y + 1);
  await stepOn(bot, DUNA_POS.castleDoor.x, DUNA_POS.castleDoor.y, opts);
  assert.equal(bot.s.map, 'sand_castle1');
  const [px, py] = CASTLE_PLATES[0];
  await place(bot, 'sand_castle1', px + 1, py);
  await stepOn(bot, px, py, opts);
  got('c4_castle_gate');
  await place(bot, 'sand_castle2', CASTLE_POS.rudder.x, CASTLE_POS.rudder.y + 6);
  await stepOn(bot, CASTLE_POS.rudder.x, CASTLE_POS.rudder.y + 4, opts);
  got('c4_castle');
  await place(bot, 'duna', DUNA_POS.barga.x, DUNA_POS.barga.y + 2);
  await talk(bot, 'barga', opts);
  got('c4_ship');
  const toSea = async () => {
    await place(bot, 'duna', Math.floor(DUNA_POS.ship.x), Math.floor(DUNA_POS.ship.y) - 1);
    bot.choice = 0;
    await talk(bot, 'sand_ship', opts);
    assert.equal(bot.s.map, 'sand_sea');
  };
  await toSea();
  const N = SANDSEA_POS.nest, R = Math.round(WHALE_RING);
  await place(bot, 'sand_sea', N.x, N.y - R - 2);
  await stepOn(bot, N.x, N.y - R, opts);
  got('c4_whale');
  assert.equal(bot.s.map, 'duna');
  assert.deepEqual(c.guests, []);
  assert.equal(c.objective, C4_OBJ.whale);
  // ── Step 7: さんばしの サラ → クジラの ねどこ → 空気の ドーム → 地下1階の レバー → 鏡の間 → 水のろう → モルガナ → エンディング ──
  await place(bot, 'duna', DUNA_POS.pierTop.x + 1, DUNA_POS.pierTop.y + 3);
  await talk(bot, 'sara_pier', opts);
  got('c4_sara2');
  assert.deepEqual(c.guests, ['sara'], 'サラが また 仲間に');
  assert.equal(c.objective, TEMPLE_OBJ.sara2);
  await toSea();
  await place(bot, 'sand_sea', N.x, N.y - R - 2);
  await stepOn(bot, N.x, N.y - R, opts);
  got('c4_temple');
  assert.equal(bot.s.map, 'temple_dome', '空気の ドーム');
  assert.equal(c.objective, TEMPLE_OBJ.temple);
  await place(bot, 'temple_dome', DOME_POS.murals[0][0], DOME_POS.murals[0][1] + 1);
  await examine(bot, DOME_POS.murals[0][0], DOME_POS.murals[0][1], opts);
  assert.ok(said(bot, '水は、上から下へ。光は、下から上へ'));
  await place(bot, 'temple_dome', DOME_POS.down.x, DOME_POS.down.y + 1);
  await stepOn(bot, DOME_POS.down.x, DOME_POS.down.y, opts);
  assert.equal(bot.s.map, 'temple_b1');
  const LV = B1_POS.levers;
  for (const [k, from] of [['red', [3, 3]], ['blue', [7, 15]], ['yellow', [24, 19]]]) {
    await place(bot, 'temple_b1', from[0], from[1]);
    await examine(bot, LV[k].x, LV[k].y, opts);
  }
  got(W.drain);
  await place(bot, 'temple_b1', B1_POS.down.x, B1_POS.down.y - 1);
  await stepOn(bot, B1_POS.down.x, B1_POS.down.y, opts);
  assert.equal(bot.s.map, 'temple_b2');
  got('c4_tb2_seen');
  await place(bot, 'temple_b2', 14, 22);
  await stepOn(bot, 14, 21, opts);
  got(KNIGHTS_FLAG);
  await place(bot, 'temple_b2', B2_POS.start.x, B2_POS.start.y);
  await examine(bot, B2_POS.start.x, B2_POS.start.y - 1, opts);
  got(MIRROR_FLAG);
  await place(bot, 'temple_b2', B2_POS.mirror.x, B2_POS.mirror.y + 1);
  await examine(bot, B2_POS.mirror.x, B2_POS.mirror.y, opts);
  got(UTSUSHIMI_FLAG);
  await place(bot, 'temple_b2', B2_POS.down.x, B2_POS.down.y + 1);
  await stepOn(bot, B2_POS.down.x, B2_POS.down.y, opts);
  assert.equal(bot.s.map, 'temple_b3');
  got('c4_tb3_seen');
  await place(bot, 'temple_b3', 13, 7);
  await stepOn(bot, 13, 8, opts);
  got(GUARDS_FLAG);
  await place(bot, 'temple_b3', B3_POS.down.x, B3_POS.down.y - 1);
  await stepOn(bot, B3_POS.down.x, B3_POS.down.y, opts);
  assert.equal(bot.s.map, 'temple_hall');
  await place(bot, 'temple_hall', 13, 13);
  await stepOn(bot, 13, 12, opts);
  // 第4章クリア
  for (const f of CH4_STEPS) assert.ok(c.flags[f], f);
  assert.equal(c.objective, TEMPLE_OBJ.clear);
  assert.ok(said(bot, 'ミラの「水の守りの歌」'), 'わらべ歌を 4つ 聞いていたので 水の守りの歌');
  // きまった 戦いを じゅんばんに 戦った
  const fixed = fought.filter((id) => FIXED_ENCOUNTERS[id]);
  const order = ['well_ambush', 'armor_scorpion', 'mummy_king', 'zaid', 'zaid_demon', 'rudder_guard', 'sand_whale', 'mirror_knights', 'utsushimi', 'prison_guards', 'morgana', 'morgana_true'];
  assert.deepEqual(fixed.filter((id) => order.includes(id)), order);
  // 町の ようす
  const has = world.hasFlagFn(bot.s);
  assert.equal(effectiveTile(MAPS.south, P.fountain.x, P.fountain.y, has), T.FULL_FOUNTAIN);
  assert.equal(skyBox('south', has), null, '竜で どこへでも');
});

// ───────────── 絵と 音（ブラウザ なしで しらべられる ところ）─────────────
test('絵と 音: 神殿の タイル（2D は 16×16 を ぬる・水の 高さで ちがう 水・2.5D の 高さ）・人の え（ミラ・モルガナ・鏡の騎士・ろうの 番人・水の ろう・水の守り星）・3きょく', async () => {
  const { paintTile, hasTileArt, isAnimated, prepareMap } = await import('../public/js/client/render/tiles.js');
  const { TEMPLE_PAINTERS, TEMPLE_TILES, TEMPLE_LIQUIDS, TEMPLE_FLOOR_H, TEMPLE_PROPS, templeBlockSpec, waterMirrorColor } = await import('../public/js/client/render/tiles-temple.js');
  const { partOfTile, themeRgb } = await import('../public/js/client/render/themes.js');
  const { PROP_TILES } = await import('../public/js/client/render/tex3d.js');
  const { npcOpts, paintSpecial, paintHuman } = await import('../public/js/client/render/chars.js');
  const { _TRACKS, _parse } = await import('../public/js/client/audio.js');
  const HEX = /^#[0-9a-f]{6}$/i;
  // 新しい タイルは ぜんぶ 16×16 を ぬる・色を かえない
  for (let id = T.TW_HI; id <= T.FULL_FOUNTAIN; id++) {
    assert.ok(TEMPLE_PAINTERS[id] && hasTileArt(id), TILE_INFO[id].name);
    assert.equal(partOfTile(id), 'none', `${TILE_INFO[id].name}: 色を かえない`);
    for (const m of [0, 1, 2, 5, 10, 15]) for (const f of [0, 1, 2]) {
      const p = paintTile(id, 0x21, f, m);
      assert.equal(p.px.filter((c) => !c).length, 0, `${TILE_INFO[id].name} m${m} f${f}: ぬられていない ドット`);
      assert.ok(p.px.every((c) => HEX.test(c)));
    }
  }
  assert.deepEqual(TEMPLE_TILES.sort((a, b) => a - b), Array.from({ length: T.FULL_FOUNTAIN - T.TW_HI + 1 }, (_, i) => T.TW_HI + i));
  // うごく タイル（水・光る 道・水の ろう・水鏡・ほこらの 火・ふん水）
  for (const id of [T.TW_HI, T.TW_MID, T.TW_LO, T.MIRROR_LIT, T.WATER_PRISON, T.WATER_MIRROR, T.FULL_FOUNTAIN]) {
    assert.ok(isAnimated(id) && TILE_INFO[id].anim, TILE_INFO[id].name);
    assert.notEqual(paintTile(id, 0, 0, 0).px.join(), paintTile(id, 0, 1, 0).px.join(), `${TILE_INFO[id].name}: コマで うごく`);
  }
  // 水の 高さで 水の 色が ちがう（下ほど こい）・本物の 道と にせの 道は おなじ え・光ると ちがう
  const lum = (id) => paintTile(id, 0, 0, 0).px.reduce((s, c) => s + parseInt(c.slice(1, 3), 16) + parseInt(c.slice(3, 5), 16) + parseInt(c.slice(5, 7), 16), 0);
  assert.ok(lum(T.TW_HI) > lum(T.TW_MID) && lum(T.TW_MID) > lum(T.TW_LO));
  assert.notEqual(paintTile(T.MIRROR_FLOOR).px.join(), paintTile(T.MIRROR_LIT).px.join());
  for (const [a, b] of [[T.LEVER_R, T.LEVER_R_ON], [T.LEVER_B, T.LEVER_B_ON], [T.LEVER_Y, T.LEVER_Y_ON], [T.LEVER_R, T.LEVER_B]]) assert.notEqual(paintTile(a).px.join(), paintTile(b).px.join());
  // 神殿の マップの タイルは ぜんぶ 絵が ある（水の 高さで かわる タイルも）
  for (const id of TEMPLE_MAPS) {
    const m = MAPS[id];
    const ids = new Set(m.tiles);
    for (const g of m.gates) { ids.add(g.open); ids.add(g.closed); for (const [, t] of g.levels || []) ids.add(t); }
    for (const t of ids) assert.ok(hasTileArt(t), `${id}: ${TILE_INFO[t]?.name ?? t}`);
  }
  // 水鏡は 広間 ぜんたいで 1まいの え（遠い 空に うかぶ 島）
  const r = prepareMap(MAPS.temple_hall);
  const H = MAPS.temple_hall, M = HALL_POS.mirror;
  assert.equal(r.variant[(M.y + 2) * H.w + M.x + 5], 5 | (2 << 4));
  const cx = (M.w * 16) / 2, cy = (M.h * 16) / 2 - 4;
  assert.ok(['#5ab85a', '#3a8a4a'].includes(waterMirrorColor(cx, cy, 0)), '島の 草');
  // 2.5D: 水の 高さ（上 > 中 > 下）・底の 高さ・かべの 鏡と かべ画・たてた もの
  assert.ok(TEMPLE_LIQUIDS[T.TW_HI].y > TEMPLE_LIQUIDS[T.TW_MID].y && TEMPLE_LIQUIDS[T.TW_MID].y > TEMPLE_LIQUIDS[T.TW_LO].y);
  assert.ok(TEMPLE_FLOOR_H[T.TW_BED] < TEMPLE_LIQUIDS[T.TW_HI].y && TEMPLE_FLOOR_H[T.TW_BED] > TEMPLE_LIQUIDS[T.TW_MID].y, '中の 底は「上」の 水の 下');
  assert.ok(TEMPLE_FLOOR_H[T.TW_BED_LO] < TEMPLE_LIQUIDS[T.TW_MID].y, 'ふかい 底は「中」の 水の 下');
  assert.ok(TEMPLE_FLOOR_H[T.TW_STEP] > TEMPLE_LIQUIDS[T.TW_MID].y, 'とび石は「中」の 水の 上');
  for (const id of [T.BIG_MIRROR, T.MURAL, T.AIR_WALL, T.FULL_FOUNTAIN]) assert.ok(templeBlockSpec(id, 0), TILE_INFO[id].name);
  for (const id of [T.LEVER_R, T.LEVER_B_ON, T.WATER_PRISON, T.CLAN_SHRINE]) assert.ok(TEMPLE_PROPS[id] && PROP_TILES.has(id), TILE_INFO[id].name);
  // 神殿の 色（青みどりの 石・青い 火）
  const floor = themeRgb(0x4a, 0x40, 0x38, 'temple', 'floor');
  assert.ok(floor[2] > floor[0], '青っぽい ゆか');
  const fire = themeRgb(0xff, 0x8a, 0x2a, 'temple', 'floor');
  assert.ok(fire[2] > fire[0], '青い 火');
  // 人の え
  for (const id of ['mira', 'morgana', 'mirror_guard', 'prison_guard']) {
    const o = npcOpts(id);
    assert.ok(o, id);
    for (const dir of ['down', 'left', 'right', 'up']) assert.ok(paintHuman(dir, 0, o).px.some(Boolean), `${id} ${dir}`);
  }
  assert.equal(npcOpts('mira').hat, 'veil');
  assert.equal(npcOpts('morgana').hat, 'tiara');
  for (const id of ['mira_prison', 'mira_prison_low', 'water_star']) {
    const a = paintSpecial(id, 'down', 0);
    assert.ok(a && a.px.filter(Boolean).length > 200, id);
  }
  assert.notEqual(paintSpecial('mira_prison', 'down', 0).px.join(), paintSpecial('mira_prison_low', 'down', 0).px.join());
  // 神殿の NPC は みんな え が ある
  for (const id of TEMPLE_MAPS) for (const n of MAPS[id].npcs) assert.ok(npcOpts(n.sprite) || paintSpecial(n.sprite, 'down', 0), `${id} ${n.id}: ${n.sprite}`);
  // 曲（ダンジョン・ボス・エンディング）
  for (const id of ['sand_temple', 'morgana', 'ending4']) {
    const tr = _TRACKS[id];
    assert.ok(tr && !tr.once && tr.ch.length >= 3 && tr.ch.length <= 4, id);
    const lens = tr.ch.map((ch) => _parse(ch.n).reduce((s, n) => s + n.len, 0));
    assert.ok(lens.every((l) => l === lens[0]) && lens[0] % 16 === 0 && lens[0] >= 128, `${id}: ${lens}`);
    for (const ch of tr.ch) if (ch.drums) assert.ok(_parse(ch.n).every((n) => n.drum), `${id}: たいこ`);
  }
  const mel = Object.values(_TRACKS).map((tr) => tr.ch[0].n);
  assert.equal(new Set(mel).size, mel.length, 'メロディーは ほかの 曲と ちがう');
  for (const id of TEMPLE_MAPS.slice(1)) assert.equal(MAPS[id].bgm, 'sand_temple', id);
  const ending = SCRIPTS.c4_water_star(ctx(flagsOf(...UPTO('c4_morgana'))));
  assert.ok(ending.some((s) => s[0] === 'bgm' && s[1] === 'ending4'), 'エンディングの 曲');
});
