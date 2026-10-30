// 第5章 Step 9（B9）「星のない広間」の 最後の 戦い: ノクト（本気。nocto_2）と 魔王ソリトゥス（solitus）
// ノクト（本気）… まね・かげぶんしん → 合体技（合体技の よやくも くだく）・地われ・きずなくだき・HP半分で 終わらない・かけらと 手紙で ことばが かわる
// ソリトゥス … 3つの 段階（1回の 攻撃で 2つ とばない）・ひとりにする → 新しい コマンド「よびかける」（オートも 回復の あとで）・
//   仲間の 回復と 補助が とどかない・第2段階で 背景が かわる・きずなを食べる（身を 守ると よやくと 強くなる 力が 守れる）・
//   第3段階で ノクトが ゲストで 加わる・家族の きずな技（だれでも・ゲージ・全員の 名前）・終わらない夜
// 品（★5・いちばん 強い 剣）・仲間の ノクト（NOCTO_COMPANION）・シミュレーション・絵・背景・エフェクト・がめん・文字
// 第2部 第6章の 品（items-past.js）は 第1部の あと（ソリトゥスの 剣より 強くて よい）
import { ITEMS_PAST } from '../public/js/shared/data/items-past.js';
// 第6章 Step 3・4 の 星めぐりの古道の 品（items-road.js）も おなじ
import { ITEMS_ROAD } from '../public/js/shared/data/items-road.js';
// 第6章 Step 5 の 時計塔の 品（items-tokei.js）も おなじ
import { ITEMS_TOKEI } from '../public/js/shared/data/items-tokei.js';
import { ITEMS_TOKEI6 } from '../public/js/shared/data/items-tokei6.js';
// 第50回 D3: 第6章の 区切りの あとに ならぶ 景品（時計塔の 品と おなじ ころ）は のぞく
import { ITEMS_PRIZE_R50 } from '../public/js/shared/data/items-prize-r50.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle, pub } from '../public/js/shared/battle.js';
import { decideMonster, decideAlly } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { JOBS } from '../public/js/shared/data/jobs.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { monsterDrops, rollDrops } from '../public/js/shared/data/loot.js';
import { starsOf, bossRareOf, rareWhereText } from '../public/js/shared/data/rare-loot.js';
import { learnedAbilities, canEquip } from '../public/js/shared/stats.js';
import { MONSTERS_FINAL, NOCTO2, SOLITUS } from '../public/js/shared/data/monsters-final.js';
import { FINAL_ABILITIES } from '../public/js/shared/data/abilities-final.js';
import { ITEMS_FINAL, FINAL_ITEM_KANA } from '../public/js/shared/data/items-final.js';
import { FIXED_FINAL } from '../public/js/shared/data/encounters-final.js';
import { NOCTO_COMPANION, NOCTO_GUEST } from '../public/js/shared/data/companions-castle.js';
import { MEMORY_SHARD_FLAGS } from '../public/js/shared/maps/memory.js';
import {
  CALL, BOND, ALONE, ALONE_ID, EAT_WATCH, EAT, NIGHT_WATCH, NIGHT, SHARD_FLAGS, LETTER_FLAG, BOND_NAME, BOND_MAX, BOND_WAIT, VOID_BG,
  solitusOf, aloneAllies, finalPlan, bondPower, bondMembers, noctoGuestChar, heartOf,
} from '../public/js/shared/battle-final.js';
import { COMBO, COMBO_READY, CLONES, RIFT_ID, clonesOf, reachPlan } from '../public/js/shared/battle-earth.js';
import * as TT from '../public/js/shared/battle-ch5.js';
import { MIMIC, BOND_WATCH, BOND_BREAK } from '../public/js/shared/battle-nocto.js';
import { makeNpcSupportChar } from '../public/js/shared/world/party.js';
import { startFixedBattle } from '../public/js/shared/world/battles.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { finalRun, finalParty, FINAL_KIT, SOLITUS_KIT } from '../tools/sim-final.mjs';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { battleBgSpec } from '../public/js/client/render/battlefx.js';
import { FINAL_BG, FINAL_DECOS, drawFinalBg, drawFinalFloorBg } from '../public/js/client/render/ch5-final-bg.js';
import { playFinalFx } from '../public/js/client/render/battlefx-final.js';
import { playTowerFx } from '../public/js/client/render/battlefx-ch5.js';
import {
  FINAL_SCREEN_ANIMS, FINAL_ALLY_FX, FINAL_SFX, FINAL_OWN_TELE, finalCmdItems, finalCmdPick, finalDraw, finalPresent, bondReady, BOND_TECH,
} from '../public/js/client/battle-final.js';
import { earthReachItem, earthMarks } from '../public/js/client/battle-earth.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';
import { Bot } from './helpers.js';

function battle(boss, opts = {}) {
  const party = opts.party || finalParty(55, boss);
  const allies = party.map((c, i) => ({ char: c, kind: 'support', auto: !(opts.human && i === 0), tactics: 'balanced', controller: 'sim' }));
  const b = new Battle({ rng: makeRng(opts.seed ?? 3), allies, enemies: [boss], boss: true, canFlee: false });
  for (const a of b.allies) a.use = null;
  return { b, m: b.enemies[0], a: b.allies };
}
const evOf = (c) => ({ t: 'act', id: c.id, lines: [], upd: [], fx: null });
function act(b, c, cmd) {
  const ev = evOf(c);
  b.cur = ev;
  b.perform(c, cmd, ev);
  b.cur = null;
  if (ev.postLines) ev.lines.push(...ev.postLines);
  return ev;
}
// HPを その わりあいまで へらす（1回の 攻撃）
function hpTo(b, c, m, ratio) {
  const ev = evOf(c);
  b.cur = ev;
  b.damage(c, m, Math.max(1, m.hp - Math.round(m.maxHp * ratio)), ev, { element: 'phys' });
  b.cur = null;
  if (ev.postLines) ev.lines.push(...ev.postLines);
  return ev;
}
const has = (ev, text) => [...ev.lines, ...(ev.postLines || [])].some((l) => l.includes(text));
const isolate = (b, m, t) => act(b, m, { type: 'ability', id: ALONE_ID, target: t.id });

