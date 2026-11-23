// 第3部 第1章 第1幕「星ふるえの夜」（A: 世界と 物語）の 光の輪（サーバー）。world.js の onEnterTile・snap から
// ※ ネタバレ注意（docs/plan-part3.md の 9-2）
// ・光の ようすは パーティーで 1つ（家族で 同じ 明かりを 見る。人数が 多いほど 早く つながる）。セーブしない
//   （world.c9aLight。パーティーの だれも その 階に いなく なると 消える ＝ 階を 出ると もどる）
// ・こけを ふむと 光る・みなもとに つながると ずっと 光る・つながって いない こけは ふんだ 人が 24歩 あるくと 消える（計算は maps/c9a-light.js）
// ・その 階の 水しょうが 全部 光ると とびらが 開く（フラグ c9_b1〜c9_b3 を 世界の もちぬし〈パーティーなら リーダー〉に。開いた まま）
// ・見えない 穴に 落ちると その 階の 入口へ（ダメージ なし）
// ・くらやみ虫（B班の 魔物。MONSTERS[種].darkOnly）は 光って いる マスに 入らない（map.symBlock。world/monsters.js から）
// ・こけ玉（B班の 魔物。MONSTERS[種].mossGlow）に 勝つと、たおした 所の まわりの こけが 光る（world/battles.js から）
// ・星の子の フィールドの 連れ（戦いの わくには 入らない）: c9_child の あと、リーダーの うしろを 歩く（world.js の followerLooks）
import { MAPS } from '../maps/index.js?v=b63ba00e848c';
import { MONSTERS } from '../data/monsters.js?v=b63ba00e848c';
import { newLight, stepLight, glowMoss, doorOpen, packLit, litCells } from '../maps/c9a-light.js?v=b63ba00e848c';
import { C9A, SPICA, SPICA_NAME } from '../maps/c9a-flags.js?v=b63ba00e848c';
import { C9A_CAVE_IDS } from '../maps/c9a-cave.js?v=b63ba00e848c';
import { partyOf } from './party.js?v=b63ba00e848c';
import { setStoryFlag } from './scripts.js?v=b63ba00e848c';
import { C9A_OBJ } from '../data/story-c9a.js?v=b63ba00e848c';

const lights = (world) => world.c9aLight || (world.c9aLight = new Map());
const partyKey = (world, s) => partyOf(world, s)?.id ?? `s:${s.id}`;
const keyOf = (world, s, mapId) => `${partyKey(world, s)}|${mapId}`;
const ownerOf = (world, s) => world.hostOf?.(s) || s;

// その 人の パーティーの その 階の 光（なければ 作る）
export function lightFor(world, s, mapId = s.map) {
  const L = lights(world);
  const k = keyOf(world, s, mapId);
  let st = L.get(k);
  if (!st) {
    st = newLight();
    st.map = mapId;
    st.party = partyKey(world, s);
    const f = MAPS[mapId]?.c9aDoorFlag;
    st.opened = !!(f && ownerOf(world, s).char?.flags?.[f]);
    L.set(k, st);
  }
  return st;
}

// だれも いなく なった 階の 光を 消す（パーティーが かわった 時も）
export function pruneC9a(world) {
  const L = world.c9aLight;
  if (!L?.size) return;
  const here = new Set();
  for (const m of world.sessions.values()) if (m.inWorld && MAPS[m.map]?.c9a) here.add(keyOf(world, m, m.map));
  for (const k of [...L.keys()]) if (!here.has(k)) L.delete(k);
}

// とびらが 開いた（世界の もちぬしに フラグ。パーティーの みんなに 知らせる）
function openDoor(world, s, map, st) {
  const owner = ownerOf(world, s);
  const f = map.c9aDoorFlag;
  st.opened = true;
  if (owner.char.flags[f]) return;
  setStoryFlag(owner.char, f);
  const obj = C9A_OBJ[f];
  if (obj && owner.char.objective !== C9A_OBJ.act1) owner.char.objective = obj;
  const p = partyOf(world, owner);
  const who = p ? p.members.map((id) => world.sessions.get(id)).filter(Boolean) : [owner];
  if (!who.includes(owner)) who.push(owner);
  for (const m of who) {
    world.sendSelf(m);
    if (m.map === map.id) world.send(m, { t: 'toast', text: 'キラーン…！\n水しょうが光って、光のとびらが開いた！' });
  }
  if (p && p.members.length > 1) world.sendParty(p);
  world.markDirty();
}

