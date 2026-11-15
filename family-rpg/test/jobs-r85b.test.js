// 第85回 B班（2026年11月）: 烈火の炎の 系統（火の 道具箱。docs/plan-jobs-r79.md の 10-4・docs/plan-r85-jobs-b.md）
//   忍者（今の 上級職）→ 炎術士（超級職）→ 八竜の炎術士・烈火（伝説。＋ほかの 超級職 1つ）
//  ・なり方・強さ・技・ひらめき技・合体技の タグ・試練・転職の ひとこと・乗り物・文字
//  ・この 系統だけの しくみ（shared/battle-r85b.js）: 火竜をよぶ（えらぶ・その場で 出る・4ひき／8ひき・MP・あいて・ほかの 職業）・二ひき同時・
//    まどか（下限）・るい（よけの 上限・前ぶれの 大技は よけられない）・れっしん・ほむら（ボスは 効きにくい）・せつな・晴れで ×1.3（足し算に しない）・
//    姫を守る忍び・オート（この 系統の 技だけ）・キャラに 項目を 足さない
//  ・絵（hero-r85b.js）・乗り物の 絵（vehicle-r85b.js）・えんしゅつ（battlefx-r85b.js）・火竜の メニューと 札（client/battle-r85b.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JOBS, SUPER_ORDER, LEGEND_ORDER, ALL_JOBS, JOB_HINTS, JOB_MAX_LEVEL, jobReqText } from '../public/js/shared/data/jobs.js';
import { JOBS_R85B, R85B_ORDERS, R85B_JOBS } from '../public/js/shared/data/jobs-r85b.js';
import { ABILITIES, abilityRole } from '../public/js/shared/data/abilities.js';
import { R85B_ABILITIES, RYU, RYU_ORDER, RYU_SET, R85B_FIRE } from '../public/js/shared/data/abilities-r85b.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
import { HIRA_R85B_ABILITIES, HIRAMEKI_R85B } from '../public/js/shared/data/hirameki-r85b.js';
import { DUAL_TECHS, ANY_GROUPS, groupJobs } from '../public/js/shared/data/dual.js';
import { JOB_SAY, JOB_SAY_MASC, jobDoneText } from '../public/js/shared/data/job-talk.js';
import { TRIAL_WORDS, trialJob, masterName } from '../public/js/shared/data/job-trials.js';
import { VEHICLES } from '../public/js/shared/data/vehicles.js';
import { PHANTOM_ADJ, phantomSkills } from '../public/js/shared/battle-trial.js';
import { ryuSetOf, ryuMp, EVA_TOTAL, r85bEva, r85bPlan, R85B_AI } from '../public/js/shared/battle-r85b.js';
import { CUT_FLOOR } from '../public/js/shared/battle-r83a.js';
import { setWeather, WEATHER_UP } from '../public/js/shared/battle-weather.js';
import { jobLabel } from '../public/js/shared/job-label.js';
import { newCharacter, changeJob, jobUnlocked, jobKnown, gainExp, expForLevel, fullHeal, learnedAbilities, hiraAllowed, mpCost } from '../public/js/shared/stats.js';
import { Battle, pub } from '../public/js/shared/battle.js';
import { decideAlly, fightWeight } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { paintHero } from '../public/js/client/render/hero.js';
import { outfitOf, jobBody } from '../public/js/client/render/hero-outfit.js';
import { R85B_JOBS as LOOK_JOBS, R85B_OUTFIT, R85B_BODY, R85B_OLD_LOOK, AURA85B } from '../public/js/client/render/hero-r85b.js';
import { lookToOpts, paintHuman } from '../public/js/client/render/chars.js';
import { VIEWS, paintVehicle, vehicleFrames, riderSpot } from '../public/js/client/render/vehicle-art.js';
import { Effects, BW, BH } from '../public/js/client/render/battlefx.js';
import { PARTY_ANIMS } from '../public/js/client/render/battlefx-jobs2.js';
import { R85B_ANIMS, R85B_SIGS, R85B_HIT, R85B_SFX, PARTY_ANIMS_R85B, R85B_DRAGONS, DRAGON_LOOK, R85B_FINE, playR85bFx } from '../public/js/client/render/battlefx-r85b.js';
import { r85bMarks, ryuItems } from '../public/js/client/battle-r85b.js';
import { SFX_R26 } from '../public/js/client/sfx-r26.js';
import { SFX_R33 } from '../public/js/client/sfx-r33.js';
import { checkText, gameFiles } from '../tools/kanji-check.mjs';

const NEW = ['enjutsushi', 'rekka'];
// [名前, 段, なり方]
const TREE = {
  enjutsushi: ['炎術士', 2, ['ninja']],
  rekka: ['八竜の炎術士・烈火', 3, ['enjutsushi']],
};
const SIG_NAMES = { enjutsushi: '火竜・二ひき同時', rekka: '八竜・同時しょうかん' };
const SUM_RANGE = { 2: [7.75, 9.05], 3: [9.3, 10.2] };
const BOY = { body: 0 };
const SCARY = /殺|死ね|ころす|ころし|血/;
const KANJI = /[一-鿿]/;
const SCOPE = { enemy: /敵1体/, enemies: /敵|ばらばら/, group: /同じ種類の敵/, allies: /仲間全員/, ally: /仲間1人/, self: /自分|火竜|よび出す/ };
const partsOf = (e) => (e.type === 'multi' ? e.parts : [e]);
const textOk = (s, what) => assert.deepEqual(checkText(s), [], `${what}: ${s}`);
const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
const masterChain = (c, jid) => {
  for (const r of JOBS[jid].req || []) { master(c, r); masterChain(c, r); }
  if (JOBS[jid].reqSuper) master(c, 'god_hand');
};

