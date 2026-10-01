// 宝の地図（せかいの しくみ）: 手に入れる・ほる・洞窟に 入る／出る・洞窟の 主・ごほうび
// データと 洞窟の 形は data/treasure.js と maps/treasure-cave.js
import { MAPS, isBlocked, tileAt, POS, PLACES } from '../maps/index.js?v=fd14dc666f0e';
import { SEA_POS } from '../maps/sea.js?v=fd14dc666f0e';
import { T, TILE_INFO } from '../tiles.js?v=fd14dc666f0e';
import { makeRng } from '../rng.js?v=fd14dc666f0e';
import { MONSTERS } from '../data/monsters.js?v=fd14dc666f0e';
import { TM_HOOKS } from '../data/story-tm.js?v=fd14dc666f0e';
import { FIXED_ENCOUNTERS } from '../data/encounters.js?v=fd14dc666f0e';
import { ScriptRun } from './scripts.js?v=fd14dc666f0e';
import {
  TM_MAX, TM_THEMES, caveInfo, tmTitle, floorMapId, parseFloorId, isTreasureMapId, clearedFlag, foundFlag, seed36, bossLvOf,
  mapDropRate, dropMapLevel, nextMapLevel, repairTreasureMaps,
} from '../data/treasure.js?v=fd14dc666f0e';

const HUNTER = '宝探しのダイゴ';

// ───────────── ほる 場所 ─────────────
// 行ける 地面（草・花・砂・丘・森の ゆか）。町・村・たいせつな 場所の そばは えらばない
const SPOT_TILES = new Set([T.GRASS, T.FLOWERS, T.TALLGRASS, T.SAND, T.HILL, T.FOREST_FLOOR]);
const spotCache = {};

function spotCandidates(mapId) {
  if (spotCache[mapId]) return spotCache[mapId];
  const m = MAPS[mapId];
  const start = mapId === 'sea' ? [Math.floor(SEA_POS.arrive.x), Math.floor(SEA_POS.arrive.y)] : POS.villagePlaza;
  // 海は 嵐の うずの 中（嵐の島）を のぞく。ミドリナ地方は 橋が なおった あと
  const hasFlag = mapId === 'sea' ? () => false : () => true;
  const seen = new Uint8Array(m.w * m.h);
  const q = [start];
  seen[start[1] * m.w + start[0]] = 1;
  const out = [];
  const marks = [
    ...m.warps.map((w) => [w.x, w.y, 4]), ...(m.signs || []).map((s) => [s.x, s.y, 3]), ...m.chests.map((c) => [c.x, c.y, 3]),
    ...m.npcs.map((n) => [Math.floor(n.x), Math.floor(n.y), 4]), ...(m.sparkles || []).map((s) => [s.x, s.y, 1]),
  ];
  const places = mapId === 'overworld' ? Object.values(PLACES) : [];
  while (q.length) {
    const [x, y] = q.pop();
    const tile = tileAt(m, x, y);
    if (SPOT_TILES.has(tile) && !m.zoneAt(x, y).startsWith('safe') && (mapId !== 'sea' || m.zoneAt(x, y) === 'isle')
      && !places.some((p) => x >= p.x - 3 && y >= p.y - 3 && x < p.x + p.w + 3 && y < p.y + p.h + 3)
      && !marks.some(([mx, my, r]) => Math.abs(mx - x) <= r && Math.abs(my - y) <= r)
      && !isBlocked(m, x, y + 1, hasFlag)) out.push([x, y]);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 1 || ny < 1 || nx >= m.w - 1 || ny >= m.h - 1 || seen[ny * m.w + nx]) continue;
      if (isBlocked(m, nx, ny, hasFlag)) continue;
      seen[ny * m.w + nx] = 1;
      q.push([nx, ny]);
    }
  }
  out.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  spotCache[mapId] = out;
  return out;
}

// seed から ほる 場所を きめる（avoid … ほかの 地図の 場所の そばは さける）
export function pickDigSpot(seed, mapId, avoid = []) {
  const list = spotCandidates(mapId);
  const r = makeRng((seed ^ 0x2c1b3c6d) >>> 0);
  let pick = null;
  for (let i = 0; i < 24; i++) {
    const [x, y] = list[Math.floor(r.next() * list.length)];
    pick = { map: mapId, x, y };
    if (!avoid.some((a) => a.map === mapId && Math.abs(a.x - x) + Math.abs(a.y - y) < 8)) break;
  }
  return pick;
}

