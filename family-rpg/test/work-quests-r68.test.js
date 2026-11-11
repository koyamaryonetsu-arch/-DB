// 第68回 D班: お仕事いらい 18〜23（docs/plan-ch7.md の 8-3）。第66回の 新しい 伝説の 職業に つながる 系統で とける たのまれごと
// 18. ルミナの町の、みんなの広場会議（キャリア組 → 総理大臣）・19. オアシスの村の、けっこん式のごちそう（三ツ星シェフ → 五つ星シェフ）・
// 20. 星読みの里の、ドジな見習い（ネコ型ロボット → のぶドラ）・21. 竜守りの村の、くしゃみ火事（消防士 → 火消しの神）・
// 22. ホシフル村の、思い出の花畑（大賢者 → 千年の大魔法使い）・23. 鏡の湖のかっぱずもう（カッパ → かっぱの大王）
// 受けて → すすめて → ごほうび・職業の しばり（いる／いない）・まちがえても やり直せる・ひとりで とける・ごほうびは 1回だけ・
// 第7章の カリムの あとから（はり紙も 人も）・地図の しるし・困っている人・漢字・軽い 戦い（敵Lv76）・
// お仕事いらい板: 23まい・4ページ（カリムの 前は 17まい・3ページの まま）・4ページ目から 受ける
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, isBlocked, condOk } from '../public/js/shared/maps/index.js';
import { SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { JOBS, jobAncestry } from '../public/js/shared/data/jobs.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { FAMILY_QUESTS, boardPage, boardInfo, boardPages, boardList, takeFlag, rewardNames } from '../public/js/shared/data/sidequests-family.js';
import { WORK2_QUESTS } from '../public/js/shared/data/sidequests-work2.js';
import {
  WORK3_QUESTS, WORK3_SCRIPTS, WORK3_STORY_SCRIPTS, workSubQuests3, VOTE_PLAN, FEAST_MENU, DORA_PLAN, FIRE_PLAN, FLOWER_PLAN, KAPPA_PLAN,
} from '../public/js/shared/data/sidequests-work3.js';
import {
  WQ3, WQ3_OPEN, VOTE_VOICES, VOTE_PLANS, FEAST_GUESTS, FEAST_DISHES, DORA_VOICES, DORA_TOOLS, FIRE_VOICES, FIRE_STEPS, FLOWER_VOICES, FLOWER_SPELLS,
  KAPPA_VOICES, KAPPA_TIPS, WORK3_NPC_IDS,
} from '../public/js/shared/maps/work-quests3.js';
import { jobLine } from '../public/js/shared/data/fq-common.js';
import { labDoneQuests, sideQuestHint } from '../public/js/shared/data/sidequests.js';
import { subQuests, questMarks } from '../public/js/shared/data/quest-targets.js';
import { availableSubQuests, subQuestHint } from '../public/js/shared/data/subquest-hints.js';
import { itemCount } from '../public/js/shared/stats.js';
import { starsFor } from '../public/js/shared/data/items-rare.js';
import { medalsFound } from '../public/js/shared/data/casino.js';
import { makeChar, runBattle } from '../tools/sim.js';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { npcOpts } from '../public/js/client/render/chars.js';
import { checkFile, gameFiles, checkText } from '../tools/kanji-check.mjs';
import { setup, npcAnywhere, talkTo, said, battled, CLEAR } from './fq-helpers.js';

const OPEN = [...CLEAR, WQ3_OPEN];
const q = (c, name) => subQuests(c).find((x) => x.name === name);
const W = Object.fromEntries(WORK3_QUESTS.map((x) => [x.id, x]));
const wrong = (ans) => (ans === 0 ? 1 : 0);
const shows = (id, c) => condOk(npcAnywhere(id).n.show, (f) => !!c.flags[f]);
// 第66回で ふえた 伝説の 職業（docs/plan-r66-legend.md）
const R66_LEGENDS = ['guard_god', 'kenshin', 'poke_master', 'sennen_mage', 'new_kawaii', 'smap', 'oogosho', 'five_star_chef', 'souri', 'kaichou', 'hatarakikata', 'ano_kata',
  'gekka', 'nobu_dora', 'kappa_king', 'truth_gate', 'rosetta', 'triple_face', 'hikeshi_god', 'world_streamer', 'game_god', 'black_cardman', 'saiki'];

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
test('しくみ: 6つの 新しい たのまれごと（第66回の 新しい 伝説の 職業に つながる 系統）・今の 時代の 町・カリムの あとだけ・だいほんと 戦い', () => {
  assert.equal(WORK3_QUESTS.length, 6);
  assert.equal(FAMILY_QUESTS.length, 32); // 第73回: 24〜26・第74回: 27〜29・第75回: 30〜32 が うしろに ふえた
  assert.deepEqual(FAMILY_QUESTS.slice(17, 23), WORK3_QUESTS);
  assert.deepEqual(FAMILY_QUESTS.slice(11, 17), WORK2_QUESTS);
  assert.deepEqual(WORK3_QUESTS.map((x) => x.roots[0]), ['career', 'star_chef', 'neko_robot', 'firefighter', 'daikenja', 'kappa']);
  assert.deepEqual(WORK3_QUESTS.map((x) => x.legend), ['souri', 'five_star_chef', 'nobu_dora', 'hikeshi_god', 'sennen_mage', 'kappa_king']);
  for (const qd of WORK3_QUESTS) {
    const L = jobLine(qd.roots);
    for (const id of Object.keys(JOBS)) assert.equal(L.has(id), qd.roots.some((r) => jobAncestry(id).has(r)), `${qd.id} ${id}`);
    // 系統の 先に 第66回の 伝説の 職業
    assert.ok(R66_LEGENDS.includes(qd.legend) && JOBS[qd.legend].tier === 3 && L.has(qd.legend), `${qd.id}: ${qd.legend}`);
    assert.equal(JOBS[qd.roots[0]].name, qd.job, qd.id);
    assert.ok(qd.who && qd.where && qd.paper && qd.town && qd.npc, qd.id);
    assert.deepEqual(qd.open, ['c7_karim'], qd.id);
    assert.ok(npcAnywhere(qd.npc), `${qd.id}: ${qd.npc}`);
  }
  // 6つの 系統は かさならない（ちがう 職業の 人が 活きる）
  for (const a of WORK3_QUESTS) for (const b of WORK3_QUESTS) if (a !== b) assert.ok(![...jobLine(a.roots)].some((j) => jobLine(b.roots).has(j)), `${a.id} と ${b.id}`);
  // 町（今の 時代）
  const maps = { souri: 'overworld', chef: 'south', dora: 'hoshiyomi', fire: 'north', flower: 'overworld', kappa: 'overworld' };
  const area = (id) => { const { map, n } = npcAnywhere(id); return MAPS[map].areaName?.(Math.floor(n.x), Math.floor(n.y)) || MAPS[map].name; };
  for (const qd of WORK3_QUESTS) assert.equal(npcAnywhere(qd.npc).map, maps[qd.id], qd.id);
  assert.match(area('fq_vote_host'), /ルミナ/);
  assert.match(area('fq_feast_host'), /ハミル/);
  assert.match(area('fq_dora_host'), /星読み/);
  assert.match(area('fq_fire_host'), /竜守り/);
  assert.match(area('fq_fire_pile'), /竜守り/);
  assert.match(area('fq_flower_host'), /ホシフル/);
  assert.match(area('fq_flower_box'), /ホシフル/);
  for (const id of ['fq_kappa_host', 'fq_kappa_v1', 'fq_kappa_v2', 'fq_kappa_v3']) assert.match(area(id), /鏡の湖/, id);
  for (const m of Object.values(MAPS)) if (m.id.includes('past') || m.id.startsWith('c7')) assert.ok(!m.npcs.some((n) => WORK3_NPC_IDS.includes(n.id)), m.id);
  // カリムの 前は 町に 出ない・話しても 受けられない
  for (const id of WORK3_NPC_IDS) {
    const at = npcAnywhere(id);
    assert.ok(at, id);
    assert.equal(condOk(at.n.show, (f) => CLEAR.includes(f)), false, `${id} は カリムの 前は 出ない`);
    assert.equal(condOk(at.n.show, (f) => OPEN.includes(f)), true, `${id} は カリムの あとに 出る`);
    assert.ok(SCRIPTS[at.n.script], `${id} の だいほん`);
  }
  const pre = { flag: (f) => CLEAR.includes(f), has: () => false, count: () => 0, night: false, name: 'ソラ', c: { job: 'career' } };
  for (const qd of WORK3_QUESTS) assert.ok(!JSON.stringify(SCRIPTS[qd.npc](pre)).includes('"choice"'), `${qd.id} は 受けられない`);
  assert.deepEqual(workSubQuests3({ flags: {} }, () => false, () => false), []);
  for (const id of Object.keys(WORK3_SCRIPTS)) assert.equal(SCRIPTS[id], WORK3_SCRIPTS[id], id);
  for (const id of WORK3_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id), id);
  // 人は 立てる 所（物は かたい NPC か 見えない しらべる 所）・人の 絵・物の 絵
  for (const id of WORK3_NPC_IDS) {
    const { map, n } = npcAnywhere(id);
    assert.ok(!isBlocked(MAPS[map], Math.floor(n.x), Math.floor(n.y), () => true) || n.solid || n.sprite === 'none', `${id} の 場所`);
    if (n.sprite.startsWith('mon:')) assert.ok(MONSTER_ART[n.sprite.slice(4)], `${id} の 絵`);
    else if (n.sprite !== 'none') assert.ok(npcOpts(n.sprite), `${id} の みため`);
  }
  // 星読みの里は 人の 絵だけ（第5章の きまり。けいこづくえの 引き出しは 師しょうと 開ける）
  for (const n of MAPS.hoshiyomi.npcs) if (WORK3_NPC_IDS.includes(n.id)) assert.ok(npcOpts(n.sprite), n.id);
});

