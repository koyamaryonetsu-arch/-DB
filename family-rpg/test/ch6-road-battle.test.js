// 第2部 第6章 Step 3・4 B（戦い・品）「星めぐりの古道」
// 名前の 約束（docs/plan-ch6.md の 12-1）・新しい 魔物（昼と 夜で 強さが かわる 星座の 魔物）・出現表（t6_road_up・t6_road_low）・仲間・
// 星くいのよる鳥（星くい）と ペンデュラ（時のふりこ）の しかけ・ふつうの オートと 知っている 人・シミュレーション・
// 品（古道の 宝箱 ROAD_TREASURE_FLOORS・社の まわり ROAD_FIELD_TREASURE・ボスの 品）・絵・背景・エフェクト・がめん・文字
// A の マップ・台本は まだ ないので、きまった 戦いは startFixedBattle（台本の ['battle', id] と おなじ）で 動かす
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle, pub, atbRate } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ITEMS, ITEM_KANA } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES, ZONE_BG } from '../public/js/shared/data/encounters.js';
import { monsterDrops, MAT_DROPS, rollDrops } from '../public/js/shared/data/loot.js';
import { MONSTER_FRIENDS, familyPool } from '../public/js/shared/data/companions.js';
import { regionOf, starsOf, rarityOf, rareWhereText } from '../public/js/shared/data/rare-loot.js';
import { canEquip } from '../public/js/shared/stats.js';
import { MONSTERS_ROAD, ROAD_MAT_DROPS, ROAD_BOSSES, STAR_EATER, PENDULA } from '../public/js/shared/data/monsters-road.js';
import { ROAD_ABILITIES } from '../public/js/shared/data/abilities-road.js';
import { FRIENDS_ROAD } from '../public/js/shared/data/companions-road.js';
import { ENCOUNTERS_ROAD, FIXED_ROAD, ZONE_BG_ROAD, ROAD_VARIANTS } from '../public/js/shared/data/encounters-road.js';
import { ITEMS_ROAD, ROAD_TREASURE_FLOORS, ROAD_FIELD_TREASURE, ROAD_DROPS, ROAD_ITEM_KANA, ROAD_K } from '../public/js/shared/data/items-road.js';
import { PAST_K } from '../public/js/shared/data/items-past.js';
import { AIM, EAT, DARK_CHARGE, DARK, STOP_CHARGE, STOP, SWING_CHARGE, SWING, ROAD_BIG, roadDamage, pickStop } from '../public/js/shared/battle-road.js';
import { AUTO_GUARD, ch6Plan } from '../public/js/shared/battle-ch6.js';
import { startFixedBattle } from '../public/js/shared/world/battles.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeChar } from '../tools/sim.js';
import { jobChar } from '../tools/sim-jobs.mjs';
import { ch6Run, ch6Party, CH6_KIT, CH6_LV } from '../tools/sim-ch6.mjs';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { battleBgSpec } from '../public/js/client/render/battlefx.js';
import { ROAD_BG, ROAD_DECOS, drawRoadBg, drawRoadFloorBg } from '../public/js/client/render/ch6-road-bg.js';
import { playRoadFx } from '../public/js/client/render/battlefx-road.js';
import { playCh6Fx } from '../public/js/client/render/battlefx-ch6.js';
import { playTowerFx } from '../public/js/client/render/battlefx-ch5.js';
import { ROAD_SCREEN_ANIMS, ROAD_ALLY_FX, ROAD_SFX, ROAD_OWN_TELE, roadDraw, roadPresent } from '../public/js/client/battle-road.js';
import { CH6_OWN_TELE, ch6Draw } from '../public/js/client/battle-ch6.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';
import { Bot } from './helpers.js';
import { ITEMS_TOKEI6 } from '../public/js/shared/data/items-tokei6.js';

const NEW = Object.keys(MONSTERS_ROAD).filter((id) => !ROAD_BOSSES.includes(id));
const UP = ['star_wolf', 'sun_ram', 'dust_mole', 'warp_wisp'];
const LOW = ['crab_star', 'toki_owl', 'twin_star', 'dust_drake'];
const PARTY = (lv = 62) => [makeChar('warrior', lv, 10, 'せんし', 58), makeChar('priest', lv, 10, 'そうりょ', 58), makeChar('mage', lv, 10, 'まほう', 58), makeChar('monk', lv, 10, 'ぶとう', 58)];
function battle(opts = {}) {
  const party = opts.party || PARTY();
  const allies = party.map((c) => ({ char: c, kind: 'support', auto: true, tactics: 'balanced', controller: 'sim' }));
  const b = new Battle({ rng: makeRng(opts.seed ?? 3), allies, enemies: opts.enemies || [STAR_EATER], boss: true, canFlee: false, hooks: opts.hooks });
  for (const a of b.allies) a.use = null;
  return { b, m: b.enemies[0], a: b.allies };
}
const has = (ev, text) => [...ev.lines, ...(ev.postLines || [])].some((l) => l.includes(text));
// ボスの 1回の 行動（battle.js の executeNext。行動の はじめの ch6TurnStart → roadTurnStart も 動く）。cmd … 'ai' か 何も しない 技
function bossAct(b, m, cmd = { type: 'ability', id: 'm_pm_dazzled' }) {
  b.queue = [{ id: m.id, cmd, last: true }];
  m.queued = true;
  b.flush();
  b.executeNext();
  return b.flush().find((e) => e.t === 'act' && e.id === m.id);
}
const AI = { type: 'ai' };

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（plan-ch6.md の 12-1）: 出現表・きまった 戦い・背景・曲・宝箱', () => {
  for (const t of ['t6_road_up', 't6_road_low']) assert.equal(ENCOUNTER_TABLES[t], ENCOUNTERS_ROAD[t], t);
  assert.deepEqual(ZONE_BG_ROAD, { t6_road_up: 'hoshimichi', t6_road_low: 'hoshimichi_deep' });
  for (const [t, bg] of Object.entries(ZONE_BG_ROAD)) assert.equal(ZONE_BG[t], bg);
  for (const [id, bg] of [['star_eater', 'hoshimichi'], ['pendula', 'hoshimichi_deep']]) {
    const f = FIXED_ENCOUNTERS[id];
    assert.equal(f, FIXED_ROAD[id]);
    assert.deepEqual(f.group, [[id, 1, 1]], `${id}: 魔物の ID も おなじ`);
    assert.ok(f.boss && f.canFlee === false && !f.loseOk, id);
    assert.equal(f.bgm, 'boss6', `${id}: 曲は A の boss6`);
    assert.equal(f.bg, bg);
  }
  for (const bg of ['hoshimichi', 'hoshimichi_deep']) assert.ok(battleBgSpec(bg) && ROAD_BG[bg], bg);
  assert.deepEqual(Object.keys(ROAD_TREASURE_FLOORS).map(Number), [1, 2, 3, 4, 5, 6, 7, 8]);
  for (const list of Object.values(ROAD_TREASURE_FLOORS)) assert.equal(list.length, 2);
  assert.equal(ROAD_FIELD_TREASURE.length, 3);
});

