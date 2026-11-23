// 第103回 B班: 第3部 第3章 第3幕「はかりの回ろうと、ふたつの光」の 戦いと 品（docs/plan-part3-c11c.md の 19-4・19-5・19-6）
// 名前の 約束・回ろうの 魔物（トランプの へいたい）・バラバラン3号（3つの 体・こわした 所の 技が 出ない・あたまが 直す）・
// アルゴルにたのむ と 近衛の隊長エース（先に 見える カード・てらす・食べて もらう・へいたい）・自動の 仲間・人数合わせ（few・bare・solo）・
// 1回で たおされすぎない・完全オートで 勝てない・本物の 流れ（画面と 同じ 形の コマンド）・スピカの ごほうび・品・ヒント・
// もとの お話の 言葉と マークを 使わない・絵・背景・がめん（コマンドの 行き先）・文字
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ITEMS, ITEM_KANA, PART3_LATE_ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES, ZONE_BG } from '../public/js/shared/data/encounters.js';
import { monsterDrops, MAT_DROPS } from '../public/js/shared/data/loot.js';
import { MONSTER_FRIENDS } from '../public/js/shared/data/companions.js';
import { MONSTER_RANKS } from '../public/js/shared/data/monster-ranks.js';
import { rareWhereText } from '../public/js/shared/data/rare-loot.js';
import { BOSS_HINTS, BOSS_HINT_WHO } from '../public/js/shared/data/boss-hints.js';
import { mechBoss } from '../public/js/shared/ai.js';
import { GUEST_MAX_LEVEL } from '../public/js/shared/guest-rule.js';
import { C11C_B as C11C, C11C_MAP_B, C11C_BATTLE_B as C11C_BATTLE, C11C_MON_PREFIX_B, C11C_CHEST_IDS_B, C11C_CMD_B, C11C_TRACKS_B, C11C_OPEN_B } from '../public/js/shared/maps/c11c-flags.js';
import { C11B_B as C11B } from '../public/js/shared/maps/c11b-flags.js';
import { C10A_B as C10A } from '../public/js/shared/maps/c10a-flags.js';
import { C10B_B as C10B } from '../public/js/shared/maps/c10b-flags.js';
import { C10C_B as C10C } from '../public/js/shared/maps/c10c-flags.js';
import { C10D_B as C10D } from '../public/js/shared/maps/c10d-flags.js';
import {
  MONSTERS_C11C, C11C_HALL1_MON, C11C_HALL2_MON, C11C_HALL3_MON, C11C_MINIONS, C11C_CARD_MON, C11C_RECOLOR_BASE, C11C_NEW_ART, C11C_HEAD, C11C_ARM, C11C_LEG, C11C_PARTS,
  C11C_ACE, C11C_GUARD, MECHA_NAME, ACE_NAME, ACE_SHORT, GUARD_NAME, C11C_MAT_DROPS,
} from '../public/js/shared/data/monsters-c11c.js';
import { C11C_ABILITIES, TANOMU, LAY, CARD_IDS, FIX, ROCKET } from '../public/js/shared/data/abilities-c11c.js';
import { ENCOUNTERS_C11C, FIXED_C11C, ZONE_BG_C11C, C11C_ZONES } from '../public/js/shared/data/encounters-c11c.js';
import { FRIENDS_C11C } from '../public/js/shared/data/companions-c11c.js';
import { ITEMS_C11C, C11C_TREASURE, C11C_K, C11C_SHOP_K, C11C_GEAR_CHESTS, C11C_BACK_ADD, C11C_DROPS, c11cChest } from '../public/js/shared/data/items-c11c.js';
import { C11B_K, C11B_SHOP_K } from '../public/js/shared/data/items-c11b.js';
import { C11C_BOSS_HINTS, C11C_HINT_WHO } from '../public/js/shared/data/boss-hints-c11c.js';
import {
  c11cConf, c11cTell, c11cPub, c11cAllyPub, partsOf, partOf, aceOf, guardsOf, guardsUp, cardsLeft, nextCard, canEat, eatPick, mechaTarget, cardPub, c11cPlan, AUTO_EVERY, TWIN_HP,
} from '../public/js/shared/battle-c11c.js';
import { TERU } from '../public/js/shared/data/abilities-c9b.js';
import { c9Life, bestHit } from '../public/js/shared/battle-c9a.js';
import { partyNote } from '../public/js/shared/world/boss-hints.js';
import { ch9Run, ch9Party, LV9, CH9_KIT } from '../tools/sim-ch9.mjs';
import { CH11C_LV, CH10_NOTES } from '../tools/sim-ch11.mjs';
import { ORDER_FLAGS } from '../tools/sim-ch10.mjs';
import { canEquip } from '../public/js/shared/stats.js';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { playC11cFx } from '../public/js/client/render/battlefx-c11c.js';
import { playC8cFx } from '../public/js/client/render/battlefx-c8c.js';
import { battleBgSpec } from '../public/js/client/render/battlefx.js';
import { C11C_BG } from '../public/js/client/render/c11c-bg.js';
import {
  C11C_SCREEN_ANIMS, C11C_ALLY_FX, C11C_SFX, C11C_OWN_TELE, c11cHtml, c11cSprite, c11cPresent, c11cCmdItems, c11cCmdPick, c11cStatus, suitSvg, playCardSound,
} from '../public/js/client/battle-c11c.js';
import { c9bCmdItems } from '../public/js/client/battle-c9b.js';
import { CH4_ALLY_FX } from '../public/js/client/battle-ch4.js';
import { CH6_OWN_TELE } from '../public/js/client/battle-ch6.js';
import { allyAnimFor } from '../public/js/client/render/battlefx-r27.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';

