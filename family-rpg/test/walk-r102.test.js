// 第102回 M1班: 歩く 1フレームと かどを すりぬける（client/walk.js）
// 左右へ 進む 時も 上下と 同じに きく・スティックが ななめ ±25° でも かどに 入れる・かべを ぬけない・すべりすぎない・速さは かわらない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { walkStep, nudgeStep, nudgeOk } from '../public/js/client/walk.js';
import { MAPS, isBlocked, BODY } from '../public/js/shared/maps/index.js';
import { checkFile } from '../tools/kanji-check.mjs';

const SP = 4.6 * 0.016; // 1フレーム（16ミリびょう）の 歩く 長さ
const ALL = () => true;

// rows（'#' かべ・'.' ゆか）の 小さな マップ
function grid(rows) {
  const solid = (x, y) => y < 0 || y >= rows.length || x < 0 || x >= rows[0].length || rows[y][x] === '#';
  const boxFree = (x, y) => [[x - BODY.hw, y - BODY.top], [x + BODY.hw, y - BODY.top], [x - BODY.hw, y + BODY.bot], [x + BODY.hw, y + BODY.bot]]
    .every(([px, py]) => !solid(Math.floor(px), Math.floor(py)));
  return { solid, boxFree };
}
// 前の 歩き方（第101回 までの client/field.js。くらべる ため）
function oldStep(boxFree, me, ix, iy, sp) {
  const nudge = (axis, dirSign) => {
    for (const off of [0.2, 0.35]) for (const s of [1, -1]) {
      if (axis === 'y' ? boxFree(me.x + dirSign * 0.1, me.y + s * off) : boxFree(me.x + s * off, me.y + dirSign * 0.1)) {
        const step = Math.min(sp, off) * s;
        if (axis === 'y' ? boxFree(me.x, me.y + step) : boxFree(me.x + step, me.y)) { if (axis === 'y') me.y += step; else me.x += step; return true; }
      }
    }
    return false;
  };
  const nx = me.x + (ix / (Math.hypot(ix, iy) || 1)) * sp, ny = me.y + (iy / (Math.hypot(ix, iy) || 1)) * sp;
  if (boxFree(nx, me.y)) me.x = nx; else if (Math.abs(iy) < 0.3) nudge('y', ix > 0 ? 1 : -1);
  if (boxFree(me.x, ny)) me.y = ny; else if (Math.abs(ix) < 0.3) nudge('x', iy > 0 ? 1 : -1);
}
const rot = ([dx, dy], deg) => { const r = (deg * Math.PI) / 180; return [dx * Math.cos(r) - dy * Math.sin(r), dx * Math.sin(r) + dy * Math.cos(r)]; };

// 1マス はばの 道の L の かど（P）: a の ほうから 入って、b の ほうへ まがる。8とおり
//   #####
//   #...#   … まん中の 十字の うち 2本だけ あける
const L = (a, b) => {
  const rows = Array.from({ length: 7 }, () => Array(7).fill('#'));
  for (const d of [a, b]) for (let k = 0; k <= 3; k++) rows[3 + d[1] * k][3 + d[0] * k] = '.';
  return rows.map((r) => r.join(''));
};
const D4 = [[0, -1], [1, 0], [0, 1], [-1, 0]];
// P に 入りぐあい f まで 入って から、b の 向き（ずれ deg）に steps フレーム。まがれたら true
function turn(step, a, b, f, deg, steps = 75) {
  const { boxFree } = grid(L(a, b));
  const me = { x: 3 + a[0] * 2 + 0.5, y: 3 + a[1] * 2 + 0.5 };
  const d1 = [-a[0], -a[1]];
  for (let k = 0; k < 200; k++) {
    const fr = d1[0] ? (d1[0] > 0 ? me.x - 3 : 4 - me.x) : (d1[1] > 0 ? me.y - 3 : 4 - me.y);
    if (Math.floor(me.x) === 3 && Math.floor(me.y) === 3 && fr >= f) break;
    step(boxFree, me, d1[0], d1[1], SP);
  }
  const [ix, iy] = rot(b, deg);
  for (let k = 0; k < steps; k++) {
    step(boxFree, me, ix, iy, SP);
    assert.ok(boxFree(me.x, me.y), 'かべに 入らない');
  }
  return (Math.floor(me.x) - 3) * b[0] + (Math.floor(me.y) - 3) * b[1] >= 1;
}