// enemies … 魔物の 種類。act … 敵の 行動（なし ＝ 何もしない）。mates … いっしょに 戦う 仲間の 職業
function setup(job, { seed = 1, enemies = ['rockman'], lv = 45, act = 'm_nothing', mates = [], mp = 999 } = {}) {
  const mk = (id, name, j) => {
    const c = newCharacter({ id, name, job: 'monk' });
    gainExp(c, expForLevel(lv));
    masterChain(c, j);
    master(c, j);
    c.job = j;
    c.equip.weapon = null;
    fullHeal(c);
    return c;
  };
  const c = mk('p1', 'ヒナ', job);
  const others = mates.map((j, i) => mk(`m${i}`, `ナカマ${i}`, j));
  const b = new Battle({ rng: makeRng(seed), allies: [c, ...others].map((char) => ({ char, controller: 's1' })), enemies, canFlee: true });
  for (const e of b.enemies) {
    e.actions = [{ w: 1, id: act }];
    e.hp = e.maxHp = 50000;
  }
  for (const a of b.allies) a.mp = a.maxMp = mp;
  return { b, c, me: b.allies[0] };
}
const readyUp = (b, a) => { for (let i = 0; i < 1200 && !a.ready; i++) b.tick(50); return a.ready; };
const runUntilAct = (b, id) => {
  const evs = [];
  for (let i = 0; i < 400 && !evs.some((e) => e.t === 'act' && e.id === id); i++) evs.push(...b.tick(50));
  return evs.find((e) => e.t === 'act' && e.id === id);
};
const use = (b, me, cmd) => {
  assert.ok(readyUp(b, me));
  const r = b.command(me.id, { target: b.enemies.find((e) => e.alive)?.id, ...cmd }, 's1');
  assert.equal(r.ok, true, `${cmd.id} ${r.reason || ''}`);
  return runUntilAct(b, me.id);
};
const dmgOf = (act) => (act.results || []).filter((r) => r.dmg > 0).reduce((s, r) => s + r.dmg, 0);
const evOf = () => ({ lines: [], upd: [], results: [] });

// ───────────── 職業の 木 ─────────────
test('第85回 B の 職業: 超級職・伝説の 2だん（忍者から 枝分かれ）・ならび・うわさ・文字・武器', () => {
  assert.deepEqual(R85B_JOBS, NEW);
  assert.deepEqual(Object.keys(JOBS_R85B), NEW);
  const orders = [null, null, SUPER_ORDER, LEGEND_ORDER];
  for (const id of NEW) {
    const j = JOBS[id], [name, tier, req] = TREE[id];
    assert.equal(j.id, id);
    assert.equal(j.name, name);
    assert.equal(j.tier, tier);
    assert.deepEqual(j.req, req);
    assert.equal(j.reqSuper || 0, tier === 3 ? 1 : 0);
    assert.ok(orders[tier].includes(id) && ALL_JOBS.filter((x) => x === id).length === 1, id);
    assert.deepEqual(R85B_ORDERS[tier], [id]);
    for (const s of [j.name, j.desc, j.short]) textOk(s, id);
    assert.ok(!KANJI.test(j.kana), `${id} kana`);
    assert.ok(!SCARY.test(j.name + j.desc), id);
    assert.match(j.color, /^#[0-9a-f]{6}$/);
    assert.ok(!j.masc && j.body === undefined, '男の子も 女の子も なれる・おなじ 名前');
    assert.equal(jobLabel(id, { job: id, look: BOY }), name);
    assert.deepEqual(j.weapons, ['dagger', 'claw', 'boomerang', 'none'], '短剣・つめ・ブーメラン・素手');
    assert.ok(Object.values(VEHICLES).some((v) => v.jobs?.includes(id)), `${id} の 乗り物`);
    textOk(JOB_HINTS[id], id);
  }
  assert.deepEqual(R85B_ORDERS[0], []);
  assert.deepEqual(R85B_ORDERS[1], [], '上級職は 今の 忍者');
  assert.equal(jobReqText('enjutsushi'), '忍者Lv10');
  assert.equal(jobReqText('rekka'), '炎術士Lv10＋ほかの超級職1つLv10');
  // 忍者から 進める 超級職は 木の葉の忍びと 炎術士（どちらも 今の まま）
  assert.deepEqual(SUPER_ORDER.filter((x) => JOBS[x].req?.join() === 'ninja').sort(), ['enjutsushi', 'konoha']);
  const files = gameFiles();
  for (const f of ['jobs-r85b.js', 'abilities-r85b.js', 'hirameki-r85b.js', 'shared/battle-r85b.js', 'client/battle-r85b.js']) assert.ok(files.some((p) => p.endsWith(f)), f);
});

test('第85回 B の 職業: なれる じゅんばん（武闘家と 魔法使い → 忍者 → 炎術士 → 伝説は ほかの 超級職も 1つ）', () => {
  const c = newCharacter({ id: 'k', name: 'ケン', job: 'monk' });
  master(c, 'monk', 'mage');
  assert.equal(jobUnlocked(c, 'enjutsushi'), false, '忍者を きわめる');
  master(c, 'ninja');
  assert.equal(jobUnlocked(c, 'enjutsushi'), true);
  assert.equal(jobUnlocked(c, 'konoha'), true, '木の葉の忍びも そのまま');
  assert.equal(jobKnown(c, 'rekka'), false, '伝説は はじめ ひみつ');
  master(c, 'enjutsushi');
  assert.equal(jobKnown(c, 'rekka'), true);
  assert.equal(jobUnlocked(c, 'rekka'), false, 'ほかの 超級職も 1つ いる');
  master(c, 'konoha');
  assert.equal(jobUnlocked(c, 'rekka'), true);
  assert.equal(changeJob(c, 'rekka').ok, true);
  assert.ok(learnedAbilities(c).includes('rk_ryu'));
});

test('第85回 B の 職業: 能力の 合計（設計の 8.5・9.6）・段の はんい・伝説の 素早さは 今の いちばんを こえない', () => {
  const sum = (j) => Object.values(JOBS[j].mods).reduce((a, b) => a + b, 0);
  for (const j of NEW) {
    const [lo, hi] = SUM_RANGE[JOBS[j].tier];
    assert.ok(sum(j) >= lo - 1e-9 && sum(j) <= hi + 1e-9, `${j}: ${sum(j).toFixed(2)}`);
    assert.ok(Object.values(JOBS[j].perLv).reduce((a, b) => a + b, 0) <= 3 + 1e-9);
  }
  assert.deepEqual(NEW.map((j) => Math.round(sum(j) * 100) / 100), [8.5, 9.6]);
  const topAgi = Math.max(...LEGEND_ORDER.filter((j) => !NEW.includes(j)).map((j) => JOBS[j].mods.agi));
  assert.ok(JOBS.rekka.mods.agi <= topAgi);
  assert.ok(JOBS.rekka.mods.agi >= JOBS.enjutsushi.mods.agi);
});

// ───────────── 技 ─────────────
test('第85回 B の 技: 6こ（伝説は Lv1・3・5・7・8・10）・看板の 技・せつめい・文字・名前が かぶらない', () => {
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden) names.set(a.name, [...(names.get(a.name) || []), id]);
  const mine = new Set();
  for (const j of NEW) {
    const job = JOBS[j];
    assert.equal(job.learn.length, 6);
    assert.deepEqual(job.learn.map(([l]) => l), JOBS[j].tier === 3 ? [1, 3, 5, 7, 8, 10] : [1, 2, 3, 5, 7, 10]);
    const mps = job.learn.map(([, id]) => ABILITIES[id].mp);
    assert.ok(mps.slice(0, -1).every((m) => m < mps.at(-1)), `${j}: Lv10 の 技が いちばん MPを 使う`);
    const sig = `${j}_sig`;
    assert.equal(job.learn.at(-1)[1], sig);
    assert.equal(ABILITIES[sig].name, SIG_NAMES[j]);
    assert.equal(ABILITIES[sig].anim, sig);
    assert.equal(abilityRole(ABILITIES[sig]), 'dmg');
    assert.ok(job.learn.filter(([, id]) => abilityRole(ABILITIES[id]) === 'dmg').length >= 3, `${j}: 攻撃技 3つ いじょう`);
    for (const [, id] of job.learn) {
      const a = ABILITIES[id];
      mine.add(id);
      assert.equal(a.job, j);
      assert.equal(a.kind, 'skill');
      assert.ok(a.desc && a.cast && a.anim && a.kana, id);
      assert.match(a.desc, SCOPE[a.target], `${id}: ${a.desc}`);
      for (const s of [a.name, a.desc, a.cast]) textOk(s, id);
      assert.ok(!KANJI.test(a.kana), `${id} kana: ${a.kana}`);
      assert.ok(!SCARY.test(a.name + a.desc + a.cast), id);
      assert.equal(names.get(a.name).length, 1, `${a.name} が かぶる`);
      for (const p of partsOf(a.effect)) if (p.type === 'buff' && p.mult) assert.ok(p.mult <= (JOBS[j].tier === 3 ? 1.4 : 1.3) + 1e-9, a.name);
    }
  }
  assert.deepEqual([...mine].sort(), Object.keys(R85B_ABILITIES).sort());
  // 設計の 技の 名前（10-4 の 表。かえた 名前は docs/plan-r85-jobs-b.md）
  assert.deepEqual(JOBS.enjutsushi.learn.map(([, id]) => ABILITIES[id].name), ['火竜をよぶ', '花火玉', '忍びのかくれ身', '炎のうで', '手裏剣の雨', '火竜・二ひき同時']);
  assert.deepEqual(JOBS.rekka.learn.map(([, id]) => ABILITIES[id].name), ['火竜をよぶ・八竜', '姫を守る忍び', '火竜のきば', '花火・大れんぱつ', '火影の目ざめ', '八竜・同時しょうかん']);
  // 火竜の 表: 8ひき（はじめの 4ひきは 炎術士）・名前は かな・それぞれ ちがう 色・MP・せつめい
  assert.deepEqual(RYU_ORDER, ['nadare', 'saiha', 'homura', 'setsuna', 'madoka', 'rui', 'kokuu', 'resshin']);
  assert.deepEqual(RYU_SET.four, ['nadare', 'saiha', 'homura', 'setsuna']);
  assert.deepEqual(RYU_SET.eight, RYU_ORDER);
  assert.deepEqual(ryuSetOf('ej_ryu'), RYU_SET.four);
  assert.deepEqual(ryuSetOf('enjutsushi_sig'), RYU_SET.four);
  assert.deepEqual(ryuSetOf('rk_ryu'), RYU_SET.eight);
  assert.equal(new Set(RYU_ORDER.map((k) => RYU[k].color)).size, 8, '8ひきの 色が ちがう');
  for (const k of RYU_ORDER) {
    const r = RYU[k];
    assert.ok(!KANJI.test(r.name), r.name);
    for (const s of [r.name, r.short, r.line, r.tag]) textOk(s, k);
    assert.ok(r.mp >= ABILITIES.ej_ryu.mp && r.mp < ABILITIES.rekka_sig.mp, `${k} の MP`);
    assert.equal(!!r.legend, RYU_ORDER.indexOf(k) >= 4);
    assert.ok(R85B_DRAGONS.includes(r.anim) && DRAGON_LOOK[r.anim]?.color === r.color, `${k} の えんしゅつ`);
  }
  assert.equal(ABILITIES.ej_ryu.mp, Math.min(...RYU_SET.four.map((k) => RYU[k].mp)), '技の MP は いちばん 安い 火竜');
  // 1ぴき 1ぴきは 専門の 職業の 同じ 役の 技より 少し 弱い（炎柱の のぼり炎天 2.9・九の型 4.0）
  assert.ok(RYU.saiha.effect.mult < ABILITIES.eb_noboru.effect.mult);
  assert.ok(RYU.kokuu.effect.mult * 1.15 < ABILITIES.eb_rengoku.effect.mult);
  // 姫を守る忍び・火影の目ざめ（設計の「火影の血」から かえた: こわい ことばを さける）
  assert.equal(ABILITIES.rk_hime.target, 'ally');
});

