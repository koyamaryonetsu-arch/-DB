// 第86回 B班: 幻の職業「天下一の格闘王」「混とんの大軍師」（docs/plan-r86-phantom-b.md・docs/plan-jobs-r79.md の 11）
//   職業の データ・なり方と やりこみの 条件（技の タグ）・れい丸 8発と カウンターで もどる・れい丸・しょう天は・水と お湯・1回だけ 立ち上がる
//   4つ目の 作戦「大魔法の時間」・早口 半分・太極・ギガ・スレイブ（強化を 消す・上限）・みんなでとなえる・オート・絵・えんしゅつ・乗り物・まぜた パーティー
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JOBS, ALL_JOBS, PHANTOM_ORDER, PHANTOM_LIVE, JOB_HINTS, JOB_MAX_LEVEL, TIER_ORDERS } from '../public/js/shared/data/jobs.js';
import { JOBS_R86B, R86B_JOBS, HINTS_R86B } from '../public/js/shared/data/jobs-r86b.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { R86B_ABILITIES } from '../public/js/shared/data/abilities-r86b.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
import { HIRA_R86B_ABILITIES, HIRAMEKI_R86B } from '../public/js/shared/data/hirameki-r86b.js';
import { PHANTOM_JOBS, PHANTOM_TAGS, abilityTags, tagMembers, condNow, phantomReady, phantomSeen, phantomBook } from '../public/js/shared/data/phantom.js';
import { addFeats, toFeats, packFeats, unpackFeats } from '../public/js/shared/world/phantom.js';
import { JOB_TAGS } from '../public/js/shared/data/job-tags.js';
import { JOB_SAY } from '../public/js/shared/data/job-talk.js';
import { TRIAL_WORDS } from '../public/js/shared/data/job-trials.js';
import { VEHICLES, vehicleShelf } from '../public/js/shared/data/vehicles.js';
import { PHANTOM_ADJ, phantomSkills } from '../public/js/shared/battle-trial.js';
import { newCharacter, jobUnlocked, jobKnown, gainExp, expForLevel, fullHeal, learnedAbilities, jobAbilities } from '../public/js/shared/stats.js';
import { Battle, pub } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { reiLeft, reiMax, reiDualMult } from '../public/js/shared/battle-r84a.js';
import { formOf, formPct } from '../public/js/shared/battle-r84b.js';
import { SAKUSEN, sakusenSet, sakusenPct, activePlan } from '../public/js/shared/battle-r83a.js';
import { chanting, GIGA_BOSS, GIGA_CAP, r85aLocked } from '../public/js/shared/battle-r85a.js';
import { R86B_AI, taiGigaCap, ENEMY_GIGA_MP } from '../public/js/shared/battle-r86b.js';
import { paintHero } from '../public/js/client/render/hero.js';
import { outfitOf, jobBody } from '../public/js/client/render/hero-outfit.js';
import { headOf } from '../public/js/client/render/hero-gear.js';
import { lookToOpts } from '../public/js/client/render/chars.js';
import { R86B_JOBS as LOOK_JOBS, R86B_OUTFIT, R86B_BODY, R86B_HAT, R86B_OLD_LOOK, AURA86B } from '../public/js/client/render/hero-r86b.js';
import { VIEWS, paintVehicle, paintVehicleFx, vehicleFrames, riderSpot, vehicleSize } from '../public/js/client/render/vehicle-art.js';
import { PARTY_ANIMS } from '../public/js/client/render/battlefx-jobs2.js';
import { R86B_ANIMS, R86B_SIGS, R86B_HIT, R86B_SFX, PARTY_ANIMS_R86B, playR86bFx } from '../public/js/client/render/battlefx-r86b.js';
import { r84aMarks } from '../public/js/client/battle-r84a.js';
import { r83aMarks } from '../public/js/client/battle-r83a.js';
import { SFX_R26 } from '../public/js/client/sfx-r26.js';
import { SFX_R33 } from '../public/js/client/sfx-r33.js';
import { checkText, gameFiles } from '../tools/kanji-check.mjs';

const KEYS = ['hp', 'mp', 'str', 'def', 'agi', 'mag', 'heal'];
const sum = (m) => KEYS.reduce((s, k) => s + m[k], 0);
const REQ = { tenkaichi_king: ['makai_prince', 'hiryu_master'], chaos_gunshi: ['doramata', 'hoshin_gunshi'] };
const SCARY = /殺|死ね|ころす|ころし|血|いじめ/;
const textOk = (s, what) => assert.deepEqual(checkText(s), [], `${what}: ${s}`);
const partsOf = (e) => (e.type === 'multi' ? e.parts : [e]);
const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
const masterChain = (c, jid) => {
  for (const r of JOBS[jid].req || []) { master(c, r); masterChain(c, r); }
  if (JOBS[jid].reqSuper) master(c, 'archmage');
};
function mk(id, job, lv = 60) {
  const c = newCharacter({ id, name: id, job: 'warrior', look: { body: 1 } });
  gainExp(c, expForLevel(lv));
  masterChain(c, job);
  master(c, job);
  c.job = job;
  c.equip.weapon = null;
  fullHeal(c);
  return c;
}
// jobs … 家族の 職業。enemies … 敵の 種類（何も しない・HP 5万）
function setup(jobs, { seed = 1, enemies = ['rockman'], boss = false, act = 'm_nothing' } = {}) {
  const chars = jobs.map((j, i) => mk('p' + i, j));
  const b = new Battle({ rng: makeRng(seed), allies: chars.map((char, i) => ({ char, controller: 's' + i })), enemies, canFlee: true, boss });
  for (const e of b.enemies) {
    e.actions = [{ w: 1, id: act }];
    e.hp = e.maxHp = 50000;
  }
  for (const a of b.allies) a.mp = a.maxMp = 999;
  return { b, chars };
}
// 1回 動かす（命令を 入れて すぐ 実行）
function act(b, u, cmd) {
  b.queue = [];
  if (cmd.type === 'ability' && !u.abilities.includes(cmd.id)) u.abilities.push(cmd.id);
  b.enqueue(u, cmd);
  b.executeNext();
  b.lock = 0;
  return b.flush().filter((e) => e.t === 'act').pop();
}
const dmgOf = (ev) => (ev?.results || []).filter((r) => r.dmg > 0).reduce((s, r) => s + r.dmg, 0);
// 敵が なぐって くる（ev … 敵の 行動）
//   （岩男は 力が 弱くて ダメージが 0 に なる ことが ある ので、力を 上げて かならず 当てる）
const hitBy = (b, e, t) => {
  e.atk = Math.max(e.atk || 0, 900);
  const ch = b.rng.chance;
  b.rng.chance = () => true;
  const ev = act(b, e, { type: 'attack', target: t.id });
  b.rng.chance = ch;
  return ev;
};

