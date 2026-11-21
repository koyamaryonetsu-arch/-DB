// 第94回 D班: 第3部 第1章 第3幕・第4幕の あとの より道 2つ（docs/plan-part3-c10a.md の 13-7 の D班。data/sidequests-c9cd.js・maps/c9cd-side.js）
// 1. ながされた、おもちゃのいかだ（c9_act3 から）… 里の 子の おもちゃの いかだを、いかだで 川を 下って わき道の 岸から さがす
//    （いかだ番が 見て いた 道すじで 当てる。ほかの 岸には ちがう 物）→ 返す
// 2. ムウとムウムウの、あそび道具（c9_act4 から）… くぼ地の おもちゃ職人と 星わたを 2つ → どんな 物か・ムウムウの 色（なぞ）→
//    ふわふわの ボール → はかばの 2人に わたす（さいごの 場面だけ はかば。はかばには 人も 物も 足さない）
// 持たない 人には 見えない・道を ふさがない（川下りで わき道の 岸に 行ける・くぼ地と 里の 人・物に とどく）・ひとりでも とける・
// ごほうびは 少し（装備なし）・1回だけ・クエストの 画面・地図の しるし・困っている人・しおり・漢字・物語の 先と ひみつは 書かない・
// フィールドの ムウムウの 絵は 戦いの 絵と 同じ ミント色
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MAPS, condOk, isBlocked } from '../public/js/shared/maps/index.js';
import { T } from '../public/js/shared/tiles.js';
import { flowReach } from '../public/js/shared/maps/flow.js';
import { SCRIPTS } from '../public/js/shared/data/story.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { C9CD_SIDE_QUESTS, C9CD_SCRIPTS, BALL9_PLAN, c9cdSubQuests } from '../public/js/shared/data/sidequests-c9cd.js';
import { TOY9, BALL9, BALL9_WATA, TOY9_BANKS, TOY9_AT, C9CD_NPC_IDS } from '../public/js/shared/maps/c9cd-side.js';
import { WORK10_NPC_IDS } from '../public/js/shared/maps/work-quests10.js';
import { C9A_LINE } from '../public/js/shared/maps/c9a-flags.js';
import { C9B_LINE } from '../public/js/shared/maps/c9b-flags.js';
import { C9C, C9C_LINE } from '../public/js/shared/maps/c9c-flags.js';
import { C9D, C9D_LINE } from '../public/js/shared/maps/c9d-flags.js';
import { PEDESTALS9C } from '../public/js/shared/maps/c9c.js';
import { UNDER_POS } from '../public/js/shared/maps/c9b-rows.js';
import { RIVER_POS } from '../public/js/shared/maps/c9c-rows.js';
import { labDoneQuests } from '../public/js/shared/data/sidequests.js';
import { subQuests, questMarks } from '../public/js/shared/data/quest-targets.js';
import { availableSubQuests, subQuestHint } from '../public/js/shared/data/subquest-hints.js';
import { shioriOf } from '../public/js/shared/world/shiori.js';
import { itemCount } from '../public/js/shared/stats.js';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { npcOpts } from '../public/js/client/render/chars.js';
import { CH6_SPECIALS } from '../public/js/client/render/ch6-art.js';
import { paintC9dSpecial } from '../public/js/client/render/c9d-npc-art.js';
import { checkFile, gameFiles, checkText } from '../tools/kanji-check.mjs';
import { setup, npcAnywhere, talkTo, said, battled, CLEAR } from './fq-helpers.js';

const PART2 = [...CLEAR, 'c6_past', 'c6_rion', 'c6_flow', 'c6_kanata', 'c6_clear', 'c7_start', 'c7_kingdom', 'c7_karim', 'c7_clear',
  'c8_start', 'c8_kingdom', 'c8_jafar', 'c8_sea', 'c8_abyss', 'c8_hades', 'c8_sky', 'c8_spring', 'c8_fortress', 'c8_bowser', 'c8_rift', 'c8_hall', 'c8_solitus'];
