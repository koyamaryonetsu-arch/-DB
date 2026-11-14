// 第80回 D班: お仕事いらい 33〜35（docs/plan-ch8.md の 9-3）。1〜32 の どれとも かさならない 伝説の 職業の 系統で とける たのまれごと
// 33. 小さなオアシスの、いばりんぼうおだいかん（将軍 → 暴れんぼう将軍）・34. 東の平原の、小さな剣術道場（ひ村ばっ刀さい → 飛天御剣流けい承者）・
// 35. 炎の山のふもとの、お湯が出ない土管（ももの姫〈男の子は 配管工〉→ ロゼッタ）
// 1〜32 の どれとも かさならない 系統は この 3つだけ（将軍と ひ村ばっ刀さいは、両方 きわめた 人だけの 天下むそうの剣聖 だけが かさなる）
// 受けて → すすめて → ごほうび・職業の しばり（いる／いない）・まちがえても やり直せる・ひとりで とける・ごほうびは 1回だけ・
// 第8章 第4幕の 時の広間に 着いた あとから（はり紙も 人も）・地図の しるし・困っている人・漢字・軽い 戦い（敵Lv91）・
// お仕事いらい板: 35まい・6ページ（c8_hall の 前は 32まい・6ページの まま）・6ページ目から 受ける
import { test } from 'node:test';
// 第82回 A: 犬夜叉の 系統（まだ たのまれごとが ない 新しい 系統。のこりの 系統の 見はりから のぞく）
import { JOBS_R82A } from '../public/js/shared/data/jobs-r82a.js';
import assert from 'node:assert/strict';
import { MAPS, isBlocked, condOk } from '../public/js/shared/maps/index.js';
import { SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { JOBS, jobAncestry, LEGEND_ORDER } from '../public/js/shared/data/jobs.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { FAMILY_QUESTS, boardPage, boardInfo, boardPages, boardList, takeFlag, rewardNames } from '../public/js/shared/data/sidequests-family.js';
import { WORK6_QUESTS } from '../public/js/shared/data/sidequests-work6.js';
import { WORK7_QUESTS, WORK7_SCRIPTS, WORK7_STORY_SCRIPTS, workSubQuests7, OAS_PLAN, DOJO_PLAN, PIPE_PLAN } from '../public/js/shared/data/sidequests-work7.js';
import { WQ7, WQ7_OPEN, OAS_VOICES, OAS_STEPS, DOJO_VOICES, DOJO_STEPS, PIPE_VOICES, PIPE_STEPS, WORK7_NPC_IDS } from '../public/js/shared/maps/work-quests7.js';
import { jobLine } from '../public/js/shared/data/fq-common.js';
import { labDoneQuests, sideQuestHint } from '../public/js/shared/data/sidequests.js';
import { subQuests, questMarks } from '../public/js/shared/data/quest-targets.js';
import { availableSubQuests, subQuestHint } from '../public/js/shared/data/subquest-hints.js';
import { itemCount, fullHeal } from '../public/js/shared/stats.js';
import { starsFor } from '../public/js/shared/data/items-rare.js';
import { medalsFound } from '../public/js/shared/data/casino.js';
import { makeChar, runBattle } from '../tools/sim.js';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { npcOpts } from '../public/js/client/render/chars.js';
import { checkFile, gameFiles, checkText } from '../tools/kanji-check.mjs';
import { setup, npcAnywhere, talkTo, said, battled, CLEAR } from './fq-helpers.js';

// 第8章 第3幕の さいごまで（c8_spring の いらい 30〜32 は 出る）・第4幕の はじめ（c8_rift）
const BEFORE = [...CLEAR, 'c7_karim', 'c7_kingdom', 'c7_clear', 'c8_start', 'c8_kingdom', 'c8_jafar', 'c8_sea', 'c8_abyss', 'c8_hades', 'c8_sky', 'c8_spring', 'c8_fortress', 'c8_bowser', 'c8_rift'];
const OPEN = [...BEFORE, WQ7_OPEN];
const q = (c, name) => subQuests(c).find((x) => x.name === name);
const W = Object.fromEntries(WORK7_QUESTS.map((x) => [x.id, x]));
const wrong = (ans) => (ans === 0 ? 1 : 0);
const shows = (id, c) => condOk(npcAnywhere(id).n.show, (f) => !!c.flags[f]);

// ごほうびを もらった（あれば アクセサリー。素材や 道具・ゴールド・小さなメダル・クエストの 画面から 消える）。もう 1回 話しても ふえない
async function rewarded(c, qd, talk) {
  const gold0 = c.gold, medals0 = medalsFound(c);
  const goods0 = (qd.reward.goods || []).map(([id]) => itemCount(c, id));
  await talk();
  const check = (note) => {
    assert.ok(c.flags[qd.done], `${qd.id}: すんだ`);
    if (qd.reward.item) assert.equal(itemCount(c, qd.reward.item), 1, `${qd.id}: ${qd.reward.item}${note}`);
    (qd.reward.goods || []).forEach(([id, n], i) => assert.equal(itemCount(c, id), goods0[i] + n, `${qd.id}: ${id}${note}`));
    assert.equal(c.gold, gold0 + qd.reward.gold, `${qd.id}: ゴールド${note}`);
    assert.equal(medalsFound(c), medals0 + qd.reward.medals, `${qd.id}: メダル${note}`);
  };
  check('');
  assert.ok(labDoneQuests(c).includes(qd.name) && !q(c, qd.name), `${qd.id}: クエストの 画面`);
  await talk();
  check('（1回だけ）');
}

// ───── しくみ ─────
test('しくみ: 3つの 新しい たのまれごと（伝説の 職業に つながる 系統・1〜32 の どれとも かさならない）・今の 時代の まだ いらいの ない 場所・c8_hall の あとだけ', () => {
  assert.equal(WORK7_QUESTS.length, 3);
  assert.equal(FAMILY_QUESTS.length, 35);
  assert.deepEqual(FAMILY_QUESTS.slice(32), WORK7_QUESTS);
  assert.deepEqual(FAMILY_QUESTS.slice(29, 32), WORK6_QUESTS);
  assert.deepEqual(WORK7_QUESTS.map((x) => x.roots), [['shogun'], ['himura'], ['plumber']]);
  assert.deepEqual(WORK7_QUESTS.map((x) => x.legend), ['abarenbo_shogun', 'hiten', 'rosetta']);
  for (const qd of WORK7_QUESTS) {
    const L = jobLine(qd.roots);
    for (const id of Object.keys(JOBS)) assert.equal(L.has(id), qd.roots.some((r) => jobAncestry(id).has(r)), `${qd.id} ${id}`);
    assert.ok(LEGEND_ORDER.includes(qd.legend) && JOBS[qd.legend].tier === 3 && L.has(qd.legend), `${qd.id}: ${qd.legend}`);
    // 職業の 名前（ももの姫の 系統は 男の子だと 配管工 なので、どちらの 名前も 書く）
    const names = qd.roots.flatMap((r) => [JOBS[r].name, JOBS[r].masc?.name].filter(Boolean));
    assert.equal(names.join('か'), qd.job, qd.id);
    assert.ok(qd.who && qd.where && qd.paper && qd.town && qd.npc, qd.id);
    assert.deepEqual(qd.open, ['c8_hall'], qd.id);
    assert.ok(npcAnywhere(qd.npc), `${qd.id}: ${qd.npc}`);
  }
  // 系統は 1〜32 の どれとも かさならない（ちがう 職業の 人が 活きる）
  const older = FAMILY_QUESTS.slice(0, 32);
  for (const a of WORK7_QUESTS) {
    assert.ok(!older.some((b) => b.legend === a.legend), a.id);
    for (const b of older) assert.ok(![...jobLine(a.roots)].some((j) => jobLine(b.roots).has(j)), `${a.id} と ${b.id}`);
  }
  // たがいには、将軍と ひ村ばっ刀さいの 先の 天下むそうの剣聖（両方を きわめた 人だけ）だけが かさなる
  const both = (a, b) => [...jobLine(W[a].roots)].filter((j) => jobLine(W[b].roots).has(j));
  assert.deepEqual(both('oas', 'dojo'), ['sword_saint']);
  assert.deepEqual(JOBS.sword_saint.req.slice().sort(), ['abarenbo_shogun', 'hiten']);
  assert.deepEqual(both('oas', 'pipe'), []);
  assert.deepEqual(both('dojo', 'pipe'), []);
  // 伝説の 職業（LEGEND_ORDER の 超級の 先）で、どの たのまれごとの 系統にも 入って いない ものは もう ない
  // （のこりの ロトの勇者・魔王・はかい神・日の呼吸の使い手は、先が 1〜32 の 系統と かさなる）
  const usedAll = new Set(FAMILY_QUESTS.flatMap((x) => [...jobLine(x.roots)]));
  const free = Object.keys(JOBS).filter((id) => ![...jobLine([id])].some((j) => usedAll.has(j)) && [...jobLine([id])].some((j) => JOBS[j].tier === 3) && !(id in JOBS_R82A));
  assert.deepEqual(free, [], 'のこりの 系統');
  // 場所（今の 時代。まだ たのまれごとが ない 所）
  const maps = { oas: 'south', dojo: 'overworld', pipe: 'north' };
  const areas = { oas: '小さなオアシス', dojo: '東の平原', pipe: '炎の山のふもと' };
  const area = (id) => { const { map, n } = npcAnywhere(id); return MAPS[map].areaName?.(Math.floor(n.x), Math.floor(n.y)) || MAPS[map].name; };
  for (const qd of WORK7_QUESTS) assert.equal(npcAnywhere(qd.npc).map, maps[qd.id], qd.id);
  for (const [k, a] of Object.entries(areas)) for (const id of WORK7_NPC_IDS.filter((x) => x.startsWith(`fq_${k}_`))) assert.equal(area(id), a, id);
  const olderAreas = older.map((x) => area(x.npc));
  for (const qd of WORK7_QUESTS) assert.ok(!olderAreas.includes(area(qd.npc)), `${qd.id}: はじめての 場所`);
  // 時のはざま（c8r_*）・千年前・第7章と 第8章の マップには 置かない
  for (const m of Object.values(MAPS)) if (m.past || m.id.includes('past') || m.id.startsWith('c7') || m.id.startsWith('c8')) assert.ok(!m.npcs.some((n) => WORK7_NPC_IDS.includes(n.id)), m.id);
  // c8_hall の 前は 出ない・話しても 受けられない
  for (const id of WORK7_NPC_IDS) {
    const at = npcAnywhere(id);
    assert.ok(at, id);
    assert.equal(condOk(at.n.show, (f) => BEFORE.includes(f)), false, `${id} は c8_hall の 前は 出ない`);
    assert.ok(SCRIPTS[at.n.script], `${id} の だいほん`);
  }
  for (const id of WORK7_NPC_IDS.filter((x) => x !== 'fq_pipe_plant')) assert.equal(condOk(npcAnywhere(id).n.show, (f) => OPEN.includes(f)), true, `${id} は c8_hall の あとに 出る`);
  const pre = { flag: (f) => BEFORE.includes(f), has: () => false, count: () => 0, night: false, name: 'ソラ', c: { job: 'abarenbo_shogun' } };
  for (const qd of WORK7_QUESTS) assert.ok(!JSON.stringify(SCRIPTS[qd.npc](pre)).includes('"choice"'), `${qd.id} は 受けられない`);
  assert.deepEqual(workSubQuests7({ flags: {} }, () => false, () => false), []);
  for (const id of Object.keys(WORK7_SCRIPTS)) assert.equal(SCRIPTS[id], WORK7_SCRIPTS[id], id);
  for (const id of WORK7_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id), id);
  // 人は 立てる 所（物は かたい NPC）・人の 絵・物の 絵・ほかの 人と かさならない
  for (const id of WORK7_NPC_IDS) {
    const { map, n } = npcAnywhere(id);
    assert.ok(!isBlocked(MAPS[map], Math.floor(n.x), Math.floor(n.y), () => true) || n.solid, `${id} の 場所`);
    if (n.sprite.startsWith('mon:')) assert.ok(MONSTER_ART[n.sprite.slice(4)], `${id} の 絵`);
    else assert.ok(npcOpts(n.sprite), `${id} の みため`);
    assert.ok(!MAPS[map].npcs.some((o) => o !== n && Math.floor(o.x) === Math.floor(n.x) && Math.floor(o.y) === Math.floor(n.y)), `${id} は ほかの 人と かさならない`);
  }
});

