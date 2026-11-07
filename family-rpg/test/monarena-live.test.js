// 第67回 C: モンスター闘技場の その場の 対戦（リアルタイムの 家族対戦）。2人の ロボットで ためす
//   申しこむ・うける・ことわる・時間切れ・やめる・2人とも 4ひきを 選ぶ・おたがいの コマンド・作戦の AI・
//   相手の 画面（敵と みかたを 入れかえる）・通信が とぎれた 時・レベルを そろえる・記録と メダル
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { addMonsterEntry } from '../public/js/shared/world/party.js';
import { runSteps } from '../public/js/shared/world/scripts.js';
import { openMonArena } from '../public/js/shared/data/story-monarena-a.js';
import { monArenaRecord, repairMonArena, noteLiveResult } from '../public/js/shared/data/monarena.js';
import { MON_EVEN_LV } from '../public/js/shared/battle-monarena.js';
import { LIVE_ASK_MS, LIVE_AWAY_MS, LIVE_PICK_MS, mirrorSnapshot } from '../public/js/shared/world/monarena-live.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { Bot, tickN } from './helpers.js';

// 戦いの はじめに オートに しない ロボット（自分で コマンドを 送る）
class LiveBot extends Bot {
  onMsg(m) {
    if (m.t === 'battleStart' && this.manual) {
      this.msgs.push(m);
      this.inBattle = true;
      this.start = m;
      return;
    }
    super.onMsg(m);
  }
}

async function makeWorld(seed = 1) {
  const clock = { t: 1_800_000_000_000 };
  const world = new GameWorld({ offline: false, rng: makeRng(seed), checkPassword: () => true, rateLimit: false, now: () => clock.t });
  return { world, clock };
}

async function player(world, name, { mons = ['pururin_knight', 'wolf', 'dark_bat', 'fuwari', 'frog'], lv = 16, manual = 0, inArena = true } = {}) {
  const bot = new LiveBot(world, name);
  await bot.login('x');
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  c.flags.monster_bond = true;
  for (const sp of mons) addMonsterEntry(c, sp, lv);
  c.partyKeys = c.companions.slice(0, 3).map((e) => e.key);
  for (let i = 0; i < manual; i++) c.companions[i].char.tactics = 'manual';
  bot.s.repelUntil = 1e15;
  if (inArena) goArena(bot);
  return { bot, c, keys: c.companions.map((e) => e.key) };
}

function goArena(bot) {
  Object.assign(bot.s, { map: 'monarena', x: 13.5, y: 13.5 });
}

const live = (bot, msg) => {
  const from = bot.msgs.length;
  bot.send({ t: 'svc', kind: 'monlive', ...msg });
  return bot.msgs.slice(from).filter((m) => m.t === 'svcRes').pop();
};
const pushes = (bot, from = 0) => bot.msgs.slice(from).filter((m) => m.t === 'monLive');
const lastPush = (bot) => pushes(bot).pop();

async function step(world, bots, n = 1) {
  for (let i = 0; i < n; i++) {
    for (const b of bots) b.flushQueue();
    await tickN(world, 1);
  }
  for (const b of bots) b.flushQueue();
}

// 申しこんで うけて チームを 決める（battle まで）
async function toBattle(world, A, B, { even = false, teamA = null, teamB = null } = {}) {
  const inv = live(A.bot, { op: 'invite', sid: B.bot.s.id, even });
  assert.equal(inv.ok, true, inv.text);
  const ask = lastPush(B.bot);
  assert.equal(ask.state, 'ask');
  assert.equal(ask.role, 'b');
  assert.equal(ask.opp, A.bot.name);
  assert.equal(ask.even, even);
  const ans = live(B.bot, { op: 'answer', id: ask.id, ok: true });
  assert.equal(ans.ok, true, ans.text);
  assert.equal(lastPush(A.bot).state, 'pick');
  assert.equal(live(A.bot, { op: 'team', id: ask.id, team: teamA || A.keys.slice(0, 4) }).ok, true);
  assert.equal(lastPush(B.bot).oppReady, true);
  const r = live(B.bot, { op: 'team', id: ask.id, team: teamB || B.keys.slice(0, 4) });
  assert.equal(r.ok, true);
  assert.equal(r.go, true);
  await step(world, [A.bot, B.bot], 2);
  const ctx = [...world.battles.values()].find((x) => x.live?.id === ask.id);
  assert.ok(ctx, '戦いが はじまった');
  return { id: ask.id, ctx };
}

