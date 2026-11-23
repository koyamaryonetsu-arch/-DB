// 第102回 B班: 第3部 第3章 第2幕「月の都と、名前のランプ」の 戦いと 品（docs/plan-part3-c11b.md の 18-4・18-5・18-6）
// 名前の 約束・うら道と 塔の 魔物・ランプの番人（明るい／暗い）・よびかける と 月のむかえ オボロ（わすれの 衣）・スピカが つれて いかれて 負け → やり直せる・
// 自動の 仲間・人数合わせ（few・bare・solo）・完全オートで 勝てない・スピカの ごほうび・品・ヒント・絵・背景・がめん（コマンドの 行き先）・
// もとの 昔話の 言葉を 使わない・文字
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
  C11B_B as C11B, C11B_DOORS_B, C11B_MAP_B, C11B_BATTLE_B as C11B_BATTLE, C11B_MON_PREFIX_B, C11B_CHEST_IDS_B, C11B_KEYS_B, C11B_CMD_B, C11B_TRACKS_B, C11B_OPEN_B,
} from '../public/js/shared/maps/c11b-flags.js';
import { C10A_B as C10A } from '../public/js/shared/maps/c10a-flags.js';
import { C10B_B as C10B } from '../public/js/shared/maps/c10b-flags.js';
import { C10C_B as C10C } from '../public/js/shared/maps/c10c-flags.js';
import { C10D_B as C10D } from '../public/js/shared/maps/c10d-flags.js';
import {
  MONSTERS_C11B, C11B_ALLEY_MON, C11B_TOWER_MON, C11B_TOWERB_MON, C11B_MINIONS, C11B_RECOLOR_BASE, C11B_NEW_ART, C11B_KEEPER, C11B_OBORO, C11B_TENNIN,
  KEEPER_NAME, OBORO_NAME, OBORO_SHORT, TENNIN_NAME, C11B_MAT_DROPS,
} from '../public/js/shared/data/monsters-c11b.js';
import { C11B_ABILITIES, YOBIKAKE } from '../public/js/shared/data/abilities-c11b.js';
import { ENCOUNTERS_C11B, FIXED_C11B, ZONE_BG_C11B, C11B_ZONES } from '../public/js/shared/data/encounters-c11b.js';
import { FRIENDS_C11B } from '../public/js/shared/data/companions-c11b.js';
import {
  ITEMS_C11B, C11B_TREASURE, C11B_K, C11B_SHOP_K, C11B_GEAR_CHESTS, C11B_FRONT_ARMS, C11B_BACK_TOOLS, C11B_BACK_FINDS, C11B_DROPS, NAME_LAMP, c11bChest,
} from '../public/js/shared/data/items-c11b.js';
import { C11A_K, C11A_SHOP_K } from '../public/js/shared/data/items-c11a.js';
import { C11B_BOSS_HINTS, C11B_HINT_WHO } from '../public/js/shared/data/boss-hints-c11b.js';
import {
  c11bConf, c11bTell, c11bPlan, c11bPub, c11bDamage, c11bAllyPub, keeperOf, oboroOf, tenninOf, tenninUp, phaseBest, SWITCH, ROBE, FLASH, AUTO_EVERY, SPICA, CALL_HP,
} from '../public/js/shared/battle-c11b.js';
import { SONG } from '../public/js/shared/battle-c9d.js';
import { c9Life, bestHit } from '../public/js/shared/battle-c9a.js';
import { partyNote } from '../public/js/shared/world/boss-hints.js';
import { ch9Run, ch9Party, LV9, CH9_KIT } from '../tools/sim-ch9.mjs';
import { CH11B_LV, CH10_NOTES } from '../tools/sim-ch11.mjs';
import { ORDER_FLAGS } from '../tools/sim-ch10.mjs';
import { canEquip } from '../public/js/shared/stats.js';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { playC11bFx, playC11bCall } from '../public/js/client/render/battlefx-c11b.js';
import { playC8cFx } from '../public/js/client/render/battlefx-c8c.js';
import { battleBgSpec } from '../public/js/client/render/battlefx.js';
import { C11B_BG } from '../public/js/client/render/c11b-bg.js';
import {
  C11B_SCREEN_ANIMS, C11B_ALLY_FX, C11B_SFX, C11B_OWN_TELE, c11bHtml, c11bSprite, c11bPresent, c11bCmdItems, c11bCmdPick, c11bStatus, c11bBannerOne, playCallCue,
} from '../public/js/client/battle-c11b.js';
import { c9bCmdItems } from '../public/js/client/battle-c9b.js';
import { CH4_ALLY_FX } from '../public/js/client/battle-ch4.js';
import { CH6_OWN_TELE } from '../public/js/client/battle-ch6.js';
import { allyAnimFor } from '../public/js/client/render/battlefx-r27.js';
import { forgetPinch } from '../public/js/client/audio-scene.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';

const groupOf = (id) => FIXED_ENCOUNTERS[id].group.flatMap(([sp, n]) => Array(n).fill(sp));
const BASE_FLAGS = { c9_child: true, c9_act1: true, c9_song1: true };
const ALL7 = { ...BASE_FLAGS, [C10A.noteRe]: true, [C10A.noteFa]: true, [C10B.noteSo]: true, [C10B.noteLa]: true, [C10C.noteSi]: true, [C10D.noteDo]: true, [C11B.act1]: true };
// kinds … 味方の 種類（'player' 家族の キャラ・'support' 酒場の 人・'monster' 魔物の 仲間）
function battle({ id = C11B_BATTLE.oboro, kinds = ['player', 'player', 'player', 'player'], seed = 3, flags = ALL7, enemies = null, auto = true } = {}) {
  const key = id === C11B_BATTLE.keeper ? 'keeper' : 'oboro';
  const four = ch9Party(key, CH11B_LV[key]);
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
const call = (b, a, choice) => act(b, a, { type: 'ability', id: YOBIKAKE, choice });
const nop = (b, a) => act(b, a, { type: 'defend' });
const allText = (ev) => [...(ev?.lines || []), ...(ev?.postLines || [])].join('\n');

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（18-5）: フラグ・とびらの しるし・マップ・決まった 戦い・魔物の id・宝箱・だいじな 物・コマンド・曲・幕の 切りかえ（maps/c11b-flags.js。かりの data/c11b-names-b.js は 消した）', () => {
  assert.deepEqual(C11B, {
    act1: 'c11_act1', start: 'c11b_start', plaza: 'c11b_plaza', back: 'c11b_back', rule: 'c11b_rule', tower: 'c11b_tower',
    keeper: 'c11b_keeper', lamp: 'c11b_lamp', oboro: 'c11b_oboro', act2: 'c11_act2',
  });
  assert.deepEqual(C11B_DOORS_B, Array.from({ length: 12 }, (_, i) => `c11b_d${i + 1}`));
  assert.deepEqual(Object.values(C11B_MAP_B), ['c11_sea', 'c11b_front', 'c11b_back', 'c11b_tower1', 'c11b_tower2', 'c11b_tower3', 'c11b_towerb1', 'c11b_towerb2', 'c11b_towerb3']);
  assert.deepEqual(C11B_BATTLE, { keeper: 'c11b_keeper', oboro: 'c11b_oboro' });
  for (const sp of Object.keys(MONSTERS_C11B)) assert.ok(sp.startsWith(C11B_MON_PREFIX_B), sp);
  assert.deepEqual(C11B_CHEST_IDS_B, ['c11b_c1', 'c11b_c2', 'c11b_c3', 'c11b_c4', 'c11b_c5', 'c11b_c6', 'c11b_c7', 'c11b_c8']);
  assert.deepEqual(Object.keys(C11B_TREASURE).sort(), [...C11B_CHEST_IDS_B].sort());
  assert.deepEqual(C11B_KEYS_B, { lamp: NAME_LAMP });
  assert.equal(NAME_LAMP, 'name_lamp');
  assert.equal(C11B_CMD_B, 'c11bcall');
  assert.equal(C11B_OPEN_B, 'PART3_C11B_OPEN');
  assert.deepEqual(Object.values(C11B_TRACKS_B), ['c11b_front', 'c11b_back', 'c11b_tower', 'c11b_plaza', 'c11b_call', 'c11b_keeper', 'c11b_oboro']);
  for (const id of Object.values(C11B_BATTLE)) {
    assert.ok(FIXED_C11B[id].boss && FIXED_C11B[id].canFlee === false && FIXED_ENCOUNTERS[id] === FIXED_C11B[id], id);
    assert.equal(FIXED_ENCOUNTERS[id].bgm, id, '曲は F班の id');
  }
  assert.deepEqual(groupOf(C11B_BATTLE.keeper), [C11B_KEEPER]);
  assert.deepEqual(groupOf(C11B_BATTLE.oboro), [C11B_TENNIN, C11B_OBORO, C11B_TENNIN], 'オボロと 天人 2体');
  // 出る 所の 表（うら道・塔の おもて・塔の うら）
  assert.deepEqual(C11B_ZONES, ['t11b_alley', 't11b_tower', 't11b_towerb']);
  for (const z of C11B_ZONES) assert.equal(ENCOUNTER_TABLES[z], ENCOUNTERS_C11B[z]);
  assert.deepEqual(ZONE_BG_C11B, { t11b_alley: 'c11b_alley', t11b_tower: 'c11b_tower', t11b_towerb: 'c11b_towerb' });
  for (const z of C11B_ZONES) assert.equal(ZONE_BG[z], ZONE_BG_C11B[z]);
});

