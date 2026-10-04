// 2.5D（たちたい）の フィールド
// ・じめん・かべ・やま・たてもの・き を 3D で つくる（え は タイルの ドット絵を そのまま はる）
// ・ひと・まもの・もの は ドット絵を カメラに むけて たてる（ビルボード）
// ・カメラは ななめ うえから みおろす（うごかすのは いち だけ。むきは かわらない）
// あるく・ぶつかる などの きまりは 2D と おなじ（Field が きめる）。ここでは かく だけ。
import * as THREE from '../../../vendor/three.min.js';
import { T } from '../../shared/tiles.js';
import { effectiveTile } from '../../shared/maps/index.js';
import { hash2, valueNoise } from '../../shared/rng.js';
import { Atlas, extraCanvas, propCanvas, PROP_TILES, leafCanvas, roofCanvas, tileArt, stormCanvas, curtainCanvas, puffCanvas } from './tex3d.js';
import { tileCanvas } from './tiles.js';
import { duneShape, ch4Mask, onDesert } from './tiles-ch4.js';
import { flipCanvas, makeCanvas, ctxOf, whiteCopy } from './pixel.js';
import { themedCanvas, partOfTile, partOfExtra } from './themes.js';

const PITCH = 55 * Math.PI / 180;
const SIN = Math.sin(PITCH), COS = Math.cos(PITCH);
const UP = new THREE.Vector3(0, COS, -SIN); // カメラの うえ（たてた え の うえむき）
const BACK = new THREE.Vector3(0, SIN, COS); // みている ところ → カメラ
const FOV = 35;
const WATER_Y = -0.32;
const WALL_H = 1.25;
const PULL = 0.8; // たてた え を カメラの ほうへ ちかづける（かべに めりこまない ように）

const FLOOR = 1, WATER = 2, BLOCK = 3;

// 天気で かわる きり（第4章の 砂ぼこり・砂嵐。カメラからの きょりに たす 近い・遠い）
const WEATHER_FOG = {
  sand: { near: 5, far: 30, color: new THREE.Color(0xe2c48e) },
  sandstorm: { near: 0.5, far: 12, color: new THREE.Color(0xb8875a) },
};

const WATER_TILES = new Set([T.WATER, T.DEEP, T.CAVE_WATER, T.BROKEN_BRIDGE]);
const WALL_TILES = new Set([T.WALL_STONE, T.WALL_WOOD, T.ADOBE]);
const TREE_TILES = new Set([T.TREE, T.PINE, T.SNOW_PINE, T.PALM]);
// 第3章: ようがん・温泉（水と おなじ ひくさに、うごく え を はる）
const LIQUID_TILES = { [T.LAVA]: { name: 'lava', y: WATER_Y + 0.06, speed: 380 }, [T.HOT_SPRING]: { name: 'spring', y: -0.2, speed: 520 } };
// 地面の たかさ（深い 雪は すこし 高く・谷は ふかく）
const FLOOR_H = { [T.STEPPING]: -0.16, [T.DEEP_SNOW]: 0.14, [T.CHASM]: -0.8 };
// 雪・氷・砂ばくの 地面の よこの え
const SIDE_OF = {
  [T.SAND]: 'sand_side', [T.SNOW]: 'snow_side', [T.SNOW_PATH]: 'snow_side', [T.DEEP_SNOW]: 'snow_side', [T.ICE]: 'ice_side',
  [T.DESERT]: 'sand_side', [T.DUNE]: 'sand_side',
};
// 第4章: 砂嵐の まくの 高さ・砂丘の 高さ（大きな 砂丘ほど まんなかが 高い。山 1.1〜 より ひくい）
const STORM_H = 2.1;
const WELL_RIM_H = 0.6;
const DUNE_H = 0.46, DUNE_DOME = 0.15;

// かべ・かぐ などの たかさと え
function blockSpec(id, x, y) {
  const v = Math.floor(hash2(x, y, 17) * 4);
  switch (id) {
    case T.MOUNTAIN: {
      const h = 1.1 + hash2(x, y, 5) * 0.75;
      return { h, top: h > 1.62 ? ['x', 'snow_top', v] : ['x', 'rock_top', v], side: ['x', 'rock_side', v] };
    }
    case T.CLIFF: return { h: 1.0, top: ['x', 'grass_top', v], side: ['x', 'cliff_side', v] };
    case T.WALL_STONE: return { h: WALL_H, top: ['x', 'wall_top_stone', 0], side: ['x', 'stone_side', 0], south: ['t', T.WALL_STONE, v, 1] };
    case T.WALL_WOOD: return { h: WALL_H, top: ['x', 'wall_top_wood', 0], side: ['x', 'wood_side', 0], south: ['t', T.WALL_WOOD, v, 1] };
    case T.CAVE_WALL: return { h: 1.6, top: ['x', 'cave_top', v], side: ['x', 'cave_side', v], south: ['t', T.CAVE_WALL, v, 1] };
    case T.TORCH: return { h: 1.6, top: ['x', 'cave_top', v], side: ['x', 'cave_side', v], south: ['t', T.TORCH, v, 0] };
    case T.RUBBLE_WALL: return { h: 0.7, top: ['x', 'rock_top', v], side: ['x', 'rock_side', v] };
    case T.HEDGE: return { h: 0.75, top: ['x', 'hedge_top', v], side: ['x', 'hedge_side', v] };
    case T.LOCKED_DOOR: return { h: 1.6, top: ['x', 'cave_top', v], side: ['x', 'cave_side', v], south: ['t', T.LOCKED_DOOR, 0, 0] };
    case T.COUNTER: return { h: 0.6, top: ['x', 'counter_top', 0], side: ['x', 'wood_side', 0] };
    case T.TABLE: return { h: 0.5, top: ['x', 'table_top', 0], side: ['x', 'wood_side', 0] };
    case T.BED: return { h: 0.35, top: ['t', T.BED, 0, 0], side: ['x', 'wood_side', 0] };
    case T.SHELF: return { h: 1.1, top: ['x', 'wood_top', 0], side: ['x', 'wood_side', 0], south: ['t', T.SHELF, 0, 0] };
    case T.BOOKSHELF: return { h: 1.1, top: ['x', 'wood_top', 0], side: ['x', 'wood_side', 0], south: ['t', T.BOOKSHELF, 0, 0] };
    case T.FIREPLACE: return { h: 1.0, top: ['x', 'stone_top', 0], side: ['x', 'stone_side', 0], south: ['t', T.FIREPLACE, 0, 0] };
    case T.ALTAR: return { h: 0.6, top: ['t', T.ALTAR, 0, 0], side: ['x', 'stone_side', 0] };
    case T.STAR_ALTAR: return { h: 0.45, top: ['x', 'stone_top', 0], side: ['x', 'stone_side', 0] };
    case T.WELL: return { h: 0.45, top: ['t', T.WELL, v, 0], side: ['x', 'stone_side', 0] };
    case T.FOUNTAIN: return { h: 0.35, top: ['t', T.FOUNTAIN, 0, 0], side: ['x', 'stone_side', 0] };
    case T.PILLAR: return { h: 1.7, top: ['x', 'stone_top', 0], side: ['x', 'pillar_side', 0] };
    case T.CRATE: return { h: 0.65, top: ['x', 'wood_top', 0], side: ['x', 'wood_side', 0] };
    // 第3章
    case T.SNOW_ROCK: {
      const h = 1.1 + hash2(x, y, 5) * 0.8;
      return { h, top: ['x', 'snow_top', v], side: ['x', 'snowrock_side', v] };
    }
    case T.ASH_ROCK: {
      const h = 1.0 + hash2(x, y, 5) * 0.7;
      return { h, top: ['x', 'ash_top', v], side: ['x', 'ashrock_side', v] };
    }
    case T.ICE_BLOCK: return { h: 0.85, top: ['x', 'ice_top', v], side: ['x', 'ice_side', v] };
    case T.SNOW_WALL: return { h: 1.0, top: ['x', 'snow_top', v], side: ['x', 'snow_side', v] };
    case T.ICE_WALL: return { h: 1.6, top: ['x', 'ice_top', v], side: ['x', 'ice_side', v], south: ['t', T.ICE_WALL, v, 1] };
    case T.DRAGON_GATE: return { h: 2.0, top: ['x', 'stone_top', 0], side: ['x', 'gate_side', 0], south: ['t', T.DRAGON_GATE, v === 0 ? 0 : 1, 0] };
    case T.MINE_BEAM: return { h: 1.6, top: ['x', 'wood_top', 0], side: ['x', 'beam_side', 0] };
    case T.FLAME_WALL: return { h: 1.3, top: ['x', 'flame_side', v], side: ['x', 'flame_side', v] };
    // 第4章
    case T.SANDSTONE: {
      // となりと 高さが そろう 段々の 岩山（メサ）
      const h = 1.1 + Math.round(valueNoise(x * 0.3, y * 0.3, 21) * 4) / 4 * 0.7;
      return { h, top: ['x', 'sandstone_top', v], side: ['x', 'sandstone_side', v] };
    }
    case T.ADOBE: return { h: WALL_H, top: ['x', 'wall_top_adobe', 0], side: ['x', 'adobe_side', 0], south: ['t', T.ADOBE, v, 1] };
    default: return null;
  }
}

