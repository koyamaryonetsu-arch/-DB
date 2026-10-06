// 第4章「砂の海にしずむ星」Step 3: 王都サファラ
// 王都に 着く → 女王ネフィ（同じ 言葉しか 言わない）→ うわさ（夜の 中庭の 水がめ）→ 夜に 宮殿の地下水路から 中庭へ
// → 本当の 女王・大臣の 影・絵日記 → 帰りに サラ → 学者ハサン（月の鏡と オベリスクの なぞ）→ 子どもたち 4人の わらべ歌
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked, condOk, SEA_PLACES } from '../public/js/shared/maps/index.js';
import { warpDest } from '../public/js/shared/world/services.js';
import { slideReach } from '../public/js/shared/maps/slide.js';
import { SOUTH_PLACES, SOUTH_ARRIVE, SAFARA_POS, PALACE_HALL, PALACE_COURT, STORM_Y, STORM_GAP_X } from '../public/js/shared/maps/south.js';
import { SAFARA_ROWS } from '../public/js/shared/maps/south-rows.js';
import { CH4_MAPS, SONG_FLAGS, PALACE_CANAL_STAIRS, SOUTH_TOWNS } from '../public/js/shared/maps/ch4.js';
import { STORY_STEPS, SCRIPTS } from '../public/js/shared/data/story.js';
import {
  C4_OBJ, OLD_C4_OBJ, CH4_STEPS, CH4_STORY_SCRIPTS, NEFI_LINE, ZAID_LINE, SONG_LINES, OBELISK_RIDDLE,
} from '../public/js/shared/data/story-ch4.js';
import { objectiveFromFlags, KNOWN_OBJECTIVES, repairObjective } from '../public/js/shared/data/progress.js';
import { questMarks } from '../public/js/shared/data/quest-targets.js';
import { talkFor } from '../public/js/shared/data/party-talk.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { SHOPS } from '../public/js/shared/data/shops.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ENCOUNTER_TABLES, ZONE_BG } from '../public/js/shared/data/encounters.js';
import { DAY_MS, REST_TO, clockHour, fracFor, isNightFor, isNightFrac, phaseOf, restShift, dayFrac } from '../public/js/shared/world/clock.js';
import { T } from '../public/js/shared/tiles.js';
import { npcOpts, paintHuman, paintSpecial } from '../public/js/client/render/chars.js';
import { SKY_FLAG, FLUTE_ID } from '../public/js/shared/data/sky.js';
import { gainExp, expForLevel } from '../public/js/shared/stats.js';
import { Bot, tickN } from './helpers.js';

const SAF = SOUTH_PLACES.safara;
const P = SAFARA_POS;
const at = (frac) => 50 * DAY_MS + Math.round(frac * DAY_MS);
const DAY = 0.3, NIGHT = 0.8;
const key = (x, y) => `${x},${y}`;
const hasOf = (flags) => (f) => flags.includes(f);
// Step 2 の さいご（よろい大サソリを たおした）まで
const UPTO = (f) => STORY_STEPS.slice(0, STORY_STEPS.indexOf(f) + 1);
const AFTER_SCORPION = UPTO('c4_scorpion');

// 歩いて 行ける マス（ワープの マスには 入らない）
function reach(map, start, flags) {
  const has = hasOf(flags);
  const warps = new Set(map.warps.map((w) => key(w.x, w.y)));
  const r = slideReach(map, start, has, (x, y) => isBlocked(map, x, y, has) || warps.has(key(x, y)));
  return (x, y) => r.has(key(x, y));
}
const near = (r, x, y, d = 1) => {
  for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) if (r(x + dx, y + dy)) return true;
  return false;
};
// だいほんの 中の ことば（say の 文）
const sayOf = (steps) => steps.filter((s) => s[0] === 'say').map((s) => s[2]);
const allSays = (steps) => JSON.stringify(steps);
// だいほんを ためしに 作る（x … フラグ・夜）
const ctx = (flags = [], night = false) => ({ c: { name: 'ソラ' }, name: 'ソラ', night, helper: false, flag: (f) => flags.includes(f), has: () => false, count: () => 0, kills: () => 0, quest: () => undefined });
const said = (bot, text, from = 0) => bot.msgs.slice(from).some((m) => m.t === 'script' && JSON.stringify(m.steps).includes(text));

function boost(bot, level) {
  const c = bot.world.data.characters[bot.char.id];
  gainExp(c, expForLevel(level) - c.exp);
  Object.assign(c.equip, { weapon: 'steel_sword', armor: 'steel_mail', shield: 'steel_shield', head: 'steel_helm' });
  c.jobs[c.job] = { lv: 10, b: 999 };
  c.hp = 9999;
  c.mp = 9999;
  bot.world.sendSelf(bot.s);
}
async function setup(seed, upto = 'c4_scorpion', frac = DAY) {
  const clock = { now: at(frac) };
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false, now: () => clock.now });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  for (const f of UPTO(upto)) c.flags[f] = true;
  c.objective = objectiveFromFlags(c);
  c.timeShift = 0;
  c.gold = 5000;
  boost(bot, 34);
  bot.s.repelUntil = 1e15;
  return { world, bot, c, clock };
}
const place = async (bot, map, x, y) => {
  bot.world.placeSession(bot.s, map, x + 0.5, y + 0.5, 'up', true);
  await bot.settle();
};
// 1マス だけ 歩く（トリガーの マスを ふむ）
async function stepOn(bot, x, y) {
  bot.x = x + 0.5;
  bot.y = y + 0.5;
  bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'down', moving: true, seq: bot.seq });
  await tickN(bot.world, 1);
  await bot.settle();
}

