// 第4章「砂の海にしずむ星」Step 4: 王家のピラミッドと ミイラの王アンク
// 日時計の とびら（昼の 11時〜13時）→ 1階の 歌の ボタン（まちがえると 地下へ）→ 2階（呪文が ふうじられる）→
// 3階（流れる 砂と ありじごく）→ 4階（王のへや・かくしべやの のろいの宝）→ ミイラの王アンク → 月の鏡
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked, effectiveTile } from '../public/js/shared/maps/index.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import {
  PYRAMID, PYRAMID_POS, PYRAMID_FLAG, OBELISK_SHADOW, pyramidLevel,
} from '../public/js/shared/maps/south.js';
import {
  CH4_MAPS, PYRAMID_MAPS, PYR_BUTTONS, PYR_DOOR_FLAG, PYR_LEVERS, PYR_CRACK_FLAG, GOLD_SWORD_FLAG, PYR_FALL, PYR_LANDING, PYR_STAIRS, PYR4_POS, SONG_FLAGS,
} from '../public/js/shared/maps/ch4.js';
import { flowAt, carry, flowReach, flowCanReach } from '../public/js/shared/maps/flow.js';
import { STORY_STEPS, SCRIPTS } from '../public/js/shared/data/story.js';
import { C4_OBJ, OLD_C4_OBJ, CH4_STEPS, doorOpenTime } from '../public/js/shared/data/story-ch4.js';
import { objectiveFromFlags, KNOWN_OBJECTIVES, repairObjective } from '../public/js/shared/data/progress.js';
import { questMarks } from '../public/js/shared/data/quest-targets.js';
import { talkFor } from '../public/js/shared/data/party-talk.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES, ZONE_BG } from '../public/js/shared/data/encounters.js';
import { ESCAPE_ITEM } from '../public/js/shared/data/escape.js';
import { Battle, spellSealed, SEALED_REASON } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { fieldUsableAbilities } from '../public/js/shared/fieldskills.js';
import { startFieldBattle } from '../public/js/shared/world/battles.js';
import { mapState, spawnSymbols } from '../public/js/shared/world/monsters.js';
import { cursedOn, CURSE_SPAWN } from '../public/js/shared/world/pyramid.js';
import { DAY_MS, REST_TO, clockHour, fracFor, isNoonFrac, sunSide, timeFlag } from '../public/js/shared/world/clock.js';
import { gainExp, expForLevel, addItem, itemCount, learnedAbilities } from '../public/js/shared/stats.js';
import { makeChar } from '../tools/sim.js';
import { Bot, tickN } from './helpers.js';

const at = (frac) => 50 * DAY_MS + Math.round(frac * DAY_MS);
// 時計の 時こく → 1日の わりあい（6時が 0）
const hour = (h, m = 0) => (h + m / 60 - 6) / 24;
const UPTO = (f) => STORY_STEPS.slice(0, STORY_STEPS.indexOf(f) + 1);
const said = (bot, text, from = 0) => bot.msgs.slice(from).some((m) => m.t === 'script' && JSON.stringify(m.steps).includes(text));
const lastMenu = (bot) => bot.msgs.filter((m) => m.t === 'menuRes').pop();
const key = (x, y) => `${x},${y}`;
const hasOf = (flags) => (f) => flags.includes(f);
const D = PYRAMID_POS.door;

function boost(bot, level) {
  const c = bot.world.data.characters[bot.char.id];
  gainExp(c, expForLevel(level) - c.exp);
  Object.assign(c.equip, { weapon: 'steel_sword', armor: 'steel_mail', shield: 'steel_shield', head: 'steel_helm' });
  c.jobs[c.job] = { lv: 10, b: 999 };
  bot.world.sendSelf(bot.s);
}
async function setup(seed, upto = 'c4_song', frac = hour(12), job = 'warrior') {
  const clock = { now: at(frac) };
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false, now: () => clock.now });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay(job);
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  for (const f of UPTO(upto)) c.flags[f] = true;
  c.flags.c4_hassan = true;
  for (const f of SONG_FLAGS) c.flags[f] = true;
  c.objective = objectiveFromFlags(c);
  c.timeShift = 0;
  c.gold = 5000;
  boost(bot, 34);
  bot.s.repelUntil = 1e15;
  return { world, bot, c, clock };
}
const place = async (bot, map, x, y, dir = 'up') => {
  bot.world.placeSession(bot.s, map, x + 0.5, y + 0.5, dir, true);
  await bot.settle();
};
// 1マス だけ 歩く（トリガー・ワープの マスを ふむ）
async function stepOn(bot, x, y) {
  bot.x = x + 0.5;
  bot.y = y + 0.5;
  bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'down', moving: true, seq: bot.seq });
  await tickN(bot.world, 1);
  await bot.settle();
}
// とびらの 前（オベリスクの 影の いちばん 先）で とびらを しらべる
async function tryDoor(bot) {
  await place(bot, 'south', D.x, D.y + 1);
  const from = bot.msgs.length;
  await bot.examine(D.x, D.y);
  return from;
}

// ───────────── マップ・タイル ─────────────
test('王家のピラミッド: マップが ぜんぶ あり、ピラミッドの 中は 糸・羽が 使えない（2階は 呪文も）', () => {
  for (const id of PYRAMID_MAPS) {
    assert.ok(CH4_MAPS.includes(id), id);
    const m = MAPS[id];
    assert.ok(m && m.kind === 'dungeon' && m.pyramid && m.noEscape, id);
    assert.equal(m.theme, 'pyramid', `${id}: 金色の 石`);
    assert.equal(m.bgm, 'pyramid');
    for (const z of Object.keys(m.spawnCounts)) {
      assert.ok(ENCOUNTER_TABLES[z]?.length, `${id}: 出現表 ${z}`);
      assert.equal(ZONE_BG[z], 'pyramid', `${id}: 戦いの 背景 ${z}`);
    }
  }
  assert.ok(MAPS.pyramid2.noSpells, '2階は 呪文が ふうじられる');
  for (const id of ['pyramid1', 'pyramid_b1', 'pyramid3', 'pyramid4']) assert.ok(!MAPS[id].noSpells, id);
  // 3階は 流れる 砂が 見えるように 明るい
  assert.equal(MAPS.pyramid3.dark, false);
  // フィールドの ピラミッド: 15×15 の 大きな 石の 山（まん中ほど 高い）。南の まん中に 日時計の とびら、5マス 南に オベリスク
  const s = MAPS.south;
  for (let y = PYRAMID.y; y < PYRAMID.y + PYRAMID.h; y++) {
    for (let x = PYRAMID.x; x < PYRAMID.x + PYRAMID.w; x++) {
      const t = s.tiles[y * s.w + x];
      assert.ok(t === T.PYRAMID || (x === D.x && y === D.y && t === T.PYR_DOOR), `${x},${y}`);
    }
  }
  assert.equal(pyramidLevel(PYRAMID.x + 7, PYRAMID.y + 7), 7, 'てっぺん');
  assert.equal(pyramidLevel(D.x, D.y), 0, 'とびらは いちばん 下の だん');
  assert.equal(D.x, PYRAMID.x + 7);
  assert.equal(PYRAMID_POS.obelisk.y - D.y, 5);
  assert.ok(isBlocked(s, D.x, D.y, () => false), 'とびらは しまっている');
  assert.ok(!isBlocked(s, D.x, D.y, (f) => f === PYRAMID_FLAG), '開いたら 入れる');
  // 新しい タイルは 地図の 色と 名前が ある
  for (const [name, id] of Object.entries(T)) if (id >= T.PYRAMID && id <= T.SEAL_RUNE) assert.ok(TILE_INFO[id]?.name && TILE_INFO[id].mapColor, name);
});