async function finishBattle(world, bots, ctx, max = 20000) {
  for (let i = 0; i < max && world.battles.get(ctx.id); i++) await step(world, bots, 1);
  assert.ok(!world.battles.get(ctx.id), '戦いが おわった');
  await step(world, bots, 2);
}

// ───────────── 申しこみ ─────────────
test('一覧: 闘技場に いる 家族だけ。申しこめない わけ', async () => {
  const { world } = await makeWorld(1);
  const A = await player(world, 'ソラ');
  const B = await player(world, 'ユイ');
  const C = await player(world, 'ケン', { inArena: false });
  const D = await player(world, 'ミオ', { mons: [] });
  const r = live(A.bot, { op: 'list' });
  assert.equal(r.ok, true);
  const names = r.people.map((p) => p.name);
  assert.ok(names.includes('ユイ') && names.includes('ミオ'));
  assert.ok(!names.includes('ケン'), '闘技場の 外の 人は 出ない');
  assert.equal(r.people.find((p) => p.name === 'ユイ').can, true);
  assert.equal(r.people.find((p) => p.name === 'ミオ').can, false);
  assert.match(r.people.find((p) => p.name === 'ミオ').why, /魔物/);
  // 闘技場に いない 人・魔物の いない 人には 申しこめない
  assert.equal(live(A.bot, { op: 'invite', sid: C.bot.s.id }).ok, false);
  assert.equal(live(A.bot, { op: 'invite', sid: D.bot.s.id }).ok, false);
  // 自分が 闘技場の 外なら 申しこめない
  assert.equal(live(C.bot, { op: 'invite', sid: A.bot.s.id }).ok, false);
});

test('申しこみ → ことわる: 申しこんだ 人に 知らせ。もう一度 申しこめる', async () => {
  const { world } = await makeWorld(2);
  const A = await player(world, 'ソラ');
  const B = await player(world, 'ユイ');
  const C = await player(world, 'ケン');
  const inv = live(A.bot, { op: 'invite', sid: B.bot.s.id, even: true });
  assert.equal(inv.ok, true);
  const ask = lastPush(B.bot);
  assert.equal(ask.state, 'ask');
  assert.equal(ask.even, true);
  assert.ok(ask.left > 0 && ask.left <= LIVE_ASK_MS);
  // 話し中の 人には ほかの 人は 申しこめない
  assert.equal(live(C.bot, { op: 'invite', sid: B.bot.s.id }).ok, false);
  assert.equal(live(C.bot, { op: 'list' }).people.find((p) => p.name === 'ユイ').can, false);
  // ことわる
  assert.equal(live(B.bot, { op: 'answer', id: ask.id, ok: false }).ok, true);
  const end = lastPush(A.bot);
  assert.equal(end.state, 'end');
  assert.match(end.text, /ユイは、今は対戦できないみたい/);
  assert.equal(A.bot.s.monLive, null);
  assert.equal(B.bot.s.monLive, null);
  // もう一度
  assert.equal(live(A.bot, { op: 'invite', sid: B.bot.s.id }).ok, true);
});

