// 第66回 C班: 4つの 新しい 伝説の 職業（docs/plan-r66-legend.md の C班）
//   キャリア組 → 総理大臣 ／ 社長 か たたき上げ社長 → 会長 ／ ブラックきぎょうの星 → 働き方改革の星 ／ 黒の組織 → あの方
//  ・職業の 木・神殿の うわさ・強さ・技・ひらめき技・合体技に 入れる・職業の試練・転職の ひとこと・乗り物・文字
//  ・会長の お金の 技（札束の雨・黄金のボディーガード）・働き方改革の星の 定時の 回復（battle-r66c.js）
//  ・絵（hero-r66c.js）と えんしゅつ（battlefx-r66c.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JOBS, SUPER_ORDER, LEGEND_ORDER, ALL_JOBS, JOB_HINTS, JOB_MAX_LEVEL, jobReqText } from '../public/js/shared/data/jobs.js';
import { ABILITIES, abilityRole } from '../public/js/shared/data/abilities.js';
import { R66C_ABILITIES } from '../public/js/shared/data/abilities-r66c.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
import { HIRA_R66C_ABILITIES, HIRAMEKI_R66C } from '../public/js/shared/data/hirameki-r66c.js';
import { DUAL_TECHS, ANY_GROUPS, groupJobs } from '../public/js/shared/data/dual.js';
import { JOB_SAY, JOB_SAY_MASC, jobDoneText } from '../public/js/shared/data/job-talk.js';
import { TRIAL_WORDS, trialJob, masterName } from '../public/js/shared/data/job-trials.js';
import { VEHICLES } from '../public/js/shared/data/vehicles.js';
import { PHANTOM_ADJ, phantomSkills } from '../public/js/shared/battle-trial.js';
import { jobLabel } from '../public/js/shared/job-label.js';
import { abilityFor } from '../public/js/shared/ability-label.js';
import { newCharacter, changeJob, jobUnlocked, jobKnown, gainExp, expForLevel, fullHeal, learnedAbilities, hiraAllowed } from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { paintHero } from '../public/js/client/render/hero.js';
import { outfitOf, jobBody } from '../public/js/client/render/hero-outfit.js';
import { headOf } from '../public/js/client/render/hero-gear.js';
import { R66C_JOBS, R66C_OUTFIT, R66C_BODY, R66C_HAT, R66C_OLD_LOOK } from '../public/js/client/render/hero-r66c.js';
import { lookToOpts, paintHuman } from '../public/js/client/render/chars.js';
import { Effects, BW, BH } from '../public/js/client/render/battlefx.js';
import { R66C_ANIMS, R66C_SIGS, PARTY_ANIMS_R66C, R66C_HIT, R66C_SFX, R66C_FINE, playR66cFx } from '../public/js/client/render/battlefx-r66c.js';
import { SFX_R26 } from '../public/js/client/sfx-r26.js';
import { SFX_R33 } from '../public/js/client/sfx-r33.js';
import { checkText, gameFiles } from '../tools/kanji-check.mjs';

const NEW = ['souri', 'kaichou', 'hatarakikata', 'ano_kata'];
const TREE = { souri: ['総理大臣', 'career'], kaichou: ['会長', 'shacho'], hatarakikata: ['働き方改革の星', 'black_star'], ano_kata: ['あの方', 'black_org'] };
const SIG_NAMES = { souri: '日本列島大号令', kaichou: '黄金の大判ぶるまい', hatarakikata: 'ホワイトきぎょうの星', ano_kata: '七つの子のメロディー' };
const BOY = { body: 0 };
const SCOPE = { enemy: /敵1体/, enemies: /敵全体/, allies: /仲間全員/, self: /自分/ };
// こわい ことば（あの方は なぞの ボス。こわい ことばは 使わない）
const SCARY = /殺|消えてもらう|始末|命をうば|死/;
const partsOf = (e) => (e.type === 'multi' ? e.parts : [e]);
const lines = (e) => partsOf(e).flatMap((p) => [p.msg, p.failMsg]).filter(Boolean);
const textOk = (s, what) => assert.deepEqual(checkText(s), [], `${what}: ${s}`);
const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
const masterChain = (c, jid) => {
  for (const r of JOBS[jid].req || []) { master(c, r); masterChain(c, r); }
  if (JOBS[jid].reqSuper) master(c, 'god_hand');
};

