// 第48回: 大技エンジン（ためる → はなつ）。render/axfx.js・axcharge.js・axkit.js・ax-demo.js・sfx-ax.js・tools/fx-preview.mjs
// ・とうろく（registerAx・useAxGroup・技ごとの 段階）・時間の けいさん（たたかいの 速さで ちぢむ）
// ・ためかた 14しゅるい × 段階 4つ・どうぐばこが にせの キャンバスで こわれない
// ・battle.js・battlefx.js・audio.js の つなぎ・おためしの 技が 敵1体／敵全体・味方→敵／敵→味方で うごく
// ・たたかいの 中み（shared/）は かわらない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { Effects, BW, BH } from '../public/js/client/render/battlefx.js';
import {
  registerAx, useAxGroup, isAx, axDef, axList, axAnimFor, axAllyFx, axIsParty, axResolve, axTiming, axHoldMs, axEventAnim, axEnemyPose, playAxFx,
} from '../public/js/client/render/axfx.js';
import { CHARGE_KINDS, TIERS, TIER_CHARGE_MS, KI_CHARGE_MS, TIER_K, KIND_LOOK, playCharge, chargeMs } from '../public/js/client/render/axcharge.js';
import { AX_FINE, KIT_FNS, bindKit, PAL, pal, AURA_STYLES } from '../public/js/client/render/axkit.js';
import { AX_DEMO } from '../public/js/client/render/ax-demo.js';
import { SFX_AX } from '../public/js/client/sfx-ax.js';

const src = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

// たたかいの がめんに かく ための ブラウザの まね（NaN と マイナスの 半径を かぞえる）
function fakeCtx() {
  const log = { calls: 0, nan: [], neg: [] };
  let ctx;
  const fn = (name) => (...args) => {
    log.calls++;
    if (args.some((a) => typeof a === 'number' && !Number.isFinite(a))) log.nan.push(name);
    if ((name === 'arc' && args[2] < 0) || (name === 'ellipse' && (args[2] < 0 || args[3] < 0))) log.neg.push(name);
    return ctx;
  };
  ctx = new Proxy({}, {
    get: (o, k) => (k in o ? o[k] : typeof k === 'string' ? fn(k) : undefined),
    set: (o, k, v) => { if (typeof v === 'number' && !Number.isFinite(v)) log.nan.push(String(k)); o[k] = v; return true; },
  });
  return { ctx, log };
}
// ぼんやり ひかる まるの え（battlefx.js の glowSprite）を つくる ための document の まね
if (!('document' in globalThis)) {
  const sprite = fakeCtx();
  globalThis.document = { createElement: () => ({ width: 64, height: 64, getContext: () => sprite.ctx }) };
}
// fx を ms まで すすめて かく（parts が なくなるまで）
function runFx(fx, limit = 6000, onStep = null) {
  const { ctx, log } = fakeCtx();
  let t = 0;
  while ((fx.parts.length || fx.bolts.length) && t < limit) {
    fx.update(16);
    t += 16;
    if (onStep) onStep(t, fx);
    if (t % 32 === 0) fx.draw(ctx);
  }
  return { t, log };
}
const ONE = [{ x: 128, y: 66 }];
const THREE = [{ x: 60, y: 70 }, { x: 128, y: 82 }, { x: 196, y: 70 }];
const ALLY1 = [{ x: BW / 2, y: BH - 22 }];
const ALLY4 = [0, 1, 2, 3].map((i) => ({ x: BW / 2 + (i - 1.5) * 51, y: BH - 22 }));
const ALLY_FROM = { x: 102, y: BH - 22 };
const FOE_FROM = { x: 128, y: 86, w: 40, h: 44, foot: 120 };