test('ごほうび: 第64回の きまり（★5の アクセサリーは 1つだけ・乗り物なし）・素材や 道具・ゴールド・小さなメダル・はり紙と 同じ', () => {
  const accs = WORK7_QUESTS.filter((x) => x.reward.item);
  assert.equal(accs.length, 1, '★5は 1つだけ');
  const sum = (b) => Object.values(b).reduce((s, v) => s + v, 0);
  for (const qd of accs) {
    const it = ITEMS[qd.reward.item];
    assert.ok(it && it.type === 'acc' && starsFor(it) === 5 && it.src === 'gift' && !(it.price > 0), qd.id);
    // 今までの ★5（第73回の お守り 92・第74回の かざりひも 86・第75回の お守り 88）の はば。闘技場 ランク10 の ブローチより ずっと 弱い
    const s = sum(it.bonus);
    assert.ok(s >= sum(ITEMS.fq_twin_tassel.bonus) && s <= sum(ITEMS.fq_sand_amulet.bonus) && s < sum(ITEMS.ar_star_king_brooch.bonus), `${qd.id}: ${s}`);
  }
  for (const qd of WORK7_QUESTS) {
    const r = qd.reward;
    assert.ok(!r.vehicle, `${qd.id}: 乗り物なし`);
    for (const [id, n] of r.goods || []) assert.ok(ITEMS[id] && ITEMS[id].type !== 'key' && !['weapon', 'armor', 'shield', 'head', 'acc'].includes(ITEMS[id].type) && n > 0, `${qd.id}: ${id}`);
    assert.ok(r.gold > 0 && r.gold <= 4000 && r.medals > 0 && r.medals <= 3, qd.id);
    const text = boardPage({ flag: () => false }, qd).map((st) => st[2]).join('\n');
    assert.ok(text.includes(qd.paper) && text.includes(qd.who) && text.includes(`${r.gold}ゴールド`) && text.includes(`小さなメダル${r.medals}まい`), qd.id);
    for (const name of rewardNames(r)) assert.ok(text.includes(name), `${qd.id}: ${name}`);
    const info = boardInfo({ flag: () => false, c: { job: qd.legend } }, qd);
    assert.ok(info.includes('（○いる）') && info.split('\n').length === 3, `${qd.id}: ${info}`);
  }
});