test('ごほうび: 第64回の きまり（★5の アクセサリーは 2つだけ・乗り物なし）・素材や 道具・ゴールド・小さなメダル・はり紙と 同じ', () => {
  const accs = WORK3_QUESTS.filter((x) => x.reward.item);
  assert.equal(accs.length, 2, '★5は 2つだけ');
  for (const qd of accs) {
    const it = ITEMS[qd.reward.item];
    assert.ok(it && it.type === 'acc' && starsFor(it) === 5 && it.src === 'gift' && !(it.price > 0), qd.id);
    // 闘技場 ランク10 の ブローチ（Lv74）より 弱い
    const sum = (b) => Object.values(b).reduce((s, v) => s + v, 0);
    assert.ok(sum(it.bonus) < sum(ITEMS.ar_star_king_brooch.bonus), qd.id);
  }
  for (const qd of WORK3_QUESTS) {
    const r = qd.reward;
    assert.ok(!r.vehicle, `${qd.id}: 乗り物なし`);
    for (const [id, n] of r.goods || []) assert.ok(ITEMS[id] && ITEMS[id].type !== 'key' && !['weapon', 'armor', 'shield', 'head', 'acc'].includes(ITEMS[id].type) && n > 0, `${qd.id}: ${id}`);
    assert.ok(r.gold > 0 && r.medals > 0, qd.id);
    const text = boardPage({ flag: () => false }, qd).map((st) => st[2]).join('\n');
    assert.ok(text.includes(qd.paper) && text.includes(qd.who) && text.includes(`${r.gold}ゴールド`) && text.includes(`小さなメダル${r.medals}まい`), qd.id);
    for (const name of rewardNames(r)) assert.ok(text.includes(name), `${qd.id}: ${name}`);
    const info = boardInfo({ flag: () => false, c: { job: qd.legend } }, qd);
    assert.ok(info.includes('（○いる）') && info.split('\n').length === 3, `${qd.id}: ${info}`);
  }
});

