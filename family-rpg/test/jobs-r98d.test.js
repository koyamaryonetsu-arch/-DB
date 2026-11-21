// 第98回 K4班: きずなの職業 3つ（元ヤンのけいじ・おてんき格闘流の師はん・等価交かんの大魔道士）の テスト（docs/plan-kizuna-jobs.md の 7・実装メモ）
//   jobs-r98a.test.js（K1班）と おなじ 見方: なり方・条件・技（看板の きまり）・強さの はんい・親の しくみ（れい丸・すがたと 天気・となえる）・
//   両方の 流れ（いらい・まぼろしの回ろう）・幻の書・オート・絵・引っこしコード
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JOBS, ALL_JOBS, PHANTOM_ORDER, PHANTOM_LIVE, JOB_HINTS, JOB_MAX_LEVEL, jobAncestry } from '../public/js/shared/data/jobs.js';
import { KIZUNA_IDS, isKizuna, kizunaOf } from '../public/js/shared/data/kizuna.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { HIRAMEKI, HIRA_ABILITIES } from '../public/js/shared/data/hirameki.js';
import { R84A_JOBS } from '../public/js/shared/data/jobs-r84a.js';
import { R84B_JOBS } from '../public/js/shared/data/jobs-r84b.js';
import { R85A_JOBS } from '../public/js/shared/data/jobs-r85a.js';
import { PHANTOM_JOBS, PHANTOM_TAGS, abilityTags, phantomReady, phantomBook, phantomRumors, phantomCondText } from '../public/js/shared/data/phantom.js';
import { JOB_SAY } from '../public/js/shared/data/job-talk.js';
import { TRIAL_WORDS } from '../public/js/shared/data/job-trials.js';
import { JOB_TAGS } from '../public/js/shared/data/job-tags.js';
import { VEHICLES, VEHICLE_ORDER } from '../public/js/shared/data/vehicles.js';
import { RIVAL_DOORS } from '../public/js/shared/data/rivals-r88.js';
import { FAMILY_QUESTS } from '../public/js/shared/data/sidequests-family.js';
import { jobLine } from '../public/js/shared/data/fq-common.js';
import { PHANTOM_ADJ } from '../public/js/shared/battle-trial.js';
import { newCharacter, gainExp, expForLevel, fullHeal, computeStats, jobUnlocked } from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';
import { reiMax, reiLeft, reiLowMult } from '../public/js/shared/battle-r84a.js';
import { formPct, formOf, r84bTurnStart } from '../public/js/shared/battle-r84b.js';
import { chanting, r85aLocked } from '../public/js/shared/battle-r85a.js';
import { kizunaPlan } from '../public/js/shared/battle-kizuna.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { jobChar } from '../tools/sim-jobs.mjs';
import { checkText, gameFiles } from '../tools/kanji-check.mjs';
import { KIZUNA_ART, KIZUNA_ANIMS, KIZUNA_OUTFIT as JOB_OUTFIT, playKizunaFx } from '../public/js/client/render/kizuna-art.js';
import { jobBody } from '../public/js/client/render/hero-outfit.js';
import { VEHICLE_ART, vehicleFrames } from '../public/js/client/render/vehicle-art.js';
import { biggestChar } from './transfer-big-save.js';
import { exportCode, splitCode, LINE_MAX } from '../public/js/shared/world/transfer.js';

