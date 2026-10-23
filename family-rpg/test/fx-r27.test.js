// 第27回: 古い 呪文・特技の エフェクトの 作り直し（render/battlefx-r27.js・sfx-r27.js）
// ・味方が つかう 技は みんな エフェクトが ある（白い 光だけ・なにも ない は なし）
// ・使い回しの anim でも、段階（大きさ）か 色が 技ごとに かわる。呪文の 段階が 上がるほど 大きく・長く
// ・属性の 色が そろっている・2びょう いないに おわる・敵1体／敵全体／味方／味方全体で こわれない・音が ある
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { Effects, BW, BH } from '../public/js/client/render/battlefx.js';
import { JOB_FINE, playJobFx } from '../public/js/client/render/battlefx-jobs.js';
import { JOB2_FINE, PARTY_ANIMS, playJob2Fx } from '../public/js/client/render/battlefx-jobs2.js';
import { JOB3_FINE, PARTY_ANIMS3, playJob3Fx } from '../public/js/client/render/battlefx-jobs3.js';
import { JOB4_FINE, SIG4, sigAnim, playJob4Fx } from '../public/js/client/render/battlefx-jobs4.js';
import { playJob5Fx } from '../public/js/client/render/battlefx-jobs5.js';
import { playJob6Fx } from '../public/js/client/render/battlefx-jobs6.js';
import { playJob7Fx } from '../public/js/client/render/battlefx-jobs7.js';
import { playJob8Fx } from '../public/js/client/render/battlefx-jobs8.js';
import { playR41aFx } from '../public/js/client/render/battlefx-r41a.js';
import { playCh4Fx } from '../public/js/client/render/battlefx-ch4.js';
import {
  R27_FINE, R27_ANIMS, R27_ALLY_ANIMS, ELEMENT_FX, STAT_FX, SPELL_SERIES, SPELL_TIER, ANIM_OVERRIDE, TIER_SCALE,
  playR27Fx, playAllyR27, allyAnimFor, fxTier, fxLook, r27Anim, r27Hit, r27Sfx,
} from '../public/js/client/render/battlefx-r27.js';
import { SFX_R27 } from '../public/js/client/sfx-r27.js';
import { SFX_R26 } from '../public/js/client/sfx-r26.js';

const src = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const FX_SRC = src('../public/js/client/render/battlefx.js');
// battlefx.js の play() に まだ のこって いる 技（テーマの ある 技: バット・電車・カード・ハート…）
const OLD_CASES = new Set([...FX_SRC.slice(FX_SRC.indexOf('  play(anim, targets')).matchAll(/case '([a-z_0-9]+)':/g)].map((m) => m[1]));

// たたかいの がめんに かく ための ブラウザの まね（よばれた かずと、NaN の かずを かぞえる）
function fakeCtx() {
  const log = { calls: 0, nan: [], neg: [] };
  let ctx;
  const fn = (name) => (...args) => {
    log.calls++;
    if (args.some((a) => typeof a === 'number' && !Number.isFinite(a))) log.nan.push(name);
    // arc・ellipse の 半径が マイナスだと 本物の ブラウザは エラーに なる
    if ((name === 'arc' && args[2] < 0) || (name === 'ellipse' && (args[2] < 0 || args[3] < 0))) log.neg.push(name);
    return ctx;
  };
  ctx = new Proxy({}, {
    get: (o, k) => (k in o ? o[k] : typeof k === 'string' ? fn(k) : undefined),
    set: (o, k, v) => { if (typeof v === 'number' && !Number.isFinite(v)) log.nan.push(String(k)); o[k] = v; return true; },
  });
  return { ctx, log };
}
function withFakeDocument(fn) {
  const sprite = fakeCtx();
  const had = 'document' in globalThis, prev = globalThis.document;
  globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => sprite.ctx }) };
  try { return fn(); } finally { if (had) globalThis.document = prev; else delete globalThis.document; }
}
function runFx(fx, limit = 4000) {
  const { ctx, log } = fakeCtx();
  let t = 0;
  while ((fx.parts.length || fx.bolts.length) && t < limit) {
    fx.update(16);
    t += 16;
    if (t % 48 === 0) fx.draw(ctx);
  }
  return { t, log };
}
// つぶの 色（color・cols・colors）
function colorsOf(fx) {
  const s = new Set();
  for (const p of fx.parts) {
    for (const c of [p.color, p.glow, ...(p.cols || []), ...(p.colors || [])]) if (typeof c === 'string') s.add(c.toLowerCase());
  }
  return s;
}
const isAllyTarget = (ab) => ['ally', 'allies', 'self', 'deadAlly', 'deadAllies'].includes(ab.target);
const ALLY_ABILITIES = Object.entries(ABILITIES).filter(([, a]) => a.kind !== 'monster');
const finalAnim = (id, ab) => sigAnim(id) || r27Anim(id) || ab.anim || null;

