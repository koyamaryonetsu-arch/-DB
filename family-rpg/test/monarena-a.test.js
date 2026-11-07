// 第67回 A班: モンスター闘技場の 建物・人・受付の 画面（チーム選びの きまり）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MAPS, isBlocked, tileAt, POS } from '../public/js/shared/maps/index.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import { SCRIPTS } from '../public/js/shared/data/story.js';
import { MONARENA_MAP, MONARENA_DOOR, MONARENA_START, MONARENA_SIGN } from '../public/js/shared/maps/monarena-a.js';
import { openMonArena } from '../public/js/shared/data/story-monarena-a.js';
import {
  TEAM_MAX, normTeam, autoTeam, presetTeam, initialTeam, placeInSlot, removeAt, moveUp, familyRows, rankState, monPower, sortStrong,
} from '../public/js/client/ui/monarena-team.js';

function bfs(map, start, flags = []) {
  const has = (f) => flags.includes(f);
  const seen = new Uint8Array(map.w * map.h);
  const q = [start];
  seen[start[1] * map.w + start[0]] = 1;
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h) continue;
      const k = ny * map.w + nx;
      if (seen[k] || isBlocked(map, nx, ny, has)) continue;
      seen[k] = 1;
      q.push([nx, ny]);
    }
  }
  return (x, y) => !!seen[y * map.w + x];
}
const nextTo = (reach, x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => reach(x + dx, y + dy));

test('第67回 A: ルミナの町から 闘技場の とびらへ 歩いて 行ける・とびらで 中へ 入れる', () => {
  const ow = MAPS.overworld;
  assert.equal(tileAt(ow, MONARENA_DOOR.x, MONARENA_DOOR.y), T.DOOR);
  const reach = bfs(ow, POS.townPlaza);
  assert.ok(reach(MONARENA_DOOR.x, MONARENA_DOOR.y), '町の 広場から とびらまで');
  const w = ow.warpAt.get(MONARENA_DOOR.y * ow.w + MONARENA_DOOR.x);
  assert.ok(w, 'とびらの ワープ');
  assert.equal(w.to.map, MONARENA_MAP);
  const m = MAPS[MONARENA_MAP];
  assert.ok(m && m.npcById && m.warpAt, '闘技場の マップ（npcById などが できている）');
  assert.ok(!isBlocked(m, Math.floor(w.to.x), Math.floor(w.to.y), () => false), '入った ところは 歩ける');
  // 出口は とびらの すぐ 下へ もどる
  const exits = m.warps.filter((x) => x.to.map === 'overworld');
  assert.equal(exits.length, 2);
  for (const e of exits) {
    assert.equal(tileAt(m, e.x, e.y), T.DOOR);
    assert.ok(!isBlocked(ow, Math.floor(e.to.x), Math.floor(e.to.y), () => false), '出た ところは 歩ける');
    assert.ok(Math.abs(e.to.x - (MONARENA_DOOR.x + 0.5)) < 1 && e.to.y > MONARENA_DOOR.y, 'とびらの 前');
  }
  // 入口の まわりは 魔物が 出ない・名前は ルミナの町
  assert.ok(ow.zoneAt(MONARENA_DOOR.x, MONARENA_DOOR.y + 1).startsWith('safe'));
  assert.equal(ow.areaName(MONARENA_DOOR.x, MONARENA_DOOR.y + 1), 'ルミナの町');
  assert.ok(ow.boards.some((b) => b.name === 'モンスター闘技場'), '入口の かんばん');
  // 千年前の マップには 闘技場の 入口は ない
  if (MAPS.past) assert.ok(!MAPS.past.warps.some((x) => x.to?.map === MONARENA_MAP));
});

