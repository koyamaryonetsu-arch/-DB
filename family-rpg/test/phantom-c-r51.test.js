// 第51回 C3: 幻の職業（宇宙一のおかん・はかいと創造の神・夢のスタジアム鉄道・天候の神）の テスト
//   職業の データ・技・新しい しかけ（しかる・消す・装備の 作りかえ・観客・戦いの 天気）・強さ
//   天候をあやつる者（tenkou_tsukai）は W 班が 作る。この テストは ない ときも 通る（ある ときは ちゃんと しらべる）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { JOBS, ALL_JOBS, LEGEND_ORDER, JOB_HINTS } from '../public/js/shared/data/jobs.js';
import { PHANTOM_JOBS_C } from '../public/js/shared/data/jobs-phantom-c.js';
import { PHANTOM_ABILITIES_C } from '../public/js/shared/data/abilities-phantom-c.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
import { JOB_TAGS } from '../public/js/shared/data/job-tags.js';
import { TRIAL_WORDS } from '../public/js/shared/data/job-trials.js';
import { JOB_SAY } from '../public/js/shared/data/job-talk.js';
import { VEHICLES } from '../public/js/shared/data/vehicles.js';
import { newCharacter, gainExp, expForLevel, fullHeal, jobAbilities, learnedAbilities } from '../public/js/shared/stats.js';
import { makeRng } from '../public/js/shared/rng.js';
import {
  WEATHER_KINDS, WEATHER_UP, WEATHER_DOWN, setWeather, weatherMult, weatherTick, weatherSnap, nextWeather,
} from '../public/js/shared/battle-weather.js';
import { phantomCDamage, CROWD_MAX, REGEAR } from '../public/js/shared/battle-phantom-c.js';

const IDS = ['cosmic_okan', 'chaos_creator', 'dream_stadium', 'weather_god'];
const REQ = { cosmic_okan: ['saikyo_okan', 'homeroom_3b'], chaos_creator: ['hakaishin', 'creator'], dream_stadium: ['keikyu_president', 'hall_of_fame'], weather_god: ['tenkou_tsukai', 'summoner'] };
const KEYS = ['hp', 'mp', 'str', 'def', 'agi', 'mag', 'heal'];
const sum = (m) => KEYS.reduce((s, k) => s + m[k], 0);

// 職業の ある 人（job … 今の 職業）
function hero(id, job) {
  const c = newCharacter({ id, name: id, job: 'warrior' });
  gainExp(c, expForLevel(60));
  c.job = job;
  c.jobs = { ...c.jobs, [job]: { lv: 10, b: 0 } };
  fullHeal(c);
  return c;
}
function setup(jobs, { enemies = ['rockman'], chance = true } = {}) {
  const chars = jobs.map((j, i) => hero('p' + i, j));
  const rng = makeRng(11);
  if (chance !== null) rng.chance = () => chance;
  const b = new Battle({ rng, allies: chars.map((c, i) => ({ char: c, controller: 's' + i })), enemies, canFlee: true });
  for (const e of b.enemies) {
    e.actions = [{ w: 1, id: 'm_nothing' }];
    e.hp = e.maxHp = 99999;
  }
  for (const a of b.allies) a.mp = a.maxMp = 9999;
  return b;
}
function act(b, u, cmd) {
  b.queue = [];
  if (cmd.type === 'ability' && !u.abilities.includes(cmd.id)) u.abilities.push(cmd.id);
  b.enqueue(u, cmd);
  b.executeNext();
  b.lock = 0;
  return b.flush().filter((e) => e.t === 'act').pop();
}

