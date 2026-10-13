// 2026年10月（第27回）: 職業・ひらめき技・合体技
//  ・将軍の 上に 伝説の職業「暴れんぼう将軍」（将軍＋ほかの 超級職 1つ。「坊」は 習わない 漢字なので「暴れんぼう将軍」）
//  ・ひらめき技は 上級職より 上の ぜんぶの 職業に（第26回の 基本職 4つにも）
//  ・新しい 職業と 前からの 職業の 合体技 10こ（ぜんぶで 35こ いない）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  JOBS, JOB_ORDER, SUPER_ORDER, LEGEND_ORDER, ALL_JOBS, JOB_MAX_LEVEL, JOB_HINTS, jobReqText, jobAncestry,
} from '../public/js/shared/data/jobs.js';
import { ABILITIES, abilityRole } from '../public/js/shared/data/abilities.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
import { HIRA_R27_ABILITIES, HIRAMEKI_R27 } from '../public/js/shared/data/hirameki-r27.js';
import { HIRA_JOB_ABILITIES } from '../public/js/shared/data/hirameki-jobs.js';
import { JOB7_ABILITIES } from '../public/js/shared/data/abilities-jobs7.js';
import { DUAL_TECHS, DUAL_ORDER, DUAL_GROUP_NAMES, dualSize, dualRelated } from '../public/js/shared/data/dual.js';
import {
  newCharacter, changeJob, jobUnlocked, jobKnown, gainExp, expForLevel, fullHeal, learnedAbilities, hiraAllowed, hiraRelated, partyJobSet, weaponOk,
} from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { paintHero } from '../public/js/client/render/hero.js';
import { outfitOf, jobBody } from '../public/js/client/render/hero-outfit.js';
import { lookToOpts } from '../public/js/client/render/chars.js';
import { Effects, BW, BH } from '../public/js/client/render/battlefx.js';
import { playJob4Fx } from '../public/js/client/render/battlefx-jobs4.js';
import { playJob5Fx, JOB5_SFX, JOB5_FINE, SIG5 } from '../public/js/client/render/battlefx-jobs5.js';
import { DUAL_FX } from '../public/js/client/render/dualfx.js';
import { checkText } from '../tools/kanji-check.mjs';

const tierOf = (j) => JOBS[j].tier || 0;
const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
const masterChain = (c, jid) => {
  for (const r of JOBS[jid].req || []) { master(c, r); masterChain(c, r); }
  if (JOBS[jid].reqSuper) master(c, 'god_hand');
};
const SCOPE = {
  enemy: /敵1体/, group: /同じ種類の敵/, enemies: /敵全体|敵にランダム/, ally: /仲間1人/, allies: /仲間全員/, self: /自分/, deadAlly: /仲間1人/,
};
const ALL_CAP = [1.15, 1.25, 1.4, 1.4];
const ALL_MULTI_CAP = [1.12, 1.2, 1.3, 1.35];
const partsOf = (e) => (e.type === 'multi' ? e.parts : [e]);
const lines = (e) => partsOf(e).flatMap((p) => [p.msg, p.failMsg]).filter(Boolean);
const R26_BASIC = ['spy', 'shonen_tantei', 'neko_robot', 'kappa'];
const NEW_HIRA = Object.keys(HIRA_R27_ABILITIES);
const NEW_DUAL = ['dt_hannin', 'dt_nantoka', 'dt_kyuuri_zushi', 'dt_point10', 'dt_nichirin', 'dt_nenriki_meteor', 'dt_okusuri', 'dt_megumi', 'dt_hakkeyoi', 'dt_nazo'];
// 第26回の 20この 職業と 暴れんぼう将軍
const NEW_JOBS = ['rakuten_cardman', 'kisatsu', 'enbashira', 'hinokami', 'spy', 'assassin', 'black_org', 'esper', 'shonen_tantei', 'oshiri_tantei',
  'meitantei', 'creator', 'neko_robot', 'mimi_robot', 'doraemon', 'kappa', 'hanakappa', 'kinniku_kappa', 'konoha', 'hokage', 'abarenbo_shogun'];

