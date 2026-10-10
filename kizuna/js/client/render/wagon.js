// 馬車（ほろ馬車と 馬）の ドット絵と、パーティーの うしろを ついてくる うごき
//   よこむきは left を かく（right は はんてん）。down は 馬が てまえ、up は 馬車の うしろが てまえ
import { Painter, scale2x, rimShade, outline2, flipCanvas } from './pixel.js?v=0136232bcf56';
import { MAPS, tileAt, onWater } from '../../shared/maps/index.js?v=0136232bcf56';
import { PLACES } from '../../shared/maps/overworld.js?v=0136232bcf56';
import { SEA_PLACES } from '../../shared/maps/ch2.js?v=0136232bcf56';
import { T } from '../../shared/tiles.js?v=0136232bcf56';

const OUT = '#1b1330';
const C = {
  horse: '#a8683a', horseD: '#7a4624', horseL: '#c88a52', mane: '#3a2618', hoof: '#2a1c14', eye: '#1b1330', blaze: '#f4ecdc',
  harness: '#c83a3a', gold: '#f2c14e',
  cover: '#f2ead2', coverD: '#cfc2a0', coverL: '#fffaf0', rib: '#a8906a', dark: '#3a2a36',
  wood: '#8a5a32', woodD: '#5a3a22', woodL: '#b8864a', wheel: '#4a3020', wheelFace: '#c89a62', hub: '#f2c14e',
};

// 車輪（こい わく・あかるい 板・こい スポーク。f で スポークが まわる）
function wheel(p, cx, cy, r, f) {
  p.ellipse(cx, cy, r, r, C.wheel);
  p.ellipse(cx, cy, r - 1.3, r - 1.3, C.wheelFace);
  const cxr = Math.round(cx - 0.5), cyr = Math.round(cy - 0.5);
  const n = Math.floor(r - 1.3);
  if (f) {
    for (let k = -n + 1; k <= n - 1; k++) { p.set(cxr + k, cyr + k, C.wheel); p.set(cxr + k, cyr - k, C.wheel); }
  } else {
    p.hline(cxr - n, cxr + n, cyr, C.wheel);
    p.vline(cxr, cyr - n, cyr + n, C.wheel);
  }
  p.set(cxr, cyr, C.hub);
}

// よこむき（left）: 馬が ひだり、馬車が みぎ
function paintSide(f) {
  const p = new Painter(46, 30);
  const g = 28; // じめん
  // 馬車の はこ と ほろ
  p.rect(21, 17, 23, 6, C.wood);
  p.hline(21, 43, 17, C.woodL);
  p.hline(21, 43, 22, C.woodD);
  for (const x of [26, 32, 38]) p.vline(x, 18, 21, C.woodD);
  for (let x = 21; x <= 43; x++) {
    const t = (x - 21) / 22;
    const top = Math.round(8 - Math.sin(Math.PI * Math.min(1, t * 1.15)) * 3 + (t > 0.9 ? (t - 0.9) * 20 : 0));
    for (let y = top; y <= 16; y++) p.set(x, y, y === top ? C.coverL : y >= 15 ? C.coverD : C.cover);
  }
  for (const x of [27, 33, 39]) for (let y = 6; y <= 16; y++) if (p.get(x, y)) p.set(x, y, C.rib);
  p.vline(21, 9, 16, C.coverD);
  // くるま
  wheel(p, 27, g - 4, 4.6, f);
  wheel(p, 39, g - 4, 4.6, f);
  // ながえ（馬と つなぐ ぼう）
  p.hline(12, 21, 18, C.woodD);
  p.hline(12, 20, 17, C.woodL);
  // 馬
  const lb = f ? 1 : 0;
  p.ellipse(11, 16, 7.2, 4.4, C.horse);
  p.hline(6, 16, 12, C.horseL);
  // あし（前・うしろ。f で いれかわる）
  const legs = f ? [[5, 1], [8, 0], [13, 0], [16, 1]] : [[5, 0], [8, 1], [13, 1], [16, 0]];
  for (const [x, up] of legs) {
    p.vline(x, 19, g - 1 - up, C.horseD);
    p.vline(x + 1, 19, g - 1 - up, C.horse);
    p.hline(x, x + 1, g - up, C.hoof);
  }
  // くび と あたま
  for (let i = 0; i < 7; i++) p.rect(5 - Math.round(i * 0.4), 13 - i, 4, 2, C.horse);
  p.rect(0, 5, 6, 4, C.horse);
  p.rect(0, 8, 3, 2, C.horseL);
  p.set(0, 9, C.horseD);
  p.set(3, 6, C.eye);
  p.set(4, 3, C.horse); p.set(4, 4, C.horse); p.set(5, 3, C.horseD); p.set(5, 4, C.horse);
  // たてがみ・しっぽ
  for (let i = 0; i < 7; i++) p.set(7 - Math.round(i * 0.4), 12 - i, C.mane);
  p.set(6, 5, C.mane); p.set(6, 4, C.mane);
  p.vline(18, 13 + lb, 19 + lb, C.mane);
  p.vline(19, 14 + lb, 20, C.mane);
  // くつわ・むながい（あかい ひも）
  p.vline(2, 5, 9, C.harness);
  p.hline(3, 9, 13 - lb * 0, C.harness);
  p.set(6, 13, C.gold);
  return p;
}