// ───────────── 魔物 ─────────────
test('魔物: 新しい 8しゅ（古道 1〜4階 4・5〜8階 4）。レベル・空の レアの 地方 6・弱点・技・せつめい。ほかの 魔物と ID が かぶらない', () => {
  assert.deepEqual(NEW.sort(), [...UP, ...LOW].sort());
  for (const id of Object.keys(MONSTERS_ROAD)) assert.equal(MONSTERS[id], MONSTERS_ROAD[id], `${id}: ほかの 魔物を うわがき しない`);
  for (const id of NEW) {
    const m = MONSTERS[id];
    assert.ok(!m.boss && m.desc && m.desc.length > 20, id);
    assert.equal(regionOf(id), 6, id);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${id}: ${a.id}`);
    assert.ok(Object.values(m.resist).some((v) => v >= 1.3), `${id}: 弱点`);
    assert.ok(MAT_DROPS[id] && MAT_DROPS[id] === ROAD_MAT_DROPS[id] && ITEMS[MAT_DROPS[id][0]].type === 'mat', `${id}: 素材`);
  }
  // おすすめ Lv（plan-ch6.md の 12-1: 1〜4階 61〜62・5〜8階 63〜64）
  for (const id of UP) assert.ok(MONSTERS[id].lv >= 61 && MONSTERS[id].lv <= 62, id);
  for (const id of LOW) assert.ok(MONSTERS[id].lv >= 63 && MONSTERS[id].lv <= 64, id);
  // 星座の 魔物: 夜だけ 強い 2しゅ・昼だけ 強い 2しゅ
  const tod = (w) => NEW.filter((id) => MONSTERS[id].c6tod?.when === w).sort();
  assert.deepEqual(tod('night'), ['star_wolf', 'toki_owl']);
  assert.deepEqual(tod('day'), ['crab_star', 'sun_ram']);
  for (const a of Object.values(ROAD_ABILITIES)) assert.ok(a.name && a.desc && a.anim && a.cast, a.name);
  // ボス
  for (const [id, lv, kind] of [[STAR_EATER, 62, 'stars'], [PENDULA, 64, 'pend']]) {
    const m = MONSTERS[id];
    assert.ok(m.boss && m.turns === 2 && m.lv === lv && m.ch6?.kind === kind, id);
    assert.ok(!MONSTER_FRIENDS[id], `${id}: 仲間に ならない`);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${id}: ${a.id}`);
  }
  assert.equal(MONSTERS.star_eater.name, '星くいのよる鳥');
  assert.equal(MONSTERS.pendula.name, 'ペンデュラ');
  for (const v of ROAD_VARIANTS) assert.ok(MONSTERS[v]?.variant && MONSTER_ART[MONSTERS[v].art], v);
});

test('昼と 夜: 星座の 魔物は その 時間なら たたかいの はじめに 力が 上がる（hooks.night）', () => {
  const at = (night) => {
    const { b } = battle({ enemies: ['star_wolf', 'sun_ram', 'crab_star', 'toki_owl'], hooks: { night: () => night } });
    const msg = b.flush().filter((e) => e.t === 'msg').flatMap((e) => e.lines);
    return { e: Object.fromEntries(b.enemies.map((x) => [x.species, x])), msg };
  };
  const n = at(true), d = at(false);
  assert.equal(n.e.star_wolf.buffs.atk.mult, 1.2);
  assert.equal(n.e.star_wolf.buffs.atk.left, Infinity, 'ずっと つづく');
  assert.ok(n.e.toki_owl.buffs.agi && !n.e.sun_ram.buffs.def && !n.e.crab_star.buffs.def);
  assert.ok(d.e.sun_ram.buffs.def && d.e.crab_star.buffs.def && !d.e.star_wolf.buffs.atk && !d.e.toki_owl.buffs.agi);
  assert.ok(n.msg.some((l) => l.includes('夜空の星座が光って')) && n.msg.some((l) => l.includes('夜は、力が強くなる')));
  assert.ok(d.msg.some((l) => l.includes('お日さまの光')) && d.msg.some((l) => l.includes('昼は、力が強くなる')));
  // 夜は ゲージが すこし 速い（素早さの バフ）
  assert.ok(atbRate(n.e.star_wolf) > atbRate(d.e.star_wolf));
  // hooks が ない とき（シミュレーターの ふつう）は 昼
  const { b } = battle({ enemies: ['sun_ram'] });
  assert.ok(b.enemies[0].buffs.def);
});

