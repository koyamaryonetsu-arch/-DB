// 第90回 D班: 第3部 第1章 第1幕の より道「星ふるえで、まいごになった物」（docs/plan-part3.md の 9-5 の 4。data/sidequests-c9ad.js・maps/c9ad-side.js）
// 星ふるえの ゆれで、町や 村の 人の 大事な 物が ころがった。ルミナの 落とし物あずかり所で 引き受けて、3人の 落とし物を さがして 返す
// （返す たびに「1年前の 星祭りの 思い出」）→ さいごに 木に ひっかかった たこ（家族なら かたぐるま・ひとりなら はしご）
// c9_starfall の あとだけ（持たない 人には 見えない）・今の ミドリナ地方に 人を 足すだけ（A班の c9a_* マップには 出ない）・
// まちがえても やり直せる・ごほうびは 少し（装備なし）・1回だけ・クエストの 画面・地図の しるし・困っている人・しおり・漢字・
// 物語の 先（星の子・3人組）と 第1部・第2部の ひみつ・カイは 出さない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, condOk, isBlocked } from '../public/js/shared/maps/index.js';
import { SCRIPTS } from '../public/js/shared/data/story.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { C9AD_SIDE_QUESTS, C9AD_SCRIPTS, LOST9_ITEMS, c9adSubQuests } from '../public/js/shared/data/sidequests-c9ad.js';
import { C9AD_OPEN, LOST9, LOST9_FOUND, LOST9_BACK, C9AD_NPC_IDS } from '../public/js/shared/maps/c9ad-side.js';
import { C9A, C9A_MAP_IDS } from '../public/js/shared/maps/c9a-flags.js';
import { labDoneQuests } from '../public/js/shared/data/sidequests.js';
import { subQuests, questMarks } from '../public/js/shared/data/quest-targets.js';
import { availableSubQuests, subQuestHint, subQuestHints } from '../public/js/shared/data/subquest-hints.js';
import { shioriOf } from '../public/js/shared/world/shiori.js';
import { itemCount } from '../public/js/shared/stats.js';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { npcOpts } from '../public/js/client/render/chars.js';
import { checkFile, gameFiles, checkText } from '../tools/kanji-check.mjs';
import { setup, npcAnywhere, talkTo, said, battled, CLEAR } from './fq-helpers.js';

// 第2部の さいごまで・第3部 第1章 第1幕の 星祭りの 夜まで（星ふるえの 前）
const PART2 = [...CLEAR, 'c6_past', 'c6_rion', 'c6_flow', 'c6_kanata', 'c6_clear', 'c7_start', 'c7_kingdom', 'c7_karim', 'c7_clear',
  'c8_start', 'c8_kingdom', 'c8_jafar', 'c8_sea', 'c8_abyss', 'c8_hades', 'c8_sky', 'c8_spring', 'c8_fortress', 'c8_bowser', 'c8_rift', 'c8_hall', 'c8_solitus'];
const BEFORE = [...PART2, C9A.festival, C9A.night];
const OPEN = [...BEFORE, C9AD_OPEN];
const QD = C9AD_SIDE_QUESTS[0];
const q = (c, name) => subQuests(c).find((x) => x.name === name);
const shows = (id, c) => condOk(npcAnywhere(id).n.show, (f) => !!c.flags[f]);
// 物語の 先・ひみつ・カイ（名前）
const SECRET = /カイ|ソリトゥス|トキネ|星の子|スピカ|3人組|ホシドロ|勇者/;
const MAP_AREAS = ['ルミナの町', 'ホシフル村', 'ミドリナ平原', '鏡の湖'];

async function rewarded(c, talk) {
  const gold0 = c.gold;
  const goods0 = QD.reward.goods.map(([id]) => itemCount(c, id));
  const msgs = await talk();
  const check = (note) => {
    assert.ok(c.flags[QD.done], `すんだ${note}`);
    QD.reward.goods.forEach(([id, n], i) => assert.equal(itemCount(c, id), goods0[i] + n, `${id}${note}`));
    assert.equal(c.gold, gold0 + QD.reward.gold, `ゴールド${note}`);
  };
  check('');
  assert.ok(labDoneQuests(c).includes(QD.name) && !q(c, QD.name), 'クエストの 画面');
  await talk();
  check('（1回だけ）');
  return msgs;
}