// ───────────── 職業の データ ─────────────
test('第86回 B の 幻の職業: 2つ（tier 4・きわめる 2つ・技 8こ・看板は Lv10 で いちばん MP・幻の はんいの 強さ）', () => {
  assert.deepEqual(R86B_JOBS, ['tenkaichi_king', 'chaos_gunshi']);
  for (const id of R86B_JOBS) {
    const j = JOBS[id];
    assert.equal(j, JOBS_R86B[id]);
    assert.equal(j.tier, 4, id);
    assert.deepEqual(j.req, REQ[id]);
    assert.ok(!j.reqSuper && !j.reqAlt, `${id}: req だけ`);
    assert.ok(PHANTOM_ORDER.includes(id) && PHANTOM_LIVE.includes(id) && TIER_ORDERS[4].includes(id), `${id} は 神殿の 幻の 一覧に`);
    assert.equal(ALL_JOBS.filter((x) => x === id).length, 1);
    assert.deepEqual(j.learn.map(([l]) => l), [1, 2, 3, 5, 6, 7, 8, 10]);
    assert.equal(j.learn[7][1], `${id}_sig`);
    const mps = j.learn.map(([, a]) => ABILITIES[a].mp);
    assert.equal(Math.max(...mps), mps[7], `${id}: 看板の 技が いちばん MP`);
    for (const [, a] of j.learn) assert.equal(ABILITIES[a].job, id, a);
    // 幻の はんい（10.85〜11.9）・もとの 2つの 伝説の どの 強さも 下まわらない
    const s = sum(j.mods);
    assert.ok(s >= 10.85 && s <= 11.9, `${id} 合計 ${s}`);
    for (const k of KEYS) assert.ok(j.mods[k] >= Math.max(...j.req.map((r) => JOBS[r].mods[k])), `${id} ${k}`);
    textOk(j.name, id);
    textOk(j.desc, id);
    assert.ok(!SCARY.test(j.desc));
    assert.ok(j.kana && j.short && j.color);
    // うわさ（数を 言わない・物語の 先や ボスの 名前を 書かない）・転職の ひとこと・師しょうの ことば（32字 いない）
    assert.equal(JOB_HINTS[id], HINTS_R86B[id]);
    assert.ok(!/[0-9０-９]{2,}|万/.test(JOB_HINTS[id]));
    textOk(JOB_HINTS[id], id);
    assert.ok(JOB_SAY[id] && JOB_SAY[id].length <= 24);
    textOk(JOB_SAY[id], id);
    assert.ok(TRIAL_WORDS[id] && TRIAL_WORDS[id].length <= 32);
    textOk(TRIAL_WORDS[id], id);
    // タグ（2〜4こ）
    assert.ok(JOB_TAGS[id]?.length >= 2 && JOB_TAGS[id].length <= 4);
    assert.equal(j.tags, JOB_TAGS[id]);
  }
  assert.equal(JOBS.tenkaichi_king.name, '天下一の格闘王');
  assert.equal(JOBS.chaos_gunshi.name, '混とんの大軍師');
  // 職業らしさ: 格闘王は 力・大軍師は 魔力が いちばん
  const top = (id) => KEYS.filter((k) => k !== 'hp').reduce((a, k) => (JOBS[id].mods[k] > JOBS[id].mods[a] ? k : a), 'mp');
  assert.equal(top('tenkaichi_king'), 'str');
  assert.equal(top('chaos_gunshi'), 'mag');
  // しくみの データ（もとの 伝説の 効き目と おなじ。幻だからと 上げない）
  assert.equal(JOBS.tenkaichi_king.reiMax, 8);
  assert.equal(JOBS.tenkaichi_king.formPct, 0.25);
  assert.deepEqual(JOBS.tenkaichi_king.passive.rise, JOBS.makai_prince.passive.rise);
  assert.equal(JOBS.chaos_gunshi.passive.hayakuchi, 0.5);
  assert.equal(JOBS.chaos_gunshi.sakusenPct, 0.25);
  assert.deepEqual(JOBS.chaos_gunshi.sakusenSet, ['seme', 'mamori', 'sokkou', 'mahou']);
});

