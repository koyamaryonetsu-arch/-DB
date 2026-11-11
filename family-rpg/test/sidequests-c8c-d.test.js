// 第75回 D班: 第8章 第3幕の 千年前の ミドリナの より道 2つ（docs/plan-ch8.md の 8-3。data/sidequests-c8cd.js・maps/c8cd-side.js）
// 1. ホシフルの里の、やきいも（おばあさんの やき方・かりゅうどの たしかめ方 → たき火の 灰の 山で 2つ 決める）
// 2. 泉の里の、しゃぼん玉（むくろじの 実・麦わら・せんたくの おばさんの 話 → 泉の そばで 2つ 決める）
// c8_spring の あとだけ・overworld_past の ホシフルの里・泉の里（と 南の 野原の 木）に 人を 足すだけ（A班の c8c_* マップには 出ない）・
// まちがえても やり直せる・ごほうびは 少し（装備なし）・1回だけ・クエストの 画面・地図の しるし・困っている人・漢字・
// ミナモ・リオンは より道に 出さない（第3幕の 物語と ぶつからない）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, condOk, isBlocked } from '../public/js/shared/maps/index.js';
import { SCRIPTS } from '../public/js/shared/data/story.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { C8CD_SIDE_QUESTS, C8CD_SCRIPTS, IMO8_PLAN, BUB8_PLAN, c8cdSubQuests } from '../public/js/shared/data/sidequests-c8cd.js';
import { C8CD_OPEN, IMO8, IMO8_VOICES, IMO8_STEPS, BUB8, BUB8_PARTS, BUB8_STEPS, C8CD_NPC_IDS } from '../public/js/shared/maps/c8cd-side.js';
import { HAMLET, SPRING, PAST_ID } from '../public/js/shared/maps/past.js';
import { labDoneQuests } from '../public/js/shared/data/sidequests.js';
import { subQuests, questMarks } from '../public/js/shared/data/quest-targets.js';
import { availableSubQuests, subQuestHint, subQuestHints } from '../public/js/shared/data/subquest-hints.js';
import { itemCount } from '../public/js/shared/stats.js';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { npcOpts } from '../public/js/client/render/chars.js';
import { checkFile, gameFiles, checkText } from '../tools/kanji-check.mjs';
import { setup, npcAnywhere, talkTo, said, battled, CLEAR } from './fq-helpers.js';

// 第6章クリア・第7章・第8章 第2幕の さいごまで・第3幕の はじめ（c8_sky）
const BEFORE = [...CLEAR, 'c6_past', 'c6_rion', 'c6_flow', 'c6_kanata', 'c6_clear', 'c7_start', 'c7_kingdom', 'c7_karim', 'c7_clear',
  'c8_start', 'c8_kingdom', 'c8_jafar', 'c8_sea', 'c8_abyss', 'c8_hades', 'c8_sky'];
const OPEN = [...BEFORE, C8CD_OPEN];
const Q = Object.fromEntries(C8CD_SIDE_QUESTS.map((x) => [x.id, x]));
const q = (c, name) => subQuests(c).find((x) => x.name === name);
const shows = (id, c) => condOk(npcAnywhere(id).n.show, (f) => !!c.flags[f]);
const inside = (n, r) => n.x >= r.x && n.y >= r.y && n.x < r.x + r.w && n.y < r.y + r.h;

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