// ───── 33. おだいかん ─────
test('小さなオアシスの、いばりんぼうおだいかん: 3人の話 → めやす箱・名のる（やり直し）→ 用心棒と戦う（1回だけ）→ 水くみ係 → ごほうび。将軍がいないと話をつけられない', async () => {
  const { bot, c } = await setup(801, { job: 'warrior', flags: OPEN });
  const qd = W.oas;
  assert.ok(shows('fq_oas_fence', c));
  await talkTo(bot, 'fq_oas_host', [0]);
  assert.ok(c.flags[WQ7.oasStart]);
  assert.equal(q(c, qd.name).find, 'fq_oas_v1');
  let msgs = await talkTo(bot, 'fq_oas_daikan');
  assert.ok(said(msgs, /話を聞こう/) && !battled(msgs, 'fq_oasguard'));
  for (const id of ['fq_oas_v1', 'fq_oas_v2', 'fq_oas_v3']) await talkTo(bot, id);
  assert.ok(OAS_VOICES.every((k) => c.flags[k]) && q(c, qd.name).find === 'fq_oas_daikan');
  const ans = OAS_PLAN.map((x) => x.ans);
  msgs = await talkTo(bot, 'fq_oas_daikan', ans);
  assert.ok(said(msgs, /将軍の人が、パーティーに/) && !c.flags[OAS_STEPS[0]]);
  c.job = 'abarenbo_shogun'; // 将軍 → 暴れんぼう将軍
  msgs = await talkTo(bot, 'fq_oas_daikan', [wrong(ans[0])]);
  assert.ok(!c.flags[OAS_STEPS[0]] && said(msgs, /思い出そう/), '1つ目の まちがい');
  msgs = await talkTo(bot, 'fq_oas_daikan', [ans[0], wrong(ans[1])]);
  assert.ok(c.flags[OAS_STEPS[0]] && !c.flags[OAS_STEPS[1]] && !battled(msgs, 'fq_oasguard'), '2つ目で まちがい（まだ 戦わない）');
  msgs = await talkTo(bot, 'fq_oas_daikan', [ans[1], wrong(ans[2])]);
  assert.ok(c.flags[OAS_STEPS[1]] && battled(msgs, 'fq_oasguard') && c.flags[WQ7.oasFight] && !c.flags[OAS_STEPS[2]] && said(msgs, /見わすれたか/), '名のって 用心棒と 戦った・3つ目で まちがい');
  c.job = 'shogun';
  msgs = await talkTo(bot, 'fq_oas_daikan', [ans[2]]);
  assert.ok(!battled(msgs, 'fq_oasguard'), '2回目は 戦わない');
  assert.ok(c.flags[WQ7.oasFree] && said(msgs, /水くみ係/) && !shows('fq_oas_fence', c), '水の さくが なくなった');
  assert.ok(q(c, qd.name).ready && q(c, qd.name).who === 'fq_oas_host');
  c.job = 'warrior'; // 報告は だれでも
  await rewarded(c, qd, () => talkTo(bot, 'fq_oas_host'));
  assert.ok(said(await talkTo(bot, 'fq_oas_daikan'), /水は、ただじゃぞ/));
});

