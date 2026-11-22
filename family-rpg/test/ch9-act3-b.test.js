// 第92回 B班: 第3部 第1章 第3幕「さかさのピラミッド」の 戦いと 品（docs/plan-part3.md の 11-4・11-5）
// 名前の 約束・ふつうの 魔物 6しゅ・なぞの たね・ナゾカケ（さかさ言葉・こたえる・時間切れ・むずかしい なぞ）・
// ヒックリカエール2号（砂の めもり・ひっくり返す・目が回る・まだ早い・大ばくはつ・砂を 足す・ポチッとね）・自動の 仲間・人数で 合わせる・
// 強さ（人が できる 動き）・時間切れまでの 本当の 時間・品・ヒント・絵・背景・がめん・えんしゅつ・文字
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ITEMS, ITEM_KANA, PART3_LATE_ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES, ZONE_BG } from '../public/js/shared/data/encounters.js';
import { MAT_DROPS } from '../public/js/shared/data/loot.js';
import { MONSTER_FRIENDS } from '../public/js/shared/data/companions.js';
import { MONSTER_RANKS } from '../public/js/shared/data/monster-ranks.js';
import { rareWhereText } from '../public/js/shared/data/rare-loot.js';
import { BOSS_HINTS, BOSS_HINT_WHO } from '../public/js/shared/data/boss-hints.js';
import { canEquip } from '../public/js/shared/stats.js';
import { C9C, C9C_BATTLE, C9C_BOSS_MON, C9C_MON_PREFIX, C9C_TABLE, C9C_TRACKS, C9C_CHEST_IDS, NOTE_MI as NOTE_NAME, C9C_MAP } from '../public/js/shared/maps/c9c-flags.js';
import { MONSTERS_C9C, C9C_MINIONS, C9C_RIVER_MON, C9C_PYR_MON, C9C_RECOLOR_BASE, C9C_NEW_ART, C9C_NAZOKAKE, C9C_HIKKURI, C9C_MAT_DROPS } from '../public/js/shared/data/monsters-c9c.js';
import { C9C_ABILITIES, ANSWER, FLIP } from '../public/js/shared/data/abilities-c9c.js';
import { REVERSE, PUZZLE, EASY, HARD, reverseKana, riddleText } from '../public/js/shared/data/riddles-c9c.js';
import { FRIENDS_C9C } from '../public/js/shared/data/companions-c9c.js';
import { ENCOUNTERS_C9C, FIXED_C9C, ZONE_BG_C9C } from '../public/js/shared/data/encounters-c9c.js';
import { ITEMS_C9C, C9C_TREASURE, C9C_K, C9C_SHOP_K, C9C_GEAR_CHESTS, C9C_SHOP_ADD, C9C_DROPS, NOTE_MI, c9cChest } from '../public/js/shared/data/items-c9c.js';
import { C9C_BOSS_HINTS, C9C_HINT_WHO } from '../public/js/shared/data/boss-hints-c9c.js';
import {
  nazoOf, mechaOf9c, riddleConf, sandConf, c9cTurnStart, c9cEffect, c9cPub, c9cPlan, peopleOf9c, pickRiddle,
  RIDDLE, TIMEOUT, ZREST, EMPTY, BOOM, DIZZY, ADD, POCHIUP, POCHI, AUTO_EVERY,
} from '../public/js/shared/battle-c9c.js';
import { c9aPlan, bestHit } from '../public/js/shared/battle-c9a.js';
import { ch9Run, ch9Party, LV9, CH9_KIT } from '../tools/sim-ch9.mjs';
import { riddleTimes } from '../tools/sim-ch9-riddle-time.mjs';
import { MONSTER_ART, monsterSize, monsterFine } from '../public/js/client/render/monsters.js';
import { playC9cFx } from '../public/js/client/render/battlefx-c9c.js';
import { playC8cFx } from '../public/js/client/render/battlefx-c8c.js';
import { battleBgSpec } from '../public/js/client/render/battlefx.js';
import { allyAnimFor } from '../public/js/client/render/battlefx-r27.js';
import { C9C_SCREEN_ANIMS, C9C_ALLY_FX, C9C_SFX, C9C_OWN_TELE, c9cDraw, c9cPresent, c9cSprite, c9cCmdItems, c9cCmdPick, riddleHtml, sandHtml } from '../public/js/client/battle-c9c.js';
import { c9aCmdItems } from '../public/js/client/battle-c9a.js';
import { CH4_ALLY_FX } from '../public/js/client/battle-ch4.js';
import { CH6_OWN_TELE } from '../public/js/client/battle-ch6.js';
import { firstSentence } from '../public/js/client/ui/skillinfo.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';