// まえ（down）: 馬が てまえ、ほろの 入り口が おく
function paintDown(f) {
  const p = new Painter(26, 38);
  // ほろ（アーチ）
  for (let y = 2; y <= 22; y++) {
    const half = y < 8 ? Math.round(Math.sqrt(Math.max(0, 1 - ((8 - y) / 6) ** 2)) * 10) : 10;
    for (let x = 13 - half; x <= 12 + half; x++) p.set(x, y, y <= 3 ? C.coverL : C.cover);
  }
  // 入り口（中は くらい）
  for (let y = 6; y <= 20; y++) {
    const half = y < 10 ? Math.round(Math.sqrt(Math.max(0, 1 - ((10 - y) / 4) ** 2)) * 6) : 6;
    for (let x = 13 - half; x <= 12 + half; x++) p.set(x, y, C.dark);
  }
  p.vline(3, 8, 22, C.coverD); p.vline(22, 8, 22, C.coverD);
  // はこ・くるま
  p.rect(2, 20, 22, 6, C.wood);
  p.hline(2, 23, 20, C.woodL);
  p.hline(2, 23, 25, C.woodD);
  p.rect(0, 21, 2, 9, C.wheel); p.rect(24, 21, 2, 9, C.wheel);
  p.vline(1, 22 + f, 28, C.woodL); p.vline(24, 22 + (1 - f), 28, C.woodL);
  // ながえ
  p.vline(8, 25, 30, C.woodD); p.vline(17, 25, 30, C.woodD);
  // 馬（こちらを 向く）
  p.rect(9, 26, 8, 5, C.horse);
  p.rect(10, 20, 6, 10, C.horse);
  p.rect(10, 20, 6, 1, C.horseL);
  p.set(10, 18, C.horse); p.set(10, 19, C.horse); p.set(15, 18, C.horse); p.set(15, 19, C.horse);
  p.rect(11, 19, 4, 2, C.mane);
  p.vline(12, 22, 28, C.blaze); p.vline(13, 22, 28, C.blaze);
  p.set(10, 23, C.eye); p.set(15, 23, C.eye);
  p.rect(11, 29, 4, 2, C.horseL);
  p.set(11, 30, C.horseD); p.set(14, 30, C.horseD);
  p.hline(9, 16, 26, C.harness);
  p.set(12, 26, C.gold); p.set(13, 26, C.gold);
  // まえあし
  const a = f ? 0 : 1, b = 1 - a;
  p.rect(10, 31, 2, 5 - a, C.horseD); p.rect(10, 36 - a, 2, 1, C.hoof);
  p.rect(14, 31, 2, 5 - b, C.horseD); p.rect(14, 36 - b, 2, 1, C.hoof);
  return p;
}

