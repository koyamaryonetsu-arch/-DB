// 第77回 C: 場面で かわる 音楽を ゲームに つなぐ（client/audio-scene.js）
//   戦いの 曲えらび・ピンチの 幅・ボスの だん・階 → 強さ・昼夜・まわりの音の わりあて・つなぎこみ（にせの audio）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  battleBgm, isPart2Map, isStrongBattle, nextPinch, PINCH_ON, PINCH_OFF, bossStage, battlePhase,
  floorKey, buildFloorIndex, depthIntensity, floorOf, timeOfDayFor, underRoof, ambienceFor, SceneAudio,
  AMBIENCE_BY_AREA, AMBIENCE_BY_MAP,
} from '../public/js/client/audio-scene.js';
import { GameAudio, _TRACKS } from '../public/js/client/audio.js';
import { AMBIENCES } from '../public/js/client/music-amb.js';
import { MAPS } from '../public/js/shared/maps/index.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { gameFiles, checkText } from '../tools/kanji-check.mjs';

const src = (p) => readFileSync(new URL(`../public/js/client/${p}`, import.meta.url), 'utf8');
const ALL = () => true;
const NONE = (id) => id === 'battle' || id === 'boss';

// ───── 戦いの 曲 ─────
test('戦いの 曲: 第2部・強敵・特別な 曲（曲が ある 場合）', () => {
  const rows = [
    // [ ねがい, 答え ]
    [{ snapBgm: 'battle', mapId: 'overworld' }, 'battle'],
    [{ snapBgm: null, mapId: 'overworld' }, 'battle'],
    [{ snapBgm: null, boss: true, mapId: 'overworld' }, 'boss'],
    [{ snapBgm: 'boss6', boss: true, mapId: 'c7_temple_8f' }, 'boss6'],
    [{ snapBgm: 'sand_temple', mapId: 'temple_b1' }, 'sand_temple'],
    [{ snapBgm: 'battle', mapId: 'overworld_past' }, 'battle2'],
    [{ snapBgm: 'battle', mapId: 'c7_field' }, 'battle2'],
    [{ snapBgm: 'battle', mapId: 'toki_shrine_2f' }, 'battle2'],
    [{ snapBgm: 'battle', mapId: 'c8b_temple_3f_now' }, 'battle2'],
    [{ snapBgm: 'battle', mapId: 'castle_5f' }, 'battle'],
    [{ snapBgm: 'battle', mapId: 'south' }, 'battle'],
    [{ snapBgm: 'battle', mapId: 'tm_1_2_3' }, 'battle_strong'],
    [{ snapBgm: 'battle', mapId: 'sd_7' }, 'battle_strong'],
    [{ snapBgm: 'battle', mapId: 'monarena' }, 'battle_strong'],
    [{ snapBgm: 'battle', mapId: 'south', story: true }, 'battle_strong'],
    [{ snapBgm: 'battle', mapId: 'overworld_past', story: true }, 'battle_strong'],
    [{ snapBgm: 'battle', mapId: 'overworld', enemies: [{ species: 'pururin' }, { species: 'goldoon' }] }, 'battle_strong'],
    [{ snapBgm: 'battle', mapId: 'overworld', enemies: [{ species: 'pururin' }] }, 'battle'],
  ];
  for (const [arg, want] of rows) {
    const map = MAPS[arg.mapId] || null;
    assert.equal(battleBgm({ ...arg, map, monsters: MONSTERS, has: ALL }), want, JSON.stringify(arg));
  }
});

test('戦いの 曲: battle2・battle_strong が まだ ない 時は battle に もどる', () => {
  for (const mapId of ['overworld_past', 'tm_1_2_3', 'monarena', 'sd_2', 'overworld']) {
    assert.equal(battleBgm({ snapBgm: 'battle', mapId, map: MAPS[mapId] || null, monsters: MONSTERS, has: NONE }), 'battle', mapId);
  }
  // 強敵だけ ない: 第2部の 強敵は battle2
  assert.equal(battleBgm({ snapBgm: 'battle', mapId: 'c7_field', story: true, has: (id) => id !== 'battle_strong' }), 'battle2');
  // SceneAudio は _TRACKS（今の 曲の 一覧）を 見る
  const sa = new SceneAudio({}, { tracks: _TRACKS, monsters: MONSTERS });
  const got = sa.battleTrack({ snap: { bgm: 'battle', combatants: [] }, mapId: 'overworld_past', map: MAPS.overworld_past });
  assert.equal(got, _TRACKS.battle2 ? 'battle2' : 'battle');
  const strong = sa.battleTrack({ snap: { bgm: 'battle', combatants: [] }, mapId: 'monarena' });
  assert.equal(strong, _TRACKS.battle_strong ? 'battle_strong' : 'battle');
  // にせの 曲の 一覧で 両方
  const sa2 = new SceneAudio({}, { tracks: { battle: {}, battle2: {}, battle_strong: {} }, monsters: MONSTERS });
  assert.equal(sa2.battleTrack({ snap: { bgm: 'battle', combatants: [] }, mapId: 'overworld_past', map: MAPS.overworld_past }), 'battle2');
  assert.equal(sa2.battleTrack({ snap: { bgm: 'battle', combatants: [{ side: 'enemy', species: 'tm_golem' }] }, mapId: 'overworld' }), 'battle_strong');
});