test('かど: 左右へ まがる 時も 上下へ まがる 時も、ななめ ±25° まで かどに 入れる（前の 歩き方では まがれない 時が あった）', () => {
  const fails = [], oldFails = { h: 0, v: 0 };
  for (const a of D4) for (const b of D4) {
    if (a[0] * b[0] + a[1] * b[1] !== 0) continue;
    for (const f of [0.3, 0.6, 0.97]) for (const deg of [-25, -15, -5, 0, 5, 15, 25]) {
      if (!turn(walkStep, a, b, f, deg)) fails.push(`${a}→${b} f${f} ${deg}°`);
      if (!turn(oldStep, a, b, f, deg)) oldFails[b[0] ? 'h' : 'v']++;
    }
  }
  assert.deepEqual(fails, []);
  // 前の 歩き方では まがれない 時が あった（ゲームの マップ ぜんぶ では 左右へ まがる 方が ずっと 多い。docs/plan-r102-corner-slide.md）
  assert.ok(oldFails.h + oldFails.v > 0, JSON.stringify(oldFails));
});

test('かど: 左右へ まっすぐ 押した 時の すりぬけが、同じ フレームの たての いどうで もとに もどらない（上下と 同じ）', () => {
  // 上から 来て P(3,3) に 少し 入った 所で、右へ まっすぐ（たての 入力 0）
  const { boxFree } = grid(L([0, -1], [1, 0]));
  const me = { x: 3.7, y: 3.1 };
  assert.ok(boxFree(me.x, me.y) && !boxFree(me.x + SP, me.y), '右は ふさがって いる');
  const o = { ...me };
  oldStep(boxFree, o, 1, 0, SP);
  assert.equal(o.y, me.y, '前は もとに もどった');
  walkStep(boxFree, me, 1, 0, SP);
  assert.ok(me.y > 3.1 + SP * 0.99, 'すりぬけた ぶん 下へ');
  // 上下の 時と 同じ 大きさ（横向きに した かど）
  const g2 = grid(L([-1, 0], [0, 1]));
  const m2 = { x: 3.15, y: 3.9 }; // 左から 来て 少し 入った 所（下は ふさがって いる）
  assert.ok(!g2.boxFree(m2.x, m2.y + SP));
  walkStep(g2.boxFree, m2, 0, 1, SP);
  assert.ok(Math.abs((me.y - 3.1) - (m2.x - 3.15)) < 1e-9, '左右と 上下で 同じ 大きさ');
});

test('すべりすぎない: 止まって いる・すりぬけの はば（0.35）より 遠い 道・まっすぐ かべ・ななめ 45° は 動かない', () => {
  const { boxFree } = grid(L([0, -1], [1, 0]));
  // 入力 0
  const me = { x: 3.5, y: 3.1 };
  assert.equal(walkStep(boxFree, me, 0, 0, SP), true); // その場（前と 同じ）
  assert.deepEqual(me, { x: 3.5, y: 3.1 });
  // 上の 道の まん中（y 2.5）で 右へ: 右の 道（y 3.3〜3.92）まで 0.8 … すりぬけない
  const far = { x: 3.7, y: 2.5 };
  assert.ok(!boxFree(far.x + SP, far.y));
  walkStep(boxFree, far, 1, 0, SP);
  assert.deepEqual(far, { x: 3.7, y: 2.5 });
  // ななめ 45°（キーの 右下）で かべの かどに 押しつけて いる時は、前と 同じ
  for (const [ix, iy] of [[0.7071, 0.7071], [0.7071, -0.7071], [-0.7071, 0.7071]]) {
    const a = { x: 3.5, y: 3.1 }, b = { ...a };
    walkStep(boxFree, a, ix, iy, SP);
    oldStep(boxFree, b, ix, iy, SP);
    assert.deepEqual(a, b, `${ix},${iy}`);
  }
  // ずれが 30° より 大きい 時は すりぬけない
  assert.equal(nudgeOk(1, 0.5), true);
  assert.equal(nudgeOk(1, 0.6), false);
  assert.equal(nudgeOk(0.2, 0.25), true, '小さな 入力（前から）');
});

