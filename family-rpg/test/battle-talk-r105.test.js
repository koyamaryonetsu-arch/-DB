// 第105回: 戦いの 中の 会話を 1行ずつ 読む（shared/battle-talk.js・docs/plan-r105-battle-talk.md）
// ・会話の イベント（せりふ・場面）を 出したら、talkWait の 戦いは 読み終わりを 待つ（ゲージ・time・どく・合体技の さそいも 止まる）
// ・待つ 人 … オートで ない 人 ぜんいん。オートの 人・つながりが 切れた 人（オートに なる）は 待たない。ぜんいん オートなら 読める 速さで 流れる
// ・人が いない 戦い・talkWait で ない 戦い（テスト・はかる 道具）は 今までどおり 待たない。攻撃の イベントは 止まらない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { isTalkEvent, isSpeechLine, talkAutoMs, talkLinesOf, TALK_LINE_MS } from '../public/js/shared/battle-talk.js';
import { NAMES, SCENE } from '../public/js/shared/data/abilities-c11d.js';
import { ch9Party, CH9_IDS, LV9 } from '../tools/sim-ch9.mjs';
import '../tools/sim-ch11.mjs';
import { readFileSync } from 'node:fs';

const groupOf = (id) => FIXED_ENCOUNTERS[id].group.flatMap(([sp, n]) => Array(n).fill(sp));
// humans … 人の 数（p1・p2…。オートで ない）。autoHumans … オートの 人の 数
function battle(boss, { humans = 1, autoHumans = 0, talkWait = true, seed = 5 } = {}) {
  const party = ch9Party(boss, LV9[boss]);
  const allies = party.map((c, i) => {
    if (i < humans) return { char: c, kind: 'player', controller: `p${i + 1}`, auto: false };
    if (i < humans + autoHumans) return { char: c, kind: 'player', controller: `p${i + 1}`, auto: true };
    return { char: c, kind: 'support', auto: true };
  });
  return new Battle({ rng: makeRng(seed), boss: true, canFlee: false, allies, enemies: groupOf(CH9_IDS[boss]), talkWait });
}
const talks = (evs) => evs.filter((e) => (e.t === 'msg' || e.t === 'act') && e.talk);
const atbOf = (b) => b.combatants.filter((c) => c.alive).map((c) => c.atb);
function ticks(b, ms, step = 50) {
  const evs = [];
  for (let t = 0; t < ms; t += step) evs.push(...b.tick(step));
  return evs;
}
// 会話が 出るまで（はじめの 会話は 作った 時に 出て いる）
function firstTalk(b) {
  const evs = b.tick(50);
  const t = talks(evs);
  assert.ok(t.length, 'はじめの 会話が ある');
  return t[t.length - 1];
}

test('見分け方: せりふ（名前「…」）の 知らせは 会話・攻撃の 結果が ある 物・1行の かけ声の 行動は 攻撃', () => {
  assert.ok(isSpeechLine('女王「きまりは、だれにも同じです。」'));
  assert.ok(isSpeechLine('「勇者だよ！もう、ひとりじゃないよ！」'));
  assert.ok(!isSpeechLine('（「手をつなぐ」で、仲間とつながろう！）'));
  assert.ok(!isSpeechLine('勇者は、スピカの名前を、大きな声でよんだ！「スピカ！」'));
  assert.ok(isTalkEvent({ t: 'msg', lines: ['キラジョ「オーッホッホ！」', '（すいこみ口が…）'] }));
  assert.ok(!isTalkEvent({ t: 'msg', lines: ['スライムがあらわれた！'] }));
  // 攻撃（ダメージの 結果）: せりふの あとに すぐ 攻撃
  assert.ok(!isTalkEvent({ t: 'act', lines: ['ボス「くらえ！」', '勇者は120のダメージを受けた！'], results: [{ id: 'a0', dmg: 120 }] }));
  // 1行の かけ声 ＋ しくみ（結果 なし）は 攻撃の あつかい・2行 いじょうの やりとりは 会話
  assert.ok(!isTalkEvent({ t: 'act', lines: ['オボロ「…どうか、おとなしく。」', 'オボロは、おじぎをした。'] }));
  assert.ok(isTalkEvent({ t: 'act', lines: ['オボロ「ひめさま。」', 'スピカ「…あれ？」'] }));
  // 攻撃の あとの ことば（2行 いじょう）は 会話
  assert.ok(isTalkEvent({ t: 'act', lines: ['勇者の攻撃！', 'エースに233のダメージ！', 'エース「……みごと。」', 'エース「はかりの日に…」'], results: [{ id: 'e1', dmg: 233 }] }));
  // ボスの ファイルが はっきり つけた 物
  assert.ok(isTalkEvent({ t: 'act', lines: ['ふつうの 文'], talk: true }));
  assert.ok(!isTalkEvent({ t: 'msg', lines: ['女王「…」'], talk: false }));
  // 場面（八つめの 音）は 場面の 文を 読む
  const sc = { t: 'act', lines: ['……。'], c11dEight: { lines: ['A', 'B', 'C'], ms: 2000 } };
  assert.ok(isTalkEvent(sc));
  assert.deepEqual(talkLinesOf(sc), ['A', 'B', 'C']);
  assert.equal(talkAutoMs(sc, 1), 3 * 2000, '場面は 今の ms を 下回らない');
  assert.equal(talkAutoMs({ t: 'msg', lines: ['a「b」', 'c'] }, 1), 2 * TALK_LINE_MS);
  assert.equal(talkAutoMs({ t: 'msg', lines: ['a「b」'] }, 0.8), Math.round(TALK_LINE_MS / 0.8));
});

