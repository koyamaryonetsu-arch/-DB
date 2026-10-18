// 2026年10月（第35回 C）: 職業の タグと、タグで 決める 合体技（docs/idea-r35.md の J・L）
//  ・どの 職業にも タグ 2〜4こ（data/job-tags.js。jobs.js の JOBS[id].tags）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JOBS, ALL_JOBS } from '../public/js/shared/data/jobs.js';
import { TAGS, TAG_ORDER, JOB_TAGS, jobsWithTag, tagName } from '../public/js/shared/data/job-tags.js';
import { checkText } from '../tools/kanji-check.mjs';

test('タグ: どの 職業にも 2〜4こ・知っている タグだけ・同じ タグを 2回 つけない', () => {
  assert.deepEqual(Object.keys(JOB_TAGS).sort(), [...ALL_JOBS].sort(), 'JOB_TAGS と 職業の 一覧が 同じ（職業を ふやしたら タグも）');
  for (const j of ALL_JOBS) {
    const tags = JOBS[j].tags;
    assert.ok(Array.isArray(tags), `${JOBS[j].name}: JOBS[id].tags`);
    assert.ok(tags.length >= 2 && tags.length <= 4, `${JOBS[j].name}: ${tags.length}こ`);
    assert.equal(new Set(tags).size, tags.length, `${JOBS[j].name}: 同じ タグ`);
    for (const t of tags) assert.ok(TAGS[t], `${JOBS[j].name}: ${t}`);
  }
});

test('タグ: どの タグも 2つ いじょうの 職業に ある・名前と 意味は ゲームの 文字の きまりどおり', () => {
  assert.equal(TAG_ORDER.length, Object.keys(TAGS).length);
  for (const t of TAG_ORDER) {
    assert.ok(jobsWithTag(t).length >= 2, `${tagName(t)}: ${jobsWithTag(t).length}職業`);
    assert.ok(jobsWithTag(t).length <= Math.ceil(ALL_JOBS.length / 3), `${tagName(t)}: 広すぎる`);
    for (const s of [TAGS[t].name, TAGS[t].desc]) assert.deepEqual(checkText(s), [], s);
  }
  // 名前は かさならない
  const names = TAG_ORDER.map(tagName);
  assert.equal(new Set(names).size, names.length);
  // 例: 作品を またいで 同じ タグ
  for (const j of ['dragon_knight', 'doraemon', 'kaito_kid', 'harry']) assert.ok(JOBS[j].tags.includes('sky'), `${JOBS[j].name}は 空`);
  for (const j of ['sailor_moon', 'ss3', 'nika', 'spy']) assert.ok(JOBS[j].tags.includes('henshin'), `${JOBS[j].name}は 変身`);
});
