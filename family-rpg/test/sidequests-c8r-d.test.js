// 第80回 D班: 第8章 第4幕の より道「時をこえる手紙の、最後の1通」（docs/plan-ch8.md の 9-3。data/sidequests-c8rd.js・maps/c8rd-side.js）
// 千年前の ホシフルの里の 男の子が 書いた 手紙を、今の ホシフル村の ゆうびん屋さんが 代々 あずかって いる。
// 村の 子ども 3人の やきいもの やき方 → あて名の 子を えらぶ → とどける → 返事を あずける
// c8_hall の あとだけ・今の ホシフル村に 人を 足すだけ（時のはざま・千年前・A班の c8r_* マップには 出ない）・
// まちがえても やり直せる・ごほうびは 少し（装備なし）・1回だけ・クエストの 画面・地図の しるし・困っている人・漢字・
// 4人の 勇者と 時の 女の人は 出さない（物語の 先に ふれない）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, condOk, isBlocked } from '../public/js/shared/maps/index.js';
import { SCRIPTS } from '../public/js/shared/data/story.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { C8RD_SIDE_QUESTS, C8RD_SCRIPTS, LAST9_PLAN, c8rdSubQuests } from '../public/js/shared/data/sidequests-c8rd.js';
import { C8RD_OPEN, LAST9, LAST9_KIDS, LAST9_STEPS, C8RD_NPC_IDS } from '../public/js/shared/maps/c8rd-side.js';
import { labDoneQuests } from '../public/js/shared/data/sidequests.js';
import { subQuests, questMarks } from '../public/js/shared/data/quest-targets.js';
import { availableSubQuests, subQuestHint, subQuestHints } from '../public/js/shared/data/subquest-hints.js';
import { shioriOf } from '../public/js/shared/world/shiori.js';
import { itemCount } from '../public/js/shared/stats.js';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { npcOpts } from '../public/js/client/render/chars.js';
import { checkFile, gameFiles, checkText } from '../tools/kanji-check.mjs';
import { setup, npcAnywhere, talkTo, said, battled, CLEAR } from './fq-helpers.js';

// 第6章クリア・第7章・第8章 第3幕の さいごまで・第4幕の はじめ（c8_rift）
const BEFORE = [...CLEAR, 'c6_past', 'c6_rion', 'c6_flow', 'c6_kanata', 'c6_clear', 'c7_start', 'c7_kingdom', 'c7_karim', 'c7_clear',
  'c8_start', 'c8_kingdom', 'c8_jafar', 'c8_sea', 'c8_abyss', 'c8_hades', 'c8_sky', 'c8_spring', 'c8_fortress', 'c8_bowser', 'c8_rift'];
const OPEN = [...BEFORE, C8RD_OPEN];
const QD = C8RD_SIDE_QUESTS[0];
const q = (c, name) => subQuests(c).find((x) => x.name === name);
const shows = (id, c) => condOk(npcAnywhere(id).n.show, (f) => !!c.flags[f]);
// 4人の 勇者と 時の 女の人（名前・絵）
const HEROES = /リオン|ミナモ|カリム|カイ|トキネ/;
const HERO_SPRITES = ['rion', 'minamo', 'karim', 'kai', 'tokine'];

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