test('第67回 A: 闘技場の 中 … 受付・かんばん・人に 近づける。だいほんが ある', () => {
  const m = MAPS[MONARENA_MAP];
  const reach = bfs(m, [Math.floor(MONARENA_START.x), Math.floor(MONARENA_START.y)], ['monster_bond']);
  for (const e of m.warps) assert.ok(reach(e.x, e.y), `出口 ${e.x},${e.y}`);
  assert.ok(nextTo(reach, MONARENA_SIGN.x, MONARENA_SIGN.y), 'かんばん');
  assert.equal(m.signAt.get(MONARENA_SIGN.y * m.w + MONARENA_SIGN.x)?.text.split('\n')[0], 'モンスター闘技場');
  // 受付は カウンターごしに 話す（カウンターの むこうに 立てる）
  for (const id of ['mona_desk', 'mona_family', 'mona_reg']) {
    const n = m.npcById[id];
    assert.ok(n, id);
    const dx = n.dir === 'right' ? 1 : -1;
    assert.equal(tileAt(m, n.x + dx, n.y), T.COUNTER, `${id} の 前は カウンター`);
    assert.ok(reach(n.x + dx * 2, n.y), `${id} に カウンターごしに 話せる`);
  }
  for (const n of m.npcs) {
    const tx = Math.floor(n.x), ty = Math.floor(n.y);
    assert.ok(!TILE_INFO[tileAt(m, tx, ty)].solid, `${n.id} は かべの 上に いない`);
    assert.ok(reach(tx, ty) || nextTo(reach, tx, ty) || [[2, 0], [-2, 0]].some(([dx, dy]) => reach(tx + dx, ty + dy)), `${n.id} に 近づける`);
    assert.equal(typeof SCRIPTS[n.script], 'function', `${n.script} の だいほん`);
  }
  assert.ok(m.zoneAt(3, 3).startsWith('safe'));
});

test('第67回 A: 受付 … monster_bond の 前は 話すだけ。あとは 受付の 画面（mode）を 開く', async () => {
  const x = (bond) => ({ flag: (f) => (f === 'monster_bond' ? bond : false), c: { name: 'テスト' } });
  for (const [id, mode] of [['monarena_desk', 'rank'], ['monarena_family', 'family'], ['monarena_reg', 'reg']]) {
    const before = SCRIPTS[id](x(false));
    assert.ok(before.length && before.every((s) => s[0] === 'say'), `${id}: 目覚める 前は 話すだけ`);
    assert.ok(before.some((s) => /目覚めていない/.test(s[2])));
    const after = SCRIPTS[id](x(true));
    const call = after.find((s) => s[0] === 'call');
    assert.ok(call, `${id}: 画面を 開く`);
    const run = { batch: [], flush: async () => { run.sent = [...(run.sent || []), ...run.batch]; run.batch = []; return {}; }, abort() { run.aborted = true; } };
    await call[1](run);
    const ui = run.sent.find((s) => s[0] === 'ui');
    assert.equal(ui[1], 'monarena');
    assert.equal(ui[2].mode, mode);
  }
  // とちゅうで きれたら やめる
  const run2 = { batch: [], flush: async () => ({ aborted: true }), abort() { run2.aborted = true; } };
  await openMonArena('rank')(run2);
  assert.ok(run2.aborted);
  for (const id of ['monarena_trainer', 'monarena_mon_a', 'monarena_mon_b', 'monarena_fan1', 'monarena_fan2', 'monarena_fan3']) {
    const s = SCRIPTS[id]({ flag: () => true, c: {} });
    assert.ok(s.length && s.every((x2) => x2[0] === 'say'), id);
  }
});

// ───────────── チーム選びの きまり（client/ui/monarena-team.js）─────────────
const MONS = [
  { key: 'a', name: 'A', level: 5, hp: 40, mp: 0, atk: 10, def: 10, agi: 10, where: 'party' },
  { key: 'b', name: 'B', level: 20, hp: 150, mp: 20, atk: 60, def: 40, agi: 30, where: 'wagon' },
  { key: 'c', name: 'C', level: 12, hp: 90, mp: 10, atk: 30, def: 25, agi: 25, where: 'storage' },
  { key: 'd', name: 'D', level: 30, hp: 220, mp: 40, atk: 90, def: 60, agi: 50, where: 'storage' },
  { key: 'e', name: 'E', level: 8, hp: 60, mp: 5, atk: 18, def: 12, agi: 40, where: 'party' },
];