test('速さ・かべ: ひろい 所では 前と まったく 同じ・ランダムな 所と 入力で かべに 入らない・1フレームの いどうは 前より 大きく ならない', () => {
  let seed = 7;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const rows = ['##########', '#........#', '#..#..##.#', '#..#...#.#', '#.....#..#', '#.##.....#', '#........#', '##########'];
  const { boxFree } = grid(rows);
  let diff = 0;
  for (let i = 0; i < 20000; i++) {
    const x = 1 + rnd() * 8, y = 1 + rnd() * 6;
    if (!boxFree(x, y)) continue;
    const ang = rnd() * Math.PI * 2, mag = rnd() < 0.3 ? 0.35 : 1;
    const ix = Math.cos(ang) * mag, iy = Math.sin(ang) * mag, sp = SP * (rnd() < 0.5 ? 1.35 : 1);
    const a = { x, y }, b = { x, y };
    walkStep(boxFree, a, ix, iy, sp);
    oldStep(boxFree, b, ix, iy, sp);
    assert.ok(boxFree(a.x, a.y), 'かべに 入らない');
    const free = boxFree(x + (ix / Math.hypot(ix, iy)) * sp, y) && boxFree(x, y + (iy / Math.hypot(ix, iy)) * sp) && boxFree(x + (ix / Math.hypot(ix, iy)) * sp, y + (iy / Math.hypot(ix, iy)) * sp);
    if (free) assert.deepEqual(a, b, 'ひろい 所は 前と 同じ');
    // 1フレームの いどう: 前の 歩き方の いちばん 大きい（すすむ ＋ すりぬけ）を こえない
    assert.ok(Math.hypot(a.x - x, a.y - y) <= sp * 2 + 1e-9);
    if (a.x !== b.x || a.y !== b.y) diff++;
  }
  assert.ok(diff > 0);
});

test('nudgeStep: 左右 どちらにも ずれられる 時は スティックの 横の ずれの ほうが 先（まっすぐ なら 前と 同じ ＋ が 先）・0.35 より 遠い 口へは ずれない', () => {
  // 下へ 進む。(2,3) の 口だけ あいて いる。口の 左はし（x 2.28）から 0.2 と 0.35 の 所に いる 時
  const g = grid(['#####', '#...#', '#...#', '##.##', '#####']);
  const left = { x: 2.28 - 0.3, y: 2.9 };
  assert.equal(nudgeStep(g.boxFree, 'x', left, 1, SP), true, '0.35 いない … 右へ');
  assert.ok(left.x > 1.98);
  const far = { x: 2.28 - 0.5, y: 2.9 };
  assert.equal(nudgeStep(g.boxFree, 'x', far, 1, SP), false, '0.5 … ずれない');
  // 1マス はばの かべ（(3,3)）を はさむ 2つの 口の まん中では、どちらへも ずれない
  const g3 = grid(['#######', '#.....#', '#.....#', '##.#.##', '#######']);
  const mid = { x: 3.5, y: 2.9 }; // (3,3) の かべの 上。左の 口（2,3）へは 右はし 2.72 まで 0.78、右の 口（4,3）へも 0.78 … とどかない
  assert.equal(nudgeStep(g3.boxFree, 'x', { ...mid }, 1, SP), false);
  // pref の 順番（boxFree が いつも 入れる → 先に ためした 向きへ ずれる）
  const any = () => true;
  const p0 = { x: 5, y: 5 }; nudgeStep(any, 'x', p0, 1, SP); assert.ok(p0.x > 5, 'pref 0 … ＋ が 先（前と 同じ）');
  const p1 = { x: 5, y: 5 }; nudgeStep(any, 'x', p1, 1, SP, -1); assert.ok(p1.x < 5, 'pref −1 … − が 先');
  const p2 = { x: 5, y: 5 }; nudgeStep(any, 'y', p2, 1, SP, 1); assert.ok(p2.y > 5 && p2.x === 5);
});

test('1マス はばの 口（戸・出入り口）: スティックが ±20° ずれて いても 入れる・おそい スマホ（1フレーム 33・50ミリびょう）でも 口を すぎて すべらない', () => {
  // 下の かべに 1マスの 口（3,4）。2マス 上（3,2）から 下へ
  const rows = ['#######', '#.....#', '#.....#', '#.....#', '###.###', '###.###', '#######'];
  const { boxFree } = grid(rows);
  const oldFail = [];
  for (const dt of [0.016, 0.033, 0.05]) for (const deg of [-20, -10, 0, 10, 20]) {
    const sp = 4.6 * dt;
    const [ix, iy] = rot([0, 1], deg);
    const run = (step) => {
      const me = { x: 3.5, y: 2.5 };
      for (let k = 0; k < Math.round(1.5 / dt); k++) { step(boxFree, me, ix, iy, sp); assert.ok(boxFree(me.x, me.y)); if (Math.floor(me.y) === 4) return true; }
      return false;
    };
    assert.ok(run(walkStep), `dt ${dt} ${deg}°`);
    if (!run(oldStep)) oldFail.push(`${dt} ${deg}`);
  }
  // 前の 歩き方は 20° ずれると 入れなかった
  assert.ok(oldFail.includes('0.016 20') && oldFail.includes('0.016 -20'), oldFail.join(','));
});

