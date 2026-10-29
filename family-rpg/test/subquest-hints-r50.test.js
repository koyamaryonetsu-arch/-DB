// 第50回 N4: 困っている人（まだ 受けていない たのまれごと）の お知らせ（shared/data/subquest-hints.js・client/ui/subquest-hints.js）
//   1. たのまれごと ぜんぶに「どこの・だれが・ひとこと」が ある
//   2. お話が 進むと 出る・受けたら／クリアしたら 消える
//   3. 知らせた・見た 印（サーバーの menu → subAsk・セーブの 形）
//   4. 地図の しるし（クエストの 画面で えらんだ 人）・文字
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  subQuestHints, subQuestHint, availableSubQuests, newAsks, hasNewAsk, markAsks, repairSubAsk, askLine, askJobNote, askToastText, setAskPin, askPinQuest,
} from '../public/js/shared/data/subquest-hints.js';
import { subQuests, questMarks, whereName } from '../public/js/shared/data/quest-targets.js';
import { SIDE_QUESTS } from '../public/js/shared/data/sidequests.js';
import { FAMILY_QUESTS } from '../public/js/shared/data/sidequests-family.js';
import { CH6_SIDE_QUESTS } from '../public/js/shared/data/sidequests-ch6.js';
import { CH6C_SIDE_QUESTS } from '../public/js/shared/data/sidequests-ch6c.js';
import { visibleMarks } from '../public/js/shared/data/difficulty.js';
import { MAPS } from '../public/js/shared/maps/index.js';
import { repairChar } from '../public/js/shared/world/save.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { checkFile, gameFiles, checkText } from '../tools/kanji-check.mjs';
import { Bot } from './helpers.js';

const ids = (list) => list.map((q) => q.id);
const ch = (flags = {}, more = {}) => ({ flags: Object.fromEntries(Object.entries(flags).map(([k, v]) => [k, v])), items: [], keyItems: [], job: 'warrior', ...more });
const on = (...fs) => Object.fromEntries(fs.map((f) => [f, true]));
const src = (p) => fs.readFileSync(new URL(`../public/js/${p}`, import.meta.url), 'utf8');

// ───────────── 1. 一らん ─────────────
test('一らん: たのまれごと ぜんぶに 場所・人・ひとこと・地図の 人が ある', () => {
  const all = subQuestHints();
  assert.equal(new Set(ids(all)).size, all.length, 'id は かぶらない');
  const names = new Set(all.map((q) => q.name));
  // ほかの ファイルの 一らん（第4章クリアの あと・お仕事いらい板・第6章）
  for (const q of SIDE_QUESTS) assert.ok(names.has(q.name), q.name);
  for (const q of FAMILY_QUESTS) assert.ok(names.has(q.name), q.name);
  for (const q of CH6_SIDE_QUESTS) assert.ok(names.has(q.name), q.name);
  for (const q of CH6C_SIDE_QUESTS) assert.ok(names.has(q.name.replace(/（\d+こ）$/, '')), q.name);
  // 受けた たのまれごとの 名前（クエストの 画面）も ぜんぶ ある（第1〜3章の ものも）
  const every = ch(on(...all.flatMap((q) => [...q.open, ...(typeof q.start === 'string' ? [q.start] : [])]), 'q_ghost_start'), { keyItems: ['bottle_letter'] });
  for (const q of subQuests(every)) assert.ok(names.has(q.name), `メタデータが ない: ${q.name}`);
  // だいほんで 受ける フラグ（['flag', 'q_*_start']）は ぜんぶ どれかの start
  const starts = new Set(all.map((q) => q.start).filter((s) => typeof s === 'string'));
  const dir = new URL('../public/js/shared/data/', import.meta.url);
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js'))) {
    for (const m of fs.readFileSync(new URL(f, dir), 'utf8').matchAll(/\['flag', '(q_[a-z0-9_]+_start)'\]/g)) assert.ok(starts.has(m[1]), `${f}: ${m[1]}`);
  }
  for (const q of all) {
    assert.ok(q.place && q.who && q.name, q.id);
    assert.ok(q.npc && whereName({ npc: q.npc }), `${q.id}: 地図の 人 ${q.npc}`);
    assert.ok(Array.isArray(q.open) && q.open.length, `${q.id}: open`);
    assert.ok(q.done, `${q.id}: done`);
    if (!q.auto) assert.ok(q.hint && q.hint.length <= 60, `${q.id}: ひとこと`);
    assert.equal(subQuestHint(q.id), q);
  }
  // お仕事いらい板は 11まい ぜんぶ（職業の 系統つき）
  const board = all.filter((q) => q.board);
  assert.equal(board.length, FAMILY_QUESTS.length);
  assert.ok(board.every((q) => q.roots?.length && q.job));
});