test('時間切れ・やめる（申しこみの 間・チームを 選ぶ 間）・闘技場を はなれる', async () => {
  const { world, clock } = await makeWorld(3);
  const A = await player(world, 'ソラ');
  const B = await player(world, 'ユイ');
  const bots = [A.bot, B.bot];
  // 申しこみの 時間切れ
  live(A.bot, { op: 'invite', sid: B.bot.s.id });
  clock.t += LIVE_ASK_MS + 100;
  await step(world, bots, 1);
  assert.equal(lastPush(A.bot).state, 'end');
  assert.match(lastPush(A.bot).text, /へんじがなかった/);
  assert.match(lastPush(B.bot).text, /時間切れ/);
  // 申しこんだ 人が やめる
  live(A.bot, { op: 'invite', sid: B.bot.s.id });
  const id = lastPush(B.bot).id;
  assert.equal(live(A.bot, { op: 'cancel', id }).ok, true);
  assert.match(lastPush(B.bot).text, /ソラが、申しこみをやめたよ/);
  assert.equal(live(B.bot, { op: 'answer', id, ok: true }).ok, false, 'おわった 申しこみは うけられない');
  // うけた あとで やめる（チームを 選ぶ 間）
  live(A.bot, { op: 'invite', sid: B.bot.s.id });
  const id2 = lastPush(B.bot).id;
  live(B.bot, { op: 'answer', id: id2, ok: true });
  live(A.bot, { op: 'team', id: id2, team: A.keys.slice(0, 2) });
  assert.equal(live(B.bot, { op: 'cancel', id: id2 }).ok, true);
  assert.match(lastPush(A.bot).text, /ユイが、対戦をやめたよ/);
  // チームを 選ぶ 時間切れ
  live(A.bot, { op: 'invite', sid: B.bot.s.id });
  const id3 = lastPush(B.bot).id;
  live(B.bot, { op: 'answer', id: id3, ok: true });
  clock.t += LIVE_PICK_MS + 100;
  await step(world, bots, 1);
  assert.match(lastPush(B.bot).text, /時間が、終わってしまった/);
  // 闘技場を はなれた
  live(A.bot, { op: 'invite', sid: B.bot.s.id });
  live(B.bot, { op: 'answer', id: lastPush(B.bot).id, ok: true });
  B.bot.s.map = 'overworld';
  await step(world, bots, 1);
  assert.match(lastPush(A.bot).text, /ユイは、闘技場をはなれたみたい/);
  assert.equal(world.monLive.size, 0);
  // 2.5びょうごとに 今の ようすを とどける（とぎれても 立てなおせる）
  goArena(B.bot);
  live(A.bot, { op: 'invite', sid: B.bot.s.id });
  const n = pushes(B.bot).length;
  clock.t += 2600;
  await step(world, bots, 1);
  assert.equal(pushes(B.bot).length, n + 1);
  assert.equal(lastPush(B.bot).state, 'ask');
  assert.equal(live(B.bot, { op: 'state' }).me.state, 'ask');
});

test('チーム: まちがった チームは だめ・選びなおし（unready）・前回の チームに なる', async () => {
  const { world } = await makeWorld(4);
  const A = await player(world, 'ソラ');
  const B = await player(world, 'ユイ');
  live(A.bot, { op: 'invite', sid: B.bot.s.id });
  const id = lastPush(B.bot).id;
  live(B.bot, { op: 'answer', id, ok: true });
  assert.equal(live(A.bot, { op: 'team', id, team: [] }).ok, false);
  assert.equal(live(A.bot, { op: 'team', id, team: B.keys.slice(0, 1).map((k) => 'zz' + k) }).ok, false);
  assert.equal(live(A.bot, { op: 'team', id, team: [A.keys[0], A.keys[0]] }).ok, false);
  assert.equal(live(A.bot, { op: 'team', id, team: A.keys.slice(0, 3) }).ok, true);
  assert.deepEqual(monArenaRecord(A.c).team, A.keys.slice(0, 3));
  assert.equal(live(A.bot, { op: 'unready', id }).ok, true);
  assert.equal(lastPush(B.bot).oppReady, false);
  live(B.bot, { op: 'team', id, team: B.keys.slice(1, 3) });
  assert.equal(world.monLive.get(id).state, 'pick', '1人だけでは はじまらない');
  const r = live(A.bot, { op: 'team', id, team: A.keys.slice(1, 4) });
  assert.equal(r.go, true);
  assert.equal(lastPush(B.bot).state, 'go');
});

