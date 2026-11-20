// 第92回 D班: お仕事いらい 39〜41（docs/plan-part3.md の 11-6 の D班）。新しい 流れの 職業で、まだ たのまれごとが なかった 系統
// 39. 大地の下の、かれたわき水（半ようの 流れ: 半ようの少年 → 鉄さいがの使い手 → 犬夜しゃ → ばくりゅうはの大よう）・
// 40. ヒカリゴケの里の、キノコどろぼう（旅の魔道士の 流れ: 大食いの旅の魔道士 → 天才美少女魔道士リナ → ドラまた）・
// 41. 大地の下の、ゆうれいの声（ふりょうの 流れ: ふりょう → れい界探てい → うら飯ゆう助 → 魔界の王の子）
// 受けて → なぞ（その場で やり直し・2回 まちがえたら はじめから）→ 戦い → ごほうび・職業の しばり・ひとりで とける・1回だけ・
// 第2幕の クリア（c9_act2）の あとから（はり紙も 人も）・大地の下だけ（船着き場の まわりには 置かない）・フラグは 1つに 2こ・
// 地図の しるし・困っている人・漢字・軽い 戦い（敵Lv98）・お仕事いらい板: 41まい・7ページ（c9_act2 の 前は 38まいの まま）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MAPS, isBlocked, condOk } from '../public/js/shared/maps/index.js';
import { SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { JOBS, jobAncestry } from '../public/js/shared/data/jobs.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { FAMILY_QUESTS, boardPage, boardInfo, boardPages, boardList, takeFlag, rewardNames } from '../public/js/shared/data/sidequests-family.js';
import { WORK8_QUESTS } from '../public/js/shared/data/sidequests-work8.js';
import { WORK9_QUESTS, WORK9_SCRIPTS, WORK9_STORY_SCRIPTS, workSubQuests9, WELL_PLAN, KINOKO_PLAN, GHOST_PLAN } from '../public/js/shared/data/sidequests-work9.js';
import { WQ9, WQ9_OPEN, WORK9_NPC_IDS } from '../public/js/shared/maps/work-quests9.js';
import { C9A_LINE } from '../public/js/shared/maps/c9a-flags.js';
import { C9B, C9B_LINE } from '../public/js/shared/maps/c9b-flags.js';
import { UNDER_POS } from '../public/js/shared/maps/c9b-rows.js';
import { jobLine } from '../public/js/shared/data/fq-common.js';
import { labDoneQuests, sideQuestHint } from '../public/js/shared/data/sidequests.js';
import { subQuests, questMarks } from '../public/js/shared/data/quest-targets.js';
import { availableSubQuests, subQuestHint } from '../public/js/shared/data/subquest-hints.js';
import { itemCount, fullHeal } from '../public/js/shared/stats.js';
import { medalsFound } from '../public/js/shared/data/casino.js';
import { makeChar, runBattle } from '../tools/sim.js';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { npcOpts } from '../public/js/client/render/chars.js';
import { CH6_SPECIALS } from '../public/js/client/render/ch6-art.js';
import { checkFile, gameFiles, checkText } from '../tools/kanji-check.mjs';
import { setup, npcAnywhere, talkTo, said, battled, CLEAR } from './fq-helpers.js';

// 第2部の さいごまで・第3部 第1章 第1幕・第2幕の いかだまで（第2幕の クリアの 前）
const PART2 = [...CLEAR, 'c6_clear', 'c7_karim', 'c7_kingdom', 'c7_clear', 'c8_start', 'c8_kingdom', 'c8_jafar', 'c8_sea', 'c8_abyss', 'c8_hades', 'c8_sky', 'c8_spring',
  'c8_fortress', 'c8_bowser', 'c8_rift', 'c8_hall', 'c8_solitus'];
const BEFORE = [...PART2, ...C9A_LINE, ...C9B_LINE.filter((f) => f !== C9B.act2)];
const OPEN = [...BEFORE, WQ9_OPEN];
const q = (c, name) => subQuests(c).find((x) => x.name === name);
const W = Object.fromEntries(WORK9_QUESTS.map((x) => [x.id, x]));
const wrong = (ans) => (ans === 0 ? 1 : 0);
const wrong2 = (ans) => (ans === 2 ? 1 : 2);
const shows = (id, c) => condOk(npcAnywhere(id).n.show, (f) => !!c.flags[f]);
const SRC = ['../public/js/shared/data/sidequests-work9.js', '../public/js/shared/maps/work-quests9.js'].map((f) => readFileSync(new URL(f, import.meta.url), 'utf8')).join('\n');

// ごほうびを もらった（素材や 道具・ゴールド・小さなメダル・クエストの 画面から 消える）。もう 1回 話しても ふえない
// （戦いの ある いらいは 戦いの ゴールドも 入るので、ゴールドは「ごほうび いじょう」。2回目は ふえない）
async function rewarded(c, qd, talk, again) {
  const gold0 = c.gold, medals0 = medalsFound(c);
  const goods0 = qd.reward.goods.map(([id]) => itemCount(c, id));
  const msgs = await talk();
  const gold1 = c.gold;
  const check = (note) => {
    assert.ok(c.flags[qd.done], `${qd.id}: すんだ`);
    qd.reward.goods.forEach(([id, n], i) => assert.ok(itemCount(c, id) >= goods0[i] + n && itemCount(c, id) <= goods0[i] + n + 1, `${qd.id}: ${id}${note}`));
    assert.ok(c.gold >= gold0 + qd.reward.gold, `${qd.id}: ゴールド${note}`);
    assert.equal(medalsFound(c), medals0 + qd.reward.medals, `${qd.id}: メダル${note}`);
  };
  check('');
  assert.ok(labDoneQuests(c).includes(qd.name) && !q(c, qd.name), `${qd.id}: クエストの 画面`);
  const goods1 = qd.reward.goods.map(([id]) => itemCount(c, id));
  await again();
  check('（1回だけ）');
  assert.equal(c.gold, gold1, `${qd.id}: 2回目は ゴールドが ふえない`);
  assert.deepEqual(qd.reward.goods.map(([id]) => itemCount(c, id)), goods1, `${qd.id}: 2回目は 品が ふえない`);
  return msgs;
}

// ───── しくみ ─────
test('しくみ: 3つの 新しい たのまれごと（まだ いらいの ない 新しい 流れ）・大地の下だけ（船着き場の まわりには 置かない）・c9_act2 の あとだけ・フラグは 1つに 2こ', () => {
  assert.equal(WORK9_QUESTS.length, 3);
  assert.equal(FAMILY_QUESTS.length, 41);
  assert.deepEqual(FAMILY_QUESTS.slice(38), WORK9_QUESTS);
  assert.deepEqual(FAMILY_QUESTS.slice(35, 38), WORK8_QUESTS);
  assert.deepEqual(WORK9_QUESTS.map((x) => x.roots), [['hanyo_boy'], ['tabi_madoshi'], ['furyo']]);
  assert.deepEqual(WORK9_QUESTS.map((x) => x.legend), ['bakuryuha', 'doramata', 'makai_prince']);
  assert.equal(WQ9_OPEN, 'c9_act2');
  // フラグは 受けた・すんだ の 2こずつ（はり紙で 受けた しるし fq_take_<id> は 前からの しくみ）
  assert.deepEqual(Object.values(WQ9).sort(), WORK9_QUESTS.flatMap((x) => [x.start, x.done]).sort());
  for (const qd of WORK9_QUESTS) {
    const L = jobLine(qd.roots);
    for (const id of Object.keys(JOBS)) assert.equal(L.has(id), qd.roots.some((r) => jobAncestry(id).has(r)), `${qd.id} ${id}`);
    assert.ok(JOBS[qd.legend].tier === 3 && L.has(qd.legend), `${qd.id}: ${qd.legend}`);
    assert.equal(qd.roots.map((r) => JOBS[r].name).join('か'), qd.job, qd.id);
    assert.ok(qd.who && qd.where && qd.paper && qd.town && qd.npc, qd.id);
    assert.deepEqual(qd.open, ['c9_act2'], qd.id);
    assert.ok(npcAnywhere(qd.npc), `${qd.id}: ${qd.npc}`);
  }
  // 新しい 8系統（第82〜85回）の 入り口のうち、前の いらいの 系統に 入って いない 物だけを えらんだ
  const NEW8 = ['hanyo_boy', 'samurai_kid', 'fishing_doshi', 'elem_teacher', 'musabetsu_student', 'furyo', 'enjutsushi', 'tabi_madoshi'];
  const older = FAMILY_QUESTS.slice(0, 38);
  const used = NEW8.filter((r) => older.some((b) => b.roots.some((x) => jobLine([x]).has(r))));
  assert.deepEqual(used, ['fishing_doshi', 'elem_teacher', 'enjutsushi', 'tabi_madoshi'], '前の いらいで 解決できる 新しい 系統（旅の魔道士は 料理人の 先）');
  const fresh = NEW8.filter((r) => !older.some((b) => b.roots.includes(r)));
  for (const qd of WORK9_QUESTS) assert.ok(fresh.includes(qd.roots[0]), qd.id);
  for (const a of WORK9_QUESTS) {
    assert.ok(!older.some((b) => b.legend === a.legend), a.id);
    // 前の いらいの roots（その 系統の 入り口）は、新しい 流れに 入って いない
    for (const b of older) for (const r of b.roots) assert.ok(!jobLine(a.roots).has(r), `${a.id} と ${b.id}`);
  }
  const both = (a, b) => [...jobLine(W[a].roots)].filter((j) => jobLine(W[b].roots).has(j));
  assert.deepEqual(both('well', 'kinoko'), []);
  assert.deepEqual(both('well', 'ghost'), []);
  assert.deepEqual(both('kinoko', 'ghost'), []);
  // 場所（大地の下 c9b_under。ヒカリゴケの里の 中と 外）
  const m = MAPS.c9b_under;
  const areas = { well: '大地の下', kinoko: 'ヒカリゴケの里', ghost: '大地の下' };
  for (const qd of WORK9_QUESTS) assert.equal(qd.town, areas[qd.id], qd.id);
  for (const [k, a] of Object.entries(areas)) {
    for (const id of WORK9_NPC_IDS.filter((x) => x.startsWith(`fq_${k}_`))) {
      const { map, n } = npcAnywhere(id);
      assert.equal(map, 'c9b_under', id);
      assert.equal(m.areaName(Math.floor(n.x), Math.floor(n.y)), a, id);
    }
  }
  for (const mm of Object.values(MAPS)) if (mm.id !== 'c9b_under') assert.ok(!mm.npcs.some((n) => WORK9_NPC_IDS.includes(n.id)), mm.id);
  // 船着き場の まわり 3マスと その 番人には 近づけない
  const D = UNDER_POS.dock;
  const keeper = m.npcs.find((n) => n.id === 'c9b_folk6');
  for (const id of WORK9_NPC_IDS) {
    const { n } = npcAnywhere(id);
    assert.ok(Math.max(Math.abs(n.x - D.x), Math.abs(n.y - D.y)) > 3, `${id} は 船着き場から はなれて いる`);
    assert.ok(Math.max(Math.abs(n.x - keeper.x), Math.abs(n.y - keeper.y)) > 2, `${id} は 番人から はなれて いる`);
  }
  // c9_act2 の 前は 出ない・話しても 受けられない
  for (const id of WORK9_NPC_IDS) {
    const at = npcAnywhere(id);
    assert.equal(condOk(at.n.show, (f) => BEFORE.includes(f)), false, `${id} は c9_act2 の 前は 出ない`);
    assert.ok(SCRIPTS[at.n.script] && SCRIPTS[at.n.script] === WORK9_SCRIPTS[at.n.script], `${id} の だいほん`);
  }
  for (const id of WORK9_NPC_IDS.filter((x) => x !== 'fq_well_flow')) assert.equal(condOk(npcAnywhere(id).n.show, (f) => OPEN.includes(f)), true, `${id} は c9_act2 の あとに 出る`);
  const pre = { flag: (f) => BEFORE.includes(f), has: () => false, count: () => 0, night: false, name: 'ソラ', c: { job: 'bakuryuha' } };
  for (const qd of WORK9_QUESTS) assert.ok(!JSON.stringify(SCRIPTS[qd.npc](pre)).includes('"choice"'), `${qd.id} は 受けられない`);
  assert.deepEqual(workSubQuests9({ flags: {} }, () => false), []);
  for (const id of WORK9_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id), id);
  // 人は 立てる 所（物は かたい NPC）・人の 絵・物の 絵・ほかの 人と かさならない（わき水の 2つは 同時に 出ない）
  const pair = new Set(['fq_well_rock', 'fq_well_flow']);
  for (const id of WORK9_NPC_IDS) {
    const { map, n } = npcAnywhere(id);
    assert.ok(!isBlocked({ ...MAPS[map], npcs: [] }, Math.floor(n.x), Math.floor(n.y), () => true), `${id} の 場所`);
    if (n.sprite.startsWith('mon:')) assert.ok(MONSTER_ART[n.sprite.slice(4)], `${id} の 絵`);
    else assert.ok(npcOpts(n.sprite) || CH6_SPECIALS.includes(n.sprite), `${id} の みため（地下の民の 絵）`);
    assert.ok(!MAPS[map].npcs.some((o) => o !== n && !(pair.has(o.id) && pair.has(n.id)) && Math.floor(o.x) === Math.floor(n.x) && Math.floor(o.y) === Math.floor(n.y)), `${id} は ほかの 人と かさならない`);
  }
  const flow = { flags: { [WQ9_OPEN]: true, [WQ9.wellDone]: true } };
  assert.ok(shows('fq_well_flow', flow) && !shows('fq_well_rock', flow), 'わき出た あとは 1つだけ');
  // 第3幕より 先の 物語・ひみつ・カイ・3人組は 書かない
  assert.ok(!/ピラミッド|ソリトゥス|カイ|3人組|さかさ|いかだ|川を下|川の先|星の子/.test(SRC), '物語の 先・ひみつ');
});

