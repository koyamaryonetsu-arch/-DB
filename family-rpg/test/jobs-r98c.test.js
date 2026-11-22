// 第98回 K3班: きずなの職業 2つ（国を動かす名さいしょう・伝説のPTA会長）の テスト（docs/plan-kizuna-jobs.md の 7・10。jobs-r98a.test.js と おなじ 見方）
//   なり方・条件・技（看板の きまり）・強さの はんい・親の しくみ（作戦・行動ゲージ・かばう・おにの手）・両方の 流れ・幻の書・オート・絵・引っこしコード
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JOBS, ALL_JOBS, PHANTOM_ORDER, PHANTOM_LIVE, JOB_HINTS, JOB_MAX_LEVEL, jobAncestry } from '../public/js/shared/data/jobs.js';
import { KIZUNA_IDS, isKizuna, kizunaOf } from '../public/js/shared/data/kizuna.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { HIRAMEKI, HIRA_ABILITIES } from '../public/js/shared/data/hirameki.js';
import { R83A_JOBS } from '../public/js/shared/data/jobs-r83a.js';
import { R83B_JOBS } from '../public/js/shared/data/jobs-r83b.js';
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
import { CLONE_MAX } from '../public/js/shared/battle-phantom-a.js';
import { sakusenSet, sakusenPct, activePlan, planPct } from '../public/js/shared/battle-r83a.js';
import { r83bCover, protectRate, oniMaxOf } from '../public/js/shared/battle-r83b.js';
import { kizunaPlan } from '../public/js/shared/battle-kizuna.js';
import { decideAlly, isAttackCmd } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { jobChar } from '../tools/sim-jobs.mjs';
import { checkText, gameFiles } from '../tools/kanji-check.mjs';
import { KIZUNA_ART, KIZUNA_ANIMS, KIZUNA_OUTFIT as JOB_OUTFIT, playKizunaFx } from '../public/js/client/render/kizuna-art.js';
import { jobBody } from '../public/js/client/render/hero-outfit.js';
import { VEHICLE_ART, vehicleFrames } from '../public/js/client/render/vehicle-art.js';
import { biggestChar } from './transfer-big-save.js';
import { exportCode, splitCode, LINE_MAX } from '../public/js/shared/world/transfer.js';

const NEW = ['kuni_saishou', 'pta_kaichou'];
const REQ = { kuni_saishou: ['hoshin_gunshi', 'souri'], pta_kaichou: ['jigoku_sensei', 'saikyo_okan'] };
// 新しい 系統の 方（まぼろしの回ろうの 作品・系統の 職業の 一覧）
const LINE = { kuni_saishou: R83A_JOBS, pta_kaichou: R83B_JOBS };
const WORK = { kuni_saishou: 'houshin', pta_kaichou: 'nube' };
// 技の もと（親の 2つから 4こずつ ＋ かけ合わせ 1こ）
const FROM = {
  kuni_saishou: { hoshin_gunshi: ['msj_sakusen', 'msj_ten', 'msj_saki', 'msj_taikyoku'], souri: ['msj_enzetsu', 'msj_kaigi', 'msj_kyufu', 'msj_summit'] },
  pta_kaichou: { jigoku_sensei: ['ptk_tate', 'ptk_onite', 'ptk_genkotsu', 'ptk_tsuiteru'], saikyo_okan: ['ptk_shikaru', 'ptk_bentou', 'ptk_kaminari', 'ptk_kaji'] },
};
const KEYS = ['hp', 'mp', 'str', 'def', 'agi', 'mag', 'heal'];
const sum = (m) => KEYS.reduce((s, k) => s + m[k], 0);
const textOk = (s, what) => assert.deepEqual(checkText(s), [], `${what}: ${s}`);
const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
const parts = (e) => (e?.type === 'multi' ? e.parts || [] : e ? [e] : []);