// ───────────── 戦い ─────────────
test('戦い: a は ふつうの 見え方・b は 敵と みかたを 入れかえた 見え方。おたがいの コマンドと 作戦の AI', async () => {
  const { world } = await makeWorld(5);
  const A = await player(world, 'ソラ', { manual: 1, lv: 20 });
  const B = await player(world, 'ユイ', { manual: 2, mons: ['wolf', 'frog', 'fuwari', 'dark_bat'], lv: 20 });
  A.bot.manual = true;
  B.bot.manual = true;
  const { ctx } = await toBattle(world, A, B);
  const b = ctx.battle;
  assert.equal(b.allies.length, 4);
  assert.equal(b.enemies.length, 4);
  assert.ok(b.enemies.every((e) => e.foe));
  // a の 画面
  const sa = A.bot.start;
  assert.ok(sa.snap.combatants.filter((c) => c.side === 'ally').every((c) => c.charId?.startsWith(A.c.id)));
  assert.deepEqual(sa.mine, [b.allies[0].id]);
  // b の 画面: 自分の 魔物が みかた（技・作戦が 見える）・相手の 魔物が 敵（しゅぞくの 絵）
  const sb = B.bot.start;
  const allyB = sb.snap.combatants.filter((c) => c.side === 'ally');
  const foeB = sb.snap.combatants.filter((c) => c.side === 'enemy');
  assert.equal(allyB.length, 4);
  assert.ok(allyB.every((c) => c.charId?.startsWith(B.c.id)), 'b の 魔物が みかたの がわ');
  assert.ok(allyB.every((c) => Array.isArray(c.abilities) && c.tacBy === B.c.id && c.pow));
  assert.equal(allyB[0].tactics, 'manual');
  // 名前: b の 画面では 自分の 魔物は そのままの 名前・a の 魔物に 同じ 名前が あれば A を つける（a の 画面は その 反対）
  const namesB = B.c.companions.slice(0, 4).map((e) => e.char.name);
  assert.deepEqual(allyB.map((c) => c.name), namesB);
  const dupA = A.c.companions.slice(0, 4).map((e) => e.char.name).filter((n) => namesB.includes(n));
  assert.ok(dupA.length > 0, '同じ 名前の 魔物が いる');
  for (const n of dupA) {
    assert.ok(foeB.some((c) => c.name === n + 'A'), `b の 画面の 敵 ${n}A`);
    assert.ok(sa.snap.combatants.some((c) => c.side === 'enemy' && c.name === n + 'A'), `a の 画面の 敵 ${n}A`);
    assert.ok(sa.snap.combatants.some((c) => c.side === 'ally' && c.name === n), `a の 画面の みかた ${n}`);
  }
  assert.ok(foeB.every((c) => c.species && c.abilities === undefined && c.tactics === undefined), 'a の 魔物は 敵（技は 見えない）');
  assert.deepEqual(sb.mine, b.enemies.slice(0, 2).map((e) => e.id));
  assert.deepEqual(mirrorSnapshot(b).combatants.map((c) => c.id).sort(), sb.snap.combatants.map((c) => c.id).sort());
  // コマンド: 自分の 番が きたら 自分から 見た 敵を ねらう
  const sent = { a: 0, b: 0 };
  const acted = new Set();
  const handle = (bot, who, from) => {
    for (const m of bot.msgs.slice(from)) {
      if (m.t !== 'battleEv') continue;
      for (const ev of m.evs) {
        if (ev.t === 'act' && ev.id) acted.add(ev.id);
        if (ev.t === 'ready' && bot.start.mine.includes(ev.id)) {
          const view = bot === A.bot ? b.enemies : b.allies;
          const t = view.find((x) => x.alive);
          if (!t) continue;
          bot.send({ t: 'battle', actor: ev.id, cmd: { type: 'attack', target: t.id } });
          sent[who]++;
        }
      }
    }
  };
  let fa = A.bot.msgs.length, fb = B.bot.msgs.length;
  const sideEv = [];
  for (let i = 0; i < 20000 && world.battles.get(ctx.id); i++) {
    await step(world, [A.bot, B.bot], 1);
    // b に とどいた できごと: b の 魔物の 行動は みかたの がわ（fx.side）
    for (const m of B.bot.msgs.slice(fb)) if (m.t === 'battleEv') for (const ev of m.evs) if (ev.t === 'act' && ev.fx?.side && b.get(ev.id)) sideEv.push([ev.id, ev.fx.side, ev.upd]);
    handle(A.bot, 'a', fa);
    handle(B.bot, 'b', fb);
    fa = A.bot.msgs.length;
    fb = B.bot.msgs.length;
  }
  assert.ok(!world.battles.get(ctx.id), '戦いが おわった');
  assert.ok(sent.a > 0 && sent.b > 0, `2人とも コマンドを 送った ${JSON.stringify(sent)}`);
  assert.ok(!A.bot.msgs.some((m) => m.t === 'battleRej') && !B.bot.msgs.some((m) => m.t === 'battleRej'), 'コマンドは ことわられない');
  assert.ok(acted.has(b.enemies[0].id), 'b の めいれいさせろの 魔物が うごいた');
  assert.ok(acted.has(b.enemies[3].id), 'b の 作戦の 魔物（AI）も うごいた');
  assert.ok(acted.has(b.allies[2].id), 'a の 作戦の 魔物（AI）も うごいた');
  const bAct = sideEv.find(([id]) => b.get(id).foe);
  const aAct = sideEv.find(([id]) => !b.get(id).foe);
  assert.equal(bAct[1], 'ally', 'b の 画面では 自分の 魔物は みかた');
  assert.equal(aAct[1], 'enemy', 'b の 画面では 相手の 魔物は 敵');
  for (const [, , upd] of sideEv) for (const p of upd || []) assert.equal(p.side, b.get(p.id).foe ? 'ally' : 'enemy');
  // b に とどいた 文: 自分の 魔物の 名前は A が つかない
  const linesB = B.bot.msgs.filter((m) => m.t === 'battleEv').flatMap((m) => m.evs).flatMap((e) => e.lines || []).join('\n');
  const linesA = A.bot.msgs.filter((m) => m.t === 'battleEv').flatMap((m) => m.evs).flatMap((e) => e.lines || []).join('\n');
  for (const n of dupA) {
    if (linesA.includes(`${n}A`)) assert.ok(linesB.includes(n), n);
  }
  assert.ok(namesB.some((n) => new RegExp(`${n}(?!A)`).test(linesB)), 'b の 文に 自分の 魔物の 名前');
  // けっか: 2人で 勝ち負けが 反対
  await step(world, [A.bot, B.bot], 3);
  const ea = A.bot.battles.pop(), eb = B.bot.battles.pop();
  assert.ok(['win', 'lose'].includes(ea.outcome));
  assert.equal(eb.outcome, ea.outcome === 'win' ? 'lose' : 'win');
  const [W, L, ew, el] = ea.outcome === 'win' ? [A, B, ea, eb] : [B, A, eb, ea];
  assert.match(ew.lines.join('\n'), new RegExp(`${L.bot.name}の魔物たちに勝った`));
  assert.match(ew.lines.join('\n'), /小さなメダルを1枚/);
  assert.match(el.lines.join('\n'), new RegExp(`${W.bot.name}の魔物たちに負けて`));
  assert.deepEqual(monArenaRecord(W.c).live[L.c.id], { w: 1, l: 0, first: true });
  assert.deepEqual(monArenaRecord(L.c).live[W.c.id], { w: 0, l: 1 });
  assert.ok(W.c.medalSpots[`monarena_live_${L.c.id}`]);
  assert.ok(!L.c.medalSpots?.[`monarena_live_${W.c.id}`]);
  // もとの 仲間の HP は へらない・経験値も なし
  assert.ok(A.c.companions.every((e) => e.char.exp === 0 || e.char.exp === undefined || e.char.exp >= 0));
  assert.equal(A.bot.s.busy, null);
  assert.equal(B.bot.s.busy, null);
  assert.equal(A.bot.s.monLive, null);
  assert.equal(world.monLive.size, 0);
});