// ───────────── マップ ─────────────
test('王都サファラ: 砂嵐の 切れ目を ぬけて、道ぞいに 歩いて 行ける（サソリの 前は 行けない）', () => {
  const m = MAPS.south;
  const start = [Math.floor(SOUTH_ARRIVE.x), Math.floor(SOUTH_ARRIVE.y)];
  const before = reach(m, start, UPTO('c4_canal'));
  const after = reach(m, start, AFTER_SCORPION);
  assert.ok(!before(P.gate.x, P.gate.y), 'サソリの 前は 王都へ 行けない');
  assert.ok(after(P.gate.x, P.gate.y), '北の 門');
  assert.ok(after(STORM_GAP_X[0] + 1, STORM_Y[1] + 3), '砂嵐の 切れ目の 南');
  // 町の 中: 井戸・ふん水の まえ・宮殿の とびら・水の神殿・学者の家・闘技場・地下水路の 入り口・東の 門
  assert.ok(near(after, P.well.x, P.well.y), '町の 井戸');
  assert.ok(near(after, P.fountain.x, P.fountain.y, 2), 'ふん水');
  assert.ok(after(P.palaceDoor.x, P.palaceDoor.y), '宮殿の とびら');
  assert.ok(near(after, P.throne.x, P.throne.y), '王の間');
  assert.ok(after(P.throne.x, P.throne.y + 1), '玉座の 前（南）に 立てる');
  assert.ok(!after(P.throne.x, P.throne.y - 1), '玉座の うしろは かべ');
  assert.ok(near(after, P.pedestal.x, P.pedestal.y), '守り星の 台座');
  assert.ok(near(after, P.canal.x, P.canal.y), '宮殿の地下水路の 入り口');
  assert.ok(near(after, P.arenaGate.x, P.arenaGate.y), '闘技場の 門');
  assert.ok(after(P.eastGate.x, P.eastGate.y), '東の 門');
  // 中庭は 外から 歩いて 入れない（夜は 宮殿の地下水路の 古井戸から）
  for (let y = PALACE_COURT.y; y < PALACE_COURT.y + PALACE_COURT.h; y++) {
    for (let x = PALACE_COURT.x; x < PALACE_COURT.x + PALACE_COURT.w; x++) assert.ok(!after(x, y), `中庭 ${x},${y}`);
  }
  const court = reach(m, [P.courtWell.x, P.courtWell.y + 1], AFTER_SCORPION);
  assert.ok(near(court, P.jar.x, P.jar.y), '中庭の 水がめ');
  assert.ok(near(court, P.bench.x, P.bench.y), 'ベンチ');
  assert.ok(near(court, P.courtDoor.x, P.courtDoor.y), '王の間への とびら（中庭がわ）');
  assert.ok(!court(P.palaceDoor.x, P.palaceDoor.y + 1), '中庭から 王の間へは 行けない（カギ）');
  assert.equal(MAPS.south.tiles[P.courtDoor.y * m.w + P.courtDoor.x], T.LOCKED_DOOR);
  // かれた ふん水（新しい タイル）・町の 大きさ
  assert.equal(MAPS.south.tiles[P.fountain.y * m.w + P.fountain.x], T.DRY_FOUNTAIN);
  assert.equal(SAFARA_ROWS.length, SAF.h);
  for (const row of SAFARA_ROWS) assert.equal(row.length, SAF.w);
  // 町の 中は 魔物が 出ない・王都の きょく・名前
  for (const [x, y] of [[P.gate.x, P.gate.y + 3], [P.well.x + 2, P.well.y], [P.jar.x, P.jar.y + 1], [P.hassan.x, P.hassan.y + 4]]) {
    assert.ok(m.zoneAt(x, y).startsWith('safe') || m.zoneAt(x, y) === 'town', `${x},${y}: ${m.zoneAt(x, y)}`);
    assert.equal(m.bgmAt(x, y, false), 'safara');
    assert.equal(m.bgmAt(x, y, true), 'safara');
  }
  assert.equal(m.areaName(P.gate.x, P.gate.y + 3), '王都サファラ');
  assert.equal(m.areaName(P.jar.x, P.jar.y + 1), '宮殿の中庭');
  assert.equal(m.areaName(P.throne.x, P.throne.y + 1), 'サファラの宮殿');
  // ルーラ・帰り道の羽で 来られる（北の 門の 外）
  const t = SOUTH_TOWNS.safara;
  assert.equal(t.name, '王都サファラ');
  assert.equal(SEA_PLACES.safara, t, 'ルーラの 行き先');
  const d = warpDest('safara');
  assert.equal(d.map, 'south');
  assert.ok(!isBlocked(m, Math.floor(d.x), Math.floor(d.y), hasOf(AFTER_SCORPION)), 'ルーラで おりる ところ');
  assert.ok(after(Math.floor(d.x), Math.floor(d.y)), 'おりた ところから 歩ける');
  assert.ok(d.y < SAF.y, '北の 門の 外');
  assert.deepEqual(t.rect, [SAF.x, SAF.y, SAF.w, SAF.h], '町に 入ると 行ったことに なる');
});

test('王都サファラ: おもな 建物と 人（宮殿・水の神殿・市場・宿屋・教会・学者の家・闘技場）', () => {
  const m = MAPS.south;
  const ids = ['nefi', 'zaid', 'hassan', 'c4_s_apprentice', 'c4_s_maid', 'c4_s_inn', 'c4_s_priest', 'c4_s_weapon', 'c4_s_armor', 'c4_s_item', 'c4_s_arena',
    'c4_s_gate1', 'c4_p_gate1', 'c4_p_ngate1', 'c4_kid_sun', 'c4_kid_sand', 'c4_kid_moon', 'c4_kid_star', 'c4_s_canalman', 'c4_s_innguest', 'c4_s_rug'];
  for (const id of ids) {
    const n = m.npcById[id];
    assert.ok(n, id);
    assert.ok(SCRIPTS[n.script], `${id}: ${n.script}`);
    assert.ok(n.x >= SAF.x && n.x < SAF.x + SAF.w && n.y >= SAF.y && n.y < SAF.y + SAF.h, `${id} は 王都の 中`);
  }
  // 女王と 大臣は 宮殿の 王の間
  for (const id of ['nefi', 'zaid']) {
    const n = m.npcById[id];
    assert.ok(n.x >= PALACE_HALL.x && n.x < PALACE_HALL.x + PALACE_HALL.w && n.y >= PALACE_HALL.y && n.y < PALACE_HALL.y + PALACE_HALL.h, id);
  }
  // かんばん（入り口の よこの かべ）
  const boards = (m.boards || []).filter((b) => b.x >= SAF.x && b.x < SAF.x + SAF.w && b.y >= SAF.y && b.y < SAF.y + SAF.h);
  for (const k of ['inn', 'church', 'arms', 'temple', 'palace', 'arena', 'scholar']) assert.ok(boards.some((b) => b.kind === k), k);
  for (const b of boards) {
    assert.ok(b.name, `${b.kind} の 名前`);
    const door = (x) => m.tiles[b.y * m.w + x] === T.DOOR;
    assert.ok(door(b.x - 1) || door(b.x + 1), `${b.name}: 入り口の よこ`);
  }
  // 子どもたちは 昼だけ（夜は 家に 帰る）・宮殿の 門番は 昼、夜番は 夜
  const day = (f) => f !== '@night' && AFTER_SCORPION.includes(f);
  const night = (f) => f === '@night' || AFTER_SCORPION.includes(f);
  for (const k of ['sun', 'sand', 'moon', 'star']) {
    assert.ok(condOk(m.npcById[`c4_kid_${k}`].show, day), `${k}: 昼`);
    assert.ok(!condOk(m.npcById[`c4_kid_${k}`].show, night), `${k}: 夜は いない`);
  }
  assert.ok(condOk(m.npcById.c4_p_gate1.show, day) && !condOk(m.npcById.c4_p_gate1.show, night));
  assert.ok(!condOk(m.npcById.c4_p_ngate1.show, day) && condOk(m.npcById.c4_p_ngate1.show, night));
  // 夜は 宮殿の とびらで 外へ もどされる（昼は 通れる）
  const tr = m.triggers.find((t) => t.id === 'c4_palace_night');
  assert.ok(tr && tr.x === P.palaceDoor.x && tr.y === P.palaceDoor.y);
  assert.ok(condOk(tr.show, night) && !condOk(tr.show, day));
  // 王都に 着いた ときの イベントは、サソリの あとで 1回だけ
  const arrive = m.triggers.find((t) => t.id === 'c4_capital');
  assert.ok(condOk(arrive.show, hasOf(AFTER_SCORPION)));
  assert.ok(!condOk(arrive.show, hasOf([...AFTER_SCORPION, 'c4_capital'])));
  assert.ok(!condOk(arrive.show, hasOf(UPTO('c4_canal'))));
});

