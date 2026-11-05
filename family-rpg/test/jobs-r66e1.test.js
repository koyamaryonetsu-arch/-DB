// 第66回 E1班: 上級職で 終わっていた 3つの 系統の 先（docs/plan-r66-legend.md の E1班）
//   警察官＋忍者 → 公安ゼロ → トリプルフェイス
//   消防士＋パラディン → ハイパーレスキュー → 火消しの神
//   人気配信者＋スーパースター → 登録者1000万人 → 世界一の配信者
//  ・職業の 木・神殿の うわさ・強さ・技・ひらめき技・合体技に 入れる・職業の試練・転職の ひとこと・乗り物・文字
//  ・絵（hero-r66e1.js）と えんしゅつ（battlefx-r66e1.js）
//  ・ならびの 場所（SUPER_ORDER・LEGEND_ORDER の 何番め）は 見ない（ほかの 班の 職業と いっしょに ふえても こわれない ように）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JOBS, SUPER_ORDER, LEGEND_ORDER, ALL_JOBS, JOB_HINTS, jobReqText } from '../public/js/shared/data/jobs.js';
import { SUPER_R66E1_ORDER, LEGEND_R66E1_ORDER, JOBS_R66E1, HINTS_R66E1 } from '../public/js/shared/data/jobs-r66e1.js';
import { ABILITIES, abilityRole } from '../public/js/shared/data/abilities.js';
import { R66E1_ABILITIES } from '../public/js/shared/data/abilities-r66e1.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
import { HIRA_R66E1_ABILITIES, HIRAMEKI_R66E1 } from '../public/js/shared/data/hirameki-r66e1.js';
import { DUAL_TECHS, ANY_GROUPS, groupJobs } from '../public/js/shared/data/dual.js';
import { JOB_SAY, jobDoneText } from '../public/js/shared/data/job-talk.js';
import { TRIAL_WORDS, trialJob, masterName } from '../public/js/shared/data/job-trials.js';
import { PHANTOM_ADJ, phantomSkills } from '../public/js/shared/battle-trial.js';
import { VEHICLES } from '../public/js/shared/data/vehicles.js';
import { jobHint } from '../public/js/shared/job-label.js';
import { newCharacter, changeJob, jobUnlocked, jobKnown, gainExp, expForLevel, fullHeal, learnedAbilities, hiraAllowed, computeStats } from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { paintHero } from '../public/js/client/render/hero.js';
import { outfitOf, jobBody } from '../public/js/client/render/hero-outfit.js';
import { headOf } from '../public/js/client/render/hero-gear.js';
import { R66E1_JOBS, R66E1_OUTFIT, R66E1_BODY, R66E1_HAT, R66E1_OLD_LOOK } from '../public/js/client/render/hero-r66e1.js';
import { lookToOpts, paintHuman } from '../public/js/client/render/chars.js';
import { Effects, BW, BH } from '../public/js/client/render/battlefx.js';
import { R66E1_ANIMS, R66E1_SIGS, R66E1_HIT, R66E1_SFX, R66E1_FINE, playR66e1Fx } from '../public/js/client/render/battlefx-r66e1.js';
import { SFX_R26 } from '../public/js/client/sfx-r26.js';
import { SFX_R33 } from '../public/js/client/sfx-r33.js';
import { checkText, gameFiles } from '../tools/kanji-check.mjs';