// 4つの 出かた（battle.js と おなじ ばしょ）
const ONE = [{ x: 128, y: 66 }];
const THREE = [{ x: 60, y: 70 }, { x: 128, y: 82 }, { x: 196, y: 70 }];
const FIVE = [{ x: 30, y: 60 }, { x: 80, y: 74 }, { x: 128, y: 66 }, { x: 176, y: 74 }, { x: 226, y: 60 }];
const ALLY1 = [{ x: BW / 2, y: BH - 22 }];
const ALLY4 = [0, 1, 2, 3].map((i) => ({ x: BW / 2 + (i - 1.5) * 58, y: BH - 22 }));

test('第27回: 味方の 技は みんな エフェクトが ある（なにも 出ない・白い 光だけ に ならない）', () => {
  const none = [], noFx = [];
  const fake = new Proxy({}, { get: () => () => undefined });
  const handled = (anim) => R27_ANIMS.has(anim) || OLD_CASES.has(anim)
    || playJobFx(fake, anim, ONE, null, {}) || playJob2Fx(fake, anim, ONE, null, {}) || playJob3Fx(fake, anim, ONE, null, {})
    || playJob4Fx(fake, anim, ONE, null, {}) || playJob5Fx(fake, anim, ONE, null, {}) || playJob6Fx(fake, anim, ONE, null, {}) || playJob7Fx(fake, anim, ONE, null, {}) || playJob8Fx(fake, anim, ONE, null, {}) || playR41aFx(fake, anim, ONE, null, {}) || playCh4Fx(fake, anim, ONE, null, {});
  for (const [id, ab] of ALLY_ABILITIES) {
    const anim = finalAnim(id, ab);
    const types = ab.effect?.type === 'multi' ? (ab.effect.parts || []).map((p) => p.type) : [ab.effect?.type];
    if (!anim || anim === 'none') {
      // 「なにも おきない」「にげる」「ルーラ」「なにかが おきる（あとで きまる）」と、フィールドだけの 呪文（リレミト・トヘロス・マモノヨセ）は エフェクト なし
      if (!types.every((t) => ['nothing', 'escape', 'warp', 'random', 'exit', 'repel', 'lure'].includes(t))) none.push(`${id}(${ab.name})`);
      continue;
    }
    if (!handled(anim)) noFx.push(`${id}:${anim}`);
    // 味方に かける 技は、がめんの したにも 出る（看板の技・PARTY_ANIMS は じぶんの エフェクト）
    if (isAllyTarget(ab) && !SIG4.has(anim) && !PARTY_ANIMS.has(anim) && !PARTY_ANIMS3.has(anim)) {
      const t = types.filter((x) => !['nothing', 'random', 'warp', 'escape', 'callHelp', 'flee', 'steal', 'scan', 'deduce', 'goldThrow', 'overtime', 'stance', 'dispel', 'reflect', 'atbSet'].includes(x));
      if (t.length && !allyAnimFor(anim, id)) noFx.push(`${id}:${anim}（味方）`);
    }
  }
  assert.deepEqual(none, [], 'エフェクトの ない 技');
  assert.deepEqual(noFx, [], 'エフェクトが きまらない 技');
  // データを かえずに 作り直した 技（ギラグレイド・ミナデイン・敬遠・つまみ食い）
  for (const [id, anim] of Object.entries(ANIM_OVERRIDE)) {
    assert.ok(ABILITIES[id], id);
    assert.ok(R27_ANIMS.has(anim), anim);
  }
});

