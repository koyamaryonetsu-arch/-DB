// 家族サーバー ⇄ スマホ（ひとりで遊ぶサイト）で キャラを 合わせる
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { newCharacter, expForLevel, gainExp } from '../public/js/shared/stats.js';
import { mergeChars } from '../public/js/shared/world/merge.js';
import { encodeSync, decodeSync, memorySyncStore, pruneEntries, applySyncIn, buildSyncOut } from '../public/js/shared/world/sync.js';
import { setStoryFlag } from '../public/js/shared/world/scripts.js';

const clone = (x) => JSON.parse(JSON.stringify(x));

function hero(name = 'ユイ') {
  const c = newCharacter({ id: 'cyui1', name, look: {}, job: 'warrior' });
  c.lastPlayed = 1000;
  return c;
}

// メッセージを やりとりする だけの つなぎ
function conn(world) {
  const got = [];
  const s = world.connect({ send: (m) => got.push(JSON.parse(JSON.stringify(m))) });
  world.handle(s, { t: 'hello', pw: 'ほし' });
  return {
    s,
    got,
    ask(msg, want) {
      world.handle(s, msg);
      return got.filter((m) => m.t === want).pop();
    },
  };
}

function worlds() {
  const server = new GameWorld({ offline: false, rng: makeRng(3), checkPassword: (pw) => pw === 'ほし', rateLimit: false, syncStore: memorySyncStore(12) });
  const site = new GameWorld({ offline: true, rng: makeRng(4), syncStore: memorySyncStore(5) });
  return { server, site, sv: conn(server), st: conn(site) };
}

// 片方から もう片方へ 送る
function send(from, fromConn, to, toConn, msg = {}) {
  const out = fromConn.ask({ t: 'syncOut', ...msg }, 'syncPayload');
  if (!out.text) return { results: [] };
  return toConn.ask({ t: 'syncIn', text: out.text }, 'syncResult');
}

test('合わせる: 家族サーバーで 遊んだ ぶんと スマホで 遊んだ ぶんが 両方 のこる', () => {
  const { server, site, sv, st } = worlds();
  const c = hero();
  server.data.characters[c.id] = c;
  // 家族サーバー → スマホ（はじめて）
  let r = send(server, sv, site, st, { ids: [c.id] });
  assert.equal(r.results[0].mode, 'new');
  // それぞれで 遊ぶ
  const a = server.data.characters[c.id];
  const t = site.data.characters[c.id];
  gainExp(a, 200);
  a.gold += 30;
  a.flags.c1_town = true;
  a.kills.slime = 4;
  a.items.push({ id: 'antidote', n: 1 });
  a.lastPlayed = 2000;
  gainExp(t, 150);
  t.gold -= 20;
  t.flags.q_mike_start = true;
  t.kills.slime = 3;
  t.kills.wolf = 2;
  t.items.find((e) => e.id === 'herb').n = 1; // 薬草を 2こ つかった
  t.chests.box1 = true;
  t.lastPlayed = 3000;
  // スマホ → 家族サーバー
  r = send(site, st, server, sv, { onlyChanged: true });
  assert.equal(r.results[0].mode, 'merged');
  const m = server.data.characters[c.id];
  assert.equal(m.exp, 350, 'けいけんちは 両方の ぶん');
  assert.equal(m.level, [...Array(50).keys()].map((i) => i + 1).filter((lv) => expForLevel(lv) <= 350).pop());
  assert.equal(m.gold, 50 + 30 - 20);
  assert.ok(m.flags.c1_town && m.flags.q_mike_start, 'フラグは 両方');
  assert.ok(m.chests.box1);
  assert.equal(m.kills.slime, 7);
  assert.equal(m.kills.wolf, 2);
  assert.equal(m.items.find((e) => e.id === 'herb').n, 1, '使った 道具は へる');
  assert.equal(m.items.find((e) => e.id === 'antidote').n, 1, 'ふえた 道具は ふえる');
  assert.ok(r.lines[0].includes('両方で遊んだデータを合わせました'));

  // もう一度 送っても かわらない
  const snap = JSON.stringify(m);
  r = send(site, st, server, sv);
  assert.ok(['kept', 'same'].includes(r.results[0].mode), r.results[0].mode);
  assert.equal(JSON.stringify(server.data.characters[c.id]), snap);
});