test('ゲームの マップ ぜんぶ: 1マス はばの 道の L の かどで、ななめ ±25° まで まがれる（入りぐあい 0.3・0.6・0.97）', () => {
  const fails = [];
  let n = 0;
  for (const id of Object.keys(MAPS)) {
    const m = MAPS[id];
    if (!m?.w) continue;
    const solid = (tx, ty) => tx < 0 || ty < 0 || tx >= m.w || ty >= m.h || isBlocked(m, tx, ty, ALL) || !!m.chestAt?.has(ty * m.w + tx);
    const ok = (x, y) => !solid(x, y);
    const boxFree = (x, y) => [[x - BODY.hw, y - BODY.top], [x + BODY.hw, y - BODY.top], [x - BODY.hw, y + BODY.bot], [x + BODY.hw, y + BODY.bot]].every(([px, py]) => !solid(Math.floor(px), Math.floor(py)));
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      if (!ok(x, y)) continue;
      const nb = D4.filter(([dx, dy]) => ok(x + dx, y + dy));
      for (const a of nb) for (const b of nb) {
        if (a[0] * b[0] + a[1] * b[1] !== 0 || ok(x - a[0], y - a[1])) continue; // L の かど（まっすぐ 先は かべ）
        const narrow = (d) => !ok(x + d[0] - d[1], y + d[1] + d[0]) && !ok(x + d[0] + d[1], y + d[1] - d[0]);
        if (!narrow(a) || !narrow(b)) continue;
        for (const f of [0.3, 0.6, 0.97]) for (const deg of [-25, 0, 25]) {
          const me = { x: x + a[0] + 0.5, y: y + a[1] + 0.5 };
          if (!boxFree(me.x, me.y)) continue;
          for (let k = 0; k < 200; k++) {
            const fr = a[0] ? (a[0] < 0 ? me.x - x : x + 1 - me.x) : (a[1] < 0 ? me.y - y : y + 1 - me.y);
            if (Math.floor(me.x) === x && Math.floor(me.y) === y && fr >= f) break;
            walkStep(boxFree, me, -a[0], -a[1], SP);
          }
          const [ix, iy] = rot(b, deg);
          for (let k = 0; k < 75; k++) walkStep(boxFree, me, ix, iy, SP);
          n++;
          if (!boxFree(me.x, me.y)) fails.push(`かべ ${id} ${x},${y}`);
          if ((Math.floor(me.x) - x) * b[0] + (Math.floor(me.y) - y) * b[1] < 1) fails.push(`${id} ${x},${y} ${a}→${b} f${f} ${deg}°`);
        }
      }
    }
  }
  assert.ok(n > 5000, `かどの 数 ${n}`);
  assert.deepEqual(fails.slice(0, 20), []);
});

test('field.js: 歩く 行は walk.js を 使う（大鳥は sky.js のまま）・漢字と スペース', () => {
  const src = readFileSync(new URL('../public/js/client/field.js', import.meta.url), 'utf8');
  assert.match(src, /import \{ walkStep, nudgeStep \} from '\.\/walk\.js';/);
  assert.match(src, /moved = sky\.flyStep\(me, nx, ny, iy, dt\);/);
  assert.match(src, /else moved = walkStep\(\(x, y\) => this\.boxFree\(x, y\), me, ix, iy, sp\);/);
  assert.doesNotMatch(src, /Math\.abs\(iy\) < 0\.3\) moved = this\.nudge/, '前の 行は のこって いない');
  for (const f of ['public/js/client/walk.js', 'public/js/client/field.js', 'public/js/client/c11b-view.js']) {
    const res = checkFile(new URL(`../${f}`, import.meta.url).pathname).filter((x) => x.kind !== 'kana');
    assert.deepEqual(res, [], `${f} の 漢字・スペース`);
  }
});