const SUPERS = ['koan_zero', 'hyper_rescue', 'top_streamer'];
const LEGENDS = ['triple_face', 'hikeshi_god', 'world_streamer'];
const NEW = [...SUPERS, ...LEGENDS];
// [名前, ランク, じょうけん, ほかの 超級職の かず]（家族が 決めた 名前と なり方）
const TREE = {
  koan_zero: ['公安ゼロ', 2, ['police', 'ninja'], undefined],
  hyper_rescue: ['ハイパーレスキュー', 2, ['firefighter', 'paladin'], undefined],
  top_streamer: ['登録者1000万人', 2, ['streamer', 'superstar'], undefined],
  triple_face: ['トリプルフェイス', 3, ['koan_zero'], 1],
  hikeshi_god: ['火消しの神', 3, ['hyper_rescue'], 1],
  world_streamer: ['世界一の配信者', 3, ['top_streamer'], 1],
};
const REQ_TEXT = {
  koan_zero: '警察官Lv10＋忍者Lv10', hyper_rescue: '消防士Lv10＋パラディンLv10', top_streamer: '人気配信者Lv10＋スーパースターLv10',
  triple_face: '公安ゼロLv10＋ほかの超級職1つLv10', hikeshi_god: 'ハイパーレスキューLv10＋ほかの超級職1つLv10', world_streamer: '登録者1000万人Lv10＋ほかの超級職1つLv10',
};
const SIG_NAMES = {
  koan_zero: 'ゼロの正義ラッシュ', triple_face: 'トリプル・ジャスティス', hyper_rescue: 'ハイパーウォーターキャノン',
  hikeshi_god: '天の川大放水', top_streamer: '同時接続1000万人', world_streamer: 'コメントの大嵐',
};
const SCOPE = { enemy: /敵1体/, enemies: /敵全体/, allies: /仲間全員/, self: /自分/, deadAlly: /仲間1人/ };
const partsOf = (e) => (e.type === 'multi' ? e.parts : [e]);
const lines = (e) => partsOf(e).flatMap((p) => [p.msg, p.failMsg]).filter(Boolean);
const textOk = (s, what) => assert.deepEqual(checkText(s), [], `${what}: ${s}`);
const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: 10, b: 999 }; };
const masterChain = (c, jid) => {
  for (const r of JOBS[jid].req || []) { master(c, r); masterChain(c, r); }
  if (JOBS[jid].reqSuper) master(c, 'god_hand');
};
const sum = (j) => Object.values(JOBS[j].mods).reduce((a, b) => a + b, 0);

function setup(job, { seed = 1, enemies = ['rockman', 'rockman', 'skeleton'], lv = 45 } = {}) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job: 'warrior' });
  gainExp(c, expForLevel(lv));
  masterChain(c, job);
  master(c, job);
  c.job = job;
  c.equip.weapon = null;
  fullHeal(c);
  const m = newCharacter({ id: 'm0', name: 'ミナ', job: 'priest' });
  gainExp(m, expForLevel(lv));
  fullHeal(m);
  const b = new Battle({ rng: makeRng(seed), allies: [{ char: c, controller: 's1' }, { char: m, auto: true, kind: 'support' }], enemies, canFlee: true });
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 50000; }
  for (const a of b.allies) a.mp = a.maxMp = 999;
  return { b, c, me: b.allies[0], m: b.allies[1] };
}
const readyUp = (b, a) => { for (let i = 0; i < 1200 && !a.ready; i++) b.tick(50); return a.ready; };
const runUntilAct = (b, id) => {
  const evs = [];
  for (let i = 0; i < 400 && !evs.some((e) => e.t === 'act' && e.id === id); i++) evs.push(...b.tick(50));
  return evs.find((e) => e.t === 'act' && e.id === id);
};