function setup(job, { seed = 1, enemies = ['rockman', 'rockman', 'skeleton'], lv = 45, gold = 100000 } = {}) {
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
  // お金（world/battles.js の spendGold と おなじ: たりなければ あるだけ）
  const wallet = { gold };
  const hooks = {
    spendGold: (actor, want) => {
      if (!(wallet.gold > 0)) return 0;
      const paid = Math.min(wallet.gold, Math.max(1, Math.round(want)));
      wallet.gold -= paid;
      return paid;
    },
    gainGold: () => 10,
  };
  const b = new Battle({ rng: makeRng(seed), allies: [{ char: c, controller: 's1' }, { char: m, auto: true, kind: 'support' }], enemies, canFlee: true, hooks });
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 50000; }
  for (const a of b.allies) a.mp = a.maxMp = 999;
  return { b, c, me: b.allies[0], m: b.allies[1], wallet };
}
const readyUp = (b, a) => { for (let i = 0; i < 1200 && !a.ready; i++) b.tick(50); return a.ready; };
const runUntilAct = (b, id) => {
  const evs = [];
  for (let i = 0; i < 400 && !evs.some((e) => e.t === 'act' && e.id === id); i++) evs.push(...b.tick(50));
  return evs.find((e) => e.t === 'act' && e.id === id);
};
const useSkill = (s, id, target) => {
  readyUp(s.b, s.me);
  const r = s.b.command(s.me.id, { type: 'ability', id, target: target || s.b.enemies[0].id }, 's1');
  assert.equal(r.ok, true, `${id} ${r.reason || ''}`);
  return runUntilAct(s.b, s.me.id);
};

