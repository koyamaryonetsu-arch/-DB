// 第71回: 技の メニューの 見なおし その2（家族の ねがい。docs/plan-r69-skill-menu.md の 第71回）
//   A. お気に入りの ならびかえで 技の 効果を 見せる（skillCardInfo）
//   B. お気に入りの オンオフを コマンドで おした ときにも（フィールドの 回復・回復以外の 小さな まど・戦いの ☆と「Y：お気に入り」）
//   C. 「オートで使う技」（autoOff）と「命令で出す技」（cmdOff）を 分けた。前の autoOff は cmdOff に うつす
//   D. メニューの 合体技の 名前は ふつうの 技と おなじ 大きさ
//   E. 覚えた技: 2列の わく・種類で見る／職業で見る・L・R で タブ・Y で 見方。えらんだ あとも カーソルは おなじ 技
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { JOB_MAX_LEVEL } from '../public/js/shared/data/jobs.js';
import { cmdOffList, migrateCmdOff, migrateCmdOffAll, fixCmdOff, sameNameOff, toggleOffList } from '../public/js/shared/cmd-off.js';
import { learnedKindTabs, learnedJobTabs, pickLearnTab, nextLearnTab, LEARN_VIEWS } from '../public/js/shared/skill-view.js';
import { favSection, sortByStdPower } from '../public/js/shared/skill-sort.js';
import { Battle, allyFromCharacter, pub } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { recruitNpc } from '../public/js/shared/world/party.js';
import { newCharacter, gainExp, expForLevel, learnedAbilities } from '../public/js/shared/stats.js';
import { abilityFor } from '../public/js/shared/ability-label.js';
import { skillCardInfo, skillPowerLine, favKeyHint } from '../public/js/client/ui/skillinfo.js';
import { Bot } from './helpers.js';

const src = (p) => fs.readFileSync(new URL(`../public/${p}`, import.meta.url), 'utf8');
const lastMenu = (bot) => bot.msgs.filter((m) => m.t === 'menuRes').pop();

async function hero(job = 'priest', level = 30) {
  const world = new GameWorld({ offline: true, rng: makeRng(71), rateLimit: false });
  const bot = new Bot(world, 'ナナ');
  await bot.login();
  await bot.createAndPlay(job);
  await bot.settle();
  gainExp(bot.s.char, expForLevel(level) - bot.s.char.exp);
  return { world, bot, s: bot.s, c: bot.s.char };
}

// ───────────── C. autoOff と cmdOff ─────────────
test('cmdOff: まだ ない 人は autoOff を そのまま（第69回の 決めた こと）。うつすのは 1回だけ', () => {
  assert.deepEqual(cmdOffList({ autoOff: ['mera'] }), ['mera']);
  assert.deepEqual(cmdOffList({ autoOff: ['mera'], cmdOff: [] }), [], '空の cmdOff は「全部出す」');
  assert.deepEqual(cmdOffList({}), []);
  const c = { autoOff: ['mera', 'hyado'] };
  assert.equal(migrateCmdOff(c), true);
  assert.deepEqual(c.cmdOff, ['mera', 'hyado']);
  assert.deepEqual(c.autoOff, ['mera', 'hyado'], 'autoOff は その まま');
  c.cmdOff = [];
  assert.equal(migrateCmdOff(c), false, '2回めは うつさない');
  assert.deepEqual(c.cmdOff, []);
  const none = {};
  assert.equal(migrateCmdOff(none), false);
  assert.ok(!('cmdOff' in none), 'autoOff の ない 人には 何も 足さない');
  // 仲間・あずかり所も
  const me = { autoOff: ['io'], companions: [{ key: 'a', char: { autoOff: ['gira'] } }, { key: 'b', char: {} }], storage: [{ key: 'm1', char: { autoOff: ['mera'] } }] };
  migrateCmdOffAll(me);
  assert.deepEqual(me.cmdOff, ['io']);
  assert.deepEqual(me.companions[0].char.cmdOff, ['gira']);
  assert.equal(me.companions[1].char.cmdOff, undefined);
  assert.deepEqual(me.storage[0].char.cmdOff, ['mera']);
  // autoOff を かえる 前: かならず 配列（空でも）
  assert.deepEqual(fixCmdOff({}).cmdOff, []);
  assert.deepEqual(fixCmdOff({ autoOff: ['mera'] }).cmdOff, ['mera']);
});