// ───────────── 職業の データ ─────────────
test('第51回 C3: 4つの 幻の職業（tier 4・きわめる 職業 2つ・技 8つ）', () => {
  assert.deepEqual(Object.keys(PHANTOM_JOBS_C), IDS);
  for (const id of IDS) {
    const j = JOBS[id];
    assert.ok(j, id);
    assert.equal(j.id, id);
    assert.equal(j.tier, 4, id);
    assert.deepEqual(j.req, REQ[id], id);
    assert.ok(!j.reqSuper && !j.reqAlt, `${id}: req だけ`);
    // きわめる 職業は ある（天候をあやつる者は W 班。ある ときだけ しらべる）
    for (const r of j.req) if (r !== 'tenkou_tsukai' || JOBS[r]) assert.ok(JOBS[r], `${id} req ${r}`);
    if (JOBS.tenkou_tsukai) assert.equal(JOBS.tenkou_tsukai.tier, 2, '天候をあやつる者は 超級職');
    assert.equal(JOBS.summoner.name, '天地雷鳴士');
    assert.equal(j.learn.length, 8, id);
    assert.deepEqual(j.learn.map(([l]) => l), [1, 2, 3, 5, 6, 7, 8, 10], id);
    assert.equal(j.learn[7][1], `${id}_sig`, '看板の 技は Lv10');
    for (const [, a] of j.learn) {
      assert.ok(ABILITIES[a], a);
      assert.equal(ABILITIES[a].job, id, a);
    }
    for (const k of KEYS) assert.ok(j.mods[k] > 0, `${id} ${k}`);
    assert.ok(j.desc.length > 20 && j.kana && j.short && j.color, id);
  }
  assert.equal(JOBS.chaos_creator.name, 'はかいと創造の神');
});

test('第51回 C3: 強さは もとの 伝説の 職業の 1.1〜1.15倍（天候の神は 伝説の 平均）', () => {
  const legendAvg = LEGEND_ORDER.filter((j) => JOBS[j].tier === 3).reduce((s, j) => s + sum(JOBS[j].mods), 0) / LEGEND_ORDER.filter((j) => JOBS[j].tier === 3).length;
  const base = {
    cosmic_okan: sum(JOBS.homeroom_3b.mods),
    chaos_creator: sum(JOBS.hakaishin.mods),
    dream_stadium: Math.max(sum(JOBS.keikyu_president.mods), sum(JOBS.hall_of_fame.mods)),
    weather_god: legendAvg,
  };
  for (const id of IDS) {
    const r = sum(JOBS[id].mods) / base[id];
    assert.ok(r >= 1.1 && r <= 1.16, `${id} ${r.toFixed(3)}`);
  }
  // 職業らしさ: おかんは 回復、はかいと創造は 力、スタジアムは 力と 素早さ、天候の神は 魔力が いちばん
  const top = (id) => KEYS.filter((k) => k !== 'hp').reduce((a, k) => (JOBS[id].mods[k] > JOBS[id].mods[a] ? k : a), 'mp');
  assert.equal(top('cosmic_okan'), 'heal');
  assert.equal(top('chaos_creator'), 'str');
  assert.equal(top('dream_stadium'), 'str');
  assert.equal(top('weather_god'), 'mag');
});