// ───── 34. 剣術道場 ─────
test('東の平原の、小さな剣術道場: 3人の話 → さかば刀・人を守る剣・台所に立つ（やり直し）→ 弟子になる → ★5 → ごほうび。ひ村ばっ刀さいがいないと止められない（戦いなし）', async () => {
  const { bot, c } = await setup(802, { job: 'priest', flags: OPEN });
  const qd = W.dojo;
  await talkTo(bot, 'fq_dojo_host', [0]);
  assert.ok(c.flags[WQ7.dojoStart]);
  assert.equal(q(c, qd.name).find, 'fq_dojo_v1');
  let msgs = await talkTo(bot, 'fq_dojo_rival');
  assert.ok(said(msgs, /話を聞こう/) && !said(msgs, /どうする？/));
  for (const id of ['fq_dojo_v1', 'fq_dojo_v2', 'fq_dojo_v3']) await talkTo(bot, id);
  assert.ok(DOJO_VOICES.every((k) => c.flags[k]) && q(c, qd.name).find === 'fq_dojo_rival');
  const ans = DOJO_PLAN.map((x) => x.ans);
  msgs = await talkTo(bot, 'fq_dojo_rival', ans);
  assert.ok(said(msgs, /ひ村ばっ刀さいの人が、パーティーに/) && !c.flags[DOJO_STEPS[0]]);
  c.job = 'hiten'; // ひ村ばっ刀さい → 飛天御剣流けい承者
  msgs = await talkTo(bot, 'fq_dojo_rival', [ans[0], 1]);
  assert.ok(c.flags[DOJO_STEPS[0]] && !c.flags[DOJO_STEPS[1]] && said(msgs, /ぽかんと/), '2つ目で まちがい（おろ？）');
  c.job = 'himura';
  msgs = await talkTo(bot, 'fq_dojo_rival', [ans[1], 0]);
  assert.ok(c.flags[DOJO_STEPS[1]] && !c.flags[DOJO_STEPS[2]] && said(msgs, /にがい/), '3つ目で まちがい（まっ黒こげを 食べる）');
  msgs = await talkTo(bot, 'fq_dojo_rival', [ans[2]]);
  assert.ok(c.flags[WQ7.dojoJoin] && said(msgs, /百倍うまい/) && !battled(msgs, ''));
  assert.ok(q(c, qd.name).ready && q(c, qd.name).who === 'fq_dojo_host');
  c.job = 'warrior';
  await rewarded(c, qd, () => talkTo(bot, 'fq_dojo_host'));
  assert.ok(said(await talkTo(bot, 'fq_dojo_rival'), /けいこを/));
});

