// 第4章の フィールドの 絵（render/tiles-ch4.js・tiles-canal.js・tiles.js・field3d.js・tex3d.js・themes.js・weather.js・battlefx.js）
// ブラウザ なしで しらべられる こと: 2D の 絵が ぜんぶ あるか・つなぎめ・2.5D の かたち・洞窟の 色・天気・戦いの 背景
// Step 2（かれた地下水路）: 水路の タイル・水の 流れ・水路の 底の ひびわれ・岸の ようす・2.5D の 高さ・地下水路の 色・広間の 背景
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, TILE_INFO, parseRows } from '../public/js/shared/tiles.js';
import { MAPS } from '../public/js/shared/maps/index.js';
import { southWeatherAt, SOUTH_W, SOUTH_H, SOUTH_POS, STORM_Y } from '../public/js/shared/maps/south.js';
import { ZONE_BG_CH4, FIXED_CH4 } from '../public/js/shared/data/encounters-ch4.js';
import { Painter } from '../public/js/client/render/pixel.js';
import { paintTile, hasTileArt, isAnimated, frameOf, prepareMap } from '../public/js/client/render/tiles.js';
import { ch4Mask, duneShape, paintStorm, onDesert, CH4_PAINTERS, CH4_FRAMES } from '../public/js/client/render/tiles-ch4.js';
import { paintCanalWater, paintCanalBed, canalFlow, CANAL_CTX, CANAL_CTX_TILES, CANAL_SUN } from '../public/js/client/render/tiles-canal.js';
import {
  hasExtra, extraPainter, propPainter, PROP_TILES, leafPainter, puffPainter, curtainPainter, stormPainter, canalWaterPainter, rubblePainter,
} from '../public/js/client/render/tex3d.js';
import { blockSpec, WALL_TILES, TREE_TILES, SIDE_OF, FLOOR_H, CANAL_WATER_Y, GATE_H } from '../public/js/client/render/field3d.js';
import { partOfTile, partOfExtra, partOfProp, themeRgb } from '../public/js/client/render/themes.js';
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

test('戦いの 背景: 砂ばく（昼・夜）・砂の 洞窟・海辺・地下水路の 広間。出現表の 背景は ぜんぶ ある', () => {
  for (const id of ['desert', 'desert_night', 'sand_cave', 'beach', 'beach_night', 'canal']) assert.ok(battleBgSpec(id), id);
  // 地下水路の 出現表（s_canal・s_canal2）と ボス戦は 地下水路の 広間
  assert.equal(ZONE_BG_CH4.s_canal, 'canal');
  assert.equal(ZONE_BG_CH4.s_canal2, 'canal');
  assert.equal(FIXED_CH4.armor_scorpion.bg, 'canal');
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
    for (const id of ['desert', 'desert_night', 'sand_cave', 'beach', 'beach_night', 'canal']) {
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
    // 地下水路: アーチ（5つ）・たいまつの あかり（4つ）・トンネルの おくの あかり
    const a2 = calls.arc;
    battleBackground('canal');
    assert.ok(calls.arc - a2 >= 15, `アーチ と たいまつ ${calls.arc - a2}`);
  });
});

// ───────────── 第4章 Step 2: かれた地下水路 ─────────────
const CANAL_TILES = [T.CANAL_FLOOR, T.CANAL_WALL, T.CANAL_BED, T.CANAL_WATER, T.SLUICE, T.SLUICE_OPEN, T.GRATE, T.DAM];
const CANAL_EXTRAS = ['canal_side', 'canal_wall_side', 'canal_wall_top', 'canal_wall_top_sun', 'dam_top', 'sluice_top', 'sluice_board', 'canal_pillar_side', 'canal_pillar_top'];
// ためす ようす（mask）と ちがい（variant。水路の 中は ばしょ 0〜15 と 流れの むき 16）
const CANAL_MASKS = {
  [T.CANAL_FLOOR]: [0, 1, 2, 4, 8, 5, 10, 15, 16, 32, 64, 128, 1 | 32 | 64, 255],
  [T.CANAL_WALL]: [0, 1, 3, 5, 9, 13, 15, 16, 20, 28, 1 | 32, 13 | 32, 16 | 32],
  [T.CANAL_BED]: [0, 1, 2, 4, 8, 9, 15, 128, 1 | 2 | 128],
  [T.CANAL_WATER]: [0, 1, 2, 4, 8, 9, 15, 128],
  [T.DAM]: [0, 16, 1, 9, 16 | 2 | 8, 1 | 4 | 16],
};
const CANAL_VARIANTS = {
  [T.CANAL_FLOOR]: [...Array(16).keys()],
  [T.CANAL_BED]: [...Array(32).keys()],
  [T.CANAL_WATER]: [0, 1, 4, 5, 16, 17, 20, 21],
  [T.DAM]: [...Array(32).keys()],
};

