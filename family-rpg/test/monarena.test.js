// 第67回 B: モンスター闘技場（サーバーの 窓口・魔物だけの 戦い・ランク戦の 3連戦・ごほうびと 記録・登録チームの 写し・
// 家族の 登録チームとの 対戦〈そのままの 強さ・レベルを そろえる〉・負けた とき・セーブの 手直し）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { STORY_STEPS } from '../public/js/shared/data/story.js';
import { itemCount, computeStats, mpCost } from '../public/js/shared/stats.js';
import { addMonsterEntry } from '../public/js/shared/world/party.js';
import { repairChar, upgradeSave } from '../public/js/shared/world/save.js';
import { runSteps, runScript } from '../public/js/shared/world/scripts.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import {
  MONARENA_RANKS, MONARENA_RANK_IDS, monRankInfo, monRankOpen, monArenaRecord, repairMonArena, noteMonClear, monChampOf, SNAP_KEYS,
} from '../public/js/shared/data/monarena.js';
import {
  MonArenaBattle, monFighterChar, monAllyInit, monSnapshot, snapChar, monRankFight, MON_EVEN_LV, addMonFoe,
} from '../public/js/shared/battle-monarena.js';
import { Battle } from '../public/js/shared/battle.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { Bot, tickN } from './helpers.js';

const UPTO = (f) => STORY_STEPS.slice(0, STORY_STEPS.indexOf(f) + 1);

async function setup(seed = 1, { name = 'ソラ', world = null, flags = ['monster_bond'], mons = ['pururin_knight', 'wolf', 'dark_bat', 'fuwari', 'frog'], lv = 16 } = {}) {
  const w = world || new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(w, name);
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = w.data.characters[bot.char.id];
  for (const f of flags) c.flags[f] = true;
  for (const sp of mons) addMonsterEntry(c, sp, lv);
  const keys = c.companions.map((e) => e.key);
  c.partyKeys = keys.slice(0, 2);
  c.wagon = true;
  c.wagonKeys = keys.slice(2, 3);
  // 1ぴきは あずかり所へ
  const last = c.companions.pop();
  c.storage = [last];
  bot.s.repelUntil = 1e15;
  c.gold = 1000;
  return { world: w, bot, c, keys };
}

const svc = (bot, msg) => {
  const from = bot.msgs.length;
  bot.send({ t: 'svc', kind: 'monarena', ...msg });
  return bot.msgs.slice(from).filter((m) => m.t === 'svcRes').pop();
};
const said = (bot, from = 0) => bot.msgs.slice(from).filter((m) => m.t === 'script').flatMap((m) => m.steps).filter((s) => s[0] === 'say').map((s) => s[2]).join('\n');

// 戦いを すすめる: plan(ctx, i) が 'lose' なら 負け・'auto' なら ほんとうに 戦う・ほかは 勝ち（みかたの HP・MPを へらしてから 勝つ）
async function play(bot, { plan = () => 'win', max = 60000 } = {}) {
  const world = bot.world;
  const fought = [];
  for (let i = 0; i < max; i++) {
    for (const c2 of world.battles.values()) {
      if (c2.battle.over || c2.battle.pendingEnd || c2.seen) continue;
      c2.seen = true;
      const b = c2.battle;
      fought.push({ ctx: c2, allies: b.allies.map((a) => ({ name: a.name, kind: a.kind, hp: a.hp, maxHp: a.maxHp, mp: a.mp, lv: a.lv, controller: a.controller })), enemies: b.enemies.map((e) => ({ name: e.name, species: e.species, lv: e.lv, foe: !!e.foe, hp: e.hp })) });
      const how = plan(c2, fought.length - 1);
      if (how === 'auto') continue;
      if (how === 'lose') {
        for (const a of b.allies) if (a.alive) b.kill(a);
      } else {
        for (const a of b.allies) {
          a.hp = Math.max(1, Math.floor(a.hp * 0.6));
          a.mp = Math.floor(a.mp * 0.5);
        }
        for (const e of b.enemies) if (e.alive) b.kill(e);
      }
      b.checkEnd();
    }
    bot.flushQueue();
    await tickN(world, 1);
    bot.flushQueue();
    if (!bot.s.busy && !bot.queue.length && !world.battles.size && !bot.s.monArenaGo) {
      await tickN(world, 2);
      bot.flushQueue();
      if (!bot.s.busy && !bot.queue.length && !world.battles.size) return fought;
    }
  }
  throw new Error('終わらない');
}

