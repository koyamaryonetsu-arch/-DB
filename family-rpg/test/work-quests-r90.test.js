// 第90回 D班: お仕事いらい 36〜38（docs/plan-part3.md の 9-5 の 4）。新しい 流れの 職業（第83回・第85回）で とける たのまれごと
// 36. ルミナの、星をこわがる子どもたち（先生の 流れ: 小学校の先生 → れい能力教師ぬ〜べ〜 → おにの手のじごく先生）・
// 37. 鏡の湖の、こおったかがり火（炎術士の 流れ: 炎術士 → 八竜の炎術士・烈火）・
// 38. 星ふるえで、通れなくなった道（軍師の 流れ: つりをする道士 → せん人界の道士 → 太公望 → ほう神の大軍師）
// 受けて → すすめて → ごほうび・職業の しばり（いる／いない）・まちがえても やり直せる・ひとりで とける・ごほうびは 1回だけ・
// 星ふるえ（c9_starfall）の あとから（はり紙も 人も。持たない 人には 見えない ＝ 今の ゲームは かわらない）・地図の しるし・
// 困っている人・漢字・軽い 戦い（敵Lv96）・お仕事いらい板: 38まい・7ページ（c9_starfall の 前は 35まい・6ページの まま）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, isBlocked, condOk } from '../public/js/shared/maps/index.js';
import { SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { JOBS, jobAncestry } from '../public/js/shared/data/jobs.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { FAMILY_QUESTS, boardPage, boardInfo, boardPages, boardList, takeFlag, rewardNames } from '../public/js/shared/data/sidequests-family.js';
import { WORK7_QUESTS } from '../public/js/shared/data/sidequests-work7.js';
import { WORK8_QUESTS, WORK8_SCRIPTS, WORK8_STORY_SCRIPTS, workSubQuests8, KIDS_PLAN, GLOW_PLAN, ROAD_PLAN } from '../public/js/shared/data/sidequests-work8.js';
import { WQ8, WQ8_OPEN, KIDS_VOICES, KIDS_STEPS, GLOW_VOICES, GLOW_STEPS, ROAD_VOICES, ROAD_STEPS, WORK8_NPC_IDS } from '../public/js/shared/maps/work-quests8.js';
import { C9A, C9A_MAP_IDS } from '../public/js/shared/maps/c9a-flags.js';
import { jobLine } from '../public/js/shared/data/fq-common.js';
import { labDoneQuests, sideQuestHint } from '../public/js/shared/data/sidequests.js';
import { subQuests, questMarks } from '../public/js/shared/data/quest-targets.js';
import { availableSubQuests, subQuestHint } from '../public/js/shared/data/subquest-hints.js';
import { itemCount, fullHeal } from '../public/js/shared/stats.js';
import { medalsFound } from '../public/js/shared/data/casino.js';
import { makeChar, runBattle } from '../tools/sim.js';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { npcOpts } from '../public/js/client/render/chars.js';
import { checkFile, gameFiles, checkText } from '../tools/kanji-check.mjs';
import { setup, npcAnywhere, talkTo, said, battled, CLEAR } from './fq-helpers.js';

// 第2部の さいごまで・第3部 第1章 第1幕の 星祭りの 夜まで（星ふるえの 前）
const PART2 = [...CLEAR, 'c6_clear', 'c7_karim', 'c7_kingdom', 'c7_clear', 'c8_start', 'c8_kingdom', 'c8_jafar', 'c8_sea', 'c8_abyss', 'c8_hades', 'c8_sky', 'c8_spring',
  'c8_fortress', 'c8_bowser', 'c8_rift', 'c8_hall', 'c8_solitus'];
const BEFORE = [...PART2, C9A.festival, C9A.night];
const OPEN = [...BEFORE, WQ8_OPEN];
const q = (c, name) => subQuests(c).find((x) => x.name === name);
const W = Object.fromEntries(WORK8_QUESTS.map((x) => [x.id, x]));
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
test('しくみ: 3つの 新しい たのまれごと（新しい 流れの 職業）・今の 時代の 場所（A班の c9a_* には 置かない）・c9_starfall の あとだけ', () => {
  assert.equal(WORK8_QUESTS.length, 3);
  assert.equal(FAMILY_QUESTS.length, 38);
  assert.deepEqual(FAMILY_QUESTS.slice(35), WORK8_QUESTS);
  assert.deepEqual(FAMILY_QUESTS.slice(32, 35), WORK7_QUESTS);
  assert.deepEqual(WORK8_QUESTS.map((x) => x.roots), [['elem_teacher'], ['enjutsushi'], ['fishing_doshi']]);
  assert.deepEqual(WORK8_QUESTS.map((x) => x.legend), ['jigoku_sensei', 'rekka', 'hoshin_gunshi']);
  assert.equal(WQ8_OPEN, 'c9_starfall');
  for (const qd of WORK8_QUESTS) {
    const L = jobLine(qd.roots);
    for (const id of Object.keys(JOBS)) assert.equal(L.has(id), qd.roots.some((r) => jobAncestry(id).has(r)), `${qd.id} ${id}`);
    assert.ok(JOBS[qd.legend].tier === 3 && L.has(qd.legend), `${qd.id}: ${qd.legend}`);
    assert.equal(qd.roots.map((r) => JOBS[r].name).join('か'), qd.job, qd.id);
    assert.ok(qd.who && qd.where && qd.paper && qd.town && qd.npc, qd.id);
    assert.deepEqual(qd.open, ['c9_starfall'], qd.id);
    assert.ok(npcAnywhere(qd.npc), `${qd.id}: ${qd.npc}`);
  }
  // 流れの 中みと、前の たのまれごとと かさなる 所（前の 系統の 先に ある 職業だけ。新しい 流れの 職業は どれも はじめて）
  assert.deepEqual([...jobLine(['elem_teacher'])].sort(), ['elem_teacher', 'jigoku_sensei', 'nube', 'yokai_bridge']);
  assert.ok([...jobLine(['enjutsushi'])].includes('rekka'));
  assert.ok(['fishing_doshi', 'sennin_doshi', 'taikobo', 'hoshin_gunshi'].every((j) => jobLine(['fishing_doshi']).has(j)));
  const older = FAMILY_QUESTS.slice(0, 35);
  for (const a of WORK8_QUESTS) {
    assert.ok(!older.some((b) => b.legend === a.legend), a.id);
    // 前の いらいの roots（その 系統の 入り口）は、新しい 流れに 入って いない
    for (const b of older) for (const r of b.roots) assert.ok(!jobLine(a.roots).has(r), `${a.id} と ${b.id}`);
  }
  const both = (a, b) => [...jobLine(W[a].roots)].filter((j) => jobLine(W[b].roots).has(j));
  assert.deepEqual(both('kids', 'glow'), []);
  assert.deepEqual(both('kids', 'road'), []);
  assert.deepEqual(both('glow', 'road'), []);
  // 場所（今の 時代。ミドリナ地方の ルミナの町・鏡の湖・平原）
  const areas = { kids: 'ルミナの町', glow: '鏡の湖', road: 'ミドリナ平原' };
  const area = (id) => { const { map, n } = npcAnywhere(id); return MAPS[map].areaName?.(Math.floor(n.x), Math.floor(n.y)) || MAPS[map].name; };
  for (const qd of WORK8_QUESTS) assert.equal(npcAnywhere(qd.npc).map, 'overworld', qd.id);
  for (const [k, a] of Object.entries(areas)) for (const id of WORK8_NPC_IDS.filter((x) => x.startsWith(`fq_${k}_`))) assert.equal(area(id), a, id);
  // A班の 新しい マップ（c9a_*）・千年前・時のはざまには 置かない
  for (const m of Object.values(MAPS)) if (m.id !== 'overworld') assert.ok(!m.npcs.some((n) => WORK8_NPC_IDS.includes(n.id)), m.id);
  for (const id of C9A_MAP_IDS) assert.ok(!MAPS[id] || !MAPS[id].npcs.some((n) => WORK8_NPC_IDS.includes(n.id)), id);
  // c9_starfall の 前は 出ない・話しても 受けられない
  for (const id of WORK8_NPC_IDS) {
    const at = npcAnywhere(id);
    assert.ok(at, id);
    assert.equal(condOk(at.n.show, (f) => BEFORE.includes(f)), false, `${id} は c9_starfall の 前は 出ない`);
    assert.ok(SCRIPTS[at.n.script], `${id} の だいほん`);
  }
  for (const id of WORK8_NPC_IDS.filter((x) => x !== 'fq_glow_lit')) assert.equal(condOk(npcAnywhere(id).n.show, (f) => OPEN.includes(f)), true, `${id} は c9_starfall の あとに 出る`);
  const pre = { flag: (f) => BEFORE.includes(f), has: () => false, count: () => 0, night: false, name: 'ソラ', c: { job: 'jigoku_sensei' } };
  for (const qd of WORK8_QUESTS) assert.ok(!JSON.stringify(SCRIPTS[qd.npc](pre)).includes('"choice"'), `${qd.id} は 受けられない`);
  assert.deepEqual(workSubQuests8({ flags: {} }, () => false, () => false), []);
  for (const id of Object.keys(WORK8_SCRIPTS)) assert.equal(SCRIPTS[id], WORK8_SCRIPTS[id], id);
  for (const id of WORK8_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id), id);
  // 人は 立てる 所（物は かたい NPC）・人の 絵・物の 絵・ほかの 人と かさならない（かがり火の 2つは 同時に 出ない）
  const pair = new Set(['fq_glow_fire', 'fq_glow_lit']);
  for (const id of WORK8_NPC_IDS) {
    const { map, n } = npcAnywhere(id);
    assert.ok(!isBlocked(MAPS[map], Math.floor(n.x), Math.floor(n.y), () => true) || n.solid, `${id} の 場所`);
    if (n.sprite.startsWith('mon:')) assert.ok(MONSTER_ART[n.sprite.slice(4)], `${id} の 絵`);
    else assert.ok(npcOpts(n.sprite), `${id} の みため`);
    assert.ok(!MAPS[map].npcs.some((o) => o !== n && !(pair.has(o.id) && pair.has(n.id)) && Math.floor(o.x) === Math.floor(n.x) && Math.floor(o.y) === Math.floor(n.y)), `${id} は ほかの 人と かさならない`);
  }
  const lit = { flags: { [WQ8_OPEN]: true, [WQ8.glowLit]: true } };
  assert.ok(shows('fq_glow_lit', lit) && !shows('fq_glow_fire', lit), 'ともった あとは 1つだけ');
});