test('オベリスクの 影: 朝は 西・昼の 12時ごろ（11時〜13時）は 北へ のびて とびらを さす・昼すぎは 東・夜は ない', () => {
  assert.equal(sunSide(hour(9)), 'am');
  assert.equal(sunSide(hour(10, 59)), 'am');
  for (const [h, m] of [[11, 0], [12, 0], [12, 59]]) {
    assert.equal(sunSide(hour(h, m)), 'noon', `${h}:${m}`);
    assert.ok(isNoonFrac(hour(h, m)));
  }
  assert.equal(sunSide(hour(13, 0)), 'pm');
  assert.equal(sunSide(hour(16)), 'pm');
  assert.equal(sunSide(hour(22)), null, '夜');
  assert.equal(clockHour(REST_TO.noon), 11, '「昼まで休む」は 11時台（とびらの 開く 時間）');
  assert.ok(isNoonFrac(REST_TO.noon));
  // 影の マス（とびらの 前まで）
  const noon = OBELISK_SHADOW['@noon'];
  assert.deepEqual(noon[noon.length - 1], { x: D.x, y: D.y + 1 }, '昼の 影の 先は とびらの 前');
  assert.ok(OBELISK_SHADOW['@am'].every((p) => p.x < PYRAMID_POS.obelisk.x), '朝は 西');
  assert.ok(OBELISK_SHADOW['@pm'].every((p) => p.x > PYRAMID_POS.obelisk.x), '昼すぎは 東');
  const s = MAPS.south;
  const tile = (p, frac) => effectiveTile(s, p.x, p.y, (f) => timeFlag(f, frac));
  for (const p of noon) {
    assert.equal(tile(p, hour(12)), T.SUN_SHADOW, `昼 ${p.x},${p.y}`);
    assert.equal(tile(p, hour(9)), T.DESERT, `朝 ${p.x},${p.y}`);
  }
  for (const p of OBELISK_SHADOW['@am']) assert.equal(tile(p, hour(9)), T.SUN_SHADOW);
  for (const p of OBELISK_SHADOW['@pm']) assert.equal(tile(p, hour(15)), T.SUN_SHADOW);
  for (const p of [...noon, ...OBELISK_SHADOW['@am'], ...OBELISK_SHADOW['@pm']]) assert.equal(tile(p, hour(23)), T.DESERT, '夜は 影が ない');
  // オベリスクの 人の え（石の 柱）と、まえの 広場の かんばん・学者の 弟子
  const ob = s.npcById.obelisk;
  assert.ok(ob && ob.x === PYRAMID_POS.obelisk.x && ob.y === PYRAMID_POS.obelisk.y && ob.sprite === 'obelisk');
  assert.ok(s.npcById.c4_p_student, '学者の 弟子');
});

test('日時計の とびら: 10時・13時・14時は 開かない。11時・12時・12時59分は 開く（リーダーの 時計）', async () => {
  const { bot, c, clock } = await setup(4101, 'c4_song', hour(10));
  for (const [h, m, open] of [[10, 0, false], [14, 0, false], [13, 0, false], [11, 0, true], [12, 0, true], [12, 59, true]]) {
    delete c.flags[PYRAMID_FLAG];
    clock.now = at(hour(h, m));
    const from = await tryDoor(bot);
    assert.equal(!!c.flags[PYRAMID_FLAG], open, `${h}:${m}`);
    if (open) {
      assert.ok(said(bot, 'とびらの太陽のしるしに、ぴたりと重なった', from), `${h}:${m} の えんしゅつ`);
      assert.equal(c.objective, C4_OBJ.pyramid);
    } else {
      assert.ok(said(bot, h < 11 ? 'まだ西へのびている' : 'もう東へのびている', from), `${h}:${m} の ヒント`);
      assert.ok(said(bot, '「昼まで休む」', from), '宿屋の ヒント');
    }
  }
  // 一度 開いたら しまらない（夜でも 入れる）
  clock.now = at(hour(23));
  assert.ok(c.flags[PYRAMID_FLAG]);
  assert.ok(!isBlocked(MAPS.south, D.x, D.y, (f) => !!c.flags[f]));
  // なぞ（ハサン）と わらべ歌が そろう 前は、昼でも 開かない
  delete c.flags[PYRAMID_FLAG];
  delete c.flags.c4_song;
  clock.now = at(hour(12));
  const from = await tryDoor(bot);
  assert.ok(!c.flags[PYRAMID_FLAG]);
  assert.ok(said(bot, 'ぴたりとさしている', from), '影は とびらを さしている');
  // だいほんだけでも: 時計で きまる
  const x = (frac, flags = ['c4_song']) => ({ c: { name: 'ソラ' }, name: 'ソラ', clock: frac, flag: (f) => flags.includes(f), has: () => false, count: () => 0 });
  assert.ok(doorOpenTime(x(hour(11))) && doorOpenTime(x(hour(12, 59))));
  assert.ok(!doorOpenTime(x(hour(10, 59))) && !doorOpenTime(x(hour(13))) && !doorOpenTime(x(null)));
});

test('日時計の とびら: 王都の 宿屋で「昼まで休む」と、そのまま 歩いて 行って 開けられる。すずの あとも 時計どおり', async () => {
  const { world, bot, c, clock } = await setup(4102, 'c4_song', hour(17));
  const inn = MAPS.south.npcById.c4_s_inn;
  await place(bot, 'south', inn.x, inn.y + 2);
  bot.choice = 3; // 昼は「はい（朝まで）・いいえ・夜まで休む・昼まで休む」
  await bot.talk('c4_s_inn');
  assert.ok(Math.abs(fracFor(world, bot.s) - REST_TO.noon) < 1e-6, '昼まで 休んだ');
  bot.choice = 0;
  // 王都の 東の 門から 道ぞいに 歩いて とびらの 前へ（すこし 時間が すぎても 11時台）
  await bot.walkTo(D.x, D.y + 1);
  clock.now += Math.round(DAY_MS / 24 / 2); // 30分
  assert.ok(isNoonFrac(fracFor(world, bot.s)), `${clockHour(fracFor(world, bot.s))}時`);
  await bot.examine(D.x, D.y);
  assert.ok(c.flags[PYRAMID_FLAG], '開いた');
  // 夜明けのすず（朝）・夕焼けのすず（夜）を 使うと、その 時間の 影（とびらは もう 開いている ので そのまま）
  delete c.flags[PYRAMID_FLAG];
  addItem(c, 'dawn_bell', 1);
  addItem(c, 'dusk_bell', 1);
  bot.send({ t: 'menu', action: 'useItem', id: 'dawn_bell' });
  await bot.settle();
  assert.equal(clockHour(fracFor(world, bot.s)), 6, '明け方に なった');
  let from = await tryDoor(bot);
  assert.ok(!c.flags[PYRAMID_FLAG] && said(bot, 'お日さまが出ていないので', from), '明け方は 影が ない');
  clock.now += Math.round((hour(9) - REST_TO.morning) * DAY_MS);
  assert.equal(sunSide(fracFor(world, bot.s)), 'am', '朝の 9時ごろ');
  from = await tryDoor(bot);
  assert.ok(!c.flags[PYRAMID_FLAG] && said(bot, 'まだ西へのびている', from));
  bot.send({ t: 'menu', action: 'useItem', id: 'dusk_bell' });
  await bot.settle();
  from = await tryDoor(bot);
  assert.ok(!c.flags[PYRAMID_FLAG] && said(bot, 'お日さまが出ていないので', from), '夜も 影が ない');
  // ハサンの ヒントも そのまま
  const steps = SCRIPTS.c4_hassan({ c: { name: 'ソラ' }, name: 'ソラ', clock: hour(12), flag: (f) => ['c4_hassan', 'c4_song', 'c4_fountain'].includes(f), has: () => false, count: () => 0 });
  assert.ok(JSON.stringify(steps).includes('昼の12時ごろに、オベリスクのまわりを調べてみなされ'));
});

test('とびらを 開けて ピラミッドへ 入れる。入口の かいだんで 外へ もどれる', async () => {
  const { bot, c } = await setup(4103, 'c4_song', hour(12));
  await tryDoor(bot);
  assert.ok(c.flags[PYRAMID_FLAG]);
  await stepOn(bot, D.x, D.y);
  assert.equal(bot.map, 'pyramid1', 'ピラミッドの 1階');
  assert.ok(c.flags.c4_pyr1_seen, '1階に 入った ときの えんしゅつ');
  await stepOn(bot, PYR_STAIRS.exit1.x, PYR_STAIRS.exit1.y);
  assert.equal(bot.map, 'south');
  assert.ok(Math.abs(bot.y - (D.y + 1.6)) < 0.6, '入口の 前に 出る');
});

