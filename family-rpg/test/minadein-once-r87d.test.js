// 2026年11月（第87回 D班）: ミナデインは 戦い 1回に 1度だけ（docs/plan-balance-r87.md の 3-E。家族が えらんだ）
//  ・データの oncePerBattle を しくみ（battle-dual.js の onceUsed）が 見る。ミナデインの id は しくみに 書かない
//  ・数えるのは 出た 時だけ（参加できずに 失敗・MPが 足りずに 出なかった 時は 数えない）。しるしは Battle の dualUsed（戦いの 中だけ）
//  ・2度目は サーバーが ことわる（わけ「ミナデインは1回の戦いに1度だけ」）。命令の 一覧では うすく（client/battle-dual.js）
//  ・ほかの 合体技は 何度でも。次の 戦いでは また 出せる。オート（シミュレーターの えらび方）は 2度 えらばない・ざこには 使わない
//  ・しかけ（台本）で 出す 合体技（cmd.scripted）は 数えない・しばりを 受けない。家族の 命令からは 出せない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { JOBS, JOB_MAX_LEVEL } from '../public/js/shared/data/jobs.js';
import { DUAL_TECHS, dualOnceReason } from '../public/js/shared/data/dual.js';
import { newCharacter, gainExp, expForLevel, fullHeal } from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';
import { onceUsed, onceWorth, performDual } from '../public/js/shared/battle-dual.js';
import { makeRng } from '../public/js/shared/rng.js';
import { dualPlan } from '../tools/sim-ch6.mjs';
import { checkText } from '../tools/kanji-check.mjs';