// ───── 35. 土管 ─────
test('炎の山のふもとの、お湯が出ない土管: 3人の話 → もぐる → パックンたちと戦う（1回だけ）→ ひっこし・スパナ（やり直し）→ お湯 → ごほうび。ももの姫（配管工）の系統がいないと直せない', async () => {
  const { bot, c } = await setup(803, { job: 'mage', flags: OPEN });
  const qd = W.pipe;
  assert.ok(!shows('fq_pipe_plant', c));
  await talkTo(bot, 'fq_pipe_host', [0]);
  assert.ok(c.flags[WQ7.pipeStart]);
  assert.equal(q(c, qd.name).find, 'fq_pipe_v1');
  let msgs = await talkTo(bot, 'fq_pipe_pipe');
  assert.ok(said(msgs, /話を聞こう/) && !battled(msgs, 'fq_pipeplant'));
  for (const id of ['fq_pipe_v1', 'fq_pipe_v2', 'fq_pipe_v3']) await talkTo(bot, id);
  assert.ok(PIPE_VOICES.every((k) => c.flags[k]) && q(c, qd.name).find === 'fq_pipe_pipe');
  const ans = PIPE_PLAN.map((x) => x.ans);
  msgs = await talkTo(bot, 'fq_pipe_pipe', ans);
  assert.ok(said(msgs, /ももの姫か配管工の人が、パーティーに/) && !c.flags[PIPE_STEPS[0]]);
  c.job = 'rosetta'; // ももの姫 → ロゼッタ
  msgs = await talkTo(bot, 'fq_pipe_pipe', [wrong(ans[0])]);
  assert.ok(!c.flags[PIPE_STEPS[0]] && !battled(msgs, 'fq_pipeplant'), '1つ目の まちがい（まだ 戦わない）');
  msgs = await talkTo(bot, 'fq_pipe_pipe', [ans[0], wrong(ans[1])]);
  assert.ok(c.flags[PIPE_STEPS[0]] && battled(msgs, 'fq_pipeplant') && c.flags[WQ7.pipeFight] && !c.flags[PIPE_STEPS[1]] && said(msgs, /こごえて/), 'もぐって 戦った・2つ目で まちがい');
  c.job = 'plumber';
  msgs = await talkTo(bot, 'fq_pipe_pipe', [ans[1], wrong(ans[2])]);
  assert.ok(!battled(msgs, 'fq_pipeplant') && c.flags[PIPE_STEPS[1]] && !c.flags[PIPE_STEPS[2]], '2回目は 戦わない・3つ目で まちがい');
  msgs = await talkTo(bot, 'fq_pipe_pipe', [ans[2]]);
  assert.ok(c.flags[WQ7.pipeFlow] && said(msgs, /ヤッフー/));
  assert.ok(q(c, qd.name).ready && q(c, qd.name).who === 'fq_pipe_host');
  c.job = 'warrior';
  await rewarded(c, qd, () => talkTo(bot, 'fq_pipe_host'));
  assert.ok(shows('fq_pipe_plant', c), 'ひっこした パックンフラワー');
  assert.ok(said(await talkTo(bot, 'fq_pipe_plant'), /植木ばち土管/));
});

