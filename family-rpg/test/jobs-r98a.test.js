// 第98回 K1班: きずなの職業 はじめの 2つ（熱と風の空調マスター・八竜の火影）の テスト（docs/plan-kizuna-jobs.md の 7・実装メモ）
//   なり方・条件・技（看板の きまり）・強さの はんい・火の意志・火竜・両方の 流れ（いらい・ひみつの 部屋・まぼろしの回ろう）・幻の書・オート・絵・引っこしコード
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JOBS, ALL_JOBS, PHANTOM_ORDER, PHANTOM_LIVE, JOB_HINTS, JOB_MAX_LEVEL, LEGEND_ORDER, jobAncestry } from '../public/js/shared/data/jobs.js';
import { KIZUNA, KIZUNA_IDS, isKizuna, kizunaOf } from '../public/js/shared/data/kizuna.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { HIRAMEKI, HIRA_ABILITIES } from '../public/js/shared/data/hirameki.js';
import { RYU_SET } from '../public/js/shared/data/abilities-r85b.js';
import { R85B_JOBS } from '../public/js/shared/data/jobs-r85b.js';
import { PHANTOM_JOBS, PHANTOM_TAGS, abilityTags, phantomReady, phantomBook, phantomRumors, phantomCondText } from '../public/js/shared/data/phantom.js';
import { JOB_SAY } from '../public/js/shared/data/job-talk.js';
import { TRIAL_WORDS } from '../public/js/shared/data/job-trials.js';
import { JOB_TAGS } from '../public/js/shared/data/job-tags.js';
import { VEHICLES, VEHICLE_ORDER } from '../public/js/shared/data/vehicles.js';
import { RIVAL_DOORS } from '../public/js/shared/data/rivals-r88.js';
import { FAMILY_QUESTS } from '../public/js/shared/data/sidequests-family.js';
import { jobLine } from '../public/js/shared/data/fq-common.js';
import { C9A_SECRET_ROOTS } from '../public/js/shared/maps/c9a-flags.js';
import { PHANTOM_ADJ } from '../public/js/shared/battle-trial.js';
import { newCharacter, gainExp, expForLevel, fullHeal, computeStats, jobUnlocked } from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';
import { CLONE_MAX } from '../public/js/shared/battle-phantom-a.js';
import { ryuSetOf } from '../public/js/shared/battle-r85b.js';
import { kizunaPlan } from '../public/js/shared/battle-kizuna.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { jobChar } from '../tools/sim-jobs.mjs';
import { checkText, gameFiles } from '../tools/kanji-check.mjs';
import { KIZUNA_ART, KIZUNA_ANIMS, KIZUNA_OUTFIT as JOB_OUTFIT, playKizunaFx } from '../public/js/client/render/kizuna-art.js';
import { jobBody } from '../public/js/client/render/hero-outfit.js';
import { VEHICLE_ART, vehicleFrames } from '../public/js/client/render/vehicle-art.js';
import { biggestChar } from './transfer-big-save.js';
import { exportCode, splitCode, LINE_MAX } from '../public/js/shared/world/transfer.js';

const NEW = ['kuuchou_master', 'hachiryu_hokage'];
const REQ = { kuuchou_master: ['rekka', 'facility_genius'], hachiryu_hokage: ['rekka', 'hokage'] };
// 技の もと（親の 2つから 4こずつ ＋ かけ合わせ 1こ）
const FROM = {
  kuuchou_master: { rekka: ['km_ryu', 'km_kiba', 'km_danbou', 'km_netpuu'], facility_genius: ['km_mieruka', 'km_yochou', 'km_reibou', 'km_kanki'] },
  hachiryu_hokage: { rekka: ['hh_ryu', 'hh_hime', 'hh_rendan', 'hh_hanabi'], hokage: ['hh_bunshin', 'hh_rasen', 'hh_mamori', 'hh_ishi'] },
};
const KEYS = ['hp', 'mp', 'str', 'def', 'agi', 'mag', 'heal'];
const sum = (m) => KEYS.reduce((s, k) => s + m[k], 0);
const textOk = (s, what) => assert.deepEqual(checkText(s), [], `${what}: ${s}`);
const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
const parts = (e) => (e?.type === 'multi' ? e.parts || [] : e ? [e] : []);

