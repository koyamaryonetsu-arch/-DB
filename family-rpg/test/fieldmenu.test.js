// メニューと フィールド: 酒場で 装備を ふくろへ・ならびかえ・まんたん・道具の ならべかえ・目標の しるし・まものの ちらばり
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { gainExp, expForLevel, computeStats, itemCount } from '../public/js/shared/stats.js';
import { recruitNpc, partyOf } from '../public/js/shared/world/party.js';
import { startFieldBattle } from '../public/js/shared/world/battles.js';
import { ITEMS, sortItemIds, itemKana } from '../public/js/shared/data/items.js';
import { OBJECTIVE_TARGETS, questMarks, subQuests, whereName } from '../public/js/shared/data/quest-targets.js';
import { mapState, spawnSymbols } from '../public/js/shared/world/monsters.js';
import { Battle } from '../public/js/shared/battle.js';
import { decideMonster } from '../public/js/shared/ai.js';
import { newCharacter } from '../public/js/shared/stats.js';
import { Bot } from './helpers.js';

async function hero(job = 'priest', level = 20) {
  const world = new GameWorld({ offline: true, rng: makeRng(5), rateLimit: false });
  const bot = new Bot(world, 'テスト');
  await bot.login();
  await bot.createAndPlay(job);
  await bot.settle();
  const s = bot.s;
  gainExp(s.char, expForLevel(level) - s.char.exp);
  const st = computeStats(s.char);
  s.char.hp = st.maxHp;
  s.char.mp = st.maxMp;
  return { world, bot, s };
}
const lastMenu = (bot) => bot.msgs.filter((m) => m.t === 'menuRes').pop();

test('酒場で 待ってもらう 仲間の 装備は ふくろに もどる', async () => {
  const { world, bot, s } = await hero('warrior');
  recruitNpc(world, s, 'npc_gard', { force: true });
  const gard = s.char.companions.find((e) => e.key === 'npc_gard').char;
  const gear = Object.values(gard.equip).filter(Boolean);
  assert.ok(gear.length >= 1, 'ガルドは 装備を もっている');
  const before = gear.map((id) => itemCount(s.char, id));
  bot.send({ t: 'svc', kind: 'tavern', action: 'wait', key: 'npc_gard' });
  assert.ok(Object.values(gard.equip).every((x) => !x), '装備を はずした');
  gear.forEach((id, i) => assert.equal(itemCount(s.char, id), before[i] + 1, `${ITEMS[id].name}が ふくろに`));
  const res = bot.msgs.filter((m) => m.t === 'svcRes').pop();
  assert.ok(/ふくろにしまった/.test(res?.text || ''), res?.text);
});

test('ならびかえ: 戦いの ならびが かわり、先頭ほど ねらわれやすい', async () => {
  const { world, bot, s } = await hero('warrior');
  recruitNpc(world, s, 'npc_gard', { force: true });
  recruitNpc(world, s, 'npc_mina', { force: true });
  bot.send({ t: 'menu', action: 'order', order: ['npc_mina', 'self', 'npc_gard'] });
  assert.equal(lastMenu(bot).ok, true);
  assert.equal(s.char.selfPos, 1);
  assert.deepEqual(s.char.partyKeys, ['npc_mina', 'npc_gard']);
  assert.equal(bot.party.selfPos, 1, 'パーティーの 知らせにも のる');
  const ctx = startFieldBattle(world, s, { id: 'x1', sp: 'pururin', group: ['pururin'], zone: 'plains', table: 'plains', busy: false });
  assert.deepEqual(ctx.battle.allies.map((a) => a.name), ['ミーナ', 'テスト', 'ガルド']);
  assert.equal(ctx.actorMap[ctx.battle.allies[1].id].type, 'human');
  assert.equal(ctx.actorMap[ctx.battle.allies[0].id].key, 'npc_mina');
  // 先頭が ねらわれやすい（ドラクエ風）
  const mk = (n) => { const c = newCharacter({ id: n, name: n, job: 'warrior' }); gainExp(c, expForLevel(30)); c.hp = 9999; return c; };
  const b = new Battle({ rng: makeRng(9), allies: ['A', 'B', 'C', 'D'].map((n) => ({ char: mk(n) })), enemies: ['pururin'] });
  const e = b.enemies[0];
  const hits = { A: 0, B: 0, C: 0, D: 0 };
  for (let i = 0; i < 4000; i++) {
    const cmd = decideMonster(b, e);
    const t = b.combatants.find((x) => x.id === cmd.target);
    if (t && hits[t.name] !== undefined) hits[t.name]++;
  }
  assert.ok(hits.A > hits.B && hits.B > hits.D, JSON.stringify(hits));
  assert.ok(hits.D > 400, `うしろも ねらわれる ${JSON.stringify(hits)}`);
  // リーダーでない 人は かえられない（なかまが いない ときも）
  bot.send({ t: 'menu', action: 'order', order: ['bad'] });
  assert.equal(lastMenu(bot).ok, false);
});

