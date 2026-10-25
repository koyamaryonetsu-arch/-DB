// 時の砂時計（第6章 Step 1・2。サーバーの きまり）と、時のほこらの 砂時計の とびら
//
// 時の砂時計（大事な物 toki_glass。メニューの「道具」→「使う」。{ t: 'menu', action: 'timeGlass' }）
// ・使える 所: 時代の 組が ある マップ（map.timePair）だけ。おなじ 座標の まま、もう 一つの 時代の マップへ
//   第6章では overworld ⇔ overworld_past と、時のいせきの 各階 ⇔ その 階の 千年前
// ・使えない 所: 町や 家の 中（map.timeNoUse）・時のほこら・番人の 間（map.timeBlock）・戦いの 中・空の 上
// ・出る 所が 歩けない（かべ・水・物の 中・人や 宝箱の 上・出入り口の 上）ときは 使えない。
//   フィールドは、出る 所から その 時代の 里まで 歩いて 行ける ときだけ（map.timeHome から 歩いて 行ける 所。とじこめられない）
// ・パーティー: リーダーだけが 使える。おなじ マップに いる 家族が いる ときは「みんなで」「ひとりで」を えらぶ
//   （みんなで … 家族も いっしょに 時を こえる。ルーラ・帰り道の羽と おなじ。ひとりで … 時のいせき 7階の 2つの 時代の しかけ）
//   家族は それぞれ 自分の いる 座標の まま（そこに 立てない ときは リーダーの そば）。仲間（サポート・ゲスト・馬車）は いつも いっしょ
// ・画面: 砂色の うずで 切りかわる（だいほんの ['timeShift', 'in'|'out', 動く 人]。client/time-shift.js）
//
// 時のほこらの 砂時計の とびら（maps/toki-shrine.js）
// ・台を しらべると、とびらの フラグ（SAND_FLAG）が たって 開く。しらべた 人が 自分で 歩いた 歩数で 砂が 落ちる
//   （流れる 砂に 流されて いる 間は 数えない）。落ちきると フラグを 消して しまる（とびらの 上の 人は となりへ よける）
// ・とちゅうで 切れた などで のこった フラグは、だれも 砂を 落として いない とき、その 階を 歩くと 消える
import { MAPS, canStand, standSpot, isBlocked, effectiveTile } from '../maps/index.js?v=f7adbedf412d';
import { TILE_INFO } from '../tiles.js?v=f7adbedf412d';
import { hasKeyItem } from '../stats.js?v=f7adbedf412d';
import { partyOf } from './party.js?v=f7adbedf412d';
import { unstickAll } from './hazards.js?v=f7adbedf412d';

export const TIME_GLASS = 'toki_glass';

// 使えない わけの ことば
export const GLASS_TEXT = {
  leader: '時の砂時計を使えるのは、パーティーのリーダーだけ。\n（リーダーが使うと、いっしょに時をこえられる）',
  busy: '今は使えない',
  fly: '空の上では使えない。\n（おりてから使おう）',
  shrine: '砂時計の砂は、しずかに止まっている…\n（時のほこらの中では、時をこえられない）',
  boss: '砂時計の砂が、ゆらゆらとゆれている…\n（この広間は時がゆがんでいて、時をこえられない）',
  town: '町や家の中では使えない。\n（外に出てから使おう）',
  none: '時の砂時計をかざした…\nしかし、何もおこらない。\n（「時の組」がある場所でだけ、時をこえられる）',
  wall: '（ここでは、時をこえられない…\n向こうの時代では、かべの中のようだ）',
  far: '（ここでは、時をこえられない…\n向こうの時代のこの場所は、深い森や川の向こうのようだ）',
  // 第6章 Step 5: 止まった時計塔（map.timeBlock）と、時の すきまの ある 階（map.timeSpot）
  tower: '砂時計の砂が、塔の時計の音に合わせて、カチ…カチ…と止まってしまう…\n（この塔の中では、時をこえられない。光るゆか「時のすきま」のほかは）',
  gap: '（ここでは、時をこえられない…\n光るゆか「時のすきま」の上で使おう）',
};