const ACT2 = [...PART2, ...C9A_LINE, ...C9B_LINE];
const BEFORE3 = [...ACT2, ...C9C_LINE.filter((f) => f !== C9C.act3)];
const OPEN3 = [...ACT2, ...C9C_LINE];
const BEFORE4 = [...OPEN3, ...C9D_LINE.filter((f) => f !== C9D.act4)];
const OPEN4 = [...OPEN3, ...C9D_LINE];
const QD = Object.fromEntries(C9CD_SIDE_QUESTS.map((x) => [x.id, x]));
const q = (c, name) => subQuests(c).find((x) => x.name === name);
const shows = (id, c) => condOk(npcAnywhere(id).n.show, (f) => !!c.flags[f]);
const SRC = ['../public/js/shared/data/sidequests-c9cd.js', '../public/js/shared/maps/c9cd-side.js'].map((f) => readFileSync(new URL(f, import.meta.url), 'utf8')).join('\n')
  .split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n'); // 書きおきの 行は のぞく（ゲームに 出る 文だけ）

async function rewarded(c, qd, talk, again) {
  const gold0 = c.gold;
  const goods0 = qd.reward.goods.map(([id]) => itemCount(c, id));
  const msgs = await talk();
  const check = (note) => {
    assert.ok(c.flags[qd.done], `すんだ${note}`);
    qd.reward.goods.forEach(([id, n], i) => assert.equal(itemCount(c, id), goods0[i] + n, `${id}${note}`));
    assert.equal(c.gold, gold0 + qd.reward.gold, `ゴールド${note}`);
  };
  check('');
  assert.ok(labDoneQuests(c).includes(qd.name) && !q(c, qd.name), 'クエストの 画面');
  await again();
  check('（1回だけ）');
  return msgs;
}
// その時 出て いる かたい 人の マスを かべに した マップ（流れの 計算〈maps/flow.js〉にも 使える）
function solidMap(m, has) {
  const tiles = m.tiles.slice();
  for (const n of m.npcs) if (n.solid !== false && condOk(n.show, has)) tiles[Math.floor(n.y) * m.w + Math.floor(n.x)] = T.C9C_CAVE;
  for (const ch of m.chests) if (condOk(ch.show, has)) tiles[ch.y * m.w + ch.x] = T.C9C_CAVE;
  return { ...m, tiles };
}
// 歩いて とどく 所（4方向。流れは 考えない）
function walk(m, has, from) {
  const seen = new Set([`${from.x},${from.y}`]);
  const qq = [[from.x, from.y]];
  while (qq.length) {
    const [x, y] = qq.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
      if (seen.has(k) || nx < 0 || ny < 0 || nx >= m.w || ny >= m.h || isBlocked(m, nx, ny, has)) continue;
      seen.add(k);
      qq.push([nx, ny]);
    }
  }
  return seen;
}
const beside = (set, x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => set.has(`${x + dx},${y + dy}`));

