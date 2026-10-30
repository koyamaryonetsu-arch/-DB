// 第43回 A: 魔物の 仲間の 見なおし（docs/plan-monsters.md の 2-1・2-2・2-3・6 の A）
//   強さ（育ち・ランクの 強さ）・ランク（めずらしさ。data/monster-ranks.js）・レベルの 上限・配合の あとの 追いつき・SS（ランク配合を やめた）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import {
  MONSTER_FRIENDS, RANKS, rankIdx, rankOf, breedCandidates, monsterLevelCap, LV_CAP_BASE, LV_CAP_RANK,
  BREED_RECIPES, SPECIAL_KINDS, rankUpNeed, rankUpOk,
} from '../public/js/shared/data/companions.js';
import { MONSTER_RANKS } from '../public/js/shared/data/monster-ranks.js';
import { INHERIT_RATE, powerScore } from '../public/js/shared/breed-calc.js';
import {
  computeStats, newMonsterCompanion, gainExp, expForLevel, MON_GROW, MON_GROW_MAX, RANK_MULT, monsterGrowMult,
  catchUpLevel, catchUpExp, CATCH_UP_MULT, MAX_LEVEL,
} from '../public/js/shared/stats.js';
import { addMonsterCompanion, growCompanion } from '../public/js/shared/world/party.js';
import { upgradeSave } from '../public/js/shared/world/save.js';
import { wildRecruits, rankPoints, BANDS } from '../tools/gen-monster-ranks.mjs';
import { Bot } from './helpers.js';

const lv = (species, level = 20, plus = 0, extra = {}) => ({ species, level, plus, ...extra });
const power = (sp, level = 60, plus = 10) => powerScore(computeStats({ species: sp, level, plus, ranked: 1, seeds: {}, equip: {} }));
const median = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
const near = (v, target, tol = 0.1) => Math.abs(v - target) <= target * tol;

// ───────────── 強さ ─────────────
test('強さ: 育ち（レベル 1つで 1.2%・Lv51 で 1.6倍で 止まる）× ランクの 強さ（F 1.00〜SS 1.15）', () => {
  assert.equal(MON_GROW, 0.012);
  assert.equal(MON_GROW_MAX, 0.6);
  assert.deepEqual(RANK_MULT, [1.00, 1.02, 1.04, 1.06, 1.08, 1.10, 1.12, 1.15, 1.15]);
  assert.equal(monsterGrowMult({ species: 'pururin', level: 1 }), 1);
  assert.ok(Math.abs(monsterGrowMult({ species: 'pururin', level: 51 }) - 1.6) < 1e-9);
  assert.equal(monsterGrowMult({ species: 'pururin', level: 51 }), monsterGrowMult({ species: 'pururin', level: 120 }));
  assert.ok(Math.abs(monsterGrowMult({ species: 'ss_oldra', level: 60 }) - 1.6 * 1.15) < 1e-9);
  // からだの 強さ（攻撃力・守備力）にも 育ちが かかる
  const a = computeStats(newMonsterCompanion({ id: 'a', species: 'pururin', level: 60 }));
  const b = computeStats(newMonsterCompanion({ id: 'b', species: 'pururin', level: 30 }));
  assert.ok(a.atk - a.str > 1.4 * 59 * 1.5, `からだの 攻撃力 ${a.atk - a.str}`);
  assert.ok(a.atk > b.atk * 1.8);
});

test('強さの めやす（Lv60・＋10・装備なし。powerScore）: F 約860・S 約950・SS 約1290（±10%）。人（超級・伝説 約1088）の 8〜9わり', () => {
  const wild = Object.keys(MONSTER_FRIENDS).filter((sp) => MONSTERS[sp] && MONSTER_FRIENDS[sp].rank !== 'SS');
  const byRank = (r) => wild.filter((sp) => rankOf(sp, MONSTERS) === r).map((sp) => power(sp));
  const F = median(byRank('F'));
  assert.ok(near(F, 860), `F ${F}`);
  // ふつうの しゅぞく（のびかたの まん中）を S に した とき
  const base = median(wild.map((sp) => power(sp) / RANK_MULT[rankIdx(sp, MONSTERS)]));
  assert.ok(near(base * RANK_MULT[6], 950), `S ${base * RANK_MULT[6]}`);
  // ボス級（SS）
  const SS = median(Object.keys(MONSTER_FRIENDS).filter((sp) => MONSTER_FRIENDS[sp].rank === 'SS').map((sp) => power(sp)));
  assert.ok(near(SS, 1290), `SS ${SS}`);
  // 今 S の しゅぞく（めずらしい 強い 魔物）でも 人の 1.1倍まで
  const S = median(byRank('S'));
  assert.ok(S <= 1088 * 1.1, `S ${S}`);
  // 前（育ち なし）より ずっと 強い
  assert.ok(F > 540 * 1.5);
});