test('第86回 B の 技: 16こ ＋ ひらめき 2つ・せつめいと 文字・伝説の 技より 強い・名前が かぶらない', () => {
  assert.equal(Object.keys(R86B_ABILITIES).length, 16);
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (a.kind !== 'monster') names.set(a.name, [...(names.get(a.name) || []), id]);
  for (const [id, a] of Object.entries({ ...R86B_ABILITIES, ...HIRA_R86B_ABILITIES })) {
    assert.ok(a.name && a.kana && a.desc && a.cast && a.anim && a.effect, id);
    assert.ok(['skill', 'spell'].includes(a.kind), id);
    for (const s of [a.name, a.desc, a.cast]) textOk(s, id);
    assert.ok(!SCARY.test(a.desc + a.cast), id);
    assert.equal(names.get(a.name).length, 1, `${a.name} が かぶる`);
    for (const p of partsOf(a.effect)) {
      if (p.type === 'phys' && a.target === 'enemy' && !p.hits) assert.ok(p.mult >= 3.5, `${id} 1体 ${p.mult}`);
      if (p.type === 'phys' && a.target === 'enemies' && !p.hits) assert.ok(p.mult >= 2.4, `${id} 全体 ${p.mult}`);
      if (p.type === 'magic' && a.target === 'enemies' && !p.r85aGiga) assert.ok(p.base[0] >= 125, `${id} 魔力 ${p.base}`);
    }
  }
  // 攻撃技は 2つ いじょう
  for (const id of R86B_JOBS) assert.ok(JOBS[id].learn.filter(([, a]) => partsOf(ABILITIES[a].effect).some((p) => p.type === 'phys' || p.type === 'magic')).length >= 2, id);
  // もとの 伝説の 技より 強い
  assert.ok(R86B_ABILITIES.tkk_sandan.effect.mult > ABILITIES.mk_sandan.effect.mult);
  assert.ok(R86B_ABILITIES.tenkaichi_king_sig.effect.mult > ABILITIES.ranma_sig.effect.mult);
  assert.ok(R86B_ABILITIES.kon_ragna.effect.base[0] > ABILITIES.dr_ragna.effect.base[0]);
  assert.ok(R86B_ABILITIES.kon_dragslave.effect.base[0] > ABILITIES.lina_sig.effect.base[0]);
  // ひらめき技: 1つの 職業に 1つ・その 職業の 技を 使いこむと
  for (const id of R86B_JOBS) {
    const hira = Object.entries(ABILITIES).filter(([, a]) => a.hirameki && a.job === id).map(([k]) => k);
    assert.equal(hira.length, 1, id);
    assert.equal(HIRAMEKI[hira[0]], HIRAMEKI_R86B[hira[0]]);
    for (const from of Object.keys(HIRAMEKI[hira[0]].from)) assert.equal(ABILITIES[from].job, id);
  }
  // Lv10 で ぜんぶ 覚える
  for (const id of R86B_JOBS) {
    const c = mk('x', id);
    assert.deepEqual(jobAbilities(c, id), JOBS[id].learn.map(([, a]) => a));
    for (const [, a] of JOBS[id].learn) assert.ok(learnedAbilities(c).includes(a), a);
  }
});

// ───────────── なり方・やりこみの 条件 ─────────────
test('第86回 B の なり方: 2つを きわめて やりこみの 条件も（片方で 条件が 見える・幻の書）', () => {
  assert.deepEqual(PHANTOM_JOBS.tenkaichi_king.conds.map((x) => [x.use.join('+'), x.goal]), [['fist', 1000], ['counter', 200]]);
  assert.deepEqual(PHANTOM_JOBS.chaos_gunshi.conds.map((x) => [x.use ? x.use.join('+') : x.stat, x.goal]), [['attackSpell', 500], ['sakusen', 500], ['dmgSpell', 400000]]);
  for (const t of ['fist', 'counter', 'sakusen']) assert.ok(PHANTOM_TAGS.includes(t), t);
  // 前から ある タグの 番号は かわらない（引っこしコードの みじかい 形）
  assert.deepEqual(PHANTOM_TAGS.slice(0, 16), ['gomu', 'thunderSpell', 'kame', 'hinokami', 'ninjutsu', 'support', 'deduce', 'healSpell', 'attackSpell',
    'sword', 'debuff', 'train', 'pitch', 'sun', 'rain', 'thunder']);
  for (const [id, cs] of [['tenkaichi_king', { use: { fist: 1000, counter: 200 } }], ['chaos_gunshi', { use: { attackSpell: 500, sakusen: 500 }, dmgSpell: 400000 }]]) {
    const c = newCharacter({ id: 'u' + id, name: 'ユイ', job: 'warrior' });
    const [a, b2] = REQ[id];
    assert.equal(jobKnown(c, id), false);
    assert.equal(phantomSeen(c, id), false);
    master(c, a);
    assert.equal(phantomSeen(c, id), true, '片方を きわめると 条件が 見える');
    const row = phantomBook(c).find((r) => r.id === id);
    assert.equal(row.known, true);
    assert.equal(row.conds.length, PHANTOM_JOBS[id].conds.length);
    master(c, b2);
    assert.equal(jobUnlocked(c, id), false, '条件が まだ');
    // 条件の 1つ 手前
    const almost = JSON.parse(JSON.stringify(cs));
    const k = Object.keys(almost.use)[0];
    almost.use[k] -= 1;
    addFeats(c, almost);
    assert.equal(jobUnlocked(c, id), false);
    addFeats(c, { use: { [k]: 1 } });
    assert.equal(phantomReady(c, id), true);
    assert.equal(jobUnlocked(c, id), true);
    // 2つ きわめて いないと なれない
    const d = newCharacter({ id: 'v' + id, name: 'ソラ', job: 'warrior' });
    d.feats = toFeats(cs);
    master(d, a);
    assert.equal(jobUnlocked(d, id), false);
  }
  // 引っこしコードの みじかい 形でも もどる（新しい タグも）
  const f = toFeats({ use: { fist: 999, counter: 12, sakusen: 345, gomu: 3 }, dmgSpell: 400000 });
  assert.deepEqual(unpackFeats(packFeats(f)), f);
});