test('地下水路の 2D の 絵: 8しゅるいの タイルに 絵が あり、16×16 を ぜんぶ ぬる（ちがい・ようす・コマ）。水は 16コマで ながれる', () => {
  for (const id of CANAL_TILES) {
    assert.ok(hasTileArt(id) && CH4_PAINTERS[id], `${TILE_INFO[id].name} の 絵`);
    const frames = id === T.CANAL_WATER ? [...Array(16).keys()] : [0];
    for (const m of CANAL_MASKS[id] || [0]) {
      for (const v of CANAL_VARIANTS[id] || [0, 1, 2, 3]) for (const f of frames) assertFull(paintTile(id, v, f, m), `${TILE_INFO[id].name} v${v} f${f} m${m}`);
    }
  }
  // 水は ながれる（16コマ）
  assert.ok(TILE_INFO[T.CANAL_WATER].anim && isAnimated(T.CANAL_WATER));
  assert.equal(CH4_FRAMES[T.CANAL_WATER], 16);
  const seen = new Set();
  for (let t = 0; t < 4000; t += 37) seen.add(frameOf(T.CANAL_WATER, t));
  assert.equal(seen.size, 16, 'コマが すすむ');
  assert.notEqual(paintTile(T.CANAL_WATER, 0, 0).px.join(), paintTile(T.CANAL_WATER, 0, 3).px.join(), '水が ながれる');
  // 水路の 底は ばしょで もようが ちがう・水門は しまった と 開いた で ちがう・こうしも ちがう
  assert.notEqual(paintTile(T.CANAL_BED, 0).px.join(), paintTile(T.CANAL_BED, 1).px.join(), '底の もよう');
  assert.notEqual(paintTile(T.SLUICE, 0).px.join(), paintTile(T.SLUICE_OPEN, 0).px.join(), '水門');
  assert.notEqual(paintTile(T.GRATE, 0).px.join(), paintTile(T.SLUICE, 0).px.join(), 'こうし');
  // 北の 岸は 石の かべの かお・かべの かお と うえ・通路の ふちの 石・かべの かげ
  assert.notEqual(paintTile(T.CANAL_BED, 0, 0, 0).px.join(), paintTile(T.CANAL_BED, 0, 0, 1).px.join(), '北の 岸');
  assert.notEqual(paintTile(T.CANAL_WATER, 0, 0, 0).px.join(), paintTile(T.CANAL_WATER, 0, 0, 1).px.join(), '水の 北の 岸');
  assert.notEqual(paintTile(T.CANAL_WALL, 0, 0, 1).px.join(), paintTile(T.CANAL_WALL, 0, 0, 0).px.join(), 'かべの かお と うえ');
  assert.notEqual(paintTile(T.CANAL_FLOOR, 0, 0, 0).px.join(), paintTile(T.CANAL_FLOOR, 0, 0, 1).px.join(), 'ふちの 石');
  assert.notEqual(paintTile(T.CANAL_FLOOR, 0, 0, 0).px.join(), paintTile(T.CANAL_FLOOR, 4, 0, 0).px.join(), 'かべの かげ');
  // 地下水路の マップ（theme 'canal'）で つかう タイルは ぜんぶ 絵が ある（とびらの 前と 後も）
  for (const m of Object.values(MAPS).filter((mm) => mm.theme === 'canal')) {
    const ids = new Set(m.tiles);
    for (const g of m.gates || []) { ids.add(g.open); ids.add(g.closed); }
    for (const t of ids) assert.ok(hasTileArt(t), `${m.id}: ${TILE_INFO[t]?.name ?? t}`);
  }
});

test('地下水路の まわりの ふつうの タイル（たいまつ・レバー・かいだん・柱・がれき・ボスの ゆか）は 水路の え で かく（mask の CANAL_CTX）', () => {
  for (const id of CANAL_CTX_TILES) {
    const m = id === T.TORCH ? 1 | CANAL_CTX : CANAL_CTX;
    const canal = paintTile(id, 1, 0, m), plain = paintTile(id, 1, 0, m & ~CANAL_CTX);
    assertFull(canal, `${TILE_INFO[id].name}（水路）`);
    assert.notEqual(canal.px.join(), plain.px.join(), `${TILE_INFO[id].name}: 水路の え`);
  }
  assert.notEqual(paintTile(T.TORCH, 0, 0, 1 | CANAL_CTX).px.join(), paintTile(T.TORCH, 0, 1, 1 | CANAL_CTX).px.join(), 'たいまつの ほのお');
  // ほかの 章の レバーは いままで どおり
  assert.equal(paintTile(T.LEVER, 2, 0, 0).px.join(), paintTile(T.LEVER, 2, 0, 2).px.join());
});