// ───── 18. 広場会議 ─────
test('ルミナの町の、みんなの広場会議: 3人のねがい → 会議の始め方・広場の使いみち・知らせ方（やり直し）→ ごほうび。キャリア組がいないとまとめられない', async () => {
  const { bot, c } = await setup(681, { job: 'warrior', flags: OPEN });
  const qd = W.souri;
  await talkTo(bot, 'fq_vote_host', [0]);
  assert.ok(c.flags[WQ3.voteStart]);
  assert.equal(q(c, qd.name).find, 'fq_vote_v1');
  let msgs = await talkTo(bot, 'fq_vote_host');
  assert.ok(said(msgs, /今0人/));
  for (const id of ['fq_vote_v1', 'fq_vote_v2', 'fq_vote_v3']) await talkTo(bot, id);
  assert.ok(VOTE_VOICES.every((k) => c.flags[k]) && q(c, qd.name).ready);
  const ans = VOTE_PLAN.map((x) => x.ans);
  msgs = await talkTo(bot, 'fq_vote_host', ans);
  assert.ok(said(msgs, /キャリア組の人が、パーティーに/) && !c.flags[VOTE_PLANS[0]]);
  c.job = 'souri'; // キャリア組 → 総理大臣
  msgs = await talkTo(bot, 'fq_vote_host', [wrong(ans[0])]);
  assert.ok(!c.flags[VOTE_PLANS[0]] && said(msgs, /ぐう…/) && said(msgs, /もう一度、みんなのねがい/), '1つ目の まちがい');
  msgs = await talkTo(bot, 'fq_vote_host', [ans[0], wrong(ans[1])]);
  assert.ok(c.flags[VOTE_PLANS[0]] && !c.flags[VOTE_PLANS[1]], '2つ目で まちがい（1つ目は 決まったまま）');
  await rewarded(c, qd, () => talkTo(bot, 'fq_vote_host', c.flags[qd.done] ? [] : ans.slice(1)));
});