test('合わせる: 片方だけ 進んだ ときは そのまま 新しい ほうに（行ったり 来たり）', () => {
  const { server, site, sv, st } = worlds();
  const c = hero();
  site.data.characters[c.id] = c;
  // スマホで つくって 家族サーバーへ
  let r = send(site, st, server, sv);
  assert.equal(r.results[0].mode, 'new');
  // 家族サーバーで 遊ぶ
  gainExp(server.data.characters[c.id], 500);
  server.data.characters[c.id].lastPlayed = 5000;
  // 家族サーバー → スマホ（スマホは 進んでいない → 上書き）
  r = send(server, sv, site, st, { ids: [c.id] });
  assert.equal(r.results[0].mode, 'updated');
  assert.equal(site.data.characters[c.id].exp, 500);
  // うけとった ままの キャラは 送らない
  assert.equal(st.ask({ t: 'syncOut', onlyChanged: true }, 'syncPayload').text, '');
  // スマホで 遊ぶ → 家族サーバー（家族サーバーは 進んでいない → 上書き）
  gainExp(site.data.characters[c.id], 100);
  site.data.characters[c.id].pos = { map: 'overworld', x: 30.5, y: 20.5, dir: 'left' };
  r = send(site, st, server, sv, { onlyChanged: true });
  assert.equal(r.results[0].mode, 'updated');
  assert.equal(server.data.characters[c.id].exp, 600);
  assert.deepEqual(server.data.characters[c.id].pos, { map: 'overworld', x: 30.5, y: 20.5, dir: 'left' }, 'いる場所も');
  // 家族サーバーの 名前は かえない
  server.data.characters[c.id].name = 'ユイ2';
  gainExp(site.data.characters[c.id], 10);
  send(site, st, server, sv, { onlyChanged: true });
  assert.equal(server.data.characters[c.id].name, 'ユイ2');
});

test('合わせる: 送った データが とどかなかった ときも、つぎに 合わせれば なくならない', () => {
  const { server, site, sv, st } = worlds();
  const c = hero();
  server.data.characters[c.id] = c;
  send(server, sv, site, st, { ids: [c.id] });
  gainExp(site.data.characters[c.id], 100);
  // 送った（けど 家族サーバーに つながらなかった）
  st.ask({ t: 'syncOut', onlyChanged: true }, 'syncPayload');
  gainExp(site.data.characters[c.id], 50);
  gainExp(server.data.characters[c.id], 40);
  const r = send(site, st, server, sv, { onlyChanged: true });
  assert.equal(r.results[0].mode, 'merged');
  assert.equal(server.data.characters[c.id].exp, 190, '100 + 50 + 40');
});

test('合わせる: はじめて 合わせる キャラ（前の 版で 引っこした など）は 多い ほうを とる', () => {
  const { server, site, sv, st } = worlds();
  const a = hero();
  gainExp(a, 300);
  a.flags.c1_town = true;
  a.lastPlayed = 4000;
  const t = clone(a);
  gainExp(a, 100); // 家族サーバーで 400
  a.gold = 500;
  gainExp(t, 50); // スマホで 350
  t.gold = 80;
  t.flags.q_mike_start = true;
  t.lastPlayed = 6000;
  server.data.characters[a.id] = a;
  site.data.characters[t.id] = t;
  const r = send(site, st, server, sv);
  assert.equal(r.results[0].mode, 'merged');
  const m = server.data.characters[a.id];
  assert.equal(m.exp, 400, 'けいけんちは 多い ほう');
  assert.equal(m.gold, 500, 'ゴールドも 多い ほう');
  assert.ok(m.flags.c1_town && m.flags.q_mike_start, 'フラグは 両方');
});

test('合わせる: 仲間・そうび・職業・ものがたり', () => {
  const base = hero();
  base.companions = [{ key: 'm1', kind: 'monster', species: 'pururin', char: { ...newCharacter({ id: 'm1', name: 'スラ', look: {}, job: 'warrior' }), species: 'pururin', level: 3, exp: expForLevel(3), jobs: {} } }];
  base.monsterSeq = 2;
  base.partyKeys = ['m1'];
  base.equip.weapon = 'wood_sword';
  base.items = [{ id: 'herb', n: 3 }, { id: 'bronze_sword', n: 1 }];
  base.jobs.warrior = { lv: 2, b: 5 };
  base.keyItems = ['cave_key'];
  base.lastPlayed = 1000;
  const a = clone(base); // 家族サーバー
  const t = clone(base); // スマホ
  // 家族サーバー: どうのつるぎに もちかえ・まもの m2（ドラキー）が 仲間に・カギを 使った
  a.equip.weapon = 'bronze_sword';
  a.items = [{ id: 'herb', n: 3 }, { id: 'wood_sword', n: 1 }];
  a.companions.push({ key: 'm2', kind: 'monster', species: 'koumorin', char: { ...clone(base.companions[0].char), id: 'm2', name: 'ドラ', species: 'koumorin' } });
  a.monsterSeq = 3;
  a.keyItems = [];
  a.jobs.warrior.b = 12;
  a.lastPlayed = 2000;
  // スマホ: まもの m2（ウルフ）が 仲間に・スラが そだった・物語が すすんだ
  t.companions.push({ key: 'm2', kind: 'monster', species: 'wolf', char: { ...clone(base.companions[0].char), id: 'm2', name: 'ウル', species: 'wolf' } });
  t.companions[0].char.exp += 40;
  t.monsterSeq = 3;
  t.partyKeys = ['m1', 'm2'];
  t.jobs.warrior.b = 9;
  setStoryFlag(t, 'c1_mayor');
  t.objective = 'スマホの目標';
  a.objective = 'サーバーの目標';
  t.lastPlayed = 3000;
  const m = mergeChars(base, a, t);
  const names = m.companions.map((e) => e.char.name).sort();
  assert.deepEqual(names, ['ウル', 'スラ', 'ドラ'], 'べつべつに 仲間に なった まものは 両方');
  assert.equal(new Set(m.companions.map((e) => e.key)).size, 3, '番号は かさならない');
  const wolf = m.companions.find((e) => e.char.name === 'ウル');
  assert.ok(m.partyKeys.includes(wolf.key), 'パーティーの ウルフも いっしょ');
  assert.ok(m.monsterSeq > 3);
  assert.equal(m.companions.find((e) => e.key === 'm1').char.exp, base.companions[0].char.exp + 40, '仲間の そだちも');
  assert.equal(m.equip.weapon, 'bronze_sword');
  const count = (id) => (m.items.find((e) => e.id === id)?.n || 0) + (m.equip.weapon === id ? 1 : 0);
  assert.equal(count('wood_sword'), 1, 'そうびは ふえたり へったり しない');
  assert.equal(count('bronze_sword'), 1);
  assert.deepEqual(m.keyItems, [], '使った カギは なくなる');
  assert.equal(m.jobs.warrior.b, 5 + 7 + 4, '職業の 勝った 数は 両方の ぶん');
  assert.ok(m.jobs.warrior.lv >= 3);
  assert.equal(m.objective, 'スマホの目標', '物語が すすんだ ほうの 目標');
});

