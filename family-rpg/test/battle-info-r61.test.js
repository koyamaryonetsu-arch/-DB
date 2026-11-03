// 第61回: スマホの たてむきの 戦い: 技の せつめいは 3行まで・もどるボタンは 小さく・技の 字は 大きく
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { battleSkillText, firstSentence } from '../public/js/client/ui/skillinfo.js';
import { newCharacter } from '../public/js/shared/stats.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';

test('第61回: 1文めだけ（かっこの 中の 。では 切らない）', () => {
  assert.equal(firstSentence('小さな火の玉をぶつける。敵が多いと強い。'), '小さな火の玉をぶつける。');
  assert.equal(firstSentence('「えい。」とたたく。もう1回。'), '「えい。」とたたく。');
  assert.equal(firstSentence('句点なし'), '句点なし');
  assert.equal(firstSentence(''), '');
});

test('第61回: compact の せつめいは 3行まで・「もう一度タップ」なし', () => {
  const c = newCharacter('t1', 'ユイ', 'mage');
  for (const id of Object.keys(ABILITIES).slice(0, 400)) {
    const t = battleSkillText(id, c, { touch: true, compact: true });
    if (!t) continue;
    const lines = t.split('\n');
    assert.ok(lines.length <= 3, `${id}: ${t}`);
    assert.ok(!t.includes('もう一度タップ'), id);
    assert.ok(!/属性の/.test(lines[0]), `${id}: ${lines[0]}`);
  }
  const mera = battleSkillText('mera', c, { touch: true, compact: true });
  assert.match(mera, /^【炎・ダメージの呪文】MP\d+・敵1体/);
  assert.ok(!/今の魔力で/.test(mera), mera);
  // ふつうの 画面は 今までどおり
  assert.match(battleSkillText('mera', c, { touch: true }), /もう一度タップで使う/);
});

test('第61回: たてむきの CSS: もどるは 小さく・技の 字は 大きく・せつめいは 低く', () => {
  const css = readFileSync(new URL('../public/css/style.css', import.meta.url), 'utf8');
  assert.match(css, /\.b-backbig \{ min-width: 26%; min-height: 32px;/);
  assert.match(css, /\.b-cmd \.menu \.item \{ min-height: 2\.45em; font-size: 1\.3em; \}/);
  assert.match(css, /\.b-info \{ flex: none; height: auto; max-height: 4\.9em;/);
  const src = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.match(src, /compactInfo\(\) \{/);
});