// ───────────── 1階: 歌の ボタン ─────────────
test('1階の 歌の ボタン: まちがえると みんなの 光が 消えて 地下へ おちる。地下の かいだんで 1階へ もどれる', async () => {
  const { bot, c } = await setup(4104, 'c4_pyramid');
  const btn = (k) => PYR_BUTTONS.find((b) => b.key === k);
  // ボタンの ならびは 歌の じゅんでは ない（左から 月・太陽・星・砂）
  const order = PYR_BUTTONS.slice().sort((a, b) => a.x - b.x).map((b) => b.key);
  assert.deepEqual(order, ['moon', 'sun', 'star', 'sand']);
  const press = async (k) => {
    const b = btn(k);
    await place(bot, 'pyramid1', b.x, b.y + 1);
    await bot.examine(b.x, b.y);
  };
  // 太陽 → 砂 まで ただしく おして、つぎに 星（まちがい）
  await press('sun');
  assert.ok(c.flags.c4_pb_sun);
  await press('sand');
  assert.ok(c.flags.c4_pb_sand);
  assert.equal(effectiveTile(MAPS.pyramid1, btn('sand').x, btn('sand').y, (f) => !!c.flags[f]), T.BTN_SAND_ON, '光った ボタン');
  await press('star');
  assert.equal(bot.map, 'pyramid_b1', '地下へ おちた');
  assert.ok(Math.abs(bot.x - PYR_FALL.x) < 0.01 && Math.abs(bot.y - PYR_FALL.y) < 0.01);
  for (const b of PYR_BUTTONS) assert.ok(!c.flags[b.flag], `${b.key} の 光は 消えた`);
  assert.ok(said(bot, 'ピラミッドの地下のようだ'), '地下の えんしゅつ');
  // 地下の かいだん（東）で 1階の 東の へやへ
  await bot.walkTo(PYR_STAIRS.upB1.x, PYR_STAIRS.upB1.y);
  assert.equal(bot.map, 'pyramid1');
  assert.ok(!isBlocked(MAPS.pyramid1, Math.floor(bot.x), Math.floor(bot.y), () => false));
  // 1階の 東の へやの ありじごくからも 地下へ
  await stepOn(bot, PYR_STAIRS.hole1.x, PYR_STAIRS.hole1.y);
  assert.equal(bot.map, 'pyramid_b1');
  // ただしい じゅん（太陽 → 砂 → 月 → 星）で 北の 石の とびらが 開く
  for (const k of ['sun', 'sand', 'moon', 'star']) await press(k);
  assert.ok(c.flags[PYR_DOOR_FLAG], '4つ 光った');
  for (const x of [14, 15, 16]) assert.equal(effectiveTile(MAPS.pyramid1, x, 8, (f) => !!c.flags[f]), T.CAVE_FLOOR, `とびら ${x}`);
  assert.equal(c.objective, C4_OBJ.pb);
  // もう 一度 おしても かわらない
  await press('moon');
  assert.ok(c.flags[PYR_DOOR_FLAG] && bot.map === 'pyramid1');
  // 北の かいだんから 2階へ
  await bot.walkTo(PYR_STAIRS.up1.x, PYR_STAIRS.up1.y);
  assert.equal(bot.map, 'pyramid2');
});

test('1階の ボタン: だいほん（はじめから 星を おすと おちる。歌を 知らない ときの ヒント）', () => {
  const x = (flags) => ({ c: { name: 'ソラ' }, name: 'ソラ', flag: (f) => flags.includes(f), has: () => false, count: () => 0 });
  const st = SCRIPTS.c4_pyr_btn_star(x(['c4_pyramid', 'c4_song']));
  assert.ok(st.some((s) => s[0] === 'teleport' && s[1] === PYR_FALL.map), '星から おすと おちる');
  assert.ok(JSON.stringify(st).includes('わらべ歌の順番'));
  const ok = SCRIPTS.c4_pyr_btn_sun(x(['c4_pyramid']));
  assert.ok(ok.some((s) => s[0] === 'flag' && s[1] === 'c4_pb_sun') && !ok.some((s) => s[0] === 'teleport'));
  assert.ok(STORY_STEPS.indexOf('c4_pb_star') < 0, 'ボタンの フラグは 物語の すすみぐあいでは ない');
});

// ───────────── 2階: 呪文が ふうじられる ─────────────
test('2階: 呪文は サーバーが ことわる（フィールドでも 戦いでも）。特技・道具は 使える。オートの 仲間も 呪文を えらばない', async () => {
  const { world, bot, c } = await setup(4105, 'c4_pyramid', hour(12), 'priest');
  c.flags[PYR_DOOR_FLAG] = true;
  c.level = 34;
  const learned = learnedAbilities(c);
  const heal = learned.find((id) => ABILITIES[id]?.field && ABILITIES[id].effect?.type === 'heal' && ABILITIES[id].kind === 'spell');
  assert.ok(heal, 'フィールドで 使える 回復の 呪文');
  // 2階に 入ると 探検家の ゆうれいが 知らせる
  const from = bot.msgs.length;
  await place(bot, 'pyramid2', PYR_STAIRS.down2.x, PYR_STAIRS.down2.y - 1);
  await stepOn(bot, 5, 21);
  assert.ok(said(bot, '呪文', from), '入口で 呪文の ことを 知らせる');
  assert.equal(c.objective, C4_OBJ.pyr2);
  // フィールド: 呪文は ことわる（MPは へらない）
  c.hp = 10;
  const mp0 = c.mp;
  bot.send({ t: 'menu', action: 'cast', id: heal, ref: 'self', who: 'self' });
  await bot.settle();
  assert.equal(lastMenu(bot).ok, false);
  assert.ok(lastMenu(bot).text.includes('ここでは呪文が使えない'), lastMenu(bot).text);
  assert.equal(c.mp, mp0);
  assert.equal(c.hp, 10);
  // フィールドの メニューの「今使える」: 呪文は 出すが えらべない（わけ: seal）
  const now = fieldUsableAbilities(c, { mapKind: 'dungeon', noSpells: true });
  const h = now.find((x) => x.id === heal);
  assert.ok(h && !h.ok && h.why === 'seal');
  assert.ok(fieldUsableAbilities(c, { mapKind: 'dungeon' }).find((x) => x.id === heal).ok, 'ほかの 階では 使える');
  // 道具は 使える
  addItem(c, 'herb', 2);
  bot.send({ t: 'menu', action: 'useItem', id: 'herb', ref: 'self' });
  await bot.settle();
  assert.ok(c.hp > 10, '薬草は 使える');
  // 戦い: 2階の 戦いは 呪文が ふうじられている（スナップショットにも のる）
  const ctx = startFieldBattle(world, bot.s, { id: 'pyr2test', sp: 'mummy_soldier', group: ['mummy_soldier'], zone: 's_pyr2', table: 's_pyr2', busy: false });
  const b = ctx.battle;
  assert.ok(b.noSpells && b.snapshot().noSpells);
  const me = b.allies[0];
  me.ready = true;
  const spell = me.abilities.find((id) => spellSealed(ABILITIES[id]) && ABILITIES[id].effect?.type !== 'mahouken');
  assert.ok(spell, '呪文を おぼえている');
  assert.deepEqual(b.validate(me, { type: 'ability', id: spell, target: me.id }), { ok: false, reason: SEALED_REASON });
  assert.equal(b.validate(me, { type: 'attack', target: b.enemies[0].id }).ok, true);
  // オートの 仲間は 呪文を えらばない
  for (let i = 0; i < 20; i++) {
    const cmd = decideAlly(b, me);
    assert.ok(!(cmd.type === 'ability' && spellSealed(ABILITIES[cmd.id])), JSON.stringify(cmd));
  }
  // ほかの 階の 戦いは ふつう
  b.endBattle({ outcome: 'flee' });
  await tickN(world, 5);
  await place(bot, 'pyramid1', 15, 20);
  const ctx2 = startFieldBattle(world, bot.s, { id: 'pyr1test', sp: 'mummy_soldier', group: ['mummy_soldier'], zone: 's_pyr1', table: 's_pyr1', busy: false });
  assert.ok(!ctx2.battle.noSpells);
  ctx2.battle.endBattle({ outcome: 'flee' });
});

