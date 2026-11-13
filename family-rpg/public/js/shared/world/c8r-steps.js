// 第8章 第4幕「時のはざま」（A: 世界と物語）の 歩くと かわる しくみ（world.js の onEnterTile から 1マス ごと）
// ※ ネタバレ注意（docs/plan-ch8.md の 9）
// ・青火のつばさ・最後の 回廊の 青い 火（第2幕の おさらい ＋ ひねり）: ともした 人が FIRE_STEPS 歩 あるくと 消える。
//   その 階（千年前と 今は おなじ 階）を 出ても 消える。消えた 時に 見えない 道の 上に いた 人は となりへ よける（world/hazards.js の unstickAll）
//   とちゅうで 切れた などで のこった 火は、だれも ともして いない とき、その 階を 歩くと 消える
// ・時の砂の 浅せ（わたると 時代が 入れかわる）は だいほん c8r_ford（data/story-c8r.js）
import { MAPS } from '../maps/index.js';
import { FIRE_STEPS } from '../maps/c8r-floor.js';
import { unstickAll } from './hazards.js';
import { partyOf } from './party.js';

const fireFloor = (flag) => /^c8r_([a-z]+\d)_f\d+$/.exec(flag)?.[1] || null;

// だいほんから（青い 火の 台を しらべて ともした）
export function lightFire8r(run, flag) {
  const s = run.init;
  const owner = run.owner;
  owner.char.flags[flag] = true;
  const list = (s.c8rFires || []).filter((f) => f.flag !== flag);
  list.push({ flag, floor: MAPS[s.map]?.c8rFloor, left: FIRE_STEPS, owner: owner.id });
  s.c8rFires = list;
}

function held(world, flag, except = null) {
  for (const m of world.sessions.values()) if (m !== except && m.c8rFires?.some((f) => f.flag === flag)) return true;
  return false;
}

function putOut(world, s, st, why) {
  const owner = world.sessions.get(st.owner) || s;
  if (!held(world, st.flag, s)) delete owner.char.flags[st.flag];
  unstickAll(world, owner);
  world.sendSelf(s);
  if (owner !== s) world.sendSelf(owner);
  const p = partyOf(world, owner);
  if (p && p.members.length > 1) world.sendParty(p);
  if (why === 'out') world.send(s, { t: 'toast', text: 'フッ…\n青い火が、消えてしまった。\n（もう一度、台を調べれば、またともせる）' });
  world.markDirty();
}

// world.js の onEnterTile から
export function stepC8r(world, s, tx, ty) {
  const map = MAPS[s.map];
  const floor = map?.c8rFloor || null;
  const list = s.c8rFires;
  if (list?.length) {
    const keep = [], gone = [];
    for (const st of list) {
      if (st.floor !== floor) { gone.push([st, 'leave']); continue; }
      st.left -= 1;
      if (st.left <= 0) { gone.push([st, 'out']); continue; }
      if (st.left === 5) world.send(s, { t: 'toast', text: '青い火が、小さくなってきた…！' });
      keep.push(st);
    }
    s.c8rFires = keep;
    for (const [st, why] of gone) putOut(world, s, st, why);
    return;
  }
  // のこった 火（とちゅうで 切れた など）を 消す
  if (!floor) return;
  const owner = world.hostOf?.(s) || s;
  const stale = Object.keys(owner.char.flags).filter((f) => fireFloor(f) === floor && !held(world, f));
  if (!stale.length) return;
  for (const f of stale) delete owner.char.flags[f];
  unstickAll(world, owner);
  world.sendSelf(s);
  if (owner !== s) world.sendSelf(owner);
  world.markDirty();
}