test('cmdOff: 切りかえ（同じ 名前の 技も いっしょ・覚えていない 技は だめ）', () => {
  const learned = ['hp_zaoriku', 'dz_zaoriku', 'hoimi'];
  assert.equal(ABILITIES.hp_zaoriku.name, ABILITIES.dz_zaoriku.name);
  assert.deepEqual(toggleOffList([], learned, 'off', 'hp_zaoriku').sort(), ['dz_zaoriku', 'hp_zaoriku']);
  assert.deepEqual(toggleOffList(['dz_zaoriku', 'hp_zaoriku', 'hoimi'], learned, 'on', 'dz_zaoriku'), ['hoimi']);
  assert.deepEqual(toggleOffList(['hoimi'], learned, 'all'), []);
  assert.equal(toggleOffList([], learned, 'off', 'mera'), null, '覚えていない');
  assert.equal(toggleOffList([], learned, 'off', 'nothing_x'), null);
  assert.equal(toggleOffList([], learned, 'flip', 'hoimi'), null);
  assert.deepEqual(sameNameOff(['hp_zaoriku'], learned).sort(), ['dz_zaoriku', 'hp_zaoriku']);
});

test('サーバーの cmdSkill: on・off・all。autoOff とは 別。主人公も 仲間も。パーティーの 情報にも のる', async () => {
  const { world, bot, s, c } = await hero('mage', 20);
  c.jobs.mage = { lv: 6, b: 999 };
  assert.ok(learnedAbilities(c).includes('mera') && learnedAbilities(c).includes('hyado'));
  bot.send({ t: 'menu', action: 'cmdSkill', key: 'self', id: 'mera', op: 'off' });
  assert.equal(lastMenu(bot).ok, true);
  assert.deepEqual(c.cmdOff, ['mera']);
  assert.equal(c.autoOff, undefined, 'オートの ほうは かわらない');
  bot.send({ t: 'menu', action: 'autoSkill', key: 'self', id: 'hyado', op: 'off' });
  assert.deepEqual(c.autoOff, ['hyado']);
  assert.deepEqual(c.cmdOff, ['mera'], '命令の ほうは かわらない');
  bot.send({ t: 'menu', action: 'cmdSkill', key: 'self', id: 'not_a_skill', op: 'off' });
  assert.equal(lastMenu(bot).ok, false);
  bot.send({ t: 'menu', action: 'cmdSkill', key: 'self', id: 'mera', op: 'on' });
  assert.deepEqual(c.cmdOff, [], '空でも 配列で のこす（うつしかえ ずみ）');
  bot.send({ t: 'menu', action: 'cmdSkill', key: 'self', id: 'hyado', op: 'off' });
  bot.send({ t: 'menu', action: 'cmdSkill', key: 'self', op: 'all' });
  assert.equal(lastMenu(bot).ok, true);
  assert.match(lastMenu(bot).text, /命令の一覧に出す/);
  assert.deepEqual(c.cmdOff, []);
  // 仲間
  recruitNpc(world, s, 'npc_mina', { force: true });
  await bot.settle();
  const mina = c.companions.find((e) => e.key === 'npc_mina').char;
  const id = learnedAbilities(mina).find((x) => !ABILITIES[x].fieldOnly);
  bot.send({ t: 'menu', action: 'cmdSkill', key: 'npc_mina', id, op: 'off' });
  assert.equal(lastMenu(bot).ok, true);
  assert.deepEqual(mina.cmdOff, [id]);
  assert.equal(mina.autoOff, undefined);
  bot.send({ t: 'menu', action: 'autoSkill', key: 'npc_mina', op: 'all' });
  const info = (bot.party?.supports || []).find((x) => x.key === 'npc_mina');
  assert.deepEqual(info?.cmdOff, [id], 'クライアントに とどく');
  assert.deepEqual(allyFromCharacter(mina).cmdOff, [id]);
});