test('第27回: 使い回しの anim でも 段階か 色が ちがう（同じ anim・同じ 段階・同じ 色の 技は 名前が ちがっても 同じ 見た目に しない）', () => {
  // 作り直した anim を つかう 味方の 技
  const groups = new Map();
  for (const [id, ab] of ALLY_ABILITIES) {
    const anim = finalAnim(id, ab);
    if (!R27_ANIMS.has(anim)) continue;
    if (!groups.has(anim)) groups.set(anim, []);
    groups.get(anim).push(id);
  }
  // 呪文の なかま（メラ系・ギラ系・ヒャド系・バギ系・イオ系・デイン系・ホイミ系・ザオ系・スカラ系）は、段階が かならず ちがう
  for (const [name, ids] of Object.entries(SPELL_SERIES)) {
    const tiers = ids.map((id) => fxTier(id, finalAnim(id, ABILITIES[id])));
    for (let i = 1; i < tiers.length; i++) assert.ok(tiers[i] > tiers[i - 1], `${name}: ${ids.join('→')} の 段階 ${tiers.join(',')}`);
  }
  // 使い回しの 多い anim（buff・heal2 など）も、段階・色の 組み合わせが いくつも ある
  for (const [anim, ids] of groups) {
    if (ids.length < 4) continue;
    const looks = new Set(ids.map((id) => `${fxTier(id, anim)}|${fxLook(id, ABILITIES[id].element).colors.join(',')}`));
    assert.ok(looks.size >= 2, `${anim}（${ids.length}こ）の 見た目が 1しゅるいだけ`);
  }
  // 補助の 色は ステータスで きまる（スカラ=青・バイキルト=赤・ピオリム=黄緑）
  assert.equal(fxLook('sukara').main, STAT_FX.def);
  assert.equal(fxLook('baikiruto').main, STAT_FX.atk);
  assert.equal(fxLook('piorimu').main, STAT_FX.agi);
  assert.equal(fxLook('rukani').main, STAT_FX.def);
  assert.equal(fxLook('hoimi').main, ELEMENT_FX.heal.colors[1]);
  assert.notEqual(fxLook('kiarii').main, fxLook('hoimi').main, 'キアリーは 回復と ちがう 色');
  // 知らない 技・技 なしでも 段階が きまる
  for (const [anim, t] of [['fire1', 1], ['fire3', 3], ['minadein', 4], ['slash_heavy', 2]]) assert.equal(fxTier(undefined, anim), t, anim);
  assert.equal(fxTier('dt_anything', 'void'), 4, '合体技は いちばん上');
  for (const id of Object.keys(SPELL_TIER)) assert.ok(ABILITIES[id], `SPELL_TIER の ${id} が データに ある`);
});

test('第27回: 呪文の 段階が 上がるほど 大きく・派手に・長く（でも 2びょう まで）', () => {
  // つぶの 数は らんすうで かわるので、決まった らんすうで くらべる（たまに 落ちない ように）
  const realRandom = Math.random;
  let seed = 12345;
  Math.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  try {
  withFakeDocument(() => {
    for (const [name, ids] of Object.entries(SPELL_SERIES)) {
      const stats = ids.map((id) => {
        const ab = ABILITIES[id];
        const anim = finalAnim(id, ab);
        const fx = new Effects();
        const ally = isAllyTarget(ab);
        const ts = ally ? (ab.target === 'allies' || ab.target === 'deadAllies' ? ALLY4 : ALLY1) : ONE;
        if (ally) assert.ok(playAllyR27(fx, anim, ts, { ability: id }), `${id} 味方`);
        else fx.play(anim, ts, ab.element, { fromAlly: true, ability: id });
        const n = fx.parts.length;
        const { t, log } = runFx(fx);
        assert.deepEqual(log.nan, [], `${id} の NaN`);
        return { id, n, t };
      });
      for (let i = 1; i < stats.length; i++) {
        const [a, b] = [stats[i - 1], stats[i]];
        // 味方全体の 回復は 人数が ちがうので、くらべるのは 同じ 形どうし
        assert.ok(b.n > a.n, `${name}: ${b.id} の つぶ ${b.n} が ${a.id} の ${a.n} より 多い`);
        assert.ok(b.t >= a.t - 50, `${name}: ${b.id} の 長さ ${b.t} が ${a.id} の ${a.t} より みじかく ない`);
      }
      const first = stats[0], last = stats[stats.length - 1];
      assert.ok(last.t > first.t, `${name}: いちばん上（${last.id} ${last.t}ms）が いちばん下（${first.id} ${first.t}ms）より 長い`);
      assert.ok(last.t <= 2050, `${name}: ${last.id} が ${last.t}ms（2びょう まで）`);
    }
  });
  } finally { Math.random = realRandom; }
  assert.deepEqual(TIER_SCALE.slice(1), [...TIER_SCALE.slice(1)].sort((a, b) => a - b), '段階の 大きさは だんだん 大きく');
});

