// 第69回: 技の 一覧の 見なおし（家族の ねがい。docs/plan-r69-skill-menu.md）
//   1. 技の ならびは ダメージ・回復の 弱い じゅん（職業の ほせい なし・ふつうの キャラの 強さ。shared/skill-sort.js）
//   2. メニューの お気に入り: 戦いと おなじ 見え方（呪文・特技）で、つかんで 十字キーで 動かす（サーバーの op: 'order'）
//   3. 作戦の「使う技を選ぶ」: 使わない 技は 自分で 命令する ときも 戦いの 一覧に 出ない（主人公も）
//   4. フィールドの「回復」「回復以外」（ルーラ・リレミトが 上）
//   5. 戦いの 技えらび: 種類（タブ）は L・R（Q・E）、左右は 列の はしで ひとまとまり ずつ
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { STD, partStdPower, skillStdPower, sortByStdPower, favSection, moveInGrid, mergeSectionOrder } from '../public/js/shared/skill-sort.js';
import { skillPower } from '../public/js/shared/skill-power.js';
import { splitFieldAbilities, fieldUsableAbilities } from '../public/js/shared/fieldskills.js';
import { favoriteOrder } from '../public/js/shared/world/services.js';
import { pub } from '../public/js/shared/battle.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { startFieldBattle } from '../public/js/shared/world/battles.js';
import { newCharacter, gainExp, expForLevel, computeStats, learnedAbilities } from '../public/js/shared/stats.js';
import { Bot, tickN } from './helpers.js';

const src = (p) => fs.readFileSync(new URL(`../public/${p}`, import.meta.url), 'utf8');
const lastMenu = (bot) => bot.msgs.filter((m) => m.t === 'menuRes').pop();

// ───────────── 1. ならび ─────────────
test('技の ならび: 物理の 倍率・呪文の 数・回復が おなじ ものさしで 弱い じゅん（ダメージ・回復の ない 技は あとで MPの じゅん）', () => {
  const ids = ['merazoma', 'sukuruto', 'hoimi', 'kabau', 'daichi', 'mera', 'behoimi', 'lt_ken'];
  assert.deepEqual(sortByStdPower(ids), ['mera', 'hoimi', 'daichi', 'behoimi', 'lt_ken', 'merazoma', 'kabau', 'sukuruto']);
  // しき: 呪文は 数の まんなか × ふつうの 魔力の 伸び、物理は ふつうの 攻撃 × 倍率（守りを むしする 技は その ぶん 強い）
  const mera = ABILITIES.mera.effect;
  const k = 1 + Math.min(1, Math.max(0, (STD.mag - mera.thr) / 150));
  assert.equal(skillStdPower('mera'), Math.round(((mera.base[0] + mera.base[1]) / 2) * k * 10) / 10);
  assert.equal(skillStdPower('daichi'), (STD.atk / 2 - STD.foeDfn / 4) * ABILITIES.daichi.effect.mult);
  assert.ok(skillStdPower('lt_ken') > (STD.atk / 2 - STD.foeDfn / 4) * ABILITIES.lt_ken.effect.mult, '守りを 少し むしする');
  // 何回も あたる 技は 回数を かける・いくつも 効果の ある 技は たす
  const hits = Object.keys(ABILITIES).find((id) => ABILITIES[id].effect?.type === 'phys' && ABILITIES[id].effect.hits > 2 && !ABILITIES[id].effect.forceCrit && !ABILITIES[id].effect.ignoreDef);
  const e = ABILITIES[hits].effect;
  assert.equal(skillStdPower(hits), Math.round((STD.atk / 2 - STD.foeDfn / 4) * (e.mult ?? 1) * e.hits * 10) / 10);
  const multi = Object.keys(ABILITIES).find((id) => ABILITIES[id].effect?.type === 'multi' && ABILITIES[id].effect.parts.filter((p) => partStdPower(p) > 0).length >= 2);
  const parts = ABILITIES[multi].effect.parts;
  assert.equal(skillStdPower(multi), Math.round(parts.reduce((s, p) => s + partStdPower(p), 0) * 10) / 10, multi);
  // ダメージ・回復の ない 技は 0。おなじ MPなら 覚えた じゅん
  assert.equal(skillStdPower('kabau'), 0);
  assert.deepEqual(sortByStdPower(['chikaratame', 'kabau']), ['chikaratame', 'kabau']);
  assert.deepEqual(sortByStdPower(['kabau', 'chikaratame']), ['kabau', 'chikaratame']);
  // 知らない 技は さいご・もとの 配列は かえない
  const src0 = ['nothing_x', 'merazoma', 'mera'];
  assert.deepEqual(sortByStdPower(src0), ['mera', 'merazoma', 'nothing_x']);
  assert.deepEqual(src0, ['nothing_x', 'merazoma', 'mera']);
});