test('第51回 C3: 技は 32こ。Lv10 で ぜんぶ 覚える・伝説の 技より 強い・天気の 技には weather の しるし', () => {
  assert.equal(Object.keys(PHANTOM_ABILITIES_C).length, 32);
  for (const id of IDS) {
    const c = hero('x', id);
    const got = jobAbilities(c, id);
    assert.deepEqual(got, JOBS[id].learn.map(([, a]) => a), id);
    // F の PHANTOM_ORDER が 入って ALL_JOBS に ある ときは、ふつうの 覚えかたでも
    if (ALL_JOBS.includes(id)) for (const a of got) assert.ok(learnedAbilities(c).includes(a), a);
    // Lv10 の 技が いちばん MPを 使う
    const mps = JOBS[id].learn.map(([, a]) => ABILITIES[a].mp);
    assert.equal(Math.max(...mps), mps[7], id);
  }
  for (const [aid, a] of Object.entries(PHANTOM_ABILITIES_C)) {
    assert.ok(a.name && a.kana && a.desc && a.cast && a.anim && a.effect, aid);
    assert.ok(['skill', 'spell'].includes(a.kind), aid);
    const parts = a.effect.type === 'multi' ? a.effect.parts : [a.effect];
    for (const p of parts) {
      if (p.type === 'phys' && ['enemy'].includes(a.target) && !p.hits) assert.ok(p.mult >= 3.5, `${aid} 1体 ${p.mult}`);
      if (p.type === 'phys' && a.target === 'enemies' && !p.hits) assert.ok(p.mult >= 2.4, `${aid} 全体 ${p.mult}`);
      if (p.type === 'magic' && a.target === 'enemies' && !aid.endsWith('_sig') && p === parts[0]) assert.ok(p.base[0] >= 125, `${aid} 魔力 ${p.base}`);
    }
    if (a.weather) assert.ok(WEATHER_KINDS[a.weather], aid);
  }
  // 伝説の 看板の 技より 強い
  assert.ok(PHANTOM_ABILITIES_C.dream_stadium_sig.effect.parts[0].mult > ABILITIES.keikyu_president_sig.effect.parts[0].mult);
  assert.ok(PHANTOM_ABILITIES_C.chaos_creator_sig.effect.parts[0].base[0] > ABILITIES.hk_hakaidama.effect.base[0]);
  assert.ok(PHANTOM_ABILITIES_C.co_slipper.effect.parts[0].mult > ABILITIES.so_binta.effect.mult);
  // 晴れ・雨・かみなりの 技が 2つずつ
  for (const k of ['sun', 'rain', 'thunder']) assert.equal(Object.values(PHANTOM_ABILITIES_C).filter((a) => a.weather === k).length, 2, k);
});

test('第51回 C3: 職業ごとの 表（タグ・試練の ことば・転職の ひとこと・うわさ・乗り物・ひらめき技）', () => {
  for (const id of IDS) {
    assert.ok(JOB_TAGS[id]?.length >= 2 && JOB_TAGS[id].length <= 4, `${id} タグ`);
    assert.equal(JOBS[id].tags, JOB_TAGS[id]);
    assert.ok(TRIAL_WORDS[id] && TRIAL_WORDS[id].length <= 32, `${id} 試練`);
    assert.ok(JOB_SAY[id], `${id} ひとこと`);
    assert.ok(JOB_HINTS[id], `${id} うわさ`);
    assert.ok(Object.values(VEHICLES).some((v) => v.jobs?.includes(id)), `${id} 乗り物`);
    const hira = Object.entries(ABILITIES).filter(([k, a]) => a.hirameki && a.job === id).map(([k]) => k);
    assert.ok(hira.length >= 1, `${id} ひらめき技`);
    for (const h of hira) for (const from of Object.keys(HIRAMEKI[h].from)) assert.equal(ABILITIES[from].job, id, h);
  }
});

// ───────────── しかる（宇宙一のおかん） ─────────────
test('第51回 C3: しかられた 敵は 反省して しばらく 動かない（ゲージが マイナス・攻撃力 ↓）。ボスは 半分', () => {
  const b = setup(['cosmic_okan']);
  const me = b.allies[0];
  const foe = b.enemies[0];
  foe.atb = 90;
  const ev = act(b, me, { type: 'ability', id: 'co_hansei', target: foe.id });
  assert.ok(ev.lines.some((l) => l.includes('反省')), ev.lines.join('/'));
  assert.equal(foe.atb, -160);
  assert.ok(foe.hansei && !foe.queued);
  assert.ok(foe.debuffs.atk && foe.debuffs.atk.mult < 1);
  // しばらく 番が こない（ふつうなら すぐ 動く 90 から）
  foe.atb = -160;
  let acted = false;
  for (let i = 0; i < 20; i++) {
    b.advance(100);
    if (b.queue.some((q) => q.id === foe.id)) acted = true;
  }
  assert.equal(acted, false, '2びょうは 動かない');
  // ボスは 止まる 長さが 半分
  const b2 = setup(['cosmic_okan']);
  b2.enemies[0].boss = true;
  b2.enemies[0].atb = 0;
  act(b2, b2.allies[0], { type: 'ability', id: 'co_hansei', target: b2.enemies[0].id });
  assert.equal(b2.enemies[0].atb, -80);
  // 効かない ときも ある
  const b3 = setup(['cosmic_okan'], { chance: false });
  b3.enemies[0].atb = 50;
  const ev3 = act(b3, b3.allies[0], { type: 'ability', id: 'co_hansei', target: b3.enemies[0].id });
  assert.equal(b3.enemies[0].atb, 50);
  assert.ok(ev3.lines.some((l) => l.includes('にげた')), ev3.lines.join('/'));
});