test('仲間: 新しい 8しゅは 仲間に なる（1/14〜1/24・系統配合の 子には ならない）。ボスは ならない', () => {
  for (const id of NEW) {
    const f = MONSTER_FRIENDS[id];
    assert.equal(f, FRIENDS_ROAD[id], id);
    assert.ok(f.rate >= 1 / 24 && f.rate <= 1 / 14, id);
    assert.ok(f.noFamily && !familyPool(MONSTERS[id].race, MONSTERS).includes(id), id);
    assert.ok(f.names.length >= 3 && f.note && f.names.every((n) => n.length <= 8), id);
    for (const [, ab] of f.learn) {
      assert.ok(ABILITIES[ab], `${id}: ${ab}`);
      assert.ok(!['seEat', 'pdStop', 'telegraph'].includes(ABILITIES[ab].effect.type), `${id}: ${ab}`);
    }
    const sum = Object.values(f.growth).reduce((s, v) => s + v, 0);
    assert.ok(sum >= 5.8 && sum <= 7.3, `${id}: ${sum}`);
  }
  for (const id of ['sun_ram', 'crab_star', 'dust_drake']) assert.ok(MONSTER_FRIENDS[id].rate <= 1 / 20, id);
  // 前から いる 夜の フクロウ（night.js の night_owl）は そのまま
  assert.notEqual(MONSTERS.night_owl, MONSTERS.toki_owl);
});

test('出現表: どの 表も 今の 魔物が いる・数は 0〜3。上と 下の 階で ちがう 組', () => {
  const sps = (t) => new Set(ENCOUNTERS_ROAD[t].flatMap((e) => e.group.map(([sp]) => sp)));
  for (const list of Object.values(ENCOUNTERS_ROAD)) {
    for (const e of list) {
      assert.ok(e.w > 0);
      for (const [sp, mn, mx] of e.group) {
        assert.ok(MONSTERS[sp], sp);
        assert.ok(mn >= 0 && mx >= mn && mx <= 3);
      }
      assert.ok(e.group.some(([, mn]) => mn >= 1), '1体は かならず 出る');
    }
  }
  for (const id of UP) assert.ok(sps('t6_road_up').has(id), id);
  for (const id of LOW) assert.ok(sps('t6_road_low').has(id) && !sps('t6_road_up').has(id), `${id} は 下の 階だけ`);
  for (const id of ROAD_BOSSES) for (const t of Object.keys(ENCOUNTERS_ROAD)) assert.ok(!sps(t).has(id), `${t}: ボスは 出ない`);
});

// ───────────── 星くいのよる鳥 ─────────────
test('星くいのよる鳥: every 回 動くと かならず 星を ねらう（前ぶれ）→ 星くい（星が へる・HPが もどる・力が 上がる）', () => {
  const { b, m } = battle({ seed: 21 });
  const conf = MONSTERS[STAR_EATER].ch6.stars;
  assert.deepEqual([m.stars.left, m.stars.max], [conf.n, conf.n]);
  assert.equal(pub(m).stars, 3);
  assert.equal(pub(m).starsMax, 3);
  for (let i = 1; i < conf.every; i++) {
    bossAct(b, m);
    assert.equal(m.stars.count, i);
    assert.ok(!m.telegraph);
  }
  const ev = bossAct(b, m, AI);
  assert.equal(ev.ability, AIM);
  assert.equal(m.telegraph, EAT);
  assert.equal(pub(m).starAim, 1);
  m.hp = Math.floor(m.maxHp * 0.6);
  const hp0 = m.hp, atk0 = m.atk, mag0 = m.mag;
  const ev2 = bossAct(b, m, AI);
  assert.equal(ev2.ability, EAT);
  assert.equal(m.stars.left, 2);
  assert.equal(ev2.seEat.left, 2);
  assert.equal(m.hp - hp0, Math.round(m.maxHp * conf.heal));
  assert.equal(m.atk, Math.round(atk0 * conf.pow));
  assert.equal(m.mag, Math.round(mag0 * conf.pow));
  assert.ok(has(ev2, 'のこりの星2/3'));
  assert.equal(m.telegraph, null);
  assert.equal(m.stars.count, 0, '数え直し');
});

test('星くいのよる鳥: ねらっている 間に 光を 当てると 目が くらんで 食べそこねる（1回の 行動で 1回）。光で ない ときは そのまま', () => {
  const { b, m, a } = battle({ seed: 22 });
  m.telegraph = EAT;
  const ev = { lines: [], upd: [] };
  roadDamage(b, a[0], m, 100, { element: 'fire' }, ev);
  assert.equal(m.telegraph, EAT, '炎では くらまない');
  roadDamage(b, a[0], m, 100, { element: 'light' }, ev);
  assert.equal(m.telegraph, null);
  assert.equal(ev.seStun, m.id);
  assert.equal(m.debuffs.def.mult, MONSTERS[STAR_EATER].ch6.stars.cut);
  assert.ok(ev.postLines.some((l) => l.includes('目がくらんだ')) && ev.postLines.some((l) => l.includes('星を食べそこねた')));
  assert.equal(m.stars.left, 3, '星は 守られた');
  // ほんとうの 光の 呪文（聖なる光）でも
  const k = battle({ seed: 23 });
  k.m.telegraph = EAT;
  const pr = k.a[1];
  pr.abilities = [...new Set([...(pr.abilities || []), 'sr_seikou'])];
  pr.mp = pr.maxMp;
  k.b.queue = [{ id: pr.id, cmd: { type: 'ability', id: 'sr_seikou', target: k.m.id }, last: true }];
  pr.queued = true;
  k.b.flush();
  k.b.executeNext();
  const e = k.b.flush().find((x) => x.t === 'act' && x.id === pr.id);
  assert.ok(e.seStun && k.m.telegraph === null, JSON.stringify(e.lines));
  // 次の 番は ふつうの 行動（星は 食べない）
  const ev3 = bossAct(k.b, k.m, AI);
  assert.notEqual(ev3.ability, EAT);
  assert.equal(k.m.stars.left, 3);
});