const NEW = ['motoyan_keiji', 'otenki_shihan', 'touka_madoushi'];
const REQ = { motoyan_keiji: ['makai_prince', 'triple_face'], otenki_shihan: ['hiryu_master', 'tenkou_tsukai'], touka_madoushi: ['doramata', 'truth_gate'] };
// 新しい 系統（1つめの 親）の 一覧・作品（まぼろしの回ろうの とびら）
const LINE = { motoyan_keiji: R84A_JOBS, otenki_shihan: R84B_JOBS, touka_madoushi: R85A_JOBS };
const WORK = { motoyan_keiji: 'yuhaku', otenki_shihan: 'ranma', touka_madoushi: 'slayers' };
// 技の もと（親の 2つから 4こずつ ＋ かけ合わせ 1こ）
const FROM = {
  motoyan_keiji: { makai_prince: ['ky_reigan', 'ky_harikomi', 'ky_siren', 'ky_kiai'], triple_face: ['ky_jab', 'ky_kikikomi', 'ky_kakuho', 'ky_katsudon'] },
  otenki_shihan: { hiryu_master: ['ot_kaburu', 'ot_amatsubu', 'ot_kokoro', 'ot_hiryu'], tenkou_tsukai: ['ot_niwaka', 'ot_hare', 'ot_inazuma', 'ot_taifuu'] },
  touka_madoushi: { doramata: ['tk_flare', 'tk_blade', 'tk_teishoku', 'tk_zoufuku'], truth_gate: ['tk_touka', 'tk_toride', 'tk_yari', 'tk_meguri'] },
};
const KEYS = ['hp', 'mp', 'str', 'def', 'agi', 'mag', 'heal'];
const sum = (m) => KEYS.reduce((s, k) => s + m[k], 0);
const textOk = (s, what) => assert.deepEqual(checkText(s), [], `${what}: ${s}`);
const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
const parts = (e) => (e?.type === 'multi' ? e.parts || [] : e ? [e] : []);

// ───────────── データ ─────────────
test('第98回 K4: 3つの きずなの職業（tier 4・req 2つ・幻の はんい・ならびの さいごの 方・1つ 1ファイル）', () => {
  for (const id of NEW) assert.ok(KIZUNA_IDS.includes(id), id);
  // 前の 16この 幻と K1班の 2つの あと（掲示板の しるしの 番号は かわらない）。きずなの職業の じゅんが PHANTOM_ORDER の じゅん
  assert.deepEqual(PHANTOM_ORDER.slice(16), KIZUNA_IDS);
  assert.deepEqual(PHANTOM_ORDER.slice(16, 18), ['kuuchou_master', 'hachiryu_hokage']);
  const at = NEW.map((id) => PHANTOM_ORDER.indexOf(id));
  assert.ok(at.every((i, k) => i >= 18 && (k === 0 || i > at[k - 1])), `${at}`);
  for (const id of NEW) {
    const j = JOBS[id];
    assert.equal(kizunaOf(id).job, j);
    assert.ok(isKizuna(id));
    assert.equal(j.tier, 4);
    assert.ok(PHANTOM_LIVE.includes(id) && ALL_JOBS.filter((x) => x === id).length === 1);
    assert.deepEqual(j.req, REQ[id]);
    assert.deepEqual(PHANTOM_JOBS[id].masters, REQ[id]);
    assert.ok(!j.reqSuper && !j.reqAlt);
    const s = sum(j.mods);
    assert.ok(s >= 10.85 - 1e-9 && s <= 11.9 + 1e-9, `${id}: 合計 ${s}`);
    for (const t of [j.name, j.desc, JOB_HINTS[id], JOB_SAY[id], TRIAL_WORDS[id], PHANTOM_JOBS[id].name]) textOk(t, id);
    assert.equal(PHANTOM_JOBS[id].name, j.name);
    assert.ok(TRIAL_WORDS[id].length <= 32);
    assert.ok(JOB_SAY[id].length <= 24, JOB_SAY[id]);
    assert.equal(ALL_JOBS.filter((x) => JOBS[x].name === j.name).length, 1, j.name);
    assert.equal(ALL_JOBS.filter((x) => JOBS[x].short === j.short).length, 1, j.short);
    assert.ok(!JOB_HINTS[id].includes(j.name) && !/[0-9０-９]{3}/.test(JOB_HINTS[id]), JOB_HINTS[id]);
    assert.ok(JOB_TAGS[id]?.length >= 2 && !JOB_TAGS[id].includes('fire'), '炎の 組は 職業 20 まで');
  }
  // 剣・こぶしの 組は いっぱい（test/dual-r31）: K4班は 元ヤンのけいじ だけ こぶし（3つ ふえて わくが 1つ ふえた ぶん）
  assert.ok(JOB_TAGS.motoyan_keiji.includes('fist'));
  for (const id of ['otenki_shihan', 'touka_madoushi']) assert.ok(!JOB_TAGS[id].includes('fist') && !JOB_TAGS[id].includes('sword'), id);
  // 名前は 家族が きめた 名前の まま（「換」だけ かな）
  assert.deepEqual(NEW.map((id) => JOBS[id].name), ['元ヤンのけいじ', 'おてんき格闘流の師はん', '等価交かんの大魔道士']);
});