test('ごほうび: 第64回の きまり（★5の 装備なし・乗り物なし）・素材や 道具・ゴールド・小さなメダル・はり紙と 同じ', () => {
  for (const qd of WORK9_QUESTS) {
    const r = qd.reward;
    assert.ok(!r.item && !r.vehicle, `${qd.id}: ★5・乗り物なし`);
    assert.ok(r.goods.length >= 2, qd.id);
    for (const [id, n] of r.goods) assert.ok(ITEMS[id] && ['use', 'mat'].includes(ITEMS[id].type) && n > 0, `${qd.id}: ${id}`);
    assert.ok(r.gold >= 3000 && r.gold <= 4000 && r.medals >= 2 && r.medals <= 3, qd.id);
    const text = boardPage({ flag: () => false }, qd).map((st) => st[2]).join('\n');
    assert.ok(text.includes(qd.paper) && text.includes(qd.who) && text.includes(`${r.gold}ゴールド`) && text.includes(`小さなメダル${r.medals}まい`), qd.id);
    for (const name of rewardNames(r)) assert.ok(text.includes(name), `${qd.id}: ${name}`);
    const info = boardInfo({ flag: () => false, c: { job: qd.legend } }, qd);
    assert.ok(info.includes('（○いる）') && info.split('\n').length === 3, `${qd.id}: ${info}`);
  }
});