test('技の ならび: 職業の ほせい（転職の ペナルティ）も その 人の 強さも 入れない', () => {
  const mk = (job, lv) => {
    const c = newCharacter({ id: 'p', name: 'テスト', look: {}, job });
    gainExp(c, expForLevel(lv) - c.exp);
    return c;
  };
  // 戦士が メラを 使うと ペナルティで 弱く なるが、ならびの 強さは おなじ
  const war = mk('warrior', 30);
  war.jobs.mage = { lv: 10, b: 999 };
  const mage = mk('mage', 5);
  assert.notEqual(skillPower('merazoma', war).parts[0].max, skillPower('merazoma', mage).parts[0].max, '今の 強さでは ちがう');
  assert.equal(sortByStdPower.length, 1, 'キャラを うけとらない');
  assert.deepEqual(sortByStdPower(['merazoma', 'daichi']), ['daichi', 'merazoma']);
  // 戦いの コマンド: 今の 職業を さきに する ならびは やめて、弱い じゅん（★は お気に入りの ならび）
  const b = src('js/client/battle.js');
  const open = b.slice(b.indexOf('  openCommand() {'), b.indexOf('  showMenu('));
  assert.match(open, /const learned = sortByStdPower\(/);
  assert.doesNotMatch(open, /nowJob/);
  // メニューの 覚えた技・使う技を選ぶ・ひらめきも（第71回: 覚えた技の タブの 中も 弱い じゅん。shared/skill-view.js）
  const m = src('js/client/ui/menu.js');
  assert.match(m, /const order = sortByStdPower\(learned\);/);
  assert.match(src('js/shared/skill-view.js'), /const sorted = sortByStdPower\(ids\);/);
  assert.match(m, /const ids = sortByStdPower\(learnedAbilities\(c\)\)/);
  assert.match(m, /sortByStdPower\(shown\)/);
});

// ───────────── 2. お気に入りの ならびかえ ─────────────
test('お気に入り: 呪文・特技の わけかた（戦いと おなじ）・つかんで 動かす・見出しの 中だけ ならびを かえる', () => {
  assert.equal(favSection(ABILITIES.mera), 'spell');
  assert.equal(favSection(ABILITIES.daichi), 'skill');
  assert.equal(favSection(null), null);
  // 2列: 左右は 1つ・上下は 1行。はしで とまる
  const ids = ['a', 'b', 'c', 'd', 'e'];
  assert.deepEqual(moveInGrid(ids, 0, 'right', 2), { ids: ['b', 'a', 'c', 'd', 'e'], pos: 1 });
  assert.deepEqual(moveInGrid(ids, 1, 'down', 2), { ids: ['a', 'd', 'c', 'b', 'e'], pos: 3 });
  assert.deepEqual(moveInGrid(ids, 3, 'down', 2), { ids: ['a', 'b', 'c', 'e', 'd'], pos: 4 }, 'さいごの 行は さいごまで');
  assert.equal(moveInGrid(ids, 0, 'left', 2), null);
  assert.equal(moveInGrid(ids, 0, 'up', 3), null);
  assert.deepEqual(moveInGrid(ids, 4, 'up', 3).pos, 1);
  // 呪文と 特技が まざった 1つの 配列: 呪文の 場所だけ 入れかわる
  const full = ['mera', 'daichi', 'hoimi', 'kabau', 'io'];
  assert.deepEqual(mergeSectionOrder(full, ['mera', 'hoimi', 'io'], ['io', 'mera', 'hoimi']), ['io', 'daichi', 'mera', 'kabau', 'hoimi']);
});

test('お気に入り: サーバーの op order（おなじ 技の くみ だけ・30こまで）。戦いの 人の お気に入りも', async () => {
  assert.deepEqual(favoriteOrder(['mera', 'hoimi'], ['hoimi', 'mera']), ['hoimi', 'mera']);
  assert.equal(favoriteOrder(['mera', 'hoimi'], ['hoimi']), null, 'たりない');
  assert.equal(favoriteOrder(['mera', 'hoimi'], ['hoimi', 'io']), null, 'ちがう 技');
  assert.equal(favoriteOrder(['mera', 'hoimi'], ['mera', 'mera']), null, 'かさなり');
  assert.equal(favoriteOrder(['mera'], 'mera'), null);
  const many = Object.keys(ABILITIES).slice(0, 31);
  assert.equal(favoriteOrder(many, many.slice().reverse()), null, '30こ まで');

  const world = new GameWorld({ offline: true, rng: makeRng(69), rateLimit: false });
  const bot = new Bot(world, 'ナナ');
  await bot.login();
  await bot.createAndPlay('mage');
  await bot.settle();
  const c = bot.s.char;
  gainExp(c, expForLevel(12) - c.exp);
  for (const id of ['mera', 'hyado', 'gira']) bot.send({ t: 'menu', action: 'favorite', who: 'self', id, op: 'add' });
  assert.deepEqual(c.favorites, ['mera', 'hyado', 'gira']);
  const ctx = startFieldBattle(world, bot.s, { id: 'r69', sp: 'pururin', group: ['pururin'], zone: 'outskirts', table: 'outskirts', busy: false });
  for (const e of ctx.battle.enemies) { e.hp = e.maxHp = 9999; e.actions = [{ w: 1, id: 'm_nothing' }]; }
  const me = ctx.battle.combatants.find((x) => x.side === 'ally' && x.charId === c.id);
  bot.send({ t: 'menu', action: 'favorite', who: 'self', op: 'order', ids: ['gira', 'mera', 'hyado'] });
  assert.equal(lastMenu(bot).ok, true);
  assert.deepEqual(c.favorites, ['gira', 'mera', 'hyado']);
  assert.deepEqual(me.favs, ['gira', 'mera', 'hyado'], '戦いの 人も');
  bot.send({ t: 'menu', action: 'favorite', who: 'self', op: 'order', ids: ['gira', 'mera'] });
  assert.equal(lastMenu(bot).ok, false);
  assert.deepEqual(c.favorites, ['gira', 'mera', 'hyado'], 'だめな ときは かわらない');
  // 前からの 上へ・下へ も そのまま
  bot.send({ t: 'menu', action: 'favorite', who: 'self', id: 'hyado', op: 'up' });
  assert.deepEqual(c.favorites, ['gira', 'hyado', 'mera']);
  await tickN(world, 1);
});

test('お気に入り: メニューは 戦いと おなじ 見え方で つかんで 動かす（動かす・はずす・やめる。スマホは ▲▼◀▶・おく・やめる）', () => {
  const m = src('js/client/ui/menu.js');
  const fav = m.slice(m.indexOf("    if (mode === 'fav') {"), m.indexOf("    if (mode === 'dual') {"));
  assert.match(fav, /label: '動かす', value: 'move'/);
  assert.match(fav, /favSection\(abilityFor\(id, c\)\)/);
  assert.match(fav, /battleDensityPref\(\) === 3 \? 3 : 2/, '戦いの コマンドの 列の 数');
  assert.match(fav, /moveInGrid\(gg\.ids, gg\.pos, dir, cols\)/);
  assert.match(fav, /mergeSectionOrder\(c\.favorites \|\| \[\], gg\.orig, gg\.ids\)/);
  for (const w of ["'おく'", "'やめる'", "'▲'", "'▼'", "'◀'", "'▶'"]) assert.ok(fav.includes(w), w);
  assert.match(m, /op: 'order', ids/);
});

// ───────────── 3. 使う技を選ぶ ─────────────
// 第71回: 「オートで使う技を選ぶ」（autoOff）と「命令で出す技を選ぶ」（cmdOff）に 分けた。
//   この テストは 第69回の 決めた こと（autoOff）が cmdOff に うつって、命令の 一覧から 消えた ままに なる ことを たしかめる（test/skill-menu-r71.test.js も）
test('使う技を選ぶ（第71回で 2つに）: 前の「使わない」は 命令の 一覧からも 消えた まま（cmdOff に うつす）', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(70), rateLimit: false });
  const bot = new Bot(world, 'ナナ');
  await bot.login();
  await bot.createAndPlay('mage');
  await bot.settle();
  const c = bot.s.char;
  gainExp(c, expForLevel(12) - c.exp);
  c.jobs.mage = { lv: 5, b: 999 };
  assert.ok(learnedAbilities(c).includes('hyado'));
  // 第69回の セーブ（autoOff だけ。cmdOff は まだ ない）
  c.autoOff = ['mera'];
  assert.equal(c.cmdOff, undefined);
  const ctx = startFieldBattle(world, bot.s, { id: 'r69b', sp: 'pururin', group: ['pururin'], zone: 'outskirts', table: 'outskirts', busy: false });
  for (const e of ctx.battle.enemies) { e.hp = e.maxHp = 9999; e.actions = [{ w: 1, id: 'm_nothing' }]; }
  const me = ctx.battle.combatants.find((x) => x.side === 'ally' && x.charId === c.id);
  assert.ok(!me.auto, '自分で 命令する');
  assert.deepEqual(me.autoOff, ['mera'], 'オートで 使わない');
  assert.deepEqual(pub(me).cmdOff, ['mera'], '前からの 人（cmdOff が ない）は autoOff が 命令の 一覧にも きく');
  assert.ok(!pub(me).cmdOff.includes('hyado'));
  assert.equal(pub(me).autoOff, undefined, 'autoOff は クライアントに おくらない（AIだけ）');
  // 全部使う（戦いの あと）: つぎの 戦いでは みんな 出る
  for (const e of ctx.battle.enemies) { e.hp = 0; e.alive = false; }
  ctx.battle.checkEnd();
  for (let i = 0; i < 300 && world.battles.size; i++) await tickN(world, 1);
  await bot.settle();
  bot.send({ t: 'menu', action: 'autoSkill', key: 'self', op: 'all' });
  assert.equal(lastMenu(bot).ok, true);
  assert.equal(c.autoOff, undefined, '全部使う');
  assert.deepEqual(c.cmdOff, ['mera'], 'autoOff を かえる 前に cmdOff に うつした（命令の 一覧からは 消えた まま）');
  bot.send({ t: 'menu', action: 'cmdSkill', key: 'self', op: 'all' });
  assert.deepEqual(c.cmdOff, [], '全部出す');
  const ctx2 = startFieldBattle(world, bot.s, { id: 'r69c', sp: 'pururin', group: ['pururin'], zone: 'outskirts', table: 'outskirts', busy: false });
  const me2 = ctx2.battle.combatants.find((x) => x.side === 'ally' && x.charId === c.id);
  assert.equal(pub(me2).cmdOff, undefined);
  // 画面: 戦いの コマンドは cmdOff を のぞく（第71回）。フィールドで 使う 一覧は のぞかない
  const b = src('js/client/battle.js');
  assert.match(b, /const off = new Set\(a\.cmdOff \|\| \[\]\);/);
  assert.match(b, /filter\(\(id\) => !off\.has\(id\) && battleAbilityOk/);
  assert.doesNotMatch(src('js/shared/fieldskills.js'), /autoOff|cmdOff/);
  const m = src('js/client/ui/menu.js');
  assert.match(m, /label: 'オートで使う技を選ぶ', value: 'skills'/);
  assert.match(m, /label: '命令で出す技を選ぶ', value: 'cmd'/);
  await tickN(world, 1);
});