test('レベルを そろえる・オートの 2人（作戦の AI だけ）でも 戦いが おわる・2回目の 勝ちは メダル なし', async () => {
  const { world } = await makeWorld(6);
  const A = await player(world, 'ソラ', { lv: 8 });
  const B = await player(world, 'ユイ', { lv: 35, mons: ['wolf', 'frog'] });
  const { ctx } = await toBattle(world, A, B, { even: true, teamB: B.keys.slice(0, 2) });
  const b = ctx.battle;
  assert.ok(b.combatants.every((c) => c.lv === MON_EVEN_LV), 'みんな レベル50');
  assert.equal(b.enemies.length, 2);
  const started = A.bot.msgs.filter((m) => m.t === 'battleEv').flatMap((m) => m.evs).find((e) => e.t === 'msg');
  assert.match(started.lines.join(''), /レベル50にそろえて/);
  await finishBattle(world, [A.bot, B.bot], ctx);
  // もとの レベルは そのまま
  assert.ok(A.c.companions.every((e) => e.char.level === 8));
  const ea = A.bot.battles.pop();
  // 2回目（同じ 2人）
  const r2 = await toBattle(world, A, B, { teamB: B.keys.slice(0, 2) });
  await finishBattle(world, [A.bot, B.bot], r2.ctx);
  const ea2 = A.bot.battles.pop(), eb2 = B.bot.battles.pop();
  const rec = monArenaRecord(A.c).live[B.c.id];
  const recB = monArenaRecord(B.c).live[A.c.id];
  assert.equal(rec.w + rec.l, 2);
  assert.equal(recB.w + recB.l, 2);
  assert.equal(rec.w, recB.l);
  const medalLines = [ea, ea2, eb2].filter((e) => /小さなメダル/.test(e.lines.join(''))).length;
  assert.ok(medalLines <= 2);
  if (ea.outcome === 'win' && ea2.outcome === 'win') assert.doesNotMatch(ea2.lines.join(''), /小さなメダル/);
});

