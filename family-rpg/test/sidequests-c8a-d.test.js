// 第73回 D班: 第8章 第1幕の 千年前の 緑の王国の より道 2つ（docs/plan-ch8.md の 5-3。data/sidequests-c8d.js・maps/c8d-side.js）
// 1. 王宮の子どもと、迷子の子ラクダ（妹の 子守歌・東の 門の 見張り → 王家の森で 子ラクダを 見つける → つれて 帰る）
// 2. 市場のずるい分銅（果物売りの 話・はかりの にせの 分銅 → 大臣の 家来と 話して あやまってもらう）
// c8_kingdom の あとだけ・c7_field の 緑の王国に 人を 足すだけ（A班の c8a_* マップには 出ない）・まちがえても やり直せる・
// ごほうびは 少し（装備なし）・1回だけ・クエストの 画面・地図の しるし・困っている人・漢字
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, condOk } from '../public/js/shared/maps/index.js';
import { SCRIPTS } from '../public/js/shared/data/story.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { C8D_SIDE_QUESTS, C8D_SCRIPTS, CAMEL8_WAYS, CAMEL8_ANSWER, MARKET8_PLAN, c8dSubQuests } from '../public/js/shared/data/sidequests-c8d.js';
import { C8D_OPEN, CAMEL8, CAMEL8_VOICES, MARKET8, MARKET8_VOICES, MARKET8_STEPS, C8D_NPC_IDS } from '../public/js/shared/maps/c8d-side.js';
import { KINGDOM } from '../public/js/shared/maps/c7-flags.js';
import { labDoneQuests } from '../public/js/shared/data/sidequests.js';
import { subQuests, questMarks } from '../public/js/shared/data/quest-targets.js';
import { availableSubQuests, subQuestHint, subQuestHints } from '../public/js/shared/data/subquest-hints.js';
import { itemCount } from '../public/js/shared/stats.js';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { npcOpts } from '../public/js/client/render/chars.js';
import { checkFile, gameFiles, checkText } from '../tools/kanji-check.mjs';
import { setup, npcAnywhere, talkTo, said, battled, CLEAR } from './fq-helpers.js';

const BEFORE = [...CLEAR, 'c6_clear', 'c7_start', 'c7_kingdom', 'c7_karim', 'c7_clear', 'c8_start'];
const OPEN = [...BEFORE, C8D_OPEN];
const Q = Object.fromEntries(C8D_SIDE_QUESTS.map((x) => [x.id, x]));
const q = (c, name) => subQuests(c).find((x) => x.name === name);
const shows = (id, c) => condOk(npcAnywhere(id).n.show, (f) => !!c.flags[f]);
const inKingdom = (n) => n.x >= KINGDOM.x && n.y >= KINGDOM.y && n.x < KINGDOM.x + KINGDOM.w && n.y < KINGDOM.y + KINGDOM.h;

async function rewarded(c, qd, talk) {
  const gold0 = c.gold;
  const goods0 = qd.reward.goods.map(([id]) => itemCount(c, id));
  await talk();
  const check = (note) => {
    assert.ok(c.flags[qd.done], `${qd.id}: すんだ`);
    qd.reward.goods.forEach(([id, n], i) => assert.equal(itemCount(c, id), goods0[i] + n, `${qd.id}: ${id}${note}`));
    assert.equal(c.gold, gold0 + qd.reward.gold, `${qd.id}: ゴールド${note}`);
  };
  check('');
  assert.ok(labDoneQuests(c).includes(qd.name) && !q(c, qd.name), `${qd.id}: クエストの 画面`);
  await talk();
  check('（1回だけ）');
}