test('第51回 C3: 宇宙一のカミナリは 敵全体に 雷・反省・家族を 回復', () => {
  const b = setup(['cosmic_okan', 'warrior'], { enemies: ['rockman', 'rockman'] });
  const [me, mate] = b.allies;
  mate.hp = 1;
  const ev = act(b, me, { type: 'ability', id: 'cosmic_okan_sig' });
  for (const e of b.enemies) {
    assert.ok(e.hp < e.maxHp, '雷の ダメージ');
    assert.ok(e.atb < 0, '反省');
  }
  assert.ok(mate.hp > 1, '家族を 回復');
  assert.ok(ev.lines.some((l) => l.includes('反省')));
});

// ───────────── 消す・装備の 作りかえ（はかいと創造の神） ─────────────
test('第51回 C3: まっさらに消す は 弱った 敵を 消す（ボス・メタルは 消えない）', () => {
  const b = setup(['chaos_creator']);
  const foe = b.enemies[0];
  foe.maxHp = 100000;
  foe.hp = 20000; // 3わり より 少ない
  const ev = act(b, b.allies[0], { type: 'ability', id: 'cc_kesu', target: foe.id });
  assert.equal(foe.alive, false, ev.lines.join('/'));
  assert.ok(ev.lines.some((l) => l.includes('まっさら')));
  // HPが 多い 敵は 消えない
  const b2 = setup(['chaos_creator']);
  act(b2, b2.allies[0], { type: 'ability', id: 'cc_kesu', target: b2.enemies[0].id });
  assert.equal(b2.enemies[0].alive, true);
  // ボスは 消えない
  const b3 = setup(['chaos_creator']);
  Object.assign(b3.enemies[0], { boss: true, maxHp: 100000, hp: 20000 });
  act(b3, b3.allies[0], { type: 'ability', id: 'cc_kesu', target: b3.enemies[0].id });
  assert.equal(b3.enemies[0].alive, true);
});

test('第51回 C3: 装備つくりかえ は 仲間 1人に 1つ、新しい 装備で 何かの 力が 上がる', () => {
  const b = setup(['chaos_creator', 'warrior', 'priest']);
  const ev = act(b, b.allies[0], { type: 'ability', id: 'cc_tsukurikae' });
  assert.equal(ev.lines.filter((l) => l.includes('作りかえられた')).length, 3, ev.lines.join('/'));
  assert.equal(ev.regear.length, 3);
  for (const a of b.allies) {
    const r = ev.regear.find((x) => x.id === a.id);
    assert.ok(a.buffs[r.stat] && a.buffs[r.stat].mult > 1, `${a.name} ${r.stat}`);
  }
  assert.ok(REGEAR.length >= 4 && new Set(REGEAR.map((g) => g.stat)).size >= 4);
});