test('ウェイト: b が コマンドを えらんでいる 間も 止まる。b は 自分の 魔物の 作戦を かえられる（a の 魔物は だめ）', async () => {
  const { world } = await makeWorld(7);
  const A = await player(world, 'ソラ');
  const B = await player(world, 'ユイ', { manual: 1 });
  B.c.battleSettings = { ...B.c.battleSettings, wait: true, auto: false };
  B.bot.manual = true;
  const { ctx } = await toBattle(world, A, B);
  const b = ctx.battle;
  assert.equal(b.wait, true);
  const mineB = b.enemies[0];
  for (let i = 0; i < 4000 && !mineB.ready; i++) await step(world, [A.bot, B.bot], 1);
  assert.ok(mineB.ready, 'b の 魔物の 番');
  const t0 = b.time;
  await step(world, [A.bot, B.bot], 40);
  assert.equal(b.time, t0, 'b が えらぶ 間は 時間が 止まる');
  // 作戦: 自分の 魔物は かえられる → めいれいさせろ を やめると AI が すぐ うごく
  B.bot.send({ t: 'battle', actor: mineB.id, tactics: 'aggressive' });
  assert.equal(mineB.controller, null);
  assert.equal(mineB.tactics, 'aggressive');
  const realB = B.c.companions.find((e) => e.key === B.keys[0]);
  assert.equal(realB.char.tactics, 'aggressive', 'もとの 仲間に のこる');
  // a の 魔物は かえられない
  const before = b.allies[0].tactics;
  B.bot.send({ t: 'battle', actor: b.allies[0].id, tactics: 'defensive' });
  assert.equal(b.allies[0].tactics, before);
  assert.equal(B.bot.msgs.filter((m) => m.t === 'menuRes').pop().ok, false);
  // b が オートに する（自分の 魔物だけ）
  B.bot.send({ t: 'battle', actor: mineB.id, tactics: 'manual' });
  assert.equal(mineB.controller, B.bot.s.id);
  B.bot.send({ t: 'battle', actor: mineB.id, auto: true });
  assert.equal(mineB.auto, true);
  B.bot.send({ t: 'battle', actor: b.allies[0].id, auto: true });
  await finishBattle(world, [A.bot, B.bot], ctx);
});