// その 場所で まだ ほれるか（ほかの 人が マップを かえて、たてものが 建った ときなど）
function spotOk(tm) {
  const m = MAPS[tm.map];
  if (!m || tm.x < 0 || tm.y < 0 || tm.x >= m.w || tm.y >= m.h) return false;
  return SPOT_TILES.has(tileAt(m, tm.x, tm.y)) && !m.zoneAt(tm.x, tm.y).startsWith('safe');
}

// ───────────── 地図を もらう・捨てる ─────────────
function newSeed(world, c) {
  const have = new Set((c.treasureMaps || []).map((t) => t.seed));
  for (let i = 0; i < 50; i++) {
    const s = Math.floor(world.rng.next() * 0x7fffffff);
    if (!have.has(s)) return s;
  }
  return Math.floor(world.rng.next() * 0x7fffffff);
}

// 地図を 1まい わたす（いっぱいなら 主を たおした 古い 地図と 入れかえる。それも ないと null）
export function grantTreasureMap(world, c, { lv = 1, map = null } = {}) {
  c.treasureMaps = Array.isArray(c.treasureMaps) ? c.treasureMaps : [];
  if (c.treasureMaps.length >= TM_MAX) {
    const old = c.treasureMaps.filter((t) => t.cleared).sort((a, b) => (a.at || 0) - (b.at || 0))[0];
    if (!old) return null;
    removeTreasureMap(c, old.id);
  }
  const seed = newSeed(world, c);
  const canSail = !!c.flags?.c2_ship;
  const mapId = map || (canSail && makeRng(seed).chance(0.35) ? 'sea' : 'overworld');
  const spot = pickDigSpot(seed, mapId, c.treasureMaps);
  if (!spot) return null;
  const rec = { id: seed36(seed), seed, lv: Math.max(1, Math.floor(lv)), map: spot.map, x: spot.x, y: spot.y, found: false, cleared: false, at: world.now() };
  c.treasureMaps.push(rec);
  world.markDirty();
  return rec;
}

export function removeTreasureMap(c, id) {
  const list = Array.isArray(c.treasureMaps) ? c.treasureMaps : [];
  const rec = list.find((t) => t.id === id);
  if (!rec) return null;
  c.treasureMaps = list.filter((t) => t !== rec);
  // その 地図の 宝箱・フラグ・地図の きろくを わすれる（セーブが ふえすぎない ように）
  const key = seed36(rec.seed);
  const mine = (k) => k.startsWith(`tm_${key}_`) || k === `tmc_${key}` || k === `tmf_${key}`;
  for (const obj of [c.chests, c.flags, c.explored]) for (const k of Object.keys(obj || {})) if (mine(k)) delete obj[k];
  return rec;
}

// 持っていない 地図の 洞窟の フラグと、主を たおした（持っていない）洞窟の 地図の きろくを わすれる（セーブが ふえすぎない ように）
// 宝箱は のこす（手伝った 洞窟の 宝箱を 何回も 開けない ように）
export function pruneTreasureData(c) {
  const list = c.treasureMaps || [];
  const held = new Set(list.map((t) => seed36(t.seed)));
  const active = new Set(list.filter((t) => !t.cleared).map((t) => seed36(t.seed)));
  for (const k of Object.keys(c.flags || {})) {
    if ((k.startsWith('tmc_') || k.startsWith('tmf_')) && !held.has(k.slice(4))) delete c.flags[k];
  }
  for (const k of Object.keys(c.explored || {})) if (k.startsWith('tm_') && !active.has(k.slice(3).split('_')[0])) delete c.explored[k];
}

// ログインの ときに ととのえる（world.js の normalizeChar）
export function normalizeTreasure(c) {
  repairTreasureMaps(c);
  if (!c.treasureMaps) return;
  for (const tm of c.treasureMaps) {
    if (tm.found || spotOk(tm)) continue;
    const s = pickDigSpot(tm.seed, tm.map, c.treasureMaps.filter((x) => x !== tm));
    if (s) Object.assign(tm, { x: s.x, y: s.y });
  }
  pruneTreasureData(c);
}

