// 第75回 D班: お仕事いらい 30〜32（docs/plan-ch8.md の 8-3）。1〜29 の どれとも かさならない 伝説の 職業の 系統で とける たのまれごと
// 30. 嵐の島の、ゴロゴロかみなり雲（ゴム人間 → ニカ）・31. 星竜山のふもとの、まいごのちび竜（竜の騎士 → 竜魔人）・
// 32. 雪原の広場の、てんてこまいラーメン（木の葉の忍び → 七代目火影）
// 第66回の 伝説で まだ 使って いないのは ロゼッタだけ（男の子だと 名前が かわるので 第74回で やめた）なので、
// それより 前から ある 伝説（ニカ・竜魔人・七代目火影）の 系統に した（どれも 1〜29 で 1回も 使っていない）
// 受けて → すすめて → ごほうび・職業の しばり（いる／いない）・まちがえても やり直せる・ひとりで とける・ごほうびは 1回だけ・
// 第8章 第3幕の 千年前の ミドリナに 着いた あとから（はり紙も 人も）・地図の しるし・困っている人・漢字・軽い 戦い（敵Lv88）・
// お仕事いらい板: 32まい・6ページ（c8_spring の 前は 29まい・5ページの まま）・6ページ目から 受ける
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, isBlocked, condOk } from '../public/js/shared/maps/index.js';
import { SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { JOBS, jobAncestry, LEGEND_ORDER } from '../public/js/shared/data/jobs.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { FAMILY_QUESTS, boardPage, boardInfo, boardPages, boardList, takeFlag, rewardNames } from '../public/js/shared/data/sidequests-family.js';
import { WORK5_QUESTS } from '../public/js/shared/data/sidequests-work5.js';
import { WORK6_QUESTS, WORK6_SCRIPTS, WORK6_STORY_SCRIPTS, workSubQuests6, THD_PLAN, DRG_PLAN, RMN_PLAN } from '../public/js/shared/data/sidequests-work6.js';
import { WQ6, WQ6_OPEN, THD_VOICES, THD_STEPS, DRG_VOICES, DRG_STEPS, RMN_VOICES, RMN_STEPS, WORK6_NPC_IDS } from '../public/js/shared/maps/work-quests6.js';
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

// 第8章 第2幕の さいごまで（c8_abyss の いらい 27〜29 は 出る）・第3幕の はじめ（c8_sky）
const ABYSS = [...CLEAR, 'c7_karim', 'c7_kingdom', 'c7_clear', 'c8_start', 'c8_kingdom', 'c8_jafar', 'c8_sea', 'c8_abyss', 'c8_hades', 'c8_sky'];
const OPEN = [...ABYSS, WQ6_OPEN];
const q = (c, name) => subQuests(c).find((x) => x.name === name);
const W = Object.fromEntries(WORK6_QUESTS.map((x) => [x.id, x]));
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
test('しくみ: 3つの 新しい たのまれごと（伝説の 職業に つながる 系統・1〜29 の どれとも かさならない）・今の 時代の まだ いらいの ない 場所・c8_spring の あとだけ', () => {
  assert.equal(WORK6_QUESTS.length, 3);
  assert.equal(FAMILY_QUESTS.length, 35); // 第80回: 33〜35 が うしろに ふえた
  assert.deepEqual(FAMILY_QUESTS.slice(29, 32), WORK6_QUESTS);
  assert.deepEqual(FAMILY_QUESTS.slice(26, 29), WORK5_QUESTS);
  assert.deepEqual(WORK6_QUESTS.map((x) => x.roots), [['rubber'], ['dragon_knight'], ['konoha']]);
  assert.deepEqual(WORK6_QUESTS.map((x) => x.legend), ['nika', 'ryumajin', 'hokage']);
  for (const qd of WORK6_QUESTS) {
    const L = jobLine(qd.roots);
    for (const id of Object.keys(JOBS)) assert.equal(L.has(id), qd.roots.some((r) => jobAncestry(id).has(r)), `${qd.id} ${id}`);
    assert.ok(LEGEND_ORDER.includes(qd.legend) && JOBS[qd.legend].tier === 3 && L.has(qd.legend), `${qd.id}: ${qd.legend}`);
    assert.equal(qd.roots.map((r) => JOBS[r].name).join('か'), qd.job, qd.id);
    assert.ok(qd.who && qd.where && qd.paper && qd.town && qd.npc, qd.id);
    assert.deepEqual(qd.open, ['c8_spring'], qd.id);
    assert.ok(npcAnywhere(qd.npc), `${qd.id}: ${qd.npc}`);
  }
  // 系統は 1〜29 の どれとも、たがいにも かさならない（ちがう 職業の 人が 活きる。18〜29 の テストより きびしく 1〜29 ぜんぶ）
  const older = FAMILY_QUESTS.slice(0, 29);
  for (const a of WORK6_QUESTS) {
    assert.ok(!older.some((b) => b.legend === a.legend), a.id);
    for (const b of [...WORK6_QUESTS, ...older]) if (a !== b) assert.ok(![...jobLine(a.roots)].some((j) => jobLine(b.roots).has(j)), `${a.id} と ${b.id}`);
  }
  // 第66回の 伝説で、1〜32 の どの たのまれごとの 系統にも 入って いないのは ロゼッタだけ（だから 前から ある 伝説の 系統に した。第80回の 35 で ロゼッタも 使った）
  const usedAll = new Set(FAMILY_QUESTS.slice(0, 32).flatMap((x) => [...jobLine(x.roots)]));
  assert.deepEqual(R66_LEGENDS.filter((id) => !usedAll.has(id)), ['rosetta']);
  // 場所（今の 時代。まだ たのまれごとが ない 所）
  const maps = { thd: 'sea', drg: 'north', rmn: 'north' };
  const areas = { thd: '嵐の島', drg: '星竜山のふもと', rmn: '雪原の広場' };
  const area = (id) => { const { map, n } = npcAnywhere(id); return MAPS[map].areaName?.(Math.floor(n.x), Math.floor(n.y)) || MAPS[map].name; };
  for (const qd of WORK6_QUESTS) assert.equal(npcAnywhere(qd.npc).map, maps[qd.id], qd.id);
  for (const [k, a] of Object.entries(areas)) for (const id of WORK6_NPC_IDS.filter((x) => x.startsWith(`fq_${k}`))) assert.equal(area(id), a, id);
  const olderAreas = older.map((x) => area(x.npc));
  for (const qd of WORK6_QUESTS) assert.ok(!olderAreas.includes(area(qd.npc)), `${qd.id}: はじめての 場所`);
  for (const m of Object.values(MAPS)) if (m.past || m.id.includes('past') || m.id.startsWith('c7') || m.id.startsWith('c8')) assert.ok(!m.npcs.some((n) => WORK6_NPC_IDS.includes(n.id)), m.id);
  // 嵐の塔の 入り口〈76,47〉の 前は ふさがない
  assert.ok(!MAPS.sea.npcs.some((n) => n.solid && Math.floor(n.x) === 76 && [47, 48].includes(Math.floor(n.y))));
  // c8_spring の 前は 出ない・話しても 受けられない
  for (const id of WORK6_NPC_IDS) {
    const at = npcAnywhere(id);
    assert.ok(at, id);
    assert.equal(condOk(at.n.show, (f) => ABYSS.includes(f)), false, `${id} は c8_spring の 前は 出ない`);
    assert.ok(SCRIPTS[at.n.script], `${id} の だいほん`);
  }
  for (const id of WORK6_NPC_IDS.filter((x) => !['fq_thd_smile', 'fq_rmn_guest'].includes(x))) assert.equal(condOk(npcAnywhere(id).n.show, (f) => OPEN.includes(f)), true, `${id} は c8_spring の あとに 出る`);
  const pre = { flag: (f) => ABYSS.includes(f), has: () => false, count: () => 0, night: false, name: 'ソラ', c: { job: 'nika' } };
  for (const qd of WORK6_QUESTS) assert.ok(!JSON.stringify(SCRIPTS[qd.npc](pre)).includes('"choice"'), `${qd.id} は 受けられない`);
  assert.deepEqual(workSubQuests6({ flags: {} }, () => false, () => false), []);
  for (const id of Object.keys(WORK6_SCRIPTS)) assert.equal(SCRIPTS[id], WORK6_SCRIPTS[id], id);
  for (const id of WORK6_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id), id);
  // 人は 立てる 所（物は かたい NPC）・人の 絵・物の 絵
  for (const id of WORK6_NPC_IDS) {
    const { map, n } = npcAnywhere(id);
    assert.ok(!isBlocked(MAPS[map], Math.floor(n.x), Math.floor(n.y), () => true) || n.solid, `${id} の 場所`);
    if (n.sprite.startsWith('mon:')) assert.ok(MONSTER_ART[n.sprite.slice(4)], `${id} の 絵`);
    else assert.ok(npcOpts(n.sprite), `${id} の みため`);
  }
});

