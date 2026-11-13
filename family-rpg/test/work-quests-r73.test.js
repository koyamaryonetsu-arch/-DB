// 第73回 D班: お仕事いらい 24〜26（docs/plan-ch8.md の 5-3）。第66回の 伝説の 職業に つながる 系統（18〜23 と かさならない）で とける たのまれごと
// 24. ひみつの温泉の、われた湯船（れん金術師 → 真理のとびらをひらく者）・25. ハネノの島の、雲の下のおとしもの（超能力者 → さいきくすお）・
// 26. ピラミッドのはっくつ隊を守れ（ガーディアンか大神官 → 守りの神）
// 受けて → すすめて → ごほうび・職業の しばり（いる／いない）・まちがえても やり直せる・ひとりで とける・ごほうびは 1回だけ・
// 第8章 第1幕の 千年前の 王国に 着いた あとから（はり紙も 人も）・地図の しるし・困っている人・漢字・軽い 戦い（敵Lv80）・
// お仕事いらい板: 26まい・5ページ（c8_kingdom の 前は 23まい・4ページの まま）・5ページ目から 受ける
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, isBlocked, condOk } from '../public/js/shared/maps/index.js';
import { SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { JOBS, jobAncestry } from '../public/js/shared/data/jobs.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { FAMILY_QUESTS, boardPage, boardInfo, boardPages, boardList, takeFlag, rewardNames } from '../public/js/shared/data/sidequests-family.js';
import { WORK3_QUESTS } from '../public/js/shared/data/sidequests-work3.js';
import { WORK4_QUESTS, WORK4_SCRIPTS, WORK4_STORY_SCRIPTS, workSubQuests4, SPA_PLAN, ESP_PLAN, DIG_PLAN } from '../public/js/shared/data/sidequests-work4.js';
import { WQ4, WQ4_OPEN, SPA_VOICES, SPA_STEPS, ESP_VOICES, ESP_STEPS, DIG_VOICES, DIG_STEPS, WORK4_NPC_IDS } from '../public/js/shared/maps/work-quests4.js';
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

const KARIM = [...CLEAR, 'c7_karim'];
const OPEN = [...KARIM, 'c7_kingdom', 'c7_clear', 'c8_start', WQ4_OPEN];
const q = (c, name) => subQuests(c).find((x) => x.name === name);
const W = Object.fromEntries(WORK4_QUESTS.map((x) => [x.id, x]));
const wrong = (ans) => (ans === 0 ? 1 : 0);
// 人の 形では ない とくべつな 絵（render/chars.js の paintSprite の case。子ザルは 今までの サル）
const SPECIAL = ['monkey', 'camel'];
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
test('しくみ: 3つの 新しい たのまれごと（第66回の 伝説の 職業に つながる 系統・18〜23 と かさならない）・今の 時代の まだ いらいの ない 場所・c8_kingdom の あとだけ', () => {
  assert.equal(WORK4_QUESTS.length, 3);
  assert.equal(FAMILY_QUESTS.length, 35); // 第74回: 27〜29・第75回: 30〜32・第80回: 33〜35 が うしろに ふえた
  assert.deepEqual(FAMILY_QUESTS.slice(23, 26), WORK4_QUESTS);
  assert.deepEqual(FAMILY_QUESTS.slice(17, 23), WORK3_QUESTS);
  assert.deepEqual(WORK4_QUESTS.map((x) => x.roots), [['alchemist'], ['esper'], ['guardian', 'high_priest']]);
  assert.deepEqual(WORK4_QUESTS.map((x) => x.legend), ['truth_gate', 'saiki', 'guard_god']);
  for (const qd of WORK4_QUESTS) {
    const L = jobLine(qd.roots);
    for (const id of Object.keys(JOBS)) assert.equal(L.has(id), qd.roots.some((r) => jobAncestry(id).has(r)), `${qd.id} ${id}`);
    assert.ok(R66_LEGENDS.includes(qd.legend) && JOBS[qd.legend].tier === 3 && L.has(qd.legend), `${qd.id}: ${qd.legend}`);
    assert.equal(qd.roots.map((r) => JOBS[r].name).join('か'), qd.job, qd.id);
    assert.ok(qd.who && qd.where && qd.paper && qd.town && qd.npc, qd.id);
    assert.deepEqual(qd.open, ['c8_kingdom'], qd.id);
    assert.ok(npcAnywhere(qd.npc), `${qd.id}: ${qd.npc}`);
  }
  // 伝説の 職業は 18〜23 と ちがう・系統も かさならない（ちがう 職業の 人が 活きる）
  for (const a of WORK4_QUESTS) {
    assert.ok(!WORK3_QUESTS.some((b) => b.legend === a.legend), a.id);
    for (const b of [...WORK4_QUESTS, ...WORK3_QUESTS]) if (a !== b) assert.ok(![...jobLine(a.roots)].some((j) => jobLine(b.roots).has(j)), `${a.id} と ${b.id}`);
  }
  // 場所（今の 時代。まだ たのまれごとが ない 所）
  const maps = { spa: 'north', esp: 'kumoi', dig: 'south' };
  const area = (id) => { const { map, n } = npcAnywhere(id); return MAPS[map].areaName?.(Math.floor(n.x), Math.floor(n.y)) || MAPS[map].name; };
  for (const qd of WORK4_QUESTS) assert.equal(npcAnywhere(qd.npc).map, maps[qd.id], qd.id);
  for (const id of WORK4_NPC_IDS.filter((x) => x.startsWith('fq_spa'))) assert.match(area(id), /ひみつの温泉/, id);
  for (const id of WORK4_NPC_IDS.filter((x) => x.startsWith('fq_esp'))) assert.match(area(id), /ハネノの島/, id);
  for (const id of WORK4_NPC_IDS.filter((x) => x.startsWith('fq_dig'))) assert.match(area(id), /王家のピラミッド/, id);
  const older = FAMILY_QUESTS.slice(0, 23).map((x) => area(x.npc));
  for (const qd of WORK4_QUESTS) assert.ok(!older.includes(area(qd.npc)), `${qd.id}: はじめての 場所`);
  for (const m of Object.values(MAPS)) if (m.past || m.id.includes('past') || m.id.startsWith('c7') || m.id.startsWith('c8')) assert.ok(!m.npcs.some((n) => WORK4_NPC_IDS.includes(n.id)), m.id);
  // c8_kingdom の 前は 出ない・話しても 受けられない
  for (const id of WORK4_NPC_IDS) {
    const at = npcAnywhere(id);
    assert.ok(at, id);
    assert.equal(condOk(at.n.show, (f) => KARIM.includes(f)), false, `${id} は c8_kingdom の 前は 出ない`);
    assert.equal(condOk(at.n.show, (f) => OPEN.includes(f)), true, `${id} は c8_kingdom の あとに 出る`);
    assert.ok(SCRIPTS[at.n.script], `${id} の だいほん`);
  }
  const pre = { flag: (f) => KARIM.includes(f), has: () => false, count: () => 0, night: false, name: 'ソラ', c: { job: 'alchemist' } };
  for (const qd of WORK4_QUESTS) assert.ok(!JSON.stringify(SCRIPTS[qd.npc](pre)).includes('"choice"'), `${qd.id} は 受けられない`);
  assert.deepEqual(workSubQuests4({ flags: {} }, () => false, () => false), []);
  for (const id of Object.keys(WORK4_SCRIPTS)) assert.equal(SCRIPTS[id], WORK4_SCRIPTS[id], id);
  for (const id of WORK4_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id), id);
  // 人は 立てる 所（物は かたい NPC）・人の 絵・物の 絵
  for (const id of WORK4_NPC_IDS) {
    const { map, n } = npcAnywhere(id);
    assert.ok(!isBlocked(MAPS[map], Math.floor(n.x), Math.floor(n.y), () => true) || n.solid, `${id} の 場所`);
    if (n.sprite.startsWith('mon:')) assert.ok(MONSTER_ART[n.sprite.slice(4)], `${id} の 絵`);
    else assert.ok(npcOpts(n.sprite) || SPECIAL.includes(n.sprite), `${id} の みため`);
  }
});