// ───────────── 3階: 流れる 砂と ありじごく ─────────────
test('3階の 流れる 砂: 矢じるしの むきへ 流され、ありじごくに 入ると 2階の 小べやへ おちる', async () => {
  const m = MAPS.pyramid3;
  const none = () => false;
  // 流れる 砂は どれも 1マスの むき。ぐるっと まわる 流れは ない
  let flows = 0;
  for (let y = 0; y < m.h; y++) {
    for (let x = 0; x < m.w; x++) {
      const d = flowAt(m, x, y, none);
      if (!d) continue;
      flows++;
      assert.equal(Math.abs(d[0]) + Math.abs(d[1]), 1, `${x},${y}`);
      assert.ok(!carry(m, x, y, none).loop, `${x},${y} から ぐるぐる`);
    }
  }
  assert.ok(flows > 40, `流れる 砂 ${flows}マス`);
  // まん中の へやから 東へ のる 流れは、北へ 曲がって ありじごくへ
  const r = carry(m, 9, 8, none);
  assert.ok(r.pit, JSON.stringify(r));
  assert.ok(r.path.length > 5);
  const pit = m.warps.find((w) => w.x === r.x && w.y === r.y);
  assert.ok(pit && pit.to.map === PYR_LANDING.map, 'ありじごくは 2階へ');
  assert.equal(TILE_INFO[m.tiles[r.y * m.w + r.x]].pit, true);
  // ありじごくは みんな 2階の 小べや（3階への かいだんの となり）へ。そこから 3階へ すぐ もどれる
  const pits = m.warps.filter((w) => TILE_INFO[m.tiles[w.y * m.w + w.x]]?.pit);
  assert.ok(pits.length >= 3);
  for (const w of pits) assert.deepEqual(w.to, { map: PYR_LANDING.map, x: PYR_LANDING.x, y: PYR_LANDING.y, dir: 'down' });
  const p2 = MAPS.pyramid2;
  assert.ok(!isBlocked(p2, Math.floor(PYR_LANDING.x), Math.floor(PYR_LANDING.y), none));
  assert.ok(Math.abs(PYR_LANDING.x - PYR_STAIRS.up2.x) + Math.abs(PYR_LANDING.y - PYR_STAIRS.up2.y) < 14, '小べやは 3階への かいだんの 近く');
  // じっさいに ふむ: サーバーが 2階へ おとす
  const { bot } = await setup(4106, 'c4_pyramid');
  await place(bot, 'pyramid3', r.x - 1, r.y);
  await stepOn(bot, r.x, r.y);
  assert.equal(bot.map, PYR_LANDING.map);
  assert.ok(Math.abs(bot.x - PYR_LANDING.x) < 0.01 && Math.abs(bot.y - PYR_LANDING.y) < 0.01);
});

test('3階の 迷路: 流れに のって 4階への かいだんまで 行ける。レバーで 近道が 開く（入口 → まん中の へや → かいだんの へや）', () => {
  const m = MAPS.pyramid3;
  const start = [PYR_STAIRS.down3.x, PYR_STAIRS.down3.y - 1];
  const goal = [PYR_STAIRS.up3.x, PYR_STAIRS.up3.y + 1];
  assert.ok(flowCanReach(m, start, goal, () => false), 'レバーなしでも 行ける');
  // レバー（9）は どちらも 行ける ところ
  const r0 = flowReach(m, start, () => false);
  const near = (r, x, y) => [[0, 1], [1, 0], [-1, 0], [0, -1]].some(([dx, dy]) => r.stops.has(key(x + dx, y + dy)));
  const levers = m.actions.filter((a) => a.script.startsWith('c4_pyr_lever'));
  assert.equal(levers.length, 2);
  for (const a of levers) assert.ok(near(r0, a.x, a.y), `レバー ${a.x},${a.y}`);
  // 近道の 石の とびら
  const doors = m.gates.filter((g) => g.closed === T.PYR_SLAB);
  assert.equal(doors.length, 2);
  for (const g of doors) {
    assert.ok(isBlocked(m, g.x, g.y, () => false), 'しまっている');
    assert.ok(!isBlocked(m, g.x, g.y, (f) => f === g.flag), 'レバーで 開く');
  }
  // レバーを 引くと、流れに のらずに 入口から かいだんの へやへ 歩いて 行ける
  const has = hasOf(Object.values(PYR_LEVERS));
  const walk = new Set();
  const q = [start];
  walk.add(key(...start));
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (walk.has(key(nx, ny)) || isBlocked(m, nx, ny, has) || flowAt(m, nx, ny, has) || m.warps.some((w) => w.x === nx && w.y === ny)) continue;
      walk.add(key(nx, ny));
      q.push([nx, ny]);
    }
  }
  assert.ok(walk.has(key(...goal)), '近道で 歩いて 行ける');
  assert.ok(m.signs.length >= 1, '流れる 砂の かんばん');
  // 宝箱は 流れの 入口を ふさがない（あけた あとも 宝箱は のこる）
  for (const ch of m.chests) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) assert.ok(!flowAt(m, ch.x + dx, ch.y + dy, () => false), `宝箱 ${ch.id} の となりは 流れる 砂では ない`);
  }
});

// ───────────── 糸・羽・ルーラ ─────────────
test('ピラミッドの 中: みちびきの糸・帰り道の羽・ルーラは 使えない（道具も MPも へらない）。外に 出れば 使える', async () => {
  const { bot, c } = await setup(4107, 'c4_pyramid', hour(12), 'mage');
  c.level = 34;
  addItem(c, ESCAPE_ITEM, 1);
  addItem(c, 'return_wing', 1);
  c.visited = { ...(c.visited || {}), hoshifuru: true };
  for (const id of PYRAMID_MAPS) {
    await place(bot, id, ...firstFloor(MAPS[id]));
    bot.send({ t: 'menu', action: 'useItem', id: ESCAPE_ITEM });
    await bot.settle();
    assert.equal(bot.map, id, `${id}: 糸で 外へ 出ない`);
    assert.equal(itemCount(c, ESCAPE_ITEM), 1);
    assert.ok(lastMenu(bot).text.includes('ふしぎな力にはばまれて'), lastMenu(bot).text);
    bot.send({ t: 'menu', action: 'useItem', id: 'return_wing', place: 'hoshifuru' });
    await bot.settle();
    assert.equal(bot.map, id, `${id}: 羽で とばない`);
    assert.equal(itemCount(c, 'return_wing'), 1);
    assert.ok(lastMenu(bot).text.includes('ふしぎな力にはばまれて'));
  }
  // ルーラ（洞窟と おなじく 天井に ぶつかる）
  const rura = Object.keys(ABILITIES).find((id) => ABILITIES[id].effect?.type === 'warp' && ABILITIES[id].field);
  c.abilities = [...new Set([...(c.abilities || []), rura])];
  const mp0 = c.mp;
  bot.send({ t: 'menu', action: 'cast', id: rura, place: 'hoshifuru', who: 'self' });
  await bot.settle();
  assert.equal(bot.map, 'pyramid4');
  assert.equal(c.mp, mp0);
  // ふつうの 洞窟（北の古井戸）では 糸が 使える
  await place(bot, 'north_well', ...firstFloor(MAPS.north_well));
  bot.send({ t: 'menu', action: 'useItem', id: ESCAPE_ITEM });
  await bot.settle();
  assert.equal(bot.map, 'south', '古井戸では 外へ 出る');
  assert.equal(itemCount(c, ESCAPE_ITEM), 0);
});
// 入口の ちかくの ゆか
function firstFloor(m) {
  const w = m.warps[0];
  for (const [dx, dy] of [[0, -1], [0, 1], [1, 0], [-1, 0]]) {
    const x = w.x + dx, y = w.y + dy;
    if (!isBlocked(m, x, y, () => false) && !m.warps.some((o) => o.x === x && o.y === y)) return [x, y];
  }
  throw new Error(`${m.id}: 入口の ゆか`);
}