const ev0 = () => ({ lines: [], upd: [], results: [] });
const groupOf = (id) => FIXED_ENCOUNTERS[id].group.flatMap(([sp, n]) => Array(n).fill(sp));
// kinds … 味方の 種類（'player' 家族の キャラ・'support' 酒場の 人・'monster' 魔物の 仲間）
function battle(id, { kinds = ['player', 'player', 'player', 'player'], seed = 3, flags = { c9_child: true, c9_act1: true } } = {}) {
  const boss = id === C9C_BATTLE.riddle ? 'riddle' : 'trio2';
  const four = ch9Party(boss, LV9[boss]);
  const allies = kinds.map((k, i) => ({ char: structuredClone(four[i % 4]), kind: k, controller: k === 'player' ? 'sim' : null, auto: true, tactics: 'balanced' }));
  return new Battle({ rng: makeRng(seed), boss: true, canFlee: false, allies, enemies: groupOf(id), hooks: { leaderFlag: (f) => !!flags[f] } });
}
const act = (b, a, cmd) => {
  b.queue.push({ id: a.id, cmd, last: true });
  a.queued = true;
  b.executeNext();
  return b.flush().filter((e) => e.t === 'act').pop();
};
const eff = (b, c, id) => { const ev = ev0(); assert.ok(c9cEffect(b, c, ABILITIES[id], ABILITIES[id].effect, ev), id); return ev; };
// ボスの 番を 1回（前ぶれ → その 技）。ふつうの 技の ときは tg に その id
function bossAct(b, c) {
  const ev = ev0();
  c9cTurnStart(b, c, ev, false);
  const tg = c.telegraph;
  if (tg) {
    c.telegraph = null;
    if (/^c9[zs]/.test(ABILITIES[tg].effect.type)) Object.assign(ev, eff(b, c, tg), { tg });
    else ev.tg = tg;
  }
  return ev;
}

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（11-5）: 決まった 戦い c9c_riddle・c9c_trio2・魔物の id・出る 表・宝箱・星の音・曲・フラグ', () => {
  assert.deepEqual(C9C_BATTLE, { riddle: 'c9c_riddle', trio2: 'c9c_trio2' });
  assert.deepEqual(C9C_BOSS_MON, { riddle: 'c9c_nazokake', trio2: 'c9c_hikkuri' });
  assert.equal(C9C_NAZOKAKE, C9C_BOSS_MON.riddle);
  assert.equal(C9C_HIKKURI, C9C_BOSS_MON.trio2);
  assert.deepEqual(Object.keys(ENCOUNTERS_C9C), ['t9c_river', 't9c_pyr', 't9c_pyr2']);
  assert.deepEqual(C9C_TABLE, { river: 't9c_river', pyr: 't9c_pyr', pyr2: 't9c_pyr2' });
  for (const t of Object.keys(ENCOUNTERS_C9C)) { assert.ok(ENCOUNTER_TABLES[t], t); assert.ok(ZONE_BG[t], t); }
  for (const id of Object.values(C9C_BATTLE)) {
    const f = FIXED_ENCOUNTERS[id];
    assert.ok(f && f.boss && f.canFlee === false, id);
    assert.equal(FIXED_C9C[id], f);
    assert.ok(Object.values(C9C_TRACKS).includes(f.bgm), id);
  }
  for (const sp of Object.keys(MONSTERS_C9C)) assert.ok(sp.startsWith(C9C_MON_PREFIX), sp);
  assert.deepEqual([...C9C_CHEST_IDS.river, ...C9C_CHEST_IDS.pyr], Object.keys(C9C_TREASURE));
  assert.deepEqual(C9C_CHEST_IDS.river, ['c9c_r1', 'c9c_r2', 'c9c_r3']);
  assert.equal(C9C_CHEST_IDS.pyr.length, 8);
  assert.equal(NOTE_NAME, 'note_mi');
  assert.equal(NOTE_MI, 'note_mi');
  assert.deepEqual(Object.values(C9C), ['c9_raft_go', 'c9_river', 'c9_p2', 'c9_riddle', 'c9_p3', 'c9_p4', 'c9_song', 'c9_trio2', 'c9_note1', 'c9_act3']);
  assert.deepEqual(Object.values(C9C_MAP), ['c9c_river', 'c9c_p1', 'c9c_p2', 'c9c_p3', 'c9c_p4']);
  assert.deepEqual(Object.values(C9C_TRACKS), ['c9c_river', 'c9c_pyramid', 'c9c_riddle', 'c9c_trio2', 'c9c_algol', 'c9c_note']);
  // もとの 作品の 名前・せりふは 使わない
  const text = JSON.stringify([MONSTERS_C9C, C9C_ABILITIES]);
  for (const w of ['ドロンボー', 'ドロンジョ', 'ボヤッキー', 'トンズラー', 'ポチっとな', 'おしおき', 'やっておしまい', 'スフィンクス']) assert.ok(!text.includes(w), w);
});

