// 2026年10月（第33回）: 11の 新しい 職業（docs/plan-r33-jobs.md）
//   手品師 → かいとう → かいとうキッド／魔法学校の生徒 → ハリーポッター／3年B組の担任（伝説）
//   れん金術師 → 国家れん金術師 → はがねのれん金術師／美少女戦士 → セーラームーン
//  ・職業の 木・ランク・強さ・技の 数・攻撃技・看板の 技・補助の 上限・効果が かぶらない・ひらめき技・合体技・
//    3年B組の担任の 学校の 仲間・れん金術師で れん金がまの 歩数が 半分・装備・転職の ひとこと・文字
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  JOBS, JOB_ORDER, ADVANCED_ORDER, SUPER_ORDER, LEGEND_ORDER, ALL_JOBS, JOB_MAX_LEVEL, JOB_HINTS, SCHOOL_JOBS, jobReqText, jobAncestry,
} from '../public/js/shared/data/jobs.js';
import { ABILITIES, abilityRole } from '../public/js/shared/data/abilities.js';
import { JOB9_ABILITIES } from '../public/js/shared/data/abilities-jobs9.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
import { HIRA_R33_ABILITIES, HIRAMEKI_R33 } from '../public/js/shared/data/hirameki-r33.js';
import { DUAL_TECHS, DUAL_ORDER, DUAL_GROUP_NAMES, ANY_GROUPS, dualSize, dualRelated, groupJobs, dualNeedText } from '../public/js/shared/data/dual.js';
import { ITEMS, ITEM_KANA } from '../public/js/shared/data/items.js';
import { ITEMS_R33, R33_SHOP_ADD } from '../public/js/shared/data/items-r33.js';
import { SHOPS, shopItems } from '../public/js/shared/data/shops.js';
import { SKILL_UPS } from '../public/js/shared/data/skill-ups.js';
import { JOB_SAY, jobDoneText } from '../public/js/shared/data/job-talk.js';
import { UPGRADE_TYPES } from '../public/js/shared/data/items-forge.js';
import { POT_FAST_JOBS, POT_FAST_RATE, POT_FLAG, potSteps } from '../public/js/shared/data/alchemy.js';
import { ALCHEMY_POT } from '../public/js/shared/data/items-alchemy.js';
import { rarityOf, rareIds } from '../public/js/shared/data/rare-loot.js';
import {
  newCharacter, changeJob, jobUnlocked, jobKnown, gainExp, expForLevel, fullHeal, learnedAbilities, hiraAllowed, hiraRelated, partyJobSet,
  STARTER_EQUIP, computeStats, canEquip, addItem, itemCount,
} from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';
import { classmateMult, classmatesOf, CLASSMATES_MAX } from '../public/js/shared/battle-r33.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { alchemySteps, potRate } from '../public/js/shared/world/alchemy.js';
import { partyOf } from '../public/js/shared/world/party.js';
import { DUAL_FX } from '../public/js/client/render/dualfx.js';
import { checkText } from '../tools/kanji-check.mjs';
import { Bot } from './helpers.js';

const tierOf = (j) => JOBS[j].tier || 0;
const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
const masterChain = (c, jid) => {
  for (const r of JOBS[jid].req || []) { master(c, r); masterChain(c, r); }
  if (JOBS[jid].reqSuper) master(c, 'god_hand');
};
const ORDERS = [JOB_ORDER, ADVANCED_ORDER, SUPER_ORDER, LEGEND_ORDER];
// 家族と きめた 職業の 木（id・ゲームで 出る 名前・ランク・なる じょうけん）
const TREE = [
  ['magician', '手品師', 0],
  ['kaito', 'かいとう', 1, ['magician', 'spy']],
  ['kaito_kid', 'かいとうキッド', 2, ['kaito']],
  ['wizard_student', '魔法学校の生徒', 1, ['schoolkid', 'mage']],
  ['harry', 'ハリーポッター', 2, ['wizard_student']],
  ['homeroom_3b', '3年B組の担任', 3, ['highschooler', 'civil_local']],
  ['alchemist', 'れん金術師', 0],
  ['state_alchemist', '国家れん金術師', 1, ['alchemist']],
  ['fullmetal', 'はがねのれん金術師', 2, ['state_alchemist']],
  ['sailor_soldier', '美少女戦士', 1, ['middleschooler', 'idol']],
  ['sailor_moon', 'セーラームーン', 2, ['sailor_soldier']],
];
const NEW = TREE.map(([id]) => id);
const SIG_NAMES = {
  magician: 'イリュージョン', kaito: '予告どおりにいただきます', kaito_kid: 'トランプじゅうの嵐', wizard_student: 'ステューピファイ', harry: '守護の呪文',
  homeroom_3b: '愛のお説教', alchemist: '石の大男', state_alchemist: 'れん成大爆発', fullmetal: '大地のやり',
  sailor_soldier: 'ムーン・ティアラ・アクション', sailor_moon: 'ムーン・プリンセス・ハレーション',
};
const NEW_DUAL = ['dt_tsukiyo', 'dt_reform', 'dt_moonlight', 'dt_hippogriff', 'dt_sotsugyou'];
const NEW_HIRA = Object.keys(HIRA_R33_ABILITIES);
// 小学校で 習わない 字（ひらがなに した）
const BAD = /[怪盗錬銃晶換鹿刃]/;
const SCOPE = {
  enemy: /敵1体/, group: /同じ種類の敵/, enemies: /敵全体|敵にランダム/, ally: /仲間1人/, allies: /仲間全員/, self: /自分/, deadAlly: /仲間1人/,
};
const ALL_CAP = [1.15, 1.25, 1.4, 1.4];
const ALL_MULTI_CAP = [1.12, 1.2, 1.3, 1.35];
const ONE_CAP = [1.3, 1.4, 1.5, 1.5];
const EVA_CAP = [0.25, 0.3, 0.35, 0.35];
const partsOf = (e) => (e.type === 'multi' ? e.parts : [e]);
const lines = (e) => partsOf(e).flatMap((p) => [p.msg, p.failMsg]).filter(Boolean);
const textOk = (s, what) => assert.deepEqual(checkText(s), [], `${what}: ${s}`);