test('しくみ: 今の マップに 人と 物を 足すだけ・はかばには 足さない・1 は c9_act3・2 は c9_act4 の あとから（持たない 人には 見えない）・だいほん・絵・フラグは 少なく・ひみつは 出さない', () => {
  assert.deepEqual(C9CD_SIDE_QUESTS.map((x) => x.name), ['ながされた、おもちゃのいかだ', 'ムウとムウムウの、あそび道具']);
  assert.deepEqual([TOY9.open, BALL9.open], ['c9_act3', 'c9_act4']);
  // フラグ: 1 は 3こ（受けた・見つけた・返した）・2 は 5こ（受けた・星わた 2つ・ボール・わたした）
  const flags = [TOY9.start, TOY9.got, TOY9.done, BALL9.start, ...BALL9_WATA, BALL9.ball, BALL9.done];
  assert.equal(new Set(flags).size, 8);
  for (const f of flags) assert.ok(/^c9cd_[a-z0-9]{2}$/.test(f), f);
  const where = { c9cd_t_host: 'c9b_under', c9cd_t1: 'c9c_river', c9cd_t2: 'c9c_river', c9cd_t3: 'c9c_river', c9cd_b_host: 'c9a_crater', c9cd_w1: 'c9a_crater', c9cd_w2: 'c9a_crater' };
  assert.deepEqual(C9CD_NPC_IDS, Object.keys(where));
  for (const id of C9CD_NPC_IDS) {
    const at = npcAnywhere(id);
    assert.equal(at.map, where[id], id);
    const n = at.n, m = MAPS[at.map];
    const open = id.startsWith('c9cd_t') ? TOY9.open : BALL9.open;
    const before = id.startsWith('c9cd_t') ? BEFORE3 : BEFORE4;
    assert.equal(condOk(n.show, (f) => before.includes(f)), false, `${id} は ${open} の 前は 出ない`);
    assert.equal(condOk(n.show, () => false), false, `${id} は 第3部の 前の セーブでも 出ない`);
    assert.ok(SCRIPTS[n.script] && SCRIPTS[n.script] === C9CD_SCRIPTS[n.script], `${id} の だいほん`);
    assert.ok(!isBlocked({ ...m, npcs: [] }, Math.floor(n.x), Math.floor(n.y), () => true), `${id} の 場所`);
    if (n.sprite.startsWith('mon:')) assert.ok(MONSTER_ART[n.sprite.slice(4)], `${id} の 絵`);
    else assert.ok(npcOpts(n.sprite) || CH6_SPECIALS.includes(n.sprite), `${id} の みため`);
    assert.ok(!m.npcs.some((o) => o !== n && Math.floor(o.x) === Math.floor(n.x) && Math.floor(o.y) === Math.floor(n.y)), `${id} は ほかの 人と かさならない`);
  }
  // はかばには 人も 物も 足さない
  assert.deepEqual(MAPS.c9d_grave.npcs.map((n) => n.id).sort(), ['c9d_mu_play', 'c9d_mu_sit', 'c9d_mumu_sit']);
  for (const id of [...C9CD_NPC_IDS, ...WORK10_NPC_IDS]) assert.notEqual(npcAnywhere(id).map, 'c9d_grave', id);
  // くぼ地: 音の 台の ある くぼみの 中（焼けた 土）には 置かない・台から 3マス いじょう はなす
  for (const id of ['c9cd_b_host', 'c9cd_w1', 'c9cd_w2']) {
    const { n } = npcAnywhere(id);
    const m = MAPS.c9a_crater;
    const x = Math.floor(n.x), y = Math.floor(n.y);
    assert.notEqual(m.tiles[y * m.w + x], T.C9A_CRATER, `${id} は くぼみの 外`);
    for (const p of PEDESTALS9C) assert.ok(Math.max(Math.abs(p.x - x), Math.abs(p.y - y)) >= 3, `${id} は 音の 台から はなれて いる`);
  }
  // 大地の下: 船着き場の まわり 3マスと その 番人・西の がけからは はなす
  const kid = npcAnywhere('c9cd_t_host').n;
  const D = UNDER_POS.dock;
  const keeper = MAPS.c9b_under.npcs.find((n) => n.id === 'c9b_folk6');
  assert.ok(Math.max(Math.abs(kid.x - D.x), Math.abs(kid.y - D.y)) > 3 && Math.max(Math.abs(kid.x - keeper.x), Math.abs(kid.y - keeper.y)) > 2, '船着き場から はなれて いる');
  assert.ok(kid.x > UNDER_POS.chasm.x1 + 10, '西の がけから はなれて いる');
  assert.equal(MAPS.c9b_under.areaName(Math.floor(kid.x), Math.floor(kid.y)), 'ヒカリゴケの里');
  // 地下の川: わき道の 岸の 上（宝箱の マスでは ない）
  TOY9_BANKS.forEach((p, i) => {
    const b = RIVER_POS.banks[i];
    assert.ok(p.x >= b.x && p.y >= b.y && p.x < b.x + b.w && p.y < b.y + b.h, `${i + 1}つめの 岸`);
    assert.ok(!RIVER_POS.chests.some((c) => c.x === p.x && c.y === p.y));
  });
  assert.equal(TOY9_AT, 2, 'おもちゃは 3つめ（北の わき道）の 岸');
  // 前は 受けられない
  for (const qd of C9CD_SIDE_QUESTS) {
    const before = qd.id === 'c9cd_toy' ? BEFORE3 : BEFORE4;
    const pre = { flag: (f) => before.includes(f), has: () => false, count: () => 0, night: false, name: 'ソラ', c: { job: 'warrior' } };
    assert.ok(!JSON.stringify(SCRIPTS[qd.npc](pre)).includes('"choice"'), `${qd.id} は 受けられない`);
  }
  assert.deepEqual(c9cdSubQuests({ flags: {} }, () => false), []);
  // 第1章より 先の 物語・ひみつ・カイ・ソリトゥス・大きな くぼみ・第2章は 書かない
  assert.ok(!/ソリトゥス|カイ|くぼみ|アルゴル|少年|星の子|空から|c10_|炎の山|ささやき|ながされたの/.test(SRC), '物語の 先・ひみつ');
});

