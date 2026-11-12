// 第78回: 冒険のしおり（shared/world/shiori.js・client/ui/shiori.js。docs/plan-r78-shiori.md）
//   1. はじめたばかり・第3章の とちゅう・第8章まで 進んだ キャラで 物語の 場所・しくみの 数え方・おすすめ
//   2. ネタバレ: まだ 開いて いない しくみ・先の 章の 物・ボスの 名前・幕の 名前を 出さない
//   3. 純粋な 関数（キャラを かえない）・メニューの 入口・文字
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { shioriOf, shioriTracks, shioriRecs, storyPlace, storyNext, trackCount, trackRate, CHAPTERS, TRACK_IDS, REC_MAX } from '../public/js/shared/world/shiori.js';
import { newCharacter } from '../public/js/shared/stats.js';
import { repairChar } from '../public/js/shared/world/save.js';
import { objectiveFromFlags } from '../public/js/shared/data/progress.js';
import { CH3_PROGRESS } from '../public/js/shared/data/story-ch3.js';
import { CH4_PROGRESS } from '../public/js/shared/data/story-ch4.js';
import { CH5_PROGRESS } from '../public/js/shared/data/story-ch5.js';
import { CH6_PROGRESS } from '../public/js/shared/data/story-ch6.js';
import { CH7_PROGRESS } from '../public/js/shared/data/story-c7.js';
import { CH8_PROGRESS } from '../public/js/shared/data/story-c8.js';
import { FAMILY_QUESTS } from '../public/js/shared/data/sidequests-family.js';
import { subQuestHints } from '../public/js/shared/data/subquest-hints.js';
import { ARENA_RANKS } from '../public/js/shared/data/arena.js';
import { MONARENA_RANKS } from '../public/js/shared/data/monarena.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { PHANTOM_ORDER } from '../public/js/shared/data/jobs.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { canLimitBreak } from '../public/js/shared/data/forge.js';
import { checkFile, gameFiles, checkText } from '../tools/kanji-check.mjs';

// ───────────── キャラを 作る（物語の しるしを その 所まで）─────────────
const EARLY = ['p_start', 'p_flower', 'p_attack', 'c1_town', 'c1_mayor', 'c1_wood_quest', 'c1_treant', 'bridge_fixed', 'c1_cave', 'c1_door', 'c1_boss', 'monster_bond',
  'c1_clear', 'c2_start', 'c2_ship', 'c2_port_seen', 'c2_port', 'c2_kraken', 'c2_light', 'c2_tower', 'c2_boss', 'c2_clear'];
const ALL = [...EARLY, ...[CH3_PROGRESS, CH4_PROGRESS, CH5_PROGRESS, CH6_PROGRESS, CH7_PROGRESS, CH8_PROGRESS].flat().map((x) => x[0]).filter((k) => typeof k === 'string')];
const upTo = (last) => Object.fromEntries(ALL.slice(0, ALL.indexOf(last) + 1).map((k) => [k, true]));
function mk(last, more = {}, extra = []) {
  const c = newCharacter({ id: 't', name: 'テスト', look: {}, job: 'warrior' });
  repairChar(c, 't');
  if (last) {
    assert.ok(ALL.includes(last), last);
    c.flags = { ...c.flags, ...upTo(last) };
  }
  for (const k of extra) c.flags[k] = true;
  c.objective = objectiveFromFlags(c);
  return Object.assign(c, more);
}
const ARRIVES = ['c7_arrive', 'c7s_arrive', 'c7i_arrive', 'c8a_arrive', 'c8b_arrive', 'c8c_arrive'];
const begin = () => mk(null);
const mid = () => {
  const c = mk('c3_kanatoko', { level: 30 });
  Object.assign(c.flags, { q_mike_start: true, q_mike_done: true, q_wolf_start: true });
  c.chests = { b1_a: true };
  return c;
};
const lbCand = Object.keys(ITEMS).find((id) => canLimitBreak(id, {}));
const adv = () => mk('c8c_f4', {
  level: 86,
  treasureMaps: [{ seed: 123, lv: 31, map: 'overworld', x: 50, y: 50 }, { seed: 456, lv: 28, map: 'overworld', x: 90, y: 30, found: true }],
  tmClears: 12,
  jobs: { warrior: { lv: 10 }, priest: { lv: 10 }, mage: { lv: 7 } },
  arena: { r: { 1: { n: 1 }, 2: { n: 1 }, 3: { n: 2 } } },
  monArena: { r: { F: { n: 1 }, E: { n: 1 } } },
  medalSpots: Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`s${i}`, true])), medalsGiven: 20, medalRewards: { 5: 1, 10: 1, 15: 1, 20: 1 },
  sd: { best: 23, save: 20, got: [], tries: 4 },
  chests: { b1_a: true, b1_b: true },
  items: lbCand ? [{ id: lbCand, n: 1 }] : [],
}, [...ARRIVES, 'tm_intro', 'q_mike_start', 'q_mike_done', 'q_star_start', 'q_star_done2']);
const T = (s, id) => s.tracks.find((t) => t.id === id);
const ids = (s) => s.tracks.map((t) => t.id);