test('第48回: とうろく（registerAx・useAxGroup・技ごとの 段階）', () => {
  // おためしの 3つ（どの 技にも つないで いない）
  for (const a of ['ax_demo_beam', 'ax_demo_slash', 'ax_demo_orb']) {
    assert.ok(isAx(a), a);
    assert.equal(axDef(a).group, 'demo');
  }
  assert.deepEqual(axList('ax_demo_'), ['ax_demo_beam', 'ax_demo_slash', 'ax_demo_orb']);
  assert.equal(axDef('ax_demo_beam').tier, 'legend');
  assert.equal(axDef('ax_demo_beam').charge.kind, 'ki');
  assert.equal(axDef('ax_demo_slash').charge.kind, 'sword');
  assert.equal(axDef('ax_demo_orb').charge.kind, 'chakra');
  assert.equal(isAx('fire1'), false);
  assert.equal(isAx(undefined), false);
  // まちがった とうろくは すぐ わかる
  const play = () => {};
  assert.throws(() => registerAx('', { play }), /anim/);
  assert.throws(() => registerAx('ax_t_noplay', {}), /play/);
  assert.throws(() => registerAx('ax_t_badtier', { tier: 'ultra', play }), /tier/);
  assert.throws(() => registerAx('ax_t_badkind', { charge: { kind: 'kame' }, play }), /charge\.kind/);
  assert.throws(() => registerAx('ax_demo_beam', { play }), /もう ある/);
  // グループ: { anim: def }。技の id で 段階・色を かえる
  const names = useAxGroup('test', {
    ax_t_one: { tier: 'advanced', charge: { kind: 'ki', color: '#4ab8ff' }, hit: 200, len: 600, allyFx: 'bolt', abilities: { t_kame: 'advanced', t_kame_super: { tier: 'super', charge: { color: '#ffd23a' }, vars: { gold: true } }, t_kame_final: 'legend' }, play },
    ax_t_party: { tier: 'basic', charge: false, party: true, hit: (o) => 100 + o.n * 10, len: 500, abilities: ['t_heal'], play },
    ax_t_nocharge: { play },
  });
  assert.deepEqual(names, ['ax_t_one', 'ax_t_party', 'ax_t_nocharge']);
  assert.throws(() => registerAx('ax_t_dup_ab', { abilities: ['t_kame'], play }), /t_kame/);
  assert.equal(axAnimFor('t_kame_super'), 'ax_t_one');
  assert.equal(axAnimFor('t_heal'), 'ax_t_party');
  assert.equal(axAnimFor('kamehameha'), null);
  assert.equal(axAllyFx('ax_t_one'), 'bolt');
  assert.equal(axAllyFx('ax_demo_orb'), 'wind');
  assert.equal(axIsParty('ax_t_party'), true);
  assert.equal(axIsParty('ax_t_one'), false);
  const r = axResolve('ax_t_one', { ability: 't_kame_super' });
  assert.equal(r.tier, 'super');
  assert.equal(r.charge.kind, 'ki');
  assert.equal(r.charge.color, '#ffd23a');
  assert.deepEqual(r.vars, { gold: true });
  assert.equal(axResolve('ax_t_one', { ability: 't_kame_final' }).tier, 'legend');
  assert.equal(axResolve('ax_t_one', { ability: 't_kame_final', tier: 'basic' }).tier, 'basic', 'ためしに かえる tier が いちばん つよい');
  assert.equal(axResolve('ax_t_one', { ability: 'other' }).tier, 'advanced');
  assert.equal(axResolve('ax_t_nocharge').charge.kind, 'generic', 'charge を 書かなければ ふつうの ため');
  assert.equal(axResolve('ax_t_party').charge, null);
  // たたかいの 行動（ev）から anim: 技の id の とうろく → データの anim。ふつうの こうげきは ちがう
  assert.equal(axEventAnim({ t: 'act', ability: 't_kame', fx: { type: 'ability', anim: 'kamehameha' } }), 'ax_t_one');
  assert.equal(axEventAnim({ t: 'act', fx: { type: 'ability', anim: 'ax_demo_orb' } }), 'ax_demo_orb');
  assert.equal(axEventAnim({ t: 'act', fx: { type: 'ability', anim: 'fire1' } }), null);
  assert.equal(axEventAnim({ t: 'act', fx: { type: 'attack', anim: 'ax_demo_orb' } }), null);
  assert.equal(axEventAnim({ t: 'msg' }), null);
});