test('第86回 B の 条件の 数え方: 素手の 技・カウンターの かまえ・作戦の 技・攻撃の 呪文と 呪文の ダメージ（技の タグ）', () => {
  // タグ: 格闘王・もとの 伝説の 素手の 技は fist。かまえは counter。軍師の 作戦の 技は sakusen
  for (const id of ['tkk_reigan', 'tkk_amaguri', 'tkk_sandan', 'mk_youga', 'hr_kidan', 'hr_senju', 'monk_sig', 'ms_amaguri']) if (ABILITIES[id]) assert.ok(abilityTags(id).includes('fist'), id);
  for (const id of ['tkk_mikiri', 'tenkaichi_king_sig', 'ranma_sig', 'ms_kawashi']) assert.ok(abilityTags(id).includes('counter'), id);
  for (const id of ['kon_sakusen', 'kon_minna', 'sd_sakusen', 'hg_gorei', 'taikobo_sig', 'hoshin_gunshi_sig']) assert.ok(abilityTags(id).includes('sakusen'), id);
  for (const id of ['kon_dashin', 'kon_ragna', 'kon_dragslave', 'chaos_gunshi_sig']) assert.ok(abilityTags(id).includes('attackSpell'), id);
  // 剣・呪文・補助は 素手に 入らない
  for (const id of ['mera', 'kon_dashin', 'kon_tonaeru', 'tkk_touki', 'tkk_kaburu']) assert.ok(!abilityTags(id).includes('fist'), id);
  for (const m of tagMembers('fist')) assert.ok(ABILITIES[m].kind !== 'spell', m);
  // 戦いで 数える
  const { b } = setup(['tenkaichi_king', 'chaos_gunshi']);
  const [K, G] = b.allies;
  K.kind = G.kind = 'player';
  act(b, K, { type: 'ability', id: 'tkk_amaguri', target: b.enemies[0].id });
  act(b, K, { type: 'ability', id: 'tkk_mikiri' });
  act(b, K, { type: 'ability', id: 'tenkaichi_king_sig' });
  act(b, G, { type: 'ability', id: 'kon_sakusen', sakusen: 'mahou' });
  const hp = b.enemies[0].hp;
  act(b, G, { type: 'ability', id: 'kon_dashin' });
  assert.equal(K.feat.use.fist, 1);
  assert.equal(K.feat.use.counter, 2);
  assert.equal(G.feat.use.sakusen, 1);
  assert.equal(G.feat.use.attackSpell, 1);
  assert.equal(G.feat.dmgSpell, hp - b.enemies[0].hp);
});

// ───────────── 天下一の格闘王 ─────────────
test('第86回 B の 格闘王: れい丸は 8発（札）・カウンターが 決まると 1発 もどる（上限まで）・ほかの 職業は もどらない', () => {
  const { b } = setup(['tenkaichi_king', 'makai_prince'], { seed: 3 });
  const [K, M] = b.allies;
  assert.equal(reiMax(K), 8);
  assert.equal(reiLeft(K), 8);
  assert.equal(reiMax(M), 6, '魔界の王の子は 6発の まま');
  assert.deepEqual(r84aMarks(pub(K)).map((m) => m.text), ['れい丸8']);
  act(b, K, { type: 'ability', id: 'tkk_sandan' });
  assert.equal(reiLeft(K), 6);
  // 見切りのかまえ → なぐられて 反撃（当たっても はずれても 反撃は 出る）→ れい丸が 1発 もどる
  b.rng.chance = () => true;
  act(b, K, { type: 'ability', id: 'tkk_mikiri' });
  const e = b.enemies[0];
  const ev = hitBy(b, e, K);
  assert.ok(ev.counter?.some((x) => x.actor === K.id), '反撃');
  assert.equal(reiLeft(K), 7);
  assert.ok(ev.r86bReiBack?.includes(K.id));
  // 上限（8）より ふえない
  K.r84aRei = 8;
  act(b, K, { type: 'ability', id: 'tkk_mikiri' });
  hitBy(b, e, K);
  assert.equal(reiLeft(K), 8);
  // 魔界の王の子が 反撃の 構えで 返しても、れい丸は もどらない（格闘王だけの しくみ）
  M.r84aRei = 3;
  act(b, M, { type: 'ability', id: 'tkk_mikiri' });
  hitBy(b, e, M);
  assert.equal(reiLeft(M), 3);
});

test('第86回 B の れい丸・しょう天は: 攻撃を 受けると れい丸を 2発 のせた 竜巻（ふつうより 強い）・たりなければ ふつうの 飛竜しょう天は・来なければ 風の 一ふり', () => {
  const run = (rei, seed = 7) => {
    const { b } = setup(['tenkaichi_king'], { seed, enemies: ['rockman', 'rockman'] });
    const [K] = b.allies;
    K.r84aRei = rei;
    K.r84bForm = 'oyu';
    act(b, K, { type: 'ability', id: 'tenkaichi_king_sig' });
    assert.equal(K.stance?.kind, 'hiryu');
    assert.ok(pub(K).r86bReiStance);
    const hp = b.enemies.map((x) => x.hp);
    const ev = hitBy(b, b.enemies[0], K);
    const dealt = b.enemies.reduce((s, x, i) => s + (hp[i] - x.hp), 0);
    return { ev, K, dealt };
  };
  const full = run(8);
  assert.ok(full.ev.r86bReiHiryu, 'れい丸を のせた 竜巻');
  assert.equal(full.ev.r86bReiHiryu.shots, 2);
  assert.equal(full.ev.r86bReiHiryu.targets.length, 2, '敵全体');
  assert.equal(reiLeft(full.K), 8 - 2 + 1, '2発 使って、カウンターで 1発 もどる');
  assert.equal(full.K.stance, null);
  const weak = run(1);
  assert.ok(!weak.ev.r86bReiHiryu, 'れい丸が たりない');
  assert.ok(weak.ev.r84bHiryuRet?.some((x) => x.by === weak.K.id), 'ふつうの 飛竜しょう天は');
  assert.equal(reiLeft(weak.K), 2, 'れい丸は 使わず、カウンターで 1発 もどる');
  assert.ok(full.dealt > weak.dealt * 1.4, `のせた 方が 強い ${full.dealt} ${weak.dealt}`);
  // 攻撃が 来なかった: 次の 自分の 番の はじめに 風の 一ふり ＋ MP 半分（もとと おなじ）
  const { b } = setup(['tenkaichi_king'], { seed: 2 });
  const [K] = b.allies;
  act(b, K, { type: 'ability', id: 'tenkaichi_king_sig' });
  const mp = K.mp;
  const ev = act(b, K, { type: 'defend' });
  assert.ok(ev.r84bSwing === K.id || ev.lines.some((l) => l.includes('風の一ふり')));
  assert.ok(K.mp > mp, 'MP が もどる');
  assert.equal(reiLeft(K), 8, '来なければ れい丸は へらない');
});