// ───── 19. けっこん式の ごちそう ─────
test('オアシスの村の、けっこん式のごちそう: お客さん3人の話 → 3つの料理（やり直し）→ けっこん式 → ごほうび。三ツ星シェフがいないと作れない', async () => {
  const { bot, c } = await setup(682, { job: 'priest', flags: OPEN });
  const qd = W.chef;
  await talkTo(bot, 'fq_feast_host', [0]);
  assert.ok(c.flags[WQ3.feastStart]);
  assert.equal(q(c, qd.name).find, 'fq_feast_v1');
  for (const id of ['fq_feast_v1', 'fq_feast_v2', 'fq_feast_v3']) await talkTo(bot, id);
  assert.ok(FEAST_GUESTS.every((k) => c.flags[k]) && q(c, qd.name).ready);
  const ans = FEAST_MENU.map((x) => x.ans);
  let msgs = await talkTo(bot, 'fq_feast_host', ans);
  assert.ok(said(msgs, /三ツ星シェフの人が、パーティーに/) && !c.flags[FEAST_DISHES[0]]);
  c.job = 'five_star_chef'; // 三ツ星シェフ → 五つ星シェフ
  msgs = await talkTo(bot, 'fq_feast_host', [ans[0], ans[1], wrong(ans[2])]);
  assert.ok(c.flags[FEAST_DISHES[1]] && !c.flags[FEAST_DISHES[2]] && said(msgs, /もう一度、思い出して/), '3つ目で まちがい');
  await rewarded(c, qd, () => talkTo(bot, 'fq_feast_host', c.flags[qd.done] ? [] : [ans[2]]));
});