// ───────────── 職業の 木 ─────────────
test('第66回 E1班の 職業: 3つの 超級職（上級職 2つ）と 3つの 伝説の職業（超級職＋ほかの 超級職 1つ）。うわさ・文字', () => {
  assert.deepEqual(SUPER_R66E1_ORDER, SUPERS);
  assert.deepEqual(LEGEND_R66E1_ORDER, LEGENDS);
  assert.deepEqual(Object.keys(JOBS_R66E1).sort(), [...NEW].sort());
  assert.deepEqual(Object.keys(HINTS_R66E1).sort(), [...NEW].sort());
  for (const id of NEW) {
    const j = JOBS[id], [name, tier, req, sup] = TREE[id];
    assert.equal(j.id, id);
    assert.equal(j.name, name);
    assert.equal(j.tier, tier);
    assert.deepEqual(j.req, req);
    assert.equal(j.reqSuper, sup);
    for (const r of req) assert.equal(JOBS[r].tier, tier - 1, `${id}: ${r}`);
    assert.ok((tier === 2 ? SUPER_ORDER : LEGEND_ORDER).includes(id));
    assert.equal(ALL_JOBS.filter((x) => x === id).length, 1);
    assert.equal(jobReqText(id), REQ_TEXT[id]);
    assert.equal(JOB_HINTS[id], HINTS_R66E1[id]);
    assert.equal(jobHint(id, { look: { body: 0 } }), HINTS_R66E1[id]);
    for (const s of [j.name, j.desc, j.short, JOB_HINTS[id]]) textOk(s, id);
    assert.deepEqual(checkText(j.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
    assert.match(j.color, /^#[0-9a-f]{6}$/);
    assert.equal(j.masc, undefined, '名前は 男女 おなじ');
  }
  // 上級職で 終わる 系統が なくなった（3つとも 超級職に つながる）
  for (const adv of ['police', 'firefighter', 'streamer']) assert.ok(SUPER_ORDER.some((s) => JOBS[s].req.includes(adv)), adv);
  // 同じ くみあわせの 超級職は ほかに ない
  const key = (j) => [...JOBS[j].req].sort().join('+');
  for (const id of SUPERS) assert.deepEqual(SUPER_ORDER.filter((j) => key(j) === key(id)), [id]);
  // 3つの 超級職は 伝説に つながる
  for (const id of SUPERS) assert.ok(LEGEND_ORDER.some((l) => JOBS[l].req.includes(id)), id);
  const services = readFileSync(new URL('../public/js/client/ui/services.js', import.meta.url), 'utf8');
  assert.ok(services.includes('LEGEND_ORDER') && services.includes('SUPER_ORDER'), '神殿の 一覧は ならびから 作る');
});

test('第66回 E1班の 職業: なれる じゅんばん（片方を きわめると うわさ → 両方で 超級職 → ほかの 超級職も 1つで 伝説）', () => {
  for (const id of SUPERS) {
    const [a, b] = JOBS[id].req;
    for (const first of [a, b]) {
      const c = newCharacter({ id: 'k', name: 'ケン', job: 'warrior' });
      assert.equal(jobKnown(c, id), false, `${id} は はじめ ひみつ`);
      master(c, first);
      assert.equal(jobKnown(c, id), true, `${first} を きわめると うわさ`);
      assert.equal(jobUnlocked(c, id), false, 'もう1つ いる');
      master(c, first === a ? b : a);
      assert.equal(jobUnlocked(c, id), true);
      assert.equal(changeJob(c, id).ok, true);
      assert.ok(learnedAbilities(c).includes(JOBS[id].learn[0][1]));
    }
  }
  for (const id of LEGENDS) {
    const c = newCharacter({ id: 'k', name: 'ケン', job: 'warrior' });
    assert.equal(jobKnown(c, id), false);
    master(c, JOBS[id].req[0]);
    assert.equal(jobKnown(c, id), true, 'もとの 超級職を きわめると うわさ');
    assert.equal(jobUnlocked(c, id), false, 'ほかの 超級職も いる');
    master(c, 'archmage');
    assert.equal(jobUnlocked(c, id), true);
    assert.equal(changeJob(c, id).ok, true);
    assert.ok(learnedAbilities(c).includes(JOBS[id].learn[0][1]));
  }
});

test('第66回 E1班の 職業: 強さは 今の 超級職・伝説の職業の はんい・伝説は もとの 超級職より 強い・炎に 強い・お金', () => {
  const others = (list) => list.filter((j) => !NEW.includes(j)).map(sum);
  const sup = others(SUPER_ORDER), leg = others(LEGEND_ORDER);
  const mid = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
  for (const j of NEW) {
    assert.deepEqual(Object.keys(JOBS[j].mods).sort(), ['agi', 'def', 'heal', 'hp', 'mag', 'mp', 'str']);
    assert.ok(Object.values(JOBS[j].perLv).reduce((a, b) => a + b, 0) <= 3.5 + 1e-9);
    assert.ok(JOBS[j].weapons.length >= 2);
  }
  for (const j of SUPERS) assert.ok(sum(j) >= Math.min(...sup) && sum(j) <= Math.max(...sup) && Math.abs(sum(j) - mid(sup)) <= 0.4, `${j} ${sum(j).toFixed(2)}`);
  for (const j of LEGENDS) {
    assert.ok(sum(j) > Math.max(...sup) && sum(j) >= Math.min(...leg) && sum(j) <= Math.max(...leg) && Math.abs(sum(j) - mid(leg)) <= 0.3, `${j} ${sum(j).toFixed(2)}`);
    assert.ok(sum(j) > sum(JOBS[j].req[0]) + 0.5, `${j}: もとの 職業より 強い`);
  }
  // 職業の 味: ボクシングの 速さ・体が じょうぶ・魔力
  for (const j of ['koan_zero', 'triple_face']) assert.equal(Object.entries(JOBS[j].mods).sort((a, b) => b[1] - a[1])[0][0], 'agi', j);
  for (const j of ['hyper_rescue', 'hikeshi_god']) assert.equal(Object.entries(JOBS[j].mods).sort((a, b) => b[1] - a[1])[0][0], 'hp', j);
  for (const j of ['top_streamer', 'world_streamer']) assert.ok(JOBS[j].mods.mag >= 1.45 && JOBS[j].passive.gold > JOBS.streamer.passive.gold, j);
  assert.ok(JOBS.world_streamer.passive.gold > JOBS.top_streamer.passive.gold);
  // 炎に とても 強い（火消しの神は ほとんど 効かない）
  const fireOf = (job) => {
    const c = newCharacter({ id: 'f', name: 'f', job: 'warrior' });
    c.job = job;
    return computeStats(c).resist.fire ?? 1;
  };
  assert.equal(fireOf('firefighter'), 1);
  assert.ok(fireOf('hyper_rescue') <= 0.5 + 1e-9);
  assert.ok(fireOf('hikeshi_god') <= 0.25 + 1e-9 && fireOf('hikeshi_god') > 0, 'ほとんど 効かない（0 では ない）');
});

// ───────────── 技 ─────────────
test('第66回 E1班の 技: 6〜7こ・Lv10 が いちばん MP・看板の 技・攻撃技・せつめい・文字・名前が かぶらない・補助の 上限', () => {
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden) names.set(a.name, [...(names.get(a.name) || []), id]);
  const mine = new Set();
  for (const j of NEW) {
    const job = JOBS[j];
    assert.ok(job.learn.length >= 6 && job.learn.length <= 8, `${j}: ${job.learn.length}こ`);
    if (job.tier === 3) assert.ok(job.learn.length >= 7, '伝説は 6こ＋看板の 技');
    const lvs = job.learn.map(([l]) => l);
    assert.deepEqual(lvs, [...lvs].sort((a, b) => a - b));
    assert.equal(lvs[0], 1);
    assert.equal(lvs.at(-1), 10);
    const mps = job.learn.map(([, id]) => ABILITIES[id].mp);
    assert.ok(mps.slice(0, -1).every((m) => m < mps.at(-1)), `${j}: Lv10 の 技が いちばん MPを 使う`);
    const sig = `${j}_sig`;
    assert.equal(job.learn.at(-1)[1], sig);
    assert.equal(ABILITIES[sig].name, SIG_NAMES[j]);
    assert.equal(ABILITIES[sig].anim, sig);
    assert.equal(abilityRole(ABILITIES[sig]), 'dmg');
    assert.equal(ABILITIES[sig].target, 'enemies', '看板の 技は 敵全体');
    assert.ok(job.learn.filter(([, id]) => abilityRole(ABILITIES[id]) === 'dmg').length >= 2, `${j}: 攻撃技 2つ いじょう`);
    const multiCap = job.tier === 2 ? 1.3 : 1.35;
    for (const [, id] of job.learn) {
      const a = ABILITIES[id];
      mine.add(id);
      assert.equal(a.job, j);
      assert.ok(['skill', 'spell'].includes(a.kind));
      assert.ok(!a.weapon, `${id}: 武器が なくても 使える`);
      assert.ok(a.desc && a.cast && a.anim && a.kana, id);
      assert.match(a.desc, SCOPE[a.target], `${id}: ${a.desc}`);
      for (const s of [a.name, a.desc, a.cast, ...lines(a.effect)]) textOk(s, id);
      assert.deepEqual(checkText(a.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
      assert.equal(names.get(a.name).length, 1, `${a.name} が かぶる`);
      for (const p of partsOf(a.effect)) {
        if (p.type === 'buff' && !p.target && a.target === 'allies') assert.ok(p.mult <= ((p.stats || [p.stat]).length > 1 ? multiCap : 1.4) + 1e-9, a.name);
        if (p.type === 'buff' && p.target === 'allies') assert.ok(p.mult <= 1.2 + 1e-9, `${a.name}: 攻撃の おまけの 補助は 小さめ`);
        if (['atbSet', 'status', 'debuff'].includes(p.type) && ['enemy', 'enemies'].includes(p.target || a.target)) assert.ok(p.chance > 0 && p.chance < 1, a.name);
      }
    }
    // 1つの 職業の 中で 効果の 形が かぶらない
    const shape = (a) => `${a.target}|${partsOf(a.effect).map((p) => [p.type, p.target || '', p.element || '', p.stat || (p.stats || []).join('+'), p.status || '', p.hits ? 'hits' : ''].join(':')).join(',')}`;
    const seen = new Set();
    for (const [, id] of job.learn) {
      const k = shape(ABILITIES[id]);
      assert.ok(!seen.has(k), `${ABILITIES[id].name} の 形が かぶる`);
      seen.add(k);
    }
  }
  assert.deepEqual([...mine].sort(), Object.keys(R66E1_ABILITIES).sort(), 'abilities-r66e1.js の 技は ぜんぶ どれかの 職業で 覚える');
  // 伝説は もとの 超級職より 強い 看板の 技・MP も 多い
  for (const l of LEGENDS) {
    const s = JOBS[l].req[0];
    assert.ok(ABILITIES[`${l}_sig`].mp > ABILITIES[`${s}_sig`].mp, l);
  }
  // 職業の 味（家族の ねがい）
  const has = (j, f) => JOBS[j].learn.some(([, id]) => partsOf(ABILITIES[id].effect).some(f));
  // トリプルフェイス・公安ゼロ: すがたを かえて 敵を 調べ、弱らせる・ボクシングの 速い 攻撃
  for (const j of ['koan_zero', 'triple_face']) {
    assert.ok(has(j, (p) => p.type === 'scan') && has(j, (p) => p.type === 'debuff'), `${j}: 調べて 弱らせる`);
    assert.ok(has(j, (p) => p.type === 'phys' && p.hits >= 3), `${j}: 速い 連打`);
  }
  assert.ok(['探てい', 'なぞの組織', '警察官'].every((w) => JOBS.triple_face.learn.some(([, id]) => ABILITIES[id].name.includes(w))), '3つの 顔');
  // 火消しの神・ハイパーレスキュー: 助け出す・水で 敵全体
  for (const j of ['hyper_rescue', 'hikeshi_god']) {
    assert.ok(has(j, (p) => p.type === 'revive'), `${j}: 助け出す`);
    assert.ok(has(j, (p) => p.type === 'cover'), `${j}: 体をはって 守る`);
    assert.ok(JOBS[j].learn.some(([, id]) => ABILITIES[id].target === 'enemies' && partsOf(ABILITIES[id].effect).some((p) => p.element === 'water' && p.vsElement?.fire > 1)), `${j}: 水で 敵全体`);
    assert.ok(partsOf(ABILITIES[`${j}_sig`].effect)[0].element === 'water');
  }
  // 世界一の配信者・登録者1000万人: 声えんで 強く なる・コメントの 嵐で 敵全体
  for (const j of ['top_streamer', 'world_streamer']) {
    assert.ok(has(j, (p) => p.type === 'buff' && (p.stats || []).includes('mag')), `${j}: 声えんで 強く`);
    assert.ok(JOBS[j].learn.some(([, id]) => ABILITIES[id].target === 'enemies' && ABILITIES[id].name.includes('コメント')), `${j}: コメントで 敵全体`);
  }
  assert.ok(ABILITIES.world_streamer_sig.name.includes('嵐'));
});

test('第66回 E1班の 技は ぜんぶ たたかいで 使えて、攻撃技は ダメージ・オートでも こわれない', () => {
  let n = 0;
  for (const j of NEW) {
    for (const [, id] of JOBS[j].learn) {
      const { b, me, m } = setup(j, { seed: ++n });
      const a = ABILITIES[id];
      if (a.target === 'deadAlly') { m.alive = false; m.hp = 0; }
      assert.ok(readyUp(b, me));
      const r = b.command(me.id, { type: 'ability', id, target: ['ally', 'deadAlly'].includes(a.target) ? m.id : b.enemies[0].id }, 's1');
      assert.equal(r.ok, true, `${id} ${r.reason || ''}`);
      const act = runUntilAct(b, me.id);
      assert.ok(act && !act.lines.some((l) => l.includes('MPが足りない')), id);
      for (const l of act.lines) textOk(l, id);
      if (abilityRole(a) === 'dmg') assert.ok(act.results?.some((x) => x.dmg > 0), `${id} の ダメージ`);
      if (a.target === 'deadAlly') assert.ok(m.alive, `${id}: 生き返る`);
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
  // 変そう調査: 敵の 弱点が わかる・守備力が 下がる
  {
    const { b, me } = setup('koan_zero', { seed: 3 });
    readyUp(b, me);
    b.command(me.id, { type: 'ability', id: 'kz_hensou', target: b.enemies[0].id }, 's1');
    const act = runUntilAct(b, me.id);
    assert.ok(act.results?.some((x) => x.scan), '弱点が わかる');
  }
  // 天の川大放水: 仲間も 回復する
  {
    const { b, me, m } = setup('hikeshi_god', { seed: 4 });
    m.hp = Math.round(m.maxHp / 3);
    const hp0 = m.hp;
    readyUp(b, me);
    b.command(me.id, { type: 'ability', id: 'hikeshi_god_sig', target: b.enemies[0].id }, 's1');
    const act = runUntilAct(b, me.id);
    assert.ok(act.results?.filter((x) => x.dmg > 0).length >= 3, '敵全体');
    assert.ok(m.hp > hp0, '仲間も 回復');
  }
});

// ───────────── ひらめき技 ─────────────
test('第66回 E1班の ひらめき技: 6つの 職業に 1つずつ・データ・文字・その 職業の 技を 使いこむと ひらめく', () => {
  const ids = Object.keys(HIRA_R66E1_ABILITIES);
  assert.deepEqual(Object.keys(HIRAMEKI_R66E1).sort(), [...ids].sort());
  for (const j of NEW) assert.equal(ids.filter((id) => HIRA_R66E1_ABILITIES[id].job === j).length, 1, j);
  const oldAnims = new Set(Object.entries(ABILITIES).filter(([id]) => !ids.includes(id) && !(id in R66E1_ABILITIES)).map(([, a]) => a.anim));
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden) names.set(a.name, [...(names.get(a.name) || []), id]);
  let n = 0;
  for (const id of ids) {
    const a = ABILITIES[id];
    assert.ok(a && a.hirameki && HIRAMEKI[id] && id.startsWith('hi_'), id);
    assert.match(a.desc, SCOPE[a.target], `${id}: ${a.desc}`);
    for (const s of [a.name, a.desc, a.cast]) textOk(s, id);
    assert.deepEqual(checkText(a.kana).filter((p) => p.kind !== 'kana'), [], id);
    assert.ok(oldAnims.has(a.anim), `${id}: ${a.anim}`);
    assert.equal(names.get(a.name).length, 1, a.name);
    for (const [k, c] of Object.entries(HIRAMEKI[id].from)) assert.ok(c > 0 && JOBS[a.job].learn.some(([, x]) => x === k), `${id}: ${k}`);
    const c = newCharacter({ id: 'x', name: 'x', job: 'warrior' });
    c.job = a.job;
    assert.equal(hiraAllowed(c, id), true);
    c.job = JOBS[a.job].req[0];
    assert.equal(hiraAllowed(c, id), false, 'もとの 職業では ひらめかない');
    {
      const { b, c: ch, me } = setup(a.job, { seed: ++n });
      ch.hirameki = [id];
      me.abilities = [...me.abilities, id];
      readyUp(b, me);
      assert.equal(b.command(me.id, { type: 'ability', id, target: b.enemies[0].id }, 's1').ok, true, id);
      const act = runUntilAct(b, me.id);
      assert.ok(act?.results?.some((x) => x.dmg > 0), `${id}: ダメージ`);
      for (const l of act.lines) textOk(l, id);
    }
    const from = HIRAMEKI[id].from;
    const key = Object.keys(from)[0];
    let got = null;
    for (let seed = 1; seed < 80 && !got; seed++) {
      const { b, c: ch, me } = setup(a.job, { seed });
      ch.skillUse = Object.fromEntries(Object.entries(from).map(([k, v]) => [k, v * 2]));
      me.use = { ...ch.skillUse };
      readyUp(b, me);
      b.command(me.id, { type: 'ability', id: key, target: b.enemies[0].id }, 's1');
      const act = runUntilAct(b, me.id);
      if (act?.hirameki) { assert.equal(act.hirameki.id, id); got = act; }
    }
    assert.ok(got, `${a.name} を ひらめいた`);
  }
});

// ───────────── 合体技・職業の試練・転職の ひとこと・乗り物 ─────────────
test('第66回 E1班の 職業: タグで 合体技に 入れる（3つ いじょう）・職業の試練（三の試練まで）・転職の ひとこと・乗り物', () => {
  for (const j of NEW) {
    assert.ok(JOBS[j].tags.length >= 3 && JOBS[j].tags.length <= 4, j);
    const n = Object.values(DUAL_TECHS).filter((t) => t.need.some((list) => !ANY_GROUPS.has(list) && groupJobs(list).has(j))).length;
    assert.ok(n >= 3, `${JOBS[j].name} の 合体技 ${n}こ`);
    assert.ok(trialJob(j));
    const adj = PHANTOM_ADJ[j];
    assert.ok(Array.isArray(adj) && adj.length === 3 && adj.every((v) => v >= 0.3 && v <= 3), `${j}: ${adj}`);
    assert.ok(phantomSkills(j).length >= 4, `${j}: まぼろしの 技`);
    textOk(TRIAL_WORDS[j], j);
    textOk(masterName(j), j);
    const s = JOB_SAY[j];
    textOk(s, j);
    assert.ok(s.length <= 24 && s.startsWith('「') && s.endsWith('」'), s);
    assert.ok(jobDoneText('ナナ', JOBS[j].name, [], j).endsWith(s));
  }
  assert.ok(JOBS.triple_face.tags.includes('henshin'), 'トリプルフェイスは 変身（3つの 顔）');
  for (const j of ['hyper_rescue', 'hikeshi_god']) assert.ok(JOBS[j].tags.includes('ice') && JOBS[j].tags.includes('guard'), `${j}: 水と 守り`);
  for (const j of ['top_streamer', 'world_streamer']) assert.ok(!JOBS[j].tags.includes('stage'), '歌とおどりは 13職業の 上限');
  // 乗り物: もとの 職業の 乗り物に 乗れる
  const ride = { koan_zero: 'police_bike', triple_face: 'police_bike', hyper_rescue: 'fire_truck', hikeshi_god: 'fire_truck', top_streamer: 'drone', world_streamer: 'drone' };
  for (const [j, v] of Object.entries(ride)) assert.ok(VEHICLES[v].jobs.includes(j), `${j}: ${v}`);
  assert.ok(VEHICLES.spy_car.jobs.includes('triple_face'), 'なぞの組織の 顔の 黒い 車');
});

// ───────────── 絵 ─────────────
const DIRS = ['down', 'left', 'up', 'right'];
const key = (img) => Buffer.from(img.rgba).toString('base64');
function inspect(img) {
  let n = 0, edge = false;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    if (!img.rgba[(y * img.w + x) * 4 + 3]) continue;
    n++;
    if (y === 0 || x === 0 || x === img.w - 1) edge = true;
  }
  return { n, edge };
}

test('第66回 E1班の 絵: 6つの 職業（男女・4方向・はみ出さない・もとの 職業と ちがう）・ぼうし・古い え', () => {
  assert.deepEqual([...R66E1_JOBS].sort(), [...NEW].sort());
  for (const j of NEW) assert.ok(R66E1_OUTFIT[j] && R66E1_OLD_LOOK[j], j);
  for (const job of NEW) {
    for (const body of [0, 1]) {
      for (const dir of DIRS) {
        for (const res of [4, 8]) {
          const img = paintHero({ body, style: 'short', hcol: 'black' }, job, undefined, dir, 1, res);
          const r = inspect(img);
          assert.ok(r.n > img.w * img.h * 0.12, `${job} ${body} ${dir} ${res} が かけている`);
          assert.ok(!r.edge, `${job} ${body} ${dir} ${res} が ふちに さわる`);
        }
        for (const from of JOBS[job].req) assert.notEqual(key(paintHero({ body, style: 'short' }, job, undefined, dir, 0, 4)), key(paintHero({ body, style: 'short' }, from, undefined, dir, 0, 4)), `${job} は ${from} と ちがう え`);
      }
    }
  }
  const Lk = { cloth: '#3f7fd0', skin: 0 };
  assert.equal(outfitOf(Lk, 'koan_zero', 'cloth', false).kind, 'suit');
  assert.ok(outfitOf(Lk, 'triple_face', 'cloth', false).cape, 'トリプルフェイスは マント');
  for (const j of ['hyper_rescue', 'hikeshi_god']) assert.equal(outfitOf(Lk, j, 'cloth', true).kind, 'work');
  for (const j of ['top_streamer', 'world_streamer']) assert.equal(outfitOf(Lk, j, 'cloth', true).kind, 'hoodie');
  for (const j of LEGENDS.slice(1)) assert.ok(outfitOf(Lk, j, 'cloth', true).cape, `${j}: マント`);
  for (const j of Object.keys(R66E1_BODY)) assert.equal(jobBody(j), R66E1_BODY[j]);
  // ぼうし: 公安ゼロ・トリプルフェイスは なし（かみがたは その 人の まま）・ほかは ヘルメット・ヘッドセット
  for (const j of NEW) {
    const O = outfitOf(Lk, j, 'cloth', false);
    if (R66E1_HAT[j]) assert.ok(headOf(null, j, 'cloth', O), `${j}: ぼうし`);
    else assert.equal(headOf(null, j, 'cloth', O), null, `${j}: ぼうしは ない`);
  }
  for (const job of NEW) for (const body of [0, 1]) {
    const o = lookToOpts({ body }, job, ',cloth,,');
    assert.ok(o.outfit, job);
    assert.ok(paintHuman('down', 0, o), job);
  }
});

// ───────────── えんしゅつ ─────────────
test('第66回 E1班の えんしゅつ: 看板の 技・技の えんしゅつは ぜんぶ ある・音・つなぎ・こわれない', () => {
  const used = new Set();
  for (const id of Object.keys(R66E1_ABILITIES)) used.add(ABILITIES[id].anim);
  for (const anim of R66E1_ANIMS) assert.ok(used.has(anim), `${anim} は どれかの 技で 使う`);
  assert.deepEqual([...R66E1_SIGS].sort(), NEW.map((j) => `${j}_sig`).sort());
  assert.deepEqual(Object.keys(R66E1_SFX).sort(), [...R66E1_ANIMS].sort());
  assert.deepEqual(Object.keys(R66E1_HIT).sort(), [...R66E1_ANIMS].sort());
  const audio = readFileSync(new URL('../public/js/client/audio.js', import.meta.url), 'utf8');
  for (const [anim, s] of Object.entries(R66E1_SFX)) assert.ok(audio.includes(`case '${s}':`) || typeof SFX_R26[s] === 'function' || typeof SFX_R33[s] === 'function', `${anim} の 音 ${s}`);
  // 自分や 仲間に かける 技は 前から ある えんしゅつ（みかたの えんしゅつは 作らない）
  for (const id of Object.keys(R66E1_ABILITIES)) {
    const a = ABILITIES[id];
    if (['self', 'allies', 'ally', 'deadAlly'].includes(a.target)) assert.ok(!R66E1_ANIMS.has(a.anim), `${id}: みかたには 前からの えんしゅつ`);
  }
  for (const k of Object.keys(R66E1_FINE)) assert.ok(k.startsWith('e66'), k);
  const battle = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.match(battle, /\.\.\.R66E1_SFX/);
  assert.match(battle, /Object\.assign\(HIT_DELAY, R66E1_HIT\)/);
  const src = readFileSync(new URL('../public/js/client/render/battlefx.js', import.meta.url), 'utf8');
  assert.match(src, /playR66e1Fx\(this, anim/);
  assert.match(src, /Object\.assign\(FINE, R66E1_FINE\)/);
  const ctx = new Proxy({}, { get: (_, k) => (k === 'createRadialGradient' || k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : k === 'measureText' ? () => ({ width: 10 }) : () => {}), set: () => true });
  for (const anim of R66E1_ANIMS) {
    for (const targets of [[{ x: 128, y: 66 }], [{ x: 60, y: 70 }, { x: 128, y: 82 }, { x: 196, y: 70 }]]) {
      const fx = new Effects();
      assert.equal(playR66e1Fx(fx, anim, targets, null, {}, BW, BH), true, anim);
      fx.play(anim, targets, null, {});
      assert.ok(fx.parts.length > 0, anim);
      for (const p of fx.parts) {
        if (!R66E1_FINE[p.kind]) continue;
        for (const age of [0, 200, 600, 1200]) R66E1_FINE[p.kind](ctx, { ...p, age }, Math.min(1, age / (p.life || 600)));
      }
      // 2.2びょう いないで おわる
      for (let i = 0; i < 60; i++) fx.update(40);
      assert.equal(fx.parts.length, 0, `${anim} が おわらない`);
    }
  }
  assert.equal(playR66e1Fx(new Effects(), 'fire1', [{ x: 1, y: 1 }]), false);
  const files = gameFiles();
  for (const f of ['public/js/shared/data/jobs-r66e1.js', 'public/js/shared/data/abilities-r66e1.js', 'public/js/shared/data/hirameki-r66e1.js', 'public/js/client/render/battlefx-r66e1.js']) assert.ok(files.some((p) => p.endsWith(f)), f);
});