test('ごほうび: 第64回の きまり（★5の アクセサリーは 1つだけ・乗り物なし）・素材や 道具・ゴールド・小さなメダル・はり紙と 同じ', () => {
  const accs = WORK6_QUESTS.filter((x) => x.reward.item);
  assert.equal(accs.length, 1, '★5は 1つだけ');
  for (const qd of accs) {
    const it = ITEMS[qd.reward.item];
    assert.ok(it && it.type === 'acc' && starsFor(it) === 5 && it.src === 'gift' && !(it.price > 0), qd.id);
    // 闘技場 ランク10 の ブローチより 弱い・第73回の お守りと おなじ くらい
    const sum = (b) => Object.values(b).reduce((s, v) => s + v, 0);
    assert.ok(sum(it.bonus) < sum(ITEMS.ar_star_king_brooch.bonus) && sum(it.bonus) <= sum(ITEMS.fq_sand_amulet.bonus), qd.id);
  }
  for (const qd of WORK6_QUESTS) {
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

// ───── 30. かみなり雲 ─────
test('嵐の島の、ゴロゴロかみなり雲: 3人の話 → 雲に近づく・つかまえる・いっしょに笑う（やり直し）→ 子分と戦う → にじ → ごほうび。ゴム人間がいないと近づけない', async () => {
  const { bot, c } = await setup(751, { job: 'warrior', flags: OPEN });
  const qd = W.thd;
  assert.ok(shows('fq_thd_cloud', c) && !shows('fq_thd_smile', c));
  await talkTo(bot, 'fq_thd_host', [0]);
  assert.ok(c.flags[WQ6.thdStart]);
  assert.equal(q(c, qd.name).find, 'fq_thd_v1');
  let msgs = await talkTo(bot, 'fq_thd_cloud');
  assert.ok(said(msgs, /話を聞こう/) && !battled(msgs, 'fq_thunderkids'));
  for (const id of ['fq_thd_v1', 'fq_thd_v2', 'fq_thd_v3']) await talkTo(bot, id);
  assert.ok(THD_VOICES.every((k) => c.flags[k]) && q(c, qd.name).find === 'fq_thd_cloud');
  const ans = THD_PLAN.map((x) => x.ans);
  msgs = await talkTo(bot, 'fq_thd_cloud', ans);
  assert.ok(said(msgs, /ゴム人間の人が、パーティーに/) && !c.flags[THD_STEPS[0]] && !battled(msgs, 'fq_thunderkids'));
  c.job = 'nika'; // ゴム人間 → ニカ
  msgs = await talkTo(bot, 'fq_thd_cloud', [wrong(ans[0])]);
  assert.ok(!c.flags[THD_STEPS[0]] && said(msgs, /思い出そう/), '1つ目の まちがい');
  msgs = await talkTo(bot, 'fq_thd_cloud', [ans[0], ans[1], wrong(ans[2])]);
  assert.ok(c.flags[THD_STEPS[1]] && !c.flags[THD_STEPS[2]] && !battled(msgs, 'fq_thunderkids'), '3つ目で まちがい（戦わない）');
  c.job = 'rubber'; // ゴム人間でも つづきから
  msgs = await talkTo(bot, 'fq_thd_cloud', [ans[2]]);
  assert.ok(battled(msgs, 'fq_thunderkids') && c.flags[WQ6.thdGuard] && said(msgs, /あっはっはっは/), '笑って 子分と 戦った');
  assert.ok(!shows('fq_thd_cloud', c) && shows('fq_thd_smile', c), '白い にこにこ雲に');
  assert.ok(q(c, qd.name).ready && q(c, qd.name).who === 'fq_thd_host');
  c.job = 'warrior'; // 報告は だれでも
  await rewarded(c, qd, () => talkTo(bot, 'fq_thd_host'));
  assert.ok(said(await talkTo(bot, 'fq_thd_smile'), /笑おうね/));
});

// ───── 31. まいごの ちび竜 ─────
test('星竜山のふもとの、まいごのちび竜: 3人の話 → オーラ・紋章（やり直し）→ マグマトカゲと戦う（1回だけ）→ 紋章の光で合図 → お母さん竜 → ★5 → ごほうび。竜の騎士がいないと近づけない', async () => {
  const { bot, c } = await setup(752, { job: 'priest', flags: OPEN });
  const qd = W.drg;
  await talkTo(bot, 'fq_drg_host', [0]);
  assert.ok(c.flags[WQ6.drgStart]);
  assert.equal(q(c, qd.name).find, 'fq_drg_v1');
  let msgs = await talkTo(bot, 'fq_drg_baby');
  assert.ok(said(msgs, /話を聞こう/) && !battled(msgs, 'fq_lavaraid'));
  for (const id of ['fq_drg_v1', 'fq_drg_v2', 'fq_drg_v3']) await talkTo(bot, id);
  assert.ok(DRG_VOICES.every((k) => c.flags[k]) && q(c, qd.name).find === 'fq_drg_baby');
  const ans = DRG_PLAN.map((x) => x.ans);
  msgs = await talkTo(bot, 'fq_drg_baby', ans);
  assert.ok(said(msgs, /竜の騎士の人が、パーティーに/) && !c.flags[DRG_STEPS[0]]);
  c.job = 'ryumajin'; // 竜の騎士 → 竜魔人
  msgs = await talkTo(bot, 'fq_drg_baby', [ans[0], wrong(ans[1])]);
  assert.ok(c.flags[DRG_STEPS[0]] && !c.flags[DRG_STEPS[1]] && !battled(msgs, 'fq_lavaraid') && said(msgs, /思い出そう/), '2つ目で まちがい（まだ 戦わない）');
  msgs = await talkTo(bot, 'fq_drg_baby', [ans[1], wrong(ans[2])]);
  assert.ok(c.flags[DRG_STEPS[1]] && battled(msgs, 'fq_lavaraid') && c.flags[WQ6.drgFight] && !c.flags[DRG_STEPS[2]], '2つ目の あと マグマトカゲと 戦った・3つ目で まちがい');
  c.job = 'dragon_knight';
  msgs = await talkTo(bot, 'fq_drg_baby', [ans[2]]);
  assert.ok(!battled(msgs, 'fq_lavaraid'), '2回目は 戦わない');
  assert.ok(c.flags[WQ6.drgHome] && said(msgs, /お母さん竜/) && !shows('fq_drg_baby', c), 'ちび竜は お母さんの 所へ');
  assert.ok(q(c, qd.name).ready && q(c, qd.name).who === 'fq_drg_host');
  c.job = 'warrior';
  await rewarded(c, qd, () => talkTo(bot, 'fq_drg_host'));
});

// ───── 32. てんてこまいラーメン ─────
test('雪原の広場の、てんてこまいラーメン: 3人の話 → 影分身・分身をまとめる・なると（やり直し）→ 大はやり → ごほうび。木の葉の忍びがいないと手伝えない（戦いなし）', async () => {
  const { bot, c } = await setup(753, { job: 'mage', flags: OPEN });
  const qd = W.rmn;
  assert.ok(!shows('fq_rmn_guest', c));
  await talkTo(bot, 'fq_rmn_host', [0]);
  assert.ok(c.flags[WQ6.rmnStart]);
  assert.equal(q(c, qd.name).find, 'fq_rmn_v1');
  let msgs = await talkTo(bot, 'fq_rmn_stall');
  assert.ok(said(msgs, /話を聞こう/) && !said(msgs, /どうする？/));
  for (const id of ['fq_rmn_v1', 'fq_rmn_v2', 'fq_rmn_v3']) await talkTo(bot, id);
  assert.ok(RMN_VOICES.every((k) => c.flags[k]) && q(c, qd.name).find === 'fq_rmn_stall');
  const ans = RMN_PLAN.map((x) => x.ans);
  msgs = await talkTo(bot, 'fq_rmn_stall', ans);
  assert.ok(said(msgs, /木の葉の忍びの人が、パーティーに/) && !c.flags[RMN_STEPS[0]]);
  c.job = 'hokage'; // 木の葉の忍び → 七代目火影
  msgs = await talkTo(bot, 'fq_rmn_stall', [ans[0], wrong(ans[1])]);
  assert.ok(c.flags[RMN_STEPS[0]] && !c.flags[RMN_STEPS[1]] && said(msgs, /あいこ/), '2つ目で まちがい');
  c.job = 'konoha';
  msgs = await talkTo(bot, 'fq_rmn_stall', [ans[1], ans[2]]);
  assert.ok(c.flags[WQ6.rmnRush] && said(msgs, /うまーい/) && !battled(msgs, ''));
  assert.ok(q(c, qd.name).ready && q(c, qd.name).who === 'fq_rmn_host');
  c.job = 'warrior';
  await rewarded(c, qd, () => talkTo(bot, 'fq_rmn_host'));
  assert.ok(shows('fq_rmn_guest', c), 'お客さんが ならぶ');
});

// ───── 地図の しるし・ヒント・困っている人 ─────
test('受けた たのまれごとは クエストの 画面・地図の しるし・「はなす」の ヒント。困っている人は c8_spring の あとから', () => {
  const all = { flags: Object.fromEntries([...OPEN, ...WORK6_QUESTS.map((x) => x.start)].map((f) => [f, true])), items: [], keyItems: [] };
  const list = subQuests(all).filter((x) => WORK6_QUESTS.some((w) => w.name === x.name));
  assert.equal(list.length, 3);
  for (const x of list) {
    assert.ok(npcAnywhere(x.who), `${x.name}: ${x.who}`);
    if (x.find) assert.ok(npcAnywhere(x.find), `${x.name}: ${x.find}`);
    assert.ok(x.text && x.hint, x.name);
    assert.deepEqual(checkText(x.text + x.hint).filter((p) => p.kind !== 'kana'), [], x.name);
  }
  for (const qd of WORK6_QUESTS) {
    const map = npcAnywhere(qd.npc).map;
    assert.ok(questMarks(all, map, '').some((m) => m.label === qd.name), `${qd.id}: 地図の しるし`);
    const h = subQuestHint(`fq_${qd.id}`);
    assert.ok(h && h.board && h.npc === qd.npc && h.roots === qd.roots && h.open.includes('c8_spring'), `${qd.id}: 困っている人`);
  }
  assert.ok(WORK6_QUESTS.some((qd) => sideQuestHint(all).includes(qd.name)), '「はなす」の ヒント');
  assert.ok(!availableSubQuests(all).some((h) => WORK6_QUESTS.some((qd) => h.id === `fq_${qd.id}`)), '受けたら 困っている人から 消える');
  const none = { flags: Object.fromEntries(OPEN.map((f) => [f, true])), items: [], keyItems: [] };
  for (const qd of WORK6_QUESTS) {
    assert.ok(!q(none, qd.name), qd.id);
    assert.ok(!questMarks(none, npcAnywhere(qd.npc).map, '').some((m) => m.label === qd.name), `${qd.id}: 受ける 前は しるし なし`);
  }
  const ids = (c) => availableSubQuests(c).filter((h) => h.board).map((h) => h.id);
  assert.equal(ids({ flags: { c5_clear: true, c7_karim: true, c8_kingdom: true, c8_abyss: true } }).length, 29, 'c8_spring の 前は 29');
  assert.equal(ids({ flags: { c5_clear: true, c7_karim: true, c8_kingdom: true, c8_abyss: true, c8_spring: true } }).length, 32, 'c8_spring の あとは 32');
});

// ───── お仕事いらい板: 32まい・6ページ ─────
test('お仕事いらい板: c8_spring の 前は 29まい（5ページ）・あとは 32まい（6ページ。6ページ目は 31・32 の 2まい）。6ページ目の はり紙を 読んで 受けると 地図に しるし', async () => {
  const before = { flag: (k) => ABYSS.includes(k) };
  const after = { flag: (k) => OPEN.includes(k) };
  assert.equal(boardList(before).length, 29);
  assert.equal(boardPages(before), 5);
  assert.equal(boardList(after).length, 32);
  assert.equal(boardPages(after), 6);
  assert.equal(boardPages(), 6); // 第80回: 35まいでも 6ページ
  const { bot, c } = await setup(754, { flags: OPEN });
  const qd = W.rmn;
  const map = npcAnywhere(qd.npc).map;
  const marked = () => questMarks(c, map, '').some((m) => m.label === qd.name);
  assert.ok(!marked() && !q(c, qd.name));
  // 1→2→3→4→5→6ページ（つぎ 6・6・6・6・6）→ 6ページ目の 2まい目（ラーメン。1）→ 読む →「うける？」はい（0）→ 6ページ目に もどる → やめる（3）
  const msgs = await talkTo(bot, 'fq_board', [6, 6, 6, 6, 6, 1, 0, 3]);
  const menus = msgs.filter((m) => m.t === 'script' && m.steps.at(-1)?.[0] === 'choice').map((m) => m.steps.at(-1));
  assert.ok(said(msgs, /はり紙は32まい/));
  assert.match(menus[4][1], /5\/6ページ/);
  assert.deepEqual(menus[4][2], [...FAMILY_QUESTS.slice(24, 30).map((x) => x.name), 'つぎのページへ', '前のページへ', 'やめる']);
  assert.match(menus[5][1], /6\/6ページ/);
  assert.deepEqual(menus[5][2], [...FAMILY_QUESTS.slice(30, 32).map((x) => x.name), '前のページへ', 'やめる']);
  assert.equal(menus[5][2].length, 4, '2まい＋前のページへ＋やめる');
  assert.equal(menus[5][3].length, menus[5][2].length, 'カーソルの せつめいも 同じ 数');
  assert.match(menus[5][3][1], /^必要な職業：木の葉の忍びの系統（×いない）/);
  assert.ok(said(msgs, /お客さんが、ずらりと行列/) && said(msgs, /このいらいを、うける？/) && said(msgs, /を受けた！/));
  assert.ok(c.flags[takeFlag(qd)] && !c.flags[qd.start]);
  assert.match(menus[7][1], /6\/6ページ/, '読んだら 6ページ目に もどる');
  assert.equal(menus[7][2][1], `${qd.name}（受けている）`);
  const e = q(c, qd.name);
  assert.ok(e && e.who === qd.npc && /テツおやじに会おう/.test(e.text) && e.hint.includes(qd.where), 'クエストの 画面');
  assert.ok(marked(), '受けたら 地図に しるし');
  await talkTo(bot, qd.npc, [0]);
  assert.ok(c.flags[qd.start] && q(c, qd.name).find === 'fq_rmn_v1');
  assert.ok(!bot.s.busy);
});

// ───── 戦いの 強さ ─────
test('戦い: 新しい 2つ（敵Lv88）は お話の ころ（Lv86〜89）の 4人・2人・その 系統の ひとりでも 完全オートで 勝てる（ボスほど強くない）', () => {
  // その 系統の 人（いないと 戦わない）は 戦士・武闘家の 装備で その 職業に する
  const as = (base, job, lv, name) => {
    const c = makeChar(base, lv, 10, name, 58);
    c.jobs[job] = { ...c.jobs[base] };
    c.job = job;
    fullHeal(c);
    return c;
  };
  const line = { fq_thunderkids: ['monk', 'rubber'], fq_lavaraid: ['warrior', 'dragon_knight'] };
  for (const id of ['fq_thunderkids', 'fq_lavaraid']) {
    const e = FIXED_ENCOUNTERS[id];
    assert.ok(e && !e.boss && e.canFlee === false && e.enemyLv === 88 && !(e.enemyPow > 1), id);
    for (const [sp] of e.group) assert.ok(MONSTER_ART[sp], `${sp} の 絵`);
    for (const jobs of [['warrior', 'priest', 'mage', 'monk'], ['warrior', 'priest'], ['warrior'], ['priest'], ['monk'], ['line'], ['line', 'mage']]) {
      let win = 0;
      for (let i = 0; i < 6; i++) {
        const lv = 86 + (i % 4);
        const party = jobs.map((j, k) => (j === 'line' ? as(...line[id], lv, `p${k}`) : makeChar(j, lv, 10, `p${k}`, 58)));
        const r = runBattle(party, e.group.flatMap(([sp, n]) => Array(n).fill(sp)), { seed: 75 + i * 7919, enemyLv: e.enemyLv, enemyPow: e.enemyPow });
        if (r.outcome === 'win') win++;
      }
      assert.ok(win >= 6, `${id} ${jobs.join('・')} 勝ち ${win}/6`);
    }
  }
});

// ───── 漢字 ─────
test('漢字: 新しい ファイルは gameFiles() に 入っていて、使えない 漢字・スペースが ない', () => {
  const files = ['shared/data/sidequests-work6.js', 'shared/maps/work-quests6.js', 'client/render/work6-art.js'].map((f) => gameFiles().find((g) => g.endsWith('/public/js/' + f)));
  assert.ok(files.every(Boolean), 'gameFiles() に 入っている');
  const bad = [];
  for (const f of files) for (const p of checkFile(f)) if (p.kind !== 'kana') bad.push(`${f.split('/').pop()}:${p.line} [${p.kind} ${p.detail}] ${p.text}`);
  assert.deepEqual(bad, []);
  for (const qd of WORK6_QUESTS) for (const t of [qd.name, qd.paper, qd.who, qd.where, qd.job]) assert.deepEqual(checkText(t).filter((p) => p.kind !== 'kana'), [], t);
  assert.deepEqual(checkText(ITEMS.fq_dragon_charm.name + ITEMS.fq_dragon_charm.desc).filter((p) => p.kind !== 'kana'), []);
});