// ───── 20. ドジな見習い ─────
test('星読みの里の、ドジな見習い: 師しょうと引き出し（ゆがみの精）・里の人の話 → ひみつ道具3つ（やり直し）→ テスト → ごほうび。ネコ型ロボットがいないと道具が出せない', async () => {
  const { bot, c } = await setup(683, { job: 'mage', flags: OPEN });
  const qd = W.dora;
  await talkTo(bot, 'fq_dora_host', [0]);
  assert.ok(c.flags[WQ3.doraStart]);
  assert.equal(q(c, qd.name).find, 'fq_dora_teacher');
  let msgs = await talkTo(bot, 'fq_dora_teacher');
  assert.ok(battled(msgs, 'fq_warp') && c.flags[WQ3.doraDesk], 'ゆがみの精と 戦った（だれでも）');
  msgs = await talkTo(bot, 'fq_dora_teacher');
  assert.ok(!battled(msgs, 'fq_warp'), '2回目は 戦わない');
  assert.equal(q(c, qd.name).find, 'fq_dora_v1');
  for (const id of ['fq_dora_v1', 'fq_dora_v2', 'fq_dora_v3']) await talkTo(bot, id);
  assert.ok(DORA_VOICES.every((k) => c.flags[k]) && q(c, qd.name).ready);
  const ans = DORA_PLAN.map((x) => x.ans);
  msgs = await talkTo(bot, 'fq_dora_host', ans);
  assert.ok(said(msgs, /ネコ型ロボットの人が、パーティーに/) && !c.flags[DORA_TOOLS[0]]);
  c.job = 'nobu_dora'; // ネコ型ロボット → … → のぶドラ
  msgs = await talkTo(bot, 'fq_dora_host', [ans[0], wrong(ans[1])]);
  assert.ok(c.flags[DORA_TOOLS[0]] && !c.flags[DORA_TOOLS[1]] && said(msgs, /ちがう道具/), '2つ目で まちがい');
  await rewarded(c, qd, () => talkTo(bot, 'fq_dora_host', c.flags[qd.done] ? [] : ans.slice(1)));
  assert.ok(said(await talkTo(bot, 'fq_dora_v2'), /言葉、分かりますか/), 'すんだら 旅人の 言葉が 分かる');
});

// ───── 21. くしゃみ火事 ─────
test('竜守りの村の、くしゃみ火事: まきおき場（火こぞう・ひのこネズミ）・子竜と火の番の話 → 火消しのじゅんばん（やり直し）→ 火が消える → ごほうび。消防士がいないと消せない', async () => {
  const { bot, c } = await setup(684, { job: 'warrior', flags: OPEN });
  const qd = W.fire;
  await talkTo(bot, 'fq_fire_host', [0]);
  assert.ok(c.flags[WQ3.fireStart]);
  assert.equal(q(c, qd.name).find, 'fq_fire_pile');
  let msgs = await talkTo(bot, 'fq_fire_pile');
  assert.ok(battled(msgs, 'fq_blaze') && c.flags[WQ3.fireBurn], 'ほのおの 魔物と 戦った（だれでも）');
  for (const id of ['fq_fire_v1', 'fq_fire_v2']) await talkTo(bot, id);
  assert.ok(FIRE_VOICES.every((k) => c.flags[k]));
  assert.equal(q(c, qd.name).find, 'fq_fire_pile');
  const ans = FIRE_PLAN.map((x) => x.ans);
  msgs = await talkTo(bot, 'fq_fire_pile', ans);
  assert.ok(!battled(msgs, 'fq_blaze') && said(msgs, /消防士の人が、パーティーに/) && !c.flags[FIRE_STEPS[0]]);
  c.job = 'hikeshi_god'; // 消防士 → ハイパーレスキュー → 火消しの神
  msgs = await talkTo(bot, 'fq_fire_pile', [wrong(ans[0])]);
  assert.ok(!c.flags[FIRE_STEPS[0]] && said(msgs, /村の人の話を、思い出そう/), 'さいしょの まちがい');
  msgs = await talkTo(bot, 'fq_fire_pile', [ans[0], wrong(ans[1])]);
  assert.ok(c.flags[FIRE_STEPS[0]] && !c.flags[FIRE_STEPS[1]] && !c.flags[WQ3.fireOut], '水の かけ方の まちがい');
  assert.ok(shows('fq_fire_pile', c));
  await talkTo(bot, 'fq_fire_pile', [ans[1], ans[2]]);
  assert.ok(c.flags[WQ3.fireOut] && !shows('fq_fire_pile', c), '火が 消えて まきおき場が かたづいた');
  assert.ok(q(c, qd.name).ready && q(c, qd.name).who === 'fq_fire_host');
  await rewarded(c, qd, () => talkTo(bot, 'fq_fire_host'));
});

