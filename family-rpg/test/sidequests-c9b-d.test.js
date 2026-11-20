// 第92回 D班: 第3部 第1章 第2幕の あとの より道 2つ（docs/plan-part3.md の 11-6 の D班。data/sidequests-c9bd.js・maps/c9bd-side.js）
// 1. 大王の、大きなランタン … 村の 子が 大王の ための 大きな 頭の ランタンを 作りたい → 大地の下の 3か所で ざいりょう → 大王に わたす
// 2. まいごの、もぐら兵 … 帰り道の こけ石を、まいごの ポコに 近い 方から じゅんばんに ともす → ポコが 帰る
// c9_act2 の あとだけ（持たない 人には 見えない）・大地の下に 人を 足すだけ（船着き場の まわりと その 番人には 置かない）・
// ひとりでも とける・ごほうびは 少し（装備なし）・1回だけ・クエストの 画面・地図の しるし・困っている人・しおり・漢字・
// 道を ふさがない（大地の下の 着いた 所から 人と 物に とどく）・第3幕より 先の 物語と ひみつ・カイは 出さない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MAPS, condOk, isBlocked } from '../public/js/shared/maps/index.js';
import { SCRIPTS } from '../public/js/shared/data/story.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { C9BD_SIDE_QUESTS, C9BD_SCRIPTS, LAMP9_ITEMS, c9bdSubQuests } from '../public/js/shared/data/sidequests-c9bd.js';
import { C9BD_OPEN, LAMP9, LAMP9_GOT, MOLE9, MOLE9_LIT, C9BD_NPC_IDS } from '../public/js/shared/maps/c9bd-side.js';
import { WORK9_NPC_IDS } from '../public/js/shared/maps/work-quests9.js';
import { C9A_LINE } from '../public/js/shared/maps/c9a-flags.js';
import { C9B, C9B_LINE, C9B_PILLARS } from '../public/js/shared/maps/c9b-flags.js';
import { UNDER_POS } from '../public/js/shared/maps/c9b-rows.js';
import { labDoneQuests } from '../public/js/shared/data/sidequests.js';
import { subQuests, questMarks } from '../public/js/shared/data/quest-targets.js';
import { availableSubQuests, subQuestHint } from '../public/js/shared/data/subquest-hints.js';
import { shioriOf } from '../public/js/shared/world/shiori.js';
import { itemCount } from '../public/js/shared/stats.js';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { npcOpts } from '../public/js/client/render/chars.js';
import { CH6_SPECIALS } from '../public/js/client/render/ch6-art.js';
import { checkFile, gameFiles, checkText } from '../tools/kanji-check.mjs';
import { setup, npcAnywhere, talkTo, said, battled, CLEAR } from './fq-helpers.js';

const PART2 = [...CLEAR, 'c6_past', 'c6_rion', 'c6_flow', 'c6_kanata', 'c6_clear', 'c7_start', 'c7_kingdom', 'c7_karim', 'c7_clear',
  'c8_start', 'c8_kingdom', 'c8_jafar', 'c8_sea', 'c8_abyss', 'c8_hades', 'c8_sky', 'c8_spring', 'c8_fortress', 'c8_bowser', 'c8_rift', 'c8_hall', 'c8_solitus'];
// 第2幕の いかだまで（クリアの 前）・クリアの あと
const BEFORE = [...PART2, ...C9A_LINE, ...C9B_LINE.filter((f) => f !== C9B.act2)];
const OPEN = [...BEFORE, C9BD_OPEN];
const QD = Object.fromEntries(C9BD_SIDE_QUESTS.map((x) => [x.id, x]));
const q = (c, name) => subQuests(c).find((x) => x.name === name);
const shows = (id, c) => condOk(npcAnywhere(id).n.show, (f) => !!c.flags[f]);
const SRC = ['../public/js/shared/data/sidequests-c9bd.js', '../public/js/shared/maps/c9bd-side.js'].map((f) => readFileSync(new URL(f, import.meta.url), 'utf8')).join('\n');

async function rewarded(c, qd, talk, again) {
  const gold0 = c.gold;
  const goods0 = qd.reward.goods.map(([id]) => itemCount(c, id));
  const msgs = await talk();
  const check = (note) => {
    assert.ok(c.flags[qd.done], `すんだ${note}`);
    qd.reward.goods.forEach(([id, n], i) => assert.equal(itemCount(c, id), goods0[i] + n, `${id}${note}`));
    assert.equal(c.gold, gold0 + qd.reward.gold, `ゴールド${note}`);
  };
  check('');
  assert.ok(labDoneQuests(c).includes(qd.name) && !q(c, qd.name), 'クエストの 画面');
  await again();
  check('（1回だけ）');
  return msgs;
}

