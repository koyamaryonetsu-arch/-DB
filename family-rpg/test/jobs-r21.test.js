// 2026年10月（第21回）の 新しい 職業
//  ニート → 中二病 → ダ天使、サイヤ人 → スーパーサイヤ人 → スーパーサイヤ人2 → スーパーサイヤ人3（伝説）、
//  会社員 → 設備屋 → ryonetsu、海賊 → ゴム人間 → ニカ（伝説）、ユーチューバー → 人気配信者、ゲーマー → プロゲーマー、魔王（伝説）
//  新しい こうか: 魔力の 補助（buff の stat: 'mag'）・自分たちも 少し ダメージ（hurt。炎上）・職業の たいせい（ゴムは 雷が 効かない）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  JOBS, JOB_ORDER, ADVANCED_ORDER, SUPER_ORDER, LEGEND_ORDER, ALL_JOBS, JOB_MAX_LEVEL, JOB_HINTS, jobReqText,
} from '../public/js/shared/data/jobs.js';
import { ABILITIES, abilityRole } from '../public/js/shared/data/abilities.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { SHOPS } from '../public/js/shared/data/shops.js';
import { newCharacter, changeJob, jobUnlocked, jobKnown, gainExp, expForLevel, fullHeal, learnedAbilities, computeStats, jobTrainRate } from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { checkText } from '../tools/kanji-check.mjs';

const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
const NEW = ['neet', 'chuuni', 'datenshi', 'saiyan', 'super_saiyan', 'ss2', 'ss3', 'setsubiya', 'ryonetsu', 'rubber', 'nika', 'youtuber', 'streamer', 'gamer', 'pro_gamer', 'maou'];
const NEW_ITEMS = ['pillow', 'selfie_stick', 'game_controller', 'battle_suit', 'chuuni_bokken', 'monkey_wrench', 'gaming_keyboard', 'gold_button', 'straw_hat', 'pipe_wrench', 'dark_feather_staff'];
const tierOf = (j) => JOBS[j].tier || 0;

// その 職業の キャラ（敵は なにも しない）。opts.lucky … 確率の こうかが かならず 決まる
function setup(job, enemies = ['rockman'], { lucky = false, seed = 1, prep } = {}) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job: 'warrior' });
  gainExp(c, expForLevel(40));
  master(c, job);
  c.job = job;
  if (prep) prep(c);
  fullHeal(c);
  const mate = newCharacter({ id: 'm1', name: 'なかま', job: 'priest' });
  gainExp(mate, expForLevel(30));
  fullHeal(mate);
  const rng = makeRng(seed);
  if (lucky) rng.chance = () => true;
  const b = new Battle({ rng, allies: [{ char: c, controller: 's1' }, { char: mate, auto: true, kind: 'support' }], enemies, canFlee: true });
  for (const e of b.enemies) e.actions = [{ w: 1, id: 'm_nothing' }];
  return { b, c, me: b.allies[0], mate: b.allies[1] };
}
const use = (b, actor, id, target, pow = 1) => {
  const ev = { lines: [], upd: [] };
  b.applyAbility(actor, ABILITIES[id], { target }, ev, pow);
  return ev;
};
// なるための 職業を ぜんぶ マスター（ずっと 前の 職業まで）
const masterChain = (c, jid) => {
  for (const r of JOBS[jid].req || []) { master(c, r); masterChain(c, r); }
};

