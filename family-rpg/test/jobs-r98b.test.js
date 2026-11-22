// 第98回 K2班: きずなの職業 2つ（百きの大将・天下無そうの剣ごう）の テスト（docs/plan-kizuna-jobs.md の 7・8〈K1班の 手引き〉・9〈K2班の メモ〉）
//   jobs-r98a.test.js と おなじ 見方: なり方・条件・技（看板の きまり）・強さの はんい・親の しくみ（ばくりゅうはの share・百きをよぶ・
//   玉がえ・弱点の もう 一太刀）・両方の 流れ（いらい・まぼろしの回ろう）・幻の書・オート・絵・引っこしコード
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JOBS, ALL_JOBS, PHANTOM_ORDER, PHANTOM_LIVE, JOB_HINTS, JOB_MAX_LEVEL, jobAncestry } from '../public/js/shared/data/jobs.js';
import { KIZUNA_IDS, isKizuna, kizunaOf } from '../public/js/shared/data/kizuna.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { HIRAMEKI, HIRA_ABILITIES } from '../public/js/shared/data/hirameki.js';
import { R82B_JOBS } from '../public/js/shared/data/jobs-r82b.js';
import { PHANTOM_JOBS, PHANTOM_TAGS, abilityTags, phantomReady, phantomBook, phantomRumors, phantomCondText } from '../public/js/shared/data/phantom.js';
import { JOB_SAY } from '../public/js/shared/data/job-talk.js';
import { TRIAL_WORDS } from '../public/js/shared/data/job-trials.js';
import { JOB_TAGS } from '../public/js/shared/data/job-tags.js';
import { VEHICLES, VEHICLE_ORDER } from '../public/js/shared/data/vehicles.js';
import { RIVAL_DOORS } from '../public/js/shared/data/rivals-r88.js';
import { FAMILY_QUESTS } from '../public/js/shared/data/sidequests-family.js';
import { jobLine } from '../public/js/shared/data/fq-common.js';
import { PHANTOM_ADJ } from '../public/js/shared/battle-trial.js';
import { newCharacter, gainExp, expForLevel, fullHeal, computeStats, jobUnlocked } from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';
import { r82aResolve } from '../public/js/shared/battle-r82a.js';
import { tamaSet, TAMA_ORDER } from '../public/js/shared/battle-r82b.js';
import { kizunaPlan } from '../public/js/shared/battle-kizuna.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { jobChar } from '../tools/sim-jobs.mjs';
import { checkText, gameFiles } from '../tools/kanji-check.mjs';
import { KIZUNA_ART, KIZUNA_ANIMS, KIZUNA_OUTFIT as JOB_OUTFIT, KIZUNA_HAT, playKizunaFx } from '../public/js/client/render/kizuna-art.js';
import { jobBody } from '../public/js/client/render/hero-outfit.js';
import { VEHICLE_ART, vehicleFrames } from '../public/js/client/render/vehicle-art.js';
import { biggestChar } from './transfer-big-save.js';
import { exportCode, splitCode, LINE_MAX } from '../public/js/shared/world/transfer.js';