test('ごほうび: 第64回の きまり（装備・乗り物なし。今回は ★5の アクセサリーも なし ＝ 新しい 品を 足さない）・素材や 道具・ゴールド・小さなメダル・はり紙と 同じ', () => {
  // 新しい 品を 足すと 引っこしコードの 見はり（ふつうの セーブ）の 乱数の ならびが かわる ため、品は 今 ある 物だけ
  for (const qd of WORK8_QUESTS) assert.ok(!qd.reward.item, `${qd.id}: アクセサリーなし`);
  assert.ok(WORK8_QUESTS.every((qd) => qd.reward.goods.length >= 2), '素材や 道具は 2しゅ いじょう');
  for (const qd of WORK8_QUESTS) {
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

// ───── 36. 子どもたち ─────
test('ルミナの、星をこわがる子どもたち: 3人の話 → 目の高さで聞く・黒板でお話・手をつなぐ（やり直し）→ 星を見る → ごほうび。先生の流れがいないと出てきてくれない（戦いなし）', async () => {
  const { bot, c } = await setup(901, { job: 'warrior', flags: OPEN });
  const qd = W.kids;
  await talkTo(bot, 'fq_kids_host', [0]);
  assert.ok(c.flags[WQ8.kidsStart]);
  assert.equal(q(c, qd.name).find, 'fq_kids_v1');
  let msgs = await talkTo(bot, 'fq_kids_kids');
  assert.ok(said(msgs, /話を聞こう/) && !said(msgs, /どうする？/));
  for (const id of ['fq_kids_v1', 'fq_kids_v2', 'fq_kids_v3']) await talkTo(bot, id);
  assert.ok(KIDS_VOICES.every((k) => c.flags[k]) && q(c, qd.name).find === 'fq_kids_kids');
  const ans = KIDS_PLAN.map((x) => x.ans);
  msgs = await talkTo(bot, 'fq_kids_kids', ans);
  assert.ok(said(msgs, /小学校の先生の人が、パーティーに/) && !c.flags[KIDS_STEPS[0]]);
  c.job = 'jigoku_sensei'; // 小学校の先生 → … → おにの手のじごく先生
  msgs = await talkTo(bot, 'fq_kids_kids', [wrong(ans[0])]);
  assert.ok(!c.flags[KIDS_STEPS[0]] && said(msgs, /思い出そう/), '1つ目の まちがい');
  c.job = 'nube';
  msgs = await talkTo(bot, 'fq_kids_kids', [ans[0], wrong(ans[1])]);
  assert.ok(c.flags[KIDS_STEPS[0]] && !c.flags[KIDS_STEPS[1]] && said(msgs, /やくそくしては/), '2つ目で まちがい');
  c.job = 'elem_teacher';
  msgs = await talkTo(bot, 'fq_kids_kids', [ans[1], 1]);
  assert.ok(c.flags[KIDS_STEPS[1]] && !c.flags[KIDS_STEPS[2]] && said(msgs, /ひとりぼっち/), '3つ目で まちがい');
  msgs = await talkTo(bot, 'fq_kids_kids', [ans[2]]);
  assert.ok(c.flags[WQ8.kidsCalm] && said(msgs, /先生がいるもん/) && !battled(msgs, ''));
  assert.ok(q(c, qd.name).ready && q(c, qd.name).who === 'fq_kids_host');
  assert.ok(said(await talkTo(bot, 'fq_kids_board'), /せんせい、ありがとう/));
  c.job = 'warrior'; // 報告は だれでも
  await rewarded(c, qd, () => talkTo(bot, 'fq_kids_host'));
  assert.ok(said(await talkTo(bot, 'fq_kids_kids'), /ねがいごと/));
});

// ───── 37. かがり火 ─────
test('鏡の湖の、こおったかがり火: 3人の話 → 火の玉をばらまく → 雪の魔物と戦う（1回だけ）→ 炎のやいば・そっとうつす（やり直し）→ ともる → ごほうび。炎術士の流れがいないと とかせない', async () => {
  const { bot, c } = await setup(902, { job: 'priest', flags: OPEN });
  const qd = W.glow;
  assert.ok(shows('fq_glow_fire', c) && !shows('fq_glow_lit', c));
  await talkTo(bot, 'fq_glow_host', [0]);
  assert.ok(c.flags[WQ8.glowStart]);
  assert.equal(q(c, qd.name).find, 'fq_glow_v1');
  let msgs = await talkTo(bot, 'fq_glow_fire');
  assert.ok(said(msgs, /話を聞こう/) && !battled(msgs, 'fq_frostlake'));
  for (const id of ['fq_glow_v1', 'fq_glow_v2', 'fq_glow_v3']) await talkTo(bot, id);
  assert.ok(GLOW_VOICES.every((k) => c.flags[k]) && q(c, qd.name).find === 'fq_glow_fire');
  const ans = GLOW_PLAN.map((x) => x.ans);
  msgs = await talkTo(bot, 'fq_glow_fire', ans);
  assert.ok(said(msgs, /炎術士の人が、パーティーに/) && !c.flags[GLOW_STEPS[0]]);
  c.job = 'rekka'; // 炎術士 → 八竜の炎術士・烈火
  msgs = await talkTo(bot, 'fq_glow_fire', [wrong(ans[0])]);
  assert.ok(!c.flags[GLOW_STEPS[0]] && !battled(msgs, 'fq_frostlake'), '1つ目の まちがい（まだ 戦わない）');
  msgs = await talkTo(bot, 'fq_glow_fire', [ans[0], wrong(ans[1])]);
  assert.ok(c.flags[GLOW_STEPS[0]] && battled(msgs, 'fq_frostlake') && c.flags[WQ8.glowFight] && !c.flags[GLOW_STEPS[1]], 'とかして 戦った・2つ目で まちがい');
  c.job = 'enjutsushi';
  msgs = await talkTo(bot, 'fq_glow_fire', [ans[1], wrong(ans[2])]);
  assert.ok(!battled(msgs, 'fq_frostlake') && c.flags[GLOW_STEPS[1]] && !c.flags[GLOW_STEPS[2]] && said(msgs, /火の粉/), '2回目は 戦わない・3つ目で まちがい');
  msgs = await talkTo(bot, 'fq_glow_fire', [ans[2]]);
  assert.ok(c.flags[WQ8.glowLit] && said(msgs, /いい火だ/));
  assert.ok(!shows('fq_glow_fire', c) && shows('fq_glow_lit', c), 'かがり火が ともった');
  assert.ok(q(c, qd.name).ready && q(c, qd.name).who === 'fq_glow_host');
  c.job = 'warrior';
  await rewarded(c, qd, () => talkTo(bot, 'fq_glow_host'));
  assert.ok(said(await talkTo(bot, 'fq_glow_lit'), /ゆれている/));
});

// ───── 38. 道 ─────
test('星ふるえで、通れなくなった道: 3人の話 → 作戦を立てる・丸太のころ → 岩もぐらと戦う（1回だけ）→ 急ぐ物から（やり直し）→ 道があく → ごほうび。軍師の流れ（つりをする道士）がいないと まとまらない', async () => {
  const { bot, c } = await setup(903, { job: 'mage', flags: OPEN });
  const qd = W.road;
  assert.ok(shows('fq_road_rock', c));
  await talkTo(bot, 'fq_road_host', [0]);
  assert.ok(c.flags[WQ8.roadStart]);
  assert.equal(q(c, qd.name).find, 'fq_road_v1');
  let msgs = await talkTo(bot, 'fq_road_rock');
  assert.ok(said(msgs, /話を聞こう/) && !battled(msgs, 'fq_roadmole'));
  for (const id of ['fq_road_v1', 'fq_road_v2', 'fq_road_v3']) await talkTo(bot, id);
  assert.ok(ROAD_VOICES.every((k) => c.flags[k]) && q(c, qd.name).find === 'fq_road_rock');
  const ans = ROAD_PLAN.map((x) => x.ans);
  msgs = await talkTo(bot, 'fq_road_rock', ans);
  assert.ok(said(msgs, /つりをする道士の人が、パーティーに/) && !c.flags[ROAD_STEPS[0]]);
  c.job = 'hoshin_gunshi'; // つりをする道士 → … → ほう神の大軍師
  msgs = await talkTo(bot, 'fq_road_rock', [2]);
  assert.ok(!c.flags[ROAD_STEPS[0]] && said(msgs, /魚は、つれた/), '1つ目の まちがい（つりをして待つ）');
  c.job = 'taikobo';
  msgs = await talkTo(bot, 'fq_road_rock', [ans[0], wrong(ans[1])]);
  assert.ok(c.flags[ROAD_STEPS[0]] && !c.flags[ROAD_STEPS[1]] && !battled(msgs, 'fq_roadmole'), '2つ目で まちがい（まだ 戦わない）');
  msgs = await talkTo(bot, 'fq_road_rock', [ans[1], 0]);
  assert.ok(c.flags[ROAD_STEPS[1]] && battled(msgs, 'fq_roadmole') && c.flags[WQ8.roadFight] && !c.flags[ROAD_STEPS[2]] && said(msgs, /ねつを出した子/), 'ころで どかして 戦った・3つ目で まちがい');
  c.job = 'fishing_doshi';
  msgs = await talkTo(bot, 'fq_road_rock', [ans[2]]);
  assert.ok(!battled(msgs, 'fq_roadmole'), '2回目は 戦わない');
  assert.ok(c.flags[WQ8.roadOpen] && said(msgs, /作戦どおり/) && !shows('fq_road_rock', c), '大岩が どいた');
  assert.ok(q(c, qd.name).ready && q(c, qd.name).who === 'fq_road_host');
  c.job = 'warrior';
  await rewarded(c, qd, () => talkTo(bot, 'fq_road_host'));
  assert.ok(said(await talkTo(bot, 'fq_road_v3'), /丸太、役に立った/));
});

// ───── 地図の しるし・ヒント・困っている人 ─────
test('受けた たのまれごとは クエストの 画面・地図の しるし・「はなす」の ヒント。困っている人は c9_starfall の あとから', () => {
  const all = { flags: Object.fromEntries([...OPEN, ...WORK8_QUESTS.map((x) => x.start)].map((f) => [f, true])), items: [], keyItems: [] };
  const list = subQuests(all).filter((x) => WORK8_QUESTS.some((w) => w.name === x.name));
  assert.equal(list.length, 3);
  for (const x of list) {
    assert.ok(npcAnywhere(x.who), `${x.name}: ${x.who}`);
    if (x.find) assert.ok(npcAnywhere(x.find), `${x.name}: ${x.find}`);
    assert.ok(x.text && x.hint, x.name);
    assert.deepEqual(checkText(x.text + x.hint).filter((p) => p.kind !== 'kana'), [], x.name);
  }
  for (const qd of WORK8_QUESTS) {
    const map = npcAnywhere(qd.npc).map;
    assert.ok(questMarks(all, map, '').some((m) => m.label === qd.name), `${qd.id}: 地図の しるし`);
    const h = subQuestHint(`fq_${qd.id}`);
    assert.ok(h && h.board && h.npc === qd.npc && h.roots === qd.roots && h.open.includes('c9_starfall'), `${qd.id}: 困っている人`);
  }
  assert.ok(WORK8_QUESTS.some((qd) => sideQuestHint(all).includes(qd.name)), '「はなす」の ヒント');
  assert.ok(!availableSubQuests(all).some((h) => WORK8_QUESTS.some((qd) => h.id === `fq_${qd.id}`)), '受けたら 困っている人から 消える');
  const none = { flags: Object.fromEntries(OPEN.map((f) => [f, true])), items: [], keyItems: [] };
  for (const qd of WORK8_QUESTS) {
    assert.ok(!q(none, qd.name), qd.id);
    assert.ok(!questMarks(none, npcAnywhere(qd.npc).map, '').some((m) => m.label === qd.name), `${qd.id}: 受ける 前は しるし なし`);
  }
  const ids = (c) => availableSubQuests(c).filter((h) => h.board).map((h) => h.id);
  const f = Object.fromEntries(BEFORE.map((k) => [k, true]));
  assert.equal(ids({ flags: f }).length, 35, 'c9_starfall の 前は 35');
  assert.equal(ids({ flags: { ...f, c9_starfall: true } }).length, 38, 'c9_starfall の あとは 38');
});

// ───── お仕事いらい板: 38まい・7ページ ─────
test('お仕事いらい板: c9_starfall の 前は 35まい（6ページ）・あとは 38まい（7ページ。7ページ目は 37・38 の 2まい）。7ページ目の はり紙を 読んで 受けると 地図に しるし', async () => {
  const before = { flag: (k) => BEFORE.includes(k) };
  const after = { flag: (k) => OPEN.includes(k) };
  assert.equal(boardList(before).length, 35);
  assert.equal(boardPages(before), 6);
  assert.equal(boardList(after).length, 38);
  assert.equal(boardPages(after), 7);
  assert.equal(boardPages(), 7);
  const { bot, c } = await setup(904, { flags: OPEN });
  const qd = W.road;
  const map = npcAnywhere(qd.npc).map;
  const marked = () => questMarks(c, map, '').some((m) => m.label === qd.name);
  assert.ok(!marked() && !q(c, qd.name));
  // 1→…→6ページ（つぎ 6 を 5回）→ 6ページ目の つぎ（6）→ 7ページ目の 2まい目（道。1）→ 読む →「うける？」はい（0）→ 7ページ目に もどる → やめる（3）
  const msgs = await talkTo(bot, 'fq_board', [6, 6, 6, 6, 6, 6, 1, 0, 3]);
  const menus = msgs.filter((m) => m.t === 'script' && m.steps.at(-1)?.[0] === 'choice').map((m) => m.steps.at(-1));
  assert.ok(said(msgs, /はり紙は38まい/));
  assert.match(menus[5][1], /6\/7ページ/);
  assert.deepEqual(menus[5][2], [...FAMILY_QUESTS.slice(30, 36).map((x) => x.name), 'つぎのページへ', '前のページへ', 'やめる']);
  assert.match(menus[6][1], /7\/7ページ/);
  assert.deepEqual(menus[6][2], [...FAMILY_QUESTS.slice(36).map((x) => x.name), '前のページへ', 'やめる']);
  assert.equal(menus[6][3].length, menus[6][2].length, 'カーソルの せつめいも 同じ 数');
  assert.match(menus[6][3][1], /^必要な職業：つりをする道士の系統（×いない）/);
  assert.ok(said(msgs, /道が通れなくなった/) && said(msgs, /このいらいを、うける？/) && said(msgs, /を受けた！/));
  assert.ok(c.flags[takeFlag(qd)] && !c.flags[qd.start]);
  assert.match(menus[8][1], /7\/7ページ/, '読んだら 7ページ目に もどる');
  assert.equal(menus[8][2][1], `${qd.name}（受けている）`);
  const pop = menus[7].find((v) => v && typeof v === 'object' && !Array.isArray(v) && v.paper);
  assert.ok(pop && pop.name === qd.name && pop.paper === qd.paper && pop.jobs.includes('太公望') && pop.gold === qd.reward.gold, '大きな はり紙');
  const e = q(c, qd.name);
  assert.ok(e && e.who === qd.npc && /ガンテに会おう/.test(e.text) && e.hint.includes(qd.where), 'クエストの 画面');
  assert.ok(marked(), '受けたら 地図に しるし');
  await talkTo(bot, qd.npc, [0]);
  assert.ok(c.flags[qd.start] && q(c, qd.name).find === 'fq_road_v1');
  assert.ok(!bot.s.busy);
});

// ───── 戦いの 強さ ─────
test('戦い: 新しい 2つ（敵Lv96）は 第3部の はじめ（Lv95〜98）の 4人・2人・その 流れの ひとりでも 完全オートで 勝てる（ボスほど強くない）', () => {
  // その 流れの 人（いないと 戦わない）は 武闘家・魔法使いの 装備で その 職業に する
  const as = (base, job, lv, name) => {
    const c = makeChar(base, lv, 10, name, 58);
    c.jobs[job] = { ...c.jobs[base] };
    c.job = job;
    fullHeal(c);
    return c;
  };
  const line = { fq_frostlake: ['monk', 'enjutsushi'], fq_roadmole: ['mage', 'taikobo'] };
  for (const id of ['fq_frostlake', 'fq_roadmole']) {
    const e = FIXED_ENCOUNTERS[id];
    assert.ok(e && !e.boss && e.canFlee === false && e.enemyLv === 96 && !(e.enemyPow > 1), id);
    for (const [sp] of e.group) assert.ok(MONSTER_ART[sp], `${sp} の 絵`);
    for (const jobs of [['warrior', 'priest', 'mage', 'monk'], ['warrior', 'priest'], ['warrior'], ['priest'], ['monk'], ['line'], ['line', 'mage']]) {
      let win = 0;
      for (let i = 0; i < 6; i++) {
        const lv = 95 + (i % 4);
        const party = jobs.map((j, k) => (j === 'line' ? as(...line[id], lv, `p${k}`) : makeChar(j, lv, 10, `p${k}`, 58)));
        const r = runBattle(party, e.group.flatMap(([sp, n]) => Array(n).fill(sp)), { seed: 90 + i * 7919, enemyLv: e.enemyLv, enemyPow: e.enemyPow });
        if (r.outcome === 'win') win++;
      }
      assert.ok(win >= 6, `${id} ${jobs.join('・')} 勝ち ${win}/6`);
    }
  }
});

// ───── 漢字 ─────
test('漢字: 新しい ファイルは gameFiles() に 入っていて、使えない 漢字・スペースが ない', () => {
  const files = ['shared/data/sidequests-work8.js', 'shared/maps/work-quests8.js', 'client/render/work8-art.js'].map((f) => gameFiles().find((g) => g.endsWith('/public/js/' + f)));
  assert.ok(files.every(Boolean), 'gameFiles() に 入っている');
  const bad = [];
  for (const f of files) for (const p of checkFile(f)) if (p.kind !== 'kana') bad.push(`${f.split('/').pop()}:${p.line} [${p.kind} ${p.detail}] ${p.text}`);
  assert.deepEqual(bad, []);
  for (const qd of WORK8_QUESTS) for (const t of [qd.name, qd.paper, qd.who, qd.where, qd.job]) assert.deepEqual(checkText(t).filter((p) => p.kind !== 'kana'), [], t);
});
