// 第2部 第6章 Step 5 B（戦い・品）「止まった時計塔」
// 名前の 約束（docs/plan-ch6.md の 15）・新しい 魔物（3しゅ ＋ カリヨン。のこりは 色ちがい「ぜんまい」）・出現表（t6_tower_low）・仲間・ランクの 表・
// カリヨンの「時のかね」（4回 動くと 鳴る・バフと デバフが 消える・強い 一撃）・オートは かねの 前に 強くする 技を 使わない・
// 知っている 人・シミュレーション・ゲストの リオン・品（時計塔の 宝箱 TOWER_TREASURE_FLOORS・カリヨンの 品）・絵・背景・エフェクト・がめん・文字
// A の マップ・台本は まだ ないので、きまった 戦いは startFixedBattle（台本の ['battle', id] と おなじ）で 動かす
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle, pub, atbRate } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ITEMS, ITEM_KANA } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES, ZONE_BG } from '../public/js/shared/data/encounters.js';
import { monsterDrops, MAT_DROPS, rollDrops } from '../public/js/shared/data/loot.js';
import { MONSTER_FRIENDS, familyPool, rankOf } from '../public/js/shared/data/companions.js';
import { MONSTER_RANKS } from '../public/js/shared/data/monster-ranks.js';
import { regionOf, starsOf, rarityOf, rareWhereText } from '../public/js/shared/data/rare-loot.js';
import { GUESTS } from '../public/js/shared/data/shops.js';
import { JOBS } from '../public/js/shared/data/jobs.js';
import { canEquip, computeStats } from '../public/js/shared/stats.js';
import { VARIANT_KINDS, variantOf } from '../public/js/shared/data/variants.js';
import { MONSTERS_TOKEI, TOKEI_MAT_DROPS, TOKEI_BOSSES, CARILLON } from '../public/js/shared/data/monsters-tokei.js';
import { TOKEI_ABILITIES } from '../public/js/shared/data/abilities-tokei.js';
import { FRIENDS_TOKEI, RION_GUEST } from '../public/js/shared/data/companions-tokei.js';
import { MINAMO_GUEST } from '../public/js/shared/data/companions-past.js';
import { ENCOUNTERS_TOKEI, FIXED_TOKEI, ZONE_BG_TOKEI, TOKEI_VARIANTS } from '../public/js/shared/data/encounters-tokei.js';
import { TOWER_TREASURE_FLOORS } from '../public/js/shared/data/items-tower.js';
import { ITEMS_TOKEI, TOKEI_DROPS, TOKEI_ITEM_KANA, TOKEI_K } from '../public/js/shared/data/items-tokei.js';
import { ROAD_K } from '../public/js/shared/data/items-road.js';
import { BELL, QUIET_AT, tokeiQuiet, bellBefore, buffPlan } from '../public/js/shared/battle-tokei.js';
import { AUTO_GUARD, ch6Plan } from '../public/js/shared/battle-ch6.js';
import { startFixedBattle } from '../public/js/shared/world/battles.js';
import { makeNpcSupportChar, befriendChance } from '../public/js/shared/world/party.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeChar } from '../tools/sim.js';
import { jobChar } from '../tools/sim-jobs.mjs';
import { ch6Run, ch6Party, CH6_KIT, CH6_LV } from '../tools/sim-ch6.mjs';
import { rankPoints } from '../tools/gen-monster-ranks.mjs';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { battleBgSpec } from '../public/js/client/render/battlefx.js';
import { TOKEI_BG, TOKEI_DECOS, drawTokeiBg, drawTokeiFloorBg } from '../public/js/client/render/ch6-tokei-bg.js';
import { playTokeiFx } from '../public/js/client/render/battlefx-tokei.js';
import { playRoadFx } from '../public/js/client/render/battlefx-road.js';
import { playCh6Fx } from '../public/js/client/render/battlefx-ch6.js';
import { playTowerFx } from '../public/js/client/render/battlefx-ch5.js';
import { TOKEI_SCREEN_ANIMS, TOKEI_ALLY_FX, TOKEI_SFX, tokeiDraw, tokeiPresent } from '../public/js/client/battle-tokei.js';
import { ch6Draw, ch6Present } from '../public/js/client/battle-ch6.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';
import { Bot } from './helpers.js';

