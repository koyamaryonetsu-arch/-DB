// 第4章の フィールドの 絵（render/tiles-ch4.js・tiles.js・field3d.js・tex3d.js・themes.js・weather.js・battlefx.js）
// ブラウザ なしで しらべられる こと: 2D の 絵が ぜんぶ あるか・つなぎめ・2.5D の かたち・洞窟の 色・天気・戦いの 背景
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import { MAPS } from '../public/js/shared/maps/index.js';
import { southWeatherAt, SOUTH_W, SOUTH_H, SOUTH_POS, STORM_Y } from '../public/js/shared/maps/south.js';
import { ZONE_BG_CH4, FIXED_CH4 } from '../public/js/shared/data/encounters-ch4.js';
import { Painter } from '../public/js/client/render/pixel.js';
import { paintTile, hasTileArt, isAnimated, frameOf, prepareMap } from '../public/js/client/render/tiles.js';
import { ch4Mask, duneShape, paintStorm, onDesert, CH4_PAINTERS, CH4_FRAMES } from '../public/js/client/render/tiles-ch4.js';
import {
  hasExtra, extraPainter, propPainter, PROP_TILES, leafPainter, puffPainter, curtainPainter, stormPainter,
} from '../public/js/client/render/tex3d.js';
import { blockSpec, WALL_TILES, TREE_TILES, SIDE_OF } from '../public/js/client/render/field3d.js';
import { partOfTile, partOfExtra, themeRgb } from '../public/js/client/render/themes.js';
import { Weather, WEATHER_KINDS, hazeOf } from '../public/js/client/render/weather.js';
import { battleBgSpec, battleBackground } from '../public/js/client/render/battlefx.js';

const CH4_TILES = [T.DESERT, T.DUNE, T.SANDSTONE, T.PALM, T.CACTUS, T.ADOBE, T.SANDSTORM, T.WELL_HOLE];
const CH4_EXTRAS = ['sandstone_top', 'sandstone_side', 'adobe_side', 'wall_top_adobe', 'dune_top'];
const HEX = /^#[0-9a-f]{6}$/i;

// ぜんぶの ドットが ぬられていて、いろが #rrggbb
function assertFull(p, what) {
  const empty = p.px.filter((c) => !c).length;
  assert.equal(empty, 0, `${what}: ぬられていない ドット ${empty}`);
  const bad = p.px.filter((c) => !HEX.test(c));
  assert.deepEqual(bad.slice(0, 3), [], `${what}: いろ`);
}

// タイルの テストで ためす ようす（mask）
const MASKS = {
  [T.DUNE]: [0, 1, 2, 4, 8, 2 | 8, 1 | 4, 1 | 2, 15, 1 | 2 | 16, 2 | 4 | 32, 4 | 8 | 64, 1 | 8 | 128, 255, 2 | 4 | 8 | 32 | 64],
  [T.SANDSTONE]: [...Array(16).keys()],
  [T.ADOBE]: [0, 1],
  [T.PALM]: [0, 1],
  [T.CACTUS]: [0, 1],
};

test('第4章の 2D の 絵: 8しゅるいの タイルに 絵が あり、16×16 を ぜんぶ ぬる（ちがい・ようす・コマ）', () => {
  for (const id of CH4_TILES) {
    assert.ok(hasTileArt(id), `${TILE_INFO[id].name} の 絵`);
    assert.ok(CH4_PAINTERS[id], `${TILE_INFO[id].name}: tiles-ch4.js`);
    const variants = id === T.SANDSTORM ? [...Array(16).keys()] : [0, 1, 2, 3, 7, 15];
    const frames = id === T.SANDSTORM ? [...Array(16).keys()] : [0];
    for (const m of MASKS[id] || [0]) {
      for (const v of variants) for (const f of frames) assertFull(paintTile(id, v, f, m), `${TILE_INFO[id].name} v${v} f${f} m${m}`);
    }
  }
  // ちがい（v）で 絵が かわる
  const a = paintTile(T.DESERT, 0).px.join(), b = paintTile(T.DESERT, 1).px.join();
  assert.notEqual(a, b, '砂ばくの ちがい');
});

