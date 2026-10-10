// 2026年10月（第23回）: 第20〜22回の 職業の ひらめき技と 合体技、パーティーに 関係する ものだけ 見せる きまり
//  ・新しい 職業の 道には、どれも ひらめき技が あって、合体技にも 出てくる
//  ・新しい ひらめき技・合体技は ぜんぶ ほんとうの たたかいで 使える
//  ・メニューの「ひらめき」「合体技」と ひらめきの賢者は、今の パーティーの 職業に 関係する ものだけ 出す
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JOBS, ALL_JOBS, JOB_MAX_LEVEL, jobAncestry } from '../public/js/shared/data/jobs.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
import { HIRA_JOB_ABILITIES, HIRAMEKI_JOBS } from '../public/js/shared/data/hirameki-jobs.js';
import { DUAL_TECHS, DUAL_ORDER, DUAL_GROUP_NAMES, dualOptions, dualRelated } from '../public/js/shared/data/dual.js';
import {
  newCharacter, gainExp, expForLevel, fullHeal, learnedAbilities, hiraAllowed, weaponOk, partyJobSet, hiraRelated, hiraVisible, masteredJobs,
} from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { partyState, partyOf } from '../public/js/shared/world/party.js';
import { scriptCtx } from '../public/js/shared/world/scripts.js';
import { SCRIPTS } from '../public/js/shared/data/story.js';
import { checkText } from '../tools/kanji-check.mjs';
import { Bot } from './helpers.js';

const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
// その 職業に なるまでの 職業を ぜんぶ マスター（伝説の職業の「ほかの 超級職」は ゴッドハンド）
const masterChain = (c, jid) => {
  for (const r of JOBS[jid].req || []) { master(c, r); masterChain(c, r); }
  if (JOBS[jid].reqSuper) master(c, 'god_hand');
};
const tierOf = (j) => JOBS[j].tier || 0;
const NEW_HIRA = Object.keys(HIRA_JOB_ABILITIES);
// 第23回の 合体技で、第26回（合体技の 作り直し）の あとも のこっている 2人技
const NEW_DUAL = ['dt_gomu_kame', 'dt_bentou', 'dt_zenkan', 'dt_hametsu', 'dt_gyouretsu', 'dt_manzai', 'dt_hataraki', 'dt_hikari_yami'];
// 第20〜22回の 職業
const RECENT = [
  'cook', 'patissier', 'star_chef', 'parttimer', 'seishain', 'tatakiage', 'comedian', 'm1_champion', 'daikenja', 'loto_hero',
  'neet', 'chuuni', 'datenshi', 'saiyan', 'super_saiyan', 'ss2', 'ss3', 'setsubiya', 'ryonetsu', 'rubber', 'nika', 'youtuber', 'streamer',
  'gamer', 'pro_gamer', 'maou', 'okan', 'saikyo_okan', 'shachiku', 'black_star', 'facility_genius', 'hakaishin',
];
const SCOPE = {
  enemy: /敵1体/, group: /同じ種類の敵/, enemies: /敵全体|敵にランダム/, ally: /仲間1人/, allies: /仲間全員/, self: /自分|起こる|運しだい/, deadAlly: /仲間1人/,
};
// 前から ある エフェクト（新しい 技の anim は この 中から えらぶ）
const OLD_ANIMS = new Set([
  ...Object.entries(ABILITIES).filter(([id]) => !(id in HIRA_JOB_ABILITIES)).map(([, a]) => a.anim).filter(Boolean),
  ...DUAL_ORDER.filter((id) => !NEW_DUAL.includes(id)).map((id) => DUAL_TECHS[id].anim),
]);
const lines = (eff) => (eff.type === 'multi' ? eff.parts : [eff]).flatMap((p) => [p.msg, p.failMsg]).filter(Boolean);