// テストで しらべる ため（かべ・き・地面の よこの え・ブロックの たかさ）
export { blockSpec, WALL_TILES, TREE_TILES, SIDE_OF };

// タイルの しゅるい: FLOOR / WATER / BLOCK（もの・き は FLOOR の うえに たてる）
function kindOf(id) {
  if (id === T.VOID) return 0;
  if (WATER_TILES.has(id) || LIQUID_TILES[id]) return WATER;
  if (blockSpec(id, 0, 0)) return BLOCK;
  return FLOOR;
}

const texCache = new WeakMap();
const flipCache = new WeakMap();
const ghostCache = new WeakMap();
const GREATER_DEPTH = 6; // THREE.GreaterDepth: うしろに かくれた ところ だけ かく

export class Field3D {
  static supported() {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
    } catch {
      return false;
    }
  }

  constructor(field, canvas) {
    this.field = field;
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(FOV, 1, 1, 300);
    this.target = new THREE.Vector3();
    this.tmp = new THREE.Vector3();
    this.sprites = new Map();
    this.static = null;
    this.mapId = null;
    this.gateSig = '';
    this.time = 0;
    this.lost = false;
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.lost = true; });
    canvas.addEventListener('webglcontextrestored', () => { this.lost = false; this.mapId = null; });
    this.shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.26, depthWrite: false });
    const sg = new THREE.CircleGeometry(0.3, 10);
    sg.rotateX(-Math.PI / 2);
    this.shadows = new THREE.InstancedMesh(sg, this.shadowMat, 96);
    this.shadows.count = 0;
    this.shadows.frustumCulled = false;
    this.scene.add(this.shadows);
    this.onResize = () => this.resize();
    addEventListener('resize', this.onResize);
    this.resize();
  }

  dispose() {
    removeEventListener('resize', this.onResize);
    this.disposeStatic();
    for (const s of this.sprites.values()) s.material.dispose();
    this.sprites.clear();
    this.renderer.dispose();
  }

  // がめんの おおきさ: みじかい ほうの へんに 12〜14マス みえるように カメラの きょりを きめる
  resize() {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    const halfV = Math.max((12 / 2) / this.camera.aspect, (14 * SIN) / 2);
    this.dist = halfV / Math.tan((FOV / 2) * Math.PI / 180);
    this.camera.updateProjectionMatrix();
    this.W = w;
    this.H = h;
    this.updateFog();
  }

  updateFog() {
    if (!this.scene.fog || !this.dist) return;
    const dark = this.dark;
    this.scene.fog.near = this.dist + (dark ? 2 : 8);
    this.scene.fog.far = this.dist + (dark ? 14 : 34);
  }

  tex(canvas) {
    let t = texCache.get(canvas);
    if (!t) {
      t = new THREE.CanvasTexture(canvas);
      t.magFilter = THREE.NearestFilter;
      // こまかい え（res 4 の 人・モンスター）は ちいさく うつる とき ドットが ぬけて ちらつかないように ミップマップ
      const fine = (canvas.res || 1) >= 3;
      t.minFilter = fine ? THREE.LinearMipmapLinearFilter : THREE.NearestFilter;
      t.generateMipmaps = fine;
      t.colorSpace = THREE.SRGBColorSpace;
      texCache.set(canvas, t);
    }
    return t;
  }

  // ───────────── マップを つくる ─────────────
  disposeStatic() {
    if (!this.static) return;
    this.scene.remove(this.static.group);
    this.static.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
    });
    for (const m of this.static.materials) {
      m.map?.dispose?.();
      m.dispose();
    }
    for (const t of this.static.waterFrames || []) t.dispose();
    for (const t of this.static.liquidFrames || []) t.dispose();
    this.static = null;
    this.storm = null;
  }

  build(map) {
    const t0 = performance.now();
    this.disposeStatic();
    const f = this.field;
    const gate = (fl) => f.gateFlag(fl);
    const { w, h } = map;
    const dungeon = map.kind === 'dungeon';
    this.dark = !!map.dark;
    const idAt = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? -1 : (map.gates.length ? effectiveTile(map, x, y, gate) : map.tiles[y * w + x]));
    const specs = new Map();
    const spec = (x, y) => {
      const k = y * w + x;
      if (!specs.has(k)) specs.set(k, wellRim(blockSpec(idAt(x, y), x, y), x, y));
      return specs.get(k);
    };
    // 第4章: 古井戸の あなを かこむ 日干しれんがは ひくい ふち（あなが 見える ように。やねの ある 家の かべは そのまま）。
    // 砂ばくの 村の 井戸は 砂の 上
    const wellRim = (s, x, y) => {
      if (!s) return s;
      const id = idAt(x, y);
      if (id === T.WELL && onDesert(idAt, x, y)) return { ...s, top: ['t', T.WELL, s.top[2], 2] };
      if (id !== T.ADOBE || (map.roofs || []).some((r) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h)) return s;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (idAt(x + dx, y + dy) === T.WELL_HOLE) return { ...s, h: WELL_RIM_H };
      return s;
    };
    // タイルの いちばん うえの たかさ
    const topH = (x, y) => {
      const id = idAt(x, y);
      if (id === -1 || id === T.VOID) return null;
      const k = kindOf(id);
      if (k === WATER || id === T.WHIRLPOOL) return LIQUID_TILES[id]?.y ?? WATER_Y;
      if (k === BLOCK) return spec(x, y).h;
      return FLOOR_H[id] ?? 0;
    };
    this.topH = topH;

    const atlas = new Atlas(512);
    const uvOf = (key) => {
      const [kind, a, b, c] = key;
      const name = kind === 't' ? `t:${a}:${b}:${c}` : `x:${a}:${b}`;
      const art = () => (kind === 't' ? tileArt(a, b, c) : extraCanvas(a, b));
      // 宝の洞窟は しゅるいで 色を かえる
      if (map.theme) return atlas.uv(name, () => themedCanvas(art(), map.theme, kind === 't' ? partOfTile(a) : partOfExtra(a)));
      return atlas.uv(name, art);
    };

    // たてもの（やねの した）: かべは べつの メッシュ（なかに はいったら ひくく する）
    const roofs = (map.roofs || []).map((r) => ({ r, geo: newGeo() }));
    const roofOf = (x, y) => roofs.find(({ r }) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h);

    // ゆかの え（もの・き の したは まわりの ゆかに あわせる）
    const floorKey = (x, y, id) => {
      switch (id) {
        case T.BRIDGE_H: return ['x', 'plank_h', 0];
        case T.BRIDGE_V: case T.PIER: return ['x', 'plank_v', 0];
        case T.CAVE_BRIDGE: return ['x', 'cave_plank', 0];
        case T.CAVE_ENTRANCE: return ['x', 'dark_hole', 0];
        case T.DOOR: {
          const inner = idAt(x, y - 1);
          return ['t', inner === T.FLOOR_STONE || inner === T.CARPET ? T.FLOOR_STONE : T.FLOOR_WOOD, 0, 0];
        }
        default:
          break;
      }
      if (PROP_TILES.has(id) || TREE_TILES.has(id)) {
        const cnt = new Map();
        for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
          // 砂丘・砂嵐の となりは 砂ばくの 地面（第4章）
          const n0 = idAt(x + dx, y + dy), n = n0 === T.DUNE || n0 === T.SANDSTORM ? T.DESERT : n0;
          if (n === -1 || kindOf(n) !== FLOOR || PROP_TILES.has(n) || TREE_TILES.has(n) || n === T.DOOR) continue;
          cnt.set(n, (cnt.get(n) || 0) + 1);
        }
        let best = dungeon ? T.CAVE_FLOOR : map.ground || T.GRASS, bn = 0;
        for (const [n, c] of cnt) if (c > bn) { bn = c; best = n; }
        return ['t', best, Math.floor(hash2(x, y, 17) * 4), 0];
      }
      return ['t', id, Math.floor(hash2(x, y, 17) * 4), 0];
    };

    // チャンク（16×16）ごとに まとめる
    const CH = 16;
    const cw = Math.ceil(w / CH), chh = Math.ceil(h / CH);
    const chunks = [];
    for (let i = 0; i < cw * chh; i++) chunks.push(newGeo());
    const props = newGeo();
    const water = newGeo();
    const liquids = {};
    const trees = [], pines = [], snowPines = [], palms = [];
    const dunes = [], storm = [];
    const isBlockAt = (x, y) => {
      const id = idAt(x, y);
      return id !== -1 && kindOf(id) === BLOCK && spec(x, y).h > 0.55;
    };

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const id = idAt(x, y);
        if (id === T.VOID) continue;
        const kind = kindOf(id);
        const g = chunks[Math.floor(y / CH) * cw + Math.floor(x / CH)];
        const hh = topH(x, y);
        if (id === T.WHIRLPOOL) {
          // 嵐の うず（水の たかさに うずの え を はる）
          const wy = WATER_Y + 0.01;
          quad(g, [x, wy, y], [x, wy, y + 1], [x + 1, wy, y + 1], [x + 1, wy, y], uvOf(['t', T.WHIRLPOOL, Math.floor(hash2(x, y, 17) * 4), 0]), 1);
          continue;
        }
        if (kind === WATER && LIQUID_TILES[id]) {
          // ようがん・温泉
          const L = LIQUID_TILES[id];
          const lg = liquids[id] || (liquids[id] = newGeo());
          quad(lg, [x, L.y, y], [x, L.y, y + 1], [x + 1, L.y, y + 1], [x + 1, L.y, y], { u0: x, u1: x + 1, v0: -y - 1, v1: -y }, 1);
          continue;
        }
        if (kind === WATER) {
          const deep = id === T.DEEP ? 0.72 : id === T.CAVE_WATER ? 0.9 : 1;
          quad(water, [x, WATER_Y, y], [x, WATER_Y, y + 1], [x + 1, WATER_Y, y + 1], [x + 1, WATER_Y, y], { u0: x, u1: x + 1, v0: -y - 1, v1: -y }, deep);
          continue;
        }
        if (kind === FLOOR) {
          // 砂丘は あとで まとめて（なめらかな 山）。砂嵐の かべも（うごく え）
          if (id === T.DUNE) { dunes.push([x, y]); continue; }
          if (id === T.SANDSTORM) { storm.push([x, y]); continue; }
          // かどの かげ（かべの ちかくは すこし くらい）
          const ao = (cx, cy) => (isBlockAt(cx - 1, cy - 1) || isBlockAt(cx, cy - 1) || isBlockAt(cx - 1, cy) || isBlockAt(cx, cy) ? 0.8 : 1);
          quad(g, [x, hh, y], [x, hh, y + 1], [x + 1, hh, y + 1], [x + 1, hh, y], uvOf(floorKey(x, y, id)), [ao(x, y), ao(x, y + 1), ao(x + 1, y + 1), ao(x + 1, y)]);
          sides(g, x, y, hh, (dx, dy) => topH(x + dx, y + dy), () => uvOf(['x', SIDE_OF[idAt(x, y)] || (dungeon ? 'cave_side' : 'shore_side'), 0]));
          if (PROP_TILES.has(id)) {
            const c = propCanvas(id);
            if (c) this.addProp(props, map.theme ? themedCanvas(c, map.theme, 'floor') : c, x + 0.5, y + 0.78, id);
          } else if (id === T.TREE) trees.push([x, y]);
          else if (id === T.PINE) pines.push([x, y]);
          else if (id === T.SNOW_PINE) snowPines.push([x, y]);
          else if (id === T.PALM) palms.push([x, y]);
          // もんの うえの かべ（たてものの いりぐち）
          if (id === T.DOOR) {
            const rr = roofOf(x, y);
            const tgt = rr ? rr.geo : g;
            const stone = idAt(x - 1, y) === T.WALL_STONE || idAt(x + 1, y) === T.WALL_STONE;
            const lu = uvOf(['x', stone ? 'lintel_stone' : 'lintel', 0]);
            box(tgt, x, y, 0.95, WALL_H, lu, lu, lu, () => 0.95);
          }
          continue;
        }
        // BLOCK
        const s = spec(x, y);
        const rr = WALL_TILES.has(id) ? roofOf(x, y) : null;
        const tgt = rr ? rr.geo : g;
        const top = uvOf(s.top), side = uvOf(s.side), south = s.south ? uvOf(s.south) : side;
        box(tgt, x, y, 0, s.h, top, side, south, (dx, dy) => topH(x + dx, y + dy));
      }
    }

    // 砂丘（第4章）: 2D と おなじ かたち（duneShape）を 高さに した なめらかな 山
    const duneGeos = dunes.length ? addDunes(dunes, idAt, w, h, (x, y) => chunks[Math.floor(y / CH) * cw + Math.floor(x / CH)], uvOf, topH) : [];

    // ───── メッシュに する ─────
    const group = new THREE.Group();
    const materials = [];
    const atlasTex = this.tex(atlas.canvas);
    const worldMat = new THREE.MeshBasicMaterial({ map: atlasTex, vertexColors: true });
    materials.push(worldMat);
    for (const g of chunks) if (g.pos.length) group.add(new THREE.Mesh(toGeometry(g), worldMat));
    for (const g of duneGeos) group.add(new THREE.Mesh(toGeometry(g), worldMat));
    // たてもの
    this.buildings = [];
    for (const { r, geo } of roofs) {
      const walls = new THREE.Mesh(toGeometry(geo), worldMat);
      group.add(walls);
      const roofMesh = this.makeRoof(r, materials);
      group.add(roofMesh);
      this.buildings.push({ r, walls, roof: roofMesh });
    }
    // もの（たてた え）
    if (props.pos.length) {
      const pm = new THREE.MeshBasicMaterial({ map: this.tex(this.propAtlas.canvas), alphaTest: 0.5, side: THREE.DoubleSide });
      materials.push(pm);
      group.add(new THREE.Mesh(toGeometry(props), pm));
    }
    this.propAtlas = null;
    // き
    if (trees.length || pines.length) {
      const tt = makeCanvas(48, 16);
      const tc = ctxOf(tt);
      tc.drawImage(leafCanvas('tree'), 0, 0);
      tc.drawImage(leafCanvas('pine'), 16, 0);
      tc.drawImage(leafCanvas('trunk'), 32, 0);
      const tm = new THREE.MeshBasicMaterial({ map: this.tex(tt), vertexColors: true });
      materials.push(tm);
      if (trees.length) group.add(instanced(treeGeometry(), tm, trees, 0.55));
      if (pines.length) group.add(instanced(pineGeometry(), tm, pines, 0.6));
    }
    // 雪の つもった もみの木（第3章）
    if (snowPines.length) {
      const st = makeCanvas(48, 16);
      const sc = ctxOf(st);
      sc.drawImage(leafCanvas('snowpine'), 0, 0);
      sc.drawImage(leafCanvas('snowpine'), 16, 0);
      sc.drawImage(leafCanvas('trunk'), 32, 0);
      const sm = new THREE.MeshBasicMaterial({ map: this.tex(st), vertexColors: true });
      materials.push(sm);
      group.add(instanced(pineGeometry(), sm, snowPines, 0.6));
    }
    // ヤシの木（第4章。葉は すきまの ある え）
    if (palms.length) {
      const pt = makeCanvas(48, 16);
      const pc = ctxOf(pt);
      pc.drawImage(leafCanvas('palm'), 0, 0);
      pc.drawImage(leafCanvas('coconut'), 16, 0);
      pc.drawImage(leafCanvas('palmtrunk'), 32, 0);
      const pm = new THREE.MeshBasicMaterial({ map: this.tex(pt), vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
      materials.push(pm);
      group.add(instanced(palmGeometry(), pm, palms, 0.5));
    }
    // ようがん・温泉（うごく え）
    this.liquids = [];
    const liquidFrames = [];
    for (const [id, lg] of Object.entries(liquids)) {
      const L = LIQUID_TILES[id];
      const fr = [];
      for (let i = 0; i < 3; i++) {
        const t = new THREE.CanvasTexture(tileCanvas(Number(id), 0, i, 0));
        t.magFilter = THREE.NearestFilter;
        t.minFilter = THREE.NearestFilter;
        t.generateMipmaps = false;
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.colorSpace = THREE.SRGBColorSpace;
        fr.push(t);
        liquidFrames.push(t);
      }
      const lm = new THREE.MeshBasicMaterial({ map: fr[0], vertexColors: true });
      materials.push(lm);
      group.add(new THREE.Mesh(toGeometry(lg), lm));
      this.liquids.push({ mat: lm, frames: fr, speed: L.speed });
    }
    // 砂嵐の かべ（第4章）: こい 砂の 地面（うごく え）・もこもこ うごく 砂けむりの かたまり（カメラに むけて たてる）・
    // その 上を 東へ ながれる うすい 砂の まく。とおれない ことが ひとめで わかる
    this.storm = null;
    if (storm.length) {
      const S = 0.25; // 64ドット = 4マス
      const tex = (c, wrap) => {
        const t = new THREE.CanvasTexture(c);
        t.magFilter = THREE.NearestFilter;
        t.minFilter = THREE.NearestFilter;
        t.generateMipmaps = false;
        if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.colorSpace = THREE.SRGBColorSpace;
        liquidFrames.push(t);
        return t;
      };
      // 地面
      const fg = newGeo();
      for (const [x, y] of storm) quad(fg, [x, 0, y], [x, 0, y + 1], [x + 1, 0, y + 1], [x + 1, 0, y], { u0: x * S, u1: (x + 1) * S, v0: -(y + 1) * S, v1: -y * S }, 0.9);
      // 16コマ（はじめは 1コマだけ。のこりは うごかす ときに 1まいずつ つくる → 入った ときに 止まらない）
      const sf = new Array(16).fill(null);
      sf[0] = tex(stormCanvas(0), true);
      const sm = new THREE.MeshBasicMaterial({ map: sf[0], vertexColors: true });
      materials.push(sm);
      group.add(new THREE.Mesh(toGeometry(fg), sm));
      // 砂けむりの かたまり（1マスに 2つ。北の れつから じゅんに）
      const pg = newGeo();
      const cells = storm.slice().sort((a, b) => a[1] - b[1] || a[0] - b[0]);
      for (const [x, y] of cells) {
        for (let k = 0; k < 2; k++) {
          const r1 = hash2(x, y, 41 + k), r2 = hash2(x, y, 53 + k), r3 = hash2(x, y, 67 + k);
          const size = 1.45 + r1 * 0.7;
          const b = new THREE.Vector3(x + 0.5 + (r2 - 0.5) * 0.9, k ? 0.2 + r3 * 0.5 : r3 * 0.15, y + 0.3 + k * 0.42);
          const P = (dx, up) => b.clone().add(new THREE.Vector3(dx, 0, 0)).addScaledVector(UP, up).toArray();
          const vi = Math.floor(hash2(x, y, 71 + k) * 4), flip = hash2(x, y, 83 + k) < 0.5;
          const u0 = vi / 4 + 0.003, u1 = (vi + 1) / 4 - 0.003;
          quad(pg, P(-size / 2, size), P(-size / 2, 0), P(size / 2, 0), P(size / 2, size), { u0: flip ? u1 : u0, u1: flip ? u0 : u1, v0: 0.01, v1: 0.99 }, 0.84 + r3 * 0.16);
        }
      }
      const pf = [0, 1, 2, 3].map((f) => tex(puffCanvas(f), false));
      const pm = new THREE.MeshBasicMaterial({ map: pf[0], vertexColors: true, alphaTest: 0.5 });
      materials.push(pm);
      group.add(new THREE.Mesh(toGeometry(pg), pm));
      // うすい 砂の まく（1れつ おきに。それぞれ ちがう はやさで 東へ）
      const inStorm = new Set(storm.map(([x, y]) => y * w + x));
      const curtains = [];
      const rows = [...new Set(storm.map(([, y]) => y))].sort((a, b) => a - b);
      rows.forEach((y, k) => {
        if (k % 2 && k !== rows.length - 1) return;
        const g = newGeo();
        let x0 = -1;
        const hh = STORM_H + 0.3 - (k % 3) * 0.2, uo = k * 0.37, z = y + 0.5;
        for (let x = 0; x <= w; x++) {
          const on = x < w && inStorm.has(y * w + x);
          if (on && x0 < 0) x0 = x;
          if (!on && x0 >= 0) {
            quad(g, [x0, hh, z], [x0, 0.2, z], [x, 0.2, z], [x, hh, z], { u0: x0 * S + uo, u1: x * S + uo, v0: 0, v1: 1 }, 1);
            x0 = -1;
          }
        }
        if (!g.pos.length) return;
        const t = tex(curtainCanvas(k % 3), false);
        t.wrapS = THREE.RepeatWrapping;
        const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide });
        materials.push(m);
        const mesh = new THREE.Mesh(toGeometry(g), m);
        mesh.renderOrder = 2;
        group.add(mesh);
        curtains.push({ tex: t, speed: 0.3 + (k % 3) * 0.14 });
      });
      this.storm = { mat: sm, frames: sf, puff: pm, puffs: pf, curtains, make: (i) => tex(stormCanvas(i), true) };
    }
    // みず
    const frames = [];
    if (water.pos.length) {
      const wid = dungeon ? T.CAVE_WATER : T.WATER;
      for (let i = 0; i < 3; i++) {
        const t = new THREE.CanvasTexture(tileCanvas(wid, 0, i, 0, map.theme));
        t.magFilter = THREE.NearestFilter;
        t.minFilter = THREE.NearestFilter;
        t.generateMipmaps = false;
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.colorSpace = THREE.SRGBColorSpace;
        frames.push(t);
      }
      const wm = new THREE.MeshBasicMaterial({ map: frames[0], vertexColors: true });
      materials.push(wm);
      group.add(new THREE.Mesh(toGeometry(water), wm));
      this.waterMat = wm;
    } else this.waterMat = null;
    // マップの そとの うみ（フィールドだけ。雪の 地方は 雪の 野原）
    if (!dungeon) {
      const sea = newGeo();
      const M = 90;
      const snowy = map.outside === 'snow';
      const oy = snowy ? -0.05 : WATER_Y - 0.03;
      quad(sea, [-M, oy, -M], [-M, oy, h + M], [w + M, oy, h + M], [w + M, oy, -M], { u0: -M, u1: w + M, v0: -h - M, v1: M }, snowy ? 0.86 : 0.62);
      const seaTex = new THREE.CanvasTexture(tileCanvas(snowy ? T.SNOW : T.DEEP, 0, 0, 0));
      seaTex.magFilter = THREE.NearestFilter;
      seaTex.minFilter = THREE.NearestFilter;
      seaTex.generateMipmaps = false;
      seaTex.wrapS = seaTex.wrapT = THREE.RepeatWrapping;
      seaTex.colorSpace = THREE.SRGBColorSpace;
      const sm = new THREE.MeshBasicMaterial({ map: seaTex, vertexColors: true });
      materials.push(sm);
      group.add(new THREE.Mesh(toGeometry(sea), sm));
    }
    this.scene.add(group);
    this.static = { group, materials, waterFrames: frames, liquidFrames };
    // 空と きりの 色（マップの sky3d で かえられる。雪の 地方は 白っぽい）
    this.scene.background = new THREE.Color(map.sky3d?.bg || (dungeon ? ({ ice: '#0d1a33', sand: '#140c06' }[map.theme] || '#070505') : '#1c3d6e'));
    this.scene.fog = new THREE.Fog(map.sky3d?.fog ?? (dungeon ? 0x050304 : 0x9ec3e8), 10, 50);
    this.fogBase = { near: 8, far: 34, color: this.scene.fog.color.clone() };
    this.fogNow = null;
    this.updateFog();
    this.mapId = f.mapId;
    this.lastBuildMs = Math.round(performance.now() - t0);
  }

  // たてた え（もの）を アトラスに いれて かたむけた しかくを つくる
  addProp(g, canvas, cx, cz, key) {
    if (!this.propAtlas) this.propAtlas = new PropAtlas();
    const uv = this.propAtlas.uv(key, canvas);
    const r = canvas.res || 1;
    const wd = canvas.width / r / 16, ht = canvas.height / r / 16;
    const b = new THREE.Vector3(cx, 0, cz);
    const p = (dx, up) => b.clone().add(new THREE.Vector3(dx, 0, 0)).addScaledVector(UP, up).toArray();
    quad(g, p(-wd / 2, ht), p(-wd / 2, 0), p(wd / 2, 0), p(wd / 2, ht), uv, 1);
  }

  makeRoof(r, materials) {
    const colors = {
      red: ['#b8403a', '#8a2a26', '#d8605a'], blue: ['#3a64b0', '#264a8a', '#5a84d0'], green: ['#3a8a4a', '#276a36', '#5aaa6a'],
      purple: ['#6a4a9a', '#4e3478', '#8a6aba'], white: ['#d8d4e8', '#aaa6c0', '#f4f2ff'], orange: ['#d0782e', '#a45a1e', '#ec9a4e'],
      teal: ['#2a8a8a', '#1e6a6a', '#4aaaaa'], brown: ['#8a5a32', '#6a4222', '#aa7a4e'], pink: ['#d06a9a', '#aa4a7a', '#ec8aba'],
      // 第3章: 雪の つもった やね・鉱山の 町の 石の やね
      snow: ['#e4ecf8', '#a8b4c8', '#ffffff'], snowred: ['#b8403a', '#8a2a26', '#f4f8ff'], snowblue: ['#3a64b0', '#264a8a', '#f4f8ff'],
      snowgreen: ['#3a7a5a', '#26583e', '#f4f8ff'], slate: ['#5a6078', '#3a3e52', '#8a90b0'], rust: ['#9a5a3a', '#6a3a22', '#c88a5a'],
      // 第4章: 砂の国（日干しれんがの 白っぽい やね・赤い かわらの やね・布の やね）
      sand: ['#d8b47a', '#a8844a', '#f0d6a2'], clay: ['#c8703a', '#9a4e22', '#e8986a'], canvas: ['#e8dcc4', '#bba98a', '#fff4e0'],
    };
    const t = new THREE.CanvasTexture(roofCanvas(colors[r.color] || colors.red));
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.MeshBasicMaterial({ map: t, vertexColors: true, side: THREE.DoubleSide });
    materials.push(m);
    const g = newGeo();
    const o = 0.18;
    const x0 = r.x - o, x1 = r.x + r.w + o, z0 = r.y - o, z1 = r.y + r.h + o;
    const zc = (z0 + z1) / 2;
    const hb = WALL_H, hr = WALL_H + Math.min(1.3, (z1 - z0) * 0.34);
    const len = x1 - x0, run = Math.hypot(zc - z0, hr - hb);
    // みなみがわ（カメラがわ）
    quad(g, [x0, hr, zc], [x0, hb, z1], [x1, hb, z1], [x1, hr, zc], { u0: 0, u1: len, v0: 0, v1: run }, 1);
    // きたがわ
    quad(g, [x1, hr, zc], [x1, hb, z0], [x0, hb, z0], [x0, hr, zc], { u0: 0, u1: len, v0: 0, v1: run }, 0.8);
    // よこの さんかく
    tri(g, [x0, hb, z1], [x0, hr, zc], [x0, hb, z0], 0.62);
    tri(g, [x1, hb, z0], [x1, hr, zc], [x1, hb, z1], 0.7);
    return new THREE.Mesh(toGeometry(g), m);
  }

  // ───────────── まいフレーム ─────────────
  render(dt) {
    const f = this.field;
    const m = f.map;
    if (!m || this.lost) return;
    this.time += dt;
    const sig = m.gates.map((g) => (f.gateFlag(g.flag) ? 1 : 0)).join('');
    if (this.mapId !== f.mapId || sig !== this.gateSig) {
      this.gateSig = sig;
      this.build(m);
      this.snap = true;
    }
    // カメラ
    const me = f.lookAt || f.me; // だいほんの ['look', x, y] の 間は その 場所を 見る
    const tx = Math.max(3, Math.min(m.w - 3, me.x));
    const tz = Math.max(2, Math.min(m.h - 1, me.y - 0.3));
    if (this.snap || Math.hypot(this.target.x - tx, this.target.z - tz) > 12) {
      this.target.set(tx, 0.6, tz);
      this.snap = false;
    } else {
      const k = Math.min(1, dt / 100);
      this.target.x += (tx - this.target.x) * k;
      this.target.z += (tz - this.target.z) * k;
      this.target.y = 0.6;
    }
    const cam = this.camera;
    // 大鳥で とんでいる ときは カメラを すこし 高く（とおくまで 見える）
    const zoom = f.game.sky?.flying ? 1.35 : 1;
    this.zoom = (this.zoom || 1) + (zoom - (this.zoom || 1)) * Math.min(1, dt / 400);
    cam.position.copy(this.target).addScaledVector(BACK, this.dist * this.zoom);
    if (this.scene.fog && !this.dark) {
      // 砂ぼこり・砂嵐の 中は 黄土色に かすむ（遠くは 見えにくい。自分の まわりは 見える。ほかの 天気は そのまま）
      const base = this.fogBase;
      const want = WEATHER_FOG[f.weatherKind?.()] || base;
      const fn = this.fogNow || (this.fogNow = { near: want.near, far: want.far, color: want.color.clone() });
      const k = Math.min(1, dt / 700);
      fn.near += (want.near - fn.near) * k;
      fn.far += (want.far - fn.far) * k;
      fn.color.lerp(want.color, k);
      this.scene.fog.near = this.dist * this.zoom + fn.near;
      this.scene.fog.far = this.dist * this.zoom + fn.far;
      this.scene.fog.color.copy(fn.color);
    }
    if (f.shakeT > 0) {
      cam.position.x += (Math.random() - 0.5) * 0.35;
      cam.position.y += (Math.random() - 0.5) * 0.35;
    }
    cam.lookAt(this.target.x, this.target.y, this.target.z);
    cam.updateMatrixWorld();
    // たてものの なかに いる？（やねを はずして かべを ひくく）
    this.inside = null;
    const air = !!f.game.sky?.flying;
    for (const b of this.buildings || []) {
      const r = b.r;
      const inside = !air && me.x >= r.x + 1 && me.x < r.x + r.w - 1 && me.y >= r.y + 1 && me.y < r.y + r.h;
      b.roof.visible = !inside;
      b.walls.scale.y = inside ? 0.28 : 1;
      if (inside) this.inside = r;
    }
    // みずの うごき
    if (this.waterMat) {
      const fr = this.static.waterFrames[Math.floor(this.time / 420) % 3];
      if (this.waterMat.map !== fr) this.waterMat.map = fr;
    }
    for (const l of this.liquids || []) {
      const fr = l.frames[Math.floor(this.time / l.speed) % l.frames.length];
      if (l.mat.map !== fr) l.mat.map = fr;
    }
    // 砂嵐の かべ: 16コマで 64ドット（4マス）東へ。コマの あいだも すこしずつ ずらして なめらかに
    if (this.storm) {
      const st = this.storm, sp = 75;
      const fi = Math.floor(this.time / sp) % st.frames.length;
      const fr = st.frames[fi] || (st.frames[fi] = st.make(fi));
      if (st.mat.map !== fr) st.mat.map = fr;
      fr.offset.x = -((this.time % sp) / sp) * (4 / 64);
      const pf = st.puffs[Math.floor(this.time / 230) % st.puffs.length];
      if (st.puff.map !== pf) st.puff.map = pf;
      for (const c of st.curtains) c.tex.offset.x = -((this.time / 1000) * c.speed) % 1;
    }
    this.updateSprites();
    this.renderer.render(this.scene, cam);
  }

  // たてた え（ひと・まもの・たからばこ）
  updateSprites() {
    const f = this.field;
    const used = new Set();
    let ns = 0;
    const shadowAt = (x, y, s = 1) => {
      if (ns >= 96) return;
      const mtx = new THREE.Matrix4().makeScale(s, 1, s).setPosition(x, this.floorAt(x, y) + 0.02, y);
      this.shadows.setMatrixAt(ns++, mtx);
    };
    for (const e of f.entities3d()) {
      if (!e.canvas) continue;
      if (!e.air && this.hiddenByRoof(e.x, e.y)) continue;
      used.add(e.key);
      let sp = this.sprites.get(e.key);
      if (!sp) {
        sp = new THREE.Sprite(new THREE.SpriteMaterial({ alphaTest: 0.5, fog: true }));
        this.sprites.set(e.key, sp);
        this.scene.add(sp);
      }
      let canvas = e.canvas;
      if (e.flip) {
        let fc = flipCache.get(canvas);
        if (!fc) { fc = flipCanvas(canvas); flipCache.set(canvas, fc); }
        canvas = fc;
      }
      const map = this.tex(canvas);
      const mat = sp.material;
      if (mat.map !== map) mat.map = map;
      const alpha = e.alpha ?? 1;
      if ((alpha < 1) !== mat.transparent) {
        mat.transparent = alpha < 1;
        mat.needsUpdate = true;
      }
      mat.opacity = alpha;
      const k = e.scale || 1;
      // こまかい え（res 4 など）も 見た目の 大きさは おなじ
      const lw = canvas.width / (canvas.res || 1), lh = canvas.height / (canvas.res || 1);
      sp.scale.set(lw * k / 16, lh * k / 16, 1);
      sp.center.set(0.5, (e.anchor ?? 3) / lh);
      // あしもと → カメラの ほうへ すこし ちかづける（がめんの いちは かわらない）
      const base = this.tmp.set(e.x, this.floorAt(e.x, e.y) + (e.lift || 0), e.y);
      const dir = this.camera.position.clone().sub(base).normalize();
      sp.position.copy(base).addScaledVector(dir, PULL);
      sp.visible = true;
      if (e.shadow !== false) shadowAt(e.x, e.y, e.shadowScale || 1);
      // じぶん・なかまは かべや やまの うしろでも シルエットで みえる
      if (e.ghost) {
        const gk = 'g:' + e.key;
        used.add(gk);
        let gs = this.sprites.get(gk);
        if (!gs) {
          gs = new THREE.Sprite(new THREE.SpriteMaterial({ alphaTest: 0.5, transparent: true, opacity: 0.55, depthWrite: false, depthFunc: GREATER_DEPTH, fog: false }));
          gs.renderOrder = 10;
          this.sprites.set(gk, gs);
          this.scene.add(gs);
        }
        let gc = ghostCache.get(canvas);
        if (!gc) { gc = whiteCopy(canvas, e.ghost); ghostCache.set(canvas, gc); }
        const gm = this.tex(gc);
        if (gs.material.map !== gm) gs.material.map = gm;
        gs.scale.copy(sp.scale);
        gs.center.copy(sp.center);
        gs.position.copy(sp.position);
        gs.visible = true;
      }
    }
    for (const [key, sp] of this.sprites) {
      if (!used.has(key)) sp.visible = false;
    }
    this.shadows.count = ns;
    this.shadows.instanceMatrix.needsUpdate = true;
  }

  // じぶんが いない たてものの なかの ひとは やねで かくれる
  hiddenByRoof(x, y) {
    for (const b of this.buildings || []) {
      const r = b.r;
      if (r === this.inside) continue;
      if (x >= r.x + 1 && x < r.x + r.w - 1 && y >= r.y + 1 && y < r.y + r.h - 1) return true;
    }
    return false;
  }

  floorAt(x, y) {
    const hh = this.topH?.(Math.floor(x), Math.floor(y));
    if (hh === null || hh === undefined) return 0;
    return hh === WATER_Y ? 0 : hh;
  }

  // せかいの いち → がめんの いち（CSS ピクセル）
  project(x, y, up = 0) {
    const v = this.tmp.set(x, this.floorAt(x, y), y).addScaledVector(UP, up).project(this.camera);
    return { x: (v.x + 1) / 2 * this.W, y: (1 - v.y) / 2 * this.H, z: v.z };
  }

  // その ばしょの 1マスが がめんで なんピクセルか
  tilePx(x, y) {
    const a = this.project(x, y), b = this.project(x + 1, y);
    return Math.hypot(b.x - a.x, b.y - a.y);
  }
}