// ───────────── 1. 3人の キャラ ─────────────
test('はじめたばかり: 序章・物語の おすすめ 1つ・開いて いない しくみは 出ない', () => {
  const c = begin();
  const s = shioriOf(c);
  assert.equal(s.story.label, '序章');
  assert.equal(s.story.where, 'ホシフル村');
  assert.ok(s.story.objective && !s.story.end);
  // 職業と 図鑑だけ（いらい・より道・闘技場・宝の地図・ひみつのダンジョン・幻の職業・メダル・宝箱は まだ）
  assert.deepEqual(ids(s), ['jobs', 'zukan']);
  assert.equal(trackCount(T(s, 'jobs')), '0/1');
  assert.equal(s.recs.length, 1);
  assert.equal(s.recs[0].kind, 'story');
  assert.match(s.recs[0].text, /ホシフル村/);
});

test('第3章の とちゅう: 部・章・名前・開いた しくみの 数え方・おすすめ', () => {
  const c = mid();
  const s = shioriOf(c);
  assert.equal(s.story.label, '第1部 第3章');
  assert.equal(s.story.title, '星の竜がねむる山');
  assert.equal(s.story.where, '鉱山の町カナトコ');
  assert.deepEqual(ids(s), ['side', 'monarena', 'sd', 'jobs', 'zukan', 'chest']);
  // より道: 開いた 物だけ（第1章・第3章の 村と 町）。すんだ 1つ・受けて いる 1つ
  const side = T(s, 'side');
  const open = subQuestHints().filter((q) => !q.board && q.open.every((k) => c.flags[k]));
  assert.equal(side.total, open.length);
  assert.equal(side.now, 1);
  assert.equal(trackCount(side), `1/${open.length}`);
  assert.equal(side.items.find((x) => x.name === '迷子のねこミケ').state, 'done');
  assert.equal(side.items.find((x) => x.name === 'ウルフ退治').state, 'now');
  assert.equal(side.items[0].state, 'now', '受けて いる 物が 上');
  assert.ok(side.items.every((x) => x.where), '場所が ある');
  // モンスター闘技場: 第2章クリアまでの ランク（F・E・D）。F に ちょうせんできる
  const mon = T(s, 'monarena');
  assert.deepEqual(mon.items.map((x) => x.name.slice(0, 5)), ['ランクF「', 'ランクE「', 'ランクD「']);
  assert.equal(mon.items[0].state, 'open');
  assert.equal(mon.items[1].state, 'wait');
  // 宝箱: 開けた ダンジョン（なげきの洞窟）だけ
  assert.deepEqual(T(s, 'chest').items.map((x) => x.name), ['なげきの洞窟']);
  // おすすめ: 物語が 先・より道も 出る・3つまで・場所つき
  assert.equal(s.recs.length, REC_MAX);
  assert.equal(s.recs[0].kind, 'story');
  assert.ok(s.recs.slice(1).every((r) => r.kind === 'side'));
  assert.ok(s.recs.every((r) => r.where), JSON.stringify(s.recs));
  assert.ok(s.recs.some((r) => r.go === 'monarena'));
});