test('王都の 人の ことば: 門番の 水の きまり・女王と 大臣・みこ見習い・闘技場の 受付', () => {
  const gate = allSays(SCRIPTS.c4_capital_arrive(ctx(AFTER_SCORPION)));
  assert.ok(gate.includes('水は1人1日、コップ1ぱいまでだ'), '門番');
  assert.ok(gate.includes('長い行列'), '井戸の 行列');
  assert.ok(gate.includes('からからにかわいている'), 'かれた ふん水');
  assert.ok(allSays(SCRIPTS.c4_s_gate(ctx(AFTER_SCORPION))).includes('コップ1ぱいまでだ'));
  // 女王ネフィは 何回 話しかけても 同じ 言葉だけ
  const queen = [...AFTER_SCORPION, 'c4_capital', 'c4_queen'];
  for (const fl of [queen, [...queen, 'c4_rumor'], [...queen, 'c4_fountain', 'c4_song']]) {
    assert.deepEqual(sayOf(SCRIPTS.c4_nefi(ctx(fl))), [NEFI_LINE]);
    assert.deepEqual(sayOf(SCRIPTS.c4_zaid(ctx(fl))), [ZAID_LINE]);
  }
  assert.equal(NEFI_LINE, '水の守り星は、砂の海賊がぬすんだのです。');
  assert.equal(ZAID_LINE, '女王さまはおつかれだ。下がれ。');
  // はじめて 会う ときも 女王は 同じ 言葉を くりかえす
  const first = SCRIPTS.c4_nefi(ctx([...AFTER_SCORPION, 'c4_capital']));
  assert.ok(sayOf(first).filter((l) => l === NEFI_LINE).length >= 2);
  assert.ok(sayOf(first).includes(ZAID_LINE));
  assert.ok(first.some((s) => s[0] === 'flag' && s[1] === 'c4_queen'));
  // 水の神殿: からっぽの 台座・みこ見習いの ミラの 話（海賊が うたがわれる わけ）
  assert.ok(allSays(SCRIPTS.c4_s_pedestal(ctx())).includes('からっぽ'));
  const ap = allSays(SCRIPTS.c4_s_apprentice(ctx()));
  assert.ok(ap.includes('ミラさま') && ap.includes('海賊'), 'みこ見習い');
  assert.ok(MAPS.south.actions.some((a) => a.x === P.pedestal.x && a.y === P.pedestal.y && a.script === 'c4_s_pedestal'));
  // 闘技場は 建物と 受付だけ（戦いは まだ）
  assert.ok(allSays(SCRIPTS.c4_s_arena(ctx())).includes('水がもどるまで、大会はお休みだ'));
  assert.ok(!JSON.stringify(SCRIPTS.c4_s_arena(ctx())).includes('battle'));
  // うわさ: 宿屋の 客・市場の じゅうたん売り（女王に 会った あと）
  assert.ok(allSays(SCRIPTS.c4_s_innguest(ctx(queen))).includes('大臣が来てから人がかわってしまった'));
  assert.ok(allSays(SCRIPTS.c4_s_rug(ctx(queen))).includes('砂の海賊'));
  const maid = SCRIPTS.c4_s_maid(ctx(queen));
  assert.ok(allSays(maid).includes('夜になると、宮殿の中庭の水がめに、泣いている女王さまがうつるそうだ'), 'カギの うわさ');
  assert.ok(maid.some((s) => s[0] === 'flag' && s[1] === 'c4_rumor'));
  assert.ok(maid.some((s) => s[0] === 'objective' && s[1] === C4_OBJ.rumor));
  // 女王に 会う 前は うわさを 話さない
  assert.ok(!SCRIPTS.c4_s_maid(ctx(AFTER_SCORPION)).some((s) => s[0] === 'flag'));
});

test('宮殿の地下水路: 町の 南西の かいだん ⇔ 中庭の 古井戸。宝箱と 魔物', () => {
  const pc = MAPS.palace_canal;
  assert.ok(CH4_MAPS.includes('palace_canal'));
  assert.equal(pc.kind, 'dungeon');
  assert.equal(pc.name, '宮殿の地下水路');
  const { town, court } = PALACE_CANAL_STAIRS;
  // 町 → 地下水路（左下）・中庭の 古井戸 → 地下水路（右上）
  const w1 = MAPS.south.warps.find((w) => w.x === P.canal.x && w.y === P.canal.y);
  const w2 = MAPS.south.warps.find((w) => w.x === P.courtWell.x && w.y === P.courtWell.y);
  assert.equal(w1.to.map, 'palace_canal');
  assert.equal(w2.to.map, 'palace_canal');
  assert.ok(Math.abs(w1.to.x - (town.x + 0.5)) < 1 && Math.abs(w1.to.y - town.y) < 1.5);
  assert.ok(Math.abs(w2.to.x - (court.x + 0.5)) < 1 && Math.abs(w2.to.y - court.y) < 2);
  // 地下水路 → 町 ／ 中庭
  const back1 = pc.warps.find((w) => w.x === town.x && w.y === town.y);
  const back2 = pc.warps.find((w) => w.x === court.x && w.y === court.y);
  assert.equal(back1.to.map, 'south');
  assert.equal(back2.to.map, 'south');
  const inCourt = (x, y) => x >= PALACE_COURT.x && x < PALACE_COURT.x + PALACE_COURT.w && y >= PALACE_COURT.y && y < PALACE_COURT.y + PALACE_COURT.h;
  assert.ok(inCourt(Math.floor(back2.to.x), Math.floor(back2.to.y)), '中庭に 出る');
  assert.ok(!inCourt(Math.floor(back1.to.x), Math.floor(back1.to.y)), '町に 出る');
  // 中で つながっている（どちらの かいだんからも、宝箱へ 行ける）
  const r = reach(pc, [Math.floor(w1.to.x), Math.floor(w1.to.y)], AFTER_SCORPION);
  assert.ok(near(r, court.x, court.y), '中庭への かいだん');
  for (const ch of pc.chests) {
    assert.ok(near(r, ch.x, ch.y), `宝箱 ${ch.id}`);
    assert.ok(ch.gold || ITEMS[ch.item], ch.id);
  }
  assert.ok(pc.chests.some((ch) => ch.item === 'crescent_blade'), '★三日月の剣');
  assert.ok(ITEMS.crescent_blade.star && !(ITEMS.crescent_blade.price > 0));
  // 魔物（Lv30〜33 の 第4章の 魔物。夜の 月のゆうれいも まよいこんでいる）
  for (const z of Object.keys(pc.spawnCounts)) {
    assert.ok(ENCOUNTER_TABLES[z]?.length, z);
    assert.ok(ZONE_BG[z], z);
    for (const e of ENCOUNTER_TABLES[z]) {
      for (const [sp] of e.group) {
        assert.ok(MONSTERS[sp], sp);
        assert.ok(MONSTERS[sp].lv >= 30 && MONSTERS[sp].lv <= 33, `${sp} Lv${MONSTERS[sp].lv}`);
      }
    }
  }
  assert.ok(ENCOUNTER_TABLES.s_pcanal.some((e) => e.group.some(([sp]) => sp === 'moon_ghost')));
  // かいだんの 近くは 魔物が 出ない
  assert.ok(pc.zoneAt(town.x, town.y - 1).startsWith('safe'));
  assert.ok(pc.zoneAt(court.x, court.y + 1).startsWith('safe'));
  assert.equal(pc.zoneAt(20, 12), 's_pcanal');
});

