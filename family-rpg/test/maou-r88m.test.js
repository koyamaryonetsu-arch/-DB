// 第88回 M1班: 魔王の 技を ダイの大冒険に そろえた テスト（docs/plan-r88-anime-gear.md の 11・12-2）
//   名前・id が かわって いない・強さの 数字が かわって いない・Lv1 が 炎・天地魔闘の構えの 3つの はたらき（地・天・魔）・
//   3回まで・まぼろしと 鏡の うつし身は 使わない・古い 名前が のこって いない・えんしゅつ
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JOBS, JOB_MAX_LEVEL } from '../public/js/shared/data/jobs.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
import { HIRA_R88M_ABILITIES, HIRAMEKI_R88M } from '../public/js/shared/data/hirameki-r88m.js';
import { DUAL_TECHS } from '../public/js/shared/data/dual.js';
import { AX_SKILLS_O2 } from '../public/js/shared/data/ax-time-o2.js';
import { newCharacter, gainExp, expForLevel, fullHeal, learnedAbilities, hiraAllowed } from '../public/js/shared/stats.js';
import { Battle, pub } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { mirrorSkillOk } from '../public/js/shared/battle-temple.js';
import { setupTrialPhantom } from '../public/js/shared/battle-trial.js';
import { R88M_FLOOR, r88mPlan, r88mResolve } from '../public/js/shared/battle-r88m.js';
import { Effects, BW, BH } from '../public/js/client/render/battlefx.js';
import { PARTY_ANIMS } from '../public/js/client/render/battlefx-jobs2.js';
import { R88M_ANIMS, R88M_HIT, R88M_SFX, PARTY_ANIMS_R88M, playR88mFx } from '../public/js/client/render/battlefx-r88m.js';
import { r88mMarks } from '../public/js/client/battle-r88m.js';
import { checkText, gameFiles } from '../tools/kanji-check.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const textOk = (s, what) => assert.deepEqual(checkText(s), [], `${what}: ${s}`);
const SCARY = /殺|死ね|ころす|ころし|血/;

function mk(id, job = 'maou', lv = 60, hira = []) {
  const c = newCharacter({ id, name: id, job: 'monk' });
  gainExp(c, expForLevel(lv));
  for (const j of ['hero', 'datenshi', 'maou']) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 };
  c.job = job;
  c.hirameki = hira;
  fullHeal(c);
  return c;
}
// 魔王（天地魔闘の構えを ひらめいた）と 敵。敵は 何も しない（手で 動かす）
function setup({ enemies = ['rockman'], seed = 7, hira = ['hi_tenchi_matou'] } = {}) {
  const b = new Battle({ rng: makeRng(seed), allies: [{ char: mk('まおう', 'maou', 60, hira), controller: 's1' }], enemies, canFlee: false });
  for (const e of b.enemies) { e.hp = e.maxHp = 999999; e.actions = [{ w: 1, id: 'm_nothing' }]; e.resist = {}; }
  return b;
}
// 敵 e が 魔王に 物理で 攻撃する（1回の 敵の 行動。反撃は 行動の おわりに まとめて）
function enemyHit(b, e, t, dmg) {
  const ev = { t: 'act', id: e.id, lines: [], upd: [], fx: null };
  b.cur = ev;
  b.damage(e, t, dmg, ev, { element: 'phys', phys: true });
  b.resolveCounters(ev);
  return { ev };
}

const OLD = ['暗黒の炎', '魔王のつめ', '魔王の威圧', '破滅の光', '闇の世界', '破滅のはかい玉'];
const NEW_NAMES = {
  mo_kokuen: 'カイザーフェニックス', mo_hadou: 'いてつく波動', mo_tsume: 'ヘルズクロー', mo_iatsu: '闘魔くぐつしょう',
  mo_koromo: '闇の衣', mo_hametsu: 'カラミティウォール', hi_ima_mera: '今のはメラだ', hi_yami_sekai: '超魔爆炎は',
};

