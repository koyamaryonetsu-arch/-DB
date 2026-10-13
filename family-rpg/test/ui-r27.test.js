// 第27回 B: 戦いと メニューの 画面（家族の ねがい）
//   1. メニューの 道具の せつめい（ui/skillinfo.js の menuItemText。戦いの 道具と おなじ 文）
//   2. 戦いの せつめいの まど（.b-info）は メッセージの まど（.b-msg）と 別
//   3. 技の 長おし（Y）で お気に入りに 入れる／はずす（サーバーの お気に入りと 戦いの 人の お気に入り）
//   4. 転職の せりふを みじかく（data/job-talk.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { JOBS } from '../public/js/shared/data/jobs.js';
import { SCRIPTS } from '../public/js/shared/data/story.js';
import { JOB_GREET, jobAskText, jobDoneText } from '../public/js/shared/data/job-talk.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { startFieldBattle } from '../public/js/shared/world/battles.js';
import { expForLevel, gainExp, computeStats } from '../public/js/shared/stats.js';
import { battleItemText, battleSkillText, menuItemText, itemWhereText, favHint } from '../public/js/client/ui/skillinfo.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';
import { Bot, tickN } from './helpers.js';

const src = (p) => fs.readFileSync(new URL(`../public/${p}`, import.meta.url), 'utf8');
const lastMenu = (bot) => bot.msgs.filter((m) => m.t === 'menuRes').pop();
const lastSvc = (bot) => bot.msgs.filter((m) => m.t === 'svcRes').pop();

async function solo(seed = 27) {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, 'ナナ');
  await bot.login();
  await bot.createAndPlay('mage');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  gainExp(c, expForLevel(12) - c.exp);
  c.hp = computeStats(c).maxHp;
  Object.assign(bot.s, { map: 'overworld', x: PLACES.village.x + 40, y: PLACES.village.y + 12 });
  return { world, bot, c };
}

// ───────────── 1. メニューの 道具の せつめい ─────────────
test('メニューの 道具: 戦いの 道具と おなじ 文（だれに・効果・せつめい）＋ 使える所', () => {
  const herb = menuItemText('herb');
  // 戦いの せつめいの 行が そのまま 入る
  for (const ln of battleItemText('herb').split('\n')) assert.ok(herb.includes(ln), ln);
  assert.match(herb, /^【道具】味方1人/);
  assert.match(herb, /HPを約30〜40回復/);
  assert.match(herb, /使える所：戦い・フィールド/);
  assert.match(menuItemText('magic_water'), /MPを約20〜28回復/);
  assert.match(menuItemText('revive_flower'), /死んだ味方1人/);
  assert.match(menuItemText('revive_flower'), /生き返らせる/);
  assert.match(menuItemText('antidote'), /毒/);
  // 種（フィールドだけ。ずっと 上がる）
  assert.match(menuItemText('seed_str'), /力が1〜2上がる（ずっと）/);
  assert.match(menuItemText('seed_str'), /フィールドだけ（戦いでは使えない）/);
  assert.match(menuItemText('smoke_ball'), /使える所：戦いだけ/);
  assert.match(menuItemText('return_wing'), /フィールドだけ/);
  // スマホ: もう一度 タップで「使う」など（装備は「装備する」）
  assert.match(menuItemText('herb', { touch: true }), /▶もう一度タップで「使う」など$/);
  assert.match(menuItemText('wood_sword', { touch: true }), /「装備する」など$/);
  assert.doesNotMatch(menuItemText('herb'), /タップ/);
  // 装備は 今までの せつめい（強さ・装備できる 人）
  assert.match(menuItemText('wood_sword'), /攻撃\+6/);
  assert.match(menuItemText('wood_sword'), /装備:/);
  // 使う 道具は どれも 使える所 と せつめいが 出る（こわれない）
  for (const [id, it] of Object.entries(ITEMS)) {
    const t = menuItemText(id, { touch: true });
    assert.ok(t.length > 4, id);
    if (it.type === 'use' && it.effect && (it.battle || it.field)) assert.ok(t.includes(itemWhereText(it)) && itemWhereText(it), id);
  }
  assert.equal(menuItemText('no_such_item'), '');
});

