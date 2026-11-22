// 第3部 第2章 第4幕「金の音と、星の橋」（A: 世界と 物語）の しくみ（サーバー）。world.js から 読む
// ※ ネタバレ注意（docs/plan-part3-c10d.md の 16-2）
// ■ のぼる 連戦（星の 階段 c10d_stair1〜3・いただき c10d_summit）
// ・門（4つ）の 前の マスで 番人との 戦い（台本 c10d_gate<n>_event）。勝つと 門の フラグ（リーダーの フラグ ＝ パーティーで 同じ・セーブする）
// ・全滅した 時は、いのりの場所では なく、その 門の 前の おどり場で 目を 覚ます（HP・MP は 全滅の きまりの とおり ＝ 全部 回復）
//   いただき（ボス）で 全滅した 時は いただきの 入口
// ・同じ 門で 3回 負けると、その おどり場の いずみが もう 一度 だけ わく（えらんだ しるしを 消す。1つの 門で 1回だけ）
//   負けた 回数・わいた かは セーブしない（サーバーの メモ world.c10dLoss。リーダーの キャラごと）
// ■ 星の いずみ（3つの めぐみから 1つ。おどり場ごとに 1回きり。パーティーで 1つ。リーダーが えらぶ）
// ・いやしの水 … その 場に いる パーティー 全員（仲間・ゲスト・馬車も）の HP を 全部 回復・たおれた 仲間も 起きる
// ・ちえの水 … 全員の MP を 全部 回復
// ・ちからの水 … 次の 戦いの 間、全員の 与える ダメージ 1.2倍（★ 戦いの 側は B班。A班は しるし s.c10dPower を 立てて わたす。
//   B班は 戦いの はじめに takePower10d(world, sessions) で 読んで 消す）
// ■ 回線が 切れて もどった 時: 星の 階段は その 階の 次の 門の 前の おどり場（開いた 門は 開いた まま）
import { MAPS, canStand, standSpot } from '../maps/index.js?v=8db07833986d';
import { computeStats, fullHeal } from '../stats.js?v=8db07833986d';
import { partyOf } from './party.js?v=8db07833986d';
import { wagonChars } from './wagon.js?v=8db07833986d';
import {
  C10D_GATES, C10D_WELLS, C10D_MAP, C10D_MAP_IDS, C10D_STAIR_MAPS, C10D_BLESS, C10D_BLESS_NAMES, C10D_REFILL_LOSSES, C10D_POWER_KEY,
} from '../maps/c10d-flags.js?v=8db07833986d';
import { STAIR1_POS, STAIR2_POS, STAIR3_POS, SUMMIT_POS } from '../maps/c10d-rows.js?v=8db07833986d';

// 門ごとの マップと おどり場（g … 1〜4）
const POS = { [C10D_MAP.stair1]: STAIR1_POS, [C10D_MAP.stair2]: STAIR2_POS, [C10D_MAP.stair3]: STAIR3_POS };
export const GATE_INFO10D = Object.fromEntries(Object.entries(POS).flatMap(([map, P]) => P.gates.map((G) => [G.g, { map, ...G }])));
const leaderOf = (world, s) => world.hostOf?.(s) || s;
const keyOf = (world, s) => leaderOf(world, s).char?.id || s.id;
export const gatesOpen10d = (has) => C10D_GATES.filter((f) => has(f)).length;
// 開いて いない いちばん 下の 門（1〜4。ぜんぶ 開いて いれば 0）
export const nextGate10d = (has) => { const i = C10D_GATES.findIndex((f) => !has(f)); return i < 0 ? 0 : i + 1; };

// ───── 全滅・回線が 切れた 時の 着く 所 ─────
// その 人の 今の すすみぐあいで「次の 門の 前の おどり場」（この マップの 門が ぜんぶ 開いて いれば null）
function landingOn(mapId, has) {
  const P = POS[mapId];
  if (!P) return null;
  const G = P.gates.find((q) => !has(C10D_GATES[q.g - 1]));
  return G ? G.landing : null;
}
function place10d(world, s, p, dir = 'up') {
  const map = MAPS[s.map];
  const has = world.hasFlagFn(s);
  const at = canStand(map, p.x + 0.5, p.y + 0.5, has) ? { x: p.x + 0.5, y: p.y + 0.5 } : standSpot(map, p.x + 0.5, p.y + 0.5, has);
  world.placeSession(s, s.map, at.x, at.y, dir, true);
}

