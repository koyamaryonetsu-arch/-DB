// 第65回: 神殿（転職）の 幻の職業の やりこみの 数が 0 の ままだった → 幻の書と 同じ 記録（feats）を 見る
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { condNow, PHANTOM_JOBS } from '../public/js/shared/data/phantom.js';

test('第65回: 神殿の 画面の 自分の キャラに feats を 入れる', () => {
  const src = readFileSync(new URL('../public/js/client/ui/services.js', import.meta.url), 'utf8');
  const line = src.split('\n').find((l) => l.includes("if (who === 'self') return { name: game.me.name, job: game.me.job"));
  assert.ok(line && line.includes('feats: game.me.feats'), line);
  // 記録が あれば 数える（なければ 0）
  const id = Object.keys(PHANTOM_JOBS)[0];
  const cond = PHANTOM_JOBS[id].conds[0];
  const feats = cond.use ? { use: { [cond.use[0]]: 12 } } : { [cond.stat]: 12 };
  assert.equal(condNow({ feats }, cond), 12);
  assert.equal(condNow({}, cond), 0);
});