// ───────────── 4階: かくしべやの のろいの宝 ─────────────
test('のろいの宝: ひびの 入った かべの おくの「王家の黄金の剣」。とると ピラミッドの 中だけ 魔物が ふえ、外に 出ると とける', async () => {
  const { world, bot, c } = await setup(4108, 'c4_pyramid');
  Object.assign(c.flags, { [PYR_DOOR_FLAG]: true });
  const p4 = MAPS.pyramid4;
  // ひびの 入った かべ（西）は しらべて くずす
  const crack = PYR4_POS.crack;
  assert.ok(isBlocked(p4, crack.x, crack.y, () => false));
  await place(bot, 'pyramid4', crack.x + 1, crack.y, 'left');
  bot.choice = 0;
  await bot.examine(crack.x, crack.y);
  assert.ok(c.flags[PYR_CRACK_FLAG], 'かべが くずれた');
  assert.ok(!isBlocked(p4, crack.x, crack.y, (f) => !!c.flags[f]));
  // 剣を ぬく
  const sword = p4.npcById.gold_sword;
  await bot.walkTo(Math.floor(sword.x), Math.floor(sword.y) + 1);
  await bot.talk('gold_sword');
  assert.ok(c.flags[GOLD_SWORD_FLAG] && c.pyrCurse, 'のろわれた');
  assert.ok(itemCount(c, 'royal_gold_sword') === 1 || Object.values(c.equip).includes('royal_gold_sword'));
  assert.ok(ITEMS.royal_gold_sword.atk > ITEMS.shamshir.atk, 'とても 強い 剣');
  // のろわれた 人が いる ピラミッドの マップだけ 魔物が ふえる（ほかの マップや、のろいが ない 人は ふつう）
  const players = (curse) => [{ x: 13.5, y: 18.5, night: false, char: { pyrCurse: curse } }];
  assert.ok(cursedOn('pyramid4', players(true)) && !cursedOn('pyramid4', players(false)) && !cursedOn('south', players(true)));
  const fill = (curse, mapId = 'pyramid1') => {
    const ms = mapState(world, mapId);
    ms.symbols.clear();
    ms.spawnTimer = 0;
    for (let i = 0; i < 80; i++) { ms.spawnTimer = 0; spawnSymbols(world, ms, 1000, [{ x: 15.5, y: 23.5, night: false, char: { pyrCurse: curse } }]); }
    return ms.symbols.size;
  };
  const base = MAPS.pyramid1.spawnCounts.s_pyr1;
  assert.equal(fill(false), base, 'ふつう');
  assert.equal(fill(true), Math.round(base * CURSE_SPAWN), 'のろい');
  assert.ok(CURSE_SPAWN >= 2);
  // ピラミッドの 中を 歩いても とけない
  await place(bot, 'pyramid3', PYR_STAIRS.down3.x, PYR_STAIRS.down3.y - 1);
  assert.ok(c.pyrCurse, '3階でも のろわれた まま');
  // 外に 出ると とける
  const from = bot.msgs.length;
  await place(bot, 'pyramid1', PYR_STAIRS.exit1.x, PYR_STAIRS.exit1.y - 1);
  await stepOn(bot, PYR_STAIRS.exit1.x, PYR_STAIRS.exit1.y);
  assert.equal(bot.map, 'south');
  assert.ok(!c.pyrCurse, 'のろいが とけた');
  assert.ok(bot.msgs.slice(from).some((m) => m.t === 'toast' && m.text.includes('のろいがとけた')));
  // 剣は もう 台に ない（もう一度 のろわれない）
  const again = SCRIPTS.c4_gold_sword({ c: { name: 'ソラ' }, name: 'ソラ', flag: (f) => !!c.flags[f], has: () => false, count: () => 0 });
  assert.ok(!again.some((s) => s[0] === 'curse'));
});

// ───────────── ボス: ミイラの王アンク ─────────────
function ankuBattle(seed = 5, lv = 33) {
  const party = [makeChar('warrior', lv, 10, 'せんし', 33), makeChar('priest', lv, 10, 'そうりょ', 33), makeChar('mage', lv, 10, 'まほう', 33), makeChar('monk', lv, 10, 'ぶとう', 33)];
  const enc = FIXED_ENCOUNTERS.mummy_king;
  const enemies = enc.group.flatMap(([sp, n]) => Array(n).fill(sp));
  const b = new Battle({ rng: makeRng(seed), allies: party.map((c) => ({ char: c, kind: 'support', auto: true, tactics: 'balanced' })), enemies, boss: true, canFlee: false });
  const anku = b.enemies.find((e) => e.species === 'mummy_king');
  return { b, anku, mummies: b.enemies.filter((e) => e.species === 'royal_mummy') };
}
const evOf = (c) => ({ t: 'act', id: c.id, lines: [], upd: [], fx: null });
// アンクに よみがえりの呪文を となえさせる（前ぶれ）
function chant(b, anku) {
  const ev = evOf(anku);
  b.applyAbility(anku, ABILITIES.m_anku_chant, {}, ev, 1);
  return ev;
}
function hit(b, t, dmg) {
  const ev = evOf(b.allies[0]);
  b.damage(b.allies[0], t, dmg, ev, { element: 'phys' });
  return ev;
}

test('ミイラの王アンク: データ（Lv33・HP6500・2回行動・炎と光が 弱点・闇と 毒に 強い）。王のミイラ兵 2体と はじまり、王家のうでわを 落とす', () => {
  const m = MONSTERS.mummy_king;
  assert.equal(m.lv, 33);
  assert.equal(m.hp, 6500);
  assert.ok(m.boss && m.turns === 2 && m.size === 'xl');
  assert.ok(m.resist.fire > 1 && m.resist.light > 1, '炎・光が 弱点');
  assert.ok(m.resist.dark < 1 && m.resist.poison < 0.5, '闇・毒に 強い');
  assert.deepEqual(m.drops.boss, ['royal_bracelet']);
  assert.ok(ITEMS.royal_bracelet.unique && ITEMS.royal_bracelet.type === 'acc');
  const enc = FIXED_ENCOUNTERS.mummy_king;
  assert.deepEqual(enc.group, [['mummy_king', 1, 1], ['royal_mummy', 2, 2]]);
  assert.ok(enc.boss && !enc.canFlee);
  assert.equal(enc.bg, 'pyramid_boss');
  assert.equal(enc.bgm, 'pharaoh');
  assert.ok(Math.abs(MONSTERS.royal_mummy.hp - 900) <= 100, '王のミイラ兵は HP 900 くらい');
  // 技: こうげき・ミイラの手（MPを すう）・王の呪い（みんなに 毒と マヌーサ）・よみがえりの呪文（前ぶれ）
  const ids = m.actions.map((a) => a.id);
  for (const id of ['attack', 'm_anku_hand', 'm_anku_curse_charge', 'm_anku_chant']) assert.ok(ids.includes(id), id);
  assert.equal(ABILITIES.m_anku_hand.effect.type, 'drainMp');
  assert.equal(ABILITIES.m_anku_curse_charge.effect.type, 'telegraph', '王の呪いも 前ぶれが ある');
  assert.equal(ABILITIES.m_anku_curse.target, 'enemies');
  assert.equal(ABILITIES.m_anku_curse.effect.status, 'poison');
  assert.equal(ABILITIES.m_anku_curse.effect.also.status, 'blind', 'マヌーサ');
  assert.equal(ABILITIES.m_anku_chant.cast, '{a}は、古い言葉をとなえ始めた…');
  assert.equal(ABILITIES.m_anku_chant.effect.chant, 0.1, 'HPの 1わりで 止まる');
  // ボスの 4階: 王のへやに 入ると はじまる。たおすと 月の鏡が あらわれる
  const p4 = MAPS.pyramid4;
  assert.ok(p4.npcById.mummy_king.big && p4.npcById.mummy_king.sprite === 'mon:mummy_king');
  assert.ok(p4.triggers.some((t) => t.script === 'c4_anku_event'));
  assert.deepEqual(p4.npcById.pyr_mirror.show, { all: ['c4_anku'], not: ['c4_mirror'] });
});

test('よみがえりの呪文: 前ぶれ → つぎの 番に たおれた 王のミイラ兵が 生き返る。となえて いる あいだに HPの 1わりの ダメージで 止まる', () => {
  // 止めない ばあい
  const { b, anku, mummies } = ankuBattle(11);
  b.kill(mummies[0]);
  assert.ok(!mummies[0].alive);
  const ev = chant(b, anku);
  assert.ok(ev.warn && ev.fx.type === 'telegraph' && ev.fx.chant, '前ぶれ');
  assert.ok(ev.lines.some((l) => l.includes('呪文を止められそうだ')), ev.lines.join('/'));
  assert.ok(anku.chant && anku.chant.need === 650);
  assert.equal(anku.telegraph, 'm_anku_revive');
  assert.ok(b.snapshot().combatants.find((x) => x.id === anku.id).chant === 0, 'がめんの ゲージ');
  hit(b, anku, 600); // 1わりに たりない
  assert.ok(anku.chant && anku.chant.dmg === 600);
  assert.ok(Math.abs(b.snapshot().combatants.find((x) => x.id === anku.id).chant - 600 / 650) < 0.01);
  b.queue.push({ id: anku.id, cmd: { type: 'ai' }, last: true });
  const evs = [];
  b.emit = (e) => evs.push(e);
  b.executeNext();
  assert.ok(mummies[0].alive && mummies[0].hp > 0, '生き返った');
  assert.ok(evs.some((e) => (e.lines || []).some((l) => l.includes('生き返った'))), JSON.stringify(evs.map((e) => e.lines)));
  // 止める ばあい（となえて いる あいだの ダメージを あわせて 650）
  const c2 = ankuBattle(12);
  c2.b.kill(c2.mummies[1]);
  chant(c2.b, c2.anku);
  hit(c2.b, c2.anku, 400);
  const e2 = hit(c2.b, c2.anku, 260);
  assert.ok(e2.lines.includes('ミイラの王アンクの呪文がとぎれた！'), e2.lines.join('/'));
  assert.equal(e2.chantBreak, c2.anku.id);
  assert.equal(c2.anku.chant, null);
  assert.equal(c2.anku.telegraph, null);
  c2.b.queue.push({ id: c2.anku.id, cmd: { type: 'ai' }, last: true });
  c2.b.emit = () => {};
  c2.b.executeNext();
  assert.ok(!c2.mummies[1].alive, '生き返らない');
  // たおれた 王のミイラ兵が いない ときは となえない（いる ときは よく となえる）
  const chantCond = MONSTERS.mummy_king.actions.find((x) => x.id === 'm_anku_chant').cond;
  assert.ok(chantCond.includes('deadFriend:royal_mummy'));
  // オートの 仲間（前ぶれに 気づく）は、となえて いる アンクを ねらう
  const c4 = ankuBattle(14);
  c4.b.kill(c4.mummies[0]);
  chant(c4.b, c4.anku);
  let aimed = 0;
  for (let i = 0; i < 20; i++) {
    const cmd = decideAlly(c4.b, c4.b.allies[2]);
    if (cmd.target === c4.anku.id) aimed++;
  }
  assert.ok(aimed >= 15, `アンクを ねらう ${aimed}/20`);
});