test('道を ふさがない: 川下りで わき道の 岸 3つの 物の となりに 着ける（宝箱にも）・里の 子・くぼ地の 職人と 星わたに とどく・前から ある 人と 出口にも とどく', () => {
  for (const flags of [OPEN3, [...OPEN3, TOY9.start], [...OPEN4, TOY9.start, TOY9.got, BALL9.start]]) {
    const has = (f) => flags.includes(f);
    // 地下の川: 川の はじめから 流されて・歩いて
    const rv = MAPS.c9c_river;
    const r = flowReach(solidMap(rv, has), [RIVER_POS.start.x, RIVER_POS.start.y], has);
    for (const id of ['c9cd_t1', 'c9cd_t2', 'c9cd_t3']) {
      const n = npcAnywhere(id).n;
      if (!condOk(n.show, has)) continue;
      assert.ok(beside(r.stops, Math.floor(n.x), Math.floor(n.y)), `${id} の となりに 着ける`);
    }
    for (const c of RIVER_POS.chests) assert.ok(beside(r.stops, c.x, c.y), `宝箱 ${c.x},${c.y}`);
    assert.ok(r.stops.has(`${RIVER_POS.end.x},${RIVER_POS.end.y}`) && r.pits.has(`${RIVER_POS.gate.x},${RIVER_POS.gate.y}`), '川の 終わりと ピラミッドの 入口');
    // 大地の下: 着いた 所から 里の 子・船着き場
    const un = MAPS.c9b_under;
    const a = walk(solidMap(un, has), has, UNDER_POS.arrive);
    const kid = npcAnywhere('c9cd_t_host').n;
    assert.ok(beside(a, Math.floor(kid.x), Math.floor(kid.y)) && a.has(`${UNDER_POS.dock.x},${UNDER_POS.dock.y}`), '里の 子と 船着き場');
    // くぼ地: 森から 来た 所から 職人・星わた・前から ある 人・森への 出口
    const cr = MAPS.c9a_crater;
    const b = walk(solidMap(cr, has), has, { x: 12, y: 15 });
    for (const n of cr.npcs) if (condOk(n.show, has)) assert.ok(beside(b, Math.floor(n.x), Math.floor(n.y)), n.id);
    assert.ok(b.has('12,16'), '森への 出口');
  }
});

test('ながされた、おもちゃのいかだ: 受ける → いかだ番の 道すじ → ちがう 岸には ちがう 物 → 北の わき道の 岸で 見つける → プカに 返す → ごほうび（1回だけ）', async () => {
  const { bot, c } = await setup(946, { job: 'mage', flags: OPEN3 });
  const qd = QD.c9cd_toy;
  for (const id of ['c9cd_t1', 'c9cd_t2', 'c9cd_t3']) assert.ok(!shows(id, c), '受ける 前は 岸に 何も ない');
  let msgs = await talkTo(bot, 'c9cd_t_host', [0]);
  assert.ok(c.flags[TOY9.start] && said(msgs, /3つめのゆるい所で、北の/));
  assert.equal(q(c, qd.name).find, 'c9cd_t3');
  assert.ok(said(await talkTo(bot, 'c9cd_t_host'), /赤いほに、星のもよう/));
  for (const id of ['c9cd_t1', 'c9cd_t2']) {
    msgs = await talkTo(bot, id);
    assert.ok(said(msgs, /ここではないみたい/) && !c.flags[TOY9.got], `${id} は ちがう 物`);
  }
  msgs = await talkTo(bot, 'c9cd_t3');
  assert.ok(said(msgs, /おもちゃのいかだを、見つけた/) && c.flags[TOY9.got] && !shows('c9cd_t3', c) && shows('c9cd_t1', c));
  assert.ok(q(c, qd.name).ready && q(c, qd.name).who === 'c9cd_t_host');
  msgs = await rewarded(c, qd, () => talkTo(bot, 'c9cd_t_host'), () => talkTo(bot, 'c9cd_t_host'));
  assert.ok(said(msgs, /いかだ番になるんだ/) && !battled(msgs, ''));
  assert.ok(!shows('c9cd_t1', c) && !shows('c9cd_t2', c), '返した あとは 岸の 物も 消える');
  assert.ok(said(await talkTo(bot, 'c9cd_t_host'), /ひもをつけて/));
});

