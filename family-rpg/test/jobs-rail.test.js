// 鉄道の 職業（鉄道員 → 運転士 → 京急の運転士）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JOBS, ADVANCED_ORDER, SUPER_ORDER, JOB_MAX_LEVEL, JOB_HINTS, jobBattlesForLevel, jobReqText } from '../public/js/shared/data/jobs.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { dualOptions } from '../public/js/shared/data/dual.js';
import { newCharacter, changeJob, jobUnlocked, jobKnown, gainJobBattles, gainExp, expForLevel, fullHeal, weaponOk, canEquip } from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { paintHero } from '../public/js/client/render/hero.js';
import { checkText } from '../tools/kanji-check.mjs';

const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
const RAIL = ['train_driver', 'keikyu_driver'];
const DIRS = ['down', 'left', 'up', 'right'];

function setup(job, enemies, { seed = 1 } = {}) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job: 'railman' });
  gainExp(c, expForLevel(30));
  master(c, job);
  c.job = job;
  c.equip.weapon = null;
  fullHeal(c);
  const mate = newCharacter({ id: 'm1', name: 'なかま', job: 'priest' });
  gainExp(mate, expForLevel(20));
  fullHeal(mate);
  const b = new Battle({ rng: makeRng(seed), allies: [{ char: c, controller: 's1' }, { char: mate, auto: true, kind: 'support' }], enemies, canFlee: true });
  for (const e of b.enemies) e.actions = [{ w: 1, id: 'm_nothing' }];
  return { b, c };
}
function act(b, cmd) {
  const a = b.allies[0];
  for (let i = 0; i < 600 && !a.ready; i++) b.tick(50);
  const r = b.command(a.id, cmd, 's1');
  assert.equal(r.ok, true, r.reason);
  const evs = [];
  for (let i = 0; i < 200 && !evs.some((e) => e.t === 'act' && e.id === a.id); i++) evs.push(...b.tick(50));
  const ev = evs.find((e) => e.t === 'act' && e.id === a.id);
  assert.ok(ev, 'わざが じっこう された');
  return ev;
}

test('鉄道の 職業: 鉄道員 → 運転士（上級職） → 京急の運転士（超級職）', () => {
  assert.equal(JOBS.train_driver.name, '運転士');
  assert.equal(JOBS.keikyu_driver.name, '京急の運転士');
  assert.equal(JOBS.train_driver.tier, 1);
  assert.equal(JOBS.keikyu_driver.tier, 2);
  assert.deepEqual(JOBS.train_driver.req, ['railman']);
  assert.deepEqual(JOBS.keikyu_driver.req, ['train_driver']);
  assert.ok(ADVANCED_ORDER.includes('train_driver'));
  assert.ok(SUPER_ORDER.includes('keikyu_driver'));
  assert.ok(JOB_HINTS.keikyu_driver, '神殿の うわさ');
  assert.ok(!JOB_HINTS.keikyu_driver.includes('京急'), 'うわさでは 名前を 出さない');
  assert.equal(jobReqText('train_driver'), '鉄道員Lv10');
  assert.equal(jobReqText('keikyu_driver'), '運転士Lv10');

  const c = newCharacter({ id: 'r', name: 'テツ', job: 'railman' });
  assert.equal(jobUnlocked(c, 'train_driver'), false);
  assert.equal(jobKnown(c, 'keikyu_driver'), false, '京急の運転士は はじめは ひみつ');
  c.jobs.railman = { lv: 9, b: jobBattlesForLevel(10, 0) - 1 };
  const ups = gainJobBattles(c, 1);
  assert.ok(ups[0].unlocked.includes('train_driver'), '鉄道員を マスターすると 運転士');
  assert.equal(changeJob(c, 'keikyu_driver').locked, true, 'まだ 京急の運転士には なれない');
  assert.equal(changeJob(c, 'train_driver').ok, true);
  c.jobs.train_driver = { lv: 9, b: jobBattlesForLevel(10, 1) - 1 };
  const up2 = gainJobBattles(c, 1);
  assert.ok(up2[0].unlocked.includes('keikyu_driver'), '運転士を マスターすると 京急の運転士');
  assert.equal(jobKnown(c, 'keikyu_driver'), true);
  assert.equal(changeJob(c, 'keikyu_driver').ok, true);
  assert.equal(c.job, 'keikyu_driver');
  assert.ok(canEquip('keikyu_driver', 'signal_flag'), '手旗を そうびできる');
});