// その 職業の キャラ（＋仲間）の たたかい。敵は 何も しない
function setup(job, { seed = 1, enemies = ['rockman', 'rockman', 'skeleton'], mateJob = 'priest', lv = 45, hooks } = {}) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job: 'warrior' });
  gainExp(c, expForLevel(lv));
  masterChain(c, job);
  master(c, job);
  c.job = job;
  c.equip.weapon = null;
  fullHeal(c);
  const mate = newCharacter({ id: 'm1', name: 'ミナ', job: 'priest' });
  gainExp(mate, expForLevel(lv));
  if (mateJob !== 'priest') { masterChain(mate, mateJob); master(mate, mateJob); mate.job = mateJob; }
  mate.equip.weapon = null;
  fullHeal(mate);
  const b = new Battle({ rng: makeRng(seed), allies: [{ char: c, controller: 's1' }, { char: mate, auto: true, kind: 'support' }], enemies, canFlee: true, hooks });
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 50000; }
  for (const a of b.allies) a.mp = a.maxMp = 999;
  return { b, c, mate, me: b.allies[0], m: b.allies[1] };
}
const readyUp = (b, a) => { for (let i = 0; i < 1200 && !a.ready; i++) b.tick(50); return a.ready; };
const runUntilAct = (b, id) => {
  const evs = [];
  for (let i = 0; i < 400 && !evs.some((e) => e.t === 'act' && e.id === id); i++) evs.push(...b.tick(50));
  return evs.find((e) => e.t === 'act' && e.id === id);
};

// ───────────── 暴れんぼう将軍 ─────────────
test('暴れんぼう将軍: 将軍の 上の 伝説の職業（将軍＋ほかの 超級職 1つ）・名前・神殿の うわさ', () => {
  const j = JOBS.abarenbo_shogun;
  assert.equal(j.id, 'abarenbo_shogun');
  assert.equal(j.name, '暴れんぼう将軍', '「坊」は 小学校で 習わない ので ひらがな');
  assert.equal(j.tier, 3);
  assert.deepEqual(j.req, ['shogun']);
  assert.equal(j.reqSuper, 1);
  assert.ok(LEGEND_ORDER.includes('abarenbo_shogun') && ALL_JOBS.filter((x) => x === 'abarenbo_shogun').length === 1);
  assert.ok(JOB_HINTS.abarenbo_shogun);
  assert.match(jobReqText('abarenbo_shogun'), /将軍Lv10＋ほかの超級職1つLv10/);
  for (const s of [j.name, j.desc, JOB_HINTS.abarenbo_shogun]) assert.deepEqual(checkText(s), [], s);
  assert.deepEqual(checkText(j.kana).filter((p) => p.kind !== 'kana'), []);
  // なれる じゅんばん: サムライ・忍者 → 将軍 → 暴れんぼう将軍（＋ほかの 超級職）
  const c = newCharacter({ id: 'u', name: 'シン', job: 'warrior' });
  master(c, 'warrior', 'monk', 'samurai', 'ninja');
  assert.equal(jobKnown(c, 'abarenbo_shogun'), false, 'まだ ひみつ');
  master(c, 'shogun');
  assert.equal(jobKnown(c, 'abarenbo_shogun'), true, '将軍を きわめると うわさ');
  assert.equal(jobUnlocked(c, 'abarenbo_shogun'), false, '将軍だけでは まだ');
  master(c, 'konoha');
  assert.equal(jobUnlocked(c, 'abarenbo_shogun'), true);
  assert.equal(changeJob(c, 'abarenbo_shogun').ok, true);
  assert.ok(learnedAbilities(c).includes('ab_mineuchi'));
});

test('暴れんぼう将軍: 強さは 今の 伝説の職業と 同じ くらい・技 6こ（攻撃技 3こ）・看板の 技「成敗！」', () => {
  const sum = (x) => Object.values(JOBS[x].mods).reduce((a, b) => a + b, 0);
  const legends = LEGEND_ORDER.filter((x) => x !== 'abarenbo_shogun').map(sum);
  const sup = SUPER_ORDER.map(sum);
  assert.ok(sum('abarenbo_shogun') > Math.max(...sup), '超級職より 強い');
  assert.ok(sum('abarenbo_shogun') >= Math.min(...legends) && sum('abarenbo_shogun') <= Math.max(...legends), `伝説と 同じ くらい ${sum('abarenbo_shogun')}`);
  assert.ok(Object.values(JOBS.abarenbo_shogun.perLv).reduce((a, b) => a + b, 0) <= 3.5 + 1e-9);
  const learn = JOBS.abarenbo_shogun.learn;
  assert.ok(learn.length >= 5 && learn.length <= 6);
  assert.deepEqual(learn.map(([, id]) => id).sort(), Object.keys(JOB7_ABILITIES).sort());
  assert.equal(learn[learn.length - 1][1], 'abarenbo_shogun_sig');
  assert.equal(ABILITIES.abarenbo_shogun_sig.anim, 'abarenbo_shogun_sig');
  assert.equal(ABILITIES.abarenbo_shogun_sig.name, '成敗！');
  const mps = learn.map(([, id]) => ABILITIES[id].mp);
  assert.equal(Math.max(...mps), mps[mps.length - 1]);
  assert.ok(learn.filter(([, id]) => abilityRole(ABILITIES[id]) === 'dmg').length >= 3, '攻撃技');
  for (const n of ['みね打ちじゃ', '余の顔を見忘れたか', '成敗！']) assert.ok(learn.some(([, id]) => ABILITIES[id].name === n), n);
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden) names.set(a.name, [...(names.get(a.name) || []), id]);
  for (const [, id] of learn) {
    const a = ABILITIES[id];
    assert.equal(a.job, 'abarenbo_shogun');
    assert.match(a.desc, SCOPE[a.target], `${id}: ${a.desc}`);
    for (const s of [a.name, a.desc, a.cast, ...lines(a.effect)]) assert.deepEqual(checkText(s), [], `${id}: ${s}`);
    assert.deepEqual(checkText(a.kana).filter((p) => p.kind !== 'kana'), [], id);
    assert.equal(names.get(a.name).length, 1, a.name);
    for (const p of partsOf(a.effect)) {
      if (p.type === 'buff' && a.target === 'allies') assert.ok(p.mult <= ((p.stats || [p.stat]).length > 1 ? ALL_MULTI_CAP[3] : ALL_CAP[3]) + 1e-9, a.name);
      if (p.type === 'atbSet' && ['enemy', 'enemies'].includes(a.target)) assert.ok(p.chance > 0 && p.chance < 1, a.name);
    }
  }
});

