// 第104回 B班: 第3部 第3章 第4幕「かがやきの女王と、八つめの音」の 戦いと 品（docs/plan-part3-c11d.md の 20-5・20-6・20-7）
// 名前の 約束・塔の 魔物・鏡と月の使い（前に 出て いる 方の しくみだけ・音を鳴らす／よびかける は 今 ある コマンド）・
// 手をつなぐ と かがやきの女王ポラリス（輪・光の はかり・かがやき・八つめの 音の 場面〈1度だけ〉・八つの音）・自動の 仲間・人数合わせ（few・bare・solo）・
// 1回で たおされすぎない・完全オートで 勝てない・本物の 流れ（画面と 同じ 形の コマンド）・スピカの さいごの ごほうび・品・ヒント・
// 物語の きまり（カイ・ソリトゥス・ひみつを 書かない・女王を 悪者に しない）・絵・背景・がめん（コマンドの 行き先）・文字
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
import {
  C11D_B as C11D, C11D_MAP_B, C11D_BATTLE_B as C11D_BATTLE, C11D_MON_PREFIX_B, C11D_CHEST_IDS_B, C11D_CMD_B, C11D_TRACKS_B, C11D_OPEN_B, C11D_KEYS_B, C11D_EIGHT_SCENE_B,
} from '../public/js/shared/data/c11d-names-b.js';
import { C11C_B as C11C } from '../public/js/shared/maps/c11c-flags.js';
import { C11B_B as C11B } from '../public/js/shared/maps/c11b-flags.js';
import { C10A_B as C10A } from '../public/js/shared/maps/c10a-flags.js';
import { C10B_B as C10B } from '../public/js/shared/maps/c10b-flags.js';
import { C10C_B as C10C } from '../public/js/shared/maps/c10c-flags.js';
import { C10D_B as C10D } from '../public/js/shared/maps/c10d-flags.js';
import {
  MONSTERS_C11D, C11D_TOWER1_MON, C11D_TOWER2_MON, C11D_TOWER3_MON, C11D_MINIONS, C11D_RECOLOR_BASE, C11D_NEW_ART, C11D_MIRROR, C11D_MOON, C11D_QUEEN,
  QUEEN_NAME, QUEEN_SHORT, MIRROR_SHORT, MOON_SHORT, DUO_NAME, C11D_MAT_DROPS, C11D_DUO_ART,
} from '../public/js/shared/data/monsters-c11d.js';
import { C11D_ABILITIES, HOLD, EIGHT, ROBE, STRIKE, RAIN, MEASURE, SHINE, NAMES, SCENE, EIGHT_SONG_NAME } from '../public/js/shared/data/abilities-c11d.js';
import { ENCOUNTERS_C11D, FIXED_C11D, ZONE_BG_C11D, C11D_ZONES } from '../public/js/shared/data/encounters-c11d.js';
import { FRIENDS_C11D } from '../public/js/shared/data/companions-c11d.js';
import { ITEMS_C11D, C11D_TREASURE, C11D_K, C11D_SHOP_K, C11D_GEAR_CHESTS, C11D_FRONT_ADD, C11D_DROPS, C11D_BEST, NOTE_EIGHT, c11dChest } from '../public/js/shared/data/items-c11d.js';
import { C11C_K, C11C_SHOP_K } from '../public/js/shared/data/items-c11c.js';
import { C11D_BOSS_HINTS, C11D_HINT_WHO } from '../public/js/shared/data/boss-hints-c11d.js';
import {
  c11dConf, c11dTell, c11dPub, c11dAllyPub, queenOf, duoOf, frontOf, ringOf, linked, looseAllies, c11dPlan, queenNeed, duoNeed, holdTarget, AUTO_EVERY, SWEPT, SPICA, ALGOL,
  EIGHT_SONG_HP, EIGHT_SONG_AT,
} from '../public/js/shared/battle-c11d.js';
import { NARASU } from '../public/js/shared/data/abilities-c10d.js';
import { YOBIKAKE } from '../public/js/shared/data/abilities-c11b.js';
import { bestHit } from '../public/js/shared/battle-c9a.js';
import { ch9Run, ch9Party, CH9_KIT } from '../tools/sim-ch9.mjs';
import { CH11D_LV, CH10_NOTES } from '../tools/sim-ch11.mjs';
import { ORDER_FLAGS } from '../tools/sim-ch10.mjs';
import { canEquip } from '../public/js/shared/stats.js';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { playC11dFx } from '../public/js/client/render/battlefx-c11d.js';
import { playC8cFx } from '../public/js/client/render/battlefx-c8c.js';
import { battleBgSpec } from '../public/js/client/render/battlefx.js';
import { C11D_BG } from '../public/js/client/render/c11d-bg.js';
import {
  C11D_SCREEN_ANIMS, C11D_ALLY_FX, C11D_SFX, C11D_OWN_TELE, c11dHtml, c11dSprite, c11dPresent, c11dCmdItems, c11dCmdPick, c11dStatus, holdChoices,
} from '../public/js/client/battle-c11d.js';
import { c9bCmdItems } from '../public/js/client/battle-c9b.js';
import { CH4_ALLY_FX } from '../public/js/client/battle-ch4.js';
import { CH6_OWN_TELE } from '../public/js/client/battle-ch6.js';
import { TRAP_LABEL } from '../public/js/client/battle-earth.js';
import { allyAnimFor } from '../public/js/client/render/battlefx-r27.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';

const groupOf = (id) => FIXED_ENCOUNTERS[id].group.flatMap(([sp, n]) => Array(n).fill(sp));
const BASE_FLAGS = { c9_child: true, c9_act1: true, c9_song1: true };
const ALL9 = { ...BASE_FLAGS, [C10A.noteRe]: true, [C10A.noteFa]: true, [C10B.noteSo]: true, [C10B.noteLa]: true, [C10C.noteSi]: true, [C10D.noteDo]: true, [C11B.act1]: true, [C11C.act2]: true, [C11C.act3]: true };
// kinds … 味方の 種類（'player' 家族の キャラ・'support' 酒場の 人・'monster' 魔物の 仲間）
function battle({ id = C11D_BATTLE.queen, kinds = ['player', 'player', 'player', 'player'], seed = 3, flags = ALL9, enemies = null, auto = true } = {}) {
  const key = id === C11D_BATTLE.duo ? 'duo' : 'queen';
  const four = ch9Party(key, CH11D_LV[key]);
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
// 前に 入った 動き（八つめの 音の 場面 など）を すべて 動かす
const drain = (b) => {
  const out = [];
  while (b.queue.length) {
    b.executeNext();
    out.push(...b.flush().filter((e) => e.t === 'act'));
  }
  return out;
};
const big = (b) => { for (const a of b.allies) { a.hp = a.maxHp = 99999; } };
// 女王の 前ぶれを しばらく 出さない（ふつうの 攻撃だけ）
const calm = (b) => { b.c11d.measureLeft = 99; b.c11d.shineLeft = 99; };
const hold = (b, a, choice) => act(b, a, { type: 'ability', id: HOLD, choice });
const allText = (ev) => [...(ev?.lines || []), ...(ev?.postLines || [])].join('\n');

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（20-6）: フラグ・マップ・決まった 戦い・魔物の id・宝箱・だいじな 物・コマンド・曲・幕の 切りかえ（かりの data/c11d-names-b.js）', () => {
  assert.deepEqual(C11D, {
    act3: 'c11_act3', start: 'c11d_start', t1: 'c11d_t1', t2: 'c11d_t2', t3: 'c11d_t3', t4: 'c11d_t4', duo: 'c11d_duo', queen: 'c11d_queen', lamp: 'c11d_lamp', bridge: 'c11d_bridge', act4: 'c11_act4',
  });
  assert.deepEqual(Object.values(C11D_MAP_B), ['c11d_scale', 'c11d_tower1', 'c11d_tower2', 'c11d_tower2b', 'c11d_tower3', 'c11d_tower4', 'c11d_throne']);
  assert.deepEqual(C11D_BATTLE, { duo: 'c11d_duo', queen: 'c11d_queen' });
  for (const sp of Object.keys(MONSTERS_C11D)) assert.ok(sp.startsWith(C11D_MON_PREFIX_B), sp);
  assert.deepEqual(C11D_CHEST_IDS_B, ['c11d_c1', 'c11d_c2', 'c11d_c3', 'c11d_c4', 'c11d_c5', 'c11d_c6', 'c11d_c7', 'c11d_c8']);
  assert.deepEqual(Object.keys(C11D_TREASURE).sort(), [...C11D_CHEST_IDS_B].sort());
  assert.deepEqual(C11D_CMD_B, { hold: 'c11dhold', eight: 'c11deight' });
  assert.deepEqual(C11D_KEYS_B, { eight: 'note_eight' });
  assert.equal(NOTE_EIGHT, 'note_eight');
  assert.ok(ITEMS.note_eight?.type === 'key');
  assert.equal(C11D_OPEN_B, 'PART3_C11D_OPEN');
  assert.deepEqual(Object.values(C11D_TRACKS_B), ['c11d_scale', 'c11d_tower', 'c11d_duo', 'c11d_queen', 'c11d_eight', 'c11d_queen2', 'c11d_lamps', 'c11d_end']);
  for (const id of Object.values(C11D_BATTLE)) {
    assert.ok(FIXED_C11D[id].boss && FIXED_C11D[id].canFlee === false && FIXED_ENCOUNTERS[id] === FIXED_C11D[id], id);
    assert.equal(FIXED_ENCOUNTERS[id].bgm, id, '曲は F班の id');
  }
  assert.deepEqual(groupOf(C11D_BATTLE.duo), [C11D_MIRROR, C11D_MOON], 'ミラーレと オボロ');
  assert.deepEqual(groupOf(C11D_BATTLE.queen), [C11D_QUEEN]);
  assert.deepEqual(C11D_ZONES, ['t11d_tower1', 't11d_tower2', 't11d_tower3']);
  for (const z of C11D_ZONES) { assert.equal(ENCOUNTER_TABLES[z], ENCOUNTERS_C11D[z]); assert.equal(ZONE_BG[z], ZONE_BG_C11D[z]); }
  assert.equal(QUEEN_NAME, 'かがやきの女王ポラリス');
  assert.equal(DUO_NAME, '鏡と月の使い');
});

