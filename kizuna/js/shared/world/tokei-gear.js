// 第6章 Step 6（A）: 止まった時計塔 8階の 歯車の ハンドル（サーバーの きまり。world/tokei.js の stepTokei から 1歩ごとに よぶ）
// ・ハンドル（map.gearCrank）の 上に、ものがたりの パーティーの だれかが 立っている 間だけ、リーダーの フラグ HOLD8 が 立つ
//   → 歯車の ゆかが 北へ 流れる（maps/tokei-high.js の とびら。流される うごきは client/field.js・maps/flow.js）
// ・だれも 立っていなければ HOLD8 は 消える（ハンドルから おりた・ほかの 階へ 行った・ぬけた）
// ・おもり（WEIGHT8）・止める レバー（LOCK8）は だいほん（data/story-ch6d.js）
import { MAPS } from '../maps/index.js?v=66b0267ceac2';
import { HOLD8 } from '../maps/tokei-high.js?v=66b0267ceac2';

const GEAR_MAP = 'tokei_8f';

export function stepGear(world, s) {
  const owner = world.hostOf?.(s) || s;
  const flags = owner.char?.flags;
  if (!flags || (s.map !== GEAR_MAP && !flags[HOLD8])) return;
  const crank = MAPS[GEAR_MAP]?.gearCrank;
  if (!crank) return;
  const p = world.parties?.get(owner.partyId);
  const people = [...new Set([owner, s, ...(p ? p.members.map((sid) => world.sessions.get(sid)) : [])])].filter((m) => m?.inWorld && (m === owner || world.hostOf?.(m) === owner));
  const on = people.some((m) => m.map === GEAR_MAP && Math.floor(m.x) === crank.x && Math.floor(m.y) === crank.y);
  if (!!flags[HOLD8] === on) return;
  if (on) flags[HOLD8] = true;
  else delete flags[HOLD8];
  for (const m of people) world.sendSelf(m);
  if (p && p.members.length > 1) world.sendParty(p);
}