test('暴れんぼう将軍: 技は ぜんぶ たたかいで 使える・みね打ちじゃ は たおさない・オートでも こわれない', () => {
  let n = 0;
  for (const [, id] of JOBS.abarenbo_shogun.learn) {
    const { b, me, m } = setup('abarenbo_shogun', { seed: ++n });
    assert.ok(readyUp(b, me));
    const a = ABILITIES[id];
    const r = b.command(me.id, { type: 'ability', id, target: a.target === 'ally' ? m.id : b.enemies[0].id }, 's1');
    assert.equal(r.ok, true, `${id} ${r.reason || ''}`);
    const act = runUntilAct(b, me.id);
    assert.ok(act, id);
    for (const l of act.lines) assert.deepEqual(checkText(l), [], `${id}: ${l}`);
    if (abilityRole(a) === 'dmg') assert.ok(act.results?.some((x) => x.dmg > 0), `${id} の ダメージ`);
  }
  // みね打ちじゃ: HPが 少ない 敵も たおさずに 1 のこる
  let left1 = 0;
  for (let seed = 1; seed <= 10; seed++) {
    const { b, me } = setup('abarenbo_shogun', { enemies: ['rockman'], seed });
    b.enemies[0].hp = 5;
    const ev = { lines: [], upd: [] };
    b.applyAbility(me, ABILITIES.ab_mineuchi, { target: b.enemies[0].id }, ev, 1);
    assert.equal(b.enemies[0].alive, true);
    if (b.enemies[0].hp === 1) left1++;
  }
  assert.ok(left1 >= 5, `HP 1 ${left1}/10`);
  // オートの 仲間
  const s = setup('abarenbo_shogun', { seed: 3 });
  s.me.abilities = learnedAbilities(s.c);
  for (let i = 0; i < 10; i++) {
    const cmd = decideAlly(s.b, s.me);
    assert.ok(cmd?.type, JSON.stringify(cmd));
  }
});

test('暴れんぼう将軍の みため: はかまに こんの 羽織・家もん・ちょんまげ・せんす（4つの むき）', () => {
  const look = { body: 0, style: 'short', hcol: 'black', tone: 'light', color: 0 };
  const O = outfitOf({ ...look, cloth: '#888888' }, 'abarenbo_shogun', 'cloth', false);
  assert.equal(O.kind, 'hakama');
  assert.ok(O.haori && O.sheath && O.spec.crest27, '羽織・刀・家もん');
  assert.equal(jobBody('abarenbo_shogun').hair, 'topknot');
  assert.equal(jobBody('abarenbo_shogun').prop, 'sensu');
  const plain = paintHero(look, 'shogun', undefined, 'down', 0, 4);
  const seen = new Set();
  for (const dir of ['down', 'left', 'up', 'right']) {
    const img = paintHero(look, 'abarenbo_shogun', undefined, dir, 0, 4);
    let n = 0;
    for (let i = 3; i < img.rgba.length; i += 4) if (img.rgba[i]) n++;
    assert.ok(n > img.w * img.h * 0.12, `${dir} が かけている`);
    seen.add(Buffer.from(img.rgba).toString('base64'));
  }
  assert.equal(seen.size, 4, '4つの むきが ちがう');
  assert.ok(!seen.has(Buffer.from(plain.rgba).toString('base64')), '将軍と ちがう');
  assert.equal(lookToOpts(look, 'abarenbo_shogun', { weapon: null, armor: 'cloth', shield: null, head: null, acc: null }).outfit, 'hakama');
});