test('第88回 M1: 魔王の 技の 名前（ダイの大冒険）・id と 強さの 数字は そのまま・Lv1 は 炎', () => {
  for (const [id, name] of Object.entries(NEW_NAMES)) {
    assert.ok(ABILITIES[id], id);
    assert.equal(ABILITIES[id].name, name, id);
    assert.equal(ABILITIES[id].job, 'maou', id);
    textOk(ABILITIES[id].name, id);
    textOk(ABILITIES[id].desc, id);
    textOk(ABILITIES[id].cast, id);
    assert.ok(!SCARY.test(ABILITIES[id].desc + ABILITIES[id].cast), id);
  }
  // おぼえる じゅんと id（引っこしコードに 入って いる）
  assert.deepEqual(JOBS.maou.learn, [[1, 'mo_kokuen'], [3, 'mo_hadou'], [5, 'mo_tsume'], [7, 'mo_iatsu'], [8, 'mo_koromo'], [10, 'mo_hametsu']]);
  const prime = readFileSync(join(ROOT, 'public/js/shared/world/transfer-prime.js'), 'utf8');
  for (const id of Object.keys(NEW_NAMES)) assert.ok(prime.includes(`\\"${id}\\"`), id);
  // 強さの 数字（MP・ダメージ・効き目・ねらう 相手）
  const A = (id) => ABILITIES[id];
  assert.deepEqual([A('mo_kokuen').mp, A('mo_kokuen').target, A('mo_kokuen').effect], [16, 'enemies', { type: 'magic', element: 'fire', base: [150, 180], thr: 80 }]);
  assert.deepEqual([A('mo_tsume').mp, A('mo_tsume').target, A('mo_tsume').effect], [14, 'enemy', { type: 'phys', mult: 3.0, element: 'dark' }]);
  assert.equal(A('mo_iatsu').mp, 16);
  assert.equal(A('mo_iatsu').effect.parts[0].chance, 0.6);
  assert.deepEqual([A('mo_hametsu').mp, A('mo_hametsu').effect.element, A('mo_hametsu').effect.base], [32, 'dark', [220, 260]]);
  assert.deepEqual([A('hi_yami_sekai').mp, A('hi_yami_sekai').effect.parts[0].element, A('hi_yami_sekai').effect.parts[0].base], [20, 'dark', [120, 150]]);
  // Lv1 は 炎（火の 鳥の 技）
  assert.equal(A('mo_kokuen').effect.element, 'fire');
  assert.equal(AX_SKILLS_O2.mo_kokuen, 'ox_kaiser_phoenix');
  // 合体技（魔王 × はかい神）の 名前も 新しい 名前に 合う（強さは そのまま）
  assert.equal(DUAL_TECHS.dt_hametsu.name, 'カラミティはかい玉');
  assert.equal(DUAL_TECHS.dt_hametsu.parts[0].k, 0.85);
  textOk(JOBS.maou.desc, 'maou');
  assert.match(JOBS.maou.desc, /カイザーフェニックス/);
});

test('第88回 M1: 古い 名前（魔王の 技）が ゲームにも テストにも のこって いない', () => {
  const files = [];
  const walk = (d) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(js|mjs|html)$/.test(f)) files.push(p);
    }
  };
  walk(join(ROOT, 'public'));
  walk(join(ROOT, 'test'));
  walk(join(ROOT, 'tools'));
  const bad = [];
  for (const p of files) {
    if (p.endsWith('maou-r88m.test.js')) continue;
    const s = readFileSync(p, 'utf8');
    for (const w of OLD) if (s.includes(w)) bad.push(`${p.slice(ROOT.length)}: ${w}`);
  }
  assert.deepEqual(bad, []);
  // ゲームの 文字の しらべ（kanji-check）に 新しい ファイルが 入って いる
  for (const f of ['public/js/shared/data/hirameki-r88m.js', 'public/js/shared/battle-r88m.js', 'public/js/client/battle-r88m.js']) assert.ok(gameFiles().some((p) => p.endsWith(f)), f);
});