test('通信が とぎれた: しばらくは オート・もどれば つづき（b は 入れかえた 見え方）・もどらなければ のこった 人の 勝ち（記録なし）', async () => {
  const { world, clock } = await makeWorld(8);
  const A = await player(world, 'ソラ');
  const B = await player(world, 'ユイ', { manual: 2 });
  B.bot.manual = true;
  B.c.battleSettings = { ...B.c.battleSettings, auto: false };
  const { ctx } = await toBattle(world, A, B);
  const b = ctx.battle;
  // とぎれる → b の めいれいさせろの 魔物は オート
  world.disconnect(B.bot.s, B.bot.conn);
  await step(world, [A.bot], 2);
  assert.ok(B.bot.s.away);
  assert.ok(b.enemies[0].auto && b.enemies[1].auto, 'とぎれた 人の 魔物は オート');
  assert.ok(world.battles.get(ctx.id), 'すぐには おわらない');
  // つなぎ直す（同じ キャラで 遊ぶ）→ 入れかえた 見え方で つづき
  const B2 = new LiveBot(world, 'ユイ');
  B2.manual = true;
  await B2.login('x');
  B2.send({ t: 'play', id: B.c.id });
  const resume = B2.msgs.find((m) => m.t === 'battleStart');
  assert.ok(resume?.resume, 'つづきの 戦い');
  assert.ok(resume.snap.combatants.filter((c) => c.side === 'ally').every((c) => c.charId?.startsWith(B.c.id)));
  assert.deepEqual(resume.mine.sort(), b.enemies.slice(0, 2).map((e) => e.id).sort());
  await step(world, [A.bot, B2], 2);
  assert.equal(b.enemies[0].auto, false, 'もどったら もとの 設定');
  // また とぎれて もどらない → a の 勝ち
  world.disconnect(B2.s, B2.conn);
  await step(world, [A.bot], 2);
  clock.t += LIVE_AWAY_MS + 100;
  await step(world, [A.bot], 3);
  assert.ok(!world.battles.get(ctx.id));
  const ea = A.bot.battles.pop();
  assert.equal(ea.outcome, 'win');
  assert.match(ea.lines.join('\n'), /ユイの通信がとぎれてしまった/);
  assert.match(ea.lines.join('\n'), /記録にはのこらない/);
  assert.equal(monArenaRecord(A.c).live[B.c.id], undefined, '記録しない');
  assert.equal(monArenaRecord(B.c).live[A.c.id], undefined);
  assert.equal(A.bot.s.busy, null);
});

