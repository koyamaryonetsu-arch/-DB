// 第86回 A班: 幻の職業 2つ（人とようかいのかけ橋・竜神の剣士）の テスト（docs/plan-r86-phantom-a.md）
//   なり方・条件の 数え方（タグ）・しくみ（ためた力・自動で かばう・きずなの力・人とようかいのきずな／2つの 属性の 剣・玉がえ・火竜）・
//   もとの 伝説や ほかの 新しい 系統と 同じ パーティーで こわれない・見た目・乗り物・えんしゅつ
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JOBS, ALL_JOBS, PHANTOM_ORDER, PHANTOM_LIVE, JOB_HINTS, JOB_MAX_LEVEL } from '../public/js/shared/data/jobs.js';
import { JOBS_R86A, R86A_PHANTOM, HINTS_R86A, R86A_VEHICLES } from '../public/js/shared/data/jobs-r86a.js';
import { ABILITIES, abilityRole } from '../public/js/shared/data/abilities.js';
import { R86A_ABILITIES } from '../public/js/shared/data/abilities-r86a.js';
import { RYU_SET } from '../public/js/shared/data/abilities-r85b.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
import { HIRA_R86A_ABILITIES, HIRAMEKI_R86A } from '../public/js/shared/data/hirameki-r86a.js';
import { PHANTOM_JOBS, PHANTOM_TAGS, abilityTags, condNow, phantomReady, phantomBook, phantomRumors, phantomCondText } from '../public/js/shared/data/phantom.js';
import { addFeats, packFeats, unpackFeats } from '../public/js/shared/world/phantom.js';
import { JOB_SAY } from '../public/js/shared/data/job-talk.js';
import { TRIAL_WORDS } from '../public/js/shared/data/job-trials.js';
import { JOB_TAGS } from '../public/js/shared/data/job-tags.js';
import { VEHICLES, vehicleShelf } from '../public/js/shared/data/vehicles.js';
import { PHANTOM_ADJ } from '../public/js/shared/battle-trial.js';
import { newCharacter, gainExp, expForLevel, fullHeal, learnedAbilities, jobUnlocked, hiraAllowed } from '../public/js/shared/stats.js';
import { Battle, pub } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { setWeather } from '../public/js/shared/battle-weather.js';
import { tamaSet, tamaOf } from '../public/js/shared/battle-r82b.js';
import { CUT_FLOOR } from '../public/js/shared/battle-r83a.js';
import { ryuSetOf } from '../public/js/shared/battle-r85b.js';
import { KENSHI_TAMA, TAME_RATE, TAME_CAP, r86aPhysMult, r86aPlan, bestEl } from '../public/js/shared/battle-r86a.js';
import { paintHero } from '../public/js/client/render/hero.js';
import { jobBody } from '../public/js/client/render/hero-outfit.js';
import { R86A_JOBS as LOOK_JOBS, R86A_OUTFIT, R86A_BODY, R86A_OLD_LOOK, AURA86A } from '../public/js/client/render/hero-r86a.js';
import { lookToOpts } from '../public/js/client/render/chars.js';
import { VIEWS, paintVehicle, paintVehicleFx, vehicleFrames, riderSpot } from '../public/js/client/render/vehicle-art.js';
import { Effects, BW, BH } from '../public/js/client/render/battlefx.js';
import { PARTY_ANIMS } from '../public/js/client/render/battlefx-jobs2.js';
import { R86A_ANIMS, R86A_HIT, R86A_SFX, PARTY_ANIMS_R86A, playR86aFx } from '../public/js/client/render/battlefx-r86a.js';
import { R85B_FINE } from '../public/js/client/render/battlefx-r85b.js';
import { r86aMarks } from '../public/js/client/battle-r86a.js';
import { ryuItems } from '../public/js/client/battle-r85b.js';
import { checkText, gameFiles } from '../tools/kanji-check.mjs';

const NEW = ['yokai_bridge', 'ryujin_kenshi'];
const REQ = { yokai_bridge: ['bakuryuha', 'jigoku_sensei'], ryujin_kenshi: ['ryujin_samurai', 'rekka'] };
const KEYS = ['hp', 'mp', 'str', 'def', 'agi', 'mag', 'heal'];
const sum = (m) => KEYS.reduce((s, k) => s + m[k], 0);
const SCARY = /殺|死ね|ころす|ころし|血/;
const KANJI = /[一-鿿]/;
const textOk = (s, what) => assert.deepEqual(checkText(s), [], `${what}: ${s}`);
const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
const masterChain = (c, jid) => {
  for (const r of JOBS[jid].req || []) { master(c, r); masterChain(c, r); }
  if (JOBS[jid].reqSuper) master(c, 'god_hand');
};
function mk(id, job, lv = 60) {
  const c = newCharacter({ id, name: id, job: 'monk' });
  gainExp(c, expForLevel(lv));
  masterChain(c, job);
  master(c, job);
  c.job = job;
  c.equip.weapon = null;
  fullHeal(c);
  return c;
}
// jobs … 仲間の 職業。enemies … 魔物の 種類
function setup(jobs, { seed = 1, enemies = ['rockman'], act = 'm_nothing', mp = 999 } = {}) {
  const chars = jobs.map((j, i) => mk(`p${i}`, j));
  const b = new Battle({ rng: makeRng(seed), allies: chars.map((char) => ({ char, controller: 's1' })), enemies, canFlee: true });
  for (const e of b.enemies) {
    e.actions = [{ w: 1, id: act }];
    e.hp = e.maxHp = 50000;
  }
  for (const a of b.allies) { a.mp = a.maxMp = mp; a.hp = a.maxHp = 3000; }
  return { b, chars };
}
const readyUp = (b, a) => { for (let i = 0; i < 1200 && !a.ready; i++) b.tick(50); return a.ready; };
const runUntilAct = (b, id) => {
  const evs = [];
  for (let i = 0; i < 400 && !evs.some((e) => e.t === 'act' && e.id === id); i++) evs.push(...b.tick(50));
  return evs.find((e) => e.t === 'act' && e.id === id);
};
const use = (b, me, cmd) => {
  assert.ok(readyUp(b, me));
  const r = b.command(me.id, { target: b.enemies.find((e) => e.alive)?.id, ...cmd }, 's1');
  assert.equal(r.ok, true, `${cmd.id} ${r.reason || ''}`);
  return runUntilAct(b, me.id);
};
// すぐに 1回 動かす（ためしの 行動）
function act(b, u, cmd) {
  b.queue = [];
  if (cmd.type === 'ability' && !u.abilities.includes(cmd.id)) u.abilities.push(cmd.id);
  b.enqueue(u, cmd);
  b.executeNext();
  b.lock = 0;
  return b.flush().filter((e) => e.t === 'act').pop();
}
const dmgOn = (ev, id) => (ev?.results || []).filter((r) => r.id === id && r.dmg > 0).reduce((s, r) => s + r.dmg, 0);
const evOf = (id = 'x') => ({ id, lines: [], upd: [], results: [] });