test('一らん: ひとことに ネタばれが ない（ボスの 名前・ごほうびの 品の 名前を 書かない）', () => {
  const words = ['古竜オルドラ', '流星の剣', '星竜のうろこ', '時の砂のブローチ', 'まっ白な雪玉', '万年氷', '石板の写し', '古代の鉄木', 'コンパス', 'オルゴール', '大王イカ', 'マグマゴーレム', 'ゴールド', '★'];
  for (const q of subQuestHints()) for (const w of words) assert.ok(!`${q.place}${q.who}${q.hint}`.includes(w), `${q.id}: ${w}`);
});

// ───────────── 2. 出る・消える ─────────────
test('出る: お話の すすみで 困っている人が ふえる', () => {
  assert.deepEqual(availableSubQuests(ch()), []);
  assert.deepEqual(availableSubQuests(null), []);
  assert.deepEqual(ids(availableSubQuests(ch(on('c1_town')))), ['mike', 'jelly', 'wolf', 'ghost']);
  assert.ok(ids(availableSubQuests(ch(on('c1_town', 'c2_port')))).includes('bottle'));
  assert.deepEqual(ids(availableSubQuests(ch(on('c3_village')))), ['fox', 'snow']);
  assert.deepEqual(ids(availableSubQuests(ch(on('c3_kanatoko')))), ['smith']);
  assert.deepEqual(ids(availableSubQuests(ch(on('c4_scorpion')))), ['camel']);
  const c4 = ids(availableSubQuests(ch(on('c4_scorpion', 'c4_clear'))));
  assert.deepEqual(c4, SIDE_QUESTS.map((q) => q.id), '第4章クリアで 10こ');
  const c5 = availableSubQuests(ch(on('c5_clear')));
  assert.equal(c5.length, FAMILY_QUESTS.length, '第1部クリアで お仕事いらい板の 11こ');
  assert.deepEqual(ids(availableSubQuests(ch(on('c6_flow')))), ['tc1', 'tc2', 'tc3', 'recipe', 'chibi']);
  assert.ok(ids(availableSubQuests(ch(on('c6_flow', 'c6_kanata')))).includes('orn'));
  // お話で 始まる もの（氷のお守り・ばあちゃんの ごほうび）は 出さない
  const big = ch(on('c3_onsen', 'c6_flow', 'c6_tc1_dug', 'c6_tc2_dug', 'c6_tc3_dug'));
  assert.ok(!ids(availableSubQuests(big)).some((id) => ['ice', 'tc'].includes(id)));
});

test('消える: 受けた・クリアした たのまれごとは 出ない', () => {
  const base = on('c1_town', 'c2_port', 'c4_clear', 'c4_scorpion', 'c5_clear');
  const have = (c) => ids(availableSubQuests(c));
  assert.ok(have(ch(base)).includes('mike'));
  assert.ok(!have(ch({ ...base, q_mike_start: true })).includes('mike'), '受けた');
  assert.ok(!have(ch({ ...base, q_mike_done: true })).includes('mike'), 'クリア');
  // びんの手紙は 手紙を 持ったら 受けた ことに
  assert.ok(have(ch(base)).includes('bottle'));
  assert.ok(!have(ch(base, { keyItems: ['bottle_letter'] })).includes('bottle'));
  assert.ok(!have(ch({ ...base, q_bottle_done: true })).includes('bottle'));
  // 第4章クリアの あと・お仕事いらい板
  assert.ok(!have(ch({ ...base, q_kraken_start: true })).includes('kraken'));
  assert.ok(!have(ch({ ...base, q_star_done2: true })).includes('star'));
  const th = FAMILY_QUESTS.find((q) => q.id === 'theater');
  assert.ok(have(ch(base)).includes('fq_theater'));
  assert.ok(!have(ch({ ...base, [th.start]: true })).includes('fq_theater'));
  assert.ok(!have(ch({ ...base, [th.done]: true })).includes('fq_theater'));
  // 受けた ものは クエストの 画面の「たのまれごと」へ（subQuests）
  assert.ok(subQuests(ch({ ...base, q_mike_start: true })).some((q) => q.name === '迷子のねこミケ'));
});

