// 第99回 B班: 第3部 第2章 第4幕「金の音と、星の橋」の 戦いと 品（docs/plan-part3-c10d.md の 16-2・16-3・16-4）
// 名前の 約束・音を鳴らす・門の 番人 4つ・ミラーレ（2つの 色を そろえる・光を はかる・うつし身・星のうた）・ちからの 水・スピカの ごほうび（金の 音）・
// 自動の 仲間・人数で 合わせる・強さ（人が できる 動き・完全オートは 作戦ごと・連戦 ぜんたい）・品・ヒント・絵・背景・がめん（コマンドの 行き先）・えんしゅつ・文字
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ITEMS, ITEM_KANA, PART3_LATE_ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { monsterDrops } from '../public/js/shared/data/loot.js';
import { MONSTER_FRIENDS } from '../public/js/shared/data/companions.js';
import { rareWhereText } from '../public/js/shared/data/rare-loot.js';
import { BOSS_HINTS, BOSS_HINT_WHO } from '../public/js/shared/data/boss-hints.js';
import { canEquip } from '../public/js/shared/stats.js';
import { TACTICS, mechBoss, decideAlly } from '../public/js/shared/ai.js';
import {
  C10D_B as C10D, C10D_WELL_B, C10D_PED_B, C10D_POWER_B, C10D_MAP_B, C10D_BATTLE_B as C10D_BATTLE, C10D_GATES_B, C10D_MON_PREFIX_B, C10D_BOSS_MON_B,
  C10D_CHEST_IDS_B, C10D_NOTES_B, C10D_TRACKS_B, C10D_OPEN_B,
} from '../public/js/shared/maps/c10d-flags.js';
import { C10A_B as C10A } from '../public/js/shared/maps/c10a-flags.js';
import { C10B_B as C10B } from '../public/js/shared/maps/c10b-flags.js';
import { C10C_B as C10C } from '../public/js/shared/maps/c10c-flags.js';
import {
  MONSTERS_C10D, C10D_SHARD, C10D_SHARD_W, C10D_SHARD_M, C10D_SHARD_S, C10D_GUARDS, C10D_MIRARE, C10D_COPY, C10D_RECOLOR_BASE, C10D_NEW_ART, MIRARE_NAME,
} from '../public/js/shared/data/monsters-c10d.js';
import { C10D_ABILITIES, NARASU } from '../public/js/shared/data/abilities-c10d.js';
import { FIXED_C10D, C10D_GATE_ORDER } from '../public/js/shared/data/encounters-c10d.js';
import { ITEMS_C10D, C10D_TREASURE, C10D_K, C10D_SHOP_K, C10D_GEAR_CHESTS, C10D_SHOP_ADD, C10D_DROPS, NOTE_DO, c10dChest } from '../public/js/shared/data/items-c10d.js';
import { C10D_BOSS_HINTS, C10D_HINT_WHO } from '../public/js/shared/data/boss-hints-c10d.js';
import {
  c10dConf, c10dTell, c10dPlan, c10dPub, c10dAllyPub, mirrorOf10d, copyOf10d, neededColors, veiled, NOTE_COLORS, POWER_K, AUTO_EVERY, MARK, MEASURE, DAZE,
} from '../public/js/shared/battle-c10d.js';
import { TERU, teruOf } from '../public/js/shared/battle-c9b.js';
import { SONG } from '../public/js/shared/battle-c9d.js';
import { REWARD_HEAL, REWARD_TERU } from '../public/js/shared/battle-c10a.js';
import { REWARD_SONG } from '../public/js/shared/battle-c10b.js';
import { REWARD_LIT } from '../public/js/shared/battle-c10c.js';
import { bestHit } from '../public/js/shared/battle-c9a.js';
import { ch9Run, ch9Party, LV9, CH9_KIT } from '../tools/sim-ch9.mjs';
import { ORDER_FLAGS, AUTO_TACTICS, CH10D_LV, c10dChain, pickWell10d, fieldHeal10d } from '../tools/sim-ch10.mjs';
import { MONSTER_ART, monsterSize, monsterFine } from '../public/js/client/render/monsters.js';
import { playC10dFx } from '../public/js/client/render/battlefx-c10d.js';
import { playC8cFx } from '../public/js/client/render/battlefx-c8c.js';
import { battleBgSpec } from '../public/js/client/render/battlefx.js';
import { C10D_VEIL_ART } from '../public/js/client/render/c10d-art.js';
import {
  C10D_SCREEN_ANIMS, C10D_ALLY_FX, C10D_SFX, C10D_OWN_TELE, c10dDraw, c10dPresent, c10dSprite, c10dCmdItems, c10dCmdPick, c10dHtml, noteMenuItems, refreshInfo,
} from '../public/js/client/battle-c10d.js';
import { c9bCmdItems } from '../public/js/client/battle-c9b.js';
import { CH4_ALLY_FX } from '../public/js/client/battle-ch4.js';
import { CH6_OWN_TELE } from '../public/js/client/battle-ch6.js';
import { firstSentence } from '../public/js/client/ui/skillinfo.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';