// ───── 22. 思い出の花畑 ─────
test('ホシフル村の、思い出の花畑: 古い宝箱（ひとくい箱）・むかしの話 → 魔法・花・場所（やり直し）→ 花畑 → ごほうび。大賢者がいないと出せない', async () => {
  const { bot, c } = await setup(685, { job: 'monk', flags: OPEN });
  const qd = W.flower;
  await talkTo(bot, 'fq_flower_host', [0]);
  assert.ok(c.flags[WQ3.flowerStart]);
  assert.equal(q(c, qd.name).find, 'fq_flower_box');
  assert.ok(shows('fq_flower_box', c));
  const msgs0 = await talkTo(bot, 'fq_flower_box');
  assert.ok(battled(msgs0, 'fq_mimic') && c.flags[WQ3.flowerBox] && said(msgs0, /旅の魔法使いより/), 'ひとくい箱と 戦って 手紙（だれでも）');
  assert.ok(!shows('fq_flower_box', c), '宝箱は にげた');
  for (const id of ['fq_flower_v1', 'fq_flower_v2']) await talkTo(bot, id);
  assert.ok(FLOWER_VOICES.every((k) => c.flags[k]) && q(c, qd.name).ready);
  const ans = FLOWER_PLAN.map((x) => x.ans);
  let msgs = await talkTo(bot, 'fq_flower_host', ans);
  assert.ok(said(msgs, /大賢者の人が、パーティーに/) && !c.flags[FLOWER_SPELLS[0]]);
  c.job = 'sennen_mage'; // 大賢者 → 千年の大魔法使い
  msgs = await talkTo(bot, 'fq_flower_host', [wrong(ans[0])]);
  assert.ok(!c.flags[FLOWER_SPELLS[0]] && said(msgs, /ちがうみたい/));
  await rewarded(c, qd, () => talkTo(bot, 'fq_flower_host', c.flags[qd.done] ? [] : ans));
});

// ───── 23. かっぱずもう ─────
test('鏡の湖のかっぱずもう: すもうのこつ3つ → 食べ物・あいさつ・ふんばり（やり直し）→ 大一番 → ごほうび。カッパがいないと教えられない', async () => {
  const { bot, c } = await setup(686, { job: 'warrior', flags: OPEN });
  const qd = W.kappa;
  await talkTo(bot, 'fq_kappa_host', [0]);
  assert.ok(c.flags[WQ3.kappaStart]);
  assert.equal(q(c, qd.name).find, 'fq_kappa_v1');
  for (const id of ['fq_kappa_v1', 'fq_kappa_v2', 'fq_kappa_v3']) await talkTo(bot, id);
  assert.ok(KAPPA_VOICES.every((k) => c.flags[k]) && q(c, qd.name).ready);
  const ans = KAPPA_PLAN.map((x) => x.ans);
  let msgs = await talkTo(bot, 'fq_kappa_host', ans);
  assert.ok(said(msgs, /カッパの人が、パーティーに/) && !c.flags[KAPPA_TIPS[0]]);
  c.job = 'kappa_king'; // カッパ → … → かっぱの大王
  msgs = await talkTo(bot, 'fq_kappa_host', [ans[0], ans[1], wrong(ans[2])]);
  assert.ok(c.flags[KAPPA_TIPS[1]] && !c.flags[KAPPA_TIPS[2]] && said(msgs, /あきらめたら/), '3つ目で まちがい');
  await rewarded(c, qd, () => talkTo(bot, 'fq_kappa_host', c.flags[qd.done] ? [] : [ans[2]]));
});

