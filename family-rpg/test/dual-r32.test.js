// 2026年10月（第32回 A）: 魔物使い・モンスターマスターの 合体技（docs/plan-r31.md の 5）と、メニューの「ひらめき」は 今の 職業だけ
//  ・ビーストクロス（魔物使い × モンスターの 仲間）・大サーカス（魔物使い × おどり）・ワイルドラッシュ（魔物使い × モンスターの 仲間 × こぶし）
//  ・モンスターの 仲間の 組は 魔物の 仲間だけ（人は 入れない・魔物は ほかの 組に 入れない。「だれでも」の 組では ない）
//  ・メニューの「ひらめき」: その 人が 今 ついている 職業の ひらめき技だけ（掛け合わせ技は その 職業で ひらめける もの）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JOBS, ALL_JOBS, JOB_MAX_LEVEL } from '../public/js/shared/data/jobs.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
import {
  DUAL_TECHS, DUAL_ORDER, MONSTER_ALLY, ANY_GROUPS, dualOptions, dualRelated, dualNeedText, groupJobs, fitsGroup, dualSize,
} from '../public/js/shared/data/dual.js';
import { newCharacter, newMonsterCompanion, gainExp, expForLevel, fullHeal, weaponOk, partyJobSet, hiraOfJob, hiraAllowed } from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { DUAL_FX } from '../public/js/client/render/dualfx.js';
import { checkText } from '../tools/kanji-check.mjs';

const NEW = ['dt_beast_cross', 'dt_circus', 'dt_wild_rush'];
const p = (id, job, extra = {}) => ({ id, name: id, job, alive: true, abilities: [], mp: 99, ready: true, statuses: [], weaponCat: 'whip', ...extra });
const mon = (id, extra = {}) => p(id, null, { mon: 'slime', ...extra });
const ids = (list) => list.map((o) => o.id);

function mk(job, name, lv = 40) {
  if (job === 'MON') return newMonsterCompanion({ id: name, name, species: 'slime', level: lv });
  const c = newCharacter({ id: name, name, job: 'warrior' });
  gainExp(c, expForLevel(lv));
  c.jobs[job] = { lv: JOB_MAX_LEVEL, b: 999 };
  c.job = job;
  fullHeal(c);
  return c;
}

test('魔物使い・モンスターマスターの 合体技 3こ（2人技2・3人技1）: 名前・組・MP・えんしゅつ・文字', () => {
  for (const id of NEW) assert.ok(DUAL_TECHS[id], id);
  // 第33回: 11の 職業の 5こで 46こ（test/jobs-r33.test.js）
  assert.equal(DUAL_ORDER.length, 46);
  assert.deepEqual(NEW.map((id) => DUAL_TECHS[id].name), ['ビーストクロス', '大サーカス', 'ワイルドラッシュ']);
  assert.deepEqual(NEW.map(dualSize), [2, 2, 3]);
  for (const id of NEW) {
    const t = DUAL_TECHS[id];
    assert.deepEqual([...groupJobs(t.need[0])].sort(), ['monster_master', 'tamer'], `${t.name}: 1つめは 魔物使い・モンスターマスター`);
    assert.ok(DUAL_FX[id]?.finale && ['cross', 'stage', 'quake'].includes(DUAL_FX[id].finale), `${id}: 今ある とどめの 型`);
    for (const s of [t.name, t.desc, DUAL_FX[id].word, dualNeedText(id), dualNeedText(id, true), ...t.parts.flatMap((x) => [x.say, x.msg, x.failMsg]).filter(Boolean)]) {
      assert.deepEqual(checkText(s), [], `${id}: ${s}`);
    }
  }
  assert.equal(dualNeedText('dt_beast_cross'), '魔物使い・モンスターマスター＋モンスターの仲間');
  assert.equal(dualNeedText('dt_wild_rush', true), '魔物使い＋モンスターの仲間＋こぶし');
  assert.ok(DUAL_TECHS.dt_circus.funny);
  // 魔物使いの 技・モンスターマスターの 技は 合体技に 入った（前は 全員集合と ミナデインの「だれでも」だけ）
  const inDual = new Set(Object.values(DUAL_TECHS).flatMap((t) => t.need.filter((g) => !ANY_GROUPS.has(g)).flatMap((g) => [...groupJobs(g)])));
  assert.ok(inDual.has('tamer') && inDual.has('monster_master'));
});