const groupOf = (id) => FIXED_ENCOUNTERS[id].group.flatMap(([sp, n]) => Array(n).fill(sp));
const BASE_FLAGS = { c9_child: true, c9_act1: true, c9_song1: true };
const ALL5 = { ...BASE_FLAGS, [C10A.noteRe]: true, [C10A.noteFa]: true, [C10B.noteSo]: true, [C10B.noteLa]: true, [C10C.noteSi]: true };
const KEY = { [C10D_BATTLE.gate1]: 'gate1', [C10D_BATTLE.gate2]: 'gate2', [C10D_BATTLE.gate3]: 'gate3', [C10D_BATTLE.gate4]: 'gate4', [C10D_BATTLE.mirror]: 'mirror' };
// kinds … 味方の 種類（'player' 家族の キャラ・'support' 酒場の 人・'monster' 魔物の 仲間）
function battle({ id = C10D_BATTLE.gate1, kinds = ['player', 'player', 'player', 'player'], seed = 3, flags = ALL5, enemies = null, auto = true, hooks = {} } = {}) {
  const four = ch9Party(KEY[id] || 'mirror', 118);
  const allies = kinds.map((k, i) => ({ char: structuredClone(four[i % 4]), kind: k, controller: k === 'player' ? 'sim' : null, auto: k === 'player' ? auto : true, tactics: 'balanced' }));
  return new Battle({ rng: makeRng(seed), boss: !enemies, canFlee: !!enemies, allies, enemies: enemies || groupOf(id), hooks: { leaderFlag: (f) => !!flags[f], ...hooks } });
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
const ring = (b, a, color) => act(b, a, { type: 'ability', id: NARASU, choice: color });
const hitOnce = (b, a, t) => { const hp = t.hp; act(b, a, { type: 'attack', target: t.id }); return hp - t.hp; };

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（16-4）: フラグ・いずみ・台・ちからの 水・マップ・決まった 戦い・魔物の id・宝箱・だいじな 物・曲・幕の 切りかえ（maps/c10d-flags.js。かりの 置き場は 消した）', () => {
  assert.deepEqual(C10D, {
    act3: 'c10_act3', start: 'c10d_start', top: 'c10d_top', gate1: 'c10d_gate1', gate2: 'c10d_gate2', gate3: 'c10d_gate3', gate4: 'c10d_gate4',
    mirror: 'c10d_mirror', noteDo: 'c10_note_do', bridge: 'c10d_bridge', act4: 'c10_act4',
  });
  assert.deepEqual(C10D_WELL_B, ['c10d_well1', 'c10d_well2', 'c10d_well3', 'c10d_well4']);
  assert.deepEqual(C10D_PED_B, { do: 'c10_ped_do' });
  assert.equal(C10D_POWER_B, 'c10d_power');
  assert.deepEqual(Object.values(C10D_MAP_B), ['c10d_stair1', 'c10d_stair2', 'c10d_stair3', 'c10d_summit']);
  assert.deepEqual(C10D_BATTLE, { gate1: 'c10d_gate1', gate2: 'c10d_gate2', gate3: 'c10d_gate3', gate4: 'c10d_gate4', mirror: 'c10d_mirror' });
  assert.deepEqual(C10D_GATES_B, C10D_GATE_ORDER);
  assert.deepEqual(C10D_BOSS_MON_B, { mirror: C10D_MIRARE, copy: C10D_COPY });
  assert.deepEqual([C10D_SHARD, C10D_SHARD_S, C10D_MIRARE, C10D_COPY], ['c10d_shard', 'c10d_shard_s', 'c10d_mirare', 'c10d_copy']);
  for (const sp of Object.keys(MONSTERS_C10D)) assert.ok(sp.startsWith(C10D_MON_PREFIX_B), sp);
  assert.deepEqual(C10D_CHEST_IDS_B, ['c10d_c1', 'c10d_c2', 'c10d_c3', 'c10d_c4', 'c10d_c5', 'c10d_c6']);
  assert.deepEqual(Object.keys(C10D_TREASURE).sort(), [...C10D_CHEST_IDS_B].sort());
  assert.deepEqual(C10D_NOTES_B, { do: NOTE_DO });
  assert.equal(NOTE_DO, 'note_do');
  assert.equal(C10D_OPEN_B, 'PART3_C10D_OPEN');
  assert.deepEqual(Object.values(C10D_TRACKS_B), ['c10d_stairs', 'c10d_gate', 'c10d_mirror', 'c10d_bridge', 'c10d_seven']);
  // 決まった 戦い: にげられない・ボス・曲は F班の id（先に つないだ）・星の 階段に 出る 表は ない
  for (const id of Object.values(C10D_BATTLE)) {
    assert.ok(FIXED_C10D[id].boss && FIXED_C10D[id].canFlee === false && FIXED_ENCOUNTERS[id] === FIXED_C10D[id], id);
    assert.equal(FIXED_ENCOUNTERS[id].bgm, id === C10D_BATTLE.mirror ? 'c10d_mirror' : 'c10d_gate');
  }
  assert.deepEqual(groupOf(C10D_BATTLE.gate1), [C10D_SHARD]);
  assert.deepEqual(groupOf(C10D_BATTLE.gate2), [C10D_SHARD_W, C10D_SHARD_W]);
  assert.deepEqual(groupOf(C10D_BATTLE.gate3), [C10D_SHARD_M, C10D_SHARD_M]);
  assert.deepEqual(groupOf(C10D_BATTLE.gate4), [C10D_SHARD_S, C10D_SHARD_S, C10D_SHARD_S]);
  assert.deepEqual(groupOf(C10D_BATTLE.mirror), [C10D_MIRARE, C10D_COPY]);
  assert.ok(!Object.keys(ENCOUNTER_TABLES).some((t) => t.startsWith('t10d')), '星の 階段は 魔物が 出ない');
});