test('地下水路の 水: 32×32 の もようで となりの マスと つながる（東へ・南へ）・16コマで 32ドット ながれて もとに もどる・2.5D の 水も おなじ もよう', () => {
  const diff = (a, b) => a.px.filter((c, k) => c !== b.px[k]).length;
  for (const flow of [0, 1]) {
    for (const f of [0, 5, 11]) {
      const big = new Painter(32, 32);
      paintCanalWater(big, 0, 0, f, 32, 32, flow);
      for (let j = 0; j < 2; j++) {
        for (let i = 0; i < 2; i++) {
          const tile = paintTile(T.CANAL_WATER, i | (j << 2) | (flow << 4), f, 0);
          for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) assert.equal(tile.get(x, y), big.get(i * 16 + x, j * 16 + y), `flow${flow} f${f} マス${i},${j} (${x},${y})`);
        }
      }
      assert.equal(canalWaterPainter(f, flow).px.join(), big.px.join(), `2.5D の 水 flow${flow} f${f}`);
    }
    const p0 = new Painter(32, 32), p16 = new Painter(32, 32);
    paintCanalWater(p0, 0, 0, 0, 32, 32, flow);
    paintCanalWater(p16, 0, 0, 16, 32, 32, flow);
    assert.ok(diff(p0, p16) < 32 * 32 * 0.01, `16コマで ひとまわり: ${diff(p0, p16)}`);
  }
  // 東へ・南へ で もようが ちがう（さざなみは どちらも よこ）
  assert.notEqual(canalWaterPainter(0, 0).px.join(), canalWaterPainter(0, 1).px.join());
});

test('地下水路の 底: 64×64 の ひびわれ もようで となりの マスと つながる（風紋は 流れの むきで かわる）', () => {
  for (const flow of [0, 1]) {
    const big = new Painter(64, 64);
    paintCanalBed(big, 0, 0, 64, 64, flow);
    for (let j = 0; j < 4; j++) {
      for (let i = 0; i < 4; i++) {
        const tile = paintTile(T.CANAL_BED, i | (j << 2) | (flow << 4), 0, 0);
        for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) assert.equal(tile.get(x, y), big.get(i * 16 + x, j * 16 + y), `flow${flow} マス${i},${j} (${x},${y})`);
      }
    }
  }
  assert.notEqual(paintTile(T.CANAL_BED, 5, 0, 0).px.join(), paintTile(T.CANAL_BED, 5 | 16, 0, 0).px.join(), '風紋の むき');
});

// ためしの 地下水路（# かべ . 通路 _ 底 ~ 水 H 水門 D せき 9 レバー i たいまつ）
const CANAL_ROWS = [
  '##########',
  '#i..#~~~~#',
  '#...#DDDD#',
  '#.9.H____#',
  '#........#',
  '##########',
];
const CANAL_LEGEND = { '#': T.CANAL_WALL, '.': T.CANAL_FLOOR, _: T.CANAL_BED, '~': T.CANAL_WATER, H: T.SLUICE, D: T.DAM, 9: T.LEVER, i: T.TORCH };
function canalTestMap(gates = []) {
  const t = parseRows(CANAL_ROWS, CANAL_LEGEND);
  return { id: 'canal_test', kind: 'dungeon', theme: 'canal', w: t.w, h: t.h, tiles: t.tiles, gates };
}