// ───────────── 職業の データ ─────────────
test('第86回 A: 2つの 幻の職業（tier 4・きわめる 職業 2つ・幻の はんいの 能力・技 8こ・ならびの おわり）', () => {
  assert.deepEqual(Object.keys(JOBS_R86A), NEW);
  assert.deepEqual(R86A_PHANTOM, NEW);
  // 第98回: この あとに きずなの職業が 足された（data/kizuna.js）。B班の 2つの すぐ あと（15・16番め）の まま
  assert.deepEqual(PHANTOM_ORDER.slice(14, 16), NEW, 'B班の 2つの あと（掲示板の しるしの 番号は かわらない）');
  for (const id of NEW) {
    const j = JOBS[id];
    assert.equal(j.tier, 4);
    assert.ok(PHANTOM_LIVE.includes(id) && ALL_JOBS.includes(id));
    assert.deepEqual(j.req, REQ[id]);
    assert.deepEqual(PHANTOM_JOBS[id].masters, REQ[id]);
    assert.ok(!j.reqSuper);
    const s = sum(j.mods);
    assert.ok(s >= 10.85 - 1e-9 && s <= 11.9 + 1e-9, `${id}: 合計 ${s}`);
    assert.equal(j.learn.length, 8);
    assert.equal(j.learn.at(-1)[0], 10);
    assert.equal(j.learn.at(-1)[1], `${id}_sig`);
    const ids = j.learn.map(([, a]) => a);
    const sig = ABILITIES[`${id}_sig`];
    for (const a of ids) {
      assert.ok(ABILITIES[a], a);
      assert.equal(ABILITIES[a].job, id);
      if (a !== `${id}_sig`) assert.ok(ABILITIES[a].mp < sig.mp, `${a} より 看板の 技が MP を 使う`);
    }
    for (const t of [j.name, j.desc]) textOk(t, id);
    assert.ok(!SCARY.test(j.desc), j.desc);
    assert.ok(JOB_HINTS[id] && JOB_HINTS[id] === HINTS_R86A[id]);
    assert.ok(!/[0-9０-９]{2,}|万/.test(JOB_HINTS[id]), 'うわさに 数を 書かない');
    textOk(JOB_HINTS[id], id);
    const say = JOB_SAY[id];
    assert.ok(say && say.length <= 24 && say.startsWith('「') && say.endsWith('」'), say);
    assert.ok(TRIAL_WORDS[id] && TRIAL_WORDS[id].length <= 32, TRIAL_WORDS[id]);
    textOk(TRIAL_WORDS[id], id);
    assert.ok(JOB_TAGS[id]?.length >= 3);
  }
  // 「剣かこぶし」の 組（上限 ＝ 職業の 3分の1）: かけ橋は 剣（鉄さいが）。竜神の剣士は 入れない（のこりの 1つは B班の 格闘王の ために あける）
  assert.ok(JOB_TAGS.yokai_bridge.includes('sword'));
  assert.ok(!JOB_TAGS.ryujin_kenshi.includes('sword') && !JOB_TAGS.ryujin_kenshi.includes('fist'));
  // 自動で かばう（じごく先生と おなじ 8わり）
  assert.equal(JOBS.yokai_bridge.passive.r86aGuard, JOBS.jigoku_sensei.passive.protect);
  // 職業の試練の 倍率
  for (const id of NEW) assert.ok(Array.isArray(PHANTOM_ADJ[id]) && PHANTOM_ADJ[id].length === 3, id);
});