const NEW = ['hyakki_taishou', 'tenka_kengou'];
const REQ = { hyakki_taishou: ['bakuryuha', 'kappa_king'], tenka_kengou: ['ryujin_samurai', 'hiten'] };
// 技の もと（親の 2つから 4こずつ ＋ かけ合わせ 1こ）
const FROM = {
  hyakki_taishou: { bakuryuha: ['hyk_kaze', 'hyk_ryurin', 'hyk_daiyou', 'hyk_bakuryu'], kappa_king: ['hyk_harite', 'hyk_osara', 'hyk_himawari', 'hyk_yobu'] },
  tenka_kengou: { ryujin_samurai: ['kg_tamagae', 'kg_futatachi', 'kg_tatsumaki', 'kg_ikari'], hiten: ['kg_shinsoku', 'kg_mantle', 'kg_yomi', 'kg_kuzuryu'] },
};
// 新しい 系統（1つめの 親）の 流れ・もとからの 流れ（2つめの 親）の いちばん 下
const LINE = { hyakki_taishou: ['hanyo_boy', 'kappa'], tenka_kengou: ['samurai_kid', 'rurouni'] };
const WORK = { hyakki_taishou: 'inuyasha', tenka_kengou: 'yaiba' };
const KEYS = ['hp', 'mp', 'str', 'def', 'agi', 'mag', 'heal'];
const sum = (m) => KEYS.reduce((s, k) => s + m[k], 0);
const textOk = (s, what) => assert.deepEqual(checkText(s), [], `${what}: ${s}`);
const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
const parts = (e) => (e?.type === 'multi' ? e.parts || [] : e ? [e] : []);

// ───────────── データ ─────────────
test('第98回 K2: 2つの きずなの職業（tier 4・req 2つ・幻の はんい・K1班の 2つの あと・1つ 1ファイル）', () => {
  assert.deepEqual(KIZUNA_IDS.slice(2, 4), NEW);
  assert.deepEqual(PHANTOM_ORDER.slice(18, 20), NEW, '前の 18この あと（掲示板の しるしの 番号は かわらない）');
  for (const id of NEW) {
    const j = JOBS[id];
    assert.equal(kizunaOf(id).job, j);
    assert.ok(isKizuna(id));
    assert.equal(j.tier, 4);
    assert.ok(PHANTOM_LIVE.includes(id) && ALL_JOBS.filter((x) => x === id).length === 1);
    assert.deepEqual(j.req, REQ[id]);
    assert.deepEqual(PHANTOM_JOBS[id].masters, REQ[id]);
    assert.ok(!j.reqSuper && !j.reqAlt);
    const s = sum(j.mods);
    assert.ok(s >= 10.85 - 1e-9 && s <= 11.9 + 1e-9, `${id}: 合計 ${s}`);
    for (const t of [j.name, j.desc, JOB_HINTS[id], JOB_SAY[id], TRIAL_WORDS[id], PHANTOM_JOBS[id].name]) textOk(t, id);
    assert.equal(PHANTOM_JOBS[id].name, j.name);
    assert.ok(TRIAL_WORDS[id].length <= 32);
    assert.equal(ALL_JOBS.filter((x) => JOBS[x].name === j.name).length, 1, j.name);
    assert.equal(ALL_JOBS.filter((x) => JOBS[x].short === j.short).length, 1, j.short);
    assert.ok(!JOB_HINTS[id].includes(j.name) && !/[0-9０-９]{3}/.test(JOB_HINTS[id]), JOB_HINTS[id]);
    assert.ok(JOB_TAGS[id]?.length >= 2 && !JOB_TAGS[id].includes('fire'), '炎の 組は 職業 20 まで');
  }
  // 名前: 家族の 案の まま（小学校で ならわない「鬼」「豪」だけ かな）
  assert.equal(JOBS.hyakki_taishou.name, '百きの大将');
  assert.equal(JOBS.tenka_kengou.name, '天下無そうの剣ごう');
  // 剣・こぶしの 組（第98回の わりふり）: 剣ごうに 剣を 1つだけ・百きの大将には 剣も こぶしも つけない
  assert.deepEqual(JOB_TAGS.tenka_kengou.filter((t) => t === 'sword' || t === 'fist'), ['sword']);
  assert.deepEqual(JOB_TAGS.hyakki_taishou.filter((t) => t === 'sword' || t === 'fist'), []);
});