// world.js の onEnterTile から（1マス ごと）。穴に 落ちた 時は true（その マスの しかけは 見ない）
export function stepC9a(world, s, tx, ty) {
  const map = MAPS[s.map];
  const info = map?.c9a;
  if (!info) return false;
  const st = lightFor(world, s);
  if (stepLight(info, st, tx, ty, s.id) && map.c9aDoorFlag && !st.opened && doorOpen(info, st.lit)) openDoor(world, s, map, st);
  if (info.holeSet?.has(ty * info.w + tx)) {
    const e = map.c9aEntry;
    world.placeSession(s, map.id, e.x, e.y, e.dir, true);
    world.send(s, { t: 'toast', text: 'ズザザーッ！\n見えない穴に落ちて、この階の入口にもどってしまった。\n（光るこけの光で、穴が見えるよ）' });
    return true;
  }
  return false;
}

// こけ玉（MONSTERS[種].mossGlow）に 勝った: たおした 所の まわりの こけが 光る（world/battles.js の 戦いの あと）
export function c9aMossWin(world, s, mapId, sym) {
  const map = MAPS[mapId];
  const info = map?.c9a;
  if (!info || !s || !(sym?.group || [sym?.sp]).some((g) => MONSTERS[Array.isArray(g) ? g[0] : g]?.mossGlow)) return false;
  const st = lightFor(world, s, mapId);
  const ok = glowMoss(info, st, Math.floor(sym.x), Math.floor(sym.y), s.id);
  if (ok && map.c9aDoorFlag && !st.opened && doorOpen(info, st.lit)) openDoor(world, s, map, st);
  return ok;
}

// snap に のせる その 人の パーティーの 光（くらい 階に いる 時だけ）。1びょうに 1回 だれも いない 階の 光を 消す
export function c9aSnap(world, s) {
  const now = world.now?.() ?? Date.now();
  if (!(world.c9aPruneAt > now - 1000)) { world.c9aPruneAt = now; pruneC9a(world); }
  if (!MAPS[s.map]?.c9a) return null;
  const st = lights(world).get(keyOf(world, s, s.map));
  return { map: s.map, lit: st ? packLit(st.lit) : [], ver: st?.ver || 0 };
}

// (x, y) が 光って いるか（どの パーティーの 光でも。みなもと・開いた とびらの 水しょうは いつも）
export function c9aLitAt(world, mapId, x, y) {
  const map = MAPS[mapId];
  const info = map?.c9a;
  if (!info) return false;
  const k = y * info.w + x;
  if (!map.c9aBase) map.c9aBase = litCells(info, new Map());
  if (map.c9aBase.has(k)) return true;
  for (const st of lights(world).values()) {
    if (st.map !== mapId) continue;
    if (st.cellsVer !== st.ver || st.cellsOpen !== st.opened) { st.cells = litCells(info, st.lit, st.opened); st.cellsVer = st.ver; st.cellsOpen = st.opened; }
    if (st.cells.has(k)) return true;
  }
  return false;
}

// くらやみ虫（darkOnly の 魔物）は 光って いる マスに 入らない（world/monsters.js から）
export const darkBlocked = (world, mapId, sym, x, y) => !!MONSTERS[sym?.sp]?.darkOnly && c9aLitAt(world, mapId, Math.floor(x), Math.floor(y));
for (const id of C9A_CAVE_IDS) if (MAPS[id]) MAPS[id].symBlock = (world, sym, x, y) => darkBlocked(world, id, sym, x, y);

// 星の子の フィールドの 連れ（リーダーの うしろを 歩く。戦いの わくには 入らない）
export const spicaFollows = (s) => !!s?.char?.flags?.[C9A.child];
export const spicaLook = () => ({ spica: 1, name: SPICA_NAME, guest: SPICA });