test('しくみ: 今の ミドリナ地方に 人を 足すだけ・c9_starfall の あとから（持たない 人には 見えない）・だいほん・人の 絵・ひみつは 出さない', () => {
  assert.equal(C9AD_SIDE_QUESTS.length, 1);
  assert.equal(QD.name, '星ふるえで、まいごになった物');
  assert.equal(C9AD_OPEN, 'c9_starfall');
  const m = MAPS.overworld;
  const pairs = new Set(['c9ad_tree', 'c9ad_tree2']); // たこの 木と ふつうの 木は 同時に 出ない
  for (const id of C9AD_NPC_IDS) {
    const at = npcAnywhere(id);
    assert.ok(at && at.map === 'overworld', `${id} は 今の ミドリナ地方`);
    assert.ok(MAP_AREAS.includes(m.areaName(Math.floor(at.n.x), Math.floor(at.n.y))), `${id} の 場所`);
    assert.equal(condOk(at.n.show, (f) => BEFORE.includes(f)), false, `${id} は c9_starfall の 前は 出ない`);
    assert.equal(condOk(at.n.show, () => false), false, `${id} は 第3部の 前の セーブでも 出ない`);
    assert.ok(SCRIPTS[at.n.script] && SCRIPTS[at.n.script] === C9AD_SCRIPTS[at.n.script], `${id} の だいほん`);
    const n = at.n;
    assert.ok(!isBlocked(m, Math.floor(n.x), Math.floor(n.y), () => true) || n.solid, `${id} の 場所`);
    assert.ok(!(m.roofs || []).some((r) => n.x >= r.x && n.x < r.x + r.w && n.y >= r.y && n.y < r.y + r.h), `${id} は たてものの 中では ない`);
    if (n.sprite.startsWith('mon:')) assert.ok(MONSTER_ART[n.sprite.slice(4)], `${id} の 絵`);
    else assert.ok(npcOpts(n.sprite), `${id} の みため`);
    assert.ok(!SECRET.test(n.name), `${id} の 名前`);
    assert.ok(!m.npcs.some((o) => o !== n && !(pairs.has(o.id) && pairs.has(n.id)) && Math.floor(o.x) === Math.floor(n.x) && Math.floor(o.y) === Math.floor(n.y)), `${id} は ほかの 人と かさならない`);
  }
  // 持ち主は 町と 村（ルミナ 2人・ホシフル村 1人・村の 北の 平原 1人）
  assert.equal(m.areaName(Math.floor(npcAnywhere('c9ad_host').n.x), Math.floor(npcAnywhere('c9ad_host').n.y)), 'ルミナの町');
  assert.equal(m.areaName(Math.floor(npcAnywhere('c9ad_o3').n.x), Math.floor(npcAnywhere('c9ad_o3').n.y)), 'ホシフル村');
  // ほかの マップ（A班の c9a_*・千年前・時のはざま）には 出ない
  for (const mm of Object.values(MAPS)) if (mm.id !== 'overworld') assert.ok(!mm.npcs.some((n) => C9AD_NPC_IDS.includes(n.id)), mm.id);
  for (const id of C9A_MAP_IDS) assert.ok(!MAPS[id] || !MAPS[id].npcs.some((n) => C9AD_NPC_IDS.includes(n.id)), id);
  // 前は 受けられない
  const pre = { flag: (f) => BEFORE.includes(f), has: () => false, count: () => 0, night: false, name: 'ソラ', c: { job: 'warrior' } };
  assert.ok(!JSON.stringify(SCRIPTS[QD.npc](pre)).includes('"choice"'), '受けられない');
  assert.deepEqual(c9adSubQuests({ flags: {} }, () => false), []);
  assert.deepEqual(c9adSubQuests({ flags: Object.fromEntries(BEFORE.map((f) => [f, true])) }, (f) => BEFORE.includes(f)), []);
  // ごほうびは 少し（装備・大事な物 なし。お金も ひかえめ）
  assert.ok(QD.reward.gold > 0 && QD.reward.gold <= 3000);
  for (const [id, n] of QD.reward.goods) assert.ok(ITEMS[id] && !['weapon', 'armor', 'shield', 'head', 'acc', 'key'].includes(ITEMS[id].type) && n > 0 && n <= 3, id);
  // 落とし物は 3つ・持ち主・場所・思い出（ひみつに ふれない）
  assert.equal(LOST9_ITEMS.length, 3);
  for (const L of LOST9_ITEMS) assert.ok(L.who && L.item && L.place && L.memory.length >= 2 && !SECRET.test(JSON.stringify(L)), L.who);
});