test('第86回 A: 技（16こ ＋ ひらめき 2こ）の 文字・名前が かぶらない・役わりが ある', () => {
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden) names.set(a.name, [...(names.get(a.name) || []), id]);
  const all = [...Object.keys(R86A_ABILITIES), ...Object.keys(HIRA_R86A_ABILITIES)];
  assert.equal(Object.keys(R86A_ABILITIES).length, 16);
  for (const id of all) {
    const a = ABILITIES[id];
    for (const s of [a.name, a.desc, a.cast]) textOk(s, id);
    assert.ok(!/\s/.test(a.name + a.desc + a.cast), `${id}: 空白なし`);
    assert.ok(!KANJI.test(a.kana), `${id}: ${a.kana}`);
    assert.equal(names.get(a.name).length, 1, `${a.name} は ほかの 技と かぶらない`);
    assert.ok(['dmg', 'heal', 'sup'].includes(abilityRole(a)), id);
    assert.ok(R86A_ANIMS.has(a.anim) || ['r82b_tamagae', 'r85b_call'].includes(a.anim), `${id}: ${a.anim}`);
  }
  // ひらめき: 1つずつ・その 職業の 時だけ・その 職業の 技から
  assert.deepEqual(Object.keys(HIRAMEKI_R86A).sort(), Object.keys(HIRA_R86A_ABILITIES).sort());
  for (const [id, h] of Object.entries(HIRAMEKI_R86A)) {
    assert.ok(HIRAMEKI[id]);
    const job = ABILITIES[id].job;
    for (const k of Object.keys(h.from)) assert.equal(ABILITIES[k].job, job);
    const c = newCharacter({ id: 'x', name: 'x', job: 'monk' });
    c.job = job;
    assert.equal(hiraAllowed(c, id), true);
    c.job = 'warrior';
    assert.equal(hiraAllowed(c, id), false);
  }
  for (const f of ['jobs-r86a.js', 'abilities-r86a.js', 'hirameki-r86a.js']) assert.ok(gameFiles().some((p) => p.endsWith(`shared/data/${f}`)), f);
  assert.ok(gameFiles().some((p) => p.endsWith('shared/battle-r86a.js')) && gameFiles().some((p) => p.endsWith('client/battle-r86a.js')));
});

// ───────────── なり方・条件の 数え方 ─────────────
test('第86回 A: 条件の タグ（かばう・守る／つめ・風・おにの手／雷／火竜）と 数え方', () => {
  assert.deepEqual(PHANTOM_TAGS.slice(-4), ['kabau', 'yokai', 'bolt', 'karyu'], '前の タグの 番号（引っこしコード）は かわらない');
  const has = (id, t) => assert.ok(abilityTags(id).includes(t), `${id} は ${t}`);
  const not = (id, t) => assert.ok(!abilityTags(id).includes(t), `${id} は ${t} で ない`);
  for (const id of ['kabau', 'tsg_kabau', 'bry_chikai', 'elem_teacher_sig', 'rk_hime', 'sukara', 'kb_kabau', 'kb_chikai', 'yokai_bridge_sig']) has(id, 'kabau');
  for (const id of ['tsg_hitofuri', 'nb_onite', 'rs_futae']) not(id, 'kabau');
  for (const id of ['hyb_sankon', 'hanyo_boy_sig', 'tessaiga_user_sig', 'iny_kaze_ren', 'nb_onite', 'nb_dasu', 'js_kakusei', 'jigoku_sensei_sig', 'bry_daiyou', 'kb_kaze', 'kb_onizume', 'kb_kizuna', 'hi_shiroinu']) has(id, 'yokai');
  for (const id of ['tsg_hitofuri', 'iny_akai', 'kabau', 'js_tsuiteru']) not(id, 'yokai');
  for (const id of ['rj_raikou', 'raijin_sword_sig', 'ry_ikari', 'rs_raien']) has(id, 'bolt');
  for (const id of ['rk_kiba', 'yb_zokusei', 'kabau']) not(id, 'bolt');
  for (const id of ['ej_ryu', 'enjutsushi_sig', 'rk_ryu', 'rk_kiba', 'rekka_sig', 'hi_ryuken', 'rs_ryu', 'ryujin_kenshi_sig']) has(id, 'karyu');
  for (const id of ['rk_hime', 'rk_renpatsu', 'ry_tachi']) not(id, 'karyu');
  // 条件の 文
  assert.equal(phantomCondText('yokai_bridge'), 'ばくりゅうはの大ようとおにの手のじごく先生をきわめる。かばう・守る技を500回使う。つめ・風・おにの手の技を500回使う');
  assert.equal(phantomCondText('ryujin_kenshi'), '竜神けんのサムライと八竜の炎術士・烈火をきわめる。雷の技を300回使う。火竜の技を300回使う。あたえたダメージの合計30万');
  // 引っこしコードの みじかい 形に 入る（新しい タグも 番号で）
  const f = { use: { kabau: 500, yokai: 12, bolt: 300, karyu: 7 }, dmg: 300000 };
  const s = packFeats(f);
  assert.ok(!s.includes('_kabau'), s);
  assert.deepEqual(unpackFeats(s).use, f.use);
});

test('第86回 A: 戦いで 使うと 数える（家族の キャラだけ）', () => {
  const { b } = setup(['yokai_bridge', 'ryujin_kenshi', 'warrior']);
  const [kb, rs, w] = b.allies;
  act(b, kb, { type: 'ability', id: 'kb_kabau', target: w.id });
  act(b, kb, { type: 'ability', id: 'kb_kaze' });
  act(b, rs, { type: 'ability', id: 'rs_raien' });
  act(b, rs, { type: 'ability', id: 'rs_ryu', ryu: 'saiha', target: b.enemies[0].id });
  assert.equal(kb.feat.use.kabau, 1);
  assert.equal(kb.feat.use.yokai, 1);
  assert.equal(rs.feat.use.bolt, 1);
  assert.equal(rs.feat.use.karyu, 1);
  assert.ok(rs.feat.dmg > 0);
});