// ───────────── かたち づくり ─────────────
function newGeo() {
  return { pos: [], uv: [], col: [] };
}

// 4てん（A→B→C→D が おもてから みて はんとけいまわり）
function quad(g, A, B, C, D, uv, shade) {
  const s = Array.isArray(shade) ? shade : [shade, shade, shade, shade];
  const P = [A, B, C, D];
  const U = [[uv.u0, uv.v1], [uv.u0, uv.v0], [uv.u1, uv.v0], [uv.u1, uv.v1]];
  for (const i of [0, 1, 2, 0, 2, 3]) {
    g.pos.push(P[i][0], P[i][1], P[i][2]);
    g.uv.push(U[i][0], U[i][1]);
    g.col.push(s[i], s[i], s[i]);
  }
}

function tri(g, A, B, C, shade) {
  for (const [p, u] of [[A, [0, 0]], [B, [0.5, 1]], [C, [1, 0]]]) {
    g.pos.push(p[0], p[1], p[2]);
    g.uv.push(u[0], u[1]);
    g.col.push(shade, shade, shade);
  }
}

// よこの めん（みなみ・ひがし・にし。きたがわは カメラから みえない）
function sides(g, x, y, top, hAt, uvFn) {
  const dirs = [[0, 1, 0.8], [1, 0, 0.68], [-1, 0, 0.62]];
  for (const [dx, dy, sh] of dirs) {
    const nh = hAt(dx, dy);
    if (nh === null || nh >= top - 0.01) continue;
    wall(g, x, y, dx, dy, nh, top, uvFn(), sh);
  }
}