// ───────────── うら道と 塔の 魔物 ─────────────
test('うら道と 塔の 魔物 7しゅ: Lv120〜122・仲間に なる・今の 素材・ランク・落とす 品・出る 表は おもてと うらで 分ける・新しい 絵 3しゅ ＋ 色ちがい 4しゅ', () => {
  assert.equal(C11B_MINIONS.length, 7);
  const kinds = (z) => new Set(ENCOUNTERS_C11B[z].flatMap((r) => r.group.map((g) => g[0])));
  for (const sp of C11B_ALLEY_MON) assert.ok(kinds('t11b_alley').has(sp), sp);
  for (const sp of C11B_TOWER_MON) assert.ok(kinds('t11b_tower').has(sp) && !kinds('t11b_towerb').has(sp), `${sp}: 塔の おもて だけ`);
  for (const sp of C11B_TOWERB_MON) assert.ok(kinds('t11b_towerb').has(sp) && !kinds('t11b_tower').has(sp), `${sp}: 塔の うら だけ`);
  for (const sp of C11B_MINIONS) {
    const m = MONSTERS[sp];
    assert.ok(m.lv >= 120 && m.lv <= 122, `${sp} Lv${m.lv}`);
    assert.equal(m.region, 6, sp);
    assert.ok(!m.boss, sp);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${sp}: ${a.id}`);
    const list = monsterDrops(sp);
    assert.ok(list.find((d) => d.kind === 'common') && list.find((d) => d.kind === 'rare'), sp);
    assert.ok(ITEMS[C11B_MAT_DROPS[sp][0]], `${sp}: 素材`);
    assert.deepEqual(MAT_DROPS[sp], C11B_MAT_DROPS[sp]);
    const f = MONSTER_FRIENDS[sp];
    assert.ok(f && f === FRIENDS_C11B[sp] && f.noFamily, `${sp}: 仲間に なる`);
    assert.ok(f.rate >= 1 / 26 && f.rate <= 1 / 10, sp);
    for (const [, id] of f.learn) assert.ok(ABILITIES[id], `${sp}: ${id}`);
    assert.ok(MONSTER_RANKS[sp], `${sp}: ランク`);
    assert.ok(MONSTER_ART[sp], `${sp}: え`);
  }
  assert.ok(C11B_NEW_ART.length <= 4, '新しい 絵は 4しゅまで');
  assert.equal(Object.keys(C11B_RECOLOR_BASE).length + C11B_NEW_ART.length, 7);
  for (const [sp, base] of Object.entries(C11B_RECOLOR_BASE)) assert.ok(MONSTER_ART[base] && MONSTER_ART[sp].tint, `${sp} は ${base} の 色ちがい`);
  // 月の都らしい 名前（月・ランプ・かげ・名前）。月の うさぎは 出さない
  const names = C11B_MINIONS.map((sp) => MONSTERS[sp].name).join('');
  for (const w of ['つき', 'ランプ', 'ろじうら', 'わすれ']) assert.ok(names.includes(w), w);
  assert.ok(!names.includes('うさぎ') && !names.includes('ウサギ'));
});

// ───────────── ランプの番人 ─────────────
test('ランプの番人: 明るい 間は 物理が 3わり・暗い 間は 呪文が 3わり（今の 明かりを 見て、きく 方で 攻める）・人が えらぶ 間は 待つ', () => {
  assert.equal(KEEPER_NAME, 'ランプの番人カンテラ');
  assert.equal(MONSTERS[C11B_KEEPER].lv, 121);
  const b = battle({ id: C11B_BATTLE.keeper });
  assert.ok(b.tellAll && b.mechBoss && mechBoss(b), 'しくみの ある ボス・人が えらぶ 間は 待つ');
  assert.ok(b.c9sp?.teru && b.c9sp?.song, 'スピカ（てらす・星のうた）');
  big(b);
  const k = keeperOf(b);
  quiet(k);
  k.hp = k.maxHp = 1e7;
  // ならび: 勇者・大賢者・ゴッドハンド・大神官
  const [hero, sage, monk] = b.allies;
  assert.equal(b.c11b.phase, 'light');
  assert.equal(c11bTell(b), 'keeper');
  const hit = (a, cmd) => { const h0 = k.hp; act(b, a, cmd); return h0 - k.hp; };
  // 明るい: 物理は 3わり・呪文は ふつう
  const st = b.c11b;
  const cut0 = st.cutHits;
  const ev = act(b, hero, { type: 'attack', target: k.id });
  assert.ok(st.cutHits > cut0 && allText(ev).includes('物理がはじかれた'), allText(ev));
  const magic = sage.abilities.find((id) => ABILITIES[id]?.kind === 'spell' && ABILITIES[id].effect?.type === 'magic' && ABILITIES[id].target === 'enemy');
  assert.ok(magic, '大賢者の 呪文');
  const good0 = st.goodHits;
  hit(sage, { type: 'ability', id: magic, target: k.id });
  assert.ok(st.goodHits > good0, '明るい 間の 呪文は ふつう');
  // 暗く する: 呪文は 3わり・物理は ふつう
  st.phase = 'dark';
  const c1 = st.cutHits;
  hit(sage, { type: 'ability', id: magic, target: k.id });
  assert.ok(st.cutHits > c1, '暗い 間の 呪文は 3わり');
  const g1 = st.goodHits;
  hit(hero, { type: 'attack', target: k.id });
  assert.ok(st.goodHits > g1, '暗い 間の 物理は ふつう');
  assert.equal(c11bConf(C11B_KEEPER, b).cut, 0.3);
  // 知って いる 人は 今の 明かりで 通る こうげきを えらぶ（暗い … 物理・明るい … 呪文）
  st.phase = 'dark';
  const pd = phaseBest(b, monk, k);
  assert.ok(pd.type === 'attack' || ABILITIES[pd.id]?.effect?.type === 'phys', JSON.stringify(pd));
  // 明るい: 呪文と 戦う だけ 持つ 大賢者は 呪文（物理は 3わり）
  const keep = sage.abilities;
  sage.abilities = keep.filter((id) => ABILITIES[id]?.kind === 'spell');
  st.phase = 'light';
  const pl = phaseBest(b, sage, k);
  assert.ok(ABILITIES[pl.id]?.effect?.type === 'magic', JSON.stringify(pl));
  sage.abilities = keep;
});

test('ランプの番人: every 回 動く ごとに 前ぶれ（ランプが ちらちら・名前の 横に しるし）→ 次の 番で 明かりが かわる ＋ 全体攻撃（防御で へる）', () => {
  const b = battle({ id: C11B_BATTLE.keeper });
  const k = keeperOf(b);
  quiet(k);
  const cf = c11bConf(C11B_KEEPER, b);
  assert.equal(cf.every, 4, '人4人');
  let warned = null;
  for (let i = 0; i < cf.every && !warned; i++) {
    const ev = foe(b, k);
    if (ev.c11bWarn) warned = ev;
  }
  assert.ok(warned && allText(warned).includes('ちらちら'), '前ぶれ');
  assert.equal(c11bTell(b), 'lamp', '前ぶれの 間は 人を 待つ');
  assert.equal(c11bPub(k).lampWarn11b, 1);
  assert.equal(c11bPub(k).lamp11b, 'light');
  // ひとりだけ 防御
  const [a0, a1] = b.allies;
  a0.defending = true;
  a1.defending = false;
  for (const a of b.allies) a.hp = a.maxHp;
  const ev = foe(b, k);
  assert.ok(ev.c11bSwitch, '明かりが かわる');
  assert.equal(b.c11b.phase, 'dark');
  assert.equal(c11bPub(k).lamp11b, 'dark');
  const lost = (a) => a.maxHp - a.hp;
  assert.ok(lost(a0) > 0 && lost(a0) < lost(a1) * 0.7, `防御で へる ${lost(a0)} / ${lost(a1)}`);
  assert.ok(b.c11b.waveGuards >= 1);
  assert.ok(MONSTERS[C11B_KEEPER].c11b.wave.guardCut <= 0.5);
});

// ───────────── よびかける と オボロ ─────────────
test('月のむかえ オボロ: わすれの衣（前ぶれ → 次の 番）で スピカの わすれ ＋1・「よびかける」を スピカに … −1・画面に 大きく「スピカの思い出　あと ○」', () => {
  assert.equal(OBORO_NAME, '月のむかえオボロ');
  assert.equal(MONSTERS[C11B_OBORO].lv, 122);
  assert.equal(TENNIN_NAME, '天人');
  const b = battle();
  assert.ok(b.tellAll && b.mechBoss && mechBoss(b));
  big(b);
  const o = oboroOf(b);
  for (const e of [o, ...tenninOf(b)]) quiet(e);
  const st = b.c11b;
  assert.equal(st.max, 3);
  assert.ok(b.allies.every((a) => a.abilities[0] === YOBIKAKE || a.abilities.includes(YOBIKAKE)), 'だれでも よびかける');
  // 前ぶれが 出るまで オボロを 動かす
  let up = null;
  for (let i = 0; i < 6 && !up; i++) { const ev = foe(b, o); if (ev.c11bRobeUp) up = ev; }
  assert.ok(up && allText(up).includes('衣'), '前ぶれ');
  assert.equal(c11bTell(b), 'robe');
  assert.equal(c11bPub(o).robe11b, 1);
  const ev = foe(b, o);
  assert.ok(ev.c11bRobe, '衣を かける');
  assert.equal(st.forget, 1);
  assert.equal(c11bPub(o).forget11b, 1);
  assert.ok(allText(ev).includes('スピカの思い出　あと2'));
  // よびかける（スピカ）… −1
  const cv = call(b, b.allies[0], SPICA);
  assert.ok(cv.c11bCall?.ok && cv.c11bCall.to === SPICA, JSON.stringify(cv.c11bCall));
  assert.equal(st.forget, 0);
  assert.ok(allText(cv).includes('スピカ！'));
  // わすれが 0 の 時は 何も 起こらない
  const cw = call(b, b.allies[1], SPICA);
  assert.equal(cw.c11bCall.ok, false);
  assert.equal(st.forget, 0);
  // 画面の 上の まど
  const top = c11bHtml([{ species: C11B_OBORO, forget11b: 2, forgetMax11b: 3, robe11b: 1, tennin11b: 2 }, { species: C11B_TENNIN, alive: true }], [], null);
  assert.ok(top.html.includes('スピカの思い出') && top.html.includes('あと<span class="n">1</span>') && top.html.includes('よびかける'), top.html);
  assert.ok(top.cls.includes('warn'));
  assert.ok(top.html.includes('mem hot'), 'あと 1 は 赤く ゆれる');
});

test('わすれが 3 で スピカが つれて いかれて 負け（全滅と 同じ あつかい。味方が 生きて いても）', () => {
  const b = battle();
  big(b);
  const o = oboroOf(b);
  for (const e of [o, ...tenninOf(b)]) quiet(e);
  const st = b.c11b;
  st.forget = 2;
  st.robeReady = true;
  const ev = foe(b, o);
  assert.ok(ev.c11bTaken, 'つれて いかれた');
  assert.equal(st.forget, 3);
  assert.ok(st.lost);
  assert.deepEqual(b.pendingEnd, { outcome: 'lose' });
  assert.ok(b.aliveAllies().length > 0, '味方は 生きて いる');
  assert.ok(allText(ev).includes('つれていかれてしまった'));
  assert.equal(c11bTell(b), null);
  assert.equal(c11bPub(o).c11bTaken, 1);
  for (let i = 0; i < 400 && !b.over; i++) b.tick(50);
  assert.equal(b.result.outcome, 'lose');
  // 負けた 時の ひとこと（partyNote）は 数えて いる（c9Life）
  const L = c9Life(b);
  assert.ok(L && L.died instanceof Set);
  assert.equal(typeof partyNote(C11B_BATTLE.oboro, b.allies, b), 'string');
});

test('わすれの光（前ぶれ → 次の 番・全体）: 当たった 人は 呪文か 特技を 2回の 番の 間 えらべない・防御で ふせげる・ほかの 人の よびかけで すぐ 治る・星のうたで みんな 治る', () => {
  const b = battle();
  big(b);
  const o = oboroOf(b);
  for (const e of [o, ...tenninOf(b)]) quiet(e);
  const st = b.c11b;
  st.flashReady = true;
  // ならび: 勇者・大賢者・ゴッドハンド・大神官
  const [hero, sage, monk, priest] = b.allies;
  hero.defending = true;
  const spells0 = sage.abilities.filter((id) => ABILITIES[id]?.kind === 'spell').length;
  assert.ok(spells0 > 0);
  const ev = foe(b, o);
  assert.ok(ev.c11bFlash, 'わすれの光');
  assert.ok(ev.c11bFlash.kept.includes(hero.id) && !hero.c11f, '防御で ふせぐ');
  assert.ok(sage.c11f && sage.c11f.kind === 'spell' && sage.c11f.left === 2, JSON.stringify(sage.c11f));
  assert.equal(sage.abilities.filter((id) => ABILITIES[id]?.kind === 'spell').length, 0, '呪文が えらべない');
  assert.ok(sage.abilities.includes(YOBIKAKE) && sage.abilities.includes(SONG), 'しくみの コマンドは のこる');
  assert.equal(b.validate(sage, { type: 'ability', id: sage.c11f.stash[0], target: o.id }).ok, false);
  assert.equal(c11bAllyPub(sage).forgot11b, 'spell');
  // 自分に よびかけても 治らない・ほかの 人の よびかけで すぐ 治る
  call(b, sage, sage.id);
  assert.ok(sage.c11f, '自分では 治らない');
  const cv = call(b, priest, sage.id);
  assert.ok(cv.c11bCall.cured && !sage.c11f);
  assert.equal(sage.abilities.filter((id) => ABILITIES[id]?.kind === 'spell').length, spells0, '呪文が もどる');
  assert.equal(c11bAllyPub(sage).forgot11b, null);
  // 2回の 番で 自然に 治る
  st.flashReady = true;
  hero.defending = false;
  foe(b, o);
  assert.ok(monk.c11f, 'ゴッドハンド');
  nop(b, monk);
  assert.ok(monk.c11f && monk.c11f.left === 1);
  nop(b, monk);
  assert.ok(!monk.c11f, '2回の 番で 思い出す');
  // 星のうたで みんな 治る
  st.flashReady = true;
  foe(b, o);
  const lost = b.allies.filter((a) => a.c11f);
  assert.ok(lost.length >= 2);
  b.c9sp.song.charge = b.c9sp.song.max;
  const sv = act(b, hero.c11f ? priest : hero, { type: 'ability', id: SONG });
  assert.ok(sv.c11bSong?.cured.length >= 1, JSON.stringify(sv.c11bSong));
  assert.ok(b.allies.every((a) => !a.c11f), 'みんな 治る');
});

test('天人: いる 間は オボロが かたい（受ける ダメージ 5わり）・たおしても オボロが back 回 動くと もどる（1回 前に 前ぶれ）・ひとりの 時は 天人 1体', () => {
  const b = battle();
  big(b);
  const o = oboroOf(b);
  for (const e of [o, ...tenninOf(b)]) quiet(e);
  o.hp = o.maxHp = 1e7;
  const hero = b.allies[0];
  const cf = c11bConf(C11B_OBORO, b);
  assert.equal(cf.hard, 0.5);
  const d = () => { const h0 = o.hp; act(b, hero, { type: 'attack', target: o.id }); return h0 - o.hp; };
  const r = [];
  for (let i = 0; i < 10; i++) r.push(d());
  const hard = r.reduce((s, x) => s + x, 0) / r.length;
  assert.ok(b.c11b && tenninUp(b).length === 2);
  for (const t of tenninOf(b)) { t.hp = 1; act(b, hero, { type: 'attack', target: t.id }); }
  assert.equal(tenninUp(b).length, 0);
  assert.equal(b.c11b.tKills, 2);
  const s = [];
  for (let i = 0; i < 10; i++) s.push(d());
  const soft = s.reduce((t, x) => t + x, 0) / s.length;
  assert.ok(soft > hard * 1.4, `天人が いない 時は よく 通る ${hard} → ${soft}`);
  // オボロが back 回 動くと もどる
  let soon = false;
  let back = 0;
  for (let i = 0; i < cf.back; i++) {
    b.c11b.robeLeft = 99;
    b.c11b.flashLeft = 99;
    const ev = foe(b, o);
    if (ev.c11bBackSoon) soon = true;
    if (ev.c11bBack) back++;
  }
  assert.ok(soon, '前ぶれ');
  assert.equal(tenninUp(b).length, 2, 'もどった');
  assert.ok(back >= 1);
  // ひとり（仲間 なし）
  const solo = battle({ kinds: ['player'] });
  assert.equal(tenninUp(solo).length, 1, 'ひとりの 時は 天人 1体');
  assert.equal(c11bConf(C11B_OBORO, solo).robe.every, 6, 'ひとりの 時は 衣が おそい');
});

test('見直し（2回め）: 天人は 全体の 技を 受けにくい（3わり）・オボロも 全体の 技は 少し・スピカの わすれが 1 いじょうの 間は オボロが かたい・はじめの 動きで 衣の 前ぶれ・知って いる 人は わすれ 1 で よびかける', () => {
  const cf = c11bConf(C11B_OBORO, battle());
  assert.equal(cf.aoeK, 0.3);
  assert.ok(cf.aoeBoss < 1 && cf.forgetK === 0.5);
  assert.equal(cf.robe.first, 1, 'はじめの 動きで 前ぶれ');
  // 全体の 技（的が 2つ いじょう）と 1体の 技で くらべる（同じ ダメージを 通す）
  const b = battle({ auto: false });
  const o = oboroOf(b);
  const [t1] = tenninOf(b);
  const hero = b.allies[0];
  const one = { fx: { targets: [t1.id] } };
  const all = { fx: { targets: [t1.id, o.id, 'x'] } };
  assert.equal(c11bDamage(b, hero, t1, 1000, { phys: true }, one), 1000, '1体を ねらうと ふつう');
  assert.equal(c11bDamage(b, hero, t1, 1000, { phys: true }, all), 300, '全体の 技は 3わり');
  for (const t of tenninOf(b)) { t.alive = false; t.hp = 0; }
  o.hp = o.maxHp = 1e7;
  b.c11b.forget = 0;
  const full = c11bDamage(b, hero, o, 1000, {}, { fx: { targets: [o.id] } });
  b.c11b.forget = 1;
  const veil = c11bDamage(b, hero, o, 1000, {}, { fx: { targets: [o.id] } });
  assert.equal(full, 1000);
  assert.equal(veil, 500, 'わすれ 1 いじょうの 間は かたい');
  b.c11b.forget = 0;
  assert.equal(c11bDamage(b, hero, o, 1000, {}, { fx: { targets: [o.id, 'x'] } }), Math.round(1000 * cf.aoeBoss));
  // はじめの オボロの 番で 衣の 前ぶれ
  const c = battle();
  big(c);
  const co = oboroOf(c);
  for (const e of [co, ...tenninOf(c)]) quiet(e);
  assert.ok(foe(c, co).c11bRobeUp, 'はじめの 番');
  // 知って いる 人: わすれ 1 で よびかける
  const k = battle({ auto: false });
  k.allies[0].knows9 = 'know';
  k.c11b.forget = 1;
  assert.deepEqual(c11bPlan(k, k.allies[0], () => ({ type: 'attack' }), bestHit), { type: 'ability', id: YOBIKAKE, choice: SPICA });
});

test('オボロ: HPが 半分を 切ると、衣を かけた あと つづけて もう 1回（すぐ 次の 前ぶれ）・勝つと オボロは たおれず 引く（HP 1）', () => {
  let twice = 0;
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    const b = battle({ seed });
    big(b);
    const o = oboroOf(b);
    for (const e of [o, ...tenninOf(b)]) quiet(e);
    o.hp = Math.floor(o.maxHp * 0.4);
    b.c11b.robeReady = true;
    const ev = foe(b, o);
    assert.ok(ev.c11bRobe);
    if (b.c11b.robeReady) twice++;
  }
  assert.ok(twice >= 1 && twice <= 5, `${twice}/6`);
  const b = battle();
  big(b);
  const o = oboroOf(b);
  for (const e of [o, ...tenninOf(b)]) quiet(e);
  for (const t of tenninOf(b)) { t.hp = 1; act(b, b.allies[0], { type: 'attack', target: t.id }); }
  o.hp = 5;
  const ev = act(b, b.allies[0], { type: 'attack', target: o.id });
  assert.ok(ev.c11bDown && o.hp === 1 && o.alive, '引いていく（たおれない）');
  assert.deepEqual(b.pendingEnd, { outcome: 'win' });
  assert.ok(b.killed.includes(C11B_OBORO), '経験値・落とし物は ふつう');
  assert.ok(allText(ev).includes('引いていった'));
});

test('自動の 仲間: 人が えらんで いる 時だけ、わすれが 2 いじょうで 3回に 1回 よびかける（完全オートは よびかけない）・知って いる 人は わすれ 2 で 必ず よびかける・光の 前ぶれで 防御', () => {
  assert.equal(AUTO_EVERY, 3);
  const b = battle({ kinds: ['player', 'support', 'support', 'support'], auto: false });
  const st = b.c11b;
  const sup = b.allies[1];
  st.forget = 1;
  assert.equal(c11bPlan(b, sup, () => ({ type: 'attack' }), bestHit), null, 'わすれ 1 では よばない');
  st.forget = 2;
  const outs = [0, 1, 2, 3, 4, 5].map(() => c11bPlan(b, sup, () => ({ type: 'attack' }), bestHit));
  assert.equal(outs.filter((x) => x?.id === YOBIKAKE && x.choice === SPICA).length, 2, '3回に 1回');
  // 完全オート（人が だれも えらんで いない）
  const full = battle({ kinds: ['player', 'support', 'support', 'support'], auto: true });
  full.c11b.forget = 2;
  for (let i = 0; i < 6; i++) assert.equal(c11bPlan(full, full.allies[1], () => ({ type: 'attack' }), bestHit), null);
  // 知って いる 人
  const k = battle({ auto: false });
  const a = k.allies[0];
  a.knows9 = 'know';
  k.c11b.forget = 2;
  assert.deepEqual(c11bPlan(k, a, () => ({ type: 'attack' }), bestHit), { type: 'ability', id: YOBIKAKE, choice: SPICA });
  k.c11b.forget = 0;
  k.c11b.flashReady = true;
  assert.deepEqual(c11bPlan(k, a, () => ({ type: 'attack' }), bestHit), { type: 'defend' });
  assert.ok(ABILITIES[YOBIKAKE].noAuto && ABILITIES[YOBIKAKE].cmdOnly, 'ふつうの オートは えらばない・特技の 一覧に 出さない');
});

test('人数で 合わせる: 家族の キャラの 数（few）・仲間なしの 2人・3人（bare）・ひとり（solo）。番人と オボロ', () => {
  const four = battle();
  const two = battle({ kinds: ['player', 'player'] });
  const three = battle({ kinds: ['player', 'player', 'player'] });
  const k1 = battle({ kinds: ['player', 'support', 'support', 'support'] });
  const solo = battle({ kinds: ['player'] });
  const ob = MONSTERS[C11B_OBORO].c11b;
  assert.equal(c11bConf(C11B_OBORO, four).hp, ob.few.hp[3]);
  assert.equal(c11bConf(C11B_OBORO, two).bare, 2);
  assert.equal(c11bConf(C11B_OBORO, two).hp, ob.bare.hp[0]);
  assert.equal(c11bConf(C11B_OBORO, three).hp, ob.bare.hp[1]);
  assert.equal(c11bConf(C11B_OBORO, k1).bare, 0, '自動の 仲間が いれば bare は きかない');
  assert.equal(c11bConf(C11B_OBORO, k1).hp, ob.few.hp[0]);
  assert.equal(c11bConf(C11B_OBORO, solo).hp, ob.solo.hp);
  assert.equal(c11bConf(C11B_OBORO, solo).tennin, 1);
  const kp = MONSTERS[C11B_KEEPER].c11b;
  assert.equal(c11bConf(C11B_KEEPER, two).hp, kp.bare.hp[0]);
  assert.equal(c11bConf(C11B_KEEPER, solo).every, kp.solo.every);
  // ゲストは 数えない
  const g = battle({ kinds: ['player', 'player'] });
  g.allies.push({ kind: 'guest', id: 'gx', alive: true });
  assert.equal(c11bConf(C11B_OBORO, g).bare, 2);
  // 1回で たおされすぎない: ふつうの 攻撃 1回が いちばん HPの 少ない 人の 最大HP を こえない（人4人・人5人）
  for (const [kinds, label] of [[['player', 'player', 'player', 'player'], '4人'], [['player', 'player', 'player', 'player', 'player'], '5人']]) {
    for (const id of Object.values(C11B_BATTLE)) {
      const b = battle({ id, kinds });
      const minHp = Math.min(...b.allies.map((a) => a.maxHp));
      for (const e of b.enemies) {
        for (const x of e.actions) {
          const eff = x.id === 'attack' ? { type: 'phys', mult: 1 } : ABILITIES[x.id].effect;
          if (eff.type !== 'phys' || ABILITIES[x.id]?.target === 'enemies') continue;
          const worst = Math.max(...b.allies.map((t) => b.calcPhys(e, t, eff, 1, 'phys', true).dmg * (e.dmgRate > 0 ? e.dmgRate : 1)));
          assert.ok(worst <= minHp * 1.02, `${label} ${e.name} ${x.id}: ${Math.round(worst)} / ${minHp}`);
        }
      }
    }
  }
});

// ───────────── 強さ ─────────────
test('強さ: 知って いる 人は 勝てる（2秒と 5秒で 勝率が 同じ）・完全オートは 勝てない（よびかけない ので つれて いかれる）・人2人だけも 勝てる（少しの 回数）', { timeout: 2400000 }, () => {
  assert.deepEqual(CH11B_LV, { keeper: 121, oboro: 122 });
  assert.deepEqual(ORDER_FLAGS.c11b.oboro, [...CH10_NOTES, C11B.act1]);
  for (const key of ['keeper', 'oboro']) {
    for (const [job, kit] of Object.entries(CH9_KIT[key])) for (const id of kit) if (id) assert.ok(canEquip(job, id), `${job}: ${id}`);
    const outs = {};
    for (const react of [2000, 5000]) {
      const know = [1, 2, 3, 4].map((s) => ch9Run(key, LV9[key], 'know', 9090 + s * 7919, { react, flags: ORDER_FLAGS.c11b[key] }));
      outs[react] = know.map((r) => r.outcome).join(',');
      assert.ok(know.filter((r) => r.outcome === 'win').length >= 2, `${key} ${react}: 知って いる 人 ${outs[react]}`);
    }
    assert.equal(outs[2000], outs[5000], `${key}: 2秒と 5秒で 同じ`);
    const auto = [1, 2, 3].map((s) => ch9Run(key, LV9[key], 'auto', 9090 + s * 7919, { flags: ORDER_FLAGS.c11b[key] }));
    assert.equal(auto.filter((r) => r.outcome === 'win').length, 0, `${key}: 完全オート`);
  }
  const taken = [1, 2].map((s) => ch9Run('oboro', LV9.oboro, 'auto', 9090 + s * 7919, { flags: ORDER_FLAGS.c11b.oboro, party: 'k1fam' }));
  assert.ok(taken.every((r) => r.outcome === 'lose' && r.oLost === 1), '1人＋家族の 仲間3 の 完全オートも つれて いかれる');
  const p2 = [1, 2, 3, 4].map((s) => ch9Run('oboro', LV9.oboro, 'know', 9090 + s * 7919, { flags: ORDER_FLAGS.c11b.oboro, party: 'p2' }));
  assert.ok(p2.filter((r) => r.outcome === 'win').length >= 1, `人2人だけ ${p2.map((r) => r.outcome)}`);
});

// ───────────── 見直し（3回め・ひとりだけ）─────────────
test('見直し（3回め）: ひとりだけの 表（solo）… 番人は 合わない 方も 6わり・明かりが 早く かわる・前ぶれを 見ないと 波が 重い・ほかの 組の 数は かわらない・ひとりでも 勝てる', { timeout: 1200000 }, () => {
  const kp = MONSTERS[C11B_KEEPER].c11b;
  const ob = MONSTERS[C11B_OBORO].c11b;
  assert.deepEqual(kp.solo, { hp: 0.75, atk: 0.61, spd: 0.75, every: 4, cut: 0.6, wave: 2.1 });
  assert.deepEqual(ob.solo, { hp: 0.65, atk: 0.48, robe: 6, back: 8, tennin: 1 });
  // ほかの 組（人2人 いじょう・1人＋自動の 仲間）は 前の まま
  assert.deepEqual(kp.few, { hp: [0.85, 0.95, 0.95, 1.1, 1.25], atk: [0.8, 0.9, 0.95, 1.05, 1.05], every: [5, 4, 4, 4, 4] });
  assert.deepEqual(kp.bare, { hp: [0.8, 0.9], atk: [0.85, 0.9] });
  assert.deepEqual(ob.few, { hp: [0.8, 0.97, 0.95, 1, 1.25], atk: [0.75, 0.92, 0.95, 1, 1.08], robe: [4, 3, 3, 3, 3], back: [5, 4, 5, 4, 3] });
  assert.deepEqual(ob.bare, { hp: [0.4, 0.68], atk: [0.53, 0.74], robe: [5, 4] });
  assert.equal(MONSTERS[C11B_KEEPER].hp, 13000);
  assert.equal(MONSTERS[C11B_KEEPER].str, 2450);
  assert.equal(MONSTERS[C11B_OBORO].hp, 10500);
  assert.equal(MONSTERS[C11B_OBORO].str, 2400);
  for (const kinds of [['player', 'player'], ['player', 'player', 'player', 'player'], ['player', 'support', 'support', 'support']]) {
    const cf = c11bConf(C11B_KEEPER, battle({ id: C11B_BATTLE.keeper, kinds }));
    assert.equal(cf.cut, 0.3, `${kinds}`);
    assert.equal(cf.wave.mult, 1.6, `${kinds}`);
    assert.equal(cf.spd, 1, `${kinds}`);
  }
  // ひとり: 表が きく（スピカは 味方に 数えない）
  const solo = battle({ id: C11B_BATTLE.keeper, kinds: ['player'] });
  const scf = c11bConf(C11B_KEEPER, solo);
  assert.equal(scf.cut, 0.6);
  assert.equal(scf.every, 4);
  assert.equal(scf.wave.mult, 2.1);
  assert.equal(scf.wave.guardCut, kp.wave.guardCut);
  const k = keeperOf(solo);
  assert.equal(k.maxHp, Math.round(MONSTERS[C11B_KEEPER].hp * 0.75));
  assert.equal(k.dmgRate, 0.61);
  // 明るい 間の 物理（合わない 方）も 6わり 通る … 片方しか 持たない 職業でも 手づまりに ならない
  big(solo);
  quiet(k);
  k.hp = k.maxHp = 1e7;
  const [hero] = solo.allies;
  const hit = (cmd) => { const h0 = k.hp; act(solo, hero, cmd); return h0 - k.hp; };
  const cut0 = solo.c11b.cutHits;
  const d = hit({ type: 'attack', target: k.id });
  assert.ok(d > 0 && solo.c11b.cutHits > cut0, 'はじかれた');
  // 強さ（少しの 回数）: ひとりの 知って いる 人は 番人にも オボロにも 勝てる・完全オートは 勝てない
  for (const key of ['keeper', 'oboro']) {
    const know = [0, 1, 2, 3].map((s) => ch9Run(key, LV9[key], 'know', 9090 + s * 7919, { party: 'solo', flags: ORDER_FLAGS.c11b[key] }));
    assert.ok(know.filter((r) => r.outcome === 'win').length >= 2, `${key} ひとり 知って いる ${know.map((r) => r.outcome)}`);
    const auto = [0, 1].map((s) => ch9Run(key, LV9[key], 'auto', 9090 + s * 7919, { party: 'solo', flags: ORDER_FLAGS.c11b[key] }));
    assert.equal(auto.filter((r) => r.outcome === 'win').length, 0, `${key} ひとり 完全オート`);
  }
});

test('本物の 流れ（tools/real-boss.mjs）: 番人・オボロも 回る・画面と 同じ 形の コマンド（よびかける … choice つき）が はねかえされない・スピカが つれて いかれて 負け → ヒント → もう一度 いどめる', { timeout: 600000 }, async () => {
  const { realRun, realSetup } = await import('../tools/real-boss.mjs');
  const prev = process.env.HUMAN;
  process.env.HUMAN = 'easy';
  try {
    const r = await realRun('oboro', 'p2', 9090);
    assert.ok(['win', 'lose'].includes(r.outcome), r.outcome);
    assert.equal(r.rej, 0, 'はねかえされた コマンドが ない');
    const k = await realRun('keeper', 'k1fam', 9090);
    assert.ok(['win', 'lose'].includes(k.outcome) && k.rej === 0);
  } finally {
    if (prev === undefined) delete process.env.HUMAN; else process.env.HUMAN = prev;
  }
  // スピカが つれて いかれる（本物の 流れ）
  const { startFixedBattle } = await import('../public/js/shared/world/battles.js');
  const { tickN } = await import('./helpers.js');
  const { world, humans, lead } = await realSetup('oboro', 'p2', 9191);
  let result = null;
  startFixedBattle(world, lead.s, humans.map((h) => h.s), C11B_BATTLE.oboro).then((x) => { result = x; });
  const b = [...world.battles.values()][0].battle;
  assert.ok(b.c11b?.kind === 'oboro');
  // 画面と 同じ 形の コマンド（よびかける・スピカ）
  const me = b.allies.find((a) => a.controller === lead.s.id);
  for (let i = 0; i < 400 && !me.ready; i++) await tickN(world, 1);
  b.c11b.forget = 1;
  const n0 = lead.msgs.length;
  lead.send({ t: 'battle', actor: me.id, cmd: { type: 'ability', id: YOBIKAKE, choice: SPICA } });
  assert.ok(!lead.msgs.slice(n0).some((m) => m.t === 'battleRej'), 'はねかえされない');
  for (let i = 0; i < 400 && b.c11b.forget > 0; i++) await tickN(world, 1);
  assert.equal(b.c11b.forget, 0, 'スピカの 思い出が もどる');
  // わすれ 2 で 衣 → つれて いかれる
  b.c11b.forget = 2;
  b.c11b.robeReady = true;
  for (const h of humans) for (const a of b.allies) if (a.controller === h.s.id) h.send({ t: 'battle', actor: a.id, auto: true });
  for (let i = 0; i < 4000 && !result; i++) await tickN(world, 1);
  assert.ok(result, '戦いが おわる');
  assert.equal(b.result.outcome, 'lose');
  assert.ok(b.c11b.lost, 'スピカが つれて いかれた');
  const hint = lead.s.bossHint;
  assert.ok(hint && hint.id === C11B_BATTLE.oboro && hint.n === 1 && hint.who === 'ノクト', JSON.stringify(hint));
  // もう一度 いどめる（同じ 決まった 戦いが また 始まる）
  for (let i = 0; i < 200 && world.battles.size; i++) await tickN(world, 1);
  for (const h of humans) { const c = world.data.characters[h.char.id]; c.hp = c.maxHp ?? c.hp; }
  let again = null;
  startFixedBattle(world, lead.s, humans.map((h) => h.s), C11B_BATTLE.oboro).then((x) => { again = x; });
  const b2 = [...world.battles.values()].map((c) => c.battle).find((x) => x !== b);
  assert.ok(b2?.c11b?.kind === 'oboro' && b2.c11b.forget === 0 && !b2.c11b.lost, 'やり直せる');
  void again;
  for (const h of humans) h.send({ t: 'quit' });
});

// ───────────── スピカの ごほうび ─────────────
test('スピカの ごほうび: この 幕の クリア（c11_act2）で 技「名前をよぶ声」… 戦いで 1回だけ、たおれた 仲間の 名前を よんで 生き返らせる（前の ごほうび〈ながれ星 など〉と 合わせて きく）', () => {
  const ALL8 = { ...ALL7, [C11B.act2]: true };
  const plain = battle({ enemies: ['c11b_moth', 'c11b_kage'], flags: ALL7 });
  const named = battle({ enemies: ['c11b_moth', 'c11b_kage'], flags: ALL8 });
  assert.ok(!plain.c11rew?.call);
  assert.ok(named.c11rew?.call && named.c11rew?.star, 'ながれ星も きく');
  assert.ok(named.c10rew?.glowStart, '前の ごほうびも きく');
  for (const e of named.enemies) quiet(e);
  const fallen = named.allies[2];
  fallen.alive = false;
  fallen.hp = 0;
  let ev = null;
  let got = null;
  for (let i = 0; i < 4 && !got; i++) for (const a of named.aliveAllies()) { ev = nop(named, a); if (ev?.c11bName) { got = ev; break; } }
  assert.ok(got, '名前をよぶ声');
  assert.ok(fallen.alive && fallen.hp === Math.max(1, Math.round(fallen.maxHp * CALL_HP)), `${fallen.hp}`);
  assert.ok(allText(got).includes(`スピカ「${fallen.name}！」`));
  // 戦いで 1回だけ
  fallen.alive = false;
  fallen.hp = 0;
  for (let i = 0; i < 3; i++) for (const a of named.aliveAllies()) { ev = nop(named, a); assert.ok(!ev?.c11bName, '2回めは ない'); }
  assert.equal(fallen.alive, false);
  // ゲストの Lv の 上限を この 幕に 合わせる
  assert.equal(GUEST_MAX_LEVEL, 124); // 第103回 B班: 第3幕で 122 → 124
});

// ───────────── 品 ─────────────
test('品: 宝箱 8こ（★5 は 3つ k 2.46〜2.50・のこりは 素材か 道具）・おもての 町の 店（防具 5つ k 2.36〜2.38）・うらの 町の 店（道具・少し 安い ほり出し物）・ボスの 品・名前のランプ・武器は 作らない', () => {
  // k は 前の 幕から 同じ はばで 上げる（★5 2.42〜2.46 → 2.46〜2.50・店 2.32〜2.34 → 2.36〜2.38）
  const step = 0.04;
  assert.deepEqual(Object.values(C11B_K), [2.46, 2.48, 2.5]);
  assert.ok(Math.abs(Math.min(...Object.values(C11B_K)) - Math.max(...Object.values(C11A_K))) < 1e-9);
  assert.ok(Math.abs(C11B_SHOP_K.lo - C11A_SHOP_K.lo - step) < 1e-9 && Math.abs(C11B_SHOP_K.hi - C11A_SHOP_K.hi - step) < 1e-9);
  assert.equal(C11B_GEAR_CHESTS.length, 3);
  for (const id of C11B_CHEST_IDS_B) {
    const c = c11bChest(id);
    assert.ok(c && ITEMS[c.item], id);
    const it = ITEMS[c.item];
    if (C11B_GEAR_CHESTS.includes(id)) {
      assert.ok(['armor', 'shield', 'head'].includes(it.type) && it.rarity === 4 && it.src === 'c11b', id);
      assert.equal(rareWhereText(c.item), '月の都の宝箱でしか手に入らない');
    } else assert.ok(it.type !== 'weapon' && !['armor', 'shield', 'head', 'acc'].includes(it.type), `${id}: 素材か 道具`);
  }
  assert.equal(c11bChest('nope'), null);
  for (const id of C11B_FRONT_ARMS) {
    const it = ITEMS[id];
    assert.ok(it && it.price > 0 && it.rarity === 0 && it.rank === 10 && ['armor', 'shield', 'head'].includes(it.type), id);
  }
  assert.equal(C11B_FRONT_ARMS.length, 5);
  // 前の 幕の 店より 1だん 上（同じ しゅるいで くらべる）
  assert.ok(ITEMS.c11bs_mail.def > ITEMS.c11as_mail.def && ITEMS.c11bs_robe.def >= ITEMS.c11as_robe.def && ITEMS.c11bs_shield.def >= ITEMS.c11as_shield.def);
  for (const id of C11B_BACK_TOOLS) assert.ok(ITEMS[id]?.price > 0, id);
  // ほり出し物: おもての 品と 同じ くらいの 強さで 少し 安い
  for (const id of C11B_BACK_FINDS) {
    const it = ITEMS[id];
    assert.ok(it && it.price > 0 && it.rank === 10, id);
    assert.ok(it.price < Math.min(...C11B_FRONT_ARMS.map((x) => ITEMS[x].price)), `${id}: 少し 安い`);
  }
  for (const it of Object.values(ITEMS_C11B)) assert.notEqual(it.type, 'weapon', '武器は 作らない');
  for (const id of Object.keys(ITEMS_C11B)) { assert.ok(PART3_LATE_ITEMS.has(id), id); assert.ok(ITEM_KANA[id], `${id} の 読みがな`); }
  assert.deepEqual(C11B_DROPS, { [C11B_KEEPER]: ['c11bb_lamp_chain'], [C11B_OBORO]: ['c11bb_oboro_sash'] });
  for (const [sp, [id]] of Object.entries(C11B_DROPS)) {
    const it = ITEMS[id];
    assert.ok(it.unique && it.type === 'acc' && it.src === 'pastboss' && it.boss === sp, id);
    assert.ok(Object.values(it.bonus).reduce((s, v) => s + v, 0) <= 287, id);
    assert.ok(monsterDrops(sp).some((d) => d.kind === 'boss' && d.item === id));
    assert.ok(!it.resist?.water, '水に 強い 装備は 作らない');
  }
  assert.equal(ITEMS[NAME_LAMP].type, 'key');
  assert.ok(ITEMS[NAME_LAMP].name.includes('名前のランプ'));
});

// ───────────── ヒント ─────────────
test('負けた 時の ヒント: オボロは 3だん・番人は 2だん（オボロの 文は 18-4 の まま）・言う 人は ノクト', () => {
  assert.equal(C11B_HINT_WHO, 'ノクト');
  assert.deepEqual(C11B_BOSS_HINTS[C11B_BATTLE.oboro], [
    'オボロの衣で、スピカの思い出が、消えていくぞ。',
    '「よびかける」で、スピカの名前をよべ。思い出がもどる。',
    '天人をたおすと、オボロにこうげきが通る。思い出が「あと1」になる前に、だれかがよびかけろ。',
  ]);
  assert.equal(C11B_BOSS_HINTS[C11B_BATTLE.keeper].length, 2);
  for (const id of Object.values(C11B_BATTLE)) {
    assert.deepEqual(BOSS_HINTS[id], C11B_BOSS_HINTS[id]);
    assert.equal(BOSS_HINT_WHO[id], 'ノクト');
    for (const t of C11B_BOSS_HINTS[id]) assert.ok(t.length <= 46, t);
  }
});

// ───────────── もとの 昔話 ─────────────
test('もとの 昔話（月からの むかえ）の 言葉と 絵を 使わない（「かぐや姫」「竹」「おじいさん おばあさん」）', () => {
  const BAD = ['かぐや', 'カグヤ', '輝夜', '竹', 'たけのこ', 'タケ', 'おじいさん', 'おばあさん', 'じいさん', 'ばあさん', 'みかど', 'ミカド', '帝'];
  const files = ['public/js/shared/data/monsters-c11b.js', 'public/js/shared/data/abilities-c11b.js', 'public/js/shared/data/items-c11b.js', 'public/js/shared/data/boss-hints-c11b.js',
    'public/js/shared/data/companions-c11b.js', 'public/js/shared/data/encounters-c11b.js', 'public/js/shared/battle-c11b.js', 'public/js/client/battle-c11b.js',
    'public/js/client/render/c11b-art.js', 'public/js/client/render/c11b-bg.js', 'public/js/client/render/battlefx-c11b.js'];
  // ゲームに 出る 文（コメントは のぞく。絵の 説明の コメントも 見る … 「かかない」の 行だけ のぞく）
  for (const f of files) {
    const src = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8').split('\n').filter((l) => !l.trim().startsWith('//') || !/かかない|使わない|もとは/.test(l)).join('\n');
    for (const w of BAD) assert.ok(!src.includes(w), `${f}: ${w}`);
  }
  const texts = [KEEPER_NAME, OBORO_NAME, TENNIN_NAME, ...Object.values(C11B_ABILITIES).flatMap((a) => [a.name, a.cast, a.desc]), ...Object.values(MONSTERS_C11B).flatMap((m) => [m.name, m.desc]), ...Object.values(ITEMS_C11B).flatMap((i) => [i.name, i.desc]), ...Object.values(C11B_BOSS_HINTS).flat()];
  for (const t of texts) for (const w of BAD) assert.ok(!String(t).includes(w), `${t}: ${w}`);
  // 女王の ことは 戦いの 文に 書かない・ネタバレの 名前も 出さない
  for (const t of texts) for (const w of ['女王', 'ソリトゥス', 'カイ', 'アルゴル']) assert.ok(!String(t).includes(w), `${t}: ${w}`);
  assert.ok(OBORO_SHORT === 'オボロ');
});

// ───────────── 絵・背景・えんしゅつ ─────────────
test('絵: 新しい 絵（ネコ・ランプ・雲）・ボス（番人・オボロ・天人）は 2倍の こまかさ（番人 コマ 2・3 … 暗い・オボロ コマ 2・3 … 引いていく）・背景 4つ・えんしゅつ', () => {
  for (const sp of C11B_NEW_ART) {
    const d = MONSTER_ART[sp];
    assert.ok(d && !d.tint && d.size.every((v) => v >= 20 && v <= 72), sp);
    assert.ok(d.pal.every((c) => /^#[0-9a-f]{6}$/i.test(c)), `${sp}: pal`);
  }
  for (const sp of [C11B_KEEPER, C11B_OBORO, C11B_TENNIN]) {
    assert.ok(MONSTER_ART[sp]?.size[0] >= 96, sp);
    assert.equal(MONSTERS[sp].artScale, 0.5, sp);
  }
  // え の えらび方（client/battle-c11b.js の c11bSprite）… monsterCanvas を 使うので 形だけ
  assert.equal(c11bSprite({ species: C11B_KEEPER, alive: true, lamp11b: 'light' }, 0), null, '明るい 時は ふつうの え');
  // 背景
  for (const bg of ['c11b_alley', 'c11b_tower', 'c11b_towerb', 'c11b_terrace']) {
    assert.ok(C11B_BG[bg], bg);
    assert.ok(battleBgSpec(bg)?.deco === bg, `${bg}: battlefx から とどく`);
  }
  assert.equal(FIXED_C11B[C11B_BATTLE.oboro].bg, 'c11b_terrace');
  assert.equal(FIXED_C11B[C11B_BATTLE.keeper].bg, 'c11b_tower');
  // えんしゅつ: 技の anim は ぜんぶ ある（battlefx-c8c.js から とどく）・大きく 出す 技・味方の まど・音・よびかけた 人の 足もとの 光
  const fx = new Proxy({}, { get: () => () => {} });
  const anims = [...new Set([...Object.values(C11B_ABILITIES).map((a) => a.anim), 'c11k_light', 'c11k_dark'])];
  for (const a of anims) {
    assert.equal(playC11bFx(fx, a, [{ x: 100, y: 60 }, { x: 140, y: 70 }], null, {}), true, a);
    assert.equal(playC11bFx(fx, a, [], null, {}), true, `${a}: 的が ない 時も`);
    assert.equal(playC8cFx(fx, a, [{ x: 100, y: 60 }], null, {}), true, `${a}: battlefx-c8c.js から とどく`);
    assert.ok(C11B_SFX[a] || a === 'c11k_light' || a === 'c11k_dark' ? true : false, `${a}: 音`);
  }
  playC11bCall(fx, { x: 10, y: 10 });
  playC11bCall(fx, { x: 10, y: 10 }, { x: 50, y: 50 });
  for (const a of C11B_SCREEN_ANIMS) assert.ok(anims.includes(a), a);
  for (const [a, v] of Object.entries(C11B_ALLY_FX)) assert.equal(CH4_ALLY_FX[a], v, a);
  for (const sp of C11B_OWN_TELE) assert.ok(CH6_OWN_TELE.has(sp), `${sp}: 前ぶれの バナーを 自分で 出す`);
  assert.equal(allyAnimFor({ type: 'ability', types: ['c11bCall'] }) ?? 'buff', 'buff');
});

// ───────────── がめん ─────────────
test('がめん: 上の まど（スピカの思い出・天人・前ぶれ／番人の 明るい・暗い）・仲間の まどの わすれの しるし・バナー（1つずつ）・コマンド「よびかける」→ だれに？（スピカ・味方）・コマンドの 行き先・よびかけた 音・曲の ピンチ', () => {
  // 番人の まど
  const kl = c11bHtml([{ species: C11B_KEEPER, alive: true, lamp11b: 'light', lampWarn11b: 0 }], [], null);
  assert.ok(kl.html.includes('明るい') && kl.html.includes('呪文が効く'), kl.html);
  const kd = c11bHtml([{ species: C11B_KEEPER, alive: true, lamp11b: 'dark', lampWarn11b: 1 }], [], null);
  assert.ok(kd.html.includes('暗い') && kd.html.includes('物理が効く') && kd.html.includes('防御') && kd.cls.includes('warn'), kd.html);
  // オボロの まど（つれて いかれた・引いていった・わすれて いる 自分）
  assert.ok(c11bHtml([{ species: C11B_OBORO, c11bTaken: 1 }], [], null).html.includes('つれていかれて'));
  assert.ok(c11bHtml([{ species: C11B_OBORO, c11bDown: 1 }], [], null).html.includes('引いていった'));
  const me = c11bHtml([{ species: C11B_OBORO, forget11b: 0, forgetMax11b: 3, tennin11b: 0 }], [{ id: 'a0', forgot11b: 'spell' }], 'a0');
  assert.ok(me.html.includes('呪文をわすれている'), me.html);
  // バナーは 1つずつ
  const removed = [];
  const shown = [];
  const olds = [{ remove: () => removed.push(1) }];
  const scene = { stage: { querySelectorAll: (q) => (q === '.b-banner' ? olds.splice(0) : []) }, banner(t, c) { shown.push([t, c]); }, enemies: () => [{ species: C11B_OBORO }], game: { audio: { sfx() {} } } };
  c11bBannerOne(scene);
  scene.banner('テスト', 'combo');
  assert.deepEqual(removed, [1]);
  assert.ok(shown[0][1].includes('c11b-bn'));
  const banners = [];
  const sc2 = { ...scene, banner: (t) => banners.push(t), _c11bBn: true };
  for (const e of [{ c11bTaken: {} }, { c11bCall: { ok: true, to: 'spica', left: 2, id: 'a0' } }, { c11bCall: { ok: true, cured: true, to: 'a1', id: 'a0' } }, { c11bRobe: { left: 1 } }, { c11bRobeUp: {} }, { c11bFlash: { hit: [], kept: [] } }, { c11bFlashUp: {} }, { c11bSong: { cured: ['a1'] } }, { c11bBack: {} }, { c11bOut: { left: 0 } }, { c11bWarn: { next: 'dark' } }, { c11bSwitch: { phase: 'light' } }, { c11bName: { to: 'a1' } }, { c11bDown: {} }]) c11bPresent(sc2, e);
  for (const w of ['つれていかれて', '思い出が、もどった', '思い出した', 'わすれの衣が、スピカに', 'わすれの衣が来る', 'わすれの光', '防御', 'みんな思い出した', 'もどってきた', '天人が消えた', 'ちらちら', '明るくなった', '生き返った', '引いていった']) assert.ok(banners.some((t) => t.includes(w)), w);
  // よびかけた 音（F班の c11b_call。cue が ない 時は きらきら）
  const cued = [];
  playCallCue({ cue: (id) => cued.push(id), sfx: () => cued.push('sfx') });
  playCallCue({ sfx: (id) => cued.push(id) });
  playCallCue({ tone: (f) => cued.push(f), sfx: () => cued.push('x') });
  assert.deepEqual(cued, ['c11b_call', 'sparkle', 659, 784, 880, 1760], 'ミ・ソ・ラ ＋ こだま');
  // 仲間の まど: わすれて いる 人の 名前の 横に しるし
  const kids = [];
  const parent = { querySelector: () => kids[0] || null };
  const name = { parentNode: parent, after: (el) => kids.push(el) };
  const fakeDoc = globalThis.document;
  globalThis.document = { createElement: () => ({ className: '', classList: { toggle() {} }, remove() { kids.length = 0; } }), getElementById: () => true, head: { append() {} } };
  try {
    c11bStatus({ name }, { alive: true, forgot11b: 'skill', forgotLeft11b: 2 });
    assert.equal(kids[0].textContent, 'わすれ：特技');
    c11bStatus({ name }, { alive: true, forgot11b: null });
    assert.equal(kids.length, 0);
  } finally {
    globalThis.document = fakeDoc;
  }
  // コマンド「よびかける」（いちばん 上）→ だれに？（スピカ・自分 いがいの 味方）
  const allies = [{ id: 'a0', name: 'ソラ', alive: true, abilities: [YOBIKAKE] }, { id: 'a1', name: 'ミナ', alive: true, forgot11b: 'spell' }, { id: 'a2', name: 'ケン', alive: false }];
  const ob = { species: C11B_OBORO, forget11b: 2, forgetMax11b: 3 };
  const ci = c11bCmdItems({ enemies: () => [ob], allies: () => allies }, allies[0]);
  assert.ok(ci.items[0].html.includes('よびかける') && ci.items[0].html.includes('あと1') && ci.items[0].value === C11B_CMD_B, JSON.stringify(ci.items));
  assert.ok(ci.info.includes('あと1'));
  const c9 = c9bCmdItems({ enemies: () => [ob], allies: () => allies, c9spica: null }, allies[0]);
  assert.equal(c9.items[0].value, 'c11bcall', 'いちばん 上');
  const sent = [];
  let menu = null;
  const sc = { enemies: () => [ob], allies: () => allies, send: (m) => sent.push(m), showMenu: (list, pick, cancel, title) => { menu = { list, pick, cancel, title }; }, openCommand() {} };
  assert.equal(c11bCmdPick(sc, allies[0], 'c11bcall'), true);
  assert.equal(menu.title, 'だれによびかける？');
  assert.deepEqual(menu.list.map((x) => x.value), ['spica', 'a1'], 'スピカ ＋ 生きて いる ほかの 味方');
  assert.ok(menu.list[0].label.includes('スピカ') && menu.list[1].label.includes('わすれている'));
  menu.pick(menu.list[0]);
  menu.pick(menu.list[1]);
  sc.targeting.done('a1');
  assert.deepEqual(sent, [{ type: 'ability', id: YOBIKAKE, choice: 'spica' }, { type: 'ability', id: YOBIKAKE, choice: 'a1' }, { type: 'ability', id: YOBIKAKE, choice: 'a1' }]);
  assert.equal(c11bCmdPick(sc, allies[0], 'c11apass'), false);
  // コマンドの 行き先（battle.js → c8r → c9a → c9b → c11b）
  const route = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.ok(/case 'c11bcall':[^\n]*return c8rCmdPick\(this, a, it\.value\)/.test(route), 'battle.js の 行き先');
  assert.ok(route.includes("case 'c10bring': case 'c10cmove': return c8rCmdPick"), '前の 行の ならびは そのまま');
  for (const f of ['battle-c8r.js', 'battle-c9a.js']) assert.ok(readFileSync(new URL(`../public/js/client/${f}`, import.meta.url), 'utf8').includes("value === 'c11bcall'"), f);
  assert.ok(readFileSync(new URL('../public/js/client/battle-c9b.js', import.meta.url), 'utf8').includes("if (value === 'c11bcall') return c11bCmdPick(scene, a, value);"));
  // 曲の ピンチ（スピカの 思い出 あと 1）
  assert.equal(forgetPinch([{ side: 'enemy', forget11b: 2, forgetMax11b: 3 }]), true);
  assert.equal(forgetPinch([{ side: 'enemy', forget11b: 1, forgetMax11b: 3 }]), false);
});

test('文字: 子ども向けの 漢字・文の 中に 空白なし（kanji-check の gameFiles に 入って いる）', () => {
  const mine = [
    'public/js/shared/data/monsters-c11b.js', 'public/js/shared/data/abilities-c11b.js',
    'public/js/shared/data/encounters-c11b.js', 'public/js/shared/data/companions-c11b.js', 'public/js/shared/data/items-c11b.js', 'public/js/shared/data/boss-hints-c11b.js',
    'public/js/shared/battle-c11b.js', 'public/js/client/battle-c11b.js', 'public/js/client/render/c11b-art.js', 'public/js/client/render/c11b-bg.js', 'public/js/client/render/battlefx-c11b.js',
  ];
  const gf = gameFiles();
  for (const f of mine) {
    const g = gf.find((x) => x.replace(/\\/g, '/').endsWith(f));
    assert.ok(g, `${f} は gameFiles に ある`);
    assert.deepEqual(checkFile(g).filter((p) => p.kind !== 'kana'), [], f);
  }
});
void SWITCH; void ROBE; void FLASH;