test('第86回 A: なり方（2つを きわめて 条件を みたす）・幻の書・うわさ・神殿', () => {
  for (const id of NEW) {
    const c = newCharacter({ id: 'x', name: 'ユイ', job: 'warrior' });
    gainExp(c, expForLevel(60));
    assert.equal(jobUnlocked(c, id), false);
    // うわさ: 片方を はじめると 聞こえる
    c.jobs[REQ[id][0]] = { lv: 3, b: 10 };
    assert.ok(phantomRumors(c).includes(JOB_HINTS[id]));
    // 片方を きわめると 条件が 見える
    c.jobs[REQ[id][0]] = { lv: JOB_MAX_LEVEL, b: 999 };
    const row = phantomBook(c).find((r) => r.id === id);
    assert.ok(row.known && row.live && row.conds.length === PHANTOM_JOBS[id].conds.length);
    c.jobs[REQ[id][1]] = { lv: JOB_MAX_LEVEL, b: 999 };
    assert.equal(jobUnlocked(c, id), false, '条件が まだ');
    const add = { use: {} };
    for (const cond of PHANTOM_JOBS[id].conds) {
      if (cond.use) add.use[cond.use[0]] = cond.goal - 1;
      else add[cond.stat] = cond.goal;
    }
    addFeats(c, add);
    assert.equal(phantomReady(c, id), false, '1回 たりない');
    for (const cond of PHANTOM_JOBS[id].conds) if (cond.use) addFeats(c, { use: { [cond.use[0]]: 1 } });
    for (const cond of PHANTOM_JOBS[id].conds) assert.ok(condNow(c, cond) >= cond.goal);
    assert.equal(phantomReady(c, id), true);
    assert.equal(jobUnlocked(c, id), true);
    // 乗り物は なった 人の たなに だけ
    const vid = Object.keys(R86A_VEHICLES).find((v) => R86A_VEHICLES[v].jobs[0] === id);
    assert.ok(!vehicleShelf(c).includes(vid));
    c.jobs[id] = { lv: 1, b: 0 };
    assert.ok(vehicleShelf(c).includes(vid));
    assert.equal(VEHICLES[vid].phantom, true);
  }
});

// ───────────── 人とようかいのかけ橋 ─────────────
test('第86回 A かけ橋: かばって 受けた ダメージの 半分を ためる（上限）・次の 攻撃に のせる・うつと 0', () => {
  const { b } = setup(['yokai_bridge', 'warrior']);
  const [kb, w] = b.allies;
  const foe = b.enemies[0];
  act(b, kb, { type: 'ability', id: 'kb_kabau', target: w.id });
  assert.equal(kb.cover.target, w.id);
  assert.ok(kb.buffs.def);
  // 敵が 戦士を ねらう → かけ橋が 受けて ためる
  foe.actions = [{ w: 1, id: 'attack' }];
  const chance = b.rng.chance;
  b.rng.chance = () => true;
  const ev = act(b, foe, { type: 'attack', target: w.id });
  b.rng.chance = chance;
  const got = dmgOn(ev, kb.id);
  assert.ok(got > 0 && dmgOn(ev, w.id) === 0, ev.lines.join('/'));
  assert.equal(kb.r86aTame, Math.round(got * TAME_RATE));
  assert.ok(ev.r86aStored?.[kb.id]);
  assert.equal(pub(kb).r86aTame, kb.r86aTame);
  assert.deepEqual(r86aMarks(pub(kb)).map((m) => m.text), [`ためた力${kb.r86aTame}`]);
  // 自分を ねらわれた ぶんは ためない
  const before = kb.r86aTame;
  act(b, foe, { type: 'attack', target: kb.id });
  assert.equal(kb.r86aTame, before);
  // 上限（最大HPの TAME_CAP）
  kb.r86aTame = Math.round(kb.maxHp * TAME_CAP) - 100;
  const ev2 = evOf();
  b.cur = ev2;
  ev2.r86aCov = [kb.id];
  b.damage(foe, kb, 1000, ev2, {});
  assert.equal(kb.r86aTame, Math.round(kb.maxHp * TAME_CAP));
  b.cur = null;
  kb.hp = kb.maxHp;
  // 次の 攻撃の さいしょの 1回に のる → 0 に もどる
  kb.r86aTame = 500;
  const base = act(b, kb, { type: 'attack', target: foe.id });
  assert.ok(base.lines.some((l) => l.includes('ためた力をのせた')), base.lines.join('/'));
  assert.equal(kb.r86aTame, 0);
  assert.equal(pub(kb).r86aTame, 0);
  // のせた 時の ダメージは のせない 時より 大きい（同じ 乱数）
  const dm = (tame) => {
    const { b: b2 } = setup(['yokai_bridge'], { seed: 9 });
    b2.allies[0].r86aTame = tame;
    return dmgOn(act(b2, b2.allies[0], { type: 'attack', target: b2.enemies[0].id }), b2.enemies[0].id);
  };
  assert.ok(dm(400) >= dm(0) + 300, `${dm(400)} ${dm(0)}`);
  // ためた力の返し風: 当てた 敵 みんなに
  const { b: b3 } = setup(['yokai_bridge'], { enemies: ['rockman', 'rockman', 'rockman'] });
  b3.allies[0].r86aTame = 300;
  const ev3 = act(b3, b3.allies[0], { type: 'ability', id: 'kb_kaeshi' });
  assert.equal(ev3.r86aTameHit.length, 3);
});