// ───────────── データ ─────────────
test('第98回 K3: 2つの きずなの職業（tier 4・req 2つ・幻の はんい・K1班の 2つの あと・1つ 1ファイル）', () => {
  assert.deepEqual(KIZUNA_IDS.slice(4, 6), NEW, 'K1班・K2班の 4つの あと');
  assert.deepEqual(PHANTOM_ORDER.slice(20, 22), NEW, '前の 20この あと（K2班の 2つの うしろ）（掲示板の しるしの 番号は かわらない）');
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
    assert.ok(JOB_SAY[id].length <= 24);
    assert.equal(ALL_JOBS.filter((x) => JOBS[x].name === j.name).length, 1, j.name);
    assert.equal(ALL_JOBS.filter((x) => JOBS[x].short === j.short).length, 1, j.short);
    assert.ok(!JOB_HINTS[id].includes(j.name) && !/[0-9０-９]{3}/.test(JOB_HINTS[id]), JOB_HINTS[id]);
    // 合体技の タグ: 炎の 組（職業 20 まで）・剣かこぶしの 組（職業の 3分の1 まで）は いっぱい なので つけない
    assert.ok(JOB_TAGS[id]?.length >= 2 && JOB_TAGS[id].length <= 4);
    for (const t of ['fire', 'sword', 'fist']) assert.ok(!JOB_TAGS[id].includes(t), `${id}: ${t}`);
  }
  // 家族が きめた 名前（案の まま。「宰」は 使えない 字なので かな）
  assert.equal(JOBS.kuni_saishou.name, '国を動かす名さいしょう');
  assert.equal(JOBS.pta_kaichou.name, '伝説のPTA会長');
});

test('第98回 K3: 親は 新しい 系統の 伝説 ＋ もとからの 流れの いちばん 上（データで たしかめる）', () => {
  const nextOf = (p) => ALL_JOBS.filter((x) => (JOBS[x].tier || 0) < 4 && (JOBS[x].req || []).includes(p));
  for (const id of NEW) {
    const [a, b] = REQ[id];
    // 1つめは 新しい 系統の 伝説
    assert.ok(LINE[id].includes(a), `${a} は 新しい 系統`);
    assert.equal(JOBS[a].tier, 3, `${a} は 伝説`);
    // 2つめは もとからの 流れ
    assert.ok(!LINE[id].includes(b));
    // どちらも その 流れの いちばん 上（幻の職業 いがいで 条件に する 職業が ない）
    for (const p of [a, b]) assert.deepEqual(nextOf(p), [], `${p} の 上`);
  }
  // 公務員の 流れ: 地方公務員 → 国家公務員 → キャリア組 → 総理大臣（伝説）。設計の 表の「キャリア組」は 超級職なので、その 上の 総理大臣
  assert.equal(JOBS.career.tier, 2);
  assert.deepEqual(nextOf('career'), ['souri']);
  assert.ok(jobAncestry('souri').has('career') && jobAncestry('souri').has('civil_local'));
  // おかんの 流れ: おかん → 最強のおかん（その 上は 幻の 宇宙一のおかん だけ）
  assert.equal(JOBS.saikyo_okan.tier, 1);
  assert.ok(jobAncestry('saikyo_okan').has('okan'));
  assert.deepEqual(ALL_JOBS.filter((x) => (JOBS[x].req || []).includes('saikyo_okan')).sort(), ['cosmic_okan', 'pta_kaichou']);
  assert.equal(JOBS.cosmic_okan.tier, 4);
  assert.ok(jobAncestry('jigoku_sensei').has('nube') && jobAncestry('hoshin_gunshi').has('taikobo'));
});

test('第98回 K3: なり方の 条件（今 ある タグと 数だけ・2つ きわめて 条件を みたすと なれる）', () => {
  assert.ok(PHANTOM_TAGS.length >= 23);
  assert.deepEqual(PHANTOM_TAGS.slice(0, 23), ['gomu', 'thunderSpell', 'kame', 'hinokami', 'ninjutsu', 'support', 'deduce', 'healSpell', 'attackSpell',
    'sword', 'debuff', 'train', 'pitch', 'sun', 'rain', 'thunder', 'fist', 'counter', 'sakusen', 'kabau', 'yokai', 'bolt', 'karyu']);
  const old = PHANTOM_ORDER.slice(0, 16).flatMap((id) => PHANTOM_JOBS[id].conds);
  for (const id of NEW) {
    assert.equal(PHANTOM_JOBS[id].conds.length, 3);
    for (const cd of PHANTOM_JOBS[id].conds) {
      textOk(cd.text, id);
      if (cd.use) for (const t of cd.use) assert.ok(PHANTOM_TAGS.slice(0, 23).includes(t), t);
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
  // 条件の タグに 数える 技（自分の 技で 条件を すすめられる）
  for (const s of ['msj_sakusen', 'msj_saki', 'msj_taikyoku', 'kuni_saishou_sig']) assert.ok(abilityTags(s).includes('sakusen'), s);
  for (const s of ['msj_enzetsu', 'msj_summit', 'msj_sakusen']) assert.ok(abilityTags(s).includes('support'), s);
  for (const s of ['ptk_tate', 'ptk_kaji']) assert.ok(abilityTags(s).includes('kabau'), s);
  for (const s of ['ptk_shikaru']) assert.ok(abilityTags(s).includes('debuff'), s);
});

// ───────────── 技 ─────────────
test('第98回 K3: 技 10こ（親の 2つから 4こずつ ＋ かけ合わせ 1こ ＋ ひらめき技 1こ）・文字・えんしゅつ', () => {
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
  }
  for (const a of ['kuni_saishou_sig', 'pta_kaichou_sig', 'kizuna_gorei', 'kizuna_bazaar']) {
    assert.ok(KIZUNA_ANIMS.has(a), a);
    const fake = new Proxy({}, { get: () => () => undefined });
    assert.equal(playKizunaFx(fake, a, [{ x: 100, y: 60 }, { x: 140, y: 70 }], null, {}), true, a);
  }
  // 親の しくみを そのまま 使う（新しい こうかの 名前は ない）
  const types = new Set();
  for (const id of NEW) for (const [, a] of JOBS[id].learn) for (const p of parts(ABILITIES[a].effect)) types.add(p.type);
  for (const t of types) assert.ok(['r83aSakusen', 'r83aSaki', 'r83aTaikyoku', 'r83aKeikaku', 'magic', 'phys', 'atbSet', 'buff', 'debuff', 'heal', 'mpHeal', 'regen', 'teShield', 'oniHand', 'revive'].includes(t), t);
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
      if (p.type === 'phys') e += b.calcPhys(me, tg, { ...p, element: undefined }, 1, 'phys', true).dmg * ((p.hits || 1) + (p.make && p.dance ? p.dance * Math.min(CLONE_MAX, p.make) : 0));
      else if (p.type === 'magic' && Array.isArray(p.base)) e += b.calcMagic(me, tg, { ...p, element: undefined }, 1, true).dmg;
    }
    return { lv, name: a.name, mp: a.mp || 0, target: a.target, e: Math.round(e) };
  });
  return { st, sk };
}