test('第85回 B の 技は ぜんぶ たたかいで 使えて、攻撃技は ダメージ・オートでも こわれない', () => {
  let n = 0;
  for (const j of NEW) {
    for (const [, id] of JOBS[j].learn) {
      const { b, me } = setup(j, { seed: ++n, enemies: ['rockman', 'rockman'], mates: ['warrior'] });
      const cmd = { type: 'ability', id, ryu: 'saiha' };
      if (ABILITIES[id].target === 'ally') cmd.target = b.allies[1].id;
      const act = use(b, me, cmd);
      assert.ok(act && !act.lines.some((l) => l.includes('MPが足りない') || l.includes('効果がなかった')), `${id}: ${act?.lines}`);
      for (const l of act.lines) textOk(l, id);
      if (abilityRole(ABILITIES[id]) === 'dmg') assert.ok(dmgOf(act) > 0 || act.results?.some((r) => r.miss), `${id} の ダメージ: ${act.lines}`);
    }
    for (const enemies of [['rockman', 'rockman', 'rockman'], ['rockman']]) {
      const s = setup(j, { seed: 7, enemies, mates: ['warrior'] });
      s.me.abilities = learnedAbilities(s.c);
      let used = 0;
      for (let i = 0; i < 12; i++) {
        const cmd = decideAlly(s.b, s.me);
        assert.ok(cmd?.type, `${j}: ${JSON.stringify(cmd)}`);
        if (cmd.type === 'ability') used++;
      }
      assert.ok(used > 0, `${j}: オートでも 技を 使う`);
    }
  }
});