test('ムウとムウムウの、あそび道具: 受ける → 星わた 2つ → どんな 物か・ムウムウの 色（2回 まちがえると また こんど）→ ボール → はかばの 2人に わたす → ごほうび（1回だけ）。ひとりでも', async () => {
  const { bot, c } = await setup(947, { job: 'warrior', flags: OPEN4 });
  const qd = QD.c9cd_ball;
  assert.ok(said(await talkTo(bot, 'c9d_mu_sit'), /ここの番をしてる/), '受ける 前の 2人は 今の まま');
  await talkTo(bot, 'c9cd_b_host', [0]);
  assert.ok(c.flags[BALL9.start] && q(c, qd.name).find === 'c9cd_w1');
  assert.ok(said(await talkTo(bot, 'c9cd_b_host'), /星わたは、今0つ/));
  for (const i of [1, 0]) {
    await talkTo(bot, `c9cd_w${i + 1}`);
    assert.ok(c.flags[BALL9_WATA[i]] && !shows(`c9cd_w${i + 1}`, c));
  }
  assert.ok(q(c, qd.name).ready && !q(c, qd.name).find);
  const ans = BALL9_PLAN.map((x) => x.ans);
  let msgs = await talkTo(bot, 'c9cd_b_host', [0, 2]);
  assert.ok(said(msgs, /つまらない/) && said(msgs, /おきてしまう/) && said(msgs, /また、教えておくれ/) && !c.flags[BALL9.ball], '2回 まちがえたら また こんど');
  msgs = await talkTo(bot, 'c9cd_b_host', [ans[0], 0, ans[1]]);
  assert.ok(said(msgs, /ピンク|ちがったかな/) && said(msgs, /ミント色だね/) && c.flags[BALL9.ball], '1回 まちがえても その場で やり直せる');
  assert.ok(q(c, qd.name).find === 'c9d_mu_sit' && questMarks(c, 'c9d_grave', '').some((m) => m.label === qd.name), 'はかばの 2人に しるし');
  assert.ok(said(await talkTo(bot, 'c9cd_b_host'), /とどけておくれ/));
  msgs = await rewarded(c, qd, () => talkTo(bot, 'c9d_mumu_sit'), () => talkTo(bot, 'c9d_mu_sit'));
  assert.ok(said(msgs, /ぼくたちの色だ/) && said(msgs, /しーっ/) && !battled(msgs, ''));
  assert.ok(said(await talkTo(bot, 'c9d_mu_sit'), /なげっこしてる/));
  assert.ok(said(await talkTo(bot, 'c9cd_b_host'), /いい番人だねえ/));
  // はかばの 2人の だいほんは、より道の ない 人には 今の まま
  const x0 = { flag: (f) => OPEN4.includes(f), has: () => false, count: () => 0, night: false, name: 'ソラ', c: { job: 'warrior' } };
  assert.ok(JSON.stringify(SCRIPTS.c9d_mu_talk(x0)).includes('ここの番をしてる'));
});