test('まんたん: 呪文で（MPの むだが 少ない じゅん）・道具で', async () => {
  const { world, bot, s } = await hero('priest', 20);
  recruitNpc(world, s, 'npc_gard', { force: true });
  const gard = partyOf(world, s).supports[0].char;
  const me = s.char;
  const gmax = computeStats(gard).maxHp;
  const mmax = computeStats(me).maxHp;
  gard.hp = Math.max(1, gmax - 60);
  me.hp = mmax - 10;
  const mp0 = me.mp;
  bot.send({ t: 'menu', action: 'fullHeal', mode: 'spell' });
  const r = lastMenu(bot);
  assert.equal(r.ok, true, r.text);
  assert.equal(gard.hp, gmax);
  assert.equal(me.hp, mmax);
  assert.ok(/満タン/.test(r.text), r.text);
  assert.ok(me.mp < mp0 && mp0 - me.mp <= 10, `MPを 使いすぎない ${mp0}→${me.mp}`);
  // もう 満タン
  bot.send({ t: 'menu', action: 'fullHeal', mode: 'spell' });
  assert.equal(lastMenu(bot).ok, false);
  // 道具で
  gard.hp = Math.max(1, gmax - 50);
  me.items = [{ id: 'herb', n: 5 }];
  bot.send({ t: 'menu', action: 'fullHeal', mode: 'item' });
  const r2 = lastMenu(bot);
  assert.equal(r2.ok, true, r2.text);
  assert.equal(gard.hp, gmax);
  assert.ok(itemCount(me, 'herb') >= 3, '薬草は 必要な 数だけ');
  assert.ok(/薬草×/.test(r2.text), r2.text);
  // MPが ない
  gard.hp = 1;
  me.mp = 0;
  bot.send({ t: 'menu', action: 'fullHeal', mode: 'spell' });
  assert.equal(lastMenu(bot).ok, false);
});

test('道具の ならべかえ: あいうえお順・種類順・手に入れた順', () => {
  const ids = ['iron_sword', 'herb', 'power_ring', 'antidote', 'cloth', 'seed_str'];
  assert.deepEqual(sortItemIds(ids, 'got'), ids);
  const kana = sortItemIds(ids, 'kana').map(itemKana);
  assert.deepEqual(kana, kana.slice().sort((a, b) => a.localeCompare(b, 'ja')));
  assert.equal(sortItemIds(ids, 'kana')[0], 'seed_str', 'ちからのたね が 先頭');
  assert.deepEqual(sortItemIds(ids, 'type'), ['herb', 'antidote', 'seed_str', 'iron_sword', 'cloth', 'power_ring']);
  // すべての 道具に 読みが ある（漢字の まま ならばない）
  for (const id of Object.keys(ITEMS)) assert.ok(!/[一-龯]/.test(itemKana(id)), `${ITEMS[id].name} の 読み`);
});