// ───────────── ふつうの 魔物 6しゅ ─────────────
test('ふつうの 魔物 6しゅ: 仲間に なる・今の 素材・出る 表・ランク・今 ある 系統・Lv（川 100・ピラミッド 100〜101）・川は 見えにくい・新しい 絵は 3しゅまで', () => {
  assert.equal(C9C_MINIONS.length, 6);
  assert.equal(C9C_RIVER_MON.length, 2);
  assert.equal(C9C_PYR_MON.length, 4);
  const races = new Set(Object.values(MONSTERS).filter((m) => !m.boss && !MONSTERS_C9C[m]).map((m) => m.race));
  const names = Object.entries(MONSTERS).filter(([id]) => !MONSTERS_C9C[id]).map(([, m]) => m.name);
  const mats = new Set(Object.entries(MAT_DROPS).filter(([sp]) => !MONSTERS_C9C[sp]).map(([, d]) => d[0]));
  for (const sp of C9C_MINIONS) {
    const m = MONSTERS[sp];
    assert.ok(m && !m.boss && m.region === 6, sp);
    assert.ok(races.has(m.race), `${sp}: 今 ある 系統`);
    assert.ok(MONSTER_FRIENDS[sp] && FRIENDS_C9C[sp], `${sp}: 仲間に なる`);
    assert.ok(FRIENDS_C9C[sp].rate >= 1 / 26 && FRIENDS_C9C[sp].rate <= 1 / 10, sp);
    assert.deepEqual(MAT_DROPS[sp], C9C_MAT_DROPS[sp]);
    assert.ok(mats.has(MAT_DROPS[sp][0]) && ITEMS[MAT_DROPS[sp][0]]?.type === 'mat', `${sp}: 今の 素材`);
    assert.ok(MONSTER_RANKS[sp], `${sp}: ランクの 表`);
    assert.ok(!names.includes(m.name), `${sp}: 名前が かぶらない`);
    assert.ok(m.desc && m.desc.length < 80, sp);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${sp}: ${a.id}`);
    for (const [, id] of FRIENDS_C9C[sp].learn) assert.ok(ABILITIES[id], `${sp}: ${id}`);
    assert.ok(Object.values(ENCOUNTERS_C9C).some((t) => t.some((e) => e.group.some((g) => g[0] === sp))), `${sp}: 出る 表`);
  }
  for (const sp of C9C_RIVER_MON) {
    assert.equal(MONSTERS[sp].lv, 100, sp);
    assert.ok(MONSTERS[sp].c9b?.hide > 0, `${sp}: 暗いので 見えにくい`);
    assert.ok(ENCOUNTERS_C9C.t9c_river.some((e) => e.group.some((g) => g[0] === sp)));
  }
  for (const sp of C9C_PYR_MON) assert.ok(MONSTERS[sp].lv >= 100 && MONSTERS[sp].lv <= 101, sp);
  // 経験値と お金は 第2幕より 多い（HP は ふつうの 戦いの 長さで きめた）
  for (const sp of C9C_MINIONS) assert.ok(MONSTERS[sp].exp > MONSTERS.c9b_bat.exp && MONSTERS[sp].gold > MONSTERS.c9b_bat.gold, sp);
  // 新しい 系統・素材は 作らない／系統配合の 子に なるのは 砂時計ゴーレムだけ
  assert.deepEqual(C9C_MINIONS.filter((sp) => !FRIENDS_C9C[sp].noFamily), ['c9c_golem']);
  for (const sp of C9C_MINIONS) assert.ok(FRIENDS_C9C[sp].mix?.length, sp);
});

// ───────────── なぞの たね ─────────────
test('なぞの たね: さかさ言葉 20こ いじょう（ひらがな 3〜6文字）・なぞなぞ 10こ いじょう・はずれ 2つ・べつの 言葉に なる 物・物語の ひみつは 答えに しない', () => {
  assert.ok(REVERSE.length >= 20, `さかさ言葉 ${REVERSE.length}`);
  assert.ok(PUZZLE.length >= 10, `なぞなぞ ${PUZZLE.length}`);
  assert.ok(REVERSE.length + PUZZLE.length >= 30);
  const kana = /^[ぁ-ゖー]+$/;
  const small = /[ぁぃぅぇぉっゃゅょゎ]/;
  for (const r of REVERSE) {
    const n = [...r.a].length;
    assert.ok(n >= 3 && n <= 6, r.a);
    assert.ok(kana.test(r.a) && !small.test(r.a), `${r.a}: 小さい 字の ない ひらがな`);
    assert.notEqual(reverseKana(r.a), r.a, `${r.a}: さかさに すると かわる`);
    if (r.flip) assert.equal(reverseKana(r.a), r.flip);
  }
  assert.ok(REVERSE.filter((r) => r.flip).length >= 2, 'さかさに 読むと べつの 言葉に なる 物');
  for (const r of [...REVERSE, ...PUZZLE]) {
    assert.equal(r.no.length, 2, r.a);
    assert.equal(new Set([r.a, ...r.no]).size, 3, `${r.a}: 3つの 答えは ちがう`);
    for (const w of [r.a, ...r.no]) assert.ok(kana.test(w), `${w}: 答えは ひらがな`);
  }
  for (const p of PUZZLE) assert.ok(p.q.endsWith('？') && p.q.length <= 40, p.q);
  // ゲームの 物語の ひみつ（人や 星の 名前）は 答えに しない
  const secret = ['あるごる', 'そりとぅす', 'すぴか', 'のくと', 'かい', 'ほしのおと', 'ほしのこ'];
  for (const r of [...REVERSE, ...PUZZLE]) for (const s of secret) assert.ok(![r.a, ...r.no].includes(s), `${r.a}: ${s}`);
  // やさしい（4文字 まで）と むずかしい（5文字 いじょう ＋ なぞなぞ）
  assert.ok(EASY.length >= 15 && EASY.every((r) => [...r.a].length <= 4));
  assert.ok(HARD.length >= 15 && HARD.every((r) => r.type === 'puzzle' || [...r.a].length >= 5));
  assert.equal(riddleText({ type: 'reverse', a: 'かえる' }), '『るえか』…さかさに読むと、なんだ？');
});

// ───────────── ナゾカケ ─────────────
test('ナゾカケ: 3回 動くと なぞ（画面の 上に 出つづける）・なぞの守り（3わり）・ゆっくり 動く・こたえる 正かいで 守りが 消えて 1回 休む', () => {
  const b = battle(C9C_BATTLE.riddle);
  const n = nazoOf(b);
  assert.ok(b.c9sp, 'スピカは かならず 出る');
  for (const a of b.allies) assert.ok(a.abilities.includes(ANSWER), 'みんな こたえられる');
  assert.equal(ABILITIES[ANSWER].noAuto, true);
  assert.equal(bossAct(b, n).tg === RIDDLE, false);
  bossAct(b, n);
  const r = bossAct(b, n);
  assert.equal(r.tg, RIDDLE);
  assert.ok(r.c9zRiddle && r.c9zRiddle.choices.length === 3);
  const z = n.c9z;
  assert.ok(z.riddle);
  assert.equal(n.tmul, riddleConf(n, b).slow, 'なぞが 出て いる 間は ゆっくり');
  const p = c9cPub(n, b);
  assert.equal(p.zRiddle.text, z.riddle.text);
  assert.equal(p.zRiddle.correct, undefined, '答えの ばんごうは がめんに 出さない');
  assert.equal(p.zGuard, 1);
  // なぞの守り: 受ける ダメージが 3わり
  const a0 = b.allies[0];
  const hp0 = n.hp;
  const dmg = b.damage(a0, n, 10000, ev0());
  void dmg;
  assert.equal(hp0 - n.hp, Math.round(10000 * riddleConf(n, b).guard));
  // 正かい
  const ok = act(b, a0, { type: 'ability', id: ANSWER, choice: z.riddle.correct });
  assert.ok(ok.c9zAnswer?.ok, ok.lines.join('/'));
  assert.equal(z.riddle, null);
  assert.equal(n.tmul, undefined);
  assert.equal(c9cPub(n, b).zGuard, 0);
  const hp1 = n.hp;
  b.damage(a0, n, 10000, ev0());
  assert.equal(hp1 - n.hp, 10000, '守りが 消えた');
  assert.equal(bossAct(b, n).tg, ZREST, '1回 休む（うーむ、せいかい）');
  // つぎの なぞは 3回 あと
  assert.notEqual(bossAct(b, n).tg, RIDDLE);
  bossAct(b, n);
  assert.equal(bossAct(b, n).tg, RIDDLE);
});

test('ナゾカケ: はずれは 2回「さかさま」（こんらん）で なぞは のこる・2回 動いても 答えが ないと 時間切れ（全体に ダメージ ＋ つぎの なぞ）・HP 半分で むずかしい なぞ・同じ なぞは 出ない', () => {
  const b = battle(C9C_BATTLE.riddle, { seed: 7 });
  const n = nazoOf(b);
  n.c9z.left = 1;
  bossAct(b, n);
  const z = n.c9z;
  const first = z.riddle;
  const a0 = b.allies[0];
  const wrong = [0, 1, 2].find((i) => i !== first.correct);
  const w = act(b, a0, { type: 'ability', id: ANSWER, choice: wrong });
  assert.equal(w.c9zAnswer.ok, false);
  assert.equal(a0.status.confuse?.turns, riddleConf(n, b).wrong + 1, '2回の 番の 間 こんらん');
  assert.equal(z.riddle, first, 'なぞは のこる');
  // 時間切れ: なぞが 出てから 2回 動く
  const e1 = bossAct(b, n);
  assert.ok(e1.c9zLeft && e1.c9zLeft.left === 1);
  const hps = b.allies.map((x) => x.hp);
  const t = bossAct(b, n);
  assert.equal(t.tg, TIMEOUT);
  assert.ok(t.c9zTimeout && t.c9zRiddle, '時間切れ ＋ つぎの なぞ');
  assert.ok(b.allies.some((x, i) => x.hp < hps[i]), '全体に ダメージ');
  assert.notEqual(z.riddle.id, first.id);
  // むずかしい なぞ（HP 半分 いか）
  n.hp = Math.round(n.maxHp * 0.4);
  const hard = pickRiddle(b, n);
  assert.ok(hard.hard && (hard.type === 'puzzle' || [...hard.answer].length >= 5), hard.text);
  // 1回の 戦いで 同じ なぞは 出ない
  const bb = battle(C9C_BATTLE.riddle, { seed: 11 });
  const nn = nazoOf(bb);
  const seen = new Set();
  for (let i = 0; i < 12; i++) {
    const r = pickRiddle(bb, nn);
    assert.ok(!seen.has(r.id), r.id);
    seen.add(r.id);
    assert.equal(r.choices[r.correct], r.answer);
  }
});

test('ナゾカケ: 自動の 仲間 … 酒場の 人は なぞ 3つに 1つ 正しく 答える・家族の キャラの オートと 魔物の 仲間は 答えない・知って いる 人は 答える', () => {
  const b = battle(C9C_BATTLE.riddle, { kinds: ['player', 'support', 'support', 'monster'] });
  const n = nazoOf(b);
  n.c9z.left = 1;
  bossAct(b, n);
  const decide = () => ({ type: 'attack', target: n.id });
  const [pl, s1, s2, mon] = b.allies;
  assert.equal(c9cPlan(b, pl, decide, bestHit), null, '家族の キャラの オート');
  assert.equal(c9cPlan(b, mon, decide, bestHit), null, '魔物の 仲間');
  // 第101回 R3班: 自動の 仲間が 答えるのは、人が えらんで いる 時だけ（battle-c10a.js の someoneChooses。完全オートでは 答えない）
  n.c9z.asks = 3;
  assert.deepEqual([s1, s2].map((x) => c9cPlan(b, x, decide, bestHit)), [null, null], '完全オート');
  pl.controller ??= 'sim';
  pl.auto = false;
  // 第92回 第2便: 番ごとでは なく なぞ 3つの うち 1つ（3つめ・6つめ…）。その なぞの 間は 番が 来れば 答える
  const ask = (k) => { n.c9z.asks = k; return [s1, s2].map((x) => c9cPlan(b, x, decide, bestHit)); };
  assert.deepEqual(ask(1).map((x) => x?.id ?? null), [null, null], '1つめの なぞ');
  assert.deepEqual(ask(2).map((x) => x?.id ?? null), [null, null], '2つめの なぞ');
  const answers = ask(AUTO_EVERY).filter((x) => x?.id === ANSWER);
  assert.equal(answers.length, 2, '3つめの なぞ');
  for (const x of answers) assert.equal(x.choice, n.c9z.riddle.correct, '正しく 答える');
  // 知って いる 人
  pl.knows9 = 'know';
  const k = c9aPlan(b, pl, decide);
  assert.equal(k.id, ANSWER);
  assert.equal(k.choice, n.c9z.riddle.correct);
  // なぞが ない ときは ふつう
  n.c9z.riddle = null;
  assert.equal(c9cPlan(b, s1, decide, bestHit), null);
});

// ───────────── ヒックリカエール2号 ─────────────
test('メカ: 砂の めもり 6つぶ・動く たびに 1つぶ・0 で「落ちきった」→ つぎの 番に 大ばくはつ（身を 守ると へる）→ 6 に もどる', () => {
  const b = battle(C9C_BATTLE.trio2);
  const m = mechaOf9c(b);
  const s = m.c9s;
  assert.ok(b.c9sp);
  for (const a of b.allies) assert.ok(a.abilities.includes(FLIP));
  assert.equal(s.grains, 6);
  s.pochiLeft = 99;
  for (let i = 0; i < 5; i++) bossAct(b, m);
  assert.equal(s.grains, 1);
  assert.equal(c9cPub(m, b).sGrains, 1);
  const e = bossAct(b, m);
  assert.equal(e.tg, EMPTY);
  assert.ok(s.boomReady && c9cPub(m, b).sBoom === 1);
  // 大ばくはつ: 身を 守った 人は へる
  b.allies[0].defending = true;
  const hp = b.allies.map((x) => x.hp);
  const bm = bossAct(b, m);
  assert.equal(bm.tg, BOOM);
  assert.ok(bm.c9sBoom);
  const lost = b.allies.map((x, i) => hp[i] - x.hp);
  assert.ok(lost.every((x) => x > 0), '全体');
  assert.ok(lost[0] < Math.min(...lost.slice(1)), `身を 守ると へる ${lost}`);
  assert.equal(s.grains, 6);
  assert.equal(s.boomReady, false);
});

test('メカ: ひっくり返す … 2つぶ いかで 目が回る（1回 休み・1.5倍）・3つぶ いじょうは まだ早い（反げき・休まない）・落ちきっても まにあう・HP 半分で 砂を 足す（2つぶずつ）・ポチッとね', () => {
  const b = battle(C9C_BATTLE.trio2, { seed: 5 });
  const m = mechaOf9c(b);
  const s = m.c9s;
  s.pochiLeft = 99;
  const [a0, a1] = b.allies;
  // まだ早い（6つぶ）
  const hp0 = a0.hp;
  const e = act(b, a0, { type: 'ability', id: FLIP });
  assert.equal(e.c9sFlip.dizzy, false);
  assert.ok(a0.hp < hp0, '反げき');
  assert.equal(s.grains, 6);
  assert.equal(s.dizzy, 0);
  assert.notEqual(bossAct(b, m).tg, DIZZY, '休まない');
  // 2つぶ いか: 目が回る
  s.grains = 2;
  const d = act(b, a1, { type: 'ability', id: FLIP });
  assert.ok(d.c9sFlip.dizzy);
  assert.equal(s.grains, 6);
  assert.equal(c9cPub(m, b).sDizzy, 1);
  const h1 = m.hp;
  b.damage(a1, m, 10000, ev0());
  assert.equal(h1 - m.hp, Math.round(10000 * sandConf(m, b).dizzyMult), '1.5倍');
  assert.equal(bossAct(b, m).tg, DIZZY, '1回 休み');
  assert.equal(s.grains, 6, '休みの 番は 砂が 落ちない');
  bossAct(b, m);
  assert.equal(s.dizzy, 0, '目が回るのが おさまった');
  // 落ちきった あとでも まにあう（大ばくはつは 来ない）
  s.grains = 1;
  for (const x of b.allies) Object.assign(x, { hp: x.maxHp, alive: true });
  assert.equal(bossAct(b, m).tg, EMPTY);
  act(b, a1, { type: 'ability', id: FLIP });
  assert.equal(s.boomReady, false);
  assert.notEqual(bossAct(b, m).tg, BOOM);
  // 砂を 足す
  s.dizzy = 0;
  m.hp = Math.round(m.maxHp * 0.45);
  assert.equal(bossAct(b, m).tg, ADD);
  assert.equal(s.drop, 2);
  const g = s.grains;
  bossAct(b, m);
  assert.equal(s.grains, Math.max(0, g - 2));
  // ポチッとね（前ぶれ → ねらいの 人へ）
  s.grains = 6;
  s.pochiLeft = 1;
  const pu = bossAct(b, m);
  assert.equal(pu.tg, POCHIUP);
  const aim = s.pochiAim;
  assert.ok(aim && c9cPub(m, b).sPochi === aim);
  const target = b.get(aim);
  const th = target.hp;
  const po = bossAct(b, m);
  assert.equal(po.tg, POCHI);
  assert.equal(po.c9sPochi.to, aim);
  assert.ok(target.hp < th);
  // 勝つと メカは 自分で ひっくり返る・3人組は にげる
  m.hp = 10;
  const k = act(b, a0, { type: 'attack', target: m.id });
  assert.ok(!m.alive);
  assert.ok(k.c9sDown && k.lines.some((l) => l.includes('ひっくり返って')) && k.lines.some((l) => l.includes('にげて')), k.lines.join('/'));
});

test('メカ: 自動の 仲間 … 酒場の 人は 砂が 2つぶ いかに なる 3回に 1回 ひっくり返す・家族の キャラの オートと 魔物の 仲間は しない・知って いる 人は ひっくり返す／ポチッとねは 身を 守る', () => {
  const b = battle(C9C_BATTLE.trio2, { kinds: ['player', 'support', 'support', 'monster'] });
  const m = mechaOf9c(b);
  const decide = () => ({ type: 'attack', target: m.id });
  const [pl, s1, s2, mon] = b.allies;
  m.c9s.grains = 4;
  assert.equal(c9cPlan(b, s1, decide, bestHit), null, '砂が 多い ときは しない');
  m.c9s.grains = 2;
  assert.equal(c9cPlan(b, pl, decide, bestHit), null);
  assert.equal(c9cPlan(b, mon, decide, bestHit), null);
  // 第101回 R3班: 自動の 仲間が ひっくり返すのは、人が えらんで いる 時だけ（battle-c10a.js の someoneChooses。完全オートでは しない）
  m.c9s.lows = AUTO_EVERY;
  assert.deepEqual([s1, s2].map((x) => c9cPlan(b, x, decide, bestHit)), [null, null], '完全オート');
  pl.controller ??= 'sim';
  pl.auto = false;
  // 第92回 第2便: 番ごとでは なく 砂が 少なく なった 3回の うち 1回（lows … dropSand が 数える）
  const low = (k) => { m.c9s.lows = k; return [s1, s2].map((x) => c9cPlan(b, x, decide, bestHit)?.id ?? null); };
  assert.deepEqual(low(1), [null, null]);
  assert.deepEqual(low(2), [null, null]);
  assert.deepEqual(low(AUTO_EVERY), [FLIP, FLIP]);
  // 砂が 少なく なる たびに 数える
  const bb = battle(C9C_BATTLE.trio2);
  const mm = mechaOf9c(bb);
  mm.c9s.pochiLeft = 99;
  for (let i = 0; i < 4; i++) bossAct(bb, mm);
  assert.equal(mm.c9s.grains, 2);
  assert.equal(mm.c9s.lows, 1);
  pl.knows9 = 'know';
  assert.equal(c9aPlan(b, pl, decide).id, FLIP);
  m.c9s.grains = 6;
  m.c9s.pochiAim = pl.id;
  assert.equal(c9aPlan(b, pl, decide).type, 'defend');
});

// ───────────── 人数で 合わせる ─────────────
test('人数で 合わせる: 家族の キャラの 数で HP・攻撃・魔物の 仲間は 半人ぶん・仲間なしの ひとりは solo（ナゾカケは 時間切れ・メカは 大ばくはつが 強い）', () => {
  const hp = (id, kinds) => { const b = battle(id, { kinds }); return (nazoOf(b) || mechaOf9c(b)).maxHp; };
  for (const id of Object.values(C9C_BATTLE)) {
    const base = MONSTERS[groupOf(id)[0]].hp;
    const c = MONSTERS[groupOf(id)[0]].c9c;
    // 第101回 R1班: 4人も 人数の 表で 合わせ直した（前は 4人 もとの まま・5人 大きく。人 1人ずつ べつの 手の 物さしで 時間が のびすぎた）
    assert.equal(hp(id, ['player', 'player', 'player', 'player']), Math.round(base * c.few.hp[3]), '4人');
    assert.ok(c.few.hp[3] < 1);
    assert.equal(hp(id, ['player', 'support', 'support', 'support']), Math.round(base * c.few.hp[0]), '1人＋酒場（もとの まま）');
    assert.equal(hp(id, ['player', 'player', 'player', 'player', 'player']), Math.round(base * c.few.hp[4]), '5人');
    assert.ok(hp(id, ['player']) < base * 0.3, 'ひとりだけ');
    // 仲間なしの 2人・3人は bare
    assert.equal(hp(id, ['player', 'player']), Math.round(base * c.bare.hp[0]), '2人だけ');
    assert.equal(hp(id, ['player', 'player', 'player']), Math.round(base * c.bare.hp[1]), '3人だけ');
    assert.equal(hp(id, ['player', 'player', 'support']), Math.round(base * c.few.hp[1]), '2人＋酒場は few');
    // 1人＋魔物3（2人めの 表を 使う）の HP・攻撃は もとの まま（monK で もどす）
    const mon = battle(id, { kinds: ['player', 'monster', 'monster', 'monster'] });
    const m = nazoOf(mon) || mechaOf9c(mon);
    const old = id === C9C_BATTLE.riddle ? { hp: 0.5, atk: 1.75 * 1.09 } : { hp: 0.5, atk: 1.5 };
    assert.equal(m.maxHp, Math.round(base * old.hp), '1人＋魔物3 の HP');
    const conf = id === C9C_BATTLE.riddle ? riddleConf(m, mon) : sandConf(m, mon);
    assert.ok(Math.abs(conf.atk - old.atk) < 1e-4, `1人＋魔物3 の 攻撃 ${conf.atk}`);
  }
  const b = battle(C9C_BATTLE.riddle, { kinds: ['player', 'monster', 'monster', 'monster'] });
  assert.equal(peopleOf9c(b), 2, '魔物の 仲間は 半人ぶん');
  const solo = battle(C9C_BATTLE.riddle, { kinds: ['player'] });
  assert.ok(riddleConf(nazoOf(solo), solo).timeoutK > 1, 'ひとりの 時間切れは 強い（完全オートで 勝てない）');
  const solo2 = battle(C9C_BATTLE.trio2, { kinds: ['player'] });
  assert.ok(sandConf(mechaOf9c(solo2), solo2).boomK > 1);
});

// ───────────── 強さ ─────────────
test('強さ: 人が できる 動き（えらぶ 時間 2びょう・ブラウザの 速さ）で 知って いる 人は 勝てる・完全オートは 勝てない（少しの 回数）', { timeout: 2400000 }, () => {
  // 第101回 R1班: 人数の 表を 合わせ直した ので、新しい 物さし（人 1人ずつ べつの 手。legacy なし）で 見る（docs/plan-sim-vs-real.md の 10）
  //   知って いる 人は 3/5 いじょう（前は 2/5）・勝つまで 7分 いない（前は 520秒 まで）。
  //   長さの 下は 150秒（ナゾカケは 5秒の 人が 9分 いないに おさまる ように HP を 下げた ので、2秒の 人は 3分 くらいで 勝つ）
  const human = { react: 2000, speed: 0.85, textSpeed: 0.8 };
  for (const boss of ['riddle', 'trio2']) {
    const know = [1, 2, 3, 4, 5].map((s) => ch9Run(boss, LV9[boss], 'know', 9090 + s * 7919, human));
    assert.ok(know.filter((r) => r.outcome === 'win').length >= 3, `${boss} 知って いる 人 ${know.map((r) => r.outcome).join(',')}`);
    const auto = [1, 2, 3].map((s) => ch9Run(boss, LV9[boss], 'auto', 9090 + s * 7919, human));
    assert.equal(auto.filter((r) => r.outcome === 'win').length, 0, `${boss} 完全オート`);
    const wins = know.filter((r) => r.outcome === 'win');
    const sec = wins.reduce((s, r) => s + r.seconds, 0) / wins.length;
    assert.ok(sec >= 150 && sec <= 420, `${boss} 長さ ${sec}秒`);
    // 第92回 第3便: なぞ・砂・ポチッとねの 間は えらぶ 人を 待つ ので、えらぶのに 5びょう かかる 人も 勝てる
    const slow = [1, 2, 3, 4].map((s) => ch9Run(boss, LV9[boss], 'know', 9090 + s * 7919, { ...human, react: 5000 }));
    // 第101回 R1班 2便: ずっと 待つ 形（b.tellAll）なので 5秒の 人も 2秒と 同じ ように 勝てる（2/4 → 3/4）
    assert.ok(slow.filter((r) => r.outcome === 'win').length >= 3, `${boss} 5びょう ${slow.map((r) => r.outcome).join(',')}`);
    for (const [job, kit] of Object.entries(CH9_KIT[boss])) for (const id of kit) if (id) assert.ok(canEquip(job, id), `${job}: ${id}`);
  }
  assert.equal(LV9.riddle, 101);
  assert.equal(LV9.trio2, 102);
});

test('時間切れまでの 本当の 時間: なぞが 出てから 時間切れまで 20秒 いじょう・その 間に 自分の 番が 3回 いじょう 来る（小さい 子が 読んで 答える 間）', { timeout: 600000 }, () => {
  for (const party of ['p4', 'solo']) {
    const all = [1, 2, 3].flatMap((s) => riddleTimes(7000 + s * 31, party));
    assert.ok(all.length >= 2, party);
    assert.ok(Math.min(...all.map((x) => x.ms)) >= 20000, `${party}: ${all.map((x) => x.ms).join(',')}`);
    assert.ok(Math.min(...all.map((x) => x.turns)) >= 3, party);
  }
});

// ───────────── 品 ─────────────
test('品: 宝箱 11こ（★5 は 4つ・k 2.18〜2.22。のこりは 素材か 道具）・ボスの 品・くぼ地の 武具屋に 足す 品 4つ（k 2.10〜2.12）・星の音・読みがな・前の 章の 店に まざらない', () => {
  assert.equal(Object.keys(C9C_TREASURE).length, 11);
  assert.equal(C9C_GEAR_CHESTS.length, 4);
  for (const [id, [item, n]] of Object.entries(C9C_TREASURE)) {
    const it = ITEMS[item];
    assert.ok(it, item);
    assert.deepEqual(c9cChest(id), { item, n });
    if (C9C_GEAR_CHESTS.includes(id)) {
      assert.equal(it.src, 'c9c');
      assert.equal(it.rarity, 4);
      assert.equal(it.rank, 10);
      assert.ok(rareWhereText(item)?.includes('さかさのピラミッド'), item);
    } else assert.ok(['mat', 'use'].includes(it.type), `${id}: 素材か 道具 (${it.type})`);
  }
  for (const k of Object.values(C9C_K)) assert.ok(k >= 2.18 && k <= 2.22, k);
  assert.equal(C9C_SHOP_ADD.length, 4);
  for (const k of Object.values(C9C_SHOP_K)) assert.ok(k >= 2.1 && k <= 2.12, k);
  for (const id of C9C_SHOP_ADD) {
    const it = ITEMS[id];
    assert.ok(it.price > 0 && !it.src && !(it.rarity > 0), id);
    assert.ok(PART3_LATE_ITEMS.has(id), `${id}: 前の 章の「店の いちばん よい 品」に まざらない`);
  }
  for (const id of Object.keys(ITEMS_C9C)) { assert.ok(PART3_LATE_ITEMS.has(id), id); assert.ok(ITEM_KANA[id], `${id}: 読みがな`); }
  // ボスの 品: かならず アクセ（1人 1つ）と 武器（レア度 5）
  for (const [boss, [acc, wpn]] of Object.entries(C9C_DROPS)) {
    assert.equal(MONSTERS[boss].drops.boss[0], acc);
    assert.equal(MONSTERS[boss].drops.rare[0], wpn);
    assert.equal(ITEMS[acc].type, 'acc');
    assert.ok(ITEMS[acc].unique);
    const sum = Object.entries(ITEMS[acc].bonus).reduce((s, [, v]) => s + v, 0);
    assert.ok(sum <= 287, `${acc}: よい 力の 合計 ${sum}`);
    assert.equal(ITEMS[wpn].rarity, 5);
    const best = Math.max(...Object.entries(ITEMS).filter(([id, it]) => it.type === 'weapon' && it.cat === ITEMS[wpn].cat && id !== wpn && !id.includes('+') && !it.work).map(([, it]) => it.atk));
    assert.ok(ITEMS[wpn].atk >= best, `${wpn}: 今までで いちばん 強い ${ITEMS[wpn].cat}（${ITEMS[wpn].atk} / ${best}）`);
  }
  // 水に 強い 装備は 作らない
  for (const it of Object.values(ITEMS_C9C)) assert.ok(!it.resist?.water, it.name);
  assert.equal(ITEMS[NOTE_MI].type, 'key');
});

// ───────────── ヒント ─────────────
test('負けた 時の ヒント: 3つ（ぼんやり → はっきり）・言う 人は ノクト・40字 くらい・11-4 の 文', () => {
  for (const id of Object.values(C9C_BATTLE)) {
    const h = C9C_BOSS_HINTS[id];
    assert.equal(h.length, 3);
    assert.deepEqual(BOSS_HINTS[id], h);
    assert.equal(BOSS_HINT_WHO[id], C9C_HINT_WHO);
    for (const t of h) assert.ok(t.length <= 42, t);
  }
  assert.equal(C9C_HINT_WHO, 'ノクト');
  assert.ok(C9C_BOSS_HINTS.c9c_riddle[1].includes('こたえる'));
  assert.ok(C9C_BOSS_HINTS.c9c_trio2[1].includes('ひっくり返す'));
});

// ───────────── 絵・背景 ─────────────
test('絵: 新しい 絵は 2つ（大なまず・砂時計ゴーレム）・4しゅは 色ちがい・ボスは 2倍の こまかさ（メカは 目を 回す コマ 2・3）・背景 3つ', () => {
  const fresh = C9C_MINIONS.filter((sp) => MONSTER_ART[sp] && !MONSTER_ART[sp].base && !MONSTER_ART[sp].tint);
  assert.deepEqual(fresh, C9C_NEW_ART, '新しい 絵は 3しゅまで');
  assert.ok(fresh.length <= 3);
  for (const [sp, base] of Object.entries(C9C_RECOLOR_BASE)) {
    assert.ok(MONSTER_ART[base], base);
    assert.ok(MONSTER_ART[sp].tint, `${sp}: 色ちがい`);
    assert.deepEqual(MONSTER_ART[sp].size, MONSTER_ART[base].size);
    assert.equal(MONSTERS[sp].race, MONSTERS[base].race, `${sp}: もとと おなじ 系統`);
  }
  const g = new Proxy({ w: 100, h: 100 }, { get: (o, k) => (k in o ? o[k] : () => {}) });
  for (const sp of [...C9C_MINIONS, C9C_NAZOKAKE, C9C_HIKKURI]) {
    assert.ok(MONSTER_ART[sp], sp);
    for (const f of [0, 1]) MONSTER_ART[sp].draw(g, f);
  }
  for (const f of [2, 3]) MONSTER_ART[C9C_HIKKURI].draw(g, f);
  for (const sp of [C9C_NAZOKAKE, C9C_HIKKURI]) {
    assert.equal(MONSTERS[sp].artScale, 0.5);
    assert.equal(monsterFine(sp), 2);
    assert.ok(MONSTER_ART[sp].size[0] >= 200);
    const [w, h] = monsterSize(sp);
    assert.ok(w >= 100 && w <= 130 && h >= 100 && h <= 130, `${sp}: ${w}×${h}`);
  }
  assert.equal(c9cSprite({ species: C9C_HIKKURI, alive: true, sDizzy: 0 }, 0), null);
  for (const id of ['c9c_river', 'c9c_pyramid', 'c9c_note']) assert.ok(battleBgSpec(id), id);
  assert.deepEqual(Object.values(ZONE_BG_C9C), ['c9c_river', 'c9c_pyramid', 'c9c_pyramid']);
  assert.equal(FIXED_C9C.c9c_trio2.bg, 'c9c_note');
});

// ───────────── がめん ─────────────
test('がめん: なぞの まど（文・3つの 答え・時間切れまで）・砂の めもり・コマンド「こたえる」「ひっくり返す」（いちばん 上）・しるし・バナー・えんしゅつ', () => {
  for (const id of C9C_OWN_TELE) assert.ok(CH6_OWN_TELE.has(id), id);
  const nz = { species: C9C_NAZOKAKE, alive: true, zRiddle: { text: '『るえか』…さかさに読むと、なんだ？', choices: ['かえで', 'かえる', 'かえり'], hard: 0 }, zAge: 1, zLimit: 2, zGuard: 1, zEvery: 3, zLeft: 3 };
  const html = riddleHtml(nz);
  assert.ok(html.includes('るえか') && html.includes('1．かえで') && html.includes('3．かえり') && html.includes('時間切れまで ●○'), html);
  const mc = { species: C9C_HIKKURI, alive: true, sGrains: 2, sMax: 6, sDizzyAt: 2 };
  assert.ok(sandHtml(mc).includes('●●') && sandHtml(mc).includes('○○○○') && sandHtml(mc).includes('ひっくり返せ'));
  assert.ok(sandHtml({ ...mc, sGrains: 0, sBoom: 1 }).includes('ばくはつ'));
  assert.ok(sandHtml({ ...mc, sGrains: 6, sDizzy: 1 }).includes('目が回って'));
  // コマンド
  const me = { id: 'a0', abilities: [ANSWER, FLIP] };
  let enemies = [nz];
  const sc = { c9spica: null, enemies: () => enemies, allies: () => [], sent: [], menus: [], send(x) { this.sent.push(x); }, showMenu(items, pick) { this.menus.push(items); pick(items[1]); }, openCommand() {} };
  const items = c9aCmdItems(sc, me);
  assert.deepEqual(items.items.map((i) => i.value), ['c9canswer']);
  assert.ok(items.info.includes('るえか'));
  assert.equal(c9cCmdPick(sc, me, 'c9canswer'), true);
  assert.deepEqual(sc.menus[0].map((i) => i.label), ['1．かえで', '2．かえる', '3．かえり']);
  assert.deepEqual(sc.sent.pop(), { type: 'ability', id: ANSWER, choice: 1 });
  enemies = [{ ...nz, zRiddle: null }];
  assert.deepEqual(c9cCmdItems(sc, me).items, [], 'なぞが ない ときは 出さない');
  enemies = [mc];
  const fi = c9aCmdItems(sc, me);
  assert.deepEqual(fi.items.map((i) => i.value), ['c9cflip']);
  assert.ok(fi.items[0].html.includes('今だ'));
  assert.equal(c9cCmdPick(sc, me, 'c9cflip'), true);
  assert.deepEqual(sc.sent.pop(), { type: 'ability', id: FLIP });
  assert.equal(c9cCmdPick(sc, me, 'other'), false);
  // しるしが こわれない
  const x = new Proxy({}, { get: () => () => {}, set: () => true });
  for (const c of [nz, { ...nz, zGuard: 0, zRest: 1 }, { ...nz, zGuard: 0, zRiddle: null }, mc, { ...mc, sDizzy: 1 }, { ...mc, sBoom: 1, sPochi: 'a0' }]) c9cDraw({ time: 0 }, x, null, c, 10, 10, 40, 40, 1);
  // バナー
  const banners = [];
  const scene = { game: { audio: { sfx() {} } }, banner: (t) => banners.push(t), shake() {}, c: { get: () => ({ name: 'タロウ' }) } };
  for (const ev of [{ c9zRiddle: { hard: 0 } }, { c9zAnswer: { ok: true } }, { c9zAnswer: { ok: false } }, { c9zTimeout: { answer: 'かえる' } }, { c9sEmpty: {} }, { c9sFlip: { dizzy: true } }, { c9sFlip: { dizzy: false } }, { c9sAdd: {} }, { c9sPochiUp: { aim: 'a0' } }, { c9sDown: {} }]) c9cPresent(scene, ev);
  for (const w of ['こたえる', 'せいかい', 'ちがう', '時間切れ', '落ちきった', '目を回した', 'まだ早い', '砂を足された', 'ポチッとね', 'にげていった']) assert.ok(banners.some((t) => t.includes(w)), w);
  // えんしゅつ: 技の anim は ぜんぶ ある（battlefx-c8c.js から とどく）・大きく 出す 技・味方の まど・音
  const fx = new Proxy({}, { get: () => () => {} });
  const anims = [...new Set([...Object.values(C9C_ABILITIES).map((a) => a.anim), 'c9z_wrong'])];
  for (const a of anims) {
    assert.equal(playC9cFx(fx, a, [{ x: 100, y: 60 }, { x: 140, y: 70 }], null, {}), true, a);
    assert.equal(playC8cFx(fx, a, [{ x: 100, y: 60 }], null, {}), true, `${a}: battlefx-c8c.js から とどく`);
  }
  for (const a of [...C9C_SCREEN_ANIMS, ...Object.keys(C9C_ALLY_FX), ...Object.keys(C9C_SFX)]) assert.ok(anims.includes(a), a);
  for (const [k, v] of Object.entries(C9C_ALLY_FX)) assert.equal(CH4_ALLY_FX[k], v, k);
  // こたえる・ひっくり返す の 味方がわの エフェクト
  for (const id of [ANSWER, FLIP]) assert.ok(allyAnimFor(ABILITIES[id].anim, id), id);
  // 技の 説明は はじめの 文で わかる
  for (const a of Object.values(C9C_ABILITIES)) assert.ok(firstSentence(a.desc).length >= 6 && firstSentence(a.desc).length <= 40, a.name);
});

// ───────────── 字 ─────────────
test('文字: 子ども向けの 漢字・文の 中に 空白なし（kanji-check の gameFiles に 入って いる）', () => {
  const mine = [
    'public/js/shared/data/monsters-c9c.js', 'public/js/shared/data/abilities-c9c.js', 'public/js/shared/data/riddles-c9c.js',
    'public/js/shared/data/encounters-c9c.js', 'public/js/shared/data/companions-c9c.js', 'public/js/shared/data/items-c9c.js', 'public/js/shared/data/boss-hints-c9c.js',
    'public/js/shared/battle-c9c.js', 'public/js/client/battle-c9c.js', 'public/js/client/render/c9c-art.js', 'public/js/client/render/c9c-bg.js', 'public/js/client/render/battlefx-c9c.js',
  ];
  const gf = gameFiles();
  for (const f of mine) {
    const g = gf.find((x) => x.replace(/\\/g, '/').endsWith(f));
    assert.ok(g, `${f} は gameFiles に ある`);
    assert.deepEqual(checkFile(g).filter((p) => p.kind !== 'kana'), [], f);
  }
});
