// 第44回: ポケモン（第1だん 19しゅるい）の え（render/pokemon-art.js）と 技の エフェクト（render/battlefx-pokemon.js・sfx-pokemon.js）
// ・データ（MONSTERS・技）は べつの ファイルで ふえる ので、ここでは え と エフェクトを ちょくせつ しらべる（データが あれば つながりも しらべる）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { addPokemonArt, POKEMON_ART_IDS } from '../public/js/client/render/pokemon-art.js';
import { Effects, BW, BH } from '../public/js/client/render/battlefx.js';
import { PK_ANIMS, PK_HIT, PK_SFX, PK_ALLY_FX, PK_FINE, playPokemonFx } from '../public/js/client/render/battlefx-pokemon.js';
import { SFX_PK } from '../public/js/client/sfx-pokemon.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';

const SPECIES = ['pikachu', 'raichu', 'charmander', 'charmeleon', 'charizard', 'squirtle', 'wartortle', 'blastoise', 'bulbasaur', 'ivysaur', 'venusaur', 'eevee', 'flareon', 'vaporeon', 'jolteon', 'umbreon', 'snorlax', 'gengar', 'mew'];
const ANIMS = ['pk_spark', 'pk_thunder', 'pk_quick', 'pk_ember', 'pk_flame', 'pk_water', 'pk_hydro', 'pk_leaf', 'pk_solar', 'pk_shadow', 'pk_psychic', 'pk_bodyslam'];
// しんかの すじ（あとの すがたほど 大きい）
const LINES = [['pikachu', 'raichu'], ['charmander', 'charmeleon', 'charizard'], ['squirtle', 'wartortle', 'blastoise'], ['bulbasaur', 'ivysaur', 'venusaur'], ...['flareon', 'vaporeon', 'jolteon', 'umbreon'].map((e) => ['eevee', e])];
const BIG = ['charizard', 'blastoise', 'venusaur', 'snorlax'];

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
      // まわした だ円の はば（ドットで けいさん）
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
    eye(cx, cy, r, look = 0, white = '#ffffff', pupil = '#1a1026') { calls++; colors.add(white); colors.add(pupil); colors.add('#ffffff'); pts.push([cx - r, cy - r], [cx + r, cy + r]); },
    dot(x, y, c) { calls++; colors.add(c); pts.push([x, y]); },
  };
  return { g, colors, pts, get calls() { return calls; } };
}
// え の まわりの よはく（1ドット）より 外に 大きく はみだすと きれて しまう
const outside = (pts, w, h, extra = 1.2) => pts.filter(([x, y]) => x < -(1 + extra) / w || x > 1 + (1 + extra) / w || y < -(1 + extra) / h || y > 1 + (1 + extra) / h);