// ───────────── データ ─────────────
test('第98回 K1: 2つの きずなの職業（tier 4・req 2つ・幻の はんい・ならびの さいご・1つ 1ファイル）', () => {
  // 第98回 K3班: うしろに きずなの職業が 足された（K1班の 2つは はじめの 2つの まま。ほかの 組は それぞれの テスト）
  assert.deepEqual(KIZUNA_IDS.slice(0, 2), NEW);
  assert.deepEqual(PHANTOM_ORDER.slice(0, 16).includes('kuuchou_master'), false);
  assert.deepEqual(PHANTOM_ORDER.slice(16, 18), NEW, '前の 16この あと（掲示板の しるしの 番号は かわらない）');
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
    // 名前は 今 ある 職業と かぶらない
    assert.equal(ALL_JOBS.filter((x) => JOBS[x].name === j.name).length, 1, j.name);
    assert.equal(ALL_JOBS.filter((x) => JOBS[x].short === j.short).length, 1, j.short);
    // うわさに 名前・数を 書かない
    assert.ok(!JOB_HINTS[id].includes(j.name) && !/[0-9０-９]{3}/.test(JOB_HINTS[id]), JOB_HINTS[id]);
    assert.ok(JOB_TAGS[id]?.length >= 2 && !JOB_TAGS[id].includes('fire'), '炎の 組は 職業 20 まで');
  }
});

test('第98回 K1: 親は 新しい 系統の 伝説 ＋ もとからの 流れの いちばん 上（伝説）', () => {
  for (const id of NEW) {
    const [a, b] = REQ[id];
    for (const p of [a, b]) {
      assert.equal(JOBS[p].tier, 3, `${p} は 伝説`);
      // その 流れの いちばん 上（幻の職業 いがいで p を 条件に する 職業は ない）
      const next = ALL_JOBS.filter((x) => (JOBS[x].tier || 0) < 4 && (JOBS[x].req || []).includes(p));
      assert.deepEqual(next, [], `${p} の 上`);
    }
    // 1つめは 新しい 系統（烈火の炎）・2つめは もとからの 流れ
    assert.ok(R85B_JOBS.includes(a));
    assert.ok(!R85B_JOBS.includes(b));
  }
  assert.ok(jobAncestry('facility_genius').has('salaryman') && jobAncestry('facility_genius').has('ryonetsu'));
  assert.ok(jobAncestry('hokage').has('konoha') && jobAncestry('hokage').has('ninja'));
});

test('第98回 K1: なり方の 条件（今 ある タグと 数だけ・2つ きわめて 条件を みたすと なれる）', () => {
  assert.equal(PHANTOM_TAGS.length, 23, 'タグは 足して いない（引っこしコードの 番号は そのまま）');
  // 今の 16この 条件の 数の はんい
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
    assert.equal(jobUnlocked(c, id), false);
    c.feats = { use: {}, dmg: 0, dmgSpell: 0, dmgFire: 0, heal: 0, crit: 0, big5000: 0 };
    for (const cd of PHANTOM_JOBS[id].conds) {
      if (cd.use) c.feats.use[cd.use[0]] = cd.goal;
      else c.feats[cd.stat] = cd.goal;
    }
    assert.equal(phantomReady(c, id), true);
    assert.equal(jobUnlocked(c, id), true);
  }
  // 火竜の 技・影分身は 条件の タグに 数える
  for (const s of ['km_ryu', 'km_kiba', 'hh_ryu', 'hh_rasen', 'hachiryu_hokage_sig']) assert.ok(abilityTags(s).includes('karyu'), s);
  for (const s of ['hh_bunshin', 'hh_rasen', 'hachiryu_hokage_sig']) assert.ok(abilityTags(s).includes('ninjutsu'), s);
  assert.ok(abilityTags('km_yochou').includes('support'));
});

