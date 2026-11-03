// 第64回: タッチの ボタンの ならび（スマホの たて持ちだけ。よこ持ちと コントローラーは 今のまま）
//   right … 右手用（今まで。左に スティック・右に A・B）
//   left  … 左手用（左右 はんたい。右に スティック・左に A・B）
//   oneR / oneL … 片手用（スティックと A・B を 同じ 側の 親指が とどく 所に まとめる）
//   このたんまつだけの 設定（localStorage）。body の data-hand に 入れて、css（style.css）で ならびを かえる
export const HANDS = ['right', 'left', 'oneR', 'oneL'];
export const HAND_NAMES = { right: '右手用', left: '左手用', oneR: '片手（右手）', oneL: '片手（左手）' };
const KEY = 'kizuna_hand';

export function handPref() {
  try {
    const v = localStorage.getItem(KEY);
    return HANDS.includes(v) ? v : 'right';
  } catch {
    return 'right';
  }
}

export function applyHand(v = handPref()) {
  if (typeof document === 'undefined' || !document.body) return;
  document.body.dataset.hand = HANDS.includes(v) ? v : 'right';
}

// つぎの ならびへ（メニューの「設定」）
export function nextHand() {
  const v = HANDS[(HANDS.indexOf(handPref()) + 1) % HANDS.length];
  try { localStorage.setItem(KEY, v); } catch { /* */ }
  applyHand(v);
  return v;
}

// スティックが 出る 所（さわった 所に 出る）。たて持ちの 時だけ ならびで かわる
//   x, y … さわった 所・w, h … 画面の 大きさ
export function inStickZone(x, y, w, h, hand = 'right') {
  const tate = h > w;
  if (!tate || hand === 'right') return x < w * 0.6;
  if (hand === 'left') return x > w * 0.4;
  // 片手: 画面の 下の 半分で、親指の 側（ボタンは 自分で さわりを うけとるので かさならない）
  if (y < h * 0.45) return false;
  return hand === 'oneR' ? x > w * 0.2 : x < w * 0.8;
}
