// 第51回 C1: 幻の職業（tier 4）海賊王・伝説の超勇者・日の火影・天才しせつ管理者AI（docs/plan-r51-phantom.md）
//  ・職業の データ（id・req・強さは もとの 伝説の 職業より 上）・技（8つ・覚えられる・伝説より 強い）・ひらめき技
//  ・新しい しかけ（battle-phantom-a.js）: 仲間の 数（crew）・気を ためる（kiCharge → ki）・影分身（clones → dance）・自動最適化（passive.autoOpt・autoBoost）
//  ・えんしゅつ o7 は test/ax-o7.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JOBS, ALL_JOBS, JOB_MAX_LEVEL } from '../public/js/shared/data/jobs.js';
import { PHANTOM_JOBS_A } from '../public/js/shared/data/jobs-phantom-a.js';
import { ABILITIES, abilityRole } from '../public/js/shared/data/abilities.js';
import { PHANTOM_ABILITIES_A } from '../public/js/shared/data/abilities-phantom-a.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
import { HIRA_PHANTOM_A_ABILITIES, HIRAMEKI_PHANTOM_A } from '../public/js/shared/data/hirameki-phantom-a.js';
import { JOB_TAGS, TAGS } from '../public/js/shared/data/job-tags.js';
import { TRIAL_WORDS } from '../public/js/shared/data/job-trials.js';
import { JOB_SAY } from '../public/js/shared/data/job-talk.js';
import { VEHICLES } from '../public/js/shared/data/vehicles.js';
import { AX_SKILLS } from '../public/js/shared/ax-time.js';
import { newCharacter, gainExp, expForLevel, fullHeal, learnedAbilities, hiraAllowed } from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { KI_MAX, OPT_STATS } from '../public/js/shared/battle-phantom-a.js';
import { checkText } from '../tools/kanji-check.mjs';

const NEW = ['pirate_king', 'super_hero', 'sun_hokage', 'facility_ai'];
// 幻の職業の ならび（PHANTOM_ORDER）は F が jobs.js に 足す。まだ ない ときは この テストの 中だけ 足す（覚える 技・ひらめき は ALL_JOBS を 見る）
for (const id of NEW) if (!ALL_JOBS.includes(id)) ALL_JOBS.push(id);
const REQ = { pirate_king: ['nika', 'pirate'], super_hero: ['loto_hero', 'ss3'], sun_hokage: ['hinokami', 'hokage'], facility_ai: ['facility_genius', 'creator'] };
const NAMES = { pirate_king: '海賊王', super_hero: '伝説の超勇者', sun_hokage: '日の火影', facility_ai: '天才しせつ管理者AI' };
const MODS = ['hp', 'mp', 'str', 'def', 'agi', 'mag', 'heal'];
const partsOf = (e) => (e.type === 'multi' ? e.parts : [e]);
const textOk = (s, what) => assert.deepEqual(checkText(s), [], `${what}: ${s}`);
const sum = (m) => MODS.reduce((s, k) => s + (m[k] || 1), 0);
const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };

// n … 仲間の 人数（1〜4）。1人目が その 職業（つかう 人）、ほかは 僧侶（オート）
// idle … ほかの 仲間は 自分では 動かない（くらべる ときに バフを かけない）
function setup(job, { seed = 1, n = 2, enemies = ['rockman', 'rockman', 'skeleton'], lv = 45, idle = false } = {}) {
  const chars = [];
  for (let i = 0; i < n; i++) {
    const c = newCharacter({ id: `p${i}`, name: ['ヒナ', 'ミナ', 'ソラ', 'カイ'][i], job: i ? 'priest' : 'warrior' });
    gainExp(c, expForLevel(lv));
    if (!i) { master(c, ...REQ[job], job); c.job = job; c.equip.weapon = null; }
    fullHeal(c);
    chars.push(c);
  }
  const b = new Battle({ rng: makeRng(seed), allies: chars.map((c, i) => (i ? (idle ? { char: c, controller: 's2' } : { char: c, auto: true, kind: 'support' }) : { char: c, controller: 's1' })), enemies, canFlee: true });
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 50000; }
  for (const a of b.allies) a.mp = a.maxMp = 999;
  return { b, c: chars[0], me: b.allies[0], m: b.allies[1] };
}
const readyUp = (b, a) => { for (let i = 0; i < 1200 && !a.ready; i++) b.tick(50); return a.ready; };
const runUntilAct = (b, id) => {
  const evs = [];
  for (let i = 0; i < 400 && !evs.some((e) => e.t === 'act' && e.id === id); i++) evs.push(...b.tick(50));
  return evs.find((e) => e.t === 'act' && e.id === id);
};
function use(b, me, id, target) {
  assert.ok(readyUp(b, me), `${id}: 番が 来る`);
  const r = b.command(me.id, { type: 'ability', id, target: target ?? b.enemies[0].id }, 's1');
  assert.equal(r.ok, true, `${id} ${r.reason || ''}`);
  const act = runUntilAct(b, me.id);
  assert.ok(act, id);
  return act;
}
const dealt = (act) => (act.results || []).filter((r) => r.dmg > 0 && !r.id.startsWith('p')).reduce((s, r) => s + r.dmg, 0);
const hitsOn = (act, id) => (act.results || []).filter((r) => r.id === id && (r.dmg > 0 || r.miss)).length;

