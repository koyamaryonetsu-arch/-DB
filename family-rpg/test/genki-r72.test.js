// 第72回: 元気玉の 見なおし（家族の ことば「元気玉は、魔力依存のダメージ？魔力というより、みんなのHPを10%もらって、
//   もらったHPとダメージ倍率の方が原作と比べてしっくりきます。見直して」）
//   ・自分を ふくむ 生きている 味方 みんな（魔物の 仲間も）から 今の HPの 10%（切りすて・1 より 少なく しない・だれも 1 より 下に ならない）
//   ・敵 みんなに 集めた HP × 倍率 × 威力の 倍率（職業レベル・転職の ペナルティ）の 光の ダメージ。魔力・攻撃力は 関係ない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { JOBS, JOB_MAX_LEVEL } from '../public/js/shared/data/jobs.js';
import { newCharacter, newMonsterCompanion, gainExp, expForLevel, fullHeal, penaltyFor } from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { GENKI, genkiShare, genkiTotal, genkiDamage } from '../public/js/shared/battle-genki.js';
import { skillPower, powStats } from '../public/js/shared/skill-power.js';
import { skillStdPower, STD } from '../public/js/shared/skill-sort.js';
import { skillPowerLine, battleSkillText, firstSentence } from '../public/js/client/ui/skillinfo.js';
import { abilityRole } from '../public/js/shared/data/abilities.js';
import { checkText } from '../tools/kanji-check.mjs';

const G = ABILITIES.s3_genki;
const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };

// スーパーサイヤ人3 ＋ 僧侶 ＋ 魔物の 仲間（スライム）。敵は なにも しない 2体（耐性なし）
function setup({ seed = 1, mag } = {}) {
  const c = newCharacter({ id: 'p1', name: 'ゴク', job: 'warrior' });
  gainExp(c, expForLevel(60));
  master(c, 'ss3');
  c.job = 'ss3';
  fullHeal(c);
  const mate = newCharacter({ id: 'm1', name: 'なかま', job: 'priest' });
  gainExp(mate, expForLevel(50));
  fullHeal(mate);
  const rng = makeRng(seed);
  rng.float = (a, b) => (a + b) / 2;
  const b = new Battle({ rng, allies: [{ char: c, controller: 's1' }, { char: mate, auto: true, kind: 'support' }, { char: newMonsterCompanion({ id: 'p1:mon1', name: 'スラ', species: 'slime', level: 20 }), auto: true, kind: 'support' }], enemies: ['rockman', 'rockman'], canFlee: true });
  for (const e of b.enemies) {
    e.actions = [{ w: 1, id: 'm_nothing' }];
    e.resist = {};
    e.hp = e.maxHp = 99999;
  }
  const me = b.allies[0];
  if (mag !== undefined) me.mag = mag;
  return { b, c, me };
}
const use = (b, actor, pow = 1) => {
  const ev = { lines: [], upd: [] };
  b.applyAbility(actor, G, { target: b.enemies[0].id }, ev, pow);
  return ev;
};

test('データ: 元気玉は 光の genki（MP30・敵全体・オートでは 使わない・ダメージの 技）', () => {
  assert.equal(G.effect.type, 'genki');
  assert.equal(G.effect.element, 'light');
  assert.ok(G.effect.mult > 1);
  assert.equal(G.effect.base, undefined, '魔力の 数（base）は ない');
  assert.equal(G.target, 'enemies');
  assert.equal(G.mp, 30);
  assert.ok(G.noAuto);
  assert.equal(abilityRole(G), 'dmg');
  assert.ok(JOBS.ss3.learn.some(([, id]) => id === 's3_genki'));
  // ほかに gather を 使う 技は ない（元気玉は genki に うつった）
  assert.ok(!Object.values(ABILITIES).some((a) => a?.effect?.type === 'gather'));
});

test('せつめい: 1文めは 30字くらいまで・子どもにも わかる ことば', () => {
  const first = firstSentence(G.desc);
  assert.ok(first.length <= 32, first);
  assert.match(first, /HP/);
  assert.match(first, /光の玉/);
  assert.ok(!/MP/.test(G.desc), 'MPを 集める 話は もう ない');
  assert.deepEqual(checkText(G.desc), []);
  assert.deepEqual(checkText(G.cast), []);
});