test('中庭の 水がめ: 夜だけ 本当の 女王が うつる（昼は ヒント）。女王に 会う 前は 何も おきない', () => {
  const queen = [...AFTER_SCORPION, 'c4_capital', 'c4_queen'];
  // 昼: ヒントだけ（フラグは たたない）
  const day = SCRIPTS.c4_court_jar(ctx(queen, false));
  assert.ok(!day.some((s) => s[0] === 'flag'), '昼は なにも おきない');
  assert.ok(allSays(day).includes('夜になったら'), '昼の ヒント');
  // 女王に 会う 前の 夜も 何も おきない
  assert.ok(!SCRIPTS.c4_court_jar(ctx(AFTER_SCORPION, true)).some((s) => s[0] === 'flag'));
  // 夜: 本当の 女王・足音で かくれる・大臣の 影（大きな 魔神）・絵日記・サラ
  const night = SCRIPTS.c4_court_jar(ctx(queen, true));
  const text = allSays(night);
  assert.ok(text.includes('月の鏡で…わたしを…うつして…'));
  assert.ok(night.some((s) => s[0] === 'showMon' && s[1] === 'npc:nefi_mirror'), '水面の 女王');
  assert.ok(night.some((s) => s[0] === 'sfx' && s[1] === 'steps'), '足音');
  assert.ok(night.some((s) => s[0] === 'actor' && s[2]?.sprite === 'zaid'), '大臣が 通りすぎる');
  assert.ok(night.some((s) => s[0] === 'actor' && s[2]?.sprite === 'zaid_demon'), '大臣の 影が 魔神の 形に');
  assert.ok(text.includes('サラとあそんだ日'), '絵日記');
  assert.ok(text.includes('あんたたち、王国の味方？\\n…ちがうなら、じゃましないで'), 'サラ');
  for (const f of ['c4_fountain', 'c4_diary', 'c4_sara_seen']) assert.ok(night.some((s) => s[0] === 'flag' && s[1] === f), f);
  assert.ok(night.some((s) => s[0] === 'objective' && s[1] === C4_OBJ.fountain));
  // サラは 仲間に ならない（ゲストに しない）
  assert.ok(!night.some((s) => ['guest', 'join', 'recruit'].includes(s[0])));
  // 見た あとは、思い出すだけ
  assert.ok(!SCRIPTS.c4_court_jar(ctx([...queen, 'c4_fountain'], true)).some((s) => s[0] === 'flag'));
  // ベンチの 絵日記は 昼でも 読める
  assert.ok(allSays(SCRIPTS.c4_court_diary(ctx(queen))).includes('サラとあそんだ日'));
  // パーティーの みんなで 見る イベント（リーダーの 世界・リーダーの 時計）
  for (const id of ['c4_capital_arrive', 'c4_nefi', 'c4_court_jar', 'c4_hassan', 'c4_pcanal_enter']) assert.ok(CH4_STORY_SCRIPTS.includes(id), id);
});