// ───── 39. わき水 ─────
test('大地の下の、かれたわき水: 受ける → 半ようの流れがいないと切れない → においで・風のきず・かばう（その場で やり直し・2回で はじめから）→ カニと戦う → わき出る → ごほうび（1回だけ）', async () => {
  const { bot, c } = await setup(921, { job: 'priest', flags: OPEN });
  const qd = W.well;
  assert.ok(shows('fq_well_rock', c) && !shows('fq_well_flow', c));
  await talkTo(bot, 'fq_well_host', [0]);
  assert.ok(c.flags[WQ9.wellStart]);
  assert.equal(q(c, qd.name).find, 'fq_well_rock');
  assert.ok(said(await talkTo(bot, 'fq_well_v1'), /しめった、こけのにおい/), '話は ヒント');
  const ans = WELL_PLAN.map((x) => x.ans);
  let msgs = await talkTo(bot, 'fq_well_rock', ans);
  assert.ok(said(msgs, /半ようの少年の人が、パーティーに/) && !said(msgs, /どこを切る/) && !c.flags[qd.done]);
  c.job = 'bakuryuha'; // 半ようの少年 → … → ばくりゅうはの大よう
  msgs = await talkTo(bot, 'fq_well_rock', [wrong(ans[0]), wrong2(ans[0])]);
  assert.ok(said(msgs, /もう一度、考えてみよう/) && said(msgs, /思い出してから/) && !said(msgs, /どこを切る/) && !battled(msgs, ''), '2回 まちがえたら はじめから');
  c.job = 'inuyasha';
  msgs = await talkTo(bot, 'fq_well_rock', [ans[0], wrong(ans[1]), ans[1], ans[2]]);
  assert.ok(said(msgs, /鉄さいがの一ふり/) && said(msgs, /おれの後ろに/), '1回 まちがえても その場で やり直せる');
  assert.ok(battled(msgs, 'fq_springcrab') && said(msgs, /わき水が、もどった/), 'カニと 戦って わき出た');
  assert.ok(c.flags[qd.done] && !shows('fq_well_rock', c) && shows('fq_well_flow', c));
  assert.ok(labDoneQuests(c).includes(qd.name) && !q(c, qd.name));
  assert.ok(said(await talkTo(bot, 'fq_well_flow'), /こんこんと/));
  assert.ok(said(await talkTo(bot, 'fq_well_host'), /なかよし/));
});