// ───────────── 火竜をよぶ ─────────────
test('第85回 B の 火竜をよぶ: 8ひき ぜんぶ よべる・えらんだ 火竜の 技が その場で 出る（えんしゅつも 火竜ごと）・MP は 火竜ごと', () => {
  const { b, me } = setup('rekka', { enemies: ['rockman', 'rockman', 'rockman'], mates: ['warrior'] });
  const mate = b.allies[1];
  mate.alive = false;
  mate.hp = 0;
  const seen = new Set();
  for (const k of RYU_ORDER) {
    const mp0 = me.mp;
    const tid = k === 'resshin' ? mate.id : b.enemies[1].id;
    const act = use(b, me, { type: 'ability', id: 'rk_ryu', ryu: k, target: tid });
    assert.deepEqual(act.r85bRyu, [k]);
    assert.equal(act.fx.anim, RYU[k].anim);
    assert.equal(act.fx.ryu, k);
    assert.ok(act.lines.includes(RYU[k].line), k);
    assert.equal(mp0 - me.mp, ryuMp(me.penChar, 'rk_ryu', k), `${k} の MP`);
    seen.add(act.fx.anim);
    const t = RYU[k].target;
    if (t === 'enemy') {
      assert.deepEqual(act.fx.targets, [b.enemies[1].id], 'えらんだ 敵');
      assert.ok(dmgOf(act) > 0);
    }
    if (t === 'group' || t === 'enemies') assert.equal(act.fx.targets.length, 3);
    if (k === 'madoka') assert.ok(me.r85bMadoka && me.r85bMadoka.cut > 0);
    if (k === 'rui') assert.ok(me.r85bRui && me.r85bRui.add > 0);
    if (k === 'resshin') assert.ok(mate.alive && mate.hp > 0, 'たおれた 仲間が 生き返る');
  }
  assert.equal(seen.size, 8);
  // 炎術士の 4ひきの 技では 伝説の 火竜は よべない（えらんでも 4ひきの どれかに なる）
  const s = setup('enjutsushi', { enemies: ['rockman', 'rockman'] });
  const act = use(s.b, s.me, { type: 'ability', id: 'ej_ryu', ryu: 'kokuu' });
  assert.ok(RYU_SET.four.includes(act.r85bRyu[0]));
  // 伝説の 八竜は 少し 強い（同じ さいは）
  const hit = (job, id) => {
    let sum = 0;
    for (let seed = 1; seed <= 6; seed++) {
      const x = setup(job, { seed, lv: 50 });
      x.me.atk = 300; x.me.buffs = {};
      sum += dmgOf(use(x.b, x.me, { type: 'ability', id, ryu: 'saiha' }));
    }
    return sum;
  };
  assert.ok(hit('rekka', 'rk_ryu') > hit('rekka', 'ej_ryu'));
});

test('第85回 B の 火竜をよぶ: あいて（なし ＝ ボス・HP の 多い 敵／たおれた 仲間の 先頭）・MP が たりない 火竜は 来ない（技の MP は もどる）・メニュー', () => {
  const { b, me } = setup('rekka', { enemies: ['rockman', 'rockman'], mates: ['warrior', 'priest'] });
  b.enemies[0].hp = 100;
  let act = use(b, me, { type: 'ability', id: 'rk_ryu', ryu: 'saiha', target: undefined });
  assert.deepEqual(act.fx.targets, [b.enemies[1].id], 'HP の 多い 敵');
  // たおれた 仲間が いない れっしん: 仲間全員を 少し 回復
  for (const a of b.allies) a.hp = Math.floor(a.maxHp / 2);
  act = use(b, me, { type: 'ability', id: 'rk_ryu', ryu: 'resshin' });
  assert.ok(act.results.filter((r) => r.heal > 0).length >= 2, `${act.lines}`);
  b.allies[2].alive = false; b.allies[2].hp = 0;
  act = use(b, me, { type: 'ability', id: 'rk_ryu', ryu: 'resshin' });
  assert.ok(b.allies[2].alive, 'たおれた 仲間の 先頭');
  // MP が たりない（こくう 12。技の MP 7 は もどる）
  readyUp(b, me);
  me.mp = 9;
  assert.equal(b.command(me.id, { type: 'ability', id: 'rk_ryu', ryu: 'kokuu', target: b.enemies[0].id }, 's1').ok, true);
  act = runUntilAct(b, me.id);
  assert.equal(me.mp, 9);
  assert.ok(act.lines.some((l) => l.includes('来てくれなかった')), `${act.lines}`);
  // メニュー（client/battle-r85b.js の ryuItems）: 4ひき／8ひき・MP・たりない 火竜は えらべない
  const p = pub(me);
  p.mp = 10;
  const four = ryuItems(p, 'ej_ryu'), eight = ryuItems(p, 'rk_ryu');
  assert.deepEqual(four.map((it) => it.value), RYU_SET.four);
  assert.deepEqual(eight.map((it) => it.value), RYU_ORDER);
  assert.deepEqual(eight.map((it) => it.disabled), RYU_ORDER.map((k) => RYU[k].mp > 10));
  for (const it of eight) assert.equal(it.right, `MP${it.mp}`);
  assert.ok(ryuItems(p, 'enjutsushi_sig').every((it) => !it.disabled && it.right === ''), '二ひき同時は 技の MP だけ');
  // ほかの 職業に 転職した あと: 覚えた 技の 火竜を よべる（八竜を 覚えて いれば 8ひき）
  const o = setup('konoha', { enemies: ['rockman'] });
  o.me.abilities.push('rk_ryu');
  act = use(o.b, o.me, { type: 'ability', id: 'rk_ryu', ryu: 'kokuu' });
  assert.deepEqual(act.r85bRyu, ['kokuu']);
  assert.ok(dmgOf(act) > 0);
});

test('第85回 B の 火竜・二ひき同時: えらんだ 火竜 ＋ 4ひきから もう 1ぴき（ちがう 火竜・運）・MP は 技の 分だけ', () => {
  const seconds = new Set();
  for (let seed = 1; seed <= 24; seed++) {
    const { b, me } = setup('enjutsushi', { seed, enemies: ['rockman', 'rockman'] });
    const mp0 = me.mp;
    const act = use(b, me, { type: 'ability', id: 'enjutsushi_sig', ryu: 'saiha', target: b.enemies[0].id });
    assert.equal(act.r85bRyu.length, 2);
    assert.equal(act.r85bRyu[0], 'saiha');
    assert.notEqual(act.r85bRyu[1], 'saiha');
    assert.ok(RYU_SET.four.includes(act.r85bRyu[1]));
    assert.equal(act.fx.anim, RYU.saiha.anim, '1ぴきめの えんしゅつ');
    assert.equal(act.r85bTwin?.anim, RYU[act.r85bRyu[1]].anim, '2ひきめの えんしゅつ');
    assert.equal(mp0 - me.mp, mpCost(me.penChar, 'enjutsushi_sig'));
    seconds.add(act.r85bRyu[1]);
  }
  assert.equal(seconds.size, 3, 'もう 1ぴきは 運');
});

