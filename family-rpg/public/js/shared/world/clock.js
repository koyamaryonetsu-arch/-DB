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
// 宿屋で 休んだ あとの 時間（noon … 昼の 12時の すこし 前。王都サファラの 宿屋の「昼まで休む」。第4章 Step 3）
export const REST_TO = { morning: 0.02, night: 0.72, noon: 0.23 };

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

// ───── お日さまの むきと 昼の 12時ごろ（第4章 Step 4: オベリスクの 影と 日時計の とびら）─────
// 昼の 12時ごろ … 11時〜13時（王都の 宿屋の「昼まで休む」は 11時半ごろ。休んで すぐ 歩いて 行ける）
export const NOON_FROM = 5 / 24;
export const NOON_TO = 7 / 24;
export function isNoonFrac(frac) {
  return frac >= NOON_FROM && frac < NOON_TO;
}
// お日さまの いる がわ: 'am'（朝。影は 西へ）/ 'noon'（真上。影は 北へ みじかく）/ 'pm'（午後。影は 東へ）/ null（夜・夕方・明け方）
export function sunSide(frac) {
  if (frac < DAY_FROM || frac >= DUSK_FROM) return null;
  if (frac < NOON_FROM) return 'am';
  if (frac < NOON_TO) return 'noon';
  return 'pm';
}
// '@' で はじまる 時間の しるし（NPC・とびらの 表示じょうけん。world.js の hasFlagFn と client/field.js の hasFlag）
//   '@night' … 夜 / '@noon' … 昼の 12時ごろ / '@am' … 朝の 日ざし / '@pm' … 午後の 日ざし
export function timeFlag(f, frac) {
  if (f === '@night') return isNightFrac(frac);
  if (f === '@noon' || f === '@am' || f === '@pm') return sunSide(frac) === f.slice(1);
  return false;
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

// until（'morning'・'night'・'noon'）まで 時間を すすめた あとの ずれ（かならず 先へ すすむ）
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

// 昼の 12時ごろか（パーティーの 時計。日時計の とびら）
export function isNoonFor(world, s) {
  return isNoonFrac(fracFor(world, s));
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
