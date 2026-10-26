// 第48回: 大技（ax_〜）の グループの しらべかた（test/ax-groups.test.js と test/ax-gN.test.js が つかう。*.test.js では ないので これだけでは うごかない）
// ・groupReport('g1') … G1 の 表（shared/data/ax-time-g1.js）と え（render/axfx-g1.js）・音（client/sfx-ax-g1.js）を ぜんぶ しらべて problems（日本語の 文の ならび）を かえす
// ・playAx(anim, pts, opts) … にせの キャンバスで 1回 うごかして { fx, maxParts, t, log, errors, nearHit } を かえす（グループの 決め手の テストに）
// きまりは docs/plan-r48-fx.md の「G0 の 決めごと」
import { readFileSync } from 'node:fs';
import { Effects, BW, BH } from '../public/js/client/render/battlefx.js';
import { isAx, axDef, axTiming, axGroupList, axGroupFine } from '../public/js/client/render/axfx.js';
import { AX_FINE } from '../public/js/client/render/axkit.js';
import { AX_GROUPS, AX_TIME, AX_BUDGET, AX_BUDGET_TOL, AX_DUAL_TOTAL, AX_TIERS, AX_CHARGE_KINDS, axPlan, axTimeOf, axGroupOf, axBudget } from '../public/js/shared/ax-time.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { DUAL_TECHS } from '../public/js/shared/data/dual.js';
import { SFX_AX, SFX_AX_GROUP } from '../public/js/client/sfx-ax.js';
import { SFX_R26 } from '../public/js/client/sfx-r26.js';
import { SFX_R27 } from '../public/js/client/sfx-r27.js';
import { SFX_R29 } from '../public/js/client/sfx-r29.js';
import { SFX_R33 } from '../public/js/client/sfx-r33.js';
import { SFX_PK } from '../public/js/client/sfx-pokemon.js';
import { SFX_DQ } from '../public/js/client/sfx-dqm.js';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const AUDIO_SRC = read('../public/js/client/audio.js');