test('第2部の 場所: 千年前の マップと 第6〜8章の ダンジョン（今の すがたも）。第1部は ちがう', () => {
  const part2 = Object.values(MAPS).filter((m) => isPart2Map(m.id, m)).map((m) => m.id);
  for (const id of ['overworld_past', 'c7_field', 'c7s_sea', 'c7i_snow', 'toki_shrine_1f', 'toki_ruin_3f', 'toki_ruin_boss', 'hoshimichi_8f', 'tokei_top', 'c7_temple_2f_now', 'c8c_fort_8f']) {
    assert.ok(part2.includes(id), id);
  }
  for (const id of ['overworld', 'sea', 'north', 'south', 'kumoi', 'castle_12f', 'castle_top', 'star_tower_2f', 'earth_8f', 'monarena', 'cave_b1', 'lab_b10']) {
    assert.ok(!part2.includes(id), id);
  }
  assert.ok(!isStrongBattle({ mapId: 'tm_1', boss: true }), 'ボスは 強敵の 曲に しない');
});

// ───── ピンチ ─────
test('ピンチ: 25% を 切ると ON・35% 以上で OFF（その 間は 前の まま）', () => {
  const a = (...r) => r.map((x) => ({ side: 'ally', alive: true, hp: Math.round(x * 100), maxHp: 100 }));
  const rows = [
    [false, a(1, 0.5), false],
    [false, a(1, 0.24), true],
    [false, a(0.3, 0.3), false],
    [true, a(0.3, 1), true],
    [true, a(0.34, 1), true],
    [true, a(0.35, 1), false],
    [true, a(0.9, 0.9), false],
    [false, a(0.25), false],
  ];
  for (const [prev, allies, want] of rows) assert.equal(nextPinch(prev, allies), want, JSON.stringify([prev, allies.map((c) => c.hp)]));
  // たおれた 仲間は 数えない・だれも いなければ OFF
  assert.equal(nextPinch(false, [{ alive: false, hp: 0, maxHp: 100 }, { alive: true, hp: 80, maxHp: 100 }]), false);
  assert.equal(nextPinch(true, [{ alive: false, hp: 0, maxHp: 100 }]), false);
  assert.ok(PINCH_ON < PINCH_OFF);
  // 行ったり 来たり しない: 24% → 30% → 24% の 間 ずっと ON
  let p = false;
  const seq = [];
  for (const r of [1, 0.24, 0.3, 0.27, 0.33, 0.36, 0.3]) seq.push((p = nextPinch(p, a(r))));
  assert.deepEqual(seq, [false, true, true, true, true, false, false]);
});

