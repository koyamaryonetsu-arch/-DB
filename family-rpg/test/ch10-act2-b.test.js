// 第95回 B班: 第3部 第2章 第2幕「青と白」の 戦いと 品（docs/plan-part3-c10b.md の 14-3・14-4）
// 名前の 約束・ふつうの 魔物 7しゅ・見はりの 戦い・スピカの ごほうび・サー・ゲッコー（水を たもつ）・かいとう シロフクロウ（本物を 見きわめる）・
// 自動の 仲間・人数で 合わせる・強さ（人が できる 動き・2秒と 5秒・青 → 白 と 白 → 青）・ふつうの 戦いの 長さ・品・ヒント・絵・背景・がめん・えんしゅつ・文字
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Battle, atbRate } from '../public/js/shared/battle.js';
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
import {
  C10B_B as C10B, C10B_BONUS_B, C10B_PED_B, C10B_MAP_B, C10B_BATTLE_B as C10B_BATTLE, C10B_MON_PREFIX_B, C10B_BOSS_MON_B, C10B_TABLE_B,
  C10B_CHEST_IDS_B as C10B_CHEST_IDS, C10B_NOTES_B, C10B_TRACKS_B, C10B_OPEN_B,
} from '../public/js/shared/data/c10b-names-b.js';
import { C10A_B as C10A } from '../public/js/shared/maps/c10a-flags.js';
import {
  MONSTERS_C10B, C10B_MINIONS, C10B_BLUE_MON, C10B_WHITE_MON, C10B_RECOLOR_BASE, C10B_NEW_ART, C10B_GECKO, C10B_OWL, C10B_OWL_FAKE, C10B_MAT_DROPS, GECKO_NAME, OWL_NAME,
} from '../public/js/shared/data/monsters-c10b.js';
import { C10B_ABILITIES, MIZUOTO } from '../public/js/shared/data/abilities-c10b.js';
import { FRIENDS_C10B } from '../public/js/shared/data/companions-c10b.js';
import { ENCOUNTERS_C10B, FIXED_C10B, ZONE_BG_C10B, C10B_WATCH } from '../public/js/shared/data/encounters-c10b.js';
import { ITEMS_C10B, C10B_TREASURE, C10B_K, C10B_SHOP_K, C10B_GEAR_CHESTS, C10B_SHOP_ADD, C10B_DROPS, NOTE_SO, NOTE_LA, c10bChest } from '../public/js/shared/data/items-c10b.js';
import { C10B_BOSS_HINTS, C10B_HINT_WHO } from '../public/js/shared/data/boss-hints-c10b.js';
import {
  c10bConf, c10bTell, c10bPlan, c10bPub, geckoOf, owlReal, owlsOf, owlVisible, OWL_POS, STORM, DRY, SHUFFLE, STEAL, REWARD_SONG, AUTO_EVERY, aimedAt,
} from '../public/js/shared/battle-c10b.js';
import { TERU, TERU_MAX, teruOf } from '../public/js/shared/battle-c9b.js';
import { SONG, SONG_MAX } from '../public/js/shared/battle-c9d.js';
import { REWARD_HEAL, REWARD_TERU } from '../public/js/shared/battle-c10a.js';
import { c9aAfter, bestHit } from '../public/js/shared/battle-c9a.js';
import { ch9Run, ch9Party, LV9, CH9_KIT } from '../tools/sim-ch9.mjs';
import { ORDER_FLAGS } from '../tools/sim-ch10.mjs';
import { tableLength, fixedLength } from '../tools/sim-ch9-field.mjs';
import { decideAlly } from '../public/js/shared/ai.js';
import { MONSTER_ART, monsterSize, monsterFine } from '../public/js/client/render/monsters.js';
import { playC10bFx } from '../public/js/client/render/battlefx-c10b.js';
import { playC8cFx } from '../public/js/client/render/battlefx-c8c.js';
import { battleBgSpec } from '../public/js/client/render/battlefx.js';
import { C10B_SCREEN_ANIMS, C10B_ALLY_FX, C10B_SFX, C10B_OWN_TELE, c10bDraw, c10bPresent, c10bSprite, c10bCmdItems, c10bCmdPick, c10bHtml, waterMeter, posName } from '../public/js/client/battle-c10b.js';
import { CH4_ALLY_FX } from '../public/js/client/battle-ch4.js';
import { CH6_OWN_TELE } from '../public/js/client/battle-ch6.js';
import { firstSentence } from '../public/js/client/ui/skillinfo.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';