test('星くいのよる鳥: 星が ぜんぶ なくなると 夜をまとう → よぞらのはばたき（身を 守ると 半分）。HPが へると ねらうのが はやく なる', () => {
  const { b, m, a } = battle({ seed: 24 });
  const conf = MONSTERS[STAR_EATER].ch6.stars;
  m.hp = m.maxHp = 999999;
  m.stars.left = 0;
  m.stars.count = conf.every - 1;
  const ev = bossAct(b, m, AI);
  assert.equal(ev.ability, DARK_CHARGE);
  assert.equal(m.telegraph, DARK);
  for (const x of a) x.hp = x.maxHp = 99999;
  a[1].defending = true;
  const ev2 = bossAct(b, m, AI);
  assert.equal(ev2.ability, DARK);
  const dmg = (t) => (ev2.results || []).filter((r) => r.id === t.id).reduce((s, r) => s + (r.dmg || 0), 0);
  assert.ok(dmg(a[0]) > 0 && dmg(a[1]) > 0 && dmg(a[1]) < dmg(a[0]), `${dmg(a[1])} < ${dmg(a[0])}`);
  // HPが fastAt より 少ない: fastEvery 回で ねらう
  const f = battle({ seed: 25 });
  f.m.hp = Math.floor(f.m.maxHp * 0.4);
  for (let i = 1; i < conf.fastEvery; i++) bossAct(f.b, f.m);
  assert.ok(f.m.stars.fast);
  assert.equal(bossAct(f.b, f.m, AI).ability, AIM);
});

// ───────────── ペンデュラ ─────────────
test('ペンデュラ: 時のふりこが 1回ごとに ゆれる。左の 間は 味方が 速く 魔女が おそい・右の 間は その 逆（ゲージの 速さ）', () => {
  const { b, m, a } = battle({ seed: 31, enemies: [PENDULA] });
  const conf = MONSTERS[PENDULA].ch6.pend;
  assert.equal(m.pend.pos, -conf.reach, 'はじめは 左はし');
  assert.equal(pub(m).pendPos, -conf.reach);
  assert.equal(a[0].tmul, conf.ally[0]);
  assert.equal(m.tmul, conf.boss[0]);
  const base = atbRate({ ...a[0], tmul: 1 });
  assert.ok(Math.abs(atbRate(a[0]) - base * conf.ally[0]) < 1e-9, '左: 味方が 速い');
  const order = [];
  for (let i = 0; i < 12; i++) {
    bossAct(b, m);
    order.push(m.pend.pos);
    m.telegraph = null;
  }
  assert.deepEqual(order, [-2, -1, 0, 1, 2, 3, 2, 1, 0, -1, -2, -3]);
  // 右の 間（pos 1〜3）は 味方が おそく 魔女が 速い
  m.pend.pos = 1;
  m.pend.dir = 1;
  const ev = bossAct(b, m);
  assert.equal(m.pend.pos, 2);
  assert.equal(a[0].tmul, conf.ally[1]);
  assert.equal(m.tmul, conf.boss[1]);
  assert.ok(atbRate(a[0]) < base && atbRate(m) > atbRate({ ...m, tmul: 1 }));
  assert.equal(ev.pdSwing.side, 1);
});

test('ペンデュラ: まん中で 時止めの 前ぶれ（いちばん ゲージの たまった 人）→ 時止め（ゲージが 0 で 止まる）→ ふりこが はしから もどり始めると 動き出す', () => {
  const { b, m, a } = battle({ seed: 32, enemies: [PENDULA] });
  const conf = MONSTERS[PENDULA].ch6.pend;
  for (const x of a) x.hp = x.maxHp = 99999;
  bossAct(b, m);
  bossAct(b, m);
  a[2].atb = 90;
  for (const x of [a[0], a[1], a[3]]) x.atb = 10;
  assert.equal(pickStop(b), a[2]);
  const ev = bossAct(b, m, AI);
  assert.equal(m.pend.pos, 0);
  assert.equal(ev.ability, STOP_CHARGE);
  assert.equal(m.telegraph, STOP);
  assert.equal(ev.pdAim.target, a[2].id);
  assert.equal(pub(m).pendTarget, a[2].id);
  assert.ok(has(ev, `${a[2].name}は、身を守れば止まらない`));
  assert.equal(a[0].tmul, 1, 'まん中は ふつうの 速さ');
  // 時止め
  const ev2 = bossAct(b, m, AI);
  assert.equal(ev2.ability, STOP);
  assert.equal(ev2.pdStop, a[2].id);
  assert.equal(a[2].atb, 0);
  assert.equal(a[2].tstop, conf.stop);
  assert.equal(atbRate(a[2]), 0, 'ゲージが 止まる');
  assert.deepEqual(pub(m).pendFrozen, [a[2].id]);
  // ふりこが 右はしまで 行って もどり始めると 動き出す（右はしでは 大ふりこの 前ぶれ）
  let free = null;
  for (let i = 0; i < conf.stop; i++) {
    const e = bossAct(b, m, AI);
    if (e.pdFree) free = e;
  }
  assert.ok(free && free.pdFree.includes(a[2].id) && has(free, 'また動き出した'));
  assert.equal(m.pend.pos, conf.reach - 1, 'ふりこが 右はしから もどり始めた');
  assert.equal(a[2].tstop, 0);
  assert.ok(atbRate(a[2]) > 0);
  assert.deepEqual(pub(m).pendFrozen, []);
});

