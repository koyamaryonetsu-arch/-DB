// 第50回 N3: 大事な物の「すぐ使う」ボタン（時の砂時計・ミナモの星読み・星読みのしおり など、物語で 何回も 使う 大事な物）
// ・すぐ使える 大事な物 … メニューの「道具」→「使う」が ある もの（ITEMS の menuUse か hourglass）
// ・c.quickItem … ボタンの 大事な物の ID（'' … 使わない。ない・もう 持っていない ときは 持っている 物の はじめの 1つ）
// ・c.quickPad … コントローラーの ボタン（QUICK_PADS の b。ない ときは ZL）。キーボードは T（client/input.js）
// ・はじめて 手に 入れた ときは 自動で ボタンに なる（stats.js の addItem → autoQuick）
// ・ひきつぎの 合言葉（transfer.js）には 入れない（ひきついだ あとは はじめの 1つに もどる）
// ITEMS だけを 読む（stats.js からも 読むので、maps などは 読まない）
import { ITEMS } from './items.js?v=a5c15ff5e061';

// メニューの 使う と おなじ サーバーの 道具の 名前（world/services.js の menuAction）
export function quickUseOf(id) {
  const it = typeof id === 'string' && Object.prototype.hasOwnProperty.call(ITEMS, id) ? ITEMS[id] : null;
  if (!it || it.type !== 'key') return null;
  return it.menuUse || (it.hourglass ? 'timeGlass' : null);
}

// HUD の ボタンの 短い 名前（ない ものは 品物の 名前）
const LABELS = { timeGlass: '砂時計', starSight: '星読み', bookmark: 'しおり' };
export const quickLabel = (id) => LABELS[quickUseOf(id)] || ITEMS[id]?.name || '';

// 持っている すぐ使える 大事な物（手に 入れた じゅん）
export const quickList = (c) => (Array.isArray(c?.keyItems) ? c.keyItems.filter((k) => quickUseOf(k)) : []);

// 今の ボタンの 大事な物（なし … null）
export function quickItemOf(c) {
  if (!c || c.quickItem === '') return null;
  const list = quickList(c);
  return list.includes(c.quickItem) ? c.quickItem : (list[0] || null);
}

// 大事な物を 手に 入れた（stats.js の addItem）: ボタンが まだ ない ときは それに する
export function autoQuick(c, id) {
  if (!c || c.species || !quickUseOf(id) || c.quickItem === '') return;
  const list = quickList(c);
  if (!list.includes(c.quickItem)) c.quickItem = list[0] || id;
}

// えらぶ（メニュー。id が '' なら 使わない）。{ ok, text }
export function setQuickItem(c, id) {
  if (id === '' || id === null) {
    c.quickItem = '';
    return { ok: true, text: 'すぐ使うボタンを使わないことにした。' };
  }
  if (!quickUseOf(id) || !quickList(c).includes(id)) return { ok: false, text: 'それはボタンにできない' };
  c.quickItem = id;
  return { ok: true, text: `${ITEMS[id].name}を、すぐ使うボタンにした！` };
}

// コントローラーの ボタン（あいている もの。A0・B1・X2・Y3・L4・R5・ZR7・SELECT8・START9 は 使っている）
export const QUICK_PADS = [
  { b: 6, name: 'ZL（LT）' },
  { b: 10, name: 'L3（左スティックをおしこむ）' },
  { b: 11, name: 'R3（右スティックをおしこむ）' },
  { b: -1, name: 'なし' },
];
export const QUICK_PAD_DEFAULT = 6;
export const quickPadOf = (c) => (QUICK_PADS.some((p) => p.b === c?.quickPad) ? c.quickPad : QUICK_PAD_DEFAULT);
export const quickPadName = (b) => (QUICK_PADS.find((p) => p.b === b) || QUICK_PADS[0]).name;

export function setQuickPad(c, b) {
  if (!QUICK_PADS.some((p) => p.b === b)) return { ok: false, text: '' };
  if (b === QUICK_PAD_DEFAULT) delete c.quickPad;
  else c.quickPad = b;
  return { ok: true, text: `大事な物のボタンを「${quickPadName(b)}」にした。` };
}

// セーブを 読んだ ときの 手直し（save.js の repairChar）
export function cleanQuick(c) {
  if (!c || typeof c !== 'object' || c.species) return;
  if (c.quickItem !== undefined && c.quickItem !== '' && !quickUseOf(c.quickItem)) delete c.quickItem;
  if (c.quickPad !== undefined && !QUICK_PADS.some((p) => p.b === c.quickPad && p.b !== QUICK_PAD_DEFAULT)) delete c.quickPad;
}

// この 場所で ボタンを 出すか（クライアントの HUD。くわしい きまりは サーバー。だめな ときは サーバーが わけを 知らせる）
//   maps … MAPS、o … { flying: 空の 上, visiting: リーダーの 冒険を 手伝っている }
export function quickHere(c, maps, mapId, x, y, o = {}) {
  const id = quickItemOf(c);
  const map = maps?.[mapId];
  if (!id || !map) return false;
  const use = quickUseOf(id);
  if (use === 'bookmark') return map.tkFloor != null;
  if (o.flying) return false;
  if (use === 'timeGlass') {
    if (o.visiting || !map.timePair || !maps[map.timePair]) return false;
    return !map.timeNoUse?.(Math.floor(x), Math.floor(y));
  }
  if (use === 'starSight') return !o.visiting && (c.guests || []).some((g) => g === 'minamo' || g?.id === 'minamo');
  return true;
}
