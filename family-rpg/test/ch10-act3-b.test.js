// 第97回 B班: 第3部 第2章 第3幕「紫と、うばわれた音」の 戦いと 品（docs/plan-part3-c10c.md の 15-3・15-4）
// 名前の 約束・ふつうの 魔物 8しゅ・スピカの ごほうび（紫の 音）・たいさムスカリ（立つ 石を うつる）・アルゴル（光を 食べさせない）・
// 自動の 仲間・人数で 合わせる・強さ（人が できる 動き・2秒と 5秒・完全オートは 作戦ごと）・ふつうの 戦いの 長さ・品・ヒント・絵・背景・がめん・えんしゅつ・文字
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ITEMS, ITEM_KANA, PART3_LATE_ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES, ZONE_BG } from '../public/js/shared/data/encounters.js';
import { MAT_DROPS, monsterDrops } from '../public/js/shared/data/loot.js';
import { MONSTER_FRIENDS, rankOf } from '../public/js/shared/data/companions.js';
import { MONSTER_RANKS } from '../public/js/shared/data/monster-ranks.js';
import { rareWhereText } from '../public/js/shared/data/rare-loot.js';
import { BOSS_HINTS, BOSS_HINT_WHO } from '../public/js/shared/data/boss-hints.js';
import { canEquip } from '../public/js/shared/stats.js';
import { TACTICS } from '../public/js/shared/ai.js';
import {
  C10C_B as C10C, C10C_LEVER_B, C10C_PED_B, C10C_MAP_B, C10C_BATTLE_B as C10C_BATTLE, C10C_MON_PREFIX_B, C10C_BOSS_MON_B, C10C_TABLE_B,
  C10C_CHEST_IDS_B as C10C_CHEST_IDS, C10C_NOTES_B, C10C_TRACKS_B, C10C_OPEN_B,
} from '../public/js/shared/maps/c10c-flags.js';
import { C10A_B as C10A } from '../public/js/shared/maps/c10a-flags.js';
import { C10B_B as C10B } from '../public/js/shared/maps/c10b-flags.js';
import {
  MONSTERS_C10C, C10C_MINIONS, C10C_ISLE_MON, C10C_FORT_MON, C10C_RECOLOR_BASE, C10C_NEW_ART, C10C_COLONEL, C10C_ALGOL, C10C_MAT_DROPS, COLONEL_NAME, ALGOL_NAME,
} from '../public/js/shared/data/monsters-c10c.js';
import { C10C_ABILITIES, UTSURU } from '../public/js/shared/data/abilities-c10c.js';
import { FRIENDS_C10C } from '../public/js/shared/data/companions-c10c.js';
import { ENCOUNTERS_C10C, FIXED_C10C, ZONE_BG_C10C } from '../public/js/shared/data/encounters-c10c.js';
import { ITEMS_C10C, C10C_TREASURE, C10C_K, C10C_SHOP_K, C10C_GEAR_CHESTS, C10C_SHOP_ADD, C10C_DROPS, NOTE_SI, c10cChest } from '../public/js/shared/data/items-c10c.js';
import { C10C_BOSS_HINTS, C10C_HINT_WHO } from '../public/js/shared/data/boss-hints-c10c.js';
import {
  c10cConf, c10cTell, c10cPlan, c10cPub, c10cAllyPub, colonelOf, algolOf, litStones, onStone, tightOf, bestStone, buffCmd, goodOf,
  BOLT, WHY, EAT, VEIL, BLAST, STILL, REWARD_LIT, AUTO_EVERY, STONE_NAMES,
} from '../public/js/shared/battle-c10c.js';
import { TERU, TERU_LIT, teruOf } from '../public/js/shared/battle-c9b.js';
import { SONG } from '../public/js/shared/battle-c9d.js';
import { REWARD_HEAL, REWARD_TERU } from '../public/js/shared/battle-c10a.js';
import { REWARD_SONG } from '../public/js/shared/battle-c10b.js';
import { bestHit } from '../public/js/shared/battle-c9a.js';
import { ch9Run, ch9Party, LV9, CH9_KIT } from '../tools/sim-ch9.mjs';
import { ORDER_FLAGS, AUTO_TACTICS, tacticsOf } from '../tools/sim-ch10.mjs';
import { tableLength } from '../tools/sim-ch9-field.mjs';
import { decideAlly } from '../public/js/shared/ai.js';
import { MONSTER_ART, monsterSize, monsterFine } from '../public/js/client/render/monsters.js';
import { playC10cFx } from '../public/js/client/render/battlefx-c10c.js';
import { playC8cFx } from '../public/js/client/render/battlefx-c8c.js';
import { battleBgSpec } from '../public/js/client/render/battlefx.js';
import { C10C_SCREEN_ANIMS, C10C_ALLY_FX, C10C_SFX, C10C_OWN_TELE, c10cDraw, c10cPresent, c10cSprite, c10cCmdItems, c10cCmdPick, c10cHtml, stonesHtml, refreshInfo } from '../public/js/client/battle-c10c.js';
import { CH4_ALLY_FX } from '../public/js/client/battle-ch4.js';
import { CH6_OWN_TELE } from '../public/js/client/battle-ch6.js';
import { firstSentence } from '../public/js/client/ui/skillinfo.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';

