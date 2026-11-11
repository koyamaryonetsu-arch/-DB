// 第60回: 引っこしコード KIZUNA-4 を もっと みじかく（仲間の 日時は 36進・たおした 数は 図鑑の ならび順）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slimChar4, unslimChar4 } from '../public/js/shared/world/transfer.js';

const base = () => ({
  id: 'u1', name: 'ユイ',
  bestiary: { a: { friend: 1 }, b: { friend: 1 }, c: { seen: 1 } },
  kills: { a: 5, c: 0, z: 7 }, // b は たおしていない・z は 図鑑に ない
  flags: { x: true, n: 3 }, chests: { k: true },
  companions: [
    { key: 'm1', kind: 'monster', species: 'a', char: { id: 'u1:m1', species: 'a', name: 'ア', level: 3, joinedAt: 1793630032382, hp: 9, mp: 1 } },
    { key: 'n1', kind: 'npc', char: { id: 'u1:n1', name: 'ガルド', createdAt: 1793630032369, lastPlayed: 1793630099999, level: 1 } },
  ],
  storage: [{ key: 'm2', kind: 'monster', species: 'b', char: { id: 'u1:m2', species: 'b', name: 'ビ', level: 2, joinedAt: 1700000000000 } }],
});

test('第60回 KIZUNA-4: たおした 数・日時が もとどおりに もどる', () => {
  const c = base();
  const s = JSON.parse(JSON.stringify(slimChar4(c)));
  assert.ok(Array.isArray(s.kills.ixr), '図鑑の 順の 数（第75回: 同じ 数が 続く 所は まとめる）');
  assert.equal(typeof s.companions[0].char.joinedAt, 'string', '日時は 36進の 文字');
  assert.equal(typeof s.storage[0].char.joinedAt, 'string');
  assert.ok(!JSON.stringify(s.kills).includes('"a"'), '図鑑に ある 名前は 書かない');
  const back = unslimChar4(s);
  assert.deepEqual(back.kills, c.kills);
  assert.equal(back.companions[0].char.joinedAt, 1793630032382);
  assert.equal(back.companions[1].char.createdAt, 1793630032369);
  assert.equal(back.companions[1].char.lastPlayed, 1793630099999);
  assert.equal(back.storage[0].char.joinedAt, 1700000000000);
  assert.deepEqual(back.bestiary, c.bestiary);
  assert.equal(c.companions[0].char.joinedAt, 1793630032382, 'もとの キャラは かえない');
});

test('第60回 KIZUNA-4: 前の 形（kills が ならび）も 読める・図鑑が ない 時は 前の 形', () => {
  const old = { id: 'u1', name: 'ユイ', kills: [[99, 'a', 'b']], bestiary: [[{ friend: 1 }, 'a', 'b']], companions: [] };
  assert.deepEqual(unslimChar4(old).kills, { a: 99, b: 99 });
  const c = { ...base(), bestiary: undefined };
  const s = slimChar4(c);
  assert.ok(Array.isArray(s.kills), '図鑑が ない 時は 同じ 数ごとの ならび');
});

test('第75回 KIZUNA-4: 前の 形（ix）の コードも 読める', async () => {
  const { slimChar4, unslimChar4 } = await import('../public/js/shared/world/transfer.js');
  const c = { id: 'a', bestiary: { a: { seen: 1 }, b: { seen: 1 }, c: { seen: 1 }, d: { seen: 1 } }, kills: { a: 5, b: 5, c: 5, d: 2 }, companions: [] };
  const s = JSON.parse(JSON.stringify(slimChar4(c)));
  assert.deepEqual(s.kills.ixr, [[5, 3], 2]);
  const old = JSON.parse(JSON.stringify(s));
  old.kills = { ix: [5, 5, 5, 2], rest: s.kills.rest };
  assert.deepEqual(unslimChar4(old).kills, c.kills);
  assert.deepEqual(unslimChar4(s).kills, c.kills);
});