// ───── 地図の しるし・ヒント・困っている人 ─────
test('受けた たのまれごとは クエストの 画面・地図の しるし・「はなす」の ヒント。困っている人は カリムの あとから', () => {
  const all = { flags: Object.fromEntries([...OPEN, ...WORK3_QUESTS.map((x) => x.start)].map((f) => [f, true])), items: [], keyItems: [] };
  const list = subQuests(all).filter((x) => WORK3_QUESTS.some((w) => w.name === x.name));
  assert.equal(list.length, 6);
  for (const x of list) {
    assert.ok(npcAnywhere(x.who), `${x.name}: ${x.who}`);
    if (x.find) assert.ok(npcAnywhere(x.find), `${x.name}: ${x.find}`);
    assert.ok(x.text && x.hint, x.name);
    assert.deepEqual(checkText(x.text + x.hint).filter((p) => p.kind !== 'kana'), [], x.name);
  }
  for (const qd of WORK3_QUESTS) {
    const map = npcAnywhere(qd.npc).map;
    assert.ok(questMarks(all, map, '').some((m) => m.label === qd.name), `${qd.id}: 地図の しるし`);
    const h = subQuestHint(`fq_${qd.id}`);
    assert.ok(h && h.board && h.npc === qd.npc && h.roots === qd.roots && h.open.includes('c7_karim'), `${qd.id}: 困っている人`);
  }
  assert.ok(WORK3_QUESTS.some((qd) => sideQuestHint(all).includes(qd.name)), '「はなす」の ヒント');
  assert.ok(!availableSubQuests(all).some((h) => WORK3_QUESTS.some((qd) => h.id === `fq_${qd.id}`)), '受けたら 困っている人から 消える');
  const ids = (c) => availableSubQuests(c).filter((h) => h.board).map((h) => h.id);
  assert.equal(ids({ flags: { c5_clear: true } }).length, 17, 'カリムの 前は 17');
  assert.ok(!ids({ flags: { c5_clear: true } }).some((id) => WORK3_QUESTS.some((qd) => id === `fq_${qd.id}`)));
  assert.equal(ids({ flags: { c5_clear: true, c7_karim: true } }).length, 23, 'カリムの あとは 23');
});

// ───── お仕事いらい板: 23まい・4ページ ─────
test('お仕事いらい板: カリムの 前は 17まい（3ページ）・あとは 23まい（4ページ）。4ページ目の はり紙を 読んで 受けると 地図に しるし', async () => {
  const before = { flag: (k) => CLEAR.includes(k) };
  const after = { flag: (k) => OPEN.includes(k) };
  assert.equal(boardList(before).length, 17);
  assert.equal(boardPages(before), 3);
  assert.equal(boardList(after).length, 23);
  assert.equal(boardPages(after), 4);
  assert.equal(boardPages(), 6); // 第73回: ぜんぶ（26まい）は 5ページ・第74回: 29まいでも 5ページ・第75回: 32まいで 6ページ
  // カリムの 前の 板（3ページ・18〜23 は ない）
  {
    const { bot } = await setup(687);
    const msgs = await talkTo(bot, 'fq_board', [6, 6, 8]);
    const menus = msgs.filter((m) => m.t === 'script' && m.steps.at(-1)?.[0] === 'choice').map((m) => m.steps.at(-1));
    assert.ok(said(msgs, /はり紙は17まい/));
    assert.match(menus[2][1], /3\/3ページ/);
    assert.deepEqual(menus[2][2], [...FAMILY_QUESTS.slice(12, 17).map((x) => x.name), '前のページへ', 'やめる']);
  }
  const { bot, c } = await setup(688, { flags: OPEN });
  const qd = W.fire;
  const map = npcAnywhere(qd.npc).map;
  const marked = () => questMarks(c, map, '').some((m) => m.label === qd.name);
  assert.ok(!marked() && !q(c, qd.name));
  // 1→2→3→4ページ（つぎ 6・6・6）→ 4ページ目の 3まい目（火事。2）→ 読む →「うける？」はい（0）→ 4ページ目に もどる → やめる（6）
  const msgs = await talkTo(bot, 'fq_board', [6, 6, 6, 2, 0, 6]);
  const menus = msgs.filter((m) => m.t === 'script' && m.steps.at(-1)?.[0] === 'choice').map((m) => m.steps.at(-1));
  assert.ok(said(msgs, /はり紙は23まい/));
  assert.match(menus[2][1], /3\/4ページ/);
  assert.deepEqual(menus[2][2], [...FAMILY_QUESTS.slice(12, 18).map((x) => x.name), 'つぎのページへ', '前のページへ', 'やめる']);
  assert.match(menus[3][1], /4\/4ページ/);
  assert.deepEqual(menus[3][2], [...FAMILY_QUESTS.slice(18, 23).map((x) => x.name), '前のページへ', 'やめる']);
  assert.equal(menus[3][3].length, menus[3][2].length, 'カーソルの せつめいも 同じ 数');
  assert.match(menus[3][3][2], /^必要な職業：消防士の系統（×いない）/);
  assert.ok(said(msgs, /子竜がくしゃみをしたら/) && said(msgs, /このいらいを、うける？/) && said(msgs, /を受けた！/));
  assert.ok(c.flags[takeFlag(qd)] && !c.flags[qd.start]);
  assert.match(menus[5][1], /4\/4ページ/, '読んだら 4ページ目に もどる');
  assert.equal(menus[5][2][2], `${qd.name}（受けている）`);
  const e = q(c, qd.name);
  assert.ok(e && e.who === qd.npc && /タツジに会おう/.test(e.text) && e.hint.includes(qd.where), 'クエストの 画面');
  assert.ok(marked(), '受けたら 地図に しるし');
  // 会って 受けると ふつうの 続き
  await talkTo(bot, qd.npc, [0]);
  assert.ok(c.flags[qd.start] && q(c, qd.name).find === 'fq_fire_pile');
  // やめる
  const m2 = await talkTo(bot, 'fq_board', [6, 6, 6, 2, 0, 6]);
  assert.ok(said(m2, /をやめた/) && !c.flags[takeFlag(qd)] && !c.flags[qd.start] && !marked());
  assert.ok(!bot.s.busy);
});

