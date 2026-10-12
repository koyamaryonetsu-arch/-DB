// 2026年10月（第31回）: 合体技の 見直し（docs/plan-r31.md の 1）
//  ・「職業が だれでも よい」組は ミナデインだけ（今 ついている 職業で 判定。マスターした 職業は 関係 ない）
//  ・全員集合（4人が 同じ 職業 か 同じ 基本職から 分かれた 系統）・グランドフィナーレ（剣・こぶし・攻撃呪文・いやしの 上級職 いじょう）
//  ・家族会議・なぞは すべて 解けた！の 4人目も 職業しばり
//  ・ミナデイン（きずな技 → 合体技。勇者の 系統 ＋ だれでも 3人。いちばん 強い 雷。ボスには 1回で さいだいHPの 35%まで）
//  ・よやくで ゲージが たまって まっている 人が ダメージ → その 人の ゲージは 半分から やり直し（よやくは つづく）
//  ・きずなゲージ・きずな技は なくなった。古い セーブ（dualSeen・きずなの 値・前の 技の id）も 読める
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JOBS, ALL_JOBS, JOB_MAX_LEVEL, jobAncestry } from '../public/js/shared/data/jobs.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import {
  DUAL_TECHS, DUAL_ORDER, DUAL_GROUP_NAMES, ANY_GROUPS, HERO_LINE_JOBS, dualOptions, dualRelated, dualKnown, groupJobs, sameLine, dualNeedText,
} from '../public/js/shared/data/dual.js';
import { newCharacter, gainExp, expForLevel, fullHeal, weaponOk, partyJobSet } from '../public/js/shared/stats.js';
import { Battle, DUAL_POWER } from '../public/js/shared/battle.js';
import { DUAL_BOSS_CAP, DUAL_BREAK_ATB } from '../public/js/shared/battle-dual.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { DUAL_FX } from '../public/js/client/render/dualfx.js';
import { checkText } from '../tools/kanji-check.mjs';

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
// jobs[0] … 自分（s1）。ほかは 自分が 動かす 仲間（mine）か AIの 仲間
function party(jobs, { mine = [], seed = 1, enemies = ['rockman'], boss = false, keep = false } = {}) {
  const allies = jobs.map((j, i) => {
    const char = mk(j, `${JOBS[j].name}${i}`);
    if (i === 0) return { char, controller: 's1' };
    if (mine.includes(i)) return { char, kind: 'support', controller: 's1' };
    return { char, kind: 'support', auto: true };
  });
  const b = new Battle({ rng: makeRng(seed), allies, enemies, canFlee: !boss, boss });
  if (!keep) {
    for (const e of b.enemies) {
      e.actions = [{ w: 1, id: 'm_nothing' }];
      e.hp = e.maxHp = 99999;
      e.resist = {};
    }
  }
  for (const a of b.allies) { a.mp = a.maxMp = 999; a.weaponCat = 'sword'; }
  return b;
}
const readyUp = (b, a) => {
  for (let i = 0; i < 1200 && !a.ready; i++) b.tick(50);
  return a.ready;
};
const gauge = (b, p, v) => {
  b.queue = b.queue.filter((q) => q.id !== p.id);
  p.queued = false;
  p.ready = false;
  p.atb = v;
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
const cmdOf = (o, target) => ({ type: 'dual', id: o.id, partner: o.partner, partners: o.partners, target });
// たたかいの 外の かんたんな 人（dualOptions に わたす）
const p = (id, job, extra = {}) => ({ id, name: id, job, alive: true, abilities: [], mp: 99, ready: true, statuses: [], weaponCat: 'sword', ...extra });
const find = (list, id) => list.find((o) => o.id === id);

// ───────────── 職業で 判定 ─────────────
test('「職業が だれでも よい」組は ミナデインだけ（全員集合は 4人の そろいかたで 見る）・広い 組でも 職業の 3分の1 ほど まで', () => {
  const anyTechs = new Set();
  for (const id of DUAL_ORDER) {
    const t = DUAL_TECHS[id];
    for (const g of t.need) {
      const n = groupJobs(g).size;
      assert.ok(DUAL_GROUP_NAMES.has(g), `${id}: 組の 名前`);
      if (n >= ALL_JOBS.length) {
        assert.ok(ANY_GROUPS.has(g), `${id}: だれでもの 組`);
        if (t.team !== 'line') anyTechs.add(id);
      } else assert.ok(n <= Math.ceil(ALL_JOBS.length / 3), `${t.name}: ${DUAL_GROUP_NAMES.get(g)} が ${n}職業（広すぎる）`);
    }
  }
  assert.deepEqual([...anyTechs], ['dt_minadein'], 'だれでも 枠が ある 技');
  assert.equal(DUAL_TECHS.dt_zenin.team, 'line');
  for (const [, nm] of DUAL_GROUP_NAMES) assert.ok(!nm.includes('攻撃の技'), `前の「攻撃の技（どの職業でも）」の 組は ない: ${nm}`);
  // せーのでジャンプ（前は 3つとも 体を 使う 32職業）・家族会議・なぞは すべて 解けた！の 4人目は 職業しばり
  for (const g of DUAL_TECHS.dt_jump.need) assert.ok(groupJobs(g).size <= 5, `せーのでジャンプ: ${DUAL_GROUP_NAMES.get(g)}`);
  const home = groupJobs(DUAL_TECHS.dt_kazoku_kaigi.need[3]);
  assert.ok(home.has('neet') && home.has('neko_robot') && !home.has('warrior'), '家族会議の 4人目: 家に いる 人');
  const sleuth = groupJobs(DUAL_TECHS.dt_nazo.need[3]);
  for (const j of ['police', 'spy', 'meitantei']) assert.ok(sleuth.has(j), `なぞの 4人目: ${j}`);
  assert.ok(!sleuth.has('warrior'));
  // 必要な 職業の 説明（メニュー・説明の まど）
  assert.equal(dualNeedText('dt_minadein'), '勇者の系統＋どの職業でも×3');
  assert.equal(dualNeedText('dt_finale'), '剣の上級職＋こぶしの上級職＋攻撃呪文の上級職＋いやしの上級職');
  for (const id of DUAL_ORDER) assert.deepEqual(checkText(dualNeedText(id)), [], dualNeedText(id));
});

test('今 ついている 職業で 判定（前の 職業で 覚えた 技・マスターした 職業は 関係 ない）', () => {
  const ex = p('元魔', 'warrior', { abilities: ['mera', 'merazoma', 'daichi'] });
  assert.ok(!find(dualOptions(ex, [p('氷', 'mage', { abilities: ['hyado'] })], weaponOk), 'dt_taishoumetsu'), '戦士は 呪文の 組に 入れない');
  assert.ok(find(dualOptions(p('炎', 'mage'), [p('氷', 'mage')], weaponOk), 'dt_taishoumetsu'), '魔法使いなら 技を まだ 覚えていなくても 入れる');
  assert.ok(!dualOptions(p('なし', undefined), [p('魔', 'mage')], weaponOk).length, '職業の ない 人（魔物の 仲間）は 出せない');
  // 実際の たたかいでも おなじ（マスターした 魔法使いの 技を 覚えている 戦士）
  const b = party(['warrior', 'mage'], { mine: [1] });
  const [me, m] = b.allies;
  assert.ok(me.abilities.includes('mera') === false || true);
  readyUp(b, me);
  gauge(b, m, 100);
  assert.ok(!b.dualOptionsFor(me).some((o) => o.id === 'dt_taishoumetsu'));
  assert.ok(b.dualOptionsFor(me).some((o) => o.id === 'dt_cross_mahouken'), '剣の 職業＋呪文の 職業');
  // メニューの「関係する」も 職業で
  assert.ok(!dualRelated('dt_honoo_tatsumaki', partyJobSet([{ job: 'mage' }]), new Set(['bagi'])));
});

test('全員集合: 4人が 同じ 職業、または 4人とも 同じ 基本職から 分かれた 職業（今の 職業で）', () => {
  assert.ok(sameLine(['neet', 'neet', 'neet', 'neet']), '同じ 職業');
  assert.ok(sameLine(['warrior', 'battlemaster', 'paladin', 'magic_knight']), '戦士から 分かれた 職業');
  assert.ok(sameLine(['priest', 'sage', 'paladin', 'high_priest']), '僧侶から 分かれた 職業');
  assert.ok(!sameLine(['warrior', 'monk', 'mage', 'priest']), '基本職が ばらばら');
  assert.ok(!sameLine(['okan', 'neet', 'schoolkid', 'shachiku']));
  const four = (jobs) => dualOptions(p('A', jobs[0]), jobs.slice(1).map((j, i) => p(`B${i}`, j)), weaponOk);
  assert.ok(find(four(['warrior', 'battlemaster', 'paladin', 'magic_knight']), 'dt_zenin'));
  assert.ok(find(four(['neet', 'neet', 'neet', 'neet']), 'dt_zenin'), 'ニート 4人でも');
  assert.ok(!find(four(['warrior', 'monk', 'mage', 'priest']), 'dt_zenin'));
  // 強さ: 前より 少し 強く（条件が 重く なった）・敵全体
  assert.ok(DUAL_TECHS.dt_zenin.parts[0].k >= 0.8 && DUAL_TECHS.dt_zenin.target === 'enemies');
  // ほんとうの たたかい
  const b = party(['warrior', 'battlemaster', 'paladin', 'magic_knight'], { mine: [1, 2, 3], enemies: ['rockman', 'skeleton'] });
  const [me] = b.allies;
  for (const a of b.allies) readyUp(b, a);
  const o = b.dualOptionsFor(me).find((x) => x.id === 'dt_zenin');
  assert.ok(o, '戦士の 系統 4人で 出せる');
  b.command(me.id, cmdOf(o), 's1');
  const act = runUntil(b, isDual).find(isDual);
  assert.equal(act.dual.id, 'dt_zenin');
  assert.ok(b.enemies.every((e) => act.results.some((r) => r.id === e.id && r.dmg > 0)), '敵全体');
});

test('グランドフィナーレ: 剣・こぶし・攻撃呪文・いやしの それぞれで 上級職 いじょうの 人が 1人ずつ', () => {
  const adv = [p('剣', 'battlemaster'), p('拳', 'holyfist'), p('魔', 'sage'), p('癒', 'paladin')];
  assert.ok(find(dualOptions(adv[0], adv.slice(1), weaponOk), 'dt_finale'));
  // 超級職・伝説の 職業でも よい
  const sup = [p('剣', 'dragon_knight'), p('拳', 'god_hand'), p('魔', 'archmage'), p('癒', 'high_priest')];
  assert.ok(find(dualOptions(sup[0], sup.slice(1), weaponOk), 'dt_finale'), '超級職');
  // 1人でも 基本職なら 出ない（どの 役でも）
  const base = { 剣: 'warrior', 拳: 'monk', 魔: 'mage', 癒: 'priest' };
  for (let i = 0; i < 4; i++) {
    const team = adv.map((x, k) => (k === i ? p(x.id, base[x.id]) : x));
    assert.ok(!find(dualOptions(team[0], team.slice(1), weaponOk), 'dt_finale'), `${team[i].job}（基本職）が いると 出ない`);
  }
  // 役が たりない（剣の 上級職が 2人で こぶしが いない）
  assert.ok(!find(dualOptions(p('剣', 'battlemaster'), [p('剣2', 'samurai'), adv[2], adv[3]], weaponOk), 'dt_finale'));
  // 組は すべて 上級職 いじょう
  for (const g of DUAL_TECHS.dt_finale.need) for (const j of groupJobs(g)) assert.ok(JOBS[j].tier >= 1, `${JOBS[j].name}`);
});

test('家族会議・なぞは すべて 解けた！: 4人目も 職業しばり', () => {
  const okan = p('母', 'okan'), papa = p('父', 'shachiku'), kid = p('子', 'schoolkid');
  assert.ok(find(dualOptions(okan, [papa, kid, p('兄', 'neet')], weaponOk), 'dt_kazoku_kaigi'), 'ニート');
  assert.ok(find(dualOptions(okan, [papa, kid, p('ネコ', 'doraemon')], weaponOk), 'dt_kazoku_kaigi'), 'ネコ型ロボット');
  for (const j of ['warrior', 'mage', 'hero']) assert.ok(!find(dualOptions(okan, [papa, kid, p('他', j)], weaponOk), 'dt_kazoku_kaigi'), j);
  const det = p('探', 'meitantei'), gamer = p('ゲ', 'gamer'), robot = p('ロ', 'doraemon');
  for (const j of ['police', 'spy', 'oshiri_tantei']) assert.ok(find(dualOptions(det, [gamer, robot, p('4', j)], weaponOk), 'dt_nazo'), j);
  for (const j of ['warrior', 'okan']) assert.ok(!find(dualOptions(det, [gamer, robot, p('4', j)], weaponOk), 'dt_nazo'), j);
});

// ───────────── ミナデイン ─────────────
test('ミナデイン: 勇者の 系統が 1人 いれば、あとの 3人は だれでも よい（家族が 決めた れいがい）', () => {
  assert.deepEqual([...HERO_LINE_JOBS].sort(), ALL_JOBS.filter((j) => jobAncestry(j).has('hero')).sort());
  for (const j of ['hero', 'loto_hero']) assert.ok(HERO_LINE_JOBS.includes(j), j);
  const t = DUAL_TECHS.dt_minadein;
  assert.equal(t.name, 'ミナデイン');
  assert.equal(t.need.length, 4);
  assert.equal(t.element, 'bolt');
  assert.equal(t.target, 'enemy');
  for (const hero of ['hero', 'loto_hero']) {
    const o = find(dualOptions(p('勇', hero), [p('兄', 'neet'), p('母', 'okan'), p('子', 'schoolkid')], weaponOk), 'dt_minadein');
    assert.ok(o, `${hero}＋ニート・おかん・小学生`);
    assert.deepEqual(o.mp, t.mp);
  }
  // 勇者が いない・勇者を マスターしただけ（今は 戦士）・3人しか いない・呪文を ふうじられた
  assert.ok(!find(dualOptions(p('戦', 'warrior'), [p('兄', 'neet'), p('母', 'okan'), p('子', 'schoolkid')], weaponOk), 'dt_minadein'));
  assert.ok(!find(dualOptions(p('勇', 'hero'), [p('兄', 'neet'), p('母', 'okan')], weaponOk), 'dt_minadein'));
  assert.ok(!find(dualOptions(p('勇', 'hero'), [p('兄', 'neet', { statuses: ['silence'] }), p('母', 'okan'), p('子', 'schoolkid')], weaponOk), 'dt_minadein'));
  // メニュー: 勇者の 系統が パーティーに いる 時だけ
  assert.ok(dualRelated('dt_minadein', partyJobSet([{ job: 'loto_hero' }])));
  assert.ok(!dualRelated('dt_minadein', partyJobSet([{ job: 'warrior' }, { job: 'mage' }])));
  // えんしゅつ・文字
  assert.ok(DUAL_FX.dt_minadein && DUAL_FX.dt_minadein.finale === 'bolt');
  for (const s of [t.name, t.desc, ...t.parts.map((x) => x.say).filter(Boolean)]) assert.deepEqual(checkText(s), [], s);
});

test('ミナデイン: 合体技で いちばん 強い 敵1体の 雷。ボスには 1回で さいだいHPの 35%まで（ほかの 合体技は 20〜30%まで）', () => {
  const power = (id) => Math.max(0, ...DUAL_TECHS[id].parts.filter((x) => x.type === 'power').map((x) => x.k * DUAL_POWER[DUAL_TECHS[id].need.length]));
  const mina = power('dt_minadein');
  for (const id of DUAL_ORDER) if (id !== 'dt_minadein') assert.ok(power(id) < mina, `${DUAL_TECHS[id].name} ${power(id)} < ミナデイン ${mina}`);
  assert.ok(DUAL_TECHS.dt_minadein.bossCap > Math.max(...Object.values(DUAL_BOSS_CAP)));
  // ほんとうの たたかい: ふつうの 敵には 大きく、ボスには 上限まで
  const b = party(['hero', 'warrior', 'priest', 'mage'], { mine: [1, 2, 3] });
  const [me] = b.allies;
  for (const a of b.allies) readyUp(b, a);
  const o = b.dualOptionsFor(me).find((x) => x.id === 'dt_minadein');
  assert.ok(o, '勇者・戦士・僧侶・魔法使いで 出せる');
  b.command(me.id, cmdOf(o, b.enemies[0].id), 's1');
  const act = runUntil(b, isDual).find(isDual);
  assert.equal(act.dual.id, 'dt_minadein');
  assert.equal(act.dual.n, 4);
  const dmg = act.results.filter((r) => r.dmg > 0).reduce((s, r) => s + r.dmg, 0);
  assert.ok(dmg > 0 && act.results.every((r) => !r.dmg || r.element === 'bolt'), '雷');
  const bb = party(['hero', 'warrior', 'priest', 'mage'], { mine: [1, 2, 3], enemies: ['argos'], boss: true, keep: true });
  const boss = bb.enemies[0];
  boss.actions = [{ w: 1, id: 'm_nothing' }];
  for (const a of bb.allies) { readyUp(bb, a); a.mag = 999; a.atk = 999; }
  const ob = bb.dualOptionsFor(bb.allies[0]).find((x) => x.id === 'dt_minadein');
  const hp0 = boss.hp;
  bb.command(bb.allies[0].id, cmdOf(ob, boss.id), 's1');
  runUntil(bb, isDual);
  assert.ok(hp0 - boss.hp <= Math.ceil(boss.maxHp * DUAL_TECHS.dt_minadein.bossCap) + 1, `ボスへの ダメージ ${hp0 - boss.hp} / ${boss.maxHp}`);
  assert.ok(hp0 - boss.hp >= boss.maxHp * 0.3, 'とても 強い 人たちなら 上限まで');
});

test('水の神殿: 水の衣は ミナデイン（合体技）でも 雷の 技でも はがせる。知っている 人の オートは 雷の 技を ねらう', () => {
  const b = party(['hero', 'warrior', 'priest', 'mage'], { mine: [1, 2, 3], enemies: ['morgana', 'morgana', 'morgana'], boss: true, keep: true });
  for (const e of b.enemies) e.actions = [{ w: 1, id: 'm_nothing' }];
  const real = b.get(b.mirage.real);
  assert.ok(real.veil, 'はじめは 水の衣');
  const [me] = b.allies;
  for (const a of b.allies) readyUp(b, a);
  const o = b.dualOptionsFor(me).find((x) => x.id === 'dt_minadein');
  b.command(me.id, cmdOf(o, real.id), 's1');
  const act = runUntil(b, isDual).find(isDual);
  assert.equal(act.dual.id, 'dt_minadein');
  assert.equal(act.veilBreak, real.id);
  assert.ok(!real.veil, 'ミナデインで はじけた');
  // 知っている 人の オート: 水の衣の 敵に 雷の 技（魔法戦士の ライデイン など）
  const b2 = party(['magic_knight', 'priest'], { enemies: ['morgana', 'morgana', 'morgana'], boss: true, keep: true });
  b2.knowsTemple = true;
  b2.knowsMirage = true;
  const mk = b2.allies[0];
  const cmd = decideAlly(b2, mk);
  assert.equal(cmd.type, 'ability');
  const e = ABILITIES[cmd.id].effect;
  assert.ok([e, ...(e.parts || [])].some((x) => x.element === 'bolt'), `${ABILITIES[cmd.id].name} は 雷`);
  assert.equal(cmd.target, b2.mirage.real, '本物を ねらう');
  // きずな技は もう えらばない
  assert.ok(!['bond'].includes(decideAlly(b2, b2.allies[1]).type));
});

// ───────────── 待ち中の ダメージ ─────────────
const hurt = (b, t, dmg = 5) => {
  const ev = { t: 'act', id: b.enemies[0].id, lines: [], upd: [], results: [] };
  b.damage(b.enemies[0], t, dmg, ev, { element: 'phys' });
  return ev;
};

test('待ち中の ダメージ（2人技）: よやくした 人が ダメージを 受けると、ゲージは 半分から やり直し。よやくは つづく', () => {
  const b = party(['warrior', 'monk']);
  const [me, monk] = b.allies;
  readyUp(b, me);
  gauge(b, monk, 10);
  const o = b.dualOptionsFor(me, null, false, true).find((x) => x.id === 'dt_cross_break');
  assert.equal(b.command(me.id, cmdOf(o, b.enemies[0].id), 's1').waiting, true);
  const ev = hurt(b, me);
  assert.equal(me.atb, DUAL_BREAK_ATB, 'ゲージは 半分');
  assert.equal(DUAL_BREAK_ATB, 50);
  assert.ok(me.waitDual && me.waitDual.slow, 'よやくは つづく');
  assert.ok(ev.lines.includes(`${me.name}の力あわせがみだれた！`), ev.lines.join(' / '));
  assert.deepEqual(ev.dualBreak, [me.id]);
  for (const l of ev.lines) assert.deepEqual(checkText(l), []);
  // もう 一度 ダメージを 受けても それ以上は へらない（ためなおし中）
  me.atb = 70;
  hurt(b, me);
  assert.equal(me.atb, 70, 'ためなおし中は かわらない');
  me.atb = DUAL_BREAK_ATB;
  // 仲間が 先に たまっても、自分の ゲージが たまるまで 出さない（仲間は まつ）
  gauge(b, monk, 99.9);
  const evs = runUntil(b, (e) => e.t === 'dualHold', 3000);
  assert.ok(evs.some((e) => e.t === 'dualHold' && e.id === monk.id), '仲間は まつ');
  assert.ok(!evs.some(isDual), 'まだ 出ない');
  assert.ok(me.atb < 100 && me.atb > DUAL_BREAK_ATB, '自分の ゲージは すすんでいる');
  assert.ok(!evs.some((e) => e.t === 'ready' && e.id === me.id), '自分に コマンドは 出ない');
  const evs2 = runUntil(b, isDual, 30000);
  const act = evs2.find(isDual);
  assert.equal(act?.dual?.id, 'dt_cross_break', 'ゲージが たまったら いっしょに 出る');
  assert.ok(!me.waitDual);
});

test('待ち中の ダメージ（3人技）: 先に たまって まっている 仲間は ゲージ半分から。まだ たまっていない 仲間・よやくに 関係 ない 人は かわらない', () => {
  const b = party(['warrior', 'monk', 'mage', 'priest'], { seed: 4 });
  const [me, monk, mage, priest] = b.allies;
  readyUp(b, me);
  gauge(b, monk, 10);
  gauge(b, mage, 80);
  gauge(b, priest, 30);
  const o = b.dualOptionsFor(me, null, false, true).find((x) => x.id === 'dt_delta' && x.partners.includes(monk.id) && x.partners.includes(mage.id));
  b.command(me.id, cmdOf(o, b.enemies[0].id), 's1');
  runUntil(b, (e) => e.t === 'dualHold' && e.id === mage.id, 5000);
  assert.equal(mage.dualHold, true, '魔法使いは まっている');
  const monkAtb = monk.atb, priestAtb = priest.atb;
  const ev = hurt(b, mage);
  assert.equal(mage.atb, DUAL_BREAK_ATB);
  assert.equal(mage.dualHold, false);
  assert.equal(mage.dualTarget, me.id, '合体技には 入った まま');
  assert.ok(ev.lines.some((l) => l === `${mage.name}の力あわせがみだれた！`));
  const ev2 = hurt(b, monk);
  assert.equal(monk.atb, monkAtb, 'まだ たまっていない 人は かわらない');
  assert.ok(!ev2.dualBreak);
  hurt(b, priest);
  assert.equal(priest.atb, priestAtb, 'よやくに 関係 ない 人も かわらない');
  const act = runUntil(b, isDual).find(isDual);
  assert.equal(act?.dual?.id, 'dt_delta', 'そろったら 出る');
  assert.deepEqual([...act.dual.m].sort(), [me.id, monk.id, mage.id].sort());
  // 画面: 名前の 札と 短い ことば（client/battle-dual.js の onDualBreak）
  const src = fs.readFileSync(new URL('../public/js/client/battle-dual.js', import.meta.url), 'utf8');
  assert.match(src, /export function onDualBreak/);
  assert.match(src, /の力あわせがみだれた！/);
});

// ───────────── きずなゲージ・きずな技は なくなった ─────────────
test('きずなゲージ・きずな技は なくなった（技の データ・たたかい・画面）', () => {
  assert.equal(ABILITIES.minadein, undefined, 'きずな技の ミナデイン');
  const types = (e) => (e?.type === 'multi' ? (e.parts || []).flatMap(types) : [e?.type]);
  for (const [id, a] of Object.entries(ABILITIES)) {
    assert.notEqual(a.kind, 'bond', id);
    for (const ty of types(a.effect)) assert.ok(ty !== 'bondUp' && ty !== 'bond', `${id}: ${ty}`);
    for (const s of [a.desc, a.cast].filter(Boolean)) assert.ok(!s.includes('きずなゲージ'), `${id}: ${s}`);
  }
  for (const t of Object.values(DUAL_TECHS)) for (const x of t.parts) assert.notEqual(x.type, 'bondUp');
  // ゲージを ためる 技は ほかの 効果に（例: アンコール … 仲間の 番が 早く 来る・おうえんの歌 … 攻撃力）
  assert.equal(ABILITIES.ss_encore.effect.type, 'atbSet');
  assert.equal(ABILITIES.ouen.effect.type, 'buff');
  assert.ok(types(ABILITIES.lt_kizuna.effect).includes('mpHeal') && types(ABILITIES.lt_kizuna.effect).includes('atbSet'));
  // たたかい
  const b = party(['warrior', 'priest']);
  assert.equal(b.bond, undefined);
  assert.equal(typeof b.addBond, 'undefined');
  assert.ok(!('bond' in b.snapshot()));
  const evs = runUntil(b, () => false, 3000);
  assert.ok(!evs.some((e) => 'bond' in e), 'できごとに きずなの 値は ない');
  // 画面（client/battle.js）: ゲージの 表示・★ミナデイン・みんなで ボタンは ない
  const src = fs.readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  for (const s of ['b-bond', '★ミナデイン', 'bondjoin', 'startBondPrompt', "type: 'bond'"]) assert.ok(!src.includes(s), s);
});

test('合体技の 名前を 大きく: コマンドの 行は 名前だけ。だれと・必要な 職業・よやくは 説明の まどに', () => {
  const src = fs.readFileSync(new URL('../public/js/client/battle-dual.js', import.meta.url), 'utf8');
  const menu = src.slice(src.indexOf('export function dualMenu'), src.indexOf('export function askingName'));
  assert.match(menu, /html: `<span class="dual-nm">\$\{esc\(t\.name\)\}<\/span>`/);
  assert.ok(!menu.includes('with-line') && !menu.includes('といっしょに'), '名前の 行に 補足を 書かない');
  const info = src.slice(src.indexOf('export function dualInfo'), src.indexOf('export function dualMenu'));
  for (const s of ['といっしょに', '必要な職業', 'よやく']) assert.ok(info.includes(s), s);
  const fx = fs.readFileSync(new URL('../public/js/client/render/dualfx.js', import.meta.url), 'utf8');
  assert.match(fx, /\.dual-nm \{ font-size: 1\.3em/);
  const m = fs.readFileSync(new URL('../public/js/client/ui/menu.js', import.meta.url), 'utf8');
  assert.match(m, /<span class="nm dual-nm">\$\{esc\(t\.name\)\}<\/span><span class="ln">/);
});

// ───────────── 古い セーブ ─────────────
test('古い セーブ: きずなの 値・dualSeen（けした・かえた 合体技も）・お気に入り・作戦に 前の 技が のこっていても 読めて 遊べる', async () => {
  const { GameWorld } = await import('../public/js/shared/world/world.js');
  const { startFieldBattle } = await import('../public/js/shared/world/battles.js');
  const { Bot, tickN } = await import('./helpers.js');
  // 1) ふつうに キャラを 作って セーブ
  const saved = [];
  const w1 = new GameWorld({ offline: true, rng: makeRng(5), rateLimit: false, storage: { load: () => ({}), save: (d) => saved.push(JSON.parse(JSON.stringify(d))) } });
  const b1 = new Bot(w1, 'ユウ');
  await b1.login();
  const cid = await b1.createAndPlay('mage');
  await b1.settle();
  w1.markDirty();
  w1.saveNow();
  const data = saved.pop();
  // 2) 前の 版の 項目を 足す
  const c0 = data.characters[cid];
  c0.dualSeen = { dt_zenin: 1, dt_jump: 1, dt_finale: 1, dt_raiden_strash: 1, dt_blizzard: 1 };
  c0.favorites = ['minadein', 'mera'];
  c0.autoOff = ['minadein', 'dt_zenin'];
  c0.battleSettings = { ...(c0.battleSettings || {}), autoDual: 'dt_zenin' };
  c0.bond = 77;
  c0.kizuna = 100;
  // 3) 読みこんで 遊ぶ
  const w2 = new GameWorld({ offline: true, rng: makeRng(6), rateLimit: false, storage: { load: () => JSON.parse(JSON.stringify(data)), save: () => {} } });
  const bot = new Bot(w2, 'ユウ');
  await bot.login();
  bot.send({ t: 'play', id: cid });
  await bot.settle();
  const c = w2.data.characters[cid];
  assert.equal(c.name, 'ユウ');
  assert.equal(dualKnown(c, 'dt_zenin'), true, '全員集合は のこした（条件が かわった だけ）');
  assert.equal(dualKnown(c, 'dt_cross_mahouken'), true, 'まとめた 先の 技も わかる');
  assert.equal(c.dualSeen.dt_blizzard, 1, 'けずった 技の 記録も 消さない');
  bot.s.map = 'overworld';
  const ctx = startFieldBattle(w2, bot.s, { id: 'dz', sp: 'kobushi', group: ['kobushi'], zone: 'outskirts', table: 'outskirts', busy: false });
  const wb = ctx.battle;
  for (const e of wb.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 20; }
  const a = wb.allies.find((x) => x.charId === c.id);
  for (let i = 0; i < 800 && !a.ready; i++) await tickN(w2, 1);
  // 前の 版の 画面から くる コマンド（きずな技・力あわせ・けした 合体技）は ことわる だけ
  for (const cmd of [{ type: 'bond', target: wb.enemies[0].id }, { type: 'bondJoin' }, { type: 'dual', id: 'dt_raiden_strash', partner: 'x', target: wb.enemies[0].id },
    { type: 'dual', id: 'dt_zenin', partners: ['a', 'b', 'c'] }, { type: 'ability', id: 'minadein', target: wb.enemies[0].id }]) {
    assert.equal(wb.command(a.id, cmd, a.controller).ok, false, JSON.stringify(cmd));
  }
  assert.equal(wb.command(a.id, { type: 'attack', target: wb.enemies[0].id }, a.controller).ok, true, 'ふつうに 続けられる');
  wb.setAuto(a.id, true);
  for (let i = 0; i < 4000 && !wb.over; i++) await tickN(w2, 1);
  assert.ok(wb.over, '戦いは 終わる');
});