test('目標の しるし: メインの 行き先と たのまれごとの 報告', () => {
  for (const [obj, specs] of Object.entries(OBJECTIVE_TARGETS)) for (const sp of specs) assert.ok(whereName(sp), `${obj} の 行き先`);
  const c = { flags: { q_mike_start: 1, q_mike_found: 1 }, items: [], kills: {} };
  // 洞窟の 外からは 入口、洞窟の 中では 次の 階への 出口
  const out = questMarks(c, 'overworld', '洞窟のおくへ進もう（地下2階にカギがあるらしい）');
  assert.ok(out.some((m) => m.kind === 'main' && m.via && m.x === 153 && m.y === 50), JSON.stringify(out));
  assert.ok(out.some((m) => m.kind === 'subReady'), 'リリに 報告できる');
  const b1 = questMarks(c, 'cave_b1', '洞窟のおくへ進もう（地下2階にカギがあるらしい）');
  assert.ok(b1.some((m) => m.kind === 'main' && m.x === 43 && m.y === 3));
  const b2 = questMarks(c, 'cave_b2', '洞窟のおくへ進もう（地下2階にカギがあるらしい）');
  assert.ok(b2.some((m) => m.kind === 'main' && !m.via && m.x === 6 && m.y === 26));
  // 海へは 船で
  const sea = questMarks(c, 'overworld', '南の小島の「海鳴りの洞窟」で、光の玉を取りもどそう');
  assert.ok(sea.some((m) => m.kind === 'main' && m.via), JSON.stringify(sea));
  // たのまれごと
  const q = subQuests({ flags: { q_wolf_start: 1 }, kills: { wolf: 5 }, quests: { wolfBase: 0 }, items: [] });
  assert.equal(q[0].ready, true);
  assert.equal(q[0].who, 'farmer_wolf');
});

test('まものは かたよらずに ちらばる', () => {
  const world = { rng: makeRng(3), mapStates: new Map(), now: () => 0 };
  const ms = mapState(world, 'overworld');
  for (let t = 0; t < 120000; t += 700) spawnSymbols(world, ms, 700, [{ x: 30, y: 100 }]);
  const byZone = {};
  for (const s of ms.symbols.values()) {
    const z = (byZone[s.zone] = byZone[s.zone] || new Map());
    const k = `${Math.floor(s.hx / 12)},${Math.floor(s.hy / 12)}`;
    z.set(k, (z.get(k) || 0) + 1);
  }
  for (const [zone, cells] of Object.entries(byZone)) {
    const n = [...cells.values()].reduce((a, x) => a + x, 0);
    // おなじ 区画に かたまらない（1区画に 3びきより 多くは いない）
    assert.ok(Math.max(...cells.values()) <= 3 || n <= 6, `${zone} ${JSON.stringify([...cells])}`);
    if (n >= 6) assert.ok(cells.size >= Math.ceil(n / 3), `${zone}は いくつもの 区画に いる`);
  }
});

test('さいきょう装備: ふくろの 中で いちばん 強い ものを 装備（みんなも）', async () => {
  const { world, bot, s } = await hero('warrior');
  recruitNpc(world, s, 'npc_gard', { force: true });
  const me = s.char;
  me.equip.weapon = 'wood_sword';
  me.items = [{ id: 'bronze_sword', n: 1 }, { id: 'iron_sword', n: 1 }, { id: 'iron_armor', n: 1 }, { id: 'oak_staff', n: 1 }];
  bot.send({ t: 'menu', action: 'bestEquip', who: 'self' });
  const r = lastMenu(bot);
  assert.equal(r.ok, true, r.text);
  assert.equal(me.equip.weapon, 'iron_sword');
  assert.equal(me.equip.armor, 'iron_armor');
  assert.ok(itemCount(me, 'wood_sword') === 1 && itemCount(me, 'bronze_sword') === 1, '外した 物は ふくろへ');
  // もう 強い ものが ない
  bot.send({ t: 'menu', action: 'bestEquip', who: 'self' });
  assert.equal(lastMenu(bot).ok, false);
  // みんな: ガルドは 銅の剣
  const gard = s.char.companions.find((e) => e.key === 'npc_gard').char;
  gard.equip.weapon = 'wood_sword';
  bot.send({ t: 'menu', action: 'bestEquip', who: 'all' });
  assert.equal(gard.equip.weapon, 'bronze_sword');
});