// フィールドの「歩いて 行ける ところ」（map.timeHome から。しかけは ぜんぶ 開いた として。マップごとに 1回）
const areaCache = new Map();
export function timeArea(map) {
  if (!map?.timeHome) return null;
  if (areaCache.has(map.id)) return areaCache.get(map.id);
  const { w, h } = map;
  const seen = new Uint8Array(w * h);
  const [sx, sy] = map.timeHome;
  const q = [[sx, sy]];
  seen[sy * w + sx] = 1;
  const has = () => true;
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const k = ny * w + nx;
      if (seen[k] || isBlocked(map, nx, ny, has)) continue;
      seen[k] = 1;
      q.push([nx, ny]);
    }
  }
  areaCache.set(map.id, seen);
  return seen;
}

// (x, y) へ 時を こえて 出られるか（'' … 出られる / ことばの キー）
export function landingKey(map, x, y, has) {
  if (!map) return 'none';
  if (!canStand(map, x, y, has)) return 'wall';
  const area = timeArea(map);
  if (area && !area[Math.floor(y) * map.w + Math.floor(x)]) return 'far';
  return '';
}

// 今いる 場所で 使えるか: { ok, key } / { ok: true, to … もう 一つの 時代の マップの ID }
export function glassCheck(world, s) {
  const host = world.hostOf?.(s);
  if (host) return { ok: false, key: 'leader' };
  if (!hasKeyItem(s.char, TIME_GLASS)) return { ok: false, key: 'none' };
  if (s.busy) return { ok: false, key: 'busy' };
  if (s.flying) return { ok: false, key: 'fly' };
  const map = MAPS[s.map];
  if (!map?.timePair || !MAPS[map.timePair]) return { ok: false, key: map?.timeBlock || 'none' };
  if (map.timeNoUse?.(Math.floor(s.x), Math.floor(s.y))) return { ok: false, key: 'town' };
  // 第6章 Step 5: 時の すきまの 上だけ（止まった時計塔の 3階 ⇔ 今の 星の塔の 2階。maps/tokei.js）
  const spot = map.timeSpot?.(Math.floor(s.x), Math.floor(s.y), world.hasFlagFn(s));
  if (spot) return { ok: false, key: spot };
  const to = MAPS[map.timePair];
  const key = landingKey(to, s.x, s.y, world.hasFlagFn(s));
  if (key) return { ok: false, key };
  return { ok: true, to: to.id };
}

// いっしょに 時を こえられる 家族（おなじ マップ。たたかい・だいほんの 中・つうしん まちの 人は のぞく）
export function glassCompanions(world, s) {
  const p = partyOf(world, s);
  if (!p) return [];
  return p.members.map((id) => world.sessions.get(id)).filter((m) => m && m !== s && m.inWorld && !m.away && !m.busy && m.map === s.map);
}

// だいほんの 中で 時を こえる（['call', (run) => shiftPeople(run, to, movers)]）。
// movers … 動く 人（セッション。はじめの 人が リーダー）。それぞれ 自分の 座標の まま（立てない ときは リーダーの そば）
export function shiftPeople(run, toMap, movers = run.everyone) {
  const w = run.world;
  const map = MAPS[toMap];
  if (!map || !movers.length) return;
  const lead = movers[0];
  const has = w.hasFlagFn(run.owner);
  const leadSpot = landingKey(map, lead.x, lead.y, has) ? standSpot(map, lead.x, lead.y, has) : { x: lead.x, y: lead.y };
  const pos = movers.map((m, i) => {
    if (i === 0) return [leadSpot.x, leadSpot.y];
    if (!landingKey(map, m.x, m.y, has)) return [m.x, m.y];
    const near = standSpot(map, leadSpot.x + (i % 2 ? 1 : -1) * 0.7, leadSpot.y + 0.6, has);
    return [near.x, near.y];
  });
  movers.forEach((m, i) => w.placeSession(m, toMap, pos[i][0], pos[i][1], m.dir, false));
  run.batch.push(['teleport', toMap, pos[0][0], pos[0][1], lead.dir || 'down', movers.map((m, i) => [m.id, pos[i][0], pos[i][1], m.posSeq])]);
}

