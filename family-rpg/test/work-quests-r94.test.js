// 第94回 D班: お仕事いらい 42・43（docs/plan-part3-c10a.md の 13-7 の D班）。新しい 流れの 職業で、まだ たのまれごとが なかった さいごの 2つ
// 42. 地下の川の、大なまず（サムライ小ぞうの 流れ: サムライ小ぞう → 雷神けんの剣士 → ヤイバ → 竜神けんのサムライ。c9_act3 から）・
// 43. ピラミッドの岸の、夜なかのゴーン（無差別格闘流の 流れ: 無差別格闘流の門下生 → 早おとめ乱馬 → 飛竜しょう天はの達人。c9_act4 から）
// 受けて → なぞ（その場で やり直し・2回 まちがえたら はじめから）→ 戦い → ごほうび・職業の しばり・ひとりで とける・1回だけ・
// 第3幕・第4幕の クリアの あとから（はり紙も 人も）・地下の川の 岸だけ（星のはかばには 置かない）・フラグは 1つに 2こ・
// 地図の しるし・困っている人・漢字・軽い 戦い・お仕事いらい板: 43まい・8ページ（c9_act3 の 前は 41まい・c9_act4 の 前は 42まい）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MAPS, isBlocked, condOk } from '../public/js/shared/maps/index.js';
import { SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { JOBS, jobAncestry } from '../public/js/shared/data/jobs.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { FAMILY_QUESTS, boardPage, boardInfo, boardPages, boardList, takeFlag, rewardNames } from '../public/js/shared/data/sidequests-family.js';
import { WORK9_QUESTS } from '../public/js/shared/data/sidequests-work9.js';
import { WORK10_QUESTS, WORK10_SCRIPTS, WORK10_STORY_SCRIPTS, workSubQuests10, NAMAZU_PLAN, GONG_PLAN } from '../public/js/shared/data/sidequests-work10.js';
import { WQ10, WQ10_OPEN, WORK10_NPC_IDS } from '../public/js/shared/maps/work-quests10.js';
import { C9A_LINE } from '../public/js/shared/maps/c9a-flags.js';
import { C9B_LINE } from '../public/js/shared/maps/c9b-flags.js';
import { C9C, C9C_LINE } from '../public/js/shared/maps/c9c-flags.js';
import { C9D, C9D_LINE } from '../public/js/shared/maps/c9d-flags.js';
import { RIVER_POS } from '../public/js/shared/maps/c9c-rows.js';
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

// 第2部の さいごまで・第3部 第1章 第1幕・第2幕・第3幕（c9_act3 の 前 ／ あと）・第4幕（c9_act4 の 前 ／ あと）
const PART2 = [...CLEAR, 'c6_clear', 'c7_karim', 'c7_kingdom', 'c7_clear', 'c8_start', 'c8_kingdom', 'c8_jafar', 'c8_sea', 'c8_abyss', 'c8_hades', 'c8_sky', 'c8_spring',
  'c8_fortress', 'c8_bowser', 'c8_rift', 'c8_hall', 'c8_solitus'];
const ACT2 = [...PART2, ...C9A_LINE, ...C9B_LINE];
const BEFORE3 = [...ACT2, ...C9C_LINE.filter((f) => f !== C9C.act3)];
const OPEN3 = [...ACT2, ...C9C_LINE];
const BEFORE4 = [...OPEN3, ...C9D_LINE.filter((f) => f !== C9D.act4)];
const OPEN4 = [...OPEN3, ...C9D_LINE];
const q = (c, name) => subQuests(c).find((x) => x.name === name);
const W = Object.fromEntries(WORK10_QUESTS.map((x) => [x.id, x]));
const wrong = (ans) => (ans === 0 ? 1 : 0);
const wrong2 = (ans) => (ans === 2 ? 1 : 2);
const SRC = ['../public/js/shared/data/sidequests-work10.js', '../public/js/shared/maps/work-quests10.js'].map((f) => readFileSync(new URL(f, import.meta.url), 'utf8')).join('\n');

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
test('しくみ: 2つの 新しい たのまれごと（さいごの 2系統）・地下の川の 岸だけ（はかばには 置かない）・42 は c9_act3・43 は c9_act4 の あとだけ・フラグは 1つに 2こ', () => {
  assert.equal(WORK10_QUESTS.length, 2);
  assert.equal(FAMILY_QUESTS.length, 43);
  assert.deepEqual(FAMILY_QUESTS.slice(41), WORK10_QUESTS);
  assert.deepEqual(FAMILY_QUESTS.slice(38, 41), WORK9_QUESTS);
  assert.deepEqual(WORK10_QUESTS.map((x) => x.roots), [['samurai_kid'], ['musabetsu_student']]);
  assert.deepEqual(WORK10_QUESTS.map((x) => x.legend), ['ryujin_samurai', 'hiryu_master']);
  assert.deepEqual(WQ10_OPEN, { namazu: 'c9_act3', gong: 'c9_act4' });
  assert.deepEqual(Object.values(WQ10).sort(), WORK10_QUESTS.flatMap((x) => [x.start, x.done]).sort());
  for (const qd of WORK10_QUESTS) {
    const L = jobLine(qd.roots);
    for (const id of Object.keys(JOBS)) assert.equal(L.has(id), qd.roots.some((r) => jobAncestry(id).has(r)), `${qd.id} ${id}`);
    assert.ok(JOBS[qd.legend].tier === 3 && L.has(qd.legend), `${qd.id}: ${qd.legend}`);
    assert.equal(qd.roots.map((r) => JOBS[r].name).join('か'), qd.job, qd.id);
    assert.ok(qd.who && qd.where && qd.paper && qd.town && qd.npc, qd.id);
    assert.deepEqual(qd.open, [WQ10_OPEN[qd.id]], qd.id);
    assert.ok(npcAnywhere(qd.npc), `${qd.id}: ${qd.npc}`);
  }
  // 新しい 8系統（第82〜85回）の 入り口: 前の いらいに 入り口が ない 物は この 2つだけ だった（これで 8系統 ぜんぶ）
  const NEW8 = ['hanyo_boy', 'samurai_kid', 'fishing_doshi', 'elem_teacher', 'musabetsu_student', 'furyo', 'enjutsushi', 'tabi_madoshi'];
  const older = FAMILY_QUESTS.slice(0, 41);
  const fresh = NEW8.filter((r) => !older.some((b) => b.roots.includes(r)));
  assert.deepEqual(fresh, ['samurai_kid', 'musabetsu_student']);
  assert.deepEqual(NEW8.filter((r) => !FAMILY_QUESTS.some((b) => b.roots.includes(r) || jobLine(b.roots).has(r))), [], '8系統 ぜんぶに いらいが ある');
  for (const a of WORK10_QUESTS) {
    assert.ok(!older.some((b) => b.legend === a.legend), a.id);
    for (const b of older) for (const r of b.roots) assert.ok(!jobLine(a.roots).has(r), `${a.id} と ${b.id}`);
  }
  assert.deepEqual([...jobLine(W.namazu.roots)].filter((j) => jobLine(W.gong.roots).has(j)), []);
  // 場所（地下の川。42 は 川の はじめの 岸・43 は ピラミッドの 岸）。はかば・第2章・ほかの マップには 置かない
  const m = MAPS.c9c_river;
  for (const id of WORK10_NPC_IDS) {
    const { map, n } = npcAnywhere(id);
    assert.equal(map, 'c9c_river', id);
    const x = Math.floor(n.x), y = Math.floor(n.y);
    if (id.startsWith('fq_namazu_')) assert.ok(x <= 3 && y >= 16 && y <= 20, `${id} は 川の はじめの 岸`);
    else assert.equal(m.areaName(x, y), 'ピラミッドの岸', id);
  }
  for (const mm of Object.values(MAPS)) if (mm.id !== 'c9c_river') assert.ok(!mm.npcs.some((n) => WORK10_NPC_IDS.includes(n.id)), mm.id);
  assert.deepEqual(MAPS.c9d_grave.npcs.map((n) => n.id).sort(), ['c9d_mu_play', 'c9d_mu_sit', 'c9d_mumu_sit'], 'はかばには 人を 足さない');
  // 出る 時（42 は c9_act3・43 は c9_act4。前は 出ない・話しても 受けられない）
  for (const id of WORK10_NPC_IDS) {
    const at = npcAnywhere(id);
    const k = id.startsWith('fq_namazu_') ? 'namazu' : 'gong';
    const before = k === 'namazu' ? BEFORE3 : BEFORE4;
    const after = k === 'namazu' ? OPEN3 : OPEN4;
    assert.equal(condOk(at.n.show, (f) => before.includes(f)), false, `${id} は 前は 出ない`);
    assert.equal(condOk(at.n.show, (f) => after.includes(f)), true, `${id} は あとに 出る`);
    assert.ok(SCRIPTS[at.n.script] && SCRIPTS[at.n.script] === WORK10_SCRIPTS[at.n.script], `${id} の だいほん`);
  }
  assert.equal(condOk(npcAnywhere('fq_gong_host').n.show, (f) => OPEN3.includes(f)), false, '43 は c9_act3 だけでは 出ない');
  for (const qd of WORK10_QUESTS) {
    const before = qd.id === 'namazu' ? BEFORE3 : BEFORE4;
    const pre = { flag: (f) => before.includes(f), has: () => false, count: () => 0, night: false, name: 'ソラ', c: { job: qd.legend } };
    assert.ok(!JSON.stringify(SCRIPTS[qd.npc](pre)).includes('"choice"'), `${qd.id} は 受けられない`);
  }
  assert.deepEqual(workSubQuests10({ flags: {} }, () => false), []);
  for (const id of WORK10_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id), id);
  // 人は 立てる 所・人の 絵・物の 絵・ほかの 人と かさならない
  for (const id of WORK10_NPC_IDS) {
    const { map, n } = npcAnywhere(id);
    assert.ok(!isBlocked({ ...MAPS[map], npcs: [] }, Math.floor(n.x), Math.floor(n.y), () => true), `${id} の 場所`);
    assert.ok(!MAPS[map].warpAt.has(Math.floor(n.y) * MAPS[map].w + Math.floor(n.x)), `${id} は ワープの 上に いない`);
    if (n.sprite.startsWith('mon:')) assert.ok(MONSTER_ART[n.sprite.slice(4)], `${id} の 絵`);
    else assert.ok(npcOpts(n.sprite) || CH6_SPECIALS.includes(n.sprite), `${id} の みため（地下の民の 絵）`);
    assert.ok(!MAPS[map].npcs.some((o) => o !== n && Math.floor(o.x) === Math.floor(n.x) && Math.floor(o.y) === Math.floor(n.y)), `${id} は ほかの 人と かさならない`);
  }
  // 第1章より 先の 物語・ひみつ・カイ・ソリトゥス・大きな くぼみ・第2章は 書かない
  assert.ok(!/ソリトゥス|カイ|くぼみ|アルゴル|少年|星の子|空から|c10_|炎の山|ささやき/.test(SRC), '物語の 先・ひみつ');
});