// ───────────── データ ─────────────
test('ランクのデータ: F〜S と 伝説の部 SS・SSS、3連戦、王者は色ちがい、ごほうびの品がある', () => {
  assert.deepEqual(MONARENA_RANK_IDS, ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS', 'EX']); // 第68回 C: EX
  assert.equal(monRankInfo('F').need, 'monster_bond');
  let lv = 0;
  for (const R of MONARENA_RANKS) {
    assert.ok(R.lv > lv, `${R.rank} おすすめLvは だんだん 上がる`);
    lv = R.lv;
    assert.equal(R.fights.length, 3, R.rank);
    for (const f of R.fights) for (const sp of f) assert.ok(MONSTERS[sp], `${R.rank} ${sp}`);
    assert.ok(MONSTERS[monChampOf(R)].variant, `${R.rank} 王者は 色ちがい`);
    for (const [id, n] of R.first.items) assert.ok(ITEMS[id] && n > 0, `${R.rank} ${id}`);
    assert.ok(R.first.medals > 0 && R.repeatGold > 0);
    assert.ok(R.hint && R.title);
    // 物語の フラグは ある もの
    assert.ok(R.need === 'monster_bond' || /^c\d_/.test(R.need), R.need);
  }
  assert.ok(MONARENA_RANKS.filter((R) => R.legend).map((R) => R.rank).join() === 'SS,SSS,EX');
  // 王者: レベルの 上のせと 強さの 倍率（おともは そのまま）
  const R = monRankInfo('F');
  const rf = monRankFight(R, 2);
  assert.equal(rf.champ, monChampOf(R));
  const b = new Battle({ rng: makeRng(1), allies: [], enemies: rf.enemies, enemyMod: rf.enemyMod });
  const champ = b.enemies.find((e) => e.species === rf.champ);
  assert.equal(champ.lv, (R.foeLv || R.lv) + R.champLv);
  assert.ok(b.enemies.filter((e) => e !== champ).every((e) => e.lv === (R.foeLv || R.lv)));
});

test('ランクが開く: 物語のフラグと 1つ前のランク', () => {
  const c = { flags: { monster_bond: true } };
  const flag = (f) => !!c.flags[f];
  assert.equal(monRankOpen('F', flag, c).ok, true);
  assert.equal(monRankOpen('E', flag, c).why, 'story');
  c.flags.c1_clear = true;
  assert.equal(monRankOpen('E', flag, c).why, 'prev');
  noteMonClear(c, 'F', 5);
  assert.equal(monRankOpen('E', flag, c).ok, true);
  assert.equal(monRankOpen('X', flag, c).ok, false);
  assert.equal(monRankOpen('F', () => false, c).why, 'story');
});

// ───────────── 窓口 ─────────────
test('status: 約束の 形（ランク・前回・登録・魔物の いる所・家族の 登録チーム）', async () => {
  const { bot, c, keys, world } = await setup(2);
  const r = svc(bot, { action: 'status' });
  assert.equal(r.ok, true);
  assert.equal(r.ranks.length, MONARENA_RANKS.length);
  for (const k of ['rank', 'name', 'open', 'cleared', 'lv', 'hint']) assert.ok(k in r.ranks[0], k);
  assert.equal(r.ranks[0].open, true);
  assert.equal(r.ranks[1].open, false);
  assert.deepEqual(r.team, []);
  assert.deepEqual(r.reg, []);
  assert.equal(r.monsters.length, 5);
  for (const m of r.monsters) for (const k of ['key', 'name', 'species', 'level', 'hp', 'mp', 'atk', 'def', 'agi', 'where']) assert.ok(m[k] !== undefined, k);
  const where = Object.fromEntries(r.monsters.map((m) => [m.key, m.where]));
  assert.equal(where[keys[0]], 'party');
  assert.equal(where[keys[2]], 'wagon');
  assert.equal(where[keys[3]], 'tavern');
  assert.equal(where[keys[4]], 'storage');
  const m0 = r.monsters.find((m) => m.key === keys[0]);
  assert.equal(m0.hp, computeStats(c.companions[0].char).maxHp);
  assert.deepEqual(r.family, []);
  // 家族が 登録すると 一覧に 出る（自分は 出ない）
  const other = await setup(3, { world, name: 'ユウ' });
  svc(other.bot, { action: 'register', team: other.keys.slice(0, 3) });
  svc(bot, { action: 'register', team: keys.slice(0, 2) });
  const r2 = svc(bot, { action: 'status' });
  assert.equal(r2.family.length, 1);
  assert.equal(r2.family[0].charId, other.c.id);
  assert.equal(r2.family[0].name, 'ユウ');
  assert.equal(r2.family[0].reg.length, 3);
  for (const k of ['species', 'name', 'level']) assert.ok(r2.family[0].reg[0][k] !== undefined);
});

test('チームの たしかめ: 1〜4ひき・自分の 魔物だけ・同じ 魔物は 1回・あずかり所からも 選べる', async () => {
  const { bot, c, keys, world } = await setup(4);
  assert.equal(svc(bot, { action: 'setTeam', team: [] }).ok, false);
  assert.equal(svc(bot, { action: 'setTeam', team: 'm1' }).ok, false);
  assert.equal(svc(bot, { action: 'setTeam', team: keys }).ok, false, '5ひきは だめ');
  assert.equal(svc(bot, { action: 'setTeam', team: [keys[0], keys[0]] }).ok, false);
  assert.equal(svc(bot, { action: 'setTeam', team: ['m999'] }).ok, false);
  assert.equal(svc(bot, { action: 'setTeam', team: ['self'] }).ok, false);
  // 家族の 魔物の key は えらべない
  const other = await setup(5, { world, name: 'ユウ' });
  other.c.companions[0].key = 'zz9';
  assert.equal(svc(bot, { action: 'setTeam', team: ['zz9'] }).ok, false);
  const r = svc(bot, { action: 'setTeam', team: [keys[4], keys[1]] });
  assert.equal(r.ok, true);
  assert.deepEqual(r.team, [keys[4], keys[1]]);
  assert.deepEqual(c.monArena.team, [keys[4], keys[1]]);
  // 人の 仲間は 選べない
  c.companions.push({ key: 'h1', kind: 'human', char: { ...c.companions[0].char, species: undefined, name: 'ひと' } });
  assert.equal(svc(bot, { action: 'setTeam', team: ['h1'] }).ok, false);
  // ランク: 開いていない・ない ランク・物語の 前
  assert.equal(svc(bot, { action: 'rank', rank: 'E', team: [keys[0]] }).ok, false);
  assert.equal(svc(bot, { action: 'rank', rank: 'Z', team: [keys[0]] }).ok, false);
  assert.equal(svc(bot, { action: 'rank', rank: 'F', team: [] }).ok, false);
  delete c.flags.monster_bond;
  assert.equal(svc(bot, { action: 'rank', rank: 'F', team: [keys[0]] }).ok, false);
  c.flags.monster_bond = true;
  // 家族: 自分・いない 人・登録が ない 人
  assert.equal(svc(bot, { action: 'family', charId: c.id, team: [keys[0]] }).ok, false);
  assert.equal(svc(bot, { action: 'family', charId: 'nobody', team: [keys[0]] }).ok, false);
  assert.equal(svc(bot, { action: 'family', charId: other.c.id, team: [keys[0]] }).ok, false);
  assert.equal(svc(bot, { action: 'nope' }).ok, false);
  assert.equal(world.battles.size, 0);
});

// ───────────── ランク戦 ─────────────
test('ランク戦: 魔物だけの 3連戦（人は 戦わない）・戦いの 間は 回復しない・はじめての ごほうび → 2回目から ゴールド', async () => {
  const { bot, c, keys } = await setup(6);
  const team = [keys[0], keys[1], keys[4]];
  const realHp = c.companions[0].char.hp = 5; // もとの 仲間の HP（闘技場は 写しで 満タンに して 戦う）
  const exp0 = c.companions[0].char.exp;
  const r = svc(bot, { action: 'rank', rank: 'F', team });
  assert.equal(r.ok, true);
  assert.deepEqual(c.monArena.team, team, 'ランク戦の チームが 前回の チームに');
  const from = 0;
  const fought = await play(bot);
  assert.equal(fought.length, 3);
  for (const f of fought) {
    assert.equal(f.allies.length, 3);
    assert.ok(f.allies.every((a) => a.kind === 'monster'), '人は 戦わない');
    assert.equal(f.ctx.sids.length, 1);
    assert.ok(f.ctx.opts.solo && f.ctx.opts.monarena === 'rank');
    assert.equal(f.ctx.battle.canFlee, false);
  }
  assert.equal(fought[0].allies[0].hp, fought[0].allies[0].maxHp, 'はじめは 満タン');
  assert.ok(fought[1].allies[0].hp < fought[1].allies[0].maxHp, '2戦目は 回復しない');
  assert.ok(fought[2].enemies.some((e) => e.species === monChampOf(monRankInfo('F'))), '3戦目は 王者');
  assert.equal(c.companions[0].char.hp, realHp, 'もとの 仲間の HPは かわらない');
  assert.ok(c.companions[0].char.exp > exp0, '魔物は 経験値を もらう');
  assert.ok(c.storage[0].char.exp > 0);
  const ends = bot.battles;
  assert.equal(ends.length, 3);
  assert.ok(ends.every((e) => e.outcome === 'win' && e.story));
  assert.match(ends[0].lines.join('\n'), /経験値/);
  assert.ok(monArenaRecord(c).r.F.n === 1);
  assert.equal(itemCount(c, 'seed_hp'), 1);
  assert.equal(itemCount(c, 'friend_powder'), 1);
  assert.ok(c.medalSpots.monarena_F_1);
  assert.match(said(bot, from), /勝ちぬきだ/);
  assert.equal(bot.s.busy, null);
  // 2回目: ゴールドだけ（F は メダルなし）
  const g = c.gold;
  const medals = Object.keys(c.medalSpots).length;
  assert.equal(svc(bot, { action: 'rank', rank: 'F', team }).ok, true);
  await play(bot);
  assert.equal(monArenaRecord(c).r.F.n, 2);
  assert.equal(c.gold, g + monRankInfo('F').repeatGold);
  assert.equal(itemCount(c, 'seed_hp'), 1, 'はじめての 品は 1回だけ');
  assert.equal(Object.keys(c.medalSpots).length, medals);
  // ランク E が 開いた（物語が すすめば）
  c.flags.c1_clear = true;
  assert.equal(svc(bot, { action: 'status' }).ranks[1].open, true);
});

test('ランク戦: 2回目からの 小さなメダル（ランク C から）', async () => {
  const { bot, c, keys } = await setup(7);
  for (const f of UPTO('c3_clear')) c.flags[f] = true;
  for (const id of ['F', 'E', 'D']) noteMonClear(c, id, 1);
  noteMonClear(c, 'C', 1);
  const n0 = Object.keys(c.medalSpots || {}).length;
  assert.equal(svc(bot, { action: 'rank', rank: 'C', team: [keys[0]] }).ok, true);
  await play(bot);
  assert.equal(Object.keys(c.medalSpots).length, n0 + 1);
  assert.ok(c.medalSpots.monarena_rep_1);
});

test('負けた: お金は へらない・ゲームオーバーに ならない・記録は のこらない・その場で 受付の 話', async () => {
  const { bot, c, keys } = await setup(8);
  const map = bot.s.map, x = bot.s.x;
  const g = c.gold;
  assert.equal(svc(bot, { action: 'rank', rank: 'F', team: [keys[0], keys[1]] }).ok, true);
  const from = bot.msgs.length;
  const fought = await play(bot, { plan: (ctx, i) => (i === 1 ? 'lose' : 'win') });
  assert.equal(fought.length, 2);
  assert.equal(bot.battles.pop().outcome, 'lose');
  assert.equal(c.gold, g);
  assert.equal(bot.s.map, map);
  assert.equal(bot.s.x, x);
  assert.ok(!monArenaRecord(c).r.F);
  assert.match(said(bot, from), /第2戦で力つきて/);
  assert.equal(bot.s.busy, null);
  assert.ok(c.companions[0].char.hp > 0);
});

test('めいれいさせろの 魔物は 自分で コマンドを えらぶ（mine）・作戦は 戦いの 中で かえられる', async () => {
  const { bot, c, keys, world } = await setup(9);
  c.companions[1].char.tactics = 'manual';
  assert.equal(svc(bot, { action: 'rank', rank: 'F', team: [keys[0], keys[1]] }).ok, true);
  bot.flushQueue();
  await tickN(world, 2);
  bot.flushQueue();
  const st = bot.msgs.filter((m) => m.t === 'battleStart').pop();
  assert.ok(st && st.story);
  assert.equal(st.mine.length, 1);
  const a = st.snap.combatants.find((x) => x.id === st.mine[0]);
  assert.equal(a.name, c.companions[1].char.name);
  assert.equal(a.tactics, 'manual');
  assert.ok(!st.snap.combatants.some((x) => x.kind === 'player'));
  // 作戦を かえる（もとの 仲間にも のこる）
  const ctx = world.battles.get(bot.s.battleId);
  const other = ctx.battle.allies.find((x) => x.id !== st.mine[0]);
  bot.send({ t: 'battle', actor: other.id, tactics: 'heal' });
  assert.equal(other.tactics, 'heal');
  assert.equal(c.companions[0].char.tactics, 'heal');
  // とちゅうから 家族は 入れない（solo）
  await play(bot);
});

test('A班の 受付の だいほん（monarena_desk）→ 画面を とじて だいほんが おわってから rank（A班の よびかた）', async () => {
  const { bot, c, keys, world } = await setup(17);
  assert.equal(runScript(world, bot.s, 'monarena_desk'), true);
  await tickN(world, 1);
  const ui = bot.msgs.filter((m) => m.t === 'script').flatMap((m) => m.steps).find((s) => s[0] === 'ui');
  assert.ok(!ui, 'はじめは あいさつ');
  await play(bot);
  assert.ok(bot.msgs.filter((m) => m.t === 'script').flatMap((m) => m.steps).some((s) => s[0] === 'ui' && s[1] === 'monarena'));
  assert.equal(bot.s.busy, null);
  assert.equal(svc(bot, { action: 'setTeam', team: [keys[0], keys[1]] }).ok, true);
  assert.equal(svc(bot, { action: 'rank', rank: 'F', team: [keys[0], keys[1]] }).ok, true);
  const fought = await play(bot);
  assert.equal(fought.length, 3);
  assert.equal(monArenaRecord(c).r.F.n, 1);
});

test('受付の だいほんが おわりかけ（まって いない）の 時に とどいても、おわるのを まって はじめる', async () => {
  const { bot, c, keys, world } = await setup(18);
  let done;
  runSteps(world, bot.s, [['call', () => new Promise((ok) => { done = ok; })]]);
  await tickN(world, 1);
  assert.equal(bot.s.busy, 'script');
  assert.equal(svc(bot, { action: 'rank', rank: 'F', team: [keys[0]] }).ok, true);
  done();
  const fought = await play(bot);
  assert.equal(fought.length, 3);
  assert.equal(monArenaRecord(c).r.F.n, 1);
});

test('だいほんの 画面（ui）の 中から よんでも、とじた あとで 3連戦 → もとの だいほんへ', async () => {
  const { bot, c, keys, world } = await setup(10);
  let after = false;
  runSteps(world, bot.s, [['call', async (run) => {
    run.batch.push(['ui', 'monarena', { mode: 'rank' }]);
    await run.flush();
    after = true;
    run.batch.push(['say', null, 'もとの だいほんの つづき']);
    await run.flush();
  }]]);
  await tickN(world, 1);
  assert.equal(bot.s.busy, 'script');
  // 画面が 開いている 間に 申しこむ（bot は まだ ack していない）
  const r = svc(bot, { action: 'rank', rank: 'F', team: [keys[0]] });
  assert.equal(r.ok, true);
  assert.equal(world.battles.size, 0, '画面を とじるまで はじめない');
  assert.equal(svc(bot, { action: 'rank', rank: 'F', team: [keys[0]] }).ok, false, '2回は 申しこめない');
  const fought = await play(bot);
  assert.equal(fought.length, 3);
  assert.ok(after);
  assert.match(said(bot), /もとの だいほんの つづき/);
  assert.equal(monArenaRecord(c).r.F.n, 1);
});

test('ほんとうに 戦う（オート）: おすすめの レベルの 魔物で 勝てる・戦いの 画面の 形', async () => {
  const { bot, c, keys } = await setup(11, { lv: 14 });
  assert.equal(svc(bot, { action: 'rank', rank: 'F', team: keys.slice(0, 4) }).ok, true);
  const fought = await play(bot, { plan: () => 'auto' });
  assert.ok(fought.length >= 1);
  assert.ok(bot.battles.every((e) => ['win', 'lose'].includes(e.outcome)));
  assert.equal(bot.s.busy, null);
});

// ───────────── 登録チームと 家族の 対戦 ─────────────
test('登録: 写しを のこす（強さに いる もの）・登録しなおすと 写しも 新しく', async () => {
  const { bot, c, keys } = await setup(12);
  const e = c.companions[0];
  e.char.plus = 7;
  e.char.color = 'red';
  e.char.bonus = { str: 5 };
  e.char.inherit = ['fire_breath'];
  e.char.equip.weapon = 'copper_sword';
  const r = svc(bot, { action: 'register', team: [keys[0], keys[4]] });
  assert.equal(r.ok, true);
  assert.ok(r.text);
  assert.deepEqual(r.reg, [keys[0], keys[4]]);
  const snap = c.monArena.regSnap;
  assert.equal(snap.length, 2);
  assert.equal(snap[0].key, keys[0]);
  for (const k of ['species', 'name', 'level', 'plus', 'color', 'bonus', 'equip', 'inherit', 'tactics']) assert.deepEqual(snap[0][k], e.char[k], k);
  assert.ok(SNAP_KEYS.every((k) => typeof k === 'string'));
  // 写しから 作った キャラは もとと おなじ 強さ
  const s0 = computeStats(e.char);
  const s1 = computeStats(snapChar(snap[0], c.id));
  for (const k of ['maxHp', 'maxMp', 'atk', 'dfn', 'agi', 'mag']) assert.equal(s1[k], s0[k], k);
  // 写しは もとと べつ（あとで かえても 写しは かわらない → 登録しなおすと 新しく）
  e.char.level += 5;
  assert.equal(monArenaRecord(c).regSnap[0].level, 16);
  svc(bot, { action: 'register', team: [keys[0], keys[4]] });
  assert.equal(monArenaRecord(c).regSnap[0].level, 21);
  // 受付を 開くと（status）今の すがたに なおる。いなく なった 魔物は 前の 写しの まま
  e.char.level += 1;
  c.storage = [];
  svc(bot, { action: 'status' });
  const a = monArenaRecord(c);
  assert.equal(a.regSnap[0].level, 22);
  assert.equal(a.regSnap.length, 2);
  assert.deepEqual(svc(bot, { action: 'status' }).reg, [keys[0]]);
});

test('家族の 登録チームと 戦う（相手は 遊んで いなくても よい）: そのままの 強さ・勝ち負けの 記録・はじめて 勝った 時だけ メダル', async () => {
  const w = new GameWorld({ offline: true, rng: makeRng(13), rateLimit: false });
  const other = await setup(13, { world: w, name: 'ユウ', mons: ['king_pururin', 'crow', 'mandra'], lv: 20 });
  svc(other.bot, { action: 'register', team: other.keys.slice(0, 3) });
  other.bot.send({ t: 'quit' });
  const { bot, c, keys } = await setup(14, { world: w });
  const oppId = other.c.id;
  assert.ok(!w.sessions.has(other.bot.s.id) || !other.bot.s.inWorld);
  const g = c.gold, exp0 = c.companions[0].char.exp;
  const r = svc(bot, { action: 'family', charId: oppId, team: [keys[0], keys[1]], even: false });
  assert.equal(r.ok, true);
  const from = bot.msgs.length;
  const fought = await play(bot);
  assert.equal(fought.length, 1);
  const f = fought[0];
  assert.equal(f.enemies.length, 3);
  assert.ok(f.enemies.every((e) => e.foe && e.lv === 20), '相手の 魔物は 敵の がわ・そのままの レベル');
  assert.ok(f.allies.every((a) => a.lv === 16));
  assert.equal(f.ctx.battle.canFlee, false);
  assert.equal(f.ctx.opts.monarena, 'family');
  assert.equal(c.gold, g, 'お金は もらえない');
  assert.equal(c.companions[0].char.exp, exp0, '経験値も なし');
  assert.deepEqual(monArenaRecord(c).fam[oppId], { w: 1, l: 0, first: true });
  assert.ok(c.medalSpots[`monarena_fam_${oppId}`]);
  assert.match(said(bot, from), /1勝0敗/);
  const medals = Object.keys(c.medalSpots).length;
  // 2回目は 負け・メダルは ふえない
  assert.equal(svc(bot, { action: 'family', charId: oppId, team: [keys[0]], even: false }).ok, true);
  await play(bot, { plan: () => 'lose' });
  assert.deepEqual({ ...monArenaRecord(c).fam[oppId], first: undefined }, { w: 1, l: 1, first: undefined });
  svc(bot, { action: 'family', charId: oppId, team: [keys[0]] });
  await play(bot);
  assert.equal(monArenaRecord(c).fam[oppId].w, 2);
  assert.equal(Object.keys(c.medalSpots).length, medals);
  // 相手の 記録・キャラは かわらない
  assert.ok(!monArenaRecord(other.c).fam[c.id]);
  assert.equal(svc(bot, { action: 'status' }).family[0].rec.w, 2);
});

test('家族の 対戦: レベルを そろえる（両方 みんな MON_EVEN_LV で 強さを 計算しなおす）', async () => {
  const w = new GameWorld({ offline: true, rng: makeRng(15), rateLimit: false });
  const other = await setup(15, { world: w, name: 'ユウ', mons: ['king_pururin', 'crow'], lv: 70 });
  svc(other.bot, { action: 'register', team: other.keys.slice(0, 2) });
  const { bot, c, keys } = await setup(16, { world: w, lv: 8 });
  assert.equal(svc(bot, { action: 'family', charId: other.c.id, team: [keys[0], keys[4]], even: true }).ok, true);
  const fought = await play(bot);
  const f = fought[0];
  assert.ok(f.allies.every((a) => a.lv === MON_EVEN_LV));
  assert.ok(f.enemies.every((e) => e.lv === MON_EVEN_LV));
  const ally = f.ctx.battle.allies[0];
  assert.equal(ally.maxHp, computeStats({ ...c.companions[0].char, level: MON_EVEN_LV }).maxHp);
  assert.equal(c.companions[0].char.level, 8, 'もとの レベルは かわらない');
  assert.equal(other.c.companions[0].char.level, 70);
});

// ───────────── 敵の がわの 魔物の 仲間（C班も 使う）─────────────
test('MonArenaBattle: 敵の がわの 魔物は 作戦の AI で 動く（回復・技）・強さの きまりは みかたと おなじ', () => {
  const mk = (sp, lv, name) => monFighterChar({ species: sp, name, level: lv, plus: 0, equip: {}, tactics: 'heal', jobs: {}, status: {} });
  // みかたと 敵の がわに 同じ 魔物（名前が かさなる → A・B）
  const healer = mk('fuwari', 30, 'ふわり');
  const b = new MonArenaBattle({ rng: makeRng(5), canFlee: false, allies: [monAllyInit(mk('wolf', 30, 'ガルル'))], foes: [{ char: healer }, { char: mk('wolf', 30, 'ガルル') }] });
  const foes = b.enemies;
  assert.equal(foes.length, 2);
  assert.ok(foes.every((x) => x.foe && x.side === 'enemy' && x.species));
  assert.equal(foes[1].name, 'ガルルA', 'みかたと 同じ 名前は A・B');
  const ally = b.allies[0];
  // 呪文の 強さ: 敵の 魔物の 弱め（enemyFixedScale）を かけない → みかたと おなじ
  const eff = { base: [40, 40], element: 'fire' };
  const fx = b.calcMagic(foes[0], ally, eff, 1, true).dmg;
  const ax = b.calcMagic(Object.assign(Object.create(Object.getPrototypeOf(foes[0])), { ...foes[0], side: 'ally', foe: false }), ally, eff, 1, true).dmg;
  assert.equal(fx, ax);
  // 会心の 出やすさを みかたと そろえる
  assert.ok(foes[0].crit >= 1 / 28 - 1 / 64);
  // 回復の 作戦: 仲間が けがを していれば 回復の 技
  foes[1].hp = Math.floor(foes[1].maxHp * 0.2);
  const heals = foes[0].abilities.filter((id) => ABILITIES[id]?.effect?.type === 'heal');
  assert.ok(heals.length, 'ふわりんは 回復の 技を 覚えている');
  const cmd = b.foeDecide(foes[0]);
  assert.equal(cmd.type, 'ability');
  assert.ok(heals.includes(cmd.id));
  // 最後まで 戦える
  let t = 0;
  while (!b.over && t < 30 * 60 * 1000) { b.tick(50); t += 50; }
  assert.ok(['win', 'lose'].includes(b.result.outcome));
});

test('MonArenaBattle: 敵の がわの 魔物の 技（kind monster）も MP を はらう・人が うごかす 敵の がわ（C班）', () => {
  const id = Object.keys(ABILITIES).find((k) => ABILITIES[k].kind === 'monster' && (ABILITIES[k].mp || 0) > 0 && ['enemy', 'enemies', 'group'].includes(ABILITIES[k].target) && ABILITIES[k].effect?.type === 'magic');
  assert.ok(id);
  const ch = monFighterChar({ species: 'wolf', name: 'ガルル', level: 30, equip: {}, tactics: 'balanced', inherit: [id], jobs: {}, status: {} });
  const b = new MonArenaBattle({ rng: makeRng(2), allies: [monAllyInit(monFighterChar({ species: 'pururin', name: 'ぷる', level: 30, equip: {}, jobs: {}, status: {} }))], foes: [{ char: ch, controller: 'p2', auto: false }] });
  const f = b.enemies[0];
  assert.ok(f.abilities.includes(id));
  // 人が うごかす: 番が きたら コマンドを まつ
  b.onReady(f);
  assert.equal(f.ready, true);
  const mp = f.mp;
  const r = b.command(f.id, { type: 'ability', id, target: b.allies[0].id }, 'p2');
  assert.equal(r.ok, true);
  b.executeNext();
  assert.equal(f.mp, mp - mpCost(f.penChar, id));
  // ほかの 人の コマンドは だめ
  f.ready = true;
  assert.equal(b.command(f.id, { type: 'attack' }, 'p1').ok, false);
  // addMonFoe で あとから 足しても よい
  const g = addMonFoe(b, monFighterChar({ species: 'crow', name: 'カー', level: 10, equip: {}, jobs: {}, status: {} }));
  assert.ok(g.foe && g.id.startsWith('e'));
});

test('monSnapshot / snapChar: こわれた ものは 読まない', () => {
  assert.equal(monSnapshot(null), null);
  assert.equal(monSnapshot({ key: 'm1', char: { species: 'nope' } }), null);
  assert.equal(snapChar({ species: 'nope' }), null);
  const c = snapChar({ key: 'm1', species: 'wolf', level: 'x' }, 'p', { level: 12 });
  assert.equal(c.level, 12);
  assert.ok(c.hp > 0 && c.equip);
});

// ───────────── セーブ ─────────────
test('セーブの 手直し: むかしの セーブ（ない）・こわれた 記録・知らない ランク', () => {
  const c = { id: 'p1', name: 'ソラ', level: 5, exp: 0, flags: {} };
  repairChar(c, 'p1');
  assert.equal(c.monArena, undefined);
  c.monArena = 'こわれた';
  repairMonArena(c);
  assert.equal(c.monArena, undefined);
  c.monArena = {
    r: { F: { n: 2, at: 5 }, Z: { n: 1 }, E: { n: 0 }, D: 'x' },
    team: ['m1', 'm1', 3, 'm2', 'm3', 'm4', 'm5'], reg: 'm1',
    regSnap: [{ key: 'm1', species: 'wolf', level: 3, name: 'ガルル' }, { key: 'm2', species: 'nope' }, null],
    fam: { p2: { w: 2, l: 'x' }, p3: { w: 0, l: 0 } }, rep: -3,
  };
  repairChar(c, 'p1');
  assert.deepEqual(c.monArena.r, { F: { n: 2, at: 5 } });
  assert.deepEqual(c.monArena.team, ['m1', 'm2', 'm3', 'm4']);
  assert.equal(c.monArena.reg, undefined);
  assert.equal(c.monArena.regSnap.length, 1);
  assert.deepEqual(c.monArena.fam, { p2: { w: 2, l: 0 } });
  assert.equal(c.monArena.rep, undefined);
  // セーブ ぜんたいでも のこる
  const { data: d } = upgradeSave({ version: 1, characters: { p1: c } });
  assert.equal(d.characters.p1.monArena.r.F.n, 2);
  // 記録を 読む 関数は c を かえない
  const raw = { monArena: { r: { F: 3 } } };
  assert.deepEqual(monArenaRecord(raw).r, {});
  assert.deepEqual(raw.monArena.r, { F: 3 });
});

test('ゲームの 文字: 新しい ファイルも 調べる・使えない 漢字と スペースが ない', () => {
  const files = gameFiles().filter((f) => /(data|world)[\\/]monarena\.js$|battle-monarena\.js$/.test(f));
  assert.equal(files.length, 3);
  for (const f of files) {
    const bad = checkFile(f).filter((x) => x.kind === 'kanji' || x.kind === 'space');
    assert.deepEqual(bad, [], f);
  }
});

test('画面: まだ とうろく されていない 色ちがいの ID も 引ける（家族の 色ちがいの 仲間が 敵の がわに 出る 時）', async () => {
  const { ensureVariantId } = await import('../public/js/shared/data/variants.js');
  delete MONSTERS.v_gold_crow;
  assert.equal(MONSTERS.v_gold_crow, undefined);
  assert.equal(ensureVariantId('v_gold_crow'), 'v_gold_crow');
  assert.ok(MONSTERS.v_gold_crow.name.includes(MONSTERS.crow.name));
  for (const bad of [null, 'wolf', 'v_', 'v_nokind_wolf', 'v_gold_nope', '__proto__']) assert.equal(ensureVariantId(bad), null, String(bad));
  // 敵の がわの 色ちがいの 仲間の species は 色ちがいの ID
  const b = new MonArenaBattle({ rng: makeRng(1), allies: [], foes: [{ char: monFighterChar({ species: 'crow', color: 'gold', name: 'カー', level: 5, equip: {}, jobs: {}, status: {} }) }] });
  assert.equal(b.enemies[0].species, 'v_gold_crow');
});