test('第85回 B の 晴れ: この 系統の 炎の 技は ×1.3（味方の 晴れ・敵の 晴れ どちらも。今の 晴れの ボーナスと 足さない）・ほかの 職業の 炎は 今の まま', () => {
  const avg = (job, id, sun, extra = {}) => {
    let sum = 0;
    for (let seed = 1; seed <= 8; seed++) {
      const { b, me } = setup(job, { seed, lv: 50 });
      me.crit = -1;
      if (sun) setWeather(b, 'sun', 30, sun);
      sum += dmgOf(use(b, me, { type: 'ability', id, ...extra }));
    }
    return sum;
  };
  const base = avg('rekka', 'rk_kiba', null);
  for (const side of ['ally', 'enemy']) {
    const r = avg('rekka', 'rk_kiba', side) / base;
    assert.ok(Math.abs(r - WEATHER_UP) < 0.04, `${side} の 晴れ: ${r.toFixed(3)}`);
  }
  const ryu = avg('rekka', 'rk_ryu', 'ally', { ryu: 'saiha' }) / avg('rekka', 'rk_ryu', null, { ryu: 'saiha' });
  assert.ok(Math.abs(ryu - WEATHER_UP) < 0.04, `火竜: ${ryu.toFixed(3)}`);
  // 炎柱の 炎は 今の まま（敵の 晴れでは 弱い）
  const eb = avg('enbashira', 'eb_shiranui', 'enemy') / avg('enbashira', 'eb_shiranui', null);
  assert.ok(eb < 0.8, `炎柱: ${eb.toFixed(3)}`);
  assert.ok(R85B_FIRE.has('rk_kiba') && R85B_FIRE.has('hi_ryuken') && !R85B_FIRE.has('eb_shiranui'));
});

test('第85回 B の まどか・るい: 受ける ダメージが へる（作戦と 重ねても 下限）・よけやすい（今の よけと 合わせて 上限・前ぶれの 大技は よけられない）', () => {
  const { b, me } = setup('rekka', { mates: ['hoshin_gunshi', 'hiryu_master'] });
  const [, gu, ra] = b.allies;
  const foe = b.enemies[0];
  const hurt = (t, raw) => {
    const ev = evOf();
    const hp = t.hp = t.maxHp = 99999;
    b.damage(foe, t, raw, ev, {});
    return hp - t.hp;
  };
  assert.equal(hurt(me, 1000), 1000);
  me.r85bMadoka = { cut: 0.25, left: 3 };
  assert.equal(hurt(me, 1000), 750);
  // 軍師の 守りの 作戦（ほう神計画で 2倍）と 重ねても 0.45倍まで（身を 守って いれば 0.65倍まで）
  b.r83aPlan = { side: 'ally', by: gu.id, kind: 'mamori', pct: 0.25, boost: 3, boostBy: gu.id };
  assert.equal(hurt(me, 1000), Math.round(1000 * CUT_FLOOR.normal));
  me.defending = true;
  assert.ok(hurt(me, 1000) >= Math.round(1000 * CUT_FLOOR.defending * 0.5) - 1);
  me.defending = false;
  b.r83aPlan = null;
  // 行動の たびに へって 消える
  me.r85bMadoka.left = 1;
  use(b, me, { type: 'ability', id: 'rk_kiba' });
  assert.ok(!me.r85bMadoka, 'けっかいが 消えた');
  // るい: よけ ＋0.15。らんまの 水の すがた・敵前だい逃亡・強化の よけと 合わせても EVA_TOTAL まで
  ra.r85bRui = { add: 0.15, left: 3 };
  ra.buffs = {};
  ra.r84bForm = 'oyu';
  assert.equal(r85bEva(b, foe, ra), 0.15);
  ra.r84bForm = 'mizu';
  ra.r84bDodge = { add: 0.2 };
  ra.buffs.eva = { add: 0.3, lv: 1, left: 3 };
  const v = r85bEva(b, foe, ra);
  assert.ok(v >= 0 && v <= 0.15 && v < 0.15, `上限で 足りない ぶんだけ: ${v}`);
  ra.buffs.eva = { add: 0.6, lv: 2, left: 3 };
  assert.equal(r85bEva(b, foe, ra), 0);
  assert.equal(r85bEva(b, me, ra), 0, '仲間からは よけない');
  ra.buffs = {}; delete ra.r84bDodge; ra.r84bForm = 'oyu';
  b.cur = { big: true };
  assert.equal(r85bEva(b, foe, ra), 0, '前ぶれの 大技は よけられない');
  b.cur = null;
  assert.ok(EVA_TOTAL <= 0.6);
});

test('第85回 B の ほむら・せつな・姫を守る忍び: 番が おくれる（ボスは 効きにくい）・目つぶし・かばう ＋ 守り', () => {
  // ほむら: 同じ 種類の 敵の 番が おくれる。ボスは 今の きまりで 効きにくい（atbSet の chance 半分・下がり方も 半分）
  let slowed = 0, bossSlowed = 0;
  for (let seed = 1; seed <= 20; seed++) {
    const { b, me } = setup('enjutsushi', { seed, enemies: ['rockman', 'rockman'] });
    for (const e of b.enemies) e.atb = 90;
    const act = use(b, me, { type: 'ability', id: 'ej_ryu', ryu: 'homura', target: b.enemies[0].id });
    slowed += act.lines.filter((l) => l.includes('うごきがおそくなった')).length;
    const s = setup('enjutsushi', { seed, enemies: ['rockman'] });
    s.b.enemies[0].boss = true;
    const a2 = use(s.b, s.me, { type: 'ability', id: 'ej_ryu', ryu: 'homura', target: s.b.enemies[0].id });
    bossSlowed += a2.lines.filter((l) => l.includes('うごきがおそくなった')).length;
  }
  assert.ok(slowed >= 18, `ざこ: ${slowed}/40`);
  assert.ok(bossSlowed < slowed / 2 + 2, `ボス: ${bossSlowed}/20`);
  // せつな: 敵全体に ときどき 目つぶし
  let blind = 0;
  for (let seed = 1; seed <= 10; seed++) {
    const { b, me } = setup('enjutsushi', { seed, enemies: ['goblin', 'goblin', 'goblin'] });
    use(b, me, { type: 'ability', id: 'ej_ryu', ryu: 'setsuna' });
    blind += b.enemies.filter((e) => e.status.blind).length;
  }
  assert.ok(blind > 0 && blind < 30, `目つぶし ${blind}/30`);
  // 姫を守る忍び: 仲間 1人を かばう ＋ 自分の 守備力
  const { b, me } = setup('rekka', { mates: ['priest'], act: 'attack' });
  const hime = b.allies[1];
  const act = use(b, me, { type: 'ability', id: 'rk_hime', target: hime.id });
  assert.equal(me.cover?.target, hime.id);
  assert.ok(me.buffs.def?.mult > 1);
  assert.deepEqual(act.r85bHime, { by: me.id, to: hime.id });
  assert.equal(b.coverRedirect(hime), me, 'かばう');
});