function wall(g, x, y, dx, dy, y0, y1, uv, sh) {
  const hgt = y1 - y0;
  // ひくい めんは えの うえの ぶぶん だけ、たかい めんは えを くりかえす
  const n = hgt <= 1.75 ? 1 : Math.round(hgt);
  const step = hgt / n;
  for (let i = 0; i < n; i++) {
    const a = y0 + i * step, b = a + step;
    const u = hgt < 0.6 ? { u0: uv.u0, u1: uv.u1, v0: uv.v1 - (uv.v1 - uv.v0) * hgt, v1: uv.v1 } : uv;
    if (dy === 1) quad(g, [x, b, y + 1], [x, a, y + 1], [x + 1, a, y + 1], [x + 1, b, y + 1], u, sh);
    else if (dx === 1) quad(g, [x + 1, b, y + 1], [x + 1, a, y + 1], [x + 1, a, y], [x + 1, b, y], u, sh);
    else quad(g, [x, b, y], [x, a, y], [x, a, y + 1], [x, b, y + 1], u, sh);
  }
}

// はこ（うえ と よこ）。y0 > 0 なら ういている（もんの うえの かべ）
function box(g, x, y, y0, y1, topUv, sideUv, southUv, hAt) {
  quad(g, [x, y1, y], [x, y1, y + 1], [x + 1, y1, y + 1], [x + 1, y1, y], topUv, 1);
  const dirs = [[0, 1, 0.82], [1, 0, 0.68], [-1, 0, 0.62]];
  for (const [dx, dy, sh] of dirs) {
    let nh = hAt(dx, dy);
    if (nh === null || nh === undefined) nh = y0;
    const bottom = y0 > 0 ? Math.max(y0, nh) : nh;
    if (bottom >= y1 - 0.01) continue;
    wall(g, x, y, dx, dy, bottom, y1, dy === 1 ? southUv : sideUv, sh);
  }
}