// ───── ボスの だん ─────
test('ボスの だん: 段階の ある ボス（hpBelow）・形態の しるし・HP 半分', () => {
  const e = (species, rate, extra = {}) => ({ side: 'enemy', alive: true, boss: true, species, hp: Math.round(rate * 1000), maxHp: 1000, ...extra });
  // goldoon: phases 0.6・0.3
  assert.equal(bossStage(e('goldoon', 0.9), MONSTERS), 0);
  assert.equal(bossStage(e('goldoon', 0.5), MONSTERS), 1);
  assert.equal(bossStage(e('goldoon', 0.2), MONSTERS), 2);
  // 段階が 3つ（phantom_storm 0.7・0.4・0.25）
  assert.equal(bossStage(e('phantom_storm', 0.1), MONSTERS), 3);
  // 段階の ない ボス: HP 半分で 1
  const plain = Object.keys(MONSTERS).find((k) => MONSTERS[k].boss && !MONSTERS[k].phases);
  assert.ok(plain);
  assert.equal(bossStage(e(plain, 0.6), MONSTERS), 0);
  assert.equal(bossStage(e(plain, 0.49), MONSTERS), 1);
  // HP の 割合が わからない: 何も しない
  assert.equal(bossStage({ side: 'enemy', species: plain, boss: true }, MONSTERS), 0);
  // 形態の しるし（1 が はじめ）
  assert.equal(bossStage(e(plain, 1, { c8form: 3 }), MONSTERS), 2);
  assert.equal(bossStage(e(plain, 1, { slPhase: 2 }), MONSTERS), 1);
  assert.equal(bossStage(e(plain, 1, { zen: 2 }), MONSTERS), 1);
  assert.equal(bossStage(e(plain, 1, { p2: 1 }), MONSTERS), 1);
  assert.equal(bossStage(e(plain, 0.3, { c7form: 1 }), MONSTERS), 0, '形態の しるしが ある ボスは HP 半分の きまりを 使わない');
  // 戦い ぜんたい: ボス戦だけ・下げない
  const enemies = [e('goldoon', 0.5), { side: 'enemy', alive: true, species: 'pururin', hp: 1, maxHp: 10 }];
  assert.equal(battlePhase({ boss: false, enemies, monsters: MONSTERS }), 0);
  assert.equal(battlePhase({ boss: true, enemies, monsters: MONSTERS }), 1);
  assert.equal(battlePhase({ boss: true, enemies: [e('goldoon', 0.9)], monsters: MONSTERS, prev: 2 }), 2);
  // ボスの しるしが ない 時は HP の いちばん 多い 敵
  assert.equal(battlePhase({ boss: true, enemies: [{ side: 'enemy', alive: true, species: plain, hp: 100, maxHp: 1000 }, { side: 'enemy', alive: true, species: 'pururin', hp: 10, maxHp: 10 }], monsters: MONSTERS }), 1);
});

// ───── ダンジョンの 深さ ─────
test('階の 見分け方（id）', () => {
  const rows = [
    ['cave_b1', 'cave', 1], ['tower_2f', 'tower', 2], ['mine3', 'mine', 3], ['peak_top', 'peak', Infinity], ['tokei_10f', 'tokei', 10],
    ['c7_temple_3f_now', 'c7_temple', 3], ['hoshimichi_1f_past', 'hoshimichi', 1], ['lab_b10', 'lab', 10], ['toki_ruin_boss', 'toki_ruin', Infinity],
  ];
  for (const [id, group, n] of rows) assert.deepEqual(floorKey(id), { group, n }, id);
  for (const id of ['overworld', 'casino', 'sd_gate', 'palace_canal', 'trial_courage']) assert.equal(floorKey(id), null, id);
});

test('階 → 強さ（最初 0.4 → 最後 1.0。1〜2階・わからない 所は 1）', () => {
  assert.equal(depthIntensity(1, 8), 0.4);
  assert.equal(depthIntensity(8, 8), 1);
  assert.equal(depthIntensity(3, 3), 1);
  assert.equal(depthIntensity(2, 3), 0.7);
  assert.equal(depthIntensity(1, 2), 1);
  assert.equal(depthIntensity(1, 1), 1);
  assert.equal(depthIntensity(null, null), 1);
  for (let n = 3; n <= 13; n++) {
    let prev = 0;
    for (let f = 1; f <= n; f++) {
      const v = depthIntensity(f, n);
      assert.ok(v > prev && v >= 0.4 && v <= 1, `${f}/${n}`);
      prev = v;
    }
  }
  const idx = buildFloorIndex(Object.values(MAPS));
  const at = (id) => { const f = floorOf(id, MAPS[id], idx); return f ? depthIntensity(f.floor, f.floors) : 1; };
  const rows = [
    ['cave_b1', 1], ['cave_b2', 1], ['tower_1f', 0.4], ['tower_3f', 1], ['c7_temple_1f', 0.4], ['c7_temple_8f', 1],
    ['c7_temple_1f_now', 0.4], ['c7_temple_7f_now', 1], ['toki_ruin_1f_past', 0.4], ['toki_ruin_boss', 1], ['toki_ruin_7f', 1],
    ['castle_1f', 0.4], ['castle_top', 1], ['star_tower_top', 1], ['peak1', 0.4], ['peak_top', 1], ['lab_b10', 1],
    ['overworld', 1], ['casino', 1], ['sd_gate', 1], ['palace_canal', 1],
  ];
  for (const [id, want] of rows) assert.equal(at(id), want, id);
  assert.deepEqual(floorOf('tm_x', { tm: { floor: 2, floors: 5 } }, idx), { floor: 2, floors: 5 });
  // 第2部の 千年前と 今の すがたは べつの ダンジョン
  assert.deepEqual(idx.get('c7_temple_8f'), { floor: 8, floors: 8 });
  assert.deepEqual(idx.get('c7_temple_7f_now'), { floor: 7, floors: 7 });
});