test('ミイラの王アンク: HP半分で 王のミイラ兵が 2体 ふえ、4分の1で「王のいかり」（攻撃力 アップ）。たおすと 王のミイラ兵も くずれおちる', () => {
  const { b, anku } = ankuBattle(21);
  const n0 = b.enemies.length;
  hit(b, anku, Math.ceil(anku.maxHp * 0.5) + 10);
  assert.equal(b.enemies.filter((e) => e.species === 'royal_mummy').length, 4, 'HP半分で 2体 ふえる');
  assert.equal(b.enemies.length, n0 + 2);
  const atk0 = anku.buffs?.atk?.mult || 1;
  hit(b, anku, Math.ceil(anku.maxHp * 0.3));
  assert.ok((anku.buffs?.atk?.mult || 1) > atk0, '王のいかり');
  // たおすと、王のミイラ兵も みんな くずれおちて 勝ち
  const ev = hit(b, anku, anku.hp);
  assert.ok(!anku.alive);
  assert.ok(b.enemies.every((e) => !e.alive), 'みんな くずれた');
  assert.ok(ev.lines.some((l) => l.includes('くずれおちた')), ev.lines.join('/'));
  b.checkEnd();
  assert.equal(b.pendingEnd?.outcome, 'win');
});

test('ミイラ兵（フィールド）: たおしても 1回だけ 起き上がる。炎か 光で とどめを さすと 起き上がれない', () => {
  const party = [makeChar('warrior', 32, 10, 'せんし', 33)];
  const mk = () => new Battle({ rng: makeRng(31), allies: party.map((c) => ({ char: c, kind: 'support', auto: true })), enemies: ['mummy_soldier'], canFlee: true });
  const b = mk();
  const m = b.enemies[0];
  const ev = evOf(b.allies[0]);
  b.damage(b.allies[0], m, m.hp + 10, ev, { element: 'phys' });
  assert.ok(m.alive && m.hp > 0 && m.revived, '起き上がった');
  assert.ok(ev.lines.some((l) => l.includes('起き上がった')));
  b.damage(b.allies[0], m, m.hp + 10, evOf(b.allies[0]), { element: 'phys' });
  assert.ok(!m.alive, '2回目は たおれる');
  for (const el of ['fire', 'light']) {
    const b2 = mk();
    const m2 = b2.enemies[0];
    const e2 = evOf(b2.allies[0]);
    b2.damage(b2.allies[0], m2, m2.hp + 10, e2, { element: el });
    assert.ok(!m2.alive, `${el} で とどめ`);
  }
  // のろいのつぼ: MPを すう・金色の つぼの ふり（にげても よい）
  assert.ok(MONSTERS.cursed_pot.actions.some((a) => ABILITIES[a.id]?.effect?.type === 'drainMp'));
  assert.ok(FIXED_ENCOUNTERS.pot_ambush.canFlee);
  // 砂岩ゴーレム: ふりかぶる（前ぶれ）→ 大ぶり
  assert.equal(ABILITIES.m_golem_windup.effect.type, 'telegraph');
});

test('第4章の 新しい 魔物: 王都のまわり・ピラミッドの 魔物は Lv31〜34。出現表・落とす物・図鑑の せつめいが ある', () => {
  for (const id of ['mummy_soldier', 'cursed_pot', 'sandstone_golem', 'lamp_genie', 'royal_mummy']) {
    const m = MONSTERS[id];
    assert.ok(m.lv >= 31 && m.lv <= 34, `${id} Lv${m.lv}`);
    assert.ok(m.desc && m.drops.common && m.drops.rare, id);
  }
  const used = new Set(Object.entries(ENCOUNTER_TABLES).filter(([k]) => k.startsWith('s_p')).flatMap(([, t]) => t.flatMap((e) => e.group.map((g) => g[0]))));
  for (const id of ['mummy_soldier', 'cursed_pot', 'sandstone_golem', 'lamp_genie']) assert.ok(used.has(id), `${id} は 出現表に いる`);
  assert.ok(MONSTERS.lamp_genie.night, 'ランプの魔人は 夜の 砂ばく');
});

// ───────────── 物語の すすみぐあい・目標 ─────────────
test('すすみぐあい: c4_pyramid → c4_anku → c4_mirror。目標・仲間会話・地図の しるし。むかしの Step 3 の セーブも なおる', () => {
  const song = CH4_STEPS.indexOf('c4_song');
  assert.deepEqual(CH4_STEPS.slice(song, song + 4), ['c4_song', 'c4_pyramid', 'c4_anku', 'c4_mirror']);
  for (const f of ['c4_pyramid', 'c4_anku', 'c4_mirror']) assert.ok(STORY_STEPS.includes(f), f);
  const f = (...l) => ({ flags: Object.fromEntries([...UPTO('c4_song'), 'c4_hassan', ...l].map((k) => [k, true])) });
  assert.equal(objectiveFromFlags(f()), C4_OBJ.song);
  assert.equal(objectiveFromFlags(f('c4_pyramid')), C4_OBJ.pyramid);
  assert.equal(objectiveFromFlags(f('c4_pyramid', 'c4_pb_star')), C4_OBJ.pb);
  assert.equal(objectiveFromFlags(f('c4_pyramid', 'c4_pb_star', 'c4_pyr2_seen')), C4_OBJ.pyr2);
  assert.equal(objectiveFromFlags(f('c4_pyramid', 'c4_pb_star', 'c4_pyr2_seen', 'c4_pyr3_seen')), C4_OBJ.pyr3);
  assert.equal(objectiveFromFlags(f('c4_pyramid', 'c4_pb_star', 'c4_pyr2_seen', 'c4_pyr3_seen', 'c4_pyr4_seen')), C4_OBJ.pyr4);
  assert.equal(objectiveFromFlags(f('c4_pyramid', 'c4_pb_star', 'c4_pyr4_seen', 'c4_anku')), C4_OBJ.anku);
  assert.equal(objectiveFromFlags(f('c4_pyramid', 'c4_anku', 'c4_mirror')), C4_OBJ.mirror);
  // Step 4 の さいごの 文（続きはアップデートで！）は OLD_C4_OBJ.mirror に のこり、Step 5 から 夜の 宮殿の 目標（test/ch4-zaid.test.js）
  assert.ok(OLD_C4_OBJ.mirror.startsWith('第4章の続きはアップデートで！（') && OLD_C4_OBJ.mirror.includes('月の鏡'));
  assert.ok(C4_OBJ.mirror.includes('月の鏡') && C4_OBJ.mirror.includes('夜'));
  for (const k of ['song', 'pyramid', 'pb', 'pyr2', 'pyr3', 'pyr4', 'anku', 'mirror']) {
    const t = C4_OBJ[k];
    assert.ok(KNOWN_OBJECTIVES.has(t), k);
    for (const kind of ['self', 'bold', 'kind', 'kid']) assert.ok(talkFor(t, kind) !== `次は「${t.replace(/\n/g, '')}」ですね。`, `仲間会話: ${k} ${kind}`);
  }
  // 地図の しるし: オベリスク → ピラミッドの 入口 → かいだん → アンク → 月の鏡
  const mark = (obj, map, flags = {}) => questMarks({ flags, objective: obj }, map).filter((m) => m.kind === 'main');
  assert.ok(mark(C4_OBJ.song, 'south').some((m) => m.x === PYRAMID_POS.obelisk.x && m.y === PYRAMID_POS.obelisk.y), 'オベリスク');
  assert.ok(mark(C4_OBJ.pyramid, 'south').some((m) => m.x === D.x && m.y === D.y), 'ピラミッドの 入口');
  assert.ok(mark(C4_OBJ.pb, 'pyramid1').some((m) => m.x === PYR_STAIRS.up1.x && m.y === PYR_STAIRS.up1.y));
  assert.ok(mark(C4_OBJ.pyr2, 'pyramid2').some((m) => m.x === PYR_STAIRS.up2.x && m.y === PYR_STAIRS.up2.y));
  assert.ok(mark(C4_OBJ.pyr3, 'pyramid3').some((m) => m.x === PYR_STAIRS.up3.x && m.y === PYR_STAIRS.up3.y));
  assert.ok(mark(C4_OBJ.pyr4, 'pyramid4').length, 'アンク');
  assert.ok(mark(C4_OBJ.anku, 'pyramid4', { c4_anku: true }).length, '月の鏡');
  // むかしの Step 3 の さいごの 文（続きはアップデートで！）は 今の 文に なおる
  const old = { flags: f().flags, objective: OLD_C4_OBJ.song };
  assert.ok(!KNOWN_OBJECTIVES.has(OLD_C4_OBJ.song));
  assert.ok(repairObjective(old));
  assert.equal(old.objective, C4_OBJ.song);
  // 月の鏡は だいじなもの（せつめい つき）
  assert.equal(ITEMS.moon_mirror.type, 'key');
  assert.ok(ITEMS.moon_mirror.desc.includes('本当のすがた'));
});