function toGeometry(g) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(g.pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(g.uv, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(g.col, 3));
  geo.computeBoundingSphere();
  return geo;
}

// たてた もの の アトラス（16×24 の わく）
class PropAtlas {
  constructor() {
    this.canvas = makeCanvas(512, 256);
    this.ctx = ctxOf(this.canvas);
    this.slots = new Map();
    this.n = 0;
  }

  uv(key, c) {
    let r = this.slots.get(key);
    if (r) return r;
    const i = this.n++;
    const cx = (i % 32) * 16, cy = Math.floor(i / 32) * 24;
    const top = cy + 24 - c.height;
    this.ctx.drawImage(c, cx, top);
    const W = 512, H = 256, e = 0.01;
    r = { u0: (cx + e) / W, u1: (cx + c.width - e) / W, v0: 1 - (cy + 24 - e) / H, v1: 1 - (top + e) / H };
    this.slots.set(key, r);
    return r;
  }
}

// ───────────── 砂丘（第4章）─────────────
// 2D の 砂丘と おなじ かたち（duneShape）を 高さに する（となりの 砂丘と さかいで おなじ 高さ → すきまが ない）。
// 大きな 砂丘ほど まんなかが 高い（ふちからの マス数。かどの 高さを なめらかに つなぐ）。
// え は うすい 風紋（tex3d.js の dune_top）。ひかりは 左上から。かげは すこし 赤っぽい 茶色
const DUNE_LIGHT = new THREE.Vector3(-0.35, 1, -0.3).normalize();
function addDunes(list, idAt, w, h, geoAt, uvOf, topH) {
  const dune = new Uint8Array(w * h);
  for (const [x, y] of list) dune[y * w + x] = 1;
  const isDune = (x, y) => x >= 0 && y >= 0 && x < w && y < h && dune[y * w + x] === 1;
  // ふちからの マス数（ふち = 1）
  const depth = new Uint8Array(w * h);
  const q = [];
  for (const [x, y] of list) {
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const n = idAt(x + dx, y + dy); return n !== -1 && n !== T.DUNE; })) {
      depth[y * w + x] = 1;
      q.push(y * w + x);
    }
  }
  for (let i = 0; i < q.length; i++) {
    const k = q[i], x = k % w, y = (k - x) / w;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (!isDune(nx, ny) || depth[ny * w + nx]) continue;
      depth[ny * w + nx] = depth[k] + 1;
      q.push(ny * w + nx);
    }
  }
  const tileD = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 3 : !dune[y * w + x] ? 0 : Math.min(3, depth[y * w + x] || 3));
  const corners = new Int8Array((w + 1) * (h + 1)).fill(-1);
  const cornerD = (cx, cy) => {
    const k = cy * (w + 1) + cx;
    if (corners[k] < 0) corners[k] = Math.min(tileD(cx - 1, cy - 1), tileD(cx, cy - 1), tileD(cx - 1, cy), tileD(cx, cy));
    return corners[k];
  };
  const masks = new Int16Array(w * h).fill(-1);
  const maskAt = (x, y) => {
    const k = y * w + x;
    if (masks[k] < 0) masks[k] = ch4Mask(T.DUNE, idAt, x, y);
    return masks[k];
  };
  // 世界の いち → 砂丘の 高さ
  const H = (wx, wz) => {
    const tx = Math.floor(wx), tz = Math.floor(wz);
    if (!isDune(tx, tz)) return 0;
    const s = duneShape(maskAt(tx, tz), (wx - tx) * 16, (wz - tz) * 16);
    if (s <= 0) return 0;
    const fx = wx - tx, fz = wz - tz;
    const dome = (cornerD(tx, tz) * (1 - fx) + cornerD(tx + 1, tz) * fx) * (1 - fz) + (cornerD(tx, tz + 1) * (1 - fx) + cornerD(tx + 1, tz + 1) * fx) * fz;
    return s * (DUNE_H + dome * DUNE_DOME);
  };
  // ちょうてん（4分の1マスごと。となりの タイルと つかいまわす）の 高さと いろ（むきで 明るさ。高い ところは すこし あたたかい 金色）
  const L = DUNE_LIGHT, GW = w * 4 + 1, GH = h * 4 + 1;
  // 4分の1マスごとの 高さ（1かいだけ はかる）
  const hGrid = new Float32Array(GW * GH).fill(-1);
  const Hg = (gx, gz) => {
    if (gx < 0 || gz < 0 || gx >= GW || gz >= GH) return 0;
    const k = gz * GW + gx;
    if (hGrid[k] < 0) hGrid[k] = H(gx / 4, gz / 4);
    return hGrid[k];
  };
  const vIndex = new Int32Array(GW * GH).fill(-1);
  let vH = new Float32Array(4096), vC = new Float32Array(4096 * 3), vN = 0;
  const vert = (gx, gz) => {
    const key = gz * GW + gx;
    let i = vIndex[key];
    if (i >= 0) return i;
    i = vN++;
    if (i >= vH.length) {
      const nh = new Float32Array(vH.length * 2), nc = new Float32Array(vC.length * 2);
      nh.set(vH); nc.set(vC);
      vH = nh; vC = nc;
    }
    const hh = Hg(gx, gz);
    const dx = (Hg(gx + 1, gz) - Hg(gx - 1, gz)) * 2, dz = (Hg(gx, gz + 1) - Hg(gx, gz - 1)) * 2;
    const d = (-dx * L.x + L.y - dz * L.z) / Math.sqrt(dx * dx + 1 + dz * dz);
    const sh = Math.max(0.5, Math.min(1.06, 1 + (d - L.y) * 0.8));
    const t = Math.min(1, hh / 0.8);
    vH[i] = hh;
    vC[i * 3] = sh;
    vC[i * 3 + 1] = Math.pow(sh, 1.12) * (1 - 0.02 * t);
    vC[i * 3 + 2] = Math.pow(sh, 1.35) * (1 - 0.07 * t);
    vIndex[key] = i;
    return i;
  };
  // チャンクごとに まとめて、はじめから 大きさの きまった はこに 書く（たくさん あるので はやく）
  const byChunk = new Map();
  for (const [x, y] of list) {
    const g = geoAt(x, y);
    let c = byChunk.get(g);
    if (!c) { c = { tiles: [], quads: 0 }; byChunk.set(g, c); }
    const N = maskAt(x, y) === 255 ? 1 : 4;
    c.tiles.push(x, y, N);
    c.quads += N * N;
    // 水に せっする ところは 砂の よこの かべ
    sides(g, x, y, 0, (dx, dy) => topH(x + dx, y + dy), () => uvOf(['x', 'sand_side', 0]));
  }
  const out = [];
  for (const c of byChunk.values()) {
    const pos = new Float32Array(c.quads * 18), uvs = new Float32Array(c.quads * 12), col = new Float32Array(c.quads * 18);
    let o = 0;
    const put = (vi, gx, gz, u, v) => {
      pos[o * 3] = gx / 4; pos[o * 3 + 1] = vH[vi]; pos[o * 3 + 2] = gz / 4;
      uvs[o * 2] = u; uvs[o * 2 + 1] = v;
      col[o * 3] = vC[vi * 3]; col[o * 3 + 1] = vC[vi * 3 + 1]; col[o * 3 + 2] = vC[vi * 3 + 2];
      o++;
    };
    for (let k = 0; k < c.tiles.length; k += 3) {
      const x = c.tiles[k], y = c.tiles[k + 1], N = c.tiles[k + 2], st = 4 / N;
      // え は うすい 風紋（ふちの かげは 3D の かたむきで つける）
      const uv = uvOf(['x', 'dune_top', Math.floor(hash2(x, y, 17) * 4)]);
      const du = (uv.u1 - uv.u0) / N, dv = (uv.v1 - uv.v0) / N;
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const gx = x * 4 + i * st, gz = y * 4 + j * st;
          const a = vert(gx, gz), b = vert(gx, gz + st), cc = vert(gx + st, gz + st), d = vert(gx + st, gz);
          const u0 = uv.u0 + du * i, u1 = u0 + du, v1 = uv.v1 - dv * j, v0 = v1 - dv;
          // A=北西 B=南西 C=南東 D=北東（quad と おなじ むき）
          put(a, gx, gz, u0, v1); put(b, gx, gz + st, u0, v0); put(cc, gx + st, gz + st, u1, v0);
          put(a, gx, gz, u0, v1); put(cc, gx + st, gz + st, u1, v0); put(d, gx + st, gz, u1, v1);
        }
      }
    }
    out.push({ pos, uv: uvs, col });
  }
  return out;
}

