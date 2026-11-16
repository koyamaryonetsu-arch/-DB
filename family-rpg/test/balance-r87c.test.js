// 第87回 C班（2026年11月）: MP と 看板の 技（docs/plan-balance-r87.md の 1-4・1-5・3-C）
//  ・物理の 職業 19こ: めやすの レベル（基本職 20・上級職 35・超級職 55）で、いちばん MP の 高い 技を 4回 うてる（5回 いじょうには しない）
//  ・看板の 技（さいごに 覚える 技）21こ: 1体が 相手でも、その 職業の 攻撃の 技で いちばん 強い
//    （先に 覚える 同じ 形〈1体／全体〉の 技の 1.1倍 いじょう）。職業の いちばん 強い 技は 前の 1.1倍まで
//  はかり方は tools/job-fit.mjs と 同じ（店の 装備・敵の 守りは 自分の 攻撃力の 4わり・属性なし・1体に 当てた 時の ダメージの 合計）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle } from '../public/js/shared/battle.js';
import { JOBS } from '../public/js/shared/data/jobs.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { makeRng } from '../public/js/shared/rng.js';
import { computeStats } from '../public/js/shared/stats.js';
import { CLONE_MAX } from '../public/js/shared/battle-phantom-a.js';
import { jobChar } from '../tools/sim-jobs.mjs';

const LV = [20, 35, 55, 75, 90], RANK = [4, 6, 8, 10, 12];
const parts = (e) => (e?.type === 'multi' ? e.parts || [] : e ? [e] : []);

// tools/job-fit.mjs の measure と 同じ
function measure(id) {
  const j = JOBS[id]; const t = j.tier || 0;
  const c = jobChar(id, LV[t], RANK[t]);
  const st = computeStats(c);
  const b = new Battle({ rng: makeRng(1), allies: [{ char: c, auto: true, kind: 'support', tactics: 'balanced' }], enemies: ['rockman'], canFlee: false });
  const tg = b.enemies[0]; tg.resist = {}; const me = b.allies[0];
  tg.dfn = tg.def = Math.round(st.atk * 0.4); tg.hp = tg.maxHp = 9999999;
  const sk = j.learn.map(([lv, sid]) => {
    const a = ABILITIES[sid];
    let e = 0;
    for (const p of parts(a.effect)) {
      if (p.type === 'phys') e += b.calcPhys(me, tg, { ...p, element: undefined }, 1, 'phys', true).dmg * ((p.hits || 1) + (p.make && p.dance ? p.dance * Math.min(CLONE_MAX, p.make) : 0));
      else if (p.type === 'magic' && Array.isArray(p.base)) e += b.calcMagic(me, tg, { ...p, element: undefined }, 1, true).dmg * (p.hits || p.r85aHits || 1);
      else if (p.type === 'weatherStrike' && Array.isArray(p.base)) e += b.calcMagic(me, tg, { ...p, type: 'magic', element: undefined }, 1, true).dmg;
    }
    return { lv, sid, name: a.name, mp: a.mp || 0, target: a.target, e: Math.round(e) };
  });
  return { st, sk };
}

// 直した 物理の 職業（MP）
const MP_JOBS = ['warrior', 'monk', 'railman', 'ballplayer', 'schoolkid', 'cook', 'saiyan', 'rurouni', 'hanyo_boy', 'samurai_kid', 'furyo',
  'battlemaster', 'super_saiyan', 'kisatsu', 'hitokiri', 'tessaiga_user', 'raijin_sword', 'reikai_tantei', 'ss2'];

// 看板の 技を 直した 職業 と、直す 前の「職業の いちばん 強い 技」（1体。この 数の 1.1倍まで）
const SIG_JOBS = {
  saiyan: 92, alchemist: 35, middleschooler: 172, train_driver: 216, tabi_madoshi: 236, shogun: 388, keikyu_driver: 360, rubber: 350,
  gold_cardman: 190, keikyu_president: 714, kenshin: 690, kaichou: 580, black_cardman: 648, hiryu_master: 912, rekka: 524,
  pirate_king: 1152, super_hero: 1253, sun_hokage: 1496, facility_ai: 791, dream_stadium: 1155, weather_god: 760,
};

test('r87c: 物理の 職業 19こは、めやすの レベルで いちばん MP の 高い 技を 4回 うてる（5回 いじょうには しない）', () => {
  for (const id of MP_JOBS) {
    const { st, sk } = measure(id);
    const top = Math.max(...sk.map((s) => s.mp));
    const n = st.maxMp / top;
    assert.ok(n >= 4 && n < 5, `${JOBS[id].name}: MP ${st.maxMp} ÷ ${top} = ${n.toFixed(2)}回`);
  }
});

