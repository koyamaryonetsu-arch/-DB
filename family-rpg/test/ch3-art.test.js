// 第3章の 魔物の え（render/ch3-art.js・ch3-boss-art.js）と 星の竜に のる すがた（render/dragon-art.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MONSTER_ART, bigNpcScale } from '../public/js/client/render/monsters.js';
import { addCh3Art } from '../public/js/client/render/ch3-art.js';
import { drawDragon, DRAGON_PAL, DRAGON_W, DRAGON_H, DRAGON_SEAT } from '../public/js/client/render/dragon-art.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS } from '../public/js/shared/maps/index.js';
import { T } from '../public/js/shared/tiles.js';
import { Bot, tickN } from './helpers.js';

// けいやく（CH3-CONTRACT）の 魔物の ID
const CH3_MONSTERS = [
  'snow_slime', 'frost_wolf', 'snowman', 'yeti', 'ice_bat', 'snow_wisp',
  'penguin_knight', 'ice_golem', 'kiba_walrus',
  'mole_miner', 'ore_slime', 'minecart_ghost', 'fire_imp',
  'lava_lizard', 'fire_hound', 'magma_slime', 'ember_bird', 'obsidian_knight',
  'dragon_statue', 'star_wyvern', 'shadow_flame', 'frost_drake',
];
const CH3_BOSSES = ['blizzard_mammoth', 'magma_golem', 'flame_knight', 'trial_guardian', 'flame_witch', 'flame_witch_true'];
const CH3_DRAGON = ['star_dragon', 'star_dragon_sleep'];
const ALL = [...CH3_MONSTERS, ...CH3_BOSSES, ...CH3_DRAGON];

// monsters.js の かく ための どうぐ の かわり: つかった いろ と はみだしを しらべる
function stubG(w, h) {
  const colors = new Set();
  const pts = [];
  const g = {
    w, h,
    ell(cx, cy, rx, ry, c) { colors.add(c); pts.push([cx - rx, cy - ry], [cx + rx, cy + ry]); },
    poly(p, c) { colors.add(c); for (const q of p) pts.push(q); },
    rect(x, y, rw, rh, c) { colors.add(c); pts.push([x, y], [x + rw, y + rh]); },
    line(p, c, lw = 1) {
      colors.add(c);
      for (const [x, y] of p) pts.push([x - lw / 2 / w, y - lw / 2 / h], [x + lw / 2 / w, y + lw / 2 / h]);
    },
    eye(cx, cy, r, look = 0, white = '#ffffff', pupil = '#1a1026') {
      colors.add(white); colors.add(pupil); colors.add('#ffffff');
      pts.push([cx - r, cy - r * 1.25 * (w / h)], [cx + r, cy + r * 1.25 * (w / h)]);
    },
    dot(x, y, c) { colors.add(c); pts.push([x, y]); },
  };
  return { g, colors, pts };
}

// え の まわりの よはく（1ドット）より 外に はみだすと きれて しまう
function outside(pts, w, h, extra = 0.6) {
  const mx = (1 + extra) / w, my = (1 + extra) / h;
  return pts.filter(([x, y]) => x < -mx || x > 1 + mx || y < -my || y > 1 + my);
}

const lower = (a) => new Set(a.map((c) => c.toLowerCase()));

