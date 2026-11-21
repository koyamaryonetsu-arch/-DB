// 第92回 第3便: 前ぶれの 間は、えらぶ 人を 待つ（shared/battle-tell.js）
// ・ボスが こたえの いる 前ぶれ（b.tell）を 出して いる 間、人が 動かす 味方の コマンドの まどが 開いて いると、敵の ゲージは 進まない
// ・1つの まどに つき 20びょうまで・ふつうの 戦いでは 待たない・オートの 味方は 待たない・ウェイトの 設定とは べつ
// ・第3部 第1章の ボス 5体が しるしを 立てる（すいこみ口・やみの いぶき・皿を 見る・大ジャンプ・なぞ・砂・ポチッとね）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { TELL_HOLD_MAX, tellHold } from '../public/js/shared/battle-tell.js';
import { AIM, c9aEffect, c9aAfter, c9Tell, mechaOf, hoshimoriOf } from '../public/js/shared/battle-c9a.js';
import { kingOf, aliveDishes } from '../public/js/shared/battle-c9b.js';
import { nazoOf, mechaOf9c, sandConf } from '../public/js/shared/battle-c9c.js';
import { ch9Party, CH9_IDS, LV9, ch9Run } from '../tools/sim-ch9.mjs';
import { readFileSync } from 'node:fs';

const groupOf = (id) => FIXED_ENCOUNTERS[id].group.flatMap(([sp, n]) => Array(n).fill(sp));
// 1人目だけ 人が 動かす（オートで ない）。のこりは 自動
function battle(boss, { human = true, enemies = null, wait = false } = {}) {
  const party = ch9Party(boss, LV9[boss]);
  const allies = party.map((c, i) => (i === 0 && human
    ? { char: c, kind: 'player', controller: 'p1', auto: false, tactics: 'balanced' }
    : { char: c, kind: 'support', auto: true, tactics: 'balanced' }));
  const b = new Battle({ rng: makeRng(5), boss: !enemies, canFlee: !!enemies, allies, enemies: enemies || groupOf(CH9_IDS[boss]), wait });
  b.flush();
  b.lock = 0;
  return b;
}
// 人の 番が 来て、まだ えらんで いない（コマンドの まどが 開いて いる）
function openWindow(b) {
  const h = b.allies[0];
  h.atb = 100;
  h.ready = true;
  return h;
}
// 敵の ゲージが まんたんに ならない ように 小さく
const lowFoes = (b) => { for (const e of b.enemies) e.atb = 0; };
const foeAtb = (b) => b.aliveEnemies().map((e) => e.atb);
function run(b, ms, step = 100) {
  const evs = [];
  for (let t = 0; t < ms; t += step) {
    b.queue = [];
    b.lock = 0;
    evs.push(...b.tick(step));
  }
  return evs;
}

test('前ぶれの 間は 人の まどが 開いて いると 敵の ゲージが 止まる（味方の ゲージは 進む）・しるし { t: hold }', () => {
  const b = battle('trio');
  const m = mechaOf(b);
  const ev = { lines: [], upd: [], results: [], fx: null };
  c9aEffect(b, m, ABILITIES[AIM], ABILITIES[AIM].effect, ev);
  c9aAfter(b, m, ev);
  assert.equal(b.tell, 'suck', 'すいこみ口が 向いた ＝ 前ぶれ');
  lowFoes(b);
  openWindow(b);
  const helper = b.allies[1];
  helper.atb = 0;
  const before = foeAtb(b);
  const evs = run(b, 3000);
  assert.deepEqual(foeAtb(b), before, '敵の ゲージは 止まる');
  assert.ok(helper.atb > 0, '自動の 味方の ゲージは 進む');
  assert.ok(evs.some((e) => e.t === 'hold' && e.on === true), '画面に「待っているよ」');
  assert.equal(b.holding, true);
  // 人が えらぶと 時は 流れる
  b.allies[0].ready = false;
  const evs2 = run(b, 500);
  assert.ok(foeAtb(b).some((v, i) => v > before[i]), 'えらんだ あとは 敵も 進む');
  assert.ok(evs2.some((e) => e.t === 'hold' && e.on === false));
});

test('1つの まどに つき 待つのは 20びょうまで（席を はなれても 止まらない）', () => {
  assert.equal(TELL_HOLD_MAX, 20000);
  const b = battle('trio');
  b.tell = 'suck';
  lowFoes(b);
  openWindow(b);
  const before = foeAtb(b);
  run(b, TELL_HOLD_MAX - 200);
  assert.deepEqual(foeAtb(b), before, '20びょう までは 止まる');
  // 進みすぎない ように もう一度 小さく
  lowFoes(b);
  const evs = run(b, 1000);
  assert.ok(foeAtb(b).some((v) => v > 0), '20びょうを こえると 時は 流れる');
  assert.ok(evs.some((e) => e.t === 'hold' && e.on === false));
  // 新しい まど（えらんで、また 番が 来た）は また 20びょう 待つ
  b.allies[0].ready = false;
  run(b, 100);
  lowFoes(b);
  openWindow(b);
  run(b, 1000);
  assert.ok(foeAtb(b).every((v) => v === 0), '新しい まどは また 待つ');
});