test('第98回 K4: 親は 新しい 系統の 伝説 ＋ もとからの 流れの いちばん 上（天気の 流れは 伝説が ない ので 超級職）', () => {
  for (const id of NEW) {
    const [a, b] = REQ[id];
    assert.equal(JOBS[a].tier, 3, `${a} は 伝説`);
    assert.ok(LINE[id].includes(a), `${a} は 新しい 系統`);
    assert.ok(!LINE[id].includes(b));
    for (const p of [a, b]) {
      // その 流れの いちばん 上（幻の職業 いがいで p を 条件に する 職業は ない）
      const next = ALL_JOBS.filter((x) => (JOBS[x].tier || 0) < 4 && [JOBS[x].req, JOBS[x].reqAlt].flat().includes(p));
      assert.deepEqual(next, [], `${p} の 上`);
    }
  }
  assert.equal(JOBS.triple_face.tier, 3);
  assert.equal(JOBS.truth_gate.tier, 3);
  // 天気の 流れ（気象予報士 → お天気キャスター → 天候をあやつる者）には 伝説が ない
  assert.equal(JOBS.tenkou_tsukai.tier, 2);
  const weatherLine = ALL_JOBS.filter((x) => jobAncestry(x).has('kishou') && (JOBS[x].tier || 0) < 4);
  assert.deepEqual(weatherLine.filter((x) => JOBS[x].tier === 3), []);
  assert.ok(jobAncestry('triple_face').has('police') && jobAncestry('triple_face').has('koan_zero'));
  assert.ok(jobAncestry('tenkou_tsukai').has('otenki_caster') && jobAncestry('tenkou_tsukai').has('kishou'));
  assert.ok(jobAncestry('truth_gate').has('fullmetal') && jobAncestry('truth_gate').has('alchemist'));
});

test('第98回 K4: なり方の 条件（今 ある タグと 数だけ・2つ きわめて 条件を みたすと なれる）', () => {
  assert.equal(PHANTOM_TAGS.length, 23, 'タグは 足して いない（引っこしコードの 番号は そのまま）');
  const old = PHANTOM_ORDER.slice(0, 16).flatMap((id) => PHANTOM_JOBS[id].conds);
  for (const id of NEW) {
    assert.equal(PHANTOM_JOBS[id].conds.length, 3);
    for (const cd of PHANTOM_JOBS[id].conds) {
      textOk(cd.text, id);
      if (cd.use) for (const t of cd.use) assert.ok(PHANTOM_TAGS.includes(t), t);
      const same = old.filter((x) => (cd.use ? x.use : x.stat === cd.stat));
      assert.ok(cd.goal <= Math.max(...same.map((x) => x.goal)) && cd.goal >= Math.min(...same.map((x) => x.goal)), `${cd.text}`);
    }
    textOk(phantomCondText(id), id);
    const c = newCharacter({ id: 'x', name: 'x', job: 'warrior' });
    assert.equal(jobUnlocked(c, id), false);
    master(c, ...REQ[id]);
    assert.equal(phantomReady(c, id), false, '条件が まだ');
    assert.equal(jobUnlocked(c, id), false);
    c.feats = { use: {}, dmg: 0, dmgSpell: 0, dmgFire: 0, heal: 0, crit: 0, big5000: 0 };
    for (const cd of PHANTOM_JOBS[id].conds) {
      if (cd.use) c.feats.use[cd.use[0]] = cd.goal;
      else c.feats[cd.stat] = cd.goal;
    }
    assert.equal(phantomReady(c, id), true);
    assert.equal(jobUnlocked(c, id), true);
  }
  // その 職業の 技も 条件の タグに 数える（自分の 職業で 条件を すすめられる）
  for (const s of ['ky_reigan', 'ky_jab', 'motoyan_keiji_sig', 'ot_amatsubu', 'ot_inazuma', 'otenki_shihan_sig']) assert.ok(abilityTags(s).includes('fist'), s);
  assert.ok(abilityTags('ky_kikikomi').includes('debuff'));
  for (const s of ['ot_niwaka', 'otenki_shihan_sig']) assert.ok(abilityTags(s).includes('rain'), s);
  assert.ok(abilityTags('ot_hare').includes('sun'));
  for (const s of ['tk_flare', 'tk_blade', 'touka_madoushi_sig']) assert.ok(abilityTags(s).includes('attackSpell'), s);
  for (const s of ['tk_touka', 'tk_toride']) assert.ok(abilityTags(s).includes('support'), s);
});