// たたかいの がめんに かく ための ブラウザの まね
function fakeCtx() {
  const log = { calls: 0, nan: [] };
  let ctx;
  const fn = (name) => (...args) => {
    log.calls++;
    if (args.some((a) => typeof a === 'number' && !Number.isFinite(a))) log.nan.push(name);
    return ctx;
  };
  ctx = new Proxy({}, {
    get: (o, k) => (k in o ? o[k] : typeof k === 'string' ? fn(k) : undefined),
    set: (o, k, v) => { if (typeof v === 'number' && !Number.isFinite(v)) log.nan.push(String(k)); o[k] = v; return true; },
  });
  return { ctx, log };
}

test('看板の技「成敗！」の エフェクト: 単体・全体で 出て、すぐ あたり、1.8びょうで おわる・音', () => {
  assert.deepEqual([...SIG5], ['abarenbo_shogun_sig']);
  assert.equal(JOB5_SFX.abarenbo_shogun_sig, 'crit');
  assert.ok(Object.keys(JOB5_FINE).every((k) => k.startsWith('j5')));
  assert.equal(playJob4Fx(new Proxy({}, { get: () => () => undefined }), 'abarenbo_shogun_sig', [{ x: 100, y: 60 }], null, {}), false, 'jobs4 とは べつ');
  assert.equal(playJob5Fx(new Proxy({}, { get: () => () => undefined }), 'abarenbo_shogun_sig', [], null, {}), false);
  assert.equal(playJob5Fx(new Proxy({}, { get: () => () => undefined }), 'fire1', [{ x: 1, y: 1 }], null, {}), false);
  for (const ts of [[{ x: 128, y: 70 }], [{ x: 60, y: 70 }, { x: 128, y: 88 }, { x: 196, y: 70 }]]) {
    const fx = new Effects();
    fx.play('abarenbo_shogun_sig', ts, null, { crit: ts.length > 1, fromAlly: true });
    assert.ok(fx.parts.some((p) => p.kind === 'j5horse') && fx.parts.some((p) => p.kind === 'j5seibai'), '白い 馬と「成敗」');
    let hit = Infinity;
    for (const p of fx.parts) if (typeof p.x === 'number' && Math.hypot(p.x - ts[0].x, p.y - ts[0].y) < 24) hit = Math.min(hit, p.delay || 0);
    assert.ok(hit <= 120, `あたるのが おそい ${hit}`);
    for (const p of fx.parts) {
      if (typeof p.x !== 'number' || p.kind === 'flash' || p.kind === 'shake') continue;
      assert.ok(p.x > -60 && p.x < BW + 60 && p.y > -60 && p.y < BH + 60, `${p.kind} (${p.x},${p.y})`);
    }
    const { ctx, log } = fakeCtx();
    let t = 0;
    while (fx.parts.length && t < 4000) { fx.update(16); t += 16; if (t % 48 === 0) fx.draw(ctx); }
    assert.ok(t <= 1800, `ながい ${t}`);
    assert.ok(log.calls > 100);
    assert.deepEqual(log.nan, []);
  }
});

// ───────────── ひらめき技 ─────────────
// その 職業の ひらめき技（その 職業の 技か、上級職で ひらめく 掛け合わせ技）
const ownHira = (j) => Object.keys(HIRAMEKI).filter((id) => {
  const a = ABILITIES[id];
  if (a.kind === 'combo') return tierOf(j) === 1 && hiraAllowed({ job: j, jobs: {} }, id);
  return a.job === j;
});

test('ひらめき技: 上級職より 上の どの 職業にも（第26回の 基本職にも）その 職業の ひらめき技が ある', () => {
  const want = [...ALL_JOBS.filter((j) => tierOf(j) >= 1), ...R26_BASIC];
  assert.ok(want.length >= 80);
  for (const j of want) {
    const own = ownHira(j);
    assert.ok(own.length >= 1, `${JOBS[j].name} の ひらめき技`);
    const c = newCharacter({ id: 'x', name: 'x', job: 'warrior' });
    c.job = j;
    for (const id of own) assert.equal(hiraAllowed(c, id), true, `${JOBS[j].name} は ${ABILITIES[id].name} を ひらめける`);
  }
  // 足したのは 1つの 職業に 1〜2こ（今 ある ものは そのまま）
  const per = new Map();
  for (const id of NEW_HIRA) per.set(HIRA_R27_ABILITIES[id].job, (per.get(HIRA_R27_ABILITIES[id].job) || 0) + 1);
  for (const [j, k] of per) {
    assert.ok(k >= 1 && k <= 2, `${j}: ${k}こ`);
    const before = ownHira(j).filter((id) => !NEW_HIRA.includes(id));
    assert.ok(before.length + k <= 3, `${j}: 前から ${before.length}こ`);
  }
  assert.equal(per.get('abarenbo_shogun'), 2);
  for (const id of Object.keys(HIRA_JOB_ABILITIES)) assert.ok(!NEW_HIRA.includes(id), '前の ひらめき技は そのまま');
  // 新しい ひらめき技は、その 道の 上の 職業でも ひらめける（例: 将軍の 天下統一は 暴れんぼう将軍でも）
  const u = newCharacter({ id: 'u', name: 'u', job: 'warrior' });
  u.job = 'abarenbo_shogun';
  assert.ok(hiraAllowed(u, 'hi_tenka_touitsu') && hiraAllowed(u, 'hi_shinkuu_giri') && hiraAllowed(u, 'hi_happou_shuriken'));
});