test('第98回 K2: 親は 新しい 系統の 伝説 ＋ もとからの 流れの いちばん 上（伝説）', () => {
  for (const id of NEW) {
    const [a, b] = REQ[id];
    for (const p of [a, b]) {
      assert.equal(JOBS[p].tier, 3, `${p} は 伝説`);
      const next = ALL_JOBS.filter((x) => (JOBS[x].tier || 0) < 4 && (JOBS[x].req || []).includes(p));
      assert.deepEqual(next, [], `${p} の 上`);
    }
    const [newRoot, oldRoot] = LINE[id];
    assert.ok(jobAncestry(a).has(newRoot), `${a} は ${newRoot} の 流れ`);
    assert.ok(jobAncestry(b).has(oldRoot), `${b} は ${oldRoot} の 流れ`);
  }
  assert.ok(R82B_JOBS.includes('ryujin_samurai') && !R82B_JOBS.includes('hiten'));
});

test('第98回 K2: なり方の 条件（今 ある タグと 数だけ・2つ きわめて 条件を みたすと なれる）', () => {
  assert.equal(PHANTOM_TAGS.length, 23, 'タグは 足して いない（引っこしコードの 番号は そのまま）');
  const old = PHANTOM_ORDER.slice(0, 16).flatMap((id) => PHANTOM_JOBS[id].conds);
  for (const id of NEW) {
    for (const cd of PHANTOM_JOBS[id].conds) {
      textOk(cd.text, id);
      if (cd.use) for (const t of cd.use) assert.ok(PHANTOM_TAGS.includes(t), t);
      const same = old.filter((x) => (cd.use ? x.use : x.stat === cd.stat));
      assert.ok(cd.goal <= Math.max(...same.map((x) => x.goal)) && cd.goal >= Math.min(...same.map((x) => x.goal)), `${cd.text}`);
    }
    textOk(phantomCondText(id), id);
    const c = newCharacter({ id: 'x', name: 'x', job: 'warrior' });
    assert.equal(jobUnlocked(c, id), false);
    master(c, ...REQ[id]);
    assert.equal(phantomReady(c, id), false, '条件が まだ');
    c.feats = { use: {}, dmg: 0, dmgSpell: 0, dmgFire: 0, heal: 0, crit: 0, big5000: 0 };
    for (const cd of PHANTOM_JOBS[id].conds) {
      if (cd.use) c.feats.use[cd.use[0]] = cd.goal;
      else c.feats[cd.stat] = cd.goal;
    }
    assert.equal(phantomReady(c, id), true);
    assert.equal(jobUnlocked(c, id), true);
  }
  // 条件の タグに 数える 技
  for (const s of ['hyk_kaze', 'hyk_daiyou', 'hyk_yobu', 'hyakki_taishou_sig']) assert.ok(abilityTags(s).includes('yokai'), s);
  for (const s of ['hyk_yobu', 'hyk_himawari']) assert.ok(abilityTags(s).includes('support'), s);
  for (const s of ['kg_futatachi', 'kg_tatsumaki', 'kg_ikari', 'kg_shinsoku', 'kg_kuzuryu', 'tenka_kengou_sig']) assert.ok(abilityTags(s).includes('sword'), s);
  assert.ok(abilityTags('kg_ikari').includes('bolt'));
});