test('モンスターの 仲間の 組: 魔物の 仲間だけ（人は 入れない・魔物は ほかの 組に 入れない・「だれでも」の 組では ない）', () => {
  assert.equal(groupJobs(MONSTER_ALLY).size, 0, '職業では うけもてない');
  assert.ok(!ANY_GROUPS.has(MONSTER_ALLY));
  assert.ok(fitsGroup(mon('スラ'), MONSTER_ALLY));
  assert.ok(!fitsGroup(p('戦', 'warrior'), MONSTER_ALLY), '人は 入れない');
  assert.ok(!fitsGroup(mon('スラ', { job: 'tamer' }), DUAL_TECHS.dt_beast_cross.need[0]), '魔物は 魔物使いの 組に 入れない');
  // 魔物使い ＋ 魔物 ＝ ビーストクロス（どちらからでも）
  assert.ok(ids(dualOptions(p('使い', 'tamer'), [mon('スラ')], weaponOk)).includes('dt_beast_cross'));
  assert.ok(ids(dualOptions(mon('スラ'), [p('使い', 'monster_master')], weaponOk)).includes('dt_beast_cross'));
  assert.ok(!ids(dualOptions(p('使い', 'tamer'), [p('戦', 'warrior')], weaponOk)).includes('dt_beast_cross'), '人の 仲間では 出ない');
  // 今の 職業で 判定（前に 魔物使いだった 戦士は 出せない）
  assert.ok(!ids(dualOptions(p('元', 'warrior', { abilities: ['tm_majuu', 'tm_shippu'] }), [mon('スラ')], weaponOk)).length);
  // 大サーカス（おどり）・ワイルドラッシュ（魔物 ＋ こぶし）
  assert.ok(ids(dualOptions(p('使い', 'tamer'), [p('芸', 'performer')], weaponOk)).includes('dt_circus'));
  assert.ok(ids(dualOptions(p('武', 'monk'), [p('使い', 'tamer'), mon('スラ')], weaponOk)).includes('dt_wild_rush'));
  assert.ok(!ids(dualOptions(p('武', 'monk'), [p('使い', 'tamer'), p('戦', 'warrior')], weaponOk)).includes('dt_wild_rush'));
  // 魔物は ほかの 合体技に 入れない（ミナデインの「だれでも」・全員集合も）
  const hero = dualOptions(p('勇', 'hero'), [mon('A'), mon('B'), mon('C')], weaponOk);
  assert.deepEqual(ids(hero), [], '勇者 ＋ 魔物3ひき では ミナデインは 出ない');
  assert.deepEqual(ids(dualOptions(mon('A'), [p('魔', 'mage'), p('魔2', 'mage')], weaponOk)), []);
  // 職業も 魔物でも ない 人は 出せない（前と おなじ）
  assert.deepEqual(ids(dualOptions(p('なし', undefined), [mon('スラ')], weaponOk)), []);
  // メニューの「関係する」: 魔物使いが いれば 出す
  assert.ok(dualRelated('dt_beast_cross', partyJobSet([{ job: 'tamer' }])));
  assert.ok(!dualRelated('dt_beast_cross', partyJobSet([{ job: 'warrior' }, { job: 'mage' }])));
  assert.ok(dualRelated('dt_wild_rush', partyJobSet([{ job: 'monster_master' }, { job: 'monk' }])));
});