test('第4章の マップで つかう タイルは ぜんぶ 絵が ある（まっくろに ならない。砂嵐の あとの タイルも）', () => {
  const ids = new Set();
  for (const id of ['south', 'north_well']) {
    const m = MAPS[id];
    for (const t of m.tiles) ids.add(t);
    for (const g of m.gates || []) { ids.add(g.open); ids.add(g.closed); }
  }
  for (const t of ids) assert.ok(hasTileArt(t), `タイル ${TILE_INFO[t]?.name ?? t}`);
  for (const id of CH4_TILES) assert.ok(ids.has(id), `${TILE_INFO[id].name} は マップで つかわれている`);
});

test('砂嵐: うごく（16コマ）・となりの マスと つながる・16コマで もとに もどる', () => {
  assert.ok(TILE_INFO[T.SANDSTORM].anim);
  assert.ok(isAnimated(T.SANDSTORM));
  assert.equal(CH4_FRAMES[T.SANDSTORM], 16);
  const seen = new Set();
  for (let t = 0; t < 2000; t += 20) seen.add(frameOf(T.SANDSTORM, t));
  assert.ok(seen.size >= 12, 'コマが すすむ');
  assert.notEqual(paintTile(T.SANDSTORM, 0, 0).px.join(), paintTile(T.SANDSTORM, 0, 1).px.join(), 'コマで うごく');
  // 4×4 マス（ばしょで きまる ちがい）を ならべると、64×64 の もようと おなじ → つなぎめが ない
  for (const f of [0, 5, 11]) {
    const big = new Painter(64, 64);
    paintStorm(big, 0, 0, f, 64, 64);
    for (let j = 0; j < 4; j++) {
      for (let i = 0; i < 4; i++) {
        const tile = paintTile(T.SANDSTORM, i | (j << 2), f, 0);
        for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
          assert.equal(tile.get(x, y), big.get(i * 16 + x, j * 16 + y), `f${f} マス${i},${j} (${x},${y})`);
        }
      }
    }
  }
  // 16コマで ひとまわり（64ドット すすむ）。こまかい 計算の ずれで ちがう ドットは ほとんど ない
  const p0 = new Painter(64, 64), p16 = new Painter(64, 64), px = new Painter(64, 64);
  paintStorm(p0, 0, 0, 0, 64, 64);
  paintStorm(p16, 0, 0, 16, 64, 64);
  paintStorm(px, 64, 0, 0, 64, 64);
  const diff = (a, b) => a.px.filter((c, k) => c !== b.px[k]).length;
  assert.ok(diff(p0, p16) < 64 * 64 * 0.01, `16コマ目: ${diff(p0, p16)}`);
  assert.ok(diff(p0, px) < 64 * 64 * 0.01, `64ドット 右: ${diff(p0, px)}`);
  // 2.5D の かべの え（64×64）も おなじ もよう
  assert.equal(stormPainter(3).px.join(), (() => { const p = new Painter(64, 64); paintStorm(p, 0, 0, 3, 64, 64); return p; })().px.join());
});

// ためしの グリッド（true = 砂丘）
function gridAt(grid) {
  const H = grid.length, W = grid[0].length;
  return (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? T.DESERT : grid[y][x] ? T.DUNE : T.DESERT);
}

test('砂丘: となりの 砂丘と さかいで おなじ 高さ（つなぎめが ない）・砂丘で ない ほうへは 0 まで さがる', () => {
  let seed = 7;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let n = 0; n < 60; n++) {
    const grid = Array.from({ length: 7 }, () => Array.from({ length: 7 }, () => rnd() < 0.62));
    const at = gridAt(grid);
    const mask = (x, y) => ch4Mask(T.DUNE, at, x, y);
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        if (!grid[y][x]) continue;
        const m = mask(x, y);
        assert.ok(m >= 0 && m <= 255);
        for (let k = 0; k <= 16; k += 0.5) {
          // 東の さかい
          const e = duneShape(m, 16, k);
          if (x + 1 < 7 && grid[y][x + 1]) assert.ok(Math.abs(e - duneShape(mask(x + 1, y), 0, k)) < 1e-9, `東 ${x},${y} k${k}`);
          else assert.ok(e < 1e-9, `東は 砂ばく ${x},${y}`);
          // 南の さかい
          const s = duneShape(m, k, 16);
          if (y + 1 < 7 && grid[y + 1][x]) assert.ok(Math.abs(s - duneShape(mask(x, y + 1), k, 0)) < 1e-9, `南 ${x},${y} k${k}`);
          else assert.ok(s < 1e-9, `南は 砂ばく ${x},${y}`);
        }
      }
    }
  }
  // ひとつだけの 砂丘は まるい 山（まんなかが いちばん 高い）
  assert.equal(duneShape(0, 8, 8), 1);
  assert.ok(duneShape(0, 8, 4) < 1 && duneShape(0, 8, 4) > 0);
  assert.equal(duneShape(0, 0, 0), 0);
  // まわりが ぜんぶ 砂丘なら どこも いちばん 高い
  for (const [x, y] of [[0, 0], [16, 16], [3, 12]]) assert.equal(duneShape(255, x, y), 1);
});