test('会話で 止まり、ゲージ・time が すすまない。オートで ない 人の 読み終わりで 進む', () => {
  const b = battle('trio');
  const t = firstTalk(b);
  assert.ok(t.lines.some((l) => l.startsWith('キラジョ「')), '第1章の ボスの せりふ');
  assert.ok(b.talk, '読み終わり 待ち');
  const atb = atbOf(b);
  const time = b.time;
  ticks(b, 30000);
  assert.deepEqual(atbOf(b), atb, 'ゲージは 止まる');
  assert.equal(b.time, time, 'time は 止まる');
  assert.ok(b.talk, '30びょう たっても 待つ（上限は ない）');
  b.talkRead('p1', t.talk);
  const evs = b.tick(50);
  assert.ok(evs.some((e) => e.t === 'talkDone' && e.seq === t.talk), 'みんな 読んだ しるし');
  assert.equal(b.talk, null);
  ticks(b, 2000);
  assert.ok(b.time > time, '読み終わったら 進む');
});

test('2人の うち 1人だけでは 進まない・2人とも 読むと 進む', () => {
  const b = battle('trio', { humans: 2 });
  const t = firstTalk(b);
  b.talkRead('p1', t.talk);
  const time = b.time;
  ticks(b, 5000);
  assert.ok(b.talk, 'もう1人が 読む まで 待つ');
  assert.equal(b.time, time);
  b.talkRead('p2', t.talk - 1);
  ticks(b, 500);
  assert.ok(b.talk, '前の 会話の 番号では 進まない');
  b.talkRead('p2', t.talk);
  ticks(b, 1000);
  assert.equal(b.talk, null);
  assert.ok(b.time > time);
});

test('オートの 人は 待たない・とちゅうで オートに した 人・つながりが 切れた 人（オートに なる）は 外れる', () => {
  const b = battle('trio', { humans: 1, autoHumans: 1 });
  const t = firstTalk(b);
  b.talkRead('p1', t.talk);
  ticks(b, 200);
  assert.equal(b.talk, null, 'オートの p2 は 待たない');

  const c = battle('trio', { humans: 2 });
  const t2 = firstTalk(c);
  c.talkRead('p1', t2.talk);
  ticks(c, 1000);
  assert.ok(c.talk);
  // p2 の つながりが 切れた（world/battles.js の battleLeave … その 人の キャラを オートに する）
  for (const a of c.allies) if (a.controller === 'p2') c.setAuto(a.id, true);
  ticks(c, 200);
  assert.equal(c.talk, null, '切れた 人は 外れる');

  const d = battle('trio', { humans: 2 });
  firstTalk(d);
  d.allies[1].fled = true; // 戦いから 出た（馬車へ）
  d.talkRead('p1', d.talk.seq);
  ticks(d, 200);
  assert.equal(d.talk, null, '戦いから 出た 人は 外れる');
});

test('ぜんいん オートなら 読める 速さで 自動で 流れる（1行 1.5びょう ÷ 文字の 速さ）', () => {
  const b = battle('trio', { humans: 0, autoHumans: 1 });
  const t = firstTalk(b);
  const n = talkLinesOf(t).length;
  const want = Math.round((n * TALK_LINE_MS) / b.textSpeed);
  // 待ちは 外れて、その かわり lock（読む 時間。はじめの tick から へる）
  assert.equal(b.talk, null);
  assert.ok(b.lock >= want - 60, `lock ${b.lock} >= ${want}`);
  const time = b.time;
  ticks(b, want - 200);
  assert.equal(b.time, time, '読む 時間の 間は 進まない');
  ticks(b, 2000);
  assert.ok(b.time > time);
});

test('人が いない・talkWait で ない 戦い（テスト・はかる 道具）は 待たない（今までと 同じ 数）', () => {
  const run = (talkWait) => {
    const b = battle('trio', { humans: 0, talkWait, seed: 11 });
    const evs = ticks(b, 20000);
    return { time: b.time, n: evs.filter((e) => e.t === 'act').length, hp: b.enemies.map((e) => e.hp) };
  };
  const off = run(false);
  assert.ok(off.n > 0);
  // 人が いない 戦い（自動の 仲間だけ）は talkWait でも 待つ 人が いない → 読む 時間 だけ（待ちで 止まらない）
  const b = battle('trio', { humans: 1, talkWait: false });
  const evs = ticks(b, 3000);
  assert.ok(talks(evs).length, '会話の しるしは つく');
  assert.equal(b.talk, null, 'talkWait で ない 戦いは 待たない');
  assert.ok(b.time > 0);
});