test('能力の 受けつぎ: 3/10ずつ', () => {
  assert.equal(INHERIT_RATE, 0.3);
});

// ───────────── ランク ─────────────
test('ランク: やせいで 仲間に なる 魔物は みんな 表（data/monster-ranks.js）に ある。表は tools/gen-monster-ranks.mjs の 計算と 同じ', () => {
  const wild = wildRecruits();
  assert.ok(wild.length >= 140, `${wild.length}`);
  for (const sp of wild) {
    assert.ok(MONSTER_RANKS[sp], `${sp}: 表に ない（node tools/gen-monster-ranks.mjs で 作りなおす）`);
    assert.equal(MONSTER_RANKS[sp], rankPoints(sp).rank, `${sp}: 表が 古い`);
    assert.equal(rankOf(sp, MONSTERS), MONSTER_RANKS[sp], sp);
  }
  // 表に 入るのは 仲間に なる やせいの 魔物だけ（S まで）
  for (const [sp, r] of Object.entries(MONSTER_RANKS)) {
    assert.ok(MONSTERS[sp] && MONSTER_FRIENDS[sp] && !MONSTER_FRIENDS[sp].breedOnly, sp);
    assert.ok(RANKS.indexOf(r) >= 0 && RANKS.indexOf(r) <= 6, sp);
  }
});

test('ランクの 点: 出やすさ（30%・20%・12%・6%）＋ 夜だけ +1 ＋ 仲間に なりにくさ（0・1・3・4）→ 0〜1 F … 7いじょう S', () => {
  const p = rankPoints('pururin');
  assert.equal(p.ap + p.jp, p.pts);
  assert.equal(p.rank, 'F');
  // はじめの 地方の めったに 出ない 表（2.5%）の きらきらぷるりん・夜だけの いかずちタイガーは S
  assert.equal(rankOf('kirakira', MONSTERS), 'S');
  const t = rankPoints('ikazuchi_tiger');
  assert.equal(t.day, false);
  assert.equal(t.rank, 'S');
  for (const sp of wildRecruits()) {
    const q = rankPoints(sp);
    assert.ok(q.ap >= 0 && q.ap <= 5 && [0, 1, 3, 4].includes(q.jp), sp);
    assert.equal(q.rank, RANKS[q.pts <= 1 ? 0 : Math.min(6, q.pts - 1)], sp);
  }
});

test('ランクの ちらばり: どの 章にも F〜C が いて、B〜S は 少し（2わりまで）。第5章の 魔物は もう ほとんど S では ない', () => {
  const by = {};
  for (const sp of wildRecruits()) {
    const { band } = rankPoints(sp);
    if (!band) continue;
    (by[band] = by[band] || []).push(rankIdx(sp, MONSTERS));
  }
  assert.deepEqual(Object.keys(by).sort(), BANDS.slice().sort());
  for (const b of BANDS) {
    const list = by[b];
    for (let r = 0; r <= 3; r++) assert.ok(list.includes(r), `${b}: ${RANKS[r]} が いない`);
    const high = list.filter((r) => r >= 4).length;
    // 第53回: 第6章 Step 6 の 時計塔の 魔物は、配合で 足りない B〜S を うめる（docs/plan-r53-breed-more.md の 1）ので 3わりまで
    const cap = b === '第6章' ? 0.34 : 0.2;
    assert.ok(high <= Math.max(2, list.length * cap), `${b}: B〜S ${high}/${list.length}`);
  }
  const all = Object.values(by).flat();
  assert.ok(all.filter((r) => r === 6).length <= 10, 'S は 少し');
});