test('r87c: MP を ふやした 分は 使わない 能力から（能力の 合計は かわらない・魔力と 回復は 0.4 いじょう）', () => {
  // 前の 合計（mp・mag・heal の 3つ）
  const SUM3 = {
    warrior: 1.4, monk: 1.7, railman: 2.4, ballplayer: 2.0, schoolkid: 2.85, cook: 3.1, saiyan: 1.8, rurouni: 1.95, hanyo_boy: 1.7, samurai_kid: 1.8,
    furyo: 1.8, battlemaster: 1.6, super_saiyan: 2.0, kisatsu: 1.7, hitokiri: 1.75, tessaiga_user: 1.75, raijin_sword: 2.0, reikai_tantei: 1.9, ss2: 2.2,
  };
  for (const id of MP_JOBS) {
    const m = JOBS[id].mods;
    assert.ok(Math.abs(m.mp + m.mag + m.heal - SUM3[id]) < 1e-9, `${JOBS[id].name}: MP・魔力・回復の 合計`);
    assert.ok(m.mag >= 0.4 && m.heal >= 0.4, `${JOBS[id].name}: 魔力 ${m.mag}・回復 ${m.heal}`);
  }
});

test('r87c: 看板の 技は、1体が 相手でも その 職業の 攻撃の 技で いちばん 強い（先の 同じ 形の 技の 1.1倍 いじょう）', () => {
  for (const id of Object.keys(SIG_JOBS)) {
    const { sk } = measure(id);
    const sig = sk.at(-1);
    assert.equal(sig.lv, 10, `${JOBS[id].name}: 看板は Lv10`);
    for (const s of sk.slice(0, -1)) {
      if (!s.e) continue;
      assert.ok(sig.e >= s.e, `${JOBS[id].name}: 看板「${sig.name}」${sig.e} ＜「${s.name}」${s.e}`);
      if ((s.target === 'enemy') === (sig.target === 'enemy')) assert.ok(sig.e >= s.e * 1.1, `${JOBS[id].name}: 看板「${sig.name}」${sig.e} は「${s.name}」${s.e} の 1.1倍 いじょう`);
    }
  }
});

test('r87c: 職業の いちばん 強い 技（合体技の 強さの もと）は、直す 前の 1.1倍まで', () => {
  for (const [id, before] of Object.entries(SIG_JOBS)) {
    const { sk } = measure(id);
    const top = Math.max(...sk.map((s) => s.e));
    assert.ok(top <= before * 1.1, `${JOBS[id].name}: ${before} → ${top}`);
  }
});

test('r87c: 看板の 追いうちは 敵に ランダム（敵が 多い 時の 強さは 前と 同じ）・看板の MP は かわらない', () => {
  const MP = { sy_bigbang: 12, alchemist_sig: 12, jh_zenkoku: 14, dv_saikou: 15, sg_tenka: 18, kq_kaitoku: 20, go_gear3: 22, gold_cardman_sig: 30,
    keikyu_president_sig: 40, kenshin_sig: 42, kaichou_sig: 42, black_cardman_sig: 42, hiryu_master_sig: 28, rekka_sig: 38, pirate_king_sig: 42,
    super_hero_sig: 44, facility_ai_sig: 46, dream_stadium_sig: 46 };
  for (const [sid, mp] of Object.entries(MP)) {
    const a = ABILITIES[sid];
    assert.equal(a.mp, mp, a.name);
    assert.equal(a.target, 'enemies', a.name);
    const ps = parts(a.effect);
    const extra = ps.filter((p) => p.random || p.r85aHits);
    assert.equal(extra.length, 1, `${a.name}: 追いうちが 1つ`);
    // 全体に 当たる もとの 部分は のこって いる
    assert.ok(ps.some((p) => (p.type === 'phys' || p.type === 'magic') && !p.random && !p.r85aHits), `${a.name}: 敵全体の 部分`);
    const n = extra[0].hits || extra[0].r85aHits;
    assert.ok(a.desc.includes(`ランダムで${n}回`), `${a.name}: 説明に 回数`);
  }
});

test('r87c: 追いうちは 1体の 時 ぜんぶ その 敵に 当たる（戦いで たしかめる）', () => {
  const c = jobChar('pirate_king', 90, 12);
  const b = new Battle({ rng: makeRng(7), allies: [{ char: c }], enemies: ['rockman'], canFlee: false });
  const e = b.enemies[0]; e.hp = e.maxHp = 9999999; e.resist = {};
  const me = b.allies[0]; me.mp = 999;
  const ev = { lines: [], upd: [], results: [] };
  b.applyAbility(me, ABILITIES.pirate_king_sig, { type: 'ability', id: 'pirate_king_sig', target: e.id }, ev, 1, [e]);
  const hits = (ev.results || []).filter((r) => r.id === e.id && (r.dmg > 0 || r.miss));
  assert.ok(hits.length >= 5, `当たった 回数 ${hits.length}`);
});