// 大地の下で 歩いて とどくか（かべ・宝箱・その時 出て いる かたい 人を さける。4方向）
function reach(flags, from) {
  const m = MAPS.c9b_under;
  const has = (f) => flags.includes(f);
  const solid = new Set();
  for (const n of m.npcs) if (n.solid !== false && condOk(n.show, has)) solid.add(Math.floor(n.y) * m.w + Math.floor(n.x));
  for (const ch of m.chests) if (condOk(ch.show, has)) solid.add(ch.y * m.w + ch.x);
  const seen = new Set([from.y * m.w + from.x]);
  const queue = [[from.x, from.y]];
  while (queue.length) {
    const [x, y] = queue.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = ny * m.w + nx;
      if (seen.has(k) || nx < 0 || ny < 0 || nx >= m.w || ny >= m.h || solid.has(k) || isBlocked(m, nx, ny, has)) continue;
      seen.add(k);
      queue.push([nx, ny]);
    }
  }
  // 人の となりの マスに 立てるか
  return (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has((y + dy) * m.w + x + dx));
}

test('しくみ: 大地の下に 人を 足すだけ・c9_act2 の あとから（持たない 人には 見えない）・だいほん・絵・船着き場の まわりには 置かない・フラグは 少なく・ひみつは 出さない', () => {
  assert.equal(C9BD_SIDE_QUESTS.length, 2);
  assert.deepEqual(C9BD_SIDE_QUESTS.map((x) => x.name), ['大王の、大きなランタン', 'まいごの、もぐら兵']);
  assert.equal(C9BD_OPEN, 'c9_act2');
  // フラグは 1つに 5こ（受けた・3つ・すんだ）
  assert.deepEqual([LAMP9.start, ...LAMP9_GOT, LAMP9.done, MOLE9.start, ...MOLE9_LIT, MOLE9.done].length, 10);
  const m = MAPS.c9b_under;
  const D = UNDER_POS.dock;
  const keeper = m.npcs.find((n) => n.id === 'c9b_folk6');
  const pairs = [['c9bd_st1', 'c9bd_sl1'], ['c9bd_st2', 'c9bd_sl2'], ['c9bd_st3', 'c9bd_sl3']];
  const pairOk = (a, b) => pairs.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
  for (const id of C9BD_NPC_IDS) {
    const at = npcAnywhere(id);
    assert.ok(at && at.map === 'c9b_under', `${id} は 大地の下`);
    const n = at.n;
    assert.equal(condOk(n.show, (f) => BEFORE.includes(f)), false, `${id} は c9_act2 の 前は 出ない`);
    assert.equal(condOk(n.show, () => false), false, `${id} は 第3部の 前の セーブでも 出ない`);
    assert.ok(SCRIPTS[n.script] && SCRIPTS[n.script] === C9BD_SCRIPTS[n.script], `${id} の だいほん`);
    assert.ok(!isBlocked(m, Math.floor(n.x), Math.floor(n.y), () => true), `${id} の 場所`);
    if (n.sprite.startsWith('mon:')) assert.ok(MONSTER_ART[n.sprite.slice(4)], `${id} の 絵`);
    else assert.ok(npcOpts(n.sprite) || CH6_SPECIALS.includes(n.sprite), `${id} の みため`);
    assert.ok(Math.max(Math.abs(n.x - D.x), Math.abs(n.y - D.y)) > 3, `${id} は 船着き場から はなれて いる`);
    assert.ok(Math.max(Math.abs(n.x - keeper.x), Math.abs(n.y - keeper.y)) > 2, `${id} は 番人から はなれて いる`);
    assert.ok(!m.npcs.some((o) => o !== n && !pairOk(o.id, n.id) && Math.floor(o.x) === Math.floor(n.x) && Math.floor(o.y) === Math.floor(n.y)), `${id} は ほかの 人と かさならない`);
  }
  assert.equal(m.areaName(npcAnywhere('c9bd_l_host').n.x, npcAnywhere('c9bd_l_host').n.y), 'ヒカリゴケの里');
  for (const mm of Object.values(MAPS)) if (mm.id !== 'c9b_under') assert.ok(!mm.npcs.some((n) => C9BD_NPC_IDS.includes(n.id)), mm.id);
  // 前は 受けられない
  const pre = { flag: (f) => BEFORE.includes(f), has: () => false, count: () => 0, night: false, name: 'ソラ', c: { job: 'warrior' } };
  for (const qd of C9BD_SIDE_QUESTS) assert.ok(!JSON.stringify(SCRIPTS[qd.npc](pre)).includes('"choice"'), `${qd.id} は 受けられない`);
  assert.deepEqual(c9bdSubQuests({ flags: {} }, () => false), []);
  // 第3幕より 先の 物語・ひみつ・カイ・3人組は 書かない
  assert.ok(!/ピラミッド|ソリトゥス|カイ|3人組|さかさ|いかだ|川を下|川の先|星の子/.test(SRC), '物語の 先・ひみつ');
});