test('ほんとうの たたかい: 魔物使い（自分）と 魔物の 仲間で ビーストクロス。2人の 番と MPを 使い、別々より 強い', () => {
  const allies = [{ char: mk('tamer', 'つかい'), controller: 's1' }, { char: mk('MON', 'スラ'), kind: 'support', auto: true }, { char: mk('monk', 'ぶとう'), kind: 'support', auto: true }];
  const b = new Battle({ rng: makeRng(5), allies, enemies: ['rockman'], canFlee: true });
  const t = b.enemies[0];
  t.actions = [{ w: 1, id: 'm_nothing' }];
  t.hp = t.maxHp = 99999;
  t.resist = {};
  const [me, sl, mo] = b.allies;
  for (const a of b.allies) { a.mp = a.maxMp = 99; a.ready = false; a.queued = false; a.atb = 100; }
  me.ready = true;
  const opts = b.dualOptionsFor(me);
  assert.ok(opts.some((o) => o.id === 'dt_wild_rush'), '3人技も');
  const o = opts.find((x) => x.id === 'dt_beast_cross');
  assert.ok(o, 'ビーストクロスを 出せる');
  assert.deepEqual(o.partners, [sl.id]);
  const r = b.command(me.id, { type: 'dual', id: o.id, partner: o.partner, partners: o.partners, target: t.id }, 's1');
  assert.equal(r.ok, true, r.reason);
  let act = null;
  for (let i = 0; i < 400 && !act; i++) act = b.tick(50).find((e) => e.t === 'act' && e.dual);
  assert.equal(act?.dual?.id, 'dt_beast_cross');
  assert.equal(act.name, 'ビーストクロス');
  assert.ok(act.lines.some((l) => l.includes('魔物の仲間がとびかかった')));
  assert.equal(sl.mp, 99 - 3, '魔物の MP');
  assert.equal(me.mp, 99 - 6);
  const dmg = act.results.filter((x) => x.id === t.id && x.dmg > 0).reduce((s, x) => s + x.dmg, 0);
  const solo = [me, sl].reduce((s, m) => s + b.calcPhys(m, t, { mult: 1 }, 1, 'phys', true).dmg, 0);
  assert.ok(dmg >= solo * 1.5, `ビーストクロス ${dmg} は 別々の ふつうの 攻撃 ${solo} の ${(dmg / solo).toFixed(2)}倍`);
  assert.ok(mo.alive);
});

test('メニューの「ひらめき」: その 人が 今 ついている 職業の ひらめき技だけ（掛け合わせ技は その 職業で ひらめける もの）', () => {
  const w = mk('warrior', 'ガルド');
  const list = hiraOfJob(w);
  assert.ok(list.length > 0);
  for (const id of list) assert.equal(ABILITIES[id].job, 'warrior', `${id} は 戦士の 技`);
  // 魔法使いを マスターしていても、パーティーに 魔法使いが いても、戦士の 一覧には 出ない
  w.jobs.mage = { lv: JOB_MAX_LEVEL, b: 999 };
  assert.deepEqual(hiraOfJob(w), list);
  // ひらめいた ほかの 職業の 技も 出さない
  w.hirameki = ['hi_kakushi_bouchou'];
  assert.ok(!hiraOfJob(w).includes('hi_kakushi_bouchou'));
  // 魔法戦士: 魔法剣・メドロ・スターストラッシュ（掛け合わせ技）。戦士・魔法使いの ひらめき技は 出さない
  const mk2 = mk('magic_knight', 'マキ');
  const m = hiraOfJob(mk2);
  for (const id of ['mahouken', 'medoro', 'star_strash']) if (ABILITIES[id]) assert.ok(m.includes(id), id);
  assert.ok(m.every((id) => ABILITIES[id].kind === 'combo' || ABILITIES[id].job === 'magic_knight'), m.join(','));
  assert.ok(!m.some((id) => ABILITIES[id].job === 'warrior' || ABILITIES[id].job === 'mage'));
  // 出す 技は、その 職業で ひらめける もの（hiraAllowed の 中）
  for (const j of ALL_JOBS) {
    for (const id of hiraOfJob({ job: j, jobs: {} })) {
      assert.ok(HIRAMEKI[id], id);
      if (ABILITIES[id].kind !== 'combo') assert.ok(hiraAllowed({ job: j, jobs: {} }, id), `${JOBS[j].name}: ${id}`);
    }
  }
  // 魔物の 仲間・職業の ない 人は なし
  assert.deepEqual(hiraOfJob(newMonsterCompanion({ id: 'm', name: 'スラ', species: 'slime', level: 5 })), []);
  assert.deepEqual(hiraOfJob({ job: null }), []);
  // メニューは hiraOfJob を 使い、説明の 文も「今の職業」
  const src = fs.readFileSync(new URL('../public/js/client/ui/menu.js', import.meta.url), 'utf8');
  const combo = src.slice(src.indexOf("if (mode === 'combo')"), src.indexOf("if (mode === 'fav')"));
  assert.ok(combo.includes('hiraOfJob(c)') && !combo.includes('hiraVisible'));
  assert.ok(combo.includes('今の職業') && !combo.includes('今のパーティー'));
  for (const s of ['の今の職業（', '）でひらめく技だけ出している。ほかの職業の技は、その職業についた時に出る。', '書いてある回数をこえると、その技を使ったしゅんかんに、ひらめくことがある。神殿の「ひらめきの賢者」がヒントを教えてくれる。', 'でひらめく技はない。', '掛け合わせ技（']) {
    assert.ok(combo.includes(s), s);
    assert.deepEqual(checkText(s), [], s);
  }
});
