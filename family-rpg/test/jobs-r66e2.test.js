// 第66回 E2班: 上級職で 終わっていた 3つの 系統の 先（docs/plan-r66-legend.md）
//   プロゲーマー＋魔法戦士 → eスポーツ世界王者 → ゲームの神
//   楽天カードマン＋部長 → 楽天ゴールドカードマン → 楽天ブラックカードマン
//   超能力者＋賢者 → サイキッカー → さいきくすお
//  ・職業の 木・神殿の うわさ・強さ・技・ひらめき技・合体技・職業の試練・転職の ひとこと・乗り物・文字
//  ・戦いの しかけ（セーブと ロード・楽天ポイント。battle-r66e2.js）
//  ・絵（hero-r66e2.js）と えんしゅつ（battlefx-r66e2.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JOBS, SUPER_ORDER, LEGEND_ORDER, ALL_JOBS, JOB_HINTS, JOB_MAX_LEVEL, jobReqText } from '../public/js/shared/data/jobs.js';
import { JOBS_R66E2, SUPER_R66E2_ORDER, LEGEND_R66E2_ORDER, HINTS_R66E2 } from '../public/js/shared/data/jobs-r66e2.js';
import { ABILITIES, abilityRole } from '../public/js/shared/data/abilities.js';
import { R66E2_ABILITIES } from '../public/js/shared/data/abilities-r66e2.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
import { HIRA_R66E2_ABILITIES, HIRAMEKI_R66E2 } from '../public/js/shared/data/hirameki-r66e2.js';
import { DUAL_TECHS, ANY_GROUPS, groupJobs } from '../public/js/shared/data/dual.js';
import { JOB_SAY, JOB_SAY_MASC, jobDoneText } from '../public/js/shared/data/job-talk.js';
import { TRIAL_WORDS, trialJob, masterName } from '../public/js/shared/data/job-trials.js';
import { VEHICLES } from '../public/js/shared/data/vehicles.js';
import { PHANTOM_ADJ, phantomSkills } from '../public/js/shared/battle-trial.js';
import { cardPtMult, CARD_PT_CAP, LOAD_REVIVE_CAP } from '../public/js/shared/battle-r66e2.js';
import { jobLabel } from '../public/js/shared/job-label.js';
import { abilityFor } from '../public/js/shared/ability-label.js';
import { newCharacter, changeJob, jobUnlocked, jobKnown, gainExp, expForLevel, fullHeal, learnedAbilities, hiraAllowed } from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { paintHero } from '../public/js/client/render/hero.js';
import { outfitOf, jobBody } from '../public/js/client/render/hero-outfit.js';
import { headOf } from '../public/js/client/render/hero-gear.js';
import { masc33 } from '../public/js/client/render/hero-r33.js';
import { R66E2_JOBS, R66E2_OUTFIT, R66E2_BODY, R66E2_HAT, R66E2_OLD_LOOK, R66E2_HAIR } from '../public/js/client/render/hero-r66e2.js';
import { lookToOpts, paintHuman } from '../public/js/client/render/chars.js';
import { Effects, BW, BH } from '../public/js/client/render/battlefx.js';
import { R66E2_ANIMS, R66E2_SIGS, PARTY_ANIMS_R66E2, R66E2_HIT, R66E2_SFX, R66E2_FINE, playR66e2Fx } from '../public/js/client/render/battlefx-r66e2.js';
import { R43J_FINE } from '../public/js/client/render/battlefx-r43j.js';
import { SFX_R26 } from '../public/js/client/sfx-r26.js';
import { SFX_R33 } from '../public/js/client/sfx-r33.js';
import { checkText, gameFiles } from '../tools/kanji-check.mjs';