test('ランク: ボス級は SS（MONSTER_FRIENDS の rank）。配合だけの 魔物は 親の きまり（特定配合の 子は 親の 高いほうの 1つ上・A まで）', () => {
  for (const sp of Object.keys(MONSTER_FRIENDS)) if (MONSTER_FRIENDS[sp].rank === 'SS') assert.equal(rankOf(sp, MONSTERS), 'SS');
  for (const sp of Object.keys(MONSTER_FRIENDS)) {
    if (!MONSTER_FRIENDS[sp].breedOnly || MONSTER_FRIENDS[sp].rank) continue;
    assert.ok(rankIdx(sp, MONSTERS) <= 5, `${sp}: A まで`);
    const rs = BREED_RECIPES.filter((r) => r.child === sp && (typeof r.a === 'string' || typeof r.b === 'string'));
    if (!rs.length) continue;
    const want = Math.min(...rs.map((r) => Math.min(5, Math.max(...[r.a, r.b].filter((x) => typeof x === 'string').map((x) => rankIdx(x, MONSTERS))) + 1)));
    assert.equal(rankIdx(sp, MONSTERS), want, sp);
  }
});

// ───────────── レベルの 上限 ─────────────
test('レベルの 上限: F 70・ランク 1つで +10（S 130・SS 140）・＋1 ごとに +1・150 まで。今の レベルより 下げない', () => {
  assert.equal(LV_CAP_BASE, 70);
  assert.equal(LV_CAP_RANK, 10);
  const m = (species, level = 1, plus = 0) => ({ ...newMonsterCompanion({ id: 'x', species, level }), plus });
  assert.equal(monsterLevelCap(m('pururin'), MONSTERS), 70);
  assert.equal(monsterLevelCap(m('kirakira'), MONSTERS), 130);
  assert.equal(monsterLevelCap(m('ss_gaia'), MONSTERS), 140);
  assert.equal(monsterLevelCap(m('ss_gaia', 1, 7), MONSTERS), 147);
  assert.equal(monsterLevelCap(m('ss_gaia', 1, 40), MONSTERS), MAX_LEVEL);
  // 前の きまりで 上限より 上まで 育った 仲間（ランクが 下がった 時も）: 今の レベルが 上限
  const big = m('pururin', 95);
  assert.equal(monsterLevelCap(big, MONSTERS), 95);
  const before = big.level;
  gainExp(big, expForLevel(120) - big.exp);
  assert.equal(big.level, before, '下がらない・上がらない');
  // ランクが 上の 魔物は 上限まで 育つ
  const s = m('kirakira', 1);
  gainExp(s, expForLevel(140));
  assert.equal(s.level, 130);
});

// ───────────── 追いつき ─────────────
test('追いつき: 強いほうの 親の レベルの 3/4 までは 経験値 3倍。追いついたら ふつう（catchUp を 消す）', () => {
  assert.equal(CATCH_UP_MULT, 3);
  assert.equal(catchUpLevel({ level: 40 }, { level: 21 }), 30);
  assert.equal(catchUpLevel({ level: 10 }, { level: 11 }), 8);
  const kid = newMonsterCompanion({ id: 'k', species: 'wolf', level: 1 });
  kid.catchUp = 10;
  const e = 5;
  gainExp(kid, e);
  assert.equal(kid.exp, e * 3);
  // 追いつくまで 3倍
  gainExp(kid, Math.ceil((expForLevel(10) - kid.exp) / 3));
  assert.ok(kid.level >= 10, `${kid.level}`);
  assert.equal(kid.catchUp, undefined, '追いついたら 消える');
  const x = kid.exp;
  gainExp(kid, 7);
  assert.equal(kid.exp, x + 7, 'そのあとは ふつう');
  // 人には かからない
  assert.equal(catchUpExp({ level: 1, catchUp: 50 }, 5), 5);
  assert.equal(catchUpExp({ species: 'wolf', level: 1, catchUp: 50 }, 5), 15);
  // 上限で 止まった 子の 追いつきも 消える
  const capped = { ...newMonsterCompanion({ id: 'c', species: 'pururin', level: 1 }), catchUp: 100 };
  gainExp(capped, expForLevel(90));
  assert.equal(capped.level, 70);
  assert.equal(capped.catchUp, undefined);
});

test('追いつき: ほんとうに 配合すると 子に catchUp。戦いの 経験値（growCompanion）が 3倍', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(43), rateLimit: false });
  const bot = new Bot(world, 'モモ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  c.flags.monster_bond = true;
  const a = addMonsterCompanion(world, bot.s, 'wolf', 40), b = addMonsterCompanion(world, bot.s, 'frog', 21);
  bot.send({ t: 'svc', kind: 'tavern', action: 'breed', a: a.key, b: b.key });
  const r = bot.msgs.filter((m) => m.t === 'svcRes').pop();
  assert.ok(r.ok, r.text);
  const kid = c.companions[c.companions.length - 1].char;
  assert.equal(kid.level, 1);
  assert.equal(kid.catchUp, 30);
  growCompanion(kid, 10);
  assert.equal(kid.exp, 30);
});