// ───────────── 門の 番人 ─────────────
test('門の 番人: 4つ（Lv115〜117）・1体 → 2体 → 色が かわる ＋ 色を うつす → 小さい 3体・仲間に ならない・落とす 品の きまり・新しい 絵 2しゅ ＋ 色ちがい', () => {
  assert.deepEqual(C10D_GUARDS.map((sp) => MONSTERS[sp].lv), [115, 116, 116, 117]);
  for (const sp of C10D_GUARDS) {
    const m = MONSTERS[sp];
    assert.equal(m.c10d.kind, 'gate', sp);
    assert.ok(!m.boss, `${sp}: ボスの 品は ない（1体に 1つの 品は ミラーレだけ）`);
    assert.ok(!MONSTER_FRIENDS[sp], `${sp}: 仲間に ならない`);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${sp}: ${a.id}`);
    const list = monsterDrops(sp);
    const common = list.find((d) => d.kind === 'common');
    const rare = list.find((d) => d.kind === 'rare');
    assert.ok(common && rare && common.n <= 32 && rare.n >= 32 && rare.n <= 128, sp);
    assert.ok(['armor', 'shield', 'head', 'weapon', 'acc'].includes(ITEMS[rare.item].type), `${sp}: レアは 装備`);
    assert.equal(m.c10d.veilK, 0.2, 'まくが ある 間は 2わり');
    assert.equal(m.c10d.open, 3, 'われて 3回の 番');
  }
  assert.equal(MONSTERS[C10D_SHARD_M].c10d.shift > 0 && MONSTERS[C10D_SHARD_M].c10d.mark > 0, true, '門 3 … 色が かわる・色を うつす');
  for (const sp of [C10D_SHARD, C10D_SHARD_W, C10D_SHARD_S]) assert.ok(!MONSTERS[sp].c10d.shift && !MONSTERS[sp].c10d.mark, sp);
  assert.equal(MONSTERS[C10D_SHARD_S].size, 'm');
  assert.ok(MONSTERS[C10D_SHARD_S].actions.some((a) => ABILITIES[a.id]?.target === 'enemies'), '門 4 … 全体攻撃');
  assert.deepEqual([...C10D_NEW_ART].sort(), [C10D_SHARD, C10D_SHARD_S].sort());
  assert.deepEqual(Object.values(C10D_RECOLOR_BASE), [C10D_SHARD, C10D_SHARD]);
  // ミラーレ: Lv118・1人 1つの 品
  assert.equal(MONSTERS[C10D_MIRARE].lv, 118);
  assert.equal(MONSTERS[C10D_MIRARE].name, MIRARE_NAME);
  assert.equal(MONSTERS[C10D_COPY].exp, 0);
});

test('音を鳴らす: 門と ボスの 戦いだけ・6つの 音（レ赤・ミ黄・ファ緑・ソ青・ラ白・シむらさき）・同じ 色で まくが われる・ちがう 色は 何も 起きない・特技の 一覧には 出さない', () => {
  assert.deepEqual(NOTE_COLORS.map((n) => `${n.note}${n.name}`), ['レ赤', 'ミ黄', 'ファ緑', 'ソ青', 'ラ白', 'シむらさき']);
  assert.equal(ABILITIES[NARASU].name, '音を鳴らす');
  assert.ok(ABILITIES[NARASU].noAuto && ABILITIES[NARASU].cmdOnly);
  const plain = battle({ enemies: ['c10c_sheep'] });
  assert.ok(!plain.allies[0].abilities.includes(NARASU), 'ふつうの 戦いには 出ない');
  const b = battle();
  assert.ok(b.allies.every((a) => a.abilities.includes(NARASU)));
  assert.ok(b.tellAll && b.mechBoss && mechBoss(b), 'ずっと 待つ・しくみの ある ボスの しるし');
  const m = b.enemies[0];
  quiet(m);
  big(b);
  const col = m.c10v.colors[0];
  assert.ok(Number.isInteger(col) && veiled(m));
  assert.equal(m.name, `${m.c10v.base}（${NOTE_COLORS[col].name}）`, '名前の 横に 色の 名前');
  assert.equal(c10dTell(b), 'gate');
  // まくが ある 間は 2わり
  const a = b.allies[2];
  const d0 = hitOnce(b, a, m);
  // ちがう 色 … 何も 起きない
  const wrong = (col + 1) % 6;
  const e1 = ring(b, b.allies[0], wrong);
  assert.equal(e1.c10dRing.ok, false);
  assert.ok([...e1.lines, ...(e1.postLines || [])].join('').includes('音が、合わない'));
  assert.ok(veiled(m));
  // 同じ 色 … われる（3回の 番の 間 ふつうに 通る）
  const e2 = ring(b, b.allies[1], col);
  assert.deepEqual(e2.c10dBreak, [m.id]);
  assert.ok(!veiled(m) && m.c10v.open === 3);
  assert.equal(m.name, m.c10v.base);
  const d1 = hitOnce(b, a, m);
  assert.ok(d1 > d0 * 3, `われると ふつうに 通る ${d0} → ${d1}`);
  // 番人が 3回 動くと べつの 色を まとい直す
  for (let i = 0; i < 2; i++) foe(b, m);
  assert.ok(!veiled(m));
  const e3 = foe(b, m);
  assert.ok(veiled(m) && e3.c10dVeil, 'まとい直した');
  assert.notEqual(m.c10v.colors[0], col, 'べつの 色');
  // pub
  const p = c10dPub(m, b);
  assert.deepEqual(p.veil10, m.c10v.colors);
  assert.equal(p.c10Kind, 'gate');
  assert.equal(c10dAllyPub(b.allies[0], b).ring10, 1);
});

test('門 2〜4: 2体は 色が ちがう・門 3 は まとい直す たびに 色が かわる ＋「色を うつす」（しるしの 人は 番が おそい・同じ 色で 消える）・門 4 は 小さい 3体・まくが ある 間は 少し 回復', () => {
  const g2 = battle({ id: C10D_BATTLE.gate2 });
  assert.notEqual(g2.enemies[0].c10v.colors[0], g2.enemies[1].c10v.colors[0], '2体の 色は ちがう');
  const g4 = battle({ id: C10D_BATTLE.gate4 });
  assert.equal(new Set(g4.enemies.map((e) => e.c10v.colors[0])).size, 3, '3体とも ちがう 色');
  // 1つの 色で 1体だけ われる
  big(g2);
  for (const e of g2.enemies) quiet(e);
  const c0 = g2.enemies[0].c10v.colors[0];
  ring(g2, g2.allies[0], c0);
  assert.ok(!veiled(g2.enemies[0]) && veiled(g2.enemies[1]));
  // 門 3: 色が かわる・色を うつす
  const g3 = battle({ id: C10D_BATTLE.gate3 });
  big(g3);
  const m = g3.enemies[0];
  for (const e of g3.enemies) quiet(e);
  const cf = c10dConf(C10D_SHARD_M, g3);
  const seen = new Set([m.c10v.colors[0]]);
  let marked = null;
  for (let i = 0; i < 8 && !marked; i++) {
    const ev = foe(g3, m);
    seen.add(m.c10v.colors[0]);
    if (ev?.c10dMark) marked = ev.c10dMark;
  }
  assert.ok(marked, '色を うつした');
  assert.ok(seen.size >= 2, `色が かわる ${[...seen]}`);
  assert.equal(cf.mark, 3);
  const t = g3.get(marked.to);
  assert.equal(t.c10mark, marked.color);
  assert.equal(t.tmul, cf.markK, 'しるしの 人は 番が おそい');
  assert.notEqual(m.c10v.colors[0], marked.color, 'うつした あとは べつの 色');
  assert.equal(c10dAllyPub(t, g3).mark10, marked.color);
  assert.ok(neededColors(g3).includes(marked.color));
  const e = ring(g3, g3.allies.find((x) => x !== t) || t, marked.color);
  assert.deepEqual(e.c10dRing.unmark, [t.id]);
  assert.equal(t.c10mark, undefined);
  assert.equal(t.tmul, undefined);
  // まくが ある 間は 動く たびに 4%（門 4 は 7%）回復
  const r = battle({ id: C10D_BATTLE.gate1 });
  const s = r.enemies[0];
  quiet(s);
  s.hp = Math.round(s.maxHp * 0.5);
  const ev = foe(r, s);
  assert.ok(ev.c10dRegen && s.hp > s.maxHp * 0.5, 'まくの 間は 回復');
  assert.equal(c10dConf(C10D_SHARD_S, g4).regen, 0.07);
});

// ───────────── ミラーレ ─────────────
test('ミラーレ: 2色の まく（2わり）・2色とも 鳴らすと われる（1色めから ミラーレが 2回 動く 前に 2色め・間に 合わないと もどる）・われると 4回の 番の 間 通って 1回 休む・べつの 2色に', () => {
  const b = battle({ id: C10D_BATTLE.mirror });
  const m = mirrorOf10d(b);
  quiet(m);
  big(b);
  assert.equal(m.species, C10D_MIRARE);
  assert.equal(m.c10v.colors.length, 2, '4人は 2色');
  assert.equal(c10dTell(b), 'mirror');
  // うつし身は はじめ 見えない
  const cp = copyOf10d(b);
  assert.ok(cp && !cp.alive);
  const [c1, c2] = m.c10v.colors;
  // 1色め → しるしが 消えて「あと 2回」
  ring(b, b.allies[0], c1);
  assert.deepEqual(m.c10v.colors, [c2]);
  assert.equal(m.c10v.left, 2);
  assert.equal(c10dPub(m, b).left10, 2);
  assert.ok(veiled(m), '1色 だけでは われない');
  // 2回 動くと もどる
  foe(b, m);
  assert.deepEqual(m.c10v.colors, [c2]);
  const back = foe(b, m);
  assert.ok(back.c10dBack, 'もどった');
  assert.deepEqual([...m.c10v.colors].sort(), [c1, c2].sort());
  // どちらの じゅんでも: 2色め → 1色め で われる
  ring(b, b.allies[1], c2);
  const e = ring(b, b.allies[2], c1);
  assert.deepEqual(e.c10dBreak, [m.id]);
  assert.ok(!veiled(m) && m.c10v.daze);
  // われた あと: はじめの 1回は 休む → 4回で まとい直す（べつの 2色）
  const e1 = foe(b, m);
  assert.ok(e1.c10dDaze, '休む');
  for (let i = 0; i < 2; i++) foe(b, m);
  assert.ok(!veiled(m));
  const e4 = foe(b, m);
  assert.ok(e4.c10dVeil && veiled(m));
  assert.equal(m.c10v.colors.length, 2);
  assert.ok(!m.c10v.colors.includes(c1) && !m.c10v.colors.includes(c2), 'べつの 2色');
});

test('ミラーレ: 光を はかる（前ぶれ → いちばん HPが 多い 人へ・防御で へる）・うつし身（HP 半分・味方の すがたと 技 1つ・てらすで 消える）・星のうた（1色 へる）・勝つと ひび（たおれない）', () => {
  const b = battle({ id: C10D_BATTLE.mirror, seed: 5 });
  const m = mirrorOf10d(b);
  quiet(m);
  for (const a of b.allies) { a.maxHp = a.hp = 30000; }
  b.allies[2].hp = 30000;
  b.allies[0].hp = 20000;
  const cf = c10dConf(C10D_MIRARE, b);
  let up = null;
  for (let i = 0; i < 6 && !up; i++) up = foe(b, m)?.c10dMeasureUp;
  assert.ok(up, '光を はかるの 前ぶれ');
  assert.equal(c10dTell(b), 'measure');
  const aim = b.get(up.aim);
  assert.equal(aim.hp, Math.max(...b.aliveAllies().map((x) => x.hp)), 'いちばん HPが 多い 人');
  assert.equal(c10dPub(m, b).measureAim, aim.id);
  // 防御で へる
  const hp0 = aim.hp;
  aim.defending = true;
  const ev = foe(b, m);
  assert.ok(ev.c10dMeasure?.guard);
  const guarded = hp0 - aim.hp;
  const b2 = battle({ id: C10D_BATTLE.mirror, seed: 5 });
  const m2 = mirrorOf10d(b2);
  quiet(m2);
  for (const a of b2.allies) { a.maxHp = a.hp = 30000; }
  const t2 = b2.allies[1];
  m2.c10v.measureReady = true;
  m2.c10v.measureAim = t2.id;
  foe(b2, m2);
  const open = 30000 - t2.hp;
  assert.ok(guarded < open * 0.6, `防御で へる ${guarded} < ${open}`);
  assert.ok(cf.measure.guardCut <= 0.4);
  // うつし身: HPが 半分を 切ると 1体
  m.hp = Math.floor(m.maxHp * 0.45);
  const ce = foe(b, m);
  const cp = copyOf10d(b);
  assert.ok(ce.c10dCopy && cp.alive, 'うつし身が 出た');
  const who = b.get(cp.mirrorOf);
  assert.ok(who && who.side === 'ally' && cp.name === `${who.name}のうつし身`);
  assert.ok(cp.abilities.length <= 1, '技は 1つ');
  assert.ok(cp.maxHp < who.maxHp && cp.atk < who.atk, '弱い');
  assert.ok(c10dPub(m, b).copyOut);
  // てらすで 消える
  b.c9sp.teru.charge = b.c9sp.teru.max;
  const te = act(b, b.allies[3], { type: 'ability', id: TERU });
  assert.ok(te.c10dCopyGone && !cp.alive);
  // 星のうた: 1色 へる（次の 1回だけ 1色で われる）
  m.c10v.colors = [0, 5];
  m.c10v.rung = [];
  b.c9sp.song.charge = b.c9sp.song.max;
  const se = act(b, b.allies[0], { type: 'ability', id: SONG });
  assert.ok(se.c10dSong);
  assert.equal(m.c10v.colors.length, 1);
  const last = m.c10v.colors[0];
  const br = ring(b, b.allies[1], last);
  assert.deepEqual(br.c10dBreak, [m.id], '1色で われた');
  // まくが ない 時の 星のうた: 次の まくが 1色
  b.c9sp.song.charge = b.c9sp.song.max;
  act(b, b.allies[2], { type: 'ability', id: SONG });
  assert.ok(m.c10v.sungNext);
  // 勝つ: HP 1 で 止まる（ひびが 入って 帰る）
  m.c10v.colors = [];
  m.hp = 3;
  const we = act(b, b.allies[2], { type: 'attack', target: m.id });
  assert.ok(we.c10dDown);
  assert.equal(m.hp, 1);
  assert.ok(m.alive, 'たおれない');
  assert.ok(b.killed.includes(C10D_MIRARE) && b.pendingEnd?.outcome === 'win');
  assert.ok([...we.lines, ...(we.postLines || [])].join('').includes('ひび'));
  assert.equal(c10dPub(m, b).c10Down, 1);
  assert.equal(c10dPub(m, b).mirrorStage, 4);
  for (const id of [MARK, MEASURE, DAZE]) assert.ok(ABILITIES[id], id);
});

// ───────────── ちからの 水・スピカの ごほうび ─────────────
test('ちからの 水（リーダーの フラグ c10d_power か 戦いの hooks.c10dPower）: 味方 全員の 与える ダメージ 1.2倍・どの 戦いでも', () => {
  assert.equal(POWER_K, 1.2);
  const dmg = (opts) => {
    const b = battle({ enemies: ['c10c_sheep'], seed: 9, ...opts });
    const e = b.enemies[0];
    e.maxHp = e.hp = 999999;
    quiet(e);
    let s = 0;
    for (let i = 0; i < 8; i++) s += hitOnce(b, b.allies[2], e);
    return { s, b };
  };
  const base = dmg({});
  const flagged = dmg({ flags: { ...ALL5, [C10D_POWER_B]: true } });
  const hooked = dmg({ hooks: { c10dPower: true } });
  assert.equal(base.b.c10dPower, undefined);
  assert.equal(flagged.b.c10dPower, POWER_K);
  assert.equal(hooked.b.c10dPower, POWER_K);
  assert.ok(flagged.s > base.s * 1.12 && flagged.s < base.s * 1.3, `${base.s} → ${flagged.s}`);
  assert.ok(hooked.s > base.s * 1.12, `${base.s} → ${hooked.s}`);
  // 門の 戦いでも（まくと かさなる）
  const g = battle({ hooks: { c10dPower: true } });
  assert.equal(g.c10dPower, POWER_K);
});

test('スピカの ごほうび: 金の 音（c10_note_do）で「ほのかな光」が 戦いの はじめにも 1回・前の 5つの ごほうびと 合わせて きく', () => {
  const ALL6 = { ...ALL5, [C10D.noteDo]: true };
  const plain = battle({ enemies: ['c10c_sheep'], flags: ALL5 });
  const gold = battle({ enemies: ['c10c_sheep'], flags: ALL6 });
  assert.equal(plain.c9sp.glows, 0);
  assert.equal(gold.c9sp.glows, 1, 'はじめの ほのかな光');
  assert.deepEqual(gold.c10rew, { heal: REWARD_HEAL, teruMax: REWARD_TERU, songMax: REWARD_SONG, teruFull: true, teruLit: REWARD_LIT, glowStart: true });
  assert.equal(teruOf(gold).charge, REWARD_TERU, 'てらすは はじめから たまって いる まま');
  assert.equal(gold.c9sp.song.charge, plain.c9sp.song.charge + 1, '星のうたが 1つ たまる');
  // HPが へって いる 人が いれば 回復（赤の 音の 9%）
  const four = ch9Party('mirror', 118);
  four[1].hp = Math.round(four[1].hp * 0.5);
  const allies = four.map((c) => ({ char: c, kind: 'player', controller: 'sim', auto: true, tactics: 'balanced' }));
  const hb = new Battle({ rng: makeRng(1), allies, enemies: ['c10c_sheep'], hooks: { leaderFlag: (f) => !!ALL6[f] } });
  assert.ok(hb.c9sp.heals > 0, 'はじめの ほのかな光で 回復');
  // ボスの 戦い（金の 音は まだ ない）では ない
  assert.ok(!battle({ id: C10D_BATTLE.mirror }).c10rew?.glowStart);
});

// ───────────── 自動の 仲間・人数 ─────────────
test('自動の 仲間: 人が えらんで いる 時だけ、3回に 1回 正しい 色を 鳴らす（完全オートは 鳴らさない）', () => {
  const b = battle({ kinds: ['player', 'support', 'support', 'support'], auto: false });
  const m = b.enemies[0];
  quiet(m);
  big(b);
  const sup = b.allies[1];
  const picks = [0, 1, 2, 3, 4, 5].map(() => c10dPlan(b, sup, decideAlly, bestHit));
  const rings = picks.filter((p) => p?.id === NARASU);
  assert.equal(rings.length, 6 / AUTO_EVERY, JSON.stringify(picks));
  assert.ok(rings.every((p) => p.choice === m.c10v.colors[0]), '正しい 色');
  // 完全オート（みんな オート）・家族の キャラの オートは 鳴らさない
  const fa = battle({ kinds: ['player', 'support', 'support', 'support'], auto: true });
  for (let i = 0; i < 6; i++) assert.equal(c10dPlan(fa, fa.allies[1], decideAlly, bestHit), null);
  assert.equal(c10dPlan(fa, fa.allies[0], decideAlly, bestHit), null);
  // 魔物の 仲間も 3回に 1回
  const mb = battle({ kinds: ['player', 'monster', 'monster', 'monster'], auto: false });
  const mr = [0, 1, 2].map(() => c10dPlan(mb, mb.allies[1], decideAlly, bestHit)).filter((p) => p?.id === NARASU);
  assert.equal(mr.length, 1);
  // 鳴らす 色が ない（まくが われて いる）時は 鳴らさない
  ring(b, b.allies[0], m.c10v.colors[0]);
  for (let i = 0; i < 6; i++) assert.notEqual(c10dPlan(b, sup, decideAlly, bestHit)?.id, NARASU);
});

test('人数で 合わせる: 家族の キャラの 数で HP・与える ダメージ・ミラーレの 色の 数（1人は 1色・2人は もどるまで 4回）・仲間なしの ひとりは solo', () => {
  const hp = (id, kinds) => battle({ id, kinds }).enemies[0].maxHp;
  for (const id of [...C10D_GATE_ORDER, C10D_BATTLE.mirror]) {
    const sp = groupOf(id)[0];
    assert.equal(hp(id, ['player', 'player', 'player', 'player']), MONSTERS[sp].hp, `${id}: 4人は もとの まま`);
    assert.ok(hp(id, ['player', 'player', 'support', 'support']) < MONSTERS[sp].hp, `${id}: 2人`);
    assert.ok(hp(id, ['player']) < MONSTERS[sp].hp * 0.25, `${id}: ひとりだけ`);
    for (const k of ['hp', 'atk']) assert.equal(MONSTERS[sp].c10d.few[k].length, 5);
  }
  const one = battle({ id: C10D_BATTLE.mirror, kinds: ['player', 'support', 'support', 'support'] });
  assert.equal(mirrorOf10d(one).c10v.colors.length, 1, '1人は 1色');
  const two = battle({ id: C10D_BATTLE.mirror, kinds: ['player', 'player', 'support', 'support'] });
  assert.equal(mirrorOf10d(two).c10v.colors.length, 2);
  assert.equal(c10dConf(C10D_MIRARE, two).window, 4, '2人は もどるまで 4回');
  assert.equal(c10dConf(C10D_MIRARE, battle({ id: C10D_BATTLE.mirror })).window, 2);
  assert.equal(mirrorOf10d(battle({ id: C10D_BATTLE.mirror, kinds: ['player'] })).c10v.colors.length, 1, 'ひとりも 1色');
  // ひとりの 門 3 は しるしを つけない
  assert.equal(c10dConf(C10D_SHARD_M, battle({ id: C10D_BATTLE.gate3, kinds: ['player'] })).mark, 0);
});

// ───────────── 強さ ─────────────
test('強さ: 人が できる 動き（2秒・5秒）で 知って いる 人は 門も ボスも 勝てる・知らない 人と 完全オートは 勝ちにくい（作戦ごと。少しの 回数）', { timeout: 2400000 }, () => {
  assert.deepEqual(CH10D_LV, { gate1: 115, gate2: 116, gate3: 116, gate4: 117, mirror: 118 });
  for (const key of ['gate1', 'gate2', 'gate3', 'gate4', 'mirror']) {
    for (const react of [2000, 5000]) {
      const know = [1, 2, 3, 4].map((s) => ch9Run(key, LV9[key], 'know', 9090 + s * 7919, { legacy: true, react, flags: ORDER_FLAGS.act4[key] }));
      const w = know.filter((r) => r.outcome === 'win');
      assert.ok(w.length >= (key === 'mirror' ? 2 : 3), `${key} ${react}: 知って いる 人 ${know.map((r) => r.outcome).join(',')}`);
      const sec = w.reduce((s, r) => s + r.seconds, 0) / w.length;
      assert.ok(sec <= (key === 'mirror' ? 660 : 400), `${key} ${react}: 長さ ${sec}秒`);
    }
    for (const tactics of AUTO_TACTICS) {
      const auto = [1, 2].map((s) => ch9Run(key, LV9[key], 'auto', 9090 + s * 7919, { flags: ORDER_FLAGS.act4[key], tactics }));
      assert.equal(auto.filter((r) => r.outcome === 'win').length, 0, `${key}: 完全オート（${TACTICS[tactics].name}）`);
    }
    for (const [job, kit] of Object.entries(CH9_KIT[key])) for (const id of kit) if (id) assert.ok(canEquip(job, id), `${job}: ${id}`);
  }
  const blind = [1, 2, 3, 4].map((s) => ch9Run('mirror', LV9.mirror, 'blind', 9090 + s * 7919, { legacy: true, flags: ORDER_FLAGS.act4.mirror }));
  assert.ok(blind.filter((r) => r.outcome === 'win').length <= 1, 'ボス: 知らない 人');
  assert.deepEqual(ORDER_FLAGS.act4.mirror, [C10A.noteRe, C10A.noteFa, C10B.noteSo, C10B.noteLa, C10C.noteSi]);
});

test('連戦 ぜんたい（はかる 道具）: 門 4つと ボスを HP と MP を 引きついで・いずみの えらび方・戦いの あとの 呪文の 回復', { timeout: 1200000 }, () => {
  // いずみの えらび方
  const four = ch9Party('mirror', 118);
  assert.equal(pickWell10d(four, 'none'), null);
  assert.equal(pickWell10d(four, 'same'), 'heal');
  assert.equal(pickWell10d(four, 'smart'), 'power', 'みんな 元気 … ちから');
  four[0].hp = 0;
  four[1].hp = 0;
  assert.equal(pickWell10d(four, 'smart'), 'heal', '2人 たおれた … いやし');
  const f2 = ch9Party('mirror', 118);
  for (const c of f2) c.mp = Math.round(c.mp * 0.3);
  assert.equal(pickWell10d(f2, 'smart'), 'mana', 'MPが 少ない … ちえ');
  // 呪文の 回復: たおれた 人を 生き返らせて HPを もどす（MPを 使う）
  const f3 = ch9Party('mirror', 118);
  f3[0].hp = 0;
  f3[2].hp = 10;
  const mp0 = f3.reduce((s, c) => s + c.mp, 0);
  const used = fieldHeal10d(f3);
  assert.ok(f3[0].hp > 0 && f3[2].hp > 10 && used > 0 && f3.reduce((s, c) => s + c.mp, 0) === mp0 - used);
  // 1回の のぼり（知って いる 人・うまく えらぶ）
  const r = c10dChain('know', 9090, { well: 'smart' });
  assert.ok(['win', 'lose'].includes(r.outcome) && r.reached >= 1, JSON.stringify(r));
  assert.ok(r.wells.length <= 4);
});

// ───────────── 品 ─────────────
test('品: 宝箱 6こ（★5 は 3つ k 2.38〜2.42・のこりは 素材か 道具）・ボスの 品・だいじな 物・くぼ地の 武具屋に 足す 品 4つ（k 2.28〜2.30）・武器は 作らない', () => {
  assert.equal(C10D_GEAR_CHESTS.length, 3);
  for (const [id, [item, n]] of Object.entries(C10D_TREASURE)) {
    const it = ITEMS[item];
    assert.ok(it, item);
    assert.deepEqual(c10dChest(id), { item, n });
    if (C10D_GEAR_CHESTS.includes(id)) {
      assert.equal(it.src, 'c10d');
      assert.equal(it.rarity, 4);
      assert.equal(it.rank, 10);
      assert.notEqual(it.type, 'weapon');
      assert.ok(rareWhereText(item)?.includes('星の階段'), item);
    } else assert.ok(['mat', 'use'].includes(it.type), `${id}: 素材か 道具 (${it.type})`);
  }
  assert.equal(c10dChest('nope'), null);
  for (const k of Object.values(C10D_K)) assert.ok(k >= 2.38 && k <= 2.42, k);
  assert.equal(C10D_SHOP_ADD.length, 4);
  for (const k of Object.values(C10D_SHOP_K)) assert.ok(k >= 2.28 && k <= 2.3, k);
  for (const id of C10D_SHOP_ADD) { assert.equal(ITEMS[id].rarity, 0); assert.ok(ITEMS[id].price > 0); assert.notEqual(ITEMS[id].type, 'weapon'); }
  for (const id of Object.keys(ITEMS_C10D)) { assert.ok(PART3_LATE_ITEMS.has(id), id); assert.ok(ITEM_KANA[id], `${id}: 読みがな`); assert.notEqual(ITEMS[id].type, 'weapon'); }
  for (const [boss, [acc]] of Object.entries(C10D_DROPS)) {
    assert.equal(MONSTERS[boss].drops.boss[0], acc);
    assert.equal(ITEMS[acc].type, 'acc');
    assert.ok(ITEMS[acc].unique);
    const sum = Object.values(ITEMS[acc].bonus).reduce((s, v) => s + v, 0);
    assert.ok(sum <= 287 && sum >= 280, `${acc}: ${sum}`);
  }
  assert.equal(ITEMS[NOTE_DO].type, 'key');
  for (const it of Object.values(ITEMS_C10D)) assert.ok(!it.resist?.water, it.name);
});

// ───────────── ヒント ─────────────
test('負けた 時の ヒント: ボスは 3だん（16-3 の 文）・門の 番人は 1だん・言う 人は ノクト', () => {
  assert.equal(C10D_HINT_WHO, 'ノクト');
  assert.deepEqual(C10D_BOSS_HINTS.c10d_mirror, [
    'あの鏡、色のまくで、こうげきをはじいているぞ。',
    '「音を鳴らす」で、まくと同じ色の音を鳴らせ。2色とも、だ。',
    '1色鳴らしたら、すぐ、もう1色。スピカの星のうたで、1色ですむようになる。',
  ]);
  for (const id of Object.keys(C10D_BOSS_HINTS)) {
    assert.deepEqual(BOSS_HINTS[id], C10D_BOSS_HINTS[id]);
    assert.equal(BOSS_HINT_WHO[id], 'ノクト');
    assert.equal(BOSS_HINTS[id].length, id === C10D_BATTLE.mirror ? 3 : 1, id);
    for (const s of BOSS_HINTS[id]) {
      assert.ok(s.length >= 10 && s.length <= 45 && !/[ 　]/.test(s), s);
      assert.ok(!s.includes(MONSTERS[groupOf(id)[0]].name), `${id}: 名前`);
    }
  }
});

// ───────────── 絵・背景 ─────────────
test('絵: 門の 番人は 新しい 絵 2しゅ ＋ 色ちがい・体の 色 ＝ まくの 色（6色の え）・ボスは 2倍の こまかさ（コマ 2・3 は ひび）・背景 2つ', () => {
  for (const sp of C10D_GUARDS) {
    assert.ok(MONSTER_ART[sp], sp);
    for (const id of Object.keys(C10D_VEIL_ART)) assert.ok(MONSTER_ART[`${sp}~${id}`], `${sp}~${id}`);
  }
  assert.deepEqual(Object.keys(C10D_VEIL_ART), NOTE_COLORS.map((n) => n.id));
  for (const [sp, base] of Object.entries(C10D_RECOLOR_BASE)) assert.deepEqual(MONSTER_ART[sp].size, MONSTER_ART[base].size, sp);
  const keys = [C10D_SHARD, C10D_SHARD_W, C10D_SHARD_M, C10D_SHARD_S, `${C10D_SHARD}~red`, `${C10D_SHARD_S}~purple`, C10D_MIRARE, C10D_COPY];
  for (const sp of keys) {
    const d = MONSTER_ART[sp];
    const pal = new Set(d.pal.map((c) => c.toLowerCase()));
    for (const f of sp === C10D_MIRARE ? [0, 1, 2, 3] : [0, 1]) {
      const used = new Set();
      const out = [];
      const W = d.size[0], H = d.size[1];
      const pt = (x, y) => { if (x < -0.02 || x > 1.02 || y < -0.02 || y > 1.02) out.push([x, y]); };
      const g = {
        w: W, h: H,
        poly: (ps, c) => { used.add(c); ps.forEach(([x, y]) => pt(x, y)); },
        ell: (x, y, rx, ry, c) => { used.add(c); pt(x - rx, y - ry); pt(x + rx, y + ry); },
        rect: (x, y, w, h, c) => { used.add(c); pt(x, y); pt(x + w, y + h); },
        line: (ps, c) => { used.add(c); ps.forEach(([x, y]) => pt(x, y)); },
      };
      d.draw(g, f);
      assert.deepEqual([...used].filter((c) => !pal.has(String(c).toLowerCase())), [], `${sp} f${f}: パレットに ない いろ`);
      assert.deepEqual(out.slice(0, 3), [], `${sp} f${f}: はみだし`);
    }
  }
  assert.equal(MONSTERS[C10D_MIRARE].artScale, 0.5);
  assert.equal(monsterFine(C10D_MIRARE), 2);
  const [w, h] = monsterSize(C10D_MIRARE);
  assert.ok(w >= 90 && w <= 130 && h >= 100 && h <= 130, `${w}×${h}`);
  for (const id of ['c10d_stair', 'c10d_summit']) assert.ok(battleBgSpec(id), id);
  assert.equal(FIXED_C10D.c10d_gate1.bg, 'c10d_stair');
  assert.equal(FIXED_C10D.c10d_mirror.bg, 'c10d_summit');
});

test('もとの 作品の 名前・絵・せりふ・決まり文句を 使わない（「鏡よ鏡」・緑の 顔・仮面）・見た目は 設計の とおり', () => {
  const files = ['public/js/shared/data/monsters-c10d.js', 'public/js/shared/data/abilities-c10d.js', 'public/js/shared/data/items-c10d.js', 'public/js/shared/battle-c10d.js', 'public/js/client/battle-c10d.js', 'public/js/shared/data/boss-hints-c10d.js', 'public/js/client/render/c10d-art.js'];
  const bad = ['鏡よ鏡', 'かがみよかがみ', '白雪姫', 'しらゆきひめ', '世界でいちばん美しい', 'いちばん美しい', 'お妃', 'おきさき', '毒りんご', 'どくりんご', '仮面', '小人'];
  for (const f of files) {
    const src = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8').split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
    for (const w of bad) assert.ok(!src.includes(w), `${f}: ${w}`);
  }
  // 顔の 色は 緑で ない（鏡の ガラスに うつる うす むらさきの 銀）
  const art = readFileSync(new URL('../public/js/client/render/c10d-art.js', import.meta.url), 'utf8');
  const face = art.match(/F: '(#[0-9a-f]{6})'/i)[1];
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(face.slice(i, i + 2), 16));
  assert.ok(!(g > r + 20 && g > b + 20), `顔の 色 ${face}`);
  for (const wd of ['金のふち', 'ねむそう', 'いばって']) assert.ok(MONSTERS[C10D_MIRARE].desc.includes(wd), wd);
});

// ───────────── がめん ─────────────
test('がめん: 上の まど（色の 丸 ＋ 色の 名前の 文字・あと ○回）・色の え・バナー・コマンド「音を鳴らす」（6つの 色の ボタン・1回で 決定）・コマンドの 行き先', () => {
  for (const id of C10D_OWN_TELE) assert.ok(CH6_OWN_TELE.has(id), id);
  const g1 = { id: 'e1', species: C10D_SHARD_W, alive: true, c10Kind: 'gate', veil10: [0], base10: 'かがみの門番A', name: 'かがみの門番A（赤）' };
  const g2 = { id: 'e2', species: C10D_SHARD_W, alive: true, c10Kind: 'gate', veil10: [], base10: 'かがみの門番B', name: 'かがみの門番B' };
  const allies = [{ id: 'a0', name: 'タロウ', alive: true, mark10: 3 }, { id: 'a1', name: 'ハナ', alive: true }];
  const top = c10dHtml([g1, g2], allies, 'a0');
  assert.ok(top.html.includes('かがみの門番A') && top.html.includes('>赤<') && top.html.includes('われている'), top.html);
  assert.ok(top.html.includes('しるし') && top.html.includes('>青<'), '色の 名前の 文字');
  assert.ok(top.cls.includes('warn'), 'しるしが ついて いる');
  const mir = { id: 'e0', species: C10D_MIRARE, alive: true, c10Kind: 'mirror', veil10: [3], rung10: [0], left10: 2, base10: 'ミラーレ' };
  const mt = c10dHtml([mir], allies, 'a1');
  assert.ok(mt.html.includes('あと2回') && mt.html.includes('>青<') && mt.html.includes('>赤<') && mt.html.includes('done'), mt.html);
  assert.ok(c10dHtml([{ ...mir, rung10: [], left10: 0, veil10: [], daze: 1 }], allies).html.includes('動けない'));
  assert.ok(c10dHtml([{ ...mir, measure: 1, measureAim: 'a1' }], allies, 'a1').html.includes('あなた'));
  assert.equal(c10dHtml([], allies).html, '');
  // え: 番人の 体は まくの 色・ミラーレは 勝つと コマ 2・3（消えない）
  let s = null;
  try { s = c10dSprite(g1, 0); } catch { s = 'ブラウザ'; }
  assert.ok(s);
  assert.equal(c10dSprite(g2, 0), null, 'われて いる 間は もとの 銀色');
  const down = { species: C10D_MIRARE, alive: true, c10Down: 1, dead: 1 };
  try { c10dSprite(down, 0); } catch { /* え を かく ところは ブラウザだけ */ }
  assert.equal(down.dead, -1);
  // しるしが こわれない
  const x = new Proxy({}, { get: () => () => {}, set: () => true });
  const scene = { time: 0, enemies: () => [g1, g2, mir], allies: () => allies };
  for (const c of [g1, g2, mir, { ...mir, measure: 1 }, { ...mir, daze: 1, veil10: [] }, { ...mir, c10Down: 1 }]) c10dDraw(scene, x, null, c, 10, 10, 40, 40, 1);
  // バナー
  const banners = [];
  const sc2 = { game: { audio: { sfx() {} } }, banner: (t) => banners.push(t), shake() {}, myActor: { id: 'a0' } };
  for (const e of [{ c10dBreak: ['e1'] }, { c10dBack: { colors: [0] } }, { c10dRing: { id: 'a0', color: 0, hit: ['e0'], broke: [], unmark: [], ok: true } }, { c10dRing: { id: 'a0', color: 1, hit: [], broke: [], unmark: [], ok: false } }, { c10dMeasureUp: {} }, { c10dMark: { color: 2 } }, { c10dShift: { to: [4] } }, { c10dCopy: {} }, { c10dCopyGone: {} }, { c10dSong: { color: 5 } }, { c10dVeil: { colors: [1, 2] } }, { c10dDown: { id: 'e0' } }]) c10dPresent(sc2, e);
  for (const w of ['われた', 'もどった', 'もう1色', '合わない', '光をはかる', 'しるし', 'かわった', 'うつし身', '消えた', 'むらさき', 'まとい直した', 'ひび']) assert.ok(banners.some((t) => t.includes(w)), w);
  // コマンド「音を鳴らす」（門と ボスの 戦いだけ。いちばん 上）
  const me = { id: 'a0', name: 'タロウ', abilities: [TERU, NARASU] };
  const ci = c10dCmdItems({ enemies: () => [g1], allies: () => allies }, me);
  assert.ok(ci.items[0].html.includes('音を鳴らす') && ci.items[0].value === 'c10dring');
  assert.ok(ci.info.includes('青のしるし'), ci.info);
  assert.equal(c10dCmdItems({ enemies: () => [{ species: 'c10c_sheep', alive: true }], allies: () => [] }, me).items.length, 0);
  const c9 = c9bCmdItems({ enemies: () => [g1], allies: () => allies }, me);
  assert.equal(c9.items[0].value, 'c10dring', 'いちばん 上');
  // 6つの 音の まど: 色の ついた ボタン（色の 名前の 文字も）・まくや しるしと 同じ 色に 小さな 文字・1回で 決まる（tapConfirm なし）
  const items = noteMenuItems({ enemies: () => [g1], allies: () => allies });
  assert.equal(items.length, 6);
  assert.deepEqual(items.map((it) => it.value), [0, 1, 2, 3, 4, 5]);
  items.forEach((it, i) => { assert.ok(it.cls.includes(`c10d-n${i}`)); assert.ok(it.html.includes(NOTE_COLORS[i].name) && it.html.includes(NOTE_COLORS[i].note)); });
  assert.ok(items[0].html.includes('まくと同じ') && items[3].html.includes('しるしと同じ'));
  const menus = [];
  const sent = [];
  const root = { classList: { add: (c) => { root.cls = c; } } };
  const sc3 = { enemies: () => [g1], allies: () => allies, send: (m) => sent.push(m), openCommand() {}, showMenu(...args) { menus.push(args); this.menu = { root }; } };
  assert.equal(c10dCmdPick(sc3, me, 'c10dring'), true);
  const [list, onSelect, onCancel, title, , start, , tapConfirm] = menus[0];
  assert.equal(list.length, 6);
  assert.ok(title.includes('音を鳴らす'));
  assert.equal(start, 0, 'まくと 同じ 色に カーソル');
  assert.ok(!tapConfirm, '1回で 決まる');
  assert.ok(typeof onCancel === 'function');
  assert.equal(root.cls, 'c10d-notes', '色の ボタンの ならび');
  onSelect(list[4]);
  assert.deepEqual(sent, [{ type: 'ability', id: NARASU, choice: 4 }]);
  assert.equal(c10dCmdPick(sc3, me, 'c10cmove'), false);
  // せつめいの 出し直し
  let now = g1;
  const sc4 = { enemies: () => [now], allies: () => [], myActor: me, infoEl: { textContent: '' }, info(t) { this.infoEl.textContent = t; } };
  sc4.infoEl.textContent = c10dCmdItems(sc4, me).info;
  assert.equal(refreshInfo(sc4), false);
  now = { ...g1, veil10: [5] };
  assert.equal(refreshInfo(sc4), true);
  assert.ok(sc4.infoEl.textContent.includes('むらさき'));
  // コマンドの 行き先（battle.js → c8r → c9a → c9b → c10d）: 第2幕の 不具合を くりかえさない
  const route = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.ok(/case 'c10dring':[^\n]*return c8rCmdPick\(this, a, it\.value\)/.test(route), 'battle.js の 行き先');
  assert.ok(route.includes('!ABILITIES[id]?.cmdOnly'), '特技の 一覧に 出さない');
  for (const f of ['battle-c8r.js', 'battle-c9a.js']) {
    const src = readFileSync(new URL(`../public/js/client/${f}`, import.meta.url), 'utf8');
    assert.ok(src.includes("value === 'c10dring'"), f);
  }
  assert.ok(readFileSync(new URL('../public/js/client/battle-c9b.js', import.meta.url), 'utf8').includes("if (value === 'c10dring') return c10dCmdPick(scene, a, value);"));
  // えんしゅつ: 技の anim は ぜんぶ ある（battlefx-c8c.js から とどく）・大きく 出す 技・味方の まど・音
  const fx = new Proxy({}, { get: () => () => {} });
  const anims = [...new Set(Object.values(C10D_ABILITIES).map((a) => a.anim))];
  for (const a of anims) {
    assert.equal(playC10dFx(fx, a, [{ x: 100, y: 60 }, { x: 140, y: 70 }], null, {}), true, a);
    assert.equal(playC10dFx(fx, a, [], null, {}), true, `${a}: 的が ない 時も`);
    assert.equal(playC8cFx(fx, a, [{ x: 100, y: 60 }], null, {}), true, `${a}: battlefx-c8c.js から とどく`);
  }
  for (const a of [...C10D_SCREEN_ANIMS, ...Object.keys(C10D_ALLY_FX), ...Object.keys(C10D_SFX)]) assert.ok(anims.includes(a), a);
  for (const [kk, v] of Object.entries(C10D_ALLY_FX)) assert.equal(CH4_ALLY_FX[kk], v, kk);
  for (const a of Object.values(C10D_ABILITIES)) assert.ok(firstSentence(a.desc).length >= 6 && firstSentence(a.desc).length <= 40, a.name);
});

// ───────────── 字 ─────────────
test('文字: 子ども向けの 漢字・文の 中に 空白なし（kanji-check の gameFiles に 入って いる）', () => {
  const mine = [
    'public/js/shared/data/monsters-c10d.js', 'public/js/shared/data/abilities-c10d.js',
    'public/js/shared/data/encounters-c10d.js', 'public/js/shared/data/items-c10d.js', 'public/js/shared/data/boss-hints-c10d.js',
    'public/js/shared/battle-c10d.js', 'public/js/client/battle-c10d.js', 'public/js/client/render/c10d-art.js', 'public/js/client/render/c10d-bg.js', 'public/js/client/render/battlefx-c10d.js',
  ];
  const gf = gameFiles();
  for (const f of mine) {
    const g = gf.find((x) => x.replace(/\\/g, '/').endsWith(f));
    assert.ok(g, `${f} は gameFiles に ある`);
    assert.deepEqual(checkFile(g).filter((p) => p.kind !== 'kana'), [], f);
  }
});