test('ペンデュラ: 時止めで ねらわれた 人が 身を 守っていると 止まらない', () => {
  const { b, m, a } = battle({ seed: 33, enemies: [PENDULA] });
  m.pend.pos = -1;
  a[1].atb = 95;
  bossAct(b, m, AI);
  assert.equal(m.pend.target, a[1].id);
  a[1].defending = true;
  const ev = bossAct(b, m, AI);
  assert.equal(ev.pdGuard, a[1].id);
  assert.ok(!ev.pdStop && !(a[1].tstop > 0) && atbRate(a[1]) > 0);
  assert.ok(has(ev, '時止めを、はねかえした'));
});

test('ペンデュラ: 右はしで 大ふりこの 前ぶれ → 大ふりこ（みんなに 物理。身を 守ると 半分）', () => {
  // かわされない 戦いを さがす（せんしと そうりょの 両方に 当たる）
  const hit = (seed) => {
    const t = battle({ seed, enemies: [PENDULA] });
    for (const x of t.a) x.evasion = 0;
    return t;
  };
  let found = null;
  for (let seed = 34; seed < 80 && !found; seed++) {
    const t = hit(seed);
    t.m.hp = t.m.maxHp = 999999;
    t.m.pend.pos = 2;
    t.m.pend.dir = 1;
    const e1 = bossAct(t.b, t.m, AI);
    for (const x of t.a) x.hp = x.maxHp = 99999;
    t.a[1].defending = true;
    const e2 = bossAct(t.b, t.m, AI);
    if (!(e2.results || []).some((r) => r.miss)) found = { ...t, e1, e2 };
  }
  assert.ok(found, 'かわされない 戦い');
  const { b, m, a } = battle({ seed: 34, enemies: [PENDULA] });
  m.hp = m.maxHp = 999999;
  m.pend.pos = 2;
  m.pend.dir = 1;
  const ev = bossAct(b, m, AI);
  assert.equal(m.pend.pos, 3);
  assert.equal(ev.ability, SWING_CHARGE);
  assert.equal(m.telegraph, SWING);
  assert.ok(ev.pdBig && has(ev, '大ふりこが来る'));
  const ev2 = found.e2;
  assert.equal(ev2.ability, SWING);
  assert.equal(found.m.pend.pos, 2, 'ふりこは もどり始める');
  const dmg = (t) => (ev2.results || []).filter((r) => r.id === t.id).reduce((s, r) => s + (r.dmg || 0), 0);
  assert.ok(dmg(found.a[0]) > 0 && dmg(found.a[1]) > 0 && dmg(found.a[1]) < dmg(found.a[0]), `${dmg(found.a[1])} < ${dmg(found.a[0])}`);
});

test('ペンデュラ: 時止めで 合体技の よやくも おわる・家族の 番（コマンドを えらんでいる）も とりやめ', () => {
  const { b, m, a } = battle({ seed: 35, enemies: [PENDULA] });
  m.pend.pos = 0;
  m.pend.target = a[0].id;
  m.telegraph = STOP;
  a[0].ready = true;
  a[0].atb = 100;
  const ev = bossAct(b, m, AI);
  assert.equal(ev.pdStop, a[0].id);
  assert.ok(!a[0].ready && a[0].atb === 0 && a[0].tstop > 0);
});

// ───────────── オート ─────────────
test('オート: ふつうの オートは 大ふりこ・よぞらのはばたきの 前に HPが へっていれば よく 身を 守る。知っている 人は 光・時止めで 守る', () => {
  assert.deepEqual(ROAD_BIG, [DARK, SWING]);
  const decide = () => ({ type: 'attack', target: 'e1' });
  for (const [sp, tele] of [[PENDULA, SWING], [STAR_EATER, DARK]]) {
    let guards = 0, full = 0;
    for (let s = 0; s < 40; s++) {
      const { b, m, a } = battle({ seed: 100 + s, enemies: [sp] });
      m.telegraph = tele;
      m.atb = 99;
      a[0].hp = Math.floor(a[0].maxHp * 0.5);
      if (ch6Plan(b, a[0], decide)?.type === 'defend') guards++;
      a[0].hp = a[0].maxHp;
      if (ch6Plan(b, a[0], decide)?.type === 'defend') full++;
    }
    assert.ok(guards > 10 && guards < 40, `${sp}: ${guards}/40（${AUTO_GUARD.chance}）`);
    assert.equal(full, 0, `${sp}: HPが ある ときは 守らない`);
  }
  // 知っている 人: よる鳥が 星を ねらったら 光（大神官）
  const hp = jobChar('high_priest', 62, 10, '大神官');
  const k = battle({ seed: 8, party: [hp, ...PARTY().slice(1)] });
  k.b.knowsCh6 = true;
  k.m.telegraph = EAT;
  const l = ch6Plan(k.b, k.a[0], decide);
  const prim = (id) => (ABILITIES[id].effect.type === 'multi' ? ABILITIES[id].effect.parts[0] : ABILITIES[id].effect);
  assert.equal(l.type, 'ability');
  assert.equal(prim(l.id).element, 'light');
  k.b.c6NoLight = true;
  assert.deepEqual(ch6Plan(k.b, k.a[0], decide), decide(), 'しかけを 知らない 人は ふつう');
  // ペンデュラ: ねらわれた 人だけ 身を 守る・大ふりこは 先に 来るなら みんな 守る
  const p = battle({ seed: 9, enemies: [PENDULA] });
  p.b.knowsCh6 = true;
  p.m.telegraph = STOP;
  p.m.pend.target = p.a[2].id;
  assert.equal(ch6Plan(p.b, p.a[2], decide).type, 'defend');
  assert.deepEqual(ch6Plan(p.b, p.a[0], decide), decide());
  p.m.telegraph = SWING;
  p.m.atb = 99;
  assert.equal(ch6Plan(p.b, p.a[0], decide).type, 'defend');
  p.m.atb = 0;
  for (const x of p.a) x.atb = 99;
  assert.deepEqual(ch6Plan(p.b, p.a[0], decide), decide(), '自分の 番が 先なら 攻める');
});