test('第86回 B の 格闘王: 水と お湯の すがた（伝説と おなじ 25%）・1回だけ 立ち上がる（2回めは ない）', () => {
  const { b } = setup(['tenkaichi_king'], { seed: 4 });
  const [K] = b.allies;
  assert.equal(formPct(K), 0.25);
  assert.equal(formOf(K), 'oyu', 'はじめは お湯');
  act(b, K, { type: 'ability', id: 'tkk_kaburu', form: 'mizu' });
  assert.equal(formOf(K), 'mizu');
  assert.equal(pub(K).r84bForm, 'mizu');
  // 立ち上がる
  const e = b.enemies[0];
  const ev = { lines: [], upd: [], results: [] };
  K.hp = 10;
  b.damage(e, K, 99999, ev, { phys: true });
  assert.ok(K.alive && K.hp === Math.round(K.maxHp * 0.5), '半分で 立ち上がる');
  assert.ok(K.r84aRise, 'しばらく 力が 上がる');
  b.damage(e, K, 99999, { lines: [], upd: [], results: [] }, { phys: true });
  assert.equal(K.alive, false, '2回めは ない');
});

// ───────────── 混とんの大軍師 ─────────────
test('第86回 B の 大魔法の時間: 4つ目の 作戦（25%）・となえて いる 仲間だけ 受ける ダメージが へる・となえた 力で うつ 呪文が 強い・作戦は 1つだけ', () => {
  const { b } = setup(['chaos_gunshi', 'hoshin_gunshi', 'doramata'], { seed: 5 });
  const [G, H, D] = b.allies;
  assert.deepEqual(sakusenSet(G), ['seme', 'mamori', 'sokkou', 'mahou']);
  assert.deepEqual(sakusenSet(H), ['seme', 'mamori', 'sokkou'], 'ほう神の大軍師は 3つの まま');
  assert.equal(sakusenPct(G), 0.25);
  assert.ok(SAKUSEN.mahou.name === '大魔法の時間');
  act(b, G, { type: 'ability', id: 'kon_sakusen', sakusen: 'mahou' });
  assert.equal(activePlan(b).kind, 'mahou');
  assert.deepEqual(r83aMarks(pub(D)).map((m) => m.text), ['大魔法25%']);
  // 受ける ダメージ: となえて いる 人だけ −25%
  const e = b.enemies[0];
  const hurt = (t) => {
    const hp = t.hp = t.maxHp = 99999;
    b.damage(e, t, 1000, { lines: [], upd: [], results: [] }, {});
    return hp - t.hp;
  };
  assert.equal(hurt(D), 1000);
  D.r85aChant = { left: 3 };
  assert.ok(chanting(D));
  assert.equal(hurt(D), 750);
  // となえた 力で うつ 呪文: ＋25%（となえた 力の 1.5倍に のる）／となえずに うった 呪文は そのまま
  const cast = (ch, seed) => {
    const s = setup(['doramata'], { seed });
    const [x] = s.b.allies;
    s.b.r83aPlan = { side: 'ally', by: x.id, kind: 'mahou', pct: 0.25, boost: 0, boostBy: null };
    if (ch) x.r85aChant = { left: 3 };
    return dmgOf(act(s.b, x, { type: 'ability', id: 'dr_zelas', target: s.b.enemies[0].id }));
  };
  const plain = cast(false, 9), powered = cast(true, 9);
  assert.ok(Math.abs(powered / plain - 1.5 * 1.25) < 0.05, `${powered} / ${plain}`);
  // 作戦は 1つだけ（ほう神の大軍師が 守りを 立てると かわる）
  act(b, H, { type: 'ability', id: 'sd_sakusen', sakusen: 'mamori' });
  assert.equal(activePlan(b).kind, 'mamori');
});

test('第86回 B の 早口（半分）・みんなでとなえる（仲間全員が となえる）', () => {
  // 早口: 運が よければ すぐ 動ける・悪ければ ふつう（わりあいは 0.5）
  for (const ok of [true, false]) {
    const { b } = setup(['chaos_gunshi'], { seed: 6 });
    const [G] = b.allies;
    b.rng.chance = (p) => (p === 0.5 ? ok : false);
    const ev = act(b, G, { type: 'ability', id: 'kon_tonaeru' });
    assert.ok(chanting(G));
    assert.equal(ev.r85aHaya === G.id, ok);
  }
  const { b } = setup(['chaos_gunshi', 'tenkaichi_king', 'doramata'], { seed: 6 });
  const [G, K, D] = b.allies;
  K.status.silence = { turns: 3 };
  const ev = act(b, G, { type: 'ability', id: 'kon_minna' });
  assert.ok(chanting(G) && chanting(D), 'みんな となえて いる');
  assert.ok(!K.r85aChant, '呪文ふうじの 人は となえられない');
  assert.deepEqual(ev.r86bChantAll.sort(), [G.id, D.id].sort());
  // となえて いる 仲間は 大砲が うてる
  assert.equal(r85aLocked(D, ABILITIES.lina_sig), false);
  assert.ok(dmgOf(act(b, D, { type: 'ability', id: 'lina_sig' })) > 0);
});

