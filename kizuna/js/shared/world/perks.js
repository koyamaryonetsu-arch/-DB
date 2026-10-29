// 装備の ふしぎな 力（第31回。data/items-r31.js の perk）
//   expHat … しあわせのぼうし: 戦いの 経験値が 2倍（その 戦いの パーティーで いちばん レベルが 高い 人には 効かない）
//   walkMp … こうふくのくつ: 10歩 歩くと MPが 1 回復（フィールドと ダンジョン。つけた 人ごとに 数える）
import { ITEMS, baseItemId } from '../data/items.js?v=5c89bfcd3c09';
import { HAT_EXP_MULT, SHOE_STEPS, SHOE_MP } from '../data/items-r31.js?v=5c89bfcd3c09';
import { MAPS } from '../maps/index.js?v=5c89bfcd3c09';
import { computeStats } from '../stats.js?v=5c89bfcd3c09';
import { partyOf } from './party.js?v=5c89bfcd3c09';
import { wagonEntries, wagonHere } from './wagon.js?v=5c89bfcd3c09';

// その 人が つけている 装備の 力（perk）が あるか
export function hasPerk(ch, perk) {
  const eq = ch?.equip;
  if (!eq) return false;
  for (const id of Object.values(eq)) if (id && ITEMS[baseItemId(id)]?.perk === perk) return true;
  return false;
}

// ───────────── しあわせのぼうし ─────────────
// その 戦いの パーティーの いちばん 高い レベル（chars … 戦った 人〈ゲストは のぞく〉と 馬車の 仲間）
export function topLevel(chars) {
  let top = 0;
  for (const ch of chars || []) if (ch && Number.isFinite(ch.level)) top = Math.max(top, ch.level);
  return top;
}

// 経験値の 倍率（ぼうしを つけていて、いちばん レベルが 高い 人で なければ 2倍）
export function expHatMult(ch, top) {
  if (!hasPerk(ch, 'expHat')) return 1;
  return (ch.level || 1) < top ? HAT_EXP_MULT : 1;
}

// 戦いの おわり（world/battles.js）: その 戦いの パーティーの 人（戦った 人〈ゲストは のぞく〉＋ 馬車の 仲間）
export function battleTeamChars(world, ctx) {
  const out = [];
  for (const a of ctx.battle.allies) {
    const who = ctx.actorMap[a.id];
    if (who?.char && who.type !== 'guest') out.push(who.char);
  }
  const p = world.parties.get(ctx.partyId);
  const lc = p ? world.sessions.get(p.leader)?.char : null;
  if (lc) for (const e of wagonEntries(world, lc, p)) if (!out.includes(e.char)) out.push(e.char);
  return out;
}

// ───────────── こうふくのくつ ─────────────
// 歩いた 数（つけた 人ごと。セーブには のこさない）
const walked = new WeakMap();

// s と いっしょに 歩く 人: 自分・（リーダーか ひとりの とき）パーティーの 仲間・馬車が いっしょの 所なら 馬車の 仲間
export function walkers(world, s) {
  const out = [{ ch: s.char, self: true }];
  const p = partyOf(world, s);
  if (p && p.leader !== s.id) return out;
  for (const x of p?.supports || []) if (x.char) out.push({ ch: x.char });
  if (p && wagonHere(s.map)) for (const e of wagonEntries(world, s.char, p)) out.push({ ch: e.char });
  return out;
}

// 1歩ずつの 移動で 歩いた 数（n … 前の マスから 何マス 動いたか）。サーバーの world.onMove から
export function walkSteps(world, s, n) {
  if (!(n > 0) || s.flying || s.busy || !s.char) return false;
  const kind = MAPS[s.map]?.kind;
  if (kind !== 'field' && kind !== 'dungeon') return false;
  let selfChanged = false, partyChanged = false;
  for (const { ch, self } of walkers(world, s)) {
    if (!hasPerk(ch, 'walkMp')) continue;
    let k = (walked.get(ch) || 0) + n;
    const times = Math.floor(k / SHOE_STEPS);
    k -= times * SHOE_STEPS;
    walked.set(ch, k);
    if (!times || !(ch.hp > 0)) continue;
    const max = computeStats(ch).maxMp;
    const mp = Math.min(max, (ch.mp || 0) + times * SHOE_MP);
    if (mp === ch.mp) continue;
    ch.mp = mp;
    if (self) selfChanged = true;
    else partyChanged = true;
  }
  if (selfChanged) world.sendSelf(s);
  if (selfChanged || partyChanged) {
    const p = partyOf(world, s);
    if (p) world.sendParty(p);
    world.markDirty();
  }
  return selfChanged || partyChanged;
}

// テスト よう: 歩いた 数
export function walkedSteps(ch) {
  return walked.get(ch) || 0;
}