// ───── 昼と 夜 ─────
test('昼と 夜: 屋外の フィールドだけ。夜専用の 曲の ある 所は day', () => {
  const rows = [
    [{ kind: 'field', night: true }, 'night'],
    [{ kind: 'field', night: false }, 'day'],
    [{ kind: 'dungeon', night: true }, 'day'],
    [{ kind: 'field', night: true, indoor: true }, 'day'],
    [{ kind: 'field', night: true, inBattle: true }, 'day'],
    [{ kind: 'field', night: true, hasNightTrack: true }, 'day'],
  ];
  for (const [a, want] of rows) assert.equal(timeOfDayFor(a), want, JSON.stringify(a));
  // コガネ地方の 砂ばくは bgmAt で 夜に 曲が かわる
  const s = MAPS.south;
  let found = false;
  for (let y = 0; y < s.h && !found; y += 4) for (let x = 0; x < s.w && !found; x += 4) if (s.bgmAt(x, y, true, () => false) !== s.bgmAt(x, y, false, () => false)) found = true;
  assert.ok(found);
  const roof = { roofs: [{ x: 10, y: 10, w: 6, h: 5 }] };
  assert.equal(underRoof(roof, 12, 12), true);
  assert.equal(underRoof(roof, 10, 12), false);
  assert.equal(underRoof(roof, 12, 20), false);
});

// ───── まわりの音 ─────
test('まわりの音の わりあて', () => {
  const rows = [
    [{ mapId: 'sea', area: 'カモメ港' }, 'waves'],
    [{ mapId: 'overworld', area: 'ルミナの町' }, 'market'],
    [{ mapId: 'overworld', area: 'ホシフル村' }, null],
    [{ mapId: 'overworld', area: 'ミドリナ平原' }, null],
    [{ mapId: 'south', area: '王都サファラ' }, 'market'],
    [{ mapId: 'south', area: 'コガネ砂丘', weather: 'sand' }, null],
    [{ mapId: 'south', area: '砂嵐のかべ', weather: 'sandstorm' }, 'wind'],
    [{ mapId: 'north', area: 'シロガネ雪原', weather: 'snow' }, 'wind'],
    [{ mapId: 'north', area: '温泉の里ユノハ' }, 'wind'],
    [{ mapId: 'peak3', area: '星竜山　山小屋' }, 'fire'],
    [{ mapId: 'peak1', weather: 'blizzard' }, 'wind'],
    [{ mapId: 'cave_b1' }, 'cave_drip'],
    [{ mapId: 'mine2' }, 'cave_drip'],
    [{ mapId: 'ice_cave1' }, 'cave_drip'],
    [{ mapId: 'sea_cave' }, 'waves'],
    [{ mapId: 'castle_3f' }, null],
    [{ mapId: 'casino' }, null],
    [{ mapId: 'fq_old_mine' }, null],
    [{ mapId: 'overworld', area: 'ミドリナ平原', weather: 'rain' }, 'rain'],
    [{ mapId: 'c7s_sea', area: 'ナギの村' }, 'waves'],
  ];
  for (const [a, want] of rows) assert.equal(ambienceFor({ ...a, map: MAPS[a.mapId] || null }), want, JSON.stringify(a));
  for (const v of [...Object.values(AMBIENCE_BY_AREA), ...Object.values(AMBIENCE_BY_MAP)]) assert.ok(AMBIENCES.includes(v), v);
  // 表の 場所の 名前・マップは 本当に ある
  for (const id of Object.keys(AMBIENCE_BY_MAP)) assert.ok(MAPS[id], id);
  const names = new Set();
  for (const m of Object.values(MAPS)) for (let y = 0; y < m.h; y += 2) for (let x = 0; x < m.w; x += 2) names.add(m.areaName(x, y));
  for (const n of Object.keys(AMBIENCE_BY_AREA)) assert.ok(names.has(n), n);
});

