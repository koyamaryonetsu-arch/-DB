// 馬車（ドラクエ4・5ふう）: たたかいに 出ない 仲間が 馬車に 乗って いっしょに 旅を する
//
//   c.wagon      … 馬車を もっている（第1章の あと、ルミナの町の 酒場の マスターから もらう）
//   c.wagonKeys  … 馬車に 乗っている 仲間の key（自分の 仲間だけ。家族の キャラは 乗れない）
//
// ・馬車は パーティーの リーダーの もの（家族と いっしょの ときは リーダーの 馬車が ついてくる）
// ・洞窟や 塔の 中には 入れない（入り口で 待つ）。町の 中にも 入らない（門の そとで 待つ）
// ・馬車の 仲間は、たたかいに 出なくても 経験値と 職業の 修行を 半分 もらえる（馬車が いっしょの とき）
import { COMPANION_SLOTS } from './companions.js?v=f05b52911d0e';

// 馬車に 乗れる 人数
export const WAGON_SLOTS = 4;
// 馬車の 仲間が もらえる 経験値・職業の 修行の わりあい
export const WAGON_EXP_RATE = 0.5;

export function hasWagon(c) {
  return !!c?.wagon;
}

// 馬車の 仲間の きろくを ととのえる（なくなった 仲間・家族の キャラ・パーティーに いる 仲間・かさなりを はずす）
// 馬車を もっていない ふるい セーブには なにも たさない
export function cleanWagon(c) {
  if (!c || typeof c !== 'object') return c;
  if (!Array.isArray(c.wagonKeys)) {
    if (c.wagonKeys !== undefined) delete c.wagonKeys;
    if (c.wagon) c.wagonKeys = [];
    return c;
  }
  const own = new Set((Array.isArray(c.companions) ? c.companions : []).map((e) => e?.key).filter(Boolean));
  const party = new Set(Array.isArray(c.partyKeys) ? c.partyKeys.slice(0, COMPANION_SLOTS) : []);
  c.wagonKeys = c.wagonKeys.filter((k, i, arr) => typeof k === 'string' && !k.startsWith('fam:') && own.has(k) && !party.has(k) && arr.indexOf(k) === i)
    .slice(0, WAGON_SLOTS);
  return c;
}

// 馬車を もらう イベント（第1章を クリアした あと、はじめて 酒場の マスターと 話した とき）
export function wagonEventSteps() {
  const M = '酒場のマスター';
  return [
    ['say', M, 'おお、{name}！\nなげきの洞窟の魔物をやっつけたそうだな。町中のうわさだぞ。'],
    ['say', M, '仲間もずいぶんふえたようだ。\nそこでだ、わしからのお祝いを受け取ってくれ。'],
    ['fade', 'out'],
    ['sfx', 'key'],
    ['wagon'],
    ['fade', 'in'],
    ['say', null, '{name}は馬車を手に入れた！'],
    ['say', M, `馬車には仲間を${WAGON_SLOTS}人まで乗せておける。\n戦いの中でも「いれかえ」で、馬車の仲間と入れかわれるぞ。`],
    ['say', M, 'ただし、洞窟や塔の中には入れない。\n馬車は入り口で待っているから、中では入れかえられないんだ。'],
    ['say', M, '馬車の仲間は戦いに出なくても、\n経験値を半分もらえる。休ませたい仲間は馬車に乗せるといい。'],
    ['say', M, '乗りかえはこの酒場か、\nメニューの「仲間」→「馬車」でできるぞ。'],
  ];
}