test('学者ハサンと わらべ歌: なぞ（オベリスク）と 4人の 歌が そろうと c4_song。どちらが 先でも よい', () => {
  const base = [...AFTER_SCORPION, 'c4_capital', 'c4_queen', 'c4_fountain'];
  // 中庭の 前は、言い伝えの 話だけ
  assert.ok(!SCRIPTS.c4_hassan(ctx([...AFTER_SCORPION, 'c4_capital', 'c4_queen'])).some((s) => s[0] === 'flag'));
  // 中庭の あと: 月の鏡・王のへや・オベリスクの なぞ
  const h = SCRIPTS.c4_hassan(ctx(base));
  const ht = allSays(h);
  assert.ok(ht.includes('王のへや') && ht.includes(OBELISK_RIDDLE), 'なぞ');
  assert.equal(OBELISK_RIDDLE, '太陽が真上に来た時に、オベリスクの影がさす所じゃ');
  assert.ok(h.some((s) => s[0] === 'flag' && s[1] === 'c4_hassan'));
  assert.ok(h.some((s) => s[0] === 'objective' && s[1] === C4_OBJ.hassan));
  assert.ok(!h.some((s) => s[0] === 'flag' && s[1] === 'c4_song'), '歌は まだ');
  // 子どもたち: 1人 1行（太陽 → 砂 → 月 → 星）
  const order = ['sun', 'sand', 'moon', 'star'];
  assert.deepEqual(SONG_FLAGS, order.map((k) => `c4_song_${k}`));
  const got = [];
  for (const k of order) {
    const fl = [...base, 'c4_hassan', ...got];
    const st = SCRIPTS[`c4_kid_${k}`](ctx(fl));
    assert.ok(allSays(st).includes(SONG_LINES[k]), `${k} の 行`);
    assert.ok(st.some((s) => s[0] === 'flag' && s[1] === `c4_song_${k}`), k);
    got.push(`c4_song_${k}`);
    const done = st.some((s) => s[0] === 'flag' && s[1] === 'c4_song');
    assert.equal(done, got.length === 4, `${k}: ${got.length}人め`);
  }
  assert.ok(allSays(SCRIPTS.c4_kid_sun(ctx(base))).includes('お日さま'));
  assert.ok(allSays(SCRIPTS.c4_kid_sand(ctx(base))).includes('砂'));
  assert.ok(allSays(SCRIPTS.c4_kid_moon(ctx(base))).includes('お月さま'));
  assert.ok(allSays(SCRIPTS.c4_kid_star(ctx(base))).includes('お星さま'));
  // さいごの 子の だいほんで、Step 3 の さいごの 目標
  const last = SCRIPTS.c4_kid_star(ctx([...base, 'c4_hassan', 'c4_song_sun', 'c4_song_sand', 'c4_song_moon']));
  assert.ok(last.some((s) => s[0] === 'objective' && s[1] === C4_OBJ.song));
  // Step 4 から「続きはアップデートで！」では ない（ピラミッドへ つづく）。Step 3 の 版の 文は OLD_C4_OBJ.song
  assert.equal(C4_OBJ.song, '昼の12時ごろ、オベリスクの影がさす所を調べよう');
  assert.ok(OLD_C4_OBJ.song.startsWith('第4章の続きはアップデートで！（') && OLD_C4_OBJ.song.includes(C4_OBJ.song));
  // 歌を 先に ぜんぶ 聞いて いても、ハサンの なぞを 聞いた ときに c4_song
  const early = SCRIPTS.c4_kid_star(ctx([...base, 'c4_song_sun', 'c4_song_sand', 'c4_song_moon']));
  assert.ok(!early.some((s) => s[0] === 'flag' && s[1] === 'c4_song'), 'ハサンの 前は まだ');
  const h2 = SCRIPTS.c4_hassan(ctx([...base, ...SONG_FLAGS]));
  assert.ok(h2.some((s) => s[0] === 'flag' && s[1] === 'c4_hassan'));
  assert.ok(h2.some((s) => s[0] === 'flag' && s[1] === 'c4_song'));
  assert.ok(h2.some((s) => s[0] === 'objective' && s[1] === C4_OBJ.song));
  // もう 聞いた 子に もう一度 話しかけても フラグは ふえない
  assert.ok(!SCRIPTS.c4_kid_sun(ctx([...base, 'c4_song_sun'])).some((s) => s[0] === 'flag'));
});

test('宿屋: 王都サファラだけ「昼まで休む」が えらべる。休むと お昼の 少し 前', async () => {
  // だいほん: 昼は 4つ・夜は 3つ（ハミルの 宿屋には ない）
  const labels = (steps) => steps.find((s) => s[0] === 'choice')[2];
  assert.deepEqual(labels(SCRIPTS.c4_inn_safara(ctx([], false))), ['はい（朝まで）', 'いいえ', '夜まで休む', '昼まで休む']);
  assert.deepEqual(labels(SCRIPTS.c4_inn_safara(ctx([], true))), ['はい（朝まで）', 'いいえ', '昼まで休む']);
  assert.ok(!labels(SCRIPTS.c4_inn_hamil(ctx([], false))).includes('昼まで休む'));
  assert.ok(!labels(SCRIPTS.c4_inn_hamil(ctx([], true))).includes('昼まで休む'));
  // 時計: お昼の 少し 前（11時台）。昼の あいだ
  assert.equal(clockHour(REST_TO.noon), 11);
  assert.equal(phaseOf(REST_TO.noon), 'day');
  assert.ok(!isNightFrac(REST_TO.noon));
  for (const f of [0, 0.1, 0.23, 0.5, 0.8, 0.97]) {
    const sh = restShift(at(f), 0, 'noon');
    assert.ok(Math.abs(dayFrac(at(f), sh) - REST_TO.noon) < 1e-6, `${f}`);
  }
  // じっさいに とまる（昼 → 昼まで、夜 → 昼まで）
  const { world, bot, c, clock } = await setup(5311, 'c4_capital', 0.45);
  const inn = MAPS.south.npcById.c4_s_inn;
  await place(bot, 'south', inn.x, inn.y + 2);
  const gold = c.gold;
  c.hp = 1;
  bot.choice = 3;
  await bot.talk('c4_s_inn');
  assert.ok(Math.abs(fracFor(world, bot.s) - REST_TO.noon) < 1e-6, '昼まで 休んだ');
  assert.equal(c.gold, gold - 50);
  assert.ok(c.hp > 1, 'HPが 回復');
  assert.ok(said(bot, 'もうすぐお昼ですよ'));
  clock.now += Math.round(0.5 * DAY_MS);
  assert.ok(isNightFor(world, bot.s), '夜に なった');
  bot.choice = 2;
  await bot.talk('c4_s_inn');
  assert.ok(Math.abs(fracFor(world, bot.s) - REST_TO.noon) < 1e-6, '夜から 昼まで');
  bot.choice = 0;
});

test('王都の お店: ランク6の 武器と防具の店・市場の 道具屋', () => {
  const m = MAPS.south;
  for (const [npcId, shop] of [['c4_s_weapon', 'safara_weapon'], ['c4_s_armor', 'safara_armor'], ['c4_s_item', 'safara_item']]) {
    const steps = SCRIPTS[m.npcById[npcId].script](ctx());
    assert.ok(steps.some((s) => s[0] === 'shop' && s[1] === shop), npcId);
    assert.ok(SHOPS[shop]?.items.length, shop);
    for (const id of SHOPS[shop].items) assert.ok(ITEMS[id], `${shop}: ${id}`);
  }
  const SLOTS = ['weapon', 'armor', 'shield', 'head', 'acc'];
  for (const shop of ['safara_weapon', 'safara_armor']) {
    for (const id of SHOPS[shop].items) {
      const it = ITEMS[id];
      assert.ok(SLOTS.includes(it.type), id);
      assert.equal(it.rank, 6, `${id} は ランク6`);
      assert.ok(it.price > 0 && !it.star && !it.unique, id);
    }
  }
  // どの 種類の 武器も ある（ランク5より 少し 強い）
  const cats = new Set(SHOPS.safara_weapon.items.map((id) => ITEMS[id].cat));
  for (const cat of ['sword', 'axe', 'dagger', 'spear', 'claw', 'whip', 'staff', 'fan', 'boomerang', 'bat']) assert.ok(cats.has(cat), cat);
  for (const id of SHOPS.safara_weapon.items) {
    const it = ITEMS[id];
    const r5 = Object.values(ITEMS).filter((o) => o.type === 'weapon' && o.cat === it.cat && o.rank === 5 && o.price > 0 && !o.star);
    for (const o of r5) {
      assert.ok(it.atk > o.atk, `${id}（${it.atk}）> ${o.name}（${o.atk}）`);
      assert.ok(it.atk <= o.atk * 1.35, `${id} は 強すぎない`);
    }
  }
  for (const id of SHOPS.safara_armor.items) {
    const it = ITEMS[id];
    if (!['armor', 'shield', 'head'].includes(it.type)) continue;
    const same = (o) => o.type === it.type && (it.type !== 'armor' || o.armorType === it.armorType) && (it.type !== 'head' || !!o.helm === !!it.helm);
    const r5 = Object.values(ITEMS).filter((o) => same(o) && o.rank === 5 && o.price > 0 && !o.star);
    for (const o of r5) assert.ok(it.def >= o.def, `${id}（${it.def}）>= ${o.name}（${o.def}）`);
  }
  // 市場の 道具屋は 道具だけ
  for (const id of SHOPS.safara_item.items) assert.ok(!SLOTS.includes(ITEMS[id].type), id);
});