test('2D の となりの ようす（prepareMap）: 日干しれんがは かべの かお・砂嵐は ばしょで もよう・砂嵐の 下の 砂丘も つながる', () => {
  const m = MAPS.south;
  const r = prepareMap(m);
  const i = (x, y) => y * m.w + x;
  // 古井戸の わく（あなの 北の 日干しれんがは 下が あな → まえの かお）
  const wl = SOUTH_POS.well;
  assert.equal(m.tiles[i(wl.x, wl.y)], T.WELL_HOLE);
  assert.equal(m.tiles[i(wl.x, wl.y - 1)], T.ADOBE);
  assert.equal(r.mask[i(wl.x, wl.y - 1)] & 1, 1, 'わくの かお');
  assert.equal(r.mask[i(wl.x - 1, wl.y - 1)] & 1, 0, '下も かべ なら うえ');
  let storm = 0, duneGates = 0;
  const atOpen = (x, y) => {
    if (x < 0 || y < 0 || x >= m.w || y >= m.h) return -1;
    const g = m.gateAt.get(i(x, y));
    return g ? g.open : m.tiles[i(x, y)];
  };
  for (let y = 0; y < m.h; y++) {
    for (let x = 0; x < m.w; x++) {
      const t = m.tiles[i(x, y)];
      if (t === T.SANDSTORM) {
        storm++;
        assert.equal(r.variant[i(x, y)], (x & 3) | ((y & 3) << 2), `砂嵐の もよう ${x},${y}`);
        const g = m.gateAt.get(i(x, y));
        if (g?.open === T.DUNE) {
          duneGates++;
          assert.equal(r.mask[i(x, y)], ch4Mask(T.DUNE, atOpen, x, y), `砂嵐の 下の 砂丘 ${x},${y}`);
        }
      }
      if (t === T.DUNE) assert.equal(r.mask[i(x, y)], ch4Mask(T.DUNE, atOpen, x, y), `砂丘 ${x},${y}`);
      if (t === T.SANDSTONE) assert.ok(r.mask[i(x, y)] < 16);
    }
  }
  assert.ok(storm > 400, '砂嵐の かべ');
  assert.ok(duneGates > 0, 'ひらくと 砂丘に なる ところ');
  // 村の 井戸・かんばんは 砂ばくの 中なら 砂の 上（草の 中なら 草の 上）
  const at = (x, y) => (x < 0 || y < 0 || x >= m.w || y >= m.h ? -1 : m.tiles[i(x, y)]);
  let onSand = 0;
  for (let k = 0; k < m.tiles.length; k++) {
    if (m.tiles[k] !== T.WELL && m.tiles[k] !== T.SIGN) continue;
    const x = k % m.w, y = Math.floor(k / m.w), sand = onDesert(at, x, y);
    assert.equal(r.mask[k] & 2, sand ? 2 : 0, `${TILE_INFO[m.tiles[k]].name} ${x},${y}`);
    if (sand) onSand++;
  }
  assert.ok(onSand >= 3, '砂の 上の 井戸・かんばん');
  // ほかの 章の マップは かわらない（砂ばくが ない）
  const ow = MAPS.overworld, ro = prepareMap(ow);
  for (let k = 0; k < ow.tiles.length; k++) if (ow.tiles[k] === T.WELL || ow.tiles[k] === T.SIGN) assert.equal(ro.mask[k], 0);
});