// ───────────── 技 ─────────────
test('第98回 K4: 技 10こ（親の 2つから 4こずつ ＋ かけ合わせ 1こ ＋ ひらめき技 1こ）・文字・えんしゅつ', () => {
  for (const id of NEW) {
    const j = JOBS[id];
    assert.equal(j.learn.length, 9);
    assert.equal(j.learn.at(-1)[0], 10);
    assert.equal(j.learn.at(-1)[1], `${id}_sig`);
    const ids = j.learn.map(([, a]) => a);
    const fromIds = Object.values(FROM[id]).flat();
    assert.equal(fromIds.length, 8);
    assert.deepEqual([...ids.slice(0, -1)].sort(), [...fromIds].sort());
    for (const p of Object.keys(FROM[id])) assert.ok(REQ[id].includes(p) && FROM[id][p].length === 4);
    const hira = Object.keys(kizunaOf(id).hira.abilities);
    assert.equal(hira.length, 1);
    for (const a of [...ids, ...hira]) {
      const ab = ABILITIES[a] || HIRA_ABILITIES[a];
      assert.ok(ab, a);
      assert.equal(ab.job, id, a);
      for (const t of [ab.name, ab.desc, ab.cast]) textOk(t, a);
      assert.equal(Object.values(ABILITIES).filter((x) => x.name === ab.name).length, 1, ab.name);
      assert.ok(ab.anim, a);
    }
    for (const h of hira) for (const k of Object.keys(HIRAMEKI[h].from)) assert.ok(ids.includes(k), k);
    // 看板の えんしゅつ
    assert.ok(KIZUNA_ANIMS.has(`${id}_sig`));
  }
  const fake = new Proxy({}, { get: () => () => undefined });
  for (const a of ['motoyan_keiji_sig', 'otenki_shihan_sig', 'touka_madoushi_sig', 'kizuna_seoi', 'kizuna_niji', 'kizuna_rensei']) {
    assert.ok(KIZUNA_ANIMS.has(a), a);
    assert.equal(playKizunaFx(fake, a, [{ x: 100, y: 60 }, { x: 140, y: 64 }], null, {}), true, a);
  }
  // 親の しくみを データで つなぐ（新しい しくみは 作らない）: れい丸 6発・すがた 25%（どちらも 伝説と おなじ）
  assert.equal(JOBS.motoyan_keiji.reiMax, 6);
  assert.equal(JOBS.otenki_shihan.formPct, 0.25);
  assert.equal(ABILITIES.ot_kaburu.effect.type, 'r84bForm');
  assert.equal(ABILITIES.ot_hiryu.effect.type, 'r84bHiryu');
  assert.deepEqual(parts(ABILITIES.tk_touka.effect).map((p) => p.type), ['r85aChant', 'overtime']);
  for (const s of ['tk_blade', 'touka_madoushi_sig']) assert.ok(ABILITIES[s].effect.r85aBig, s);
});