test('第21回の 職業: ならびと なる じょうけん', () => {
  for (const j of ['neet', 'saiyan', 'youtuber', 'gamer']) assert.ok(JOB_ORDER.includes(j), `${j} は 基本職`);
  for (const j of ['chuuni', 'super_saiyan', 'setsubiya', 'streamer', 'pro_gamer']) assert.ok(ADVANCED_ORDER.includes(j), `${j} は 上級職`);
  for (const j of ['datenshi', 'ss2', 'ryonetsu', 'rubber']) assert.ok(SUPER_ORDER.includes(j), `${j} は 超級職`);
  for (const j of ['ss3', 'nika', 'maou']) assert.ok(LEGEND_ORDER.includes(j), `${j} は 伝説の職業`);
  assert.deepEqual(JOBS.chuuni.req, ['neet']);
  assert.deepEqual(JOBS.datenshi.req, ['chuuni']);
  assert.deepEqual(JOBS.super_saiyan.req, ['saiyan']);
  assert.deepEqual(JOBS.ss2.req, ['super_saiyan']);
  assert.deepEqual(JOBS.ss3.req, ['ss2']);
  assert.deepEqual(JOBS.setsubiya.req, ['salaryman']);
  assert.deepEqual(JOBS.ryonetsu.req, ['setsubiya']);
  assert.deepEqual(JOBS.rubber.req, ['pirate']);
  assert.deepEqual(JOBS.nika.req, ['rubber']);
  assert.deepEqual(JOBS.streamer.req, ['youtuber']);
  assert.deepEqual(JOBS.pro_gamer.req, ['gamer']);
  assert.deepEqual(JOBS.maou.req, ['hero', 'datenshi']);
  assert.equal(JOBS.ryonetsu.name, 'ryonetsu');
  assert.equal(JOBS.datenshi.name, 'ダ天使');
  assert.match(jobReqText('ss3'), /スーパーサイヤ人2Lv10＋ほかの超級職1つLv10/);
  assert.match(jobReqText('nika'), /ゴム人間Lv10＋ほかの超級職1つLv10/);
  for (const j of [...SUPER_ORDER, ...LEGEND_ORDER]) assert.ok(JOB_HINTS[j], `${j} の うわさ`);

  // サイヤ人の 道: スーパーサイヤ人3は スーパーサイヤ人2 と ほかの 超級職 1つ
  const c = newCharacter({ id: 'a', name: 'ゴク', job: 'saiyan' });
  assert.equal(c.job, 'saiyan', '基本職なので はじめから えらべる');
  master(c, 'saiyan');
  assert.equal(jobUnlocked(c, 'super_saiyan'), true);
  master(c, 'super_saiyan');
  assert.equal(jobKnown(c, 'ss2'), true, 'スーパーサイヤ人を きわめると ヒント');
  master(c, 'ss2');
  assert.equal(jobKnown(c, 'ss3'), true);
  assert.equal(jobUnlocked(c, 'ss3'), false, 'スーパーサイヤ人2 だけでは まだ');
  master(c, 'god_hand');
  assert.equal(jobUnlocked(c, 'ss3'), true, 'ほかの 超級職 1つで なれる');
  assert.equal(changeJob(c, 'ss3').ok, true);
  // ニカ: ゴム人間 と ほかの 超級職 1つ
  const d = newCharacter({ id: 'b', name: 'ルフィ', job: 'warrior' });
  master(d, 'pirate');
  assert.equal(jobUnlocked(d, 'rubber'), true, '海賊を きわめると ゴム人間');
  master(d, 'rubber');
  assert.equal(jobUnlocked(d, 'nika'), false);
  master(d, 'ryonetsu');
  assert.equal(jobUnlocked(d, 'nika'), true);
  // 魔王: 勇者 と ダ天使
  const m = newCharacter({ id: 'm', name: 'まおう', job: 'warrior' });
  master(m, 'hero');
  assert.equal(jobUnlocked(m, 'maou'), false);
  master(m, 'datenshi');
  assert.equal(jobUnlocked(m, 'maou'), true);
  // ryonetsu: 会社員 → 設備屋 → ryonetsu
  const r = newCharacter({ id: 'r', name: 'こやま', job: 'salaryman' });
  master(r, 'salaryman');
  assert.equal(jobUnlocked(r, 'setsubiya'), true);
  master(r, 'setsubiya');
  assert.equal(jobUnlocked(r, 'ryonetsu'), true);
});

test('第21回の 職業: はじめの 装備・ニートは 職業レベルが 上がりやすい', () => {
  assert.equal(newCharacter({ id: 'a', name: 'a', job: 'neet' }).equip.weapon, 'pillow');
  assert.equal(newCharacter({ id: 'b', name: 'b', job: 'youtuber' }).equip.weapon, 'selfie_stick');
  assert.equal(newCharacter({ id: 'c', name: 'c', job: 'gamer' }).equip.weapon, 'game_controller');
  const s = newCharacter({ id: 'd', name: 'd', job: 'saiyan' });
  assert.equal(s.equip.weapon, null, 'サイヤ人は 素手');
  assert.equal(s.equip.armor, 'battle_suit', 'サイヤ人の 戦闘服');
  assert.ok(jobTrainRate('neet') > jobTrainRate('schoolkid'), 'ニートは 小学生より 上がりやすい');
  assert.ok(jobTrainRate('neet') > 1);
});