function setup(job, { seed = 1, enemies = ['rockman', 'rockman', 'skeleton'], lv = 45, mates = [] } = {}) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job: 'warrior' });
  gainExp(c, expForLevel(lv));
  masterChain(c, job);
  master(c, job);
  c.job = job;
  c.equip.weapon = null;
  fullHeal(c);
  const others = (mates.length ? mates : ['priest']).map((j, i) => {
    const m = newCharacter({ id: `m${i}`, name: `ミナ${i}`, job: 'warrior' });
    gainExp(m, expForLevel(lv));
    masterChain(m, j);
    m.job = j;
    fullHeal(m);
    return { char: m, auto: true, kind: 'support' };
  });
  const b = new Battle({ rng: makeRng(seed), allies: [{ char: c, controller: 's1' }, ...others], enemies, canFlee: true });
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
test('第33回の 職業: 職業の 木（id・名前・ランク・なる じょうけん）・神殿の うわさ・文字', () => {
  for (const [id, name, tier, req] of TREE) {
    const j = JOBS[id];
    assert.ok(j, id);
    assert.equal(j.id, id);
    assert.equal(j.name, name, `${id} の 名前`);
    assert.equal(tierOf(id), tier, `${id} の ランク`);
    assert.ok(ORDERS[tier].includes(id), `${id} の ならび`);
    assert.equal(ALL_JOBS.filter((x) => x === id).length, 1);
    if (req) assert.deepEqual(j.req, req, `${id} の じょうけん`);
    else assert.equal(j.req, undefined, `${id} は はじめから なれる`);
    // 3年B組の担任は 魔王・はかい神と おなじ「2つの 職業」の 形（ほかの 超級職の 数は いらない）
    assert.equal(j.reqSuper, undefined, `${id} の reqSuper`);
    if (tier >= 2) assert.ok(JOB_HINTS[id], `${id} の 神殿の うわさ`);
    for (const s of [j.name, j.desc, j.short, JOB_HINTS[id] || '']) textOk(s, id);
    assert.deepEqual(checkText(j.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
    assert.ok(!BAD.test(j.name + j.desc + (JOB_HINTS[id] || '')), id);
  }
  // 基本職 2つは 今の 基本職の さいごに
  // 第43回から あとに 基本職が ふえても よい（第33回の 2つが この じゅんで つづく）
  assert.deepEqual(JOB_ORDER.slice(JOB_ORDER.indexOf('magician'), JOB_ORDER.indexOf('magician') + 2), ['magician', 'alchemist']);
  assert.equal(jobReqText('kaito'), '手品師Lv10＋スパイLv10');
  assert.equal(jobReqText('homeroom_3b'), '高校生Lv10＋地方公務員Lv10');
  assert.equal(jobReqText('fullmetal'), '国家れん金術師Lv10');
  const title = readFileSync(new URL('../public/js/client/ui/title.js', import.meta.url), 'utf8');
  for (const id of ['magician', 'alchemist']) assert.match(title, new RegExp(`${id}: '[^']+'`), `${id}: 作る 画面の ひとこと`);
  const services = readFileSync(new URL('../public/js/client/ui/services.js', import.meta.url), 'utf8');
  assert.ok(services.includes('3年B組の担任'), '神殿の 伝説の 一覧');
});

test('第33回の 職業: なれる じゅんばん（手品師・れん金術師は はじめから・上級職・超級職・3年B組の担任）', () => {
  for (const j of ['magician', 'alchemist']) {
    const c = newCharacter({ id: j, name: 'ケン', job: j });
    assert.equal(c.job, j, `${j} は はじめから えらべる`);
    assert.equal(c.equip.weapon, STARTER_EQUIP[j].weapon);
  }
  const c = newCharacter({ id: 'k', name: 'ケン', job: 'magician' });
  master(c, 'magician');
  assert.equal(jobUnlocked(c, 'kaito'), false, 'スパイも いる');
  master(c, 'spy');
  assert.equal(jobUnlocked(c, 'kaito'), true);
  assert.equal(jobKnown(c, 'kaito_kid'), false, 'かいとうキッドは まだ ひみつ');
  master(c, 'kaito');
  assert.ok(jobKnown(c, 'kaito_kid') && jobUnlocked(c, 'kaito_kid'));
  // 3年B組の担任: 高校生と 地方公務員の 両方
  master(c, 'schoolkid', 'middleschooler', 'highschooler');
  assert.equal(jobUnlocked(c, 'homeroom_3b'), false, '高校生だけでは まだ');
  assert.equal(jobKnown(c, 'homeroom_3b'), true, '高校生を きわめると うわさ');
  master(c, 'civil_local');
  assert.equal(jobUnlocked(c, 'homeroom_3b'), true);
  assert.equal(changeJob(c, 'homeroom_3b').ok, true);
  assert.ok(learnedAbilities(c).includes('h3_hito'));
  assert.ok(learnedAbilities(c).includes('hs_seishun'), 'もとの 職業の 技も 使える');
  // 魔法学校の生徒・美少女戦士・国家れん金術師
  master(c, 'mage', 'idol', 'alchemist');
  for (const j of ['wizard_student', 'sailor_soldier', 'state_alchemist']) assert.equal(jobUnlocked(c, j), true, j);
  for (const j of ['harry', 'sailor_moon', 'fullmetal']) assert.equal(jobKnown(c, j), false, `${j} は まだ ひみつ`);
});

test('第33回の 職業: 強さは 同じ ランクの 今の 職業の はんい（伝説は 超級職より 上）・学校の 職業は のびざかり', () => {
  const sum = (j) => Object.values(JOBS[j].mods).reduce((a, b) => a + b, 0);
  const OLD = ALL_JOBS.filter((o) => !NEW.includes(o));
  const sup = OLD.filter((o) => tierOf(o) === 2).map(sum);
  const legend = OLD.filter((o) => tierOf(o) === 3).map(sum);
  for (const j of NEW) {
    const t = tierOf(j);
    assert.deepEqual(Object.keys(JOBS[j].mods).sort(), ['agi', 'def', 'heal', 'hp', 'mag', 'mp', 'str']);
    if (t < 3) {
      const same = OLD.filter((o) => tierOf(o) === t).map(sum);
      assert.ok(sum(j) >= Math.min(...same) && sum(j) <= Math.max(...same), `${j}: ${sum(j).toFixed(2)}`);
    } else assert.ok(sum(j) > Math.max(...sup) && sum(j) >= Math.min(...legend) && sum(j) <= Math.max(...legend), `${j}: ${sum(j).toFixed(2)}`);
    assert.ok(Object.values(JOBS[j].perLv).reduce((a, b) => a + b, 0) <= [1.4, 1.5, 2, 3.5][t] + 1e-9, `${j}: perLv`);
    assert.match(JOBS[j].color, /^#[0-9a-f]{6}$/);
    assert.ok(JOBS[j].weapons.length >= 2);
  }
  // 魔法学校の生徒・ハリーポッターは 学校の 職業（のびざかり・学校の 仲間）
  for (const j of ['wizard_student', 'harry']) {
    assert.equal(JOBS[j].passive?.train, 1.25, j);
    assert.ok(SCHOOL_JOBS.includes(j));
  }
  for (const j of ['schoolkid', 'middleschooler', 'highschooler', 'sailor_soldier', 'sailor_moon']) assert.ok(SCHOOL_JOBS.includes(j), j);
  assert.ok(!SCHOOL_JOBS.includes('homeroom_3b'), '先生は 学校の 仲間に 数えない');
  assert.equal(JOBS.homeroom_3b.passive.classmates, 0.1);
});

// ───────────── 技 ─────────────
test('第33回の 技: 6こ・Lv10 が いちばん MP・看板の 技・攻撃技・せつめい・文字・名前が かぶらない・補助の 上限', () => {
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden) names.set(a.name, [...(names.get(a.name) || []), id]);
  const mine = new Set();
  for (const j of NEW) {
    const job = JOBS[j];
    const t = tierOf(j);
    assert.equal(job.learn.length, 6, `${j}: ${job.learn.length}こ`);
    const lvs = job.learn.map(([l]) => l);
    assert.deepEqual(lvs, [...lvs].sort((a, b) => a - b));
    assert.equal(lvs[0], 1);
    assert.equal(lvs[lvs.length - 1], 10);
    const mps = job.learn.map(([, id]) => ABILITIES[id].mp);
    assert.ok(mps.slice(0, -1).every((m) => m < mps[mps.length - 1]), `${j}: Lv10 の 技が いちばん MPを 使う`);
    // 看板の 技（必殺技）
    const sig = `${j}_sig`;
    assert.equal(job.learn[job.learn.length - 1][1], sig);
    assert.equal(ABILITIES[sig].name, SIG_NAMES[j]);
    assert.equal(abilityRole(ABILITIES[sig]), 'dmg', `${sig} は 攻撃技`);
    assert.ok(!ABILITIES[sig].hidden && !ABILITIES[sig].noAuto);
    // 攻撃技（基本職 3つ・ほか 2つ いじょう）
    const atk = job.learn.filter(([, id]) => abilityRole(ABILITIES[id]) === 'dmg').length;
    assert.ok(atk >= (t === 0 ? 3 : 2), `${j}: 攻撃技 ${atk}こ`);
    for (const [, id] of job.learn) {
      const a = ABILITIES[id];
      mine.add(id);
      assert.equal(a.job, j, `${id} の job`);
      assert.ok(['skill', 'spell'].includes(a.kind));
      assert.ok(!a.weapon, `${id}: 武器が なくても 使える`);
      assert.ok(a.desc && a.cast && a.anim && a.kana, id);
      assert.match(a.desc, SCOPE[a.target], `${id}: ${a.desc}`);
      for (const s of [a.name, a.desc, a.cast, ...lines(a.effect)]) textOk(s, id);
      assert.deepEqual(checkText(a.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
      assert.ok(!BAD.test(a.name + a.desc + a.cast), id);
      assert.equal(names.get(a.name).length, 1, `${a.name} が かぶる`);
      for (const p of partsOf(a.effect)) {
        if (p.type === 'buff' && !p.target && ['allies', 'ally'].includes(a.target)) {
          if (p.stat === 'eva') assert.ok(p.add <= EVA_CAP[t] + 1e-9, a.name);
          else {
            const cap = a.target === 'ally' ? ONE_CAP[t] : (p.stats || [p.stat]).length > 1 ? ALL_MULTI_CAP[t] : ALL_CAP[t];
            assert.ok(p.mult <= cap + 1e-9, `${a.name}: ${p.mult}`);
          }
        }
        if (['atbSet', 'status', 'debuff'].includes(p.type) && ['enemy', 'group', 'enemies'].includes(p.target || a.target)) assert.ok(p.chance > 0 && p.chance < 1, a.name);
      }
    }
  }
  assert.deepEqual([...mine].sort(), Object.keys(JOB9_ABILITIES).sort(), 'abilities-jobs9.js の 技は ぜんぶ どれかの 職業で 覚える');
  // 基本職の 補助は 弱め（みんなに 1.15倍・1人に 1.3倍 より 小さい）
  for (const id of ['al_kabe', 'mg_joshu']) {
    const p = ABILITIES[id].effect;
    assert.ok(p.mult < (ABILITIES[id].target === 'ally' ? 1.3 : 1.15), id);
  }
});

test('第33回の 技: 1つの 職業の 中で 効果が かぶらない（ねらい・効果の 種類・属性・かず の 組み合わせが ちがう）', () => {
  const shape = (a) => `${a.target}|${partsOf(a.effect).map((p) => [p.type, p.target || '', p.element || '', p.stat || (p.stats || []).join('+'), p.status || '', p.hits ? 'hits' : '', p.random ? 'r' : ''].join(':')).join(',')}`;
  for (const j of NEW) {
    const seen = new Map();
    for (const [, id] of JOBS[j].learn) {
      const k = shape(ABILITIES[id]);
      assert.ok(!seen.has(k), `${JOBS[j].name}: ${ABILITIES[id].name} と ${seen.get(k)} が おなじ 形`);
      seen.set(k, ABILITIES[id].name);
    }
  }
  // 職業の 味（家族と きめた こと）
  const has = (j, f) => JOBS[j].learn.some(([, id]) => partsOf(ABILITIES[id].effect).some(f));
  assert.ok(has('kaito', (p) => p.type === 'steal') && has('kaito', (p) => p.type === 'status' && p.status === 'confuse'), 'かいとう: ぬすむ・変装');
  assert.ok(has('kaito_kid', (p) => p.stat === 'eva') && has('kaito_kid', (p) => (p.status?.status || p.status) === 'blind'), 'キッド: かわす・目くらまし');
  assert.ok(has('harry', (p) => p.type === 'debuff' && p.stat === 'atk') && has('harry', (p) => p.element === 'bolt') && has('harry', (p) => p.stat === 'agi'), 'ハリー: 武器を うばう・いなずま・ほうき');
  assert.ok(has('homeroom_3b', (p) => p.type === 'atbSet') && has('homeroom_3b', (p) => p.type === 'buff'), '担任: 止める・仲間を 強く');
  assert.ok(has('fullmetal', (p) => p.type === 'buff' && (p.stats || []).includes('def')) && has('fullmetal', (p) => p.ignoreDef > 0), 'はがね: かべ・機械の うで');
  assert.ok(has('sailor_moon', (p) => p.type === 'revive') && has('sailor_moon', (p) => p.element === 'light'), 'セーラームーン: 仲間を 守る・月の 光');
});

test('第33回の 技は ぜんぶ たたかいで 使えて、攻撃技は ダメージ・オートでも こわれない', () => {
  let n = 0;
  for (const j of NEW) {
    for (const [, id] of JOBS[j].learn) {
      const { b, me, m } = setup(j, { seed: ++n });
      if (ABILITIES[id].target === 'deadAlly') { m.alive = false; m.hp = 0; }
      assert.ok(readyUp(b, me));
      const a = ABILITIES[id];
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
    let usedSkill = 0;
    for (let i = 0; i < 12; i++) {
      const cmd = decideAlly(s.b, s.me);
      assert.ok(cmd?.type, `${j}: ${JSON.stringify(cmd)}`);
      if (cmd.type === 'ability') { assert.ok(ABILITIES[cmd.id] && !ABILITIES[cmd.id].hidden, cmd.id); usedSkill++; }
    }
    assert.ok(usedSkill > 0, `${j}: オートでも 技を 使う`);
  }
  assert.ok(n >= 66);
});

test('第33回の 技: すりかえトリック（ぬすむ＋強さを 消す）・等価こうかん（自分の HPで みんなの MP）', () => {
  const { b, me, c } = setup('kaito', { seed: 3 });
  const foe = b.enemies[0];
  foe.buffs.atk = { mult: 1.5, lv: 1, until: 1e12 };
  readyUp(b, me);
  b.command(me.id, { type: 'ability', id: 'kt_surikae', target: foe.id }, 's1');
  const act = runUntilAct(b, me.id);
  assert.ok(act.lines.some((l) => l.includes('強くなっていた力が消えた')), act.lines.join('/'));
  assert.equal(foe.buffs.atk, undefined);
  assert.ok(c);
  // 等価こうかん
  const f = setup('fullmetal', { seed: 4 });
  for (const a of f.b.allies) a.mp = 10;
  readyUp(f.b, f.me);
  const hp0 = f.me.hp;
  f.b.command(f.me.id, { type: 'ability', id: 'fm_koukan' }, 's1');
  const fa = runUntilAct(f.b, f.me.id);
  assert.ok(f.me.hp < hp0, 'HPを はらう');
  assert.ok(f.m.mp > 10, '仲間の MPが ふえる');
  assert.ok(fa.lines.some((l) => l.includes('代価')));
});

test('上位の 技（skill-ups.js）: かいとうの トランプじゅう → トランプじゅうの嵐 など、その 道の 技', () => {
  for (const [up, base] of [['kaito_kid_sig', 'kt_card'], ['sl_hashira', 'al_toge'], ['fullmetal_sig', 'sl_hashira'], ['state_alchemist_sig', 'al_bakuhatsu'], ['sailor_moon_sig', 'sailor_soldier_sig'], ['harry_sig', 'ws_hikari']]) {
    assert.equal(SKILL_UPS[up], base, up);
    assert.ok(jobAncestry(ABILITIES[up].job).has(ABILITIES[base].job));
  }
});

// ───────────── ひらめき技 ─────────────
test('第33回の ひらめき技: 上級職より 上の 9つに 1つずつ（担任は 2つ）・基本職には ない・データと 文字', () => {
  const per = new Map();
  for (const id of NEW_HIRA) per.set(HIRA_R33_ABILITIES[id].job, (per.get(HIRA_R33_ABILITIES[id].job) || 0) + 1);
  for (const j of NEW.filter((x) => tierOf(x) >= 1)) assert.equal(per.get(j), j === 'homeroom_3b' ? 2 : 1, j);
  for (const j of ['magician', 'alchemist']) assert.equal(per.get(j), undefined, `${j}: 基本職には 足さない`);
  assert.deepEqual(Object.keys(HIRAMEKI_R33).sort(), [...NEW_HIRA].sort());
  const oldAnims = new Set(Object.entries(ABILITIES).filter(([id]) => !NEW_HIRA.includes(id)).map(([, a]) => a.anim).filter(Boolean));
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden) names.set(a.name, [...(names.get(a.name) || []), id]);
  for (const id of NEW_HIRA) {
    const a = ABILITIES[id];
    assert.ok(a && a.hirameki && HIRAMEKI[id] && id.startsWith('hi_'), id);
    assert.match(a.desc, SCOPE[a.target], `${id}: ${a.desc}`);
    for (const s of [a.name, a.desc, a.cast, ...lines(a.effect)]) textOk(s, id);
    assert.deepEqual(checkText(a.kana).filter((p) => p.kind !== 'kana'), [], id);
    assert.ok(!BAD.test(a.name + a.desc + a.cast), id);
    assert.ok(oldAnims.has(a.anim) || /^(ax|ox)_/.test(a.anim), `${id}: ${a.anim}`);
    assert.equal(names.get(a.name).length, 1, a.name);
    for (const [k, n] of Object.entries(HIRAMEKI[id].from)) {
      const s = ABILITIES[k];
      assert.ok(s && n > 0 && JOBS[s.job]?.learn.some(([, x]) => x === k), `${id}: ${k}`);
      assert.ok(jobAncestry(a.job).has(s.job), `${id}: ${k} は その 道の 技`);
    }
    for (const p of partsOf(a.effect)) if (['atbSet', 'status'].includes(p.type)) assert.ok(p.chance > 0 && p.chance < 1);
    for (const j of NEW) {
      const c = newCharacter({ id: 'x', name: 'x', job: 'warrior' });
      c.job = j;
      assert.equal(hiraAllowed(c, id), jobAncestry(j).has(a.job), `${j} で ${a.name}`);
    }
  }
  assert.ok(hiraRelated('hi_ryoute', partyJobSet([{ job: 'fullmetal' }])));
  assert.ok(!hiraRelated('hi_spiral', partyJobSet([{ job: 'warrior' }])));
});

test('第33回の ひらめき技は たたかいで 使えて、元の 技を 使いこむと ひらめく', () => {
  let n = 0;
  for (const id of NEW_HIRA) {
    const a = ABILITIES[id];
    {
      const { b, c, me } = setup(a.job, { seed: ++n });
      c.hirameki = [id];
      me.abilities = [...me.abilities, id];
      assert.ok(readyUp(b, me));
      const r = b.command(me.id, { type: 'ability', id, target: b.enemies[0].id }, 's1');
      assert.equal(r.ok, true, `${id}: ${r.reason || ''}`);
      const act = runUntilAct(b, me.id);
      if (abilityRole(a) === 'dmg') assert.ok(act?.results?.some((x) => x.dmg > 0), `${id}: ダメージ`);
      else assert.ok(act?.results?.some((x) => x.heal >= 0), `${id}: 回復`);
      for (const l of act.lines) textOk(l, id);
    }
    const from = HIRAMEKI[id].from;
    const key = Object.keys(from)[0];
    let got = null;
    for (let seed = 1; seed < 80 && !got; seed++) {
      const { b, c, me } = setup(a.job, { seed });
      c.skillUse = Object.fromEntries(Object.entries(from).map(([k, v]) => [k, v * 2]));
      me.use = { ...c.skillUse };
      readyUp(b, me);
      const r = b.command(me.id, { type: 'ability', id: key, target: b.enemies[0].id }, 's1');
      assert.equal(r.ok, true, `${id}: ${key}`);
      const act = runUntilAct(b, me.id);
      if (act?.hirameki) { assert.equal(act.hirameki.id, id); got = act; }
    }
    assert.ok(got, `${a.name} を ひらめいた`);
  }
});

// ───────────── 合体技 ─────────────
const jobsOf = (id, g) => groupJobs(DUAL_TECHS[id].need[g]);
const pair = (id, ...jobs) => jobs.every((j) => DUAL_TECHS[id].need.some((_, g) => jobsOf(id, g).has(j)));

test('第33回の 合体技: 5こ（2人技4・3人技1。ぜんぶで 46こ）・新しい 職業と 今の 職業・だれでも 枠なし・えんしゅつ・文字', () => {
  // 第35回: タグの 技を 足して 59こ（test/dual-tags.test.js）
  assert.equal(DUAL_ORDER.length, 59);
  for (const id of NEW_DUAL) assert.ok(DUAL_TECHS[id], id);
  assert.deepEqual(NEW_DUAL.map(dualSize), [2, 2, 2, 2, 3]);
  const ord = DUAL_ORDER.map(dualSize);
  assert.deepEqual(ord, [...ord].sort((a, b) => a - b));
  assert.ok(pair('dt_tsukiyo', 'kaito_kid', 'meitantei') && pair('dt_tsukiyo', 'magician', 'shonen_tantei'), 'かいとう×探てい');
  assert.ok(pair('dt_reform', 'fullmetal', 'setsubiya') && pair('dt_reform', 'alchemist', 'ryonetsu'), 'れん金×設備');
  assert.ok(pair('dt_moonlight', 'sailor_moon', 'idol') && pair('dt_moonlight', 'sailor_soldier', 'fruit_idol'), '美少女戦士×アイドル');
  assert.ok(pair('dt_hippogriff', 'harry', 'tamer') && pair('dt_hippogriff', 'wizard_student', 'monster_master'), '魔法学校×魔物使い');
  assert.ok(pair('dt_sotsugyou', 'homeroom_3b', 'schoolkid', 'highschooler', 'harry', 'sailor_moon'), '担任×学校の 子ども');
  assert.ok(!jobsOf('dt_sotsugyou', 0).has('schoolkid'), '1人めは 担任だけ');
  // 今の きまり: だれでも 枠は ミナデインだけ・今 ついている 職業で 判定
  for (const id of NEW_DUAL) {
    const t = DUAL_TECHS[id];
    for (const g of t.need) assert.ok(!ANY_GROUPS.has(g), `${id}: だれでも 枠`);
    for (const s of [t.name, t.desc, dualNeedText(id), dualNeedText(id, true), ...t.parts.flatMap((p) => [p.say, p.msg, p.failMsg]).filter(Boolean)]) textOk(s, id);
    for (const g of t.need) textOk(DUAL_GROUP_NAMES.get(g), id);
    assert.ok(DUAL_FX[id]?.finale && DUAL_FX[id].word, id);
    textOk(DUAL_FX[id].word, id);
    assert.ok(!BAD.test(t.name + t.desc), id);
  }
  // 11の 職業は どれも 合体技に 入れる
  for (const j of NEW) assert.ok(Object.values(DUAL_TECHS).some((t) => t.need.some((list) => !ANY_GROUPS.has(list) && groupJobs(list).has(j))), `${JOBS[j].name} の 合体技`);
  assert.ok(dualRelated('dt_sotsugyou', partyJobSet([{ job: 'homeroom_3b' }, { job: 'schoolkid' }])));
  assert.ok(!dualRelated('dt_sotsugyou', partyJobSet([{ job: 'warrior' }, { job: 'priest' }])));
});

test('第33回の 合体技: 出せて 強い（別々に 動くより 得）・回復の 3人技', () => {
  function party(jobs, enemies) {
    const allies = jobs.map((j, i) => {
      const c = newCharacter({ id: `a${i}`, name: `${JOBS[j].short}${i}`, job: 'warrior' });
      gainExp(c, expForLevel(40));
      masterChain(c, j);
      master(c, j);
      c.job = j;
      c.equip.weapon = null;
      fullHeal(c);
      return i === 0 ? { char: c, controller: 's1' } : { char: c, kind: 'support', controller: 's1' };
    });
    const b = new Battle({ rng: makeRng(3), allies, enemies, canFlee: true });
    for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 99999; e.resist = {}; }
    for (const a of b.allies) a.mp = a.maxMp = 999;
    return b;
  }
  function fire(b, id) {
    const [me] = b.allies;
    for (const a of b.allies) readyUp(b, a);
    const o = b.dualOptionsFor(me).find((x) => x.id === id);
    assert.ok(o, `${id} が 出せる`);
    const r = b.command(me.id, { type: 'dual', id, partner: o.partner, partners: o.partners, target: b.enemies[0].id }, 's1');
    assert.equal(r.ok, true, `${id}: ${r.reason || ''}`);
    const evs = [];
    for (let k = 0; k < 600 && !evs.some((e) => e.t === 'act' && e.dual); k++) evs.push(...b.tick(50));
    const act = evs.find((e) => e.t === 'act' && e.dual);
    assert.equal(act?.dual?.id, id);
    for (const l of act.lines) textOk(l, id);
    return act;
  }
  for (const [id, jobs] of [['dt_tsukiyo', ['kaito_kid', 'meitantei']], ['dt_reform', ['fullmetal', 'setsubiya']], ['dt_moonlight', ['sailor_moon', 'idol']], ['dt_hippogriff', ['harry', 'tamer']]]) {
    const b = party(jobs, ['rockman', 'rockman', 'rockman']);
    const act = fire(b, id);
    const total = act.results.filter((r) => r.dmg > 0).reduce((s, r) => s + r.dmg, 0);
    assert.ok(total > 0, `${id}: ダメージ ${total}`);
  }
  // 旅立ちの日に: 先生と 生徒 2人。たおれた 仲間も 起きて 回復
  const b = party(['homeroom_3b', 'schoolkid', 'sailor_soldier', 'warrior'], ['rockman']);
  const [, kid] = b.allies;
  for (const a of b.allies) a.hp = Math.round(a.maxHp / 3);
  const act = fire(b, 'dt_sotsugyou');
  assert.ok(act.results.some((x) => x.heal > 0));
  assert.ok(kid.buffs.atk && kid.buffs.def && kid.buffs.agi, '攻撃力・守備力・素早さ');
});

// ───────────── 3年B組の担任: 学校の 仲間 ─────────────
test('3年B組の担任: 学校の 職業の 仲間 1人に つき 技が 1わり 強く なる（3人まで）・ほかの 職業は かわらない', () => {
  const fake = (job, others) => {
    const c = { side: 'ally', job, alive: true };
    return { b: { allies: [c, ...others.map((j) => ({ side: 'ally', job: j, alive: true }))] }, c };
  };
  assert.equal(classmateMult(...Object.values(fake('homeroom_3b', []))), 1);
  let f = fake('homeroom_3b', ['schoolkid', 'warrior']);
  assert.equal(classmatesOf(f.b, f.c), 1);
  assert.ok(Math.abs(classmateMult(f.b, f.c) - 1.1) < 1e-9);
  f = fake('homeroom_3b', ['schoolkid', 'harry', 'sailor_moon', 'highschooler']);
  assert.equal(CLASSMATES_MAX, 3);
  assert.ok(Math.abs(classmateMult(f.b, f.c) - 1.3) < 1e-9, '3人まで');
  f.b.allies[1].alive = false;
  assert.ok(Math.abs(classmateMult(f.b, f.c) - 1.3) < 1e-9);
  f.b.allies[2].alive = false;
  assert.ok(Math.abs(classmateMult(f.b, f.c) - 1.2) < 1e-9, 'たおれた 仲間は 数えない');
  f = fake('highschooler', ['schoolkid', 'harry']);
  assert.equal(classmateMult(f.b, f.c), 1, '担任 いがいは かわらない');
  // たたかい: 学校の 仲間が いると 愛のお説教が 強い（同じ 乱数）
  const dmgWith = (mates) => {
    const { b, me } = setup('homeroom_3b', { seed: 11, enemies: ['rockman'], mates });
    for (const a of b.allies.slice(1)) a.atb = -1e9;
    readyUp(b, me);
    b.command(me.id, { type: 'ability', id: 'homeroom_3b_sig', target: b.enemies[0].id }, 's1');
    const act = runUntilAct(b, me.id);
    return act.results.filter((r) => r.dmg > 0).reduce((s, r) => s + r.dmg, 0);
  };
  const solo = dmgWith(['warrior']);
  const kids = dmgWith(['schoolkid', 'middleschooler', 'wizard_student']);
  assert.ok(kids > solo * 1.2, `学校の 仲間 3人 ${kids}・ふつう ${solo}`);
});

// ───────────── れん金がま ─────────────
async function solo(job, seed = 33) {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay(job);
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  addItem(c, ALCHEMY_POT, 1);
  c.flags[POT_FLAG] = true;
  c.items = [...c.items, { id: 'antidote', n: 4 }];
  return { world, bot, c };
}
const svc = (bot, msg) => {
  bot.send({ t: 'svc', ...msg });
  return bot.msgs.filter((m) => m.t === 'svcRes').pop();
};

test('れん金がま: れん金術師の 系統が パーティーに いると、できあがるまでの 歩数が 半分', async () => {
  assert.deepEqual(POT_FAST_JOBS, ['alchemist', 'state_alchemist', 'fullmetal']);
  assert.equal(POT_FAST_RATE, 2);
  const full = potSteps('moonherb');
  // れん金術師で 入れる
  const { world, bot, c } = await solo('alchemist');
  assert.equal(c.job, 'alchemist');
  let r = svc(bot, { kind: 'alchemy', action: 'put', ids: ['antidote', 'antidote'] });
  assert.equal(r.ok, true, r.text);
  assert.match(r.text, new RegExp(`あと${full / 2}歩ほど`));
  assert.match(r.text, /歩数が半分/);
  assert.equal(r.pot.left, full / 2);
  alchemySteps(world, bot.s, full / 2 - 1);
  assert.equal(itemCount(c, 'moonherb'), 0);
  assert.equal(svc(bot, { kind: 'alchemy', action: 'status' }).pot.left, 1);
  alchemySteps(world, bot.s, 1);
  assert.equal(itemCount(c, 'moonherb'), 1, '半分の 歩数で できた');
  // ふつうの 職業: そのまま。仲間に れん金術師が 入ると 半分
  const o = await solo('warrior', 34);
  assert.equal(potRate(o.world, o.bot.s), 1);
  r = svc(o.bot, { kind: 'alchemy', action: 'put', ids: ['antidote', 'antidote'] });
  assert.match(r.text, new RegExp(`あと${full}歩ほど`));
  assert.ok(!/半分/.test(r.text));
  alchemySteps(o.world, o.bot.s, 10);
  assert.equal(o.c.alchemy.pot.left, full - 10);
  const p = partyOf(o.world, o.bot.s);
  p.supports.push({ key: 'x', kind: 'npc', char: { name: 'エド', job: 'fullmetal' } });
  assert.equal(potRate(o.world, o.bot.s), 2);
  alchemySteps(o.world, o.bot.s, 5);
  assert.equal(o.c.alchemy.pot.left, full - 20, '仲間の はがねのれん金術師');
  // 魔物の 仲間（species）は 数えない
  p.supports.length = 0;
  p.supports.push({ key: 'y', kind: 'monster', char: { name: 'スラ', species: 'slime', job: 'alchemist' } });
  assert.equal(potRate(o.world, o.bot.s), 1);
  for (const s of [r.text]) textOk(s.replace(/\n/g, ''), 'かま');
});

// ───────────── 装備・転職の ひとこと ─────────────
test('第33回の 装備: はじめの 装備・店の 品（レア度なし）・レア装備（★3〜★4・宝の洞窟と ひみつのダンジョン）・きたえられる', () => {
  for (const [id, it] of Object.entries(ITEMS_R33)) {
    assert.ok(ITEMS[id] === it || ITEMS[id], id);
    assert.ok(it.desc && ITEM_KANA[id], id);
    for (const s of [it.name, it.desc]) textOk(s, id);
    assert.ok(!BAD.test(it.name + it.desc), id);
    if (UPGRADE_TYPES.includes(it.type)) assert.ok(ITEMS[`${id}+1`], `${id}: きたえられる`);
    if (it.src) {
      assert.ok(rarityOf(id) >= 3 && rarityOf(id) <= 4, id);
      assert.equal(it.price, 0);
      assert.ok(it.sell > 0);
      assert.ok(rareIds(it.src).includes(id), `${id}: ${it.src} で 出る`);
    } else {
      assert.equal(rarityOf(id), 0, `${id}: 店の 品`);
      assert.ok(it.price > 0);
    }
  }
  assert.equal(STARTER_EQUIP.magician.weapon, 'magic_wand');
  assert.equal(STARTER_EQUIP.alchemist.weapon, 'chalk');
  assert.ok(canEquip('magician', 'magic_wand') && canEquip('alchemist', 'chalk') && canEquip('homeroom_3b', 'pointer_stick'));
  assert.ok(canEquip('sailor_soldier', 'tiara_boomerang') && canEquip('fullmetal', 'automail_arm') && canEquip('harry', 'elder_wand'));
  // 店（物語の フラグで ふえる 品も）
  const all = () => true;
  for (const [shop, add] of Object.entries(R33_SHOP_ADD)) {
    const list = shopItems(SHOPS[shop], all);
    for (const id of [...(add.items || []), ...Object.values(add.more || {}).flat()]) assert.ok(list.includes(id), `${shop}: ${id}`);
  }
  assert.ok(!shopItems(SHOPS.armor, () => false).includes('school_robe'), '魔法学校のローブは 森の主の あと');
  // 強さは 同じ ランクの 品と おなじ くらい
  assert.ok(ITEMS.magic_wand.atk <= ITEMS.oak_staff.atk + 1);
  const st = computeStats(newCharacter({ id: 'a', name: 'a', job: 'alchemist' }));
  assert.ok(st.atk > 0);
});

test('転職の ひとこと: 新しい 職業は 2行目に ひとこと（はずした 物が ある ときは そちら。2行まで）', async () => {
  // 第40回の 2つの 伝説の 職業にも ひとこと（test/jobs-r40.test.js）
  // 第41回 B の 雪の女王・第5のせいれいにも ひとこと（test/jobs-r41b.test.js）
  // 第41回 A の 伝説の 職業にも ひとこと（test/jobs-r41a.test.js）
  // 第43回の 配管工の 系統にも ひとこと（test/jobs-r43.test.js）
  assert.deepEqual(Object.keys(JOB_SAY).filter((j) => !['ryumajin', 'neo_queen', 'snow_queen', 'fifth_spirit', 'keikyu_president', 'hall_of_fame', 'plumber', 'mustache', 'mario'].includes(j) && !(JOBS[j]?.tier >= 4)).sort(), [...NEW].sort()); // 第51回: 幻の職業は test/phantom-*.test.js
  for (const [j, s] of Object.entries(JOB_SAY)) {
    textOk(s, j);
    assert.ok(s.length <= 24 && s.startsWith('「') && s.endsWith('」'), s);
  }
  assert.equal(jobDoneText('ナナ', '手品師', [], 'magician'), 'ナナは手品師になった！\n「タネも仕かけもございません！」');
  assert.equal(jobDoneText('ナナ', '戦士', [], 'warrior'), 'ナナは戦士になった！');
  assert.equal(jobDoneText('ナナ', '手品師', ['皮のたて'], 'magician'), 'ナナは手品師になった！\n（皮のたてを外した）');
  // サーバーの 返事
  const { bot, c } = await solo('warrior', 35);
  master(c, 'warrior');
  c.jobs.magician = { lv: 1, b: 0 };
  bot.s.busy = { kind: 'svc' };
  c.equip.shield = null;
  const r = svc(bot, { kind: 'jobChange', job: 'magician' });
  assert.equal(r.ok, true, r.text);
  assert.equal(r.text.split('\n')[0], `${c.name}は手品師になった！`);
  assert.ok(r.text.split('\n').length <= 2, r.text);
});