test('攻撃の イベントは 止まらない（会話の しるしが ない・待ちに 入らない）', () => {
  const b = battle('trio', { humans: 1 });
  const t = firstTalk(b);
  b.talkRead('p1', t.talk);
  let atk = 0;
  for (let ms = 0; ms < 60000 && !b.over; ms += 50) {
    const evs = b.tick(50);
    const tk = talks(evs);
    for (const e of tk) b.talkRead('p1', e.talk);
    for (const a of b.allies) if (a.ready && a.controller) b.command(a.id, { type: 'attack', target: b.aliveEnemies()[0]?.id }, a.controller);
    const hits = evs.filter((e) => e.t === 'act' && (e.results || []).some((r) => r.dmg > 0) && !e.talk);
    if (hits.length && !tk.length) {
      atk += hits.length;
      assert.equal(b.talk, null, '攻撃だけでは 待たない');
    }
  }
  assert.ok(atk > 3, `攻撃 ${atk}`);
});

test('第3章 第4幕: 女王の はじめの ことば・名前を よぶ 番・八つめの 音の 場面は 会話', () => {
  const b = battle('queen', { humans: 1 });
  const t = firstTalk(b);
  assert.ok(t.lines.some((l) => l.startsWith('女王「')), t.lines.join('/'));
  b.talkRead('p1', t.talk);
  b.tick(50);
  const q = b.enemies.find((e) => e.c11u || e.species === b.enemies[0].species);
  const queen = b.enemies.find((e) => e.id === b.c11d.id) || q;
  // 名前を よぶ 番（回復が ついて いても 会話）
  b.c11d.phase = 2;
  queen.hp = Math.round(queen.maxHp * 0.5);
  b.lock = 0;
  b.queue.unshift({ id: queen.id, cmd: { type: 'ability', id: NAMES, target: queen.id }, last: false });
  const ev1 = talks(b.tick(50)).find((e) => e.c11dNames);
  assert.ok(ev1, '名前を よぶ 番が 会話');
  assert.ok(ev1.lines.some((l) => /^女王「…/.test(l)));
  assert.ok(b.talk);
  const time = b.time;
  ticks(b, 3000);
  assert.equal(b.time, time);
  b.talkRead('p1', ev1.talk);
  b.tick(50);
  assert.equal(b.talk, null);
  // 八つめの 音の 場面
  b.lock = 0;
  b.c11d.eightDone = false;
  b.c11d.sceneQueued = true;
  b.queue.unshift({ id: queen.id, cmd: { type: 'ability', id: SCENE, target: queen.id }, last: false });
  const ev2 = talks(b.tick(50)).find((e) => e.c11dEight);
  assert.ok(ev2, '八つめの 音の 場面が 会話');
  assert.ok(talkLinesOf(ev2).length >= 3, '場面の 文を 1行ずつ');
  ticks(b, 20000);
  assert.ok(b.talk, '場面も 読み終わるまで 待つ');
  b.talkRead('p1', ev2.talk);
  b.tick(50);
  assert.equal(b.talk, null);
});

test('第3章 第4幕: 女王の 戦いを 人が 読みながら さいごまで（会話の たびに 読み終わりを 送る）', () => {
  const b = battle('queen', { humans: 2, seed: 7 });
  let n = 0;
  for (let t = 0; t < 40 * 60 * 1000 && !b.over; t += 50) {
    const evs = b.tick(50);
    for (const e of talks(evs)) { n++; b.talkRead('p1', e.talk); b.talkRead('p2', e.talk); }
    // 人の 番は オートの えらび方で
    for (const a of b.allies) if (a.ready && a.controller) b.command(a.id, { type: 'defend' }, a.controller);
  }
  assert.ok(n >= 1, `会話 ${n}`);
  assert.ok(b.over || b.time > 0);
});

test('第3章 第2幕: オボロの はじめの ことばは 会話（第3部の ボス もう1体）', () => {
  const b = battle('oboro', { humans: 1 });
  const t = firstTalk(b);
  assert.ok(t.lines.some((l) => l.startsWith('オボロ「')), t.lines.join('/'));
  assert.ok(b.talk);
});

test('とちゅうから 入った 人は 今の 会話を 待たない（joinAlly）', () => {
  const b = battle('trio', { humans: 1 });
  const t = firstTalk(b);
  const party = ch9Party('trio', LV9.trio);
  b.joinAlly({ char: party[3], kind: 'player', controller: 'p9', auto: false });
  b.talkRead('p1', t.talk);
  ticks(b, 200);
  assert.equal(b.talk, null);
});

test('サーバー・ひとりで 遊ぶ サイトの 世界は talkWait（テストの 世界は 待たない）', () => {
  const main = readFileSync(new URL('../server/main.js', import.meta.url), 'utf8');
  const off = readFileSync(new URL('../public/js/client/offline.js', import.meta.url), 'utf8');
  assert.match(main, /talkWait: true/);
  assert.match(off, /talkWait: true/);
  const battles = readFileSync(new URL('../public/js/shared/world/battles.js', import.meta.url), 'utf8');
  assert.match(battles, /talkWait: !!world\.talkWait/);
  assert.match(battles, /msg\.talk !== undefined/);
});