test('しくみ: 千年前の ミドリナの 里に 人を 足すだけ・c8_spring の あとから・だいほん・人の 絵・ミナモと リオンは 出さない', () => {
  assert.equal(C8CD_SIDE_QUESTS.length, 2);
  const m = MAPS[PAST_ID];
  for (const id of C8CD_NPC_IDS) {
    const at = npcAnywhere(id);
    assert.ok(at && at.map === PAST_ID, `${id} は 千年前の ミドリナ地方`);
    assert.equal(condOk(at.n.show, (f) => BEFORE.includes(f)), false, `${id} は c8_spring の 前は 出ない`);
    assert.ok(SCRIPTS[at.n.script] && SCRIPTS[at.n.script] === C8CD_SCRIPTS[at.n.script], `${id} の だいほん`);
    const n = at.n;
    assert.ok(!isBlocked(m, Math.floor(n.x), Math.floor(n.y), () => true) || n.solid, `${id} の 場所`);
    if (n.sprite.startsWith('mon:')) assert.ok(MONSTER_ART[n.sprite.slice(4)], `${id} の 絵`);
    else assert.ok(npcOpts(n.sprite), `${id} の みため`);
    assert.ok(!/ミナモ|リオン/.test(n.name) && !['minamo', 'rion'].includes(n.sprite), `${id} は ミナモ・リオンでは ない`);
  }
  // やきいもは ホシフルの里・しゃぼん玉は 泉の里（むくろじの 木は 南の 野原・わらあみの おじいさんは ホシフルの里）
  for (const id of C8CD_NPC_IDS.filter((x) => x.startsWith('c8cd_imo'))) assert.ok(inside(npcAnywhere(id).n, HAMLET), `${id} は ホシフルの里`);
  for (const id of ['c8cd_bub_host', 'c8cd_bub_v1']) assert.ok(inside(npcAnywhere(id).n, SPRING), `${id} は 泉の里`);
  assert.ok(inside(npcAnywhere('c8cd_bub_straw').n, HAMLET));
  const tree = npcAnywhere('c8cd_bub_tree').n;
  assert.ok(!inside(tree, SPRING) && Math.abs(tree.y - (SPRING.y + SPRING.h)) < 6, 'むくろじの 木は 泉の里の 南');
  // A班の 第8章の マップ（c8c_*）や 今の 時代には 出ない
  for (const mm of Object.values(MAPS)) if (mm.id !== PAST_ID) assert.ok(!mm.npcs.some((n) => C8CD_NPC_IDS.includes(n.id)), mm.id);
  // ゆかを ふさがない（だいじな 場所: 泉・リオンと ミナモの いち・たき火・とびら）
  for (const id of C8CD_NPC_IDS) {
    const n = npcAnywhere(id).n;
    for (const o of m.npcs.filter((x) => ['rion', 'rion_spar', 'minamo_home', 'minamo_back', 'chibi_astel', 'p_prayer'].includes(x.id))) assert.ok(Math.floor(o.x) !== Math.floor(n.x) || Math.floor(o.y) !== Math.floor(n.y), `${id} と ${o.id}`);
  }
  // 前は 受けられない
  const pre = { flag: (f) => BEFORE.includes(f), has: () => false, count: () => 0, night: false, name: 'ソラ', c: { job: 'warrior' } };
  for (const qd of C8CD_SIDE_QUESTS) assert.ok(!JSON.stringify(SCRIPTS[qd.npc](pre)).includes('"choice"'), `${qd.id} は 受けられない`);
  assert.deepEqual(c8cdSubQuests({ flags: {} }, () => false), []);
  // ごほうびは 少し（装備・大事な物 なし。お金も ひかえめ）
  for (const qd of C8CD_SIDE_QUESTS) {
    assert.ok(qd.reward.gold > 0 && qd.reward.gold <= 3000, qd.id);
    for (const [id, n] of qd.reward.goods) assert.ok(ITEMS[id] && !['weapon', 'armor', 'shield', 'head', 'acc', 'key'].includes(ITEMS[id].type) && n > 0 && n <= 3, `${qd.id}: ${id}`);
  }
});

test('ホシフルの里の、やきいも: 2人の話 → 灰の山で やき方と たしかめ方（やり直し）→ みんなで食べる → ごほうび（だれでも・戦いなし）', async () => {
  const { bot, c } = await setup(7511, { job: 'mage', flags: OPEN });
  const qd = Q.c8cd_imo;
  assert.ok(!shows('c8cd_imo_fire', c), '受ける 前は 灰の山が ない');
  await talkTo(bot, 'c8cd_imo_host', [0]);
  assert.ok(c.flags[IMO8.start] && shows('c8cd_imo_fire', c));
  assert.equal(q(c, qd.name).find, 'c8cd_imo_v1');
  let msgs = await talkTo(bot, 'c8cd_imo_fire');
  assert.ok(said(msgs, /焼き方を、聞いてみよう/) && !said(msgs, /どうやって焼く/));
  for (const id of ['c8cd_imo_v1', 'c8cd_imo_v2']) await talkTo(bot, id);
  assert.ok(IMO8_VOICES.every((k) => c.flags[k]) && q(c, qd.name).find === 'c8cd_imo_fire');
  const ans = IMO8_PLAN.map((x) => x.ans);
  msgs = await talkTo(bot, 'c8cd_imo_fire', [0]);
  assert.ok(!c.flags[IMO8_STEPS[0]] && said(msgs, /まっ黒こげ/) && said(msgs, /思い出して/), '1つ目の まちがい（ほのおに 入れる）');
  msgs = await talkTo(bot, 'c8cd_imo_fire', [ans[0], 0]);
  assert.ok(c.flags[IMO8_STEPS[0]] && !c.flags[IMO8_STEPS[1]] && said(msgs, /さめてしまった/), '2つ目で まちがい');
  msgs = await talkTo(bot, 'c8cd_imo_fire', [ans[1]]);
  assert.ok(c.flags[IMO8.baked] && said(msgs, /ほくほく/) && !battled(msgs, ''));
  assert.ok(q(c, qd.name).ready && q(c, qd.name).who === 'c8cd_imo_host');
  await rewarded(c, qd, () => talkTo(bot, 'c8cd_imo_host'));
});