test('2.5D の かたち: 日干しれんがは 石・木の かべと おなじ（やね・まえの かお）、砂岩は 高い 岩、ヤシは 木、サボテンは たてた もの', () => {
  assert.ok(WALL_TILES.has(T.ADOBE) && WALL_TILES.has(T.WALL_STONE) && WALL_TILES.has(T.WALL_WOOD));
  for (const [x, y] of [[3, 4], [10, 7], [21, 30]]) {
    const a = blockSpec(T.ADOBE, x, y), s = blockSpec(T.WALL_STONE, x, y);
    assert.equal(a.h, s.h, 'かべの 高さ');
    assert.equal(a.south[0], 't');
    assert.equal(a.south[1], T.ADOBE);
    assert.equal(a.south[3], 1, 'まえの かお（2D の mask 1）');
    const st = blockSpec(T.SANDSTONE, x, y);
    assert.ok(st.h >= 1.05 && st.h <= 1.85, `砂岩の 高さ ${st.h}`);
  }
  // 砂岩は となりと 高さが そろいやすい（段々の 岩山）
  const hs = new Set();
  for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) hs.add(blockSpec(T.SANDSTONE, x, y).h.toFixed(3));
  assert.ok(hs.size >= 3 && hs.size <= 5, `段の 数 ${hs.size}`);
  // 3D の え は ぜんぶ ある
  for (const id of [T.ADOBE, T.SANDSTONE]) {
    for (const key of ['top', 'side', 'south']) {
      const k = blockSpec(id, 5, 5)[key];
      if (k?.[0] === 'x') assert.ok(hasExtra(k[1]), `${TILE_INFO[id].name}.${key}: ${k[1]}`);
    }
  }
  for (const name of CH4_EXTRAS) {
    assert.ok(hasExtra(name), name);
    for (const v of [0, 1, 2, 3]) assertFull(extraPainter(name, v), `${name} v${v}`);
  }
  assert.ok(TREE_TILES.has(T.PALM), 'ヤシの木は 木（3D の みき と 葉）');
  assert.ok(PROP_TILES.has(T.CACTUS), 'サボテンは たてた もの');
  // 地面・砂丘・砂嵐・古井戸は ブロックで ない（砂丘・砂嵐は field3d.js が とくべつな かたちで つくる）
  for (const id of [T.DESERT, T.DUNE, T.SANDSTORM, T.WELL_HOLE, T.PALM, T.CACTUS]) assert.equal(blockSpec(id, 0, 0), null, TILE_INFO[id].name);
  assert.equal(SIDE_OF[T.DESERT], 'sand_side');
  assert.equal(SIDE_OF[T.DUNE], 'sand_side');
});

test('2.5D の え: ヤシの 葉は すきまが とうめい、サボテンは ふちどり、砂嵐の 砂けむりと まく', () => {
  const leaf = leafPainter('palm');
  const on = leaf.px.filter(Boolean).length;
  assert.ok(on > 40 && on < 200, `ヤシの 葉 ${on}`);
  assertFull(leafPainter('palmtrunk'), 'ヤシの みき');
  assertFull(leafPainter('coconut'), 'ヤシの み');
  const cactus = propPainter(T.CACTUS);
  assert.ok(cactus && cactus.px.includes('#1b1330'), 'サボテンの ふちどり');
  // 砂けむり（4しゅるい × 4コマ）: まんなかは こく、すみは とうめい
  const frames = [0, 1, 2, 3].map((f) => puffPainter(f));
  for (const p of frames) {
    assert.equal(p.w, 128);
    for (let k = 0; k < 4; k++) {
      assert.ok(p.get(k * 32 + 16, 18), `かたまり ${k} の まんなか`);
      assert.equal(p.get(k * 32, 0), null, `かたまり ${k} の すみ`);
      assert.ok(p.px.every((c) => !c || HEX.test(c)));
    }
  }
  assert.notEqual(frames[0].px.join(), frames[1].px.join(), '砂けむりは コマで うごく');
  // まく: 上は とうめい、下は こい（rgba）
  for (const seed of [0, 1, 2]) {
    const c = curtainPainter(seed);
    const top = c.px.slice(0, 64).filter(Boolean).length, bottom = c.px.slice(31 * 64).filter(Boolean).length;
    assert.ok(top < 20 && bottom === 64, `まく ${seed}: 上 ${top} 下 ${bottom}`);
    assert.ok(c.px.filter(Boolean).every((x) => /^rgba\(\d+,\d+,\d+,0?\.\d+\)$/.test(x)));
  }
});