test('第88回 M1: 天地魔闘の構えは 魔王の ひらめき技（Lv7 いじょうの 技から）', () => {
  const a = ABILITIES.hi_tenchi_matou;
  assert.ok(a && HIRA_R88M_ABILITIES.hi_tenchi_matou === a);
  assert.equal(a.name, '天地魔闘の構え');
  assert.equal(a.job, 'maou');
  assert.equal(a.target, 'self');
  assert.equal(a.hirameki, true);
  assert.ok(a.mp >= 15 && a.mp <= 25, `MP ${a.mp}`);
  textOk(a.name, 'name');
  textOk(a.desc, 'desc');
  textOk(a.cast, 'cast');
  assert.deepEqual(HIRAMEKI.hi_tenchi_matou, HIRAMEKI_R88M.hi_tenchi_matou);
  const lv = Object.fromEntries(JOBS.maou.learn.map(([l, id]) => [id, l]));
  for (const id of Object.keys(HIRAMEKI_R88M.hi_tenchi_matou.from)) assert.ok(lv[id] >= 7, id);
  const c = mk('x');
  assert.equal(hiraAllowed(c, 'hi_tenchi_matou'), true);
  c.job = 'warrior';
  assert.equal(hiraAllowed(c, 'hi_tenchi_matou'), false);
  // ひらめいた 人だけ 使える（おぼえる 技の 一覧には ない）
  assert.ok(!learnedAbilities(mk('y')).includes('hi_tenchi_matou'));
  assert.ok(learnedAbilities(mk('z', 'maou', 60, ['hi_tenchi_matou'])).includes('hi_tenchi_matou'));
});

test('第88回 M1: 天地魔闘の構え — 地（ダメージ 半分）・天（手刀の 反撃 3回まで）・魔（とける 時に 火の 鳥）', () => {
  const b = setup({ enemies: ['rockman', 'rockman'] });
  const me = b.allies[0];
  const [e1, e2] = b.enemies;
  for (let k = 0; k < 2000 && !me.ready; k++) b.tick(50);
  assert.deepEqual(b.command(me.id, { type: 'ability', id: 'hi_tenchi_matou' }, 's1'), { ok: true });
  let set = null;
  for (let k = 0; k < 400 && !set; k++) for (const ev of b.tick(50)) if (ev.t === 'act' && ev.id === me.id) set = ev;
  assert.ok(set?.r88mSet === me.id, 'かまえた');
  assert.ok(me.r88mTenchi);
  assert.equal(pub(me).r88mTenchi, true);
  assert.deepEqual(r88mMarks(pub(me)).map((m) => m.text), ['天地魔闘3']);
  me.hp = me.maxHp = 99999;
  // 地: 受ける ダメージが 半分
  const hp0 = me.hp;
  const { ev: ev1 } = enemyHit(b, e1, me, 1000);
  assert.equal(hp0 - me.hp, 500);
  assert.ok(ev1.lines.some((l) => /フェニックスウィング/.test(l)));
  // 天: 手刀の 反撃（行動の おわりに まとめて）
  assert.equal(ev1.r88mPend.length, 1);
  const eHp = e1.hp;
  // battle.js の executeNext が resolveCounters の あとに よぶ ものと おなじ
  const n0 = ev1.results.length;
  r88mResolve(b, ev1);
  assert.ok(e1.hp < eHp, '手刀が 当たった');
  assert.deepEqual(ev1.r88mHands, [{ by: me.id, on: e1.id }]);
  assert.ok(ev1.results.slice(n0).every((r) => r.r88m === 'hand'));
  // 3回まで（4回目の 攻撃では 反撃しない。ダメージ 半分は つづく）
  let hands = 1;
  for (let i = 0; i < 3; i++) {
    const { ev } = enemyHit(b, e2, me, 400);
    r88mResolve(b, ev);
    hands += (ev.r88mHands || []).length;
  }
  assert.equal(hands, 3);
  assert.equal(pub(me).r88mLeft, 0);
  const hp1 = me.hp;
  enemyHit(b, e2, me, 400);
  assert.equal(hp1 - me.hp, 200);
  // 魔: 次の 自分の 番の はじめに かまえが とけて、さいごに 攻撃して きた 敵（e2）に 火の 鳥（炎の 呪文）
  const e2Hp = e2.hp;
  for (let k = 0; k < 2000 && !me.ready; k++) b.tick(50);
  b.command(me.id, { type: 'defend' }, 's1');
  const evs = [];
  for (let k = 0; k < 400 && !evs.some((ev) => ev.id === me.id); k++) evs.push(...b.tick(50).filter((ev) => ev.t === 'act'));
  const mine = evs.find((ev) => ev.id === me.id);
  assert.deepEqual(mine.r88mBird, { by: me.id, on: e2.id });
  assert.ok(e2.hp < e2Hp, '火の 鳥が 当たった');
  assert.ok(mine.results.some((r) => r.id === e2.id && r.r88m === 'bird' && r.element === 'fire'));
  assert.ok(!me.r88mTenchi, 'かまえが とけた');
  assert.equal(pub(me).r88mTenchi, false);
  // 火の 鳥は Lv1 の カイザーフェニックスより 弱い
  assert.ok(ABILITIES.hi_tenchi_matou.effect.bird.base[1] < ABILITIES.mo_kokuen.effect.base[0]);
});