const MINA = 'dt_minadein';
const REASON = 'ミナデインは1回の戦いに1度だけ';
const master = (c, j) => { c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
const chain = (c, j) => {
  for (const r of JOBS[j].req || []) { master(c, r); chain(c, r); }
  if (JOBS[j].reqSuper) { master(c, 'god_hand'); master(c, 'archmage'); }
};
function mk(job, name, lv = 40) {
  const c = newCharacter({ id: name, name, job: 'warrior' });
  gainExp(c, expForLevel(lv));
  chain(c, job);
  master(c, job);
  c.job = job;
  c.equip.weapon = null;
  fullHeal(c);
  return c;
}
// 勇者 ＋ 3人（みんな 自分が 動かす）。敵は 何も しない・HPが とても 多い
function party({ jobs = ['hero', 'warrior', 'priest', 'mage'], enemies = ['argos'], boss = true, seed = 1, ctl = 's1' } = {}) {
  const allies = jobs.map((j, i) => ({ char: mk(j, `${JOBS[j].name}${i}`), kind: i ? 'support' : undefined, controller: ctl }));
  const b = new Battle({ rng: makeRng(seed), allies, enemies, canFlee: !boss, boss });
  for (const e of b.enemies) {
    e.actions = [{ w: 1, id: 'm_nothing' }];
    e.hp = e.maxHp = 999999;
    e.resist = {};
  }
  for (const a of b.allies) { a.mp = a.maxMp = 999; a.weaponCat = 'sword'; }
  return b;
}
const readyAll = (b) => {
  for (let i = 0; i < 2400 && !b.allies.every((a) => a.ready); i++) b.tick(50);
  return b.allies.every((a) => a.ready);
};
const runUntil = (b, pred, ms = 60000) => {
  const evs = [];
  for (let t = 0; t < ms; t += 50) {
    evs.push(...b.tick(50));
    if (evs.some(pred)) break;
  }
  return evs;
};
const isDual = (e) => e.t === 'act' && e.dual;
const isAct = (id) => (e) => e.t === 'act' && e.id === id;
const cmdOf = (o, target) => ({ type: 'dual', id: o.id, partner: o.partner, partners: o.partners, target });
const minaOpt = (b, a = b.allies[0]) => b.dualOptionsFor(a).find((x) => x.id === MINA);
// ミナデインを 1度 出す（出た できごとを かえす）
function fireMina(b) {
  assert.ok(readyAll(b), 'みんなの 番');
  const o = minaOpt(b);
  assert.ok(o, 'ミナデインを 出せる');
  const r = b.command(b.allies[0].id, cmdOf(o, b.enemies[0].id), 's1');
  assert.ok(r.ok, `出せる ${r.reason || ''}`);
  return runUntil(b, isDual).find(isDual);
}

test('データ: 1度だけの しるし（oncePerBattle）は ミナデインだけ。しくみには ミナデインの id を 書かない・わけの 文は 子ども向け', () => {
  const once = Object.keys(DUAL_TECHS).filter((id) => DUAL_TECHS[id].oncePerBattle);
  assert.deepEqual(once, [MINA]);
  assert.equal(dualOnceReason(MINA), REASON);
  assert.deepEqual(checkText(REASON), [], '使えない 漢字・空白が ない');
  assert.match(DUAL_TECHS[MINA].desc, /1回の戦いに1度だけ/);
  const src = fs.readFileSync(new URL('../public/js/shared/battle-dual.js', import.meta.url), 'utf8');
  assert.ok(!src.includes(MINA), 'battle-dual.js に dt_minadein と 書かない');
});

test('1度 出すと、その 戦いでは もう 出せない（サーバーが わけを つけて ことわる・一覧に 出ない・入りなおした 人にも 伝わる）', () => {
  const b = party();
  const act = fireMina(b);
  assert.equal(act.dual.id, MINA);
  assert.equal(act.dual.once, true, '画面に「出した」を 伝える');
  assert.ok(onceUsed(b, MINA));
  assert.deepEqual(b.snapshot().dualUsed, [MINA], 'とちゅうで 入りなおした 人の 画面にも');
  // 2度目（だれが 出しても）
  assert.ok(readyAll(b));
  assert.equal(minaOpt(b), undefined, '一覧（サーバーの たしかめ）に 出ない');
  const r = b.command(b.allies[0].id, { type: 'dual', id: MINA, partner: b.allies[1].id, partners: b.allies.slice(1).map((a) => a.id), target: b.enemies[0].id }, 's1');
  assert.deepEqual(r, { ok: false, reason: REASON });
  // ちがう 勇者の 系統の 人が 入っても だめ
  const b2 = party({ jobs: ['hero', 'loto_hero', 'priest', 'mage'] });
  fireMina(b2);
  assert.ok(readyAll(b2));
  for (const a of b2.allies) assert.equal(minaOpt(b2, a), undefined, `${a.name}からも 出せない`);
  // キャラにも セーブにも 足さない
  for (const a of b2.allies) assert.ok(!('dualUsed' in a), 'キャラに しるしを 持たない');
});

test('出なかった 時は 数えない（参加できずに 失敗・MPが 足りない）', () => {
  // 参加する 人が ねむって 失敗
  const b = party();
  assert.ok(readyAll(b));
  const o = minaOpt(b);
  assert.ok(b.command(b.allies[0].id, cmdOf(o, b.enemies[0].id), 's1').ok);
  b.allies[2].status.sleep = { left: 99 };
  const ev = runUntil(b, isAct(b.allies[0].id)).find(isAct(b.allies[0].id));
  assert.ok(!ev.dual, '出なかった');
  assert.ok(ev.lines.some((l) => l.includes('参加できなかった')));
  assert.ok(!onceUsed(b, MINA), '数えない');
  delete b.allies[2].status.sleep;
  assert.equal(fireMina(b).dual.id, MINA, 'あとで 出せる');
  // MPが 足りない（出す 前に MPが へった）
  const b3 = party();
  assert.ok(readyAll(b3));
  assert.ok(b3.command(b3.allies[0].id, cmdOf(minaOpt(b3), b3.enemies[0].id), 's1').ok);
  b3.allies[0].mp = 0;
  const ev3 = runUntil(b3, isAct(b3.allies[0].id)).find(isAct(b3.allies[0].id));
  assert.ok(!ev3.dual);
  assert.ok(!onceUsed(b3, MINA), 'MPが 足りない 時も 数えない');
  // MPが 足りない 人は さいしょから 一覧に 出ない（数えない）
  b3.allies[0].mp = 0;
  assert.equal(minaOpt(b3), undefined);
  assert.ok(!onceUsed(b3, MINA));
});

test('よやくで 2つ ならんだ ミナデインは、あとの 方が「1度だけ」で 出ない（数えるのは 1回）', () => {
  const b = party({ jobs: ['hero', 'loto_hero', 'priest', 'mage', 'warrior', 'monk', 'performer', 'jester'] });
  assert.ok(readyAll(b));
  const [h1, h2] = b.allies;
  const o1 = b.dualOptionsFor(h1).find((x) => x.id === MINA && x.partners.every((id) => ['priest', 'mage', 'warrior'].includes(b.get(id).job)));
  assert.ok(o1);
  assert.ok(b.command(h1.id, cmdOf(o1, b.enemies[0].id), 's1').ok);
  const o2 = b.dualOptionsFor(h2).find((x) => x.id === MINA);
  assert.ok(o2, 'まだ 出て いない 間は よやく できる');
  assert.ok(b.command(h2.id, cmdOf(o2, b.enemies[0].id), 's1').ok);
  const evs = runUntil(b, (e) => e.t === 'act' && e.id === h2.id, 120000);
  const duals = evs.filter((e) => e.t === 'act' && e.dual?.id === MINA);
  assert.equal(duals.length, 1, 'ミナデインは 1回だけ');
  const late = evs.filter((e) => (e.lines || []).some((l) => l.includes(REASON)));
  assert.ok(late.length >= 1, `あとの 方は「${REASON}」`);
});

test('ほかの 合体技は 何度でも 出せる・次の 戦いでは また ミナデインを 出せる', () => {
  const b = party();
  fireMina(b);
  let n = 0;
  for (let k = 0; k < 3; k++) {
    assert.ok(readyAll(b));
    const o = b.dualOptionsFor(b.allies[0]).find((x) => x.id !== MINA && DUAL_TECHS[x.id].target === 'enemy');
    assert.ok(o, 'ほかの 合体技は 一覧に ある');
    assert.ok(b.command(b.allies[0].id, cmdOf(o, b.enemies[0].id), 's1').ok);
    const act = runUntil(b, isDual).find(isDual);
    assert.equal(act.dual.id, o.id);
    assert.ok(!act.dual.once);
    n++;
  }
  assert.equal(n, 3);
  // 次の 戦い
  const next = party({ seed: 2 });
  assert.equal(fireMina(next).dual.id, MINA, '次の 戦いでは また 出せる');
});

test('オート（シミュレーターの えらび方）: ミナデインは 2度 えらばない・ボスか 強い 敵に だけ', () => {
  const b = party({ ctl: 'sim' });
  const boss = b.enemies[0];
  let mina = 0;
  for (let t = 0; t < 240000 && mina < 3; t += 50) {
    for (const e of b.tick(50)) if (e.t === 'act' && e.dual?.id === MINA) mina++;
    for (const a of b.allies) if (a.ready && !a.queued && !a.waitDual && !a.dualHold) {
      if (!dualPlan(b, a, boss.species)) b.command(a.id, { type: 'defend' }, 'sim');
    }
    if (b.over) break;
  }
  assert.equal(mina, 1, 'オートは ミナデインを 1度だけ');
  // ざこには 使わない（ボスで ない 戦い・ボス戦の 弱い 敵）
  const z = party({ enemies: ['rockman', 'rockman'], boss: false });
  assert.equal(onceWorth(z, MINA, z.enemies[0]), false, 'ざこ');
  const zb = party({ enemies: ['argos', 'rockman'] });
  zb.enemies[0].boss = true;
  zb.enemies[1].boss = false;
  zb.enemies[1].hp = zb.enemies[1].maxHp = 10;
  assert.equal(onceWorth(zb, MINA, zb.enemies[0]), true, 'ボス');
  assert.equal(onceWorth(zb, MINA, zb.enemies[1]), false, 'ボス戦の ざこ');
  // ほかの 合体技は いつでも（えらび方は かえない）
  const other = Object.keys(DUAL_TECHS).find((id) => id !== MINA);
  assert.equal(onceWorth(z, other, z.enemies[0]), true);
});

test('物語の 場面: しかけで 出す 合体技（scripted）は 1度だけの しばりを 受けない・数えない。家族の 命令からは scripted で 出せない', () => {
  const b = party();
  fireMina(b);
  assert.ok(readyAll(b));
  const [c, ...team] = b.allies;
  const before = [...b.dualUsed];
  // 家族の 命令に scripted を つけても だめ
  const r = b.command(c.id, { type: 'dual', id: MINA, partner: team[0].id, partners: team.map((x) => x.id), target: b.enemies[0].id, scripted: true }, 's1');
  assert.equal(r.ok, false);
  // しかけ（台本）から 出す
  const ev = { t: 'act', actor: c.id, lines: [], upd: [] };
  const hp0 = b.enemies[0].hp;
  performDual(b, c, { type: 'dual', id: MINA, partner: team[0].id, partners: team.map((x) => x.id), target: b.enemies[0].id, scripted: true }, ev);
  assert.equal(ev.dual?.id, MINA, '止まらない');
  assert.ok(!ev.dual.once, '数えない');
  assert.ok(b.enemies[0].hp < hp0, 'ダメージ');
  assert.deepEqual([...b.dualUsed], before);
});

test('物語で きまって いる ミナデインは 今は ない（台本・ボスの しかけに dt_minadein が 出て こない）', () => {
  const dir = new URL('../public/js/shared/', import.meta.url).pathname;
  const files = [];
  const walk = (d) => {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, f.name);
      if (f.isDirectory()) walk(p);
      else if (f.name.endsWith('.js')) files.push(p);
    }
  };
  walk(dir);
  // ミナデインの データ・えんしゅつの 時間・古い セーブの いいかえ だけ
  const ok = new Set(['data/dual.js', 'data/ax-time-g4.js', 'world/transfer-prime.js']);
  // コメント（// の あと）は のぞく
  const code = (p) => fs.readFileSync(p, 'utf8').split('\n').map((l) => l.replace(/(^|\s)\/\/.*$/, '')).join('\n');
  const hits = files.filter((p) => code(p).includes(MINA)).map((p) => path.relative(dir, p));
  assert.deepEqual(hits.filter((p) => !ok.has(p)), [], '新しく 台本や しかけで ミナデインを 使う ときは scripted で 出す（docs/plan-balance-r87.md の 実装メモ D班）');
});