test('わき水の ごほうび: 素材・道具・ゴールド・メダル。1回だけ（ひとりでも とける）', async () => {
  const { bot, c } = await setup(922, { job: 'hanyo_boy', flags: OPEN });
  const qd = W.well;
  await talkTo(bot, 'fq_well_host', [0]);
  const ans = WELL_PLAN.map((x) => x.ans);
  await rewarded(c, qd, () => talkTo(bot, 'fq_well_rock', ans), () => talkTo(bot, 'fq_well_host'));
});

// ───── 40. キノコ畑 ─────
test('ヒカリゴケの里の、キノコどろぼう: ライティング・待ちぶせ → コウモリと戦う → 分けあう（戦いの あとは まちがえても すすむ）→ ごほうび（1回だけ）。旅の魔道士の流れがいないと つかまえられない', async () => {
  const { bot, c } = await setup(923, { job: 'warrior', flags: OPEN });
  const qd = W.kinoko;
  await talkTo(bot, 'fq_kinoko_host', [0]);
  assert.ok(c.flags[WQ9.kinokoStart] && q(c, qd.name).find === 'fq_kinoko_field');
  const ans = KINOKO_PLAN.map((x) => x.ans);
  let msgs = await talkTo(bot, 'fq_kinoko_field', ans);
  assert.ok(said(msgs, /大食いの旅の魔道士の人が、パーティーに/) && !battled(msgs, ''));
  c.job = 'doramata'; // 大食いの旅の魔道士 → … → ドラまた
  msgs = await talkTo(bot, 'fq_kinoko_field', [ans[0], 0, 1]);
  assert.ok(said(msgs, /ライティング/) && !battled(msgs, '') && !c.flags[qd.done], '待ちぶせを 2回 まちがえたら はじめから（まだ 戦わない）');
  c.job = 'lina';
  msgs = await rewarded(c, qd, () => talkTo(bot, 'fq_kinoko_field', [ans[0], ans[1], 0, 1]), async () => {
    const m = await talkTo(bot, 'fq_kinoko_field');
    assert.ok(said(m, /コウモリさんの分/) && !battled(m, ''), '1回だけ');
  });
  assert.ok(battled(msgs, 'fq_batthief') && said(msgs, /大もり定食/) && said(msgs, /いちばん、わかるもの/), '戦いの あとの なぞは、まちがえても すすむ');
  assert.ok(said(msgs, /畑の番人/));
  assert.ok(said(await talkTo(bot, 'fq_kinoko_v3'), /おなかいっぱい/));
});