// ───── 地図の しるし・ヒント・困っている人 ─────
test('受けた たのまれごとは クエストの 画面・地図の しるし・「はなす」の ヒント。困っている人は c8_hall の あとから', () => {
  const all = { flags: Object.fromEntries([...OPEN, ...WORK7_QUESTS.map((x) => x.start)].map((f) => [f, true])), items: [], keyItems: [] };
  const list = subQuests(all).filter((x) => WORK7_QUESTS.some((w) => w.name === x.name));
  assert.equal(list.length, 3);
  for (const x of list) {
    assert.ok(npcAnywhere(x.who), `${x.name}: ${x.who}`);
    if (x.find) assert.ok(npcAnywhere(x.find), `${x.name}: ${x.find}`);
    assert.ok(x.text && x.hint, x.name);
    assert.deepEqual(checkText(x.text + x.hint).filter((p) => p.kind !== 'kana'), [], x.name);
  }
  for (const qd of WORK7_QUESTS) {
    const map = npcAnywhere(qd.npc).map;
    assert.ok(questMarks(all, map, '').some((m) => m.label === qd.name), `${qd.id}: 地図の しるし`);
    const h = subQuestHint(`fq_${qd.id}`);
    assert.ok(h && h.board && h.npc === qd.npc && h.roots === qd.roots && h.open.includes('c8_hall'), `${qd.id}: 困っている人`);
  }
  assert.ok(WORK7_QUESTS.some((qd) => sideQuestHint(all).includes(qd.name)), '「はなす」の ヒント');
  assert.ok(!availableSubQuests(all).some((h) => WORK7_QUESTS.some((qd) => h.id === `fq_${qd.id}`)), '受けたら 困っている人から 消える');
  const none = { flags: Object.fromEntries(OPEN.map((f) => [f, true])), items: [], keyItems: [] };
  for (const qd of WORK7_QUESTS) {
    assert.ok(!q(none, qd.name), qd.id);
    assert.ok(!questMarks(none, npcAnywhere(qd.npc).map, '').some((m) => m.label === qd.name), `${qd.id}: 受ける 前は しるし なし`);
  }
  const ids = (c) => availableSubQuests(c).filter((h) => h.board).map((h) => h.id);
  const f = { c5_clear: true, c7_karim: true, c8_kingdom: true, c8_abyss: true, c8_spring: true };
  assert.equal(ids({ flags: f }).length, 32, 'c8_hall の 前は 32');
  assert.equal(ids({ flags: { ...f, c8_hall: true } }).length, 35, 'c8_hall の あとは 35');
});