test('目標・仲間会話・地図の しるし（Step 3）。もう 聞いた 人の しるしは 消える', () => {
  for (const k of ['scorpion', 'capital', 'queen', 'rumor', 'fountain', 'hassan', 'song']) {
    const t = C4_OBJ[k];
    assert.ok(KNOWN_OBJECTIVES.has(t), k);
    for (const kind of ['self', 'bold', 'kind', 'kid']) assert.ok(talkFor(t, kind) !== `次は「${t.replace(/\n/g, '')}」ですね。`, `仲間会話: ${k} ${kind}`);
    const marks = ['south', 'palace_canal'].flatMap((m) => questMarks({ flags: {}, objective: t }, m));
    assert.ok(marks.some((m) => m.kind === 'main'), `しるし: ${k}`);
  }
  // 女王さまの 目標: 聞いた 人の しるしは 消える
  const queen = (flags) => questMarks({ flags, objective: C4_OBJ.queen }, 'south').filter((m) => m.kind === 'main');
  const guest = MAPS.south.npcById.c4_s_innguest;
  assert.ok(queen({}).some((m) => m.x === Math.floor(guest.x) && m.y === Math.floor(guest.y)));
  assert.ok(!queen({ c4_rumor_inn: true }).some((m) => m.x === Math.floor(guest.x) && m.y === Math.floor(guest.y)));
  // わらべ歌の 目標: 歌を 聞いた 子の しるしは 消える
  const kids = (flags) => questMarks({ flags, objective: C4_OBJ.hassan }, 'south').filter((m) => m.kind === 'main');
  assert.equal(kids({}).length, 4);
  assert.equal(kids({ c4_song_sun: true, c4_song_moon: true }).length, 2);
  // 地下水路の 中では、中庭への かいだんへ
  const pm = questMarks({ flags: {}, objective: C4_OBJ.rumor }, 'palace_canal').find((m) => m.kind === 'main');
  assert.ok(pm && pm.x === PALACE_CANAL_STAIRS.court.x && pm.y === PALACE_CANAL_STAIRS.court.y);
  // すすみぐあいから 目標を きめる
  const f = (...l) => ({ flags: Object.fromEntries([...AFTER_SCORPION, ...l].map((k) => [k, true])) });
  assert.equal(objectiveFromFlags(f()), C4_OBJ.scorpion);
  assert.equal(objectiveFromFlags(f('c4_capital')), C4_OBJ.capital);
  assert.equal(objectiveFromFlags(f('c4_capital', 'c4_queen')), C4_OBJ.queen);
  assert.equal(objectiveFromFlags(f('c4_capital', 'c4_queen', 'c4_rumor')), C4_OBJ.rumor);
  assert.equal(objectiveFromFlags(f('c4_capital', 'c4_queen', 'c4_fountain')), C4_OBJ.fountain);
  assert.equal(objectiveFromFlags(f('c4_capital', 'c4_queen', 'c4_rumor', 'c4_fountain', 'c4_hassan')), C4_OBJ.hassan);
  assert.equal(objectiveFromFlags(f('c4_capital', 'c4_queen', 'c4_fountain', 'c4_hassan', 'c4_song')), C4_OBJ.song);
  // 物語の すすみぐあい（STORY_STEPS の うしろ）
  const cap = CH4_STEPS.indexOf('c4_capital');
  assert.deepEqual(CH4_STEPS.slice(cap, cap + 4), ['c4_capital', 'c4_queen', 'c4_fountain', 'c4_song']);
  assert.ok(!CH4_STEPS.includes('c4_temple'), 'c4_temple は Step 7 の ため');
  for (const k of CH4_STEPS) assert.ok(STORY_STEPS.includes(k), k);
});

test('むかしの セーブ: Step 2 の さいごの「続きはアップデートで！」は 王都への 目標に なおる', async () => {
  // 文だけ
  const old = { flags: Object.fromEntries(AFTER_SCORPION.map((f) => [f, true])), objective: OLD_C4_OBJ.scorpion };
  assert.ok(!KNOWN_OBJECTIVES.has(OLD_C4_OBJ.scorpion), 'むかしの 文は 今は ない');
  assert.ok(repairObjective(old));
  assert.equal(old.objective, C4_OBJ.scorpion);
  assert.ok(!C4_OBJ.scorpion.includes('アップデート'));
  // 今の 文は なおさない
  const cur = { flags: { ...old.flags, c4_capital: true }, objective: C4_OBJ.capital };
  assert.ok(!repairObjective(cur));
  // セーブを 読みこむと なおる（王都に 着いた あとの 人は 王都の 目標）
  const world = new GameWorld({ offline: true, rng: makeRng(5321), rateLimit: false });
  const bot = new Bot(world, 'ミウ');
  await bot.login();
  await bot.createAndPlay('mage');
  const c = world.data.characters[bot.char.id];
  for (const f of AFTER_SCORPION) c.flags[f] = true;
  c.flags[SKY_FLAG] = true;
  c.keyItems.push(FLUTE_ID);
  c.objective = OLD_C4_OBJ.scorpion;
  const w2 = new GameWorld({ offline: true, rng: makeRng(5322), rateLimit: false, data: JSON.parse(JSON.stringify(world.data)) });
  const b2 = new Bot(w2, 'ミウ');
  await b2.login();
  b2.send({ t: 'play', id: c.id });
  assert.equal(w2.data.characters[c.id].objective, C4_OBJ.scorpion);
});