test('第86回 B の 太極・ギガ・スレイブ: となえて から・敵の ふつうの 強化を 消す（ボスの しかけは 消さない）・のこりの MP を 全部・上限（作戦が あっても）', () => {
  const { b } = setup(['chaos_gunshi'], { seed: 8, enemies: ['rockman', 'rockman'] });
  const [G] = b.allies;
  assert.equal(r85aLocked(G, ABILITIES.chaos_gunshi_sig), true, 'となえて いないと えらべない');
  const [e1, e2] = b.enemies;
  e1.buffs.atk = { mult: 1.5, left: 3 };
  e2.buffs.def = { mult: 1.5, left: Infinity };
  G.r85aChant = { left: 3 };
  G.mp = 500;
  const ev = act(b, G, { type: 'ability', id: 'chaos_gunshi_sig' });
  assert.ok(!e1.buffs.atk, 'ふつうの 強化は 消える');
  assert.ok(e2.buffs.def, 'ずっと つづく しかけは のこる');
  assert.equal(G.mp, 0, 'MP は 0');
  assert.ok(!G.r85aChant, 'となえは 消える');
  assert.ok(ev.r86bGiga.used >= 500 && ev.r86bGiga.gone === 1);
  for (const r of ev.results.filter((x) => x.dmg > 0)) assert.ok(r.dmg <= GIGA_CAP);
  // ボスは 最大HP の 3わりまで（MP 999・攻めの 作戦・大魔法の時間でも）
  for (const kind of ['seme', 'mahou']) {
    const s = setup(['chaos_gunshi'], { seed: 8, boss: true });
    const [x] = s.b.allies;
    const boss = s.b.enemies[0];
    boss.boss = true;
    boss.hp = boss.maxHp = 6000;
    s.b.r83aPlan = { side: 'ally', by: x.id, kind, pct: 0.25, boost: 3, boostBy: x.id };
    x.r85aChant = { left: 3 };
    x.mp = x.maxMp = 999;
    act(s.b, x, { type: 'ability', id: 'chaos_gunshi_sig' });
    assert.equal(boss.maxHp - boss.hp, Math.round(6000 * GIGA_BOSS), `${kind}: 3わりで 止まる`);
    assert.equal(taiGigaCap(boss), Math.round(6000 * GIGA_BOSS));
  }
  // 敵の がわ（まぼろし）は となえずに うてるが、力は 半分・使う MP は 上限まで
  const s = setup(['chaos_gunshi'], { seed: 8 });
  const foe = s.b.enemies[0];
  foe.mp = foe.maxMp = 5000;
  foe.abilities = ['chaos_gunshi_sig'];
  const fev = act(s.b, foe, { type: 'ability', id: 'chaos_gunshi_sig', target: s.b.allies[0].id });
  assert.ok(fev.r86bGiga.used <= ENEMY_GIGA_MP);
});

// ───────────── オート ─────────────
test('第86回 B の オート: 格闘王は 前ぶれ・強化した 敵に れい丸・しょう天は／大軍師は ボスで 大魔法の時間・強化した 敵に 太極・ギガ・スレイブ／ほかの 職業は かわらない', () => {
  const pick = (job, fn = () => {}, o = {}) => {
    const s = setup([job], { seed: 11, boss: true, ...o });
    const [me] = s.b.allies;
    s.b.enemies[0].boss = true;
    me.abilities = learnedAbilities(s.chars[0]);
    fn(s, me);
    const out = [];
    for (let i = 0; i < 30; i++) out.push(decideAlly(s.b, me));
    return out;
  };
  const tele = pick('tenkaichi_king', (s) => { s.b.enemies[0].telegraph = { name: '大技' }; });
  assert.ok(tele.some((c) => c.id === 'tenkaichi_king_sig'), '前ぶれに かまえる');
  const pumped = pick('tenkaichi_king', (s) => { s.b.enemies[0].buffs = { atk: { mult: 1.5, left: 3 }, def: { mult: 1.5, left: 3 } }; });
  assert.ok(pumped.some((c) => c.id === 'tenkaichi_king_sig'));
  const plan = pick('chaos_gunshi');
  assert.ok(plan.every((c) => c.id === 'kon_sakusen' && c.sakusen === 'mahou'), JSON.stringify(plan[0]));
  const tai = pick('chaos_gunshi', (s, me) => {
    s.b.r83aPlan = { side: 'ally', by: me.id, kind: 'mahou', pct: 0.25, boost: 0, boostBy: null };
    s.b.enemies[0].buffs = { atk: { mult: 1.5, left: 3 } };
    me.r85aChant = { left: 3 };
    me.mp = me.maxMp;
  });
  assert.ok(tai.every((c) => c.id === 'chaos_gunshi_sig'));
  assert.ok(R86B_AI.mahou >= 0 && R86B_AI.mahou <= 1);
  // ほかの 職業の オートは かわらない（この 2つの 職業の 技を 持たない 人は 運も 使わない）
  for (const job of ['makai_prince', 'hiryu_master', 'doramata', 'hoshin_gunshi', 'sword_saint']) {
    const a = setup([job], { seed: 9, boss: true });
    const c = setup([job], { seed: 9, boss: true });
    a.b.allies[0].abilities = learnedAbilities(a.chars[0]);
    c.b.allies[0].abilities = learnedAbilities(c.chars[0]);
    const x = decideAlly(a.b, a.b.allies[0]);
    assert.deepEqual(x, decideAlly(c.b, c.b.allies[0]));
    assert.ok(!(x.type === 'ability' && ABILITIES[x.id]?.job && R86B_JOBS.includes(ABILITIES[x.id].job)));
  }
});

