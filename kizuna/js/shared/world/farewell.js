// 酒場が いっぱいの ときの さよなら（第35回。家族の ねがい「新しい 仲間を 入れる 時に、だれかに さよならして 入れたい」）
//   ・酒場で 新しい 人間の 仲間を さそう 時（world/services.js の 'recruit' の farewell・client/ui/services.js）
//   ・戦いの あとで 魔物が 仲間に なりたがった 時（world.js の offerBefriend → scripts.js の 'befriend' の 4つめ）
//   ・人間の 仲間とも 別れられる。人間は あとで 酒場で また さそえる（レベル1から。world/party.js の companionRelease）
//   ・配合は 2ひき → 1ぴきなので いっぱいでも できる（さよならは いらない）
import { MONSTERS } from '../data/monsters.js?v=2d8d7ef5c868';
import { ROSTER_MAX } from '../data/companions.js?v=2d8d7ef5c868';
import { jobLabel } from '../job-label.js?v=2d8d7ef5c868';
import { ensureCompanions, companionRelease } from './party.js?v=2d8d7ef5c868';

// 酒場が いっぱいか（パーティー・馬車・酒場の 仲間 みんなで ROSTER_MAX）
export function rosterIsFull(c) {
  return ensureCompanions(c).companions.length >= ROSTER_MAX;
}

// さよならの 候補: 酒場で 待っている 仲間が 先・レベルの 低い じゅん（家族の キャラは 入らない）
export function farewellList(c) {
  ensureCompanions(c);
  const busy = new Set([...(c.partyKeys || []), ...(c.wagonKeys || [])]);
  return c.companions
    .map((e, i) => ({ e, i }))
    .sort((x, y) => busy.has(x.e.key) - busy.has(y.e.key) || (x.e.char.level || 1) - (y.e.char.level || 1) || x.i - y.i)
    .map(({ e }) => ({
      key: e.key, name: e.char.name, human: e.kind !== 'monster',
      label: `${e.char.name}（${e.species ? MONSTERS[e.species]?.name || '' : jobLabel(e.char.job, e.char)} Lv${e.char.level}${busy.has(e.key) ? '・いっしょ' : ''}）`,
    }));
}

// さよなら した ときの ことば
export function farewellText(r) {
  if (!r?.ok) return '';
  return r.human ? `${r.name}とさよならした。\n「また酒場でさそってね！」` : `${r.name}とさよならした。\n「今までありがとう！」`;
}

// さよなら する（台本の 'befriend' から）。ことばを かえす
export function sayFarewell(world, s, key) {
  return farewellText(companionRelease(world, s, String(key || '')));
}

// 魔物が 仲間に なりたがった とき、酒場が いっぱいなら: だれと さよならするか えらぶ 台本（world.js の offerBefriend の「はい」）
export function befriendFarewellSteps(c, id, monName) {
  const list = farewellList(c);
  return [
    ['say', null, `仲間がいっぱいだ（${ROSTER_MAX}人）。\nだれかとさよならすれば、${monName}を仲間にできる。`],
    ['choice', 'だれとさよならする？', [...list.map((x) => x.label), 'やめる'], [
      ...list.map((x) => [['befriend', id, null, x.key]]),
      [['say', null, `${monName}はさびしそうに去っていった…`], ['befriend', id, false]],
    ]],
  ];
}