// ───────────── 技 ─────────────
test('第98回 K2: 技 10こ（親の 2つから 4こずつ ＋ かけ合わせ 1こ ＋ ひらめき技 1こ）・文字・えんしゅつ', () => {
  for (const id of NEW) {
    const j = JOBS[id];
    assert.equal(j.learn.length, 9);
    assert.deepEqual(j.learn.at(-1), [10, `${id}_sig`]);
    const ids = j.learn.map(([, a]) => a);
    const fromIds = Object.values(FROM[id]).flat();
    assert.equal(fromIds.length, 8);
    assert.deepEqual([...ids.slice(0, -1)].sort(), [...fromIds].sort());
    for (const p of Object.keys(FROM[id])) assert.ok(REQ[id].includes(p) && FROM[id][p].length === 4);
    const hira = Object.keys(kizunaOf(id).hira.abilities);
    assert.equal(hira.length, 1);
    for (const a of [...ids, ...hira]) {
      const ab = ABILITIES[a] || HIRA_ABILITIES[a];
      assert.ok(ab, a);
      assert.equal(ab.job, id, a);
      for (const t of [ab.name, ab.desc, ab.cast]) textOk(t, a);
      assert.equal(Object.values(ABILITIES).filter((x) => x.name === ab.name).length, 1, ab.name);
      assert.ok(ab.anim, a);
    }
    for (const h of hira) for (const k of Object.keys(HIRAMEKI[h].from)) assert.ok(ids.includes(k), k);
  }
  // 百きをよぶ の 中み（かっぱの大王の 運しだいの 技と おなじ 形。一覧に 出ない）
  const opts = ABILITIES.hyk_yobu.effect.options;
  assert.equal(ABILITIES.hyk_yobu.effect.type, 'random');
  assert.equal(opts.length, 3);
  for (const o of opts) {
    const ab = ABILITIES[o];
    assert.ok(ab.hidden && ab.mp === 0 && ab.target === 'allies' && ab.job === 'hyakki_taishou', o);
    for (const t of [ab.name, ab.desc, ab.cast]) textOk(t, o);
    assert.equal(Object.values(ABILITIES).filter((x) => x.name === ab.name).length, 1, ab.name);
  }
  // 新しい えんしゅつ（看板・ひらめき技）は 絵の ファイルに ある
  for (const a of ['hyakki_taishou_sig', 'kizuna_hyakki', 'tenka_kengou_sig', 'kizuna_issen']) {
    assert.ok(KIZUNA_ANIMS.has(a), a);
    const fake = new Proxy({}, { get: () => () => undefined });
    assert.equal(playKizunaFx(fake, a, [{ x: 100, y: 60 }], null, {}), true, a);
  }
  // 親の しくみ（新しい しくみは 作らない）
  assert.equal(ABILITIES.hyk_bakuryu.effect.type, 'bakuryu');
  assert.ok(parts(ABILITIES.hyakki_taishou_sig.effect).some((p) => p.type === 'bakuryu' && p.share > 1));
  assert.equal(ABILITIES.kg_tamagae.effect.type, 'tamagae');
  assert.equal(ABILITIES.tenka_kengou_sig.effect.yb, 'strike');
  assert.equal(ABILITIES.tenka_kengou_sig.effect.balls.length, 7);
});

// balance-r87c と おなじ はかり方（Lv90・ランク12・敵の 守りは 攻撃力の 4わり・1体に 当てた ダメージ）
const LV = [20, 35, 55, 75, 90], RANK = [4, 6, 8, 10, 12];
function measure(id) {
  const j = JOBS[id]; const t = j.tier || 0;
  const c = jobChar(id, LV[t], RANK[t]);
  const st = computeStats(c);
  const b = new Battle({ rng: makeRng(1), allies: [{ char: c, auto: true, kind: 'support', tactics: 'balanced' }], enemies: ['rockman'], canFlee: false });
  const tg = b.enemies[0]; tg.resist = {}; const me = b.allies[0];
  tg.dfn = tg.def = Math.round(st.atk * 0.4); tg.hp = tg.maxHp = 9999999;
  const sk = j.learn.map(([lv, sid]) => {
    const a = ABILITIES[sid];
    let e = 0;
    for (const p of parts(a.effect)) {
      if (p.type === 'phys') e += b.calcPhys(me, tg, { ...p, element: undefined }, 1, 'phys', true).dmg * (p.hits || 1);
      else if (p.type === 'magic' && Array.isArray(p.base)) e += b.calcMagic(me, tg, { ...p, element: undefined }, 1, true).dmg;
    }
    return { lv, name: a.name, mp: a.mp || 0, target: a.target, e: Math.round(e) };
  });
  return { st, sk };
}