test('第98回 K3: 看板の きまり（いちばん 強い・同じ 形の 技の 1.1倍 いじょう・今の 幻の いちばん 強い 技を こえない・MP は 4回 いじょう）', () => {
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
    assert.equal(top, ABILITIES[`${id}_sig`].mp, '看板が いちばん MP を 使う');
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
const use = (b, u, id, extra = {}) => {
  const ev = { lines: [], upd: [], results: [] };
  b.applyAbility(u, ABILITIES[id], { type: 'ability', id, ...extra }, ev, 1);
  return ev;
};

test('第98回 K3: 名さいしょうの 作戦（攻め・守り・速攻を 25%）・大会議（敵の 番が おくれる・ほう神計画が 5回・仲間が すぐ 動く）・ながーい会議', () => {
  const me = mk('kuni_saishou');
  const pals = [mk('pta_kaichou'), Object.assign(mk('pta_kaichou'), { id: 'p2' })];
  const b = new Battle({ rng: makeRng(4), allies: [{ char: me }, ...pals.map((char) => ({ char }))], enemies: ['rockman', 'rockman'], canFlee: false });
  const u = b.allies[0];
  assert.deepEqual(sakusenSet(u), ['seme', 'mamori', 'sokkou']);
  assert.equal(sakusenPct(u), 0.25);
  for (const e of b.enemies) { e.hp = e.maxHp = 9999999; e.resist = {}; e.atb = 90; }
  for (const x of b.allies.slice(1)) x.atb = 10;
  // 作戦が ない 時の 大会議 ＝ 攻めの 作戦から 始めて 2倍・5回
  u.mp = 999;
  const ev = use(b, u, 'kuni_saishou_sig');
  const p = activePlan(b, 'ally');
  assert.ok(p && p.kind === 'seme' && p.boost === 5, JSON.stringify(p));
  assert.equal(planPct(p), 0.5);
  assert.ok(ev.results.filter((r) => b.enemies.some((e) => e.id === r.id) && r.dmg > 0).length >= 2, '敵全体に ダメージ');
  assert.ok(b.allies.slice(1).every((x) => x.atb === 100), '仲間が すぐ 動ける');
  assert.ok(b.enemies.some((e) => e.atb < 90), '番が おくれる 敵が いる');
  // 作戦を 立てる（メニューで えらんだ 作戦。速攻も）
  use(b, u, 'msj_sakusen', { sakusen: 'sokkou' });
  assert.equal(activePlan(b, 'ally').kind, 'sokkou');
  assert.equal(activePlan(b, 'ally').pct, 0.25);
  // ながーい会議: 番が おくれる（運しだい。何回か やれば おくれる）
  let late = 0;
  for (let i = 0; i < 6; i++) {
    for (const e of b.enemies) e.atb = 90;
    use(b, u, 'msj_kaigi');
    late += b.enemies.filter((e) => e.atb < 90).length;
  }
  assert.ok(late > 0);
});

test('第98回 K3: PTA会長は 弱った 仲間を かばう（じごく先生と おなじ）・看板で げんこつ ＋ 攻撃を 下げる ＋ みんなを かばう ＋ 回復・おしかり', () => {
  const me = mk('pta_kaichou');
  const pal = mk('kuni_saishou');
  const b = new Battle({ rng: makeRng(6), allies: [{ char: me }, { char: pal }], enemies: ['rockman'], canFlee: false });
  const u = b.allies[0], v = b.allies[1], e = b.enemies[0];
  e.hp = e.maxHp = 9999999; e.resist = {}; e.resist.debuff = 1;
  assert.equal(protectRate(u), 0.8);
  assert.equal(oniMaxOf(u), 0.9);
  // 弱った 仲間への 攻撃を かばう（0.8）
  v.hp = Math.round(v.maxHp * 0.2);
  let cov = 0;
  for (let i = 0; i < 40; i++) if (r83bCover(b, e, v) === u) cov++;
  assert.ok(cov >= 24 && cov <= 40, `かばった ${cov}/40`);
  v.hp = v.maxHp;
  // 看板
  v.hp = Math.round(v.maxHp * 0.5);
  u.mp = 999;
  const before = v.hp;
  const ev = use(b, u, 'pta_kaichou_sig');
  assert.ok(ev.results.filter((r) => r.id === e.id && r.dmg > 0).length >= 1, 'げんこつ');
  assert.ok(u.teShield && u.cover?.target === 'all', 'みんなを かばう');
  assert.ok(v.hp > before, '回復');
  // おしかり（攻撃が 下がる。運しだいなので 何回か）
  let down = false;
  for (let i = 0; i < 5 && !down; i++) {
    e.debuffs = {};
    use(b, u, 'ptk_shikaru');
    down = !!e.debuffs?.atk;
  }
  assert.ok(down, '攻撃力が 下がった');
});

test('第98回 K3: オート（その 職業の 技を 持つ 人だけ・ボスで 作戦 → 大会議・ガンガンは 攻撃だけ・PTA会長は しかって げんこつ）', () => {
  const w = jobChar('warrior', 50, 7);
  const b0 = new Battle({ rng: makeRng(1), allies: [{ char: w, auto: true }], enemies: ['rockman'], canFlee: false });
  assert.equal(kizunaPlan(b0, b0.allies[0], b0.enemies, [], b0.allies, {}), null);
  for (const tactics of ['balanced', 'aggressive']) {
    // 名さいしょう: ボスで 作戦が ない ＝ 攻めの 作戦。作戦が あれば 大会議（作戦 2倍）
    const me = mk('kuni_saishou');
    const b = new Battle({ rng: makeRng(2), boss: true, allies: [{ char: me, auto: true, tactics }], enemies: ['rockman'], canFlee: false });
    b.enemies[0].boss = true;
    const u = b.allies[0];
    u.mp = 999;
    const first = decideAlly(b, u);
    if (tactics === 'aggressive') assert.ok(!first || isAttackCmd(first), `ガンガン: ${JSON.stringify(first)}`);
    else assert.deepEqual([first?.id, first?.sakusen], ['msj_sakusen', 'seme']);
    use(b, u, 'msj_sakusen', { sakusen: 'seme' });
    let sig = 0;
    for (let i = 0; i < 40; i++) if (decideAlly(b, u)?.id === 'kuni_saishou_sig') sig++;
    assert.ok(sig > 8, `${tactics}: 大会議 ${sig}`);
    // PTA会長: ボスの 攻撃が 下がって いない ＝ おしかり（ガンガンは 攻撃だけ）
    const pm = mk('pta_kaichou');
    const pb = new Battle({ rng: makeRng(3), boss: true, allies: [{ char: pm, auto: true, tactics }], enemies: ['rockman'], canFlee: false });
    pb.enemies[0].boss = true;
    const pu = pb.allies[0];
    pu.mp = 999;
    const got = new Set();
    for (let i = 0; i < 60; i++) {
      const cmd = decideAlly(pb, pu);
      if (cmd?.id) got.add(cmd.id);
      if (tactics === 'aggressive' && cmd) assert.ok(isAttackCmd(cmd), JSON.stringify(cmd));
    }
    if (tactics === 'balanced') assert.ok(got.has('ptk_shikaru') && got.has('ptk_genkotsu'), [...got].join());
    else assert.ok(!got.has('ptk_shikaru') && !got.has('ptk_bentou'), [...got].join());
  }
});

// ───────────── ほかの しくみ ─────────────
test('第98回 K3: 両方の 流れ（お仕事いらい）・まぼろしの回ろう（新しい 系統の 方の 作品）・幻の書・乗り物・試練', () => {
  const can = (j) => FAMILY_QUESTS.filter((q) => q.roots && jobLine(q.roots).has(j));
  const lineOf = (q, p) => q.roots.some((r) => jobAncestry(p).has(r) || r === p);
  for (const id of NEW) {
    const qs = can(id);
    for (const p of REQ[id]) {
      // その 親が 引き受けられる いらいは、きずなの職業も 引き受けられる
      const mine = FAMILY_QUESTS.filter((q) => q.roots && jobLine(q.roots).has(p));
      for (const q of mine) assert.ok(qs.includes(q), `${id}: ${p} の いらい ${q.id}`);
      if (mine.length) assert.ok(qs.some((q) => lineOf(q, p)), `${id}: ${p} の 流れの いらい`);
    }
  }
  for (const id of NEW) {
    assert.equal(kizunaOf(id).work, WORK[id]);
    const door = RIVAL_DOORS.find((d) => d.work === WORK[id]);
    assert.ok(door.jobs.includes(id));
    assert.equal(RIVAL_DOORS.filter((d) => d.jobs.includes(id)).length, 1, 'とびらは 1つだけ');
  }
  // 幻の書: 新しい 系統の 伝説を きわめると 名前と 条件が 見える・うわさ
  for (const id of NEW) {
    const c = newCharacter({ id: 'y', name: 'y', job: 'warrior' });
    c.jobs[REQ[id][0]] = { lv: 3 };
    assert.ok(phantomRumors(c).includes(JOB_HINTS[id]));
    master(c, REQ[id][0]);
    const rows = phantomBook(c);
    assert.equal(rows.length, PHANTOM_ORDER.length);
    const r = rows.find((x) => x.id === id);
    assert.ok(r.known && r.live && r.conds.length === 3 && !r.ready, id);
  }
  // 乗り物（その 職業の 幻の 乗り物 ＋ もとの 職業の 乗り物）
  for (const id of NEW) {
    const vid = kizunaOf(id).vehicle.id;
    assert.ok(VEHICLES[vid].phantom && VEHICLES[vid].jobs.join() === id && VEHICLE_ORDER.includes(vid));
    textOk(VEHICLES[vid].name, vid);
    textOk(VEHICLES[vid].desc, vid);
    assert.ok(VEHICLE_ART[vid] && vehicleFrames(vid) === 3);
  }
  assert.ok(VEHICLES.limo.jobs.includes('kuni_saishou'));
  assert.ok(VEHICLES.teacher_bike.jobs.includes('pta_kaichou') && VEHICLES.mamachari.jobs.includes('pta_kaichou'));
  for (const id of NEW) assert.equal(PHANTOM_ADJ[id].length, 3);
});

test('第98回 K3: 見た目（親の 2つの とくちょう）・漢字チェックの 対象', () => {
  assert.deepEqual(KIZUNA_ART.map((k) => k.id).slice(4, 6), NEW);
  // 名さいしょう: スーツ ＋ 金の メダル（総理大臣）・白い マント ＋ サークレット ＋ 打神べん（大軍師）
  assert.equal(JOB_OUTFIT.kuni_saishou.kind, 'suit');
  assert.ok(JOB_OUTFIT.kuni_saishou.medal && JOB_OUTFIT.kuni_saishou.cape);
  assert.equal(jobBody('kuni_saishou', true)?.prop, 'whip83');
  // PTA会長: おかんの カーディガンと エプロン ＋ おにの手
  assert.equal(JOB_OUTFIT.pta_kaichou.kind, 'okan');
  assert.equal(jobBody('pta_kaichou', true)?.hand83, 'oni');
  const files = gameFiles().map((f) => f.replace(/\\/g, '/'));
  for (const f of ['shared/data/jobs-r98-saishou.js', 'shared/data/jobs-r98-pta.js', 'client/render/kizuna-saishou.js', 'client/render/kizuna-pta.js']) {
    assert.ok(files.some((x) => x.endsWith(f)), f);
  }
});

test('第98回 K3: 引っこしコード（いちばん 大きな セーブも 4通まで・36000文字いか）', { timeout: 120000 }, async () => {
  const big = await biggestChar();
  for (const id of NEW) assert.ok(big.jobs[id], `${id} を 持つ`);
  const code = exportCode(big);
  assert.ok(splitCode(code).length <= 4 && code.length <= 36000, `${code.length}文字・${splitCode(code).length}通（LINE ${LINE_MAX}）`);
});