test('1人が 出す HP: 今の HPの 10%（切りすて）・1 より 少なく しない・だれも 1 より 下に ならない', () => {
  assert.equal(GENKI.rate, 0.1);
  assert.equal(genkiShare(500), 50);
  assert.equal(genkiShare(509), 50);
  assert.equal(genkiShare(9), 1, '10% が 1 より 少なくても 1');
  assert.equal(genkiShare(2), 1, 'HP2 → 1 のこる');
  assert.equal(genkiShare(1), 0, 'HP1 の 人は 出さない');
  assert.equal(genkiShare(0), 0);
  for (let h = 1; h < 300; h++) assert.ok(h - genkiShare(h) >= 1, `HP${h}`);
  assert.equal(genkiTotal([500, 300, 9, 1]), 50 + 30 + 1);
});

test('戦い: みんな（自分・仲間・魔物の 仲間）から 10% 集めて、敵全体に 集めた HP × 倍率の 光の ダメージ', () => {
  const { b, me } = setup();
  const hp0 = b.allies.map((x) => x.hp);
  const want = hp0.reduce((s, h) => s + Math.floor(h * 0.1), 0);
  const e0 = b.enemies.map((e) => e.hp);
  const ev = use(b, me, 1);
  b.allies.forEach((x, i) => assert.equal(x.hp, hp0[i] - Math.floor(hp0[i] * 0.1), x.name));
  assert.ok(b.allies.some((x) => x.mon || x.species), '魔物の 仲間も いる');
  assert.ok(ev.lines.includes(`みんなから元気が集まった！（HP${want}）`), ev.lines.join(' / '));
  assert.deepEqual(ev.genki.map((g) => g.hp), hp0.map((h) => Math.floor(h * 0.1)));
  // ふりはばは まんなか（rng.float）・れんけい なし
  const dmg = Math.round(want * G.effect.mult);
  b.enemies.forEach((e, i) => assert.equal(e0[i] - e.hp, dmg, '敵全体に おなじ ダメージ'));
  const hits = (ev.results || []).filter((r) => r.dmg > 0);
  assert.equal(hits.length, 2);
  assert.ok(hits.every((r) => r.element === 'light'));
  // HPを 出した 人には ダメージの 数を 出さない（ev.genki で 小さく 出す）
  assert.ok(!(ev.results || []).some((r) => b.allies.some((x) => x.id === r.id)));
});

test('戦い: 魔力・攻撃力では かわらない。職業レベル・ペナルティの 威力（powMult）は かける', () => {
  const lo = setup({ mag: 5 }), hi = setup({ mag: 999 });
  hi.me.atk = 9999;
  const d = (s, pow = 1) => { const h0 = s.b.enemies[0].hp; use(s.b, s.me, pow); return h0 - s.b.enemies[0].hp; };
  const a = d(lo), b2 = d(hi);
  assert.equal(a, b2, '魔力 5 でも 999 でも おなじ');
  const p = setup();
  assert.equal(d(p, 1.36), Math.round(Math.round(a / G.effect.mult) * G.effect.mult * 1.36));
});

test('戦い: 光が 効かない 敵には 効かない・弱点は 強い', () => {
  const { b, me } = setup();
  b.enemies[0].resist = { light: 0 };
  b.enemies[1].resist = { light: 1.5 };
  const h1 = b.enemies[1].hp;
  const ev = use(b, me);
  assert.equal(b.enemies[0].hp, 99999);
  assert.ok(ev.lines.some((l) => l.includes('効かなかった')));
  const got = ev.genki.reduce((s, g) => s + g.hp, 0);
  assert.equal(h1 - b.enemies[1].hp, Math.round(got * G.effect.mult * 1.5));
});