test('道を ふさがない: 柱が 1本も ともって いなくても、大地の下の 着いた 所から より道と いらいの 人・物に とどく（こけ石が ともった あとも）', () => {
  const A = UNDER_POS.arrive;
  const ids = [...C9BD_NPC_IDS, ...WORK9_NPC_IDS];
  for (const flags of [OPEN, [...OPEN, LAMP9.start, MOLE9.start], [...OPEN, MOLE9.start, ...MOLE9_LIT, MOLE9.done], [...OPEN, ...C9B_PILLARS]]) {
    const ok = reach(flags, A);
    for (const id of ids) {
      const n = npcAnywhere(id).n;
      if (!condOk(n.show, (f) => flags.includes(f))) continue;
      assert.ok(ok(Math.floor(n.x), Math.floor(n.y)), `${id} に とどく（${flags.length}）`);
    }
    // 前から ある 人・宝箱・柱・やしきの 門・船着き場にも とどく
    for (const n of MAPS.c9b_under.npcs.filter((x) => x.id.startsWith('c9b_') && condOk(x.show, (f) => flags.includes(f)))) assert.ok(ok(Math.floor(n.x), Math.floor(n.y)), n.id);
    for (const p of [...UNDER_POS.pillars, ...UNDER_POS.chests, UNDER_POS.villageChest, UNDER_POS.gate, UNDER_POS.dock]) assert.ok(ok(p.x, p.y), `${p.x},${p.y}`);
  }
});

test('大王の、大きなランタン: 受ける → 3つの ざいりょう（どの じゅんでも）→ コロンに とどける → みんなで 作って 大王に わたす → ごほうび（1回だけ）', async () => {
  const { bot, c } = await setup(926, { job: 'mage', flags: OPEN });
  const qd = QD.c9bd_lamp;
  for (const i of [0, 1, 2]) assert.ok(!shows(`c9bd_l${i + 1}`, c), '受ける 前は きらりは ない');
  let msgs = await talkTo(bot, 'c9bd_l_host', [0]);
  assert.ok(c.flags[LAMP9.start] && said(msgs, /ないしょだよ/));
  assert.equal(q(c, qd.name).find, 'c9bd_l1');
  assert.ok(said(await talkTo(bot, 'c9bd_l_host'), /ざいりょうは、今0つ/));
  for (const i of [2, 0, 1]) {
    assert.ok(shows(`c9bd_l${i + 1}`, c));
    msgs = await talkTo(bot, `c9bd_l${i + 1}`);
    assert.ok(c.flags[LAMP9_GOT[i]] && said(msgs, new RegExp(`${LAMP9_ITEMS[i].item}を、手に入れた`)) && !shows(`c9bd_l${i + 1}`, c));
  }
  assert.ok(said(msgs, /全部そろった/));
  assert.ok(q(c, qd.name).ready && q(c, qd.name).who === 'c9bd_l_host');
  msgs = await rewarded(c, qd, () => talkTo(bot, 'c9bd_l_host'), () => talkTo(bot, 'c9bd_l_host'));
  assert.ok(said(msgs, /おそろいなのが、いちばん、うれしい/) && !battled(msgs, ''));
  assert.ok(said(await talkTo(bot, 'c9bd_l_host'), /ねる時も/));
});