// balance-r87c と おなじ はかり方（Lv90・ランク12・敵の 守りは 攻撃力の 4わり・1体に 当てた ダメージ）
const LV = [20, 35, 55, 75, 90], RANK = [4, 6, 8, 10, 12];
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
      if (p.type === 'phys') e += b.calcPhys(me, tg, { ...p, element: undefined }, 1, 'phys', true).dmg * (p.hits || 1);
      else if (p.type === 'magic' && Array.isArray(p.base)) e += b.calcMagic(me, tg, { ...p, element: undefined }, 1, true).dmg;
    }
    return { lv, name: a.name, mp: a.mp || 0, target: a.target, e: Math.round(e) };
  });
  return { st, sk };
}

test('第98回 K4: 看板の きまり（いちばん 強い・同じ 形の 技の 1.1倍 いじょう・今の 幻の いちばん 強い 技を こえない・MP は 4回 いじょう）', () => {
  const oldTop = Math.max(...PHANTOM_ORDER.slice(0, 16).map((id) => Math.max(...measure(id).sk.map((s) => s.e))));
  for (const id of NEW) {
    const { st, sk } = measure(id);
    const sig = sk.at(-1);
    assert.ok(sig.e > 0, sig.name);
    for (const s of sk.slice(0, -1)) {
      if (!s.e) continue;
      assert.ok(sig.e >= s.e, `${sig.name} ${sig.e} ＜ ${s.name} ${s.e}`);
      if ((s.target === 'enemy') === (sig.target === 'enemy')) assert.ok(sig.e >= s.e * 1.1, `${sig.name} ${sig.e} は ${s.name} ${s.e} の 1.1倍 いじょう`);
    }
    assert.ok(sig.e <= oldTop, `${sig.name} ${sig.e} ＞ 今の 幻の いちばん 強い 技 ${oldTop}`);
    const top = Math.max(...sk.map((s) => s.mp));
    assert.ok(st.maxMp / top >= 4, `${id}: MP ${st.maxMp} ÷ ${top}`);
  }
});

// ───────────── 戦い ─────────────
function mk(job, lv = 80) {
  const c = newCharacter({ id: job, name: job, job: 'monk' });
  gainExp(c, expForLevel(lv));
  master(c, ...REQ[job] || [], job);
  c.job = job;
  fullHeal(c);
  return c;
}
const newEv = () => ({ lines: [], upd: [], results: [] });
function solo(job, seed = 1, enemies = ['rockman']) {
  const b = new Battle({ rng: makeRng(seed), allies: [{ char: mk(job) }], enemies, canFlee: false });
  for (const e of b.enemies) { e.hp = e.maxHp = 9999999; e.resist = {}; }
  const u = b.allies[0]; u.mp = 999;
  return { b, u, e: b.enemies[0] };
}

test('第98回 K4: 元ヤンのけいじ（れい丸 6発・のこりが 少ないほど 強い 一発・当てた 敵を たいほ〈動きを 止める〉）', () => {
  const { b, u, e } = solo('motoyan_keiji');
  assert.equal(reiMax(u), 6);
  assert.equal(reiLeft(u), 6);
  // のこりが 少ないほど 強い（まんたん ×1・のこり 1発で ×1.8）
  const low = ABILITIES.motoyan_keiji_sig.effect.parts[0].rei;
  assert.equal(reiLowMult(u, low, 6), 1);
  assert.ok(Math.abs(reiLowMult(u, low, 1) - 1.8) < 1e-9);
  assert.ok(reiLowMult(u, low, 3) > 1 && reiLowMult(u, low, 3) < reiLowMult(u, low, 1));
  const shoot = (left) => {
    let dmg = 0, stop = 0;
    for (let i = 0; i < 30; i++) {
      u.r84aRei = left; e.atb = 60; e.status = {};
      const ev = newEv();
      b.applyAbility(u, ABILITIES.motoyan_keiji_sig, { type: 'ability', id: 'motoyan_keiji_sig' }, ev, 1);
      dmg += ev.results.filter((r) => r.id === e.id && r.dmg > 0).reduce((s, r) => s + r.dmg, 0);
      if (e.atb < 60) stop++;
      assert.equal(reiLeft(u), left - 1, '1発 使う');
    }
    return { dmg, stop };
  };
  const full = shoot(6), last = shoot(1);
  assert.ok(last.dmg > full.dmg * 1.5, `${full.dmg} → ${last.dmg}`);
  assert.ok(full.stop >= 20 && last.stop >= 20, `たいほ ${full.stop}・${last.stop}`);
  // れい丸が ない ＝ えらべない（今 ある きまり）
  u.r84aRei = 0;
  assert.equal(b.validate?.(u, { type: 'ability', id: 'motoyan_keiji_sig' })?.ok ?? false, false);
  // ねばりの張りこみで 2発 もどる
  const ev = newEv();
  b.applyAbility(u, ABILITIES.ky_harikomi, { type: 'ability', id: 'ky_harikomi' }, ev, 1);
  assert.equal(reiLeft(u), 2);
});