const NEW = Object.keys(MONSTERS_TOKEI).filter((id) => !TOKEI_BOSSES.includes(id));
const PARTY = (lv = 65) => [makeChar('warrior', lv, 10, 'せんし', 58), makeChar('priest', lv, 10, 'そうりょ', 58), makeChar('mage', lv, 10, 'まほう', 58), makeChar('monk', lv, 10, 'ぶとう', 58)];
function battle(opts = {}) {
  const party = opts.party || PARTY();
  const allies = party.map((c) => ({ char: c, kind: 'support', auto: true, tactics: 'balanced', controller: 'sim' }));
  const b = new Battle({ rng: makeRng(opts.seed ?? 3), allies, enemies: opts.enemies || [CARILLON], boss: true, canFlee: false });
  for (const a of b.allies) a.use = null;
  return { b, m: b.enemies[0], a: b.allies };
}
const has = (ev, text) => [...ev.lines, ...(ev.postLines || [])].some((l) => l.includes(text));
// ボスの 1回の 行動（battle.js の executeNext。行動の はじめの ch6TurnStart → roadTurnStart → tokeiTurnStart も 動く）。cmd … 'ai' か 何も しない 技
function bossAct(b, m, cmd = { type: 'ability', id: 'm_pm_dazzled' }) {
  b.queue = [{ id: m.id, cmd, last: true }];
  m.queued = true;
  b.flush();
  b.executeNext();
  return b.flush().find((e) => e.t === 'act' && e.id === m.id);
}
const AI = { type: 'ai' };
const dmgOf = (ev, t) => (ev.results || []).filter((r) => r.id === t.id).reduce((s, r) => s + (r.dmg || 0), 0);

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（plan-ch6.md の 15）: 出現表 t6_tower_low・きまった 戦い carillon（背景 tokei・曲 boss6）・宝箱・ゲスト', () => {
  assert.deepEqual(Object.keys(ENCOUNTERS_TOKEI), ['t6_tower_low']);
  assert.equal(ENCOUNTER_TABLES.t6_tower_low, ENCOUNTERS_TOKEI.t6_tower_low);
  assert.deepEqual(ZONE_BG_TOKEI, { t6_tower_low: 'tokei' });
  assert.equal(ZONE_BG.t6_tower_low, 'tokei');
  const f = FIXED_ENCOUNTERS.carillon;
  assert.equal(f, FIXED_TOKEI.carillon);
  assert.deepEqual(f.group, [['carillon', 1, 1]], '魔物の ID も おなじ');
  assert.ok(f.boss && f.canFlee === false && !f.loseOk);
  assert.equal(f.bgm, 'boss6');
  assert.equal(f.bg, 'tokei');
  assert.ok(battleBgSpec('tokei') && TOKEI_BG.tokei);
  // 宝箱: data/items-tower.js の TOWER_TREASURE_FLOORS（1〜5階に 2つずつ）
  assert.deepEqual(Object.keys(TOWER_TREASURE_FLOORS).map(Number), [1, 2, 3, 4, 5]);
  for (const list of Object.values(TOWER_TREASURE_FLOORS)) assert.equal(list.length, 2);
  // ゲスト: RION_GUEST（GUESTS.rion。台本の ['guest', 'rion']）
  assert.equal(GUESTS.rion, RION_GUEST);
  assert.equal(MONSTERS.carillon.name, 'カリヨン');
});