// ───── お仕事いらい板: 35まい・6ページ ─────
test('お仕事いらい板: c8_hall の 前は 32まい（6ページ）・あとは 35まい（6ページ。6ページ目は 31〜35 の 5まい）。6ページ目の はり紙を 読んで 受けると 地図に しるし', async () => {
  const before = { flag: (k) => BEFORE.includes(k) };
  const after = { flag: (k) => OPEN.includes(k) };
  assert.equal(boardList(before).length, 32);
  assert.equal(boardPages(before), 6);
  assert.equal(boardList(after).length, 35);
  assert.equal(boardPages(after), 6);
  assert.equal(boardPages(), 6);
  const { bot, c } = await setup(804, { flags: OPEN });
  const qd = W.pipe;
  const map = npcAnywhere(qd.npc).map;
  const marked = () => questMarks(c, map, '').some((m) => m.label === qd.name);
  assert.ok(!marked() && !q(c, qd.name));
  // 1→2→3→4→5→6ページ（つぎ 6・6・6・6・6）→ 6ページ目の 5まい目（土管。4）→ 読む →「うける？」はい（0）→ 6ページ目に もどる → やめる（6）
  const msgs = await talkTo(bot, 'fq_board', [6, 6, 6, 6, 6, 4, 0, 6]);
  const menus = msgs.filter((m) => m.t === 'script' && m.steps.at(-1)?.[0] === 'choice').map((m) => m.steps.at(-1));
  assert.ok(said(msgs, /はり紙は35まい/));
  assert.match(menus[4][1], /5\/6ページ/);
  assert.deepEqual(menus[4][2], [...FAMILY_QUESTS.slice(24, 30).map((x) => x.name), 'つぎのページへ', '前のページへ', 'やめる']);
  assert.match(menus[5][1], /6\/6ページ/);
  assert.deepEqual(menus[5][2], [...FAMILY_QUESTS.slice(30).map((x) => x.name), '前のページへ', 'やめる']);
  assert.equal(menus[5][2].length, 7, '5まい＋前のページへ＋やめる');
  assert.equal(menus[5][3].length, menus[5][2].length, 'カーソルの せつめいも 同じ 数');
  assert.match(menus[5][3][4], /^必要な職業：ももの姫か配管工の系統（×いない）/);
  assert.ok(said(msgs, /土管が、つまってしまった/) && said(msgs, /このいらいを、うける？/) && said(msgs, /を受けた！/));
  assert.ok(c.flags[takeFlag(qd)] && !c.flags[qd.start]);
  assert.match(menus[7][1], /6\/6ページ/, '読んだら 6ページ目に もどる');
  assert.equal(menus[7][2][4], `${qd.name}（受けている）`);
  // 大きな はり紙（第76回 paper-pop）の 中み
  const pop = menus[6].find((v) => v && typeof v === 'object' && !Array.isArray(v) && v.paper);
  assert.ok(pop && pop.name === qd.name && pop.paper === qd.paper && pop.jobs.includes('ロゼッタ') && pop.gold === qd.reward.gold, '大きな はり紙');
  const e = q(c, qd.name);
  assert.ok(e && e.who === qd.npc && /ゴロウに会おう/.test(e.text) && e.hint.includes(qd.where), 'クエストの 画面');
  assert.ok(marked(), '受けたら 地図に しるし');
  await talkTo(bot, qd.npc, [0]);
  assert.ok(c.flags[qd.start] && q(c, qd.name).find === 'fq_pipe_v1');
  assert.ok(!bot.s.busy);
});

