// 酒場が いっぱいの ときの さよなら（第35回。家族の ねがい「新しい 仲間を 入れる 時に、だれかに さよならして 入れたい」）
//   ・酒場で 新しい 人間の 仲間を さそう 時（world/services.js の 'recruit' の farewell・client/ui/services.js）
//   ・戦いの あとで 魔物が 仲間に なりたがった 時（world.js の offerBefriend → scripts.js の 'befriend' の 4つめ）
//   ・人間の 仲間とも 別れられる。人間は あとで 酒場で また さそえる（レベル1から。world/party.js の companionRelease）
//   ・配合は 2ひき → 1ぴきなので いっぱいでも できる（さよならは いらない）
// 第43回 C: いっぱいの 時の えらぶ文は「配合してあける」「あずかり所へ送る」「だれかとさよならする」「やめる」（befriendFullSteps）
//   ・配合してあける … 台本の ['breedOpen', id] で 酒場の 配合の 画面を「あける モード」で 開く（scripts.js・client/ui/services.js）
//   ・あずかり所へ送る … 魔物を 1ぴき あずかり所へ（world/storage.js）。あいた 所に 新しい 魔物
//   ・酒場で 人間の 仲間を さそう 時も 同じ えらぶ文（client/ui/services.js の pickFull・world/services.js の 'recruit'）
import { MONSTERS } from '../data/monsters.js?v=824fd873af63';
import { ROSTER_MAX, BREED_MIN_LEVEL } from '../data/companions.js?v=824fd873af63';
import { jobLabel } from '../job-label.js?v=824fd873af63';
import { ensureCompanions, companionRelease, ensureStorage, STORAGE_MAX } from './party.js?v=824fd873af63';

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

// 配合して あけられるか（Lv10いじょうの 魔物が 2ひき。1ぴきは 仲間〈40〉の 中。あずかり中の 魔物も 親に なれる）
//   あずかり中の 親から 生まれた 子は あずかり所に 入る（world/breed.js）ので、仲間の 魔物を 1ぴき 使えば 1つ あく
export function canBreedRoom(c) {
  ensureStorage(ensureCompanions(c));
  const ok = (e) => e?.kind === 'monster' && (e.char?.level || 1) >= BREED_MIN_LEVEL;
  const mine = c.companions.filter(ok).length;
  return mine >= 1 && mine + c.storage.filter(ok).length >= 2;
}

// あずかり所へ 送れるか（仲間に 魔物が いて、あずかり所に あきが ある）
export function canStore(c) {
  ensureStorage(ensureCompanions(c));
  return c.storage.length < STORAGE_MAX && c.companions.some((e) => e.kind === 'monster');
}

// あずかり所へ 送る 候補（魔物だけ。酒場で 待っている 魔物が 先・レベルの 低い じゅん。farewellList と 同じ ならび）
export function storeList(c) {
  return farewellList(c).filter((x) => !x.human);
}

// 魔物が 仲間に なりたがった とき、仲間が いっぱいなら: どうやって あけるか えらぶ 台本（world.js の offerBefriend の「はい」）
//   again … えらぶ文に もどって きた 時（さいしょの ことばを くりかえさない。scripts.js の 'befriendFull'）
export function befriendFullSteps(c, id, monName, again = false) {
  const labels = [], branches = [];
  const back = [['befriendFull', id]];
  if (canBreedRoom(c)) {
    labels.push('配合してあける');
    branches.push([['breedOpen', id]]);
  }
  if (canStore(c)) {
    const list = storeList(c);
    labels.push('あずかり所へ送る');
    branches.push([['choice', 'だれをあずかり所へ送る？', [...list.map((x) => x.label), 'もどる'], [
      ...list.map((x) => [['befriend', id, null, null, x.key]]),
      back,
    ]]]);
  }
  const list = farewellList(c);
  labels.push('だれかとさよならする');
  branches.push([['choice', 'だれとさよならする？', [...list.map((x) => x.label), 'もどる'], [
    ...list.map((x) => [['befriend', id, null, x.key]]),
    back,
  ]]]);
  labels.push('やめる');
  branches.push([['say', null, `${monName}はさびしそうに去っていった…`], ['befriend', id, false]]);
  return [
    ...(again ? [] : [['say', null, `仲間がいっぱいだ（${ROSTER_MAX}）。\n1つあければ、${monName}を仲間にできる。`]]),
    ['choice', `${monName}のために、どうする？`, labels, branches],
  ];
}

// 前の 名前（第35回）
export const befriendFarewellSteps = befriendFullSteps;