// ───────────── シミュレーション ─────────────
test('シミュレーション: tools/sim-ch6.mjs の eater・pend（超級職 4人・その ころの ★装備）。さいごまで 戦える・しかけが 動く', { timeout: 300000 }, () => {
  for (const boss of ['eater', 'pend']) {
    assert.deepEqual(ch6Party(boss, CH6_LV[boss]).map((c) => c.job), ['hero', 'daikenja', 'god_hand', 'high_priest']);
    for (const [job, k] of Object.entries(CH6_KIT[boss])) for (const id of k) assert.ok(id === null || (ITEMS[id] && canEquip(job, id)), `${boss} ${job}: ${id}`);
  }
  assert.deepEqual([CH6_LV.eater, CH6_LV.pend], [62, 64]);
  const e = ch6Run('eater', 62, true, 6060);
  assert.ok(['win', 'lose'].includes(e.outcome));
  assert.ok(e.stuns >= 1 && e.duals > 0, JSON.stringify(e));
  const en = ch6Run('eater', 62, true, 6060, { skip: 'trick' });
  assert.ok(en.eats >= 1 && en.stuns <= en.eats + 2, JSON.stringify(en));
  const p = ch6Run('pend', 64, true, 6060);
  assert.ok(['win', 'lose'].includes(p.outcome));
  assert.ok(p.tguards >= 1, JSON.stringify(p));
  const pn = ch6Run('pend', 64, false, 6060);
  assert.ok(pn.tstops >= 1 && pn.duals === 0, JSON.stringify(pn));
  // ペンデュラの 装備は 古道の 宝と 星くいのよる鳥の 品を 使う
  assert.ok(CH6_KIT.pend.hero.includes('p6r_road_sword') && CH6_KIT.pend.god_hand.includes('p6r_night_claw') && CH6_KIT.pend.hero.includes('p6r_eater_plume'));
});

test('きまった 戦い star_eater・pendula: 台本の ["showMon", id] → ["battle", id] と おなじ（背景・曲・ボス）。さいごまで 動く', { timeout: 180000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(63), rateLimit: false });
  const ken = new Bot(world, 'ケン');
  await ken.login();
  await ken.createAndPlay('warrior');
  await ken.settle();
  for (const [id, bg] of [['star_eater', 'hoshimichi'], ['pendula', 'hoshimichi_deep']]) {
    ken.s.busy = null;
    const done = startFixedBattle(world, ken.s, [ken.s], id);
    const start = ken.msgs.filter((x) => x.t === 'battleStart').pop();
    assert.equal(start.snap.bg, bg);
    assert.equal(start.snap.bgm, 'boss6');
    assert.equal(start.snap.boss, true);
    assert.equal(start.snap.canFlee, false);
    const en = start.snap.combatants.filter((x) => x.side === 'enemy');
    assert.deepEqual(en.map((x) => x.species), [id]);
    if (id === 'star_eater') assert.ok(en[0].stars === 3 && en[0].starsMax === 3);
    else assert.ok(en[0].pendPos === -3 && en[0].pendReach === 3);
    await ken.settle(60000);
    const outcome = await done;
    assert.ok(['win', 'lose'].includes(outcome), outcome);
  }
});

// ───────────── 品 ─────────────
test('宝箱: 古道 1〜8階に 2つずつ・社の まわり 3つ。ぜんぶ ランク10の ★5（オレンジ）。深い 階ほど 強い・時のいせきより 強い', () => {
  const all = [...Object.values(ROAD_TREASURE_FLOORS).flat(), ...ROAD_FIELD_TREASURE];
  assert.equal(new Set(all).size, 19);
  for (const id of all) {
    const it = ITEMS[id];
    assert.equal(it, ITEMS_ROAD[id], id);
    assert.ok(it.rank === 10 && rarityOf(id) === 4 && starsOf(id) === 5, id);
    assert.ok(!(it.price > 0) && it.sell > 0 && it.desc && ITEM_KANA[id] === ROAD_ITEM_KANA[id], id);
  }
  for (const id of Object.values(ROAD_TREASURE_FLOORS).flat()) {
    assert.equal(ITEMS[id].src, 'road', id);
    assert.equal(rareWhereText(id), '星めぐりの古道の宝箱でしか手に入らない');
  }
  for (const id of ROAD_FIELD_TREASURE) assert.equal(ITEMS[id].src, 'past', id);
  // 武器 10しゅるい ぜんぶ（つえ・ツメは 社の まわりと ボス）
  const cats = new Set([...all, ...Object.values(ROAD_DROPS).flat()].filter((id) => ITEMS[id].type === 'weapon').map((id) => ITEMS[id].cat));
  assert.deepEqual([...cats].sort(), ['axe', 'bat', 'boomerang', 'claw', 'dagger', 'fan', 'spear', 'staff', 'sword', 'whip']);
  // 強さの かけ算: 社の まわり → 1階 → 8階（時のいせきの 7階より 上）
  const ks = [ROAD_K.field, ...[1, 2, 3, 4, 5, 6, 7, 8].map((f) => ROAD_K[f])];
  for (let i = 1; i < ks.length; i++) assert.ok(ks[i] > ks[i - 1]);
  assert.ok(ROAD_K[1] > PAST_K.toki_ruin[7] && ROAD_K.field >= PAST_K.toki_ruin[7]);
  // 古道 8階の 剣は ときをきざむ剣・時のいせきの 剣より 少し 強い
  assert.ok(ITEMS.p6r_road_sword.atk > ITEMS.p6_tick_sword.atk && ITEMS.p6r_road_sword.atk > ITEMS.p6_ruin_sword.atk);
  assert.ok(ITEMS.p6r_road_sword.atk < ITEMS.p6_tick_sword.atk * 1.1, 'ほんの 少し');
});

