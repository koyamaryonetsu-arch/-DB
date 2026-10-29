// 第51回 B: 家族のけいじ板（転職・ひらめき技・合体技・幻の職業の 知らせ。見出しだけ → 見る で なりかた）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { upgradeSave } from '../public/js/shared/world/save.js';
import { mergeChars } from '../public/js/shared/world/merge.js';
import { makeRng } from '../public/js/shared/rng.js';
import { JOB_MAX_LEVEL } from '../public/js/shared/data/jobs.js';
import {
  BOARD_MAX, boardRows, boardUnread, boardLastFor, boardHirameki, boardDual, cleanFamilyBoard, jobHowText, hiraHowText, dualHowText,
} from '../public/js/shared/world/family-board.js';
import { checkText } from '../tools/kanji-check.mjs';
import { startFieldBattle } from '../public/js/shared/world/battles.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { Bot, tickN } from './helpers.js';

const newWorld = (data) => new GameWorld({ offline: true, rng: makeRng(5), rateLimit: false, data });
const jobSvc = (bot, job) => {
  bot.send({ t: 'svc', kind: 'jobChange', job });
  return bot.msgs.filter((m) => m.t === 'svcRes').pop();
};
async function player(world, name, job = 'warrior') {
  const b = new Bot(world, name);
  await b.login();
  await b.createAndPlay(job);
  await b.settle();
  return b;
}
const charOf = (world, bot) => world.data.characters[bot.char.id];
const textOk = (t) => assert.deepEqual(checkText(t), [], t);

test('転職: はじめて なった 職業だけ のる（もどしても のらない）', async () => {
  const world = newWorld();
  const papa = await player(world, 'パパ');
  const c = charOf(world, papa);
  c.jobs.warrior = { lv: JOB_MAX_LEVEL, b: 999 };
  c.jobs.performer = { lv: JOB_MAX_LEVEL, b: 999 };
  assert.equal(jobSvc(papa, 'performer').ok, true);
  assert.equal(world.data.familyBoard.length, 0, 'もう なった ことの ある 職業は のらない');
  assert.equal(jobSvc(papa, 'pirate').ok, true);
  assert.equal(world.data.familyBoard.length, 1);
  const e = world.data.familyBoard[0];
  assert.equal(e.kind, 'job');
  assert.equal(e.title, 'パパが海賊になった！');
  assert.equal(e.charId, c.id);
  assert.equal(e.job, 'pirate');
  assert.ok(e.detail.includes('戦士Lv10＋旅芸人Lv10'), e.detail);
  textOk(e.title);
  textOk(e.detail);
  // 戦士に もどして もう一度 海賊 → のらない
  jobSvc(papa, 'warrior');
  jobSvc(papa, 'pirate');
  assert.equal(world.data.familyBoard.length, 1);
  // なれない 職業は のらない
  assert.equal(jobSvc(papa, 'dragon_knight').ok, false);
  assert.equal(world.data.familyBoard.length, 1);
});

test('転職: 酒場の 仲間の 転職は のらない', async () => {
  const world = newWorld();
  const papa = await player(world, 'パパ');
  const c = charOf(world, papa);
  papa.send({ t: 'svc', kind: 'tavern', action: 'recruit', key: 'npc_mina' });
  const mina = c.companions.find((e) => e.key === 'npc_mina');
  assert.ok(mina, '仲間に なった');
  papa.send({ t: 'svc', kind: 'jobChange', job: mina.char.job === 'mage' ? 'priest' : 'mage', who: 'npc_mina' });
  assert.equal(world.data.familyBoard.length, 0);
});