const groupOf = (id) => FIXED_ENCOUNTERS[id].group.flatMap(([sp, n]) => Array(n).fill(sp));
const BASE_FLAGS = { c9_child: true, c9_act1: true, c9_song1: true };
const ALL8 = { ...BASE_FLAGS, [C10A.noteRe]: true, [C10A.noteFa]: true, [C10B.noteSo]: true, [C10B.noteLa]: true, [C10C.noteSi]: true, [C10D.noteDo]: true, [C11B.act1]: true, [C11C.act2]: true };
// kinds … 味方の 種類（'player' 家族の キャラ・'support' 酒場の 人・'monster' 魔物の 仲間）
function battle({ id = C11C_BATTLE.ace, kinds = ['player', 'player', 'player', 'player'], seed = 3, flags = ALL8, enemies = null, auto = true } = {}) {
  const key = id === C11C_BATTLE.mecha ? 'mecha' : 'ace';
  const four = ch9Party(key, CH11C_LV[key]);
  const allies = kinds.map((k, i) => ({ char: structuredClone(four[i % 4]), kind: k, controller: k === 'player' ? `sim${i}` : null, auto: k === 'player' ? auto : true, tactics: 'balanced' }));
  return new Battle({ rng: makeRng(seed), boss: !enemies, canFlee: !!enemies, allies, enemies: enemies || groupOf(id), hooks: { leaderFlag: (f) => !!flags[f] } });
}
const act = (b, a, cmd) => {
  b.queue.push({ id: a.id, cmd, last: true });
  a.queued = true;
  b.executeNext();
  return b.flush().filter((e) => e.t === 'act').pop();
};
const foe = (b, m, id = null) => {
  if (id) m.telegraph = id;
  b.queue.push({ id: m.id, cmd: { type: 'ai' }, last: true });
  m.queued = true;
  b.executeNext();
  return b.flush().filter((e) => e.t === 'act').pop();
};
const quiet = (m) => { m.actions = [{ w: 1, id: 'm_nothing' }]; };
const big = (b) => { for (const a of b.allies) { a.hp = a.maxHp = 99999; } };
const eat = (b, a, choice) => act(b, a, { type: 'ability', id: TANOMU, choice });
const allText = (ev) => [...(ev?.lines || []), ...(ev?.postLines || [])].join('\n');
// 隊長に カードを ならべさせる（へいたいの 数で まい数が かわる）
const lay = (b) => foe(b, aceOf(b));
// 2回めからの ならび（はじめの 1回めの ならびは おもて〈アルゴルが のぞく〉ので、うら向きを 見る テストは こちら）
const layBack = (b) => { b.c11c.lays = Math.max(1, b.c11c.lays); return lay(b); };

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（19-5）: フラグ・マップ・決まった 戦い・魔物の id・宝箱・コマンド・曲・幕の 切りかえ（かりの data/c11c-names-b.js）', () => {
  assert.deepEqual(C11C, {
    act2: 'c11_act2', start: 'c11c_start', mecha: 'c11c_mecha', join: 'c11c_join', h1: 'c11c_h1', h2: 'c11c_h2', rest: 'c11c_rest', h3: 'c11c_h3', ace: 'c11c_ace', act3: 'c11_act3',
  });
  assert.deepEqual(Object.values(C11C_MAP_B), ['c11c_hall1', 'c11c_hall2', 'c11c_hall3', 'c11c_rest', 'c11c_door']);
  assert.deepEqual(C11C_BATTLE, { mecha: 'c11c_mecha', ace: 'c11c_ace' });
  for (const sp of Object.keys(MONSTERS_C11C)) assert.ok(sp.startsWith(C11C_MON_PREFIX_B), sp);
  assert.deepEqual(C11C_CHEST_IDS_B, ['c11c_c1', 'c11c_c2', 'c11c_c3', 'c11c_c4', 'c11c_c5', 'c11c_c6', 'c11c_c7', 'c11c_c8']);
  assert.deepEqual(Object.keys(C11C_TREASURE).sort(), [...C11C_CHEST_IDS_B].sort());
  assert.equal(C11C_CMD_B, 'c11ceat');
  assert.equal(C11C_OPEN_B, 'PART3_C11C_OPEN');
  assert.deepEqual(Object.values(C11C_TRACKS_B), ['c11c_hall', 'c11c_rest', 'c11c_join', 'c11c_mecha', 'c11c_ace', 'c11c_door']);
  for (const id of Object.values(C11C_BATTLE)) {
    assert.ok(FIXED_C11C[id].boss && FIXED_C11C[id].canFlee === false && FIXED_ENCOUNTERS[id] === FIXED_C11C[id], id);
    assert.equal(FIXED_ENCOUNTERS[id].bgm, id, '曲は F班の id');
  }
  assert.deepEqual(groupOf(C11C_BATTLE.mecha), [C11C_ARM, C11C_HEAD, C11C_LEG], '3つの 体');
  assert.deepEqual(groupOf(C11C_BATTLE.ace), [C11C_GUARD, C11C_ACE, C11C_GUARD], '隊長と へいたい 2体');
  assert.deepEqual(C11C_ZONES, ['t11c_hall1', 't11c_hall2', 't11c_hall3']);
  for (const z of C11C_ZONES) { assert.equal(ENCOUNTER_TABLES[z], ENCOUNTERS_C11C[z]); assert.equal(ZONE_BG[z], ZONE_BG_C11C[z]); }
});