// ───── 戦いの 強さ ─────
test('戦い: 新しい 2つ（敵Lv91）は お話の ころ（Lv89〜92）の 4人・2人・その 系統の ひとりでも 完全オートで 勝てる（ボスほど強くない）', () => {
  // その 系統の 人（いないと 戦わない）は 戦士・武闘家の 装備で その 職業に する
  const as = (base, job, lv, name) => {
    const c = makeChar(base, lv, 10, name, 58);
    c.jobs[job] = { ...c.jobs[base] };
    c.job = job;
    fullHeal(c);
    return c;
  };
  const line = { fq_oasguard: ['warrior', 'shogun'], fq_pipeplant: ['monk', 'plumber'] };
  for (const id of ['fq_oasguard', 'fq_pipeplant']) {
    const e = FIXED_ENCOUNTERS[id];
    assert.ok(e && !e.boss && e.canFlee === false && e.enemyLv === 91 && !(e.enemyPow > 1), id);
    for (const [sp] of e.group) assert.ok(MONSTER_ART[sp], `${sp} の 絵`);
    for (const jobs of [['warrior', 'priest', 'mage', 'monk'], ['warrior', 'priest'], ['warrior'], ['priest'], ['monk'], ['line'], ['line', 'mage']]) {
      let win = 0;
      for (let i = 0; i < 6; i++) {
        const lv = 89 + (i % 4);
        const party = jobs.map((j, k) => (j === 'line' ? as(...line[id], lv, `p${k}`) : makeChar(j, lv, 10, `p${k}`, 58)));
        const r = runBattle(party, e.group.flatMap(([sp, n]) => Array(n).fill(sp)), { seed: 80 + i * 7919, enemyLv: e.enemyLv, enemyPow: e.enemyPow });
        if (r.outcome === 'win') win++;
      }
      assert.ok(win >= 6, `${id} ${jobs.join('・')} 勝ち ${win}/6`);
    }
  }
});

// ───── 漢字 ─────
test('漢字: 新しい ファイルは gameFiles() に 入っていて、使えない 漢字・スペースが ない', () => {
  const files = ['shared/data/sidequests-work7.js', 'shared/maps/work-quests7.js', 'client/render/work7-art.js'].map((f) => gameFiles().find((g) => g.endsWith('/public/js/' + f)));
  assert.ok(files.every(Boolean), 'gameFiles() に 入っている');
  const bad = [];
  for (const f of files) for (const p of checkFile(f)) if (p.kind !== 'kana') bad.push(`${f.split('/').pop()}:${p.line} [${p.kind} ${p.detail}] ${p.text}`);
  assert.deepEqual(bad, []);
  for (const qd of WORK7_QUESTS) for (const t of [qd.name, qd.paper, qd.who, qd.where, qd.job]) assert.deepEqual(checkText(t).filter((p) => p.kind !== 'kana'), [], t);
  assert.deepEqual(checkText(ITEMS.fq_dojo_band.name + ITEMS.fq_dojo_band.desc).filter((p) => p.kind !== 'kana'), []);
});