const SUPERS = ['esports_king', 'gold_cardman', 'psychicer'];
const LEGENDS = ['game_god', 'black_cardman', 'saiki'];
const NEW = [...SUPERS, ...LEGENDS];
// [名前, なる ための 職業]
const TREE = {
  esports_king: ['eスポーツ世界王者', ['pro_gamer', 'magic_knight']],
  gold_cardman: ['楽天ゴールドカードマン', ['rakuten_cardman', 'bucho']],
  psychicer: ['サイキッカー', ['esper', 'sage']],
  game_god: ['ゲームの神', ['esports_king']],
  black_cardman: ['楽天ブラックカードマン', ['gold_cardman']],
  saiki: ['さいきくすお', ['psychicer']],
};
const SIG_NAMES = {
  esports_king: 'ワールドチャンピオンコンボ', gold_cardman: '楽天ゴールドカード！', psychicer: 'サイコキネシス・マックス',
  game_god: 'パーフェクトクリア', black_cardman: '楽天ブラックカード！', saiki: 'やれやれ、本気の超能力',
};
// その 職業の もとの 職業（見た目・タグを くらべる）
const FROM = { esports_king: 'pro_gamer', gold_cardman: 'rakuten_cardman', psychicer: 'esper', game_god: 'esports_king', black_cardman: 'gold_cardman', saiki: 'psychicer' };
const BOY = { body: 0 }, GIRL = { body: 1 };
const SCOPE = { enemy: /敵1体/, enemies: /敵全体/, allies: /仲間全員/, self: /自分/ };
const partsOf = (e) => (e.type === 'multi' ? e.parts : [e]);
const lines = (e) => partsOf(e).flatMap((p) => [p.msg, p.failMsg]).filter(Boolean);
const textOk = (s, what) => assert.deepEqual(checkText(s), [], `${what}: ${s}`);
const sum = (j) => Object.values(JOBS[j].mods).reduce((a, b) => a + b, 0);
const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
const masterChain = (c, jid) => {
  for (const r of JOBS[jid].req || []) { master(c, r); masterChain(c, r); }
  if (JOBS[jid].reqSuper) master(c, 'god_hand');
};

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
const use = (b, me, id, target) => {
  assert.ok(readyUp(b, me), `${id} の 番`);
  const r = b.command(me.id, { type: 'ability', id, target }, 's1');
  assert.equal(r.ok, true, `${id} ${r.reason || ''}`);
  const act = runUntilAct(b, me.id);
  assert.ok(act, id);
  return act;
};