// ───────────── 観客（夢のスタジアム鉄道） ─────────────
test('第51回 C3: 観客が ふえるほど 技が 強い・看板の 技で 使いきる', () => {
  const b = setup(['dream_stadium']);
  const me = b.allies[0];
  act(b, me, { type: 'ability', id: 'ds_manin' });
  assert.equal(me.crowd, 1);
  act(b, me, { type: 'ability', id: 'ds_seien' });
  assert.equal(me.crowd, 3);
  for (let i = 0; i < 4; i++) act(b, me, { type: 'ability', id: 'ds_lucky7' });
  assert.equal(me.crowd, CROWD_MAX, '5まで');
  // ダメージ: 観客 1つで ＋10%（看板は 12%）
  const foe = b.enemies[0];
  assert.equal(phantomCDamage(b, me, foe, 1000, { element: 'phys' }, { ability: 'ds_manin' }), 1500);
  assert.equal(phantomCDamage(b, me, foe, 1000, { element: 'phys' }, { ability: 'dream_stadium_sig' }), 1600);
  assert.equal(phantomCDamage(b, me, foe, 1000, { element: 'phys' }, { ability: 'kqp_tokkyu' }), 1000, '観客の ない 技');
  const ev = act(b, me, { type: 'ability', id: 'dream_stadium_sig' });
  assert.equal(me.crowd, 0);
  assert.ok(ev.lines.some((l) => l.includes('10万人')), ev.lines.join('/'));
});

// ───────────── 戦いの 天気（天候の神。shared/battle-weather.js） ─────────────
test('第51回 C3: 天気の しくみ（setWeather・weatherMult・WEATHER_KINDS）', () => {
  assert.deepEqual(Object.keys(WEATHER_KINDS), ['sun', 'rain', 'thunder']);
  const b = {};
  assert.equal(weatherMult(b, 'ally', 'fire'), 1, '天気が なければ 1');
  assert.equal(setWeather(b, 'snow', 3), null, 'しらない 天気');
  setWeather(b, 'sun', 4, 'ally');
  // 晴れ: 味方の 炎・光が 強く、敵の 炎・光（入れかわる）と 水・氷が 弱い
  assert.equal(weatherMult(b, 'ally', 'fire'), WEATHER_UP);
  assert.equal(weatherMult(b, 'ally', 'light'), WEATHER_UP);
  assert.equal(weatherMult(b, 'enemy', 'fire'), WEATHER_DOWN);
  assert.equal(weatherMult(b, 'enemy', 'water'), WEATHER_DOWN);
  assert.equal(weatherMult(b, 'ally', 'water'), 1);
  assert.equal(weatherMult(b, 'ally', 'phys'), 1);
  assert.equal(weatherMult(b, 'ally', 'heal'), 1);
  // 雨: 水と 回復
  setWeather(b, 'rain', 4, 'ally');
  assert.equal(weatherMult(b, 'ally', 'water'), WEATHER_UP);
  assert.equal(weatherMult(b, 'ally', 'heal'), WEATHER_KINDS.rain.heal);
  assert.equal(weatherMult(b, 'enemy', 'heal'), 1);
  assert.equal(weatherMult(b, 'enemy', 'fire'), WEATHER_DOWN);
  // かみなり: 雷。敵が かけた 天気なら 強さが 入れかわる
  setWeather(b, 'thunder', 4, 'enemy');
  assert.equal(weatherMult(b, 'enemy', 'bolt'), WEATHER_UP);
  assert.equal(weatherMult(b, 'ally', 'bolt'), WEATHER_DOWN);
  assert.deepEqual(weatherSnap(b), { kind: 'thunder', side: 'enemy', left: 4 });
  // のこりは かけた 側の 行動で へる
  const ev = { lines: [] };
  weatherTick(b, { side: 'ally' }, ev);
  assert.equal(b.weather.left, 4);
  for (let i = 0; i < 4; i++) weatherTick(b, { side: 'enemy' }, ev);
  assert.equal(b.weather, null);
  assert.ok(ev.lines.some((l) => l.includes('元にもどった')));
  // 天候反転の つぎ: 天気なし → かみなり、相手の 天気は うばう、自分の 天気は 晴れ→雨→かみなり→晴れ
  assert.equal(nextWeather({}, { side: 'ally' }), 'thunder');
  setWeather(b, 'sun', 3, 'enemy');
  assert.equal(nextWeather(b, { side: 'ally' }), 'sun');
  setWeather(b, 'sun', 3, 'ally');
  assert.equal(nextWeather(b, { side: 'ally' }), 'rain');
  setWeather(b, 'thunder', 3, 'ally');
  assert.equal(nextWeather(b, { side: 'ally' }), 'sun');
});

