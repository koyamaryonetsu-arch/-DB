// 第74回 D班: お仕事いらい 27〜29（docs/plan-ch8.md の 6-3）。第66回の 伝説の 職業に つながる 系統（18〜26 と かさならない）で とける たのまれごと
// 27. 海鳴りの小島の、かげぼうしどろぼう（ソードマスターか魔剣士 → 光と闇の剣神）・28. 北の海辺の、ハサミ団（黒の組織 → あの方）・
// 29. 白銀の湖の、ねむらない氷の像づくり（社ちく → 働き方改革の星）
// 受けて → すすめて → ごほうび・職業の しばり（いる／いない）・まちがえても やり直せる・ひとりで とける・ごほうびは 1回だけ・
// 第8章 第2幕の 千年前の 海に 着いた あとから（はり紙も 人も）・地図の しるし・困っている人・漢字・軽い 戦い（敵Lv84）・
// お仕事いらい板: 29まい・5ページ（c8_abyss の 前は 26まい・5ページの まま）・5ページ目から 受ける
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, isBlocked, condOk } from '../public/js/shared/maps/index.js';
import { SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { JOBS, jobAncestry } from '../public/js/shared/data/jobs.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { FAMILY_QUESTS, boardPage, boardInfo, boardPages, boardList, takeFlag, rewardNames } from '../public/js/shared/data/sidequests-family.js';
import { WORK3_QUESTS } from '../public/js/shared/data/sidequests-work3.js';
import { WORK4_QUESTS } from '../public/js/shared/data/sidequests-work4.js';
import { WORK5_QUESTS, WORK5_SCRIPTS, WORK5_STORY_SCRIPTS, workSubQuests5, SHD_PLAN, GANG_PLAN, ICE_PLAN } from '../public/js/shared/data/sidequests-work5.js';
import { WQ5, WQ5_OPEN, SHD_VOICES, SHD_STEPS, GANG_VOICES, GANG_STEPS, ICE_VOICES, ICE_STEPS, WORK5_NPC_IDS } from '../public/js/shared/maps/work-quests5.js';
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

// 第8章 第1幕の さいごまで（c8_kingdom の いらい 24〜26 は 出る）・第2幕の はじめ（c8_sea）
const KINGDOM = [...CLEAR, 'c7_karim', 'c7_kingdom', 'c7_clear', 'c8_start', 'c8_kingdom', 'c8_jafar', 'c8_sea'];
const OPEN = [...KINGDOM, WQ5_OPEN];
const q = (c, name) => subQuests(c).find((x) => x.name === name);
const W = Object.fromEntries(WORK5_QUESTS.map((x) => [x.id, x]));
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
test('しくみ: 3つの 新しい たのまれごと（第66回の 伝説の 職業に つながる 系統・18〜26 と かさならない）・今の 時代の まだ いらいの ない 場所・c8_abyss の あとだけ', () => {
  assert.equal(WORK5_QUESTS.length, 3);
  assert.equal(FAMILY_QUESTS.length, 29);
  assert.deepEqual(FAMILY_QUESTS.slice(26), WORK5_QUESTS);
  assert.deepEqual(FAMILY_QUESTS.slice(23, 26), WORK4_QUESTS);
  assert.deepEqual(WORK5_QUESTS.map((x) => x.roots), [['sword_master', 'magic_swordsman'], ['black_org'], ['shachiku']]);
  assert.deepEqual(WORK5_QUESTS.map((x) => x.legend), ['kenshin', 'ano_kata', 'hatarakikata']);
  for (const qd of WORK5_QUESTS) {
    const L = jobLine(qd.roots);
    for (const id of Object.keys(JOBS)) assert.equal(L.has(id), qd.roots.some((r) => jobAncestry(id).has(r)), `${qd.id} ${id}`);
    assert.ok(R66_LEGENDS.includes(qd.legend) && JOBS[qd.legend].tier === 3 && L.has(qd.legend), `${qd.id}: ${qd.legend}`);
    assert.equal(qd.roots.map((r) => JOBS[r].name).join('か'), qd.job, qd.id);
    assert.ok(qd.who && qd.where && qd.paper && qd.town && qd.npc, qd.id);
    assert.deepEqual(qd.open, ['c8_abyss'], qd.id);
    assert.ok(npcAnywhere(qd.npc), `${qd.id}: ${qd.npc}`);
  }
  // 伝説の 職業は 18〜26 と ちがう・系統も 18〜26 と、たがいにも かさならない（ちがう 職業の 人が 活きる）
  const older = [...WORK3_QUESTS, ...WORK4_QUESTS];
  for (const a of WORK5_QUESTS) {
    assert.ok(!older.some((b) => b.legend === a.legend), a.id);
    for (const b of [...WORK5_QUESTS, ...older]) if (a !== b) assert.ok(![...jobLine(a.roots)].some((j) => jobLine(b.roots).has(j)), `${a.id} と ${b.id}`);
  }
  // 光と闇の剣神・あの方は 1〜26 の どの たのまれごとの 系統とも かさならない（29 の 社ちくは 2 の 会社員の 系統の 先）
  for (const id of ['shd', 'gang']) for (const b of FAMILY_QUESTS.slice(0, 26)) assert.ok(![...jobLine(W[id].roots)].some((j) => jobLine(b.roots).has(j)), `${id} と ${b.id}`);
  // 場所（今の 時代。まだ たのまれごとが ない 所）
  const maps = { shd: 'sea', gang: 'south', ice: 'north' };
  const area = (id) => { const { map, n } = npcAnywhere(id); return MAPS[map].areaName?.(Math.floor(n.x), Math.floor(n.y)) || MAPS[map].name; };
  for (const qd of WORK5_QUESTS) assert.equal(npcAnywhere(qd.npc).map, maps[qd.id], qd.id);
  for (const id of WORK5_NPC_IDS.filter((x) => x.startsWith('fq_shd'))) assert.equal(area(id), '海鳴りの小島', id);
  for (const id of WORK5_NPC_IDS.filter((x) => x.startsWith('fq_gang'))) assert.equal(area(id), '北の海辺', id);
  for (const id of WORK5_NPC_IDS.filter((x) => x.startsWith('fq_ice'))) assert.equal(area(id), '白銀の湖', id);
  const olderAreas = FAMILY_QUESTS.slice(0, 26).map((x) => area(x.npc));
  for (const qd of WORK5_QUESTS) assert.ok(!olderAreas.includes(area(qd.npc)), `${qd.id}: はじめての 場所`);
  for (const m of Object.values(MAPS)) if (m.past || m.id.includes('past') || m.id.startsWith('c7') || m.id.startsWith('c8')) assert.ok(!m.npcs.some((n) => WORK5_NPC_IDS.includes(n.id)), m.id);
  // 海鳴りの小島の 洞窟の 入り口は ふさがない
  assert.ok(!MAPS.sea.npcs.some((n) => n.solid && Math.floor(n.x) === 18 && Math.floor(n.y) === 62));
  // c8_abyss の 前は 出ない・話しても 受けられない
  for (const id of WORK5_NPC_IDS) {
    const at = npcAnywhere(id);
    assert.ok(at, id);
    assert.equal(condOk(at.n.show, (f) => KINGDOM.includes(f)), false, `${id} は c8_abyss の 前は 出ない`);
    assert.ok(SCRIPTS[at.n.script], `${id} の だいほん`);
  }
  for (const id of WORK5_NPC_IDS.filter((x) => !['fq_gang_boss', 'fq_ice_dragon'].includes(x))) assert.equal(condOk(npcAnywhere(id).n.show, (f) => OPEN.includes(f)), true, `${id} は c8_abyss の あとに 出る`);
  const pre = { flag: (f) => KINGDOM.includes(f), has: () => false, count: () => 0, night: false, name: 'ソラ', c: { job: 'kenshin' } };
  for (const qd of WORK5_QUESTS) assert.ok(!JSON.stringify(SCRIPTS[qd.npc](pre)).includes('"choice"'), `${qd.id} は 受けられない`);
  assert.deepEqual(workSubQuests5({ flags: {} }, () => false, () => false), []);
  for (const id of Object.keys(WORK5_SCRIPTS)) assert.equal(SCRIPTS[id], WORK5_SCRIPTS[id], id);
  for (const id of WORK5_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id), id);
  // 人は 立てる 所（物は かたい NPC）・人の 絵・物の 絵
  for (const id of WORK5_NPC_IDS) {
    const { map, n } = npcAnywhere(id);
    assert.ok(!isBlocked(MAPS[map], Math.floor(n.x), Math.floor(n.y), () => true) || n.solid, `${id} の 場所`);
    if (n.sprite.startsWith('mon:')) assert.ok(MONSTER_ART[n.sprite.slice(4)], `${id} の 絵`);
    else assert.ok(npcOpts(n.sprite), `${id} の みため`);
  }
});