test('文: 「〇〇の、〇〇が困っている」・お仕事いらい板の 職業・知らせ', () => {
  const mike = subQuestHint('mike');
  assert.equal(askLine(mike), 'ルミナの町の、女の子のリリが困っている');
  assert.equal(askJobNote(mike, ch()), '');
  const th = subQuestHint('fq_theater');
  assert.equal(askJobNote(th, ch({}, { job: 'setsubiya' })), '（今の職業で、解決できそう！）');
  assert.equal(askJobNote(th, ch({}, { job: 'warrior' })), '（設備屋の職業の人を、探している）');
  assert.equal(askToastText([mike]), 'ルミナの町で、だれかが困っているようです\n（メニューの「クエスト」で見られます）');
  assert.match(askToastText([mike, subQuestHint('ghost')]), /^ルミナの町などで、/);
  assert.equal(askToastText([]), '');
});

// ───────────── 3. 印 ─────────────
test('印: 知らせた（told）・見た（seen）。今 出ている id だけ のこす', () => {
  const c = ch(on('c1_town'));
  assert.ok(hasNewAsk(c));
  assert.deepEqual(ids(newAsks(c, 'told')), ['mike', 'jelly', 'wolf', 'ghost']);
  assert.ok(markAsks(c, 'told', ['mike', 'jelly', 'nazo', 'kraken']));
  assert.deepEqual(c.subAsk.told, ['mike', 'jelly'], '知らない id・まだ 出ていない id は 入れない');
  assert.deepEqual(ids(newAsks(c, 'told')), ['wolf', 'ghost']);
  assert.ok(!markAsks(c, 'told', ['mike']), 'かわらない');
  assert.ok(!markAsks(c, 'what', ['mike']));
  assert.ok(hasNewAsk(c), 'まだ 見ていない');
  markAsks(c, 'seen', ids(availableSubQuests(c)));
  assert.ok(!hasNewAsk(c));
  // お話が 進むと また ●
  c.flags.c2_port = true;
  assert.ok(hasNewAsk(c));
  assert.deepEqual(ids(newAsks(c, 'seen')), ['bottle']);
  // 受けた 物は 次に 印を つける 時に はずれる
  c.flags.q_mike_start = true;
  markAsks(c, 'seen', ['bottle']);
  assert.deepEqual(c.subAsk.seen, ['jelly', 'wolf', 'ghost', 'bottle']);
  assert.deepEqual(c.subAsk.told, ['mike', 'jelly']);
});

test('セーブ: 古い セーブ（subAsk なし）は そのまま・へんな 形は ととのえる', () => {
  const old = repairChar({ name: 'ソラ', job: 'warrior', flags: { c1_town: true } }, 'x1');
  assert.equal(old.subAsk, undefined, '古い セーブには 足さない');
  assert.ok(hasNewAsk(old));
  const bad = repairChar({ name: 'ソラ', job: 'warrior', flags: {}, subAsk: { told: ['mike', 3, null, 'mike'], seen: 'x', zzz: 1 } }, 'x2');
  assert.deepEqual(bad.subAsk, { told: ['mike'] });
  const c = { subAsk: 'へん' };
  repairSubAsk(c);
  assert.deepEqual(c.subAsk, {});
  // 引っこしの コードには 入れない
  assert.ok(!src('shared/world/transfer.js').includes('subAsk'));
});