test('第44回 ポケモンの え: 19しゅるい ぜんぶ ある（id は データの id と おなじ。addPokemonArt だけでも そろう）', () => {
  assert.deepEqual([...POKEMON_ART_IDS].sort(), [...SPECIES].sort());
  const art = {};
  addPokemonArt(art);
  assert.deepEqual(Object.keys(art).sort(), [...SPECIES].sort());
  for (const id of SPECIES) {
    const d = MONSTER_ART[id];
    assert.ok(d, `${id} の え が monsters.js に とうろく されている`);
    assert.equal(d.draw, art[id].draw, `${id}: addPokemonArt の え`);
    assert.ok(Array.isArray(d.size) && d.size.length === 2 && d.size.every((v) => Number.isInteger(v) && v >= 24 && v <= 80), `${id}: size`);
    assert.ok(Array.isArray(d.pal) && d.pal.length >= 4 && d.pal.every((c) => /^#[0-9a-f]{6}$/.test(c)), `${id}: pal`);
    assert.equal(new Set(d.pal).size, d.pal.length, `${id}: pal に おなじ いろが ない`);
    assert.equal(typeof d.draw, 'function', `${id}: draw`);
    if (d.field !== undefined) assert.ok(d.field >= 20 && d.field <= 32, `${id}: field`);
    assert.equal(d.npc, undefined, `${id}: ふつうの NPC の 大きさ`);
  }
});

test('第44回 ポケモンの え: 2コマ とも かける（いろは パレットの 中・はみだしなし・コマ0 と コマ1 が ちがう）', () => {
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
    // フィールドの 小さな え（20ドット）でも かける
    const sm = stubG(16, 16);
    assert.doesNotThrow(() => d.draw(sm.g, 1), `${id} 小さい え`);
  }
});

test('第44回 ポケモンの え: しんかするほど 大きい。リザードン・カメックス・フシギバナ・カビゴンは 大きな 魔物の 大きさ', () => {
  const area = (id) => MONSTER_ART[id].size[0] * MONSTER_ART[id].size[1];
  for (const line of LINES) for (let i = 1; i < line.length; i++) assert.ok(area(line[i]) > area(line[i - 1]), `${line[i - 1]} → ${line[i]}`);
  for (const id of BIG) {
    const [w, h] = MONSTER_ART[id].size;
    assert.ok(Math.max(w, h) >= 60, `${id}: 大きい（${w}×${h}）`);
    assert.ok(MONSTER_ART[id].field >= 26, `${id}: フィールドでも すこし 大きく`);
  }
  // 小さい ポケモンは ほかの 小さな 魔物と おなじ くらい
  for (const id of ['pikachu', 'charmander', 'squirtle', 'bulbasaur', 'eevee', 'mew']) assert.ok(Math.max(...MONSTER_ART[id].size) <= 36, `${id}: 小さい`);
});

test('第44回 ポケモンの え: データに ポケモンが あれば その え が つかわれる（データが まだ なければ とばす）', (t) => {
  const have = SPECIES.filter((id) => MONSTERS[id]);
  if (!have.length) { t.skip('MONSTERS に まだ ポケモンが ない'); return; }
  for (const id of have) {
    assert.ok(!MONSTERS[id].art || MONSTER_ART[MONSTERS[id].art], `${id}: art`);
    assert.ok(MONSTER_ART[id], `${id}: え`);
  }
});

// ───── エフェクト ─────
// たたかいの がめんに かく ための ブラウザの まね（よばれた かずと、NaN の かずを かぞえる）
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
const ALLY1 = [{ x: BW / 2, y: BH - 22 }];
const ALLY4 = [0, 1, 2, 3].map((i) => ({ x: BW / 2 + (i - 1.5) * 58, y: BH - 22 }));
const CASES = [
  ['味方 → 敵1体', ONE, { fromAlly: true, from: ALLY4[1] }],
  ['味方 → 敵3体（会心）', THREE, { fromAlly: true, from: ALLY4[2], crit: true }],
  ['出どころ なし', THREE, {}],
  ['敵 → 1人', ALLY1, { fromAlly: false, from: { x: 128, y: 80 } }],
  ['敵 → みんな', ALLY4, { fromAlly: false, from: { x: 128, y: 80 } }],
];

test('第44回 ポケモンの 技: 12この えんしゅつ・あたる じかん・音・みかたの まどの えんしゅつが そろう', () => {
  assert.deepEqual([...PK_ANIMS].sort(), [...ANIMS].sort());
  for (const a of ANIMS) {
    assert.ok(Number.isFinite(PK_HIT[a]) && PK_HIT[a] > 0 && PK_HIT[a] <= 900, `${a}: あたる じかん`);
    assert.equal(typeof SFX_PK[PK_SFX[a]], 'function', `${a}: 音`);
    assert.ok(['bolt', 'claw', 'fire', 'ice', 'wind', 'dark', 'quake'].includes(PK_ALLY_FX[a]), `${a}: みかたの まど`);
  }
  // 音を ならしても こわれない（Web Audio の まね）
  const calls = [];
  const a = { tone: (...x) => calls.push(x), noise: (...x) => calls.push(x) };
  for (const id of ANIMS) {
    const n = calls.length;
    SFX_PK[id](a, (...x) => a.tone(...x));
    assert.ok(calls.length > n, `${id}: 音が なる`);
  }
  // 知らない anim・あいて なしは ほかの ファイルに まかせる
  const fake = new Proxy({}, { get: () => () => undefined });
  assert.equal(playPokemonFx(fake, 'fire1', ONE, null, {}), false);
  assert.equal(playPokemonFx(fake, 'pk_spark', [], null, {}), false);
});

test('第44回 ポケモンの 技: 敵1体・敵ぜんたい・みんな（敵が つかう）の どれでも こわれない・2びょう いないで おわる', () => {
  const sprite = fakeCtx();
  const had = 'document' in globalThis, prev = globalThis.document;
  globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => sprite.ctx }) };
  try {
    for (const anim of ANIMS) {
      for (const [name, ts, opts] of CASES) {
        const fx = new Effects();
        fx.play(anim, ts, null, opts);
        assert.ok(fx.parts.length > 0, `${anim} ${name}: エフェクトが 出る`);
        // ポケモンの え の つぶは PK_FINE で かく
        for (const p of fx.parts) if (/^pk[A-Z]/.test(p.kind || '')) assert.equal(typeof PK_FINE[p.kind], 'function', p.kind);
        assert.ok(fx.parts.some((p) => /^pk[A-Z]/.test(p.kind || '')), `${anim} ${name}: ポケモンの 技の え`);
        const { t, log } = runFx(fx);
        assert.deepEqual(log.nan, [], `${anim} ${name}: NaN`);
        assert.deepEqual(log.neg, [], `${anim} ${name}: マイナスの 半径`);
        assert.ok(t <= 2000, `${anim} ${name}: ${t}ms（2びょう まで）`);
        assert.ok(t >= PK_HIT[anim], `${anim} ${name}: あたる 前に おわらない`);
      }
    }
  } finally { if (had) globalThis.document = prev; else delete globalThis.document; }
});

test('第44回 ポケモンの 技: battle.js・battlefx.js・audio.js に つながっている', () => {
  const fxSrc = src('../public/js/client/render/battlefx.js');
  assert.match(fxSrc, /if \(playPokemonFx\(this, anim, targets, element, opts, BW, BH\)\) return;/);
  assert.match(fxSrc, /Object\.assign\(FINE, PK_FINE\)/);
  const b = src('../public/js/client/battle.js');
  assert.match(b, /Object\.assign\(HIT_DELAY, PK_HIT\)/);
  assert.match(b, /\.\.\.PK_SFX/);
  assert.match(b, /PK_ALLY_FX\[anim\]/);
  // 敵が みんなに つかう ときも、みんなの いちに ポケモンの 技を 出す
  assert.match(b, /PK_ANIMS\.has\(anim\)/);
  assert.match(src('../public/js/client/audio.js'), /SFX_PK\[id\]\(this, T\)/);
  // データに ポケモンの 技（anim が pk_…）が あれば、どれも ここに ある（データが まだ なければ なにも しない）
  for (const [id, ab] of Object.entries(ABILITIES)) if (/^pk_/.test(ab.anim || '')) assert.ok(PK_ANIMS.has(ab.anim), `${id}: ${ab.anim}`);
});