test('第86回 A かけ橋: 弱った 仲間を 自動で かばう（8わり）。じごく先生も いる 時は 1人だけ', () => {
  const { b } = setup(['yokai_bridge', 'warrior'], { seed: 3 });
  const [kb, w] = b.allies;
  const foe = b.enemies[0];
  b.rng.chance = () => true;
  w.hp = Math.round(w.maxHp * 0.25);
  const ev = act(b, foe, { type: 'attack', target: w.id });
  assert.ok(dmgOn(ev, kb.id) > 0 && dmgOn(ev, w.id) === 0, ev.lines.join('/'));
  assert.ok(ev.lines.some((l) => l.includes(`${kb.name}が、${w.name}をかばった`)));
  assert.ok(kb.r86aTame > 0, 'かばって ためた');
  // 元気な 仲間は かばわない
  w.hp = w.maxHp;
  const ev2 = act(b, foe, { type: 'attack', target: w.id });
  assert.ok(dmgOn(ev2, w.id) > 0);
  // じごく先生と いっしょ: 1回の 攻撃に かばうのは 1人（先生）
  const { b: b2 } = setup(['jigoku_sensei', 'yokai_bridge', 'warrior'], { seed: 4 });
  const [js, kb2, w2] = b2.allies;
  b2.rng.chance = () => true;
  w2.hp = Math.round(w2.maxHp * 0.2);
  const ev3 = act(b2, b2.enemies[0], { type: 'attack', target: w2.id });
  assert.ok(dmgOn(ev3, js.id) > 0 && dmgOn(ev3, kb2.id) === 0 && dmgOn(ev3, w2.id) === 0, ev3.lines.join('/'));
  // 先生が 動けない 時は かけ橋が かばう
  js.status.sleep = { turns: 3 };
  const ev4 = act(b2, b2.enemies[0], { type: 'attack', target: w2.id });
  assert.ok(dmgOn(ev4, kb2.id) > 0 && dmgOn(ev4, w2.id) === 0, ev4.lines.join('/'));
  // 敵全体の 攻撃: 弱った 仲間 1人ぶんだけ（1回の 行動で 1回）
  delete js.status.sleep;
  for (const x of b2.allies) x.hp = x.maxHp;
  w2.hp = Math.round(w2.maxHp * 0.2);
  js.hp = Math.round(js.maxHp * 0.15);
  const ev5 = { id: b2.enemies[0].id, lines: [], upd: [], results: [], fx: { targets: b2.allies.map((x) => x.id) } };
  for (const x of b2.allies) b2.damage(b2.enemies[0], x, 300, ev5, {});
  const covers = ev5.lines.filter((l) => l.includes('をかばった'));
  assert.equal(covers.length, 1, ev5.lines.join('/'));
});

test('第86回 A かけ橋: きずなの力（命令できる・HP は へらない・ようかい化や おにの手と 足し算に しない）', () => {
  const { b } = setup(['yokai_bridge']);
  const kb = b.allies[0];
  const foe = b.enemies[0];
  const hp0 = kb.hp;
  act(b, kb, { type: 'ability', id: 'kb_kizuna' });
  assert.deepEqual(kb.r86aKizuna, { mult: 1.6, left: 4 });
  assert.ok(Math.abs(r86aPhysMult(kb) - 1.6) < 1e-9);
  // おにの手 ＋15% と いっしょ: 全体で 1.6倍（足し算に しない）
  kb.oni = { lv: 1, awake: 0, max: 0.9 };
  assert.ok(Math.abs(r86aPhysMult(kb) * 1.15 - 1.6) < 1e-9);
  // おにの手が 1.9倍（きずなより 強い）: きずなは 何も 足さない
  kb.oni = { lv: 6, awake: 1, max: 0.9 };
  assert.equal(r86aPhysMult(kb), 1);
  delete kb.oni;
  // 物理の ダメージが 上がる（みつもり）
  const e1 = b.calcPhys(kb, foe, { mult: 1 }, 1, 'phys', true).dmg;
  delete kb.r86aKizuna;
  const e0 = b.calcPhys(kb, foe, { mult: 1 }, 1, 'phys', true).dmg;
  assert.ok(e1 > e0 * 1.5, `${e1} ${e0}`);
  // 4回 行動すると おわる。HP は へらない・命令の ままの 行動（ようかい化しない）
  kb.r86aKizuna = { mult: 1.6, left: 4 };
  for (let i = 0; i < 4; i++) act(b, kb, { type: 'attack', target: foe.id });
  assert.ok(!kb.r86aKizuna);
  assert.equal(kb.hp, hp0);
  assert.ok(!kb.youkai);
});