// ───────────── 洞窟の 出入り ─────────────
// 地上の 出口（地図の 場所の 1つ下。だめなら まわりの 歩ける ところ）
function exitPoint(spot) {
  const m = MAPS[spot.map];
  if (!m) return { map: 'overworld', x: POS.villagePlaza[0] + 0.5, y: POS.villagePlaza[1] + 0.5 };
  const ok = (x, y) => !isBlocked(m, x, y, () => true) && !TILE_INFO[tileAt(m, x, y)]?.water;
  for (const [dx, dy] of [[0, 1], [0, 0], [-1, 1], [1, 1], [-1, 0], [1, 0]]) {
    if (ok(spot.x + dx, spot.y + dy)) return { map: spot.map, x: spot.x + dx + 0.5, y: spot.y + dy + 0.5 };
  }
  for (let r = 2; r < 8; r++) {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (ok(spot.x + dx, spot.y + dy)) return { map: spot.map, x: spot.x + dx + 0.5, y: spot.y + dy + 0.5 };
    }
  }
  return { map: spot.map, x: spot.x + 0.5, y: spot.y + 0.5 };
}

// 洞窟の 中の セーブの 場所（ログインしなおし）。かべの 中なら 入り口へ、わからない 洞窟なら 地上の 地図の 場所へ
export function fixTreasurePos(pos) {
  const m = MAPS[pos.map];
  if (m?.tm) {
    const inside = Number.isFinite(pos.x) && Number.isFinite(pos.y) && pos.x >= 0 && pos.y >= 0 && pos.x < m.w && pos.y < m.h;
    if (inside && !isBlocked(m, Math.floor(pos.x), Math.floor(pos.y), () => false)) return pos;
    return { map: pos.map, x: m.tm.arrive.x, y: m.tm.arrive.y, dir: 'down' };
  }
  const p = parseFloorId(pos.map);
  if (!p || !MAPS[p.spot.map]) return null;
  return { ...exitPoint(p.spot), dir: 'down' };
}

function moveParty(world, s, to) {
  const from = { map: s.map, x: s.x, y: s.y };
  world.placeSession(s, to.map, to.x, to.y, to.dir || 'down', true);
  world.warpFollowers(s, from.map, from.x, from.y, { dir: 'down', ...to });
  world.broadcastPlayers();
}

async function enterCave(run, rec) {
  const r = await run.flush();
  if (r.aborted) return;
  const m = MAPS[floorMapId(rec, 1)];
  if (!m) return;
  moveParty(run.world, run.init, { map: m.id, x: m.tm.arrive.x, y: m.tm.arrive.y, dir: 'down' });
}

// しらべる（A）: 地図の 場所の そばなら ほる。手伝っている ときは リーダーの 地図
export function tryTreasureDig(world, s, tx, ty) {
  const owner = world.hostOf(s) || s;
  const list = owner.char?.treasureMaps;
  if (!Array.isArray(list) || !list.length) return false;
  for (const rec of list) {
    if (rec.map !== s.map) continue;
    const near = (rec.x === tx && rec.y === ty) || Math.hypot(rec.x + 0.5 - s.x, rec.y + 0.5 - s.y) <= 1.3;
    if (!near) continue;
    digAt(world, s, owner, rec);
    return true;
  }
  return false;
}

function digAt(world, s, owner, rec) {
  const cave = caveInfo(rec.seed, rec.lv);
  const enter = ['call', (run) => enterCave(run, rec)];
  let steps;
  if (!rec.found) {
    rec.found = true;
    owner.char.flags[foundFlag(rec.seed)] = true;
    world.markDirty();
    steps = [
      ['sfx', 'dig'],
      ['say', null, `${s.char.name}は地面をほった！`],
      ['shake'],
      ['say', null, 'なんと！\n地面にぽっかりと大きな穴があいた！'],
      ['sfx', 'sparkle'],
      ['say', null, `「${cave.caveName}」への入り口を見つけた！\n（${tmTitle(rec)}）`],
      enter,
    ];
  } else {
    steps = [['choice', `${cave.caveName}に入りますか？`, ['入る', 'やめる'], [[enter], []]]];
  }
  const run = new ScriptRun(world, s, [s], steps, {});
  run.start();
}

async function exitCave(run) {
  const s = run.init;
  const p = parseFloorId(s.map);
  if (!p) return;
  moveParty(run.world, s, { ...exitPoint(p.spot), dir: 'down' });
}

// ───────────── 洞窟の 主 ─────────────
const BOSS_LINES = {
  tm_golem: ['…ゴゴゴ…', 'この宝は…だれにも…わたさぬ…！'],
  tm_king: ['ぷるるん！ここまで来るとは、なかなかやるぷる！', 'でも、宝石は全部王さまのものぷる！'],
  tm_dragon: ['グオオオ…！', '宝をねらう者は、この炎で追いはらってくれる！'],
  tm_knight: ['…よくぞここまで来た、冒険者よ。', 'だが、宝がほしくば、この剣をこえてゆけ！'],
  tm_serpent: ['シャアアア…', '冷たい水の底で、ずっと宝を守ってきたのだ…！'],
  tm_panther: ['…グルルル…', '（暗やみの中で、あやしい目が光っている！）'],
};

