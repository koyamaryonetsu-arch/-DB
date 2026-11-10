// 第74回 D班: 第8章 第2幕の 千年前の クモイの 海の より道 2つ（docs/plan-ch8.md の 6-3。data/sidequests-c8bd.js・maps/c8bd-side.js）
// 1. 赤ちゃんウミガメの、初めての海（おばあさんの 月の 光の 話・漁師の 男の子の カモメの 話 → すな山で あかりと カモメ → 海へ）
// 2. ナギの村の、かくれんぼ（なぞなぞの ヒントで 村の 3か所に かくれた 子どもを 見つける）
// c8_abyss の あとだけ・c7s_sea の ナギの村と ナギの島の 南の はまに 人を 足すだけ（A班の c8b_* マップには 出ない）・まちがえても やり直せる・
// ごほうびは 少し（装備なし）・1回だけ・クエストの 画面・地図の しるし・困っている人・漢字
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, condOk, isBlocked } from '../public/js/shared/maps/index.js';
import { SCRIPTS } from '../public/js/shared/data/story.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { C8BD_SIDE_QUESTS, C8BD_SCRIPTS, TURTLE8_PLAN, c8bdSubQuests } from '../public/js/shared/data/sidequests-c8bd.js';
import { C8BD_OPEN, TURTLE8, TURTLE8_VOICES, TURTLE8_STEPS, HIDE8, HIDE8_FOUND, C8BD_NPC_IDS } from '../public/js/shared/maps/c8bd-side.js';
import { VILLAGE } from '../public/js/shared/maps/c7s-flags.js';
import { labDoneQuests } from '../public/js/shared/data/sidequests.js';
import { subQuests, questMarks } from '../public/js/shared/data/quest-targets.js';
import { availableSubQuests, subQuestHint, subQuestHints } from '../public/js/shared/data/subquest-hints.js';
import { itemCount } from '../public/js/shared/stats.js';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { npcOpts } from '../public/js/client/render/chars.js';
import { checkFile, gameFiles, checkText } from '../tools/kanji-check.mjs';
import { setup, npcAnywhere, talkTo, said, battled, CLEAR } from './fq-helpers.js';

// 第7章 第2幕（千年前の クモイの 海）・第8章 第1幕の さいごまで・第2幕の はじめ（c8_sea）
const BEFORE = [...CLEAR, 'c6_clear', 'c7_start', 'c7_kingdom', 'c7_karim', 'c7_sea', 'c7s_arrive', 'c7_isle', 'c7_reef', 'c7_lamp', 'c7_kai', 'c7s_lwin', 'c7_clear',
  'c8_start', 'c8_kingdom', 'c8_jafar', 'c8_sea'];
const OPEN = [...BEFORE, C8BD_OPEN];
const Q = Object.fromEntries(C8BD_SIDE_QUESTS.map((x) => [x.id, x]));
const q = (c, name) => subQuests(c).find((x) => x.name === name);
const shows = (id, c) => condOk(npcAnywhere(id).n.show, (f) => !!c.flags[f]);
const inVillage = (n) => n.x >= VILLAGE.x && n.y >= VILLAGE.y && n.x < VILLAGE.x + VILLAGE.w && n.y < VILLAGE.y + VILLAGE.h;

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

