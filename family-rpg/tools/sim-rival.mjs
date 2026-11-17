// 第88回 G3班: まぼろしの回廊の「ライバルの まぼろし」の 強さを 見る（docs/plan-r88-anime-gear.md の 7-1）
// つかいかた: node tools/sim-rival.mjs [回数] [ライバルの id,…]   LOG=1 … 1回だけ ようすを 出す（KNOW=1 … 知っている 人）
//   パーティー: その だんの レベルの 家族 4人（勇者・大賢者・ゴッドハンド・大神官。職業Lv10・店の いちばん よい 装備〈Lv60 は ランク9・Lv80 から ランク10〉）
//   完全オート … ふつうの オート（大技の 前ぶれでも、HPが 6わりより 少ない 人が ときどき 身を 守る だけ）
//   知っている … 大技の 前ぶれを 見たら、みんな 身を 守る（ほかは ふつうの オート）
//   めやす: 完全オートは 3わり いか・知っていれば 7〜8わり
//   TUNE=1 … tune.hp を さがす（知っている の 勝ちが 75% に 近く なる 倍率。完全オートも 出す）
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { fullHeal } from '../public/js/shared/stats.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { RIVALS, RIVAL_BY_ID, rivalEnc, rivalTier } from '../public/js/shared/data/rivals-r88.js';
import { setupRivalPhantom } from '../public/js/shared/battle-rival-r88.js';
import { jobChar } from './sim-jobs.mjs';

const N = Number(process.argv[2] || 20);
const ONLY = process.argv[3] ? process.argv[3].split(',') : null;
export const RIVAL_PARTY_JOBS = [['hero', 'ゆうしゃ'], ['daikenja', 'けんじゃ'], ['god_hand', 'かくとう'], ['high_priest', 'しんかん']];
// だんの パーティーの レベル（ライバルの レベル）と 店の 装備の ランク
export const partyRank = (lv) => (lv >= 75 ? 10 : 9);
export function rivalParty(lv) {
  return RIVAL_PARTY_JOBS.map(([job, name]) => {
    const c = jobChar(job, lv, partyRank(lv), name);
    fullHeal(c);
    return c;
  });
}

// 1回 戦う。know … 知っている 人 / over … tune の うわがき
export function rivalFight(id, seed, { know = false, log = false, lv = null, over = null } = {}) {
  const rv0 = RIVAL_BY_ID[id];
  const rv = over ? { ...rv0, tune: { ...(rv0.tune || {}), ...over } } : rv0;
  const party = rivalParty(lv || rv.lv);
  const enc = FIXED_ENCOUNTERS[rivalEnc(id)];
  const b = new Battle({
    rng: makeRng(seed), boss: true, canFlee: false,
    allies: party.map((c) => ({ char: c, kind: 'support', controller: 'sim', auto: !know, tactics: 'balanced' })),
    enemies: enc.group.flatMap(([sp, k]) => Array(k).fill(sp)),
  });
  setupRivalPhantom(b, rv);
  let real = 0;
  let sig = 0, sigDmg = 0, sigKills = 0;
  while (!b.over && real < 30 * 60 * 1000) {
    const evs = b.tick(50);
    real += 50;
    for (const ev of evs) {
      if (log && (ev.t === 'act' || ev.t === 'msg')) console.log('  ' + [...(ev.lines || []), ...(ev.postLines || [])].join(' / '));
      if (ev.t === 'act' && ev.ability && /^r88r_/.test(ev.ability) && !/_c$/.test(ev.ability)) {
        sig++;
        for (const r of ev.results || []) sigDmg += r.dmg || 0;
        sigKills += (ev.lines || []).filter((l) => /死んでしまった|たおれた/.test(l)).length;
      }
    }
    if (!know) continue;
    const warned = b.aliveEnemies().some((e) => e.telegraph);
    for (const a of b.allies) {
      if (!a.ready || !a.alive) continue;
      a.ready = false;
      b.enqueue(a, warned ? { type: 'defend' } : { type: 'ai' });
    }
  }
  const al = b.allies;
  return {
    outcome: b.result?.outcome || 'timeout', seconds: Math.round(real / 1000), deaths: al.filter((x) => !x.alive).length,
    hpLeft: al.reduce((s, x) => s + Math.max(0, x.hp), 0) / al.reduce((s, x) => s + x.maxHp, 0),
    left: b.enemies.reduce((s, e) => s + Math.max(0, e.hp), 0) / b.enemies.reduce((s, e) => s + e.maxHp, 0),
    sig, sigDmg, sigKills, maxHp: al.reduce((s, x) => s + x.maxHp, 0) / al.length,
  };
}

const pct = (x) => `${String(Math.round(x * 100)).padStart(3)}%`;
export function rivalRate(id, n, opts = {}) {
  const res = [];
  for (let i = 0; i < n; i++) res.push(rivalFight(id, 8800 + i * 7919, opts));
  const avg = (k) => res.reduce((s, r) => s + r[k], 0) / n;
  return { rate: res.filter((r) => r.outcome === 'win').length / n, res, avg };
}

if (process.argv[1] && process.argv[1].endsWith('sim-rival.mjs')) {
  const ids = ONLY || RIVALS.map((r) => r.id);
  if (process.env.LOG) {
    console.log(rivalFight(ids[0], Number(process.env.SEED || 1), { know: !!process.env.KNOW, log: true }));
  } else if (process.env.TUNE) {
    // tune.hp を 2ぶんの さがし方で（知っている の 勝ちが WANT〈75%〉）。DMG … tune.dmg（ふつうの 攻撃の 強さ）
    const want = Number(process.env.WANT || 0.75);
    const dmg = process.env.DMG ? Number(process.env.DMG) : null;
    for (const id of ids) {
      const rv = RIVAL_BY_ID[id];
      const d = dmg ?? rv.tune?.dmg ?? 1;
      let lo = 0.15, hi = 3;
      for (let k = 0; k < 7; k++) {
        const mid = (lo + hi) / 2;
        const w = rivalRate(id, N, { know: true, over: { hp: mid, dmg: d } }).rate;
        if (w > want) lo = mid;
        else hi = mid;
      }
      const hp = Math.round(((lo + hi) / 2) * 100) / 100;
      const a = rivalRate(id, N, { over: { hp, dmg: d } });
      const k = rivalRate(id, N, { know: true, over: { hp, dmg: d } });
      console.log(`${id} ${rv.name}: tune { hp: ${hp}, dmg: ${d} } 完全オート ${pct(a.rate)}（${a.avg('seconds').toFixed(0)}秒）  知っている ${pct(k.rate)}（${k.avg('seconds').toFixed(0)}秒）`);
    }
  } else {
    console.log(`■ まぼろしの回廊（家族 4人・その だんの レベル・店の 装備・${N}回）`);
    for (const id of ids) {
      const rv = RIVAL_BY_ID[id];
      const a = rivalRate(id, N);
      const k = rivalRate(id, N, { know: true });
      const sigLine = (s) => `大技で たおれた${(s.avg('sigKills') / Math.max(0.01, s.avg('sig'))).toFixed(1)}人`;
      console.log(`  ${rv.name.padEnd(10, '　')} Lv${rv.lv}（だん${rivalTier(rv.lv)}）  完全オート ${pct(a.rate)}（${a.avg('seconds').toFixed(0)}秒・${sigLine(a)}）  知っている ${pct(k.rate)}（${k.avg('seconds').toFixed(0)}秒・${sigLine(k)}）`);
    }
  }
}