test('おなじ 知らせは 1回・200こまで（古い 物から けす）・幻の職業の 知らせ（F 班）', () => {
  const world = newWorld();
  const a = world.boardPost({ kind: 'phantom_reveal', by: 'ママ', charId: 'm1', job: 'pirate_king', text: 'ママが幻の職業の条件を見つけた！', detail: 'ゴムゴムの技を500回' });
  assert.ok(a, 'text でも 見出しに なる');
  assert.equal(a.title, 'ママが幻の職業の条件を見つけた！');
  assert.equal(world.boardPost({ kind: 'phantom_reveal', by: 'ママ', charId: 'm1', job: 'pirate_king', title: 'もう一度' }), null, 'おなじ キャラ・しゅるい・職業');
  assert.ok(world.boardPost({ kind: 'phantom_get', by: 'ママ', charId: 'm1', job: 'pirate_king', title: 'ママが海賊王になった！' }), 'しゅるいが ちがえば のる');
  assert.ok(world.boardPost({ kind: 'phantom_reveal', by: 'パパ', charId: 'p1', job: 'pirate_king', title: 'パパも見つけた' }), 'キャラが ちがえば のる');
  assert.equal(world.boardPost({ kind: '', title: 'x' }), null, 'しゅるいの ない 物は のらない');
  assert.equal(world.boardPost({ kind: 'job' }), null, '見出しの ない 物は のらない');
  for (let i = 0; i < BOARD_MAX + 10; i++) world.boardPost({ kind: 'job', by: 'ボク', charId: 'b1', job: `j${i}`, title: `ボク${i}`, at: 1000 + i });
  const list = world.data.familyBoard;
  assert.equal(list.length, BOARD_MAX);
  assert.equal(list[list.length - 1].title, `ボク${BOARD_MAX + 9}`, '新しい 物が のこる');
  assert.ok(!list.some((e) => e.title === 'ボク0'), '古い 物から けす');
  assert.equal(new Set(list.map((e) => e.id)).size, list.length, 'id は かさならない');
});

test('セーブ・ロードで のこる。こわれた 物は 手直し', async () => {
  const world = newWorld();
  const papa = await player(world, 'パパ');
  const c = charOf(world, papa);
  c.jobs.warrior = { lv: JOB_MAX_LEVEL, b: 999 };
  c.jobs.monk = { lv: JOB_MAX_LEVEL, b: 999 };
  jobSvc(papa, 'battlemaster');
  c.boardSeen = 12345;
  const saved = JSON.parse(JSON.stringify(world.data));
  const w2 = newWorld(saved);
  assert.equal(w2.data.familyBoard.length, 1);
  assert.equal(w2.data.familyBoard[0].title, 'パパがバトルマスターになった！');
  assert.equal(w2.data.characters[c.id].boardSeen, 12345);
  // 読みなおしても 同じ 職業は のらない（おなじ 知らせ）
  assert.equal(w2.boardPost({ ...w2.data.familyBoard[0], title: 'x' }), null);

  // こわれた セーブ
  const bad = JSON.parse(JSON.stringify(saved));
  bad.familyBoard = [null, 3, { kind: 'job' }, { kind: 'job', title: 'のこる', at: 'x', detail: 7 }, ...Array.from({ length: BOARD_MAX + 3 }, (_, i) => ({ kind: 'job', title: `t${i}`, at: 10 + i }))];
  bad.characters[c.id].boardSeen = -5;
  const { data } = upgradeSave(bad);
  assert.equal(data.familyBoard.length, BOARD_MAX);
  assert.ok(data.familyBoard.every((e) => e.id && typeof e.title === 'string' && Number.isFinite(e.at) && typeof e.detail === 'string'));
  assert.equal(data.characters[c.id].boardSeen, undefined, 'おかしな 時こくは けす');
  assert.deepEqual(upgradeSave({ characters: {} }).data.familyBoard, [], 'ない ときは 空');
  bad.familyBoard = 'こわれた';
  assert.deepEqual(cleanFamilyBoard(bad.familyBoard), []);
  // 家族サーバーと スマホを 合わせる 時は おそい ほう
  const m = mergeChars({ id: 'p', boardSeen: 100 }, { id: 'p', boardSeen: 300, items: [] }, { id: 'p', boardSeen: 200, items: [] });
  assert.equal(m.boardSeen, 300);
});

