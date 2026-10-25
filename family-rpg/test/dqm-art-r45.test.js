// 第45回: ドラクエふう（配合だけの 第2だん 11しゅるい）の え（render/dqm-art.js）と 技の エフェクト（render/battlefx-dqm.js・sfx-dqm.js）
// ・データ（MONSTERS・技）は べつの ファイルで ふえる ので、ここでは え と エフェクトを ちょくせつ しらべる（データが あれば つながりも しらべる）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { addDqmArt, DQM_ART_IDS, DQM_BIG } from '../public/js/client/render/dqm-art.js';
import { Effects, BW, BH } from '../public/js/client/render/battlefx.js';
import { DQ_ANIMS, DQ_HIT, DQ_SFX, DQ_ALLY_FX, DQ_FINE, playDqmFx } from '../public/js/client/render/battlefx-dqm.js';
import { PK_ANIMS, PK_FINE } from '../public/js/client/render/battlefx-pokemon.js';
import { SFX_DQ } from '../public/js/client/sfx-dqm.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';

const SPECIES = ['queen_pururin', 'gold_pururin', 'rose_queen', 'yggdra_child', 'lantern_ghost', 'skeleton_king', 'koyomi_spirit', 'killer_karakuri', 'hitokui_box', 'petit_devil', 'ryuou_grandson'];
const ANIMS = ['dq_gold_rain', 'dq_rose_storm', 'dq_world_tree', 'dq_lantern', 'dq_bone_king', 'dq_seasons', 'dq_killer_slash', 'dq_chomp', 'dq_dragon_lord'];
const BIG = ['yggdra_child', 'skeleton_king', 'koyomi_spirit', 'ryuou_grandson'];

const src = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

// monsters.js の かく ための どうぐ（G）の かわり: つかった いろ・はみだし・よばれた かずを しらべる
function stubG(w, h) {
  const colors = new Set();
  const pts = [];
  let calls = 0;
  const num = (...a) => a.forEach((v) => assert.ok(Number.isFinite(v), 'かずが NaN'));
  const g = {
    w, h,
    ell(cx, cy, rx, ry, c, rot = 0) {
      calls++;
      num(cx, cy, rx, ry, rot);
      colors.add(c);
      const a = rx * w, b = ry * h, co = Math.cos(rot), si = Math.sin(rot);
      const ex = Math.hypot(a * co, b * si) / w, ey = Math.hypot(a * si, b * co) / h;
      pts.push([cx - ex, cy - ey], [cx + ex, cy + ey]);
    },
    poly(p, c) { calls++; colors.add(c); for (const q of p) { num(...q); pts.push(q); } },
    rect(x, y, rw, rh, c) { calls++; num(x, y, rw, rh); colors.add(c); pts.push([x, y], [x + rw, y + rh]); },
    line(p, c, lw = 1) {
      calls++;
      colors.add(c);
      for (const [x, y] of p) { num(x, y, lw); pts.push([x - lw / 2 / w, y - lw / 2 / h], [x + lw / 2 / w, y + lw / 2 / h]); }
    },
    eye(cx, cy, r, look = 0, white = '#ffffff', pupil = '#1a1026') { calls++; num(cx, cy, r); colors.add(white); colors.add(pupil); colors.add('#ffffff'); pts.push([cx - r, cy - r], [cx + r, cy + r]); },
    dot(x, y, c) { calls++; colors.add(c); pts.push([x, y]); },
  };
  return { g, colors, pts, get calls() { return calls; } };
}
const outside = (pts, w, h, extra = 1.2) => pts.filter(([x, y]) => x < -(1 + extra) / w || x > 1 + (1 + extra) / w || y < -(1 + extra) / h || y > 1 + (1 + extra) / h);