test('第98回 K2: 看板の きまり（いちばん 強い・同じ 形の 技の 1.1倍 いじょう・今の 幻の いちばん 強い 技を こえない・MP は 4回 いじょう）', () => {
  const oldTop = Math.max(...PHANTOM_ORDER.slice(0, 16).map((id) => Math.max(...measure(id).sk.map((s) => s.e))));
  for (const id of NEW) {
    const { st, sk } = measure(id);
    const sig = sk.at(-1);
    for (const s of sk.slice(0, -1)) {
      if (!s.e) continue;
      assert.ok(sig.e >= s.e, `${sig.name} ${sig.e} ＜ ${s.name} ${s.e}`);
      if ((s.target === 'enemy') === (sig.target === 'enemy')) assert.ok(sig.e >= s.e * 1.1, `${sig.name} ${sig.e} は ${s.name} ${s.e} の 1.1倍 いじょう`);
    }
    assert.ok(sig.e <= oldTop, `${sig.name} ${sig.e} ＞ 今の 幻の いちばん 強い 技 ${oldTop}`);
    const top = Math.max(...sk.map((s) => s.mp));
    assert.ok(st.maxMp / top >= 4, `${id}: MP ${st.maxMp} ÷ ${top}`);
  }
});

// ───────────── 戦い ─────────────
function mk(job, lv = 80) {
  const c = newCharacter({ id: job, name: job, job: 'monk' });
  gainExp(c, expForLevel(lv));
  master(c, ...REQ[job] || [], job);
  c.job = job;
  fullHeal(c);
  return c;
}
const ev0 = () => ({ lines: [], upd: [], results: [] });
function duel(job, pal = 'tenka_kengou') {
  const me = mk(job);
  const p = Object.assign(mk(pal), { id: 'pal' });
  const b = new Battle({ rng: makeRng(7), allies: [{ char: me }, { char: p }], enemies: ['rockman'], canFlee: false });
  const e = b.enemies[0]; e.hp = e.maxHp = 9999999; e.resist = {}; e.dfn = e.def = 0;
  const u = b.allies[0]; u.mp = 999;
  return { b, e, u, p: b.allies[1] };
}

test('第98回 K2: 百きのばくりゅうは（ばくりゅうはの しくみ）: 敵の 大技を 返すと、その 力が 仲間全員に のる（攻撃力が 上がる）', () => {
  for (const id of ['hyk_bakuryu', 'hyakki_taishou_sig']) {
    const { b, e, u, p } = duel('hyakki_taishou');
    b.applyAbility(u, ABILITIES[id], { type: 'ability', id, target: e.id }, ev0(), 1);
    assert.equal(u.stance?.kind, 'bakuryu', id);
    assert.ok(u.stance.share > 1);
    const ev = { ...ev0(), big: true };
    b.damage(e, u, 400, ev, { phys: true });
    assert.ok(ev.bakuryu?.length, '受けとめた');
    r82aResolve(b, ev);
    assert.ok(ev.results.some((r) => r.id === e.id && r.dmg > 0), '風で 返した');
    assert.ok(ev.lines.some((l) => l.includes('仲間みんなにものった')), ev.lines.join('/'));
    assert.ok(p.buffs?.atk, `仲間の 攻撃力 ${JSON.stringify(p.buffs)}`);
    assert.ok(u.buffs?.atk, '自分にも のる');
  }
  // ばくりゅうはの大よう（もとの 技）は share が ない ので 仲間は かわらない
  const { b, e, u, p } = duel('hyakki_taishou');
  b.applyAbility(u, ABILITIES.bakuryuha_sig, { type: 'ability', id: 'bakuryuha_sig' }, ev0(), 1);
  const ev = { ...ev0(), big: true };
  b.damage(e, u, 400, ev, { phys: true });
  r82aResolve(b, ev);
  assert.ok(!p.buffs?.atk && !ev.lines.some((l) => l.includes('ものった')));
});