test('第86回 A かけ橋: 人とようかいのきずな（1だん目 みんなを かばう → 2だん目 ためた力の 風）・下限 0.45倍', () => {
  const { b } = setup(['yokai_bridge', 'warrior', 'priest'], { enemies: ['rockman', 'rockman'] });
  const [kb, w, p] = b.allies;
  const [foe, foe2] = b.enemies;
  const ev = act(b, kb, { type: 'ability', id: 'yokai_bridge_sig' });
  assert.ok(kb.r86aGuard && kb.cover.target === 'all' && ev.r86aSigSet);
  assert.equal(pub(kb).r86aGuard, true);
  // 1体への 攻撃は かばう
  const e1 = act(b, foe, { type: 'attack', target: p.id });
  assert.ok(dmgOn(e1, kb.id) > 0 && dmgOn(e1, p.id) === 0);
  // 敵全体の 攻撃も 仲間の ぶんを かわりに 受ける（受ける ダメージは take 倍）
  for (const x of b.allies) x.hp = x.maxHp;
  const tame0 = kb.r86aTame;
  const ev2 = { id: foe.id, lines: [], upd: [], results: [], fx: { targets: b.allies.map((x) => x.id) } };
  for (const x of b.allies) b.damage(foe, x, 400, ev2, {});
  assert.equal(w.hp, w.maxHp);
  assert.equal(p.hp, p.maxHp);
  assert.equal(kb.maxHp - kb.hp, 3 * Math.max(Math.round(400 * 0.55), Math.round(400 * CUT_FLOOR.normal)));
  assert.ok(kb.r86aTame > tame0);
  // 軍師の 守りの 作戦などと 重ねても 下限
  kb.hp = kb.maxHp;
  kb.r85bMadoka = { cut: 0.3, left: 3 };
  const ev3 = evOf(foe.id);
  b.damage(foe, kb, 1000, ev3, {});
  assert.equal(kb.maxHp - kb.hp, Math.round(1000 * CUT_FLOOR.normal));
  delete kb.r85bMadoka;
  // その ダメージで たおれる 時は かわりに 受けない
  kb.hp = 100;
  w.hp = w.maxHp;
  const ev4 = { id: foe.id, lines: [], upd: [], results: [], fx: { targets: b.allies.map((x) => x.id) } };
  b.damage(foe, w, 2000, ev4, {});
  assert.ok(w.hp < w.maxHp && kb.hp === 100);
  kb.hp = kb.maxHp;
  // 2だん目: 次の 自分の 番の はじめに 風。ためた力は 0・かばうのは おわり
  kb.r86aTame = 600;
  const hp1 = foe.hp, hp2 = foe2.hp;
  const ev5 = act(b, kb, { type: 'defend' });
  assert.ok(ev5.r86aBurst && ev5.r86aBurst.tame === 600, JSON.stringify(ev5.r86aBurst));
  assert.ok(foe.hp < hp1 && foe2.hp < hp2);
  assert.equal(kb.r86aTame, 0);
  assert.ok(!kb.r86aGuard && kb.cover === null);
});

// ───────────── 竜神の剣士 ─────────────
test('第86回 A 竜神の剣士: 剣は 玉の 属性と 炎の よく 効く 方・二重の太刀・天気は 強い 方だけ', () => {
  const { b } = setup(['ryujin_kenshi']);
  const rs = b.allies[0];
  const foe = b.enemies[0];
  // 玉は 雷・水・氷・風・竜神（炎は いつも ある）
  assert.deepEqual(tamaSet(rs), KENSHI_TAMA);
  assert.equal(tamaOf(rs), 'bolt');
  assert.ok(!KENSHI_TAMA.includes('fire'));
  // よく 効く 方
  foe.resist = { fire: 2, bolt: 0.5 };
  let ev = act(b, rs, { type: 'ability', id: 'rs_futae', target: foe.id });
  assert.deepEqual(ev.r86aDual.els, ['fire']);
  foe.resist = { fire: 0.5, bolt: 2 };
  ev = act(b, rs, { type: 'ability', id: 'rs_futae', target: foe.id });
  assert.deepEqual(ev.r86aDual.els, ['bolt']);
  // 両方 効きにくい: ましな 方
  foe.resist = { fire: 0.25, bolt: 0.5 };
  assert.equal(bestEl(b, rs, foe, ['bolt', 'fire']), 'bolt');
  // すいこむ よろいの 属性は えらばない
  foe.resist = { fire: 1, bolt: 1 };
  foe.arArmor = 'bolt';
  assert.equal(bestEl(b, rs, foe, ['bolt', 'fire']), 'fire');
  delete foe.arArmor;
  // 二重の太刀: 1回目 玉・2回目 炎（同じ くらいなら）。炎が よく 効けば 2回とも 炎
  ev = act(b, rs, { type: 'ability', id: 'ryujin_kenshi_sig', target: foe.id });
  assert.deepEqual(ev.r86aDual.els, ['bolt', 'fire']);
  foe.resist = { fire: 1.5, bolt: 1 };
  ev = act(b, rs, { type: 'ability', id: 'ryujin_kenshi_sig', target: foe.id });
  assert.deepEqual(ev.r86aDual.els, ['fire', 'fire']);
  // 玉がえ（すばやい・氷に）→ 剣も 氷と 炎で くらべる
  foe.resist = { ice: 2, fire: 1, bolt: 1 };
  act(b, rs, { type: 'ability', id: 'rs_tamagae', tama: 'ice' });
  assert.equal(tamaOf(rs), 'ice');
  assert.equal(pub(rs).tama, 'ice');
  ev = act(b, rs, { type: 'ability', id: 'rs_futae', target: foe.id });
  assert.deepEqual(ev.r86aDual.els, ['ice']);
  // 天気: 雷の 天気なら 雷・晴れなら 炎（同じ 効きぐあいの 時）。2つの 天気は 足し算に ならない（1つの 当たりは 1つの 属性）
  act(b, rs, { type: 'ability', id: 'rs_tamagae', tama: 'bolt' });
  foe.resist = {};
  setWeather(b, 'thunder', 10, 'ally');
  assert.equal(bestEl(b, rs, foe, ['bolt', 'fire']), 'bolt');
  setWeather(b, 'sun', 10, 'ally');
  assert.equal(bestEl(b, rs, foe, ['bolt', 'fire']), 'fire');
  // みつもり（オート）も よく 効く 方
  foe.resist = { fire: 2, bolt: 0.5 };
  b.weather = null;
  const est = b.calcPhys(rs, foe, ABILITIES.rs_futae.effect, 1, 'phys', true).dmg;
  const fixed = b.calcPhys(rs, foe, { ...ABILITIES.rs_futae.effect, r86a: undefined }, 1, 'phys', true).dmg;
  assert.ok(est > fixed * 1.8, `${est} ${fixed}`);
});

