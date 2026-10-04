// バフ・デバフの かさねがけ（2だんかいまで）と、合体技が 2人の 強さで 強くなる こと
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle, stackMult, stackBuff, BUFF_STACK, dualProxy, effAtk } from '../public/js/shared/battle.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { newCharacter, gainExp, expForLevel, fullHeal } from '../public/js/shared/stats.js';
import { makeRng } from '../public/js/shared/rng.js';

function setup(jobs = ['warrior', 'priest'], level = 30) {
  const chars = jobs.map((j, i) => {
    const c = newCharacter({ id: 'p' + i, name: ['ソラ', 'ミナ', 'ユイ'][i], job: j });
    gainExp(c, expForLevel(level));
    fullHeal(c);
    c.mp = 999;
    return c;
  });
  const rng = makeRng(3);
  rng.chance = () => true;
  const b = new Battle({ rng, allies: chars.map((c, i) => ({ char: c, controller: 's' + i })), enemies: ['rockman'], canFlee: true });
  for (const e of b.enemies) e.actions = [{ w: 1, id: 'm_nothing' }];
  return b;
}
const use = (b, c, id, targets) => {
  const ev = { t: 'act', id: c.id, lines: [], upd: [], fx: null };
  b.applyAbility(c, ABILITIES[id], { target: targets[0]?.id }, ev, 1, targets);
  return ev;
};

test('かさねがけ: 2回目で 効き目が 2倍、3回目は かさならない', () => {
  assert.equal(BUFF_STACK, 2);
  assert.equal(stackMult(1.3, 1), 1.3);
  assert.ok(Math.abs(stackMult(1.3, 2) - 1.6) < 1e-9);
  assert.ok(Math.abs(stackMult(0.75, 2) - 0.5) < 1e-9);
  assert.ok(Math.abs(stackMult(2.6, 2) - 3.1) < 1e-9, '大防御は ひかえめ');
  const m = {};
  assert.deepEqual(stackBuff(m, 'atk', 1.3, 100), { lv: 1, max: false });
  assert.deepEqual(stackBuff(m, 'atk', 1.3, 200), { lv: 2, max: false });
  assert.deepEqual(stackBuff(m, 'atk', 1.3, 300), { lv: 2, max: true });
  assert.equal(m.atk.until, 300, '時間は のびる');
  assert.ok(Math.abs(m.atk.mult - 1.6) < 1e-9);
});

test('かさねがけ: たたかいで バイキルト（攻撃力アップ）を 2回・3回', () => {
  const b = setup();
  const [w, p] = b.allies;
  const id = Object.keys(ABILITIES).find((k) => ABILITIES[k].effect?.type === 'buff' && ABILITIES[k].effect.stat === 'atk' && ABILITIES[k].target === 'ally');
  assert.ok(id, 'こうげき力を 上げる 技');
  const base = effAtk(w);
  let ev = use(b, p, id, [w]);
  assert.ok(ev.lines.some((l) => /攻撃力が上がった/.test(l)));
  const one = effAtk(w);
  ev = use(b, p, id, [w]);
  assert.ok(ev.lines.some((l) => /さらに上がった/.test(l)), ev.lines.join('/'));
  const two = effAtk(w);
  assert.ok(two > one && one > base);
  ev = use(b, p, id, [w]);
  assert.ok(ev.lines.some((l) => /もうこれ以上上がらない/.test(l)));
  assert.equal(effAtk(w), two);
  assert.ok(b.snapshot().combatants.find((x) => x.id === w.id).buffs.includes('+atk2'), 'クライアントに 2だんかいめを おくる');
});

test('かさねがけ: デバフも 2だんかいまで（守備力を 下げる）', () => {
  const b = setup();
  const [w] = b.allies;
  const e = b.enemies[0];
  const def0 = e.dfn;
  b.applyDebuff(w, e, { stat: 'def', mult: 0.75, dur: 30, chance: 1 }, { lines: [], upd: [] });
  const ev = { lines: [], upd: [] };
  b.applyDebuff(w, e, { stat: 'def', mult: 0.75, dur: 30, chance: 1 }, ev);
  assert.ok(ev.lines.some((l) => /さらに下がった/.test(l)));
  assert.equal(e.debuffs.def.lv, 2);
  assert.ok(Math.abs(e.debuffs.def.mult - 0.5) < 1e-9);
  assert.ok(def0 > 0);
});

test('合体技: 2人の 攻撃力・魔力が 高いほど 強い（強い ほう ＋ 弱い ほうの 半分）', () => {
  const b = setup(['warrior', 'mage']);
  const [w, m] = b.allies;
  const px = dualProxy(w, m);
  assert.equal(px.atk, Math.round(Math.max(w.atk, m.atk) + Math.min(w.atk, m.atk) * 0.5));
  assert.equal(px.mag, Math.round(Math.max(w.mag, m.mag) + Math.min(w.mag, m.mag) * 0.5));
  // 強い 2人の 方が 強い
  const strong = setup(['warrior', 'mage'], 60);
  const ps = dualProxy(strong.allies[0], strong.allies[1]);
  assert.ok(ps.atk > px.atk && ps.mag > px.mag);
  // バフも 合わせて 入る（2重には かからない）
  w.buffs.atk = { mult: 1.5, base: 1.5, lv: 1, until: Infinity };
  const pb = dualProxy(w, m);
  assert.ok(pb.atk > px.atk);
  assert.equal(effAtk(pb), pb.atk, 'かげの バフは けしてある');
  // 合体技の 呪文は ふつうの 呪文より 先まで 魔力で 強くなる
  const eff = { base: [100, 100], thr: 10 };
  const hi = { mag: 400 };
  const dual = b.calcMagic(hi, b.enemies[0], { ...eff, scaleCap: 1.6 }, 1, true).dmg;
  const solo = b.calcMagic(hi, b.enemies[0], eff, 1, true).dmg;
  assert.ok(dual > solo, `${dual} > ${solo}`);
});