test('第85回 B の オート: たおれた 仲間 ＝ れっしん・前ぶれ ＝ まどか・ボス ＝ こくう／さいは・敵が 多い ＝ なだれ・強い 敵 1体 ＝ ほむら・この 系統の 技だけ', () => {
  const plan = (s) => {
    const foes = s.b.aliveEnemies();
    const mine = s.me.abilities.map((id) => ({ id, a: ABILITIES[id] }));
    return r85bPlan(s.b, s.me, foes, mine, s.b.aliveAllies(), fightWeight(s.b));
  };
  const save = { ...R85B_AI };
  for (const k of Object.keys(R85B_AI)) R85B_AI[k] = 1;
  try {
    // たおれた 仲間
    let s = setup('rekka', { mates: ['warrior'] });
    s.me.abilities = learnedAbilities(s.c);
    s.b.allies[1].alive = false; s.b.allies[1].hp = 0;
    assert.deepEqual(plan(s), { type: 'ability', id: 'rk_ryu', ryu: 'resshin', target: s.b.allies[1].id });
    // 前ぶれ
    s = setup('rekka', { mates: ['warrior'] });
    s.me.abilities = learnedAbilities(s.c);
    s.b.enemies[0].telegraph = { name: 'x' };
    assert.equal(plan(s).ryu, 'madoka');
    // ボス（こくう。炎術士の 4ひきだけなら さいは）。けっかい・目ざめの かけ直しは この テストでは 止める
    R85B_AI.guard = 0;
    R85B_AI.mezame = 0;
    s = setup('rekka', { mates: ['warrior'] });
    s.me.abilities = ['rk_ryu'];
    s.b.enemies[0].boss = true; s.b.boss = true;
    assert.equal(plan(s).ryu, 'kokuu');
    s.me.abilities = ['ej_ryu'];
    assert.equal(plan(s).ryu, 'saiha');
    // 敵が 多い
    s = setup('enjutsushi', { enemies: ['rockman', 'rockman', 'rockman'] });
    s.me.abilities = ['ej_ryu'];
    const p = plan(s);
    assert.ok(['nadare', 'setsuna'].includes(p.ryu), p.ryu);
    R85B_AI.blind = 0;
    assert.equal(plan(s).ryu, 'nadare');
    // 強い 敵が 1体
    s = setup('enjutsushi', { enemies: ['rockman'] });
    s.me.abilities = ['ej_ryu'];
    if (fightWeight(s.b).hard) assert.equal(plan(s).ryu, 'homura');
    // この 系統の 技を もたない 人は 何も しない（運も 使わない）
    s = setup('konoha', { enemies: ['rockman', 'rockman', 'rockman'] });
    s.me.abilities = learnedAbilities(s.c);
    const before = s.b.rng.int(0, 1e9);
    const s2 = setup('konoha', { enemies: ['rockman', 'rockman', 'rockman'] });
    s2.me.abilities = learnedAbilities(s2.c);
    assert.equal(plan(s2), null);
    assert.equal(s2.b.rng.int(0, 1e9), before, '運を 使わない');
  } finally {
    Object.assign(R85B_AI, save);
  }
});

test('第85回 B: キャラにも セーブにも 項目を 足さない（戦いの 中だけ）', () => {
  const { b, c, me } = setup('rekka', { mates: ['warrior'] });
  const keys = Object.keys(c).sort();
  use(b, me, { type: 'ability', id: 'rk_ryu', ryu: 'madoka' });
  use(b, me, { type: 'ability', id: 'rk_ryu', ryu: 'rui' });
  use(b, me, { type: 'ability', id: 'rk_hime', target: b.allies[1].id });
  assert.deepEqual(Object.keys(c).sort(), keys);
  assert.ok(!JSON.stringify(c).includes('r85b'));
  const p = pub(me);
  assert.equal(typeof p.r85bMadoka, 'number');
  assert.equal(typeof p.r85bRui, 'number');
  assert.deepEqual(Object.keys(pub(b.enemies[0])).filter((k) => k.startsWith('r85b')), []);
});