test('ふつうの 戦い（前ぶれの しるしが ない）では 待たない', () => {
  const b = battle('trio', { enemies: ['c9a_star_wolf'] });
  assert.ok(!b.tell);
  lowFoes(b);
  openWindow(b);
  const evs = run(b, 500);
  assert.ok(foeAtb(b)[0] > 0, '敵の ゲージは 進む');
  assert.ok(!evs.some((e) => e.t === 'hold'));
  assert.equal(tellHold(b, 100), false);
  // 第3部の ボスでも 前ぶれが ない 間は 待たない
  const b2 = battle('trio');
  c9aAfter(b2, mechaOf(b2), { lines: [], upd: [] });
  assert.equal(b2.tell, null);
  lowFoes(b2);
  openWindow(b2);
  run(b2, 500);
  assert.ok(foeAtb(b2).some((v) => v > 0));
});

test('オートの 味方・自動の 仲間だけの ときは 待たない・ウェイトの 設定とは べつ', () => {
  // 人の キャラが オート（完全オート）
  const b = battle('trio', { human: false });
  b.tell = 'suck';
  lowFoes(b);
  b.allies[0].ready = true; // 自動の 人は ready に ならないが、なっても 人で ないので 待たない
  run(b, 500);
  assert.ok(foeAtb(b).some((v) => v > 0), 'オートは 待たない');
  assert.ok(!b.holding);
  // ウェイト（はじめは オフ）: えらんで いる 間は もともと 全部 止まる。待つ しるしは 出さない
  const w = battle('trio', { wait: true });
  w.tell = 'suck';
  lowFoes(w);
  const h = openWindow(w);
  const helper = w.allies[1];
  helper.atb = 0;
  const evs = run(w, 1000);
  assert.ok(foeAtb(w).every((v) => v === 0) && helper.atb === 0, 'ウェイトは みんな 止まる');
  assert.ok(!evs.some((e) => e.t === 'hold'));
  assert.equal(h.tellMs || 0, 0, 'ウェイトで 止まって いる 間は 20びょうを 数えない');
});

test('第3部 第1章の ボス 5体の 前ぶれの しるし（c9Tell）: 出て いる 間だけ', () => {
  // 3人組: すいこみ口が 星の子を 向いた 間
  const t = battle('trio');
  assert.equal(c9Tell(t), null);
  mechaOf(t).c9t.aim = true;
  assert.equal(c9Tell(t), 'suck');
  // ためし: やみの いぶきの ねらいが ある 間
  const h = battle('trial');
  assert.equal(c9Tell(h), null);
  hoshimoriOf(h).c9h.aim = [h.allies[0].id];
  assert.equal(c9Tell(h), 'breath');
  // 大王: 皿を 見て いる（見える とき）・大ジャンプの 前ぶれ
  const k = battle('king');
  const kg = kingOf(k);
  assert.equal(c9Tell(k), null);
  kg.c9k.watch = aliveDishes(k)[0].id;
  assert.equal(c9Tell(k), 'watch');
  kg.c9k.dark = true;
  assert.equal(c9Tell(k), null, 'まっ暗で 見えない 皿は 前ぶれに ならない（答えが わからない）');
  kg.c9k.jumpReady = true;
  assert.equal(c9Tell(k), 'jump');
  // ナゾカケ: なぞが 出て いる 間
  const r = battle('riddle');
  assert.equal(c9Tell(r), null);
  nazoOf(r).c9z.riddle = { text: 'x', choices: ['a', 'b', 'c'], correct: 0 };
  assert.equal(c9Tell(r), 'riddle');
  // メカ: 砂が dizzyAt いか〜落ちきった・ポチッとねの ねらい
  const s = battle('trio2');
  const mc = mechaOf9c(s);
  assert.equal(c9Tell(s), null);
  mc.c9s.grains = sandConf(mc, s).dizzyAt;
  assert.equal(c9Tell(s), 'sand');
  mc.c9s.dizzy = 2;
  assert.equal(c9Tell(s), null, '目を 回して いる 間は ちがう');
  mc.c9s.dizzy = 0;
  mc.c9s.grains = 6;
  mc.c9s.pochiAim = s.allies[0].id;
  assert.equal(c9Tell(s), 'pochi');
});

test('戦いの 中で しるしが 立って 消える（行動の あとに 入れ直す）・計算（sim-ch9）も おなじ 動き', () => {
  const r = ch9Run('trio', LV9.trio, 'know', 11, { react: 5000 });
  assert.ok(['win', 'lose', 'timeout'].includes(r.outcome));
  // 計算の 人も Battle の 待つ しくみを そのまま 使う（計算だけの 待ち方を 作らない）
  const src = readFileSync(new URL('../tools/sim-ch9.mjs', import.meta.url), 'utf8');
  assert.ok(!/tellHold|holding/.test(src), '計算は battle.js の 待ち方を そのまま 使う');
  const bt = readFileSync(new URL('../public/js/shared/battle.js', import.meta.url), 'utf8');
  assert.ok(bt.includes('tellHold(this, dtReal, choosing)'));
});