// ───────────── 4. 回復・回復以外 ─────────────
test('フィールドの 回復・回復以外: 回復は 弱い じゅん、回復以外は ルーラ・リレミトが 上', () => {
  const list = ['toheros', 'behoimi', 'riremito', 'zao', 'hoimi', 'rura', 'kiarii'].map((id) => ({ id, ok: true }));
  const r = splitFieldAbilities(list);
  assert.deepEqual(r.heal.map((x) => x.id), ['hoimi', 'zao', 'behoimi', 'kiarii']);
  assert.deepEqual(r.other.map((x) => x.id), ['rura', 'riremito', 'toheros']);
  assert.equal(r.heal[0], list[4], 'もとの 行（MP・使えるか）の まま');
  // 僧侶: 回復だけ
  const c = newCharacter({ id: 'p', name: 'テスト', look: {}, job: 'priest' });
  gainExp(c, expForLevel(20) - c.exp);
  c.jobs.priest = { lv: 10, b: 999 };
  const st = computeStats(c);
  c.hp = st.maxHp;
  c.mp = st.maxMp;
  const p = splitFieldAbilities(fieldUsableAbilities(c));
  assert.ok(p.heal.some((x) => x.id === 'hoimi'));
  assert.ok(p.heal.every((x) => !['rura', 'riremito'].includes(x.id)));
  const m = src('js/client/ui/menu.js');
  assert.match(m, /\['heal', '回復'\], \['other', '回復以外'\]/);
  assert.doesNotMatch(m, /\['now', '今使える'\]/);
});