test('星ふるえで、まいごになった物（ひとり）: 引き受ける → 3つ さがして 返す（どの じゅんでも・思い出）→ たこ（手が とどかない → はしご）→ ピコ → ごほうび（戦いなし）', async () => {
  const { bot, c } = await setup(9011, { job: 'mage', flags: OPEN });
  const all = [];
  const talk = async (id, ch) => { const m = await talkTo(bot, id, ch); all.push(...m); return m; };
  for (const i of [0, 1, 2]) assert.ok(!shows(`c9ad_s${i + 1}`, c), '引き受ける 前は 落とし物が 見えない');
  assert.ok(!shows('c9ad_ladder', c));
  // 引き受ける 前の たこの 木・はしごは ながめる だけ
  let msgs = await talk('c9ad_tree');
  assert.ok(said(msgs, /ひっかかっている/) && !c.flags[LOST9.kite]);
  msgs = await talk('c9ad_host', [1]);
  assert.ok(!c.flags[LOST9.start], 'またこんど');
  msgs = await talk('c9ad_host', [0]);
  assert.ok(c.flags[LOST9.start] && said(msgs, /古い木のふえ/) && said(msgs, /星のかみかざり/) && said(msgs, /星もようのすず/));
  for (const i of [0, 1, 2]) assert.ok(shows(`c9ad_s${i + 1}`, c), '引き受けたら きらり');
  assert.equal(q(c, QD.name).find, 'c9ad_s1');
  // 持ち主に 聞くと 場所の ヒント
  msgs = await talk('c9ad_o2');
  assert.ok(said(msgs, /南の門の外/) && !c.flags[LOST9_BACK[1]]);
  // 2つ目 → 1つ目 → 3つ目 の じゅんで（どの じゅんでも よい）
  for (const i of [1, 0, 2]) {
    msgs = await talk(`c9ad_s${i + 1}`);
    assert.ok(c.flags[LOST9_FOUND[i]] && said(msgs, new RegExp(LOST9_ITEMS[i].item)), `${i}: 見つけた`);
    assert.ok(!shows(`c9ad_s${i + 1}`, c), `${i}: きらりが 消える`);
    if (i === 1) assert.equal(q(c, QD.name).find, 'c9ad_s1', 'まだの 1つめ（ふえ）を さがす');
    msgs = await talk(`c9ad_o${i + 1}`);
    assert.ok(c.flags[LOST9_BACK[i]] && said(msgs, /去年/), `${i}: 返して 思い出`);
    msgs = await talk(`c9ad_o${i + 1}`);
    assert.ok(said(msgs, new RegExp(LOST9_ITEMS[i].after.slice(0, 6))), `${i}: 返した あと`);
  }
  // 思い出の 中み（はずれた 音・おそろい・ゆっくり歩いた）
  assert.ok(said(all, /はずれた音も/) && said(all, /おそろい/) && said(all, /ゆっくり歩いた/));
  // 4つ目（たこ）。ひとりだと 手が とどかない → はしごを かりる → のぼる
  msgs = await talk('c9ad_host');
  assert.ok(said(msgs, /たこが木にひっかかった/));
  assert.equal(q(c, QD.name).find, 'c9ad_tree');
  msgs = await talk('c9ad_tree');
  assert.ok(said(msgs, /手が、とどかない/) && !c.flags[LOST9.kite], 'ひとりでは とどかない');
  assert.ok(shows('c9ad_ladder', c));
  msgs = await talk('c9ad_ladder');
  assert.ok(c.flags[LOST9.lad] && !shows('c9ad_ladder', c), 'はしごを かりた');
  msgs = await talk('c9ad_tree');
  assert.ok(c.flags[LOST9.kite] && said(msgs, /はしごを、かけて/) && !said(msgs, /かたぐるま！/));
  assert.ok(!shows('c9ad_tree', c) && shows('c9ad_tree2', c), 'たこの ない 木に かわる');
  assert.equal(q(c, QD.name).who, 'c9ad_o4');
  msgs = await talk('c9ad_o4');
  assert.ok(c.flags[LOST9.r4] && said(msgs, /かたぐるまを、してくれて/));
  assert.ok(q(c, QD.name).ready && q(c, QD.name).who === 'c9ad_host');
  msgs = await rewarded(c, () => talk('c9ad_host'));
  assert.ok(said(msgs, /おうちに帰れた/));
  assert.ok(!battled(all, ''), '戦いは ない');
  // 物語の 先・ひみつ・カイは 出ない（だいほんの 中の 名前も）
  const text = all.filter((m) => m.t === 'script').flatMap((m) => m.steps).map((s) => JSON.stringify(s)).join('\n');
  assert.ok(!SECRET.test(text), 'ひみつに ふれない');
});