// ───────────── 技 ─────────────
test('第98回 K1: 技 10こ（親の 2つから 4こずつ ＋ かけ合わせ 1こ ＋ ひらめき技 1こ）・文字・えんしゅつ', () => {
  for (const id of NEW) {
    const j = JOBS[id];
    assert.equal(j.learn.length, 9);
    assert.equal(j.learn.at(-1)[0], 10);
    assert.equal(j.learn.at(-1)[1], `${id}_sig`);
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
      // 名前は 今 ある 技と かぶらない
      assert.equal(Object.values(ABILITIES).filter((x) => x.name === ab.name).length, 1, ab.name);
      assert.ok(ab.anim, a);
    }
    // ひらめき技の じょうけんは この 職業の 技
    for (const h of hira) for (const k of Object.keys(HIRAMEKI[h].from)) assert.ok(ids.includes(k), k);
  }
  // 新しい えんしゅつ（看板・ひらめき技・れんだ）は 絵の ファイルに ある
  for (const a of ['kuuchou_master_sig', 'hachiryu_hokage_sig', 'kizuna_ondo', 'kizuna_rendan']) {
    assert.ok(KIZUNA_ANIMS.has(a), a);
    const fake = new Proxy({}, { get: () => () => undefined });
    assert.equal(playKizunaFx(fake, a, [{ x: 100, y: 60 }], null, {}), true, a);
  }
  // 火竜の 組（烈火の メニューと おなじ）
  assert.deepEqual(ryuSetOf('km_ryu'), RYU_SET.kuuchou);
  assert.deepEqual(ryuSetOf('hh_ryu'), RYU_SET.hokage);
  assert.ok(RYU_SET.kuuchou.includes('resshin') && RYU_SET.hokage.includes('resshin'));
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
      if (p.type === 'phys') e += b.calcPhys(me, tg, { ...p, element: undefined }, 1, 'phys', true).dmg * ((p.hits || 1) + (p.make && p.dance ? p.dance * Math.min(CLONE_MAX, p.make) : 0));
      else if (p.type === 'magic' && Array.isArray(p.base)) e += b.calcMagic(me, tg, { ...p, element: undefined }, 1, true).dmg;
    }
    return { lv, name: a.name, mp: a.mp || 0, target: a.target, e: Math.round(e) };
  });
  return { st, sk };
}