// ───────────── ひらめき・タグ・試練・乗り物 ─────────────
test('第85回 B の ひらめき技: 2つの 職業に 1つずつ・データ・文字・使いこむと ひらめく', () => {
  const ids = Object.keys(HIRA_R85B_ABILITIES);
  assert.deepEqual(Object.keys(HIRAMEKI_R85B).sort(), [...ids].sort());
  assert.deepEqual(NEW.map((j) => ids.filter((id) => HIRA_R85B_ABILITIES[id].job === j).length), [1, 1]);
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden) names.set(a.name, [...(names.get(a.name) || []), id]);
  for (const id of ids) {
    const a = ABILITIES[id];
    assert.ok(a && a.hirameki && HIRAMEKI[id] && id.startsWith('hi_'), id);
    assert.match(a.desc, SCOPE[a.target], `${id}: ${a.desc}`);
    for (const s of [a.name, a.desc, a.cast]) textOk(s, id);
    assert.ok(!KANJI.test(a.kana), `${id} kana: ${a.kana}`);
    assert.ok(R85B_ANIMS.has(a.anim), `${id}: ${a.anim}`);
    assert.equal(names.get(a.name).length, 1, a.name);
    for (const [k, cnt] of Object.entries(HIRAMEKI[id].from)) assert.ok(cnt > 0 && R85B_ABILITIES[k], `${id}: ${k}`);
    const c = newCharacter({ id: 'x', name: 'x', job: 'monk' });
    c.job = a.job;
    assert.equal(hiraAllowed(c, id), true);
    c.job = 'warrior';
    assert.equal(hiraAllowed(c, id), false);
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

test('第85回 B の 職業: タグで 合体技（3つ いじょう）・職業の試練・転職の ひとこと・火竜の 乗り物', () => {
  for (const j of NEW) {
    assert.ok(JOBS[j].tags.length >= 3 && JOBS[j].tags.length <= 4, j);
    assert.ok(JOBS[j].tags.includes('fire') && JOBS[j].tags.includes('shinobi'));
    const n = Object.values(DUAL_TECHS).filter((t) => t.need.some((list) => !ANY_GROUPS.has(list) && groupJobs(list).has(j))).length;
    assert.ok(n >= 3, `${JOBS[j].name} の 合体技 ${n}こ`);
    const s = JOB_SAY[j];
    textOk(s, j);
    assert.ok(s.length <= 24 && s.startsWith('「') && s.endsWith('」'), s);
    assert.ok(jobDoneText('ナナ', JOBS[j].name, [], j).endsWith(s));
    assert.ok(!(j in JOB_SAY_MASC));
    assert.ok(trialJob(j));
    const adj = PHANTOM_ADJ[j];
    assert.ok(Array.isArray(adj) && adj.length === 3 && adj.every((v) => v >= 0.3 && v <= 4), `${j}: ${adj}`);
    assert.ok(phantomSkills(j).length >= 3, `${j}: まぼろしの 技`);
    for (const id of phantomSkills(j)) assert.ok(!/^r85b/.test(ABILITIES[id].effect.type), `${id}: まぼろしは 火竜・かばうを 使わない`);
    textOk(TRIAL_WORDS[j], j);
    assert.ok(TRIAL_WORDS[j].length <= 32);
    textOk(masterName(j), j);
  }
  // 合体技の 相手の 案: 炎柱（炎）・木の葉の忍び（忍び）・忍者（忍び・炎）
  assert.ok(JOBS.enbashira.tags.includes('fire') && JOBS.konoha.tags.includes('shinobi') && JOBS.ninja.tags.includes('shinobi'));
  // 乗り物: 火竜（2つの 職業）。長い 体が うねる（コマで うねりが うごく）
  const v = VEHICLES.fire_dragon;
  // 第86回 A班: 幻の職業 竜神の剣士も 乗れる（もとの 職業の 乗り物。ほかの 幻の職業と おなじ）
  assert.deepEqual(v.jobs.filter((j) => JOBS[j].tier < 4), NEW);
  textOk(v.name, 'fire_dragon');
  textOk(v.desc, 'fire_dragon');
  assert.ok(v.price > 0 && v.price <= 10000);
  for (const view of VIEWS) {
    const frames = new Set();
    for (let f = 0; f < vehicleFrames('fire_dragon'); f++) {
      const lit = (p) => (p ? p.px.filter(Boolean).length : 0);
      assert.ok(lit(paintVehicle('fire_dragon', view, f, 'back')) + lit(paintVehicle('fire_dragon', view, f, 'front')) > 60, `${view} ${f}`);
      assert.ok(riderSpot('fire_dragon', view, f));
      frames.add([...(paintVehicle('fire_dragon', view, f, 'front')?.px || [])].join());
    }
    assert.ok(frames.size >= 2, `${view}: うねる`);
  }
  // よこむきは 横に 長い（馬の ように 首を 立てない）
  const side = paintVehicle('fire_dragon', 'side', 0, 'front');
  let minX = 99, maxX = 0, minY = 99, maxY = 0;
  for (let y = 0; y < side.h; y++) for (let x = 0; x < side.w; x++) if (side.px[y * side.w + x]) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  assert.ok(maxX - minX > (maxY - minY) * 1.8, `横長: ${maxX - minX}×${maxY - minY}`);
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

test('第85回 B の 絵: 2つの 職業（男女・4方向・はみ出さない・ちがう え・忍者と ちがう）・右うでの こて・炎の オーラ・古い え', () => {
  assert.deepEqual(LOOK_JOBS, NEW);
  for (const j of NEW) assert.ok(R85B_OUTFIT[j] && R85B_BODY[j] && R85B_OLD_LOOK[j], j);
  for (const job of NEW) {
    for (const body of [0, 1]) {
      for (const dir of DIRS) {
        for (const res of [4, 8]) {
          const img = paintHero({ body, style: 'short', hcol: 'black' }, job, undefined, dir, 1, res);
          const r = inspect(img);
          assert.ok(r.n > img.w * img.h * 0.12, `${job} ${body} ${dir} ${res} が かけている`);
          assert.ok(!r.edge, `${job} ${body} ${dir} ${res} が ふちに さわる`);
        }
        for (const other of [...NEW.filter((x) => x !== job), 'ninja', 'konoha']) {
          assert.notEqual(key(paintHero({ body, style: 'short' }, job, undefined, dir, 0, 4)), key(paintHero({ body, style: 'short' }, other, undefined, dir, 0, 4)), `${job} は ${other} と ちがう え`);
        }
      }
    }
    const O = outfitOf({ cloth: '#3f7fd0', skin: 0 }, job, 'cloth', false);
    assert.equal(O.kind, 'gi');
    assert.ok(jobBody(job).kote85, '右うでの こて');
    for (const body of [0, 1]) {
      const o = lookToOpts({ body }, job, ',cloth,,');
      assert.ok(o.outfit, job);
      assert.ok(paintHuman('down', 0, o), job);
    }
  }
  assert.equal(jobBody('rekka').kote85, 'ryu', '竜の 印');
  assert.equal(jobBody('rekka').aura, 'honoo85');
  assert.ok(AURA85B.honoo85);
  assert.ok(!jobBody('enjutsushi').aura);
  // こての ある え と ない え は ちがう（右うで）
  const noKote = { ...R85B_BODY.enjutsushi };
  delete R85B_BODY.enjutsushi.kote85;
  const a = key(paintHero({ body: 0, style: 'short' }, 'enjutsushi', undefined, 'down', 0, 8));
  Object.assign(R85B_BODY.enjutsushi, noKote);
  assert.notEqual(a, key(paintHero({ body: 0, style: 'short' }, 'enjutsushi', undefined, 'down', 0, 8)));
});

// ───────────── えんしゅつ・札 ─────────────
test('第85回 B の えんしゅつ: 8ひきの 火竜（色と 形が ちがう）・看板の 技・音・こわれない・札', () => {
  const used = new Set([...Object.keys(R85B_ABILITIES), ...Object.keys(HIRA_R85B_ABILITIES)].map((id) => ABILITIES[id].anim));
  for (const k of RYU_ORDER) used.add(RYU[k].anim);
  for (const anim of R85B_ANIMS) assert.ok(used.has(anim), `${anim} は どれかの 技で 使う`);
  assert.deepEqual(R85B_SIGS, NEW.map((j) => `${j}_sig`));
  assert.deepEqual(Object.keys(R85B_SFX).sort(), [...R85B_ANIMS].sort());
  assert.deepEqual(Object.keys(R85B_HIT).sort(), [...R85B_ANIMS].sort());
  const audio = readFileSync(new URL('../public/js/client/audio.js', import.meta.url), 'utf8');
  for (const [anim, s] of Object.entries(R85B_SFX)) assert.ok(audio.includes(`case '${s}':`) || typeof SFX_R26[s] === 'function' || typeof SFX_R33[s] === 'function', `${anim} の 音 ${s}`);
  for (const a of PARTY_ANIMS_R85B) assert.ok(PARTY_ANIMS.has(a), a);
  const battle = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.match(battle, /Object\.assign\(ANIM_SFX, R85B_SFX\)/);
  assert.match(battle, /Object\.assign\(HIT_DELAY, R85B_HIT\)/);
  assert.match(battle, /ab\.effect\.type === 'r85bRyu'\) return ryuMenu/);
  assert.match(battle, /r85bPresent\(this, ev, hitDelay\)/);
  const src = readFileSync(new URL('../public/js/client/render/battlefx.js', import.meta.url), 'utf8');
  assert.match(src, /playR85bFx\(this, anim/);
  // 8ひきの 竜の 形と 色は みんな ちがう
  const looks = R85B_DRAGONS.map((a) => JSON.stringify(DRAGON_LOOK[a]));
  assert.equal(new Set(looks).size, 8);
  assert.equal(new Set(R85B_DRAGONS.map((a) => DRAGON_LOOK[a].color)).size, 8);
  for (const anim of R85B_ANIMS) {
    for (const targets of [[{ x: 128, y: 66 }], [{ x: 60, y: 70 }, { x: 128, y: 82 }, { x: 196, y: 70 }]]) {
      for (const el of [null, 'fire']) {
        const fx = new Effects();
        assert.equal(playR85bFx(fx, anim, targets, el, { crit: el === 'fire' }, BW, BH), true, anim);
        fx.play(anim, targets, el, {});
        assert.ok(fx.parts.length > 0, anim);
        // 竜を かく（canvas の かわりに 何も しない もの。こわれない）
        const noop = new Proxy({}, { get: () => () => {}, set: () => true });
        let t = 0;
        while (fx.parts.length && t < 4000) {
          fx.update(16);
          for (const p of fx.parts) if (p.kind === 'r85bDragon' && !(p.delay > 0)) R85B_FINE.r85bDragon(noop, p, Math.min(1, p.age / p.life));
          t += 16;
        }
        assert.ok(t <= 2200, `${anim}: ${t}ms`);
      }
    }
  }
  assert.equal(playR85bFx(new Effects(), 'fire1', [{ x: 1, y: 1 }]), false);
  assert.equal(playR85bFx(new Effects(), 'rekka_sig', []), false);
  // 仲間の まどの 札（家族 みんなに 見える）
  assert.deepEqual(r85bMarks({ alive: true, r85bMadoka: 3 }).map((m) => m.text), ['けっかい3']);
  assert.deepEqual(r85bMarks({ alive: true, r85bMadoka: 2, r85bRui: 1 }).map((m) => m.text), ['けっかい2', 'かげろう1']);
  assert.deepEqual(r85bMarks({ alive: true, r85bMadoka: 0, r85bRui: 0 }), []);
  assert.deepEqual(r85bMarks({ alive: false, r85bMadoka: 3 }), []);
  for (const m of r85bMarks({ alive: true, r85bMadoka: 2, r85bRui: 1 })) textOk(m.text, 'mark');
});

// ───────────── 新しい 系統どうしが 同じ パーティー（第83回 A班 軍師・第84回 B班 らんま・第85回 B班） ─────────────
test('第85回 B の まぜた パーティー: 軍師の 守りの 作戦 ＋ まどか（下限）・らんまの 水の すがた ＋ るい（よけの 上限）・晴れの すがたと 炎', () => {
  const mk = (id, job) => {
    const c = newCharacter({ id, name: id, job: 'monk' });
    gainExp(c, expForLevel(60));
    masterChain(c, job);
    master(c, job);
    c.job = job;
    c.equip.weapon = null;
    fullHeal(c);
    return c;
  };
  const chars = [mk('rk', 'rekka'), mk('gu', 'hoshin_gunshi'), mk('ra', 'hiryu_master')];
  const b = new Battle({ rng: makeRng(85), allies: chars.map((char) => ({ char, controller: 's1' })), enemies: ['rockman', 'rockman'], canFlee: true });
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 50000; }
  for (const a of b.allies) { a.mp = a.maxMp = 999; a.maxHp = a.hp = 3000; }
  const [rk, gu, ra] = b.allies;
  // 軍師の 守りの 作戦 → まどか: 2つ 重ねても 下限
  use(b, gu, { type: 'ability', id: 'sd_sakusen', sakusen: 'mamori' });
  assert.equal(b.r83aPlan?.kind, 'mamori');
  use(b, rk, { type: 'ability', id: 'rk_ryu', ryu: 'madoka' });
  assert.ok(b.allies.every((x) => x.r85bMadoka));
  b.r83aPlan.boost = 3;
  const foe = b.enemies[0];
  for (const t of b.allies) {
    const ev = evOf();
    t.hp = t.maxHp = 99999;
    b.damage(foe, t, 1000, ev, {});
    // らんまの お湯の 守り（−15%）は 下げすぎ ふせぎの あとに かかる（第84回 B班の きまり）
    const oyu = t === ra ? 1 - 0.25 * 0.6 : 1;
    assert.ok(99999 - t.hp >= Math.round(1000 * CUT_FLOOR.normal) * oyu - 1, `${t.name}: ${99999 - t.hp}`);
    assert.ok(99999 - t.hp <= Math.round(1000 * CUT_FLOOR.normal) + 1, `${t.name}: まどかと 守りの 作戦が 効いて いる`);
    t.hp = t.maxHp = 3000;
  }
  // らんまの 水の すがた ＋ 敵前だい逃亡 ＋ るい: よけは 上限まで
  use(b, ra, { type: 'ability', id: 'ms_mizu', form: 'mizu' });
  use(b, ra, { type: 'ability', id: 'hr_toubou' });
  use(b, rk, { type: 'ability', id: 'rk_ryu', ryu: 'rui' });
  assert.ok(ra.r85bRui && ra.r84bDodge);
  ra.buffs.eva = { add: 0.4, lv: 1, left: 3 };
  assert.ok(r85bEva(b, foe, ra) === 0, 'もう 上限');
  ra.buffs = {};
  assert.ok(r85bEva(b, foe, ra) > 0 && r85bEva(b, foe, ra) <= 0.15);
  // 晴れ: らんまは お湯の すがたに・烈火の 炎は ×1.3
  setWeather(b, 'sun', 20, 'ally');
  use(b, ra, { type: 'ability', id: 'hr_kidan', target: foe.id });
  assert.equal(ra.r84bForm, 'oyu');
  const act = use(b, rk, { type: 'ability', id: 'rk_kiba', target: foe.id });
  assert.ok(dmgOf(act) > 0);
  // 札が ならぶ（作戦・すがた・けっかい）
  const p = pub(ra);
  assert.ok(p.r83aPlan && p.r84bForm === 'oyu' && p.r85bMadoka >= 0);
  // オート: 3人とも こわれない
  b.allies.forEach((x, i) => { x.abilities = learnedAbilities(chars[i]); });
  for (const x of b.allies) for (let i = 0; i < 6; i++) assert.ok(decideAlly(b, x)?.type);
  for (const x of b.allies) x.controller = null;
  for (let i = 0; i < 600; i++) b.tick(50);
  assert.ok(b.allies.every((x) => x.alive));
});