test('第98回 K4: おてんき格闘流の師はん（雨を よぶと 自分で 水の すがた・晴れで お湯に もどる・雨の 中は 水の 力が 強い）', () => {
  const { b, u } = solo('otenki_shihan', 2);
  assert.equal(formPct(u), 0.25);
  assert.equal(formOf(u), 'oyu', 'はじめは お湯（今の きまり）');
  let ev = newEv();
  b.applyAbility(u, ABILITIES.otenki_shihan_sig, { type: 'ability', id: 'otenki_shihan_sig' }, ev, 1);
  assert.equal(b.weather?.kind, 'rain');
  assert.equal(b.weather.side, 'ally');
  // 自分の 番の はじめに 水の すがたへ（battle-r84b.js の r84bTurnStart。今 ある きまり）
  ev = newEv();
  r84bTurnStart(b, u, ev);
  assert.equal(formOf(u), 'mizu');
  assert.ok(ev.lines.some((l) => l.includes('水のすがた')), ev.lines.join('/'));
  // 晴れよほうで お湯に もどる
  ev = newEv();
  b.applyAbility(u, ABILITIES.ot_hare, { type: 'ability', id: 'ot_hare' }, ev, 1);
  assert.equal(b.weather?.kind, 'sun');
  ev = newEv();
  r84bTurnStart(b, u, ev);
  assert.equal(formOf(u), 'oyu');
  // にわか雨よほうでも 雨
  ev = newEv();
  b.applyAbility(u, ABILITIES.ot_niwaka, { type: 'ability', id: 'ot_niwaka' }, ev, 1);
  assert.equal(b.weather?.kind, 'rain');
});

test('第98回 K4: 等価交かんの大魔道士（HP を はらって となえ、すぐ もう 1回 動ける・大砲は となえて いる 時だけ・定食で HP が もどる）', () => {
  const { b, u, e } = solo('touka_madoushi', 3);
  assert.equal(r85aLocked(u, ABILITIES.touka_madoushi_sig), true, 'となえて いないと うてない');
  const hp0 = u.hp;
  let ev = newEv();
  b.applyAbility(u, ABILITIES.tk_touka, { type: 'ability', id: 'tk_touka' }, ev, 1);
  assert.ok(u.hp < hp0, 'HP を はらう');
  assert.equal(hp0 - u.hp, Math.round(u.maxHp * 0.12));
  assert.ok(chanting(u));
  assert.equal(ev.atbAfter, 100, 'すぐ もう 1回 動ける');
  assert.equal(r85aLocked(u, ABILITIES.touka_madoushi_sig), false);
  ev = newEv();
  b.applyAbility(u, ABILITIES.touka_madoushi_sig, { type: 'ability', id: 'touka_madoushi_sig' }, ev, 1);
  assert.ok(ev.results.some((r) => r.id === e.id && r.dmg > 0));
  assert.ok(!chanting(u), 'うつと 消える');
  // 大ぐい定食で HP が もどる
  const hp1 = u.hp;
  ev = newEv();
  b.applyAbility(u, ABILITIES.tk_teishoku, { type: 'ability', id: 'tk_teishoku' }, ev, 1);
  assert.ok(u.hp > hp1);
  // HP が 1 の 時は はらえない（社ちくの きまりの まま。ただで 何回も 動けない）
  u.hp = 1;
  ev = newEv();
  b.applyAbility(u, ABILITIES.tk_touka, { type: 'ability', id: 'tk_touka' }, ev, 1);
  assert.equal(u.hp, 1);
  assert.notEqual(ev.atbAfter, 100);
});