// ───────────── 職業の 木 ─────────────
test('第66回 E2 の 職業: 超級職 3つ・伝説の職業 3つ。名前・うわさ・文字・一覧・乗り物', () => {
  assert.deepEqual(SUPER_R66E2_ORDER, SUPERS);
  assert.deepEqual(LEGEND_R66E2_ORDER, LEGENDS);
  assert.deepEqual(Object.keys(JOBS_R66E2).sort(), [...NEW].sort());
  for (const id of NEW) {
    const j = JOBS[id], [name, req] = TREE[id];
    assert.equal(j, JOBS_R66E2[id], 'jobs.js に まざる');
    assert.equal(j.id, id);
    assert.equal(j.name, name);
    assert.deepEqual(j.req, req);
    assert.equal(j.tier, SUPERS.includes(id) ? 2 : 3);
    assert.equal(j.reqSuper, SUPERS.includes(id) ? undefined : 1, '伝説は ほかの 超級職も 1つ（竜魔人と おなじ）');
    assert.ok((SUPERS.includes(id) ? SUPER_ORDER : LEGEND_ORDER).includes(id));
    assert.equal(ALL_JOBS.filter((x) => x === id).length, 1);
    assert.equal(JOB_HINTS[id], HINTS_R66E2[id], 'うわさ');
    for (const s of [j.name, j.desc, j.short, JOB_HINTS[id]]) textOk(s, id);
    assert.deepEqual(checkText(j.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
    assert.match(j.color, /^#[0-9a-f]{6}$/);
    assert.ok(!j.masc, '男の子も 女の子も おなじ 名前');
    assert.equal(jobLabel(id, { job: id, look: BOY }), name);
    assert.equal(jobLabel(id, { job: id, look: GIRL }), name);
    // 乗り物は もとの 職業と おなじ（レーシングカート・空飛ぶカード・念力ふわり）
    assert.ok(Object.values(VEHICLES).some((v) => v.jobs?.includes(id) && v.jobs.includes(FROM[id])), `${id} の 乗り物`);
  }
  assert.ok(!/[楠雄]/.test(JOBS.saiki.name), '習わない 字は かな');
  assert.equal(jobReqText('esports_king'), 'プロゲーマーLv10＋魔法戦士Lv10');
  assert.equal(jobReqText('gold_cardman'), '楽天カードマンLv10＋部長Lv10');
  assert.equal(jobReqText('psychicer'), '超能力者Lv10＋賢者Lv10');
  assert.equal(jobReqText('game_god'), 'eスポーツ世界王者Lv10＋ほかの超級職1つLv10');
  assert.equal(jobReqText('black_cardman'), '楽天ゴールドカードマンLv10＋ほかの超級職1つLv10');
  assert.equal(jobReqText('saiki'), 'サイキッカーLv10＋ほかの超級職1つLv10');
  // 新しい ファイルは 漢字の きまりの しらべる ファイルに 入っている
  const files = gameFiles().map((f) => f.replace(/\\/g, '/'));
  for (const f of ['shared/data/jobs-r66e2.js', 'shared/data/abilities-r66e2.js', 'shared/data/hirameki-r66e2.js', 'shared/battle-r66e2.js', 'client/render/battlefx-r66e2.js']) {
    assert.ok(files.some((x) => x.endsWith(f)), f);
  }
});

test('第66回 E2 の 職業: なれる じゅんばん（上級職 2つ → 超級職、超級職 ＋ ほかの 超級職 1つ → 伝説）', () => {
  for (const id of SUPERS) {
    const c = newCharacter({ id: 'k', name: 'ケン', job: 'warrior' });
    const [a, b] = TREE[id][1];
    assert.equal(jobUnlocked(c, id), false);
    master(c, a);
    assert.equal(jobUnlocked(c, id), false, '1つでは なれない');
    master(c, b);
    assert.equal(jobKnown(c, id), true);
    assert.equal(jobUnlocked(c, id), true);
    assert.equal(changeJob(c, id).ok, true);
    assert.ok(learnedAbilities(c).includes(JOBS[id].learn[0][1]));
  }
  for (const id of LEGENDS) {
    const c = newCharacter({ id: 'k', name: 'ケン', job: 'warrior' });
    const from = TREE[id][1][0];
    assert.equal(jobKnown(c, id), false, `${id} は はじめ ひみつ`);
    master(c, from);
    assert.equal(jobKnown(c, id), true, `${from} を きわめると うわさ`);
    assert.equal(jobUnlocked(c, id), false, 'ほかの 超級職も いる');
    master(c, 'archmage');
    assert.equal(jobUnlocked(c, id), true);
    assert.equal(changeJob(c, id).ok, true);
    assert.ok(learnedAbilities(c).includes(JOBS[id].learn[0][1]));
  }
});

test('第66回 E2 の 職業: 強さは 今の 超級職・伝説の職業の はんい・もとの 職業より 強い・武器・お金', () => {
  const others = (list) => list.filter((j) => !NEW.includes(j)).map(sum);
  const sup = others(SUPER_ORDER), leg = others(LEGEND_ORDER);
  for (const j of NEW) {
    assert.deepEqual(Object.keys(JOBS[j].mods).sort(), ['agi', 'def', 'heal', 'hp', 'mag', 'mp', 'str']);
    const range = SUPERS.includes(j) ? sup : leg;
    assert.ok(sum(j) >= Math.min(...range) && sum(j) <= Math.max(...range), `${j}: ${sum(j).toFixed(2)}`);
    for (const r of TREE[j][1]) assert.ok(sum(j) > sum(r) + 0.5, `${j}: ${r} より 強い`);
    assert.ok(Object.values(JOBS[j].perLv).reduce((a, b) => a + b, 0) <= 3.5 + 1e-9);
    for (const r of TREE[j][1]) for (const w of JOBS[r].weapons) assert.ok(JOBS[j].weapons.includes(w), `${j}: ${r} の 武器 ${w}`);
  }
  for (const j of LEGENDS) assert.ok(sum(j) > Math.max(...sup), `${j}: 超級職より 上`);
  // 職業の 味
  assert.ok(JOBS.esports_king.mods.agi >= 1.55 && JOBS.game_god.mods.agi >= 1.7, 'ゲーマーは 素早い');
  assert.ok(JOBS.psychicer.mods.mag >= 1.55 && JOBS.saiki.mods.mag >= 1.7, '超能力は 魔力');
  // お金（楽天カードマン 1.2 → ゴールド 1.3 → ブラック 1.4。world/battles.js の passive.gold）
  assert.equal(JOBS.gold_cardman.passive.gold, 1.3);
  assert.equal(JOBS.black_cardman.passive.gold, 1.4);
  assert.ok(JOBS.gold_cardman.passive.gold > JOBS.rakuten_cardman.passive.gold);
});

// ───────────── 技 ─────────────
test('第66回 E2 の 技: 数・Lv10 が いちばん MP・看板の 技・攻撃技・せつめい・文字・名前が かぶらない・補助の 上限', () => {
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden) names.set(a.name, [...(names.get(a.name) || []), id]);
  const mine = new Set();
  for (const j of NEW) {
    const job = JOBS[j];
    const n = job.learn.length;
    assert.ok(SUPERS.includes(j) ? n >= 6 && n <= 7 : n >= 7 && n <= 9, `${j}: ${n}こ`);
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
    assert.ok(job.learn.filter(([, id]) => abilityRole(ABILITIES[id]) === 'dmg').length >= 3, `${j}: 攻撃技 3つ いじょう`);
    const cap = (p) => ((p.stats || [p.stat]).length > 1 ? (SUPERS.includes(j) ? 1.3 : 1.35) : 1.4) + 1e-9;
    for (const [, id] of job.learn) {
      const a = ABILITIES[id];
      mine.add(id);
      assert.equal(a.job, j);
      assert.ok(['skill', 'spell'].includes(a.kind));
      assert.ok(!a.weapon, `${id}: 武器が なくても 使える`);
      assert.ok(!a.masc, `${id}: 男の子も おなじ`);
      assert.ok(a.desc && a.cast && a.anim && a.kana, id);
      assert.match(a.desc, SCOPE[a.target], `${id}: ${a.desc}`);
      for (const s of [a.name, a.desc, a.cast, ...lines(a.effect)]) textOk(s, id);
      assert.deepEqual(checkText(a.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
      assert.equal(names.get(a.name).length, 1, `${a.name} が かぶる`);
      // いくつかの こうかの 技は 種類を かく（multi の まま だと ダメージの 技に なる）
      if (a.effect.type === 'multi' && partsOf(a.effect)[0].type !== 'phys' && partsOf(a.effect)[0].type !== 'magic') assert.ok(a.role, `${id}: role`);
      for (const p of partsOf(a.effect)) {
        if (p.type === 'buff' && (p.target || a.target) === 'allies') assert.ok(p.mult <= cap(p), a.name);
        if (['atbSet', 'status', 'debuff', 'yomi'].includes(p.type) && ['enemy', 'enemies'].includes(p.target || a.target)) assert.ok(p.chance > 0 && p.chance < 1, a.name);
        assert.ok(p.type !== 'goldThrow', `${a.name}: お金を 使う 技は ない（子ども むけ）`);
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
  assert.deepEqual([...mine].sort(), Object.keys(R66E2_ABILITIES).sort(), 'abilities-r66e2.js の 技は ぜんぶ どれかの 職業で 覚える');
  // 職業の 味（家族の ねがい）
  const has = (j, f) => JOBS[j].learn.some(([, id]) => partsOf(ABILITIES[id].effect).some(f));
  for (const j of ['esports_king', 'game_god']) {
    assert.ok(has(j, (p) => p.type === 'phys' && p.hits >= 8), `${j}: れんだ`);
    assert.ok(JOBS[j].learn.some(([, id]) => partsOf(ABILITIES[id].effect).some((p) => p.type === 'phys') && partsOf(ABILITIES[id].effect).some((p) => p.type === 'buff' && (p.stats || [p.stat]).includes('def'))), `${j}: せめて 守る`);
  }
  assert.ok(has('game_god', (p) => p.type === 'savePoint') && has('game_god', (p) => p.type === 'loadPoint'), 'ゲームの神: セーブと ロード');
  assert.ok(has('game_god', (p) => p.type === 'atbSet' && p.sub > 0), 'ゲームの神: コンボで 止める');
  for (const j of ['gold_cardman', 'black_cardman']) {
    assert.ok(has(j, (p) => p.type === 'cardPoint'), `${j}: 楽天ポイントが たまる`);
    assert.ok(has(j, (p) => p.ptScale > 0), `${j}: ポイントが 多いほど 強い`);
    assert.ok(has(j, (p) => p.points > 0), `${j}: ポイントバック（お金が もらえる）`);
    assert.ok(partsOf(ABILITIES[`${j}_sig`].effect).some((p) => p.ptScale > 0 && p.points > 0), `${j}: 看板の 技も ポイント`);
  }
  for (const j of ['psychicer', 'saiki']) {
    assert.ok(has(j, (p) => p.type === 'yomi'), `${j}: 心を 読む`);
    assert.ok(has(j, (p) => p.type === 'magic'), `${j}: 念力`);
    assert.ok(JOBS[j].learn.some(([, id]) => /テレポート/.test(ABILITIES[id].name)), `${j}: テレポート`);
  }
  assert.ok(has('saiki', (p) => p.type === 'buff' && (p.stats || [p.stat]).includes('eva')), 'さいき: めだたない ように');
  assert.ok(/制御装置/.test(ABILITIES.ksu_seigyo.name), 'さいき: 力を おさえる 制御装置');
  assert.equal(ABILITIES.saiki_sig.effect.parts[0].element, 'void', '本気の 超能力は どんな 敵にも 効く');
});

test('第66回 E2 の 技は ぜんぶ たたかいで 使えて、攻撃技は ダメージ・オートでも こわれない', () => {
  let n = 0;
  for (const j of NEW) {
    for (const [, id] of JOBS[j].learn) {
      const { b, me, m } = setup(j, { seed: ++n });
      const a = ABILITIES[id];
      const act = use(b, me, id, a.target === 'ally' ? m.id : b.enemies[0].id);
      assert.ok(!act.lines.some((l) => l.includes('MPが足りない')), id);
      for (const l of act.lines) textOk(l, id);
      if (abilityRole(a) === 'dmg') assert.ok(act.results?.some((x) => x.dmg > 0), `${id} の ダメージ`);
      if (id === 'game_god_sig') assert.ok(me.buffs.def && m.buffs.def, 'パーフェクトクリア: 仲間の 守備力');
      if (id === 'gg_command') assert.ok(m.buffs.atk && m.buffs.agi, 'うらわざコマンド');
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

// ───────────── 戦いの しかけ ─────────────
test('第66回 E2 の しかけ: セーブして ロードすると、セーブした 時の HPに もどる（たおれた 仲間も 生き返る・1回で 消える）', () => {
  const { b, me, m } = setup('game_god', { seed: 3 });
  // ロードは セーブが ないと 回復だけ
  let act = use(b, me, 'gg_load');
  assert.ok(act.lines.includes('しかし、セーブしたデータがない！'));
  me.hp = me.maxHp;
  m.hp = m.maxHp;
  act = use(b, me, 'gg_save');
  assert.ok(act.lines.includes('ここまでの冒険を、セーブした！'));
  assert.equal(b.r66save.ally.hp[me.id], me.maxHp);
  assert.ok(m.regen, 'セーブで じわじわ 回復');
  // ピンチ: 自分は HP 1、仲間は たおれた
  me.hp = 1;
  m.hp = 0;
  m.alive = false;
  act = use(b, me, 'gg_load');
  for (const l of act.lines) textOk(l, 'load');
  assert.ok(act.lines.some((l) => l.includes('ロードした')));
  assert.equal(me.hp, me.maxHp, 'セーブした 時の HPまで もどる');
  assert.equal(m.alive, true, 'たおれた 仲間も 生き返る');
  assert.ok(m.hp >= 1 && m.hp <= Math.round(m.maxHp * LOAD_REVIVE_CAP), `生き返る HPは 半分まで ${m.hp}/${m.maxHp}`);
  assert.ok(act.results.some((r) => r.id === m.id && r.heal > 0));
  assert.equal(b.r66save.ally, undefined, '1回 ロードすると セーブは 消える');
  // もう一度 ロードしても 生き返らない
  m.hp = 0;
  m.alive = false;
  act = use(b, me, 'gg_load');
  assert.equal(m.alive, false);
  assert.ok(act.lines.includes('しかし、セーブしたデータがない！'));
});

test('第66回 E2 の しかけ: 楽天ポイントは カードの 技で たまり（上限まで）、多いほど カードの 技が 強い。戦いごとに 0 から', () => {
  assert.equal(cardPtMult({ cardPts: 5 }, { mult: 2 }), 1, 'ptScale の ない 技は かわらない');
  assert.equal(cardPtMult({ cardPts: 5 }, { ptScale: 0.04 }), 1.2);
  assert.equal(cardPtMult({}, { ptScale: 0.04 }), 1);
  const { b, me } = setup('gold_cardman', { seed: 5 });
  assert.equal(me.cardPts || 0, 0);
  const t = b.enemies[0];
  const est = () => b.calcPhys(me, t, ABILITIES.gcm_card.effect.parts[0], 1, 'phys', true).dmg;
  const before = est();
  let act = use(b, me, 'gcm_card', t.id);
  assert.equal(me.cardPts, 1);
  assert.ok(act.lines.some((l) => l.includes('楽天ポイントが1たまった！')), act.lines.join('/'));
  act = use(b, me, 'gcm_bonus');
  assert.equal(me.cardPts, 4);
  for (let i = 0; i < 4; i++) use(b, me, 'gcm_bonus');
  assert.equal(me.cardPts, CARD_PT_CAP, 'ゴールドは 10 まで');
  me.buffs = {};
  assert.ok(est() > before * 1.3, `ポイントで 強く なる ${before} → ${est()}`);
  act = use(b, me, 'gcm_bonus');
  assert.ok(act.lines.some((l) => l.includes('もういっぱい')));
  for (const l of act.lines) textOk(l, 'cardPoint');
  // ブラックは 15 まで
  const s2 = setup('black_cardman', { seed: 6 });
  for (let i = 0; i < 4; i++) use(s2.b, s2.me, 'bcm_gobai');
  assert.equal(s2.me.cardPts, 15);
  // 次の 戦いは 0 から
  const s3 = setup('gold_cardman', { seed: 9 });
  assert.equal(s3.me.cardPts || 0, 0);
  // お金は へらない（ポイントバックで ふえる だけ）
  const { b: b4, me: me4 } = setup('black_cardman', { seed: 11 });
  let got = 0;
  b4.hooks.gainGold = (c, sp, r) => { got += Math.round(10 * r); return Math.round(10 * r); };
  b4.hooks.spendGold = () => assert.fail('お金を 使わない');
  use(b4, me4, 'black_cardman_sig', b4.enemies[0].id);
  assert.ok(got > 0, 'ポイントバック');
});

test('第66回 E2 の しかけ: 心を読む（先読み）・テレパシーは 敵の 次の 行動を 読む', () => {
  for (const [job, id, all] of [['psychicer', 'psy_yomu', false], ['saiki', 'ksu_telepathy', true]]) {
    const { b, me } = setup(job, { seed: 4 });
    const act = use(b, me, id, b.enemies[0].id);
    const read = b.enemies.filter((e) => e.yomi);
    assert.ok(read.length >= 1, `${id}: 読んだ`);
    if (!all) assert.equal(read.length, 1);
    assert.ok(act.lines.some((l) => l.includes('次の行動を読んだ')));
  }
});

// ───────────── ひらめき技 ─────────────
test('第66回 E2 の ひらめき技: 超級職に 1つ・伝説に 2つ・データ・文字・その 職業の 技を 使いこむと ひらめく', () => {
  const ids = Object.keys(HIRA_R66E2_ABILITIES);
  assert.deepEqual(Object.keys(HIRAMEKI_R66E2).sort(), [...ids].sort());
  for (const j of NEW) assert.equal(ids.filter((id) => HIRA_R66E2_ABILITIES[id].job === j).length, SUPERS.includes(j) ? 1 : 2, j);
  const oldAnims = new Set(Object.entries(ABILITIES).filter(([id]) => !ids.includes(id) && !(id in R66E2_ABILITIES)).map(([, a]) => a.anim));
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
    c.job = FROM[a.job];
    assert.equal(hiraAllowed(c, id), false, 'もとの 職業では ひらめかない');
    // 使える
    {
      const { b, c: ch, me } = setup(a.job, { seed: ++n });
      ch.hirameki = [id];
      me.abilities = [...me.abilities, id];
      const act = use(b, me, id, b.enemies[0].id);
      if (abilityRole(a) === 'dmg') assert.ok(act.results?.some((x) => x.dmg > 0), `${id}: ダメージ`);
      for (const l of act.lines) textOk(l, id);
    }
    // ひらめく
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
test('第66回 E2 の 職業: タグで 合体技に 入れる（3つ いじょう）・職業の試練・転職の ひとこと', () => {
  for (const j of NEW) {
    assert.ok(JOBS[j].tags.length >= 2 && JOBS[j].tags.length <= 4, j);
    if (LEGENDS.includes(j)) for (const t of JOBS[FROM[j]].tags.filter((x) => x !== 'work' && x !== 'guard')) assert.ok(JOBS[j].tags.includes(t), `${j}: もとの 職業の タグ ${t}`);
    const n = Object.values(DUAL_TECHS).filter((t) => t.need.some((list) => !ANY_GROUPS.has(list) && groupJobs(list).has(j))).length;
    assert.ok(n >= 3, `${JOBS[j].name} の 合体技 ${n}こ`);
    // 職業の試練（三の試練まで）
    assert.ok(trialJob(j));
    const adj = PHANTOM_ADJ[j];
    assert.ok(Array.isArray(adj) && adj.length === 3 && adj.every((v) => v >= 0.3 && v <= 4), `${j}: ${adj}`);
    assert.ok(phantomSkills(j).length >= 4, `${j}: まぼろしの 技`);
    textOk(TRIAL_WORDS[j], j);
    assert.ok(TRIAL_WORDS[j].length <= 32, `${j}: 師しょうの ことばは みじかく`);
    textOk(masterName(j), j);
    // 転職の ひとこと（男の子 むけは ない）
    const s = JOB_SAY[j];
    textOk(s, j);
    assert.ok(s.length <= 24 && s.startsWith('「') && s.endsWith('」'), s);
    assert.ok(jobDoneText('ナナ', JOBS[j].name, [], j).endsWith(s));
    assert.ok(!(j in JOB_SAY_MASC));
    for (const [, id] of JOBS[j].learn) assert.equal(abilityFor(id, { job: j, look: BOY }), ABILITIES[id], `${id}: 男の子でも おなじ`);
  }
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

test('第66回 E2 の 絵: 6つの 職業（男女・4方向・はみ出さない・もとの 職業と ちがう）・ぼうし・かみ・古い え', () => {
  assert.deepEqual([...R66E2_JOBS].sort(), [...NEW].sort());
  for (const j of NEW) assert.ok(R66E2_OUTFIT[j] && R66E2_OLD_LOOK[j], j);
  for (const job of NEW) {
    for (const body of [0, 1]) {
      for (const dir of DIRS) {
        for (const res of [4, 8]) {
          const img = paintHero({ body, style: 'short', hcol: 'black' }, job, undefined, dir, 1, res);
          const r = inspect(img);
          assert.ok(r.n > img.w * img.h * 0.12, `${job} ${body} ${dir} ${res} が かけている`);
          assert.ok(!r.edge, `${job} ${body} ${dir} ${res} が ふちに さわる`);
        }
        assert.notEqual(key(paintHero({ body, style: 'short' }, job, undefined, dir, 0, 4)), key(paintHero({ body, style: 'short' }, FROM[job], undefined, dir, 0, 4)), `${job} は ${FROM[job]} と ちがう え`);
      }
    }
    assert.equal(masc33(job, false), null, '男の子も おなじ すがた');
  }
  const Lk = { cloth: '#3f7fd0', skin: 0 };
  assert.equal(outfitOf(Lk, 'esports_king', 'cloth', false).kind, 'esports');
  assert.equal(headOf(null, 'esports_king', 'cloth', outfitOf(Lk, 'esports_king', 'cloth', false)).kind, 'gameset');
  assert.ok(outfitOf(Lk, 'game_god', 'cloth', true).cape, 'ゲームの神は 金の マント');
  assert.equal(jobBody('game_god').aura, 'gold');
  assert.equal(outfitOf(Lk, 'gold_cardman', 'cloth', false).kind, 'tights26');
  assert.equal(headOf(null, 'black_cardman', 'cloth', outfitOf(Lk, 'black_cardman', 'cloth', false)).kind, 'cowl');
  assert.equal(jobBody('black_cardman').prop, 'card');
  assert.equal(outfitOf(Lk, 'psychicer', 'cloth', false).kind, 'gakuran');
  assert.equal(jobBody('psychicer').aura, 'psy');
  // さいきくすお: ピンクの かみ・めがね（よろいを きても かみの いろは のこる）
  assert.ok(R66E2_HAIR[R66E2_BODY.saiki.hcol]);
  assert.ok(outfitOf(Lk, 'saiki', 'cloth', false).glasses);
  assert.equal(outfitOf(Lk, 'saiki', 'iron_armor', false).body?.hcol ?? jobBody('saiki').hcol, 'saikipink');
  for (const j of Object.keys(R66E2_HAT)) assert.ok(NEW.includes(j));
  // 古い 小さな え
  for (const job of NEW) for (const body of [0, 1]) {
    const o = lookToOpts({ body }, job, ',cloth,,');
    assert.ok(o.outfit, job);
    assert.ok(paintHuman('down', 0, o), job);
  }
});

// ───────────── えんしゅつ ─────────────
test('第66回 E2 の えんしゅつ: 看板の 技・技の えんしゅつは ぜんぶ ある・音・つなぎ・こわれない・文字', () => {
  const used = new Set();
  for (const id of Object.keys(R66E2_ABILITIES)) used.add(ABILITIES[id].anim);
  for (const anim of R66E2_ANIMS) assert.ok(used.has(anim), `${anim} は どれかの 技で 使う`);
  assert.deepEqual([...R66E2_SIGS].sort(), NEW.map((j) => `${j}_sig`).sort());
  assert.deepEqual(Object.keys(R66E2_SFX).sort(), [...R66E2_ANIMS].sort());
  const audio = readFileSync(new URL('../public/js/client/audio.js', import.meta.url), 'utf8');
  for (const [anim, s] of Object.entries(R66E2_SFX)) assert.ok(audio.includes(`case '${s}':`) || typeof SFX_R26[s] === 'function' || typeof SFX_R33[s] === 'function', `${anim} の 音 ${s}`);
  for (const k of Object.keys(R66E2_HIT)) assert.ok(R66E2_ANIMS.has(k), k);
  for (const k of PARTY_ANIMS_R66E2) assert.ok(R66E2_ANIMS.has(k), k);
  for (const id of Object.keys(R66E2_ABILITIES)) {
    const a = ABILITIES[id];
    if (R66E2_ANIMS.has(a.anim) && ['self', 'allies'].includes(a.target)) assert.ok(PARTY_ANIMS_R66E2.has(a.anim), `${id}: みかたの えんしゅつ`);
    if (R66E2_ANIMS.has(a.anim) && ['enemy', 'enemies'].includes(a.target)) assert.ok(a.anim in R66E2_HIT, `${id}: あたる じかん`);
  }
  for (const k of Object.keys(R66E2_FINE)) assert.ok(k.startsWith('r66e2') && !(k in R43J_FINE), k);
  const battle = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.match(battle, /Object\.assign\(ANIM_SFX, R66E2_SFX\)/);
  assert.match(battle, /Object\.assign\(HIT_DELAY, R66E2_HIT\)/);
  assert.match(battle, /PARTY_ANIMS_R66E2\.has\(anim\)/);
  const src = readFileSync(new URL('../public/js/client/render/battlefx.js', import.meta.url), 'utf8');
  assert.match(src, /playR66e2Fx\(this, anim/);
  assert.match(src, /R66E2_FINE/);
  // じっさいに 出して、つぶを かいても こわれない（canvas の かわり）
  const ctx = new Proxy({}, { get: (_, k) => (k === 'createRadialGradient' || k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : k === 'measureText' ? () => ({ width: 10 }) : () => {}), set: () => true });
  for (const anim of R66E2_ANIMS) {
    for (const targets of [[{ x: 128, y: 66 }], [{ x: 60, y: 70 }, { x: 128, y: 82 }, { x: 196, y: 70 }], [{ x: BW / 2, y: BH - 22 }]]) {
      const fx = new Effects();
      assert.equal(playR66e2Fx(fx, anim, targets, null, {}, BW, BH), true, anim);
      fx.play(anim, targets, null, {});
      assert.ok(fx.parts.length > 0, anim);
      for (const p of fx.parts) {
        if (!R66E2_FINE[p.kind]) continue;
        for (const age of [0, 200, 600, 1200]) R66E2_FINE[p.kind](ctx, { ...p, age }, Math.min(1, age / (p.life || 600)));
      }
    }
  }
  assert.equal(playR66e2Fx(new Effects(), 'fire1', [{ x: 1, y: 1 }]), false);
  assert.equal(playR66e2Fx(new Effects(), 'r66e2_card', [{ x: NaN, y: 1 }]), false);
  assert.ok(!/text: '/.test(readFileSync(new URL('../public/js/client/render/battlefx-r66e2.js', import.meta.url), 'utf8')), '文字は 出さない');
});
