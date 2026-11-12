// 第2部 第8章 第4幕（Step 7・8）B（戦い・品）「時のはざま」
// 名前の 約束（docs/plan-ch8.md の 9-2）・手下の 魔物 5しゅ・出現表・時の門番フリーゾン（第1形態・第2形態は とちゅうで 終わる／本当の 戦いは
// 見くだしの かまえ・つながる攻撃・時の大玉・最終形態）・かけつけ・心の ためし（守りぬく・一騎うち）・ソリトゥス（3だん・よびかける・にげた 心が もどる・
// 段ごとの やり直し・千年の約束）・ゲスト・宝箱と ボスの 品・負けた 時の ヒントの 文・絵（2倍の こまかさ）・背景・エフェクト・がめん・コマンド・文字
// A の マップ・台本は まだ ないので、きまった 戦いは Battle を じかに 作って 動かす
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle, pub } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ITEMS, ITEM_KANA } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES, ZONE_BG } from '../public/js/shared/data/encounters.js';
import { MAT_DROPS, monsterDrops } from '../public/js/shared/data/loot.js';
import { MONSTER_FRIENDS, rankOf, joinTier } from '../public/js/shared/data/companions.js';
import { MONSTER_RANKS } from '../public/js/shared/data/monster-ranks.js';
import { rareWhereText } from '../public/js/shared/data/rare-loot.js';
import { GUESTS } from '../public/js/shared/data/shops.js';
import { canEquip } from '../public/js/shared/stats.js';
import {
  MONSTERS_C8R, C8R_MINIONS, C8R_HIDDEN, C8R_MAT_DROPS, C8_GATE1, C8_GATE2, C8_GATEKEEPER, C8_TRIAL_GUARD, C8_TRIAL_DUEL, C8_SOLITUS, C8_WIND, C8_PUFF, C8_SHADOW, HEARTS,
} from '../public/js/shared/data/monsters-c8r.js';
import { C8R_ABILITIES } from '../public/js/shared/data/abilities-c8r.js';
import { FRIENDS_C8R } from '../public/js/shared/data/companions-c8r.js';
import { ENCOUNTERS_C8R, FIXED_C8R, ZONE_BG_C8R } from '../public/js/shared/data/encounters-c8r.js';
import { ITEMS_C8R, C8R_TREASURE, C8R_TREASURE_N, c8rChest, C8R_DROPS, C8R_K, C8R_ITEM_KANA } from '../public/js/shared/data/items-c8r.js';
import { C8R_BOSS_HINTS, C8R_SOLITUS_HINTS, c8rBossHint } from '../public/js/shared/data/boss-hints-c8r.js';
import { ITEMS_C8C } from '../public/js/shared/data/items-c8c.js';
import {
  ORB, ORBFAIL, FINAL, LEAVE, CALL, PROMISE, CHEERS, HARDEN, PROMISE_MAX, HELPERS,
  gateConf, chainNeed, stanceUp, solOf, torchOf, rionOf, windOf, puffsAlive, c8rEffect, c8rPlan, doHelp, addGauge,
} from '../public/js/shared/battle-c8r.js';
import { towerTurnStart } from '../public/js/shared/battle-ch5.js';
import { ch8Party, ch8rRun, CH8R_LV, CH8_KIT } from '../tools/sim-ch8.mjs';
import { rankPoints } from '../tools/gen-monster-ranks.mjs';
import { MONSTER_ART, monsterSize, monsterFine } from '../public/js/client/render/monsters.js';
import { playC8rFx, C8R_FINE } from '../public/js/client/render/battlefx-c8r.js';
import { playC8cFx, C8C_FINE } from '../public/js/client/render/battlefx-c8c.js';
import { battleBgSpec } from '../public/js/client/render/battlefx.js';
import { C8R_SCREEN_ANIMS, C8R_ALLY_FX, C8R_SFX, C8R_OWN_TELE, c8rDraw, c8rPresent, c8rSprite, c8rCmdItems, c8rCmdPick } from '../public/js/client/battle-c8r.js';
import { C8C_OWN_TELE, c8cSprite } from '../public/js/client/battle-c8c.js';
import { CH4_ALLY_FX } from '../public/js/client/battle-ch4.js';
import { CH6_OWN_TELE } from '../public/js/client/battle-ch6.js';
import { firstSentence } from '../public/js/client/ui/skillinfo.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';