test('見出しだけ 出す。なりかたは「見る」を おした 物だけ（見た目の もと）', () => {
  const list = [
    { id: 'b', kind: 'hirameki', by: 'ママ', charId: 'm1', title: 'ママがひらめき技『メラ』を覚えた！', detail: 'ないしょ', at: 200 },
    { id: 'a', kind: 'job', by: 'パパ', charId: 'p1', title: 'パパが海賊になった！', detail: 'なりかた', at: 100 },
  ];
  const me = { id: 'p1', boardSeen: 150 };
  let rows = boardRows(list, new Set(), me);
  assert.equal(rows.length, 2);
  assert.ok(rows.every((r) => r.detail === null && !r.open), 'はじめは どれも かくす');
  assert.equal(rows[0].tag, 'ひらめき');
  assert.equal(rows[0].unread, true, 'まだ 見ていない');
  assert.equal(rows[1].unread, false, '自分の 知らせは ● なし');
  assert.equal(rows[1].mine, true);
  rows = boardRows(list, new Set(['a']), me);
  assert.equal(rows[0].detail, null);
  assert.equal(rows[1].detail, 'なりかた');
  assert.equal(rows[1].open, true);
});

test('のった 時は 遊んでいる 人に とどく。● と 見た 印', async () => {
  const world = newWorld();
  const papa = await player(world, 'パパ');
  const mama = await player(world, 'ママ');
  const pc = charOf(world, papa), mc = charOf(world, mama);
  pc.jobs.warrior = { lv: JOB_MAX_LEVEL, b: 999 };
  pc.jobs.priest = { lv: JOB_MAX_LEVEL, b: 999 };
  mama.msgs.length = 0;
  papa.msgs.length = 0;
  let T = 5e12;
  world.now = () => T;
  jobSvc(papa, 'paladin');
  T += 100;
  const got = mama.msgs.filter((m) => m.t === 'fboardNew');
  assert.equal(got.length, 1, 'ママに とどく');
  assert.equal(got[0].entry.title, 'パパがパラディンになった！');
  assert.equal(papa.msgs.filter((m) => m.t === 'fboardNew').length, 1, 'パパにも とどく（画面は 自分の 知らせを 知らせない）');

  // ● : ママには ある・パパ（自分の 知らせ）には ない
  const at = world.data.familyBoard[0].at;
  assert.equal(boardLastFor(world, mc.id), at);
  assert.equal(boardLastFor(world, pc.id), 0);
  assert.equal(boardUnread(boardLastFor(world, mc.id), mc), true);
  mama.send({ t: 'fboard', action: 'peek' });
  assert.equal(mama.msgs.filter((m) => m.t === 'fboardLast').pop().last, at);
  // 一覧（新しい じゅん）
  world.boardPost({ kind: 'job', by: 'ボク', charId: 'x', job: 'mage', title: 'ボクが魔法使いになった！', at: at + 5 });
  mama.send({ t: 'fboard', action: 'list' });
  const res = mama.msgs.filter((m) => m.t === 'fboardList').pop();
  assert.deepEqual(res.list.map((e) => e.title), ['ボクが魔法使いになった！', 'パパがパラディンになった！']);
  assert.equal(res.last, at + 5);
  // 見た
  mama.send({ t: 'fboard', action: 'seen', at: at + 5 });
  assert.equal(mc.boardSeen, at + 5);
  assert.equal(mama.char.boardSeen, at + 5, '自分の キャラも とどく');
  assert.equal(boardUnread(boardLastFor(world, mc.id), mc), false);
  // 前に もどす・先の 時こくは うけつけない
  mama.send({ t: 'fboard', action: 'seen', at: 1 });
  assert.equal(mc.boardSeen, at + 5);
  mama.send({ t: 'fboard', action: 'seen', at: world.now() + 1e9 });
  assert.ok(mc.boardSeen <= world.now());
});