test('第86回 A 竜神の剣士: 火竜は 4ひき（攻め 2・守り 1・生き返り 1）・烈火と おなじ メニュー', () => {
  assert.deepEqual(RYU_SET.kenshi, ['saiha', 'nadare', 'madoka', 'resshin']);
  assert.deepEqual(ryuSetOf('rs_ryu'), RYU_SET.kenshi);
  const { b } = setup(['ryujin_kenshi', 'warrior']);
  const [rs, w] = b.allies;
  const items = ryuItems(pub(rs), 'rs_ryu');
  assert.deepEqual(items.map((x) => x.value), RYU_SET.kenshi);
  let ev = act(b, rs, { type: 'ability', id: 'rs_ryu', ryu: 'madoka' });
  assert.deepEqual(ev.r85bRyu, ['madoka']);
  assert.ok(b.allies.every((x) => x.r85bMadoka));
  // よべない 火竜（こくう）は えらべず、オートの 火竜に なる
  ev = act(b, rs, { type: 'ability', id: 'rs_ryu', ryu: 'kokuu', target: b.enemies[0].id });
  assert.ok(RYU_SET.kenshi.includes(ev.r85bRyu[0]));
  // れっしん: たおれた 仲間を 生き返らせる
  w.alive = false;
  w.hp = 0;
  act(b, rs, { type: 'ability', id: 'rs_ryu', ryu: 'resshin', target: w.id });
  assert.ok(w.alive && w.hp > 0);
});

// ───────────── オート ─────────────
test('第86回 A オート: 前ぶれに 人とようかいのきずな・ボスで 自分の 技・ほかの 職業の オートは かわらない', () => {
  const { b } = setup(['yokai_bridge', 'ryujin_kenshi', 'warrior'], { enemies: ['rockman'] });
  const [kb, rs, w] = b.allies;
  const foe = b.enemies[0];
  b.rng.chance = () => true;
  for (const [x, c] of [[kb, 0], [rs, 1], [w, 2]]) x.abilities = learnedAbilities(x.penChar || x);
  foe.telegraph = { id: 'attack' };
  const mine = (x) => x.abilities.filter((id) => ABILITIES[id]).map((id) => ({ id, a: ABILITIES[id] }));
  const cmd = r86aPlan(b, kb, [foe], mine(kb), b.allies, { hard: true });
  assert.equal(cmd?.id, 'yokai_bridge_sig');
  foe.telegraph = null;
  foe.boss = true;
  const cmd2 = r86aPlan(b, rs, [foe], mine(rs), b.allies, { hard: true });
  assert.equal(ABILITIES[cmd2.id].job, 'ryujin_kenshi');
  // ほかの 職業では 何も しない（運も 使わない）
  let rolls = 0;
  b.rng.chance = () => { rolls++; return true; };
  assert.equal(r86aPlan(b, w, [foe], mine(w), b.allies, { hard: true }), null);
  assert.equal(rolls, 0);
  // decideAlly で こわれない
  for (const x of b.allies) for (let i = 0; i < 6; i++) assert.ok(decideAlly(b, x)?.type);
});

// ───────────── まぜた パーティー ─────────────
test('第86回 A まぜた パーティー: もとの 伝説（ばくりゅうは・じごく先生・竜神けん・烈火）・軍師・らんま・ゆう助と オートで 戦って こわれない', () => {
  for (const jobs of [['yokai_bridge', 'bakuryuha', 'jigoku_sensei', 'hoshin_gunshi'], ['ryujin_kenshi', 'ryujin_samurai', 'rekka', 'hiryu_master'], ['yokai_bridge', 'ryujin_kenshi', 'makai_prince', 'rekka']]) {
    const { b, chars } = setup(jobs, { enemies: ['rockman', 'rockman', 'rockman'], act: 'attack', mp: 400 });
    b.allies.forEach((x, i) => { x.abilities = learnedAbilities(chars[i]); x.controller = null; x.auto = true; });
    for (const e of b.enemies) { e.hp = e.maxHp = 8000; e.atk = 900; }
    for (let i = 0; i < 1500 && !b.over; i++) b.tick(50);
    assert.ok(b.turnCount > 20, jobs.join(','));
    // キャラにも セーブにも 項目を 足さない
    for (const c of chars) assert.ok(!JSON.stringify(c).includes('r86a'), c.job);
  }
  assert.deepEqual(Object.keys(pub({ side: 'enemy', id: 'e', name: 'e', hp: 1, maxHp: 1, mp: 0, maxMp: 0, buffs: {}, debuffs: {}, status: {}, resist: {} })).filter((k) => k.startsWith('r86a')), []);
});