test('第67回 A: チーム … 持っている 魔物だけ・4ひきまで・おまかせは 強い 順', () => {
  assert.equal(TEAM_MAX, 4);
  assert.deepEqual(normTeam(['a', 'x', 'a', 'b', 'c', 'd', 'e'], MONS), ['a', 'b', 'c', 'd']);
  assert.deepEqual(normTeam(null, MONS), []);
  assert.deepEqual(autoTeam(MONS), ['d', 'b', 'c', 'e']);
  assert.ok(monPower(MONS[3]) > monPower(MONS[0]));
  assert.deepEqual(sortStrong(MONS).map((m) => m.key), ['d', 'b', 'c', 'e', 'a']);
  assert.deepEqual(autoTeam([]), []);
  const st = { monsters: MONS, team: ['e', 'gone', 'a'], reg: ['c', 'b'] };
  assert.deepEqual(presetTeam('last', st), ['e', 'a']);
  assert.deepEqual(presetTeam('reg', st), ['c', 'b']);
  assert.deepEqual(presetTeam('auto', st), ['d', 'b', 'c', 'e']);
  // はじめの チーム: 戦う 時は 前回、登録する 時は 登録チーム。なければ おまかせ
  assert.deepEqual(initialTeam(st, 'fight'), ['e', 'a']);
  assert.deepEqual(initialTeam(st, 'reg'), ['c', 'b']);
  assert.deepEqual(initialTeam({ monsters: MONS }, 'fight'), ['d', 'b', 'c', 'e']);
  assert.deepEqual(initialTeam({ monsters: MONS, team: [], reg: ['a'] }, 'fight'), ['a']);
  assert.deepEqual(initialTeam({ monsters: [] }), []);
});

test('第67回 A: チーム … 入れる・入れかえ・はずす・1つ前へ', () => {
  const t = ['a', 'b', 'c'];
  assert.deepEqual(placeInSlot(t, 3, 'd'), ['a', 'b', 'c', 'd'], 'あいている わくに 入れる');
  assert.deepEqual(placeInSlot(t, 1, 'd'), ['a', 'd', 'c'], '入れかえ（はずれた 魔物は ぬける）');
  assert.deepEqual(placeInSlot(t, 0, 'c'), ['c', 'b', 'a'], 'チームの 中どうしは 場所の 入れかえ');
  assert.deepEqual(placeInSlot(t, 3, 'a'), ['b', 'c', 'a'], 'あきに チームの 魔物 → うしろへ');
  assert.deepEqual(placeInSlot(['a', 'b', 'c', 'd'], 4, 'e'), ['a', 'b', 'c', 'd'], '5ひきめは 入らない');
  assert.deepEqual(t, ['a', 'b', 'c'], 'もとの ならびは かえない');
  assert.deepEqual(removeAt(t, 1), ['a', 'c']);
  assert.deepEqual(moveUp(t, 2), ['a', 'c', 'b']);
  assert.deepEqual(moveUp(t, 0), ['a', 'b', 'c']);
});

test('第67回 A: 家族の 登録チーム・ランクの ようす', () => {
  const st = { family: [
    { charId: 'me', name: '自分', reg: [{ species: 'wolf', level: 3 }] },
    { charId: 'p', name: 'お父さん', reg: [{ species: 'golem', level: 20 }] },
    { charId: 'm', name: 'お母さん', reg: [] },
  ] };
  assert.deepEqual(familyRows(st, 'me').map((f) => f.charId), ['p']);
  assert.deepEqual(familyRows({}, 'me'), []);
  assert.equal(rankState({ open: false, cleared: true }), 'locked');
  assert.equal(rankState({ open: true, cleared: true }), 'cleared');
  assert.equal(rankState({ open: true }), 'open');
});

test('第67回 A: 受付の 画面 … B班の 窓口を 約束どおり よぶ・C班が 足せる ところが ある', () => {
  const src = readFileSync(new URL('../public/js/client/ui/monarena.js', import.meta.url), 'utf8');
  assert.match(src, /export async function monArenaUI\(/);
  assert.match(src, /export const MONARENA_EXTRA = \[\]/);
  for (const a of ['status', 'setTeam', 'register', 'rank', 'family']) assert.match(src, new RegExp(`action: '${a}'`), a);
  assert.match(src, /kind: 'monarena'/);
  assert.match(src, /even: even === 1/);
  // ためしの スタブは globalThis.__monarenaStub が ある 時だけ
  assert.match(src, /if \(globalThis\.__monarenaStub\)/);
  const svc = readFileSync(new URL('../public/js/client/ui/services.js', import.meta.url), 'utf8');
  assert.match(svc, /case 'monarena': return monArenaUI\(game, data\);/);
});