// ───── 41. ゆうれいの 声 ─────
test('大地の下の、ゆうれいの声: れい力をさぐる・正体を見ぬく・れい丸で ひもを うつ（戦いなし）→ ごほうび（1回だけ）。ふりょうの流れが いないと 見ぬけない', async () => {
  const { bot, c } = await setup(924, { job: 'mage', flags: OPEN });
  const qd = W.ghost;
  await talkTo(bot, 'fq_ghost_host', [0]);
  assert.ok(c.flags[WQ9.ghostStart] && q(c, qd.name).find === 'fq_ghost_spot');
  const ans = GHOST_PLAN.map((x) => x.ans);
  let msgs = await talkTo(bot, 'fq_ghost_spot', ans);
  assert.ok(said(msgs, /ふりょうの人が、パーティーに/));
  c.job = 'makai_prince'; // ふりょう → … → 魔界の王の子
  msgs = await talkTo(bot, 'fq_ghost_spot', [ans[0], ans[1], 1, 2]);
  assert.ok(said(msgs, /鉱山の底ごと/) && said(msgs, /出直す/) && !c.flags[qd.done], 'さいごで 2回 まちがえたら はじめから');
  c.job = 'reikai_tantei';
  await rewarded(c, qd, async () => {
    const m = await talkTo(bot, 'fq_ghost_spot', ans);
    assert.ok(said(m, /れい丸！/) && said(m, /見回りのよびぶえ/) && !battled(m, ''));
    return m;
  }, () => talkTo(bot, 'fq_ghost_host'));
  assert.ok(said(await talkTo(bot, 'fq_ghost_spot'), /しずかに/));
});