test('ごほうび: 第64回の きまり（★5の 装備なし・乗り物なし）・素材や 道具・ゴールド・小さなメダル・はり紙と 同じ', () => {
  for (const qd of WORK10_QUESTS) {
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

// ───── 42. 大なまず ─────
test('地下の川の、大なまず: 受ける → サムライ小ぞうの流れがいないと こらしめられない → むしゃぶるい・ハラへった・めん！（その場で やり直し・2回で はじめから）→ 大なまずと 戦う → ごほうび（1回だけ）', async () => {
  const { bot, c } = await setup(941, { job: 'priest', flags: OPEN3 });
  const qd = W.namazu;
  assert.ok(said(await talkTo(bot, 'fq_namazu_v1'), /何十年/), '受ける 前は ふだんの ことば');
  await talkTo(bot, 'fq_namazu_host', [0]);
  assert.ok(c.flags[WQ10.namazuStart]);
  assert.equal(q(c, qd.name).find, 'fq_namazu_spot');
  assert.ok(said(await talkTo(bot, 'fq_namazu_v1'), /大きな声に、びっくりして/), '話は ヒント');
  assert.ok(said(await talkTo(bot, 'fq_namazu_v2'), /わくわくしてふるえる/), '話は ヒント');
  const ans = NAMAZU_PLAN.map((x) => x.ans);
  let msgs = await talkTo(bot, 'fq_namazu_spot', ans);
  assert.ok(said(msgs, /サムライ小ぞうの人が、パーティーに/) && !said(msgs, /どうやって、こらしめる/) && !c.flags[qd.done]);
  c.job = 'ryujin_samurai'; // サムライ小ぞう → … → 竜神けんのサムライ
  msgs = await talkTo(bot, 'fq_namazu_spot', [wrong(ans[0]), wrong2(ans[0])]);
  assert.ok(said(msgs, /もう一度、考えてみよう/) && said(msgs, /思い出してから/) && !said(msgs, /力が出ない/) && !battled(msgs, ''), '2回 まちがえたら はじめから');
  c.job = 'yaiba';
  msgs = await talkTo(bot, 'fq_namazu_spot', [ans[0], wrong(ans[1]), ans[1], ans[2]]);
  assert.ok(said(msgs, /むしゃぶるいだ/) && said(msgs, /ハラへった/) && said(msgs, /めーーん/), '1回 まちがえても その場で やり直せる');
  assert.ok(battled(msgs, 'fq_namazu') && said(msgs, /ヌシじゃ/), '大なまずと 戦って こらしめた');
  assert.ok(c.flags[qd.done] && labDoneQuests(c).includes(qd.name) && !q(c, qd.name));
  assert.ok(said(await talkTo(bot, 'fq_namazu_spot'), /起こしてある/));
  assert.ok(said(await talkTo(bot, 'fq_namazu_host'), /すいすい/));
});

test('大なまずの ごほうび: 素材・道具・ゴールド・メダル。1回だけ（サムライ小ぞう ひとりでも とける）', async () => {
  const { bot, c } = await setup(942, { job: 'samurai_kid', flags: OPEN3 });
  await talkTo(bot, 'fq_namazu_host', [0]);
  await rewarded(c, W.namazu, () => talkTo(bot, 'fq_namazu_spot', NAMAZU_PLAN.map((x) => x.ans)), () => talkTo(bot, 'fq_namazu_host'));
});

// ───── 43. 夜なかの ゴーン ─────
test('ピラミッドの岸の、夜なかのゴーン: 水をかぶる・かわしてける → つりばしヤギと戦う → どげざ（戦いの あとは まちがえても すすむ）→ ごほうび（1回だけ）。無差別格闘流の流れがいないと 追いつけない', async () => {
  const { bot, c } = await setup(943, { job: 'mage', flags: OPEN4 });
  const qd = W.gong;
  await talkTo(bot, 'fq_gong_host', [0]);
  assert.ok(c.flags[WQ10.gongStart] && q(c, qd.name).find === 'fq_gong_spot');
  assert.ok(said(await talkTo(bot, 'fq_gong_v1'), /速い人じゃないと/));
  assert.ok(said(await talkTo(bot, 'fq_gong_v2'), /ひらりと、かわす/));
  const ans = GONG_PLAN.map((x) => x.ans);
  let msgs = await talkTo(bot, 'fq_gong_spot', ans);
  assert.ok(said(msgs, /無差別格闘流の門下生の人が、パーティーに/) && !battled(msgs, ''));
  c.job = 'hiryu_master'; // 無差別格闘流の門下生 → … → 飛竜しょう天はの達人
  msgs = await talkTo(bot, 'fq_gong_spot', [ans[0], 0, 2]);
  assert.ok(said(msgs, /水のすがたなら/) && !battled(msgs, '') && !c.flags[qd.done], '頭つきを 2回 まちがえたら はじめから（まだ 戦わない）');
  c.job = 'ranma';
  msgs = await rewarded(c, qd, () => talkTo(bot, 'fq_gong_spot', [ans[0], ans[1], 0, 1]), async () => {
    const m = await talkTo(bot, 'fq_gong_spot');
    assert.ok(said(m, /古いなべが/) && !battled(m, ''), '1回だけ');
  });
  assert.ok(battled(msgs, 'fq_goatgong') && said(msgs, /かわいそうだ/) && said(msgs, /ちゃんと、あやまろう/) && said(msgs, /ごめんなさーい/), '戦いの あとの なぞは、まちがえても すすむ');
  assert.ok(said(msgs, /昼の間なら/));
  assert.ok(said(await talkTo(bot, 'fq_gong_host'), /ぐっすり/));
});

test('夜なかのゴーンの ごほうび: 無差別格闘流の門下生 ひとりでも とける', async () => {
  const { bot, c } = await setup(944, { job: 'monk', flags: OPEN4 });
  c.job = 'musabetsu_student'; // 上級職（武闘家 ＋ 遊び人）なので、作った あとで かえる
  await talkTo(bot, 'fq_gong_host', [0]);
  await rewarded(c, W.gong, () => talkTo(bot, 'fq_gong_spot', GONG_PLAN.map((x) => x.ans)), () => talkTo(bot, 'fq_gong_host'));
});

// ───── 道を ふさがない ─────
test('道を ふさがない: 川の はじめの 岸の 人・物を 置いても、さんばし・里への 出口・立てふだに 行ける。ピラミッドの 岸の とびら・ひびきの石・ピラミッドの 入口にも 行ける', () => {
  const m = MAPS.c9c_river;
  for (const flags of [OPEN3, OPEN4, [...OPEN4, ...Object.values(WQ10)]]) {
    const has = (f) => flags.includes(f);
    const tiles = m.tiles.slice();
    for (const n of m.npcs) if (n.solid !== false && condOk(n.show, has)) tiles[Math.floor(n.y) * m.w + Math.floor(n.x)] = tiles[0];
    const solid = { ...m, tiles };
    const near = (seen, x, y) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has(`${x + dx},${y + dy}`));
    // 歩いて とどく 所（流れは 考えない。岸の 中だけ）
    const walk = (sx, sy) => {
      const seen = new Set([`${sx},${sy}`]);
      const qq = [[sx, sy]];
      while (qq.length) {
        const [x, y] = qq.shift();
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
          if (seen.has(k) || isBlocked(solid, nx, ny, has)) continue;
          seen.add(k);
          qq.push([nx, ny]);
        }
      }
      return seen;
    };
    // 川の はじめ: 里への 出口（ワープ）・立てふだ・いらいの 人と 物
    const a = walk(RIVER_POS.startDock.x + 2, RIVER_POS.startDock.y);
    assert.ok(a.has(`${RIVER_POS.startDock.x},${RIVER_POS.startDock.y}`), '里への 出口');
    assert.ok(a.has(`${RIVER_POS.start.x},${RIVER_POS.start.y}`), '川の はじめの ゆるい所');
    assert.ok(near(a, RIVER_POS.startPost.x, RIVER_POS.startPost.y), '立てふだ');
    // ピラミッドの 岸: 入口・立てふだ・とびらの 前・ひびきの石・石の 文字・いらいの 人と 物
    const b = walk(RIVER_POS.shore.x + 1, RIVER_POS.shore.y + 5);
    assert.ok(b.has(`${RIVER_POS.gate.x},${RIVER_POS.gate.y}`), 'ピラミッドの 入口');
    for (const [x, y] of [[86, 4], [85, 4], [87, 5], [84, 5], [88, 5], [86, 7], [85, 13]]) assert.ok(b.has(`${x},${y}`), `${x},${y}`);
    for (const id of WORK10_NPC_IDS) {
      const n = npcAnywhere(id).n;
      if (!condOk(n.show, has)) continue;
      assert.ok(near(a, Math.floor(n.x), Math.floor(n.y)) || near(b, Math.floor(n.x), Math.floor(n.y)), `${id} に とどく`);
    }
  }
});

// ───── 地図の しるし・ヒント・困っている人 ─────
test('受けた たのまれごとは クエストの 画面・地図の しるし・「はなす」の ヒント。困っている人は 42 が c9_act3・43 が c9_act4 の あとから', () => {
  const all = { flags: Object.fromEntries([...OPEN4, ...WORK10_QUESTS.map((x) => x.start)].map((f) => [f, true])), items: [], keyItems: [] };
  const list = subQuests(all).filter((x) => WORK10_QUESTS.some((w) => w.name === x.name));
  assert.equal(list.length, 2);
  for (const x of list) {
    assert.ok(npcAnywhere(x.who) && npcAnywhere(x.find), x.name);
    assert.ok(x.text && x.hint, x.name);
    assert.deepEqual(checkText(x.text + x.hint).filter((p) => p.kind !== 'kana'), [], x.name);
  }
  for (const qd of WORK10_QUESTS) {
    assert.ok(questMarks(all, 'c9c_river', '').some((m) => m.label === qd.name), `${qd.id}: 地図の しるし`);
    const h = subQuestHint(`fq_${qd.id}`);
    assert.ok(h && h.board && h.npc === qd.npc && h.roots === qd.roots && h.open.includes(WQ10_OPEN[qd.id]), `${qd.id}: 困っている人`);
  }
  assert.ok(WORK10_QUESTS.some((qd) => sideQuestHint(all).includes(qd.name)), '「はなす」の ヒント');
  assert.ok(!availableSubQuests(all).some((h) => WORK10_QUESTS.some((qd) => h.id === `fq_${qd.id}`)), '受けたら 困っている人から 消える');
  const ids = (flags) => availableSubQuests({ flags: Object.fromEntries(flags.map((k) => [k, true])) }).filter((h) => h.board).map((h) => h.id);
  assert.equal(ids(BEFORE3).length, 41, 'c9_act3 の 前は 41');
  assert.equal(ids(OPEN3).length, 42, 'c9_act3 の あとは 42');
  assert.ok(ids(OPEN3).includes('fq_namazu') && !ids(OPEN3).includes('fq_gong'));
  assert.equal(ids(BEFORE4).length, 42, 'c9_act4 の 前は 42');
  assert.equal(ids(OPEN4).length, 43, 'c9_act4 の あとは 43');
});

// ───── お仕事いらい板: 43まい・8ページ ─────
test('お仕事いらい板: c9_act3 の 前は 41まい（7ページ）・あとは 42まい（7ページ）・c9_act4 の あとは 43まい（8ページ。8ページ目は 43 の 1まい）。はり紙を 読んで 受けると 地図に しるし', async () => {
  const at = (L) => ({ flag: (k) => L.includes(k) });
  assert.deepEqual([BEFORE3, OPEN3, BEFORE4, OPEN4].map((L) => [boardList(at(L)).length, boardPages(at(L))]), [[41, 7], [42, 7], [42, 7], [43, 8]]);
  assert.equal(boardPages(), 8);
  assert.deepEqual(boardList(at(OPEN3)).slice(36).map((x) => x.id), [...FAMILY_QUESTS.slice(36, 41).map((x) => x.id), 'namazu']);
  const { bot, c } = await setup(945, { flags: OPEN4 });
  const qd = W.gong;
  const marked = () => questMarks(c, 'c9c_river', '').some((m) => m.label === qd.name);
  assert.ok(!marked() && !q(c, qd.name));
  // 1→…→7ページ（つぎ 6 を 7回）→ 8ページ目の 1まい目（ゴーン。0）→ 読む →「うける？」はい（0）→ 8ページ目に もどる → やめる（2）
  const msgs = await talkTo(bot, 'fq_board', [6, 6, 6, 6, 6, 6, 6, 0, 0, 2]);
  const menus = msgs.filter((m) => m.t === 'script' && m.steps.at(-1)?.[0] === 'choice').map((m) => m.steps.at(-1));
  assert.ok(said(msgs, /はり紙は43まい/));
  assert.match(menus[6][1], /7\/8ページ/);
  assert.deepEqual(menus[6][2].slice(0, 6), FAMILY_QUESTS.slice(36, 42).map((x) => x.name));
  assert.match(menus[7][1], /8\/8ページ/);
  assert.deepEqual(menus[7][2], [qd.name, '前のページへ', 'やめる']);
  assert.equal(menus[7][3].length, menus[7][2].length, 'カーソルの せつめいも 同じ 数');
  assert.match(menus[7][3][0], /^必要な職業：無差別格闘流の門下生の系統（×いない）/);
  assert.ok(said(msgs, /ゴーン、ゴーンと鳴って/) && said(msgs, /このいらいを、うける？/) && said(msgs, /を受けた！/));
  assert.ok(c.flags[takeFlag(qd)] && !c.flags[qd.start]);
  assert.match(menus[9][1], /8\/8ページ/, '読んだら 8ページ目に もどる');
  assert.equal(menus[9][2][0], `${qd.name}（受けている）`);
  const e = q(c, qd.name);
  assert.ok(e && e.who === qd.npc && /タプンに会おう/.test(e.text) && e.hint.includes(qd.where), 'クエストの 画面');
  assert.ok(marked(), '受けたら 地図に しるし');
  await talkTo(bot, qd.npc, [0]);
  assert.ok(c.flags[qd.start] && q(c, qd.name).find === 'fq_gong_spot');
  assert.ok(!bot.s.busy);
});

// ───── 戦いの 強さ ─────
test('戦い: 2つ（敵Lv100・102）は 第3幕・第4幕の あと（Lv100〜105）の 4人・2人・ひとり・その 流れの ひとりでも 完全オートで 勝てる（ボスほど 強くない）', () => {
  const as = (base, job, lv, name) => {
    const c = makeChar(base, lv, 10, name, 58);
    c.jobs[job] = { ...c.jobs[base] };
    c.job = job;
    fullHeal(c);
    return c;
  };
  const line = { fq_namazu: ['warrior', 'yaiba'], fq_goatgong: ['monk', 'ranma'] };
  const lv0 = { fq_namazu: 100, fq_goatgong: 102 };
  for (const id of ['fq_namazu', 'fq_goatgong']) {
    const e = FIXED_ENCOUNTERS[id];
    assert.ok(e && !e.boss && e.canFlee === false && e.enemyLv === lv0[id] && !(e.enemyPow > 1), id);
    for (const [sp] of e.group) assert.ok(MONSTER_ART[sp], `${sp} の 絵`);
    for (const jobs of [['warrior', 'priest', 'mage', 'monk'], ['warrior', 'priest'], ['warrior'], ['priest'], ['monk'], ['mage'], ['line'], ['line', 'mage']]) {
      let win = 0;
      for (let i = 0; i < 6; i++) {
        const lv = lv0[id] + (i % 4);
        const party = jobs.map((j, k) => (j === 'line' ? as(...line[id], lv, `p${k}`) : makeChar(j, lv, 10, `p${k}`, 58)));
        const r = runBattle(party, e.group.flatMap(([sp, n]) => Array(n).fill(sp)), { seed: 94 + i * 7919, enemyLv: e.enemyLv, enemyPow: e.enemyPow });
        if (r.outcome === 'win') win++;
      }
      assert.ok(win >= 6, `${id} ${jobs.join('・')} 勝ち ${win}/6`);
    }
  }
});

// ───── 漢字 ─────
test('漢字: 新しい ファイルは gameFiles() に 入っていて、使えない 漢字・スペースが ない', () => {
  const files = ['shared/data/sidequests-work10.js', 'shared/maps/work-quests10.js', 'client/render/work10-art.js'].map((f) => gameFiles().find((g) => g.endsWith('/public/js/' + f)));
  assert.ok(files.every(Boolean), 'gameFiles() に 入っている');
  const bad = [];
  for (const f of files) for (const p of checkFile(f)) if (p.kind !== 'kana') bad.push(`${f.split('/').pop()}:${p.line} [${p.kind} ${p.detail}] ${p.text}`);
  assert.deepEqual(bad, []);
  for (const qd of WORK10_QUESTS) for (const t of [qd.name, qd.paper, qd.who, qd.where, qd.job]) assert.deepEqual(checkText(t).filter((p) => p.kind !== 'kana'), [], t);
});