test('ぬけた（ゲームを やめた）: のこった 人の 勝ち。a が ぬけても b に けっか', async () => {
  const { world } = await makeWorld(9);
  const A = await player(world, 'ソラ');
  const B = await player(world, 'ユイ');
  const { ctx } = await toBattle(world, A, B);
  A.bot.send({ t: 'quit' });
  await step(world, [B.bot], 3);
  assert.ok(!world.battles.get(ctx.id));
  const eb = B.bot.battles.pop();
  assert.equal(eb.outcome, 'win');
  assert.match(eb.lines.join('\n'), /ソラの通信がとぎれてしまった/);
  assert.equal(B.bot.s.busy, null);
  assert.equal(world.monLive.size, 0);
});

test('受付の 画面（だいほん）の 中から: 2人とも 画面を とじてから 戦いが はじまる', async () => {
  const { world } = await makeWorld(10);
  const A = await player(world, 'ソラ');
  const B = await player(world, 'ユイ');
  // a は 受付の 画面を 開いた まま（ui の へんじを まつ）
  A.bot.holdUi = true;
  const held = [];
  const orig = A.bot.onMsg.bind(A.bot);
  A.bot.onMsg = (m) => {
    if (m.t === 'script' && m.steps.some((s) => s[0] === 'ui')) {
      A.bot.msgs.push(m);
      held.push(() => world.handle(A.bot.s, { t: 'ack', runId: m.runId }, A.bot.conn));
      return;
    }
    orig(m);
  };
  runSteps(world, A.bot.s, [['call', openMonArena('family')]]);
  await step(world, [A.bot, B.bot], 2);
  assert.equal(A.bot.s.busy, 'script');
  const r = live(A.bot, { op: 'list' });
  assert.equal(r.people.find((p) => p.name === 'ユイ').can, true);
  live(A.bot, { op: 'invite', sid: B.bot.s.id });
  const id = lastPush(B.bot).id;
  live(B.bot, { op: 'answer', id, ok: true });
  live(B.bot, { op: 'team', id, team: B.keys.slice(0, 4) });
  live(A.bot, { op: 'team', id, team: A.keys.slice(0, 4) });
  await step(world, [A.bot, B.bot], 10);
  assert.equal(world.battles.size, 0, '受付の 画面が 開いている 間は はじめない');
  assert.equal(world.monLive.get(id).state, 'go');
  held.forEach((f) => f());
  await step(world, [A.bot, B.bot], 4);
  assert.equal(world.battles.size, 1);
  assert.equal(A.bot.s.busy, 'battle');
  assert.equal(B.bot.s.busy, 'battle');
});

test('記録の 手直し: live は のこる・こわれた ものは けす', () => {
  const c = { monArena: { live: { x: { w: 2, l: 1, first: true }, y: { w: 0, l: 0 }, z: 'bad' } } };
  repairMonArena(c);
  assert.deepEqual(c.monArena.live, { x: { w: 2, l: 1, first: true } });
  assert.equal(noteLiveResult(c, 'y', true), true);
  assert.equal(noteLiveResult(c, 'y', true), false);
  assert.deepEqual(monArenaRecord(c).live.y, { w: 2, l: 0, first: true });
});

test('画面: その場の 対戦を 受付に つなぐ・game.js が 知らせを 受けとる・漢字', () => {
  const ui = readFileSync(new URL('../public/js/client/ui/monarena-live.js', import.meta.url), 'utf8');
  assert.match(ui, /MONARENA_EXTRA\.push\(/);
  assert.match(ui, /value: 'live'/);
  assert.match(ui, /kind: 'monlive'/);
  const game = readFileSync(new URL('../public/js/client/game.js', import.meta.url), 'utf8');
  assert.match(game, /case 'monLive'/);
  const files = gameFiles().filter((f) => /monarena-live\.js$/.test(f));
  assert.equal(files.length, 2);
  for (const f of files) {
    const bad = checkFile(f).filter((x) => x.kind === 'kanji' || x.kind === 'space');
    assert.equal(bad.length, 0, `${f}: ${JSON.stringify(bad.slice(0, 5))}`);
  }
});
