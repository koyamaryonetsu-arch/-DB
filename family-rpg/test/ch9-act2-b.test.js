// 第3部 第1章 第2幕「鉱山の底の先」B（戦いと 品）。docs/plan-part3.md の 10-3
// 名前の 約束・ふつうの 魔物 6しゅ・スピカの てらす（たまる・明るい 番・見えにくいを 消す）・
// ボス「デデドン大王」（皿を 見る → 食べる／こわすと しょんぼり／もどる・まっ暗と てらす・大ジャンプ・はこで 皿が へる・すわりこむ）・
// 人数で 合わせる・自動の 仲間・強さ（知って いれば 勝てる・完全オートは 勝てない）・品・ヒント・絵・がめん・字
// A の マップ・台本は まだ ないので、きまった 戦いは Battle を じかに 作って 動かす
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ITEMS, ITEM_KANA } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES, ZONE_BG } from '../public/js/shared/data/encounters.js';
import { MAT_DROPS } from '../public/js/shared/data/loot.js';
import { MONSTER_FRIENDS } from '../public/js/shared/data/companions.js';
import { MONSTER_RANKS } from '../public/js/shared/data/monster-ranks.js';
import { rareWhereText } from '../public/js/shared/data/rare-loot.js';
import { BOSS_HINTS, BOSS_HINT_WHO } from '../public/js/shared/data/boss-hints.js';
import { canEquip } from '../public/js/shared/stats.js';
import { C9B_ACT1, C9B_BOXES, C9B_BATTLE, C9B_BOSS_MON, C9B_MON_PREFIX, C9B_TABLE, C9B_TRACKS, UNDER_RAFT } from '../public/js/shared/maps/c9b-flags.js';
import {
  MONSTERS_C9B, C9B_MINIONS, C9B_UNDER_MON, C9B_HALL_MON, C9B_RECOLOR_BASE, C9B_HIDDEN, C9B_MAT_DROPS, C9B_DEDEDON, C9B_DISHES, C9B_DISH_IDS, C9B_MIMIZU, DEDEDON_NAME,
} from '../public/js/shared/data/monsters-c9b.js';
import { C9B_ABILITIES, TERU } from '../public/js/shared/data/abilities-c9b.js';
import { FRIENDS_C9B } from '../public/js/shared/data/companions-c9b.js';
import { ENCOUNTERS_C9B, FIXED_C9B, ZONE_BG_C9B } from '../public/js/shared/data/encounters-c9b.js';
import {
  ITEMS_C9B, C9B_TREASURE, C9B_CHEST_IDS, C9B_GEAR_CHESTS, c9bChest, C9B_DROPS, C9B_K, C9B_SHOP_K, C9B_SHOP_WEAPONS, C9B_SHOP_ARMOR, C9B_ITEM_KANA,
} from '../public/js/shared/data/items-c9b.js';
import { C9B_BOSS_HINTS, C9B_HINT_WHO } from '../public/js/shared/data/boss-hints-c9b.js';
import {
  WATCH, EAT, SULK, LIGHT, JUMPUP, JUMP, SOUP, TERU_MAX, AUTO_DISH_EVERY, kingConf, kingOf, dishesOf, aliveDishes, kingVisible, c9bEva, c9bTurnStart, c9bEffect, c9bPub, c9bPlan, kingPeople,
} from '../public/js/shared/battle-c9b.js';
import { c9aPlan, bestHit } from '../public/js/shared/battle-c9a.js';
import { C9A } from '../public/js/shared/maps/c9a-flags.js';
import { ch9Run, ch9Party, LV9, CH9_KIT } from '../tools/sim-ch9.mjs';
import { MONSTER_ART, monsterSize, monsterFine } from '../public/js/client/render/monsters.js';
import { playC9bFx } from '../public/js/client/render/battlefx-c9b.js';
import { playC8cFx } from '../public/js/client/render/battlefx-c8c.js';
import { battleBgSpec } from '../public/js/client/render/battlefx.js';
import { C9B_SCREEN_ANIMS, C9B_ALLY_FX, C9B_SFX, C9B_OWN_TELE, c9bDraw, c9bPresent, c9bSprite, c9bCmdItems, c9bCmdPick, teruText } from '../public/js/client/battle-c9b.js';
import { c9aCmdItems } from '../public/js/client/battle-c9a.js';
import { CH4_ALLY_FX } from '../public/js/client/battle-ch4.js';
import { CH6_OWN_TELE } from '../public/js/client/battle-ch6.js';
import { firstSentence } from '../public/js/client/ui/skillinfo.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';