test('第27回の ひらめき技: データ・文字・ねらい・前から ある エフェクト・強さの 上限・元の 技は その 道の 技', () => {
  const ONE_CAP = [1.3, 1.4, 1.5, 1.5];
  const oldAnims = new Set(Object.entries(ABILITIES).filter(([id]) => !NEW_HIRA.includes(id)).map(([, a]) => a.anim).filter(Boolean));
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden) names.set(a.name, [...(names.get(a.name) || []), id]);
  assert.deepEqual(Object.keys(HIRAMEKI_R27).sort(), [...NEW_HIRA].sort());
  assert.ok(NEW_HIRA.length >= 55, `${NEW_HIRA.length}こ`);
  for (const id of NEW_HIRA) {
    const a = ABILITIES[id];
    assert.ok(a && a.hirameki && HIRAMEKI[id] && id.startsWith('hi_'), id);
    assert.ok(JOBS[a.job], id);
    assert.ok(!a.weapon, `${id}: 武器が いらない`);
    assert.match(a.desc, SCOPE[a.target], `${id}: ${a.desc}`);
    for (const s of [a.name, a.desc, a.cast, ...lines(a.effect)]) assert.deepEqual(checkText(s), [], `${id}: ${s}`);
    assert.deepEqual(checkText(a.kana).filter((p) => p.kind !== 'kana'), [], id);
    assert.ok(oldAnims.has(a.anim), `${id}: ${a.anim}`);
    assert.equal(names.get(a.name).length, 1, `${a.name} が かぶる`);
    for (const [k, n] of Object.entries(HIRAMEKI[id].from)) {
      const s = ABILITIES[k];
      assert.ok(s && n > 0 && JOBS[s.job]?.learn.some(([, x]) => x === k), `${id}: ${k}`);
      assert.ok(jobAncestry(a.job).has(s.job), `${id}: ${k}（${s.job}）は ${a.job} の 道の 技`);
    }
    const t = tierOf(a.job);
    for (const p of partsOf(a.effect)) {
      if (p.type === 'buff' && !p.target && ['allies', 'ally'].includes(a.target)) {
        const cap = a.target === 'ally' ? ONE_CAP[t] : (p.stats || [p.stat]).length > 1 ? ALL_MULTI_CAP[t] : ALL_CAP[t];
        assert.ok(p.mult <= cap + 1e-9, `${a.name}: ${p.mult}`);
      }
      if (p.type === 'atbSet' && ['enemy', 'group', 'enemies'].includes(a.target)) assert.ok(p.chance > 0 && p.chance < 1, a.name);
    }
  }
});

test('第27回の ひらめき技は ぜんぶ たたかいで 使えて、元の 技を 使いこむと ひらめく', () => {
  let n = 0;
  for (const id of NEW_HIRA) {
    const a = ABILITIES[id];
    // 使える
    {
      const { b, c, me, m } = setup(a.job, { seed: ++n });
      c.hirameki = [id];
      me.abilities = [...me.abilities, id];
      assert.ok(readyUp(b, me), id);
      const r = b.command(me.id, { type: 'ability', id, target: ['ally', 'deadAlly'].includes(a.target) ? m.id : b.enemies[0].id }, 's1');
      assert.equal(r.ok, true, `${id}: ${r.reason || ''}`);
      const act = runUntilAct(b, me.id);
      assert.ok(act && !act.lines.some((l) => l.includes('MPが足りない')), id);
      for (const l of act.lines) assert.deepEqual(checkText(l), [], `${id}: ${l}`);
      if (['enemy', 'group', 'enemies'].includes(a.target) && partsOf(a.effect).some((p) => ['phys', 'magic', 'deduce'].includes(p.type))) {
        assert.ok(act.results?.some((x) => x.dmg > 0), `${id}: ダメージ`);
      }
    }
    // ひらめく（元の 技を 回数の 2倍 使った あと。剣の 技は 刀を もって）
    const from = HIRAMEKI[id].from;
    const key = Object.keys(from).find((k) => !['random', 'overtime'].includes(ABILITIES[k].effect.type) && ABILITIES[k].target !== 'deadAlly');
    assert.ok(key, id);
    const ka = ABILITIES[key];
    let got = null;
    for (let seed = 1; seed < 80 && !got; seed++) {
      const { b, c, me, m } = setup(a.job, { seed });
      if (ka.weapon) me.weaponCat = 'sword';
      c.skillUse = Object.fromEntries(Object.entries(from).map(([k, v]) => [k, v * 2]));
      me.use = { ...c.skillUse };
      readyUp(b, me);
      const r = b.command(me.id, { type: 'ability', id: key, target: ['ally'].includes(ka.target) ? m.id : b.enemies[0].id }, 's1');
      assert.equal(r.ok, true, `${id}: ${key} ${r.reason || ''}`);
      const act = runUntilAct(b, me.id);
      if (act?.hirameki) {
        assert.equal(act.hirameki.id, id, `${key} から ${id}`);
        got = act;
      }
    }
    assert.ok(got, `${a.name} を ひらめいた`);
  }
});