test('地下水路の となりの ようす（prepareMap）: 水路の 岸・通路の ふちの 石・かべの かお・水路の かべの たいまつ と レバー。とびらで 底 ⇔ 水 ⇔ せき が かわっても おなじ', () => {
  const m = canalTestMap();
  const r = prepareMap(m);
  const i = (x, y) => y * m.w + x;
  // 水路の 中: 1=北 2=東 4=南 8=西 が 岸
  assert.equal(r.mask[i(5, 1)], 1 | 8, '水（北と 西は かべ。南は せき）');
  assert.equal(r.mask[i(6, 3)], 4, '底（南は 通路）');
  assert.equal(r.mask[i(5, 3)], 4 | 8, '底（西は 水門）');
  assert.equal(r.mask[i(8, 3)], 2 | 4, '底（東は かべ）');
  assert.equal(r.mask[i(5, 2)], 8, 'せき（よこに ならぶ）');
  // 通路の ふちの 石（北が 水路）・ななめだけ 水路（北東）
  assert.equal(r.mask[i(6, 4)], 1);
  assert.equal(r.mask[i(4, 4)], 16);
  // かべ: まえの かお（1）・下が 水路（2）・西 / 東が ひらいている（4 / 8）
  assert.equal(r.mask[i(5, 0)], 1 | 2, '水路の 上の かべ');
  assert.equal(r.mask[i(4, 2)], 1 | 4 | 8, '水門の 上の かべ');
  assert.equal(r.mask[i(4, 1)] & 1, 0, '下も かべ なら うえ');
  // 水路の かべの たいまつ・水路の レバー
  assert.equal(r.mask[i(1, 1)] & (1 | CANAL_CTX), 1 | CANAL_CTX, 'たいまつ');
  assert.equal(r.mask[i(2, 3)], CANAL_CTX, 'レバー');
  // ちがい: 水路の 中は ばしょと 流れの むき、通路は かべの かげ（北が かべ 4・西が かべ 8）
  assert.equal(r.variant[i(6, 3)], 2 | (3 << 2), '底（東西に 流れる）');
  assert.equal(r.variant[i(1, 2)] & 12, 4 | 8, 'すみの 通路');
  assert.equal(r.variant[i(6, 4)] & 12, 0);
  // とびら（水門が 開く・底に 水が 来る・せきが くずれて 水に なる）でも mask と ちがい は おなじ
  const gates = [
    { x: 4, y: 3, closed: T.SLUICE, open: T.SLUICE_OPEN, flag: 'g1' },
    ...[5, 6, 7, 8].map((x) => ({ x, y: 3, closed: T.CANAL_BED, open: T.CANAL_WATER, flag: 'g1' })),
    ...[5, 6, 7, 8].map((x) => ({ x, y: 2, closed: T.DAM, open: T.CANAL_WATER, flag: 'g2' })),
  ];
  const g = prepareMap(canalTestMap(gates));
  assert.deepEqual([...g.mask], [...r.mask], 'mask');
  assert.deepEqual([...g.variant], [...r.variant], 'ちがい');
  // 流れの むき: よこに ながい 水路は 東西、たてに ながい 水路は 南北
  const at = (rows) => (x, y) => (y < 0 || y >= rows.length || x < 0 || x >= rows[0].length ? -1 : rows[y][x] === '_' ? T.CANAL_BED : T.CANAL_WALL);
  assert.equal(canalFlow(at(['#######', '#_____#', '#_____#', '#######']), 3, 1), 0);
  assert.equal(canalFlow(at(['####', '#__#', '#__#', '#__#', '#__#', '####']), 1, 2), 1);
  // 外（フィールドの 水路の 入り口）の かべは 日が あたる（mask 32）。地下では つかない
  const out = prepareMap({ ...canalTestMap(), id: 'canal_out', kind: 'field', theme: undefined });
  assert.equal(out.mask[i(5, 0)], 1 | 2 | CANAL_SUN, '外の かべ');
  assert.equal(r.mask[i(5, 0)] & CANAL_SUN, 0, '地下の かべ');
  assert.notEqual(paintTile(T.CANAL_WALL, 0, 0, 1 | CANAL_SUN).px.join(), paintTile(T.CANAL_WALL, 0, 0, 1).px.join(), 'すその 砂');
  assert.notEqual(extraPainter('canal_wall_top_sun', 0).px.join(), extraPainter('canal_wall_top', 0).px.join(), '日の あたる うえ');
});