const ev0 = () => ({ lines: [], upd: [], results: [] });
const groupOf = (id) => FIXED_ENCOUNTERS[id].group.flatMap(([sp, n]) => Array(n).fill(sp));
// kinds … 味方の 種類（'player' 家族の キャラ・'support' 酒場の 人・'monster' 魔物の 仲間）
function battle({ kinds = ['player', 'player', 'player', 'player'], flags = {}, seed = 3, enemies = null } = {}) {
  const four = ch9Party('king', LV9.king);
  const allies = kinds.map((k, i) => ({ char: structuredClone(four[i % 4]), kind: k, controller: k === 'player' ? 'sim' : null, auto: true, tactics: 'balanced' }));
  return new Battle({ rng: makeRng(seed), boss: !enemies, canFlee: !!enemies, allies, enemies: enemies || groupOf(C9B_BATTLE.king), hooks: { leaderFlag: (f) => !!flags[f] } });
}
// 味方が 1回ずつ 動く（ATB を まわさずに）
const act = (b, a, cmd) => {
  b.queue.push({ id: a.id, cmd, last: true });
  a.queued = true;
  b.executeNext();
  return b.flush().filter((e) => e.t === 'act').pop();
};
// みんなが 1回ずつ 身を 守る（スピカの 1つの 番）
const round = (b) => { let last; for (const a of b.aliveAllies()) last = act(b, a, { type: 'defend' }); return last; };
const kingTurn = (b) => { const ev = ev0(); c9bTurnStart(b, kingOf(b), ev, false); return ev; };
const eff = (b, c, id) => { const ev = ev0(); assert.ok(c9bEffect(b, c, ABILITIES[id], ABILITIES[id].effect, ev), id); return ev; };
// 大王の 番を 1回（前ぶれ → その 技）
function kingAct(b) {
  const k = kingOf(b);
  const ev = kingTurn(b);
  const tg = k.telegraph;
  if (tg) {
    k.telegraph = null;
    if (ABILITIES[tg].effect.type.startsWith('c9k')) Object.assign(ev, eff(b, k, tg), { tg });
    else ev.tg = tg;
  }
  return ev;
}

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（10-4）: 決まった 戦い c9b_king・c9b_guard1〜3・魔物の id・皿・出る 表・背景・曲・いかだ', () => {
  assert.deepEqual(Object.keys(FIXED_C9B).sort(), Object.values(C9B_BATTLE).sort());
  const king = FIXED_ENCOUNTERS[C9B_BATTLE.king];
  assert.deepEqual(king.group.map((g) => g[0]), [C9B_DEDEDON, C9B_DISHES.meat, C9B_DISHES.cake, C9B_DISHES.soup], '皿は べつの 的');
  assert.deepEqual(C9B_DISHES, { meat: 'c9b_dish_meat', cake: 'c9b_dish_cake', soup: 'c9b_dish_soup' });
  assert.ok(king.boss && king.canFlee === false && !king.loseOk);
  assert.equal(king.bgm, C9B_TRACKS.king);
  assert.equal(C9B_DEDEDON, C9B_BOSS_MON);
  assert.equal(C9B_MIMIZU, 'c9b_mimizu');
  for (const g of ['guard1', 'guard2', 'guard3']) assert.ok(FIXED_ENCOUNTERS[C9B_BATTLE[g]].group.every(([sp]) => C9B_HALL_MON.includes(sp)), g);
  for (const f of Object.values(FIXED_C9B)) assert.ok(battleBgSpec(f.bg), f.bg);
  for (const id of Object.keys(MONSTERS_C9B)) assert.ok(id.startsWith(C9B_MON_PREFIX), id);
  for (const id of Object.keys(C9B_HIDDEN)) assert.ok(id.startsWith(C9B_MON_PREFIX) && MONSTERS[id] && !Object.keys(MONSTERS).includes(id), `${id}: 図鑑に 出ない`);
  assert.deepEqual(Object.keys(ENCOUNTERS_C9B), Object.values(C9B_TABLE));
  for (const z of Object.keys(ENCOUNTERS_C9B)) {
    assert.ok(ENCOUNTER_TABLES[z], z);
    assert.equal(ZONE_BG[z], ZONE_BG_C9B[z]);
    assert.ok(battleBgSpec(ZONE_BG[z]), z);
  }
  assert.deepEqual(C9B_TRACKS, { under: 'c9b_under', village: 'c9b_village', hall: 'c9b_hall', king: 'c9b_king' });
  assert.equal(C9B_ACT1, 'c9_act1');
  assert.deepEqual(C9B_BOXES, ['c9_box1', 'c9_box2', 'c9_box3']);
  assert.equal(ITEMS[UNDER_RAFT]?.type, 'key');
  assert.equal(ITEMS[UNDER_RAFT].name, 'いかだ');
  // もとの 作品の 名前・せりふを そのまま 使わない
  assert.equal(DEDEDON_NAME, 'デデドン大王');
  const text = JSON.stringify([MONSTERS_C9B, C9B_HIDDEN, C9B_ABILITIES, ITEMS_C9B, C9B_BOSS_HINTS]);
  for (const w of ['デデデ', 'カービィ', 'ワドルディ', 'プププ', 'ハンマー']) assert.ok(!text.includes(w), w);
});