function setup(job, { seed = 1, mateJob = 'priest', enemies = ['rockman', 'rockman', 'skeleton'] } = {}) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job: 'warrior' });
  gainExp(c, expForLevel(45));
  masterChain(c, job);
  master(c, job);
  c.job = job;
  c.equip.weapon = null;
  fullHeal(c);
  const mate = newCharacter({ id: 'm1', name: 'ミナ', job: 'priest' });
  gainExp(mate, expForLevel(45));
  if (mateJob !== 'priest') {
    masterChain(mate, mateJob);
    master(mate, mateJob);
    mate.job = mateJob;
  }
  mate.equip.weapon = null;
  fullHeal(mate);
  const b = new Battle({ rng: makeRng(seed), allies: [{ char: c, controller: 's1' }, { char: mate, auto: true, kind: 'support' }], enemies, canFlee: true });
  for (const e of b.enemies) {
    e.actions = [{ w: 1, id: 'm_nothing' }];
    e.hp = e.maxHp = 50000;
  }
  for (const a of b.allies) a.mp = a.maxMp = 999;
  return { b, c, mate, me: b.allies[0], m: b.allies[1] };
}
const readyUp = (b, a) => {
  for (let i = 0; i < 800 && !a.ready; i++) b.tick(50);
  return a.ready;
};
const runUntilAct = (b, id) => {
  const evs = [];
  for (let i = 0; i < 400 && !evs.some((e) => e.t === 'act' && e.id === id); i++) evs.push(...b.tick(50));
  return evs.find((e) => e.t === 'act' && e.id === id);
};