// 時を こえる だいほん（砂の うず → 切りかえ → 着いた ことば）
export function shiftSteps(toMap, movers, note = null) {
  const ids = movers.map((m) => m.id);
  const past = !!MAPS[toMap]?.past;
  return [
    ['sfx', 'spell'],
    ['timeShift', 'in', ids, past ? 'past' : 'present'],
    ['call', (run) => shiftPeople(run, toMap, movers.filter((m) => run.world.sessions.has(m.id)))],
    ['timeShift', 'out', ids, past ? 'past' : 'present'],
    ['say', null, note || (past ? '――千年前の世界に来た。' : '――今の世界にもどってきた。')],
  ];
}

// メニューの「道具」→「使う」は world/time-glass-use.js（だいほんを はじめる ので、だいほんの しくみ scripts.js を 読む。ここは 読まない）

// ───────────── 時のほこらの 砂時計の とびら ─────────────
// だいほんから（maps/toki-shrine.js の 台）: 砂時計を ひっくり返す。steps … 砂が 落ちきるまでの 歩数
export function flipSand(run, flag, steps) {
  const s = run.init;
  const owner = run.owner;
  owner.char.flags[flag] = true;
  s.sand = { flag, map: s.map, left: steps, full: steps, last: { x: Math.floor(s.x), y: Math.floor(s.y) }, owner: owner.id };
}

function sandActive(world, flag, except = null) {
  for (const m of world.sessions.values()) if (m !== except && m.sand?.flag === flag) return true;
  return false;
}

function closeSand(world, s, why = 'fall') {
  const st = s.sand;
  s.sand = null;
  if (!st) return;
  const owner = world.sessions.get(st.owner) || s;
  if (!sandActive(world, st.flag, s)) delete owner.char.flags[st.flag];
  unstickAll(world, owner);
  world.sendSelf(s);
  if (owner !== s) world.sendSelf(owner);
  const p = partyOf(world, owner);
  if (p && p.members.length > 1) world.sendParty(p);
  if (why === 'fall') world.send(s, { t: 'toast', text: 'サラサラ…\n砂が落ちきって、砂時計のとびらがしまった。' });
  world.markDirty();
}

// world.js の onEnterTile から（1マス 歩くごと）
export function stepSand(world, s, tx, ty) {
  const map = MAPS[s.map];
  const st = s.sand;
  if (!st) {
    // のこった フラグ（とちゅうで 切れた など）を 消す
    if (!map?.shrineFloor) return;
    const owner = world.hostOf?.(s) || s;
    const stale = Object.keys(owner.char.flags).filter((f) => f.startsWith('c6_sd_') && !sandActive(world, f));
    if (!stale.length) return;
    for (const f of stale) delete owner.char.flags[f];
    world.sendSelf(s);
    if (owner !== s) world.sendSelf(owner);
    world.markDirty();
    return;
  }
  if (st.map !== s.map) return closeSand(world, s, 'leave');
  const lx = st.last.x, ly = st.last.y;
  st.last = { x: tx, y: ty };
  // 流されて 動いた（前の マスが 流れる 砂で、その 向きへ 1マス）ときは 数えない
  const has = world.hasFlagFn(s);
  const flow = TILE_INFO[effectiveTile(map, lx, ly, has)]?.flow;
  if (flow && tx - lx === flow[0] && ty - ly === flow[1]) return;
  st.left -= Math.max(1, Math.abs(tx - lx) + Math.abs(ty - ly));
  if (st.left <= 0) return closeSand(world, s);
  if (st.left === Math.floor(st.full / 2)) world.send(s, { t: 'toast', text: '砂が、半分落ちた…！' });
  else if (st.left === 2) world.send(s, { t: 'toast', text: '砂が、もうすぐ落ちきる…！' });
}