// ───────────── ふつうの 魔物 6しゅ ─────────────
test('ふつうの 魔物 6しゅ: 仲間に なる・今の 素材・出る 表・ランク・今 ある 系統・Lv（明るい 所 98〜99・暗い 所 100・やしき 99）・大ミミズは darkOnly', () => {
  assert.equal(C9B_MINIONS.length, 6);
  const races = new Set(Object.values(MONSTERS).filter((m) => !m.boss && !String(m.name).includes('皿')).map((m) => m.race));
  const names = Object.entries(MONSTERS).filter(([id]) => !MONSTERS_C9B[id]).map(([, m]) => m.name);
  for (const sp of C9B_MINIONS) {
    const m = MONSTERS[sp];
    assert.ok(m && !m.boss, sp);
    assert.ok(races.has(m.race), `${sp}: 今 ある 系統`);
    assert.ok(MONSTER_FRIENDS[sp] && FRIENDS_C9B[sp], `${sp}: 仲間に なる`);
    assert.ok(MAT_DROPS[sp] && ITEMS[MAT_DROPS[sp][0]]?.type === 'mat', `${sp}: 今の 素材`);
    assert.deepEqual(MAT_DROPS[sp], C9B_MAT_DROPS[sp]);
    assert.ok(MONSTER_RANKS[sp], `${sp}: ランク`);
    assert.ok(!names.includes(m.name), `${sp}: 名前が かぶらない`);
    assert.equal(m.region, 6);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${sp}: ${a.id}`);
    for (const [, id] of FRIENDS_C9B[sp].learn) assert.ok(ABILITIES[id], `${sp}: ${id}`);
    assert.ok(Object.values(ENCOUNTERS_C9B).some((t) => t.some((e) => e.group.some((g) => g[0] === sp))), `${sp}: 出る 表`);
  }
  for (const sp of C9B_UNDER_MON) assert.ok(MONSTERS[sp].lv >= 98 && MONSTERS[sp].lv <= 99, sp);
  for (const sp of C9B_HALL_MON) assert.equal(MONSTERS[sp].lv, 99, sp);
  assert.equal(MONSTERS[C9B_MIMIZU].lv, 100);
  assert.equal(MONSTERS[C9B_MIMIZU].darkOnly, true);
  assert.ok(MONSTERS[C9B_MIMIZU].c9b.hide > 0, '見えにくい');
  // B〜S は 2しゅ まで（第3部 第1章 ぜんぶで 2わり いか）
  const top = Object.entries(MONSTER_RANKS).filter(([id, r]) => id.startsWith('c9') && ['B', 'A', 'S'].includes(r));
  assert.ok(top.length <= 2, JSON.stringify(top));
});

// ───────────── スピカの てらす ─────────────
test('てらす: リーダーが c9_act1 を 持つと 出る・ほのかな光 4回で たまる・使うと 3回の 番の 間 明るい・大ミミズの「見えにくい」が 消える・オートは 使わない', () => {
  const off = battle({ enemies: [C9B_MIMIZU], flags: { [C9A.child]: true } });
  assert.ok(off.c9sp && !off.c9sp.teru, 'c9_act1 が ない ときは てらすは ない');
  const b = battle({ enemies: [C9B_MIMIZU], flags: { [C9A.child]: true, [C9B_ACT1]: true } });
  const t = b.c9sp.teru;
  assert.deepEqual(b.snapshot().spica.teru, { charge: 0, max: TERU_MAX, lit: 0 });
  assert.ok(b.allies.every((a) => a.abilities.includes(TERU)), 'だれでも えらべる');
  assert.equal(ABILITIES[TERU].noAuto, true, 'オートは 使わない');
  const mz = b.enemies[0];
  const [a0] = b.allies;
  assert.equal(c9bEva(b, a0, mz), MONSTERS[C9B_MIMIZU].c9b.hide, '暗い 所: 見えにくい');
  assert.equal(c9bPub(mz).hide9, 1);
  // まだ たまって いない
  let ev = act(b, a0, { type: 'ability', id: TERU });
  assert.ok(ev.lines.some((l) => l.includes('まだたまっていない')));
  while (t.charge < t.max) round(b);
  assert.equal(t.charge, TERU_MAX);
  ev = act(b, a0, { type: 'ability', id: TERU });
  assert.ok(ev.c9bTeru);
  assert.equal(t.charge, 0, 'その 人の 番を 使って、たまりは 0 に');
  assert.equal(t.lit, 3);
  assert.equal(c9bEva(b, a0, mz), 0, 'てらすと 見えにくいが 消える');
  assert.equal(c9bPub(mz).hide9, 0);
  // 3回の 番で 暗く もどる（てらした 番を ふくめて）
  for (let i = 0; i < 4 && t.lit > 0; i++) round(b);
  assert.equal(t.lit, 0);
  assert.ok(c9bEva(b, a0, mz) > 0);
  // ふつうの オート（家族の キャラ）は 使わない
  t.charge = t.max;
  assert.equal(c9aPlan(b, a0, () => ({ type: 'attack', target: mz.id })), null);
});

// ───────────── デデドン大王: 皿の しくみ ─────────────
test('大王: 3回 動くと 皿を じっと 見る（前ぶれに 皿の 名前）→ 次の 番で 食べる（にく・ケーキ・からいスープ）→ 3回 動くと 皿が もどる', () => {
  const b = battle();
  const k = kingOf(b);
  assert.equal(dishesOf(b).length, 3);
  assert.ok(b.c9sp && b.c9sp.teru, '大王の 戦いは スピカと てらすが かならず 出る');
  assert.ok(b.snapshot().spica.teru);
  // watch 回目で 見る（第101回 R1班: 4人は 3 → 2。人 1人ずつ べつの 手の 物さしで 合わせ直した。monsters-c9b.js の few.watch[3]）
  assert.equal(kingConf(k, b).watch, 2);
  assert.equal(kingAct(b).tg, undefined);
  k.c9k.jumpLeft = 99;
  const w = kingAct(b);
  assert.equal(w.tg, WATCH);
  assert.ok(w.c9kWatch?.dish);
  const d = b.get(k.c9k.watch);
  assert.ok(w.lines.some((l) => l.includes('じーっと見ている') && l.includes({ meat: 'にく', cake: 'ケーキ', soup: 'からいスープ' }[d.c9d.kind])), w.lines.join('/'));
  assert.equal(c9bPub(d).dishWatched, 1);
  assert.equal(c9bPub(k).kWatch, d.id);
  // 第92回 第2便（人が できる 動き）: 見てから 食べるまでに ふつうに 動く 回数（4人は 3回）
  assert.equal(k.c9k.wait, kingConf(k, b).wait);
  assert.equal(kingConf(k, b).wait, 3);
  for (let i = 0; i < 3; i++) assert.notEqual(kingAct(b).tg, EAT, `${i + 1}回目は ふつう`);
  // 次の 番で 食べる
  const atk0 = k.atk, hp0 = (k.hp = Math.round(k.maxHp * 0.6));
  const e = kingAct(b);
  assert.equal(e.tg, EAT);
  assert.ok(e.c9kEat);
  assert.equal(d.alive, false, '食べた 皿は なくなる');
  if (d.c9d.kind === 'meat') assert.ok(k.atk > atk0, 'にく: 攻撃が 強く なる');
  if (d.c9d.kind === 'cake') assert.ok(k.hp > hp0, 'ケーキ: 回復');
  if (d.c9d.kind === 'soup') assert.equal(k.telegraph, SOUP, 'からいスープ: 次に 炎');
  // 3つの 皿の 力を それぞれ たしかめる
  for (const kind of ['meat', 'cake', 'soup']) {
    const bb = battle({ seed: 5 });
    const kk = kingOf(bb);
    const dd = dishesOf(bb).find((x) => x.c9d.kind === kind);
    kk.c9k.watch = dd.id;
    kk.hp = Math.round(kk.maxHp * 0.6);
    const a1 = kk.atk, h1 = kk.hp;
    eff(bb, kk, EAT);
    if (kind === 'meat') assert.equal(kk.atk, Math.round(kk.c9k.atk0 * kingConf(kk, bb).meat.up));
    if (kind === 'cake') assert.equal(kk.hp - h1, Math.round(kk.maxHp * kingConf(kk, bb).cake));
    if (kind === 'soup') { assert.equal(kk.telegraph, SOUP); assert.equal(ABILITIES[SOUP].effect.element, 'fire'); assert.equal(ABILITIES[SOUP].target, 'enemies'); }
    void a1;
  }
  // 3回 動くと もどる
  k.telegraph = null;
  k.c9k.watchLeft = 99;
  for (let i = 0; i < 3; i++) kingTurn(b);
  assert.equal(d.alive, true, 'もぐら兵が 新しい 皿を 持って くる');
  assert.equal(d.hp, d.maxHp);
});

test('大王: 食べる 前に 見て いる 皿を こわすと 食べられず、1回 しょんぼり 休む。ほかの 皿を こわしても 止まらない', () => {
  const b = battle();
  const k = kingOf(b);
  k.c9k.watchLeft = 1;
  k.c9k.jumpLeft = 99;
  kingAct(b);
  const d = b.get(k.c9k.watch);
  const other = aliveDishes(b).find((x) => x !== d);
  // ほかの 皿を こわす
  let ev = ev0();
  b.kill(other, null, ev);
  assert.equal(ev.c9kBreak?.stop, false);
  assert.equal(k.c9k.watch, d.id, '見て いる 皿は そのまま');
  // 見て いる 皿を こわす
  ev = ev0();
  b.kill(d, null, ev);
  assert.equal(ev.c9kBreak?.stop, true);
  assert.ok((ev.postLines || []).some((l) => l.includes('取り上げた')));
  assert.equal(k.c9k.watch, null);
  const s = kingAct(b);
  assert.equal(s.tg, SULK, '食べられず しょんぼり');
  assert.ok(s.c9kSulk);
  assert.equal(k.c9k.eats, 0);
  // 本当の 戦いでも: 見て いる 皿を こわすと 食べられない（知って いる 人）
  const r = ch9Run('king', LV9.king, 'know', 9090 + 2 * 7919, { legacy: true });
  assert.ok(r.stops >= 1, `止め ${r.stops}`);
});

test('大王: HPが 半分を 切ると 明かりを 食べて まっ暗（見て いる 皿が 出ない）→ てらすで 3回の 番の 間 見える', () => {
  const b = battle();
  const k = kingOf(b);
  k.c9k.jumpLeft = 99;
  k.hp = Math.floor(k.maxHp * 0.49);
  const l = kingAct(b);
  assert.equal(l.tg, LIGHT);
  assert.ok(l.c9kDark && k.c9k.dark);
  assert.equal(c9bPub(k).kDark, 1);
  k.c9k.watchLeft = 1;
  const w = kingAct(b);
  assert.equal(w.tg, WATCH);
  assert.equal(w.c9kWatch.dish, null, 'まっ暗: どの 皿か 出ない');
  assert.ok(w.lines.some((l2) => l2.includes('何かを')));
  assert.equal(c9bPub(k).kWatch, '?');
  assert.ok(dishesOf(b).every((d) => c9bPub(d).dishWatched === 0 && c9bPub(d).dishDark === 1));
  assert.equal(kingVisible(b), false);
  // てらす
  b.c9sp.teru.charge = TERU_MAX;
  const ev = act(b, b.allies[0], { type: 'ability', id: TERU });
  assert.equal(ev.c9bTeru.watch, k.c9k.watch, 'てらすと 見て いる 皿が わかる');
  assert.equal(kingVisible(b), true);
  assert.equal(c9bPub(k).kWatch, k.c9k.watch);
  assert.equal(c9bPub(k).kLit, 1);
  assert.equal(c9bPub(b.get(k.c9k.watch)).dishWatched, 1);
  for (let i = 0; i < 4 && b.c9sp.teru.lit > 0; i++) round(b);
  assert.equal(kingVisible(b), false, '3回の 番で また 暗く なる');
});

test('大王: 大ジャンプ（前ぶれ → 次の 番に 全体へ 大きな ダメージ。身を 守ると へる）', () => {
  const b = battle({ seed: 11 });
  const k = kingOf(b);
  k.c9k.watchLeft = 99;
  k.c9k.jumpLeft = 1;
  const u = kingAct(b);
  assert.equal(u.tg, JUMPUP);
  assert.ok(u.c9kJumpUp && k.c9k.jumpReady);
  assert.equal(c9bPub(k).kJump, 1);
  const [a0, a1] = b.allies;
  a0.defending = true;
  a1.defending = false;
  a0.hp = a0.maxHp = 99999;
  a1.hp = a1.maxHp = 99999;
  a0.dfn = a1.dfn;
  const j = kingTurn(b);
  assert.equal(k.telegraph, JUMP);
  k.telegraph = null;
  const ev = eff(b, k, JUMP);
  assert.ok(ev.c9kJump);
  const dmg = (a) => 99999 - a.hp;
  assert.ok(dmg(a1) > 0 && dmg(a0) < dmg(a1) * 0.5, `守る ${dmg(a0)} / 守らない ${dmg(a1)}`);
  assert.equal(k.c9k.jumpReady, false);
  void j;
});

test('大王: 食料庫の はこ 1つに つき はじめの 皿が 1つ へる（3つで 皿なし）・あとで もぐら兵が 持って くる', () => {
  for (const n of [0, 1, 2, 3]) {
    const flags = Object.fromEntries(C9B_BOXES.slice(0, n).map((f) => [f, true]));
    const b = battle({ flags });
    assert.equal(aliveDishes(b).length, 3 - n, `はこ ${n}つ`);
    assert.equal(kingOf(b).c9k.boxes, n);
  }
  const b = battle({ flags: { c9_box1: true, c9_box2: true, c9_box3: true } });
  const k = kingOf(b);
  k.c9k.jumpLeft = 99;
  k.c9k.watchLeft = 1;
  const ev = kingAct(b);
  assert.notEqual(ev.tg, WATCH, '皿が ない ときは 見ない');
  for (let i = 0; i < kingConf(k, b).late; i++) kingTurn(b);
  assert.equal(aliveDishes(b).length, 3);
});

test('大王: たおれずに、HP 1 で おなかを 鳴らして すわりこむ（勝ち。経験値・落とし物は ふつう）', () => {
  const b = battle();
  const k = kingOf(b);
  const a = b.allies[0];
  k.hp = 10;
  const ev = ev0();
  b.damage(a, k, 99999, ev, {});
  assert.equal(k.hp, 1);
  assert.equal(k.c9k.down, true);
  assert.deepEqual(b.pendingEnd, { outcome: 'win' });
  assert.ok(b.killed.includes(C9B_DEDEDON));
  assert.ok(ev.c9kDown);
  assert.ok((ev.postLines || []).some((l) => l.includes('おなか')));
  assert.equal(c9bPub(k).kDown, 1);
  assert.deepEqual(MONSTERS[C9B_DEDEDON].drops.boss, [C9B_DROPS[C9B_DEDEDON][0]]);
});

// ───────────── 人数で 合わせる・自動の 仲間 ─────────────
test('人数で 合わせる: 家族の キャラの 数で 皿の HP・見る 間・大王の HP。仲間なしの ひとりは solo・魔物の 仲間は 半人ぶん', () => {
  const conf = MONSTERS[C9B_DEDEDON].c9b;
  const dishHp = (b) => dishesOf(b)[0].maxHp;
  const base = MONSTERS[C9B_DISHES.meat].hp;
  for (let n = 1; n <= 5; n++) {
    const kinds = [...Array(n).fill('player'), ...Array(Math.max(0, 4 - n)).fill('support')];
    const b = battle({ kinds });
    assert.equal(kingPeople(b), n);
    assert.equal(dishHp(b), Math.round(base * conf.few.dish[n - 1]), `${n}人: 皿の HP`);
    assert.equal(kingOf(b).c9k.watchLeft, conf.few.watch[n - 1], `${n}人: 見る 間`);
    assert.equal(kingOf(b).maxHp, Math.round(MONSTERS[C9B_DEDEDON].hp * conf.few.hp[n - 1]), `${n}人: 大王の HP`);
  }
  // 第101回 R1班: 仲間なしの 2人・3人（味方が みんな 家族の キャラ）は bare の 表（few より 先）
  for (const n of [2, 3]) {
    const b = battle({ kinds: Array(n).fill('player') });
    assert.equal(kingPeople(b), n);
    assert.equal(dishHp(b), Math.round(base * conf.bare.dish[n - 2]), `${n}人だけ: 皿の HP`);
    assert.equal(kingOf(b).c9k.watchLeft, conf.bare.watch[n - 2], `${n}人だけ: 見る 間`);
    assert.equal(kingOf(b).maxHp, Math.round(MONSTERS[C9B_DEDEDON].hp * conf.bare.hp[n - 2]), `${n}人だけ: 大王の HP`);
  }
  // 4人も 合わせ直した（第101回 R1班。前は dish・hp 1 … 人4人 知って いる 人 50%・勝つまで 9分）。1人めは もとの まま
  assert.equal(conf.few.dish[3], 0.8);
  // 2便: 人が えらぶ 間 ずっと 待つ 形（b.tellAll）で 長く なった ので HP 0.9 → 0.4・攻撃 0.85 → 1.9・大ジャンプ 5 → 4
  assert.equal(conf.few.hp[3], 0.4);
  assert.equal(conf.few.jump[3], 4);
  assert.deepEqual([conf.few.dish[0], conf.few.watch[0], conf.few.wait[0], conf.few.jump[0], conf.few.hp[0], conf.few.atk[0]], [0.45, 5, 3, 7, 0.55, 0.9]);
  // 2人めも もとの まま（1人＋魔物3 が 使う）
  assert.deepEqual([conf.few.dish[1], conf.few.watch[1], conf.few.wait[1], conf.few.jump[1], conf.few.hp[1], conf.few.atk[1]], [0.6, 4, 3, 6, 0.5, 1.2]);
  // 仲間なしの ひとり
  const solo = battle({ kinds: ['player'] });
  assert.equal(kingOf(solo).maxHp, Math.round(MONSTERS[C9B_DEDEDON].hp * conf.solo.hp));
  assert.equal(dishHp(solo), Math.round(base * conf.solo.dish));
  // 魔物の 仲間（半人ぶん。第92回 第2便で 1体ごとの 上げは 0 … 人が できる 動きでは 魔物の 仲間の 方が 長く かかる ため）
  const mon = battle({ kinds: ['player', 'monster', 'monster', 'monster'] });
  assert.equal(kingPeople(mon), 2);
  assert.equal(kingOf(mon).maxHp, Math.round(MONSTERS[C9B_DEDEDON].hp * conf.few.hp[1]));
});

test('自動の 仲間: 酒場の 人は 見えて いる 皿を 3回に 1回 ねらう（家族の キャラの オート・魔物の 仲間は ねらわない）', () => {
  const b = battle({ kinds: ['player', 'support', 'support', 'monster'] });
  const k = kingOf(b);
  const d = dishesOf(b)[0];
  k.c9k.watch = d.id;
  const decide = () => ({ type: 'attack', target: k.id });
  const [pl, s1, s2, mon] = b.allies;
  assert.equal(c9bPlan(b, pl, decide, bestHit), null, '家族の キャラの オート');
  assert.equal(c9bPlan(b, mon, decide, bestHit), null, '魔物の 仲間');
  const outs = [];
  for (let i = 0; i < AUTO_DISH_EVERY * 2; i++) outs.push(c9bPlan(b, i % 2 ? s1 : s2, decide, bestHit));
  const hits = outs.filter((c) => c && c.target === d.id);
  assert.equal(hits.length, 2, '3回に 1回');
  // まっ暗で 見えない ときは ねらわない
  k.c9k.dark = true;
  b.c9kAuto = AUTO_DISH_EVERY - 1;
  assert.equal(c9bPlan(b, s1, decide, bestHit), null);
});

// ───────────── 強さ ─────────────
test('強さ: 知って いる 人は 勝てる（えらぶのに 5びょう でも）・完全オートは 勝てない（大王。少しの 回数）', { timeout: 1500000 }, () => {
  // 第101回 R1班 2便: 人が えらぶ 間 ずっと 待つ 形（b.tellAll）に して 表を 合わせ直した ので、新しい 物さし（legacy なし）で 見る。
  //   前の 物さし（1つの 手）では 合体技が 出すぎて 勝つまで 3分 くらいに なる（長さの きまりに 合わない）。知って いる 人 3/6 → 4/6・5秒 2/4 → 3/4
  const know = [1, 2, 3, 4, 5, 6].map((s) => ch9Run('king', LV9.king, 'know', 9090 + s * 7919));
  assert.ok(know.filter((r) => r.outcome === 'win').length >= 4, `知って いる 人 ${know.map((r) => r.outcome).join(',')}`);
  const auto = [1, 2, 3, 4].map((s) => ch9Run('king', LV9.king, 'auto', 9090 + s * 7919));
  assert.equal(auto.filter((r) => r.outcome === 'win').length, 0, '完全オート');
  const wins = know.filter((r) => r.outcome === 'win');
  const sec = wins.reduce((s, r) => s + r.seconds, 0) / wins.length;
  assert.ok(sec >= 220 && sec <= 420, `長さ ${sec}秒`);
  assert.ok(know.some((r) => r.teru > 0), 'まっ暗で てらす');
  // 第92回 第3便: 前ぶれ（皿を 見る・大ジャンプ）の 間は えらぶ 人を 待つ ので、えらぶのに 5びょう かかる 人も 勝てる
  const slow = [1, 2, 3, 4].map((s) => ch9Run('king', LV9.king, 'know', 9090 + s * 7919, { react: 5000 }));
  assert.ok(slow.filter((r) => r.outcome === 'win').length >= 3, `5びょう ${slow.map((r) => r.outcome).join(',')}`);
  for (const [job, kit] of Object.entries(CH9_KIT.king)) for (const id of kit) if (id) assert.ok(canEquip(job, id), `${job}: ${id}`);
});

// ───────────── 品 ─────────────
test('品: 宝箱の id（10こ）・★5 は 4つ（k 2.14〜2.18）＋ 素材か 道具・店の 品（k 2.06〜2.08。8こ）・ボスの 品・いかだ・読みがな', () => {
  assert.deepEqual(C9B_CHEST_IDS, ['c9b_u1', 'c9b_u2', 'c9b_u3', 'c9b_u4', 'c9b_u5', 'c9b_u6', 'c9b_v1', 'c9b_h1', 'c9b_h2', 'c9b_h3']);
  assert.equal(C9B_GEAR_CHESTS.length, 4);
  for (const id of C9B_CHEST_IDS) {
    const c = c9bChest(id);
    const it = ITEMS[c.item];
    assert.ok(it && c.n >= 1, id);
    if (C9B_GEAR_CHESTS.includes(id)) {
      assert.ok(['weapon', 'armor', 'shield', 'head'].includes(it.type), id);
      assert.equal(it.rank, 10);
      assert.equal(it.rarity, 4);
      assert.equal(it.src, 'c9b');
    } else assert.ok(['mat', 'item'].includes(it.type) || it.type === 'consumable' || !['weapon', 'armor', 'shield', 'head', 'acc'].includes(it.type), `${id}: 素材か 道具`);
  }
  assert.equal(c9bChest('nope'), null);
  for (const k of Object.values(C9B_K)) assert.ok(k >= 2.14 && k <= 2.18, k);
  assert.equal(Math.min(...Object.values(C9B_K)), 2.14);
  assert.equal(Math.max(...Object.values(C9B_K)), 2.18);
  for (const k of Object.values(C9B_SHOP_K)) assert.ok(k >= 2.06 && k <= 2.08, k);
  const shop = [...C9B_SHOP_WEAPONS, ...C9B_SHOP_ARMOR];
  assert.ok(shop.length >= 6 && shop.length <= 8);
  for (const id of shop) assert.ok(ITEMS[id] && ITEMS[id].rarity === 0 && ITEMS[id].price > 0, id);
  for (const id of C9B_GEAR_CHESTS) assert.equal(rareWhereText(c9bChest(id).item), '鉱山の底の先の宝箱でしか手に入らない');
  // ボスの 品
  const [acc, wpn] = C9B_DROPS[C9B_DEDEDON];
  assert.equal(ITEMS[acc].type, 'acc');
  assert.equal(ITEMS[acc].unique, true);
  const sum = Object.values(ITEMS[acc].bonus).reduce((s, v) => s + v, 0);
  assert.ok(sum <= 287, `お守りの 合計 ${sum}`);
  assert.equal(ITEMS[wpn].type, 'weapon');
  assert.equal(ITEMS[wpn].rarity, 5);
  assert.deepEqual(MONSTERS[C9B_DEDEDON].drops.rare, [wpn, 1]);
  // 水に 強い 装備は 作らない
  for (const it of Object.values(ITEMS_C9B)) assert.ok(!it.resist?.water, it.name);
  for (const id of Object.keys(ITEMS_C9B)) assert.ok(ITEM_KANA[id] && C9B_ITEM_KANA[id], id);
  // 第1幕の ボスの 品（c9b_trio_badge など）と かさならない
  for (const id of Object.keys(ITEMS_C9B)) assert.ok(!['c9b_trio_badge', 'c9b_kirajo_fan', 'c9b_dawn_feather', 'c9b_owl_staff'].includes(id));
});

// ───────────── 負けた 時の ヒント ─────────────
test('負けた 時の ヒント: 3つ（ぼんやり → はっきり）・言う 人は ノクト・40字 くらい', () => {
  const h = C9B_BOSS_HINTS[C9B_BATTLE.king];
  assert.equal(h.length, 3);
  assert.deepEqual(BOSS_HINTS[C9B_BATTLE.king], h);
  assert.equal(BOSS_HINT_WHO[C9B_BATTLE.king], C9B_HINT_WHO);
  assert.equal(C9B_HINT_WHO, 'ノクト');
  for (const t of h) assert.ok(t.length <= 42, t);
  assert.ok(h[0].includes('皿'));
  assert.ok(h[1].includes('こわせ'));
  assert.ok(h[2].includes('てらし') && h[2].includes('防御'));
});

// ───────────── 絵 ─────────────
test('絵: 新しい 絵は 2つの かき方（大ミミズ・もぐら兵）・3しゅは 色ちがい・大王は 2倍の こまかさ（すわる コマ）・皿 3つ・背景 2つ', () => {
  const fresh = C9B_MINIONS.filter((sp) => MONSTER_ART[sp] && !MONSTER_ART[sp].base && !MONSTER_ART[sp].tint);
  assert.deepEqual(fresh, [C9B_MIMIZU, ...C9B_HALL_MON], '新しい 絵は 3しゅまで');
  for (const [sp, base] of Object.entries(C9B_RECOLOR_BASE)) {
    assert.ok(MONSTER_ART[base], base);
    assert.ok(MONSTER_ART[sp].tint, `${sp}: 色ちがい`);
    assert.deepEqual(MONSTER_ART[sp].size, MONSTER_ART[base].size);
  }
  const g = new Proxy({ w: 100, h: 100 }, { get: (o, k) => (k in o ? o[k] : () => {}) });
  for (const sp of [...C9B_MINIONS, C9B_DEDEDON, ...C9B_DISH_IDS]) {
    assert.ok(MONSTER_ART[sp], sp);
    for (const f of [0, 1]) MONSTER_ART[sp].draw(g, f);
  }
  for (const f of [2, 3]) MONSTER_ART[C9B_DEDEDON].draw(g, f);
  assert.equal(MONSTERS[C9B_DEDEDON].artScale, 0.5);
  assert.equal(monsterFine(C9B_DEDEDON), 2);
  assert.ok(MONSTER_ART[C9B_DEDEDON].size[0] >= 200);
  const [w, h] = monsterSize(C9B_DEDEDON);
  assert.ok(w >= 100 && w <= 130 && h >= 100 && h <= 130, `${w}×${h}`);
  assert.equal(c9bSprite({ species: C9B_DEDEDON, kDown: 0 }, 0), null);
  for (const id of ['c9b_under', 'c9b_feast']) assert.ok(battleBgSpec(id), id);
});

// ───────────── がめん ─────────────
test('がめん: てらすの たまりぐあい・コマンド「スピカ：てらす」（いちばん 上）・大王と 皿の しるし・まっ暗・バナー・えんしゅつ', () => {
  for (const id of C9B_OWN_TELE) assert.ok(CH6_OWN_TELE.has(id), id);
  assert.equal(teruText({ charge: 2, max: 4 }), 'てらす ◆◆◇◇');
  assert.equal(teruText({ charge: 4, max: 4 }), 'てらす OK');
  // コマンド: たまって いて、役に 立つ（まっ暗・見えにくい）とき だけ
  const me = { id: 'a0', abilities: [TERU] };
  const enemies = [{ alive: true, kDark: 1 }];
  const sc = { c9spica: { teru: { charge: 4, max: 4 } }, enemies: () => enemies, allies: () => [], sent: [], send(x) { this.sent.push(x); } };
  const items = c9aCmdItems(sc, me);
  assert.deepEqual(items.items.map((i) => i.value), ['c9bteru']);
  assert.ok(items.items[0].html.includes('スピカ：てらす'));
  assert.ok(items.info);
  sc.c9spica.teru.charge = 3;
  assert.deepEqual(c9bCmdItems(sc, me).items, []);
  sc.c9spica.teru.charge = 4;
  enemies[0].kDark = 0;
  assert.deepEqual(c9bCmdItems(sc, me).items, [], '役に 立たない ときは 出さない');
  assert.equal(c9bCmdPick(sc, me, 'c9bteru'), true);
  assert.deepEqual(sc.sent.pop(), { type: 'ability', id: TERU });
  assert.equal(c9bCmdPick(sc, me, 'other'), false);
  // え の しるし（大王・皿・見えにくい）が こわれない
  const x = new Proxy({}, { get: () => () => {}, set: () => true });
  for (const c of [
    { species: C9B_DEDEDON, alive: true, kWatchEvery: 3, kWatchLeft: 2 }, { species: C9B_DEDEDON, alive: true, kJump: 1 }, { species: C9B_DEDEDON, alive: true, kWatch: '?' },
    { species: C9B_DEDEDON, alive: true, kRest: 1 }, { alive: true, dish9: 'meat', dishWatched: 1 }, { alive: true, dish9: 'cake', dishDark: 1 }, { alive: true, hide9: 1 },
  ]) c9bDraw({ time: 0 }, x, null, c, 10, 10, 40, 40, 1);
  // バナー
  const banners = [];
  const scene = { game: { audio: { sfx() {} } }, banner: (t) => banners.push(t), shake() {}, c: { get: () => ({ name: 'にくの皿' }) } };
  c9bPresent(scene, { c9kWatch: { dish: 'e1', kind: 'meat' } });
  c9bPresent(scene, { c9kWatch: { dish: null, kind: null } });
  c9bPresent(scene, { c9kBreak: { stop: true } });
  c9bPresent(scene, { c9kDark: {} });
  c9bPresent(scene, { c9kJumpUp: {} });
  c9bPresent(scene, { c9kDown: {} });
  assert.ok(banners.some((t) => t.includes('にく')));
  assert.ok(banners.some((t) => t.includes('てらし')));
  assert.ok(banners.some((t) => t.includes('しょんぼり')));
  assert.ok(banners.some((t) => t.includes('防御')));
  assert.ok(banners.some((t) => t.includes('すわりこんだ')));
  // えんしゅつ: 技の anim は ぜんぶ ある（battlefx-c8c.js から とどく）・大きく 出す 技・味方の まど・音
  const fx = new Proxy({}, { get: () => () => {} });
  const anims = [...new Set(Object.values(C9B_ABILITIES).map((a) => a.anim))];
  for (const a of anims) {
    assert.equal(playC9bFx(fx, a, [{ x: 100, y: 60 }, { x: 140, y: 70 }], null, {}), true, a);
    assert.equal(playC8cFx(fx, a, [{ x: 100, y: 60 }], null, {}), true, `${a}: battlefx-c8c.js から とどく`);
  }
  for (const a of [...C9B_SCREEN_ANIMS, ...Object.keys(C9B_ALLY_FX), ...Object.keys(C9B_SFX)]) assert.ok(anims.includes(a), a);
  for (const [k, v] of Object.entries(C9B_ALLY_FX)) assert.equal(CH4_ALLY_FX[k], v, k);
  // 技の 説明は はじめの 文で わかる
  for (const a of Object.values(C9B_ABILITIES)) assert.ok(firstSentence(a.desc).length >= 6 && firstSentence(a.desc).length <= 40, a.name);
});

// ───────────── 字 ─────────────
test('文字: 子ども向けの 漢字・文の 中に 空白なし（kanji-check の gameFiles に 入って いる）', () => {
  const mine = [
    'public/js/shared/data/monsters-c9b.js', 'public/js/shared/data/abilities-c9b.js', 'public/js/shared/data/encounters-c9b.js',
    'public/js/shared/data/companions-c9b.js', 'public/js/shared/data/items-c9b.js', 'public/js/shared/data/boss-hints-c9b.js', 'public/js/shared/battle-c9b.js',
    'public/js/client/battle-c9b.js', 'public/js/client/render/c9b-art.js', 'public/js/client/render/c9b-bg.js', 'public/js/client/render/battlefx-c9b.js',
  ];
  const gf = gameFiles();
  for (const f of mine) {
    const g = gf.find((x) => x.replace(/\\/g, '/').endsWith(f));
    assert.ok(g, `${f} は gameFiles に ある`);
    assert.deepEqual(checkFile(g).filter((p) => p.kind !== 'kana'), [], f);
  }
});