test('うつしかえ: 第69回の セーブ（autoOff だけ）は ロードで cmdOff にも 入る（autoOff も のこる）', async () => {
  const { world, bot, c } = await hero('mage', 12);
  c.autoOff = ['mera'];
  delete c.cmdOff;
  // もう一度 遊ぶ（ロード。world.js の normalizeChar）
  const bot2 = new Bot(world, 'ナナ2');
  await bot2.login();
  bot2.send({ t: 'play', id: c.id });
  await bot2.settle();
  assert.deepEqual(c.cmdOff, ['mera']);
  assert.deepEqual(c.autoOff, ['mera']);
  // あとから「オートで使う」に もどしても、命令の 一覧からは 消えた まま
  bot2.send({ t: 'menu', action: 'autoSkill', key: 'self', id: 'mera', op: 'on' });
  assert.equal(c.autoOff, undefined);
  assert.deepEqual(c.cmdOff, ['mera']);
  assert.ok(bot);
});

test('戦い: 命令の 一覧は cmdOff で のぞく（autoOff だけの 技は 出る）。AIは autoOff だけ 見る', () => {
  const c = newCharacter({ id: 'p', name: 'テスト', look: {}, job: 'priest' });
  gainExp(c, expForLevel(30) - c.exp);
  c.jobs.priest = { lv: JOB_MAX_LEVEL, b: 999 };
  const heals = learnedAbilities(c).filter((id) => ABILITIES[id]?.effect?.type === 'heal');
  assert.ok(heals.length >= 1);
  // 回復は 命令の 一覧から かくす だけ（オートでは 使う）
  c.cmdOff = heals.slice();
  c.autoOff = [];
  const mk = (i) => {
    const b = new Battle({ rng: makeRng(i), allies: [{ char: c, auto: true }, { char: { ...c, name: 'けが人' }, auto: true, kind: 'support' }], enemies: ['pururin'], canFlee: false });
    b.allies[1].hp = 1;
    return b;
  };
  const b0 = mk(1);
  assert.deepEqual([...pub(b0.allies[0]).cmdOff].sort(), [...heals].sort(), 'クライアントに とどく');
  assert.equal(pub(b0.allies[0]).autoOff, undefined);
  let used = false;
  for (let i = 0; i < 20 && !used; i++) {
    const b = mk(i);
    const cmd = decideAlly(b, b.allies[0]);
    if (cmd.type === 'ability' && heals.includes(cmd.id)) used = true;
  }
  assert.ok(used, 'オートでは 回復を 使う（cmdOff は AIに きかない）');
  // autoOff に すると AIは 使わない・命令の 一覧には 出る
  c.cmdOff = [];
  c.autoOff = heals.slice();
  for (let i = 0; i < 20; i++) {
    const b = mk(i);
    assert.equal(pub(b.allies[0]).cmdOff, undefined);
    const cmd = decideAlly(b, b.allies[0]);
    assert.ok(!(cmd.type === 'ability' && heals.includes(cmd.id)), JSON.stringify(cmd));
  }
  // 画面: openCommand は cmdOff だけ
  const bs = src('js/client/battle.js');
  const open = bs.slice(bs.indexOf('  openCommand() {'), bs.indexOf('  showMenu('));
  assert.match(open, /const off = new Set\(a\.cmdOff \|\| \[\]\);/);
  assert.doesNotMatch(open.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n'), /autoOff/, 'コードは autoOff を 見ない');
});

test('作戦: 「オートで使う技を選ぶ」と「命令で出す技を選ぶ」の 2つ。せつめいも 2つ', () => {
  const m = src('js/client/ui/menu.js');
  const tac = m.slice(m.indexOf('  tacticsView(active) {'), m.indexOf('  autoSkillsView(key) {'));
  const a = tac.indexOf("label: 'オートで使う技を選ぶ'"), b = tac.indexOf("label: '命令で出す技を選ぶ'");
  assert.ok(a > 0 && b > a, 'オート → 命令 の じゅん');
  assert.match(tac, /this\.cmdSkillsView\(v\.key\)/);
  assert.match(tac, /オートや作戦で戦う時に、使わない技を決める/);
  assert.match(tac, /自分で命令する時（主人公・「めいれいさせろ」の仲間）に、技の一覧に出さない技を決める/);
  const view = m.slice(m.indexOf('  skillOffView(key, kind'), m.indexOf('  // ───── クエスト ─────'));
  for (const w of ["yes: '出す', no: '出さない', all: '全部出す', action: 'cmdSkill', field: 'cmdOff'", "yes: '使う', no: '使わない', all: '全部使う', action: 'autoSkill', field: 'autoOff'"]) assert.ok(view.includes(w), w);
});

// ───────────── B・C. 呪文・技の メニューの 小さな まど ─────────────
test('呪文・技の メニュー: えらぶと「使う」→ お気に入り → 命令の一覧に出さない／出す → やめる（回復・回復以外・覚えた技・お気に入り）', () => {
  const m = src('js/client/ui/menu.js');
  const ask = m.slice(m.indexOf('  skillAsk(c, id'), m.indexOf('  doSkillAct('));
  const order = ["value: 'use'", 'items.push(...pre)', "value: fav ? 'remove' : 'add'", "value: 'cmd'", "label: 'やめる'"].map((w) => ask.indexOf(w));
  assert.ok(order.every((x, i) => x > 0 && (i === 0 || x > order[i - 1])), `じゅん ${order}`);
  assert.match(ask, /label: `使う（\$\{use\.why\}）`, value: 'use', disabled: true/, '使えない ときは うすく・わけ');
  assert.match(ask, /hidden \? '命令の一覧に出す' : '命令の一覧に出さない'/);
  const sk = m.slice(m.indexOf('  skillsView(active, who'), m.indexOf('  sendFavOrder('));
  // 回復・回復以外: 使えない 技も えらべる（disabled に しない）・いちばん 上は 使う
  const now = sk.slice(sk.indexOf("if (mode === 'heal' || mode === 'other') {"), sk.indexOf("if (mode === 'combo') {"));
  assert.doesNotMatch(now, /disabled: !x\.ok/);
  assert.match(now, /this\.skillAsk\(c, it\.value, \{ use: \{ ok: !!x\?\.ok/);
  // お気に入り: 動かす が 先
  const fav = sk.slice(sk.indexOf("if (mode === 'fav') {"), sk.indexOf("if (mode === 'dual') {"));
  assert.match(fav, /this\.skillAsk\(c, it\.value, \{ pre: \[\{ label: '動かす', value: 'move' \}\] \}\)/);
  // 覚えた技
  assert.match(sk, /this\.skillAsk\(c, it\.value, \{ use: a\.field && !locked \? \{ ok: true \} : null \}\)/);
  // かくす しるし
  assert.match(sk, /<span class="tag cmdhide">かくす<\/span>/);
  // 命令の 一覧の 切りかえは サーバーの cmdSkill
  assert.match(m, /action: 'cmdSkill', key, id, op: hide \? 'off' : 'on'/);
});

test('戦い: ☆お気に入りの 下に「Y：お気に入り」「長おし：お気に入り」。せつめいは ★の とき「はずす」', () => {
  assert.equal(favKeyHint(false, false), 'Y：お気に入り');
  assert.equal(favKeyHint(true, false), '長おし：お気に入り');
  assert.equal(favKeyHint(true, true), '長おし：はずす');
  const b = src('js/client/battle.js');
  assert.match(b, /el\('div', \{ class: 'favkey', text: favKeyHint\(this\.touchUi\(\), on\) \}\)/);
  assert.match(b, /tapConfirm/, 'タップ 1回め せつめい・2回め 使う は その まま');
  assert.match(src('js/client/ui/r69-css.js'), /\.b-info \.favwrap \{ float: right;/);
});

// ───────────── A. お気に入りの せつめい ─────────────
test('お気に入りの ならびかえ: えらんでいる 技（つかんでいる 技）の 種類・MP・相手・威力・せつめい', () => {
  const c = newCharacter({ id: 'p', name: 'テスト', look: {}, job: 'mage' });
  gainExp(c, expForLevel(20) - c.exp);
  const x = skillCardInfo('mera', c);
  assert.match(x.head, /^【.*炎.*】MP\d+・/);
  assert.equal(x.pow, skillPowerLine('mera', c));
  assert.equal(x.desc, abilityFor('mera', c).desc);
  assert.equal(skillCardInfo('nothing_x', c), null);
  const m = src('js/client/ui/menu.js');
  const fav = m.slice(m.indexOf("    if (mode === 'fav') {"), m.indexOf("    if (mode === 'dual') {"));
  assert.match(fav, /showInfo\(grab \? grab\.ids\[grab\.pos\] : m\.current\?\.value\)/);
  assert.match(fav, /onMove: \(it\) => showInfo\(it\?\.value\)/);
  // 見出しの せつめいの まどは 2行まで（つかんでいる 間は 1行。スマホの ▲▼◀▶ が 入るように）
  const css = src('js/client/ui/r69-css.js');
  assert.match(css, /\.fav-info \.fi-d \{[^}]*-webkit-line-clamp: 2/);
  assert.match(css, /\.fav-grabbing \.fav-info \.fi-d \{ -webkit-line-clamp: 1; \}/);
});

// ───────────── D. 合体技 ─────────────
test('メニューの 合体技: 名前は ふつうの 技の 行と おなじ 大きさ（戦いの コマンドは 大きい まま）', () => {
  const fx = src('js/client/render/dualfx.js');
  assert.match(fx, /\.menu \.item\.sk-row\.dual-row \.dual-nm \{ flex-basis: 100%; color: inherit; \}/);
  assert.doesNotMatch(fx, /\.menu \.item\.sk-row\.dual-row[^{]*\{[^}]*font-size/);
  assert.match(fx, /\.b-cmd \.menu \.item\.k-dualopt \.dual-nm \{ font-size: 1\.3em/);
});

// ───────────── E. 覚えた技の 見方 ─────────────
test('覚えた技（種類で見る）: 呪文 → 特技、中は 戦いと おなじ 種類（★なし・空は 出さない）・弱い じゅん', () => {
  const c = newCharacter({ id: 'p', name: 'テスト', look: {}, job: 'mage' });
  gainExp(c, expForLevel(40) - c.exp);
  c.jobs.mage = { lv: JOB_MAX_LEVEL, b: 999 };
  c.jobs.priest = { lv: JOB_MAX_LEVEL, b: 999 };
  c.jobs.warrior = { lv: JOB_MAX_LEVEL, b: 999 };
  const ids = learnedAbilities(c);
  const abs = (id) => abilityFor(id, c);
  const tabs = learnedKindTabs(ids, { abs, job: c.job });
  assert.ok(tabs.length > 3);
  assert.ok(!tabs.some((t) => t.id === 'fav'));
  const firstSkill = tabs.findIndex((t) => t.sec === 'skill');
  assert.ok(firstSkill > 0 && tabs.slice(firstSkill).every((t) => t.sec === 'skill'), '呪文の タブが 先');
  for (const t of tabs) {
    assert.ok(t.ids.length, t.key);
    assert.equal(t.key, `${t.sec}:${t.id}`);
    assert.deepEqual(t.ids, sortByStdPower(t.ids), `${t.key} は 弱い じゅん`);
    for (const id of t.ids) assert.equal(favSection(abs(id)) || 'skill', t.sec);
  }
  // ぜんぶの 技が どこかに（今の職業の タブは かさなっても よい）
  const all = new Set(tabs.filter((t) => t.id !== 'job').flatMap((t) => t.ids));
  assert.deepEqual([...all].sort(), [...ids].sort());
  // 前の タブ・ない ときは おなじ 呪文・特技の 1つめ・L・R は まわる
  assert.equal(pickLearnTab(tabs, tabs[2].key), tabs[2]);
  assert.equal(pickLearnTab(tabs, 'skill:nothing'), tabs[firstSkill]);
  assert.equal(pickLearnTab(tabs, null), tabs[0]);
  assert.equal(nextLearnTab(tabs, tabs[0].key, -1), tabs[tabs.length - 1]);
  assert.equal(nextLearnTab(tabs, tabs[0].key, 1), tabs[1]);
  assert.deepEqual(Object.values(LEARN_VIEWS), ['種類で見る', '職業で見る']);
});

test('覚えた技（職業で見る）: 今の 職業が 先・あとは 職業の じゅん・ひらめきは「そのほか」。1つの 技は 1つの タブ', () => {
  const c = newCharacter({ id: 'p', name: 'テスト', look: {}, job: 'warrior' });
  gainExp(c, expForLevel(40) - c.exp);
  c.jobs.mage = { lv: JOB_MAX_LEVEL, b: 999 };
  c.jobs.priest = { lv: JOB_MAX_LEVEL, b: 999 };
  c.jobs.warrior = { lv: JOB_MAX_LEVEL, b: 999 };
  const hira = Object.keys(ABILITIES).find((id) => ABILITIES[id].hirameki && !learnedAbilities(c).includes(id));
  c.hirameki = [hira];
  const ids = learnedAbilities(c);
  const tabs = learnedJobTabs(c, ids);
  assert.equal(tabs[0].id, 'warrior', '今の 職業が 先');
  assert.equal(tabs[tabs.length - 1].id, 'other');
  assert.ok(tabs[tabs.length - 1].ids.includes(hira));
  assert.ok(tabs.some((t) => t.id === 'mage') && tabs.some((t) => t.id === 'priest'));
  const flat = tabs.flatMap((t) => t.ids);
  assert.equal(flat.length, new Set(flat).size, 'かさならない');
  assert.deepEqual([...flat].sort(), [...ids].sort());
  for (const t of tabs) assert.deepEqual(t.ids, sortByStdPower(t.ids));
  // 魔物は「そのほか」だけ
  const mon = learnedJobTabs({ species: 'slime' }, ['mera']);
  assert.deepEqual(mon.map((t) => t.id), ['other']);
});

test('覚えた技（画面）: 2列の わく・L・R で タブ・Y で 見方・えらんだ あとも カーソルは おなじ 技（つくりなおしは reSkills）', () => {
  const m = src('js/client/ui/menu.js');
  const sk = m.slice(m.indexOf('  skillsView(active, who'), m.indexOf('  sendFavOrder('));
  assert.match(sk, /m\.root\.classList\.add\('fav-grid', 'learn-grid'\)/);
  assert.match(sk, /onLR: \(d\) => goTab\(nextLearnTab\(tabs, cur\.key, d\)\)/);
  assert.match(sk, /onY: \(\) => setView\(view === 'job' \? 'kind' : 'job'\)/);
  assert.match(sk, /localStorage|learnPref\(\)/);
  // カーソル: おぼえた 技から はじめる
  assert.match(sk, /this\.skFocus = \{ who, mode, id: it\.value \}/);
  assert.match(sk, /f\.who === who && f\.mode === mode \? items\.findIndex/);
  // お気に入り・命令の 一覧・使う の あとの つくりなおしは reSkills（いちばん 上に もどらない）
  assert.doesNotMatch(sk, /setTimeout\(\(\) => \{ if \(this\.root\) this\.focusSub\(this\.skillsView\(true, who\)\); \}/);
  const re = m.slice(m.indexOf('  reSkills(who, delay = 0) {'), m.indexOf('  learnPref() {'));
  assert.match(re, /this\.main\.scrollTop = top;/);
  assert.match(re, /this\.sub\?\.scrollToSel\(\);/);
  const lp = m.slice(m.indexOf('  learnPref() {'), m.indexOf('  sendFavOrder('));
  assert.match(lp, /try \{/);
  assert.match(lp, /kizuna_learnview/);
});