test('しくみ: 千年前の クモイの 海に 人を 足すだけ・c8_abyss の あとから・だいほん・人の 絵', () => {
  assert.equal(C8BD_SIDE_QUESTS.length, 2);
  for (const id of C8BD_NPC_IDS) {
    const at = npcAnywhere(id);
    assert.ok(at && at.map === 'c7s_sea', `${id} は 千年前の クモイの 海`);
    assert.equal(condOk(at.n.show, (f) => BEFORE.includes(f)), false, `${id} は c8_abyss の 前は 出ない`);
    assert.ok(SCRIPTS[at.n.script] && SCRIPTS[at.n.script] === C8BD_SCRIPTS[at.n.script], `${id} の だいほん`);
    const n = at.n;
    const m = MAPS.c7s_sea;
    assert.ok(!isBlocked(m, Math.floor(n.x), Math.floor(n.y), () => true) || n.solid, `${id} の 場所`);
    if (n.sprite.startsWith('mon:')) assert.ok(MONSTER_ART[n.sprite.slice(4)], `${id} の 絵`);
    else assert.ok(npcOpts(n.sprite), `${id} の みため`);
  }
  // かくれんぼの 人は 村の 中・ウミガメの 人は ナギの島の 南の はま（村の 外）
  for (const id of C8BD_NPC_IDS.filter((x) => x.startsWith('c8bd_hide'))) assert.ok(inVillage(npcAnywhere(id).n), `${id} は 村の 中`);
  for (const id of C8BD_NPC_IDS.filter((x) => x.startsWith('c8bd_turtle'))) {
    const { n } = npcAnywhere(id);
    assert.ok(!inVillage(n) && MAPS.c7s_sea.areaName(Math.floor(n.x), Math.floor(n.y)) === 'ナギの島', `${id} は ナギの島の はま`);
  }
  // A班の 第8章の マップ（c8b_*）や 今の 時代には 出ない
  for (const m of Object.values(MAPS)) if (m.id !== 'c7s_sea') assert.ok(!m.npcs.some((n) => C8BD_NPC_IDS.includes(n.id)), m.id);
  // 前は 受けられない
  const pre = { flag: (f) => BEFORE.includes(f), has: () => false, count: () => 0, night: false, name: 'ソラ', c: { job: 'warrior' } };
  for (const qd of C8BD_SIDE_QUESTS) assert.ok(!JSON.stringify(SCRIPTS[qd.npc](pre)).includes('"choice"'), `${qd.id} は 受けられない`);
  assert.deepEqual(c8bdSubQuests({ flags: {} }, () => false), []);
  // ごほうびは 少し（装備・大事な物 なし。お金も ひかえめ）
  for (const qd of C8BD_SIDE_QUESTS) {
    assert.ok(qd.reward.gold > 0 && qd.reward.gold <= 3000, qd.id);
    for (const [id, n] of qd.reward.goods) assert.ok(ITEMS[id] && !['weapon', 'armor', 'shield', 'head', 'acc', 'key'].includes(ITEMS[id].type) && n > 0 && n <= 3, `${qd.id}: ${id}`);
  }
});

test('赤ちゃんウミガメの、初めての海: 2人の話 → すな山で あかりと カモメ（やり直し）→ 海へ → ごほうび（だれでも・戦いなし）', async () => {
  const { bot, c } = await setup(7411, { job: 'mage', flags: OPEN });
  const qd = Q.c8bd_turtle;
  assert.ok(!shows('c8bd_turtle_nest', c), '受ける 前は すな山が ない');
  await talkTo(bot, 'c8bd_turtle_host', [0]);
  assert.ok(c.flags[TURTLE8.start] && shows('c8bd_turtle_nest', c));
  assert.equal(q(c, qd.name).find, 'c8bd_turtle_v1');
  // 話を 聞く 前は 決められない
  let msgs = await talkTo(bot, 'c8bd_turtle_nest');
  assert.ok(said(msgs, /もう少し聞いてみよう/) && !said(msgs, /どうやって、みちびく/));
  for (const id of ['c8bd_turtle_v1', 'c8bd_turtle_v2']) await talkTo(bot, id);
  assert.ok(TURTLE8_VOICES.every((k) => c.flags[k]) && q(c, qd.name).find === 'c8bd_turtle_nest');
  const ans = TURTLE8_PLAN.map((x) => x.ans);
  msgs = await talkTo(bot, 'c8bd_turtle_nest', [ans[0] === 0 ? 1 : 0]);
  assert.ok(!c.flags[TURTLE8_STEPS[0]] && said(msgs, /みんなの話を、思い出して/), '1つ目の まちがい');
  msgs = await talkTo(bot, 'c8bd_turtle_nest', [ans[0], 0]);
  assert.ok(c.flags[TURTLE8_STEPS[0]] && !c.flags[TURTLE8_STEPS[1]] && said(msgs, /カモメも、おなかがすいている/), '2つ目で まちがい（石は 投げない）');
  msgs = await talkTo(bot, 'c8bd_turtle_nest', [ans[1]]);
  assert.ok(c.flags[TURTLE8.hatch] && said(msgs, /波の中へ/) && !battled(msgs, ''));
  assert.ok(q(c, qd.name).ready && q(c, qd.name).who === 'c8bd_turtle_host');
  await rewarded(c, qd, () => talkTo(bot, 'c8bd_turtle_host'));
});