const ev0 = () => ({ lines: [], upd: [], results: [] });
const groupOf = (id) => FIXED_ENCOUNTERS[id].group.flatMap(([sp, n]) => Array(n).fill(sp));
const BASE_FLAGS = { c9_child: true, c9_act1: true, c9_song1: true };
// kinds … 味方の 種類（'player' 家族の キャラ・'support' 酒場の 人・'monster' 魔物の 仲間）
function battle({ boss = 'gecko', kinds = ['player', 'player', 'player', 'player'], seed = 3, flags = BASE_FLAGS, enemies = null } = {}) {
  const four = ch9Party(boss, LV9[boss]);
  const allies = kinds.map((k, i) => ({ char: structuredClone(four[i % 4]), kind: k, controller: k === 'player' ? 'sim' : null, auto: true, tactics: 'balanced' }));
  const id = boss === 'gecko' ? C10B_BATTLE.blue : C10B_BATTLE.white;
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
test('名前の 約束（14-4）: フラグ・おまけ・台・マップ・決まった 戦い・魔物の id・出る 表・宝箱・だいじな 物・曲・幕の 切りかえ（かりの 置き場 c10b-names-b.js）', () => {
  assert.deepEqual(C10B, {
    start: 'c10b_start', blueIn: 'c10b_blue_in', blueKey: 'c10b_blue_key', blueBoss: 'c10b_blue_boss', noteSo: 'c10_note_so',
    whiteIn: 'c10b_white_in', white2: 'c10b_white2', whiteBoss: 'c10b_white_boss', noteLa: 'c10_note_la', act2: 'c10_act2',
  });
  assert.deepEqual(C10B_BONUS_B, { b: 'c10b_bonus_b', w: 'c10b_bonus_w' });
  assert.deepEqual(C10B_PED_B, { so: 'c10_ped_so', la: 'c10_ped_la' });
  assert.deepEqual(Object.values(C10B_MAP_B), ['c10b_blue1', 'c10b_blue2', 'c10b_white1', 'c10b_white2', 'c10b_white3']);
  assert.deepEqual(C10B_BATTLE, { blue: 'c10b_gecko', white: 'c10b_owl', watch: ['c10b_watch1', 'c10b_watch2', 'c10b_watch3'] });
  assert.deepEqual(C10B_BOSS_MON_B, { blue: C10B_GECKO, white: C10B_OWL, fake: C10B_OWL_FAKE });
  for (const sp of Object.keys(MONSTERS_C10B)) assert.ok(sp.startsWith(C10B_MON_PREFIX_B), sp);
  assert.deepEqual(Object.values(C10B_TABLE_B), ['t10b_blue_wet', 't10b_blue_dry']);
  for (const t of Object.values(C10B_TABLE_B)) assert.ok(ENCOUNTER_TABLES[t], t);
  assert.deepEqual(C10B_CHEST_IDS.blue, ['c10b_bc1', 'c10b_bc2', 'c10b_bc3', 'c10b_bc4', 'c10b_bc5', 'c10b_bc6']);
  assert.deepEqual(C10B_CHEST_IDS.white, ['c10b_wc1', 'c10b_wc2', 'c10b_wc3', 'c10b_wc4', 'c10b_wc5', 'c10b_wc6']);
  assert.deepEqual(C10B_CHEST_IDS.bonus, ['c10b_bbonus', 'c10b_wbonus']);
  assert.deepEqual(Object.keys(C10B_TREASURE).sort(), [...C10B_CHEST_IDS.blue, ...C10B_CHEST_IDS.white, ...C10B_CHEST_IDS.bonus].sort());
  assert.deepEqual(C10B_NOTES_B, { so: NOTE_SO, la: NOTE_LA });
  assert.deepEqual([NOTE_SO, NOTE_LA], ['note_so', 'note_la']);
  assert.equal(C10B_OPEN_B, 'PART3_C10B_OPEN');
  assert.deepEqual(Object.values(C10B_TRACKS_B), ['c10b_blue', 'c10b_gecko', 'c10b_night', 'c10b_white', 'c10b_owl', 'c10b_five']);
  // 決まった 戦い: 中ボスは にげられない・曲は F班の id（先に つないだ）。見はりは にげられる・負けても お金が へらない
  assert.equal(FIXED_ENCOUNTERS.c10b_gecko.bgm, 'c10b_gecko');
  assert.equal(FIXED_ENCOUNTERS.c10b_owl.bgm, 'c10b_owl');
  for (const id of [C10B_BATTLE.blue, C10B_BATTLE.white]) assert.ok(FIXED_C10B[id].boss && FIXED_C10B[id].canFlee === false);
  for (const id of C10B_BATTLE.watch) assert.ok(FIXED_ENCOUNTERS[id].canFlee === true && FIXED_ENCOUNTERS[id].loseOk && !FIXED_ENCOUNTERS[id].boss, id);
});

// ───────────── ふつうの 魔物 ─────────────
test('ふつうの 魔物 7しゅ: 青 4しゅ Lv109〜110・白の 見はり 3しゅ Lv111〜112・仲間に なる・今の 素材・今 ある 系統・ランク・出る 表と 見はりの 戦い', () => {
  assert.equal(C10B_BLUE_MON.length, 4);
  assert.equal(C10B_WHITE_MON.length, 3);
  const races = new Set(Object.entries(MONSTERS).filter(([id]) => !MONSTERS_C10B[id]).map(([, m]) => m.race));
  const mats = new Set(Object.entries(MAT_DROPS).filter(([sp]) => !MONSTERS_C10B[sp]).map(([, v]) => v[0]));
  for (const sp of C10B_MINIONS) {
    const m = MONSTERS[sp];
    assert.ok(m && m.region === 6, sp);
    const [lo, hi] = C10B_BLUE_MON.includes(sp) ? [109, 110] : [111, 112];
    assert.ok(m.lv >= lo && m.lv <= hi, `${sp}: Lv${m.lv}`);
    assert.ok(races.has(m.race), `${sp}: 今 ある 系統`);
    assert.ok(MONSTER_FRIENDS[sp] && MONSTER_FRIENDS[sp] === FRIENDS_C10B[sp], `${sp}: 仲間に なる`);
    assert.ok(MONSTER_FRIENDS[sp].rate >= 1 / 26 && MONSTER_FRIENDS[sp].rate <= 1 / 10, sp);
    const g = Object.values(MONSTER_FRIENDS[sp].growth).reduce((s, v) => s + v, 0);
    assert.ok(g >= 5.8 - 1e-9 && g <= 7.3, `${sp}: growth ${g}`);
    for (const [, id] of MONSTER_FRIENDS[sp].learn) assert.ok(ABILITIES[id], `${sp}: ${id}`);
    assert.ok(MAT_DROPS[sp] === C10B_MAT_DROPS[sp] && ITEMS[MAT_DROPS[sp][0]], `${sp}: 素材`);
    assert.ok(mats.has(MAT_DROPS[sp][0]), `${sp}: 今の 素材`);
    assert.ok(['F', 'E', 'D', 'C'].includes(rankOf(sp, MONSTERS)), `${sp}: ランク ${rankOf(sp, MONSTERS)}`);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${sp}: ${a.id}`);
    for (const d of Object.values(m.drops)) assert.ok(ITEMS[d[0]], `${sp}: ${d[0]}`);
    assert.ok(MONSTER_FRIENDS[sp].noFamily, `${sp}: 系統配合の 子に ならない`);
  }
  // 青の 魔物は 出る 表（ランクは 表から）・白の 見はりは 見つかった 時だけ（ランクは 手で きめる）
  for (const sp of C10B_BLUE_MON) assert.equal(MONSTER_RANKS[sp], rankOf(sp, MONSTERS), sp);
  for (const sp of C10B_WHITE_MON) assert.ok(FRIENDS_C10B[sp].rank && !MONSTER_RANKS[sp], sp);
  for (const [t, rows] of Object.entries(ENCOUNTERS_C10B)) for (const r of rows) for (const [sp] of r.group) assert.ok(C10B_BLUE_MON.includes(sp), `${t}: ${sp}`);
  const seen = new Set(Object.values(ENCOUNTERS_C10B).flatMap((rows) => rows.flatMap((r) => r.group.map((g) => g[0]))));
  assert.equal(seen.size, 4, '青の 4しゅ ぜんぶ 出る');
  // 水が 多い 表は 水の 魔物が 多い・少ない 表は 砂の 魔物が 多い
  const share = (t, sp) => { const rows = ENCOUNTERS_C10B[t]; return rows.reduce((s, r) => s + r.w * r.group.filter((g) => g[0] === sp).length, 0); };
  assert.ok(share('t10b_blue_wet', 'c10b_spirit') + share('t10b_blue_wet', 'c10b_fish') > share('t10b_blue_wet', 'c10b_crab') + share('t10b_blue_wet', 'c10b_sand'));
  assert.ok(share('t10b_blue_dry', 'c10b_crab') + share('t10b_blue_dry', 'c10b_sand') > share('t10b_blue_dry', 'c10b_spirit') + share('t10b_blue_dry', 'c10b_fish'));
  const watchSeen = new Set(Object.values(C10B_WATCH).flatMap((g) => g.map((x) => x[0])));
  assert.deepEqual([...watchSeen].sort(), [...C10B_WHITE_MON].sort());
  assert.deepEqual(Object.values(ZONE_BG_C10B), ['c10b_mirror', 'c10b_mirror']);
  for (const t of Object.keys(ZONE_BG_C10B)) assert.equal(ZONE_BG[t], ZONE_BG_C10B[t]);
});

test('ふつうの 戦いの 長さ: 勇者 ＋ ゲームと おなじ 作りの 酒場の 仲間 3人で 青の 表は 90秒 いない・見はりの 戦いは 120秒 いない', { timeout: 600000 }, () => {
  for (const t of Object.keys(ENCOUNTERS_C10B)) {
    const r = tableLength(t, 12);
    assert.equal(r.win, 1, t);
    assert.ok(r.avg <= 90, `${t}: ${r.avg}秒`);
  }
  for (const id of C10B_BATTLE.watch) {
    const r = fixedLength(id, 10);
    assert.equal(r.win, 1, id);
    assert.ok(r.avg <= 120, `${id}: ${r.avg}秒`);
  }
});

// ───────────── スピカの ごほうび ─────────────
test('スピカの ごほうび: 青の 音（c10_note_so）で 星のうた 5回 → 4回・白の 音（c10_note_la）で はじめから てらすが たまって いる・第1幕の ごほうびと 合わせて きく', () => {
  const plain = battle({ enemies: ['c10b_crab'] });
  assert.equal(plain.c9sp.song.max, SONG_MAX);
  assert.equal(SONG_MAX, 5);
  assert.equal(REWARD_SONG, 4);
  assert.equal(teruOf(plain).charge, 0);
  const so = battle({ enemies: ['c10b_crab'], flags: { ...BASE_FLAGS, c10_note_so: true } });
  assert.equal(so.c9sp.song.max, 4, '青の 音: 4回で たまる');
  assert.equal(teruOf(so).charge, 0);
  const la = battle({ enemies: ['c10b_crab'], flags: { ...BASE_FLAGS, c10_note_la: true } });
  assert.equal(teruOf(la).charge, TERU_MAX, '白の 音: はじめから たまって いる');
  assert.equal(la.c9sp.song.max, SONG_MAX);
  // 4つの 音 ぜんぶ（第1幕の ごほうび … ほのかな光 9%・てらす 3回 と いっしょ）
  const all = battle({ enemies: ['c10b_crab'], flags: { ...BASE_FLAGS, [C10A.noteRe]: true, [C10A.noteFa]: true, [C10B.noteSo]: true, [C10B.noteLa]: true } });
  assert.equal(teruOf(all).max, REWARD_TERU);
  assert.equal(teruOf(all).charge, REWARD_TERU, 'てらすは 3回で たまり、はじめから たまって いる');
  assert.equal(all.c9sp.song.max, 4);
  assert.equal(all.c10rew.heal, REWARD_HEAL);
  // たまって いるので すぐ てらせる
  const a0 = all.allies[0];
  const e = act(all, a0, { type: 'ability', id: TERU });
  assert.ok(e.c9bTeru, e.lines.join('/'));
  // 新しい コマンドは ない（水の音を鳴らす は ゲッコーの 戦いだけ）
  assert.ok(!plain.allies[0].abilities.includes(MIZUOTO));
  assert.ok(battle().allies.every((a) => a.abilities.includes(MIZUOTO)));
  assert.ok(!battle({ boss: 'owl' }).allies[0].abilities.includes(MIZUOTO));
});

// ───────────── ゲッコー ─────────────
test('ゲッコー: 水の めもり（はじめ 2・3回に 2回 かわく）・0 で 砂の体（1わり）と 砂あらし・2 いじょうで ぬれた（1.3倍・雷は さらに）・水の音を鳴らす（＋2・さい大 3）・水や 氷の 技で ＋1', () => {
  const b = battle();
  const m = geckoOf(b);
  assert.equal(m.species, C10B_GECKO);
  quiet(m);
  big(b);
  const cf = c10bConf(C10B_GECKO, b);
  assert.deepEqual([cf.water.start, cf.water.max, cf.water.ring, cf.water.elem, cf.sand, cf.wet, cf.bolt], [2, 3, 2, 1, 0.1, 1.3, 1.3]);
  assert.equal(m.c10x.water, 2);
  // かわき: 3回に 2回
  const seen = [];
  for (let i = 0; i < 3; i++) { m.c10x.water = 2; foe(b, m); seen.push(m.c10x.water); }
  assert.equal(seen.filter((w) => w === 1).length, 2, `3回に 2回 ${seen}`);
  // ダメージの ばい
  const [a0, a1] = b.allies;
  const hit = (w, el) => { m.c10x.water = w; m.c10x.bigReady = false; const hp = m.hp; b.damage(a0, m, 1000, ev0(), el ? { element: el } : {}); const d = hp - m.hp; m.hp = m.maxHp; return d; };
  assert.equal(hit(0), 100, '砂の体: 1わり');
  assert.equal(hit(1), 1000);
  assert.equal(hit(2), 1300, 'ぬれた: 1.3倍');
  assert.equal(hit(2, 'bolt'), 1690, '雷は さらに 1.3倍');
  // 水・氷の 技で ＋1（1回の 行動に 1つ）
  m.c10x.water = 1;
  const ev = ev0();
  b.damage(a0, m, 100, ev, { element: 'ice' });
  b.damage(a0, m, 100, ev, { element: 'water' });
  assert.equal(m.c10x.water, 2, '1回の 行動に 1つ');
  assert.ok(ev.c10xWet);
  // 水の音を鳴らす（その 人の 番）: ＋2・さい大 3
  m.c10x.water = 0;
  const e = act(b, a1, { type: 'ability', id: MIZUOTO });
  assert.ok(e.c10xRing && m.c10x.water === 2, e.lines.join('/'));
  act(b, a1, { type: 'ability', id: MIZUOTO });
  assert.equal(m.c10x.water, 3, 'さい大 3');
  // 0 の 間は 番ごとに 砂あらし（全体）
  m.c10x.water = 0;
  m.c10x.dryN = 0;
  const es = foe(b, m);
  assert.ok(es.c10xStorm && es.fx?.anim === 'c10x_storm', es.lines.join('/'));
  assert.equal(c10bPub(m).water, 0);
  assert.equal(c10bPub(m).geckoStage, 2);
  assert.ok(ABILITIES[STORM] && ABILITIES[DRY]);
});

test('ゲッコー: めもり 3 で 大かんそうの 前ぶれ（b.tell）→ 次の 番に 水 0 ＋ 全体の 大ダメージ（防御で へる）・前ぶれの 間に 雷か 氷で 止まる（水は 2）・勝つと びしょぬれ（たおれない）', () => {
  const b = battle();
  const m = geckoOf(b);
  quiet(m);
  big(b);
  assert.equal(b.tellAll, true);
  assert.equal(c10bTell(b), 'gecko', 'いつも 人が えらぶのを 待つ');
  m.c10x.water = 3;
  const eu = foe(b, m);
  assert.ok(eu.c10xDryUp && m.c10x.bigReady, eu.lines.join('/'));
  assert.equal(c10bTell(b), 'dry');
  assert.equal(b.tell, 'dry');
  assert.equal(c10bPub(m).big, 1);
  // 大かんそう（防御で へる）
  b.allies[0].defending = true;
  const ed = foe(b, m);
  assert.ok(ed.c10xDry, ed.lines.join('/'));
  assert.equal(m.c10x.water, 0);
  const lost = b.allies.map((a) => a.maxHp - a.hp);
  assert.ok(lost[0] < Math.min(...lost.slice(1)), `身を 守ると へる ${lost}`);
  // 雷か 氷で 止まる
  for (const el of ['bolt', 'ice']) {
    m.c10x.water = 3;
    m.c10x.bigReady = true;
    const ev = ev0();
    b.damage(b.allies[0], m, 100, ev, { element: el });
    assert.ok(ev.c10xStop && !m.c10x.bigReady && m.c10x.water === 2, el);
  }
  // 炎では 止まらない
  m.c10x.water = 3;
  m.c10x.bigReady = true;
  b.damage(b.allies[0], m, 100, ev0(), { element: 'fire' });
  assert.ok(m.c10x.bigReady);
  m.c10x.bigReady = false;
  // 勝つ
  m.c10x.water = 2;
  m.hp = 50;
  const ew = ev0();
  b.damage(b.allies[0], m, 999, ew, {});
  assert.ok(m.alive && m.hp === 1 && m.c10x.down, 'たおれない');
  assert.ok(ew.c10bDown && b.pendingEnd?.outcome === 'win');
  assert.ok(b.killed.includes(C10B_GECKO), '経験値・落とし物は ふつう');
  assert.equal(c10bPub(m).c10Down, 1);
  assert.ok(ew.postLines.some((l) => l.includes('びしょぬれ')));
});

// ───────────── シロフクロウ ─────────────
test('シロフクロウ: はじめ 3人（左・まん中・右）・本物 1人だけが 動く・動くと 場所が わかる・まぼろしを ねらうと からかいの羽・全体攻撃は 本物に 半分（まぼろしの HPは へらない）・がめんでは 見分けられない', () => {
  const b = battle({ boss: 'owl' });
  const owls = owlsOf(b);
  assert.equal(owls.length, 4);
  const vis = owlVisible(b);
  assert.equal(vis.length, 3);
  assert.deepEqual(vis.map((e) => e.name), ['左のシロフクロウ', 'まん中のシロフクロウ', '右のシロフクロウ']);
  assert.deepEqual(OWL_POS[3], ['左', 'まん中', '右']);
  const real = owlReal(b);
  assert.ok(vis.includes(real));
  for (const e of vis) assert.equal(!!e.c10oFake, e !== real);
  // まぼろしは ゲージが たまらない（動かない）
  for (const e of vis) assert.equal(atbRate(e) > 0, e === real, 'まぼろしは ゲージが たまらない');
  // がめんへの pub は どれも おなじ（種類・HP）
  const pubs = vis.map((e) => c10bPub(e));
  assert.ok(pubs.every((p) => p.species === C10B_OWL && p.hp === real.hp && p.maxHp === real.maxHp && p.c10Kind === 'owl'));
  assert.deepEqual(pubs.map((p) => p.owlPos), [0, 1, 2]);
  // 本物が 動く → 場所が わかる
  quiet(real);
  big(b);
  for (const e of owls) e.actions = [{ w: 1, id: 'm_nothing' }];
  const em = foe(b, real);
  assert.ok(em.c10oMoved && em.c10oMoved.pos === real.c10oPos, em && JSON.stringify(em.c10oMoved));
  assert.equal(b.c10b.seen, real.id);
  // まぼろしを ねらった 攻撃: すりぬけ ＋ からかいの羽（その 人に 小さな ダメージ・次の 番が おくれる）。本物の HPは へらない
  const fake = vis.find((e) => e !== real);
  const a0 = b.allies[0];
  const hp0 = real.hp;
  const ahp = a0.hp;
  const et = act(b, a0, { type: 'attack', target: fake.id });
  assert.ok(et.c10oTease, et.lines.join('/'));
  assert.equal(real.hp, hp0);
  assert.ok(a0.hp < ahp, 'からかいの羽の ダメージ');
  assert.ok(a0.atb < 0, `次の 番が おくれる ${a0.atb}`);
  // 本物を ねらった 攻撃: ふつうに ダメージ
  const er = act(b, a0, { type: 'attack', target: real.id });
  assert.ok(real.hp < hp0 && !er.c10oTease, er.lines.join('/'));
  // 全体攻撃: 本物は 半分・まぼろしの HPは 本物と おなじ まま
  b.actCmd = { type: 'ability', id: 'm_nothing' };
  for (const e of vis) e.hp = real.hp;
  const hpR = real.hp;
  const ev = ev0();
  b.damage(a0, real, 1000, ev, {});
  assert.equal(hpR - real.hp, 500, '全体攻撃は 半分');
  const fhp = fake.hp;
  const evf = ev0();
  b.damage(a0, fake, 1000, evf, {});
  assert.equal(fake.hp, fhp, 'まぼろしの HPは へらない');
  assert.ok(evf.results.some((r) => r.id === fake.id && r.dmg === 500), 'ダメージの 数は 出る（どれが 本物か わからない）');
  assert.equal(aimedAt(b, a0, real), false);
  b.actCmd = { type: 'attack', target: real.id };
  assert.equal(aimedAt(b, a0, real), true);
});

test('シロフクロウ: 2回 動く ごとに シャッフル（前ぶれ → 入れかわる・見えない）・てらすで 本物が 光る（シャッフルしても）・HP 半分で 4人（毎回 シャッフル）・ぬすむ（防御で ふせげる）・勝つと 1人に もどって おじぎ', () => {
  const b = battle({ boss: 'owl', seed: 7 });
  const st = b.c10b;
  const cf = c10bConf(C10B_OWL, b);
  assert.deepEqual([cf.n, cf.half, cf.shuffle, cf.halfShuffle, cf.aoe], [3, 4, 2, 1, 0.5]);
  for (const e of owlsOf(b)) e.actions = [{ w: 1, id: 'm_nothing' }];
  big(b);
  st.stealLeft = 99;
  const r0 = owlReal(b);
  foe(b, r0);
  const eu = foe(b, r0);
  assert.ok(eu.c10oShuffleUp && st.shuffleReady, eu.lines.join('/'));
  assert.equal(c10bPub(r0).owlShuffle, 1);
  const es = foe(b, r0);
  assert.ok(es.c10oShuffle && !st.shuffleReady, es.lines.join('/'));
  assert.equal(st.seen, null, '入れかわると わからない');
  const r1 = owlReal(b);
  assert.ok(owlVisible(b).includes(r1) && !r1.c10oFake && r1.tmul === undefined);
  for (const e of owlVisible(b)) if (e !== r1) assert.ok(e.c10oFake && e.tmul === 0);
  // てらす: 本物が 光る（シャッフルしても）
  b.c9sp.teru.charge = b.c9sp.teru.max;
  const et = act(b, b.allies[0], { type: 'ability', id: TERU });
  assert.ok(et.c10oLit && st.seen === r1.id, et.lines.join('/'));
  assert.equal(c10bPub(r1).owlLit, 1);
  for (const e of owlVisible(b)) if (e !== r1) assert.equal(c10bPub(e).owlLit, 0);
  st.shuffleReady = true;
  foe(b, r1);
  const r2 = owlReal(b);
  assert.equal(c10bPub(r2).owlLit, 1, 'シャッフルしても 光った まま');
  assert.equal(st.seen, r2.id);
  // HP 半分で 4人
  r2.hp = Math.round(r2.maxHp * 0.45);
  st.shuffleReady = false;
  const eh = foe(b, r2);
  assert.ok(eh.c10oHalf && owlVisible(b).length === 4, eh.lines.join('/'));
  assert.deepEqual(owlVisible(b).map((e) => e.name), ['左はしのシロフクロウ', '左から2のシロフクロウ', '右から2のシロフクロウ', '右はしのシロフクロウ']);
  assert.ok(eh.c10oShuffleUp, '毎回 シャッフル');
  // ぬすむ: 前ぶれ（ねらう 人）→ 防御で ふせげる・防御しないと よい 効果を ぬすまれる
  st.shuffleReady = false;
  st.stealLeft = 1;
  const [a0] = b.allies;
  a0.buffs.atk = { mult: 1.5, left: 3 };
  const r3 = owlReal(b);
  const esu = foe(b, r3);
  assert.ok(esu.c10oStealUp && st.stealReady && st.stealAim === a0.id, esu.lines.join('/'));
  assert.equal(c10bTell(b), 'steal');
  a0.defending = true;
  const eb = foe(b, r3);
  assert.ok(eb.c10oSteal?.blocked && a0.buffs.atk, eb.lines.join('/'));
  a0.defending = false;
  st.stealReady = true;
  st.stealAim = a0.id;
  const eg = foe(b, r3);
  assert.ok(eg.c10oSteal && !eg.c10oSteal.blocked && !a0.buffs.atk && r3.buffs.atk, eg.lines.join('/'));
  assert.ok(ABILITIES[SHUFFLE] && ABILITIES[STEAL]);
  // 勝つ: まぼろしは 消え、本物は HP 1 で のこる（おじぎ）
  const r4 = owlReal(b);
  r4.hp = 40;
  b.actCmd = { type: 'attack', target: r4.id };
  const ew = ev0();
  b.damage(a0, r4, 999, ew, {});
  assert.ok(r4.alive && r4.hp === 1 && ew.c10bDown && b.pendingEnd?.outcome === 'win');
  assert.deepEqual(owlsOf(b).filter((e) => e.alive), [r4], '1人に もどる');
  assert.ok(b.killed.includes(C10B_OWL), '経験値・落とし物は 本物の もの');
  assert.equal(r4.name, OWL_NAME);
  assert.ok(ew.postLines.some((l) => l.includes('おじぎ')));
});

// ───────────── 自動の 仲間 ─────────────
test('自動の 仲間: ゲッコー … 水 1 いかの 番の 3回に 1回 鳴らす／シロフクロウ … 3回に 1回 本物を ねらう（どちらも 人が えらんで いる 時だけ。完全オートでは しない）', () => {
  assert.equal(AUTO_EVERY, 3);
  const b = battle({ kinds: ['player', 'support', 'monster', 'support'] });
  const [p, s1, mon, s2] = b.allies;
  const m = geckoOf(b);
  m.c10x.water = 1;
  for (let i = 0; i < 6; i++) assert.equal(c10bPlan(b, i % 2 ? s2 : s1, decideAlly, bestHit), null, '完全オートでは 鳴らさない');
  p.auto = false;
  b.c10bAuto = 0;
  const plans = [];
  for (let i = 0; i < 6; i++) plans.push(c10bPlan(b, i % 2 ? s2 : s1, decideAlly, bestHit));
  assert.equal(plans.filter((x) => x?.id === MIZUOTO).length, 2, '6回で 2回');
  assert.equal(c10bPlan(b, p, decideAlly, bestHit), null, '家族の オートは 鳴らさない');
  assert.equal(c10bPlan(b, mon, decideAlly, bestHit), null, '魔物の 仲間は 鳴らさない');
  m.c10x.water = 2;
  b.c10bAuto = 2;
  assert.equal(c10bPlan(b, s1, decideAlly, bestHit), null, '水が ある 時は 鳴らさない');
  // 知って いる 人: 水が ない → 鳴らす・大かんそうの 前ぶれ → 雷か 氷（なければ 防御）
  p.knows9 = 'know';
  m.c10x.water = 0;
  assert.deepEqual(c10bPlan(b, p, decideAlly, bestHit), { type: 'ability', id: MIZUOTO });
  m.c10x.water = 3;
  m.c10x.bigReady = true;
  const pk = c10bPlan(b, p, decideAlly, bestHit);
  const el = pk.type === 'ability' ? ABILITIES[pk.id].effect.element || ABILITIES[pk.id].effect.parts?.[0]?.element : null;
  assert.ok(pk.type === 'defend' || ['bolt', 'ice'].includes(el), JSON.stringify(pk));
  // シロフクロウ
  const o = battle({ boss: 'owl', kinds: ['player', 'support', 'support', 'support'] });
  const real = owlReal(o);
  const [op, o1] = o.allies;
  // ふだんの オートが 1人を ねらう 攻撃を えらんだ 時に、ねらいを かえる
  const hitOne = () => ({ type: 'attack', target: owlVisible(o)[0].id });
  const tgt = () => { const c = c10bPlan(o, o1, hitOne, bestHit); return c?.target; };
  const auto = [...Array(30)].map(tgt).filter(Boolean);
  assert.ok(auto.filter((t) => t === real.id).length < 20, '完全オートは でたらめ');
  op.auto = false;
  o.c10bAuto = 0;
  const helped = [...Array(30)].map(tgt).filter(Boolean);
  assert.ok(helped.filter((t) => t === real.id).length >= 10, `人が えらんで いる 時は 3回に 1回 本物 ${helped.filter((t) => t === real.id).length}`);
  // 知って いる 人: 本物が わかって いれば 本物・わからなければ てらすか 全体の 技か 防御
  op.knows9 = 'know';
  o.c10b.seen = real.id;
  assert.equal(c10bPlan(o, op, hitOne, bestHit).target, real.id);
  o.c10b.seen = null;
  o.c9sp.teru.charge = o.c9sp.teru.max;
  assert.deepEqual(c10bPlan(o, op, decideAlly, bestHit), { type: 'ability', id: TERU });
});

test('人数で 合わせる: 家族の キャラの 数で HP・与える ダメージ・魔物の 仲間は 半人ぶん・仲間なしの ひとりは solo', () => {
  for (const boss of ['gecko', 'owl']) {
    const sp = boss === 'gecko' ? C10B_GECKO : C10B_OWL;
    const hp = (kinds) => { const b = battle({ boss, kinds }); return (boss === 'gecko' ? geckoOf(b) : owlReal(b)).maxHp; };
    const base = MONSTERS[sp].hp;
    assert.equal(hp(['player', 'player', 'player', 'player']), base, `${boss}: 4人は もとの まま`);
    assert.ok(hp(['player', 'player', 'support', 'support']) < base, `${boss}: 2人`);
    assert.ok(hp(['player']) < base * 0.2, `${boss}: ひとりだけ`);
    const c = MONSTERS[sp].c10b;
    for (const k of ['hp', 'atk']) assert.equal(c.few[k].length, 5);
    assert.equal(c.few.hp[3], 1);
    assert.equal(c.few.atk[3], 1);
    // 与える ダメージ（呪文も）は dmgRate
    const two = battle({ boss, kinds: ['player', 'player', 'support', 'support'] });
    const e = boss === 'gecko' ? geckoOf(two) : owlReal(two);
    assert.equal(e.dmgRate, c.few.atk[1]);
  }
  // シロフクロウは みんな おなじ HP（まぼろしも）
  const o = battle({ boss: 'owl', kinds: ['player', 'support'] });
  const r = owlReal(o);
  for (const e of owlVisible(o)) assert.equal(c10bPub(e).maxHp, r.maxHp);
});

// ───────────── 強さ ─────────────
test('強さ: 人が できる 動き（えらぶ 時間 2秒・5秒）で 知って いる 人は 勝てる・完全オートは 勝てない（少しの 回数）・青 → 白 と 白 → 青', { timeout: 1500000 }, () => {
  for (const boss of ['gecko', 'owl']) {
    for (const react of [2000, 5000]) {
      const order = react === 2000 ? 'blue' : 'white';
      const know = [1, 2, 3, 4, 5, 6].map((s) => ch9Run(boss, LV9[boss], 'know', 9090 + s * 7919, { react, flags: ORDER_FLAGS[order][boss] }));
      const w = know.filter((r) => r.outcome === 'win');
      assert.ok(w.length >= 2, `${boss} ${react}: 知って いる 人 ${know.map((r) => r.outcome).join(',')}`);
      const sec = w.reduce((s, r) => s + r.seconds, 0) / w.length;
      assert.ok(sec <= 600, `${boss} ${react}: 長さ ${sec}秒`);
    }
    const auto = [1, 2, 3, 4].map((s) => ch9Run(boss, LV9[boss], 'auto', 9090 + s * 7919, { flags: ORDER_FLAGS.blue[boss] }));
    assert.equal(auto.filter((r) => r.outcome === 'win').length, 0, `${boss}: 完全オート`);
    for (const [job, kit] of Object.entries(CH9_KIT[boss])) for (const id of kit) if (id) assert.ok(canEquip(job, id), `${job}: ${id}`);
  }
  assert.equal(LV9.gecko, 111);
  assert.equal(LV9.owl, 113);
  // どちらを 先に しても: 第1幕の 2つの 音は いつも・先に 取った 音を 足す
  assert.deepEqual(ORDER_FLAGS.blue.owl, [C10A.noteRe, C10A.noteFa, C10B.noteSo]);
  assert.deepEqual(ORDER_FLAGS.white.gecko, [C10A.noteRe, C10A.noteFa, C10B.noteLa]);
});

// ───────────── 品 ─────────────
test('品: 青 6こ・白 6こ・おまけ 2こ（★5 は 青 2つ k 2.30〜2.32・白 2つ k 2.32〜2.34・おまけ 1つずつ・のこりは 素材か 道具）・中ボスの 品・だいじな 物・くぼ地の 武具屋に 足す 品 4つ（k 2.20〜2.22）', () => {
  const gear = [...C10B_GEAR_CHESTS.blue, ...C10B_GEAR_CHESTS.white, ...C10B_GEAR_CHESTS.bonus];
  assert.equal(gear.length, 6);
  for (const [id, [item, n]] of Object.entries(C10B_TREASURE)) {
    const it = ITEMS[item];
    assert.ok(it, item);
    assert.deepEqual(c10bChest(id), { item, n });
    if (gear.includes(id)) {
      assert.equal(it.src, id === 'c10b_bbonus' || id.startsWith('c10b_bc') ? 'c10b' : 'c10w', id);
      assert.equal(it.rarity, 4);
      assert.equal(it.rank, 10);
      assert.notEqual(it.type, 'weapon', '武器は 作らない');
      assert.ok(rareWhereText(item)?.length > 4, item);
    } else assert.ok(['mat', 'use'].includes(it.type), `${id}: 素材か 道具 (${it.type})`);
  }
  for (const k of [C10B_K.b2, C10B_K.b5, C10B_K.bBonus]) assert.ok(k >= 2.3 && k <= 2.32, k);
  for (const k of [C10B_K.w3, C10B_K.w6, C10B_K.wBonus]) assert.ok(k >= 2.32 && k <= 2.34, k);
  assert.equal(C10B_SHOP_ADD.length, 4);
  for (const k of Object.values(C10B_SHOP_K)) assert.ok(k >= 2.2 && k <= 2.22, k);
  for (const id of C10B_SHOP_ADD) { assert.equal(ITEMS[id].rarity, 0); assert.ok(ITEMS[id].price > 0); assert.notEqual(ITEMS[id].type, 'weapon'); }
  for (const id of Object.keys(ITEMS_C10B)) { assert.ok(PART3_LATE_ITEMS.has(id), id); assert.ok(ITEM_KANA[id], `${id}: 読みがな`); }
  for (const [boss, [acc]] of Object.entries(C10B_DROPS)) {
    assert.equal(MONSTERS[boss].drops.boss[0], acc);
    assert.equal(ITEMS[acc].type, 'acc');
    assert.ok(ITEMS[acc].unique);
    const sum = Object.values(ITEMS[acc].bonus).reduce((s, v) => s + v, 0);
    assert.ok(sum <= 287 && sum >= 280, `${acc}: ${sum}`);
  }
  // まぼろしも 落とす 品の きまり（本物と おなじ 品。たおせない ので 経験値 0）
  assert.deepEqual(MONSTERS[C10B_OWL_FAKE].drops.boss, MONSTERS[C10B_OWL].drops.boss);
  assert.equal(MONSTERS[C10B_OWL_FAKE].exp, 0);
  for (const sp of Object.keys(MONSTERS_C10B)) for (const d of monsterDrops(sp)) assert.ok(ITEMS[d.item], `${sp}: ${d.item}`);
  for (const id of [NOTE_SO, NOTE_LA]) assert.equal(ITEMS[id].type, 'key');
  for (const it of Object.values(ITEMS_C10B)) assert.ok(!it.resist?.water, it.name);
});

// ───────────── ヒント ─────────────
test('負けた 時の ヒント: 3つずつ（ぼんやり → はっきり）・言う 人は ノクト・14-3 の 文', () => {
  assert.equal(C10B_HINT_WHO, 'ノクト');
  assert.deepEqual(C10B_BOSS_HINTS.c10b_gecko, ['あいつの体、砂だ。かわいていると、こうげきが通らないぞ。', '水の音を鳴らせ。ぬらせば、こうげきが通る。', '水は、2つぶんくらいが、ちょうどいい。入れすぎると、大かんそうが来る。雷か氷で止めろ。']);
  assert.deepEqual(C10B_BOSS_HINTS.c10b_owl, ['3人いるが、本物は1人だ。にせものをなぐると、からかわれるぞ。', '動いたやつが、本物だ。どこが動いたか、よく見ろ。', 'まざったら、次に動くまで待て。スピカにてらしてもらえば、本物が光る。']);
  for (const id of Object.keys(C10B_BOSS_HINTS)) {
    assert.deepEqual(BOSS_HINTS[id], C10B_BOSS_HINTS[id]);
    assert.equal(BOSS_HINT_WHO[id], 'ノクト');
    for (const t of C10B_BOSS_HINTS[id]) assert.ok(t.length <= 48, t);
  }
});

// ───────────── 絵・背景 ─────────────
test('絵: 新しい 絵は 4つまで・5しゅは 色ちがい・中ボスは 2倍の こまかさ（コマ 2・3 は びしょぬれ・おじぎ）・まぼろしも おなじ え・背景 4つ', () => {
  const fresh = C10B_MINIONS.filter((sp) => MONSTER_ART[sp] && !MONSTER_ART[sp].base && !MONSTER_ART[sp].tint);
  assert.deepEqual(fresh, C10B_NEW_ART);
  assert.ok(fresh.length <= 4);
  for (const [sp, base] of Object.entries(C10B_RECOLOR_BASE)) {
    assert.ok(MONSTER_ART[base], base);
    assert.ok(MONSTER_ART[sp].tint, `${sp}: 色ちがい`);
    assert.deepEqual(MONSTER_ART[sp].size, MONSTER_ART[base].size);
    assert.equal(MONSTERS[sp].race, MONSTERS[base].race, `${sp}: もとと おなじ 系統`);
  }
  const g = new Proxy({ w: 100, h: 100 }, { get: (o, k) => (k in o ? o[k] : () => {}) });
  for (const sp of [...C10B_MINIONS, C10B_GECKO, C10B_OWL]) for (const f of [0, 1]) MONSTER_ART[sp].draw(g, f);
  for (const sp of [C10B_GECKO, C10B_OWL]) {
    for (const f of [2, 3]) MONSTER_ART[sp].draw(g, f);
    assert.equal(MONSTERS[sp].artScale, 0.5);
    assert.equal(monsterFine(sp), 2);
    assert.ok(MONSTER_ART[sp].size[0] >= 160);
  }
  assert.equal(MONSTER_ART[C10B_OWL_FAKE], MONSTER_ART[C10B_OWL], 'まぼろしも おなじ え');
  const [gw, gh] = monsterSize(C10B_GECKO);
  assert.ok(gw >= 95 && gw <= 130 && gh >= 95 && gh <= 130, `${gw}×${gh}`);
  // 4人 ならんでも 戦いの 画面（256）に 入る
  const [ow] = monsterSize(C10B_OWL);
  assert.ok(ow * 4 * 0.55 + 24 <= 256, `シロフクロウ ${ow}`);
  for (const id of ['c10b_mirror', 'c10b_dry', 'c10b_ice', 'c10b_moon']) assert.ok(battleBgSpec(id), id);
  assert.equal(FIXED_C10B.c10b_gecko.bg, 'c10b_dry');
  assert.equal(FIXED_C10B.c10b_owl.bg, 'c10b_moon');
  for (const id of C10B_BATTLE.watch) assert.equal(FIXED_C10B[id].bg, 'c10b_ice');
});

test('もとの 作品の 名前・しるし・決まり文句を 使わない（ゲームに 出る 文）', () => {
  const files = ['public/js/shared/data/monsters-c10b.js', 'public/js/shared/data/abilities-c10b.js', 'public/js/shared/data/items-c10b.js', 'public/js/shared/battle-c10b.js', 'public/js/client/battle-c10b.js', 'public/js/shared/data/boss-hints-c10b.js', 'public/js/shared/data/companions-c10b.js'];
  const bad = ['クロコダイル', 'クロコ', 'ワニ', 'バロック', '葉巻', 'はまき', 'かぎ爪', 'かぎづめ', 'フック', 'キッド', 'コナン', '名探偵', '怪盗', '片めがね', 'かためがね', 'モノクル', 'シルクハット', 'グライダー', 'トランプ', 'ネクタイ（赤', '赤いネクタイ', 'ショーの', 'ショータイム', 'レディース', 'ジェントルメン'];
  for (const f of files) {
    const src = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8').split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
    for (const w of bad) assert.ok(!src.includes(w), `${f}: ${w}`);
  }
  assert.equal(MONSTERS[C10B_GECKO].name, 'サー・ゲッコー');
  assert.equal(GECKO_NAME, 'サー・ゲッコー');
  assert.equal(MONSTERS[C10B_OWL].name, 'かいとうシロフクロウ');
});

// ───────────── がめん ─────────────
test('がめん: 画面の 上の まど（水の めもり・本物の 場所）・場所の 名前・びしょぬれ・おじぎの え・しるし・バナー・えんしゅつ・コマンド「水の音を鳴らす」', () => {
  for (const id of C10B_OWN_TELE) assert.ok(CH6_OWN_TELE.has(id), id);
  assert.deepEqual(waterMeter(0), { on: 0, max: 3, word: 'からから' });
  assert.equal(waterMeter(2).word, 'ちょうどいい');
  const gk = { species: C10B_GECKO, alive: true, c10Kind: 'gecko', water: 0, waterMax: 3 };
  assert.ok(c10bHtml(gk).html.includes('水の音を鳴らす') && c10bHtml(gk).cls.includes('warn'));
  assert.ok(c10bHtml({ ...gk, water: 2 }).cls.includes('good'));
  assert.ok(c10bHtml({ ...gk, water: 3, big: 1 }).html.includes('大かんそう'));
  const ow = { species: C10B_OWL, alive: true, c10Kind: 'owl', owlPos: 0, owlN: 3 };
  assert.ok(c10bHtml(ow, { moved: '左' }).html.includes('さいごに動いた'));
  assert.ok(c10bHtml(ow, { mixed: true }).html.includes('入れかわった'));
  assert.ok(c10bHtml(ow, { lit: 'まん中' }).html.includes('まん中'));
  assert.ok(c10bHtml({ ...ow, owlSteal: 'a0' }, { allies: [{ id: 'a0', name: 'タロウ' }] }).html.includes('タロウ'));
  assert.equal(c10bHtml({ species: 'c10b_crab', alive: true }).html, '');
  assert.deepEqual([posName(0, 3), posName(1, 3), posName(2, 3), posName(3, 4)], ['左', 'まん中', '右', '右はし']);
  // え: 勝った あとは コマ 2・3（消えない）
  for (const sp of [C10B_GECKO, C10B_OWL, C10B_OWL_FAKE]) {
    const down = { species: sp, alive: true, c10Down: 1, dead: 1 };
    try { c10bSprite(down, 0); } catch { /* え を かく ところは ブラウザだけ */ }
    assert.equal(down.dead, -1);
  }
  assert.equal(c10bSprite({ species: C10B_GECKO, alive: true }, 0), null);
  // しるしが こわれない
  const x = new Proxy({}, { get: () => () => {}, set: () => true });
  const scene = { time: 0, enemies: () => [gk, ow], allies: () => [], c: { get: () => ({ name: 'タロウ' }) } };
  for (const c of [gk, { ...gk, water: 2 }, { ...gk, big: 1 }, { ...gk, c10Down: 1 }, ow, { ...ow, owlLit: 1 }, { ...ow, c10Down: 1 }]) c10bDraw(scene, x, null, c, 10, 10, 40, 40, 1);
  // バナー
  const banners = [];
  const sc2 = { game: { audio: { sfx() {} } }, banner: (t) => banners.push(t), shake() {}, enemies: () => [gk], c: { get: () => ({ name: 'タロウ' }) } };
  for (const e of [{ c10xDryUp: {} }, { c10xStop: {} }, { c10xSand: {} }, { c10xRing: { water: 2, before: 0 } }, { c10oStealUp: { aim: 'a0' } }, { c10oShuffleUp: { id: 'e1' } }, { c10oHalf: {} }, { c10oShuffle: {} }, { c10oLit: { id: 'e1' } }, { c10oTease: {} }, { c10oSteal: { blocked: true } }, { c10oMoved: { pos: 0, n: 3, name: '左のシロフクロウ' } }, { c10bDown: { id: 'x', kind: 'owl' } }]) c10bPresent(sc2, e);
  for (const w of ['大かんそう', '止めた', '水がなくなった', 'ぬれた', 'ぬすむ', '入れかわる', '4人', '入れかわった', '光った', 'まぼろし', 'ふせいだ', '動いた', 'おじぎ']) assert.ok(banners.some((t) => t.includes(w)), w);
  // コマンド「水の音を鳴らす」（ゲッコーの 戦いだけ）
  const me = { id: 'a0', name: 'タロウ', abilities: [MIZUOTO] };
  const ci = c10bCmdItems({ enemies: () => [gk] }, me);
  assert.ok(ci.items[0].html.includes('水の音を鳴らす') && ci.items[0].html.includes('今だ') && ci.info.includes('水'));
  assert.equal(c10bCmdItems({ enemies: () => [ow] }, me).items.length, 0);
  const sent = [];
  assert.equal(c10bCmdPick({ send: (m) => sent.push(m) }, me, 'c10bring'), true);
  assert.deepEqual(sent, [{ type: 'ability', id: MIZUOTO }]);
  // えんしゅつ: 技の anim は ぜんぶ ある（battlefx-c8c.js から とどく）・大きく 出す 技・味方の まど・音
  const fx = new Proxy({}, { get: () => () => {} });
  const anims = [...new Set(Object.values(C10B_ABILITIES).map((a) => a.anim))];
  for (const a of anims) {
    assert.equal(playC10bFx(fx, a, [{ x: 100, y: 60 }, { x: 140, y: 70 }], null, {}), true, a);
    assert.equal(playC8cFx(fx, a, [{ x: 100, y: 60 }], null, {}), true, `${a}: battlefx-c8c.js から とどく`);
  }
  for (const a of [...C10B_SCREEN_ANIMS, ...Object.keys(C10B_ALLY_FX), ...Object.keys(C10B_SFX)]) assert.ok(anims.includes(a), a);
  for (const [kk, v] of Object.entries(C10B_ALLY_FX)) assert.equal(CH4_ALLY_FX[kk], v, kk);
  for (const a of Object.values(C10B_ABILITIES)) assert.ok(firstSentence(a.desc).length >= 6 && firstSentence(a.desc).length <= 40, a.name);
  assert.equal(ABILITIES[MIZUOTO].noAuto, true);
});

// ───────────── 字 ─────────────
test('文字: 子ども向けの 漢字・文の 中に 空白なし（kanji-check の gameFiles に 入って いる）', () => {
  const mine = [
    'public/js/shared/data/c10b-names-b.js',
    'public/js/shared/data/monsters-c10b.js', 'public/js/shared/data/abilities-c10b.js',
    'public/js/shared/data/encounters-c10b.js', 'public/js/shared/data/companions-c10b.js', 'public/js/shared/data/items-c10b.js', 'public/js/shared/data/boss-hints-c10b.js',
    'public/js/shared/battle-c10b.js', 'public/js/client/battle-c10b.js', 'public/js/client/render/c10b-art.js', 'public/js/client/render/c10b-bg.js', 'public/js/client/render/battlefx-c10b.js',
  ];
  const gf = gameFiles();
  for (const f of mine) {
    const g = gf.find((x) => x.replace(/\\/g, '/').endsWith(f));
    assert.ok(g, `${f} は gameFiles に ある`);
    assert.deepEqual(checkFile(g).filter((p) => p.kind !== 'kana'), [], f);
  }
});