test('さいごの たこは、家族（2人 いじょう）なら かたぐるまで とれる（はしごは いらない）', async () => {
  const { bot, c } = await setup(9012, { job: 'warrior', flags: [...OPEN, LOST9.start, ...LOST9_FOUND, ...LOST9_BACK] });
  // だいほんの ctx: 2人の パーティー
  const base = { flag: (f) => !!c.flags[f], has: () => false, count: () => 0, night: false, name: c.name, c };
  const two = { ...base, partyChars: () => [c, { name: 'ユイ', job: 'priest' }] };
  const one = { ...base, partyChars: () => [c] };
  const steps2 = JSON.stringify(SCRIPTS.c9ad_tree(two));
  assert.ok(steps2.includes('かたぐるま！') && steps2.includes('ユイ') && steps2.includes(LOST9.kite), '2人なら かたぐるま');
  const steps1 = JSON.stringify(SCRIPTS.c9ad_tree(one));
  assert.ok(!steps1.includes(LOST9.kite) && steps1.includes('はしご'), 'ひとりなら はしごの ヒント');
  // 魔物の 仲間は 数えない
  const mon = { ...base, partyChars: () => [c, { name: 'スラ', species: 'slime' }] };
  assert.ok(!JSON.stringify(SCRIPTS.c9ad_tree(mon)).includes(LOST9.kite));
  // 3つ 返す 前は、2人でも とらない（さいごの 1つ）
  const early = { ...two, flag: (f) => f !== LOST9_BACK[2] && !!c.flags[f] };
  assert.ok(!JSON.stringify(SCRIPTS.c9ad_tree(early)).includes(LOST9.kite));
  // 本物の 世界でも（ひとりの ボットは はしごの ヒント）
  const msgs = await talkTo(bot, 'c9ad_tree');
  assert.ok(said(msgs, /かたぐるまをするか/) && !c.flags[LOST9.kite]);
});

test('クエストの 画面・地図の しるし・困っている人（c9_starfall の あとから）・冒険のしおり・漢字', () => {
  const all = { flags: Object.fromEntries([...OPEN, LOST9.start].map((f) => [f, true])), items: [], keyItems: [] };
  const e = q(all, QD.name);
  assert.ok(e && npcAnywhere(e.who) && (!e.find || npcAnywhere(e.find)) && /0\/3/.test(e.text));
  assert.deepEqual(checkText(e.text + e.hint).filter((p) => p.kind !== 'kana'), []);
  assert.ok(questMarks(all, 'overworld', '').some((m) => m.label === QD.name), '地図の しるし');
  // 見つけた 物が あれば 持ち主へ
  const found = { flags: { ...all.flags, [LOST9_FOUND[0]]: true }, items: [], keyItems: [] };
  assert.equal(q(found, QD.name).find, 'c9ad_o1');
  const h = subQuestHint(QD.id);
  assert.ok(h && h.npc === QD.npc && h.open.includes(C9AD_OPEN) && h.start === QD.start && h.done === QD.done && h.hint.length <= 60, '困っている人');
  assert.equal(subQuestHints().filter((x) => x.id.startsWith('c9ad_')).length, 1);
  const ids = (flags) => availableSubQuests({ flags: Object.fromEntries(flags.map((f) => [f, true])) }).map((x) => x.id);
  assert.ok(!ids(BEFORE).some((id) => id.startsWith('c9ad_')), 'c9_starfall の 前は 出ない');
  assert.deepEqual(ids(OPEN).filter((id) => id.startsWith('c9ad_')), ['c9ad_lost']);
  assert.ok(!availableSubQuests(all).some((x) => x.id.startsWith('c9ad_')), '受けたら 消える');
  const none = { flags: Object.fromEntries(OPEN.map((f) => [f, true])), items: [], keyItems: [] };
  assert.ok(!q(none, QD.name));
  // 冒険のしおり: より道の 数に 1つ・いらいは 3まい ふえる（c9_starfall の 前は 出ない）
  const T = (s, id) => s.tracks.find((t) => t.id === id);
  const sOpen = shioriOf({ ...none, level: 96, job: 'warrior', jobs: {} });
  const sBefore = shioriOf({ flags: Object.fromEntries(BEFORE.map((f) => [f, true])), items: [], keyItems: [], level: 96, job: 'warrior', jobs: {} });
  assert.equal(T(sOpen, 'side').total, T(sBefore, 'side').total + 1, 'より道が 1つ ふえる');
  assert.ok(T(sOpen, 'side').items.some((x) => x.name === QD.name) && !T(sBefore, 'side').items.some((x) => x.name === QD.name));
  assert.equal(T(sOpen, 'board').total, 38);
  assert.equal(T(sBefore, 'board').total, 35);
  // 漢字
  const files = ['shared/data/sidequests-c9ad.js', 'shared/maps/c9ad-side.js'].map((f) => gameFiles().find((g) => g.endsWith('/public/js/' + f)));
  assert.ok(files.every(Boolean), 'gameFiles() に 入っている');
  const bad = [];
  for (const f of files) for (const p of checkFile(f)) if (p.kind !== 'kana') bad.push(`${f.split('/').pop()}:${p.line} [${p.kind} ${p.detail}] ${p.text}`);
  assert.deepEqual(bad, []);
});