test('ボスの 品: かならず 1人 1つの ★5（レア度3）と、いちばん めずらしい 色の ★5の 武器。ギアドンの 品より 強い', () => {
  for (const [id, [acc, weapon]] of Object.entries(ROAD_DROPS)) {
    assert.deepEqual(MONSTERS[id].drops.boss, [acc], id);
    assert.deepEqual(MONSTERS[id].drops.rare, [weapon, 1], id);
    const rng = makeRng(4);
    for (let i = 0; i < 20; i++) {
      const got = rollDrops(id, rng);
      assert.ok(got.includes(acc) && got.includes(weapon), `${id}: かならず ${got}`);
    }
    assert.ok(monsterDrops(id).some((d) => d.item === acc && d.rate === 1));
    const a = ITEMS[acc], w = ITEMS[weapon];
    assert.ok(a.type === 'acc' && a.unique && a.rank === 10 && rarityOf(acc) === 3, acc);
    assert.ok(w.type === 'weapon' && w.rank === 10 && rarityOf(weapon) === 5 && !w.unique, weapon);
    for (const x of [acc, weapon]) {
      assert.equal(starsOf(x), 5, x);
      assert.equal(rareWhereText(x), '時の魔物からしか手に入らない');
      assert.ok(ITEMS[x].boss === id && ITEMS[x].src === 'pastboss');
    }
  }
  const bsum = (it) => Object.values(it.bonus || {}).reduce((s, v) => s + Math.max(0, v), 0);
  assert.ok(bsum(ITEMS.p6_gear_charm) < bsum(ITEMS.p6r_eater_plume) && bsum(ITEMS.p6r_eater_plume) < bsum(ITEMS.p6r_pendulum_charm));
  // よぞらのツメは いちばん 強い ツメ・さかさ時計のつえは いちばん 強い つえ
  // 第6章 Step 6 の 品（時計塔 6〜10階・ゼンマイ・第6章クリア）は のぞく
  const top = (cat) => Object.entries(ITEMS).filter(([id, it]) => it.type === 'weapon' && it.cat === cat && !it.base && !ITEMS_TOKEI6[id]).sort((x, y) => y[1].atk - x[1].atk)[0][0];
  assert.equal(top('claw'), 'p6r_night_claw');
  assert.equal(top('staff'), 'p6r_witch_staff');
  assert.ok(ITEMS.p6r_witch_staff.atk > ITEMS.p6_sand_staff.atk);
  // 名前が ほかの 品と かぶらない
  const names = new Map();
  for (const [id, it] of Object.entries(ITEMS)) {
    if (it.base) continue;
    if (ITEMS_ROAD[id]) assert.ok(!names.has(it.name), `名前が かぶる: ${it.name}`);
    names.set(it.name, id);
  }
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
    eye(cx, cy, r) { colors.add('#ffffff'); colors.add('#1a1026'); pts.push([cx - r, cy - r], [cx + r, cy + r]); },
    dot(x, y, c) { colors.add(c); pts.push([x, y]); },
  };
  return { g, colors, pts };
}
const outside = (pts, w, h, extra = 0.6) => pts.filter(([x, y]) => x < -(1 + extra) / w || x > 1 + (1 + extra) / w || y < -(1 + extra) / h || y > 1 + (1 + extra) / h);