// ───── つなぎこみ（にせの audio）─────
function fakeAudio() {
  const log = [];
  const a = {
    music: null, log,
    play(id) { a.music = { id }; log.push(['play', id]); },
    setIntensity: (x) => log.push(['intensity', x]),
    setPinch: (x) => log.push(['pinch', x]),
    setPhase: (x) => log.push(['phase', x]),
    setTimeOfDay: (x) => log.push(['tod', x]),
    playAmbience: (x) => log.push(['amb', x]),
    stopAmbience: () => log.push(['amb', null]),
  };
  return a;
}

function fakeGame(mapId, { x = 5, y = 5, night = false, areaBgm = null } = {}) {
  const map = MAPS[mapId];
  const g = {
    sky: { isNight: () => g.night, flying: false },
    night,
    field: {
      mapId, map, me: { x, y }, nightOverride: null,
      hasFlag: () => false,
      areaName: () => map.areaName(Math.floor(g.field.me.x), Math.floor(g.field.me.y)),
      weatherKind: () => null,
      areaBgm: () => areaBgm || (map.bgmAt ? map.bgmAt(Math.floor(g.field.me.x), Math.floor(g.field.me.y), g.night, () => false) : map.bgm),
    },
  };
  return g;
}

test('つなぎこみ: ダンジョンの 階 → 強さ（play の あと）・階を うつる・戦いの あと もどる', () => {
  const au = fakeAudio();
  const sa = new SceneAudio(au, { tracks: _TRACKS, maps: MAPS, monsters: MONSTERS });
  const g = fakeGame('tower_1f');
  au.play(g.field.areaBgm());
  sa.syncField(g, 0, true);
  assert.deepEqual(au.log.slice(1), [['intensity', 0.4], ['tod', 'day'], ['amb', null]]);
  // 同じ 場所: 何も 送らない
  au.log.length = 0;
  sa.syncField(g, 1000);
  assert.deepEqual(au.log, []);
  // 階を うつる（同じ 曲）: 強さだけ
  g.field.mapId = 'tower_2f'; g.field.map = MAPS.tower_2f;
  sa.syncField(g, 2000);
  assert.deepEqual(au.log, [['intensity', 0.7]]);
  // 戦い（ダンジョンの 中）: 曲・tod day・まわりの音 止める
  au.log.length = 0;
  au.play('battle');
  sa.battleStart();
  assert.deepEqual(au.log, [['play', 'battle'], ['tod', 'day']]);
  // 戦いの あと: もとの 曲で 強さを 送りなおす
  au.log.length = 0;
  au.play(g.field.areaBgm());
  sa.syncField(g, 2100, true);
  assert.deepEqual(au.log, [['play', 'tower'], ['intensity', 0.7], ['tod', 'day']]);
  // イベントの 曲の 間は 強さを さわらない
  au.log.length = 0;
  au.play('chapter');
  sa.syncField(g, 2200, true);
  assert.deepEqual(au.log, [['play', 'chapter'], ['tod', 'day']]);
});

test('つなぎこみ: フィールドの 昼夜を 追いかける・町の まわりの音', () => {
  const au = fakeAudio();
  const sa = new SceneAudio(au, { tracks: _TRACKS, maps: MAPS, monsters: MONSTERS });
  // ルミナの町の まん中
  const ow = MAPS.overworld;
  const town = ow.places.town;
  const g = fakeGame('overworld', { x: town.x + 24, y: town.y + 18 });
  assert.equal(g.field.areaName(), 'ルミナの町');
  au.play(g.field.areaBgm());
  sa.syncField(g, 0, true);
  assert.deepEqual(au.log.slice(1), [['intensity', 1], ['tod', 'day'], ['amb', 'market']]);
  // 夜に なった（250ms ごとに 見る）
  au.log.length = 0;
  g.night = true;
  sa.syncField(g, 100);
  assert.deepEqual(au.log, []);
  sa.syncField(g, 300);
  // 屋根の 下 なら day、外 なら night
  const inside = underRoof(ow, g.field.me.x, g.field.me.y);
  assert.deepEqual(au.log, [['tod', inside ? 'day' : 'night']]);
  // 町を 出る → まわりの音 止める
  au.log.length = 0;
  g.field.me.x = 5; g.field.me.y = 5;
  sa.syncField(g, 1000);
  assert.ok(au.log.some((r) => r[0] === 'amb' && r[1] === null));
  // 夜専用の 曲が ある 砂ばく: 夜でも day
  const s = MAPS.south;
  let at = null;
  for (let y = 0; y < s.h && !at; y += 4) for (let x = 0; x < s.w && !at; x += 4) if (s.bgmAt(x, y, true, () => false) === 'desert_night') at = [x, y];
  const g2 = fakeGame('south', { x: at[0], y: at[1], night: true });
  const au2 = fakeAudio();
  const sa2 = new SceneAudio(au2, { tracks: _TRACKS, maps: MAPS });
  au2.play(g2.field.areaBgm());
  sa2.syncField(g2, 0, true);
  assert.equal(au2.music.id, 'desert_night');
  assert.ok(au2.log.some((r) => r[0] === 'tod' && r[1] === 'day'));
});