// うしろ（up）: 馬車の うしろが てまえ、馬の あたまが ほろの うえに 見える
function paintUp(f) {
  const p = new Painter(26, 38);
  // 馬（おく。耳と たてがみ）
  p.rect(10, 1, 6, 8, C.horse);
  p.set(10, 0, C.horseD); p.set(15, 0, C.horseD);
  p.rect(12, 1, 2, 8, C.mane);
  // ほろ（うしろ）
  for (let y = 7; y <= 27; y++) {
    const half = y < 13 ? Math.round(Math.sqrt(Math.max(0, 1 - ((13 - y) / 6) ** 2)) * 11) : 11;
    for (let x = 13 - half; x <= 12 + half; x++) p.set(x, y, y <= 8 ? C.coverL : C.cover);
  }
  for (let y = 12; y <= 27; y++) { p.set(6, y, C.rib); p.set(19, y, C.rib); }
  // うしろの 入り口（ひもで とじてある）
  for (let y = 13; y <= 25; y++) p.hline(10, 15, y, C.coverD);
  p.vline(12, 13, 25, C.rib); p.vline(13, 13, 25, C.rib);
  for (let y = 15; y <= 24; y += 3) p.hline(11, 14, y, C.harness);
  // はこ・くるま
  p.rect(1, 26, 24, 6, C.wood);
  p.hline(1, 24, 26, C.woodL);
  p.hline(1, 24, 31, C.woodD);
  for (const x of [7, 13, 19]) p.vline(x, 27, 30, C.woodD);
  p.rect(0, 27, 2, 10, C.wheel); p.rect(24, 27, 2, 10, C.wheel);
  p.vline(1, 28 + f, 35, C.woodL); p.vline(24, 28 + (1 - f), 35, C.woodL);
  p.rect(3, 32, 20, 2, C.woodD);
  return p;
}

function fine(p) {
  const q = scale2x(scale2x(p));
  rimShade(q, 0.18, 0.16);
  outline2(q, OUT, 0.4);
  return q;
}

// フィールドに かく 大きさ（キャラと あわせる。馬の 高さが 人より すこし ひくい くらい）
//   え（ドット）は そのままで、res を 大きく して 小さく かく（drawAt・2.5D は 見た目の 大きさ＝ width / res）
export const WAGON_SCALE = 0.68;

const cache = new Map();
export function wagonSprite(dir, frame) {
  const f = frame ? 1 : 0;
  const k = `${dir}|${f}`;
  let c = cache.get(k);
  if (!c) {
    const side = dir === 'left' || dir === 'right';
    c = fine(side ? paintSide(f) : dir === 'up' ? paintUp(f) : paintDown(f)).toCanvas();
    if (dir === 'right') c = flipCanvas(c);
    c.res = (c.res || 1) / WAGON_SCALE;
    cache.set(k, c);
  }
  return c;
}

// ───────────── ついてくる うごき ─────────────
// 町の 中・たてものの 中・船の 上・桟橋には 入らない（門の そとで 待つ）
const NO_TILES = new Set([T.FLOOR_WOOD, T.FLOOR_STONE, T.DOOR, T.CARPET, T.PIER, T.STEPPING, T.STAIRS_DOWN, T.STAIRS_UP, T.CAVE_ENTRANCE, T.WATER, T.DEEP]);
const inRect = (x, y, r) => x >= r[0] && y >= r[1] && x < r[0] + r[2] && y < r[1] + r[3];
function townRects(mapId) {
  const out = [];
  if (mapId === 'overworld') for (const id of ['village', 'town']) out.push([PLACES[id].x, PLACES[id].y, PLACES[id].w, PLACES[id].h]);
  for (const sp of Object.values(SEA_PLACES)) if (sp.map === mapId && sp.rect) out.push(sp.rect);
  return out;
}

// 馬車が 止まって いられる 場所か
export function wagonSpotOk(map, x, y, hasFlag) {
  if (!map || map.kind !== 'field') return false;
  const tx = Math.floor(x), ty = Math.floor(y);
  if (townRects(map.id).some((r) => inRect(tx, ty, r))) return false;
  if (onWater(map, x, y, hasFlag)) return false;
  return !NO_TILES.has(tileAt(map, tx, ty));
}

// 歩いた あと（trail）の 長さ（マス）
function trailLen(o) {
  let acc = 0;
  let prev = o;
  for (const p of o.trail || []) {
    acc += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
  }
  return acc;
}