// ───────────── 塔の 魔物 ─────────────
test('塔の 魔物 7しゅ: Lv124〜126・仲間に なる・今の 素材・ランク・落とす 品・新しい 絵は 4しゅまで ＋ 色ちがい', () => {
  assert.equal(C11D_MINIONS.length, 7);
  const kinds = (z) => new Set(ENCOUNTERS_C11D[z].flatMap((r) => r.group.map((g) => g[0])));
  for (const sp of C11D_TOWER1_MON) assert.ok(kinds('t11d_tower1').has(sp), sp);
  for (const sp of C11D_TOWER2_MON) assert.ok(kinds('t11d_tower2').has(sp), sp);
  for (const sp of C11D_TOWER3_MON) assert.ok(kinds('t11d_tower3').has(sp), sp);
  for (const sp of C11D_MINIONS) {
    const m = MONSTERS[sp];
    assert.ok(m.lv >= 124 && m.lv <= 126, `${sp} Lv${m.lv}`);
    assert.equal(m.region, 6, sp);
    assert.ok(!m.boss, sp);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${sp}: ${a.id}`);
    const list = monsterDrops(sp);
    assert.ok(list.find((d) => d.kind === 'common') && list.find((d) => d.kind === 'rare'), sp);
    assert.ok(ITEMS[C11D_MAT_DROPS[sp][0]], `${sp}: 素材`);
    assert.deepEqual(MAT_DROPS[sp], C11D_MAT_DROPS[sp]);
    const f = MONSTER_FRIENDS[sp];
    assert.ok(f && f === FRIENDS_C11D[sp] && f.noFamily, `${sp}: 仲間に なる`);
    assert.ok(f.rate >= 1 / 26 && f.rate <= 1 / 10, sp);
    for (const [, id] of f.learn) assert.ok(ABILITIES[id], `${sp}: ${id}`);
    const g = Object.values(f.growth).reduce((s, v) => s + v, 0);
    assert.ok((g >= 5.8 - 1e-9 && g <= 6.1 + 1e-9) || (g >= 6.8 - 1e-9 && g <= 7.3 + 1e-9), `${sp}: growth ${g}`);
    assert.ok(MONSTER_RANKS[sp], `${sp}: ランク`);
    assert.ok(MONSTER_ART[sp], `${sp}: え`);
  }
  assert.ok(C11D_NEW_ART.length <= 4, '新しい 絵は 4しゅまで');
  assert.equal(Object.keys(C11D_RECOLOR_BASE).length + C11D_NEW_ART.length, 7);
  for (const [sp, base] of Object.entries(C11D_RECOLOR_BASE)) assert.ok(MONSTER_ART[base] && MONSTER_ART[sp].tint && String(MONSTER_ART[sp].size) === String(MONSTER_ART[base].size), `${sp} は ${base} の 色ちがい`);
});

// ───────────── 鏡と月の使い ─────────────
test('鏡と月の使い: 前に 出て いる 方の しくみだけ・ミラーレの 色の まくは 同じ 色の「音を鳴らす」（今 ある コマンド）で われる・うしろの 方は 小さな 攻撃だけ・かたい', () => {
  const b = battle({ id: C11D_BATTLE.duo });
  assert.ok(b.tellAll && b.mechBoss && mechBoss(b), 'しくみの ある ボス・人が えらぶ 間は 待つ');
  assert.ok(b.c9sp?.teru && b.c9sp?.song, 'スピカ（てらす・星のうた）');
  assert.ok(!b.c10d && !b.c11b, 'もとの 戦いの しくみは 動かない');
  for (const a of b.allies) assert.ok(a.abilities.includes(NARASU) && a.abilities.includes(YOBIKAKE), '今 ある コマンド 2つ');
  assert.equal(b.c11d.front, 'mirror');
  assert.equal(c11dTell(b), 'duo');
  big(b);
  const ms = duoOf(b, 'mirror');
  const mn = duoOf(b, 'moon');
  for (const e of [ms, mn]) { e.hp = e.maxHp = 1e6; }
  const [hero, hero2] = b.allies;
  const veil = b.c11d.veil[0];
  assert.ok(Number.isInteger(veil));
  // まくが ある 間は かたい
  const hit = (t) => { const h0 = t.hp; act(b, hero, { type: 'attack', target: t.id }); return h0 - t.hp; };
  let dv = 0;
  for (let i = 0; i < 4; i++) dv += hit(ms);
  // ちがう 色は われない
  const ng = act(b, hero, { type: 'ability', id: NARASU, choice: (veil + 1) % 6 });
  assert.ok(!ng.c11dRing.ok && b.c11d.veil.length === 1, '色が ちがう');
  const ok = act(b, hero, { type: 'ability', id: NARASU, choice: veil });
  assert.ok(ok.c11dRing.ok && ok.c11dBreak && !b.c11d.veil.length, 'まくが われた');
  let dopen = 0;
  for (let i = 0; i < 4; i++) dopen += hit(ms);
  assert.ok(dv < dopen * 0.4, `まくが ある 間は かたい ${dv} / ${dopen}`);
  // うしろの オボロは かたい（back）
  let dback = 0;
  for (let i = 0; i < 4; i++) dback += hit(mn);
  assert.ok(dback < dopen * 0.5, `うしろは かたい ${dback} / ${dopen}`);
  // うしろの 方は 小さな 攻撃だけ
  const ev = foe(b, mn);
  assert.ok(ev.fx?.anim && ABILITIES['m11u_back_o'].effect.mult < 0.5, 'うしろから 小さな 攻撃');
  // よびかけても オボロが うしろなら 思い出は 消えて いない（むだ）
  const c0 = act(b, hero2, { type: 'ability', id: YOBIKAKE, choice: SPICA });
  assert.ok(!c0.c11dCall.ok);
  // pub（画面）
  const p = c11dPub(ms, b);
  assert.equal(p.c11dKind, 'mirror');
  assert.equal(p.front11d, 1);
  assert.deepEqual(p.veil10, []);
  assert.equal(c11dPub(mn, b).front11d, 0);
});

test('鏡と月の使い: 3回の 番ごとに 入れかわる（前ぶれ）・オボロが 前の 時は わすれの衣（前ぶれ → 次の 番）・よびかける で もどる・思い出が ぜんぶ 消えると 負け・ミラーレが 前に もどると 新しい まく', () => {
  const b = battle({ id: C11D_BATTLE.duo });
  big(b);
  const ms = duoOf(b, 'mirror');
  const mn = duoOf(b, 'moon');
  for (const e of [ms, mn]) { e.hp = e.maxHp = 1e6; }
  const cf = c11dConf(C11D_MIRROR, b);
  assert.equal(cf.swap, 3);
  const first = b.c11d.veil[0];
  // ミラーレが 3回 動くと 前ぶれ → 次の 番で 入れかわる
  let warn = null;
  for (let i = 0; i < cf.swap; i++) { const ev = foe(b, ms); if (ev.c11dSwapUp) warn = ev; }
  assert.ok(warn && b.c11d.swapReady, '入れかわる 前ぶれ');
  assert.equal(c11dTell(b), 'swap');
  assert.equal(c11dPub(ms, b).swap11d, 1);
  const sw = foe(b, ms);
  assert.ok(sw.c11dSwap && b.c11d.front === 'moon', 'オボロが 前に');
  assert.equal(frontOf(b), mn);
  assert.ok(allText(sw).includes('前に出てきた'));
  // オボロ: 前に 出た はじめの 番に 前ぶれ → 次の 番に 衣
  const r0 = foe(b, mn);
  assert.ok(r0.c11dRobeUp && b.c11d.robeReady, '衣の 前ぶれ');
  assert.equal(c11dTell(b), 'robe');
  const r1 = foe(b, mn);
  assert.ok(r1.c11dRobe && b.c11d.forget === 1, 'スピカの 思い出 −1');
  // 思い出が 消えて いる 間は オボロが かたい
  const [hero] = b.allies;
  const hit = (t) => { const h0 = t.hp; act(b, hero, { type: 'attack', target: t.id }); return h0 - t.hp; };
  let dw = 0;
  for (let i = 0; i < 4; i++) dw += hit(mn);
  const call = act(b, hero, { type: 'ability', id: YOBIKAKE, choice: SPICA });
  assert.ok(call.c11dCall.ok && b.c11d.forget === 0, 'よびかける で もどる');
  let dc = 0;
  for (let i = 0; i < 4; i++) dc += hit(mn);
  assert.ok(dw < dc * 0.5, `衣の 間は かたい ${dw} / ${dc}`);
  // 3回め で 前ぶれ → 入れかわる → ミラーレは 新しい まく（前と ちがう 色）
  foe(b, mn);
  assert.ok(b.c11d.swapReady);
  foe(b, mn);
  assert.equal(b.c11d.front, 'mirror');
  assert.equal(b.c11d.veil.length, 1);
  assert.notEqual(b.c11d.veil[0], first, '前と ちがう 色');
  // 思い出が ぜんぶ 消えると 負け
  const lose = battle({ id: C11D_BATTLE.duo });
  big(lose);
  lose.c11d.front = 'moon';
  lose.c11d.forget = 2;
  const ob = duoOf(lose, 'moon');
  const ev = foe(lose, ob, ROBE);
  assert.ok(ev.c11dTaken && lose.c11d.lost && lose.pendingEnd?.outcome === 'lose', 'つれていかれて 負け');
});

test('鏡と月の使い: HPが 1に なった 方は ひざを つく（もう 入れかわらない）・2人 とも ひざを つくと 勝ち（2人 とも 引く ＝ たおれない）・落とす 品', () => {
  const b = battle({ id: C11D_BATTLE.duo });
  big(b);
  const ms = duoOf(b, 'mirror');
  const mn = duoOf(b, 'moon');
  const [hero] = b.allies;
  b.c11d.veil = [];
  ms.hp = 5;
  const k = act(b, hero, { type: 'attack', target: ms.id });
  assert.ok(k.c11dKnee && ms.c11u.down && ms.alive && ms.hp === 1, 'ひざを つく（たおれない）');
  assert.equal(b.c11d.front, 'moon', 'オボロが ずっと 前');
  const nothing = foe(b, ms);
  assert.ok(nothing && b.c11d.front === 'moon');
  assert.equal(c11dPub(ms, b).down11d, 1);
  mn.hp = 5;
  const w = act(b, hero, { type: 'attack', target: mn.id });
  assert.ok(w.c11dDuoDown && b.c11d.won && b.pendingEnd?.outcome === 'win', '勝ち');
  assert.ok(ms.alive && mn.alive && mn.hp === 1, 'たおれない');
  assert.ok(allText(w).includes('引いていった'));
  assert.ok(b.killed.includes(C11D_MIRROR) && b.killed.includes(C11D_MOON), '経験値・落とし物は ふつう');
  for (const sp of [C11D_MIRROR, C11D_MOON]) assert.ok(monsterDrops(sp).some((d) => d.kind === 'boss' && d.item === 'c11db_duo_ribbon'), sp);
  // 絵は 今 ある もの
  assert.deepEqual(C11D_DUO_ART, { [C11D_MIRROR]: 'c10d_mirare', [C11D_MOON]: 'c11b_oboro' });
  for (const [sp, base] of Object.entries(C11D_DUO_ART)) assert.equal(MONSTER_ART[sp].draw, MONSTER_ART[base].draw, sp);
});

// ───────────── 女王・手をつなぐ ─────────────
test('手をつなぐ: 自分と えらんだ 相手が つながる（女王の 3回の 番）・つながった 人と べつの 人が つなぐと 1つの 輪・スピカとも つなげる・ひとりの 時は アルゴルも・のこりが 1で「はなれそう」→ ほどける', () => {
  const b = battle();
  assert.ok(b.tellAll && b.mechBoss && b.c11d.kind === 'queen');
  assert.ok(b.allies.every((a) => a.abilities.includes(HOLD)), 'だれでも');
  assert.ok(!b.allies.some((a) => a.abilities.includes(EIGHT)), '八つの音は まだ ない');
  big(b);
  const q = queenOf(b);
  q.hp = q.maxHp = 1e7;
  const [a0, a1, a2, a3] = b.allies;
  assert.equal(looseAllies(b).length, 4);
  const h1 = hold(b, a0, a1.id);
  assert.ok(h1.c11dHold.ok && linked(b, a0.id) && linked(b, a1.id));
  assert.ok(allText(h1).includes('手をつないだ'));
  hold(b, a2, SPICA);
  assert.ok(linked(b, a2.id) && linked(b, SPICA));
  assert.notEqual(ringOf(b, a0.id), ringOf(b, a2.id), '2つの 輪');
  const h3 = hold(b, a3, a0.id);
  assert.equal(ringOf(b, a3.id).m.length, 3);
  const h4 = hold(b, a1, SPICA);
  assert.ok(h4.c11dHold.grew && ringOf(b, a0.id) === ringOf(b, a2.id), '1つの 輪');
  assert.equal(ringOf(b, a0.id).m.length, 5, '4人 ＋ スピカ');
  void h3;
  assert.equal(looseAllies(b).length, 0);
  // ほどける: 女王の 番ごとに のこりが へる（2 → 1 で「はなれそう」→ 0 で ほどける）
  const r = ringOf(b, a0.id);
  assert.equal(r.left, 3);
  calm(b);
  foe(b, q);
  const w = foe(b, q);
  assert.ok(w.c11dRingWarn && ringOf(b, a0.id)?.left === 1, 'はなれそう');
  assert.ok(allText(w).includes('はなれそう'));
  const off = foe(b, q);
  assert.ok(off.c11dRingOff && !linked(b, a0.id), 'ほどけた');
  // つなぎ直すと のこりが もどる
  hold(b, a0, a1.id);
  assert.equal(ringOf(b, a0.id).left, 3);
  // ひとりの 時は アルゴルとも
  const s = battle({ kinds: ['player'] });
  big(s);
  const [solo] = s.allies;
  const ha = hold(s, solo, ALGOL);
  assert.ok(ha.c11dHold.ok && linked(s, solo.id) && linked(s, ALGOL));
  assert.ok(allText(ha).includes('アルゴル'));
  // 人が いる 時は アルゴルは えらべない（スピカに なる）
  const n = battle();
  big(n);
  const hn = hold(n, n.allies[0], ALGOL);
  assert.equal(hn.c11dHold.to, SPICA);
  // 自分・ながされた 人とは つなげない
  const self = hold(n, n.allies[1], n.allies[1].id);
  assert.ok(!self.c11dHold.ok);
  // 画面へ: 名前の 横の しるし（同じ 色）
  const ap = c11dAllyPub(b.allies[0], b);
  assert.ok(ap.hold11d && ap.ring11d && Number.isInteger(ap.ring11d.c) && ap.ring11d.n >= 2);
  assert.equal(c11dAllyPub(b.allies[0], b).ring11d.c, c11dAllyPub(b.allies[1], b).ring11d.c, '同じ 輪は 同じ 色');
});

test('光の はかり: いちばん HPの わりあいが 低い 人を はかる（前ぶれ … だれが はかられるか）・つないで いれば ながされない・つないで いなければ ながされる（自分の 番 2回 戦いの 外 → もどると HP 半分）', () => {
  const b = battle();
  big(b);
  const q = queenOf(b);
  q.hp = q.maxHp = 1e7;
  const [a0, a1, a2] = b.allies;
  a2.hp = 30000;
  b.c11d.shineLeft = 99;
  // 前ぶれ（女王が measure.first 回 動くと）
  const cf = c11dConf(C11D_QUEEN, b);
  let up = null;
  for (let i = 0; i < cf.measure.first && !up; i++) { const ev = foe(b, q); if (ev.c11dMeasureUp) up = ev; }
  assert.ok(up && b.c11d.measureReady, '前ぶれ');
  assert.equal(up.c11dMeasureUp.aim, a2.id, 'いちばん 弱って いる 人');
  assert.equal(c11dTell(b), 'measure');
  assert.equal(c11dPub(q, b).measure11d, a2.id);
  assert.equal(c11dAllyPub(a2, b).aim11d, 1);
  assert.ok(allText(up).includes(a2.name));
  // つないで いない → ながされる
  const sw = foe(b, q);
  assert.ok(sw.c11dSweep && a2.status.rift?.kind === SWEPT, 'ながされた');
  assert.equal(c11dAllyPub(a2, b).swept11d, cf.measure.away);
  assert.ok(allText(sw).includes('光の川'));
  // ながされた 人は ねらわれない・回復も とどかない
  calm(b);
  for (let i = 0; i < 6; i++) { const ev = foe(b, q); assert.ok(!ev.fx?.targets?.includes(a2.id), 'ねらわれない'); }
  // 自分の 番 2回で もどる（HP 半分）
  a2.hp = 10;
  b.queue.push({ id: a2.id, cmd: { type: 'incapacitated' }, last: true });
  b.executeNext();
  assert.ok(a2.status.rift, 'まだ');
  b.flush();
  b.queue.push({ id: a2.id, cmd: { type: 'incapacitated' }, last: true });
  b.executeNext();
  const back = b.flush().filter((e) => e.t === 'act').pop();
  assert.ok(!a2.status.rift && back.c11dReturn, 'もどった');
  assert.equal(a2.hp, Math.round(a2.maxHp * cf.measure.back));
  // つないで いれば ながされない
  const c = battle();
  big(c);
  const q2 = queenOf(c);
  q2.hp = q2.maxHp = 1e7;
  const [b0, b1] = c.allies;
  b0.hp = 20000;
  hold(c, b1, b0.id);
  c.c11d.measureReady = true;
  c.c11d.measureAim = b0.id;
  const held = foe(c, q2, MEASURE);
  assert.ok(held.c11dMeasure.held && !b0.status.rift, 'ながされない');
  assert.ok(allText(held).includes('手が、はなれない'));
});

test('かがやき: 前ぶれ → つないで いない 人に 大きな ダメージ・つないで いる 人には 小さな ダメージ（防御で へる）', () => {
  const b = battle();
  const q = queenOf(b);
  q.hp = q.maxHp = 1e7;
  for (const a of b.allies) { a.hp = a.maxHp = 50000; }
  const [a0, a1, a2] = b.allies;
  hold(b, a0, a1.id);
  b.c11d.shineReady = true;
  assert.equal(c11dTell(b), 'shine');
  const h0 = b.allies.map((a) => a.hp);
  const ev = foe(b, q, SHINE);
  assert.ok(ev.c11dShine);
  const lost = b.allies.map((a, i) => h0[i] - a.hp);
  assert.ok(ev.c11dShine.held.includes(a0.id) && ev.c11dShine.loose.includes(a2.id));
  assert.ok(lost[2] > lost[0] * 3, `つないで いない 人に 大きな ダメージ ${lost[2]} / ${lost[0]}`);
  assert.equal(ABILITIES[SHINE].target, 'enemies');
});

test('八つめの 音: HPが 半分に なると 1度だけ … まぶしすぎる 光で 手が ぜんぶ ほどけ HP 1 → 場面（A班の 文）→ みんな 回復・1つの 輪・「八つの音」・後半（曲 c11d_queen2）／やり直した 戦いでも 出る／画面の 状態は つなぎ直しても わかる', () => {
  for (const kinds of [['player', 'player', 'player', 'player'], ['player'], ['player', 'support', 'support', 'support']]) {
    const b = battle({ kinds, auto: false });
    for (const a of b.allies) { a.hp = a.maxHp = 50000; a.atk = 99999; }
    const q = queenOf(b);
    const [hero] = b.allies;
    hold(b, hero, SPICA);
    // 大きな 一撃でも HPは 半分で 止まる
    const ev = act(b, hero, { type: 'attack', target: q.id });
    assert.equal(q.hp, Math.ceil(q.maxHp * 0.5), '半分で 止まる');
    assert.ok(ev.c11dDazzle, 'まぶしすぎる 光');
    assert.ok(b.allies.every((a) => !a.alive || a.hp < a.maxHp * 0.4), 'みんなの HP 1（スピカの ほのかな光・ふたりの光で 少し もどる ことも。負けには ならない）');
    assert.ok(allText(ev).includes('みんなのHPが1になった'), 'HP 1');
    assert.ok(!linked(b, hero.id), '手が ぜんぶ ほどけた');
    assert.equal(c11dTell(b), 'eight');
    assert.equal(c11dPub(q, b).queenStage, 2, '場面の 曲');
    assert.ok(!b.pendingEnd, '負けには ならない');
    // 場面（女王の 番の いちばん 前）
    const evs = drain(b);
    const sc = evs.find((e) => e.c11dEight);
    assert.ok(sc, '場面');
    assert.deepEqual(sc.c11dEight.lines, C11D_EIGHT_SCENE_B.lines.map((x) => (x.who ? `${x.who}「${x.text}」` : x.text)), 'A班の 文（かり）を そのまま');
    assert.ok(sc.dur >= C11D_EIGHT_SCENE_B.lines.length * C11D_EIGHT_SCENE_B.ms * 0.9, `場面の 長さ ${sc.dur}`);
    assert.ok(b.allies.every((a) => a.hp === a.maxHp), 'みんな 回復');
    const r = ringOf(b, hero.id);
    assert.ok(r && r.m.includes(SPICA) && b.allies.every((a) => r.m.includes(a.id)), 'みんなが 1つの 輪');
    if (kinds.length === 1) assert.ok(r.m.includes(ALGOL), 'ひとりの 時は アルゴルも');
    assert.ok(b.allies.every((a) => a.abilities.includes(EIGHT)), '八つの音');
    assert.equal(b.c11d.phase, 2);
    const p = c11dPub(q, b);
    assert.equal(p.queenStage, 3, '後半の 曲');
    assert.equal(p.phase11d, 2, 'つなぎ直した 画面にも 後半と わかる');
    assert.equal(p.eight11d.left, 2);
    // 2度めは ない（HPが また 半分を 切っても）
    q.hp = Math.ceil(q.maxHp * 0.4);
    const ev2 = act(b, hero, { type: 'attack', target: q.id });
    assert.ok(!ev2.c11dDazzle && !drain(b).some((e) => e.c11dEight), '1度だけ');
    assert.ok(q.hp < q.maxHp * 0.4);
  }
  // やり直した 戦い（新しい 戦い）でも 出る
  const again = battle({ auto: false });
  for (const a of again.allies) { a.hp = a.maxHp = 50000; a.atk = 99999; }
  act(again, again.allies[0], { type: 'attack', target: queenOf(again).id });
  assert.ok(drain(again).some((e) => e.c11dEight));
});

test('八つの音: 八つめの 音の あとに 出る・みんなが 1つの ほどけない 輪（4回の 番の 間）・光の はかりが きかない・戦いで 2回 まで・勝つと 女王は 手を 下ろす（たおれない）', () => {
  const b = battle({ auto: false });
  for (const a of b.allies) { a.hp = a.maxHp = 50000; a.atk = 99999; }
  const q = queenOf(b);
  const [hero, a1] = b.allies;
  const pre = act(b, hero, { type: 'ability', id: EIGHT });
  assert.ok(!pre?.c11dEightUse?.ok, 'まだ 使えない');
  act(b, hero, { type: 'attack', target: q.id });
  drain(b);
  const cf = c11dConf(C11D_QUEEN, b);
  const u1 = act(b, a1, { type: 'ability', id: EIGHT });
  assert.ok(u1.c11dEightUse.ok && b.c11d.lock === cf.eight.lock);
  const r = ringOf(b, hero.id);
  assert.ok(r.lock > 0 && b.allies.every((a) => r.m.includes(a.id)));
  // ほどけない（女王の 番が 来ても のこりが へらない）
  calm(b);
  for (let i = 0; i < 3; i++) foe(b, q);
  assert.ok(linked(b, hero.id) && ringOf(b, hero.id).left >= 2, 'ほどけない（のこりが へらない）');
  // はかりが きかない
  b.c11d.measureReady = true;
  b.c11d.measureAim = hero.id;
  const m = foe(b, q, MEASURE);
  assert.ok(m.c11dMeasure.lock && !hero.status.rift, 'はかりが きかない');
  act(b, a1, { type: 'ability', id: EIGHT });
  const u3 = act(b, a1, { type: 'ability', id: EIGHT });
  assert.ok(!u3.c11dEightUse.ok, '2回 まで');
  assert.equal(b.c11d.eightLeft, 0);
  // 勝つと 女王は 手を 下ろす（HP 1 で 止まる）
  q.hp = 10;
  const w = act(b, hero, { type: 'attack', target: q.id });
  assert.ok(w.c11dDown && q.alive && q.hp === 1 && b.pendingEnd?.outcome === 'win');
  assert.ok(allText(w).includes('手を下ろした'));
  assert.ok(b.killed.includes(C11D_QUEEN));
  assert.equal(c11dPub(q, b).queenStage, 4);
  assert.ok(monsterDrops(C11D_QUEEN).some((d) => d.kind === 'boss' && d.item === 'c11db_queen_tiara'));
  // 後半の 女王: 星の 名前を よぶ（こうげきでは ない ＝ 女王の 回復）
  const n = battle();
  big(n);
  const q2 = queenOf(n);
  q2.hp = q2.maxHp - 5000;
  const nm = foe(n, q2, NAMES);
  assert.ok(nm.c11dNames && q2.hp > q2.maxHp - 5000, '回復');
  assert.ok(n.allies.every((a) => a.hp === a.maxHp), 'こうげきでは ない');
});

test('スピカの 光: スピカと つないだ 輪の 人数が 多いほど 強い（ほのかな光・てらす）', () => {
  const b = battle({ enemies: [C11D_QUEEN] });
  const q = queenOf(b);
  q.hp = q.maxHp = 1e7;
  q.actions = [{ w: 1, id: 'm_nothing' }];
  for (const a of b.allies) a.hp = Math.round(a.maxHp * 0.3);
  hold(b, b.allies[0], SPICA);
  hold(b, b.allies[1], b.allies[0].id);
  hold(b, b.allies[2], b.allies[1].id);
  let got = null;
  for (let i = 0; i < 6 && !got; i++) for (const a of b.aliveAllies()) { const ev = act(b, a, { type: 'defend' }); if (ev?.c11dGlow) { got = ev; break; } }
  assert.ok(got && got.c11dGlow.n === 4, '輪の 人数');
  assert.ok(allText(got).includes('輪の4人'));
});

// ───────────── 自動の 仲間・知って いる 人 ─────────────
test('自動の 仲間: 人が えらんで いる 時だけ、つないで いない 人が いる 時の 3回に 1回 つなぐ（完全オートは つながない）・知って いる 人は はかられる 人と つなぐ', () => {
  const b = battle({ kinds: ['player', 'support', 'support', 'support'], auto: false });
  big(b);
  const sup = b.allies[1];
  const decide = () => ({ type: 'attack', target: queenOf(b).id });
  const plans = [];
  for (let i = 0; i < 6; i++) plans.push(c11dPlan(b, sup, decide, bestHit));
  assert.equal(plans.filter((p) => p?.id === HOLD).length, 6 / AUTO_EVERY, '3回に 1回');
  const auto = battle({ kinds: ['player', 'support', 'support', 'support'], auto: true });
  big(auto);
  for (let i = 0; i < 6; i++) assert.equal(c11dPlan(auto, auto.allies[1], decide, bestHit), null, '完全オートは つながない');
  // 知って いる 人
  const k = battle();
  big(k);
  const [h0, h1, h2] = k.allies;
  h0.knows9 = 'know';
  k.c11d.measureReady = true;
  k.c11d.measureAim = h2.id;
  const p = c11dPlan(k, h0, decide, bestHit);
  assert.deepEqual(p, { type: 'ability', id: HOLD, choice: h2.id }, 'はかられる 人と つなぐ');
  assert.equal(holdTarget(k, h2), h0.id === h2.id ? SPICA : holdTarget(k, h2));
  void h1;
  assert.equal(queenNeed(k, h0).kind, 'hold');
  // 中ボス: 知って いる 人は まくと 同じ 色を 鳴らす
  const d = battle({ id: C11D_BATTLE.duo });
  big(d);
  d.allies[0].knows9 = 'know';
  const dp = c11dPlan(d, d.allies[0], decide, bestHit);
  assert.deepEqual(dp, { type: 'ability', id: NARASU, choice: d.c11d.veil[0] });
  assert.equal(duoNeed(d).kind, 'ring');
});

// ───────────── 人数合わせ・1回で たおされすぎない ─────────────
test('人数で 合わせる: 家族の キャラの 数（few）・仲間なしの 2人・3人（bare）・ひとり（solo）。ゲストは 数えない・ふつうの 攻撃 1回は いちばん HPの 少ない 人の 最大HP を こえない', () => {
  for (const [id, sp] of [[C11D_BATTLE.queen, C11D_QUEEN], [C11D_BATTLE.duo, C11D_MIRROR]]) {
    const conf = MONSTERS[sp].c11d;
    const four = battle({ id });
    const two = battle({ id, kinds: ['player', 'player'] });
    const three = battle({ id, kinds: ['player', 'player', 'player'] });
    const k1 = battle({ id, kinds: ['player', 'support', 'support', 'support'] });
    const solo = battle({ id, kinds: ['player'] });
    assert.equal(c11dConf(sp, four).hp, conf.few.hp[3], id);
    assert.equal(c11dConf(sp, two).bare, 2);
    assert.equal(c11dConf(sp, two).hp, conf.bare.hp[0]);
    assert.equal(c11dConf(sp, three).hp, conf.bare.hp[1]);
    assert.equal(c11dConf(sp, k1).bare, 0, '自動の 仲間が いれば bare は きかない');
    assert.equal(c11dConf(sp, k1).hp, conf.few.hp[0]);
    assert.equal(c11dConf(sp, solo).hp, conf.solo.hp);
    const g = battle({ id, kinds: ['player', 'player'] });
    g.allies.push({ kind: 'guest', id: 'gx', alive: true });
    assert.equal(c11dConf(sp, g).bare, 2, 'ゲストは 数えない');
  }
  // 1回で たおされすぎない（人4人・人5人。つないで いない 時の かがやきは こえて よい）
  for (const kinds of [['player', 'player', 'player', 'player'], ['player', 'player', 'player', 'player', 'player']]) {
    for (const id of Object.values(C11D_BATTLE)) {
      const b = battle({ id, kinds });
      const minHp = Math.min(...b.allies.map((a) => a.maxHp));
      for (const e of b.enemies) {
        for (const x of e.actions) {
          const a = ABILITIES[x.id];
          const eff = x.id === 'attack' ? { type: 'phys', mult: 1 } : a.effect;
          const mult = eff.type === 'c11dStrike' && !eff.aoe ? eff.mult : eff.type === 'phys' && a?.target !== 'enemies' ? eff.mult : null;
          if (mult == null) continue;
          const worst = Math.max(...b.allies.map((t) => b.calcPhys(e, t, { mult }, 1, 'phys', true).dmg * (e.dmgRate > 0 ? e.dmgRate : 1)));
          assert.ok(worst <= minHp * 1.0, `${kinds.length}人 ${e.name} ${x.id}: ${Math.round(worst)} / ${minHp}`);
        }
      }
    }
  }
});

// ───────────── 強さ（短く。道具の 表は docs/plan-part3-c11d.md）─────────────
test('強さ: 完全オートは 勝てない（どの 組でも）・知って いる 人は 勝てる（手を つなぐ・八つめの 音・八つの音）・2秒と 5秒で 勝率が 同じ', { timeout: 2400000 }, () => {
  assert.deepEqual(CH11D_LV, { duo: 125, queen: 126 });
  assert.deepEqual(ORDER_FLAGS.c11d.queen, [...CH10_NOTES, C11B.act1, C11C.act2, C11C.act3]);
  for (const key of ['duo', 'queen']) {
    for (const [job, kit] of Object.entries(CH9_KIT[key])) for (const id of kit) if (id) assert.ok(canEquip(job, id), `${job}: ${id}`);
  }
  const flags = ORDER_FLAGS.c11d.queen;
  for (const boss of ['queen', 'duo']) {
    for (const party of ['p4', 'k1fam', 'solo']) {
      for (let i = 0; i < 3; i++) {
        const r = ch9Run(boss, CH11D_LV[boss], 'auto', 9090 + i * 7919, { party, flags });
        assert.notEqual(r.outcome, 'win', `${boss} ${party} 完全オート ${i}`);
      }
    }
  }
  const wins = [];
  for (let i = 0; i < 4; i++) {
    const r2 = ch9Run('queen', 126, 'know', 9090 + i * 7919, { party: 'p4', flags, react: 2000 });
    const r5 = ch9Run('queen', 126, 'know', 9090 + i * 7919, { party: 'p4', flags, react: 5000 });
    assert.equal(r2.outcome, r5.outcome, '2秒と 5秒で 同じ');
    if (r2.outcome === 'win') {
      wins.push(r2);
      assert.ok(r2.qScene === 1 && r2.qHold1 >= 3, `八つめの 音の 場面まで・手を つなぐ ${r2.qHold1}`);
    }
  }
  assert.ok(wins.length >= 2, `知って いる 人 4回中 ${wins.length}`);
  assert.ok(wins.some((r) => r.qEight >= 1), '八つの音');
});

test('本物の 流れ（tools/real-boss.mjs）: 女王・中ボスも 回る・画面と 同じ 形の コマンド（手をつなぐ … choice つき・八つの音・音を鳴らす・よびかける）が はねかえされない', { timeout: 900000 }, async () => {
  const { realRun } = await import('../tools/real-boss.mjs');
  const prev = process.env.HUMAN;
  process.env.HUMAN = 'easy';
  try {
    const r = await realRun('queen', 'p2', 9090);
    assert.ok(['win', 'lose'].includes(r.outcome), r.outcome);
    assert.equal(r.rej, 0, 'はねかえされた コマンドが ない');
    assert.ok((r.sent[HOLD] || 0) >= 1, JSON.stringify(r.sent));
    const k = await realRun('duo', 'k1fam', 9090);
    assert.ok(['win', 'lose'].includes(k.outcome) && k.rej === 0);
    assert.ok((k.sent[NARASU] || 0) + (k.sent[YOBIKAKE] || 0) >= 1, JSON.stringify(k.sent));
  } finally {
    if (prev === undefined) delete process.env.HUMAN; else process.env.HUMAN = prev;
  }
});

// ───────────── スピカの さいごの ごほうび ─────────────
test('スピカの さいごの ごほうび: 第3部の クリア（c11_act4）で 技「八つの音のうた」… 戦いで 1回だけ、8回めの ほのかな光で みんなの HP・MPが 回復（前の ごほうびと 合わせて きく）・ゲストの 上限 126', () => {
  const ALL10 = { ...ALL9, [C11D.act4]: true };
  const plain = battle({ enemies: ['c11d_knight', 'c11d_crown'], flags: ALL9 });
  const song = battle({ enemies: ['c11d_knight', 'c11d_crown'], flags: ALL10 });
  assert.ok(!plain.c11rew?.eight);
  assert.ok(song.c11rew?.eight && song.c11rew?.twin && song.c11rew?.call && song.c11rew?.star, '前の ごほうびも きく');
  assert.ok(song.c10rew?.glowStart);
  for (const e of song.enemies) e.actions = [{ w: 1, id: 'm_nothing' }];
  for (const a of song.allies) a.hp = Math.round(a.maxHp * 0.7);
  let got = null;
  for (let i = 0; i < 20 && !got; i++) for (const a of song.aliveAllies()) { const ev = act(song, a, { type: 'defend' }); if (ev?.c11dSong) { got = ev; break; } }
  assert.ok(got, '八つの音のうた');
  assert.ok(song.c9sp.glows >= EIGHT_SONG_AT);
  assert.ok(allText(got).includes(EIGHT_SONG_NAME));
  assert.ok(EIGHT_SONG_HP >= 0.15);
  for (let i = 0; i < 12; i++) for (const a of song.aliveAllies()) assert.ok(!act(song, a, { type: 'defend' })?.c11dSong, '2回めは ない');
  assert.equal(GUEST_MAX_LEVEL, 126);
});

// ───────────── 品 ─────────────
test('品: 宝箱 8こ（★5 は 4つ k 2.54〜2.58・さいごの 1つは 第3部で いちばん 強い 品）・月の都の おもての 店に 足す 4つ（k 2.44〜2.46）・ボスの 品・だいじな 物・武器は 作らない', () => {
  const step = 0.04;
  assert.deepEqual(Object.values(C11D_K), [2.54, 2.55, 2.56, 2.58]);
  assert.ok(Math.abs(Math.min(...Object.values(C11D_K)) - Math.max(...Object.values(C11C_K))) < 1e-9, '前の 幕の いちばん 上から');
  assert.ok(Math.abs(Math.max(...Object.values(C11D_K)) - Math.max(...Object.values(C11C_K)) - step) < 1e-9, '同じ はば');
  assert.ok(Math.abs(C11D_SHOP_K.lo - C11C_SHOP_K.lo - step) < 1e-9 && Math.abs(C11D_SHOP_K.hi - C11C_SHOP_K.hi - step) < 1e-9);
  assert.equal(C11D_GEAR_CHESTS.length, 4);
  for (const id of C11D_CHEST_IDS_B) {
    const c = c11dChest(id);
    assert.ok(c && ITEMS[c.item], id);
    const it = ITEMS[c.item];
    if (C11D_GEAR_CHESTS.includes(id)) {
      assert.ok(['armor', 'shield', 'head'].includes(it.type) && it.rarity === 4 && it.src === 'c11d', id);
      assert.equal(rareWhereText(c.item), 'かがやきの塔の宝箱でしか手に入らない');
    } else assert.ok(it.type !== 'weapon' && !['armor', 'shield', 'head', 'acc'].includes(it.type), `${id}: 素材か 道具`);
  }
  assert.equal(c11dChest('c11d_c8').item, C11D_BEST);
  // さいごの 1つは 第3部で いちばん 強い 品（第3部の 後半の 品の どの 防具より 守りが 高い）
  const best = ITEMS[C11D_BEST];
  for (const id of PART3_LATE_ITEMS) {
    if (id === C11D_BEST) continue;
    const it = ITEMS[id];
    if (it.type !== 'armor') continue;
    assert.ok(best.def > it.def, `${id}: ${it.def} / ${best.def}`);
  }
  assert.equal(c11dChest('nope'), null);
  assert.equal(C11D_FRONT_ADD.length, 4);
  for (const id of C11D_FRONT_ADD) {
    const it = ITEMS[id];
    assert.ok(it && it.price > 0 && it.rarity === 0 && it.rank === 10 && ['armor', 'shield', 'head'].includes(it.type), id);
  }
  assert.ok(ITEMS.c11ds_mail.def > ITEMS.c11cs_mail.def && ITEMS.c11ds_robe.def >= ITEMS.c11cs_robe.def && ITEMS.c11ds_shield.def >= ITEMS.c11cs_shield.def && ITEMS.c11ds_helm.def >= ITEMS.c11cs_helm.def);
  for (const it of Object.values(ITEMS_C11D)) assert.notEqual(it.type, 'weapon', '武器は 作らない');
  for (const id of Object.keys(ITEMS_C11D)) { assert.ok(PART3_LATE_ITEMS.has(id), id); assert.ok(ITEM_KANA[id], `${id} の 読みがな`); }
  assert.deepEqual(C11D_DROPS, { [C11D_MIRROR]: ['c11db_duo_ribbon'], [C11D_QUEEN]: ['c11db_queen_tiara'] });
  for (const [sp, [id]] of Object.entries(C11D_DROPS)) {
    const it = ITEMS[id];
    assert.ok(it.unique && it.type === 'acc' && it.src === 'pastboss' && it.boss === sp, id);
    const sum = Object.values(it.bonus).reduce((s, v) => s + v, 0);
    assert.ok(sum <= 287 && sum >= 280, `${id}: ${sum}`);
    assert.ok(monsterDrops(sp).some((d) => d.kind === 'boss' && d.item === id));
    assert.ok(!it.resist?.water, '水に 強い 装備は 作らない');
  }
});

// ───────────── ヒント ─────────────
test('負けた 時の ヒント: 女王は 3だん（文は 20-5 の まま）・中ボスは 2だん・言う 人は ノクト', () => {
  assert.deepEqual(C11D_BOSS_HINTS[C11D_BATTLE.queen], [
    '女王は、いちばん弱っているやつを、はかって、ながすぞ',
    '「手をつなぐ」で、だれかとつないでおけ。つないでいれば、ながされない',
    'みんなで1つの輪になれ。つなぎは3回の番で切れる。切れる前に、つなぎ直せ。「八つの音」は、苦しい時のためにとっておけ',
  ]);
  assert.equal(C11D_BOSS_HINTS[C11D_BATTLE.duo].length, 2);
  for (const id of Object.values(C11D_BATTLE)) {
    assert.deepEqual(BOSS_HINTS[id], C11D_BOSS_HINTS[id]);
    assert.equal(BOSS_HINT_WHO[id], C11D_HINT_WHO);
  }
  assert.equal(C11D_HINT_WHO, 'ノクト');
});

// ───────────── 物語の きまり ─────────────
test('物語の きまり（20-1）: 戦いの 文に カイ・ソリトゥスの 名前・第1部と 第2部の ひみつ・八つめの 光が だれの 物かの 説明を 書かない・女王を 悪者の ことばに しない', () => {
  const files = ['public/js/shared/data/monsters-c11d.js', 'public/js/shared/data/abilities-c11d.js', 'public/js/shared/data/items-c11d.js', 'public/js/shared/data/boss-hints-c11d.js',
    'public/js/shared/data/companions-c11d.js', 'public/js/shared/data/encounters-c11d.js', 'public/js/shared/data/c11d-names-b.js', 'public/js/shared/battle-c11d.js', 'public/js/client/battle-c11d.js',
    'public/js/client/render/c11d-art.js', 'public/js/client/render/c11d-bg.js', 'public/js/client/render/battlefx-c11d.js'];
  // ことばの 中（コメントは のぞく。コメントの 中の「書かない」の 説明は よい）
  const code = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8').split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
  const BAD = ['カイ', 'ソリトゥス', 'トキネ', '魔王', '第1部', '第2部', '千年前', 'ひとりぼっちだった星', '悪者', 'わるもの', 'ざまあ', 'ふはは', 'フハハ', '愚か', 'おろかもの', '死ね'];
  for (const f of files) for (const w of BAD) assert.ok(!code(f).includes(w), `${f}: ${w}`);
  const texts = [QUEEN_NAME, ...Object.values(C11D_ABILITIES).flatMap((a) => [a.name, a.cast, a.desc]), ...Object.values(MONSTERS_C11D).flatMap((m) => [m.name, m.desc]),
    ...Object.values(ITEMS_C11D).flatMap((i) => [i.name, i.desc]), ...Object.values(C11D_BOSS_HINTS).flat(), ...C11D_EIGHT_SCENE_B.lines.map((x) => `${x.who || ''}${x.text}`)];
  for (const t of texts) for (const w of BAD) assert.ok(!String(t).includes(w), `${t}: ${w}`);
  // 八つめの 音の 場面は 小さな 光と ノクトの ひとことだけ（名前も 正体も 言わない）
  const scene = C11D_EIGHT_SCENE_B.lines;
  assert.ok(scene.some((x) => x.who === 'ノクト' && x.text === '……おまえ、なのか。'));
  assert.ok(scene.filter((x) => x.who).every((x) => ['スピカ', 'ノクト'].includes(x.who)));
  // 「ひとりぼっち」は 戦いの 文で 使わない（スピカ・アルゴル・女王の ことだけ … 台本）
  for (const f of files) assert.ok(!code(f).includes('ひとりぼっち'), f);
});

// ───────────── 絵・背景・えんしゅつ ─────────────
test('絵: 塔の 魔物（新しい 4つ・色ちがい 3つ）・女王（2倍の こまかさ・コマ 2・3 … 手を 下ろす）・中ボスは 今 ある え・背景 3つ・えんしゅつ', () => {
  for (const sp of C11D_NEW_ART) {
    const d = MONSTER_ART[sp];
    assert.ok(d && !d.tint && d.size.every((v) => v >= 20 && v <= 72), sp);
    assert.ok(d.pal.every((c) => /^#[0-9a-f]{6}$/i.test(c)), `${sp}: pal`);
  }
  for (const sp of [C11D_QUEEN, C11D_MIRROR, C11D_MOON]) {
    assert.ok(MONSTER_ART[sp]?.size[0] >= 80, sp);
    assert.equal(MONSTERS[sp].artScale, 0.5, sp);
  }
  // え を かく（コマ 0〜3。はみださない）
  const pts = [];
  const g = { w: 224, h: 256, ell: (x, y) => pts.push([x, y]), poly: (p) => pts.push(...p), line: (p) => pts.push(...p) };
  for (let f = 0; f < 4; f++) MONSTER_ART[C11D_QUEEN].draw(g, f);
  assert.ok(pts.length > 100 && pts.every(([x, y]) => x > -0.05 && x < 1.05 && y > -0.05 && y < 1.05), 'はみださない');
  assert.equal(c11dSprite({ species: C11D_QUEEN, alive: true }, 0), null, 'ふだんは ふつうの え');
  for (const bg of ['c11d_tower', 'c11d_hall', 'c11d_throne']) {
    assert.ok(C11D_BG[bg], bg);
    assert.ok(battleBgSpec(bg)?.deco === bg, `${bg}: battlefx から とどく`);
  }
  assert.equal(FIXED_C11D[C11D_BATTLE.duo].bg, 'c11d_hall');
  assert.equal(FIXED_C11D[C11D_BATTLE.queen].bg, 'c11d_throne');
  const fx = new Proxy({}, { get: () => () => {} });
  const anims = [...new Set(Object.values(C11D_ABILITIES).map((a) => a.anim))].filter((a) => !/^c10[a-z]_|^c11o_|^c11b_/.test(a));
  for (const a of anims) {
    assert.equal(playC11dFx(fx, a, [{ x: 100, y: 60 }, { x: 140, y: 70 }], null, {}), true, a);
    assert.equal(playC11dFx(fx, a, [], null, {}), true, `${a}: 的が ない 時も`);
    assert.equal(playC8cFx(fx, a, [{ x: 100, y: 60 }], null, {}), true, `${a}: battlefx-c8c.js から とどく`);
    assert.ok(C11D_SFX[a], `${a}: 音`);
  }
  for (const a of C11D_SCREEN_ANIMS) assert.ok(anims.includes(a), a);
  for (const [a, v] of Object.entries(C11D_ALLY_FX)) assert.equal(CH4_ALLY_FX[a], v, a);
  for (const sp of C11D_OWN_TELE) assert.ok(CH6_OWN_TELE.has(sp), `${sp}: 前ぶれの バナーを 自分で 出す`);
  assert.equal(allyAnimFor({ type: 'ability', types: ['c11dHold'] }) ?? 'buff', 'buff');
  assert.equal(TRAP_LABEL.c11dswept, 'ながされた');
  // 技の 名前（コマンド）
  assert.equal(ABILITIES[HOLD].name, '手をつなぐ');
  assert.equal(ABILITIES[EIGHT].name, '八つの音');
  for (const id of [HOLD, EIGHT]) assert.ok(ABILITIES[id].cmdOnly && ABILITIES[id].noAuto, id);
  for (const id of [ROBE, STRIKE, RAIN, MEASURE, SHINE, NAMES, SCENE]) assert.ok(ABILITIES[id], id);
  // 技の 名前は ほかの 技と かぶらない
  const others = Object.entries(ABILITIES).filter(([id]) => !C11D_ABILITIES[id]).map(([, a]) => a.name);
  for (const [id, a] of Object.entries(C11D_ABILITIES)) assert.ok(!others.includes(a.name), `${id}: ${a.name}`);
});

// ───────────── がめん ─────────────
test('がめん: 上の まど（女王 … 輪・ひとり・はかりの ねらい・八つの音／中ボス … 前に いる 方・まくの 色・思い出）・名前の 横の しるし・コマンド「手をつなぐ」→ だれと？・「八つの音」・中ボスは 今 ある コマンド・コマンドの 行き先', () => {
  const allies = [{ id: 'a0', name: 'ソラ', alive: true, abilities: [HOLD, EIGHT], ring11d: null }, { id: 'a1', name: 'ミナ', alive: true, ring11d: { c: 1, n: 3, left: 2, lock: 0 } }, { id: 'a2', name: 'ケン', alive: true, swept11d: 2 }];
  const q = { species: C11D_QUEEN, alive: true, c11dKind: 'queen', rings11d: [{ m: ['a1', 'spica', 'a3'], left: 1, color: 1, lock: 0 }], loose11d: ['a0'], measure11d: 'a0', shine11d: 0, phase11d: 2, eight11d: { left: 2, lock: 0, done: 1 }, scene11d: 0, solo11d: 0 };
  const top = c11dHtml([q], allies, 'a0');
  for (const w of ['手をつないだ輪', 'ミナ・スピカ', 'あと1', 'ひとり：ソラ', '八つの音：のこり', '光のはかりのねらいは、あなた']) assert.ok(top.html.includes(w), w);
  assert.ok(top.cls.includes('warn'));
  assert.ok(c11dHtml([{ ...q, c11dDown: 1 }], allies).html.includes('手を下ろした'));
  assert.ok(c11dHtml([{ ...q, scene11d: 1 }], allies).html.includes('八つめの音'));
  // 中ボスの まど
  const ms = { species: C11D_MIRROR, alive: true, front11d: 1, veil10: [3], swap11d: 0 };
  const mn = { species: C11D_MOON, alive: true, front11d: 0, forget11b: 1, forgetMax11b: 3, robe11b: 0 };
  const dt = c11dHtml([ms, mn], allies, 'a0');
  for (const w of ['前：ミラーレ', 'まく：', '青（ソ）', 'スピカの思い出', 'あと2', 'オボロ：うしろ']) assert.ok(dt.html.includes(w), w);
  assert.ok(c11dHtml([{ ...ms, c11dDuoDown: 1 }, mn], allies).html.includes('引いていった'));
  // バナー（大きな 知らせを 1つずつ）
  const banners = [];
  const sc2 = { banner: (t) => banners.push(t), _c11dBn: true, enemies: () => [q], allies: () => allies, myActor: allies[0], game: { audio: { sfx() {}, play() {} } } };
  for (const e of [{ c11dDazzle: {} }, { c11dEightUse: { ok: true, left: 1 } }, { c11dSweep: { id: 'a2' } }, { c11dMeasure: { held: true } }, { c11dHold: { ok: true, id: 'a0', to: 'spica', ring: ['a0', 'spica'], grew: true } }, { c11dMeasureUp: { aim: 'a0' } }, { c11dShine: { loose: ['a0'] } }, { c11dRingOff: {} }, { c11dSwap: { front: 'moon' } }, { c11dBreak: {} }, { c11dRobe: { left: 2 } }, { c11dDown: {} }, { c11dDuoDown: {} }]) c11dPresent(sc2, e);
  for (const w of ['まぶしすぎる', '八つの音', 'ながされた', 'はなれない', '手をつないだ', 'あなた', 'かがやき', 'はなれてしまった', 'オボロが前に', 'まくが、われた', 'わすれの衣', '手を下ろした', '引いていった']) assert.ok(banners.some((t) => t.includes(w)), w);
  // 名前の 横の しるし
  const kids = [];
  const parent = { querySelector: () => kids[0] || null };
  const name = { parentNode: parent, after: (el) => kids.push(el) };
  const fakeDoc = globalThis.document;
  globalThis.document = { createElement: () => ({ className: '', style: {}, classList: { toggle() {} }, remove() { kids.length = 0; } }), getElementById: () => true, head: { append() {} } };
  try {
    c11dStatus({ name }, { alive: true, hold11d: 1, ring11d: { c: 2, n: 3, left: 2, lock: 0 } });
    assert.equal(kids[0].textContent, '輪3・あと2');
    c11dStatus({ name }, { alive: true, hold11d: 1, swept11d: 2 });
    assert.equal(kids[0].textContent, 'ながされた・あと2');
    c11dStatus({ name }, { alive: true, hold11d: 1, aim11d: 1 });
    assert.equal(kids[0].textContent, 'はかられる！');
    c11dStatus({ name }, { alive: true });
    assert.equal(kids.length, 0);
  } finally {
    globalThis.document = fakeDoc;
  }
  // コマンド「手をつなぐ」（いちばん 上）・「八つの音」→ だれと？（スピカ・味方〈自分・ながされた 人 いがい〉。1回で 決定）
  const scene = { enemies: () => [q], allies: () => allies };
  const ci = c11dCmdItems(scene, allies[0]);
  assert.deepEqual(ci.items.map((x) => x.value), [C11D_CMD_B.hold, C11D_CMD_B.eight]);
  assert.ok(ci.items[0].html.includes('手をつなぐ') && ci.items[1].html.includes('のこり2回'));
  assert.ok(ci.info.includes('あなた'));
  const c9 = c9bCmdItems({ enemies: () => [q], allies: () => allies, c9spica: null }, allies[0]);
  assert.equal(c9.items[0].value, 'c11dhold', 'いちばん 上');
  const list = holdChoices(scene, allies[0]);
  assert.deepEqual(list.map((x) => x.value), ['spica', 'a1'], 'スピカ・味方（自分・ながされた 人 いがい）');
  assert.ok(list[0].label.includes('の輪') && list[1].label.includes('の輪'));
  assert.ok(holdChoices({ enemies: () => [{ ...q, solo11d: 1 }], allies: () => [allies[0]] }, allies[0]).some((x) => x.value === 'algol'), 'ひとりの 時は アルゴル');
  const sent = [];
  let menu = null;
  const sc = { enemies: () => [q], allies: () => allies, send: (m) => sent.push(m), showMenu: (l, pick, cancel, title, detail, start, keep, tapConfirm) => { menu = { list: l, pick, title, tapConfirm }; }, openCommand() {} };
  assert.equal(c11dCmdPick(sc, allies[0], 'c11dhold'), true);
  assert.ok(menu.title.includes('手をつなぐ') && !menu.tapConfirm);
  menu.pick(menu.list[1]);
  assert.equal(sc.targeting.side, 'ally', '味方の まどを タップしても えらべる');
  assert.equal(c11dCmdPick(sc, allies[0], 'c11deight'), true);
  assert.deepEqual(sent, [{ type: 'ability', id: HOLD, choice: 'a1' }, { type: 'ability', id: EIGHT }]);
  // 中ボス: 今 ある「音を鳴らす」「よびかける」と その まど（前に いる 方の コマンドが 上）
  const dAllies = [{ id: 'a0', name: 'ソラ', alive: true, abilities: [YOBIKAKE, NARASU] }, { id: 'a1', name: 'ミナ', alive: true, abilities: [YOBIKAKE, NARASU] }];
  const dsc = { enemies: () => [ms, mn], allies: () => dAllies, send: (m) => sent.push(m), showMenu: (l, pick, cancel, title) => { menu = { list: l, pick, title }; }, openCommand() {}, menu: null };
  const di = c11dCmdItems(dsc, dAllies[0]);
  assert.deepEqual(di.items.map((x) => x.value), ['c10dring', 'c11bcall'], 'ミラーレが 前 … 音を鳴らす が 上');
  assert.ok(di.items[0].html.includes('今だ'));
  const di2 = c11dCmdItems({ ...dsc, enemies: () => [{ ...ms, front11d: 0, veil10: [] }, { ...mn, front11d: 1 }] }, dAllies[0]);
  assert.deepEqual(di2.items.map((x) => x.value), ['c11bcall', 'c10dring'], 'オボロが 前 … よびかける が 上');
  sent.length = 0;
  assert.equal(c11dCmdPick(dsc, dAllies[0], 'c10dring'), true);
  assert.ok(menu.title.includes('どの音'), '6つの 音の まど');
  assert.ok(menu.list.find((x) => x.value === 3).html.includes('まくと同じ'), 'まくと 同じ 色に しるし');
  menu.pick(menu.list[3]);
  assert.equal(c11dCmdPick(dsc, dAllies[0], 'c11bcall'), true);
  assert.ok(menu.title.includes('よびかける'));
  menu.pick(menu.list[0]);
  assert.deepEqual(sent, [{ type: 'ability', id: NARASU, choice: 3 }, { type: 'ability', id: YOBIKAKE, choice: 'spica' }]);
  assert.equal(c11dCmdPick({ enemies: () => [] }, dAllies[0], 'c10dring'), false, 'ほかの 戦いは もとの まど');
  // コマンドの 行き先（battle.js → c8r → c9a → c9b → c11d）
  const route = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.ok(/case 'c11ceat': case 'c11dhold': case 'c11deight':[^\n]*return c8rCmdPick\(this, a, it\.value\)/.test(route), 'battle.js の 行き先（c11ceat の すぐ あと）');
  assert.ok(route.includes("case 'c10bring': case 'c10cmove': return c8rCmdPick"), '前の 行の ならびは そのまま');
  for (const f of ['battle-c8r.js', 'battle-c9a.js']) assert.ok(readFileSync(new URL(`../public/js/client/${f}`, import.meta.url), 'utf8').includes("value === 'c11dhold' || value === 'c11deight'"), f);
  assert.ok(readFileSync(new URL('../public/js/client/battle-c9b.js', import.meta.url), 'utf8').includes('if (c11dCmdPick(scene, a, value)) return true;'));
});

test('文字: 子ども向けの 漢字・文の 中に 空白なし（kanji-check の gameFiles に 入って いる）', () => {
  const mine = [
    'public/js/shared/data/c11d-names-b.js', 'public/js/shared/data/monsters-c11d.js', 'public/js/shared/data/abilities-c11d.js',
    'public/js/shared/data/encounters-c11d.js', 'public/js/shared/data/companions-c11d.js', 'public/js/shared/data/items-c11d.js', 'public/js/shared/data/boss-hints-c11d.js',
    'public/js/shared/battle-c11d.js', 'public/js/client/battle-c11d.js', 'public/js/client/render/c11d-art.js', 'public/js/client/render/c11d-bg.js', 'public/js/client/render/battlefx-c11d.js',
  ];
  const gf = gameFiles();
  for (const f of mine) {
    const g = gf.find((x) => x.replace(/\\/g, '/').endsWith(f));
    assert.ok(g, `${f} は gameFiles に ある`);
    assert.deepEqual(checkFile(g).filter((p) => p.kind !== 'kana'), [], f);
  }
});