test('ひらめき技・合体技: 見出しと 覚えかた（家族の キャラだけ）', async () => {
  const world = newWorld();
  const papa = await player(world, 'パパ');
  const mama = await player(world, 'ママ');
  const pc = charOf(world, papa), mc = charOf(world, mama);
  const [h] = boardHirameki(world, pc, ['hk_triple_mera']);
  assert.ok(h.title.startsWith('パパがひらめき技『'), h.title);
  assert.ok(h.title.endsWith('』を覚えた！'));
  assert.ok(h.detail.includes('30回'), h.detail);
  assert.equal(boardHirameki(world, pc, ['hk_triple_mera']).length, 0, '2回めは のらない');
  const [k] = boardHirameki(world, pc, ['mahouken']);
  assert.ok(k.title.includes('掛け合わせ技'), k.title);
  assert.ok(k.detail.includes('魔法戦士'), k.detail);
  assert.equal(boardHirameki(world, { ...pc }, ['hk_iyashi_kaze']).length, 0, '家族の キャラ そのもの だけ');
  assert.equal(boardHirameki(world, { id: 'x', name: 'スラ', species: 'slime' }, ['hk_iyashi_kaze']).length, 0);
  const d = boardDual(world, [pc, mc, { name: '仲間' }], 'dt_minadein');
  assert.ok(d.title.startsWith('パパとママが合体技『'), d.title);
  assert.ok(d.detail.includes('勇者の系統'), d.detail);
  assert.equal(boardDual(world, [pc], 'dt_minadein'), null, 'おなじ キャラは 1回');
  for (const e of world.data.familyBoard) { textOk(e.title); textOk(e.detail); }
  for (const t of [jobHowText('warrior'), jobHowText('fruit_idol'), hiraHowText('medoro'), dualHowText('dt_minadein')]) textOk(t);
});

test('ひとりモードでも 動く（ブラウザの 中の 世界）', async () => {
  const world = newWorld();
  assert.equal(world.offline, true);
  const kid = await player(world, 'ボク');
  const c = charOf(world, kid);
  c.jobs.warrior = { lv: JOB_MAX_LEVEL, b: 999 };
  c.jobs.mage = { lv: JOB_MAX_LEVEL, b: 999 };
  jobSvc(kid, 'magic_knight');
  kid.send({ t: 'fboard', action: 'list' });
  const res = kid.msgs.filter((m) => m.t === 'fboardList').pop();
  assert.equal(res.list.length, 1);
  assert.equal(res.last, 0, '自分の 知らせだけなら ● なし');
});

test('戦いの あとで ひらめいた 技・はじめて 使った 合体技が のる（world/battles.js）', { timeout: 60000 }, async () => {
  const world = newWorld();
  const papa = await player(world, 'パパ');
  const c = charOf(world, papa);
  papa.s.map = 'overworld';
  papa.s.x = PLACES.village.x + 40;
  papa.s.y = PLACES.village.y + 12;
  const ctx = startFieldBattle(world, papa.s, { id: 'fb51', sp: 'pururin', group: ['pururin'], zone: 'outskirts', table: 'outskirts', busy: false });
  const b = ctx.battle;
  const me = b.allies.find((a) => a.kind === 'player');
  me.hiraNew = ['hk_triple_mera'];
  // 合体技を 1回 使った ことに する（battle.tick の できごとに 足す）
  const tick = b.tick.bind(b);
  let once = false;
  b.tick = (dt) => {
    const evs = tick(dt);
    if (!once) { once = true; evs.push({ t: 'act', dual: { id: 'dt_minadein', m: [me.id] } }); }
    return evs;
  };
  for (const e of b.enemies) { e.hp = 1; e.atk = 0; }
  for (let i = 0; i < 4000 && world.battles.size; i++) {
    for (const e of b.enemies) e.hp = Math.min(e.hp, 1);
    await tickN(world, 1);
    papa.flushQueue();
  }
  assert.equal(world.battles.size, 0, '戦いが おわった');
  const kinds = world.data.familyBoard.map((e) => `${e.kind}:${e.key}`);
  assert.ok(kinds.includes('dual:dt_minadein'), kinds.join(','));
  assert.ok(c.hirameki.includes('hk_triple_mera'));
  assert.ok(kinds.includes('hirameki:hk_triple_mera'), kinds.join(','));
  assert.ok(c.dualSeen?.dt_minadein);
});