// ひとりぶんの 馬車（パーティーの うしろを ついてくる。入れない 所では 止まって 待つ）
//   止まった 場所は マップごとに おぼえる（洞窟から 出ると 入り口で 待っている）
export class WagonFollower {
  constructor() {
    this.pos = null;
    this.mapId = null;
    this.moving = false;
    this.parked = {};
  }

  // field … Field / o … { x, y, dir, trail } / n … ついてくる 仲間の 数
  update(field, o, n, dt) {
    const map = field.map;
    const id = map?.id || null;
    if (id !== this.mapId) {
      if (this.mapId && this.pos) this.parked[this.mapId] = this.pos;
      this.mapId = id;
      this.pos = (id && this.parked[id]) || null;
    }
    if (!map || map.kind !== 'field' || !MAPS[map.id]) return null;
    const hasFlag = (f) => field.gateFlag(f);
    // 船に のっている あいだは 馬車も 船の 中（かかない）
    if (onWater(map, o.x, o.y, hasFlag)) {
      this.pos = null;
      this.moving = false;
      return null;
    }
    // よこむきは 絵が 長いので すこし はなれる。歩いた あとが まだ みじかい（マップに 来た ばかり）なら 止まった まま
    // （馬車の 大きさ WAGON_SCALE に あわせた きょり）
    const want = n + 1.9;
    if (trailLen(o) < want * 0.95) {
      this.moving = false;
      return this.pos;
    }
    let tp = field.trailPos(o, want);
    if (!tp) return this.pos;
    if (tp.dir === 'left' || tp.dir === 'right') tp = field.trailPos(o, n + 1.85) || tp;
    const side = tp.dir === 'left' || tp.dir === 'right';
    // 絵の まんなかを 道に あわせる（たてむきは 絵が 長いので あしもとを さげる）
    const gx = tp.x, gy = tp.y + (side ? 0.07 : 0.72);
    const ok = wagonSpotOk(map, tp.x, tp.y, hasFlag) && wagonSpotOk(map, tp.x, gy - 0.2, hasFlag);
    if (!ok) {
      this.moving = false;
      return this.pos;
    }
    if (!this.pos || Math.hypot(this.pos.x - gx, this.pos.y - gy) > 3.2) {
      this.pos = { x: gx, y: gy, dir: tp.dir || 'down' };
      this.moving = false;
      return this.pos;
    }
    const dx = gx - this.pos.x, dy = gy - this.pos.y;
    const d = Math.hypot(dx, dy);
    const step = Math.min(d, 9 * (dt / 1000));
    if (d > 0.001) {
      this.pos.x += (dx / d) * step;
      this.pos.y += (dy / d) * step;
    }
    this.moving = d > 0.02;
    this.pos.dir = tp.dir || this.pos.dir;
    return this.pos;
  }
}

// フィールドに かく 馬車（じぶん と ほかの リーダー）。field.render / field.entities3d から まいフレーム よぶ
//   field.wagonHidden … ほかの のりものに のっている とき などに かくす
export function wagonDraws(field) {
  const out = [];
  // 大鳥で 空を とんでいる 間も かくす（sky.js）
  if (field.wagonHidden || field.game?.sky?.hidesFollowers?.()) return out;
  const g = field.game;
  const dt = Math.min(100, field.lastDt || 16);
  const add = (key, holder, o, n) => {
    holder.wagonF = holder.wagonF || new WagonFollower();
    const pos = holder.wagonF.update(field, o, n, dt);
    if (!pos) return;
    out.push({ key, canvas: wagonSprite(pos.dir, holder.wagonF.moving ? field.walkFrame(true) : 0), x: pos.x, y: pos.y, side: pos.dir === 'left' || pos.dir === 'right' });
  };
  const p = g.party;
  if (g.me?.wagon && (!p || p.leader === g.sid) && !field.hideMe) add('wg:me', field, field.me, field.myFollowers().length);
  for (const o of field.others.values()) {
    if (o.wg) add('wg:' + o.sid, o, o, (o.fl || []).filter((f) => !(field.hideGuests && f.guest)).length);
  }
  return out;
}