test('しくみ: 千年前の 緑の王国に 人を 足すだけ・c8_kingdom の あとから・だいほん・人の 絵', () => {
  assert.equal(C8D_SIDE_QUESTS.length, 2);
  for (const id of C8D_NPC_IDS) {
    const at = npcAnywhere(id);
    assert.ok(at && at.map === 'c7_field', `${id} は 千年前の コガネ地方`);
    assert.equal(condOk(at.n.show, (f) => BEFORE.includes(f)), false, `${id} は c8_kingdom の 前は 出ない`);
    assert.ok(SCRIPTS[at.n.script] && SCRIPTS[at.n.script] === C8D_SCRIPTS[at.n.script], `${id} の だいほん`);
    const n = at.n;
    if (n.sprite.startsWith('mon:')) assert.ok(MONSTER_ART[n.sprite.slice(4)], `${id} の 絵`);
    else assert.ok(npcOpts(n.sprite) || n.sprite === 'camel', `${id} の みため`);
  }
  // 子ラクダ（森）と 帰った 子ラクダの ほかは、王国の 中
  for (const id of C8D_NPC_IDS.filter((x) => x !== 'c8d_camel')) assert.ok(inKingdom(npcAnywhere(id).n), `${id} は 王国の 中`);
  assert.equal(MAPS.c7_field.areaName(npcAnywhere('c8d_camel').n.x, npcAnywhere('c8d_camel').n.y), '王家の森');
  // A班の 第8章の マップ（c8a_*）や 今の 時代には 出ない
  for (const m of Object.values(MAPS)) if (m.id !== 'c7_field') assert.ok(!m.npcs.some((n) => C8D_NPC_IDS.includes(n.id)), m.id);
  // 前は 受けられない
  const pre = { flag: (f) => BEFORE.includes(f), has: () => false, count: () => 0, night: false, name: 'ソラ', c: { job: 'warrior' } };
  for (const qd of C8D_SIDE_QUESTS) assert.ok(!JSON.stringify(SCRIPTS[qd.npc](pre)).includes('"choice"'), `${qd.id} は 受けられない`);
  assert.deepEqual(c8dSubQuests({ flags: {} }, () => false), []);
  // ごほうびは 少し（装備・大事な物 なし。お金も ひかえめ）
  for (const qd of C8D_SIDE_QUESTS) {
    assert.ok(qd.reward.gold > 0 && qd.reward.gold <= 3000, qd.id);
    for (const [id, n] of qd.reward.goods) assert.ok(ITEMS[id] && !['weapon', 'armor', 'shield', 'head', 'acc', 'key'].includes(ITEMS[id].type) && n > 0 && n <= 3, `${qd.id}: ${id}`);
  }
});

test('王宮の子どもと、迷子の子ラクダ: 2人の話 → 王家の森で 子守歌（やり直し）→ つれて帰る → ごほうび（だれでも・戦いなし）', async () => {
  const { bot, c } = await setup(7311, { job: 'mage', flags: OPEN });
  const qd = Q.c8d_camel;
  assert.ok(!shows('c8d_camel', c), '受ける 前は 森に いない');
  await talkTo(bot, 'c8d_camel_host', [0]);
  assert.ok(c.flags[CAMEL8.start] && shows('c8d_camel', c) && !shows('c8d_camel_home', c));
  assert.equal(q(c, qd.name).find, 'c8d_camel_v1');
  // 話を 聞く 前は 近づけない
  let msgs = await talkTo(bot, 'c8d_camel');
  assert.ok(!c.flags[CAMEL8.found] && said(msgs, /もう少し聞いてみよう/) && !said(msgs, /どうやってつれて帰る/));
  for (const id of ['c8d_camel_v1', 'c8d_camel_v2']) await talkTo(bot, id);
  assert.ok(CAMEL8_VOICES.every((k) => c.flags[k]) && q(c, qd.name).find === 'c8d_camel');
  // まちがえると にげる（もう一度）
  msgs = await talkTo(bot, 'c8d_camel', [CAMEL8_ANSWER === 0 ? 1 : 0]);
  assert.ok(!c.flags[CAMEL8.found] && said(msgs, /ルルの話を、思い出して/) && !battled(msgs, ''));
  msgs = await talkTo(bot, 'c8d_camel', [CAMEL8_ANSWER]);
  assert.ok(c.flags[CAMEL8.found] && said(msgs, /ねんねん、ラクダの子/));
  assert.equal(CAMEL8_WAYS[CAMEL8_ANSWER], 'ルルの子守歌を、やさしく歌う');
  assert.ok(!shows('c8d_camel', c) && shows('c8d_camel_home', c), '子ラクダは 広場へ');
  assert.ok(q(c, qd.name).ready && q(c, qd.name).who === 'c8d_camel_host');
  await rewarded(c, qd, () => talkTo(bot, 'c8d_camel_host'));
});