const ev0 = () => ({ lines: [], upd: [], results: [] });
const groupOf = (id) => FIXED_ENCOUNTERS[id].group.flatMap(([sp, n]) => Array(n).fill(sp));
const BASE_FLAGS = { c9_child: true, c9_act1: true, c9_song1: true };
const ALL4 = { ...BASE_FLAGS, [C10A.noteRe]: true, [C10A.noteFa]: true, [C10B.noteSo]: true, [C10B.noteLa]: true };
// kinds … 味方の 種類（'player' 家族の キャラ・'support' 酒場の 人・'monster' 魔物の 仲間）
function battle({ boss = 'colonel', kinds = ['player', 'player', 'player', 'player'], seed = 3, flags = BASE_FLAGS, enemies = null, auto = true } = {}) {
  const four = ch9Party(boss, LV9[boss]);
  const allies = kinds.map((k, i) => ({ char: structuredClone(four[i % 4]), kind: k, controller: k === 'player' ? 'sim' : null, auto: k === 'player' ? auto : true, tactics: 'balanced' }));
  const id = boss === 'colonel' ? C10C_BATTLE.colonel : C10C_BATTLE.algol;
  return new Battle({ rng: makeRng(seed), boss: !enemies, canFlee: !!enemies, allies, enemies: enemies || groupOf(id), hooks: { leaderFlag: (f) => !!flags[f] } });
}
const act = (b, a, cmd) => {
  b.queue.push({ id: a.id, cmd, last: true });
  a.queued = true;
  b.executeNext();
  return b.flush().filter((e) => e.t === 'act').pop();
};
// 敵の 番（telegraph が あれば それ。なければ 決まった 技）
const foe = (b, m, id = null) => {
  if (id) m.telegraph = id;
  b.queue.push({ id: m.id, cmd: { type: 'ai' }, last: true });
  m.queued = true;
  b.executeNext();
  return b.flush().filter((e) => e.t === 'act').pop();
};
const quiet = (m) => { m.actions = [{ w: 1, id: 'm_nothing' }]; };
const big = (b) => { for (const a of b.allies) { a.hp = a.maxHp = 99999; } };

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（15-4）: フラグ・レバー・台・マップ・決まった 戦い・魔物の id・出る 表・宝箱・だいじな 物・曲・幕の 切りかえ（maps/c10c-flags.js。かりの 置き場 c10c-names-b.js は A班が 合わせる 時に 消した）', () => {
  assert.deepEqual(C10C, {
    act2: 'c10_act2', start: 'c10c_start', isles2: 'c10c_isles2', colonel: 'c10c_colonel', stolen: 'c10c_stolen', trio: 'c10c_trio',
    fortIn: 'c10c_fort_in', fort2: 'c10c_fort2', algol: 'c10c_algol', noteSi: 'c10_note_si', act3: 'c10_act3',
  });
  assert.deepEqual(C10C_LEVER_B, { red: 'c10c_lv_red', blue: 'c10c_lv_blue' });
  assert.deepEqual(C10C_PED_B, { si: 'c10_ped_si' });
  assert.deepEqual(Object.values(C10C_MAP_B), ['c10c_isles1', 'c10c_isles2', 'c10c_isles3', 'c10c_fort1', 'c10c_fort2', 'c10c_fort3']);
  assert.deepEqual(C10C_BATTLE, { colonel: 'c10c_colonel', algol: 'c10c_algol' });
  assert.deepEqual(C10C_BOSS_MON_B, { colonel: C10C_COLONEL, algol: C10C_ALGOL });
  assert.deepEqual([C10C_COLONEL, C10C_ALGOL], ['c10c_muscari', 'c10c_algol']);
  for (const sp of Object.keys(MONSTERS_C10C)) assert.ok(sp.startsWith(C10C_MON_PREFIX_B), sp);
  assert.deepEqual(Object.values(C10C_TABLE_B), ['t10c_isles', 't10c_fort']);
  for (const t of Object.values(C10C_TABLE_B)) assert.ok(ENCOUNTER_TABLES[t], t);
  assert.deepEqual(C10C_CHEST_IDS.isles, ['c10c_ic1', 'c10c_ic2', 'c10c_ic3', 'c10c_ic4', 'c10c_ic5', 'c10c_ic6']);
  assert.deepEqual(C10C_CHEST_IDS.fort, ['c10c_fc1', 'c10c_fc2', 'c10c_fc3', 'c10c_fc4', 'c10c_fc5', 'c10c_fc6']);
  assert.deepEqual(Object.keys(C10C_TREASURE).sort(), [...C10C_CHEST_IDS.isles, ...C10C_CHEST_IDS.fort].sort());
  assert.deepEqual(C10C_NOTES_B, { si: NOTE_SI });
  assert.equal(NOTE_SI, 'note_si');
  assert.equal(C10C_OPEN_B, 'PART3_C10C_OPEN');
  assert.deepEqual(Object.values(C10C_TRACKS_B), ['c10c_isles', 'c10c_colonel', 'c10c_stolen', 'c10c_fort', 'c10c_rival', 'c10c_six']);
  // 決まった 戦い: にげられない・曲は F班の id（先に つないだ）
  assert.equal(FIXED_ENCOUNTERS.c10c_colonel.bgm, 'c10c_colonel');
  assert.equal(FIXED_ENCOUNTERS.c10c_algol.bgm, 'c10c_rival');
  for (const id of Object.values(C10C_BATTLE)) assert.ok(FIXED_C10C[id].boss && FIXED_C10C[id].canFlee === false && FIXED_ENCOUNTERS[id] === FIXED_C10C[id]);
  assert.deepEqual(groupOf(C10C_BATTLE.colonel), [C10C_COLONEL]);
  assert.deepEqual(groupOf(C10C_BATTLE.algol), [C10C_ALGOL]);
});