test('第98回 K2: 百きをよぶ（運しだい）: よんだ ようかいで 仲間全員が 強く なる・3しゅるい とも 出る', () => {
  const seen = new Set();
  for (let s = 1; s <= 30; s++) {
    const me = mk('hyakki_taishou');
    const p = Object.assign(mk('tenka_kengou'), { id: 'pal' });
    const b = new Battle({ rng: makeRng(s), allies: [{ char: me }, { char: p }], enemies: ['rockman'], canFlee: false });
    const ev = ev0();
    b.applyAbility(b.allies[0], ABILITIES.hyk_yobu, { type: 'ability', id: 'hyk_yobu' }, ev, 1);
    seen.add(ev.sub);
    for (const x of b.allies) assert.ok(Object.keys(x.buffs || {}).length > 0, `${ev.sub}: ${x.name}`);
  }
  assert.deepEqual([...seen].sort(), ABILITIES.hyk_yobu.effect.options.map((o) => ABILITIES[o].name).sort());
});

test('第98回 K2: 弱点の もう 一太刀（属性斬り・二の太刀 ＝ 今の 玉が 弱点・天かける七つ玉のひらめき ＝ どれかの 玉が 弱点）・次の 番が 早く 来る', () => {
  const hits = (ev, e) => ev.results.filter((r) => r.id === e.id && (r.dmg > 0 || r.miss)).length;
  // 二の太刀: 火の玉で 火が 弱点 → 2回・弱点で ない → 1回
  for (const [res, n] of [[{ fire: 1.5 }, 2], [{}, 1], [{ fire: 0.5 }, 1]]) {
    const { b, e, u } = duel('tenka_kengou');
    e.resist = res;
    u.tama = 'fire';
    const ev = ev0();
    b.applyAbility(u, ABILITIES.kg_futatachi, { type: 'ability', id: 'kg_futatachi', target: e.id }, ev, 1);
    assert.equal(hits(ev, e), n, JSON.stringify(res));
    assert.equal(ev.atbAfter ?? 0, n === 2 ? ABILITIES.kg_futatachi.effect.weakAtb : 0);
    if (n === 2) assert.ok(ev.lines.some((l) => l.includes('もう一太刀')));
  }
  // 看板: 7つの 玉（効かない 玉は 使わない）＋ 弱点なら もう 一太刀
  for (const [res, n] of [[{ ice: 1.5 }, 8], [{}, 7], [{ water: 0 }, 6]]) {
    const { b, e, u } = duel('tenka_kengou');
    e.resist = res;
    const ev = ev0();
    b.applyAbility(u, ABILITIES.tenka_kengou_sig, { type: 'ability', id: 'tenka_kengou_sig', target: e.id }, ev, 1);
    assert.equal(hits(ev, e), n, JSON.stringify(res));
    assert.equal(ev.atbAfter ?? 0, n === 8 ? ABILITIES.tenka_kengou_sig.effect.weakAtb : 0);
  }
  // ほかの YAIBA の 技（weakSlash が ない）は かわらない
  const { b, e, u } = duel('tenka_kengou');
  e.resist = { bolt: 1.5 };
  const ev = ev0();
  b.applyAbility(u, ABILITIES.yb_zokusei, { type: 'ability', id: 'yb_zokusei', target: e.id }, ev, 1);
  assert.equal(hits(ev, e), 1);
});