// ───────────── き ─────────────
const LIGHT = new THREE.Vector3(-0.45, 0.8, 0.4).normalize();

function shadeFaces(geo, uOff, base = 0.55) {
  const pos = geo.getAttribute('position');
  const uv = geo.getAttribute('uv');
  const col = new Float32Array(pos.count * 3);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i);
    b.fromBufferAttribute(pos, i + 1);
    c.fromBufferAttribute(pos, i + 2);
    n.subVectors(c, b).cross(new THREE.Vector3().subVectors(a, b)).normalize();
    const l = base + (1 - base) * Math.max(0, n.dot(LIGHT));
    for (let k = 0; k < 3; k++) col.set([l, l, l], (i + k) * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  for (let i = 0; i < uv.count; i++) uv.setX(i, uOff + uv.getX(i) / 3);
  return geo;
}

function merge(parts) {
  const g = newGeo();
  for (const p of parts) {
    g.pos.push(...p.getAttribute('position').array);
    g.uv.push(...p.getAttribute('uv').array);
    g.col.push(...p.getAttribute('color').array);
    p.dispose();
  }
  return toGeometry(g);
}

function treeGeometry() {
  const canopy = new THREE.IcosahedronGeometry(0.62, 0);
  canopy.scale(1, 0.92, 1);
  canopy.translate(0, 1.08, 0);
  const trunk = new THREE.CylinderGeometry(0.1, 0.14, 0.62, 5).toNonIndexed();
  trunk.translate(0, 0.31, 0);
  return merge([shadeFaces(canopy.index ? canopy.toNonIndexed() : canopy, 0), shadeFaces(trunk, 2 / 3, 0.5)]);
}