test('第48回: 時間の けいさん（ためる＋あたる。たたかいの 速さで ちぢむ）', () => {
  assert.deepEqual(TIERS, ['basic', 'advanced', 'super', 'legend']);
  for (let i = 1; i < TIERS.length; i++) {
    assert.ok(KI_CHARGE_MS[TIERS[i]] > KI_CHARGE_MS[TIERS[i - 1]], '気は 段階が 上がるほど 長く ためる');
    assert.ok(TIER_CHARGE_MS[TIERS[i]] >= TIER_CHARGE_MS[TIERS[i - 1]], '構えは 段階で みじかく ならない');
    assert.ok(TIER_K[TIERS[i]] > TIER_K[TIERS[i - 1]], '段階が 上がるほど つよく');
  }
  // 第49回: 気（ドラゴンボール）は 伝説でも 0.9びょう、構えは 0.3びょう まで
  assert.ok(KI_CHARGE_MS.legend <= 900, '気は 伝説でも 0.9びょう まで');
  for (const t of TIERS) assert.ok(TIER_CHARGE_MS[t] <= 300, `${t}: 構えは 0.3びょう まで`);
  const T = axTiming('ax_demo_beam');
  assert.equal(T.tier, 'legend');
  assert.equal(T.kind, 'ki');
  assert.equal(T.charge, KI_CHARGE_MS.legend);
  assert.equal(T.release, 150);
  assert.equal(T.hit, T.charge + 150);
  assert.equal(T.total, T.charge + 1050);
  assert.equal(T.hitReal, T.hit);
  // 速さ 2 … ほんとうの 時間は はんぶん。0.5 … 2ばい
  const T2 = axTiming('ax_demo_beam', { tempo: 2 });
  assert.equal(T2.chargeReal, T.charge / 2);
  assert.equal(T2.hitReal, T.hit / 2);
  assert.equal(T2.totalReal, T.total / 2);
  // おそい 設定（0.85 より 下）でも 大技は 0.85 の 速さ（ts。shared/ax-time.js）
  const Ts = axTiming('ax_demo_beam', { tempo: 0.5 });
  assert.equal(Ts.hitReal, Math.round(T.hit / 0.85));
  assert.ok(Math.abs(Ts.ts - 1.7) < 1e-9);
  assert.equal(Ts.hitAt, Math.round(T.hit / Ts.ts));
  assert.equal(axTiming('ax_demo_beam', { tempo: 0.85 }).hitReal, Math.round(T.hit / 0.85));
  assert.equal(T.ts, 1);
  assert.equal(T.hitAt, T.hit);
  // 2回目は ため 半分・合体技は ため なし
  assert.equal(axTiming('ax_demo_beam', { repeat: true }).charge, KI_CHARGE_MS.legend / 2);
  assert.equal(axTiming('ax_demo_beam', { dual: true }).charge, 0);
  assert.equal(axTiming('ax_demo_beam', { dual: true }).cutin, false);
  assert.equal(T.cutin, false, '第49回: カットインの 帯は ない');
  // 構え（ki の ほか）は みじかい: おためしの 剣（super）・チャクラ（advanced）
  assert.equal(axTiming('ax_demo_slash').charge, TIER_CHARGE_MS.super);
  assert.equal(axTiming('ax_demo_orb').charge, TIER_CHARGE_MS.advanced);
  assert.equal(axHoldMs('ax_demo_beam', { tempo: 2 }), Math.round(T.hit / 2 + 350 / 2));
  assert.equal(axHoldMs('fire1'), 0);
  assert.equal(axTiming('fire1'), null);
  // 技ごとの 段階で ためる 時間が かわる（ax_t_one は 気）
  assert.equal(axTiming('ax_t_one', { ability: 't_kame' }).charge, KI_CHARGE_MS.advanced);
  assert.equal(axTiming('ax_t_one', { ability: 't_kame_super' }).charge, KI_CHARGE_MS.super);
  assert.equal(axTiming('ax_t_one', { ability: 't_kame_final' }).charge, KI_CHARGE_MS.legend);
  assert.equal(axTiming('ax_t_one', { ability: 't_kame_final' }).hit, KI_CHARGE_MS.legend + 200);
  // ためしに ためかたを かえると その 上限（気 → 剣の 構え）
  assert.equal(axTiming('ax_t_one', { ability: 't_kame_final', chargeKind: 'sword' }).charge, TIER_CHARGE_MS.legend);
  // ためない・hit が 関数（的の かず）
  const P = axTiming('ax_t_party', { targets: 4 });
  assert.equal(P.charge, 0);
  assert.equal(P.hit, 140);
  assert.equal(axTiming('ax_t_party', { targets: [1, 2] }).hit, 120);
  assert.ok(P.len >= P.release + 120, 'len は あたる より あと');
  assert.equal(axTiming('ax_demo_slash', { targets: 3 }).len, 840);
  // ためる 時間を じぶんで きめる
  // ためる 時間を じぶんで きめる（上限まで）
  assert.equal(chargeMs({ kind: 'ki', ms: 777 }, 'legend'), 777);
  assert.equal(chargeMs({ kind: 'ki', ms: 777 }, 'basic'), KI_CHARGE_MS.basic, '上限で きる');
  assert.equal(chargeMs({ kind: 'sword', ms: 120 }, 'legend'), 120);
  assert.equal(chargeMs({ kind: 'sword', ms: 1300 }, 'legend'), TIER_CHARGE_MS.legend);
  assert.equal(chargeMs(null, 'legend'), 0);
  assert.equal(chargeMs({ kind: 'ki' }, 'nanika'), KI_CHARGE_MS.advanced);
  assert.equal(chargeMs({ kind: 'magic' }, 'nanika'), TIER_CHARGE_MS.advanced);
});