// ───────────── 5. L・R と ひとまとまり ─────────────
test('戦いの 技えらび: 種類は L・R（Q・E）、左右は 列の はしで 見えている ひとまとまり ずつ（おなじ 列・はしで とまる）', async () => {
  const inp = src('js/client/input.js');
  assert.match(inp, /KeyQ: 'l', KeyE: 'r'/);
  assert.match(inp, /if \(edge\('r', b\(5\)\) && lr\) this\.emit\('r'\);/);
  const d = src('js/client/ui/dom.js');
  assert.match(d, /this\.onLR\?\.\(a === 'l' \? -1 : 1\)/);
  const b = src('js/client/battle.js');
  assert.match(b, /pagerWrap\(m\)/);
  assert.match(b, /'aria-label': d < 0 \? 'まえの技' : 'つぎの技'/);
  // ひとまとまりの 計算（画面なしで: 2列・3行 見える）
  const { ListMenu } = await import('../public/js/client/ui/dom.js').catch(() => ({}));
  if (!ListMenu) return;
  const fake = (idx, n) => ({ idx, items: Array.from({ length: n }, () => ({})), visualCols: () => 2, pageRows: () => 3 });
  const t = (idx, n, dd) => ListMenu.prototype.pageTarget.call(fake(idx, n), dd);
  assert.equal(t(1, 20, 1), 7, '6こ 先');
  assert.equal(t(7, 20, -1), 1);
  assert.equal(t(15, 20, 1), 19, 'さいごの 行の おなじ 列');
  assert.equal(t(14, 19, 1), 18, 'さいごの 行');
  assert.equal(t(3, 20, -1), 1, '前は いちばん 上の 行の おなじ 列');
  assert.equal(t(0, 20, -1), 0, 'はしで とまる');
});
