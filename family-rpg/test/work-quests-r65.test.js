// 第65回 D2: お仕事いらい 12〜17（docs/plan-side.md の「お仕事いらい 12〜17（第65回 D2）」）と、お仕事いらい板の「受ける」
// 12. 星読みの里の、星まつりの天気（気象予報士）・13. ホシフル村の自由研究（小学生）・14. 竜守りの村の大岩（サイヤ人）・
// 15. カモメ港の魔物サーカス（魔物使い）・16. ハネノの町のお笑い大会（お笑い芸人）・17. ドゥナのからくりゲーム（ゲーマー）
// 受けて → すすめて → ごほうび・職業の しばり（いる／いない）・まちがえても やり直せる・ひとりで とける・ごほうびは 1回だけ・
// 地図の しるし・「はなす」の ヒント・困っている人・漢字・軽い 戦い（敵Lv70）・
// お仕事いらい板: カーソルの せつめい（職業・ごほうび）・「このいらいを、うける？」・受けた ものだけ 地図に しるし・前の セーブの とちゅうは 受けた ことに・やめる
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { MAPS, isBlocked, condOk } from '../public/js/shared/maps/index.js';
import { SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { JOBS, jobAncestry } from '../public/js/shared/data/jobs.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { VEHICLES } from '../public/js/shared/data/vehicles.js';
import { FAMILY_QUESTS, boardPage, boardInfo, boardTaken, takeFlag, rewardNames } from '../public/js/shared/data/sidequests-family.js';
import {
  WORK2_QUESTS, WORK2_SCRIPTS, WORK2_STORY_SCRIPTS, workSubQuests2, WX_DAY_ANSWER, WX_NOTICE_ANSWER, STUDY_PLAN, ROCK_HOW_ANSWER, ROCK_WHERE_ANSWER,
  CIRCUS_CARE_PLAN, OWARAI_NETA, GAME_PLAN,
} from '../public/js/shared/data/sidequests-work2.js';
import {
  WQ2, WX_SIGNS, STUDY_KIDS, STUDY_LOOKS, STUDY_PLANS, ROCK_VOICES, CIRCUS_LOOKS, CIRCUS_CARE, OWARAI_VOICES, OWARAI_BOKE, GAME_VOICES, GAME_FIX, WORK2_NPC_IDS,
} from '../public/js/shared/maps/work-quests2.js';
import { jobLine } from '../public/js/shared/data/fq-common.js';
import { labDoneQuests, sideQuestHint } from '../public/js/shared/data/sidequests.js';
import { subQuests, questMarks } from '../public/js/shared/data/quest-targets.js';
import { availableSubQuests, subQuestHint } from '../public/js/shared/data/subquest-hints.js';
import { itemCount } from '../public/js/shared/stats.js';
import { starsFor } from '../public/js/shared/data/items-rare.js';
import { medalsFound } from '../public/js/shared/data/casino.js';
import { NEWS } from '../public/js/shared/data/news.js';
import { makeChar, runBattle } from '../tools/sim.js';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { npcOpts } from '../public/js/client/render/chars.js';
import { VEHICLE_ART } from '../public/js/client/render/vehicle-art.js';
import { checkFile, gameFiles, checkText } from '../tools/kanji-check.mjs';
import { setup, npcAnywhere, talkTo, said, battled } from './fq-helpers.js';

const q = (c, name) => subQuests(c).find((x) => x.name === name);
const W = Object.fromEntries(WORK2_QUESTS.map((x) => [x.id, x]));
const wrong = (ans) => (ans === 0 ? 1 : 0);
const shows = (id, c) => condOk(npcAnywhere(id).n.show, (f) => !!c.flags[f]);

// ごほうびを もらった（あれば アクセサリー・乗り物。素材や 道具・ゴールド・小さなメダル・クエストの 画面から 消える）。もう 1回 話しても ふえない
async function rewarded(c, qd, talk) {
  const gold0 = c.gold, medals0 = medalsFound(c);
  const goods0 = (qd.reward.goods || []).map(([id]) => itemCount(c, id));
  await talk();
  const check = (note) => {
    assert.ok(c.flags[qd.done], `${qd.id}: すんだ`);
    if (qd.reward.item) assert.equal(itemCount(c, qd.reward.item), 1, `${qd.id}: ${qd.reward.item}${note}`);
    if (qd.reward.vehicle) assert.ok(c.vehicles.includes(qd.reward.vehicle), `${qd.id}: ${qd.reward.vehicle}`);
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
test('しくみ: 6つの 新しい たのまれごと（まだ 使っていない 職業の 系統）・今の 時代の 町・第1部クリアの あとだけ・だいほんと 戦い', () => {
  assert.equal(WORK2_QUESTS.length, 6);
  assert.deepEqual(FAMILY_QUESTS.slice(11), WORK2_QUESTS);
  assert.deepEqual(WORK2_QUESTS.map((x) => x.roots[0]), ['kishou', 'schoolkid', 'saiyan', 'tamer', 'comedian', 'gamer']);
  const older = FAMILY_QUESTS.slice(0, 11);
  for (const qd of WORK2_QUESTS) {
    const L = jobLine(qd.roots);
    for (const id of Object.keys(JOBS)) assert.equal(L.has(id), qd.roots.some((r) => jobAncestry(id).has(r)), `${qd.id} ${id}`);
    // 元の 職業は 1〜11 の どの 系統にも 入っていない（新しい 系統）
    for (const o of older) assert.ok(!jobLine(o.roots).has(qd.roots[0]), `${qd.id} は ${o.id} と ちがう 系統`);
    assert.equal(JOBS[qd.roots[0]].name, qd.job, qd.id);
    assert.ok(qd.who && qd.where && qd.paper && qd.town && qd.npc, qd.id);
    assert.ok(npcAnywhere(qd.npc), `${qd.id}: ${qd.npc}`);
  }
  assert.ok(jobLine(['kishou']).has('weather_god') && jobLine(['schoolkid']).has('harry') && jobLine(['saiyan']).has('ss3'));
  assert.ok(jobLine(['tamer']).has('monster_master') && jobLine(['comedian']).has('m1_champion') && jobLine(['gamer']).has('pro_gamer'));
  // 町（今の 時代。たのまれごとが 少ない 町に 分ける）
  const maps = { weather: 'hoshiyomi', study: 'overworld', rock: 'north', circus: 'sea', owarai: 'hanono', game: 'duna' };
  const area = (id) => { const { map, n } = npcAnywhere(id); return MAPS[map].areaName?.(Math.floor(n.x), Math.floor(n.y)) || MAPS[map].name; };
  for (const qd of WORK2_QUESTS) assert.equal(npcAnywhere(qd.npc).map, maps[qd.id], qd.id);
  assert.match(area('fq_study_k1'), /ホシフル/);
  assert.match(area('fq_rock_host'), /竜守り/);
  assert.match(area('fq_circus_boss'), /カモメ港/);
  assert.match(area('fq_owarai_boke'), /ハネノ/);
  assert.match(area('fq_game_maker'), /ドゥナ/);
  for (const m of Object.values(MAPS)) if (m.id.includes('past') || m.id.startsWith('c7_')) assert.ok(!m.npcs.some((n) => WORK2_NPC_IDS.includes(n.id)), m.id);
  // 第1部クリアの 前は 町に 出ない・話しても 受けられない
  for (const id of WORK2_NPC_IDS) {
    const at = npcAnywhere(id);
    assert.ok(at, id);
    assert.equal(condOk(at.n.show, () => false), false, `${id} は 第1部クリアの 前は 出ない`);
    assert.ok(SCRIPTS[at.n.script], `${id} の だいほん`);
  }
  const pre = { flag: () => false, has: () => false, count: () => 0, night: false, name: 'ソラ', c: { job: 'kishou' } };
  for (const qd of WORK2_QUESTS) assert.ok(!JSON.stringify(SCRIPTS[qd.npc](pre)).includes('"choice"'), `${qd.id} は 受けられない`);
  assert.deepEqual(workSubQuests2({ flags: {} }, () => false, () => false), []);
  for (const id of Object.keys(WORK2_SCRIPTS)) assert.equal(SCRIPTS[id], WORK2_SCRIPTS[id], id);
  for (const id of WORK2_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id), id);
  // 人は 立てる 所（かべの 上の 物は かたい NPC か 見えない しらべる 所）・人の 絵・物の 絵
  for (const id of WORK2_NPC_IDS) {
    const { map, n } = npcAnywhere(id);
    assert.ok(!isBlocked(MAPS[map], Math.floor(n.x), Math.floor(n.y), () => true) || n.solid || n.sprite === 'none', `${id} の 場所`);
    if (n.sprite.startsWith('mon:')) assert.ok(MONSTER_ART[n.sprite.slice(4)], `${id} の 絵`);
    else if (n.sprite !== 'none') assert.ok(npcOpts(n.sprite), `${id} の みため`);
  }
  // 星読みの里・ハネノの町は 人の 絵だけ（第5章の きまり）
  for (const n of [...MAPS.hoshiyomi.npcs, ...MAPS.hanono.npcs]) if (WORK2_NPC_IDS.includes(n.id)) assert.ok(npcOpts(n.sprite), n.id);
});

test('ごほうび: 第64回の きまり（★5の アクセサリーは 2つだけ・乗り物は 2つ）・素材や 道具・ゴールド・小さなメダル・はり紙と 同じ', () => {
  const accs = WORK2_QUESTS.filter((x) => x.reward.item);
  assert.ok(accs.length <= 2, '★5は 2つまで');
  for (const qd of accs) {
    const it = ITEMS[qd.reward.item];
    assert.ok(it && it.type === 'acc' && starsFor(it) === 5 && it.src === 'gift' && !(it.price > 0), qd.id);
  }
  for (const qd of WORK2_QUESTS) {
    const r = qd.reward;
    if (r.vehicle) assert.ok(VEHICLES[r.vehicle]?.gift && VEHICLE_ART[r.vehicle], `${qd.id}: ${r.vehicle}`);
    for (const [id, n] of r.goods || []) assert.ok(ITEMS[id] && ITEMS[id].type !== 'key' && !['weapon', 'armor', 'shield', 'head', 'acc'].includes(ITEMS[id].type) && n > 0, `${qd.id}: ${id}`);
    assert.ok(r.gold > 0 && r.medals > 0, qd.id);
    // はり紙
    const text = boardPage({ flag: () => false }, qd).map((st) => st[2]).join('\n');
    assert.ok(text.includes(qd.paper) && text.includes(qd.who) && text.includes(`${r.gold}ゴールド`) && text.includes(`小さなメダル${r.medals}まい`), qd.id);
    for (const name of rewardNames(r)) assert.ok(text.includes(name), `${qd.id}: ${name}`);
  }
});

// ───── 12. 星まつりの 天気 ─────
test('星読みの里の、星まつりの天気: 空のしるし3つ（雲見の見晴らしでかみなりぐも）→ 夜を決める（やり直し）→ 知らせ方（やり直し）→ ごほうび。気象予報士がいないと決められない', async () => {
  const { bot, c } = await setup(651, { job: 'warrior' });
  const qd = W.weather;
  await talkTo(bot, 'fq_wx_host', [0]);
  assert.ok(c.flags[WQ2.wxStart]);
  assert.equal(q(c, qd.name).find, 'fq_wx_v1');
  let msgs = await talkTo(bot, 'fq_wx_v1');
  assert.ok(battled(msgs, 'fq_cloud') && c.flags[WQ2.wxCloud] && c.flags[WX_SIGNS[0]], 'かみなりぐもと 戦って 雲を 見た（だれでも）');
  msgs = await talkTo(bot, 'fq_wx_v1');
  assert.ok(!battled(msgs, 'fq_cloud'), '2回目は 戦わない');
  for (const id of ['fq_wx_v2', 'fq_wx_v3']) await talkTo(bot, id);
  assert.ok(WX_SIGNS.every((k) => c.flags[k]) && q(c, qd.name).ready);
  msgs = await talkTo(bot, 'fq_wx_host', [WX_DAY_ANSWER, WX_NOTICE_ANSWER]);
  assert.ok(said(msgs, /気象予報士の人が、パーティーに/) && !c.flags[WQ2.wxDay]);
  c.job = 'otenki_caster'; // 気象予報士 → お天気キャスター
  msgs = await talkTo(bot, 'fq_wx_host', [wrong(WX_DAY_ANSWER)]);
  assert.ok(!c.flags[WQ2.wxDay] && said(msgs, /もう一度、空のしるし/), '夜の まちがい');
  msgs = await talkTo(bot, 'fq_wx_host', [WX_DAY_ANSWER, wrong(WX_NOTICE_ANSWER)]);
  assert.ok(c.flags[WQ2.wxDay] && !c.flags[qd.done], '知らせ方の まちがい（夜は 決まったまま）');
  await rewarded(c, qd, () => talkTo(bot, 'fq_wx_host', [WX_NOTICE_ANSWER]));
});

// ───── 13. 自由研究 ─────
test('ホシフル村の自由研究: 3人のふしぎ・研究するものを見る → 1人ずつ調べ方を決める（やり直し）→ 発表会 → ごほうび。小学生がいないと決められない', async () => {
  const { bot, c } = await setup(652, { job: 'warrior' });
  const qd = W.study;
  await talkTo(bot, 'fq_study_k1', [0]);
  assert.ok(c.flags[WQ2.studyStart] && c.flags[STUDY_KIDS[0]], 'ハルトの ふしぎは 受けた 時に 聞く');
  let msgs = await talkTo(bot, 'fq_study_k1');
  assert.ok(said(msgs, /今は1人/));
  assert.equal(q(c, qd.name).find, 'fq_study_k2');
  for (const id of ['fq_study_k2', 'fq_study_k3']) await talkTo(bot, id);
  for (const [i, id] of ['fq_study_o1', 'fq_study_o2', 'fq_study_o3'].entries()) {
    assert.equal(q(c, qd.name).find, id);
    await talkTo(bot, id);
    assert.ok(c.flags[STUDY_LOOKS[i]], id);
  }
  assert.ok(q(c, qd.name).ready);
  const ans = STUDY_PLAN.map((x) => x.ans);
  msgs = await talkTo(bot, 'fq_study_k1', ans);
  assert.ok(said(msgs, /小学生の人が、パーティーに/) && !c.flags[STUDY_PLANS[0]]);
  c.job = 'harry'; // 小学生 → 魔法学校の生徒 → ハリーポッター
  msgs = await talkTo(bot, 'fq_study_k1', [ans[0], wrong(ans[1])]);
  assert.ok(c.flags[STUDY_PLANS[0]] && !c.flags[STUDY_PLANS[1]] && said(msgs, /もう一度、考えて/), '2人目で まちがい（1人目は 決まったまま）');
  await rewarded(c, qd, () => talkTo(bot, 'fq_study_k1', c.flags[qd.done] ? [] : ans.slice(1)));
});

// ───── 14. 大岩 ─────
test('竜守りの村の大岩: 大岩を調べる（ゆきだるまん）・村の人の話 → どけ方と置き場所（やり直し）→ 道が通れる → ごほうび。サイヤ人がいないと持ち上げられない', async () => {
  const { bot, c } = await setup(653, { job: 'warrior' });
  const qd = W.rock;
  await talkTo(bot, 'fq_rock_host', [0]);
  assert.ok(c.flags[WQ2.rockStart]);
  assert.equal(q(c, qd.name).find, 'fq_rock_boulder');
  let msgs = await talkTo(bot, 'fq_rock_boulder');
  assert.ok(battled(msgs, 'fq_snowmen') && c.flags[WQ2.rockSnow] && c.flags[WQ2.rockLook], 'ゆきだるまんと 戦って 大岩を 調べた（だれでも）');
  for (const id of ['fq_rock_v1', 'fq_rock_v2']) await talkTo(bot, id);
  assert.ok(ROCK_VOICES.every((k) => c.flags[k]));
  msgs = await talkTo(bot, 'fq_rock_boulder', [ROCK_HOW_ANSWER, ROCK_WHERE_ANSWER]);
  assert.ok(!battled(msgs, 'fq_snowmen') && said(msgs, /サイヤ人の人が、パーティーに/) && !c.flags[WQ2.rockLift]);
  c.job = 'ss3'; // サイヤ人 → … → スーパーサイヤ人3
  msgs = await talkTo(bot, 'fq_rock_boulder', [wrong(ROCK_HOW_ANSWER)]);
  assert.ok(!c.flags[WQ2.rockLift] && said(msgs, /村の人の話を、思い出そう/), 'どけ方の まちがい');
  msgs = await talkTo(bot, 'fq_rock_boulder', [ROCK_HOW_ANSWER, wrong(ROCK_WHERE_ANSWER)]);
  assert.ok(!c.flags[WQ2.rockLift] && said(msgs, /元の場所/), '置き場所の まちがい');
  assert.ok(shows('fq_rock_boulder', c));
  await talkTo(bot, 'fq_rock_boulder', [ROCK_HOW_ANSWER, ROCK_WHERE_ANSWER]);
  assert.ok(c.flags[WQ2.rockLift] && !shows('fq_rock_boulder', c), '大岩が なくなった');
  assert.ok(q(c, qd.name).ready && q(c, qd.name).who === 'fq_rock_host');
  await rewarded(c, qd, () => talkTo(bot, 'fq_rock_host'));
});

// ───── 15. 魔物サーカス ─────
test('カモメ港の魔物サーカス: 3びきのようすを見る → 1ぴきずつお世話（やり直し）→ ショー → ごほうび。魔物使いがいないとお世話できない', async () => {
  const { bot, c } = await setup(654, { job: 'priest' });
  const qd = W.circus;
  await talkTo(bot, 'fq_circus_boss', [0]);
  assert.ok(c.flags[WQ2.circusStart]);
  assert.equal(q(c, qd.name).find, 'fq_circus_m1');
  let msgs = await talkTo(bot, 'fq_circus_m1', [CIRCUS_CARE_PLAN[0].ans]);
  assert.ok(c.flags[CIRCUS_LOOKS[0]] && !c.flags[CIRCUS_CARE[0]] && said(msgs, /魔物使いの人が、パーティーに/), 'ようすは だれでも 見られる');
  c.job = 'monster_master'; // 魔物使い → モンスターマスター
  msgs = await talkTo(bot, 'fq_circus_m1', [wrong(CIRCUS_CARE_PLAN[0].ans)]);
  assert.ok(!c.flags[CIRCUS_CARE[0]] && said(msgs, /もう一度、ようすを見て/));
  for (let i = 0; i < 3; i++) {
    await talkTo(bot, `fq_circus_m${i + 1}`, [CIRCUS_CARE_PLAN[i].ans]);
    assert.ok(c.flags[CIRCUS_CARE[i]], `${i + 1}ぴき目`);
  }
  assert.ok(q(c, qd.name).ready);
  await rewarded(c, qd, () => talkTo(bot, 'fq_circus_boss'));
});

// ───── 16. お笑い大会 ─────
test('ハネノの町のお笑い大会: ネタ帳・町の人の好きなお笑い → ぶたいで3つのツッコミ（やり直し）→ ゆうしょう → ごほうび。お笑い芸人がいないとぶたいに立てない', async () => {
  const { bot, c } = await setup(655, { job: 'mage' });
  const qd = W.owarai;
  await talkTo(bot, 'fq_owarai_boke', [0]);
  assert.ok(c.flags[WQ2.owaraiStart]);
  assert.equal(q(c, qd.name).find, 'fq_owarai_partner');
  await talkTo(bot, 'fq_owarai_partner');
  assert.ok(c.keyItems.includes('fq_neta_note') && c.flags[WQ2.owaraiNote]);
  for (const id of ['fq_owarai_v1', 'fq_owarai_v2', 'fq_owarai_v3']) await talkTo(bot, id);
  assert.ok(OWARAI_VOICES.every((k) => c.flags[k]) && q(c, qd.name).ready);
  const ans = OWARAI_NETA.map((x) => x.ans);
  let msgs = await talkTo(bot, 'fq_owarai_boke', ans);
  assert.ok(said(msgs, /お笑い芸人の人が、パーティーに/) && !c.flags[OWARAI_BOKE[0]]);
  c.job = 'm1_champion'; // お笑い芸人 → M-1王者
  msgs = await talkTo(bot, 'fq_owarai_boke', [ans[0], wrong(ans[1])]);
  assert.ok(c.flags[OWARAI_BOKE[0]] && !c.flags[OWARAI_BOKE[1]] && said(msgs, /もう一回、ぶたいに/), '2つ目で まちがい');
  await rewarded(c, qd, () => talkTo(bot, 'fq_owarai_boke', c.flags[qd.done] ? [] : ans.slice(1)));
  assert.ok(!c.keyItems.includes('fq_neta_note'), 'ネタ帳は かえす');
});

// ───── 17. からくりゲーム ─────
test('ドゥナのからくりゲーム: ゲーム機で遊ぶ（バグのいたずらゴブリン）・子どもの話 → 直し方3つ（やり直し）→ ごほうび。ゲーマーがいないと直し方が分からない', async () => {
  const { bot, c } = await setup(656, { job: 'monk' });
  const qd = W.game;
  await talkTo(bot, 'fq_game_maker', [0]);
  assert.ok(c.flags[WQ2.gameStart]);
  assert.equal(q(c, qd.name).find, 'fq_game_machine');
  let msgs = await talkTo(bot, 'fq_game_machine');
  assert.ok(battled(msgs, 'fq_bug') && c.flags[WQ2.gameBug]);
  msgs = await talkTo(bot, 'fq_game_machine');
  assert.ok(!battled(msgs, 'fq_bug'), '2回目は 戦わない');
  for (const id of ['fq_game_v1', 'fq_game_v2', 'fq_game_v3']) await talkTo(bot, id);
  assert.ok(GAME_VOICES.every((k) => c.flags[k]) && q(c, qd.name).ready);
  const ans = GAME_PLAN.map((x) => x.ans);
  msgs = await talkTo(bot, 'fq_game_maker', ans);
  assert.ok(said(msgs, /ゲーマーの人が、パーティーに/) && !c.flags[GAME_FIX[0]]);
  c.job = 'pro_gamer';
  msgs = await talkTo(bot, 'fq_game_maker', [wrong(ans[0])]);
  assert.ok(!c.flags[GAME_FIX[0]] && said(msgs, /もう一度、思い出して/));
  msgs = await talkTo(bot, 'fq_game_maker', [ans[0], ans[1], wrong(ans[2])]);
  assert.ok(c.flags[GAME_FIX[1]] && !c.flags[GAME_FIX[2]], '3つ目で まちがい');
  await rewarded(c, qd, () => talkTo(bot, 'fq_game_maker', c.flags[qd.done] ? [] : [ans[2]]));
});

// ───── 地図の しるし・ヒント・困っている人 ─────
test('受けた たのまれごとは クエストの 画面・地図の しるし・「はなす」の ヒント・困っている人から 消える', () => {
  const all = { flags: Object.fromEntries(['c5_clear', ...WORK2_QUESTS.map((x) => x.start)].map((f) => [f, true])), items: [], keyItems: [] };
  const list = subQuests(all).filter((x) => WORK2_QUESTS.some((w) => w.name === x.name));
  assert.equal(list.length, 6);
  for (const x of list) {
    assert.ok(npcAnywhere(x.who), `${x.name}: ${x.who}`);
    if (x.find) assert.ok(npcAnywhere(x.find), `${x.name}: ${x.find}`);
    assert.ok(x.text && x.hint, x.name);
  }
  for (const qd of WORK2_QUESTS) {
    const map = npcAnywhere(qd.npc).map;
    assert.ok(questMarks(all, map, '').some((m) => m.label === qd.name), `${qd.id}: 地図の しるし`);
    const h = subQuestHint(`fq_${qd.id}`);
    assert.ok(h && h.board && h.npc === qd.npc && h.roots === qd.roots, `${qd.id}: 困っている人`);
  }
  assert.ok(WORK2_QUESTS.some((qd) => sideQuestHint(all).includes(qd.name)), '「はなす」の ヒント');
  assert.ok(!availableSubQuests(all).some((h) => WORK2_QUESTS.some((qd) => h.id === `fq_${qd.id}`)), '受けたら 困っている人から 消える');
  assert.equal(availableSubQuests({ flags: { c5_clear: true } }).filter((h) => h.board).length, FAMILY_QUESTS.length);
});

// ───── お仕事いらい板: せつめい・受ける・やめる ─────
test('お仕事いらい板: カーソルを合わせると 必要な職業（いる／いない）と ごほうびが 見える（17まい ぜんぶ・短い 3行）', async () => {
  for (const qd of FAMILY_QUESTS) {
    const no = boardInfo({ flag: () => false, c: { job: 'neet' } }, qd);
    const yes = boardInfo({ flag: () => false, c: { job: qd.roots[0] } }, qd);
    assert.ok(no.startsWith(`必要な職業：${qd.job}の系統（×いない）`), `${qd.id}: ${no}`);
    assert.ok(yes.includes('（○いる）'), qd.id);
    for (const name of rewardNames(qd.reward)) assert.ok(no.includes(name), `${qd.id}: ${name}`);
    assert.ok(no.includes(`${qd.reward.gold}ゴールド・小さなメダル${qd.reward.medals}まい`), qd.id);
    assert.equal(no.split('\n').length, 3, qd.id);
    assert.deepEqual(checkText(no), [], qd.id);
  }
  // サーバーから とどく えらぶ 物ごとの せつめい（えらぶ 物と 同じ 数。ページ送りや やめるは から）
  const { bot } = await setup(657);
  const msgs = await talkTo(bot, 'fq_board', [7]);
  const ch = msgs.find((m) => m.t === 'script' && m.steps.at(-1)?.[0] === 'choice').steps.at(-1);
  assert.equal(ch.length, 4);
  assert.equal(ch[3].length, ch[2].length);
  assert.match(ch[3][0], /^必要な職業：設備屋の系統（×いない）\nごほうび：空調名人のバッジ・高所作業車\n5000ゴールド・小さなメダル3まい$/);
  assert.equal(ch[3].at(-1), '');
  // 画面: えらぶ 物の せつめいの わく
  const ui = fs.readFileSync(new URL('../public/js/client/ui/script.js', import.meta.url), 'utf8');
  assert.ok(ui.includes('choice-info') && ui.includes('onMove'), 'client/ui/script.js');
  assert.ok(fs.readFileSync(new URL('../public/css/style.css', import.meta.url), 'utf8').includes('.choice-info'), 'style.css');
});

test('お仕事いらい板: 「このいらいを、うける？」→ はい で 受けた しるし → 受けた ものだけ 地図に しるし → 会うと 続き・やめると しるしが 消える', async () => {
  const { bot, c } = await setup(658);
  const qd = W.weather;
  const map = npcAnywhere(qd.npc).map;
  const marked = () => questMarks(c, map, '').some((m) => m.label === qd.name);
  assert.ok(!marked() && !q(c, qd.name), '受ける 前は しるしが ない');
  // 2ページ目（6）の 6まい目（星まつり。5）→ 読む →「うける？」はい（0）→ 2ページ目に もどる → やめる（8）
  let msgs = await talkTo(bot, 'fq_board', [6, 5, 0, 8]);
  assert.ok(said(msgs, /このいらいを、うける？/) && said(msgs, /を受けた！/));
  assert.ok(c.flags[takeFlag(qd)] && !c.flags[qd.start], '板で 受けた（まだ 会っていない）');
  assert.ok(boardTaken((k) => !!c.flags[k], qd));
  const e = q(c, qd.name);
  assert.ok(e && e.who === qd.npc && /アルデに会おう/.test(e.text) && e.hint.includes(qd.where), 'クエストの 画面');
  assert.ok(marked(), '受けたら 地図に しるし');
  assert.ok(questMarks(c, 'kumoi', '').some((m) => m.label === qd.name && m.via), 'クモイ地方では 里の 入り口に 道しるべ');
  assert.ok(!availableSubQuests(c).some((h) => h.id === 'fq_weather'), '困っている人から 消える');
  // 板の 一らんに「（受けている）」
  msgs = await talkTo(bot, 'fq_board', [6, 8]);
  const page2 = msgs.filter((m) => m.t === 'script' && m.steps.at(-1)?.[0] === 'choice').map((m) => m.steps.at(-1))[1];
  assert.equal(page2[2][5], `${qd.name}（受けている）`);
  // 会って 受けると、ふつうの 続き（板の しるしは のこる）
  await talkTo(bot, qd.npc, [0]);
  assert.ok(c.flags[qd.start] && q(c, qd.name).find === 'fq_wx_v1');
  // やめる（0）→ しるしが 消える。とちゅうまでの ことは 覚えている
  c.flags[WX_SIGNS[0]] = true;
  msgs = await talkTo(bot, 'fq_board', [6, 5, 0, 8]);
  assert.ok(said(msgs, /このいらいを、やめる？/) && said(msgs, /をやめた/));
  assert.ok(!c.flags[takeFlag(qd)] && !c.flags[qd.start] && c.flags[WX_SIGNS[0]]);
  assert.ok(!q(c, qd.name) && !marked(), 'やめたら しるしが 消える');
  assert.ok(availableSubQuests(c).some((h) => h.id === 'fq_weather'), 'また 困っている人に');
  // もう一度 受けて 会うと、続きから
  await talkTo(bot, 'fq_board', [6, 5, 0, 8]);
  await talkTo(bot, qd.npc, [0]);
  assert.ok(c.flags[qd.start] && q(c, qd.name).find === 'fq_wx_v2', '続きから');
  // いいえ（1）なら 受けない
  const qd2 = W.study;
  await talkTo(bot, 'fq_board', [6, 6, 0, 1, 7]);
  assert.ok(!c.flags[takeFlag(qd2)], 'いいえ');
  assert.ok(!bot.s.busy);
});

test('お仕事いらい板: 前の セーブで とちゅうの たのまれごと（受けた フラグが ない）は 受けた ことに（しるしは そのまま）', () => {
  for (const qd of FAMILY_QUESTS) {
    const c = { flags: { c5_clear: true, [qd.start]: true }, items: [], keyItems: [] };
    assert.ok(!c.flags[takeFlag(qd)]);
    assert.ok(boardTaken((k) => !!c.flags[k], qd), `${qd.id}: 受けている`);
    const e = q(c, qd.name);
    assert.ok(e, `${qd.id}: クエストの 画面`);
    assert.ok(questMarks(c, npcAnywhere(e.who).map, '').some((m) => m.label === qd.name), `${qd.id}: 地図の しるし`);
    assert.ok(!availableSubQuests(c).some((h) => h.id === `fq_${qd.id}`), `${qd.id}: 困っている人に 出ない`);
    // 板の 一らんでも「（受けている）」・はり紙にも
    const text = boardPage({ flag: (k) => !!c.flags[k] }, qd).map((st) => st[2]).join('\n');
    assert.ok(text.includes('今、このたのまれごとを受けている'), qd.id);
    // 会う 前の「会おう」は 出ない（もう 会っている）
    assert.equal(subQuests(c).filter((x) => x.name === qd.name).length, 1, qd.id);
  }
});

// ───── 戦いの 強さ ─────
test('戦い: 新しい 3つ（敵Lv70）は お話の ころ（Lv68〜71）の 4人・2人・戦士ひとりでも 完全オートで 勝てる（ボスほど強くない）', () => {
  for (const id of ['fq_cloud', 'fq_snowmen', 'fq_bug']) {
    const e = FIXED_ENCOUNTERS[id];
    assert.ok(e && !e.boss && e.canFlee === false && e.enemyLv === 70, id);
    for (const [sp] of e.group) assert.ok(MONSTER_ART[sp], `${sp} の 絵`);
    for (const jobs of [['warrior', 'priest', 'mage', 'monk'], ['warrior', 'priest'], ['warrior']]) {
      let win = 0;
      for (let i = 0; i < 6; i++) {
        const lv = 68 + (i % 4);
        const party = jobs.map((j, k) => makeChar(j, lv, 10, `p${k}`, 58));
        const r = runBattle(party, e.group.flatMap(([sp, n]) => Array(n).fill(sp)), { seed: 65 + i * 7919, enemyLv: e.enemyLv });
        if (r.outcome === 'win') win++;
      }
      assert.equal(win, 6, `${id} ${jobs.join('・')} 勝ち ${win}/6`);
    }
  }
  // 前の たのまれごとの 戦いは そのまま（敵Lv50）
  for (const id of ['fq_dust', 'fq_mole', 'fq_crab', 'fq_bat']) assert.equal(FIXED_ENCOUNTERS[id].enemyLv, 50, id);
});

// ───── 漢字・お知らせ ─────
test('漢字: 新しい ファイルは gameFiles() に 入っていて、使えない 漢字・スペースが ない。お知らせ', () => {
  const files = ['shared/data/sidequests-work2.js', 'shared/maps/work-quests2.js', 'client/render/work2-art.js'].map((f) => gameFiles().find((g) => g.endsWith('/public/js/' + f)));
  assert.ok(files.every(Boolean), 'gameFiles() に 入っている');
  const bad = [];
  for (const f of files) for (const p of checkFile(f)) if (p.kind !== 'kana') bad.push(`${f.split('/').pop()}:${p.line} [${p.kind} ${p.detail}] ${p.text}`);
  assert.deepEqual(bad, []);
  for (const qd of WORK2_QUESTS) for (const t of [qd.name, qd.paper, qd.who, qd.where, qd.job]) assert.deepEqual(checkText(t).filter((p) => p.kind !== 'kana'), [], t);
  const n = NEWS.find((x) => x.id === 'r65-work17');
  assert.ok(n && NEWS.indexOf(n) < 3, 'お知らせの 上の ほう');
  assert.ok(n.title.length <= 14 && n.text.length <= 170);
  assert.deepEqual(checkText(n.title + n.text).filter((p) => p.kind !== 'kana'), []);
});