test('第27回: 属性の 色が そろっている（炎は 炎の 色、氷は 氷の 色 …。ほかの 属性の 色は まざらない）', () => {
  const FAM = {
    fire: [['mera', 'fire1'], ['merazoma', 'fire3'], ['am_meragaia', 'fire3'], ['gira', 'fire_wave'], ['hi_giragureido', 'fire_wave']],
    ice: [['hyado', 'ice1'], ['hyadaruko', 'ice2'], ['dz_mahyadedos', 'ice2']],
    wind: [['bagi', 'wind1'], ['sg_bagikurosu', 'wind2'], ['hp_bagimuta', 'wind2']],
    blast: [['io', 'blast1'], ['iora', 'blast2'], ['dz_iogurande', 'blast2']],
    bolt: [['mk_raiden', 'bolt1'], ['hr_gigadein', 'bolt2'], ['lt_minadein', 'minadein']],
    light: [['hk_holy_light', 'holy'], ['hp_holy', 'holy']],
    dark: [['hi_dorumadon', 'dark1'], ['sm_jigo', 'dark1']],
    heal: [['hoimi', 'heal1'], ['sg_behoma', 'heal2'], ['hp_behomazun', 'heal2']],
  };
  const sig = Object.fromEntries(Object.entries(ELEMENT_FX).map(([k, v]) => [k, v.colors[1].toLowerCase()]));
  // その 属性だけの 色は ほかと かさならない
  assert.equal(new Set(Object.values(sig)).size, Object.keys(sig).length);
  withFakeDocument(() => {
    for (const [el, list] of Object.entries(FAM)) {
      for (const [id, anim] of list) {
        assert.equal(finalAnim(id, ABILITIES[id]), anim, id);
        const fx = new Effects();
        if (el === 'heal') playAllyR27(fx, anim, ABILITIES[id].target === 'allies' ? ALLY4 : ALLY1, { ability: id });
        else fx.play(anim, ONE, ABILITIES[id].element, { fromAlly: true, ability: id });
        const cols = colorsOf(fx);
        assert.ok(cols.has(sig[el]), `${id}（${el}）に ${el} の 色 ${sig[el]} が ある`);
        for (const [other, c] of Object.entries(sig)) {
          if (other === el) continue;
          assert.ok(!cols.has(c), `${id}（${el}）に ${other} の 色 ${c} が まざって いる`);
        }
      }
    }
  });
});