// ───────────── 魔物 ─────────────
test('魔物: 新しい 絵の 魔物は 3しゅ ＋ カリヨン（4しゅ まで）。レベル Lv64〜65・空の レアの 地方 6・弱点・技・せつめい・素材', () => {
  assert.deepEqual(NEW.sort(), ['cog_roller', 'killer', 'spring_box']);
  assert.ok(NEW.length + TOKEI_BOSSES.length <= 4, 'plan-breed-new.md の 9');
  for (const id of Object.keys(MONSTERS_TOKEI)) assert.equal(MONSTERS[id], MONSTERS_TOKEI[id], `${id}: ほかの 魔物を うわがき しない`);
  for (const id of NEW) {
    const m = MONSTERS[id];
    assert.ok(!m.boss && m.desc && m.desc.length > 20, id);
    assert.ok(m.lv >= 64 && m.lv <= 66, `${id}: Lv${m.lv}`);
    assert.equal(regionOf(id), 6, id);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${id}: ${a.id}`);
    assert.ok(Object.values(m.resist).some((v) => v >= 1.3), `${id}: 弱点`);
    assert.ok(MAT_DROPS[id] && MAT_DROPS[id] === TOKEI_MAT_DROPS[id] && ITEMS[MAT_DROPS[id][0]].type === 'mat', `${id}: 素材`);
  }
  // 弱点は ばらばら（雷・炎・氷）
  assert.ok(MONSTERS.cog_roller.resist.bolt >= 1.3 && MONSTERS.spring_box.resist.fire >= 1.3 && MONSTERS.killer.resist.ice >= 1.3);
  // キラー（マリオの 敵）: たいほうの あいずで 仲間の キラーを よぶ・物質系
  assert.equal(MONSTERS.killer.race, 'material');
  assert.equal(ABILITIES.m6t_kl_call.effect.type, 'callHelp');
  assert.equal(ABILITIES.m6t_kl_call.effect.species, 'killer');
  for (const a of Object.values(TOKEI_ABILITIES)) assert.ok(a.name && a.desc && a.anim && a.cast, a.name);
  // カリヨン（中ボス）
  const c = MONSTERS.carillon;
  assert.ok(c.boss && c.lv === 65 && c.turns === 1 && c.ch6?.kind === 'bell' && c.ch6.bell.every === 4, 'turns 1（しるしが 1つずつ へる）');
  assert.ok(!MONSTER_FRIENDS.carillon, '仲間に ならない');
  for (const a of c.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], a.id);
  assert.ok(!c.actions.some((a) => a.id === BELL), '時のかねは しるしで かならず（ふだんの 行動には 入れない）');
  assert.equal(ABILITIES[BELL].effect.type, 'crBell');
});

test('色ちがい: 時のいせきの からくりの 魔物の「ぜんまい」（新しい しゅるい clock）と ゴールドころがり歯車。仲間に ならない・絵が ある', () => {
  assert.ok(VARIANT_KINDS.clock && VARIANT_KINDS.clock.prefix === 'ぜんまい' && VARIANT_KINDS.clock.exp > 1);
  const kinds = TOKEI_VARIANTS.map((v) => variantOf(v));
  assert.deepEqual(kinds.map((k) => k.base), ['chrono_knight', 'clock_spider', 'pendulum_bat', 'gear_beetle', 'cog_roller']);
  assert.deepEqual(kinds.map((k) => k.kind), ['clock', 'clock', 'clock', 'clock', 'gold']);
  for (const v of TOKEI_VARIANTS) {
    const m = MONSTERS[v];
    assert.ok(m?.variant && m.noBefriend && MONSTER_ART[m.art], v);
    assert.ok(!MONSTER_FRIENDS[v] && befriendChance({ companions: [] }, v) === 0, `${v}: 仲間に ならない`);
    assert.ok(!Object.keys(MONSTERS).includes(v), `${v}: 図鑑には 出ない`);
    assert.ok(m.hp > MONSTERS[m.variant.base].hp && m.exp > MONSTERS[m.variant.base].exp, v);
  }
  assert.equal(MONSTERS[TOKEI_VARIANTS[0]].name, 'ぜんまいときの守り手');
});

test('仲間: 新しい 3しゅは 仲間に なる（1/14〜1/24・系統配合の 子には ならない）。ランクの 表に 入っている（作りなおした）', () => {
  for (const id of NEW) {
    const f = MONSTER_FRIENDS[id];
    assert.equal(f, FRIENDS_TOKEI[id], id);
    assert.ok(f.rate >= 1 / 24 && f.rate <= 1 / 14, id);
    assert.ok(f.noFamily && !familyPool(MONSTERS[id].race, MONSTERS).includes(id), id);
    assert.ok(f.names.length >= 3 && f.note && f.names.every((n) => n.length <= 8 && n !== MONSTERS[id].name), id);
    for (const [, ab] of f.learn) {
      assert.ok(ABILITIES[ab], `${id}: ${ab}`);
      assert.ok(!['crBell', 'callHelp', 'telegraph'].includes(ABILITIES[ab].effect.type), `${id}: ${ab}`);
      assert.ok(!ABILITIES[ab].weapon, `${id}: ${ab}（魔物は 武器の いる 技を 使えない）`);
    }
    const sum = Object.values(f.growth).reduce((s, v) => s + v, 0);
    assert.ok(sum >= 5.8 && sum <= 7.3, `${id}: ${sum}`);
    assert.ok(MONSTER_RANKS[id], `${id}: ランクの 表（node tools/gen-monster-ranks.mjs）`);
    assert.equal(MONSTER_RANKS[id], rankPoints(id).rank, `${id}: 表が 古い`);
    assert.equal(rankOf(id, MONSTERS), MONSTER_RANKS[id]);
  }
  // キラーは マリオの 敵（plan-breed-new.md の 10: 仲間に なる）
  assert.ok(MONSTER_FRIENDS.killer.rate > 0);
});

test('出現表: 数は 0〜3・新しい 魔物と 色ちがいが 出る・カリヨンは 出ない・ならびが がめんに 入る', () => {
  const sps = new Set(ENCOUNTERS_TOKEI.t6_tower_low.flatMap((e) => e.group.map(([sp]) => sp)));
  for (const e of ENCOUNTERS_TOKEI.t6_tower_low) {
    assert.ok(e.w > 0);
    for (const [sp, mn, mx] of e.group) {
      assert.ok(MONSTERS[sp], sp);
      assert.ok(mn >= 0 && mx >= mn && mx <= 3);
    }
    assert.ok(e.group.some(([, mn]) => mn >= 1), '1体は かならず 出る');
    const wsum = e.group.reduce((s, [sp, , mx]) => s + mx * ((MONSTER_ART[MONSTERS[sp].art || sp]?.size[0] || 40) + 6), 0);
    assert.ok(wsum * 0.55 <= 256 - 12, JSON.stringify(e.group));
  }
  for (const id of [...NEW, ...TOKEI_VARIANTS]) assert.ok(sps.has(id), id);
  assert.ok(!sps.has(CARILLON));
});

// ───────────── カリヨン: 時のかね ─────────────
test('時のかね: しるしは 4つ。カリヨンが 1回 動くと 1つ へる（のこり 1つで 知らせる）→ 4回目に かならず 時のかね → しるしは また 4つ', () => {
  const { b, m } = battle({ seed: 41 });
  for (const x of b.allies) x.hp = x.maxHp = 99999;
  assert.deepEqual([m.bell.left, m.bell.max], [4, 4]);
  assert.deepEqual([pub(m).bell, pub(m).bellMax], [4, 4]);
  const e1 = bossAct(b, m);
  assert.equal(m.bell.left, 3);
  assert.equal(e1.tkBell.left, 3);
  bossAct(b, m);
  const e3 = bossAct(b, m);
  assert.equal(m.bell.left, 1);
  assert.equal(e3.tkBell.left, 1);
  assert.ok(has(e3, '次にカリヨンが動くと、時のかねが鳴る'));
  assert.ok(!m.telegraph, '前ぶれでは ない（しるしで 分かる）');
  const e4 = bossAct(b, m, AI);
  assert.equal(e4.ability, BELL);
  assert.ok(e4.tkRing && has(e4, '時のかねの音'));
  assert.equal(m.bell.left, 4);
  assert.equal(pub(m).bell, 4);
  // 次の 4回も おなじ（動けない 番も 数える。かねの 番が 動けない ときは 次の 番に）
  for (let i = 0; i < 3; i++) bossAct(b, m);
  assert.equal(m.bell.left, 1);
  m.status.paralyze = { turns: 2 };
  bossAct(b, m, { type: 'incapacitated' });
  assert.equal(m.bell.left, 1, '動けない 番は 鳴らない');
  delete m.status.paralyze;
  assert.equal(bossAct(b, m, AI).ability, BELL);
});

test('時のかね: 味方の バフと カリヨンの デバフが 消える（ずっと つづく 物は のこる）→ みんなに 強い 一撃（身を 守ると 半分）', () => {
  let found = null;
  for (let seed = 50; seed < 120 && !found; seed++) {
    const t = battle({ seed });
    for (const x of t.a) {
      x.hp = x.maxHp = 99999;
      x.evasion = 0;
    }
    t.a[0].buffs.atk = { mult: 1.3, lv: 1, left: 3 };
    t.a[1].buffs.def = { mult: 1.3, lv: 2, left: 2 };
    t.a[2].buffs.agi = { mult: 1.2, lv: 1, left: Infinity };
    t.m.debuffs.def = { mult: 0.8, lv: 1, left: 3 };
    t.m.debuffs.atk = { mult: 0.8, lv: 1, left: 2 };
    t.a[1].defending = true;
    t.a[3].defending = true;
    t.m.bell.left = 1;
    const ev = bossAct(t.b, t.m, AI);
    if (!(ev.results || []).some((r) => r.miss)) found = { ...t, ev };
  }
  assert.ok(found, 'かわされない 戦い');
  const { a, m, ev } = found;
  assert.equal(ev.ability, BELL);
  assert.ok(!a[0].buffs.atk && !a[1].buffs.def, 'バフが 消える');
  assert.ok(a[2].buffs.agi, 'ずっと つづく 物は のこる');
  assert.ok(!m.debuffs.def && !m.debuffs.atk, 'カリヨンの デバフも 消える');
  assert.deepEqual([ev.tkRing.lost, ev.tkRing.fixed], [2, 2]);
  assert.ok(has(ev, '強くなっていた力が、消えてしまった') && has(ev, '弱くなっていた力も、もとにもどった'));
  for (const x of a) assert.ok(dmgOf(ev, x) > 0, x.name);
  assert.ok(dmgOf(ev, a[1]) < dmgOf(ev, a[2]) && dmgOf(ev, a[3]) < dmgOf(ev, a[0]), '身を 守ると へる');
  // ボスの 段階の ずっと つづく 弱さ（HP20%）は のこる
  const t = battle({ seed: 7 });
  t.m.debuffs.def = { mult: 0.75, left: Infinity };
  t.m.bell.left = 1;
  bossAct(t.b, t.m, AI);
  assert.equal(t.m.debuffs.def.mult, 0.75);
});

// ───────────── オート ─────────────
test('オート: かねが 近い（しるし 2つ いか）ときは 強くする 技を 使わない（ai.js の decideAlly。第41回の 強さくらべに 1つ 足した）', () => {
  assert.equal(QUIET_AT, 2);
  const mk = (seed, left) => {
    const party = [jobChar('hero', 65, 10, '勇者'), jobChar('daikenja', 65, 10, '大賢者'), jobChar('god_hand', 65, 10, 'ゴッドハンド'), jobChar('high_priest', 65, 10, '大神官')];
    const t = battle({ seed, party });
    t.m.bell.left = left;
    return t;
  };
  const isBuff = (cmd) => {
    const a = cmd?.type === 'ability' ? ABILITIES[cmd.id] : null;
    const e = a?.effect?.type === 'multi' ? a.effect.parts[0] : a?.effect;
    return e?.type === 'buff';
  };
  let quietBuffs = 0, freeBuffs = 0;
  for (let s = 0; s < 120; s++) {
    for (const [left, add] of [[2, (n) => (quietBuffs += n)], [1, (n) => (quietBuffs += n)], [4, (n) => (freeBuffs += n)]]) {
      const { b, a } = mk(300 + s, left);
      assert.equal(tokeiQuiet(b), left <= 2);
      add(isBuff(decideAlly(b, a[s % 4])) ? 1 : 0);
    }
  }
  assert.equal(quietBuffs, 0, 'かねの 前は 使わない');
  assert.ok(freeBuffs > 0, 'かねが 遠い ときは 今までどおり ときどき 使う');
  // カリヨンが いない 戦いでは かわらない
  const { b } = battle({ enemies: ['pendula'] });
  assert.equal(tokeiQuiet(b), false);
});

test('オート: ふつうの オートは かねが 自分の 次の 番より 先に 鳴る とき、HPが へっていれば よく 身を 守る。知っている 人は 守る・鳴った あとに 強くする', () => {
  const decide = () => ({ type: 'attack', target: 'e1' });
  let guards = 0, full = 0, far = 0;
  for (let s = 0; s < 40; s++) {
    const { b, m, a } = battle({ seed: 100 + s });
    m.bell.left = 1;
    m.atb = 99;
    assert.ok(bellBefore(b, a[0], m));
    a[0].hp = Math.floor(a[0].maxHp * 0.5);
    if (ch6Plan(b, a[0], decide)?.type === 'defend') guards++;
    a[0].hp = a[0].maxHp;
    if (ch6Plan(b, a[0], decide)?.type === 'defend') full++;
    m.bell.left = 4;
    m.atb = 0;
    a[0].hp = Math.floor(a[0].maxHp * 0.5);
    if (ch6Plan(b, a[0], decide)?.type === 'defend') far++;
  }
  assert.ok(guards > 10 && guards < 40, `${guards}/40（${AUTO_GUARD.chance}）`);
  assert.equal(full, 0, 'HPが ある ときは 守らない');
  assert.equal(far, 0, 'かねが 遠い ときは 守らない');
  // bellBefore: カリヨンが 速くて 2回 動く 間に 鳴る ときも
  const t = battle({ seed: 9 });
  t.m.bell.left = 2;
  t.m.atb = 99;
  t.m.speed = 9;
  assert.ok(bellBefore(t.b, t.a[0], t.m));
  t.m.speed = 0.01;
  assert.ok(!bellBefore(t.b, t.a[0], t.m));
  // 知っている 人
  const party = [jobChar('hero', 65, 10, '勇者'), jobChar('daikenja', 65, 10, '大賢者'), jobChar('god_hand', 65, 10, 'ゴッドハンド'), jobChar('high_priest', 65, 10, '大神官')];
  const k = battle({ seed: 8, party });
  k.b.knowsCh6 = true;
  k.m.bell.left = 1;
  k.m.atb = 99;
  assert.equal(ch6Plan(k.b, k.a[0], decide).type, 'defend', 'しるし 1つ: 身を 守る');
  k.b.c6NoGuard = true;
  assert.notEqual(ch6Plan(k.b, k.a[0], decide).type, 'defend');
  k.b.c6NoGuard = false;
  // 鳴った すぐ あと: みんなの 攻撃力を 上げる（勇者の きずなのちかい）・カリヨンの 守りを 下げる（大賢者の ルカニ）
  k.m.bell.left = 4;
  k.m.atb = 0;
  const hero = ch6Plan(k.b, k.a[0], decide);
  assert.equal(hero.type, 'ability');
  assert.ok((ABILITIES[hero.id].effect.parts?.[0] || ABILITIES[hero.id].effect).stats?.includes('atk'), hero.id);
  const sage = ch6Plan(k.b, k.a[1], decide);
  assert.ok(sage.type === 'ability' && ABILITIES[sage.id].effect.type === 'debuff' && sage.target === k.m.id, JSON.stringify(sage));
  assert.deepEqual(buffPlan(k.b, k.a[2], k.m), null, 'ゴッドハンドは 自分だけの 技は 使わない');
  // もう かかっている ときは 使わない・かねが 近い ときは 使わない
  for (const x of k.a) x.buffs.atk = { mult: 1.15, lv: 1, left: 3 };
  k.m.debuffs.def = { mult: 0.8, lv: 1, left: 3 };
  assert.equal(buffPlan(k.b, k.a[0], k.m), null);
  for (const x of k.a) delete x.buffs.atk;
  delete k.m.debuffs.def;
  k.m.bell.left = 2;
  assert.deepEqual(ch6Plan(k.b, k.a[0], decide), decide());
  k.b.c6NoBuff = true;
  k.m.bell.left = 4;
  assert.deepEqual(ch6Plan(k.b, k.a[0], decide), decide(), 'しかけを 知らない 人は ふつう');
});

// ───────────── シミュレーション ─────────────
test('シミュレーション: tools/sim-ch6.mjs の bell（超級職 4人・その ころの ★装備）。さいごまで 戦える・知っている 人は かねの 前に 守る', { timeout: 300000 }, () => {
  assert.equal(CH6_LV.bell, 65);
  assert.deepEqual(ch6Party('bell', 65).map((c) => c.job), ['hero', 'daikenja', 'god_hand', 'high_priest']);
  for (const [job, k] of Object.entries(CH6_KIT.bell)) for (const id of k) assert.ok(id === null || (ITEMS[id] && canEquip(job, id)), `${job}: ${id}`);
  // カリヨンの 装備は 時計塔の 宝と ペンデュラの 品を 使う
  assert.ok(CH6_KIT.bell.hero.includes('p6t_tower_sword') && CH6_KIT.bell.daikenja.includes('p6r_witch_staff') && CH6_KIT.bell.hero.includes('p6r_pendulum_charm'));
  const k = ch6Run('bell', 65, true, 6060);
  assert.ok(['win', 'lose'].includes(k.outcome));
  assert.ok(k.rings >= 1 && k.guarded >= k.rings, JSON.stringify(k));
  const n = ch6Run('bell', 65, true, 6060, { skip: 'trick' });
  assert.ok(n.rings >= 1 && n.guarded === 0 && n.duals > 0, JSON.stringify(n));
  const auto = ch6Run('bell', 65, false, 6060);
  assert.ok(auto.rings >= 1 && auto.duals === 0, JSON.stringify(auto));
});

test('きまった 戦い carillon: 台本の ["showMon", "carillon"] → ["battle", "carillon"] と おなじ（背景・曲・ボス・かねの しるし）。さいごまで 動く', { timeout: 180000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(65), rateLimit: false });
  const ken = new Bot(world, 'ケン');
  await ken.login();
  await ken.createAndPlay('warrior');
  await ken.settle();
  ken.s.busy = null;
  const done = startFixedBattle(world, ken.s, [ken.s], 'carillon');
  const start = ken.msgs.filter((x) => x.t === 'battleStart').pop();
  assert.equal(start.snap.bg, 'tokei');
  assert.equal(start.snap.bgm, 'boss6');
  assert.equal(start.snap.boss, true);
  assert.equal(start.snap.canFlee, false);
  const en = start.snap.combatants.filter((x) => x.side === 'enemy');
  assert.deepEqual(en.map((x) => x.species), ['carillon']);
  assert.ok(en[0].bell === 4 && en[0].bellMax === 4);
  await ken.settle(60000);
  const outcome = await done;
  assert.ok(['win', 'lose'].includes(outcome), outcome);
});

// ───────────── ゲストの リオン ─────────────
test('ゲストの リオン（RION_GUEST）: 最初の 紋章の 勇者・剣士・光の 技 1つ。ミナモと おなじ 形・レベルは パーティーに 合わせる', () => {
  const g = RION_GUEST;
  assert.deepEqual(Object.keys(g).sort(), Object.keys(MINAMO_GUEST).sort(), 'MINAMO_GUEST と おなじ 形');
  assert.ok(g.id === 'guest_rion' && g.name === 'リオン' && JOBS[g.job] && g.minLevel >= 64);
  assert.ok(JOBS[g.job].weapons.includes('sword'), '剣士');
  assert.ok(g.look && g.look.hcol && g.look.style);
  assert.equal(g.skills.length, 1);
  const a = ABILITIES[g.skills[0]];
  assert.ok(a && a.kind === 'skill' && a.kana && a.mp > 0 && !a.noAuto && a.sword);
  assert.equal(a.effect.element, 'light');
  assert.equal(a.target, 'enemy');
  for (const [slot, id] of Object.entries(g.gear)) assert.ok(ITEMS[id] && canEquip(g.job, id), `${slot}: ${id}`);
  assert.equal(ITEMS[g.gear.weapon].cat, 'sword');
  // world/party.js の guestChar と おなじ 作り方（レベルは パーティーの いちばん 高い レベル）
  const c = makeNpcSupportChar({ ...g }, 65);
  assert.equal(c.level, 65);
  assert.deepEqual(c.hirameki, g.skills);
  const s = computeStats(c);
  assert.ok(s.maxHp > 450 && s.atk > 250, JSON.stringify({ hp: s.maxHp, atk: s.atk }));
  // 戦いの 中で 技を 使える（オートで 光の 剣）
  const party = [...PARTY(65).slice(0, 3), c];
  const b = new Battle({ rng: makeRng(5), allies: party.map((ch) => ({ char: ch, kind: 'support', auto: true, tactics: ch.tactics || 'balanced' })), enemies: ['cog_roller'] });
  assert.ok(b.allies[3].abilities.includes('rn6_crest'));
});

// ───────────── 品 ─────────────
test('宝箱: 時計塔 1〜5階に 2つずつ。ぜんぶ ランク10の ★5（オレンジ）。上の 階ほど 強い・星めぐりの古道より 少し 上', () => {
  const all = Object.values(TOWER_TREASURE_FLOORS).flat();
  assert.equal(new Set(all).size, 10);
  for (const id of all) {
    const it = ITEMS[id];
    assert.equal(it, ITEMS_TOKEI[id], id);
    assert.ok(it.rank === 10 && rarityOf(id) === 4 && starsOf(id) === 5, id);
    assert.ok(!(it.price > 0) && it.sell > 0 && it.desc && ITEM_KANA[id] === TOKEI_ITEM_KANA[id], id);
    assert.equal(it.src, 'tokei');
    assert.equal(rareWhereText(id), '時計塔の宝箱でしか手に入らない');
  }
  const ks = [1, 2, 3, 4, 5].map((f) => TOKEI_K[f]);
  for (let i = 1; i < ks.length; i++) assert.ok(ks[i] > ks[i - 1]);
  assert.ok(TOKEI_K[1] > ROAD_K[8]);
  assert.ok(ITEMS.p6t_tower_sword.atk > ITEMS.p6r_road_sword.atk && ITEMS.p6t_tower_sword.atk < ITEMS.p6r_road_sword.atk * 1.1, 'ほんの 少し');
  // 名前が ほかの 品と かぶらない
  const names = new Map();
  for (const [id, it] of Object.entries(ITEMS)) {
    if (it.base) continue;
    if (ITEMS_TOKEI[id]) assert.ok(!names.has(it.name), `名前が かぶる: ${it.name}`);
    names.set(it.name, id);
  }
});

test('ボスの 品: カリヨンは かならず 1人 1つの ★5（レア度3）と いちばん めずらしい 色の ★5の オノ。ペンデュラの 品より 強い', () => {
  const [acc, weapon] = TOKEI_DROPS.carillon;
  assert.deepEqual(MONSTERS.carillon.drops.boss, [acc]);
  assert.deepEqual(MONSTERS.carillon.drops.rare, [weapon, 1]);
  const rng = makeRng(4);
  for (let i = 0; i < 20; i++) {
    const got = rollDrops('carillon', rng);
    assert.ok(got.includes(acc) && got.includes(weapon), String(got));
  }
  assert.ok(monsterDrops('carillon').some((d) => d.item === acc && d.rate === 1));
  const a = ITEMS[acc], w = ITEMS[weapon];
  assert.ok(a.type === 'acc' && a.unique && a.rank === 10 && rarityOf(acc) === 3);
  assert.ok(w.type === 'weapon' && w.cat === 'axe' && w.rank === 10 && rarityOf(weapon) === 5 && !w.unique);
  for (const x of [acc, weapon]) {
    assert.equal(starsOf(x), 5);
    assert.equal(rareWhereText(x), '時の魔物からしか手に入らない');
    assert.ok(ITEMS[x].boss === 'carillon' && ITEMS[x].src === 'pastboss');
  }
  const bsum = (it) => Object.values(it.bonus || {}).reduce((s, v) => s + Math.max(0, v), 0);
  assert.ok(bsum(ITEMS.p6r_pendulum_charm) < bsum(a), `${bsum(ITEMS.p6r_pendulum_charm)} < ${bsum(a)}`);
  const top = Object.entries(ITEMS).filter(([, it]) => it.type === 'weapon' && it.cat === 'axe' && !it.base).sort((x, y) => y[1].atk - x[1].atk)[0][0];
  assert.equal(top, weapon, 'いちばん 強い オノ');
});

// ───────────── 絵 ─────────────
function stubG(w, h) {
  const colors = new Set();
  const pts = [];
  const g = {
    w, h,
    ell(cx, cy, rx, ry, c) { colors.add(c); pts.push([cx - rx, cy - ry], [cx + rx, cy + ry]); },
    poly(p, c) { colors.add(c); for (const q of p) pts.push(q); },
    rect(x, y, rw, rh, c) { colors.add(c); pts.push([x, y], [x + rw, y + rh]); },
    line(p, c, lw = 1) { colors.add(c); for (const [x, y] of p) pts.push([x - lw / 2 / w, y - lw / 2 / h], [x + lw / 2 / w, y + lw / 2 / h]); },
  };
  return { g, colors, pts };
}
const outside = (pts, w, h, extra = 0.6) => pts.filter(([x, y]) => x < -(1 + extra) / w || x > 1 + (1 + extra) / w || y < -(1 + extra) / h || y > 1 + (1 + extra) / h);

test('絵: 新しい 魔物 3しゅと カリヨン（パレットの 中・はみださない・2コマ・大きさ）', () => {
  for (const id of [...NEW, ...TOKEI_BOSSES]) {
    const d = MONSTER_ART[id];
    assert.ok(d, `${id} の え`);
    const boss = TOKEI_BOSSES.includes(id);
    assert.ok(d.size.every((v) => Number.isInteger(v) && v >= 20 && v <= (boss ? 130 : 72)), `${id}: size`);
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
  assert.ok(MONSTER_ART.carillon.size[0] >= 96 && MONSTER_ART.carillon.size[1] + 2 <= 124);
  assert.ok(MONSTER_ART.carillon.npc > 0, 'フィールドの 大きな NPC にも（台本の showMon）');
});

test('絵: 戦いの 背景 tokei と エフェクト（新しい 技 ぜんぶ。battlefx-ch5 → … → battlefx-road → battlefx-tokei）', () => {
  assert.deepEqual(Object.keys(TOKEI_BG), ['tokei']);
  const calls = [];
  const ctx = new Proxy({}, {
    get: (o, k) => (k in o ? o[k] : (...args) => { calls.push(k); return undefined; }),
    set: (o, k, v) => { o[k] = v; return true; },
  });
  const d = TOKEI_BG.tokei;
  assert.equal(battleBgSpec('tokei'), d);
  assert.ok(TOKEI_DECOS.has(d.deco) && d.sky.length >= 3 && d.ground.length === 2);
  drawTokeiBg(ctx, d, 78);
  drawTokeiFloorBg(ctx, d, 78);
  assert.ok(calls.length > 120, `こまかく かく ${calls.length}`);
  const fx = new Proxy({}, { get: () => () => {} });
  const own = [...new Set(Object.values(TOKEI_ABILITIES).map((a) => a.anim).filter((a) => a !== 'none'))];
  for (const a of own) {
    assert.equal(playTokeiFx(fx, a, [{ x: 100, y: 60 }], null, {}), true, a);
    assert.equal(playRoadFx(fx, a, [{ x: 100, y: 60 }], null, {}), true, a);
    assert.equal(playCh6Fx(fx, a, [{ x: 100, y: 60 }], null, {}), true, a);
    assert.equal(playTowerFx(fx, a, [{ x: 100, y: 60 }], null, { to: [] }), true, a);
  }
  assert.equal(playTokeiFx(fx, 'slash_fast', [{ x: 1, y: 1 }], null), false);
  assert.equal(playRoadFx(fx, 'slash_fast', [{ x: 1, y: 1 }], null), false);
  for (const a of TOKEI_SCREEN_ANIMS) assert.ok(own.includes(a), a);
  for (const a of Object.keys(TOKEI_ALLY_FX)) assert.ok(own.includes(a), a);
  for (const a of Object.keys(TOKEI_SFX)) assert.ok(own.includes(a), a);
  assert.ok(TOKEI_SCREEN_ANIMS.includes('a6t_bell'));
});

test('がめん: かねの しるし（のこりの 数・のこり 1つで 赤く ゆれる）・バナー（あと1つ・鳴った）', () => {
  const drawn = [];
  const x = new Proxy({}, { get: (o, k) => (k in o ? o[k] : (...args) => drawn.push(k)), set: (o, k, v) => { o[k] = v; return true; } });
  const scene = { time: 100 };
  const draw = (c, f = tokeiDraw) => { drawn.length = 0; f(scene, x, {}, c, 60, 10, 104, 116, 1); return drawn.length; };
  assert.equal(draw({ species: 'cog_roller', alive: true }), 0);
  const c = { species: CARILLON, alive: true, bell: 3, bellMax: 4 };
  const plain = draw(c);
  assert.ok(plain > 0);
  c.bell = 1;
  assert.ok(draw(c) > plain, 'のこり 1つ: 音の わ');
  assert.ok(draw({ species: CARILLON, alive: true, bell: 2, bellMax: 4 }, ch6Draw) > 0, 'battle-ch6.js の ch6Draw から よぶ');
  assert.equal(draw({ species: CARILLON, alive: false, bell: 2, bellMax: 4 }), 0);
  const banners = [];
  const s2 = { game: { audio: { sfx() {} } }, banner: (t, k) => banners.push([t, k]), shake() {}, c: new Map(), enemies: () => [], allies: () => [] };
  tokeiPresent(s2, { lines: [], tkBell: { left: 2 } }, {}, null, null);
  assert.equal(banners.length, 0);
  tokeiPresent(s2, { lines: [], tkBell: { left: 1 } }, {}, null, null);
  ch6Present(s2, { lines: [], tkRing: { lost: 3, fixed: 0 } }, {}, null, null);
  assert.deepEqual(banners.map((y) => y[1]), ['danger', 'danger']);
  assert.ok(banners[0][0].includes('あと1つ') && banners[0][0].includes('身を守れ'));
  assert.ok(banners[1][0].includes('時のかねが鳴った') && banners[1][0].includes('強くするなら、今'));
});

// ───────────── 文字 ─────────────
test('文字: 新しい ゲームの 文の ファイルは gameFiles に 入っていて、使えない 漢字・スペースが ない', () => {
  const files = ['public/js/shared/data/monsters-tokei.js', 'public/js/shared/data/abilities-tokei.js', 'public/js/shared/data/items-tokei.js',
    'public/js/shared/data/encounters-tokei.js', 'public/js/shared/data/companions-tokei.js', 'public/js/shared/battle-tokei.js', 'public/js/client/battle-tokei.js',
    'public/js/shared/data/variants.js', 'public/js/shared/data/items-tower.js'];
  const all = gameFiles();
  for (const f of files) {
    const full = all.find((y) => y.endsWith(f));
    assert.ok(full, `${f} が gameFiles に ない`);
    const bad = checkFile(full).filter((p) => p.kind !== 'kana');
    assert.deepEqual(bad, [], f);
  }
  void atbRate;
});