test('第98回 K2: 玉がえ（剣ごうは 6つの 玉・転職した あとも 神速の玉がえを 覚えて いれば 6つ）', () => {
  assert.deepEqual(tamaSet({ job: 'tenka_kengou', abilities: [] }), TAMA_ORDER);
  assert.deepEqual(tamaSet({ job: 'warrior', abilities: ['kg_tamagae'] }), TAMA_ORDER);
  assert.deepEqual(tamaSet({ job: 'warrior', abilities: [] }), []);
  const { b, e, u } = duel('tenka_kengou');
  const ev = ev0();
  b.applyAbility(u, ABILITIES.kg_tamagae, { type: 'ability', id: 'kg_tamagae', tama: 'wind' }, ev, 1);
  assert.equal(u.tama, 'wind');
  assert.ok(ev.atbAfter > 0);
  // 今の 玉の 属性で 切る
  e.resist = {};
  const ev2 = ev0();
  b.applyAbility(u, ABILITIES.kg_shinsoku, { type: 'ability', id: 'kg_shinsoku', target: e.id }, ev2, 1);
  assert.equal(ev2.fx.element, 'wind');
});

test('第98回 K2: オート（その 職業の 技を 持つ 人だけ・ガンガンは 攻撃だけ・ボスで 看板・弱点の 玉に かえる）', () => {
  const w = jobChar('warrior', 50, 7);
  const b0 = new Battle({ rng: makeRng(1), allies: [{ char: w, auto: true }], enemies: ['rockman'], canFlee: false });
  assert.equal(kizunaPlan(b0, b0.allies[0], b0.enemies, [], b0.allies, {}), null);
  for (const tactics of ['balanced', 'aggressive']) {
    for (const id of NEW) {
      const me = mk(id);
      const pals = ['warrior', 'priest'].map((j, i) => Object.assign(jobChar(j, 80, 10), { id: `p${i}` }));
      const b = new Battle({ rng: makeRng(3), allies: [{ char: me, auto: true, tactics }, ...pals.map((char) => ({ char, auto: true }))], enemies: ['rockman'], canFlee: false });
      const boss = b.enemies[0];
      boss.boss = true; boss.hp = boss.maxHp = 9999999;
      const u = b.allies[0];
      u.mp = 999;
      const got = {};
      for (let i = 0; i < 200; i++) {
        const cmd = decideAlly(b, u);
        if (cmd?.id) got[cmd.id] = (got[cmd.id] || 0) + 1;
      }
      assert.ok(got[`${id}_sig`] > 5, `${tactics} ${id}: ${JSON.stringify(got)}`);
      if (tactics === 'aggressive') for (const k of Object.keys(got)) assert.notEqual(ABILITIES[k]?.role, 'heal', `ガンガンは 回復しない ${k}`);
    }
  }
  // 弱点が 分かって いれば その 玉に かえる
  const me = mk('tenka_kengou');
  const b = new Battle({ rng: makeRng(4), allies: [{ char: me, auto: true }], enemies: ['rockman'], canFlee: false });
  const e = b.enemies[0];
  e.resist = { ice: 2 };
  b.tried = new Set([`${e.species}|ice`]); // この 戦いで 氷を ためした（YAIBA の オートと おなじ 物さし）
  const u = b.allies[0];
  u.mp = 999;
  let ice = 0;
  for (let i = 0; i < 30; i++) {
    const cmd = kizunaPlan(b, u, b.enemies, ['kg_tamagae', 'kg_futatachi'].map((id) => ({ id, a: ABILITIES[id] })), b.allies, {});
    if (cmd?.id === 'kg_tamagae' && cmd.tama === 'ice') ice++;
  }
  assert.equal(ice, 30, '弱点が 分かれば 氷の玉に');
});