function bossEncounter(p) {
  const cave = caveInfo(p.seed, p.lv);
  const id = `tmboss_${seed36(p.seed)}_${p.lv}`;
  FIXED_ENCOUNTERS[id] = {
    group: [[cave.boss, 1, 1]], bg: TM_THEMES[cave.theme].bossBg, bgm: 'boss', canFlee: false, boss: true,
    enemyLv: bossLvOf(p.seed, p.lv),
  };
  return id;
}

async function bossEvent(run) {
  const world = run.world;
  const s = run.init;
  const p = parseFloorId(s.map);
  if (!p) return;
  const owner = run.owner.char;
  const flag = clearedFlag(p.seed);
  if (owner.flags[flag]) return;
  const cave = caveInfo(p.seed, p.lv);
  const boss = MONSTERS[cave.boss];
  const enc = bossEncounter(p);
  await run.runSteps([
    ['bgm', null],
    ['showMon', cave.boss],
    ['say', null, `${cave.caveName}の主、${boss.name}があらわれた！`],
    ...(BOSS_LINES[cave.boss] || []).map((l) => ['say', boss.name, l]),
    ['showMon', null],
    ['battle', enc],
  ]);
  if (run.aborted) return;
  // 勝った: 主は いなくなり、宝箱と 出口が あらわれる。地図は「主を たおした」に
  owner.flags[flag] = true;
  for (const m of run.everyone) {
    const rec = (m.char.treasureMaps || []).find((t) => t.seed === p.seed);
    if (rec) { rec.cleared = true; rec.found = true; }
    pruneTreasureData(m.char);
  }
  const steps = [
    ['bgm', 'resume'],
    ['sfx', 'key'],
    ['say', null, `${boss.name}をたおした！\n${cave.caveName}に静けさがもどった…`],
    ['say', null, 'おくに宝箱があらわれた！\nそして、出口への階段も見える。'],
  ];
  // 新しい 宝の地図（おなじ か 上の レベル）。いっしょに 戦った みんなに
  const rng = makeRng((p.seed ^ 0x6a09e667) >>> 0);
  const lv = nextMapLevel(rng, p.lv);
  for (const m of run.everyone) {
    const got = grantTreasureMap(world, m.char, { lv });
    if (got) steps.push(['sfx', 'item'], ['say', null, `${m.char.name}は宝の地図を見つけた！\n（${tmTitle(got)}）`]);
    else steps.push(['say', null, `${m.char.name}は宝の地図を見つけた！\nしかし、もう地図がいっぱいで持てない…`]);
  }
  world.markDirty();
  await run.runSteps(steps);
  for (const m of run.everyone) world.sendSelf(m);
}

// ───────────── 宝探しのダイゴ（ルミナの町）─────────────
async function hunterTalk(run) {
  const world = run.world;
  const c = run.init.char;
  const say = (...lines) => lines.forEach((l) => run.say(l, HUNTER));
  const list = c.treasureMaps || [];
  const give = (lv) => {
    const rec = grantTreasureMap(world, c, { lv, map: 'overworld' });
    if (!rec) return null;
    run.batch.push(['sfx', 'key']);
    run.say(`${c.name}は${tmTitle(rec)}を手に入れた！`);
    return rec;
  };
  if (!c.flags.tm_intro) {
    say('やあ、わしは宝探しのダイゴ。\n世界中の宝の地図を集めておる。',
      '宝の地図には、宝がねむる場所のまわりの地形がかいてあるんじゃ。',
      '地図とにた場所を見つけたら、そこで地面を調べてみなされ。\n（Aボタン・「調べる」）',
      '地面をほると、宝の洞窟への入り口があらわれる！\n洞窟は、地図ごとに形がちがうんじゃよ。',
      'いちばんおくには、宝を守る洞窟の主がおる。\nたおせば宝箱と、また新しい地図が手に入るじゃろう。',
      'わしはもう年でな…。\nかわりに、この地図の宝を見つけてきてくれんか？');
    if (!give(1)) return;
    c.flags.tm_intro = true;
    say('持っている地図は、メニューの「道具」で見られるぞ。',
      '洞窟から出たい時は、入ってきた階段か、帰り道の羽を使うとよい。',
      '魔物をたおすと、宝の地図を落とすこともあるそうじゃ。\nがんばりなされ！');
    world.markDirty();
    return;
  }
  const open = list.filter((t) => !t.cleared);
  if (!open.length) {
    say('おお、地図の宝はもう見つけたのか！たいしたものじゃ。');
    const best = Math.max(0, ...list.map((t) => t.lv));
    if (!list.length || best <= 1) {
      say('地図がないなら、もう1まいやろう。');
      give(1);
    } else say('主をたおして手に入れた地図を、ためしてみるとよい。\nレベルが高い地図ほど、魔物も宝も強くなるぞ。');
    return;
  }
  const tips = [
    ['地図の中の、森や山や水のかたちをよく見るんじゃ。', '「ミドリナ平原」「ささやきの森」など、地図の下の名前もヒントになるぞ。'],
    ['地図のレベルが高いほど、洞窟は深く、魔物も強くなる。', 'そのかわり、宝箱にはよい物が入っておるぞ。'],
    ['洞窟の主は、大わざの前に力をためる。', '力をためたら、守りをかためるか、回復のじゅんびをするんじゃ。'],
    ['家族といっしょなら、洞窟の主もこわくない。', 'パーティーのみんなが、宝の地図をもらえるぞ。'],
  ];
  say(...tips[Math.floor(world.rng.next() * tips.length)]);
}