test('第98回 K4: オート（その 職業の 技を 持つ 人だけ・ボスで かけ合わせの 技・ガンガンは 攻撃だけ）', () => {
  const w = jobChar('warrior', 50, 7);
  const b0 = new Battle({ rng: makeRng(1), allies: [{ char: w, auto: true }], enemies: ['rockman'], canFlee: false });
  assert.equal(kizunaPlan(b0, b0.allies[0], b0.enemies, [], b0.allies, {}), null);
  const count = (job, tactics, prep, n = 60) => {
    const b = new Battle({ rng: makeRng(4), allies: [{ char: mk(job), auto: true, tactics }], enemies: ['rockman'], canFlee: false });
    const u = b.allies[0];
    b.enemies[0].boss = true;
    b.boss = true;
    const seen = {};
    for (let i = 0; i < n; i++) {
      prep(b, u);
      const id = decideAlly(b, u)?.id;
      seen[id] = (seen[id] || 0) + 1;
    }
    return seen;
  };
  // 元ヤンのけいじ: のこりが 少ない 時に 最後の一発
  const k = count('motoyan_keiji', 'balanced', (b, u) => { u.mp = 999; u.r84aRei = 1; });
  assert.ok((k.motoyan_keiji_sig || 0) > 20, JSON.stringify(k));
  // おてんき格闘流の師はん: 雨が ない 時に 看板（雨を よぶ）
  const o = count('otenki_shihan', 'balanced', (b, u) => { u.mp = 999; b.weather = null; });
  assert.ok((o.otenki_shihan_sig || 0) > 20, JSON.stringify(o));
  // 等価交かんの大魔道士: となえて いない 時に とうか交かん・ガンガンでは 補助なので えらばない（第96回の きまり）
  const t = count('touka_madoushi', 'balanced', (b, u) => { u.mp = 999; u.hp = u.maxHp; delete u.r85aChant; });
  assert.ok((t.tk_touka || 0) > 20, JSON.stringify(t));
  const ta = count('touka_madoushi', 'aggressive', (b, u) => { u.mp = 999; u.hp = u.maxHp; delete u.r85aChant; });
  assert.equal(ta.tk_touka || 0, 0, JSON.stringify(ta));
  // となえて いれば 大砲（ドラまたと おなじ r85aPlan）
  const tc = count('touka_madoushi', 'balanced', (b, u) => { u.mp = 999; u.r85aChant = { left: 3 }; });
  //   （親の 技も 覚えて いるので、ラグナ・ブレードなど ドラまたの 大砲も えらぶ）
  const bigs = Object.entries(tc).filter(([id]) => ABILITIES[id]?.effect?.r85aBig).reduce((s, [, v]) => s + v, 0);
  assert.ok(bigs > 30, JSON.stringify(tc));
});