// ───────────── 職業の 木 ─────────────
test('第66回 C班の 職業: 総理大臣・会長・働き方改革の星・あの方。伝説の職業・うわさ・文字・乗り物', () => {
  for (const id of NEW) {
    const j = JOBS[id], [name, from] = TREE[id];
    assert.equal(j.id, id);
    assert.equal(j.name, name, '家族が 決めた 名前');
    assert.equal(j.tier, 3);
    assert.deepEqual(j.req, [from]);
    assert.ok(LEGEND_ORDER.includes(id) && ALL_JOBS.filter((x) => x === id).length === 1);
    assert.ok(JOB_HINTS[id]);
    for (const s of [j.name, j.desc, j.short, JOB_HINTS[id]]) textOk(s, id);
    assert.deepEqual(checkText(j.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
    assert.match(j.color, /^#[0-9a-f]{6}$/);
    assert.ok(!j.masc, '男の子も 女の子も おなじ 名前');
    assert.equal(jobLabel(id, { job: id, look: BOY }), name);
    assert.ok(Object.values(VEHICLES).some((v) => v.jobs?.includes(id) && v.jobs.includes(from)), `${id} の 乗り物（もとの 職業と おなじ）`);
  }
  assert.deepEqual(LEGEND_ORDER.filter((j) => NEW.includes(j)), NEW, 'ならび');
  assert.equal(JOBS.souri.reqSuper, 1);
  assert.equal(JOBS.hatarakikata.reqSuper, 1);
  assert.equal(JOBS.ano_kata.reqSuper, 1);
  // 会長は 社長 か たたき上げ社長（どちらか 1つ。表の とおり ほかの 超級職は いらない）
  assert.deepEqual(JOBS.kaichou.reqAlt, [['tatakiage']]);
  assert.ok(!JOBS.kaichou.reqSuper);
  assert.equal(jobReqText('souri'), 'キャリア組Lv10＋ほかの超級職1つLv10');
  assert.equal(jobReqText('kaichou'), '社長Lv10 または たたき上げ社長Lv10');
  assert.equal(jobReqText('hatarakikata'), 'ブラックきぎょうの星Lv10＋ほかの超級職1つLv10');
  assert.equal(jobReqText('ano_kata'), '黒の組織Lv10＋ほかの超級職1つLv10');
  // 新しい ファイルは 漢字の きまりで しらべる
  const files = gameFiles().map((f) => f.replaceAll('\\', '/'));
  for (const f of ['jobs-legend-r66c.js', 'abilities-r66c.js', 'hirameki-r66c.js', 'battle-r66c.js', 'battlefx-r66c.js']) assert.ok(files.some((x) => x.endsWith(f)), f);
});

test('第66回 C班の 職業: なれる じゅんばん（会長は 社長でも たたき上げ社長でも）', () => {
  for (const id of ['souri', 'hatarakikata', 'ano_kata']) {
    const c = newCharacter({ id: 'k', name: 'ケン', job: 'warrior' });
    const from = TREE[id][1];
    assert.equal(jobKnown(c, id), false, `${id} は はじめ ひみつ`);
    master(c, from);
    assert.equal(jobKnown(c, id), true, `${from} を きわめると うわさ`);
    assert.equal(jobUnlocked(c, id), false, 'ほかの 超級職も いる');
    master(c, 'archmage');
    assert.equal(jobUnlocked(c, id), true);
    assert.equal(changeJob(c, id).ok, true);
    assert.ok(learnedAbilities(c).includes(JOBS[id].learn[0][1]));
  }
  for (const from of ['shacho', 'tatakiage']) {
    const c = newCharacter({ id: 'k', name: 'ケン', job: 'warrior' });
    assert.equal(jobKnown(c, 'kaichou'), false);
    assert.equal(jobUnlocked(c, 'kaichou'), false);
    master(c, from);
    assert.equal(jobKnown(c, 'kaichou'), true, from);
    assert.equal(jobUnlocked(c, 'kaichou'), true, `${from} だけで なれる`);
    assert.equal(changeJob(c, 'kaichou').ok, true);
  }
});

test('第66回 C班の 職業: 強さは 今の 伝説の職業の はんい・もとの 職業より 強い・会長は お金・働き方改革の星は 定時の 回復', () => {
  const sum = (j) => Object.values(JOBS[j].mods).reduce((a, b) => a + b, 0);
  const legends = LEGEND_ORDER.filter((j) => !NEW.includes(j)).map(sum);
  const sup = SUPER_ORDER.map(sum);
  for (const j of NEW) {
    assert.deepEqual(Object.keys(JOBS[j].mods).sort(), ['agi', 'def', 'heal', 'hp', 'mag', 'mp', 'str']);
    assert.ok(sum(j) > Math.max(...sup) && sum(j) >= Math.min(...legends) && sum(j) <= Math.max(...legends), `${j}: ${sum(j).toFixed(2)}`);
    for (const from of [TREE[j][1], ...(JOBS[j].reqAlt || []).flat()]) {
      assert.ok(sum(j) > sum(from) + 0.5, `${j}: ${from} より 強い`);
      for (const w of JOBS[from].weapons) assert.ok(JOBS[j].weapons.includes(w), `${j}: ${from} の 武器 ${w}`);
    }
    assert.ok(Object.values(JOBS[j].perLv).reduce((a, b) => a + b, 0) <= 3.5 + 1e-9);
  }
  assert.ok(JOBS.kaichou.passive.gold > JOBS.shacho.passive.gold, '会長は 社長より お金が ふえる');
  assert.match(JOBS.kaichou.desc, /お金/);
  assert.ok(JOBS.hatarakikata.passive.teiji > 0 && !JOBS.hatarakikata.passive.grit, 'HPが 少ないほど 強い（grit）は 卒業');
  assert.match(JOBS.hatarakikata.desc, /定時/);
});

// ───────────── 技 ─────────────
test('第66回 C班の 技: 7こ・Lv10 が いちばん MP・看板の 技・攻撃技・せつめい・文字・名前が かぶらない・補助の 上限', () => {
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden) names.set(a.name, [...(names.get(a.name) || []), id]);
  const mine = new Set();
  for (const j of NEW) {
    const job = JOBS[j];
    assert.equal(job.learn.length, 7);
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
      assert.ok(!SCARY.test(a.name + a.desc + a.cast), `${id}: こわい ことば`);
      assert.equal(names.get(a.name).length, 1, `${a.name} が かぶる`);
      for (const p of partsOf(a.effect)) {
        const q = p.type === 'goldGuard' ? p.then : p;
        if (q.type === 'buff' && (q.target || p.target || a.target) === 'allies') assert.ok(q.mult <= ((q.stats || [q.stat]).length > 1 ? 1.35 : 1.4) + 1e-9, a.name);
        if (['atbSet', 'status', 'debuff'].includes(p.type) && ['enemy', 'enemies'].includes(p.target || a.target)) assert.ok(p.chance > 0 && p.chance < 1, a.name);
      }
    }
    const shape = (a) => `${a.target}|${partsOf(a.effect).map((p) => [p.type, p.target || '', p.element || '', p.stat || (p.stats || []).join('+'), p.status || '', p.hits ? 'hits' : ''].join(':')).join(',')}`;
    const seen = new Set();
    for (const [, id] of job.learn) {
      const k = shape(ABILITIES[id]);
      assert.ok(!seen.has(k), `${ABILITIES[id].name} の 形が かぶる`);
      seen.add(k);
    }
  }
  assert.deepEqual([...mine].sort(), Object.keys(R66C_ABILITIES).sort(), 'abilities-r66c.js の 技は ぜんぶ どれかの 職業で 覚える');
  for (const j of ['ano_kata']) for (const s of [JOBS[j].desc, JOB_HINTS[j], TRIAL_WORDS[j], JOB_SAY[j]]) assert.ok(!SCARY.test(s), s);
  // 職業の 味（家族の ねがい）
  const has = (j, f) => JOBS[j].learn.some(([, id]) => partsOf(ABILITIES[id].effect).some(f));
  const allyBuffs = JOBS.souri.learn.filter(([, id]) => partsOf(ABILITIES[id].effect).some((p) => p.type === 'buff' && (p.target || ABILITIES[id].target) === 'allies'));
  assert.ok(allyBuffs.length >= 4, '総理大臣: 仲間全員を 強く する 号令');
  assert.ok(partsOf(ABILITIES.souri_sig.effect).some((p) => p.type === 'buff' && p.target === 'allies' && p.stats.length === 3), '日本列島大号令: 仲間も 大きく 強く');
  assert.ok(has('kaichou', (p) => p.type === 'goldThrow') && has('kaichou', (p) => p.type === 'goldGuard'), '会長: お金で 攻撃と 守り');
  assert.ok(has('kaichou', (p) => p.points > 0), '会長: お金も 手に 入る');
  for (const [, id] of JOBS.kaichou.learn) {
    if (partsOf(ABILITIES[id].effect).some((p) => ['goldThrow', 'goldGuard'].includes(p.type))) assert.ok(ABILITIES[id].noAuto && /オートでは使わない/.test(ABILITIES[id].desc), `${id}: お金を 使う 技は オートで 使わない`);
  }
  assert.ok(has('hatarakikata', (p) => p.type === 'regen'), '働き方改革の星: ノー残業デー');
  assert.ok(!JOBS.hatarakikata.learn.some(([, id]) => partsOf(ABILITIES[id].effect).some((p) => p.type === 'hurt' || p.type === 'overtime' || p.hpCost)), 'HPを けずる 技は もう 使わない');
  assert.ok(partsOf(ABILITIES.hatarakikata_sig.effect).some((p) => p.type === 'heal' && p.target === 'allies'));
  const weak = JOBS.ano_kata.learn.filter(([, id]) => partsOf(ABILITIES[id].effect).some((p) => p.type === 'debuff' || p.type === 'status'));
  assert.ok(weak.length >= 4, `あの方: 敵を 弱らせる 技 ${weak.length}`);
});

test('第66回 C班の 技は ぜんぶ たたかいで 使えて、攻撃技は ダメージ・オートでも こわれない', () => {
  let n = 0;
  for (const j of NEW) {
    for (const [, id] of JOBS[j].learn) {
      const s = setup(j, { seed: ++n });
      const a = ABILITIES[id];
      const act = useSkill(s, id, a.target === 'ally' ? s.m.id : null);
      assert.ok(act && !act.lines.some((l) => l.includes('MPが足りない') || l.includes('お金が足りない')), id);
      for (const l of act.lines) textOk(l, id);
      if (abilityRole(a) === 'dmg') assert.ok(act.results?.some((x) => x.dmg > 0), `${id} の ダメージ`);
      if (id === 'souri_sig') assert.ok(s.me.buffs.atk && s.m.buffs.def && s.m.buffs.agi, '仲間の 攻撃力・守備力・素早さ');
      if (id === 'kaichou_sig') assert.ok(s.m.buffs.def, '仲間の 守備力');
    }
    const s = setup(j, { seed: 7 });
    s.me.abilities = learnedAbilities(s.c);
    let used = 0;
    for (let i = 0; i < 12; i++) {
      const cmd = decideAlly(s.b, s.me);
      assert.ok(cmd?.type, `${j}: ${JSON.stringify(cmd)}`);
      if (cmd.type === 'ability') {
        used++;
        assert.ok(!ABILITIES[cmd.id].noAuto, `${j}: オートで ${cmd.id}`);
      }
    }
    assert.ok(used > 0, `${j}: オートでも 技を 使う`);
  }
});

test('会長の お金の 技: 札束の雨は お金を 使って 敵全体に ダメージ・ボディーガードは お金で 守る・お金が ないと 出ない', () => {
  // 札束の雨（50＋レベル×5 ゴールド）
  {
    const s = setup('kaichou', { gold: 100000 });
    const act = useSkill(s, 'kch_satsutaba');
    const want = 50 + s.me.lv * 5;
    assert.equal(s.wallet.gold, 100000 - want, 'お金を 使う');
    assert.ok(want <= 600, `お金は 少しだけ（${want}G）`);
    assert.ok(act.results.filter((x) => x.dmg > 0).length >= 3, '敵全体');
  }
  // 黄金のボディーガード（40＋レベル×3 ゴールド）→ 仲間全員の 守備力
  {
    const s = setup('kaichou', { gold: 100000 });
    const act = useSkill(s, 'kch_guard');
    const want = 40 + s.me.lv * 3;
    assert.equal(s.wallet.gold, 100000 - want);
    assert.ok(want <= 400, `お金は 少しだけ（${want}G）`);
    assert.ok(s.me.buffs.def && s.m.buffs.def, '仲間全員の 守備力');
    assert.ok(act.lines.some((l) => l.includes(`${want}ゴールドをはらった`)), act.lines.join('/'));
    for (const l of act.lines) textOk(l, 'kch_guard');
  }
  // お金が たりない → あるだけ はらって 弱め・0 なら 出ない
  {
    const s = setup('kaichou', { gold: 30 });
    useSkill(s, 'kch_guard');
    assert.equal(s.wallet.gold, 0);
    const full = setup('kaichou', { gold: 100000 });
    useSkill(full, 'kch_guard');
    assert.ok(s.me.buffs.def.mult < full.me.buffs.def.mult, 'たりない ときは 弱め');
    const act = useSkill(s, 'kch_guard');
    assert.ok(act.lines.includes('しかしお金が足りない！'));
  }
  {
    const s = setup('kaichou', { gold: 0 });
    const act = useSkill(s, 'kch_satsutaba');
    assert.ok(act.lines.includes('しかしお金が足りない！'));
    assert.ok(!act.results?.some((x) => x.dmg > 0));
  }
});

test('働き方改革の星: 定時で 休んで、自分の 番の たびに HPが 少し 回復（仲間の ときだけ・まんたんなら なにも しない）', () => {
  const s = setup('hatarakikata');
  s.me.hp = Math.round(s.me.maxHp * 0.5);
  const before = s.me.hp;
  const act = useSkill(s, 'hwk_telework');
  const got = Math.round(s.me.maxHp * JOBS.hatarakikata.passive.teiji);
  assert.equal(s.me.hp, before + got);
  assert.ok(act.lines.some((l) => l.includes(`HPが${got}回復した`)), act.lines.join('/'));
  for (const l of act.lines) textOk(l, 'teiji');
  // まんたん
  const f = setup('hatarakikata');
  const act2 = useSkill(f, 'hwk_telework');
  assert.ok(!act2.lines.some((l) => l.includes('定時')));
  // ほかの 職業は 回復しない
  const o = setup('black_star');
  o.me.hp = Math.round(o.me.maxHp * 0.5);
  const b0 = o.me.hp;
  readyUp(o.b, o.me);
  o.b.command(o.me.id, { type: 'defend' }, 's1');
  runUntilAct(o.b, o.me.id);
  assert.ok(o.me.hp <= b0);
});

// ───────────── ひらめき技 ─────────────
test('第66回 C班の ひらめき技: 4つの 職業に 2つずつ・データ・文字・その 職業の 技を 使いこむと ひらめく', () => {
  const ids = Object.keys(HIRA_R66C_ABILITIES);
  assert.deepEqual(Object.keys(HIRAMEKI_R66C).sort(), [...ids].sort());
  for (const j of NEW) assert.equal(ids.filter((id) => HIRA_R66C_ABILITIES[id].job === j).length, 2, j);
  const oldAnims = new Set(Object.entries(ABILITIES).filter(([id]) => !ids.includes(id)).map(([, a]) => a.anim));
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden) names.set(a.name, [...(names.get(a.name) || []), id]);
  let n = 0;
  for (const id of ids) {
    const a = ABILITIES[id];
    assert.ok(a && a.hirameki && HIRAMEKI[id] && id.startsWith('hi_'), id);
    assert.match(a.desc, SCOPE[a.target], `${id}: ${a.desc}`);
    for (const s of [a.name, a.desc, a.cast, ...lines(a.effect)]) textOk(s, id);
    assert.deepEqual(checkText(a.kana).filter((p) => p.kind !== 'kana'), [], id);
    assert.ok(oldAnims.has(a.anim), `${id}: ${a.anim}`);
    assert.equal(names.get(a.name).length, 1, a.name);
    for (const [k, c] of Object.entries(HIRAMEKI[id].from)) assert.ok(c > 0 && JOBS[a.job].learn.some(([, x]) => x === k), `${id}: ${k}`);
    const c = newCharacter({ id: 'x', name: 'x', job: 'warrior' });
    c.job = a.job;
    assert.equal(hiraAllowed(c, id), true);
    c.job = TREE[a.job][1];
    assert.equal(hiraAllowed(c, id), false, 'もとの 超級職では ひらめかない');
    {
      const s = setup(a.job, { seed: ++n });
      s.c.hirameki = [id];
      s.me.abilities = [...s.me.abilities, id];
      const act = useSkill(s, id);
      if (abilityRole(a) === 'dmg') assert.ok(act?.results?.some((x) => x.dmg > 0), `${id}: ダメージ`);
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

// ───────────── 合体技・職業の試練・転職の ひとこと ─────────────
test('第66回 C班の 職業: タグで 合体技に 入れる（3つ いじょう）・職業の試練（三の試練まで）・転職の ひとこと', () => {
  for (const j of NEW) {
    assert.ok(JOBS[j].tags.length >= 2 && JOBS[j].tags.length <= 4, j);
    const n = Object.values(DUAL_TECHS).filter((t) => t.need.some((list) => !ANY_GROUPS.has(list) && groupJobs(list).has(j))).length;
    assert.ok(n >= 3, `${JOBS[j].name} の 合体技 ${n}こ`);
    assert.ok(trialJob(j));
    const adj = PHANTOM_ADJ[j];
    assert.ok(Array.isArray(adj) && adj.length === 3 && adj.every((v) => v >= 0.3 && v <= 4), `${j}: ${adj}`);
    assert.ok(phantomSkills(j).length >= 4, `${j}: まぼろしの 技`);
    for (const id of phantomSkills(j)) assert.ok(!ABILITIES[id].noAuto || !['goldThrow'].includes(ABILITIES[id].effect.type), id);
    textOk(TRIAL_WORDS[j], j);
    textOk(masterName(j), j);
    const s = JOB_SAY[j];
    textOk(s, j);
    assert.ok(s.length <= 24 && s.startsWith('「') && s.endsWith('」'), s);
    assert.ok(jobDoneText('ナナ', JOBS[j].name, [], j).endsWith(s));
    assert.ok(!(j in JOB_SAY_MASC));
    for (const [, id] of JOBS[j].learn) assert.equal(abilityFor(id, { job: j, look: BOY }), ABILITIES[id], `${id}: 男の子でも おなじ`);
  }
  assert.ok(JOBS.kaichou.tags.includes('money') && JOBS.ano_kata.tags.includes('dark'));
  assert.ok(JOBS.hatarakikata.tags.includes('home'), '定時で 家に 帰る');
});

// ───────────── 絵 ─────────────
const DIRS = ['down', 'left', 'up', 'right'];
const key = (img) => Buffer.from(img.rgba).toString('base64');
function inspect(img) {
  let n = 0, edge = false;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const a = img.rgba[(y * img.w + x) * 4 + 3];
    if (!a) continue;
    n++;
    if (y === 0 || x === 0 || x === img.w - 1) edge = true;
  }
  return { n, edge };
}

test('第66回 C班の 絵: 4つの 職業（男女・4方向・はみ出さない・もとの 職業と ちがう）・ぼうし・もちもの・古い え', () => {
  assert.deepEqual(R66C_JOBS, NEW);
  for (const j of NEW) assert.ok(R66C_OUTFIT[j] && R66C_BODY[j] && R66C_OLD_LOOK[j], j);
  for (const job of NEW) {
    for (const body of [0, 1]) {
      for (const dir of DIRS) {
        for (const res of [4, 8]) {
          const img = paintHero({ body, style: 'short', hcol: 'black' }, job, undefined, dir, 1, res);
          const r = inspect(img);
          assert.ok(r.n > img.w * img.h * 0.12, `${job} ${body} ${dir} ${res} が かけている`);
          assert.ok(!r.edge, `${job} ${body} ${dir} ${res} が ふちに さわる`);
        }
        for (const from of [TREE[job][1], ...(JOBS[job].reqAlt || []).flat()]) {
          assert.notEqual(key(paintHero({ body, style: 'short' }, job, undefined, dir, 0, 4)), key(paintHero({ body, style: 'short' }, from, undefined, dir, 0, 4)), `${job} は ${from} と ちがう え`);
        }
      }
    }
  }
  const Lk = { cloth: '#3f7fd0', skin: 0 };
  const K = outfitOf(Lk, 'kaichou', 'cloth', false);
  assert.equal(K.kind, 'suit');
  assert.ok(K.cape && K.glasses);
  assert.equal(K.body.prop, 'stick33');
  assert.equal(headOf(null, 'kaichou', 'cloth', K).kind, 'silk33');
  assert.equal(headOf(null, 'ano_kata', 'cloth', outfitOf(Lk, 'ano_kata', 'cloth', false)).kind, 'fedora26');
  assert.equal(jobBody('ano_kata'), R66C_BODY.ano_kata);
  assert.equal(outfitOf(Lk, 'ano_kata', 'iron_armor', false).body.aura, 'dark', 'よろいでも やみの オーラ');
  assert.ok(!jobBody('hatarakikata').aura, '働き方改革の星は ブラックの オーラを 卒業');
  assert.equal(outfitOf(Lk, 'hatarakikata', 'cloth', true).body.prop, 'watch33', '定時の 時計');
  assert.ok(R66C_HAT.kaichou && R66C_HAT.ano_kata);
  for (const job of NEW) for (const body of [0, 1]) {
    const o = lookToOpts({ body }, job, ',cloth,,');
    assert.ok(o.outfit, job);
    assert.ok(paintHuman('down', 0, o), job);
  }
});

// ───────────── えんしゅつ ─────────────
test('第66回 C班の えんしゅつ: 看板の 技・技の えんしゅつは ぜんぶ ある・音・つなぎ・こわれない・文字', () => {
  const used = new Set();
  for (const id of Object.keys(R66C_ABILITIES)) used.add(ABILITIES[id].anim);
  for (const anim of R66C_ANIMS) assert.ok(used.has(anim), `${anim} は どれかの 技で 使う`);
  assert.deepEqual(R66C_SIGS, NEW.map((j) => `${j}_sig`));
  assert.deepEqual(Object.keys(R66C_SFX).sort(), [...R66C_ANIMS].sort());
  const audio = readFileSync(new URL('../public/js/client/audio.js', import.meta.url), 'utf8');
  for (const [anim, s] of Object.entries(R66C_SFX)) assert.ok(audio.includes(`case '${s}':`) || typeof SFX_R26[s] === 'function' || typeof SFX_R33[s] === 'function', `${anim} の 音 ${s}`);
  for (const k of Object.keys(R66C_HIT)) assert.ok(R66C_ANIMS.has(k), k);
  for (const k of PARTY_ANIMS_R66C) assert.ok(R66C_ANIMS.has(k), k);
  for (const id of Object.keys(R66C_ABILITIES)) {
    const a = ABILITIES[id];
    if (R66C_ANIMS.has(a.anim) && ['self', 'allies'].includes(a.target)) assert.ok(PARTY_ANIMS_R66C.has(a.anim), `${id}: みかたの えんしゅつ`);
    if (R66C_ANIMS.has(a.anim) && ['enemy', 'enemies'].includes(a.target)) assert.ok(a.anim in R66C_HIT, `${id}: あたる じかん`);
  }
  for (const k of Object.keys(R66C_FINE)) assert.ok(k.startsWith('r66c'), k);
  const battle = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.match(battle, /Object\.assign\(ANIM_SFX, R66C_SFX\)/);
  assert.match(battle, /Object\.assign\(HIT_DELAY, R66C_HIT\)/);
  assert.equal(battle.split('PARTY_ANIMS_R66C.has(anim)').length - 1, 2);
  const src = readFileSync(new URL('../public/js/client/render/battlefx.js', import.meta.url), 'utf8');
  assert.match(src, /playR66cFx\(this, anim/);
  assert.match(src, /R66C_FINE/);
  const ctx = new Proxy({}, { get: (_, k) => (k === 'createRadialGradient' || k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : k === 'measureText' ? () => ({ width: 10 }) : () => {}), set: () => true });
  for (const anim of R66C_ANIMS) {
    for (const [targets, opts] of [[[{ x: 128, y: 66 }], {}], [[{ x: 60, y: 70 }, { x: 128, y: 82 }, { x: 196, y: 70 }], { crit: true }], [[{ x: BW / 2, y: BH - 22 }], { fromAlly: true }]]) {
      const fx = new Effects();
      assert.equal(playR66cFx(fx, anim, targets, null, opts, BW, BH), true, anim);
      fx.play(anim, targets, null, opts);
      assert.ok(fx.parts.length > 0, anim);
      for (const p of fx.parts) {
        if (!R66C_FINE[p.kind]) continue;
        for (const age of [0, 200, 600, 1200]) R66C_FINE[p.kind](ctx, { ...p, age }, Math.min(1, age / (p.life || 600)));
      }
    }
  }
  assert.equal(playR66cFx(new Effects(), 'fire1', [{ x: 1, y: 1 }]), false);
  assert.ok(!/text: '/.test(readFileSync(new URL('../public/js/client/render/battlefx-r66c.js', import.meta.url), 'utf8')), '文字は 出さない');
});