const WANT = { toki_soul: ['spirit', 'F'], kage_scarab: ['undead', 'E'], toki_moth: ['spirit', 'D'], chikutaku_wani: ['dragon', 'C'], sand_knight: ['undead', 'A'] };
const ev0 = () => ({ lines: [], upd: [], results: [] });
const turn = (b, c, cmd = { type: 'ai' }) => {
  const ev = ev0();
  towerTurnStart(b, c, ev, cmd);
  return ev;
};
const effect = (b, c, id) => {
  const ev = ev0();
  assert.ok(c8rEffect(b, c, ABILITIES[id], ABILITIES[id].effect, ev), id);
  return ev;
};
// 味方の 1回の 行動で 当てる（b.cur … 1回の 行動。b.allyActs … 味方の 行動の 番号）
const hit = (b, c, t, n, extra = {}) => {
  b.allyActs = (b.allyActs || 0) + 1;
  const ev = { ...ev0(), id: c.id, ...extra };
  b.cur = ev;
  b.damage(c, t, n, ev, { element: 'phys', phys: true });
  b.cur = null;
  return ev;
};
function battle(boss, { lv, seed = 3, guest = null, flags = {}, solo = null, hooks = {} } = {}) {
  let party = ch8Party(boss, lv || CH8R_LV[boss]);
  if (solo) party = party.filter((c) => c.job === solo);
  const allies = party.map((c) => ({ char: c, kind: 'support', controller: 'sim', auto: true, tactics: 'balanced' }));
  if (guest) allies.push(guest);
  const id = { gate: C8_GATEKEEPER, gate1: C8_GATE1, gate2: C8_GATE2, guard: C8_TRIAL_GUARD, duel: C8_TRIAL_DUEL, sol1: C8_SOLITUS }[boss];
  const enemies = FIXED_ENCOUNTERS[id].group.flatMap(([sp, n]) => Array(n).fill(sp));
  return new Battle({ rng: makeRng(seed), boss: true, canFlee: false, allies, enemies, hooks: { leaderFlag: (f) => !!flags[f], ...hooks } });
}
const runTo = (b, ms = 60000) => {
  for (let t = 0; t < ms && !b.over; t += 50) b.tick(50);
};

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（plan-ch8.md の 9-2）: きまった 戦い 6つ・t8r_wing・t8r_last・C8R_TREASURE・GUESTS（karim8r・minamo8）', () => {
  const ids = [C8_GATE1, C8_GATE2, C8_GATEKEEPER, C8_TRIAL_GUARD, C8_TRIAL_DUEL, C8_SOLITUS];
  assert.deepEqual(Object.keys(FIXED_C8R), ids);
  for (const id of ids) {
    const f = FIXED_ENCOUNTERS[id];
    assert.equal(f, FIXED_C8R[id]);
    assert.ok(f.boss && f.canFlee === false && !f.loseOk && f.bgm && f.bg, id);
    assert.ok(battleBgSpec(f.bg), `${id}: 背景 ${f.bg}`);
    assert.ok(MONSTERS[f.group[0][0]] && MONSTER_ART[MONSTERS[f.group[0][0]].art || f.group[0][0]], `${id}: showMon の え`);
  }
  // 曲は F班の id（曲が まだ なくても 戦いは できる）
  for (const id of [C8_GATE1, C8_GATE2, C8_GATEKEEPER]) assert.equal(FIXED_C8R[id].bgm, 'c8r_gate');
  assert.equal(FIXED_C8R[C8_SOLITUS].bgm, 'c8r_solitus');
  assert.equal(MONSTERS[C8_GATEKEEPER].lv, 92);
  assert.equal(MONSTERS[C8_SOLITUS].lv, 95);
  for (const id of [C8_GATEKEEPER, C8_SOLITUS]) assert.ok(MONSTERS[id].drops.bonus.includes('limit_stone'), id);
  // 心の ためしの 敵は 図鑑・配合に 出ない
  for (const id of [C8_WIND, C8_PUFF, C8_SHADOW]) assert.ok(MONSTERS[id] && !Object.keys(MONSTERS).includes(id) && MONSTERS[id].noBefriend, id);
  assert.deepEqual(Object.keys(ENCOUNTERS_C8R), ['t8r_wing', 't8r_last']);
  const lvs = (z) => ENCOUNTERS_C8R[z].flatMap((e) => e.group.map((g) => MONSTERS[g[0]].lv));
  assert.ok(lvs('t8r_wing').every((lv) => lv >= 86 && lv <= 91));
  assert.ok(lvs('t8r_last').every((lv) => lv >= 86 && lv <= 94) && Math.max(...lvs('t8r_last')) >= 92);
  for (const z of ['t8r_wing', 't8r_last']) {
    assert.equal(ENCOUNTER_TABLES[z], ENCOUNTERS_C8R[z]);
    assert.equal(ZONE_BG[z], ZONE_BG_C8R[z]);
    assert.ok(battleBgSpec(ZONE_BG[z]), z);
  }
  // ゲスト（4人 そろう。kai8・rion8 は 前から ある）
  for (const [id, base] of [['karim8r', 'karim'], ['minamo8', 'minamo']]) {
    const g = GUESTS[id];
    assert.ok(g && g.id === `guest_${id}` && g.minLevel === 89, id);
    assert.equal(g.job, GUESTS[base].job);
    for (const it of Object.values(g.gear)) assert.ok(ITEMS[it] && canEquip(g.job, it) && !ITEMS_C8R[it] && !ITEMS_C8C[it] && ITEMS[it].src !== 'pastboss', `${id}: ${it}`);
  }
  for (const id of ['kai8', 'rion8']) assert.ok(GUESTS[id]);
});