test('第23回の ひらめき技: データ・文字・ねらい・エフェクト・強さの 上限', () => {
  const ALL_CAP = [1.15, 1.25, 1.4, 1.4];
  const ALL_MULTI_CAP = [1.12, 1.2, 1.3, 1.35];
  const ONE_CAP = [1.3, 1.4, 1.5, 1.5];
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden) names.set(a.name, [...(names.get(a.name) || []), id]);
  for (const id of NEW_HIRA) {
    const a = ABILITIES[id];
    assert.ok(a && a.hirameki && HIRAMEKI[id], id);
    assert.ok(id.startsWith('hi_'), `${id}: hi_ で はじめる`);
    assert.ok(JOBS[a.job], `${id}: 職業 ${a.job}`);
    assert.ok(a.desc && a.cast && a.kana && a.anim, `${id} の 文`);
    assert.match(a.desc, SCOPE[a.target], `${id}（${a.target}）の せつめい: ${a.desc}`);
    for (const s of [a.name, a.desc, a.cast, ...lines(a.effect)]) assert.deepEqual(checkText(s), [], `${id}: ${s}`);
    assert.deepEqual(checkText(a.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
    assert.ok(OLD_ANIMS.has(a.anim), `${id}: エフェクト ${a.anim} は 前から ある もの`);
    assert.equal(names.get(a.name).length, 1, `${a.name} が ほかの 技と おなじ 名前`);
    // 元に なる 技は、その 職業の 道で 覚える 技（ひらめく 職業と 同じ 道に ある）
    for (const [k, n] of Object.entries(HIRAMEKI[id].from)) {
      const s = ABILITIES[k];
      assert.ok(s && n > 0, `${id} の ${k}`);
      assert.ok(ALL_JOBS.some((j) => jobAncestry(j).has(a.job) && jobAncestry(j).has(s.job) && JOBS[s.job].learn.some(([, x]) => x === k)), `${id}: ${k}（${s.job}）は ${a.job} の 道の 技`);
    }
    // みんなに かける 補助は 職業の ランクの 上限まで
    const t = tierOf(a.job);
    const parts = a.effect.type === 'multi' ? a.effect.parts : [a.effect];
    for (const p of parts) {
      if (p.type === 'buff' && !p.target && ['allies', 'ally'].includes(a.target)) {
        const cap = a.target === 'ally' ? ONE_CAP[t] : (p.stats || [p.stat]).length > 1 ? ALL_MULTI_CAP[t] : ALL_CAP[t];
        assert.ok(p.mult <= cap + 1e-9, `${a.name}: ${p.mult}倍（上限 ${cap}）`);
      }
      // 敵を 止める 技は かならずは 効かない
      if (p.type === 'atbSet' && ['enemy', 'group', 'enemies'].includes(p.target || a.target)) assert.ok(p.chance > 0 && p.chance < 1, `${a.name}: 効く わりあい`);
    }
  }
  assert.ok(NEW_HIRA.length >= 30, `ひらめき技 ${NEW_HIRA.length}こ`);
  assert.deepEqual(Object.keys(HIRAMEKI_JOBS).sort(), [...NEW_HIRA].sort());
});

test('第20〜22回の 職業には どれも ひらめき技が あり、合体技にも 出てくる（ほかの 職業も 合体技が ある）', () => {
  for (const j of RECENT) {
    // その 職業で ひらめける、その 道の 新しい ひらめき技
    const mine = NEW_HIRA.filter((id) => jobAncestry(j).has(ABILITIES[id].job));
    assert.ok(mine.length >= 1, `${JOBS[j].name} の ひらめき技`);
    const c = newCharacter({ id: 'x', name: 'x', job: 'warrior' });
    c.job = j;
    for (const id of mine) assert.equal(hiraAllowed(c, id), true, `${JOBS[j].name} は ${ABILITIES[id].name} を ひらめける`);
  }
  // どの 道にも 1つ いじょう（道の いちばん 下の 職業で 見る）
  for (const root of ['cook', 'parttimer', 'comedian', 'daikenja', 'loto_hero', 'neet', 'saiyan', 'setsubiya', 'rubber', 'youtuber', 'gamer', 'maou', 'okan', 'shachiku', 'hakaishin']) {
    assert.ok(NEW_HIRA.some((id) => jobAncestry(root).has(ABILITIES[id].job) && RECENT.includes(ABILITIES[id].job)), `${JOBS[root].name} の 道の ひらめき技`);
  }
  // 合体技: どの 職業の 技も、どこかの 合体技の 組に 入っている
  const inDual = new Set();
  for (const t of Object.values(DUAL_TECHS)) for (const list of t.need) for (const k of list) if (ABILITIES[k]?.job) inDual.add(ABILITIES[k].job);
  for (const j of ALL_JOBS) assert.ok(inDual.has(j), `${JOBS[j].name} の 技が 合体技に ない`);
  // 新しい 職業どうし・新しい 職業と 前からの 職業の 合体技
  const jobsOf = (id, side) => new Set(DUAL_TECHS[id].need[side].map((k) => ABILITIES[k]?.job).filter(Boolean));
  const pair = (id, a, b) => (jobsOf(id, 0).has(a) && jobsOf(id, 1).has(b)) || (jobsOf(id, 0).has(b) && jobsOf(id, 1).has(a));
  assert.ok(pair('dt_gomu_kame', 'saiyan', 'rubber'), 'サイヤ人×ゴム人間');
  assert.ok(pair('dt_bentou', 'okan', 'shachiku'), 'おかん×社ちく');
  assert.ok(pair('dt_zenkan', 'ryonetsu', 'facility_genius'), 'ryonetsu×天才しせつ管理者');
  assert.ok(pair('dt_hametsu', 'maou', 'hakaishin'), '魔王×はかい神');
  assert.ok(pair('dt_gyouretsu', 'cook', 'parttimer'), '料理人×アルバイト');
  assert.ok(pair('dt_tsukin_rush', 'railman', 'shachiku'), '鉄道員×社ちく');
  assert.ok(pair('dt_hataraki', 'okan', 'neet'), 'おかん×ニート');
  // 第26回: 3人技（ユーチューバー×ゲーマー×アイドル の 大コラボ配信・警察官×消防士 の ウーウーカンカンピーポー）
  const has = (id, side, j) => jobsOf(id, side).has(j);
  assert.ok(has('dt_dai_collab', 0, 'youtuber') && has('dt_dai_collab', 1, 'gamer'), 'ユーチューバー×ゲーマー');
  assert.ok(has('dt_uukanpi', 0, 'police') && has('dt_uukanpi', 1, 'firefighter'), '警察官×消防士');
  assert.ok(NEW_DUAL.every((id) => DUAL_TECHS[id]), '第23回の 2人技が のこっている');
});

test('第23回の 合体技: データ・文字・組の 名前・エフェクト', () => {
  for (const id of NEW_DUAL) {
    const t = DUAL_TECHS[id];
    assert.ok(t.need.length >= 2 && t.need.length <= 4, id);
    assert.equal(t.mp.length, t.need.length, id);
    for (const list of t.need) {
      assert.ok(DUAL_GROUP_NAMES.has(list), `${id}: 組の 名前`);
      for (const k of list) assert.ok(ABILITIES[k], `${id}: ${k}`);
    }
    assert.ok(t.kana && t.desc && t.parts.length, id);
    assert.match(t.desc, SCOPE[t.target], `${id}（${t.target}）: ${t.desc}`);
    for (const s of [t.name, t.desc, ...t.parts.flatMap((p) => [p.msg, p.failMsg]).filter(Boolean)]) assert.deepEqual(checkText(s), [], `${id}: ${s}`);
    assert.deepEqual(checkText(t.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
    assert.ok(OLD_ANIMS.has(t.anim), `${id}: エフェクト ${t.anim}`);
    for (const p of t.parts) if (p.type === 'atbSet' && ['enemy', 'group', 'enemies'].includes(p.target || t.target)) assert.ok(p.chance > 0 && p.chance < 1, `${t.name}: 効く わりあい`);
  }
  for (const [, nm] of DUAL_GROUP_NAMES) assert.deepEqual(checkText(nm), [], nm);
  const names = DUAL_ORDER.map((id) => DUAL_TECHS[id].name);
  assert.equal(new Set(names).size, names.length, '合体技の 名前は かぶらない');
});

test('第23回の ひらめき技は ぜんぶ たたかいで 使える', () => {
  let used = 0;
  for (const id of NEW_HIRA) {
    const a = ABILITIES[id];
    const { b, c, me, m } = setup(a.job, { seed: used + 1 });
    c.hirameki = [id];
    me.abilities = [...me.abilities, id];
    assert.ok(learnedAbilities(c).includes(id));
    assert.ok(readyUp(b, me), `${id}: 番が 来た`);
    const target = ['ally', 'deadAlly'].includes(a.target) ? m.id : b.enemies[0].id;
    const r = b.command(me.id, { type: 'ability', id, target }, 's1');
    assert.equal(r.ok, true, `${id}: ${r.reason || ''}`);
    const act = runUntilAct(b, me.id);
    assert.ok(act, `${id} が じっこう された`);
    assert.ok(!act.lines.some((l) => l.includes('MPが足りない')), act.lines.join(' / '));
    for (const l of act.lines) assert.deepEqual(checkText(l), [], `${id}: ${l}`);
    // 攻撃の 技は ダメージが 出る
    if (['enemy', 'group', 'enemies'].includes(a.target) && (a.effect.type === 'phys' || a.effect.type === 'magic' || a.effect.parts?.some((p) => ['phys', 'magic'].includes(p.type)))) {
      assert.ok(act.results?.some((x) => x.dmg > 0), `${id}: ダメージ ${act.lines.join(' / ')}`);
    }
    used++;
  }
  assert.equal(used, NEW_HIRA.length);
});

test('第23回の ひらめき技は、元の 技を 使いこむと たたかいの 中で ひらめく', () => {
  for (const id of NEW_HIRA) {
    const a = ABILITIES[id];
    const from = HIRAMEKI[id].from;
    // ひらめく きっかけに 使う 技（相手を えらべる、ふつうの 技）
    const key = Object.keys(from).find((k) => !['random', 'overtime'].includes(ABILITIES[k].effect.type) && !ABILITIES[k].weapon);
    assert.ok(key, `${id}: きっかけの 技`);
    const ka = ABILITIES[key];
    let got = null;
    for (let seed = 1; seed < 80 && !got; seed++) {
      const { b, c, me, m } = setup(a.job, { seed });
      c.skillUse = Object.fromEntries(Object.entries(from).map(([k, n]) => [k, n * 2]));
      me.use = { ...c.skillUse };
      if (ka.target === 'deadAlly') { m.alive = false; m.hp = 0; }
      readyUp(b, me);
      const target = ['ally', 'deadAlly'].includes(ka.target) ? m.id : b.enemies[0].id;
      const r = b.command(me.id, { type: 'ability', id: key, target }, 's1');
      assert.equal(r.ok, true, `${id}: ${key} ${r.reason || ''}`);
      const act = runUntilAct(b, me.id);
      if (act?.hirameki) {
        assert.equal(act.hirameki.id, id, `${key} から ${id}`);
        got = act;
        assert.ok(me.abilities.includes(id));
        for (const l of act.lines) assert.deepEqual(checkText(l), [], `${id}: ${l}`);
      }
    }
    assert.ok(got, `${a.name} を ひらめいた`);
  }
});

// その 組の 技を 1つ 覚えている 職業（武器の いらない 技）
function jobFor(list, not) {
  for (const k of list) {
    const s = ABILITIES[k];
    if (!s?.job || s.weapon || s.hirameki || s.job === not || !JOBS[s.job].learn.some(([, x]) => x === k)) continue;
    return { job: s.job, skill: k };
  }
  return null;
}

test('第23回の 合体技は ぜんぶ たたかいで 出せる（2人の MPと 番を 使う）', () => {
  let n = 0;
  for (const id of NEW_DUAL) {
    const t = DUAL_TECHS[id];
    const A = jobFor(t.need[0]);
    const B = jobFor(t.need[1]);
    assert.ok(A && B, id);
    const { b, me, m } = setup(A.job, { mateJob: B.job, seed: n + 3 });
    readyUp(b, me);
    b.queue = b.queue.filter((q) => q.id !== m.id);
    m.queued = false;
    m.atb = 100;
    const opt = b.dualOptionsFor(me).find((o) => o.id === id);
    assert.ok(opt, `${id}: ${JOBS[A.job].name}×${JOBS[B.job].name} で 出せる`);
    const mpA = me.mp, mpB = m.mp;
    const r = b.command(me.id, { type: 'dual', id, partner: m.id, target: b.enemies[0].id }, 's1');
    assert.equal(r.ok, true, `${id}: ${r.reason || ''}`);
    const act = runUntilAct(b, me.id);
    assert.equal(act?.dual?.id, id, `${id} が 出た`);
    assert.equal(act.name, t.name);
    // MPを 回復する 合体技（行列のできる店）は のぞく
    if (!t.parts.some((p) => p.type === 'mpHeal')) {
      assert.equal(me.mp, mpA - opt.mp[0], `${id}: MP`);
      assert.equal(m.mp, mpB - opt.mp[1], `${id}: 仲間の MP`);
    }
    for (const l of act.lines) assert.deepEqual(checkText(l), [], `${id}: ${l}`);
    if (['enemy', 'group', 'enemies'].includes(t.target) && t.parts.some((p) => ['phys', 'magic'].includes(p.type))) {
      assert.ok(act.results?.some((x) => x.dmg > 0), `${id}: ダメージ ${act.lines.join(' / ')}`);
    }
    n++;
  }
  // 出せる 組み合わせ: おかんの 技 ＋ 社ちくの 技 ＝ お弁当とどけに来たよ（どちらからでも）
  const okan = { id: 'a', name: 'かあさん', alive: true, abilities: ['ok_otama'], mp: 20, ready: true, statuses: [] };
  const sk = { id: 'b', name: 'たなか', alive: true, abilities: ['sk_tsukin'], mp: 20, ready: true, statuses: [] };
  assert.ok(dualOptions(okan, [sk], weaponOk).some((o) => o.id === 'dt_bentou'));
  assert.ok(dualOptions(sk, [okan], weaponOk).some((o) => o.id === 'dt_bentou'));
  assert.ok(!dualOptions(okan, [{ ...sk, abilities: ['daichi'] }], weaponOk).some((o) => o.id === 'dt_bentou'));
});

test('パーティーに 関係する ひらめき技だけ 出す（ひらめいた 技は いつも 出す）', () => {
  const cook = newCharacter({ id: 'c1', name: 'コック', job: 'cook' });
  const set1 = partyJobSet([cook]);
  const v1 = hiraVisible(cook, set1);
  assert.ok(v1.includes('hi_kakushi_bouchou') && v1.includes('hi_daikaryoku'), '料理人の ひらめき技');
  for (const id of ['hi_kaiouken', 'hk_daichi_ikari', 'hk_triple_mera', 'mahouken', 'hi_okashi_no_ie']) assert.ok(!v1.includes(id), `${id} は 出さない`);
  assert.ok(v1.length < Object.keys(HIRAMEKI).length / 4, `出すのは 少しだけ ${v1.length}`);
  // ひらめいた 技は 職業に 関係なく 出す
  cook.hirameki = ['hk_triple_mera'];
  assert.ok(hiraVisible(cook, set1).includes('hk_triple_mera'));
  // いっしょに 戦う 仲間の 職業（サイヤ人）
  const saiyan = newCharacter({ id: 's1', name: 'カカ', job: 'saiyan' });
  const v2 = hiraVisible(cook, partyJobSet([cook, saiyan]));
  assert.ok(v2.includes('hi_kaiouken') && v2.includes('hi_kienzan'), 'サイヤ人の ひらめき技も');
  assert.ok(!v2.includes('hi_bigbang_kame'), 'スーパーサイヤ人の 技は まだ');
  // 上の 職業なら、そこに いたるまでの 職業の 技も（三ツ星シェフ → 料理人・パティシエ）
  const chef = newCharacter({ id: 'c2', name: 'シェフ', job: 'warrior' });
  chef.job = 'star_chef';
  const v3 = hiraVisible(chef, partyJobSet([chef]));
  for (const id of ['hi_kakushi_bouchou', 'hi_daikaryoku', 'hi_okashi_no_ie']) assert.ok(v3.includes(id), id);
  // マスターした 職業も 入る（とちゅうの 職業は 入らない）
  const w = newCharacter({ id: 'w1', name: 'ガルド', job: 'okan' });
  w.jobs.warrior = { lv: 5, b: 10 };
  assert.ok(!partyJobSet([w]).has('warrior'), 'レベル5の 戦士は 入らない');
  assert.ok(!hiraVisible(w, partyJobSet([w])).includes('hk_daichi_ikari'));
  master(w, 'warrior');
  assert.ok(partyJobSet([w]).has('warrior'), 'マスターした 戦士は 入る');
  assert.ok(hiraVisible(w, partyJobSet([w])).includes('hk_daichi_ikari'));
  assert.deepEqual(masteredJobs(w), ['warrior']);
  // 家族の キャラは mjobs（マスターした 職業）で
  assert.ok(partyJobSet([{ job: 'okan', mjobs: ['mage'] }]).has('mage'));
  // 魔物の 仲間は 職業なし
  assert.equal(partyJobSet([{ species: 'slime', job: 'warrior' }]).size, 0);
  // 掛け合わせ技: 元の 技の 職業が パーティーに あれば 関係する
  assert.ok(hiraRelated('mahouken', partyJobSet([{ job: 'mage' }])));
  assert.ok(!hiraRelated('mahouken', partyJobSet([{ job: 'okan' }])));
});

test('パーティーに 関係する 合体技だけ 出す', () => {
  const set = partyJobSet([{ job: 'okan' }, { job: 'shachiku' }]);
  const shown = DUAL_ORDER.filter((id) => dualRelated(id, set));
  assert.ok(shown.includes('dt_bentou'), 'おかん×社ちく');
  assert.ok(shown.includes('dt_jugyo_sankan') === false, '学校の 技が ないので 授業参観は 出さない');
  for (const id of ['dt_gomu_kame', 'dt_taishoumetsu', 'dt_hametsu']) assert.ok(!shown.includes(id), id);
  assert.ok(shown.length < DUAL_ORDER.length / 3, `出すのは 少しだけ ${shown.length}`);
  // 覚えている 技（前の 職業の バギ など）でも 関係する
  assert.ok(!dualRelated('dt_honoo_tatsumaki', set));
  assert.ok(dualRelated('dt_honoo_tatsumaki', partyJobSet([{ job: 'mage' }]), new Set(['bagi'])), '魔法使い＋バギを 覚えている');
  assert.ok(dualRelated('dt_honoo_tatsumaki', partyJobSet([{ job: 'priest' }, { job: 'mage' }])));
  // けずった 合体技は 出さない
  assert.ok(!dualRelated('dt_honoo_course', partyJobSet([{ job: 'cook' }, { job: 'mage' }])));
});

test('パーティーの 職業は サーバーと クライアントで おなじ（家族の マスターした 職業を おくる）・ひらめきの賢者も 関係する ヒントだけ', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(5), checkPassword: () => true, rateLimit: false });
  const papa = new Bot(world, 'パパ');
  await papa.login('x');
  await papa.createAndPlay('warrior');
  await papa.settle();
  const kid = new Bot(world, 'ユイ');
  await kid.login('x');
  await kid.createAndPlay('performer');
  await kid.settle();
  master(kid.s.char, 'mage');
  papa.send({ t: 'party', action: 'invite', sid: kid.s.id });
  kid.send({ t: 'party', action: 'accept' });
  const st = partyState(world, partyOf(world, papa.s));
  const km = st.members.find((m) => m.charId === kid.s.char.id);
  assert.deepEqual(km.mjobs, ['mage'], '家族の マスターした 職業');
  // サーバーの パーティー（scriptCtx の partyChars）と、クライアントに おくる 形で 同じ 職業に なる
  const ctx = scriptCtx(papa.s, papa.s, world);
  const server = partyJobSet(ctx.partyChars());
  const client = partyJobSet([papa.s.char, ...st.members.filter((m) => m.charId !== papa.s.char.id).map((m) => ({ job: m.job, mjobs: m.mjobs })), ...st.supports]);
  assert.deepEqual([...server].sort(), [...client].sort());
  assert.ok(server.has('warrior') && server.has('performer') && server.has('mage'));
  // ひらめきの賢者: 戦士・旅芸人・魔法使いの パーティーには 魔法剣（大地斬＋メラ）の ヒント、
  // パーティーに 関係しない 閃華裂光拳（せいけんづき＋ホイミ）の ヒントは 出さない
  const say = SCRIPTS.sage(ctx).map((s) => s[2]).join('\n');
  assert.ok(say.includes('魔法剣'), say);
  assert.ok(!say.includes('せいけんづき'), say);
  for (const l of SCRIPTS.sage(ctx)) assert.deepEqual(checkText(l[2]), [], l[2]);
  // 1人で 関係する ヒントが ない とき（おかん）は「ほかの 職業の 仲間と」
  const okan = new Bot(world, 'ママ');
  await okan.login('x');
  await okan.createAndPlay('okan');
  await okan.settle();
  const say2 = SCRIPTS.sage(scriptCtx(okan.s, okan.s, world)).map((s) => s[2]).join('\n');
  assert.ok(say2.includes('ほかの職業の仲間'), say2);
});
