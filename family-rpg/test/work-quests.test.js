// 第41回: お仕事いらい板を ふやす（docs/plan-side.md の 6・7）
// 6. 砂の港ドゥナの歌のステージ（アイドル）・7. オアシスの村の、こわれた橋（地方公務員）・8. カモメ港の子ども野球チーム（プロ野球選手）・
// 9. ハネノの町の名物動画（ユーチューバー）・10. 湯けむり宿の大そうじ（おかん）・11. 王都のお祭りの手品ショー（手品師）
// 受けて → すすめて → ごほうび・職業の しばり（いる／いない）・まちがえても やり直せる・ごほうびは 1回だけ・
// 第1部クリアの 前は 出ない・今の 時代の 町だけ・お仕事いらい板の 2ページ目・軽い 戦いの 強さ
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, isBlocked, effectiveTile, condOk } from '../public/js/shared/maps/index.js';
import { T } from '../public/js/shared/tiles.js';
import { SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { JOBS, jobAncestry } from '../public/js/shared/data/jobs.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { VEHICLES } from '../public/js/shared/data/vehicles.js';
import { FAMILY_QUESTS, boardPage, BOARD_PAGE, boardPages } from '../public/js/shared/data/sidequests-family.js';
import {
  WORK_QUESTS, WORK_SCRIPTS, workSubQuests, STAGE_SONGS, STAGE_SONG_ANSWER, STAGE_ENDS, STAGE_END_ANSWER, BRIDGE_QUIZ, BALL_MENU, BALL_PLAY_ANSWER,
  VIDEO_PARTS, INN_CHORES, INN_MENU_ANSWER, MAGIC_TRICKS, MAGIC_ORDER, MAGIC_SECRET_ANSWER,
} from '../public/js/shared/data/sidequests-work.js';
import { jobLine } from '../public/js/shared/data/fq-common.js';
import { labDoneQuests } from '../public/js/shared/data/sidequests.js';
import { subQuests } from '../public/js/shared/data/quest-targets.js';
import {
  WQ, STAGE_VOICES, BRIDGE_VOICES, BALL_KIDS, BALL_PRACTICE, VIDEO_SPOTS, VIDEO_STEPS, INN_CLEAN, INN_KIDS, BRIDGE_TILES, INN_STAIRS,
} from '../public/js/shared/maps/work-quests.js';
import { itemCount } from '../public/js/shared/stats.js';
import { medalsFound } from '../public/js/shared/data/casino.js';
import { makeChar, runBattle } from '../tools/sim.js';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { setup, npcAnywhere, talkTo, said, battled } from './fq-helpers.js';

const q = (c, name) => subQuests(c).find((x) => x.name === name);
const NEED = /の人が、パーティーにいてくれたら/;
const W = Object.fromEntries(WORK_QUESTS.map((x) => [x.id, x]));
// まちがいの 番号（正かいで ない 1つ目）
const wrong = (ans) => (ans === 0 ? 1 : 0);

// ごほうびを もらった（★5の アクセサリー・乗り物・ゴールド・小さなメダル・クエストの 画面から 消える）。もう 1回 話しても ふえない
async function rewarded(bot, c, qd, talk) {
  const gold0 = c.gold, medals0 = medalsFound(c);
  await talk();
  assert.ok(c.flags[qd.done], `${qd.id}: すんだ`);
  assert.equal(itemCount(c, qd.reward.item), 1, `${qd.id}: ${qd.reward.item}`);
  assert.ok(c.vehicles.includes(qd.reward.vehicle), `${qd.id}: ${qd.reward.vehicle}`);
  assert.equal(c.gold, gold0 + qd.reward.gold, `${qd.id}: ゴールド`);
  assert.equal(medalsFound(c), medals0 + qd.reward.medals, `${qd.id}: メダル`);
  assert.ok(labDoneQuests(c).includes(qd.name) && !q(c, qd.name), `${qd.id}: クエストの 画面`);
  await talk();
  assert.equal(itemCount(c, qd.reward.item), 1, `${qd.id}: 1回だけ`);
  assert.equal(c.gold, gold0 + qd.reward.gold, `${qd.id}: ゴールドも 1回だけ`);
  assert.equal(medalsFound(c), medals0 + qd.reward.medals, `${qd.id}: メダルも 1回だけ`);
}

// ───── しくみ ─────
test('しくみ: 6つの 新しい たのまれごと・職業の系統（転職の つながりから）・今の 時代の 町だけ・第1部クリアの あとだけ', () => {
  assert.equal(WORK_QUESTS.length, 6);
  assert.deepEqual(FAMILY_QUESTS.slice(5), WORK_QUESTS);
  assert.deepEqual(WORK_QUESTS.map((x) => x.roots[0]), ['idol', 'civil_local', 'ballplayer', 'youtuber', 'okan', 'magician']);
  for (const qd of WORK_QUESTS) {
    const L = jobLine(qd.roots);
    for (const id of Object.keys(JOBS)) assert.equal(L.has(id), qd.roots.some((r) => jobAncestry(id).has(r)), `${qd.id} ${id}`);
    assert.ok(ITEMS[qd.reward.item]?.type === 'acc' && VEHICLES[qd.reward.vehicle]?.gift, qd.id);
    assert.ok(!qd.name.includes('家族の'), qd.name);
  }
  assert.ok(jobLine(['idol']).has('superstar') && jobLine(['okan']).has('saikyo_okan') && jobLine(['magician']).has('kaito'));
  // 町（今の 時代の マップ。千年前の マップには いない）
  const maps = { stage: 'duna', bridge: 'south', ball: 'sea', video: 'hanono', inn: 'fq_inn2', magic: 'south' };
  const who = { stage: 'fq_stage_boss', bridge: 'fq_bridge_officer', ball: 'fq_ball_cap', video: 'fq_video_guide', inn: 'fq_inn_okami', magic: 'fq_magic_host' };
  const area = (id) => { const { map, n } = npcAnywhere(id); return MAPS[map].areaName?.(Math.floor(n.x), Math.floor(n.y)) || MAPS[map].name; };
  for (const qd of WORK_QUESTS) {
    const at = npcAnywhere(who[qd.id]);
    assert.equal(at.map, maps[qd.id], qd.id);
    assert.ok(!at.map.includes('past'), qd.id);
  }
  assert.match(area('fq_stage_boss'), /ドゥナ/);
  assert.match(area('fq_bridge_officer'), /ハミル/);
  assert.match(area('fq_ball_cap'), /カモメ港|風の海/);
  assert.match(area('fq_video_guide'), /ハネノ/);
  assert.match(area('fq_magic_host'), /サファラ/);
  for (const m of Object.values(MAPS)) if (m.id.includes('past')) assert.ok(!m.npcs.some((n) => /^fq_(stage|bridge|ball|video|inn|magic)/.test(n.id)), m.id);
  // 第1部クリアの 前は 町に 出ない・中の 人に 話しても 受けられない
  const none = () => false;
  for (const id of ['fq_stage_boss', 'fq_bridge_officer', 'fq_ball_cap', 'fq_video_guide', 'fq_magic_host', 'fq_magic_man', 'fq_stage_v1', 'fq_bridge_v1']) {
    const at = npcAnywhere(id);
    assert.equal(condOk(at.n.show, none), false, `${id} は 第1部クリアの 前は 出ない`);
    assert.equal(condOk(at.n.show, (f) => f === 'c5_clear'), true, `${id} は 第1部クリアの あと 出る`);
  }
  const pre = { flag: () => false, has: () => false, count: () => 0, night: false, name: 'ソラ', c: { job: 'idol' } };
  for (const id of ['fq_stage_boss', 'fq_bridge_officer', 'fq_ball_cap', 'fq_video_guide', 'fq_inn_okami', 'fq_magic_host']) {
    assert.ok(!JSON.stringify(SCRIPTS[id](pre)).includes('"choice"'), `${id} は 受けられない`);
  }
  assert.deepEqual(workSubQuests({ flags: {} }, () => false, () => false), []);
  // ぜんぶ 受けると 6つ ならぶ。報告する 人・さがす 物は 地図に ある（地図の しるし）
  const all = { flags: Object.fromEntries(['c5_clear', ...WORK_QUESTS.map((x) => x.start)].map((f) => [f, true])), items: [], keyItems: [] };
  const list = subQuests(all).filter((x) => WORK_QUESTS.some((w) => w.name === x.name));
  assert.equal(list.length, 6);
  for (const x of list) {
    assert.ok(npcAnywhere(x.who), `${x.name}: ${x.who}`);
    if (x.find) assert.ok(npcAnywhere(x.find), `${x.name}: ${x.find}`);
    assert.ok(x.text && x.hint, x.name);
  }
  // だいほんは story.js に まざる。戦いは パーティーみんなで 見る
  for (const id of Object.keys(WORK_SCRIPTS)) assert.equal(SCRIPTS[id], WORK_SCRIPTS[id], id);
  for (const id of ['fq_bridge_broken', 'fq_inn_closet']) assert.ok(STORY_SCRIPTS.has(id), id);
});

test('マップ: ユノハの宿屋の2階（階だんで行き来）・ハミルの池のこわれた橋（直すと わたれる）・人は立てる所', () => {
  const north = MAPS.north;
  assert.equal(north.tiles[INN_STAIRS.y * north.w + INN_STAIRS.x], T.STAIRS_UP, '宿屋の 1階の 上り階だん');
  assert.equal(MAPS.north.areaName(INN_STAIRS.x, INN_STAIRS.y).includes('ユノハ'), true);
  const m = MAPS.fq_inn2;
  assert.ok(m && Object.keys(m.spawnCounts).length === 0);
  for (const w of [...m.warps, ...north.warps.filter((x) => x.to.map === 'fq_inn2')]) {
    const to = MAPS[w.to.map];
    assert.ok(!isBlocked(to, Math.floor(w.to.x), Math.floor(w.to.y), () => true), `${w.to.map} ${w.to.x},${w.to.y}`);
    assert.ok(!to.warpAt.has(Math.floor(w.to.y) * to.w + Math.floor(w.to.x)), `${w.to.map}: 着いた所が また 出入り口`);
  }
  // 橋: 第1部クリアの あとは こわれた 橋（通れない）・直すと ふつうの 橋。その 前は 今までの まま（第4章で 水が もどる 池）
  const south = MAPS.south;
  const oasis = (f) => f === 'c4_scorpion' || f === 'c5_clear';
  for (const b of BRIDGE_TILES) {
    assert.equal(effectiveTile(south, b.x, b.y, oasis), T.BROKEN_BRIDGE);
    assert.equal(effectiveTile(south, b.x, b.y, (f) => oasis(f) || f === WQ.bridgeBuilt), T.BRIDGE_H);
    assert.ok(isBlocked(south, b.x, b.y, oasis) && !isBlocked(south, b.x, b.y, (f) => oasis(f) || f === WQ.bridgeBuilt));
    assert.ok([T.DIRT, T.WATER].includes(effectiveTile(south, b.x, b.y, () => false)), '第4章の とちゅうは 今までの 池');
    assert.equal(effectiveTile(south, b.x, b.y, (f) => f === 'c4_scorpion'), T.WATER, '水が もどった 池（第1部クリアの 前）');
  }
  // 橋の 両はしは 岸（池の 外に 出られる）
  assert.ok(!isBlocked(south, BRIDGE_TILES[0].x - 1, 37, oasis) && !isBlocked(south, BRIDGE_TILES.at(-1).x + 1, 37, oasis));
  // 人は 立てる 所（かべや 水の 上の 物は かたい NPC か 見えない しらべる 所）
  for (const mm of Object.values(MAPS)) {
    for (const n of mm.npcs) {
      if (!/^fq_(stage|bridge|ball|video|inn|magic)/.test(n.id)) continue;
      assert.ok(SCRIPTS[n.script], `${n.id} の だいほん`);
      assert.ok(!isBlocked(mm, Math.floor(n.x), Math.floor(n.y), () => true) || n.solid || n.sprite === 'none', `${n.id} の 場所`);
    }
  }
});

// ───── 6. 歌の ステージ ─────
test('砂の港ドゥナの歌のステージ: そうじ・衣装・町の人の声 → 歌をえらぶ（まちがえてもやり直し）→ さいごの歌（やり直し）→ ごほうび。アイドルがいないと歌えない', async () => {
  const { bot, c } = await setup(411, { job: 'warrior' });
  const qd = W.stage;
  let msgs = await talkTo(bot, 'fq_stage_boss', [0]);
  assert.ok(c.flags[WQ.stageStart] && said(msgs, /歌とおどりのとくいな人/));
  assert.equal(q(c, qd.name).find, 'fq_stage_dusty');
  await talkTo(bot, 'fq_stage_dusty', [0]);
  assert.ok(c.flags[WQ.stageClean], 'ステージの 砂は だれでも はらえる');
  assert.ok(condOk(npcAnywhere('fq_stage_clean').n.show, (f) => !!c.flags[f]) && !condOk(npcAnywhere('fq_stage_dusty').n.show, (f) => !!c.flags[f]));
  assert.equal(q(c, qd.name).find, 'fq_stage_tailor');
  await talkTo(bot, 'fq_stage_tailor');
  assert.ok(c.keyItems.includes('fq_dress'));
  msgs = await talkTo(bot, 'fq_stage_boss');
  assert.ok(said(msgs, /町の人の声（今は0人）/));
  for (const id of ['fq_stage_v1', 'fq_stage_v2', 'fq_stage_v3']) await talkTo(bot, id);
  assert.ok(STAGE_VOICES.every((k) => c.flags[k]) && q(c, qd.name).ready);
  // アイドルの 系統が いないと 歌えない
  msgs = await talkTo(bot, 'fq_stage_boss', [STAGE_SONG_ANSWER, STAGE_END_ANSWER]);
  assert.ok(said(msgs, /アイドルの人が、パーティーに/) && !c.flags[WQ.stageSong]);
  c.job = 'superstar'; // アイドル → スーパースター
  // 歌の まちがい → やり直し
  msgs = await talkTo(bot, 'fq_stage_boss', [wrong(STAGE_SONG_ANSWER)]);
  assert.ok(!c.flags[WQ.stageSong] && said(msgs, /もう一度ステージに立って/), STAGE_SONGS[wrong(STAGE_SONG_ANSWER)]);
  // 歌は 正かい・さいごの 歌で まちがい → 歌は おぼえていて、さいごの 歌から
  msgs = await talkTo(bot, 'fq_stage_boss', [STAGE_SONG_ANSWER, wrong(STAGE_END_ANSWER)]);
  assert.ok(c.flags[WQ.stageSong] && !c.flags[qd.done] && said(msgs, /もう一度ステージに立って/), STAGE_ENDS[wrong(STAGE_END_ANSWER)]);
  await rewarded(bot, c, qd, async () => {
    msgs = await talkTo(bot, 'fq_stage_boss', [STAGE_END_ANSWER]);
  });
  assert.ok(!c.keyItems.includes('fq_dress'), '衣装は かえす');
  assert.ok(condOk(npcAnywhere('fq_stage_fan1').n.show, (f) => !!c.flags[f]), '広場に お客さん');
});

// ───── 7. こわれた 橋 ─────
test('オアシスの村の、こわれた橋: 橋を調べる（砂ガニ）・村の人の声 → 手続き3つ（まちがえてもやり直し）→ 橋ができる → ごほうび。地方公務員がいないと手続きできない', async () => {
  const { world, bot, c } = await setup(412, { job: 'priest' });
  const qd = W.bridge;
  await talkTo(bot, 'fq_bridge_officer', [0]);
  assert.ok(c.flags[WQ.bridgeStart]);
  assert.equal(q(c, qd.name).find, 'fq_bridge_broken');
  let msgs = await talkTo(bot, 'fq_bridge_broken');
  assert.ok(battled(msgs, 'fq_crab') && c.flags[WQ.bridgeCrab] && c.flags[WQ.bridgeLook], '砂ガニと 戦って 橋を 調べた（だれでも）');
  msgs = await talkTo(bot, 'fq_bridge_broken');
  assert.ok(!battled(msgs, 'fq_crab'), '2回目は 戦わない');
  for (const id of ['fq_bridge_v1', 'fq_bridge_v2', 'fq_bridge_v3']) await talkTo(bot, id);
  assert.ok(BRIDGE_VOICES.every((k) => c.flags[k]) && q(c, qd.name).ready);
  const answers = BRIDGE_QUIZ.map((x) => x.ans);
  msgs = await talkTo(bot, 'fq_bridge_officer', answers);
  assert.ok(said(msgs, /地方公務員の人が、パーティーに/) && !c.flags[WQ.bridgeBuilt]);
  c.job = 'civil_national'; // 地方公務員 → 国家公務員
  // どの 手続きで まちがえても やり直し
  for (let i = 0; i < BRIDGE_QUIZ.length; i++) {
    msgs = await talkTo(bot, 'fq_bridge_officer', [...answers.slice(0, i), wrong(answers[i])]);
    assert.ok(!c.flags[WQ.bridgeBuilt] && said(msgs, /もう一度、考え直して/), `${i + 1}つ目: まちがい`);
  }
  await rewarded(bot, c, qd, async () => {
    await talkTo(bot, 'fq_bridge_officer', c.flags[qd.done] ? [] : answers);
  });
  assert.ok(c.flags[WQ.bridgeBuilt]);
  const has = world.hasFlagFn(bot.s);
  assert.equal(effectiveTile(MAPS.south, BRIDGE_TILES[0].x, BRIDGE_TILES[0].y, has), T.BRIDGE_H, '橋が できた');
  for (const t of BRIDGE_TILES) assert.equal(effectiveTile(MAPS.south, t.x, t.y, has), T.BRIDGE_H);
  assert.ok(!condOk(npcAnywhere('fq_bridge_broken').n.show, (f) => !!c.flags[f]) && condOk(npcAnywhere('fq_bridge_drawer').n.show, (f) => !!c.flags[f]), '水くみの 人が 来る');
  msgs = await talkTo(bot, 'fq_bridge_drawer');
  assert.ok(said(msgs, /すきとおっていて/));
});

// ───── 8. 子ども野球 ─────
test('カモメ港の子ども野球チーム: 3人のなやみ → 練習を決める（まちがえてもやり直し）→ 試合（負けてもやり直し）→ ごほうび。プロ野球選手がいないとコーチできない', async () => {
  const { bot, c } = await setup(413, { job: 'monk' });
  const qd = W.ball;
  await talkTo(bot, 'fq_ball_cap', [0]);
  assert.ok(c.flags[WQ.ballStart]);
  let msgs = await talkTo(bot, 'fq_ball_cap');
  assert.ok(said(msgs, /今は0人/));
  assert.equal(q(c, qd.name).find, 'fq_ball_k1');
  for (const id of ['fq_ball_k1', 'fq_ball_k2', 'fq_ball_k3']) await talkTo(bot, id);
  assert.ok(BALL_KIDS.every((k) => c.flags[k]));
  const menu = BALL_MENU.map((x) => x.ans);
  msgs = await talkTo(bot, 'fq_ball_cap', menu);
  assert.ok(said(msgs, /プロ野球選手の人が、パーティーに/) && !c.flags[WQ.ballPlan]);
  c.job = 'nitoryu'; // プロ野球選手 → メジャーリーガー → 二刀流
  // 2人目で まちがい → 1人目は 決まったまま、2人目から
  msgs = await talkTo(bot, 'fq_ball_cap', [menu[0], wrong(menu[1])]);
  assert.ok(c.flags[BALL_PRACTICE[0]] && !c.flags[BALL_PRACTICE[1]] && said(msgs, /もう一度、考えよう/));
  await talkTo(bot, 'fq_ball_cap', menu.slice(1));
  assert.ok(BALL_PRACTICE.every((k) => c.flags[k]) && c.flags[WQ.ballPlan]);
  // 試合: まちがえると 負け → もう一度
  msgs = await talkTo(bot, 'fq_ball_cap', [wrong(BALL_PLAY_ANSWER)]);
  assert.ok(!c.flags[qd.done] && said(msgs, /負けてしまった/));
  await rewarded(bot, c, qd, async () => {
    msgs = await talkTo(bot, 'fq_ball_cap', [BALL_PLAY_ANSWER]);
  });
});

// ───── 9. 名物動画 ─────
test('ハネノの町の名物動画: 名物を3つさつえい → 動画の組み立て（最初・まん中・最後。まちがえてもやり直し）→ 旅人が来る → ごほうび。ユーチューバーがいないと作れない', async () => {
  const { bot, c } = await setup(414, { job: 'mage' });
  const qd = W.video;
  await talkTo(bot, 'fq_video_guide', [0]);
  assert.ok(c.flags[WQ.videoStart]);
  for (const [i, id] of ['fq_video_view', 'fq_video_candy', 'fq_video_elder'].entries()) {
    assert.equal(q(c, qd.name).find, id);
    await talkTo(bot, id);
    assert.ok(c.flags[VIDEO_SPOTS[i]], id);
  }
  await talkTo(bot, 'fq_video_tip');
  assert.ok(c.flags[WQ.videoTip], '旅の若者の ヒント');
  const parts = VIDEO_PARTS.map((x) => x.ans);
  let msgs = await talkTo(bot, 'fq_video_guide', parts);
  assert.ok(said(msgs, /ユーチューバーの人が、パーティーに/) && !c.flags[VIDEO_STEPS[0]]);
  c.job = 'youtuber';
  msgs = await talkTo(bot, 'fq_video_guide', [wrong(parts[0])]);
  assert.ok(!c.flags[VIDEO_STEPS[0]] && said(msgs, /組み立て直して/), '最初で まちがい');
  msgs = await talkTo(bot, 'fq_video_guide', [parts[0], parts[1], wrong(parts[2])]);
  assert.ok(c.flags[VIDEO_STEPS[1]] && !c.flags[VIDEO_STEPS[2]], '最後で まちがい（まん中までは 決まったまま）');
  await rewarded(bot, c, qd, async () => {
    msgs = await talkTo(bot, 'fq_video_guide', [parts[2]]);
  });
  assert.ok(c.flags[WQ.videoMade] && condOk(npcAnywhere('fq_video_tour1').n.show, (f) => !!c.flags[f]), '旅人が 来る');
});

// ───── 10. 宿の 大そうじ ─────
test('湯けむり宿の大そうじ: まど・コンロ・物置のたな（つららコウモリ）をそうじ（まちがえてもやり直し）・子どもの話 → ごはん（やり直し）→ ごほうび。おかんがいないとそうじできない', async () => {
  const { bot, c } = await setup(415, { job: 'warrior' });
  const qd = W.inn;
  await talkTo(bot, 'fq_inn_okami', [0]);
  assert.ok(c.flags[WQ.innStart]);
  assert.equal(bot.map, 'fq_inn2');
  let msgs = await talkTo(bot, 'fq_inn_window', [INN_CHORES[0].ans]);
  assert.ok(said(msgs, /おかんの人が、パーティーに/) && !c.flags[INN_CLEAN[0]]);
  msgs = await talkTo(bot, 'fq_inn_closet', [INN_CHORES[2].ans]);
  assert.ok(!battled(msgs, 'fq_bat') && !c.flags[WQ.innBat], 'おかんが いないと 物置の たなには 手を 出さない');
  c.job = 'saikyo_okan'; // おかん → 最強のおかん
  for (let i = 0; i < 3; i++) {
    const id = ['fq_inn_window', 'fq_inn_stove', 'fq_inn_closet'][i];
    assert.equal(q(c, qd.name).find, id);
    msgs = await talkTo(bot, id, [wrong(INN_CHORES[i].ans)]);
    assert.ok(!c.flags[INN_CLEAN[i]] && said(msgs, /もう一度、考えよう/), `${id}: まちがい`);
    if (i === 2) assert.ok(battled(msgs, 'fq_bat') && c.flags[WQ.innBat], 'つららコウモリ');
    msgs = await talkTo(bot, id, [INN_CHORES[i].ans]);
    assert.ok(c.flags[INN_CLEAN[i]], `${id}: きれいに なった`);
    if (i === 2) assert.ok(!battled(msgs, 'fq_bat'), '2回目は 戦わない');
  }
  assert.ok(condOk(npcAnywhere('fq_inn_window2').n.show, (f) => !!c.flags[f]), 'ぴかぴかの まど');
  msgs = await talkTo(bot, 'fq_inn_okami');
  assert.ok(said(msgs, /今は0人/));
  for (const id of ['fq_inn_kid1', 'fq_inn_kid2', 'fq_inn_kid3']) await talkTo(bot, id);
  assert.ok(INN_KIDS.every((k) => c.flags[k]) && q(c, qd.name).ready);
  msgs = await talkTo(bot, 'fq_inn_okami', [wrong(INN_MENU_ANSWER)]);
  assert.ok(!c.flags[qd.done] && said(msgs, /もう一度思い出して/));
  await rewarded(bot, c, qd, async () => {
    await talkTo(bot, 'fq_inn_okami', [INN_MENU_ANSWER]);
  });
  assert.ok(condOk(npcAnywhere('fq_inn_eat1').n.show, (f) => !!c.flags[f]) && !condOk(npcAnywhere('fq_inn_kid1').n.show, (f) => !!c.flags[f]), '子どもたちは ごはん');
});

// ───── 11. 手品ショー ─────
test('王都のお祭りの手品ショー: シルクハット・トランプ・白いハト → 手品のじゅんばん（やり直し）→ たねはひみつ（やり直し）→ ごほうび。手品師がいないとショーに出られない', async () => {
  const { bot, c } = await setup(416, { job: 'priest' });
  const qd = W.magic;
  await talkTo(bot, 'fq_magic_host', [0]);
  assert.ok(c.flags[WQ.magicStart]);
  assert.equal(q(c, qd.name).find, 'fq_magic_man');
  let msgs = await talkTo(bot, 'fq_magic_man');
  assert.ok(c.keyItems.includes('fq_silk_hat') && said(msgs, /いちばんすごい手品は、最後/));
  await talkTo(bot, 'fq_magic_vendor');
  assert.ok(c.keyItems.includes('fq_cards'));
  // ハト: おいかけると にげる → そっと だき上げる
  await talkTo(bot, 'fq_magic_dove', [1]);
  assert.ok(!c.keyItems.includes('fq_dove'));
  await talkTo(bot, 'fq_magic_dove', [0]);
  assert.ok(c.keyItems.includes('fq_dove') && !condOk(npcAnywhere('fq_magic_dove').n.show, (f) => !!c.flags[f]), 'ハトを だき上げた');
  assert.equal(q(c, qd.name).ready, true);
  // 手品の じゅんばんの えらび方（のこりの 中の 番号）
  const pick = (order) => { const out = []; const left = MAGIC_TRICKS.map((_, i) => i); for (const i of order) { out.push(left.indexOf(i)); left.splice(left.indexOf(i), 1); } return out; };
  msgs = await talkTo(bot, 'fq_magic_host', [...pick(MAGIC_ORDER), MAGIC_SECRET_ANSWER]);
  assert.ok(said(msgs, /手品師の人が、パーティーに/) && !c.flags[WQ.magicOrder]);
  c.job = 'kaito_kid'; // 手品師 → 怪盗 → 怪盗キッド
  msgs = await talkTo(bot, 'fq_magic_host', pick([0, 1, 2]));
  assert.ok(!c.flags[WQ.magicOrder] && said(msgs, /もう一度、ショーを/), 'いちばんすごい手品が 先 → やり直し');
  msgs = await talkTo(bot, 'fq_magic_host', [...pick(MAGIC_ORDER), wrong(MAGIC_SECRET_ANSWER)]);
  assert.ok(c.flags[WQ.magicOrder] && !c.flags[qd.done] && said(msgs, /もう一度、ショーを/), 'たねを 話す → やり直し');
  await rewarded(bot, c, qd, async () => {
    await talkTo(bot, 'fq_magic_host', [MAGIC_SECRET_ANSWER]);
  });
  for (const id of ['fq_silk_hat', 'fq_cards', 'fq_dove']) assert.ok(!c.keyItems.includes(id), `${id} は かえした`);
});

// ───── お仕事いらい板（2ページ目）─────
test('お仕事いらい板: 11まいの はり紙は 2ページ（ページ送り）・2ページ目に 新しい はり紙・読むと その ページに もどる', async () => {
  assert.equal(BOARD_PAGE, 6);
  assert.equal(boardPages(), 2);
  for (const qd of WORK_QUESTS) {
    const text = boardPage({ flag: () => false }, qd).map((st) => st[2]).join('\n');
    assert.ok(text.includes(qd.paper) && text.includes(qd.who) && text.includes(ITEMS[qd.reward.item].name) && text.includes(VEHICLES[qd.reward.vehicle].name), qd.id);
    assert.ok(text.includes(`${qd.reward.gold}ゴールド`) && text.includes(`小さなメダル${qd.reward.medals}まい`), qd.id);
    assert.ok(text.includes('【解決できそうな職業】') && text.includes(JOBS[qd.roots[0]].name), qd.id);
  }
  const { bot, c } = await setup(417);
  c.flags[WQ.innStart] = true;
  c.flags[WQ.ballDone] = true;
  // つぎのページへ（6）→ 2ページ目の 4まい目（宿）を 読む → 2ページ目に もどる → 前のページへ（5）→ やめる（7）
  const msgs = await talkTo(bot, 'fq_board', [6, 3, 5, 7]);
  const menus = msgs.filter((m) => m.t === 'script' && m.steps.at(-1)?.[0] === 'choice').map((m) => m.steps.at(-1));
  assert.equal(menus.length, 4);
  assert.match(menus[1][1], /2\/2ページ/);
  assert.deepEqual(menus[1][2], [...FAMILY_QUESTS.slice(6).map((x) => x.name + (x.id === 'inn' ? '（受けている）' : x.id === 'ball' ? '（すんだ）' : '')), '前のページへ', 'やめる']);
  assert.ok(said(msgs, /こしをいためて/), '宿の はり紙を 読んだ');
  assert.match(menus[2][1], /2\/2ページ/, '読んだら 2ページ目に もどる');
  assert.match(menus[3][1], /1\/2ページ/);
  assert.equal(menus[3][2].at(-2), 'つぎのページへ');
  assert.equal(menus[0][2][5], '砂の港ドゥナの歌のステージ', '1ページ目の さいごは 新しい 1まい目');
  assert.ok(!bot.s.busy);
});

// ───── 戦いの 強さ・絵 ─────
test('戦い: 砂ガニ（2ひき）と つららコウモリ（3びき）は 第1部クリアのころの 4人・2人なら 完全オートで 勝てる。ひとり（戦士）でも 勝てる', () => {
  for (const id of ['fq_crab', 'fq_bat']) {
    const e = FIXED_ENCOUNTERS[id];
    assert.ok(e && !e.boss && e.canFlee === false, id);
    for (const [sp] of e.group) assert.ok(MONSTER_ART[sp], `${sp} の 絵`);
    const parties = [['warrior', 'priest', 'mage', 'monk'], ['warrior', 'priest'], ['warrior']];
    for (const jobs of parties) {
      let win = 0;
      for (let i = 0; i < 6; i++) {
        const lv = 55 + (i % 4);
        const party = jobs.map((j, k) => makeChar(j, lv, 10, `p${k}`, 52));
        const r = runBattle(party, e.group.flatMap(([sp, n]) => Array(n).fill(sp)), { seed: 41 + i * 7919, enemyLv: e.enemyLv });
        if (r.outcome === 'win') win++;
      }
      assert.equal(win, 6, `${id} ${jobs.join('・')} 勝ち ${win}/6`);
    }
  }
});