test('第3章の 魔物の え: けいやくの ID が ぜんぶ ある（ボスと 星の竜も）', () => {
  for (const id of ALL) {
    const d = MONSTER_ART[id];
    assert.ok(d, `${id} の え`);
    assert.ok(Array.isArray(d.size) && d.size.length === 2 && d.size.every((v) => Number.isInteger(v) && v >= 20 && v <= 160), `${id}: size`);
    assert.ok(Array.isArray(d.pal) && d.pal.length >= 4 && d.pal.every((c) => /^#[0-9a-f]{6}$/i.test(c)), `${id}: pal`);
    assert.equal(typeof d.draw, 'function', `${id}: draw`);
    if (d.field !== undefined) assert.ok(d.field >= 20 && d.field <= 32, `${id}: field`);
  }
  // addCh3Art だけでも ぜんぶ そろう（ほかの え に たよらない）
  const art = {};
  addCh3Art(art);
  for (const id of ALL) assert.ok(art[id]?.draw, `addCh3Art: ${id}`);
});

test('第3章の 魔物の え: 大きさの きまり（ふつう < ボス < 星の竜。たたかいの がめんに はいる）', () => {
  for (const id of CH3_MONSTERS) assert.ok(Math.max(...MONSTER_ART[id].size) <= 70, `${id} は ふつうの 大きさ`);
  for (const id of CH3_BOSSES) {
    const [w, h] = MONSTER_ART[id].size;
    assert.ok(w >= 80 && h >= 80, `${id} は ボスの 大きさ`);
    // たたかいの がめん（256×144、あしもと 124）に はいる
    assert.ok(w <= 140 && h + 2 <= 120, `${id}: ${w}×${h}`);
  }
  for (const id of CH3_DRAGON) assert.ok(MONSTER_ART[id].size[0] >= 140, `${id} は とても 大きい`);
  assert.ok(MONSTER_ART.flame_witch_true.size[0] > MONSTER_ART.flame_witch.size[0], '真の すがたは もっと 大きい');
});

test('第3章の 魔物の え: 2コマ とも、たたかいの 大きさ でも フィールドの 小さな え でも かける（いろは パレットの なか・はみださない）', () => {
  for (const id of ALL) {
    const d = MONSTER_ART[id];
    const pal = lower(d.pal);
    const [W, H] = d.size;
    const k = Math.min(1, (d.field || 20) / Math.max(W, H));
    for (const [w, h] of [[W, H], [Math.max(10, Math.round(W * k)), Math.max(10, Math.round(H * k))]]) {
      for (const f of [0, 1]) {
        const s = stubG(w, h);
        d.draw(s.g, f);
        assert.ok(s.pts.length > 20, `${id}: なにか かいた`);
        const bad = [...s.colors].filter((c) => !pal.has(String(c).toLowerCase()));
        assert.deepEqual(bad, [], `${id} f${f} ${w}×${h}: パレットに ない いろ`);
        const out = outside(s.pts, w, h);
        assert.equal(out.length, 0, `${id} f${f} ${w}×${h}: はみだし ${JSON.stringify(out.slice(0, 3))}`);
      }
    }
    // 2コマで うごく
    const a = stubG(W, H), b = stubG(W, H);
    d.draw(a.g, 0);
    d.draw(b.g, 1);
    assert.notDeepEqual(a.pts, b.pts, `${id}: コマで うごく`);
  }
});

test('大きな NPC: 星の竜は すこし 大きく かく（え の npc）。ほかは field.js の きまり', () => {
  assert.ok(bigNpcScale('mon:star_dragon') > 0.5);
  assert.ok(bigNpcScale('mon:star_dragon_sleep') > 0.5);
  assert.equal(bigNpcScale('mon:flame_witch'), null);
  assert.equal(bigNpcScale('treant'), null);
  assert.equal(bigNpcScale('mon:no_such_monster'), null);
});

test('星の竜に のる すがた: 4方向・2コマ・うしろと まえの え（いろは パレットの なか・はみださない）', () => {
  const pal = lower(DRAGON_PAL);
  for (const dir of ['left', 'right', 'up', 'down']) {
    for (const f of [0, 1]) {
      const all = stubG(DRAGON_W, DRAGON_H);
      drawDragon(all.g, dir, f, 'all');
      const back = stubG(DRAGON_W, DRAGON_H);
      drawDragon(back.g, dir, f, 'back');
      const front = stubG(DRAGON_W, DRAGON_H);
      drawDragon(front.g, dir, f, 'front');
      assert.ok(back.pts.length > 50 && front.pts.length > 10, `${dir} f${f}: うしろ と まえ`);
      assert.equal(all.pts.length, back.pts.length + front.pts.length, `${dir} f${f}: all = back + front`);
      const bad = [...all.colors].filter((c) => !pal.has(String(c).toLowerCase()));
      assert.deepEqual(bad, [], `${dir} f${f}: パレットに ない いろ`);
      assert.equal(outside(all.pts, DRAGON_W, DRAGON_H).length, 0, `${dir} f${f}: はみだし`);
    }
  }
  // のる 人の こしは 竜の せなかの うえ（え の なか）
  for (const [x, y] of Object.values(DRAGON_SEAT)) {
    assert.ok(x > 8 && x < DRAGON_W - 6 && y > 8 && y < DRAGON_H - 8);
  }
});

// ひらけた 草原
function openGrass(map) {
  for (let y = 60; y < map.h - 4; y++) {
    for (let x = 40; x < map.w - 4; x++) {
      if (map.zoneAt(x, y) !== 'plains') continue;
      let ok = true;
      for (let dy = -2; dy <= 2 && ok; dy++) for (let dx = -2; dx <= 2; dx++) if (map.tiles[(y + dy) * map.w + x + dx] !== T.GRASS) { ok = false; break; }
      if (ok) return { x, y };
    }
  }
  return null;
}

test('星の竜に のる: とんでいる 人に c3_dragon が あれば、ほかの 人の 画面でも 竜（いちの じょうほう mt）', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(31), checkPassword: () => true, rateLimit: false });
  const papa = new Bot(world, 'パパ');
  const kid = new Bot(world, 'ユイ');
  await papa.login('x');
  await kid.login('x');
  await papa.createAndPlay('warrior');
  await kid.createAndPlay('warrior');
  await papa.settle();
  await kid.settle();
  const c = papa.s.char;
  c.flags.p_opening = true;
  c.flags.c2_clear = true;
  c.flags.sky_flute = true;
  c.keyItems.push('wind_flute');
  const g = openGrass(MAPS.overworld);
  world.placeSession(papa.s, 'overworld', g.x + 0.5, g.y + 0.5, 'down', true);
  world.placeSession(kid.s, 'overworld', g.x + 2.5, g.y + 0.5, 'down', true);
  const lastSnap = () => kid.msgs.filter((m) => m.t === 'snap').pop()?.players.find((p) => p.sid === papa.s.id);
  // 大鳥（フラグ なし）
  papa.send({ t: 'fly', action: 'call' });
  assert.ok(papa.s.flying);
  await tickN(world, 4);
  assert.ok(lastSnap()?.air, 'とんでいる');
  assert.equal(lastSnap()?.mt, undefined, '大鳥');
  // 星の竜（c3_dragon）
  c.flags.c3_dragon = true;
  await tickN(world, 4);
  assert.equal(lastSnap()?.mt, 'dragon', '竜に のっている');
  // おりると なくなる
  papa.send({ t: 'fly', action: 'land' });
  assert.ok(!papa.s.flying);
  await tickN(world, 4);
  assert.equal(lastSnap()?.mt, undefined);
  assert.ok(!lastSnap()?.air);
});
