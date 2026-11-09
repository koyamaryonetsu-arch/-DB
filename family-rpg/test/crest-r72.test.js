// 第72回: 竜の紋章・ロトの紋章の かたち（家族の ことば「ロトの紋章と、ドラゴンの騎士のロゴは、もっと原作に忠実に再現して」）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DRAGON_PARTS, ROTO_PARTS, ROTO_SIL, DRAGON_STAMP, drawDragonCrest, drawRotoCrest, crestSimple } from '../public/js/client/render/crest-shapes.js';
import { AX_G4_FINE } from '../public/js/client/render/axfx-g4-fine.js';
import { JOB8_FINE } from '../public/js/client/render/battlefx-jobs8.js';
import { paintHero } from '../public/js/client/render/hero.js';

const src = (f) => readFileSync(new URL(`../public/js/client/render/${f}`, import.meta.url), 'utf8');
const all = (pts) => pts.every(([a, b]) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= 1.1 && Math.abs(b) <= 1.1);
const box = (list) => {
  const p = list.flat();
  return { x0: Math.min(...p.map((q) => q[0])), x1: Math.max(...p.map((q) => q[0])), y0: Math.min(...p.map((q) => q[1])), y1: Math.max(...p.map((q) => q[1])) };
};

// なにも かかない キャンバス（よばれた かずを 数える）
function mockCtx() {
  const n = { fill: 0, stroke: 0, arc: 0 };
  const x = new Proxy({}, {
    get(t, k) {
      if (k === 'n') return n;
      if (k in t) return t[k];
      if (k === 'fill' || k === 'stroke' || k === 'arc') return () => { n[k]++; };
      if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => ({ addColorStop() {} });
      return () => {};
    },
    set(t, k, v) { t[k] = v; return true; },
  });
  return x;
}

test('竜の紋章: まん中の たての ひし形（下が 長い）・左右 たいしょうの つの・つばさ・かぎ', () => {
  const P = DRAGON_PARTS;
  for (const pts of [P.gem, ...P.horns, ...P.wings, ...P.barbs]) assert.ok(all(pts));
  const g = box([P.gem]);
  assert.ok(g.y1 > -g.y0 * 1.4, 'ひし形は 下に 長く とがる');
  assert.ok(g.x1 < 0.3, 'ひし形は ほそい');
  // つのは 上へ（ひし形より 上）、つばさは よこへ いちばん 外まで
  const h = box(P.horns), w = box(P.wings);
  assert.ok(h.y0 < g.y0 - 0.3, 'つのは ひし形より 上まで そり上がる');
  assert.ok(w.x1 >= 0.95 && w.x0 <= -0.95, 'つばさは 左右に のびる');
  // 左右 たいしょう
  for (const [r, l] of [P.horns, P.wings, P.barbs]) r.forEach(([a, b], i) => assert.deepEqual(l[i], [-a, b]));
});

test('ロトの紋章: 上に ひろげた つばさ（4まいの はね）・てっぺんの あたま・3つの しっぽ・赤い 石', () => {
  const P = ROTO_PARTS;
  for (const pts of [...P.wings, P.body, ...P.tail, P.plume]) assert.ok(all(pts));
  const w = box(P.wings);
  assert.ok(w.y0 < -0.9, 'つばさの 先は 上');
  assert.ok(w.x1 > 1 && w.x0 < -1, 'つばさは 大きく ひろがる');
  // 右の つばさの はねの 先（とがり）は 4つ（上に むく）
  const R = P.wings[0];
  const tips = R.filter((p, i) => i > 0 && i < R.length - 1 && p[1] < R[i - 1][1] && p[1] < R[i + 1][1]);
  assert.equal(tips.length, 4, JSON.stringify(tips));
  assert.equal(P.tail.length, 3, 'しっぽは 3まい');
  assert.ok(box(P.tail).y1 >= 0.99, 'しっぽは 下の まん中で とがる');
  assert.ok(all(ROTO_SIL) && ROTO_SIL.length > 30);
  assert.match(src('crest-shapes.js'), /#e8303a/, 'むねの 赤い 石');
});

test('かく: 大きい ときは こまかく・小さい ときは シルエット（ふちどり なし）', () => {
  assert.ok(crestSimple(4) && !crestSimple(12));
  for (const fn of [drawDragonCrest, drawRotoCrest]) {
    const big = mockCtx(), small = mockCtx();
    fn(big, { a: 1 });
    fn(small, { a: 1, simple: true });
    assert.ok(big.n.fill > small.n.fill, 'こまかい 部分');
    assert.equal(small.n.stroke, 0, '小さい ときは ふちどり なし');
    assert.ok(big.n.stroke > 0);
  }
});

test('エフェクト: g4Crest・g4Loto・j8crest が 新しい かたちで かける', () => {
  for (const s of [3, 7, 15, 30]) {
    const x = mockCtx();
    AX_G4_FINE.g4Crest(x, { x: 10, y: 10, s, age: 500, life: 2000 });
    assert.ok(x.n.fill > 3);
    const y = mockCtx();
    AX_G4_FINE.g4Loto(y, { x: 10, y: 10, s, age: 500, life: 2000, flap: 0.2 });
    assert.ok(y.n.fill > 5);
  }
  const z = mockCtx();
  JOB8_FINE.j8crest(z, { x: 10, y: 10, s: 1, age: 300, life: 900 }, 0.3);
  assert.ok(z.n.fill > 3);
  for (const f of ['axfx-g4-fine.js', 'battlefx-jobs8.js', 'axkit.js', 'hero-r40.js', 'hero-outfit.js']) assert.match(src(f), /crest-shapes\.js/, f);
});

test('ドット: ひたいと 手の こうの 竜の紋章は 左右 たいしょうで、まん中に 赤', () => {
  for (const [k, rows] of Object.entries(DRAGON_STAMP)) {
    for (const r of rows) assert.equal(r, [...r].reverse().join(''), `${k}: ${r}`);
    assert.ok(rows.some((r) => /[Rr]/.test(r)), `${k} 赤`);
  }
  assert.equal(DRAGON_STAMP.big.length, 8);
  assert.equal(DRAGON_STAMP.big[0], 'K.......K', 'つのの 先');
  assert.equal(DRAGON_STAMP.big.at(-1), '....K....', '下の とがり');
});

test('主人公の え: 竜魔人・ロトの勇者が こわれずに かける（ドットの 数も ある）', () => {
  for (const job of ['ryumajin', 'loto_hero', 'dragon_knight']) {
    for (const res of [4, 10]) {
      const r = paintHero({ body: 0 }, job, undefined, 'down', 0, res);
      let n = 0;
      for (let i = 3; i < r.rgba.length; i += 4) if (r.rgba[i]) n++;
      assert.ok(n > 100, `${job} res${res}`);
    }
  }
});