test('第21回の 職業: 技の 数・ねらい・文字・強さの かたむき・道具', () => {
  const SCOPE = {
    enemy: /敵1体/, group: /同じ種類の敵/, enemies: /敵全体|敵に(ランダム|3回)|敵にランダム/, ally: /仲間1人/, allies: /仲間全員/, self: /自分|仲間全員への|起こる|運しだい/, deadAlly: /仲間1人/,
  };
  const sum = (j) => Object.values(JOBS[j].mods).reduce((a, b) => a + b, 0);
  const OLD = ALL_JOBS.filter((o) => !NEW.includes(o));
  for (const j of NEW) {
    const job = JOBS[j];
    for (const s of [job.name, job.desc, JOB_HINTS[j] || '']) assert.deepEqual(checkText(s), [], `${j}: ${s}`);
    assert.ok(job.weapons.length >= 2 && job.armor.includes('cloth'), j);
    const lvs = job.learn.map(([l]) => l);
    assert.deepEqual(lvs, [...lvs].sort((a, b) => a - b), `${j}: レベルの じゅん`);
    assert.equal(lvs[0], 1);
    assert.equal(lvs[lvs.length - 1], 10);
    const mps = job.learn.map(([, id]) => ABILITIES[id].mp);
    assert.equal(Math.max(...mps), mps[mps.length - 1], `${j}: Lv10 の 技が いちばん MPを 使う`);
    const atk = job.learn.filter(([, id]) => abilityRole(ABILITIES[id]) === 'dmg').length;
    assert.ok(atk >= (tierOf(j) === 0 ? 3 : 2), `${j}: 攻撃技 ${atk}こ`);
    for (const [, id] of job.learn) {
      const a = ABILITIES[id];
      assert.ok(a, `${j}: ${id}`);
      assert.equal(a.job, j, `${id} の job`);
      assert.ok(a.desc && a.cast && a.anim && a.kana, `${id} の 文`);
      assert.match(a.desc, SCOPE[a.target], `${id}（${a.target}）の せつめい: ${a.desc}`);
      for (const s of [a.name, a.desc, a.cast]) assert.deepEqual(checkText(s), [], `${id}: ${s}`);
      assert.deepEqual(checkText(a.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
      if (a.effect.type === 'random') {
        for (const o of a.effect.options) {
          assert.ok(ABILITIES[o]?.hidden, o);
          assert.ok(!ABILITIES[o].cast.includes('{t}'), o);
          assert.deepEqual(checkText(ABILITIES[o].cast), [], o);
        }
      }
    }
    // つよさの 倍率の 合計は 同じ ランクの ほかの 職業の はんい（伝説の職業は 超級職より 上）
    if (tierOf(j) < 3) {
      const same = OLD.filter((o) => tierOf(o) === tierOf(j)).map(sum);
      assert.ok(sum(j) >= Math.min(...same) - 1e-9 && sum(j) <= Math.max(...same) + 1e-9, `${j}: 倍率の 合計 ${sum(j).toFixed(2)}`);
    } else {
      const sup = OLD.filter((o) => tierOf(o) === 2).map(sum);
      assert.ok(sum(j) > Math.max(...sup), `${j}: 伝説の職業は 超級職より 強い`);
    }
  }
  // 新しい 道具: お店で 買える・きたえられる・文字
  const sold = new Set(Object.values(SHOPS).flatMap((s) => [...(s.items || []), ...(s.more || []).flatMap((m) => m.items)]));
  for (const id of NEW_ITEMS) {
    const it = ITEMS[id];
    assert.ok(it, id);
    assert.ok(sold.has(id), `${id} は お店で 買える`);
    if (it.type === 'weapon') assert.ok(ITEMS[`${id}+1`], `${id} は きたえられる`);
    for (const s of [it.name, it.desc]) assert.deepEqual(checkText(s), [], `${id}: ${s}`);
  }
});

test('新しい こうか: 魔力の 補助は 呪文の ダメージを 上げる', () => {
  const { b, me } = setup('chuuni', ['rockman']);
  const e = b.enemies[0];
  const before = b.calcMagic(me, e, ABILITIES.cu_kokuen.effect, 1, true).dmg;
  use(b, me, 'cu_wagana');
  assert.ok(me.buffs.mag && me.buffs.mag.mult > 1, '魔力が 上がった');
  const after = b.calcMagic(me, e, ABILITIES.cu_kokuen.effect, 1, true).dmg;
  assert.ok(after > before, `呪文が 強く なる ${before} → ${after}`);
  const ev = use(b, me, 'cu_wagana');
  assert.ok(ev.lines.some((l) => l.includes('魔力')), ev.lines.join(' / '));
});

test('新しい こうか: 炎上は 仲間も 少し やけど（HPは 1より へらない）', () => {
  const { b, me, mate } = setup('youtuber', ['rockman', 'rockman']);
  mate.hp = 3;
  const hp0 = b.enemies.map((e) => e.hp);
  const ev = use(b, me, 'yt_enjou');
  assert.ok(b.enemies.some((e, i) => e.hp < hp0[i]), '敵に ダメージ');
  assert.ok(mate.hp >= 1 && mate.hp <= 3, `仲間は たおれない ${mate.hp}`);
  assert.ok(mate.alive);
  assert.ok(ev.lines.some((l) => l.includes('やけど')), ev.lines.join(' / '));
  // 何回 やっても たおれない
  for (let i = 0; i < 10; i++) use(b, me, 'yt_enjou');
  assert.ok(me.alive && mate.alive && me.hp >= 1 && mate.hp >= 1);
});

test('新しい こうか: ゴム人間・ニカは 雷が 効かない', () => {
  const c = newCharacter({ id: 'g', name: 'ゴム', job: 'warrior' });
  master(c, 'rubber');
  c.job = 'rubber';
  assert.equal(computeStats(c).resist.bolt, 0, 'ゴム人間');
  c.job = 'nika';
  assert.equal(computeStats(c).resist.bolt, 0, 'ニカ');
  c.job = 'warrior';
  assert.ok((computeStats(c).resist.bolt ?? 1) > 0, '戦士は ふつう');
});

test('新しい こうか: 元気玉は 仲間の MPを 集める。オートでは 使わない', () => {
  const { b, me, mate } = setup('ss3', ['rockman', 'rockman']);
  const mp0 = mate.mp;
  const hp0 = b.enemies.map((e) => e.hp);
  const ev = use(b, me, 's3_genki', b.enemies[0].id);
  assert.ok(mate.mp < mp0, '仲間の MPが へった');
  assert.ok(b.enemies.every((e, i) => e.hp < hp0[i]), '敵全体に ダメージ');
  assert.ok(ev.lines.some((l) => l.includes('仲間1人の力が集まった')), ev.lines.join(' / '));
  assert.ok(ABILITIES.s3_genki.noAuto);
  me.abilities = ['s3_genki', 's3_ryuuken'];
  me.mp = 999;
  for (let i = 0; i < 30; i++) assert.notEqual(decideAlly(b, me).id, 's3_genki');
});

test('運しだいの 技: 明日から本気出す（本気か、やっぱり明日）', () => {
  let charged = 0, nothing = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const { b, me } = setup('neet', ['rockman'], { seed });
    me.charge = 1;
    const ev = use(b, me, 'ne_honki');
    if (me.charge > 1) charged++;
    else if (ev.lines.some((l) => l.includes('明日からにしよう'))) nothing++;
  }
  assert.ok(charged > 5 && nothing > 5, `本気 ${charged}・明日 ${nothing}`);
});

test('第21回の 職業の 技は ぜんぶ たたかいで 使える', () => {
  let used = 0;
  for (const jid of NEW) {
    const prep = (c) => {
      masterChain(c, jid);
      if (JOBS[jid].reqSuper) master(c, 'god_hand');
    };
    for (const [, aid] of JOBS[jid].learn) {
      const { b, c, me, mate } = setup(jid, ['rockman', 'rockman', 'skeleton'], { seed: used + 1, prep });
      assert.ok(jobUnlocked(c, jid), `${jid} に なれる`);
      assert.ok(learnedAbilities(c).includes(aid), `${jid}: ${aid} を 覚えている`);
      for (let i = 0; i < 600 && !me.ready; i++) b.tick(50);
      const a = ABILITIES[aid];
      if (a.target === 'deadAlly') { mate.alive = false; mate.hp = 0; }
      const target = ['ally', 'deadAlly'].includes(a.target) ? mate.id : b.enemies[0].id;
      const r = b.command(me.id, { type: 'ability', id: aid, target }, 's1');
      assert.equal(r.ok, true, `${jid}: ${aid} ${r.reason || ''}`);
      const evs = [];
      for (let i = 0; i < 200 && !evs.some((e) => e.t === 'act' && e.id === me.id); i++) evs.push(...b.tick(50));
      assert.ok(evs.some((e) => e.t === 'act' && e.id === me.id), `${aid} が じっこう された`);
      used++;
    }
  }
  assert.ok(used >= 100, `使った 技 ${used}`);
});