test('第88回 M1: だれにも 攻撃されなければ 火の 鳥は 出ない・身を 守ると 重ねても 4分の1 より 下がらない', () => {
  const b = setup();
  const me = b.allies[0];
  for (let k = 0; k < 2000 && !me.ready; k++) b.tick(50);
  b.command(me.id, { type: 'ability', id: 'hi_tenchi_matou' }, 's1');
  for (let k = 0; k < 2000 && !me.r88mTenchi; k++) b.tick(50);
  assert.ok(me.r88mTenchi);
  for (let k = 0; k < 2000 && !me.ready; k++) b.tick(50);
  b.command(me.id, { type: 'defend' }, 's1');
  const evs = [];
  for (let k = 0; k < 400 && !evs.some((ev) => ev.id === me.id); k++) evs.push(...b.tick(50).filter((ev) => ev.t === 'act'));
  const mine = evs.find((ev) => ev.id === me.id);
  assert.ok(!mine.r88mBird);
  assert.ok(mine.lines.some((l) => /構えをといた/.test(l)));
  assert.ok(!me.r88mTenchi);
  // 下限: 身を 守って いる 時（来た ダメージが もう 半分）・作戦 などと 重ねても
  const b2 = setup();
  const m2 = b2.allies[0];
  m2.hp = m2.maxHp = 99999;
  m2.r88mTenchi = { cut: 0.5, hand: 1.3, left: 3, bird: { element: 'fire', base: [1, 1], thr: 1 }, last: null };
  m2.defending = true;
  const h0 = m2.hp;
  enemyHit(b2, b2.enemies[0], m2, 800);
  assert.equal(h0 - m2.hp, 400);
  assert.equal(R88M_FLOOR, 0.25);
  // 前ぶれの ある ボスの 大技（ev.big）にも 効く
  m2.defending = false;
  const ev = { t: 'act', id: b2.enemies[0].id, lines: [], upd: [], fx: null, big: true };
  b2.cur = ev;
  const h1 = m2.hp;
  b2.damage(b2.enemies[0], m2, 2000, ev, { element: 'fire' });
  assert.equal(h1 - m2.hp, 1000);
});

