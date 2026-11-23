// 歩く 1フレーム（client/field.js の update から。Node の テストでも 回せる ように DOM を 使わない）
// boxFree(x, y) … 自分の 体が (x, y) に 入れるか（field.js の boxFree）
//
// かどを すりぬける（nudge）: 進む 向きが かべで 止まった 時、すぐ 横（0.2・0.35 マス）に ずれれば 進める なら、そちらへ 少し ずれる。
// 第102回 M1班で 直した こと（docs/plan-r102-corner-slide.md）:
//   ・左右へ 進む 時も 上下と 同じに きく（前は すりぬけた たての いちが、同じ フレームの たての いどう〈nudge の 前の いちから 計算〉で もとに もどった）
//   ・スティックが 少し ななめ（30° くらい まで）でも きく（前は 横の ずれが 0.3 より 小さい 時だけ ＝ 17° くらい まで）
//   ・ずらす 向きは、スティックの 横の ずれの ほうを 先に ためす（まっすぐの 時は 前と 同じ ＋ が 先）
// かわらない こと: かべの 当たり（boxFree で たしかめた 所 だけに 動く）・1フレームの いどうの 大きさ・すりぬける はば（0.2・0.35）

// ななめの 入力でも すりぬける 角度（横の ずれ ÷ 進む 向き。0.58 ≒ 30°）
export const NUDGE_SLANT = 0.58;
// 前から ある きまり: 横の ずれが これより 小さければ すりぬける（スティックを 少しだけ たおした 時 など）
export const NUDGE_MINOR = 0.3;

// 進む 向き（axis の 反対の 軸）が ふさがった 時に、axis の 向きへ ずれる。
// axis 'y' … 左右へ 進む 時（たてに ずれる）。'x' … 上下へ 進む 時（横に ずれる）。dirSign … 進む 向き（+1 / -1）。
// pref … 先に ためす ずれの 向き（+1 / -1。0 は +1 が 先）
export function nudgeStep(boxFree, axis, me, dirSign, sp, pref = 0) {
  const order = pref < 0 ? [-1, 1] : [1, -1];
  // ずれた 先で 進めるかを 見る 長さ: 0.1 か 1フレームの いどう（おそい スマホ〈1フレーム 33〜50ミリびょう〉では 0.1 より 長い。
  // 0.1 だけ だと、まだ かべまで とどかない 所を「進める」と 見て、口を すぎて すべって いった）
  const look = dirSign * Math.max(0.1, sp);
  for (const off of [0.2, 0.35]) {
    for (const s of order) {
      if (axis === 'y') {
        if (boxFree(me.x + look, me.y + s * off)) {
          const step = Math.min(sp, off) * s;
          if (boxFree(me.x, me.y + step)) { me.y += step; return true; }
        }
      } else if (boxFree(me.x + s * off, me.y + look)) {
        const step = Math.min(sp, off) * s;
        if (boxFree(me.x + step, me.y)) { me.x += step; return true; }
      }
    }
  }
  return false;
}

// 進む 向きの ほかに 横の ずれ minor が あっても すりぬけて よいか
export function nudgeOk(major, minor) {
  return Math.abs(minor) < NUDGE_MINOR || Math.abs(minor) <= Math.abs(major) * NUDGE_SLANT;
}

// 1フレーム 歩く（ix, iy … 入力。sp … この フレームで 進む 長さ）。動いたら true
// 横 → たての じゅんに 1つずつ（かべに そって すべる）。たての いどうは 横の いどう〈と すりぬけ〉の あとの いちから
export function walkStep(boxFree, me, ix, iy, sp) {
  const len = Math.hypot(ix, iy) || 1;
  const dx = (ix / len) * sp, dy = (iy / len) * sp;
  let moved = false;
  if (boxFree(me.x + dx, me.y)) { me.x += dx; moved = true; }
  else if (nudgeOk(ix, iy)) moved = nudgeStep(boxFree, 'y', me, ix > 0 ? 1 : -1, sp, Math.sign(iy)) || moved;
  if (boxFree(me.x, me.y + dy)) { me.y += dy; moved = true; }
  else if (nudgeOk(iy, ix)) moved = nudgeStep(boxFree, 'x', me, iy > 0 ? 1 : -1, sp, Math.sign(ix)) || moved;
  return moved;
}