test('第45回 ドラクエふうの え: 11しゅるい ぜんぶ ある（id は データの id と おなじ。addDqmArt だけでも そろう）', () => {
  assert.deepEqual([...DQM_ART_IDS].sort(), [...SPECIES].sort());
  assert.deepEqual([...DQM_BIG].sort(), [...BIG].sort());
  const art = {};
  addDqmArt(art);
  assert.deepEqual(Object.keys(art).sort(), [...SPECIES].sort());
  for (const id of SPECIES) {
    const d = MONSTER_ART[id];
    assert.ok(d, `${id} の え が monsters.js に とうろく されている`);
    assert.equal(d.draw, art[id].draw, `${id}: addDqmArt の え`);
    assert.ok(Array.isArray(d.size) && d.size.length === 2 && d.size.every((v) => Number.isInteger(v) && v >= 24 && v <= 80), `${id}: size`);
    assert.ok(Array.isArray(d.pal) && d.pal.length >= 4 && d.pal.every((c) => /^#[0-9a-f]{6}$/.test(c)), `${id}: pal`);
    assert.equal(new Set(d.pal).size, d.pal.length, `${id}: pal に おなじ いろが ない`);
    assert.equal(typeof d.draw, 'function', `${id}: draw`);
    if (d.field !== undefined) assert.ok(d.field >= 20 && d.field <= 32, `${id}: field`);
    assert.equal(d.npc, undefined, `${id}: ふつうの NPC の 大きさ`);
  }
});

test('第45回 ドラクエふうの え: 2コマ とも かける（いろは パレットの 中・はみだしなし・コマ0 と コマ1 が ちがう）', () => {
  for (const id of SPECIES) {
    const d = MONSTER_ART[id];
    const [w, h] = d.size;
    const pal = new Set(d.pal);
    const sig = [];
    for (const f of [0, 1]) {
      const s = stubG(w, h);
      assert.doesNotThrow(() => d.draw(s.g, f), `${id} コマ${f}`);
      assert.ok(s.calls >= 20, `${id} コマ${f}: ちゃんと かいている（${s.calls}）`);
      const off = [...s.colors].filter((c) => !pal.has(c.toLowerCase()));
      assert.deepEqual(off, [], `${id} コマ${f}: パレットに ない いろ`);
      const out = outside(s.pts, w, h);
      assert.deepEqual(out.slice(0, 3), [], `${id} コマ${f}: え から はみだす`);
      sig.push(JSON.stringify(s.pts));
    }
    assert.notEqual(sig[0], sig[1], `${id}: コマ1 は こうげきの ポーズ`);
    const sm = stubG(16, 16);
    assert.doesNotThrow(() => d.draw(sm.g, 1), `${id} 小さい え`);
  }
});

test('第45回 ドラクエふうの え: S ランクは 大きな 魔物の 大きさ・ぷるりんの なかまは ぷるりんと おなじ くらい', () => {
  const area = (id) => MONSTER_ART[id].size[0] * MONSTER_ART[id].size[1];
  for (const id of BIG) {
    const [w, h] = MONSTER_ART[id].size;
    assert.ok(Math.max(w, h) >= 56, `${id}: 大きい（${w}×${h}）`);
    assert.ok(MONSTER_ART[id].field >= 25, `${id}: フィールドでも すこし 大きく`);
    for (const s of SPECIES.filter((x) => !BIG.includes(x))) assert.ok(area(id) > area(s), `${id} は ${s} より 大きい`);
  }
  // ぷるりんクイーンは キングぷるりんと おなじ くらい、ゴールドは ふつうの ぷるりんより すこし 大きい くらい
  assert.ok(Math.abs(area('queen_pururin') - area('king_pururin')) <= 200, 'クイーン ≒ キング');
  assert.ok(area('gold_pururin') >= area('pururin') && area('gold_pururin') < area('queen_pururin'), 'ゴールド');
  assert.ok(Math.max(...MONSTER_ART.petit_devil.size) <= 30, 'プチデビは 小さい');
});

test('第45回 ドラクエふうの え: データに あれば その え が つかわれる（データが まだ なければ とばす）', (t) => {
  const have = SPECIES.filter((id) => MONSTERS[id]);
  if (!have.length) { t.skip('MONSTERS に まだ ドラクエふうの 魔物が ない'); return; }
  for (const id of have) {
    assert.ok(!MONSTERS[id].art || MONSTER_ART[MONSTERS[id].art], `${id}: art`);
    assert.ok(MONSTER_ART[id], `${id}: え`);
  }
});

// ───── エフェクト ─────
function fakeCtx() {
  const log = { calls: 0, nan: [], neg: [] };
  let ctx;
  const fn = (name) => (...args) => {
    log.calls++;
    if (args.some((a) => typeof a === 'number' && !Number.isFinite(a))) log.nan.push(name);
    if ((name === 'arc' && args[2] < 0) || (name === 'ellipse' && (args[2] < 0 || args[3] < 0))) log.neg.push(name);
    if (name === 'createRadialGradient' && (args[2] < 0 || args[5] < 0)) log.neg.push(name);
    return ctx;
  };
  ctx = new Proxy({}, {
    get: (o, k) => (k in o ? o[k] : typeof k === 'string' ? fn(k) : undefined),
    set: (o, k, v) => { if (typeof v === 'number' && !Number.isFinite(v)) log.nan.push(String(k)); o[k] = v; return true; },
  });
  return { ctx, log };
}
function runFx(fx, limit = 4000) {
  const { ctx, log } = fakeCtx();
  let t = 0;
  while ((fx.parts.length || fx.bolts.length) && t < limit) {
    fx.update(16);
    t += 16;
    fx.draw(ctx);
  }
  return { t, log };
}
const ONE = [{ x: 128, y: 66 }];
const THREE = [{ x: 60, y: 70 }, { x: 128, y: 82 }, { x: 196, y: 70 }];
const FIVE = [{ x: 30, y: 60 }, { x: 80, y: 74 }, { x: 128, y: 66 }, { x: 176, y: 74 }, { x: 226, y: 60 }];
const ALLY1 = [{ x: BW / 2, y: BH - 22 }];
const ALLY4 = [0, 1, 2, 3].map((i) => ({ x: BW / 2 + (i - 1.5) * 58, y: BH - 22 }));
const CASES = [
  ['味方 → 敵1体', ONE, { fromAlly: true, from: ALLY4[1] }],
  ['味方 → 敵3体（会心）', THREE, { fromAlly: true, from: ALLY4[2], crit: true }],
  ['味方 → 敵5体', FIVE, { fromAlly: true, from: ALLY4[0] }],
  ['出どころ なし', THREE, {}],
  ['敵 → 1人', ALLY1, { fromAlly: false, from: { x: 128, y: 80 } }],
  ['敵 → みんな', ALLY4, { fromAlly: false, from: { x: 40, y: 64 } }],
  // せかいじゅの子: 味方が みんなに かける（battle.js は 出どころを 味方の いちに して よぶ）
  ['味方 → みんな（回復）', ALLY4, { fromAlly: false, from: ALLY4[3] }],
];

test('第45回 ドラクエふうの 技: 9この えんしゅつ・あたる じかん・音・みかたの まどの えんしゅつが そろう', () => {
  assert.deepEqual([...DQ_ANIMS].sort(), [...ANIMS].sort());
  for (const a of ANIMS) {
    assert.ok(Number.isFinite(DQ_HIT[a]) && DQ_HIT[a] > 0 && DQ_HIT[a] <= 900, `${a}: あたる じかん`);
    assert.equal(typeof SFX_DQ[DQ_SFX[a]], 'function', `${a}: 音`);
    assert.ok(['bolt', 'claw', 'fire', 'ice', 'wind', 'dark', 'quake', 'heal'].includes(DQ_ALLY_FX[a]), `${a}: みかたの まど`);
    assert.ok(!PK_ANIMS.has(a), `${a}: ポケモンの 技と かぶらない`);
  }
  assert.equal(DQ_ALLY_FX.dq_world_tree, 'heal', 'せかいじゅは 回復の まど');
  // つぶの 名前が ポケモンの つぶと かぶらない
  for (const k of Object.keys(DQ_FINE)) { assert.match(k, /^dq[A-Z]/); assert.ok(!(k in PK_FINE), k); }
  const calls = [];
  const a = { tone: (...x) => calls.push(x), noise: (...x) => calls.push(x) };
  for (const id of ANIMS) {
    const n = calls.length;
    SFX_DQ[id](a, (...x) => a.tone(...x));
    assert.ok(calls.length > n, `${id}: 音が なる`);
    // おそすぎない（2びょう いない）
    for (const c of calls.slice(n)) assert.ok(((c[c.length - 1] && c[c.length - 1].delay) || 0) < 2, `${id}: 音の おくれ`);
  }
  const fake = new Proxy({}, { get: () => () => undefined });
  assert.equal(playDqmFx(fake, 'fire1', ONE, null, {}), false);
  assert.equal(playDqmFx(fake, 'pk_spark', ONE, null, {}), false);
  assert.equal(playDqmFx(fake, 'dq_chomp', [], null, {}), false);
});

test('第45回 ドラクエふうの 技: 敵1体・敵ぜんたい・みんな（敵が つかう・回復）の どれでも こわれない・2びょう いないで おわる', () => {
  const sprite = fakeCtx();
  const had = 'document' in globalThis, prev = globalThis.document;
  globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => sprite.ctx }) };
  try {
    for (const anim of ANIMS) {
      for (const [name, ts, opts] of CASES) {
        const fx = new Effects();
        fx.play(anim, ts, null, opts);
        assert.ok(fx.parts.length > 0, `${anim} ${name}: エフェクトが 出る`);
        for (const p of fx.parts) if (/^dq[A-Z]/.test(p.kind || '')) assert.equal(typeof DQ_FINE[p.kind], 'function', p.kind);
        assert.ok(fx.parts.some((p) => /^dq[A-Z]/.test(p.kind || '')), `${anim} ${name}: ドラクエふうの 技の え`);
        // 出る ところは がめんの 中（あいての まわり）
        for (const p of fx.parts) for (const k of ['x', 'y', 'x1', 'y1', 'cx', 'cy']) if (Number.isFinite(p[k])) assert.ok(p[k] > -40 && p[k] < (k.startsWith('x') || k === 'cx' ? BW : BH) + 40, `${anim} ${name}: ${p.kind}.${k}=${p[k]}`);
        const { t, log } = runFx(fx);
        assert.deepEqual(log.nan, [], `${anim} ${name}: NaN`);
        assert.deepEqual(log.neg, [], `${anim} ${name}: マイナスの 半径`);
        assert.ok(t <= 2000, `${anim} ${name}: ${t}ms（2びょう まで）`);
        assert.ok(t >= DQ_HIT[anim], `${anim} ${name}: あたる 前に おわらない`);
      }
    }
  } finally { if (had) globalThis.document = prev; else delete globalThis.document; }
});