// ───────────── 職業 ─────────────
test('第51回 C1 の 幻の職業: id・名前・tier 4・req（2つとも きわめる）・文字・タグ・試練の ことば・ひとこと・乗り物', () => {
  assert.deepEqual(Object.keys(PHANTOM_JOBS_A), NEW);
  for (const id of NEW) {
    const j = JOBS[id];
    assert.equal(j, PHANTOM_JOBS_A[id], 'jobs.js に まざる');
    assert.equal(j.id, id);
    assert.equal(j.name, NAMES[id]);
    assert.equal(j.tier, 4);
    assert.deepEqual(j.req, REQ[id]);
    assert.equal(j.reqSuper, undefined, 'reqSuper は つかわない');
    for (const r of j.req) assert.ok(JOBS[r], `${id}: ${r}`);
    for (const s of [j.name, j.short, j.desc]) textOk(s, id);
    assert.deepEqual(checkText(j.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
    assert.match(j.color, /^#[0-9a-f]{6}$/);
    assert.ok(j.weapons.length && j.armor.length);
    // タグ（合体技）・試練・ひとこと・乗り物
    assert.ok(JOB_TAGS[id].length >= 2 && JOB_TAGS[id].length <= 4 && JOB_TAGS[id].every((t) => TAGS[t]), id);
    assert.deepEqual(j.tags, JOB_TAGS[id]);
    textOk(TRIAL_WORDS[id], id);
    textOk(JOB_SAY[id], id);
    assert.ok(JOB_SAY[id].length <= 24);
    assert.ok(Object.values(VEHICLES).some((v) => v.jobs?.includes(id)), `${id} の 乗り物`);
  }
  // 天才しせつ管理者AIの もとは 薬局の クリエイター
  assert.equal(JOBS.creator.name, 'クリエイター');
});

test('第51回 C1 の 幻の職業: 強さは もとの 伝説の 職業より 上（どの 強さも 下まわらない・合計は 1わり いじょう 上）', () => {
  for (const id of NEW) {
    const j = JOBS[id];
    const legends = j.req.filter((r) => JOBS[r].tier === 3);
    assert.ok(legends.length >= 1, id);
    for (const r of legends) {
      const L = JOBS[r];
      for (const k of MODS) assert.ok(j.mods[k] >= (L.mods[k] || 1), `${id} の ${k} ${j.mods[k]} は ${r} の ${L.mods[k]} より 下でない`);
      const ratio = sum(j.mods) / sum(L.mods);
      assert.ok(ratio >= 1.08 && ratio <= 1.3, `${id} / ${r} = ${ratio.toFixed(3)}`);
      const lv = (x) => Object.values(x.perLv || {}).reduce((s, v) => s + v, 0);
      assert.ok(lv(j) >= lv(L), `${id} の perLv`);
    }
  }
  // 天才しせつ管理者AIは 毎ターン 自動で 最適化（passive.autoOpt）、海賊王は お宝（gold）
  assert.ok(JOBS.facility_ai.passive.autoOpt && JOBS.facility_ai.passive.foresee);
  assert.ok(JOBS.pirate_king.passive.gold > 1);
});

// ───────────── 技 ─────────────
test('第51回 C1 の 技: 1つの 職業に 8つ（Lv1〜10・看板は Lv10 で いちばん MP）・job・文字・覚えられる・攻撃技 2つ いじょう・補助の 上限', () => {
  for (const id of NEW) {
    const j = JOBS[id];
    assert.equal(j.learn.length, 8, id);
    const lvs = j.learn.map(([lv]) => lv);
    assert.equal(lvs[0], 1);
    assert.equal(lvs[7], 10);
    assert.ok(lvs.every((v, i) => !i || v > lvs[i - 1]), `${id}: Lv の じゅん`);
    const [, sig] = j.learn[7];
    assert.equal(sig, `${id}_sig`);
    const mps = j.learn.map(([, s]) => ABILITIES[s].mp);
    assert.equal(Math.max(...mps), ABILITIES[sig].mp, `${id}: 看板の 技が いちばん MPを 使う`);
    for (const [, s] of j.learn) {
      const a = ABILITIES[s];
      assert.ok(a && PHANTOM_ABILITIES_A[s] === a, s);
      assert.equal(a.job, id, `${s}.job`);
      for (const t of [a.name, a.desc, a.cast]) textOk(t, s);
      assert.deepEqual(checkText(a.kana).filter((p) => p.kind !== 'kana'), [], `${s} kana`);
      assert.ok(['enemy', 'enemies', 'group', 'ally', 'allies', 'self'].includes(a.target), s);
      // みんなに かける 補助は 伝説と おなじ 上限（1つ 1.4倍・いくつも 1.35倍）
      for (const p of partsOf(a.effect)) {
        if (p.type === 'buff' && !p.target && a.target === 'allies') assert.ok(p.mult <= ((p.stats || []).length > 1 ? 1.35 : 1.4) + 1e-9, `${s}: ${p.mult}`);
        if (p.type === 'atbSet' && ['enemy', 'enemies', 'group'].includes(a.target)) assert.ok(p.chance > 0 && p.chance < 1, `${s}: 効く わりあい`);
      }
    }
    assert.ok(j.learn.filter(([, s]) => abilityRole(ABILITIES[s]) === 'dmg').length >= 3, `${id}: 攻撃技`);
    assert.ok(j.learn.some(([, s]) => abilityRole(ABILITIES[s]) !== 'dmg'), `${id}: 補助・回復の 技`);
    // 覚えられる
    const c = newCharacter({ id: 'x', name: 'x', job: 'warrior' });
    master(c, ...REQ[id], id);
    c.job = id;
    const got = learnedAbilities(c);
    for (const [, s] of j.learn) assert.ok(got.includes(s), `${id} は ${s} を 覚える`);
  }
  assert.equal(Object.keys(PHANTOM_ABILITIES_A).length, 32);
});

test('第51回 C1 の 技: 伝説の 技より 強い（看板の 技・単体の 大技・全体の 技・回復）', () => {
  const ph = (id) => ABILITIES[id].effect;
  const multOf = (e, extra = 1) => (e.mult || 0) * (e.hits || 1) * extra;
  // 海賊王（4人で 1.9倍）の 自由の大船団 ＞ ニカの 解放の戦士
  assert.ok(multOf(partsOf(ph('pirate_king_sig'))[0], 1 + 0.3 * 3) > multOf(partsOf(ph('nk_kaihou'))[0]) * 1.2);
  assert.ok(multOf(partsOf(ph('pk_jiyuu'))[0]) > multOf(partsOf(ph('nk_kaihou'))[0]));
  assert.ok(multOf(ph('pk_gatling')) > multOf(ph('s3_rengeki')));
  // 超勇者: 気 3だんかいの かめはめデイン（全体）＞ かめはめ波・極（単体）。気が なくても ギガクロスブレイクより 強い
  assert.ok(multOf(ph('super_hero_sig'), 1 + ph('super_hero_sig').ki * KI_MAX) > multOf(ph('s3_kame')));
  assert.ok(multOf(ph('super_hero_sig')) > multOf(ph('lt_gigacross')));
  assert.ok(ph('sh_gigadein').base[0] > ph('hg_bijuu').base[0]);
  assert.ok(ph('sh_inori').base[0] > ph('lt_inori').base[0]);
  // 日の火影: 分身4人の 神楽（3 ＋ 2×4 回）＞ ヒノカミ神楽・多重影分身の術
  const kagura = ph('sun_hokage_sig');
  const hitsSig = kagura.hits + kagura.dance * kagura.make;
  assert.equal(hitsSig, 11);
  assert.ok(kagura.mult * hitsSig > multOf(ph('hinokami_sig')) && kagura.mult * hitsSig > multOf(ph('hokage_sig')));
  assert.ok(multOf(ph('sk_kasha')) > multOf(ph('hn_kasha')) && multOf(ph('sk_rasen')) > multOf(ph('hg_oodama')));
  // AI: 全館完全最適化 ＞ 最適制御、AIのひらめき ＞ 天才のひらめき、AI全館空調 ＞ 全館空調
  assert.ok(partsOf(ph('facility_ai_sig'))[0].base[0] > partsOf(ph('fg_saiteki'))[0].base[0]);
  assert.ok(ph('fa_hirameki').base[0] > ph('fg_hirameki').base[0]);
  assert.ok(partsOf(ph('fa_kuuchou'))[0].base[0] > partsOf(ph('fg_kuuchou'))[0].base[0]);
});

test('第51回 C1 の ひらめき技: 1つの 職業に 1つ・その 職業の 技を 使いこむと ひらめく・えんしゅつ o7', () => {
  for (const id of NEW) {
    const own = Object.keys(HIRA_PHANTOM_A_ABILITIES).filter((h) => HIRA_PHANTOM_A_ABILITIES[h].job === id);
    assert.equal(own.length, 1, id);
    const h = own[0];
    const a = ABILITIES[h];
    assert.ok(a.hirameki && HIRAMEKI[h] === HIRAMEKI_PHANTOM_A[h]);
    for (const t of [a.name, a.desc, a.cast]) textOk(t, h);
    for (const from of Object.keys(HIRAMEKI[h].from)) assert.equal(ABILITIES[from].job, id, `${h} の もと ${from}`);
    const c = newCharacter({ id: 'x', name: 'x', job: 'warrior' });
    c.job = id;
    assert.equal(hiraAllowed(c, h), true);
    assert.equal(AX_SKILLS[h]?.group, 'o7', `${h} の えんしゅつ`);
  }
});

// ───────────── たたかい ─────────────
test('第51回 C1 の 技は ぜんぶ たたかいで 使えて、文字が 正しく、攻撃技は ダメージ・オートでも 技を 使う', () => {
  let n = 0;
  for (const j of NEW) {
    for (const [, id] of JOBS[j].learn) {
      const { b, me, m } = setup(j, { seed: ++n });
      const a = ABILITIES[id];
      const act = use(b, me, id, a.target === 'ally' ? m.id : b.enemies[0].id);
      assert.ok(!act.lines.some((l) => l.includes('MPが足りない')), id);
      for (const l of act.lines) textOk(l, id);
      if (abilityRole(a) === 'dmg') assert.ok(dealt(act) > 0, `${id} の ダメージ`);
      assert.equal(act.fx?.ax, AX_SKILLS[id].anim, `${id} の えんしゅつ`);
    }
    const s = setup(j, { seed: 7 });
    s.me.abilities = learnedAbilities(s.c);
    let used = 0;
    for (let i = 0; i < 12; i++) {
      const cmd = decideAlly(s.b, s.me);
      assert.ok(cmd?.type, `${j}: ${JSON.stringify(cmd)}`);
      if (cmd.type === 'ability') used++;
    }
    assert.ok(used > 0, `${j}: オートでも 技を 使う`);
  }
});

test('海賊王: 仲間が 多いほど 強い（crew）・自由の技で 敵が 笑いころげて 止まる', () => {
  let one = 0, four = 0;
  for (let s = 1; s <= 8; s++) {
    // おなじ 4人の 戦いで、ほかの 3人が たおれている とき
    const A = setup('pirate_king', { seed: s, n: 4, enemies: ['rockman'], idle: true });
    for (const x of A.b.allies.slice(1)) { x.alive = false; x.hp = 0; }
    const a = use(A.b, A.me, 'pk_ichimi');
    assert.ok(a.lines.some((l) => l.includes('ひとりでも')), a.lines.join('/'));
    one += dealt(a);
    const B = setup('pirate_king', { seed: s, n: 4, enemies: ['rockman'], idle: true });
    const b = use(B.b, B.me, 'pk_ichimi');
    assert.ok(b.lines.includes('仲間4人の力が、1つになった！'), b.lines.join('/'));
    four += dealt(b);
  }
  assert.ok(four / one > 1.6 && four / one < 2.2, `4人 ${four} ÷ 1人 ${one}`);
  // 自由の技: 笑いころげて 動けない（ゲージが へる）
  const { b, me } = setup('pirate_king', { seed: 3, enemies: ['rockman', 'rockman', 'rockman'] });
  for (const e of b.enemies) e.atb = 90;
  const act = use(b, me, 'pk_jiyuu');
  const laughed = act.lines.filter((l) => l.includes('笑いころげている'));
  assert.ok(laughed.length >= 1, act.lines.join('/'));
});

test('伝説の超勇者: 気を ためる（3だんかいまで）→ かめはめデインで 全て 解き放つ（強く なって 0 に もどる）', () => {
  const { b, me } = setup('super_hero', { seed: 5, enemies: ['rockman'] });
  for (let i = 1; i <= KI_MAX; i++) {
    const act = use(b, me, 'sh_ki', me.id);
    assert.equal(me.ki, i);
    assert.ok(act.lines.includes(`${me.name}の気が、${i}だんかいまでたまった！`), act.lines.join('/'));
  }
  const full = use(b, me, 'sh_ki', me.id);
  assert.equal(me.ki, KI_MAX);
  assert.ok(full.lines.includes(`${me.name}の気は、もういっぱいだ！`));
  const act = use(b, me, 'super_hero_sig');
  assert.equal(me.ki, 0, 'つかうと 0');
  assert.ok(act.lines.includes('ためた気を、3だんかいぶん全て解き放つ！'));
  // 気 3 と 気 0 の かめはめデイン（攻撃力の バフは 消して くらべる）
  let with3 = 0, with0 = 0;
  for (let s = 1; s <= 6; s++) {
    for (const ki of [3, 0]) {
      const S = setup('super_hero', { seed: s, enemies: ['rockman'], idle: true });
      S.me.ki = ki;
      const d = dealt(use(S.b, S.me, 'super_hero_sig'));
      if (ki) with3 += d; else with0 += d;
    }
  }
  assert.ok(with3 / with0 > 1.9 && with3 / with0 < 2.7, `気3 ${with3} ÷ 気0 ${with0}`);
});

test('日の火影: 影分身（4人）→ 分身の 数だけ 当たる 回数が ふえる・3回で 消える・看板の 技は 分身を 出して まい 終わると 消える', () => {
  const { b, me } = setup('sun_hokage', { seed: 9, enemies: ['rockman'] });
  const t = b.enemies[0];
  const solo = use(b, me, 'sk_kasha');
  assert.equal(hitsOn(solo, t.id), 3, '分身なし 3回');
  const bun = use(b, me, 'sk_bunshin', me.id);
  assert.deepEqual(me.clones, { n: 4, left: 3 });
  assert.ok(bun.lines.includes(`${me.name}の影分身が、4人あらわれた！`));
  for (let i = 0; i < 3; i++) {
    const act = use(b, me, 'sk_kasha');
    assert.equal(hitsOn(act, t.id), 7, '本体 3回 ＋ 分身 4人');
    assert.ok(act.lines.includes('影分身4人も、いっしょにまう！'));
  }
  assert.equal(me.clones, null, '3回で 消える');
  // 看板の 技: 分身が いなくても 4人 出して、3 ＋ 2×4 ＝ 11回。まい終わると 消える
  const sig = use(b, me, 'sun_hokage_sig');
  assert.equal(hitsOn(sig, t.id), 11);
  assert.equal(me.clones, null);
  assert.ok(sig.lines.includes('分身たちは、火の粉になって消えた。'));
  for (const l of sig.lines) textOk(l, 'sun_hokage_sig');
});

test('天才しせつ管理者AI: 自分の 番の たびに 仲間全員を 自動で 最適化（攻撃力 → 守備力 → 素早さ → 魔力）・全力モードは HPと MPも', () => {
  const { b, me, m } = setup('facility_ai', { seed: 11, n: 3, enemies: ['rockman'] });
  const others = b.allies.slice(1);
  const act1 = use(b, me, 'fa_scan');
  assert.ok(act1.lines.includes('AIが、仲間全員の攻撃力を自動で最適化した！'), act1.lines.join('/'));
  for (const a of b.allies) assert.ok(a.buffs.atk?.mult > 1, `${a.name} 攻撃力`);
  const act2 = use(b, me, 'fa_scan');
  assert.ok(act2.lines.includes('AIが、仲間全員の守備力を自動で最適化した！'));
  for (const a of b.allies) assert.ok(a.buffs.def?.mult > 1, `${a.name} 守備力`);
  assert.deepEqual(OPT_STATS, ['atk', 'def', 'agi', 'mag']);
  // 全力モード: HPと MPも 少し 回復（4回）
  use(b, me, 'fa_mode', me.id);
  assert.equal(me.autoBoost.left, 4);
  for (const a of b.allies) { a.hp = Math.round(a.maxHp / 2); a.mp = 10; }
  const hp0 = others.map((a) => a.hp);
  const act3 = use(b, me, 'fa_scan');
  assert.ok(act3.lines.some((l) => l.includes('（HPとMPも少し回復）')), act3.lines.join('/'));
  others.forEach((a, i) => assert.ok(a.hp > hp0[i] && a.mp > 10, a.name));
  assert.equal(me.autoBoost.left, 3);
  // 天才しせつ管理者AI が いない 戦いでは 何も しない
  const s = setup('pirate_king', { seed: 2, enemies: ['rockman'] });
  const act4 = use(s.b, s.me, 'pk_gatling');
  assert.ok(!act4.lines.some((l) => l.includes('最適化')));
  assert.ok(!s.m.buffs.atk);
  assert.ok(m);
});