// だいほんの しょり（data/story-tm.js の tm_hunter・tm_exit・tm_boss）
Object.assign(TM_HOOKS, { hunter: hunterTalk, exit: exitCave, boss: bossEvent });

// ───────────── メニュー（world.js の onMenu から）─────────────
export function treasureMenu(world, s, msg) {
  const c = s.char;
  const reply = (ok, text) => {
    world.send(s, { t: 'menuRes', ok, text });
    world.sendSelf(s);
    world.markDirty();
  };
  if (s.busy) return reply(false, '今はできません');
  const rec = (c.treasureMaps || []).find((t) => t.id === msg.id);
  if (!rec) return reply(false, '');
  if (msg.op === 'dig') {
    if (rec.map === s.map && Math.hypot(rec.x + 0.5 - s.x, rec.y + 0.5 - s.y) <= 1.6) {
      world.send(s, { t: 'menuRes', ok: true, text: '' });
      return digAt(world, s, s, rec);
    }
    return reply(false, `${c.name}は地面をほった！\nしかし、何も見つからなかった…`);
  }
  if (msg.op === 'discard') {
    if (MAPS[s.map]?.tm && parseFloorId(s.map)?.seed === rec.seed) return reply(false, 'この洞窟の地図は、今は捨てられない');
    removeTreasureMap(c, rec.id);
    return reply(true, `${tmTitle(rec)}を捨てた。`);
  }
  return reply(false, '');
}

// ───────────── 戦いの あと（battles.js の finishBattle から）─────────────
// 第1章を クリアした あとは、ときどき 宝の地図を 拾う（強い 魔物・ボスほど 出やすい）
export function treasureAfterBattle(world, ctx, sessions, perSession) {
  const b = ctx.battle;
  if (b.result?.outcome !== 'win' || String(ctx.opts.fixed || '').startsWith('tmboss_')) return;
  const inCave = !!MAPS[ctx.map]?.tm;
  const maxEnemyLv = Math.max(1, ...b.combatants.filter((x) => x.side === 'enemy').map((x) => x.lv || MONSTERS[x.species]?.lv || 1));
  for (const m of sessions) {
    const c = m.char;
    if (!c?.flags?.c1_clear || !perSession[m.id]) continue;
    const p = mapDropRate({ inCave, boss: b.boss, fixed: !!ctx.opts.fixed, maxEnemyLv, playerLv: c.level });
    if (!(p > 0) || !world.rng.chance(p)) continue;
    const rec = grantTreasureMap(world, c, { lv: dropMapLevel(world.rng, maxEnemyLv) });
    if (rec) perSession[m.id].lines.push(`${c.name}は宝の地図を拾った！`, `（${tmTitle(rec)}）`);
  }
}

// だれも いない 洞窟の 魔物は わすれる（world.js の tick から。ときどき）
let pruneAt = 0;
export function pruneTreasureStates(world, byMap) {
  const now = world.now();
  if (now - pruneAt < 10000) return;
  pruneAt = now;
  for (const id of [...world.mapStates.keys()]) {
    if (isTreasureMapId(id) && !byMap.has(id)) world.mapStates.delete(id);
  }
}
