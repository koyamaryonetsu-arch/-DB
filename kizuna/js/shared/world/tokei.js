// 第6章 Step 5（A）: 止まった時計塔の「止まった 部屋」（サーバーの きまり）
//
// 止まった 部屋（maps/tokei.js の map.stopRooms。2階・4階）
// ・部屋の 中は 魔物も 水も 止まっている。時の 砂時計の 光の 中に いる 人（パーティーの みんな）だけが 動ける。止まった 水の 上も 歩ける
// ・部屋に 入ると 歩数を 数える（入口の マスから。部屋の 中に 立てる マスの 数が room.steps）。
//   数えきる 前に 部屋を 出ればよい。止まりが 切れると、時が 動き出して、部屋の 入口（room.back）へ もどされる
// ・家族は 1人ずつ 数える。部屋を 出る（部屋の 外の マスを ふむ・ほかの マップへ 行く）と 数えなおし
import { MAPS } from '../maps/index.js?v=66b0267ceac2';
// 第6章 Step 6: 8階の 歯車の ハンドル（world/tokei-gear.js）
import { stepGear } from './tokei-gear.js?v=66b0267ceac2';

export const STOP_TEXT = {
  start: (n) => `止まった部屋だ。\n魔物も水も、時が止まって、ぴくりとも動かない。\n（止まりが切れるまで、あと${n}歩くらい）`,
  half: (n) => `カチ…カチ…。\n止まった時が、少しずつ動き出そうとしている…（あと${n}歩）`,
  back: '時が動き出した！\n目をさました魔物におされて、部屋の入口にもどされてしまった…。\n（止まった水の上なら、近道できるかもしれない）',
};
export const STOP_WARN = 5;

// world.js の onEnterTile から（1マス 歩くごと）。入口へ もどした ときは true
export function stepTokei(world, s, tx, ty) {
  stepGear(world, s, tx, ty);
  const map = MAPS[s.map];
  const rooms = map?.stopRooms;
  const k = rooms ? ty * map.w + tx : -1;
  const room = rooms?.find((r) => r.cells.has(k));
  if (!room) {
    if (s.stopRoom) s.stopRoom = null;
    return false;
  }
  const st = s.stopRoom;
  if (!st || st.map !== map.id || st.id !== room.id) {
    s.stopRoom = { map: map.id, id: room.id, left: room.steps - 1 };
    world.send(s, { t: 'toast', text: STOP_TEXT.start(room.steps) });
    return false;
  }
  if (st.left <= 0) {
    s.stopRoom = null;
    world.placeSession(s, map.id, room.back.x, room.back.y, 'down', true);
    world.send(s, { t: 'toast', text: STOP_TEXT.back });
    return true;
  }
  st.left -= 1;
  if (st.left === STOP_WARN) world.send(s, { t: 'toast', text: STOP_TEXT.half(st.left) });
  return false;
}
