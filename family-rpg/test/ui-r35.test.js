// 第35回 A（画面と そうさ）: 家族が 決めた こと（docs/idea-r35.md の I・L・追加）
//   1. 戦いの 技えらびを 効果ごとの タブに（shared/skill-tabs.js・client/battle.js・ui/dom.js の 列の はしで タブ）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { SKILL_TABS, effectTab, skillTabs, startTab, abilityElements } from '../public/js/shared/skill-tabs.js';

const src = (p) => fs.readFileSync(new URL(`../public/${p}`, import.meta.url), 'utf8');
const ab = (id) => ABILITIES[id];

// ───────────── 1. 技の タブ ─────────────
test('技の タブ: 効果ごとに 分ける（1体・全体・回復・強くする・弱くする・そのほか）', () => {
  assert.equal(effectTab(ab('mera')), 'one');
  assert.equal(effectTab(ab('merazoma')), 'one');
  assert.equal(effectTab(ab('io')), 'all');
  assert.equal(effectTab(ab('bagi')), 'all', 'グループも 全体の タブ');
  assert.equal(effectTab(ab('daichi')), 'one');
  assert.equal(effectTab(ab('hoimi')), 'heal');
  assert.equal(effectTab(ab('behomara')), 'heal');
  assert.equal(effectTab(ab('zao')), 'heal', '生き返る も 回復');
  assert.equal(effectTab(ab('kiarii')), 'heal');
  assert.equal(effectTab(ab('sukuruto')), 'buff');
  assert.equal(effectTab(ab('baikiruto')), 'buff');
  assert.equal(effectTab(ab('chikaratame')), 'buff');
  assert.equal(effectTab(ab('kabau')), 'buff');
  assert.equal(effectTab(ab('rukani')), 'debuff');
  assert.equal(effectTab(ab('rariho')), 'debuff');
  assert.equal(effectTab(ab('id_wink')), 'debuff', '敵の 行動を おくらせる');
  assert.equal(effectTab(ab('ss_encore')), 'buff', '味方を はやく');
  assert.equal(effectTab(ab('rura')), 'other');
  assert.equal(effectTab(ab('ft_fate')), 'other', 'なにが 出るか わからない 技');
  // いくつも 効果が ある 技: ダメージが あれば こうげき
  assert.equal(effectTab(ab('hi_noritsukkomi')), 'one');
  assert.equal(effectTab(ab('hi_yami_sekai')), 'all');
  assert.equal(effectTab(ab('hi_okashi_no_ie')), 'heal');
  assert.equal(effectTab(ab('hr_kizuna')), 'buff');
  assert.equal(effectTab(ab('hi_yosan_cut')), 'debuff');
  // ぜんぶの 技が どこかの タブに 入る
  const ids = new Set(SKILL_TABS.map((t) => t.id));
  for (const [id, a] of Object.entries(ABILITIES)) assert.ok(ids.has(effectTab(a)), id);
});

test('技の タブ: 空の タブは 出さない・技の ならびは かえない・今の職業と お気に入り', () => {
  const ids = ['hoimi', 'mera', 'io', 'merami', 'sukuruto', 'zao', 'merazoma'];
  const tabs = skillTabs(ids, { abs: ab, job: 'mage', favs: ['zao', 'nothing_here', 'io'] });
  const by = Object.fromEntries(tabs.map((t) => [t.id, t.ids]));
  assert.deepEqual(tabs.map((t) => t.id), ['fav', 'job', 'one', 'all', 'heal', 'buff'], '弱くする・そのほかは 空なので 出ない');
  assert.deepEqual(by.fav, ['zao', 'io'], 'お気に入りは その ならび（覚えていない 技は 出ない）');
  assert.deepEqual(by.one, ['mera', 'merami', 'merazoma'], 'ならびは 今の じゅん。上の 技が あっても 下の 技も 出す');
  assert.deepEqual(by.heal, ['hoimi', 'zao']);
  assert.ok(by.job.includes('mera') && !by.job.includes('hoimi'), '今の職業の タブは その 職業の 技');
  assert.equal(tabs.find((t) => t.id === 'debuff'), undefined);
  // はじめの タブ: まえに 見た タブ → お気に入り → 今の職業
  assert.equal(startTab(tabs, 'heal'), 'heal');
  assert.equal(startTab(tabs, 'debuff'), 'fav', 'ない タブは お気に入りから');
  assert.equal(startTab(tabs.filter((t) => t.id !== 'fav'), null), 'job');
  assert.equal(startTab([], 'x'), null);
  // 名前（家族が 決めた タブ）
  assert.deepEqual(SKILL_TABS.map((t) => t.title), ['お気に入り', '今の職業', 'こうげき（1体）', 'こうげき（全体）', '回復', '強くする', '弱くする・状態異常', 'そのほか']);
});

test('弱点の しるし: 技の 属性（いくつも ある 技も）・物理は 入れない', () => {
  assert.deepEqual(abilityElements(ab('mera')), ['fire']);
  assert.deepEqual(abilityElements(ab('hi_yami_sekai')), ['dark']);
  assert.deepEqual(abilityElements(ab('daichi')), []);
  assert.deepEqual(abilityElements(ab('hoimi')), []);
  // 画面: わかっている 弱点（knownAffinity）だけ。ならびは かえない（sort を しない）
  const b = src('js/client/battle.js');
  const menu = b.slice(b.indexOf('  abilityMenu('), b.indexOf('  lastTab('));
  assert.match(menu, /knownAffinity\(e, elm\) === 'weak'/);
  assert.match(menu, /tag weak">弱点</);
  assert.doesNotMatch(menu, /\.sort\(/, '技を 勝手に ならびかえない');
  assert.match(menu, /this\.menu\.onSide = /, '十字キーの 左右で タブ');
});

test('十字キー: 2列・3列の リストでも 列の はしで 左右 → onSide（ui/dom.js）', () => {
  const d = src('js/client/ui/dom.js');
  assert.match(d, /atEdge\(d, cols = this\.cols\)/);
  assert.match(d, /this\.onSide && this\.atEdge\(a === 'left' \? -1 : 1, cols\)\) return this\.onSide/);
});

// ───────────── 2. 職業の 表示 ─────────────
test('職業の 表示: 戦いの まど・メニューの 札に 短い 職業名（男の子の セーラー系は jobShort）', () => {
  const b = src('js/client/battle.js');
  assert.match(b, /s\.jb\.textContent = a\.mon \|\| a\.kind === 'monster' \|\| !JOBS\[a\.job\] \? '' : jobShort\(a\.job, a\)/);
  const h = src('js/client/ui/hud.js');
  assert.match(h, /jobShort\(x\.job, x\)/);
  assert.match(h, /x && !x\.species/, 'モンスターは 出さない');
  const m = src('js/client/ui/menu.js');
  assert.match(m, /m\.jb \? el\('div', \{ class: 'jb', text: m\.jb \}\)/);
  // スマホの たてでは メニューの 札に 出さない（せまい）・たての 戦いの 5人の 上の 3人も
  const css = src('js/client/ui/r35-css.js');
  assert.match(css, /orientation: portrait\) \{ \.fm-mem > \.jb \{ display: none; \}/);
  assert.match(css, /data-n="5"\] \.b-mem:nth-child\(-n \+ 3\) \.jb \{ display: none; \}/);
});