// ───── 地図の しるし・ヒント・困っている人 ─────
test('受けた たのまれごとは クエストの 画面・地図の しるし・「はなす」の ヒント。困っている人は c9_act2 の あとから', () => {
  const all = { flags: Object.fromEntries([...OPEN, ...WORK9_QUESTS.map((x) => x.start)].map((f) => [f, true])), items: [], keyItems: [] };
  const list = subQuests(all).filter((x) => WORK9_QUESTS.some((w) => w.name === x.name));
  assert.equal(list.length, 3);
  for (const x of list) {
    assert.ok(npcAnywhere(x.who), `${x.name}: ${x.who}`);
    assert.ok(npcAnywhere(x.find), `${x.name}: ${x.find}`);
    assert.ok(x.text && x.hint, x.name);
    assert.deepEqual(checkText(x.text + x.hint).filter((p) => p.kind !== 'kana'), [], x.name);
  }
  for (const qd of WORK9_QUESTS) {
    assert.ok(questMarks(all, 'c9b_under', '').some((m) => m.label === qd.name), `${qd.id}: 地図の しるし`);
    const h = subQuestHint(`fq_${qd.id}`);
    assert.ok(h && h.board && h.npc === qd.npc && h.roots === qd.roots && h.open.includes('c9_act2'), `${qd.id}: 困っている人`);
  }
  assert.ok(WORK9_QUESTS.some((qd) => sideQuestHint(all).includes(qd.name)), '「はなす」の ヒント');
  assert.ok(!availableSubQuests(all).some((h) => WORK9_QUESTS.some((qd) => h.id === `fq_${qd.id}`)), '受けたら 困っている人から 消える');
  const none = { flags: Object.fromEntries(OPEN.map((f) => [f, true])), items: [], keyItems: [] };
  for (const qd of WORK9_QUESTS) {
    assert.ok(!q(none, qd.name), qd.id);
    assert.ok(!questMarks(none, 'c9b_under', '').some((m) => m.label === qd.name), `${qd.id}: 受ける 前は しるし なし`);
  }
  const ids = (c) => availableSubQuests(c).filter((h) => h.board).map((h) => h.id);
  const f = Object.fromEntries(BEFORE.map((k) => [k, true]));
  assert.equal(ids({ flags: f }).length, 38, 'c9_act2 の 前は 38');
  assert.equal(ids({ flags: { ...f, c9_act2: true } }).length, 41, 'c9_act2 の あとは 41');
});