test('洞窟の 色（sand）: 北の古井戸は あたたかい 砂の 色・第4章の タイルは 色を かえない', () => {
  assert.equal(MAPS.north_well.theme, 'sand');
  for (const id of CH4_TILES) assert.equal(partOfTile(id), 'none', TILE_INFO[id].name);
  for (const name of CH4_EXTRAS) assert.equal(partOfExtra(name), 'none', name);
  // ゆか（#4a4038）・かべ（#4b3d33）は 赤みの ある 砂色、水（#1f3f6e）は にごった 緑
  const floor = themeRgb(0x4a, 0x40, 0x38, 'sand', 'floor');
  const wall = themeRgb(0x4b, 0x3d, 0x33, 'sand', 'wall');
  const water = themeRgb(0x1f, 0x3f, 0x6e, 'sand', 'water');
  assert.ok(floor[0] > floor[2] + 30 && floor[0] > 0x4a, `ゆか ${floor}`);
  assert.ok(wall[0] > wall[2] + 30, `かべ ${wall}`);
  assert.ok(water[1] > water[0] && water[1] >= water[2] - 10, `水 ${water}`);
  assert.deepEqual(themeRgb(10, 20, 30, 'sand', 'none'), [10, 20, 30]);
  // 氷・ほのおの 洞窟は いままで どおり
  assert.notDeepEqual(themeRgb(0x4a, 0x40, 0x38, 'ice', 'floor'), floor);
});

// 天気の テスト用の キャンバス（よばれた ことを おぼえる）
function mockCtx() {
  const log = { fill: [], styles: [], gradients: 0 };
  const ctx = {
    set fillStyle(v) { log.styles.push(v); this._fs = v; },
    get fillStyle() { return this._fs; },
    fillRect(x, y, w, h) { log.fill.push([x, y, w, h, this._fs]); },
    beginPath() {}, ellipse() {}, arc() { log.arcs = (log.arcs || 0) + 1; }, fill() {},
    createRadialGradient() { log.gradients++; return { addColorStop(o, c) { log.styles.push(c); } }; },
  };
  return { ctx, log };
}