test('第8章まで 進んだ: 第2部 第8章 第3幕・いらい・闘技場・宝の地図・メダル・限界とっぱ', () => {
  const c = adv();
  const s = shioriOf(c);
  assert.equal(s.story.label, '第2部 第8章 第3幕');
  assert.equal(s.story.title, '千年の約束');
  assert.equal(s.story.actTitle, 'くろがねの空中ようさい');
  assert.ok(s.story.where);
  for (const id of ['board', 'side', 'arena', 'monarena', 'tmap', 'sd', 'jobs', 'zukan', 'medal', 'chest']) assert.ok(T(s, id), id);
  // お仕事いらい: 開いた はり紙 ぜんぶ（第8章 第3幕までで 32まい）
  const board = T(s, 'board');
  assert.equal(board.total, FAMILY_QUESTS.filter((q) => (q.open || ['c5_clear']).every((k) => c.flags[k])).length);
  assert.equal(board.total, 32);
  assert.match(board.where, /お仕事いらい板/);
  // サファラ闘技場: 物語で 開いた ランクの 数・勝ちぬいた 3つ・つぎは ランク4
  const ar = T(s, 'arena');
  assert.equal(ar.total, ARENA_RANKS.filter((R) => !R.needFlag || c.flags[R.needFlag]).length);
  assert.equal(ar.now, 3);
  assert.equal(ar.items[3].state, 'open');
  assert.equal(ar.items[4].state, 'wait');
  // 宝の地図: ふかさ（いちばん 高い 地図の レベル）・まだ ほって いない 地図
  const tm = T(s, 'tmap');
  assert.equal(trackCount(tm), 'Lv31/45');
  assert.equal(tm.items.length, 2);
  assert.match(tm.note, /12まい/);
  assert.match(tm.note, /カジノの段/);
  // ひみつのダンジョン: 23階 → つぎの 番人は 30階
  assert.equal(trackCount(T(s, 'sd')), '23階');
  assert.equal(T(s, 'sd').total, 30);
  // メダル: 持っている 10 ＋ わたした 20 ＝ 30 ／ つぎの ごほうび
  const md = T(s, 'medal');
  assert.equal(md.now, 30);
  assert.equal(md.total, 25, 'つぎの ごほうびは 25まいで（もう もらえる）');
  assert.ok(s.recs.some((r) => r.go === 'medal'), 'メダル王の ごほうびを おすすめ');
  // 職業: マスター 2つ / ついた 3つ
  assert.equal(trackCount(T(s, 'jobs')), '2/3');
  if (lbCand) assert.equal(T(s, 'limit').items[0].state, 'open');
  // おすすめ: 物語 1つ ＋ より道 2つ。どれも 場所つき・しくみに つながる
  assert.equal(s.recs.length, 3);
  assert.equal(s.recs[0].kind, 'story');
  assert.ok(s.recs.every((r) => r.where && (r.go === 'story' || TRACK_IDS.includes(r.go))), JSON.stringify(s.recs));
});