test('しくみ: 今の ホシフル村に 人を 足すだけ・c8_hall の あとから・だいほん・人の 絵・4人の 勇者と 時の 女の人は 出さない', () => {
  assert.equal(C8RD_SIDE_QUESTS.length, 1);
  assert.equal(QD.name, '時をこえる手紙の、最後の1通');
  const m = MAPS.overworld;
  for (const id of C8RD_NPC_IDS) {
    const at = npcAnywhere(id);
    assert.ok(at && at.map === 'overworld', `${id} は 今の ミドリナ地方`);
    assert.equal(m.areaName(Math.floor(at.n.x), Math.floor(at.n.y)), 'ホシフル村', `${id} は ホシフル村`);
    assert.equal(condOk(at.n.show, (f) => BEFORE.includes(f)), false, `${id} は c8_hall の 前は 出ない`);
    assert.ok(SCRIPTS[at.n.script] && SCRIPTS[at.n.script] === C8RD_SCRIPTS[at.n.script], `${id} の だいほん`);
    const n = at.n;
    assert.ok(!isBlocked(m, Math.floor(n.x), Math.floor(n.y), () => true) || n.solid, `${id} の 場所`);
    if (n.sprite.startsWith('mon:')) assert.ok(MONSTER_ART[n.sprite.slice(4)], `${id} の 絵`);
    else assert.ok(npcOpts(n.sprite), `${id} の みため`);
    assert.ok(!HEROES.test(n.name) && !HERO_SPRITES.some((s) => n.sprite.includes(s)), `${id} は 勇者・時の 女の人では ない`);
    assert.ok(!m.npcs.some((o) => o !== n && Math.floor(o.x) === Math.floor(n.x) && Math.floor(o.y) === Math.floor(n.y)), `${id} は ほかの 人と かさならない`);
  }
  // 時のはざま（c8r_*）・千年前には 出ない
  for (const mm of Object.values(MAPS)) if (mm.id !== 'overworld') assert.ok(!mm.npcs.some((n) => C8RD_NPC_IDS.includes(n.id)), mm.id);
  // 前は 受けられない
  const pre = { flag: (f) => BEFORE.includes(f), has: () => false, count: () => 0, night: false, name: 'ソラ', c: { job: 'warrior' } };
  assert.ok(!JSON.stringify(SCRIPTS[QD.npc](pre)).includes('"choice"'), '受けられない');
  assert.deepEqual(c8rdSubQuests({ flags: {} }, () => false), []);
  // ごほうびは 少し（装備・大事な物 なし。お金も ひかえめ）
  assert.ok(QD.reward.gold > 0 && QD.reward.gold <= 3000);
  for (const [id, n] of QD.reward.goods) assert.ok(ITEMS[id] && !['weapon', 'armor', 'shield', 'head', 'acc', 'key'].includes(ITEMS[id].type) && n > 0 && n <= 3, id);
});

test('時をこえる手紙の、最後の1通: 3人の話 → とどけ先を決める（やり直し）→ コタロウが読む → 返事をあずける（やり直し）→ ごほうび → 村でやきいも（だれでも・戦いなし）', async () => {
  const { bot, c } = await setup(8011, { job: 'mage', flags: OPEN });
  const all = [];
  const talk = async (id, ch) => { const m = await talkTo(bot, id, ch); all.push(...m); return m; };
  assert.ok(!shows('c8rd_last_imo', c), 'すむ 前は 灰の山が ない');
  let msgs = await talk('c8rd_last_host', [0]);
  assert.ok(c.flags[LAST9.start] && said(msgs, /やきいも名人の家の子へ/) && said(msgs, /ぬれた葉っぱ・あつい灰・細い木のえだ/));
  assert.equal(q(c, QD.name).find, 'c8rd_last_k1');
  // 話を 聞く 前は とどけ先を 決められない・コタロウも まだ 手紙を 読まない
  msgs = await talk('c8rd_last_host');
  assert.ok(said(msgs, /今0人/) && !said(msgs, /だれにとどける/));
  for (const id of ['c8rd_last_k1', 'c8rd_last_k2', 'c8rd_last_k3']) await talk(id);
  assert.ok(LAST9_KIDS.every((k) => c.flags[k]) && !q(c, QD.name).find && /とどけ先/.test(q(c, QD.name).text));
  const ans = LAST9_PLAN.map((x) => x.ans);
  msgs = await talk('c8rd_last_host', [0]);
  assert.ok(!c.flags[LAST9_STEPS[0]] && said(msgs, /ちがうみたい/), '1つ目の まちがい（ソウタ）');
  msgs = await talk('c8rd_last_host', [1]);
  assert.ok(!c.flags[LAST9_STEPS[0]] && said(msgs, /たりないみたい/), '1つ目の まちがい（ヒマリ）');
  msgs = await talk('c8rd_last_host', [ans[0]]);
  assert.ok(c.flags[LAST9_STEPS[0]] && c.flags[LAST9.pick]);
  assert.equal(q(c, QD.name).who, 'c8rd_last_k3', 'コタロウに とどける');
  // コタロウが 読む → 返事で まちがい → もう一度（もう 読まない）
  msgs = await talk('c8rd_last_k3', [0]);
  assert.ok(said(msgs, /ポンより/) && said(msgs, /千年前の、男の子からの手紙/) && !c.flags[LAST9_STEPS[1]] && c.flags[LAST9.read], '読んだ・返事で まちがい');
  msgs = await talk('c8rd_last_k3', [ans[1]]);
  assert.ok(!said(msgs, /ポンより/) && c.flags[LAST9_STEPS[1]] && c.flags[LAST9.given], '2回目は 返事の 所から');
  assert.ok(q(c, QD.name).ready && q(c, QD.name).who === 'c8rd_last_host');
  msgs = await rewarded(c, () => talk('c8rd_last_host'));
  assert.ok(said(msgs, /最後の1通/) && said(msgs, /千年前と、おんなじ味/));
  assert.ok(shows('c8rd_last_imo', c), '村の やきいもの 灰の山');
  assert.ok(!battled(all, ''), '戦いは ない');
  // 4人の 勇者と 時の 女の人は 出ない（だいほんの 中の 名前も）
  const text = all.filter((m) => m.t === 'script').flatMap((m) => m.steps).map((s) => JSON.stringify(s)).join('\n');
  assert.ok(!HEROES.test(text), '勇者・時の 女の人の 名前が 出ない');
});

