// 第58回: マルチプレイの 自動追跡ボタン（リーダーで ない ときだけ 出る・おすと オン／オフ）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { followShown, followLabel } from '../public/js/client/ui/follow-btn.js';

test('第58回: 自動追跡ボタンは 家族と パーティーで リーダーで ない ときだけ', () => {
  const party = (leader) => ({ leader, members: [{ sid: 'a' }, { sid: 'b' }] });
  assert.equal(followShown({ state: 'field', sid: 'b', party: party('a') }), true, 'リーダーで ない');
  assert.equal(followShown({ state: 'field', sid: 'a', party: party('a') }), false, 'リーダーは 出ない');
  assert.equal(followShown({ state: 'field', sid: 'a', party: null }), false, 'ひとりは 出ない');
  assert.equal(followShown({ state: 'field', sid: 'a', party: { leader: 'a', members: [{ sid: 'a' }] } }), false, '1人の パーティーは 出ない');
  assert.equal(followShown({ state: 'battle', sid: 'b', party: party('a') }), false, '戦いの 中は 出ない');
  assert.equal(followLabel(true), '自動追跡：オン');
  assert.equal(followLabel(false), '自動追跡：オフ');
  const game = readFileSync(new URL('../public/js/client/game.js', import.meta.url), 'utf8');
  assert.match(game, /new FollowButton\(this\)/);
  assert.match(game, /this\.followBtn\.update\(\)/);
});