// ───────────── 2. ネタバレ ─────────────
test('ネタバレ: 先の 章の 名前・しくみ・ボスの 名前が 出ない', () => {
  const later = ['砂の海にしずむ星', '空にうかぶ大地', '時の砂時計', '最初の紋章の勇者たち', '千年の約束', 'お仕事いらい', 'サファラ闘技場', '幻の職業', '伝説の部', '千年前', '宝の地図'];
  const txt = JSON.stringify(shioriOf(mid()));
  for (const w of later) assert.ok(!txt.includes(w), `第3章で「${w}」が 出た`);
  // まだ 開いて いない より道は 名前も 数も 出ない
  const s = shioriOf(mid());
  const shut = subQuestHints().filter((q) => !q.open.every((k) => mid().flags[k]));
  for (const q of shut) assert.ok(!txt.includes(q.name), q.name);
  assert.ok(s.tracks.every((t) => t.items.every((x) => x.state !== 'unknown')));
  // 闘技場の 王者・モンスター闘技場の 王者の 名前は 出さない（第8章でも）
  const all = JSON.stringify(shioriOf(adv()));
  for (const R of ARENA_RANKS) assert.ok(!all.includes(R.champ), R.champ);
  for (const R of MONARENA_RANKS) {
    const sp = R.fights?.[2]?.[0];
    const name = MONSTERS[sp]?.name;
    if (name && name.length >= 3) assert.ok(!all.includes(name), name);
  }
  // 見つけて いない 魔物の 名前は 出さない（図鑑は 数だけ）
  assert.deepEqual(T(shioriOf(adv()), 'zukan').items, []);
});

test('ネタバレ: 幕の 名前は その 幕の はじまりを 見た あと・第7章の 名前は 千年前に 着いた あと', () => {
  // 第8章 第2幕クリアの 直後（まだ 千年前の ミドリナに 着いて いない）
  const c = mk('c8_sky');
  const p = storyPlace(c);
  assert.equal(p.label, '第2部 第8章 第3幕');
  assert.equal(p.actTitle, '');
  c.flags.c8c_arrive = true;
  assert.equal(storyPlace(c).actTitle, 'くろがねの空中ようさい');
  // 第7章の はじめ
  const d = mk('c7_start');
  assert.equal(storyPlace(d).label, '第2部 第7章 第1幕');
  assert.equal(storyPlace(d).title, '');
  d.flags.c7_arrive = true;
  assert.equal(storyPlace(d).title, '最初の紋章の勇者たち');
  // 第6章の 第3幕は 文字が 出た 時から
  assert.equal(storyPlace(mk('c6_flow')).actTitle, '星読みの社');
  assert.equal(storyPlace(mk('c6_rion')).actTitle, '');
  assert.equal(storyPlace(mk('c6_rion')).act, 2);
  // 章の クリアの あと（つぎの 章は まだ）
  const e = mk('c4_clear');
  assert.equal(storyPlace(e).label, '第1部 第4章');
  assert.equal(storyPlace(e).cleared, true);
  // 章の 表は 序章から 第8章まで
  assert.deepEqual(CHAPTERS.map((x) => x.n), [0, 1, 2, 3, 4, 5, 6, 7, 8]);
});

test('ネタバレ: 幻の職業は 知って いる 物だけ 名前・ほかは ？？？。職業は ついた 物だけ', () => {
  const c = adv();
  const id = PHANTOM_ORDER[0];
  c.jobs[id] = { lv: 1 };
  const s = shioriOf(c);
  const ph = T(s, 'phantom');
  assert.ok(ph, '幻の職業に ついた ことが あれば 出る');
  assert.equal(ph.total, PHANTOM_ORDER.length);
  assert.equal(ph.now, 1);
  assert.equal(ph.items.filter((x) => x.name === '？？？').length, PHANTOM_ORDER.length - 1);
  assert.ok(ph.items.filter((x) => x.state === 'unknown').every((x) => !x.where && !x.right));
  // 職業の 一覧は ついた ことの ある 職業だけ
  assert.equal(T(s, 'jobs').total, Object.keys(c.jobs).length);
  // 幻の職業を 知らない 人には 出さない
  assert.equal(T(shioriOf(adv()), 'phantom'), undefined);
});