// 全滅（world.js の respawn から）。この 幕の マップで なければ false
export function c10dRespawn(world, s, note = '') {
  if (!C10D_MAP_IDS.includes(s.map)) return false;
  const has = world.hasFlagFn(s);
  const lead = leaderOf(world, s);
  const lines = [];
  // 負けた 回数（門の 戦いの 前に 台本が しるしを つけた 時だけ。1回の 全滅で 1回）
  const store = world.c10dLoss || (world.c10dLoss = new Map());
  const k = keyOf(world, s);
  const armed = world.c10dArm?.get(k);
  if (armed) {
    world.c10dArm.delete(k);
    const lk = `${k}|${armed}`;
    const L = store.get(lk) || { n: 0, refilled: false };
    L.n++;
    const well = C10D_WELLS[armed - 1];
    if (L.n >= C10D_REFILL_LOSSES && !L.refilled && lead.char?.flags?.[well]) {
      delete lead.char.flags[well];
      L.refilled = true;
      lines.push('…星のいずみが、もう一度、わきだした！');
    }
    store.set(lk, L);
  }
  fullHeal(s.char);
  if (s.map === C10D_MAP.summit) {
    const E = SUMMIT_POS.entry;
    world.placeSession(s, s.map, E.x + 0.5, E.y + 0.5, 'up', true);
  } else {
    // 次の 門の 前の おどり場（その 門の マップ）
    const g = nextGate10d(has);
    const G = GATE_INFO10D[g];
    if (G && G.map !== s.map) world.placeSession(s, G.map, G.landing.x + 0.5, G.landing.y + 0.5, 'up', true);
    else place10d(world, s, G ? G.landing : POS[s.map].entry);
  }
  world.send(s, { t: 'toast', afterBattle: true, text: `${s.char.name}は、おどり場で、目を覚ました。${lines.length ? `\n${lines.join('\n')}` : ''}${note ? `\n${note}` : ''}` });
  return true;
}
// 門の 戦いの 前（台本の call）: 負けた 時に 数える しるし / 勝った 時: しるしを 消す
export function armGate10d(world, s, g) {
  (world.c10dArm || (world.c10dArm = new Map())).set(keyOf(world, s), g);
}
export function disarmGate10d(world, s) {
  world.c10dArm?.delete(keyOf(world, s));
}
export const lossOf10d = (world, s, g) => world.c10dLoss?.get(`${keyOf(world, s)}|${g}`) || { n: 0, refilled: false };

// 回線が 切れて もどった（world.js の onPlay・resumeSession。場所は もう 決まって いる）: 星の 階段は 次の 門の 前の おどり場
export function c10dOnPlay(world, s) {
  if (!C10D_STAIR_MAPS.includes(s.map)) return false;
  const has = world.hasFlagFn(s);
  const p = landingOn(s.map, has);
  if (!p) return false;
  s.x = p.x + 0.5;
  s.y = p.y + 0.5;
  return true;
}

// ───── 星の いずみ ─────
// その 場に いる パーティーの 人（同じ マップ）。ひとりなら 自分だけ
function matesOf(world, s) {
  const p = partyOf(world, s);
  if (!p) return [s];
  return p.members.map((id) => world.sessions.get(id)).filter((m) => m?.char && m.inWorld !== false && m.map === s.map);
}
function blessChar(ch, kind) {
  if (!ch) return;
  if (kind === C10D_BLESS.heal) {
    const mp = ch.mp;
    fullHeal(ch);
    ch.mp = mp;
  } else if (kind === C10D_BLESS.mind) {
    ch.mp = computeStats(ch).maxMp;
  }
}
// えらんだ（台本の call から）。'leader' … リーダーで ない / 'used' … もう えらんだ / 'ok'
export function bless10d(world, s, i, kind) {
  if (world.hostOf?.(s)) return 'leader';
  const flag = C10D_WELLS[i - 1];
  if (!flag || s.char.flags[flag]) return 'used';
  s.char.flags[flag] = true;
  const mates = matesOf(world, s);
  const p = partyOf(world, s);
  if (kind === C10D_BLESS.power) {
    for (const m of mates) m[C10D_POWER_KEY] = true;
  } else {
    for (const m of mates) blessChar(m.char, kind);
    for (const sup of p?.supports || []) blessChar(sup.char, kind);
    for (const g of p?.guests || []) blessChar(g.char, kind);
    for (const ch of wagonChars(world, p)) blessChar(ch, kind);
  }
  for (const m of mates) {
    if (m !== s) world.send(m, { t: 'toast', text: `${s.char.name}が、星のいずみの「${C10D_BLESS_NAMES[kind]}」を、えらんだ！` });
    world.sendSelf(m);
  }
  if (p) world.sendParty?.(p);
  world.markDirty?.();
  return 'ok';
}
export const wellUsed10d = (world, s, i) => !!world.hasFlagFn(s)(C10D_WELLS[i - 1]);

// ちからの水の しるし（B班が 戦いの はじめに 読んで 消す）: いっしょに 戦う 人の だれかに あれば true
export function takePower10d(world, sessions) {
  let on = false;
  for (const m of sessions || []) if (m?.[C10D_POWER_KEY]) { on = true; delete m[C10D_POWER_KEY]; }
  return on;
}

// 台本から つかう（world.c10d。data/story-c10d.js）
export const C10D_API = {
  bless: bless10d, wellUsed: wellUsed10d, arm: armGate10d, disarm: disarmGate10d, lossOf: lossOf10d, takePower: takePower10d,
};