test('第48回: ためかた 14しゅるい × 段階 4つ（味方・敵）が こわれない。第49回: カットイン・画面の くらさ なし、気だけ ゆれる', () => {
  assert.deepEqual(CHARGE_KINDS, ['ki', 'chakra', 'gomu', 'breath', 'sword', 'dragon', 'holy', 'magic', 'alchemy', 'idol', 'tech', 'ice', 'star', 'generic']);
  for (const k of CHARGE_KINDS) {
    assert.ok(KIND_LOOK[k], k);
    assert.ok(AURA_STYLES.includes(KIND_LOOK[k].style), `${k}: オーラ ${KIND_LOOK[k].style}`);
  }
  const kinds = (fx) => new Set(fx.parts.map((p) => p.kind));
  for (const kind of CHARGE_KINDS) {
    for (const tier of TIERS) {
      for (const foe of [false, true]) {
        const fx = new Effects();
        const P = foe ? FOE_FROM : { x: 102, y: BH - 26, w: 30, h: 32, foot: BH + 2 };
        const ms = playCharge(fx, P, { kind, tier, foe, img: null });
        const ki = kind === 'ki';
        assert.equal(ms, (ki ? KI_CHARGE_MS : TIER_CHARGE_MS)[tier], `${kind}/${tier}`);
        const ks = kinds(fx);
        assert.ok(ks.has('axAura'), `${kind}/${tier}: オーラ`);
        // 第49回: どの 段でも カットインの 帯・スローの ひかり・かげ・画面の くらさ・画面の いちばん 上の もの は ない
        for (const no of ['axTint', 'axBand', 'axFreeze', 'axFigure', 'axStreaks']) assert.ok(!ks.has(no), `${kind}/${tier}: ${no} は ない`);
        assert.ok(!fx.parts.some((p) => p.top), `${kind}/${tier}: 画面の いちばん 上に かく もの なし`);
        assert.ok(!fx.parts.some((p) => p.kind === 'flash'), `${kind}/${tier}: 画面の ひかり なし`);
        // ゆれるのは 気（advanced から）だけ。小石は 気の legend だけ
        assert.equal(fx.parts.some((p) => p.kind === 'shake'), ki && tier !== 'basic', `${kind}/${tier}: ゆれ`);
        assert.equal(fx.parts.some((p) => p.shape === 'rock'), ki && tier === 'legend', `${kind}/${tier}: 小石`);
        if (ki) assert.ok(fx.parts.filter((p) => p.kind === 'axAura').every((p) => ['#ffd23a', '#ff9a1a'].includes(p.color)), `${tier}: 気は 黄色い オーラ`);
        // その 人の まわりだけ（画面ぜんたいに ひろがる ものは ない）
        for (const p of fx.parts) {
          if (!Number.isFinite(p.x) || p.kind === 'shake' || p.kind === 'call') continue;
          assert.ok(Math.abs(p.x - P.x) <= 70 && Math.abs(p.y - P.y) <= 70, `${kind}/${tier}: ${p.kind} が はなれて いる（${Math.round(p.x)},${Math.round(p.y)}）`);
          if (p.r1 !== undefined) assert.ok(p.r1 <= 80, `${kind}/${tier}: ${p.kind} の わ が 大きい ${p.r1}`);
        }
        // ためる 時間を すぎて のこる ものは すくない（はなつ えんしゅつの じゃまを しない）
        const { t, log } = runFx(fx);
        assert.deepEqual([...new Set(log.nan)], [], `${kind}/${tier}: NaN`);
        assert.deepEqual(log.neg, [], `${kind}/${tier}: マイナスの 半径`);
        assert.ok(t <= ms + 700, `${kind}/${tier}: ${t}ms で おわる`);
      }
    }
  }
  // しらない ためかたは generic、いちが へんなら なにも しない
  assert.ok(playCharge(new Effects(), FOE_FROM, { kind: 'nanika' }) > 0);
  assert.equal(playCharge(new Effects(), { x: NaN, y: 1 }, { kind: 'ki' }), 0);
  assert.equal(playCharge(new Effects(), FOE_FROM, { kind: 'ki', ms: 0 }), 0);
});