// ───────────── 3. おすすめの きまり ─────────────
test('おすすめ: 物語が 先に 終わって いる ときは より道だけ 3つまで・同じ しくみは 1つ', () => {
  const c = adv();
  c.objective = '第3章クリア！自由に冒険しよう（続きはアップデートで！）';
  assert.equal(storyNext(c).end, true);
  const r = shioriRecs(c);
  assert.ok(r.length <= REC_MAX && r.length >= 2);
  assert.ok(r.every((x) => x.kind === 'side'));
  assert.equal(new Set(r.map((x) => x.go)).size, r.length);
  // 報告できる たのまれごとが いちばん 先
  const d = mid();
  d.flags.q_mike_done = false;
  d.flags.q_mike_found = true;
  const r2 = shioriRecs(d);
  assert.equal(r2[1].go, 'side');
  assert.match(r2[1].text, /迷子のねこミケ.*報告/);
  assert.equal(r2[1].where, 'ルミナの町');
});

test('数え方: 数と 棒・キャラを かえない', () => {
  assert.equal(trackCount({ now: 3, total: 12, unit: 'こ' }), '3/12');
  assert.equal(trackCount({ now: 5, total: null, unit: 'しゅ' }), '5しゅ');
  assert.equal(trackRate({ now: 3, total: 12 }), 0.25);
  assert.equal(trackRate({ now: 30, total: 12 }), 1);
  assert.equal(trackRate({ now: 3, total: 0 }), 0);
  for (const c of [begin(), mid(), adv()]) {
    const before = JSON.stringify(c);
    shioriOf(c);
    shioriTracks(c);
    assert.equal(JSON.stringify(c), before);
  }
  // こわれた キャラ・空でも うごく
  assert.doesNotThrow(() => shioriOf({}));
  assert.doesNotThrow(() => shioriOf(null));
});

// ───────────── 4. メニューの 入口・文字 ─────────────
const src = (p) => fs.readFileSync(new URL(`../public/js/${p}`, import.meta.url), 'utf8');
test('メニュー: 入口は 1つ（MAIN・見本・えらぶ）。画面は ui/shiori.js・CSS は r78-shiori-css.js', () => {
  const menu = src('client/ui/menu.js');
  assert.match(menu, /\{ label: '冒険のしおり', value: 'shiori' \}/);
  assert.match(menu, /case 'shiori': this\.main\.append\(shioriPreview\(this\)\)/);
  assert.match(menu, /return openShiori\(this\)\.then/);
  assert.equal((menu.match(/shiori/gi) || []).length <= 10, true, 'menu.js を さわる 所は 小さく');
  const ui = src('client/ui/shiori.js');
  assert.match(ui, /import '\.\/r78-shiori-css\.js'/);
  assert.match(ui, /new ListMenu/);
  assert.match(ui, /onCancel/);
  const css = src('client/ui/r78-shiori-css.js');
  assert.match(css, /orientation: portrait/);
  assert.match(css, /overflow-x: hidden/);
});

test('文字: しおりの ファイルは 使ってよい漢字だけ・スペースなし・ひらがなのまま 0。作った 文も', () => {
  const files = ['shared/world/shiori.js', 'client/ui/shiori.js', 'client/ui/r78-shiori-css.js'].map((f) => gameFiles().find((g) => g.endsWith('/public/js/' + f)));
  assert.ok(files.every(Boolean), 'gameFiles() に 入っている');
  const bad = [];
  for (const f of files) for (const p of checkFile(f)) bad.push(`${f.split('/').pop()}:${p.line} [${p.kind} ${p.detail}] ${p.text}`);
  for (const c of [begin(), mid(), adv()]) {
    const s = shioriOf(c);
    const texts = [s.story.label, ...s.recs.map((r) => r.text), ...s.tracks.flatMap((t) => [t.name, t.note, ...t.items.map((x) => x.right)])];
    for (const t of texts) for (const p of checkText(t || '')) if (p.kind !== 'space') bad.push(`[${p.kind} ${p.detail}] ${t}`);
  }
  assert.deepEqual(bad, []);
});