test('泉の里の、しゃぼん玉: むくろじの実・麦わら・せんたくの話（どの じゅんでも）→ しゃぼん液と ふき方（やり直し）→ 里の空へ → ごほうび（だれでも・戦いなし）', async () => {
  const { bot, c } = await setup(7512, { job: 'warrior', flags: OPEN });
  const qd = Q.c8cd_bub;
  assert.ok(!shows('c8cd_bub_tree', c), '受ける 前は 木に 用が ない');
  let msgs = await talkTo(bot, 'c8cd_bub_host', [0]);
  assert.ok(c.flags[BUB8.start] && shows('c8cd_bub_tree', c) && said(msgs, /むくろじの実/));
  assert.equal(q(c, qd.name).find, 'c8cd_bub_tree');
  // じゅんびの 前は ふけない
  msgs = await talkTo(bot, 'c8cd_bub_host');
  assert.ok(said(msgs, /今0つ/) && !said(msgs, /どうする？/));
  // 麦わら → 実 → せんたくの 話（どの じゅんでも）
  msgs = await talkTo(bot, 'c8cd_bub_straw');
  assert.ok(c.flags[BUB8_PARTS[1]] && said(msgs, /そーっと、ゆっくり/));
  assert.equal(q(c, qd.name).find, 'c8cd_bub_tree');
  await talkTo(bot, 'c8cd_bub_tree');
  assert.ok(c.flags[BUB8_PARTS[0]] && q(c, qd.name).find === 'c8cd_bub_v1');
  await talkTo(bot, 'c8cd_bub_v1');
  assert.ok(BUB8_PARTS.every((k) => c.flags[k]) && !q(c, qd.name).find && /しゃぼん玉をふこう/.test(q(c, qd.name).text));
  const ans = BUB8_PLAN.map((x) => x.ans);
  msgs = await talkTo(bot, 'c8cd_bub_host', [0]);
  assert.ok(!c.flags[BUB8_STEPS[0]] && said(msgs, /ぷかぷか/), '1つ目の まちがい（そのまま 投げる）');
  msgs = await talkTo(bot, 'c8cd_bub_host', [ans[0], 0]);
  assert.ok(c.flags[BUB8_STEPS[0]] && !c.flags[BUB8_STEPS[1]] && said(msgs, /パチン/), '2つ目で まちがい（強く ふく）');
  msgs = await talkTo(bot, 'c8cd_bub_host', [ans[1]]);
  assert.ok(c.flags[BUB8.blown] && said(msgs, /にじ色/) && !battled(msgs, ''));
  assert.ok(q(c, qd.name).ready && q(c, qd.name).who === 'c8cd_bub_host');
  await rewarded(c, qd, () => talkTo(bot, 'c8cd_bub_host'));
});

test('クエストの 画面・地図の しるし・困っている人（c8_spring の あとから）・漢字', () => {
  const all = { flags: Object.fromEntries([...OPEN, IMO8.start, BUB8.start].map((f) => [f, true])), items: [], keyItems: [] };
  for (const qd of C8CD_SIDE_QUESTS) {
    const e = q(all, qd.name);
    assert.ok(e && npcAnywhere(e.who) && (!e.find || npcAnywhere(e.find)), qd.id);
    assert.deepEqual(checkText(e.text + e.hint).filter((p) => p.kind !== 'kana'), [], qd.id);
    assert.ok(questMarks(all, PAST_ID, '').some((m) => m.label === qd.name), `${qd.id}: 地図の しるし`);
    const h = subQuestHint(qd.id);
    assert.ok(h && h.npc === qd.npc && h.open.includes(C8CD_OPEN) && h.start === qd.start && h.done === qd.done && h.hint.length <= 60, `${qd.id}: 困っている人`);
  }
  assert.ok(subQuestHints().filter((h) => h.id.startsWith('c8cd_')).length === 2);
  const ids = (flags) => availableSubQuests({ flags: Object.fromEntries(flags.map((f) => [f, true])) }).map((h) => h.id);
  assert.ok(!ids(BEFORE).some((id) => id.startsWith('c8cd_')), 'c8_spring の 前は 出ない');
  assert.deepEqual(ids(OPEN).filter((id) => id.startsWith('c8cd_')), ['c8cd_imo', 'c8cd_bub']);
  assert.ok(!availableSubQuests(all).some((h) => h.id.startsWith('c8cd_')), '受けたら 消える');
  const none = { flags: Object.fromEntries(OPEN.map((f) => [f, true])), items: [], keyItems: [] };
  for (const qd of C8CD_SIDE_QUESTS) assert.ok(!q(none, qd.name), qd.id);
  // 漢字
  const files = ['shared/data/sidequests-c8cd.js', 'shared/maps/c8cd-side.js'].map((f) => gameFiles().find((g) => g.endsWith('/public/js/' + f)));
  assert.ok(files.every(Boolean), 'gameFiles() に 入っている');
  const bad = [];
  for (const f of files) for (const p of checkFile(f)) if (p.kind !== 'kana') bad.push(`${f.split('/').pop()}:${p.line} [${p.kind} ${p.detail}] ${p.text}`);
  assert.deepEqual(bad, []);
});