// ───────────── SS ─────────────
test('SS: ランク配合（S どうし → SS）は ない。SS は 素材配合（品）と 4体配合だけ', () => {
  assert.ok(!SPECIAL_KINDS.includes('rank'));
  assert.deepEqual(SPECIAL_KINDS.slice(0, 2), ['four', 'material']);
  const S = Object.keys(MONSTER_FRIENDS).filter((sp) => MONSTERS[sp] && rankIdx(sp, MONSTERS) === 6);
  assert.ok(S.length >= 2);
  for (const x of S) for (const y of S) {
    const o = breedCandidates(lv(x, 80, 30), lv(y, 80, 30), MONSTERS, { items: [] });
    for (const it of o.items) {
      assert.notEqual(it.kind, 'rank');
      if (MONSTER_FRIENDS[it.sp].rank === 'SS') assert.ok(['four', 'material'].includes(it.kind), `${x}＋${y} → ${it.sp}`);
    }
  }
  // 品が あれば 素材配合
  const o = breedCandidates(lv('ikazuchi_tiger', 20), lv('great_dragon', 20), MONSTERS, { items: [{ id: 'gaia_fang_charm', n: 1 }] });
  assert.equal(o.items[0].sp, 'ss_gaia');
  assert.equal(o.items[0].kind, 'material');
});

test('1つ上の ランク: B→A は 両親の レベルの 合計 80・A→S は 100（それより 下は 20＋8×ランク）', () => {
  assert.equal(rankUpNeed(0), 20);
  assert.equal(rankUpNeed(1), 28);
  assert.equal(rankUpNeed(3), 44);
  assert.equal(rankUpNeed(4), 80);
  assert.equal(rankUpNeed(5), 100);
  assert.ok(!rankUpOk(lv('x', 49), lv('y', 50), 5));
  assert.ok(rankUpOk(lv('x', 50), lv('y', 50), 5));
  assert.ok(rankUpOk(lv('x', 40), lv('y', 38, 4), 4));
});

// ───────────── むかしの セーブ ─────────────
test('むかしの セーブ: 今の 仲間の レベルは 下げない。前から いる SS は そのまま。catchUp が なくても ふつうに 育つ', () => {
  const mon = (key, species, level, extra = {}) => ({ key, kind: 'monster', species, char: { id: `c_old:${key}`, name: 'まもの', species, level, exp: expForLevel(level), hp: 10, mp: 0, equip: {}, ...extra } });
  const old = {
    characters: {
      c_old: {
        id: 'c_old', name: 'ソラ', job: 'warrior', level: 90, exp: expForLevel(90), gold: 10, hp: 40, mp: 5, look: {},
        jobs: { warrior: { lv: 5 } }, equip: {}, items: [], flags: { p_opening: true, monster_bond: true }, kills: {},
        bestiary: {},
        companions: [
          // 第35回より 前の 仲間（ranked なし）・前の きまりで 上限まで 育った 第5章の 魔物（前は S で 80 まで）・SS
          mon('m0', 'pururin', 99),
          mon('m1', 'gaia_larva', 80, { ranked: 1, plus: 0 }),
          mon('m2', 'ss_oldra', 85, { ranked: 1, plus: 3 }),
        ],
        pos: { map: 'overworld', x: 30.5, y: 100.5, dir: 'down' },
      },
    },
  };
  const { data } = upgradeSave(old);
  const c = data.characters.c_old;
  const [m0, m1, m2] = c.companions.map((e) => e.char);
  assert.deepEqual(c.companions.map((e) => e.species), ['pururin', 'gaia_larva', 'ss_oldra']);
  assert.equal(monsterLevelCap(m0, MONSTERS), MAX_LEVEL, 'ranked なしは 150 まで');
  assert.equal(m1.level, 80);
  assert.ok(monsterLevelCap(m1, MONSTERS) >= 80, '下げない');
  gainExp(m1, expForLevel(140) - m1.exp);
  assert.equal(m1.level, 80, 'それより 上には 上がらない');
  assert.equal(rankOf('ss_oldra', MONSTERS), 'SS');
  assert.equal(monsterLevelCap(m2, MONSTERS), 143);
  const e = m2.exp;
  gainExp(m2, 11);
  assert.equal(m2.exp, e + 11, '追いつき なし');
  assert.ok(computeStats(m2).maxHp > 0);
});