// ───── 戦いの 強さ ─────
test('戦い: 新しい 3つ（敵Lv76）は お話の ころ（Lv74〜77）の 4人・2人・戦士ひとりでも 完全オートで 勝てる（ボスほど強くない）', () => {
  for (const id of ['fq_warp', 'fq_blaze', 'fq_mimic']) {
    const e = FIXED_ENCOUNTERS[id];
    assert.ok(e && !e.boss && e.canFlee === false && e.enemyLv === 76 && !(e.enemyPow > 1), id);
    for (const [sp] of e.group) assert.ok(MONSTER_ART[sp], `${sp} の 絵`);
    for (const jobs of [['warrior', 'priest', 'mage', 'monk'], ['warrior', 'priest'], ['warrior']]) {
      let win = 0;
      for (let i = 0; i < 6; i++) {
        const lv = 74 + (i % 4);
        const party = jobs.map((j, k) => makeChar(j, lv, 10, `p${k}`, 58));
        const r = runBattle(party, e.group.flatMap(([sp, n]) => Array(n).fill(sp)), { seed: 68 + i * 7919, enemyLv: e.enemyLv, enemyPow: e.enemyPow });
        if (r.outcome === 'win') win++;
      }
      assert.equal(win, 6, `${id} ${jobs.join('・')} 勝ち ${win}/6`);
    }
  }
});

// ───── 漢字 ─────
test('漢字: 新しい ファイルは gameFiles() に 入っていて、使えない 漢字・スペースが ない', () => {
  const files = ['shared/data/sidequests-work3.js', 'shared/maps/work-quests3.js', 'client/render/work3-art.js'].map((f) => gameFiles().find((g) => g.endsWith('/public/js/' + f)));
  assert.ok(files.every(Boolean), 'gameFiles() に 入っている');
  const bad = [];
  for (const f of files) for (const p of checkFile(f)) if (p.kind !== 'kana') bad.push(`${f.split('/').pop()}:${p.line} [${p.kind} ${p.detail}] ${p.text}`);
  assert.deepEqual(bad, []);
  for (const qd of WORK3_QUESTS) for (const t of [qd.name, qd.paper, qd.who, qd.where, qd.job]) assert.deepEqual(checkText(t).filter((p) => p.kind !== 'kana'), [], t);
  for (const id of ['fq_fushigi_pocket', 'fq_flower_pin']) assert.deepEqual(checkText(ITEMS[id].name + ITEMS[id].desc).filter((p) => p.kind !== 'kana'), [], id);
});