// ───────────── 見た目・乗り物・えんしゅつ ─────────────
const DIRS = ['down', 'up', 'left', 'right'];
const inspect = (img) => {
  let n = 0;
  for (let i = 3; i < img.rgba.length; i += 4) if (img.rgba[i]) n++;
  return n;
};
const key = (img) => Buffer.from(img.rgba).toString('base64');
test('第86回 A 絵: 2つの 職業（男女・4つの 向き・ちがう え・もとの 伝説と ちがう）・白い かみと 黒い 手ぶくろ・左右の こて', () => {
  assert.deepEqual(LOOK_JOBS, NEW);
  for (const j of NEW) assert.ok(R86A_OUTFIT[j] && R86A_BODY[j] && R86A_OLD_LOOK[j], j);
  for (const job of NEW) {
    for (const body of [0, 1]) {
      for (const dir of DIRS) {
        const img = paintHero({ body, style: 'short', hcol: 'black' }, job, undefined, dir, 1, 4);
        assert.ok(inspect(img) > img.w * img.h * 0.12, `${job} ${body} ${dir}`);
        for (const other of [...NEW.filter((x) => x !== job), ...REQ[job]]) {
          assert.notEqual(key(paintHero({ body, style: 'short' }, job, undefined, dir, 0, 4)), key(paintHero({ body, style: 'short' }, other, undefined, dir, 0, 4)), `${job} は ${other} と ちがう`);
        }
      }
      const o = lookToOpts({ body }, job, ',cloth,,');
      assert.ok(o.outfit);
    }
  }
  assert.equal(jobBody('yokai_bridge').hcol, 'inugin', '白い かみ');
  assert.equal(jobBody('yokai_bridge').hand83, 'oni', '先生の 黒い 手ぶくろ');
  assert.equal(R86A_OUTFIT.yokai_bridge.main, '#d0202c', '赤い 着物');
  assert.ok(jobBody('ryujin_kenshi').kote86);
  for (const a of ['kizuna86', 'raien86']) assert.ok(AURA86A[a].cols && AURA86A[a].cols2, a);
  // こての ある え と ない え は ちがう
  const save = { ...R86A_BODY.ryujin_kenshi };
  delete R86A_BODY.ryujin_kenshi.kote86;
  const a = key(paintHero({ body: 0, style: 'short' }, 'ryujin_kenshi', undefined, 'down', 0, 8));
  Object.assign(R86A_BODY.ryujin_kenshi, save);
  assert.notEqual(a, key(paintHero({ body: 0, style: 'short' }, 'ryujin_kenshi', undefined, 'down', 0, 8)));
});

test('第86回 A 乗り物: 大きな白い犬・雷と炎の二ひきの竜（4方向・3コマ・こうか・竜は 横に 長い）', () => {
  const lit = (p) => (p ? p.px.filter(Boolean).length : 0);
  for (const id of Object.keys(R86A_VEHICLES)) {
    assert.equal(vehicleFrames(id), 3);
    for (const view of VIEWS) for (let f = 0; f < 3; f++) {
      assert.ok(lit(paintVehicle(id, view, f, 'back')) + lit(paintVehicle(id, view, f, 'front')) > 80, `${id} ${view} ${f}`);
      assert.ok(lit(paintVehicleFx(id, view, f)) > 0, `${id} ${view} ${f} こうか`);
      assert.ok(Number.isFinite(riderSpot(id, view, f).x));
    }
    textOk(VEHICLES[id].name, id);
    textOk(VEHICLES[id].desc, id);
  }
  // 竜は 横に 長い（馬に 見えない）。2ひき ＝ 青と 赤の 点が 両方 ある
  const p = paintVehicle('twin_dragons', 'side', 0, 'front');
  assert.ok(p.w >= 64);
  const pb = paintVehicle('twin_dragons', 'side', 0, 'back');
  const cols = new Set([...p.px, ...pb.px].filter(Boolean).map(String));
  assert.ok([...cols].some((c) => /2a6ae8/i.test(c)) && [...cols].some((c) => /d8301c/i.test(c)), [...cols].slice(0, 10).join(','));
});

test('第86回 A えんしゅつ: 看板の 技と 大事な 技・音・こわれない・札', () => {
  const used = new Set([...Object.keys(R86A_ABILITIES), ...Object.keys(HIRA_R86A_ABILITIES)].map((id) => ABILITIES[id].anim));
  used.add('r86a_burst');
  for (const anim of R86A_ANIMS) assert.ok(used.has(anim), anim);
  assert.deepEqual(Object.keys(R86A_SFX).sort(), [...R86A_ANIMS].sort());
  assert.deepEqual(Object.keys(R86A_HIT).sort(), [...R86A_ANIMS].sort());
  for (const a of PARTY_ANIMS_R86A) assert.ok(PARTY_ANIMS.has(a), a);
  const battle = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.match(battle, /Object\.assign\(ANIM_SFX, R86A_SFX\)/);
  assert.match(battle, /r86aPresent\(this, ev, hitDelay\)/);
  const src = readFileSync(new URL('../public/js/client/render/battlefx.js', import.meta.url), 'utf8');
  assert.match(src, /playR86aFx\(this, anim/);
  const noop = new Proxy({}, { get: () => () => {}, set: () => true });
  for (const anim of R86A_ANIMS) {
    for (const targets of [[{ x: 128, y: 66 }], [{ x: 60, y: 70 }, { x: 128, y: 82 }, { x: 196, y: 70 }]]) {
      const fx = new Effects();
      assert.equal(playR86aFx(fx, anim, targets, 'fire', { crit: true }, BW, BH), true, anim);
      fx.play(anim, targets, 'bolt', {});
      let t = 0;
      while (fx.parts.length && t < 4000) {
        fx.update(16);
        for (const p of fx.parts) if (p.kind === 'r85bDragon' && !(p.delay > 0)) R85B_FINE.r85bDragon(noop, p, Math.min(1, p.age / p.life));
        t += 16;
      }
      assert.ok(t <= 2200, `${anim}: ${t}ms`);
    }
  }
  assert.equal(playR86aFx(new Effects(), 'fire1', [{ x: 1, y: 1 }]), false);
  assert.deepEqual(r86aMarks({ alive: true, r86aTame: 120, r86aKizuna: 3, r86aGuard: true }).map((m) => m.text), ['ためた力120', 'きずな3', 'みんなを守る']);
  assert.deepEqual(r86aMarks({ alive: true, r86aTame: 0, r86aKizuna: 0 }), []);
  assert.deepEqual(r86aMarks({ alive: false, r86aTame: 9 }), []);
});