test('戦い: HPが 1 の 人は 出さない。みんな 1 なら 元気が 集まらない', () => {
  const { b, me } = setup();
  b.allies[1].hp = 1;
  let ev = use(b, me);
  assert.equal(b.allies[1].hp, 1);
  assert.ok(!ev.genki.some((g) => g.id === b.allies[1].id));
  for (const x of b.allies) x.hp = 1;
  const e0 = b.enemies[0].hp;
  ev = use(b, me);
  assert.ok(b.allies.every((x) => x.hp === 1 && x.alive));
  assert.equal(b.enemies[0].hp, e0);
  assert.ok(ev.lines.includes('しかし、元気が集まらなかった…'));
});

test('戦い: たおれた 仲間からは 集めない', () => {
  const { b, me } = setup();
  const m = b.allies[1];
  m.hp = 0;
  m.alive = false;
  const ev = use(b, me);
  assert.ok(!ev.genki.some((g) => g.id === m.id));
  assert.equal(m.hp, 0);
});

test('敵が 使う とき（まぼろし など）は 1人に 最大HPの 40% まで', () => {
  const { b } = setup();
  const boss = b.enemies[0];
  boss.hp = boss.maxHp = 80000;
  const t = b.allies[1];
  const r = genkiDamage(b, boss, t, G.effect, 8000, 1, true);
  assert.equal(r.dmg, Math.round(t.maxHp * GENKI.foeCap));
});

test('オートでは 使わない', () => {
  const { b, me } = setup();
  me.abilities = ['s3_genki', 's3_ryuuken'];
  me.mp = 999;
  for (let i = 0; i < 30; i++) assert.notEqual(decideAlly(b, me).id, 's3_genki');
});

test('威力の 目安: 「集めたHP×倍率」。戦いの 中は 今の みんなで どれくらいか', () => {
  const c = newCharacter({ id: 'p1', name: 'ゴク', job: 'warrior' });
  gainExp(c, expForLevel(60));
  master(c, 'ss3');
  c.job = 'ss3';
  fullHeal(c);
  const pm = penaltyFor(c, 's3_genki').powMult;
  assert.ok(Math.abs(pm - 1.36) < 1e-9, '職業レベル10 で 威力+36%');
  const m = (G.effect.mult * pm).toFixed(1);
  // メニュー（みんなの HPが わからない）
  assert.equal(skillPowerLine('s3_genki', c), `集めたHP×${m}`);
  // 戦いの 中（partyHp: 味方の 今の HP）
  const pc = { ...c, pow: { mag: 50, heal: 10 }, partyHp: [800, 700, 600, 500] };
  assert.equal(powStats(pc).party.length, 4);
  const got = 80 + 70 + 60 + 50;
  const line = skillPowerLine('s3_genki', pc);
  assert.equal(line, `集めたHP×${m}（今のみんなでHP${got}・約${Math.round(got * G.effect.mult * pm)}）`);
  assert.equal(skillPower('s3_genki', pc).parts[0].type, 'genki');
  assert.match(battleSkillText('s3_genki', pc), new RegExp(`威力：集めたHP×${m.replace('.', '\\.')}（今のみんなで`));
  assert.match(battleSkillText('s3_genki', pc, { compact: true }), /集めたHP×/);
  assert.equal(skillPowerLine('s3_genki', { ...pc, partyHp: [1, 1] }), `集めたHP×${m}（今は元気が集まらない）`);
  for (const t of [line, battleSkillText('s3_genki', pc), skillPowerLine('s3_genki', { ...pc, partyHp: [1] })]) assert.deepEqual(checkText(t), [], t);
});

test('技の ならび（ふつうの 強さ）: ふつうの 4人 HP満タンで 集めた HP × 倍率。かめはめ波・極より 強い', () => {
  const v = skillStdPower('s3_genki');
  assert.equal(v, Math.round(STD.party * Math.floor(STD.partyHp * 0.1) * G.effect.mult * 10) / 10);
  assert.ok(v > skillStdPower('s3_kame') * 1.2, `${v}`);
  assert.ok(v > skillStdPower('sh_gigadein') * 1.2 && v < skillStdPower('sh_gigadein') * 1.6, '伝説の 強い 全体攻撃の 1.2〜1.6倍');
});