test('ごほうび: 第64回の きまり（★5の アクセサリーは 1つだけ・乗り物なし）・素材や 道具・ゴールド・小さなメダル・はり紙と 同じ', () => {
  const accs = WORK5_QUESTS.filter((x) => x.reward.item);
  assert.equal(accs.length, 1, '★5は 1つだけ');
  for (const qd of accs) {
    const it = ITEMS[qd.reward.item];
    assert.ok(it && it.type === 'acc' && starsFor(it) === 5 && it.src === 'gift' && !(it.price > 0), qd.id);
    // 闘技場 ランク10 の ブローチより 弱い・第73回の お守りと おなじ くらい
    const sum = (b) => Object.values(b).reduce((s, v) => s + v, 0);
    assert.ok(sum(it.bonus) < sum(ITEMS.ar_star_king_brooch.bonus) && sum(it.bonus) <= sum(ITEMS.fq_sand_amulet.bonus), qd.id);
  }
  for (const qd of WORK5_QUESTS) {
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

// ───── 27. かげぼうしどろぼう ─────
test('海鳴りの小島の、かげぼうしどろぼう: 3人の話 → 岩かげで月の夜（やり直し）→ かげの魔物と戦う → かげがもどる → ごほうび。ソードマスターか魔剣士がいないと戦えない', async () => {
  const { bot, c } = await setup(741, { job: 'warrior', flags: OPEN });
  const qd = W.shd;
  await talkTo(bot, 'fq_shd_host', [0]);
  assert.ok(c.flags[WQ5.shdStart]);
  assert.equal(q(c, qd.name).find, 'fq_shd_v1');
  let msgs = await talkTo(bot, 'fq_shd_cave');
  assert.ok(said(msgs, /話を聞こう/) && !battled(msgs, 'fq_shadownight'));
  for (const id of ['fq_shd_v1', 'fq_shd_v2', 'fq_shd_v3']) await talkTo(bot, id);
  assert.ok(SHD_VOICES.every((k) => c.flags[k]) && q(c, qd.name).find === 'fq_shd_cave');
  const ans = SHD_PLAN.map((x) => x.ans);
  msgs = await talkTo(bot, 'fq_shd_cave', ans);
  assert.ok(said(msgs, /ソードマスターか魔剣士の人が、パーティーに/) && !c.flags[SHD_STEPS[0]] && !battled(msgs, 'fq_shadownight'));
  c.job = 'kenshin'; // ソードマスター＋魔剣士 → 光と闇の剣神
  msgs = await talkTo(bot, 'fq_shd_cave', [wrong(ans[0])]);
  assert.ok(!c.flags[SHD_STEPS[0]] && said(msgs, /思い出そう/), '1つ目の まちがい');
  msgs = await talkTo(bot, 'fq_shd_cave', [ans[0], ans[1], wrong(ans[2])]);
  assert.ok(c.flags[SHD_STEPS[1]] && !c.flags[SHD_STEPS[2]] && !battled(msgs, 'fq_shadownight'), '3つ目で まちがい（戦わない）');
  c.job = 'magic_swordsman'; // 魔剣士でも つづきから
  msgs = await talkTo(bot, 'fq_shd_cave', [ans[2]]);
  assert.ok(battled(msgs, 'fq_shadownight') && c.flags[WQ5.shdGuard], '月の 夜に かげの 魔物と 戦った');
  assert.ok(q(c, qd.name).ready && q(c, qd.name).who === 'fq_shd_host');
  c.job = 'warrior'; // 報告は だれでも
  await rewarded(c, qd, () => talkTo(bot, 'fq_shd_host'));
});

// ───── 28. ハサミ団 ─────
test('北の海辺の、ハサミ団: かくれ岩（用心棒と戦う・だれでも）・3人の話 →「あの方」になって近づき方・名のり方・命令（やり直し）→ しお作り団 → ごほうび。黒の組織がいないと話せない', async () => {
  const { bot, c } = await setup(742, { job: 'priest', flags: OPEN });
  const qd = W.gang;
  await talkTo(bot, 'fq_gang_host', [0]);
  assert.ok(c.flags[WQ5.gangStart]);
  assert.equal(q(c, qd.name).find, 'fq_gang_den');
  let msgs = await talkTo(bot, 'fq_gang_den');
  assert.ok(battled(msgs, 'fq_crabguard') && c.flags[WQ5.gangFight], '用心棒と 戦った（だれでも）');
  assert.equal(q(c, qd.name).find, 'fq_gang_v1');
  msgs = await talkTo(bot, 'fq_gang_host');
  assert.ok(said(msgs, /今は0人/));
  msgs = await talkTo(bot, 'fq_gang_den');
  assert.ok(said(msgs, /話を聞こう/) && !battled(msgs, 'fq_crabguard'), '2回目は 戦わない');
  for (const id of ['fq_gang_v1', 'fq_gang_v2', 'fq_gang_v3']) await talkTo(bot, id);
  assert.ok(GANG_VOICES.every((k) => c.flags[k]) && q(c, qd.name).find === 'fq_gang_den');
  const ans = GANG_PLAN.map((x) => x.ans);
  msgs = await talkTo(bot, 'fq_gang_den', ans);
  assert.ok(said(msgs, /黒の組織の人が、パーティーに/) && !c.flags[GANG_STEPS[0]]);
  c.job = 'ano_kata'; // スパイ → … → 黒の組織 → あの方
  msgs = await talkTo(bot, 'fq_gang_den', [wrong(ans[0])]);
  assert.ok(!c.flags[GANG_STEPS[0]] && said(msgs, /思い出そう/), '1つ目の まちがい');
  msgs = await talkTo(bot, 'fq_gang_den', [ans[0], ans[1], wrong(ans[2])]);
  assert.ok(c.flags[GANG_STEPS[1]] && !c.flags[GANG_STEPS[2]] && !c.flags[WQ5.gangSolved], '3つ目で まちがい（2つ目までは 決まったまま）');
  c.job = 'black_org';
  msgs = await talkTo(bot, 'fq_gang_den', [ans[2]]);
  assert.ok(c.flags[WQ5.gangSolved] && said(msgs, /あの方の命令なら/));
  assert.ok(shows('fq_gang_boss', c) && !shows('fq_gang_v2', c), 'ハサミ団は しお作り団に');
  assert.ok(q(c, qd.name).ready && q(c, qd.name).who === 'fq_gang_host');
  c.job = 'warrior';
  await rewarded(c, qd, () => talkTo(bot, 'fq_gang_host'));
  assert.ok(said(await talkTo(bot, 'fq_gang_boss'), /しお作り/));
});

// ───── 29. ねむらない 氷の 像づくり ─────
test('白銀の湖の、ねむらない氷の像づくり: 3人の話 → 親方と話す（やり直し）→ 休むと決める → 氷の像まつり → ごほうび。社ちくがいないと話せない', async () => {
  const { bot, c } = await setup(743, { job: 'mage', flags: OPEN });
  const qd = W.ice;
  assert.ok(shows('fq_ice_block', c) && !shows('fq_ice_dragon', c));
  await talkTo(bot, 'fq_ice_host', [0]);
  assert.ok(c.flags[WQ5.iceStart]);
  assert.equal(q(c, qd.name).find, 'fq_ice_v1');
  let msgs = await talkTo(bot, 'fq_ice_boss');
  assert.ok(said(msgs, /みんなの話を聞いてみよう/) && !said(msgs, /まず何と言う/));
  for (const id of ['fq_ice_v1', 'fq_ice_v2', 'fq_ice_v3']) await talkTo(bot, id);
  assert.ok(ICE_VOICES.every((k) => c.flags[k]) && q(c, qd.name).find === 'fq_ice_boss');
  const ans = ICE_PLAN.map((x) => x.ans);
  msgs = await talkTo(bot, 'fq_ice_boss', ans);
  assert.ok(said(msgs, /社ちくの人が、パーティーに/) && !c.flags[ICE_STEPS[0]]);
  c.job = 'hatarakikata'; // 社ちく → ブラックきぎょうの星 → 働き方改革の星
  msgs = await talkTo(bot, 'fq_ice_boss', [ans[0], wrong(ans[1])]);
  assert.ok(c.flags[ICE_STEPS[0]] && !c.flags[ICE_STEPS[1]] && said(msgs, /休まんぞ/), '2つ目で まちがい');
  c.job = 'shachiku';
  msgs = await talkTo(bot, 'fq_ice_boss', [ans[1], ans[2]]);
  assert.ok(c.flags[WQ5.iceRest] && said(msgs, /定時だ/));
  assert.ok(q(c, qd.name).ready && q(c, qd.name).who === 'fq_ice_host');
  c.job = 'warrior';
  await rewarded(c, qd, () => talkTo(bot, 'fq_ice_host'));
  assert.ok(!shows('fq_ice_block', c) && shows('fq_ice_dragon', c), '氷の 竜の 像が できた');
});

// ───── 地図の しるし・ヒント・困っている人 ─────
test('受けた たのまれごとは クエストの 画面・地図の しるし・「はなす」の ヒント。困っている人は c8_abyss の あとから', () => {
  const all = { flags: Object.fromEntries([...OPEN, ...WORK5_QUESTS.map((x) => x.start)].map((f) => [f, true])), items: [], keyItems: [] };
  const list = subQuests(all).filter((x) => WORK5_QUESTS.some((w) => w.name === x.name));
  assert.equal(list.length, 3);
  for (const x of list) {
    assert.ok(npcAnywhere(x.who), `${x.name}: ${x.who}`);
    if (x.find) assert.ok(npcAnywhere(x.find), `${x.name}: ${x.find}`);
    assert.ok(x.text && x.hint, x.name);
    assert.deepEqual(checkText(x.text + x.hint).filter((p) => p.kind !== 'kana'), [], x.name);
  }
  for (const qd of WORK5_QUESTS) {
    const map = npcAnywhere(qd.npc).map;
    assert.ok(questMarks(all, map, '').some((m) => m.label === qd.name), `${qd.id}: 地図の しるし`);
    const h = subQuestHint(`fq_${qd.id}`);
    assert.ok(h && h.board && h.npc === qd.npc && h.roots === qd.roots && h.open.includes('c8_abyss'), `${qd.id}: 困っている人`);
  }
  assert.ok(WORK5_QUESTS.some((qd) => sideQuestHint(all).includes(qd.name)), '「はなす」の ヒント');
  assert.ok(!availableSubQuests(all).some((h) => WORK5_QUESTS.some((qd) => h.id === `fq_${qd.id}`)), '受けたら 困っている人から 消える');
  const none = { flags: Object.fromEntries(OPEN.map((f) => [f, true])), items: [], keyItems: [] };
  for (const qd of WORK5_QUESTS) {
    assert.ok(!q(none, qd.name), qd.id);
    assert.ok(!questMarks(none, npcAnywhere(qd.npc).map, '').some((m) => m.label === qd.name), `${qd.id}: 受ける 前は しるし なし`);
  }
  const ids = (c) => availableSubQuests(c).filter((h) => h.board).map((h) => h.id);
  assert.equal(ids({ flags: { c5_clear: true, c7_karim: true, c8_kingdom: true } }).length, 26, 'c8_abyss の 前は 26');
  assert.equal(ids({ flags: { c5_clear: true, c7_karim: true, c8_kingdom: true, c8_abyss: true } }).length, 29, 'c8_abyss の あとは 29');
});

// ───── お仕事いらい板: 29まい・5ページ ─────
test('お仕事いらい板: c8_abyss の 前は 26まい（5ページ）・あとは 29まい（5ページ。5ページ目は 25〜29 の 5まい）。5ページ目の はり紙を 読んで 受けると 地図に しるし', async () => {
  const before = { flag: (k) => KINGDOM.includes(k) };
  const after = { flag: (k) => OPEN.includes(k) };
  assert.equal(boardList(before).length, 26);
  assert.equal(boardPages(before), 5);
  assert.equal(boardList(after).length, 29);
  assert.equal(boardPages(after), 5);
  assert.equal(boardPages(), 5);
  const { bot, c } = await setup(744, { flags: OPEN });
  const qd = W.ice;
  const map = npcAnywhere(qd.npc).map;
  const marked = () => questMarks(c, map, '').some((m) => m.label === qd.name);
  assert.ok(!marked() && !q(c, qd.name));
  // 1→2→3→4→5ページ（つぎ 6・6・6・6）→ 5ページ目の 5まい目（氷の 像。4）→ 読む →「うける？」はい（0）→ 5ページ目に もどる → やめる（6）
  const msgs = await talkTo(bot, 'fq_board', [6, 6, 6, 6, 4, 0, 6]);
  const menus = msgs.filter((m) => m.t === 'script' && m.steps.at(-1)?.[0] === 'choice').map((m) => m.steps.at(-1));
  assert.ok(said(msgs, /はり紙は29まい/));
  assert.match(menus[3][1], /4\/5ページ/);
  assert.deepEqual(menus[3][2], [...FAMILY_QUESTS.slice(18, 24).map((x) => x.name), 'つぎのページへ', '前のページへ', 'やめる']);
  assert.match(menus[4][1], /5\/5ページ/);
  assert.deepEqual(menus[4][2], [...FAMILY_QUESTS.slice(24).map((x) => x.name), '前のページへ', 'やめる']);
  assert.equal(menus[4][2].length, 7, '5まい＋前のページへ＋やめる');
  assert.equal(menus[4][3].length, menus[4][2].length, 'カーソルの せつめいも 同じ 数');
  assert.match(menus[4][3][4], /^必要な職業：社ちくの系統（×いない）/);
  assert.ok(said(msgs, /ねないで、氷の像をけずりつづけて/) && said(msgs, /このいらいを、うける？/) && said(msgs, /を受けた！/));
  assert.ok(c.flags[takeFlag(qd)] && !c.flags[qd.start]);
  assert.match(menus[6][1], /5\/5ページ/, '読んだら 5ページ目に もどる');
  assert.equal(menus[6][2][4], `${qd.name}（受けている）`);
  const e = q(c, qd.name);
  assert.ok(e && e.who === qd.npc && /シズクに会おう/.test(e.text) && e.hint.includes(qd.where), 'クエストの 画面');
  assert.ok(marked(), '受けたら 地図に しるし');
  await talkTo(bot, qd.npc, [0]);
  assert.ok(c.flags[qd.start] && q(c, qd.name).find === 'fq_ice_v1');
  assert.ok(!bot.s.busy);
});

// ───── 戦いの 強さ ─────
test('戦い: 新しい 2つ（敵Lv84）は お話の ころ（Lv82〜85）の 4人・2人・ひとりでも 完全オートで 勝てる（ボスほど強くない）', () => {
  const solo = { fq_shadownight: [['warrior'], ['priest'], ['monk']], fq_crabguard: [['warrior'], ['priest'], ['monk'], ['mage']] };
  for (const id of ['fq_shadownight', 'fq_crabguard']) {
    const e = FIXED_ENCOUNTERS[id];
    assert.ok(e && !e.boss && e.canFlee === false && e.enemyLv === 84 && !(e.enemyPow > 1), id);
    for (const [sp] of e.group) assert.ok(MONSTER_ART[sp], `${sp} の 絵`);
    for (const jobs of [['warrior', 'priest', 'mage', 'monk'], ['warrior', 'priest'], ...solo[id]]) {
      let win = 0;
      for (let i = 0; i < 6; i++) {
        const lv = 82 + (i % 4);
        const party = jobs.map((j, k) => makeChar(j, lv, 10, `p${k}`, 58));
        const r = runBattle(party, e.group.flatMap(([sp, n]) => Array(n).fill(sp)), { seed: 74 + i * 7919, enemyLv: e.enemyLv, enemyPow: e.enemyPow });
        if (r.outcome === 'win') win++;
      }
      assert.ok(win >= (jobs.length === 1 && jobs[0] !== 'warrior' ? 5 : 6), `${id} ${jobs.join('・')} 勝ち ${win}/6`);
    }
  }
});

// ───── 漢字 ─────
test('漢字: 新しい ファイルは gameFiles() に 入っていて、使えない 漢字・スペースが ない', () => {
  const files = ['shared/data/sidequests-work5.js', 'shared/maps/work-quests5.js', 'client/render/work5-art.js'].map((f) => gameFiles().find((g) => g.endsWith('/public/js/' + f)));
  assert.ok(files.every(Boolean), 'gameFiles() に 入っている');
  const bad = [];
  for (const f of files) for (const p of checkFile(f)) if (p.kind !== 'kana') bad.push(`${f.split('/').pop()}:${p.line} [${p.kind} ${p.detail}] ${p.text}`);
  assert.deepEqual(bad, []);
  for (const qd of WORK5_QUESTS) for (const t of [qd.name, qd.paper, qd.who, qd.where, qd.job]) assert.deepEqual(checkText(t).filter((p) => p.kind !== 'kana'), [], t);
  assert.deepEqual(checkText(ITEMS.fq_twin_tassel.name + ITEMS.fq_twin_tassel.desc).filter((p) => p.kind !== 'kana'), []);
});