test('第98回 K1: 看板の きまり（いちばん 強い・同じ 形の 技の 1.1倍 いじょう・今の 幻の いちばん 強い 技を こえない・MP は 4回 いじょう）', () => {
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

test('第98回 K1: 火の意志（たおれた 仲間 1人ごとに 強く なる）・八竜影分身の術は 分身を 6人 出して 消える', () => {
  const run = (dead) => {
    const me = mk('hachiryu_hokage');
    const pals = [mk('kuuchou_master'), mk('kuuchou_master')];
    pals[1].id = 'pal2';
    const b = new Battle({ rng: makeRng(5), allies: [{ char: me }, { char: pals[0] }, { char: pals[1] }], enemies: ['rockman'], canFlee: false });
    const e = b.enemies[0]; e.hp = e.maxHp = 9999999; e.resist = {}; e.dfn = e.def = 0;
    for (let i = 1; i <= dead; i++) { b.allies[i].hp = 0; b.allies[i].alive = false; }
    const u = b.allies[0]; u.mp = 999;
    const ev = { lines: [], upd: [], results: [] };
    b.applyAbility(u, ABILITIES.hachiryu_hokage_sig, { type: 'ability', id: 'hachiryu_hokage_sig' }, ev, 1);
    const dmg = ev.results.filter((r) => r.id === e.id && r.dmg > 0);
    return { ev, n: ev.results.filter((r) => r.id === e.id && (r.dmg > 0 || r.miss)).length, dmg: dmg.reduce((s, r) => s + r.dmg, 0), clones: u.clones };
  };
  const a = run(0), b2 = run(2);
  assert.equal(a.n, 3 + 6, '自分 3回 ＋ 分身 6人 × 1回');
  assert.equal(a.clones, null, '分身は 消える');
  assert.ok(b2.ev.lines.some((l) => l.includes('火の意志')), b2.ev.lines.join('/'));
  assert.ok(b2.dmg > a.dmg * 1.3, `${a.dmg} → ${b2.dmg}`);
});

test('第98回 K1: 熱と風の全館運転（炎 → 氷 の 2つ・仲間の 悪い じょうたいを 治す）・予兆保全（天才しせつ管理者と おなじ）', () => {
  const me = mk('kuuchou_master');
  const pal = mk('hachiryu_hokage');
  const b = new Battle({ rng: makeRng(3), allies: [{ char: me }, { char: pal }], enemies: ['rockman'], canFlee: false });
  const e = b.enemies[0]; e.hp = e.maxHp = 9999999; e.resist = {};
  b.allies[1].status.poison = { left: 5 };
  const ev = { lines: [], upd: [], results: [] };
  b.applyAbility(b.allies[0], ABILITIES.kuuchou_master_sig, { type: 'ability', id: 'kuuchou_master_sig' }, ev, 1);
  assert.ok(ev.results.filter((r) => r.id === e.id && r.dmg > 0).length >= 2);
  assert.ok(!b.allies[1].status.poison, '毒が 治った');
  assert.equal(JOBS.kuuchou_master.passive.foresee, 0.6);
  assert.equal(b.foreseeCut(1000, { lines: [] }), 600);
});

test('第98回 K1: オート（その 職業の 技を 持つ 人だけ・ガンガンは 攻撃だけ・悪い じょうたいの 仲間が 多いと 全館運転）', () => {
  // ほかの 職業は 何も しない
  const w = jobChar('warrior', 50, 7);
  const b0 = new Battle({ rng: makeRng(1), allies: [{ char: w, auto: true }], enemies: ['rockman'], canFlee: false });
  assert.equal(kizunaPlan(b0, b0.allies[0], b0.enemies, [], b0.allies, {}), null);
  for (const tactics of ['balanced', 'aggressive']) {
    const me = mk('kuuchou_master');
    const pals = ['hachiryu_hokage', 'hachiryu_hokage'].map((j, i) => Object.assign(mk(j), { id: `p${i}` }));
    const b = new Battle({ rng: makeRng(2), allies: [{ char: me, auto: true, tactics }, ...pals.map((char) => ({ char, auto: true }))], enemies: ['rockman', 'rockman'], canFlee: false });
    for (const x of b.allies.slice(1)) x.status.poison = { left: 5 };
    const u = b.allies[0];
    // 看板の MP が ない ＝ 大かん気（回復）。ガンガンの 時は 回復を えらばない
    u.mp = 30;
    let kanki = 0, sig = 0;
    for (let i = 0; i < 40; i++) {
      const cmd = decideAlly(b, u);
      if (cmd?.id === 'km_kanki') kanki++;
    }
    if (tactics === 'aggressive') assert.equal(kanki, 0, 'ガンガンは 回復しない');
    else assert.ok(kanki > 0, '大かん気');
    u.mp = 999;
    for (let i = 0; i < 40; i++) if (decideAlly(b, u)?.id === 'kuuchou_master_sig') sig++;
    assert.ok(sig > 10, `${tactics}: 全館運転 ${sig}`);
  }
});

// ───────────── ほかの しくみ ─────────────
test('第98回 K1: 両方の 流れ（お仕事いらい・ひみつの 部屋・まぼろしの回ろう〈烈火の炎〉）・幻の書・乗り物・試練', () => {
  // お仕事いらい: 両方の 親の 流れの いらいを 引き受けられる
  const can = (j) => FAMILY_QUESTS.filter((q) => q.roots && jobLine(q.roots).has(j));
  const lineOf = (q, p) => q.roots.some((r) => jobAncestry(p).has(r) || r === p);
  for (const id of NEW) {
    const qs = can(id);
    for (const p of REQ[id]) assert.ok(qs.some((q) => lineOf(q, p)), `${id}: ${p} の 流れの いらい`);
  }
  // ひみつの 部屋（地下3階 ＝ 炎術士の 流れ）
  for (const id of NEW) assert.ok(jobLine(C9A_SECRET_ROOTS[1]).has(id));
  // まぼろしの回ろう: 新しい 系統の 方の 作品
  const door = RIVAL_DOORS.find((d) => d.work === 'rekka');
  for (const id of NEW) {
    assert.equal(kizunaOf(id).work, 'rekka');
    assert.ok(door.jobs.includes(id));
  }
  // 幻の書: 幻の職業 ぜんぶの 行。烈火を きわめると 2つとも 名前と 条件が 見える・うわさ
  const c = newCharacter({ id: 'y', name: 'y', job: 'warrior' });
  c.jobs.rekka = { lv: 3 };
  assert.ok(phantomRumors(c).includes(JOB_HINTS.kuuchou_master));
  master(c, 'rekka');
  const rows = phantomBook(c);
  assert.equal(rows.length, PHANTOM_ORDER.length, '幻の職業 ぜんぶ（数は test/phantom-r51）');
  for (const id of NEW) {
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
    assert.ok(VEHICLES.fire_dragon.jobs.includes(id));
  }
  assert.ok(VEHICLES.kei_truck.jobs.includes('kuuchou_master') && VEHICLES.ninja_dash.jobs.includes('hachiryu_hokage'));
  // 職業の試練の まぼろしの 強さ
  for (const id of NEW) assert.equal(PHANTOM_ADJ[id].length, 3);
});

test('第98回 K1: 見た目（親の 2つの とくちょう）・漢字チェックの 対象', () => {
  assert.deepEqual(KIZUNA_ART.map((k) => k.id), KIZUNA_IDS, '絵の 一覧も データと おなじ じゅん');
  assert.deepEqual(KIZUNA_ART.map((k) => k.id).slice(0, 2), NEW);
  // 空調マスター: 作業服 ＋ 温度計 ＋ 竜の こて ／ 八竜の火影: はおり（炎の もよう）＋ 竜の こて
  assert.equal(JOB_OUTFIT.kuuchou_master.kind, 'work');
  assert.equal(JOB_OUTFIT.kuuchou_master.mark, 'thermo98');
  assert.equal(JOB_OUTFIT.hachiryu_hokage.kind, 'jump26');
  assert.ok(JOB_OUTFIT.hachiryu_hokage.capeFlame);
  for (const id of NEW) assert.equal(jobBody(id, true)?.kote85, 'ryu');
  const files = gameFiles().map((f) => f.replace(/\\/g, '/'));
  for (const f of ['shared/data/jobs-r98-kuuchou.js', 'shared/data/jobs-r98-hokage.js', 'shared/data/kizuna.js', 'client/render/kizuna-kuuchou.js', 'client/render/kizuna-hokage.js']) {
    assert.ok(files.some((x) => x.endsWith(f)), f);
  }
});

test('第98回 K1: 引っこしコード（いちばん 大きな セーブも 4通まで・36000文字いか）', { timeout: 120000 }, async () => {
  const big = await biggestChar();
  for (const id of NEW) assert.ok(big.jobs[id], `${id} を 持つ`);
  const code = exportCode(big);
  assert.ok(splitCode(code).length <= 4 && code.length <= 36000, `${code.length}文字・${splitCode(code).length}通（LINE ${LINE_MAX}）`);
});