test('つなぎこみ: 戦いの ピンチ・ボスの だん・おわり', () => {
  const au = fakeAudio();
  const sa = new SceneAudio(au, { monsters: MONSTERS });
  au.play('boss');
  sa.battleStart();
  au.log.length = 0;
  const me = { id: 'a', side: 'ally', alive: true, hp: 100, maxHp: 100 };
  const boss = { id: 'e', side: 'enemy', alive: true, boss: true, species: 'goldoon', hp: 1000, maxHp: 1000 };
  const tick = () => sa.battleTick({ combatants: new Map([['a', me], ['e', boss]]).values(), boss: true });
  tick();
  assert.deepEqual(au.log, [['pinch', false], ['phase', 0]]);
  au.log.length = 0;
  me.hp = 20; tick();
  me.hp = 30; tick();
  boss.hp = 500; tick();
  me.hp = 40; tick();
  boss.hp = 900; tick(); // 回復しても だんは 下げない
  boss.hp = 100; tick();
  assert.deepEqual(au.log, [['pinch', true], ['phase', 1], ['pinch', false], ['phase', 2]]);
  au.log.length = 0;
  me.hp = 10; tick();
  sa.battleTick({ combatants: [me, boss], boss: true, ended: true });
  assert.deepEqual(au.log, [['pinch', true], ['pinch', false]]);
  // ボスでは ない 戦いは だんを 送らない
  au.play('battle');
  sa.battleStart();
  au.log.length = 0;
  sa.battleTick({ combatants: [me, { ...boss, boss: false }], boss: false });
  assert.deepEqual(au.log, [['pinch', true]]);
});

test('GameAudio: まわりの音 あり／なし（kizuna_audio の amb）・前の音では 鳴らさない', () => {
  const ga = new GameAudio();
  assert.equal(ga.ambOn, true);
  const calls = [];
  ga.engine = { playAmbience: (id) => calls.push(['play', id]), stopAmbience: () => calls.push(['stop']) };
  ga.playAmbience('waves');
  ga.setAmbienceOn(false);
  ga.playAmbience('market');
  ga.setAmbienceOn(true);
  ga.engineMode = 'old';
  ga.playAmbience('wind');
  ga.stopAmbience();
  assert.deepEqual(calls, [['play', 'waves'], ['stop'], ['stop'], ['play', 'market'], ['stop']]);
  assert.equal(ga.ambience, null);
  // AudioContext が ない 時も おぼえる
  const g2 = new GameAudio();
  g2.playAmbience('fire');
  assert.equal(g2.ambience, 'fire');
});

// ───── ゲームの 各所 ─────
test('ゲームの 各所に つないで いる', () => {
  const battle = src('battle.js');
  assert.match(battle, /sa\.battleTrack\(\{ snap: msg\.snap/);
  assert.match(battle, /sceneAudio\?\.battleTick\(/);
  assert.match(battle, /sceneAudio\?\.battleEnd\(\)/);
  const game = src('game.js');
  assert.match(game, /new SceneAudio\(this\.audio, \{ tracks: _TRACKS, maps: MAPS, monsters: MONSTERS \}\)/);
  assert.equal((game.match(/this\.syncSceneAudio\(true\)/g) || []).length, 2);
  const script = src('ui/script.js');
  assert.match(script, /g\.audio\.blip\(speaker\)/);
  assert.match(src('ui/counter.js'), /sfx\('talk'\)/);
  assert.match(src('ui/menu.js'), /まわりの音：/);
  assert.ok(gameFiles().some((f) => f.endsWith('client/audio-scene.js')));
  // 画面に 出る 文字の きまり
  for (const t of ['まわりの音：あり', 'まわりの音：なし', 'まわりの音は、町のざわめきや波・風の音（新しい音の時だけ）']) assert.deepEqual(checkText(t).filter((p) => p.kind !== 'kana'), [], t);
});