test('地下水路の 2.5D: かべは 洞窟の かべと おなじ 高さ・水門と こうしは かべの 中の とびら・水路の 底と 水は 通路より ひくい', () => {
  const cw = blockSpec(T.CANAL_WALL, 3, 4);
  assert.equal(cw.h, blockSpec(T.CAVE_WALL, 3, 4).h, 'かべの 高さ');
  assert.equal(cw.south[0], 't');
  assert.equal(cw.south[1], T.CANAL_WALL);
  assert.equal(cw.south[3], 1, 'まえの かお（2D の mask 1）');
  for (const id of [T.SLUICE, T.SLUICE_OPEN, T.GRATE]) {
    const sp = blockSpec(id, 2, 2);
    assert.ok(sp.gate && sp.h === cw.h, `${TILE_INFO[id].name}: かべの 中の とびら`);
    assert.deepEqual(sp.south, ['t', id, 0, 0], `${TILE_INFO[id].name}: とびらの え は 2D と おなじ`);
  }
  assert.ok(GATE_H > 0.8 && GATE_H < cw.h, 'とびらの 上は 石の かべ');
  assert.equal(blockSpec(T.SLUICE, 0, 0).top[1], 'sluice_top', '水門の うえに 車');
  for (const id of [T.CANAL_FLOOR, T.CANAL_BED, T.CANAL_WATER, T.DAM]) assert.equal(blockSpec(id, 0, 0), null, TILE_INFO[id].name);
  // たかさ: 通路 0・水路の 底は ひくい・水は 底より 上で 通路より ひくい・せきは 底から もり上がる
  assert.equal(FLOOR_H[T.CANAL_FLOOR], undefined);
  assert.ok(FLOOR_H[T.CANAL_BED] < -0.25 && FLOOR_H[T.CANAL_BED] > -0.7, `底 ${FLOOR_H[T.CANAL_BED]}`);
  assert.ok(CANAL_WATER_Y < -0.1 && CANAL_WATER_Y > FLOOR_H[T.CANAL_BED], `水 ${CANAL_WATER_Y}`);
  assert.equal(FLOOR_H[T.DAM], FLOOR_H[T.CANAL_BED]);
  assert.equal(SIDE_OF[T.CANAL_FLOOR], 'canal_side', '水路の 岸の よこ');
  for (const id of [T.CANAL_WALL, T.SLUICE, T.SLUICE_OPEN, T.GRATE]) {
    for (const key of ['top', 'side']) assert.ok(hasExtra(blockSpec(id, 5, 5)[key][1]), `${TILE_INFO[id].name}.${key}`);
  }
  for (const name of CANAL_EXTRAS) {
    assert.ok(hasExtra(name), name);
    for (const v of [0, 1, 2, 3]) assertFull(extraPainter(name, v), `${name} v${v}`);
  }
  // がれきの 石と 切り石（たてた 石の え。48×16）
  const rb = rubblePainter();
  assert.equal(rb.w, 48);
  assertFull(rb, 'がれきの 石');
});

test('地下水路の 色（canal）: ふつうの ダンジョンの タイルは 黄土色の 石と 青緑の 水・地下水路の タイルは 色を かえない', () => {
  for (const id of CANAL_TILES) assert.equal(partOfTile(id), 'none', TILE_INFO[id].name);
  for (const name of CANAL_EXTRAS) assert.equal(partOfExtra(name), 'none', name);
  // 水路の え で かいた たいまつ・かいだん などは 色を かえない（ふつうの ときは いままで どおり）
  assert.equal(partOfTile(T.TORCH, 1 | CANAL_CTX), 'none');
  assert.equal(partOfTile(T.TORCH, 1), 'wall');
  assert.equal(partOfTile(T.STAIRS_UP, CANAL_CTX), 'none');
  assert.equal(partOfTile(T.STAIRS_UP), 'floor');
  // 2.5D の レバーは 地下水路では 色を かえない（ほかの 洞窟は いままで どおり）
  assert.equal(partOfProp(T.LEVER, 'canal'), 'none');
  assert.equal(partOfProp(T.LEVER, 'lava'), 'floor');
  // 洞窟の ゆか（#4a4038）は 水路の 石だたみ（#b8a07a）くらいの 明るさの あたたかい 色・かべは こい 黄土色・水は 青緑
  const lum = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b;
  const floor = themeRgb(0x4a, 0x40, 0x38, 'canal', 'floor');
  const wall = themeRgb(0x4b, 0x3d, 0x33, 'canal', 'wall');
  const water = themeRgb(0x1f, 0x3f, 0x6e, 'canal', 'water');
  assert.ok(floor[0] > floor[2] + 30 && Math.abs(lum(floor) - lum([0xb8, 0xa0, 0x7a])) < 30, `ゆか ${floor}`);
  assert.ok(wall[0] > wall[2] + 25 && lum(wall) < lum(floor), `かべ ${wall}`);
  assert.ok(water[2] > water[0] + 40 && water[1] > water[0] + 30, `水 ${water}`);
  // たいまつの 火は そのまま・砂の 洞窟とは ちがう 色
  assert.deepEqual(themeRgb(0xff, 0x7a, 0x2a, 'canal', 'wall'), [0xff, 0x7a, 0x2a]);
  assert.notDeepEqual(themeRgb(0x4a, 0x40, 0x38, 'sand', 'floor'), floor);
});