test('第88回 M1: オートは 敵の 大技の 前ぶれが ある 時だけ・試練の まぼろしと 鏡の うつし身は 使わない', () => {
  const b = setup();
  const me = b.allies[0];
  const mine = [{ id: 'hi_tenchi_matou', a: ABILITIES.hi_tenchi_matou }];
  b.rng = makeRng(1);
  assert.equal(r88mPlan(b, me, b.enemies, mine), null, '前ぶれ なし');
  b.enemies[0].telegraph = 'm_nothing';
  let used = 0;
  for (let i = 0; i < 200; i++) if (r88mPlan(b, me, b.enemies, mine)) used++;
  assert.ok(used > 60 && used < 180, `${used}`);
  me.r88mTenchi = { left: 3 };
  assert.equal(r88mPlan(b, me, b.enemies, mine), null, 'もう かまえて いる');
  delete me.r88mTenchi;
  // 前ぶれの ない ふつうの 戦いでは オートで 使わない
  const b2 = setup({ seed: 3 });
  const m2 = b2.allies[0];
  m2.auto = true;
  for (let i = 0; i < 200; i++) {
    const cmd = decideAlly(b2, m2);
    assert.ok(!(cmd.type === 'ability' && cmd.id === 'hi_tenchi_matou'));
  }
  // 鏡の うつし身
  assert.equal(mirrorSkillOk('hi_tenchi_matou'), false);
  assert.equal(mirrorSkillOk('mo_kokuen'), true);
  // 試練の まぼろし（魔王の 試練。まぼろしの 技に 入らない）
  const party = [mk('me', 'maou', 72, ['hi_tenchi_matou'])];
  const bt = new Battle({ rng: makeRng(5), boss: true, canFlee: false, allies: party.map((c) => ({ char: c, kind: 'support', controller: 'sim', auto: true })), enemies: ['trial_phantom1'] });
  setupTrialPhantom(bt, { job: 'maou', n: 3, who: party[0] });
  const ph = bt.enemies[0];
  const ids = (ph.actions || []).map((x) => x.id);
  assert.ok(ids.length > 0);
  assert.ok(!ids.includes('hi_tenchi_matou'));
  // 敵が 持って いても 何も おきない（仲間だけの しくみ）
  const ev = { t: 'act', id: ph.id, lines: [], upd: [], fx: null };
  bt.applyAbility(ph, ABILITIES.hi_tenchi_matou, {}, ev, 1);
  assert.ok(!ph.r88mTenchi);
});

test('第88回 M1: えんしゅつ（かまえ・手刀・火の 鳥）・音・こわれない・札', () => {
  assert.equal(ABILITIES.hi_tenchi_matou.anim, 'r88m_tenchi');
  assert.deepEqual(Object.keys(R88M_SFX).sort(), [...R88M_ANIMS].sort());
  assert.deepEqual(Object.keys(R88M_HIT).sort(), [...R88M_ANIMS].sort());
  for (const a of PARTY_ANIMS_R88M) assert.ok(PARTY_ANIMS.has(a), a);
  const battle = readFileSync(join(ROOT, 'public/js/client/battle.js'), 'utf8');
  assert.match(battle, /Object\.assign\(ANIM_SFX, R88M_SFX\)/);
  assert.match(battle, /Object\.assign\(HIT_DELAY, R88M_HIT\)/);
  assert.match(battle, /r88mPresent\(this, ev, hitDelay\)/);
  const fxsrc = readFileSync(join(ROOT, 'public/js/client/render/battlefx.js'), 'utf8');
  assert.match(fxsrc, /playR88mFx\(this, anim/);
  for (const anim of R88M_ANIMS) {
    for (const targets of [[{ x: 128, y: 66 }], [{ x: 60, y: 70 }, { x: 128, y: 82 }, { x: 196, y: 70 }]]) {
      const fx = new Effects();
      assert.equal(playR88mFx(fx, anim, targets, 'fire', { crit: true }, BW, BH), true, anim);
      let t = 0;
      while (fx.parts.length && t < 4000) {
        fx.update(16);
        t += 16;
      }
      assert.ok(t <= 2200, `${anim}: ${t}ms`);
    }
  }
  assert.equal(playR88mFx(new Effects(), 'fire1', [{ x: 1, y: 1 }]), false);
  assert.deepEqual(r88mMarks({ alive: true, r88mTenchi: true, r88mLeft: 2 }).map((m) => m.text), ['天地魔闘2']);
  assert.deepEqual(r88mMarks({ alive: true, r88mTenchi: false }), []);
  assert.deepEqual(r88mMarks({ alive: false, r88mTenchi: true }), []);
});