// ───── お仕事いらい板: 41まい・7ページ ─────
test('お仕事いらい板: c9_act2 の 前は 38まい（7ページ）・あとは 41まい（7ページ。7ページ目は 37〜41 の 5まい）。はり紙を 読んで 受けると 地図に しるし', async () => {
  const before = { flag: (k) => BEFORE.includes(k) };
  const after = { flag: (k) => OPEN.includes(k) };
  assert.equal(boardList(before).length, 38);
  assert.equal(boardPages(before), 7);
  assert.equal(boardList(after).length, 41);
  assert.equal(boardPages(after), 7);
  assert.equal(boardPages(), 7);
  const { bot, c } = await setup(925, { flags: OPEN });
  const qd = W.ghost;
  const marked = () => questMarks(c, 'c9b_under', '').some((m) => m.label === qd.name);
  assert.ok(!marked() && !q(c, qd.name));
  // 1→…→6ページ（つぎ 6 を 6回）→ 7ページ目の 5まい目（ゆうれい。4）→ 読む →「うける？」はい（0）→ 7ページ目に もどる → やめる（6）
  const msgs = await talkTo(bot, 'fq_board', [6, 6, 6, 6, 6, 6, 4, 0, 6]);
  const menus = msgs.filter((m) => m.t === 'script' && m.steps.at(-1)?.[0] === 'choice').map((m) => m.steps.at(-1));
  assert.ok(said(msgs, /はり紙は41まい/));
  assert.match(menus[6][1], /7\/7ページ/);
  assert.deepEqual(menus[6][2], [...FAMILY_QUESTS.slice(36).map((x) => x.name), '前のページへ', 'やめる']);
  assert.equal(menus[6][3].length, menus[6][2].length, 'カーソルの せつめいも 同じ 数');
  assert.match(menus[6][3][4], /^必要な職業：ふりょうの系統（×いない）/);
  assert.ok(said(msgs, /ゆうれいの声がします/) && said(msgs, /このいらいを、うける？/) && said(msgs, /を受けた！/));
  assert.ok(c.flags[takeFlag(qd)] && !c.flags[qd.start]);
  assert.match(menus[8][1], /7\/7ページ/, '読んだら 7ページ目に もどる');
  assert.equal(menus[8][2][4], `${qd.name}（受けている）`);
  const e = q(c, qd.name);
  assert.ok(e && e.who === qd.npc && /トッポに会おう/.test(e.text) && e.hint.includes(qd.where), 'クエストの 画面');
  assert.ok(marked(), '受けたら 地図に しるし');
  await talkTo(bot, qd.npc, [0]);
  assert.ok(c.flags[qd.start] && q(c, qd.name).find === 'fq_ghost_spot');
  assert.ok(!bot.s.busy);
});

// ───── 戦いの 強さ ─────
test('戦い: 新しい 2つ（敵Lv98）は 第2幕の あと（Lv97〜100）の 4人・2人・ひとり・その 流れの ひとりでも 完全オートで 勝てる（ボスほど強くない）', () => {
  const as = (base, job, lv, name) => {
    const c = makeChar(base, lv, 10, name, 58);
    c.jobs[job] = { ...c.jobs[base] };
    c.job = job;
    fullHeal(c);
    return c;
  };
  const line = { fq_springcrab: ['monk', 'inuyasha'], fq_batthief: ['mage', 'lina'] };
  for (const id of ['fq_springcrab', 'fq_batthief']) {
    const e = FIXED_ENCOUNTERS[id];
    assert.ok(e && !e.boss && e.canFlee === false && e.enemyLv === 98 && !(e.enemyPow > 1), id);
    for (const [sp] of e.group) assert.ok(MONSTER_ART[sp], `${sp} の 絵`);
    for (const jobs of [['warrior', 'priest', 'mage', 'monk'], ['warrior', 'priest'], ['warrior'], ['priest'], ['monk'], ['mage'], ['line'], ['line', 'mage']]) {
      let win = 0;
      for (let i = 0; i < 6; i++) {
        const lv = 97 + (i % 4);
        const party = jobs.map((j, k) => (j === 'line' ? as(...line[id], lv, `p${k}`) : makeChar(j, lv, 10, `p${k}`, 58)));
        const r = runBattle(party, e.group.flatMap(([sp, n]) => Array(n).fill(sp)), { seed: 92 + i * 7919, enemyLv: e.enemyLv, enemyPow: e.enemyPow });
        if (r.outcome === 'win') win++;
      }
      assert.ok(win >= 6, `${id} ${jobs.join('・')} 勝ち ${win}/6`);
    }
  }
});

// ───── 漢字 ─────
test('漢字: 新しい ファイルは gameFiles() に 入っていて、使えない 漢字・スペースが ない', () => {
  const files = ['shared/data/sidequests-work9.js', 'shared/maps/work-quests9.js', 'client/render/work9-art.js'].map((f) => gameFiles().find((g) => g.endsWith('/public/js/' + f)));
  assert.ok(files.every(Boolean), 'gameFiles() に 入っている');
  const bad = [];
  for (const f of files) for (const p of checkFile(f)) if (p.kind !== 'kana') bad.push(`${f.split('/').pop()}:${p.line} [${p.kind} ${p.detail}] ${p.text}`);
  assert.deepEqual(bad, []);
  for (const qd of WORK9_QUESTS) for (const t of [qd.name, qd.paper, qd.who, qd.where, qd.job]) assert.deepEqual(checkText(t).filter((p) => p.kind !== 'kana'), [], t);
});
