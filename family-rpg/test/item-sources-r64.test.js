// 第64回 ⑥a: 素材の 入手先（魔物・店・宝箱）と、さがす 魔物の しるし
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import '../public/js/shared/world/monsters.js';
import { itemSources, sourceText, monsterPlaces } from '../public/js/shared/item-sources.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { MAT_DROPS } from '../public/js/shared/data/loot.js';
import { symbolSnapshot } from '../public/js/shared/world/monsters.js';

test('第64回: 素材を 落とす 魔物と 出る 場所（弱い 魔物から）', () => {
  const list = itemSources('beast_fang');
  assert.ok(list.length >= 3);
  assert.ok(list.every((s) => s.kind !== 'monster' || MAT_DROPS[s.species]?.[0] === 'beast_fang' || Object.values(MONSTERS[s.species].drops || {}).some((d) => [].concat(d)[0] === 'beast_fang' || [].concat(d).includes('beast_fang'))));
  const lv = list.filter((s) => s.kind === 'monster').map((s) => MONSTERS[s.species].lv);
  assert.deepEqual(lv, [...lv].sort((a, b) => a - b), '弱い 順');
  const wolf = list.find((s) => s.species === 'wolf');
  assert.ok(wolf && wolf.places.length, 'はぐれウルフの 出る 場所');
  assert.match(sourceText(wolf), /^はぐれウルフが(よく|ときどき|たまに)落とす（/);
  // 図鑑で 見て いない 魔物は 名前を かくす（場所は 出す）
  const unseen = itemSources('beast_fang', () => false).find((s) => s.species === 'wolf');
  assert.equal(unseen.name, '？？？');
  assert.deepEqual(unseen.places, wolf.places);
  // ダンジョンだけの 魔物は ダンジョンの 名前（階は まとめる）
  const dung = list.find((s) => s.dungeon);
  if (dung) assert.ok(dung.places.every((n) => !n.includes('　')), dung.places.join());
});

test('第64回: 店で 売っている 物・出る 場所の ない 魔物', () => {
  const herb = itemSources('herb');
  assert.ok(herb.some((s) => s.kind === 'shop'));
  assert.match(sourceText(herb.find((s) => s.kind === 'shop')), /で売っている$/);
  assert.ok(monsterPlaces('pururin').length > 0);
  assert.deepEqual(monsterPlaces('nai_mon'), []);
});

test('第64回: フィールドの 魔物に 群れの 魔物（gs）・さがす 魔物は 赤く', () => {
  const ms = { symbols: new Map([['a', { id: 'a', sp: 'tsunousagi', group: ['tsunousagi', 'pururin', 'pururin'], x: 1, y: 2, dir: 'down' }], ['b', { id: 'b', sp: 'kobushi', group: ['kobushi'], x: 3, y: 4 }]]) };
  const out = symbolSnapshot(ms, false);
  assert.deepEqual(out.find((s) => s.id === 'a').gs, ['pururin']);
  assert.equal(out.find((s) => s.id === 'b').gs, undefined, '1しゅるいだけの 時は 送らない');
  const src = readFileSync(new URL('../public/js/client/field.js', import.meta.url), 'utf8');
  assert.match(src, /huntTint\(s, monsterCanvas/);
  const forge = readFileSync(new URL('../public/js/client/ui/forge.js', import.meta.url), 'utf8');
  assert.equal((forge.match(/sourcesFlow\(game, ct, lack\.mats\)/g) || []).length, 2, '作る・きたえる');
  const al = readFileSync(new URL('../public/js/client/ui/alchemy.js', import.meta.url), 'utf8');
  assert.match(al, /sourcesFlow\(game, ct, lack\)/);
});