test('ナギの村の、かくれんぼ: ヒント → 村の 3か所の 子どもを 見つける（どの じゅんでも）→ ごほうび（だれでも・戦いなし）', async () => {
  const { bot, c } = await setup(7412, { job: 'warrior', flags: OPEN });
  const qd = Q.c8bd_hide;
  for (let i = 1; i <= 3; i++) assert.ok(!shows(`c8bd_hide_k${i}`, c), '受ける 前は かくれていない');
  let msgs = await talkTo(bot, 'c8bd_hide_host', [0]);
  assert.ok(c.flags[HIDE8.start] && said(msgs, /旅の人が、ねむる家の、うら/));
  for (let i = 1; i <= 3; i++) assert.ok(shows(`c8bd_hide_k${i}`, c));
  const e = q(c, qd.name);
  assert.ok(e && !e.find && /0\/3/.test(e.text), 'かくれ場所は 地図に 出さない');
  // ヤシの木 → 宿屋の うら（どの じゅんでも）
  msgs = await talkTo(bot, 'c8bd_hide_k3');
  assert.ok(c.flags[HIDE8_FOUND[2]] && said(msgs, /あと2人/) && !shows('c8bd_hide_k3', c));
  msgs = await talkTo(bot, 'c8bd_hide_host');
  assert.ok(said(msgs, /今、1人見つけた/) && !c.flags[HIDE8.done]);
  await talkTo(bot, 'c8bd_hide_k1');
  msgs = await talkTo(bot, 'c8bd_hide_k2');
  assert.ok(HIDE8_FOUND.every((k) => c.flags[k]) && said(msgs, /トトに知らせよう/) && !battled(msgs, ''));
  assert.ok(q(c, qd.name).ready);
  await rewarded(c, qd, () => talkTo(bot, 'c8bd_hide_host'));
});

test('クエストの 画面・地図の しるし・困っている人（c8_abyss の あとから）・漢字', () => {
  const all = { flags: Object.fromEntries([...OPEN, TURTLE8.start, HIDE8.start].map((f) => [f, true])), items: [], keyItems: [] };
  for (const qd of C8BD_SIDE_QUESTS) {
    const e = q(all, qd.name);
    assert.ok(e && npcAnywhere(e.who) && (!e.find || npcAnywhere(e.find)), qd.id);
    assert.deepEqual(checkText(e.text + e.hint).filter((p) => p.kind !== 'kana'), [], qd.id);
    assert.ok(questMarks(all, 'c7s_sea', '').some((m) => m.label === qd.name), `${qd.id}: 地図の しるし`);
    const h = subQuestHint(qd.id);
    assert.ok(h && h.npc === qd.npc && h.open.includes(C8BD_OPEN) && h.start === qd.start && h.done === qd.done && h.hint.length <= 60, `${qd.id}: 困っている人`);
  }
  assert.ok(subQuestHints().filter((h) => h.id.startsWith('c8bd_')).length === 2);
  const ids = (flags) => availableSubQuests({ flags: Object.fromEntries(flags.map((f) => [f, true])) }).map((h) => h.id);
  assert.ok(!ids(BEFORE).some((id) => id.startsWith('c8bd_')), 'c8_abyss の 前は 出ない');
  assert.deepEqual(ids(OPEN).filter((id) => id.startsWith('c8bd_')), ['c8bd_turtle', 'c8bd_hide']);
  assert.ok(!availableSubQuests(all).some((h) => h.id.startsWith('c8bd_')), '受けたら 消える');
  const none = { flags: Object.fromEntries(OPEN.map((f) => [f, true])), items: [], keyItems: [] };
  for (const qd of C8BD_SIDE_QUESTS) assert.ok(!q(none, qd.name), qd.id);
  // 漢字
  const files = ['shared/data/sidequests-c8bd.js', 'shared/maps/c8bd-side.js'].map((f) => gameFiles().find((g) => g.endsWith('/public/js/' + f)));
  assert.ok(files.every(Boolean), 'gameFiles() に 入っている');
  const bad = [];
  for (const f of files) for (const p of checkFile(f)) if (p.kind !== 'kana') bad.push(`${f.split('/').pop()}:${p.line} [${p.kind} ${p.detail}] ${p.text}`);
  assert.deepEqual(bad, []);
});