test('第45回 ドラクエふうの 技: 竜王のまごの 竜は むきで 出る ところが かわる（味方 → がめんの 下・敵 → 敵の うしろ）', () => {
  const dragon = (ts, opts) => {
    const fx = new Effects();
    fx.play('dq_dragon_lord', ts, null, opts);
    return fx.parts.find((p) => p.kind === 'dqDragon');
  };
  const mine = dragon(THREE, { fromAlly: true, from: ALLY4[1] });
  assert.ok(mine.back && mine.y > BH / 2, '味方が つかう: がめんの 下に うしろすがた');
  const foe = dragon(ALLY4, { fromAlly: false, from: { x: 128, y: 80 } });
  assert.ok(!foe.back && foe.y < BH / 2, '敵が つかう: 敵の うしろに まえむき');
  // ほのおは 竜の 口から みんなへ
  const fx = new Effects();
  fx.play('dq_dragon_lord', ALLY4, null, { fromAlly: false, from: { x: 128, y: 80 } });
  assert.equal(fx.parts.filter((p) => p.kind === 'dqBreath').length, 4);
});

test('第45回 ドラクエふうの 技: battle.js・battlefx.js・audio.js に つながっている', () => {
  const fxSrc = src('../public/js/client/render/battlefx.js');
  assert.match(fxSrc, /if \(playDqmFx\(this, anim, targets, element, opts, BW, BH\)\) return;/);
  assert.match(fxSrc, /Object\.assign\(FINE, DQ_FINE\)/);
  const b = src('../public/js/client/battle.js');
  assert.match(b, /Object\.assign\(HIT_DELAY, DQ_HIT\)/);
  assert.match(b, /\.\.\.DQ_SFX/);
  assert.match(b, /DQ_ALLY_FX\[anim\]/);
  // 敵が みんなに つかう ときも、味方を 回復する ときも、みんなの いちに 出す
  assert.match(b, /DQ_ANIMS\.has\(anim\)/);
  assert.match(src('../public/js/client/audio.js'), /SFX_DQ\[id\]\(this, T\)/);
  // データに ドラクエふうの 技（anim が dq_…）が あれば、どれも ここに ある（データが まだ なければ なにも しない）
  for (const [id, ab] of Object.entries(ABILITIES)) if (/^dq_/.test(ab.anim || '')) assert.ok(DQ_ANIMS.has(ab.anim), `${id}: ${ab.anim}`);
});