test('メニューの 道具: スマホは タップで せつめい → もう一度で 決まる（技の タブも おなじ）。せつめいは 一覧の 下に いつも 見える', () => {
  const menu = src('js/client/ui/menu.js');
  const items = menu.slice(menu.indexOf('  itemsList('), menu.indexOf('  async itemAction('));
  assert.match(items, /tapConfirm: touch/);
  assert.match(items, /menuItemText\(it\.value/);
  assert.match(items, /class: 'items-view'/);
  const skills = menu.slice(menu.indexOf('  skillsView('), menu.indexOf('  sendFav('));
  assert.equal((skills.match(/tapConfirm: touch/g) || []).length, 2, '覚えた技・今使える');
  const css = src('css/style.css');
  assert.match(css, /\.items-view > \.menu \{[^}]*overflow-y: auto/);
  assert.match(css, /\.items-view > \.item-detail \{[^}]*flex: none/);
});

// ───────────── 2. 戦いの せつめいの まど ─────────────
test('戦いの せつめい: メッセージとは 別の まど（.b-info）。メッセージ（say）は せつめいを 消さない', () => {
  const bsrc = src('js/client/battle.js');
  assert.match(bsrc, /this\.infoEl = el\('div', \{ class: 'win b-info' \}\)/);
  assert.match(bsrc, /el\('div', \{ class: 'b-bottom' \}, this\.cmdEl, this\.infoEl, this\.msgEl\)/);
  const info = bsrc.slice(bsrc.indexOf('  info(text) {'), bsrc.indexOf('  clearInfo() {'));
  assert.match(info, /this\.infoEl/);
  assert.doesNotMatch(info, /msgEl/, 'せつめいは メッセージの まどを さわらない');
  const say = bsrc.slice(bsrc.indexOf('  say(lines, dur'), bsrc.indexOf('  skipMsg()'));
  assert.doesNotMatch(say, /infoEl/, 'メッセージは せつめいの まどを さわらない');
  // コマンドを 出しなおす・待つ ときに とじる
  assert.match(bsrc.slice(bsrc.indexOf('  renderCmdIdle('), bsrc.indexOf('  closeMenus()')), /this\.clearInfo\(\)/);
  assert.match(bsrc.slice(bsrc.indexOf('  openCommand() {'), bsrc.indexOf('  openCommand() {') + 400), /this\.clearInfo\(\)/);
  const css = src('css/style.css');
  assert.match(css, /#battle\.has-info \.b-info \{ display: block; \}/);
  // よこむき: 左の れつに え・せつめい・メッセージ
  assert.match(css, /"stage status" "stage bond" "stage cmd" "info cmd" "msg cmd"/);
  assert.doesNotMatch(css, /\.b-msg\.info/, '前の（メッセージに 重ねる）書き方は のこさない');
});

// ───────────── 3. 長おしで お気に入り ─────────────
test('長おしの お気に入り: ListMenu の onLong（0.5秒・はなした クリックは すてる・Y）と 戦いの 一覧', () => {
  const dom = src('js/client/ui/dom.js');
  assert.match(dom, /ListMenu\.LONG_MS = 500;/);
  assert.match(dom, /case 'y': this\.fireLong\(\); break;/);
  assert.match(dom, /addEventListener\('click', swallow, \{ capture: true, once: true \}\)/);
  const input = src('js/client/input.js');
  assert.match(input, /KeyY: 'y'/);
  assert.match(input, /yKey \? 'y' : 'b'/);
  const bsrc = src('js/client/battle.js');
  assert.match(bsrc, /this\.menu\.onLong = \(it\) =>/);
  assert.match(bsrc, /favPopup\(a, id, toggle\)/);
  assert.match(bsrc, /'★お気に入りに入れる'/);
  assert.match(bsrc, /'☆お気に入りからはずす'/);
  // せつめいの ひとこと
  const t = battleSkillText('mera', { job: 'mage', jobs: { mage: { lv: 1 } } }, { touch: true });
  assert.match(favHint(t, true), /▶もう一度タップで使う・長おしでお気に入り$/);
  assert.match(favHint(battleSkillText('mera', null), false), /（長おし・Yキーでお気に入り）$/);
});

test('長おしの お気に入り: 戦いの 中でも サーバーの お気に入りに 入る・はずれる（戦いの 人の お気に入りも 同じ）', async () => {
  const { world, bot, c } = await solo();
  const ctx = startFieldBattle(world, bot.s, { id: 'r27', sp: 'pururin', group: ['pururin'], zone: 'outskirts', table: 'outskirts', busy: false });
  assert.ok(ctx && bot.s.busy, '戦いの 中');
  for (const e of ctx.battle.enemies) { e.hp = e.maxHp = 9999; e.actions = [{ w: 1, id: 'm_nothing' }]; }
  const me = ctx.battle.combatants.find((x) => x.side === 'ally' && x.charId === c.id);
  assert.ok(me);
  bot.send({ t: 'menu', action: 'favorite', who: 'self', id: 'mera', op: 'add' });
  assert.equal(lastMenu(bot).ok, true);
  assert.match(lastMenu(bot).text, /メラをお気に入りに入れた/);
  assert.deepEqual(c.favorites, ['mera']);
  assert.deepEqual(me.favs, ['mera'], '戦いの 人の お気に入りも（つぎの 知らせで 消えない）');
  bot.send({ t: 'menu', action: 'favorite', who: 'self', id: 'hyado', op: 'add' });
  assert.deepEqual(me.favs, ['mera', 'hyado']);
  bot.send({ t: 'menu', action: 'favorite', who: 'self', id: 'mera', op: 'remove' });
  assert.match(lastMenu(bot).text, /はずした/);
  assert.deepEqual(c.favorites, ['hyado']);
  assert.deepEqual(me.favs, ['hyado']);
  // 知らない 技は だめ
  bot.send({ t: 'menu', action: 'favorite', who: 'self', id: 'no_such', op: 'add' });
  assert.equal(lastMenu(bot).ok, false);
  await tickN(world, 2);
  for (const e of ctx.battle.enemies) { e.hp = 0; e.alive = false; }
  ctx.battle.checkEnd();
  for (let i = 0; i < 300 && world.battles.size; i++) await tickN(world, 1);
  assert.deepEqual(world.data.characters[c.id].favorites, ['hyado'], '戦いの あとも のこる');
});

// ───────────── 4. 転職の せりふ ─────────────
test('転職の せりふ: 神官の あいさつは 1回（2行）・かくにんは 1行・転職の あとは 1〜2行', () => {
  const steps = SCRIPTS.job_change({ c: { flags: {} }, flag: () => false });
  const says = steps.filter((s) => s[0] === 'say');
  assert.equal(says.length, 1, 'せりふは 1回だけ');
  assert.equal(says[0][2], JOB_GREET);
  assert.match(JOB_GREET, /転職しますか？/);
  assert.ok(JOB_GREET.split('\n').length <= 2 && JOB_GREET.length <= 30);
  assert.deepEqual(steps[steps.length - 1], ['jobChange']);
  assert.equal(jobAskText('戦士'), '戦士に転職しますか？');
  assert.equal(jobAskText('戦士', 'リナ'), 'リナを戦士に転職させますか？');
  assert.equal(jobDoneText('ナナ', '戦士'), 'ナナは戦士になった！');
  const many = jobDoneText('ナナ', '戦士', ['かしのつえ', '皮のたて', '皮のぼうし']);
  assert.equal(many, 'ナナは戦士になった！\n（かしのつえ・皮のたてなどを外した）');
  assert.ok(many.split('\n').length <= 2);
  // 転職の まどは せりふの かわりに せつめいで 足りる（レベルは 残る・他の 職業の 技）
  const svc = src('js/client/ui/services.js');
  assert.match(svc, /jobAskText\(jobLabel\(it\.value, c\)/);  // 第33回: 職業の 名前は 転職する 人 むけ（job-label.js）
  assert.match(svc, /転職しても今の職業のレベルは残る/);
  assert.match(svc, /MPが増えたり威力が下がる/);
});

test('転職の せりふ: サーバーの 返事は jobDoneText（はずした 装備は 2つまで）', async () => {
  const { world, bot, c } = await solo(28);
  bot.s.busy = { kind: 'svc' };
  bot.send({ t: 'svc', kind: 'jobChange', job: 'warrior' });
  const r = lastSvc(bot);
  assert.equal(r.ok, true);
  assert.equal(r.text.split('\n')[0], `${c.name}は${JOBS.warrior.name}になった！`);
  assert.ok(r.text.split('\n').length <= 2, r.text);
});

test('第27回の 文: 使えない 漢字・スペースが ない', () => {
  for (const f of ['js/client/ui/skillinfo.js', 'js/shared/data/job-talk.js', 'js/client/ui/menu.js', 'js/client/battle.js', 'js/client/ui/services.js']) {
    const p = new URL(`../public/${f}`, import.meta.url).pathname;
    assert.deepEqual(checkFile(p).filter((x) => x.kind !== 'kana'), [], f);
  }
  assert.ok(gameFiles().some((f) => f.endsWith('shared/data/job-talk.js')), 'gameFiles に 入っている');
});