test('合わせる: 消した キャラは もどってこない（消した あとに 遊んでいたら もどる）', () => {
  const { server, site, sv, st } = worlds();
  const c = hero();
  server.data.characters[c.id] = c;
  send(server, sv, site, st, { ids: [c.id] });
  // 家族サーバーで 消す
  sv.ask({ t: 'deleteChar', id: c.id, confirm: c.name }, 'chars');
  assert.ok(!server.data.characters[c.id]);
  let r = send(site, st, server, sv);
  assert.equal(r.results[0].mode, 'deleted');
  assert.ok(!server.data.characters[c.id]);
  // スマホで そのあと 遊んだ → もどってくる
  site.data.characters[c.id].lastPlayed = Date.now() + 60000;
  r = send(site, st, server, sv);
  assert.equal(r.results[0].mode, 'new');
});

test('合わせる: 今 遊んでいる キャラは あとで', async () => {
  const { server, site, sv, st } = worlds();
  const c = hero();
  server.data.characters[c.id] = c;
  send(server, sv, site, st, { ids: [c.id] });
  sv.ask({ t: 'play', id: c.id }, 'enter');
  gainExp(site.data.characters[c.id], 10);
  const r = send(site, st, server, sv, { onlyChanged: true });
  assert.equal(r.results[0].mode, 'busy');
  assert.ok(r.lines[0].includes('今遊んでいる'));
});

test('合わせる: 同じ 名前の べつの キャラが いたら 名前に 数字', () => {
  const { server, site, sv, st } = worlds();
  const a = hero();
  server.data.characters[a.id] = a;
  const b = { ...hero(), id: 'cother1' };
  site.data.characters[b.id] = b;
  const r = send(site, st, server, sv);
  assert.equal(r.results[0].mode, 'new');
  assert.equal(server.data.characters[b.id].name, 'ユイ2');
});

test('合わせる: データの 形・切れた データ・おぼえる 数', () => {
  const text = encodeSync({ v: 1, chars: [] });
  assert.ok(decodeSync(text).ok);
  assert.equal(decodeSync(text.slice(0, -3)).ok, false);
  assert.equal(decodeSync('KIZUNA-2-xxxx').ok, false);
  // おぼえる 数を こえても、さいごに うけとった 版は のこす
  const e = (vid, kind, n) => ({ vid, kind, char: { id: 'x', n } });
  const list = pruneEntries([e('ssssss01', 'sent', 1), e('ssssss02', 'sent', 2), e('ssssss03', 'sent', 3), e('rrrrrr01', 'received', 0)], 3);
  assert.equal(list.length, 3);
  assert.ok(list.some((x) => x.vid === 'rrrrrr01'));
  // おなじ 中みの 送った 版は 1つに
  assert.equal(pruneEntries([e('ssssss01', 'sent', 1), e('ssssss02', 'sent', 1)], 5).length, 1);
});

test('合わせる: こわれた キャラ・へんな ID は 入れない', () => {
  const { server } = worlds();
  const bad = [{ vid: 'abcdefgh', known: [], char: { id: '__proto__', name: 'x' } }, { vid: 'abcdefgh', known: [], char: null }];
  const res = applySyncIn(server, { sv: 2, chars: bad });
  assert.deepEqual(res.map((r) => r.mode), ['bad', 'bad']);
  assert.equal(Object.keys(server.data.characters).length, 0);
  assert.equal(buildSyncOut(server).data.chars.length, 0);
});