test('ミイラの王アンクを たおして 月の鏡を 手に入れる（王のへやの 戦い → 鏡 → 目標）', async () => {
  const { world, bot, c } = await setup(4109, 'c4_pyramid');
  Object.assign(c.flags, { [PYR_DOOR_FLAG]: true, c4_pyr2_seen: true, c4_pyr3_seen: true, c4_pyr4_seen: true });
  c.objective = objectiveFromFlags(c);
  assert.equal(c.objective, C4_OBJ.pyr4);
  await place(bot, 'pyramid4', 13, 10);
  bot.keepResult = false;
  // 王のへやに 入ると アンクが 目を覚まして 戦いに なる
  bot.x = 13.5; bot.y = 8.5;
  bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'up', moving: true, seq: bot.seq });
  for (let i = 0; i < 400 && !world.battles.size; i++) { bot.flushQueue(); await tickN(world, 1); }
  assert.equal(world.battles.size, 1, '戦いが はじまった');
  const ctx = [...world.battles.values()][0];
  assert.equal(ctx.battle.snapshot().bg, 'pyramid_boss');
  assert.ok(!ctx.battle.noSpells, '4階は 呪文が 使える');
  const anku = ctx.battle.enemies.find((e) => e.species === 'mummy_king');
  // アンクを たおす（王のミイラ兵も くずれおちる）
  const ev = { t: 'act', id: ctx.battle.allies[0].id, lines: [], upd: [], fx: null };
  ctx.battle.damage(ctx.battle.allies[0], anku, anku.hp, ev, { element: 'fire' });
  ctx.battle.checkEnd();
  await bot.settle();
  for (let i = 0; i < 6; i++) await bot.settle();
  assert.ok(c.flags.c4_anku, 'アンクを たおした');
  assert.equal(c.objective, C4_OBJ.anku);
  assert.ok(itemCount(c, 'royal_bracelet') >= 1 || Object.values(c.equip).includes('royal_bracelet'), '王家のうでわ');
  // 月の鏡
  const mirror = MAPS.pyramid4.npcById.pyr_mirror;
  await bot.walkTo(Math.floor(mirror.x), Math.floor(mirror.y) + 1);
  await bot.talk('pyr_mirror');
  assert.ok(c.flags.c4_mirror);
  assert.ok(c.keyItems.includes('moon_mirror'), 'だいじなもの');
  assert.equal(c.objective, C4_OBJ.mirror);
  for (const f of CH4_STEPS.slice(0, CH4_STEPS.indexOf('c4_mirror') + 1)) assert.ok(c.flags[f], f);
});

// ───────────── 家族で ─────────────
test('家族で: とびらは リーダーの 時計（昼）で 開く。手伝いの 人が しらべても、リーダーの 物語が すすむ', { timeout: 120000 }, async () => {
  const clock = { now: at(hour(9)) };
  const world = new GameWorld({ offline: false, rng: makeRng(4110), checkPassword: (pw) => pw === 'ほし', rateLimit: false, now: () => clock.now });
  const papa = new Bot(world, 'パパ');
  const yui = new Bot(world, 'ユイ');
  await papa.login('ほし');
  await yui.login('ほし');
  await papa.createAndPlay('warrior');
  await yui.createAndPlay('mage');
  await papa.settle();
  await yui.settle();
  const Pa = world.sessions.get(papa.sid), Y = world.sessions.get(yui.sid);
  for (const f of [...UPTO('c4_song'), 'c4_hassan', ...SONG_FLAGS]) Pa.char.flags[f] = true;
  Pa.char.objective = C4_OBJ.song;
  // パパは 宿屋で 昼まで 休んだ（12時）。ユイの 時計は 朝の 9時の まま
  Pa.char.timeShift = Math.round((hour(12) - hour(9)) * DAY_MS);
  Y.char.timeShift = 0;
  const yuiBefore = JSON.stringify({ flags: Y.char.flags, objective: Y.char.objective });
  papa.send({ t: 'party', action: 'invite', sid: Y.id });
  yui.send({ t: 'party', action: 'accept' });
  await papa.settle();
  await yui.settle();
  assert.ok(isNoonFrac(fracFor(world, Y)), 'ユイも リーダーの 時計（昼）');
  world.placeSession(Pa, 'south', D.x - 0.5, D.y + 1.5, 'up', true);
  world.placeSession(Y, 'south', D.x + 0.5, D.y + 1.5, 'up', true);
  await papa.settle();
  await yui.settle();
  yui.send({ t: 'interact', kind: 'tile', x: D.x, y: D.y });
  for (let i = 0; i < 4; i++) {
    await yui.settle();
    await papa.settle();
  }
  assert.ok(Pa.char.flags[PYRAMID_FLAG], 'パパの 物語が すすむ');
  assert.equal(Pa.char.objective, C4_OBJ.pyramid);
  assert.equal(JSON.stringify({ flags: Y.char.flags, objective: Y.char.objective }), yuiBefore, 'ユイの 物語は そのまま');
  assert.ok(said(yui, 'とびらの太陽のしるしに、ぴたりと重なった'), 'ユイも 見ている');
  // 1階の ボタンも リーダーの 世界: ユイが おしても パパの フラグ
  world.placeSession(Pa, 'pyramid1', 13.5, 13.5, 'up', true);
  world.placeSession(Y, 'pyramid1', 13.5, 14.5, 'up', true);
  await papa.settle();
  await yui.settle();
  yui.send({ t: 'interact', kind: 'tile', x: 13, y: 12 });
  for (let i = 0; i < 4; i++) {
    await yui.settle();
    await papa.settle();
  }
  assert.ok(Pa.char.flags.c4_pb_sun, 'パパの ボタン');
  assert.ok(!Y.char.flags.c4_pb_sun, 'ユイの フラグは そのまま');
});