test('ごほうび: 第64回の きまり（★5の アクセサリーは 1つだけ・乗り物なし）・素材や 道具・ゴールド・小さなメダル・はり紙と 同じ', () => {
  const accs = WORK4_QUESTS.filter((x) => x.reward.item);
  assert.equal(accs.length, 1, '★5は 1つだけ');
  for (const qd of accs) {
    const it = ITEMS[qd.reward.item];
    assert.ok(it && it.type === 'acc' && starsFor(it) === 5 && it.src === 'gift' && !(it.price > 0), qd.id);
    // 闘技場 ランク10 の ブローチより 弱い
    const sum = (b) => Object.values(b).reduce((s, v) => s + v, 0);
    assert.ok(sum(it.bonus) < sum(ITEMS.ar_star_king_brooch.bonus), qd.id);
  }
  for (const qd of WORK4_QUESTS) {
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

// ───── 24. われた湯船 ─────
test('ひみつの温泉の、われた湯船: 白い岩（岩もぐら）・3人の話 → 材料・形・しあげ（やり直し）→ 湯船 → ごほうび。れん金術師がいないと作りかえられない', async () => {
  const { bot, c } = await setup(731, { job: 'warrior', flags: OPEN });
  const qd = W.spa;
  await talkTo(bot, 'fq_spa_host', [0]);
  assert.ok(c.flags[WQ4.spaStart]);
  assert.equal(q(c, qd.name).find, 'fq_spa_rock');
  assert.ok(shows('fq_spa_rock', c));
  let msgs = await talkTo(bot, 'fq_spa_rock');
  assert.ok(battled(msgs, 'fq_rockmole') && c.flags[WQ4.spaRock], '岩もぐらと 戦った（だれでも）');
  assert.ok(!shows('fq_spa_rock', c), '白い岩を 取った');
  assert.equal(q(c, qd.name).find, 'fq_spa_v1');
  msgs = await talkTo(bot, 'fq_spa_host');
  assert.ok(said(msgs, /今は0人/));
  for (const id of ['fq_spa_v1', 'fq_spa_v2', 'fq_spa_v3']) await talkTo(bot, id);
  assert.ok(SPA_VOICES.every((k) => c.flags[k]) && q(c, qd.name).ready);
  const ans = SPA_PLAN.map((x) => x.ans);
  msgs = await talkTo(bot, 'fq_spa_host', ans);
  assert.ok(said(msgs, /れん金術師の人が、パーティーに/) && !c.flags[SPA_STEPS[0]]);
  c.job = 'truth_gate'; // れん金術師 → … → 真理のとびらをひらく者
  msgs = await talkTo(bot, 'fq_spa_host', [wrong(ans[0])]);
  assert.ok(!c.flags[SPA_STEPS[0]] && said(msgs, /もう一度、思い出して/), '1つ目の まちがい');
  msgs = await talkTo(bot, 'fq_spa_host', [ans[0], ans[1], wrong(ans[2])]);
  assert.ok(c.flags[SPA_STEPS[1]] && !c.flags[SPA_STEPS[2]], '3つ目で まちがい（2つ目までは 決まったまま）');
  await rewarded(c, qd, () => talkTo(bot, 'fq_spa_host', c.flags[qd.done] ? [] : [ans[2]]));
});

// ───── 25. 雲の下の おとしもの ─────
test('ハネノの島の、雲の下のおとしもの: 島の3人の話 → さがし方・取り方・返し方（やり直し）→ 雲つりのおじいさんがつり上げる → ごほうび。超能力者がいないとさがせない', async () => {
  const { bot, c } = await setup(732, { job: 'priest', flags: OPEN });
  const qd = W.esp;
  await talkTo(bot, 'fq_esp_host', [0]);
  assert.ok(c.flags[WQ4.espStart]);
  assert.equal(q(c, qd.name).find, 'fq_esp_v1');
  for (const id of ['fq_esp_v1', 'fq_esp_v2', 'fq_esp_v3']) await talkTo(bot, id);
  assert.ok(ESP_VOICES.every((k) => c.flags[k]) && q(c, qd.name).ready);
  const ans = ESP_PLAN.map((x) => x.ans);
  let msgs = await talkTo(bot, 'fq_esp_host', ans);
  assert.ok(said(msgs, /超能力者の人が、パーティーに/) && !c.flags[ESP_STEPS[0]]);
  c.job = 'saiki'; // 超能力者 → サイキッカー → さいきくすお
  msgs = await talkTo(bot, 'fq_esp_host', [ans[0], ans[1], wrong(ans[2])]);
  assert.ok(c.flags[ESP_STEPS[1]] && !c.flags[ESP_STEPS[2]] && said(msgs, /気づかれちゃう/), '3つ目で まちがい（めだつ 返し方）');
  await rewarded(c, qd, () => talkTo(bot, 'fq_esp_host', c.flags[qd.done] ? [] : [ans[2]]));
  assert.ok(said(await talkTo(bot, 'fq_esp_v3'), /いちばんの大物/), 'つり上げたのは おじいさん（ということに なった）');
});

// ───── 26. はっくつ隊を 守る ─────
test('ピラミッドのはっくつ隊を守れ: 3人の話 → はっくつのあなで夜の見張り（やり直し）→ 砂の魔物と戦う → お守り → ごほうび。ガーディアンか大神官がいないと守れない', async () => {
  const { bot, c } = await setup(733, { job: 'mage', flags: OPEN });
  const qd = W.dig;
  await talkTo(bot, 'fq_dig_host', [0]);
  assert.ok(c.flags[WQ4.digStart]);
  assert.equal(q(c, qd.name).find, 'fq_dig_v1');
  let msgs = await talkTo(bot, 'fq_dig_hole');
  assert.ok(said(msgs, /話を聞こう/) && !battled(msgs, 'fq_sandnight'));
  for (const id of ['fq_dig_v1', 'fq_dig_v2', 'fq_dig_v3']) await talkTo(bot, id);
  assert.ok(DIG_VOICES.every((k) => c.flags[k]) && q(c, qd.name).find === 'fq_dig_hole');
  const ans = DIG_PLAN.map((x) => x.ans);
  msgs = await talkTo(bot, 'fq_dig_hole', ans);
  assert.ok(said(msgs, /ガーディアンか大神官の人が、パーティーに/) && !c.flags[DIG_STEPS[0]] && !battled(msgs, 'fq_sandnight'));
  c.job = 'high_priest'; // 大神官（→ 守りの神）
  msgs = await talkTo(bot, 'fq_dig_hole', [wrong(ans[0])]);
  assert.ok(!c.flags[DIG_STEPS[0]] && said(msgs, /思い出そう/), '1つ目の まちがい');
  msgs = await talkTo(bot, 'fq_dig_hole', [ans[0], ans[1], wrong(ans[2])]);
  assert.ok(c.flags[DIG_STEPS[1]] && !c.flags[DIG_STEPS[2]] && !battled(msgs, 'fq_sandnight'), '3つ目で まちがい（戦わない）');
  c.job = 'guardian'; // ガーディアンでも つづきから
  msgs = await talkTo(bot, 'fq_dig_hole', [ans[2]]);
  assert.ok(battled(msgs, 'fq_sandnight') && c.flags[WQ4.digGuard], '夜の 見張りで 砂の 魔物と 戦った');
  assert.ok(q(c, qd.name).ready && q(c, qd.name).who === 'fq_dig_host');
  c.job = 'warrior'; // 報告は だれでも
  await rewarded(c, qd, () => talkTo(bot, 'fq_dig_host'));
});

// ───── 地図の しるし・ヒント・困っている人 ─────
test('受けた たのまれごとは クエストの 画面・地図の しるし・「はなす」の ヒント。困っている人は c8_kingdom の あとから', () => {
  const all = { flags: Object.fromEntries([...OPEN, ...WORK4_QUESTS.map((x) => x.start)].map((f) => [f, true])), items: [], keyItems: [] };
  const list = subQuests(all).filter((x) => WORK4_QUESTS.some((w) => w.name === x.name));
  assert.equal(list.length, 3);
  for (const x of list) {
    assert.ok(npcAnywhere(x.who), `${x.name}: ${x.who}`);
    if (x.find) assert.ok(npcAnywhere(x.find), `${x.name}: ${x.find}`);
    assert.ok(x.text && x.hint, x.name);
    assert.deepEqual(checkText(x.text + x.hint).filter((p) => p.kind !== 'kana'), [], x.name);
  }
  for (const qd of WORK4_QUESTS) {
    const map = npcAnywhere(qd.npc).map;
    assert.ok(questMarks(all, map, '').some((m) => m.label === qd.name), `${qd.id}: 地図の しるし`);
    const h = subQuestHint(`fq_${qd.id}`);
    assert.ok(h && h.board && h.npc === qd.npc && h.roots === qd.roots && h.open.includes('c8_kingdom'), `${qd.id}: 困っている人`);
  }
  assert.ok(WORK4_QUESTS.some((qd) => sideQuestHint(all).includes(qd.name)), '「はなす」の ヒント');
  assert.ok(!availableSubQuests(all).some((h) => WORK4_QUESTS.some((qd) => h.id === `fq_${qd.id}`)), '受けたら 困っている人から 消える');
  // 受けて いない ときは 地図の しるしも クエストの 画面も ない
  const none = { flags: Object.fromEntries(OPEN.map((f) => [f, true])), items: [], keyItems: [] };
  for (const qd of WORK4_QUESTS) {
    assert.ok(!q(none, qd.name), qd.id);
    assert.ok(!questMarks(none, npcAnywhere(qd.npc).map, '').some((m) => m.label === qd.name), `${qd.id}: 受ける 前は しるし なし`);
  }
  const ids = (c) => availableSubQuests(c).filter((h) => h.board).map((h) => h.id);
  assert.equal(ids({ flags: { c5_clear: true, c7_karim: true } }).length, 23, 'c8_kingdom の 前は 23');
  assert.equal(ids({ flags: { c5_clear: true, c7_karim: true, c8_kingdom: true } }).length, 26, 'c8_kingdom の あとは 26');
});

// ───── お仕事いらい板: 26まい・5ページ ─────
test('お仕事いらい板: c8_kingdom の 前は 23まい（4ページ）・あとは 26まい（5ページ）。5ページ目の はり紙を 読んで 受けると 地図に しるし', async () => {
  const before = { flag: (k) => KARIM.includes(k) };
  const after = { flag: (k) => OPEN.includes(k) };
  assert.equal(boardList(before).length, 23);
  assert.equal(boardPages(before), 4);
  assert.equal(boardList(after).length, 26);
  assert.equal(boardPages(after), 5);
  assert.equal(boardPages(), 6); // 第75回: ぜんぶ（32まい）は 6ページ・第80回: 35まいでも 6ページ
  const { bot, c } = await setup(734, { flags: OPEN });
  const qd = W.esp;
  const map = npcAnywhere(qd.npc).map;
  const marked = () => questMarks(c, map, '').some((m) => m.label === qd.name);
  assert.ok(!marked() && !q(c, qd.name));
  // 1→2→3→4→5ページ（つぎ 6・6・6・6）→ 5ページ目の 1まい目（雲の下。0）→ 読む →「うける？」はい（0）→ 5ページ目に もどる → やめる（3）
  const msgs = await talkTo(bot, 'fq_board', [6, 6, 6, 6, 0, 0, 3]);
  const menus = msgs.filter((m) => m.t === 'script' && m.steps.at(-1)?.[0] === 'choice').map((m) => m.steps.at(-1));
  assert.ok(said(msgs, /はり紙は26まい/));
  assert.match(menus[3][1], /4\/5ページ/);
  assert.deepEqual(menus[3][2], [...FAMILY_QUESTS.slice(18, 24).map((x) => x.name), 'つぎのページへ', '前のページへ', 'やめる']);
  assert.match(menus[4][1], /5\/5ページ/);
  assert.deepEqual(menus[4][2], [...FAMILY_QUESTS.slice(24, 26).map((x) => x.name), '前のページへ', 'やめる']);
  assert.equal(menus[4][3].length, menus[4][2].length, 'カーソルの せつめいも 同じ 数');
  assert.match(menus[4][3][0], /^必要な職業：超能力者の系統（×いない）/);
  assert.ok(said(msgs, /雲の下に落としちゃった/) && said(msgs, /このいらいを、うける？/) && said(msgs, /を受けた！/));
  assert.ok(c.flags[takeFlag(qd)] && !c.flags[qd.start]);
  assert.match(menus[6][1], /5\/5ページ/, '読んだら 5ページ目に もどる');
  assert.equal(menus[6][2][0], `${qd.name}（受けている）`);
  const e = q(c, qd.name);
  assert.ok(e && e.who === qd.npc && /ソヨに会おう/.test(e.text) && e.hint.includes(qd.where), 'クエストの 画面');
  assert.ok(marked(), '受けたら 地図に しるし');
  // 会って 受けると ふつうの 続き
  await talkTo(bot, qd.npc, [0]);
  assert.ok(c.flags[qd.start] && q(c, qd.name).find === 'fq_esp_v1');
  // やめる
  const m2 = await talkTo(bot, 'fq_board', [6, 6, 6, 6, 0, 0, 3]);
  assert.ok(said(m2, /をやめた/) && !c.flags[takeFlag(qd)] && !c.flags[qd.start] && !marked());
  assert.ok(!bot.s.busy);
});

// ───── 戦いの 強さ ─────
test('戦い: 新しい 2つ（敵Lv80）は お話の ころ（Lv78〜81）の 4人・2人・戦士ひとりでも 完全オートで 勝てる（ボスほど強くない）', () => {
  for (const id of ['fq_rockmole', 'fq_sandnight']) {
    const e = FIXED_ENCOUNTERS[id];
    assert.ok(e && !e.boss && e.canFlee === false && e.enemyLv === 80 && !(e.enemyPow > 1), id);
    for (const [sp] of e.group) assert.ok(MONSTER_ART[sp], `${sp} の 絵`);
    for (const jobs of [['warrior', 'priest', 'mage', 'monk'], ['warrior', 'priest'], ['warrior']]) {
      let win = 0;
      for (let i = 0; i < 6; i++) {
        const lv = 78 + (i % 4);
        const party = jobs.map((j, k) => makeChar(j, lv, 10, `p${k}`, 58));
        const r = runBattle(party, e.group.flatMap(([sp, n]) => Array(n).fill(sp)), { seed: 73 + i * 7919, enemyLv: e.enemyLv, enemyPow: e.enemyPow });
        if (r.outcome === 'win') win++;
      }
      assert.equal(win, 6, `${id} ${jobs.join('・')} 勝ち ${win}/6`);
    }
  }
});

// ───── 漢字 ─────
test('漢字: 新しい ファイルは gameFiles() に 入っていて、使えない 漢字・スペースが ない', () => {
  const files = ['shared/data/sidequests-work4.js', 'shared/maps/work-quests4.js', 'client/render/work4-art.js'].map((f) => gameFiles().find((g) => g.endsWith('/public/js/' + f)));
  assert.ok(files.every(Boolean), 'gameFiles() に 入っている');
  const bad = [];
  for (const f of files) for (const p of checkFile(f)) if (p.kind !== 'kana') bad.push(`${f.split('/').pop()}:${p.line} [${p.kind} ${p.detail}] ${p.text}`);
  assert.deepEqual(bad, []);
  for (const qd of WORK4_QUESTS) for (const t of [qd.name, qd.paper, qd.who, qd.where, qd.job]) assert.deepEqual(checkText(t).filter((p) => p.kind !== 'kana'), [], t);
  assert.deepEqual(checkText(ITEMS.fq_sand_amulet.name + ITEMS.fq_sand_amulet.desc).filter((p) => p.kind !== 'kana'), []);
});