test('第86回 B の 合体技・職業の試練: れい丸の 技は 割り引いて 数える・まぼろしは かまえと みんなでとなえるを 使わない', () => {
  const { b } = setup(['tenkaichi_king']);
  const [K] = b.allies;
  assert.equal(reiDualMult(K, ABILITIES.tkk_reigan), 1);
  assert.ok(Math.abs(reiDualMult(K, ABILITIES.tkk_sandan) - 1 / Math.SQRT2) < 1e-9);
  for (const id of R86B_JOBS) {
    const sk = phantomSkills(id);
    assert.ok(sk.length >= 4, id);
    assert.ok(!sk.includes('tenkaichi_king_sig') && !sk.includes('kon_minna') && !sk.includes('kon_sakusen') && !sk.includes('kon_tonaeru'), sk.join());
    assert.ok(Array.isArray(PHANTOM_ADJ[id]) && PHANTOM_ADJ[id].length === 3, `${id} の 試練の 倍`);
  }
});

// ───────────── 絵・えんしゅつ・乗り物 ─────────────
test('第86回 B の 衣装: 2つ × 体の 型 × 4つの 向き（布の服・装備）・もとの 伝説と ちがう・とくちょう', () => {
  const LOOK = (body) => ({ body, hair: body ? 1 : 0, hairColor: 1, skin: 0, color: 0 });
  assert.deepEqual(LOOK_JOBS, R86B_JOBS);
  for (const id of R86B_JOBS) {
    assert.ok(R86B_OUTFIT[id]?.kind && R86B_BODY[id] && R86B_HAT[id] && R86B_OLD_LOOK[id]?.outfit);
    for (const body of [0, 1]) {
      const O = outfitOf({ body, cloth: '#d9534f' }, id, null, body === 1);
      assert.equal(jobBody(id, body === 1), O.body);
      assert.ok(headOf(null, id, null, { fem: body === 1 }));
      for (const dir of ['down', 'up', 'left', 'right']) for (const f of [0, 1]) for (const eq of [',,,', 'iron_sword,iron_armor,iron_shield,iron_helm']) {
        const img = paintHero(LOOK(body), id, eq, dir, f, 4);
        let n = 0;
        for (let i = 3; i < img.rgba.length; i += 4) if (img.rgba[i]) n++;
        assert.ok(n > img.w * img.h * 0.15, `${id} ${body} ${dir}`);
      }
      // もとの 2つの 伝説と ちがう 絵
      const me = paintHero(LOOK(body), id, ',,,', 'down', 0, 4).rgba.join();
      for (const r of REQ[id]) assert.notEqual(paintHero(LOOK(body), r, ',,,', 'down', 0, 4).rgba.join(), me, `${id} と ${r}`);
      assert.equal(lookToOpts(LOOK(body), id, ',cloth,,').outfit, R86B_OLD_LOOK[id].outfit);
    }
  }
  const O = (id) => outfitOf({ body: 1, cloth: '#d9534f' }, id, null, true);
  // 格闘王: 白い 道着・赤い 上着（羽織）・金の ベルト・おさげ・オーラ
  assert.equal(R86B_OUTFIT.tenkaichi_king.kind, 'gi');
  assert.ok(O('tenkaichi_king').haori, '赤い 上着');
  assert.ok(O('tenkaichi_king').belt?.obi);
  assert.equal(R86B_BODY.tenkaichi_king.hair, 'braid');
  // 大軍師: 道士の 服・黒い マント・かたあて・太極の しるし
  assert.equal(R86B_OUTFIT.chaos_gunshi.kind, 'robe');
  assert.ok(O('chaos_gunshi').cape);
  assert.ok(O('chaos_gunshi').pauldron);
  assert.equal(R86B_BODY.chaos_gunshi.prop, 'taiji86');
  for (const id of R86B_JOBS) assert.ok(AURA86B[R86B_BODY[id].aura]);
});

test('第86回 B の えんしゅつ: 看板の 技・大事な 技・みかたの えんしゅつ・音・こわれない', () => {
  const anims = new Set();
  for (const a of Object.values({ ...R86B_ABILITIES, ...HIRA_R86B_ABILITIES })) anims.add(a.anim);
  for (const a of anims) if (a.startsWith('r86b') || a.endsWith('_sig')) assert.ok(R86B_ANIMS.has(a), a);
  assert.deepEqual(R86B_SIGS, ['tenkaichi_king_sig', 'chaos_gunshi_sig']);
  for (const a of R86B_ANIMS) {
    assert.ok(R86B_HIT[a] >= 0 && R86B_HIT[a] <= 2400, a);
    assert.ok(R86B_SFX[a] && (SFX_R26[R86B_SFX[a]] || SFX_R33[R86B_SFX[a]] || ['hit', 'wind', 'blast', 'buff', 'heal', 'sparkle', 'fire', 'thunder', 'debuff'].includes(R86B_SFX[a])), a);
  }
  for (const a of PARTY_ANIMS_R86B) assert.ok(PARTY_ANIMS.has(a));
  // にせの えんしゅつで こわれない（ぜんぶ true）
  const fake = new Proxy({}, { get: () => () => undefined });
  const T = [{ x: 100, y: 60 }, { x: 140, y: 60 }];
  for (const a of R86B_ANIMS) assert.equal(playR86bFx(fake, a, T, null, { rei: 2 }), true, a);
  assert.equal(playR86bFx(fake, 'fire1', T, null, {}), false);
});