test('第27回の ひらめき技は、その 職業が パーティーに いると 一覧に 出る（第23回の きまりの まま）', () => {
  const set = partyJobSet([{ job: 'abarenbo_shogun' }]);
  for (const id of ['hi_oniwaban_maire', 'hi_tenka_gomen', 'hi_tenka_touitsu', 'hi_shinkuu_giri']) assert.ok(hiraRelated(id, set), id);
  assert.ok(!hiraRelated('hi_kyuuri_shuriken', set), 'カッパの 技は 出ない');
  assert.ok(hiraRelated('hi_kyuuri_shuriken', partyJobSet([{ job: 'kappa' }])));
});

// ───────────── 合体技 ─────────────
const jobsOf = (id, g) => new Set(DUAL_TECHS[id].need[g].map((k) => ABILITIES[k]?.job).filter(Boolean));

test('第27回の 合体技: 10こ（2人・3人・4人）・ぜんぶで 35こ いない・半分くらい クスッと・新しい 職業と 前からの 職業', () => {
  // 第29回で 2こ 足して 37こ、第31回の ミナデインで 38こ、第32回の 魔物使いの 3こで 41こ まで（test/jobs-r29.test.js・test/dual-r31.test.js・test/dual-r32.test.js）
  // 第33回の 5こで 46こ まで（test/jobs-r33.test.js）
  assert.ok(DUAL_ORDER.length <= 46, `${DUAL_ORDER.length}こ`);
  assert.ok(NEW_DUAL.length >= 8 && NEW_DUAL.length <= 10);
  for (const id of NEW_DUAL) assert.ok(DUAL_TECHS[id], id);
  const sizes = NEW_DUAL.map(dualSize);
  for (const n of [2, 3, 4]) assert.ok(sizes.includes(n), `${n}人技`);
  const funny = NEW_DUAL.filter((id) => DUAL_TECHS[id].funny).length;
  assert.ok(funny >= 4 && funny <= 7, `笑える 技 ${funny}`);
  // ならびは 2人技・3人技・4人技 の じゅん
  const ord = DUAL_ORDER.map(dualSize);
  assert.deepEqual(ord, [...ord].sort((a, b) => a - b));
  // どれも 新しい 職業の 組が 入る。ほとんどは 前からの 職業の 組も（名探てい×黒の組織 は 新しい 職業どうし）
  let withOld = 0;
  for (const id of NEW_DUAL) {
    const t = DUAL_TECHS[id];
    assert.ok(t.need.some((_, g) => [...jobsOf(id, g)].some((j) => NEW_JOBS.includes(j)) && DUAL_TECHS[id].need[g].length < 80), `${id}: 新しい 職業の 組`);
    if (t.need.some((_, g) => [...jobsOf(id, g)].some((j) => !NEW_JOBS.includes(j)))) withOld++;
  }
  assert.ok(withOld >= NEW_DUAL.length - 1, `前からの 職業と ${withOld}こ`);
  const pair = (id, a, b) => DUAL_TECHS[id].need.some((_, g) => jobsOf(id, g).has(a)) && DUAL_TECHS[id].need.some((_, g) => jobsOf(id, g).has(b));
  assert.ok(pair('dt_hannin', 'meitantei', 'black_org'), '名探てい×黒の組織');
  assert.ok(pair('dt_nantoka', 'doraemon', 'neet'), 'ドラえもん×ニート');
  assert.ok(pair('dt_kyuuri_zushi', 'kappa', 'cook'), 'カッパ×料理人');
  assert.ok(pair('dt_point10', 'rakuten_cardman', 'okan'), '楽天カードマン×おかん');
  assert.ok(pair('dt_megumi', 'abarenbo_shogun', 'samurai') && pair('dt_megumi', 'ninja', 'abarenbo_shogun'), '暴れんぼう将軍×サムライ×忍者');
  assert.equal(DUAL_TECHS.dt_hannin.name, 'おまえが犯人だ！');
  assert.equal(DUAL_TECHS.dt_megumi.name, 'め組の大立ち回り');
  // 新しい 職業は どれも、新しい 合体技の どれかに 出てくる（暴れんぼう将軍も）
  const inNew = new Set();
  for (const id of NEW_DUAL) DUAL_TECHS[id].need.forEach((_, g) => jobsOf(id, g).forEach((j) => inNew.add(j)));
  for (const j of NEW_JOBS) assert.ok(inNew.has(j), `${JOBS[j].name} の 新しい 合体技`);
  // 文字・えんしゅつ
  for (const id of NEW_DUAL) {
    const t = DUAL_TECHS[id];
    for (const s of [t.name, t.desc, ...t.parts.flatMap((p) => [p.say, p.msg, p.failMsg]).filter(Boolean)]) assert.deepEqual(checkText(s), [], `${id}: ${s}`);
    for (const list of t.need) assert.deepEqual(checkText(DUAL_GROUP_NAMES.get(list)), []);
    assert.ok(DUAL_FX[id]?.finale && DUAL_FX[id].word, id);
  }
});