test('第27回: 作り直した エフェクトは 敵1体・敵全体・味方・味方全体の どれでも、2びょう いないに おわり、あたる じかんが あう', () => {
  withFakeDocument(() => {
    for (const anim of R27_ANIMS) {
      for (const tier of [1, 2, 3, 4]) {
        const runs = [{ ts: ONE }, { ts: THREE }, { ts: FIVE, crit: true }, { ts: [{ x: 228, y: 38 }] }];
        if (R27_ALLY_ANIMS.has(anim)) runs.push({ ts: ALLY1, ally: true }, { ts: ALLY4, ally: true });
        for (const { ts, crit, ally } of runs) {
          const fx = new Effects();
          const opts = { tier, crit: !!crit, fromAlly: true, from: { x: BW / 2, y: BH - 22 } };
          if (ally) assert.ok(playAllyR27(fx, anim, ts, opts), `${anim} 味方`);
          else fx.play(anim, ts, null, opts);
          const label = `${anim} 段階${tier} ${ally ? '味方' : '敵'}${ts.length}`;
          assert.ok(fx.parts.length > 0, `${label} の つぶ`);
          assert.ok(fx.parts.length <= 320, `${label} の つぶが 多すぎる ${fx.parts.length}`);
          // つぶは がめんの 中か その すぐ そと
          for (const p of fx.parts) {
            if (typeof p.x !== 'number' || ['flash', 'shake', 'call', 'trail'].includes(p.kind)) continue; // trail の x,y は 円の 中心
            assert.ok(p.x > -100 && p.x < BW + 100 && p.y > -100 && p.y < BH + 60, `${label} の ${p.kind} が とおい (${p.x},${p.y})`);
          }
          // 1ばんめの まとに つぶが 出る
          const h = fx.parts.filter((p) => typeof p.x === 'number' && Math.hypot(p.x - ts[0].x, p.y - ts[0].y) < 28 && p.kind !== 'call');
          assert.ok(h.length > 0, `${label}: まとに つぶが ない`);
          const { t, log } = runFx(fx);
          assert.ok(t <= 2050, `${label} が ながい ${t}ms`);
          assert.ok(log.calls > 60, `${label} を かいた ${log.calls}`);
          assert.deepEqual(log.nan, [], `${label} の NaN`);
          assert.deepEqual(log.neg, [], `${label} の 半径が マイナス`);
        }
      }
    }
  });
});

test('第27回: あたる じかん（r27Hit）と エフェクトが そろう', () => {
  withFakeDocument(() => {
    for (const anim of R27_ANIMS) {
      for (const tier of [1, 2, 3, 4]) {
        const ab = Object.keys(SPELL_TIER).find((id) => SPELL_TIER[id] === tier && finalAnim(id, ABILITIES[id]) === anim);
        const want = ab ? r27Hit(anim, ab) : null;
        if (want === null) continue;
        const fx = new Effects();
        fx.play(anim, ONE, ABILITIES[ab].element, { fromAlly: true, ability: ab });
        // その じかんの ±0.15びょうに まとの 近くで 光る つぶが ある
        const near = fx.parts.filter((p) => typeof p.x === 'number' && Math.hypot(p.x - ONE[0].x, p.y - ONE[0].y) < 30 && Math.abs((p.delay || 0) - want) <= 150);
        assert.ok(near.length > 0, `${ab}（${anim}）: ${want}ms に あたる つぶ`);
      }
    }
  });
  // 段階で あたる じかんが かわる 呪文（メラガイアーは ためる ぶん おそい）
  assert.ok(r27Hit('fire3', 'am_meragaia') > r27Hit('fire1', 'mera'));
  assert.equal(r27Hit('no_such_anim', 'mera'), null);
  assert.equal(r27Hit('kamehameha'), null, 'ほかの ファイルの 技は battle.js の HIT_DELAY');
});

