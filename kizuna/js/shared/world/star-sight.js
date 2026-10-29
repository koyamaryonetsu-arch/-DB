// 第6章 Step 3・4（A）: ミナモの 星読みと 星の道しるべ（サーバーの きまり）
//
// ミナモの 星読み（大事な物 c6s_star_reading。メニューの「道具」→「使う」。{ t: 'menu', action: 'starSight' }）
// ・ミナモが ゲストで いっしょの ときだけ。リーダーが 使う（パーティーの みんなに 夜空が 見える）
// ・使うと フラグ c6_starsight（maps/hoshimichi.js の STARSIGHT）が たって、使った 人が STAR_STEPS 歩く まで 夜空が 見える
//   （星めぐりの古道の 星の もやの 本当の 道が 光る。5階の 星受けの台で 星を 受けとめられる）。夜は 星読みが なくても 見える（'@night'）
// ・とちゅうで 切れた などで のこった フラグは、だれも 星読みを していない とき、古道の 階を 歩くと 消える
//
// 星の もや（maps/hoshimichi.js の map.mist）: 本当の 道 いがいの もやを ふむと、もやの 入口へ もどされる（どの 人も 1人ずつ）
import { MAPS } from '../maps/index.js?v=99ee8fb62a40';
import { STARSIGHT } from '../maps/hoshimichi.js?v=99ee8fb62a40';
import { hasKeyItem } from '../stats.js?v=99ee8fb62a40';
import { ScriptRun } from './scripts.js?v=99ee8fb62a40';
import { partyOf } from './party.js?v=99ee8fb62a40';

export const STAR_ITEM = 'c6s_star_reading';
export const STAR_STEPS = 40;

export const STAR_TEXT = {
  leader: '星読みをたのめるのは、パーティーのリーダーだけ。',
  busy: '今は使えない',
  fly: '空の上では使えない。\n（おりてから使おう）',
  none: 'ミナモがいないと、星の声は聞こえない…。',
  lost: 'もやの中で、道にまよった…\n気がつくと、もやの入口にもどっていた。\n（夜空の星が見えれば、道が分かるかもしれない）',
  half: '夜空の星が、少しずつうすくなってきた…',
  end: '夜空の星が、見えなくなった…\n（ミナモの星読みで、また見られる）',
};

function sendAll(world, s) {
  world.sendSelf(s);
  const p = partyOf(world, s);
  if (p && p.members.length > 1) world.sendParty(p);
  world.markDirty();
}
const active = (world, except = null) => [...world.sessions.values()].some((m) => m !== except && m.starSight);

// メニューから（world/services.js の menuAction の 'starSight'）。reply(ok, text)
export function useStarSight(world, s, reply) {
  if (world.hostOf?.(s)) return reply(false, STAR_TEXT.leader);
  if (!hasKeyItem(s.char, STAR_ITEM)) return reply(false, STAR_TEXT.none);
  if (s.busy) return reply(false, STAR_TEXT.busy);
  if (s.flying) return reply(false, STAR_TEXT.fly);
  if (!(s.char.guests || []).includes('minamo')) return reply(false, STAR_TEXT.none);
  const p = partyOf(world, s);
  const others = (p?.members || []).map((id) => world.sessions.get(id)).filter((m) => m && m !== s && m.inWorld && !m.away && !m.busy && m.map === s.map);
  const steps = [
    ['sfx', 'spell'],
    ['say', 'ミナモ', 'まかせて。\n…星よ、わたしたちに、道を見せて。'],
    ['call', (run) => { startStarSight(run.world, s); }],
    ['sync'],
    ['flash'],
    ['say', null, `ミナモが星を読んだ！\n昼の空のおくに、夜空の星が見えてきた…！\n（しばらく、${STAR_STEPS}歩くらいの間）`],
  ];
  const run = new ScriptRun(world, s, [s, ...others], steps, { scriptId: 'star_sight', owner: s });
  run.start();
  return reply(true, '');
}

// 星読みを はじめる（だいほん・テストからも）
export function startStarSight(world, s) {
  s.char.flags[STARSIGHT] = true;
  s.starSight = { left: STAR_STEPS, full: STAR_STEPS };
  world.markDirty();
}

function endStarSight(world, s) {
  s.starSight = null;
  if (!active(world, s)) delete s.char.flags[STARSIGHT];
  world.send(s, { t: 'toast', text: STAR_TEXT.end });
  sendAll(world, s);
}

// world.js の onEnterTile から（1マス 歩くごと）
export function stepStars(world, s, tx, ty) {
  const map = MAPS[s.map];
  // 星の もや: 本当の 道 いがいを ふむと 入口へ
  if (map?.mist?.lost.has(ty * map.w + tx)) {
    const b = map.mist.back;
    world.placeSession(s, map.id, b.x, b.y, 'up', true);
    world.send(s, { t: 'toast', text: STAR_TEXT.lost });
    return true;
  }
  const st = s.starSight;
  if (st) {
    st.left -= 1;
    if (st.left <= 0) endStarSight(world, s);
    else if (st.left === Math.floor(st.full / 4)) world.send(s, { t: 'toast', text: STAR_TEXT.half });
    return false;
  }
  // のこった フラグ（とちゅうで 切れた など）を 消す
  if (!map?.hmFloor) return false;
  const owner = world.hostOf?.(s) || s;
  if (!owner.char.flags[STARSIGHT] || active(world)) return false;
  delete owner.char.flags[STARSIGHT];
  sendAll(world, owner);
  return false;
}