// ───────────── 回ろうの 魔物 ─────────────
test('回ろうの 魔物 7しゅ: Lv122〜124・仲間に なる・今の 素材・ランク・落とす 品・トランプの へいたい（月・星・ほうき星・太陽）・新しい 絵は 4しゅまで ＋ 色ちがい', () => {
  assert.equal(C11C_MINIONS.length, 7);
  const kinds = (z) => new Set(ENCOUNTERS_C11C[z].flatMap((r) => r.group.map((g) => g[0])));
  for (const sp of C11C_HALL1_MON) assert.ok(kinds('t11c_hall1').has(sp), sp);
  for (const sp of C11C_HALL2_MON) assert.ok(kinds('t11c_hall2').has(sp), sp);
  for (const sp of C11C_HALL3_MON) assert.ok(kinds('t11c_hall3').has(sp), sp);
  for (const sp of C11C_MINIONS) {
    const m = MONSTERS[sp];
    assert.ok(m.lv >= 122 && m.lv <= 124, `${sp} Lv${m.lv}`);
    assert.equal(m.region, 6, sp);
    assert.ok(!m.boss, sp);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${sp}: ${a.id}`);
    const list = monsterDrops(sp);
    assert.ok(list.find((d) => d.kind === 'common') && list.find((d) => d.kind === 'rare'), sp);
    assert.ok(ITEMS[C11C_MAT_DROPS[sp][0]], `${sp}: 素材`);
    assert.deepEqual(MAT_DROPS[sp], C11C_MAT_DROPS[sp]);
    const f = MONSTER_FRIENDS[sp];
    assert.ok(f && f === FRIENDS_C11C[sp] && f.noFamily, `${sp}: 仲間に なる`);
    assert.ok(f.rate >= 1 / 26 && f.rate <= 1 / 10, sp);
    for (const [, id] of f.learn) assert.ok(ABILITIES[id], `${sp}: ${id}`);
    const g = Object.values(f.growth).reduce((s, v) => s + v, 0);
    assert.ok((g >= 5.8 - 1e-9 && g <= 6.1 + 1e-9) || (g >= 6.8 - 1e-9 && g <= 7.3 + 1e-9), `${sp}: growth ${g}`);
    assert.ok(MONSTER_RANKS[sp], `${sp}: ランク`);
    assert.ok(MONSTER_ART[sp], `${sp}: え`);
  }
  assert.ok(C11C_NEW_ART.length <= 4, '新しい 絵は 4しゅまで');
  assert.equal(Object.keys(C11C_RECOLOR_BASE).length + C11C_NEW_ART.length, 7);
  for (const [sp, base] of Object.entries(C11C_RECOLOR_BASE)) assert.ok(MONSTER_ART[base] && MONSTER_ART[sp].tint && String(MONSTER_ART[sp].size) === String(MONSTER_ART[base].size), `${sp} は ${base} の 色ちがい`);
  // トランプの へいたい: マークは 月・星・ほうき星・太陽
  const names = C11C_CARD_MON.map((sp) => MONSTERS[sp].name);
  for (const w of ['つき', 'ほし', 'ほうきぼし', 'たいよう']) assert.ok(names.some((n) => n.startsWith(w) && n.includes('トランプへい')), w);
});

// ───────────── バラバラン3号 ─────────────
test('バラバラン3号: 3つの 体（あたま・うで・あし）・人が えらぶ 間は 待つ・あたまは かたい・こわした 所の 技が 出ない・3つ とも こわすと 勝ち', () => {
  assert.equal(MECHA_NAME, 'バラバラン3号');
  for (const sp of C11C_PARTS) assert.equal(MONSTERS[sp].lv, 123);
  const b = battle({ id: C11C_BATTLE.mecha });
  assert.ok(b.tellAll && b.mechBoss && mechBoss(b), 'しくみの ある ボス・人が えらぶ 間は 待つ');
  assert.ok(b.c9sp?.teru && b.c9sp?.song, 'スピカ（てらす・星のうた）');
  assert.equal(partsOf(b).length, 3);
  assert.equal(c11cTell(b), 'mecha');
  big(b);
  const [head, arm, leg] = ['head', 'arm', 'leg'].map((r) => partOf(b, r));
  for (const e of [head, arm, leg]) { e.hp = e.maxHp = 1e6; }
  const [hero] = b.allies;
  const hit = (t) => { const h0 = t.hp; act(b, hero, { type: 'attack', target: t.id }); return h0 - t.hp; };
  let dh = 0, da = 0;
  for (let i = 0; i < 6; i++) { dh += hit(head); da += hit(arm); }
  assert.ok(dh < da * 0.7, `あたまは かたい ${dh} / ${da}`);
  assert.equal(c11cConf(C11C_HEAD, b).hard, 0.5);
  // うでを こわす → うでは 動かない（ロケットパンチが 出ない）・3人組の 声
  arm.hp = 1;
  const ev = act(b, hero, { type: 'attack', target: arm.id });
  assert.ok(!arm.alive && ev.c11cBreak?.role === 'arm', JSON.stringify(ev.c11cBreak));
  assert.ok(allText(ev).includes('ロケットパンチが、出なくなった'), allText(ev));
  b.c11c.rocketReady = true;
  assert.notEqual(c11cTell(b), 'rocket', 'こわれた うでの 前ぶれは ない');
  // 3つ とも こわすと 勝ち（3人組が にげる）
  head.hp = 1; leg.hp = 1;
  act(b, hero, { type: 'attack', target: head.id });
  const ev2 = act(b, hero, { type: 'attack', target: leg.id });
  assert.ok(b.c11c.won && ev2.c11cMechaDown, '勝ち');
  assert.ok(allText(ev2).includes('キラジョ') && allText(ev2).includes('ボヤッチ') && allText(ev2).includes('ズラッカ'), '3人組の かけ声');
  for (let i = 0; i < 200 && !b.over; i++) b.tick(50);
  assert.equal(b.result.outcome, 'win');
});

test('バラバラン3号: うでは ロケットパンチの 前ぶれ（ねらいの 人）→ 次の うでの 番・防御で へる／あたまは 3回の 番ごとに こわれた 所を 直す（前ぶれ）・あたまを こわすと 直せない', () => {
  const b = battle({ id: C11C_BATTLE.mecha });
  big(b);
  const [head, arm, leg] = ['head', 'arm', 'leg'].map((r) => partOf(b, r));
  for (const e of [head, arm, leg]) quiet(e);
  // ロケットパンチの 前ぶれ（うでが 動く ごとに 数える）
  let up = null;
  for (let i = 0; i < 6 && !up; i++) { const ev = foe(b, arm); if (ev.c11cRocketUp) up = ev; }
  assert.ok(up, '前ぶれ');
  const aim = b.get(up.c11cRocketUp.aim);
  assert.equal(c11cTell(b), 'rocket');
  assert.equal(c11cPub(arm).rocket11c, aim.id);
  assert.equal(c11cAllyPub(aim).aimed11c, 2, 'ねらわれの しるし');
  assert.ok(allText(up).includes(aim.name));
  // ねらわれた 人は 身を 守る → 次の うでの 番に ロケットパンチ（防御で へる）
  act(b, aim, { type: 'defend' });
  const h0 = aim.hp;
  const ev = foe(b, arm);
  assert.ok(ev.c11cRocket?.guard && ev.c11cRocket.to === aim.id, JSON.stringify(ev.c11cRocket));
  const guarded = h0 - aim.hp;
  // 身を 守らないと 大きい
  b.c11c.rocketReady = true;
  b.c11c.rocketAim = aim.id;
  aim.defending = false;
  const h1 = aim.hp;
  foe(b, arm);
  assert.ok(h1 - aim.hp > guarded * 2, `${h1 - aim.hp} / ${guarded}`);
  // あしを こわす → あたまが 直す（前ぶれ → 次の あたまの 番）
  leg.hp = 1;
  act(b, b.allies[0], { type: 'attack', target: leg.id });
  assert.ok(!leg.alive);
  let fx = null;
  for (let i = 0; i < 6 && !fx; i++) { const e = foe(b, head); if (e.c11cFixUp) fx = e; }
  assert.ok(fx && c11cTell(b) === 'fix' && c11cPub(head).fix11c === 1, '直す 前ぶれ');
  const ev3 = foe(b, head);
  assert.ok(ev3.c11cFix && leg.alive && leg.hp === leg.maxHp, '直った');
  // あたまを こわすと 直せない
  leg.hp = 1;
  act(b, b.allies[0], { type: 'attack', target: leg.id });
  head.hp = 1;
  const ev4 = act(b, b.allies[0], { type: 'attack', target: head.id });
  assert.ok(!head.alive && allText(ev4).includes('もう、なおせない'));
  assert.ok(!leg.alive);
  assert.equal(c11cTell(b), 'mecha');
  // 知って いる 人の ねらい: あたま → うで → あし
  assert.equal(mechaTarget(b), arm);
});

// ───────────── アルゴルにたのむ と 近衛の隊長エース ─────────────
test('近衛の隊長エース: カードを ならべる（うら向き・へいたいが いると 1まい 多い）→ じゅんに めくって 使う・ほうき星の ねらいは ならべた 時に 決まる', () => {
  assert.equal(ACE_NAME, '近衛の隊長エース');
  assert.equal(MONSTERS[C11C_ACE].lv, 124);
  assert.equal(GUARD_NAME, 'トランプのへいたい');
  const b = battle();
  assert.ok(b.tellAll && b.mechBoss && mechBoss(b));
  assert.ok(b.allies.every((a) => a.abilities.includes(TANOMU)), 'だれでも たのめる');
  assert.ok(b.allies.every((a) => a.abilities.includes(TERU)), 'てらす');
  big(b);
  for (const g of guardsOf(b)) quiet(g);
  const ace = aceOf(b);
  assert.equal(c11cTell(b), 'ace');
  const ev = layBack(b);
  assert.ok(ev.c11cLay, 'ならべた');
  assert.equal(b.c11c.cards.length, 4, '3まい ＋ へいたいの 1まい');
  assert.ok(b.c11c.cards.every((k) => !k.up), 'うら向き');
  assert.ok(b.c11c.cards.some((k) => k.suit === 'comet'), 'ほうき星が 入る');
  assert.ok(b.c11c.cards.filter((k) => k.suit === 'comet').every((k) => k.aim), 'ほうき星の ねらい');
  assert.equal(c11cTell(b), 'cards');
  // 画面には うら向きの マークは 出さない
  assert.ok(c11cPub(ace).cards11c.every((k) => k.s === null && !k.up));
  assert.equal(c11cPub(ace).cards11c[0].next, 1, '次に めくる 1まい');
  // めくって 使う（1回の 番に 1まい）
  const first = nextCard(b);
  const ev2 = foe(b, ace);
  assert.ok(ev2.c11cFlip?.suit === first.suit && first.used, JSON.stringify(ev2.c11cFlip));
  assert.equal(cardsLeft(b).length, 3);
  // 使いきると、また ならべる
  for (let i = 0; i < 3; i++) foe(b, ace);
  assert.equal(cardsLeft(b).length, 0);
  assert.ok(foe(b, ace).c11cLay, 'また ならべる');
  // へいたいが いない 時は 3まい
  for (const g of guardsOf(b)) { g.hp = 1; act(b, b.allies[0], { type: 'attack', target: g.id }); }
  assert.equal(guardsUp(b).length, 0);
  b.c11c.cards = [];
  lay(b);
  assert.equal(b.c11c.cards.length, 3);
});

test('はじめの 1回めの ならびだけ おもて（アルゴルが のぞく。しくみを はじめて 見る 所）→ 2回めからは うら向き・ひとりの 時は いつも おもて（文が ぶつからない）', () => {
  const b = battle();
  big(b);
  for (const g of guardsOf(b)) quiet(g);
  const ace = aceOf(b);
  const ev = lay(b);
  assert.ok(ev.c11cLay?.up, 'はじめの ならびは おもて');
  assert.ok(b.c11c.cards.every((k) => k.up), 'ぜんぶ おもて');
  assert.ok(c11cPub(ace).cards11c.every((k) => k.s), '画面にも マーク');
  const tx = allText(ev);
  assert.ok(tx.includes('さいしょのカードは、のぞいてきた') && tx.includes('てらす'), tx);
  // 知って いる 人: 見えて いる ほうき星を すぐ たのめる
  const hero = b.allies[0];
  hero.knows9 = 'know';
  const p = c11cPlan(b, hero, () => ({ type: 'attack', target: ace.id }), bestHit);
  assert.ok(p?.id === TANOMU && b.c11c.cards.find((k) => k.no === p.choice).suit === 'comet', JSON.stringify(p));
  // 使いきると、2回めの ならびは うら向き
  while (cardsLeft(b).length) foe(b, ace);
  const ev2 = foe(b, ace);
  assert.ok(ev2.c11cLay && !ev2.c11cLay.up, '2回めは うら向き');
  assert.ok(b.c11c.cards.every((k) => !k.up));
  assert.ok(!allText(ev2).includes('のぞいてきた'), allText(ev2));
  // 3回めも うら向き
  while (cardsLeft(b).length) foe(b, ace);
  assert.ok(!foe(b, ace).c11cLay.up, '3回めも うら向き');
  // ひとり: いつも おもて（いつもの「…のぞいてきた。」だけ。はじめの 文は 出ない）
  const solo = battle({ kinds: ['player'] });
  big(solo);
  for (const g of guardsUp(solo)) quiet(g);
  const s1 = lay(solo);
  assert.ok(s1.c11cLay.up && allText(s1).includes('のぞいてきた') && !allText(s1).includes('さいしょ'), allText(s1));
  while (cardsLeft(solo).length) foe(solo, aceOf(solo));
  assert.ok(foe(solo, aceOf(solo)).c11cLay.up, 'ひとりは 2回めも おもて');
});

test('てらす で 全部 おもて・アルゴルにたのむ で えらんだ 1まいを 食べて もらう（その 技は 出ない）・ならびに つき 1まい・ほうき星は 防御で へる・月は 身を 守ると ねむらない・太陽は 回復', () => {
  const b = battle();
  big(b);
  for (const g of guardsOf(b)) quiet(g);
  const ace = aceOf(b);
  layBack(b);
  // スピカの てらす
  b.c9sp.teru.charge = b.c9sp.teru.max;
  const ev = act(b, b.allies[0], { type: 'ability', id: TERU });
  assert.ok(b.c11c.cards.every((k) => k.up), 'ぜんぶ おもて');
  assert.ok(allText(ev).includes('ぜんぶ見えた'), allText(ev));
  assert.ok(c11cPub(ace).cards11c.every((k) => k.s), '画面にも マーク');
  // ほうき星を えらんで たのむ
  const comet = b.c11c.cards.find((k) => k.suit === 'comet');
  assert.ok(canEat(b));
  assert.equal(eatPick(b), comet, 'いちばん こわい カード');
  const ev2 = eat(b, b.allies[1], comet.no);
  assert.ok(ev2.c11cEat?.ok && ev2.c11cEat.suit === 'comet' && comet.eaten, JSON.stringify(ev2.c11cEat));
  assert.ok(allText(ev2).includes('ぱくっ'));
  assert.equal(c11cPub(ace).cards11c.find((k) => k.no === comet.no).eaten, 1, '食べられた しるし');
  // ならびに つき 1まい
  assert.equal(canEat(b), false);
  const other = cardsLeft(b)[0];
  const ev3 = eat(b, b.allies[2], other.no);
  assert.ok(!ev3.c11cEat.ok && ev3.c11cEat.why === 'full' && !other.eaten, 'おなかいっぱい');
  // 食べた カードは 出ない（のこりを めくっても ほうき星は 来ない）
  const flips = [];
  while (cardsLeft(b).length) flips.push(foe(b, ace).c11cFlip?.suit);
  assert.ok(!flips.includes('comet') || b.c11c.cards.filter((k) => k.suit === 'comet').length > 1, JSON.stringify(flips));
  // ほうき星: 身を 守ると へる
  const cf = c11cConf(C11C_ACE, b);
  const t = b.allies[0];
  const dmgOf = (guard) => {
    b.c11c.cards = [{ no: 0, suit: 'comet', up: true, eaten: false, used: false, aim: t.id }];
    t.hp = t.maxHp;
    t.defending = guard;
    foe(b, ace);
    return t.maxHp - t.hp;
  };
  const g0 = dmgOf(true);
  const g1 = dmgOf(false);
  assert.ok(g0 < g1 * cf.comet.guardCut, `${g0} / ${g1}`);
  // 月: 身を 守って いない 人は ねむる
  b.c11c.cards = [{ no: 0, suit: 'moon', up: true, eaten: false, used: false, aim: null }];
  for (const a of b.allies) { a.status = {}; a.defending = false; }
  b.allies[0].defending = true;
  const ev4 = foe(b, ace);
  assert.ok(ev4.c11cFlip.suit === 'moon');
  assert.ok(!b.allies[0].status.sleep, '身を 守った 人は ねむらない');
  assert.ok(b.allies.slice(1).some((a) => a.status.sleep), 'ほかの 人は ねむる');
  // 太陽: 隊長と へいたいが 回復
  ace.hp = Math.round(ace.maxHp / 2);
  const hp0 = ace.hp;
  b.c11c.cards = [{ no: 0, suit: 'sun', up: true, eaten: false, used: false, aim: null }];
  foe(b, ace);
  assert.ok(ace.hp > hp0);
});

test('へいたい: 全体の 技は 受けにくい・たおしても 隊長が back 回 動くと もどる（1回 前に 前ぶれ）・ひとりの 時は へいたい 1体・カード 2まい／勝つと 隊長は たおれず カードに もどって ちらばる', () => {
  const b = battle();
  big(b);
  for (const g of guardsOf(b)) quiet(g);
  const ace = aceOf(b);
  const [g1] = guardsOf(b);
  // たおす → もどる
  g1.hp = 1;
  const ev = act(b, b.allies[0], { type: 'attack', target: g1.id });
  assert.ok(ev.c11cOut && !g1.alive);
  const back = c11cConf(C11C_ACE, b).back;
  let soon = false;
  for (let i = 0; i < back && !g1.alive; i++) { const e = foe(b, ace); if (e.c11cBackSoon) soon = true; }
  assert.ok(soon && g1.alive, 'もどる');
  // ひとり: へいたい 1体・カード 2まい（へいたいが いる 間は ＋1）・アルゴルが のぞいて おもて
  const solo = battle({ kinds: ['player'] });
  assert.equal(guardsUp(solo).length, 1);
  big(solo);
  for (const g of guardsUp(solo)) { g.alive = false; g.hp = 0; g.c11g.dead = true; g.c11g.left = 99; }
  lay(solo);
  assert.equal(solo.c11c.cards.length, 2);
  assert.ok(solo.c11c.cards.every((k) => k.up), 'ひとりの 時は おもて');
  // 勝つ: HP 1 で 止まる → ちらばる
  ace.hp = 3;
  const ev2 = act(b, b.allies[0], { type: 'attack', target: ace.id });
  assert.ok(b.c11c.won && ace.hp === 1 && ev2.c11cDown, JSON.stringify({ won: b.c11c.won, hp: ace.hp }));
  assert.ok(allText(ev2).includes('カードにもどって') || allText(ev2).includes('たくさんのカード'), allText(ev2));
  for (let i = 0; i < 200 && !b.over; i++) b.tick(50);
  assert.equal(b.result.outcome, 'win');
  assert.equal(c11cPub(ace).c11cDown, 1);
});

test('自動の 仲間: 人が えらんで いる 時だけ、まだ だれも たのんで いない ならびの 3回に 1回 たのむ（完全オートは たのまない）・知って いる 人は てらす → こわい カードを たのむ', () => {
  const b = battle({ kinds: ['player', 'support', 'support', 'support'], auto: false });
  big(b);
  for (const g of guardsOf(b)) quiet(g);
  lay(b);
  for (const k of b.c11c.cards) k.up = true;
  const sup = b.allies[1];
  const decide = () => ({ type: 'attack', target: aceOf(b).id });
  const picks = [1, 2, 3].map(() => c11cPlan(b, sup, decide, bestHit));
  assert.equal(picks.filter((p) => p?.id === TANOMU).length, 1, `3回に 1回 ${JSON.stringify(picks)}`);
  assert.equal(AUTO_EVERY, 3);
  // 完全オート（人が オート）は たのまない
  b.allies[0].auto = true;
  for (let i = 0; i < 6; i++) assert.equal(c11cPlan(b, sup, decide, bestHit), null);
  // 知って いる 人: うら向きが 3まい いじょう … てらす ／ 見える … ほうき星を たのむ
  const k = battle();
  big(k);
  layBack(k);
  const hero = k.allies[0];
  hero.knows9 = 'know';
  k.c9sp.teru.charge = k.c9sp.teru.max;
  assert.equal(c11cPlan(k, hero, decide, bestHit)?.id, TERU);
  for (const c of k.c11c.cards) c.up = true;
  const p = c11cPlan(k, hero, decide, bestHit);
  assert.ok(p?.id === TANOMU && k.c11c.cards.find((c) => c.no === p.choice).suit === 'comet', JSON.stringify(p));
});

// ───────────── 人数合わせ・1回で たおされすぎない ─────────────
test('人数で 合わせる: 家族の キャラの 数（few）・仲間なしの 2人・3人（bare）・ひとり（solo）。ゲストは 数えない・ふつうの 攻撃 1回は いちばん HPの 少ない 人の 最大HP を こえない', () => {
  for (const [id, sp] of [[C11C_BATTLE.ace, C11C_ACE], [C11C_BATTLE.mecha, C11C_HEAD]]) {
    const conf = MONSTERS[sp].c11c;
    const four = battle({ id });
    const two = battle({ id, kinds: ['player', 'player'] });
    const three = battle({ id, kinds: ['player', 'player', 'player'] });
    const k1 = battle({ id, kinds: ['player', 'support', 'support', 'support'] });
    const solo = battle({ id, kinds: ['player'] });
    assert.equal(c11cConf(sp, four).hp, conf.few.hp[3], id);
    assert.equal(c11cConf(sp, two).bare, 2);
    assert.equal(c11cConf(sp, two).hp, conf.bare.hp[0]);
    assert.equal(c11cConf(sp, three).hp, conf.bare.hp[1]);
    assert.equal(c11cConf(sp, k1).bare, 0, '自動の 仲間が いれば bare は きかない');
    assert.equal(c11cConf(sp, k1).hp, conf.few.hp[0]);
    assert.equal(c11cConf(sp, solo).hp, conf.solo.hp);
    const g = battle({ id, kinds: ['player', 'player'] });
    g.allies.push({ kind: 'guest', id: 'gx', alive: true });
    assert.equal(c11cConf(sp, g).bare, 2, 'ゲストは 数えない');
  }
  assert.equal(c11cConf(C11C_ACE, battle({ kinds: ['player'] })).cards, 2);
  assert.equal(c11cConf(C11C_ACE, battle({ kinds: ['player'] })).guards, 1);
  // 1回で たおされすぎない（人4人・人5人。ほうき星の カード・前ぶれの ある ロケットパンチは こえて よい）
  for (const kinds of [['player', 'player', 'player', 'player'], ['player', 'player', 'player', 'player', 'player']]) {
    for (const id of Object.values(C11C_BATTLE)) {
      const b = battle({ id, kinds });
      const minHp = Math.min(...b.allies.map((a) => a.maxHp));
      for (const e of b.enemies) {
        for (const x of e.actions) {
          const eff = x.id === 'attack' ? { type: 'phys', mult: 1 } : ABILITIES[x.id].effect;
          if (eff.type !== 'phys' || ABILITIES[x.id]?.target === 'enemies') continue;
          const worst = Math.max(...b.allies.map((t) => b.calcPhys(e, t, eff, 1, 'phys', true).dmg * (e.dmgRate > 0 ? e.dmgRate : 1)));
          assert.ok(worst <= minHp * 1.0, `${kinds.length}人 ${e.name} ${x.id}: ${Math.round(worst)} / ${minHp}`);
        }
      }
    }
  }
});

// ───────────── 強さ ─────────────
test('強さ: 知って いる 人は 勝てる（2秒と 5秒で 勝率が 同じ）・完全オートは 勝てない・人2人だけ・ひとりも 勝てる・かんたんな 人も たのむ（少しの 回数）', { timeout: 2400000 }, () => {
  assert.deepEqual(CH11C_LV, { mecha: 123, ace: 124 });
  assert.deepEqual(ORDER_FLAGS.c11c.ace, [...CH10_NOTES, C11B.act1, C11C.act2]);
  for (const key of ['mecha', 'ace']) {
    for (const [job, kit] of Object.entries(CH9_KIT[key])) for (const id of kit) if (id) assert.ok(canEquip(job, id), `${job}: ${id}`);
    const outs = {};
    for (const react of [2000, 5000]) {
      const know = [1, 2, 3, 4].map((s) => ch9Run(key, LV9[key], 'know', 9090 + s * 7919, { react, flags: ORDER_FLAGS.c11c[key] }));
      outs[react] = know.map((r) => r.outcome).join(',');
      assert.ok(know.filter((r) => r.outcome === 'win').length >= 2, `${key} ${react}: 知って いる 人 ${outs[react]}`);
    }
    assert.equal(outs[2000], outs[5000], `${key}: 2秒と 5秒で 同じ`);
    // 完全オート（隊長 5% いか・メカ 3わり いか。メカの 1人＋家族の 仲間3 は 3回に 1回まで）
    for (const party of ['p4', 'k1fam', 'solo']) {
      const auto = [1, 2, 3].map((s) => ch9Run(key, LV9[key], 'auto', 9090 + s * 7919, { party, flags: ORDER_FLAGS.c11c[key] }));
      const lim = key === 'mecha' && party === 'k1fam' ? 1 : 0;
      assert.ok(auto.filter((r) => r.outcome === 'win').length <= lim, `${key} ${party}: 完全オート ${auto.map((r) => r.outcome)}`);
    }
    for (const party of ['p2', 'solo']) {
      const know = [0, 1, 2, 3].map((s) => ch9Run(key, LV9[key], 'know', 9090 + s * 7919, { party, flags: ORDER_FLAGS.c11c[key] }));
      assert.ok(know.filter((r) => r.outcome === 'win').length >= 1, `${key} ${party} ${know.map((r) => r.outcome)}`);
    }
  }
  // かんたんな 人も「アルゴルにたのむ」を 2回 いじょう 使う・すぐ おわらない
  const easy = [0, 1, 2].map((s) => ch9Run('ace', LV9.ace, 'easy', 9090 + s * 7919, { flags: ORDER_FLAGS.c11c.ace }));
  for (const r of easy) assert.ok(r.aEat >= 2, `たのむ ${r.aEat}`);
  for (const r of easy.filter((x) => x.outcome === 'win')) assert.ok(r.seconds >= 150, `${r.seconds}秒`);
});

test('本物の 流れ（tools/real-boss.mjs）: メカ・隊長も 回る・画面と 同じ 形の コマンド（アルゴルにたのむ … choice つき）が はねかえされない・負けた 時の ヒント', { timeout: 600000 }, async () => {
  const { realRun, realSetup } = await import('../tools/real-boss.mjs');
  const prev = process.env.HUMAN;
  process.env.HUMAN = 'easy';
  try {
    const r = await realRun('ace', 'p2', 9090);
    assert.ok(['win', 'lose'].includes(r.outcome), r.outcome);
    assert.equal(r.rej, 0, 'はねかえされた コマンドが ない');
    assert.ok((r.sent[TANOMU] || 0) >= 1, JSON.stringify(r.sent));
    const k = await realRun('mecha', 'k1fam', 9090);
    assert.ok(['win', 'lose'].includes(k.outcome) && k.rej === 0);
  } finally {
    if (prev === undefined) delete process.env.HUMAN; else process.env.HUMAN = prev;
  }
  const { startFixedBattle } = await import('../public/js/shared/world/battles.js');
  const { tickN } = await import('./helpers.js');
  const { world, humans, lead } = await realSetup('ace', 'p2', 9191);
  let result = null;
  startFixedBattle(world, lead.s, humans.map((h) => h.s), C11C_BATTLE.ace).then((x) => { result = x; });
  const b = [...world.battles.values()][0].battle;
  assert.ok(b.c11c?.kind === 'ace');
  const me = b.allies.find((a) => a.controller === lead.s.id);
  for (let i = 0; i < 600 && !(me.ready && cardsLeft(b).length); i++) await tickN(world, 1);
  const k = cardsLeft(b)[cardsLeft(b).length - 1];
  const n0 = lead.msgs.length;
  lead.send({ t: 'battle', actor: me.id, cmd: { type: 'ability', id: TANOMU, choice: k.no } });
  assert.ok(!lead.msgs.slice(n0).some((m) => m.t === 'battleRej'), 'はねかえされない');
  for (let i = 0; i < 400 && !k.eaten; i++) await tickN(world, 1);
  assert.ok(k.eaten, 'えらんだ カードを 食べた');
  // 負け → ノクトの ヒント
  for (const a of b.allies) { a.hp = 0; a.alive = false; }
  b.checkEnd();
  for (let i = 0; i < 600 && !result; i++) await tickN(world, 1);
  assert.ok(result && b.result.outcome === 'lose', b.result?.outcome);
  const hint = lead.s.bossHint;
  assert.ok(hint && hint.id === C11C_BATTLE.ace && hint.n === 1 && hint.who === 'ノクト', JSON.stringify(hint));
  // 生き返らせの 数も 数えて いる（負けた 時の ひとこと）
  assert.ok(c9Life(b).died instanceof Set);
  assert.equal(typeof partyNote(C11C_BATTLE.ace, b.allies, b), 'string');
  for (const h of humans) h.send({ t: 'quit' });
});

// ───────────── スピカの ごほうび ─────────────
test('スピカの ごほうび: この 幕の クリア（c11_act3）で 技「ふたりの光」… 戦いで 1回だけ、HPが 半分より 少ない 仲間が 2人 いじょうの 時に みんなを 回復（前の ごほうびと 合わせて きく）・ゲストの 上限 124', () => {
  const ALL9 = { ...ALL8, [C11C.act3]: true };
  const plain = battle({ enemies: ['c11c_tmoon', 'c11c_tstar'], flags: ALL8 });
  const twin = battle({ enemies: ['c11c_tmoon', 'c11c_tstar'], flags: ALL9 });
  assert.ok(!plain.c11rew?.twin);
  assert.ok(twin.c11rew?.twin && twin.c11rew?.call && twin.c11rew?.star, '名前をよぶ声・ながれ星も きく');
  assert.ok(twin.c10rew?.glowStart, '前の ごほうびも きく');
  for (const e of twin.enemies) quiet(e);
  const [a0, a1] = twin.allies;
  a0.hp = Math.round(a0.maxHp * 0.2);
  a1.hp = Math.round(a1.maxHp * 0.2);
  let got = null;
  for (let i = 0; i < 4 && !got; i++) for (const a of twin.aliveAllies()) { const ev = act(twin, a, { type: 'defend' }); if (ev?.c11cTwin) { got = ev; break; } }
  assert.ok(got, 'ふたりの光');
  assert.ok(allText(got).includes('ふたりの光'));
  assert.ok(a0.hp >= Math.round(a0.maxHp * (0.2 + TWIN_HP)) - 200, `${a0.hp}`);
  // 1回だけ
  a0.hp = 1; a1.hp = 1;
  for (let i = 0; i < 3; i++) for (const a of twin.aliveAllies()) assert.ok(!act(twin, a, { type: 'defend' })?.c11cTwin, '2回めは ない');
  assert.equal(GUEST_MAX_LEVEL, 126); // 第104回 B班: 第4幕で 124 → 126
});

// ───────────── 品 ─────────────
test('品: 宝箱 8こ（★5 は 3つ k 2.50〜2.54・のこりは 素材か 道具）・うらの 町の 店に 幕の クリアで 足す 4つ（k 2.40〜2.42）・ボスの 品・武器は 作らない', () => {
  const step = 0.04;
  assert.deepEqual(Object.values(C11C_K), [2.5, 2.52, 2.54]);
  assert.ok(Math.abs(Math.min(...Object.values(C11C_K)) - Math.max(...Object.values(C11B_K))) < 1e-9);
  assert.ok(Math.abs(C11C_SHOP_K.lo - C11B_SHOP_K.lo - step) < 1e-9 && Math.abs(C11C_SHOP_K.hi - C11B_SHOP_K.hi - step) < 1e-9);
  assert.equal(C11C_GEAR_CHESTS.length, 3);
  for (const id of C11C_CHEST_IDS_B) {
    const c = c11cChest(id);
    assert.ok(c && ITEMS[c.item], id);
    const it = ITEMS[c.item];
    if (C11C_GEAR_CHESTS.includes(id)) {
      assert.ok(['armor', 'shield', 'head'].includes(it.type) && it.rarity === 4 && it.src === 'c11c', id);
      assert.equal(rareWhereText(c.item), 'はかりの回ろうの宝箱でしか手に入らない');
    } else assert.ok(it.type !== 'weapon' && !['armor', 'shield', 'head', 'acc'].includes(it.type), `${id}: 素材か 道具`);
  }
  assert.equal(c11cChest('nope'), null);
  assert.equal(C11C_BACK_ADD.length, 4);
  for (const id of C11C_BACK_ADD) {
    const it = ITEMS[id];
    assert.ok(it && it.price > 0 && it.rarity === 0 && it.rank === 10 && ['armor', 'shield', 'head'].includes(it.type), id);
  }
  // 前の 幕の 店より 1だん 上（同じ しゅるいで くらべる）
  assert.ok(ITEMS.c11cs_mail.def > ITEMS.c11bs_mail.def && ITEMS.c11cs_robe.def >= ITEMS.c11bs_robe.def && ITEMS.c11cs_shield.def >= ITEMS.c11bs_shield.def && ITEMS.c11cs_helm.def >= ITEMS.c11bs_helm.def);
  for (const it of Object.values(ITEMS_C11C)) assert.notEqual(it.type, 'weapon', '武器は 作らない');
  for (const id of Object.keys(ITEMS_C11C)) { assert.ok(PART3_LATE_ITEMS.has(id), id); assert.ok(ITEM_KANA[id], `${id} の 読みがな`); }
  assert.deepEqual(C11C_DROPS, { [C11C_HEAD]: ['c11cb_gear_badge'], [C11C_ACE]: ['c11cb_ace_cape'] });
  for (const [sp, [id]] of Object.entries(C11C_DROPS)) {
    const it = ITEMS[id];
    assert.ok(it.unique && it.type === 'acc' && it.src === 'pastboss' && it.boss === sp, id);
    const sum = Object.values(it.bonus).reduce((s, v) => s + v, 0);
    assert.ok(sum <= 287 && sum >= 280, `${id}: ${sum}`);
    assert.ok(monsterDrops(sp).some((d) => d.kind === 'boss' && d.item === id));
    assert.ok(!it.resist?.water, '水に 強い 装備は 作らない');
  }
  // メカの 体と へいたいも 同じ 品（1人 1つ）
  for (const sp of [C11C_ARM, C11C_LEG]) assert.ok(monsterDrops(sp).some((d) => d.kind === 'boss' && d.item === 'c11cb_gear_badge'), sp);
  assert.ok(monsterDrops(C11C_GUARD).some((d) => d.kind === 'boss' && d.item === 'c11cb_ace_cape'));
});

// ───────────── ヒント ─────────────
test('負けた 時の ヒント: 隊長は 3だん（文は 19-4 の まま）・メカは 2だん・言う 人は ノクト', () => {
  assert.deepEqual(C11C_BOSS_HINTS[C11C_BATTLE.ace], [
    '隊長は、次に使うわざのカードを、先にならべているぞ。',
    'スピカの『てらす』で、うら向きのカードが見える。こわいカードを、アルゴルに食べてもらえ。',
    '食べてもらえるのは、3まいにつき1まいだ。ほうき星か、月のカードをえらべ。星のカードは、ぼうぎょでうけろ。',
  ]);
  assert.equal(C11C_BOSS_HINTS[C11C_BATTLE.mecha].length, 2);
  for (const id of Object.values(C11C_BATTLE)) {
    assert.deepEqual(BOSS_HINTS[id], C11C_BOSS_HINTS[id]);
    assert.equal(BOSS_HINT_WHO[id], C11C_HINT_WHO);
    for (const t of BOSS_HINTS[id]) assert.ok(t.length <= 60, t);
  }
  assert.equal(C11C_HINT_WHO, 'ノクト');
});

// ───────────── もとの お話の 言葉と マーク ─────────────
test('もとの お話（トランプの へいたいの 本）の 言葉と マークを 使わない（「アリス」「ハートの女王」「首をはねよ」・ハート／スペード／ダイヤ／クラブ）・女王・ネタバレの 名前を 書かない', () => {
  const BAD = ['アリス', 'ありす', 'ハートの女王', '首をはねよ', '首を はねよ', 'はねよ', 'ハート', 'スペード', 'ダイヤ', 'クラブ', '♥', '♠', '♦', '♣', '♡', '♤', '♢', '♧'];
  const files = ['public/js/shared/data/monsters-c11c.js', 'public/js/shared/data/abilities-c11c.js', 'public/js/shared/data/items-c11c.js', 'public/js/shared/data/boss-hints-c11c.js',
    'public/js/shared/data/companions-c11c.js', 'public/js/shared/data/encounters-c11c.js', 'public/js/shared/battle-c11c.js', 'public/js/client/battle-c11c.js',
    'public/js/client/render/c11c-art.js', 'public/js/client/render/c11c-bg.js', 'public/js/client/render/battlefx-c11c.js'];
  for (const f of files) {
    const src = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8').split('\n').filter((l) => !l.trim().startsWith('//') || !/かかない|使わない|もとは/.test(l)).join('\n');
    for (const w of BAD) assert.ok(!src.includes(w), `${f}: ${w}`);
  }
  const texts = [MECHA_NAME, ACE_NAME, GUARD_NAME, ...Object.values(C11C_ABILITIES).flatMap((a) => [a.name, a.cast, a.desc]), ...Object.values(MONSTERS_C11C).flatMap((m) => [m.name, m.desc]), ...Object.values(ITEMS_C11C).flatMap((i) => [i.name, i.desc]), ...Object.values(C11C_BOSS_HINTS).flat()];
  for (const t of texts) for (const w of BAD) assert.ok(!String(t).includes(w), `${t}: ${w}`);
  // 女王の ことは 戦いの 文に 書かない・ネタバレの 名前も 出さない
  const battleSrc = ['public/js/shared/battle-c11c.js', 'public/js/client/battle-c11c.js'].map((f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')).join('\n');
  for (const w of ['女王', 'ソリトゥス', 'カイ「', 'カイは']) assert.ok(!battleSrc.includes(w), w);
  for (const t of texts) for (const w of ['女王', 'ソリトゥス']) assert.ok(!String(t).includes(w), `${t}: ${w}`);
  assert.equal(ACE_SHORT, 'エース');
});

// ───────────── 絵・背景・えんしゅつ ─────────────
test('絵: トランプの へいたい（マークちがい）・てんびんどり・ボス（メカの 体 3つ・隊長〈コマ 2・3 … ちらばる〉・へいたい）は 2倍の こまかさ・背景 3つ・えんしゅつ', () => {
  for (const sp of C11C_NEW_ART) {
    const d = MONSTER_ART[sp];
    assert.ok(d && !d.tint && d.size.every((v) => v >= 20 && v <= 72), sp);
    assert.ok(d.pal.every((c) => /^#[0-9a-f]{6}$/i.test(c)), `${sp}: pal`);
  }
  for (const sp of [...C11C_PARTS, C11C_ACE, C11C_GUARD]) {
    assert.ok(MONSTER_ART[sp]?.size[0] >= 80, sp);
    assert.equal(MONSTERS[sp].artScale, 0.5, sp);
  }
  assert.equal(c11cSprite({ species: C11C_ACE, alive: true }, 0), null, 'ふだんは ふつうの え');
  for (const bg of ['c11c_hall', 'c11c_tower', 'c11c_door']) {
    assert.ok(C11C_BG[bg], bg);
    assert.ok(battleBgSpec(bg)?.deco === bg, `${bg}: battlefx から とどく`);
  }
  assert.equal(FIXED_C11C[C11C_BATTLE.mecha].bg, 'c11c_tower');
  assert.equal(FIXED_C11C[C11C_BATTLE.ace].bg, 'c11c_door');
  const fx = new Proxy({}, { get: () => () => {} });
  const anims = [...new Set(Object.values(C11C_ABILITIES).map((a) => a.anim))];
  for (const a of anims) {
    assert.equal(playC11cFx(fx, a, [{ x: 100, y: 60 }, { x: 140, y: 70 }], null, {}), true, a);
    assert.equal(playC11cFx(fx, a, [], null, {}), true, `${a}: 的が ない 時も`);
    assert.equal(playC8cFx(fx, a, [{ x: 100, y: 60 }], null, {}), true, `${a}: battlefx-c8c.js から とどく`);
    assert.ok(C11C_SFX[a], `${a}: 音`);
  }
  for (const a of C11C_SCREEN_ANIMS) assert.ok(anims.includes(a), a);
  for (const [a, v] of Object.entries(C11C_ALLY_FX)) assert.equal(CH4_ALLY_FX[a], v, a);
  for (const sp of C11C_OWN_TELE) assert.ok(CH6_OWN_TELE.has(sp), `${sp}: 前ぶれの バナーを 自分で 出す`);
  assert.equal(allyAnimFor({ type: 'ability', types: ['c11cEat'] }) ?? 'buff', 'buff');
  for (const s of ['moon', 'star', 'comet', 'sun']) assert.ok(suitSvg(s).startsWith('<svg'), s);
  // カードを めくる 音（効果音の 道。tone が ない 時は cursor）
  const snd = [];
  playCardSound({ tone: (f) => snd.push(f) }, 2);
  playCardSound({ sfx: (id) => snd.push(id) }, 1);
  assert.deepEqual(snd, [1320, 990, 1320, 990, 'cursor']);
  // 技の 名前（カード・コマンド）
  assert.equal(ABILITIES[TANOMU].name, 'アルゴルにたのむ');
  assert.ok(ABILITIES[TANOMU].cmdOnly && ABILITIES[TANOMU].noAuto);
  for (const id of [LAY, FIX, ROCKET, ...Object.values(CARD_IDS)]) assert.ok(ABILITIES[id], id);
  // 技の 名前は ほかの 技と かぶらない
  const others = Object.entries(ABILITIES).filter(([id]) => !C11C_ABILITIES[id]).map(([, a]) => a.name);
  for (const [id, a] of Object.entries(C11C_ABILITIES)) {
    if (Object.values(CARD_IDS).includes(id)) continue;
    assert.ok(!others.includes(a.name), `${id}: ${a.name}`);
  }
});

// ───────────── がめん ─────────────
test('がめん: 上の まど（カード: うら向き・おもて・次・食べた・ほうき星の ねらい／メカの 体）・ねらわれの しるし・コマンド「アルゴルにたのむ」→ どのカード？（1回で 決定）・コマンドの 行き先', () => {
  const allies = [{ id: 'a0', name: 'ソラ', alive: true, abilities: [TANOMU] }, { id: 'a1', name: 'ミナ', alive: true }];
  const ace = {
    species: C11C_ACE, alive: true, eatOk11c: 1, guards11c: 2,
    cards11c: [{ no: 0, s: 'star', up: 1, eaten: 0, used: 1, next: 0 }, { no: 1, s: null, up: 0, eaten: 0, used: 0, next: 1 }, { no: 2, s: 'comet', up: 1, eaten: 0, used: 0, next: 0, aim: 'a1' }, { no: 3, s: 'moon', up: 1, eaten: 1, used: 0, next: 0 }],
  };
  const top = c11cHtml([ace, { species: C11C_GUARD, alive: true }, { species: C11C_GUARD, alive: false, back11c: 2 }], allies, 'a0');
  for (const w of ['隊長のカード', 'うら向き', 'ほうき星', '→ミナ', '食べた', 'class="c11c-card back next"', 'c11c-card used', 'もどるまで、あと2', 'アルゴル：食べられる']) assert.ok(top.html.includes(w), w);
  assert.ok(top.cls.includes('warn'), 'こわい カードが 見える');
  assert.ok(c11cHtml([{ ...ace, c11cDown: 1 }], allies).html.includes('ちらばった'));
  // メカの まど
  const parts = [{ species: C11C_HEAD, role11c: 'head', alive: true, fix11c: 1 }, { species: C11C_ARM, role11c: 'arm', alive: false }, { species: C11C_LEG, role11c: 'leg', alive: true }];
  const mt = c11cHtml(parts, allies, 'a0');
  assert.ok(mt.html.includes('バラバラン3号') && mt.html.includes('c11c-chip down') && mt.html.includes('なおそうとしている') && mt.cls.includes('warn'), mt.html);
  const rk = c11cHtml([{ species: C11C_HEAD, role11c: 'head', alive: true }, { species: C11C_ARM, role11c: 'arm', alive: true, rocket11c: 'a0' }], allies, 'a0');
  assert.ok(rk.html.includes('ねらいは、あなた'), rk.html);
  // バナー
  const banners = [];
  const sc2 = { banner: (t) => banners.push(t), _c11cBn: true, enemies: () => [ace], game: { audio: { sfx() {} } } };
  for (const e of [{ c11cEat: { ok: true, suit: 'comet', no: 2 } }, { c11cEat: { ok: false, why: 'full' } }, { c11cFlip: { suit: 'moon' } }, { c11cLay: { n: 4, up: false } }, { c11cBack: {} }, { c11cOut: { left: 0 } }, { c11cMechaDown: {} }, { c11cBreak: { role: 'head' } }, { c11cFix: {} }, { c11cFixUp: {} }, { c11cRocketUp: { aim: 'a1' } }, { c11cRocket: { guard: true } }, { c11cTwin: {} }, { c11cDown: {} }]) c11cPresent(sc2, e);
  for (const w of ['ほうき星のカードを食べた', 'おなかいっぱい', '月のカード', 'ならんだ', 'もどってきた', 'へいたいがいない', 'ばらばら', 'あたまをこわした', 'なおってしまった', 'なおそうと', 'ぐるぐる', 'こらえた', 'ふたりの光', 'ちらばった']) assert.ok(banners.some((t) => t.includes(w)), w);
  // ねらわれの しるし
  const kids = [];
  const parent = { querySelector: () => kids[0] || null };
  const name = { parentNode: parent, after: (el) => kids.push(el) };
  const fakeDoc = globalThis.document;
  globalThis.document = { createElement: () => ({ className: '', classList: { toggle() {} }, remove() { kids.length = 0; } }), getElementById: () => true, head: { append() {} } };
  try {
    c11cStatus({ name }, { alive: true, aimed11c: 2 });
    assert.equal(kids[0].textContent, 'ねらわれ！');
    c11cStatus({ name }, { alive: true, aimed11c: 0 });
    assert.equal(kids.length, 0);
  } finally {
    globalThis.document = fakeDoc;
  }
  // コマンド「アルゴルにたのむ」（いちばん 上）→ どのカード？（のこって いる カード。1回で 決定）
  const ci = c11cCmdItems({ enemies: () => [ace], allies: () => allies }, allies[0]);
  assert.ok(ci.items[0].html.includes('アルゴルにたのむ') && ci.items[0].html.includes('食べられる') && ci.items[0].value === C11C_CMD_B, JSON.stringify(ci.items));
  assert.ok(ci.info.includes('ほうき星'));
  const c9 = c9bCmdItems({ enemies: () => [ace], allies: () => allies, c9spica: null }, allies[0]);
  assert.equal(c9.items[0].value, 'c11ceat', 'いちばん 上');
  const sent = [];
  let menu = null;
  const sc = { enemies: () => [ace], allies: () => allies, send: (m) => sent.push(m), showMenu: (list, pick, cancel, title, detail, start, keep, tapConfirm) => { menu = { list, pick, cancel, title, tapConfirm }; }, openCommand() {} };
  assert.equal(c11cCmdPick(sc, allies[0], 'c11ceat'), true);
  assert.ok(menu.title.includes('どのカード'));
  assert.ok(!menu.tapConfirm, '1回で 決定');
  assert.deepEqual(menu.list.map((x) => x.value), [1, 2], 'のこって いる カードだけ（めくった・食べた カードは 出ない）');
  assert.ok(menu.list[0].label.includes('次にめくる') && menu.list[0].label.includes('うら向き') && menu.list[1].label.includes('ほうき星'));
  menu.pick(menu.list[1]);
  assert.deepEqual(sent, [{ type: 'ability', id: TANOMU, choice: 2 }]);
  assert.equal(c11cCmdPick(sc, allies[0], 'c11bcall'), false);
  // コマンドの 行き先（battle.js → c8r → c9a → c9b → c11c）
  const route = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.ok(/case 'c11bcall': case 'c11ceat':[^\n]*return c8rCmdPick\(this, a, it\.value\)/.test(route), 'battle.js の 行き先（c11bcall の すぐ あと）');
  assert.ok(route.includes("case 'c10bring': case 'c10cmove': return c8rCmdPick"), '前の 行の ならびは そのまま');
  for (const f of ['battle-c8r.js', 'battle-c9a.js']) assert.ok(readFileSync(new URL(`../public/js/client/${f}`, import.meta.url), 'utf8').includes("value === 'c11ceat'"), f);
  assert.ok(readFileSync(new URL('../public/js/client/battle-c9b.js', import.meta.url), 'utf8').includes("if (value === 'c11ceat') return c11cCmdPick(scene, a, value);"));
  // 画面へ: うら向きの マークは 出さない
  const b = battle();
  big(b);
  layBack(b);
  assert.ok(cardPub(b).every((k) => k.s === null));
});

test('文字: 子ども向けの 漢字・文の 中に 空白なし（kanji-check の gameFiles に 入って いる）', () => {
  const mine = [
    'public/js/shared/data/monsters-c11c.js', 'public/js/shared/data/abilities-c11c.js',
    'public/js/shared/data/encounters-c11c.js', 'public/js/shared/data/companions-c11c.js', 'public/js/shared/data/items-c11c.js', 'public/js/shared/data/boss-hints-c11c.js',
    'public/js/shared/battle-c11c.js', 'public/js/client/battle-c11c.js', 'public/js/client/render/c11c-art.js', 'public/js/client/render/c11c-bg.js', 'public/js/client/render/battlefx-c11c.js',
  ];
  const gf = gameFiles();
  for (const f of mine) {
    const g = gf.find((x) => x.replace(/\\/g, '/').endsWith(f));
    assert.ok(g, `${f} は gameFiles に ある`);
    assert.deepEqual(checkFile(g).filter((p) => p.kind !== 'kana'), [], f);
  }
});