test('第3幕の より道「やきいも」を やっていると、手紙の 主に 気がつく', async () => {
  const { bot, c } = await setup(8012, { job: 'warrior', flags: [...OPEN, 'c8cd_imo_done', LAST9.start, ...LAST9_KIDS, LAST9.pick] });
  const msgs = await talkTo(bot, 'c8rd_last_k3', [LAST9_PLAN[1].ans]);
  assert.ok(said(msgs, /あの日、いっしょに焼いた/) && c.flags[LAST9.given]);
});

test('クエストの 画面・地図の しるし・困っている人（c8_hall の あとから）・冒険のしおり・漢字', () => {
  const all = { flags: Object.fromEntries([...OPEN, LAST9.start].map((f) => [f, true])), items: [], keyItems: [] };
  const e = q(all, QD.name);
  assert.ok(e && npcAnywhere(e.who) && (!e.find || npcAnywhere(e.find)));
  assert.deepEqual(checkText(e.text + e.hint).filter((p) => p.kind !== 'kana'), []);
  assert.ok(questMarks(all, 'overworld', '').some((m) => m.label === QD.name), '地図の しるし');
  const h = subQuestHint(QD.id);
  assert.ok(h && h.npc === QD.npc && h.open.includes(C8RD_OPEN) && h.start === QD.start && h.done === QD.done && h.hint.length <= 60, '困っている人');
  assert.equal(subQuestHints().filter((x) => x.id.startsWith('c8rd_')).length, 1);
  const ids = (flags) => availableSubQuests({ flags: Object.fromEntries(flags.map((f) => [f, true])) }).map((x) => x.id);
  assert.ok(!ids(BEFORE).some((id) => id.startsWith('c8rd_')), 'c8_hall の 前は 出ない');
  assert.deepEqual(ids(OPEN).filter((id) => id.startsWith('c8rd_')), ['c8rd_last']);
  assert.ok(!availableSubQuests(all).some((x) => x.id.startsWith('c8rd_')), '受けたら 消える');
  const none = { flags: Object.fromEntries(OPEN.map((f) => [f, true])), items: [], keyItems: [] };
  assert.ok(!q(none, QD.name));
  // 冒険のしおり: より道の 数に 1つ ふえる（c8_hall の 前は 出ない）・いらいは 35まい
  const T = (s, id) => s.tracks.find((t) => t.id === id);
  const sOpen = shioriOf({ ...none, level: 91, job: 'warrior', jobs: {} });
  const sBefore = shioriOf({ flags: Object.fromEntries(BEFORE.map((f) => [f, true])), items: [], keyItems: [], level: 91, job: 'warrior', jobs: {} });
  assert.equal(T(sOpen, 'side').total, T(sBefore, 'side').total + 1, 'より道が 1つ ふえる');
  assert.ok(T(sOpen, 'side').items.some((x) => x.name === QD.name) && !T(sBefore, 'side').items.some((x) => x.name === QD.name));
  assert.equal(T(sOpen, 'board').total, 35);
  assert.equal(T(sBefore, 'board').total, 32);
  // 漢字
  const files = ['shared/data/sidequests-c8rd.js', 'shared/maps/c8rd-side.js'].map((f) => gameFiles().find((g) => g.endsWith('/public/js/' + f)));
  assert.ok(files.every(Boolean), 'gameFiles() に 入っている');
  const bad = [];
  for (const f of files) for (const p of checkFile(f)) if (p.kind !== 'kana') bad.push(`${f.split('/').pop()}:${p.line} [${p.kind} ${p.detail}] ${p.text}`);
  assert.deepEqual(bad, []);
});