test('まいごの、もぐら兵: こけ石は ポコに 近い 方から じゅんばんに（ちがう じゅんだと 消える）→ 3つ ともると ポコが 帰る → ごほうび（1回だけ）。ひとりでも', async () => {
  const { bot, c } = await setup(927, { job: 'warrior', flags: OPEN });
  const qd = QD.c9bd_mole;
  assert.ok(shows('c9bd_m_lost', c) && !shows('c9bd_m_home', c));
  assert.ok(said(await talkTo(bot, 'c9bd_st1'), /ねむっている/) && !c.flags[MOLE9_LIT[0]], '受ける 前は ともらない');
  await talkTo(bot, 'c9bd_m_host', [0]);
  assert.ok(c.flags[MOLE9.start] && q(c, qd.name).find === 'c9bd_st1');
  let msgs = await talkTo(bot, 'c9bd_m_lost');
  assert.ok(said(msgs, /まっくら/) && !c.flags[MOLE9.done], 'まだ 帰れない');
  msgs = await talkTo(bot, 'c9bd_st3');
  assert.ok(said(msgs, /見えないみたい/) && !c.flags[MOLE9_LIT[2]], 'とおい 石から ともしても 消える');
  await talkTo(bot, 'c9bd_st1');
  assert.ok(c.flags[MOLE9_LIT[0]] && shows('c9bd_sl1', c) && !shows('c9bd_st1', c));
  assert.ok(!c.flags[MOLE9_LIT[2]] && said(await talkTo(bot, 'c9bd_st3'), /見えないみたい/), 'まだ 2つめが ともって いない');
  assert.ok(said(await talkTo(bot, 'c9bd_m_lost'), /明かりが、1つ見える/));
  await talkTo(bot, 'c9bd_st2');
  await talkTo(bot, 'c9bd_st3');
  assert.ok(MOLE9_LIT.every((k) => c.flags[k]));
  assert.ok(q(c, qd.name).find === 'c9bd_m_lost');
  assert.ok(said(await talkTo(bot, 'c9bd_m_host'), /声をかけてやって/));
  msgs = await rewarded(c, qd, () => talkTo(bot, 'c9bd_m_lost'), () => talkTo(bot, 'c9bd_m_host'));
  assert.ok(said(msgs, /にげだして、ごめんなさい/) && !battled(msgs, ''));
  assert.ok(!shows('c9bd_m_lost', c) && shows('c9bd_m_home', c), 'ポコは 隊長の 所へ');
  assert.ok(said(await talkTo(bot, 'c9bd_m_home'), /見回りするんだ/));
  assert.ok(said(await talkTo(bot, 'c9bd_sl2'), /帰り道を/));
});

test('ごほうびは 少し（装備なし）・クエストの 画面・地図の しるし・困っている人・しおり・漢字', () => {
  for (const qd of C9BD_SIDE_QUESTS) {
    assert.ok(qd.reward.gold > 0 && qd.reward.gold <= 3000, qd.id);
    for (const [id, n] of qd.reward.goods) assert.ok(ITEMS[id] && ['use', 'mat'].includes(ITEMS[id].type) && n > 0 && n <= 5, `${qd.id}: ${id}`);
    const h = subQuestHint(qd.id);
    assert.ok(h && h.npc === qd.npc && h.open.includes('c9_act2') && !h.board, `${qd.id}: 困っている人`);
  }
  const before = { flags: Object.fromEntries(BEFORE.map((f) => [f, true])) };
  const open = { flags: Object.fromEntries(OPEN.map((f) => [f, true])) };
  const ids = (c) => availableSubQuests(c).map((h) => h.id);
  assert.ok(!ids(before).some((id) => id.startsWith('c9bd_')), 'c9_act2 の 前は 出ない');
  assert.deepEqual(ids(open).filter((id) => id.startsWith('c9bd_')), ['c9bd_lamp', 'c9bd_mole']);
  // 受けた あとは クエストの 画面と 地図の しるし
  const got = { flags: Object.fromEntries([...OPEN, LAMP9.start, MOLE9.start, LAMP9_GOT[0], MOLE9_LIT[0]].map((f) => [f, true])), items: [], keyItems: [] };
  for (const qd of C9BD_SIDE_QUESTS) {
    const e = q(got, qd.name);
    assert.ok(e && npcAnywhere(e.who) && npcAnywhere(e.find), qd.id);
    assert.deepEqual(checkText(e.text + e.hint).filter((p) => p.kind !== 'kana'), [], qd.id);
    assert.ok(questMarks(got, 'c9b_under', '').some((m) => m.label === qd.name), `${qd.id}: 地図の しるし`);
  }
  assert.equal(q(got, QD.c9bd_lamp.name).find, 'c9bd_l2');
  assert.equal(q(got, QD.c9bd_mole.name).find, 'c9bd_st2');
  // しおり: c9_act2 の あと より道が 2つ ふえる
  const side = (c) => shioriOf({ ...c, items: [], keyItems: [], jobs: {}, kills: {} }).tracks.find((t) => t.id === 'side');
  assert.equal(side(open).total - side(before).total, 2, 'しおりの より道');
  // 漢字
  const files = ['shared/data/sidequests-c9bd.js', 'shared/maps/c9bd-side.js'].map((f) => gameFiles().find((g) => g.endsWith('/public/js/' + f)));
  assert.ok(files.every(Boolean), 'gameFiles() に 入っている');
  const bad = [];
  for (const f of files) for (const p of checkFile(f)) if (p.kind !== 'kana') bad.push(`${f.split('/').pop()}:${p.line} [${p.kind} ${p.detail}] ${p.text}`);
  assert.deepEqual(bad, []);
});