test('第51回 C3: 戦いの 中の 天気（技で かわる・ダメージと 回復に きく・のこりが へる・画面に つたえる）', () => {
  const b = setup(['weather_god', 'priest']);
  const [me, mate] = b.allies;
  const foe = b.enemies[0];
  const ev = act(b, me, { type: 'ability', id: 'wg_hare' });
  assert.equal(b.weather.kind, 'sun');
  assert.equal(b.weather.side, 'ally');
  assert.equal(b.weather.left, 12);
  assert.ok(ev.lines.some((l) => l.includes('晴れわたった')), ev.lines.join('/'));
  assert.deepEqual(b.snapshot().weather, { kind: 'sun', side: 'ally', left: 12 });
  // 味方の 炎は 1.3倍・敵の 水は 0.7倍（damage の 中）
  const hp0 = foe.hp;
  b.damage(me, foe, 100, { lines: [], upd: [] }, { element: 'fire' });
  assert.equal(hp0 - foe.hp, 130);
  const mhp = mate.hp;
  b.damage(foe, mate, 100, { lines: [], upd: [] }, { element: 'water' });
  assert.equal(mhp - mate.hp, 70);
  // 雨: 回復が 強い
  act(b, me, { type: 'ability', id: 'wg_ame' });
  assert.equal(b.weather.kind, 'rain');
  // のこりは 味方の 行動で へる（雨を かけた 行動から）
  const left = b.weather.left;
  act(b, mate, { type: 'defend' });
  assert.equal(b.weather.left, left - 1);
  // 敵の 天気を うばう（天候反転）
  setWeather(b, 'thunder', 5, 'enemy');
  const ev2 = act(b, me, { type: 'ability', id: 'weather_god_sig' });
  assert.equal(b.weather.side, 'ally');
  assert.equal(b.weather.kind, 'thunder');
  assert.ok(ev2.lines.some((l) => l.includes('うばいとった')), ev2.lines.join('/'));
  assert.ok(foe.hp < hp0);
  // つぎの 天候反転は かみなり → 晴れ
  act(b, me, { type: 'ability', id: 'weather_god_sig' });
  assert.equal(b.weather.kind, 'sun');
});

test('第51回 C3: 雨の 天気で 回復が 1.25倍', () => {
  const heal = (weather) => {
    const b = setup(['priest']);
    const me = b.allies[0];
    if (weather) setWeather(b, weather, 5, 'ally');
    me.hp = 1;
    b.rng.int = (a) => a;
    b.heal(me, me, { base: [100, 100], fixed: true }, { lines: [], upd: [] }, 1);
    return me.hp - 1;
  };
  assert.equal(heal(null), 100);
  assert.equal(heal('rain'), 125);
  assert.equal(heal('sun'), 100);
});

// ───────────── オートと 戦い ぜんたい ─────────────
test('第51回 C3: オートでも 4つの 職業で 戦える（エラー なし）', () => {
  for (const id of IDS) {
    const rng = makeRng(5);
    const chars = [hero('a', id), hero('b', 'priest')];
    const b = new Battle({ rng, allies: chars.map((c) => ({ char: c, controller: null, auto: true })), enemies: ['rockman', 'rockman'], canFlee: true });
    for (const a of b.allies) a.abilities = [...new Set([...a.abilities, ...JOBS[a.job].learn.map(([, x]) => x)])];
    const me = b.allies[0];
    const cmd = decideAlly(b, me);
    assert.ok(cmd && cmd.type, id);
    for (let i = 0; i < 400 && !b.over; i++) b.tick(100);
    assert.ok(b.events !== undefined);
  }
});