// ───────────── ほかの しくみ ─────────────
test('第98回 K2: 両方の 流れ（お仕事いらい・まぼろしの回ろう〈新しい 系統の 作品〉）・幻の書・乗り物・試練', () => {
  const can = (j) => FAMILY_QUESTS.filter((q) => q.roots && jobLine(q.roots).has(j));
  for (const id of NEW) {
    const qs = can(id);
    for (const p of REQ[id]) assert.ok(qs.some((q) => q.roots.some((r) => jobAncestry(p).has(r) || r === p)), `${id}: ${p} の 流れの いらい`);
  }
  for (const id of NEW) {
    assert.equal(kizunaOf(id).work, WORK[id]);
    const door = RIVAL_DOORS.find((d) => d.work === WORK[id]);
    assert.ok(door.jobs.includes(id));
    assert.equal(RIVAL_DOORS.filter((d) => d.jobs.includes(id)).length, 1, '新しい 系統の 方の 作品だけ');
  }
  // 幻の書: ばくりゅうはの大よう／竜神けんのサムライを きわめると 名前と 条件が 見える・うわさ
  for (const id of NEW) {
    const c = newCharacter({ id: 'y', name: 'y', job: 'warrior' });
    c.jobs[REQ[id][0]] = { lv: 3 };
    assert.ok(phantomRumors(c).includes(JOB_HINTS[id]), id);
    master(c, REQ[id][0]);
    const rows = phantomBook(c);
    assert.equal(rows.length, PHANTOM_ORDER.length);
    const r = rows.find((x) => x.id === id);
    assert.ok(r.known && r.live && r.conds.length === 3 && !r.ready, id);
  }
  // 乗り物（その 職業の 幻の 乗り物 ＋ もとの 2つの 職業の 乗り物）
  for (const id of NEW) {
    const vid = kizunaOf(id).vehicle.id;
    assert.ok(VEHICLES[vid].phantom && VEHICLES[vid].jobs.join() === id && VEHICLE_ORDER.includes(vid));
    textOk(VEHICLES[vid].name, vid);
    textOk(VEHICLES[vid].desc, vid);
    assert.ok(VEHICLE_ART[vid] && vehicleFrames(vid) === 3);
  }
  assert.ok(VEHICLES.twin_cat.jobs.includes('hyakki_taishou') && VEHICLES.lotus.jobs.includes('hyakki_taishou'));
  assert.ok(VEHICLES.big_tiger.jobs.includes('tenka_kengou') && VEHICLES.sakura_dash.jobs.includes('tenka_kengou'));
  for (const id of NEW) assert.equal(PHANTOM_ADJ[id].length, 3);
});

test('第98回 K2: 見た目（親の 2つの とくちょう）・漢字チェックの 対象', () => {
  assert.deepEqual(KIZUNA_ART.map((k) => k.id).slice(2, 4), NEW);
  // 百きの大将: 赤い 着物と はかま・犬の 耳の 銀の かみ ＋ カッパの こうら・キュウリ
  assert.equal(JOB_OUTFIT.hyakki_taishou.kind, 'hakama');
  const hb = jobBody('hyakki_taishou', true);
  assert.equal(hb?.hair, 'inu82');
  assert.equal(hb?.shell, 'small');
  assert.equal(hb?.prop, 'cucumber');
  // 天下無そうの剣ごう: 飛天の 白い マント・ほおの 十字 ＋ ヤイバの はちまき・雷
  assert.ok(JOB_OUTFIT.tenka_kengou.mantle29);
  const kb = jobBody('tenka_kengou', true);
  assert.ok(kb?.cross && kb?.spark);
  assert.equal(KIZUNA_HAT.tenka_kengou.kind, 'headband');
  const files = gameFiles().map((f) => f.replace(/\\/g, '/'));
  for (const f of ['shared/data/jobs-r98-hyakki.js', 'shared/data/jobs-r98-kengou.js', 'client/render/kizuna-hyakki.js', 'client/render/kizuna-kengou.js']) {
    assert.ok(files.some((x) => x.endsWith(f)), f);
  }
});

test('第98回 K2: 引っこしコード（いちばん 大きな セーブも 4通まで・36000文字いか）', { timeout: 120000 }, async () => {
  const big = await biggestChar();
  for (const id of NEW) assert.ok(big.jobs[id], `${id} を 持つ`);
  const code = exportCode(big);
  assert.ok(splitCode(code).length <= 4 && code.length <= 36000, `${code.length}文字・${splitCode(code).length}通（LINE ${LINE_MAX}）`);
});