// ───────────── ふつうの 魔物 ─────────────
test('ふつうの 魔物 8しゅ: 空 4しゅ Lv113〜114・とりで 4しゅ Lv114〜115・仲間に なる・今の 素材・今 ある 系統・ランク・落とす 品の きまり・出る 表', () => {
  assert.equal(C10C_ISLE_MON.length, 4);
  assert.equal(C10C_FORT_MON.length, 4);
  const races = new Set(Object.entries(MONSTERS).filter(([id]) => !MONSTERS_C10C[id]).map(([, m]) => m.race));
  const mats = new Set(Object.entries(MAT_DROPS).filter(([sp]) => !MONSTERS_C10C[sp]).map(([, v]) => v[0]));
  for (const sp of C10C_MINIONS) {
    const m = MONSTERS[sp];
    assert.ok(m && m.region === 6, sp);
    const [lo, hi] = C10C_ISLE_MON.includes(sp) ? [113, 114] : [114, 115];
    assert.ok(m.lv >= lo && m.lv <= hi, `${sp}: Lv${m.lv}`);
    assert.ok(races.has(m.race), `${sp}: 今 ある 系統`);
    assert.ok(MONSTER_FRIENDS[sp] && MONSTER_FRIENDS[sp] === FRIENDS_C10C[sp], `${sp}: 仲間に なる`);
    assert.ok(MONSTER_FRIENDS[sp].rate >= 1 / 26 && MONSTER_FRIENDS[sp].rate <= 1 / 10, sp);
    const g = Object.values(MONSTER_FRIENDS[sp].growth).reduce((s, v) => s + v, 0);
    assert.ok((g >= 5.8 - 1e-9 && g <= 6.1 + 1e-9) || (g >= 6.8 - 1e-9 && g <= 7.3 + 1e-9), `${sp}: growth ${g}`);
    for (const [, id] of MONSTER_FRIENDS[sp].learn) assert.ok(ABILITIES[id], `${sp}: ${id}`);
    assert.ok(MAT_DROPS[sp] === C10C_MAT_DROPS[sp] && ITEMS[MAT_DROPS[sp][0]]?.type === 'mat', `${sp}: 素材`);
    assert.ok(mats.has(MAT_DROPS[sp][0]), `${sp}: 今の 素材`);
    assert.ok(['F', 'E', 'D', 'C'].includes(rankOf(sp, MONSTERS)), `${sp}: ランク ${rankOf(sp, MONSTERS)}`);
    assert.equal(MONSTER_RANKS[sp], rankOf(sp, MONSTERS), sp);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${sp}: ${a.id}`);
    assert.ok(MONSTER_FRIENDS[sp].noFamily, `${sp}: 系統配合の 子に ならない`);
    // 落とす 品の きまり（test/loot.test.js）: よく 落とす 物 と レア（装備か 種）
    const list = monsterDrops(sp);
    const common = list.find((d) => d.kind === 'common');
    const rare = list.find((d) => d.kind === 'rare');
    assert.ok(common && rare && common.n <= 32 && rare.n >= 32 && rare.n <= 128, sp);
    assert.ok(['armor', 'shield', 'head', 'weapon', 'acc'].includes(ITEMS[rare.item].type), `${sp}: レアは 装備`);
  }
  for (const [t, rows] of Object.entries(ENCOUNTERS_C10C)) {
    const pool = t === 't10c_isles' ? C10C_ISLE_MON : C10C_FORT_MON;
    for (const r of rows) for (const [sp] of r.group) assert.ok(pool.includes(sp), `${t}: ${sp}`);
  }
  const seen = new Set(Object.values(ENCOUNTERS_C10C).flatMap((rows) => rows.flatMap((r) => r.group.map((g) => g[0]))));
  assert.equal(seen.size, 8, '8しゅ ぜんぶ 出る');
  assert.deepEqual(ZONE_BG_C10C, { t10c_isles: 'c10c_sky', t10c_fort: 'c10c_belt' });
  for (const t of Object.keys(ZONE_BG_C10C)) assert.equal(ZONE_BG[t], ZONE_BG_C10C[t]);
  // ボスも 落とす 品の きまり（かならず 1人 1つ）・経験値と お金
  for (const sp of [C10C_COLONEL, C10C_ALGOL]) {
    const boss = monsterDrops(sp).filter((d) => d.kind === 'boss');
    assert.equal(boss.length, 1, sp);
    assert.ok(ITEMS[boss[0].item].unique, sp);
    assert.ok(MONSTERS[sp].exp > 0 && MONSTERS[sp].gold > 0, sp);
  }
  assert.deepEqual([MONSTERS[C10C_COLONEL].lv, MONSTERS[C10C_ALGOL].lv], [114, 116]);
});

test('ふつうの 戦いの 長さ: 勇者 ＋ ゲームと おなじ 作りの 酒場の 仲間 3人で 90秒 いない', { timeout: 600000 }, () => {
  for (const t of Object.keys(ENCOUNTERS_C10C)) {
    const r = tableLength(t, 12);
    assert.equal(r.win, 1, t);
    assert.ok(r.avg <= 90, `${t}: ${r.avg}秒`);
  }
});

// ───────────── スピカの ごほうび ─────────────
test('スピカの ごほうび: 紫の 音（c10_note_si）で てらすの 明るい 間が 3回 → 4回・前の 4つの ごほうびと 合わせて きく（この 幕の ボスの 時は まだ ない）', () => {
  const plain = battle({ enemies: ['c10c_sheep'] });
  const t0 = act(plain, plain.allies[0], { type: 'defend' });
  void t0;
  teruOf(plain).charge = teruOf(plain).max;
  const e0 = act(plain, plain.allies[1], { type: 'ability', id: TERU });
  assert.ok(e0.c9bTeru);
  assert.equal(teruOf(plain).lit, TERU_LIT);
  assert.equal(TERU_LIT, 3);
  assert.equal(REWARD_LIT, 4);
  // 5つの 音 ぜんぶ（ほのかな光 9%・てらす 3回で たまる・星のうた 4回・はじめから たまって いる・明るい 間 4回）
  const all = battle({ enemies: ['c10c_sheep'], flags: { ...ALL4, [C10C.noteSi]: true } });
  assert.deepEqual(all.c10rew, { heal: REWARD_HEAL, teruMax: REWARD_TERU, songMax: REWARD_SONG, teruFull: true, teruLit: REWARD_LIT });
  assert.equal(teruOf(all).charge, REWARD_TERU, 'はじめから たまって いる');
  assert.equal(all.c9sp.song.max, REWARD_SONG);
  const e = act(all, all.allies[0], { type: 'ability', id: TERU });
  assert.ok(e.c9bTeru, e.lines.join('/'));
  assert.equal(teruOf(all).lit, 4, '明るい 間が 4回');
  // 紫の 音 だけでも
  const si = battle({ enemies: ['c10c_sheep'], flags: { ...BASE_FLAGS, [C10C.noteSi]: true } });
  assert.deepEqual(si.c10rew, { teruLit: REWARD_LIT });
  // ボスの 戦い（4つの 音・紫は まだ）では 3回の まま
  const col = battle({ flags: ALL4 });
  assert.equal(col.c10rew.teruLit, undefined);
  assert.deepEqual(ORDER_FLAGS.act3.colonel, [C10A.noteRe, C10A.noteFa, C10B.noteSo, C10B.noteLa]);
  assert.deepEqual(ORDER_FLAGS.act3.algol, [C10A.noteRe, C10A.noteFa, C10B.noteSo, C10B.noteLa]);
  // 新しい コマンド「うつる」は たいさの 戦いだけ
  assert.ok(!plain.allies[0].abilities.includes(UTSURU));
  assert.ok(col.allies.every((a) => a.abilities.includes(UTSURU)));
  assert.ok(!battle({ boss: 'algol' }).allies[0].abilities.includes(UTSURU));
});

// ───────────── たいさ ─────────────
test('たいさ: 3つの うき石（はじめは 自動で 分かれる）・前ぶれで 石が 1つ（HP 半分から 2つ）光る・雷は 光った 石の 人だけ・うつる（行き先を えらぶ）・ずっと 待つ（tellAll）', () => {
  const b = battle();
  const m = colonelOf(b);
  assert.equal(m.species, C10C_COLONEL);
  assert.equal(m.name, COLONEL_NAME);
  quiet(m);
  big(b);
  assert.equal(b.tellAll, true);
  assert.equal(c10cTell(b), 'colonel', 'いつも 人が えらぶのを 待つ');
  assert.deepEqual(b.allies.map((a) => a.c10stone), [0, 1, 2, 0], 'はじめは 左・まん中・右・左');
  assert.deepEqual(STONE_NAMES, ['左', 'まん中', '右']);
  assert.equal(battle({ kinds: ['player'] }).allies[0].c10stone, 1, 'ひとりは まん中');
  // 前ぶれの 番: 石が 1つ 光る
  const e1 = foe(b, m);
  assert.ok(e1.c10kLit, e1.lines.join('/'));
  assert.equal(litStones(b).length, 1);
  assert.equal(c10cTell(b), 'bolt');
  assert.equal(b.tell, 'bolt');
  assert.equal(c10cPub(m).stones.filter((s) => s.lit).length, 1);
  assert.equal(c10cPub(m).colonelStage, 2);
  // うつる: 光った 石の 人を 光って いない 石へ（cmd.choice）
  const lit = litStones(b)[0];
  const safe = [0, 1, 2].find((i) => i !== lit);
  const victims = b.allies.filter((a) => a.c10stone === lit);
  assert.ok(victims.length >= 1);
  const mover = victims[0];
  const em = act(b, mover, { type: 'ability', id: UTSURU, choice: safe });
  assert.ok(em.c10kMove?.ok && mover.c10stone === safe, em.lines.join('/'));
  assert.equal(c10cAllyPub(mover).stone10, safe);
  // 同じ 石へは うつれない
  const same = act(b, mover, { type: 'ability', id: UTSURU, choice: safe });
  assert.equal(same.c10kMove.ok, false);
  // 雷の 番: 光った 石に いる 人だけ
  const before = b.allies.map((a) => a.hp);
  const eb = foe(b, m);
  assert.ok(eb.c10kBolt, eb.lines.join('/'));
  b.allies.forEach((a, i) => {
    if (a.c10stone === lit) assert.ok(a.hp < before[i], `${a.name}: 光った 石`);
    else assert.equal(a.hp, before[i], `${a.name}: 光って いない 石`);
  });
  assert.equal(litStones(b).length, 0);
  // HP 半分から 2つ 光る（にげる 石は 1つ のこる）
  m.hp = Math.floor(m.maxHp * 0.5);
  m.c10k.rest = 0;
  foe(b, m);
  assert.equal(litStones(b).length, 2);
  assert.ok(ABILITIES[BOLT] && ABILITIES[WHY]);
});

test('たいさ: 同じ 石に 3人 いじょうで「せまい！」（与える ダメージ 半分）・雷が 外れると「な、なぜだ」で 1回 休み 1.5倍・てらすで 次の 雷が 外れる・石を くずす（となりへ うつる）・勝つと しょんぼり（たおれない）', () => {
  const b = battle();
  const m = colonelOf(b);
  quiet(m);
  big(b);
  const cf = c10cConf(C10C_COLONEL, b);
  assert.deepEqual([cf.tight, cf.tightK, cf.miss.taken, cf.crack.turns], [3, 0.5, 1.5, 2]);
  const [a0, a1, a2, a3] = b.allies;
  const hit = (who) => { const hp = m.hp; b.damage(who, m, 1000, ev0(), {}); const d = hp - m.hp; m.hp = m.maxHp; return d; };
  assert.equal(hit(a0), 1000);
  for (const a of [a0, a1, a2]) a.c10stone = 0;
  a3.c10stone = 2;
  assert.ok(tightOf(b, a0) && !tightOf(b, a3));
  assert.equal(c10cAllyPub(a0).tight10, 1);
  assert.equal(hit(a0), 500, 'せまい: 半分');
  assert.equal(hit(a3), 1000);
  // だれも いない 石が 光ると 外れる → 休む・1.5倍
  for (const a of b.allies) a.c10stone = 0;
  a3.c10stone = 2;
  b.c10c.stones[1].lit = true;
  const eb = foe(b, m);
  assert.ok(eb.c10kMiss && !eb.c10kMiss.dazzled, eb.lines.join('/'));
  assert.ok(m.c10k.weak);
  assert.equal(c10cPub(m).rest, 1);
  a3.c10stone = 1;
  assert.equal(hit(a3), 1500, '休んで いる 間は 1.5倍');
  const ew = foe(b, m);
  assert.ok(ew.c10kWhy, ew.lines.join('/'));
  foe(b, m); // 次の 番で もとに もどる
  assert.ok(!m.c10k.weak);
  // てらす: 次の 雷が 外れる（光った 石に いても）
  for (const s of b.c10c.stones) s.lit = false;
  teruOf(b).charge = teruOf(b).max;
  const et = act(b, a0, { type: 'ability', id: TERU });
  assert.ok(et.c10kDazzle && b.c10c.dazzle, et.lines.join('/'));
  assert.equal(c10cPub(m).dazzle, 1);
  b.c10c.stones[0].lit = true;
  const hp0 = a0.hp;
  const ed = foe(b, m);
  assert.ok(ed.c10kMiss?.dazzled && a0.hp === hp0, ed.lines.join('/'));
  assert.ok(!b.c10c.dazzle, '1回 ぶん');
  foe(b, m); // 休む
  // 石を くずす（前ぶれの 石 → 雷の 番に くずれる・そこの 人は となりへ・たいさが 2回 動くと もどる）
  for (const a of b.allies) a.c10stone = 2;
  b.c10c.crackAim = 2;
  b.c10c.stones[2].crack = true;
  b.c10c.stones[0].lit = true;
  const ec = foe(b, m, BOLT);
  assert.ok(ec.c10kCrack, ec.lines.join('/'));
  assert.equal(b.c10c.stones[2].broken, 2);
  assert.ok(b.allies.every((a) => a.c10stone === 1), 'となり（まん中）へ');
  assert.equal(c10cPub(m).stones[2].broken, 1);
  assert.equal(act(b, a0, { type: 'ability', id: UTSURU, choice: 2 }).c10kMove.ok, false, 'くずれた 石には うつれない');
  foe(b, m); // 休む（雷が 外れた）
  foe(b, m);
  assert.equal(b.c10c.stones[2].broken, 0, 'もどった');
  // 勝つと しょんぼり（HP 1 で 止まる。経験値・落とし物は ふつう）
  for (const s of b.c10c.stones) s.lit = false;
  m.c10k.weak = false;
  m.hp = 50;
  const ev = ev0();
  b.damage(a0, m, 9999, ev, {});
  assert.equal(m.hp, 1);
  assert.ok(m.alive && b.c10c.won && b.killed.includes(C10C_COLONEL));
  assert.equal(b.pendingEnd?.outcome, 'win');
  assert.equal(c10cPub(m).c10Down, 1);
  assert.equal(c10cTell(b), null);
});

// ───────────── アルゴル ─────────────
test('アルゴル: 3回 動く ごとに 光を 食べる（よい 効果を ぜんぶ … 食べた 数 × 4% 回復・攻撃 上がる）・やみの とばり（半分・てらすで 消える）・星の音（前ぶれ → 全体・防御で へる）・星のうたで 止まる・HP 3わりで 終わる', () => {
  const b = battle({ boss: 'algol' });
  const m = algolOf(b);
  assert.equal(m.species, C10C_ALGOL);
  assert.equal(m.name, ALGOL_NAME);
  quiet(m);
  big(b);
  const cf = c10cConf(C10C_ALGOL, b);
  assert.deepEqual([cf.eat.every, cf.eat.heal, cf.veil.turns, cf.veil.k, cf.end], [3, 0.04, 3, 0.5, 0.3]);
  assert.equal(c10cTell(b), 'algol');
  const [a0, a1] = b.allies;
  // 光を 食べる: よい 効果（バフ・リジェネ・力ため）を ぜんぶ
  a0.buffs = { def: { mult: 1.3, lv: 1, left: 3 }, atk: { mult: 1.3, lv: 1, left: 3 } };
  a1.regen = { amt: 100, left: 3 };
  a1.charge = 2;
  assert.equal(goodOf(a0) + goodOf(a1), 4);
  m.hp = Math.round(m.maxHp * 0.6);
  const hp0 = m.hp;
  const ee = foe(b, m, EAT);
  assert.ok(ee.c10yEat?.n === 4, ee.lines.join('/'));
  assert.equal(m.hp - hp0, Math.round(m.maxHp * 0.04 * 4));
  assert.deepEqual([a0.buffs, a1.regen, a1.charge], [{}, null, 1]);
  assert.ok(m.dmgRate > 1, '攻撃が 上がる');
  // 食べる 物が ない: 何も 起こらない
  const e0 = foe(b, m, EAT);
  assert.equal(e0.c10yEat.n, 0);
  // 3回 動く ごとに 食べる
  const k = m.c10y;
  Object.assign(k, { eatLeft: 3, veilLeft: 99, ringLeft: 99 });
  foe(b, m);
  foe(b, m);
  assert.equal(m.telegraph, null);
  foe(b, m);
  assert.equal(c10cPub(m).eatLeft, cf.eat.every);
  // やみの とばり: 与える ダメージ 半分・てらすで 消える
  foe(b, m, VEIL);
  assert.equal(k.veil, cf.veil.turns);
  assert.equal(c10cPub(m).veil, cf.veil.turns);
  m.hp = m.maxHp;
  const hit = () => { const hp = m.hp; b.damage(a0, m, 1000, ev0(), {}); const d = hp - m.hp; m.hp = m.maxHp; return d; };
  assert.equal(hit(), 500, 'とばり: 半分');
  teruOf(b).charge = teruOf(b).max;
  const et = act(b, a1, { type: 'ability', id: TERU });
  assert.ok(et.c10yClear && k.veil === 0, et.lines.join('/'));
  assert.equal(hit(), 1000);
  // 星の音を かざす（前ぶれ → 次の 番に 全体。防御で へる）
  Object.assign(k, { eatLeft: 99, veilLeft: 99, ringLeft: 1 });
  const eu = foe(b, m);
  assert.ok(eu.c10yRingUp && k.ringReady, eu.lines.join('/'));
  assert.equal(c10cTell(b), 'ring');
  assert.equal(c10cPub(m).ring, 1);
  b.allies[0].defending = true;
  const eb = foe(b, m);
  assert.ok(eb.c10yBlast, eb.lines.join('/'));
  const lost = b.allies.map((a) => a.maxHp - a.hp);
  assert.ok(lost[0] < Math.min(...lost.slice(1)), `身を 守ると へる ${lost}`);
  // 前ぶれの 間に 星のうた: 止まる（1回 動けない）
  big(b);
  Object.assign(k, { ringLeft: 1 });
  foe(b, m);
  assert.ok(k.ringReady);
  b.c9sp.song.charge = b.c9sp.song.max;
  const es = act(b, a1, { type: 'ability', id: SONG });
  assert.ok(es.c10yStop && !k.ringReady && k.stun, es.lines.join('/'));
  const est = foe(b, m);
  assert.ok(est.c10yStill, est.lines.join('/'));
  assert.ok(ABILITIES[BLAST] && ABILITIES[STILL]);
  // HP 3わりで 終わる（ひざを つく。たおれない。経験値と 品は もらえる）
  m.hp = Math.round(m.maxHp * 0.35);
  const ev = ev0();
  const before = m.hp;
  b.damage(a0, m, 99999, ev, {});
  assert.equal(m.hp, Math.floor(m.maxHp * 0.3));
  assert.ok(before > m.hp);
  assert.ok(m.alive && b.c10c.won && b.killed.includes(C10C_ALGOL));
  assert.equal(b.pendingEnd?.outcome, 'win');
  assert.equal(c10cPub(m).c10Down, 1);
  assert.equal(c10cPub(m).algolStage, 4);
});

// ───────────── 自動の 仲間 ─────────────
test('自動の 仲間: たいさ … 光った 石に いると 3回に 1回 うつる／アルゴル … 強く する 技を ひかえる（どちらも 人が えらんで いる 時だけ。完全オートでは しない）', () => {
  // たいさ: 人が えらんで いる（オートで ない 家族の キャラ）
  const b = battle({ kinds: ['player', 'support', 'support', 'support'], auto: false });
  const m = colonelOf(b);
  quiet(m);
  big(b);
  const sup = b.allies[1];
  b.c10c.stones[sup.c10stone].lit = true;
  const picks = [0, 1, 2, 3, 4, 5].map(() => c10cPlan(b, sup, decideAlly, bestHit));
  const moves = picks.filter((p) => p?.id === UTSURU);
  assert.equal(moves.length, 6 / AUTO_EVERY, `3回に 1回 ${JSON.stringify(picks)}`);
  assert.ok(moves.every((p) => !b.c10c.stones[p.choice].lit), '光って いない 石へ');
  // 完全オート（みんな オート）では うつらない
  const fa = battle({ kinds: ['player', 'support', 'support', 'support'], auto: true });
  const s2 = fa.allies[1];
  fa.c10c.stones[s2.c10stone].lit = true;
  for (let i = 0; i < 6; i++) assert.equal(c10cPlan(fa, s2, decideAlly, bestHit), null);
  // 家族の キャラの オートも うつらない
  assert.equal(c10cPlan(fa, fa.allies[0], decideAlly, bestHit), null);
  // 行き先: 光って いない・人の 少ない 石
  for (const a of b.allies) a.c10stone = 0;
  for (const s of b.c10c.stones) s.lit = false;
  b.c10c.stones[0].lit = true;
  b.c10c.stones[1].lit = true;
  assert.equal(bestStone(b, b.allies[0]), 2);
  // アルゴル: 強く する 技を ひかえる
  const g = battle({ boss: 'algol', kinds: ['player', 'support', 'support', 'support'], auto: false });
  const al = algolOf(g);
  const s = g.allies[3];
  const buffId = s.abilities.find((id) => buffCmd({ type: 'ability', id }) && ABILITIES[id].target === 'allies');
  assert.ok(buffId, '強く する 技を 持って いる');
  assert.equal(buffCmd({ type: 'ability', id: buffId }), true);
  assert.equal(buffCmd({ type: 'attack', target: al.id }), false);
  let used = 0;
  for (let i = 0; i < 30; i++) { const p = c10cPlan(g, s, decideAlly, bestHit); if (buffCmd(p)) used++; }
  assert.equal(used, 0, '人が えらんで いる 時は 使わない');
  // 完全オート（バッチリがんばれ）は ふだん どおり（ここでは null … ふつうの オート）
  const ga = battle({ boss: 'algol', kinds: ['player', 'support', 'support', 'support'], auto: true });
  assert.equal(c10cPlan(ga, ga.allies[3], decideAlly, bestHit), null);
});

test('人数で 合わせる: 家族の キャラの 数で HP・与える ダメージ・魔物の 仲間は 半人ぶん・仲間なしの ひとりは solo', () => {
  for (const boss of ['colonel', 'algol']) {
    const sp = boss === 'colonel' ? C10C_COLONEL : C10C_ALGOL;
    const hp = (kinds) => { const b = battle({ boss, kinds }); return (boss === 'colonel' ? colonelOf(b) : algolOf(b)).maxHp; };
    const base = MONSTERS[sp].hp;
    // 第101回 R2班: 4人も 合わせ直した（人が 1人ずつ べつの 手で はかる 道具で 長く なった ぶん。4人は few の 4人目）
    assert.equal(hp(['player', 'player', 'player', 'player']), Math.round(base * MONSTERS[sp].c10c.few.hp[3]), `${boss}: 4人は few の 4人目`);
    assert.ok(hp(['player', 'player', 'support', 'support']) < base, `${boss}: 2人`);
    assert.ok(hp(['player']) < base * 0.2, `${boss}: ひとりだけ`);
    const c = MONSTERS[sp].c10c;
    for (const k of ['hp', 'atk']) assert.equal(c.few[k].length, 5);
    assert.ok(c.few.hp[3] < 1, '4人は HPを 下げて 短く');
    const two = battle({ boss, kinds: ['player', 'player', 'support', 'support'] });
    const e = boss === 'colonel' ? colonelOf(two) : algolOf(two);
    assert.equal(e.dmgRate ?? 1, c.few.atk[1]);
  }
  // ひとりの たいさは 光る 石が いつも 2つ（にげる 石は 1つ）
  const solo = battle({ kinds: ['player'] });
  assert.deepEqual([c10cConf(C10C_COLONEL, solo).lit.n, c10cConf(C10C_COLONEL, solo).lit.half], [2, 2]);
  quiet(colonelOf(solo));
  foe(solo, colonelOf(solo));
  assert.equal(litStones(solo).length, 2);
  // 魔物の 仲間は 半人ぶん（1人 ＋ 魔物 3 … 2人の 表）
  const mon = battle({ kinds: ['player', 'monster', 'monster', 'monster'] });
  assert.equal(colonelOf(mon).maxHp, Math.round(MONSTERS[C10C_COLONEL].hp * MONSTERS[C10C_COLONEL].c10c.few.hp[1] * (1 + MONSTERS[C10C_COLONEL].c10c.monK.hp * 3)));
});

// ───────────── 強さ ─────────────
test('強さ: 人が できる 動き（えらぶ 時間 2秒・5秒）で 知って いる 人は 勝てる・知らない 人と 完全オートは 勝てない（作戦ごと。少しの 回数）', { timeout: 1500000 }, () => {
  for (const boss of ['colonel', 'algol']) {
    for (const react of [2000, 5000]) {
      const know = [1, 2, 3, 4, 5, 6].map((s) => ch9Run(boss, LV9[boss], 'know', 9090 + s * 7919, { react, flags: ORDER_FLAGS.act3[boss] }));
      const w = know.filter((r) => r.outcome === 'win');
      assert.ok(w.length >= 2, `${boss} ${react}: 知って いる 人 ${know.map((r) => r.outcome).join(',')}`);
      const sec = w.reduce((s, r) => s + r.seconds, 0) / w.length;
      assert.ok(sec <= 600, `${boss} ${react}: 長さ ${sec}秒`);
    }
    const blind = [1, 2, 3, 4].map((s) => ch9Run(boss, LV9[boss], 'blind', 9090 + s * 7919, { flags: ORDER_FLAGS.act3[boss] }));
    assert.ok(blind.filter((r) => r.outcome === 'win').length <= 1, `${boss}: 知らない 人`);
    for (const tactics of AUTO_TACTICS) {
      const auto = [1, 2, 3].map((s) => ch9Run(boss, LV9[boss], 'auto', 9090 + s * 7919, { flags: ORDER_FLAGS.act3[boss], tactics }));
      assert.equal(auto.filter((r) => r.outcome === 'win').length, 0, `${boss}: 完全オート（${TACTICS[tactics].name}）`);
    }
    for (const [job, kit] of Object.entries(CH9_KIT[boss])) for (const id of kit) if (id) assert.ok(canEquip(job, id), `${job}: ${id}`);
  }
  assert.equal(LV9.colonel, 114);
  assert.equal(LV9.algol, 116);
  // 完全オートの 作戦は shared/ai.js の TACTICS から（めいれいさせろ は のぞく）・TACTICS= で えらべる
  assert.ok(AUTO_TACTICS.includes('balanced') && AUTO_TACTICS.includes('aggressive') && AUTO_TACTICS.includes('heal'));
  assert.ok(!AUTO_TACTICS.some((k) => TACTICS[k].manual));
  const keep = process.env.TACTICS;
  process.env.TACTICS = 'aggressive,nope';
  assert.deepEqual(tacticsOf(), ['aggressive']);
  if (keep === undefined) delete process.env.TACTICS;
  else process.env.TACTICS = keep;
});

// ───────────── 品 ─────────────
test('品: 空 6こ・とりで 6こ（★5 は 空 2つ k 2.34〜2.36・とりで 2つ k 2.36〜2.38・のこりは 素材か 道具）・ボスの 品・だいじな 物・くぼ地の 武具屋に 足す 品 4つ（k 2.24〜2.26）', () => {
  const gear = [...C10C_GEAR_CHESTS.isles, ...C10C_GEAR_CHESTS.fort];
  assert.equal(gear.length, 4);
  for (const [id, [item, n]] of Object.entries(C10C_TREASURE)) {
    const it = ITEMS[item];
    assert.ok(it, item);
    assert.deepEqual(c10cChest(id), { item, n });
    if (gear.includes(id)) {
      assert.equal(it.src, id.startsWith('c10c_ic') ? 'c10i' : 'c10f', id);
      assert.equal(it.rarity, 4);
      assert.equal(it.rank, 10);
      assert.notEqual(it.type, 'weapon', '武器は 作らない');
      assert.ok(rareWhereText(item)?.length > 4, item);
    } else assert.ok(['mat', 'use'].includes(it.type), `${id}: 素材か 道具 (${it.type})`);
  }
  assert.equal(c10cChest('nope'), null);
  for (const k of [C10C_K.i2, C10C_K.i5]) assert.ok(k >= 2.34 && k <= 2.36, k);
  for (const k of [C10C_K.f3, C10C_K.f6]) assert.ok(k >= 2.36 && k <= 2.38, k);
  assert.equal(C10C_SHOP_ADD.length, 4);
  for (const k of Object.values(C10C_SHOP_K)) assert.ok(k >= 2.24 && k <= 2.26, k);
  for (const id of C10C_SHOP_ADD) { assert.equal(ITEMS[id].rarity, 0); assert.ok(ITEMS[id].price > 0); assert.notEqual(ITEMS[id].type, 'weapon'); }
  for (const id of Object.keys(ITEMS_C10C)) { assert.ok(PART3_LATE_ITEMS.has(id), id); assert.ok(ITEM_KANA[id], `${id}: 読みがな`); }
  for (const [boss, [acc]] of Object.entries(C10C_DROPS)) {
    assert.equal(MONSTERS[boss].drops.boss[0], acc);
    assert.equal(ITEMS[acc].type, 'acc');
    assert.ok(ITEMS[acc].unique);
    const sum = Object.values(ITEMS[acc].bonus).reduce((s, v) => s + v, 0);
    assert.ok(sum <= 287 && sum >= 280, `${acc}: ${sum}`);
  }
  assert.equal(ITEMS[NOTE_SI].type, 'key');
  for (const it of Object.values(ITEMS_C10C)) assert.ok(!it.resist?.water, it.name);
});

// ───────────── ヒント ─────────────
test('負けた 時の ヒント: 3つずつ（ぼんやり → はっきり）・言う 人は ノクト・15-3 の 文', () => {
  assert.equal(C10C_HINT_WHO, 'ノクト');
  assert.deepEqual(C10C_BOSS_HINTS.c10c_colonel, ['光った石に、雷が落ちるぞ。', '「うつる」で、光っていない石へ動け。', 'みんなで同じ石にかたまるな。雷が外れたら、たたみかけろ。']);
  assert.deepEqual(C10C_BOSS_HINTS.c10c_algol, ['あいつ、こっちの強くなる技を、食っているぞ。', '強くなる技は、使うな。食われて、回復される。', '暗くなったら、てらせ。あいつが音をかざしたら、スピカの星のうただ。']);
  for (const id of Object.keys(C10C_BOSS_HINTS)) {
    assert.deepEqual(BOSS_HINTS[id], C10C_BOSS_HINTS[id]);
    assert.equal(BOSS_HINT_WHO[id], 'ノクト');
    for (const t of C10C_BOSS_HINTS[id]) assert.ok(t.length <= 48, t);
  }
});

// ───────────── 絵・背景 ─────────────
test('絵: 新しい 絵は 4つまで・5しゅは 色ちがい・ボスは 2倍の こまかさ（コマ 2・3 は しょんぼり・ひざを つく）・背景 4つ', () => {
  const fresh = C10C_MINIONS.filter((sp) => MONSTER_ART[sp] && !MONSTER_ART[sp].base && !MONSTER_ART[sp].tint);
  assert.deepEqual(fresh.sort(), [...C10C_NEW_ART].sort());
  assert.ok(fresh.length <= 4);
  for (const [sp, base] of Object.entries(C10C_RECOLOR_BASE)) {
    assert.ok(MONSTER_ART[base], base);
    assert.ok(MONSTER_ART[sp].tint, `${sp}: 色ちがい`);
    assert.deepEqual(MONSTER_ART[sp].size, MONSTER_ART[base].size);
    assert.equal(MONSTERS[sp].race, MONSTERS[base].race, `${sp}: もとと おなじ 系統`);
  }
  // 新しい 絵: パレットの 中・はみださない
  for (const sp of [...C10C_NEW_ART, C10C_COLONEL, C10C_ALGOL]) {
    const d = MONSTER_ART[sp];
    const pal = new Set(d.pal.map((c) => c.toLowerCase()));
    for (const f of sp.startsWith('c10c_') && !C10C_NEW_ART.includes(sp) ? [0, 1, 2, 3] : [0, 1]) {
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
  for (const sp of [C10C_COLONEL, C10C_ALGOL]) {
    assert.equal(MONSTERS[sp].artScale, 0.5);
    assert.equal(monsterFine(sp), 2);
    assert.ok(MONSTER_ART[sp].size[0] >= 160);
    const [w, h] = monsterSize(sp);
    assert.ok(w >= 80 && w <= 130 && h >= 95 && h <= 130, `${sp}: ${w}×${h}`);
  }
  for (const id of ['c10c_sky', 'c10c_ruin', 'c10c_belt', 'c10c_room']) assert.ok(battleBgSpec(id), id);
  assert.equal(FIXED_C10C.c10c_colonel.bg, 'c10c_ruin');
  assert.equal(FIXED_C10C.c10c_algol.bg, 'c10c_room');
});

test('もとの 作品の 名前・しるし・決まり文句を 使わない（ゲームに 出る 文）', () => {
  const files = ['public/js/shared/data/monsters-c10c.js', 'public/js/shared/data/abilities-c10c.js', 'public/js/shared/data/items-c10c.js', 'public/js/shared/battle-c10c.js', 'public/js/client/battle-c10c.js', 'public/js/shared/data/boss-hints-c10c.js', 'public/js/shared/data/companions-c10c.js', 'public/js/client/render/c10c-art.js'];
  const bad = ['ムスカ大佐', 'ムスカ ', 'ムスカ」', 'ムスカの', 'ラピュタ', '天空の城', 'パズー', 'シータ', '飛行石', 'サングラス', 'ペンダント', '茶色のスーツ', '銃', 'ピストル', '見ろ', 'ゴミのよう', '目がぁ', '3分間', '三分間', '待ってやる', '人がゴミ', 'バルス', 'ロボット兵'];
  for (const f of files) {
    const src = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8').split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
    for (const w of bad) assert.ok(!src.includes(w), `${f}: ${w}`);
  }
  assert.equal(MONSTERS[C10C_COLONEL].name, 'たいさムスカリ');
  assert.equal(MONSTERS[C10C_ALGOL].name, 'アルゴル');
  // 見た目は 設計の とおり（むらさきの 軍服・丸い ゴーグル・花の しるしの ぼうし・雷の 石ばん ／ 銀の かみ・こい 色の マント・ひたいの 灰色の 星）
  for (const w of ['むらさきの軍服', '丸いゴーグル', '花のしるし', '石ばん']) assert.ok(MONSTERS[C10C_COLONEL].desc.includes(w), w);
  for (const w of ['銀のかみ', 'マント', '灰色の星']) assert.ok(MONSTERS[C10C_ALGOL].desc.includes(w), w);
});

// ───────────── がめん ─────────────
test('がめん: 画面の 上の まど・うき石の まど（3つの 石と だれが どこ・光る 石）・しょんぼり・ひざを つく え・しるし・バナー・えんしゅつ・コマンド「うつる」（行き先は 1回で 決まる まど）', () => {
  for (const id of C10C_OWN_TELE) assert.ok(CH6_OWN_TELE.has(id), id);
  const col = { species: C10C_COLONEL, alive: true, c10Kind: 'colonel', stones: [{ lit: 1, broken: 0, crack: 0 }, { lit: 0, broken: 0, crack: 1 }, { lit: 0, broken: 1, crack: 0 }], dazzle: 0, rest: 0, half: 0 };
  const allies = [{ id: 'a0', name: 'タロウ', alive: true, stone10: 0 }, { id: 'a1', name: 'ハナ', alive: true, stone10: 1 }, { id: 'a2', name: 'ジロウ', alive: false, stone10: 1 }];
  const top = c10cHtml(col, { allies, me: 'a0' });
  assert.ok(top.html.includes('左の石') && top.html.includes('うつる') && top.cls.includes('warn'), top.html);
  assert.ok(c10cHtml({ ...col, rest: 1 }).cls.includes('good'));
  assert.ok(c10cHtml({ ...col, dazzle: 1 }).html.includes('まぶしい'));
  const st = stonesHtml(col, allies, 'a0');
  assert.equal((st.match(/class="st/g) || []).length, 3, '3つの 石');
  assert.ok(st.includes('左の石') && st.includes('まん中の石') && st.includes('右の石'));
  assert.ok(st.includes('class="st lit"') && st.includes('光っている'), '光る 石が わかる');
  assert.ok(st.includes('タロウ') && st.includes('ハナ') && st.includes('ジロウ'), 'だれが どこ');
  assert.ok(st.includes('くずれた') && st.includes('ひび'));
  assert.ok(st.includes('class="me"'), '自分は 目立つ');
  assert.equal(stonesHtml({ ...col, c10Down: 1 }, allies), '');
  const alg = { species: C10C_ALGOL, alive: true, c10Kind: 'algol', eatLeft: 1, eatEvery: 3, veil: 0, ring: 0, still: 0 };
  assert.ok(c10cHtml(alg).html.includes('あと1') && c10cHtml(alg).cls.includes('warn'));
  assert.ok(c10cHtml({ ...alg, ring: 1 }).html.includes('星のうた'));
  assert.ok(c10cHtml({ ...alg, eatLeft: 2, veil: 2 }).html.includes('てらす'));
  assert.equal(c10cHtml({ species: 'c10c_sheep', alive: true }).html, '');
  // え: 勝った あとは コマ 2・3（消えない）
  for (const sp of [C10C_COLONEL, C10C_ALGOL]) {
    const down = { species: sp, alive: true, c10Down: 1, dead: 1 };
    try { c10cSprite(down, 0); } catch { /* え を かく ところは ブラウザだけ */ }
    assert.equal(down.dead, -1);
  }
  assert.equal(c10cSprite({ species: C10C_COLONEL, alive: true }, 0), null);
  // しるしが こわれない
  const x = new Proxy({}, { get: () => () => {}, set: () => true });
  const scene = { time: 0, enemies: () => [col, alg], allies: () => allies, c: { get: () => ({ name: 'タロウ' }) } };
  for (const c of [col, { ...col, rest: 1 }, { ...col, dazzle: 1 }, { ...col, c10Down: 1 }, alg, { ...alg, ring: 1 }, { ...alg, veil: 2 }, { ...alg, still: 1 }, { ...alg, c10Down: 1 }]) c10cDraw(scene, x, null, c, 10, 10, 40, 40, 1);
  // バナー
  const banners = [];
  const sc2 = { game: { audio: { sfx() {} } }, banner: (t) => banners.push(t), shake() {}, myActor: { id: 'a0' } };
  for (const e of [{ c10kLit: { stones: [0] } }, { c10kMiss: { dazzled: true } }, { c10kHit: { n: 2 } }, { c10kCrack: { stone: 2 } }, { c10kDazzle: {} }, { c10yRingUp: {} }, { c10yStop: {} }, { c10yEat: { n: 3 } }, { c10yEat: { n: 0 } }, { c10yVeil: {} }, { c10yClear: {} }, { c10kMove: { ok: true, id: 'a0', to: 1 } }, { c10cDown: { id: 'x', kind: 'algol' } }, { c10cDown: { id: 'x', kind: 'colonel' } }]) c10cPresent(sc2, e);
  for (const w of ['光った', '外れた', '当たった', 'くずれた', 'まぶしい', '星の音', 'こたえた', '食べられた', '何も食べられなかった', 'とばり', 'はれた', 'うつった', 'ひざ', 'しょんぼり']) assert.ok(banners.some((t) => t.includes(w)), w);
  // コマンド「うつる」（たいさの 戦いだけ。自分の 石が 光って いれば「にげろ！」）
  const me = { id: 'a0', name: 'タロウ', abilities: [UTSURU], stone10: 0 };
  const ci = c10cCmdItems({ enemies: () => [col], allies: () => allies }, me);
  assert.ok(ci.items[0].html.includes('うつる') && ci.items[0].html.includes('にげろ') && ci.info.includes('光っている'));
  assert.equal(c10cCmdItems({ enemies: () => [alg], allies: () => [] }, me).items.length, 0);
  assert.ok(c10cCmdItems({ enemies: () => [{ ...alg, eatLeft: 2 }], allies: () => [] }, me).info.includes('強くなる技'));
  // 行き先の まど: 左・まん中・右（いまの 石と くずれた 石は えらべない）。1回 えらぶと 決まる（tapConfirm なし）
  const menus = [];
  const sent = [];
  const sc3 = { enemies: () => [col], allies: () => allies, send: (m) => sent.push(m), openCommand() {}, showMenu: (...args) => menus.push(args) };
  assert.equal(c10cCmdPick(sc3, me, 'c10cmove'), true);
  const [items, onSelect, onCancel, title, , start, , tapConfirm] = menus[0];
  assert.equal(items.length, 3);
  assert.ok(title.includes('うつる'));
  assert.deepEqual(items.map((it) => !!it.disabled), [true, false, true]);
  assert.equal(start, 1);
  assert.ok(!tapConfirm, '1回で 決まる');
  assert.ok(typeof onCancel === 'function');
  onSelect(items[1]);
  assert.deepEqual(sent, [{ type: 'ability', id: UTSURU, choice: 1 }]);
  assert.equal(c10cCmdPick(sc3, me, 'c9bteru'), false);
  // まどを 開いた あとに 石が 光った: せつめいを 今の ようすで 出し直す（ほかの せつめいは さわらない）
  const calmCol = { ...col, stones: col.stones.map((x) => ({ ...x, lit: 0 })) };
  let now = calmCol;
  const sc4 = { enemies: () => [now], allies: () => allies, myActor: me, infoEl: { textContent: '' }, info(t) { this.infoEl.textContent = t; } };
  sc4.infoEl.textContent = c10cCmdItems(sc4, me).info;
  assert.equal(refreshInfo(sc4), false);
  now = col;
  assert.equal(refreshInfo(sc4), true);
  assert.ok(sc4.infoEl.textContent.includes('光っている'));
  sc4.infoEl.textContent = 'ほかの 技の せつめい';
  now = calmCol;
  assert.equal(refreshInfo(sc4), false);
  // コマンドの 行き先（battle.js → c8r → c9a → c9b）: 第2幕の「水の音を鳴らす」も とどく
  const route = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.ok(route.includes("case 'c10bring': case 'c10cmove': return c8rCmdPick"));
  for (const f of ['battle-c8r.js', 'battle-c9a.js']) {
    const s = readFileSync(new URL(`../public/js/client/${f}`, import.meta.url), 'utf8');
    assert.ok(s.includes("value === 'c10bring' || value === 'c10cmove'"), f);
  }
  // えんしゅつ: 技の anim は ぜんぶ ある（battlefx-c8c.js から とどく）・大きく 出す 技・味方の まど・音
  const fx = new Proxy({}, { get: () => () => {} });
  const anims = [...new Set(Object.values(C10C_ABILITIES).map((a) => a.anim))];
  for (const a of anims) {
    assert.equal(playC10cFx(fx, a, [{ x: 100, y: 60 }, { x: 140, y: 70 }], null, {}), true, a);
    assert.equal(playC10cFx(fx, a, [], null, {}), true, `${a}: 的が ない 時も`);
    assert.equal(playC8cFx(fx, a, [{ x: 100, y: 60 }], null, {}), true, `${a}: battlefx-c8c.js から とどく`);
  }
  for (const a of [...C10C_SCREEN_ANIMS, ...Object.keys(C10C_ALLY_FX), ...Object.keys(C10C_SFX)]) assert.ok(anims.includes(a), a);
  for (const [kk, v] of Object.entries(C10C_ALLY_FX)) assert.equal(CH4_ALLY_FX[kk], v, kk);
  for (const a of Object.values(C10C_ABILITIES)) assert.ok(firstSentence(a.desc).length >= 6 && firstSentence(a.desc).length <= 40, a.name);
  assert.equal(ABILITIES[UTSURU].noAuto, true);
});

// ───────────── 字 ─────────────
test('文字: 子ども向けの 漢字・文の 中に 空白なし（kanji-check の gameFiles に 入って いる）', () => {
  const mine = [
    'public/js/shared/data/monsters-c10c.js', 'public/js/shared/data/abilities-c10c.js',
    'public/js/shared/data/encounters-c10c.js', 'public/js/shared/data/companions-c10c.js', 'public/js/shared/data/items-c10c.js', 'public/js/shared/data/boss-hints-c10c.js',
    'public/js/shared/battle-c10c.js', 'public/js/client/battle-c10c.js', 'public/js/client/render/c10c-art.js', 'public/js/client/render/c10c-bg.js', 'public/js/client/render/battlefx-c10c.js',
  ];
  const gf = gameFiles();
  for (const f of mine) {
    const g = gf.find((x) => x.replace(/\\/g, '/').endsWith(f));
    assert.ok(g, `${f} は gameFiles に ある`);
    assert.deepEqual(checkFile(g).filter((p) => p.kind !== 'kana'), [], f);
  }
});