test('第27回の 合体技は 今の 合体技より 弱くない（k が 同じ 人数・ねらいの 今の 技の いちばん 下より 上）', () => {
  const OLD = DUAL_ORDER.filter((id) => !NEW_DUAL.includes(id));
  const kOf = (id) => Math.max(0, ...DUAL_TECHS[id].parts.filter((p) => p.type === 'power' && !p.target).map((p) => p.k * (p.hits && DUAL_TECHS[id].target === 'enemies' ? 1 : 1)));
  for (const id of NEW_DUAL) {
    const t = DUAL_TECHS[id];
    if (!t.parts.some((p) => p.type === 'power')) continue;
    const same = OLD.filter((o) => DUAL_TECHS[o].target === t.target && DUAL_TECHS[o].parts.some((p) => p.type === 'power' && !p.target));
    const lo = Math.min(...same.map(kOf));
    assert.ok(kOf(id) >= lo, `${t.name}: k ${kOf(id)}（今の いちばん 下 ${lo}）`);
  }
});

// 敵 1体に、それぞれが ふつうに 出せる いちばん 強い 技の ダメージ
function soloBest(b, m, t) {
  let best = b.calcPhys(m, t, { mult: 1 }, 1, 'phys', true).dmg;
  for (const id of m.abilities) {
    const a = ABILITIES[id];
    if (!a || !weaponOk(a, m.weaponCat)) continue;
    for (const p of partsOf(a.effect || {})) {
      if (p?.type === 'phys') best = Math.max(best, b.calcPhys(m, t, { ...p, element: undefined }, 1, 'phys', true).dmg * (p.random ? 1 : p.hits || 1));
      if ((p?.type === 'magic' || p?.type === 'deduce') && p.base) best = Math.max(best, b.calcMagic(m, t, { ...p, type: 'magic', element: undefined }, 1, true).dmg);
    }
  }
  return best;
}
function party(jobs, { seed = 1, enemies = ['rockman'], hooks } = {}) {
  const allies = jobs.map((j, i) => {
    const c = newCharacter({ id: `a${i}`, name: `${JOBS[j].short}${i}`, job: 'warrior' });
    gainExp(c, expForLevel(40));
    masterChain(c, j);
    master(c, j);
    c.job = j;
    c.equip.weapon = null;
    fullHeal(c);
    return i === 0 ? { char: c, controller: 's1' } : { char: c, kind: 'support', controller: 's1' };
  });
  const b = new Battle({ rng: makeRng(seed), allies, enemies, canFlee: true, hooks });
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 99999; e.resist = {}; }
  for (const a of b.allies) { a.mp = a.maxMp = 999; a.weaponCat = 'sword'; }
  return b;
}
const isDual = (e) => e.t === 'act' && e.dual;
function fire(b, id) {
  const [me] = b.allies;
  for (const a of b.allies) readyUp(b, a);
  const o = b.dualOptionsFor(me).find((x) => x.id === id);
  assert.ok(o, `${id} が 出せる`);
  const r = b.command(me.id, { type: 'dual', id, partner: o.partner, partners: o.partners, target: b.enemies[0].id }, 's1');
  assert.equal(r.ok, true, `${id}: ${r.reason || ''}`);
  const evs = [];
  for (let t = 0; t < 30000 && !evs.some(isDual); t += 50) evs.push(...b.tick(50));
  const act = evs.find(isDual);
  assert.equal(act?.dual?.id, id);
  for (const l of act.lines) assert.deepEqual(checkText(l), [], `${id}: ${l}`);
  return { act, o };
}