test('天気: 砂ぼこり（sand）と 砂嵐（sandstorm）。かすみの 色は 天気ごと（いままでの 天気は おなじ 色）', () => {
  assert.ok(WEATHER_KINDS.includes('sand') && WEATHER_KINDS.includes('sandstorm'));
  // コガネ地方の 天気は ぜんぶ ある しゅるい
  const kinds = new Set();
  for (let y = 0; y < SOUTH_H; y++) for (let x = 0; x < SOUTH_W; x++) kinds.add(southWeatherAt(x, y));
  for (const k of kinds) assert.ok(k === null || WEATHER_KINDS.includes(k), `天気 ${k}`);
  assert.ok(kinds.has('sand') && kinds.has('sandstorm'));
  assert.equal(southWeatherAt(36, STORM_Y[0] - 2), 'sandstorm');
  // かすみの 色
  assert.equal(hazeOf('blizzard'), '232, 240, 255');
  assert.equal(hazeOf('steam'), '232, 240, 255');
  for (const k of ['sand', 'sandstorm']) {
    const [r, g, b] = hazeOf(k).split(',').map(Number);
    assert.ok(r > b + 50 && g > b, `${k} は あたたかい 色`);
  }
  // かいてみる（ブラウザ なし）
  for (const kind of WEATHER_KINDS) {
    const w = new Weather();
    const { ctx, log } = mockCtx();
    for (let i = 0; i < 6; i++) w.draw(ctx, 320, 180, 16, kind, i * 3, 0);
    assert.ok(log.fill.length > 20, `${kind}: つぶ`);
  }
  const old = new Weather(), m1 = mockCtx();
  old.draw(m1.ctx, 320, 180, 16, 'blizzard', 0, 0);
  assert.ok(m1.log.styles.some((s) => String(s).startsWith('rgba(232, 240, 255, ')), 'ふぶきの かすみ');
  // 砂嵐: まんなかは うすい かすみ（自分の まわりは 見える）・よこに ながい 砂の すじ・多い つぶ
  const st = new Weather(), m2 = mockCtx();
  for (let i = 0; i < 4; i++) st.draw(m2.ctx, 320, 180, 16, 'sandstorm', 0, 0);
  assert.ok(m2.log.gradients >= 4, 'まんなかが うすい かすみ');
  const stops = m2.log.styles.filter((s) => String(s).startsWith('rgba(188, 130, 70, '));
  assert.ok(stops.length >= 8);
  const inner = Number(stops[0].split(',')[3].replace(')', '')), outer = Number(stops[1].split(',')[3].replace(')', ''));
  assert.ok(inner < outer && inner < 0.15 && outer >= 0.3, `かすみ ${inner} → ${outer}`);
  const grains = m2.log.fill.filter(([, , w, h, c]) => w > h && /^#/.test(c));
  assert.ok(grains.length > 250 * 4 * 0.8, `よこに ながい すじ ${grains.length}`);
  const sand = new Weather(), m3 = mockCtx();
  sand.draw(m3.ctx, 320, 180, 16, 'sand', 0, 0);
  assert.equal(m3.log.gradients, 0, '砂ぼこりは うすい かすみ だけ');
  assert.ok(m3.log.styles.some((s) => String(s).startsWith('rgba(255, 212, 148, ')));
  // 夜は 砂の かすみが うすい（ふぶきは いままで どおり）
  const alpha = (kind, night, rgb) => {
    const w = new Weather(), m = mockCtx();
    w.draw(m.ctx, 320, 180, 16, kind, 0, 0, night);
    return Number(String(m.log.styles.find((s) => String(s).startsWith(`rgba(${rgb}, `))).split(',')[3].replace(')', ''));
  };
  assert.ok(alpha('sandstorm', 0.5, '188, 130, 70') < alpha('sandstorm', 0, '188, 130, 70') * 0.6, '夜の 砂嵐');
  assert.ok(alpha('sand', 0.5, '255, 212, 148') < alpha('sand', 0, '255, 212, 148'), '夜の 砂ぼこり');
  assert.equal(alpha('blizzard', 0.5, '232, 240, 255'), alpha('blizzard', 0, '232, 240, 255'), 'ふぶきは かわらない');
});

// 戦いの 背景を かく ための ブラウザの まね
function withFakeDocument(fn) {
  const calls = { arc: 0, fillRect: 0 };
  const canvas = () => ({
    width: 0, height: 0,
    getContext: () => ({
      imageSmoothingEnabled: true, fillStyle: '',
      fillRect() { calls.fillRect++; }, beginPath() {}, fill() {}, ellipse() {}, arc() { calls.arc++; },
      createRadialGradient: () => ({ addColorStop() {} }),
    }),
  });
  const had = 'document' in globalThis, prev = globalThis.document;
  globalThis.document = { createElement: () => canvas() };
  try { return fn(calls); } finally { if (had) globalThis.document = prev; else delete globalThis.document; }
}

test('戦いの 背景: 砂ばく（昼・夜）・砂の 洞窟・海辺。出現表の 背景は ぜんぶ ある', () => {
  for (const id of ['desert', 'desert_night', 'sand_cave', 'beach', 'beach_night']) assert.ok(battleBgSpec(id), id);
  for (const bg of Object.values(ZONE_BG_CH4)) assert.ok(battleBgSpec(bg), `出現表 ${bg}`);
  for (const f of Object.values(FIXED_CH4)) assert.ok(battleBgSpec(f.bg), `きまった 戦い ${f.bg}`);
  // 夜の 砂ばくは 昼の データから（night-art.js の nightBg）
  const day = battleBgSpec('desert'), night = battleBgSpec('desert_night');
  assert.equal(night.night, true);
  assert.equal(night.deco, day.deco);
  assert.notEqual(night.far, day.far);
  assert.equal(battleBgSpec('no_such_place'), null);
  // かいてみる（昼は 太陽、夜は 月）
  withFakeDocument((calls) => {
    for (const id of ['desert', 'desert_night', 'sand_cave', 'beach', 'beach_night']) {
      const before = calls.fillRect;
      const c = battleBackground(id);
      assert.ok(c && calls.fillRect - before > 300, `${id} を かいた`);
    }
    const a0 = calls.arc;
    battleBackground('desert');
    assert.ok(calls.arc - a0 >= 4, '昼の 太陽');
    const a1 = calls.arc;
    battleBackground('desert_night');
    assert.equal(calls.arc - a1, 1, '夜は 月 だけ');
  });
});