test('第27回: 音（段階で 大きく・長く）と、battle.js・battlefx.js・audio.js の つなぎ', () => {
  const audio = src('../public/js/client/audio.js');
  for (const k of Object.keys(SFX_R27)) {
    assert.match(k, /^r7_[a-z]+[1-4]$/, k);
    assert.ok(!audio.includes(`case '${k}':`) && !(k in SFX_R26), `${k} が ほかの 音と かさなる`);
  }
  assert.match(audio, /SFX_R27\[id\]\(this, T\)/);
  // 作り直した 技の 音は みんな ある
  for (const anim of R27_ANIMS) {
    for (const t of [1, 4]) {
      const s = r27Sfx(anim, Object.keys(SPELL_TIER).find((id) => SPELL_TIER[id] === t && ABILITIES[id].anim === anim));
      if (s) assert.ok(SFX_R27[s], `${anim} の 音 ${s}`);
    }
  }
  assert.equal(r27Sfx('fire1', 'mera'), 'r7_fire1');
  assert.equal(r27Sfx('fire3', 'am_meragaia'), 'r7_fire4');
  assert.equal(r27Sfx('kamehameha', null), null);
  // ならしても こわれない。段階 4 は 段階 1 より 音が 長いか 多い
  const play = (k) => {
    const calls = [];
    const a = { tone: (...x) => calls.push(['tone', ...x]), noise: (...x) => calls.push(['noise', ...x]) };
    SFX_R27[k](a, a.tone);
    for (const c of calls) for (const v of c.slice(1)) if (typeof v === 'number') assert.ok(Number.isFinite(v), k);
    const len = calls.reduce((m, c) => Math.max(m, (c[0] === 'tone' ? c[2] + (c[3]?.delay || 0) : c[1] + (c[2]?.delay || 0))), 0);
    const loud = calls.reduce((s, c) => s + ((c[0] === 'tone' ? c[3] : c[2])?.vol || 0), 0);
    return { n: calls.length, len, loud };
  };
  const fams = [...new Set(Object.keys(SFX_R27).map((k) => k.slice(0, -1)))];
  for (const f of fams) {
    const a = play(`${f}1`), b = play(`${f}4`);
    assert.ok(a.n > 0, f);
    assert.ok(b.len > a.len || b.n > a.n || b.loud > a.loud, `${f}: 段階4 が 大きい`);
  }
  const battle = src('../public/js/client/battle.js');
  assert.match(battle, /r27Anim\(ev\.ability\)/);
  assert.match(battle, /r27Hit\(anim, ev\.ability\)/);
  assert.match(battle, /r27Sfx\(anim, ev\.ability\)/);
  assert.match(battle, /playAllyR27\(this\.fx, anim, allyTargets/);
  assert.match(battle, /ability: ev\.ability/);
  assert.match(FX_SRC, /playR27Fx\(this, anim/);
  assert.match(FX_SRC, /R27_FINE/);
});

test('第27回: つぶの なまえ・anim の なまえ（前の なまえを そのまま つかう）', () => {
  const s0 = FX_SRC.indexOf('const FINE = {');
  const fine = FX_SRC.slice(s0, FX_SRC.indexOf('\n};', s0));
  for (const k of Object.keys(R27_FINE)) {
    assert.ok(k.startsWith('r7'), k);
    assert.ok(!(k in JOB_FINE) && !(k in JOB2_FINE) && !(k in JOB3_FINE) && !(k in JOB4_FINE), k);
    assert.ok(!new RegExp(`^  ${k}\\(`, 'm').test(fine), `${k} が battlefx.js の FINE と かさなる`);
  }
  // 作り直した anim は、前から データに ある なまえ（データの anim を かえない）
  const dataAnims = new Set(Object.values(ABILITIES).map((a) => a.anim).filter(Boolean));
  for (const anim of R27_ANIMS) assert.ok(dataAnims.has(anim) || anim === 'minadein', `${anim} は データに ある なまえ`);
  // ほかの ファイルの 技とは かさならない
  const fake = new Proxy({}, { get: () => () => undefined });
  for (const anim of R27_ANIMS) {
    for (const f of [playJobFx, playJob2Fx, playJob3Fx, playJob4Fx, playCh4Fx]) assert.equal(f(fake, anim, ONE, null, {}), false, anim);
    assert.ok(!PARTY_ANIMS.has(anim) && !PARTY_ANIMS3.has(anim) && !SIG4.has(anim), anim);
  }
  // まとが ない・おかしい ときは なにも しない
  assert.equal(playR27Fx(fake, 'fire1', [], null, {}), false);
  assert.equal(playR27Fx(fake, 'fire1', [{ x: NaN, y: 3 }], null, {}), false);
  assert.equal(playR27Fx(fake, 'kamehameha', ONE, null, {}), false);
  assert.equal(playAllyR27(fake, 'fire1', ALLY1, {}), false);
  assert.equal(allyAnimFor('holy', 'lt_shirushi') !== null, true, 'ロトのしるし（味方）も がめんの したに');
});
