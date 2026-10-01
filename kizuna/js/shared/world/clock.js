// 昼と夜（せかいの 時計）
//
// ・時計は サーバーが きめる（world.now()）。1日は DAY_MS（げんじつの 20分）
// ・キャラごとに「時間の ずれ」（char.timeShift）を もつ。宿屋で 休むと ずれが すすむ（朝まで・夜まで）
// ・パーティーでは リーダーの 時計を みんなで 見る（さそわれて 来た 人は リーダーの 時間）
//   ほかの パーティーは それぞれの 時計（家族サーバーで だれかが 宿屋で 休んでも、ほかの 人の 空は かわらない）
// ・クライアントは serverTime（とどいた 時こく）と パーティーの clockShift で おなじ 時間を 出す
//
// 1日の わりあい（frac: 0〜1）。0 が 朝6時
//   0.00〜0.05 明け方 → 0.05〜0.60 昼 → 0.60〜0.70 夕方 → 0.70〜0.95 夜 → 0.95〜1.00 明け方

export const DAY_MS = 20 * 60 * 1000;
export const DUSK_FROM = 0.6;
export const NIGHT_FROM = 0.7;
export const NIGHT_TO = 0.95;
export const DAY_FROM = 0.05;
// 宿屋で 休んだ あとの 時間
export const REST_TO = { morning: 0.02, night: 0.72 };

export const PHASE_NAMES = { dawn: '明け方', day: '昼', dusk: '夕方', night: '夜' };

const mod = (a, n) => ((a % n) + n) % n;

export function dayFrac(now, shift = 0) {
  return mod(now + (Number(shift) || 0), DAY_MS) / DAY_MS;
}

export function phaseOf(frac) {
  if (frac < DAY_FROM || frac >= NIGHT_TO) return 'dawn';
  if (frac < DUSK_FROM) return 'day';
  if (frac < NIGHT_FROM) return 'dusk';
  return 'night';
}

// あそびの うえでの 夜（夜の 魔物・夜の 人）
export function isNightFrac(frac) {
  return frac >= NIGHT_FROM && frac < NIGHT_TO;
}

// くらさ（0＝昼 〜 1＝まよなか）。夕方と 明け方は だんだん
export function darkness(frac) {
  if (frac >= DAY_FROM && frac < DUSK_FROM) return 0;
  if (frac >= DUSK_FROM && frac < NIGHT_FROM) return (frac - DUSK_FROM) / (NIGHT_FROM - DUSK_FROM);
  if (frac >= NIGHT_FROM && frac < NIGHT_TO) return 1;
  // 明け方（0.95〜1.0 と 0〜0.05 を つなげて）
  const t = frac >= NIGHT_TO ? frac - NIGHT_TO : frac + (1 - NIGHT_TO);
  return Math.max(0, 1 - t / (1 - NIGHT_TO + DAY_FROM));
}

// 時こく（6時から はじまる 24時間。時計の 表示用）
export function clockHour(frac) {
  return Math.floor(mod(6 + frac * 24, 24));
}

// until（'morning' か 'night'）まで 時間を すすめた あとの ずれ（かならず 先へ すすむ）
export function restShift(now, shift, until) {
  const target = REST_TO[until] ?? REST_TO.morning;
  const cur = dayFrac(now, shift);
  let step = mod(target - cur, 1);
  if (step < 0.01) step += 1; // もう その 時間なら つぎの 日の その 時間
  return Math.round(mod((Number(shift) || 0) + step * DAY_MS, DAY_MS));
}

// ───── せかい（サーバー）の 時計 ─────
// その 人が 見ている 時計の もちぬし（さそわれて 手伝っている ときは リーダー）
export function clockOwner(world, s) {
  return world.hostOf?.(s) || s;
}

export function clockShiftOf(world, s) {
  return Number(clockOwner(world, s)?.char?.timeShift) || 0;
}

export function fracFor(world, s) {
  return dayFrac(world.now(), clockShiftOf(world, s));
}

// どうくつ・塔の 中は 夜でも かわらない（夜の 魔物は フィールドだけ）
export function isNightFor(world, s) {
  return isNightFrac(fracFor(world, s));
}

// 時計を すすめる（宿屋・夜明けのすず）。パーティーの 時計の もちぬしの ずれを かえる
export function advanceClock(world, s, until) {
  const owner = clockOwner(world, s);
  if (!owner?.char) return 0;
  const shift = restShift(world.now(), owner.char.timeShift, until);
  owner.char.timeShift = shift;
  world.markDirty?.();
  return shift;
}