test('絵: 新しい 魔物 8しゅと ボス 2体（パレットの 中・はみださない・2コマ・大きさ）', () => {
  const BW = 256, BASE_Y = 124;
  for (const id of [...NEW, ...ROAD_BOSSES]) {
    const d = MONSTER_ART[id];
    assert.ok(d, `${id} の え`);
    const boss = ROAD_BOSSES.includes(id);
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
  for (const id of ROAD_BOSSES) {
    assert.ok(MONSTER_ART[id].size[0] >= 96 && MONSTER_ART[id].size[1] + 2 <= BASE_Y, id);
    assert.ok(MONSTER_ART[id].npc > 0, `${id}: フィールドの 大きな NPC にも`);
  }
  for (const t of Object.keys(ENCOUNTERS_ROAD)) {
    for (const e of ENCOUNTER_TABLES[t]) {
      const wsum = e.group.reduce((s, [sp, , mx]) => s + mx * ((MONSTER_ART[MONSTERS[sp].art || sp]?.size[0] || 40) + 6), 0);
      assert.ok(wsum * 0.55 <= BW - 12, `${t}: ${JSON.stringify(e.group)}`);
    }
  }
});

test('絵: 戦いの 背景 2つ と エフェクト（新しい 技 ぜんぶ）', () => {
  assert.deepEqual(Object.keys(ROAD_BG).sort(), ['hoshimichi', 'hoshimichi_deep']);
  const calls = [];
  const ctx = new Proxy({}, {
    get: (o, k) => (k in o ? o[k] : (...args) => { calls.push(k); return undefined; }),
    set: (o, k, v) => { o[k] = v; return true; },
  });
  for (const [id, d] of Object.entries(ROAD_BG)) {
    assert.equal(battleBgSpec(id), d);
    assert.ok(ROAD_DECOS.has(d.deco));
    assert.ok(d.sky.length >= 3 && d.ground.length === 2);
    const n = calls.length;
    drawRoadBg(ctx, d, 78);
    drawRoadFloorBg(ctx, d, 78);
    assert.ok(calls.length - n > 120, `${id}: こまかく かく ${calls.length - n}`);
  }
  const fx = new Proxy({}, { get: () => () => {} });
  const own = [...new Set(Object.values(ROAD_ABILITIES).map((a) => a.anim).filter((a) => a !== 'none'))];
  for (const a of own) {
    assert.equal(playRoadFx(fx, a, [{ x: 100, y: 60 }], null, {}), true, a);
    // 星の塔・…・千年前の エフェクトの あとに よばれる（battlefx-ch5.js → … → battlefx-ch6.js → battlefx-road.js）
    assert.equal(playCh6Fx(fx, a, [{ x: 100, y: 60 }], null, {}), true, a);
    assert.equal(playTowerFx(fx, a, [{ x: 100, y: 60 }], null, { to: [] }), true, a);
  }
  assert.equal(playRoadFx(fx, 'slash_fast', [{ x: 1, y: 1 }], null), false);
  for (const a of ROAD_SCREEN_ANIMS) assert.ok(own.includes(a), a);
  for (const a of Object.keys(ROAD_ALLY_FX)) assert.ok(own.includes(a), a);
  for (const a of Object.keys(ROAD_SFX)) assert.ok(own.includes(a), a);
});

test('がめん: 道しるべの 星（ねらう 星は 赤い わ）・時のふりこの 目もり・バナー（前ぶれの バナーは 自分で）', () => {
  const drawn = [];
  const x = new Proxy({}, { get: (o, k) => (k in o ? o[k] : (...args) => drawn.push(k)), set: (o, k, v) => { o[k] = v; return true; } });
  const scene = { time: 100 };
  const draw = (c, f = roadDraw) => { drawn.length = 0; f(scene, x, {}, c, 60, 10, 110, 108, 1); return drawn.length; };
  assert.equal(draw({ species: 'star_wolf', alive: true }), 0);
  const se = { species: STAR_EATER, alive: true, stars: 3, starsMax: 3, starAim: 0 };
  const plain = draw(se);
  assert.ok(plain > 0);
  se.starAim = 1;
  assert.ok(draw(se) > plain, 'ねらう 星の 赤い わ');
  assert.ok(draw({ species: PENDULA, alive: true, pendPos: -3, pendReach: 3, pendFrozen: [] }) > 0);
  assert.ok(draw({ species: PENDULA, alive: true, pendPos: 1, pendReach: 3, pendFrozen: [] }, ch6Draw) > 0, 'battle-ch6.js の ch6Draw から よぶ');
  for (const id of ROAD_OWN_TELE) assert.ok(CH6_OWN_TELE.has(id), id);
  const banners = [];
  const style = { boxShadow: '', filter: '' };
  const c = new Map([['a1', { id: 'a1', name: 'ケン', side: 'ally' }], ['e1', { id: 'e1', species: PENDULA, alive: true, pendFrozen: ['a1'], pendTarget: null }]]);
  const s2 = {
    game: { audio: { sfx() {} } }, banner: (t, k) => banners.push([t, k]), shake() {}, c,
    enemies: () => [c.get('e1')], allies: () => [c.get('a1')], statusBoxes: new Map([['a1', { box: { style } }]]),
  };
  roadPresent(s2, { lines: [], ability: AIM }, { type: 'telegraph' }, null, { species: STAR_EATER });
  roadPresent(s2, { lines: [], seStun: 'e1' }, {}, null, null);
  roadPresent(s2, { lines: [], seEat: { left: 1 } }, {}, null, null);
  roadPresent(s2, { lines: [], ability: STOP_CHARGE, pdAim: { name: 'ケン' } }, { type: 'telegraph' }, null, { species: PENDULA });
  roadPresent(s2, { lines: [], pdStop: 'a1' }, {}, null, null);
  roadPresent(s2, { lines: [], pdGuard: 'a1' }, {}, null, null);
  roadPresent(s2, { lines: [], ability: SWING_CHARGE }, { type: 'telegraph' }, null, { species: PENDULA });
  roadPresent(s2, { lines: [], pdSwing: { side: 0 } }, {}, null, null);
  roadPresent(s2, { lines: [], pdSwing: { side: 1 } }, {}, null, null);
  assert.deepEqual(banners.map((y) => y[1]), ['danger', 'combo', 'danger', 'danger', 'danger', 'combo', 'danger', 'danger']);
  assert.ok(banners[0][0].includes('光') && banners[3][0].includes('ケンは身を守れ') && banners[4][0].includes('ケンの時が止まった') && banners[6][0].includes('大ふりこ'));
  assert.ok(banners[7][0].includes('ふりこが右へ'));
  assert.ok(style.boxShadow.includes('122,240,255'), '止まった 人の まどが 光る');
});

// ───────────── 文字 ─────────────
test('文字: 新しい ゲームの 文の ファイルは gameFiles に 入っていて、使えない 漢字・スペースが ない', () => {
  const files = ['public/js/shared/data/monsters-road.js', 'public/js/shared/data/abilities-road.js', 'public/js/shared/data/items-road.js',
    'public/js/shared/data/encounters-road.js', 'public/js/shared/data/companions-road.js', 'public/js/shared/battle-road.js', 'public/js/client/battle-road.js'];
  const all = gameFiles();
  for (const f of files) {
    const full = all.find((y) => y.endsWith(f));
    assert.ok(full, `${f} が gameFiles に ない`);
    const bad = checkFile(full).filter((p) => p.kind !== 'kana');
    assert.deepEqual(bad, [], f);
  }
});