test('ごほうびは 少し（装備なし）・クエストの 画面・地図の しるし・困っている人・しおり・漢字', () => {
  for (const qd of C9CD_SIDE_QUESTS) {
    assert.ok(qd.reward.gold > 0 && qd.reward.gold <= 3000, qd.id);
    for (const [id, n] of qd.reward.goods) assert.ok(ITEMS[id] && ['use', 'mat'].includes(ITEMS[id].type) && n > 0 && n <= 5, `${qd.id}: ${id}`);
    const h = subQuestHint(qd.id);
    assert.ok(h && h.npc === qd.npc && h.open.includes(qd.open) && !h.board, `${qd.id}: 困っている人`);
  }
  const fl = (L) => ({ flags: Object.fromEntries(L.map((f) => [f, true])) });
  const ids = (L) => availableSubQuests(fl(L)).map((h) => h.id).filter((id) => id.startsWith('c9cd_'));
  assert.deepEqual(ids(BEFORE3), []);
  assert.deepEqual(ids(OPEN3), ['c9cd_toy']);
  assert.deepEqual(ids(BEFORE4), ['c9cd_toy']);
  assert.deepEqual(ids(OPEN4), ['c9cd_toy', 'c9cd_ball']);
  // 受けた あとは クエストの 画面と 地図の しるし
  const got = { flags: Object.fromEntries([...OPEN4, TOY9.start, BALL9.start, BALL9_WATA[0]].map((f) => [f, true])), items: [], keyItems: [] };
  const marks = { c9cd_toy: 'c9c_river', c9cd_ball: 'c9a_crater' };
  for (const qd of C9CD_SIDE_QUESTS) {
    const e = q(got, qd.name);
    assert.ok(e && npcAnywhere(e.who) && npcAnywhere(e.find), qd.id);
    assert.deepEqual(checkText(e.text + e.hint).filter((p) => p.kind !== 'kana'), [], qd.id);
    assert.ok(questMarks(got, marks[qd.id], '').some((m) => m.label === qd.name), `${qd.id}: 地図の しるし`);
  }
  assert.equal(q(got, QD.c9cd_ball.name).find, 'c9cd_w2');
  // しおり: c9_act3 の あと 1つ・c9_act4 の あと もう 1つ より道が ふえる
  const side = (L) => shioriOf({ ...fl(L), items: [], keyItems: [], jobs: {}, kills: {} }).tracks.find((t) => t.id === 'side');
  assert.equal(side(OPEN3).total - side(BEFORE3).total, 1, 'しおりの より道（第3幕の あと）');
  assert.equal(side(OPEN4).total - side(BEFORE4).total, 1, 'しおりの より道（第4幕の あと）');
  // 漢字
  const files = ['shared/data/sidequests-c9cd.js', 'shared/maps/c9cd-side.js'].map((f) => gameFiles().find((g) => g.endsWith('/public/js/' + f)));
  assert.ok(files.every(Boolean), 'gameFiles() に 入っている');
  const bad = [];
  for (const f of files) for (const p of checkFile(f)) if (p.kind !== 'kana') bad.push(`${f.split('/').pop()}:${p.line} [${p.kind} ${p.detail}] ${p.text}`);
  assert.deepEqual(bad, []);
});

test('絵: フィールドの ムウムウ（すわる 2人の 分かれた 方）は 戦いの 絵と 同じ ミント色（うす紫では ない）・ムウは うす紫の まま', async () => {
  const src = readFileSync(new URL('../public/js/client/render/c9d-art.js', import.meta.url), 'utf8');
  const mm = src.match(/const MM = \{\s*B: '(#[0-9a-f]{6})', BD: '(#[0-9a-f]{6})'/);
  assert.ok(mm, '戦いの 絵の ムウムウの 色');
  const colors = (kind) => new Set(paintC9dSpecial(kind, 'down', 0).p.px.filter(Boolean).map((c) => c.toLowerCase()));
  const mumu = colors('c9d_mumu_sit');
  assert.ok(mumu.has(mm[1].toLowerCase()) && mumu.has(mm[2].toLowerCase()), 'ムウムウは 戦いの 絵の ミント色');
  for (const lav of ['#c0a8e8', '#dccaf6', '#8a6ab0', '#a888d8']) assert.ok(!mumu.has(lav), `うす紫 ${lav} は 使わない`);
  const mu = colors('c9d_mu_sit');
  assert.ok(mu.has('#a888d8') && !mu.has(mm[2].toLowerCase()), 'ムウは うす紫の まま');
});