function pineGeometry() {
  const c1 = new THREE.ConeGeometry(0.56, 0.9, 6).toNonIndexed();
  c1.translate(0, 0.85, 0);
  const c2 = new THREE.ConeGeometry(0.4, 0.72, 6).toNonIndexed();
  c2.translate(0, 1.38, 0);
  const trunk = new THREE.CylinderGeometry(0.08, 0.12, 0.45, 5).toNonIndexed();
  trunk.translate(0, 0.22, 0);
  return merge([shadeFaces(c1, 1 / 3), shadeFaces(c2, 1 / 3), shadeFaces(trunk, 2 / 3, 0.5)]);
}

// ヤシの木（第4章）: すこし まがった みき・ヤシの み・たれさがる 7まいの 葉（葉の え は すきまが とうめい）
function palmGeometry() {
  const parts = [];
  const pts = [[0, 0], [0.03, 0.42], [0.1, 0.84], [0.2, 1.22]];
  for (let i = 0; i < 3; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const seg = new THREE.CylinderGeometry(0.075 - i * 0.012, 0.095 - i * 0.012, Math.hypot(x1 - x0, y1 - y0), 6, 1, true).toNonIndexed();
    seg.rotateZ(-Math.atan2(x1 - x0, y1 - y0));
    seg.translate((x0 + x1) / 2, (y0 + y1) / 2, 0);
    parts.push(shadeFaces(seg, 2 / 3, 0.5));
  }
  for (const [dx, dz] of [[0.06, 0.05], [-0.05, 0.05], [0.01, -0.07]]) {
    const c = new THREE.IcosahedronGeometry(0.055, 0);
    c.translate(0.2 + dx, 1.15, dz);
    parts.push(shadeFaces(c, 1 / 3, 0.45));
  }
  const crown = new THREE.Vector3(0.2, 1.24, 0);
  const up = new THREE.Vector3(0, 1, 0);
  const pos = [], uv = [];
  const tri = (A, ua, B, ub, C, uc) => {
    // 上むきの めんに そろえる（下から 見ても おなじ 明るさ）
    const n = new THREE.Vector3().subVectors(C, B).cross(new THREE.Vector3().subVectors(A, B));
    if (n.y < 0) { [B, C] = [C, B]; [ub, uc] = [uc, ub]; }
    for (const [P, U] of [[A, ua], [B, ub], [C, uc]]) { pos.push(P.x, P.y, P.z); uv.push(U[0], U[1]); }
  };
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2 + 0.35;
    const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    const side = new THREE.Vector3(-dir.z, 0, dir.x);
    const len = 0.74 + (k % 3) * 0.07;
    const M = crown.clone().addScaledVector(dir, len * 0.46).addScaledVector(up, 0.13);
    const Tp = crown.clone().addScaledVector(dir, len).addScaledVector(up, -0.36);
    const S1 = M.clone().addScaledVector(side, 0.18).addScaledVector(up, -0.07);
    const S2 = M.clone().addScaledVector(side, -0.18).addScaledVector(up, -0.07);
    tri(crown, [0.5, 0], S1, [0, 0.5], M, [0.5, 0.5]);
    tri(crown, [0.5, 0], M, [0.5, 0.5], S2, [1, 0.5]);
    tri(M, [0.5, 0.5], S1, [0, 0.5], Tp, [0.5, 1]);
    tri(M, [0.5, 0.5], Tp, [0.5, 1], S2, [1, 0.5]);
  }
  const fg = new THREE.BufferGeometry();
  fg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  fg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  parts.push(shadeFaces(fg, 0, 0.62));
  return merge(parts);
}

function instanced(geo, mat, list, zoff) {
  const mesh = new THREE.InstancedMesh(geo, mat, list.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const e = new THREE.Euler();
  const col = new THREE.Color();
  list.forEach(([x, y], i) => {
    const r1 = hash2(x, y, 3), r2 = hash2(x, y, 7), r3 = hash2(x, y, 11);
    p.set(x + 0.5 + (r1 - 0.5) * 0.18, 0, y + zoff + (r2 - 0.5) * 0.14);
    q.setFromEuler(e.set(0, r3 * Math.PI * 2, 0));
    const k = 0.9 + r2 * 0.25;
    s.set(k, 0.92 + r1 * 0.2, k);
    m.compose(p, q, s);
    mesh.setMatrixAt(i, m);
    const t = 0.88 + r3 * 0.14;
    mesh.setColorAt(i, col.setRGB(t, t, t));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere?.();
  return mesh;
}