test('第48回: どうぐばこ（axkit）は にせの キャンバスで こわれない・あたる 時間を かえす', () => {
  assert.ok(Object.keys(AX_FINE).every((k) => k.startsWith('ax') || /^g\d/.test(k)), 'つぶの なまえは ax〜 か、グループの g1〜g6〜');
  const fine = src('../public/js/client/render/battlefx.js');
  for (const k of Object.keys(AX_FINE)) assert.ok(!new RegExp(`^  ${k}\\(`, 'm').test(fine), `${k} が battlefx.js の FINE と かさなる`);
  for (const el of ['fire', 'ice', 'water', 'wind', 'blast', 'bolt', 'light', 'dark', 'void', 'ki', 'holy', 'heal', 'earth']) {
    const P = pal(el);
    for (const k of ['main', 'glow', 'core', 'dark']) assert.match(P[k], /^#[0-9a-f]{6}$/i, `${el}.${k}`);
    assert.ok(P.list.length >= 2);
  }
  assert.equal(pal('nanika'), PAL.light);
  const calls = {
    beam: [20, 130, 128, 60, { widths: [0.3, 1, 0.5, 0] }], pillar: [128, 70], orb: [100, 120, { to: { x: 128, y: 60 } }], crescent: [128, 60], slash: [128, 60],
    multiSlash: [128, 60, { n: 4 }], shockwave: [128, 60, { n: 3 }], impact: [128, 60, { heavy: true }], explosion: [128, 60], debris: [128, 70], particles: [128, 60],
    shapes: [128, 60, { shape: 'flake' }], sparkles: [128, 60], petals: [128, 60], gather: [128, 60, { waves: 3 }], bolt: [20, 0, 128, 60], boltRain: [128, 60],
    flames: [128, 80], wave: [20, 120, 200, 60], splash: [128, 60], speedLines: [128, 60], streaks: [{ ang: 1 }], tint: ['#000000'], dim: [], flash: [], shake: [],
    dash: [20, 120, 128, 60], cutIn: [{ img: null }], glyph: [128, 100, { variant: 'alchemy' }], aura: [128, 100, { style: 'flame' }], hitMark: [128, 60],
  };
  assert.deepEqual(Object.keys(calls).sort(), Object.keys(KIT_FNS).sort(), 'どうぐは みんな ためす');
  for (const [name, args] of Object.entries(calls)) {
    const fx = new Effects();
    const k = bindKit(fx);
    const ret = k[name](...args);
    assert.ok(typeof ret === 'number' && Number.isFinite(ret), `${name}: あたる 時間`);
    const { log } = runFx(fx);
    assert.deepEqual([...new Set(log.nan)], [], `${name}: NaN`);
    assert.deepEqual(log.neg, [], `${name}: マイナスの 半径`);
  }
  // かたち・オーラは みんな かける
  for (const shape of ['flake', 'star', 'twinkle', 'card', 'heart', 'diamond', 'petal', 'rock', 'note', 'dot']) {
    const fx = new Effects();
    KIT_FNS.shapes(fx, 128, 60, { shape, color2: '#ff0000' });
    assert.deepEqual(runFx(fx).log.nan, [], shape);
  }
  for (const style of AURA_STYLES) {
    const fx = new Effects();
    KIT_FNS.aura(fx, 128, 100, { style, k: 1.6 });
    const { log } = runFx(fx);
    assert.deepEqual(log.nan, [], style);
    assert.ok(log.calls > 20, `${style}: かいた`);
  }
  // あたる 時間: ビームは delay＋grow、たまは start＋travel、ダッシュは travel
  const fx = new Effects();
  assert.equal(KIT_FNS.beam(fx, 0, 0, 10, 10, { delay: 100, grow: 80 }), 180);
  assert.equal(KIT_FNS.orb(fx, 0, 0, { delay: 50, start: 200, travel: 300, to: { x: 1, y: 1 } }), 550);
  assert.equal(KIT_FNS.dash(fx, 0, 0, 10, 10, { travel: 140, delay: 10 }), 150);
  assert.equal(KIT_FNS.wave(fx, 0, 0, 10, 10, { travel: 300 }), 300);
});

test('第48回: おためしの 技は 敵1体・敵全体・味方→敵・敵→味方で うごき、はなつのは ためた あと', () => {
  for (const anim of axList('ax_demo_')) {
    for (const fromAlly of [true, false]) {
      for (const pts of fromAlly ? [ONE, THREE] : [ALLY1, ALLY4.slice(0, 3)]) {
        const fx = new Effects();
        const sounds = [];
        let clock = 0;
        const ok = fx.play(anim, pts, null, { fromAlly, from: fromAlly ? ALLY_FROM : FOE_FROM, sfx: (id) => sounds.push([clock, id]) });
        assert.equal(ok, undefined);
        const T = axTiming(anim, { targets: pts.length });
        // ためて いる 間は はなつ 技の つぶ（ビーム・たま・三日月・ダッシュ）が まだ ない
        const release = new Set(['axBeam', 'axOrb', 'axCrescent', 'axDash']);
        let firstRelease = null;
        const { t, log } = runFx(fx, 8000, (now, f) => {
          clock = now;
          if (firstRelease === null && f.parts.some((p) => release.has(p.kind) && !(p.delay > 0))) firstRelease = now;
        });
        const tag = `${anim} ${fromAlly ? '味方→敵' : '敵→味方'} ${pts.length}`;
        assert.deepEqual([...new Set(log.nan)], [], `${tag}: NaN`);
        assert.deepEqual(log.neg, [], `${tag}: マイナスの 半径`);
        assert.ok(firstRelease !== null && firstRelease >= T.charge, `${tag}: はなつのは ${T.charge}ms の あと（${firstRelease}）`);
        assert.ok(t <= T.total + 1200, `${tag}: ${t}ms で おわる（total ${T.total}）`);
        assert.ok(t >= T.hit, `${tag}: あたる まで つづく`);
        // 音: ためはじめ → (legend の ゴゴゴ) → はなつ（ためおわりに）
        const ids = sounds.map(([, id]) => id);
        assert.equal(ids[0], `ax_c_${T.kind}`, tag);
        assert.equal(ids.includes('ax_c_legend'), T.tier === 'legend' && T.kind === 'ki', `${tag}: ゴゴゴは 伝説の 気だけ`);
        const rel = sounds.find(([, id]) => id === axDef(anim).sfx);
        assert.ok(rel && rel[0] >= T.charge - 16 && rel[0] <= T.charge + 32, `${tag}: はなつ 音は ためおわりに（${rel?.[0]}）`);
      }
    }
  }
  // たたかいの 速さ 2 … はなつのも はんぶんの 時間
  const fx = new Effects();
  fx.tempo = 2;
  let at = null;
  let clock2 = 0;
  fx.play('ax_demo_beam', ONE, null, { fromAlly: true, from: ALLY_FROM, sfx: (id) => { if (id === 'ax_beam') at = clock2; } });
  runFx(fx, 4000, (now) => { clock2 = now; });
  assert.ok(at !== null && Math.abs(at - KI_CHARGE_MS.legend / 2) <= 32, `速さ 2: ${at}`);
  // 的が ない・とうろく していない anim は false（ほかの えんしゅつへ）。party の 技は 的が なくても 画面の 下に
  assert.equal(playAxFx(new Effects(), 'ax_demo_beam', [], null, {}), false);
  assert.equal(playAxFx(new Effects(), 'fire1', ONE, null, {}), false);
  assert.equal(playAxFx(new Effects(), 'ax_t_party', [], null, {}), true);
  // play が エラーでも たたかいは とまらない（しろい しるしだけ）
  registerAx('ax_t_broken', { charge: false, play() { throw new Error('わざと'); } });
  const err = console.error;
  console.error = () => {};
  try {
    const f2 = new Effects();
    assert.equal(playAxFx(f2, 'ax_t_broken', ONE, null, {}), true);
    assert.ok(f2.parts.length > 0);
  } finally { console.error = err; }
  // 敵の ためる すがた（enemyfx の 'buff' を ためる 時間）
  const enemy = { boss: false };
  assert.equal(axEnemyPose(enemy, 'ax_demo_slash'), 0);
  assert.equal(enemy.act.kind, 'buff');
  assert.equal(enemy.act.dur, TIER_CHARGE_MS.super + 120);
  const e2 = {};
  axEnemyPose(e2, 'ax_t_party');
  assert.equal(e2.act, undefined, 'ためない 技は ふつうの うごき');
  // ctx の 中み
  let ctx = null;
  registerAx('ax_t_ctx', { tier: 'super', charge: false, hit: 222, len: 600, stagger: 90, pal: 'fire', play(f, c) { ctx = c; } });
  playAxFx(new Effects(), 'ax_t_ctx', THREE, 'ice', { fromAlly: false, from: FOE_FROM, crit: true });
  assert.equal(ctx.dir, 'down');
  assert.equal(ctx.foe, true);
  assert.equal(ctx.n, 3);
  assert.equal(ctx.all, true);
  assert.equal(ctx.hit, 222);
  assert.equal(ctx.tier, 'super');
  assert.equal(ctx.element, 'ice');
  assert.equal(ctx.pal, PAL.fire);
  assert.equal(ctx.from.x, FOE_FROM.x);
  assert.ok(Math.abs(ctx.sz - 0.85 * 1.2 * 1.15) < 1e-9);
  const ds = [];
  ctx.each((t, i, d) => ds.push(d));
  assert.deepEqual(ds, [0, 90, 180]);
  for (const name of Object.keys(KIT_FNS)) assert.equal(typeof ctx.k[name], 'function', `ctx.k.${name}`);
});

test('第48回: 音（ためかた ごと・legend・はなつ 音）', () => {
  const ids = [...CHARGE_KINDS.map((k) => `ax_c_${k}`), 'ax_c_legend', ...Object.values(AX_DEMO).map((d) => d.sfx)];
  for (const id of ids) assert.equal(typeof SFX_AX[id], 'function', id);
  const audio = src('../public/js/client/audio.js');
  for (const id of Object.keys(SFX_AX)) {
    assert.match(id, /^ax_/);
    assert.ok(!audio.includes(`case '${id}':`), `${id} が audio.js の 音と かさなる`);
  }
  for (const [id, fn] of Object.entries(SFX_AX)) {
    const calls = [];
    const a = { tone: (...x) => calls.push(x), noise: (...x) => calls.push(x) };
    fn(a, a.tone);
    assert.ok(calls.length > 0, id);
    for (const c of calls) for (const v of c) if (typeof v === 'number') assert.ok(Number.isFinite(v), id);
  }
  assert.match(audio, /SFX_AX\[id\]\(this, T\)/);
});

test('第48回: battle.js・battlefx.js の つなぎ（え だけ。ダメージの 数は はなって あたった ときに）', () => {
  const fx = src('../public/js/client/render/battlefx.js');
  assert.match(fx, /import \{ playAxFx \} from '\.\/axfx\.js'/);
  assert.match(fx, /Object\.assign\(FINE, AX_FINE\)/);
  // play() の いちばん はじめ
  const play = fx.slice(fx.indexOf('  play(anim, targets, element, opts = {}) {'));
  assert.ok(play.indexOf('playAxFx(this, anim') < play.indexOf('playPokemonFx(this, anim'), 'play() の さいしょに 大技');
  assert.match(fx, /if \(p\.top\) \{ \(tops \|\| \(tops = \[\]\)\)\.push\(p\); continue; \}/, 'top の つぶは いちばん 上に');
  const b = src('../public/js/client/battle.js');
  assert.match(b, /from '\.\/render\/axfx\.js'/);
  assert.match(b, /ev\.axAnim = axEventAnim\(ev\)/);
  assert.match(b, /const anim = ev\.axAnim \|\| sigAnim\(ev\.ability\)/);
  assert.match(b, /hitDelay = axT \? axT\.hitAt : r27Hit/);
  assert.match(b, /this\.fx\.at\(hitDelay, apply\)/, '大技の ダメージは エフェクトの 時計で');
  assert.match(b, /left: Math\.max\(350, \(ev\.dur \|\| 900\) \* 0\.75, ev\.axHold \|\| 0\)/, 'つぎの 行動は あたる まで まつ');
  assert.match(b, /ev\.axHold \? ev\.axHold \+ 200 : 0/, '名前の ふだは あたる まで');
  assert.match(b, /axEnemyPose\(actor, ev\.axAnim/);
  assert.match(b, /PK_ANIMS\.has\(anim\) \|\| DQ_ANIMS\.has\(anim\) \|\| !!axT/, '敵が みんなに');
  assert.match(b, /if \(axAllyFx\(anim\)\) return axAllyFx\(anim\);/);
  assert.match(b, /axHp\.set\(c\.id, \[oldHp, c\.hp\]\); c\.hp = oldHp;/, 'ためて いる 間の HPは まえの まま');
  assert.match(b, /const sfxId = axT \? null :/);
  // ATB（ゲージ）は サーバーの 'g' で きまる まま
  assert.match(b, /case 'g':\n\s+for \(const \[id, v\] of Object\.entries\(ev\.g\)\) \{\n\s+const c = this\.c\.get\(id\);\n\s+if \(c\) c\.atb = v;/);
});

test('第48回: たたかいの 中み（shared/）は かわらない', () => {
  const root = new URL('../public/js/shared/', import.meta.url).pathname;
  const walk = (d, out = []) => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) walk(p, out); else if (n.endsWith('.js')) out.push(p); } return out; };
  for (const f of walk(root)) {
    const s = readFileSync(f, 'utf8');
    assert.ok(!/from '[^']*(axfx|axkit|axcharge|ax-demo)/.test(s) && !s.includes('ax_demo'), `${f} が 大技エンジンを 見ている`);
  }
  // 行動の 時間（lock）の けいさんは そのまま
  const sh = src('../public/js/shared/battle.js');
  assert.match(sh, /this\.axMark\(c, ev\);\n\s+this\.lock = this\.pace\(450, 380, ev\.lines\.length, 900\) \+ \(ev\.extraLock \|\| 0\) \/ this\.speed;/);
  // おためしの 技は どの 技にも つないで いない
  const data = readdirSync(new URL('../public/js/shared/data/', import.meta.url)).map((n) => readFileSync(new URL(`../public/js/shared/data/${n}`, import.meta.url), 'utf8')).join('\n');
  assert.ok(!data.includes('ax_demo_'), 'ax_demo_ は データに ない');
});

test('第48回: 見る どうぐ（tools/fx-preview.mjs）と てびき', () => {
  const tool = new URL('../tools/fx-preview.mjs', import.meta.url).pathname;
  assert.ok(existsSync(tool));
  const r = spawnSync(process.execPath, [tool, '--help'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /--frames/);
  assert.match(r.stdout, /--all/);
  const s = readFileSync(tool, 'utf8');
  assert.match(s, /\/opt\/node22\/lib\/node_modules\/playwright\/index\.mjs/);
  assert.ok(!existsSync(new URL('../public/fx-preview.html', import.meta.url)), 'public/ に 試しの ページを おかない');
  assert.match(src('../.gitignore'), /^fx-out\/$/m);
  const doc = src('../docs/plan-r48-fx-engine.md');
  assert.match(doc, /エンジンの使い方/);
  for (const k of ['registerAx', 'useAxGroup', 'axTiming', 'fx-preview', ...CHARGE_KINDS]) assert.ok(doc.includes(k), `てびきに ${k}`);
});