test('第86回 B の 乗り物: 武術会のリング・空飛ぶカバの軍師台（幻に なった 人の 店だけ・4方向 × 3コマ）', () => {
  const ring = VEHICLES.tenka_ring, stage = VEHICLES.hippo_stage;
  assert.deepEqual(ring.jobs, ['tenkaichi_king']);
  assert.deepEqual(stage.jobs, ['chaos_gunshi']);
  for (const v of [ring, stage]) {
    assert.equal(v.phantom, true);
    assert.ok(v.price >= 20000 && v.price <= 30000);
    textOk(v.name, v.name);
    textOk(v.desc, v.name);
  }
  assert.ok(!vehicleShelf({ job: 'makai_prince', jobs: { makai_prince: { lv: 10 }, hiryu_master: { lv: 10 } } }).includes('tenka_ring'));
  assert.ok(vehicleShelf({ job: 'warrior', jobs: { warrior: {}, tenkaichi_king: { lv: 1 } } }).includes('tenka_ring'));
  assert.ok(vehicleShelf({ job: 'chaos_gunshi', jobs: { chaos_gunshi: { lv: 1 } } }).includes('hippo_stage'));
  for (const id of ['tenka_ring', 'hippo_stage']) {
    assert.equal(vehicleFrames(id), 3);
    for (const view of VIEWS) {
      const [w, h] = vehicleSize(id, view);
      for (let f = 0; f < 3; f++) {
        assert.ok(paintVehicle(id, view, f, 'front').px.filter(Boolean).length > 40, `${id} ${view}`);
        assert.ok(paintVehicleFx(id, view, f).px.filter(Boolean).length > 0);
        const R = riderSpot(id, view, f);
        assert.ok(R.y >= -12 && R.x + 16 > 4 && R.x + 16 < w - 4 && R.y < h, `${id} ${view} ${f}`);
      }
    }
  }
});

test('第86回 B の 文字: 新しい ファイルは 漢字チェックの 対象・使えない 漢字と 空白が ない', () => {
  const files = gameFiles();
  for (const f of ['jobs-r86b.js', 'abilities-r86b.js', 'hirameki-r86b.js', 'battle-r86b.js']) assert.ok(files.some((x) => x.endsWith(f)), f);
  assert.ok(files.some((x) => x.endsWith('client/battle-r86b.js')));
});

// ───────────── まぜた パーティー ─────────────
test('第86回 B の まぜた パーティー: 格闘王・大軍師と もとの 4つの 伝説（れい丸・すがた・作戦・となえる）が おたがいを こわさない', () => {
  const { b, chars } = setup(['tenkaichi_king', 'chaos_gunshi', 'hoshin_gunshi', 'hiryu_master', 'doramata', 'makai_prince'], { seed: 86, enemies: ['rockman', 'rockman'] });
  const [K, G, H, R, D, M] = b.allies;
  for (const a of b.allies) { a.maxHp = a.hp = 4000; }
  // 大軍師の 大魔法の時間 → ほう神の大軍師の 号令 → ドラまたが となえて 大砲（作戦も のる）
  act(b, G, { type: 'ability', id: 'kon_sakusen', sakusen: 'mahou' });
  act(b, D, { type: 'ability', id: 'ln_tonaeru' });
  act(b, H, { type: 'ability', id: 'hg_gorei', target: D.id });
  assert.ok(D.r85aChant, '号令で 動いても となえは のこる');
  assert.ok(dmgOf(act(b, D, { type: 'ability', id: 'lina_sig' })) > 0);
  assert.equal(activePlan(b).kind, 'mahou');
  // 格闘王と 魔界の王の子の れい丸は べつ・らんまの すがたも べつ
  act(b, K, { type: 'ability', id: 'tkk_reigan', target: b.enemies[0].id });
  act(b, M, { type: 'ability', id: 'mk_youga', target: b.enemies[0].id });
  assert.equal(reiLeft(K), 7);
  assert.equal(reiLeft(M), 5);
  act(b, R, { type: 'ability', id: 'ms_mizu', form: 'mizu' });
  assert.equal(formOf(R), 'mizu');
  assert.equal(formOf(K), 'oyu');
  // 飛竜しょう天はの達人の かまえ（ふつう）と 格闘王の れい丸・しょう天は（れい丸を のせる）が ならんでも、それぞれ 自分が なぐられた 時だけ
  act(b, R, { type: 'ability', id: 'ranma_sig' });
  act(b, K, { type: 'ability', id: 'tenkaichi_king_sig' });
  const ev = hitBy(b, b.enemies[0], K);
  assert.equal(ev.r86bReiHiryu?.by, K.id);
  assert.equal(reiLeft(K), 7 - 2 + 1);
  assert.equal(R.stance?.kind, 'hiryu', '達人の かまえは のこる');
  assert.ok(!R.stance.rei86);
  // オート: みんな こわれない（600 ちくたく）
  b.allies.forEach((x, i) => { x.abilities = learnedAbilities(chars[i]); });
  for (const x of b.allies) for (let i = 0; i < 6; i++) assert.ok(decideAlly(b, x)?.type);
  for (const x of b.allies) x.controller = null;
  for (const e of b.enemies) e.actions = [{ w: 1, id: 'm_nothing' }];
  for (let i = 0; i < 600; i++) b.tick(50);
  assert.ok(b.allies.every((x) => x.alive));
  for (const x of b.allies) assert.ok(pub(x));
});