test('鉄道の 職業: 技の 数・強さ・文字が ほかの 職業と そろっている', () => {
  const sum = (j) => Object.values(JOBS[j].mods).reduce((a, b) => a + b, 0);
  for (const j of RAIL) {
    const job = JOBS[j];
    const lvs = job.learn.map(([l]) => l);
    for (const l of [1, 3, 5, 7, 10]) assert.ok(lvs.includes(l), `${j}: Lv${l} の 技`);
    const mps = job.learn.map(([, id]) => ABILITIES[id].mp);
    assert.equal(Math.max(...mps), mps[mps.length - 1], `${j}: Lv10 の 技が いちばん 大きい`);
    const same = Object.keys(JOBS).filter((o) => !RAIL.includes(o) && (JOBS[o].tier || 0) === job.tier).map(sum);
    assert.ok(sum(j) >= Math.min(...same) - 1e-9 && sum(j) <= Math.max(...same) + 1e-9, `${j}: 倍率の 合計 ${sum(j).toFixed(2)}`);
    assert.ok(sum(j) > sum(job.req[0]), `${j} は もとの 職業より 強い`);
    for (const s of [job.name, job.desc, JOB_HINTS[j] || '']) assert.deepEqual(checkText(s), [], `${j}: ${s}`);
    for (const [, id] of job.learn) {
      const a = ABILITIES[id];
      assert.ok(a, id);
      assert.equal(a.job, j, `${id} の job`);
      assert.ok(a.anim && a.kana && a.cast, id);
      for (const s of [a.name, a.desc, a.cast]) assert.deepEqual(checkText(s), [], `${id}: ${s}`);
      assert.deepEqual(checkText(a.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
    }
  }
  // 超級職の 大技は ほかの 超級職の Lv10 と おなじ くらいの MP
  const superMp = SUPER_ORDER.filter((j) => j !== 'keikyu_driver').map((j) => ABILITIES[JOBS[j].learn[JOBS[j].learn.length - 1][1]].mp);
  const mp = ABILITIES.kq_kaitoku.mp;
  assert.ok(mp >= Math.min(...superMp) && mp <= Math.max(...superMp), `京急 Lv10 MP ${mp}`);
});

test('鉄道の 職業: たたかいでの 効き目（警笛・がんじょうな先頭車・ダイヤ回復・赤い快特）', () => {
  // 警笛: 敵全体の 素早さが 下がる
  let { b } = setup('train_driver', ['rockman', 'skeleton'], { seed: 3 });
  b.rng.chance = () => true;
  let ev = act(b, { type: 'ability', id: 'dv_kiteki' });
  assert.ok(b.enemies.every((e) => e.debuffs.agi), ev.lines.join(' / '));
  // がんじょうな先頭車: 仲間全員を かばう
  ({ b } = setup('keikyu_driver', ['rockman']));
  ev = act(b, { type: 'ability', id: 'kq_sentou' });
  assert.equal(b.allies[0].cover?.target, 'all');
  assert.ok(b.allies[0].buffs.def, '守備力も 上がる');
  // ダイヤ回復: 仲間全員の ゲージが たまる
  ({ b } = setup('keikyu_driver', ['rockman']));
  b.allies[1].atb = 0;
  ev = act(b, { type: 'ability', id: 'kq_daiya' });
  assert.ok(b.allies[1].atb >= 50 || b.allies[1].ready, `なかまの ゲージ ${b.allies[1].atb}`);
  assert.ok(ev.lines.some((l) => l.includes('おくれを取りもどした')));
  // 赤い快特: 敵全体に ダメージ
  ({ b } = setup('keikyu_driver', ['rockman', 'skeleton']));
  for (const e of b.enemies) e.hp = e.maxHp = 99999;
  act(b, { type: 'ability', id: 'kq_kaitoku' });
  assert.ok(b.enemies.every((e) => e.hp < 99999), '敵全体に あたった');
});

test('鉄道の 職業: 連携技に まざる（鉄道員の技・守りの技・歌）', () => {
  const ids = (opts) => opts.map((o) => o.id);
  const driver = { id: 'a', name: '運転士', alive: true, abilities: ['dv_tsuuka'], mp: 30, ready: true, statuses: [], weaponCat: 'fan' };
  const papa = { id: 'b', name: 'パパ', alive: true, abilities: ['sm_meishi'], mp: 30, ready: true, statuses: [], weaponCat: 'dagger' };
  assert.ok(ids(dualOptions(driver, [papa], weaponOk)).includes('dt_tsukin_rush'), '通勤ラッシュ');
});

test('鉄道の 職業: 主人公の え（白い 手ぶくろ・京急は 赤い ぼうしの おび。はみ出さず、それぞれ ちがう）', () => {
  for (const job of RAIL) {
    for (const body of [0, 1]) {
      for (const dir of DIRS) {
        for (const res of [4, 8]) {
          const img = paintHero({ body, style: 'short', hcol: 'black' }, job, undefined, dir, 1, res);
          let n = 0, edge = false;
          for (let y = 0; y < img.h; y++) {
            for (let x = 0; x < img.w; x++) {
              if (img.rgba[(y * img.w + x) * 4 + 3] === 0) continue;
              n++;
              if (y === 0 || x === 0 || x === img.w - 1) edge = true;
            }
          }
          assert.ok(n > img.w * img.h * 0.12, `${job} ${body} ${dir} res${res} が かけている`);
          assert.ok(!edge, `${job} ${body} ${dir} res${res} が ふちに さわる`);
        }
      }
    }
  }
  const key = (job, dir) => Buffer.from(paintHero({ body: 0, style: 'short' }, job, undefined, dir, 0, 4).rgba).toString('base64');
  for (const dir of DIRS) {
    const seen = new Set(['railman', 'police', ...RAIL].map((j) => key(j, dir)));
    assert.equal(seen.size, 4, `${dir}: 鉄道員・警察官・運転士・京急の運転士が みんな ちがう え`);
  }
});