test('第4章 Step 3 を とおして あそべる: 王都 → 女王 → うわさ → 夜の 中庭（宮殿の地下水路）→ サラ → ハサン → わらべ歌', { timeout: 300000 }, async () => {
  const { world, bot, c, clock } = await setup(5301, 'c4_scorpion', DAY);
  // 砂嵐の 切れ目の 南から、道ぞいに 歩いて 王都へ
  await place(bot, 'south', STORM_GAP_X[0] + 1, STORM_Y[1] + 3);
  await bot.walkTo(P.gate.x, P.gate.y + 2);
  await bot.settle();
  assert.ok(bot.flag('c4_capital'), '王都に 着いた');
  assert.equal(c.objective, C4_OBJ.capital);
  assert.ok(said(bot, '水は1人1日、コップ1ぱいまでだ'));

  // 宮殿の 王の間で 女王ネフィ（入って すぐの ろうかから 左右の すきまを 通って、玉座の 前へ）
  await bot.walkTo(P.throne.x, P.throne.y + 2);
  assert.ok(c.visited?.safara, 'ルーラ・帰り道の羽で 来られる');
  await bot.talk('nefi');
  assert.ok(bot.flag('c4_queen'), '女王に 会った');
  assert.equal(c.objective, C4_OBJ.queen);
  let from = bot.msgs.length;
  await bot.talk('nefi');
  const lines = bot.msgs.slice(from).filter((m) => m.t === 'script').flatMap((m) => sayOf(m.steps));
  assert.deepEqual(lines, [NEFI_LINE], '同じ 言葉だけ');
  from = bot.msgs.length;
  await bot.talk('zaid');
  assert.ok(said(bot, ZAID_LINE, from));

  // 中庭への とびらは カギ（王の間から 中庭へは 行けない）
  assert.equal(bot.path(P.jar.x, P.jar.y + 1), null, '中庭へは 歩いて 行けない');

  // 井戸の 列の 女官に うわさを 聞く
  const maid = MAPS.south.npcById.c4_s_maid;
  await bot.walkTo(maid.x, maid.y + 1);
  await bot.talk('c4_s_maid');
  assert.ok(bot.flag('c4_rumor'), 'カギの うわさ');
  assert.equal(c.objective, C4_OBJ.rumor);

  // 昼の 中庭（地下水路の 古井戸から 入れる）: 水がめは ヒントだけ
  await bot.walkTo(P.canal.x, P.canal.y);
  assert.equal(bot.map, 'palace_canal', '宮殿の地下水路');
  await bot.settle();
  assert.ok(bot.flag('c4_pcanal_seen'), '入った ときの 話');
  await bot.walkTo(PALACE_CANAL_STAIRS.court.x, PALACE_CANAL_STAIRS.court.y);
  assert.equal(bot.map, 'south');
  await bot.settle();
  assert.ok(bot.x >= PALACE_COURT.x && bot.x < PALACE_COURT.x + PALACE_COURT.w && bot.y >= PALACE_COURT.y && bot.y < PALACE_COURT.y + PALACE_COURT.h, '中庭に 出た');
  await bot.walkTo(P.jar.x, P.jar.y + 1);
  from = bot.msgs.length;
  await bot.examine(P.jar.x, P.jar.y);
  assert.ok(!bot.flag('c4_fountain'), '昼は 何も おきない');
  assert.ok(said(bot, '夜になったら', from), '昼の ヒント');
  await bot.walkTo(P.bench.x + 1, P.bench.y);
  await bot.examine(P.bench.x, P.bench.y);
  assert.ok(bot.flag('c4_diary'), 'ベンチの 絵日記');

  // 古井戸から 地下水路を もどって 町へ → 宿屋で 夜まで 休む
  await bot.walkTo(P.courtWell.x, P.courtWell.y);
  assert.equal(bot.map, 'palace_canal');
  await bot.walkTo(PALACE_CANAL_STAIRS.town.x, PALACE_CANAL_STAIRS.town.y);
  assert.equal(bot.map, 'south');
  await bot.settle();
  const inn = MAPS.south.npcById.c4_s_inn;
  await bot.walkTo(inn.x, inn.y + 2);
  bot.choice = 2;
  await bot.talk('c4_s_inn');
  bot.choice = 0;
  assert.ok(isNightFor(world, bot.s), '夜に なった');

  // 夜は 宮殿の 門が しまる（とびらを 通ろうと すると 外へ もどされる）
  await bot.walkTo(P.palaceDoor.x, P.palaceDoor.y - 1);
  await stepOn(bot, P.palaceDoor.x, P.palaceDoor.y);
  assert.ok(bot.s.y < P.palaceDoor.y, '宮殿の 外へ もどされた');
  assert.ok(said(bot, '夜は、宮殿の門をしめているのだ'));

  // 夜の 宮殿の地下水路 → 中庭の 古井戸 → 水がめ
  await bot.walkTo(P.canal.x, P.canal.y);
  assert.equal(bot.map, 'palace_canal');
  await bot.walkTo(PALACE_CANAL_STAIRS.court.x, PALACE_CANAL_STAIRS.court.y);
  assert.equal(bot.map, 'south');
  await bot.settle();
  await bot.walkTo(P.jar.x, P.jar.y + 1);
  from = bot.msgs.length;
  await bot.examine(P.jar.x, P.jar.y);
  assert.ok(bot.flag('c4_fountain'), '本当の 女王を 見た');
  assert.ok(said(bot, '月の鏡で…わたしを…うつして…', from));
  assert.ok(said(bot, '一しゅん、大きな魔神の形になった', from), '大臣の 影');
  assert.ok(bot.flag('c4_sara_seen'), 'サラに 会った');
  assert.ok(said(bot, 'あんたたち、王国の味方？', from));
  assert.equal(c.objective, C4_OBJ.fountain);
  // 帰りは 地下水路を ぬけて 町へ（中庭に とじこめられない）
  assert.equal(bot.map, 'south');
  assert.ok(Math.abs(bot.s.x - (P.canal.x + 0.5)) < 1.5 && Math.abs(bot.s.y - (P.canal.y + 1.5)) < 1.5, '地下水路の 入り口の 前');
  assert.ok(!c.party?.some?.((p) => p.id === 'sara'), 'サラは 仲間に ならない');

  // 宿屋で 昼まで 休む（王都の 宿屋だけ）→ 学者ハサン
  await bot.walkTo(inn.x, inn.y + 2);
  bot.choice = 2; // 夜は「はい（朝まで）」「いいえ」「昼まで休む」
  await bot.talk('c4_s_inn');
  bot.choice = 0;
  assert.ok(!isNightFor(world, bot.s), '昼に なった');
  assert.equal(clockHour(fracFor(world, bot.s)), 11, 'お昼の 少し 前');
  const hassan = MAPS.south.npcById.hassan;
  await bot.walkTo(hassan.x, hassan.y + 1);
  from = bot.msgs.length;
  await bot.talk('hassan');
  assert.ok(bot.flag('c4_hassan'), 'ハサンの なぞ');
  assert.ok(said(bot, OBELISK_RIDDLE, from));
  assert.equal(c.objective, C4_OBJ.hassan);

  // 子どもたち 4人の わらべ歌（太陽 → 砂 → 月 → 星）
  for (const k of ['sun', 'sand', 'moon', 'star']) {
    const kid = MAPS.south.npcById[`c4_kid_${k}`];
    await place(bot, 'south', Math.floor(kid.x), Math.floor(kid.y) + 1);
    from = bot.msgs.length;
    await bot.talk(`c4_kid_${k}`);
    assert.ok(bot.flag(`c4_song_${k}`), k);
    assert.ok(said(bot, SONG_LINES[k], from), `${k} の 行`);
  }
  assert.ok(bot.flag('c4_song'), 'わらべ歌が そろった');
  assert.equal(c.objective, C4_OBJ.song);
  // Step 3 までの すすみぐあいは ぜんぶ。ピラミッド（Step 4）は まだ
  const upto = CH4_STEPS.indexOf('c4_song');
  for (const f of CH4_STEPS.slice(0, upto + 1)) assert.ok(c.flags[f], f);
  for (const f of CH4_STEPS.slice(upto + 1)) assert.ok(!c.flags[f], f);
});