test('市場のずるい分銅: 果物売りの話・はかり → 大臣の家来と話す（やり直し）→ あやまる → ごほうび（だれでも・戦いなし）', async () => {
  const { bot, c } = await setup(7312, { job: 'warrior', flags: OPEN });
  const qd = Q.c8d_market;
  await talkTo(bot, 'c8d_mk_host', [0]);
  assert.ok(c.flags[MARKET8.start]);
  assert.equal(q(c, qd.name).find, 'c8d_mk_v1');
  // 手がかりが そろう 前の 家来は 相手に しない
  let msgs = await talkTo(bot, 'c8d_mk_servant');
  assert.ok(!said(msgs, /何を見せる/) && said(msgs, /あっちへ行け/));
  await talkTo(bot, 'c8d_mk_v1');
  assert.ok(MARKET8_VOICES.every((k) => c.flags[k]) && q(c, qd.name).find === 'c8d_mk_scale');
  msgs = await talkTo(bot, 'c8d_mk_scale');
  assert.ok(c.flags[MARKET8.weight] && said(msgs, /にせの分銅だ/));
  assert.equal(q(c, qd.name).find, 'c8d_mk_servant');
  const ans = MARKET8_PLAN.map((x) => x.ans);
  msgs = await talkTo(bot, 'c8d_mk_servant', [ans[0] === 0 ? 1 : 0]);
  assert.ok(!c.flags[MARKET8_STEPS[0]] && said(msgs, /もう一度、話してみよう/), '1つ目の まちがい');
  msgs = await talkTo(bot, 'c8d_mk_servant', [ans[0], ans[1] === 0 ? 1 : 0]);
  assert.ok(c.flags[MARKET8_STEPS[0]] && !c.flags[MARKET8_STEPS[1]] && !c.flags[MARKET8.solved], '2つ目で まちがい（1つ目は 決まったまま）');
  msgs = await talkTo(bot, 'c8d_mk_servant', [ans[1]]);
  assert.ok(c.flags[MARKET8.solved] && said(msgs, /ごめんなさい/) && !battled(msgs, ''));
  assert.ok(q(c, qd.name).ready && q(c, qd.name).who === 'c8d_mk_host');
  await rewarded(c, qd, () => talkTo(bot, 'c8d_mk_host'));
});

test('クエストの 画面・地図の しるし・困っている人（c8_kingdom の あとから）・漢字', () => {
  const all = { flags: Object.fromEntries([...OPEN, CAMEL8.start, MARKET8.start].map((f) => [f, true])), items: [], keyItems: [] };
  for (const qd of C8D_SIDE_QUESTS) {
    const e = q(all, qd.name);
    assert.ok(e && npcAnywhere(e.who) && (!e.find || npcAnywhere(e.find)), qd.id);
    assert.deepEqual(checkText(e.text + e.hint).filter((p) => p.kind !== 'kana'), [], qd.id);
    assert.ok(questMarks(all, 'c7_field', '').some((m) => m.label === qd.name), `${qd.id}: 地図の しるし`);
    const h = subQuestHint(qd.id);
    assert.ok(h && h.npc === qd.npc && h.open.includes(C8D_OPEN) && h.start === qd.start && h.done === qd.done && h.hint.length <= 60, `${qd.id}: 困っている人`);
  }
  assert.ok(subQuestHints().filter((h) => h.id.startsWith('c8d_')).length === 2);
  const ids = (flags) => availableSubQuests({ flags: Object.fromEntries(flags.map((f) => [f, true])) }).map((h) => h.id);
  assert.ok(!ids(BEFORE).some((id) => id.startsWith('c8d_')), 'c8_kingdom の 前は 出ない');
  assert.deepEqual(ids(OPEN).filter((id) => id.startsWith('c8d_')), ['c8d_camel', 'c8d_market']);
  assert.ok(!availableSubQuests(all).some((h) => h.id.startsWith('c8d_')), '受けたら 消える');
  // 受ける 前は クエストの 画面に 出ない
  const none = { flags: Object.fromEntries(OPEN.map((f) => [f, true])), items: [], keyItems: [] };
  for (const qd of C8D_SIDE_QUESTS) assert.ok(!q(none, qd.name), qd.id);
  // 漢字
  const files = ['shared/data/sidequests-c8d.js', 'shared/maps/c8d-side.js'].map((f) => gameFiles().find((g) => g.endsWith('/public/js/' + f)));
  assert.ok(files.every(Boolean), 'gameFiles() に 入っている');
  const bad = [];
  for (const f of files) for (const p of checkFile(f)) if (p.kind !== 'kana') bad.push(`${f.split('/').pop()}:${p.line} [${p.kind} ${p.detail}] ${p.text}`);
  assert.deepEqual(bad, []);
});