test('サーバー: menu → subAsk で 印が のこる（返事の 知らせは 出さない）', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(50), rateLimit: false });
  const bot = new Bot(world, 'ミオ');
  await bot.login();
  await bot.createAndPlay('mage');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  c.flags.c1_town = true;
  const before = bot.msgs.length;
  bot.send({ t: 'menu', action: 'subAsk', kind: 'told', ids: ['mike', 'jelly', 'wolf', 'ghost'] });
  assert.deepEqual(c.subAsk.told, ['mike', 'jelly', 'wolf', 'ghost']);
  bot.send({ t: 'menu', action: 'subAsk', kind: 'seen', ids: ['mike', 'jelly', 'wolf', 'ghost'] });
  assert.ok(!hasNewAsk(c));
  assert.ok(!bot.msgs.slice(before).some((m) => m.t === 'menuRes'), '知らせ（menuRes）は 出さない');
  assert.ok(bot.msgs.slice(before).some((m) => m.t === 'self' && m.char.subAsk?.seen?.length === 4), '自分の ようすを おくる');
});

// ───────────── 4. 地図・画面・文字 ─────────────
test('地図: クエストの 画面で えらんだ 人に 黄色の しるし（受けたら 消える・しるしを けす 設定でも 出る）', () => {
  const c = ch(on('c1_town'), { difficulty: { subMarks: false } });
  setAskPin('mike');
  try {
    assert.equal(askPinQuest(c)?.id, 'mike');
    const npc = MAPS.overworld.npcs.find((n) => n.id === 'mike_girl');
    const mapId = npc ? 'overworld' : Object.values(MAPS).find((m) => m.npcs?.some((n) => n.id === 'mike_girl')).id;
    const marks = questMarks(c, mapId);
    const ask = marks.find((m) => m.kind === 'ask');
    assert.ok(ask && !ask.via && ask.label === '女の子のリリ');
    assert.ok(visibleMarks(c, marks).some((m) => m.kind === 'ask'), '自分で えらんだ しるしは いつも 出す');
    c.flags.q_mike_start = true;
    assert.equal(askPinQuest(c), null);
    assert.ok(!questMarks(c, mapId).some((m) => m.kind === 'ask'));
    setAskPin('nazo');
    assert.equal(askPinQuest(c), null);
  } finally { setAskPin(null); }
});

test('画面: クエストの 画面に「困っている人」・メニューと HUD の ●・知らせ', () => {
  const menu = src('client/ui/menu.js');
  assert.match(menu, /box\.append\(askSection\(this\.game\)\);/);
  assert.match(menu, /it\.value === 'quest' && hasNewAsk\(g\.me\)/);
  assert.match(menu, /case 'quest':\n\s+if \(availableSubQuests\(g\.me\)\.length\) this\.openView\(/);
  assert.match(menu, /ask: '#ffd84a'/);
  const hud = src('client/ui/hud.js');
  assert.match(hud, /if \(hasNewAsk\(this\.game\.me\)\) this\.btns\.firstChild\?\.classList\.add\('has-new'\);/);
  assert.match(hud, /this\.ask\.update\(\);/);
  const ui = src('client/ui/subquest-hints.js');
  assert.match(ui, /g\.state !== 'field' \|\| g\.busy/, 'フィールドで 何も して いない 時だけ 知らせる');
  assert.match(ui, /action: 'subAsk', kind: 'told'/);
  assert.match(ui, /action: 'subAsk', kind: 'seen'/);
});

test('文字: 困っている人の ファイルは 使ってよい漢字だけ・スペースなし・ひらがなのまま 0', () => {
  const files = ['shared/data/subquest-hints.js', 'client/ui/subquest-hints.js'].map((f) => gameFiles().find((g) => g.endsWith('/public/js/' + f)));
  assert.ok(files.every(Boolean), 'gameFiles() に 入っている');
  const bad = [];
  for (const f of files) for (const p of checkFile(f)) bad.push(`${f.split('/').pop()}:${p.line} [${p.kind} ${p.detail}] ${p.text}`);
  // 作った 文（お仕事いらい板の ひとこと・職業の 文・知らせ）
  const c = ch({}, { job: 'warrior' });
  for (const q of subQuestHints()) for (const t of [askLine(q), q.hint, askJobNote(q, c), askToastText([q])]) for (const p of checkText(t || '')) bad.push(`${q.id} [${p.kind} ${p.detail}] ${t}`);
  assert.deepEqual(bad, []);
});