// ───────────── 絵・音（ブラウザ なしで しらべられる ところ）─────────────
test('ピラミッドの 絵: 新しい タイルは ぜんぶ 16×16 を ぬる。ピラミッドの マップの タイルは ぜんぶ 絵が あり、金色の 石に 色がえ', async () => {
  const { paintTile, hasTileArt, prepareMap, isAnimated } = await import('../public/js/client/render/tiles.js');
  const { PYRAMID_PAINTERS, PYRAMID_EXTRAS } = await import('../public/js/client/render/tiles-pyramid.js');
  const { partOfTile, partOfExtra, themeRgb } = await import('../public/js/client/render/themes.js');
  const HEX = /^#[0-9a-f]{6}$/i;
  const full = (p, what) => {
    assert.equal(p.px.filter((c) => !c).length, 0, `${what}: ぬられていない ドット`);
    assert.ok(p.px.every((c) => HEX.test(c)), `${what}: いろ`);
  };
  for (let id = T.PYRAMID; id <= T.SEAL_RUNE; id++) {
    assert.ok(PYRAMID_PAINTERS[id] && hasTileArt(id), TILE_INFO[id].name);
    assert.equal(partOfTile(id), 'none', `${TILE_INFO[id].name}: 色を かえない`);
    for (const m of [0, 1, 2, 5, 10, 7 | (14 << 4), 255]) for (const f of [0, 1, 3]) full(paintTile(id, 1, f, m), `${TILE_INFO[id].name} m${m} f${f}`);
  }
  // 流れる 砂・ありじごくは うごく。流れる 砂の 矢じるしは コマで すすむ
  for (const id of [T.FLOW_N, T.FLOW_E, T.FLOW_S, T.FLOW_W, T.SAND_PIT]) {
    assert.ok(isAnimated(id));
    assert.notEqual(paintTile(id, 0, 0, 0).px.join(), paintTile(id, 0, 1, 0).px.join(), TILE_INFO[id].name);
  }
  // 光った ボタンは ちがう 絵
  for (const [a, b] of [[T.BTN_SUN, T.BTN_SUN_ON], [T.BTN_STAR, T.BTN_STAR_ON]]) assert.notEqual(paintTile(a).px.join(), paintTile(b).px.join());
  // ピラミッドの マップの タイル（とびらが 開いた あとも）
  for (const id of ['south', ...PYRAMID_MAPS]) {
    const m = MAPS[id];
    const ids = new Set(m.tiles);
    for (const g of m.gates) { ids.add(g.open); ids.add(g.closed); }
    for (const t of ids) assert.ok(hasTileArt(t), `${id}: ${TILE_INFO[t]?.name ?? t}`);
  }
  // フィールドの ピラミッド: 15×15 で 1つの 大きな 絵（となりの マスと つながる）。てっぺんは 金色
  const r = prepareMap(MAPS.south);
  const at = (x, y) => r.mask[y * MAPS.south.w + x];
  assert.equal(at(PYRAMID.x, PYRAMID.y), 0);
  assert.equal(at(PYRAMID.x + 7, PYRAMID.y + 7), 7 | (7 << 4));
  assert.equal(at(D.x, D.y), 7 | (14 << 4), 'とびらも ピラミッドの いち');
  const top = paintTile(T.PYRAMID, 0, 0, 7 | (7 << 4));
  assert.ok(top.get(8, 8) && parseInt(top.get(8, 8).slice(1, 3), 16) > 0xe0, 'てっぺんの 金');
  // オベリスクの 影は オベリスクに つながる（北へ のびる 影は 南の オベリスクと つながる）
  const sh = r.mask[(PYRAMID_POS.obelisk.y - 1) * MAPS.south.w + PYRAMID_POS.obelisk.x];
  assert.ok(sh & 4, '影は オベリスクから');
  // ピラミッドの 中の ゆか・かべは あたたかい 金色
  const floor = themeRgb(0x4a, 0x40, 0x38, 'pyramid', 'floor'), wall = themeRgb(0x4b, 0x3d, 0x33, 'pyramid', 'wall');
  assert.ok(floor[0] > floor[2] + 50 && floor[0] > 0x9a, `ゆか ${floor}`);
  assert.ok(wall[0] > wall[2] + 40, `かべ ${wall}`);
  // 2.5D だけの え
  for (const name of Object.keys(PYRAMID_EXTRAS)) assert.equal(partOfExtra(name), 'none', name);
});

test('ピラミッドの 2.5D: だんだんの 山（まん中ほど 高い）・日時計の とびら・ボタンの 台・ひびの 入った かべ。オベリスク・つぼ・鏡・剣・ゆうれいの え', async () => {
  const { blockSpec } = await import('../public/js/client/render/field3d.js');
  const { hasExtra, extraPainter } = await import('../public/js/client/render/tex3d.js');
  const { paintSpecial, npcOpts, paintHuman } = await import('../public/js/client/render/chars.js');
  const h = (x, y) => blockSpec(T.PYRAMID, x, y).h;
  assert.ok(h(PYRAMID.x + 7, PYRAMID.y + 7) > h(PYRAMID.x + 3, PYRAMID.y + 7) && h(PYRAMID.x + 3, PYRAMID.y + 7) > h(PYRAMID.x, PYRAMID.y + 7), 'まん中ほど 高い');
  assert.ok(h(PYRAMID.x + 7, PYRAMID.y + 7) > 3, 'てっぺんは 山より 高い');
  const door = blockSpec(T.PYR_DOOR, D.x, D.y);
  assert.equal(door.h, h(PYRAMID.x, PYRAMID.y), 'とびらは いちばん 下の だんと おなじ 高さ');
  assert.deepEqual(door.south.slice(0, 2), ['t', T.PYR_DOOR]);
  assert.equal(blockSpec(T.PYR_GATE, D.x, D.y), null, '開いた とびらは 入れる');
  for (const id of [T.BTN_SUN, T.BTN_STAR_ON, T.SARCOPHAGUS, T.PYR_ALTAR]) assert.ok(blockSpec(id, 0, 0).h < 0.7, `${TILE_INFO[id].name} は ひくい`);
  for (const id of [T.PYR_CRACK, T.PYR_SLAB, T.PYR_GLYPH]) assert.equal(blockSpec(id, 0, 0).h, 1.6, `${TILE_INFO[id].name} は かべ`);
  for (const id of [T.SUN_SHADOW, T.OBELISK_BASE, T.FLOW_E, T.SAND_PIT, T.SEAL_RUNE]) assert.equal(blockSpec(id, 0, 0), null, `${TILE_INFO[id].name} は ゆか`);
  for (const id of [T.PYRAMID, T.PYR_DOOR, T.BTN_SUN, T.SARCOPHAGUS]) {
    for (const k of ['top', 'side']) {
      const key = blockSpec(id, 3, 4)[k];
      if (key[0] === 'x') {
        assert.ok(hasExtra(key[1]), key[1]);
        assert.ok(extraPainter(key[1], 1).px.every(Boolean), `${key[1]} を ぜんぶ ぬる`);
      }
    }
  }
  // オベリスク（人より ずっと 高い 石の 柱）・金色の つぼ・月の鏡・王家の黄金の剣・探検家の ゆうれい
  const ob = paintSpecial('obelisk', 'down', 0);
  assert.ok(ob && ob.h / (ob.res || 1) >= 40, 'オベリスクは 高い');
  for (const k of ['gold_pot', 'moon_mirror', 'gold_sword']) {
    const a = paintSpecial(k, 'down', 0), b = paintSpecial(k, 'down', 1);
    assert.ok(a && b && a.px.some(Boolean), k);
    assert.notEqual(a.px.join(), b.px.join(), `${k} は コマで うごく`);
  }
  const ghost = npcOpts('explorer_ghost');
  assert.ok(ghost && /^#/.test(ghost.skin), 'ゆうれいは 青白い');
  for (const dir of ['down', 'left', 'up']) assert.ok(paintHuman(dir, 0, ghost).px.some(Boolean));
  // ピラミッドの NPC は みんな え が ある
  for (const id of PYRAMID_MAPS) {
    for (const n of MAPS[id].npcs) assert.ok(n.sprite.startsWith('mon:') || npcOpts(n.sprite) || paintSpecial(n.sprite, 'down', 0), `${id} ${n.id}`);
  }
});

test('ピラミッドの 戦いの 背景・魔物の え・音楽', async () => {
  const { battleBgSpec } = await import('../public/js/client/render/battlefx.js');
  const { MONSTER_ART } = await import('../public/js/client/render/monsters.js');
  const { _TRACKS } = await import('../public/js/client/audio.js');
  assert.equal(battleBgSpec('pyramid').deco, 'pyramid');
  assert.equal(battleBgSpec('pyramid_boss').deco, 'pyramid_boss');
  for (const id of ['mummy_soldier', 'cursed_pot', 'sandstone_golem', 'lamp_genie', 'royal_mummy', 'mummy_king']) assert.ok(MONSTER_ART[id], id);
  // アンクは 大きい（王のミイラ兵 2体と ならんで がめんに はいる。あたまが がめんの 上に はみださない）
  const [w, hh] = MONSTER_ART.mummy_king.size;
  assert.ok(w >= 80 && hh >= 100 && hh + 2 <= 124, `${w}×${hh}`);
  const row = [w, MONSTER_ART.royal_mummy.size[0], MONSTER_ART.royal_mummy.size[0]].reduce((s, v) => s + v + 2 + 6, 0);
  assert.ok(row <= 256 - 12, `ならんだ はば ${row}`);
  // 音楽: ピラミッドの 中・アンクの 戦い
  for (const id of PYRAMID_MAPS) assert.ok(_TRACKS[MAPS[id].bgm], `${id}: ${MAPS[id].bgm}`);
  assert.ok(_TRACKS[FIXED_ENCOUNTERS.mummy_king.bgm], 'アンクの きょく');
  assert.notEqual(FIXED_ENCOUNTERS.mummy_king.bgm, 'boss', 'アンクは とくべつな きょく');
});