test('家族で: 夜の 中庭は リーダーの 世界と 時計。手伝いの 人が 水がめを 調べても、リーダーの 物語が すすむ', { timeout: 120000 }, async () => {
  const clock = { now: at(DAY) };
  const world = new GameWorld({ offline: false, rng: makeRng(5331), checkPassword: (pw) => pw === 'ほし', rateLimit: false, now: () => clock.now });
  const papa = new Bot(world, 'パパ');
  const yui = new Bot(world, 'ユイ');
  await papa.login('ほし');
  await yui.login('ほし');
  await papa.createAndPlay('warrior');
  await yui.createAndPlay('mage');
  await papa.settle();
  await yui.settle();
  const Pa = world.sessions.get(papa.sid), Y = world.sessions.get(yui.sid);
  for (const f of [...AFTER_SCORPION, 'c4_capital', 'c4_queen', 'c4_rumor']) Pa.char.flags[f] = true;
  Pa.char.objective = C4_OBJ.rumor;
  // パパは 宿屋で 夜まで 休んだ（ユイの 時計は 昼の まま）
  Pa.char.timeShift = Math.round((NIGHT - DAY) * DAY_MS);
  Y.char.timeShift = 0;
  const yuiBefore = JSON.stringify({ flags: Y.char.flags, objective: Y.char.objective });
  papa.send({ t: 'party', action: 'invite', sid: Y.id });
  yui.send({ t: 'party', action: 'accept' });
  await papa.settle();
  await yui.settle();
  assert.ok(isNightFor(world, Y), 'ユイも リーダーの 時計（夜）');
  world.placeSession(Pa, 'south', P.jar.x + 1.5, P.jar.y + 1.5, 'up', true);
  world.placeSession(Y, 'south', P.jar.x + 0.5, P.jar.y + 1.5, 'up', true);
  await papa.settle();
  await yui.settle();
  yui.send({ t: 'interact', kind: 'tile', x: P.jar.x, y: P.jar.y });
  for (let i = 0; i < 4; i++) {
    await yui.settle();
    await papa.settle();
  }
  assert.ok(Pa.char.flags.c4_fountain, 'パパの 物語が すすむ');
  assert.ok(Pa.char.flags.c4_sara_seen, 'サラの 場面も');
  assert.equal(Pa.char.objective, C4_OBJ.fountain);
  assert.equal(JSON.stringify({ flags: Y.char.flags, objective: Y.char.objective }), yuiBefore, 'ユイの 物語は そのまま');
  assert.ok(said(yui, '月の鏡で…わたしを…うつして…'), 'ユイも 見ている');
  // 2人とも 中庭から 町へ もどる
  for (const s of [Pa, Y]) {
    assert.equal(s.map, 'south');
    const inCourt = s.x >= PALACE_COURT.x && s.x < PALACE_COURT.x + PALACE_COURT.w && s.y >= PALACE_COURT.y && s.y < PALACE_COURT.y + PALACE_COURT.h;
    assert.ok(!inCourt, `${s.char.name} は 町へ`);
  }
});

test('王都の 人の みため: 女王（小さな かんむり）・水に うつる 女王・大臣・サラ（ムチ）・ハサン・兵士・子どもたち。大臣の 影は 大きな 魔神', () => {
  const NEW = ['nefi', 'nefi_mirror', 'zaid', 'sara', 'hassan', 'w_priestess', 'palace_guard', 'safara_guard', 'maid', 'desert_girl', 'desert_girl2', 'desert_kid2', 'arena_clerk', 'fighter'];
  for (const id of NEW) {
    const o = npcOpts(id);
    assert.ok(o, id);
    for (const dir of ['down', 'left', 'right', 'up']) for (const f of [0, 1]) assert.ok(paintHuman(dir, f, o).px.some(Boolean), `${id} ${dir} ${f}`);
  }
  // 王都の NPC は みんな みためが ある
  for (const n of MAPS.south.npcs) if (n.x >= SAF.x && n.x < SAF.x + SAF.w && n.y >= SAF.y && n.y < SAF.y + SAF.h) assert.ok(npcOpts(n.sprite), `${n.id}: ${n.sprite}`);
  assert.equal(npcOpts('nefi').hat, 'tiara');
  assert.ok(npcOpts('nefi').small, '女王ネフィは 12さい');
  // 水に うつる 女王は はだも かみも 水の いろ
  assert.notEqual(npcOpts('nefi_mirror').skin, npcOpts('nefi').skin);
  assert.ok(/^#/.test(npcOpts('nefi_mirror').skin) && /^#/.test(npcOpts('nefi_mirror').hair));
  // サラは 赤い バンダナと ムチ
  assert.equal(npcOpts('sara').weapon?.cat, 'whip');
  assert.equal(npcOpts('sara').hat, 'bandana');
  assert.equal(npcOpts('zaid').hat, 'turban');
  // 小さな かんむりは 王さまの かんむりと ちがう え
  const crown = paintHuman('down', 0, { ...npcOpts('nefi'), hat: 'crown' }).px.join();
  assert.notEqual(paintHuman('down', 0, npcOpts('nefi')).px.join(), crown);
  // 大臣の 影（大きな 砂の 魔神）: 人より ずっと 大きい
  const size = (p) => [p.w / (p.res || 1), p.h / (p.res || 1)];
  const [hw, hh] = size(paintHuman('down', 0, npcOpts('zaid')));
  const demon = paintSpecial('zaid_demon', 'down', 0);
  assert.ok(demon?.px.some(Boolean));
  const [dw, dh] = size(demon);
  assert.ok(dw >= hw * 2 && dh >= hh * 1.8, `${dw}×${dh} / ${hw}×${hh}`);
});