// たたかいの がめんに かく ための ブラウザの まね（NaN と マイナスの 半径を かぞえる）
export function fakeCtx() {
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
if (!('document' in globalThis)) {
  const sprite = fakeCtx();
  globalThis.document = { createElement: () => ({ width: 64, height: 64, getContext: () => sprite.ctx }) };
}

export const ONE = [{ x: 128, y: 66 }];
export const THREE = [{ x: 60, y: 70 }, { x: 128, y: 82 }, { x: 196, y: 70 }];
export const FIVE = [{ x: 30, y: 60 }, { x: 80, y: 74 }, { x: 128, y: 66 }, { x: 176, y: 74 }, { x: 226, y: 60 }];
export const ALLY1 = [{ x: BW / 2, y: BH - 22 }];
export const ALLY4 = [0, 1, 2, 3].map((i) => ({ x: BW / 2 + (i - 1.5) * 58, y: BH - 22 }));
export const ALLY_FROM = { x: 99, y: BH - 22 };
export const FOE_FROM = { x: 128, y: 86, w: 40, h: 44, foot: 120 };

// きまった らんすう（おなじ たね なら おなじ つぶの かず）
function seeded(seed, fn) {
  const real = Math.random;
  let s = seed;
  Math.random = () => (s = (s * 16807) % 2147483647) / 2147483647;
  try { return fn(); } finally { Math.random = real; }
}

const SKIP_POS = new Set(['flash', 'shake', 'call', 'axTint', 'axBand', 'axFreeze', 'trail']);
// 1回 うごかす。opts: playAxFx の opts（fromAlly・from・ability・crit・repeat・dual・n）＋ seed・tempo・hitWin（あたる 時間 ms。その ±150ms に 的の 近くで 光る つぶを さがす）
export function playAx(anim, pts, opts = {}) {
  const { seed = 7, tempo = 1, hitWin = null, ...o } = opts;
  return seeded(seed, () => {
    const fx = new Effects();
    fx.tempo = tempo;
    const errors = [];
    const err = console.error;
    console.error = (...a) => errors.push(a.map(String).join(' '));
    const { ctx, log } = fakeCtx();
    let t = 0, maxParts = 0, nearHit = false, far = null;
    try {
      fx.play(anim, pts, o.element || null, { fromAlly: true, from: o.fromAlly === false ? FOE_FROM : ALLY_FROM, ...o });
      maxParts = fx.parts.length;
      while ((fx.parts.length || fx.bolts.length) && t < 9000) {
        fx.update(16);
        t += 16;
        maxParts = Math.max(maxParts, fx.parts.length);
        if (t % 32 === 0) fx.draw(ctx);
        if (hitWin !== null && !nearHit && Math.abs(t - hitWin) <= 150 && pts[0]) {
          nearHit = fx.parts.some((p) => !(p.delay > 0) && !SKIP_POS.has(p.kind) && Number.isFinite(p.x) && Math.hypot(p.x - pts[0].x, p.y - pts[0].y) < 28);
        }
        if (!far && t % 64 === 0) {
          const p = fx.parts.find((q) => !(q.delay > 0) && !SKIP_POS.has(q.kind) && Number.isFinite(q.x) && Number.isFinite(q.y) && (q.x < -140 || q.x > BW + 140 || q.y < -140 || q.y > BH + 140));
          if (p) far = `${p.kind}(${Math.round(p.x)},${Math.round(p.y)})`;
        }
      }
    } catch (e) {
      errors.push(String(e && e.stack || e));
    } finally {
      console.error = err;
    }
    return { fx, t, maxParts, log, errors, nearHit, far };
  });
}

// 音が ある（sfx-ax.js・ほかの 音の 表・audio.js の case）
export function sfxExists(id) {
  return !!(SFX_AX[id] || SFX_R26[id] || SFX_R27[id] || SFX_R29[id] || SFX_R33[id] || SFX_PK[id] || SFX_DQ[id] || AUDIO_SRC.includes(`case '${id}':`));
}

// 技の id（'id@masc'・'dt_〜'）が データに ある
export function skillExists(key) {
  const id = key.replace(/@masc$/, '');
  return !!(id.startsWith('dt_') ? DUAL_TECHS[id] : ABILITIES[id]);
}
const isDualKey = (key) => key.startsWith('dt_');
// 味方・自分に かける 技（データの target）
const ALLY_TARGETS = new Set(['ally', 'allies', 'self', 'deadAlly', 'deadAllies']);
export function isSupportKey(key, anim) {
  const id = key.replace(/@masc$/, '');
  if (axDef(anim)?.party) return true;
  const t = isDualKey(id) ? DUAL_TECHS[id]?.target : ABILITIES[id]?.target;
  return ALLY_TARGETS.has(t);
}

// 漢字（「人」の ほか）が 文字の 中に ある か（コメントは のぞく）
export function kanjiProblems(src, file) {
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map((l) => l.replace(/(^|[^:'"`\\])\/\/.*$/, '$1')).join('\n');
  const out = [];
  for (const m of code.matchAll(/(['"`])((?:\\.|(?!\1).)*?)\1/g)) {
    if (/\$\{/.test(m[2]) && m[1] === '`') continue;
    const k = [...m[2]].filter((ch) => /\p{Script=Han}/u.test(ch) && ch !== '人');
    if (k.length) out.push(`${file}: 文字に 漢字 ${k.join('')}（「${m[2].slice(0, 20)}」。画面の 文字は カタカナ・ひらがな・記号、漢字は 人 だけ）`);
  }
  return out;
}

const within = ([lo, hi], v, tol = AX_BUDGET_TOL) => v >= lo - tol && v <= hi + tol;

// 1つの 技（キー）の 時間・予算・うごき。problems に 文を 足す
function checkSkill(group, key, s, problems, opts = {}) {
  const anim = s.anim;
  const tag = `${group} ${key}→${anim}`;
  const dual = isDualKey(key);
  const P = axPlan(anim, { key, n: 1, dual });
  if (!P) { problems.push(`${tag}: 時間の 表に ない`); return null; }
  // 段の 予算（第49回: ため は ki だけ 気の 長さ、ほかは 構え 300ms まで。合体技は ため なしで AX_DUAL_TOTAL）
  const B = axBudget(P.tier, P.kind);
  if (dual) {
    if (P.charge !== 0) problems.push(`${tag}: 合体技は ため なし`);
    if (!within(AX_DUAL_TOTAL, P.total)) problems.push(`${tag}: 合体技の 長さ ${P.total}ms が 予算 ${AX_DUAL_TOTAL.join('〜')}ms（±${AX_BUDGET_TOL}）の そと`);
  } else {
    const kk = P.kind === 'ki' ? '気' : '構え';
    if (!within(B.charge, P.charge)) problems.push(`${tag}: ため（${kk}）${P.charge}ms が ${P.tier} の 予算 ${B.charge.join('〜')}ms（±${AX_BUDGET_TOL}）の そと`);
    if (P.kind !== 'ki' && P.charge > AX_BUDGET[P.tier].charge[1]) problems.push(`${tag}: 構えの ため ${P.charge}ms が 上限 ${AX_BUDGET[P.tier].charge[1]}ms より 長い`);
    if (!within(B.len, P.len)) problems.push(`${tag}: len ${P.len}ms が ${P.tier} の 予算 ${B.len.join('〜')}ms（±${AX_BUDGET_TOL}）の そと`);
    if (!within(B.total, P.total)) problems.push(`${tag}: 合計 ${P.total}ms が ${P.tier} の 予算 ${B.total.join('〜')}ms（±${AX_BUDGET_TOL}）の そと`);
  }
  // 気（ki）は ドラゴンボールの 技だけ（G1）
  if (P.kind === 'ki' && /^g[2-6]$/.test(group)) problems.push(`${tag}: ためかた ki は ドラゴンボール（G1）だけ`);
  if (!(P.release < P.len)) problems.push(`${tag}: hit（${P.release}）は len（${P.len}）より 前`);
  // クライアントの 時間 ＝ サーバーの 時間（1つの 表から）
  for (const o of [{ n: 1 }, { n: 3, crit: true }, { n: 1, repeat: true }, { n: 4, speed: 0.6 }, { n: 2, speed: 1.25 }]) {
    const SP = axPlan(anim, { key, dual, ...o });
    const tempo = o.speed || 1;
    const CT = axTiming(anim, { ability: key, dual, targets: o.n, crit: o.crit, repeat: o.repeat, tempo });
    for (const k of ['charge', 'hit', 'len', 'total', 'end', 'tier']) if (SP[k] !== CT[k]) problems.push(`${tag}: ${JSON.stringify(o)} の ${k} が サーバー ${SP[k]} と クライアント ${CT[k]} で ちがう`);
    if (Math.abs(CT.endReal - SP.realMs / tempo) > 2) problems.push(`${tag}: ${JSON.stringify(o)} の 見える 長さが ちがう`);
    // サーバーの 待ち時間（pace の 900 ＋ lockMs）は 余韻の さいご 200ms より 前に つぎを 出さない
    if ((900 + SP.lockMs) / tempo < SP.realMs / tempo - 200) problems.push(`${tag}: ${JSON.stringify(o)} の 待ち時間が たりない`);
  }
  if (P.charge && axPlan(anim, { key, repeat: true }).charge !== Math.round(P.charge * 0.5)) problems.push(`${tag}: 2回目の ため が 半分で ない`);
  // おそい 設定でも 0.85 の 速さ
  const slow = axPlan(anim, { key, dual, speed: 0.6 }), mid = axPlan(anim, { key, dual, speed: 0.85 });
  if (Math.abs(slow.realMs / 0.6 - mid.realMs / 0.85) > 3) problems.push(`${tag}: 速さ 0.6 の 長さが 0.85 と ちがう`);
  if (opts.play === false) return P;
  // うごき: 敵1体・3体・5体（会心）・敵が 味方に（1人・4人）・味方に かける（1人・4人）
  const support = isSupportKey(key, anim);
  const runs = support
    ? [{ pts: ALLY1, o: { fromAlly: true } }, { pts: ALLY4, o: { fromAlly: true } }]
    : [
      { pts: ONE, o: { fromAlly: true }, main: true }, { pts: THREE, o: { fromAlly: true } }, { pts: FIVE, o: { fromAlly: true, crit: true } },
      ...(dual ? [] : [{ pts: ALLY1, o: { fromAlly: false, toParty: true } }, { pts: ALLY4, o: { fromAlly: false, toParty: true } }]),
    ];
  let mainParts = 0;
  for (const { pts, o, main } of runs) {
    const T = axPlan(anim, { key, dual, n: pts.length, crit: o.crit });
    const r = playAx(anim, pts, { ...o, ability: key, dual, n: pts.length, hitWin: main ? T.hit : null });
    const rt = `${tag} ${o.fromAlly ? (support ? '味方に' : '敵') : '敵→味方'}${pts.length}${o.crit ? ' 会心' : ''}`;
    if (r.errors.length) problems.push(`${rt}: エラー ${r.errors[0].slice(0, 160)}`);
    if (r.log.nan.length) problems.push(`${rt}: NaN（${[...new Set(r.log.nan)].join(',')}）`);
    if (r.log.neg.length) problems.push(`${rt}: マイナスの 半径`);
    if (r.far) problems.push(`${rt}: つぶが 画面から とおい ${r.far}`);
    if (r.t > T.end + 300) problems.push(`${rt}: ${r.t}ms まで のこる（end ${T.end}ms ＋300 まで）`);
    if (r.t < T.hit) problems.push(`${rt}: あたる（${T.hit}ms）前に おわる`);
    const bt = dual ? 'super' : T.tier;
    const cap = Math.round(AX_BUDGET[bt].parts[1] * 1.1);
    if (r.maxParts > cap) problems.push(`${rt}: 同時の つぶ ${r.maxParts}こ が ${bt} の 上限 ${AX_BUDGET[bt].parts[1]}（＋10%）より 多い`);
    if (main) {
      mainParts = r.maxParts;
      if (!r.nearHit) problems.push(`${rt}: あたる 時間（${T.hit}ms）の ±150ms に 的の 近く（28px）で 光る つぶが ない`);
    }
    if (support && pts === ALLY1) mainParts = r.maxParts;
  }
  const bt = dual ? 'super' : P.tier;
  const lo = AX_BUDGET[bt].parts[0] * (support ? 0.5 : 1);
  if (mainParts < lo) problems.push(`${tag}: 同時の つぶ ${mainParts}こ が ${bt} の 下限 ${lo}${support ? '（補助は 半分）' : ''} より 少ない（ふつうの 攻撃より 豪華に）`);
  return { ...P, maxParts: mainParts };
}

// グループ ぜんぶ。へんじ: { anims, skills, problems, plans: { key: plan } }
export function groupReport(group, opts = {}) {
  const G = AX_GROUPS[group] || { time: {}, skills: {}, families: {} };
  const problems = [];
  const anims = Object.keys(G.time);
  // 表と え
  for (const anim of anims) {
    if (!isAx(anim)) problems.push(`${group} ${anim}: え が とうろく されて いない（render/axfx-${group}.js の AX_${group.toUpperCase()} に 書く）`);
    else if (axDef(anim).group !== group) problems.push(`${group} ${anim}: え が ${axDef(anim).group} に ある`);
    const e = G.time[anim];
    if (!AX_TIERS.includes(e.tier)) problems.push(`${group} ${anim}: tier`);
    if (e.charge && e.charge.kind && !AX_CHARGE_KINDS.includes(e.charge.kind)) problems.push(`${group} ${anim}: charge.kind`);
    if (anim.startsWith('ax_demo') || anim.startsWith('ax__')) problems.push(`${group} ${anim}: ax_demo・ax__ は G0 の おためし`);
  }
  for (const anim of axGroupList(group)) if (!axTimeOf(anim) || axGroupOf(anim) !== group) problems.push(`${group} ${anim}: 時間の 表（shared/data/ax-time-${group}.js）に ない`);
  // え の 音
  for (const anim of anims) {
    const d = axDef(anim);
    if (!d) continue;
    const rel = typeof d.sfx === 'string' ? d.sfx : d.sfx?.release;
    if (!rel) problems.push(`${group} ${anim}: はなつ 音（sfx）が ない`);
    else if (!sfxExists(rel)) problems.push(`${group} ${anim}: 音 ${rel} が ない（client/sfx-ax-${group}.js に 書く）`);
    if (d.charge?.sfx && !sfxExists(d.charge.sfx)) problems.push(`${group} ${anim}: ためる 音 ${d.charge.sfx} が ない`);
  }
  for (const [id, g] of Object.entries(SFX_AX_GROUP)) if (g === group && !id.startsWith(`ax_${group}_`)) problems.push(`${group}: 音の なまえ ${id}`);
  for (const k of axGroupFine(group)) if (!k.startsWith(group) || typeof AX_FINE[k] !== 'function') problems.push(`${group}: つぶの なまえ ${k}`);
  // 技の つなぎ
  const used = new Map();
  for (const [key, s] of Object.entries(G.skills)) {
    if (!skillExists(key)) problems.push(`${group} ${key}: その 技（合体技）は データに ない`);
    if (!(s.anim in G.time)) problems.push(`${group} ${key}: ${s.anim} が この グループの 時間の 表に ない`);
    if (key.endsWith('@masc') && !G.skills[key.replace(/@masc$/, '')] && !AX_TIME[s.anim]) problems.push(`${group} ${key}: 男の子の 版だけ`);
    const sig = JSON.stringify(s.over || {});
    if (!used.has(s.anim)) used.set(s.anim, []);
    for (const [k2, sig2] of used.get(s.anim)) if (sig2 === sig) problems.push(`${group} ${key}: ${k2} と おなじ ${s.anim}（技ごとに 自分の anim。共有する なら tier・vars で ちがいを つける）`);
    used.get(s.anim).push([key, sig]);
  }
  // 時間・予算・うごき
  const plans = {};
  for (const [key, s] of Object.entries(G.skills)) if (s.anim in G.time && isAx(s.anim)) plans[key] = checkSkill(group, key, s, problems, opts);
  for (const anim of anims) if (isAx(anim) && !Object.values(G.skills).some((s) => s.anim === anim)) checkSkill(group, `(${anim})`, { anim }, problems, { play: false });
  // なかま: 下から 上へ 段・長さ・つぶが へらない
  for (const [name, list] of Object.entries(G.families)) {
    const ps = list.map((anim) => {
      if (!(anim in G.time) || !isAx(anim)) { problems.push(`${group} なかま ${name}: ${anim} が ない`); return null; }
      const key = Object.values(G.skills).find((s) => s.anim === anim)?.key;
      const P = (key && plans[key]) || axPlan(anim, { n: 1 });
      return { anim, tier: AX_TIERS.indexOf(P.tier), total: P.total, parts: P.maxParts ?? playAx(anim, axDef(anim).party ? ALLY1 : ONE, { ability: key }).maxParts };
    });
    for (let i = 1; i < ps.length; i++) {
      const [a, b] = [ps[i - 1], ps[i]];
      if (!a || !b) continue;
      if (b.tier < a.tier) problems.push(`${group} なかま ${name}: ${b.anim} の 段が ${a.anim} より 下`);
      if (b.total < a.total) problems.push(`${group} なかま ${name}: ${b.anim} の 長さ ${b.total} が ${a.anim} の ${a.total} より みじかい`);
      if (b.parts < a.parts * 0.95) problems.push(`${group} なかま ${name}: ${b.anim} の つぶ ${b.parts} が ${a.anim} の ${a.parts} より 少ない`);
    }
  }
  // 画面の 文字の 漢字（グループの え の ファイル）
  if (opts.kanji !== false && /^g\d$/.test(group)) {
    const files = [`../public/js/client/render/axfx-${group}.js`];
    const src = read(files[0]);
    for (const m of src.matchAll(/from '\.\/(axfx-g\d-[\w-]+\.js)'/g)) files.push(`../public/js/client/render/${m[1]}`);
    for (const f of files) problems.push(...kanjiProblems(f === files[0] ? src : read(f), f.replace('../public/js/', '')));
  }
  return { anims, skills: Object.keys(G.skills), problems, plans };
}