// ───────────── ほかの しくみ ─────────────
test('第98回 K4: 両方の 流れ（お仕事いらい・まぼろしの回ろう〈新しい 系統の 作品〉）・幻の書・乗り物・試練', () => {
  // お仕事いらい: 両方の 親の 流れの いらいは ぜんぶ 引き受けられる
  const lineOf = (q, p) => q.roots.some((r) => jobAncestry(p).has(r) || r === p);
  let n = 0;
  for (const id of NEW) {
    for (const p of REQ[id]) {
      for (const q of FAMILY_QUESTS.filter((x) => x.roots && lineOf(x, p))) {
        assert.ok(jobLine(q.roots).has(id), `${id}: ${p} の 流れの いらい ${q.id}`);
        n++;
      }
    }
  }
  assert.ok(n >= 1);
  // まぼろしの回ろう: 新しい 系統の 方の 作品
  for (const id of NEW) {
    assert.equal(kizunaOf(id).work, WORK[id]);
    const door = RIVAL_DOORS.find((d) => d.work === WORK[id]);
    assert.ok(door.jobs.includes(id), id);
    assert.ok(door.jobs.includes(REQ[id][0]));
  }
  // 幻の書: 新しい 系統の 伝説を きわめると 名前と 条件が 見える・うわさ
  for (const id of NEW) {
    const c = newCharacter({ id: 'y', name: 'y', job: 'warrior' });
    c.jobs[REQ[id][0]] = { lv: 3 };
    assert.ok(phantomRumors(c).includes(JOB_HINTS[id]), id);
    master(c, REQ[id][0]);
    const rows = phantomBook(c);
    assert.equal(rows.length, PHANTOM_ORDER.length);
    const r = rows.find((x) => x.id === id);
    assert.ok(r.known && r.live && r.conds.length === 3 && !r.ready, id);
  }
  // 乗り物（その 職業の 幻の 乗り物 ＋ もとの 2つの 職業の 乗り物）
  const OLD = { motoyan_keiji: ['rei_bird', 'police_bike'], otenki_shihan: ['panda', 'cloud'], touka_madoushi: ['feast_cart', 'rock_cart'] };
  for (const id of NEW) {
    const vid = kizunaOf(id).vehicle.id;
    assert.ok(VEHICLES[vid].phantom && VEHICLES[vid].jobs.join() === id && VEHICLE_ORDER.includes(vid));
    textOk(VEHICLES[vid].name, vid);
    textOk(VEHICLES[vid].desc, vid);
    assert.ok(VEHICLE_ART[vid] && vehicleFrames(vid) === 3);
    for (const v of OLD[id]) assert.ok(VEHICLES[v].jobs.includes(id), `${v} に ${id}`);
  }
  for (const id of NEW) assert.equal(PHANTOM_ADJ[id].length, 3);
});

test('第98回 K4: 見た目（親の 2つの とくちょう）・漢字チェックの 対象', () => {
  const ids = KIZUNA_ART.map((k) => k.id);
  for (const id of NEW) assert.ok(ids.includes(id), id);
  // 元ヤンのけいじ: スーツ（トリプルフェイス）＋ リーゼント（ゆう助）／おてんき: 道着 ＋ おさげ（乱馬）＋ 白い マント（雲）／
  // 等価交かん: 旅の 魔道士の 服（リナ）＋ はがねの うで・れん成じん（はがねのれん金術師）
  assert.equal(JOB_OUTFIT.motoyan_keiji.kind, 'suit');
  assert.equal(jobBody('motoyan_keiji', true)?.hair, 'slick');
  assert.equal(JOB_OUTFIT.otenki_shihan.kind, 'gi');
  assert.equal(jobBody('otenki_shihan', true)?.hair, 'braid');
  assert.equal(JOB_OUTFIT.touka_madoushi.kind, 'travel');
  assert.ok(jobBody('touka_madoushi', true)?.mech33 && jobBody('touka_madoushi', true)?.circle33);
  const files = gameFiles().map((f) => f.replace(/\\/g, '/'));
  for (const f of ['shared/data/jobs-r98-keiji.js', 'shared/data/jobs-r98-otenki.js', 'shared/data/jobs-r98-touka.js', 'client/render/kizuna-keiji.js', 'client/render/kizuna-otenki.js', 'client/render/kizuna-touka.js']) {
    assert.ok(files.some((x) => x.endsWith(f)), f);
  }
});

test('第98回 K4: 引っこしコード（いちばん 大きな セーブも 4通まで・36000文字いか）', { timeout: 120000 }, async () => {
  const big = await biggestChar();
  for (const id of NEW) assert.ok(big.jobs[id], `${id} を 持つ`);
  const code = exportCode(big);
  assert.ok(splitCode(code).length <= 4 && code.length <= 36000, `${code.length}文字・${splitCode(code).length}通（LINE ${LINE_MAX}）`);
});