// ───────────── 手下の 魔物 ─────────────
test('手下の 魔物 5しゅ: どれも 仲間に なる・系統と ランク・まぜ配合・出現表・素材・名前が かぶらない・新しい 絵は 3しゅ', () => {
  assert.deepEqual(C8R_MINIONS.slice().sort(), Object.keys(WANT).sort());
  const names = new Map();
  for (const m of Object.values(MONSTERS)) names.set(m.name, (names.get(m.name) || 0) + 1);
  let fresh = 0;
  for (const [sp, [race, rank]] of Object.entries(WANT)) {
    const m = MONSTERS[sp], f = MONSTER_FRIENDS[sp];
    assert.equal(m, MONSTERS_C8R[sp]);
    assert.equal(f, FRIENDS_C8R[sp]);
    assert.equal(m.race, race, sp);
    assert.equal(names.get(m.name), 1, `${sp}: 名前 ${m.name}`);
    assert.ok(f.rate > 0 && !f.breedOnly && joinTier(sp) && f.mix?.length, `${sp}: 仲間・まぜ配合`);
    assert.equal(MONSTER_RANKS[sp], rank, sp);
    assert.equal(rankOf(sp, MONSTERS), rank, sp);
    assert.equal(rankPoints(sp).band, '第8章');
    assert.equal(!!f.noFamily, rank !== 'A', sp);
    assert.ok(m.lv >= 89 && m.lv <= 94 && m.region === 6, sp);
    assert.ok(Object.values(ENCOUNTERS_C8R).some((t) => t.some((e) => e.group.some((g) => g[0] === sp))), `${sp}: 出現表`);
    assert.ok(MAT_DROPS[sp] && C8R_MAT_DROPS[sp] && ITEMS[MAT_DROPS[sp][0]]?.type === 'mat', sp);
    assert.ok(monsterDrops(sp).some((d) => d.item === MAT_DROPS[sp][0]), sp);
    assert.ok(ITEMS[m.drops.rare[0]]?.price > 0, `${sp}: レアの 品は 店の 品`);
    const sum = Object.values(f.growth).reduce((s, v) => s + v, 0);
    assert.ok((sum >= 5.8 && sum <= 6.1) || (sum >= 6.8 && sum <= 7.3), `${sp}: growth ${sum.toFixed(2)}`);
    for (const [, id] of f.learn) assert.ok(ABILITIES[id] && !/^c8[gtdsr]/.test(ABILITIES[id].effect.type), `${sp}: ${id}`);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${sp}: ${a.id}`);
    if (MONSTER_ART[sp]) fresh++;
    else assert.ok(m.art && MONSTER_ART[m.art] && m.tint, `${sp}: 色がえ`);
    assert.equal(monsterFine(sp), 1, sp);
  }
  assert.equal(fresh, 3, '新しい 絵は 3しゅ まで');
  const ch8 = Object.keys(MONSTER_RANKS).filter((sp) => rankPoints(sp).band === '第8章');
  assert.ok(ch8.filter((sp) => ['B', 'A', 'S'].includes(MONSTER_RANKS[sp])).length <= Math.max(2, ch8.length * 0.2));
});

// ───────────── 門番（とちゅうで 終わる 戦い）─────────────
test('門番 第1形態: 6回 動くと 去る（勝ち）・HP 6わりで 去る（それより 下がらない）', () => {
  let b = battle('gate1');
  const g = b.enemies[0];
  assert.equal(g.c8g.form, 1);
  for (let i = 0; i < 6; i++) turn(b, g);
  assert.equal(g.telegraph, null);
  turn(b, g);
  assert.equal(g.telegraph, LEAVE);
  runTo(b, 20000);
  assert.equal(b.result.outcome, 'win');
  // HP
  b = battle('gate1');
  const g2 = b.enemies[0];
  const a = b.allies[0];
  hit(b, a, g2, g2.maxHp);
  assert.equal(g2.hp, Math.ceil(g2.maxHp * 0.6), 'HP は 6わりで 止まる');
  assert.equal(g2.telegraph, LEAVE);
  assert.equal(b.queue[0].id, g2.id, 'すぐ 去る');
  runTo(b, 20000);
  assert.equal(b.result.outcome, 'win');
  assert.ok(g2.hp > 0, 'のこりの HP は そのまま 見せる');
});

test('門番 第2形態: 見くだしの かまえ（受け流す）・ちがう 仲間 3人の つながる攻撃・合体技で くずれる・HP 半分で 去る', () => {
  const b = battle('gate2');
  const g = b.enemies[0];
  const [a, c, d] = b.allies;
  assert.ok(stanceUp(g));
  assert.equal(chainNeed(g.c8g, g), 3);
  const hp0 = g.hp;
  let ev = hit(b, a, g, 1000);
  assert.equal(hp0 - g.hp, 300, '受け流し（×0.3）');
  assert.ok(ev.c8gDefl && ev.postLines.join().includes('受け流した'));
  hit(b, a, g, 1000);
  assert.equal(g.c8g.chain, 1, 'おなじ 人は 数えない');
  hit(b, c, g, 1000);
  ev = hit(b, d, g, 1000);
  assert.ok(ev.c8gBreak && !stanceUp(g) && g.c8g.open === 2, 'くずれた');
  const hp1 = g.hp;
  hit(b, a, g, 1000);
  assert.equal(hp1 - g.hp, 1400, 'くずれた ときは ×1.4');
  // フリーゾンが 動くと つながりは とぎれる・2回 動くと かまえに もどる
  turn(b, g);
  assert.equal(g.c8g.chain, 0);
  turn(b, g);
  assert.ok(stanceUp(g));
  // 合体技は 1回で くずす
  ev = hit(b, a, g, 1000, { dual: { id: 'x', m: [a.id, c.id] } });
  assert.ok(ev.c8gBreak?.dual && !stanceUp(g));
  // HP 半分で 去る
  hit(b, a, g, g.maxHp);
  assert.equal(g.hp, Math.ceil(g.maxHp * 0.5));
  assert.equal(g.telegraph, LEAVE);
});

// ───────────── 門番の 本当の 戦い ─────────────
test('時の門番フリーゾン: 大玉を ためて いる 間に かまえを くずすと 消える・くずさないと みんなに 大技・最終形態（リオンの ことば）', () => {
  const b = battle('gate');
  const g = b.enemies[0];
  const gc = gateConf(g);
  assert.ok(MONSTERS[C8_GATEKEEPER].c8r.help);
  for (let i = 0; i < gc.orb.every; i++) turn(b, g);
  assert.ok(g.c8g.orb, 'ためた');
  // くずさない → 大玉
  let ev = turn(b, g);
  assert.equal(g.telegraph, ORB);
  g.telegraph = null;
  for (const x of b.allies) x.defending = x === b.allies[0];
  ev = effect(b, g, ORB);
  assert.ok(ev.c8gOrb && ev.results.filter((r) => r.dmg > 0).length >= 3);
  const dmg = (id) => ev.results.filter((r) => r.id === id).reduce((s, r) => s + r.dmg, 0);
  assert.ok(dmg(b.allies[0].id) < dmg(b.allies[1].id), '身を 守ると 小さい');
  // くずす → 消える（ためる ときは かまえなおす）
  for (const x of b.allies) Object.assign(x, { alive: true, hp: x.maxHp, defending: false });
  g.c8g.open = 2;
  for (let i = 0; i < gc.orb.every; i++) turn(b, g);
  assert.ok(g.c8g.orb && stanceUp(g), 'ためる ときは かまえなおす');
  const [a, c, d] = b.allies;
  hit(b, a, g, 100);
  hit(b, c, g, 100);
  hit(b, d, g, 100);
  assert.ok(g.c8g.orbBroken);
  turn(b, g);
  assert.equal(g.telegraph, ORBFAIL);
  g.telegraph = null;
  ev = effect(b, g, ORBFAIL);
  assert.ok(ev.c8gOrbFail && !g.c8g.orb);
  // 最終形態（HP 半分まで 下がらない → すぐ へんしん）
  hit(b, a, g, g.maxHp);
  assert.equal(g.hp, Math.ceil(g.maxHp * 0.5));
  assert.equal(g.telegraph, FINAL);
  g.telegraph = null;
  ev = effect(b, g, FINAL);
  assert.equal(g.c8g.form, 4);
  assert.ok(g.c8g.rion && chainNeed(g.c8g, g) === 3 && ev.postLines.join().includes('ひとりじゃない'));
  assert.equal(pub(g).gForm, 4, 'がめんに とどく しるし（gForm）');
  assert.ok(g.speed > 1 && g.atk > g.c8g.atk0);
  // こんどは たおせる（合体技で くずして）
  hit(b, a, g, g.hp * 4, { dual: { id: 'x', m: [a.id, c.id] } });
  assert.ok(!g.alive);
});

test('かけつけ: 戦いに 入りきらない 勇者が、ボスが 2回 動く ごとに 1人ずつ（出て いる ゲストは かけつけない）', () => {
  const rion = { char: { ...ch8Party('gate', 92)[0], id: 'g', name: 'リオン' }, kind: 'guest', auto: true };
  const b = battle('gate', { guest: rion });
  assert.deepEqual(b.c8help.list, ['karim', 'kai', 'minamo']);
  const g = b.enemies[0];
  const events = () => b.flush().filter((e) => e.c8rHelp);
  turn(b, g);
  assert.equal(events().length, 0);
  const ev = turn(b, g);
  const hs = events();
  assert.equal(hs.length, 1);
  assert.equal(hs[0].c8rHelp.who, 'karim');
  assert.ok(ev.extraLock > 0 && b.allies.every((x) => x.buffs.def));
  for (const id of ['kai', 'minamo']) assert.equal(doHelp(b, ev0()), id);
  for (const h of Object.values(HELPERS)) assert.ok(h.name && h.say && ['guard', 'power', 'heal', 'mp', 'hit'].includes(h.kind));
});

// ───────────── 心の ためし ─────────────
test('守りぬく: ともしび（動かない 味方）・やみの風は たおせない・夜明けで 勝ち・ともしびが 消えると 負け・ひとりなら 小おには 1ぴき', () => {
  let b = battle('guard');
  const t = torchOf(b);
  const w = windOf(b);
  assert.ok(t?.c8torch && t.side === 'ally' && t.alive && pub(t).mon === 'c8_torch');
  assert.equal(puffsAlive(b).length, 2);
  const ev = hit(b, b.allies[0], w, 5000);
  assert.equal(w.hp, w.maxHp, 'たおせない');
  assert.ok(ev.postLines.join().includes('たおせない'));
  // 大風（身を 守る 人が いると 半分）
  for (let i = 0; i < 2; i++) turn(b, w);
  turn(b, w);
  assert.equal(w.telegraph, 'm8t_gust');
  w.telegraph = null;
  const hp0 = t.hp;
  b.allies[0].defending = true;
  effect(b, w, 'm8t_gust');
  assert.equal(hp0 - t.hp, Math.round(windConf(w).torch.hp * windConf(w).gust.k * 0.5));
  // 夜明け
  b = battle('guard');
  const w2 = windOf(b);
  w2.c8w.acts = windConf(w2).winActs;
  turn(b, w2);
  assert.equal(w2.telegraph, 'm8t_dawn');
  runTo(b, 10000);
  assert.equal(b.result.outcome, 'win');
  // ともしびが 消えた
  b = battle('guard');
  const t3 = torchOf(b);
  const ev3 = { ...ev0(), id: b.enemies[1].id };
  b.damage(b.enemies[1], t3, 99999, ev3, { element: 'wind' });
  runTo(b, 5000);
  assert.equal(b.result.outcome, 'lose');
  // ひとり（魔法使いだけ）: 小おにが 1ぴき・ともしびが じょうぶ
  b = battle('guard', { solo: 'daikenja' });
  assert.equal(puffsAlive(b).length, 1);
  assert.ok(b.c8guard.few && torchOf(b).maxHp > windConf(windOf(b)).torch.hp);
});
const windConf = (m) => ({ ...MONSTERS[m.species].c8r, gust: { every: 3, k: 0.45, ...(MONSTERS[m.species].c8r.gust || {}) }, torch: { hp: 3200, def: 160, ...(MONSTERS[m.species].c8r.torch || {}) } });

test('一騎うち: リオン（いなければ ここで 作る）と 見くだす影・人の 家族が リオンを 動かす・ほかは おうえん（攻撃は おうえん〈力〉に）・ゆうきの一撃・リオンが たおれると 負け', () => {
  const party = ch8Party('duel', 90);
  const allies = party.map((c, i) => ({ char: c, kind: i ? 'support' : 'player', controller: i ? null : 'p1', auto: false }));
  const b = new Battle({ rng: makeRng(5), boss: true, canFlee: false, allies, enemies: [C8_SHADOW] });
  const r = rionOf(b);
  assert.ok(r && r.name === 'リオン' && r.kind === 'guest' && r.c8rion);
  assert.equal(r.controller, 'p1', 'さいしょの 人が リオンを 動かす');
  const fam = b.allies.filter((x) => x !== r);
  for (const x of fam) {
    assert.ok(x.c8cheer && pub(x).abilities.includes(CHEERS[0]));
    assert.deepEqual(x.abilities, CHEERS);
  }
  const sh = b.enemies[0];
  // 攻撃は おうえん（力）に
  const hp0 = sh.hp;
  let ev = hit(b, fam[0], sh, 3000);
  assert.equal(sh.hp, hp0);
  assert.ok(ev.c8dCheer && r.buffs.atk);
  // おうえん 3つ → ゆうきの一撃
  effect(b, fam[1], 'm8d_cheer_def');
  ev = effect(b, fam[2], 'm8d_cheer_heal');
  assert.ok(ev.c8dCheer.ready && b.c8duel.ready);
  ev = hit(b, r, sh, 1000);
  assert.equal(hp0 - sh.hp, Math.round(1000 * b.c8duel.power));
  assert.ok(ev.c8dStrike && !b.c8duel.ready);
  // 影の 技は リオンだけを ねらう
  const famHp = fam.map((x) => x.hp);
  for (let i = 0; i < 5; i++) {
    r.hp = r.maxHp;
    effect(b, sh, 'm8d_slash');
  }
  r.hp = r.maxHp;
  assert.deepEqual(fam.map((x) => x.hp), famHp);
  // オートの おうえんの 人は おうえん だけ
  b.knowsCh6 = false;
  assert.ok(CHEERS.includes(c8rPlan(b, fam[1], () => ({ type: 'attack' })).id));
  // リオンが たおれる → 負け
  const ev2 = { ...ev0(), id: sh.id };
  b.damage(sh, r, 99999, ev2, {});
  runTo(b, 5000);
  assert.equal(b.result.outcome, 'lose');
  // ひとりでも（リオンを 作る・影は 小さい）
  const solo = new Battle({ rng: makeRng(5), boss: true, canFlee: false, allies: [{ char: party[1], kind: 'player', controller: 'p1', auto: true }], enemies: [C8_SHADOW] });
  assert.ok(rionOf(solo) && solo.enemies[0].maxHp < MONSTERS[C8_SHADOW].hp);
});

// ───────────── ソリトゥス ─────────────
test('ソリトゥス ①: くらい心を まとう・ゆらいだら「よびかける」で はがれる・持ち主が 1回 手を かす・よびかけないと かたまる', () => {
  const b = battle('sol1');
  const s = solOf(b);
  const a = b.allies[0];
  assert.equal(s.c8s.stage, 1);
  assert.equal(pub(s).slStage, 1, 'がめんに とどく しるし（slStage）');
  for (const x of b.allies) assert.ok(x.abilities.includes(CALL), 'みんな よびかけられる');
  assert.equal(ABILITIES[CALL].noAuto, true);
  // まだ ゆらいで いない
  let ev = effect(b, a, CALL);
  assert.ok(ev.c8sCallMiss && s.c8s.heart === 0);
  // HP の さかいで ゆらぐ
  ev = hit(b, a, s, s.maxHp);
  assert.equal(s.hp, Math.ceil(s.maxHp * 0.75));
  assert.ok(ev.c8sWaver && s.c8s.waver);
  // よびかける → よくばりの心が はがれ、ジャハールが へびで しばる
  ev = effect(b, a, CALL);
  assert.equal(ev.c8sPeel.heart, 'greed');
  assert.ok(ev.postLines.join().includes('ジャハール') && s.c8s.bound === 1 && s.c8s.heart === 1);
  turn(b, s);
  assert.equal(s.telegraph, 'm8s_bound');
  s.telegraph = null;
  // いかり → ハデロス（力）・ひとりじめ → クッパード（こうら）
  for (const [who, check] of [['ハデロス', () => b.allies.every((x) => x.buffs.atk && x.buffs.mag)], ['クッパード', () => s.c8s.shell === 1]]) {
    hit(b, a, s, s.maxHp);
    ev = effect(b, a, CALL);
    assert.ok(ev.postLines.join().includes(who) && check(), who);
  }
  // こうら: 次の 攻撃を 1回 ふせぐ（この 番は こうらに はね返される）
  turn(b, s);
  assert.equal(s.telegraph, 'm8s_shell');
  s.telegraph = null;
  assert.ok(effect(b, s, 'm8s_shell').c8sShell && !s.c8s.shell);
  // よびかけないと かたまる（HP が もどる・強く なる）
  hit(b, a, s, s.maxHp);
  assert.ok(s.c8s.waver);
  turn(b, s);
  turn(b, s);
  assert.equal(s.telegraph, HARDEN);
  s.telegraph = null;
  const h0 = s.hp;
  ev = effect(b, s, HARDEN);
  assert.ok(ev.c8sHarden && s.hp > h0 && s.atk > s.c8s.atk0 && !s.c8s.waver);
  // さいごの 心（見くだす心）→ フリーゾン → ②へ
  hit(b, a, s, s.maxHp);
  ev = effect(b, a, CALL);
  assert.ok(ev.postLines.join().includes('フリーゾン'));
  assert.equal(s.c8s.stage, 2);
  assert.deepEqual(s.c8s.peeled, HEARTS);
});

test('ソリトゥス ②③: ひとりに する・よびかけで ③へ・段の 間で 記録（しるし c8s_p2・c8s_p3）・その 段から やり直す・千年の約束で しめくくる', () => {
  const marked = [];
  let b = battle('sol1', { hooks: { markFlag: (f) => marked.push(f) } });
  let s = solOf(b);
  const a = b.allies[0];
  // ① を おえる
  for (let i = 0; i < 4; i++) {
    hit(b, a, s, s.maxHp);
    effect(b, a, CALL);
  }
  assert.equal(s.c8s.stage, 2);
  assert.deepEqual(marked, ['c8s_p2']);
  assert.equal(s.maxHp, MONSTERS[C8_SOLITUS].c8r.stages[1]);
  assert.ok(b.allies.every((x) => x.alive && x.hp === x.maxHp), '段が かわると 回復');
  // ひとりに する（ひとりの 人が いる 間は かたい）
  turn(b, s);
  turn(b, s);
  assert.equal(s.telegraph, 'm8s_alone');
  s.telegraph = null;
  const ev = effect(b, s, 'm8s_alone');
  const lone = b.get(ev.c8sAlone.who);
  assert.equal(lone.status.rift.kind, 'alone');
  const hp0 = s.hp;
  hit(b, a === lone ? b.allies[1] : a, s, 1000);
  assert.equal(hp0 - s.hp, Math.round(1000 * MONSTERS[C8_SOLITUS].c8r.alone.cut));
  delete lone.status.rift;
  // HP 1 で 光が ゆらぐ → よびかける → ③
  hit(b, a, s, s.maxHp);
  assert.equal(s.hp, 1);
  assert.ok(s.c8s.waver);
  effect(b, a, CALL);
  assert.equal(s.c8s.stage, 3);
  assert.deepEqual(marked, ['c8s_p2', 'c8s_p3']);
  for (const x of b.allies) assert.ok(x.abilities.includes(PROMISE));
  // ③: 千年の約束で しか 0 に ならない
  hit(b, a, s, s.maxHp * 2);
  assert.equal(s.hp, 1);
  assert.ok(s.alive);
  let pe = effect(b, a, PROMISE);
  assert.ok(pe.lines.join().includes('たまっていない'));
  addGauge(s, PROMISE_MAX);
  b.allyActs = s.c8s.acts0;
  pe = effect(b, a, PROMISE);
  assert.ok(pe.c8sPromise && pe.lines.join().includes('4人目の紋章'));
  assert.ok(!s.alive);
  runTo(b, 10000);
  assert.equal(b.result.outcome, 'win');
  // やり直し: しるしが あれば その 段から
  b = battle('sol1', { flags: { c8s_p2: true } });
  assert.equal(solOf(b).c8s.stage, 2);
  b = battle('sol1', { flags: { c8s_p2: true, c8s_p3: true } });
  s = solOf(b);
  assert.equal(s.c8s.stage, 3);
  assert.equal(s.maxHp, MONSTERS[C8_SOLITUS].c8r.stages[2]);
  assert.equal(pub(s).slStage, 3);
});

// ───────────── 強さ（シミュレーター）─────────────
test('強さ: 知っている 人は 勝つ・完全オートは 勝てない（門番・ソリトゥスの 各だん。少しの 回数）', { timeout: 300000 }, () => {
  for (const boss of ['gate', 'sol1', 'sol2', 'sol3']) {
    const know = [1, 2, 3].map((seed) => ch8rRun(boss, CH8R_LV[boss], true, 8080 + seed * 7919));
    assert.ok(know.filter((r) => r.outcome === 'win').length >= 2, `${boss}: 知っている`);
    for (const r of know.filter((x) => x.outcome === 'win')) assert.ok(r.seconds <= 720, `${boss}: 長さ ${r.seconds}`);
    const auto = ch8rRun(boss, CH8R_LV[boss], false, 8080);
    assert.notEqual(auto.outcome, 'win', `${boss}: 完全オート`);
  }
  // 心の ためしは ひとりでも とける（魔法使い・勇者）
  for (const [boss, solo] of [['guard', 'daikenja'], ['duel', 'daikenja'], ['guard', 'hero'], ['duel', 'hero']]) {
    const res = [1, 2, 3].map((seed) => ch8rRun(boss, 90, true, 8080 + seed * 7919, { solo }));
    assert.ok(res.filter((r) => r.outcome === 'win').length >= 2, `${boss}: ${solo} ひとり`);
  }
  for (const boss of ['gate', 'sol1', 'guard']) for (const id of Object.values(CH8_KIT[boss]).flat()) assert.ok(!id || ITEMS[id], id);
});

// ───────────── 品 ─────────────
test('品: 時のはざまの 宝箱（階ごとに ★5 装備 1つ ＋ 素材か 道具）・ボスの 品・読みがな', () => {
  const floors = ['moon_1', 'moon_2', 'fire_1', 'fire_2', 'iron_1', 'iron_2', 'ice_1', 'ice_2', 'last_1', 'last_2', 'last_3'];
  assert.deepEqual(Object.keys(C8R_TREASURE), floors);
  for (const f of floors) {
    const [eq, mat] = C8R_TREASURE[f];
    const it = ITEMS[eq];
    assert.ok(it && ITEMS_C8R[eq] && it.src === 'c8r' && it.rank === 10 && it.rarity === 4, eq);
    assert.equal(rareWhereText(eq), '時のはざまの宝箱でしか手に入らない');
    assert.ok(ITEMS[mat] && !ITEMS_C8R[mat], mat);
    assert.equal(C8R_TREASURE_N[f].length, 2);
    assert.deepEqual(c8rChest(`c8r_${f}_now`, 0), { item: eq, n: 1 });
    assert.ok(!it.resist?.water, `${eq}: 水に 強く しない`);
  }
  assert.equal(c8rChest('c8r_hall', 0), null);
  assert.ok(Math.max(...Object.values(C8R_K)) <= 2.08);
  for (const [boss, [acc, weapon]] of Object.entries(C8R_DROPS)) {
    const m = MONSTERS[boss];
    assert.deepEqual(m.drops.boss, [acc]);
    assert.equal(m.drops.rare[0], weapon);
    assert.ok(ITEMS[acc].unique && ITEMS[acc].type === 'acc' && ITEMS[acc].src === 'pastboss' && ITEMS[acc].boss === boss);
    assert.equal(ITEMS[weapon].rarity, 5);
  }
  // 第2部の さいごの 品は 今の いちばん 強い 品を 大きく こえない
  const sum = (id) => Object.values(ITEMS[id].bonus).reduce((s, v) => s + v, 0);
  assert.ok(sum('c8s_promise_crest') > sum('c8g_gate_charm') && sum('c8g_gate_charm') > sum('c8w_king_charm'));
  assert.ok(sum('c8s_promise_crest') <= sum('c8w_king_charm') * 1.1);
  const topOld = (cat) => Math.max(...Object.entries(ITEMS).filter(([id, it]) => it.type === 'weapon' && it.cat === cat && !it.base && !id.includes('+') && !ITEMS_C8R[id] && it.rank === 10).map(([, it]) => it.atk));
  for (const id of Object.keys(ITEMS_C8R).filter((x) => ITEMS[x].type === 'weapon')) assert.ok(ITEMS[id].atk <= topOld(ITEMS[id].cat) * 1.1, `${id}: 大きく こえない`);
  for (const id of Object.keys(ITEMS_C8R)) assert.ok(ITEM_KANA[id] === C8R_ITEM_KANA[id] && /^[ぁ-んー]+$/.test(C8R_ITEM_KANA[id]), id);
  const names = new Map();
  for (const it of Object.values(ITEMS)) names.set(it.name, (names.get(it.name) || 0) + 1);
  for (const id of Object.keys(ITEMS_C8R)) assert.equal(names.get(ITEMS[id].name), 1, ITEMS[id].name);
});

test('負けた 時の ヒント: 第4幕の 戦いに 3つずつ（ぼんやり → はっきり）・ソリトゥスは 段ごと', () => {
  for (const id of [C8_GATEKEEPER, C8_TRIAL_GUARD, C8_TRIAL_DUEL, C8_SOLITUS]) {
    assert.equal(C8R_BOSS_HINTS[id].length, 3, id);
    for (const t of C8R_BOSS_HINTS[id]) assert.ok(t.length > 10 && t.length < 90 && !/ /.test(t), `${id}: ${t}`);
  }
  for (const n of [1, 2, 3]) assert.equal(C8R_SOLITUS_HINTS[n].length, 3);
  assert.equal(c8rBossHint(C8_SOLITUS, 2, { c8s_p2: true }), C8R_SOLITUS_HINTS[2][1]);
  assert.equal(c8rBossHint(C8_SOLITUS, 9, { c8s_p3: true }), C8R_SOLITUS_HINTS[3][2]);
  assert.equal(c8rBossHint(C8_GATEKEEPER, 1), C8R_BOSS_HINTS[C8_GATEKEEPER][0]);
  assert.equal(c8rBossHint('nai', 1), null);
});

// ───────────── 絵・背景・エフェクト・がめん ─────────────
const palCheck = (id, frames) => {
  const d = MONSTER_ART[id];
  assert.ok(d && typeof d.draw === 'function', id);
  assert.ok(d.size.every((v) => Number.isInteger(v) && v >= 20 && v <= 260), `${id}: size`);
  const pal = new Set(d.pal.map((c) => c.toLowerCase()));
  const shots = [];
  for (const f of frames) {
    const used = new Set();
    const pts = [];
    const g = {
      w: d.size[0], h: d.size[1], ell: (x, y, rx, ry, c) => { used.add(c); pts.push(x, y); }, poly: (p, c) => { used.add(c); pts.push(...p.flat()); },
      rect: (x, y, w, h, c) => { used.add(c); pts.push(x, y); }, line: (p, c) => { used.add(c); pts.push(...p.flat()); }, dot: (x, y, c) => used.add(c),
    };
    d.draw(g, f);
    for (const c of used) assert.ok(pal.has(c.toLowerCase()), `${id} f${f}: ${c}`);
    const out = pts.filter((v) => !(v >= -0.05 && v <= 1.05));
    assert.ok(!out.length, `${id} f${f}: はみださない ${out.slice(0, 4)}`);
    shots.push(JSON.stringify(pts));
  }
  return shots;
};
test('絵: 手下 3しゅ・門番 3まい（第3形態と 最終形態は コマ 0・1 と 2・3）・ソリトゥス（だんごとに コマ 0〜5）は 2倍の こまかさ', () => {
  for (const id of ['toki_moth', 'chikutaku_wani', 'sand_knight', C8_WIND]) {
    const [a, b] = palCheck(id, [0, 1]);
    assert.notEqual(a, b, `${id}: コマで うごく`);
  }
  for (const [id, n] of [[C8_GATE1, 2], [C8_GATE2, 2], [C8_GATEKEEPER, 4], [C8_SOLITUS, 6]]) {
    const shots = palCheck(id, [...Array(n).keys()]);
    assert.equal(new Set(shots).size, n, `${id}: コマが みんな ちがう`);
    assert.equal(MONSTERS[id].artScale, 0.5, id);
    assert.equal(monsterFine(id), 2, id);
    const [w, h] = monsterSize(id);
    assert.ok(w >= 96 && w <= 130 && h >= 96 && h <= 130, `${id}: 見た目 ${w}×${h}`);
  }
  // 見くだす影は 第1形態の え の かげ（色がえ。見た目は 第1形態と おなじ 大きさ）
  assert.ok(MONSTERS[C8_SHADOW].art === C8_GATE1 && MONSTERS[C8_SHADOW].tint && monsterSize(C8_SHADOW)[0] === 104);
  // へんしんの え（pub の gForm・slStage。client/battle-c8c.js の c8cSprite から）
  assert.equal(c8rSprite({ species: C8_GATEKEEPER, gForm: 3 }, 0), null);
  assert.equal(c8rSprite({ species: C8_SOLITUS, slStage: 1 }, 1), null);
  assert.equal(c8cSprite({ species: C8_GATE1 }, 0), null);
});

test('背景・エフェクト: 6つの 背景・技の anim は ぜんぶ ある・大技は がめんの まん中に 大きく・とくべつな つぶ', () => {
  for (const id of ['rift_wing', 'rift_last', 'rift_hall', 'rift_moon', 'rift_ice', 'rift_core']) assert.ok(battleBgSpec(id), id);
  const fx = new Proxy({}, { get: () => () => {} });
  const anims = [...new Set(Object.values(C8R_ABILITIES).map((a) => a.anim).filter((a) => a !== 'none'))];
  anims.push('c8r_help_guard', 'c8r_help_power', 'c8r_help_heal', 'c8r_help_mp', 'c8r_help_hit');
  for (const a of anims) {
    assert.equal(playC8rFx(fx, a, [{ x: 100, y: 60 }, { x: 140, y: 70 }], null, {}), true, a);
    assert.equal(playC8cFx(fx, a, [{ x: 100, y: 60 }], null, {}), true, `${a}: battlefx-c8c.js から とどく`);
  }
  assert.equal(playC8rFx(fx, 'slash_fast', [{ x: 1, y: 1 }], null), false);
  for (const a of [...C8R_SCREEN_ANIMS, ...Object.keys(C8R_ALLY_FX), ...Object.keys(C8R_SFX)]) assert.ok(anims.includes(a), a);
  for (const [k, v] of Object.entries(C8R_ALLY_FX)) assert.equal(CH4_ALLY_FX[k], v, k);
  const x = new Proxy({}, { get: (o, k) => (k in o ? o[k] : () => ({ addColorStop() {} })), set: (o, k, v) => { o[k] = v; return true; } });
  for (const t of [0, 0.3, 0.6, 0.99]) {
    C8R_FINE.c8rorb(x, { x: 100, y: 30, size: 20, age: t * 700 }, t);
    C8R_FINE.c8rcrest(x, { x: 100, y: 60, size: 7, n: 2, age: t * 1400 }, t);
  }
  assert.equal(C8C_FINE.c8rorb, C8R_FINE.c8rorb);
  // 技の せつめいは 1文めで わかる
  for (const [id, a] of Object.entries(C8R_ABILITIES)) {
    assert.ok(a.desc && firstSentence(a.desc).length <= 34, `${id}: ${firstSentence(a.desc)}`);
    assert.ok(a.cast, id);
  }
});

test('がめん: しるし・バナー・コマンド（よびかける・千年の約束・おうえん）', () => {
  for (const id of C8R_OWN_TELE) assert.ok(C8C_OWN_TELE.includes(id) && CH6_OWN_TELE.has(id), id);
  const drawn = [];
  const x = new Proxy({}, { get: (o, k) => (k in o ? o[k] : k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : (...args) => drawn.push(k)), set: (o, k, v) => { o[k] = v; return true; } });
  const torchAlly = { id: 'a9', side: 'ally', mon: 'c8_torch', alive: true, hp: 300, maxHp: 1000 };
  const scene = { time: 1000, c: new Map(), allies: () => [torchAlly], enemies: () => [] };
  for (const c of [
    { species: C8_GATEKEEPER, gForm: 3, stance: 1, need: 3, chain: 2, orbLeft: 2, orbEvery: 4 },
    { species: C8_GATEKEEPER, gForm: 4, open: 1, charge: 1 },
    { species: C8_WIND, dawnMax: 8, dawnLeft: 3, gustLeft: 1, gustEvery: 3 },
    { species: C8_SHADOW, bigLeft: 1, bigEvery: 3 },
    { species: C8_SOLITUS, slStage: 1, heart: 2, bigLeft: 2, bigEvery: 4, waver: 1, shell: 1, bound: 1 },
    { species: C8_SOLITUS, slStage: 2, heart: -1, tearLeft: 1 },
    { species: C8_SOLITUS, slStage: 3, heart: -1, crackLeft: 2, gauge: 100, gaugeMax: 100 },
  ]) {
    const n0 = drawn.length;
    c8rDraw(scene, x, null, { alive: true, ...c }, 80, 20, 100, 100, 1);
    assert.ok(drawn.length > n0, c.species);
  }
  const banners = [];
  const s2 = { game: { audio: { sfx() {} } }, banner: (t) => banners.push(t), shake() {}, c: new Map() };
  for (const ev of [{ c8gCharge: {} }, { c8gBreak: { chain: 3 } }, { c8gFinal: {} }, { c8gLeave: {} }, { c8tDawn: {} }, { c8dCheer: { ready: true } }, { c8sWaver: {} }, { c8sPeel: {} }, { c8sStage: { stage: 3 } }, { c8sPromise: {} }]) {
    const n0 = banners.length;
    c8rPresent(s2, ev, null, null, null);
    assert.ok(banners.length > n0, JSON.stringify(ev));
  }
  // コマンド
  const sol = { id: 'e1', species: C8_SOLITUS, alive: true, slStage: 1, waver: 1 };
  const sent = [];
  const sc = { enemies: () => [sol], send: (cmd) => sent.push(cmd) };
  const me = { id: 'a0', abilities: [CALL, PROMISE] };
  let r = c8rCmdItems(sc, me);
  assert.deepEqual(r.items.map((i) => i.value), ['c8rcall']);
  c8rCmdPick(sc, me, 'c8rcall');
  assert.deepEqual(sent.pop(), { type: 'ability', id: CALL, target: 'e1' });
  Object.assign(sol, { slStage: 3, waver: 0, gauge: 100, gaugeMax: 100 });
  r = c8rCmdItems(sc, me);
  assert.deepEqual(r.items.map((i) => i.value), ['c8rpromise']);
  r = c8rCmdItems({ enemies: () => [] }, { id: 'a1', abilities: CHEERS });
  assert.equal(r.items.length, 3);
  c8rCmdPick(sc, { id: 'a1' }, 'c8rcheer2');
  assert.deepEqual(sent.pop(), { type: 'ability', id: CHEERS[2], target: 'a1' });
});

test('文字: 子ども向けの 漢字・文の 中に 空白なし（kanji-check の gameFiles に 入って いる）', () => {
  const files = ['monsters-c8r', 'abilities-c8r', 'items-c8r', 'encounters-c8r', 'companions-c8r', 'boss-hints-c8r'].map((f) => `public/js/shared/data/${f}.js`).concat(['public/js/shared/battle-c8r.js', 'public/js/client/battle-c8r.js']);
  const all = gameFiles();
  for (const f of files) {
    const full = all.find((y) => y.endsWith(f));
    assert.ok(full, `${f} が gameFiles に ない`);
    assert.deepEqual(checkFile(full).filter((p) => !String(p.kind || p.type || '').startsWith('kana')), [], f);
  }
  void ORB; void MONSTERS_C8R; void C8R_HIDDEN;
});