// ───────────── データ ─────────────
test('魔物: ノクト（本気。Lv55）と 魔王ソリトゥス（3つの 段階）。きまった 戦い・背景・曲（名前の 約束）', () => {
  assert.deepEqual(Object.keys(MONSTERS_FINAL).sort(), [NOCTO2, SOLITUS].sort());
  for (const id of [NOCTO2, SOLITUS]) {
    const m = MONSTERS[id];
    assert.equal(m, MONSTERS_FINAL[id]);
    assert.ok(m.boss && m.turns === 2 && m.lv >= 55, id);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${id}: ${a.id}`);
    assert.ok(m.desc && m.desc.length > 20, id);
  }
  const n = MONSTERS[NOCTO2];
  assert.ok(n.nocto && n.nocto1 && n.nocto2, '今までの ノクトの しかけを ぜんぶ');
  assert.equal(n.nocto1.stopAt, 0, 'HP半分で 終わらない');
  assert.ok(n.nocto1.combo.bond, '合体技が 合体技の よやくも くだく');
  const s = MONSTERS[SOLITUS].solitus;
  assert.ok(s.p2 > s.p3 && s.p3 > 0 && s.p2 < 1);
  for (const id of [CLONES, RIFT_ID, COMBO_READY, COMBO, MIMIC, BOND_WATCH, BOND_BREAK, ALONE_ID, EAT_WATCH, EAT, NIGHT_WATCH, NIGHT]) assert.ok(ABILITIES[id], id);
  assert.equal(ABILITIES[EAT_WATCH].effect.next, EAT);
  assert.equal(ABILITIES[NIGHT_WATCH].effect.next, NIGHT);
  for (const a of Object.values(FINAL_ABILITIES)) assert.ok(a.name && a.desc && a.anim && a.cast, a.name);
  assert.deepEqual(FIXED_ENCOUNTERS.nocto_2, FIXED_FINAL.nocto_2);
  assert.deepEqual(FIXED_FINAL.nocto_2, { group: [[NOCTO2, 1, 1]], bg: 'castle_top', bgm: 'nocto_true', canFlee: false, boss: true });
  assert.deepEqual(FIXED_FINAL.solitus, { group: [[SOLITUS, 1, 1]], bg: 'castle_top', bgm: 'solitus', canFlee: false, boss: true });
  assert.equal(VOID_BG, 'solitus_void');
  // 思い出の かけらの フラグ（A の maps/memory.js と おなじ）
  assert.deepEqual(SHARD_FLAGS, MEMORY_SHARD_FLAGS);
  assert.equal(LETTER_FLAG, 'c5_letter_given');
});

test('品: ノクト（本気）は ふたつの紋章のお守り（1人 1つ）と ちなんだ ★5。ソリトゥスは きずなの星と、今までで いちばん 強い ★5 の 剣（かならず）', () => {
  const nb = monsterDrops(NOCTO2).filter((d) => d.kind === 'boss').map((d) => d.item);
  assert.deepEqual(nb, ['nocto2_twin_charm']);
  assert.equal(bossRareOf(NOCTO2), 'nocto2_night_blade');
  const sb = monsterDrops(SOLITUS).filter((d) => d.kind === 'boss').map((d) => d.item);
  assert.deepEqual(sb, ['solitus_bond_star']);
  for (const id of ['nocto2_twin_charm', 'solitus_bond_star']) assert.ok(ITEMS[id].unique && ITEMS[id].type === 'acc', id);
  for (const id of Object.keys(ITEMS_FINAL)) {
    assert.equal(starsOf(id), 5, `${id}: ★5`);
    assert.equal(ITEMS[id].rank, 10, id);
    assert.ok(FINAL_ITEM_KANA[id] && ITEMS[id].desc, id);
  }
  const rng = makeRng(9);
  for (let i = 0; i < 20; i++) {
    const d = rollDrops(SOLITUS, rng);
    assert.ok(d.includes('solitus_bond_star') && d.includes('solitus_dawn_sword'), d.join(','));
    assert.ok(rollDrops(NOCTO2, rng).includes('nocto2_night_blade'));
  }
  assert.equal(rareWhereText('solitus_dawn_sword'), '魔王ソリトゥスからしか手に入らない');
  // いちばん 強い 剣・いちばん めずらしい 色（レア度 5）
  const sw = ITEMS.solitus_dawn_sword;
  assert.equal(sw.rarity, 5);
  const others = Object.entries(ITEMS).filter(([id, it]) => it.type === 'weapon' && it.cat === 'sword' && id !== 'solitus_dawn_sword' && !id.includes('+') && !ITEMS_PAST[id] && !ITEMS_ROAD[id] && !ITEMS_TOKEI[id] && !ITEMS_TOKEI6[id] && !ITEMS_PRIZE_R50[id]);
  assert.ok(others.every(([, it]) => (it.atk || 0) < sw.atk), `いちばん 強い（${sw.atk}）`);
  assert.ok(sw.atk > ITEMS.et_earth_sword.atk * 1.15);
});

test('仲間の ノクト（NOCTO_COMPANION）: 魔剣士・前の 戦いに ちなんだ 技（ひらめき技）・装備・見た目。ゲストの ノクトも おなじ 技', () => {
  const d = NOCTO_COMPANION;
  assert.equal(d.id, 'npc_nocto');
  assert.equal(d.name, 'ノクト');
  assert.ok(JOBS[d.job] && d.job === 'magic_swordsman');
  assert.equal(d.unlock, 'c5_clear');
  assert.ok(d.skills.length >= 4 && d.skills.every((id) => ABILITIES[id] && FINAL_ABILITIES[id]), d.skills.join(','));
  for (const id of Object.values(d.gear)) assert.ok(ITEMS[id] && canEquip(d.job, id), id);
  for (const id of Object.values(NOCTO_GUEST.gear)) assert.ok(ITEMS[id] && canEquip(d.job, id), id);
  // 酒場の 仲間（world/party.js の makeNpcSupportChar が skills を ひらめき技に）
  const ch = makeNpcSupportChar(d, 56);
  assert.equal(ch.job, 'magic_swordsman');
  assert.equal(ch.level, 56);
  const learned = learnedAbilities(ch);
  for (const id of d.skills) assert.ok(learned.includes(id), id);
  assert.ok(learned.includes('ms_dark'), '魔剣士の 技も');
  // ゲスト
  const g = noctoGuestChar(55);
  assert.equal(g.jobs.magic_swordsman.lv, NOCTO_GUEST.jobLv);
  for (const id of d.skills) assert.ok(learnedAbilities(g).includes(id), id);
  assert.equal(g.equip.acc, 'nocto_crest', 'ノクトの紋章');
});

// ───────────── ノクト（本気）─────────────
test('ノクト（本気）: はじめに だれかを まねる・影 2体 → 合体技の 前ぶれ → 合体技は 合体技の よやくも くだく（組の だれかが 身を 守れば 守れる）', () => {
  for (const guard of [false, true]) {
    const { b, m, a } = battle(NOCTO2, { seed: 21 });
    assert.ok(m.mimic && a.some((x) => x.nsMimicked), 'はじめに まねる');
    act(b, m, { type: 'ability', id: CLONES });
    assert.equal(clonesOf(b, m).length, 2);
    m.n1Acts = (m.n1CloneAt || 0) + 2;
    m.recent = [];
    const cmd = decideMonster(b, m);
    assert.equal(cmd.id, COMBO_READY, '影が そろうと かならず 前ぶれ');
    act(b, m, cmd);
    assert.equal(m.telegraph, COMBO);
    for (const x of a) { x.ready = false; x.atb = 30; }
    a[0].ready = true;
    a[0].atb = 100;
    const r = b.startDual(a[0], { type: 'dual', id: 'dt_minadein', partner: a[1].id, partners: [a[1].id, a[2].id, a[3].id], target: m.id });
    assert.ok(r.ok && a[0].waitDual, 'よやく');
    if (guard) a[2].defending = true;
    const ev = act(b, m, { type: 'ability', id: COMBO });
    assert.ok(ev.n1Combo);
    if (guard) {
      assert.ok(a[0].waitDual, '守りぬいた');
      assert.ok(has(ev, 'きずなを守りぬいた'));
    } else {
      assert.equal(a[0].waitDual, null, 'くだかれた');
      assert.ok(has(ev, 'ひとりぼっちの合体技にくだかれた'));
    }
  }
});

test('ノクト（本気）: HPが 半分でも 終わらない（たおすと 勝ち）。半分で ことばが かわる（リーダーの フラグ: 思い出の かけら 6つ・ピピの 手紙を わたした）', () => {
  const cases = [[{}, false, false], [Object.fromEntries(SHARD_FLAGS.map((f) => [f, true])), true, false], [{ [LETTER_FLAG]: true }, false, true],
    [Object.fromEntries([...SHARD_FLAGS, LETTER_FLAG].map((f) => [f, true])), true, true]];
  for (const [flags, shards, letter] of cases) {
    const { b, m, a } = battle(NOCTO2, { seed: 22 });
    b.leaderFlags = flags;
    const ev = hpTo(b, a[0], m, 0.45);
    assert.ok(m.alive, 'HP半分では 終わらない');
    assert.ok(ev.n2Heart && ev.n2Heart.shards === shards && ev.n2Heart.letter === letter, JSON.stringify(ev.n2Heart));
    assert.equal(has(ev, '思い出のかけら'), shards);
    assert.equal(has(ev, 'ピピの手紙'), letter);
    if (!shards && !letter) assert.ok(has(ev, 'ひとりでいい'));
    // もう 1回 では 出ない
    assert.ok(!hpTo(b, a[0], m, 0.3).n2Heart);
    // たおすと 勝ち
    const ev2 = evOf(a[0]);
    b.cur = ev2;
    b.damage(a[0], m, m.hp + 10, ev2, { element: 'phys' });
    assert.ok(!m.alive && b.killed.includes(NOCTO2));
    assert.equal(clonesOf(b, m).length, 0);
    b.checkEnd();
    assert.equal(b.pendingEnd?.outcome, 'win');
  }
  // フラグは hooks.leaderFlag（world/battles.js）から
  const { b } = battle(NOCTO2, { seed: 23 });
  b.hooks.leaderFlag = (id) => id === LETTER_FLAG || SHARD_FLAGS.includes(id);
  assert.deepEqual(heartOf(b), { shards: true, letter: true });
  b.hooks.leaderFlag = (id) => id === 'c5_ms1';
  assert.deepEqual(heartOf(b), { shards: false, letter: false });
});

// ───────────── ソリトゥス: 第1段階 ─────────────
test('ひとりにする: 動けない・仲間の 回復も 補助も とどかない・ソリトゥスの ダメージが 大きい。合体技の よやくの 組を ねらって 手を ひきはなす', () => {
  const { b, m, a } = battle(SOLITUS, { seed: 31 });
  assert.equal(m.slPhase, 1);
  const ev = isolate(b, m, a[1]);
  assert.ok(ev.slAlone && a[1].status.rift?.kind === ALONE, JSON.stringify(a[1].status));
  assert.ok(has(ev, 'おまえは、ひとりだ') && has(ev, 'よびかける'));
  assert.deepEqual(aloneAllies(b).map((x) => x.id), [a[1].id]);
  // 回復・補助が とどかない（自分の 補助は とどく）
  a[1].hp = 10;
  const h = evOf(a[3]);
  b.heal(a[3], a[1], { base: [100, 120] }, h, 1);
  assert.equal(a[1].hp, 10);
  assert.ok(has(h, '回復がとどかない'));
  const bf = evOf(a[0]);
  b.applyBuff(a[0], a[1], { stat: 'def', mult: 1.3, dur: 20 }, bf);
  assert.ok(!a[1].buffs.def && has(bf, 'とどかない'));
  b.applyBuff(a[1], a[1], { stat: 'def', mult: 1.3, dur: 20 }, evOf(a[1]));
  assert.ok(a[1].buffs.def, '自分の 補助は とどく');
  // 番が 来ても 動けない
  b.onReady(a[1]);
  assert.equal(b.queue.find((q) => q.id === a[1].id)?.cmd.type, 'incapacitated');
  // ソリトゥスの 攻撃は 大きい
  a[1].hp = a[1].maxHp = 99999;
  a[2].hp = a[2].maxHp = 99999;
  const d1 = b.calcPhys(m, a[2], { mult: 1 }, 1, 'phys', true).dmg;
  const ev2 = evOf(m);
  b.cur = ev2;
  b.damage(m, a[1], 100, ev2, { element: 'phys' });
  // 第38回 C: ソリトゥスの ダメージの 調整（data/boss-r38.js の bossDmg）も かかる
  assert.equal(99999 - a[1].hp, Math.round(Math.round(100 * MONSTERS[SOLITUS].solitus.alone.hurt) * b.bossDmg));
  assert.ok(has(ev2, 'ひとりぼっちの') && d1 > 0);
  // よやくの 組
  const B = battle(SOLITUS, { seed: 32 });
  for (const x of B.a) { x.ready = false; x.atb = 30; }
  B.a[0].ready = true;
  B.a[0].atb = 100;
  assert.ok(B.b.startDual(B.a[0], { type: 'dual', id: 'dt_minadein', partner: B.a[1].id, partners: [B.a[1].id, B.a[2].id, B.a[3].id], target: B.m.id }).ok);
  const ev3 = isolate(B.b, B.m, B.a[3]);
  assert.ok(ev3.n1Torn && B.a[0].waitDual === null);
  assert.ok(MONSTERS[SOLITUS].actions.some((x) => x.id === ALONE_ID && x.cond.includes('c5:nsBond')), 'よやくが ある ときは よく ねらう');
});

test('新しい コマンド「よびかける」: ひとりの 仲間を すぐ もどす。手をのばすでは もどせない。オートの 仲間も 回復の あとで よびかける。4回で 自分で もどる', () => {
  const { b, m, a } = battle(SOLITUS, { seed: 33 });
  assert.equal(b.validate(a[0], { type: CALL }).ok, false, 'だれも ひとりで ない');
  isolate(b, m, a[2]);
  assert.equal(b.validate(a[0], { type: 'reach', target: a[2].id }).ok, false, '手をのばすでは もどせない');
  assert.equal(b.validate(a[2], { type: CALL, target: a[2].id }).ok, false, '自分には 使えない');
  assert.equal(b.validate(a[0], { type: CALL, target: a[2].id }).ok, true);
  // オート（ふつう）: 回復の あとで よびかける
  for (const x of a) x.hp = x.maxHp;
  assert.deepEqual(reachPlan(b, a[0]), { type: CALL, target: a[2].id });
  assert.deepEqual(decideAlly(b, a[1]), { type: CALL, target: a[2].id });
  const ev = act(b, a[0], { type: CALL, target: a[2].id });
  assert.ok(ev.slCall && !a[2].status.rift && a[2].atb >= 50);
  assert.ok(has(ev, `「${a[2].name}！ひとりじゃないよ！」`));
  // 自分で もどる
  isolate(b, m, a[3]);
  for (let i = 0; i < MONSTERS[SOLITUS].solitus.alone.turns; i++) {
    const e = evOf(a[3]);
    b.doIncapacitated(a[3], e);
  }
  assert.ok(!a[3].status.rift, '4回で もどる');
});

// ───────────── 段階 ─────────────
test('段階: 1回の 攻撃で 2つ とばない・第2段階で 背景が ひとりぼっちの闇に・第3段階で ノクトが 加わる（ひとりの 人は もどる）', () => {
  const { b, m, a } = battle(SOLITUS, { seed: 41 });
  const conf = MONSTERS[SOLITUS].solitus;
  const ev = evOf(a[0]);
  b.cur = ev;
  b.damage(a[0], m, m.maxHp * 5, ev, { element: 'phys' });
  assert.ok(m.alive && m.slPhase === 2, '第1段階から いっきに たおれない');
  assert.ok(m.hp > m.maxHp * conf.p3, '第3段階も とばない');
  assert.ok(ev.slPhase?.phase === 2 && ev.bg === VOID_BG && b.bg === VOID_BG);
  assert.equal(b.snapshot().bg, VOID_BG, 'つなぎ直しても 闇の 背景');
  isolate(b, m, a[1]);
  const ev3 = hpTo(b, a[0], m, conf.p3 - 0.02);
  assert.equal(m.slPhase, 3);
  assert.ok(ev3.slPhase?.phase === 3 && ev3.joined?.length === 1);
  const g = b.allies.find((x) => x.n2Guest);
  assert.ok(g && g.name === 'ノクト' && g.kind === 'guest' && g.auto && g.alive);
  assert.ok(g.abilities.includes('nc_dawn_blade') && g.abilities.includes('nc_not_alone'));
  assert.ok(!a[1].status.rift, 'ひとりの 人も もどる');
  assert.equal(m.slBond.gauge, conf.bond.start);
  assert.ok(has(ev3, BOND_NAME));
  assert.ok(pub(g).n2Guest && pub(m).slPhase === 3 && pub(m).slBond === conf.bond.start);
  // 第3段階からは たおせる
  const ev4 = evOf(a[0]);
  b.cur = ev4;
  b.damage(a[0], m, m.hp + 1, ev4, { element: 'phys' });
  assert.ok(!m.alive && b.killed.includes(SOLITUS));
});

test('きずなを食べる（第2段階から）: 前ぶれは かならず 来る。身を 守ると よやくも 強くなる 力も 守れて ダメージ 半分。守らないと 食べられて ソリトゥスが 回復', () => {
  const { b, m, a } = battle(SOLITUS, { seed: 42 });
  const conf = MONSTERS[SOLITUS].solitus;
  hpTo(b, a[0], m, conf.p2 - 0.03);
  assert.equal(m.slPhase, 2);
  // eat.every 回 動くと かならず 前ぶれ
  let cmd = null;
  for (let i = 0; i < conf.eat.every + 1 && cmd?.id !== EAT_WATCH; i++) cmd = decideMonster(b, m);
  assert.equal(cmd.id, EAT_WATCH);
  act(b, m, cmd);
  assert.equal(m.telegraph, EAT);
  // 知っている 人: 先に 番が 来る 人は 身を 守る
  b.knowsFinal = true;
  m.atb = 99;
  assert.deepEqual(finalPlan(b, a[0]), { type: 'defend' });
  b.knowsFinal = false;
  // a0 は 身を 守る・a1 は 守らない（どちらも 強くなる 力を もつ）
  for (const x of a) { x.hp = x.maxHp = 99999; x.buffs.atk = { mult: 1.3, until: Infinity }; }
  a[0].defending = true;
  for (const x of a) { x.ready = false; x.atb = 30; }
  a[2].ready = true;
  a[2].atb = 100;
  assert.ok(b.startDual(a[2], { type: 'dual', id: 'dt_minadein', partner: a[1].id, partners: [a[1].id, a[0].id, a[3].id], target: m.id }).ok);
  m.hp = Math.round(m.maxHp * 0.5);
  const hp0 = m.hp;
  const ev = act(b, m, { type: 'ability', id: EAT });
  assert.ok(ev.slEat);
  assert.ok(a[2].waitDual, 'a0 が 組の 中で 身を 守った → よやくは 守れた');
  assert.ok(a[0].buffs.atk && !a[1].buffs.atk, '身を 守った 人の 力は 食べられない');
  assert.ok(has(ev, '身を守って、きずなを食べられなかった'));
  const dmg = (t) => (ev.results || []).filter((r) => r.id === t.id).reduce((s, r) => s + (r.dmg || 0), 0);
  assert.ok(dmg(a[0]) < dmg(a[1]), `身を 守ると 小さい ${dmg(a[0])} / ${dmg(a[1])}`);
  assert.ok(m.hp > hp0 && m.hp - hp0 <= Math.round(m.maxHp * conf.eat.healCap), '食べた ぶん 回復（1回で healCap まで）');
  // 合体技を 見ると（第2段階。battle-ch5.js の foreseeCheck → finalCheck）、少し あとに 前ぶれ
  const B = battle(SOLITUS, { seed: 43 });
  hpTo(B.b, B.a[0], B.m, conf.p2 - 0.03);
  B.m.slActs = 0;
  B.m.recent = [];
  TT.foreseeCheck(B.b, B.a[0], { type: 'dual', id: 'dt_minadein' }, evOf(B.a[0]));
  assert.ok(B.m.slDualSeen);
  B.m.slActs = 0;
  assert.notEqual(decideMonster(B.b, B.m).id, EAT_WATCH, 'すぐには 来ない（前の 大技から 2回 動いた あと）');
  B.m.recent = [];
  assert.equal(decideMonster(B.b, B.m).id, EAT_WATCH);
});

test('家族の きずな技（第3段階）: だれでも（職業を 問わず）出せる・出せる 人 みんなの 名前・強い（1回で さいだいHPの cap まで）・みんな 回復・ゲージで また 使える', () => {
  const { b, m, a } = battle(SOLITUS, { seed: 51 });
  const conf = MONSTERS[SOLITUS].solitus;
  assert.equal(b.validate(a[0], { type: BOND }).ok, false, '第3段階の 前は 使えない');
  hpTo(b, a[0], m, conf.p2 - 0.03);
  hpTo(b, a[0], m, conf.p3 - 0.03);
  assert.equal(m.slPhase, 3);
  const g = b.allies.find((x) => x.n2Guest);
  for (const x of b.allies) assert.equal(b.validate(x, { type: BOND }).ok, true, `${x.name}（${x.job}）も 使える`);
  // ひとりの 人は 入れない
  isolate(b, m, a[3]);
  const members = bondMembers(b);
  assert.ok(!members.includes(a[3]) && members.includes(g));
  a[3].status = {};
  for (const x of b.allies) x.hp = Math.round(x.maxHp / 2);
  const hp0 = m.hp;
  const ev = act(b, a[1], { type: BOND });
  assert.ok(ev.familyBond);
  const names = b.allies.map((x) => x.name);
  assert.deepEqual(ev.familyBond.names, names, 'みんなの 名前');
  assert.ok(has(ev, `${names.join('・')}の、家族のきずな技！`) && has(ev, BOND_NAME));
  const dmg = hp0 - m.hp;
  assert.ok(dmg > 0 && dmg <= Math.round(m.maxHp * conf.bond.cap * 1.06), `${dmg}`);
  assert.ok(dmg >= bondPower(b, b.allies, m) * 0.9);
  for (const x of b.allies) assert.ok(x.hp >= Math.round(x.maxHp / 2) + Math.round(x.maxHp * conf.bond.heal) - 1, `${x.name} 回復`);
  assert.equal(m.slBond.gauge, 0);
  assert.equal(b.validate(a[0], { type: BOND }).ok, false, 'ゲージが たまるまで まつ');
  // こうどうの はじめ（battle-ch5.js の towerTurnStart → finalTurnStart）で たまる。動けない 番は たまらない
  const n = Math.ceil(BOND_MAX / conf.bond.perAct);
  for (let i = 0; i < n; i++) TT.towerTurnStart(b, a[0], evOf(a[0]), { type: 'incapacitated' });
  assert.equal(m.slBond.gauge, 0);
  for (let i = 0; i < n; i++) TT.towerTurnStart(b, a[0], evOf(a[0]), { type: 'attack' });
  assert.equal(m.slBond.gauge, BOND_MAX);
  assert.equal(b.validate(a[0], { type: BOND }).ok, true);
});

test('家族の きずな技を だれが おす: オートの 仲間は たまったら 使う。手で 戦っている 家族が いる ときは まつ（BOND_WAIT）。ゲストの ノクトは おさない', () => {
  for (const human of [false, true]) {
    const { b, m, a } = battle(SOLITUS, { seed: 52, human });
    const conf = MONSTERS[SOLITUS].solitus;
    hpTo(b, a[0], m, conf.p2 - 0.03);
    hpTo(b, a[0], m, conf.p3 - 0.03);
    const g = b.allies.find((x) => x.n2Guest);
    assert.equal(finalPlan(b, g), null, 'ゲストの ノクトは おさない');
    if (!human) assert.deepEqual(finalPlan(b, a[1]), { type: BOND });
    else {
      assert.notDeepEqual(finalPlan(b, a[1]), { type: BOND }, '家族が おすのを まつ');
      for (let i = 0; i < BOND_WAIT; i++) TT.towerTurnStart(b, a[2], evOf(a[2]), { type: 'attack' });
      assert.deepEqual(finalPlan(b, a[1]), { type: BOND }, 'しばらく おされないと オートが 使う');
    }
    b.slNoBond = true;
    assert.notDeepEqual(finalPlan(b, a[1]), { type: BOND });
  }
});

test('終わらない夜（第3段階）: night.every 回 動くと 前ぶれ → みんなに 大きい 闇。身を 守ると 半分。知っている 人は 間に あわない とき 身を 守る', () => {
  const { b, m, a } = battle(SOLITUS, { seed: 53 });
  const conf = MONSTERS[SOLITUS].solitus;
  hpTo(b, a[0], m, conf.p2 - 0.03);
  hpTo(b, a[0], m, conf.p3 - 0.03);
  m.slActs = 0;
  m.recent = [];
  let cmd = null;
  for (let i = 0; i < conf.night.every && cmd?.id !== NIGHT_WATCH; i++) cmd = decideMonster(b, m);
  assert.equal(cmd.id, NIGHT_WATCH);
  act(b, m, cmd);
  assert.equal(m.telegraph, NIGHT);
  b.knowsFinal = true;
  m.atb = 99;
  m.slBond.gauge = 0;
  assert.deepEqual(finalPlan(b, a[0]), { type: 'defend' });
  for (const x of b.allies) x.hp = x.maxHp = 99999;
  a[0].defending = true;
  const ev = act(b, m, { type: 'ability', id: NIGHT });
  assert.ok(ev.slNight);
  const dmg = (t) => (ev.results || []).filter((r) => r.id === t.id).reduce((s, r) => s + (r.dmg || 0), 0);
  assert.ok(dmg(a[1]) > 200 && dmg(a[0]) < dmg(a[1]) * 0.7, `${dmg(a[0])} / ${dmg(a[1])}`);
});

test('知っている 人（knowsFinal）: よびかけるを 回復より 先に。ふつうの オートは 回復の あと', () => {
  const { b, m, a } = battle(SOLITUS, { seed: 54 });
  isolate(b, m, a[2]);
  a[0].hp = 10;
  // ふつう: 回復が 先
  assert.notEqual(decideAlly(b, a[3]).type, CALL);
  b.knowsFinal = true;
  assert.deepEqual(decideAlly(b, a[3]), { type: CALL, target: a[2].id });
});

test('シミュレーション: tools/sim-final.mjs（超級職 4人・Lv55。完全オート／知っている）。さいごまで 戦える', () => {
  for (const k of [FINAL_KIT, SOLITUS_KIT]) for (const ids of Object.values(k)) for (const id of ids) assert.ok(id === null || ITEMS[id], id);
  assert.deepEqual(finalParty(55, NOCTO2).map((c) => c.job), ['hero', 'daikenja', 'god_hand', 'high_priest']);
  for (const know of [false, true]) {
    const r = finalRun(NOCTO2, 55, know, 5555);
    assert.ok(['win', 'lose'].includes(r.outcome), `${know}: ${r.outcome}`);
    if (know) assert.ok(r.duals > 0, '知っている 人は 合体技');
    else assert.equal(r.duals, 0);
    const s = finalRun(SOLITUS, 55, know, 5555 + 7919);
    assert.ok(['win', 'lose'].includes(s.outcome), `${know}: ${s.outcome}`);
    assert.ok(s.traps >= 1, 'ひとりにする');
    if (s.outcome === 'win') assert.ok(s.phase === 3 && s.bonds >= 1, '第3段階で きずな技');
  }
  const r = finalRun(SOLITUS, 55, true, 5555, { heart: true });
  assert.ok(r.phase >= 2);
});

test('きまった 戦い nocto_2・solitus: 台本の ["battle", …] と おなじ（背景・曲・ボス）。さいごまで 動く', { timeout: 240000 }, async () => {
  for (const [enc, sp] of [['nocto_2', NOCTO2], ['solitus', SOLITUS]]) {
    const world = new GameWorld({ offline: true, rng: makeRng(59), rateLimit: false });
    const ken = new Bot(world, 'ケン');
    await ken.login();
    await ken.createAndPlay('warrior');
    await ken.settle();
    ken.s.char.flags.c5_letter_given = true;
    ken.s.busy = null;
    const done = startFixedBattle(world, ken.s, [ken.s], enc);
    const start = ken.msgs.filter((x) => x.t === 'battleStart').pop();
    assert.equal(start.snap.bg, 'castle_top');
    assert.equal(start.snap.bgm, FIXED_FINAL[enc].bgm);
    assert.equal(start.snap.boss, true);
    assert.equal(start.snap.canFlee, false);
    assert.deepEqual(start.snap.combatants.filter((x) => x.side === 'enemy').map((x) => x.species), [sp]);
    const ctx = [...world.battles.values()].pop();
    assert.equal(ctx.battle.hooks.leaderFlag(LETTER_FLAG), true, 'リーダーの フラグを 見る');
    await ken.settle(60000);
    const outcome = await done;
    assert.ok(['win', 'lose'].includes(outcome), outcome);
  }
});

// ───────────── 絵・背景・エフェクト ─────────────
function stubG(w, h) {
  const colors = new Set();
  const pts = [];
  const g = {
    w, h,
    ell(cx, cy, rx, ry, c) { colors.add(c); pts.push([cx - rx, cy - ry], [cx + rx, cy + ry]); },
    poly(p, c) { colors.add(c); for (const q of p) pts.push(q); },
    rect(x, y, rw, rh, c) { colors.add(c); pts.push([x, y], [x + rw, y + rh]); },
    line(p, c, lw = 1) { colors.add(c); for (const [x, y] of p) pts.push([x - lw / 2 / w, y - lw / 2 / h], [x + lw / 2 / w, y + lw / 2 / h]); },
    eye(cx, cy, r) { colors.add('#ffffff'); pts.push([cx - r, cy - r], [cx + r, cy + r]); },
    dot(x, y, c) { colors.add(c); pts.push([x, y]); },
  };
  return { g, colors, pts };
}
const outside = (pts, w, h, extra = 0.6) => pts.filter(([x, y]) => x < -(1 + extra) / w || x > 1 + (1 + extra) / w || y < -(1 + extra) / h || y > 1 + (1 + extra) / h);

test('絵: ノクト（本気）と とても 大きな 魔王ソリトゥス（パレットの 中・はみださない・2コマ）', () => {
  const BW = 256, BASE_Y = 124;
  for (const id of [NOCTO2, SOLITUS]) {
    const d = MONSTER_ART[id];
    assert.ok(d, id);
    assert.ok(d.size[1] <= BASE_Y && d.size[0] <= BW - 12, `${id}: size`);
    assert.ok(d.pal.every((c) => /^#[0-9a-f]{6}$/i.test(c)) && new Set(d.pal).size === d.pal.length, `${id}: pal`);
    const pal = new Set(d.pal.map((c) => c.toLowerCase()));
    const [W, H] = d.size;
    const k = Math.min(1, 20 / Math.max(W, H));
    for (const [w, h] of [[W, H], [Math.max(10, Math.round(W * k)), Math.max(10, Math.round(H * k))]]) {
      for (const f of [0, 1]) {
        const s = stubG(w, h);
        d.draw(s.g, f);
        assert.deepEqual([...s.colors].filter((c) => !pal.has(String(c).toLowerCase())), [], `${id} f${f}: パレットに ない いろ`);
        assert.deepEqual(outside(s.pts, w, h), [], `${id} f${f} ${w}×${h}: はみだし`);
      }
    }
    const a = stubG(W, H), b = stubG(W, H);
    d.draw(a.g, 0);
    d.draw(b.g, 1);
    assert.notDeepEqual(a.pts, b.pts, `${id}: コマで うごく`);
    const used = new Set([...a.colors, ...b.colors].map((c) => c.toLowerCase()));
    assert.deepEqual(d.pal.filter((c) => !used.has(c.toLowerCase())), [], `${id}: つかわない いろ`);
  }
  // ソリトゥスは 今までで いちばん 大きい ボス
  assert.ok(MONSTER_ART.solitus.size[0] >= 170 && MONSTER_ART.solitus.size[0] > Math.max(...Object.entries(MONSTER_ART).filter(([id]) => id !== SOLITUS).map(([, v]) => v.size?.[0] || 0)));
  // ノクト（本気）と 影 2体も ならぶ
  assert.ok((MONSTER_ART.nocto_2.size[0] + 2 * MONSTER_ART.nocto_clone.size[0] + 18) * 0.7 <= BW - 12);
});

test('絵: 背景 2つ（星のない広間・ひとりぼっちの闇）と エフェクト（新しい 技 ぜんぶ・よびかける・家族の きずな技）', () => {
  assert.deepEqual(Object.keys(FINAL_BG).sort(), ['castle_top', 'solitus_void']);
  const calls = [];
  const ctx = new Proxy({}, {
    get: (o, k) => (k in o ? o[k] : (...args) => { calls.push(k); return undefined; }),
    set: (o, k, v) => { o[k] = v; return true; },
  });
  for (const [id, d] of Object.entries(FINAL_BG)) {
    assert.equal(battleBgSpec(id), d);
    assert.ok(FINAL_DECOS.has(d.deco));
    const n = calls.length;
    drawFinalBg(ctx, d, 78);
    drawFinalFloorBg(ctx, d, 78);
    assert.ok(calls.length - n > 60, `${id}: こまかく かく ${calls.length - n}`);
  }
  const fx = new Proxy({}, { get: () => () => {} });
  const own = [...new Set([...Object.values(FINAL_ABILITIES).map((a) => a.anim).filter((x) => x !== 'heal2'), 'sl_call', 'family_bond'])];
  for (const a of own) {
    assert.equal(playFinalFx(fx, a, [{ x: 100, y: 60 }], null, {}), true, a);
    // 星の塔 → クモイ → 星読み → 大地 → ここ の じゅんに よばれる
    assert.equal(playTowerFx(fx, a, [{ x: 100, y: 60 }], null, { to: [] }), true, a);
  }
  assert.equal(playFinalFx(fx, 'slash_fast', [{ x: 1, y: 1 }], null), false);
  for (const a of FINAL_SCREEN_ANIMS) assert.ok(own.includes(a), a);
  for (const a of Object.keys(FINAL_ALLY_FX)) assert.ok(own.includes(a), a);
  for (const a of Object.keys(FINAL_SFX)) assert.ok(own.includes(a), a);
  assert.ok(FINAL_OWN_TELE.has(NOCTO2) && FINAL_OWN_TELE.has(SOLITUS));
});

test('がめん: ひとりぼっちの しるし・「よびかける」は いちばん 上（手をのばすは 出ない）・家族の きずな技の ボタン・前ぶれの わ・バナー', () => {
  const box = () => ({ box: { classList: { set: new Set(), add(k) { this.set.add(k); }, toggle(k, on) { if (on) this.set.add(k); else this.set.delete(k); } }, dataset: {} } });
  const boxes = new Map([['a0', box()], ['a1', box()], ['a4', box()]]);
  const allies = [{ id: 'a0', name: 'ケン', alive: true, side: 'ally' }, { id: 'a1', name: 'ミカ', alive: true, side: 'ally', trap: ALONE }, { id: 'a4', name: 'ノクト', alive: true, side: 'ally', n2Guest: true }];
  const sol = { id: 'e1', species: SOLITUS, side: 'enemy', alive: true, slPhase: 1, slBond: 0, tele: null };
  const banners = [];
  const sc = {
    game: { audio: { sfx() {} } }, banner: (t, k) => banners.push([t, k]), c: new Map([...allies, sol].map((y) => [y.id, y])), fx: { play() {} },
    allies: () => allies, enemies: () => [sol], statusBoxes: boxes, shake() {}, allyFx() {}, sent: [], send(cmd) { this.sent.push(cmd); }, time: 100,
  };
  earthMarks(sc);
  assert.ok(boxes.get('a1').box.classList.set.has('n1-alone') && boxes.get('a1').box.dataset.trap === 'ひとりぼっち');
  assert.equal(earthReachItem(sc, allies[0]), null, '手をのばすは 出ない');
  let f = finalCmdItems(sc, allies[0]);
  assert.deepEqual(f.items.map((x) => x.value), ['call']);
  assert.ok(f.info.includes('ひとりぼっち'));
  assert.equal(finalCmdPick(sc, allies[0], 'call'), true);
  assert.deepEqual(sc.sent.pop(), { type: CALL, target: 'a1' });
  assert.equal(finalCmdPick(sc, allies[0], 'attack'), false);
  // 第3段階・ゲージが たまる
  allies[1].trap = null;
  sol.slPhase = 3;
  sol.slBond = 50;
  assert.equal(bondReady(sc), false);
  assert.deepEqual(finalCmdItems(sc, allies[0]).items, []);
  sol.slBond = 100;
  f = finalCmdItems(sc, allies[0]);
  assert.deepEqual(f.items.map((x) => x.value), ['bond']);
  assert.ok(f.info.includes('ケン・ミカ・ノクト') && f.info.includes(BOND_TECH));
  finalCmdPick(sc, allies[0], 'bond');
  assert.deepEqual(sc.sent.pop(), { type: BOND });
  // 前ぶれの わ
  const drawn = [];
  const x = new Proxy({}, { get: (o, k) => (k in o ? o[k] : (...args) => drawn.push(k)), set: (o, k, v) => { o[k] = v; return true; } });
  const draw = (c) => { drawn.length = 0; finalDraw(sc, x, {}, c, 10, 10, 100, 80, 1); return drawn.length; };
  const n2 = { species: NOCTO2, alive: true, tele: null };
  assert.equal(draw(n2), 0);
  n2.tele = COMBO;
  assert.ok(draw(n2) > 0);
  sol.slPhase = 1;
  assert.equal(draw(sol), 0);
  sol.tele = EAT;
  assert.ok(draw(sol) > 0);
  // バナー
  const before = banners.length;
  finalPresent(sc, { lines: [], slAlone: { who: 'a1' } }, {}, null, null);
  finalPresent(sc, { lines: [], slCall: { who: 'a1', by: 'a0' } }, {}, null, null);
  finalPresent(sc, { lines: [] }, { type: 'telegraph' }, null, { species: SOLITUS, tele: NIGHT });
  finalPresent(sc, { lines: [], bondReady: true }, {}, null, null);
  assert.deepEqual(banners.slice(before).map((y) => y[1]), ['danger', 'combo', 'danger', 'combo']);
  assert.ok(banners[before][0].includes('ミカ') && banners[before][0].includes('よびかける'));
  assert.ok(banners[before + 2][0].includes('終わらない夜'));
});

// ───────────── 文字 ─────────────
test('文字: 新しい ゲームの 文の ファイルは gameFiles に 入っていて、使えない 漢字・スペースが ない', () => {
  const files = ['public/js/shared/data/monsters-final.js', 'public/js/shared/data/abilities-final.js', 'public/js/shared/data/items-final.js',
    'public/js/shared/data/encounters-final.js', 'public/js/shared/data/companions-castle.js', 'public/js/shared/battle-final.js', 'public/js/client/battle-final.js'];
  const all = gameFiles();
  for (const f of files) {
    const full = all.find((y) => y.endsWith(f));
    assert.ok(full, `${f} が gameFiles に ない`);
    const bad = checkFile(full).filter((p) => p.kind !== 'kana');
    assert.deepEqual(bad, [], f);
  }
});