test('第27回の 合体技: 出せて 強い（別々に 動くより はっきり 得）', () => {
  // 敵 1体の 技
  for (const [id, jobs, min] of [['dt_hannin', ['meitantei', 'black_org'], 1.6], ['dt_nichirin', ['enbashira', 'mage'], 1.6]]) {
    const b = party(jobs);
    const t = b.enemies[0];
    const solo = b.allies.reduce((s, m) => s + soloBest(b, m, t), 0);
    const { act } = fire(b, id);
    const dmg = act.results.filter((r) => r.id === t.id && r.dmg > 0).reduce((s, r) => s + r.dmg, 0);
    assert.ok(dmg >= solo * min, `${DUAL_TECHS[id].name}: ${dmg} は 別々の ${solo} の ${(dmg / solo).toFixed(2)}倍`);
  }
  // 敵 全体の 技（敵 3体で、合計は 別々の 1体ぶんの 3倍 いじょう）
  for (const [id, jobs, min] of [['dt_nantoka', ['doraemon', 'neet'], 3], ['dt_point10', ['rakuten_cardman', 'okan'], 2.8], ['dt_nenriki_meteor', ['esper', 'mage'], 2.8],
    ['dt_megumi', ['abarenbo_shogun', 'samurai', 'ninja'], 3.5], ['dt_hakkeyoi', ['kappa', 'monk', 'schoolkid'], 3], ['dt_nazo', ['meitantei', 'gamer', 'doraemon', 'police'], 4]]) {
    const b = party(jobs, { enemies: ['rockman', 'rockman', 'rockman'] });
    const solo = b.allies.reduce((s, m) => s + soloBest(b, m, b.enemies[0]), 0);
    const { act } = fire(b, id);
    const total = act.results.filter((r) => r.dmg > 0).reduce((s, r) => s + r.dmg, 0);
    assert.ok(total >= solo * min, `${DUAL_TECHS[id].name}: 敵3体に ${total}（別々 ${solo}）`);
  }
});

test('第27回の 合体技: 推理（弱点で 当たる）・ポイントバック・回復の 技', () => {
  // おまえが犯人だ！: 骨の 魔物には 光（いちばんの 弱点）で 当たる
  const b = party(['meitantei', 'black_org'], { enemies: ['skeleton', 'rockman'] });
  b.enemies[0].resist = { ...MONSTERS.skeleton.resist };
  const { act } = fire(b, 'dt_hannin');
  const r = act.results.find((x) => x.id === b.enemies[0].id && x.dmg > 0);
  assert.equal(r.element, 'light');
  assert.ok(act.lines.some((l) => l.includes('の弱点は…光だ！')), act.lines.join(' / '));
  // なぞはすべて解けた！（4人）: 敵 それぞれの 弱点
  const b4 = party(['meitantei', 'gamer', 'doraemon', 'police'], { enemies: ['skeleton', 'rockman'] });
  b4.enemies[0].resist = { ...MONSTERS.skeleton.resist };
  b4.enemies[1].resist = { ...MONSTERS.rockman.resist };
  const a4 = fire(b4, 'dt_nazo').act;
  assert.equal(a4.results.find((x) => x.id === b4.enemies[0].id && x.dmg > 0).element, 'light');
  assert.equal(a4.results.find((x) => x.id === b4.enemies[1].id && x.dmg > 0).element, 'blast');
  // ポイント10倍デー: 当てた 敵の お金
  const got = [];
  const hooks = { gainGold: (actor, sp, mult) => { got.push(mult); return Math.round((MONSTERS[sp]?.gold || 0) * mult); } };
  const bp = party(['rakuten_cardman', 'okan'], { enemies: ['rockman', 'rockman'], hooks });
  const ap = fire(bp, 'dt_point10').act;
  assert.deepEqual(got, [1.2, 1.2]);
  assert.ok(ap.lines.some((l) => l.startsWith('ポイントバック！')));
  // キュウリずし・おくすり手帳: 回復と 補助
  for (const [id, jobs] of [['dt_kyuuri_zushi', ['kappa', 'cook']], ['dt_okusuri', ['creator', 'priest']]]) {
    const bh = party(jobs);
    for (const a of bh.allies) a.hp = Math.round(a.maxHp / 3);
    const { act: ah } = fire(bh, id);
    assert.ok(ah.results.some((x) => x.heal > 0), id);
  }
  // パーティーに 関係する 合体技だけ メニューに 出る（第23回の きまり）
  assert.ok(dualRelated('dt_megumi', partyJobSet([{ job: 'abarenbo_shogun' }, { job: 'samurai' }, { job: 'ninja' }])));
  assert.ok(!dualRelated('dt_megumi', partyJobSet([{ job: 'warrior' }, { job: 'priest' }])));
  assert.ok(JOB_ORDER.length >= 23);
});
